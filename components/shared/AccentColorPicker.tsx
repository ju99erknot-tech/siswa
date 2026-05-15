'use client'

import { useEffect, useState } from 'react'
import { Palette, Check } from 'lucide-react'

const ACCENT_PRESETS = [
  { name: 'Violet', key: 'violet', primary: '#8b5cf6', accent: '#22d3ee', hover: '#a78bfa' },
  { name: 'Blue', key: 'blue', primary: '#3b82f6', accent: '#60a5fa', hover: '#60a5fa' },
  { name: 'Emerald', key: 'emerald', primary: '#10b981', accent: '#34d399', hover: '#34d399' },
  { name: 'Rose', key: 'rose', primary: '#f43f5e', accent: '#fb7185', hover: '#fb7185' },
  { name: 'Amber', key: 'amber', primary: '#f59e0b', accent: '#fbbf24', hover: '#fbbf24' },
  { name: 'Cyan', key: 'cyan', primary: '#06b6d4', accent: '#22d3ee', hover: '#67e8f9' },
  { name: 'Pink', key: 'pink', primary: '#ec4899', accent: '#f472b6', hover: '#f472b6' },
  { name: 'Indigo', key: 'indigo', primary: '#6366f1', accent: '#818cf8', hover: '#818cf8' },
]

function applyAccent(preset: typeof ACCENT_PRESETS[0]) {
  const root = document.documentElement
  root.style.setProperty('--primary', preset.primary)
  root.style.setProperty('--primary-hover', preset.hover)
  root.style.setProperty('--primary-active', preset.primary)
  root.style.setProperty('--primary-subtle', hexToRgba(preset.primary, 0.12))
  root.style.setProperty('--primary-glow', hexToRgba(preset.primary, 0.30))
  root.style.setProperty('--primary-light', hexToRgba(preset.primary, 0.06))
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function AccentColorPicker() {
  const [active, setActive] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accent_color') || 'violet'
    }
    return 'violet'
  })

  useEffect(() => {
    const preset = ACCENT_PRESETS.find(p => p.key === active)
    if (preset) applyAccent(preset)
  }, [active])

  const handleSelect = (key: string) => {
    setActive(key)
    try { localStorage.setItem('accent_color', key) } catch {}
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Palette size={14} className="text-white/40" />
        <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Warna Aksen</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {ACCENT_PRESETS.map(preset => (
          <button
            key={preset.key}
            onClick={() => handleSelect(preset.key)}
            title={preset.name}
            className="relative w-8 h-8 rounded-xl transition-all hover:scale-110 active:scale-95 group"
            style={{
              background: `linear-gradient(135deg, ${preset.primary}, ${preset.accent})`,
              boxShadow: active === preset.key ? `0 0 16px ${hexToRgba(preset.primary, 0.5)}` : 'none',
              outline: active === preset.key ? `2px solid ${preset.primary}` : '2px solid transparent',
              outlineOffset: '2px',
            }}
          >
            {active === preset.key && (
              <Check size={14} className="text-white absolute inset-0 m-auto drop-shadow-md" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// Auto-apply saved accent on mount
export function AccentInitializer() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem('accent_color') || 'violet'
      const preset = ACCENT_PRESETS.find(p => p.key === saved)
      if (preset) applyAccent(preset)
    } catch {}
  }, [])
  return null
}
