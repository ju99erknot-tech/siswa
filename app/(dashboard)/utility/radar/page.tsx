'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert, AlertTriangle, AlertCircle, CheckCircle2,
  Users, User, FileWarning, ImageOff, Hash, Calendar,
  RefreshCw, ChevronRight, Eye, XCircle, Filter,
} from 'lucide-react'
import { useSiswa } from '@/hooks/useSiswa'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app.store'
import {
  PageShell, PageHeader, StatCards, SearchBar, PageCard,
} from '@/components/shared/PageShell'
import type { Siswa } from '@/types'

// ── Anomaly Detection Engine ──────────────────────────────────

interface Anomaly {
  id: string
  siswaId: string
  nama: string
  kelas: string
  type: AnomalyType
  severity: 'critical' | 'warning' | 'info'
  message: string
  field: string
}

type AnomalyType =
  | 'nisn_format'
  | 'nisn_duplicate'
  | 'nik_missing'
  | 'nik_format'
  | 'nama_invalid'
  | 'tanggal_lahir_invalid'
  | 'foto_missing'
  | 'ortu_missing'
  | 'alamat_missing'
  | 'kelas_missing'
  | 'no_kk_missing'

const SEVERITY_CONFIG = {
  critical: {
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    color: '#f87171',
    label: 'Kritis',
    icon: XCircle,
  },
  warning: {
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    color: '#fbbf24',
    label: 'Peringatan',
    icon: AlertTriangle,
  },
  info: {
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.2)',
    color: '#60a5fa',
    label: 'Informasi',
    icon: AlertCircle,
  },
}

