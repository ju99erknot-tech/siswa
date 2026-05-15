"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Printer,
  Users,
  CreditCard,
  BookOpen,
  FileText,
  List,
  Tag,
  QrCode,
  Award,
  Settings2,
  ChevronRight,
  Clock,
  Check,
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell, PageHeader } from "@/components/shared/PageLayout";
import { SiswaPicker } from "@/components/shared/SiswaPicker";
import { useAppStore } from "@/store/app.store";
import { useSchoolConfig } from "@/hooks/useSchoolConfig";
import type { Siswa } from "@/types";

// ── Template definitions ──────────────────────────────────────
const TEMPLATES = [
  {
    id: "daftar-siswa",
    name: "Daftar Siswa Per Kelas",
    desc: "Daftar nama lengkap siswa + data orang tua",
    icon: List,
    color: "#22c55e",
    category: "Kelas",
    scope: "class" as const,
  },
  {
    id: "daftar-hadir",
    name: "Daftar Hadir (Presensi)",
    desc: "Form presensi kosong per kelas, 31 kolom hari",
    icon: Check,
    color: "#3b82f6",
    category: "Kelas",
    scope: "class" as const,
  },
  {
    id: "kartu-kelas",
    name: "Kartu Data Kelas",
    desc: "Ringkasan statistik kelas (1 halaman)",
    icon: LayoutGrid,
    color: "#06b6d4",
    category: "Kelas",
    scope: "class" as const,
  },
  {
    id: "label-meja",
    name: "Label Meja Ujian",
    desc: "Label format standar untuk meja ujian",
    icon: Tag,
    color: "#f59e0b",
    category: "Utilitas",
    scope: "class" as const,
  },
  {
    id: "qr-siswa",
    name: "QR Code Siswa",
    desc: "QR Code NISN untuk absensi cepat",
    icon: QrCode,
    color: "#6366f1",
    category: "Utilitas",
    scope: "class" as const,
  },
  {
    id: "buku-induk",
    name: "Buku Induk Siswa",
    desc: "Dokumen resmi data lengkap per siswa (A4)",
    icon: BookOpen,
    color: "#8b5cf6",
    category: "Siswa",
    scope: "single" as const,
  },
  {
    id: "kartu-siswa",
    name: "Kartu Identitas Siswa",
    desc: "Kartu identitas ringkas ukuran ID card",
    icon: CreditCard,
    color: "#a855f7",
    category: "Siswa",
    scope: "single" as const,
  },
  {
    id: "rekap-prestasi",
    name: "Rekap Prestasi",
    desc: "Daftar seluruh prestasi siswa dengan keterangan",
    icon: Award,
    color: "#ec4899",
    category: "Laporan",
    scope: "all" as const,
  },
  {
    id: "daftar-guru",
    name: "Daftar Guru & GTK",
    desc: "Daftar lengkap pendidik & tenaga kependidikan",
    icon: Users,
    color: "#14b8a6",
    category: "Laporan",
    scope: "all" as const,
  },
];

const CATEGORIES = ["Semua", "Kelas", "Siswa", "Utilitas", "Laporan"];

interface PrintHistory {
  id: string;
  template: string;
  target: string;
  time: Date;
}

