// ============================================================
// PORTAL KESISWAAN SDN 02 CIBADAK — TYPE DEFINITIONS
// ============================================================

// ── Auth & User ──────────────────────────────────────────────
export type UserRole = "admin" | "guru" | "orangtua";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
}

// ── Master Data: Guru & Tenaga Kependidikan ──────────────────
export interface Guru {
  id: string;
  created_at: string;
  nip?: string;
  nama: string;
  jk: "L" | "P";
  no_wa?: string;
  email?: string;
  foto_url?: string;
  status_aktif: boolean;
  kategori?: string;
  vault?: VaultGuru[]; // Data dari join table vault_guru
}

// ── Vault Guru ───────────────────────────────────────────────
export interface VaultGuru {
  id: string;
  created_at: string;
  guru_id: string;
  platform: string;
  username: string;
  password: string;
  keterangan?: string;
}

// ── Master Data: Kelas ───────────────────────────────────────
export interface MasterKelas {
  id: string;
  nama_kelas: string; // contoh: "I A"
  tingkat: string; // contoh: "1"
  wali_kelas_id?: string; // Foreign key ke Guru.id
  tahun_ajaran: string;
}

// ── Siswa (Buku Induk) ───────────────────────────────────────
export interface Siswa {
  id: string;
  created_at: string;
  updated_at: string;
  // IDENTITAS
  nama: string;
  nisn: string;
  nis?: string | null;
  nik?: string | null;
  no_kk?: string | null;
  url_kk?: string | null;
  no_akta?: string | null;
  url_akta?: string | null;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | null;
  jk: "L" | "P";
  agama?: string | null;
  kebutuhan_khusus?: string | null;
  jml_saudara?: string | null;
  anak_ke?: string | null;
  foto_url?: string | null;
  // DOMISILI
  alamat?: string;
  rt?: string;
  rw?: string;
  kode_pos?: string;
  dusun?: string;
  kelurahan?: string;
  kecamatan?: string;
  lintang?: string;
  bujur?: string;
  jenis_tinggal?: string;
  alat_transportasi?: string;
  telepon?: string;
  no_wa?: string;
  email?: string;
  jarak_rumah?: string;
  jarak_sekolah?: string;
  // ORTU AYAH
  nama_ayah?: string;
  nik_ayah?: string;
  tahun_lahir_ayah?: string;
  pendidikan_ayah?: string;
  pekerjaan_ayah?: string;
  penghasilan_ayah?: string;
  // ORTU IBU
  nama_ibu?: string;
  nik_ibu?: string;
  tahun_lahir_ibu?: string;
  pendidikan_ibu?: string;
  pekerjaan_ibu?: string;
  penghasilan_ibu?: string;
  // WALI
  nama_wali?: string;
  nik_wali?: string;
  tahun_lahir_wali?: string;
  pendidikan_wali?: string;
  pekerjaan_wali?: string;
  penghasilan_wali?: string;
  hub_keluarga_wali?: string;
  // AKADEMIK
  kelas?: string;
  asal_sekolah?: string;
  no_peserta_un?: string;
  no_ijazah?: string;
  url_ijazah?: string | null;
  skhun?: string;
  tahun_masuk?: string;
  status_siswa?: string;
  // FISIK
  berat_badan?: string;
  tinggi_badan?: string;
  lingkar_kepala?: string;
  gol_darah?: string;
  penyakit_khusus?: string;
  layanan_khusus?: string;
  // KESEJAHTERAAN
  penerima_kps?: string;
  no_kps?: string;
  penerima_kip?: string;
  no_kip?: string;
  nama_kip?: string;
  layak_pip?: string;
  alasan_pip?: string;
  no_kks?: string;
  bank?: string;
  no_rekening?: string;
  nama_rekening?: string;
}

export type SiswaInsert = Omit<Siswa, "id" | "created_at" | "updated_at">;
export type SiswaUpdate = Partial<SiswaInsert>;

// ── Mutasi ───────────────────────────────────────────────────
export interface MutasiMasuk {
  id: string;
  created_at: string;
  nama: string;
  nisn: string;
  jk: "L" | "P";
  kelas: string;
  sekolah_asal: string;
  no_surat: string;
  tanggal_surat: string;
  alasan: string;
  surat_url?: string;
  keterangan?: string;
}

export interface MutasiKeluar {
  id: string;
  created_at: string;
  nama: string;
  nisn: string;
  jk: "L" | "P";
  kelas: string;
  sekolah_tujuan: string;
  no_surat: string;
  tanggal_surat: string;
  alasan: string;
  surat_url?: string;
  keterangan?: string;
}

// ── Prestasi ─────────────────────────────────────────────────
export type TingkatPrestasi =
  | "Sekolah"
  | "Kecamatan"
  | "Kabupaten/Kota"
  | "Provinsi"
  | "Nasional"
  | "Internasional";
export type PeringkatPrestasi =
  | "Juara 1"
  | "Juara 2"
  | "Juara 3"
  | "Harapan 1"
  | "Harapan 2"
  | "Harapan 3"
  | "Peserta/Finalis";

