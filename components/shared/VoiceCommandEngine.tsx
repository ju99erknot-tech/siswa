'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app.store'
import { uiSound } from '@/lib/audio'

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function VoiceCommandEngine() {
  const router = useRouter()
  const { 
    voiceActive, setVoiceActive, 
    toggleZenMode, toggleSearch, 
    setFilterSiswa 
  } = useAppStore()
  
  const recognitionRef = useRef<any>(null)
  const isListening = useRef(false)

  const handleCommand = useCallback((command: string) => {
    const cmd = command.toLowerCase().trim()

    
    return executeCommand(cmd)
  }, [router, toggleZenMode, toggleSearch, setFilterSiswa])

  const executeCommand = (cmd: string) => {
    toast.info(`Dengar: "${cmd}"`)
    
    const lowerCmd = cmd.toLowerCase()
    
    // 1. Navigation Commands - Urutkan dari yang paling spesifik
    // Kesiswaan
    if (lowerCmd.includes('facegrid') || lowerCmd.includes('audit foto') || lowerCmd.includes('galeri wajah')) {
      uiSound.playPop(); router.push('/siswa/facegrid'); toast.info('Membuka FaceGrid Audit...'); return true
    }
    if (lowerCmd.includes('migration') || lowerCmd.includes('ai migration')) {
      uiSound.playPop(); router.push('/migration'); toast.info('Membuka AI Migration...'); return true
    }
    if (lowerCmd.includes('dapodik') || lowerCmd.includes('sync') || lowerCmd.includes('sinkron')) {
      uiSound.playPop(); router.push('/dapodik'); toast.info('Membuka Dapodik Sync...'); return true
    }
    if (lowerCmd.includes('zonasi') || lowerCmd.includes('peta zonasi')) {
      uiSound.playPop(); router.push('/peta'); toast.info('Membuka Zonasi Siswa...'); return true
    }
    if (lowerCmd.includes('mutasi masuk') || lowerCmd.includes('masuk')) {
      uiSound.playPop(); router.push('/mutasi/masuk'); toast.info('Membuka Mutasi Masuk...'); return true
    }
    if (lowerCmd.includes('mutasi keluar') || lowerCmd.includes('keluar')) {
      uiSound.playPop(); router.push('/mutasi/keluar'); toast.info('Membuka Mutasi Keluar...'); return true
    }
    if (lowerCmd.includes('laporan lks') || lowerCmd.includes('laporan')) {
      uiSound.playPop(); router.push('/siswa/laporan'); toast.info('Membuka Laporan LKS...'); return true
    }
    if (lowerCmd.includes('buku induk') || lowerCmd.includes('data siswa') || lowerCmd.includes('siswa')) {
      uiSound.playPop(); router.push('/siswa'); toast.info('Membuka Buku Induk...'); return true
    }
    
    // Guru & GTK
    if (lowerCmd.includes('vault') || lowerCmd.includes('akun') || lowerCmd.includes('password') || lowerCmd.includes('sandi') || lowerCmd.includes('brankas')) {
      uiSound.playPop(); router.push('/gtk?tab=vault'); toast.info('Membuka Vault Akun...'); return true
    }
    if (lowerCmd.includes('tendik') || lowerCmd.includes('tenaga kependidikan')) {
      uiSound.playPop(); router.push('/gtk?tab=tendik'); toast.info('Membuka Tenaga Kependidikan...'); return true
    }
    if (lowerCmd.includes('guru') || lowerCmd.includes('gtk') || lowerCmd.includes('pendidik')) {
      uiSound.playPop(); router.push('/gtk?tab=pendidik'); toast.info('Membuka Data Guru...'); return true
    }
    
    // Master Kelas
    if (lowerCmd.includes('denah') || lowerCmd.includes('tempat duduk')) {
      uiSound.playPop(); router.push('/denah'); toast.info('Membuka Denah Tempat Duduk...'); return true
    }
    if (lowerCmd.includes('master kelas') || lowerCmd.includes('kelas')) {
      uiSound.playPop(); router.push('/master-kelas'); toast.info('Membuka Master Kelas...'); return true
    }
    
    // Layanan Siswa
    if (lowerCmd.includes('rekap absen')) {
      uiSound.playPop(); router.push('/rekap-absensi'); toast.info('Membuka Rekap Absen...'); return true
    }
    if (lowerCmd.includes('surat izin') || lowerCmd.includes('surat')) {
      uiSound.playPop(); router.push('/surat'); toast.info('Membuka Surat Izin...'); return true
    }
    if (lowerCmd.includes('pip') || lowerCmd.includes('beasiswa')) {
      uiSound.playPop(); router.push('/pip'); toast.info('Membuka PIP / Beasiswa...'); return true
    }
    if (lowerCmd.includes('eskul') || lowerCmd.includes('ekstrakurikuler')) {
      uiSound.playPop(); router.push('/eskul'); toast.info('Membuka Ekstrakurikuler...'); return true
    }
    if (lowerCmd.includes('leaderboard')) {
      uiSound.playPop(); router.push('/leaderboard'); toast.info('Membuka Leaderboard...'); return true
    }
    if (lowerCmd.includes('whatsapp blast') || lowerCmd.includes('blast')) {
      uiSound.playPop(); router.push('/whatsapp'); toast.info('Membuka WhatsApp Blast...'); return true
    }
    if (lowerCmd.includes('digital wallet') || lowerCmd.includes('wallet')) {
      uiSound.playPop(); router.push('/wallet'); toast.info('Membuka Digital Wallet...'); return true
    }
    if (lowerCmd.includes('jurnal guru') || lowerCmd.includes('jurnal')) {
      uiSound.playPop(); router.push('/jurnal'); toast.info('Membuka Jurnal Guru...'); return true
    }
    if (lowerCmd.includes('uks') || lowerCmd.includes('kesehatan')) {
      uiSound.playPop(); router.push('/uks'); toast.info('Membuka Layanan UKS...'); return true
    }
    if (lowerCmd.includes('prestasi') || lowerCmd.includes('lomba')) {
      uiSound.playPop(); router.push('/prestasi'); toast.info('Membuka Buku Prestasi...'); return true
    }
    if (lowerCmd.includes('absensi')) {
      uiSound.playPop(); router.push('/absensi'); toast.info('Membuka Absensi Harian...'); return true
    }
    
    // Arsip & Utility
    if (lowerCmd.includes('tracer study') || lowerCmd.includes('tracer')) {
      uiSound.playPop(); router.push('/tracer'); toast.info('Membuka Tracer Study...'); return true
    }
    if (lowerCmd.includes('ekspor') || lowerCmd.includes('export')) {
      uiSound.playPop(); router.push('/ekspor'); toast.info('Membuka Ekspor Data...'); return true
    }
    if (lowerCmd.includes('alumni') || lowerCmd.includes('timeline') || lowerCmd.includes('angkatan')) {
      uiSound.playPop(); router.push('/alumni'); toast.info('Membuka Digital Time Capsule...'); return true
    }
    
    // Alat Bantu Utility
    if (lowerCmd.includes('label meja')) {
      uiSound.playPop(); router.push('/utility/label-meja'); toast.info('Membuka Label Meja...'); return true
    }
    if (lowerCmd.includes('id card') || lowerCmd.includes('kartu identitas')) {
      uiSound.playPop(); router.push('/utility/id-card'); toast.info('Membuka ID Card Generator...'); return true
    }
    if (lowerCmd.includes('cover gen')) {
      uiSound.playPop(); router.push('/utility/cover'); toast.info('Membuka Cover Gen...'); return true
    }
    if (lowerCmd.includes('label arsip')) {
      uiSound.playPop(); router.push('/utility/label-arsip'); toast.info('Membuka Label Map...'); return true
    }
    if (lowerCmd.includes('label rapor')) {
      uiSound.playPop(); router.push('/utility/label-rapor'); toast.info('Membuka Sampul Rapor...'); return true
    }
    if (lowerCmd.includes('tanda terima')) {
      uiSound.playPop(); router.push('/utility/tanda-terima'); toast.info('Membuka Tanda Terima...'); return true
    }
    if (lowerCmd.includes('qr generator') || lowerCmd.includes('qr code')) {
      uiSound.playPop(); router.push('/utility/qr-code'); toast.info('Membuka QR Generator...'); return true
    }
    if (lowerCmd.includes('album lulus') || lowerCmd.includes('album')) {
      uiSound.playPop(); router.push('/utility/album'); toast.info('Membuka Album Lulus...'); return true
    }
    if (lowerCmd.includes('sppd')) {
      uiSound.playPop(); router.push('/utility/sppd'); toast.info('Membuka e-SPPD...'); return true
    }
    if (lowerCmd.includes('peta spmb')) {
      uiSound.playPop(); router.push('/utility/peta-spmb'); toast.info('Membuka Peta SPMB...'); return true
    }
    if (lowerCmd.includes('upload foto')) {
      uiSound.playPop(); router.push('/utility/upload-foto'); toast.info('Membuka Upload Foto...'); return true
    }
    
    // Utama
    if (lowerCmd.includes('statistik kelas')) {
      uiSound.playPop(); router.push('/kelas'); toast.info('Membuka Statistik Kelas...'); return true
    }
    if (lowerCmd.includes('insight')) {
      uiSound.playPop(); router.push('/kelas/insight'); toast.info('Membuka Insight...'); return true
    }

    if (lowerCmd.includes('dashboard') || lowerCmd.includes('home') || lowerCmd.includes('halaman utama')) {
      uiSound.playPop(); router.push('/'); toast.info('Membuka Dashboard...'); return true
    }
    if (lowerCmd.includes('kalender') || lowerCmd.includes('agenda')) {
      uiSound.playPop(); router.push('/kalender'); toast.info('Membuka Kalender Akademik...'); return true
    }
    if (lowerCmd.includes('pengaturan') || lowerCmd.includes('setting')) {
      uiSound.playPop(); router.push('/pengaturan'); toast.info('Membuka Pengaturan...'); return true
    }

    // 2. Action Commands
    if (lowerCmd.includes('zen mode')) {
      uiSound.playSuccess(); toggleZenMode(); toast.success('Zen Mode toggled'); return true
    }
    if (lowerCmd.includes('cari panel') || lowerCmd.includes('pencarian')) {
      uiSound.playPop(); toggleSearch(); return true
    }
    if (lowerCmd.includes('cetak surat aktif') || lowerCmd.includes('print surat aktif') || lowerCmd.includes('ska')) {
      uiSound.playSuccess(); toast.info('Cetak Surat Aktif! Pilih siswa terlebih dahulu di halaman Siswa.'); return true
    }
    if (lowerCmd.includes('cetak skb') || lowerCmd.includes('print skb') || lowerCmd.includes('kelakuan baik')) {
      uiSound.playSuccess(); toast.info('Cetak Surat Kelakuan Baik! Pilih siswa terlebih dahulu.'); return true
    }
    if (lowerCmd.includes('cetak skl') || lowerCmd.includes('print skl') || lowerCmd.includes('lulus')) {
      uiSound.playSuccess(); toast.info('Cetak Surat Lulus! Pilih siswa terlebih dahulu.'); return true
    }
    if (lowerCmd.includes('cetak surat mutasi') || lowerCmd.includes('print mutasi') || lowerCmd.includes('pindah')) {
      uiSound.playSuccess(); toast.info('Cetak Surat Mutasi! Pilih siswa terlebih dahulu.'); return true
    }
    if (lowerCmd.includes('cetak') || lowerCmd.includes('print')) {
      uiSound.playSuccess(); window.print(); toast.success('Membuka jendela cetak...'); return true
    }
    if (lowerCmd.includes('berhenti') || lowerCmd.includes('stop') || lowerCmd.includes('matikan')) {
      uiSound.playPop(); setVoiceActive(false); toast.info('Voice command dinonaktifkan'); return true
    }

    // 3. Search Commands: "Cari [Nama]"
    if (lowerCmd.startsWith('cari ') || lowerCmd.startsWith('temukan ')) {
      const query = lowerCmd.replace(/^(cari|temukan)\s+/, '')
      uiSound.playPop(); setFilterSiswa({ search: query }); router.push('/siswa')
      toast.info(`Mencari: ${query}`); return true
    }

    toast.warning('Maaf, perintah tidak dikenali. Coba: "Buka Guru", "Buka Vault", atau "Cari [Nama]"')
    return false
  }

  const startRecognition = useCallback(() => {
    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) return

      const recognition = new SpeechRecognition()
      recognition.lang = 'id-ID'
      recognition.continuous = true
      recognition.interimResults = false

      recognition.onstart = () => {

        isListening.current = true
      }

      recognition.onresult = (event: any) => {
        const last = event.results.length - 1
        const transcript = event.results[last][0].transcript
        handleCommand(transcript)
      }

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') return
        
        if (event.error === 'not-allowed') {
          console.warn('Microphone access denied')
          toast.error('Izin mikrofon ditolak')
          setVoiceActive(false)
          return
        }

        console.error('Speech Recognition Error:', event.error)
      }

      recognition.onend = () => {
        if (voiceActive && isListening.current) {
          try { recognition.start() } catch (e) {}
        }
      }

      recognitionRef.current = recognition
    }

    try {
      recognitionRef.current.start()
    } catch (err) {}
  }, [handleCommand, voiceActive, setVoiceActive])

  const stopRecognition = useCallback(() => {
    isListening.current = false
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (e) {}
    }
  }, [])

  useEffect(() => {
    if (voiceActive) {
      startRecognition()
    } else {
      stopRecognition()
    }
    
    return () => {
      stopRecognition()
    }
  }, [voiceActive, startRecognition, stopRecognition])

  return null
}
