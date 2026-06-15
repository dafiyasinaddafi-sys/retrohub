/* ======================================================================
   RetroHub Local Simulation Database (db.js)
   ======================================================================
   File ini berfungsi sebagai database lokal (menggunakan LocalStorage browser)
   agar simulasi web RetroHub bisa berjalan penuh secara offline tanpa server.
   
   Struktur data di sini disesuaikan persis dengan skema supabase_schema.sql
   sehingga saat migrasi ke Supabase nanti, Anda tinggal mengganti fungsi-fungsi
   di bawah ini dengan panggil API Supabase.
====================================================================== */

// ======================================================================
// INITIAL SESSION CLEANUP: Reset local cache storage on first open
// to prevent stale data sync issues.
// ======================================================================
if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined' && typeof localStorage !== 'undefined') {
  if (!sessionStorage.getItem('retrohub_session_active')) {
    // Keep configuration settings so user does not need to re-enter them
    const savedUrl = localStorage.getItem('retrohub_supabase_url');
    const savedKey = localStorage.getItem('retrohub_supabase_anon_key');
    const savedSimMode = localStorage.getItem('retrohub_sim_mode');
    const savedUserId = localStorage.getItem('retrohub_current_user_id');
    const savedSupabaseUserId = localStorage.getItem('retrohub_supabase_user_id');

    // List of keys to clear
    const keysToClear = [
      'retrohub_profiles',
      'retrohub_products',
      'retrohub_bids',
      'retrohub_orders',
      'retrohub_reviews',
      'retrohub_categories',
      'retrohub_cart',
      'retrohub_discussions',
      'retrohub_chats',
      'retrohub_banners',
      'retrohub_order_seq',
      'retrohub_seller_seq',
      'retrohub_buyer_seq',
      'retrohub_withdrawals',
      'retrohub_api_logs',
      'retrohub_addresses',
      'retrohub_disputes',
      'retrohub_wishlist',
      'retrohub_user_location',
      'retrohub_notifications',
      'retrohub_views',
      'retrohub_db_version'
    ];

    // Clear the keys
    keysToClear.forEach(key => {
      localStorage.removeItem(key);
    });

    // Restore credentials & settings
    if (savedUrl) localStorage.setItem('retrohub_supabase_url', savedUrl);
    if (savedKey) localStorage.setItem('retrohub_supabase_anon_key', savedKey);
    if (savedSimMode) localStorage.setItem('retrohub_sim_mode', savedSimMode);
    if (savedUserId) localStorage.setItem('retrohub_current_user_id', savedUserId);
    if (savedSupabaseUserId) localStorage.setItem('retrohub_supabase_user_id', savedSupabaseUserId);

    // Mark session as active in sessionStorage so it doesn't clear on page refresh
    sessionStorage.setItem('retrohub_session_active', 'true');
    console.log('[RetroHub] Session initialized: Local cached storage reset successfully to prevent stale data issues.');
  }
}

const SUPABASE_URL = "https://wpfakkqvtotinrscqjyi.supabase.co";
const SUPABASE_ANON_KEY = localStorage.getItem('retrohub_supabase_anon_key') || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZmFra3F2dG90aW5yc2NxanlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNzUxMTEsImV4cCI6MjA5Njc1MTExMX0.MUvZMo7J0lbeYZuUBkHtI3B5bGxAgknnqHIAlugFlh0";
const isSimMode = localStorage.getItem('retrohub_sim_mode') === 'true' || !SUPABASE_ANON_KEY || (typeof navigator !== 'undefined' && navigator.webdriver);
if (typeof window !== 'undefined') {
    window.isSimMode = isSimMode;
}

let supabaseClient = null;
if (!isSimMode && typeof window !== 'undefined' && window.supabase) {
    const { createClient } = window.supabase;
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabaseClient;
}

// Helper: generate valid UUID
function _generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const DB_KEYS = {
  PROFILES: 'retrohub_profiles',
  PRODUCTS: 'retrohub_products',
  BIDS: 'retrohub_bids',
  ORDERS: 'retrohub_orders',
  REVIEWS: 'retrohub_reviews',
  CATEGORIES: 'retrohub_categories',
  CART: 'retrohub_cart',
  DISCUSSIONS: 'retrohub_discussions',
  CHATS: 'retrohub_chats',
  BANNERS: 'retrohub_banners',
  CURRENT_USER_ID: 'retrohub_current_user_id',
  DB_VERSION: 'retrohub_db_version',
  ORDER_SEQ: 'retrohub_order_seq',
  SELLER_SEQ: 'retrohub_seller_seq',
  BUYER_SEQ: 'retrohub_buyer_seq',
  WITHDRAWALS: 'retrohub_withdrawals',
  API_LOGS: 'retrohub_api_logs',
  ADDRESSES: 'retrohub_addresses',
  DISPUTES: 'retrohub_disputes',
  WISHLIST: 'retrohub_wishlist',
  USER_LOCATION: 'retrohub_user_location',
  NOTIFICATIONS: 'retrohub_notifications',
};

// Auto-reset jika versi schema berubah (ganti angka ini jika ada perubahan besar data)
const CURRENT_DB_VERSION = '8';
if (localStorage.getItem(DB_KEYS.DB_VERSION) !== CURRENT_DB_VERSION) {
  const savedUserId = localStorage.getItem(DB_KEYS.CURRENT_USER_ID);
  // Reset SEMUA kunci termasuk sequence — sequence akan diset ulang di bawah
  Object.keys(DB_KEYS).forEach(k => {
    localStorage.removeItem(DB_KEYS[k]);
  });
  localStorage.setItem(DB_KEYS.DB_VERSION, CURRENT_DB_VERSION);
  if (savedUserId) localStorage.setItem(DB_KEYS.CURRENT_USER_ID, savedUserId);
}

// Helper: generate sequential RH-format ID
// Default '1005' agar tidak collision dengan INITIAL_ORDERS (RH001001 s/d RH001005)
function _nextOrderId() {
  const seq = parseInt(localStorage.getItem(DB_KEYS.ORDER_SEQ) || '1005', 10) + 1;
  localStorage.setItem(DB_KEYS.ORDER_SEQ, String(seq));
  return 'RH' + String(seq).padStart(6, '0');
}
function _nextSellerId() {
  const seq = parseInt(localStorage.getItem(DB_KEYS.SELLER_SEQ) || '0', 10) + 1;
  localStorage.setItem(DB_KEYS.SELLER_SEQ, String(seq));
  return 'RHS' + String(seq).padStart(4, '0');
}
function _nextBuyerId() {
  const seq = parseInt(localStorage.getItem(DB_KEYS.BUYER_SEQ) || '0', 10) + 1;
  localStorage.setItem(DB_KEYS.BUYER_SEQ, String(seq));
  return 'RHU' + String(seq).padStart(4, '0');
}


// 1. DATA TARIF ONGKIR NYATA ( lookup antarkecamatan Jakarta <-> Bandung )
const REAL_SHIPPING_RATES = {
  'Menteng': { // Asal Jakarta Pusat
    'Menteng': { jnt: 9000, pos: 8000 },
    'Kebayoran Baru': { jnt: 10000, pos: 9000 },
    'Lengkong': { jnt: 19000, pos: 15000 },
    'Coblong': { jnt: 19000, pos: 15000 },
    'Sukajadi': { jnt: 19000, pos: 15000 }
  },
  'Lengkong': { // Asal Bandung
    'Menteng': { jnt: 19000, pos: 15000 },
    'Kebayoran Baru': { jnt: 19000, pos: 15000 },
    'Lengkong': { jnt: 8000, pos: 7000 },
    'Coblong': { jnt: 9000, pos: 8000 },
    'Sukajadi': { jnt: 9000, pos: 8000 }
  }
};

// 1b. TARIF ONGKIR BERDASARKAN ZONA PULAU (fallback nasional saat kecamatan asal/tujuan
//     tidak ada di lookup REAL_SHIPPING_RATES di atas). Tarif per kg dalam Rupiah,
//     mendekati tarif reguler JNT & Pos Indonesia per Jun 2026.
const ZONE_SHIPPING_RATES = {
  'dalam-kota':   { jnt: 9000,  pos: 8000  }, // 1 kota/kab yang sama
  'satu-provinsi':{ jnt: 12000, pos: 10000 }, // beda kota, 1 provinsi
  'jawa-jawa':    { jnt: 15000, pos: 13000 }, // antar provinsi se-Jawa & Bali
  'jawa-luar':    { jnt: 22000, pos: 19000 }, // Jawa <-> Sumatera/Kalimantan/Sulawesi
  'luar-luar':    { jnt: 28000, pos: 24000 }, // antar pulau luar Jawa
  'timur-jauh':   { jnt: 45000, pos: 38000 }  // ke/dari Maluku & Papua
};

// Pengelompokan provinsi -> pulau/region, untuk menentukan zona tarif di atas
const PROVINCE_REGION = {
  'Aceh':'sumatera','Sumatera Utara':'sumatera','Sumatera Barat':'sumatera','Riau':'sumatera',
  'Kepulauan Riau':'sumatera','Jambi':'sumatera','Bengkulu':'sumatera','Sumatera Selatan':'sumatera',
  'Kepulauan Bangka Belitung':'sumatera','Lampung':'sumatera',
  'DKI Jakarta':'jawa','Jawa Barat':'jawa','Banten':'jawa','Jawa Tengah':'jawa',
  'DI Yogyakarta':'jawa','Daerah Istimewa Yogyakarta':'jawa','Jawa Timur':'jawa','Bali':'jawa',
  'Kalimantan Barat':'kalimantan','Kalimantan Tengah':'kalimantan','Kalimantan Selatan':'kalimantan',
  'Kalimantan Timur':'kalimantan','Kalimantan Utara':'kalimantan',
  'Sulawesi Utara':'sulawesi','Gorontalo':'sulawesi','Sulawesi Tengah':'sulawesi',
  'Sulawesi Barat':'sulawesi','Sulawesi Selatan':'sulawesi','Sulawesi Tenggara':'sulawesi',
  'Nusa Tenggara Barat':'jawa','Nusa Tenggara Timur':'jawa',
  'Maluku':'timur','Maluku Utara':'timur','Papua':'timur','Papua Barat':'timur',
  'Papua Tengah':'timur','Papua Pegunungan':'timur','Papua Selatan':'timur','Papua Barat Daya':'timur'
};

// Jarak bumi (Haversine) dalam KM antara dua titik koordinat
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => d * Math.PI / 180;
  const R = 6371; // radius bumi (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Tentukan zona tarif berdasarkan provinsi/kota asal & tujuan
function resolveShippingZone(origin = {}, dest = {}) {
  if (origin.kota && dest.kota && origin.kota === dest.kota) return 'dalam-kota';
  if (origin.provinsi && dest.provinsi && origin.provinsi === dest.provinsi) return 'satu-provinsi';
  const regOrigin = PROVINCE_REGION[origin.provinsi] || 'jawa';
  const regDest = PROVINCE_REGION[dest.provinsi] || 'jawa';
  if (regOrigin === regDest) return regOrigin === 'jawa' ? 'jawa-jawa' : 'luar-luar';
  if (regOrigin === 'timur' || regDest === 'timur') return 'timur-jauh';
  if (regOrigin === 'jawa' || regDest === 'jawa') return 'jawa-luar';
  return 'luar-luar';
}

// ==========================================================
// KONFIGURASI API ONGKIR REAL (JNT & POS INDONESIA)
// ==========================================================
// Untuk mengaktifkan tarif live dari API resmi (mis. Komerce / RajaOngkir Collection API
// yang mendukung JNT & POS Indonesia), daftar di https://collaborator.komerce.id lalu
// isi API key di bawah ini. Jika dibiarkan kosong, sistem otomatis memakai estimasi
// berbasis zona pulau + jarak koordinat (ZONE_SHIPPING_RATES + haversineKm), sehingga
// fitur tetap berjalan tanpa biaya tambahan.
// ─────────────────────────────────────────────────────────────────────────────
// KONFIGURASI ONGKIR
//
// API Biteship dipanggil melalui Cloudflare Function (/api/ongkir) — bukan
// langsung dari browser. API key TIDAK boleh ada di sini. Set di:
//   Cloudflare Pages → Settings → Environment Variables → BITESHIP_API_KEY
//
// Alur:
//   Browsing produk  → estimasi flat rate (ZONE_SHIPPING_RATES, 0 biaya API)
//   Konfirmasi order → /api/ongkir → Biteship real-time (1 request per checkout)
// ─────────────────────────────────────────────────────────────────────────────
const SHIPPING_API_CONFIG = {
  // Endpoint proxy Cloudflare Function (bukan URL Biteship langsung)
  checkoutEndpoint: '/api/ongkir',
  // Kurir yang ditampilkan saat checkout
  couriers: 'jne,jnt,sicepat,anteraja,pos',
};




// DUMMY DATA AWAL
const INITIAL_CATEGORIES = [
  { id: 1, name: 'Konsol', icon: '🕹️', sub_categories: ['PlayStation', 'Nintendo', 'Handheld Emulator', 'Sega', 'Xbox', 'Umum'] },
  { id: 2, name: 'Kaset Game', icon: '💾', sub_categories: ['Nintendo Switch', 'Game Boy/GBA', 'Nintendo DS/3DS', 'PlayStation Disc', 'Retro Cartridge', 'Umum'] },
  { id: 3, name: 'TCG', icon: '🃏', sub_categories: ['Pokemon TCG', 'One Piece Card Game', 'Yu-Gi-Oh!', 'Magic: The Gathering', 'Umum'] },
  { id: 4, name: 'Figure', icon: '🤖', sub_categories: ['S.H.Figuarts', 'Figma', 'Nendoroid', 'Gunpla', 'Hot Toys', 'Umum'] },
  { id: 5, name: 'Tamiya', icon: '🏎️', sub_categories: ['Kit Mini 4WD', 'Parts & Aksesoris', 'Crush Gear', 'Umum'] },
  { id: 6, name: 'Beyblade', icon: '💫', sub_categories: ['Beyblade X', 'Metal Fight', 'Burst', 'Gen 1', 'Umum'] },
  { id: 7, name: 'B-Daman', icon: '💥', sub_categories: ['Battle B-Daman', 'Super B-Daman', 'Bottleman', 'Umum'] },
  { id: 8, name: 'Bakugan', icon: '🔴', sub_categories: ['Gen 1 Legacy', 'Gen 2 Battle Planet', 'Gen 3', 'Umum'] }
];

const INITIAL_PRODUCTS = [
  {
    id: 'prod-1',
    seller_id: 'seller-1',
    seller_name: '@NintendoStore',
    seller_kecamatan: 'Menteng', // Lokasi asal pengiriman
    title: 'Game Boy Color Clear Dandelion Special Edition',
    description: 'Kondisi mulus tombol empuk layar original no dead pixel. Kelengkapan mesin saja (Loose).',
    category_id: 2,
    sub_category: 'Game Boy/GBA',
    condition: 'MIB',
    transaction_type: 'sale',
    weight_grams: 250,
    price: 1450000,
    discount_percent: 10,
    wishlist_count: 12,
    wishlisted_by: ['buyer-demo'],
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop'
  },
  {
    id: 'prod-2',
    seller_id: 'seller-1',
    seller_name: '@NintendoStore',
    seller_kecamatan: 'Menteng',
    title: 'Nintendo Switch OLED Console Mario Red Edition Box',
    description: 'Nintendo Switch OLED edisi spesial Mario Red. Kondisi BIB mulus 95%, lengkap dengan dock merah dan dus bawaan.',
    category_id: 1,
    sub_category: 'Nintendo Switch',
    condition: 'BIB',
    transaction_type: 'sale',
    weight_grams: 1500,
    price: 4100000,
    wishlist_count: 8,
    wishlisted_by: [],
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=500&auto=format&fit=crop'
  },
  {
    id: 'prod-3',
    seller_id: 'seller-2',
    seller_name: '@PasarLoakRetro',
    seller_kecamatan: 'Lengkong',
    title: 'Original Game Boy DMG-01 1989 Classic (Mesin OK)',
    description: 'Gameboy klasik DMG 1989 abu-abu. Body ada lecet wajar pemakaian (fisik 80%), mesin normal suara kencang contrast main.',
    category_id: 1,
    sub_category: 'Nintendo Retro',
    condition: 'Loose',
    transaction_type: 'lelang',
    weight_grams: 400,
    starting_bid: 500000,
    bid_increment: 20000,
    buyout_price: 950000,
    duration_hours: 24,
    wishlist_count: 24,
    wishlisted_by: [],
    auction_end_time: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=500&auto=format&fit=crop'
  },
  {
    id: 'prod-4',
    seller_id: 'seller-3',
    seller_name: '@CardGradingID',
    seller_kecamatan: 'Menteng',
    title: 'Pokemon TCG Charizard VMAX Shiny Vault SF SV107',
    description: 'Kartu Pokemon original Charizard VMAX Shiny Vault. Hasil grading pribadi aman dikirim pakai bubble wrap tebal.',
    category_id: 3,
    sub_category: 'Pokemon TCG',
    condition: 'MIB',
    transaction_type: 'lelang',
    weight_grams: 50,
    starting_bid: 2000000,
    bid_increment: 50000,
    buyout_price: 3500000,
    duration_hours: 24,
    wishlist_count: 57,
    wishlisted_by: ['buyer-demo'],
    auction_end_time: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop'
  }
];

const INITIAL_PROFILES = [
  {
    id: 'seller-1',
    email: 'nintendostore@gmail.com',
    full_name: 'Nintendo Store Indonesia',
    store_name: 'NintendoStore',
    is_buyer: true, is_seller: true, is_admin: false, seller_status: 'active',
    address_provinsi: 'DKI Jakarta',
    address_kota: 'Jakarta Pusat',
    address_kecamatan: 'Menteng',
    address_kelurahan: 'Gondangdia',
    address_kodepos: '10350',
    address_lat: -6.1944,
    address_lng: 106.8294,
    address_detail: 'Jl. Teuku Umar No. 10',
    rating: 4.9,
    reviews_count: 18,
    warning_count: 0,
    wallet_balance: 0
  },
  {
    id: 'seller-2',
    email: 'pasarloak@gmail.com',
    full_name: 'Rudi Pasar Loak',
    store_name: 'PasarLoakRetro',
    is_buyer: true, is_seller: true, is_admin: false, seller_status: 'active',
    address_provinsi: 'Jawa Barat',
    address_kota: 'Kota Bandung',
    address_kecamatan: 'Lengkong',
    address_kelurahan: 'Malabar',
    address_kodepos: '40264',
    address_lat: -6.9326,
    address_lng: 107.6177,
    address_detail: 'Sentra Hobi Lantai 2',
    rating: 4.5,
    reviews_count: 8,
    warning_count: 0,
    wallet_balance: 0
  },
  {
    id: 'seller-3',
    email: 'cardgrading@gmail.com',
    full_name: 'Hendra Card Grader',
    store_name: 'CardGradingID',
    is_buyer: true, is_seller: true, is_admin: false, seller_status: 'active',
    address_provinsi: 'DKI Jakarta',
    address_kota: 'Jakarta Pusat',
    address_kecamatan: 'Menteng',
    address_kelurahan: 'Gondangdia',
    address_kodepos: '10350',
    address_lat: -6.1951,
    address_lng: 106.8312,
    address_detail: 'Ruko Duta Menteng No. 5B',
    rating: 4.8,
    reviews_count: 23,
    warning_count: 0,
    wallet_balance: 0
  },
  {
    id: 'seller-pending-demo',
    email: 'kolektor_gokil@gmail.com',
    full_name: 'Budi Kolektor Figure',
    store_name: 'KolektorGokil',
    is_buyer: true, is_seller: true, is_admin: false, seller_status: 'pending',
    address_provinsi: 'Jawa Barat',
    address_kota: 'Kota Bandung',
    address_kecamatan: 'Coblong',
    address_kelurahan: 'Dago',
    address_kodepos: '40135',
    address_lat: -6.8881,
    address_lng: 107.6133,
    address_detail: 'Jl. Dago No. 123',
    ktp_photo_url: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=150',
    ktp_selfie_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    other_store_link: 'https://tokopedia.com/kolektorgokil',
    warning_count: 0,
    wallet_balance: 0
  },
  {
    id: 'buyer-demo',
    email: 'kolektor_pemula@gmail.com',
    full_name: 'Rian Kolektor Hobi',
    store_name: 'rian_hobi',
    is_buyer: true, is_seller: false, is_admin: false, seller_status: null,
    address_kecamatan: 'Lengkong',
    address_kelurahan: 'Malabar',
    address_detail: 'Jl. Burangrang No. 45',
    warning_count: 0,
    wallet_balance: 350000
  },
  {
    id: 'admin-demo',
    email: 'admin@retrohub.com',
    full_name: 'Admin RetroHub',
    store_name: 'admin',
    is_buyer: true, is_seller: false, is_admin: true, seller_status: null,
    warning_count: 0,
    wallet_balance: 0
  }
];

const INITIAL_WITHDRAWALS = [
  {
    id: 'WD-001',
    user_id: 'seller-1',
    amount: 1469000,
    bank_name: 'BCA',
    account_number: '8809123456',
    account_name: 'Nintendo Store Indonesia',
    order_ids: ['RH001001'],
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    status: 'success',
    type: 'seller_balance'
  },
  {
    id: 'WD-002',
    user_id: 'seller-1',
    amount: 750000,
    bank_name: 'BCA',
    account_number: '8809123456',
    account_name: 'Nintendo Store Indonesia',
    order_ids: [],
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    status: 'pending',
    type: 'seller_balance'
  },
  {
    id: 'WD-003',
    user_id: 'buyer-demo',
    amount: 150000,
    bank_name: 'BCA',
    account_number: '1234567890',
    account_name: 'Rian Kolektor Hobi',
    order_ids: [],
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    status: 'pending',
    type: 'buyer_wallet'
  }
];

const INITIAL_API_LOGS = [
  {
    id: 'API-mock-1',
    order_id: 'RH001001',
    amount: 1469000,
    status: 'success',
    timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000 + 5 * 60 * 1000).toISOString()
  },
  {
    id: 'API-mock-2',
    order_id: 'RH001002',
    amount: 4110000,
    status: 'success',
    timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000 + 10 * 60 * 1000).toISOString()
  },
  {
    id: 'API-mock-3',
    order_id: 'RH001003',
    amount: 695000,
    status: 'success',
    timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 8 * 60 * 1000).toISOString()
  },
  {
    id: 'API-mock-4',
    order_id: 'RH001004',
    amount: 909000,
    status: 'unpaid',
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  }
];

const INITIAL_BIDS = [
  { id: 'bid-1', product_id: 'prod-3', bidder_id: 'buyer-demo', bidder_name: '@rian_hobi', amount: 680000, created_at: new Date().toISOString() },
  { id: 'bid-2', product_id: 'prod-4', bidder_id: 'buyer-demo', bidder_name: '@rian_hobi', amount: 2400000, created_at: new Date().toISOString() }
];

