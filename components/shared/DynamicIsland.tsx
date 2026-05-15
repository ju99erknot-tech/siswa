'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, Battery, Bell, Cloud, Zap, CheckCircle2, AlertCircle, Mic } from 'lucide-react'
import { useAppStore } from '@/store/app.store'

export function DynamicIsland() {
  const { voiceActive } = useAppStore()
  const [status, setStatus] = useState<'idle' | 'notif' | 'sync' | 'voice'>('idle')
  const [content, setContent] = useState({ label: '', desc: '', icon: CheckCircle2 })

  // Voice state has priority
  useEffect(() => {
    if (voiceActive) {
      setStatus('voice')
      setContent({ label: 'J.A.R.V.I.S Listening', desc: 'Sebutkan perintah...', icon: Mic })
    } else {
      setStatus('idle')
    }
  }, [voiceActive])

  // Trigger demo sync after mount (only if not in voice mode)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!voiceActive) {
        setStatus('sync')
        setContent({ label: 'Database Sinkron', desc: 'Siswa updated', icon: CheckCircle2 })
        setTimeout(() => setStatus(prev => prev === 'sync' ? 'idle' : prev), 3000)
      }
    }, 10000)
    return () => clearTimeout(timer)
  }, [voiceActive])

  const isExpanded = status !== 'idle'

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
      <AnimatePresence>
        {status !== 'idle' && (
          <motion.div
            initial={{ width: 120, height: 0, opacity: 0 }}
            animate={{ 
              width: status === 'voice' ? 240 : 280, 
              height: 64, 
              opacity: 1,
              borderRadius: 24,
              backgroundColor: status === 'voice' ? 'rgba(124,58,237,0.95)' : 'rgba(0,0,0,0.9)',
            }}
            exit={{ width: 120, height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 200 }}
            className="text-white backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden pointer-events-auto"
          >
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full h-full flex items-center px-4 gap-3"
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center ${status === 'voice' ? 'bg-white/20 animate-pulse' : 'bg-white/10'}`}
                style={{ color: status === 'voice' ? 'white' : '#34d399' }}
              >
                <content.icon size={status === 'voice' ? 22 : 20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black tracking-tight leading-tight">{content.label}</p>
                <p className="text-[9px] text-white/50 truncate">{content.desc}</p>
              </div>
              {status === 'voice' && (
                <div className="flex gap-0.5">
                  {[1,2,3].map(i => (
                    <motion.div
                      key={i}
                      animate={{ height: [4, 12, 4] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                      className="w-0.5 bg-white/60 rounded-full"
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
