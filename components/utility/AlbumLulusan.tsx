"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Images, Printer, Info, GraduationCap, Users, Grid3X3, Search, Layout, CheckCircle2, ClipboardList, History, Zap, Leaf, Sparkles } from "lucide-react";
import UtilityHeader from "./UtilityHeader";
import { useAppStore } from "@/store/app.store";
import { useSiswa } from "@/hooks/useSiswa";



const FRAME_DESIGNS = [
  { id: "modern", name: "Modern Obsidian", color: "slate", icon: Layout, desc: "Desain tajam, minimalis, dan profesional." },
  { id: "classic", name: "Classic Royal", color: "blue", icon: GraduationCap, desc: "Gaya album sekolah tradisional dengan border tebal." },
  { id: "elegant", name: "Elegant Gold", color: "amber", icon: Images, desc: "Aksen emas dengan tipografi serif yang mewah." },
  { id: "minimalist", name: "Minimalist Air", color: "rose", icon: Grid3X3, desc: "Bersih, luas, dengan sudut foto yang membulat." },
  { id: "vintage", name: "Mading Sekolah", color: "orange", icon: History, desc: "Nuansa mading sekolah dengan efek foto tempel." },
  { id: "aurora", name: "Aurora Night", color: "indigo", icon: Sparkles, desc: "Tema gelap futuristik dengan gradasi Aurora." },
  { id: "cyber", name: "Cyber Neon", color: "cyan", icon: Zap, desc: "Kontras tinggi dengan aksen neon Cyberpunk." },
  { id: "nature", name: "Nature Zen", color: "emerald", icon: Leaf, desc: "Kesan alami dengan warna hijau lembut." },
];

