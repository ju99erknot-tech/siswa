'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  QrCode,
  Search,
  Loader2,
  User,
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
  Calendar,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { formatTanggal, getFotoPublic } from '@/lib/utils'
import type { Siswa } from '@/types'

const SCHOOL_NAME = process.env.NEXT_PUBLIC_SCHOOL_NAME || 'SDN 02 CIBADAK'

export default function VerifyPage() {
  const supabase = createClient()
  const [nisn, setNisn] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Siswa | null>(null)
  const [notFound, setNotFound] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nisn.trim()) return
    setLoading(true)
    setNotFound(false)
    setResult(null)

    try {
      const { data } = await supabase
        .from('siswa')
        .select('nama, nisn, jk, kelas, tempat_lahir, tanggal_lahir, foto_url')
        .eq('nisn', nisn.trim())
        .single()

      if (data) {
        setResult(data as Siswa)
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#08090d] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-violet-500/20 via-transparent to-cyan-500/10 pointer-events-none" />

        <div className="relative bg-[#0f1117]/80 backdrop-blur-xl border border-white/[0.07] rounded-3xl p-8 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-violet-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-1">
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Verifikasi Siswa</span>
            </h1>
            <p className="text-slate-400 text-sm">{SCHOOL_NAME}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-4 mb-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Masukkan NISN</label>
              <input
                type="text"
                value={nisn}
                onChange={(e) => { setNisn(e.target.value.replace(/\D/g, '')); setNotFound(false); setResult(null); }}
                placeholder="10 digit NISN"
                maxLength={10}
                className="w-full bg-[#08090d]/60 border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white font-mono tracking-widest placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
              />
            </div>
            <button type="submit" disabled={loading || !nisn.trim()}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Mencari...' : 'Verifikasi'}
            </button>
          </form>

          {/* Result */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div key="found" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-300">SISWA TERVERIFIKASI</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-[#1a1f2e] border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {getFotoPublic(result.foto_url) ? (
                        <img src={getFotoPublic(result.foto_url)!} alt="Foto" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg uppercase">{result.nama}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-mono text-cyan-300">NISN: {result.nisn}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${result.jk === 'L' ? 'bg-blue-500/15 text-blue-400' : 'bg-pink-500/15 text-pink-400'}`}>{result.jk}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-emerald-500/10">
                    <div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase">Kelas</div>
                      <div className="text-sm font-bold text-white">{result.kelas || '-'}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase">Tgl Lahir</div>
                      <div className="text-sm font-bold text-white">{result.tanggal_lahir ? formatTanggal(result.tanggal_lahir) : '-'}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {notFound && (
              <motion.div key="not-found" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center"
              >
                <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-red-300">Siswa Tidak Ditemukan</p>
                <p className="text-xs text-red-200/50 mt-1">NISN "{nisn}" tidak terdaftar di database {SCHOOL_NAME}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 pt-6 border-t border-white/[0.04] flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span className="text-[11px] text-slate-600 font-medium">Verifikasi Publik • {SCHOOL_NAME}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
