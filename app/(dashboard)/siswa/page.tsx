"use client";

// ============================================================
// Buku Induk Siswa — Portal Kesiswaan SDN 02 CIBADAK
// ============================================================

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useVirtualScroll } from "@/hooks/useVirtualScroll";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table";
import {
  Search,
  Plus,
  FileUp,
  Download,
  Printer,
  Trash2,
  ArrowUpCircle,
  BookOpen,
  Eye,
  Edit2,
  X,
  CheckSquare,
  Square,
  GraduationCap,
  Users,
  User,
  AlertTriangle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Loader2,
  RefreshCw,
  Filter,
  Check,
  MessageCircle,
  Map as MapIcon,
  Copy,
  ClipboardList,
} from "lucide-react";
import type { Siswa } from "@/types";

import {
  getInitials,
  getKelasColor,
  formatTanggal,
  getCompletionRate,
  getCompletionColor,
  getCompletionBg,
  getFotoPublic,
  getNamaOrtu,
} from "@/lib/utils";
import { useSiswa } from "@/hooks/useSiswa";
import { SiswaDetail360 } from "@/components/siswa/SiswaDetail360";
import { BulkPrintModal } from "@/components/siswa/BulkPrintModal";
import { Bot, Camera, Mail } from "lucide-react";
import { SCHOOL } from "@/lib/school.config";
import { useAppStore } from "@/store/app.store";
import { useReactToPrint } from "react-to-print";
import { DaftarSiswaPrint } from "@/components/siswa/DaftarSiswaPrint";
import { uiSound } from "@/lib/audio";
import { useSchoolConfig } from "@/hooks/useSchoolConfig";

// â”€â”€ Auto-Format penulisan Rombel / Kelas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const formatKelasDapodik = (raw: unknown) => {
  if (!raw) return "";
  let str = String(raw).toUpperCase().trim();

  if (str === "NULL" || str === "UNDEFINED") return "";

  const mapRomawi: Record<string, string> = {
    "1": "I",
    "2": "II",
    "3": "III",
    "4": "IV",
    "5": "V",
    "6": "VI",
  };

  if (/^[1-6]$/.test(str)) return mapRomawi[str];

  str = str.replace(/[^A-Z0-9\s]/g, " ");
  str = str.replace(/\s+/g, " ").trim();
  str = str.replace(/^(KLS|KELAS|ROMBEL|R)\s*/i, "");
  str = str.replace(
    /(?:KELAS\s+)?([1-6])/i,
    (match, p1) => mapRomawi[p1] || p1,
  );

  const match = str.replace(/\s+/g, "").match(/^(V?I{0,3}|IV)([A-Z])$/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }

  return str;
};

// â”€â”€ Excel column map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const EXCEL_MAP: Record<string, keyof Siswa> = {
  Nama: "nama",
  "Nama Lengkap": "nama",
  "Nama Peserta Didik": "nama",
  NAMA: "nama",
  NISN: "nisn",
  "NIS/NIPD": "nis",
  NIS: "nis",
  NIPD: "nis",
  "Nomor Induk": "nis",
  NIK: "nik",
  "Nomor Induk Kependudukan": "nik",
  "No KK": "no_kk",
  "Nomor KK": "no_kk",
  "Kartu Keluarga": "no_kk",
  "No Akta": "no_akta",
  "No Registrasi Akta Lahir": "no_akta",
  "Tempat Lahir": "tempat_lahir",
  "Tanggal Lahir": "tanggal_lahir",
  "Tgl Lahir": "tanggal_lahir",
  JK: "jk",
  "Jenis Kelamin": "jk",
  "L/P": "jk",
  Agama: "agama",
  "Kebutuhan Khusus": "kebutuhan_khusus",
  "Anak Ke": "anak_ke",
  "Jml Saudara": "jml_saudara",
  "Jumlah Saudara": "jml_saudara",
  Alamat: "alamat",
  "Alamat Jalan": "alamat",
  RT: "rt",
  RW: "rw",
  "Kode Pos": "kode_pos",
  Kelurahan: "kelurahan",
  "Desa/Kelurahan": "kelurahan",
  Kecamatan: "kecamatan",
  "Jenis Tinggal": "jenis_tinggal",
  Transportasi: "alat_transportasi",
  "Alat Transportasi": "alat_transportasi",
  "Jarak Rumah": "jarak_rumah",
  "Jarak Rumah Ke Sekolah": "jarak_rumah",
  Telepon: "telepon",
  "No Telp": "telepon",
  "No WA": "no_wa",
  "Nomor HP": "no_wa",
  Email: "email",
  Kelas: "kelas",
  Rombel: "kelas",
  "Rombel Saat Ini": "kelas",
  "Rombongan Belajar": "kelas",
  "Rombel Saat Ini_1": "kelas",
  "Asal Sekolah": "asal_sekolah",
  "Nama Ayah": "nama_ayah",
  "Nama Ayah Kandung": "nama_ayah",
  "Data Ayah Nama": "nama_ayah",
  "NIK Ayah": "nik_ayah",
  "Data Ayah NIK": "nik_ayah",
  "Tahun Lahir Ayah": "tahun_lahir_ayah",
  "Data Ayah Tahun Lahir": "tahun_lahir_ayah",
  "Pendidikan Ayah": "pendidikan_ayah",
  "Data Ayah Jenjang Pendidikan": "pendidikan_ayah",
  "Pekerjaan Ayah": "pekerjaan_ayah",
  "Data Ayah Pekerjaan": "pekerjaan_ayah",
  "Penghasilan Ayah": "penghasilan_ayah",
  "Data Ayah Penghasilan": "penghasilan_ayah",
  "Nama Ibu": "nama_ibu",
  "Nama Ibu Kandung": "nama_ibu",
  "Data Ibu Nama": "nama_ibu",
  "NIK Ibu": "nik_ibu",
  "Data Ibu NIK": "nik_ibu",
  "Tahun Lahir Ibu": "tahun_lahir_ibu",
  "Data Ibu Tahun Lahir": "tahun_lahir_ibu",
  "Pendidikan Ibu": "pendidikan_ibu",
  "Data Ibu Jenjang Pendidikan": "pendidikan_ibu",
  "Pekerjaan Ibu": "pekerjaan_ibu",
  "Data Ibu Pekerjaan": "pekerjaan_ibu",
  "Penghasilan Ibu": "penghasilan_ibu",
  "Data Ibu Penghasilan": "penghasilan_ibu",
  "No Peserta UN": "no_peserta_un",
  "No Ijazah": "no_ijazah",
  SKHUN: "skhun",
  "No SKHUN": "skhun",
  "Berat Badan": "berat_badan",
  "Tinggi Badan": "tinggi_badan",
  "Lingkar Kepala": "lingkar_kepala",
  "Layak PIP": "layak_pip",
  "Layak PIP (usulan dari sekolah)": "layak_pip",
  PIP: "layak_pip",
  "Usulan PIP": "layak_pip",
  "Alasan Layak PIP": "alasan_pip",
  "Alasan PIP": "alasan_pip",
  "Penerima KPS": "penerima_kps",
  KPS: "penerima_kps",
  "Penerima KIP": "penerima_kip",
  KIP: "penerima_kip",
  "No KIP": "no_kip",
  "Nomor KIP": "no_kip",
  "Nama di KIP": "nama_kip",
  "Nama KIP": "nama_kip",
  "No KKS": "no_kks",
  "Nomor KKS": "no_kks",
  Bank: "bank",
  "No Rekening": "no_rekening",
  "No Rekening Bank": "no_rekening",
  "Nama Rekening": "nama_rekening",
  "Rekening Atas Nama": "nama_rekening",
  Lintang: "lintang",
  Latitude: "lintang",
  Bujur: "bujur",
  Longitude: "bujur",
};

