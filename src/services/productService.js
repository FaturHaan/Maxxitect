import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { CACHE_KEY_PRODUCTS } from '../constants/config';

/**
 * Mengambil seluruh data produk dari Supabase dengan fallback ke cache lokal.
 *
 * Strategi:
 * 1. Coba fetch dari Supabase (membutuhkan koneksi internet).
 * 2. Jika berhasil, simpan hasilnya ke AsyncStorage sebagai cache offline.
 * 3. Jika gagal (offline/error), coba baca dari cache lokal.
 * 4. Jika cache juga kosong, lempar error agar UI dapat menanganinya.
 *
 * @returns {Promise<Object[]>} Daftar produk yang sudah dinormalisasi.
 * @throws {Error} Jika tidak ada koneksi dan cache kosong.
 */
export async function fetchProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw new Error(error.message);

    const formatted = data.map((product) => ({
      id: product.id,
      keywords: product.keywords || [],
      category: product.category || '',
      productName: product.product_name,
      description: product.description,
      dosage: product.dosage,
      imageUrl: product.image_url,
      packageIds: product.package_ids || [],
    }));

    // Simpan ke cache lokal untuk penggunaan offline
    await AsyncStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(formatted));

    return formatted;
  } catch (networkError) {
    console.warn('[ProductService] Gagal fetch online, mencoba cache lokal...', networkError.message);

    const cached = await AsyncStorage.getItem(CACHE_KEY_PRODUCTS);
    if (cached) return JSON.parse(cached);

    throw new Error('Tidak ada koneksi dan cache kosong.');
  }
}
