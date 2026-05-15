-- ============================================================
-- PORTAL KESISWAAN SDN 02 CIBADAK — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Helper: auto update updated_at ───────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ============================================================
-- TABLE: siswa
-- ============================================================
create table if not exists public.siswa (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null,

  -- IDENTITAS
  nama              text not null,
  nisn              text unique not null,
  nis               text,
  nik               text,
  no_kk             text,
  no_akta           text,
  tempat_lahir      text,
  tanggal_lahir     date,
  jk                text check (jk in ('L','P')) not null default 'L',
  agama             text,
  kebutuhan_khusus  text default 'Tidak',
  jml_saudara       text,
  anak_ke           text,
  foto_url          text,

  -- DOMISILI
  alamat            text,
  rt                text,
  rw                text,
  kode_pos          text,
  dusun             text,
  kelurahan         text,
  kecamatan         text,
  lintang           text,
  bujur             text,
  jenis_tinggal     text,
  alat_transportasi text,
  telepon           text,
  no_wa             text,
  email             text,
  jarak_rumah       text,

  -- ORANG TUA: AYAH
  nama_ayah         text,
  nik_ayah          text,
  tahun_lahir_ayah  text,
  pendidikan_ayah   text,
  pekerjaan_ayah    text,
  penghasilan_ayah  text,

  -- ORANG TUA: IBU
  nama_ibu          text,
  nik_ibu           text,
  tahun_lahir_ibu   text,
  pendidikan_ibu    text,
  pekerjaan_ibu     text,
  penghasilan_ibu   text,

  -- WALI
  nama_wali         text,
  nik_wali          text,
  tahun_lahir_wali  text,
  pendidikan_wali   text,
  pekerjaan_wali    text,
  penghasilan_wali  text,

  -- AKADEMIK
  kelas             text,
  asal_sekolah      text,
  no_peserta_un     text,
  no_ijazah         text,
  skhun             text,

  -- FISIK
  berat_badan       text,
  tinggi_badan      text,
  lingkar_kepala    text,

  -- KESEJAHTERAAN
  penerima_kps      text default 'Tidak',
  no_kps            text,
  penerima_kip      text default 'Tidak',
  no_kip            text,
  nama_kip          text,
  layak_pip         text default 'Tidak',
  alasan_pip        text,
  no_kks            text,
  bank              text,
  no_rekening       text,
  nama_rekening     text
);

create trigger siswa_updated_at before update on public.siswa
  for each row execute function update_updated_at();

create index if not exists idx_siswa_nisn   on public.siswa(nisn);
create index if not exists idx_siswa_nama   on public.siswa(nama);
create index if not exists idx_siswa_kelas  on public.siswa(kelas);
create index if not exists idx_siswa_jk     on public.siswa(jk);

-- ============================================================
-- TABLE: mutasi_masuk
-- ============================================================
create table if not exists public.mutasi_masuk (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now() not null,
  nama            text not null,
  nisn            text not null,
  jk              text check (jk in ('L','P')) not null default 'L',
  kelas           text not null,
  sekolah_asal    text not null,
  no_surat        text,
  tanggal_surat   date,
  alasan          text,
  keterangan      text
);

create index if not exists idx_mutasi_masuk_nisn on public.mutasi_masuk(nisn);
create index if not exists idx_mutasi_masuk_tgl  on public.mutasi_masuk(tanggal_surat);

-- ============================================================
-- TABLE: mutasi_keluar
-- ============================================================
create table if not exists public.mutasi_keluar (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now() not null,
  nama            text not null,
  nisn            text not null,
  jk              text check (jk in ('L','P')) not null default 'L',
  kelas           text not null,
  sekolah_tujuan  text not null,
  no_surat        text,
  tanggal_surat   date,
  alasan          text,
  keterangan      text
);

create index if not exists idx_mutasi_keluar_nisn on public.mutasi_keluar(nisn);
create index if not exists idx_mutasi_keluar_tgl  on public.mutasi_keluar(tanggal_surat);

-- ============================================================
-- TABLE: prestasi
-- ============================================================
create table if not exists public.prestasi (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now() not null,
  nama            text not null,
  nisn            text,
  kelas           text not null,
  jenis_lomba     text not null,
  tingkat         text check (tingkat in ('Sekolah','Kecamatan','Kabupaten/Kota','Provinsi','Nasional','Internasional')) not null,
  peringkat       text not null,
  tanggal_lomba   date,
  penyelenggara   text,
  foto_url        text,
  keterangan      text
);

create index if not exists idx_prestasi_nisn    on public.prestasi(nisn);
create index if not exists idx_prestasi_tingkat on public.prestasi(tingkat);
create index if not exists idx_prestasi_tgl     on public.prestasi(tanggal_lomba);

-- ============================================================
-- TABLE: alumni
-- ============================================================
create table if not exists public.alumni (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz default now() not null,
  nama              text not null,
  nisn              text unique not null,
  jk                text check (jk in ('L','P')) not null default 'L',
  tahun_lulus       text not null,
  no_ijazah         text,
  skhun             text,
  sekolah_lanjutan  text,
  no_wa             text,
  foto_url          text,
  keterangan        text
);

create index if not exists idx_alumni_nisn        on public.alumni(nisn);
create index if not exists idx_alumni_tahun_lulus on public.alumni(tahun_lulus);

-- ============================================================
-- TABLE: pengaturan (single row - upsert)
-- ============================================================
create table if not exists public.pengaturan (
  id              uuid primary key default gen_random_uuid(),
  updated_at      timestamptz default now() not null,
  nama_sekolah    text not null default 'SDN 02 CIBADAK',
  npsn            text,
  alamat_sekolah  text,
  nama_kepsek     text not null default 'Nama Kepala Sekolah, S.Pd.',
  nip_kepsek      text not null default '196001012000121001',
  logo_url        text,
  kop_surat_url   text,
  gas_web_app_url text,
  admin_emails    text[],
  tahun_ajaran    text default '2024/2025',
  lat_sekolah     text,
  lng_sekolah     text
);

create trigger pengaturan_updated_at before update on public.pengaturan
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.siswa        enable row level security;
alter table public.mutasi_masuk enable row level security;
alter table public.mutasi_keluar enable row level security;
alter table public.prestasi     enable row level security;
alter table public.alumni       enable row level security;
alter table public.pengaturan   enable row level security;

-- Authenticated users can do everything (admin/guru access)
create policy "auth_all_siswa"         on public.siswa         for all to authenticated using (true) with check (true);
create policy "auth_all_mutasi_masuk"  on public.mutasi_masuk  for all to authenticated using (true) with check (true);
create policy "auth_all_mutasi_keluar" on public.mutasi_keluar for all to authenticated using (true) with check (true);
create policy "auth_all_prestasi"      on public.prestasi      for all to authenticated using (true) with check (true);
create policy "auth_all_alumni"        on public.alumni        for all to authenticated using (true) with check (true);
create policy "auth_all_pengaturan"    on public.pengaturan    for all to authenticated using (true) with check (true);

-- Public can only READ siswa (for QR verification page /verify)
create policy "public_read_siswa" on public.siswa for select to anon using (true);
create policy "public_read_alumni" on public.alumni for select to anon using (true);

-- ============================================================
-- SEED: Default pengaturan row
-- ============================================================
insert into public.pengaturan (nama_sekolah, nama_kepsek, nip_kepsek, tahun_ajaran)
values ('SDN 02 CIBADAK', 'Nama Kepala Sekolah, S.Pd.', '196001012000121001', '2024/2025')
on conflict do nothing;
