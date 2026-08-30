import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/product/ProductCard';
import SearchBar from '../components/common/SearchBar';
import LoadingView from '../components/common/LoadingView';
import ErrorView from '../components/common/ErrorView';

export default function ProductListScreen({ navigation }) {
  const { products, allProducts, loading, error, searchQuery, handleSearch, reload } = useProducts();

  const handleOpenDetail = (product) => {
    navigation.navigate('ProductDetail', { product });
  };

  const renderItem = ({ item }) => (
    <ProductCard product={item} onPress={() => handleOpenDetail(item)} />
  );

  const renderEmpty = () => (
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

  if (loading) return <LoadingView text="Memuat katalog produk..." />;
  if (error && allProducts.length === 0) {
    return <ErrorView message={error} onRetry={reload} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Daftar Produk</Text>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Cari produk atau keyword hama..."
        />
        <Text style={styles.resultCount}>{products.length} produk ditemukan</Text>
      </View>

      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6F4',
  },
  header: {
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
  resultCount: {
    fontSize: 13,
    color: '#007A33',
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 2,
    paddingLeft: 2,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
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
