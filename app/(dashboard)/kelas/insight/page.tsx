'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, Users, User, UserX, Camera,
  BookOpen, CheckCircle2, AlertTriangle,
  ChevronRight, TrendingUp, Eye,
} from 'lucide-react'
import { useSiswa } from '@/hooks/useSiswa'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app.store'
import {
  PageShell, PageHeader, SearchBar,
} from '@/components/shared/PageShell'
import type { Siswa } from '@/types'
import { getKelasColor } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────

interface KelasStats {
  kelas: string
  total: number
  laki: number
  perempuan: number
  hasFoto: number
  noFoto: number
  fotoPercent: number
  hasNIK: number
  hasOrtu: number
  hasAlamat: number
  completionScore: number
}

// ── Analyze per Kelas ─────────────────────────────────────────

function analyzePerKelas(data: Siswa[]): KelasStats[] {
  const map = new Map<string, Siswa[]>()

  // Group by kelas
  data.forEach(s => {
    const k = s.kelas || 'Tidak Diketahui'
    const list = map.get(k) || []
    list.push(s)
    map.set(k, list)
  })

  // Calculate stats
  const result: KelasStats[] = []
  map.forEach((students, kelas) => {
    const total = students.length
    const laki = students.filter(s => s.jk === 'L').length
    const perempuan = students.filter(s => s.jk === 'P').length
    const hasFoto = students.filter(s => s.foto_url).length
    const hasNIK = students.filter(s => s.nik && s.nik.trim() !== '' && s.nik !== '-').length
    const hasOrtu = students.filter(s => s.nama_ayah || s.nama_ibu || s.nama_wali).length
    const hasAlamat = students.filter(s => s.alamat && s.alamat.trim() !== '' && s.alamat !== '-').length

    // Composite completion score (weighted)
    const fotoPercent = total > 0 ? Math.round((hasFoto / total) * 100) : 0
    const nikPercent = total > 0 ? (hasNIK / total) * 100 : 0
    const ortuPercent = total > 0 ? (hasOrtu / total) * 100 : 0
    const alamatPercent = total > 0 ? (hasAlamat / total) * 100 : 0
    const completionScore = Math.round((nikPercent * 0.3 + ortuPercent * 0.3 + alamatPercent * 0.2 + fotoPercent * 0.2))

    result.push({
      kelas, total, laki, perempuan,
      hasFoto, noFoto: total - hasFoto, fotoPercent,
      hasNIK, hasOrtu, hasAlamat,
      completionScore,
    })
  })

  // Sort by kelas name
  return result.sort((a, b) => a.kelas.localeCompare(b.kelas, 'id'))
}

// ── Stat Bar ──────────────────────────────────────────────────

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  )
}

// ── Gender Bar ────────────────────────────────────────────────

function GenderBar({ laki, perempuan }: { laki: number; perempuan: number }) {
  const total = laki + perempuan
  if (total === 0) return null
  const pctL = (laki / total) * 100
  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-[10px] font-bold text-cyan-400 w-6 text-right">{laki}</span>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden flex">
        <div className="h-full bg-cyan-500/60 rounded-l-full" style={{ width: `${pctL}%` }} />
        <div className="h-full bg-pink-500/60 rounded-r-full" style={{ width: `${100 - pctL}%` }} />
      </div>
      <span className="text-[10px] font-bold text-pink-400 w-6">{perempuan}</span>
    </div>
  )
}

// ── Kelas Card ────────────────────────────────────────────────

