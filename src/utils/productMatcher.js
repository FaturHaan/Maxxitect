import Fuse from 'fuse.js';

/**
 * Menormalisasi field `keywords` produk dari Supabase ke format array string.
 *
 * Supabase dapat mengembalikan keywords dalam berbagai format tergantung
 * tipe kolom di database, sehingga normalisasi diperlukan sebelum diproses.
 *
 * Format yang didukung:
 * - Array biasa          : ['siput', 'keong']
 * - PostgreSQL array     : '{siput,keong}'
 * - JSON array string    : '["siput","keong"]'
 * - Comma-separated string : 'siput, keong'
 *
 * @param {any} keywords - Nilai keywords mentah dari Supabase.
 * @returns {string[]} Array of keyword strings.
 */
export function normalizeKeywords(keywords) {
  if (!keywords) return [];
  if (Array.isArray(keywords)) return keywords;

  if (typeof keywords === 'string') {
    // Format PostgreSQL array: "{siput,keong,murbai}"
    if (keywords.startsWith('{') && keywords.endsWith('}')) {
      return keywords.slice(1, -1).split(',').map((k) => k.trim().replace(/"/g, ''));
    }
    // Format JSON array: '["siput","keong"]'
    try {
      const parsed = JSON.parse(keywords);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Bukan JSON, lanjutkan ke format berikutnya
    }
    // Format comma-separated biasa: "siput, keong, murbai"
    return keywords.split(',').map((k) => k.trim()).filter((k) => k.length > 0);
  }

  return [];
}

/**
 * Pemetaan dari jenis masalah tanaman (output AI) ke kategori produk yang relevan.
 * Digunakan untuk mem-filter katalog sebelum fuzzy matching agar hasil lebih presisi.
 */
const CATEGORY_MAP = {
  hama: ['insektisida', 'moluskisida', 'rodentisida'],
  penyakit: ['fungisida', 'bakterisida'],
  gulma: ['herbisida'],
  defisiensi: ['pupuk', 'zpt'],
};

/**
 * Mencocokkan produk dari katalog dengan hasil diagnosis AI menggunakan
 * kombinasi exact match dan fuzzy matching (Fuse.js).
 *
 * Cara kerja:
 * 1. Filter katalog berdasarkan kategori produk (misal: hama → insektisida)
 * 2. Hitung skor kecocokan tiap produk terhadap teks diagnosis AI
 *    - Exact match keyword  → +1 poin
 *    - Fuzzy match keyword  → +0.8 poin
 * 3. Urutkan dari skor tertinggi, buang yang skor = 0
 *
 * @param {Object[]} catalog - Daftar semua produk dari Supabase.
 * @param {Object} diagnosis - Objek hasil diagnosis AI.
 * @param {string} diagnosis.penyakit - Nama penyakit/hama yang terdeteksi.
 * @param {string} [diagnosis.penjelasan] - Penjelasan penyakit dari AI.
 * @param {string} [diagnosis.jenisMasalah] - Kategori masalah (hama/penyakit/gulma/defisiensi).
 * @returns {Object[]} Produk yang direkomendasikan, diurutkan dari paling relevan.
 */
export function matchProducts(catalog, diagnosis) {
  if (!diagnosis?.penyakit) return [];

  const penyakitName = diagnosis.penyakit.toLowerCase();
  const penjelasan = (diagnosis.penjelasan || '').toLowerCase();
  const jenisMasalah = (diagnosis.jenisMasalah || '').toLowerCase();
  const referenceText = `${penyakitName} ${penjelasan}`;

  console.log('[ProductMatcher] Teks referensi AI:', referenceText);
  console.log('[ProductMatcher] Jenis masalah:', jenisMasalah);

  // Langkah 1: Filter produk berdasarkan kategori jika memungkinkan
  let filteredCatalog = catalog;
  if (jenisMasalah && CATEGORY_MAP[jenisMasalah]) {
    const allowed = CATEGORY_MAP[jenisMasalah];
    const filtered = catalog.filter((p) => allowed.includes((p.category || '').toLowerCase()));

    // Jika filter menghasilkan katalog kosong, fallback ke semua produk
    filteredCatalog = filtered.length > 0 ? filtered : catalog;
    console.log(`[ProductMatcher] Filter kategori: ${allowed.join(', ')} → ${filteredCatalog.length} produk`);
  }

  // Langkah 1b: Hard-filter herbisida berdasarkan sifat (selektif / non-selektif)
  // Jika AI mendeteksi masalah gulma dan menentukan sifat herbisida yang dibutuhkan,
  // buang semua produk herbisida yang sifatnya berlawanan agar tidak muncul sama sekali.
  const sifatDiagnosis = (diagnosis.sifatHerbisida || '').toLowerCase();
  if (jenisMasalah === 'gulma' && sifatDiagnosis) {
    filteredCatalog = filteredCatalog.filter((p) => {
      const isHerbisida = (p.category || '').toLowerCase() === 'herbisida';
      if (!isHerbisida) return true; // Bukan herbisida, biarkan lolos

      const sifatProduk = (p.sifatHerbisida || '').toLowerCase();
      if (!sifatProduk) return false; // Herbisida tanpa sifat yang jelas, buang untuk keamanan

      return sifatProduk === sifatDiagnosis; // Hanya loloskan yang sifatnya SAMA
    });
    console.log(`[ProductMatcher] Filter sifat herbisida: ${sifatDiagnosis} → ${filteredCatalog.length} produk`);
  }

  // Langkah 1c: Hard-filter herbisida selektif berdasarkan komoditas
  // Herbisida selektif hanya aman untuk komoditas spesifik dan bisa merusak tanaman lain,
  // sehingga WAJIB dibuang jika komoditasnya tidak sesuai dengan tanaman user.
  if (jenisMasalah === 'gulma' && diagnosis.tanaman) {
    const tanamanUser = diagnosis.tanaman.toLowerCase();
    filteredCatalog = filteredCatalog.filter((p) => {
      const isHerbisida = (p.category || '').toLowerCase() === 'herbisida';
      const sifatProduk = (p.sifatHerbisida || '').toLowerCase();

      // Non-herbisida dan herbisida non-selektif → biarkan lolos, tidak terpengaruh
      if (!isHerbisida || sifatProduk !== 'selektif') return true;

      const komoditasProduk = normalizeKeywords(p.komoditas).map(k => k.toLowerCase());

      // Herbisida selektif tanpa data komoditas → buang untuk keamanan
      if (komoditasProduk.length === 0) return false;

      // Hanya loloskan jika komoditas produk cocok dengan tanaman user
      return komoditasProduk.some(k => tanamanUser.includes(k) || k.includes(tanamanUser));
    });
    console.log(`[ProductMatcher] Filter komoditas herbisida selektif: ${tanamanUser} → ${filteredCatalog.length} produk`);
  }

  // Langkah 2: Fuse.js untuk fuzzy matching keyword terhadap teks referensi AI
  const fuse = new Fuse([referenceText], {
    includeScore: true,
    threshold: 0.3,
    ignoreLocation: true,
  });

  // Langkah 3: Hitung skor tiap produk
  const scoredProducts = filteredCatalog.map((product) => {
    const keywords = normalizeKeywords(product.keywords);
    let score = 0;

    keywords.forEach((kw) => {
      if (referenceText.includes(kw.toLowerCase())) {
        // Exact match
        score += 1;
      } else {
        // Fuzzy match
        const results = fuse.search(kw);
        if (results.length > 0 && results[0].score < 0.4) {
          score += 0.8;
        }
      }
    });

    // Langkah Tambahan: Cek kecocokan komoditas / tanaman
    // Bonus ini TIDAK berlaku untuk herbisida non-selektif, karena herbisida non-selektif
    // dipilih berdasarkan kondisi lahan (kosong/terkontrol), bukan komoditas tertentu.
    const isNonSelektif =
      (product.category || '').toLowerCase() === 'herbisida' &&
      (product.sifatHerbisida || '').toLowerCase() === 'non-selektif';

    if (diagnosis.tanaman && !isNonSelektif) {
      const tanamanUser = diagnosis.tanaman.toLowerCase();
      const komoditasProduk = normalizeKeywords(product.komoditas).map(k => k.toLowerCase());

      if (komoditasProduk.length > 0) {
        const isMatch = komoditasProduk.some(k => tanamanUser.includes(k) || k.includes(tanamanUser));
        if (isMatch) {
          score += 5; // Bonus besar untuk produk yang spesifik ke komoditas ini
        }
      }
    }

    return { ...product, matchScore: score };
  });

  const result = scoredProducts
    .filter((p) => p.matchScore > 0)
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      const nameA = (a.productName || '').toLowerCase();
      const nameB = (b.productName || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

  console.log('[ProductMatcher] Hasil:', result.map((p) => `${p.productName} (${p.matchScore})`));
  return result;
}
