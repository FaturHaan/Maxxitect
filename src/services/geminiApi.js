import { supabase } from './supabase';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fungsi untuk memanggil Gemini API melalui Supabase Edge Function dengan mekanisme retry dan exponential backoff.
 * @param {string} text - Teks keluhan petani (gejala, dsb).
 * @param {string} base64Image - (Opsional) Gambar tanaman dalam format base64.
 * @param {string} mimeType - (Opsional) Tipe mime gambar (misalnya 'image/jpeg').
 * @param {string} model - Nama model AI (misalnya 'gemini-3.5-flash-lite').
 * @param {number} retries - Sisa percobaan ulang (default: 3).
 * @param {number} delay - Jeda awal dalam milidetik (default: 1000).
 * @returns {Promise<Object>} - Mengembalikan objek JSON hasil diagnosis.
 */
export const analyzeCropIssue = async (text, base64Image = null, mimeType = 'image/jpeg', model = 'gemini-3.5-flash-lite', retries = 3, delay = 1000) => {
  try {
    const payload = { text, base64Image, mimeType, model };
    
    // Panggil Supabase Edge Function 'analyze-disease'
    const { data, error } = await supabase.functions.invoke('analyze-disease', {
      body: payload
    });

    if (error) {
      throw error;
    }

    // Jika edge function kita mengembalikan struktur { error: "..." }
    if (data && data.error) {
      const errObj = new Error(data.error);
      errObj.status = data.status;
      throw errObj;
    }

    const aiText = data.result;
    
    // Melakukan parsing respons AI
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(aiText);
    } catch (e) {
      // Fallback jika API secara tidak sengaja menyelipkan markdown (```json ... ```)
      const cleanJsonStr = aiText.replace(/```json\n?|```/g, "").trim();
      jsonResponse = JSON.parse(cleanJsonStr);
    }

    return jsonResponse;

  } catch (error) {
    const statusCode = error.status || error.context?.status;
    const serverMessage = error.message || '';

    // Rate Limit (429) — coba ulang otomatis dengan jeda berlipat
    if (statusCode === 429 && retries > 0) {
      console.warn(`[Backend API] Rate limit (429). Mencoba ulang dalam ${delay}ms... (Sisa retries: ${retries})`);
      await sleep(delay);
      return analyzeCropIssue(text, base64Image, mimeType, model, retries - 1, delay * 2);
    }

    // Terjemahkan pesan error ke Bahasa Indonesia
    console.error("[Backend API] Error memanggil AI:", serverMessage);

    let pesanError;

    if (statusCode === 429) {
      pesanError = 'Server AI sedang sangat sibuk saat ini. Silakan coba lagi dalam beberapa menit.';
    } else if (statusCode === 404) {
      pesanError = 'Fungsi backend tidak ditemukan. Pastikan Anda sudah mendeploy Edge Function analyze-disease.';
    } else if (statusCode === 403) {
      pesanError = 'Akses ke layanan AI ditolak. Periksa konfigurasi API Key di server.';
    } else if (statusCode === 500 || statusCode === 503) {
      pesanError = 'Server AI sedang mengalami gangguan. Silakan coba lagi nanti.';
    } else if (serverMessage.includes('high demand')) {
      pesanError = 'Server AI sedang ramai digunakan. Lonjakan ini biasanya bersifat sementara. Silakan coba lagi sebentar lagi.';
    } else if (serverMessage.includes('timeout') || serverMessage.includes('ECONNABORTED')) {
      pesanError = 'Koneksi ke server AI terlalu lama (timeout). Periksa jaringan internet Anda dan coba lagi.';
    } else if (serverMessage.includes('Network request failed') || serverMessage.includes('Network Error')) {
      pesanError = 'Tidak dapat terhubung ke server AI. Periksa koneksi internet Anda.';
    } else {
      pesanError = 'Gagal menganalisis masalah tanaman. Periksa koneksi internet atau coba beberapa saat lagi.';
    }

    throw new Error(pesanError);
  }
};
