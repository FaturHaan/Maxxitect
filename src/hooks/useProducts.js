import { useState, useEffect, useCallback, useRef } from 'react';
import Fuse from 'fuse.js';
import { fetchProducts } from '../services/productService';
import { normalizeKeywords } from '../utils/productMatcher';

/**
 * Custom hook untuk mengambil dan mencari daftar produk.
 *
 * Mengelola semua state dan logika yang berkaitan dengan daftar produk,
 * sehingga komponen layar (screen) hanya perlu fokus pada tampilan.
 *
 * @returns {{
 *   products: Object[],     Daftar produk setelah difilter oleh pencarian
 *   allProducts: Object[],  Seluruh daftar produk tanpa filter
 *   loading: boolean,
 *   error: string|null,
 *   searchQuery: string,
 *   handleSearch: Function, Debounced — dipanggil tiap ketikan
 *   reload: Function        Memuat ulang data dari awal
 * }}
 */
export function useProducts() {
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fuseRef = useRef(null);
  const debounceTimer = useRef(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts();

      // Normalisasi keywords agar Fuse.js bisa search di dalamnya
      const normalized = data.map((p) => ({
        ...p,
        keywordsNormalized: normalizeKeywords(p.keywords).join(', '),
      }));

      setAllProducts(normalized);
      setProducts(normalized);

      // Inisialisasi Fuse.js untuk pencarian fuzzy
      fuseRef.current = new Fuse(normalized, {
        keys: ['productName', 'description', 'keywordsNormalized'],
        threshold: 0.35,
        ignoreLocation: true,
        includeScore: true,
      });
    } catch (err) {
      console.warn('[useProducts] Gagal memuat produk:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /** Pencarian dengan debounce 300ms agar tidak terlalu sering query. */
  const handleSearch = useCallback(
    (text) => {
      setSearchQuery(text);

      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(() => {
        if (!text.trim()) {
          setProducts(allProducts);
          return;
        }
        if (fuseRef.current) {
          setProducts(fuseRef.current.search(text.trim()).map((r) => r.item));
        }
      }, 300);
    },
    [allProducts]
  );

  return { products, allProducts, loading, error, searchQuery, handleSearch, reload };
}
