-- ============================================================
-- RETROHUB TOTAL MIGRATION & SCHEMAS FIX
-- Jalankan query ini SEKALI SAJA di Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================

-- 1. Tambah kolom yang hilang di tabel public.products (Foto & Diskon)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_urls TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;

-- 2. Tambah nilai enum order_status yang hilang (jika belum ada)
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'expired';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded';

-- 3. Tambah kolom pembatalan di tabel orders (jika belum ada)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_at   TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancelled_by   TEXT,
  ADD COLUMN IF NOT EXISTS cancel_reason  TEXT,
  ADD COLUMN IF NOT EXISTS completed_by   TEXT;

-- 4. Aktifkan Realtime Publikasi untuk semua tabel utama
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'orders','products','profiles',
    'chat_messages','disputes','bids','buyer_addresses'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND tablename = tbl
        AND schemaname = 'public'
    ) THEN
      EXECUTE format(
        'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl
      );
      RAISE NOTICE 'Added % to supabase_realtime', tbl;
    ELSE
      RAISE NOTICE '% already in supabase_realtime — skipped', tbl;
    END IF;
  END LOOP;
END;
$$;

-- 5. Index Performa Orders
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_seller ON public.orders(buyer_id, seller_id);

-- 6. RLS Products — Admin & Seller & Guest Policies
-- Hapus policy lama agar bersih
DROP POLICY IF EXISTS "Anyone can read active products" ON public.products;
DROP POLICY IF EXISTS "Anyone can read all products" ON public.products;
DROP POLICY IF EXISTS "Sellers can read own products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;

-- Buat ulang policy dengan benar
-- Siapapun (Guest & Buyer) diperbolehkan membaca semua produk
-- (Dibutuhkan agar update status produk real-time berjalan mulus & riwayat terjual di toko bisa terbaca)
CREATE POLICY "Anyone can read all products"
  ON public.products FOR SELECT
  USING (true);

-- Seller bisa menghapus produk miliknya sendiri
DROP POLICY IF EXISTS "Sellers can delete their own products" ON public.products;
CREATE POLICY "Sellers can delete their own products"
  ON public.products FOR DELETE
  USING (auth.uid() = seller_id);

-- Admin bisa mengelola semua produk
CREATE POLICY "Admins can manage all products"
  ON public.products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 7. RLS Orders — Admin Policies
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;

CREATE POLICY "Admins can read all orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update all orders"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 8. Fungsi Database untuk Pengurangan Stok Atomik (Decrement)
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  p_product_id UUID,
  p_quantity   INTEGER DEFAULT 1
)
RETURNS TABLE(new_stock INTEGER, new_status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_stock INTEGER;
  v_new_stock     INTEGER;
  v_new_status    TEXT;
BEGIN
  -- Kunci baris data agar tidak terjadi tabrakan pembeli
  SELECT stock INTO v_current_stock
    FROM public.products
   WHERE id = p_product_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produk tidak ditemukan: %', p_product_id;
  END IF;

  v_new_stock := GREATEST(0, COALESCE(v_current_stock, 1) - p_quantity);

  IF v_new_stock <= 0 THEN
    v_new_status := 'sold';
  ELSE
    v_new_status := 'active';
  END IF;

  UPDATE public.products
     SET stock  = v_new_stock,
         status = v_new_status
   WHERE id = p_product_id;

  RETURN QUERY SELECT v_new_stock, v_new_status;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_product_stock TO authenticated;

-- 9. Fungsi Database untuk Penambahan Stok Atomik (Increment - Cancel Order)
CREATE OR REPLACE FUNCTION public.increment_product_stock(
  p_product_id UUID,
  p_quantity   INTEGER DEFAULT 1
)
RETURNS TABLE(new_stock INTEGER, new_status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_stock INTEGER;
  v_new_stock     INTEGER;
BEGIN
  SELECT stock INTO v_current_stock
    FROM public.products
   WHERE id = p_product_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_new_stock := COALESCE(v_current_stock, 0) + p_quantity;

  UPDATE public.products
     SET stock  = v_new_stock,
         status = CASE WHEN status = 'sold' THEN 'active' ELSE status END
   WHERE id = p_product_id;

  RETURN QUERY SELECT v_new_stock, (SELECT status FROM public.products WHERE id = p_product_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_product_stock TO authenticated;