export interface Prestasi {
  id: string;
  created_at: string;
  nama: string;
  nisn?: string;
  kelas: string;
  jenis_lomba: string;
  tingkat: TingkatPrestasi;
  peringkat: PeringkatPrestasi | string;
  tanggal_lomba: string;
  penyelenggara?: string;
  foto_url?: string;
  surat_url?: string;
  keterangan?: string;
}

// ── Alumni ───────────────────────────────────────────────────
export interface Alumni {
  id: string;
  created_at: string;
  nama: string;
  nisn: string;
  jk: "L" | "P";
  kelas?: string;
  tahun_lulus: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  nama_ayah?: string;
  nama_ibu?: string;
  alamat?: string;
  no_ijazah?: string;
  skhun?: string;
  sekolah_lanjutan?: string;
  no_wa?: string;
  foto_url?: string;
  keterangan?: string;
}

// ── Pengaturan ───────────────────────────────────────────────
export interface Pengaturan {
  id?: string;
  nama_sekolah: string;
  npsn?: string;
  alamat_sekolah?: string;
  nama_kepsek: string;
  nip_kepsek: string;
  logo_url?: string;
  kop_surat_url?: string;
  ttd_url?: string;
  stempel_url?: string;
  gas_web_app_url?: string;
  admin_emails?: string[];
  tahun_ajaran?: string;
  lat_sekolah?: string;
  lng_sekolah?: string;
  custom_mapel?: string[];
  sk_lulus_nomor?: string;
  sk_lulus_tentang?: string;
  format_skl?: string;
}

// ── PIP (Program Indonesia Pintar) ────────────────────────────
export interface PIP {
  id: string;
  created_at: string;
  nama: string;
  nisn: string;
  kelas: string;
  tahun: string;
  tahap?: string;
  status: string;
  nominal?: string;
  keterangan?: string;
}

// ── UKS (Buku Kesehatan) ─────────────────────────────────────
export interface UKS {
  id: string;
  created_at: string;
  tanggal: string;
  nama: string;
  kelas: string;
  nisn: string;
  tinggi?: string;
  berat?: string;
  lingkar_kepala?: string;
  keterangan?: string;
}

// ── Izin / Sakit ─────────────────────────────────────────────
export type JenisIzin = "Izin" | "Sakit" | "Alpha";
export type StatusIzin = "Menunggu" | "Disetujui" | "Ditolak";

export interface Izin {
  id: string;
  created_at: string;
  tanggal: string;
  jenis: JenisIzin;
  nama: string;
  kelas: string;
  nisn: string;
  alasan?: string;
  surat_url?: string;
  keterangan?: string;
  status: StatusIzin;
}

// ── Ekstrakurikuler ──────────────────────────────────────────
export interface Eskul {
  id: string;
  created_at: string;
  nama: string;
  kelas: string;
  nisn: string;
  nama_eskul: string;
  tanggal_daftar?: string;
  keterangan?: string;
}

// ── Jurnal Guru ──────────────────────────────────────────────
export interface Jurnal {
  id: string;
  created_at: string;
  tanggal: string;
  kelas: string;
  mata_pelajaran: string;
  nama_guru: string;
  materi: string;
  keterangan?: string;
}

// ── Rapor / Leger ────────────────────────────────────────────
export interface Rapor {
  id: string;
  created_at: string;
  siswa_id?: string;
  nisn: string;
  nama: string;
  kelas: string;
  mapel: string;
  nilai: number;
  kktp?: number;
  semester?: string;
  tahun_ajaran?: string;
}

// ── Catatan Rapor ────────────────────────────────────────────
export interface CatatanRapor {
  id: string;
  created_at: string;
  siswa_id?: string;
  nisn: string;
  kelas: string;
  semester: string;
  catatan_akademik?: string;
  catatan_p5?: string;
  hafalan?: string;
  ekskul?: string;
  tinggi_badan?: string;
  berat_badan?: string;
  lingkar_kepala?: string;
  penyakit?: string;
  saran?: string;
}

// ── Pengumuman ───────────────────────────────────────────────
export interface Pengumuman {
  id: string;
  created_at: string;
  judul: string;
  isi: string;
  tanggal: string;
  penting?: boolean;
  keterangan?: string;
}

// ── Agenda ───────────────────────────────────────────────────
export interface Agenda {
  id: string;
  created_at: string;
  judul: string;
  isi: string;
  tanggal: string;
  waktu?: string;
  tempat?: string;
  keterangan?: string;
}

// ── Survei Kepuasan ──────────────────────────────────────────
export interface Survei {
  id: string;
  created_at: string;
  nama: string;
  peran: string;
  rating: number;
  komentar?: string;
  keterangan?: string;
}

// ── Akreditasi Vault ─────────────────────────────────────────
export interface Akreditasi {
  id: string;
  created_at: string;
  nama_dokumen: string;
  kategori: string;
  tahun: string;
  file_url?: string;
  keterangan?: string;
}

