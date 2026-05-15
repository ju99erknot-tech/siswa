'use client'

import { ReactNode } from 'react'
import { motion as m } from 'framer-motion'
import Link from 'next/link'
import { Plus, ArrowRight } from 'lucide-react'

export interface EmptyStateProps {
  icon: ReactNode
  title: string
  subtitle?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  variant?: 'default' | 'search' | 'error'
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  actionHref,
  onAction,
  variant = 'default',
}: EmptyStateProps) {
  const variantStyles = {
    default: {
      iconBg: 'rgba(139,92,246,0.06)',
      iconBorder: 'rgba(139,92,246,0.12)',
      glowColor: 'rgba(139,92,246,0.08)',
    },
    search: {
      iconBg: 'rgba(34,211,238,0.06)',
      iconBorder: 'rgba(34,211,238,0.12)',
      glowColor: 'rgba(34,211,238,0.08)',
    },
    error: {
      iconBg: 'rgba(244,63,94,0.06)',
      iconBorder: 'rgba(244,63,94,0.12)',
      glowColor: 'rgba(244,63,94,0.08)',
    },
  }

  const style = variantStyles[variant]

  const ActionButton = () => {
    if (!actionLabel) return null

    const buttonContent = (
      <m.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onAction}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-bold text-white transition-all mt-6"
        style={{
          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
        }}
      >
        {onAction ? <Plus size={14} /> : <ArrowRight size={14} />}
        {actionLabel}
      </m.button>
    )

    if (actionHref) {
      return <Link href={actionHref}>{buttonContent}</Link>
    }

    return buttonContent
  }

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-20 text-center relative"
    >
      {/* Subtle glow behind icon */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-[60px] pointer-events-none"
        style={{ background: style.glowColor }}
      />

      {/* Decorative rings */}
      <div className="relative mb-6">
        <m.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
          className="absolute -inset-6 rounded-full border border-dashed opacity-10"
          style={{ borderColor: style.iconBorder }}
        />
        <m.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
          className="absolute -inset-3 rounded-full border opacity-5"
          style={{ borderColor: style.iconBorder }}
        />

        {/* Icon container */}
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-white/25 relative z-10"
          style={{
            background: style.iconBg,
            boxShadow: `inset 0 0 0 1px ${style.iconBorder}, 0 10px 30px -10px rgba(0,0,0,0.5)`,
          }}
        >
          <m.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            {icon}
          </m.div>
        </div>
      </div>

      {/* Text */}
      <p className="font-bold text-white/50 text-sm tracking-wide">{title}</p>
      {subtitle && (
        <p className="text-[13px] text-white/30 mt-2 max-w-sm leading-relaxed">
          {subtitle}
        </p>
      )}

      {/* Action button */}
      <ActionButton />
    </m.div>
  )
}
