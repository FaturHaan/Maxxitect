import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { FALLBACK_PRODUCT_IMAGE, BRAND_COLOR } from '../../constants/config';

/**
 * Card produk horizontal — digunakan di layar daftar produk (ProductListScreen).
 * Menampilkan nama, deskripsi singkat, keyword chips, dan gambar produk.
 *
 * Menggunakan React.memo agar tidak re-render jika props tidak berubah.
 *
 * @param {Object} product - Data produk dari Supabase.
 * @param {Function} onPress - Callback saat card ditekan (navigasi ke detail).
 */
const ProductCard = React.memo(({ product, onPress }) => {
  const [imageError, setImageError] = useState(false);
  const keywords = Array.isArray(product.keywords) ? product.keywords : [];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.inner}>
        {/* Konten teks di kiri */}
        <View style={styles.textSide}>
          <Text style={styles.name} numberOfLines={2}>{product.productName}</Text>
          <Text style={styles.desc} numberOfLines={2}>{product.description}</Text>

          {keywords.length > 0 && (
            <View style={styles.keywordContainer}>
              {keywords.slice(0, 3).map((kw, index) => (
                <View key={index} style={styles.chip}>
                  <Text style={styles.chipText}>{kw}</Text>
                </View>
              ))}
              {keywords.length > 3 && (
                <View style={styles.chipMore}>
                  <Text style={styles.chipMoreText}>+{keywords.length - 3}</Text>
                </View>
              )}
            </View>
          )}

          <Text style={styles.detailHint}>Lihat detail</Text>
        </View>

        {/* Gambar produk di kanan */}
        <View style={styles.imageSide}>
          <Image
            source={{ uri: imageError ? FALLBACK_PRODUCT_IMAGE : product.imageUrl }}
            style={styles.image}
            onError={() => setImageError(true)}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default ProductCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  inner: {
    flexDirection: 'row',
    padding: 16,
  },
  textSide: {
    flex: 1,
    paddingRight: 12,
    justifyContent: 'space-between',
  },
  imageSide: {
    width: 110,
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
    resizeMode: 'cover',
    backgroundColor: '#F0F7F0',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    color: '#777',
    lineHeight: 19,
    marginBottom: 10,
  },
  keywordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  chipText: {
    color: '#555',
    fontSize: 11,
    fontWeight: '500',
  },
  chipMore: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  chipMoreText: {
    color: '#999',
    fontSize: 11,
    fontWeight: '600',
  },
  detailHint: {
    color: BRAND_COLOR,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
});
