"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import QRCode from "react-qr-code";
import { QrCode, Printer, Info, Grid3X3, Search, Users, Type, Trash2, Plus } from "lucide-react";
import UtilityHeader from "./UtilityHeader";
import { useAppStore } from "@/store/app.store";
import { useSiswa } from "@/hooks/useSiswa";



export default function QRCodeGenerator() {
  const { data: dataSiswa = [] } = useSiswa();
  const { pengaturan } = useAppStore();

  const KUMPULAN_KELAS = Array.from(new Set(dataSiswa.map(s => s.kelas))).filter((k): k is string => !!k).sort();

  const [mode, setMode] = useState<"massal" | "kustom">("massal");
  const [selectedKelas, setSelectedKelas] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const toggleKelas = (kelas: string) => {
    setSelectedKelas(prev => {
      const next = new Set(prev);
      if (next.has(kelas)) {
        next.delete(kelas);
      } else {
        next.add(kelas);
      }
      return next;
    });
  };
  
  // State untuk Mode Kustom
  const [customText, setCustomText] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [customList, setCustomList] = useState<{id: string, text: string, label: string}[]>([]);

  const LOGO_SEKOLAH_URL = pengaturan?.logo_url || "/logo_sekolah.png";

  const handleAddCustom = () => {
    if (!customText.trim()) return;
    setCustomList(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      text: customText,
      label: customLabel || customText
    }]);
    setCustomText("");
    setCustomLabel("");
  };

  const handlePrint = (targetSiswa?: any) => {
    let listToPrint: any[] = [];
    
    if (mode === "massal") {
      if (targetSiswa) {
        listToPrint = [{
          label: targetSiswa.nama,
          value: targetSiswa.nisn || targetSiswa.nis || targetSiswa.nama,
          sublabel: `KELAS ${targetSiswa.kelas}`
        }];
      } else {
          const filtered = dataSiswa
            .filter(s => selectedKelas.size === 0 || selectedKelas.has(s.kelas || ""))
            .sort((a, b) => a.nama.localeCompare(b.nama));
          listToPrint = filtered.map(s => ({
          label: s.nama,
          value: s.nisn || s.nis || s.nama,
          sublabel: `KELAS ${s.kelas}`
        }));
      }
    } else {
      listToPrint = customList.map(c => ({
        label: c.label,
        value: c.text,
        sublabel: "KUSTOM QR"
      }));
    }

    if (listToPrint.length === 0) return alert("Tidak ada data untuk dicetak!");

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // We need to render QR Codes to SVG strings for the print window
    // Since react-qr-code is a component, we'll use a simple approach: 
    // In the print window, we'll use a CDN or just raw SVG if possible.
    // For simplicity and reliability in this environment, we'll use a data URL or similar.
    
    const labelsHTML = listToPrint.map((item) => `
      <div class="qr-card">
        <div class="header-strip"></div>
        <div class="qr-label">${item.label}</div>
        <div class="qr-container">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(item.value)}" />
        </div>
        <div class="qr-footer">
          <img src="${LOGO_SEKOLAH_URL}" class="footer-logo" />
          <div class="footer-text">
            <div class="school-name">SD NEGERI 02 CIBADAK</div>
            <div class="sub-label">${item.sublabel}</div>
          </div>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
      <head>
        <title>Cetak QR Code</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background: #fff; }
          .container { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 15px; 
            padding: 10px;
          }
          .qr-card {
            border: 2px solid #000;
            border-radius: 12px;
            padding: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            page-break-inside: avoid;
            background: #fff;
            position: relative;
            height: 55mm;
            box-sizing: border-box;
          }
          .header-strip {
            position: absolute; top: 0; left: 0; right: 0;
            height: 6px; background: #000; border-radius: 10px 10px 0 0;
          }
          .qr-label {
            font-size: 8pt; font-weight: 900; text-transform: uppercase;
            margin: 5px 0 8px 0; line-height: 1.1;
            height: 2.4em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          }
          .qr-container {
            background: #fff; padding: 5px; border: 1px solid #eee; border-radius: 8px;
            margin-bottom: 8px;
          }
          .qr-container img { width: 85px; height: 85px; }
          .qr-footer {
            display: flex; align-items: center; gap: 6px; margin-top: auto;
            border-top: 1px solid #eee; padding-top: 5px; width: 100%;
          }
          .footer-logo { width: 18px; height: 18px; filter: grayscale(100%); }
          .footer-text { text-align: left; }
          .school-name { font-size: 5pt; font-weight: 900; letter-spacing: 0.5px; }
          .sub-label { font-size: 5pt; font-weight: bold; color: #666; }
          
          @media print { .no-print { display: none; } }
          .btn-print { position: fixed; top: 20px; right: 20px; padding: 12px 24px; background: #f59e0b; color: #fff; border: none; border-radius: 50px; font-weight: bold; cursor: pointer; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        </style>
      </head>
      <body>
        <button class="btn-print no-print" onclick="window.print()">🖨️ CETAK SEKARANG</button>
        <div class="container">${labelsHTML}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredSiswa = dataSiswa
    .filter((s) => {
      const matchKelas = selectedKelas.size === 0 || selectedKelas.has(s.kelas || "");
      const matchSearch = searchQuery === "" || s.nama.toLowerCase().includes(searchQuery.toLowerCase());
      return matchKelas && matchSearch;
    })
    .sort((a, b) => a.nama.localeCompare(b.nama));

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-4xl mx-auto pb-10">
      <UtilityHeader
        icon={QrCode}
        title="QR Code Generator"
        subtitle="Pusat Cetak & Utility • QR Code Identitas & Kustom"
        accentColor="amber"
        actionLabel={mode === "massal" ? "Cetak Massal" : "Cetak List"}
        actionIcon={Printer}
        onAction={() => handlePrint()}
        actionDisabled={mode === "massal" ? filteredSiswa.length === 0 : customList.length === 0}
      />

      {/* Mode Selector */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => setMode("massal")}
          className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${mode === "massal" ? "bg-amber-500/10 border-amber-500 text-amber-400" : "bg-white/5 border-white/10 text-slate-400"}`}
        >
          <Users className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-widest">Database Siswa</span>
        </button>
        <button 
          onClick={() => setMode("kustom")}
          className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${mode === "kustom" ? "bg-amber-500/10 border-amber-500 text-amber-400" : "bg-white/5 border-white/10 text-slate-400"}`}
        >
          <Type className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-widest">QR Kustom</span>
        </button>
      </div>

      {mode === "massal" ? (
        <div className="space-y-6">
          {/* 1. Pilih Kelas */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Grid3X3 className="w-4 h-4 text-amber-400" />
              1. Pilih Kelas
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {KUMPULAN_KELAS.map((k) => {
                const count = dataSiswa.filter(s => s.kelas === k).length;
                return (
                  <button
                    key={k}
                    onClick={() => toggleKelas(k)}
                    className={`relative flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-center transition-all ${
                      selectedKelas.has(k)
                        ? "bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]" 
                        : "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:bg-white/[0.04] hover:border-white/10"
                    }`}
                  >
                    <span className="font-black text-xs uppercase">{k}</span>
                    <span className={`text-[9px] mt-1 font-bold px-1.5 py-0.5 rounded-full ${selectedKelas.has(k) ? "bg-amber-500/20 text-amber-400" : "bg-black/40 text-slate-500"}`}>
                      {count} Siswa
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* 2. Cari & Daftar Siswa */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-0 overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-white/[0.02] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  2. Pilih Siswa & Cetak
                </h2>
                <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-lg border border-white/10 uppercase">
                  {filteredSiswa.length} Siswa Terfilter
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama siswa..." 
                  className="input-obsidian pl-11 py-3" 
                />
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scroll">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-[#0f111a] z-10 border-b border-white/10">
                  <tr>
                    <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-widest">Nama Siswa</th>
                    <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-widest text-center">QR Content</th>
                    <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {selectedKelas.size === 0 && searchQuery === "" ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-500">
                          <Grid3X3 className="w-8 h-8 opacity-20" />
                          <p className="text-xs font-bold uppercase tracking-[0.2em]">Silakan pilih kelas terlebih dahulu</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSiswa.length > 0 ? (
                    filteredSiswa.slice(0, searchQuery === "" && selectedKelas.size === 0 ? 10 : 50).map((s) => (
                      <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-200 uppercase group-hover:text-amber-400 transition-colors">{s.nama}</div>
                          <div className="text-[10px] text-slate-500 font-bold mt-0.5">KELAS {s.kelas}</div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <QRCode value={s.nisn || s.nis || s.nama} size={24} bgColor="transparent" fgColor="#475569" />
                            <span className="font-mono text-[10px] text-slate-500">{s.nisn || s.nis || "N/A"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button 
                            onClick={() => handlePrint(s)}
                            className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white rounded-xl text-[10px] font-black transition-all border border-amber-500/20 flex items-center gap-2 ml-auto"
                          >
                            <Printer className="w-3.5 h-3.5" /> CETAK QR
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-10 text-center text-slate-500 font-bold italic">Siswa tidak ditemukan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Form Kustom */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              Tambah QR Kustom
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Isi QR (Link/Teks/NIS)</label>
                <input 
                  type="text" 
                  value={customText} 
                  onChange={(e) => setCustomText(e.target.value)} 
                  placeholder="https://google.com atau Kode..." 
                  className="input-obsidian mt-2" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Label Tampilan (Opsional)</label>
                <input 
                  type="text" 
                  value={customLabel} 
                  onChange={(e) => setCustomLabel(e.target.value)} 
                  placeholder="Nama Pemilik/Judul..." 
                  className="input-obsidian mt-2" 
                />
              </div>
            </div>
            <button 
              onClick={handleAddCustom}
              disabled={!customText.trim()}
              className="w-full bg-amber-600/20 hover:bg-amber-600 border border-amber-600/30 text-amber-500 hover:text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-30"
            >
              <Plus className="w-4 h-4" /> TAMBAHKAN KE LIST
            </button>
          </motion.div>

          {/* List Kustom */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-0 overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-white/[0.02]">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-amber-400" />
                List QR Siap Cetak ({customList.length})
              </h2>
            </div>
            <div className="max-h-[300px] overflow-y-auto custom-scroll">
              <table className="w-full text-xs text-left">
                <tbody className="divide-y divide-white/5">
                  {customList.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.01]">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-200 uppercase">{c.label}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{c.text}</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button 
                          onClick={() => setCustomList(prev => prev.filter(item => item.id !== c.id))}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {customList.length === 0 && (
                    <tr>
                      <td className="p-10 text-center text-slate-600 font-bold italic">Belum ada item ditambahkan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          <button 
            onClick={() => handlePrint()}
            disabled={customList.length === 0}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-30"
          >
            <Printer className="w-5 h-5" /> CETAK SEMUA LIST KUSTOM
          </button>
        </div>
      )}
    </div>
  );
}

import { ClipboardList } from "lucide-react";



