'use client'

import { lazy, Suspense, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface LazyLoadProps {
  children: ReactNode
  fallback?: ReactNode
}

export function LazyLoad({ children, fallback }: LazyLoadProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-3 text-white/40">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Memuat...</span>
      </div>
    </div>
  )

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  )
}

// Helper function to lazy load components
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy(importFn)
}
