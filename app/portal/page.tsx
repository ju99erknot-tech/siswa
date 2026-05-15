"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Trophy,
  Activity,
  BookOpen,
  Calendar,
  ShieldCheck,
  Wallet,
  MessageSquare,
  ChevronRight,
  QrCode,
  Search,
  Sparkles,
  Bell,
  LayoutDashboard,
  Clock,
  GraduationCap,
  X,
  MapPin,
  Image,
  Contact,
  FileBarChart,
  Eye,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DynamicIsland } from "@/components/shared/DynamicIsland";
import VirtualPass from "@/components/siswa/VirtualPass";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { getGreeting, getFotoPublic } from "@/lib/utils";
import { SCHOOL, BRAND } from "@/lib/school.config";
import type { Siswa } from "@/types";

export default function PortalOrangTua() {
  const [siswa, setSiswa] = useState<Siswa | null>(null);
  const [todayStatus, setTodayStatus] = useState<string | null>(null);
  const [prestasi, setPrestasi] = useState<
    {
      id: string;
      nama: string;
      jenis_lomba?: string;
      tingkat?: string;
      peringkat?: string;
      tanggal_lomba?: string;
    }[]
  >([]);
  const [absensi, setAbsensi] = useState<{
    hadir: number;
    sakit: number;
    izin: number;
    alpha: number;
    total: number;
  }>({ hadir: 0, sakit: 0, izin: 0, alpha: 0, total: 0 });
  const [mutasi, setMutasi] = useState<Record<string, unknown> | null>(null);
  const [absensiRecords, setAbsensiRecords] = useState<
    { tanggal: string; status: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [showPass, setShowPass] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  const switchTab = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    // Force enable scroll for portal
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();

        // Cek login via localStorage (untuk Orang Tua)
        const portalSiswaId = localStorage.getItem("portal_siswa_id");
        const portalRole = localStorage.getItem("portal_role");

        let targetId = portalSiswaId;

        // Jika tidak ada di localStorage, cek auth session
        if (!targetId || portalRole !== "orangtua") {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            router.push("/login");
            return;
          }
          // Admin/guru tidak diperbolehkan mengakses portal orang tua
          const role = (user.user_metadata?.role as string) || "";
          if (role === "admin" || role === "guru") {
            router.push("/");
            return;
          }
          // Tidak ada sesi orangtua yang valid
          router.push("/login");
          return;
        }

        if (!targetId) {
          setLoading(false);
          return;
        }

        // Fetch Siswa first to get nisn/nama for related queries
        const siswaRes = await supabase
          .from("siswa")
          .select("*")
          .eq("id", targetId)
          .single();
        if (siswaRes.error) throw siswaRes.error;
        const siswaData = siswaRes.data;
        setSiswa(siswaData);

        // Fetch related data using actual siswa nisn/nama
        const [prestasiRes, mMasukRes, mKeluarRes, absensiRes] =
          await Promise.all([
            supabase
              .from("prestasi")
              .select("*")
              .or(`nisn.eq.${siswaData.nisn},nama.eq.${siswaData.nama}`)
              .order("created_at", { ascending: false })
              .limit(10),
            supabase
              .from("mutasi_masuk")
              .select("*")
              .eq("nisn", siswaData.nisn)
              .maybeSingle(),
            supabase
              .from("mutasi_keluar")
              .select("*")
              .eq("nisn", siswaData.nisn)
              .maybeSingle(),
            supabase
              .from("absensi")
              .select("status,tanggal")
              .eq("siswa_id", targetId)
              .order("tanggal", { ascending: false })
              .limit(120),
          ]);

        // Fetch status kehadiran hari ini
        const today = new Date().toISOString().split("T")[0];
        const todayAbsensiRes = await supabase
          .from("absensi")
          .select("status")
          .eq("siswa_id", targetId)
          .eq("tanggal", today)
          .single();
        setTodayStatus(todayAbsensiRes.data?.status || null);

        setPrestasi(prestasiRes.data || []);
        setMutasi(mMasukRes.data || mKeluarRes.data || null);

        // Calendar records
        if (absensiRes.data) {
          setAbsensiRecords(
            absensiRes.data as { tanggal: string; status: string }[],
          );
        }
        // Calculate absensi stats
        if (absensiRes.data) {
          const abs = absensiRes.data as { status: string }[];
          setAbsensi({
            hadir: abs.filter((a) => a.status === "H").length,
            sakit: abs.filter((a) => a.status === "S").length,
            izin: abs.filter((a) => a.status === "I").length,
            alpha: abs.filter((a) => a.status === "A").length,
            total: abs.length,
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat data portal");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    localStorage.removeItem("portal_siswa_id");
    localStorage.removeItem("portal_role");
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050811]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin shadow-[0_0_20px_rgba(139,92,246,0.3)]" />
          <p className="text-sm font-bold text-white/50 animate-pulse tracking-widest uppercase">
            Menghubungkan...
          </p>
        </div>
      </div>
    );

  if (!siswa)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050811] p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.1)_0%,transparent_50%)] pointer-events-none" />
        <div
          className="p-8 max-w-md text-center rounded-3xl relative z-10"
          style={{
            background: "rgba(13,18,33,0.80)",
            border: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="w-20 h-20 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
            <ShieldCheck size={36} />
          </div>
          <h2 className="text-xl font-black text-white mb-2">
            Data Tidak Ditemukan
          </h2>
          <p className="text-sm text-white/40 mb-8 leading-relaxed">
            Maaf, akun Anda belum tertaut dengan data siswa mana pun. Silakan
            hubungi admin sekolah.
          </p>
          <button
            onClick={handleLogout}
            className="btn-secondary w-full h-12 flex items-center justify-center font-bold"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );

  return (
    <div className="relative min-h-screen bg-[#050811] text-white font-sans selection:bg-violet-500/30 selection:text-violet-200 overflow-y-auto">
      <DynamicIsland />

      {/* ── Top Header ─────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-[100] transition-all duration-300 px-6 h-20 flex items-center justify-between ${scrolled ? "bg-[#050811]/90 backdrop-blur-2xl" : "bg-transparent"}`}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #22d3ee)",
              boxShadow: "0 4px 20px rgba(139,92,246,0.35)",
            }}
          >
            <GraduationCap size={20} className="fill-white" />
          </div>
          <div className="hidden sm:block">
            <h2 className="text-sm font-black tracking-tight leading-none uppercase text-white/90">
              {BRAND.appName}
            </h2>
            <p className="text-[10px] text-white/40 font-bold tracking-[0.2em] mt-0.5 uppercase">
              {SCHOOL.nama}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => switchTab("home")}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-colors relative"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Bell size={18} />
            {(prestasi.length > 0 || absensi.alpha > 0) && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
            )}
          </button>
          <button
            onClick={() => setShowPass(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <QrCode size={18} />
          </button>
          <button
            onClick={() => switchTab("profile")}
            className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 cursor-pointer"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            {getFotoPublic(siswa.foto_url) ? (
              <img
                src={getFotoPublic(siswa.foto_url)!}
                alt={siswa.nama}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30">
                <User size={18} />
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Ambient background decoration */}
      <div className="fixed top-0 inset-x-0 h-screen pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-[0.08]"
          style={{
            background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
        />
      </div>

      {/* ── Main Content ───────────────────────────────── */}
      <main className="max-w-xl mx-auto px-6 pt-28 pb-20 space-y-8 relative z-10">
        {/* ═══ HOME TAB ═══ */}
        {activeTab === "home" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
            {/* Greeting Section */}
            <section>
              <div className="flex items-center gap-2 text-violet-400 mb-3">
                <Sparkles size={14} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                  {getGreeting()}
                </span>
              </div>
              <h1 className="text-[2.2rem] font-black tracking-tight leading-[1.1]">
                Pantau Progres <br />
                <span
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, #c4b5fd 0%, #67e8f9 100%)",
                  }}
                >
                  Ananda {siswa.nama}
                </span>
              </h1>
            </section>

            {/* Momen Ananda (Stories Style) */}
            {/* TODO: Replace with real activity/momen data fetched from Supabase */}
            {/* Section hidden until real data is available */}

            {/* Live Presence Tracker */}
            <section className="relative group">
              <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div
                className="relative rounded-[2rem] p-5 flex items-center justify-between gap-4 overflow-hidden"
                style={{
                  background: "rgba(16,24,40,0.4)",
                  border: "1px solid rgba(52,211,153,0.1)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative">
                    <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#050811] animate-ping" />
                    <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#050811]" />
                    <MapPin size={22} className="text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white/90 uppercase tracking-wider">
                      Status Sekarang
                    </h4>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      {todayStatus === "H" ? (
                        <>
                          Ananda berada di{" "}
                          <span className="text-emerald-400 font-bold">
                            Sekolah
                          </span>
                        </>
                      ) : todayStatus === "S" ? (
                        <>
                          Ananda{" "}
                          <span className="text-amber-400 font-bold">
                            Sakit
                          </span>{" "}
                          hari ini
                        </>
                      ) : todayStatus === "I" ? (
                        <>
                          Ananda{" "}
                          <span className="text-blue-400 font-bold">Izin</span>{" "}
                          hari ini
                        </>
                      ) : todayStatus === "A" ? (
                        <>
                          Ananda{" "}
                          <span className="text-rose-400 font-bold">
                            Tidak Hadir
                          </span>{" "}
                          hari ini
                        </>
                      ) : (
                        "Belum ada data kehadiran hari ini"
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-white/20 uppercase">
                    Scan Terakhir
                  </p>
                  <p className="text-sm font-black text-emerald-400">
                    {new Date().toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    WIB
                  </p>
                </div>
              </div>
            </section>

            {/* Quick Summary Grid */}
            <section className="grid grid-cols-2 gap-4">
              <SummaryCard
                label="Kehadiran"
                value={
                  absensi.total > 0
                    ? `${Math.round((absensi.hadir / absensi.total) * 100)}%`
                    : "—"
                }
                sub={
                  absensi.total > 0
                    ? `${absensi.hadir} dari ${absensi.total} hari`
                    : "Belum ada data"
                }
                icon={Activity}
                color="#34d399"
                trend={
                  absensi.alpha === 0 ? "Sempurna" : `${absensi.alpha} alpha`
                }
                bg="rgba(52,211,153,0.1)"
              />
              <SummaryCard
                label="Prestasi"
                value={String(prestasi.length)}
                sub={
                  prestasi.length > 0
                    ? prestasi[0].jenis_lomba || "Terbaru"
                    : "Belum ada"
                }
                icon={Trophy}
                color="#fbbf24"
                trend={prestasi.length > 0 ? prestasi[0].peringkat || "" : ""}
                bg="rgba(251,191,36,0.1)"
              />
            </section>

            {/* Action Carousel / Grid */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-white/40">
                  Akses Cepat
                </h3>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <ActionButton
                  icon={Calendar}
                  label="Izin"
                  color="#fb7185"
                  onClick={() =>
                    toast.info("Fitur Surat Izin akan segera tersedia")
                  }
                />
                <ActionButton
                  icon={Wallet}
                  label="Bayar"
                  color="#60a5fa"
                  onClick={() =>
                    toast.info("Fitur Pembayaran akan segera tersedia")
                  }
                />
                <ActionButton
                  icon={BookOpen}
                  label="Rapor"
                  color="#a78bfa"
                  onClick={() =>
                    toast.info("Fitur Lihat Rapor akan segera tersedia")
                  }
                />
                <ActionButton
                  icon={MessageSquare}
                  label="Konsul"
                  color="#fb923c"
                  onClick={() => {
                    const phone = SCHOOL.telepon?.replace(/[^0-9]/g, "") || "";
                    if (phone)
                      window.open(`https://wa.me/62${phone}`, "_blank");
                    else toast.info("Nomor telepon sekolah belum tersedia");
                  }}
                />
              </div>
            </section>

            {/* Recent Updates / Feed */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-white/40">
                Update Terbaru
              </h3>
              <div className="space-y-3">
                {prestasi.length > 0 ? (
                  prestasi
                    .slice(0, 3)
                    .map((p) => (
                      <TimelineItem
                        key={p.id}
                        icon={Trophy}
                        title={p.jenis_lomba || "Prestasi"}
                        time={p.tanggal_lomba || "—"}
                        desc={`${p.peringkat || "Partisipasi"} — Tingkat ${p.tingkat || "Sekolah"}`}
                        color="#fbbf24"
                      />
                    ))
                ) : (
                  <div className="text-center py-6">
                    <Trophy className="w-6 h-6 text-white/10 mx-auto mb-2" />
                    <p className="text-xs text-white/20">
                      Belum ada prestasi tercatat
                    </p>
                  </div>
                )}
                {absensi.sakit > 0 && (
                  <TimelineItem
                    icon={Activity}
                    title={`${absensi.sakit}x Sakit`}
                    time="Periode ini"
                    desc={`Siswa tercatat ${absensi.sakit} kali sakit periode ini.`}
                    color="#f59e0b"
                  />
                )}
                {absensi.alpha > 0 && (
                  <TimelineItem
                    icon={Activity}
                    title={`${absensi.alpha}x Alpha`}
                    time="Perlu perhatian"
                    desc={`Siswa tercatat ${absensi.alpha} kali tidak hadir tanpa keterangan.`}
                    color="#f43f5e"
                  />
                )}
              </div>
            </section>
          </div>
        )}

        {/* ═══ ACADEMIC TAB ═══ */}
        {activeTab === "academic" && (
          <>
            <section>
              <h2 className="text-xl font-black text-white/90 mb-1">
                Akademik
              </h2>
              <p className="text-xs text-white/40">
                {SCHOOL.nama} — {SCHOOL.tahunAjaran}
              </p>
            </section>

            {/* Kalender Kehadiran Visual */}
            <section
              className="rounded-3xl p-5"
              style={{
                background: "rgba(13,18,33,0.6)",
                border: "1px solid rgba(255,255,255,0.05)",
                backdropFilter: "blur(20px)",
              }}
            >
              <h3 className="text-sm font-black text-white/80 mb-4">
                📅 Kalender Kehadiran
              </h3>
              {/* Legend */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                {[
                  { color: "#34d399", label: "Hadir" },
                  { color: "#fbbf24", label: "Sakit" },
                  { color: "#60a5fa", label: "Izin" },
                  { color: "#f43f5e", label: "Alpha" },
                  { color: "rgba(255,255,255,0.06)", label: "Libur/Kosong" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ background: l.color }}
                    />
                    <span className="text-[10px] text-white/40">{l.label}</span>
                  </div>
                ))}
              </div>
              {/* 2-month calendar */}
              {[-1, 0].map((monthOffset) => {
                const d = new Date();
                d.setDate(1);
                d.setMonth(d.getMonth() + monthOffset);
                const y = d.getFullYear(),
                  m = d.getMonth();
                const firstDay = d.getDay(),
                  daysInMonth = new Date(y, m + 1, 0).getDate();
                const monthLabel = d.toLocaleDateString("id-ID", {
                  month: "long",
                  year: "numeric",
                });
                const STATUS_COLOR: Record<string, string> = {
                  H: "#34d399",
                  S: "#fbbf24",
                  I: "#60a5fa",
                  A: "#f43f5e",
                };
                return (
                  <div key={monthOffset} className="mb-4">
                    <p className="text-[10px] font-bold text-white/40 mb-2 uppercase tracking-wider">
                      {monthLabel}
                    </p>
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(
                        (d2) => (
                          <div
                            key={d2}
                            className="text-center text-[9px] text-white/20 font-bold"
                          >
                            {d2}
                          </div>
                        ),
                      )}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: firstDay }, (_, i) => (
                        <div key={`e${i}`} className="aspect-square" />
                      ))}
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const rec = absensiRecords.find(
                          (r) => r.tanggal === dateStr,
                        );
                        const isToday =
                          dateStr === new Date().toISOString().split("T")[0];
                        const isWeekend = [0, 6].includes(
                          new Date(y, m, day).getDay(),
                        );
                        const bg = rec
                          ? STATUS_COLOR[rec.status]
                          : isWeekend
                            ? "rgba(255,255,255,0.03)"
                            : "rgba(255,255,255,0.06)";
                        return (
                          <div
                            key={day}
                            className="aspect-square rounded-md flex items-center justify-center text-[10px] font-bold relative"
                            style={{
                              background: bg,
                              color: rec
                                ? "white"
                                : isToday
                                  ? "#a78bfa"
                                  : "rgba(255,255,255,0.3)",
                              boxShadow: isToday
                                ? "0 0 0 1.5px #8b5cf6"
                                : undefined,
                            }}
                          >
                            {day}
                            {isToday && (
                              <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Absensi Detail */}
            <section
              className="rounded-3xl p-6"
              style={{
                background: "rgba(13,18,33,0.6)",
                border: "1px solid rgba(255,255,255,0.05)",
                backdropFilter: "blur(20px)",
              }}
            >
              <h3 className="text-sm font-black text-white/80 mb-5">
                Rekap Kehadiran
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Hadir", value: absensi.hadir, color: "#34d399" },
                  { label: "Sakit", value: absensi.sakit, color: "#fbbf24" },
                  { label: "Izin", value: absensi.izin, color: "#60a5fa" },
                  { label: "Alpha", value: absensi.alpha, color: "#f43f5e" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="text-center p-3 rounded-2xl"
                    style={{
                      background: `${item.color}10`,
                      border: `1px solid ${item.color}20`,
                    }}
                  >
                    <p
                      className="text-2xl font-black"
                      style={{ color: item.color }}
                    >
                      {item.value}
                    </p>
                    <p className="text-[9px] font-bold text-white/40 uppercase mt-1">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Prestasi List */}
            <section
              className="rounded-3xl p-6"
              style={{
                background: "rgba(13,18,33,0.6)",
                border: "1px solid rgba(255,255,255,0.05)",
                backdropFilter: "blur(20px)",
              }}
            >
              <h3 className="text-sm font-black text-white/80 mb-5">
                Daftar Prestasi
              </h3>
              {prestasi.length > 0 ? (
                <div className="space-y-3">
                  {prestasi.map((p, i) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-4 p-3 rounded-xl"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-xs">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white/80 truncate">
                          {p.jenis_lomba || p.nama}
                        </p>
                        <p className="text-[10px] text-white/30">
                          {p.peringkat || "Partisipasi"} • Tingkat{" "}
                          {p.tingkat || "Sekolah"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-8 h-8 text-white/10 mx-auto mb-3" />
                  <p className="text-xs text-white/25">
                    Belum ada prestasi tercatat.
                  </p>
                </div>
              )}
            </section>
          </>
        )}

        {/* ═══ FINANCE TAB ═══ */}
        {activeTab === "finance" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <section>
              <h2 className="text-xl font-black text-white/90 mb-1">
                Keuangan & SPP
              </h2>
              <p className="text-xs text-white/40">
                Sistem Keuangan Digital {SCHOOL.nama}
              </p>
            </section>

            {/* Virtual Card Preview */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="w-full aspect-[1.6/1] rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group shadow-2xl mt-4"
              style={{
                background:
                  "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #4f46e5 100%)",
                boxShadow:
                  "0 20px 40px rgba(14, 165, 233, 0.3), inset 0 1px 0 rgba(255,255,255,0.3)",
              }}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-white/70 text-[10px] uppercase tracking-widest font-bold">
                    Virtual e-Money
                  </p>
                  <h4 className="text-xl font-black text-white mt-1 tracking-wider">
                    {SCHOOL.nama}
                  </h4>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="relative z-10">
                <p className="text-white/60 text-[10px] uppercase tracking-widest mb-1">
                  Saldo Tabungan
                </p>
                <p className="text-3xl font-black text-white tracking-tight drop-shadow-md">
                  — —
                </p>
              </div>

              <div className="flex justify-between items-end relative z-10">
                <div>
                  <p className="text-white/50 text-[9px] uppercase tracking-widest">
                    Pemegang Kartu
                  </p>
                  <p className="text-white font-bold tracking-widest uppercase mt-0.5">
                    {siswa.nama}
                  </p>
                </div>
                <p className="text-white/70 font-mono text-xs tracking-widest">
                  {siswa.nisn || "0000000000"}
                </p>
              </div>
            </motion.div>

            {/* Coming Soon Notice */}
            <div
              className="rounded-[2rem] p-8 text-center relative overflow-hidden"
              style={{
                background: "rgba(13,18,33,0.6)",
                border: "1px solid rgba(255,255,255,0.05)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                  <Wallet size={28} className="text-violet-400" />
                </div>
                <h3 className="text-base font-black text-white/80 mb-2">
                  Segera Hadir
                </h3>
                <p className="text-xs text-white/30 leading-relaxed max-w-xs mx-auto">
                  Modul keuangan digital sedang dalam pengembangan. Fitur
                  pembayaran SPP, tabungan siswa, dan riwayat transaksi akan
                  tersedia segera.
                </p>
                <div className="mt-5 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-violet-400/60 uppercase tracking-widest">
                    Dalam Pengembangan
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ PROFILE TAB ═══ */}
        {activeTab === "profile" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <section className="flex flex-col items-center text-center py-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-violet-500/20 blur-2xl rounded-full group-hover:bg-violet-500/30 transition-all" />
                <div className="relative w-28 h-28 rounded-[2rem] overflow-hidden border-2 border-white/10 mb-4 bg-[#0a0f1e] shadow-2xl">
                  {getFotoPublic(siswa.foto_url) ? (
                    <img
                      src={getFotoPublic(siswa.foto_url)!}
                      alt={siswa.nama}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      <User size={48} />
                    </div>
                  )}
                </div>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {siswa.nama}
              </h2>
              <p className="text-xs font-bold text-violet-400/80 uppercase tracking-widest mt-1">
                NISN: {siswa.nisn} • Kelas {siswa.kelas || "-"}
              </p>
            </section>

            {/* Info Detail Card */}
            <section
              className="rounded-[2.5rem] p-8 space-y-6 overflow-hidden relative"
              style={{
                background: "rgba(13,18,33,0.4)",
                border: "1px solid rgba(255,255,255,0.05)",
                backdropFilter: "blur(40px)",
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black text-lg text-white/90 tracking-tight">
                  Detail Data Ananda
                </h3>
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <ShieldCheck size={16} className="text-emerald-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1">
                <InfoDetailRow
                  label="NISN / NIS"
                  value={`${siswa.nisn} / ${siswa.nis || "-"}`}
                />
                <InfoDetailRow
                  label="Tempat, Tgl Lahir"
                  value={`${siswa.tempat_lahir || "-"}, ${siswa.tanggal_lahir || "-"}`}
                />
                <InfoDetailRow
                  label="Jenis Kelamin"
                  value={siswa.jk === "L" ? "Laki-laki" : "Perempuan"}
                />
                <InfoDetailRow label="Agama" value={siswa.agama} />
                <InfoDetailRow label="Alamat" value={siswa.alamat} />
                <InfoDetailRow label="Nama Ayah" value={siswa.nama_ayah} />
                <InfoDetailRow label="Nama Ibu" value={siswa.nama_ibu} />
                <InfoDetailRow label="No. WA Wali" value={siswa.no_wa} />
              </div>

              <div className="pt-4">
                <button
                  onClick={() =>
                    toast.info(
                      "Fitur pengajuan perubahan data akan segera tersedia.",
                    )
                  }
                  className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group active:scale-95"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(139,92,246,0.1) 0%, rgba(34,211,238,0.1) 100%)",
                    color: "#c4b5fd",
                    border: "1px solid rgba(139,92,246,0.2)",
                  }}
                >
                  Ajukan Koreksi Data{" "}
                  <ChevronRight
                    size={14}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              </div>
            </section>

            {/* Document Vault */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  Digital Vault
                </h3>
                <span className="text-[10px] font-bold text-violet-400 flex items-center gap-1">
                  Encrypted <ShieldCheck size={10} />
                </span>
              </div>
              {/* Cek apakah ada minimal 1 dokumen yang sudah di-upload */}
              {[siswa.url_akta, siswa.url_kk, siswa.url_ijazah].some(
                Boolean,
              ) ? (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      name: "Akta Kelahiran",
                      type: "Dokumen",
                      icon: FileText,
                      color: "#fb7185",
                      url: siswa.url_akta,
                    },
                    {
                      name: "Kartu Keluarga",
                      type: "Dokumen",
                      icon: FileText,
                      color: "#22d3ee",
                      url: siswa.url_kk,
                    },
                    {
                      name: "Ijazah Terakhir",
                      type: "Dokumen",
                      icon: GraduationCap,
                      color: "#8b5cf6",
                      url: siswa.url_ijazah,
                    },
                  ]
                    .filter((doc) => doc.url)
                    .map((doc, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          window.open(
                            doc.url?.includes("http")
                              ? doc.url
                              : `https://drive.google.com/open?id=${doc.url}`,
                            "_blank",
                          )
                        }
                        className="p-4 rounded-2xl flex flex-col gap-3 text-left transition-all hover:scale-[1.02] active:scale-95 group relative overflow-hidden"
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                          style={{
                            background: `linear-gradient(45deg, transparent, ${doc.color})`,
                          }}
                        />
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center relative z-10"
                          style={{
                            background: `${doc.color}15`,
                            border: `1px solid ${doc.color}25`,
                          }}
                        >
                          <doc.icon size={18} style={{ color: doc.color }} />
                        </div>
                        <div className="relative z-10">
                          <p className="text-[10px] font-black text-white/80 leading-tight">
                            {doc.name}
                          </p>
                          <p className="text-[9px] text-emerald-400 mt-1 uppercase font-bold tracking-widest flex items-center gap-1">
                            <Eye size={10} /> View File
                          </p>
                        </div>
                      </button>
                    ))}
                </div>
              ) : (
                <div className="text-center py-6 px-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
                  <ShieldCheck className="w-8 h-8 text-white/10 mx-auto mb-2" />
                  <p className="text-xs text-white/30">
                    Belum ada dokumen yang diunggah oleh admin sekolah.
                  </p>
                </div>
              )}
            </section>

            {/* BMI & Kesehatan */}
            {(siswa.tinggi_badan || siswa.berat_badan) && (
              <section
                className="rounded-[2rem] p-6"
                style={{
                  background: "rgba(13,18,33,0.4)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  backdropFilter: "blur(40px)",
                }}
              >
                <h3 className="font-black text-base text-white/90 mb-4">
                  🩺 Data Kesehatan
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {siswa.tinggi_badan && (
                    <div
                      className="text-center p-3 rounded-2xl"
                      style={{
                        background: "rgba(34,211,238,0.08)",
                        border: "1px solid rgba(34,211,238,0.15)",
                      }}
                    >
                      <p className="text-xl font-black text-cyan-400">
                        {siswa.tinggi_badan}
                      </p>
                      <p className="text-[9px] text-white/40 uppercase mt-1">
                        cm
                      </p>
                      <p className="text-[10px] text-white/50">Tinggi</p>
                    </div>
                  )}
                  {siswa.berat_badan && (
                    <div
                      className="text-center p-3 rounded-2xl"
                      style={{
                        background: "rgba(167,139,250,0.08)",
                        border: "1px solid rgba(167,139,250,0.15)",
                      }}
                    >
                      <p className="text-xl font-black text-violet-400">
                        {siswa.berat_badan}
                      </p>
                      <p className="text-[9px] text-white/40 uppercase mt-1">
                        kg
                      </p>
                      <p className="text-[10px] text-white/50">Berat</p>
                    </div>
                  )}
                  {siswa.tinggi_badan &&
                    siswa.berat_badan &&
                    (() => {
                      const tb = parseFloat(String(siswa.tinggi_badan));
                      const bb = parseFloat(String(siswa.berat_badan));
                      if (!tb || !bb || isNaN(tb) || isNaN(bb)) return null;
                      const bmi = bb / (tb / 100) ** 2;
                      const cat =
                        bmi < 18.5
                          ? { label: "Kurus", color: "#fbbf24" }
                          : bmi < 25
                            ? { label: "Normal", color: "#34d399" }
                            : bmi < 30
                              ? { label: "Gemuk", color: "#fb923c" }
                              : { label: "Obesitas", color: "#f43f5e" };
                      return (
                        <div
                          className="text-center p-3 rounded-2xl"
                          style={{
                            background: `${cat.color}12`,
                            border: `1px solid ${cat.color}25`,
                          }}
                        >
                          <p
                            className="text-xl font-black"
                            style={{ color: cat.color }}
                          >
                            {bmi.toFixed(1)}
                          </p>
                          <p className="text-[9px] text-white/40 uppercase mt-1">
                            BMI
                          </p>
                          <p
                            className="text-[10px] font-bold"
                            style={{ color: cat.color }}
                          >
                            {cat.label}
                          </p>
                        </div>
                      );
                    })()}
                </div>
                {siswa.tinggi_badan &&
                  siswa.berat_badan &&
                  (() => {
                    const tb = parseFloat(String(siswa.tinggi_badan)),
                      bb = parseFloat(String(siswa.berat_badan));
                    if (!tb || !bb || isNaN(tb) || isNaN(bb)) return null;
                    const bmi = bb / (tb / 100) ** 2;
                    const pct = Math.min(((bmi - 10) / 30) * 100, 100);
                    return (
                      <div>
                        <div className="flex justify-between text-[9px] text-white/25 mb-1">
                          <span>Kurus (&lt;18.5)</span>
                          <span>Normal (18.5-25)</span>
                          <span>Gemuk (&gt;25)</span>
                        </div>
                        <div
                          className="h-2 rounded-full overflow-hidden"
                          style={{ background: "rgba(255,255,255,0.06)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg,#fbbf24,#34d399,#fb923c,#f43f5e)`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })()}
              </section>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/5 transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ border: "1px solid rgba(244,63,94,0.1)" }}
            >
              <X size={14} /> Keluar dari Sesi Portal
            </button>
          </div>
        )}

        {/* Spacer for dock clearance */}
        <div className="h-12" aria-hidden="true" />
      </main>

      {/* ── Bottom Navigation ──────────────────────────── */}
      <nav
        className="fixed bottom-6 inset-x-6 z-[100] h-16 max-w-sm mx-auto backdrop-blur-2xl rounded-2xl flex items-center justify-around px-2 shadow-2xl"
        style={{
          background: "rgba(10,15,30,0.8)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <NavButton
          active={activeTab === "home"}
          onClick={() => switchTab("home")}
          icon={LayoutDashboard}
          label="Beranda"
        />
        <NavButton
          active={activeTab === "academic"}
          onClick={() => switchTab("academic")}
          icon={BookOpen}
          label="Akademik"
        />
        <div className="relative -mt-10">
          <button
            onClick={() => setShowPass(true)}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl active:scale-90 transition-transform"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #22d3ee)",
              border: "4px solid #050811",
              boxShadow: "0 4px 20px rgba(139,92,246,0.4)",
            }}
          >
            <QrCode size={22} />
          </button>
        </div>
        <NavButton
          active={activeTab === "finance"}
          onClick={() => switchTab("finance")}
          icon={Wallet}
          label="Keuangan"
        />
        <NavButton
          active={activeTab === "profile"}
          onClick={() => switchTab("profile")}
          icon={User}
          label="Profil"
        />
      </nav>

      {/* Virtual Pass Modal */}
      <AnimatePresence>
        {showPass && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#050811]/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm"
            >
              <button
                onClick={() => setShowPass(false)}
                className="absolute -top-14 right-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-colors border border-white/10"
              >
                <X size={20} />
              </button>
              <VirtualPass siswa={siswa} onClose={() => setShowPass(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Components ─────────────────────────────────────────────

function SummaryCard({ label, value, sub, icon: Icon, color, trend, bg }: any) {
  return (
    <div
      className="p-6 rounded-[2rem] relative overflow-hidden group transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `radial-gradient(circle at top right, ${color}15, transparent 70%)`,
        }}
      />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}
          >
            <Icon size={18} color={color} />
          </div>
          <span
            className="text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tighter"
            style={{
              background: `${color}15`,
              color,
              border: `1px solid ${color}20`,
            }}
          >
            {trend}
          </span>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">
          {label}
        </p>
        <div className="flex items-baseline gap-1.5">
          <p className="text-3xl font-black tracking-tighter text-white/90">
            {value}
          </p>
        </div>
        <p className="text-[10px] mt-2 text-white/30 font-medium">{sub}</p>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2.5 group"
    >
      <div
        className="w-14 h-14 rounded-[1.2rem] flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-active:scale-90"
        style={{
          background: `${color}15`,
          border: `1px solid ${color}30`,
          boxShadow: `0 4px 15px ${color}10`,
        }}
      >
        <Icon
          size={22}
          color={color}
          className="opacity-90 group-hover:opacity-100"
        />
      </div>
      <span className="text-[9px] font-bold text-white/50 uppercase tracking-[0.1em] group-hover:text-white/80 transition-colors">
        {label}
      </span>
    </button>
  );
}

function TimelineItem({ icon: Icon, title, time, desc, color }: any) {
  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center pt-1">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 10px ${color}80` }}
        />
        <div
          className="w-px flex-1 my-2"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)",
          }}
        />
      </div>
      <div className="flex-1 pb-5">
        <div className="flex justify-between items-start mb-1.5">
          <h4 className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">
            {title}
          </h4>
          <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
            <Clock size={10} /> {time}
          </span>
        </div>
        <p className="text-xs text-white/40 leading-relaxed pr-2">{desc}</p>
      </div>
    </div>
  );
}

function InfoDetailRow({ label, value }: any) {
  return (
    <div className="flex justify-between items-center py-3">
      <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em]">
        {label}
      </span>
      <span className="text-xs font-bold text-white/80 text-right max-w-[60%] truncate">
        {value || "—"}
      </span>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`flex flex-col items-center gap-1 w-14 transition-all duration-300 ${active ? "text-cyan-400" : "text-white/30 hover:text-white/60"}`}
    >
      <div className="relative">
        <Icon
          size={20}
          className={active ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : ""}
        />
        {active && (
          <motion.div
            layoutId="activeTab"
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full"
          />
        )}
      </div>
      <span className="text-[9px] font-black uppercase tracking-tighter mt-0.5">
        {label}
      </span>
    </motion.button>
  );
}
