"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSpreadsheet,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useSiswa } from "@/hooks/useSiswa";

// ── Auto-Format penulisan Rombel / Kelas ────────────────
const formatKelasDapodik = (raw: any) => {
  if (!raw) return "";
  let str = String(raw).toUpperCase().trim();

  if (str === "NULL" || str === "UNDEFINED") return "";

  // Mapping Romawi
  const mapRomawi: Record<string, string> = {
    "1": "I",
    "2": "II",
    "3": "III",
    "4": "IV",
    "5": "V",
    "6": "VI",
  };

  // Jika input hanya angka 1-6
  if (/^[1-6]$/.test(str)) return mapRomawi[str];

  // Bersihkan karakter non-alphanumeric kecuali spasi
  str = str.replace(/[^A-Z0-9\s]/g, " ");

  // Normalisasi spasi
  str = str.replace(/\s+/g, " ").trim();

  // Buang awalan KELAS/KLS/ROMBEL
  str = str.replace(/^(KLS|KELAS|ROMBEL|R)\s*/i, "");

  // Ganti angka 1-6 di awal atau setelah kata KELAS
  str = str.replace(
    /(?:KELAS\s+)?([1-6])/i,
    (match, p1) => mapRomawi[p1] || p1,
  );

  // Ambil pola "Romawi + Huruf" (e.g., "IV A", "IV-A", "IVA")
  const match = str.replace(/\s+/g, "").match(/^(V?I{0,3}|IV)([A-Z])$/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }

  return str;
};

