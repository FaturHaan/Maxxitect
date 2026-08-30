/**
 * Konstanta global untuk seluruh aplikasi Maxxitect.
 * Semua "magic number" dan nilai tetap dipusatkan di sini
 * agar mudah diubah dari satu tempat.
 */

// Identitas Brand
export const BRAND_COLOR = '#007A33';
export const BRAND_COLOR_LIGHT = '#E8F5E9';
export const BACKGROUND_COLOR = '#F3F6F4';

// Limit penggunaan diagnosis harian per user
export const DAILY_USAGE_LIMIT = 15;

// Nomor WhatsApp retailer (format internasional tanpa '+')
export const RETAILER_WHATSAPP = '6285394501659';

// URL gambar fallback jika gambar produk/paket gagal dimuat
export const FALLBACK_PRODUCT_IMAGE = 'https://dummyimage.com/200x200/cccccc/000000&text=No+Image';
export const FALLBACK_PACKAGE_IMAGE = 'https://dummyimage.com/400x200/cccccc/000000&text=Paket';

// Kunci cache AsyncStorage
export const CACHE_KEY_PRODUCTS = '@maxxitect_products_cache';
export const CACHE_KEY_PACKAGES = '@maxxitect_packages_cache';