function KelasCard({ stats, rank, onClick }: { stats: KelasStats; rank: number; onClick: () => void }) {
  const scoreColor = stats.completionScore >= 80 ? '#34d399' : stats.completionScore >= 50 ? '#fbbf24' : '#f87171'
  const kelasColor = getKelasColor(stats.kelas)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      onClick={onClick}
      className="group cursor-pointer rounded-2xl p-5 transition-all duration-300 hover:scale-[1.01]"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Top Row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black"
            style={{ background: `${kelasColor}15`, border: `1px solid ${kelasColor}30`, color: kelasColor }}
          >
            {stats.kelas.split(' ')[0]}
          </div>
          <div>
            <h3 className="text-white font-bold text-sm group-hover:text-violet-300 transition-colors">Kelas {stats.kelas}</h3>
            <p className="text-[10px] text-white/30 font-medium">{stats.total} siswa</p>
          </div>
        </div>

        {/* Completion Score */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: `${scoreColor}10`, border: `1px solid ${scoreColor}25` }}
        >
          <div className="w-2 h-2 rounded-full" style={{ background: scoreColor }} />
          <span className="text-xs font-black" style={{ color: scoreColor }}>{stats.completionScore}%</span>
        </div>
      </div>

      {/* Gender Distribution */}
      <div className="mb-4">
        <p className="text-[10px] text-white/25 font-bold uppercase mb-2">Distribusi Gender</p>
        <GenderBar laki={stats.laki} perempuan={stats.perempuan} />
      </div>

      {/* Data Metrics */}
      <div className="space-y-2.5">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-white/30 font-medium flex items-center gap-1">
              <Camera size={10} /> Foto Profil
            </span>
            <span className="text-[10px] font-bold text-white/50">{stats.hasFoto}/{stats.total}</span>
          </div>
          <MiniBar value={stats.hasFoto} max={stats.total} color="#a78bfa" />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-white/30 font-medium flex items-center gap-1">
              <BookOpen size={10} /> NIK Terisi
            </span>
            <span className="text-[10px] font-bold text-white/50">{stats.hasNIK}/{stats.total}</span>
          </div>
          <MiniBar value={stats.hasNIK} max={stats.total} color="#22d3ee" />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-white/30 font-medium flex items-center gap-1">
              <Users size={10} /> Data Orang Tua
            </span>
            <span className="text-[10px] font-bold text-white/50">{stats.hasOrtu}/{stats.total}</span>
          </div>
          <MiniBar value={stats.hasOrtu} max={stats.total} color="#34d399" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span className="text-[10px] text-white/20 group-hover:text-violet-400 transition-colors flex items-center gap-1 font-bold">
          Lihat Detail <ChevronRight size={12} />
        </span>
      </div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function KelasInsightPage() {
  const router = useRouter()
  const { data: dataSiswa, isLoading } = useSiswa()
  const { setFilterSiswa  } = useAppStore()
  const [search, setSearch] = useState('')

  const kelasStats = useMemo(() => analyzePerKelas(dataSiswa), [dataSiswa])

  const filtered = useMemo(() => {
    if (!search) return kelasStats
    return kelasStats.filter(k => k.kelas.toLowerCase().includes(search.toLowerCase()))
  }, [kelasStats, search])

  const globalStats = useMemo(() => {
    const total = dataSiswa.length
    const avgCompletion = kelasStats.length > 0
      ? Math.round(kelasStats.reduce((sum, k) => sum + k.completionScore, 0) / kelasStats.length)
      : 0
    const bestKelas = kelasStats.reduce((best, k) => k.completionScore > best.completionScore ? k : best, { kelas: '-', completionScore: 0 } as KelasStats)
    const worstKelas = kelasStats.reduce((worst, k) => k.completionScore < worst.completionScore ? k : worst, { kelas: '-', completionScore: 100 } as KelasStats)

    return { total, rombel: kelasStats.length, avgCompletion, bestKelas: bestKelas.kelas, worstKelas: worstKelas.kelas }
  }, [dataSiswa, kelasStats])

  const handleKelasClick = (kelas: string) => {
    setFilterSiswa({ kelas, search: '', jk: 'all' })
    router.push('/siswa')
  }

  return (
    <PageShell>
      {/* Header */}
      <PageHeader
        icon={<BarChart3 className="w-6 h-6 text-cyan-400" />}
        title="Kelas Insight"
        subtitle={`Analytics per rombongan belajar • ${globalStats.rombel} rombel aktif`}
        glowColor="rgba(34,211,238,0.35)"
        gradient="linear-gradient(135deg, #051a1a 0%, #0c0820 50%, #050d1e 100%)"
        action={
          <div className="flex items-center gap-3">
            {/* Avg Completion */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <TrendingUp size={14} className="text-cyan-400" />
              <span className="text-sm font-black text-white/80">{globalStats.avgCompletion}%</span>
              <span className="text-[10px] text-white/30 font-bold">AVG</span>
            </div>
          </div>
        }
      />

      {/* Global Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          className="rounded-xl p-4 flex items-center gap-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase">Total Siswa</p>
            <p className="text-xl font-black text-white">{globalStats.total}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-xl p-4 flex items-center gap-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase">Jumlah Rombel</p>
            <p className="text-xl font-black text-white">{globalStats.rombel}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl p-4 flex items-center gap-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase">Terlengkap</p>
            <p className="text-xl font-black text-white">{globalStats.bestKelas}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-xl p-4 flex items-center gap-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase">Perlu Perhatian</p>
            <p className="text-xl font-black text-white">{globalStats.worstKelas}</p>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Cari kelas atau rombel..."
      />

      {/* Kelas Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((k, i) => (
            <KelasCard
              key={k.kelas}
              stats={k}
              rank={i}
              onClick={() => handleKelasClick(k.kelas)}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/10">
            <BarChart3 size={32} />
          </div>
          <div className="text-center">
            <h3 className="text-white font-bold">Tidak Ada Data</h3>
            <p className="text-white/30 text-xs mt-1">Belum ada data kelas yang tersedia.</p>
          </div>
        </div>
      )}
    </PageShell>
  )
}
