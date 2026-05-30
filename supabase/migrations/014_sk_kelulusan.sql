-- ============================================================
-- MIGRATION 014: sk_kelulusan
-- Menambahkan kolom nomor dan tentang SK kelulusan ke tabel pengaturan
-- ============================================================

ALTER TABLE public.pengaturan
  ADD COLUMN IF NOT EXISTS sk_lulus_nomor TEXT DEFAULT '800/032-SD/2026',
  ADD COLUMN IF NOT EXISTS sk_lulus_tentang TEXT DEFAULT 'Kriteria Kelulusan Peserta Didik Tahun Pelajaran 2025/2026';
