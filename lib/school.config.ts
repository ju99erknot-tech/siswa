// ============================================================
// SCHOOL CONFIG — Centralized school identity & branding
// All school-specific values in one place. No more hardcoding!
// ============================================================

export const SCHOOL = {
  nama: process.env.NEXT_PUBLIC_SCHOOL_NAME || "SDN 02 CIBADAK",
  npsn: process.env.NEXT_PUBLIC_SCHOOL_NPSN || "20202659",
  alamat:
    process.env.NEXT_PUBLIC_SCHOOL_ADDRESS ||
    "Kp. Pasir Harendong, Kel. Cibadak, Kec. Cibadak, Kab. Sukabumi, Jawa Barat 43351",
  kota: process.env.NEXT_PUBLIC_SCHOOL_CITY || "Kab. Sukabumi",
  provinsi: process.env.NEXT_PUBLIC_SCHOOL_PROVINCE || "Jawa Barat",
  telepon: process.env.NEXT_PUBLIC_SCHOOL_PHONE || "",
  email: process.env.NEXT_PUBLIC_SCHOOL_EMAIL || "",
  jenjang: "SD" as const,
  tahunAjaran: (() => {
    const y = new Date().getFullYear();
    const m = new Date().getMonth() + 1;
    return m >= 7 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
  })(),
  semester: (() => {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    return currentMonth >= 7 && currentMonth <= 12 ? "Ganjil" : "Genap";
  })(),
  skLulusNomor: process.env.NEXT_PUBLIC_SK_LULUS_NOMOR || "800/032-SD/2026",
  skLulusTentang: process.env.NEXT_PUBLIC_SK_LULUS_TENTANG || "Kriteria Kelulusan Peserta Didik Tahun Pelajaran 2025/2026",
} as const;

export const BRAND = {
  appName: "Portal Kesiswaan",
  tagline: "Platform digital terpadu untuk manajemen data siswa",
  version: "Aurora v2.0",
  copyright: `dev Ju99erknot © ${new Date().getFullYear()}`,
} as const;

// WhatsApp message templates — uses {nama_siswa}, {tanggal}, {kelas_baru}, {nama_kegiatan} placeholders
export const WA_TEMPLATES = {
  absensi: `Yth. Bapak/Ibu Wali dari {nama_siswa},\n\nKami informasikan bahwa anak Anda hari ini tidak hadir di sekolah. Mohon konfirmasi kehadiran.\n\nTerima kasih,\n${SCHOOL.nama}`,
  rapor: `Yth. Bapak/Ibu Wali dari {nama_siswa},\n\nKami mengundang Bapak/Ibu untuk pengambilan rapor semester ini.\nHari/Tanggal: {tanggal}\nTempat: ${SCHOOL.nama}\n\nTerima kasih,\n${SCHOOL.nama}`,
  kenaikan: `Yth. Bapak/Ibu Wali dari {nama_siswa},\n\nDengan bangga kami sampaikan bahwa anak Anda dinyatakan NAIK KELAS ke {kelas_baru}.\n\nSelamat!\n${SCHOOL.nama}`,
  kelulusan: `Yth. Bapak/Ibu Wali dari {nama_siswa},\n\nDengan bangga kami sampaikan bahwa anak Anda dinyatakan LULUS dari ${SCHOOL.nama}.\nSelamat atas pencapaiannya!\n\n${SCHOOL.nama}`,
  kegiatan: `Yth. Bapak/Ibu Wali dari {nama_siswa},\n\nKami informasikan akan ada kegiatan {nama_kegiatan} pada {tanggal}.\nMohon perhatian dan partisipasinya.\n\nTerima kasih,\n${SCHOOL.nama}`,
} as const;

export type SchoolConfig = typeof SCHOOL;
export type BrandConfig = typeof BRAND;
