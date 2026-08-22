import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const isSupabaseConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const CACHE_KEY = '@maxxitect_products_cache';
const PACKAGES_CACHE_KEY = '@maxxitect_packages_cache';

export async function fetchProducts() {
  try {
    // 1. Coba ambil dari Supabase (membutuhkan internet)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw new Error(error.message);

    // 2. Format data
    const formattedData = data.map((product) => ({
      id: product.id,
      keywords: product.keywords || [],
      productName: product.product_name,
      description: product.description,
      dosage: product.dosage,
      imageUrl: product.image_url,
      packageIds: product.package_ids || [], // Ambil package_ids jika ada
    }));

    // 3. Simpan ke Cache Lokal (AsyncStorage) untuk penggunaan offline
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(formattedData));
    
    return formattedData;
  } catch (networkError) {
    console.warn('[Supabase] Gagal fetch online, mencoba baca cache lokal...', networkError.message);
    
    // 4. Jika gagal (offline), coba baca dari Cache Lokal
    const cachedDataString = await AsyncStorage.getItem(CACHE_KEY);
    if (cachedDataString) {
      return JSON.parse(cachedDataString);
    }

    // 5. Jika cache lokal juga kosong, lempar error agar UI menggunakan fallback JSON
    throw new Error('Tidak ada koneksi dan cache kosong.');
  }
}

export async function fetchPackages() {
  try {
    // 1. Coba ambil dari Supabase
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw new Error(error.message);

    // 2. Format data
    const formattedData = data.map((pkg) => ({
      id: pkg.id,
      packageName: pkg.package_name,
      description: pkg.description,
      imageUrl: pkg.image_url,
    }));

    // 3. Simpan ke Cache Lokal
    await AsyncStorage.setItem(PACKAGES_CACHE_KEY, JSON.stringify(formattedData));
    
    return formattedData;
  } catch (networkError) {
    console.warn('[Supabase] Gagal fetch packages online, mencoba baca cache lokal...', networkError.message);
    
    // 4. Jika gagal (offline), coba baca dari Cache Lokal
    const cachedDataString = await AsyncStorage.getItem(PACKAGES_CACHE_KEY);
    if (cachedDataString) {
      return JSON.parse(cachedDataString);
    }

    // 5. Jika cache lokal kosong, lempar error agar UI pakai JSON lokal
    throw new Error('Tidak ada koneksi dan cache kosong.');
  }
}
