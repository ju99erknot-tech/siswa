'use client'

import { useState } from 'react'
import { UserPlus, Plus, Loader2, Trash2, ArrowDownLeft } from 'lucide-react'
import { useMutasi } from '@/hooks/useMutasi'
import { formatTanggal } from '@/lib/utils'
import {
  PageShell, PageHeader, StatCards, PageCard,
  AuroraTable, ATRow, ATCell, SearchBar,
  AuroraModal, AuroraInput, AuroraSelect, EmptyState, usePagination, AuroraPagination } from '@/components/shared/PageShell'
import { SCHOOL } from '@/lib/school.config'

import { MigrationMap } from '@/components/mutasi/MigrationMap'
import { useAppStore } from '@/store/app.store'
import { useSchoolConfig } from '@/hooks/useSchoolConfig'

export default function MutasiMasukPage() {
  const config = useSchoolConfig();
  const { dataSiswa } = useAppStore();
  const KUMPULAN_KELAS = Array.from(new Set(dataSiswa.map(s => s.kelas))).filter((k): k is string => !!k).sort();
  const { dataMasuk, isLoadingMasuk, addMutasiMasuk, deleteMutasiMasuk } = useMutasi()
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table')
  const [search, setSearch] = useState('')
  const [filterKelas, setFilterKelas] = useState('all')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    nama: '', nisn: '', jk: 'L' as 'L' | 'P', kelas: '',
    sekolah_asal: '', no_surat: '',
    tanggal_surat: new Date().toISOString().split('T')[0],
    alasan: '', keterangan: '',
  })

  const filtered = dataMasuk.filter(m => {
    const ms = !search || m.nama.toLowerCase().includes(search.toLowerCase()) || m.nisn?.includes(search)
    const mk = filterKelas === 'all' || m.kelas === filterKelas
    return ms && mk
  })

  const mapData = filtered.map(m => ({
    id: m.id,
    nama: m.nama,
    asal_tujuan: m.sekolah_asal,
    tipe: 'masuk' as const
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nama || !form.sekolah_asal) return
    setSaving(true)
    const ok = await addMutasiMasuk(form)
    setSaving(false)
    if (ok) {
      setShowForm(false)
      setForm({ nama: '', nisn: '', jk: 'L', kelas: '', sekolah_asal: '', no_surat: '', tanggal_surat: new Date().toISOString().split('T')[0], alasan: '', keterangan: '' })
    }
  }

  const selectStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.75)', appearance: 'none' as const, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='rgba(255,255,255,0.35)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat' as const, backgroundPosition: 'right 12px center', paddingRight: '36px' }

  const pag = usePagination(filtered)

  return (
    <PageShell>
      <PageHeader
        icon={<UserPlus className="w-6 h-6 text-emerald-400" />}
        title="Mutasi Masuk"
        subtitle={`Data siswa yang berpindah masuk ke ${SCHOOL.nama}`}
        gradient="linear-gradient(135deg, #012418 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(16,185,129,0.28)"
        action={
          <div className="flex items-center gap-3">
             <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mr-2">
                <button 
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-white/30 hover:text-white/60'}`}
                >
                  Table
                </button>
                <button 
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-white/30 hover:text-white/60'}`}
                >
                  Map
                </button>
             </div>
            <button onClick={() => setShowForm(true)} className="btn-solid btn-sm flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Catat Mutasi Masuk
            </button>
          </div>
        }
      />
      <StatCards items={[
        { label: 'Total Masuk', value: filtered.length, color: '#34d399' },
        { label: 'Laki-laki', value: filtered.filter(m => m.jk === 'L').length, color: '#60a5fa' },
        { label: 'Perempuan', value: filtered.filter(m => m.jk === 'P').length, color: '#f472b6' },
        { label: 'Kelas Aktif', value: new Set(filtered.map(m => m.kelas)).size, color: '#a78bfa' },
      ]} />
      <SearchBar
        value={search} onChange={setSearch} placeholder="Cari nama atau NISN..."
        right={
          <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)}
            className="h-10 px-4 rounded-xl text-sm outline-none min-w-[140px]" style={selectStyle}>
            <option value="all">Semua Kelas</option>
            {KUMPULAN_KELAS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        }
      />

      {viewMode === 'map' ? (
        <MigrationMap data={mapData} />
      ) : (
        <PageCard noPad>
          <>
            <AuroraTable
            headers={['No', 'Nama Siswa', 'NISN', 'JK', 'Kelas', 'Sekolah Asal', 'Tgl Surat', 'No. Surat', 'Alasan', 'Aksi']}
            loading={isLoadingMasuk}
            empty={filtered.length === 0 ? (
              <tr><td colSpan={10}><EmptyState icon={<ArrowDownLeft className="w-7 h-7" />} title="Belum ada data mutasi masuk" variant="search" /></td></tr>
            ) : undefined}
          >
            {pag.paginated.map((m, i) => (
              <ATRow key={m.id}>
                <ATCell className="text-white/25 font-mono text-xs">{(pag.page - 1) * pag.perPage + i + 1}</ATCell>
                <ATCell className="font-semibold text-white/85">{m.nama}</ATCell>
                <ATCell mono className="text-cyan-400 text-xs">{m.nisn || '—'}</ATCell>
                <ATCell>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={m.jk === 'L' ? { background: 'rgba(96,165,250,0.12)', color: '#60a5fa' } : { background: 'rgba(244,114,182,0.12)', color: '#f472b6' }}>
                    {m.jk}
                  </span>
                </ATCell>
                <ATCell><span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: 'rgba(52,211,153,0.10)', color: '#34d399' }}>{m.kelas}</span></ATCell>
                <ATCell className="text-white/55 text-xs max-w-[160px] truncate">{m.sekolah_asal}</ATCell>
                <ATCell className="text-white/35 text-xs">{m.tanggal_surat ? formatTanggal(m.tanggal_surat) : '—'}</ATCell>
                <ATCell mono className="text-white/30 text-xs">{m.no_surat || '—'}</ATCell>
                <ATCell className="text-white/35 text-xs max-w-[120px] truncate">{m.alasan || '—'}</ATCell>
                <ATCell>
                  <button onClick={() => { if (confirm(`Hapus data "${m.nama}"?`)) deleteMutasiMasuk(m.id) }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-400/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </ATCell>
              </ATRow>
            ))}
          </AuroraTable>
            <AuroraPagination
              currentPage={pag.page}
              totalItems={pag.totalItems}
              perPage={pag.perPage}
              onPageChange={pag.setPage}
              onPerPageChange={pag.setPerPage}
            />
            </>
        </PageCard>
      )}
      <AuroraModal open={showForm} onClose={() => setShowForm(false)} title="Catat Mutasi Masuk" icon={<UserPlus className="w-5 h-5" />}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuroraInput label="Nama Siswa *" required value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} placeholder="Nama lengkap siswa" />
          <div className="grid grid-cols-3 gap-4">
            <AuroraInput label="NISN" value={form.nisn} onChange={e => setForm({ ...form, nisn: e.target.value })} style={{ fontFamily: 'JetBrains Mono, monospace' }} />
            <AuroraSelect label="JK" value={form.jk} onChange={e => setForm({ ...form, jk: e.target.value as 'L'|'P' })}>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </AuroraSelect>
            <AuroraSelect label="Kelas" value={form.kelas} onChange={e => setForm({ ...form, kelas: e.target.value })}>
              {KUMPULAN_KELAS.map(k => <option key={k} value={k}>{k}</option>)}
            </AuroraSelect>
          </div>
          <AuroraInput label="Sekolah Asal *" required value={form.sekolah_asal} onChange={e => setForm({ ...form, sekolah_asal: e.target.value })} placeholder={`SDN 01 ${config.kotaSekolah}`} />
          <div className="grid grid-cols-2 gap-4">
            <AuroraInput label="No. Surat" value={form.no_surat} onChange={e => setForm({ ...form, no_surat: e.target.value })} />
            <AuroraInput label="Tanggal Surat" type="date" value={form.tanggal_surat} onChange={e => setForm({ ...form, tanggal_surat: e.target.value })} />
          </div>
          <AuroraInput label="Alasan Mutasi" value={form.alasan} onChange={e => setForm({ ...form, alasan: e.target.value })} placeholder="Pindah domisili, dll." />
          <AuroraInput label="Keterangan" value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} />
          <button type="submit" disabled={saving || !form.nama || !form.sekolah_asal} className="btn-solid btn-block h-11 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Simpan Mutasi Masuk'}
          </button>
        </form>
      </AuroraModal>
    </PageShell>
  )
}
