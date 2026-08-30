import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RETAILER_WHATSAPP, FALLBACK_PRODUCT_IMAGE, BRAND_COLOR } from '../constants/config';

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const [imageError, setImageError] = useState(false);

  const handleContactRetailer = () => {
    const message = `Halo, saya tertarik dengan produk ${product.productName} dari aplikasi Maxxitect. Bisa dibantu info lebih lanjut?`;
    
    // Menggunakan tautan wa.me lebih andal dan tidak memerlukan izin khusus OS
    const url = `https://wa.me/${RETAILER_WHATSAPP}?text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert("Gagal", "Tidak dapat membuka halaman WhatsApp.");
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Hero Image */}
      <Image
        source={{
          uri: imageError ? FALLBACK_PRODUCT_IMAGE : product.imageUrl,
        }}
        style={styles.heroImage}
        onError={() => setImageError(true)}
      />

      {/* Nama Produk */}
      <View style={styles.headerSection}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Produk Maxxi Agri</Text>
          </View>
          
          {/* Tombol Paket Bersyarat */}
          {product.packageIds && product.packageIds.length > 0 && (
            <TouchableOpacity 
              style={styles.packageBtn}
              onPress={() => navigation.navigate('RelatedPackages', { packageIds: product.packageIds })}
            >
              <Text style={styles.packageBtnText}>
                Lihat Daftar Paket Terkait 
                <Ionicons name="logo-dropbox" size={16} color="#8B6508" style={styles.packageBtnIcon} />
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.productName}>{product.productName}</Text>
      </View>

      {/* Deskripsi */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="newspaper-outline" size={20} color="#333" />
          <Text style={styles.cardTitle}>Deskripsi</Text>
        </View>
        <Text style={styles.cardContent}>
          {product.description || 'Deskripsi produk belum tersedia.'}
        </Text>
      </View>

      {/* Dosis & Cara Pakai */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="scale-outline" size={20} color="#333" />
          <Text style={styles.cardTitle}>Dosis & Cara Pakai</Text>
        </View>
        <Text style={styles.cardContent}>
          {product.dosage || 'Informasi dosis belum tersedia.'}
        </Text>
      </View>

      {/* Keyword / Target Hama */}
      {product.keywords && product.keywords.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="locate-outline" size={20} color="#333" />
            <Text style={styles.cardTitle}>Target Hama / Penyakit</Text>
          </View>
          <View style={styles.keywordContainer}>
            {product.keywords.map((kw, index) => (
              <View key={index} style={styles.keywordChip}>
                <Text style={styles.keywordText}>{kw}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Tombol Hubungi Retailer */}
      <TouchableOpacity style={styles.contactBtn} onPress={handleContactRetailer}>
        <View style={styles.contactBtnContent}>
          <Ionicons name="chatbox-ellipses-outline" size={24} color="#fff" />
          <Text style={styles.contactBtnText}>Hubungi retailer</Text>
        </View>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6F4',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroImage: {
    width: '100%',
    height: 260,
    resizeMode: 'cover',
    backgroundColor: '#e8e8e8',
  },
  headerSection: {
    padding: 20,
    paddingBottom: 10,
  },
  badge: {
    backgroundColor: '#E8F5E9',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  badgeText: {
    color: BRAND_COLOR,
    fontWeight: 'bold',
    fontSize: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  packageBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  packageBtnText: {
    color: '#8B6508', // Emas gelap
    fontWeight: 'bold',
    fontSize: 12,
  },
  packageBtnIcon: {
    marginLeft: 4,
  },
  productName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardContent: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
  },
  keywordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keywordChip: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  keywordText: {
    color: '#E65100',
    fontSize: 13,
    fontWeight: '600',
  },
  contactBtn: {
    backgroundColor: '#25D366',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  contactBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
});
