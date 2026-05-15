'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight, Sparkles, Plus, Trash2, Edit3, X } from 'lucide-react'
import { SCHOOL } from '@/lib/school.config'
import { PageShell, PageHeader, PageCard, PageCardHeader, AuroraInput, AuroraSelect } from '@/components/shared/PageShell'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, isToday, getDay, isAfter } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface AgendaItem {
  id: string; title: string; date: string
  type: 'akademik' | 'kegiatan' | 'libur' | 'ujian'; desc?: string
}

const TYPE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  akademik: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Akademik' },
  kegiatan: { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)', label: 'Kegiatan' },
  libur:    { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',  label: 'Libur' },
  ujian:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Ujian' },
}
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

// Fallback agenda if no DB data
function fallbackAgenda(d: Date): AgendaItem[] {
  const y = d.getFullYear(), m = d.getMonth()
  return [
    { id: 'f1', title: 'Upacara Bendera', date: new Date(y,m,1).toISOString(), type: 'akademik', desc: 'Senin pertama' },
    { id: 'f2', title: 'Penilaian Tengah Semester', date: new Date(y,m,8).toISOString(), type: 'ujian', desc: 'PTS Semester Genap' },
    { id: 'f3', title: 'Classmeeting', date: new Date(y,m,15).toISOString(), type: 'kegiatan', desc: 'Lomba antar kelas' },
    { id: 'f4', title: 'Libur Nasional', date: new Date(y,m,20).toISOString(), type: 'libur', desc: 'Hari Libur Nasional' },
    { id: 'f5', title: 'Pembagian Rapor', date: new Date(y,m,25).toISOString(), type: 'akademik', desc: 'Akhir semester' },
  ]
}

