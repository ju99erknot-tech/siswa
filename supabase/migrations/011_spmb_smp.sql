-- ============================================================
-- MIGRATION 011: spmb_smp
-- Fitur Persiapan Pendaftaran SMP untuk Siswa Kelas 6
-- ============================================================

DROP TABLE IF EXISTS public.spmb_smp CASCADE;

CREATE TABLE IF NOT EXISTS public.spmb_smp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  siswa_id uuid REFERENCES public.siswa(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Status Berkas
  status text NOT NULL DEFAULT 'Belum Diisi', 
  -- Pilihan status: 'Belum Diisi', 'Menunggu Verifikasi', 'Valid & Lengkap', 'Didaftarkan', 'Selesai'
  
  -- Dokumen Upload Tambahan dari Ortu
  url_ktp_ayah text,
  url_ktp_ibu text,
  url_kk text,
  url_akta text,
  url_dokumen_pendukung text, -- Sertifikat/KIP/Surat Pindah
  
  -- Koordinat final untuk Zonasi
  lintang text,
  bujur text,
  
  -- Target Sekolah & Bukti
  jalur_pendaftaran text,
  sekolah_tujuan_1 text,
  sekolah_tujuan_2 text,
  bukti_daftar_url text,
  
  -- Catatan Internal Guru
  catatan_guru text
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_spmb_smp_siswa ON public.spmb_smp(siswa_id);
CREATE INDEX IF NOT EXISTS idx_spmb_smp_status ON public.spmb_smp(status);

-- Aktifkan RLS
ALTER TABLE public.spmb_smp ENABLE ROW LEVEL SECURITY;

-- Policy untuk Admin/Guru (Bisa baca, tambah, edit, hapus semua data)
CREATE POLICY "auth_all_spmb_smp" ON public.spmb_smp 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Policy untuk Publik (Hanya bisa BACA dan UPDATE untuk keperluan form verifikasi ortu)
-- Insert tidak diperbolehkan secara publik (hanya update record yang sudah disiapkan)
CREATE POLICY "public_read_spmb_smp" ON public.spmb_smp 
  FOR SELECT TO anon 
  USING (true);

CREATE POLICY "public_update_spmb_smp" ON public.spmb_smp 
  FOR UPDATE TO anon 
  USING (true) 
  WITH CHECK (true);
