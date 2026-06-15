-- ============================================================
-- SUPABASE FIX v3 — Stock Sinkron Antar Device
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- FIX 1: RLS Products — Admin bisa baca SEMUA produk
-- (default policy hanya izinkan baca status='active')
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can read all products"   ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;

CREATE POLICY "Admins can manage all products"
  ON public.products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ──────────────────────────────────────────────────────────
-- FIX 2: RLS Products — Seller bisa baca produk SENDIRI
-- (termasuk yang status sold/reserved/inactive)
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Sellers can read own products" ON public.products;

CREATE POLICY "Sellers can read own products"
  ON public.products FOR SELECT
  USING (
    auth.uid() = seller_id
    OR status = 'active'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ──────────────────────────────────────────────────────────
-- FIX 3: Atomic stock decrement via Database Function
-- Mencegah race condition stok antar device (dua pembeli
-- membeli barang yang sama di waktu bersamaan)
-- ──────────────────────────────────────────────────────────
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
  -- Lock baris produk dulu (FOR UPDATE) agar tidak ada race condition
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

-- Grant execute ke semua user terautentikasi
GRANT EXECUTE ON FUNCTION public.decrement_product_stock TO authenticated;

-- ──────────────────────────────────────────────────────────
-- FIX 4: Atomic stock increment (untuk cancel order)
-- ──────────────────────────────────────────────────────────
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

-- ──────────────────────────────────────────────────────────
-- SELESAI ✅
-- Setelah ini deploy RetroHub_fixed_v2.zip dan refresh semua halaman.
-- ──────────────────────────────────────────────────────────
