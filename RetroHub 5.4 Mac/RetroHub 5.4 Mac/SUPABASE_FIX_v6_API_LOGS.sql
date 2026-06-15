-- ============================================================
-- RetroHub Database Fix — v6.0 (API Logs Table)
-- Jalankan file ini di Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.api_logs (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_id     TEXT NOT NULL,
    order_id   TEXT NOT NULL,
    amount     NUMERIC NOT NULL,
    status     TEXT NOT NULL, -- 'success' | 'unpaid' | 'failed' | 'error'
    timestamp  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

-- Buat Policy untuk membaca (Admin & All authenticated users)
CREATE POLICY "Allow read for authenticated users" ON public.api_logs
    FOR SELECT TO authenticated USING (true);

-- Buat Policy untuk service role (write/insert log dari webhook)
CREATE POLICY "Allow all actions for service_role" ON public.api_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Daftarkan ke realtime publication agar langsung tampil tanpa refresh
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = 'api_logs'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.api_logs;
        END IF;
    END IF;
END $$;
