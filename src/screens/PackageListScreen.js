import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, Image,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import Fuse from 'fuse.js';
import { fetchPackages } from '../services/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function PackageListScreen({ navigation }) {
  const [allPackages, setAllPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fuseRef = useRef(null);
  const debounceTimer = useRef(null);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const packages = await fetchPackages();
      setAllPackages(packages);
      setFilteredPackages(packages);

      // Inisialisasi Fuse.js
      fuseRef.current = new Fuse(packages, {
        keys: ['packageName', 'description'],
        threshold: 0.35,
        ignoreLocation: true,
        includeScore: true,
      });
    } catch (err) {
      console.warn('[PackageList] Gagal memuat paket:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  // Debounced search
  const handleSearch = useCallback((text) => {
    setSearchQuery(text);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      if (!text.trim()) {
        setFilteredPackages(allPackages);
        return;
      }

      if (fuseRef.current) {
        const results = fuseRef.current.search(text.trim());
        setFilteredPackages(results.map(r => r.item));
      }
    }, 300);
  }, [allPackages]);

  const renderPackageCard = ({ item }) => (
    <PackageCard pkg={item} />
  );

  const renderEmptyList = () => (
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007A33" />
        <Text style={styles.loadingText}>Memuat daftar paket...</Text>
      </View>
    );
  }

  if (error && allPackages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Gagal Memuat Data</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadPackages}>
          <Text style={styles.retryBtnText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>Daftar Paket</Text>

        {/* Search Bar */}
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari paket bundling..."
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
          {filteredPackages.length} paket ditemukan
        </Text>
      </View>

      {/* Package List */}
      <FlatList
        data={filteredPackages}
        renderItem={renderPackageCard}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// Komponen Card Paket — dengan expand/collapse deskripsi
const PackageCard = React.memo(({ pkg }) => {
  const [imageError, setImageError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Derive badge text from package name
  const getBadgeText = (name) => {
    if (!name) return 'PAKET';
    return 'PAKET';
  };

  const badgeText = getBadgeText(pkg.packageName);

  return (
    <TouchableOpacity
      style={styles.packageCard}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.85}
    >
      <Image
        source={{
          uri: imageError
            ? 'https://dummyimage.com/400x200/cccccc/000000&text=Paket'
            : pkg.imageUrl,
        }}
        style={styles.packageImage}
        onError={() => setImageError(true)}
      />
      <View style={styles.packageInfo}>
        <View style={styles.packageBadgeRow}>
          <Text style={styles.packageBadgeText}>{badgeText}</Text>
        </View>
        <Text style={styles.packageName}>{pkg.packageName}</Text>
        <Text
          style={styles.packageDesc}
          numberOfLines={expanded ? undefined : 2}
        >
          {pkg.description || 'Deskripsi paket belum tersedia.'}
        </Text>
        {!expanded && (
          <Text style={styles.tapHint}>Ketuk untuk lihat selengkapnya</Text>
        )}
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
  // Package Card
  packageCard: {
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
  packageImage: {
    width: '100%',
    height: 220,
    resizeMode: 'contain',
    backgroundColor: '#fff',
  },
  packageInfo: {
    padding: 16,
  },
  packageBadgeRow: {
    marginBottom: 8,
  },
  packageBadgeText: {
    color: '#007A33',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  packageName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  packageDesc: {
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