// ── SPMB SMP (Persiapan Lulusan) ────────────────────────────
export type StatusSpmb = "Belum Diisi" | "Menunggu Verifikasi" | "Valid & Lengkap" | "Didaftarkan" | "Selesai";

export interface SpmbSmp {
  id: string;
  created_at: string;
  updated_at: string;
  siswa_id: string;
  status: StatusSpmb;
  url_ktp_ayah?: string | null;
  url_ktp_ibu?: string | null;
  url_kk?: string | null;
  url_akta?: string | null;
  lintang?: string | null;
  bujur?: string | null;
  sekolah_tujuan_1?: string | null;
  sekolah_tujuan_2?: string | null;
  bukti_daftar_url?: string | null;
  catatan_guru?: string | null;
  jalur_pendaftaran?: string | null;
  url_dokumen_pendukung?: string | null;
  siswa?: Siswa; // Join relation
}

// ── Filters ──────────────────────────────────────────────────
export interface SiswaFilter {
  kelas: string;
  jk: string;
  search: string;
}

export interface TableFilter {
  search: string;
  tahun: string;
  bulan: string;
}

export interface PrestasiFilter extends TableFilter {
  tingkat: string;
}

export interface MutasiFilter extends TableFilter {
  kelas: string;
}

// ── Constants ─────────────────────────────────────────────────
export type Kelas = string;

export const KUMPULAN_MAPEL = [
  "Pendidikan Agama & Budi Pekerti",
  "Pendidikan Pancasila",
  "Bahasa Indonesia",
  "Matematika",
  "IPA",
  "IPS",
  "SBdP",
  "PJOK",
  "Bahasa Inggris",
  "Muatan Lokal",
] as const;

export const KUMPULAN_AGAMA = [
  "Islam",
  "Kristen",
  "Katolik",
  "Hindu",
  "Buddha",
  "Konghucu",
] as const;
export const KUMPULAN_PENDIDIKAN = [
  "Tidak Sekolah",
  "SD/Sederajat",
  "SMP/Sederajat",
  "SMA/Sederajat",
  "D1",
  "D2",
  "D3",
  "D4/S1",
  "S2",
  "S3",
] as const;
export const KUMPULAN_PENGHASILAN = [
  "Tidak Berpenghasilan",
  "< Rp 500.000",
  "Rp 500.000 – Rp 999.999",
  "Rp 1.000.000 – Rp 1.999.999",
  "Rp 2.000.000 – Rp 4.999.999",
  "Rp 5.000.000 – Rp 9.999.999",
  "> Rp 10.000.000",
] as const;
export const KUMPULAN_JENIS_TINGGAL = [
  "Bersama Orang Tua",
  "Wali",
  "Kos/Indekos",
  "Pesantren",
  "Panti Asuhan",
  "Lainnya",
] as const;
export const KUMPULAN_TRANSPORTASI = [
  "Jalan Kaki",
  "Sepeda",
  "Sepeda Motor",
  "Mobil Pribadi",
  "Angkutan Umum",
  "Lainnya",
] as const;
export const TINGKAT_PRESTASI: TingkatPrestasi[] = [
  "Sekolah",
  "Kecamatan",
  "Kabupaten/Kota",
  "Provinsi",
  "Nasional",
  "Internasional",
];
export const PERINGKAT_PRESTASI = [
  "Juara 1",
  "Juara 2",
  "Juara 3",
  "Harapan 1",
  "Harapan 2",
  "Harapan 3",
  "Peserta/Finalis",
];
export const KEBUTUHAN_KHUSUS = [
  "Tidak",
  "A (Tunanetra)",
  "B (Tunarungu)",
  "C (Tunagrahita)",
  "D (Tunadaksa)",
  "E (Tunalaras)",
  "F (Tunawicara)",
  "G (Tunaganda)",
  "H (HIV/AIDS)",
  "I (Gifted)",
  "J (Talented)",
  "K (Kesulitan Belajar)",
  "L (Lambat Belajar)",
  "M (Autis)",
  "N (ADHD)",
  "O (Lainnya)",
];

// ── Kapsul Waktu (Time Capsule) ──────────────────────────────
export const KATEGORI_KAPSUL = [
  'Akademik', 'Prestasi', 'Kesehatan', 'Eskul', 'Sosial', 'Momen'
] as const;
export type KategoriKapsul = typeof KATEGORI_KAPSUL[number];

export interface KapsulWaktu {
  id: string;
  created_at: string;
  updated_at: string;
  siswa_id: string;
  nisn: string;
  judul: string;
  deskripsi?: string;
  foto_url?: string;
  kategori: KategoriKapsul;
  kelas_saat_itu?: string;
  tanggal_momen: string;
  ditambahkan_oleh?: string;
}

export type KapsulWaktuInsert = Omit<KapsulWaktu, 'id' | 'created_at' | 'updated_at'>;
export type KapsulWaktuUpdate = Partial<KapsulWaktuInsert>;
