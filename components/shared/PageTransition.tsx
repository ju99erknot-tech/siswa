'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

// ── Smooth page transition wrapper ───────────────────────────
// Wrap any page content for consistent enter/exit animations
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12, scale: 0.988 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      {/* Premium ambient glass sweep decoration */}
      <motion.div
        initial={{ left: '-100%', opacity: 0.25 }}
        animate={{ left: '100%', opacity: 0 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.02 }}
        className="absolute inset-y-0 w-[30%] pointer-events-none z-50 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -skew-x-[25deg]"
      />
      {children}
    </motion.div>
  )
}

// ── Skeleton shimmer variants ────────────────────────────────
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg skeleton-shimmer" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-24 rounded skeleton-shimmer" />
            <div className="h-2 w-16 rounded skeleton-shimmer" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2 w-full rounded skeleton-shimmer" />
          <div className="h-2 w-3/4 rounded skeleton-shimmer" />
          <div className="h-2 w-1/2 rounded skeleton-shimmer" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex gap-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {[80, 120, 60, 100].map((w, i) => (
          <div key={i} className="h-3 rounded skeleton-shimmer" style={{ width: w }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="px-5 py-3.5 flex items-center gap-4"
          style={{ borderBottom: i < rows - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
        >
          <div className="w-8 h-8 rounded-lg skeleton-shimmer flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 rounded skeleton-shimmer" style={{ width: `${60 + Math.random() * 30}%` }} />
            <div className="h-2 w-20 rounded skeleton-shimmer" />
          </div>
          <div className="w-16 h-6 rounded-lg skeleton-shimmer" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonStat() {
  return (
    <div
      className="rounded-2xl p-4 md:p-5"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="w-9 h-9 rounded-lg skeleton-shimmer mb-3" />
      <div className="h-2 w-16 rounded skeleton-shimmer mb-2" />
      <div className="h-6 w-12 rounded skeleton-shimmer mb-2" />
      <div className="h-2 w-20 rounded skeleton-shimmer" />
    </div>
  )
}

// ── Empty state illustration ─────────────────────────────────
export function EmptyState({
  icon: Icon,
  title,
  desc,
  action,
  actionLabel,
}: {
  icon: React.ElementType
  title: string
  desc: string
  action?: () => void
  actionLabel?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 px-6"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.12)' }}
      >
        <Icon className="w-7 h-7 text-violet-400/40" />
      </div>
      <h3 className="text-sm font-bold text-white/50 mb-1.5">{title}</h3>
      <p className="text-xs text-white/25 text-center max-w-xs leading-relaxed">{desc}</p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="mt-4 h-9 px-5 rounded-xl text-xs font-bold text-violet-400 transition-all hover:bg-violet-500/10"
          style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  )
}
