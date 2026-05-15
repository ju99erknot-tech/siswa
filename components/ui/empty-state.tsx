'use client'

import { motion } from 'framer-motion'
import { Database, SearchX, FileQuestion, Inbox } from 'lucide-react'

interface Props {
  title?: string
  description?: string
  icon?: any
  action?: React.ReactNode
}

export function EmptyState({ 
  title = "Data Tidak Ditemukan", 
  description = "Maaf, kami tidak dapat menemukan data yang Anda cari saat ini.",
  icon: Icon = SearchX,
  action
}: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-[var(--primary)] opacity-10 blur-3xl rounded-full" />
        <div className="relative w-20 h-20 rounded-3xl bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)]">
          <Icon size={32} strokeWidth={1.5} />
        </div>
      </div>
      
      <h3 className="text-lg font-black text-[var(--text-primary)] tracking-tight mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-muted)] max-w-[320px] mx-auto leading-relaxed mb-8">
        {description}
      </p>

      {action && (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          {action}
        </motion.div>
      )}
    </motion.div>
  )
}
