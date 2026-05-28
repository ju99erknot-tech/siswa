"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Clock, Sparkles, GraduationCap, Heart, Rocket, Users, Camera,
  Star, Award, Stethoscope, CalendarDays, MapPin,
} from "lucide-react";
import confetti from "canvas-confetti";
import { konversiDirectLink } from "@/lib/gas";

// ── Types ─────────────────────────────────────────────────────
interface SiswaInfo {
  nama: string;
  nisn: string;
  kelas?: string;
  jk?: string;
  foto_url?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
}

interface Milestone {
  id: string;
  judul: string;
  deskripsi?: string;
  foto_url?: string;
  kategori: string;
  kelas_saat_itu?: string;
  tanggal_momen: string;
}

interface SekolahInfo {
  nama_sekolah: string;
  logo_url?: string;
}

// ── Config ────────────────────────────────────────────────────
const KATEGORI_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  Akademik:  { color: "text-cyan-400",    bg: "bg-cyan-500/10",    icon: GraduationCap },
  Prestasi:  { color: "text-amber-400",   bg: "bg-amber-500/10",   icon: Award },
  Kesehatan: { color: "text-emerald-400", bg: "bg-emerald-500/10", icon: Stethoscope },
  Eskul:     { color: "text-violet-400",  bg: "bg-violet-500/10",  icon: Rocket },
  Sosial:    { color: "text-pink-400",    bg: "bg-pink-500/10",    icon: Users },
  Momen:     { color: "text-sky-400",     bg: "bg-sky-500/10",     icon: Camera },
};

const KELAS_LABELS: Record<string, string> = {
  "1": "Kelas 1", "1A": "Kelas 1", "1B": "Kelas 1", "1C": "Kelas 1",
  "2": "Kelas 2", "2A": "Kelas 2", "2B": "Kelas 2", "2C": "Kelas 2",
  "3": "Kelas 3", "3A": "Kelas 3", "3B": "Kelas 3", "3C": "Kelas 3",
  "4": "Kelas 4", "4A": "Kelas 4", "4B": "Kelas 4", "4C": "Kelas 4",
  "5": "Kelas 5", "5A": "Kelas 5", "5B": "Kelas 5", "5C": "Kelas 5",
  "6": "Kelas 6", "6A": "Kelas 6", "6B": "Kelas 6", "6C": "Kelas 6",
  "I A": "Kelas 1", "I B": "Kelas 1", "II A": "Kelas 2", "II B": "Kelas 2",
  "III A": "Kelas 3", "III B": "Kelas 3", "IV A": "Kelas 4", "IV B": "Kelas 4",
  "V A": "Kelas 5", "V B": "Kelas 5", "VI A": "Kelas 6", "VI B": "Kelas 6",
};

function getKelasGroup(kelas?: string): string {
  if (!kelas) return "Momen Lainnya";
  return KELAS_LABELS[kelas.trim()] || KELAS_LABELS[kelas.trim().charAt(0)] || "Momen Lainnya";
}

const KELAS_ORDER = ["Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6", "Momen Lainnya"];

function getFotoUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.includes("drive.google.com") || url.includes("googleusercontent.com")) {
    return konversiDirectLink(url);
  }
  if (url.startsWith("http")) return url;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${url}`;
}

// ── Particle Background ───────────────────────────────────────
const particles = Array.from({ length: 25 }).map((_, i) => ({
  left: `${(i * 19) % 100}%`,
  top: `${(i * 29) % 100}%`,
  size: (i % 3) + 1,
  duration: (i % 5) + 5,
  delay: (i % 4),
  yOffset: -((i % 40) + 30),
  opacity: (i % 4) * 0.08 + 0.2,
}));

// ── Main Page Component ───────────────────────────────────────
export default function KapsulWaktuPortalPage() {
  const params = useParams();
  const nisn = params.nisn as string;

  const [siswa, setSiswa] = useState<SiswaInfo | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [sekolah, setSekolah] = useState<SekolahInfo>({ nama_sekolah: "Sekolah Dasar" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ── Fetch Data ──────────────────────────────────────────────
  useEffect(() => {
    if (!nisn) return;
    (async () => {
      try {
        setLoading(true);
        const [siswaRes, momenRes, settingRes] = await Promise.all([
          supabase.from("siswa").select("nama, nisn, kelas, jk, foto_url, tempat_lahir, tanggal_lahir").eq("nisn", nisn).single(),
          supabase.from("kapsul_waktu").select("*").eq("nisn", nisn).order("tanggal_momen", { ascending: true }),
          supabase.from("pengaturan").select("nama_sekolah, logo_url").single(),
        ]);

        if (siswaRes.error || !siswaRes.data) {
          setError("Siswa tidak ditemukan");
          return;
        }
        setSiswa(siswaRes.data);
        setMilestones((momenRes.data ?? []) as Milestone[]);
        if (settingRes.data) setSekolah(settingRes.data);
      } catch {
        setError("Terjadi kesalahan saat memuat data");
      } finally {
        setLoading(false);
      }
    })();
  }, [nisn]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Confetti on Load ────────────────────────────────────────
  useEffect(() => {
    if (!loading && siswa && milestones.length > 0) {
      const timer = setTimeout(() => {
        confetti({ particleCount: 80, spread: 90, origin: { y: 0.3 }, colors: ["#8b5cf6", "#06b6d4", "#f59e0b", "#ec4899"] });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [loading, siswa, milestones]);

  // ── Group milestones by kelas ───────────────────────────────
  const grouped = useMemo(() => {
    const groups: Record<string, Milestone[]> = {};
    milestones.forEach(m => {
      const group = getKelasGroup(m.kelas_saat_itu);
      if (!groups[group]) groups[group] = [];
      groups[group].push(m);
    });
    return KELAS_ORDER.filter(k => groups[k]).map(k => ({ label: k, items: groups[k] }));
  }, [milestones]);

  const totalYears = useMemo(() => {
    if (milestones.length === 0) return 0;
    const years = new Set(milestones.map(m => new Date(m.tanggal_momen).getFullYear()));
    return years.size;
  }, [milestones]);

  const totalKategori = useMemo(() => {
    return new Set(milestones.map(m => m.kategori)).size;
  }, [milestones]);

  // ── Loading State ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050811] flex flex-col items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: "radial-gradient(circle at 30% 30%, #8b5cf6, #06b6d4, #000)", boxShadow: "0 0 60px rgba(139,92,246,0.4)" }}
        >
          <Clock className="text-white" size={28} />
        </motion.div>
        <p className="text-white/40 font-mono text-sm tracking-widest">Membuka Kapsul Waktu...</p>
      </div>
    );
  }

  // ── Error / Not Found ───────────────────────────────────────
  if (error || !siswa) {
    return (
      <div className="min-h-screen bg-[#050811] flex flex-col items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <Clock className="text-red-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Kapsul Tidak Ditemukan</h1>
          <p className="text-white/40 text-sm">{error || "NISN tidak valid atau data siswa tidak tersedia."}</p>
        </motion.div>
      </div>
    );
  }

  const fotoSiswa = getFotoUrl(siswa.foto_url);

  return (
    <div className="min-h-screen bg-[#050811] relative overflow-hidden">
      {/* ═══ Background Effects ═══ */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Perspective Grid */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `linear-gradient(rgba(139,92,246,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.3) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }} />
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/4 w-[60%] h-[50%] rounded-full opacity-[0.1] blur-[120px]" style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
        <div className="absolute bottom-0 right-1/4 w-[50%] h-[40%] rounded-full opacity-[0.06] blur-[100px]" style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }} />
        {/* Floating Particles */}
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute bg-cyan-400 rounded-full mix-blend-screen"
            style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
            animate={{ y: [0, p.yOffset], opacity: [0, p.opacity, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* ═══ Content ═══ */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 md:py-20">

        {/* ── Header: Student Profile ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          {/* Photo */}
          <motion.div
            className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-8"
            whileHover={{ scale: 1.05, rotateY: 5 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-violet-500 via-cyan-400 to-violet-500 opacity-70 blur-sm animate-pulse" />
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-violet-500 via-cyan-400 to-violet-500" />
            {fotoSiswa ? (
              <img src={fotoSiswa} alt={siswa.nama} className="relative w-full h-full rounded-full object-cover border-4 border-[#050811]" />
            ) : (
              <div className="relative w-full h-full rounded-full bg-[#0a0f1e] border-4 border-[#050811] flex items-center justify-center">
                <GraduationCap className="text-violet-400" size={48} />
              </div>
            )}
            {/* Sparkle */}
            <motion.div
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400/80 flex items-center justify-center shadow-lg shadow-amber-500/30"
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <Star size={14} className="text-white" />
            </motion.div>
          </motion.div>

          {/* Name */}
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3" style={{ textShadow: "0 0 40px rgba(139,92,246,0.3)" }}>
            {siswa.nama}
          </h1>

          {/* Meta */}
          <div className="flex items-center justify-center gap-3 text-white/30 text-sm font-mono mb-2">
            <span>NISN {siswa.nisn}</span>
            <span className="text-white/10">•</span>
            <span>{siswa.kelas || "-"}</span>
          </div>
          <p className="text-white/20 text-xs uppercase tracking-[0.2em]">{sekolah.nama_sekolah}</p>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex items-center justify-center gap-6 mt-8"
          >
            {[
              { label: "Momen", value: milestones.length, icon: Camera },
              { label: "Tahun", value: totalYears, icon: CalendarDays },
              { label: "Kategori", value: totalKategori, icon: Sparkles },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1 px-5 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <stat.icon size={14} className="text-violet-400 mb-1" />
                <span className="text-xl font-black text-white">{stat.value}</span>
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Empty State ──────────────────────────────────────── */}
        {milestones.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Clock size={48} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm">Belum ada momen yang terekam untuk siswa ini.</p>
          </motion.div>
        )}

        {/* ── Timeline ─────────────────────────────────────────── */}
        {grouped.map((group, groupIdx) => (
          <div key={group.label} className="mb-16">
            {/* Group Header / Class Divider */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-4 mb-10"
            >
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                <GraduationCap size={18} className="text-violet-400" />
                <span className="text-sm font-black text-violet-300 uppercase tracking-widest">{group.label}</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-violet-500/30 to-transparent" />
            </motion.div>

            {/* Timeline Items */}
            <div className="relative">
              {/* Vertical Glowing Line */}
              <div className="absolute left-6 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5">
                <div className="w-full h-full bg-gradient-to-b from-violet-500/40 via-cyan-500/30 to-violet-500/10 rounded-full" />
                <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-violet-500/20 via-cyan-500/15 to-transparent blur-sm" />
              </div>

              {group.items.map((milestone, idx) => {
                const isLeft = idx % 2 === 0;
                const cfg = KATEGORI_CONFIG[milestone.kategori] || KATEGORI_CONFIG["Momen"];
                const Icon = cfg.icon;
                const foto = getFotoUrl(milestone.foto_url);

                return (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, x: isLeft ? -40 : 40, y: 20 }}
                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6, delay: idx * 0.08, ease: "easeOut" }}
                    className={`relative flex items-start gap-4 mb-10 md:mb-14 ${
                      // Mobile: always right of line. Desktop: alternate
                      "pl-16 md:pl-0"
                    } ${isLeft ? "md:flex-row-reverse" : "md:flex-row"}`}
                  >
                    {/* Timeline Node */}
                    <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-2 z-20">
                      <div className="relative">
                        <div className={`w-5 h-5 rounded-full border-2 border-[#050811] ${cfg.bg.replace("/10", "/60")} flex items-center justify-center`} style={{ boxShadow: `0 0 12px ${cfg.color.includes("cyan") ? "rgba(34,211,238,0.4)" : cfg.color.includes("violet") ? "rgba(139,92,246,0.4)" : cfg.color.includes("amber") ? "rgba(245,158,11,0.4)" : cfg.color.includes("emerald") ? "rgba(16,185,129,0.4)" : cfg.color.includes("pink") ? "rgba(236,72,153,0.4)" : "rgba(56,189,248,0.4)"}` }}>
                          <div className="w-2 h-2 rounded-full bg-white/80" />
                        </div>
                      </div>
                    </div>

                    {/* Spacer for desktop layout */}
                    <div className="hidden md:block md:w-1/2" />

                    {/* Card */}
                    <div className="w-full md:w-[calc(50%-2rem)]">
                      <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="relative rounded-2xl overflow-hidden group"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
                      >
                        {/* Top Glow Line */}
                        <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent ${cfg.color.includes("cyan") ? "via-cyan-400" : cfg.color.includes("violet") ? "via-violet-400" : cfg.color.includes("amber") ? "via-amber-400" : cfg.color.includes("emerald") ? "via-emerald-400" : cfg.color.includes("pink") ? "via-pink-400" : "via-sky-400"} to-transparent opacity-40 group-hover:opacity-80 transition-opacity`} />

                        {/* Photo */}
                        {foto && (
                          <div className="relative overflow-hidden">
                            <img src={foto} alt={milestone.judul} className="w-full h-48 md:h-56 object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-transparent to-transparent" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-5 md:p-6">
                          {/* Kategori Badge + Date */}
                          <div className="flex items-center justify-between mb-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
                              <Icon size={11} />
                              {milestone.kategori}
                            </span>
                            <span className="text-[11px] font-mono text-white/30">
                              {format(new Date(milestone.tanggal_momen), "dd MMM yyyy", { locale: idLocale })}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-lg font-bold text-white mb-2 leading-snug">{milestone.judul}</h3>

                          {/* Description */}
                          {milestone.deskripsi && (
                            <p className="text-sm text-white/45 leading-relaxed">{milestone.deskripsi}</p>
                          )}

                          {/* Kelas tag */}
                          {milestone.kelas_saat_itu && (
                            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-white/20 font-mono">
                              <MapPin size={10} />
                              Kelas {milestone.kelas_saat_itu}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {/* ── Footer ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center pt-12 pb-8 border-t border-white/5"
        >
          {/* Decorative Stars */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-6 relative"
          >
            <div className="absolute inset-0 rounded-full border border-violet-500/20 border-dashed" />
            <div className="absolute inset-2 rounded-full border border-cyan-500/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Heart className="text-pink-400/60" size={20} />
            </div>
          </motion.div>

          <p className="text-white/30 text-sm italic mb-2 max-w-md mx-auto leading-relaxed">
            &quot;Setiap momen adalah bintang dalam perjalanan belajarmu. Teruslah bersinar!&quot;
          </p>
          <p className="text-white/15 text-xs mt-4 uppercase tracking-[0.2em]">{sekolah.nama_sekolah}</p>
          <p className="text-white/10 text-[10px] mt-2 font-mono">
            Dibuat dengan <Heart size={10} className="inline text-pink-400/40 mx-0.5" /> oleh Portal Kesiswaan Aurora
          </p>
        </motion.div>
      </div>
    </div>
  );
}
