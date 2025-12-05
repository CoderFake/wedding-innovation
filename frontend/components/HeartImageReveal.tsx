'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface Heart {
  x: number
  y: number
  targetX: number
  targetY: number
  startX: number
  startY: number
  size: number
  startTime: number
  duration: number
  windPhase: number
}

interface HeartImageRevealProps {
  imageUrl: string
  className?: string
  startAnimation?: boolean
  onAnimationComplete?: () => void
}

export default function HeartImageReveal({
  imageUrl,
  className = '',
  startAnimation = false,
  onAnimationComplete
}: HeartImageRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [status, setStatus] = useState<'waiting' | 'loading' | 'animating' | 'flashing' | 'done'>('waiting')
  const heartsRef = useRef<Heart[]>([])
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const [flashOpacity, setFlashOpacity] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)

  const ANIMATION_DURATION = 3000 // 3 seconds total

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

  const drawHeart = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    rotation: number,
    alpha: number,
    colorProgress: number
  ) => {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(x, y)
    ctx.rotate(rotation)

    const s = size / 16
    ctx.beginPath()
    for (let i = 0; i < Math.PI * 2; i += 0.01) {
      const heartX = 16 * Math.pow(Math.sin(i), 3)
      const heartY = -(13 * Math.cos(i) - 5 * Math.cos(2 * i) - 2 * Math.cos(3 * i) - Math.cos(4 * i))
      if (i === 0) {
        ctx.moveTo(heartX * s, heartY * s)
      } else {
        ctx.lineTo(heartX * s, heartY * s)
      }
    }
    ctx.closePath()

    // Wedding color scheme: soft pink to deep red
    const pinkTop = [255, 182, 193] // Light pink
    const pinkBottom = [255, 105, 180] // Hot pink
    const redTop = [220, 20, 60] // Crimson
    const redBottom = [139, 0, 0] // Dark red

    const topColor = pinkTop.map((p, i) => Math.round(p + (redTop[i] - p) * colorProgress))
    const bottomColor = pinkBottom.map((p, i) => Math.round(p + (redBottom[i] - p) * colorProgress))

    const gradient = ctx.createLinearGradient(0, -size * 0.8, 0, size * 0.6)
    gradient.addColorStop(0, `rgb(${topColor[0]}, ${topColor[1]}, ${topColor[2]})`)
    gradient.addColorStop(1, `rgb(${bottomColor[0]}, ${bottomColor[1]}, ${bottomColor[2]})`)
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.restore()
  }, [])

  // Pre-load image
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageUrl

    img.onload = () => {
      imgRef.current = img
      setImageLoaded(true)
    }

    img.onerror = () => {
      setImageLoaded(true) // Continue even if image fails
    }
  }, [imageUrl])

  useEffect(() => {
    if (!startAnimation || !imageLoaded || status !== 'waiting') return

    setStatus('loading')
  }, [startAnimation, imageLoaded, status])

  useEffect(() => {
    if (status !== 'loading') return

    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    // Get container dimensions
    const containerRect = container.getBoundingClientRect()
    const containerWidth = containerRect.width || 400
    const containerHeight = containerRect.height || 533

    // Set canvas to match container
    canvas.width = containerWidth
    canvas.height = containerHeight

    setDimensions({ width: containerWidth, height: containerHeight })

    const hearts: Heart[] = []
    const step = Math.max(35, Math.min(containerWidth, containerHeight) / 12)

    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const angle = Math.random() * Math.PI * 2
        const distance = Math.max(canvas.width, canvas.height) * 0.9
        const startX = canvas.width / 2 + Math.cos(angle) * distance
        const startY = canvas.height / 2 + Math.sin(angle) * distance

        const sizeMultiplier = 0.6 + Math.random() * 0.8

        hearts.push({
          x: x + step / 2,
          y: y + step / 2,
          targetX: x + step / 2,
          targetY: y + step / 2,
          startX,
          startY,
          size: step * 1.3 * sizeMultiplier, 
          startTime: Math.random() * 500, 
          duration: 2500 + Math.random() * 500,
          windPhase: Math.random() * Math.PI * 2,
        })
      }
    }

    heartsRef.current = hearts
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    startTimeRef.current = performance.now()
    setStatus('animating')

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [status])

  // Animation loop
  useEffect(() => {
    if (status !== 'animating') return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current
      const globalColorProgress = Math.min(1, elapsed / ANIMATION_DURATION)

      // Clear with soft background
      ctx.fillStyle = '#fff8f8'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      let allDone = true

      heartsRef.current.forEach((heart) => {
        const heartElapsed = elapsed - heart.startTime

        if (heartElapsed < 0) {
          allDone = false
          return
        }

        const progress = Math.min(1, heartElapsed / heart.duration)
        if (progress < 1) allDone = false

        const easedProgress = easeOutCubic(progress)

        // Wind/spiral effect
        const windStrength = Math.pow(1 - easedProgress, 2)
        const spiralRadius = 80 * windStrength
        const spiralAngle = easedProgress * Math.PI * 3 + heart.windPhase

        const windOffsetX = Math.sin(spiralAngle) * spiralRadius
        const windOffsetY = Math.cos(spiralAngle * 0.8) * spiralRadius * 0.7

        const currentX = heart.startX + (heart.targetX - heart.startX) * easedProgress + windOffsetX
        const currentY = heart.startY + (heart.targetY - heart.startY) * easedProgress + windOffsetY

        const rotation = windStrength * Math.sin(spiralAngle * 2) * 0.8
        const scale = 0.4 + easedProgress * 0.6
        const alpha = Math.min(1, easedProgress * 2)

        if (alpha > 0) {
          drawHeart(ctx, currentX, currentY, heart.size * scale, rotation, alpha, globalColorProgress)
        }
      })

      if (elapsed >= ANIMATION_DURATION && allDone) {
        setStatus('flashing')
        return
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [status, drawHeart])

  // Flash effect - fullscreen flashbang like a bomb!
  useEffect(() => {
    if (status !== 'flashing') return

    // Immediately set flash to full brightness
    setFlashOpacity(1)

    // After flash peaks, fade out and complete
    const flashTimeout = setTimeout(() => {
      setStatus('done')
      onAnimationComplete?.()
    }, 600) // Flash lasts 600ms

    return () => {
      clearTimeout(flashTimeout)
    }
  }, [status, onAnimationComplete])

  return (
    <>
      {/* Inject flashbang keyframes */}
      <style jsx global>{`
        @keyframes flashbang {
          0% { opacity: 0; }
          15% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      <div 
        ref={containerRef} 
        className={`relative w-full h-full ${className}`}
        style={{ 
          opacity: status === 'done' || status === 'waiting' ? 0 : 1,
          transition: 'opacity 0.5s ease-out',
          pointerEvents: status === 'done' || status === 'waiting' ? 'none' : 'auto'
        }}
      >
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full"
        style={{ 
          width: '100%', 
          height: '100%',
          objectFit: 'cover',
          display: status === 'flashing' || status === 'done' ? 'none' : 'block'
        }}
      />
      {/* Flashbang effect - covers only this component */}
      {status === 'flashing' && (
        <div
          className="absolute inset-0 bg-white pointer-events-none z-50"
          style={{ 
            animation: 'flashbang 600ms ease-out forwards'
          }}
        />
      )}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="animate-spin w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
    </>
  )
}
