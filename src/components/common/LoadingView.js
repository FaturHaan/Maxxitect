import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { BRAND_COLOR } from '../../constants/config';

/**
 * Komponen loading generik yang menampilkan spinner dan teks keterangan.
 * Digunakan di seluruh layar saat data sedang dimuat.
 *
 * @param {string} [text='Memuat...'] - Teks yang ditampilkan di bawah spinner.
 */
export default function LoadingView({ text = 'Memuat...' }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={BRAND_COLOR} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F6F4',
    padding: 24,
  },
  text: {
    marginTop: 12,
    color: '#666',
    fontSize: 15,
  },
});
