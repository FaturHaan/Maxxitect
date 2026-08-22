import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Image, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyzeCropIssue } from '../services/geminiApi';
import { authService } from '../services/authService';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation, user }) {
  const [textInput, setTextInput] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash-lite');
  const [remainingUsage, setRemainingUsage] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [resetTime, setResetTime] = useState('');

  React.useEffect(() => {
    if (user) {
      authService.getRemainingUsage(user.id).then(setRemainingUsage);
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      Alert.alert('Gagal Keluar', error.message);
    }
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('@has_onboarded');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      });
    } catch (e) {
      console.error('Error resetting onboarding', e);
    }
  };

  // Fungsi untuk memilih gambar dari galeri
  const pickImage = async () => {
    // Meminta izin akses galeri
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Izin Ditolak", "Aplikasi membutuhkan izin untuk mengakses galeri Anda.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.4, // Kompresi gambar (kualitas 40%)
      base64: true,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setBase64Image(result.assets[0].base64);
      setMimeType(result.assets[0].mimeType || 'image/jpeg');
    }
  };

  // Fungsi untuk mengambil foto dari kamera
  const takePhoto = async () => {
    // Meminta izin akses kamera
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Izin Ditolak", "Aplikasi membutuhkan izin untuk mengakses kamera Anda.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.4, // Kompresi gambar (kualitas 40%)
      base64: true,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setBase64Image(result.assets[0].base64);
      setMimeType(result.assets[0].mimeType || 'image/jpeg');
    }
  };

  const handleAnalyze = async () => {
    if (!textInput.trim() && !base64Image) {
      Alert.alert("Input Kosong", "Mohon berikan foto tanaman atau deskripsi gejala terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      const usageResult = await authService.checkAndIncrementUsage(user.id);
      
      if (!usageResult.allowed) {
        setLoading(false);
        setResetTime(usageResult.resetTime?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) || '00:00');
        setShowLimitModal(true);
        return;
      }
      
      setRemainingUsage(usageResult.remaining);

      // Memanggil layanan API Gemini dengan model pilihan
      const diagnosis = await analyzeCropIssue(textInput, base64Image, mimeType, selectedModel);
      
      // Jika berhasil, navigasi ke halaman ResultScreen dengan membawa data diagnosis
      navigation.navigate('Result', { diagnosis });
    } catch (error) {
      Alert.alert("Gagal Menganalisis", error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImageUri(null);
    setBase64Image(null);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Maxxi Agri Assistant</Text>
              <Text style={styles.subtitle}>Diagnosis Penyakit & Hama Tanaman Cepat dan Akurat</Text>
            </View>
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
              <Ionicons name="log-out-outline" size={24} color="#D32F2F" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.userInfoRow}>
            <Image source={{ uri: user?.user_metadata?.avatar_url || 'https://ui-avatars.com/api/?name=' + (user?.email || 'User') }} style={styles.userAvatar} />
            <View>
              <Text style={styles.userName}>{user?.user_metadata?.full_name || user?.email}</Text>
              <Text style={styles.usageText}>
                Sisa penggunaan hari ini: <Text style={styles.usageCount}>{remainingUsage !== null ? remainingUsage : '...'}/15</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Section 1: Upload Foto */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionNumber}>1. </Text>
            <Text style={styles.sectionTitle}>Unggah Foto Lahan/Tanaman </Text>
            <Text style={styles.sectionOptional}>(Opsional)</Text>
          </View>
          
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.clearImageBtn} onPress={clearImage}>
                <Text style={styles.clearImageText}>✕ Hapus Foto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imageActionContainer}>
              {/* Dashed upload placeholder */}
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="camera-outline" size={28} color="#999" style={styles.uploadPlaceholderIcon} />
                <Text style={styles.uploadPlaceholderText}>Belum ada foto</Text>
              </View>
              
              <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
                <Ionicons name="archive-outline" size={20} color="#007A33" style={styles.actionBtnIcon} />
                <Text style={styles.actionBtnText}>Pilih Galeri</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={20} color="#007A33" style={styles.actionBtnIcon} />
                <Text style={styles.actionBtnText}>Buka Kamera</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Section 2: Deskripsi Gejala */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionNumber}>2. </Text>
            <Text style={styles.sectionTitle}>Deskripsi Gejala </Text>
            <Text style={styles.sectionOptional}>(Opsional)</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Contoh: Daun padi saya menguning dan ada bercak kecoklatan..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            value={textInput}
            onChangeText={setTextInput}
          />
        </View>

        {/* Section 3: Pilih Model AI */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionNumber}>3. </Text>
            <Text style={styles.sectionTitle}>Pilih Model AI</Text>
          </View>
          <View style={styles.modelSelectionContainer}>
            <TouchableOpacity 
              style={[styles.modelBtn, selectedModel === 'gemini-3.5-flash-lite' && styles.modelBtnActive]}
              onPress={() => setSelectedModel('gemini-3.5-flash-lite')}
            >
              <View style={styles.modelBtnInner}>
                <View style={[styles.modelRadio, selectedModel === 'gemini-3.5-flash-lite' && styles.modelRadioActive]}>
                  {selectedModel === 'gemini-3.5-flash-lite' && <View style={styles.modelRadioDot} />}
                </View>
                <Text style={[styles.modelBtnText, selectedModel === 'gemini-3.5-flash-lite' && styles.modelBtnTextActive]}>Flash Lite (Cepat)</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modelBtn, selectedModel === 'gemini-3.5-flash' && styles.modelBtnActive]}
              onPress={() => setSelectedModel('gemini-3.5-flash')}
            >
              <View style={styles.modelBtnInner}>
                <View style={[styles.modelRadio, selectedModel === 'gemini-3.5-flash' && styles.modelRadioActive]}>
                  {selectedModel === 'gemini-3.5-flash' && <View style={styles.modelRadioDot} />}
                </View>
                <Text style={[styles.modelBtnText, selectedModel === 'gemini-3.5-flash' && styles.modelBtnTextActive]}>Flash (Akurat)</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tombol Analisis */}
        <TouchableOpacity 
          style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]} 
          onPress={handleAnalyze}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.analyzeBtnText}>Analisis Sekarang</Text>
          )}
        </TouchableOpacity>

        {__DEV__ && (
          <TouchableOpacity style={styles.devResetBtn} onPress={resetOnboarding}>
            <Text style={styles.devResetText}>🔄 Reset Onboarding (Dev Only)</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* Modal Limit Tercapai */}
      <Modal
        visible={showLimitModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="alert-circle" size={60} color="#F57C00" />
            <Text style={styles.modalTitle}>Limit Harian Tercapai</Text>
            <Text style={styles.modalDesc}>
              Anda telah menggunakan batas 15 kali diagnosis gratis untuk hari ini.
            </Text>
            <View style={styles.resetTimeBox}>
              <Text style={styles.resetTimeLabel}>Limit akan direset pada pukul:</Text>
              <Text style={styles.resetTimeValue}>{resetTime} WIB</Text>
            </View>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setShowLimitModal(false)}>
              <Text style={styles.modalBtnText}>Mengerti</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6F4',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 16,
  },
  signOutBtn: {
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    marginLeft: 12,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  usageText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  usageCount: {
    fontWeight: 'bold',
    color: '#007A33',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  resetTimeBox: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  resetTimeLabel: {
    fontSize: 12,
    color: '#E65100',
    marginBottom: 4,
  },
  resetTimeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E65100',
  },
  modalBtn: {
    backgroundColor: '#007A33',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  sectionNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sectionOptional: {
    fontSize: 13,
    color: '#999',
    fontWeight: '400',
  },
  // Upload area
  imageActionContainer: {
    gap: 10,
  },
  uploadPlaceholder: {
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    marginBottom: 4,
  },
  uploadPlaceholderIcon: {
    marginBottom: 6,
  },
  uploadPlaceholderText: {
    fontSize: 13,
    color: '#B0B0B0',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#007A33',
    gap: 8,
  },
  actionBtnIcon: {},
  actionBtnText: {
    color: '#007A33',
    fontWeight: '600',
    fontSize: 15,
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
    marginBottom: 12,
  },
  clearImageBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  clearImageText: {
    color: '#D32F2F',
    fontWeight: '600',
    fontSize: 13,
  },
  // Text input
  textInput: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 100,
    lineHeight: 20,
  },
  // Model selection - vertical stacked
  modelSelectionContainer: {
    gap: 10,
  },
  modelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    backgroundColor: '#FAFAFA',
  },
  modelBtnActive: {
    borderColor: '#007A33',
    backgroundColor: '#F0F9F2',
  },
  modelBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modelRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelRadioActive: {
    borderColor: '#007A33',
  },
  modelRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007A33',
  },
  modelBtnText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  modelBtnTextActive: {
    color: '#007A33',
    fontWeight: 'bold',
  },
  // Analyze button
  analyzeBtn: {
    backgroundColor: '#007A33',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007A33',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 8,
    flexDirection: 'row',
  },
  analyzeBtnDisabled: {
    backgroundColor: '#81C784',
    shadowOpacity: 0,
    elevation: 0,
  },
  analyzeBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  devResetBtn: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
    alignItems: 'center',
  },
  devResetText: {
    color: '#856404',
    fontSize: 13,
    fontWeight: '600',
  },
});
