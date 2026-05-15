'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, BookOpen, ClipboardList, Trophy, Settings,
} from 'lucide-react'
import { useAppStore } from '@/store/app.store'

// ── Mobile bottom navigation — visible only on small screens ─
const NAV_ITEMS = [
  { label: 'Beranda',  icon: LayoutDashboard, href: '/'         },
  { label: 'Siswa',    icon: BookOpen,        href: '/siswa'    },
  { label: 'Absensi',  icon: ClipboardList,   href: '/absensi'  },
  { label: 'Prestasi', icon: Trophy,          href: '/prestasi' },
  { label: 'Setelan',  icon: Settings,        href: '/pengaturan' },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const { zenMode } = useAppStore()

  if (zenMode) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[90] lg:hidden"
      style={{
        background: 'rgba(9,14,26,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {NAV_ITEMS.map(item => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition-all relative"
            >
              {/* Active indicator dot */}
              {active && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute -top-0.5 w-5 h-0.5 rounded-full"
                  style={{ background: '#8b5cf6', boxShadow: '0 0 8px rgba(139,92,246,0.5)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <item.icon
                size={20}
                className="transition-colors"
                style={{ color: active ? '#8b5cf6' : 'rgba(255,255,255,0.25)' }}
              />
              <span
                className="text-[9px] font-bold transition-colors"
                style={{ color: active ? '#a78bfa' : 'rgba(255,255,255,0.20)' }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
