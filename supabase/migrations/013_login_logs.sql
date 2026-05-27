-- ============================================================
-- MIGRATION 013: login_logs
-- Fitur Pelacakan Riwayat Sesi & Aktivitas Login Pengguna (Admin & Guru)
-- ============================================================

DROP TABLE IF EXISTS public.login_logs CASCADE;

CREATE TABLE IF NOT EXISTS public.login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Sesi Detail
  ip_address text NOT NULL,
  device text NOT NULL, -- 'Desktop', 'Mobile', 'Tablet'
  os text NOT NULL,     -- 'Windows', 'MacOS', 'Android', 'iOS', 'Linux', etc.
  browser text NOT NULL, -- 'Chrome', 'Firefox', 'Safari', 'Edge', etc.
  location text NOT NULL, -- 'Sukabumi, Jawa Barat', 'Jakarta, DKI Jakarta', etc.
  status text NOT NULL DEFAULT 'active' -- 'active', 'expired'
);

-- Indexing untuk performa pencarian log per user
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON public.login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON public.login_logs(created_at);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- Policy untuk mengizinkan pengguna melihat log aktivitas milik mereka sendiri
CREATE POLICY "Pengguna hanya dapat melihat log aktivitas milik sendiri" ON public.login_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Policy untuk mengizinkan pengguna mencatat aktivitas login mereka sendiri
CREATE POLICY "Pengguna dapat memasukkan log aktivitas mereka sendiri" ON public.login_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy untuk mengizinkan pengguna memperbarui status sesi mereka sendiri (misalnya logout sesi lain)
CREATE POLICY "Pengguna dapat memperbarui status sesi mereka sendiri" ON public.login_logs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy untuk mengizinkan pengguna menghapus log mereka sendiri jika diperlukan
CREATE POLICY "Pengguna dapat menghapus log aktivitas mereka sendiri" ON public.login_logs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
