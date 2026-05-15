'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap, ArrowRight, UserCircle, KeyRound,
  Loader2, ShieldCheck, Users, BookOpen, Eye, EyeOff
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uiSound } from '@/lib/audio'
import { SCHOOL, BRAND } from '@/lib/school.config'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [role, setRole] = useState<'admin' | 'orangtua'>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nisn, setNisn] = useState('')
  const [tglLahir, setTglLahir] = useState('')
  const [loading, setLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [pengaturan, setPengaturan] = useState<any>(null)
  const [stats, setStats] = useState({ siswa: 0, kelas: 0 })

  useEffect(() => {
    setIsMounted(true)
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    
    // Fetch Pengaturan
    const { data: p } = await supabase.from('pengaturan').select('*').single()
    if (p) setPengaturan(p)

    // Fetch Stats
    const { count: sCount } = await supabase.from('siswa').select('*', { count: 'exact', head: true })
    const { data: classesData } = await supabase.from('siswa').select('kelas')
    const uniqueClasses = new Set(classesData?.map(s => s.kelas).filter(Boolean)).size
    
    setStats({ siswa: sCount || 0, kelas: uniqueClasses })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      
      if (role === 'admin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        // Logic login orang tua: cek nisn dan tgl_lahir di tabel siswa
        const { data: siswa, error: siswaError } = await supabase
          .from('siswa')
          .select('id, nama, nisn, tanggal_lahir')
          .eq('nisn', nisn)
          .eq('tanggal_lahir', tglLahir)
          .single()

        if (siswaError || !siswa) {
          throw new Error('NISN atau Tanggal Lahir tidak ditemukan.')
        }

        // Simpan data login di localStorage agar persist
        localStorage.setItem('portal_siswa_id', siswa.id)
        localStorage.setItem('portal_role', 'orangtua')
        
        toast.success(`Selamat Datang, Orang Tua dari ${siswa.nama}!`)
        router.push(`/portal?siswa=${siswa.id}`)
        return
      }

      uiSound.playSuccess()
      toast.success('Selamat Datang Kembali!')
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
      router.refresh()
    } catch (err: unknown) {
      uiSound.playError()
      const message = err instanceof Error ? err.message : 'Email atau password salah.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (!isMounted) return null

  const STATS_DATA = [
    { icon: Users, label: `${stats.siswa}+ Siswa`, color: 'border-violet-500/20 bg-violet-500/10 text-violet-300' },
    { icon: BookOpen, label: `${stats.kelas} Kelas Aktif`, color: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300' },
    { icon: ShieldCheck, label: '100% Digital', color: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' },
  ]

  return (
    <div
      className="min-h-screen w-full flex overflow-hidden"
      style={{ background: '#050811' }}
    >
      {/* ── LEFT PANEL — Aurora Branding ────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex flex-col relative overflow-hidden"
        style={{
          width: '54%',
          background: 'linear-gradient(145deg, #1a0533 0%, #0c0820 45%, #050d1e 100%)',
        }}
      >
        {/* Aurora orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', filter: 'blur(80px)', animation: 'pulse 6s ease-in-out infinite' }}
          />
          <div
            className="absolute -bottom-32 -right-16 w-[400px] h-[400px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #22d3ee 0%, transparent 70%)', filter: 'blur(100px)', animation: 'pulse 5s ease-in-out infinite 1.5s' }}
          />
          <div
            className="absolute top-1/2 left-1/3 w-[250px] h-[250px] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)', filter: 'blur(60px)', animation: 'pulse 4s ease-in-out infinite 0.5s' }}
          />
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(139,92,246,0.20) 1px, transparent 0)',
              backgroundSize: '36px 36px'
            }}
          />
          {/* Noise */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-14">
          {/* Logo top */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/30 overflow-hidden">
              {pengaturan?.logo_url ? (
                <img src={pengaturan.logo_url} alt="Logo" className="w-6 h-6 object-contain" />
              ) : (
                <GraduationCap className="w-5 h-5 text-white" />
              )}
            </div>
            <span className="text-white/60 font-bold text-xs tracking-[0.18em] uppercase">Portal Kesiswaan</span>
          </motion.div>

          {/* Main headline */}
          <div className="flex-1 flex flex-col justify-center mt-16">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <p
                className="text-xs font-bold uppercase tracking-[0.22em] mb-5"
                style={{ color: '#a78bfa' }}
              >
                {pengaturan?.nama_sekolah?.toUpperCase() || SCHOOL.nama.toUpperCase()}
              </p>
              <h1 className="text-[3.2rem] font-black text-white leading-[1.08] tracking-tight mb-6">
                Sistem<br />
                Informasi<br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(90deg, #c4b5fd 0%, #67e8f9 100%)' }}
                >
                  Kesiswaan
                </span>
              </h1>
              <p className="text-white/40 text-[0.9rem] leading-relaxed max-w-[340px]">
                Platform digital terpadu untuk manajemen data siswa, prestasi, mutasi, dan seluruh layanan kesiswaan.
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="flex flex-wrap gap-3 mt-12"
            >
              {STATS_DATA.map(({ icon: Icon, label, color }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.08 }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold ${color}`}
                >
                  <Icon className="w-3.5 h-3.5 opacity-80" />
                  {label}
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-white/20 text-[11px] font-medium tracking-wider"
          >
            {BRAND.copyright}
          </motion.p>
        </div>
      </motion.div>

      {/* ── RIGHT PANEL — Form ───────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center p-8 relative"
        style={{ background: '#090e1a' }}
      >
        {/* Subtle right-panel aurora */}
        <div
          className="absolute top-0 right-0 w-80 h-80 opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', filter: 'blur(80px)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[400px] relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center overflow-hidden">
              {pengaturan?.logo_url ? (
                <img src={pengaturan.logo_url} alt="Logo" className="w-6 h-6 object-contain" />
              ) : (
                <GraduationCap className="w-5 h-5 text-white" />
              )}
            </div>
            <span className="text-white/70 font-bold text-sm tracking-wider">PORTAL KESISWAAN</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-[2rem] font-black text-white tracking-tight leading-tight mb-2">
              {role === 'admin' ? <>Selamat<br />Datang 👋</> : <>Portal<br />Orang Tua 👨‍👩‍👧</>}
            </h2>
            <p className="text-white/35 text-sm">
              {role === 'admin' ? `Masuk ke sistem kesiswaan ${pengaturan?.nama_sekolah || SCHOOL.nama}` : 'Akses data perkembangan putra-putri Anda'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {role === 'admin' ? (
              <>
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">
                    Email Sekolah
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/25 group-focus-within:text-violet-400 transition-colors duration-200">
                      <UserCircle size={17} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@admin.sd.belajar.id"
                      className="w-full h-12 pl-11 pr-4 rounded-xl text-sm placeholder-white/20 outline-none transition-all duration-200"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: 'rgba(255,255,255,0.88)',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'rgba(139,92,246,0.45)'
                        e.currentTarget.style.background = 'rgba(139,92,246,0.06)'
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => toast.info('Silakan hubungi Wali Kelas atau Admin Sekolah untuk mereset password Anda.')}
                      className="text-[11px] font-semibold transition-colors"
                      style={{ color: '#a78bfa' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#c4b5fd')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#a78bfa')}
                    >
                      Lupa Password?
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/25 group-focus-within:text-violet-400 transition-colors duration-200">
                      <KeyRound size={17} />
                    </div>
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-12 pl-11 pr-12 rounded-xl text-sm placeholder-white/20 outline-none transition-all duration-200"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: 'rgba(255,255,255,0.88)',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'rgba(139,92,246,0.45)'
                        e.currentTarget.style.background = 'rgba(139,92,246,0.06)'
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/25 hover:text-white/50 transition-colors"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* NISN */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">
                    NISN Siswa
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/25 group-focus-within:text-cyan-400 transition-colors duration-200">
                      <GraduationCap size={17} />
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={nisn}
                      onChange={(e) => setNisn(e.target.value)}
                      placeholder="Masukkan 10 digit NISN"
                      className="w-full h-12 pl-11 pr-4 rounded-xl text-sm placeholder-white/20 outline-none transition-all duration-200"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: 'rgba(255,255,255,0.88)',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.45)'
                        e.currentTarget.style.background = 'rgba(34,211,238,0.06)'
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(34,211,238,0.12)'
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Tanggal Lahir */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">
                    Tanggal Lahir Siswa
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/25 group-focus-within:text-cyan-400 transition-colors duration-200">
                      <KeyRound size={17} />
                    </div>
                    <input
                      type="date"
                      required
                      value={tglLahir}
                      onChange={(e) => setTglLahir(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 rounded-xl text-sm placeholder-white/20 outline-none transition-all duration-200"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: 'rgba(255,255,255,0.88)',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.45)'
                        e.currentTarget.style.background = 'rgba(34,211,238,0.06)'
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(34,211,238,0.12)'
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-white/20 italic">Format: Tanggal / Bulan / Tahun</p>
                </div>
              </>
            )}

            {/* CTA */}
            <div className="pt-2">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2.5 group transition-all disabled:opacity-50"
                style={{
                  background: role === 'admin' 
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
                    : 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  boxShadow: role === 'admin'
                    ? '0 4px 20px rgba(139,92,246,0.35)'
                    : '0 4px 20px rgba(6,182,212,0.35)',
                }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{role === 'admin' ? 'Masuk ke Dashboard' : 'Lihat Data Siswa'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </motion.button>
            </div>
          </form>

          {/* Footer & Links */}
          <div
            className="mt-8 pt-6 border-t border-white/5 text-center space-y-4"
          >
            {role === 'admin' ? (
              <button
                type="button"
                onClick={() => setRole('orangtua')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/5 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                  <Users className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-xs font-semibold text-white/60 group-hover:text-cyan-400 transition-colors">
                  Masuk sebagai Orang Tua / Wali
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setRole('admin')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/5 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-400 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-xs font-semibold text-white/60 group-hover:text-violet-400 transition-colors">
                  Kembali ke Login Admin
                </span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050811] flex items-center justify-center"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  )
}
