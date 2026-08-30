import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Komponen search bar dengan ikon dan tombol clear.
 * Digunakan di ProductListScreen dan PackageListScreen.
 *
 * @param {string} value - Nilai teks saat ini.
 * @param {Function} onChangeText - Callback saat teks berubah.
 * @param {string} [placeholder='Cari...'] - Teks placeholder.
 */
export default function SearchBar({ value, onChangeText, placeholder = 'Cari...' }) {
  return (
    <View style={styles.wrapper}>
      <Ionicons name="search-outline" size={20} color="#999" style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearBtn}>
          <Ionicons name="close-outline" size={18} color="#999" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 13,
  },
  clearBtn: {
    padding: 6,
  },
});
