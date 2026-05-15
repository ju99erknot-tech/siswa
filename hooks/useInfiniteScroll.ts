import { useEffect, useState, useCallback, useRef } from 'react'

interface UseInfiniteScrollOptions {
  threshold?: number
  rootMargin?: string
}

export function useInfiniteScroll(
  callback: () => void,
  options: UseInfiniteScrollOptions = {}
) {
  const { threshold = 100, rootMargin = '100px' } = options
  const [isFetching, setIsFetching] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const targetRef = useRef<HTMLDivElement | null>(null)

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && !isFetching) {
        setIsFetching(true)
      }
    },
    [isFetching]
  )

  useEffect(() => {
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold,
    })

    const currentObserver = observerRef.current
    const currentTarget = targetRef.current

    if (currentTarget) {
      currentObserver.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        currentObserver.unobserve(currentTarget)
      }
      currentObserver.disconnect()
    }
  }, [handleIntersection, rootMargin, threshold])

  useEffect(() => {
    if (!isFetching) return

    const fetchData = async () => {
      await callback()
      setIsFetching(false)
    }

    fetchData()
  }, [isFetching, callback])

  return { targetRef, isFetching }
}
