/**
 * Konfigurasi dan inisialisasi Supabase client.
 *
 * File ini HANYA berisi setup client Supabase.
 * Untuk operasi fetch data, gunakan:
 * - src/services/productService.js  → fetchProducts()
 * - src/services/packageService.js  → fetchPackages()
 */
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

/** Mengecek apakah environment variables Supabase sudah dikonfigurasi. */
export const isSupabaseConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
