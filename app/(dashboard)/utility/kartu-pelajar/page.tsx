"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSiswa } from "@/hooks/useSiswa";
import {
  Printer,
  Search,
  Filter,
  CheckSquare,
  Square,
  CreditCard,
  QrCode,
  Users,
  User,
  GraduationCap,
} from "lucide-react";
import QRCode from "react-qr-code";
import { formatTanggal, getFotoPublic, getKelasColor } from "@/lib/utils";
import { useAppStore } from "@/store/app.store";
import type { Siswa } from "@/types";

const SCHOOL_NAME = process.env.NEXT_PUBLIC_SCHOOL_NAME || "SDN 02 CIBADAK";

export default function KartuPelajarPage() {
  const { data: siswaList } = useSiswa();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredData = siswaList.filter(
    (s) =>
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.nisn.includes(search) ||
      (s.kelas && s.kelas.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map((s) => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedSiswa = siswaList.filter((s) => selectedIds.includes(s.id));

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6 print:m-0 print:p-0 print:max-w-none">
      {/* Header - Hidden in Print */}
      <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-violet-500/20 border border-violet-500/30">
            <CreditCard className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Cetak Kartu Pelajar</h1>
            <p className="text-sm text-slate-400">Pilih siswa untuk mencetak kartu identitas resmi</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, NISN, kelas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-obsidian pl-9 pr-4 py-2 text-sm"
            />
          </div>
          <button
            onClick={handlePrint}
            disabled={selectedIds.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
          >
            <Printer className="w-4 h-4" />
            Cetak ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* Main Content - Hidden in Print */}
      <div className="print:hidden grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Siswa List */}
        <div className="lg:col-span-1 card rounded-3xl border border-white/5 p-4 max-h-[600px] flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="text-sm font-bold text-white">Daftar Siswa</div>
            <button onClick={toggleSelectAll} className="text-xs text-violet-400 font-medium hover:text-violet-300">
              {selectedIds.length === filteredData.length ? "Batal Semua" : "Pilih Semua"}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scroll">
            {filteredData.map((s) => (
              <div
                key={s.id}
                onClick={() => toggleSelect(s.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                  selectedIds.includes(s.id)
                    ? "bg-violet-500/15 border-violet-500/30"
                    : "bg-[#0f1117] border-white/5 hover:border-white/20"
                }`}
              >
                {selectedIds.includes(s.id) ? (
                  <CheckSquare className="w-4 h-4 text-violet-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-600" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{s.nama}</div>
                  <div className="text-[10px] text-slate-500">
                    NISN: {s.nisn} • Kelas: {s.kelas || "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2 card rounded-3xl border border-white/5 p-6 flex flex-col items-center justify-center min-h-[400px]">
          {selectedIds.length === 0 ? (
            <div className="text-center">
              <CreditCard className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400">Belum ada siswa yang dipilih</p>
            </div>
          ) : (
            <div className="w-full">
              <p className="text-center text-sm font-bold text-slate-500 mb-6 uppercase tracking-widest">
                Preview Kartu ({selectedSiswa.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 place-items-center">
                {selectedSiswa.slice(0, 1).map((s) => (
                  <KartuPelajar key={s.id} siswa={s} />
                ))}
              </div>
              {selectedSiswa.length > 1 && (
                <div className="text-center mt-6 text-sm text-slate-500">
                  + {selectedSiswa.length - 1} siswa lainnya akan dicetak
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Print View - Only visible when printing */}
      <div className="hidden print:block">
        <div className="grid grid-cols-2 gap-4 gap-y-8" style={{ width: "210mm", padding: "10mm" }}>
          {selectedSiswa.map((s) => (
            <KartuPelajar key={s.id} siswa={s} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Komponen Kartu Pelajar (ID Card)
// ──────────────────────────────────────────────────────────────
function KartuPelajar({ siswa }: { siswa: Siswa }) {
  const { pengaturan } = useAppStore();
  const namaSekolah = pengaturan?.nama_sekolah || SCHOOL_NAME;
  const accentColor = getKelasColor(siswa.kelas);

  return (
    <>
      {/* ================= SISI DEPAN ================= */}
      <div 
        className="relative overflow-hidden w-[8.5cm] h-[5.4cm] rounded-xl print:border-slate-800"
        style={{
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          background: "linear-gradient(135deg, #1e0a3c 0%, #2d1b69 40%, #0c2a4a 80%, #0f2744 100%)",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact"
        }}
      >
      {/* Decorative mesh overlay */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(124,58,237,0.6) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(6,182,212,0.4) 0%, transparent 50%)
          `,
        }}
      />

      {/* Top accent stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, #06b6d4)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col p-3">
        {/* Header row */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(124,58,237,0.3)",
                border: "1px solid rgba(124,58,237,0.5)",
              }}
            >
              <GraduationCap className="w-4 h-4 text-violet-300" />
            </div>
            <div>
              <div className="text-white font-bold text-[8px] leading-tight tracking-wide uppercase">
                {namaSekolah.toUpperCase()}
              </div>
              <div className="text-white/60 text-[6px] tracking-wider uppercase">
                Kartu Pelajar Resmi
              </div>
            </div>
          </div>
          <div
            className="px-2 py-0.5 rounded-full text-[6px] font-bold tracking-wider uppercase"
            style={{
              background: `${accentColor}33`,
              border: `1px solid ${accentColor}66`,
              color: accentColor,
            }}
          >
            {siswa.kelas ? `Kelas ${siswa.kelas.split(' ')[0]}` : "Belum ada kelas"}
          </div>
        </div>

        {/* Main content */}
        <div className="flex gap-2.5 flex-1">
          {/* Photo */}
          <div className="flex-shrink-0">
            <div
              className="w-16 h-20 rounded-xl overflow-hidden flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.2))",
                border: "2px solid rgba(255,255,255,0.15)",
              }}
            >
              {getFotoPublic(siswa.foto_url) ? (
                <img
                  src={getFotoPublic(siswa.foto_url)!}
                  alt={siswa.nama}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <User className="w-5 h-5 text-white/30" />
                  <div className="text-white/30 text-[5px] tracking-widest uppercase">
                    Foto
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              <div className="text-white font-bold text-[10px] leading-tight truncate">
                {siswa.nama}
              </div>
              <div className="text-white/60 text-[7px] mt-0.5 flex items-center gap-1">
                NISN:{" "}
                <span className="text-cyan-300 font-mono font-semibold">
                  {siswa.nisn}
                </span>
              </div>
              {siswa.nis && (
                <div className="text-white/50 text-[6px]">
                  NIS:{" "}
                  <span className="text-white/70 font-mono">{siswa.nis}</span>
                </div>
              )}
              <div className="text-white/50 text-[6px] mt-0.5">
                {siswa.tempat_lahir && <>{siswa.tempat_lahir},&nbsp;</>}
                {siswa.tanggal_lahir ? formatTanggal(siswa.tanggal_lahir) : ""}
              </div>
            </div>

            <div className="text-[6px] text-white/40 space-y-0.5">
              <div className="flex items-center gap-1">
                <span>JK:</span>{" "}
                <span className="text-white/70">
                  {siswa.jk === "L" ? "Laki-laki" : siswa.jk === "P" ? "Perempuan" : "-"}
                </span>
              </div>
              {siswa.agama && (
                <div className="flex items-center gap-1">
                  <span>Agama:</span> <span className="text-white/70">{siswa.agama}</span>
                </div>
              )}
              {siswa.alamat && (
                <div className="truncate pr-2">
                  <span>Alamat:</span> <span className="text-white/70">{siswa.alamat}</span>
                </div>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="flex-shrink-0 flex flex-col items-center justify-end gap-1">
            <div
              className="p-1 rounded-lg"
              style={{ background: "rgba(255,255,255,0.95)" }}
            >
              <QRCode
                value={`NISN:${siswa.nisn}`}
                size={38}
                level="M"
                fgColor="#1e0a3c"
                bgColor="transparent"
              />
            </div>
            <div className="text-white/30 text-[5px] text-center">
              Scan NISN
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div
          className="mt-1 pt-1 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="text-[6px] text-white/30">
            {`Portal Kesiswaan ${namaSekolah}`}
          </div>
          <div className="text-[6px] font-bold uppercase" style={{ color: accentColor }}>
            ID Card Resmi
          </div>
        </div>
      </div>
      </div>

      {/* ================= SISI BELAKANG ================= */}
      <div
        className="relative overflow-hidden w-[8.5cm] h-[5.4cm] rounded-xl print:border-slate-800"
        style={{
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          background: "linear-gradient(135deg, #1e0a3c 0%, #0c2a4a 100%)",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact"
        }}
      >
        {/* Top strip */}
        <div
          className="h-6"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, #06b6d4)`,
          }}
        />

        {/* Barcode area */}
        <div className="mx-3 mt-2 mb-1 h-6 flex items-center justify-center bg-white/95 border border-white/10 rounded overflow-hidden">
          <svg width="150" height="20" viewBox="0 0 180 24">
            {Array.from({ length: 60 }).map((_, i) => {
              const x = i * 3;
              const h = 16 + (parseInt(siswa.nisn[i % siswa.nisn.length] ?? "5") % 8);
              const w = i % 7 === 0 ? 2 : 1;
              return <rect key={i} x={x} y={(24 - h) / 2} width={w} height={h} fill="#1a1a2e" />;
            })}
          </svg>
        </div>
        <div className="text-center text-[6px] text-white/50 font-mono mb-2">
          {siswa.nisn}
        </div>

        {/* Data fields */}
        <div className="px-3 space-y-0.5">
          {[
            ["Nama Lengkap", siswa.nama],
            ["NISN", siswa.nisn],
            ["Kelas", siswa.kelas ?? "—"],
            [
              "TTL",
              [
                siswa.tempat_lahir,
                siswa.tanggal_lahir ? formatTanggal(siswa.tanggal_lahir) : "",
              ].filter(Boolean).join(", ") || "—",
            ],
            ["Orang Tua", siswa.nama_ayah ?? siswa.nama_ibu ?? siswa.nama_wali ?? "—"],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-1 text-[6.5px]">
              <span className="text-white/50 w-16 flex-shrink-0">{label}</span>
              <span className="text-white/40 font-medium">:</span>
              <span className="text-white/90 font-medium truncate">{value}</span>
            </div>
          ))}
        </div>

        {/* Grade strip at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-4 flex items-center justify-between px-3"
          style={{
            background: `${accentColor}22`,
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="text-[5px] text-white/40">
            Berlaku selama menjadi peserta didik aktif
          </div>
          <div className="text-[6px] font-bold uppercase" style={{ color: accentColor }}>
            {namaSekolah}
          </div>
        </div>

        {/* Signature area */}
        <div className="absolute bottom-5 right-3 text-right">
          <div className="text-[6px] text-white/50">Kepala Sekolah</div>
          <div className="h-4 w-16 ml-auto" />
          <div
            className="text-[6px] font-semibold underline uppercase"
            style={{ color: accentColor }}
          >
            {pengaturan?.nama_kepsek || "_________________"}
          </div>
          <div className="text-[5px] text-white/30">NIP. {pengaturan?.nip_kepsek || "___________"}</div>
        </div>
      </div>
    </>
  );
}
