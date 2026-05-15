-- ============================================================
-- MIGRATION 008: Tambah Kategori Guru (Pendidik / Tenaga Kependidikan)
-- ============================================================

ALTER TABLE public.guru
ADD COLUMN IF NOT EXISTS kategori text DEFAULT 'Pendidik',
ADD COLUMN IF NOT EXISTS kredensial jsonb DEFAULT '[]'::jsonb;
