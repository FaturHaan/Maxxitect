import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image 
} from 'react-native';
import { fetchPackages } from '../services/packageService';
import { BRAND_COLOR, FALLBACK_PACKAGE_IMAGE } from '../constants/config';
import LoadingView from '../components/common/LoadingView';

export default function RelatedPackagesScreen({ route }) {
  const { packageIds } = route.params; // Array of package IDs
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const pkgsData = await fetchPackages();

        if (mounted) {
          const relatedPkgs = pkgsData.filter(pkg => packageIds.includes(pkg.id));
          setPackages(relatedPkgs);
        }
      } catch (error) {
        console.warn('Gagal memuat paket:', error.message);
        if (mounted) {
          setPackages([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [packageIds]);

  if (loading) {
    return <LoadingView text="Memuat daftar paket..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.headerTitle}>Penawaran Spesial</Text>
      <Text style={styles.headerSubtitle}>
        Produk pilihan Anda tersedia dalam paket bundling berikut ini:
      </Text>

      {packages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Paket tidak ditemukan.</Text>
        </View>
      ) : (
        packages.map((pkg) => (
          <View key={pkg.id} style={styles.packageCard}>
            <Image 
              source={{ uri: pkg.imageUrl || FALLBACK_PACKAGE_IMAGE }}
              style={styles.packageImage}
            />
            <View style={styles.packageInfo}>
              <Text style={styles.packageName}>{pkg.packageName}</Text>
              <Text style={styles.packageDesc}>{pkg.description}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6F4',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  packageImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
    backgroundColor: '#f0f0f0',
  },
  packageInfo: {
    padding: 16,
  },
  packageName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BRAND_COLOR,
    marginBottom: 8,
  },
  packageDesc: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 4,
  },
});
