"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileImage, Printer, Layers, Palette } from "lucide-react";
import UtilityHeader from "./UtilityHeader";
import { useSchoolConfig } from "@/hooks/useSchoolConfig";

interface CoverData {
  judul: string;
  subJudul: string;
  labelPenyusun: string;
  penyusun: string;
  labelTahun: string;
  tahun: string;
  theme: 'emerald' | 'blue' | 'slate';
}

export default function CoverGenerator() {
  const school = useSchoolConfig();
  const tahunSekarang = new Date().getFullYear();
  
  const [coverData, setCoverData] = useState<CoverData>({
    judul: "",
    subJudul: "",
    labelPenyusun: "",
    penyusun: "",
    labelTahun: "TAHUN PELAJARAN",
    tahun: `${tahunSekarang - 1}/${tahunSekarang}`,
    theme: 'emerald'
  });

  const handlePrint = () => {
    if (!coverData.judul.trim()) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print');
      return;
    }

    const themeColors = {
      emerald: { main: '#10b981' },
      blue: { main: '#2563eb' },
      slate: { main: '#1e293b' }
    };
    const selectedColor = themeColors[coverData.theme];

    const parsePenyusun = (penyusunRaw: string) => {
      if (!penyusunRaw.trim()) return '';
      
      const names = penyusunRaw.split('\n').filter(n => n.trim() !== '');
      
      if (names.length > 1) {
        return `<ol class="list-nama">` + names.map(n => `<li>${n}</li>`).join('') + `</ol>`;
      } else {
        return `<div class="single-nama">${names[0]}</div>`;
      }
    };

    const sectionPenyusun = coverData.penyusun.trim() ? `
      <div class="author-section">
        ${coverData.labelPenyusun ? `<div class="label-oleh">${coverData.labelPenyusun}</div>` : ''}
        ${parsePenyusun(coverData.penyusun)}
      </div>
    ` : '<div style="flex: 1;"></div>';

    printWindow.document.write(`
      <html>
      <head>
        <title>Cover - ${coverData.judul}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap');
          @page { size: A4 portrait; margin: 0; }
          body { 
            font-family: 'Montserrat', Arial, sans-serif; 
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .wrapper {
            width: 210mm;
            height: 297mm;
            background: white;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20mm;
            box-sizing: border-box;
          }
          
          .line-accent {
            position: absolute;
            top: 0;
            left: 15mm;
            width: 1.5mm;
            height: 100%;
            background: ${selectedColor.main};
            opacity: 0.1;
          }
          
          .circle-accent {
            position: absolute;
            top: -50mm;
            right: -50mm;
            width: 150mm;
            height: 150mm;
            border-radius: 50%;
            border: 15mm solid ${selectedColor.main};
            opacity: 0.03;
          }
          
          .watermark {
            position: absolute;
            bottom: -20mm;
            left: -20mm;
            width: 110mm;
            opacity: 0.04;
            transform: rotate(15deg);
            z-index: 0;
          }
          
          .header {
            text-align: center;
            margin-top: 15mm;
            z-index: 10;
            width: 100%;
          }
          
          .title {
            font-size: 32pt;
            font-weight: 900;
            line-height: 1.1;
            margin-bottom: 5mm;
            color: black;
            text-transform: uppercase;
          }
          
          .subtitle {
            font-size: 16pt;
            font-weight: bold;
            text-transform: uppercase;
            color: ${selectedColor.main};
            letter-spacing: 1px;
          }
          
          .logo-container {
            margin: 30mm 0;
            z-index: 10;
          }
          
          .logo-container img {
            width: 55mm;
            filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));
          }
          
          .author-section {
            text-align: center;
            flex: 1;
            z-index: 10;
            width: 100%;
          }
          
          .label-oleh {
            font-size: 11pt;
            font-weight: 600;
            color: #94a3b8;
            margin-bottom: 4mm;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          
          .single-nama {
            font-size: 18pt;
            font-weight: 800;
            color: #000;
          }
          
          .list-nama {
            display: inline-block;
            text-align: left;
            font-size: 14pt;
            font-weight: 700;
            line-height: 1.8;
          }
          
          .list-nama li {
            margin-bottom: 2mm;
          }
          
          .footer {
            text-align: center;
            margin-bottom: 10mm;
            z-index: 10;
            width: 100%;
          }
          
          .school-name {
            font-size: 20pt;
            font-weight: 900;
            margin-bottom: 2mm;
            color: #000;
          }
          
          .school-address {
            font-size: 10pt;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 8mm;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .tp-badge {
            border: 2px solid ${selectedColor.main};
            color: ${selectedColor.main};
            padding: 3mm 12mm;
            border-radius: 10px;
            font-weight: 900;
            font-size: 14pt;
            display: inline-block;
          }
          
          .btn-print { 
            position: fixed; 
            top: 20px; 
            right: 20px; 
            padding: 15px 30px; 
            background: #000; 
            color: #fff; 
            border: none; 
            border-radius: 50px; 
            font-weight: bold; 
            cursor: pointer; 
            z-index: 999; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.2); 
          }
          
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <button class="btn-print no-print" onclick="window.print()">🖨️ CETAK SEKARANG</button>
        <div class="wrapper">
          <div class="line-accent"></div>
          <div class="circle-accent"></div>
          <img src="${school.logoUrl}" class="watermark" />

          <div class="header">
            <div class="title">${coverData.judul}</div>
            <div class="subtitle">${coverData.subJudul}</div>
          </div>

          <div class="logo-container">
            <img src="${school.logoUrl}" />
          </div>

          ${sectionPenyusun}

          <div class="footer">
            <div class="school-name">${school.namaSekolah}</div>
            <div class="school-address">${school.kotaSekolah} - ${school.alamatSekolah.split(',').slice(-2).join(', ').trim()}</div>
            <div class="tp-badge">${coverData.labelTahun} ${coverData.tahun}</div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-4xl mx-auto pb-10">
      <UtilityHeader
        icon={FileImage}
        title="Cover Generator"
        subtitle="Pusat Cetak & Utility • Desain Cover Dokumen"
        accentColor="emerald"
        actionLabel="Generate & Print Cover"
        actionIcon={Printer}
        onAction={() => handlePrint()}
        actionDisabled={!coverData.judul.trim()}
      />

      {/* Form Input Cover */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="card p-6">
        <h2 className="text-sm font-bold text-slate-300 mb-5 uppercase tracking-wider flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          Informasi Dokumen
        </h2>
        <div className="space-y-4">
          {/* Judul Utama */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Judul Utama Dokumen</label>
            <input 
              type="text" 
              value={coverData.judul} 
              onChange={(e) => setCoverData(prev => ({...prev, judul: e.target.value}))}
              placeholder="Contoh: LAPORAN PROGRAM KERJA KESISWAAN" 
              className="input-obsidian !text-base font-black uppercase" 
            />
          </div>
          
          {/* Sub-Judul */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Sub-Judul / Keterangan Tambahan</label>
            <input 
              type="text" 
              value={coverData.subJudul} 
              onChange={(e) => setCoverData(prev => ({...prev, subJudul: e.target.value}))}
              placeholder="Contoh: KOMPETENSI KEAHLIAN / NAMA KEGIATAN" 
              className="input-obsidian uppercase" 
            />
          </div>
        </div>
      </motion.div>

      {/* Identitas Penyusun */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="card p-6">
        <h2 className="text-sm font-bold text-slate-300 mb-5 uppercase tracking-wider flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          Identitas Penyusun
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
          <div>
            <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Label Identitas</label>
            <select 
              value={coverData.labelPenyusun} 
              onChange={(e) => setCoverData(prev => ({...prev, labelPenyusun: e.target.value}))}
              className="w-full mt-1 input-obsidian py-3 font-bold text-sm"
            >
              <option value="">- Tanpa Nama -</option>
              <option value="Disusun Oleh:">Disusun Oleh:</option>
              <option value="Oleh:">Oleh:</option>
              <option value="Penanggung Jawab:">Penanggung Jawab:</option>
              <option value="Guru Pengampu:">Guru Pengampu:</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Nama / List Nama</label>
            <textarea 
              value={coverData.penyusun} 
              onChange={(e) => setCoverData(prev => ({...prev, penyusun: e.target.value}))}
              rows={2} 
              placeholder="Satu baris satu nama..." 
              className="w-full mt-1 input-obsidian py-2 font-bold text-sm resize-none" 
            />
          </div>
        </div>
      </motion.div>

      {/* Pengaturan Tahun dan Tema */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="card p-6">
        <h2 className="text-sm font-bold text-slate-300 mb-5 uppercase tracking-wider flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Palette className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          Pengaturan Tahun & Tema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Jenis Periode</label>
            <select 
              value={coverData.labelTahun} 
              onChange={(e) => setCoverData(prev => ({...prev, labelTahun: e.target.value}))}
              className="w-full mt-1 input-obsidian py-3 font-bold text-sm"
            >
              <option value="TAHUN PELAJARAN">Tahun Pelajaran (Akademik)</option>
              <option value="TAHUN ANGGARAN">Tahun Anggaran (Keuangan)</option>
              <option value="TAHUN">Tahun (Umum)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Isi Tahun</label>
            <input 
              type="text" 
              value={coverData.tahun} 
              onChange={(e) => setCoverData(prev => ({...prev, tahun: e.target.value}))}
              className="w-full mt-1 input-obsidian py-3 font-bold" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tema Warna</label>
            <select 
              value={coverData.theme} 
              onChange={(e) => setCoverData(prev => ({...prev, theme: e.target.value as 'emerald' | 'blue' | 'slate'}))}
              className="w-full mt-1 input-obsidian py-3 font-bold"
            >
              <option value="emerald">Emerald Green</option>
              <option value="blue">Deep Blue</option>
              <option value="slate">Midnight Black</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Action */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <button 
          onClick={() => handlePrint()} 
          disabled={!coverData.judul.trim()}
          className="w-full py-4 btn-primary rounded-2xl font-black shadow-lg flex justify-center items-center gap-3 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Printer className="w-4 h-4" /> GENERATE & PRINT COVER
        </button>
      </motion.div>
    </div>
  );
}
