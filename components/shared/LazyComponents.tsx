'use client'

import dynamic from 'next/dynamic'
import { PageSkeleton } from '@/components/shared/Skeleton'

// ── Heavy component lazy loaders ────────────────────────────────
// These components are loaded on-demand to reduce initial bundle size.

// SiswaDetail360 — 57KB component
export const LazySiswaDetail360 = dynamic(
  () => import('@/components/siswa/SiswaDetail360').then(m => ({ default: m.SiswaDetail360 })),
  {
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(8,9,13,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    ),
    ssr: false,
  }
)

// SiswaForm — 32KB component
export const LazySiswaForm = dynamic(
  () => import('@/components/siswa/SiswaForm'),
  {
    loading: () => <PageSkeleton />,
    ssr: false,
  }
)

// BulkPrintModal — 22KB component
export const LazyBulkPrintModal = dynamic(
  () => import('@/components/siswa/BulkPrintModal').then(m => ({ default: m.BulkPrintModal })),
  {
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(8,9,13,0.85)' }}>
        <div className="w-10 h-10 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
      </div>
    ),
    ssr: false,
  }
)

// ImportExcelModal — 30KB component
export const LazyImportExcelModal = dynamic(
  () => import('@/components/shared/ImportExcelModal'),
  {
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(8,9,13,0.85)' }}>
        <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    ),
    ssr: false,
  }
)

// WhatsAppBlast — 21KB component
export const LazyWhatsAppBlast = dynamic(
  () => import('@/components/shared/WhatsAppBlast').then(m => ({ default: m.WhatsAppBlast })),
  {
    ssr: false,
  }
)

// CommandPalette — 17KB component
export const LazyCommandPalette = dynamic(
  () => import('@/components/shared/CommandPalette').then(m => ({ default: m.CommandPalette })),
  {
    ssr: false,
  }
)

// VoiceCommandEngine — 13KB component
export const LazyVoiceCommandEngine = dynamic(
  () => import('@/components/shared/VoiceCommandEngine').then(m => ({ default: m.VoiceCommandEngine })),
  {
    ssr: false,
  }
)

// AIChat — 15KB component
export const LazyAIChat = dynamic(
  () => import('@/components/shared/AIChat').then(m => ({ default: m.AIChat })),
  {
    ssr: false,
  }
)