export default function AlbumLulusan() {
  const { data: dataSiswa = [] } = useSiswa();
  const { pengaturan } = useAppStore();

  const KUMPULAN_KELAS = Array.from(new Set(dataSiswa.map(s => s.kelas))).filter((k): k is string => !!k).sort();

  const [selectedKelas, setSelectedKelas] = useState<Set<string>>(new Set());
  const [tahunPelajaran, setTahunPelajaran] = useState(pengaturan?.tahun_ajaran || "2025/2026");
  const [angkatan, setAngkatan] = useState("Angkatan ke-15");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDesign, setSelectedDesign] = useState("modern");

  const toggleKelas = (kelas: string) => {
    setSelectedKelas((prev) => {
      const next = new Set(prev);
      if (next.has(kelas)) {
        next.delete(kelas);
      } else {
        next.add(kelas);
      }
      return next;
    });
  };

  const handlePrint = () => {
    const listToPrint = filteredSiswa;
    
    if (listToPrint.length === 0) {
      alert("Tidak ada data untuk dicetak!");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocked! Please allow popups for this site.');
      return;
    }

    const albumHTML = listToPrint.map((s, i) => `
      <div class="student-card design-${selectedDesign}">
        <div class="photo-frame">
          <div class="photo-inner">
            <img src="/api/foto-siswa/${s.nisn}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
            <div class="photo-placeholder" style="display:none;">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>FOTO 3X4</span>
            </div>
          </div>
          <div class="photo-number">${i + 1}</div>
          <div class="pin"></div>
        </div>
        <div class="student-info">
          <div class="student-name">${s.nama || "-"}</div>
          <div class="student-nisn">NISN: ${s.nisn || "-"}</div>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
      <head>
        <title>Album Lulusan - ${tahunPelajaran.replace(/\//g, "-")}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background: #fff; color: #333; }
          .container { padding: 10mm; box-sizing: border-box; }
          
          .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 30px; }
          .header h1 { font-size: 24pt; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 2px; }
          .header h2 { font-size: 16pt; font-weight: bold; margin: 5px 0; text-transform: uppercase; }
          .header p { font-size: 10pt; font-weight: 900; margin: 5px 0; color: #666; text-transform: uppercase; letter-spacing: 3px; }

          .grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 30px 20px;
          }

          .student-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            page-break-inside: avoid;
          }

          /* Base Photo Frame */
          .photo-frame {
            width: 38mm;
            height: 52mm;
            padding: 2mm;
            position: relative;
            margin-bottom: 10px;
            box-sizing: border-box;
            transition: all 0.3s ease;
          }

          .photo-inner {
            width: 100%;
            height: 100%;
            background: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
          }

          .photo-inner img { width: 100%; height: 100%; object-fit: cover; }
          
          .photo-number {
            position: absolute;
            width: 24px; height: 24px;
            display: flex; align-items: center; justify-content: center;
            font-size: 9pt; font-weight: 900;
            border: 3px solid #fff;
            z-index: 10;
          }

          /* DESIGN: MODERN OBSIDIAN */
          .design-modern .photo-frame { border: 4px solid #000; background: #f8fafc; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
          .design-modern .photo-inner { border: 1px dashed #ccc; }
          .design-modern .photo-number { bottom: -8px; right: -8px; background: #000; color: #fff; border-radius: 50%; }
          .design-modern .student-name { font-size: 9pt; font-weight: 900; text-transform: uppercase; margin-top: 5px; }
          .design-modern .pin { display: none; }

          /* DESIGN: CLASSIC ROYAL */
          .design-classic .photo-frame { border: 6px double #1e3a8a; background: #fff; border-radius: 4px; }
          .design-classic .photo-inner { border: 1px solid #1e3a8a; }
          .design-classic .photo-number { top: -10px; left: -10px; background: #1e3a8a; color: #fff; border-radius: 4px; }
          .design-classic .student-name { font-family: 'Times New Roman', serif; font-size: 10pt; font-weight: bold; border-bottom: 1px solid #eee; pb: 2px; }
          .design-classic .pin { display: none; }

          /* DESIGN: ELEGANT GOLD */
          .design-elegant .photo-frame { border: 2px solid #b45309; background: #fffbeb; padding: 3mm; border-radius: 0; position: relative; }
          .design-elegant .photo-frame::after { content: ''; position: absolute; inset: 4px; border: 1px solid #b45309; opacity: 0.5; }
          .design-elegant .photo-number { bottom: 5px; right: 5px; background: #b45309; color: #fff; border: none; font-size: 7pt; width: 18px; height: 18px; }
          .design-elegant .student-name { font-family: 'Georgia', serif; color: #b45309; font-style: italic; font-weight: bold; }
          .design-elegant .pin { display: none; }

          /* DESIGN: MINIMALIST AIR */
          .design-minimalist .photo-frame { border: none; background: transparent; padding: 0; width: 36mm; height: 48mm; }
          .design-minimalist .photo-inner { border-radius: 20px; border: 2px solid #f1f5f9; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
          .design-minimalist .photo-number { display: none; }
          .design-minimalist .student-name { font-size: 8pt; font-weight: bold; color: #64748b; margin-top: 10px; }
          .design-minimalist .pin { display: none; }

          /* DESIGN: VINTAGE SEPIA (MADING STYLE) */
          .design-vintage .photo-frame { 
            border: none; background: #fff; padding: 2mm 2mm 12mm 2mm; 
            border-radius: 0; box-shadow: 2px 5px 15px rgba(0,0,0,0.15); 
            width: 42mm; height: 58mm; position: relative;
            transform: rotate(-2deg);
          }
          .design-vintage:nth-child(even) .photo-frame { transform: rotate(2deg); }
          .design-vintage .photo-inner { border: 1px solid #eee; filter: sepia(0.3) contrast(1.1); }
          .design-vintage .photo-number { display: none; }
          
          .design-vintage .student-info { 
            margin-top: -11mm; position: relative; z-index: 10; 
            padding: 0 4mm; width: 42mm; box-sizing: border-box;
          }
          .design-vintage .student-name { 
            font-family: 'Courier New', monospace; font-size: 7.5pt; font-weight: bold; 
            color: #3e2723; margin: 0; line-height: 1.1;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            width: 100%; display: block;
          }
          .design-vintage .student-nisn { 
            font-family: 'Courier New', monospace; font-size: 6pt; font-weight: bold; 
            color: #795548; margin-top: 1px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            width: 100%; display: block;
          }
          
          .design-vintage .pin { 
            display: block; position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
            width: 12px; height: 12px; background: #f43f5e; border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3); border: 2px solid #fff;
          }

          /* DESIGN: AURORA NIGHT */
          .design-aurora .photo-frame { border: 2px solid #6366f1; background: #0f172a; padding: 2mm; border-radius: 12px; box-shadow: 0 0 15px rgba(99,102,241,0.3); }
          .design-aurora .photo-inner { border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
          .design-aurora .photo-number { bottom: -5px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; border: none; border-radius: 10px; padding: 0 8px; width: auto; height: 18px; font-size: 7pt; }
          .design-aurora .student-name { 
            color: #fff; background: rgba(99,102,241,0.4); padding: 4px 10px; 
            border-radius: 6px; font-size: 9pt; font-weight: 800; margin-top: 8px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15);
          }
          .design-aurora .pin { display: none; }

          /* DESIGN: CYBER NEON */
          .design-cyber .photo-frame { border: 2px solid #06b6d4; background: #000; padding: 1mm; clip-path: polygon(0% 0%, 100% 0%, 100% 90%, 90% 100%, 0% 100%); }
          .design-cyber .photo-inner { border: 1px solid #ec4899; }
          .design-cyber .photo-number { top: 0; left: 0; background: #ec4899; color: #000; font-weight: 900; border: none; width: 20px; height: 20px; }
          .design-cyber .student-name { color: #06b6d4; text-shadow: 0 0 5px #06b6d4; font-family: 'Orbitron', sans-serif; font-size: 8pt; font-weight: 900; letter-spacing: 1px; }
          .design-cyber .pin { display: none; }

          /* DESIGN: NATURE ZEN */
          .design-nature .photo-frame { border: none; background: #f0fdf4; padding: 3mm; border-radius: 30px 5px 30px 5px; border: 2px solid #bbf7d0; }
          .design-nature .photo-inner { border-radius: 25px 4px 25px 4px; }
          .design-nature .photo-number { display: none; }
          .design-nature .student-name { color: #166534; font-size: 9pt; font-weight: bold; letter-spacing: -0.5px; }
          .design-nature .pin { display: none; }

          .photo-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; color: #ccc; }
          .photo-placeholder span { font-size: 7pt; font-weight: bold; margin-top: 5px; }

          .student-info { width: 100%; margin-top: 5px; }
          .student-nisn { font-size: 7.5pt; font-weight: bold; color: #999; font-family: monospace; }

          @media print { 
            .no-print { display: none; }
            * { -webkit-print-color-adjust: exact !important; }
          }

          .btn-print { 
            position: fixed; top: 20px; right: 20px; 
            padding: 12px 24px; background: #7c3aed; color: #fff; 
            border: none; border-radius: 50px; font-weight: bold; 
            cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); 
            z-index: 1000;
          }
        </style>
      </head>
      <body>
        <button class="btn-print no-print" onclick="window.print()">🖨️ CETAK SEKARANG</button>
        <div class="container">
          <div class="header">
            <h1>ALBUM KELULUSAN SISWA</h1>
            <h2>SD NEGERI 02 CIBADAK</h2>
            <p>${angkatan} • TAHUN PELAJARAN ${tahunPelajaran}</p>
          </div>
          <div class="grid">${albumHTML}</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredSiswa = dataSiswa
    .filter((s) => {
      const matchKelas = selectedKelas.has(s.kelas || "");
      const matchSearch = searchQuery === "" || (s.nama || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchKelas && matchSearch;
    })
    .sort((a, b) => {
      const kelasA = a.kelas || "";
      const kelasB = b.kelas || "";
      if (kelasA !== kelasB) return kelasA.localeCompare(kelasB);
      return (a.nama || "").localeCompare(b.nama || "");
    });

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-4xl mx-auto pb-10">
      <UtilityHeader
        icon={Images}
        title="Album Lulusan"
        subtitle="Pusat Cetak & Utility • Kenangan Digital Lulusan"
        accentColor="violet"
        actionLabel="Cetak Album"
        actionIcon={Printer}
        onAction={() => handlePrint()}
        actionDisabled={filteredSiswa.length === 0}
      />

      {/* Pemilihan Kelas */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="card p-6">
        <h2 className="text-sm font-bold text-slate-300 mb-5 uppercase tracking-wider flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <Grid3X3 className="w-3.5 h-3.5 text-violet-400" />
          </div>
          Pilih Kelas
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
          {KUMPULAN_KELAS.filter(k => k.startsWith("VI") || k.startsWith("6")).map((k) => {
            const count = dataSiswa.filter(s => s.kelas === k).length;
            return (
              <button
                key={k}
                onClick={() => toggleKelas(k)}
                className={`relative flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-center transition-all ${
                  selectedKelas.has(k)
                    ? "bg-violet-500/10 border-violet-500 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.15)]" 
                    : "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:bg-white/[0.04] hover:border-white/10"
                }`}
              >
                <span className="font-black text-xs uppercase">{k}</span>
                <span className={`text-[9px] mt-1 font-bold px-1.5 py-0.5 rounded-full ${selectedKelas.has(k) ? "bg-violet-500/20 text-violet-400" : "bg-black/40 text-slate-500"}`}>
                  {count} Siswa
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Pilihan Desain Frame */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="card p-6 space-y-6">
        <h2 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <Layout className="w-3.5 h-3.5 text-amber-400" />
          </div>
          Pilih Desain Frame
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {FRAME_DESIGNS.map((design) => (
            <button
              key={design.id}
              onClick={() => setSelectedDesign(design.id)}
              className={`relative p-4 rounded-2xl border text-left transition-all group ${
                selectedDesign === design.id 
                  ? "bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]" 
                  : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/10"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedDesign === design.id ? "bg-amber-500 text-white" : "bg-white/5 text-slate-500"}`}>
                  <design.icon className="w-5 h-5" />
                </div>
                {selectedDesign === design.id && (
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <div className="space-y-1">
                <div className={`text-xs font-black uppercase tracking-wider ${selectedDesign === design.id ? "text-amber-400" : "text-slate-300"}`}>
                  {design.name}
                </div>
                <div className="text-[9px] text-slate-500 font-bold leading-relaxed line-clamp-2 uppercase opacity-60">
                  {design.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Pengaturan & Search */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tahun Kelulusan / TP</label>
            <input type="text" value={tahunPelajaran} onChange={(e) => setTahunPelajaran(e.target.value)}
              placeholder="Contoh: 2025/2026" className="input-obsidian" />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Angkatan Ke-</label>
            <input type="text" value={angkatan} onChange={(e) => setAngkatan(e.target.value)}
              placeholder="Contoh: Angkatan 15" className="input-obsidian" />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Cari Nama Siswa</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama..." 
                className="input-obsidian pl-11" 
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-start gap-3 p-4 bg-violet-500/5 rounded-xl border border-violet-500/10">
          <Info className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Sistem akan menyusun grid foto otomatis. Terdapat <b>{filteredSiswa.length}</b> siswa yang siap dicetak dari filter yang dipilih. Pastikan NISN di data induk benar agar foto siswa dapat ditarik otomatis.
          </p>
        </div>
      </motion.div>

      {/* Action Button Massal */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <button onClick={() => handlePrint()} disabled={filteredSiswa.length === 0}
          className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5">
          <Printer className="w-4 h-4" />
          Cetak Album Kenangan {filteredSiswa.length > 0 ? `(${filteredSiswa.length} Siswa)` : ""}
        </button>
      </motion.div>

      {/* Preview Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-400" />
            Daftar Siswa ({filteredSiswa.length})
          </h2>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scroll">
          <table className="w-full text-xs text-left">
            <thead className="sticky top-0 bg-[#0f111a] z-10 border-b border-white/10">
              <tr>
                <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-widest w-16 text-center">No</th>
                <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-widest">Siswa</th>
                <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-widest text-center">Preview Foto</th>
                <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-widest text-center">Kelas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {selectedKelas.size === 0 && searchQuery === "" ? (
                <tr>
                  <td colSpan={4} className="px-5 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <Grid3X3 className="w-8 h-8 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-[0.2em]">Silakan pilih kelas terlebih dahulu</p>
                    </div>
                  </td>
                </tr>
              ) : filteredSiswa.length > 0 ? (
                filteredSiswa.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-4 text-center font-bold text-slate-600">{idx + 1}</td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-200 uppercase group-hover:text-violet-400 transition-colors">{s.nama}</div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">NISN: {s.nisn || "-"}</div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className={`relative w-12 h-16 mx-auto overflow-hidden flex items-center justify-center transition-all duration-500 ${
                        selectedDesign === 'modern' ? 'border-2 border-slate-900 bg-slate-50' :
                        selectedDesign === 'classic' ? 'border-[3px] border-blue-900 bg-white rounded-sm' :
                        selectedDesign === 'elegant' ? 'border border-amber-600 bg-amber-50 p-0.5' :
                        selectedDesign === 'minimalist' ? 'border-none rounded-xl shadow-md bg-white' :
                        selectedDesign === 'vintage' ? 'border-[4px] border-[#5d4037] bg-[#efebe9]' :
                        selectedDesign === 'aurora' ? 'border-2 border-indigo-500 bg-[#0f172a] rounded-lg shadow-[0_0_10px_rgba(99,102,241,0.3)]' :
                        selectedDesign === 'cyber' ? 'border-2 border-cyan-400 bg-black' :
                        'border-2 border-emerald-200 bg-[#f0fdf4] rounded-[15px_4px_15px_4px]'
                      }`}>
                        <Image
                          src={`/api/foto-siswa/${s.nisn}`}
                          alt=""
                          width={48}
                          height={64}
                          className="w-full h-full object-cover"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                          unoptimized
                        />
                        <Users className="w-4 h-4 text-slate-700 absolute" style={{ zIndex: -1 }} />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-slate-400 border border-white/10 uppercase">
                        {s.kelas}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-500 font-bold italic">
                    Tidak ada data siswa yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}



