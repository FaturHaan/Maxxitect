import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { FALLBACK_PACKAGE_IMAGE, BRAND_COLOR } from '../../constants/config';

/**
 * Card paket bundling — digunakan di PackageListScreen.
 * Mendukung expand/collapse deskripsi dengan tap.
 *
 * Menggunakan React.memo agar tidak re-render jika props tidak berubah.
 *
 * @param {Object} pkg - Data paket dari Supabase.
 */
const PackageCard = React.memo(({ pkg }) => {
  const [imageError, setImageError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: imageError ? FALLBACK_PACKAGE_IMAGE : pkg.imageUrl }}
        style={styles.image}
        onError={() => setImageError(true)}
      />
      <View style={styles.info}>
        <Text style={styles.badge}>PAKET</Text>
        <Text style={styles.name}>{pkg.packageName}</Text>
        <Text style={styles.desc} numberOfLines={expanded ? undefined : 2}>
          {pkg.description || 'Deskripsi paket belum tersedia.'}
        </Text>
        {!expanded && (
          <Text style={styles.tapHint}>Ketuk untuk lihat selengkapnya</Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default PackageCard;

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
  image: {
    width: '100%',
    height: 220,
    resizeMode: 'contain',
    backgroundColor: '#fff',
  },
  info: {
    padding: 16,
  },
  badge: {
    color: BRAND_COLOR,
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  name: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 21,
  },
  tapHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
