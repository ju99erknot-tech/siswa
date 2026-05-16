-- ============================================================
-- MIGRATION: Portal Pengumuman Kelulusan Kelas 6
-- Tanggal: 2026-05-16
-- Deskripsi: Menambahkan kolom dan konfigurasi yang dibutuhkan
--            untuk fitur portal pengumuman kelulusan.
-- ============================================================

-- ── 1. Tambah kolom status_kelulusan di tabel siswa ─────────
-- Nilai yang diizinkan: 'LULUS', 'TIDAK LULUS', atau NULL (belum diumumkan)
ALTER TABLE siswa
  ADD COLUMN IF NOT EXISTS status_kelulusan TEXT DEFAULT NULL;

-- Constraint agar hanya menerima nilai yang valid
ALTER TABLE siswa DROP CONSTRAINT IF EXISTS chk_status_kelulusan;
ALTER TABLE siswa
  ADD CONSTRAINT chk_status_kelulusan
  CHECK (status_kelulusan IS NULL OR status_kelulusan IN ('LULUS', 'TIDAK LULUS'));


-- ── 2. Tambah kolom pengaturan portal kelulusan ─────────────
-- Toggle aktif/nonaktif portal
ALTER TABLE pengaturan
  ADD COLUMN IF NOT EXISTS portal_kelulusan_aktif BOOLEAN DEFAULT false;

-- Tanggal & waktu pengumuman (untuk countdown timer di portal)
ALTER TABLE pengaturan
  ADD COLUMN IF NOT EXISTS tanggal_pengumuman TIMESTAMPTZ;

-- Pesan kustom yang ditampilkan di halaman LULUS (opsional)
ALTER TABLE pengaturan
  ADD COLUMN IF NOT EXISTS pesan_kelulusan TEXT;


-- ── 3. Index untuk mempercepat query pencarian kelulusan ────
-- Portal mencari siswa berdasarkan NISN + tanggal_lahir
CREATE INDEX IF NOT EXISTS idx_siswa_nisn_tgl_lahir
  ON siswa (nisn, tanggal_lahir);

-- Index untuk filter kelas 6 + status kelulusan (untuk admin bulk update)
CREATE INDEX IF NOT EXISTS idx_siswa_kelas_kelulusan
  ON siswa (kelas, status_kelulusan);


-- ── 4. Bulk update semua siswa kelas 6 jadi LULUS ───────────
UPDATE siswa
  SET status_kelulusan = 'LULUS'
  WHERE UPPER(TRIM(kelas)) SIMILAR TO '(6|VI)%';


-- ── 5. Aktifkan portal kelulusan ─────────────────────────────
UPDATE pengaturan
  SET portal_kelulusan_aktif = true,
      tanggal_pengumuman = '2026-06-14T10:00:00+07:00',
      pesan_kelulusan = 'Selamat atas kelulusan Ananda! Semoga sukses di jenjang berikutnya. Jangan lupa segera daftarkan diri ke SMP melalui portal SPMB.'
  WHERE id = (SELECT id FROM pengaturan LIMIT 1);


-- ── 6. RLS Policy: izinkan portal publik membaca data ────────
-- Pengaturan: semua bisa baca (untuk cek portal aktif/tidak)
DROP POLICY IF EXISTS "Allow public read pengaturan" ON pengaturan;
CREATE POLICY "Allow public read pengaturan" ON pengaturan
  FOR SELECT USING (true);

-- Siswa: semua bisa baca (untuk pencarian NISN + tanggal lahir)
DROP POLICY IF EXISTS "Allow public read siswa" ON siswa;
CREATE POLICY "Allow public read siswa" ON siswa
  FOR SELECT USING (true);
