import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../services/supabase';
import { authService } from '../services/authService';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation, route }) {
  const [loading, setLoading] = useState(false);

  const processAuthUrl = async (url) => {
    if (!url) return;
    try {
      const hash = url.includes('#') ? url.split('#')[1] : '';
      const search = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
      const params = new URLSearchParams(hash || search);
      
      const code = params.get('code');
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      // Abaikan jika bukan URL callback dari Supabase (misal URL launch Expo biasa)
      if (!code && !accessToken) {
        return;
      }

      console.log('[Auth] Found OAuth callback params! Code:', Boolean(code), 'Token:', Boolean(accessToken));

      try {
        WebBrowser.dismissAuthSession();
      } catch (e) {}

      if (code) {
        setLoading(true);
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        console.log('[Auth] Logged in successfully with code exchange!');
      } else if (accessToken && refreshToken) {
        setLoading(true);
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) throw error;
        console.log('[Auth] Logged in successfully with tokens!');
      }
    } catch (err) {
      console.error('[Auth] Failed to process auth URL:', err);
      Alert.alert('Gagal Memproses Login', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Tangkap deep link yang masuk ke aplikasi
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('[Auth] Incoming URL via Linking event:', url);
      processAuthUrl(url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) processAuthUrl(url);
    });

    return () => subscription.remove();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const redirectUri = authService.getRedirectUri();
      console.log('[Auth] Using Redirect URI:', redirectUri);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        console.log('[Auth] Opening OAuth URL in external browser...');
        // Kita menggunakan Linking.openURL untuk membuka browser penuh (bukan in-app tab)
        // karena Custom Tabs di beberapa HP Android macet di halaman Google.
        await Linking.openURL(data.url);
        
        // Catatan: Karena kita memakai browser eksternal, kita tidak menunggu 'res' dari WebBrowser.
        // Kita murni mengandalkan Linking.addEventListener yang sudah kita buat di atas untuk menangkap URL kembalian.
      }
    } catch (error) {
      Alert.alert('Gagal Login', error.message || 'Terjadi kesalahan saat login.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
         <Image 
          source={require('../../assets/icon.jpg')} 
          style={styles.logo} 
        />
        <Text style={styles.title}>Maxxitect AI</Text>
        <Text style={styles.subtitle}>Diagnosis Penyakit & Hama Tanaman Cepat dan Akurat</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Login Diperlukan</Text>
        <Text style={styles.cardDesc}>
          Silakan masuk menggunakan akun Google Anda untuk mengakses fitur Diagnosis AI. 
          {'\n\n'}
          Setiap pengguna mendapatkan gratis limit <Text style={styles.bold}>15 kali per hari</Text>.
        </Text>

        <TouchableOpacity 
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]} 
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
             <ActivityIndicator color="#007A33" size="small" />
          ) : (
             <Text style={styles.loginBtnText}>Masuk dengan Google</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007A33', // Hijau Maxxi Agri
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#E8F5E9',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  cardDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  bold: {
    fontWeight: 'bold',
    color: '#007A33',
  },
  loginBtn: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#007A33',
  },
  loginBtnDisabled: {
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  loginBtnText: {
    color: '#007A33',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
