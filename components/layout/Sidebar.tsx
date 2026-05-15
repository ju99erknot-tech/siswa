"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  GraduationCap,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  BookOpen,
  RefreshCw,
  Map,
  UserPlus,
  UserMinus,
  Database,
  Sparkles,
  Heart,
  Stethoscope,
  Coins,
  Rocket,
  Trophy,
  Archive,
  Telescope,
  Wrench,
  Tag,
  Contact,
  FileStack,
  ClipboardCheck,
  ScrollText,
  PenTool,
  QrCode,
  ImageIcon as LucideImage,
  CreditCard,
  MapPin,
  FileImage,
  Search,
  ClipboardList,
  Download,
  BarChart3,
  Calendar,
  FileText,
  FileBarChart,
  Layers,
  Camera,
  MessageSquare,
  Wallet,
  Crown,
  LayoutGrid,
  Key,
  UserCheck,
  BookOpenCheck,
  CalendarDays,
  Printer,
} from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { cn } from "@/lib/utils";
import type { AppUser, Pengaturan } from "@/types";
import { SCHOOL } from "@/lib/school.config";
import { uiSound } from "@/lib/audio";

interface NavChild {
  label: string;
  href: string;
  icon?: any;
}
interface NavItem {
  label: string;
  href: string;
  icon: any;
  children?: NavChild[];
}
interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "UTAMA",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/" },
      {
        label: "Statistik Kelas",
        icon: BarChart3,
        href: "/kelas",
        children: [
          { label: "Overview Kelas", href: "/kelas", icon: BarChart3 },
          { label: "Insight", href: "/kelas/insight", icon: Layers },
        ],
      },
      { label: "Kalender", icon: Calendar, href: "/kalender" },
    ],
  },
  {
    label: "DATA MASTER",
    items: [
      {
        label: "Kesiswaan",
        icon: Database,
        href: "/siswa",
        children: [
          { label: "Buku Induk", href: "/siswa", icon: BookOpen },
          { label: "FaceGrid Audit", href: "/siswa/facegrid", icon: Camera },
          { label: "AI Migration", href: "/migration", icon: Sparkles },
          { label: "Dapodik Sync", href: "/dapodik", icon: RefreshCw },
          { label: "Zonasi Siswa", href: "/peta", icon: Map },
          { label: "Mutasi Masuk", href: "/mutasi/masuk", icon: UserPlus },
          { label: "Mutasi Keluar", href: "/mutasi/keluar", icon: UserMinus },
          { label: "Laporan LKS", href: "/siswa/laporan", icon: FileBarChart },
        ],
      },
      {
        label: "Data GTK",
        icon: Contact,
        href: "/gtk",
        children: [
          { label: "Pendidik", href: "/gtk/pendidik", icon: UserCheck },
          {
            label: "Tenaga Kependidikan",
            href: "/gtk/tendik",
            icon: BookOpenCheck,
          },
          { label: "Vault Akun", href: "/gtk/vault", icon: Key },
        ],
      },
      {
        label: "Master Kelas",
        icon: Layers,
        href: "/master-kelas",
        children: [
          { label: "Daftar Kelas", href: "/master-kelas", icon: Layers },
          { label: "Denah Tempat Duduk", href: "/denah", icon: LayoutGrid },
          { label: "Jadwal Pelajaran", href: "/jadwal", icon: CalendarDays },
        ],
      },
    ],
  },
  {
    label: "LAYANAN",
    items: [
      {
        label: "Layanan Siswa",
        icon: Heart,
        href: "/absensi",
        children: [
          { label: "Absensi", href: "/absensi", icon: ClipboardList },
          { label: "Rekap Absen", href: "/rekap-absensi", icon: BarChart3 },
          { label: "Surat Izin", href: "/surat", icon: FileText },
          { label: "UKS", href: "/uks", icon: Stethoscope },
          { label: "PIP / Beasiswa", href: "/pip", icon: Coins },
          { label: "Ekstrakurikuler", href: "/eskul", icon: Rocket },
          { label: "Prestasi", href: "/prestasi", icon: Trophy },
          { label: "Leaderboard", href: "/leaderboard", icon: Crown },
          { label: "WhatsApp Blast", href: "/whatsapp", icon: MessageSquare },
          { label: "Digital Wallet", href: "/wallet", icon: Wallet },
          { label: "Verifikasi SPMB", href: "/spmb", icon: ClipboardCheck },
        ],
      },
      { label: "Jurnal Guru", icon: BookOpen, href: "/jurnal" },
    ],
  },
  {
    label: "ARSIP & UTILITY",
    items: [
      {
        label: "Arsip Digital",
        icon: Archive,
        href: "/alumni",
        children: [
          { label: "Buku Alumni", href: "/alumni", icon: GraduationCap },
          { label: "Tracer Study", href: "/tracer", icon: Telescope },
          { label: "Ekspor Data", href: "/ekspor", icon: Download },
          { label: "Print Center", href: "/cetak", icon: Printer },
        ],
      },
      {
        label: "Alat Bantu",
        icon: Wrench,
        href: "/utility",
        children: [
          { label: "Label Meja", href: "/utility/label-meja", icon: Tag },
          { label: "ID Card", href: "/utility/id-card", icon: Contact },
          {
            label: "Kartu Pelajar",
            href: "/utility/kartu-pelajar",
            icon: CreditCard,
          },
          { label: "Cover Gen", href: "/utility/cover", icon: FileStack },
          {
            label: "Label Map",
            href: "/utility/label-arsip",
            icon: ClipboardCheck,
          },
          {
            label: "Sampul Rapor",
            href: "/utility/label-rapor",
            icon: ScrollText,
          },
          {
            label: "Tanda Terima",
            href: "/utility/tanda-terima",
            icon: PenTool,
          },
          {
            label: "Blanko Tabel",
            href: "/utility/tabel-custom",
            icon: LayoutGrid,
          },
          { label: "QR Generator", href: "/utility/qr-code", icon: QrCode },
          { label: "Album Lulus", href: "/utility/album", icon: LucideImage },
          { label: "e-SPPD", href: "/utility/sppd", icon: CreditCard },
          { label: "Peta SPMB", href: "/utility/peta-spmb", icon: MapPin },
          {
            label: "Upload Foto",
            href: "/utility/upload-foto",
            icon: FileImage,
          },
        ],
      },
    ],
  },
];

