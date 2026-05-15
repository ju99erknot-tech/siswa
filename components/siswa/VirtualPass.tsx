"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useReactToPrint } from "react-to-print";
import QRCode from "react-qr-code";
import {
  X,
  Download,
  Printer,
  RotateCcw,
  GraduationCap,
  User,
} from "lucide-react";
import type { Siswa } from "@/types";
import { formatTanggal, getKelasColor } from "@/lib/utils";
import { SCHOOL } from "@/lib/school.config";
import { useAppStore } from "@/store/app.store";

// ─── Props ───────────────────────────────────────────────────
interface VirtualPassProps {
  siswa: Siswa;
  onClose?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────
const CARD_W = 344;
const CARD_H = 216;

const gradeLabel: Record<string, string> = {
  I: "Kelas 1",
  II: "Kelas 2",
  III: "Kelas 3",
  IV: "Kelas 4",
  V: "Kelas 5",
  VI: "Kelas 6",
};

function getGradeLabel(kelas?: string) {
  if (!kelas) return "Belum ada kelas";
  const grade = kelas.trim().split(" ")[0];
  return gradeLabel[grade] ?? kelas;
}

// ─── Card Front ───────────────────────────────────────────────
function CardFront({
  siswa,
  namaSekolah,
}: {
  siswa: Siswa;
  namaSekolah: string;
}) {
  const accentColor = getKelasColor(siswa.kelas);

  return (
    <div
      className="absolute inset-0 rounded-2xl overflow-hidden select-none"
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #1e0a3c 0%, #2d1b69 40%, #0c2a4a 80%, #0f2744 100%)",
        }}
      />

