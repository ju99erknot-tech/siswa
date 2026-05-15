-- ============================================================
-- SURAT IZIN — Student permission letters
-- ============================================================

CREATE TABLE IF NOT EXISTS surat_izin (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_siswa TEXT NOT NULL,
  kelas TEXT,
  jenis TEXT NOT NULL CHECK (jenis IN ('izin', 'sakit', 'dispensasi', 'tugas', 'keterangan')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'disetujui', 'ditolak')),
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  keterangan TEXT DEFAULT '',
  sekolah TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_surat_izin_status ON surat_izin(status);
CREATE INDEX IF NOT EXISTS idx_surat_izin_jenis ON surat_izin(jenis);
CREATE INDEX IF NOT EXISTS idx_surat_izin_kelas ON surat_izin(kelas);

-- RLS
ALTER TABLE surat_izin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage surat_izin"
  ON surat_izin FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_surat_izin_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_surat_izin_updated_at
  BEFORE UPDATE ON surat_izin
  FOR EACH ROW EXECUTE FUNCTION update_surat_izin_timestamp();