export function Sidebar({
  user,
  pengaturan,
}: {
  user: AppUser;
  pengaturan: Pengaturan | null;
}) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, zenMode, sidebarCollapsed, toggleSidebarCollapsed } = useAppStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (
          item.children?.some((c) => {
            const p = c.href.split("?")[0];
            return (
              pathname === p || (p !== "/" && pathname.startsWith(p + "/"))
            );
          })
        ) {
          setExpanded(item.label);
          return;
        }
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024)
      setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  if (zenMode) return null;

  return (
    <>
      <aside
        className="hidden lg:flex flex-col h-screen flex-shrink-0 sticky top-0 z-40 bg-[#050811] border-r border-white/5 transition-all duration-300 relative group/sidebar"
        style={{ width: (mounted ? sidebarCollapsed : false) ? 72 : 260 }}
      >
        <SidebarContent
          user={user}
          pengaturan={pengaturan}
          pathname={pathname}
          expanded={expanded}
          setExpanded={setExpanded}
          collapsed={mounted ? sidebarCollapsed : false}
        />
        {/* Floating collapse handle */}
        <button
          onClick={() => {
            uiSound.playClick();
            toggleSidebarCollapsed();
          }}
          title={(mounted ? sidebarCollapsed : false) ? "Perbesar" : "Kecilkan"}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-50 w-6 h-10 flex items-center justify-center rounded-full border border-white/10 bg-[#080c18] text-white/20 opacity-0 group-hover/sidebar:opacity-100 hover:!opacity-100 hover:text-violet-400 hover:border-violet-500/40 hover:bg-violet-500/10 hover:shadow-[0_0_12px_rgba(139,92,246,0.3)] transition-all duration-200"
        >
          {(mounted ? sidebarCollapsed : false)
            ? <ChevronsRight size={13} />
            : <ChevronsLeft size={13} />
          }
        </button>
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="absolute inset-y-0 left-0 w-[280px] bg-[#050811] flex flex-col"
            >
              <div className="p-4 flex justify-end">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scroll">
                <SidebarContent
                  user={user}
                  pengaturan={pengaturan}
                  pathname={pathname}
                  expanded={expanded}
                  setExpanded={setExpanded}
                />
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

interface SidebarContentProps {
  user: any;
  pengaturan: any;
  pathname: string;
  expanded: string | null;
  setExpanded: (v: string | null) => void;
  collapsed?: boolean;
}

function SidebarContent({
  user,
  pengaturan,
  pathname,
  expanded,
  setExpanded,
  collapsed = false,
}: SidebarContentProps) {
  const router = useRouter();
  const [menuSearch, setMenuSearch] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sidebar_collapsed_sections');
      if (stored) setCollapsedSections(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  const toggleSection = useCallback((label: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      try { localStorage.setItem('sidebar_collapsed_sections', JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const store = useAppStore();
  const schoolName = pengaturan?.nama_sekolah || SCHOOL.nama;
  const nameParts = schoolName.split(" ");
  const lastWord = nameParts.length > 1 ? nameParts.pop() : "";
  const firstWords = nameParts.join(" ");

  const getMenuCount = (href: string): number | null => {
    switch (href) {
      case "/siswa":
        return store.dataSiswa?.length || null;
      case "/gtk":
        return store.dataGuru?.length || null;
      case "/mutasi/masuk":
        return store.dataMutasiMasuk?.length || null;
      case "/mutasi/keluar":
        return store.dataMutasiKeluar?.length || null;
      case "/prestasi":
        return store.dataPrestasi?.length || null;
      case "/alumni":
        return store.dataAlumni?.length || null;
      case "/uks":
        return store.dataUKS?.length || null;
      case "/surat":
        return store.dataIzin?.length || null;
      case "/pip":
        return store.dataPIP?.length || null;
      case "/eskul":
        return store.dataEskul?.length || null;
      case "/jurnal":
        return store.dataJurnal?.length || null;
      case "/master-kelas":
        return store.dataKelas?.length || null;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={cn("flex-shrink-0 transition-all", collapsed ? "px-3 py-6 flex justify-center" : "px-6 py-8 flex items-center gap-3")}>
        <div className="w-10 h-10 flex-shrink-0">
          {pengaturan?.logo_url ? (
            <img src={pengaturan.logo_url} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full rounded-xl bg-violet-600 flex items-center justify-center">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <div className="text-white font-black text-sm tracking-tight leading-none truncate flex items-center gap-1">
              <span>{firstWords}</span>
              <span className="text-violet-400">{lastWord}</span>
            </div>
            <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
              Portal Kesiswaan
            </span>
          </div>
        )}
      </div>

      {/* Menu Search - hidden when collapsed */}
      {!collapsed && (
        <div className="px-4 mb-4 flex-shrink-0">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/15" />
            <input
              type="text"
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              placeholder="Cari menu..."
              className="w-full h-8 pl-8 pr-3 rounded-lg text-[11px] outline-none text-white/60 placeholder-white/15"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto custom-scroll space-y-6 pb-10">
        {NAV_SECTIONS.filter((section) => {
          if (user?.role === "guru") {
            return section.label === "UTAMA" || section.label === "LAYANAN";
          }
          return true;
        }).map((section) => {
          const q = menuSearch.toLowerCase();
          const filteredItems = q
            ? section.items.filter((item) => {
                if (item.label.toLowerCase().includes(q)) return true;
                if (
                  item.children?.some((c) => c.label.toLowerCase().includes(q))
                )
                  return true;
                return false;
              })
            : section.items;
          if (filteredItems.length === 0) return null;
          return (
            <div key={section.label}>
              {collapsed ? (
                <div className="mx-3 my-3 border-t border-white/5" />
              ) : (
                <button
                  onClick={() => toggleSection(section.label)}
                  className="w-full flex items-center justify-between px-3 mb-2 group cursor-pointer"
                >
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-white/40 transition-colors">
                    {section.label}
                  </span>
                  <ChevronRight
                    size={10}
                    className={cn(
                      "text-white/10 group-hover:text-white/30 transition-all",
                      !collapsedSections.has(section.label) && "rotate-90"
                    )}
                  />
                </button>
              )}
              <AnimatePresence initial={false}>
                {(collapsed || !collapsedSections.has(section.label)) && (
                  <motion.div
                    initial={collapsed ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-0.5">
                      {filteredItems.map((item) => {
                        const childPaths = item.children?.map((c) => c.href.split('?')[0]) || [];
                        const isActive =
                          pathname === item.href ||
                          childPaths.some(
                            (p) => pathname === p || (p !== '/' && pathname.startsWith(p + '/'))
                          );
                        const isExpanded = expanded === item.label;

                        // ——— Collapsed sidebar: icon-only link ———
                        if (collapsed) {
                          return (
                            <Link
                              key={item.label}
                              href={item.href}
                              onMouseEnter={() => router.prefetch(item.href)}
                              onClick={() => uiSound.playClick()}
                              title={item.label}
                              className={cn(
                                'flex items-center justify-center px-3 py-2.5 rounded-lg transition-all',
                                isActive
                                  ? 'text-violet-300 bg-violet-500/10'
                                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                              )}
                            >
                              <item.icon
                                size={18}
                                className={cn(isActive ? 'text-violet-400' : 'text-white/20')}
                              />
                            </Link>
                          );
                        }

                        // ——— Expanded sidebar: item WITH children (accordion) ———
                        if (item.children) {
                          return (
                            <div key={item.label}>
                              <button
                                onClick={() => {
                                  uiSound.playClick();
                                  setExpanded(isExpanded ? null : item.label);
                                }}
                                className={cn(
                                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-all group border-l-2',
                                  isActive
                                    ? 'text-violet-300 bg-violet-500/[0.08] border-violet-500/60'
                                    : 'text-white/40 border-transparent hover:text-white/70 hover:bg-white/[0.03]'
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <item.icon
                                    size={16}
                                    className={cn(isActive ? 'text-violet-400' : 'text-white/20')}
                                  />
                                  <span className="font-medium tracking-tight">{item.label}</span>
                                </div>
                                <ChevronRight
                                  size={12}
                                  className={cn(
                                    'text-white/15 transition-transform duration-200',
                                    isExpanded && 'rotate-90'
                                  )}
                                />
                              </button>

                              <AnimatePresence initial={false}>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/[0.04] pl-3">
                                      {item.children.map((child) => {
                                        const ChildIcon = child.icon;
                                        const childActive = pathname === child.href;
                                        return (
                                          <Link
                                            key={child.href}
                                            href={child.href}
                                            onClick={() => uiSound.playClick()}
                                            onMouseEnter={() => router.prefetch(child.href)}
                                            className={cn(
                                              'flex items-center justify-between px-2 py-1.5 rounded-lg text-[12px] transition-all',
                                              childActive
                                                ? 'text-violet-300 bg-violet-500/[0.06]'
                                                : 'text-white/30 hover:text-white/60 hover:bg-white/[0.02]'
                                            )}
                                          >
                                            <div className="flex items-center gap-3">
                                              <ChildIcon
                                                size={13}
                                                className={cn(
                                                  childActive ? 'text-violet-400' : 'text-white/15'
                                                )}
                                              />
                                              <span className="truncate uppercase tracking-wider text-[10px]">
                                                {child.label}
                                              </span>
                                            </div>
                                            {getMenuCount(child.href) !== null && (
                                              <span className="text-[9px] font-bold bg-white/5 px-1.5 py-0.5 rounded-md text-white/40">
                                                {getMenuCount(child.href)}
                                              </span>
                                            )}
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        }

                        // ——— Expanded sidebar: simple link ———
                        return (
                          <Link
                            key={item.label}
                            href={item.href}
                            onMouseEnter={() => router.prefetch(item.href)}
                            onClick={() => uiSound.playClick()}
                            className={cn(
                              'flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-all group border-l-2',
                              pathname === item.href
                                ? 'text-violet-300 bg-violet-500/[0.08] border-violet-500/60'
                                : 'text-white/40 border-transparent hover:text-white/70 hover:bg-white/[0.03]'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon
                                size={16}
                                className={cn(
                                  pathname === item.href ? 'text-violet-400' : 'text-white/20'
                                )}
                              />
                              <span className="font-medium tracking-tight">{item.label}</span>
                            </div>
                            {getMenuCount(item.href) !== null && (
                              <span className="text-[9px] font-bold bg-white/5 px-1.5 py-0.5 rounded-md text-white/40 group-hover:bg-white/10 group-hover:text-white/60 transition-all">
                                {getMenuCount(item.href)}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
