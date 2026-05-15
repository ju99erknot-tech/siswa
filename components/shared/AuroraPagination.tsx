'use client'

import { useState, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { SortDir } from './AuroraTable'

export interface AuroraPaginationProps {
  currentPage: number
  totalItems: number
  perPage: number
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  perPageOptions?: number[]
}

export function AuroraPagination({
  currentPage, totalItems, perPage, onPageChange, onPerPageChange,
  perPageOptions = [10, 25, 50, 100],
}: AuroraPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage))
  const from = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1
  const to = Math.min(currentPage * perPage, totalItems)

  const getPages = () => {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const btnBase = 'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200'
  const btnInactive = `${btnBase} text-white/30 hover:text-white/60 hover:bg-white/5`
  const btnActive = `${btnBase} text-white bg-violet-600 shadow-lg shadow-violet-500/20`
  const btnDisabled = `${btnBase} text-white/10 cursor-not-allowed`
  const btnNav = (disabled: boolean) => disabled ? btnDisabled : btnInactive

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4"
      style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/25 font-bold uppercase tracking-wider">Tampil</span>
          <select
            value={perPage}
            onChange={e => { onPerPageChange(Number(e.target.value)); onPageChange(1) }}
            className="h-8 px-2.5 rounded-lg text-xs font-bold outline-none appearance-none cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.7)',
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M2 3.5L5 7L8 3.5' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: '24px',
            }}
          >
            {perPageOptions.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <span className="text-[11px] text-white/20 font-medium">
          {totalItems > 0 ? `${from}–${to} dari ${totalItems}` : '0 data'}
        </span>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className={btnNav(currentPage === 1)} title="Halaman pertama">
            <ChevronsLeft size={14} />
          </button>
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={btnNav(currentPage === 1)} title="Sebelumnya">
            <ChevronLeft size={14} />
          </button>

          <div className="flex items-center gap-0.5 mx-1">
            {getPages().map((p, i) =>
              p === '...' ? (
                <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-white/15 text-xs">⋯</span>
              ) : (
                <button key={p} onClick={() => onPageChange(p as number)} className={currentPage === p ? btnActive : btnInactive}>
                  {p}
                </button>
              )
            )}
          </div>

          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className={btnNav(currentPage === totalPages)} title="Berikutnya">
            <ChevronRight size={14} />
          </button>
          <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className={btnNav(currentPage === totalPages)} title="Halaman terakhir">
            <ChevronsRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

export function usePagination<T>(data: T[], defaultPerPage = 10) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(defaultPerPage)

  const totalPages = Math.max(1, Math.ceil(data.length / perPage))
  const safePage = Math.min(page, totalPages)
  const paginated = data.slice((safePage - 1) * perPage, safePage * perPage)

  return {
    page: safePage,
    setPage,
    perPage,
    setPerPage,
    totalItems: data.length,
    totalPages,
    paginated,
  }
}

export function useSorting<T>(data: T[], keyExtractors?: ((item: T) => string | number | null | undefined)[]) {
  const [sortIndex, setSortIndex] = useState<number | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  const handleSort = useCallback((index: number) => {
    if (sortIndex === index) {
      setSortDir(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc')
      if (sortDir === 'desc') setSortIndex(null)
    } else {
      setSortIndex(index)
      setSortDir('asc')
    }
  }, [sortIndex, sortDir])

  const sorted = useMemo(() => {
    if (sortIndex === null || sortDir === null || !keyExtractors || !keyExtractors[sortIndex]) return data
    const extractor = keyExtractors[sortIndex]
    return [...data].sort((a, b) => {
      const va = extractor(a) ?? ''
      const vb = extractor(b) ?? ''
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va
      }
      const sa = String(va).toLowerCase()
      const sb = String(vb).toLowerCase()
      return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa)
    })
  }, [data, sortIndex, sortDir, keyExtractors])

  return { sortIndex, sortDir, handleSort, sorted }
}
