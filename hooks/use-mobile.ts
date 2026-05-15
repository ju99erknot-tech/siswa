'use client'

import { useState, useEffect } from 'react'

/**
 * Returns true when the viewport width is below `breakpoint` (default 768px).
 * Safe for SSR — returns `false` on initial render.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile(e.matches)

    handler(mq)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}
