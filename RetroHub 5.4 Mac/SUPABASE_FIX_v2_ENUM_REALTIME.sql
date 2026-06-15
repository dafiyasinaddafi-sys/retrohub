-- ============================================================
-- SUPABASE FIX v2 — Safe (tidak error jika sudah ada)
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- FIX 1: Tambah nilai enum order_status yang hilang
-- ──────────────────────────────────────────────────────────
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'expired';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded';

-- ──────────────────────────────────────────────────────────
-- FIX 2: Tambah kolom cancel di tabel orders
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_at   TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancelled_by   TEXT,
  ADD COLUMN IF NOT EXISTS cancel_reason  TEXT,
  ADD COLUMN IF NOT EXISTS completed_by   TEXT;

-- ──────────────────────────────────────────────────────────
-- FIX 3: Aktifkan Realtime (skip jika sudah aktif)
-- ──────────────────────────────────────────────────────────
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

-- ──────────────────────────────────────────────────────────
-- FIX 4: Index performa (aman dijalankan berulang)
-- ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON public.orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_seller
  ON public.orders(buyer_id, seller_id);

-- ──────────────────────────────────────────────────────────
-- FIX 5: RLS — Admin bisa baca & update SEMUA orders
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can read all orders"   ON public.orders;
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

-- ──────────────────────────────────────────────────────────
-- SELESAI ✅
-- Refresh halaman admin setelah ini selesai tanpa error.
-- ──────────────────────────────────────────────────────────
