-- ============================================================
-- MIGRATION 015: format_skl
-- Menambahkan kolom format_skl ke tabel pengaturan
-- ============================================================

ALTER TABLE public.pengaturan
  ADD COLUMN IF NOT EXISTS format_skl TEXT DEFAULT 'format_1';