const formatYaTidak = (raw: any) => {
  if (!raw) return "Tidak";
  const str = String(raw).toUpperCase().trim();
  if (
    str === "YA" ||
    str === "Y" ||
    str === "YES" ||
    str === "1" ||
    str === "TRUE" ||
    str === "IYA"
  )
    return "Ya";
  return "Tidak";
};

function parseExcelRows(rows: unknown[][]): Partial<Siswa>[] {
  if (rows.length < 2) return [];

  // 1. Cari baris mana yang merupakan HEADER asli
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (
      Array.isArray(row) &&
      row.some((cell) => {
        const s = String(cell || "").toLowerCase();
        return s.includes("nama") || s.includes("nisn");
      })
    ) {
      headerRowIndex = i;
      break;
    }
  }

  // 2. Tentukan Pemetaan Huruf Kolom (Index) ke Field Siswa
  const row0 = rows[headerRowIndex] || [];
  const row1 = rows[headerRowIndex + 1] || [];

  const is2Row = row0.some((h) => {
    const s = String(h || "").toLowerCase();
    return (
      s.includes("data ayah") ||
      s.includes("data ibu") ||
      s.includes("data wali") ||
      s.includes("kesejahteraan") ||
      s.includes("pip")
    );
  });

  const colIndexToKey: Record<number, keyof Siswa> = {};
  const cleanMap: Record<string, keyof Siswa> = {};
  Object.entries(EXCEL_MAP).forEach(([k, v]) => {
    cleanMap[k.toLowerCase().replace(/[^a-z0-9]/g, "")] = v;
  });

  let currentGroup = "";
  for (let i = 0; i < row0.length; i++) {
    const main = String(row0[i] || "").trim();
    const sub = is2Row ? String(row1[i] || "").trim() : "";

    let headerText = "";
    if (is2Row) {
      if (
        main &&
        (main.toLowerCase().includes("data") ||
          main.toLowerCase().includes("kesejahteraan") ||
          main.toLowerCase().includes("pip"))
      ) {
        currentGroup = main;
      }
      headerText =
        currentGroup && sub
          ? `${currentGroup} ${sub}`
          : sub || main || currentGroup;
    } else {
      headerText = main;
    }

    let cleanH = headerText.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanH.endsWith("rombelsaatini")) cleanH = "rombelsaatini";
    else if (cleanH.endsWith("nopesertaujiannasional")) cleanH = "nopesertaun";
    else if (cleanH.endsWith("noseriijazah")) cleanH = "noijazah";

    let key = cleanMap[cleanH];
    if (
      !key &&
      (cleanH.includes("pip") ||
        cleanH.includes("kip") ||
        cleanH.includes("kps"))
    ) {
      const found = Object.keys(cleanMap).find(
        (k) => k.length > 3 && (cleanH.includes(k) || k.includes(cleanH)),
      );
      if (found) key = cleanMap[found];
    }

    if (key) colIndexToKey[i] = key;
  }

  const dataStartRow = is2Row ? headerRowIndex + 2 : headerRowIndex + 1;

  // 3. Proses Data dengan Indeks Kolom yang SUDAH TERKUNCI
  return rows
    .slice(dataStartRow)
    .map((row) => {
      const obj: Record<string, string> = {};
      const rowArr = row as any[];

      Object.entries(colIndexToKey).forEach(([idxStr, key]) => {
        const i = parseInt(idxStr);
        const val = rowArr[i];

        if (val !== undefined && val !== null && String(val).trim() !== "") {
          let finalVal = String(val).trim();
          if (key === "kelas") {
            finalVal = formatKelasDapodik(finalVal);
          } else if (key === "jk") {
            const jk = finalVal.toUpperCase();
            finalVal = jk === "LAKI-LAKI" || jk === "L" ? "L" : "P";
          } else if (
            key === "layak_pip" ||
            key === "penerima_kip" ||
            key === "penerima_kps"
          ) {
            finalVal = formatYaTidak(finalVal);
          }
          obj[key as string] = finalVal;
        }
      });

      return obj as Partial<Siswa>;
    })
    .filter((r) => r.nama || r.nisn); // Keep if either name or nisn exists
}

// â”€â”€ Kelas Badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function KelasBadge({ kelas }: { kelas?: string }) {
  if (!kelas) return <span className="text-white/20 text-xs">-</span>;
  const color = getKelasColor(kelas);
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold"
      style={{
        background: `${color}22`,
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {kelas}
    </span>
  );
}

