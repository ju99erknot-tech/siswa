'use client'

import React, { forwardRef } from 'react'
import type { Pengaturan } from '@/types'
import { SCHOOL } from '@/lib/school.config'
import { useSchoolConfig } from '@/hooks/useSchoolConfig'

interface Props {
  data: {
    rows: any[]
    total: any
  }
  pengaturan: Pengaturan | null
  selectedMonth: number
  selectedYear: number
}

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export const LaporanLKSPrint = forwardRef<HTMLDivElement, Props>(({ data, pengaturan, selectedMonth, selectedYear }, ref) => {
  const config = useSchoolConfig()
  return (
    <div ref={ref} className="bg-white p-[15mm] text-black font-serif min-h-screen mx-auto" style={{ width: '210mm' }}>
      
      {/* HEADER KOP */}
      {pengaturan?.kop_surat_url ? (
        <div className="w-full mb-6">
          <img src={pengaturan.kop_surat_url} alt="Kop Surat" className="w-full h-auto object-contain" />
        </div>
      ) : (
        <div className="flex items-center gap-6 border-b-[3px] border-black pb-4 mb-6">
          {pengaturan?.logo_url ? (
            <img src={pengaturan.logo_url} alt="Logo" className="w-16 h-16 object-contain" />
          ) : (
            <div className="w-16 h-16 bg-slate-100 border border-black flex items-center justify-center text-[8px] text-center">
              LOGO
            </div>
          )}
          <div className="flex-1 text-center">
            <h1 className="text-[14px] font-bold uppercase leading-tight">Pemerintah Kabupaten Sukabumi</h1>
            <h1 className="text-[18px] font-black uppercase leading-tight">{SCHOOL.nama}</h1>
            <p className="text-[11px] mt-0.5">{config.alamatSekolah}</p>
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <h2 className="text-[14px] font-bold underline uppercase">LAPORAN KEADAAN SISWA (LKS)</h2>
        <p className="text-[11px] mt-0.5 font-bold uppercase">Bulan {months[selectedMonth]} Tahun {selectedYear}</p>
      </div>

      <table className="w-full border-collapse border border-black text-[11px] text-center mb-8">
        <thead>
          <tr className="bg-gray-100">
            <th rowSpan={2} className="border border-black p-1.5 font-bold w-[10%]">KELAS</th>
            <th colSpan={3} className="border border-black p-1.5 font-bold">AWAL BULAN</th>
            <th colSpan={3} className="border border-black p-1.5 font-bold">MUTASI MASUK</th>
            <th colSpan={3} className="border border-black p-1.5 font-bold">MUTASI KELUAR</th>
            <th colSpan={3} className="border border-black p-1.5 font-bold">AKHIR BULAN</th>
          </tr>
          <tr className="bg-gray-50">
            <th className="border border-black p-1 w-[5%]">L</th><th className="border border-black p-1 w-[5%]">P</th><th className="border border-black p-1 font-bold w-[5%]">JML</th>
            <th className="border border-black p-1 w-[5%]">L</th><th className="border border-black p-1 w-[5%]">P</th><th className="border border-black p-1 font-bold w-[5%]">JML</th>
            <th className="border border-black p-1 w-[5%]">L</th><th className="border border-black p-1 w-[5%]">P</th><th className="border border-black p-1 font-bold w-[5%]">JML</th>
            <th className="border border-black p-1 w-[5%]">L</th><th className="border border-black p-1 w-[5%]">P</th><th className="border border-black p-1 font-bold w-[5%]">JML</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r, i) => (
            <tr key={r.kelas} className="hover:bg-gray-50">
              <td className="border border-black p-1.5 font-bold">{r.kelas}</td>
              <td className="border border-black p-1.5">{r.Awal_L}</td><td className="border border-black p-1.5">{r.Awal_P}</td><td className="border border-black p-1.5 font-bold bg-gray-50">{r.Awal_J}</td>
              <td className="border border-black p-1.5">{r.Masuk_L || '-'}</td><td className="border border-black p-1.5">{r.Masuk_P || '-'}</td><td className="border border-black p-1.5 font-bold bg-gray-50">{r.Masuk_J || '-'}</td>
              <td className="border border-black p-1.5">{r.Keluar_L || '-'}</td><td className="border border-black p-1.5">{r.Keluar_P || '-'}</td><td className="border border-black p-1.5 font-bold bg-gray-50">{r.Keluar_J || '-'}</td>
              <td className="border border-black p-1.5">{r.Akhir_L}</td><td className="border border-black p-1.5">{r.Akhir_P}</td><td className="border border-black p-1.5 font-bold bg-gray-100">{r.Akhir_J}</td>
            </tr>
          ))}
          <tr className="bg-gray-200">
            <td className="border border-black p-2 font-black">JML</td>
            <td className="border border-black p-1.5 font-bold">{data.total.Awal_L}</td><td className="border border-black p-1.5 font-bold">{data.total.Awal_P}</td><td className="border border-black p-1.5 font-black">{data.total.Awal_J}</td>
            <td className="border border-black p-1.5 font-bold">{data.total.Masuk_L}</td><td className="border border-black p-1.5 font-bold">{data.total.Masuk_P}</td><td className="border border-black p-1.5 font-black">{data.total.Masuk_J}</td>
            <td className="border border-black p-1.5 font-bold">{data.total.Keluar_L}</td><td className="border border-black p-1.5 font-bold">{data.total.Keluar_P}</td><td className="border border-black p-1.5 font-black">{data.total.Keluar_J}</td>
            <td className="border border-black p-1.5 font-bold">{data.total.Akhir_L}</td><td className="border border-black p-1.5 font-bold">{data.total.Akhir_P}</td><td className="border border-black p-1.5 font-black">{data.total.Akhir_J}</td>
          </tr>
        </tbody>
      </table>

      {/* FOOTER TTD */}
      <div className="mt-12 flex justify-end">
        <div className="text-center min-w-[200px] text-[11px] relative">
          <p>{config.kotaSekolah}, {new Date(selectedYear, selectedMonth + 1, 0).getDate()} {months[selectedMonth]} {selectedYear}</p>
          <p className="mt-1 font-bold">Kepala Sekolah,</p>
          
          <div className="h-20" />
          
          {pengaturan?.ttd_url && (
            <img src={pengaturan.ttd_url} alt="TTD" className="absolute top-10 left-1/2 -translate-x-1/2 w-24 opacity-80 mix-blend-multiply" />
          )}
          {pengaturan?.stempel_url && (
            <img src={pengaturan.stempel_url} alt="Stempel" className="absolute top-6 right-16 w-20 opacity-70 mix-blend-multiply" />
          )}
          
          <p className="font-bold underline uppercase">{config.namaKepsek}</p>
          <p>NIP. {config.nipKepsek}</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: portrait; margin: 10mm; }
          .font-serif { font-family: "Times New Roman", Times, serif !important; }
        }
      `}</style>
    </div>
  )
})

LaporanLKSPrint.displayName = 'LaporanLKSPrint'
