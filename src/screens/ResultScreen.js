import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator 
} from 'react-native';
import Fuse from 'fuse.js';
import { fetchProducts } from '../services/supabase';

export default function ResultScreen({ route, navigation }) {
  const { diagnosis } = route.params;
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [usedCache, setUsedCache] = useState(false);

  /**
   * Fuzzy matching menggunakan fuse.js
   * Mencari produk berdasarkan kecocokan keyword dengan nama penyakit.
   * Jauh lebih kuat dari keyword.includes() karena bisa menangani:
   * - Sinonim parsial ("blast" cocok dengan "hawar daun / blast")
   * - Typo ringan ("wereng" cocok dengan "werreng")
   * - Substring ("penggerek" cocok dengan "penggerek batang padi")
   */
  /**
   * Normalisasi keywords: menangani string, array, atau format PostgreSQL array.
   * Supabase bisa mengembalikan keywords dalam berbagai format tergantung tipe kolom.
   */
  const normalizeKeywords = (keywords) => {
    if (!keywords) return [];
    
    // Sudah array? Langsung kembalikan
    if (Array.isArray(keywords)) return keywords;
    
    // String? Coba parse berbagai format
    if (typeof keywords === 'string') {
      // Format PostgreSQL array: "{siput,keong,murbai}"
      if (keywords.startsWith('{') && keywords.endsWith('}')) {
        return keywords.slice(1, -1).split(',').map(k => k.trim().replace(/"/g, ''));
      }
      // Format JSON array: '["siput","keong"]'
      try {
        const parsed = JSON.parse(keywords);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { /* bukan JSON, lanjutkan */ }
      // Format comma-separated: "siput, keong, murbai"
      return keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    }
    
    return [];
  };

  const matchProducts = (catalog) => {
    if (!diagnosis || !diagnosis.penyakit) return [];

    const penyakitName = diagnosis.penyakit.toLowerCase();
    const penjelasan = (diagnosis.penjelasan || '').toLowerCase();
    
    // Gabungkan nama penyakit dan penjelasan sebagai teks referensi
    const teksReferensi = `${penyakitName} ${penjelasan}`;

    console.log('[DEBUG] Teks referensi AI:', teksReferensi);
    console.log('[DEBUG] Jumlah produk di katalog:', catalog.length);

    const fuse = new Fuse([teksReferensi], {
      includeScore: true,
      threshold: 0.3,
      ignoreLocation: true,
    });

    const scoredProducts = catalog.map(product => {
      const keywords = normalizeKeywords(product.keywords);
      let score = 0;

      if (keywords.length > 0) {
        keywords.forEach(kw => {
          // 1. Cek Exact Match (Point = 1)
          if (teksReferensi.includes(kw.toLowerCase())) {
            score += 1;
            console.log(`[DEBUG] ✅ Exact match: "${kw}" untuk produk ${product.productName}`);
          } 
          // 2. Cek Fuzzy Match jika exact tidak kena (Point = 0.8)
          else {
            const results = fuse.search(kw);
            if (results.length > 0 && results[0].score < 0.4) {
              score += 0.8;
              console.log(`[DEBUG] ✅ Fuzzy match: "${kw}" (skor: ${results[0].score}) untuk produk ${product.productName}`);
            }
          }
        });
      }

      return { ...product, matchScore: score };
    });

    // Buang yang skornya 0 (tidak relevan sama sekali)
    // Lalu urutkan (sort) dari skor tertinggi (paling banyak match) ke terendah
    const sortedProducts = scoredProducts
      .filter(p => p.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    console.log(`[DEBUG] Hasil Sorting:`, sortedProducts.map(p => `${p.productName} (Skor: ${p.matchScore})`));
    
    return sortedProducts;
  };

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      setLoading(true);
      try {
        const products = await fetchProducts();
        if (mounted) {
          setCatalogError(false);
          setUsedCache(false);
          setRecommendedProducts(matchProducts(products));
        }
      } catch (error) {
        console.warn('[Katalog] Gagal memuat katalog online:', error.message);
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
            recommendedProducts.map((product, index) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onPress={() => handleOpenDetail(product)} 
                isTopMatch={index === 0} // Produk pertama selalu Top Match
              />
            ))
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

// Komponen Card Produk — sekarang bisa di-klik untuk ke halaman detail
const ProductCard = ({ product, onPress, isTopMatch }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity 
      style={[
        styles.productCard, 
        isTopMatch && styles.topMatchCard // Tambahkan styling khusus untuk Top Match
      ]} 
      onPress={onPress} 
      activeOpacity={0.85}
    >
      <Image 
        source={{ 
          uri: imageError 
            ? 'https://dummyimage.com/200x200/cccccc/000000&text=No+Image' 
            : product.imageUrl 
        }}
        style={styles.productImage}
        onError={() => setImageError(true)}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.productName}</Text>
        <Text style={styles.productDesc} numberOfLines={2}>{product.description}</Text>
        
        <View style={styles.dosageContainer}>
          <Text style={styles.dosageLabel}>Dosis:</Text>
          <Text style={styles.dosageValue}>{product.dosage}</Text>
        </View>

        <View style={styles.detailHint}>
          <Text style={styles.detailHintText}>Ketuk untuk lihat detail →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

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
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  topMatchCard: {
    borderWidth: 2,
    borderColor: '#FFD700', // Warna emas
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  topMatchBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10, // Agar berada di atas gambar
  },
  topMatchBadgeText: {
    color: '#8B6508', // Teks emas tua (dark gold) agar terbaca jelas
    fontWeight: 'bold',
    fontSize: 12,
  },
  productImage: {
    width: '100%',
    height: 180,
    resizeMode: 'contain',
    backgroundColor: '#fff',
  },
  productInfo: {
    padding: 20,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007A33',
    marginBottom: 8,
  },
  productDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  dosageContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  dosageLabel: {
    fontWeight: 'bold',
    color: '#444',
    marginRight: 6,
  },
  dosageValue: {
    color: '#333',
    flex: 1,
  },
  detailHint: {
    alignItems: 'flex-end',
  },
  detailHintText: {
    color: '#007A33',
    fontSize: 13,
    fontWeight: '600',
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
});

