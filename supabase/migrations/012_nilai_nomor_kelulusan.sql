-- ============================================================
-- MIGRATION 012: nilai_nomor_kelulusan
-- Fitur Penomoran SKL Berurutan & Tabel Nilai Kelulusan
-- ============================================================

-- 1. Tambah kolom nomor_skl dan nilai_kelulusan ke tabel siswa
ALTER TABLE public.siswa
  ADD COLUMN IF NOT EXISTS nomor_skl TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS nilai_kelulusan JSONB DEFAULT NULL;

-- 2. Tambah kolom konfigurasi tambahan ke tabel pengaturan (tanpa KOP teks karena sudah pakai PNG)
ALTER TABLE public.pengaturan
  ADD COLUMN IF NOT EXISTS tanggal_kelulusan DATE DEFAULT '2026-06-02',
  ADD COLUMN IF NOT EXISTS nama_mulok1 TEXT DEFAULT 'Bahasa dan Sastra Sunda',
  ADD COLUMN IF NOT EXISTS nama_mulok2 TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS nama_mulok3 TEXT DEFAULT NULL;
