"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  AlertTriangle,
  Gift,
  GraduationCap,
  FileWarning,
  AlertCircle,
  CheckCheck,
  X,
  Sparkles,
  Clock,
  Phone,
  Settings,
  Info,
} from "lucide-react";
import { useAppStore } from "@/store/app.store";
import Link from "next/link";
import { uiSound } from "@/lib/audio";

// ── Types ─────────────────────────────────────────────────────
type NotifType =
  | "birthday"
  | "nisn"
  | "nik"
  | "incomplete"
  | "graduation"
  | "wa"
  | "system";

type TabType = "semua" | "belum" | "sistem";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  desc: string;
  time: string;
  href?: string;
}

// ── Constants ─────────────────────────────────────────────────
const ALWAYS_READ = new Set<string>(["missing-wa", "system-update"]);
const SISTEM_TYPES = new Set<NotifType>(["wa", "system"]);

const NOTIF_STYLE: Record<
  NotifType,
  {
    Icon: React.ElementType;
    bgClass: string;
    colorClass: string;
    borderColor: string;
  }
> = {
  birthday: {
    Icon: Gift,
    bgClass: "bg-rose-500/10",
    colorClass: "text-rose-400",
    borderColor: "#fb7185",
  },
  nisn: {
    Icon: AlertTriangle,
    bgClass: "bg-amber-500/10",
    colorClass: "text-amber-400",
    borderColor: "#fbbf24",
  },
  nik: {
    Icon: AlertCircle,
    bgClass: "bg-orange-500/10",
    colorClass: "text-orange-400",
    borderColor: "#fb923c",
  },
  incomplete: {
    Icon: FileWarning,
    bgClass: "bg-red-500/10",
    colorClass: "text-red-400",
    borderColor: "#f87171",
  },
  graduation: {
    Icon: GraduationCap,
    bgClass: "bg-violet-500/10",
    colorClass: "text-violet-400",
    borderColor: "#a78bfa",
  },
  wa: {
    Icon: Phone,
    bgClass: "bg-blue-500/10",
    colorClass: "text-blue-400",
    borderColor: "#60a5fa",
  },
  system: {
    Icon: Sparkles,
    bgClass: "bg-emerald-500/10",
    colorClass: "text-emerald-400",
    borderColor: "#34d399",
  },
};

const TAB_LABELS: Record<TabType, string> = {
  semua: "Semua",
  belum: "Belum Dibaca",
  sistem: "Sistem",
};

