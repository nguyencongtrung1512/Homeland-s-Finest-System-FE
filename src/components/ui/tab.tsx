import { useState, useRef, useEffect } from 'react'

interface Spring {
  value: number
  target: number
  velocity: number
  stiffness: number
  damping: number
  update: () => number
  setTarget: (target: number) => void
}

class SpringImpl implements Spring {
  value: number
  target: number
  velocity: number
  stiffness: number
  damping: number

  constructor(value = 0, stiffness = 0.08, damping = 0.1) {
    this.value = value
    this.target = value
    this.velocity = 0
    this.stiffness = stiffness
    this.damping = damping
  }

  update(): number {
    const delta = this.target - this.value
    this.velocity += delta * this.stiffness
    this.velocity *= 1 - this.damping
    this.value += this.velocity
    return this.value
  }

  setTarget(target: number): void {
    this.target = target
  }
}

interface LiquidSegmentedControlProps {
  activeTab: 'product' | 'combo'
  onTabChange: (tab: 'product' | 'combo') => void
  className?: string
}

export default function LiquidSegmentedControl({
  activeTab,
  onTabChange,
  className = ''
}: LiquidSegmentedControlProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const textCanvasRef = useRef<HTMLCanvasElement>(null)

  const positionSpring = useRef<Spring>(new SpringImpl(0))
  const scaleXSpring = useRef<Spring>(new SpringImpl(1))
  const scaleYSpring = useRef<Spring>(new SpringImpl(1))

  useEffect(() => {
    const targetX = activeTab === 'product' ? 0 : 1
    positionSpring.current.setTarget(targetX)
    setIsAnimating(true)

    const timeout = setTimeout(() => setIsAnimating(false), 1200)
    return () => clearTimeout(timeout)
  }, [activeTab])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frameCount = 0

    let lastTime = performance.now()
    const targetFPS = 60
    const frameInterval = 1000 / targetFPS

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime

      // Throttle to target FPS for smoother animation
      if (deltaTime >= frameInterval) {
        frameCount++
        lastTime = currentTime - (deltaTime % frameInterval)

        positionSpring.current.update()
        scaleXSpring.current.update()
        scaleYSpring.current.update()

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const centerX = canvas.width / 2
        const centerY = canvas.height / 2

        const targetPos = positionSpring.current.value
        const blobX = centerX - 200 + targetPos * 400
        const baseSize = 50 // Adjusted for wider tab
        const currentScaleX = 1 + (scaleXSpring.current.value - 1) * 0.25
        const currentScaleY = 1 + (scaleYSpring.current.value - 1) * 0.25

        const drawMetaball = (x: number, y: number, radiusX: number, radiusY: number) => {
          // Main blob with green gradient
          const gradient = ctx.createRadialGradient(x - 15, y - 15, 0, x, y, radiusX * 1.3)
          gradient.addColorStop(0, 'rgba(167, 243, 208, 0.98)')
          gradient.addColorStop(0.4, 'rgba(110, 231, 183, 0.95)')
          gradient.addColorStop(0.8, 'rgba(52, 211, 153, 0.9)')
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.85)')

          ctx.fillStyle = gradient
          ctx.beginPath()

          for (let angle = 0; angle < Math.PI * 2; angle += 0.02) {
            const wave = Math.sin(angle * 2.5 + frameCount * 0.01) * 4
            const pinch = Math.sin(angle * 1.5) * 2
            const rx = radiusX * currentScaleX + wave + pinch
            const ry = radiusY * currentScaleY + wave * 0.4

            const px = x + Math.cos(angle) * rx
            const py = y + Math.sin(angle) * ry

            if (angle === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          }
          ctx.closePath()
          ctx.fill()

          // Inner bright highlight for glass effect
          const highlightGrad = ctx.createRadialGradient(x - 18, y - 20, 5, x, y, radiusX * 1.4)
          highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)')
          highlightGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)')
          highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')

          ctx.fillStyle = highlightGrad
          ctx.beginPath()
          ctx.ellipse(x - 10, y - 18, radiusX * 0.55, radiusY * 0.45, -0.3, 0, Math.PI * 2)
          ctx.fill()

          for (let i = 0; i < 8; i++) {
            const bubbleAngle = (i / 8) * Math.PI * 2 + frameCount * 0.005
            const bubbleRadius = 12 + Math.sin(frameCount * 0.01 + i) * 5
            const bubbleX = x + Math.cos(bubbleAngle) * bubbleRadius
            const bubbleY = y + Math.sin(bubbleAngle) * bubbleRadius
            const bubbleSize = 1.5 + Math.sin(frameCount * 0.015 + i) * 0.8

            ctx.fillStyle = `rgba(209, 250, 229, ${0.4 + Math.sin(frameCount * 0.01 + i) * 0.25})`
            ctx.beginPath()
            ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2)
            ctx.fill()

            ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 + Math.cos(frameCount * 0.01 + i) * 0.3})`
            ctx.lineWidth = 0.4
            ctx.stroke()
          }
        }

        if (isAnimating) {
          scaleXSpring.current.setTarget(1.25)
          scaleYSpring.current.setTarget(0.85)
        } else {
          scaleXSpring.current.setTarget(1)
          scaleYSpring.current.setTarget(1)
        }

        drawMetaball(blobX, centerY, baseSize, baseSize * 0.85)

        const glowGradient = ctx.createRadialGradient(blobX, centerY, 0, blobX, centerY, 50)
        glowGradient.addColorStop(0, 'rgba(52, 211, 153, 0.08)')
        glowGradient.addColorStop(1, 'rgba(52, 211, 153, 0)')
        ctx.fillStyle = glowGradient
        ctx.fillRect(blobX - 50, centerY - 50, 100, 100)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate(performance.now())
    return () => cancelAnimationFrame(animationRef.current)
  }, [isAnimating])

  useEffect(() => {
    const canvas = textCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let lastTime = performance.now()
    const targetFPS = 60
    const frameInterval = 1000 / targetFPS

    const draw = (currentTime: number) => {
      const deltaTime = currentTime - lastTime

      // Throttle to target FPS for smoother animation
      if (deltaTime >= frameInterval) {
        lastTime = currentTime - (deltaTime % frameInterval)

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const centerX = canvas.width / 2
        const centerY = canvas.height / 2
        const blobX = centerX - 200 + positionSpring.current.value * 400

        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        const productX = centerX - 200
        const distToProduct = Math.abs(blobX - productX)

        if (distToProduct < 120) {
          ctx.fillStyle = '#ffffff'
          ctx.shadowColor = 'rgba(16, 185, 129, 0.5)'
          ctx.shadowBlur = 12
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0
        } else {
          ctx.fillStyle = '#a0aec0'
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
        }
        ctx.fillText('Sản phẩm', productX, centerY)

        const comboX = centerX + 200
        const distToCombo = Math.abs(blobX - comboX)

        if (distToCombo < 120) {
          ctx.fillStyle = '#ffffff'
          ctx.shadowColor = 'rgba(16, 185, 129, 0.5)'
          ctx.shadowBlur = 12
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0
        } else {
          ctx.fillStyle = '#a0aec0'
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
        }
        ctx.fillText('Combo', comboX, centerY)
      }

      requestAnimationFrame(draw)
    }

    draw(performance.now())
  }, [activeTab])

  return (
    <div className={`relative w-full ${className}`}>
      {/* Main container */}
      <div className='relative w-full h-10'>
        {/* Canvas for liquid blob */}
        <canvas
          ref={canvasRef}
          width={800}
          height={40}
          className='absolute inset-0 w-full h-full'
          style={{
            filter: 'drop-shadow(0 4px 8px rgba(16, 185, 129, 0.15))',
            willChange: 'transform',
            transform: 'translateZ(0)'
          }}
        />

        {/* Canvas for text overlay */}
        <canvas
          ref={textCanvasRef}
          width={800}
          height={40}
          className='absolute inset-0 w-full h-full'
          style={{
            cursor: 'pointer',
            willChange: 'transform',
            transform: 'translateZ(0)'
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = (e.clientX - rect.left) * (e.currentTarget.width / rect.width)
            onTabChange(x < 400 ? 'product' : 'combo')
          }}
        />
      </div>
    </div>
  )
}
