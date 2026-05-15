'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Printer, X, FileText, Check, Loader2, Calendar,
  Hash, Tag, Info, UserCheck, GraduationCap, Award, LogOut
} from 'lucide-react'
import { useAppStore } from '@/store/app.store'
import { toast } from 'sonner'
import type { Siswa } from '@/types'
import { useSchoolConfig } from '@/hooks/useSchoolConfig'

interface BulkPrintModalProps {
  selectedSiswa: Siswa[]
  onClose: () => void
}

type SuratType = 'aktif' | 'kelakuan_baik' | 'lulus' | 'mutasi'

export function BulkPrintModal({ selectedSiswa, onClose }: BulkPrintModalProps) {
  const { pengaturan } = useAppStore()
  const config = useSchoolConfig()
  const [isGenerating, setIsGenerating] = useState(false)

  // Settings State
  const [jenisSurat, setJenisSurat] = useState<SuratType>('aktif')
  const [nomorSuratFormat, setNomorSuratFormat] = useState('421.2 / [NO] / SD-02 / [MO] / [YR]')
  const [keperluan, setKeperluan] = useState('Melanjutkan sekolah / Keperluan administrasi')
  const [tanggalCetak, setTanggalCetak] = useState(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }))
  const [startNo, setStartNo] = useState(1)
  const [showTTD, setShowTTD] = useState(true)
  const [showStempel, setShowStempel] = useState(true)

  const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  const currentRomanMonth = ROMAN_MONTHS[new Date().getMonth()]
  const currentYear = new Date().getFullYear().toString()

  const formattedNomor = (index: number) => {
    const no = String(startNo + index).padStart(3, '0')
    return nomorSuratFormat
      .replace('[NO]', no)
      .replace('[MO]', currentRomanMonth)
      .replace('[YR]', currentYear)
  }

  const handlePrint = async () => {
    setIsGenerating(true)
    try {
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error('Gagal membuka jendela cetak. Pastikan popup tidak diblokir.')
        return
      }

      // Generate HTML for all pages
      let allPagesHtml = ''

      selectedSiswa.forEach((siswa, index) => {
        const noSurat = formattedNomor(index)
        const ttl = `${siswa.tempat_lahir || '-'}, ${siswa.tanggal_lahir || '-'}`
        const parentName = siswa.nama_ayah || siswa.nama_ibu || siswa.nama_wali || '-'
        const qrData = `${window.location.origin}/verify?v=${siswa.nisn}`

        let judul = ''
        let bodyContent = ''

        if (jenisSurat === 'aktif') {
          judul = 'SURAT KETERANGAN AKTIF BELAJAR'
          bodyContent = `
            <p>Yang bertanda tangan di bawah ini Kepala ${config.namaSekolah}, menerangkan dengan sebenarnya bahwa:</p>
            <table style="margin-left: 20px; width: 100%;">
                <tr><td width="30%">Nama Lengkap</td><td width="2%">:</td><td style="font-weight:bold; text-transform:uppercase;">${siswa.nama}</td></tr>
                <tr><td>Tempat, Tanggal Lahir</td><td>:</td><td>${ttl}</td></tr>
                <tr><td>NIS / NISN</td><td>:</td><td>${siswa.nis || '-'} / <span style="font-weight:bold;">${siswa.nisn}</span></td></tr>
                <tr><td>Kelas</td><td>:</td><td style="font-weight:bold;">${siswa.kelas || '-'}</td></tr>
                <tr><td>Nama Orang Tua/Wali</td><td>:</td><td>${parentName}</td></tr>
                <tr><td>Alamat</td><td>:</td><td>${siswa.alamat || '-'}</td></tr>
            </table>
            <p>Adalah benar siswa tersebut berstatus <b>AKTIF</b> di ${config.namaSekolah} pada Tahun Pelajaran <b>${pengaturan?.tahun_ajaran || '2025/2026'}</b>.</p>
            <p>Surat keterangan ini diberikan untuk keperluan: <i>${keperluan}</i>.</p>
            <p>Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>
          `
        } else if (jenisSurat === 'kelakuan_baik') {
          judul = 'SURAT KETERANGAN KELAKUAN BAIK'
          bodyContent = `
            <p>Yang bertanda tangan di bawah ini Kepala ${config.namaSekolah}, menerangkan dengan sebenarnya bahwa:</p>
            <table style="margin-left: 20px; width: 100%;">
                <tr><td width="30%">Nama Lengkap</td><td width="2%">:</td><td style="font-weight:bold; text-transform:uppercase;">${siswa.nama}</td></tr>
                <tr><td>Tempat, Tanggal Lahir</td><td>:</td><td>${ttl}</td></tr>
                <tr><td>NIS / NISN</td><td>:</td><td>${siswa.nis || '-'} / <span style="font-weight:bold;">${siswa.nisn}</span></td></tr>
                <tr><td>Kelas</td><td>:</td><td>${siswa.kelas || '-'}</td></tr>
                <tr><td>Alamat</td><td>:</td><td>${siswa.alamat || '-'}</td></tr>
            </table>
            <p>Berdasarkan pengamatan dan catatan di sekolah kami, siswa tersebut di atas <b>berkelakuan baik, rajin, dan belum pernah terlibat dalam tindakan pelanggaran tata tertib sekolah</b>, kenakalan remaja, maupun penggunaan obat-obatan terlarang.</p>
            <p>Surat keterangan ini diberikan untuk keperluan: <i>${keperluan}</i>.</p>
            <p>Demikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.</p>
          `
        } else if (jenisSurat === 'lulus') {
          judul = 'SURAT KETERANGAN LULUS'
          bodyContent = `
            <p>Yang bertanda tangan di bawah ini Kepala ${config.namaSekolah}, menerangkan dengan sebenarnya bahwa:</p>
            <table style="margin-left: 20px; width: 100%;">
                <tr><td width="35%">Nama Lengkap</td><td width="2%">:</td><td style="font-weight:bold; text-transform:uppercase;">${siswa.nama}</td></tr>
                <tr><td>Tempat, Tanggal Lahir</td><td>:</td><td>${ttl}</td></tr>
                <tr><td>NIS / NISN</td><td>:</td><td>${siswa.nis || '-'} / <span style="font-weight:bold;">${siswa.nisn}</span></td></tr>
                <tr><td>Nomor Peserta Ujian</td><td>:</td><td><span style="font-weight:bold;">${siswa.no_peserta_un || '-'}</span></td></tr>
                <tr><td>Nama Orang Tua/Wali</td><td>:</td><td>${parentName}</td></tr>
            </table>
            <p>Berdasarkan hasil Asesmen Sumatif Akhir Jenjang dan Rapat Dewan Guru, siswa tersebut dinyatakan:</p>
            <div style="text-align:center; font-size: 16pt; font-weight:bold; margin: 15px 0; border: 2px solid #000; padding: 10px; letter-spacing: 2px;">
                L U L U S
            </div>
            <p>Dari ${config.namaSekolah} Tahun Pelajaran <b>${pengaturan?.tahun_ajaran || '2025/2026'}</b>.</p>
            <p>Surat Keterangan Lulus (SKL) ini bersifat sementara dan dapat digunakan untuk keperluan pendaftaran ke jenjang pendidikan selanjutnya (SMP/MTs sederajat) sampai Ijazah asli diterbitkan.</p>
          `
        } else if (jenisSurat === 'mutasi') {
          judul = 'SURAT KETERANGAN PINDAH SEKOLAH'
          bodyContent = `
            <p>Yang bertanda tangan di bawah ini Kepala ${config.namaSekolah}, menerangkan dengan sebenarnya bahwa:</p>
            <table style="margin-left: 20px; width: 100%; margin-bottom: 15px;">
                <tr><td width="30%">Nama Lengkap</td><td width="2%">:</td><td style="font-weight:bold; text-transform:uppercase;">${siswa.nama}</td></tr>
                <tr><td>Tempat, Tanggal Lahir</td><td>:</td><td>${ttl}</td></tr>
                <tr><td>NIS / NISN</td><td>:</td><td>${siswa.nis || '-'} / <span style="font-weight:bold;">${siswa.nisn}</span></td></tr>
                <tr><td>Kelas / Tingkat</td><td>:</td><td style="font-weight:bold;">${siswa.kelas || '-'}</td></tr>
                <tr><td>Nama Orang Tua/Wali</td><td>:</td><td>${parentName}</td></tr>
            </table>
            <p>Telah mengajukan permohonan <b>Pindah Sekolah / Mutasi Keluar</b> dari ${config.namaSekolah} atas permintaan Orang Tua / Wali murid.</p>
            <p>Alasan Kepindahan &nbsp;&nbsp;&nbsp;&nbsp;: <i>${keperluan || 'Ikut orang tua pindah domisili'}</i></p>
            <p>Bersama surat ini kami sertakan pula Buku Rapor asli yang bersangkutan. Kami berharap siswa tersebut dapat diterima dan melanjutkan pendidikan di sekolah yang baru.</p>
            <p>Demikian surat keterangan pindah sekolah ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>
          `
        }

        allPagesHtml += `
          <div class="surat-page">
            <div class="kop-surat">
              <img src="${pengaturan?.kop_surat_url || 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgHJHdzvsrvzHVMFsAmI_Ra_4vlYn39plogGMmNIUO7MV71T8zT9YWUFQyO5UD6oeSQ7jew1exTAXcI24JwK3eBiokcmNppHqGjvq70RTfjeYdZAhIahHq0D8m2Jrixl_8bb6BaFGhm0xpov4cojZ_ydeyOtE1xM7wrxn7FSMy0EP5KTuyqWVscaIkCyN3T/s955/KOP%20Baru.png'}" alt="KOP" />
            </div>
            
            <div class="judul-box">
              <h2>${judul}</h2>
              <p>Nomor: ${noSurat}</p>
            </div>
            
            <div class="isi-surat">
              ${bodyContent}
            </div>
            
            <div class="footer-box">
              <div class="qr-box" id="qr-${index}">
                <!-- QR Placeholder -->
              </div>
              <div class="ttd-box" style="position: relative;">
                <p>${config.kotaSekolah}, ${tanggalCetak}</p>
                <p>Kepala Sekolah,</p>
                <div style="height: 70px; position: relative; display: flex; align-items: center; justify-content: center; margin-bottom: -5px;">
                  ${showTTD && pengaturan?.ttd_url ? `<img src="${pengaturan.ttd_url}" style="position: absolute; width: 140px; z-index: 1; mix-blend-mode: multiply;" />` : ''}
                  ${showStempel && pengaturan?.stempel_url ? `<img src="${pengaturan.stempel_url}" style="position: absolute; width: 130px; z-index: 2; left: -20px; opacity: 0.85; mix-blend-mode: multiply;" />` : ''}
                </div>
                <div class="ttd-name" style="position: relative; z-index: 3;">${pengaturan?.nama_kepsek || 'Nama Kepala Sekolah'}</div>
                <div class="ttd-nip" style="position: relative; z-index: 3;">NIP. ${pengaturan?.nip_kepsek || '198000000000000000'}</div>
              </div>
            </div>
          </div>
        `
      })

      printWindow.document.write(`
        <html>
        <head>
          <title>Bulk Print - ${jenisSurat.toUpperCase()}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Times New Roman', serif; background: #eee; margin:0; padding: 20px; font-size:12pt; }
            .no-print { position: fixed; top: 20px; right: 20px; z-index: 1000; display: flex; gap: 10px; }
            .btn { background: #10b981; color: white; padding: 10px 20px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
            .surat-page { 
              page-break-after: always; 
              background: white; 
              width: 210mm; 
              min-height: 297mm; 
              margin: 0 auto 20px auto; 
              padding: 15mm 20mm; 
              box-sizing: border-box; 
              box-shadow: 0 5px 15px rgba(0,0,0,0.1); 
              position: relative; 
            }
            .kop-surat { text-align: center; margin-bottom: 20px; margin-left: -10mm; margin-right: -10mm; }
            .kop-surat img { width: 100%; max-height: 150px; object-fit: contain; }
            .judul-box { text-align: center; margin: 20px 0 30px 0; }
            .judul-box h2 { margin: 0; font-size: 14pt; text-decoration: underline; }
            .judul-box p { margin: 5px 0 0 0; font-size: 11pt; }
            .isi-surat { text-align: justify; line-height: 1.6; }
            .isi-surat table td { padding: 4px 0; vertical-align: top; }
            .footer-box { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
            .ttd-box { width: 250px; text-align: center; }
            .ttd-name { font-weight: bold; text-decoration: underline; margin-top: 10px; text-transform: uppercase; }
            .qr-box { text-align: center; padding: 10px; border: 1px solid #eee; border-radius: 8px; }
            @media print { 
              body { background: white; padding: 0; }
              .surat-page { margin: 0; box-shadow: none; border: none; }
              .no-print { display: none !important; }
            }
          </style>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
        </head>
        <body>
          <div class="no-print">
            <button class="btn" onclick="window.print()">🖨️ Cetak Sekarang</button>
            <button class="btn" style="background: #64748b" onclick="window.close()">Batal</button>
          </div>
          ${allPagesHtml}
          <script>
            window.onload = function() {
              ${selectedSiswa.map((siswa, idx) => `
                new QRCode(document.getElementById("qr-${idx}"), {
                  text: "${window.location.origin}/verify?v=${siswa.nisn}",
                  width: 80,
                  height: 80
                });
              `).join('\n')}
              setTimeout(() => { 
                // window.print(); 
              }, 1000);
            }
          </script>
        </body>
        </html>
      `)
      printWindow.document.close()
      toast.success(`${selectedSiswa.length} surat siap dicetak`)
      onClose()
    } catch (error) {
      console.error(error)
      toast.error('Gagal memproses cetakan')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center">
                <Printer className="w-7 h-7 text-fuchsia-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Bulk Print Center</h2>
                <p className="text-sm text-white/40">{selectedSiswa.length} Siswa Terpilih</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <X className="w-5 h-5 text-white/40" />
            </button>
          </div>

          <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Tipe Surat */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'aktif', label: 'Ket. Aktif', icon: UserCheck, color: 'emerald' },
                { id: 'kelakuan_baik', label: 'Kelakuan Baik', icon: Award, color: 'blue' },
                { id: 'mutasi', label: 'Mutasi Keluar', icon: LogOut, color: 'rose' },
                { id: 'lulus', label: 'Kelulusan', icon: GraduationCap, color: 'fuchsia' },
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setJenisSurat(type.id as SuratType)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 group ${jenisSurat === type.id
                    ? `bg-${type.color}-500/10 border-${type.color}-500/40 text-${type.color}-400`
                    : 'bg-white/5 border-white/5 text-white/30 hover:border-white/20'
                    }`}
                >
                  <type.icon className={`w-6 h-6 ${jenisSurat === type.id ? `text-${type.color}-400` : 'text-white/20 group-hover:text-white/40'}`} />
                  <span className="text-[11px] font-black uppercase tracking-widest">{type.label}</span>
                </button>
              ))}
            </div>

            {/* Config Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Hash className="w-3 h-3" /> Format No. Surat
                  </label>
                  <input
                    value={nomorSuratFormat} onChange={e => setNomorSuratFormat(e.target.value)}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-bold text-white focus:border-fuchsia-500/50 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Tag className="w-3 h-3" /> No. Awal
                  </label>
                  <input
                    type="number" value={startNo} onChange={e => setStartNo(parseInt(e.target.value) || 1)}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-bold text-white focus:border-fuchsia-500/50 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Info className="w-3 h-3" /> Keperluan
                </label>
                <input
                  value={keperluan} onChange={e => setKeperluan(e.target.value)}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-bold text-white focus:border-fuchsia-500/50 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Tanggal Cetak
                </label>
                <input
                  value={tanggalCetak} onChange={e => setTanggalCetak(e.target.value)}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-bold text-white focus:border-fuchsia-500/50 outline-none transition-all"
                />
              </div>

              {/* Toggles TTD & Stempel */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl cursor-pointer hover:bg-white/5 transition-all group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" checked={showTTD} onChange={(e) => setShowTTD(e.target.checked)} className="peer sr-only" />
                    <div className="w-10 h-6 bg-white/10 rounded-full peer-checked:bg-fuchsia-500 transition-colors border border-white/5" />
                    <div className="absolute left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white/90 group-hover:text-fuchsia-400 transition-colors">Tanda Tangan</span>
                    <span className="text-[9px] text-white/40">Otomatis tempel</span>
                  </div>
                </label>
                <label className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl cursor-pointer hover:bg-white/5 transition-all group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" checked={showStempel} onChange={(e) => setShowStempel(e.target.checked)} className="peer sr-only" />
                    <div className="w-10 h-6 bg-white/10 rounded-full peer-checked:bg-fuchsia-500 transition-colors border border-white/5" />
                    <div className="absolute left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white/90 group-hover:text-fuchsia-400 transition-colors">Stempel Sekolah</span>
                    <span className="text-[9px] text-white/40">Cap warna biru</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Helper text */}
            <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
              <p className="text-[11px] text-white/30 italic">
                Tips: Gunakan [NO] untuk nomor urut, [MO] untuk bulan romawi, dan [YR] untuk tahun berjalan.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-8 bg-white/[0.02] border-t border-white/5 flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 font-bold transition-all"
            >
              Batal
            </button>
            <button
              onClick={handlePrint}
              disabled={isGenerating}
              className="flex-[2] h-12 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-black flex items-center justify-center gap-3 shadow-lg shadow-fuchsia-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
              Generate {selectedSiswa.length} Surat
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
