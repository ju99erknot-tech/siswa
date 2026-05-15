'use client'

import React, { forwardRef } from 'react'
import type { Siswa, Pengaturan } from '@/types'
import { formatTanggal } from '@/lib/utils'
import { useSchoolConfig } from '@/hooks/useSchoolConfig'

interface Props {
  data: Partial<Siswa>[]
  pengaturan: Pengaturan | null
}

export const DaftarSiswaPrint = forwardRef<HTMLDivElement, Props>(({ data, pengaturan }, ref) => {
  const config = useSchoolConfig()
  return (
    <div ref={ref} className="bg-white p-[15mm] text-black font-serif min-h-screen" style={{ width: '210mm' }}>
      {/* HEADER KOP */}
      {pengaturan?.kop_surat_url ? (
        <div className="w-full mb-6">
          <img src={pengaturan.kop_surat_url} alt="Kop Surat" className="w-full h-auto object-contain" />
        </div>
      ) : (
        <div className="flex items-center gap-6 border-b-2 border-black pb-4 mb-6">
          {pengaturan?.logo_url ? (
            <img src={pengaturan.logo_url} alt="Logo" className="w-16 h-16 object-contain" />
          ) : (
            <div className="w-16 h-16 bg-slate-100 border border-black flex items-center justify-center text-[8px] text-center">
              LOGO
            </div>
          )}
          <div className="flex-1 text-center">
            <h1 className="text-[14px] font-bold uppercase leading-tight">Pemerintah Kabupaten Sukabumi</h1>
            <h1 className="text-[18px] font-black uppercase leading-tight">{config.namaSekolah}</h1>
            <p className="text-[11px] mt-0.5">{config.alamatSekolah}</p>
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <h2 className="text-[14px] font-bold underline uppercase">DAFTAR BUKU INDUK PESERTA DIDIK</h2>
        <p className="text-[10px] mt-0.5">Tahun Ajaran: {pengaturan?.tahun_ajaran || '2024/2025'}</p>
      </div>

      <table className="w-full border-collapse border border-black text-[11px]">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black px-2 py-2 text-center w-[30px]">NO</th>
            <th className="border border-black px-3 py-2 text-left">NAMA LENGKAP</th>
            <th className="border border-black px-2 py-2 text-center w-[100px]">NISN</th>
            <th className="border border-black px-2 py-2 text-center w-[80px]">NIS</th>
            <th className="border border-black px-2 py-2 text-center w-[40px]">L/P</th>
            <th className="border border-black px-3 py-2 text-left w-[180px]">TEMPAT, TGL LAHIR</th>
            <th className="border border-black px-2 py-2 text-center w-[60px]">KELAS</th>
          </tr>
        </thead>
        <tbody>
          {data.map((s, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="border border-black px-2 py-1.5 text-center">{i + 1}</td>
              <td className="border border-black px-3 py-1.5 font-bold">{s.nama || '-'}</td>
              <td className="border border-black px-2 py-1.5 text-center font-mono">{s.nisn || '-'}</td>
              <td className="border border-black px-2 py-1.5 text-center font-mono">{s.nis || '-'}</td>
              <td className="border border-black px-2 py-1.5 text-center">{s.jk}</td>
              <td className="border border-black px-3 py-1.5">
                {s.tempat_lahir || '-'}, {s.tanggal_lahir ? formatTanggal(s.tanggal_lahir) : '-'}
              </td>
              <td className="border border-black px-2 py-1.5 text-center">{s.kelas || '-'}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={7} className="border border-black px-4 py-8 text-center italic text-gray-400">
                Tidak ada data siswa untuk ditampilkan
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* FOOTER TTD */}
      <div className="mt-12 flex justify-end">
        <div className="text-center min-w-[200px] text-[11px]">
          <p>{config.kotaSekolah}, .................................. {new Date().getFullYear()}</p>
          <p className="mt-1">Kepala Sekolah,</p>
          <div className="h-16" />
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

DaftarSiswaPrint.displayName = 'DaftarSiswaPrint'
