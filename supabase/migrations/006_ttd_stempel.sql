-- Tambahkan kolom TTD dan Stempel ke tabel pengaturan
ALTER TABLE pengaturan 
ADD COLUMN IF NOT EXISTS ttd_url TEXT,
ADD COLUMN IF NOT EXISTS stempel_url TEXT;

-- Berikan komentar biar admin lain gak bingung
COMMENT ON COLUMN pengaturan.ttd_url IS 'URL gambar tanda tangan Kepala Sekolah (PNG Transparan)';
COMMENT ON COLUMN pengaturan.stempel_url IS 'URL gambar stempel resmi sekolah (PNG Transparan)';
