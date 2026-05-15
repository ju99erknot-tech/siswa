-- Migration 007: Menambahkan kolom untuk menyimpan URL/ID Dokumen Digital Siswa dari Google Drive

ALTER TABLE public.siswa
ADD COLUMN IF NOT EXISTS url_akta text,
ADD COLUMN IF NOT EXISTS url_kk text,
ADD COLUMN IF NOT EXISTS url_ijazah text;

-- Tambahkan komentar penjelasan
COMMENT ON COLUMN public.siswa.url_akta IS 'Menyimpan ID File Akta Kelahiran di Google Drive';
COMMENT ON COLUMN public.siswa.url_kk IS 'Menyimpan ID File Kartu Keluarga di Google Drive';
COMMENT ON COLUMN public.siswa.url_ijazah IS 'Menyimpan ID File Ijazah Terakhir di Google Drive';
