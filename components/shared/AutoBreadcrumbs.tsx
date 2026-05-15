'use client'

import Link from 'next/link'
import { Home, ChevronRight } from 'lucide-react'
import {
  BookOpen, Contact, BarChart3, Layers, ClipboardList, BarChart2,
  FileText, Stethoscope, Coins, Rocket, Trophy, GraduationCap,
  Telescope, Download, Calendar, MessageSquare, Wallet, Settings,
  Map as MapIcon, RefreshCw, Camera, Sparkles, Tag, ScrollText,
  QrCode, CreditCard, Archive, Crown, UserPlus, UserMinus,
  FileBarChart, LayoutGrid, Briefcase, PenTool, FileStack,
  MapPin, FileImage, Key, Database,
} from 'lucide-react'

// ── Route label mapping with icons ───────────────────────────
const PATH_META: Record<string, { label: string; icon?: any }> = {
  siswa:           { label: 'Buku Induk', icon: BookOpen },
  guru:            { label: 'Data Guru', icon: Contact },
  gtk:             { label: 'Data GTK', icon: Contact },
  kelas:           { label: 'Statistik Kelas', icon: BarChart3 },
  'master-kelas':  { label: 'Master Kelas', icon: LayoutGrid },
  jurnal:          { label: 'Jurnal Guru', icon: BookOpen },
  absensi:         { label: 'Absensi Harian', icon: ClipboardList },
  'rekap-absensi': { label: 'Rekap Absensi', icon: BarChart2 },
  prestasi:        { label: 'Buku Prestasi', icon: Trophy },
  pip:             { label: 'PIP / Beasiswa', icon: Coins },
  uks:             { label: 'Layanan UKS', icon: Stethoscope },
  eskul:           { label: 'Ekstrakurikuler', icon: Rocket },
  mutasi:          { label: 'Mutasi', icon: Database },
  masuk:           { label: 'Mutasi Masuk', icon: UserPlus },
  keluar:          { label: 'Mutasi Keluar', icon: UserMinus },
  alumni:          { label: 'Buku Alumni', icon: GraduationCap },
  dapodik:         { label: 'Dapodik Sync', icon: RefreshCw },
  migration:       { label: 'AI Migration', icon: Sparkles },
  pengaturan:      { label: 'Pengaturan', icon: Settings },
  laporan:         { label: 'Laporan & Analitik', icon: FileBarChart },
  ekspor:          { label: 'Ekspor Data', icon: Download },
  surat:           { label: 'Surat Izin', icon: FileText },
  kalender:        { label: 'Kalender Akademik', icon: Calendar },
  whatsapp:        { label: 'WhatsApp Blast', icon: MessageSquare },
  wallet:          { label: 'Digital Wallet', icon: Wallet },
  profil:          { label: 'Profil Saya', icon: Contact },
  peta:            { label: 'Zonasi Siswa', icon: MapIcon },
  tracer:          { label: 'Tracer Study', icon: Telescope },
  utility:         { label: 'Alat Bantu', icon: Briefcase },
  facegrid:        { label: 'FaceGrid Audit', icon: Camera },
  insight:         { label: 'Insight', icon: Layers },
  tambah:          { label: 'Tambah Baru' },
  edit:            { label: 'Edit Data' },
  denah:           { label: 'Denah Duduk', icon: LayoutGrid },
  leaderboard:     { label: 'Leaderboard', icon: Crown },
  'kartu-pelajar': { label: 'Kartu Pelajar', icon: CreditCard },
  'label-meja':    { label: 'Label Meja', icon: Tag },
  'label-arsip':   { label: 'Label Map', icon: Archive },
  'label-rapor':   { label: 'Sampul Rapor', icon: ScrollText },
  'tanda-terima':  { label: 'Tanda Terima', icon: PenTool },
  'qr-code':       { label: 'QR Generator', icon: QrCode },
  'id-card':       { label: 'ID Card', icon: Contact },
  'upload-foto':   { label: 'Upload Foto', icon: Camera },
  'peta-spmb':     { label: 'Peta SPMB', icon: MapPin },
  cover:           { label: 'Cover Gen', icon: FileImage },
  album:           { label: 'Album Lulus', icon: Camera },
  sppd:            { label: 'e-SPPD', icon: CreditCard },
  jadwal:          { label: 'Jadwal Pelajaran', icon: Calendar },
}

export function AutoBreadcrumbs({ pathname }: { pathname: string }) {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return null

  // Detect UUID segments
  const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}/.test(s)

  const crumbs = segments.map((seg, i) => {
    const meta = PATH_META[seg]
    return {
      label: isUUID(seg) ? 'Detail' : (meta?.label || seg.charAt(0).toUpperCase() + seg.slice(1)),
      icon: isUUID(seg) ? undefined : meta?.icon,
      href: '/' + segments.slice(0, i + 1).join('/'),
      isLast: i === segments.length - 1,
    }
  })

  return (
    <nav className="flex items-center gap-1 text-[11px] font-medium mb-1 flex-wrap" aria-label="Breadcrumb">
      <Link
        href="/"
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all"
      >
        <Home size={12} />
      </Link>
      {crumbs.map((c, i) => {
        const Icon = c.icon
        return (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight size={10} className="text-white/10 mx-0.5" />
            {c.isLast ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-white/60 font-bold bg-white/[0.04]">
                {Icon && <Icon size={11} className="text-violet-400/60" />}
                {c.label}
              </span>
            ) : (
              <Link
                href={c.href}
                className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-white/25 hover:text-white/50 hover:bg-white/[0.03] transition-all"
              >
                {Icon && <Icon size={11} className="text-white/15" />}
                {c.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
