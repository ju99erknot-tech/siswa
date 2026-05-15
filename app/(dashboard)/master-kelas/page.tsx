'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers, Plus, Loader2, Trash2, Pencil, X, Search, Users, BookOpen,
  UserCheck, ChevronRight,
} from 'lucide-react'
import { useMasterKelas } from '@/hooks/useMasterKelas'
import { useGuru } from '@/hooks/useGuru'
import { useAppStore } from '@/store/app.store'
import {
  PageShell, PageHeader, StatCards, EmptyState,
} from '@/components/shared/PageShell'
import { ClassRoster } from '@/components/shared/ClassRoster'
import { SCHOOL } from '@/lib/school.config'
import { getKelasColor } from '@/lib/utils'
import type { MasterKelas } from '@/types'

export default function MasterKelasPage() {
  const { dataKelas, isLoading, addKelas, updateKelas, deleteKelas } = useMasterKelas()
  const { dataGuru } = useGuru()
  const { user, dataSiswa } = useAppStore()
  const pengaturan = useAppStore(s => s.pengaturan)
  const isAdmin = user?.role === 'admin'

  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState<MasterKelas | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [selectedKelas, setSelectedKelas] = useState<string | null>(null)

  // Form
  const [formNamaKelas, setFormNamaKelas] = useState('')
  const [formTingkat, setFormTingkat] = useState('1')
  const [formWaliKelasId, setFormWaliKelasId] = useState('')
  const [formTahunAjaran, setFormTahunAjaran] = useState(pengaturan?.tahun_ajaran || '2025/2026')
  const [saving, setSaving] = useState(false)

  const guruAktif = dataGuru.filter(g => g.status_aktif)
  const getGuruName = (id?: string) => id ? dataGuru.find(g => g.id === id)?.nama || '-' : undefined

  // Derive kelas from dataSiswa (actual classes in use)
  const kelasFromSiswa = useMemo(() =>
    Array.from(new Set(dataSiswa.map(s => s.kelas))).filter((k): k is string => !!k).sort()
  , [dataSiswa])

  // Merge: master_kelas + classes from siswa data
  const allKelas = useMemo(() => {
    const map = new Map<string, { nama: string; tingkat: string; waliId?: string; waliNama?: string; ta: string; isMaster: boolean }>()
    // From master_kelas
    dataKelas.forEach(k => {
      map.set(k.nama_kelas, { nama: k.nama_kelas, tingkat: k.tingkat, waliId: k.wali_kelas_id, waliNama: getGuruName(k.wali_kelas_id), ta: k.tahun_ajaran, isMaster: true })
    })
    // From siswa (add if not in master)
    kelasFromSiswa.forEach(k => {
      if (!map.has(k)) {
        map.set(k, { nama: k, tingkat: k.replace(/[^0-9]/g, '').charAt(0) || '?', waliNama: undefined, ta: pengaturan?.tahun_ajaran || '-', isMaster: false })
      }
    })
    return Array.from(map.values()).sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
  }, [dataKelas, kelasFromSiswa, dataGuru, pengaturan])

  // Siswa per kelas map
  const siswaPerKelas = useMemo(() => {
    const m: Record<string, typeof dataSiswa> = {}
    dataSiswa.forEach(s => { const k = s.kelas || ''; (m[k] = m[k] || []).push(s) })
    return m
  }, [dataSiswa])

  const filtered = allKelas.filter(k => k.nama.toLowerCase().includes(search.toLowerCase()))
  const totalSiswa = dataSiswa.length
  const totalRombel = allKelas.length
  const totalWithWali = allKelas.filter(k => k.waliNama).length

  // Selected kelas data
  const selectedSiswa = selectedKelas ? (siswaPerKelas[selectedKelas] || []) : []
  const selectedWali = selectedKelas ? allKelas.find(k => k.nama === selectedKelas)?.waliNama : undefined

  const openAdd = () => {
    setEditData(null); setFormNamaKelas(''); setFormTingkat('1'); setFormWaliKelasId('');
    setFormTahunAjaran(pengaturan?.tahun_ajaran || '2025/2026'); setShowModal(true)
  }
  const openEdit = (k: MasterKelas) => {
    setEditData(k); setFormNamaKelas(k.nama_kelas); setFormTingkat(k.tingkat);
    setFormWaliKelasId(k.wali_kelas_id || ''); setFormTahunAjaran(k.tahun_ajaran); setShowModal(true)
  }
  const handleSave = async () => {
    if (!formNamaKelas.trim()) return; setSaving(true)
    const payload = { nama_kelas: formNamaKelas.trim(), tingkat: formTingkat, wali_kelas_id: formWaliKelasId || undefined, tahun_ajaran: formTahunAjaran }
    if (editData) await updateKelas(editData.id, payload, editData.nama_kelas)
    else await addKelas(payload as Omit<MasterKelas, 'id'>)
    setSaving(false); setShowModal(false)
  }
  const handleDelete = async (id: string) => { await deleteKelas(id); setConfirmDelete(null) }

  return (
    <PageShell>
      <PageHeader
        icon={<Layers className="w-6 h-6 text-cyan-400" />}
        title="Master Kelas & Rombel"
        subtitle={`${SCHOOL.nama} — ${totalRombel} rombel • ${totalSiswa} siswa`}
        gradient="linear-gradient(135deg, #001a2e 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(34,211,238,0.28)"
        action={isAdmin ? (
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', boxShadow: '0 0 20px rgba(6,182,212,0.3)' }}>
            <Plus size={16} /> Tambah Kelas
          </button>
        ) : undefined}
      />

      <StatCards items={[
        { label: 'Total Rombel', value: totalRombel, color: '#8b5cf6', icon: <Layers className="w-5 h-5 text-violet-400" /> },
        { label: 'Total Siswa', value: totalSiswa, color: '#06b6d4', icon: <Users className="w-5 h-5 text-cyan-400" /> },
        { label: 'Wali Terisi', value: `${totalWithWali}/${totalRombel}`, color: '#10b981', icon: <UserCheck className="w-5 h-5 text-emerald-400" /> },
        { label: 'Guru Aktif', value: guruAktif.length, color: '#f59e0b', icon: <BookOpen className="w-5 h-5 text-amber-400" /> },
      ]} />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input type="text" placeholder="Cari kelas..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full h-11 pl-11 pr-4 rounded-xl text-sm text-white/80 placeholder-white/20 outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
      </div>

      {/* Main Content: Cards + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Class Cards */}
        <div className={selectedKelas ? 'lg:col-span-1' : 'lg:col-span-3'}>
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-violet-500 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Layers size={40} />} title="Belum Ada Kelas" subtitle="Tambahkan rombel atau input data siswa" />
          ) : (
            <div className={`grid gap-3 ${selectedKelas ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}>
              {filtered.map((k, i) => {
                const count = siswaPerKelas[k.nama]?.length || 0
                const color = getKelasColor(k.nama)
                const isSelected = selectedKelas === k.nama
                const masterEntry = dataKelas.find(mk => mk.nama_kelas === k.nama)

                return (
                  <motion.div key={k.nama}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedKelas(isSelected ? null : k.nama)}
                    className={`group cursor-pointer rounded-xl p-4 transition-all duration-300 ${isSelected ? 'ring-1 ring-violet-500/40' : ''}`}
                    style={{ background: isSelected ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isSelected ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)'}` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
                        style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
                        {k.tingkat}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white/80 truncate group-hover:text-violet-300 transition-colors">{k.nama}</h4>
                          {!k.isMaster && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/60 border border-amber-500/15 font-bold shrink-0">Auto</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-white/30 font-bold">{count} siswa</span>
                          {k.waliNama && <span className="text-[10px] text-emerald-400/50 font-medium truncate">👤 {k.waliNama}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isAdmin && masterEntry && (
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button onClick={e => { e.stopPropagation(); openEdit(masterEntry) }}
                              className="p-2 rounded-lg text-white/40 hover:text-cyan-400 hover:bg-white/10 transition-all active:scale-95"
                              title="Edit Kelas">
                              <Pencil size={14} />
                            </button>
                            <button onClick={e => { e.stopPropagation(); setConfirmDelete(masterEntry.id) }}
                              className="p-2 rounded-lg text-white/40 hover:text-rose-400 hover:bg-white/10 transition-all active:scale-95"
                              title="Hapus Kelas">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                        <ChevronRight size={14} className={`text-white/20 transition-transform ${isSelected ? 'rotate-90 text-violet-400' : ''}`} />
                      </div>
                    </div>

                    {/* Mini bar */}
                    {count > 0 && (
                      <div className="mt-3 h-1 bg-white/[0.03] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((count / 40) * 100, 100)}%`, background: color }} />
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Class Roster Detail */}
        <AnimatePresence mode="wait">
          {selectedKelas && (
            <div className="lg:col-span-2">
              <ClassRoster
                key={selectedKelas}
                kelas={selectedKelas}
                waliKelas={selectedWali}
                siswaList={selectedSiswa}
                onClose={() => setSelectedKelas(null)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Modal Add/Edit ──────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(8,9,13,0.85)', backdropFilter: 'blur(12px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl p-6 space-y-5"
              style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-white">{editData ? 'Edit Kelas' : 'Tambah Kelas Baru'}</h3>
                <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">Nama Kelas *</label>
                  <input value={formNamaKelas} onChange={e => setFormNamaKelas(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl text-sm text-white/80 outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    placeholder="contoh: I A, II B, VI C..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">Tingkat</label>
                    <select value={formTingkat} onChange={e => setFormTingkat(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl text-sm text-white/80 outline-none appearance-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {[1,2,3,4,5,6].map(t => <option key={t} value={String(t)}>Kelas {t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">Tahun Ajaran</label>
                    <input value={formTahunAjaran} onChange={e => setFormTahunAjaran(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl text-sm text-white/80 outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      placeholder="2025/2026" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/35 uppercase tracking-widest">Wali Kelas</label>
                  <select value={formWaliKelasId} onChange={e => setFormWaliKelasId(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl text-sm text-white/80 outline-none appearance-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <option value="">-- Pilih Wali Kelas --</option>
                    {guruAktif.map(g => <option key={g.id} value={g.id}>{g.nama} {g.nip ? `(${g.nip})` : ''}</option>)}
                  </select>
                  {guruAktif.length === 0 && <p className="text-[10px] text-amber-400/60 italic">Tambahkan guru terlebih dahulu.</p>}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white/50"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>Batal</button>
                <button onClick={handleSave} disabled={saving || !formNamaKelas.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', boxShadow: '0 0 16px rgba(6,182,212,0.25)' }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editData ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirm Delete ──────────────────── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(8,9,13,0.85)', backdropFilter: 'blur(12px)' }}
            onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null) }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-2xl p-6 space-y-4"
              style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-lg font-bold text-white">Hapus Kelas?</h3>
              <p className="text-sm text-white/40">Rombel dihapus. Data siswa tidak ikut terhapus.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white/50"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>Batal</button>
                <button onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700">Hapus</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  )
}
