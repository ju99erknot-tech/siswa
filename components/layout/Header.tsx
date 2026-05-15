"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Menu,
  Home,
  ChevronRight,
  User,
  LogOut,
  Settings,
  UserCircle,
  Activity,
  MessageCircle,
  Mic,
} from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/store/app.store";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { NotificationDropdown } from "../shared/NotificationDropdown";
import { useRouter } from "next/navigation";

const BC_LABELS: Record<string, string> = {
  siswa: "Buku Induk",
  mutasi: "Mutasi",
  masuk: "Mutasi Masuk",
  keluar: "Mutasi Keluar",
  prestasi: "Prestasi",
  alumni: "Alumni",
  dapodik: "Dapodik",
  migration: "AI Migration",
  peta: "Peta Zonasi",
  pengaturan: "Pengaturan",
  utility: "Utility Tools",
  "label-meja": "Label Meja",
  "id-card": "ID Card",
  cover: "Cover Generator",
  "label-arsip": "Label Arsip",
  "label-rapor": "Label Rapor",
  "tanda-terima": "Tanda Terima",
  "qr-code": "QR Code",
  album: "Album Lulusan",
  sppd: "e-SPPD",
  "peta-spmb": "Peta SPMB",
  "upload-foto": "Upload Foto Massal",
  uks: "Layanan UKS",
  eskul: "Ekstrakurikuler",
  pip: "Bantuan PIP",
  tracer: "Tracer Study",
  profil: "Profil Saya",
  absensi: "Absensi Harian",
  ekspor: "Ekspor Data",
  kelas: "Statistik per Kelas",
  kalender: "Kalender Akademik",
  surat: "Surat Izin",
  "rekap-absensi": "Rekap Absensi",
  laporan: "Laporan & Analitik",
};

export function Header({ user }: { user: AppUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const {
    setSidebarOpen,
    toggleSearch,
    zenMode,
    setWaBlastOpen,
    voiceActive,
    setVoiceActive,
  } = useAppStore();

  if (zenMode) return null;

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const parts = pathname.split("/").filter(Boolean);
  const breadcrumbs = parts.map((p, i) => {
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p);
    const label = isUUID
      ? "Detail"
      : BC_LABELS[p] || p.charAt(0).toUpperCase() + p.slice(1);
    return {
      label,
      href: "/" + parts.slice(0, i + 1).join("/"),
      active: i === parts.length - 1,
    };
  });

  const initials =
    user.name
      ?.split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <header
      className="h-16 flex items-center justify-between px-6 sticky top-0 z-[30] flex-shrink-0"
      style={{
        background: "rgba(9,14,26,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Left: Hamburger + Breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-white/40 hover:text-white/80 hover:bg-white/06 transition-all"
        >
          <Menu size={20} />
        </button>

        <nav className="hidden md:flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/05 transition-all"
          >
            <Home size={14} />
          </Link>
          {breadcrumbs.map((bc) => (
            <div key={bc.href} className="flex items-center gap-2">
              <ChevronRight size={11} className="text-white/20" />
              <Link
                href={bc.href}
                className={cn(
                  "px-2 py-1 rounded-md transition-all text-[12px] tracking-tight font-medium",
                  bc.active
                    ? "text-violet-300 bg-violet-500/[0.10]"
                    : "text-white/35 hover:text-white/60",
                )}
              >
                {bc.label}
              </Link>
            </div>
          ))}
        </nav>
      </div>

      {/* Right: Search + Bell + Profile */}
      <div className="flex items-center gap-3">
        {/* Search — opens CommandPalette */}
        <button
          onClick={() => toggleSearch()}
          className="hidden lg:flex items-center px-3.5 h-9 rounded-xl gap-2.5 w-64 cursor-text text-left transition-all group"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(139,92,246,0.35)";
            e.currentTarget.style.background = "rgba(139,92,246,0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          }}
        >
          <Search
            size={14}
            className="text-white/25 group-hover:text-violet-400 transition-colors flex-shrink-0"
          />
          <span className="text-[12px] text-white/25 flex-1">
            Cari data siswa...
          </span>
          <div className="flex gap-1">
            <kbd
              className="px-1.5 py-0.5 rounded text-[9px] font-bold"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.25)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {typeof navigator !== "undefined" &&
              /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)
                ? "⌘"
                : "Ctrl"}
            </kbd>
            <kbd
              className="px-1.5 py-0.5 rounded text-[9px] font-bold"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.25)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              K
            </kbd>
          </div>
        </button>

        {/* Voice Command Button */}
        <button
          onClick={() => setVoiceActive(!voiceActive)}
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all relative group",
            voiceActive
              ? "text-white bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
              : "text-white/35 hover:text-violet-400 hover:bg-violet-500/10",
          )}
          title="Voice Command (Klik untuk aktifkan)"
        >
          <Mic size={18} className={voiceActive ? "animate-pulse" : ""} />
          {voiceActive && (
            <motion.div
              layoutId="voice-pulse"
              className="absolute inset-0 rounded-xl bg-violet-500/20"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}
        </button>

        {/* WA Blast */}
        <button
          onClick={() => setWaBlastOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/35 hover:text-green-400 hover:bg-green-500/10 transition-all"
          title="WhatsApp Blast"
        >
          <MessageCircle size={18} />
        </button>

        {/* Bell / Notifications */}
        <NotificationDropdown />

        <div
          className="w-px h-6"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 group outline-none"
          >
            <div className="hidden sm:block text-right">
              <p className="text-[13px] font-bold text-white/80 leading-none">
                {user.name}
              </p>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1 font-semibold">
                {user.role}
              </p>
            </div>
            <div
              className={cn(
                "w-9 h-9 rounded-xl p-[1.5px] transition-all duration-300",
                profileOpen ? "scale-90" : "group-hover:scale-105",
              )}
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #22d3ee)",
              }}
            >
              <div
                className="w-full h-full rounded-[10px] flex items-center justify-center overflow-hidden"
                style={{ background: "#0d1221" }}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] font-black text-violet-400">
                    {initials}
                  </span>
                )}
              </div>
            </div>
          </button>

          <AnimatePresence>
            {profileOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setProfileOpen(false)}
                  className="fixed inset-0 z-[40]"
                />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 mt-3 w-60 rounded-2xl overflow-hidden z-[50]"
                  style={{
                    background: "#0d1221",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                  }}
                >
                  {/* Status */}
                  <div
                    className="px-4 py-3.5"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(139,92,246,0.08)",
                    }}
                  >
                    <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-1.5">
                      Status Akun
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-xs font-semibold text-white/70 capitalize">
                        {user.role} · Aktif
                      </p>
                    </div>
                  </div>

                  <div className="p-1.5">
                    {[
                      {
                        icon: UserCircle,
                        label: "Profil Saya",
                        href: "/profil",
                      },
                      {
                        icon: Activity,
                        label: "Aktivitas Login",
                        href: "/profil?tab=aktivitas",
                      },
                      {
                        icon: Settings,
                        label: "Pengaturan",
                        href: "/pengaturan",
                      },
                    ].map(({ icon: Icon, label, href }) => (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-white/55 hover:text-white/85 hover:bg-white/05 transition-all group"
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 group-hover:text-violet-400 group-hover:bg-violet-500/10 transition-all"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                        >
                          <Icon size={15} />
                        </div>
                        {label}
                      </Link>
                    ))}
                  </div>

                  <div
                    className="p-1.5"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-rose-400 hover:bg-rose-500/10 transition-all group"
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-rose-500/10 group-hover:bg-rose-500/20 transition-all">
                        <LogOut size={15} />
                      </div>
                      Keluar Sistem
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
