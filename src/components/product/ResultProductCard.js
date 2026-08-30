import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { FALLBACK_PRODUCT_IMAGE, BRAND_COLOR } from '../../constants/config';

/**
 * Card produk vertikal — digunakan di layar hasil diagnosis (ResultScreen).
 * Menampilkan gambar besar di atas, lalu nama, deskripsi, dan dosis.
 *
 * @param {Object} product - Data produk dari Supabase (sudah diberi `matchScore`).
 * @param {Function} onPress - Callback navigasi ke halaman detail produk.
 * @param {boolean} isTopMatch - Jika true, card diberi border emas sebagai produk terbaik.
 */
export default function ResultProductCard({ product, onPress, isTopMatch }) {
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.card, isTopMatch && styles.topMatchCard]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: imageError ? FALLBACK_PRODUCT_IMAGE : product.imageUrl }}
        style={styles.image}
        onError={() => setImageError(true)}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{product.productName}</Text>
        <Text style={styles.desc} numberOfLines={2}>{product.description}</Text>

        <View style={styles.dosageRow}>
          <Text style={styles.dosageLabel}>Dosis:</Text>
          <Text style={styles.dosageValue}>{product.dosage}</Text>
        </View>

        <View style={styles.detailHint}>
          <Text style={styles.detailHintText}>Ketuk untuk lihat detail →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  topMatchCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  image: {
    width: '100%',
    height: 180,
    resizeMode: 'contain',
    backgroundColor: '#fff',
  },
  info: {
    padding: 20,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BRAND_COLOR,
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  dosageRow: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  dosageLabel: {
    fontWeight: 'bold',
    color: '#444',
    marginRight: 6,
  },
  dosageValue: {
    color: '#333',
    flex: 1,
  },
  detailHint: {
    alignItems: 'flex-end',
  },
  detailHintText: {
    color: BRAND_COLOR,
    fontSize: 13,
    fontWeight: '600',
  },
});
