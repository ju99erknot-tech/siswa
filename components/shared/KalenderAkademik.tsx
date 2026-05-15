'use client'
import { useState, useMemo } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, Clock } from 'lucide-react'
import { useAgenda } from '@/hooks/useAgenda'
import { formatTanggal } from '@/lib/utils'

const DAYS = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']
const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

export function KalenderAkademik() {
  const { dataAgenda, addAgenda, deleteAgenda } = useAgenda()
  const [cur, setCur] = useState(new Date())
  const [sel, setSel] = useState<Date|null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [nev, setNev] = useState({ judul:'', waktu:'' })
  const y = cur.getFullYear(), m = cur.getMonth()

  const days = useMemo(() => {
    const f = new Date(y,m,1).getDay(), dim = new Date(y,m+1,0).getDate()
    const d: (Date|null)[] = []
    for(let i=0;i<f;i++) d.push(null)
    for(let i=1;i<=dim;i++) d.push(new Date(y,m,i))
    while(d.length<42) d.push(null)
    return d
  }, [y,m])

  const getEvts = (d: Date) => {
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    return dataAgenda.filter(a => a.tanggal?.startsWith(ds))
  }

  const isToday = (d: Date) => {
    const t = new Date()
    return d.getDate()===t.getDate() && d.getMonth()===t.getMonth() && d.getFullYear()===t.getFullYear()
  }

  const isSel = (d: Date) => sel && d.getDate()===sel.getDate() && d.getMonth()===sel.getMonth() && d.getFullYear()===sel.getFullYear()

  const upcoming = useMemo(() => {
    const t = new Date(); t.setHours(0,0,0,0)
    return dataAgenda.filter(a => new Date(a.tanggal)>=t).sort((a,b)=>new Date(a.tanggal).getTime()-new Date(b.tanggal).getTime()).slice(0,5)
  }, [dataAgenda])

  const selEvts = sel ? getEvts(sel) : []

  const handleAdd = async () => {
    if(!nev.judul.trim() || !sel) return
    const ds = `${sel.getFullYear()}-${String(sel.getMonth()+1).padStart(2,'0')}-${String(sel.getDate()).padStart(2,'0')}`
    const ok = await addAgenda({ judul: nev.judul, isi: '', tanggal: ds, waktu: nev.waktu||undefined })
    if(ok) { setNev({ judul:'', waktu:'' }); setShowAdd(false) }
  }

  const getDiff = (ds: string) => {
    const e = new Date(ds), t = new Date(); t.setHours(0,0,0,0); e.setHours(0,0,0,0)
    const diff = Math.ceil((e.getTime()-t.getTime())/(1000*60*60*24))
    if(diff===0) return 'Hari ini'; if(diff===1) return 'Besok'; if(diff>0) return `${diff} hari lagi`; return 'Sudah lewat'
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background:'rgba(13,18,33,0.80)', border:'1px solid rgba(255,255,255,0.07)', backdropFilter:'blur(20px)' }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-violet-400" /><h3 className="font-bold text-white/85 text-sm">Kalender</h3></div>
        <div className="flex items-center gap-1">
          <button onClick={()=>setCur(new Date(y,m-1,1))} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/05"><ChevronLeft size={14} /></button>
          <span className="text-xs font-bold text-white/60 min-w-[80px] text-center">{MONTHS[m]} {y}</span>
          <button onClick={()=>setCur(new Date(y,m+1,1))} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/05"><ChevronRight size={14} /></button>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">{DAYS.map(d=><div key={d} className="text-center text-[9px] font-bold text-white/25 uppercase py-1">{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d,i) => {
            if(!d) return <div key={`e-${i}`} />
            const evts = getEvts(d), today=isToday(d), s=isSel(d)
            return (
              <button key={d.toISOString()} onClick={()=>setSel(d)} className="relative h-9 rounded-lg flex flex-col items-center justify-center text-xs transition-all"
                style={{ background:s?'rgba(139,92,246,0.20)':today?'rgba(139,92,246,0.08)':'transparent', border:s?'1px solid rgba(139,92,246,0.30)':today?'1px solid rgba(139,92,246,0.15)':'1px solid transparent', color:today?'#a78bfa':'rgba(255,255,255,0.55)', fontWeight:today||s?700:400 }}>
                <span>{d.getDate()}</span>
                {evts.length>0 && <div className="absolute bottom-0.5 flex gap-0.5">{evts.slice(0,3).map((e,j)=><div key={j} className="w-1 h-1 rounded-full bg-violet-400" />)}</div>}
              </button>
            )
          })}
        </div>
        {sel && (
          <div className="mt-4 pt-4" style={{ borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-white/50">{formatTanggal(sel)}</p>
              <button onClick={()=>setShowAdd(true)} className="w-6 h-6 rounded-lg flex items-center justify-center text-violet-400 hover:bg-violet-500/10"><Plus size={14} /></button>
            </div>
            {showAdd && (
              <div className="mb-3 p-3 rounded-xl space-y-2" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <input value={nev.judul} onChange={e=>setNev(p=>({...p,judul:e.target.value}))} placeholder="Judul agenda..." className="w-full h-8 px-3 rounded-lg text-xs outline-none" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.80)' }} autoFocus />
                <input value={nev.waktu} onChange={e=>setNev(p=>({...p,waktu:e.target.value}))} placeholder="Waktu (opsional)" className="w-full h-8 px-3 rounded-lg text-xs outline-none" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.80)' }} />
                <div className="flex gap-2">
                  <button onClick={handleAdd} className="flex-1 h-8 rounded-lg text-xs font-bold text-white bg-violet-500 hover:bg-violet-400">Tambah</button>
                  <button onClick={()=>setShowAdd(false)} className="flex-1 h-8 rounded-lg text-xs font-bold text-white/40 hover:text-white/70">Batal</button>
                </div>
              </div>
            )}
            {selEvts.length===0 ? <p className="text-xs text-white/25 text-center py-4">Tidak ada agenda</p> : selEvts.map(e=>(
              <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg mb-1" style={{ background:'rgba(255,255,255,0.03)', borderLeft:'3px solid #a78bfa' }}>
                <div className="flex-1"><p className="text-xs font-medium text-white/70">{e.judul}</p>{e.waktu && <p className="text-[10px] text-white/30 flex items-center gap-1"><Clock size={10} />{e.waktu}</p>}</div>
                <button onClick={()=>deleteAgenda(e.id)} className="w-6 h-6 rounded flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        )}
        {!sel && upcoming.length>0 && (
          <div className="mt-4 pt-4" style={{ borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">Agenda Mendatang</p>
            {upcoming.map(e=>(
              <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg mb-1" style={{ background:'rgba(255,255,255,0.02)', borderLeft:'2px solid #a78bfa' }}>
                <div className="flex-1"><p className="text-xs font-medium text-white/60">{e.judul}</p><p className="text-[10px] text-white/25">{formatTanggal(e.tanggal)} · {getDiff(e.tanggal)}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
