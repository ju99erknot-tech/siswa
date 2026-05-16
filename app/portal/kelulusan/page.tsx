"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Lock, GraduationCap, Loader2, ArrowRight, CheckCircle,
  AlertCircle, Printer, Phone, Star, X, Clock, FileCheck, Share2,
} from "lucide-react";
import { toast } from "sonner";
import { SCHOOL } from "@/lib/school.config";
import dynamic from "next/dynamic";
import QRCode from "react-qr-code";
import { renderToString } from "react-dom/server";

const ConfettiCelebration = dynamic(
  () => import("@/components/shared/ConfettiCelebration"),
  { ssr: false }
);

interface SiswaData {
  id: string; nama: string; nisn: string; nis?: string; jk: string;
  kelas?: string; tempat_lahir?: string; tanggal_lahir?: string;
  nama_ayah?: string; nama_ibu?: string; foto_url?: string;
  status_kelulusan?: string;
}

export default function PortalKelulusan() {
  const [step, setStep] = useState<"search" | "result">("search");
  const [nisn, setNisn] = useState("");
  const [tglLahir, setTglLahir] = useState("");
  const [searching, setSearching] = useState(false);
  const [siswa, setSiswa] = useState<SiswaData | null>(null);
  const [statusKelulusan, setStatusKelulusan] = useState<string | null>(null);
  const [pesanKelulusan, setPesanKelulusan] = useState<string | null>(null);
  const [namaKepsek, setNamaKepsek] = useState<string | null>(null);
  const [nipKepsek, setNipKepsek] = useState<string | null>(null);
  const [namaSekolah, setNamaSekolah] = useState<string | null>(null);
  const [portalClosed, setPortalClosed] = useState(false);
  const [tglPengumuman, setTglPengumuman] = useState<string | null>(null);
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 });

  // Countdown timer
  useEffect(() => {
    if (!portalClosed || !tglPengumuman) return;
    const target = new Date(tglPengumuman).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setCountdown({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [portalClosed, tglPengumuman]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisn || !tglLahir) { toast.error("Lengkapi NISN dan Tanggal Lahir"); return; }
    setSearching(true);
    try {
      const res = await fetch("/api/kelulusan/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nisn, tgl_lahir: tglLahir }),
      });
      const json = await res.json();
      if (res.status === 403 && json.tanggal_pengumuman !== undefined) {
        setPortalClosed(true);
        setTglPengumuman(json.tanggal_pengumuman);
        return;
      }
      if (!res.ok) throw new Error(json.error || "Gagal mencari data");
      setSiswa(json.siswa);
      setStatusKelulusan(json.status_kelulusan);
      setPesanKelulusan(json.pesan_kelulusan);
      setNamaKepsek(json.nama_kepsek);
      setNipKepsek(json.nip_kepsek);
      setNamaSekolah(json.nama_sekolah);
      setStep("result");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSearching(false);
    }
  };

  const lulus = statusKelulusan === "LULUS";
  const fotoUrl = siswa?.foto_url || null;
  const schoolName = namaSekolah || SCHOOL.nama;

  // ── PORTAL BELUM DIBUKA ──
  if (portalClosed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #050812 0%, #0a1128 50%, #050812 100%)" }}>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(212,168,67,0.12) 0%, transparent 70%)" }} />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center p-10 rounded-[2.5rem]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(40px)" }}>
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
            <Clock size={36} className="text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Pengumuman Belum Dibuka</h1>
          <p className="text-sm text-white/40 mb-8 leading-relaxed">Portal pengumuman kelulusan belum diaktifkan oleh pihak sekolah. Silakan kembali pada tanggal yang telah ditentukan.</p>
          {tglPengumuman && (
            <div className="mb-8">
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[{ v: countdown.d, l: "Hari" }, { v: countdown.h, l: "Jam" }, { v: countdown.m, l: "Menit" }, { v: countdown.s, l: "Detik" }].map(t => (
                  <div key={t.l} className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-2xl font-black text-amber-400">{String(t.v).padStart(2, "0")}</p>
                    <p className="text-[9px] font-bold text-white/40 uppercase mt-1">{t.l}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/30 text-center">
                Dibuka pada: <span className="text-amber-400/80 font-bold">{new Date(tglPengumuman).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}, Pukul {new Date(tglPengumuman).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</span>
              </p>
            </div>
          )}
          <button onClick={() => setPortalClosed(false)} className="w-full h-12 rounded-xl text-sm font-bold text-white/60 bg-white/5 hover:bg-white/10 transition-all border border-white/10">
            Kembali
          </button>
        </motion.div>
      </div>
    );
  }

  const handleCetakSKL = () => {
    if (!siswa) return;
    const verifyUrl = `${window.location.origin}/portal/kelulusan/skl/${siswa.nisn}`;
    const tglLahirFormatted = siswa.tanggal_lahir ? new Date(siswa.tanggal_lahir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";
    const tglCetak = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const qrSvg = renderToString(<QRCode value={verifyUrl} size={80} level="M" />);
    const kopUrl = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgHJHdzvsrvzHVMFsAmI_Ra_4vlYn39plogGMmNIUO7MV71T8zT9YWUFQyO5UD6oeSQ7jew1exTAXcI24JwK3eBiokcmNppHqGjvq70RTfjeYdZAhIahHq0D8m2Jrixl_8bb6BaFGhm0xpov4cojZ_ydeyOtE1xM7wrxn7FSMy0EP5KTuyqWVscaIkCyN3T/s955/KOP%20Baru.png";
    const parentName = siswa.nama_ayah || siswa.nama_ibu || "-";

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>SKL - ${siswa.nama}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; margin: 0; padding: 20px; background: #eee; }
        .surat-page { background: white; width: 210mm; min-height: 297mm; margin: 0 auto; padding: 15mm 20mm; box-sizing: border-box; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .kop-surat { text-align: center; margin-bottom: 20px; margin-left: -10mm; margin-right: -10mm; }
        .kop-surat img { width: 100%; max-height: 150px; object-fit: contain; }
        .judul-box { text-align: center; margin: 20px 0 30px 0; }
        .judul-box h2 { margin: 0; font-size: 14pt; text-decoration: underline; font-weight: bold; }
        .isi-surat { text-align: justify; line-height: 1.6; }
        .isi-surat table td { padding: 4px 0; vertical-align: top; }
        .lulus-box { text-align: center; font-size: 16pt; font-weight: bold; margin: 15px 0; border: 2px solid #000; padding: 10px; letter-spacing: 2px; }
        .footer-box { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
        .qr-box { text-align: center; padding: 8px; border: 1px solid #ddd; border-radius: 8px; }
        .qr-box p { font-size: 7pt; color: #888; margin: 4px 0 0 0; }
        .ttd-box { width: 250px; text-align: center; }
        .ttd-name { font-weight: bold; text-decoration: underline; text-transform: uppercase; }
        .no-print { position: fixed; top: 20px; right: 20px; z-index: 1000; display: flex; gap: 10px; }
        .btn { background: #D4A843; color: white; padding: 10px 20px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        @media print { body { background: white; padding: 0; } .surat-page { margin: 0; box-shadow: none; } .no-print { display: none !important; } }
      </style></head><body>
        <div class="no-print">
          <button class="btn" onclick="window.print()">🖨️ Cetak Sekarang</button>
          <button class="btn" style="background:#64748b" onclick="window.close()">Tutup</button>
        </div>
        <div class="surat-page">
          <div class="kop-surat"><img src="${kopUrl}" alt="KOP" /></div>
          <div class="judul-box"><h2>SURAT KETERANGAN LULUS</h2></div>
          <div class="isi-surat">
            <p>Yang bertanda tangan di bawah ini Kepala ${schoolName}, menerangkan dengan sebenarnya bahwa:</p>
            <table style="margin-left:20px;width:100%">
              <tr><td width="35%">Nama Lengkap</td><td width="2%">:</td><td style="font-weight:bold;text-transform:uppercase">${siswa.nama}</td></tr>
              <tr><td>Tempat, Tanggal Lahir</td><td>:</td><td>${siswa.tempat_lahir || "-"}, ${tglLahirFormatted}</td></tr>
              <tr><td>NIS / NISN</td><td>:</td><td>${siswa.nis || "-"} / <b>${siswa.nisn}</b></td></tr>
              <tr><td>Nama Orang Tua/Wali</td><td>:</td><td>${parentName}</td></tr>
            </table>
            <p>Berdasarkan hasil Asesmen Sumatif Akhir Jenjang dan Rapat Dewan Guru, siswa tersebut dinyatakan:</p>
            <div class="lulus-box">L U L U S</div>
            <p>Dari ${schoolName} Tahun Pelajaran <b>${SCHOOL.tahunAjaran}</b>.</p>
            <p>Surat Keterangan Lulus (SKL) ini bersifat sementara dan dapat digunakan untuk keperluan pendaftaran ke jenjang pendidikan selanjutnya (SMP/MTs sederajat) sampai Ijazah asli diterbitkan.</p>
          </div>
          <div class="footer-box">
            <div class="qr-box">${qrSvg}<p>Scan untuk verifikasi</p></div>
            <div class="ttd-box">
              <p>Cibadak, ${tglCetak}</p>
              <p>Kepala Sekolah,</p>
              <div style="height:70px"></div>
              <div class="ttd-name">${namaKepsek || "___________________"}</div>
              <div>NIP. ${nipKepsek || "___________________"}</div>
            </div>
          </div>
        </div>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      {/* ── MAIN SCREEN ── */}
      <div className="min-h-screen w-full relative flex flex-col items-center p-4 py-6 selection:bg-amber-500/30 overflow-x-hidden" style={{ background: "linear-gradient(135deg, #050812 0%, #0a1128 50%, #050812 100%)" }}>
        {/* Decorative Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(212,168,67,0.12) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)" }} />

        <AnimatePresence mode="wait">
          {step === "search" ? (
            <motion.div key="search" initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }} transition={{ duration: 0.4, ease: "easeOut" }} className="w-full max-w-md my-auto relative z-10">
              <div className="relative p-8 sm:p-10 rounded-[2.5rem] overflow-hidden" style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)", backdropFilter: "blur(40px)" }}>
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-[50px] pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-[50px] pointer-events-none" />

                <div className="relative z-10 text-center mb-10">
                  <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 relative group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                    <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-tr from-amber-500 to-yellow-500 rounded-3xl shadow-xl shadow-amber-500/20 border border-white/20">
                      <GraduationCap className="w-10 h-10 text-white drop-shadow-md" />
                    </div>
                  </motion.div>

                  <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40 mb-2 tracking-tight">
                    Pengumuman Kelulusan
                  </motion.h1>
                  <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-xs font-bold text-amber-400 uppercase tracking-[0.2em] mb-4">
                    {SCHOOL.nama} — {SCHOOL.tahunAjaran}
                  </motion.p>
                  <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="text-sm text-white/40 leading-relaxed">
                    Masukkan NISN dan Tanggal Lahir untuk melihat status kelulusan Ananda.
                  </motion.p>
                </div>

                <motion.form initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} onSubmit={handleSearch} className="space-y-5 relative z-10">
                  <div className="space-y-2 group">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1 group-focus-within:text-amber-400 transition-colors">NISN</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-amber-400 transition-colors" />
                      <input type="text" required value={nisn} onChange={e => setNisn(e.target.value)} className="w-full h-14 pl-12 pr-4 rounded-2xl text-sm font-medium text-white outline-none transition-all placeholder:text-white/20 focus:ring-2 focus:ring-amber-500/30" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)" }} placeholder="Contoh: 0123456789" />
                    </div>
                  </div>
                  <div className="space-y-2 group">
                    <div className="flex items-center justify-between pl-1">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest group-focus-within:text-amber-400 transition-colors">Tanggal Lahir</label>
                      <span className="text-[9px] text-white/20 italic">Bulan / Tanggal / Tahun</span>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-amber-400 transition-colors" />
                      <input type="date" required lang="id-ID" value={tglLahir} onChange={e => setTglLahir(e.target.value)} className="w-full h-14 pl-12 pr-4 rounded-2xl text-sm font-medium text-white outline-none transition-all [color-scheme:dark] focus:ring-2 focus:ring-amber-500/30" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)" }} />
                    </div>
                  </div>
                  <button type="submit" disabled={searching} className="w-full h-14 mt-8 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 relative overflow-hidden group hover:-translate-y-1 active:translate-y-0" style={{ background: "linear-gradient(135deg, #D4A843, #b8860b)", boxShadow: "0 10px 25px -5px rgba(212,168,67,0.4), inset 0 1px 0 rgba(255,255,255,0.2)" }}>
                    <div className="absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[50%] transition-transform duration-1000 ease-in-out" />
                    {searching ? <Loader2 className="w-5 h-5 animate-spin relative z-10" /> : <><span className="relative z-10 drop-shadow-md">Cek Kelulusan</span><ArrowRight size={18} className="relative z-10 drop-shadow-md group-hover:translate-x-1 transition-transform" /></>}
                  </button>
                </motion.form>
              </div>
            </motion.div>
          ) : (
            /* ── RESULT PAGE ── */
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg my-auto relative z-10 space-y-6">
              {lulus && <ConfettiCelebration />}

              {/* Result Card */}
              <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="relative rounded-[2.5rem] overflow-hidden" style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", border: `1px solid ${lulus ? "rgba(212,168,67,0.2)" : "rgba(251,113,133,0.15)"}`, boxShadow: `0 30px 60px rgba(0,0,0,0.5), ${lulus ? "0 0 80px rgba(212,168,67,0.08)" : ""}`, backdropFilter: "blur(40px)" }}>

                {/* Glow */}
                {lulus && <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-[80px] pointer-events-none" />}

                {/* Top badge */}
                <div className={`relative py-10 px-8 text-center ${lulus ? "" : "pb-6"}`}>
                  {lulus && <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />}

                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring", bounce: 0.5 }} className={`relative inline-flex items-center justify-center w-24 h-24 rounded-[2rem] mb-6 ${lulus ? "bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-[0_0_40px_rgba(212,168,67,0.4)]" : "bg-rose-500/10 border border-rose-500/20"}`}>
                    {lulus ? (
                      <CheckCircle className="w-12 h-12 text-white drop-shadow-lg" />
                    ) : (
                      <AlertCircle className="w-12 h-12 text-rose-400" />
                    )}
                  </motion.div>

                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
                    {lulus ? (
                      <>
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <Star size={14} className="text-amber-400 fill-amber-400" />
                          <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em]">Selamat</span>
                          <Star size={14} className="text-amber-400 fill-amber-400" />
                        </div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 mb-2">LULUS</h1>
                        <p className="text-sm text-white/50">Tahun Pelajaran {SCHOOL.tahunAjaran}</p>
                      </>
                    ) : (
                      <>
                        <h1 className="text-2xl font-black text-rose-400 mb-2">Belum Dinyatakan Lulus</h1>
                        <p className="text-sm text-white/40 leading-relaxed">Ananda belum dinyatakan lulus pada periode ini. Silakan hubungi pihak sekolah untuk informasi lebih lanjut.</p>
                      </>
                    )}
                  </motion.div>
                </div>

                {/* Student Info */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }} className="px-8 pb-8 space-y-4">
                  {/* Photo + Name */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-white/5">
                      {fotoUrl ? (
                        <img src={fotoUrl} alt={siswa?.nama} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/20">{siswa?.nama?.charAt(0)}</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-black text-white truncate">{siswa?.nama}</h3>
                      <p className="text-xs text-white/40">NISN: {siswa?.nisn}</p>
                    </div>
                  </div>

                  {/* Detail Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Kelas", value: siswa?.kelas || "-" },
                      { label: "Jenis Kelamin", value: siswa?.jk === "P" ? "Perempuan" : "Laki-laki" },
                      { label: "Tempat Lahir", value: siswa?.tempat_lahir || "-" },
                      { label: "Tanggal Lahir", value: siswa?.tanggal_lahir ? new Date(siswa.tanggal_lahir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-" },
                    ].map(item => (
                      <div key={item.label} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-wider mb-1">{item.label}</p>
                        <p className="text-sm font-bold text-white/80">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Pesan Kelulusan dari admin */}
                  {lulus && pesanKelulusan && (
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                      <p className="text-[10px] font-bold text-amber-400/60 uppercase tracking-widest mb-2">Pesan dari Sekolah</p>
                      <p className="text-sm text-white/60 leading-relaxed italic">&ldquo;{pesanKelulusan}&rdquo;</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-3 pt-2">
                    {lulus && (
                      <>
                        <a href={`/portal/kelulusan/skl/${siswa?.nisn}`} target="_blank" className="w-full h-13 py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #D4A843, #b8860b)", boxShadow: "0 10px 25px -5px rgba(212,168,67,0.3)" }}>
                          <FileCheck size={18} /> Lihat E-SKL Digital
                        </a>
                        <button onClick={handleCetakSKL} className="w-full h-13 py-3.5 rounded-2xl text-sm font-bold text-amber-400/80 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15">
                          <Printer size={18} /> Cetak SKL
                        </button>
                        <a href={`/portal/spmb?nisn=${siswa?.nisn}&tgl=${siswa?.tanggal_lahir || ""}&from=kelulusan`} className="w-full h-13 py-3.5 rounded-2xl text-sm font-bold text-emerald-400 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20">
                          <GraduationCap size={18} /> Langsung Daftar SMP (SPMB)
                          <ArrowRight size={16} />
                        </a>
                      </>
                    )}
                    {!lulus && (
                      <a href={`https://wa.me/62${(SCHOOL.telepon || "").replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="w-full h-13 py-3.5 rounded-2xl text-sm font-bold text-emerald-400 flex items-center justify-center gap-2 transition-all bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20">
                        <Phone size={18} /> Hubungi Sekolah
                      </a>
                    )}
                    <button onClick={() => { setStep("search"); setSiswa(null); setStatusKelulusan(null); }} className="w-full py-3.5 rounded-2xl text-xs font-bold text-white/50 bg-white/5 hover:bg-white/10 transition-all border border-white/5 flex items-center justify-center gap-2">
                      <X size={14} /> Kembali ke Pencarian
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-auto pt-8 text-center relative z-10">
          <p className="text-[10px] text-white/20 font-medium">{SCHOOL.nama} &bull; Portal Pengumuman Kelulusan {SCHOOL.tahunAjaran}</p>
        </div>
      </div>
    </>
  );
}
