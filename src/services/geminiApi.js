import { supabase } from './supabase';

/** Utility: menunggu sejumlah milidetik sebelum melanjutkan eksekusi. */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Pesan error dalam Bahasa Indonesia untuk setiap kode status HTTP.
 * Dipusatkan di sini agar mudah diperbarui.
 */
const ERROR_MESSAGES = {
  429: 'Server AI sedang sangat sibuk saat ini. Silakan coba lagi dalam beberapa menit.',
  404: 'Fungsi backend tidak ditemukan. Pastikan Edge Function analyze-disease sudah di-deploy.',
  403: 'Akses ke layanan AI ditolak. Periksa konfigurasi API Key di server.',
  500: 'Server AI sedang mengalami gangguan. Silakan coba model lain atau coba lagi nanti.',
  503: 'Server AI sedang mengalami gangguan. Silakan coba model lain atau coba lagi nanti.',
  highDemand: 'Server AI sedang ramai digunakan. Silakan coba lagi sebentar lagi.',
  timeout: 'Koneksi ke server AI terlalu lama (timeout). Periksa jaringan internet Anda.',
  network: 'Tidak dapat terhubung ke server AI. Periksa koneksi internet Anda.',
  default: 'Gagal menganalisis masalah tanaman. Periksa koneksi internet atau coba beberapa saat lagi.',
};

/**
 * Menentukan pesan error yang sesuai berdasarkan status code dan pesan dari server.
 *
 * @param {number|undefined} statusCode
 * @param {string} serverMessage
 * @returns {string} Pesan error dalam Bahasa Indonesia.
 */
function resolveErrorMessage(statusCode, serverMessage) {
  if (statusCode === 429) return ERROR_MESSAGES[429];
  if (statusCode === 404) return ERROR_MESSAGES[404];
  if (statusCode === 403) return ERROR_MESSAGES[403];
  if (statusCode === 500 || statusCode === 503) return ERROR_MESSAGES[500];
  if (serverMessage.includes('high demand')) return ERROR_MESSAGES.highDemand;
  if (serverMessage.includes('timeout') || serverMessage.includes('ECONNABORTED')) return ERROR_MESSAGES.timeout;
  if (serverMessage.includes('Network request failed') || serverMessage.includes('Network Error')) return ERROR_MESSAGES.network;
  return ERROR_MESSAGES.default;
}

/**
 * Memanggil Gemini AI melalui Supabase Edge Function `analyze-disease`
 * dengan mekanisme retry otomatis dan exponential backoff untuk error 429.
 *
 * @param {string} text - Teks keluhan/gejala dari petani.
 * @param {string|null} base64Image - Gambar tanaman dalam format base64 (opsional).
 * @param {string} mimeType - Tipe MIME gambar, misal `'image/jpeg'`.
 * @param {string} model - Nama model Gemini, misal `'gemini-3.5-flash-lite'`.
 * @param {number} retries - Jumlah sisa percobaan ulang (default 3).
 * @param {number} delay - Jeda awal dalam ms sebelum retry (default 1000ms).
 * @returns {Promise<Object>} Objek JSON hasil diagnosis dari AI.
 * @throws {Error} Jika semua percobaan gagal.
 */
export const analyzeCropIssue = async (
  text,
  base64Image = null,
  mimeType = 'image/jpeg',
  model = 'gemini-3.5-flash-lite',
  retries = 3,
  delay = 1000
) => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-disease', {
      body: { text, base64Image, mimeType, model },
    });

    if (error) throw error;

    // Edge function mengembalikan { error: "..." } jika ada masalah di sisi server
    if (data?.error) {
      const err = new Error(data.error);
      err.status = data.status;
      throw err;
    }

    // Parse respons JSON dari AI
    // AI kadang mengembalikan markdown code block (```json ... ```) — kita bersihkan dulu
    const aiText = data.result;
    try {
      return JSON.parse(aiText);
    } catch {
      const cleaned = aiText.replace(/```json\n?|```/g, '').trim();
      return JSON.parse(cleaned);
    }
  } catch (error) {
    const statusCode = error.status || error.context?.status;
    const serverMessage = error.message || '';

    // Rate limit: coba ulang dengan jeda yang semakin lama (exponential backoff)
    if (statusCode === 429 && retries > 0) {
      console.warn(`[GeminiApi] Rate limit (429). Retry dalam ${delay}ms... (${retries} sisa)`);
      await sleep(delay);
      return analyzeCropIssue(text, base64Image, mimeType, model, retries - 1, delay * 2);
    }

    console.error('[GeminiApi] Error:', serverMessage);
    throw new Error(resolveErrorMessage(statusCode, serverMessage));
  }
};
