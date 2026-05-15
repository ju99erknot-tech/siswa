'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'

interface UseVirtualScrollOptions<T> {
  items: T[]
  itemHeight: number      // estimated height per row in px
  containerHeight: number // visible container height in px
  overscan?: number       // extra rows to render above/below viewport
}

interface VirtualScrollResult<T> {
  visibleItems: (T & { _virtualIndex: number })[]
  totalHeight: number
  offsetTop: number
  onScroll: (e: React.UIEvent<HTMLElement>) => void
  containerRef: React.RefObject<HTMLDivElement>
}

/**
 * Lightweight virtual scrolling hook — no external deps needed.
 * Renders only visible rows + overscan buffer for smooth scrolling.
 *
 * Usage:
 *   const { visibleItems, totalHeight, offsetTop, onScroll, containerRef } = useVirtualScroll({
 *     items: allSiswa,
 *     itemHeight: 52,
 *     containerHeight: 600,
 *     overscan: 5,
 *   })
 *
 *   <div ref={containerRef} onScroll={onScroll} style={{ height: containerHeight, overflow: 'auto' }}>
 *     <div style={{ height: totalHeight, position: 'relative' }}>
 *       <div style={{ transform: `translateY(${offsetTop}px)` }}>
 *         {visibleItems.map(item => <Row key={item._virtualIndex} {...item} />)}
 *       </div>
 *     </div>
 *   </div>
 */
export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: UseVirtualScrollOptions<T>): VirtualScrollResult<T> {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const totalHeight = items.length * itemHeight

  const { visibleItems, offsetTop } = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan
    const endIndex = Math.min(items.length, startIndex + visibleCount)

    const visible = items.slice(startIndex, endIndex).map((item, i) => ({
      ...item,
      _virtualIndex: startIndex + i,
    }))

    return {
      visibleItems: visible,
      offsetTop: startIndex * itemHeight,
    }
  }, [items, scrollTop, itemHeight, containerHeight, overscan])

  const onScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // Reset scroll when items change significantly
  useEffect(() => {
    setScrollTop(0)
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }, [items.length])

  return { visibleItems, totalHeight, offsetTop, onScroll, containerRef }
}
