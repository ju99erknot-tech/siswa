'use client'

import { useState } from 'react'
import { UserMinus, Plus, Loader2, Trash2, ArrowUpRight } from 'lucide-react'
import { useMutasi } from '@/hooks/useMutasi'
import { formatTanggal } from '@/lib/utils'
import {
  PageShell, PageHeader, StatCards, PageCard,
  AuroraTable, ATRow, ATCell, SearchBar,
  AuroraModal, AuroraInput, AuroraSelect, EmptyState, usePagination, AuroraPagination } from '@/components/shared/PageShell'
import { SiswaPicker } from '@/components/shared/SiswaPicker'
import type { Siswa } from '@/types'
import { SCHOOL } from '@/lib/school.config'
import { useAppStore } from '@/store/app.store'

export default function MutasiKeluarPage() {
  const { dataSiswa } = useAppStore();
  const KUMPULAN_KELAS = Array.from(new Set(dataSiswa.map(s => s.kelas))).filter((k): k is string => !!k).sort();
  const { dataKeluar, isLoadingKeluar, addMutasiKeluar, deleteMutasiKeluar } = useMutasi()
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterKelas, setFilterKelas] = useState('all')
  const [saving, setSaving] = useState(false)
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null)

  const [form, setForm] = useState({
    nama: '', nisn: '', jk: 'L' as 'L' | 'P', kelas: '',
    sekolah_tujuan: '', no_surat: '',
    tanggal_surat: new Date().toISOString().split('T')[0],
    alasan: '', keterangan: '',
  })

  const filtered = dataKeluar.filter(m => {
    const ms = !search || m.nama.toLowerCase().includes(search.toLowerCase()) || m.nisn?.includes(search)
    const mk = filterKelas === 'all' || m.kelas === filterKelas
    return ms && mk
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSiswa || !form.sekolah_tujuan) return
    setSaving(true)
    const ok = await addMutasiKeluar({ ...form, nama: selectedSiswa.nama, nisn: selectedSiswa.nisn || '', jk: (selectedSiswa.jk as 'L'|'P') || 'L', kelas: selectedSiswa.kelas || '' })
    setSaving(false)
    if (ok) {
      setShowForm(false)
      setSelectedSiswa(null)
      setForm({ nama: '', nisn: '', jk: 'L', kelas: '', sekolah_tujuan: '', no_surat: '', tanggal_surat: new Date().toISOString().split('T')[0], alasan: '', keterangan: '' })
    }
  }

  const selectStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.75)', appearance: 'none' as const, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='rgba(255,255,255,0.35)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat' as const, backgroundPosition: 'right 12px center', paddingRight: '36px' }

  const pag = usePagination(filtered)

  return (
    <PageShell>
      <PageHeader
        icon={<UserMinus className="w-6 h-6 text-rose-400" />}
        title="Mutasi Keluar"
        subtitle={`Data siswa yang berpindah keluar dari ${SCHOOL.nama}`}
        gradient="linear-gradient(135deg, #1a0008 0%, #0c0820 50%, #050d1e 100%)"
        glowColor="rgba(244,63,94,0.25)"
        action={
          <button onClick={() => setShowForm(true)} className="btn-solid btn-sm flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" /> Catat Mutasi Keluar
          </button>
        }
      />
      <StatCards items={[
        { label: 'Total Keluar', value: filtered.length, color: '#fb7185' },
        { label: 'Laki-laki', value: filtered.filter(m => m.jk === 'L').length, color: '#60a5fa' },
        { label: 'Perempuan', value: filtered.filter(m => m.jk === 'P').length, color: '#f472b6' },
        { label: 'Kelas Terdampak', value: new Set(filtered.map(m => m.kelas)).size, color: '#fbbf24' },
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
      <PageCard noPad>
        <>
            <AuroraTable
          headers={['No', 'Nama Siswa', 'NISN', 'JK', 'Kelas', 'Sekolah Tujuan', 'Tgl Surat', 'No. Surat', 'Alasan', 'Aksi']}
          loading={isLoadingKeluar}
          empty={filtered.length === 0 ? (
            <tr><td colSpan={10}><EmptyState icon={<ArrowUpRight className="w-7 h-7" />} title="Belum ada data mutasi keluar" variant="search" /></td></tr>
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
              <ATCell><span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: 'rgba(244,63,94,0.10)', color: '#fb7185' }}>{m.kelas}</span></ATCell>
              <ATCell className="text-white/55 text-xs max-w-[160px] truncate">{m.sekolah_tujuan}</ATCell>
              <ATCell className="text-white/35 text-xs">{m.tanggal_surat ? formatTanggal(m.tanggal_surat) : '—'}</ATCell>
              <ATCell mono className="text-white/30 text-xs">{m.no_surat || '—'}</ATCell>
              <ATCell className="text-white/35 text-xs max-w-[120px] truncate">{m.alasan || '—'}</ATCell>
              <ATCell>
                <button onClick={() => { if (confirm(`Hapus data "${m.nama}"?`)) deleteMutasiKeluar(m.id) }}
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
      <AuroraModal open={showForm} onClose={() => setShowForm(false)} title="Catat Mutasi Keluar" icon={<UserMinus className="w-5 h-5" />}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <SiswaPicker value={selectedSiswa?.id || ''} onChange={s => setSelectedSiswa(s)} label="Siswa yang Keluar" required />
          <AuroraInput label="Sekolah Tujuan *" required value={form.sekolah_tujuan} onChange={e => setForm({ ...form, sekolah_tujuan: e.target.value })} placeholder="SDN 01 Kota Sukabumi" />
          <div className="grid grid-cols-2 gap-4">
            <AuroraInput label="No. Surat" value={form.no_surat} onChange={e => setForm({ ...form, no_surat: e.target.value })} />
            <AuroraInput label="Tanggal Surat" type="date" value={form.tanggal_surat} onChange={e => setForm({ ...form, tanggal_surat: e.target.value })} />
          </div>
          <AuroraInput label="Alasan Mutasi" value={form.alasan} onChange={e => setForm({ ...form, alasan: e.target.value })} placeholder="Pindah domisili, dll." />
          <AuroraInput label="Keterangan" value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} />
          <button type="submit" disabled={saving || !selectedSiswa || !form.sekolah_tujuan} className="btn-solid btn-block h-11 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Simpan Mutasi Keluar'}
          </button>
        </form>
      </AuroraModal>
    </PageShell>
  )
}
