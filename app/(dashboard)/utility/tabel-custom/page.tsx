"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Printer, 
  Plus, 
  Trash2, 
  LayoutGrid,
  Settings2,
  Users,
  PenTool,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/app.store";
import { uiSound } from "@/lib/audio";
import UtilityHeader from "@/components/utility/UtilityHeader";

interface CustomColumn {
  id: string;
  name: string;
}

export default function BlankoTabelPage() {
  const { dataSiswa, dataKelas, dataGuru, pengaturan } = useAppStore();
  
  const [sumberData, setSumberData] = useState<"siswa" | "guru">("siswa");
  const [selectedKelas, setSelectedKelas] = useState<string>("");
  const [selectedGuruIds, setSelectedGuruIds] = useState<Set<string>>(new Set());
  
  const [judul, setJudul] = useState<string>("DAFTAR HADIR / NILAI SISWA");
  const [subJudul, setSubJudul] = useState<string>("");
  
  const [ttdJabatan, setTtdJabatan] = useState<string>("Wali Kelas");
  const [ttdNama, setTtdNama] = useState<string>("");
  const [ttdNip, setTtdNip] = useState<string>("");
  
  const [customCols, setCustomCols] = useState<CustomColumn[]>([
    { id: "col-1", name: "Tugas 1" },
    { id: "col-2", name: "Tugas 2" },
    { id: "col-3", name: "Ket" },
  ]);
  
  const [newColName, setNewColName] = useState("");

  const kelasOptions = useMemo(() => {
    return dataKelas.map((k) => k.nama_kelas).sort();
  }, [dataKelas]);

  const siswaList = useMemo(() => {
    if (!selectedKelas) return [];
    return dataSiswa
      .filter((s) => s.kelas === selectedKelas)
      .sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
  }, [dataSiswa, selectedKelas]);

  useEffect(() => {
    if (dataGuru.length > 0 && selectedGuruIds.size === 0) {
      setSelectedGuruIds(new Set(dataGuru.map(g => g.id)));
    }
  }, [dataGuru]);

  const guruList = useMemo(() => {
    return dataGuru
      .filter((g) => selectedGuruIds.has(g.id))
      .sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
  }, [dataGuru, selectedGuruIds]);

  const hasDataToPrint = sumberData === "siswa" ? siswaList.length > 0 : guruList.length > 0;

  const addColumn = () => {
    if (!newColName.trim()) return;
    uiSound.playClick();
    setCustomCols([...customCols, { id: Date.now().toString(), name: newColName.trim() }]);
    setNewColName("");
  };

  const removeColumn = (id: string) => {
    uiSound.playClick();
    setCustomCols(customCols.filter((c) => c.id !== id));
  };

  const handlePrint = () => {
    if (!hasDataToPrint) return;
    uiSound.playClick();

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocked! Please allow popups for this site.");
      return;
    }

    const kopHtml = pengaturan?.kop_surat_url ? `
      <img src="${pengaturan.kop_surat_url}" alt="Kop Surat" style="width: 100%; margin-bottom: 24px;" />
    ` : `
      <div style="display: flex; align-items: center; gap: 16px; border-bottom: 3px solid black; padding-bottom: 16px; margin-bottom: 24px;">
        ${pengaturan?.logo_url ? `<img src="${pengaturan.logo_url}" alt="Logo" style="width: 80px; height: 80px; object-fit: contain;" />` : ''}
        <div style="flex: 1; text-align: center;">
          <h1 style="font-size: 24px; font-weight: bold; text-transform: uppercase; margin: 0; letter-spacing: 1px;">${pengaturan?.nama_sekolah || "NAMA SEKOLAH"}</h1>
          ${pengaturan?.alamat_sekolah ? `<p style="font-size: 14px; margin: 4px 0 0 0;">${pengaturan.alamat_sekolah}</p>` : ''}
        </div>
        ${pengaturan?.logo_url ? `<div style="width: 80px;"></div>` : ''}
      </div>
    `;

    const ths = customCols.map(c => `<th style="border: 1px solid black; padding: 8px; text-align: center;">${c.name}</th>`).join("");
    
    let trs = "";
    if (sumberData === "siswa") {
      trs = siswaList.map((s, i) => `
        <tr>
          <td style="border: 1px solid black; padding: 8px; text-align: center;">${i + 1}</td>
          <td style="border: 1px solid black; padding: 8px; text-align: left; white-space: nowrap;">${s.nisn || s.nis || "-"}</td>
          <td style="border: 1px solid black; padding: 8px; font-weight: 500;">${s.nama || "-"}</td>
          ${customCols.map(() => `<td style="border: 1px solid black; padding: 8px;"></td>`).join("")}
        </tr>
      `).join("");
    } else {
      trs = guruList.map((g, i) => `
        <tr>
          <td style="border: 1px solid black; padding: 8px; text-align: center;">${i + 1}</td>
          <td style="border: 1px solid black; padding: 8px; text-align: left; white-space: nowrap;">${g.nip || "-"}</td>
          <td style="border: 1px solid black; padding: 8px; font-weight: 500;">${g.nama || "-"}</td>
          ${customCols.map(() => `<td style="border: 1px solid black; padding: 8px;"></td>`).join("")}
        </tr>
      `).join("");
    }

    const col2Header = sumberData === "siswa" ? "NIS/NISN" : "NIP/NUPTK";
    const col3Header = sumberData === "siswa" ? "Nama Peserta Didik" : "Nama Guru / Pegawai";

    printWindow.document.write(`
      <html>
        <head>
          <title>${judul || "Blanko Tabel"}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Times New Roman', serif; margin: 0; padding: 0; background: white !important; color: black; }
            .btn-print { position: fixed; top: 20px; right: 20px; padding: 15px 30px; background: #000; color: #fff; border: none; border-radius: 50px; font-weight: bold; cursor: pointer; z-index: 999; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
            @media print { .no-print { display: none !important; } }
            @media screen { body { background: #f0f0f0 !important; } .preview-container { margin: 40px auto !important; padding: 40px !important; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 8px; } }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #f3f4f6; }
            tr:nth-child(even) { background: #fafafa; }
            @media print { th { background: transparent !important; } tr:nth-child(even) { background: transparent !important; } }
          </style>
        </head>
        <body>
          <button class="btn-print no-print" onclick="window.print()">ðŸ–¨ï¸ CETAK SEKARANG</button>
          <div class="preview-container" style="max-width: 210mm; background: white;">
            ${kopHtml}
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="font-size: 20px; font-weight: bold; text-transform: uppercase; margin: 0;">${judul}</h2>
              ${subJudul ? `<h3 style="font-size: 16px; font-weight: 600; margin: 4px 0 0 0;">${subJudul}</h3>` : ''}
            </div>
            <table>
              <thead>
                <tr>
                  <th style="border: 1px solid black; padding: 8px; width: 40px; text-align: center;">No</th>
                  <th style="border: 1px solid black; padding: 8px; text-align: left; width: 100px;">${col2Header}</th>
                  <th style="border: 1px solid black; padding: 8px; text-align: left;">${col3Header}</th>
                  ${ths}
                </tr>
              </thead>
              <tbody>
                ${trs}
              </tbody>
            </table>
            <div style="margin-top: 48px; display: flex; justify-content: flex-end; page-break-inside: avoid;">
              <div style="text-align: center; width: 250px;">
                <p style="margin: 0 0 4px 0;">....................., ..........................</p>
                <p style="margin: 0 0 80px 0; font-weight: 600;">${ttdJabatan || "Guru Kelas"}</p>
                <p style="margin: 0; font-weight: bold; text-decoration: underline; text-transform: uppercase;">${ttdNama || "_________________________"}</p>
                <p style="margin: 0;">NIP. ${ttdNip || "_________________"}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-4xl mx-auto pb-10">
      <UtilityHeader
        icon={LayoutGrid}
        title="Blanko Tabel Dinamis"
        subtitle="Pusat Cetak & Utility â€¢ Generator Format Cetak Kosong"
        accentColor="violet"
        actionLabel={hasDataToPrint ? "Cetak Format Tabel" : undefined}
        actionIcon={Printer}
        onAction={handlePrint}
        actionDisabled={!hasDataToPrint}
      />

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            setSumberData('siswa');
            setJudul("DAFTAR HADIR / NILAI SISWA");
          }}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
            sumberData === 'siswa'
              ? 'border-violet-500/60 bg-violet-500/10 shadow-[0_0_20px_rgba(124,58,237,0.15)]'
              : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
          }`}
        >
          <Users className={`w-6 h-6 ${sumberData === 'siswa' ? 'text-violet-400' : 'text-white/30'}`} />
          <span className={`text-[13px] font-bold uppercase tracking-widest ${
            sumberData === 'siswa' ? 'text-violet-300' : 'text-white/30'
          }`}>Data Siswa</span>
          <span className={`text-[10px] ${sumberData === 'siswa' ? 'text-violet-400/60' : 'text-white/20'}`}>Peserta didik per kelas</span>
        </button>
        <button
          onClick={() => {
            setSumberData('guru');
            setJudul("DAFTAR HADIR GURU");
            setSubJudul("");
            setTtdJabatan("Kepala Sekolah");
            setTtdNama(pengaturan?.nama_kepsek || "");
            setTtdNip(pengaturan?.nip_kepsek || "");
          }}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
            sumberData === 'guru'
              ? 'border-violet-500/60 bg-violet-500/10 shadow-[0_0_20px_rgba(124,58,237,0.15)]'
              : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
          }`}
        >
          <Users className={`w-6 h-6 ${sumberData === 'guru' ? 'text-violet-400' : 'text-white/30'}`} />
          <span className={`text-[13px] font-bold uppercase tracking-widest ${
            sumberData === 'guru' ? 'text-violet-300' : 'text-white/30'
          }`}>Data Guru</span>
          <span className={`text-[10px] ${sumberData === 'guru' ? 'text-violet-400/60' : 'text-white/20'}`}>GTK & Tenaga Pendidik</span>
        </button>
      </div>

      {/* Pemilihan Guru (Khusus Mode Guru) */}
      <AnimatePresence mode="popLayout">
        {sumberData === "guru" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-violet-400" />
                </div>
                Pemilihan Guru (Sumber Data)
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedGuruIds(new Set(dataGuru.map(g => g.id)))}
                  className="text-xs font-bold bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Pilih Semua
                </button>
                <button
                  onClick={() => setSelectedGuruIds(new Set())}
                  className="text-xs font-bold bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {dataGuru.map((g) => {
                const isSelected = selectedGuruIds.has(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      const next = new Set(selectedGuruIds);
                      if (isSelected) next.delete(g.id);
                      else next.add(g.id);
                      setSelectedGuruIds(next);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-violet-500/10 border-violet-500/50 text-violet-400 shadow-[0_0_15px_rgba(124,58,237,0.1)]"
                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "border-violet-500 bg-violet-500" : "border-white/20 bg-black/20"}`}>
                      {isSelected && <Check size={12} className="text-black" strokeWidth={3} />}
                    </div>
                    <span className="text-[11px] font-medium truncate leading-tight">{g.nama}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Identitas Format */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card p-6"
      >
        <h2 className="text-sm font-bold text-slate-300 mb-5 uppercase tracking-wider flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <Settings2 className="w-3.5 h-3.5 text-violet-400" />
          </div>
          Identitas Format
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sumberData === "siswa" && (
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Pilih Kelas</label>
              <select
                value={selectedKelas}
                onChange={(e) => {
                  setSelectedKelas(e.target.value);
                  setSubJudul(`Kelas: ${e.target.value}`);
                }}
                className="input-obsidian appearance-none w-full cursor-pointer"
              >
                <option value="">-- Pilih Kelas --</option>
                {kelasOptions.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className={sumberData === "guru" ? "md:col-span-1" : ""}>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Judul Utama</label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Misal: DAFTAR NILAI"
              className="input-obsidian w-full"
            />
          </div>

          <div className={sumberData === "guru" ? "md:col-span-1" : "md:col-span-2"}>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Sub Judul (Opsional)</label>
            <input
              type="text"
              value={subJudul}
              onChange={(e) => setSubJudul(e.target.value)}
              placeholder={sumberData === "siswa" ? "Misal: Kelas X-1 Semester Ganjil" : "Misal: Tahun Ajaran 2025/2026"}
              className="input-obsidian w-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Kolom Tambahan */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <h2 className="text-sm font-bold text-slate-300 mb-5 uppercase tracking-wider flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <LayoutGrid className="w-3.5 h-3.5 text-violet-400" />
          </div>
          Kolom Tambahan (No, {sumberData === "siswa" ? "NISN, Nama" : "NIP, Nama"} otomatis ada)
        </h2>

        <div className="flex flex-wrap gap-2 mb-4">
          <AnimatePresence>
            {customCols.map((col) => (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full pl-4 pr-1 py-1"
              >
                <span className="text-xs font-bold text-white">{col.name}</span>
                <button
                  onClick={() => removeColumn(col.id)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-red-500 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 max-w-sm">
          <input
            type="text"
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addColumn()}
            placeholder="Tambah kolom baru..."
            className="input-obsidian flex-1 !rounded-full"
          />
          <button
            onClick={addColumn}
            disabled={!newColName.trim()}
            className="w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shadow-lg shadow-violet-500/20"
          >
            <Plus size={18} />
          </button>
        </div>
      </motion.div>

      {/* Tanda Tangan */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card p-6"
      >
        <h2 className="text-sm font-bold text-slate-300 mb-5 uppercase tracking-wider flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <PenTool className="w-3.5 h-3.5 text-violet-400" />
          </div>
          Pengaturan Tanda Tangan
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sumberData === "siswa" && (
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Pilih Guru (Auto Fill)</label>
              <select
                onChange={(e) => {
                  if (!e.target.value) return;
                  if (e.target.value === "kepsek") {
                    setTtdJabatan("Kepala Sekolah");
                    setTtdNama(pengaturan?.nama_kepsek || "");
                    setTtdNip(pengaturan?.nip_kepsek || "");
                  } else {
                    const guru = dataGuru.find(g => g.id === e.target.value);
                    if (guru) {
                      setTtdNama(guru.nama);
                      setTtdNip(guru.nip || "");
                    }
                  }
                }}
                className="input-obsidian appearance-none w-full cursor-pointer"
              >
                <option value="">-- Pilih Guru --</option>
                <option value="kepsek">Kepala Sekolah ({pengaturan?.nama_kepsek || "Set di Pengaturan"})</option>
                {dataGuru.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nama} {g.nip ? `(NIP: ${g.nip})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Jabatan</label>
            <input
              type="text"
              value={ttdJabatan}
              onChange={(e) => setTtdJabatan(e.target.value)}
              placeholder="Misal: Wali Kelas"
              className="input-obsidian w-full"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">NIP</label>
            <input
              type="text"
              value={ttdNip}
              onChange={(e) => setTtdNip(e.target.value)}
              placeholder="NIP / NUPTK"
              className="input-obsidian w-full"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nama Penandatangan</label>
            <input
              type="text"
              value={ttdNama}
              onChange={(e) => setTtdNama(e.target.value)}
              placeholder="Nama Lengkap & Gelar"
              className="input-obsidian w-full"
            />
          </div>
        </div>
      </motion.div>

    </div>
  );
}
