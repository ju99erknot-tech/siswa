'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X, User } from 'lucide-react'
import { useAppStore } from '@/store/app.store'
import type { Siswa } from '@/types'

/* ─────────────────────────────────────────────────────────
   SiswaPicker — Searchable student selector synced with Buku Induk
   Replaces manual name input across all modules
───────────────────────────────────────────────────────── */

interface SiswaPickerProps {
  value: string  // siswa id
  onChange: (siswa: Siswa | null) => void
  label?: string
  placeholder?: string
  filterKelas?: string
  required?: boolean
  error?: string
}

export function SiswaPicker({
  value,
  onChange,
  label = 'Siswa',
  placeholder = 'Ketik nama atau NISN...',
  filterKelas,
  required,
  error,
}: SiswaPickerProps) {
  const { dataSiswa } = useAppStore()
  const [open, setOpen] = useState(false)
  const KUMPULAN_KELAS = Array.from(new Set(dataSiswa.map(s => s.kelas))).filter((k): k is string => !!k).sort();
  const [query, setQuery] = useState('')
  const [filterKls, setFilterKls] = useState(filterKelas || 'all')
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Update filterKelas prop
  useEffect(() => {
    if (filterKelas) setFilterKls(filterKelas)
  }, [filterKelas])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectedSiswa = useMemo(() => dataSiswa.find(s => s.id === value), [dataSiswa, value])

  const filtered = useMemo(() => {
    let list = dataSiswa
    if (filterKls !== 'all') list = list.filter(s => s.kelas === filterKls)
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(s =>
        s.nama.toLowerCase().includes(q) ||
        (s.nisn && s.nisn.includes(q)) ||
        (s.nik && s.nik.includes(q))
      )
    }
    return list.sort((a, b) => a.nama.localeCompare(b.nama)).slice(0, 20)
  }, [dataSiswa, filterKls, query])

  const handleSelect = (siswa: Siswa) => {
    onChange(siswa)
    setQuery('')
    setOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setQuery('')
  }

  return (
    <div className="space-y-1.5 relative" ref={dropdownRef}>
      {label && (
        <label className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      {/* Selected state */}
      {selectedSiswa ? (
        <div
          className="w-full h-11 rounded-xl px-4 flex items-center gap-3 transition-all"
          style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.20)' }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0"
            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
            {selectedSiswa.nama.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white/80 truncate">{selectedSiswa.nama}</p>
            <p className="text-[9px] text-white/30 font-mono">{selectedSiswa.kelas} · {selectedSiswa.nisn || 'N/A'}</p>
          </div>
          <button onClick={handleClear} type="button"
            className="w-6 h-6 rounded-md flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all">
            <X size={12} />
          </button>
        </div>
      ) : (
        /* Search input */
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full h-11 pl-10 pr-4 rounded-xl text-sm outline-none transition-all"
            style={{
              background: open ? 'rgba(139,92,246,0.05)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${error ? 'rgba(244,63,94,0.50)' : open ? 'rgba(139,92,246,0.40)' : 'rgba(255,255,255,0.07)'}`,
              color: 'rgba(255,255,255,0.85)',
              boxShadow: open ? '0 0 0 3px rgba(139,92,246,0.10)' : 'none',
            }}
          />
        </div>
      )}

      {error && <p className="text-[11px] text-rose-400">{error}</p>}

      {/* Dropdown */}
      {open && !selectedSiswa && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: '#0d1221',
            border: '1px solid rgba(255,255,255,0.10)',
            top: '100%',
            maxHeight: '320px',
          }}
        >
          {/* Kelas filter */}
          <div className="px-3 py-2 flex items-center gap-2 flex-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Kelas:</span>
            <button onClick={() => setFilterKls('all')}
              className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all ${filterKls === 'all' ? 'bg-violet-500/15 text-violet-400' : 'text-white/25 hover:text-white/50'}`}>
              Semua
            </button>
            {KUMPULAN_KELAS.map(k => (
              <button key={k} onClick={() => setFilterKls(k)}
                className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all ${filterKls === k ? 'bg-violet-500/15 text-violet-400' : 'text-white/25 hover:text-white/50'}`}>
                {k}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="overflow-y-auto max-h-[240px] custom-scroll">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <User className="w-6 h-6 text-white/10 mx-auto mb-2" />
                <p className="text-xs text-white/25">Siswa tidak ditemukan</p>
              </div>
            ) : (
              filtered.map(s => (
                <button key={s.id} onClick={() => handleSelect(s)} type="button"
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors text-left"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0"
                    style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}>
                    {s.nama.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white/70 truncate">{s.nama}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-white/25">{s.kelas || '—'}</span>
                      <span className="text-[9px] text-white/15">·</span>
                      <span className="text-[9px] text-white/20 font-mono">{s.nisn || 'N/A'}</span>
                      {s.jk && <span className="text-[9px] text-white/15">· {s.jk === 'L' ? '♂' : '♀'}</span>}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
