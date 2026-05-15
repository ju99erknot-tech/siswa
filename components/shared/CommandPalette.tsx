"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LayoutDashboard,
  BookOpen,
  Users,
  Contact,
  Layers,
  ClipboardList,
  BarChart3,
  FileText,
  Stethoscope,
  Coins,
  Rocket,
  Trophy,
  GraduationCap,
  Telescope,
  Download,
  FileBarChart,
  Calendar,
  MessageSquare,
  Wallet,
  Settings,
  Map as MapIcon,
  RefreshCw,
  Camera,
  Sparkles,
  Tag,
  ScrollText,
  QrCode,
  CreditCard,
  Command,
} from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { uiSound } from "@/lib/audio";

interface CommandItem {
  id: string;
  label: string;
  href: string;
  icon: any;
  section: string;
  keywords?: string;
}

const COMMANDS: CommandItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    section: "Utama",
    keywords: "home beranda",
  },
  {
    id: "kelas",
    label: "Statistik Kelas",
    href: "/kelas",
    icon: BarChart3,
    section: "Utama",
  },
  {
    id: "insight",
    label: "Insight",
    href: "/kelas/insight",
    icon: Layers,
    section: "Utama",
  },

  {
    id: "kalender",
    label: "Kalender",
    href: "/kalender",
    icon: Calendar,
    section: "Utama",
  },
  {
    id: "siswa",
    label: "Buku Induk Siswa",
    href: "/siswa",
    icon: BookOpen,
    section: "Data",
    keywords: "student murid",
  },
  {
    id: "facegrid",
    label: "FaceGrid Audit",
    href: "/siswa/facegrid",
    icon: Camera,
    section: "Data",
  },
  {
    id: "migration",
    label: "AI Migration",
    href: "/migration",
    icon: Sparkles,
    section: "Data",
  },
  {
    id: "dapodik",
    label: "Dapodik Sync",
    href: "/dapodik",
    icon: RefreshCw,
    section: "Data",
  },
  {
    id: "peta",
    label: "Zonasi Siswa",
    href: "/peta",
    icon: MapIcon,
    section: "Data",
  },
  {
    id: "mutasi-masuk",
    label: "Mutasi Masuk",
    href: "/mutasi/masuk",
    icon: Users,
    section: "Data",
  },
  {
    id: "mutasi-keluar",
    label: "Mutasi Keluar",
    href: "/mutasi/keluar",
    icon: Users,
    section: "Data",
  },
  {
    id: "gtk",
    label: "Data GTK",
    href: "/gtk",
    icon: Contact,
    section: "Data",
  },
  {
    id: "master-kelas",
    label: "Master Kelas",
    href: "/master-kelas",
    icon: Layers,
    section: "Data",
  },
  {
    id: "absensi",
    label: "Absensi Harian",
    href: "/absensi",
    icon: ClipboardList,
    section: "Layanan",
    keywords: "attendance hadir",
  },
  {
    id: "rekap",
    label: "Rekap Absensi",
    href: "/rekap-absensi",
    icon: BarChart3,
    section: "Layanan",
  },
  {
    id: "surat",
    label: "Surat Izin",
    href: "/surat",
    icon: FileText,
    section: "Layanan",
  },
  {
    id: "uks",
    label: "UKS",
    href: "/uks",
    icon: Stethoscope,
    section: "Layanan",
    keywords: "kesehatan health",
  },
  {
    id: "pip",
    label: "PIP / Beasiswa",
    href: "/pip",
    icon: Coins,
    section: "Layanan",
    keywords: "kip bantuan",
  },
  {
    id: "eskul",
    label: "Ekstrakurikuler",
    href: "/eskul",
    icon: Rocket,
    section: "Layanan",
  },
  {
    id: "prestasi",
    label: "Prestasi",
    href: "/prestasi",
    icon: Trophy,
    section: "Layanan",
    keywords: "lomba juara",
  },
  {
    id: "jurnal",
    label: "Jurnal Guru",
    href: "/jurnal",
    icon: BookOpen,
    section: "Layanan",
  },
  {
    id: "whatsapp",
    label: "WhatsApp Blast",
    href: "/whatsapp",
    icon: MessageSquare,
    section: "Layanan",
  },
  {
    id: "wallet",
    label: "Digital Wallet",
    href: "/wallet",
    icon: Wallet,
    section: "Layanan",
  },
  {
    id: "alumni",
    label: "Buku Alumni",
    href: "/alumni",
    icon: GraduationCap,
    section: "Arsip",
    keywords: "lulus graduate",
  },
  {
    id: "tracer",
    label: "Tracer Study",
    href: "/tracer",
    icon: Telescope,
    section: "Arsip",
  },
  {
    id: "ekspor",
    label: "Ekspor Data",
    href: "/ekspor",
    icon: Download,
    section: "Arsip",
  },
  {
    id: "laporan",
    label: "Laporan",
    href: "/laporan",
    icon: FileBarChart,
    section: "Arsip",
  },
  {
    id: "label-meja",
    label: "Label Meja",
    href: "/utility/label-meja",
    icon: Tag,
    section: "Utility",
  },
  {
    id: "id-card",
    label: "ID Card",
    href: "/utility/id-card",
    icon: Contact,
    section: "Utility",
  },
  {
    id: "label-rapor",
    label: "Sampul Rapor",
    href: "/utility/label-rapor",
    icon: ScrollText,
    section: "Utility",
  },
  {
    id: "qr-code",
    label: "QR Generator",
    href: "/utility/qr-code",
    icon: QrCode,
    section: "Utility",
  },
  {
    id: "sppd",
    label: "e-SPPD",
    href: "/utility/sppd",
    icon: CreditCard,
    section: "Utility",
  },
  {
    id: "upload-foto",
    label: "Upload Foto",
    href: "/utility/upload-foto",
    icon: Camera,
    section: "Utility",
  },
  {
    id: "pengaturan",
    label: "Pengaturan",
    href: "/pengaturan",
    icon: Settings,
    section: "Sistem",
    keywords: "settings config",
  },
  {
    id: "profil",
    label: "Profil Saya",
    href: "/profil",
    icon: Users,
    section: "Sistem",
  },
];