// ── Component ─────────────────────────────────────────────────
export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("semua");
  const [snoozeOpen, setSnoozeOpen] = useState<string | null>(null);

  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [snoozed, setSnoozed] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem("notification_read_ids");
      if (stored) setReadIds(new Set(JSON.parse(stored)));
      
      const storedSnooze = localStorage.getItem("notif_snoozed");
      if (storedSnooze) setSnoozed(JSON.parse(storedSnooze));
    } catch {}
  }, []);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const { dataSiswa } = useAppStore();

  // ── Build dynamic notifications ────────────────────────────
  const notifications = useMemo((): Notification[] => {
    const notifs: Notification[] = [];
    const today = new Date();
    const todayMM = today.getMonth() + 1;
    const todayDD = today.getDate();

    // 1. Ulang tahun hari ini
    const bdayStudents = dataSiswa.filter((s) => {
      if (!s.tanggal_lahir) return false;
      const parts = s.tanggal_lahir.split("-").map(Number);
      return parts[1] === todayMM && parts[2] === todayDD;
    });
    if (bdayStudents.length > 0) {
      const names = bdayStudents
        .slice(0, 2)
        .map((s) => s.nama.split(" ")[0])
        .join(", ");
      const extra =
        bdayStudents.length > 2 ? ` +${bdayStudents.length - 2} lainnya` : "";
      notifs.push({
        id: "bday-today",
        type: "birthday",
        title: "🎂 Ulang Tahun Hari Ini",
        desc: `${names}${extra} berulang tahun hari ini! Klik untuk buka WA Blast.`,
        time: "Hari ini",
        href: "/whatsapp",
      });
    }

    // 2. NISN kosong
    const noNisnCount = dataSiswa.filter(
      (s) => !s.nisn || s.nisn.trim() === "" || s.nisn === "-",
    ).length;
    if (noNisnCount > 0) {
      notifs.push({
        id: "missing-nisn",
        type: "nisn",
        title: "NISN Belum Terisi",
        desc: `${noNisnCount} siswa belum memiliki NISN. Diperlukan untuk Dapodik.`,
        time: "Sistem",
        href: "/siswa",
      });
    }

    // 3. NIK kosong
    const noNikCount = dataSiswa.filter(
      (s) => !s.nik || s.nik.trim() === "" || s.nik === "-",
    ).length;
    if (noNikCount > 0) {
      notifs.push({
        id: "missing-nik",
        type: "nik",
        title: "NIK Belum Terisi",
        desc: `${noNikCount} siswa belum memiliki NIK. Data penting untuk validasi.`,
        time: "Sistem",
        href: "/siswa",
      });
    }

    // 4. Kelengkapan data < 50%
    const incompleteCount = dataSiswa.filter((s) => {
      const fields = [
        s.nama,
        s.nisn,
        s.nik,
        s.tempat_lahir,
        s.tanggal_lahir,
        s.jk,
        s.agama,
        s.alamat,
        s.kelurahan,
        s.kecamatan,
        s.nama_ayah,
        s.nama_ibu,
      ];
      const filled = fields.filter(
        (v) => v && v !== "-" && String(v).trim() !== "",
      ).length;
      return filled < 6;
    }).length;
    if (incompleteCount > 0) {
      notifs.push({
        id: "incomplete-data",
        type: "incomplete",
        title: "Kelengkapan Data Rendah",
        desc: `${incompleteCount} siswa memiliki kelengkapan data < 50%. Segera dilengkapi.`,
        time: "Sistem",
        href: "/siswa",
      });
    }

    // 5. Reminder naik kelas (Juni – Juli)
    const month = today.getMonth() + 1;
    if (month >= 6 && month <= 7) {
      const kelas6Count = dataSiswa.filter((s) =>
        s.kelas?.startsWith("VI"),
      ).length;
      if (kelas6Count > 0) {
        notifs.push({
          id: "naik-kelas",
          type: "graduation",
          title: "Reminder Naik Kelas",
          desc: `Periode kenaikan kelas. ${kelas6Count} siswa Kelas VI perlu diproses.`,
          time: "Akademik",
          href: "/siswa",
        });
      }
    }

    // 6. Nomor WA kosong
    const noWaCount = dataSiswa.filter(
      (s) => !s.no_wa || s.no_wa === "-",
    ).length;
    if (noWaCount > 0) {
      notifs.push({
        id: "missing-wa",
        type: "wa",
        title: "Nomor WA Belum Terisi",
        desc: `${noWaCount} siswa belum punya nomor WA. WA Blast tidak bisa menjangkau mereka.`,
        time: "Info",
        href: "/siswa",
      });
    }

    // 7. System update (always read)
    notifs.push({
      id: "system-update",
      type: "system",
      title: "Portal Diperbarui",
      desc: "Audit infrastruktur selesai. Semua konfigurasi sekolah tersinkronisasi.",
      time: "Terbaru",
    });

    return notifs;
  }, [dataSiswa]);

  // ── Filter snoozed ─────────────────────────────────────────
  const visibleNotifications = useMemo(() => {
    const now = Date.now();
    return notifications.filter((n) => {
      const until = snoozed[n.id];
      return !until || until <= now;
    });
  }, [notifications, snoozed]);

  // ── Unread count ──────────────────────────────────────────
  const unreadCount = useMemo(
    () =>
      visibleNotifications.filter(
        (n) => !ALWAYS_READ.has(n.id) && !readIds.has(n.id),
      ).length,
    [visibleNotifications, readIds],
  );

  // ── Tab-filtered list ─────────────────────────────────────
  const displayedNotifs = useMemo(() => {
    switch (activeTab) {
      case "belum":
        return visibleNotifications.filter(
          (n) => !ALWAYS_READ.has(n.id) && !readIds.has(n.id),
        );
      case "sistem":
        return visibleNotifications.filter((n) => SISTEM_TYPES.has(n.type));
      default:
        return visibleNotifications;
    }
  }, [visibleNotifications, activeTab, readIds]);

  // ── Document title badge ──────────────────────────────────
  useEffect(() => {
    document.title =
      unreadCount > 0
        ? `(${unreadCount}) Portal Kesiswaan`
        : "Portal Kesiswaan";
  }, [unreadCount]);

  // ── Close dropdown on outside click ───────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSnoozeOpen(null);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Helpers ───────────────────────────────────────────────
  const persistReadIds = useCallback((ids: Set<string>) => {
    try {
      localStorage.setItem("notification_read_ids", JSON.stringify([...ids]));
    } catch {}
  }, []);

  const markAllRead = useCallback(() => {
    const newSet = new Set(notifications.map((n) => n.id));
    setReadIds(newSet);
    persistReadIds(newSet);
  }, [notifications, persistReadIds]);

  const markOneRead = useCallback(
    (id: string) => {
      setReadIds((prev) => {
        const newSet = new Set([...prev, id]);
        persistReadIds(newSet);
        return newSet;
      });
    },
    [persistReadIds],
  );

  const handleSnooze = useCallback(
    (id: string, duration: "hour" | "day" | "ignore") => {
      const now = Date.now();
      let until: number;
      if (duration === "hour") {
        until = now + 60 * 60 * 1000;
      } else if (duration === "day") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(8, 0, 0, 0);
        until = tomorrow.getTime();
      } else {
        until = new Date("2099-12-31").getTime();
      }
      setSnoozed((prev) => {
        const next = { ...prev, [id]: until };
        try {
          localStorage.setItem("notif_snoozed", JSON.stringify(next));
        } catch {}
        return next;
      });
      setSnoozeOpen(null);
    },
    [],
  );

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        id="notification-bell"
        onClick={() => {
          uiSound.playPop();
          setOpen(!open);
          setSnoozeOpen(null);
        }}
        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all relative ${
          open
            ? "bg-violet-500/15 text-violet-400"
            : "text-white/35 hover:text-white/70 hover:bg-white/[0.06]"
        }`}
        title="Notifikasi"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2"
            style={{
              background: "#8b5cf6",
              borderColor: "#090e1a",
              boxShadow: "0 0 6px rgba(139,92,246,0.7)",
            }}
          />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 mt-3 w-80 sm:w-[370px] rounded-2xl overflow-hidden z-[50]"
            style={{
              background: "#0d1221",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
            }}
          >
            {/* ── Header ── */}
            <div
              className="px-4 py-3.5 flex items-center justify-between"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(139,92,246,0.04)",
              }}
            >
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-violet-400" />
                <h3 className="font-bold text-sm text-white/90">Notifikasi</h3>
                {unreadCount > 0 && (
                  <motion.span
                    key={unreadCount}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-[9px] font-black text-white px-1.5 py-0.5 rounded-full bg-violet-500"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-violet-500/10 transition-all"
                  >
                    <CheckCheck size={12} />
                    <span className="hidden sm:inline">Tandai dibaca</span>
                  </button>
                )}
                <button
                  title="Pengaturan notifikasi (segera hadir)"
                  onClick={(e) => e.stopPropagation()}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-white/20 hover:text-white/40 hover:bg-white/[0.05] transition-all"
                >
                  <Settings size={12} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div
              className="flex items-center gap-1 px-3 py-2"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
              {(["semua", "belum", "sistem"] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                    activeTab === tab
                      ? "bg-violet-500/20 text-violet-300"
                      : "text-white/35 hover:text-white/60 hover:bg-white/[0.05]"
                  }`}
                >
                  {TAB_LABELS[tab]}
                  {tab === "belum" && unreadCount > 0 && (
                    <span className="text-[9px] font-black min-w-[16px] text-center px-1 rounded-full bg-violet-500 text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Notification List ── */}
            <div className="max-h-[360px] overflow-y-auto custom-scroll">
              {displayedNotifs.length === 0 ? (
                /* Empty states */
                <div className="py-12 flex flex-col items-center gap-3">
                  {activeTab === "belum" ? (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                        <CheckCheck size={22} className="text-emerald-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-white/40">
                          Semua sudah dibaca!
                        </p>
                        <p className="text-xs text-white/20 mt-0.5">
                          Tidak ada notifikasi belum dibaca
                        </p>
                      </div>
                    </>
                  ) : activeTab === "sistem" ? (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                        <Info size={22} className="text-blue-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-white/40">
                          Tidak ada notifikasi sistem
                        </p>
                        <p className="text-xs text-white/20 mt-0.5">
                          Notifikasi sistem akan muncul di sini
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Bell size={22} className="text-white/20" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-white/40">
                          Tidak ada notifikasi
                        </p>
                        <p className="text-xs text-white/20 mt-0.5">
                          Semua beres!
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  {displayedNotifs.map((n) => {
                    const isRead = ALWAYS_READ.has(n.id) || readIds.has(n.id);
                    const style = NOTIF_STYLE[n.type];

                    /* Shared card body – used inside both Link and plain div */
                    const cardBody = (
                      <div
                        className="flex gap-3 p-4 transition-colors hover:bg-white/[0.025] cursor-pointer"
                        style={{
                          borderLeft: !isRead
                            ? `2px solid ${style.borderColor}`
                            : "2px solid transparent",
                          background: !isRead
                            ? "rgba(139,92,246,0.025)"
                            : "transparent",
                        }}
                      >
                        {/* Icon circle */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${style.bgClass}`}
                        >
                          <style.Icon size={16} className={style.colorClass} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`text-[12px] font-bold leading-snug mb-1 ${
                              !isRead ? "text-white/90" : "text-white/50"
                            }`}
                          >
                            {n.title}
                          </h4>
                          <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">
                            {n.desc}
                          </p>
                          <p className="text-[10px] text-white/20 mt-1.5 font-medium">
                            {n.time}
                          </p>
                        </div>
                      </div>
                    );

                    return (
                      <div
                        key={n.id}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        {/* Row: card + snooze toggle */}
                        <div className="flex items-start group">
                          {/* Clickable card area */}
                          <div className="flex-1 min-w-0">
                            {n.href ? (
                              <Link
                                href={n.href}
                                onClick={() => {
                                  uiSound.playClick();
                                  markOneRead(n.id);
                                  setOpen(false);
                                }}
                              >
                                {cardBody}
                              </Link>
                            ) : (
                              <div
                                onClick={() => {
                                  uiSound.playClick();
                                  markOneRead(n.id);
                                  setOpen(false);
                                }}
                              >
                                {cardBody}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              <button
                onClick={() => {
                  markAllRead();
                  uiSound.playSuccess();
                }}
                className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors"
              >
                Tandai Semua Dibaca
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-white/30 hover:text-white/50 transition-colors"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
