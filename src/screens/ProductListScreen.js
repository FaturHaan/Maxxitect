import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, Image,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import Fuse from 'fuse.js';
import { fetchProducts } from '../services/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ProductListScreen({ navigation }) {
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fuseRef = useRef(null);
  const debounceTimer = useRef(null);

  // Normalisasi keywords (sama seperti di ResultScreen)
  const normalizeKeywords = (keywords) => {
    if (!keywords) return [];
    if (Array.isArray(keywords)) return keywords;
    if (typeof keywords === 'string') {
      if (keywords.startsWith('{') && keywords.endsWith('}')) {
        return keywords.slice(1, -1).split(',').map(k => k.trim().replace(/"/g, ''));
      }
      try {
        const parsed = JSON.parse(keywords);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { /* bukan JSON */ }
      return keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    }
    return [];
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const products = await fetchProducts();
      // Normalisasi keywords agar Fuse bisa search
      const normalized = products.map(p => ({
        ...p,
        keywordsNormalized: normalizeKeywords(p.keywords).join(', '),
      }));
      setAllProducts(normalized);
      setFilteredProducts(normalized);

      // Inisialisasi Fuse.js
      fuseRef.current = new Fuse(normalized, {
        keys: ['productName', 'description', 'keywordsNormalized'],
        threshold: 0.35,
        ignoreLocation: true,
        includeScore: true,
      });
    } catch (err) {
      console.warn('[ProductList] Gagal memuat produk:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Debounced search
  const handleSearch = useCallback((text) => {
    setSearchQuery(text);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      if (!text.trim()) {
        setFilteredProducts(allProducts);
        return;
      }

      if (fuseRef.current) {
        const results = fuseRef.current.search(text.trim());
        setFilteredProducts(results.map(r => r.item));
      }
    }, 300);
  }, [allProducts]);

  const handleOpenDetail = (product) => {
    navigation.navigate('ProductDetail', { product });
  };

  const renderProductCard = ({ item }) => (
    <ProductCard product={item} onPress={() => handleOpenDetail(item)} />
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      {searchQuery.trim() ? (
        <>
          <Ionicons name="search-outline" size={48} color="#999" style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Tidak Ditemukan</Text>
          <Text style={styles.emptyText}>
            Tidak ada produk yang cocok dengan "{searchQuery}"
          </Text>
        </>
      ) : (
        <>
          <Ionicons name="bag-outline" size={48} color="#999" style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Belum Ada Produk</Text>
          <Text style={styles.emptyText}>Katalog produk sedang kosong.</Text>
        </>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007A33" />
        <Text style={styles.loadingText}>Memuat katalog produk...</Text>
      </View>
    );
  }

  if (error && allProducts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Gagal Memuat Data</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadProducts}>
          <Text style={styles.retryBtnText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>Daftar Produk</Text>

        {/* Search Bar */}
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari produk atau keyword hama..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearBtn}>
              <Ionicons name="close-outline" size={18} color="#999" style={styles.clearBtnText} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.resultCount}>
          {filteredProducts.length} produk ditemukan
        </Text>
      </View>

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductCard}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// Komponen Card Produk - Layout Horizontal
const ProductCard = React.memo(({ product, onPress }) => {
  const [imageError, setImageError] = useState(false);
  const keywords = Array.isArray(product.keywords) ? product.keywords : [];

  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.productCardInner}>
        {/* Left side - Text content */}
        <View style={styles.productTextSide}>
          <Text style={styles.productName} numberOfLines={2}>{product.productName}</Text>
          <Text style={styles.productDesc} numberOfLines={2}>
            {product.description}
          </Text>

          {/* Keyword Chips */}
          {keywords.length > 0 && (
            <View style={styles.keywordContainer}>
              {keywords.slice(0, 3).map((kw, index) => (
                <View key={index} style={styles.keywordChip}>
                  <Text style={styles.keywordText}>{kw}</Text>
                </View>
              ))}
              {keywords.length > 3 && (
                <View style={styles.keywordChipMore}>
                  <Text style={styles.keywordTextMore}>+{keywords.length - 3}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.detailHint}>
            <Text style={styles.detailHintText}>Lihat detail</Text>
          </View>
        </View>

        {/* Right side - Image */}
        <View style={styles.productImageSide}>
          <Image
            source={{
              uri: imageError
                ? 'https://dummyimage.com/200x200/cccccc/000000&text=No+Image'
                : product.imageUrl,
            }}
            style={styles.productImage}
            onError={() => setImageError(true)}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6F4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F6F4',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 15,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#007A33',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  // Header Section
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#F3F6F4',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 14,
  },
  // Search
  searchInputWrapper: {
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
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 13,
  },
  clearBtn: {
    padding: 6,
  },
  clearBtnText: {
    color: '#999',
  },
  resultCount: {
    fontSize: 13,
    color: '#007A33',
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 2,
    paddingLeft: 2,
  },
  // List
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  // Product Card - Horizontal Layout
  productCard: {
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
  productCardInner: {
    flexDirection: 'row',
    padding: 16,
  },
  productTextSide: {
    flex: 1,
    paddingRight: 12,
    justifyContent: 'space-between',
  },
  productImageSide: {
    width: 110,
    alignItems: 'center',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    resizeMode: 'cover',
    backgroundColor: '#F0F7F0',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  productDesc: {
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
  keywordChip: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  keywordText: {
    color: '#555',
    fontSize: 11,
    fontWeight: '500',
  },
  keywordChipMore: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  keywordTextMore: {
    color: '#999',
    fontSize: 11,
    fontWeight: '600',
  },
  detailHint: {
    alignItems: 'flex-start',
    marginTop: 8,
  },
  detailHintText: {
    color: '#007A33',
    fontSize: 13,
    fontWeight: '600',
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});