      {/* Decorative mesh overlay */}
      <div
        className="absolute inset-0 opacity-20"
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
      <div className="relative z-10 h-full flex flex-col p-4">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(124,58,237,0.3)",
                border: "1px solid rgba(124,58,237,0.5)",
              }}
            >
              <GraduationCap className="w-5 h-5 text-violet-300" />
            </div>
            <div>
              <div className="text-white font-bold text-[9px] leading-tight tracking-wide uppercase">
                {namaSekolah.toUpperCase()}
              </div>
              <div className="text-white/60 text-[7px] tracking-wider uppercase">
                Kartu Pelajar
              </div>
            </div>
          </div>
          <div
            className="px-2 py-0.5 rounded-full text-[7px] font-bold tracking-wider uppercase"
            style={{
              background: `${accentColor}33`,
              border: `1px solid ${accentColor}66`,
              color: accentColor,
            }}
          >
            {getGradeLabel(siswa.kelas)}
          </div>
        </div>

        {/* Main content */}
        <div className="flex gap-3 flex-1">
          {/* Photo */}
          <div className="flex-shrink-0">
            <div
              className="w-20 h-24 rounded-xl overflow-hidden flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.2))",
                border: "2px solid rgba(255,255,255,0.15)",
              }}
            >
              {siswa.foto_url ? (
                <img
                  src={siswa.foto_url}
                  alt={siswa.nama}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <User className="w-7 h-7 text-white/30" />
                  <div className="text-white/30 text-[6px] tracking-widest uppercase">
                    Foto
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            <div>
              <div className="text-white font-bold text-xs leading-tight truncate">
                {siswa.nama}
              </div>
              <div className="text-white/60 text-[8px] mt-0.5">
                NISN:{" "}
                <span className="text-cyan-300 font-mono font-semibold">
                  {siswa.nisn}
                </span>
              </div>
              {siswa.nis && (
                <div className="text-white/50 text-[7px]">
                  NIS:{" "}
                  <span className="text-white/70 font-mono">{siswa.nis}</span>
                </div>
              )}
              <div className="text-white/50 text-[7px] mt-1">
                {siswa.tempat_lahir && <>{siswa.tempat_lahir},&nbsp;</>}
                {siswa.tanggal_lahir ? formatTanggal(siswa.tanggal_lahir) : ""}
              </div>
            </div>

            <div className="text-[7px] text-white/40 space-y-0.5">
              <div>
                Jenis Kelamin:{" "}
                <span className="text-white/70">
                  {siswa.jk === "L" ? "Laki-laki" : "Perempuan"}
                </span>
              </div>
              {siswa.agama && (
                <div>
                  Agama: <span className="text-white/70">{siswa.agama}</span>
                </div>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="flex-shrink-0 flex flex-col items-center justify-end gap-1">
            <div
              className="p-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.95)" }}
            >
              <QRCode
                value={`NISN:${siswa.nisn}`}
                size={52}
                level="M"
                fgColor="#1e0a3c"
                bgColor="transparent"
              />
            </div>
            <div className="text-white/30 text-[6px] text-center">
              Scan NISN
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div
          className="mt-2 pt-1.5 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="text-[7px] text-white/30">
            {`Portal Kesiswaan ${namaSekolah}`}
          </div>
          <div className="text-[7px] font-bold" style={{ color: accentColor }}>
            {siswa.kelas ?? "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Card Back ────────────────────────────────────────────────
function CardBack({
  siswa,
  namaSekolah,
  namaKepsek,
  nipKepsek,
}: {
  siswa: Siswa;
  namaSekolah: string;
  namaKepsek: string;
  nipKepsek: string;
}) {
  const accentColor = getKelasColor(siswa.kelas);

  return (
    <div
      className="absolute inset-0 rounded-2xl overflow-hidden select-none"
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
        background: "linear-gradient(135deg, #1e0a3c 0%, #0c2a4a 100%)",
      }}
    >
      {/* Top strip */}
      <div
        className="h-8"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, #06b6d4)`,
        }}
      />

      {/* Barcode area */}
      <div className="mx-4 mt-2 mb-1 h-8 flex items-center justify-center bg-white/95 border border-white/10 rounded overflow-hidden">
        {/* SVG barcode simulation */}
        <svg width="180" height="24" viewBox="0 0 180 24">
          {Array.from({ length: 60 }).map((_, i) => {
            const x = i * 3;
            const h =
              16 + (parseInt(siswa.nisn[i % siswa.nisn.length] ?? "5") % 8);
            const w = i % 7 === 0 ? 2 : 1;
            return (
              <rect
                key={i}
                x={x}
                y={(24 - h) / 2}
                width={w}
                height={h}
                fill="#1a1a2e"
              />
            );
          })}
        </svg>
      </div>
      <div className="text-center text-[7px] text-white/50 font-mono mb-2">
        {siswa.nisn}
      </div>

      {/* Data fields */}
      <div className="px-4 space-y-0.5">
        {[
          ["Nama Lengkap", siswa.nama],
          ["NISN", siswa.nisn],
          ["Kelas", siswa.kelas ?? "—"],
          [
            "TTL",
            [
              siswa.tempat_lahir,
              siswa.tanggal_lahir ? formatTanggal(siswa.tanggal_lahir) : "",
            ]
              .filter(Boolean)
              .join(", ") || "—",
          ],
          [
            "Orang Tua",
            siswa.nama_ayah ?? siswa.nama_ibu ?? siswa.nama_wali ?? "—",
          ],
        ].map(([label, value]) => (
          <div key={label} className="flex gap-1 text-[7.5px]">
            <span className="text-white/50 w-20 flex-shrink-0">{label}</span>
            <span className="text-white/40 font-medium">:</span>
            <span className="text-white/90 font-medium truncate">{value}</span>
          </div>
        ))}
      </div>

      {/* Grade strip at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-5 flex items-center justify-between px-3"
        style={{
          background: `${accentColor}22`,
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="text-[6px] text-white/40">
          Berlaku selama menjadi peserta didik aktif
        </div>
        <div className="text-[7px] font-bold" style={{ color: accentColor }}>
          {namaSekolah.toUpperCase()}
        </div>
      </div>

      {/* Signature area */}
      <div className="absolute bottom-6 right-4 text-right">
        <div className="text-[7px] text-white/50">Kepala Sekolah</div>
        <div className="h-4 w-16 ml-auto" />
        <div
          className="text-[7px] font-semibold underline"
          style={{ color: accentColor }}
        >
          {namaKepsek}
        </div>
        <div className="text-[6px] text-white/30">NIP. {nipKepsek}</div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function VirtualPass({ siswa, onClose }: VirtualPassProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { pengaturan } = useAppStore();

  const namaSekolah = pengaturan?.nama_sekolah || SCHOOL.nama;
  const namaKepsek = pengaturan?.nama_kepsek || "_________________";
  const nipKepsek = pengaturan?.nip_kepsek || "___________";

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Kartu-Pelajar-${siswa.nisn}`,
    pageStyle: `
      @page { size: 85.6mm 53.98mm; margin: 0; }
      body { margin: 0; -webkit-print-color-adjust: exact; }
    `,
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(8,9,13,0.9)", backdropFilter: "blur(12px)" }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose?.();
        }}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="flex flex-col items-center gap-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between w-full max-w-sm">
            <div>
              <h2 className="text-white font-bold text-lg">Virtual Pass</h2>
              <p className="text-white/40 text-sm">Klik kartu untuk membalik</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 3D Card */}
          <div
            className="cursor-pointer"
            style={{ width: CARD_W, height: CARD_H, perspective: "1200px" }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <motion.div
              className="relative w-full h-full"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{
                duration: 0.6,
                type: "spring",
                stiffness: 200,
                damping: 25,
              }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <CardFront siswa={siswa} namaSekolah={namaSekolah} />
              <CardBack
                siswa={siswa}
                namaSekolah={namaSekolah}
                namaKepsek={namaKepsek}
                nipKepsek={nipKepsek}
              />
            </motion.div>
          </div>

          {/* Side indicator */}
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                background: !isFlipped ? "#7c3aed" : "rgba(255,255,255,0.2)",
              }}
            />
            <div
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                background: isFlipped ? "#06b6d4" : "rgba(255,255,255,0.2)",
              }}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Balik Kartu
            </button>

            <button
              onClick={() => handlePrint()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Printer className="w-4 h-4" />
              Cetak
            </button>

            <button
              onClick={() => {
                toast.info("Gunakan tombol Cetak lalu simpan sebagai PDF", {
                  description:
                    'Pilih "Simpan sebagai PDF" pada dialog cetak browser Anda.',
                  duration: 5000,
                });
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                boxShadow: "0 0 20px rgba(124,58,237,0.4)",
              }}
            >
              <Download className="w-4 h-4" />
              Unduh PDF
            </button>
          </div>
        </motion.div>

        {/* Hidden print area */}
        <div className="hidden">
          <div
            ref={printRef}
            style={{ width: CARD_W, height: CARD_H, position: "relative" }}
          >
            <CardFront siswa={siswa} namaSekolah={namaSekolah} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