// ── Fuzzy match helper ───────────────────────────────────────
function fuzzyMatch(text: string, query: string): boolean {
  const t = text.toLowerCase(),
    q = query.toLowerCase();
  let ti = 0;
  for (let qi = 0; qi < q.length; qi++) {
    ti = t.indexOf(q[qi], ti);
    if (ti === -1) return false;
    ti++;
  }
  return true;
}

export function CommandPalette() {
  const { dataSiswa, dataGuru, dataPrestasi, searchOpen: open, setSearchOpen: setOpen } = useAppStore();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("cmd_recent") || "[]");
    } catch {
      return [];
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const currentState = useAppStore.getState().searchOpen;
        if (!currentState) uiSound.playPop();
        setOpen(!currentState);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const saveRecent = (q: string) => {
    if (!q.trim() || q.length < 2) return;
    const updated = [q, ...recentSearches.filter((r) => r !== q)].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem("cmd_recent", JSON.stringify(updated));
    } catch {}
  };

  const results = useMemo(() => {
    if (!query.trim()) return COMMANDS;
    const q = query.toLowerCase();
    // Exact match ranks higher than fuzzy
    const exactCmds = COMMANDS.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.section.toLowerCase().includes(q) ||
        c.keywords?.toLowerCase().includes(q),
    );
    const fuzzyCmds = COMMANDS.filter(
      (c) =>
        !exactCmds.includes(c) &&
        (fuzzyMatch(c.label, q) || fuzzyMatch(c.keywords || "", q)),
    );
    const matchedCommands = [...exactCmds, ...fuzzyCmds];

    const matchedSiswa = dataSiswa
      .filter(
        (s) =>
          s.nama.toLowerCase().includes(q) ||
          s.nisn?.includes(q) ||
          fuzzyMatch(s.nama, q),
      )
      .slice(0, 5)
      .map((s) => ({
        id: `siswa-${s.id}`,
        label: s.nama,
        href: `/siswa?search=${encodeURIComponent(s.nama)}`,
        icon: Users,
        section: `Siswa • ${s.kelas || "-"}`,
        keywords: s.nisn || "",
      }));

    const matchedGuru = dataGuru
      .filter((g) => g.nama.toLowerCase().includes(q) || g.nip?.includes(q))
      .slice(0, 3)
      .map((g) => ({
        id: `guru-${g.id}`,
        label: g.nama,
        href: `/gtk?search=${encodeURIComponent(g.nama)}`,
        icon: Contact,
        section: `Guru`,
        keywords: g.nip || "",
      }));

    const matchedPrestasi = dataPrestasi
      .filter(
        (p) =>
          p.nama?.toLowerCase().includes(q) ||
          p.jenis_lomba?.toLowerCase().includes(q),
      )
      .slice(0, 3)
      .map((p) => ({
        id: `prestasi-${p.id}`,
        label: p.nama || "-",
        href: `/prestasi`,
        icon: Trophy,
        section: `Prestasi • ${p.tingkat || "-"}`,
        keywords: p.jenis_lomba || "",
      }));

    return [
      ...matchedSiswa,
      ...matchedGuru,
      ...matchedPrestasi,
      ...matchedCommands,
    ];
  }, [query, dataSiswa, dataGuru, dataPrestasi]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof results>();
    results.forEach((r) => {
      const arr = map.get(r.section) || [];
      arr.push(r);
      map.set(r.section, arr);
    });
    return map;
  }, [results]);

  const handleSelect = (item: CommandItem) => {
    uiSound.playSuccess();
    saveRecent(query.trim() || item.label);
    setOpen(false);
    router.push(item.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector(
      `[data-index="${selectedIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
          style={{
            background: "rgba(5,8,17,0.80)",
            backdropFilter: "blur(16px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl rounded-2xl overflow-hidden"
            style={{
              background: "#0d1221",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
            }}
          >
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <Search size={18} className="text-violet-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Cari halaman, fitur, atau siswa..."
                className="flex-1 bg-transparent text-white/90 text-sm outline-none placeholder-white/25"
              />
              <kbd className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white/20 bg-white/5 border border-white/10">
                ESC
              </kbd>
            </div>

            <div
              ref={listRef}
              className="max-h-[50vh] overflow-y-auto custom-scroll py-2"
            >
              {/* Recent searches — shown when query is empty */}
              {!query.trim() && recentSearches.length > 0 && (
                <div className="px-5 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black text-white/15 uppercase tracking-[0.2em]">
                      Pencarian Terakhir
                    </span>
                    <button
                      onClick={() => {
                        setRecentSearches([]);
                        try {
                          localStorage.removeItem("cmd_recent");
                        } catch {}
                      }}
                      className="text-[9px] text-white/20 hover:text-white/40 transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setQuery(r);
                          setSelectedIndex(0);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] text-white/40 hover:text-white/70 border border-white/8 hover:border-white/15 transition-all"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {results.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-white/30 font-medium">
                    Tidak ditemukan
                  </p>
                  <p className="text-xs text-white/15 mt-1">
                    Coba kata kunci lain
                  </p>
                </div>
              ) : (
                Array.from(grouped.entries()).map(([section, items]) => (
                  <div key={section}>
                    <div className="px-5 py-1.5">
                      <span className="text-[9px] font-black text-white/15 uppercase tracking-[0.2em]">
                        {section}
                      </span>
                    </div>
                    {items.map((item) => {
                      const globalIdx = results.indexOf(item);
                      return (
                        <button
                          key={item.id}
                          data-index={globalIdx}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all ${
                            selectedIndex === globalIdx
                              ? "bg-violet-500/10 text-white"
                              : "text-white/50 hover:text-white/70"
                          }`}
                        >
                          <item.icon
                            size={16}
                            className={
                              selectedIndex === globalIdx
                                ? "text-violet-400"
                                : "text-white/20"
                            }
                          />
                          <span className="text-sm font-medium flex-1 truncate">
                            {item.label}
                          </span>
                          {selectedIndex === globalIdx && (
                            <span className="text-[10px] text-white/20 font-bold">
                              ↵
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[10px] text-white/15">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold">
                    ↑↓
                  </kbd>{" "}
                  navigasi
                </span>
                <span className="flex items-center gap-1 text-[10px] text-white/15">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold">
                    ↵
                  </kbd>{" "}
                  buka
                </span>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-white/15">
                <Command size={10} /> Ctrl+K
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
