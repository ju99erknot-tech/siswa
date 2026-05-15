'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Shield, Clock, Database, Server, Cpu,
  Terminal, Sparkles, Command, CheckCircle2, AlertTriangle, Fingerprint,
  Wifi, Zap, Lock, Users
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app.store'
import { createClient } from '@/lib/supabase/client'
import { getGreeting } from '@/lib/utils'
import { AnimatedCounter } from '@/components/shared/AnimatedCounter'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { SCHOOL, BRAND } from '@/lib/school.config'

const particleData = Array.from({ length: 40 }).map((_, i) => ({
  left: `${(i * 17) % 100}%`,
  top: `${(i * 23) % 100}%`,
  size: (i % 3) + 1.5,
  duration: (i % 6) + 4,
  delay: (i % 4),
  yOffset: -((i % 60) + 40),
  opacity: (i % 5) * 0.1 + 0.3
}))

const pulseAnim = {
  scale: [1, 1.05, 1],
  opacity: [0.8, 1, 0.8],
  transition: { repeat: Infinity, duration: 4, ease: "easeInOut" }
}

function TypingText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      i++
      setDisplayedText(text.slice(0, i))
      if (i >= text.length) clearInterval(timer)
    }, 40)
    return () => clearInterval(timer)
  }, [text])

  return (
    <p className="text-sm md:text-base font-mono text-cyan-400 min-h-[80px] leading-relaxed whitespace-pre-wrap">
      {displayedText}
      <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>_</motion.span>
    </p>
  )
}

function TelemetryBox({ icon: Icon, label, value, colorClass = 'text-cyan-400', glowColor = 'rgba(34,211,238,0.1)', delay = 0 }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className="flex flex-col p-5 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:scale-[1.03]"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: `0 8px 32px ${glowColor}` }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: glowColor.replace('0.1', '1') }} />
      <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
        <Icon size={64} />
      </div>
      <div className="flex items-center gap-2 mb-3 relative z-10">
        <Icon size={16} className={colorClass} />
        <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">{label}</span>
      </div>
      <span className="text-3xl font-black text-white tracking-tighter relative z-10 drop-shadow-md">
        <AnimatedCounter value={typeof value === 'number' ? value : 0} duration={1500} />
      </span>
    </motion.div>
  )
}

