'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface PageShellProps {
  children: ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn('p-6 lg:p-8 space-y-5 max-w-7xl mx-auto', className)}
    >
      {children}
    </motion.div>
  )
}

export interface PageHeaderProps {
  icon: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
  stats?: { label: string, value: string | number }[]
  gradient?: string
  glowColor?: string
}

export function PageHeader({
  icon, title, subtitle, action, stats,
  gradient = 'linear-gradient(135deg, #1a0533 0%, #0c0820 50%, #050d1e 100%)',
  glowColor = 'rgba(139,92,246,0.35)',
}: PageHeaderProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6"
      style={{ background: gradient, border: '1px solid rgba(255,255,255,0.04)' }}
    >
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`, filter: 'blur(40px)' }}
      />
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(139,92,246,0.18) 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {icon}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white/95 tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-white/50 mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {stats && (
            <div className="flex items-center gap-4 px-4 py-2 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
              {stats.map((s, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{s.label}</span>
                  <span className="text-lg font-black text-white">{s.value}</span>
                </div>
              ))}
            </div>
          )}
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      </div>
    </div>
  )
}

export interface StatCardDef {
  label: string
  value: number | string
  color?: string
  icon?: ReactNode
}

export interface StatCardsProps { items: StatCardDef[] }

export function StatCards({ items }: StatCardsProps) {
  let gridClass = 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4'
  if (items.length === 1) gridClass = 'grid-cols-1'
  else if (items.length === 2) gridClass = 'grid-cols-1 sm:grid-cols-2'
  else if (items.length === 3) gridClass = 'grid-cols-1 sm:grid-cols-3'
  else if (items.length === 5) gridClass = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
  else if (items.length >= 6) gridClass = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'

  return (
    <div className={cn('grid gap-4', gridClass)}>
      {items.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl p-4 flex flex-col items-center text-center transition-all hover:-translate-y-0.5"
          style={{ background: 'rgba(13,18,33,0.80)', border: '1px solid rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}
        >
          {s.icon && <div className="mb-2 opacity-60">{s.icon}</div>}
          <div className="text-2xl font-black text-white/90 tracking-tight">{s.value}</div>
          <div
            className="text-[10px] font-bold uppercase tracking-[0.12em] mt-1"
            style={{ color: s.color || '#a78bfa' }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  )
}

export interface PageCardProps {
  children: ReactNode
  className?: string
  noPad?: boolean
}

export function PageCard({ children, className, noPad }: PageCardProps) {
  return (
    <div
      className={cn('rounded-2xl overflow-hidden', !noPad && 'p-5', className)}
      style={{ background: 'rgba(13,18,33,0.80)', border: '1px solid rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}
    >
      {children}
    </div>
  )
}

export interface PageCardHeaderProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  action?: ReactNode
}

export function PageCardHeader({ title, subtitle, icon, action }: PageCardHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-center gap-2.5">
        {icon && <div className="text-violet-400">{icon}</div>}
        <div>
          <h3 className="font-bold text-white/85 text-sm">{title}</h3>
          {subtitle && <p className="text-[11px] text-white/30 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}