function detectAnomalies(data: Siswa[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  const nisnMap = new Map<string, string[]>()

  // Build NISN map for duplicate detection
  data.forEach(s => {
    const list = nisnMap.get(s.nisn) || []
    list.push(s.nama)
    nisnMap.set(s.nisn, list)
  })

  data.forEach(s => {
    const base = { siswaId: s.id, nama: s.nama, kelas: s.kelas || '-' }

    // NISN format (should be 10 digits)
    if (!/^\d{10}$/.test(s.nisn) && !s.nisn.startsWith('TMP-')) {
      anomalies.push({ ...base, id: `nisn-fmt-${s.id}`, type: 'nisn_format', severity: 'critical', message: `NISN "${s.nisn}" tidak valid (harus 10 digit)`, field: 'nisn' })
    }

    // NISN duplicate
    const dupes = nisnMap.get(s.nisn)
    if (dupes && dupes.length > 1) {
      anomalies.push({ ...base, id: `nisn-dup-${s.id}`, type: 'nisn_duplicate', severity: 'critical', message: `NISN duplikat dengan: ${dupes.filter(n => n !== s.nama).join(', ')}`, field: 'nisn' })
    }

    // NIK missing
    if (!s.nik || s.nik.trim() === '' || s.nik === '-') {
      anomalies.push({ ...base, id: `nik-miss-${s.id}`, type: 'nik_missing', severity: 'warning', message: 'NIK belum diisi', field: 'nik' })
    }
    // NIK format (should be 16 digits)
    else if (!/^\d{16}$/.test(s.nik)) {
      anomalies.push({ ...base, id: `nik-fmt-${s.id}`, type: 'nik_format', severity: 'warning', message: `NIK "${s.nik}" tidak valid (harus 16 digit)`, field: 'nik' })
    }

    // Nama invalid
    if (!s.nama || s.nama.length < 3 || /[0-9!@#$%^&*(){}[\]]/.test(s.nama)) {
      anomalies.push({ ...base, id: `nama-${s.id}`, type: 'nama_invalid', severity: 'critical', message: 'Nama mengandung karakter tidak valid atau terlalu pendek', field: 'nama' })
    }

    // Tanggal lahir invalid
    if (s.tanggal_lahir) {
      const birth = new Date(s.tanggal_lahir)
      const now = new Date()
      const age = (now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      if (age < 5 || age > 16) {
        anomalies.push({ ...base, id: `tgl-${s.id}`, type: 'tanggal_lahir_invalid', severity: 'warning', message: `Usia ${Math.floor(age)} tahun tidak realistis untuk siswa SD`, field: 'tanggal_lahir' })
      }
    } else {
      anomalies.push({ ...base, id: `tgl-miss-${s.id}`, type: 'tanggal_lahir_invalid', severity: 'warning', message: 'Tanggal lahir belum diisi', field: 'tanggal_lahir' })
    }

    // Foto missing
    if (!s.foto_url) {
      anomalies.push({ ...base, id: `foto-${s.id}`, type: 'foto_missing', severity: 'info', message: 'Foto profil belum tersedia', field: 'foto_url' })
    }

    // Orang tua missing
    if (!s.nama_ayah && !s.nama_ibu && !s.nama_wali) {
      anomalies.push({ ...base, id: `ortu-${s.id}`, type: 'ortu_missing', severity: 'warning', message: 'Data orang tua / wali belum diisi sama sekali', field: 'nama_ayah' })
    }

    // Alamat missing
    if (!s.alamat || s.alamat.trim() === '' || s.alamat === '-') {
      anomalies.push({ ...base, id: `alamat-${s.id}`, type: 'alamat_missing', severity: 'info', message: 'Alamat belum diisi', field: 'alamat' })
    }

    // Kelas missing
    if (!s.kelas || s.kelas.trim() === '') {
      anomalies.push({ ...base, id: `kelas-${s.id}`, type: 'kelas_missing', severity: 'critical', message: 'Kelas / rombel belum ditentukan', field: 'kelas' })
    }

    // No KK missing
    if (!s.no_kk || s.no_kk.trim() === '' || s.no_kk === '-') {
      anomalies.push({ ...base, id: `kk-${s.id}`, type: 'no_kk_missing', severity: 'info', message: 'No. Kartu Keluarga belum diisi', field: 'no_kk' })
    }
  })

  return anomalies
}

// ── Anomaly Card Component ────────────────────────────────────

function AnomalyCard({ anomaly, onView }: { anomaly: Anomaly; onView: () => void }) {
  const cfg = SEVERITY_CONFIG[anomaly.severity]
  const Icon = cfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-4 p-4 rounded-xl transition-all hover:scale-[1.005]"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}
      >
        <Icon size={18} style={{ color: cfg.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold text-white/85 truncate">{anomaly.nama}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
            style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}25` }}
          >
            {anomaly.kelas}
          </span>
        </div>
        <p className="text-xs text-white/45 leading-relaxed">{anomaly.message}</p>
        <span className="text-[10px] text-white/20 mt-1 block font-mono">Field: {anomaly.field}</span>
      </div>

      <button
        onClick={onView}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/5 transition-all flex-shrink-0"
        title="Lihat Detail Siswa"
      >
        <Eye size={16} />
      </button>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function RadarAnomaliPage() {
  const router = useRouter()
  const { data: dataSiswa, isLoading } = useSiswa()
  const { setDetailSiswa } = useAppStore()
  const [search, setSearch] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all')

  const anomalies = useMemo(() => detectAnomalies(dataSiswa), [dataSiswa])

  const filtered = useMemo(() => {
    return anomalies.filter(a => {
      const ms = !search || a.nama.toLowerCase().includes(search.toLowerCase()) || a.message.toLowerCase().includes(search.toLowerCase())
      const mf = filterSeverity === 'all' || a.severity === filterSeverity
      return ms && mf
    })
  }, [anomalies, search, filterSeverity])

  const stats = useMemo(() => ({
    total: anomalies.length,
    critical: anomalies.filter(a => a.severity === 'critical').length,
    warning: anomalies.filter(a => a.severity === 'warning').length,
    info: anomalies.filter(a => a.severity === 'info').length,
    healthScore: dataSiswa.length > 0
      ? Math.max(0, Math.round(100 - (anomalies.length / dataSiswa.length) * 15))
      : 100,
  }), [anomalies, dataSiswa])

  const handleViewSiswa = (siswaId: string) => {
    const siswa = dataSiswa.find(s => s.id === siswaId)
    if (siswa) setDetailSiswa(siswa)
  }

  const selectStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    color: 'rgba(255,255,255,0.75)',
    appearance: 'none' as const,
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='rgba(255,255,255,0.35)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat' as const,
    backgroundPosition: 'right 12px center',
    paddingRight: '36px',
  }

  return (
    <PageShell>
      {/* Header */}
      <PageHeader
        icon={<ShieldAlert className="w-6 h-6 text-amber-400" />}
        title="Radar Anomali"
        subtitle={`Data Quality Inspector • ${dataSiswa.length} siswa dianalisis`}
        glowColor="rgba(245,158,11,0.35)"
        gradient="linear-gradient(135deg, #1a1005 0%, #0c0820 50%, #050d1e 100%)"
        action={
          <div className="flex items-center gap-3">
            {/* Health Score */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${stats.healthScore >= 80 ? 'bg-emerald-400' : stats.healthScore >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                style={{ boxShadow: `0 0 8px ${stats.healthScore >= 80 ? '#34d399' : stats.healthScore >= 50 ? '#fbbf24' : '#f87171'}` }}
              />
              <span className="text-sm font-black text-white/80">{stats.healthScore}%</span>
              <span className="text-[10px] text-white/30 font-bold">HEALTH</span>
            </div>
          </div>
        }
      />

      {/* Stats */}
      <StatCards items={[
        { label: 'Total Anomali', value: stats.total, color: '#fbbf24', icon: <ShieldAlert size={18} /> },
        { label: 'Kritis', value: stats.critical, color: '#f87171', icon: <XCircle size={18} /> },
        { label: 'Peringatan', value: stats.warning, color: '#fbbf24', icon: <AlertTriangle size={18} /> },
        { label: 'Informasi', value: stats.info, color: '#60a5fa', icon: <AlertCircle size={18} /> },
      ]} />

      {/* Filter */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Cari anomali berdasarkan nama atau pesan..."
        right={
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value as any)}
            className="h-10 px-4 rounded-xl text-sm outline-none min-w-[160px]"
            style={selectStyle}
          >
            <option value="all">Semua Level</option>
            <option value="critical">🔴 Kritis</option>
            <option value="warning">🟡 Peringatan</option>
            <option value="info">🔵 Informasi</option>
          </select>
        }
      />

      {/* Anomaly List */}
      {isLoading ? (
        <PageCard>
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-white/20 animate-spin" />
          </div>
        </PageCard>
      ) : filtered.length === 0 ? (
        <PageCard>
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
            <div className="text-center">
              <h3 className="text-white font-bold text-lg">Database Bersih!</h3>
              <p className="text-white/30 text-sm mt-1">Tidak ditemukan anomali data {filterSeverity !== 'all' ? 'pada level ini' : ''}.</p>
            </div>
          </div>
        </PageCard>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map(a => (
              <AnomalyCard
                key={a.id}
                anomaly={a}
                onView={() => handleViewSiswa(a.siswaId)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </PageShell>
  )
}
