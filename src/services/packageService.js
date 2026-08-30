import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { CACHE_KEY_PACKAGES } from '../constants/config';

/**
 * Mengambil seluruh data paket bundling dari Supabase dengan fallback ke cache lokal.
 *
 * Strategi:
 * 1. Coba fetch dari Supabase (membutuhkan koneksi internet).
 * 2. Jika berhasil, simpan hasilnya ke AsyncStorage sebagai cache offline.
 * 3. Jika gagal (offline/error), coba baca dari cache lokal.
 * 4. Jika cache juga kosong, lempar error agar UI dapat menanganinya.
 *
 * @returns {Promise<Object[]>} Daftar paket yang sudah dinormalisasi.
 * @throws {Error} Jika tidak ada koneksi dan cache kosong.
 */
export async function fetchPackages() {
  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw new Error(error.message);

    const formatted = data.map((pkg) => ({
      id: pkg.id,
      packageName: pkg.package_name,
      description: pkg.description,
      imageUrl: pkg.image_url,
    }));

    // Simpan ke cache lokal untuk penggunaan offline
    await AsyncStorage.setItem(CACHE_KEY_PACKAGES, JSON.stringify(formatted));

    return formatted;
  } catch (networkError) {
    console.warn('[PackageService] Gagal fetch online, mencoba cache lokal...', networkError.message);

    const cached = await AsyncStorage.getItem(CACHE_KEY_PACKAGES);
    if (cached) return JSON.parse(cached);

    throw new Error('Tidak ada koneksi dan cache kosong.');
  }
}
