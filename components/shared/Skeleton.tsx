'use client'

import { cn } from '@/lib/utils'

// ── Base Skeleton ─────────────────────────────────────────────
// Uses the ultra-smooth diagonal shimmer defined in globals.css
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "skeleton-shimmer animate-in fade-in duration-300",
        className
      )}
      {...props}
    />
  )
}

// ── Card Skeleton ─────────────────────────────────────────────
export function CardSkeleton() {
  return (
    <div className="card-obsidian rounded-[32px] p-8 border-white/[0.04] space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-3 w-[60px]" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  )
}

// ── Table Skeleton ────────────────────────────────────────────
// Standard standalone simulated table card skeleton
export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(13,18,33,0.4)' }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-3 rounded-md" style={{ width: i === 0 ? '40px' : `${60 + (i * 20)}px` }} />
        ))}
      </div>
      {/* Rows with staggered entry delay */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 px-6 py-3.5 transition-all"
          style={{ 
            borderTop: '1px solid rgba(255,255,255,0.03)', 
            opacity: 1 - (r * 0.08),
          }}
        >
          <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" style={{ animationDelay: `${r * 0.08}s` }} />
          {Array.from({ length: cols - 1 }).map((_, c) => (
            <Skeleton
              key={`r${r}-c${c}`}
              className="h-3 rounded-md"
              style={{ 
                width: `${40 + Math.random() * 80}px`, 
                animationDelay: `${r * 0.08 + c * 0.05}s` 
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Table Body Row Skeletons (For rendering inside tbody) ─────
export function TableRowSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr 
          key={r} 
          className="border-b border-white/[0.02] transition-colors"
          style={{ opacity: 1 - (r * 0.12) }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="py-4 px-5">
              <Skeleton 
                className="h-3.5 rounded-md" 
                style={{ 
                  width: c === 0 ? '24px' : c === 1 ? '36px' : `${50 + Math.random() * 70}px`,
                  animationDelay: `${r * 0.08 + c * 0.04}s`
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ── Stat Card Skeleton ────────────────────────────────────────
export function StatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl p-5 space-y-3 animate-in fade-in duration-300"
          style={{
            background: 'rgba(13,18,33,0.80)',
            border: '1px solid rgba(255,255,255,0.04)',
            animationDelay: `${i * 0.08}s`,
          }}
        >
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-xl" style={{ animationDelay: `${i * 0.08}s` }} />
            <Skeleton className="h-2.5 w-16 rounded-full" style={{ animationDelay: `${i * 0.08 + 0.04}s` }} />
          </div>
          <Skeleton className="h-7 w-20 rounded-lg" style={{ animationDelay: `${i * 0.08 + 0.08}s` }} />
          <Skeleton className="h-2 w-24 rounded-full" style={{ animationDelay: `${i * 0.08 + 0.12}s` }} />
        </div>
      ))}
    </div>
  )
}

// ── Page Skeleton (full page loading) ─────────────────────────
export function PageSkeleton() {
  return (
    <div className="space-y-8 p-6 animate-in fade-in duration-300">
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-3 w-32 rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </div>
      {/* Stats */}
      <StatSkeleton />
      {/* Table */}
      <TableSkeleton />
    </div>
  )
}

// ── List Skeleton ─────────────────────────────────────────────
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ opacity: 1 - (i * 0.12) }}
        >
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" style={{ animationDelay: `${i * 0.06}s` }} />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4 rounded-md" style={{ animationDelay: `${i * 0.06 + 0.03}s` }} />
            <Skeleton className="h-2.5 w-1/2 rounded-md" style={{ animationDelay: `${i * 0.06 + 0.06}s` }} />
          </div>
          <Skeleton className="h-6 w-14 rounded-lg" style={{ animationDelay: `${i * 0.06 + 0.09}s` }} />
        </div>
      ))}
    </div>
  )
}
