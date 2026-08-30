import { useState, useEffect, useCallback, useRef } from 'react';
import Fuse from 'fuse.js';
import { fetchPackages } from '../services/packageService';

/**
 * Custom hook untuk mengambil dan mencari daftar paket bundling.
 *
 * Mengelola semua state dan logika yang berkaitan dengan daftar paket,
 * sehingga komponen layar (screen) hanya perlu fokus pada tampilan.
 *
 * @returns {{
 *   packages: Object[],     Daftar paket setelah difilter oleh pencarian
 *   allPackages: Object[],  Seluruh daftar paket tanpa filter
 *   loading: boolean,
 *   error: string|null,
 *   searchQuery: string,
 *   handleSearch: Function, Debounced — dipanggil tiap ketikan
 *   reload: Function        Memuat ulang data dari awal
 * }}
 */
export function usePackages() {
  const [allPackages, setAllPackages] = useState([]);
  const [packages, setPackages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fuseRef = useRef(null);
  const debounceTimer = useRef(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPackages();
      setAllPackages(data);
      setPackages(data);

      // Inisialisasi Fuse.js untuk pencarian fuzzy
      fuseRef.current = new Fuse(data, {
        keys: ['packageName', 'description'],
        threshold: 0.35,
        ignoreLocation: true,
        includeScore: true,
      });
    } catch (err) {
      console.warn('[usePackages] Gagal memuat paket:', err.message);
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
          setPackages(allPackages);
          return;
        }
        if (fuseRef.current) {
          setPackages(fuseRef.current.search(text.trim()).map((r) => r.item));
        }
      }, 300);
    },
    [allPackages]
  );

  return { packages, allPackages, loading, error, searchQuery, handleSearch, reload };
}
