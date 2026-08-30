import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';
import { DAILY_USAGE_LIMIT } from '../constants/config';

WebBrowser.maybeCompleteAuthSession();

/**
 * Mendapatkan jam tengah malam hari berikutnya (waktu lokal perangkat).
 * Digunakan untuk menampilkan waktu reset limit harian kepada pengguna.
 *
 * @returns {Date}
 */
function getMidnightLocal() {
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);
  return tomorrow;
}

/**
 * Kumpulan fungsi autentikasi dan manajemen penggunaan harian.
 */
export const authService = {
  /**
   * Menghasilkan URI redirect yang sesuai untuk OAuth.
   * - Di Expo Go: menghasilkan `exp://<ip>:8081/--/auth/callback`
   * - Di build standalone: menghasilkan `maxxitect://auth/callback`
   *
   * @returns {string} Redirect URI.
   */
  getRedirectUri: () => makeRedirectUri({ path: 'auth/callback' }),

  /**
   * Mendapatkan user yang sedang login dari sesi aktif.
   *
   * @returns {Promise<Object|null>} Objek user Supabase, atau null jika belum login.
   */
  getCurrentUser: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  },

  /**
   * Melakukan sign out user dari sesi aktif.
   *
   * @throws {Error} Jika sign out gagal.
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Mengecek apakah user masih dalam batas penggunaan harian,
   * dan jika masih bisa, langsung mengincrementnya (atomic check-and-increment).
   *
   * @param {string} userId - ID user Supabase.
   * @returns {Promise<{allowed: boolean, remaining: number, resetTime?: Date}>}
   */
  checkAndIncrementUsage: async (userId) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: usageData, error: fetchError } = await supabase
        .from('usage_tracking')
        .select('usage_count')
        .eq('user_id', userId)
        .eq('usage_date', today)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const currentCount = usageData?.usage_count ?? 0;

      if (currentCount >= DAILY_USAGE_LIMIT) {
        return { allowed: false, remaining: 0, resetTime: getMidnightLocal() };
      }

      const { error: upsertError } = await supabase
        .from('usage_tracking')
        .upsert(
          { user_id: userId, usage_date: today, usage_count: currentCount + 1 },
          { onConflict: 'user_id,usage_date' }
        );

      if (upsertError) throw upsertError;

      return { allowed: true, remaining: DAILY_USAGE_LIMIT - (currentCount + 1) };
    } catch (error) {
      console.error('[AuthService] Error checkAndIncrementUsage:', error);
      // Fallback: izinkan jika ada error database agar tidak memblokir pengguna
      return { allowed: true, remaining: -1, error: error.message };
    }
  },

  /**
   * Mengambil sisa kuota penggunaan harian user.
   *
   * @param {string} userId - ID user Supabase.
   * @returns {Promise<number>} Sisa kuota hari ini.
   */
  getRemainingUsage: async (userId) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: usageData, error } = await supabase
        .from('usage_tracking')
        .select('usage_count')
        .eq('user_id', userId)
        .eq('usage_date', today)
        .maybeSingle();

      if (error) throw error;

      const currentCount = usageData?.usage_count ?? 0;
      return Math.max(0, DAILY_USAGE_LIMIT - currentCount);
    } catch (error) {
      console.error('[AuthService] Error getRemainingUsage:', error);
      return DAILY_USAGE_LIMIT; // Asumsikan belum dipakai jika terjadi error
    }
  },
};
