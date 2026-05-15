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
        className="h-[2px] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--primary), var(--accent))',
          boxShadow: '0 0 10px var(--primary-glow), 0 0 5px var(--accent-glow)',
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  )
}
