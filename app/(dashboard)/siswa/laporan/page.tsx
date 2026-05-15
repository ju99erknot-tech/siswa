'use client'

import { useState, useMemo, useRef } from 'react'
import { FileBarChart, Printer, Users, UserPlus, UserMinus, UserCheck } from 'lucide-react'
import { useAppStore } from '@/store/app.store'
import { PageShell, PageHeader, PageCard, PageCardHeader, StatCards, AuroraTable, ATRow, ATCell } from '@/components/shared/PageShell'
import { ChevronDown } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { LaporanLKSPrint } from '@/components/siswa/LaporanLKSPrint'

export default function LaporanLKSPage() {
  const { dataSiswa, dataMutasiMasuk, dataMutasiKeluar, dataKelas, pengaturan } = useAppStore()

  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const printRef = useRef<HTMLDivElement>(null)

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i)

  const reportData = useMemo(() => {
    const masukBulanIni = dataMutasiMasuk.filter(m => {
      const d = new Date(m.tanggal_surat || m.created_at)
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
    })

    const keluarBulanIni = dataMutasiKeluar.filter(m => {
      const d = new Date(m.tanggal_surat || m.created_at)
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
    })

    const rows = dataKelas.map(k => {
      const activeSiswa = dataSiswa.filter(s => s.kelas === k.nama_kelas && (s.status_siswa === 'Aktif' || !s.status_siswa))

      const Akhir_L = activeSiswa.filter(s => s.jk === 'L').length
      const Akhir_P = activeSiswa.filter(s => s.jk === 'P').length

      const Masuk_L = masukBulanIni.filter(m => m.kelas === k.nama_kelas && m.jk === 'L').length
      const Masuk_P = masukBulanIni.filter(m => m.kelas === k.nama_kelas && m.jk === 'P').length

      const Keluar_L = keluarBulanIni.filter(m => m.kelas === k.nama_kelas && m.jk === 'L').length
      const Keluar_P = keluarBulanIni.filter(m => m.kelas === k.nama_kelas && m.jk === 'P').length

      const Awal_L = Akhir_L - Masuk_L + Keluar_L
      const Awal_P = Akhir_P - Masuk_P + Keluar_P

      return {
        kelas: k.nama_kelas,
        Awal_L, Awal_P, Awal_J: Awal_L + Awal_P,
        Masuk_L, Masuk_P, Masuk_J: Masuk_L + Masuk_P,
        Keluar_L, Keluar_P, Keluar_J: Keluar_L + Keluar_P,
        Akhir_L, Akhir_P, Akhir_J: Akhir_L + Akhir_P,
      }
    })

    const total = rows.reduce((acc, r) => ({
      Awal_L: acc.Awal_L + r.Awal_L, Awal_P: acc.Awal_P + r.Awal_P, Awal_J: acc.Awal_J + r.Awal_J,
      Masuk_L: acc.Masuk_L + r.Masuk_L, Masuk_P: acc.Masuk_P + r.Masuk_P, Masuk_J: acc.Masuk_J + r.Masuk_J,
      Keluar_L: acc.Keluar_L + r.Keluar_L, Keluar_P: acc.Keluar_P + r.Keluar_P, Keluar_J: acc.Keluar_J + r.Keluar_J,
      Akhir_L: acc.Akhir_L + r.Akhir_L, Akhir_P: acc.Akhir_P + r.Akhir_P, Akhir_J: acc.Akhir_J + r.Akhir_J,
    }), {
      Awal_L: 0, Awal_P: 0, Awal_J: 0,
      Masuk_L: 0, Masuk_P: 0, Masuk_J: 0,
      Keluar_L: 0, Keluar_P: 0, Keluar_J: 0,
      Akhir_L: 0, Akhir_P: 0, Akhir_J: 0,
    })

    return { rows, total }
  }, [dataSiswa, dataMutasiMasuk, dataMutasiKeluar, dataKelas, selectedMonth, selectedYear])

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Laporan_LKS_${months[selectedMonth]}_${selectedYear}`,
  })

  return (
    <PageShell>
      <PageHeader
        icon={<FileBarChart className="w-6 h-6 text-fuchsia-400" />}
        title="Laporan Dapodik"
        subtitle="Rekapitulasi Keadaan Siswa Bulanan (LKS)"
        gradient="linear-gradient(135deg, #2e0533 0%, #170820 50%, #050d1e 100%)"
        glowColor="rgba(217, 70, 239, 0.2)"
        action={
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
                className="h-9 appearance-none rounded-xl px-3 pr-8 text-[12px] font-semibold text-white/70 outline-none cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                {months.map((m, i) => <option key={m} value={i} className="bg-slate-900 text-white">{m}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-white/40 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
                className="h-9 appearance-none rounded-xl px-3 pr-8 text-[12px] font-semibold text-white/70 outline-none cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                {years.map(y => <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-white/40 pointer-events-none" />
            </div>

            <button onClick={handlePrint} className="h-9 px-4 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-white text-[12px] font-bold flex items-center gap-2 transition-colors">
              <Printer size={14} /> Cetak LKS
            </button>
          </div>
        }
      />

      <StatCards items={[
        { label: 'Total Awal Bulan', value: reportData.total.Awal_J, color: '#94a3b8', icon: <Users className="w-5 h-5 text-slate-400" /> },
        { label: 'Mutasi Masuk', value: `+${reportData.total.Masuk_J}`, color: '#3b82f6', icon: <UserPlus className="w-5 h-5 text-blue-400" /> },
        { label: 'Mutasi Keluar', value: `-${reportData.total.Keluar_J}`, color: '#ef4444', icon: <UserMinus className="w-5 h-5 text-red-400" /> },
        { label: 'Total Akhir Bulan', value: reportData.total.Akhir_J, color: '#10b981', icon: <UserCheck className="w-5 h-5 text-emerald-400" /> },
      ]} />

      <div className="mt-6">
        <PageCard noPad>
          <PageCardHeader
            title="Rekapitulasi per Kelas"
            subtitle={`Data keadaan siswa bulan ${months[selectedMonth]} ${selectedYear}`}
            icon={<Users className="w-4 h-4" />}
          />
          <AuroraTable headers={['Kelas', 'Awal Bulan', 'Masuk', 'Keluar', 'Akhir Bulan']}>
            {reportData.rows.map((r) => (
              <ATRow key={r.kelas}>
                <ATCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 text-xs font-bold">{r.kelas.split(' ')[0]}</div>
                    <span className="font-bold text-white/80">{r.kelas}</span>
                  </div>
                </ATCell>
                <ATCell className="text-white/60 font-medium">{r.Awal_J} Siswa</ATCell>
                <ATCell className="text-blue-400 font-bold">{r.Masuk_J > 0 ? `+${r.Masuk_J}` : '-'}</ATCell>
                <ATCell className="text-red-400 font-bold">{r.Keluar_J > 0 ? `-${r.Keluar_J}` : '-'}</ATCell>
                <ATCell className="text-emerald-400 font-black">{r.Akhir_J} Siswa</ATCell>
              </ATRow>
            ))}
            <ATRow className="bg-white/5">
              <ATCell className="font-black text-white uppercase tracking-widest">Jumlah Total</ATCell>
              <ATCell className="font-bold text-white">{reportData.total.Awal_J}</ATCell>
              <ATCell className="font-bold text-blue-400">+{reportData.total.Masuk_J}</ATCell>
              <ATCell className="font-bold text-red-400">-{reportData.total.Keluar_J}</ATCell>
              <ATCell className="font-black text-emerald-400 text-base">{reportData.total.Akhir_J}</ATCell>
            </ATRow>
          </AuroraTable>
        </PageCard>
      </div>

      <div className="hidden">
        <LaporanLKSPrint
          ref={printRef}
          data={reportData}
          pengaturan={pengaturan}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
      </div>
    </PageShell>
  )
}