const INITIAL_DISCUSSIONS = [
  {
    id: 'disc-1',
    product_id: 'prod-1', // Game Boy Color
    user_id: 'buyer-demo',
    user_name: 'rian_hobi',
    message: 'Apakah tombol start/select-nya masih empuk atau agak seret ya?',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    replies: [
      {
        id: 'reply-1',
        user_id: 'seller-1',
        user_name: 'NintendoStore',
        message: 'Tombol start select masih sangat aman dan empuk Kak, sudah dibersihkan karet konduktornya.',
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
];

const INITIAL_CHATS = [
  {
    id: 'chat-init-1',
    sender_id: 'seller-1',
    receiver_id: 'buyer-demo',
    message: 'Halo Rian! Game Boy Color dandelion yang kamu tanyakan ready ya. Kondisi sangat oke.',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: false
  }
];

const INITIAL_BANNERS = [
  {
    id: 'banner-1',
    image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=60',
    link_url: 'product.html?id=prod-1'
  },
  {
    id: 'banner-2',
    image_url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1200&auto=format&fit=crop&q=60',
    link_url: 'product.html?id=prod-2'
  },
  {
    id: 'banner-3',
    image_url: 'https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=1200&auto=format&fit=crop&q=60',
    link_url: 'product.html?id=prod-3'
  }
];

const INITIAL_ORDERS = [
  {
    id: 'RH001001',
    product_id: 'prod-1',
    product_title: 'Game Boy Color Clear Dandelion Special Edition',
    price: 1450000,
    price_deal: 1450000,
    seller_id: 'seller-1',
    seller_name: '@NintendoStore',
    buyer_id: 'buyer-demo',
    buyer_name: '@rian_hobi',
    status: 'completed',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    paid_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    shipping_cost: 19000,
    total_payment: 1469000,
    admin_fee: 5000,
    courier: 'jnt',
    shipping_courier: 'jnt',
    tracking_number: 'JNT123456789',
    buyer_notes: 'Tolong packing bubble wrap ya kak!',
    withdrawn_status: 'completed'
  },
  {
    id: 'RH001002',
    product_id: 'prod-2',
    product_title: 'Nintendo Switch OLED Console Mario Red Edition Box',
    price: 4100000,
    price_deal: 4100000,
    seller_id: 'seller-1',
    seller_name: '@NintendoStore',
    buyer_id: 'buyer-demo',
    buyer_name: '@rian_hobi',
    status: 'shipping',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    paid_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
    shipping_cost: 10000,
    total_payment: 4110000,
    admin_fee: 5000,
    courier: 'jnt',
    shipping_courier: 'jnt',
    tracking_number: 'JNT987654321',
    withdrawn_status: 'available'
  },
  {
    id: 'RH001003',
    product_id: 'prod-3',
    product_title: 'Original Game Boy DMG-01 1989 Classic (Mesin OK)',
    price: 680000,
    price_deal: 680000,
    seller_id: 'seller-2',
    seller_name: '@PasarLoakRetro',
    buyer_id: 'buyer-demo',
    buyer_name: '@rian_hobi',
    status: 'disputed',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    paid_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(),
    shipping_cost: 15000,
    total_payment: 695000,
    admin_fee: 5000,
    courier: 'pos',
    shipping_courier: 'pos',
    withdrawn_status: 'available'
  },
  {
    id: 'RH001004',
    product_id: 'prod-4',
    product_title: 'Sega Genesis Mini Console + 40 Games Classic',
    price: 890000,
    price_deal: 890000,
    seller_id: 'seller-2',
    seller_name: '@PasarLoakRetro',
    buyer_id: 'buyer-demo',
    buyer_name: '@rian_hobi',
    status: 'waiting_payment',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    shipping_cost: 19000,
    total_payment: 909000,
    admin_fee: 5000,
    courier: 'jnt',
    shipping_courier: 'jnt',
    withdrawn_status: 'available'
  },
  {
    id: 'RH001005',
    product_id: 'prod-5',
    product_title: 'Pokemon Trading Card Game Base Set 1st Edition Booster Box',
    price: 3200000,
    price_deal: 3200000,
    seller_id: 'seller-3',
    seller_name: '@CardGradingID',
    buyer_id: 'buyer-demo',
    buyer_name: '@rian_hobi',
    status: 'to_ship',
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    paid_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    shipping_cost: 19000,
    total_payment: 3224000,
    admin_fee: 5000,
    courier: 'jnt',
    shipping_courier: 'jnt',
    buyer_notes: 'Sertakan sertifikat grading jika ada',
    withdrawn_status: 'available'
  },
  {
    id: 'RH001006',
    product_id: 'prod-6',
    product_title: 'Super Mario Bros. 3 NES Loose Cartridge',
    price: 350000,
    price_deal: 350000,
    seller_id: 'seller-1',
    seller_name: '@NintendoStore',
    buyer_id: 'buyer-demo',
    buyer_name: '@rian_hobi',
    status: 'completed',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    paid_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    shipping_cost: 15000,
    total_payment: 365000,
    admin_fee: 5000,
    courier: 'pos',
    shipping_courier: 'pos',
    tracking_number: 'POS12345678',
    withdrawn_status: 'available'
  }
];

function initDatabase() {
  // Hanya lakukan seeding data tiruan (mock data) jika berada di Mode Simulasi Offline (isSimMode = true)
  if (isSimMode) {
      if (!localStorage.getItem(DB_KEYS.CATEGORIES)) {
        localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      }

      // Force reset/seeding jika data produk masih versi minimal (< 10 produk)
      const existingProducts = JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS)) || [];
      if (existingProducts.length < 10) {
        localStorage.removeItem(DB_KEYS.PRODUCTS);
      }

      if (!localStorage.getItem(DB_KEYS.PRODUCTS)) {
        const generatedProducts = [...INITIAL_PRODUCTS];
        const mockSellers = [
          { id: 'seller-1', name: '@NintendoStore', kecamatan: 'Menteng' },
          { id: 'seller-2', name: '@PasarLoakRetro', kecamatan: 'Lengkong' },
          { id: 'seller-3', name: '@CardGradingID', kecamatan: 'Menteng' }
        ];
        
        const conditions = ['MIB', 'BIB', 'Loose'];
        
        const categoryImages = {
          1: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&auto=format&fit=crop",
          2: "https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=500&auto=format&fit=crop",
          3: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop",
          4: "https://images.unsplash.com/photo-1560942485-b2a11cc13456?w=500&auto=format&fit=crop",
          5: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=500&auto=format&fit=crop",
          6: "https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?w=500&auto=format&fit=crop",
          7: "https://images.unsplash.com/photo-1608889174649-41f4b272940c?w=500&auto=format&fit=crop",
          8: "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?w=500&auto=format&fit=crop"
        };

        INITIAL_CATEGORIES.forEach(cat => {
          const catId = cat.id;
          const subcategories = cat.sub_categories;
          const catImg = categoryImages[catId] || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop";
          
          for (let i = 0; i < 3; i++) {
            // Sale Product
            const seller = mockSellers[(catId + i) % mockSellers.length];
            const subCat = subcategories[i % subcategories.length];
            const salePrice = (catId * 150000) + (i * 75000) + 120000;
            const discount = (i === 1) ? 10 : 0;
            
            generatedProducts.push({
              id: `generated-sale-${catId}-${i}`,
              seller_id: seller.id,
              seller_name: seller.name,
              seller_kecamatan: seller.kecamatan,
              title: `${cat.name} - ${subCat} Jual Retro #${i+1}`,
              description: `Kondisi mainan ${cat.name} sub-kategori ${subCat} mulus terawat 90%. Kelengkapan unit saja atau dengan box sesuai foto. Sangat direkomendasikan untuk koleksi nostalgia.`,
              category_id: catId,
              sub_category: subCat,
              condition: conditions[i % conditions.length],
              transaction_type: 'sale',
              weight_grams: 300 + (i * 200),
              price: salePrice,
              discount_percent: discount,
              wishlist_count: 2 + i,
              wishlisted_by: [],
              status: 'active',
              image_url: catImg
            });

            // Lelang Product
            const bidStart = (catId * 50000) + (i * 30000) + 50000;
            const bidInc = 20000;
            const buyoutPrice = bidStart * 2.5;

            generatedProducts.push({
              id: `generated-lelang-${catId}-${i}`,
              seller_id: seller.id,
              seller_name: seller.name,
              seller_kecamatan: seller.kecamatan,
              title: `Lelang ${cat.name} - ${subCat} Rare #${i+1}`,
              description: `Barang koleksi ${cat.name} sub-kategori ${subCat} super langka. Lelang berjalan 24 jam. Siapa cepat dia dapat!`,
              category_id: catId,
              sub_category: subCat,
              condition: conditions[(i + 1) % conditions.length],
              transaction_type: 'lelang',
              weight_grams: 200 + (i * 150),
              starting_bid: bidStart,
              bid_increment: bidInc,
              buyout_price: buyoutPrice,
              duration_hours: 24,
              wishlist_count: 5 + i,
              wishlisted_by: [],
              auction_end_time: new Date(Date.now() + (12 + i * 4) * 60 * 60 * 1000).toISOString(),
              status: 'active',
              image_url: catImg
            });
          }
        });

        localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(generatedProducts));
      }
      
      if (!localStorage.getItem(DB_KEYS.PROFILES)) {
        localStorage.setItem(DB_KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
      }
      if (!localStorage.getItem(DB_KEYS.BIDS)) {
        localStorage.setItem(DB_KEYS.BIDS, JSON.stringify(INITIAL_BIDS));
      }
      if (!localStorage.getItem(DB_KEYS.ORDERS)) {
        localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
        const maxSeq = INITIAL_ORDERS.reduce((max, o) => {
          const num = parseInt(o.id.replace('RH', ''), 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 1005);
        localStorage.setItem(DB_KEYS.ORDER_SEQ, String(maxSeq));
      }
      if (!localStorage.getItem(DB_KEYS.DISCUSSIONS)) {
        localStorage.setItem(DB_KEYS.DISCUSSIONS, JSON.stringify(INITIAL_DISCUSSIONS));
      }
      if (!localStorage.getItem(DB_KEYS.CHATS)) {
        localStorage.setItem(DB_KEYS.CHATS, JSON.stringify(INITIAL_CHATS));
      }
  }

  // Bagian ini tetap dijalankan baik Online maupun Offline karena merupakan variabel lokal browser
  if (!localStorage.getItem(DB_KEYS.CART)) {
    localStorage.setItem(DB_KEYS.CART, JSON.stringify([]));
  }
  if (!localStorage.getItem(DB_KEYS.BANNERS)) {
    localStorage.setItem(DB_KEYS.BANNERS, JSON.stringify(INITIAL_BANNERS));
  }
  if (!localStorage.getItem(DB_KEYS.WITHDRAWALS)) {
    localStorage.setItem(DB_KEYS.WITHDRAWALS, JSON.stringify(INITIAL_WITHDRAWALS));
  }
  if (!localStorage.getItem(DB_KEYS.API_LOGS)) {
    localStorage.setItem(DB_KEYS.API_LOGS, JSON.stringify(INITIAL_API_LOGS));
  }
  if (!localStorage.getItem(DB_KEYS.API_LOGS)) {
    localStorage.setItem(DB_KEYS.API_LOGS, JSON.stringify(INITIAL_API_LOGS));
  }
  const currentVal = localStorage.getItem(DB_KEYS.CURRENT_USER_ID);
  if (!currentVal || currentVal === 'null' || currentVal === 'undefined') {
    localStorage.setItem(DB_KEYS.CURRENT_USER_ID, 'buyer-demo'); // Default login sebagai Rian
  }
}

// ==========================================
// SUPABASE HYBRID-SYNC ENGINE & REAL-TIME
// ==========================================

async function syncDatabaseLive() {
    if (isSimMode || !supabaseClient) return;
    
    const startTime = Date.now();
    const isFirstLoad = !localStorage.getItem(DB_KEYS.PRODUCTS);
    
    // Tampilkan overlay loading minimalis hanya jika cache kosong (first load)
    let overlay = null;
    if (isFirstLoad) {
        overlay = document.createElement('div');
        overlay.id = 'retrohub-cloud-loading-overlay';
        overlay.style = `
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: #E52521;
            color: #FFFFFF;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 999999;
            overflow: hidden;
            font-family: var(--font-retro, 'Pixelify Sans', monospace, sans-serif);
            transition: background-color 0s;
        `;
        overlay.innerHTML = `
            <!-- The expanding circle for circular iris reveal transition -->
            <div id="retrohub-reveal-circle" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(1);
                width: 64px;
                height: 64px;
                border-radius: 50%;
                box-shadow: 0 0 0 120vmax #E52521;
                transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                z-index: 1;
                pointer-events: none;
            "></div>

            <!-- Logo and text content wrapper -->
            <div id="retrohub-loading-content" style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                transition: opacity 0.4s ease;
                opacity: 1;
                z-index: 2;
            ">
                <!-- Space reserved for loading logo -->
                <div id="retrohub-loading-logo-placeholder" style="width: 90px; height: 90px; margin-bottom: 16px; display: flex; align-items: center; justify-content: center;">
                    <!-- Pulsing round RetroHub Logo -->
                    <img src="icons/icon-192.png" style="width: 64px; height: 64px; border-radius: 50%; border: 3px solid #FFFFFF; background: #E52521; box-shadow: 0 0 15px rgba(255, 255, 255, 0.4); animation: pulse 1.5s ease-in-out infinite;">
                </div>
                <div style="font-size: 0.9rem; letter-spacing: 1px; color: #FFFFFF; font-weight: bold; font-family: var(--font-retro, sans-serif); text-shadow: 1px 1px 0px rgba(0,0,0,0.2);">Loading...</div>
            </div>
            <style>
                @keyframes pulse {
                    0% { transform: scale(0.92); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.6); }
                    70% { transform: scale(1.03); box-shadow: 0 0 0 15px rgba(255, 255, 255, 0); }
                    100% { transform: scale(0.92); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
                }
            </style>
        `;
        document.body.appendChild(overlay);
    }

    try {
        // Ambil data user yang sedang login terlebih dahulu (cepat)
        const { data: { user: _authUser } } = await supabaseClient.auth.getUser();

        // Siapkan array promise untuk dijalankan secara paralel
        const promises = [
            supabaseClient.from('public_profiles').select('*'),
            supabaseClient.from('categories').select('*'),
            supabaseClient.from('products').select('*'),
            supabaseClient.from('bids').select('*')
        ];

        // Jika user login (bukan guest), tambahkan query tabel pribadi dengan filter terindeks
        if (_authUser) {
            promises.push(
                supabaseClient.from('orders').select('*').or(`buyer_id.eq.${_authUser.id},seller_id.eq.${_authUser.id}`),
                supabaseClient.from('chat_messages').select('*').or(`sender_id.eq.${_authUser.id},receiver_id.eq.${_authUser.id}`),
                supabaseClient.from('buyer_addresses').select('*').eq('user_id', _authUser.id)
            );
        }

        const results = await Promise.all(promises);

        const resProfiles = results[0];
        const resCategories = results[1];
        const resProducts = results[2];
        const resBids = results[3];
        const resOrders = _authUser ? results[4] : { data: [] };
        const resChats = _authUser ? results[5] : { data: [] };
        const resAddresses = _authUser ? results[6] : { data: [] };

        const firstError = resProfiles.error || resCategories.error || resProducts.error || resBids.error || resOrders.error || resChats.error || resAddresses.error;
        if (firstError) {
            console.error('[RetroHub] Supabase sync connection failed:', firstError);
            throw new Error(`Koneksi Supabase Gagal: ${firstError.message} (Detail: ${firstError.details || 'tidak ada'})`);
        }

        let profiles = resProfiles.data || [];
        const categories = resCategories.data;
        const products = resProducts.data;
        const bids = resBids.data;
        const orders = resOrders.data;
        const chats = resChats.data;
        const buyerAddresses = resAddresses.data;
        if (_authUser) {
            // Fetch my full profile to get private data (balance, KTP, cart_items, etc.)
            let myFullProfile = null;
            const { data: myProfData, error: myProfErr } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', _authUser.id)
                .single();

            if (!myProfErr && myProfData) {
                myFullProfile = myProfData;
            }

            if (myFullProfile) {
                // Merge my full profile into the profiles list
                const idx = profiles.findIndex(p => p.id === myFullProfile.id);
                if (idx !== -1) {
                    profiles[idx] = myFullProfile;
                } else {
                    profiles.push(myFullProfile);
                }

                // Jika admin, sync api_logs dari Supabase
                if (myFullProfile.is_admin) {
                    const { data: logsData, error: logsErr } = await supabaseClient
                        .from('api_logs')
                        .select('*')
                        .order('timestamp', { ascending: false });
                    if (!logsErr && logsData) {
                        const mappedLogs = logsData.map(l => ({
                            id: l.id,
                            log_id: l.log_id,
                            order_id: l.order_id,
                            amount: Number(l.amount),
                            status: l.status,
                            timestamp: l.timestamp
                        }));
                        localStorage.setItem(DB_KEYS.API_LOGS, JSON.stringify(mappedLogs));
                        console.log('[RetroHub] API Logs synchronized for Admin:', mappedLogs.length);
                    } else if (logsErr) {
                        console.error('[RetroHub] Gagal mengambil api_logs dari Supabase:', logsErr);
                    }
                }
            } else {
                // Jika belum terdaftar di database, daftarkan profil baru
                const _existsInProfiles = profiles && profiles.some(p => p.id === _authUser.id);
                if (!_existsInProfiles) {
                    const isSuperAdmin = _authUser.email === 'dafiyasinaddafi@gmail.com';
                    const _newProfile = {
                        id: _authUser.id,
                        email: _authUser.email,
                        full_name: _authUser.user_metadata?.full_name || _authUser.email.split('@')[0],
                        store_name: null,
                        is_buyer: true, is_seller: false,
                        is_admin: isSuperAdmin,
                        seller_status: null, warning_count: 0,
                        wallet_balance: 0, penalty_points: 0, cart_items: []
                    };
                    await supabaseClient.from('profiles').upsert(_newProfile, { onConflict: 'id' });
                    profiles.push(_newProfile);
                }
            }
            localStorage.setItem(DB_KEYS.CURRENT_USER_ID, _authUser.id);
            localStorage.setItem('retrohub_supabase_user_id', _authUser.id);
        }

        if (profiles && profiles.length > 0) {
            localStorage.setItem(DB_KEYS.PROFILES, JSON.stringify(profiles));
        } else if (!localStorage.getItem(DB_KEYS.PROFILES)) {
            localStorage.setItem(DB_KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
        }

        if (categories && categories.length > 0) {
            localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(categories));
        } else {
            localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
        }
        
        if (products && products.length > 0) {
            const mappedProducts = products.map(p => {
                const seller = (profiles || []).find(prof => prof.id === p.seller_id);
                return {
                    ...p,
                    status: p.status ? p.status.toLowerCase() : 'active',
                    // Pastikan stock selalu angka valid (bukan null/undefined)
                    stock: p.stock !== null && p.stock !== undefined ? Number(p.stock) : 1,
                    seller_name: seller ? '@' + seller.store_name : '@anonim',
                    seller_kecamatan: seller ? seller.address_kecamatan : ''
                };
            });
            const activeOrSoldProducts = mappedProducts.filter(p => p.status !== 'deleted');
            localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(activeOrSoldProducts));
        } else if (!localStorage.getItem(DB_KEYS.PRODUCTS)) {
            localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
        }

        if (bids) {
            const mappedBids = bids.map(b => {
                const bidder = (profiles || []).find(prof => prof.id === b.bidder_id);
                return {
                    ...b,
                    bidder_name: bidder ? '@' + bidder.store_name : '@anonim'
                };
            });
            localStorage.setItem(DB_KEYS.BIDS, JSON.stringify(mappedBids));
        }

        if (orders && orders.length > 0) {
            const mappedOrders = orders.map(o => {
                const product = (products || []).find(p => p.id === o.product_id);
                const seller = (profiles || []).find(p => p.id === o.seller_id);
                const buyer = (profiles || []).find(p => p.id === o.buyer_id);
                return {
                    ...o,
                    product_title: o.product_title || (product ? product.title : 'Produk Retro'),
                    product_image_url: o.product_image_url || (product ? (product.image_url || (Array.isArray(product.images) ? product.images[0] : '')) : ''),
                    seller_name: o.seller_name || (seller ? '@' + seller.store_name : '@anonim'),
                    buyer_name: o.buyer_name || (buyer ? '@' + buyer.store_name : '@anonim'),
                    // Normalisasi field alias agar kompatibel dengan kode lama
                    courier: o.shipping_courier,
                    price: Number(o.price_deal || o.price || 0),
                    price_deal: Number(o.price_deal || o.price || 0),
                    shipping_cost: Number(o.shipping_cost || 0),
                    admin_fee: Number(o.admin_fee || 5000),
                    total_payment: Number(o.total_payment || 0),
                    quantity: Number(o.quantity || 1)
                };
            });
            // MERGE: Jangan hapus order lokal yang belum tersync (waiting_payment baru)
            const existingOrders = JSON.parse(localStorage.getItem(DB_KEYS.ORDERS) || '[]');
            const supabaseIds = new Set(mappedOrders.map(o => o.id));
            const localOnlyOrders = existingOrders.filter(o => !supabaseIds.has(o.id));
            // Push local-only orders ke Supabase jika belum ada (retry sync)
            if (localOnlyOrders.length > 0 && supabaseClient) {
                localOnlyOrders.forEach(lo => {
                    const retryPayload = {
                        id: lo.id,
                        product_id: lo.product_id,
                        buyer_id: lo.buyer_id,
                        seller_id: lo.seller_id,
                        price_deal: Number(lo.price_deal || lo.price || 0),
                        quantity: Number(lo.quantity || 1),
                        product_title: lo.product_title || null,
                        product_description: lo.product_description || null,
                        product_image_url: lo.product_image_url || null,
                        seller_name: lo.seller_name || null,
                        buyer_name: lo.buyer_name || null,
                        shipping_cost: Number(lo.shipping_cost || 0),
                        admin_fee: Number(lo.admin_fee || 5000),
                        total_payment: Number(lo.total_payment || 0),
                        payment_status: lo.payment_status || 'pending',
                        shipping_courier: lo.shipping_courier || lo.courier || 'jnt',
                        shipping_address: lo.shipping_address || null,
                        recipient_name: lo.recipient_name || null,
                        recipient_phone: lo.recipient_phone || null,
                        buyer_notes: lo.buyer_notes || null,
                        tracking_number: lo.tracking_number || null,
                        status: lo.status,
                        created_at: lo.created_at
                    };
                    supabaseClient.from('orders').upsert(retryPayload, { onConflict: 'id', ignoreDuplicates: false }).then(({ error }) => {
                        if (error) console.warn('[RetroHub] Retry sync order failed:', lo.id, error.message);
                        else console.log('[RetroHub] Retry sync order success:', lo.id);
                    });
                });
            }
            localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify([...mappedOrders, ...localOnlyOrders]));
        } else {
            // Tidak ada order dari Supabase — pertahankan data lokal (mungkin belum tersync)
            if (!localStorage.getItem(DB_KEYS.ORDERS)) {
                localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify([]));
            }
        }

        // Sync buyer_addresses
        if (buyerAddresses && buyerAddresses.length > 0) {
            // Merge: jaga alamat lokal yang belum tersync
            const existing = JSON.parse(localStorage.getItem(DB_KEYS.ADDRESSES) || '[]');
            const remoteIds = new Set(buyerAddresses.map(a => a.id));
            const localOnly = existing.filter(a => !remoteIds.has(a.id));
            localStorage.setItem(DB_KEYS.ADDRESSES, JSON.stringify([...buyerAddresses, ...localOnly]));
        }

        if (chats) {
            const mappedChats = chats.map(c => {
                const [buyerId, sellerId] = c.room_id.split('_');
                const receiverId = c.receiver_id || (c.sender_id === buyerId ? sellerId : buyerId);
                return {
                    id: c.id,
                    sender_id: c.sender_id,
                    receiver_id: receiverId,
                    message: c.message_text,
                    media_url: c.media_url || null,
                    media_type: c.media_type || null,
                    created_at: c.created_at,
                    read: c.read || false
                };
            });
            localStorage.setItem(DB_KEYS.CHATS, JSON.stringify(mappedChats));
        }


    } catch (e) {
        console.error("Error syncing Supabase:", e);
        if (typeof showAlert === 'function') {
            showAlert("Server Error ⚠️", "Gagal terhubung ke database. Silakan coba segarkan halaman atau periksa koneksi internet Anda.");
        } else {
            alert("Server Error: Gagal terhubung ke database.");
        }
    } finally {
        const elapsedTime = Date.now() - startTime;
        const minDuration = isFirstLoad ? 200 : 0; // No minimum duration if background sync
        const remainingTime = Math.max(0, minDuration - elapsedTime);
        
        setTimeout(() => {
            if (overlay) {
                // 1. Sembunyikan konten loading (logo & teks) secara halus
                const content = document.getElementById('retrohub-loading-content');
                if (content) {
                    content.style.opacity = '0';
                }

                // 2. Ubah background overlay menjadi transparan agar iris reveal terlihat
                overlay.style.backgroundColor = 'transparent';
                // Izinkan interaksi dengan halaman di belakang overlay selama animasi berlangsung
                overlay.style.pointerEvents = 'none';

                // 3. Picu animasi pembukaan lingkaran menggunakan transform scale (GPU accelerated)
                const circle = document.getElementById('retrohub-reveal-circle');
                if (circle) {
                    circle.style.transform = 'translate(-50%, -50%) scale(80)';
                }

                // 4. Hapus overlay dari DOM setelah animasi transisi selesai (650ms)
                setTimeout(() => {
                    if (overlay && overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }, 650);
            }
        }, remainingTime);
    }
}

function initRealtimeListeners() {
    if (isSimMode || !supabaseClient) return;

    // ─────────────────────────────────────────────────────────────────────────
    // SET JWT KE KONEKSI REALTIME
    // Tanpa ini RLS mengevaluasi auth.uid() = NULL → semua filter postgres_changes
    // gagal dan tidak ada event yang diterima pihak manapun.
    // ─────────────────────────────────────────────────────────────────────────
    try {
        const tokenStr = localStorage.getItem('sb-wpfakkqvtotinrscqjyi-auth-token');
        if (tokenStr) {
            const token = JSON.parse(tokenStr);
            if (token && token.access_token) {
                supabaseClient.realtime.setAuth(token.access_token);
            }
        }
    } catch (e) {
        console.error('Gagal set auth realtime:', e);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. CHAT MESSAGES
    // ─────────────────────────────────────────────────────────────────────────
    supabaseClient.channel('chat-messages-live')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
            const c = payload.new;
            const chats = JSON.parse(localStorage.getItem(DB_KEYS.CHATS)) || [];
            const [buyerId, sellerId] = c.room_id.split('_');
            const receiverId = c.receiver_id || (c.sender_id === buyerId ? sellerId : buyerId);
            if (!chats.some(msg => msg.id === c.id)) {
                chats.push({
                    id: c.id,
                    sender_id: c.sender_id,
                    receiver_id: receiverId,
                    message: c.message_text,
                    media_url: c.media_url || null,
                    media_type: c.media_type || null,
                    created_at: c.created_at,
                    read: c.read || false
                });
                localStorage.setItem(DB_KEYS.CHATS, JSON.stringify(chats));
                window.dispatchEvent(new CustomEvent('retrohub_chat_received', { detail: c }));
            }
        })
        .subscribe();

    // ─────────────────────────────────────────────────────────────────────────
    // 2. BIDS (penawaran lelang)
    // ─────────────────────────────────────────────────────────────────────────
    supabaseClient.channel('bids-live')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids' }, payload => {
            const b = payload.new;
            const bids = JSON.parse(localStorage.getItem(DB_KEYS.BIDS)) || [];
            if (!bids.some(item => item.id === b.id)) {
                const profiles = JSON.parse(localStorage.getItem(DB_KEYS.PROFILES)) || [];
                const bidder = profiles.find(p => p.id === b.bidder_id);
                bids.push({ ...b, bidder_name: bidder ? '@' + bidder.store_name : '@anonim' });
                localStorage.setItem(DB_KEYS.BIDS, JSON.stringify(bids));
                window.dispatchEvent(new CustomEvent('retrohub_bid_received', { detail: b }));
            }
        })
        .subscribe();

    // ─────────────────────────────────────────────────────────────────────────
    // 3. ORDERS (semua event: INSERT, UPDATE, DELETE)
    // ─────────────────────────────────────────────────────────────────────────
    supabaseClient.channel('orders-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
            const o = payload.new;
            if (!o || !o.id) return;
            let orders = JSON.parse(localStorage.getItem(DB_KEYS.ORDERS)) || [];
            const idx = orders.findIndex(item => item.id === o.id);
            const profiles = JSON.parse(localStorage.getItem(DB_KEYS.PROFILES) || '[]');
            const products = JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS) || '[]');
            const product = products.find(p => p.id === o.product_id);
            const seller = profiles.find(p => p.id === o.seller_id);
            const buyer = profiles.find(p => p.id === o.buyer_id);
            const enriched = {
                ...o,
                courier: o.shipping_courier,
                price: Number(o.price_deal || 0),
                price_deal: Number(o.price_deal || 0),
                shipping_cost: Number(o.shipping_cost || 0),
                total_payment: Number(o.total_payment || 0),
                quantity: Number(o.quantity || 1),
                product_title: o.product_title || (product ? product.title : 'Produk Retro'),
                product_image_url: o.product_image_url || (product ? (product.image_url || '') : ''),
                seller_name: o.seller_name || (seller ? '@' + seller.store_name : '@anonim'),
                buyer_name: o.buyer_name || (buyer ? '@' + buyer.store_name : '@anonim'),
            };
            if (idx !== -1) {
                orders[idx] = { ...orders[idx], ...enriched };
            } else {
                orders.push(enriched);
            }
            localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
            window.dispatchEvent(new CustomEvent('retrohub_order_updated', { detail: enriched }));
            if (typeof window.onNewOrderReceived === 'function') {
                window.onNewOrderReceived(enriched);
            }
        })
        .subscribe();

    // ─────────────────────────────────────────────────────────────────────────
    // 4. PRODUCTS (INSERT, UPDATE, DELETE)
    // Ini yang hilang sebelumnya — penyebab produk baru dari device lain
    // tidak muncul tanpa refresh manual.
    // ─────────────────────────────────────────────────────────────────────────
    supabaseClient.channel('products-live')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, async payload => {
            let p = payload.new;
            if (!p || !p.id) return;
            
            // Jika image_url/image_urls bernilai null/undefined (karena TOAST di postgres replication), ambil data lengkap dari Supabase
            if ((p.image_url === null || p.image_url === undefined || p.image_url === '' || p.image_urls === null || p.image_urls === undefined) && supabaseClient) {
                try {
                    const { data: freshProduct, error } = await supabaseClient.from('products').select('*').eq('id', p.id).single();
                    if (error) {
                        console.error("[Realtime] Gagal fetch data detail produk dari Supabase:", error);
                    } else if (freshProduct) {
                        p = freshProduct;
                    }
                } catch (e) {
                    console.error("[Realtime] Exception fetch data detail produk:", e);
                }
            }

            let products = JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS) || '[]');
            if (!products.some(item => item.id === p.id)) {
                const profiles = JSON.parse(localStorage.getItem(DB_KEYS.PROFILES) || '[]');
                const seller = profiles.find(prof => prof.id === p.seller_id);
                const enriched = {
                    ...p,
                    status: p.status ? p.status.toLowerCase() : 'active',
                    seller_name: seller ? '@' + seller.store_name : '@anonim',
                    seller_kecamatan: seller ? seller.address_kecamatan : ''
                };
                products.push(enriched);
                localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
                window.dispatchEvent(new CustomEvent('retrohub_product_added', { detail: enriched }));
            }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, async payload => {
            let p = payload.new;
            if (!p || !p.id) return;

            // Jika image_url/image_urls bernilai null/undefined (karena TOAST di postgres replication), ambil data lengkap dari Supabase
            if ((p.image_url === null || p.image_url === undefined || p.image_url === '' || p.image_urls === null || p.image_urls === undefined) && supabaseClient) {
                try {
                    const { data: freshProduct, error } = await supabaseClient.from('products').select('*').eq('id', p.id).single();
                    if (error) {
                        console.error("[Realtime] Gagal fetch data detail produk dari Supabase:", error);
                    } else if (freshProduct) {
                        p = freshProduct;
                    }
                } catch (e) {
                    console.error("[Realtime] Exception fetch data detail produk:", e);
                }
            }

            let products = JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS) || '[]');
            const idx = products.findIndex(item => item.id === p.id);
            const profiles = JSON.parse(localStorage.getItem(DB_KEYS.PROFILES) || '[]');
            const seller = profiles.find(prof => prof.id === p.seller_id);
            const enriched = {
                ...p,
                image_url: p.image_url || (idx !== -1 ? products[idx].image_url : null),
                image_urls: p.image_urls || (idx !== -1 ? products[idx].image_urls : null),
                status: p.status ? p.status.toLowerCase() : (idx !== -1 ? products[idx].status : 'active'),
                // Pastikan stock selalu angka valid dari Supabase
                stock: p.stock !== null && p.stock !== undefined ? Number(p.stock) : (idx !== -1 ? products[idx].stock : 1),
                seller_name: (idx !== -1 ? products[idx].seller_name : null) || (seller ? '@' + seller.store_name : '@anonim'),
                seller_kecamatan: (idx !== -1 ? products[idx].seller_kecamatan : null) || (seller ? seller.address_kecamatan : '')
            };
            if (enriched.status === 'deleted') {
                let productsList = JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS) || '[]');
                productsList = productsList.filter(item => item.id !== p.id);
                localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(productsList));
                window.dispatchEvent(new CustomEvent('retrohub_product_deleted', { detail: { id: p.id } }));
                if (typeof window.renderSellerInventory === 'function') window.renderSellerInventory();
                return;
            }

            if (idx !== -1) {
                products[idx] = { ...products[idx], ...enriched };
            } else {
                products.push(enriched);
            }
            localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
            // Broadcast ke semua halaman yang terbuka di device ini
            window.dispatchEvent(new CustomEvent('retrohub_product_updated', { detail: enriched }));
            // Juga trigger re-render panel seller jika terbuka
            if (typeof window.renderSellerInventory === 'function') window.renderSellerInventory();
            if (typeof window.renderSellerOrders === 'function') window.renderSellerOrders();
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'products' }, payload => {
            const old = payload.old;
            if (!old || !old.id) return;
            let products = JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS) || '[]');
            products = products.filter(item => item.id !== old.id);
            localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
            window.dispatchEvent(new CustomEvent('retrohub_product_deleted', { detail: old }));
        })
        .subscribe();

    // ─────────────────────────────────────────────────────────────────────────
    // 5. PROFILES (UPDATE saja — INSERT ditangani syncDatabaseLive)
    // Penting untuk approval seller, perubahan saldo, dll realtime antar device.
    // ─────────────────────────────────────────────────────────────────────────
    supabaseClient.channel('profiles-live')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
            const p = payload.new;
            if (!p || !p.id) return;
            const profiles = JSON.parse(localStorage.getItem(DB_KEYS.PROFILES) || '[]');
            const idx = profiles.findIndex(item => item.id === p.id);
            if (idx !== -1) {
                profiles[idx] = { ...profiles[idx], ...p };
            } else {
                profiles.push(p);
            }
            localStorage.setItem(DB_KEYS.PROFILES, JSON.stringify(profiles));
            window.dispatchEvent(new CustomEvent('retrohub_profile_updated', { detail: p }));
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, payload => {
            const p = payload.new;
            if (!p || !p.id) return;
            const profiles = JSON.parse(localStorage.getItem(DB_KEYS.PROFILES) || '[]');
            if (!profiles.some(item => item.id === p.id)) {
                profiles.push(p);
                localStorage.setItem(DB_KEYS.PROFILES, JSON.stringify(profiles));
                window.dispatchEvent(new CustomEvent('retrohub_profile_updated', { detail: p }));
            }
        })
        .subscribe();

    // ─────────────────────────────────────────────────────────────────────────
    // 6. CATEGORIES (INSERT, UPDATE — jarang berubah tapi perlu sync admin)
    // ─────────────────────────────────────────────────────────────────────────
    supabaseClient.channel('categories-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, payload => {
            const c = payload.new;
            if (!c || !c.id) return;
            const categories = JSON.parse(localStorage.getItem(DB_KEYS.CATEGORIES) || '[]');
            const idx = categories.findIndex(item => item.id === c.id);
            if (idx !== -1) {
                categories[idx] = { ...categories[idx], ...c };
            } else {
                categories.push(c);
            }
            localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(categories));
            window.dispatchEvent(new CustomEvent('retrohub_categories_updated', { detail: c }));
        })
        .subscribe();

    // ─────────────────────────────────────────────────────────────────────────
    // 7. DISPUTES (INSERT, UPDATE)
    // ─────────────────────────────────────────────────────────────────────────
    supabaseClient.channel('disputes-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'disputes' }, payload => {
            const d = payload.new;
            if (!d || !d.id) return;
            const disputes = JSON.parse(localStorage.getItem(DB_KEYS.DISPUTES) || '[]');
            const idx = disputes.findIndex(item => item.id === d.id);
            if (idx !== -1) {
                disputes[idx] = { ...disputes[idx], ...d };
            } else {
                disputes.push(d);
            }
            localStorage.setItem(DB_KEYS.DISPUTES, JSON.stringify(disputes));
            window.dispatchEvent(new CustomEvent('retrohub_dispute_updated', { detail: d }));
        })
        .subscribe();

    // ─────────────────────────────────────────────────────────────────────────
    // 8. BUYER ADDRESSES (INSERT, UPDATE, DELETE)
    // ─────────────────────────────────────────────────────────────────────────
    supabaseClient.channel('addresses-live')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'buyer_addresses' }, payload => {
            const a = payload.new;
            if (!a || !a.id) return;
            const addresses = JSON.parse(localStorage.getItem(DB_KEYS.ADDRESSES) || '[]');
            if (!addresses.some(item => item.id === a.id)) {
                addresses.push(a);
                localStorage.setItem(DB_KEYS.ADDRESSES, JSON.stringify(addresses));
                window.dispatchEvent(new CustomEvent('retrohub_address_updated', { detail: a }));
            }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'buyer_addresses' }, payload => {
            const a = payload.new;
            if (!a || !a.id) return;
            const addresses = JSON.parse(localStorage.getItem(DB_KEYS.ADDRESSES) || '[]');
            const idx = addresses.findIndex(item => item.id === a.id);
            if (idx !== -1) {
                addresses[idx] = { ...addresses[idx], ...a };
            } else {
                addresses.push(a);
            }
            localStorage.setItem(DB_KEYS.ADDRESSES, JSON.stringify(addresses));
            window.dispatchEvent(new CustomEvent('retrohub_address_updated', { detail: a }));
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'buyer_addresses' }, payload => {
            const old = payload.old;
            if (!old || !old.id) return;
            let addresses = JSON.parse(localStorage.getItem(DB_KEYS.ADDRESSES) || '[]');
            addresses = addresses.filter(item => item.id !== old.id);
            localStorage.setItem(DB_KEYS.ADDRESSES, JSON.stringify(addresses));
            window.dispatchEvent(new CustomEvent('retrohub_address_updated', { detail: old }));
        })
        .subscribe();

    // ─────────────────────────────────────────────────────────────────────────
    // 9. API LOGS (INSERT — untuk admin log realtime)
    // ─────────────────────────────────────────────────────────────────────────
    supabaseClient.channel('api-logs-live')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'api_logs' }, payload => {
            const l = payload.new;
            if (!l || !l.id) return;
            const logs = JSON.parse(localStorage.getItem(DB_KEYS.API_LOGS)) || [];
            if (!logs.some(item => item.id === l.id)) {
                logs.unshift({
                    id: l.id,
                    log_id: l.log_id,
                    order_id: l.order_id,
                    amount: Number(l.amount),
                    status: l.status,
                    timestamp: l.timestamp
                });
                localStorage.setItem(DB_KEYS.API_LOGS, JSON.stringify(logs));
                window.dispatchEvent(new CustomEvent('retrohub_api_logs_updated', { detail: l }));
            }
        })
        .subscribe();

    console.log('[RetroHub] ✅ Realtime listeners aktif: chat, bids, orders, products, profiles, categories, disputes, addresses, api_logs');
}