export default function KalenderPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [agenda, setAgenda] = useState<AgendaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<AgendaItem | null>(null)
  const [formData, setFormData] = useState({ title: '', desc: '', type: 'akademik', date: '' })

  // Fetch from Supabase (with fallback)
  const fetchAgenda = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('kalender').select('*').order('date', { ascending: true })
      if (error) throw error
      if (data && data.length > 0) {
        setAgenda(data as AgendaItem[])
      } else {
        setAgenda(fallbackAgenda(currentMonth))
      }
    } catch {
      setAgenda(fallbackAgenda(currentMonth))
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  useEffect(() => { fetchAgenda() }, [fetchAgenda])

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const days = eachDayOfInterval({ start, end: endOfMonth(currentMonth) })
    return [...Array.from({ length: getDay(start) }, () => null), ...days]
  }, [currentMonth])

  const getAgendaFor = useCallback((date: Date) => agenda.filter(a => isSameDay(new Date(a.date), date)), [agenda])
  const selectedAgenda = selectedDate ? getAgendaFor(selectedDate) : []

  // Upcoming events (next 30 days)
  const upcomingAgenda = useMemo(() => {
    const now = new Date()
    return agenda
      .filter(a => isAfter(new Date(a.date), now) || isToday(new Date(a.date)))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)
  }, [agenda])

  // Form handlers
  const openAddModal = (date?: Date) => {
    setEditItem(null)
    setFormData({
      title: '',
      desc: '',
      type: 'akademik',
      date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    })
    setModalOpen(true)
  }

  const openEditModal = (item: AgendaItem) => {
    setEditItem(item)
    setFormData({
      title: item.title,
      desc: item.desc || '',
      type: item.type,
      date: format(new Date(item.date), 'yyyy-MM-dd'),
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim()) { toast.error('Judul wajib diisi'); return }
    try {
      const supabase = createClient()
      const payload = {
        title: formData.title.trim(),
        desc: formData.desc.trim() || null,
        type: formData.type,
        date: formData.date,
      }
      if (editItem && !editItem.id.startsWith('f')) {
        await supabase.from('kalender').update(payload).eq('id', editItem.id)
        toast.success('Agenda diperbarui')
      } else {
        await supabase.from('kalender').insert(payload)
        toast.success('Agenda ditambahkan')
      }
      setModalOpen(false)
      fetchAgenda()
    } catch {
      toast.error('Gagal menyimpan agenda')
    }
  }

  const handleDelete = async (id: string) => {
    if (id.startsWith('f')) { toast.info('Agenda bawaan tidak bisa dihapus'); return }
    if (!confirm('Hapus agenda ini?')) return
    try {
      const supabase = createClient()
      await supabase.from('kalender').delete().eq('id', id)
      toast.success('Agenda dihapus')
      fetchAgenda()
    } catch {
      toast.error('Gagal menghapus')
    }
  }

  return (
    <PageShell>
      <PageHeader
        icon={<Calendar className="w-6 h-6 text-amber-400" />}
        title="Kalender Akademik"
        subtitle={`${SCHOOL.nama} — TA ${SCHOOL.tahunAjaran}`}
        gradient="linear-gradient(135deg, #1a1200 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(245,158,11,0.28)"
        action={
          <button
            onClick={() => openAddModal(selectedDate || new Date())}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-500/20"
          >
            <Plus size={14} /> Tambah Agenda
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <PageCard noPad>
            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all">
                <ChevronLeft size={16} />
              </button>
              <h2 className="text-sm font-black text-white/80 uppercase tracking-wider">
                {format(currentMonth, 'MMMM yyyy', { locale: idLocale })}
              </h2>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 px-3 py-2" style={{ background: 'rgba(255,255,255,0.015)' }}>
              {DAYS.map(d => (
                <div key={d} className="text-center text-[9px] font-black text-white/20 uppercase tracking-widest py-1">{d}</div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7 px-3 pb-3">
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`b-${i}`} className="h-16" />
                const dayAgenda = getAgendaFor(day)
                const td = isToday(day)
                const selected = selectedDate && isSameDay(day, selectedDate)
                return (
                  <motion.button key={day.toISOString()} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDate(day)}
                    className="h-16 flex flex-col items-center justify-start pt-1.5 rounded-xl transition-all"
                    style={{
                      background: selected ? 'rgba(139,92,246,0.15)' : td ? 'rgba(255,255,255,0.03)' : 'transparent',
                      border: selected ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                    }}>
                    <span className={`text-[13px] font-bold ${td ? 'text-violet-400' : selected ? 'text-white/90' : 'text-white/40'}`}>
                      {format(day, 'd')}
                    </span>
                    {td && <div className="w-1 h-1 rounded-full bg-violet-400 mt-0.5" style={{ boxShadow: '0 0 4px rgba(139,92,246,0.8)' }} />}
                    {dayAgenda.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {dayAgenda.slice(0, 3).map(a => (
                          <div key={a.id} className="w-1.5 h-1.5 rounded-full" style={{ background: TYPE_STYLE[a.type]?.color }} />
                        ))}
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              {Object.entries(TYPE_STYLE).map(([key, s]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-[9px] text-white/30 font-bold">{s.label}</span>
                </div>
              ))}
            </div>
          </PageCard>
        </div>

        <div className="lg:col-span-4 space-y-4">
          {/* Selected date detail */}
          <PageCard>
            <PageCardHeader
              title={selectedDate ? format(selectedDate, 'EEEE, d MMMM', { locale: idLocale }) : 'Pilih tanggal'}
              subtitle={selectedDate ? format(selectedDate, 'yyyy') : 'Klik tanggal untuk melihat agenda'}
              action={selectedDate ? (
                <button onClick={() => openAddModal(selectedDate)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                  title="Tambah agenda di tanggal ini"
                >
                  <Plus size={14} />
                </button>
              ) : undefined}
            />
            <div className="pt-4 space-y-2">
              {selectedDate ? (
                selectedAgenda.length > 0 ? selectedAgenda.map(a => {
                  const s = TYPE_STYLE[a.type]
                  return (
                    <div key={a.id} className="p-3 rounded-xl group relative" style={{ background: s.bg, border: `1px solid ${s.color}20` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: s.color }}>{s.label}</span>
                      </div>
                      <h4 className="text-[13px] font-bold text-white/80">{a.title}</h4>
                      {a.desc && <p className="text-[11px] text-white/35 mt-0.5">{a.desc}</p>}
                      {/* Edit/Delete buttons */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(a)}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 transition-all">
                          <Edit3 size={11} />
                        </button>
                        <button onClick={() => handleDelete(a.id)}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  )
                }) : <p className="text-xs text-white/25 italic">Tidak ada agenda</p>
              ) : <p className="text-xs text-white/20 italic">Klik tanggal untuk melihat agenda</p>}
            </div>
          </PageCard>

          {/* Upcoming events */}
          <PageCard>
            <PageCardHeader title="Agenda Mendatang" icon={<Sparkles className="w-4 h-4 text-amber-400" />} />
            <div className="pt-4 space-y-2">
              {upcomingAgenda.map(a => {
                const s = TYPE_STYLE[a.type]
                const d = new Date(a.date)
                return (
                  <div key={a.id} onClick={() => { setSelectedDate(d); setCurrentMonth(d) }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <div className="w-10 text-center flex-shrink-0">
                      <p className="text-lg font-black" style={{ color: s.color }}>{format(d, 'd')}</p>
                      <p className="text-[8px] font-bold text-white/20 uppercase">{format(d, 'MMM', { locale: idLocale })}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-white/65 truncate">{a.title}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: `${s.color}80` }}>{s.label}</p>
                    </div>
                  </div>
                )
              })}
              {upcomingAgenda.length === 0 && (
                <p className="text-xs text-white/20 italic py-4 text-center">Tidak ada agenda mendatang</p>
              )}
            </div>
          </PageCard>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(5,8,17,0.85)', backdropFilter: 'blur(12px)' }}
            onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md rounded-2xl"
              style={{ background: '#0d1221', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}
            >
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <h2 className="text-base font-bold text-white/90 flex items-center gap-2">
                  <Calendar size={16} className="text-amber-400" />
                  {editItem ? 'Edit Agenda' : 'Tambah Agenda'}
                </h2>
                <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-white/35 hover:text-white/70 hover:bg-white/[0.08] transition-all">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <AuroraInput
                  label="Judul Agenda"
                  placeholder="Contoh: Upacara Bendera"
                  value={formData.title}
                  onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                />
                <AuroraInput
                  label="Deskripsi (opsional)"
                  placeholder="Detail kegiatan..."
                  value={formData.desc}
                  onChange={e => setFormData(f => ({ ...f, desc: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <AuroraSelect
                    label="Kategori"
                    value={formData.type}
                    onChange={e => setFormData(f => ({ ...f, type: e.target.value }))}
                  >
                    <option value="akademik">Akademik</option>
                    <option value="kegiatan">Kegiatan</option>
                    <option value="libur">Libur</option>
                    <option value="ujian">Ujian</option>
                  </AuroraSelect>
                  <AuroraInput
                    label="Tanggal"
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <button
                  onClick={handleSave}
                  className="w-full h-11 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-all shadow-lg shadow-violet-500/20 mt-2"
                >
                  {editItem ? 'Simpan Perubahan' : 'Tambah Agenda'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  )
}
