import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePackages } from '../hooks/usePackages';
import PackageCard from '../components/package/PackageCard';
import SearchBar from '../components/common/SearchBar';
import LoadingView from '../components/common/LoadingView';
import ErrorView from '../components/common/ErrorView';

export default function PackageListScreen() {
  const { packages, allPackages, loading, error, searchQuery, handleSearch, reload } = usePackages();

  const renderItem = ({ item }) => <PackageCard pkg={item} />;

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {searchQuery.trim() ? (
        <>
          <Ionicons name="search-outline" size={48} color="#999" style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Tidak Ditemukan</Text>
          <Text style={styles.emptyText}>
            Tidak ada paket yang cocok dengan "{searchQuery}"
          </Text>
        </>
      ) : (
        <>
          <Ionicons name="logo-dropbox" size={48} color="#999" style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Belum Ada Paket</Text>
          <Text style={styles.emptyText}>Daftar paket bundling sedang kosong.</Text>
        </>
      )}
    </View>
  );

  if (loading) return <LoadingView text="Memuat daftar paket..." />;
  if (error && allPackages.length === 0) {
    return <ErrorView message={error} onRetry={reload} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Daftar Paket</Text>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Cari paket bundling..."
        />
        <Text style={styles.resultCount}>{packages.length} paket ditemukan</Text>
      </View>

      <FlatList
        data={packages}
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
