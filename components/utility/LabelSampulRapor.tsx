"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookMarked,
  Printer,
  Info,
  Users,
  Grid3X3,
  Search,
} from "lucide-react";
import UtilityHeader from "./UtilityHeader";
import { useAppStore } from "@/store/app.store";
import { useSiswa } from "@/hooks/useSiswa";
import { useSchoolConfig } from "@/hooks/useSchoolConfig";

export default function LabelSampulRapor() {
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
  const [searchQuery, setSearchQuery] = useState("");

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

  const LOGO_SEKOLAH_URL =
    pengaturan?.logo_url ||
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiic6USPGMyGFvLp9UWnNTTH-3KcNC8JjSO244ccIHaLvZYNWqQ-wTxeXc-pGnTVqwoGu9ke2HqNZNy9gggjlsZtU_WEdtBM7Bo0p2PcTK8-hrkLs4xB2gpgnFT86b9oopqT-AWz2Pd-aKzWkOZnmOE8uWP-LHMDlJ3YtLZ1ZU-QLgLdl3dD4Vwce0Ylx1A/s166/sdn2cbd%20small.png";

  const handlePrint = (targetSiswa?: any) => {
    const listToPrint = targetSiswa ? [targetSiswa] : filteredSiswa;

    if (listToPrint.length === 0) {
      alert("Tidak ada data untuk dicetak!");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocked! Please allow popups for this site.");
      return;
    }

    const labelsHTML = listToPrint
      .map(
        (s) => `
      <div class="label-box">
        <img src="${LOGO_SEKOLAH_URL}" class="watermark-bg" />
        <div class="content-wrapper">
          <div class="school-name">${config.namaSekolah}</div>
          <div class="label-title">PESERTA DIDIK</div>
          <div class="student-name">${s.nama || "-"}</div>
          <div class="student-ids">NIS / NISN: ${s.nis || "-"} / ${s.nisn || "-"}</div>
        </div>
      </div>
    `,
      )
      .join("");

    printWindow.document.write(`
      <html>
      <head>
        <title>Cetak Label Sampul Rapor</title>
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background: #fff; }
          .container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10mm 5mm;
            padding: 5mm;
            justify-items: center;
          }

          .label-box {
            width: 90mm; height: 43mm;
            border: 1px dashed #bbb; display: flex;
            justify-content: center; align-items: center; text-align: center;
            page-break-inside: avoid; position: relative; overflow: hidden;
            background: #fff; box-sizing: border-box;
          }

          .watermark-bg {
            position: absolute;
            right: -12mm; bottom: -12mm;
            width: 65mm; opacity: 0.12;
            transform: rotate(-15deg);
            filter: grayscale(100%);
            z-index: 0;
          }

          .content-wrapper { position: relative; z-index: 1; width: 100%; display: flex; flex-direction: column; height: 100%; justify-content: center; }
          .school-name { font-size: 9pt; font-weight: bold; color: #444; margin: 0; padding: 0; }
          .label-title { font-size: 9pt; letter-spacing: 2px; font-weight: bold; margin: 0.5mm 0 0 0; padding: 0; }

          .student-name {
            font-size: 14pt; font-weight: 900; text-transform: uppercase;
            border-top: 1.5pt solid #000; border-bottom: 1.5pt solid #000;
            padding: 1mm 4mm; margin: 1.5mm auto; width: 90%;
            max-height: 14mm; overflow: hidden;
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
            word-break: break-word; line-height: 1.2;
          }
          .student-ids { font-size: 10pt; font-weight: bold; margin: 0.5mm 0 0 0; padding: 0; }

          @media print {
            .no-print { display: none; }
            .label-box { border: 1px dashed #ccc; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }

          .btn-print {
            position: fixed; top: 20px; right: 20px;
            padding: 12px 24px; background: #e11d48; color: #fff;
            border: none; border-radius: 50px; font-weight: bold;
            cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 999;
          }
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

  const handleSinglePrint = (siswa: any) => {
    handlePrint(siswa);
  };

  const filteredSiswa = dataSiswa
    .filter((s) => {
      const matchKelas =
        selectedKelas.size === 0 || selectedKelas.has(s.kelas || "");
      const matchSearch =
        searchQuery === "" ||
        (s.nama || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.nisn || "").includes(searchQuery);
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
        icon={BookMarked}
        title="Label Sampul Rapor"
        subtitle="Pusat Cetak & Utility • Kurikulum Merdeka"
        accentColor="rose"
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
          <div className="w-6 h-6 rounded-lg bg-rose-500/15 flex items-center justify-center">
            <Grid3X3 className="w-3.5 h-3.5 text-rose-400" />
          </div>
          Pilih Kelas
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
          {KUMPULAN_KELAS.map((k) => {
            const count = dataSiswa.filter((s) => s.kelas === k).length;
            return (
              <button
                key={k}
                onClick={() => toggleKelas(k)}
                className={`relative flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-center transition-all ${
                  selectedKelas.has(k)
                    ? "bg-rose-500/10 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                    : "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:bg-white/[0.04] hover:border-white/10"
                }`}
              >
                <span className="font-black text-xs uppercase">{k}</span>
                <span
                  className={`text-[9px] mt-1 font-bold px-1.5 py-0.5 rounded-full ${selectedKelas.has(k) ? "bg-rose-500/20 text-rose-400" : "bg-black/40 text-slate-500"}`}
                >
                  {count} Siswa
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Konfigurasi & Search */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6 space-y-6"
      >
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              Tahun Masuk / TP Awal
            </label>
            <input
              type="text"
              value={tahunPelajaran}
              onChange={(e) => setTahunPelajaran(e.target.value)}
              placeholder="Contoh: 2025/2026"
              className="input-obsidian"
            />
          </div>
          <div className="flex-[2]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              Cari Nama Siswa
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama atau NISN..."
                className="input-obsidian pl-11"
              />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-rose-500/5 rounded-xl border border-rose-500/10">
          <Info className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Tempel label ini pada jendela plastik (window) di bagian depan
            Map/Sampul Rapor siswa. Terdapat <b>{filteredSiswa.length}</b> siswa
            yang siap dicetak dari filter yang dipilih.
          </p>
        </div>
      </motion.div>

      {/* Action Button Massal */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <button
          onClick={() => handlePrint()}
          disabled={filteredSiswa.length === 0}
          className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-rose-500/20 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
        >
          <Printer className="w-4 h-4" />
          Cetak Massal{" "}
          {filteredSiswa.length > 0 ? `(${filteredSiswa.length} Label)` : ""}
        </button>
      </motion.div>

      {/* Daftar Siswa Table - Sesuai Fitur siswa.xml */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-0 overflow-hidden"
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-400" />
            Daftar Siswa ({filteredSiswa.length})
          </h2>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scroll">
          <table className="w-full text-xs text-left">
            <thead className="sticky top-0 bg-[#0f111a] z-10 border-b border-white/10">
              <tr>
                <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-widest w-16 text-center">
                  No
                </th>
                <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-widest">
                  Nama Lengkap
                </th>
                <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-widest text-center">
                  Identitas
                </th>
                <th className="px-5 py-3 font-bold text-slate-500 uppercase tracking-widest text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {selectedKelas.size === 0 && searchQuery === "" ? (
                <tr>
                  <td colSpan={4} className="px-5 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <Grid3X3 className="w-8 h-8 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-[0.2em]">
                        Silakan pilih kelas terlebih dahulu
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredSiswa.length > 0 ? (
                filteredSiswa.map((s, idx) => (
                  <tr
                    key={s.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-5 py-4 text-center font-bold text-slate-600">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-200 uppercase group-hover:text-rose-400 transition-colors">
                        {s.nama}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                        KELAS {s.kelas}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-slate-400 border border-white/10 uppercase">
                        NISN: {s.nisn || "-"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleSinglePrint(s)}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg text-[10px] font-black transition-all border border-rose-500/20 flex items-center gap-1.5 ml-auto"
                      >
                        <Printer className="w-3 h-3" /> CETAK
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-slate-500 font-bold italic"
                  >
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
