"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  ShieldCheck,
  Home,
  Globe,
  Users,
  Heart,
  GraduationCap,
  X,
  Edit3,
  Printer,
  Sparkles,
  Baby,
  Briefcase,
  Activity,
  Stethoscope,
  BookOpen,
  ChevronRight,
  QrCode,
  Building,
  Map,
  Maximize,
  FileText,
  Upload,
  Eye as EyeIcon,
  CheckCircle2,
  Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Siswa } from "@/types";
import { formatTanggal, cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import QRCode from "react-qr-code";
import { useAppStore } from "@/store/app.store";
import { useSchoolConfig } from "@/hooks/useSchoolConfig";

interface Props {
  siswa: Siswa | null;
  onClose: () => void;
  onEdit?: () => void;
}

type TabId =
  | "profil"
  | "akademik"
  | "ortu"
  | "kesehatan"
  | "kesejahteraan"
  | "dokumen";

const TABS: { id: TabId; label: string; icon: any; color: string }[] = [
  { id: "profil", label: "Profil", icon: User, color: "#a78bfa" },
  { id: "akademik", label: "Akademik", icon: BookOpen, color: "#22d3ee" },
  { id: "ortu", label: "Keluarga", icon: Users, color: "#34d399" },
  { id: "dokumen", label: "Dokumen", icon: FileText, color: "#f472b6" },
  { id: "kesehatan", label: "Sehat", icon: Heart, color: "#fb7185" },
  { id: "kesejahteraan", label: "Bantuan", icon: CreditCard, color: "#fbbf24" },
];

export function SiswaDetail360({ siswa, onClose, onEdit }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("profil");
  const [showQR, setShowQR] = useState(false);
  const [showPhotoFullscreen, setShowPhotoFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [localSiswa, setLocalSiswa] = useState<Siswa | null>(siswa);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const { pengaturan } = useAppStore();
  const config = useSchoolConfig();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (!localSiswa) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const s = localSiswa;
    const p = pengaturan;
    const logoUrl = p?.logo_url || "";
    const kopUrl = p?.kop_surat_url || "";
    const schoolName = config.namaSekolah;

    printWindow.document.write(`
      <html>
        <head>
          <title>Buku Induk - ${s.nama}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Times New Roman', serif; padding: 0; margin: 0; font-size: 11pt; color: black; background: #eee; }
            .page { background: white; width: 210mm; min-height: 297mm; margin: 10mm auto; padding: 15mm 20mm; box-shadow: 0 0 10px rgba(0,0,0,0.1); box-sizing: border-box; }
            .header-kop { text-align: center; border-bottom: 3px double black; padding-bottom: 10px; margin-bottom: 20px; display: flex; align-items: center; gap: 20px; }
            .header-kop img.logo { width: 80px; height: 80px; object-fit: contain; }
            .header-kop .title { flex: 1; }
            .header-kop h1 { margin: 0; font-size: 14pt; text-transform: uppercase; }
            .header-kop h2 { margin: 5px 0 0 0; font-size: 16pt; text-transform: uppercase; font-weight: 900; }
            .header-kop p { margin: 5px 0 0 0; font-size: 10pt; }

            .doc-title { text-align: center; margin-bottom: 30px; }
            .doc-title h3 { text-decoration: underline; margin: 0; font-size: 14pt; text-transform: uppercase; font-weight: bold; }
            .doc-title p { margin: 5px 0 0 0; font-weight: bold; }

            .section-header { font-weight: bold; background: #f2f2f2; padding: 6px 12px; margin: 20px 0 10px 0; border: 1px solid #ccc; font-size: 11pt; text-transform: uppercase; border-radius: 4px; }

            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; table-layout: fixed; }
            table td { padding: 4px 0; vertical-align: top; font-size: 10.5pt; line-height: 1.4; }
            .label { width: 180px; position: relative; padding-left: 5px; }
            .colon { width: 15px; text-align: center; }
            .value { font-weight: 500; word-wrap: break-word; }

            .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-start; page-break-inside: avoid; }
            .photo-area { text-align: center; }
            .photo-box { width: 3cm; height: 4cm; border: 1px solid #aaa; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 5px; background: #fafafa; }
            .photo-box img { width: 100%; height: 100%; object-fit: cover; }
            .photo-placeholder { font-size: 8pt; color: #999; }

            .ttd-box { width: 250px; text-align: center; }
            .ttd-signature { height: 90px; position: relative; margin: 10px 0; }
            .ttd-img { position: absolute; width: 160px; z-index: 1; top: 0; left: 50%; transform: translateX(-50%); opacity: 0.9; }
            .stempel-img { position: absolute; width: 130px; z-index: 2; top: -10px; left: 20px; mix-blend-mode: multiply; }

            .no-print { position: fixed; top: 20px; right: 20px; z-index: 1000; }
            .btn-print { background: #059669; color: white; padding: 12px 24px; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(5,150,105,0.3); font-family: sans-serif; display: flex; align-items: center; gap: 8px; }
            .btn-print:hover { background: #047857; }

            @media print {
              body { background: white; padding: 0; }
              .page { box-shadow: none; margin: 0; border: none; width: 100%; padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button class="btn-print" onclick="window.print()">🖨️ CETAK LEMBAR BUKU INDUK</button>
          </div>
          <div class="page">
            ${
              kopUrl
                ? `<img src="${kopUrl}" style="width: 100%; margin-bottom: 10px;" />`
                : `
              <div class="header-kop">
                <img src="${logoUrl || "https://upload.wikimedia.org/wikipedia/commons/b/b2/Logo_Kabupaten_Sukabumi.png"}" class="logo" />
                <div class="title">
                  <h1>Pemerintah Kabupaten Sukabumi</h1>
                  <h2>${schoolName}</h2>
                  <p>${config.alamatSekolah}</p>
                  <p>Tahun Ajaran: ${p?.tahun_ajaran || "2024/2025"}</p>
                </div>
              </div>
            `
            }

            <div class="doc-title">
              <h3>KETERANGAN TENTANG DIRI PESERTA DIDIK</h3>
              <p>Nomor Induk Siswa (NIS): ${s.nis || "-"}</p>
            </div>

            <div class="section-header">A. IDENTITAS PESERTA DIDIK</div>
            <table>
              <tr><td class="label">1. Nama Lengkap</td><td class="colon">:</td><td class="value" style="font-weight:bold; text-transform:uppercase;">${s.nama}</td></tr>
              <tr><td class="label">2. NISN</td><td class="colon">:</td><td class="value">${s.nisn}</td></tr>
              <tr><td class="label">3. NIK</td><td class="colon">:</td><td class="value">${s.nik || "-"}</td></tr>
              <tr><td class="label">4. Tempat, Tanggal Lahir</td><td class="colon">:</td><td class="value">${s.tempat_lahir || "-"}, ${s.tanggal_lahir ? formatTanggal(s.tanggal_lahir) : "-"}</td></tr>
              <tr><td class="label">5. Jenis Kelamin</td><td class="colon">:</td><td class="value">${s.jk === "L" ? "Laki-laki" : "Perempuan"}</td></tr>
              <tr><td class="label">6. Agama</td><td class="colon">:</td><td class="value">${s.agama || "-"}</td></tr>
              <tr><td class="label">7. Kewarganegaraan</td><td class="colon">:</td><td class="value">Indonesia</td></tr>
              <tr><td class="label">8. Anak Ke-</td><td class="colon">:</td><td class="value">${s.anak_ke || "-"}</td></tr>
              <tr><td class="label">9. Jumlah Saudara Kandung</td><td class="colon">:</td><td class="value">${s.jml_saudara || "-"}</td></tr>
              <tr><td class="label">10. Kebutuhan Khusus</td><td class="colon">:</td><td class="value">${s.kebutuhan_khusus || "Tidak Ada"}</td></tr>
            </table>

            <div class="section-header">B. KETERANGAN TEMPAT TINGGAL</div>
            <table>
              <tr><td class="label">1. Alamat Lengkap</td><td class="colon">:</td><td class="value">${s.alamat || "-"}</td></tr>
              <tr><td class="label">2. RT / RW</td><td class="colon">:</td><td class="value">${s.rt || "-"}/${s.rw || "-"}</td></tr>
              <tr><td class="label">3. Dusun / Kampung</td><td class="colon">:</td><td class="value">${s.dusun || "-"}</td></tr>
              <tr><td class="label">4. Kelurahan / Desa</td><td class="colon">:</td><td class="value">${s.kelurahan || "-"}</td></tr>
              <tr><td class="label">5. Kecamatan</td><td class="colon">:</td><td class="value">${s.kecamatan || "-"}</td></tr>
              <tr><td class="label">6. Kode Pos</td><td class="colon">:</td><td class="value">${s.kode_pos || "-"}</td></tr>
              <tr><td class="label">7. Nomor Telepon / HP</td><td class="colon">:</td><td class="value">${s.no_wa || s.telepon || "-"}</td></tr>
              <tr><td class="label">8. Tinggal dengan</td><td class="colon">:</td><td class="value">${s.jenis_tinggal || "-"}</td></tr>
              <tr><td class="label">9. Jarak ke Sekolah</td><td class="colon">:</td><td class="value">${s.jarak_rumah || s.jarak_sekolah || "-"} km</td></tr>
              <tr><td class="label">10. Alat Transportasi</td><td class="colon">:</td><td class="value">${s.alat_transportasi || "-"}</td></tr>
            </table>

            <div class="section-header">C. KETERANGAN KESEHATAN</div>
            <table>
              <tr><td class="label">1. Golongan Darah</td><td class="colon">:</td><td class="value">${s.gol_darah || "-"}</td></tr>
              <tr><td class="label">2. Penyakit yang Pernah Diderita</td><td class="colon">:</td><td class="value">${s.penyakit_khusus || "-"}</td></tr>
              <tr><td class="label">3. Kelainan Jasmani</td><td class="colon">:</td><td class="value">${s.layanan_khusus || "-"}</td></tr>
              <tr><td class="label">4. Tinggi / Berat Badan</td><td class="colon">:</td><td class="value">${s.tinggi_badan || "-"} cm / ${s.berat_badan || "-"} kg</td></tr>
            </table>

            <div class="section-header">D. KETERANGAN PENDIDIKAN SEBELUMNYA</div>
            <table>
              <tr><td class="label">1. Lulusan dari (TK/RA)</td><td class="colon">:</td><td class="value">${s.asal_sekolah || "-"}</td></tr>
              <tr><td class="label">2. Nomor Ijazah Terakhir</td><td class="colon">:</td><td class="value">${s.no_ijazah || "-"}</td></tr>
              <tr><td class="label">3. Tanggal Ijazah</td><td class="colon">:</td><td class="value">-</td></tr>
              <tr><td class="label">4. Lama Belajar</td><td class="colon">:</td><td class="value">-</td></tr>
            </table>

            <div class="section-header">E. KETERANGAN ORANG TUA KANDUNG</div>
            <table>
              <tr><td class="label"><b>Ayah Kandung</b></td><td class="colon"></td><td class="value"></td></tr>
              <tr><td class="label">1. Nama Lengkap</td><td class="colon">:</td><td class="value">${s.nama_ayah || "-"}</td></tr>
              <tr><td class="label">2. NIK Ayah</td><td class="colon">:</td><td class="value">${s.nik_ayah || "-"}</td></tr>
              <tr><td class="label">3. Tahun Lahir</td><td class="colon">:</td><td class="value">${s.tahun_lahir_ayah || "-"}</td></tr>
              <tr><td class="label">4. Pendidikan Terakhir</td><td class="colon">:</td><td class="value">${s.pendidikan_ayah || "-"}</td></tr>
              <tr><td class="label">5. Pekerjaan Utama</td><td class="colon">:</td><td class="value">${s.pekerjaan_ayah || "-"}</td></tr>
              <tr><td class="label">6. Penghasilan Per Bulan</td><td class="colon">:</td><td class="value">${s.penghasilan_ayah || "-"}</td></tr>

              <tr style="height:10px;"></tr>

              <tr><td class="label"><b>Ibu Kandung</b></td><td class="colon"></td><td class="value"></td></tr>
              <tr><td class="label">1. Nama Lengkap</td><td class="colon">:</td><td class="value">${s.nama_ibu || "-"}</td></tr>
              <tr><td class="label">2. NIK Ibu</td><td class="colon">:</td><td class="value">${s.nik_ibu || "-"}</td></tr>
              <tr><td class="label">3. Tahun Lahir</td><td class="colon">:</td><td class="value">${s.tahun_lahir_ibu || "-"}</td></tr>
              <tr><td class="label">4. Pendidikan Terakhir</td><td class="colon">:</td><td class="value">${s.pendidikan_ibu || "-"}</td></tr>
              <tr><td class="label">5. Pekerjaan Utama</td><td class="colon">:</td><td class="value">${s.pekerjaan_ibu || "-"}</td></tr>
              <tr><td class="label">6. Penghasilan Per Bulan</td><td class="colon">:</td><td class="value">${s.penghasilan_ibu || "-"}</td></tr>
            </table>

            <div class="section-header">F. KETERANGAN WALI (JIKA ADA)</div>
            <table>
              <tr><td class="label">1. Nama Lengkap Wali</td><td class="colon">:</td><td class="value">${s.nama_wali || "-"}</td></tr>
              <tr><td class="label">2. NIK Wali</td><td class="colon">:</td><td class="value">${s.nik_wali || "-"}</td></tr>
              <tr><td class="label">3. Pendidikan Terakhir</td><td class="colon">:</td><td class="value">${s.pendidikan_wali || "-"}</td></tr>
              <tr><td class="label">4. Pekerjaan Utama</td><td class="colon">:</td><td class="value">${s.pekerjaan_wali || "-"}</td></tr>
              <tr><td class="label">5. Hubungan Keluarga</td><td class="colon">:</td><td class="value">${s.hub_keluarga_wali || "-"}</td></tr>
            </table>

            <div class="section-header">G. DATA KESEJAHTERAAN</div>
            <table>
              <tr><td class="label">1. No. KK</td><td class="colon">:</td><td class="value">${s.no_kk || "-"}</td></tr>
              <tr><td class="label">2. Penerima KPS/PKH</td><td class="colon">:</td><td class="value">${s.penerima_kps || "Tidak"} ${s.no_kps ? "(" + s.no_kps + ")" : ""}</td></tr>
              <tr><td class="label">3. Penerima KIP</td><td class="colon">:</td><td class="value">${s.penerima_kip || "Tidak"} ${s.no_kip ? "(" + s.no_kip + ")" : ""}</td></tr>
              <tr><td class="label">4. Layak PIP</td><td class="colon">:</td><td class="value">${s.layak_pip || "Tidak"} ${s.alasan_pip ? "(Alasan: " + s.alasan_pip + ")" : ""}</td></tr>
              <tr><td class="label">5. Bank / No. Rekening</td><td class="colon">:</td><td class="value">${s.bank || "-"} / ${s.no_rekening || "-"} a.n ${s.nama_rekening || "-"}</td></tr>
            </table>

            <div class="footer">
              <div class="photo-area">
                <div class="photo-box">
                  ${s.foto_url ? `<img src="${s.foto_url}" />` : `<div class="photo-placeholder">Pas Foto<br/>3 x 4</div>`}
                </div>
                <p style="font-size: 8pt; margin: 0; color: #666;">Dicetak via Portal Kesiswaan</p>
              </div>

              <div class="ttd-box">
                <p>${config.kotaSekolah}, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                <p>Kepala Sekolah,</p>
                <div class="ttd-signature">
                  ${p?.ttd_url ? `<img src="${p.ttd_url}" class="ttd-img" />` : ""}
                  ${p?.stempel_url ? `<img src="${p.stempel_url}" class="stempel-img" />` : ""}
                </div>
                <p style="font-weight: bold; text-decoration: underline; text-transform: uppercase; margin-bottom: 0;">${config.namaKepsek}</p>
                <p style="margin-top: 4px;">NIP. ${config.nipKepsek}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [localSiswa, pengaturan, config]);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (siswa) setLocalSiswa(siswa);
  }, [siswa]);

  const handleUploadClick = (docId: string) => {
    setSelectedDocType(docId);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDocType) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB!");
      return;
    }

    const GAS_URL = pengaturan?.gas_web_app_url;
    if (!GAS_URL) {
      toast.error("URL Web App Apps Script belum disetel di Pengaturan!");
      return;
    }

    setUploadingDoc(selectedDocType);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = (reader.result as string).split(",")[1];
      const fileName = `[${localSiswa?.nisn}]_${selectedDocType}_${file.name}`;

      const uploadPromise = async () => {
        const res = await fetch(GAS_URL, {
          method: "POST",
          body: JSON.stringify({
            base64: base64Data,
            name: fileName,
            type: file.type,
            studentName: `[${localSiswa?.nisn}] - ${localSiswa?.nama}`,
          }),
        });

        const result = await res.json();
        if (result.status !== "sukses") throw new Error(result.error);

        const DOC_COLUMN_MAP: Record<string, string> = {
          akta: "url_akta",
          kk: "url_kk",
          ijazah: "url_ijazah",
        };
        const columnUrl = DOC_COLUMN_MAP[selectedDocType ?? ""] ?? "url_ijazah";

        // Simpan ID File dari Google Drive ke kolom URL khusus agar TIDAK menimpa Nomor Dapodik!
        const supabase = createClient();
        const { error } = await supabase
          .from("siswa")
          .update({ [columnUrl]: result.id })
          .eq("id", localSiswa?.id);

        if (error)
          throw new Error(
            "File tersimpan di Drive, tapi gagal update ke Database.",
          );

        // Update UI seketika
        setLocalSiswa((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            [columnUrl]: result.id,
          };
        });

        return result.url;
      };

      toast.promise(uploadPromise(), {
        loading: `Mengunggah ${file.name} ke Google Drive...`,
        success: () => {
          setUploadingDoc(null);
          return `Berhasil! Dokumen tersimpan di Drive.`;
        },
        error: (err) => {
          setUploadingDoc(null);
          return `Gagal: ${err.message}`;
        },
      });
    };

    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isOpen = !!siswa;

  const getClassColor = (kelas?: string | null) => {
    if (!kelas)
      return {
        bg: "rgba(139,92,246,0.20)",
        border: "rgba(139,92,246,0.35)",
        color: "#a78bfa",
      };
    const k = String(kelas).toLowerCase();
    if (k.includes("1") || k.includes("2") || k.includes("a"))
      return {
        bg: "rgba(59,130,246,0.20)",
        border: "rgba(59,130,246,0.35)",
        color: "#60a5fa",
      };
    if (k.includes("3") || k.includes("4") || k.includes("b"))
      return {
        bg: "rgba(16,185,129,0.20)",
        border: "rgba(16,185,129,0.35)",
        color: "#34d399",
      };
    if (k.includes("5") || k.includes("6") || k.includes("c"))
      return {
        bg: "rgba(245,158,11,0.20)",
        border: "rgba(245,158,11,0.35)",
        color: "#fbbf24",
      };
    return {
      bg: "rgba(236,72,153,0.20)",
      border: "rgba(236,72,153,0.35)",
      color: "#f472b6",
    };
  };

  const avatarColor = getClassColor(localSiswa?.kelas);

  const drawer = (
    <AnimatePresence>
      {isOpen && localSiswa && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[155]"
          style={{
            background: "rgba(5,8,17,0.65)",
            backdropFilter: "blur(6px)",
          }}
        />
      )}

      {/* Right Drawer Panel */}
      {isOpen && localSiswa && (
        <motion.div
          key="drawer"
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 32,
            mass: 0.8,
          }}
          className="fixed top-0 right-0 bottom-0 z-[160] flex flex-col overflow-hidden"
          style={{
            width: "min(480px, 100vw)",
            background: "#0a0f1e",
            borderLeft: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "-24px 0 80px rgba(0,0,0,0.7)",
          }}
        >
          {/* ── Hero Section ──────────────────────── */}
          <div
            className="relative flex-shrink-0 overflow-hidden"
            style={{
              background:
                "linear-gradient(160deg, #1a0533 0%, #0f1560 40%, #050d1e 100%)",
              minHeight: "200px",
            }}
          >
            {/* Dot grid */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(139,92,246,0.35) 1px, transparent 0)",
                backgroundSize: "20px 20px",
              }}
            />
            {/* Glow orbs */}
            <div
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-40 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
                filter: "blur(50px)",
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-25 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, #22d3ee 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
            />

            {/* Close button */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
              <button
                onClick={() => setShowQR(!showQR)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/50 hover:text-cyan-400 transition-colors"
                style={{
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <QrCode size={15} />
              </button>
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white/50 hover:text-violet-400 transition-colors"
                  style={{
                    background: "rgba(0,0,0,0.25)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <Edit3 size={15} />
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors"
                style={{
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Avatar + Info */}
            <div className="relative z-10 p-6 pb-5">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative group flex-shrink-0">
                  <button
                    onClick={() =>
                      localSiswa.foto_url && setShowPhotoFullscreen(true)
                    }
                    className="relative"
                  >
                    <div
                      className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center transition-all group-hover:scale-105"
                      style={{
                        background: avatarColor.bg,
                        border: `2px solid ${avatarColor.border}`,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                      }}
                    >
                      {localSiswa.foto_url ? (
                        <img
                          src={localSiswa.foto_url}
                          alt={localSiswa.nama}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span
                          className="text-2xl font-black"
                          style={{ color: avatarColor.color }}
                        >
                          {localSiswa.nama
                            .split(" ")
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join("")}
                        </span>
                      )}
                    </div>
                    {localSiswa.foto_url && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/30 rounded-2xl">
                        <Maximize size={18} className="text-white" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Name & badges */}
                <div className="flex-1 min-w-0 mt-1">
                  <h2 className="text-lg font-black text-white/95 leading-tight truncate">
                    {localSiswa.nama}
                  </h2>
                  <p className="text-[11px] text-white/40 font-mono mt-0.5">
                    {localSiswa.nisn}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {localSiswa.kelas && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{
                          background: "rgba(34,211,238,0.15)",
                          border: "1px solid rgba(34,211,238,0.25)",
                          color: "#67e8f9",
                        }}
                      >
                        Kelas {localSiswa.kelas}
                      </span>
                    )}
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={
                        localSiswa.jk === "L"
                          ? {
                              background: "rgba(59,130,246,0.15)",
                              border: "1px solid rgba(59,130,246,0.25)",
                              color: "#93c5fd",
                            }
                          : {
                              background: "rgba(244,63,94,0.15)",
                              border: "1px solid rgba(244,63,94,0.25)",
                              color: "#fda4af",
                            }
                      }
                    >
                      {localSiswa.jk === "L" ? "♂ Laki-laki" : "♀ Perempuan"}
                    </span>
                    {localSiswa.agama && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{
                          background: "rgba(251,191,36,0.12)",
                          border: "1px solid rgba(251,191,36,0.20)",
                          color: "#fbbf24",
                        }}
                      >
                        {localSiswa.agama}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* QR Code inline */}
              <AnimatePresence>
                {showQR && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 overflow-hidden"
                  >
                    <div
                      className="flex items-center gap-4 p-3 rounded-2xl"
                      style={{
                        background: "rgba(0,0,0,0.30)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <div className="p-2 rounded-xl bg-white">
                        <QRCode
                          value={`NISN:${localSiswa.nisn}`}
                          size={72}
                          level="M"
                          fgColor="#1a0533"
                          bgColor="transparent"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                          Virtual ID
                        </p>
                        <p className="text-sm font-bold text-white/80">
                          {localSiswa.nama}
                        </p>
                        <p className="text-xs font-mono text-violet-400">
                          {localSiswa.nisn}
                        </p>
                        <p className="text-[10px] text-white/30 mt-1">
                          Scan untuk verifikasi siswa
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tab navigation — pinned to bottom of hero */}
            <div className="flex px-4 pb-0 relative z-10 gap-0.5">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex-1 flex flex-col items-center gap-1 px-1 py-2.5 relative transition-all"
                  >
                    <Icon
                      size={14}
                      style={{
                        color: active ? tab.color : "rgba(255,255,255,0.30)",
                      }}
                    />
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        color: active ? tab.color : "rgba(255,255,255,0.30)",
                      }}
                    >
                      {tab.label}
                    </span>
                    {active && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                        style={{
                          background: tab.color,
                          boxShadow: `0 0 8px ${tab.color}`,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Content Area ────────────────────── */}
          <div
            className="flex-1 overflow-y-auto custom-scroll"
            style={{ background: "#0a0f1e" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="p-5 space-y-5"
              >
                {activeTab === "profil" && (
                  <>
                    <Section title="Data Diri" icon={User} color="#a78bfa">
                      <InfoRow label="NIS" value={localSiswa.nis} mono />
                      <InfoRow label="NIK" value={localSiswa.nik} mono />
                      <InfoRow label="No. KK" value={localSiswa.no_kk} mono />
                      <InfoRow
                        label="No. Akta Lahir"
                        value={localSiswa.no_akta}
                        mono
                      />
                      <InfoRow label="Agama" value={localSiswa.agama} />
                      <InfoRow
                        label="Tempat Lahir"
                        value={localSiswa.tempat_lahir}
                      />
                      <InfoRow
                        label="Tanggal Lahir"
                        value={
                          localSiswa.tanggal_lahir
                            ? formatTanggal(localSiswa.tanggal_lahir)
                            : null
                        }
                      />
                      <InfoRow label="Anak Ke" value={localSiswa.anak_ke} />
                      <InfoRow
                        label="Jumlah Saudara"
                        value={localSiswa.jml_saudara}
                      />
                    </Section>
                    <Section
                      title="Domisili & Kontak"
                      icon={Home}
                      color="#a78bfa"
                    >
                      <InfoRow label="Alamat" value={localSiswa.alamat} />
                      <InfoRow
                        label="RT / RW"
                        value={
                          localSiswa.rt && localSiswa.rw
                            ? `${localSiswa.rt} / ${localSiswa.rw}`
                            : null
                        }
                      />
                      <InfoRow
                        label="Dusun / Kampung"
                        value={localSiswa.dusun}
                      />
                      <InfoRow label="Kelurahan" value={localSiswa.kelurahan} />
                      <InfoRow label="Kecamatan" value={localSiswa.kecamatan} />
                      <InfoRow
                        label="Kode Pos"
                        value={localSiswa.kode_pos}
                        mono
                      />
                      <InfoRow
                        label="Lintang"
                        value={localSiswa.lintang}
                        mono
                      />
                      <InfoRow label="Bujur" value={localSiswa.bujur} mono />
                      <InfoRow label="WhatsApp" value={localSiswa.no_wa} />
                      <InfoRow label="Telepon" value={localSiswa.telepon} />
                      <InfoRow label="Email" value={localSiswa.email} />
                    </Section>
                  </>
                )}

                {activeTab === "akademik" && (
                  <>
                    <Section
                      title="Status Siswa"
                      icon={BookOpen}
                      color="#22d3ee"
                    >
                      <InfoRow label="Kelas" value={localSiswa.kelas} />
                      <InfoRow
                        label="Tahun Masuk"
                        value={localSiswa.tahun_masuk}
                      />
                      <InfoRow
                        label="Status Siswa"
                        value={localSiswa.status_siswa || "Aktif"}
                      />
                      <InfoRow
                        label="Asal Sekolah"
                        value={localSiswa.asal_sekolah}
                      />
                    </Section>
                    <Section
                      title="Transportasi & Jarak"
                      icon={Map}
                      color="#22d3ee"
                    >
                      <InfoRow
                        label="Jenis Tinggal"
                        value={localSiswa.jenis_tinggal}
                      />
                      <InfoRow
                        label="Transportasi"
                        value={localSiswa.alat_transportasi}
                      />
                      <InfoRow
                        label="Jarak Sekolah"
                        value={
                          localSiswa.jarak_rumah
                            ? `${localSiswa.jarak_rumah} km`
                            : localSiswa.jarak_sekolah
                              ? `${localSiswa.jarak_sekolah} km`
                              : null
                        }
                      />
                    </Section>
                    <Section
                      title="Dokumen Kelulusan"
                      icon={GraduationCap}
                      color="#22d3ee"
                    >
                      <InfoRow
                        label="No Peserta UN"
                        value={localSiswa.no_peserta_un}
                        mono
                      />
                      <InfoRow
                        label="No Ijazah"
                        value={localSiswa.no_ijazah}
                        mono
                      />
                      <InfoRow label="SKHUN" value={localSiswa.skhun} mono />
                    </Section>
                  </>
                )}

                {activeTab === "ortu" && (
                  <>
                    <Section title="Ayah" icon={Users} color="#34d399">
                      <InfoRow label="Nama" value={localSiswa.nama_ayah} />
                      <InfoRow label="NIK" value={localSiswa.nik_ayah} mono />
                      <InfoRow
                        label="Tahun Lahir"
                        value={localSiswa.tahun_lahir_ayah}
                      />
                      <InfoRow
                        label="Pendidikan"
                        value={localSiswa.pendidikan_ayah}
                      />
                      <InfoRow
                        label="Pekerjaan"
                        value={localSiswa.pekerjaan_ayah}
                      />
                      <InfoRow
                        label="Penghasilan"
                        value={localSiswa.penghasilan_ayah}
                      />
                    </Section>
                    <Section title="Ibu" icon={Users} color="#34d399">
                      <InfoRow label="Nama" value={localSiswa.nama_ibu} />
                      <InfoRow label="NIK" value={localSiswa.nik_ibu} mono />
                      <InfoRow
                        label="Tahun Lahir"
                        value={localSiswa.tahun_lahir_ibu}
                      />
                      <InfoRow
                        label="Pendidikan"
                        value={localSiswa.pendidikan_ibu}
                      />
                      <InfoRow
                        label="Pekerjaan"
                        value={localSiswa.pekerjaan_ibu}
                      />
                      <InfoRow
                        label="Penghasilan"
                        value={localSiswa.penghasilan_ibu}
                      />
                    </Section>
                    {localSiswa.nama_wali && (
                      <Section title="Wali" icon={Users} color="#34d399">
                        <InfoRow
                          label="Nama Wali"
                          value={localSiswa.nama_wali}
                        />
                        <InfoRow label="NIK" value={localSiswa.nik_wali} mono />
                        <InfoRow
                          label="Tahun Lahir"
                          value={localSiswa.tahun_lahir_wali}
                        />
                        <InfoRow
                          label="Pendidikan"
                          value={localSiswa.pendidikan_wali}
                        />
                        <InfoRow
                          label="Hub. Keluarga"
                          value={localSiswa.hub_keluarga_wali}
                        />
                        <InfoRow
                          label="Pekerjaan"
                          value={localSiswa.pekerjaan_wali}
                        />
                        <InfoRow
                          label="Penghasilan"
                          value={localSiswa.penghasilan_wali}
                        />
                      </Section>
                    )}
                  </>
                )}

                {activeTab === "dokumen" && (
                  <div className="space-y-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />

                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-white/80">
                        Dokumen Digital
                      </h3>
                      <span className="text-[10px] font-bold text-pink-400 bg-pink-400/10 px-2 py-0.5 rounded-full">
                        {
                          [
                            localSiswa.url_akta,
                            localSiswa.url_kk,
                            localSiswa.url_ijazah,
                          ].filter(Boolean).length
                        }{" "}
                        / 3 Lengkap
                      </span>
                    </div>

                    {[
                      {
                        label: "Akta Kelahiran",
                        id: "akta",
                        no: localSiswa.no_akta,
                        url: localSiswa.url_akta,
                        icon: Baby,
                      },
                      {
                        label: "Kartu Keluarga",
                        id: "kk",
                        no: localSiswa.no_kk,
                        url: localSiswa.url_kk,
                        icon: Home,
                      },
                      {
                        label: "Ijazah Terakhir",
                        id: "ijazah",
                        no: localSiswa.no_ijazah,
                        url: localSiswa.url_ijazah,
                        icon: GraduationCap,
                      },
                    ].map((doc) => {
                      // Cek apakah kolom url ada isinya, atau jika ID tersimpan di nomor dapodik (fallback bug lama)
                      const isUploaded = !!doc.url;
                      const driveId = doc.url || doc.no;

                      return (
                        <div
                          key={doc.id}
                          className="p-4 rounded-2xl transition-all group"
                          style={{
                            background: "rgba(255,255,255,0.015)",
                            border: "1px solid rgba(255,255,255,0.03)",
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                              <doc.icon size={18} className="text-pink-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white/80">
                                {doc.label}
                              </p>
                              <p className="text-[11px] text-white/40 truncate mt-0.5">
                                {doc.no ? `No: ${doc.no}` : "Nomor Belum Diisi"}
                              </p>
                              {isUploaded && (
                                <p className="text-[10px] text-emerald-400 font-bold mt-1">
                                  ✓ File Tersimpan di Drive
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isUploaded && (
                                <button
                                  onClick={() =>
                                    window.open(
                                      driveId?.includes("http")
                                        ? driveId
                                        : `https://drive.google.com/open?id=${driveId}`,
                                      "_blank",
                                    )
                                  }
                                  className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                >
                                  <EyeIcon size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => handleUploadClick(doc.id)}
                                disabled={uploadingDoc === doc.id}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-400 text-[11px] font-bold hover:bg-pink-500/20 transition-all disabled:opacity-50 disabled:cursor-wait"
                              >
                                {uploadingDoc === doc.id ? (
                                  <div className="w-3 h-3 rounded-full border-2 border-pink-400 border-t-transparent animate-spin" />
                                ) : (
                                  <Upload size={12} />
                                )}
                                {uploadingDoc === doc.id
                                  ? "Uploading..."
                                  : isUploaded
                                    ? "Update File"
                                    : "Upload"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="mt-6 p-4 rounded-2xl bg-violet-500/05 border border-violet-500/15">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                          <Info size={14} className="text-violet-400" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-violet-300 uppercase tracking-widest">
                            Informasi Dokumen
                          </p>
                          <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                            Pastikan dokumen yang diunggah dalam format PDF atau
                            Gambar (JPG/PNG) dengan ukuran maksimal 2MB per
                            file.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "kesehatan" && (
                  <>
                    <Section title="Fisik" icon={Activity} color="#fb7185">
                      <InfoRow
                        label="Tinggi Badan"
                        value={
                          localSiswa.tinggi_badan
                            ? `${localSiswa.tinggi_badan} cm`
                            : null
                        }
                      />
                      <InfoRow
                        label="Berat Badan"
                        value={
                          localSiswa.berat_badan
                            ? `${localSiswa.berat_badan} kg`
                            : null
                        }
                      />
                      <InfoRow
                        label="Lingkar Kepala"
                        value={
                          localSiswa.lingkar_kepala
                            ? `${localSiswa.lingkar_kepala} cm`
                            : null
                        }
                      />
                      <InfoRow
                        label="Gol. Darah"
                        value={localSiswa.gol_darah}
                      />
                    </Section>
                    <Section
                      title="Kebutuhan Khusus"
                      icon={Baby}
                      color="#fb7185"
                    >
                      <InfoRow
                        label="Penyakit Khusus"
                        value={localSiswa.penyakit_khusus}
                      />
                      <InfoRow
                        label="Kebutuhan Khusus"
                        value={localSiswa.kebutuhan_khusus}
                      />
                      <InfoRow
                        label="Layanan Khusus"
                        value={localSiswa.layanan_khusus}
                      />
                    </Section>
                  </>
                )}

                {activeTab === "kesejahteraan" && (
                  <>
                    <Section
                      title="Program Bantuan (PIP/KIP/KPS)"
                      icon={ShieldCheck}
                      color="#fbbf24"
                    >
                      <InfoRow
                        label="Penerima KPS"
                        value={localSiswa.penerima_kps}
                      />
                      <InfoRow label="No. KPS" value={localSiswa.no_kps} mono />
                      <InfoRow
                        label="Penerima KIP"
                        value={localSiswa.penerima_kip}
                      />
                      <InfoRow label="No. KIP" value={localSiswa.no_kip} mono />
                      <InfoRow
                        label="Nama di KIP"
                        value={localSiswa.nama_kip}
                      />
                      <InfoRow label="Layak PIP" value={localSiswa.layak_pip} />
                      <InfoRow
                        label="Alasan Layak"
                        value={localSiswa.alasan_pip}
                      />
                      <InfoRow label="No. KKS" value={localSiswa.no_kks} mono />
                    </Section>
                    <Section title="Data Bank" icon={Building} color="#fbbf24">
                      <InfoRow label="Nama Bank" value={localSiswa.bank} />
                      <InfoRow
                        label="No. Rekening"
                        value={localSiswa.no_rekening}
                        mono
                      />
                      <InfoRow
                        label="Atas Nama"
                        value={localSiswa.nama_rekening}
                      />
                    </Section>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Footer Actions ───────────────────── */}
          <div
            className="flex-shrink-0 p-4 flex gap-2"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "#090e1a",
            }}
          >
            <button
              onClick={handlePrint}
              className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              <Printer size={14} /> Cetak Profil
            </button>
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all btn-solid"
              >
                <Edit3 size={14} /> Edit Data
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const fullscreenModal = (
    <AnimatePresence>
      {showPhotoFullscreen && localSiswa?.foto_url && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowPhotoFullscreen(false)}
          className="fixed inset-0 z-[200] flex items-center justify-center cursor-zoom-out"
          style={{ background: "rgba(0,0,0,0.95)" }}
        >
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            src={localSiswa.foto_url}
            alt={localSiswa.nama}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setShowPhotoFullscreen(false)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <X size={20} />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs text-white/50">
            {localSiswa.nama}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return (
    <>
      {createPortal(drawer, document.body)}
      {createPortal(fullscreenModal, document.body)}
    </>
  );
}

// ─── Sub-components ─────────────────────────────────────

function Section({
  title,
  icon: Icon,
  color,
  children,
}: {
  title: string;
  icon: any;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.015)",
        border: "1px solid rgba(255,255,255,0.03)",
      }}
    >
      {/* Section header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.02)",
          background: "rgba(255,255,255,0.01)",
        }}
      >
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: `${color}08`, border: `1px solid ${color}15` }}
        >
          <Icon size={12} style={{ color }} />
        </div>
        <h3
          className="text-[10px] font-black uppercase tracking-[0.15em]"
          style={{ color: `${color}99` }}
        >
          {title}
        </h3>
      </div>
      {/* Section rows */}
      <div className="divide-y divide-white/[0.02]">{children}</div>
    </div>
  );
}

function PrintRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex gap-4">
      <span className="w-32 font-medium text-slate-600">{label}</span>
      <span className="flex-1">: {value || "-"}</span>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value?: any;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.10em] shrink-0">
        {label}
      </span>
      <span
        className={`text-right text-xs font-semibold text-white/60 max-w-[60%] break-words ${mono ? "font-mono text-[11px]" : ""}`}
      >
        {value || <span className="text-white/10 font-normal">—</span>}
      </span>
    </div>
  );
}
