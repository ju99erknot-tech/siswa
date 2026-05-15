"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Printer,
  Info,
  Shield,
  User,
  GraduationCap,
  IdCard,
  Users,
} from "lucide-react";
import UtilityHeader from "./UtilityHeader";
import { createClient } from "@/lib/supabase/client";
import { useSchoolConfig } from "@/hooks/useSchoolConfig";

interface Panitia {
  nama: string;
  jabatan: string;
  nip: string;
  fotoUrl?: string;
}

export default function IdCardPanitia() {
  const school = useSchoolConfig();
  const [panitiaList, setPanitiaList] = useState<Panitia[]>([]);
  const [rawInput, setRawInput] = useState("");
  const [namaUjian, setNamaUjian] = useState("ASESMEN SUMATIF");
  const [tahunPelajaran, setTahunPelajaran] = useState(school.tahunAjaran);
  const [jabatanDefault, setJabatanDefault] = useState("PANITIA");
  const [fotoGuruMap, setFotoGuruMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  // Load foto guru data dari Supabase
  useEffect(() => {
    loadFotoGuru();
  }, []);

  const loadFotoGuru = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("foto_guru")
        .select("nip, foto_url");

      if (error) {
        return;
      }

      const map: Record<string, string> = {};
      data?.forEach((item) => {
        if (item.nip && item.foto_url) {
          map[item.nip] = item.foto_url;
        }
      });

      setFotoGuruMap(map);
    } catch (error) {
      // Abaikan error jika table belum ada
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (panitiaList.length === 0) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print");
      return;
    }

    const cardsHTML = panitiaList
      .map((panitia, i) => {
        const roleColorClass = getRoleColorClass(panitia.jabatan);
        const roleColor =
          roleColorClass === "role-red"
            ? "#ef4444"
            : roleColorClass === "role-blue"
              ? "#3b82f6"
              : "#1e293b";

        return `
        <div style="width: 80mm; height: 110mm; border: 0.5px dashed #94a3b8; position: relative; background: #fff; page-break-inside: avoid; box-sizing: border-box; overflow: hidden; box-shadow: 0 0 0 1px rgba(0,0,0,0.05);">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 38mm; background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-bottom: 3px solid #047857; z-index: 1;"></div>

          <div style="position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; height: 100%;">
            <div style="text-align: center; color: #fff; width: 100%; padding-top: 3mm;">
              <img src="${school.logoUrl}" alt="Logo" style="width: 10mm; height: 10mm; margin-bottom: 1mm; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));" />
              <div style="font-size: 8pt; font-weight: 900; letter-spacing: 0.5px; line-height: 1;">${school.namaSekolah}</div>
              <div style="font-size: 5.5pt; font-weight: 600; opacity: 0.9; margin-top: 1mm; letter-spacing: 0.2px; text-transform: uppercase;">${namaUjian}</div>
            </div>

            <div style="width: 24mm; height: 32mm; background: #f8fafc; border: 2px solid #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.15); margin-top: 2.5mm; display: flex; align-items: center; justify-content: center; font-size: 7pt; color: #cbd5e1; font-weight: 800; text-align: center; line-height: 1.2; border-radius: 1mm; overflow: hidden;">
              ${
                panitia.fotoUrl
                  ? `<img src="${panitia.fotoUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="Foto" />`
                  : `<div style="font-size: 7pt; color: #cbd5e1; font-weight: 800; text-align: center; line-height: 1.2;">PAS FOTO<br />3 X 4</div>`
              }
            </div>

            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 90%; text-align: center; margin-bottom: 8mm;">
              <div style="font-size: 10pt; font-weight: 900; color: #0f172a; text-transform: uppercase; line-height: 1.1; margin-bottom: 2.5mm;">${panitia.nama}</div>
              <div style="padding: 1.5mm 4mm; border-radius: 50px; font-size: 6.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; background: ${roleColor}; color: #fff;">${panitia.jabatan}</div>
              ${panitia.nip ? `<div style="font-size: 6pt; margin-top: 1.5mm; font-weight: bold; color: #64748b;">NIP. ${panitia.nip}</div>` : ""}
            </div>
          </div>

          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: #f1f5f9; padding: 2mm 0 1.5mm 0; text-align: center; border-top: 1px solid #e2e8f0; z-index: 2;">
            <div style="font-size: 5.5pt; font-weight: 800; color: #64748b; letter-spacing: 0.5px;">TAHUN PELAJARAN ${tahunPelajaran}</div>
            <div style="font-family: 'Courier New', monospace; font-size: 6pt; color: #94a3b8; margin-top: 0.5mm; letter-spacing: -0.5px;">|||| | | ||| || ||| | |||</div>
          </div>
        </div>
      `;
      })
      .join("");

    printWindow.document.write(`
      <html>
      <head>
        <title>ID Card Panitia - ${namaUjian}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800;900&display=swap');
          @page { size: A4 portrait; margin: 10mm; }
          body {
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            display: flex;
            flex-wrap: wrap;
            gap: 5mm;
            justify-content: flex-start;
            padding: 5mm;
            background: #fff;
            margin: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
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
        ${cardsHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const parsePanitiaInput = () => {
    if (!rawInput.trim()) {
      setPanitiaList([]);
      return;
    }

    const lines = rawInput.split("\n").filter((line) => line.trim());
    const parsed: Panitia[] = [];

    lines.forEach((line) => {
      const parts = line.split(";").map((part) => part.trim());

      if (parts.length >= 1) {
        const nama = parts[0];
        const jabatan = parts[1] || jabatanDefault;
        const nip = parts[2] || "";

        parsed.push({
          nama,
          jabatan,
          nip,
          fotoUrl: fotoGuruMap[nip] || "",
        });
      }
    });

    setPanitiaList(parsed);
  };

  useEffect(() => {
    parsePanitiaInput();
  }, [rawInput, jabatanDefault, fotoGuruMap]);

  const getRoleColorClass = (jabatan: string) => {
    const roleLower = jabatan.toLowerCase();
    if (roleLower.includes("ketua") || roleLower.includes("koordinator")) {
      return "role-red";
    } else if (roleLower.includes("pengawas")) {
      return "role-blue";
    }
    return "role-default";
  };

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-4xl mx-auto pb-10">
      <UtilityHeader
        icon={IdCard}
        title="ID Card Panitia"
        subtitle="Pusat Cetak & Utility • ID Card Panitia / Pengawas"
        accentColor="cyan"
        actionLabel="Cetak ID Card"
        actionIcon={Printer}
        onAction={() => handlePrint()}
        actionDisabled={panitiaList.length === 0}
      />

      {/* Input Data Panitia */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card p-6"
      >
        <h2 className="text-sm font-bold text-slate-300 mb-5 uppercase tracking-wider flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/15 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          Data Panitia (Format: Nama; Jabatan; NIP)
        </h2>
        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder={`CONTOH:
Anggi;KETUA;198901012015011001
Budi;PENGAWAS;198005052008011002

Format: Nama; Jabatan; NIP`}
          className="w-full h-32 p-4 input-obsidian font-mono text-sm resize-none focus:ring-2 focus:ring-cyan-500 transition-all"
        />

        {/* Notifikasi Sinkronisasi Foto */}
        <div
          className="mt-3 p-3 rounded-xl"
          style={{
            background: "rgba(96,165,250,0.06)",
            border: "1px solid rgba(96,165,250,0.15)",
          }}
        >
          <p className="text-[11px] text-blue-400 font-bold leading-relaxed">
            <Info className="w-3 h-3 inline mr-1" />
            TIPS SINKRONISASI FOTO: Gunakan format{" "}
            <span className="underline">Nama; Jabatan; NIP</span>. Pastikan NIP
            yang Anda ketik sama dengan data di database foto guru.
          </p>
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
          <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <IdCard className="w-3.5 h-3.5 text-violet-400" />
          </div>
          Konfigurasi ID Card
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              Nama Ujian / Kegiatan
            </label>
            <input
              type="text"
              value={namaUjian}
              onChange={(e) => setNamaUjian(e.target.value)}
              className="input-obsidian"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              Tahun Pelajaran
            </label>
            <input
              type="text"
              value={tahunPelajaran}
              onChange={(e) => setTahunPelajaran(e.target.value)}
              className="input-obsidian"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              Jabatan Default
            </label>
            <input
              type="text"
              value={jabatanDefault}
              onChange={(e) => setJabatanDefault(e.target.value)}
              className="input-obsidian"
            />
          </div>
        </div>
        <div className="mt-4 flex items-start gap-3 p-4 bg-cyan-500/5 rounded-xl border border-cyan-500/10">
          <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Sistem akan menghasilkan <b>{panitiaList.length}</b> ID Card
            panitia. Foto akan otomatis dimuat jika NIP tersedia di database.
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
          disabled={panitiaList.length === 0}
          className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
        >
          <Printer className="w-4 h-4" />
          Cetak{" "}
          {panitiaList.length > 0 ? `${panitiaList.length} ID Card` : "ID Card"}
        </button>
      </motion.div>
    </div>
  );
}
