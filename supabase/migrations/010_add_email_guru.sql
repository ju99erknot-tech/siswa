-- ============================================================
-- MIGRATION 010: add_email_guru
-- Run this in Supabase SQL Editor
-- ============================================================

-- Tambahkan kolom email ke tabel guru untuk keperluan Login Auth
ALTER TABLE public.guru 
ADD COLUMN IF NOT EXISTS email text UNIQUE;

-- Buat index untuk mempercepat pencarian berdasarkan email saat proses login
CREATE INDEX IF NOT EXISTS idx_guru_email ON public.guru(email);
