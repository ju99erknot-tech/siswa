import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Siswa } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Date Formatting ──────────────────────────────────────────
export function formatTanggal(date: string | Date): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return String(date);
  }
}

export function formatTanggalPendek(date: string | Date): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return String(date);
  }
}

export function hitungUmur(tanggalLahir: string): string {
  try {
    const today = new Date();
    const birth = new Date(tanggalLahir);
    let years = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years--;
    return `${years} tahun`;
  } catch {
    return "-";
  }
}

// ── Name Utils ───────────────────────────────────────────────
export function getInitials(nama: string): string {
  return nama
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function getNamaOrtu(siswa: Siswa): string {
  return siswa.nama_ayah || siswa.nama_ibu || siswa.nama_wali || "-";
}

// ── Profile Completeness ─────────────────────────────────────
const FIELDS_DAPODIK: (keyof Siswa)[] = [
  "nama",
  "nisn",
  "nik",
  "no_kk",
  "tempat_lahir",
  "tanggal_lahir",
  "jk",
  "agama",
  "alamat",
  "kelurahan",
  "kecamatan",
  "jenis_tinggal",
  "alat_transportasi",
  "no_wa",
  "nama_ayah",
  "pekerjaan_ayah",
  "penghasilan_ayah",
  "nama_ibu",
  "pekerjaan_ibu",
  "penghasilan_ibu",
  "kelas",
  "asal_sekolah",
];

export function getCompletionRate(siswa: Siswa): number {
  const filled = FIELDS_DAPODIK.filter((f) => {
    const v = siswa[f];
    return v !== undefined && v !== null && String(v).trim() !== "";
  });
  return Math.round((filled.length / FIELDS_DAPODIK.length) * 100);
}

export function getCompletionColor(rate: number): string {
  if (rate >= 80) return "text-emerald-400";
  if (rate >= 50) return "text-amber-400";
  return "text-red-400";
}

export function getCompletionBg(rate: number): string {
  if (rate >= 80) return "bg-emerald-500";
  if (rate >= 50) return "bg-amber-500";
  return "bg-red-500";
}

// ── Kelas Utils ──────────────────────────────────────────────
export function getKelasColor(kelas?: string): string {
  if (!kelas) return "#6b7280";
  const g = kelas.trim().split(" ")[0];
  const map: Record<string, string> = {
    I: "#7c3aed",
    II: "#2563eb",
    III: "#0891b2",
    IV: "#059669",
    V: "#d97706",
    VI: "#dc2626",
  };
  return map[g] ?? "#6b7280";
}

export function getKelasGrade(kelas: string): number {
  const map: Record<string, number> = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
  };
  return map[kelas.trim().split(" ")[0]] ?? 0;
}

// ── Format ───────────────────────────────────────────────────
export function formatCurrency(num: number | string): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(num));
}

export function formatJK(jk: string): string {
  return jk === "L" ? "Laki-laki" : "Perempuan";
}

// ── Foto / Storage Helper ────────────────────────────────────
export function getFotoPublic(
  fotoUrl: string | null | undefined,
  bucket: string = "avatars",
): string | null {
  if (!fotoUrl) return null;
  // Jika sudah full URL (http/https), biarkan (termasuk Google Drive atau Supabase Public URL)
  if (fotoUrl.startsWith("http")) return fotoUrl;

  // Jika relatif, asumsikan berada di bucket yang ditentukan di Supabase Storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  // Bersihkan path dari double slash jika ada
  const cleanPath = fotoUrl.startsWith("/") ? fotoUrl.substring(1) : fotoUrl;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
}

// ── Google Drive ──────────────────────────────────────────────
// NOTE: Use konversiDirectLink from @/lib/gas.ts instead.
// This duplicate was removed during the May 2026 audit.

// ── Dapodik Kelas Converter ──────────────────────────────────
export function formatKelasDapodik(kelasDapodik: string): string {
  if (!kelasDapodik) return "";
  // Dapodik format: "1", "2", ... "6" → "I", "II", ... "VI"
  const romawiMap: Record<string, string> = {
    "1": "I",
    "2": "II",
    "3": "III",
    "4": "IV",
    "5": "V",
    "6": "VI",
  };
  const romawi = romawiMap[kelasDapodik.trim()] || kelasDapodik.trim();
  // Coba match dengan KUMPULAN_KELAS (misal "I A", "II B")
  const kelasLengkap = kelasDapodik.includes(" ")
    ? kelasDapodik
    : `${romawi} A`;
  return kelasLengkap;
}

// ── Export to CSV ─────────────────────────────────────────────
export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
  columns?: { key: string; label: string }[],
) {
  if (data.length === 0) return;
  const cols =
    columns || Object.keys(data[0]).map((k) => ({ key: k, label: k }));
  const header = cols.map((c) => c.label).join(",");
  const rows = data.map((row) =>
    cols
      .map((c) => {
        let val = String(row[c.key] ?? "");
        val = val.replace(/\n/g, " ").replace(/\r/g, "");
        return val.includes(",") || val.includes('"')
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      })
      .join(","),
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

// ── Statistik Helper ────────────────────────────────────────
export function hitungStatistik(data: number[]): {
  rata: number;
  min: number;
  max: number;
  median: number;
} {
  if (data.length === 0) return { rata: 0, min: 0, max: 0, median: 0 };
  const sorted = [...data].sort((a, b) => a - b);
  const sum = data.reduce((a, b) => a + b, 0);
  const rata = Math.round((sum / data.length) * 100) / 100;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return { rata, min, max, median };
}

// ── Download ─────────────────────────────────────────────────
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// ── Greeting ─────────────────────────────────────────────────
export function getGreeting(name?: string): string {
  const h = new Date().getHours();
  const sapa = name ? `, ${name.split(" ")[0]}` : "";
  if (h < 11) return `Selamat Pagi${sapa} 👋`;
  if (h < 15) return `Selamat Siang${sapa} 👋`;
  if (h < 18) return `Selamat Sore${sapa} 👋`;
  return `Selamat Malam${sapa} 👋`;
}

// ── Tingkat Badge Color ───────────────────────────────────────
export function getTingkatBadge(tingkat: string) {
  const map: Record<string, string> = {
    Sekolah: "badge-slate",
    Kecamatan: "badge-emerald",
    "Kabupaten/Kota": "badge-cyan",
    Provinsi: "badge-violet",
    Nasional: "badge-amber",
    Internasional: "badge-red",
  };
  return map[tingkat] ?? "badge-slate";
}

// ── Debounce ─────────────────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}
