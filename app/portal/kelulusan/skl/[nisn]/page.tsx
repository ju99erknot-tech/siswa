"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  GraduationCap, Shield, Download, Share2, CheckCircle,
  Loader2, AlertCircle, Star, Award,
} from "lucide-react";
import QRCode from "react-qr-code";
import { SCHOOL } from "@/lib/school.config";

interface SklData {
  siswa: {
    nama: string; nisn: string; nis?: string; jk: string;
    kelas?: string; tempat_lahir?: string; tanggal_lahir?: string;
    nama_ayah?: string; nama_ibu?: string; foto_url?: string;
    no_peserta_un?: string;
  };
  nama_sekolah: string; nama_kepsek: string; nip_kepsek: string;
  npsn: string; alamat_sekolah: string; tahun_ajaran: string;
  logo_url?: string;
}

export default function ESklPage() {
  const { nisn } = useParams<{ nisn: string }>();
  const [data, setData] = useState<SklData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const certRef = useRef<HTMLDivElement>(null);

  const verifyUrl = typeof window !== "undefined"
    ? `${window.location.origin}/portal/kelulusan/skl/${nisn}`
    : "";

  useEffect(() => {
    if (!nisn) return;
    fetch(`/api/kelulusan/skl/${nisn}`)
      .then(r => r.json().then(d => ({ ok: r.ok, data: d })))
      .then(({ ok, data: d }) => {
        if (!ok) throw new Error(d.error);
        setData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [nisn]);

  const handleShare = async () => {
    const text = `🎓 E-SKL Digital\n\nNama: ${data?.siswa.nama}\nNISN: ${data?.siswa.nisn}\nStatus: LULUS ✅\n${data?.nama_sekolah} - TP ${data?.tahun_ajaran}\n\nVerifikasi: ${verifyUrl}`;
    if (navigator.share) {
      await navigator.share({ title: "E-SKL Digital", text, url: verifyUrl });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Link E-SKL berhasil disalin!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #050812, #0a1128)" }}>
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, #050812, #0a1128)" }}>
        <div className="max-w-sm w-full text-center p-10 rounded-[2rem]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h1 className="text-xl font-black text-white mb-2">Tidak Valid</h1>
          <p className="text-sm text-white/40">{error || "E-SKL tidak ditemukan"}</p>
        </div>
      </div>
    );
  }

  const { siswa } = data;
  const tglLahir = siswa.tanggal_lahir
    ? new Date(siswa.tanggal_lahir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-";

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center p-4 pt-8 pb-10" style={{ background: "linear-gradient(135deg, #050812 0%, #0a1128 50%, #050812 100%)" }}>
      {/* Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(212,168,67,0.15) 0%, transparent 70%)" }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)" }} />

      {/* Verification Badge */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 px-4 py-2 rounded-full mb-6 z-10" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
        <Shield size={14} className="text-emerald-400" />
        <span className="text-xs font-bold text-emerald-400">Dokumen Terverifikasi Digital</span>
        <CheckCircle size={12} className="text-emerald-400" />
      </motion.div>

      {/* Certificate Card */}
      <motion.div ref={certRef} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
        className="w-full max-w-lg relative z-10 rounded-[2rem] overflow-hidden print:!bg-white print:!border-gray-300 print:shadow-none print:!bg-none"
        style={{ background: "linear-gradient(160deg, rgba(20,15,35,0.95) 0%, rgba(10,10,25,0.98) 100%)", border: "1px solid rgba(212,168,67,0.2)", boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(212,168,67,0.08)" }}>

        {/* Gold accent top border */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, transparent, #D4A843, #F5D98C, #D4A843, transparent)" }} />

        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 text-center">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/10 rounded-full blur-[60px] pointer-events-none" />

          {/* Logo + School */}
          <div className="flex items-center justify-center gap-3 mb-4">
            {data.logo_url ? (
              <img src={data.logo_url} alt="Logo" className="w-10 h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <GraduationCap size={20} className="text-amber-400" />
              </div>
            )}
            <div className="text-left">
              <p className="text-xs font-black text-amber-400 print:text-black uppercase tracking-wider">{data.nama_sekolah}</p>
              <p className="text-[9px] text-white/30 print:text-gray-500">NPSN: {data.npsn || "-"}</p>
            </div>
          </div>

          {/* Title */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-500/30" />
            <Award size={16} className="text-amber-400" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-500/30" />
          </div>
          <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 print:from-black print:to-black uppercase tracking-wider">
            Surat Keterangan Lulus
          </h1>
          <p className="text-[10px] text-white/30 print:text-gray-500 mt-1 tracking-widest uppercase">E-SKL Digital • TP {data.tahun_ajaran}</p>
        </div>

        {/* Divider */}
        <div className="mx-8 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212,168,67,0.2), transparent)" }} />

        {/* Student Info */}
        <div className="px-8 py-6 space-y-4">
          {/* Photo + Name */}
          <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-500/30 shrink-0 bg-white/5">
              {siswa.foto_url ? (
                <img src={siswa.foto_url} alt={siswa.nama} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-black text-amber-400/40">{siswa.nama.charAt(0)}</div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-black text-white print:text-black truncate uppercase">{siswa.nama}</h2>
              <p className="text-xs text-white/40 print:text-gray-600">NISN: <span className="text-amber-400/80 print:text-black font-mono">{siswa.nisn}</span></p>
            </div>
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Tempat, Tgl Lahir", value: `${siswa.tempat_lahir || "-"}, ${tglLahir}` },
              { label: "NIS", value: siswa.nis || "-" },
              { label: "Jenis Kelamin", value: siswa.jk === "P" ? "Perempuan" : "Laki-laki" },
              { label: "Orang Tua/Wali", value: siswa.nama_ayah || siswa.nama_ibu || "-" },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl print:!bg-white print:border-gray-300 print:!border" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <p className="text-[8px] font-bold text-white/25 print:text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-xs font-bold text-white/70 print:text-black leading-snug">{item.value}</p>
              </div>
            ))}
          </div>

          {/* LULUS Status */}
          <div className="relative p-5 rounded-2xl text-center overflow-hidden print:!bg-white print:border-black print:!border-2" style={{ background: "linear-gradient(135deg, rgba(212,168,67,0.08), rgba(16,185,129,0.05))", border: "1px solid rgba(212,168,67,0.15)" }}>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none print:hidden" />
            <div className="flex items-center justify-center gap-2 mb-2 relative z-10">
              <Star size={14} className="text-amber-400 print:text-black print:fill-black fill-amber-400" />
              <span className="text-[10px] font-black text-amber-400 print:text-black uppercase tracking-[0.3em]">Dinyatakan</span>
              <Star size={14} className="text-amber-400 print:text-black print:fill-black fill-amber-400" />
            </div>
            <h2 className="text-3xl font-black text-transparent print:text-black bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 print:from-black print:to-black relative z-10 tracking-widest">
              L U L U S
            </h2>
            <p className="text-[10px] text-white/30 print:text-black mt-2 relative z-10">
              Berdasarkan hasil Asesmen Sumatif Akhir Jenjang dan Rapat Dewan Guru
            </p>
          </div>

          {/* Kepsek + QR */}
          <div className="flex items-end justify-between gap-4 pt-2">
            <div className="text-left">
              <p className="text-[9px] text-white/25 print:text-gray-500 uppercase tracking-widest mb-1">Kepala Sekolah</p>
              <p className="text-sm font-black text-white/80 print:text-black">{data.nama_kepsek}</p>
              <p className="text-[10px] text-white/30 print:text-gray-600 font-mono">NIP. {data.nip_kepsek}</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="p-2 rounded-xl bg-white print:p-0 print:border-none border border-white/10">
                <QRCode value={verifyUrl} size={72} level="M" />
              </div>
              <p className="text-[7px] text-white/20 print:text-gray-500 text-center max-w-[80px] leading-tight">Scan untuk verifikasi</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 print:!bg-white print:border-t-gray-300" style={{ background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <p className="text-[9px] text-white/20 print:text-gray-500 text-center leading-relaxed">
            Dokumen E-SKL ini diterbitkan secara digital oleh {data.nama_sekolah} dan dapat diverifikasi melalui QR Code di atas.
            SKL ini bersifat sementara sampai Ijazah asli diterbitkan.
          </p>
        </div>

        {/* Gold accent bottom */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, transparent, #D4A843, #F5D98C, #D4A843, transparent)" }} />
      </motion.div>

      {/* Action Buttons */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="w-full max-w-lg mt-6 space-y-3 z-10">
        <button onClick={handleShare} className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #D4A843, #b8860b)", boxShadow: "0 10px 25px -5px rgba(212,168,67,0.3)" }}>
          <Share2 size={18} /> Bagikan E-SKL
        </button>
        <button onClick={() => window.print()} className="w-full py-3.5 rounded-2xl text-sm font-bold text-white/50 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 transition-all border border-white/5">
          <Download size={16} /> Unduh / Cetak
        </button>
      </motion.div>

      {/* Footer */}
      <div className="mt-auto pt-8 text-center z-10">
        <p className="text-[10px] text-white/15">{data.nama_sekolah} • E-SKL Digital {data.tahun_ajaran}</p>
      </div>
    </div>
  );
}
