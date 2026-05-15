"use client";

import { useState } from "react";

import { motion } from "framer-motion";

import { FolderOpen, Printer, Info, Layers, Grid3X3 } from "lucide-react";

import UtilityHeader from "./UtilityHeader";

import { useAppStore } from "@/store/app.store";
import { useSiswa } from "@/hooks/useSiswa";
import { useSchoolConfig } from "@/hooks/useSchoolConfig";

export default function LabelMapArsip() {
  const { data: dataSiswa = [] } = useSiswa();
  const { pengaturan } = useAppStore();
  const config = useSchoolConfig();

  const KUMPULAN_KELAS = Array.from(new Set(dataSiswa.map((s) => s.kelas)))
    .filter((k): k is string => !!k)
    .sort();

  const [selectedKelas, setSelectedKelas] = useState<Set<string>>(new Set());

  const [tahunPelajaran, setTahunPelajaran] = useState(
    pengaturan?.tahun_ajaran || "2025/2026",
  );

  const handlePrint = () => {
    if (filteredSiswa.length === 0) return;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Popup blocked! Please allow popups for this site.");

      return;
    }

    const cardsHTML = filteredSiswa
      .map(
        (s, i) => `

      <div style="

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

      ">

        <div style="position: absolute; top: 0; left: 0; right: 0; height: 16px; background: #0f172a;"></div>

        <h3 style="font-weight: 900; color: #0f172a; font-size: 16px; text-transform: uppercase; letter-spacing: 0.3em; margin-top: 8px; margin-bottom: 4px;">ARSIP BERKAS SISWA</h3>

        <div style="font-size: 10px; font-weight: 900; color: #64748b; letter-spacing: 0.2em; margin-bottom: 24px; text-transform: uppercase;">${config.namaSekolah}</div>

        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;">

          <div style="font-size: 20px; font-weight: 900; color: #0f172a; line-height: 1.2; text-transform: uppercase; letter-spacing: -0.02em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${s.nama || "-"}</div>

          <div style="font-size: 14px; font-weight: 900; color: #475569;">NISN: ${s.nisn || "-"} / NIS: ${s.nis || "-"}</div>

          <div style="font-size: 18px; font-weight: 900; color: white; background: #0f172a; padding: 6px 24px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); margin-top: 4px;">KELAS ${s.kelas || "-"}</div>

        </div>

        <div style="margin-top: 32px; padding-top: 16px; border-top: 3px solid #0f172a; display: flex; justify-content: space-between; font-size: 12px; font-weight: 900; color: #475569; text-transform: uppercase; letter-spacing: 0.2em;">

          <span>TAHUN: ${tahunPelajaran}</span>

          <span style="background: #f1f5f9; padding: 4px 12px; border-radius: 6px;">AKTIF</span>

        </div>

      </div>

    `,
      )
      .join("");

    printWindow.document.write(`

      <html>

      <head>

        <title>Label Map Arsip</title>

        <style>

          @page { size: A4; margin: 10mm; }

          .btn-print { position: fixed; top: 20px; right: 20px; padding: 15px 30px; background: #000; color: #fff; border: none; border-radius: 50px; font-weight: bold; cursor: pointer; z-index: 999; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }

          @media print { .no-print { display: none !important; } }

          @media screen { body { zoom: 0.6; } }

          body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background: white !important; }

          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; padding: 32px; }

        </style>

      </head>

      <body>

        <button class="btn-print no-print" onclick="window.print()">🖨️ CETAK SEKARANG</button>

        <div class="grid">${cardsHTML}</div>

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

      {/* Pemilihan Kelas */}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
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

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            Tahun Pelajaran / Tahun
          </label>

          <input
            type="text"
            value={tahunPelajaran}
            onChange={(e) => setTahunPelajaran(e.target.value)}
            placeholder="Contoh: 2025/2026"
            className="input-obsidian"
          />
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
