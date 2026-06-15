-- ============================================================
-- SUPABASE MIGRATION: SECURITY HARDENING (v5)
-- ============================================================

-- 1. Hapus policy SELECT lama yang terlalu terbuka atau jika sudah ada sebelumnya
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read their own profile, and admins can read all profi" ON public.profiles;

-- 2. Buat policy SELECT baru: Hanya pemilik profil dan Admin yang bisa melihat baris data lengkap
CREATE POLICY "Users can read their own profile, and admins can read all profi"
    ON public.profiles FOR SELECT
    USING (
        auth.uid() = id
        OR (EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
        ))
    );

-- 3. Buat VIEW publik yang aman tanpa data sensitif (KTP, saldo, alamat detail, kontak, keranjang)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
    id, 
    full_name, 
    store_name, 
    is_buyer, 
    is_seller, 
    is_admin, 
    seller_status, 
    address_provinsi, 
    address_kota, 
    address_kecamatan, 
    rating, 
    reviews_count, 
    warning_count, 
    suspend_until, 
    penalty_points, 
    last_penalty_decay, 
    created_at
FROM public.profiles;

-- Berikan izin akses SELECT pada VIEW kepada publik (anon) dan pengguna terotentikasi (authenticated)
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 4. Buat Trigger Database untuk Proteksi Transaksi Fiktif (Collision Detector)
-- Validasi ini berjalan di sisi server (database) untuk mencegah buyer curang membeli barangnya sendiri
-- menggunakan akun berbeda tetapi dengan kontak, rekening, atau koordinat lokasi yang sama.
CREATE OR REPLACE FUNCTION public.check_order_collision()
RETURNS TRIGGER AS $$
DECLARE
    buyer_record RECORD;
    seller_record RECORD;
BEGIN
    -- Ambil data profil lengkap buyer (karena trigger berjalan sebagai SECURITY DEFINER, ia bisa membaca data privat)
    SELECT * INTO buyer_record FROM public.profiles WHERE id = NEW.buyer_id;
    -- Ambil data profil lengkap seller
    SELECT * INTO seller_record FROM public.profiles WHERE id = NEW.seller_id;

    IF buyer_record IS NOT NULL AND seller_record IS NOT NULL THEN
        -- A. Cek kesamaan WhatsApp / Kontak HP
        IF (buyer_record.phone_number IS NOT NULL AND seller_record.whatsapp IS NOT NULL AND TRIM(buyer_record.phone_number) = TRIM(seller_record.whatsapp)) OR
           (buyer_record.whatsapp IS NOT NULL AND seller_record.whatsapp IS NOT NULL AND TRIM(buyer_record.whatsapp) = TRIM(seller_record.whatsapp)) THEN
            RAISE EXCEPTION 'Indikasi Transaksi Fiktif: Kemiripan kontak WhatsApp/HP dengan Seller.';
        END IF;

        -- B. Cek kesamaan nomor Rekening Bank
        IF (buyer_record.bank_account IS NOT NULL AND seller_record.bank_account IS NOT NULL AND TRIM(buyer_record.bank_account) = TRIM(seller_record.bank_account)) THEN
            RAISE EXCEPTION 'Indikasi Transaksi Fiktif: Kemiripan rekening bank dengan Seller.';
        END IF;

        -- C. Cek koordinat lokasi (jika terlalu dekat < 50 meter / selisih koordinat < 0.0005)
        IF (buyer_record.address_lat IS NOT NULL AND seller_record.address_lat IS NOT NULL AND
            buyer_record.address_lng IS NOT NULL AND seller_record.address_lng IS NOT NULL AND
            ABS(buyer_record.address_lat::numeric - seller_record.address_lat::numeric) < 0.0005 AND
            ABS(buyer_record.address_lng::numeric - seller_record.address_lng::numeric) < 0.0005) THEN
            RAISE EXCEPTION 'Indikasi Transaksi Fiktif: Alamat/lokasi terlalu dekat dengan Seller.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hapus trigger lama jika ada
DROP TRIGGER IF EXISTS trg_check_order_collision ON public.orders;

-- Daftarkan trigger ke tabel orders
CREATE TRIGGER trg_check_order_collision
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.check_order_collision();
