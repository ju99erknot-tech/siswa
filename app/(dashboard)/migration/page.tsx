'use client'

import { useState } from 'react'
import {
  CheckCircle2, Loader2, Bot, X, Check, ArrowLeft, Database, Sparkles,
} from 'lucide-react'
import { useSiswa } from '@/hooks/useSiswa'
import { useAppStore } from '@/store/app.store'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Siswa } from '@/types'
import { PageShell, PageHeader, PageCard, PageCardHeader } from '@/components/shared/PageShell'

type Stage = 'staging' | 'saving' | 'done'

export default function MigrationHubPage() {
  const router = useRouter()
  const { importBulk } = useSiswa()
  const { stagingData, setStagingData } = useAppStore()
  const [stage, setStage] = useState<Stage>('staging')
  const [result, setResult] = useState<{ success: number; errors: any[] } | null>(null)

  if (stage === 'staging' && stagingData.length === 0) {
    return (
      <PageShell>
        <PageHeader
          icon={<Bot className="w-6 h-6 text-violet-400" />}
          title="AI Migration Hub"
          subtitle="Validasi & pembersihan data cerdas sebelum masuk Buku Induk"
        />
        <PageCard className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.20)' }}>
            <Bot className="w-10 h-10 text-violet-400" />
          </div>
          <h2 className="text-lg font-bold text-white/80 mb-2">AI Migration Hub Kosong</h2>
          <p className="text-sm text-white/35 max-w-md leading-relaxed mb-8">
            Belum ada file Excel yang dipilih untuk diimpor. Silakan menuju halaman Buku Induk untuk melakukan Import Massal.
          </p>
          <button onClick={() => router.push('/siswa')} className="btn-solid flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Buku Induk
          </button>
        </PageCard>
      </PageShell>
    )
  }

  const handleValidasiAI = () => {
    const belumValid = stagingData.filter((d: any) => d.status_validasi === 'Menunggu')
    if (belumValid.length === 0) { toast.info('Semua data sudah tervalidasi!'); return }
    if (!confirm(`Rapikan ${belumValid.length} data: Nama → KAPITAL, JK → L/P. Lanjutkan?`)) return
    const updated = stagingData.map((s: any) => {
      if (s.status_validasi !== 'Menunggu') return s
      const u = { ...s }
      if (u.nama) u.nama = String(u.nama).toUpperCase()
      if (u.jk) { const jk = String(u.jk).toUpperCase(); u.jk = jk === 'LAKI-LAKI' || jk === 'L' ? 'L' : 'P' }
      u.status_validasi = 'Tervalidasi'
      return u
    })
    setStagingData(updated)
    toast.success('AI berhasil merapikan data!')
  }

  const handleImport = async () => {
    setStage('saving')
    try {
      const res = await importBulk(stagingData as Partial<Siswa>[])
      setResult(res)
      setStage('done')
      setStagingData([])
    } catch {
      toast.error('Gagal mengimport data')
      setStage('staging')
    }
  }

  const handleBatal = () => {
    if (confirm('Yakin ingin membatalkan? Data staging akan dihapus.')) { setStagingData([]); router.push('/siswa') }
  }

  if (stage === 'saving') return (
    <PageShell>
      <PageCard className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', boxShadow: '0 0 30px rgba(139,92,246,0.20)' }}>
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-white/80 mb-2">Menyimpan ke Database...</h2>
        <p className="text-sm text-white/35">{stagingData.length} baris data sedang diproses</p>
      </PageCard>
    </PageShell>
  )

  if (stage === 'done' && result) return (
    <PageShell>
      <PageCard className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'rgba(52,211,153,0.15)', border: '3px solid rgba(52,211,153,0.30)', boxShadow: '0 0 40px rgba(52,211,153,0.20)' }}>
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-black text-white/90 mb-3">Migrasi Selesai!</h2>
        <p className="font-bold text-emerald-400 mb-1">✅ {result.success} siswa berhasil diimport</p>
        {result.errors.length > 0 && <p className="text-rose-400 text-sm">⚠️ {result.errors.length} baris gagal</p>}
        <button onClick={() => router.push('/siswa')} className="btn-secondary mt-8 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Buku Induk
        </button>
      </PageCard>
    </PageShell>
  )

  const tervalidasi = stagingData.filter((d: any) => d.status_validasi === 'Tervalidasi').length
  const menunggu = stagingData.length - tervalidasi

  return (
    <PageShell>
      <PageHeader
        icon={<Bot className="w-6 h-6 text-violet-400" />}
        title="AI Migration Hub"
        subtitle={`${stagingData.length} baris data staging siap divalidasi & diimport`}
        action={
          <div className="flex gap-2">
            <button onClick={handleBatal} className="btn-secondary btn-sm flex items-center gap-2">
              <X className="w-3.5 h-3.5" /> Batal
            </button>
            <button onClick={handleValidasiAI} className="btn-sm flex items-center gap-2 font-bold"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)', height: '32px', padding: '0 14px', borderRadius: '10px' }}>
              <Sparkles className="w-3.5 h-3.5" /> Validasi AI
            </button>
            <button onClick={handleImport} disabled={stagingData.length === 0} className="btn-solid btn-sm flex items-center gap-2">
              <Check className="w-3.5 h-3.5" /> Simpan Data
            </button>
          </div>
        }
      />

      {/* Status bar */}
      <div className="flex gap-3">
        {[
          { label: 'Total Staging', value: stagingData.length, color: '#a78bfa' },
          { label: 'Tervalidasi', value: tervalidasi, color: '#34d399' },
          { label: 'Menunggu', value: menunggu, color: '#fbbf24' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(13,18,33,0.80)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-lg font-black" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">{s.label}</span>
          </div>
        ))}
      </div>

      <PageCard noPad>
        <PageCardHeader
          title={`Staging Data — ${stagingData.length} Baris`}
          icon={<Database className="w-4 h-4" />}
        />
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scroll">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10" style={{ background: '#0d1221', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <tr>
                {['Status', 'Nama Lengkap', 'L/P', 'Tempat, Tgl Lahir', 'Alamat'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stagingData.map((item: any, i: number) => (
                <tr key={i} className="transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold"
                      style={item.status_validasi === 'Menunggu'
                        ? { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.20)' }
                        : { background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.20)' }
                      }>
                      {item.status_validasi}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-white/80">
                    {item.nama}<br />
                    <span className="text-[10px] text-white/30 font-mono">{item.nisn || '—'}</span>
                  </td>
                  <td className="px-5 py-3 text-white/45">{item.jk || '—'}</td>
                  <td className="px-5 py-3 text-white/40">{item.tempat_lahir || '—'}, {item.tanggal_lahir || '—'}</td>
                  <td className="px-5 py-3 text-white/35 max-w-[200px] truncate">{item.alamat || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageCard>
    </PageShell>
  )
}
