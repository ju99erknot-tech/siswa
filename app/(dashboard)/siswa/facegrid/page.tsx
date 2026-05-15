'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Filter, Camera, 
  User, UserX, LayoutGrid, 
  Grid3X3, ArrowLeft, RefreshCw,
  MoreVertical, Download, Trash2,
  Users, ShieldAlert
} from 'lucide-react'
import { useSiswa } from '@/hooks/useSiswa'
import { useAppStore } from '@/store/app.store'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { 
  PageShell, PageHeader, StatCards, PageCard,
  AuroraTable, ATRow, ATCell, SearchBar,
  EmptyState,
} from '@/components/shared/PageShell'
import type { Siswa } from '@/types'
import { getInitials, getKelasColor, getFotoPublic } from '@/lib/utils'

export function StudentCard({ siswa, onUpdate }: { siswa: Siswa, onUpdate: (id: string, data: any) => Promise<boolean> }) {
  const [isError, setIsError] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const resolvedFoto = getFotoPublic(siswa.foto_url)
  const hasPhoto = resolvedFoto && !isError

  const handleDelete = async () => {
    if (!confirm(`Hapus foto untuk ${siswa.nama}?`)) return
    setIsDeleting(true)
    const success = await onUpdate(siswa.id, { foto_url: null })
    if (success) {
      toast.success(`Foto ${siswa.nama} berhasil dihapus`)
    }
    setIsDeleting(false)
  }

  const handleDownload = async () => {
    if (!siswa.foto_url) return
    try {
      const res = await fetch(siswa.foto_url)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `foto_${siswa.nisn}_${siswa.nama.replace(/\s+/g, '_')}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e) {
      toast.error('Gagal mengunduh foto.')
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative"
    >
      <div 
        className={`aspect-[3/4] rounded-2xl overflow-hidden border transition-all duration-500 relative bg-black/40 ${
          !hasPhoto 
            ? 'border-rose-500/20 group-hover:border-rose-500/50 shadow-lg shadow-rose-500/5' 
            : 'border-white/5 group-hover:border-violet-500/30'
        }`}
      >
        {hasPhoto ? (
          <Image 
            src={resolvedFoto!} 
            alt={siswa.nama}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setIsError(true)}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/10 group-hover:text-rose-500/40 transition-colors">
              <User size={24} />
            </div>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-tighter">No Identity</span>
          </div>
        )}

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
           <p className="text-white text-[10px] font-bold truncate mb-1">{siswa.nama}</p>
           <div className="flex gap-2">
              <button 
                onClick={handleDownload}
                disabled={!hasPhoto}
                className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-violet-500 transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                title="Download Foto"
              >
                <Download size={12} />
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting || !siswa.foto_url}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-rose-500 transition-all flex items-center justify-center disabled:opacity-30"
                title="Hapus Link Foto"
              >
                <Trash2 size={12} />
              </button>
           </div>
        </div>

        {/* Progress dot for data completion */}
        <div className="absolute top-2 right-2">
          <div 
            className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]"
            style={{ backgroundColor: getKelasColor(siswa.kelas || '') }}
          />
        </div>
      </div>
    </motion.div>
  )
}

export default function FaceGridPage() {
  const router = useRouter()
  const { data: dataSiswa, isLoading: loading, refetch: refreshSiswa, updateSiswa } = useSiswa()
  const KUMPULAN_KELAS = Array.from(new Set(dataSiswa.map(s => s.kelas))).filter((k): k is string => !!k).sort();
  const [search, setSearch] = useState('')
  const [filterKelas, setFilterKelas] = useState('all')
  const [filterNoPhoto, setFilterNoPhoto] = useState(false)
  const [gridSize, setGridSize] = useState<'sm' | 'md' | 'lg'>('md')
  const [isSyncing, setIsSyncing] = useState(false)
  const [visibleCount, setVisibleCount] = useState(60)

  const handleSync = async () => {
    const targets = dataSiswa.filter(s => s.foto_url)
    if (targets.length === 0) return toast.info('Tidak ada foto untuk disinkronkan.')
    
    setIsSyncing(true)
    let brokenCount = 0
    
    toast.promise(
      (async () => {
        for (const s of targets) {
          try {
            const url = getFotoPublic(s.foto_url)
            if (!url) continue
            
            const res = await fetch(url, { method: 'HEAD' })
            if (res.status === 404) {
              await updateSiswa(s.id, { foto_url: null })
              brokenCount++
            }
          } catch (e) {
            // Ignore network errors or CORS issues for now
          }
        }
        return brokenCount
      })(),
      {
        loading: `Memverifikasi ${targets.length} foto...`,
        success: (count) => {
          setIsSyncing(false)
          refreshSiswa()
          return count > 0 
            ? `Berhasil membersihkan ${count} link foto rusak!` 
            : 'Semua foto sinkron dengan storage.'
        },
        error: 'Terjadi kesalahan saat sinkronisasi.',
      }
    )
  }

  const filteredData = useMemo(() => {
    return dataSiswa.filter(s => {
      const matchSearch = s.nama.toLowerCase().includes(search.toLowerCase())
      const matchPhoto = filterNoPhoto ? !s.foto_url : true
      const matchKelas = filterKelas === 'all' || s.kelas === filterKelas
      return matchSearch && matchPhoto && matchKelas
    })
  }, [dataSiswa, search, filterNoPhoto, filterKelas])

  const stats = useMemo(() => {
    const total = dataSiswa.length
    const hasPhoto = dataSiswa.filter(s => s.foto_url).length
    const noPhoto = total - hasPhoto
    return { total, hasPhoto, noPhoto, pct: total ? Math.round((hasPhoto / total) * 100) : 0 }
  }, [dataSiswa])

  const selectStyle = { 
    background: 'rgba(255,255,255,0.04)', 
    border: '1px solid rgba(255,255,255,0.07)', 
    color: 'rgba(255,255,255,0.75)', 
    appearance: 'none' as const, 
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='rgba(255,255,255,0.35)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")", 
    backgroundRepeat: 'no-repeat' as const, 
    backgroundPosition: 'right 12px center', 
    paddingRight: '36px' 
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen pb-20">
      
      {/* Header Serasi dengan PageShell */}
      <PageHeader 
        title="FaceGrid Manager"
        subtitle={`Audit visual identitas siswa • ${stats.hasPhoto} terisi`}
        icon={<Camera className="text-violet-400" size={24} />}
        action={
          <div className="flex items-center gap-3">
            {/* Grid Size Toggle */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mr-2">
              <button 
                onClick={() => setGridSize('sm')}
                className={`p-2 rounded-lg transition-all ${gridSize === 'sm' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' : 'text-white/30 hover:text-white/60'}`}
                title="Grid Kecil"
              >
                <Grid3X3 size={16} />
              </button>
              <button 
                onClick={() => setGridSize('md')}
                className={`p-2 rounded-lg transition-all ${gridSize === 'md' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' : 'text-white/30 hover:text-white/60'}`}
                title="Grid Besar"
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            {/* Sync Action */}
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className={`btn-icon w-10 h-10 ${isSyncing ? 'animate-pulse cursor-wait' : 'text-amber-400 border-amber-500/20 hover:bg-amber-500/10'}`}
              title="Sinkronkan Identitas (Bersihkan Link Rusak)"
            >
              <ShieldAlert size={18} />
            </button>

            {/* Refresh */}
            <button 
              onClick={() => refreshSiswa()}
              className="btn-icon w-10 h-10 text-white/40 border-white/10 hover:bg-white/5"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Back to Buku Induk */}
            <button 
              onClick={() => router.push('/siswa')}
              className="btn-primary ml-2 py-2.5 px-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Kembali
            </button>
          </div>
        }
      />

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-obsidian p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase">Total Siswa</p>
            <p className="text-xl font-black text-white">{stats.total}</p>
          </div>
        </div>
        <div className="card-obsidian p-4 flex items-center gap-4 border-emerald-500/10">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <User size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase">Foto Tersedia</p>
            <p className="text-xl font-black text-white">{stats.hasPhoto}</p>
          </div>
        </div>
        <div className="card-obsidian p-4 flex items-center gap-4 border-rose-500/10">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <UserX size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase">Tanpa Foto</p>
            <p className="text-xl font-black text-white">{stats.noPhoto}</p>
          </div>
        </div>
        <div className="card-obsidian p-4 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-2">
             <p className="text-[10px] font-bold text-white/30 uppercase">Kelengkapan Visual</p>
             <span className="text-xs font-black text-violet-400">{stats.pct}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stats.pct}%` }}
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Unified Search & Filters */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Cari siswa untuk audit foto..."
        right={
          <div className="flex items-center gap-3">
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="h-10 px-4 rounded-xl text-sm outline-none min-w-[140px]"
              style={selectStyle}
            >
              <option value="all">Semua Kelas</option>
              {KUMPULAN_KELAS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>

            <button 
              onClick={() => setFilterNoPhoto(!filterNoPhoto)}
              className={`h-10 px-4 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold ${
                filterNoPhoto 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-lg shadow-rose-500/10' 
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
              }`}
            >
              <UserX size={16} />
              <span className="hidden sm:inline">No Identity</span>
            </button>
          </div>
        }
      />

      {/* Grid Container */}
      <div className={`grid gap-4 ${
        gridSize === 'sm' ? 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12' : 
        'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
      }`}>
        <AnimatePresence mode="popLayout">
          {filteredData.slice(0, visibleCount).map((siswa) => (
            <StudentCard key={siswa.id} siswa={siswa} onUpdate={updateSiswa} />
          ))}
        </AnimatePresence>
      </div>
      {visibleCount < filteredData.length && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setVisibleCount(v => v + 60)}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white/50 hover:text-white/80 transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Tampilkan {Math.min(60, filteredData.length - visibleCount)} lagi ({filteredData.length - visibleCount} tersisa)
          </button>
        </div>
      )}

      {filteredData.length === 0 && (
        <EmptyState
          icon={<LayoutGrid className="w-8 h-8" />}
          title="Tidak ada data ditemukan"
          subtitle="Coba sesuaikan kata kunci atau filter pencarian Anda"
          variant="search"
        />
      )}

    </div>
  )
}

