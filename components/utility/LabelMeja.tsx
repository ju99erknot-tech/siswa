"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Tags, Printer, Info, Grid3X3, User } from "lucide-react";
import QRCode from "react-qr-code";
import UtilityHeader from "./UtilityHeader";
import { useAppStore } from "@/store/app.store";
import { useSiswa } from "@/hooks/useSiswa";
import { useSchoolConfig } from "@/hooks/useSchoolConfig";



export default function LabelMeja() {
  const { pengaturan } = useAppStore();
  const { data: dataSiswa = [] } = useSiswa();
  const config = useSchoolConfig();

  const KUMPULAN_KELAS = Array.from(new Set(dataSiswa.map(s => s.kelas))).filter((k): k is string => !!k).sort();

  const [selectedKelas, setSelectedKelas] = useState<Set<string>>(new Set());
  const [namaUjian, setNamaUjian] = useState("ASESMEN SUMATIF");
  const [tahunPelajaran, setTahunPelajaran] = useState(pengaturan?.tahun_ajaran || "2025/2026");
  const [mulaiRuang, setMulaiRuang] = useState(1);
  const [kapasitas, setKapasitas] = useState(20);
  const [jumlahKolom, setJumlahKolom] = useState(4);
  const [polaZigzag, setPolaZigzag] = useState(true);
  const [seg1, setSeg1] = useState("24");
  const [seg2, setSeg2] = useState("188");
  const [mulaiNo, setMulaiNo] = useState(1);
  const [useMundur, setUseMundur] = useState(true);
  const [tglCetak, setTglCetak] = useState(
    new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
  );

  const handlePrintKartu = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocked! Please allow popups for this site.');
      return;
    }
    
    const content = document.getElementById('print-content');
    if (!content) return;
    
    const pengaturan = useAppStore.getState().pengaturan;
    const logoUrl = pengaturan?.logo_url || '';
    const namaSekolah = config.namaSekolah;
    
    printWindow.document.write(`
      <html>
      <head>
        <title>Kartu Peserta - ${namaUjian}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          .btn-print { position: fixed; top: 20px; right: 20px; padding: 15px 30px; background: #000; color: #fff; border: none; border-radius: 50px; font-weight: bold; cursor: pointer; z-index: 999; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
          @media print { .no-print { display: none !important; } }
          @media print { 
            body { 
              background: white !important; 
              margin: 0; 
              padding: 0;
            }
            .print-row {
              page-break-inside: avoid;
              margin-bottom: 8mm;
            }
            .card-peserta, .label-meja {
              box-shadow: none !important;
            }
          }
          body { 
            font-family: 'Inter', Arial, sans-serif; 
            margin: 0; 
            padding: 0; 
            background: white !important;
          }
          @media screen {
            body { zoom: 0.6; }
          }
          .print-row {
            display: flex;
            gap: 16px;
            margin-bottom: 8mm;
            page-break-inside: avoid;
          }
          .card-peserta {
            flex: 1;
            background: white;
            border-radius: 10px;
            padding: 14px;
            border: 2.5px solid #1e293b;
            aspect-ratio: 5/4;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
          }
          .card-peserta .header-decor {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #1e293b 0%, #334155 50%, #1e293b 100%);
          }
          .card-peserta .card-header {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 6px;
            padding-top: 2px;
            border-bottom: 1.5px solid #e2e8f0;
          }
          .card-peserta .card-header h3 {
            font-size: 12px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 1px;
            line-height: 1.2;
            margin: 0;
          }
          .card-peserta .card-header .ujian-name {
            font-size: 7px;
            font-weight: 900;
            color: #dc2626;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 2px;
          }
          .card-peserta .card-header .tahun {
            font-size: 6px;
            font-weight: 900;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 1px;
          }
          .card-peserta .card-content {
            flex: 1;
            display: flex;
            gap: 10px;
            align-items: flex-start;
          }
          .card-peserta .photo-box {
            width: 64px;
            height: 84px;
            background: #f8fafc;
            border-radius: 6px;
            border: 1.5px solid #cbd5e1;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            flex-shrink: 0;
          }
          .card-peserta .photo-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .card-peserta .info-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 5px;
          }
          .card-peserta .info-row {
            display: flex;
            align-items: center;
            gap: 6px;
            border-bottom: 1px dotted #e2e8f0;
            padding-bottom: 3px;
          }
          .card-peserta .info-label {
            font-size: 6px;
            font-weight: 900;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            width: 52px;
            flex-shrink: 0;
          }
          .card-peserta .info-value {
            font-size: 10px;
            font-weight: 900;
            color: #0f172a;
            flex: 1;
          }
          .card-peserta .info-value.mono {
            font-family: monospace;
          }
          .card-peserta .info-value.upper {
            text-transform: uppercase;
          }
          .card-peserta .card-footer {
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1.5px solid #1e293b;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .card-peserta .qr-section {
            display: flex;
            align-items: center;
            gap: 5px;
          }
          .card-peserta .qr-box {
            width: 32px;
            height: 32px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .card-peserta .qr-info {
            font-size: 5px;
            font-weight: 900;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .card-peserta .qr-code {
            font-size: 6px;
            font-weight: 900;
            color: #475569;
            font-family: monospace;
          }
          .card-peserta .ruang-badge {
            background: #0f172a;
            padding: 3px 10px;
            border-radius: 4px;
          }
          .card-peserta .ruang-badge span {
            font-size: 7px;
            font-weight: 900;
            color: white;
            text-transform: uppercase;
            letter-spacing: 2px;
          }

          .label-meja {
            flex: 1;
            background: white;
            border-radius: 10px;
            padding: 14px;
            border: 2.5px solid #1e293b;
            aspect-ratio: 5/4;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .label-meja .header-decor {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #1e293b 0%, #334155 50%, #1e293b 100%);
          }
          .label-meja .label-title {
            font-size: 8px;
            font-weight: 900;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 8px;
            margin-top: 2px;
          }
          .label-meja .nomor-peserta {
            font-size: 24px;
            font-weight: 900;
            color: #0f172a;
            font-family: monospace;
            margin-bottom: 10px;
            letter-spacing: 2px;
          }
          .label-meja .photo-circle {
            width: 52px;
            height: 52px;
            background: #f8fafc;
            border-radius: 50%;
            border: 2px solid #cbd5e1;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .label-meja .photo-circle img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
          }
          .label-meja .nama {
            font-size: 8px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            margin-bottom: 3px;
          }
          .label-meja .detail {
            font-size: 6px;
            font-weight: 700;
            color: #64748b;
          }
          .label-meja .sekolah {
            font-size: 7px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 10px;
            padding-top: 6px;
            border-top: 1.5px solid #1e293b;
            width: 100%;
          }
        </style>
      </head>
      <body>
        <button class="btn-print no-print" onclick="window.print()">🖨️ CETAK SEKARANG</button>
        <div class="preview-root">${content.innerHTML}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  const handlePrintDenah = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocked! Please allow popups for this site.');
      return;
    }
    
    const content = document.getElementById('denah-content');
    if (!content) return;
    
    const pengaturan = useAppStore.getState().pengaturan;
    const logoUrl = pengaturan?.logo_url || '';
    const namaSekolah = config.namaSekolah;
    const kepsek = config.namaKepsek;
    const nip = config.nipKepsek;
    
    printWindow.document.write(`
      <html>
      <head>
        <title>Denah Tempat Duduk - ${namaUjian}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          .btn-print { position: fixed; top: 20px; right: 20px; padding: 15px 30px; background: #000; color: #fff; border: none; border-radius: 50px; font-weight: bold; cursor: pointer; z-index: 999; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
          @media print { .no-print { display: none !important; } }
          @media print { 
            body { 
              background: white !important; 
              margin: 0; 
              padding: 0;
            }
            .denah-page { 
              margin: 0; 
              box-shadow: none; 
              width: 100%; 
              background: white !important;
            }
          }
          body { 
            font-family: 'Inter', Arial, sans-serif; 
            margin: 0; 
            padding: 0; 
            background: white !important;
          }
          @media screen {
            body { zoom: 0.6; }
          }
        </style>
      </head>
      <body>
        <button class="btn-print no-print" onclick="window.print()">🖨️ CETAK SEKARANG</button>
        ${content.innerHTML.replace(/LOGO_PLACEHOLDER/g, logoUrl).replace(/SEKOLAH_PLACEHOLDER/g, namaSekolah).replace(/KEPSEK_PLACEHOLDER/g, kepsek).replace(/NIP_PLACEHOLDER/g, nip)}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  const toggleKelas = (kelas: string) => {
    setSelectedKelas((prev) => {
      const next = new Set(prev);
      next.has(kelas) ? next.delete(kelas) : next.add(kelas);
      return next;
    });
  };

  interface Peserta {
    no: string;
    nama: string;
    nisn: string;
    kelas: string;
    noPeserta: string;
    ruang: string;
    foto_url?: string;
  }

  // Generate data from Zustand store
  const filteredSiswa = dataSiswa
    .filter((s) => selectedKelas.has(s.kelas || ""))
    .sort((a, b) => {
      const kelasA = a.kelas || "";
      const kelasB = b.kelas || "";
      if (kelasA !== kelasB) return kelasA.localeCompare(kelasB);
      return (a.nama || "").localeCompare(b.nama || "");
    });

  const parsedPeserta: Peserta[] = filteredSiswa.map((s, index) => {
    const currentNo = mulaiNo + index;
    const urutStr = currentNo.toString().padStart(3, "0");
    const lastDigit = useMundur ? 9 - (currentNo % 8) : undefined;
    const noPeserta = useMundur
      ? `${seg1}-${seg2}-${urutStr}-${lastDigit}`
      : `${seg1}-${seg2}-${urutStr}`;
    const ruang = String(mulaiRuang + Math.floor(index / kapasitas)).padStart(2, "0");

    return {
      no: String(index + 1),
      nama: s.nama || "-",
      nisn: s.nisn || "-",
      kelas: s.kelas || "-",
      noPeserta,
      ruang: `Ruang ${ruang}`,
      foto_url: s.foto_url ?? undefined,
    };
  });

  const noPesertaPreview = useMundur
    ? `${seg1}-${seg2}-${String(mulaiNo).padStart(3, "0")}-${9 - (mulaiNo % 8)}`
    : `${seg1}-${seg2}-${String(mulaiNo).padStart(3, "0")}`;

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-4xl mx-auto pb-10">
      <UtilityHeader
        icon={Tags}
        title="Label Meja Ujian"
        subtitle="Pusat Cetak & Utility • Kartu & Denah Peserta"
        accentColor="indigo"
        actionLabel="Cetak Label"
        actionIcon={Printer}
        onAction={() => handlePrintKartu()}
        actionDisabled={parsedPeserta.length === 0}
      />

      {/* Pemilihan Kelas */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card p-6"
      >
        <h2 className="text-sm font-bold text-slate-300 mb-5 uppercase tracking-wider flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center">
            <Grid3X3 className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          Pemilihan Kelas (Sumber Data)
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {KUMPULAN_KELAS.map((kelas) => {
            const isSelected = selectedKelas.has(kelas);
            const count = dataSiswa.filter(s => (s.kelas) === kelas).length;
            
            return (
              <button
                key={kelas}
                onClick={() => toggleKelas(kelas)}
                className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                    : "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:border-white/[0.1] hover:bg-white/[0.04]"
                }`}
              >
                <span className="font-black text-sm uppercase">{kelas}</span>
                <span className="text-[9px] mt-1 font-bold opacity-60 bg-black/20 px-2 py-0.5 rounded-full">{count} Siswa</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Pengaturan Ruang & Denah */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <h2 className="text-sm font-bold text-slate-300 mb-5 uppercase tracking-wider">
          Pengaturan Ruang & Denah
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Mulai Ruang</label>
            <input type="number" value={mulaiRuang} onChange={(e) => setMulaiRuang(Number(e.target.value))} min={1}
              className="input-obsidian text-center" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Kapasitas/Ruang</label>
            <input type="number" value={kapasitas} onChange={(e) => setKapasitas(Number(e.target.value))} min={1}
              className="input-obsidian text-center" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Kolom Denah</label>
            <input type="number" value={jumlahKolom} onChange={(e) => setJumlahKolom(Number(e.target.value))} min={1} max={8}
              className="input-obsidian text-center" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Opsi</label>
            <label className="flex items-center gap-2.5 input-obsidian cursor-pointer">
              <input type="checkbox" checked={polaZigzag} onChange={(e) => setPolaZigzag(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-500" />
              <span className="text-xs font-bold text-slate-400">Pola Zigzag</span>
            </label>
          </div>
        </div>
      </motion.div>

      {/* Pengaturan Nomor Peserta */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card p-6"
      >
        <h2 className="text-sm font-bold text-slate-300 mb-5 uppercase tracking-wider">
          Pengaturan Nomor Peserta
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Segmen 1</label>
            <input type="text" value={seg1} onChange={(e) => setSeg1(e.target.value)} placeholder="24"
              className="input-obsidian text-center" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Segmen 2</label>
            <input type="text" value={seg2} onChange={(e) => setSeg2(e.target.value)} placeholder="188"
              className="input-obsidian text-center" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Mulai Urut (Auto)</label>
            <input type="number" value={mulaiNo} onChange={(e) => setMulaiNo(Number(e.target.value))} min={1}
              className="input-obsidian text-center" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Segmen 4</label>
            <label className="flex items-center gap-2 input-obsidian cursor-pointer">
              <input type="checkbox" checked={useMundur} onChange={(e) => setUseMundur(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-500" />
              <span className="text-[9px] font-bold text-slate-400">Mundur 8→1</span>
            </label>
          </div>
        </div>
        <p className="text-[10px] font-bold text-slate-600 mt-3">
          *Preview: <span className="text-indigo-400 font-mono">{noPesertaPreview}</span>
        </p>
      </motion.div>

      {/* Info Ujian */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6"
      >
        <h2 className="text-sm font-bold text-slate-300 mb-5 uppercase tracking-wider">Informasi Ujian</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nama Ujian</label>
            <input type="text" value={namaUjian} onChange={(e) => setNamaUjian(e.target.value)}
              className="input-obsidian" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tahun Pelajaran</label>
            <input type="text" value={tahunPelajaran} onChange={(e) => setTahunPelajaran(e.target.value)}
              className="input-obsidian" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tanggal Cetak</label>
            <input type="text" value={tglCetak} onChange={(e) => setTglCetak(e.target.value)}
              className="input-obsidian" />
          </div>
        </div>
        <div className="mt-4 flex items-start gap-3 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
          <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Data peserta ditarik otomatis dari Buku Induk berdasarkan kelas yang dicentang. Terdapat {parsedPeserta.length} siswa siap dicetak.
          </p>
        </div>
      </motion.div>

      {/* Action Buttons (matching legacy: Print Label + Print Denah) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <button
          onClick={() => handlePrintKartu()}
          disabled={parsedPeserta.length === 0}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
        >
          <Printer className="w-4 h-4" /> Print Kartu Peserta
        </button>
        <button
          onClick={() => handlePrintDenah()}
          disabled={parsedPeserta.length === 0}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
        >
          <Grid3X3 className="w-4 h-4" /> Print Denah Tempat Duduk
        </button>
      </motion.div>

      {/* Hidden Print Area - Combined Kartu & Label */}
      <div className="hidden">
        <div id="print-content" className="p-4 w-[210mm]">
          {parsedPeserta.map((p, i) => (
            <div
              key={i}
              className="print-row"
              style={{ pageBreakInside: "avoid" }}
            >
              {/* 1. KARTU PESERTA (KIRI) */}
              <div className="card-peserta">
                <div className="header-decor"></div>
                
                <div className="card-header">
                  <h3>KARTU PESERTA UJIAN</h3>
                  <div className="ujian-name">{namaUjian}</div>
                  <div className="tahun">TP. {tahunPelajaran}</div>
                </div>

                <div className="card-content">
                  <div className="photo-box">
                    {p.foto_url ? (
                      <img src={p.foto_url} alt={p.nama} />
                    ) : (
                      <User className="w-6 h-6 text-green-400" />
                    )}
                  </div>

                  <div className="info-section">
                    <div className="info-row">
                      <span className="info-label">No. Peserta</span>
                      <span className="info-value mono">{p.noPeserta}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Nama</span>
                      <span className="info-value upper">{p.nama}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">NISN</span>
                      <span className="info-value mono">{p.nisn}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Kelas</span>
                      <span className="info-value">{p.kelas}</span>
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <div className="qr-section">
                    <div className="qr-box">
                      <QRCode 
                        value={p.noPeserta} 
                        size={28} 
                        level="L" 
                        bgColor="#ffffff" 
                        fgColor="#000000"
                      />
                    </div>
                    <div>
                      <div className="qr-info">QR Code</div>
                      <div className="qr-code">{p.noPeserta}</div>
                    </div>
                  </div>
                  <div className="ruang-badge">
                    <span>{p.ruang}</span>
                  </div>
                </div>
              </div>

              {/* 2. LABEL MEJA (KANAN) */}
              <div className="label-meja">
                <div className="header-decor"></div>
                
                <div className="label-title">NOMOR PESERTA</div>

                <div className="nomor-peserta">{p.noPeserta}</div>

                <div className="photo-circle">
                  {p.foto_url ? (
                    <img src={p.foto_url} alt={p.nama} />
                  ) : (
                    <User className="w-5 h-5 text-green-400" />
                  )}
                </div>

                <div className="nama">{p.nama}</div>
                <div className="detail">RUANG: {p.ruang.replace('Ruang ', '')} | KELAS: {p.kelas}</div>
                
                <div className="sekolah">{config.namaSekolah}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden Print Area - Denah Tempat Duduk */}
      <div className="hidden">
        <div id="denah-content" className="p-4 w-[210mm]">
          <style>{`
            @page { size: A4 portrait; margin: 10mm; }
            
            .denah-page { 
              width: 190mm; 
              min-height: 270mm; 
              margin: 10mm auto; 
              background: white; 
              padding: 5mm 10mm 10mm 10mm; 
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              page-break-after: always;
              position: relative;
              display: flex;
              flex-direction: column;
            }
            
            @media print {
              .denah-page { 
                width: 190mm; 
                min-height: 270mm; 
                margin: 0 auto; 
                background: white; 
                padding: 5mm 10mm 10mm 10mm; 
                box-shadow: none;
                page-break-after: always;
                position: relative;
                display: flex;
                flex-direction: column;
              }
            }
            
            .denah-header { 
              display: flex; 
              align-items: center; 
              border-bottom: 3px double #000; 
              padding-bottom: 4mm; 
              margin-bottom: 5mm; 
            }
            .denah-logo { width: 18mm; height: 18mm; margin-right: 5mm; }
            .denah-title { flex: 1; text-align: center; }
            .title-main { font-size: 14pt; font-weight: 900; }
            .title-sub { font-size: 11pt; font-weight: bold; }

            .denah-info { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 8mm; 
              font-weight: 800; 
              font-size: 10pt; 
              background: #f8fafc;
              padding: 3mm 5mm;
              border-radius: 2mm;
              border: 1.5px solid #1e293b;
            }
            .info-item span { color: #64748b; font-size: 8pt; margin-right: 2mm; }

            .papan-tulis { 
              width: 70%; 
              margin: 0 auto 10mm auto; 
              border: 3px solid #1e293b; 
              text-align: center; 
              padding: 3mm; 
              font-weight: 900; 
              font-size: 11pt;
              background: #f1f5f9;
              border-radius: 1mm;
              letter-spacing: 2px;
              color: #0f172a;
              text-transform: uppercase;
            }

            .denah-container { flex: 1; display: flex; align-items: flex-start; justify-content: center; }
            .denah-table { width: 100%; border-collapse: separate; border-spacing: 5mm; }
            .seat-cell { 
              width: ${100/jumlahKolom}%; 
              vertical-align: stretch; 
              height: 1px; /* Hack agar height 100% pada anak berfungsi di table */
            }
            .seat-box { 
              border: 2px solid #1e293b; 
              text-align: center; 
              height: 100%;
              min-height: 25mm; 
              display: flex; 
              flex-direction: column; 
              border-radius: 2mm;
              overflow: hidden;
              background: white;
            }
            .seat-header {
              background: #0f172a;
              color: #fff;
              padding: 1.5mm 1mm;
              flex-shrink: 0;
            }
            .seat-label {
              font-size: 6pt;
              font-weight: bold;
              letter-spacing: 1px;
              opacity: 0.8;
            }
            .seat-no-peserta { 
              font-size: 11pt; 
              font-weight: 900; 
            }
            .seat-body {
              padding: 2mm 1.5mm;
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              gap: 1.5mm;
            }
            .seat-nama-container {
              height: 8mm; /* Tinggi tetap untuk area nama agar seragam */
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .seat-nama { 
              font-size: 7.5pt; 
              font-weight: 800; 
              text-transform: uppercase; 
              line-height: 1.1; 
              overflow: hidden; 
              display: -webkit-box; 
              -webkit-line-clamp: 2; 
              -webkit-box-orient: vertical; 
              color: #0f172a;
            }
            .seat-kelas { 
              font-size: 7pt; 
              font-weight: bold;
              color: #64748b; 
              padding-top: 1.5mm;
              border-top: 1px dashed #cbd5e1;
              flex-shrink: 0;
            }
            
            .denah-footer { display: flex; justify-content: space-between; margin-top: 10mm; font-size: 10pt; }
            .footer-right { text-align: center; width: 60mm; }
            .keterangan { 
              font-size: 8pt; 
              color: #334155; 
              border: 1px dashed #cbd5e1; 
              padding: 3mm; 
              border-radius: 2mm;
              background: #f8fafc;
            }
            .seat-cell.empty .seat-box {
              background: #f8fafc;
              border: 2px dashed #cbd5e1;
            }
          `}</style>

          {(() => {
            const totalRooms = Math.ceil(parsedPeserta.length / kapasitas);
            let pagesHtml = '';
            const pengaturan = useAppStore.getState().pengaturan;
            const logoUrl = pengaturan?.logo_url || '';
            const namaSekolah = pengaturan?.nama_sekolah || 'SDN 02 CIBADAK';
            const kepsek = pengaturan?.nama_kepsek || 'HARYANTI, S.Pd.SD., M.M.';
            const nip = pengaturan?.nip_kepsek || '197012311993072001';

            for (let rIdx = 0; rIdx < totalRooms; rIdx++) {
              const roomNo = String(mulaiRuang + rIdx).padStart(2, '0');
              const roomStudents = parsedPeserta.slice(rIdx * kapasitas, (rIdx + 1) * kapasitas);
              const rows = Math.ceil(roomStudents.length / jumlahKolom);
              
              // Initialize grid
              let grid: (Peserta | null)[][] = Array(rows).fill(null).map(() => Array(jumlahKolom).fill(null));
              
              // Fill grid with zigzag logic
              roomStudents.forEach((s, i) => {
                const r = Math.floor(i / jumlahKolom);
                let c;
                if (polaZigzag && r % 2 !== 0) {
                  c = jumlahKolom - 1 - (i % jumlahKolom);
                } else {
                  c = i % jumlahKolom;
                }
                
                grid[r][c] = s;
              });

              pagesHtml += `
                <div class="denah-page">
                  <div class="denah-header">
                    <div class="denah-logo">
                      ${logoUrl && logoUrl !== '' ? 
                        `<img src="${logoUrl}" alt="Logo" style="width: 18mm; height: 18mm; object-fit: contain; border-radius: 50%;" />` :
                        `<div style="width: 18mm; height: 18mm; background: #0f172a; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: white; font-weight: bold; font-size: 8pt;">LOGO</div>`
                      }
                    </div>
                    <div class="denah-title">
                      <div class="title-main">DENAH TEMPAT DUDUK PESERTA</div>
                      <div class="title-sub">${namaUjian}</div>
                      <div class="title-sub">TAHUN PELAJARAN ${tahunPelajaran}</div>
                    </div>
                  </div>
                  
                  <div class="denah-info">
                    <div class="info-item"><span>RUANG</span>: ${roomNo}</div>
                    <div class="info-item"><span>LOKASI</span>: ${namaSekolah}</div>
                  </div>

                  <div class="papan-tulis">PAPAN TULIS / MEJA PENGAWAS</div>

                  <div class="denah-container">
                    <table class="denah-table">
                      ${grid.map((row, r) => `
                        <tr>
                          ${row.map((s, c) => s ? `
                            <td class="seat-cell">
                              <div class="seat-box">
                                <div class="seat-header">
                                  <div class="seat-label">NO. PESERTA</div>
                                  <div class="seat-no-peserta">${s.noPeserta}</div>
                                </div>
                                <div class="seat-body">
                                  <div class="seat-nama-container">
                                    <div class="seat-nama">${s.nama}</div>
                                  </div>
                                  <div class="seat-kelas">KELAS ${s.kelas}</div>
                                </div>
                              </div>
                            </td>
                          ` : `
                            <td class="seat-cell empty">
                              <div class="seat-box"></div>
                            </td>
                          `).join('')}
                        </tr>
                      `).join('')}
                    </table>
                  </div>

                  <div class="denah-footer">
                    <div class="footer-left">
                      <div class="keterangan">
                        <strong>Keterangan:</strong><br>
                        - Pintu Masuk di sisi belakang<br>
                        - Arah panah menunjukkan urutan nomor
                      </div>
                    </div>
                    <div class="footer-right">
                      Sukabumi, ${tglCetak}<br>
                      Kepala Sekolah,<br><br><br><br>
                      <strong>${kepsek}</strong><br>
                      NIP. ${nip}
                    </div>
                  </div>
                </div>
              `;
            }

            return <div dangerouslySetInnerHTML={{ __html: pagesHtml }} />;
          })()}
        </div>
      </div>
    </div>
  );
}

