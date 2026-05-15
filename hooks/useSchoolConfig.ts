"use client";

// useSchoolConfig — Portal Kesiswaan
// Single source of truth untuk semua data konfigurasi sekolah
// Menggabungkan pengaturan dari Supabase + env variables sebagai fallback

import { useAppStore } from "@/store/app.store";

export function useSchoolConfig() {
  const pengaturan = useAppStore((s) => s.pengaturan);

  const namaSekolah =
    pengaturan?.nama_sekolah ||
    process.env.NEXT_PUBLIC_SCHOOL_NAME ||
    "SDN 02 CIBADAK";

  const alamatSekolah =
    pengaturan?.alamat_sekolah ||
    "Kp. Pasir Harendong, Kel. Cibadak, Kec. Cibadak, Kab. Sukabumi, Jawa Barat 43351";

  // Ambil nama kota dari bagian kedua alamat (setelah Kel.)
  const kotaSekolah = (() => {
    const bagian = alamatSekolah.split(",");
    // Ambil "Kec. Xxx" atau default "Cibadak"
    const kecPart = bagian.find((b: string) =>
      b.toLowerCase().includes("kec."),
    );
    if (kecPart) return kecPart.replace(/kec\./i, "").trim().split(" ")[0];
    return "Cibadak";
  })();

  const lat = pengaturan?.lat_sekolah
    ? parseFloat(pengaturan.lat_sekolah)
    : parseFloat(process.env.NEXT_PUBLIC_SCHOOL_LAT || "-6.8873607");

  const lng = pengaturan?.lng_sekolah
    ? parseFloat(pengaturan.lng_sekolah)
    : parseFloat(process.env.NEXT_PUBLIC_SCHOOL_LNG || "106.7791757");

  const tahunAjaran =
    pengaturan?.tahun_ajaran ||
    (() => {
      const y = new Date().getFullYear();
      const m = new Date().getMonth() + 1;
      return m >= 7 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
    })();

  return {
    namaSekolah,
    npsn: pengaturan?.npsn || process.env.NEXT_PUBLIC_SCHOOL_NPSN || "20202659",
    alamatSekolah,
    kotaSekolah,
    namaKepsek: pengaturan?.nama_kepsek || "HARYANTI, S.Pd.SD., M.M.",
    nipKepsek: pengaturan?.nip_kepsek || "197012311993072001",
    logoUrl:
      pengaturan?.logo_url ||
      process.env.NEXT_PUBLIC_SCHOOL_LOGO_URL ||
      "/sdn02cbd.png",
    tahunAjaran,
    lat: isNaN(lat) ? -6.8873607 : lat,
    lng: isNaN(lng) ? 106.7791757 : lng,
    gasUrl:
      pengaturan?.gas_web_app_url ||
      process.env.NEXT_PUBLIC_GAS_WEB_APP_URL ||
      "",
  };
}

/** Static version (tanpa hook) untuk dipakai di dalam fungsi/print handler */
export function getSchoolConfig() {
  const pengaturan = useAppStore.getState().pengaturan;

  const namaSekolah =
    pengaturan?.nama_sekolah ||
    process.env.NEXT_PUBLIC_SCHOOL_NAME ||
    "SDN 02 CIBADAK";

  const alamatSekolah =
    pengaturan?.alamat_sekolah ||
    "Kp. Pasir Harendong, Kel. Cibadak, Kec. Cibadak, Kab. Sukabumi, Jawa Barat 43351";

  const kotaSekolah = (() => {
    const bagian = alamatSekolah.split(",");
    const kecPart = bagian.find((b: string) =>
      b.toLowerCase().includes("kec."),
    );
    if (kecPart) return kecPart.replace(/kec\./i, "").trim().split(" ")[0];
    return "Cibadak";
  })();

  const tahunAjaran =
    pengaturan?.tahun_ajaran ||
    (() => {
      const y = new Date().getFullYear();
      const m = new Date().getMonth() + 1;
      return m >= 7 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
    })();

  return {
    namaSekolah,
    alamatSekolah,
    kotaSekolah,
    namaKepsek: pengaturan?.nama_kepsek || "HARYANTI, S.Pd.SD., M.M.",
    nipKepsek: pengaturan?.nip_kepsek || "197012311993072001",
    logoUrl:
      pengaturan?.logo_url ||
      process.env.NEXT_PUBLIC_SCHOOL_LOGO_URL ||
      "/sdn02cbd.png",
    tahunAjaran,
    lat: pengaturan?.lat_sekolah
      ? parseFloat(pengaturan.lat_sekolah)
      : -6.8873607,
    lng: pengaturan?.lng_sekolah
      ? parseFloat(pengaturan.lng_sekolah)
      : 106.7791757,
  };
}