// â”€â”€ Kelengkapan Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function KelengkapanBar({ siswa }: { siswa: Siswa }) {
  const pct = getCompletionRate(siswa);
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getCompletionBg(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-[11px] font-bold tabular-nums ${getCompletionColor(pct)}`}
      >
        {pct}%
      </span>
    </div>
  );
}

// â”€â”€ Skeleton rows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} style={{ animationDelay: `${i * 80}ms` }}>
          {[40, 48, 260, 90, 60, 140, 160, 100, 100].map((w, j) => (
            <td key={j} className="px-4 py-3.5">
              <div
                className="skeleton h-4 rounded"
                style={{ width: w, opacity: 1 - i * 0.1 }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// â”€â”€ Empty State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EmptyState({
  onAdd,
  hasFilter,
}: {
  onAdd: () => void;
  hasFilter: boolean;
}) {
  return (
    <tr>
      <td colSpan={9} className="py-20">
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{
              background: "rgba(124,58,237,0.08)",
              border: "1px solid rgba(124,58,237,0.15)",
            }}
          >
            <BookOpen className="w-9 h-9 text-violet-500/50" />
          </div>
          <div>
            <p className="text-white/60 font-semibold text-base">
              {hasFilter
                ? "Tidak ada siswa yang sesuai filter"
                : "Buku induk masih kosong"}
            </p>
            <p className="text-white/25 text-sm mt-1">
              {hasFilter
                ? "Coba ubah kata kunci atau filter"
                : "Mulai tambahkan data siswa"}
            </p>
          </div>
          {!hasFilter && (
            <button onClick={onAdd} className="btn-primary mt-2">
              <Plus className="w-4 h-4" />
              Tambah Siswa Pertama
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Import Excel Modal
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function ImportModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (rows: Partial<Siswa>[]) => Promise<void>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<Partial<Siswa>[]>([]);
  const [allRows, setAllRows] = useState<Partial<Siswa>[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
          header: 1,
          defval: "",
        });
        const parsed = parseExcelRows(rows as unknown[][]);
        setAllRows(parsed);
        setPreview(parsed.slice(0, 50));
      } catch {
        toast.error("Gagal membaca file Excel");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const downloadTemplate = () => {
    const headers = Object.keys(EXCEL_MAP);
    const ws = XLSX.utils.aoa_to_sheet([
      headers,
      headers.map((h) => (h === "JK" ? "L" : h === "Kelas" ? "" : "")),
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "template-import-siswa.xlsx");
  };

  const handleImport = async () => {
    if (!allRows.length) return;
    setImporting(true);
    try {
      await onImport(allRows);
      onClose();
    } catch {
      /* handled by parent */
    } finally {
      setImporting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          background: "rgba(8,9,13,0.85)",
          backdropFilter: "blur(12px)",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="w-full max-w-5xl max-h-[90vh] card-obsidian overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(6,182,212,0.15)",
                  border: "1px solid rgba(6,182,212,0.25)",
                }}
              >
                <FileUp className="w-4.5 h-4.5 text-cyan-400" />
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">
                  Import dari Excel
                </h2>
                <p className="text-xs text-white/40">
                  Maks 500 baris per upload
                </p>
              </div>
            </div>
            <button onClick={onClose} className="btn-icon w-8 h-8">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scroll">
            {/* Template download */}
            <button
              onClick={downloadTemplate}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-cyan-300 hover:text-cyan-200 transition-colors"
              style={{
                background: "rgba(6,182,212,0.05)",
                border: "1px dashed rgba(6,182,212,0.25)",
              }}
            >
              <Download className="w-4 h-4 flex-shrink-0" />
              Download Template Excel terlebih dahulu
            </button>

            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer rounded-xl flex flex-col items-center gap-3 py-10 transition-all"
              style={{
                border: `2px dashed ${isDragging ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.08)"}`,
                background: isDragging
                  ? "rgba(124,58,237,0.05)"
                  : "rgba(255,255,255,0.02)",
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(124,58,237,0.1)" }}
              >
                <FileSpreadsheet className="w-6 h-6 text-violet-400" />
              </div>
              {fileName ? (
                <div className="text-center">
                  <p className="text-emerald-400 font-semibold text-sm">
                    {fileName}
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    {allRows.length} baris ditemukan
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-white/60 font-medium text-sm">
                    Drop file .xlsx / .xls di sini
                  </p>
                  <p className="text-white/30 text-xs mt-1">
                    atau klik untuk browse
                  </p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) processFile(f);
                }}
              />
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center justify-between">
                  <span>Preview Data ({allRows.length} baris terdeteksi)</span>
                  <span className="text-cyan-400 text-[9px]">
                    Gunakan scroll horizontal â†’
                  </span>
                </p>
                <div
                  className="overflow-x-auto rounded-xl custom-scroll max-h-[300px] overflow-y-auto"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <table className="table-obsidian text-[10px] w-full">
                    <thead className="bg-[#0f1117] sticky top-0 z-20">
                      <tr>
                        <th className="w-10 text-center">#</th>
                        {preview.length > 0 &&
                          Array.from(
                            new Set(preview.flatMap((r) => Object.keys(r))),
                          ).map((h) => (
                            <th
                              key={h}
                              className="whitespace-nowrap px-3 py-2 text-left"
                            >
                              {h.replace(/_/g, " ")}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((r, i) => (
                        <tr
                          key={i}
                          className="hover:bg-white/[0.02] border-t border-white/5 transition-colors"
                        >
                          <td className="text-center font-mono text-white/30 px-2 py-2">
                            {i + 1}
                          </td>
                          {Array.from(
                            new Set(preview.flatMap((r) => Object.keys(r))),
                          ).map((key) => (
                            <td
                              key={key}
                              className="whitespace-nowrap px-3 py-2 border-r border-white/5 last:border-r-0"
                            >
                              {key === "layak_pip" ||
                              key.includes("penerima") ? (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${r[key as keyof Siswa] === "Ya" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/20"}`}
                                >
                                  {String(r[key as keyof Siswa] || "-")}
                                </span>
                              ) : (
                                <span className="text-white/70">
                                  {String(r[key as keyof Siswa] || "-")}
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 pb-5">
            <button onClick={onClose} className="btn-secondary text-sm py-2">
              Batal
            </button>
            <button
              onClick={handleImport}
              disabled={!allRows.length || importing}
              className="btn-primary text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {importing ? "Menyimpan..." : `Simpan ${allRows.length} Data`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Delete Confirmation Modal
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function DeleteModal({
  targets,
  onClose,
  onConfirm,
  loading,
}: {
  targets: Siswa[];
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const [confirm, setConfirm] = useState("");
  const isBulk = targets.length > 1;
  const label = isBulk ? `${targets.length} siswa` : `"${targets[0]?.nama}"`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          background: "rgba(8,9,13,0.85)",
          backdropFilter: "blur(12px)",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm card-obsidian p-6 space-y-5"
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">Hapus {label}?</h3>
              <p className="text-sm text-white/40 mt-1">
                Data yang dihapus tidak dapat dikembalikan. Ketik{" "}
                <strong className="text-white/70">HAPUS</strong> untuk
                konfirmasi.
              </p>
            </div>
          </div>

          <input
            className="input-obsidian"
            placeholder="Ketik HAPUS untuk konfirmasi"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoFocus
          />

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary flex-1 justify-center py-2.5"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              disabled={confirm !== "HAPUS" || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-40 transition-all"
              style={{
                background:
                  confirm === "HAPUS"
                    ? "rgba(239,68,68,0.8)"
                    : "rgba(239,68,68,0.2)",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {loading ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Naik Kelas Modal
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function NaikKelasModal({
  count,
  onClose,
  onConfirm,
  loading,
}: {
  count: number;
  onClose: () => void;
  onConfirm: (kelas: string) => void;
  loading: boolean;
}) {
  const { dataSiswa } = useAppStore();
  const KUMPULAN_KELAS = Array.from(new Set(dataSiswa.map((s) => s.kelas)))
    .filter((k): k is string => !!k)
    .sort();
  const [target, setTarget] = useState("");
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          background: "rgba(8,9,13,0.85)",
          backdropFilter: "blur(12px)",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm card-obsidian p-6 space-y-5"
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center"
              style={{
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            >
              <ArrowUpCircle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">Naik Kelas</h3>
              <p className="text-sm text-white/40 mt-1">
                {count} siswa akan dipindahkan ke kelas tujuan
              </p>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Kelas Tujuan
            </label>
            <select
              className="input-obsidian"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">-- Pilih Kelas --</option>
              {KUMPULAN_KELAS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary flex-1 justify-center py-2.5"
            >
              Batal
            </button>
            <button
              onClick={() => target && onConfirm(target)}
              disabled={!target || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-40 transition-all"
              style={{
                background: "rgba(245,158,11,0.7)",
                border: "1px solid rgba(245,158,11,0.3)",
              }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUpCircle className="w-4 h-4" />
              )}
              {loading ? "Memproses..." : "Naik Kelas"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// AI Migration Hub View
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function AIMigrationView({
  data,
  onCancel,
  onSimpan,
}: {
  data: (Partial<Siswa> & { status_validasi?: string })[];
  onCancel: () => void;
  onSimpan: (rows: Partial<Siswa>[]) => Promise<void>;
}) {
  const [staging, setStaging] = useState(data);
  const [isSaving, setIsSaving] = useState(false);

  const handleValidasiAI = () => {
    const dataBelumValid = staging.filter(
      (d) => d.status_validasi === "Menunggu",
    );
    if (dataBelumValid.length === 0) {
      toast.info("Semua data sudah tervalidasi atau tidak ada data!");
      return;
    }

    const konfirmasi = confirm(
      `Sistem akan merapikan ${dataBelumValid.length} data secara LOKAL (Super Cepat & Anti Limit):\n1. Nama Siswa -> HURUF KAPITAL SEMUA\n2. Jenis Kelamin -> L/P\n\nLanjutkan?`,
    );
    if (!konfirmasi) return;

    setStaging((prev) =>
      prev.map((s) => {
        if (s.status_validasi === "Menunggu") {
          const updated = { ...s };
          if (updated.nama) updated.nama = String(updated.nama).toUpperCase();
          if (updated.jk) {
            const jk = String(updated.jk).toUpperCase();
            updated.jk = jk === "LAKI-LAKI" || jk === "L" ? "L" : "P";
          }
          updated.status_validasi = "Tervalidasi";
          return updated;
        }
        return s;
      }),
    );
    toast.success("AI berhasil merapikan data!");
  };

  const handleSimpan = async () => {
    setIsSaving(true);
    try {
      await onSimpan(staging);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto pb-10"
    >
      {/* HEADER RESPONSIVE */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-lg text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">
            <Bot className="w-6 h-6 text-amber-300" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-3xl font-black tracking-tight truncate">
              AI Migration Hub
            </h2>
            <p className="text-xs text-purple-100 opacity-80 line-clamp-1">
              Validasi & pembersihan data cerdas.
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={onCancel}
            className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-extrabold text-xs flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 mr-2" /> Batal
          </button>
          <button
            onClick={handleValidasiAI}
            className="flex-1 md:flex-none bg-amber-400 hover:bg-amber-500 text-amber-900 px-4 py-3 rounded-xl font-extrabold text-xs shadow-md flex items-center justify-center transition-transform active:scale-95"
          >
            <Bot className="w-4 h-4 mr-2" /> Validasi AI
          </button>
          <button
            onClick={handleSimpan}
            disabled={isSaving || staging.length === 0}
            className="flex-1 md:flex-none bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white px-4 py-3 rounded-xl font-extrabold text-xs shadow-md flex items-center justify-center transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {isSaving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[#0f172a] rounded-[1.5rem] sm:rounded-[2rem] shadow-soft border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto table-container">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#1e293b]">
              <tr>
                <th className="p-4 font-bold text-slate-400">Status</th>
                <th className="p-4 font-bold text-slate-400">Nama Lengkap</th>
                <th className="p-4 font-bold text-slate-400">L/P</th>
                <th className="p-4 font-bold text-slate-400">TTL</th>
                <th className="p-4 font-bold text-slate-400">Alamat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {staging.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-10 text-center text-slate-500 italic"
                  >
                    Data staging kosong.
                  </td>
                </tr>
              ) : (
                staging.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50">
                    <td className="p-4">
                      {item.status_validasi === "Menunggu" ? (
                        <span className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded text-[10px] font-bold border border-amber-500/20">
                          Menunggu
                        </span>
                      ) : (
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold border border-emerald-500/20">
                          Tervalidasi
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-white">
                      {item.nama}
                      <br />
                      <span className="text-[10px] font-normal text-slate-400">
                        {item.nisn || "-"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">{item.jk || "-"}</td>
                    <td className="p-4 text-slate-300">
                      {item.tempat_lahir || "-"}, {item.tanggal_lahir || "-"}
                    </td>
                    <td className="p-4 text-xs text-slate-300 truncate max-w-[200px]">
                      {item.alamat || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MAIN PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export default function SiswaPage() {
  const router = useRouter();
  const config = useSchoolConfig();
  const {
    data: siswaList,
    isLoading,
    importBulk,
    deleteBulk,
    naikKelasBulk,
    deleteSiswa,
  } = useSiswa();
  const KUMPULAN_KELAS = Array.from(new Set(siswaList.map((s) => s.kelas)))
    .filter((k): k is string => !!k)
    .sort();
  const {
    filterSiswa,
    setFilterSiswa,
    resetFilterSiswa,
    user,
    detailSiswa,
    setDetailSiswa,
    pengaturan,
  } = useAppStore();
  const isAdmin = user?.role === "admin";

  // â”€â”€ Clipboard helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const copyToClipboard = useCallback((text: string, label: string) => {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success(`${label} disalin!`, { duration: 1500 });
      })
      .catch(() => toast.error("Gagal menyalin"));
  }, []);

  // â”€â”€ Context menu state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    siswa: Siswa;
  } | null>(null);

  useEffect(() => {
    const close = () => setCtxMenu(null);
    document.addEventListener("click", close);
    document.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("scroll", close, true);
    };
  }, []);

  // â”€â”€ Table state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [sorting, setSorting] = useState<SortingState>([
    { id: "nama", desc: false },
  ]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });

  // â”€â”€ Modal state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [showImport, setShowImport] = useState(false);
  const [showBulkPrint, setShowBulkPrint] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState<Siswa[] | null>(null);
  const [showNaikKelas, setShowNaikKelas] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isNaikKelas, setIsNaikKelas] = useState(false);
  const [stagingData, setStagingData] = useState<
    (Partial<Siswa> & { status_validasi?: string })[]
  >([]);

  // â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const stats = useMemo(
    () => ({
      total: siswaList.length,
      laki: siswaList.filter((s) => s.jk === "L").length,
      perempuan: siswaList.filter((s) => s.jk === "P").length,
    }),
    [siswaList],
  );

  // â”€â”€ Filtered Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filteredData = useMemo(() => {
    return siswaList.filter((s) => {
      const q = filterSiswa.search.toLowerCase();
      const matchSearch =
        !q ||
        s.nama.toLowerCase().includes(q) ||
        s.nisn.includes(q) ||
        (s.nis ?? "").includes(q) ||
        (s.no_wa ?? "").includes(q);
      const matchKelas =
        filterSiswa.kelas === "all" ||
        !filterSiswa.kelas ||
        s.kelas === filterSiswa.kelas;
      const matchJK =
        filterSiswa.jk === "all" || !filterSiswa.jk || s.jk === filterSiswa.jk;
      return matchSearch && matchKelas && matchJK;
    });
  }, [siswaList, filterSiswa]);

  // â”€â”€ Selected â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter(Boolean),
    [rowSelection],
  );
  const selectedSiswa = useMemo(
    () =>
      selectedIds
        .map((id) => filteredData.find((s) => s.id === id))
        .filter(Boolean) as Siswa[],
    [selectedIds, filteredData],
  );
  const hasFilter =
    filterSiswa.search !== "" ||
    filterSiswa.kelas !== "all" ||
    filterSiswa.jk !== "all";

  // â”€â”€ Columns â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const columns = useMemo<ColumnDef<Siswa>[]>(
    () => [
      // Checkbox
      {
        id: "select",
        size: 44,
        enableSorting: false,
        header: ({ table }) => (
          <button
            onClick={table.getToggleAllRowsSelectedHandler()}
            className="w-4 h-4 flex"
          >
            {table.getIsAllRowsSelected() ? (
              <CheckSquare className="w-4 h-4 text-violet-400" />
            ) : (
              <Square className="w-4 h-4 text-white/20" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              row.toggleSelected();
            }}
            className="w-4 h-4 flex"
          >
            {row.getIsSelected() ? (
              <CheckSquare className="w-4 h-4 text-violet-400" />
            ) : (
              <Square className="w-4 h-4 text-white/20" />
            )}
          </button>
        ),
      },
      // No
      {
        id: "no",
        size: 50,
        header: "No",
        enableSorting: false,
        cell: ({ row, table }) => (
          <span className="text-white/30 text-xs tabular-nums">
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              row.index +
              1}
          </span>
        ),
      },
      // Foto + Nama + NISN
      {
        id: "nama",
        size: 240,
        header: "Siswa",
        accessorFn: (row) => row.nama,
        cell: ({ row }) => {
          const s = row.original;
          const color = s.jk === "L" ? "#7c3aed" : "#db2777";
          return (
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black overflow-hidden"
                style={{
                  background: s.foto_url ? undefined : `${color}22`,
                  border: `2px solid ${color}33`,
                  color,
                }}
              >
                {getFotoPublic(s.foto_url) ? (
                  <Image
                    src={getFotoPublic(s.foto_url)!}
                    alt={s.nama}
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  getInitials(s.nama)
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm truncate leading-tight">
                  {s.nama}
                </p>
                <p
                  className="text-[11px] text-white/35 font-mono mt-0.5 hover:text-violet-400 transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(s.nisn, "NISN");
                  }}
                  title="Klik untuk salin NISN"
                >
                  {s.nisn || "-"}
                </p>
              </div>
            </div>
          );
        },
      },
      // Kelas
      {
        accessorKey: "kelas",
        header: "Kelas",
        size: 90,
        cell: ({ getValue }) => <KelasBadge kelas={getValue() as string} />,
      },
      // JK
      {
        accessorKey: "jk",
        header: "JK",
        size: 60,
        cell: ({ getValue }) => {
          const jk = getValue() as string;
          return (
            <span
              className={`badge text-xs font-bold ${jk === "L" ? "badge-violet" : "badge-pink"}`}
              style={
                jk === "P"
                  ? {
                      background: "rgba(219,39,119,0.1)",
                      color: "#f472b6",
                      border: "1px solid rgba(219,39,119,0.2)",
                    }
                  : {}
              }
            >
              {jk === "L" ? "Laki-laki" : "Perempuan"}
            </span>
          );
        },
      },
      // TTL
      {
        id: "ttl",
        header: "TTL",
        size: 150,
        enableSorting: false,
        accessorFn: (r) =>
          [r.tempat_lahir, r.tanggal_lahir].filter(Boolean).join(", "),
        cell: ({ row }) => {
          const s = row.original;
          const tl = s.tempat_lahir ? `${s.tempat_lahir}, ` : "";
          const tgl = s.tanggal_lahir ? formatTanggal(s.tanggal_lahir) : "-";
          return (
            <span className="text-xs text-white/50 leading-tight">
              {tl}
              {tgl}
            </span>
          );
        },
      },
      // Ortu
      {
        id: "ortu",
        header: "Orang Tua / Wali",
        size: 160,
        enableSorting: false,
        accessorFn: (r) => getNamaOrtu(r),
        cell: ({ row }) => (
          <span className="text-xs text-white/50 truncate max-w-[155px] block">
            {getNamaOrtu(row.original)}
          </span>
        ),
      },
      // Kelengkapan
      {
        id: "kelengkapan",
        header: "Kelengkapan",
        size: 130,
        enableSorting: false,
        cell: ({ row }) => <KelengkapanBar siswa={row.original} />,
      },
      // Aksi
      {
        id: "aksi",
        header: "Aksi",
        size: 100,
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {s.no_wa && s.no_wa !== "-" && (
                <button
                  onClick={() => {
                    let phone = s.no_wa?.replace(/[^0-9]/g, "") || "";
                    if (phone.startsWith("0")) phone = "62" + phone.slice(1);
                    if (!phone.startsWith("62")) phone = "62" + phone;
                    window.open(`https://wa.me/${phone}`, "_blank");
                  }}
                  className="btn-icon w-7 h-7 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20"
                  title="Kirim WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </button>
              )}
              {s.lintang && s.bujur && (
                <button
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps?q=${s.lintang},${s.bujur}`,
                      "_blank",
                    )
                  }
                  className="btn-icon w-7 h-7 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20"
                  title="Lihat Peta"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setDetailSiswa(s)}
                className="btn-icon w-7 h-7 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/20"
                title="Lihat Detail"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => router.push(`/siswa/tambah?edit=${s.id}`)}
                className="btn-icon w-7 h-7 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/20"
                title="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeleteTargets([s])}
                className="btn-icon w-7 h-7 text-red-400 hover:bg-red-500/10 hover:border-red-500/20"
                title="Hapus"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        },
      },
    ],
    [router],
  );

  // â”€â”€ Table instance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const table = useReactTable({
    data: filteredData,
    columns,
    getRowId: (row) => row.id,
    state: { sorting, rowSelection, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  });

  // ── Virtual Scrolling (aktif saat mode "Semua") ─────────
  const isVirtualMode = pagination.pageSize > 100;
  const allRows = table.getRowModel().rows;
  const virtualScroll = useVirtualScroll({
    items: allRows,
    itemHeight: 52,
    containerHeight: 680,
    overscan: 8,
  });

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleExport = useCallback(() => {
    const ws = XLSX.utils.json_to_sheet(
      filteredData.map((s) => ({
        Nama: s.nama,
        NISN: s.nisn,
        "NIS/NIPD": s.nis ?? "",
        NIK: s.nik ?? "",
        "No KK": s.no_kk ?? "",
        "Jenis Kelamin": s.jk === "L" ? "Laki-laki" : "Perempuan",
        Kelas: s.kelas ?? "",
        "Tempat Lahir": s.tempat_lahir ?? "",
        "Tanggal Lahir": s.tanggal_lahir ?? "",
        Agama: s.agama ?? "",
        Alamat: s.alamat ?? "",
        Kecamatan: s.kecamatan ?? "",
        "No WA": s.no_wa ?? "",
        "Nama Ayah": s.nama_ayah ?? "",
        "Nama Ibu": s.nama_ibu ?? "",
        "Nama Wali": s.nama_wali ?? "",
        "Penerima KIP": s.penerima_kip ?? "",
        "No KIP": s.no_kip ?? "",
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Buku Induk Siswa");
    XLSX.writeFile(
      wb,
      `buku-induk-siswa-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    toast.success("File Excel berhasil diunduh");
  }, [filteredData]);

  const handleDownloadTemplate = useCallback(() => {
    const headers = Object.keys(EXCEL_MAP);
    const ws = XLSX.utils.aoa_to_sheet([
      headers,
      headers.map((h) => (h === "JK" ? "L" : h === "Kelas" ? "" : "")),
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "template-buku-induk-siswa.xlsx");
    toast.success("Template berhasil diunduh");
  }, []);

  const handleCetak = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const data = filteredData;
    const logoUrl = pengaturan?.logo_url || "";
    const kopUrl = pengaturan?.kop_surat_url || "";
    const schoolName = config.namaSekolah;
    const ta = pengaturan?.tahun_ajaran || "2025/2026";

    const rows = data
      .map(
        (s, i) => `
      <tr>
        <td style="border: 1px solid black; padding: 6px; text-align: center;">${i + 1}</td>
        <td style="border: 1px solid black; padding: 6px; font-weight: bold;">${s.nama}</td>
        <td style="border: 1px solid black; padding: 6px; text-align: center;">${s.nisn || "-"}</td>
        <td style="border: 1px solid black; padding: 6px; text-align: center;">${s.nis || "-"}</td>
        <td style="border: 1px solid black; padding: 6px; text-align: center;">${s.jk}</td>
        <td style="border: 1px solid black; padding: 6px;">${s.tempat_lahir || "-"}, ${s.tanggal_lahir || "-"}</td>
        <td style="border: 1px solid black; padding: 6px; text-align: center;">${s.kelas || "-"}</td>
      </tr>
    `,
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Daftar Buku Induk - ${new Date().toLocaleDateString()}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Times New Roman', serif; padding: 20px; font-size: 11pt; color: black; background: #eee; }
            .page { background: white; width: 210mm; min-height: 297mm; margin: 0 auto; padding: 15mm; box-shadow: 0 0 10px rgba(0,0,0,0.1); position: relative; }
            .header-kop { text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; display: flex; align-items: center; gap: 20px; }
            .header-kop img.logo { width: 80px; height: 80px; object-fit: contain; }
            .header-kop .title { flex: 1; }
            .header-kop h1 { margin: 0; font-size: 14pt; text-transform: uppercase; }
            .header-kop h2 { margin: 5px 0 0 0; font-size: 16pt; text-transform: uppercase; font-weight: 900; }
            .header-kop p { margin: 5px 0 0 0; font-size: 10pt; }
            .content-title { text-align: center; margin-bottom: 20px; }
            .content-title h3 { text-decoration: underline; margin: 0; font-size: 13pt; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; font-size: 10pt; }
            th { background: #f0f0f0; border: 1px solid black; padding: 8px; text-transform: uppercase; }
            .footer { margin-top: 40px; display: flex; justify-content: flex-end; }
            .ttd-box { width: 250px; text-align: center; position: relative; }
            .ttd-img { position: absolute; width: 120px; z-index: 1; top: 30px; left: 50%; transform: translateX(-50%); opacity: 0.8; }
            .stempel-img { position: absolute; width: 110px; z-index: 2; top: 20px; left: 30%; mix-blend-mode: multiply; }
            .no-print { position: fixed; top: 20px; right: 20px; z-index: 1000; }
            .btn { background: #7c3aed; color: white; padding: 10px 20px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
            @media print {
              body { background: white; padding: 0; }
              .page { box-shadow: none; margin: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button class="btn" onclick="window.print()">ðŸ–¨ï¸ Cetak Sekarang</button>
          </div>
          <div class="page">
            ${
              kopUrl
                ? `<img src="${kopUrl}" style="width: 100%; margin-bottom: 20px;" />`
                : `
              <div class="header-kop">
                <img src="${logoUrl}" class="logo" />
                <div class="title">
                  <h1>Pemerintah Kabupaten Sukabumi</h1>
                  <h2>${schoolName}</h2>
                  <p>${config.alamatSekolah}</p>
                </div>
              </div>
            `
            }

            <div class="content-title">
              <h3>DAFTAR BUKU INDUK PESERTA DIDIK</h3>
              <p>Tahun Ajaran: ${ta}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Lengkap</th>
                  <th>NISN</th>
                  <th>NIS</th>
                  <th>L/P</th>
                  <th>Tempat, Tgl Lahir</th>
                  <th>Kelas</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <div class="footer">
              <div class="ttd-box">
                <p>${config.kotaSekolah}, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                <p>Kepala Sekolah,</p>
                <div style="height: 80px; position: relative;">
                  ${pengaturan?.ttd_url ? `<img src="${pengaturan.ttd_url}" class="ttd-img" style="position: absolute; width: 150px; z-index: 1; top: 10px; left: 50%; transform: translateX(-50%); opacity: 0.8;" />` : ""}
                  ${pengaturan?.stempel_url ? `<img src="${pengaturan.stempel_url}" class="stempel-img" style="position: absolute; width: 130px; z-index: 2; top: -10px; left: 10px; mix-blend-mode: multiply;" />` : ""}
                </div>
                <p style="font-weight: bold; text-decoration: underline; text-transform: uppercase; margin-top: 10px;">${config.namaKepsek}</p>
                <p>NIP. ${config.nipKepsek}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [filteredData, pengaturan]);

  const setStagingDataStore = useAppStore((s) => s.setStagingData);

  const handleImport = useCallback(
    async (rows: Partial<Siswa>[]) => {
      // Pindahkan ke global store untuk diproses di halaman /migration
      setStagingDataStore(
        rows.map((r) => ({ ...r, status_validasi: "Menunggu" })),
      );
      router.push("/migration");
    },
    [setStagingDataStore, router],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTargets?.length) return;
    setIsDeleting(true);
    try {
      if (deleteTargets.length === 1) {
        await deleteSiswa(deleteTargets[0].id, deleteTargets[0].nama);
      } else {
        await deleteBulk(deleteTargets.map((s) => s.id));
      }
      setDeleteTargets(null);
      setRowSelection({});
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTargets, deleteSiswa, deleteBulk]);

  const handleNaikKelas = useCallback(
    async (kelasTarget: string) => {
      if (!selectedIds.length) return;
      setIsNaikKelas(true);
      try {
        await naikKelasBulk(selectedIds, kelasTarget);
        setShowNaikKelas(false);
        setRowSelection({});
      } finally {
        setIsNaikKelas(false);
      }
    },
    [selectedIds, naikKelasBulk],
  );

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // RENDER
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* â”€â”€ Page Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(12,14,22,0.95) 100%)",
        }}
      >
        <div
          className="spot-violet"
          style={{
            top: "-50px",
            right: "10%",
            background:
              "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
          }}
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
          <div className="flex items-center gap-4">
            <div
              className="icon-box w-12 h-12"
              style={{
                background: "rgba(124,58,237,0.15)",
                border: "1px solid rgba(124,58,237,0.25)",
              }}
            >
              <BookOpen size={22} style={{ color: "#a78bfa" }} />
            </div>
            <div>
              <h1 className="page-title">Buku Induk Siswa</h1>
              <p className="page-subtitle">
                Daftar lengkap peserta didik aktif {SCHOOL.nama}
              </p>
            </div>
          </div>

          {/* Stats mini */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <Users size={14} className="text-white/35" />
              <span className="text-sm font-bold text-white/80">
                {stats.total}
              </span>
              <span className="text-xs text-white/30">total</span>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <User size={14} style={{ color: "#22d3ee" }} />
              <span className="text-sm font-bold" style={{ color: "#67e8f9" }}>
                {stats.laki}L
              </span>
              <span className="text-xs text-white/20">·</span>
              <span className="text-sm font-bold" style={{ color: "#f9a8d4" }}>
                {stats.perempuan}P
              </span>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="sync-dot" />
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "#34d399" }}
              >
                Live
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* â”€â”€ Toolbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Download Template */}
          <button
            onClick={handleDownloadTemplate}
            className="btn-icon"
            title="Download Template Excel"
          >
            <Download className="w-4 h-4" />
          </button>
          {/* Import */}
          <button
            onClick={() => setShowImport(true)}
            className="btn-icon"
            title="Import Excel"
            style={{ color: "#06b6d4", borderColor: "rgba(6,182,212,0.2)" }}
          >
            <FileUp className="w-4 h-4" />
          </button>
          {/* Cetak */}
          <button
            onClick={handleCetak}
            className="btn-icon"
            title="Cetak Laporan"
            style={{ color: "#818cf8", borderColor: "rgba(129,140,248,0.2)" }}
          >
            <Printer className="w-4 h-4" />
          </button>
          {/* Export */}
          <button
            onClick={handleExport}
            className="btn-icon"
            title="Export Excel"
            style={{ color: "#a78bfa", borderColor: "rgba(124,58,237,0.2)" }}
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
          {/* Bulk Print (untuk selected) */}
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowBulkPrint(true)}
              className="btn-icon"
              title="Cetak Surat Massal (terpilih)"
              style={{ color: "#e879f9", borderColor: "rgba(232,121,249,0.2)" }}
            >
              <Mail className="w-4 h-4" />
            </button>
          )}
          {/* Naik Kelas (untuk selected) */}
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowNaikKelas(true)}
              className="btn-icon"
              title="Naik Kelas (terpilih)"
              style={{ color: "#f59e0b", borderColor: "rgba(245,158,11,0.2)" }}
            >
              <ArrowUpCircle className="w-4 h-4" />
            </button>
          )}
          {/* Hapus Semua (admin only) */}
          {isAdmin && (
            <button
              onClick={() => setDeleteTargets(siswaList)}
              className="btn-icon"
              title="Hapus Semua Siswa"
              style={{ color: "#f87171", borderColor: "rgba(248,113,113,0.2)" }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Audit Foto */}
          <button
            onClick={() => router.push("/siswa/facegrid")}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-violet-500/30 text-violet-400 text-sm font-bold hover:bg-violet-500/10 transition-all"
          >
            <Camera className="w-4 h-4" />
            Audit Foto
          </button>

          {/* Tambah Siswa */}
          <button
            onClick={() => router.push("/siswa/tambah")}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* â”€â”€ Filter Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-[3]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            className="input-obsidian pl-10 py-2.5"
            placeholder="Cari nama, NISN, NIS, nomor WA..."
            value={filterSiswa.search}
            onChange={(e) => setFilterSiswa({ search: e.target.value })}
          />
        </div>
        {/* Kelas */}
        <select
          className="input-obsidian py-2.5 sm:w-40 flex-[1]"
          value={filterSiswa.kelas}
          onChange={(e) => setFilterSiswa({ kelas: e.target.value })}
        >
          <option value="all">Semua Kelas</option>
          {KUMPULAN_KELAS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        {/* JK */}
        <select
          className="input-obsidian py-2.5 sm:w-36 flex-[1]"
          value={filterSiswa.jk}
          onChange={(e) => setFilterSiswa({ jk: e.target.value })}
        >
          <option value="all">Semua JK</option>
          <option value="L">Laki-laki</option>
          <option value="P">Perempuan</option>
        </select>
        {/* Reset */}
        {hasFilter && (
          <button
            onClick={resetFilterSiswa}
            className="btn-ghost flex items-center gap-1.5 text-sm px-3 py-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* â”€â”€ Bulk Action Bar (Floating Sticky) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {selectedIds.length > 0 &&
          !showBulkPrint &&
          !showNaikKelas &&
          !deleteTargets && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 50, x: "-50%" }}
              className="fixed bottom-20 sm:bottom-8 left-1/2 z-[60] flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-2xl"
              style={{
                background: "rgba(15, 23, 42, 0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(139, 92, 246, 0.4)",
                boxShadow:
                  "0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.1), 0 0 40px rgba(139,92,246,0.15)",
              }}
            >
              <span className="text-sm font-bold text-violet-300 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">
                  {selectedIds.length} Data Terpilih
                </span>
              </span>
              <div className="flex items-center flex-wrap justify-center gap-2">
                <button
                  onClick={() => {
                    uiSound.playSuccess();
                    handleExport();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20"
                  style={{
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.2)",
                  }}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={() => {
                    uiSound.playPop();
                    setShowNaikKelas(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 transition-all hover:bg-amber-500/20"
                  style={{
                    background: "rgba(245,158,11,0.1)",
                    border: "1px solid rgba(245,158,11,0.2)",
                  }}
                >
                  <ArrowUpCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Naik Kelas</span>
                </button>
                <button
                  onClick={() => {
                    uiSound.playPop();
                    setDeleteTargets(selectedSiswa);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-300 transition-all hover:bg-red-500/20"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Hapus</span>
                </button>
                <button
                  onClick={() => {
                    uiSound.playClick();
                    setRowSelection({});
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white transition-all bg-white/5 hover:bg-white/10"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Batal</span>
                </button>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* â”€â”€ Table Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card overflow-hidden"
      >
        <div ref={isVirtualMode ? virtualScroll.containerRef : undefined} onScroll={isVirtualMode ? virtualScroll.onScroll : undefined} className="overflow-x-auto custom-scroll" style={{ maxHeight: isVirtualMode ? "680px" : undefined, overflowY: isVirtualMode ? "auto" : undefined }}>
          <table className="table-obsidian">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={
                        header.column.getCanSort()
                          ? "cursor-pointer select-none hover:text-white/70"
                          : ""
                      }
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1.5">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() &&
                          (header.column.getIsSorted() === "asc" ? (
                            <ArrowUp className="w-3 h-3 text-violet-400" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ArrowDown className="w-3 h-3 text-violet-400" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          ))}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton />
              ) : table.getRowModel().rows.length === 0 ? (
                <EmptyState
                  onAdd={() => router.push("/siswa/tambah")}
                  hasFilter={hasFilter}
                />
              ) : (
                (isVirtualMode ? virtualScroll.visibleItems : table.getRowModel().rows).map((row) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setDetailSiswa(row.original)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setCtxMenu({
                        x: e.clientX,
                        y: e.clientY,
                        siswa: row.original,
                      });
                    }}
                    className="cursor-pointer"
                    style={{
                      background: row.getIsSelected()
                        ? "rgba(124,58,237,0.06)"
                        : undefined,
                      borderLeft: row.getIsSelected()
                        ? "2px solid rgba(124,58,237,0.4)"
                        : "2px solid transparent",
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* â”€â”€ Pagination â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {!isLoading && filteredData.length > 0 && (
          <div
            className="flex items-center justify-between gap-4 px-4 py-3 flex-wrap"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span>Menampilkan</span>
              <select
                className="bg-transparent border border-white/[0.08] rounded-lg px-2 py-1 text-white/60 text-xs focus:outline-none"
                value={pagination.pageSize}
                onChange={(e) => {
                  const val =
                    e.target.value === "all"
                      ? filteredData.length
                      : parseInt(e.target.value);
                  setPagination({ pageIndex: 0, pageSize: val });
                }}
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
                <option value={filteredData.length}>Semua</option>
              </select>
              <span>
                dari{" "}
                <strong className="text-white/60">{filteredData.length}</strong>{" "}
                data
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="btn-icon w-7 h-7 disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: Math.min(table.getPageCount(), 7) }).map(
                (_, i) => {
                  const totalPages = table.getPageCount();
                  const curPage = pagination.pageIndex;
                  let page: number;

                  if (totalPages <= 7) {
                    page = i;
                  } else if (curPage < 4) {
                    page = i < 5 ? i : i === 5 ? -1 : totalPages - 1;
                  } else if (curPage >= totalPages - 4) {
                    page = i === 0 ? 0 : i === 1 ? -1 : totalPages - 7 + i;
                  } else {
                    page =
                      i === 0
                        ? 0
                        : i === 1
                          ? -1
                          : i === 5
                            ? -1
                            : i === 6
                              ? totalPages - 1
                              : curPage - 2 + i;
                  }

                  if (page === -1)
                    return (
                      <span key={i} className="text-white/20 text-xs px-1">
                        ...
                      </span>
                    );
                  return (
                    <button
                      key={i}
                      onClick={() =>
                        setPagination((p) => ({ ...p, pageIndex: page }))
                      }
                      className="w-7 h-7 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background:
                          page === curPage
                            ? "rgba(124,58,237,0.6)"
                            : "rgba(255,255,255,0.04)",
                        color:
                          page === curPage ? "#fff" : "rgba(255,255,255,0.4)",
                        border:
                          page === curPage
                            ? "1px solid rgba(124,58,237,0.4)"
                            : "1px solid transparent",
                      }}
                    >
                      {page + 1}
                    </button>
                  );
                },
              )}

              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="btn-icon w-7 h-7 disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* â”€â”€ Footer info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex items-center gap-2 text-xs text-white/20">
        <RefreshCw className="w-3 h-3" />
        <span>
          Data diperbarui otomatis via realtime • {filteredData.length} dari{" "}
          {stats.total} siswa ditampilkan
        </span>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {/* MODALS                                                 */}
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}

      {/* Bulk Print Modal */}
      {showBulkPrint && (
        <BulkPrintModal
          selectedSiswa={selectedSiswa}
          onClose={() => setShowBulkPrint(false)}
        />
      )}

      {/* Import Modal */}
      <AnimatePresence>
        {showImport && (
          <ImportModal
            onClose={() => setShowImport(false)}
            onImport={handleImport}
          />
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteTargets && (
          <DeleteModal
            targets={deleteTargets}
            onClose={() => setDeleteTargets(null)}
            onConfirm={handleDelete}
            loading={isDeleting}
          />
        )}
      </AnimatePresence>

      {/* Naik Kelas Modal */}
      <AnimatePresence>
        {showNaikKelas && (
          <NaikKelasModal
            count={selectedIds.length}
            onClose={() => setShowNaikKelas(false)}
            onConfirm={handleNaikKelas}
            loading={isNaikKelas}
          />
        )}
      </AnimatePresence>

      {/* â”€â”€ Right-click context menu â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {ctxMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[500] min-w-[180px] rounded-xl overflow-hidden shadow-2xl border border-white/10"
            style={{
              left: Math.min(ctxMenu.x, window.innerWidth - 190),
              top: Math.min(ctxMenu.y, window.innerHeight - 280),
              background: "linear-gradient(135deg, #0f0c1a, #0c0820)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 border-b border-white/8">
              <p className="text-xs font-semibold text-white/80 truncate max-w-[160px]">
                {ctxMenu.siswa.nama}
              </p>
              <p className="text-[10px] text-white/35 font-mono">
                {ctxMenu.siswa.nisn || "-"}
              </p>
            </div>
            {[
              {
                label: "ðŸ“‹ Salin Nama",
                action: () => copyToClipboard(ctxMenu.siswa.nama, "Nama"),
              },
              {
                label: "ðŸ“‹ Salin NISN",
                action: () => copyToClipboard(ctxMenu.siswa.nisn ?? "", "NISN"),
              },
              {
                label: "ðŸ“‹ Salin NIK",
                action: () => copyToClipboard(ctxMenu.siswa.nik ?? "", "NIK"),
              },
              {
                label: "ðŸ“‹ Salin No. WA",
                action: () =>
                  copyToClipboard(ctxMenu.siswa.no_wa ?? "", "No. WA"),
              },
              null,
              {
                label: "ðŸ’¬ Buka WhatsApp",
                action: () => {
                  if (ctxMenu.siswa.no_wa)
                    window.open(
                      `https://wa.me/62${ctxMenu.siswa.no_wa.replace(/^0/, "")}`,
                      "_blank",
                    );
                  else toast.error("No. WA tidak tersedia");
                },
              },
              {
                label: "ðŸ‘ï¸ Lihat Detail",
                action: () => {
                  setDetailSiswa(ctxMenu.siswa);
                  setCtxMenu(null);
                },
              },
              ...(isAdmin
                ? [
                    {
                      label: "ðŸ—‘ï¸ Hapus",
                      action: () => {
                        setDeleteTargets([ctxMenu.siswa]);
                        setCtxMenu(null);
                      },
                      danger: true,
                    },
                  ]
                : []),
            ].map((item, i) =>
              item === null ? (
                <div key={i} className="h-px mx-2 my-1 bg-white/8" />
              ) : (
                <button
                  key={item.label}
                  onClick={() => {
                    item.action();
                    setCtxMenu(null);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-white/8 ${"danger" in item && item.danger ? "text-red-400 hover:bg-red-500/10" : "text-white/70"}`}
                >
                  {item.label}
                </button>
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
