'use client'

import { useState, useMemo } from 'react'
import { Telescope, UserCheck, GraduationCap, MapPin, Briefcase, Search, Download } from 'lucide-react'
import { PageShell, PageHeader, PageCard, PageCardHeader, EmptyState, AuroraTable, ATRow, ATCell, usePagination, AuroraPagination } from '@/components/shared/PageShell'
import { useAlumni } from '@/hooks/useAlumni'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { getFotoPublic } from '@/lib/utils'

export default function TracerPage() {
  const { dataAlumni, isLoading } = useAlumni()
  const [search, setSearch] = useState('')

  const stats = useMemo(() => {
    const total = dataAlumni.length
    const terlacak = dataAlumni.filter(a => a.sekolah_lanjutan && a.sekolah_lanjutan.trim() !== '').length
    const smpn = dataAlumni.filter(a => a.sekolah_lanjutan && /smpn|smp negeri|mtsn|mts negeri/i.test(a.sekolah_lanjutan)).length
    const swasta = terlacak - smpn
    return { total, terlacak, smpn, swasta }
  }, [dataAlumni])

  const chartData = useMemo(() => {
    const map = new Map<string, number>()
    dataAlumni.forEach(a => {
      const p = a.sekolah_lanjutan?.trim()
      if (p) {
        // Normalize names slightly
        const name = p.toUpperCase().replace('SMP NEGERI', 'SMPN').replace('MTS NEGERI', 'MTsN')
        map.set(name, (map.get(name) || 0) + 1)
      }
    })
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) // Top 5
  }, [dataAlumni])

  const filtered = useMemo(() => {
    return dataAlumni
      .filter(a => a.sekolah_lanjutan && a.sekolah_lanjutan.trim() !== '')
      .filter(a => !search || a.nama.toLowerCase().includes(search.toLowerCase()) || a.sekolah_lanjutan?.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.tahun_lulus.localeCompare(a.tahun_lulus))
  }, [dataAlumni, search])

  const pag = usePagination(filtered, 10)

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error('Tidak ada data terlacak untuk diekspor')
      return
    }
    const rows = filtered.map((s, i) => ({
      'No': i + 1,
      'Nama': s.nama,
      'NISN': s.nisn,
      'L/P': s.jk,
      'Tahun Lulus': s.tahun_lulus,
      'Sekolah Lanjutan': s.sekolah_lanjutan,
      'No WhatsApp': s.no_wa || '-'
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Tracer Study`)
    XLSX.writeFile(wb, `Tracer_Study_Export.xlsx`)
    toast.success('Data tracer berhasil diunduh')
  }

  return (
    <PageShell>
      <PageHeader
        icon={<Telescope className="w-6 h-6 text-amber-400" />}
        title="Tracer Study & Karir"
        subtitle="Pelacakan jejak alumni dan pemetaan sekolah lanjutan SMP"
        gradient="linear-gradient(135deg, #1a1000 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(245,158,11,0.25)"
        action={
          <button onClick={handleExport} className="btn-solid btn-sm bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-2 shadow-lg shadow-amber-900/20 transition-all">
            <Download size={14} /> Ekspor Data
          </button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Alumni Terlacak', value: stats.terlacak, icon: UserCheck, color: '#fbbf24' },
          { label: 'Lanjut SMPN/MTsN', value: stats.smpn, icon: GraduationCap, color: '#34d399' },
          { label: 'Lanjut Swasta', value: stats.swasta, icon: Briefcase, color: '#60a5fa' },
          { label: 'Persentase Track', value: `${stats.total > 0 ? Math.round((stats.terlacak / stats.total) * 100) : 0}%`, icon: MapPin, color: '#fb7185' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl p-5 flex items-center gap-4 transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(13,18,33,0.80)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <div className="text-2xl font-black text-white/90 tracking-tight">{value}</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] mt-0.5" style={{ color, opacity: 0.7 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chart */}
        <div className="lg:col-span-1">
          <PageCard>
             <PageCardHeader title="Top 5 Sekolah Lanjutan" icon={<GraduationCap className="w-4 h-4 text-amber-400" />} />
             <div className="h-[280px] w-full pt-4">
               {chartData.length === 0 ? (
                 <div className="h-full flex items-center justify-center"><p className="text-white/20 text-xs font-bold">Belum ada data lanjutan</p></div>
               ) : (
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData} layout="vertical" margin={{ left: -20, right: 10 }}>
                     <XAxis type="number" hide />
                     <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: 'rgba(255,255,255,0.4)' }} width={80} />
                     <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ background: '#0a0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                     <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                       {chartData.map((e, i) => <Cell key={i} fill={i === 0 ? '#fbbf24' : i === 1 ? '#34d399' : '#60a5fa'} />)}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               )}
             </div>
          </PageCard>
        </div>

        {/* Right: Data Table */}
        <div className="lg:col-span-2">
          <PageCard noPad>
             <div className="px-5 py-4 flex items-center justify-between border-b border-white/[0.04]">
               <h3 className="text-sm font-bold text-white/90">Data Pelacakan Alumni</h3>
               <div className="relative w-56">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                 <input 
                   type="text" 
                   placeholder="Cari nama / SMP..." 
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                   className="w-full h-9 pl-9 pr-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/60 outline-none focus:border-amber-500/30 transition-all"
                 />
               </div>
             </div>
             
             <>
             <AuroraTable headers={['ALUMNI', 'TAHUN', 'SEKOLAH LANJUTAN', 'STATUS']} loading={isLoading} empty={filtered.length === 0 ? <tr><td colSpan={4}><EmptyState icon={<Telescope className="w-8 h-8" />} title="Tidak ada data pelacakan yang cocok" /></td></tr> : undefined}>
               {pag.paginated.map(s => (
                 <ATRow key={s.id}>
                   <ATCell>
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-white/40 overflow-hidden">
                         {getFotoPublic(s.foto_url) ? <img src={getFotoPublic(s.foto_url)!} alt="" className="w-full h-full object-cover" /> : s.nama.charAt(0)}
                       </div>
                       <div>
                         <p className="text-xs font-bold text-white/80">{s.nama}</p>
                         <p className="text-[10px] text-white/30">{s.nisn} • {s.jk}</p>
                       </div>
                     </div>
                   </ATCell>
                   <ATCell><span className="text-xs font-bold text-amber-400/80">{s.tahun_lulus}</span></ATCell>
                   <ATCell><span className="text-[11px] font-bold text-white/70">{s.sekolah_lanjutan}</span></ATCell>
                   <ATCell>
                     <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Terlacak</span>
                   </ATCell>
                 </ATRow>
               ))}
             </AuroraTable>
             <AuroraPagination currentPage={pag.page} totalItems={pag.totalItems} perPage={pag.perPage} onPageChange={pag.setPage} onPerPageChange={pag.setPerPage} />
             </>
          </PageCard>
        </div>
      </div>
    </PageShell>
  )
}