// Window API Helpers
window.showSupabaseSetup = function() {
    if (typeof showAlert === 'function') {
        showAlert("Konfigurasi Supabase 🔌", `
            <div style="text-align: left; font-size: 0.75rem; color: var(--retro-dark);">
                <p style="margin-bottom: 8px; line-height:1.4;">Masukkan <strong>Anon Public API Key</strong> dari dashboard Supabase Anda (Project Settings -> API) untuk menyinkronkan data live:</p>
                <input type="text" id="setup-supabase-key" placeholder="eyJhbGciOi..." style="width: 100%; border: 2.5px solid var(--retro-dark); padding: 6px; font-size: 0.72rem; border-radius: 4px; box-sizing: border-box; margin-bottom: 12px;" value="${localStorage.getItem('retrohub_supabase_anon_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZmFra3F2dG90aW5yc2NxanlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNzUxMTEsImV4cCI6MjA5Njc1MTExMX0.MUvZMo7J0lbeYZuUBkHtI3B5bGxAgknnqHIAlugFlh0'}">
                <p style="font-size: 0.62rem; color: #64748B; margin: 0 0 12px 0; line-height: 1.3;">* Kunci API ini hanya disimpan di local storage browser Anda.</p>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-retro btn-green" onclick="saveSupabaseKeyFromSetup()" style="width: 100%; font-size: 0.75rem; padding: 6px; cursor:pointer;">Simpan & Live Sync 🔄</button>
                    <button class="btn-retro btn-red" onclick="removeSupabaseKeyFromSetup()" style="font-size: 0.75rem; padding: 6px; min-width: auto; cursor:pointer;">Reset</button>
                </div>
            </div>
        `);
    } else {
        const key = prompt("Masukkan Kunci API Supabase Anon:");
        if (key) {
            localStorage.setItem('retrohub_supabase_anon_key', key);
            window.location.reload();
        }
    }
};

// Synchronous helper to fetch active user ID from Supabase auth session stored in localStorage
function getSupabaseSessionUserSync() {
    try {
        const projectRef = "wpfakkqvtotinrscqjyi";
        const tokenStr = localStorage.getItem(`sb-${projectRef}-auth-token`);
        if (tokenStr) {
            const session = JSON.parse(tokenStr);
            if (session && session.user && session.user.id) {
                return session.user.id;
            }
        }
    } catch (e) {
        console.warn("[RetroHub] Error parsing Supabase auth token from localStorage:", e);
    }
    return localStorage.getItem('retrohub_current_user_id') || 'guest';
}

// DOM Initialization
if (typeof window !== 'undefined') {
    if (!isSimMode && supabaseClient) {
        const activeUserId = getSupabaseSessionUserSync();
        const currentStoredUserId = localStorage.getItem('retrohub_supabase_user_id') || 'guest';
        
        if (activeUserId !== currentStoredUserId) {
            // User changed -> clear storage and do a full synced reload
            if (activeUserId !== 'guest') {
                localStorage.setItem(DB_KEYS.CURRENT_USER_ID, activeUserId);
                localStorage.setItem('retrohub_supabase_user_id', activeUserId);
            } else {
                localStorage.setItem(DB_KEYS.CURRENT_USER_ID, 'guest');
                localStorage.removeItem('retrohub_supabase_user_id');
            }
            // Clear cache to ensure a clean sync for the new user profile
            localStorage.removeItem(DB_KEYS.PRODUCTS);
            localStorage.removeItem(DB_KEYS.ORDERS);
            localStorage.removeItem(DB_KEYS.PROFILES);
            
            if (document.body) {
                syncDatabaseLive().then(() => { window.location.reload(); });
            } else {
                window.addEventListener('DOMContentLoaded', () => {
                    syncDatabaseLive().then(() => { window.location.reload(); });
                });
            }
        } else {
            // User did not change -> background sync on every page load
            // 1. Initialize Realtime listeners immediately so we don't miss updates
            initRealtimeListeners();
            
            // 2. Fetch fresh profile data asynchronously on boot
            if (activeUserId && activeUserId !== 'guest') {
                supabaseClient.from('profiles').select('*').eq('id', activeUserId).single().then(({ data, error }) => {
                    if (!error && data) {
                        const profiles = JSON.parse(localStorage.getItem(DB_KEYS.PROFILES)) || [];
                        const index = profiles.findIndex(p => p.id === activeUserId);
                        let changed = false;
                        if (index !== -1) {
                            if (profiles[index].seller_status !== data.seller_status ||
                                profiles[index].is_seller !== data.is_seller ||
                                profiles[index].is_admin !== data.is_admin) {
                                profiles[index] = { ...profiles[index], ...data };
                                changed = true;
                            }
                        } else {
                            profiles.push(data);
                            changed = true;
                        }
                        if (changed) {
                            localStorage.setItem(DB_KEYS.PROFILES, JSON.stringify(profiles));
                            window.dispatchEvent(new CustomEvent('retrohub_profile_refreshed', { detail: data }));
                        }
                    }
                });
            }

            // 3. Attach auth change state listener
            supabaseClient.auth.onAuthStateChange(async (event, session) => {
                const newActiveUserId = (session && session.user) ? session.user.id : 'guest';
                const currentUserId = localStorage.getItem('retrohub_supabase_user_id') || 'guest';

                if (session && session.access_token && supabaseClient.realtime) {
                    try { supabaseClient.realtime.setAuth(session.access_token); } catch (e) {}
                }

                if (newActiveUserId !== currentUserId) {
                    if (newActiveUserId !== 'guest') {
                        // User logged in! Let's backup the guest cart before clearing
                        const guestCart = JSON.parse(localStorage.getItem(DB_KEYS.CART) || '[]');

                        localStorage.setItem(DB_KEYS.CURRENT_USER_ID, newActiveUserId);
                        localStorage.setItem('retrohub_supabase_user_id', newActiveUserId);

                        // Fetch the user's profile to merge cart
                        try {
                            const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', newActiveUserId).single();
                            if (profile) {
                                let dbCart = [];
                                try {
                                    dbCart = Array.isArray(profile.cart_items) ? profile.cart_items : JSON.parse(profile.cart_items || '[]');
                                } catch(e) {}

                                // Merge carts (unique items)
                                const mergedCart = Array.from(new Set([...guestCart, ...dbCart]));
                                profile.cart_items = mergedCart;

                                // Save to database
                                await supabaseClient.from('profiles').update({ cart_items: mergedCart }).eq('id', newActiveUserId);

                                // Save profiles list
                                const localProfiles = JSON.parse(localStorage.getItem(DB_KEYS.PROFILES) || '[]');
                                const idx = localProfiles.findIndex(p => p.id === newActiveUserId);
                                if (idx !== -1) {
                                    localProfiles[idx] = profile;
                                } else {
                                    localProfiles.push(profile);
                                }
                                localStorage.setItem(DB_KEYS.PROFILES, JSON.stringify(localProfiles));
                            }
                        } catch (e) {
                            console.error('[RetroHub] Error merging guest cart on login:', e);
                        }
                    } else {
                        localStorage.setItem(DB_KEYS.CURRENT_USER_ID, 'guest');
                        localStorage.removeItem('retrohub_supabase_user_id');
                    }
                    localStorage.removeItem(DB_KEYS.PRODUCTS);
                    localStorage.removeItem(DB_KEYS.ORDERS);
                    localStorage.removeItem(DB_KEYS.PROFILES);
                    window.location.reload();
                }
            });

            // 4. Run background sync on every page load
            const runBackgroundSync = () => {
                const isFirstLoad = !localStorage.getItem(DB_KEYS.PRODUCTS);
                syncDatabaseLive().then(() => {
                    window.dispatchEvent(new CustomEvent('retrohub_sync_complete'));
                    if (isFirstLoad) {
                        window.location.reload();
                    }
                }).catch(err => {
                    console.error("[RetroHub] Background sync failed:", err);
                });
            };

            if (document.body) {
                runBackgroundSync();
            } else {
                window.addEventListener('DOMContentLoaded', runBackgroundSync);
            }
        }
    }
}

initDatabase();

// ============================================================
// ensureProfileExists: Dipanggil setelah sync/login Google
// Membuat profil di Supabase jika belum ada (fallback safety net)
// ============================================================
window.ensureProfileExists = async function(authUser) {
    if (!authUser || !supabaseClient || isSimMode) return;
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('id, is_admin, is_seller, seller_status, full_name, store_name, email')
            .eq('id', authUser.id)
            .single();

        if (error || !data) {
            // Profil belum ada → buat baru
            const isSuperAdmin = authUser.email === 'dafiyasinaddafi@gmail.com';
            const newProfile = {
                id: authUser.id,
                email: authUser.email,
                full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
                store_name: null,  // user isi sendiri saat daftar seller
                is_buyer: true,
                is_seller: false,
                is_admin: isSuperAdmin,
                seller_status: null,
                warning_count: 0
            };
            await supabaseClient.from('profiles').upsert(newProfile, { onConflict: 'id' });
            db.saveProfile(newProfile);
            db.setCurrentUserId(authUser.id);
            console.log('[RetroHub] Profil baru dibuat untuk:', authUser.email);
        } else {
            // Profil sudah ada → sync ke localStorage
            db.saveProfile({ id: authUser.id, ...data });
            db.setCurrentUserId(authUser.id);
        }
    } catch(e) {
        console.error('[RetroHub] ensureProfileExists error:', e);
    }
};



// Helper: Update stok produk di localStorage dan broadcast event
function _updateLocalProductStock(productId, newStock, newStatus) {
    const localProducts = JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS) || '[]');
    const lIdx = localProducts.findIndex(p => p.id === productId);
    if (lIdx !== -1) {
        localProducts[lIdx].stock  = Number(newStock);
        localProducts[lIdx].status = newStatus ? newStatus.toLowerCase() : (newStock <= 0 ? 'sold' : localProducts[lIdx].status);
        localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(localProducts));
        window.dispatchEvent(new CustomEvent('retrohub_product_updated', {
            detail: { ...localProducts[lIdx] }
        }));
    }
}

