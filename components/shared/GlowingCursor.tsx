'use client'

import { useEffect, useRef, useState } from 'react'

interface TrailPoint {
  x: number
  y: number
  opacity: number
  size: number
}

const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL']
const interactiveRoles = ['button', 'link', 'menuitem', 'tab']

export default function GlowingCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestRef = useRef<number>()
  const points = useRef<TrailPoint[]>([])
  const mouse = useRef({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const checkIfHovering = (x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas) return false

    canvas.style.display = 'none'
    const element = document.elementFromPoint(x, y)
    canvas.style.display = ''

    if (!element) return false

    let el: Element | null = element
    while (el) {
      const tagName = el.tagName
      const role = el.getAttribute('role')
      const hasOnClick = el.hasAttribute('onclick')
      const hasTabIndex = el.getAttribute('tabindex') && el.getAttribute('tabindex') !== '-1'
      const isContentEditable = el instanceof HTMLElement && el.isContentEditable

      if (
        interactiveTags.includes(tagName) ||
        (role && interactiveRoles.includes(role)) ||
        hasOnClick ||
        hasTabIndex ||
        isContentEditable
      ) {
        return true
      }
      el = el.parentElement
    }
    return false
  }

  useEffect(() => {
    if (isMobile) return

    const updateMousePosition = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }
      setIsHovering(checkIfHovering(e.clientX, e.clientY))
    }

    window.addEventListener('mousemove', updateMousePosition)
    
    return () => {
      window.removeEventListener('mousemove', updateMousePosition)
    }
  }, [isMobile])

  useEffect(() => {
    if (isMobile) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      points.current.unshift({
        x: mouse.current.x,
        y: mouse.current.y,
        opacity: 1,
        size: 12
      })

      if (points.current.length > 25) {
        points.current.pop()
      }

      points.current.forEach((point, index) => {
        const nextPoint = points.current[index + 1]
        if (!nextPoint) return

        const gradient = ctx.createLinearGradient(
          point.x, point.y,
          nextPoint.x, nextPoint.y
        )

        const hue1 = 270 - (index * 5)
        const hue2 = 190 - (index * 5)
        
        gradient.addColorStop(0, `hsla(${hue1}, 100%, 60%, ${point.opacity})`)
        gradient.addColorStop(1, `hsla(${hue2}, 100%, 60%, ${nextPoint.opacity})`)

        ctx.beginPath()
        ctx.moveTo(point.x, point.y)
        ctx.lineTo(nextPoint.x, nextPoint.y)
        ctx.strokeStyle = gradient
        ctx.lineWidth = point.size
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.shadowBlur = 20
        ctx.shadowColor = `hsla(${hue1}, 100%, 60%, ${point.opacity * 0.5})`
        ctx.stroke()

        point.opacity *= 0.92
        point.size *= 0.92
      })

      const currentPoint = points.current[0]
      if (currentPoint) {
        if (isHovering) {
          const gradient = ctx.createRadialGradient(
            currentPoint.x, currentPoint.y, 0,
            currentPoint.x, currentPoint.y, 30
          )
          gradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)')
          gradient.addColorStop(0.5, 'rgba(34, 211, 238, 0.4)')
          gradient.addColorStop(1, 'rgba(34, 211, 238, 0)')

          ctx.beginPath()
          ctx.arc(currentPoint.x, currentPoint.y, 30, 0, Math.PI * 2)
          ctx.fillStyle = gradient
          ctx.shadowBlur = 40
          ctx.shadowColor = 'rgba(139, 92, 246, 0.5)'
          ctx.fill()

          ctx.beginPath()
          ctx.moveTo(currentPoint.x - 8, currentPoint.y - 10)
          ctx.lineTo(currentPoint.x + 8, currentPoint.y)
          ctx.lineTo(currentPoint.x - 8, currentPoint.y + 10)
          ctx.closePath()
          ctx.fillStyle = '#ffffff'
          ctx.shadowBlur = 15
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
          ctx.fill()
        } else {
          const gradient = ctx.createRadialGradient(
            currentPoint.x, currentPoint.y, 0,
            currentPoint.x, currentPoint.y, 20
          )
          gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
          gradient.addColorStop(0.3, 'rgba(139, 92, 246, 0.9)')
          gradient.addColorStop(1, 'rgba(34, 211, 238, 0)')

          ctx.beginPath()
          ctx.arc(currentPoint.x, currentPoint.y, 20, 0, Math.PI * 2)
          ctx.fillStyle = gradient
          ctx.shadowBlur = 30
          ctx.shadowColor = 'rgba(139, 92, 246, 0.6)'
          ctx.fill()

          ctx.beginPath()
          ctx.arc(currentPoint.x, currentPoint.y, 6, 0, Math.PI * 2)
          ctx.fillStyle = '#ffffff'
          ctx.shadowBlur = 15
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
          ctx.fill()
        }
      }

      requestRef.current = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [isMobile, isHovering])

  if (isMobile) return null

  return (
    <canvas
      ref={canvasRef}
      className="glowing-cursor-canvas"
    />
  )
}
