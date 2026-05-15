'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useRef } from 'react'

/**
 * Hook for prefetching routes on hover/focus.
 * Adds a debounced prefetch to avoid excessive calls.
 * Usage:
 *   const { onMouseEnter, onFocus } = usePrefetch('/siswa')
 *   <Link {...{ onMouseEnter, onFocus }} href="/siswa">...</Link>
 */
export function usePrefetch(href: string) {
  const router = useRouter()
  const prefetched = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const prefetch = useCallback(() => {
    if (prefetched.current) return
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      router.prefetch(href)
      prefetched.current = true
    }, 100) // 100ms debounce
  }, [href, router])

  return {
    onMouseEnter: prefetch,
    onFocus: prefetch,
  }
}

/**
 * Higher-order component wrapper that adds prefetch behavior to Links.
 * Use as: <PrefetchLink href="/siswa">...</PrefetchLink>
 */
export function PrefetchLink({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: React.ReactNode }) {
  const { onMouseEnter, onFocus } = usePrefetch(href)

  // We return event handlers for the parent Link component
  return (
    <span onMouseEnter={onMouseEnter} onFocus={onFocus} {...props}>
      {children}
    </span>
  )
}