export default function CommandCenterDashboard() {
  const { user, isFetching, dataSiswa, dataPrestasi, dataGuru, dataKelas } = useAppStore()
  const router = useRouter()
  const [stats, setStats] = useState({ total: 0, laki: 0, peremp: 0, prestasi: 0, bdays: 0, guru: 0, kelas: 0 })
  const [loading, setLoading] = useState(true)
  const [aiMessage, setAiMessage] = useState('Menghubungkan ke Aurora Core...')
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (isFetching) {
      setLoading(true)
      return
    }
    
    setLoading(true)
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const bdaysCount = dataSiswa.filter(s => {
      if (!s.tanggal_lahir) return false
      return new Date(s.tanggal_lahir).getMonth() + 1 === currentMonth
    }).length

    setStats({
      total: dataSiswa.length,
      laki: dataSiswa.filter(s => s.jk === 'L').length,
      peremp: dataSiswa.filter(s => s.jk === 'P').length,
      prestasi: dataPrestasi.length,
      bdays: bdaysCount,
      guru: dataGuru.length,
      kelas: dataKelas.length
    })

    // Generate AI Intelligence Summary
    setTimeout(() => {
      setAiMessage(
        `${getGreeting(user?.name?.split(' ')[0])}. \n` +
        `Aurora Core mendeteksi ${dataSiswa.length} data siswa, ${dataGuru.length} guru aktif, dan ${dataKelas.length} rombongan belajar. \n` +
        (bdaysCount > 0 ? `Terdapat ${bdaysCount} siswa yang merayakan ulang tahun bulan ini! 🎉 \n` : '') +
        `Seluruh modul sinkronisasi beroperasi normal.`
      )
      setLoading(false)
    }, 800)
  }, [isFetching, dataSiswa, dataPrestasi, dataGuru, dataKelas, user])

  return (
    <div className="min-h-screen bg-[#050811] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">

      {/* Sci-Fi Tech Grid & Data Particles */}
      <div className="absolute inset-0 bg-[#050811] overflow-hidden pointer-events-none">
        
        {/* Animated Perspective Grid — violet-cyan blend to bridge sidebar color */}
        <div className="absolute inset-0 opacity-[0.12]" style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: 'center center',
          maskImage: 'radial-gradient(ellipse at center, black 10%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 10%, transparent 80%)'
        }} />

        {/* Floating Code Particles */}
        <div className="absolute inset-0">
          {particleData.map((p, i) => (
            <motion.div
              key={i}
              className="absolute bg-cyan-400 rounded-full mix-blend-screen shadow-[0_0_10px_rgba(34,211,238,0.8)]"
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
              }}
              animate={{
                y: [0, p.yOffset],
                opacity: [0, p.opacity, 0],
                scale: [0.5, 1.2, 0.5]
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-[50%] h-[50%] rounded-full opacity-[0.15] blur-[120px]" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
        <div className="absolute bottom-0 right-1/4 w-[50%] h-[50%] rounded-full opacity-[0.08] blur-[100px]" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
      </div>

      <div className="w-full max-w-6xl relative z-10 flex flex-col gap-8">

        {/* Top Header: Commander Info */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-widest flex items-center gap-3">
              <Shield className="text-cyan-400" /> COMMAND CENTER
            </h1>
            <p className="text-xs text-white/40 font-mono mt-1">
              NODE: {BRAND.version} // SECURE CONNECTION // {SCHOOL.nama}
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.05] p-3 rounded-2xl backdrop-blur-md">
            <Clock size={16} className="text-violet-400" />
            <span className="font-mono text-sm text-white/80 tracking-widest">{time ? format(time, 'HH:mm:ss') : '--:--:--'}</span>
            <div className="w-px h-4 bg-white/20" />
            <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">Live</span>
          </div>
        </motion.div>

        {/* The Core: AI Orb & Main Intelligence */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

          {/* AI Orb (Left) */}
          <div className="lg:col-span-4 flex items-center justify-center p-12 relative">
            {/* Hologram Rings */}
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="absolute w-64 h-64 border border-cyan-500/20 rounded-full border-dashed" />
            <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }} className="absolute w-52 h-52 border-2 border-violet-500/10 rounded-full" />

            {/* The Orb */}
            <motion.div animate={pulseAnim} className="relative w-32 h-32 rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(34,211,238,0.4)]" style={{ background: 'radial-gradient(circle at 30% 30%, #a78bfa, #06b6d4, #000)' }}>
              <div className="absolute inset-0 rounded-full blur-md opacity-50 bg-gradient-to-tr from-cyan-400 to-violet-500" />
              <Sparkles className="text-white relative z-10 opacity-80" size={32} />
            </motion.div>
          </div>

          {/* AI Terminal Output (Right) */}
          <div className="lg:col-span-8 bg-black/40 backdrop-blur-xl border border-white/[0.05] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />

            <div className="flex items-center gap-2 mb-6">
              <Terminal size={16} className="text-cyan-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Aurora AI Output</span>
            </div>

            {loading ? (
              <div className="h-[80px] flex items-center gap-3 text-cyan-400/50 font-mono text-sm">
                <Loader /> Decoding telemetry...
              </div>
            ) : (
              <TypingText text={aiMessage} />
            )}
          </div>
        </motion.div>

        {/* Lower Section: Real Data HUD */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10 mt-4">
          <TelemetryBox icon={Users} label="Total Siswa" value={stats.total} colorClass="text-cyan-400" glowColor="rgba(34,211,238,0.15)" delay={0.4} />
          <TelemetryBox icon={Shield} label="Siswa Laki-laki" value={stats.laki} colorClass="text-blue-400" glowColor="rgba(96,165,250,0.15)" delay={0.5} />
          <TelemetryBox icon={Sparkles} label="Siswa Perempuan" value={stats.peremp} colorClass="text-pink-400" glowColor="rgba(244,114,182,0.15)" delay={0.6} />
          <TelemetryBox icon={Activity} label="Guru Aktif" value={stats.guru} colorClass="text-amber-400" glowColor="rgba(251,191,36,0.15)" delay={0.7} />
          <TelemetryBox icon={Database} label="Master Kelas" value={stats.kelas} colorClass="text-emerald-400" glowColor="rgba(52,211,153,0.15)" delay={0.8} />
          <TelemetryBox icon={Terminal} label="Prestasi" value={stats.prestasi} colorClass="text-violet-400" glowColor="rgba(139,92,246,0.15)" delay={0.9} />
        </div>

        {/* Global Command Prompt Hint */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ duration: 1, delay: 1.2 }} className="mt-8 flex flex-col items-center justify-center gap-3 hover:opacity-100 transition-opacity">
          <Fingerprint size={24} className="text-violet-400 animate-pulse" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 text-center max-w-sm">
            Tampilan khusus komando. Untuk mengelola data spesifik, navigasikan melalui menu di sebelah kiri.
          </p>
        </motion.div>

      </div>
    </div>
  )
}

function Loader() {
  return <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
}
