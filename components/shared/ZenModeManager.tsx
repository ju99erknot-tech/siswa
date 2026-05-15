'use client'
import { useEffect } from 'react'
import { useAppStore } from '@/store/app.store'

export function ZenModeManager() {
  const { zenMode, toggleZenMode } = useAppStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '\\' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        toggleZenMode()
      }
      if (e.key === 'Escape' && zenMode) {
        toggleZenMode()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [zenMode, toggleZenMode])

  // Toggle CSS class on body to hide sidebar/header in zen mode
  useEffect(() => {
    if (zenMode) {
      document.body.classList.add('zen-mode')
    } else {
      document.body.classList.remove('zen-mode')
    }
    return () => document.body.classList.remove('zen-mode')
  }, [zenMode])

  if (!zenMode) return null

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200]">
      <div 
        className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl transition-all hover:scale-105 cursor-pointer" 
        style={{ 
          background: 'rgba(13,18,33,0.90)', 
          border: '1px solid rgba(139,92,246,0.5)', 
          backdropFilter: 'blur(20px)' 
        }}
        onClick={toggleZenMode}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
        <span className="text-xs font-black tracking-widest text-white">ZEN MODE ON</span>
        <div className="w-px h-4 bg-white/20 mx-1" />
        <span className="text-[10px] font-bold text-white/50 bg-white/10 px-2 py-0.5 rounded-md">Esc</span>
      </div>
    </div>
  )
}
