'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export type SortDir = 'asc' | 'desc' | null

export interface AuroraTableProps {
  headers: string[]
  children: ReactNode
  loading?: boolean
  empty?: ReactNode
  sortIndex?: number | null
  sortDir?: SortDir
  onSort?: (index: number) => void
  unsortable?: number[]
}

export function AuroraTable({ headers, children, loading, empty, sortIndex, sortDir, onSort, unsortable = [] }: AuroraTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
            {headers.map((h, idx) => {
              const isSortable = onSort && !unsortable.includes(idx)
              const isActive = sortIndex === idx && sortDir
              return (
                <th
                  key={h}
                  className={cn(
                    'px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-white/30',
                    isSortable && 'cursor-pointer select-none hover:text-white/50 transition-colors group'
                  )}
                  onClick={() => isSortable && onSort && onSort(idx)}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {h}
                    {isSortable && (
                      <span className={cn('transition-all', isActive ? 'opacity-80' : 'opacity-0 group-hover:opacity-30')}>
                        {isActive && sortDir === 'asc' ? <ArrowUp size={11} className="text-violet-400" /> :
                         isActive && sortDir === 'desc' ? <ArrowDown size={11} className="text-violet-400" /> :
                         <ArrowUpDown size={11} />}
                      </span>
                    )}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={headers.length} className="px-5 py-16 text-center"><div className="flex justify-center"><div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" /></div></td></tr>
          ) : empty || children}
        </tbody>
      </table>
    </div>
  )
}

export function ATRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr
      className={cn('transition-colors group', className)}
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </tr>
  )
}

export function ATCell({ children, className, mono }: { children: ReactNode; className?: string; mono?: boolean }) {
  return (
    <td className={cn('px-5 py-3', mono && 'font-mono', className)}>
      {children}
    </td>
  )
}
