"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Printer, Info, Layers, Grid3X3 } from "lucide-react";
import UtilityHeader from "./UtilityHeader";
import { useAppStore } from "@/store/app.store";
import { useSiswa } from "@/hooks/useSiswa";
import { useSchoolConfig } from "@/hooks/useSchoolConfig";
import { formatTanggal } from "@/lib/utils";

export default function LabelMapArsip() {
  const { data: dataSiswa = [] } = useSiswa();
  const { pengaturan } = useAppStore();
  const config = useSchoolConfig();

  const KUMPULAN_KELAS = Array.from(new Set(dataSiswa.map((s) => s.kelas)))
    .filter((k): k is string => !!k)
    .sort();

  const [selectedKelas, setSelectedKelas] = useState<Set<string>>(new Set());
  const [layoutMode, setLayoutMode] = useState<"standard" | "ijazah">("ijazah");
  const [tahunPelajaran, setTahunPelajaran] = useState("2025 - 2026");

  // Ijazah configuration
  const [judulDokumen, setJudulDokumen] = useState("IJAZAH");
  const [alamatFooter, setAlamatFooter] = useState("jalan kebon pala 2, cibadak, sukabumi 43351");
  const [teleponFooter, setTeleponFooter] = useState("telepon 0266 532253 faksimile 0266 532253");
  const [websiteFooter, setWebsiteFooter] = useState("https://www.sdn02cibadak.sch.id");
  const [emailFooter, setEmailFooter] = useState("info@sdn02cibadak.sch.id");
  const [showQrCode, setShowQrCode] = useState(true);

  const handlePrint = () => {
    if (filteredSiswa.length === 0) return;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Popup blocked! Please allow popups for this site.");
      return;
    }

    const cardsHTML = filteredSiswa
      .map((s) => {
        const ttl = `${s.tempat_lahir || "-"}, ${s.tanggal_lahir ? formatTanggal(s.tanggal_lahir) : "-"}`;
        const nomorIjazah = (s as any).nilai_kelulusan?.nomor_ijazah || s.no_ijazah || "-";
        const jenisKelamin = s.jk === "L" ? "Laki-laki" : "Perempuan";

        if (layoutMode === "ijazah") {
          return `
            <div class="page-container">
              <div class="top-logo-section">
                <img class="top-logo-img" src="/Lambang_Kab_Sukabumi.svg" alt="Lambang Kabupaten Sukabumi" />
              </div>
              
              <div class="header-section">
                <div class="gov-text">PEMERINTAH KABUPATEN SUKABUMI</div>
                <div class="school-text">SD NEGERI 02 CIBADAK</div>
              </div>
              
              <div class="school-logo-section">
                <img class="school-logo-img" src="${config.logoUrl}" alt="Logo Sekolah" />
              </div>
              
              <div class="title-section">
                <div class="document-title">${judulDokumen}</div>
              </div>
              
              <div class="info-section">
                <table class="info-table">
                  <tr>
                    <td class="info-label">Nama</td>
                    <td class="info-colon">:</td>
                    <td class="info-value font-bold">${s.nama || "-"}</td>
                  </tr>
                  <tr>
                    <td class="info-label">Tempat dan tanggal lahir</td>
                    <td class="info-colon">:</td>
                    <td class="info-value">${ttl}</td>
                  </tr>
                  <tr>
                    <td class="info-label">Nomor Ijazah</td>
                    <td class="info-colon">:</td>
                    <td class="info-value">${nomorIjazah}</td>
                  </tr>
                  <tr>
                    <td class="info-label">N.I.S.N</td>
                    <td class="info-colon">:</td>
                    <td class="info-value">${s.nisn || "-"}</td>
                  </tr>
                  <tr>
                    <td class="info-label">Jenis Kelamin</td>
                    <td class="info-colon">:</td>
                    <td class="info-value">${s.jk || "-"}</td>
                  </tr>
                  <tr>
                    <td class="info-label">Asal Sekolah</td>
                    <td class="info-colon">:</td>
                    <td class="info-value">SD Negeri 02 Cibadak</td>
                  </tr>
                </table>
              </div>
              
              <div class="footer-section">
                <div class="footer-body ${showQrCode ? 'has-qr' : ''}">
                  <div class="footer-text-block">
                    <div class="footer-text address">${alamatFooter}</div>
                    <div class="footer-text contact">${teleponFooter}</div>
                    <div class="footer-text web-mail">
                      laman : <span class="underline">${websiteFooter}</span> &nbsp;&bull;&nbsp; pos-el : <span class="underline">${emailFooter}</span>
                    </div>
                  </div>
                  ${showQrCode && s.nisn ? `
                    <div class="qr-container">
                      <img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(window.location.origin + '/verify?nisn=' + s.nisn)}" alt="QR Code" />
                      <div class="qr-label">IMBAS UNTUK VERIFIKASI</div>
                    </div>
                  ` : ""}
                </div>
                <div class="year-section">${tahunPelajaran}</div>
              </div>
            </div>
          `;
        }

        // Standard card layout
        return `
          <div class="standard-card">
            <div class="standard-top-bar"></div>
            <h3 class="standard-title">ARSIP BERKAS SISWA</h3>
            <div class="standard-school">${config.namaSekolah}</div>
            <div class="standard-content">
              <div class="standard-name">${s.nama || "-"}</div>
              <div class="standard-nis">NISN: ${s.nisn || "-"} / NIS: ${s.nis || "-"}</div>
              <div class="standard-class">KELAS ${s.kelas || "-"}</div>
            </div>
            <div class="standard-footer">
              <span>TAHUN: ${tahunPelajaran}</span>
              <span class="standard-status">AKTIF</span>
            </div>
          </div>
        `;
      })
      .join("");

    printWindow.document.write(`
      <html>
      <head>
        <title>Label Map Arsip</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Times New Roman', Times, serif; margin: 0; padding: 0; background: white !important; color: #000; }
          .btn-print { position: fixed; top: 20px; right: 20px; padding: 15px 30px; background: #000; color: #fff; border: none; border-radius: 50px; font-weight: bold; cursor: pointer; z-index: 999; box-shadow: 0 4px 15px rgba(0,0,0,0.2); font-family: 'Inter', sans-serif; }
          @media print { .no-print { display: none !important; } }
          
          /* Ijazah Portrait A4 Layout */
          .portrait-container { display: flex; flex-direction: column; width: 100%; }
          .page-container {
            width: 100%;
            height: 255mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            page-break-after: always;
            box-sizing: border-box;
            padding: 10mm 5mm;
          }
          .top-logo-section {
            margin-bottom: 2mm;
            display: flex;
            justify-content: center;
          }
          .top-logo-img {
            height: 60px;
            object-fit: contain;
          }
          .header-section {
            text-align: center;
            margin-bottom: 6mm;
          }
          .gov-text {
            font-size: 16pt;
            font-weight: bold;
            letter-spacing: 1px;
            margin-bottom: 2px;
          }
          .school-text {
            font-size: 20pt;
            font-weight: bold;
            letter-spacing: 1px;
          }
          .school-logo-section {
            margin-bottom: 6mm;
            display: flex;
            justify-content: center;
          }
          .school-logo-img {
            height: 90px;
            object-fit: contain;
          }
          .title-section {
            margin-bottom: 12mm;
            text-align: center;
          }
          .document-title {
            font-size: 26pt;
            font-weight: bold;
            letter-spacing: 6px;
            text-decoration: none;
            display: inline-block;
          }
          .info-section {
            width: 80%;
            margin: 10mm auto 15mm auto;
            flex-grow: 1;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14pt;
          }
          .info-table td {
            padding: 8px 4px;
            vertical-align: top;
          }
          .info-label {
            width: 38%;
            text-align: left;
          }
          .info-colon {
            width: 4%;
            text-align: center;
          }
          .info-value {
            width: 58%;
            text-align: left;
          }
          .font-bold {
            font-weight: bold;
          }
          .footer-section {
            width: 100%;
            font-size: 11pt;
            line-height: 1.5;
          }
          .footer-body {
            width: 100%;
            text-align: center;
          }
          .footer-body.has-qr {
            display: flex;
            align-items: center;
            justify-content: space-between;
            text-align: left;
            padding: 0 10mm;
            box-sizing: border-box;
          }
          .footer-body.has-qr .footer-text-block {
            flex-grow: 1;
          }
          .qr-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin-left: 15px;
            border: 1px solid #ccc;
            padding: 6px;
            background: #fff;
            border-radius: 4px;
            flex-shrink: 0;
          }
          .qr-img {
            width: 70px;
            height: 70px;
            object-fit: contain;
          }
          .qr-label {
            font-size: 6pt;
            font-weight: bold;
            margin-top: 4px;
            color: #555;
            letter-spacing: 0.5px;
            font-family: Arial, sans-serif;
            text-align: center;
          }
          .footer-text {
            margin-bottom: 2px;
          }
          .address {
            text-transform: capitalize;
          }
          .underline {
            text-decoration: underline;
          }
          .year-section {
            margin-top: 15mm;
            font-size: 18pt;
            font-weight: bold;
            letter-spacing: 2px;
          }

          /* Standard Card Grid Layout */
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; padding: 32px; }
          .standard-card {
            background: white;
            border-radius: 16px;
            padding: 32px;
            border: 4px solid #0f172a;
            aspect-ratio: 2/1;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
            text-align: center;
            page-break-inside: avoid;
            box-sizing: border-box;
          }
          .standard-top-bar {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 16px;
            background: #0f172a;
          }
          .standard-title {
            font-weight: 900;
            color: #0f172a;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.3em;
            margin-top: 8px;
            margin-bottom: 4px;
            font-family: 'Inter', Arial, sans-serif;
          }
          .standard-school {
            font-size: 10px;
            font-weight: 900;
            color: #64748b;
            letter-spacing: 0.2em;
            margin-bottom: 24px;
            text-transform: uppercase;
            font-family: 'Inter', Arial, sans-serif;
          }
          .standard-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
          }
          .standard-name {
            font-size: 20px;
            font-weight: 900;
            color: #0f172a;
            line-height: 1.2;
            text-transform: uppercase;
            letter-spacing: -0.02em;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            font-family: 'Inter', Arial, sans-serif;
          }
          .standard-nis {
            font-size: 14px;
            font-weight: 900;
            color: #475569;
            font-family: 'Inter', Arial, sans-serif;
          }
          .standard-class {
            font-size: 18px;
            font-weight: 900;
            color: white;
            background: #0f172a;
            padding: 6px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            margin-top: 4px;
            font-family: 'Inter', Arial, sans-serif;
          }
          .standard-footer {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 3px solid #0f172a;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            font-weight: 900;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            font-family: 'Inter', Arial, sans-serif;
          }
          .standard-status {
            background: #f1f5f9;
            padding: 4px 12px;
            border-radius: 6px;
          }
          @media screen { body { zoom: 0.6; } }
        </style>
      </head>
      <body>
        <button class="btn-print no-print" onclick="window.print()">🖨️ CETAK SEKARANG</button>
        ${layoutMode === "ijazah" 
          ? `<div class="portrait-container">${cardsHTML}</div>` 
          : `<div class="grid">${cardsHTML}</div>`}
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

  const filteredSiswa = dataSiswa
    .filter((s) => selectedKelas.has(s.kelas || ""))
    .sort((a, b) => {
      const kelasA = a.kelas || "";
      const kelasB = b.kelas || "";
      if (kelasA !== kelasB) return kelasA.localeCompare(kelasB);
      return (a.nama || "").localeCompare(b.nama || "");
    });

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-4xl mx-auto pb-10">
      <UtilityHeader
        icon={FolderOpen}
        title="Label Map Arsip Siswa"
        subtitle="Pusat Cetak & Utility • Smart Filing Label"
        accentColor="cyan"
        actionLabel="Cetak Label"
        actionIcon={Printer}
        onAction={() => handlePrint()}
        actionDisabled={filteredSiswa.length === 0}
      />

      {/* Format & Layout Selection */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card p-6"
      >
        <h2 className="text-sm font-bold text-slate-300 mb-5 uppercase tracking-wider flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/15 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          Format & Layout Label
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setLayoutMode("ijazah")}
            className={`flex flex-col items-center p-4 rounded-xl border text-center transition-all ${
              layoutMode === "ijazah"
                ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                : "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:border-white/[0.1] hover:bg-white/[0.04]"
            }`}
          >
            <span className="font-black text-sm uppercase">Ijazah / Map Coklat</span>
            <span className="text-[10px] mt-1 opacity-60">1 Lembar A4 Portrait per Siswa</span>
          </button>

          <button
            onClick={() => setLayoutMode("standard")}
            className={`flex flex-col items-center p-4 rounded-xl border text-center transition-all ${
              layoutMode === "standard"
                ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                : "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:border-white/[0.1] hover:bg-white/[0.04]"
            }`}
          >
            <span className="font-black text-sm uppercase">Standard (Grid Card)</span>
            <span className="text-[10px] mt-1 opacity-60">2 Kolom Card per Lembar A4</span>
          </button>
        </div>
      </motion.div>

      {/* Pemilihan Kelas */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="card p-6"
      >
        <h2 className="text-sm font-bold text-slate-300 mb-5 uppercase tracking-wider flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/15 flex items-center justify-center">
            <Grid3X3 className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          Pemilihan Kelas (Sumber Data)
        </h2>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {KUMPULAN_KELAS.map((kelas) => {
            const isSelected = selectedKelas.has(kelas);
            const count = dataSiswa.filter((s) => s.kelas === kelas).length;

            return (
              <button
                key={kelas}
                onClick={() => toggleKelas(kelas)}
                className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    : "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:border-white/[0.1] hover:bg-white/[0.04]"
                }`}
              >
                <span className="font-black text-sm uppercase">{kelas}</span>
                <span className="text-[9px] mt-1 font-bold opacity-60 bg-black/20 px-2 py-0.5 rounded-full">
                  {count} Siswa
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Konfigurasi */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <h2 className="text-sm font-bold text-slate-300 mb-5 uppercase tracking-wider flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/15 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          Konfigurasi Arsip
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Tahun Pelajaran / Tahun
              </label>
              <input
                type="text"
                value={tahunPelajaran}
                onChange={(e) => setTahunPelajaran(e.target.value)}
                placeholder="Contoh: 2025 - 2026"
                className="input-obsidian"
              />
            </div>

            {layoutMode === "ijazah" && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Judul Label Dokumen
                  </label>
                  <input
                    type="text"
                    value={judulDokumen}
                    onChange={(e) => setJudulDokumen(e.target.value)}
                    placeholder="Contoh: IJAZAH"
                    className="input-obsidian"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-300 hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={showQrCode}
                      onChange={(e) => setShowQrCode(e.target.checked)}
                      className="checkbox-cyan"
                    />
                    <span className="text-xs font-bold uppercase tracking-wider">Tampilkan QR Code Verifikasi</span>
                  </label>
                </div>
              </>
            )}
          </div>

          {layoutMode === "ijazah" && (
            <div className="space-y-4 pt-4 border-t border-white/[0.05]">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kop & Footer Info (Map Coklat)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Alamat Sekolah
                  </label>
                  <input
                    type="text"
                    value={alamatFooter}
                    onChange={(e) => setAlamatFooter(e.target.value)}
                    className="input-obsidian text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Telepon / Faksimile
                  </label>
                  <input
                    type="text"
                    value={teleponFooter}
                    onChange={(e) => setTeleponFooter(e.target.value)}
                    className="input-obsidian text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Website Resmi
                  </label>
                  <input
                    type="text"
                    value={websiteFooter}
                    onChange={(e) => setWebsiteFooter(e.target.value)}
                    className="input-obsidian text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Email Resmi (Pos-el)
                  </label>
                  <input
                    type="text"
                    value={emailFooter}
                    onChange={(e) => setEmailFooter(e.target.value)}
                    className="input-obsidian text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-start gap-3 p-4 bg-cyan-500/5 rounded-xl border border-cyan-500/10">
          <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Data akan disinkronisasi dari Buku Induk. Akan menghasilkan{" "}
            <b>{filteredSiswa.length}</b> label map arsip untuk siswa di kelas
            yang dipilih.
          </p>
        </div>
      </motion.div>

      {/* Action */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <button
          onClick={() => handlePrint()}
          disabled={filteredSiswa.length === 0}
          className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
        >
          <Printer className="w-4 h-4" />
          Cetak{" "}
          {filteredSiswa.length > 0
            ? `${filteredSiswa.length} Label Map`
            : "Label Map"}
        </button>
      </motion.div>
    </div>
  );
}
