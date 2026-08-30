import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BRAND_COLOR } from '../../constants/config';

/**
 * Komponen tampilan error generik dengan pesan dan tombol "Coba Lagi".
 * Digunakan di layar yang melakukan fetch data dari API.
 *
 * @param {string} [title='Gagal Memuat Data'] - Judul pesan error.
 * @param {string} message - Pesan detail error (biasanya dari `error.message`).
 * @param {Function} [onRetry] - Callback yang dipanggil saat tombol retry ditekan.
 */
export default function ErrorView({ title = 'Gagal Memuat Data', message, onRetry }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryBtnText}>Coba Lagi</Text>
        </TouchableOpacity>
      )}
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
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: BRAND_COLOR,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
