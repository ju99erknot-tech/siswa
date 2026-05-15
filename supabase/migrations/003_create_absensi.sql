-- ============================================================
-- ABSENSI HARIAN — Daily attendance records
-- ============================================================

CREATE TABLE IF NOT EXISTS absensi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
  nama_siswa TEXT NOT NULL,
  kelas TEXT,
  tanggal DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('H', 'S', 'I', 'A')),
  keterangan TEXT DEFAULT '',
  sekolah TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate entries per student per day
  UNIQUE (siswa_id, tanggal)
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_absensi_tanggal ON absensi(tanggal);
CREATE INDEX IF NOT EXISTS idx_absensi_siswa ON absensi(siswa_id);
CREATE INDEX IF NOT EXISTS idx_absensi_kelas ON absensi(kelas);
CREATE INDEX IF NOT EXISTS idx_absensi_status ON absensi(status);

-- RLS: Enable Row Level Security
ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read/write
CREATE POLICY "Authenticated users can manage absensi"
  ON absensi
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_absensi_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_absensi_updated_at
  BEFORE UPDATE ON absensi
  FOR EACH ROW
  EXECUTE FUNCTION update_absensi_timestamp();