export default function CetakPage() {
  const { dataSiswa, dataGuru, dataPrestasi } = useAppStore();
  const config = useSchoolConfig();

  const [activeCat, setActiveCat] = useState("Semua");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedKelas, setSelectedKelas] = useState<string>("all");
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [history, setHistory] = useState<PrintHistory[]>([]);

  // ── Kelas list ────────────────────────────────────────────
  const kelasList = useMemo(
    () =>
      [
        ...new Set(dataSiswa.map((s) => s.kelas).filter(Boolean)),
      ].sort() as string[],
    [dataSiswa],
  );

  const filteredTemplates = TEMPLATES.filter(
    (t) => activeCat === "Semua" || t.category === activeCat,
  );

  const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplate);

  const targetSiswa = useMemo(() => {
    if (!currentTemplate) return [];
    if (currentTemplate.scope === "single")
      return selectedSiswa ? [selectedSiswa] : [];
    if (selectedKelas === "all") return dataSiswa;
    return dataSiswa.filter((s) => s.kelas === selectedKelas);
  }, [currentTemplate, selectedSiswa, selectedKelas, dataSiswa]);

  // ── Print functions ───────────────────────────────────────
  const addHistory = (templateName: string, target: string) => {
    setHistory((prev) => [
      {
        id: Date.now().toString(),
        template: templateName,
        target,
        time: new Date(),
      },
      ...prev.slice(0, 9),
    ]);
  };

  const printDaftarSiswa = (siswas: Siswa[]) => {
    const kelas = siswas[0]?.kelas ?? selectedKelas;
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Pop-up diblokir browser");
      return;
    }
    win.document.write(`<!DOCTYPE html><html><head><title>Daftar Siswa</title>
    <style>body{font-family:Arial;margin:20px;font-size:11px}.kop{text-align:center;border-bottom:3px double #000;margin-bottom:15px;padding-bottom:10px}
    h3{text-align:center;margin:5px 0}p{text-align:center;margin:3px 0}table{width:100%;border-collapse:collapse;margin-top:12px}
    th{background:#e0e0e0;border:1px solid #333;padding:6px;text-align:center}td{border:1px solid #333;padding:5px}
    .footer{margin-top:30px;display:flex;justify-content:space-between;font-size:11px}
    @media print{@page{size:A4}body{margin:10mm}}</style></head>
    <body><div class="kop"><h3 style="font-size:14px;text-transform:uppercase">${config.namaSekolah}</h3>
    <p>NPSN: ${config.npsn} | Tahun Ajaran ${config.tahunAjaran}</p></div>
    <h3>DAFTAR SISWA KELAS ${kelas}</h3>
    <table><thead><tr><th>No</th><th>Nama Lengkap</th><th>NISN</th><th>JK</th><th>Tempat, Tanggal Lahir</th><th>Orang Tua</th><th>No. WA</th></tr></thead>
    <tbody>${siswas
      .map(
        (
          s,
          i,
        ) => `<tr><td style="text-align:center">${i + 1}</td><td>${s.nama}</td>
    <td>${s.nisn || "-"}</td><td style="text-align:center">${s.jk || "-"}</td>
    <td>${s.tempat_lahir || "-"}, ${s.tanggal_lahir ? new Date(s.tanggal_lahir).toLocaleDateString("id-ID") : "-"}</td>
    <td>${s.nama_ayah || s.nama_ibu || "-"}</td><td>${s.no_wa || "-"}</td></tr>`,
      )
      .join("")}
    </tbody></table>
    <div class="footer"><div>Mengetahui, Kepala Sekolah<br><br><br><br>
    <strong>${config.namaKepsek || "____________________"}</strong><br>NIP. ${config.nipKepsek || "____________________"}</div>
    <div style="text-align:right">${config.kotaSekolah || "Kota"}, ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}<br>
    Wali Kelas<br><br><br><br>____________________<br>NIP. ____________________</div></div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
    addHistory("Daftar Siswa", `Kelas ${kelas} (${siswas.length} siswa)`);
    toast.success("Dokumen siap dicetak!");
  };

  const printDaftarHadir = (siswas: Siswa[]) => {
    const kelas = siswas[0]?.kelas ?? selectedKelas;
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    const now = new Date();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Pop-up diblokir browser");
      return;
    }
    win.document.write(`<!DOCTYPE html><html><head><title>Daftar Hadir</title>
    <style>body{font-family:Arial;margin:5mm;font-size:8px}table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #000;padding:2px;text-align:center;vertical-align:middle}
    th{background:#e0e0e0;font-size:7px}.kop{text-align:center;margin-bottom:8px}
    @media print{@page{size:A3 landscape;margin:5mm}}</style></head>
    <body><div class="kop"><strong style="font-size:10px">${config.namaSekolah}</strong><br>
    DAFTAR HADIR KELAS ${kelas} — ${months[now.getMonth()]} ${now.getFullYear()}</div>
    <table><thead><tr><th>No</th><th style="width:130px">Nama Siswa</th>
    ${Array.from({ length: daysInMonth }, (_, i) => `<th>${i + 1}</th>`).join("")}
    <th>H</th><th>S</th><th>I</th><th>A</th><th>%</th></tr></thead>
    <tbody>${siswas
      .map(
        (
          s,
          i,
        ) => `<tr><td>${i + 1}</td><td style="text-align:left;padding:2px 3px">${s.nama}</td>
    ${Array.from({ length: daysInMonth }, () => "<td></td>").join("")}
    <td></td><td></td><td></td><td></td><td></td></tr>`,
      )
      .join("")}
    </tbody></table></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
    addHistory("Daftar Hadir", `Kelas ${kelas}`);
    toast.success("Daftar hadir siap dicetak!");
  };

  const printLabelMeja = (siswas: Siswa[]) => {
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Pop-up diblokir browser");
      return;
    }
    win.document.write(`<!DOCTYPE html><html><head><title>Label Meja</title>
    <style>body{font-family:Arial;margin:0}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;padding:8mm}
    .label{border:1px solid #000;padding:4mm;height:38mm;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;box-sizing:border-box}
    .school{font-size:7px;color:#555;margin-bottom:2mm}.nama{font-size:13px;font-weight:bold;margin:1mm 0}
    .nisn{font-size:9px}.kelas{font-size:9px;margin-top:1mm}
    @media print{@page{size:A4;margin:0}}</style></head>
    <body><div class="grid">${siswas
      .map(
        (s) => `<div class="label">
    <div class="school">${config.namaSekolah}</div>
    <div class="nama">${s.nama}</div>
    <div class="nisn">NISN: ${s.nisn || "-"}</div>
    <div class="kelas">Kelas ${s.kelas || "-"} | T.A. ${config.tahunAjaran}</div>
    </div>`,
      )
      .join("")}</div></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
    addHistory("Label Meja", `${siswas.length} label`);
    toast.success("Label meja siap dicetak!");
  };

  const printQRSiswa = (siswas: Siswa[]) => {
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Pop-up diblokir browser");
      return;
    }
    win.document.write(`<!DOCTYPE html><html><head><title>QR Code Siswa</title>
    <style>body{font-family:Arial;margin:10px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
    .card{border:1px solid #ccc;border-radius:6px;padding:8px;text-align:center}
    .card img{width:80px;height:80px}.nama{font-size:10px;font-weight:bold;margin:4px 0 2px}.nisn{font-size:8px;color:#555}
    @media print{@page{size:A4;margin:5mm}}</style></head>
    <body><div class="grid">${siswas
      .map(
        (s) => `<div class="card">
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=NISN:${s.nisn || s.id}" alt="${s.nama}" onerror="this.src=''" />
    <div class="nama">${s.nama}</div>
    <div class="nisn">${s.nisn || "-"} · ${s.kelas || "-"}</div>
    </div>`,
      )
      .join("")}</div></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
    addHistory("QR Code Siswa", `${siswas.length} QR code`);
    toast.success("QR code siap dicetak!");
  };

  const printKartuKelas = (siswas: Siswa[], kelas: string) => {
    const laki = siswas.filter((s) => s.jk === "L").length;
    const perempuan = siswas.filter((s) => s.jk === "P").length;
    const withNISN = siswas.filter((s) => s.nisn).length;
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Pop-up diblokir browser");
      return;
    }
    win.document
      .write(`<!DOCTYPE html><html><head><title>Kartu Kelas ${kelas}</title>
    <style>body{font-family:Arial;margin:20px;font-size:11px}.box{border:2px solid #000;padding:12px;margin:10px 0;border-radius:4px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.stat{text-align:center;padding:8px;border:1px solid #ccc;border-radius:4px}
    .stat-num{font-size:24px;font-weight:bold}.stat-label{font-size:9px;color:#555}h2{text-align:center;border-bottom:2px solid #000;padding-bottom:8px}
    @media print{@page{size:A4}}</style></head>
    <body><h2>${config.namaSekolah}<br>KARTU KELAS ${kelas}</h2>
    <p style="text-align:center">Tahun Ajaran ${config.tahunAjaran}</p>
    <div class="grid2">
    <div class="stat"><div class="stat-num">${siswas.length}</div><div class="stat-label">Total Siswa</div></div>
    <div class="stat"><div class="stat-num">${laki}</div><div class="stat-label">Laki-laki</div></div>
    <div class="stat"><div class="stat-num">${perempuan}</div><div class="stat-label">Perempuan</div></div>
    <div class="stat"><div class="stat-num">${withNISN}</div><div class="stat-label">Sudah ada NISN</div></div>
    </div>
    <div class="box"><strong>Daftar Nama Siswa:</strong>
    <ol style="columns:2;margin-top:8px">${siswas.map((s) => `<li>${s.nama} (${s.jk || "-"})</li>`).join("")}</ol>
    </div></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
    addHistory("Kartu Data Kelas", `Kelas ${kelas}`);
    toast.success("Kartu kelas siap dicetak!");
  };

  const printBukuInduk = (siswa: Siswa) => {
    // Simplified print — full BukuIndukOfficial component can be used via dynamic import
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Pop-up diblokir browser");
      return;
    }
    win.document
      .write(`<!DOCTYPE html><html><head><title>Buku Induk ${siswa.nama}</title>
    <style>body{font-family:Arial;margin:20px;font-size:10px}h3{text-align:center}table{width:100%;border-collapse:collapse;margin:8px 0}
    td{border:1px solid #ccc;padding:5px}td:first-child{width:45%;background:#f5f5f5;font-weight:500}
    .section{font-weight:bold;background:#e0e0e0!important;text-align:center}
    @media print{@page{size:A4}}</style></head>
    <body><h3>${config.namaSekolah} — BUKU INDUK SISWA</h3>
    <table>
    <tr><td class="section" colspan="2">I. IDENTITAS SISWA</td></tr>
    <tr><td>Nama Lengkap</td><td>${siswa.nama}</td></tr>
    <tr><td>NISN</td><td>${siswa.nisn || "-"}</td></tr>
    <tr><td>NIK</td><td>${siswa.nik || "-"}</td></tr>
    <tr><td>No. KK</td><td>${siswa.no_kk || "-"}</td></tr>
    <tr><td>Jenis Kelamin</td><td>${siswa.jk === "L" ? "Laki-laki" : "Perempuan"}</td></tr>
    <tr><td>Tempat Lahir</td><td>${siswa.tempat_lahir || "-"}</td></tr>
    <tr><td>Tanggal Lahir</td><td>${siswa.tanggal_lahir ? new Date(siswa.tanggal_lahir).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-"}</td></tr>
    <tr><td>Agama</td><td>${siswa.agama || "-"}</td></tr>
    <tr><td>Kelas</td><td>${siswa.kelas || "-"}</td></tr>
    <tr><td class="section" colspan="2">II. DOMISILI</td></tr>
    <tr><td>Alamat</td><td>${siswa.alamat || "-"}</td></tr>
    <tr><td>RT/RW</td><td>${siswa.rt || "-"} / ${siswa.rw || "-"}</td></tr>
    <tr><td>Kelurahan/Desa</td><td>${siswa.kelurahan || "-"}</td></tr>
    <tr><td>Kecamatan</td><td>${siswa.kecamatan || "-"}</td></tr>
    <tr><td class="section" colspan="2">III. ORANG TUA</td></tr>
    <tr><td>Nama Ayah</td><td>${siswa.nama_ayah || "-"}</td></tr>
    <tr><td>Nama Ibu</td><td>${siswa.nama_ibu || "-"}</td></tr>
    <tr><td>No. WA</td><td>${siswa.no_wa || "-"}</td></tr>
    </table></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
    addHistory("Buku Induk", siswa.nama);
    toast.success(`Buku Induk ${siswa.nama} siap dicetak!`);
  };

  const printKartuSiswa = (siswa: Siswa) => {
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Pop-up diblokir browser");
      return;
    }
    win.document
      .write(`<!DOCTYPE html><html><head><title>Kartu Siswa ${siswa.nama}</title>
    <style>body{font-family:Arial;margin:20px}.card{width:85.6mm;height:53.98mm;border:2px solid #333;border-radius:6px;padding:8px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;font-size:9px}
    .header{background:#1a0533;color:white;padding:5px 8px;border-radius:4px;font-size:8px;text-align:center}
    .nama{font-size:12px;font-weight:bold;margin:5px 0 2px}.nisn{font-size:8px;color:#555}
    @media print{@page{size:A4}}</style></head>
    <body>
    <div class="card">
    <div class="header">${config.namaSekolah}</div>
    <div><div class="nama">${siswa.nama}</div>
    <div class="nisn">NISN: ${siswa.nisn || "-"}</div>
    <div class="nisn">Kelas: ${siswa.kelas || "-"} | T.A. ${config.tahunAjaran}</div>
    <div class="nisn">TTL: ${siswa.tempat_lahir || "-"}, ${siswa.tanggal_lahir ? new Date(siswa.tanggal_lahir).toLocaleDateString("id-ID") : "-"}</div></div>
    <div style="font-size:8px;color:#888;text-align:right">${config.kotaSekolah || ""}</div>
    </div></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
    addHistory("Kartu Siswa", siswa.nama);
    toast.success(`Kartu siswa ${siswa.nama} siap dicetak!`);
  };

  const printRekapPrestasi = () => {
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Pop-up diblokir browser");
      return;
    }
    win.document.write(`<!DOCTYPE html><html><head><title>Rekap Prestasi</title>
    <style>body{font-family:Arial;margin:20px;font-size:10px}h3{text-align:center}table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #ccc;padding:5px}th{background:#e0e0e0;text-align:center}
    @media print{@page{size:A4}}</style></head>
    <body><h3>${config.namaSekolah} — REKAP PRESTASI SISWA</h3>
    <p style="text-align:center">Tahun Ajaran ${config.tahunAjaran}</p>
    <table><thead><tr><th>No</th><th>Nama</th><th>Kelas</th><th>Jenis Lomba</th><th>Tingkat</th><th>Peringkat</th><th>Penyelenggara</th><th>Tanggal</th></tr></thead>
    <tbody>${dataPrestasi
      .map(
        (p, i) => `<tr><td style="text-align:center">${i + 1}</td>
    <td>${(p as any).nama || "-"}</td><td>${(p as any).kelas || "-"}</td>
    <td>${(p as any).jenis_lomba || "-"}</td><td>${(p as any).tingkat || "-"}</td>
    <td>${(p as any).peringkat || "-"}</td><td>${(p as any).penyelenggara || "-"}</td>
    <td>${(p as any).tanggal ? new Date((p as any).tanggal).toLocaleDateString("id-ID") : "-"}</td></tr>`,
      )
      .join("")}
    </tbody></table></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
    addHistory("Rekap Prestasi", `${dataPrestasi.length} prestasi`);
    toast.success("Rekap prestasi siap dicetak!");
  };

  const printDaftarGuru = () => {
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Pop-up diblokir browser");
      return;
    }
    win.document.write(`<!DOCTYPE html><html><head><title>Daftar Guru</title>
    <style>body{font-family:Arial;margin:20px;font-size:10px}h3{text-align:center}table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #ccc;padding:5px}th{background:#e0e0e0;text-align:center}
    @media print{@page{size:A4}}</style></head>
    <body><h3>${config.namaSekolah} — DATA GURU & TENAGA KEPENDIDIKAN</h3>
    <table><thead><tr><th>No</th><th>Nama</th><th>NIP</th><th>JK</th><th>Kategori</th><th>No. WA</th><th>Status</th></tr></thead>
    <tbody>${dataGuru
      .map(
        (g, i) => `<tr><td style="text-align:center">${i + 1}</td>
    <td>${g.nama}</td><td>${g.nip || "-"}</td>
    <td style="text-align:center">${g.jk === "L" ? "L" : "P"}</td>
    <td>${g.kategori || "-"}</td><td>${g.no_wa || "-"}</td>
    <td style="text-align:center">${g.status_aktif ? "Aktif" : "Non-Aktif"}</td></tr>`,
      )
      .join("")}
    </tbody></table></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
    addHistory("Daftar Guru", `${dataGuru.length} guru`);
    toast.success("Daftar guru siap dicetak!");
  };

  // ── Main print dispatcher ─────────────────────────────────
  const handlePrint = () => {
    if (!currentTemplate) return;
    if (currentTemplate.scope === "single" && !selectedSiswa) {
      toast.error("Pilih siswa terlebih dahulu");
      return;
    }
    if (currentTemplate.scope === "class" && targetSiswa.length === 0) {
      toast.error("Tidak ada siswa di kelas ini");
      return;
    }
    switch (currentTemplate.id) {
      case "daftar-siswa":
        printDaftarSiswa(targetSiswa);
        break;
      case "daftar-hadir":
        printDaftarHadir(targetSiswa);
        break;
      case "label-meja":
        printLabelMeja(targetSiswa);
        break;
      case "qr-siswa":
        printQRSiswa(targetSiswa);
        break;
      case "kartu-kelas":
        printKartuKelas(
          targetSiswa,
          selectedKelas === "all" ? "Semua Kelas" : selectedKelas,
        );
        break;
      case "buku-induk":
        if (selectedSiswa) printBukuInduk(selectedSiswa);
        break;
      case "kartu-siswa":
        if (selectedSiswa) printKartuSiswa(selectedSiswa);
        break;
      case "rekap-prestasi":
        printRekapPrestasi();
        break;
      case "daftar-guru":
        printDaftarGuru();
        break;
    }
  };

  return (
    <PageShell>
      <PageHeader
        icon={<Printer size={22} className="text-violet-400" />}
        title="Print Center"
        subtitle="Semua kebutuhan cetak dalam satu tempat"
        gradient="linear-gradient(135deg, #0d0b21 0%, #0c0820 50%, #090516 100%)"
        glowColor="rgba(139,92,246,0.15)"
        stats={[
          { label: "Template Tersedia", value: TEMPLATES.length },
          { label: "Total Siswa", value: dataSiswa.length },
          { label: "Total Kelas", value: kelasList.length },
        ]}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: template gallery */}
        <div className="flex-1 space-y-4">
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
                style={{
                  background:
                    activeCat === cat
                      ? "rgba(139,92,246,0.2)"
                      : "rgba(255,255,255,0.04)",
                  borderColor:
                    activeCat === cat
                      ? "rgba(139,92,246,0.5)"
                      : "rgba(255,255,255,0.08)",
                  color:
                    activeCat === cat ? "#a78bfa" : "rgba(255,255,255,0.5)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Template cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredTemplates.map((t) => {
              const Icon = t.icon;
              const isSelected = selectedTemplate === t.id;
              return (
                <motion.button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex items-start gap-4 p-4 rounded-2xl border text-left transition-all"
                  style={{
                    background: isSelected
                      ? `${t.color}12`
                      : "rgba(255,255,255,0.03)",
                    borderColor: isSelected
                      ? `${t.color}50`
                      : "rgba(255,255,255,0.07)",
                    boxShadow: isSelected ? `0 0 0 1px ${t.color}30` : "none",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${t.color}20` }}
                  >
                    <Icon size={20} style={{ color: t.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-white/90 truncate">
                        {t.name}
                      </p>
                      {isSelected && (
                        <Check
                          size={12}
                          style={{ color: t.color, flexShrink: 0 }}
                        />
                      )}
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed">
                      {t.desc}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${t.color}15`, color: t.color }}
                      >
                        {t.category}
                      </span>
                      <span className="text-[10px] text-white/30">
                        {t.scope === "single"
                          ? "Per Siswa"
                          : t.scope === "class"
                            ? "Per Kelas"
                            : "Semua Data"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-white/20 mt-1 flex-shrink-0"
                  />
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right: config panel */}
        <div className="lg:w-72 space-y-4">
          <div
            className="rounded-2xl border border-white/8 p-5 space-y-4 sticky top-4"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Settings2 size={16} className="text-white/50" />
              <p className="text-sm font-semibold text-white/70">
                Konfigurasi Cetak
              </p>
            </div>

            {!selectedTemplate ? (
              <p className="text-xs text-white/30 text-center py-8">
                ← Pilih template terlebih dahulu
              </p>
            ) : (
              <>
                {/* Per siswa: student picker */}
                {currentTemplate?.scope === "single" && (
                  <div>
                    <label className="text-xs text-white/50 mb-2 block">
                      Pilih Siswa
                    </label>
                    <SiswaPicker
                      value={selectedSiswa?.id ?? ""}
                      onChange={setSelectedSiswa}
                      placeholder="Cari nama atau NISN..."
                    />
                  </div>
                )}

                {/* Per kelas / all: kelas filter */}
                {currentTemplate?.scope !== "single" && (
                  <div>
                    <label className="text-xs text-white/50 mb-2 block">
                      Filter Kelas
                    </label>
                    <select
                      value={selectedKelas}
                      onChange={(e) => setSelectedKelas(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-violet-500/50"
                    >
                      <option value="all" className="bg-gray-900">
                        Semua Kelas
                      </option>
                      {kelasList.map((k) => (
                        <option key={k} value={k} className="bg-gray-900">
                          Kelas {k}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Preview info */}
                <div
                  className="rounded-xl p-3 text-center"
                  style={{
                    background: "rgba(139,92,246,0.08)",
                    border: "1px solid rgba(139,92,246,0.2)",
                  }}
                >
                  <p className="text-violet-400 text-xs font-semibold">
                    {currentTemplate?.scope === "single"
                      ? selectedSiswa
                        ? `1 siswa: ${selectedSiswa.nama}`
                        : "Belum ada siswa dipilih"
                      : `${targetSiswa.length} siswa akan dicetak`}
                  </p>
                </div>

                {/* Print button */}
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                  }}
                >
                  <Printer size={16} /> Cetak Sekarang
                </button>
              </>
            )}
          </div>

          {/* Print history */}
          {history.length > 0 && (
            <div
              className="rounded-2xl border border-white/8 p-4"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-white/40" />
                <p className="text-xs font-semibold text-white/50">
                  Riwayat Cetak
                </p>
              </div>
              <div className="space-y-2">
                {history.slice(0, 5).map((h) => (
                  <div key={h.id} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-white/60 font-medium truncate">
                        {h.template}
                      </p>
                      <p className="text-[10px] text-white/30">
                        {h.target} ·{" "}
                        {h.time.toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