function normalizeTanggal(val: string | number): string {
  if (!val) return "";
  // Excel serial number
  if (typeof val === "number") {
    const date = new Date((val - 25569) * 86400 * 1000);
    return date.toISOString().split("T")[0];
  }
  const str = String(val).trim();
  // DD/MM/YYYY or DD-MM-YYYY format
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy)
    return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, "0")}-${ddmmyyyy[1].padStart(2, "0")}`;
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  return str;
}

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

// Mapping header Excel Dapodik → field database
const FIELD_MAP: Record<string, string> = {
  nama: "nama",
  "nama lengkap": "nama",
  "nama peserta didik": "nama",
  nisn: "nisn",
  nis: "nis",
  nipd: "nis",
  "nomor induk": "nis",
  "nomor induk siswa": "nis",
  nik: "nik",
  "nomor induk kependudukan": "nik",
  "no kk": "no_kk",
  "nomor kk": "no_kk",
  "kartu keluarga": "no_kk",
  "no akta": "no_akta",
  "no registrasi akta lahir": "no_akta",
  "nomor akta": "no_akta",
  "tempat lahir": "tempat_lahir",
  "tanggal lahir": "tanggal_lahir",
  "tgl lahir": "tanggal_lahir",
  jk: "jk",
  "jenis kelamin": "jk",
  "l/p": "jk",
  agama: "agama",
  "kebutuhan khusus": "kebutuhan_khusus",
  "jml saudara": "jml_saudara",
  "jumlah saudara": "jml_saudara",
  "anak ke": "anak_ke",
  alamat: "alamat",
  "alamat jalan": "alamat",
  jalan: "alamat",
  rt: "rt",
  rw: "rw",
  "kode pos": "kode_pos",
  dusun: "dusun",
  "nama dusun": "dusun",
  kelurahan: "kelurahan",
  "desa/kelurahan": "kelurahan",
  desa: "kelurahan",
  kecamatan: "kecamatan",
  "jenis tinggal": "jenis_tinggal",
  "alat transportasi": "alat_transportasi",
  transportasi: "alat_transportasi",
  telepon: "telepon",
  "no telp": "telepon",
  "telepon rumah": "telepon",
  "no wa": "no_wa",
  "no. wa": "no_wa",
  hp: "no_wa",
  "nomor hp": "no_wa",
  email: "email",
  surel: "email",
  "jarak rumah": "jarak_rumah",
  "jarak rumah ke sekolah": "jarak_rumah",
  "nama ayah": "nama_ayah",
  "nama ayah kandung": "nama_ayah",
  "data ayah nama": "nama_ayah",
  "nik ayah": "nik_ayah",
  "data ayah nik": "nik_ayah",
  "tahun lahir ayah": "tahun_lahir_ayah",
  "data ayah tahun lahir": "tahun_lahir_ayah",
  "pendidikan ayah": "pendidikan_ayah",
  "data ayah jenjang pendidikan": "pendidikan_ayah",
  "pekerjaan ayah": "pekerjaan_ayah",
  "data ayah pekerjaan": "pekerjaan_ayah",
  "penghasilan ayah": "penghasilan_ayah",
  "data ayah penghasilan": "penghasilan_ayah",
  "nama ibu": "nama_ibu",
  "nama ibu kandung": "nama_ibu",
  "data ibu nama": "nama_ibu",
  "nik ibu": "nik_ibu",
  "data ibu nik": "nik_ibu",
  "tahun lahir ibu": "tahun_lahir_ibu",
  "data ibu tahun lahir": "tahun_lahir_ibu",
  "pendidikan ibu": "pendidikan_ibu",
  "data ibu jenjang pendidikan": "pendidikan_ibu",
  "pekerjaan ibu": "pekerjaan_ibu",
  "data ibu pekerjaan": "pekerjaan_ibu",
  "penghasilan ibu": "penghasilan_ibu",
  "data ibu penghasilan": "penghasilan_ibu",
  "nama wali": "nama_wali",
  "data wali nama": "nama_wali",
  "nik wali": "nik_wali",
  "data wali nik": "nik_wali",
  "tahun lahir wali": "tahun_lahir_wali",
  "data wali tahun lahir": "tahun_lahir_wali",
  "pendidikan wali": "pendidikan_wali",
  "data wali jenjang pendidikan": "pendidikan_wali",
  "pekerjaan wali": "pekerjaan_wali",
  "data wali pekerjaan": "pekerjaan_wali",
  "penghasilan wali": "penghasilan_wali",
  "data wali penghasilan": "penghasilan_wali",
  kelas: "kelas",
  rombel: "kelas",
  "rombel saat ini": "kelas",
  "rombongan belajar": "kelas",
  "rombel saat ini_1": "kelas",
  "asal sekolah": "asal_sekolah",
  "no peserta un": "no_peserta_un",
  "no ijazah": "no_ijazah",
  skhun: "skhun",
  "no skhun": "skhun",
  "berat badan": "berat_badan",
  "tinggi badan": "tinggi_badan",
  "lingkar kepala": "lingkar_kepala",
  "penerima kps": "penerima_kps",
  "no kps": "no_kps",
  "penerima kip": "penerima_kip",
  "no kip": "no_kip",
  "nama kip": "nama_kip",
  "nama di kip": "nama_kip",
  "layak pip": "layak_pip",
  "layak pip (usulan dari sekolah)": "layak_pip",
  "alasan pip": "alasan_pip",
  "alasan layak pip": "alasan_pip",
  "no kks": "no_kks",
  bank: "bank",
  "no rekening": "no_rekening",
  "no rekening bank": "no_rekening",
  "nama rekening": "nama_rekening",
  "rekening atas nama": "nama_rekening",
  "nama di rekening": "nama_rekening",
  lintang: "lintang",
  latitude: "lintang",
  bujur: "bujur",
  longitude: "bujur",
};

interface ImportExcelModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ImportExcelModal({
  open,
  onClose,
}: ImportExcelModalProps) {
  const { importBulk } = useSiswa();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [mapped, setMapped] = useState<Record<string, any>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [stage, setStage] = useState<
    "upload" | "preview" | "importing" | "done"
  >("upload");
  const [result, setResult] = useState<{
    success: number;
    errors: any[];
  } | null>(null);
  const [jkWarnCount, setJkWarnCount] = useState(0);

  const reset = () => {
    setFile(null);
    setRows([]);
    setMapped([]);
    setHeaders([]);
    setStage("upload");
    setResult(null);
    setJkWarnCount(0);
  };

  const handleFile = useCallback((f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];

      // Use header: 1 to handle multi-row headers
      const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
      if (rows.length === 0) return;

      // 1. Cari baris mana yang merupakan HEADER asli (yang ada kata "Nama" atau "NISN")
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

      let rawHeaders: string[] = [];
      let jsonData: any[] = [];
      let dataStartRow = 1;

      const row0 = rows[headerRowIndex] || [];
      const row1 = rows[headerRowIndex + 1] || [];

      const is2RowHeader = row0.some((h) => {
        const s = String(h || "").toLowerCase();
        return (
          s.includes("data ayah") ||
          s.includes("data ibu") ||
          s.includes("data wali") ||
          s.includes("kesejahteraan") ||
          s.includes("pip") ||
          s.includes("kip")
        );
      });

      if (is2RowHeader) {
        let rawHeadersTemp: string[] = [];
        let currentGroup = "";

        for (let i = 0; i < row1.length; i++) {
          const main = String(row0[i] || "").trim();
          const sub = String(row1[i] || "").trim();

          if (main) {
            currentGroup = /(data (ayah|ibu|wali)|kesejahteraan|pip|kip)/i.test(
              main,
            )
              ? main
              : "";
          }

          if (currentGroup && sub) {
            rawHeadersTemp.push(`${currentGroup} ${sub}`);
          } else {
            rawHeadersTemp.push(sub || main || currentGroup);
          }
        }
        rawHeaders = rawHeadersTemp;
        dataStartRow = headerRowIndex + 2;

        jsonData = rows.slice(dataStartRow).map((r) => {
          const obj: any = {};
          rawHeaders.forEach((h, i) => {
            if (h) {
              const val = r[i];
              // Handle potential empty cells or spaces
              if (val !== undefined && val !== null) {
                obj[h] = val;
              }
            }
          });
          return obj;
        });
      } else {
        // Baris tunggal: gunakan row0 sebagai header
        rawHeaders = row0.map((h) => String(h || "").trim());
        dataStartRow = headerRowIndex + 1;

        jsonData = rows.slice(dataStartRow).map((r) => {
          const obj: any = {};
          rawHeaders.forEach((h, i) => {
            if (h) obj[h] = r[i];
          });
          return obj;
        });
      }

      setHeaders(rawHeaders);
      setRows(jsonData);

      // Auto-map using robust getVal logic
      let jkWarningCount = 0;
      const mappedData = jsonData.map((row) => {
        const getVal = (possibleNames: string[], index?: number) => {
          const keys = Object.keys(row);
          for (const name of possibleNames) {
            const cleanTarget = name.toLowerCase().replace(/[^a-z0-9]/g, "");
            const foundKey = keys.find((k) => {
              const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, "");
              // Cek exact match atau jika cleanKey mengandung cleanTarget (untuk handle 2-row header)
              return (
                cleanKey === cleanTarget ||
                cleanKey.includes(cleanTarget) ||
                cleanTarget.includes(cleanKey)
              );
            });
            if (
              foundKey &&
              row[foundKey] !== undefined &&
              row[foundKey] !== null &&
              row[foundKey] !== ""
            ) {
              return row[foundKey];
            }
          }
          if (index !== undefined) {
            const simpleBases = [
              "nama",
              "nik",
              "pekerjaan",
              "penghasilan",
              "pendidikan",
              "tahun lahir",
              "tgl lahir",
            ];
            let base = "";
            for (const pName of possibleNames) {
              const cleanP = pName.toLowerCase();
              if (simpleBases.some((b) => cleanP.includes(b))) {
                base = cleanP.replace(/[^a-z0-9]/g, "");
              }
            }
            if (!base)
              base = possibleNames[possibleNames.length - 1]
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");
            const commonKeys = keys.filter((k) =>
              k.toLowerCase().startsWith(base),
            );
            if (index < commonKeys.length) {
              const sortedKeys = commonKeys.sort((a, b) =>
                a.localeCompare(b, undefined, { numeric: true }),
              );
              return row[sortedKeys[index]];
            }
          }
          return "";
        };

        const jkRaw = getVal(["Jenis Kelamin", "JK", "L/P"])
          .toString()
          .toUpperCase()
          .trim();
        let jk: string | undefined = undefined;
        if (jkRaw.startsWith("P") || jkRaw === "PEREMPUAN") jk = "P";
        else if (jkRaw.startsWith("L") || jkRaw === "LAKI-LAKI") jk = "L";
        if (jk === undefined) jkWarningCount++;

        return {
          nama: getVal(["Nama Lengkap", "Nama Peserta Didik", "Nama"], 0)
            .toString()
            .trim(),
          nisn: getVal(["NISN"], 0).toString().trim(),
          nis: getVal(["NIPD", "NIS", "Nomor Induk", "Nomor Induk Siswa"])
            .toString()
            .trim(),
          nik: getVal(["NIK", "Nomor Induk Kependudukan"], 0).toString().trim(),
          no_kk: getVal([
            "No KK",
            "Nomor KK",
            "Kartu Keluarga",
            "Nomor Kartu Keluarga",
          ])
            .toString()
            .trim(),
          no_akta: getVal(["No Registrasi Akta Lahir", "No Akta", "Nomor Akta"])
            .toString()
            .trim(),
          tempat_lahir: getVal(["Tempat Lahir"]).toString().trim(),
          tanggal_lahir: normalizeTanggal(
            getVal(["Tanggal Lahir", "Tgl Lahir"]) as string | number,
          ),
          jk: jk ?? "",
          agama: getVal(["Agama"]).toString().trim(),
          kebutuhan_khusus: getVal(["Kebutuhan Khusus"]).toString().trim(),
          jml_saudara: getVal(["Jml Saudara", "Jumlah Saudara"])
            .toString()
            .trim(),
          anak_ke: getVal(["Anak Ke"]).toString().trim(),
          kelas: formatKelasDapodik(
            getVal([
              "Rombongan Belajar",
              "Rombel Saat Ini",
              "Kelas",
              "Rombel",
              "Rombel Saat Ini_1",
            ]),
          ),
          alamat: getVal(["Alamat Jalan", "Alamat", "Jalan"]).toString().trim(),
          rt: getVal(["RT"]).toString().trim(),
          rw: getVal(["RW"]).toString().trim(),
          dusun: getVal(["Nama Dusun", "Dusun"]).toString().trim(),
          kelurahan: getVal(["Desa/Kelurahan", "Kelurahan", "Desa"])
            .toString()
            .trim(),
          kecamatan: getVal(["Kecamatan"]).toString().trim(),
          kode_pos: getVal(["Kode Pos"]).toString().trim(),
          jenis_tinggal: getVal(["Jenis Tinggal"]).toString().trim(),
          alat_transportasi: getVal(["Alat Transportasi", "Transportasi"])
            .toString()
            .trim(),
          telepon: getVal(["Telepon", "Telepon Rumah"]).toString().trim(),
          no_wa: getVal(["Nomor HP", "No WA", "No HP", "HP"]).toString().trim(),
          email: getVal(["Email", "Surel"]).toString().trim(),
          jarak_rumah: getVal(["Jarak Rumah Ke Sekolah", "Jarak Rumah"])
            .toString()
            .trim(),

          nama_ayah: getVal(["Data Ayah Nama", "Nama Ayah"], 1)
            .toString()
            .trim(),
          nik_ayah: getVal(["Data Ayah NIK", "NIK Ayah", "NIK"], 1)
            .toString()
            .trim(),
          tahun_lahir_ayah: getVal(
            ["Data Ayah Tahun Lahir", "Tahun Lahir Ayah", "Tahun Lahir"],
            1,
          )
            .toString()
            .trim(),
          pendidikan_ayah: getVal(
            ["Data Ayah Jenjang Pendidikan", "Pendidikan Ayah", "Pendidikan"],
            1,
          )
            .toString()
            .trim(),
          pekerjaan_ayah: getVal(
            ["Data Ayah Pekerjaan", "Pekerjaan Ayah", "Pekerjaan"],
            1,
          )
            .toString()
            .trim(),
          penghasilan_ayah: getVal(
            ["Data Ayah Penghasilan", "Penghasilan Ayah", "Penghasilan"],
            1,
          )
            .toString()
            .trim(),

          nama_ibu: getVal(["Data Ibu Nama", "Nama Ibu"], 2).toString().trim(),
          nik_ibu: getVal(["Data Ibu NIK", "NIK Ibu", "NIK"], 2)
            .toString()
            .trim(),
          tahun_lahir_ibu: getVal(
            ["Data Ibu Tahun Lahir", "Tahun Lahir Ibu", "Tahun Lahir"],
            2,
          )
            .toString()
            .trim(),
          pendidikan_ibu: getVal(
            ["Data Ibu Jenjang Pendidikan", "Pendidikan Ibu", "Pendidikan"],
            2,
          )
            .toString()
            .trim(),
          pekerjaan_ibu: getVal(
            ["Data Ibu Pekerjaan", "Pekerjaan Ibu", "Pekerjaan"],
            2,
          )
            .toString()
            .trim(),
          penghasilan_ibu: getVal(
            ["Data Ibu Penghasilan", "Penghasilan Ibu", "Penghasilan"],
            2,
          )
            .toString()
            .trim(),

          nama_wali: getVal(["Data Wali Nama", "Nama Wali"], 3)
            .toString()
            .trim(),
          nik_wali: getVal(["Data Wali NIK", "NIK Wali", "NIK"], 3)
            .toString()
            .trim(),
          tahun_lahir_wali: getVal(
            ["Data Wali Tahun Lahir", "Tahun Lahir Wali", "Tahun Lahir"],
            3,
          )
            .toString()
            .trim(),
          pendidikan_wali: getVal(
            ["Data Wali Jenjang Pendidikan", "Pendidikan Wali", "Pendidikan"],
            3,
          )
            .toString()
            .trim(),
          pekerjaan_wali: getVal(
            ["Data Wali Pekerjaan", "Pekerjaan Wali", "Pekerjaan"],
            3,
          )
            .toString()
            .trim(),
          penghasilan_wali: getVal(
            ["Data Wali Penghasilan", "Penghasilan Wali", "Penghasilan"],
            3,
          )
            .toString()
            .trim(),

          asal_sekolah: getVal(["Asal Sekolah"]).toString().trim(),
          no_peserta_un: getVal(["No Peserta UN"]).toString().trim(),
          no_ijazah: getVal(["No Ijazah"]).toString().trim(),
          skhun: getVal(["SKHUN", "No SKHUN"]).toString().trim(),

          berat_badan: getVal(["Berat Badan"]).toString().trim(),
          tinggi_badan: getVal(["Tinggi Badan"]).toString().trim(),
          lingkar_kepala: getVal(["Lingkar Kepala"]).toString().trim(),

          penerima_kps: formatYaTidak(getVal(["Penerima KPS", "KPS"])),
          no_kps: getVal(["No KPS", "Nomor KPS"]).toString().trim(),
          penerima_kip: formatYaTidak(getVal(["Penerima KIP", "KIP"])),
          no_kip: getVal(["No KIP", "Nomor KIP"]).toString().trim(),
          nama_kip: getVal(["Nama di KIP", "Nama KIP"]).toString().trim(),
          layak_pip: formatYaTidak(
            getVal([
              "Layak PIP (usulan dari sekolah)",
              "Layak PIP",
              "PIP",
              "Usulan PIP",
            ]),
          ),
          alasan_pip: getVal(["Alasan Layak PIP", "Alasan PIP", "Alasan"])
            .toString()
            .trim(),
          no_kks: getVal(["No KKS", "Nomor KKS"]).toString().trim(),
          bank: getVal(["Bank"]).toString().trim(),
          no_rekening: getVal(["No Rekening Bank", "No Rekening"])
            .toString()
            .trim(),
          nama_rekening: getVal(["Rekening Atas Nama", "Nama di Rekening"])
            .toString()
            .trim(),

          lintang: getVal(["Lintang", "Latitude"]).toString().trim(),
          bujur: getVal(["Bujur", "Longitude"]).toString().trim(),
        };
      });

      setJkWarnCount(jkWarningCount);
      setMapped(
        mappedData.filter((row) => row.nama && row.nama !== "Tanpa Nama"),
      );
      setStage("preview");
    };
    reader.readAsArrayBuffer(f);
  }, []);

  const handleImport = async () => {
    setStage("importing");
    const res = await importBulk(mapped);
    setResult(res);
    setStage("done");
  };

  return (
    <AnimatePresence>
      {open && (
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
            if (e.target === e.currentTarget) {
              onClose();
              reset();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#141820] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Import
                Excel Dapodik
              </h2>
              <button
                onClick={() => {
                  onClose();
                  reset();
                }}
                className="p-1.5 rounded-lg text-white/50 hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {stage === "upload" && (
                <div className="space-y-4">
                  <div
                    className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:border-emerald-500/30 transition-all cursor-pointer"
                    onClick={() =>
                      document.getElementById("excel-input")?.click()
                    }
                  >
                    <Upload className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-white font-bold mb-2">
                      Pilih File Excel (.xlsx / .xls)
                    </h3>
                    <p className="text-sm text-slate-400">
                      File dari export Dapodik (Peserta Didik → Export Excel)
                    </p>
                    <input
                      id="excel-input"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFile(e.target.files[0]);
                      }}
                    />
                  </div>
                  <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs text-cyan-100/70 leading-relaxed">
                    <strong className="text-cyan-300">Tips:</strong> Sistem akan
                    otomatis mengenali nama kolom Dapodik (67 kolom) dan
                    memetakan ke database. Baris pertama Excel harus berisi
                    header.
                  </div>
                </div>
              )}

              {stage === "preview" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {file?.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {mapped.length} baris data · {headers.length} kolom
                        terdeteksi
                      </p>
                    </div>
                    <button
                      onClick={reset}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Ganti File
                    </button>
                  </div>

                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto rounded-xl border border-white/5 bg-black/20">
                    <table className="w-full text-[10px] table-auto border-collapse">
                      <thead className="sticky top-0 bg-[#0f1117] shadow-[0_1px_0_rgba(255,255,255,0.05)]">
                        <tr>
                          <th className="px-3 py-3 text-left text-slate-500 font-bold border-b border-white/5 bg-[#0f1117] sticky left-0 z-10">
                            #
                          </th>
                          {mapped.length > 0 &&
                            Object.keys(mapped[0]).map((h) => (
                              <th
                                key={h}
                                className="px-3 py-3 text-left text-slate-500 font-bold uppercase whitespace-nowrap border-b border-white/5"
                              >
                                {h.replace(/_/g, " ")}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mapped.slice(0, 50).map((row, i) => (
                          <tr
                            key={i}
                            className="border-t border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-3 py-2 text-slate-600 font-mono border-r border-white/5 bg-[#141820]/80 sticky left-0 z-10">
                              {i + 1}
                            </td>
                            {Object.keys(row).map((f) => (
                              <td
                                key={f}
                                className="px-3 py-2 text-white/70 whitespace-nowrap max-w-[200px] truncate border-r border-white/5 last:border-r-0"
                              >
                                {f.includes("penerima") || f === "layak_pip" ? (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${row[f] === "Ya" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/20"}`}
                                  >
                                    {row[f]}
                                  </span>
                                ) : (
                                  String(row[f] || "—")
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

              {stage === "importing" && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-6" />
                  <h3 className="text-lg font-bold text-white mb-2">
                    Mengimport {mapped.length} siswa...
                  </h3>
                  <p className="text-sm text-slate-400">
                    Data sedang di-upsert ke Supabase (batch 50)
                  </p>
                </div>
              )}

              {stage === "done" && result && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-4 border-emerald-500/40 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Import Selesai!
                  </h3>
                  <p className="text-emerald-300 font-bold">
                    ✅ {result.success} siswa berhasil diimport
                  </p>
                  {result.errors.length > 0 && (
                    <p className="text-red-400 text-sm mt-1">
                      ⚠️ {result.errors.length} baris gagal
                    </p>
                  )}
                  {jkWarnCount > 0 && (
                    <p className="text-amber-400 text-sm mt-1">
                      ⚠️ {jkWarnCount} baris memiliki jenis kelamin tidak
                      dikenali (dikosongkan)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {stage === "preview" && (
              <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3">
                <button
                  onClick={() => {
                    onClose();
                    reset();
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleImport}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-all"
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                  }}
                >
                  <Download className="w-4 h-4" /> Import {mapped.length} Siswa
                </button>
              </div>
            )}

            {stage === "done" && (
              <div className="px-6 py-4 border-t border-white/5 flex justify-center">
                <button
                  onClick={() => {
                    onClose();
                    reset();
                  }}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-white/10 border border-white/10 hover:bg-white/20 transition-all"
                >
                  Tutup
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