// 3. API DATABASE LOKAL (CRUD METHODS)
const db = {
  // ==========================================================
  // DATA WILAYAH INDONESIA (Provinsi/Kota/Kecamatan/Kelurahan)
  // Sumber: API publik gratis emsifa (https://github.com/emsifa/api-wilayah-indonesia)
  // Hasil di-cache di sessionStorage agar tidak fetch berulang.
  // ==========================================================
  wilayah: {
    BASE_URL: 'https://www.emsifa.com/api-wilayah-indonesia/api',

    _cacheGet: (key) => {
      try {
        const raw = sessionStorage.getItem('wilayah_cache_' + key);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    },
    _cacheSet: (key, data) => {
      try { sessionStorage.setItem('wilayah_cache_' + key, JSON.stringify(data)); } catch (e) {}
    },
    _fetchJson: async (url, cacheKey) => {
      const cached = db.wilayah._cacheGet(cacheKey);
      if (cached) return cached;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Gagal memuat data wilayah: ' + url);
      const data = await resp.json();
      db.wilayah._cacheSet(cacheKey, data);
      return data;
    },
    getProvinces: () => db.wilayah._fetchJson(`${db.wilayah.BASE_URL}/provinces.json`, 'provinces'),
    getRegencies: (provinceId) => db.wilayah._fetchJson(`${db.wilayah.BASE_URL}/regencies/${provinceId}.json`, 'regencies_' + provinceId),
    getDistricts: (regencyId) => db.wilayah._fetchJson(`${db.wilayah.BASE_URL}/districts/${regencyId}.json`, 'districts_' + regencyId),
    getVillages: (districtId) => db.wilayah._fetchJson(`${db.wilayah.BASE_URL}/villages/${districtId}.json`, 'villages_' + districtId)
  },

  // SESSION SIMULASI
  getCurrentUserId: () => {
    if (isSimMode || !supabaseClient) {
      const val = localStorage.getItem(DB_KEYS.CURRENT_USER_ID);
      if (!val || val === 'null' || val === 'undefined' || val === 'guest') return null;
      return val;
    } else {
      const val = localStorage.getItem('retrohub_supabase_user_id');
      if (!val || val === 'null' || val === 'undefined' || val === 'guest') return null;
      return val;
    }
  },
  setCurrentUserId: (id) => {
    if (isSimMode || !supabaseClient) {
      if (!id || id === 'null' || id === 'undefined' || id === 'guest') {
        localStorage.setItem(DB_KEYS.CURRENT_USER_ID, 'guest');
      } else {
        localStorage.setItem(DB_KEYS.CURRENT_USER_ID, id);
      }
    } else {
      if (!id || id === 'null' || id === 'undefined' || id === 'guest') {
        localStorage.setItem('retrohub_supabase_user_id', 'guest');
      } else {
        localStorage.setItem('retrohub_supabase_user_id', id);
      }
    }
  },

  // PROFILES
  getProfiles: () => JSON.parse(localStorage.getItem(DB_KEYS.PROFILES)) || [],
  getProfileById: (id) => {
    let profiles = JSON.parse(localStorage.getItem(DB_KEYS.PROFILES)) || [];
    const index = profiles.findIndex(p => p.id === id);
    if (index === -1) return null;
    let p = profiles[index];
    
    // Decay check: per 30 hari -1 poin
    if (p.penalty_points && p.penalty_points > 0 && p.last_penalty_decay) {
      const lastDecay = new Date(p.last_penalty_decay);
      const now = new Date();
      const diffTime = Math.abs(now - lastDecay);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 30) {
        const decay = Math.floor(diffDays / 30);
        p.penalty_points = Math.max(0, p.penalty_points - decay);
        const newDecayDate = new Date(lastDecay.getTime() + decay * 30 * 24 * 60 * 60 * 1000);
        p.last_penalty_decay = newDecayDate.toISOString();
        
        profiles[index] = p;
        localStorage.setItem(DB_KEYS.PROFILES, JSON.stringify(profiles));
        
        // Supabase Sync
        if (!isSimMode && supabaseClient) {
          supabaseClient.from('profiles').update({
            penalty_points: p.penalty_points,
            last_penalty_decay: p.last_penalty_decay
          }).eq('id', id).then();
        }
      }
    }
    return p;
  },
  saveProfile: (profile) => {
    const profiles = db.getProfiles();
    const index = profiles.findIndex(p => p.id === profile.id);
    const oldStatus = index !== -1 ? profiles[index].seller_status : null;
    const newStatus = profile.seller_status;
    const isUpdate = index !== -1;
    let mergedProfile;
    if (index !== -1) {
      mergedProfile = { ...profiles[index], ...profile };
      profiles[index] = mergedProfile;
    } else {
      if (!profile.id) {
        profile.id = (isSimMode || !supabaseClient)
          ? (profile.is_seller ? _nextSellerId() : _nextBuyerId())
          : _generateUUID();
      }
      mergedProfile = profile;
      profiles.push(profile);
    }
    localStorage.setItem(DB_KEYS.PROFILES, JSON.stringify(profiles));

    // Supabase Sync
    if (!isSimMode && supabaseClient) {
        const payload = {
            id: mergedProfile.id,
            email: mergedProfile.email || "",
            full_name: mergedProfile.full_name || "",
            store_name: mergedProfile.store_name || null,
            is_buyer: mergedProfile.is_buyer !== false,
            is_seller: mergedProfile.is_seller === true,
            is_admin: mergedProfile.is_admin === true,
            seller_status: mergedProfile.seller_status || null,
            address_provinsi: mergedProfile.address_provinsi || null,
            address_provinsi_id: mergedProfile.address_provinsi_id || null,
            address_kota: mergedProfile.address_kota || null,
            address_kota_id: mergedProfile.address_kota_id || null,
            address_kecamatan: mergedProfile.address_kecamatan || null,
            address_kecamatan_id: mergedProfile.address_kecamatan_id || null,
            address_kelurahan: mergedProfile.address_kelurahan || null,
            address_kelurahan_id: mergedProfile.address_kelurahan_id || null,
            address_kodepos: mergedProfile.address_kodepos || null,
            address_lat: mergedProfile.address_lat || null,
            address_lng: mergedProfile.address_lng || null,
            address_detail: mergedProfile.address_detail || null,
            ktp_photo_url: mergedProfile.ktp_photo_url || null,
            ktp_selfie_url: mergedProfile.ktp_selfie_url || null,
            other_store_link: mergedProfile.other_store_link || null,
            warning_count: mergedProfile.warning_count || 0,
            suspend_until: mergedProfile.suspend_until || null,
            whatsapp: mergedProfile.whatsapp || null,
            penalty_points: mergedProfile.penalty_points || 0,
            last_penalty_decay: mergedProfile.last_penalty_decay || null
        };
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

        if (isUpdate) {
            supabaseClient.from('profiles').update(payload).eq('id', mergedProfile.id).then(({ error }) => {
                if (error) console.error("Error updating profile in Supabase:", error);
            });
        } else {
            supabaseClient.from('profiles').upsert(payload, { onConflict: 'id' }).then(({ error }) => {
                if (error) console.error("Error upserting profile in Supabase:", error);
            });
        }
    }

    // Email Notifications
    if (newStatus === 'pending' && oldStatus !== 'pending') {
      db.sendEmailNotification(
        'dafiyasinaddafi@gmail.com',
        `[Admin RetroHub] Pendaftaran Seller Baru: @${mergedProfile.store_name || 'anonim'}`,
        `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2.5px solid #000; border-radius: 6px; box-shadow: 4px 4px 0px #000; background: #FFFDF5;">
              <h2 style="color: #002FBE; border-bottom: 2px dashed #000; padding-bottom: 10px;">👤 Pendaftaran Seller Baru</h2>
              <p>Seorang pengguna telah mendaftar sebagai seller dan mengunggah berkas KTP:</p>
              <ul>
                  <li>Username: <strong>@${mergedProfile.store_name}</strong></li>
                  <li>Nama Lengkap: <strong>${mergedProfile.full_name}</strong></li>
                  <li>Email: <strong>${mergedProfile.email}</strong></li>
              </ul>
              <p>Harap segera login ke Panel Admin RetroHub untuk memverifikasi foto KTP & Selfie pengguna ini.</p>
              <br>
              <p>Panel Admin: <a href="${window.location.origin}/admin.html" target="_blank">Verifikasi Seller</a></p>
          </div>
        `
      );
    } else if (newStatus === 'active' && oldStatus === 'pending') {
      db.sendEmailNotification(
        mergedProfile.email,
        `[RetroHub] Pendaftaran Seller Disetujui! 🎉`,
        `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2.5px solid #000; border-radius: 6px; box-shadow: 4px 4px 0px #000; background: #FFFDF5;">
              <h2 style="color: #166534; border-bottom: 2px dashed #000; padding-bottom: 10px;">🎉 Pengajuan Seller Disetujui</h2>
              <p>Halo <strong>@${mergedProfile.store_name}</strong>,</p>
              <p>Kabar gembira! Berkas pendaftaran KTP Anda telah diverifikasi dan <strong>DISETUJUI</strong> oleh tim Admin RetroHub.</p>
              <p>Anda sekarang resmi menjadi Seller dan dapat mulai mendaftarkan koleksi mainan Anda (Sale/Lelang) melalui halaman <strong>SellerHub</strong>.</p>
              <br>
              <p>Mulai Berjualan: <a href="${window.location.origin}/seller.html" target="_blank">Masuk SellerHub</a></p>
          </div>
        `
      );
    } else if (newStatus === null && oldStatus === 'pending') {
      db.sendEmailNotification(
        mergedProfile.email,
        `[RetroHub] Pendaftaran Seller Ditolak ❌`,
        `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2.5px solid #000; border-radius: 6px; box-shadow: 4px 4px 0px #000; background: #FFFDF5;">
              <h2 style="color: #E52521; border-bottom: 2px dashed #000; padding-bottom: 10px;">❌ Pengajuan Seller Ditolak</h2>
              <p>Halo <strong>${mergedProfile.full_name}</strong>,</p>
              <p>Mohon maaf, pengajuan pendaftaran seller Anda (toko @${mergedProfile.store_name}) ditolak karena berkas KTP atau foto selfie kurang jelas / tidak sesuai ketentuan.</p>
              <p>Silakan upload kembali foto KTP dan selfie pegang KTP yang lebih terang dan terbaca jelas melalui halaman SellerHub.</p>
              <br>
              <p>Ajukan Ulang: <a href="${window.location.origin}/seller.html" target="_blank">Ajukan Ulang Berkas</a></p>
          </div>
        `
      );
    }

    return profile;
  },

  // CATEGORIES
  getCategories: () => JSON.parse(localStorage.getItem(DB_KEYS.CATEGORIES)) || [],
  saveCategory: (category) => {
    const categories = db.getCategories();
    if (!category.id) {
      const maxId = categories.reduce((max, c) => c.id > max ? c.id : max, 0);
      category.id = maxId + 1;
    }
    const index = categories.findIndex(c => c.id === category.id);
    if (index !== -1) {
      categories[index] = { ...categories[index], ...category };
    } else {
      categories.push(category);
    }
    localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(categories));

    // Supabase Sync
    if (!isSimMode && supabaseClient) {
        supabaseClient.from('categories').upsert({
            id: category.id,
            name: category.name,
            icon: category.icon || "",
            sub_categories: category.sub_categories || ["Umum"]
        }).then(({ error }) => {
            if (error) console.error("Error upserting category in Supabase:", error);
        });
    }

    return category;
  },

  // BANNERS
  getBanners: () => JSON.parse(localStorage.getItem(DB_KEYS.BANNERS)) || [],
  saveBanner: (banner) => {
    const banners = db.getBanners();
    banner.id = banner.id || 'banner-' + Date.now();
    const index = banners.findIndex(b => b.id === banner.id);
    if (index !== -1) {
      banners[index] = { ...banners[index], ...banner };
    } else {
      banners.push(banner);
    }
    localStorage.setItem(DB_KEYS.BANNERS, JSON.stringify(banners));
    return banner;
  },
  deleteBanner: (id) => {
    const banners = db.getBanners();
    const filtered = banners.filter(b => b.id !== id);
    localStorage.setItem(DB_KEYS.BANNERS, JSON.stringify(filtered));
  },


  // PRODUCTS
  getProducts: () => JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS)) || [],
  getProductById: (id) => db.getProducts().find(p => p.id === id),
  saveProduct: (product) => {
    const products = db.getProducts();
    if (product.id) {
      const existing = products.find(p => p.id === product.id);
      if (existing) {
        if (
          existing.title !== product.title ||
          existing.price !== product.price ||
          existing.starting_bid !== product.starting_bid ||
          existing.buyout_price !== product.buyout_price
        ) {
          throw new Error("Mengubah nama produk atau harga tidak diperbolehkan untuk mencegah manipulasi rating!");
        }
        const idx = products.findIndex(p => p.id === product.id);
        products[idx] = { ...existing, ...product };
        localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
        return products[idx];
      }
    }
    product.id = product.id || ((isSimMode || !supabase) ? 'prod-' + Date.now() : _generateUUID());
    product.status = product.status || 'active';
    product.wishlist_count = product.wishlist_count || 0;
    product.wishlisted_by = product.wishlisted_by || [];
    products.push(product);
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));

    // Supabase Sync
    if (!isSimMode && supabaseClient) {
        const payload = {
            id: product.id,
            seller_id: product.seller_id,
            title: product.title,
            description: product.description || "",
            category_id: Number(product.category_id),
            sub_category: product.sub_category || "Umum",
            condition: product.condition,
            transaction_type: product.transaction_type,
            weight_grams: Number(product.weight_grams) || 100,
            stock: Number(product.stock) || 1,
            image_url: product.image_url || null,
            image_urls: product.image_urls || product.images || null,
            discount_percent: Number(product.discount_percent) || 0,
            price: product.price !== undefined && product.price !== null ? Number(product.price) : null,
            starting_bid: product.starting_bid !== undefined && product.starting_bid !== null ? Number(product.starting_bid) : null,
            bid_increment: product.bid_increment !== undefined && product.bid_increment !== null ? Number(product.bid_increment) : null,
            buyout_price: product.buyout_price !== undefined && product.buyout_price !== null ? Number(product.buyout_price) : null,
            duration_hours: Number(product.duration_hours) || 24,
            auction_end_time: product.auction_end_time || null,
            status: product.status
        };
        supabaseClient.from('products').insert(payload).then(({ error }) => {
            if (error) {
                console.error("Error inserting product in Supabase:", error);
                alert(`⚠️ Gagal menyimpan produk ke database cloud Supabase!\n\nDetail: ${error.message}\n\nPeriksa apakah status seller Anda sudah disetujui oleh admin.`);
            }
        });
    }

    return product;
  },
  updateProductStatus: (id, status) => {
    const products = db.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index].status = status;
      localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));

      // Supabase Sync
      if (!isSimMode && supabaseClient) {
          supabaseClient.from('products').update({ status }).eq('id', id).then(({ error }) => {
              if (error) {
                  console.error("Error updating product status in Supabase:", error);
                  alert(`⚠️ Gagal memperbarui status produk di database cloud!\n\nDetail: ${error.message}`);
              }
          });
      }
    }
  },

  // EDIT PRODUK OLEH SELLER (deskripsi, stok, harga) — judul, foto, & jenis transaksi TIDAK BISA diedit
  editProduct: (productId, actorId, updates) => {
    const products = db.getProducts();
    const idx = products.findIndex(p => p.id === productId);
    if (idx === -1) throw new Error("Produk tidak ditemukan.");
    const existing = products[idx];

    const actorProfile = db.getProfileById(actorId);
    const isAdmin = actorProfile && actorProfile.is_admin;
    if (existing.seller_id !== actorId && !isAdmin) {
      throw new Error("Anda tidak memiliki izin untuk mengedit produk ini.");
    }

    // Field terkunci: judul, foto, jenis transaksi, dan field internal lain tidak boleh diubah lewat fitur ini
    const allowedFields = ['description', 'stock', 'price', 'starting_bid', 'bid_increment', 'buyout_price', 'weight_grams', 'sub_category', 'condition'];
    const cleanUpdates = {};
    allowedFields.forEach(f => { if (updates[f] !== undefined) cleanUpdates[f] = updates[f]; });

    // Cek histori order produk ini (untuk aturan batas perubahan harga)
    const hasOrders = db.getOrders().some(o => o.product_id === productId);

    // Validasi perubahan harga: bebas jika belum ada histori order, maks +/-50% jika sudah ada
    const priceFields = ['price', 'starting_bid', 'bid_increment', 'buyout_price'];
    priceFields.forEach(field => {
      if (cleanUpdates[field] !== undefined && existing[field] !== undefined && existing[field] !== null) {
        const oldVal = Number(existing[field]);
        const newVal = Number(cleanUpdates[field]);
        if (hasOrders && oldVal > 0) {
          if (newVal > oldVal * 1.5 || newVal < oldVal * 0.5) {
            throw new Error(`Perubahan harga maksimal naik/turun 50% dari harga sebelumnya (Rp${oldVal.toLocaleString('id-ID')}) karena produk ini sudah memiliki histori transaksi.`);
          }
        }
        cleanUpdates[field] = newVal;
      }
    });

    // Handle stok — hanya berlaku untuk produk tipe 'sale'
    if (cleanUpdates.stock !== undefined) {
      if (existing.transaction_type !== 'sale') {
        delete cleanUpdates.stock; // lelang: stok tidak berlaku, selalu 1
      } else {
        const newStock = Math.max(0, Math.floor(Number(cleanUpdates.stock)) || 0);
        cleanUpdates.stock = newStock;

        if (newStock === 0 && existing.status === 'active') {
          // Seller sengaja set stok ke 0 (bukan karena laku) -> sembunyikan dari etalase, JANGAN tampil sebagai "Habis"
          cleanUpdates.status = 'inactive';
        } else if (newStock > 0 && (existing.status === 'inactive' || existing.status === 'sold')) {
          // Restock -> tampilkan kembali di etalase
          cleanUpdates.status = 'active';
        }
      }
    }

    products[idx] = { ...existing, ...cleanUpdates };
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));

    // Supabase Sync
    if (!isSimMode && supabaseClient) {
        const payload = {};
        // Kolom yang valid di tabel products Supabase (exclude field lokal-only)
        const validSupabaseFields = [
            'description', 'price', 'starting_bid', 'bid_increment',
            'buyout_price', 'weight_grams', 'sub_category', 'condition',
            'status', 'stock', 'image_url', 'image_urls', 'discount_percent'
        ];
        Object.keys(cleanUpdates).forEach(f => {
            if (validSupabaseFields.includes(f)) payload[f] = cleanUpdates[f];
        });
        if (Object.keys(payload).length > 0) {
            supabaseClient.from('products').update(payload).eq('id', productId).then(({ error }) => {
                if (error) console.error("Error editing product in Supabase:", error);
            });
        }
    }

    return products[idx];
  },

  deleteProduct: (productId, actorId) => {
    const products = db.getProducts();
    const idx = products.findIndex(p => p.id === productId);
    if (idx === -1) throw new Error("Produk tidak ditemukan.");
    const existing = products[idx];

    const actorProfile = db.getProfileById(actorId);
    const isAdmin = actorProfile && actorProfile.is_admin;
    if (existing.seller_id !== actorId && !isAdmin) {
      throw new Error("Anda tidak memiliki izin untuk menghapus produk ini.");
    }

    const filtered = products.filter(p => p.id !== productId);
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(filtered));

    // Lakukan soft-delete di Supabase (status = 'deleted') agar tidak melanggar foreign key constraint
    if (!isSimMode && supabaseClient) {
        supabaseClient.from('products').update({ status: 'deleted' }).eq('id', productId).then(({ error }) => {
            if (error) {
                console.error("Error soft-deleting product in Supabase:", error);
                alert(`⚠️ Gagal menghapus produk di database cloud!\n\nDetail: ${error.message}`);
            }
        });
    }

    window.dispatchEvent(new CustomEvent('retrohub_product_deleted', { detail: { id: productId } }));
    return true;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // WISHLIST — menyimpan produk per user + harga saat disimpan
  // ─────────────────────────────────────────────────────────────────────────
  _getWishlistStore: () => JSON.parse(localStorage.getItem(DB_KEYS.WISHLIST) || '{}'),
  _saveWishlistStore: (store) => localStorage.setItem(DB_KEYS.WISHLIST, JSON.stringify(store)),

  toggleWishlist: (productId, userId) => {
    if (!userId) return null;
    const products = db.getProducts();
    const pIdx = products.findIndex(p => p.id === productId);
    if (pIdx === -1) return null;
    const p = products[pIdx];

    // Update wishlisted_by di produk (untuk counter)
    p.wishlisted_by = p.wishlisted_by || [];
    const uIdx = p.wishlisted_by.indexOf(userId);
    const isAdding = uIdx === -1;
    if (isAdding) {
      p.wishlisted_by.push(userId);
      p.wishlist_count = (p.wishlist_count || 0) + 1;
    } else {
      p.wishlisted_by.splice(uIdx, 1);
      p.wishlist_count = Math.max(0, p.wishlist_count - 1);
    }
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));

    // Simpan/hapus di wishlist store dengan snapshot harga
    const store = db._getWishlistStore();
    if (!store[userId]) store[userId] = {};
    if (isAdding) {
      store[userId][productId] = {
        price_at_save: p.price || p.starting_bid || 0,
        saved_at: new Date().toISOString(),
      };
    } else {
      delete store[userId][productId];
    }
    db._saveWishlistStore(store);
    return { product: p, isAdding };
  },

  isWishlisted: (productId, userId) => {
    if (!userId) return false;
    const store = db._getWishlistStore();
    return !!(store[userId] && store[userId][productId]);
  },

  getWishlistProducts: (userId) => {
    if (!userId) return [];
    const store = db._getWishlistStore();
    const userStore = store[userId] || {};
    const productIds = Object.keys(userStore);
    return productIds.map(id => {
      const p = db.getProductById(id);
      if (!p) return null;
      return { ...p, _price_at_save: userStore[id].price_at_save, _saved_at: userStore[id].saved_at };
    }).filter(Boolean);
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NOTIFIKASI — in-app notifications (wishlist alerts, order updates, dll)
  // ─────────────────────────────────────────────────────────────────────────
  getNotifications: (userId) => {
    if (!userId) return [];
    const all = JSON.parse(localStorage.getItem(DB_KEYS.NOTIFICATIONS) || '{}');
    return (all[userId] || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  addNotification: (userId, { type, message, product_id = null, url = null }) => {
    if (!userId) return;
    const all = JSON.parse(localStorage.getItem(DB_KEYS.NOTIFICATIONS) || '{}');
    if (!all[userId]) all[userId] = [];
    all[userId].unshift({
      id: 'notif-' + Date.now(),
      type, // 'wishlist_price_drop' | 'wishlist_auction_ending' | 'order' | 'info'
      message,
      product_id,
      url,
      read: false,
      created_at: new Date().toISOString(),
    });
    // Simpan max 50 notif per user
    all[userId] = all[userId].slice(0, 50);
    localStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify(all));
  },

  markNotificationsRead: (userId) => {
    if (!userId) return;
    const all = JSON.parse(localStorage.getItem(DB_KEYS.NOTIFICATIONS) || '{}');
    if (all[userId]) all[userId].forEach(n => n.read = true);
    localStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify(all));
  },

  getUnreadNotifCount: (userId) => {
    if (!userId) return 0;
    return db.getNotifications(userId).filter(n => !n.read).length;
  },

  // Cek wishlist saat app dibuka — bandingkan harga sekarang vs harga saat disimpan
  checkWishlistAlerts: (userId) => {
    if (!userId) return;
    const store = db._getWishlistStore();
    const userStore = store[userId] || {};
    const now = new Date();

    Object.entries(userStore).forEach(([productId, saved]) => {
      const p = db.getProductById(productId);
      if (!p || p.status !== 'active') return;

      // Alert harga turun (>5%)
      const currentPrice = p.price || p.starting_bid || 0;
      const savedPrice = saved.price_at_save || 0;
      if (savedPrice > 0 && currentPrice < savedPrice * 0.95) {
        const selisih = savedPrice - currentPrice;
        db.addNotification(userId, {
          type: 'wishlist_price_drop',
          message: `💸 Harga "${p.title}" turun Rp${selisih.toLocaleString('id-ID')} dari harga saat kamu simpan!`,
          product_id: productId,
          url: `product.html?id=${productId}`,
        });
        // Update harga tersimpan supaya tidak notif berulang
        store[userId][productId].price_at_save = currentPrice;
        db._saveWishlistStore(store);
      }

      // Alert lelang hampir berakhir (< 2 jam)
      if (p.transaction_type === 'lelang' && p.auction_end_time) {
        const endTime = new Date(p.auction_end_time);
        const hoursLeft = (endTime - now) / 1000 / 3600;
        if (hoursLeft > 0 && hoursLeft < 2) {
          db.addNotification(userId, {
            type: 'wishlist_auction_ending',
            message: `⏳ Lelang "${p.title}" di wishlist-mu berakhir dalam ${Math.ceil(hoursLeft * 60)} menit!`,
            product_id: productId,
            url: `product.html?id=${productId}`,
          });
        }
      }
    });
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LOKASI USER — disimpan global, dipakai estimasi ongkir di semua halaman
  // ─────────────────────────────────────────────────────────────────────────
  getUserLocation: () => {
    const currentUserId = db.getCurrentUserId();
    if (currentUserId && currentUserId !== 'guest') {
      const profile = db.getProfileById(currentUserId);
      if (profile && profile.address_kecamatan) {
        return {
          provinsi: profile.address_provinsi,
          provinsi_id: profile.address_provinsi_id,
          kota: profile.address_kota,
          kota_id: profile.address_kota_id,
          kecamatan: profile.address_kecamatan,
          kecamatan_id: profile.address_kecamatan_id
        };
      }
    }
    return JSON.parse(localStorage.getItem(DB_KEYS.USER_LOCATION) || 'null');
  },

  setUserLocation: (loc) => {
    // loc = { provinsi, provinsi_id, kota, kota_id, kecamatan, kecamatan_id }
    localStorage.setItem(DB_KEYS.USER_LOCATION, JSON.stringify(loc));

    const currentUserId = db.getCurrentUserId();
    if (currentUserId && currentUserId !== 'guest') {
      const profiles = JSON.parse(localStorage.getItem(DB_KEYS.PROFILES) || '[]');
      const index = profiles.findIndex(p => p.id === currentUserId);
      if (index !== -1) {
        profiles[index].address_provinsi = loc.provinsi;
        profiles[index].address_provinsi_id = loc.provinsi_id;
        profiles[index].address_kota = loc.kota;
        profiles[index].address_kota_id = loc.kota_id;
        profiles[index].address_kecamatan = loc.kecamatan;
        profiles[index].address_kecamatan_id = loc.kecamatan_id;
        localStorage.setItem(DB_KEYS.PROFILES, JSON.stringify(profiles));
      }
      
      if (!isSimMode && supabaseClient) {
        const payload = {
          address_provinsi: loc.provinsi,
          address_provinsi_id: loc.provinsi_id,
          address_kota: loc.kota,
          address_kota_id: loc.kota_id,
          address_kecamatan: loc.kecamatan,
          address_kecamatan_id: loc.kecamatan_id
        };
        supabaseClient.from('profiles').update(payload).eq('id', currentUserId)
          .then(({ error }) => {
            if (error) console.error('[RetroHub] Gagal sinkronisasi lokasi ke Supabase:', error);
            else console.log('[RetroHub] Lokasi disinkronkan ke Supabase profile.');
          });
      }
    }
  },

  clearUserLocation: () => {
    localStorage.removeItem(DB_KEYS.USER_LOCATION);

    const currentUserId = db.getCurrentUserId();
    if (currentUserId && currentUserId !== 'guest') {
      const profiles = JSON.parse(localStorage.getItem(DB_KEYS.PROFILES) || '[]');
      const index = profiles.findIndex(p => p.id === currentUserId);
      if (index !== -1) {
        profiles[index].address_provinsi = null;
        profiles[index].address_provinsi_id = null;
        profiles[index].address_kota = null;
        profiles[index].address_kota_id = null;
        profiles[index].address_kecamatan = null;
        profiles[index].address_kecamatan_id = null;
        localStorage.setItem(DB_KEYS.PROFILES, JSON.stringify(profiles));
      }
      
      if (!isSimMode && supabaseClient) {
        const payload = {
          address_provinsi: null,
          address_provinsi_id: null,
          address_kota: null,
          address_kota_id: null,
          address_kecamatan: null,
          address_kecamatan_id: null
        };
        supabaseClient.from('profiles').update(payload).eq('id', currentUserId)
          .then(({ error }) => {
            if (error) console.error('[RetroHub] Gagal membersihkan lokasi di Supabase:', error);
          });
      }
    }
  },

  // CART (Keranjang - Khusus Direct Sale)
  getCart: () => {
    let rawCart = [];
    const currentUserId = db.getCurrentUserId();
    if (currentUserId && currentUserId !== 'guest') {
      const profile = db.getProfileById(currentUserId);
      if (profile && profile.cart_items) {
        try {
          rawCart = Array.isArray(profile.cart_items) ? profile.cart_items : JSON.parse(profile.cart_items);
        } catch (e) {
          rawCart = [];
        }
      }
    } else {
      rawCart = JSON.parse(localStorage.getItem(DB_KEYS.CART)) || [];
    }

    // Normalisasi format string lama menjadi format objek baru [{ productId, quantity }]
    return (Array.isArray(rawCart) ? rawCart : []).map(item => {
      if (typeof item === 'string') {
        return { productId: item, quantity: 1 };
      } else if (item && item.productId) {
        return { productId: item.productId, quantity: Number(item.quantity) || 1 };
      }
      return null;
    }).filter(Boolean);
  },

  addToCart: (productId, quantityToAdd = 1) => {
    const cart = db.getCart();
    const product = db.getProductById(productId);
    const currentUserId = db.getCurrentUserId();
    const user = currentUserId ? db.getProfileById(currentUserId) : null;
    
    if (user && ((user.suspend_until && new Date(user.suspend_until) > new Date()) || (user.penalty_points && user.penalty_points >= 6))) {
      alert("Akun Anda ditangguhkan (suspend/penalti), tidak dapat menambah barang ke keranjang!");
      return false;
    }
    
    if (!product || product.transaction_type !== 'sale') {
      alert("Hanya barang tipe Jualan (Sale) yang bisa dimasukkan keranjang!");
      return false;
    }

    const maxStock = Number(product.stock) || 1;
    const existingItem = cart.find(i => i.productId === productId);
    if (existingItem) {
      // Increment quantity if stock permits
      const targetQty = existingItem.quantity + quantityToAdd;
      if (targetQty <= maxStock) {
        existingItem.quantity = targetQty;
        if (typeof showToast === 'function') {
            showToast("Keranjang Diperbarui 🛒", `Jumlah "${product.title}" ditambah menjadi ${existingItem.quantity}.`, "success");
        } else {
            alert(`Jumlah "${product.title}" di keranjang ditambah menjadi ${existingItem.quantity}.`);
        }
      } else {
        alert(`Stok maksimal barang ini (${maxStock} pcs) sudah dimasukkan keranjang!`);
        return false;
      }
    } else {
      const targetQty = Math.min(quantityToAdd, maxStock);
      cart.push({ productId: productId, quantity: targetQty });
      if (typeof showToast === 'function') {
          showToast("Ditambahkan 🛒", `"${product.title}" berhasil dimasukkan ke keranjang.`, "success");
      } else {
          alert(`"${product.title}" berhasil dimasukkan ke keranjang.`);
      }
    }

    localStorage.setItem(DB_KEYS.CART, JSON.stringify(cart));

    // Sinkronisasi ke profil jika login
    if (currentUserId && currentUserId !== 'guest') {
      const profiles = JSON.parse(localStorage.getItem(DB_KEYS.PROFILES) || '[]');
      const index = profiles.findIndex(p => p.id === currentUserId);
      if (index !== -1) {
        profiles[index].cart_items = cart;
        localStorage.setItem(DB_KEYS.PROFILES, JSON.stringify(profiles));
      }
      
      if (!isSimMode && supabaseClient) {
        supabaseClient.from('profiles').update({ cart_items: cart }).eq('id', currentUserId)
          .then(({ error }) => {
            if (error) console.error('[RetroHub] Gagal sinkronisasi keranjang ke Supabase:', error);
          });
      }
    }
    return true;
  },

  removeFromCart: (productId) => {
    let cart = db.getCart();
    cart = cart.filter(item => item.productId !== productId);
    localStorage.setItem(DB_KEYS.CART, JSON.stringify(cart));

    const currentUserId = db.getCurrentUserId();
    if (currentUserId && currentUserId !== 'guest') {
      const profiles = JSON.parse(localStorage.getItem(DB_KEYS.PROFILES) || '[]');
      const index = profiles.findIndex(p => p.id === currentUserId);
      if (index !== -1) {
        profiles[index].cart_items = cart;
        localStorage.setItem(DB_KEYS.PROFILES, JSON.stringify(profiles));
      }
      
      if (!isSimMode && supabaseClient) {
        supabaseClient.from('profiles').update({ cart_items: cart }).eq('id', currentUserId)
          .then(({ error }) => {
            if (error) console.error('[RetroHub] Gagal sinkronisasi hapus keranjang ke Supabase:', error);
          });
      }
    }
  },

  updateCartQuantity: (productId, quantity) => {
    let cart = db.getCart();
    const item = cart.find(i => i.productId === productId);
    if (item) {
      const prod = db.getProductById(productId);
      const maxStock = prod ? (Number(prod.stock) || 1) : 999;
      item.quantity = Math.max(1, Math.min(maxStock, quantity));
      localStorage.setItem(DB_KEYS.CART, JSON.stringify(cart));

      const currentUserId = db.getCurrentUserId();
      if (currentUserId && currentUserId !== 'guest') {
        const profiles = JSON.parse(localStorage.getItem(DB_KEYS.PROFILES) || '[]');
        const index = profiles.findIndex(p => p.id === currentUserId);
        if (index !== -1) {
          profiles[index].cart_items = cart;
          localStorage.setItem(DB_KEYS.PROFILES, JSON.stringify(profiles));
        }
        
        if (!isSimMode && supabaseClient) {
          supabaseClient.from('profiles').update({ cart_items: cart }).eq('id', currentUserId)
            .then(({ error }) => {
              if (error) console.error('[RetroHub] Gagal sinkronisasi update qty ke Supabase:', error);
            });
        }
      }
    }
  },

  clearCart: () => {
    localStorage.setItem(DB_KEYS.CART, JSON.stringify([]));
    const currentUserId = db.getCurrentUserId();
    if (currentUserId && currentUserId !== 'guest') {
      const profiles = JSON.parse(localStorage.getItem(DB_KEYS.PROFILES) || '[]');
      const index = profiles.findIndex(p => p.id === currentUserId);
      if (index !== -1) {
        profiles[index].cart_items = [];
        localStorage.setItem(DB_KEYS.PROFILES, JSON.stringify(profiles));
      }
      
      if (!isSimMode && supabaseClient) {
        supabaseClient.from('profiles').update({ cart_items: [] }).eq('id', currentUserId)
          .then(({ error }) => {
            if (error) console.error('[RetroHub] Gagal sinkronisasi bersihkan keranjang ke Supabase:', error);
          });
      }
    }
  },

  // BIDS (Lelang)
  getBids: () => JSON.parse(localStorage.getItem(DB_KEYS.BIDS)) || [],
  getBidsByProductId: (productId) => db.getBids().filter(b => b.product_id === productId).sort((a,b) => b.amount - a.amount),
  placeBid: (productId, bidderId, amount) => {
    const bids = db.getBids();
    const bidder = db.getProfileById(bidderId);
    
    if (bidder && ((bidder.suspend_until && new Date(bidder.suspend_until) > new Date()) || (bidder.penalty_points && bidder.penalty_points >= 6))) {
      alert("Akun Anda ditangguhkan (suspend/penalti), tidak dapat melakukan bid!");
      return null;
    }

    const newBid = {
      id: (isSimMode || !supabase) ? 'bid-' + Date.now() : _generateUUID(),
      product_id: productId,
      bidder_id: bidderId,
      bidder_name: bidder ? '@' + bidder.store_name : '@anonim',
      amount: parseFloat(amount),
      created_at: new Date().toISOString()
    };
    bids.push(newBid);
    localStorage.setItem(DB_KEYS.BIDS, JSON.stringify(bids));

    // Supabase Sync
    if (!isSimMode && supabaseClient) {
        supabaseClient.from('bids').insert({
            id: newBid.id,
            product_id: productId,
            bidder_id: bidderId,
            amount: parseFloat(amount),
            created_at: newBid.created_at
        }).then(({ error }) => {
            if (error) console.error("Error inserting bid in Supabase:", error);
        });
    }

    return newBid;
  },

  // TARIF ONGKIR REAL LOOKUP
  // originInfo / destInfo (opsional): { provinsi, kota, lat, lng } - dipakai untuk fallback
  // zona pulau & estimasi jarak saat kombinasi kecamatan tidak ada di REAL_SHIPPING_RATES.
  getRealShippingRate: (originKec, destKec, weightGrams, courier, originInfo = null, destInfo = null) => {
    const weightKg = Math.max(1, Math.ceil(weightGrams / 1000));
    const c = (courier || 'jnt').toLowerCase();
    let rates = null;

    if (REAL_SHIPPING_RATES[originKec] && REAL_SHIPPING_RATES[originKec][destKec]) {
      rates = REAL_SHIPPING_RATES[originKec][destKec];
    } else if (originInfo && destInfo) {
      // Fallback nasional: tentukan zona berdasarkan provinsi/kota asal & tujuan
      const zone = resolveShippingZone(originInfo, destInfo);
      rates = ZONE_SHIPPING_RATES[zone];

      // Jika tersedia koordinat lengkap, tambahkan biaya jarak (Rp 1.500 / 100km)
      if (originInfo.lat && originInfo.lng && destInfo.lat && destInfo.lng) {
        const distanceKm = haversineKm(
          parseFloat(originInfo.lat), parseFloat(originInfo.lng),
          parseFloat(destInfo.lat), parseFloat(destInfo.lng)
        );
        const distanceSurcharge = Math.round(distanceKm / 100) * 1500;
        rates = { jnt: rates.jnt + distanceSurcharge, pos: rates.pos + distanceSurcharge };
      }
    } else {
      // Fallback paling akhir jika info wilayah tidak tersedia sama sekali
      rates = { jnt: 19000, pos: 15000 };
    }

    const perKgPrice = c === 'jnt' ? rates.jnt : rates.pos;
    return weightKg * perKgPrice;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ESTIMASI ONGKIR (untuk tampilan saat browsing — 0 biaya API)
  // Menggunakan PROVINCE_REGION + resolveShippingZone + ZONE_SHIPPING_RATES
  // yang sudah ada di db.js. Angka ditampilkan sebagai "estimasi".
  // ─────────────────────────────────────────────────────────────────────────
  estimateOngkirByProvinsi: (originProvinsi, destProvinsi, weightGrams) => {
    const zone  = resolveShippingZone(
      { provinsi: originProvinsi },
      { provinsi: destProvinsi }
    );
    const tarif = ZONE_SHIPPING_RATES[zone] || ZONE_SHIPPING_RATES['jawa-luar'];
    const weightKg = Math.max(1, Math.ceil(weightGrams / 1000));
    // Ambil nilai tengah JNT & POS sebagai range estimasi
    const mid = Math.round(((tarif.jnt + tarif.pos) / 2) * weightKg / 1000) * 1000;
    const min = Math.round(tarif.pos * weightKg / 1000) * 1000;
    const max = Math.round(tarif.jnt * weightKg * 1.2 / 1000) * 1000;
    return {
      min,
      max,
      label: `~Rp${min.toLocaleString('id-ID')}–${max.toLocaleString('id-ID')}`,
    };
  },

  // Fallback estimasi via koordinat (jika provinsi tidak diketahui)
  estimateOngkirByCoords: (originLatLng, destLatLng, weightGrams) => {
    const weightKg = Math.max(1, Math.ceil(weightGrams / 1000));
    if (!originLatLng || !destLatLng) return { min: 15000, max: 45000, label: '~Rp15.000–45.000' };
    const distanceKm = haversineKm(originLatLng.lat, originLatLng.lng, destLatLng.lat, destLatLng.lng);
    const base = 9000 + Math.round(distanceKm / 50) * 800;
    const cost = weightKg * base;
    const min = Math.round(cost * 0.85 / 1000) * 1000;
    const max = Math.round(cost * 1.15 / 1000) * 1000;
    return { min, max, label: `~Rp${min.toLocaleString('id-ID')}–${max.toLocaleString('id-ID')}` };
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ONGKIR REAL-TIME via Cloudflare Function → Biteship
  // Dipanggil HANYA saat user konfirmasi checkout (1 request per transaksi).
  // API key Biteship ada di Cloudflare env, tidak ada di kode ini.
  // ─────────────────────────────────────────────────────────────────────────
  fetchRealOngkirAPI: async (originKodepos, destKodepos, weightGrams) => {
    try {
      const resp = await fetch(SHIPPING_API_CONFIG.checkoutEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin_postal_code:      originKodepos,
          destination_postal_code: destKodepos,
          weight_gram:             weightGrams,
          couriers:                SHIPPING_API_CONFIG.couriers,
        }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const result = await resp.json();

      if (result.success && Array.isArray(result.data)) {
        return result.data; // array kurir dari Biteship
      }
      throw new Error(result.error || 'Respons tidak valid dari /api/ongkir');

    } catch (err) {
      console.warn('[RetroHub] Ongkir real-time gagal, tampilkan estimasi:', err);
      return null; // caller wajib handle null dengan tampilkan estimasi
    }
  },

  // ORDERS
  // getOrders: deduplikasi otomatis jika ada ID duplikat (self-healing untuk data corrupted)
  getOrders: () => {
    const raw = JSON.parse(localStorage.getItem(DB_KEYS.ORDERS)) || [];
    // Dedup: per ID, simpan yang paling baru (created_at terbesar)
    const map = new Map();
    raw.forEach(o => {
      const existing = map.get(o.id);
      if (!existing || new Date(o.created_at) > new Date(existing.created_at)) {
        map.set(o.id, o);
      }
    });
    return Array.from(map.values());
  },
  // getOrderById: cari dengan prioritas status 'waiting_payment' jika ada duplikat di raw data
  getOrderById: (id) => {
    const raw = JSON.parse(localStorage.getItem(DB_KEYS.ORDERS)) || [];
    const matches = raw.filter(o => o.id === id);
    if (matches.length === 0) return undefined;
    if (matches.length === 1) return matches[0];
    // Duplikat: prioritas waiting_payment, fallback ke terbaru
    return matches.find(o => o.status === 'waiting_payment')
      || matches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  },
  createOrder: (order) => {
    const buyer = db.getProfileById(order.buyer_id);
    if (buyer && ((buyer.suspend_until && new Date(buyer.suspend_until) > new Date()) || (buyer.penalty_points && buyer.penalty_points >= 6))) {
      throw new Error("Akun pembeli sedang ditangguhkan karena pelanggaran!");
    }

    const orders = db.getOrders();
    order.id = order.id || ((isSimMode || !supabase) ? _nextOrderId() : _generateUUID());
    order.status = order.status || 'waiting_payment';
    order.created_at = order.created_at || new Date().toISOString();
    
    // Normalisasi harga
    if (order.price_deal !== undefined && order.price === undefined) {
      order.price = order.price_deal;
    } else if (order.price !== undefined && order.price_deal === undefined) {
      order.price_deal = order.price;
    }
    
    // Normalisasi kurir
    if (order.shipping_courier !== undefined && order.courier === undefined) {
      order.courier = order.shipping_courier;
    } else if (order.courier !== undefined && order.shipping_courier === undefined) {
      order.shipping_courier = order.courier;
    }
    
    // Cari judul produk jika kosong
    const product = db.getProductById(order.product_id);
    if (product && !order.product_title) {
      order.product_title = product.title;
    }

    // Normalisasi jumlah (quantity)
    order.quantity = Math.max(1, parseInt(order.quantity, 10) || 1);

    // Snapshot deskripsi & foto produk saat order dibuat (terkunci, tidak ikut berubah jika seller edit produk nanti)
    if (product) {
      if (order.product_description === undefined) order.product_description = product.description || '';
      if (order.product_image_url === undefined) order.product_image_url = product.image_url || (Array.isArray(product.images) ? product.images[0] : '') || '';
    }
    
    // Cari nama seller jika kosong
    const seller = db.getProfileById(order.seller_id);
    if (seller && !order.seller_name) {
      order.seller_name = '@' + seller.store_name;
    }
    
    // Cari nama buyer jika kosong
    if (buyer && !order.buyer_name) {
      order.buyer_name = '@' + buyer.store_name;
    }
    
    orders.push(order);
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));

    // Tandai produk: LELANG tetap pakai mekanisme 'reserved' (1 unit, deadline 24 jam, kontrol seller).
    // SALE: kurangi stok sebanyak quantity; jika stok habis -> status 'sold' (Habis). Kedaluwarsa per-order
    // ditangani di checkExpiredReservations() yang akan mengembalikan stok jika buyer tidak bayar.
    if (order.product_id && order.status === 'waiting_payment') {
      const products = db.getProducts();
      const pIdx = products.findIndex(p => p.id === order.product_id);
      if (pIdx !== -1) {
        const isLelang = products[pIdx].transaction_type === 'lelang';

        if (isLelang) {
          if (products[pIdx].status === 'active') {
            products[pIdx].status = 'reserved';
            products[pIdx].reserved_until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            products[pIdx].reserved_order_id = order.id;
            localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));

            if (!isSimMode && supabaseClient) {
                supabaseClient.from('products').update({ status: 'reserved' }).eq('id', order.product_id).then();
            }
          }
        } else {
          // Atomic stock decrement via Supabase RPC (anti-race condition antar device)
          if (!isSimMode && supabaseClient) {
            supabaseClient.rpc('decrement_product_stock', {
              p_product_id: order.product_id,
              p_quantity:   order.quantity || 1
            }).then(({ data, error }) => {
              if (error) {
                // RPC belum ada / error → fallback: fetch fresh lalu update
                console.warn('[RetroHub] decrement_product_stock RPC gagal, fallback manual:', error.message);
                supabaseClient.from('products').select('stock, status').eq('id', order.product_id).single()
                  .then(({ data: fp }) => {
                    const freshStock = fp ? Number(fp.stock) : Number(products[pIdx].stock);
                    const newStock   = Math.max(0, (isNaN(freshStock) ? 1 : freshStock) - (order.quantity || 1));
                    const newStatus  = newStock <= 0 ? 'sold' : (fp ? fp.status : products[pIdx].status);
                    supabaseClient.from('products').update({ stock: newStock, status: newStatus }).eq('id', order.product_id).then();
                    _updateLocalProductStock(order.product_id, newStock, newStatus);
                  });
                return;
              }
              // RPC berhasil — update localStorage dari hasil RPC
              if (data && data.length > 0) {
                _updateLocalProductStock(order.product_id, data[0].new_stock, data[0].new_status);
              }
            });
          } else {
            // Sim mode: kurangi dari localStorage langsung
            const currentStock = Number(products[pIdx].stock);
            const newStock = Math.max(0, (isNaN(currentStock) ? 1 : currentStock) - (order.quantity || 1));
            products[pIdx].stock  = newStock;
            if (newStock <= 0) products[pIdx].status = 'sold';
            localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
            window.dispatchEvent(new CustomEvent('retrohub_product_updated', { detail: { ...products[pIdx] } }));
          }
        }
      }
    }

    // Supabase Sync
    if (!isSimMode && supabaseClient) {
        const payload = {
            id: order.id,
            product_id: order.product_id,
            buyer_id: order.buyer_id,
            seller_id: order.seller_id,
            price_deal: Number(order.price_deal || order.price),
            quantity: Number(order.quantity || 1),
            product_title: order.product_title || null,
            product_description: order.product_description || null,
            product_image_url: order.product_image_url || null,
            seller_name: order.seller_name || null,
            buyer_name: order.buyer_name || null,
            shipping_cost: Number(order.shipping_cost || 0),
            admin_fee: Number(order.admin_fee || 5000),
            total_payment: Number(order.total_payment || 0),
            payment_status: order.payment_status || 'pending',
            shipping_courier: order.shipping_courier || order.courier || 'jnt',
            shipping_address: order.shipping_address || null,
            recipient_name: order.recipient_name || null,
            recipient_phone: order.recipient_phone || null,
            buyer_notes: order.buyer_notes || null,
            tracking_number: order.tracking_number || null,
            status: order.status,
            created_at: order.created_at
        };
        supabaseClient.from('orders').insert(payload).then(({ error }) => {
            if (error) {
                console.error('[RetroHub] Supabase order insert FAILED:', error.message);
                alert(`⚠️ Gagal mengirim pesanan ke database cloud Supabase!\n\nDetail: ${error.message}`);
            } else {
                console.log('[RetroHub] Order synced to Supabase:', payload.id);
            }
        });
    }

    return order;
  },
  updateOrderStatus: (id, status) => {
    const orders = db.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index].status = status;
      const updates = { status };
      if (status === 'delivered') {
        orders[index].delivered_at = new Date().toISOString();
        updates.delivered_at = orders[index].delivered_at;

        db.sendPrivateChat(
          'admin-demo',
          orders[index].buyer_id,
          `📬 Paket pesanan #${id} ("${orders[index].product_title}") telah tiba di tujuan. Silakan cek barang Anda dan klik "Konfirmasi Terima" jika semua sudah sesuai.`
        );
      }
      if (status === 'completed') {
        orders[index].completed_at = new Date().toISOString();
        updates.completed_at = orders[index].completed_at;

        // Tandai produk sebagai TERJUAL permanen
        const products = db.getProducts();
        const pIdx = products.findIndex(p => p.id === orders[index].product_id);
        if (pIdx !== -1) {
          products[pIdx].status = 'sold';
          localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
          if (!isSimMode && supabaseClient) {
              supabaseClient.from('products').update({ status: 'sold' }).eq('id', orders[index].product_id).then();
          }
        }

        db.sendPrivateChat(
          'admin-demo',
          orders[index].buyer_id,
          `🎉 Transaksi pesanan #${id} ("${orders[index].product_title}") telah selesai. Terima kasih telah berbelanja di RetroHub!`
        );
        db.sendPrivateChat(
          'admin-demo',
          orders[index].seller_id,
          `🎉 Transaksi pesanan #${id} ("${orders[index].product_title}") telah selesai. Dana penjualan sebesar Rp${orders[index].price_deal.toLocaleString('id-ID')} telah dicairkan ke saldo toko Anda.`
        );
      }
      if (status === 'disputed') {
        db.sendPrivateChat(
          'admin-demo',
          orders[index].buyer_id,
          `⚠️ Komplain Anda untuk pesanan #${id} ("${orders[index].product_title}") telah diajukan. Dana ditahan sementara oleh sistem selagi admin memediasi sengketa ini.`
        );
        db.sendPrivateChat(
          'admin-demo',
          orders[index].seller_id,
          `⚠️ Pembeli mengajukan komplain untuk pesanan #${id} ("${orders[index].product_title}"). Dana transaksi ditahan sementara menunggu keputusan mediasi admin.`
        );
      }
      if (status === 'refunded') {
        orders[index].refunded_at = new Date().toISOString();
        const amount = Number(orders[index].price_deal || orders[index].price || 0) + Number(orders[index].shipping_cost || 0);
        db.refundToBuyerWallet(orders[index].buyer_id, amount);

        db.sendPrivateChat(
          'admin-demo',
          orders[index].buyer_id,
          `💵 Dana pesanan #${id} sebesar Rp${amount.toLocaleString('id-ID')} telah direfund sepenuhnya ke Wallet Anda.`
        );
        db.sendPrivateChat(
          'admin-demo',
          orders[index].seller_id,
          `🚫 Transaksi pesanan #${id} ("${orders[index].product_title}") dibatalkan/refunded. Dana dikembalikan ke Wallet pembeli.`
        );
      }
      localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));

      // Supabase Sync
      if (!isSimMode && supabaseClient) {
          supabaseClient.from('orders').update(updates).eq('id', id).then(({ error }) => {
              if (error) {
                  console.error('[RetroHub] Error updating order status in Supabase:', error);
              } else {
                  // Broadcast ke sisi lain secara realtime
                  window.dispatchEvent(new CustomEvent('retrohub_order_updated', {
                      detail: { ...orders[index] }
                  }));
              }
          });
      } else {
          window.dispatchEvent(new CustomEvent('retrohub_order_updated', { detail: { ...orders[index] } }));
      }

      // Email Notifications
      const order = orders[index];
      const buyer = db.getProfileById(order.buyer_id);
      const seller = db.getProfileById(order.seller_id);

      if (status === 'delivered') {
        db.sendEmailNotification(
          buyer ? buyer.email : null,
          `[RetroHub] Pesanan Tiba di Tujuan: Order #${order.id}`,
          `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2.5px solid #000; border-radius: 6px; box-shadow: 4px 4px 0px #000; background: #FFFDF5;">
                <h2 style="color: #065F46; border-bottom: 2px dashed #000; padding-bottom: 10px;">📬 Paket Telah Tiba</h2>
                <p>Halo <strong>@${buyer ? buyer.store_name : 'buyer'}</strong>,</p>
                <p>Kabar baik! Paket pesanan Anda <strong>${order.product_title}</strong> (Order #${order.id}) telah tiba di alamat tujuan.</p>
                <p>Harap periksa kelengkapan mainan Anda. Jika sesuai, segera klik tombol <strong>Konfirmasi Terima</strong> pada aplikasi untuk meneruskan dana ke penjual.</p>
                <br>
                <p>Terima kasih,<br>Tim RetroHub</p>
            </div>
          `
        );
      } else if (status === 'completed') {
        db.sendEmailNotification(
          seller ? seller.email : null,
          `[RetroHub] Transaksi Selesai & Dana Dicairkan: Order #${order.id}`,
          `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2.5px solid #000; border-radius: 6px; box-shadow: 4px 4px 0px #000; background: #FFFDF5;">
                <h2 style="color: #166534; border-bottom: 2px dashed #000; padding-bottom: 10px;">🎉 Transaksi Selesai!</h2>
                <p>Halo <strong>@${seller ? seller.store_name : 'seller'}</strong>,</p>
                <p>Pembeli telah mengkonfirmasi penerimaan pesanan <strong>${order.product_title}</strong> (Order #${order.id}).</p>
                <p>Dana penjualan sebesar <strong>Rp${order.price_deal.toLocaleString('id-ID')}</strong> telah masuk ke saldo toko Anda dan dapat dicairkan (withdraw) kapan saja.</p>
                <br>
                <p>Terima kasih telah menggunakan RetroHub!<br>Tim RetroHub</p>
            </div>
          `
        );
      } else if (status === 'disputed') {
        db.sendEmailNotification(
          'dafiyasinaddafi@gmail.com',
          `[Admin RetroHub] Sengketa Baru Diajukan: Order #${order.id}`,
          `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2.5px solid #000; border-radius: 6px; box-shadow: 4px 4px 0px #000; background: #FFFDF5;">
                <h2 style="color: #DC2626; border-bottom: 2px dashed #000; padding-bottom: 10px;">⚠️ Pengajuan Sengketa Baru</h2>
                <p>Telah diajukan sengketa/komplain baru oleh pembeli untuk transaksi berikut:</p>
                <ul>
                    <li>Order ID: <strong>${order.id}</strong></li>
                    <li>Produk: <strong>${order.product_title}</strong></li>
                    <li>Pembeli: <strong>@${buyer ? buyer.store_name : 'buyer'}</strong></li>
                    <li>Penjual: <strong>@${seller ? seller.store_name : 'seller'}</strong></li>
                </ul>
                <p>Harap segera login ke Panel Admin RetroHub untuk memeriksa video bukti unboxing pembeli dan video packing penjual, serta memediasi percakapan mereka.</p>
                <br>
                <p>Panel Admin: <a href="${window.location.origin}/admin.html" target="_blank">Pusat Dispute Admin</a></p>
            </div>
          `
        );
        db.sendEmailNotification(
          buyer ? buyer.email : null,
          `[RetroHub] Komplain Anda Diterima: Order #${order.id}`,
          `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2.5px solid #000; border-radius: 6px; box-shadow: 4px 4px 0px #000; background: #FFFDF5;">
                <h2 style="color: #DC2626; border-bottom: 2px dashed #000; padding-bottom: 10px;">⚠️ Komplain Sedang Diproses</h2>
                <p>Halo <strong>@${buyer ? buyer.store_name : 'buyer'}</strong>,</p>
                <p>Komplain Anda untuk pesanan <strong>${order.product_title}</strong> (Order #${order.id}) telah kami terima.</p>
                <p>Dana transaksi saat ini ditahan sementara oleh sistem rekber RetroHub. Tim admin sedang meninjau video bukti yang diunggah dan akan menyelesaikan sengketa ini segera.</p>
                <br>
                <p>Terima kasih atas kesabaran Anda,<br>Tim RetroHub</p>
            </div>
          `
        );
        db.sendEmailNotification(
          seller ? seller.email : null,
          `[RetroHub] Komplain Transaksi Masuk: Order #${order.id}`,
          `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2.5px solid #000; border-radius: 6px; box-shadow: 4px 4px 0px #000; background: #FFFDF5;">
                <h2 style="color: #DC2626; border-bottom: 2px dashed #000; padding-bottom: 10px;">⚠️ Komplain Diajukan Pembeli</h2>
                <p>Halo <strong>@${seller ? seller.store_name : 'seller'}</strong>,</p>
                <p>Pembeli telah mengajukan komplain/sengketa untuk pesanan <strong>${order.product_title}</strong> (Order #${order.id}).</p>
                <p>Dana transaksi ditahan sementara oleh sistem rekber RetroHub. Admin sedang melakukan investigasi berdasarkan video unboxing pembeli dan video packing Anda. Harap membalas intervensi admin jika ada pertanyaan lebih lanjut.</p>
                <br>
                <p>Terima kasih,<br>Tim RetroHub</p>
            </div>
          `
        );
      }

      return orders[index];
    }
    return null;
  },

  // SELLER MENERIMA PESANAN (mulai dikemas) — setelah ini buyer tidak bisa membatalkan sepihak
  acceptOrder: (orderId, actorId) => {
    const orders = db.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;
    const order = orders[index];

    // Hanya seller pesanan atau admin yang boleh menerima
    const actorProfile = db.getProfileById(actorId);
    const isAdmin = actorProfile && actorProfile.is_admin;
    if (order.seller_id !== actorId && !isAdmin) return null;

    // Hanya berlaku untuk pesanan yang sudah dibayar dan belum diterima/dikemas
    if (order.status !== 'to_ship' || order.seller_accepted_at) return null;

    orders[index].seller_accepted_at = new Date().toISOString();
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));

    // Supabase Sync
    if (!isSimMode && supabaseClient) {
        supabaseClient.from('orders').update({
            seller_accepted_at: orders[index].seller_accepted_at
        }).eq('id', orderId).then(({ error }) => {
            if (error) console.error("Error accepting order in Supabase:", error);
        });
    }

    // Notifikasi ke buyer
    db.sendPrivateChat(
      'admin-demo',
      order.buyer_id,
      `📦 Penjual telah menerima & mulai mengemas pesanan #${orderId}. Mulai saat ini pesanan tidak dapat dibatalkan sepihak — hubungi penjual via chat jika ada masalah.`
    );

    return orders[index];
  },

  confirmPayment: (id) => {
    const orders = db.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index].status = 'to_ship';
      orders[index].paid_at = new Date().toISOString();
      localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));

      // Supabase Sync
      if (!isSimMode && supabaseClient) {
          supabaseClient.from('orders').update({
              status: 'to_ship',
              payment_status: 'paid',
              paid_at: orders[index].paid_at
          }).eq('id', id).then(({ error }) => {
              if (error) {
                  console.error('[RetroHub] Supabase confirmPayment FAILED:', error.message, error.hint);
              } else {
                  console.log('[RetroHub] Payment confirmed in Supabase:', id);
                  window.dispatchEvent(new CustomEvent('retrohub_order_updated', { detail: { ...orders[index] } }));
              }
          });
      } else {
          window.dispatchEvent(new CustomEvent('retrohub_order_updated', { detail: { ...orders[index] } }));
      }

      // Email notifications
      const order = orders[index];
      const buyer = db.getProfileById(order.buyer_id);
      const seller = db.getProfileById(order.seller_id);

      db.sendEmailNotification(
        buyer ? buyer.email : null,
        `[RetroHub] Pembayaran Berhasil: Order #${order.id}`,
        `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2.5px solid #000; border-radius: 6px; box-shadow: 4px 4px 0px #000; background: #FFFDF5;">
              <h2 style="color: #166534; border-bottom: 2px dashed #000; padding-bottom: 10px;">💳 Pembayaran Berhasil</h2>
              <p>Halo <strong>@${buyer ? buyer.store_name : 'buyer'}</strong>,</p>
              <p>Terima kasih! Pembayaran Anda untuk pesanan <strong>${order.product_title}</strong> (Order #${order.id}) sebesar <strong>Rp${order.total_payment.toLocaleString('id-ID')}</strong> telah berhasil diverifikasi oleh sistem rekber RetroHub.</p>
              <p>Penjual telah kami beri tahu untuk segera mengemas dan mengirimkan pesanan Anda.</p>
              <br>
              <p>Terima kasih,<br>Tim RetroHub</p>
          </div>
        `
      );

      db.sendEmailNotification(
        seller ? seller.email : null,
        `[RetroHub] Pesanan Baru Masuk! Perlu Dikirim: Order #${order.id}`,
        `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2.5px solid #000; border-radius: 6px; box-shadow: 4px 4px 0px #000; background: #FFFDF5;">
              <h2 style="color: #002FBE; border-bottom: 2px dashed #000; padding-bottom: 10px;">📦 Ada Pesanan Baru!</h2>
              <p>Halo <strong>@${seller ? seller.store_name : 'seller'}</strong>,</p>
              <p>Pembeli <strong>@${buyer ? buyer.store_name : 'buyer'}</strong> telah menyelesaikan pembayaran rekber untuk produk <strong>${order.product_title}</strong> (Order #${order.id}).</p>
              <p>Harap segera kemas produk Anda dan serahkan ke kurir J&T. Masukkan nomor resi pengiriman melalui halaman SellerHub dalam waktu <strong>48 jam</strong>.</p>
              <p style="color: #E52521; font-weight: bold;">Tenggat Input Resi: ${new Date(Date.now() + 48*3600*1000).toLocaleString('id-ID')}</p>
              <br>
              <p>Selamat berjualan!<br>Tim RetroHub</p>
          </div>
        `
      );

      return orders[index];
    }
    return null;
  },

  updateOrderTracking: (id, trackingNumber) => {
    const orders = db.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index].tracking_number = trackingNumber;
      orders[index].status = 'shipping';
      orders[index].shipped_at = new Date().toISOString();
      localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));

      // Supabase Sync
      if (!isSimMode && supabaseClient) {
          supabaseClient.from('orders').update({
              tracking_number: trackingNumber,
              status: 'shipping'
          }).eq('id', id).then(({ error }) => {
              if (error) console.error("Error updating order tracking in Supabase:", error);
          });
      }

      // Email notifications
      const order = orders[index];
      const buyer = db.getProfileById(order.buyer_id);
      const seller = db.getProfileById(order.seller_id);

      db.sendEmailNotification(
        buyer ? buyer.email : null,
        `[RetroHub] Pesanan Anda Telah Dikirim! Order #${order.id}`,
        `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2.5px solid #000; border-radius: 6px; box-shadow: 4px 4px 0px #000; background: #FFFDF5;">
              <h2 style="color: #C2410C; border-bottom: 2px dashed #000; padding-bottom: 10px;">🚚 Pesanan Sedang Dikirim</h2>
              <p>Halo <strong>@${buyer ? buyer.store_name : 'buyer'}</strong>,</p>
              <p>Pesanan Anda <strong>${order.product_title}</strong> telah dikirim oleh penjual <strong>@${seller ? seller.store_name : 'seller'}</strong>.</p>
              <p><strong>Detail Pengiriman:</strong></p>
              <ul>
                  <li>Kurir: <strong>${(order.shipping_courier || 'JNT').toUpperCase()}</strong></li>
                  <li>Nomor Resi: <strong>${trackingNumber}</strong></li>
              </ul>
              <p>Anda dapat memantau status pengiriman di halaman pesanan Anda.</p>
              <br>
              <p>Terima kasih,<br>Tim RetroHub</p>
          </div>
        `
      );

      db.sendPrivateChat(
        'admin-demo',
        order.buyer_id,
        `🚚 Pesanan #${order.id} ("${order.product_title}") telah dikirim oleh penjual dengan nomor resi ${trackingNumber} (${(order.shipping_courier || 'JNT').toUpperCase()}). Silakan pantau pengiriman Anda.`
      );

      return orders[index];
    }
    return null;
  },

  // CANCEL ORDER
  cancelOrder: (orderId, cancelledBy, reason) => {
    const orders = db.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return null;
    const order = orders[idx];
    const allowedStatuses = ['waiting_payment', 'to_ship'];
    if (!allowedStatuses.includes(order.status)) return null;

    // Proteksi: buyer tidak bisa membatalkan sepihak setelah seller menerima/mengemas pesanan
    if (cancelledBy === order.buyer_id && order.status === 'to_ship' && order.seller_accepted_at) {
      return null;
    }

    // Apply automatic penalties
    if (order.status === 'waiting_payment') {
      if (cancelledBy === order.seller_id || cancelledBy === 'system') {
        const buyerProfile = db.getProfileById(order.buyer_id);
        if (buyerProfile) {
          buyerProfile.penalty_points = (buyerProfile.penalty_points || 0) + 1;
          if (!buyerProfile.last_penalty_decay || buyerProfile.penalty_points === 1) {
            buyerProfile.last_penalty_decay = new Date().toISOString();
          }
          db.saveProfile(buyerProfile);
          db.sendPrivateChat(
            'admin-demo',
            order.buyer_id,
            `⚠️ Peringatan Penalti: Anda mendapatkan penalti 1 poin karena pesanan #${orderId} dibatalkan (tidak dibayar/kedaluwarsa). Total penalti Anda: ${buyerProfile.penalty_points}/6.`
          );
        }
      }
    } else if (order.status === 'to_ship') {
      if (cancelledBy === order.seller_id || cancelledBy === 'system') {
        const sellerProfile = db.getProfileById(order.seller_id);
        if (sellerProfile) {
          sellerProfile.penalty_points = (sellerProfile.penalty_points || 0) + 1;
          if (!sellerProfile.last_penalty_decay || sellerProfile.penalty_points === 1) {
            sellerProfile.last_penalty_decay = new Date().toISOString();
          }
          db.saveProfile(sellerProfile);
          db.sendPrivateChat(
            'admin-demo',
            order.seller_id,
            `⚠️ Peringatan Penalti: Anda mendapatkan penalti 1 poin karena pesanan #${orderId} dibatalkan oleh Anda/Sistem saat berstatus dikemas (gagal fulfill). Total penalti Anda: ${sellerProfile.penalty_points}/6.`
          );
        }
      }
    }

    if (order.status === 'to_ship' || order.status === 'shipping' || order.status === 'delivered' || order.status === 'disputed') {
      const amount = Number(order.price_deal || order.price || 0) + Number(order.shipping_cost || 0);
      db.refundToBuyerWallet(order.buyer_id, amount);
    }
    orders[idx].status = 'cancelled';
    orders[idx].cancelled_at = new Date().toISOString();
    orders[idx].cancelled_by = cancelledBy;
    orders[idx].cancel_reason = reason || 'Dibatalkan oleh ' + cancelledBy;
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));

    // Kembalikan produk: SALE -> kembalikan stok; LELANG -> kembalikan ke active/ended
    const products = db.getProducts();
    const pIdx = products.findIndex(p => p.id === order.product_id);
    if (pIdx !== -1) {
      const isLelang = products[pIdx].transaction_type === 'lelang';

      if (isLelang) {
        if (products[pIdx].status === 'reserved' || products[pIdx].status === 'sold') {
          const end = new Date(products[pIdx].auction_end_time);
          products[pIdx].status = (end <= new Date()) ? 'ended' : 'active';
          delete products[pIdx].reserved_until;
          delete products[pIdx].reserved_order_id;
          localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));

          if (!isSimMode && supabaseClient) {
              supabaseClient.from('products').update({ status: products[pIdx].status }).eq('id', order.product_id).then();
          }
        }
      } else {
        // SALE: kembalikan stok via RPC atomic increment (anti-race condition)
        delete products[pIdx].reserved_until;
        delete products[pIdx].reserved_order_id;

        if (!isSimMode && supabaseClient) {
            supabaseClient.rpc('increment_product_stock', {
              p_product_id: order.product_id,
              p_quantity:   order.quantity || 1
            }).then(({ data, error }) => {
              if (error) {
                // Fallback manual
                console.warn('[RetroHub] increment_product_stock RPC gagal, fallback:', error.message);
                const currentStock = Number(products[pIdx].stock) || 0;
                const newStock = currentStock + (order.quantity || 1);
                supabaseClient.from('products').update({
                    stock: newStock,
                    status: newStock > 0 ? 'active' : products[pIdx].status
                }).eq('id', order.product_id).then();
                _updateLocalProductStock(order.product_id, newStock, newStock > 0 ? 'active' : products[pIdx].status);
                return;
              }
              if (data && data.length > 0) {
                _updateLocalProductStock(order.product_id, data[0].new_stock, data[0].new_status);
              }
            });
        } else {
          // Sim mode
          const currentStock = Number(products[pIdx].stock) || 0;
          const newStock = currentStock + (order.quantity || 1);
          products[pIdx].stock = newStock;
          if (newStock > 0 && products[pIdx].status === 'sold') products[pIdx].status = 'active';
          localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
          window.dispatchEvent(new CustomEvent('retrohub_product_updated', { detail: { ...products[pIdx] } }));
        }
      }
    }

    // Supabase Sync Order status — kirim semua field cancel sekaligus
    if (!isSimMode && supabaseClient) {
        supabaseClient.from('orders').update({
            status: 'cancelled',
            cancelled_at: orders[idx].cancelled_at,
            cancelled_by: String(cancelledBy),
            cancel_reason: reason || ''
        }).eq('id', orderId).then(({ error }) => {
            if (error) {
                console.error('[RetroHub] Error cancelling order in Supabase:', error);
            } else {
                // Broadcast ke sisi lain (seller/buyer) via realtime setelah Supabase sync
                window.dispatchEvent(new CustomEvent('retrohub_order_updated', {
                    detail: { ...orders[idx], status: 'cancelled' }
                }));
            }
        });
    } else {
        // Mode simulasi: tetap dispatch event agar panel seller/buyer ikut refresh
        window.dispatchEvent(new CustomEvent('retrohub_order_updated', {
            detail: { ...orders[idx], status: 'cancelled' }
        }));
    }

    // Email notifications
    const buyer = db.getProfileById(order.buyer_id);
    const seller = db.getProfileById(order.seller_id);
    const notifierName = cancelledBy === order.buyer_id ? 'pembeli' : (cancelledBy === order.seller_id ? 'penjual' : 'sistem');

    db.sendEmailNotification(
      buyer ? buyer.email : null,
      `[RetroHub] Pesanan Dibatalkan: Order #${order.id}`,
      `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2.5px solid #000; border-radius: 6px; box-shadow: 4px 4px 0px #000; background: #FFFDF5;">
            <h2 style="color: #DC2626; border-bottom: 2px dashed #000; padding-bottom: 10px;">🚫 Pesanan Dibatalkan</h2>
            <p>Halo <strong>@${buyer ? buyer.store_name : 'buyer'}</strong>,</p>
            <p>Pesanan Anda untuk produk <strong>${order.product_title}</strong> (Order #${order.id}) telah <strong>DIBATALKAN</strong> oleh <strong>${notifierName}</strong>.</p>
            <p><strong>Alasan:</strong> ${reason}</p>
            <p>Jika Anda sudah melakukan pembayaran, dana Anda telah dikembalikan secara penuh ke <strong>Dompet Refund (Wallet)</strong> akun RetroHub Anda.</p>
            <br>
            <p>Terima kasih,<br>Tim RetroHub</p>
        </div>
      `
    );

    db.sendEmailNotification(
      seller ? seller.email : null,
      `[RetroHub] Pesanan Dibatalkan: Order #${order.id}`,
      `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2.5px solid #000; border-radius: 6px; box-shadow: 4px 4px 0px #000; background: #FFFDF5;">
            <h2 style="color: #DC2626; border-bottom: 2px dashed #000; padding-bottom: 10px;">🚫 Pesanan Dibatalkan</h2>
            <p>Halo <strong>@${seller ? seller.store_name : 'seller'}</strong>,</p>
            <p>Pesanan untuk produk Anda <strong>${order.product_title}</strong> (Order #${order.id}) telah <strong>DIBATALKAN</strong> oleh <strong>${notifierName}</strong>.</p>
            <p><strong>Alasan:</strong> ${reason}</p>
            <p style="color: #E52521;">Status produk telah diperbarui sesuai kondisi transaksi lelang/jualan agar dapat diproses kembali.</p>
            <br>
            <p>Terima kasih,<br>Tim RetroHub</p>
        </div>
      `
    );

    // Chat notifications
    const refundAmount = (order.status === 'to_ship' || order.status === 'shipping' || order.status === 'delivered' || order.status === 'disputed')
      ? (Number(order.price_deal || order.price || 0) + Number(order.shipping_cost || 0))
      : 0;

    let buyerMsg = `🚫 Pesanan #${order.id} ("${order.product_title}") telah dibatalkan oleh ${cancelledBy === order.buyer_id ? 'Anda' : (cancelledBy === order.seller_id ? 'penjual' : 'sistem')}. Alasan: ${reason || '-'}.`;
    if (refundAmount > 0) {
      buyerMsg += ` Dana sebesar Rp${refundAmount.toLocaleString('id-ID')} telah dikembalikan ke Wallet Anda.`;
    }
    
    let sellerMsg = `🚫 Pesanan #${order.id} ("${order.product_title}") telah dibatalkan oleh ${cancelledBy === order.seller_id ? 'Anda' : (cancelledBy === order.buyer_id ? 'pembeli' : 'sistem')}. Alasan: ${reason || '-'}.`;

    db.sendPrivateChat('admin-demo', order.buyer_id, buyerMsg);
    db.sendPrivateChat('admin-demo', order.seller_id, sellerMsg);

    return orders[idx];
  },

  // CEK & EXPIRE RESERVASI YANG KEDALUWARSA
  checkExpiredReservations: () => {
    const now = new Date();
    const products = db.getProducts();
    const orders = db.getOrders();
    let productsChanged = false;
    let ordersChanged = false;

    // 1. Cek reservasi barang yang belum dibayar (batas 6 jam)
    products.forEach((p, i) => {
      if (p.status === 'reserved' && p.reserved_until && new Date(p.reserved_until) < now) {
        // Skip auto-expiration for auctions (lelang) because it is up to the seller to decide
        if (p.transaction_type === 'lelang') return;

        const orderIdx = orders.findIndex(o => o.id === p.reserved_order_id && o.status === 'waiting_payment');
        if (orderIdx !== -1) {
          orders[orderIdx].status = 'expired';
          orders[orderIdx].cancelled_at = now.toISOString();
          ordersChanged = true;
          
          const buyerProfile = db.getProfileById(orders[orderIdx].buyer_id);
          if (buyerProfile) {
            buyerProfile.penalty_points = (buyerProfile.penalty_points || 0) + 1;
            if (!buyerProfile.last_penalty_decay || buyerProfile.penalty_points === 1) {
              buyerProfile.last_penalty_decay = now.toISOString();
            }
            db.saveProfile(buyerProfile);
            db.sendPrivateChat('admin-demo', orders[orderIdx].buyer_id,
              `⏰ Pesanan ${orders[orderIdx].id} telah KEDALUWARSA karena tidak dibayar dalam 6 jam. Produk kembali tersedia di katalog. Anda mendapatkan penalti 1 poin.`);
          } else {
            db.sendPrivateChat('admin-demo', orders[orderIdx].buyer_id,
              `⏰ Pesanan ${orders[orderIdx].id} telah KEDALUWARSA karena tidak dibayar dalam 6 jam. Produk kembali tersedia di katalog.`);
          }
        }
        products[i].status = 'active';
        delete products[i].reserved_until;
        delete products[i].reserved_order_id;
        productsChanged = true;
      }
    });

    // 1b. Cek pesanan SALE (bukan lelang) yang belum dibayar (batas 6 jam) -> kedaluwarsa & kembalikan stok
    orders.forEach((o, i) => {
      if (o.status === 'waiting_payment') {
        const pIdx = products.findIndex(p => p.id === o.product_id);
        if (pIdx === -1 || products[pIdx].transaction_type === 'lelang') return;

        const createdTime = new Date(o.created_at);
        const elapsedMs = now - createdTime;
        const limitMs = 6 * 60 * 60 * 1000; // 6 jam

        if (elapsedMs >= limitMs) {
          orders[i].status = 'expired';
          orders[i].cancelled_at = now.toISOString();
          ordersChanged = true;

          // Kembalikan stok ke produk
          const newStock = (Number(products[pIdx].stock) || 0) + (o.quantity || 1);
          products[pIdx].stock = newStock;
          if (newStock > 0 && products[pIdx].status === 'sold') {
            products[pIdx].status = 'active';
          }
          productsChanged = true;

          // Penalti buyer
          const buyerProfile = db.getProfileById(o.buyer_id);
          if (buyerProfile) {
            buyerProfile.penalty_points = (buyerProfile.penalty_points || 0) + 1;
            if (!buyerProfile.last_penalty_decay || buyerProfile.penalty_points === 1) {
              buyerProfile.last_penalty_decay = now.toISOString();
            }
            db.saveProfile(buyerProfile);
            db.sendPrivateChat('admin-demo', o.buyer_id,
              `⏰ Pesanan ${o.id} telah KEDALUWARSA karena tidak dibayar dalam 6 jam. Produk kembali tersedia di katalog. Anda mendapatkan penalti 1 poin.`);
          } else {
            db.sendPrivateChat('admin-demo', o.buyer_id,
              `⏰ Pesanan ${o.id} telah KEDALUWARSA karena tidak dibayar dalam 6 jam. Produk kembali tersedia di katalog.`);
          }

          // Supabase Sync
          if (!isSimMode && supabaseClient) {
              supabaseClient.from('products').update({ stock: products[pIdx].stock, status: products[pIdx].status }).eq('id', products[pIdx].id).then();
              supabaseClient.from('orders').update({ status: 'expired' }).eq('id', o.id).then();
          }
        }
      }
    });

    // 2. Cek batas waktu input resi pengiriman oleh seller (batas 2x24 jam = 48 jam)
    orders.forEach((o, i) => {
      if (o.status === 'to_ship') {
        const paidTimeStr = o.paid_at || o.created_at;
        const paidTime = new Date(paidTimeStr);
        const elapsedMs = now - paidTime;
        const limitMs = 48 * 60 * 60 * 1000; // 2 x 24 jam dalam milidetik
        
        if (elapsedMs > limitMs) {
          // Refund to buyer wallet
          const amount = Number(o.price_deal || o.price || 0) + Number(o.shipping_cost || 0);
          db.refundToBuyerWallet(o.buyer_id, amount);

          orders[i].status = 'cancelled';
          orders[i].cancelled_at = now.toISOString();
          orders[i].cancelled_by = 'system';
          orders[i].cancel_reason = 'Dibatalkan otomatis oleh sistem karena penjual tidak menginput nomor resi dalam batas waktu 2x24 jam.';
          ordersChanged = true;

          const sellerProfile = db.getProfileById(o.seller_id);
          if (sellerProfile) {
            sellerProfile.penalty_points = (sellerProfile.penalty_points || 0) + 1;
            if (!sellerProfile.last_penalty_decay || sellerProfile.penalty_points === 1) {
              sellerProfile.last_penalty_decay = now.toISOString();
            }
            db.saveProfile(sellerProfile);
            db.sendPrivateChat('admin-demo', o.seller_id,
              `🚫 Pesanan #${o.id} ("${o.product_title}") dibatalkan otomatis oleh sistem karena Anda melebihi batas waktu input resi (2x24 jam). Anda mendapatkan penalti 1 poin.`);
          } else {
            db.sendPrivateChat('admin-demo', o.seller_id,
              `🚫 Pesanan #${o.id} ("${o.product_title}") dibatalkan otomatis oleh sistem karena Anda melebihi batas waktu input resi (2x24 jam).`);
          }

          const pIdx = products.findIndex(p => p.id === o.product_id);
          if (pIdx !== -1) {
            products[pIdx].status = 'active';
            delete products[pIdx].reserved_until;
            delete products[pIdx].reserved_order_id;
            productsChanged = true;
          }

          db.sendPrivateChat('admin-demo', o.buyer_id,
            `⚠️ Pesanan Anda #${o.id} ("${o.product_title}") telah dibatalkan otomatis dan dana Anda telah dikembalikan karena penjual tidak menginput resi dalam batas waktu 2x24 jam.`);
        }
      }
    });

    // 3. Auto update status: shipping -> delivered setelah 5x24 jam (estimasi realistis pengiriman seluruh Indonesia)
    orders.forEach((o, i) => {
      if (o.status === 'shipping' && o.shipped_at && !o.delivered_at) {
        const shippedTime = new Date(o.shipped_at);
        const elapsedMs = now - shippedTime;
        const limitMs = 5 * 24 * 60 * 60 * 1000; // 5 hari
        if (elapsedMs >= limitMs) {
          orders[i].status = 'delivered';
          orders[i].delivered_at = new Date(shippedTime.getTime() + limitMs).toISOString();
          ordersChanged = true;

          // Supabase Sync
          if (!isSimMode && supabaseClient) {
              supabaseClient.from('orders').update({
                  status: 'delivered',
                  delivered_at: orders[i].delivered_at
              }).eq('id', o.id).then(({ error }) => {
                  if (error) console.error("Error auto-updating order to delivered in Supabase:", error);
              });
          }
        }
      }
    });

    // 4. Auto-konfirmasi pesanan "delivered" jika buyer tidak konfirmasi/komplain dalam 2x24 jam
    orders.forEach((o, i) => {
      if (o.status === 'delivered' && o.delivered_at) {
        const deliveredTime = new Date(o.delivered_at);
        const elapsedMs = now - deliveredTime;
        const limitMs = 48 * 60 * 60 * 1000; // 2 x 24 jam dalam milidetik

        if (elapsedMs > limitMs) {
          orders[i].status = 'completed';
          orders[i].completed_at = now.toISOString();
          orders[i].completed_by = 'system';
          ordersChanged = true;

          db.sendPrivateChat('admin-demo', o.buyer_id,
            `🎉 Pesanan #${o.id} ("${o.product_title}") telah diselesaikan otomatis oleh sistem karena tidak ada konfirmasi/komplain dalam 2x24 jam sejak barang tiba. Dana telah diteruskan ke penjual.`);
          db.sendPrivateChat('admin-demo', o.seller_id,
            `🎉 Pesanan #${o.id} ("${o.product_title}") telah diselesaikan otomatis oleh sistem (pembeli tidak konfirmasi/komplain dalam 2x24 jam). Dana akan dicairkan ke akun Anda.`);

          // Supabase Sync
          if (!isSimMode && supabaseClient) {
              supabaseClient.from('orders').update({
                  status: 'completed',
                  completed_at: orders[i].completed_at
              }).eq('id', o.id).then(({ error }) => {
                  if (error) console.error("Error auto-completing order in Supabase:", error);
              });
          }
        }
      }
    });

    if (productsChanged) localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
    if (ordersChanged) localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));

    // Auto check expired auctions
    db.checkExpiredAuctions(now);
  },
  getDiscussions: () => JSON.parse(localStorage.getItem(DB_KEYS.DISCUSSIONS)) || [],
  getDiscussionsByProductId: (productId) => db.getDiscussions().filter(d => d.product_id === productId).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
  addDiscussionQuestion: (productId, userId, message) => {
    const discussions = db.getDiscussions();
    const user = db.getProfileById(userId);
    const newQuestion = {
      id: 'disc-' + Date.now(),
      product_id: productId,
      user_id: userId,
      user_name: user ? user.store_name : 'anonim',
      message: message,
      created_at: new Date().toISOString(),
      replies: []
    };
    discussions.push(newQuestion);
    localStorage.setItem(DB_KEYS.DISCUSSIONS, JSON.stringify(discussions));
    return newQuestion;
  },
  addDiscussionReply: (discussionId, userId, message) => {
    const discussions = db.getDiscussions();
    const index = discussions.findIndex(d => d.id === discussionId);
    if (index !== -1) {
      const user = db.getProfileById(userId);
      const newReply = {
        id: 'reply-' + Date.now(),
        user_id: userId,
        user_name: user ? user.store_name : 'anonim',
        message: message,
        created_at: new Date().toISOString()
      };
      discussions[index].replies = discussions[index].replies || [];
      discussions[index].replies.push(newReply);
      localStorage.setItem(DB_KEYS.DISCUSSIONS, JSON.stringify(discussions));
      return newReply;
    }
    return null;
  },

  // PRIVATE CHATS SYSTEM
  getChats: () => JSON.parse(localStorage.getItem(DB_KEYS.CHATS)) || [],
  getPrivateChats: (userA, userB) => {
    const chats = db.getChats();
    const filtered = chats.filter(c => 
      (c.sender_id === userA && c.receiver_id === userB) || 
      (c.sender_id === userB && c.receiver_id === userA)
    ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Tandai pesan sebagai dibaca jika dibuka oleh penerima
    let changed = false;
    const readIds = [];
    chats.forEach(c => {
      if (c.receiver_id === userA && c.sender_id === userB && !c.read) {
        c.read = true;
        changed = true;
        readIds.push(c.id);
      }
    });
    if (changed) {
      localStorage.setItem(DB_KEYS.CHATS, JSON.stringify(chats));

      // Sync status "read" ke Supabase agar tidak kembali jadi unread saat sync ulang
      if (!isSimMode && supabaseClient && readIds.length > 0) {
        supabaseClient.from('chat_messages').update({ read: true }).in('id', readIds).then(({ error }) => {
          if (error) console.error('Gagal sync status read chat:', error);
        });
      }
    }

    return filtered;
  },
  sendPrivateChat: (senderId, receiverId, message, mediaUrl = null, mediaType = null) => {
    const chats = db.getChats();
    const newChat = {
      id: (isSimMode || !supabase) ? 'chat-' + Date.now() : _generateUUID(),
      sender_id: senderId,
      receiver_id: receiverId,
      message: message,
      media_url: mediaUrl || null,
      media_type: mediaType || null, // 'image' | 'video'
      created_at: new Date().toISOString(),
      read: false
    };
    chats.push(newChat);
    localStorage.setItem(DB_KEYS.CHATS, JSON.stringify(chats));

    // Supabase Sync
    if (!isSimMode && supabaseClient) {
        let resolvedSenderId = senderId;
        let resolvedReceiverId = receiverId;

        // Resolve admin-demo ke UUID admin asli
        if (resolvedSenderId === 'admin-demo') {
            const profiles = JSON.parse(localStorage.getItem(DB_KEYS.PROFILES) || '[]');
            const adminProfile = profiles.find(p => p.is_admin === true);
            if (adminProfile) resolvedSenderId = adminProfile.id;
        }
        if (resolvedReceiverId === 'admin-demo') {
            const profiles = JSON.parse(localStorage.getItem(DB_KEYS.PROFILES) || '[]');
            const adminProfile = profiles.find(p => p.is_admin === true);
            if (adminProfile) resolvedReceiverId = adminProfile.id;
        }

        const _uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (_uuidRegex.test(resolvedSenderId) && _uuidRegex.test(resolvedReceiverId)) {
            // Construct roomId: 'buyerId_sellerId'
            const senderProf = db.getProfileById(resolvedSenderId);
            const receiverProf = db.getProfileById(resolvedReceiverId);
            let buyerId = resolvedSenderId;
            let sellerId = resolvedReceiverId;
            if (senderProf && senderProf.is_seller) {
                buyerId = resolvedReceiverId;
                sellerId = resolvedSenderId;
            } else if (receiverProf && receiverProf.is_seller) {
                buyerId = resolvedSenderId;
                sellerId = resolvedReceiverId;
            } else if (senderProf && senderProf.is_admin) {
                buyerId = resolvedReceiverId;
                sellerId = resolvedSenderId;
            }
            const roomId = buyerId + '_' + sellerId;

            const payload = {
                id: newChat.id,
                room_id: roomId,
                sender_id: resolvedSenderId,
                receiver_id: resolvedReceiverId,
                message_text: message,
                media_url: mediaUrl || null,
                media_type: mediaType || null,
                read: false,
                created_at: newChat.created_at
            };

            supabaseClient.from('chat_messages').insert(payload).then(({ error }) => {
                if (error) console.error("Error inserting chat message in Supabase:", error);
            });
        }
    }

    return newChat;
  },
  getChatConversations: (userId) => {
    const chats = db.getChats().filter(c => c.sender_id === userId || c.receiver_id === userId);
    const conversationsMap = {};

    chats.forEach(c => {
      const partnerId = c.sender_id === userId ? c.receiver_id : c.sender_id;
      if (!conversationsMap[partnerId]) {
        conversationsMap[partnerId] = [];
      }
      conversationsMap[partnerId].push(c);
    });

    const conversations = [];
    for (const partnerId in conversationsMap) {
      const partnerChats = conversationsMap[partnerId].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const partner = db.getProfileById(partnerId);
      const unreadCount = partnerChats.filter(c => c.receiver_id === userId && !c.read).length;
      
      conversations.push({
        partner_id: partnerId,
        partner_name: partner ? partner.store_name : 'User ' + partnerId,
        last_message: partnerChats[0].message,
        last_time: partnerChats[0].created_at,
        unread_count: unreadCount
      });
    }

    return conversations.sort((a, b) => new Date(b.last_time) - new Date(a.last_time));
  },
  getUnreadChatCountGlobal: (userId) => {
    if (!userId) return 0;
    return db.getChats().filter(c => c.receiver_id === userId && !c.read).length;
  },

  // REVIEWS
  getReviews: () => JSON.parse(localStorage.getItem(DB_KEYS.REVIEWS)) || [],
  getReviewsByProductId: (productId) => db.getReviews().filter(r => r.product_id === productId),
  hasUserReviewedOrder: (orderId) => db.getReviews().some(r => r.order_id === orderId),
  addReview: (review) => {
    const reviews = db.getReviews();
    if (reviews.some(r => r.order_id === review.order_id)) return null; // satu review per order
    review.id = 'rev-' + Date.now();
    review.created_at = new Date().toISOString();
    reviews.push(review);
    localStorage.setItem(DB_KEYS.REVIEWS, JSON.stringify(reviews));

    // Update rating seller (hitung ulang dari semua review produk seller tersebut)
    const sellerProducts = db.getProducts().filter(p => p.seller_id === review.seller_id).map(p => p.id);
    const sellerReviews = db.getReviews().filter(r => sellerProducts.includes(r.product_id) || r.seller_id === review.seller_id);
    if (sellerReviews.length > 0) {
      const avgRating = sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length;
      db.saveProfile({ id: review.seller_id, rating: Math.round(avgRating * 10) / 10, reviews_count: sellerReviews.length });
    }
    return review;
  },

  // PRODUCT VIEWS
  getProductViews: () => JSON.parse(localStorage.getItem('retrohub_views')) || {},
  incrementProductView: (productId) => {
    const views = db.getProductViews();
    views[productId] = (views[productId] || 0) + 1;
    localStorage.setItem('retrohub_views', JSON.stringify(views));
    return views[productId];
  },
  getProductViewCount: (productId) => (db.getProductViews()[productId] || 0),

  // Update order field (tambah notes, dll)
  updateOrderField: (orderId, fields) => {
    const orders = db.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      Object.assign(orders[idx], fields);
      localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));

      // Supabase Sync
      if (!isSimMode && supabaseClient) {
        supabaseClient.from('orders').update(fields).eq('id', orderId).then(({ error }) => {
          if (error) {
            console.error('[RetroHub] Error updating order fields in Supabase:', error);
          } else {
            // Trigger local event to notify other UI components if necessary
            window.dispatchEvent(new CustomEvent('retrohub_order_updated', {
              detail: { ...orders[idx] }
            }));
          }
        });
      }
      return orders[idx];
    }
    return null;
  },

  // WALLET & REFUNDS
  refundToBuyerWallet: (buyerId, amount) => {
    const profiles = db.getProfiles();
    const idx = profiles.findIndex(p => p.id === buyerId);
    if (idx !== -1) {
      const newBalance = (Number(profiles[idx].wallet_balance) || 0) + Number(amount);
      profiles[idx].wallet_balance = newBalance;
      localStorage.setItem(DB_KEYS.PROFILES, JSON.stringify(profiles));

      // Supabase Sync
      if (!isSimMode && supabaseClient) {
          supabaseClient.from('profiles').update({
              wallet_balance: newBalance
          }).eq('id', buyerId).then(({ error }) => {
              if (error) console.error("Error refunding to buyer wallet in Supabase:", error);
          });
      }
    }
  },

  // =============================================
  // BUKU ALAMAT PENGIRIMAN (Address Book)
  // =============================================
  getAddresses: (userId) => {
    const all = JSON.parse(localStorage.getItem(DB_KEYS.ADDRESSES) || '[]');
    return all.filter(a => a.user_id === userId);
  },

  addAddress: (userId, addr) => {
    const all = JSON.parse(localStorage.getItem(DB_KEYS.ADDRESSES) || '[]');
    const id = (isSimMode || !supabaseClient)
      ? 'addr-' + Date.now() + '-' + Math.random().toString(36).slice(2,6)
      : _generateUUID();
    const isFirst = all.filter(a => a.user_id === userId).length === 0;
    const newAddr = {
      id,
      user_id: userId,
      label: addr.label || 'Rumah',
      recipient_name: addr.recipient_name || '',
      recipient_phone: addr.recipient_phone || '',
      address_detail: addr.address_detail || '',
      kecamatan: addr.kecamatan || '',
      kota: addr.kota || '',
      provinsi: addr.provinsi || '',
      kode_pos: addr.kode_pos || '',
      patokan: addr.patokan || '',
      latitude: addr.latitude || null,
      longitude: addr.longitude || null,
      is_default: isFirst ? true : (addr.is_default || false),
      created_at: new Date().toISOString()
    };
    if (newAddr.is_default) {
      all.forEach(a => { if (a.user_id === userId) a.is_default = false; });
    }
    all.push(newAddr);
    localStorage.setItem(DB_KEYS.ADDRESSES, JSON.stringify(all));
    // Sync ke Supabase
    if (!isSimMode && supabaseClient) {
        supabaseClient.from('buyer_addresses').insert({
            id: newAddr.id,
            user_id: newAddr.user_id,
            label: newAddr.label,
            recipient_name: newAddr.recipient_name,
            recipient_phone: newAddr.recipient_phone,
            address_detail: newAddr.address_detail,
            kecamatan: newAddr.kecamatan || null,
            kota: newAddr.kota || null,
            provinsi: newAddr.provinsi || null,
            kode_pos: newAddr.kode_pos || null,
            patokan: newAddr.patokan || null,
            latitude: newAddr.latitude,
            longitude: newAddr.longitude,
            is_default: newAddr.is_default,
            created_at: newAddr.created_at
        }).then(({ error }) => {
            if (error) console.warn('[RetroHub] addAddress sync failed:', error.message);
        });
    }
    return newAddr;
  },

  updateAddress: (addrId, updates) => {
    const all = JSON.parse(localStorage.getItem(DB_KEYS.ADDRESSES) || '[]');
    const idx = all.findIndex(a => a.id === addrId);
    if (idx === -1) return null;
    const userId = all[idx].user_id;
    if (updates.is_default) {
      all.forEach(a => { if (a.user_id === userId) a.is_default = false; });
    }
    Object.assign(all[idx], updates);
    localStorage.setItem(DB_KEYS.ADDRESSES, JSON.stringify(all));
    if (!isSimMode && supabaseClient) {
        supabaseClient.from('buyer_addresses').update(updates).eq('id', addrId).then(({ error }) => {
            if (error) console.warn('[RetroHub] updateAddress sync failed:', error.message);
        });
    }
    return all[idx];
  },

  deleteAddress: (addrId) => {
    let all = JSON.parse(localStorage.getItem(DB_KEYS.ADDRESSES) || '[]');
    const addr = all.find(a => a.id === addrId);
    if (!addr) return false;
    all = all.filter(a => a.id !== addrId);
    const userAddrs = all.filter(a => a.user_id === addr.user_id);
    if (addr.is_default && userAddrs.length > 0) {
      const firstIdx = all.findIndex(a => a.id === userAddrs[0].id);
      if (firstIdx !== -1) all[firstIdx].is_default = true;
    }
    localStorage.setItem(DB_KEYS.ADDRESSES, JSON.stringify(all));
    if (!isSimMode && supabaseClient) {
        supabaseClient.from('buyer_addresses').delete().eq('id', addrId).then(({ error }) => {
            if (error) console.warn('[RetroHub] deleteAddress sync failed:', error.message);
        });
    }
    return true;
  },

  setDefaultAddress: (userId, addrId) => {
    const all = JSON.parse(localStorage.getItem(DB_KEYS.ADDRESSES) || '[]');
    all.forEach(a => { if (a.user_id === userId) a.is_default = (a.id === addrId); });
    localStorage.setItem(DB_KEYS.ADDRESSES, JSON.stringify(all));
    if (!isSimMode && supabaseClient) {
        // Set semua jadi false dulu, lalu set yang dipilih true
        const userAddrs = all.filter(a => a.user_id === userId);
        const resetPromises = userAddrs.map(a =>
            supabaseClient.from('buyer_addresses').update({ is_default: a.is_default }).eq('id', a.id)
        );
        Promise.all(resetPromises).catch(e => console.warn('[RetroHub] setDefaultAddress sync failed:', e));
    }
  },

  // =============================================
  // SISTEM KOMPLAIN / DISPUTE
  // =============================================
  getDisputes: () => JSON.parse(localStorage.getItem(DB_KEYS.DISPUTES) || '[]'),

  getDisputeByOrderId: (orderId) => {
    const disputes = JSON.parse(localStorage.getItem(DB_KEYS.DISPUTES) || '[]');
    return disputes.find(d => d.order_id === orderId) || null;
  },

  saveDispute: (dispute) => {
    const disputes = JSON.parse(localStorage.getItem(DB_KEYS.DISPUTES) || '[]');
    const idx = disputes.findIndex(d => d.id === dispute.id);
    if (idx !== -1) disputes[idx] = dispute;
    else disputes.push(dispute);
    localStorage.setItem(DB_KEYS.DISPUTES, JSON.stringify(disputes));
    // Sync ke Supabase
    if (!isSimMode && supabaseClient) {
      supabaseClient.from('disputes').upsert(dispute, { onConflict: 'id' }).then(({ error }) => {
        if (error) console.warn('[RetroHub] dispute sync failed:', error.message);
      });
    }
    return dispute;
  },

  updateDisputeStatus: (disputeId, status, adminNote = '') => {
    const disputes = JSON.parse(localStorage.getItem(DB_KEYS.DISPUTES) || '[]');
    const idx = disputes.findIndex(d => d.id === disputeId);
    if (idx === -1) return null;
    disputes[idx].status = status;
    disputes[idx].admin_note = adminNote;
    disputes[idx].resolved_at = new Date().toISOString();
    localStorage.setItem(DB_KEYS.DISPUTES, JSON.stringify(disputes));
    if (!isSimMode && supabaseClient) {
      supabaseClient.from('disputes').update({
        status, admin_note: adminNote, resolved_at: disputes[idx].resolved_at
      }).eq('id', disputeId).then(({ error }) => {
        if (error) console.warn('[RetroHub] dispute update failed:', error.message);
      });
    }
    return disputes[idx];
  },

  // Upload file bukti ke Supabase Storage bucket 'dispute-evidence'
  uploadDisputeEvidence: async (file, disputeId, fileType) => {
    if (!supabaseClient) throw new Error('Supabase tidak tersedia');
    const ext = file.name.split('.').pop().toLowerCase();
    const fileName = `${disputeId}/${fileType}-${Date.now()}.${ext}`;
    const { data, error } = await supabaseClient.storage
      .from('dispute-evidence')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data: urlData } = supabaseClient.storage
      .from('dispute-evidence')
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  },

  // WITHDRAWALS
  getWithdrawals: () => JSON.parse(localStorage.getItem(DB_KEYS.WITHDRAWALS)) || [],
  getWithdrawalsBySellerId: (sellerId) => db.getWithdrawals().filter(w => w.user_id === sellerId),
  createWithdrawal: (userId, amount, bankName, accountNumber, orderIds = [], type = 'seller_balance') => {
    const withdrawals = db.getWithdrawals();
    const newWd = {
      id: 'WD-' + Date.now() + '-' + Math.floor(Math.random()*1000),
      user_id: userId,
      amount: Number(amount),
      bank_name: bankName,
      account_number: accountNumber,
      account_name: db.getProfileById(userId)?.full_name || 'User',
      order_ids: orderIds,
      created_at: new Date().toISOString(),
      status: 'pending',
      type: type // 'seller_balance' atau 'buyer_wallet'
    };
    withdrawals.push(newWd);
    localStorage.setItem(DB_KEYS.WITHDRAWALS, JSON.stringify(withdrawals));

    // Jika ini adalah seller, tandai order terkait sebagai 'pending'
    if (type === 'seller_balance' && orderIds.length > 0) {
      const orders = db.getOrders();
      orderIds.forEach(oid => {
        const oIdx = orders.findIndex(o => o.id === oid);
        if (oIdx !== -1) {
          orders[oIdx].withdrawn_status = 'pending';
        }
      });
      localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
    }
    
    // Kirim notifikasi email ke Admin
    db.sendEmailNotification(
      'dafiyasinaddafi@gmail.com',
      `[RetroHub Admin] Pengajuan Penarikan Dana Baru - ${newWd.id}`,
      `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2.5px solid #000; border-radius: 6px; box-shadow: 4px 4px 0px #000; background: #FFFDF5;">
            <h2 style="color: #002FBE; border-bottom: 2px dashed #000; padding-bottom: 10px;">💸 Pengajuan Penarikan Dana Baru</h2>
            <p>Halo Admin,</p>
            <p>Terdapat pengajuan penarikan dana baru yang memerlukan persetujuan Anda:</p>
            <ul>
                <li>ID Penarikan: <strong>${newWd.id}</strong></li>
                <li>Nama Akun: <strong>${newWd.account_name}</strong></li>
                <li>Tipe Saldo: <strong>${newWd.type === 'seller_balance' ? 'Saldo Seller (Toko)' : 'Saldo Dompet Buyer'}</strong></li>
                <li>Jumlah Penarikan: <strong>Rp${newWd.amount.toLocaleString('id-ID')}</strong></li>
                <li>Bank Tujuan: <strong>${newWd.bank_name}</strong></li>
                <li>Nomor Rekening: <strong>${newWd.account_number}</strong></li>
                <li>Waktu Pengajuan: <strong>${new Date(newWd.created_at).toLocaleString('id-ID')}</strong></li>
            </ul>
            <p>Silakan tinjau dan proses pengajuan ini melalui Dashboard Admin RetroHub.</p>
            <br>
            <p>Terima kasih,<br>Sistem RetroHub</p>
        </div>
      `
    );

    db.sendPrivateChat(
      'admin-demo',
      userId,
      `💸 Pengajuan penarikan dana Anda sebesar Rp${Number(amount).toLocaleString('id-ID')} ke rekening ${bankName} - ${accountNumber} telah kami terima dan sedang antri untuk diverifikasi oleh admin RetroHub. (ID: ${newWd.id})`
    );

    // Jika ini adalah buyer, wallet_balance sudah dipotong di UI sebelum memanggil createWithdrawal
    return newWd;
  },
  updateWithdrawalStatus: (wdId, status, approvedAmount = null, deductionReason = '', returnDestination = 'platform', targetBuyerId = '', penaltyPoints = 0) => {
    const withdrawals = db.getWithdrawals();
    const idx = withdrawals.findIndex(w => w.id === wdId);
    if (idx === -1) return null;
    const wd = withdrawals[idx];
    
    let originalAmount = Number(wd.amount);
    let finalApprovedAmount = originalAmount;
    let isPartial = false;
    let deductionAmount = 0;

    if (status === 'success' && approvedAmount !== null) {
      finalApprovedAmount = Number(approvedAmount);
      if (finalApprovedAmount < originalAmount) {
        isPartial = true;
        deductionAmount = originalAmount - finalApprovedAmount;
      }
    }

    withdrawals[idx].status = status;
    withdrawals[idx].updated_at = new Date().toISOString();
    withdrawals[idx].penalty_points = Number(penaltyPoints);

    if (isPartial) {
      withdrawals[idx].amount = finalApprovedAmount;
      withdrawals[idx].original_amount = originalAmount;
      withdrawals[idx].deduction_amount = deductionAmount;
      withdrawals[idx].deduction_reason = deductionReason;
      withdrawals[idx].deduction_destination = returnDestination;
      withdrawals[idx].target_buyer_id = targetBuyerId;
    } else if (status === 'rejected') {
      withdrawals[idx].rejection_reason = deductionReason;
    }

    localStorage.setItem(DB_KEYS.WITHDRAWALS, JSON.stringify(withdrawals));

    // Apply penalty points to profile
    if (Number(penaltyPoints) > 0) {
      const profile = db.getProfileById(wd.user_id);
      if (profile) {
        profile.penalty_points = (profile.penalty_points || 0) + Number(penaltyPoints);
        if (!profile.last_penalty_decay || profile.penalty_points === Number(penaltyPoints)) {
          profile.last_penalty_decay = new Date().toISOString();
        }
        db.saveProfile(profile);

        // Send a private chat alerting them of the penalty points
        db.sendPrivateChat(
          'admin-demo',
          wd.user_id,
          `⚠️ Peringatan Penalti: Anda mendapatkan penalti sebesar ${penaltyPoints} poin karena pelanggaran pada transaksi penarikan saldo Anda. Total poin penalti Anda sekarang: ${profile.penalty_points}/6.`
        );
      }
    }

    // Sync order statuses atau refund ke wallet jika ditolak
    const orders = db.getOrders();
    if (wd.type === 'seller_balance' && wd.order_ids && wd.order_ids.length > 0) {
      wd.order_ids.forEach(oid => {
        const oIdx = orders.findIndex(o => o.id === oid);
        if (oIdx !== -1) {
          if (status === 'success') {
            orders[oIdx].withdrawn_status = 'completed';
          } else if (status === 'rejected') {
            orders[oIdx].withdrawn_status = 'available';
          }
        }
      });
      localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
    } else if (wd.type === 'buyer_wallet' && status === 'rejected') {
      // Kembalikan dana penuh ke dompet buyer
      db.refundToBuyerWallet(wd.user_id, originalAmount);
    }

    // Jika setuju sebagian dan sisa uang masuk ke buyer (refund)
    if (isPartial && deductionAmount > 0 && returnDestination !== 'platform') {
      if (wd.type === 'seller_balance') {
        let buyerId = targetBuyerId;
        if (!buyerId && wd.order_ids && wd.order_ids.length > 0) {
          // Fallback ke buyer order pertama jika tidak dispesifikasikan
          const firstOrd = db.getOrderById(wd.order_ids[0]);
          if (firstOrd) buyerId = firstOrd.buyer_id;
        }
        if (buyerId) {
          db.refundToBuyerWallet(buyerId, deductionAmount);
          // Kirim chat privat otomatis ke buyer
          const buyerMsg = `Notifikasi Refund 💸: Anda menerima pengembalian dana sebesar Rp${deductionAmount.toLocaleString('id-ID')} ke dompet Anda karena penalti/pemotongan pada withdraw seller ${wd.account_name}. Keterangan: "${deductionReason}".`;
          db.sendPrivateChat('admin-demo', buyerId, buyerMsg);
        }
      } else if (wd.type === 'buyer_wallet') {
        // Jika wd buyer wallet dipotong sebagian, sisa uang dikembalikan ke buyer-nya sendiri
        db.refundToBuyerWallet(wd.user_id, deductionAmount);
        const buyerMsg = `Notifikasi Keuangan 💸: Sisa penarikan saldo Anda sebesar Rp${deductionAmount.toLocaleString('id-ID')} telah dikembalikan ke dompet digital Anda (Pemotongan disetujui sebagian dengan alasan: "${deductionReason}").`;
        db.sendPrivateChat('admin-demo', wd.user_id, buyerMsg);
      }
    }

    // Kirim notifikasi chat privat otomatis ke user pemilik WD
    let roleLabel = wd.type === 'seller_balance' ? 'toko' : 'dompet';
    let statusLabel = '';
    if (status === 'success') {
      statusLabel = isPartial ? 'DISETUJUI SEBAGIAN' : 'DISETUJUI & BERHASIL DITRANSFER';
    } else if (status === 'processing') {
      statusLabel = 'SEDANG DIPROSES';
    } else {
      statusLabel = 'DITOLAK';
    }

    let msg = `Notifikasi Keuangan: Pengajuan penarikan dana ${roleLabel} Anda (ID WD: ${wdId}) sebesar Rp${originalAmount.toLocaleString('id-ID')} telah ${statusLabel} oleh Admin.`;
    if (isPartial) {
      msg += ` Jumlah yang dicairkan: Rp${finalApprovedAmount.toLocaleString('id-ID')}. Potongan penalty: Rp${deductionAmount.toLocaleString('id-ID')} dengan alasan: "${deductionReason}". Sisa uang dikirim ke: ${returnDestination === 'platform' ? 'RetroHub (Kas Platform)' : 'Refund ke Pembeli'}.`;
    } else if (status === 'rejected') {
      msg += ` Alasan: "${deductionReason}". Saldo telah dikembalikan ke akun Anda.`;
    }
    db.sendPrivateChat('admin-demo', wd.user_id, msg);

    // Kirim notifikasi email ke user jika success/rejected
    if (status === 'success' || status === 'rejected') {
      const userProfile = db.getProfileById(wd.user_id);
      if (userProfile && userProfile.email) {
        let emailHtml = '';
        if (status === 'success') {
          if (isPartial) {
            emailHtml = `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2.5px solid #000; border-radius: 6px; box-shadow: 4px 4px 0px #000; background: #FFFDF5;">
                  <h2 style="color: #F59E0B; border-bottom: 2px dashed #000; padding-bottom: 10px;">⚠️ Penarikan Dana Disetujui Sebagian</h2>
                  <p>Halo <strong>${wd.account_name}</strong>,</p>
                  <p>Pengajuan penarikan dana Anda telah <strong>Disetujui Sebagian</strong> oleh Admin dengan rincian berikut:</p>
                  <ul>
                      <li>ID Penarikan: <strong>${wd.id}</strong></li>
                      <li>Jumlah Awal: <strong>Rp${originalAmount.toLocaleString('id-ID')}</strong></li>
                      <li>Jumlah Dicairkan: <strong style="color: #10B981;">Rp${finalApprovedAmount.toLocaleString('id-ID')}</strong></li>
                      <li>Jumlah Dipotong (Penalti): <strong style="color: #EF4444;">Rp${deductionAmount.toLocaleString('id-ID')}</strong></li>
                      <li>Alasan Pemotongan: <strong>${deductionReason}</strong></li>
                      <li>Tindakan Saldo Potongan: <strong>${returnDestination === 'platform' ? 'Disita oleh Platform (RetroHub)' : 'Refund ke Pembeli'}</strong></li>
                  </ul>
                  <p>Dana yang disetujui (Rp${finalApprovedAmount.toLocaleString('id-ID')}) telah berhasil ditransfer ke rekening bank Anda. Silakan periksa mutasi rekening Anda secara berkala.</p>
                  <br>
                  <p>Terima kasih,<br>Tim RetroHub</p>
              </div>
            `;
          } else {
            emailHtml = `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2.5px solid #000; border-radius: 6px; box-shadow: 4px 4px 0px #000; background: #FFFDF5;">
                  <h2 style="color: #10B981; border-bottom: 2px dashed #000; padding-bottom: 10px;">✅ Penarikan Dana Berhasil</h2>
                  <p>Halo <strong>${wd.account_name}</strong>,</p>
                  <p>Status pengajuan penarikan dana Anda dengan detail berikut telah diperbarui:</p>
                  <ul>
                      <li>ID Penarikan: <strong>${wd.id}</strong></li>
                      <li>Jumlah Penarikan: <strong>Rp${wd.amount.toLocaleString('id-ID')}</strong></li>
                      <li>Bank Tujuan: <strong>${wd.bank_name}</strong></li>
                      <li>Nomor Rekening: <strong>${wd.account_number}</strong></li>
                      <li>Status Terbaru: <strong style="color: #10B981;">DISETUJUI & BERHASIL DITRANSFER</strong></li>
                  </ul>
                  <p>Dana telah berhasil ditransfer ke rekening bank Anda. Silakan periksa mutasi rekening Anda secara berkala.</p>
                  <br>
                  <p>Terima kasih,<br>Tim RetroHub</p>
              </div>
            `;
          }
        } else {
          emailHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2.5px solid #000; border-radius: 6px; box-shadow: 4px 4px 0px #000; background: #FFFDF5;">
                <h2 style="color: #EF4444; border-bottom: 2px dashed #000; padding-bottom: 10px;">❌ Penarikan Dana Ditolak</h2>
                <p>Halo <strong>${wd.account_name}</strong>,</p>
                <p>Pengajuan penarikan dana Anda dengan detail berikut telah ditolak:</p>
                <ul>
                    <li>ID Penarikan: <strong>${wd.id}</strong></li>
                    <li>Jumlah Penarikan: <strong>Rp${originalAmount.toLocaleString('id-ID')}</strong></li>
                    <li>Bank Tujuan: <strong>${wd.bank_name}</strong></li>
                    <li>Nomor Rekening: <strong>${wd.account_number}</strong></li>
                    <li>Status Terbaru: <strong style="color: #EF4444;">DITOLAK</strong></li>
                    <li>Alasan Penolakan: <strong>${deductionReason || 'Ada indikasi ketidaksesuaian data atau pelanggaran.'}</strong></li>
                </ul>
                <p>Pengajuan penarikan dana Anda telah ditolak oleh Admin. Saldo telah dikembalikan ke saldo akun Anda. Silakan hubungi admin atau ajukan kembali jika ada kesalahan data.</p>
                <br>
                <p>Terima kasih,<br>Tim RetroHub</p>
            </div>
          `;
        }

        db.sendEmailNotification(
          userProfile.email,
          `[RetroHub] Update Pengajuan Penarikan Dana - ${wd.id}`,
          emailHtml
        );
      }
    }

    return withdrawals[idx];
  },

  // API PAYMENT GATEWAY LOGS
  getAPILogs: () => JSON.parse(localStorage.getItem(DB_KEYS.API_LOGS)) || [],
  addAPILog: (orderId, amount, status) => {
    const logs = db.getAPILogs();
    const newLog = {
      id: 'API-' + Date.now() + '-' + Math.floor(Math.random()*1000),
      order_id: orderId,
      amount: Number(amount),
      status: status, // 'unpaid', 'success', 'failed', 'error'
      timestamp: new Date().toISOString()
    };
    logs.push(newLog);
    localStorage.setItem(DB_KEYS.API_LOGS, JSON.stringify(logs));
    return newLog;
  },

  sendEmailNotification: async (to, subject, html) => {
    if (!to) return;
    console.log(`[Email Attempt] To: ${to}, Subject: ${subject}`);
    if (isSimMode || !supabaseClient) {
      console.log(`%c[Simulated Email] To: ${to}\nSubject: ${subject}\nHTML:\n${html}`, 'color: #10B981; font-weight: bold;');
      if (typeof showToast === 'function') {
        showToast("Email Simulasi Terkirim ✉️", `Ke: ${to}\nSubjek: ${subject}`, "success");
      }
      return { success: true, simulated: true };
    }
    try {
      const { data, error } = await supabaseClient.functions.invoke('send-email', {
        body: { to, subject, html }
      });
      if (error) {
        console.error("Error calling send-email Edge Function:", error);
        return { success: false, error };
      }
      return { success: true, data };
    } catch (e) {
      console.error("Failed to invoke send-email Edge Function:", e);
      return { success: false, error: e };
    }
  },

  checkExpiredAuctions: (now = new Date()) => {
    if (isSimMode && !localStorage.getItem(DB_KEYS.PRODUCTS)) return;

    const products = db.getProducts();
    const bids = db.getBids();
    let productsChanged = false;

    products.forEach((p, i) => {
      if (p.transaction_type === 'lelang' && p.status === 'active' && p.auction_end_time && new Date(p.auction_end_time) <= now) {
        products[i].status = 'ended';
        productsChanged = true;

        const pBids = bids.filter(b => b.product_id === p.id).sort((a, b) => b.amount - a.amount);
        if (pBids.length > 0) {
          const highestBid = pBids[0];
          const buyerId = highestBid.bidder_id;
          const sellerId = p.seller_id;
          const priceDeal = highestBid.amount;

          const seller = db.getProfileById(sellerId);
          const buyer = db.getProfileById(buyerId);

          const sellerKec = seller ? seller.address_kecamatan : 'Menteng';
          const buyerKec = buyer ? buyer.address_kecamatan : 'Lengkong';

          const shippingCost = db.getRealShippingRate(sellerKec, buyerKec, p.weight_grams || 250, 'jnt');
          const adminFee = 5000;
          const totalPayment = priceDeal + shippingCost + adminFee;

          const orderId = (isSimMode || !supabaseClient) ? _nextOrderId() : _generateUUID();
          const orderData = {
            id: orderId,
            product_id: p.id,
            product_title: p.title,
            buyer_id: buyerId,
            buyer_name: buyer ? '@' + buyer.store_name : '@anonim',
            seller_id: sellerId,
            seller_name: seller ? '@' + seller.store_name : '@anonim',
            price_deal: priceDeal,
            price: priceDeal,
            shipping_cost: shippingCost,
            admin_fee: adminFee,
            total_payment: totalPayment,
            shipping_courier: 'JNT',
            courier: 'JNT',
            status: 'waiting_payment',
            created_at: now.toISOString()
          };

          const currentOrders = db.getOrders();
          currentOrders.push(orderData);
          localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(currentOrders));

          products[i].status = 'reserved';
          products[i].reserved_until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          products[i].reserved_order_id = orderId;

          const buyerName = buyer ? buyer.store_name || buyer.full_name : 'buyer';
          const sellerName = seller ? seller.store_name || seller.full_name : 'seller';

          db.sendPrivateChat('admin-demo', sellerId, `Masa lelang "${p.title}" telah berakhir. Pemenang: @${buyerName} dengan bid Rp${priceDeal.toLocaleString('id-ID')}. Menunggu pembayaran buyer (tenggat 24 jam).`);
          db.sendPrivateChat('admin-demo', buyerId, `Selamat! Anda memenangkan lelang "${p.title}" dari @${sellerName} seharga Rp${priceDeal.toLocaleString('id-ID')}. Silakan selesaikan pembayaran dalam 24 jam.`);

          if (!isSimMode && supabaseClient) {
            supabaseClient.from('orders').insert({
              id: orderId,
              product_id: p.id,
              buyer_id: buyerId,
              seller_id: sellerId,
              price_deal: priceDeal,
              shipping_cost: shippingCost,
              admin_fee: adminFee,
              total_payment: totalPayment,
              shipping_courier: 'JNT',
              status: 'waiting_payment',
              created_at: orderData.created_at
            }).then(({ error }) => {
              if (error) console.error("Error syncing lelang order to Supabase:", error);
            });

            supabaseClient.from('products').update({ status: 'reserved' }).eq('id', p.id).then();
          }

          db.sendEmailNotification(
            buyer ? buyer.email : null,
            `[RetroHub] Selamat! Anda Memenangkan Lelang: ${p.title}`,
            `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2.5px solid #000; border-radius: 6px; box-shadow: 4px 4px 0px #000; background: #FFFDF5;">
                  <h2 style="color: #002FBE; border-bottom: 2px dashed #000; padding-bottom: 10px;">🏆 Selamat! Anda Memenangkan Lelang</h2>
                  <p>Halo <strong>@${buyerName}</strong>,</p>
                  <p>Anda telah memenangkan lelang produk <strong>${p.title}</strong> dari toko <strong>@${sellerName}</strong>.</p>
                  <p><strong>Rincian Transaksi:</strong></p>
                  <ul>
                      <li>Harga Deal: <strong>Rp${priceDeal.toLocaleString('id-ID')}</strong></li>
                      <li>Ongkos Kirim (J&T): Rp${shippingCost.toLocaleString('id-ID')}</li>
                      <li>Biaya Admin: Rp${adminFee.toLocaleString('id-ID')}</li>
                      <li><strong>Total Pembayaran: Rp${totalPayment.toLocaleString('id-ID')}</strong></li>
                  </ul>
                  <p>Silakan segera lakukan pembayaran dalam waktu <strong>24 jam</strong> dari sekarang melalui halaman <strong>Detail Pesanan</strong> Anda.</p>
                  <p style="color: #E52521; font-weight: bold;">Tenggat Pembayaran: ${new Date(Date.now() + 24*3600*1000).toLocaleString('id-ID')}</p>
                  <br>
                  <p>Terima kasih telah bertransaksi di RetroHub!</p>
              </div>
            `
          );

          db.sendEmailNotification(
            seller ? seller.email : null,
            `[RetroHub] Lelang Berakhir: ${p.title} Dimenangkan`,
            `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2.5px solid #000; border-radius: 6px; box-shadow: 4px 4px 0px #000; background: #FFFDF5;">
                  <h2 style="color: #002FBE; border-bottom: 2px dashed #000; padding-bottom: 10px;">🔨 Lelang Berakhir & Dimenangkan</h2>
                  <p>Halo <strong>@${sellerName}</strong>,</p>
                  <p>Produk lelang Anda <strong>${p.title}</strong> telah berakhir dan dimenangkan oleh <strong>@${buyerName}</strong>.</p>
                  <p><strong>Detail Penawaran Pemenang:</strong></p>
                  <ul>
                      <li>Harga Penawaran Teratas: <strong>Rp${priceDeal.toLocaleString('id-ID')}</strong></li>
                  </ul>
                  <p>Pembeli telah diberikan tenggat waktu 24 jam untuk menyelesaikan pembayaran rekber. Kami akan mengirimkan notifikasi kepada Anda segera setelah pembayaran diverifikasi oleh sistem.</p>
                  <br>
                  <p>Terima kasih,<br>Tim RetroHub</p>
              </div>
            `
          );

        } else {
          const seller = db.getProfileById(p.seller_id);
          const sellerName = seller ? seller.store_name || seller.full_name : 'seller';

          db.sendPrivateChat('admin-demo', p.seller_id, `Masa lelang untuk mainan Anda "${p.title}" telah berakhir tanpa penawaran.`);

          if (!isSimMode && supabaseClient) {
            supabaseClient.from('products').update({ status: 'ended' }).eq('id', p.id).then();
          }

          db.sendEmailNotification(
            seller ? seller.email : null,
            `[RetroHub] Lelang Berakhir Tanpa Penawaran: ${p.title}`,
            `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 2.5px solid #000; border-radius: 6px; box-shadow: 4px 4px 0px #000; background: #FFFDF5;">
                  <h2 style="color: #E52521; border-bottom: 2px dashed #000; padding-bottom: 10px;">⏳ Lelang Berakhir Tanpa Penawaran</h2>
                  <p>Halo <strong>@${sellerName}</strong>,</p>
                  <p>Produk lelang Anda <strong>${p.title}</strong> telah berakhir namun tidak ada penawaran (bid) yang masuk.</p>
                  <p>Anda dapat mendaftarkan kembali produk ini atau mengubah tipe penjualannya menjadi penjualan langsung (sale) melalui SellerHub.</p>
                  <br>
                  <p>Terima kasih,<br>Tim RetroHub</p>
              </div>
            `
          );
        }
      }
    });

    if (productsChanged) {
      localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
    }
  }
};

