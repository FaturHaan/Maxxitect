import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession(); // Required for web

const DAILY_LIMIT = 15;

export const authService = {
  getRedirectUri: () => {
    // Pada Expo Go, ini akan menghasilkan exp://<ip>:8081/--/auth/callback
    // Pada standalone, ini akan menghasilkan maxxitect://auth/callback
    return makeRedirectUri({
      path: 'auth/callback'
    });
  },

  getCurrentUser: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Fungsi untuk cek limit dan increment jika masih bisa
  checkAndIncrementUsage: async (userId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Ambil data penggunaan hari ini
      const { data: usageData, error: fetchError } = await supabase
        .from('usage_tracking')
        .select('usage_count')
        .eq('user_id', userId)
        .eq('usage_date', today)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const currentCount = usageData ? usageData.usage_count : 0;

      // 2. Cek apakah limit tercapai
      if (currentCount >= DAILY_LIMIT) {
        return { 
          allowed: false, 
          remaining: 0,
          resetTime: getMidnightWIB()
        };
      }

      // 3. Jika belum tercapai, update atau insert (Upsert)
      const { error: upsertError } = await supabase
        .from('usage_tracking')
        .upsert({
          user_id: userId,
          usage_date: today,
          usage_count: currentCount + 1
        }, { onConflict: 'user_id,usage_date' });

      if (upsertError) throw upsertError;

      return { 
        allowed: true, 
        remaining: DAILY_LIMIT - (currentCount + 1)
      };

    } catch (error) {
      console.error("Error in checkAndIncrementUsage:", error);
      // Fallback: izinkan jika ada error database tapi catat errornya
      return { allowed: true, remaining: -1, error: error.message };
    }
  },

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

      const currentCount = usageData ? usageData.usage_count : 0;
      return Math.max(0, DAILY_LIMIT - currentCount);
    } catch (error) {
      console.error("Error fetching remaining usage:", error);
      return DAILY_LIMIT; // Asumsi belum dipakai jika error
    }
  }
};

// Fungsi helper untuk mendapatkan jam 12 malam waktu lokal
function getMidnightWIB() {
  const now = new Date();
  
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0); // Ini set ke tengah malam waktu perangkat
  
  return tomorrow;
}
