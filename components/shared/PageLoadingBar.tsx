'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function PageLoadingBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevPath = useRef(pathname)

  useEffect(() => {
    const fullPath = pathname + searchParams.toString()
    const prevFull = prevPath.current

    if (fullPath !== prevFull) {
      // Start loading
      setVisible(true)
      setProgress(15)

      timerRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            if (timerRef.current) clearInterval(timerRef.current)
            return 90
          }
          return prev + (90 - prev) * 0.1
        })
      }, 100)
    }

    // Complete
    const completeTimer = setTimeout(() => {
      setProgress(100)
      if (timerRef.current) clearInterval(timerRef.current)
      setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 300)
    }, 200)

    prevPath.current = pathname

    return () => {
      clearTimeout(completeTimer)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [pathname, searchParams])

  if (!visible && progress === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <div
        className="h-[3px] transition-all duration-300 ease-out relative"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, transparent, var(--primary) 50%, var(--accent))',
          boxShadow: '0 0 12px 2px var(--primary-glow), 0 0 6px var(--accent-glow), 0 0 20px var(--primary-glow)',
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Glowing tip */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-8 h-full bg-white opacity-85 blur-[2px]" 
          style={{ boxShadow: '0 0 8px #fff' }}
        />
      </div>
    </div>
  )
}
