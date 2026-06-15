-- ======================================================================
-- RETROHUB DATABASE MIGRATION: ADD CART PERSISTENCE TO PROFILES
-- ======================================================================
-- Jalankan query SQL ini di Dashboard Supabase -> SQL Editor Anda
-- untuk menambahkan kolom penyimpanan keranjang belanja permanen per user.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cart_items JSONB DEFAULT '[]';

COMMENT ON COLUMN public.profiles.cart_items IS 'Menyimpan daftar ID produk di keranjang belanja pengguna agar sinkron lintas perangkat.';
