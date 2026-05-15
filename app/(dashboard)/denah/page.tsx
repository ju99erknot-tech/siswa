'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, LayoutGrid, Maximize2, RotateCcw, 
  Printer, ArrowLeft, Shield, Sparkles, User, RefreshCcw
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageShell } from '@/components/shared/PageShell'
import { getInitials, getFotoPublic } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

interface Siswa {
  id: string
  nama: string
  nisn: string
  jk: string
  foto_url: string | null
}

interface Desk {
  id: string
  siswaId: string | null
}

const ROWS = 6
const COLS = 6
const TOTAL_DESKS = ROWS * COLS

export default function DenahKelasPage() {
  const [kelas, setKelas] = useState<string>('')
  const [masterKelas, setMasterKelas] = useState<{nama_kelas: string}[]>([])
  const [siswa, setSiswa] = useState<Siswa[]>([])
  const [desks, setDesks] = useState<Desk[]>(
    Array.from({ length: TOTAL_DESKS }).map((_, i) => ({ id: `desk-${i}`, siswaId: null }))
  )
  const [selectedSiswaId, setSelectedSiswaId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchKelas = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('master_kelas').select('nama_kelas').order('tingkat')
      if (data) {
        setMasterKelas(data)
        if (data.length > 0) setKelas(data[0].nama_kelas)
      }
    }
    fetchKelas()
  }, [])

  useEffect(() => {
    if (!kelas) return
    const fetchSiswa = async () => {
      setIsLoading(true)
      const supabase = createClient()
      const { data } = await supabase.from('siswa').select('id, nama, nisn, jk, foto_url').eq('kelas', kelas)
      if (data) {
        setSiswa(data)
        // Reset desks when class changes
        setDesks(Array.from({ length: TOTAL_DESKS }).map((_, i) => ({ id: `desk-${i}`, siswaId: null })))
        setSelectedSiswaId(null)
      }
      setIsLoading(false)
    }
    fetchSiswa()
  }, [kelas])

  const handleDeskClick = (deskId: string) => {
    const deskIndex = desks.findIndex(d => d.id === deskId)
    const currentDesk = desks[deskIndex]

    if (selectedSiswaId) {
      // If clicking a desk while a student is selected: Place student
      
      // First, remove this student from any other desk
      const newDesks = desks.map(d => 
        d.siswaId === selectedSiswaId ? { ...d, siswaId: null } : d
      )
      
      // Then, if the target desk already has a student, swap them to the old desk?
      // For simplicity, just overwrite and the old student goes back to unseated.
      newDesks[deskIndex] = { ...newDesks[deskIndex], siswaId: selectedSiswaId }
      
      setDesks(newDesks)
      setSelectedSiswaId(null) // Deselect after placing
      
    } else {
      // If clicking a desk without selecting a student:
      if (currentDesk.siswaId) {
        // Remove student from desk (unseat)
        const newDesks = [...desks]
        newDesks[deskIndex] = { ...newDesks[deskIndex], siswaId: null }
        setDesks(newDesks)
      }
    }
  }

  const handleAutoArrange = () => {
    // Simple auto arrange: boys on left, girls on right, or random
    // For now, let's just seat them sequentially
    const newDesks: Desk[] = Array.from({ length: TOTAL_DESKS }).map((_, i) => ({ id: `desk-${i}`, siswaId: null }))
    let deskIdx = 0
    
    // Sort by gender (L first, then P) to make it neat
    const sorted = [...siswa].sort((a, b) => a.jk.localeCompare(b.jk))
    
    sorted.forEach(s => {
      if (deskIdx < TOTAL_DESKS) {
        newDesks[deskIdx].siswaId = s.id
        deskIdx++
      }
    })
    
    setDesks(newDesks)
    toast.success('Siswa otomatis ditempatkan di kursi!')
  }

  const unseatedSiswa = siswa.filter(s => !desks.some(d => d.siswaId === s.id))
  
  return (
    <PageShell>
      <div className="flex flex-col h-[calc(100vh-2rem)] bg-[#050811] rounded-[2rem] border border-white/5 overflow-hidden">
        
        {/* Header */}
        <div className="flex-none p-6 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <LayoutGrid className="text-cyan-400" /> Interactive Seat Planner
            </h1>
            <p className="text-xs text-white/40">Desain denah tempat duduk kelas secara visual</p>
          </div>
          
          <div className="flex items-center gap-4">
            <select 
              value={kelas} 
              onChange={e => setKelas(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white focus:outline-none focus:border-cyan-500"
            >
              {masterKelas.map(k => <option key={k.nama_kelas} value={k.nama_kelas} className="bg-slate-900">{k.nama_kelas}</option>)}
            </select>
            <button onClick={handleAutoArrange} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 text-violet-300 font-bold text-sm hover:bg-violet-500/30 transition-all">
              <Sparkles size={16} /> Auto Arrange
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-900 font-black text-sm hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20">
              <Printer size={16} /> Cetak Denah
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel: Unseated Students */}
          <div className="w-80 bg-black/20 border-r border-white/5 flex flex-col no-print">
            <div className="p-4 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Belum Duduk</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs">{unseatedSiswa.length}</span>
              </h3>
              <p className="text-[10px] text-white/40 mt-1">Klik siswa lalu klik kursi kosong di kanan.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scroll">
              <AnimatePresence>
                {unseatedSiswa.map(s => (
                  <motion.div 
                    key={s.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setSelectedSiswaId(s.id === selectedSiswaId ? null : s.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                      selectedSiswaId === s.id 
                        ? 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.2)]' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {s.foto_url ? (
                      <img src={getFotoPublic(s.foto_url) || undefined} alt="foto" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white/40">
                        {getInitials(s.nama)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{s.nama}</p>
                      <p className={`text-[10px] font-bold ${s.jk === 'L' ? 'text-blue-400' : 'text-pink-400'}`}>
                        {s.jk === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {unseatedSiswa.length === 0 && !isLoading && (
                <div className="h-40 flex items-center justify-center text-white/20 text-xs font-bold text-center px-4">
                  Semua siswa sudah mendapat tempat duduk! 🎉
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: The Classroom */}
          <div className="flex-1 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-[#050811]/50 p-8 overflow-y-auto print-container custom-scroll">
            
            <div className="mx-auto w-full max-w-4xl bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-6 sm:p-12 shadow-2xl relative classroom-board mb-20">
              
              {/* Front Area (Board & Teacher) */}
              <div className="flex justify-between items-start mb-16 gap-4">
                <div className="w-32 hidden md:block opacity-0 no-print">spacer</div>
                
                {/* Whiteboard */}
                <div className="flex-1 max-w-xl h-16 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center shadow-[0_10px_40px_rgba(255,255,255,0.05)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                  <h2 className="text-white/80 font-black tracking-widest text-sm relative z-10">PAPAN TULIS</h2>
                  <div className="w-1/2 h-1 bg-white/10 mt-2 rounded-full relative z-10" />
                </div>

                {/* Guru Desk */}
                <div className="w-32 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center flex-col shadow-[0_0_30px_rgba(16,185,129,0.1)] relative z-10">
                  <Shield className="text-emerald-400 mb-1" size={20} />
                  <span className="text-[10px] font-bold text-emerald-400 tracking-widest">MEJA GURU</span>
                </div>
              </div>

              {/* Desks Grid */}
              <div 
                className="grid gap-x-6 sm:gap-x-12 gap-y-12 mx-auto mt-8" 
                style={{ 
                  gridTemplateColumns: `repeat(3, minmax(0, 1fr))`,
                  maxWidth: `1000px` 
                }}
              >
                {Array.from({ length: TOTAL_DESKS / 2 }).map((_, pairIndex) => {
                  const leftDesk = desks[pairIndex * 2]
                  const rightDesk = desks[pairIndex * 2 + 1]
                  
                  return (
                    <div key={`pair-${pairIndex}`} className="relative bg-white/[0.02] border border-white/[0.08] rounded-[2rem] p-3 sm:p-4 pt-6 sm:pt-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex gap-2 sm:gap-4 table-container hover:bg-white/[0.04] transition-all">
                      {/* Visual Desk Line (Meja Panjang) */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2.5 bg-gradient-to-b from-white/10 to-transparent rounded-b-xl" />
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-white/20 rounded-b-full" />
                      
                      {/* Left Seat */}
                      <SeatComponent desk={leftDesk} siswa={siswa} selectedSiswaId={selectedSiswaId} handleDeskClick={handleDeskClick} />
                      
                      {/* Right Seat */}
                      <SeatComponent desk={rightDesk} siswa={siswa} selectedSiswaId={selectedSiswaId} handleDeskClick={handleDeskClick} />
                    </div>
                  )
                })}
              </div>

            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: portrait; margin: 10mm; }
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100vw !important; 
            height: auto !important;
            min-height: 100vh !important;
            padding: 0 !important; 
            background: white !important; 
            margin: 0 !important;
            overflow: visible !important;
          }
          .no-print { display: none !important; }
          
          /* Board and Layout fixes for print */
          .classroom-board { 
            border: 2px solid #1e293b !important; 
            background: white !important; 
            box-shadow: none !important; 
            border-radius: 8px !important; 
            margin: 0 auto !important; 
            padding: 20px 10px !important;
            max-width: 100% !important;
            width: 100% !important;
            height: auto !important;
            min-height: 95vh !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
          }
          
          /* Compress Front Area */
          .mb-16 { margin-bottom: 20px !important; }
          .h-16 { height: 40px !important; min-height: 40px !important; }
          .h-20 { height: 50px !important; }
          .mt-16 { margin-top: 0 !important; }
          
          /* Table Pairs Compression */
          .table-container { 
            border: 1px solid #cbd5e1 !important; 
            background: #f8fafc !important; 
            padding: 6px !important;
            box-shadow: none !important;
            gap: 6px !important;
          }
          
          /* Seats & Avatars Compression */
          .aspect-[3\\/4] { aspect-ratio: auto !important; height: auto !important; min-height: 55px !important; }
          .bg-slate-800 { background: #f1f5f9 !important; border: 1px solid #94a3b8 !important; }
          .w-10, .h-10, .sm\\:w-12, .sm\\:h-12 { width: 32px !important; height: 32px !important; }
          .-top-5, .sm\\:-top-6 { top: -12px !important; }
          .mt-4, .sm\\:mt-6 { margin-top: 15px !important; }
          
          /* Text colors & sizes */
          h2, p, span { color: #0f172a !important; text-shadow: none !important; }
          .text-[9px], .sm\\:text-[11px] { font-size: 9px !important; }
          h2.text-sm { font-size: 12px !important; }
          .text-emerald-400 { color: #059669 !important; }
          .text-blue-400 { color: #2563eb !important; }
          .text-pink-400 { color: #db2777 !important; }
          .text-white\\/20, .text-white\\/80, .text-white { color: #475569 !important; }
          
          /* Force backgrounds to print */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          
          /* Adjust grid gaps for paper */
          .grid { gap: 15px !important; margin-top: 10px !important; }
        }
      `}} />
    </PageShell>
  )
}

function SeatComponent({ desk, siswa, selectedSiswaId, handleDeskClick }: any) {
  const s = siswa.find((x: any) => x.id === desk.siswaId)
  return (
    <motion.div
      layout
      onClick={() => handleDeskClick(desk.id)}
      className={`relative w-16 sm:w-20 aspect-[3/4] rounded-2xl flex flex-col items-center justify-center p-1 sm:p-2 cursor-pointer transition-all flex-1 ${
        s 
          ? (s.jk === 'L' ? 'bg-blue-500/10 border border-blue-500/30 hover:border-blue-500/60' : 'bg-pink-500/10 border border-pink-500/30 hover:border-pink-500/60')
          : selectedSiswaId 
            ? 'bg-cyan-500/5 border border-cyan-500/30 border-dashed hover:bg-cyan-500/20' 
            : 'bg-transparent border border-white/10 border-dashed hover:bg-white/5'
      }`}
    >
      {s ? (
        <>
          <div className={`absolute -top-5 sm:-top-6 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-[#0a0d16] flex items-center justify-center bg-slate-800 shadow-xl z-10 ${s.jk === 'L' ? 'text-blue-400' : 'text-pink-400'}`}>
            {s.foto_url ? (
              <img src={getFotoPublic(s.foto_url) || undefined} alt="foto" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User size={16} />
            )}
          </div>
          <p className="text-[9px] sm:text-[11px] font-bold text-white text-center leading-tight line-clamp-3 mt-4 sm:mt-6 px-1 relative z-0">{s.nama}</p>
          
          {/* Hover Remove overlay */}
          <div className="absolute inset-0 bg-rose-500/80 backdrop-blur-sm rounded-2xl opacity-0 hover:opacity-100 flex items-center justify-center transition-all z-20 no-print">
            <RotateCcw className="text-white w-6 h-6" />
          </div>
        </>
      ) : (
        <div className="text-white/20 text-[9px] font-black uppercase tracking-widest flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
          <div className="w-6 h-6 rounded-full border border-white/20 border-dashed flex items-center justify-center mb-1">
             <User size={10} />
          </div>
          KOSONG
        </div>
      )}
    </motion.div>
  )
}
