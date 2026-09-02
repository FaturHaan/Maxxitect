import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity
} from 'react-native';
import { fetchProducts } from '../services/productService';
import { matchProducts } from '../utils/productMatcher';
import ResultProductCard from '../components/product/ResultProductCard';

export default function ResultScreen({ route, navigation }) {
  const { diagnosis } = route.params;
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      setLoading(true);
      try {
        const products = await fetchProducts();
        if (mounted) {
          setCatalogError(false);
          setRecommendedProducts(matchProducts(products, diagnosis));
        }
      } catch (error) {
        console.warn('[Katalog] Gagal memuat katalog:', error.message);
        if (mounted) {
          setCatalogError(true);
          setRecommendedProducts([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProducts();
    return () => { mounted = false; };
  }, [diagnosis]);

  const handleOpenDetail = (product) => {
    navigation.navigate('ProductDetail', { product });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      
      {/* Bagian Diagnosis AI */}
      <View style={styles.diagnosisCard}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>Diagnosis AI</Text>
        </View>
        <Text style={styles.diseaseName}>{diagnosis?.penyakit || "Tidak Teridentifikasi"}</Text>
        <Text style={styles.diseaseDesc}>{diagnosis?.penjelasan || "Tidak ada penjelasan yang tersedia."}</Text>
      </View>

      <Text style={styles.sectionHeader}>Rekomendasi Produk Maxxi Agri</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007A33" />
          <Text style={styles.loadingText}>Memuat katalog produk...</Text>
        </View>
      ) : (
        <>
          {catalogError && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>Gagal memuat katalog online. Menampilkan katalog offline.</Text>
            </View>
          )}

          {/* Daftar Produk Rekomendasi */}
          {recommendedProducts.length > 0 ? (
            <>
              {recommendedProducts.slice(0, showAllProducts ? recommendedProducts.length : 3).map((product, index) => (
                <ResultProductCard 
                  key={product.id} 
                  product={product} 
                  onPress={() => handleOpenDetail(product)} 
                  isTopMatch={index === 0} // Produk pertama selalu Top Match
                />
              ))}

              {recommendedProducts.length > 3 && (
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => setShowAllProducts(!showAllProducts)}
                >
                  <Text style={styles.showMoreButtonText}>
                    {showAllProducts ? 'Tampilkan Lebih Sedikit' : 'Opsi Produk Lainnya'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.noProductCard}>
              <Text style={styles.noProductText}>Belum ada rekomendasi produk spesifik untuk masalah ini di katalog saat ini.</Text>
            </View>
          )}
        </>
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
    padding: 20,
    paddingBottom: 40,
  },
  diagnosisCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    borderLeftWidth: 6,
    borderLeftColor: '#007A33',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  badgeContainer: {
    backgroundColor: '#E8F5E9',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    color: '#007A33',
    fontWeight: 'bold',
    fontSize: 12,
  },
  diseaseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  diseaseDesc: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    paddingLeft: 4,
  },
  noProductCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#CCC',
  },
  noProductText: {
    color: '#777',
    textAlign: 'center',
    fontSize: 15,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#777',
    fontSize: 15,
    marginTop: 12,
  },
  warningBanner: {
    backgroundColor: '#FFF4E5',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    color: '#B26A00',
    fontSize: 13,
    textAlign: 'center',
  },
  showMoreButton: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#007A33',
    borderStyle: 'dashed',
  },
  showMoreButtonText: {
    color: '#007A33',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
