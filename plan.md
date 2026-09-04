# Rencana Implementasi Prioritas Komoditas Tanaman

Dokumen ini berisi rencana teknis untuk menambahkan fitur prioritas produk Maxxi Agri berdasarkan jenis komoditas tanaman yang disebutkan oleh pengguna.

## 1. Perubahan pada Database (Tindakan Manual oleh Pengguna)
- **Tabel**: `products` (di Supabase)
- **Aksi**: Tambahkan kolom baru bernama `komoditas`.
- **Tipe Data**: `text` (untuk string yang dipisahkan koma, misal: `"padi, jagung"`) atau `text[]` (array of text).
- **Aturan Pengisian**: 
  - Isi hanya dengan komoditas di mana produk tersebut **paling efektif / spesialis**.
  - Kosongkan (biarkan `NULL` atau string kosong) jika produk bersifat universal dan dapat digunakan untuk semua tanaman.

## 2. Pembaruan Prompt AI (Gemini)
- **File**: `src/services/geminiApi.js` (atau file service tempat pemanggilan AI berada).
- **Tindakan**: Modifikasi *system prompt* agar AI mengekstrak entitas tanaman/komoditas jika pengguna menyebutkannya dalam deskripsi gejala.
- **Output JSON yang Diharapkan**:
  ```json
  {
    "penyakit": "Nama Penyakit / Hama",
    "penjelasan": "Penjelasan singkat...",
    "jenisMasalah": "hama/penyakit/gulma/defisiensi",
    "tanaman": "Nama tanaman (contoh: padi, jagung, cabai). Kosongkan jika user tidak menyebutkannya."
  }
  ```

## 3. Pembaruan Logika Pencocokan Produk
- **File**: `src/utils/productMatcher.js`
- **Tindakan**:
  1. Pastikan logika normalisasi untuk membaca kolom `komoditas` dari database sudah benar.
  2. Ketika melakukan iterasi untuk memberikan `matchScore` pada setiap produk:
     - Biarkan logika penilaian awal berdasarkan `keywords` penyakit tetap berjalan.
     - **Cek Bonus Komoditas**: Jika `diagnosis.tanaman` dari AI memiliki nilai, periksa apakah `diagnosis.tanaman` tersebut terdapat di dalam array/teks `product.komoditas`.
     - Jika cocok, berikan bonus skor tinggi (misalnya: `score += 5`).
     - Jika tidak cocok atau `product.komoditas` kosong, jangan tambahkan bonus skor (skor dibiarkan berdasarkan kecocokan penyakit saja).
  3. Sortir produk seperti biasa berdasarkan skor akhir (dari yang terbesar ke yang terkecil).

## 4. Langkah Pengujian
- Jalankan aplikasi dan coba masukkan teks: *"Padi saya diserang ulat grayak"*. Pastikan produk dengan komoditas "padi" muncul paling atas, sedangkan produk universal untuk ulat tetap ada di bawahnya.
- Coba masukkan teks: *"Daun jagung menguning"*. Pastikan produk dengan komoditas spesialis padi turun ke urutan bawah (jika penyakitnya cocok), dan produk jagung / produk umum naik ke atas.
- Coba masukkan teks: *"Ada bercak di daun"*. Pastikan produk yang universal muncul di atas berdasarkan kecocokan penyakit tanpa ada bonus dari tanaman.
