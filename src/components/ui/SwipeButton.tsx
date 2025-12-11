import { useState, useRef, useEffect, useCallback } from 'react'

interface SwipeButtonProps {
  onConfirm?: () => void
}

interface Particle {
  id: number
  x: number
  y: number
  angle: number
}

const SwipeButton = ({ onConfirm }: SwipeButtonProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const [sliderLeft, setSliderLeft] = useState(0)
  const [confirmed, setConfirmed] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const particleIdRef = useRef(0)

  const startX = useRef(0)

  // Xử lý khi bắt đầu kéo (Chuột hoặc Cảm ứng)
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (confirmed) return
    setIsDragging(true)
    // Lấy toạ độ X ban đầu (hỗ trợ cả mobile touch và PC mouse)
    if ('touches' in e) {
      startX.current = e.touches[0].clientX
    } else {
      startX.current = e.clientX
    }
  }

  // Xử lý khi đang kéo
  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || confirmed || !containerRef.current || !sliderRef.current) return

      const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const containerWidth = containerRef.current.clientWidth
      const sliderWidth = sliderRef.current.clientWidth
      const maxDrag = containerWidth - sliderWidth // Quãng đường tối đa kéo được

      // Tính toán vị trí mới
      let newLeft = currentX - startX.current

      // Giới hạn không cho kéo ra ngoài khung
      if (newLeft < 0) newLeft = 0
      if (newLeft > maxDrag) newLeft = maxDrag

      setSliderLeft(newLeft)
    },
    [isDragging, confirmed]
  )

  // Tạo particles khi xác nhận thành công
  const createParticles = () => {
    if (!sliderRef.current || !containerRef.current) return

    const sliderRect = sliderRef.current.getBoundingClientRect()
    const centerX = sliderRect.left + sliderRect.width / 2
    const centerY = sliderRect.top + sliderRect.height / 2

    const newParticles: Particle[] = []
    for (let i = 0; i < 6; i++) {
      const angle = i * 60 * (Math.PI / 180) // 6 hạt, mỗi hạt cách nhau 60 độ
      newParticles.push({
        id: particleIdRef.current++,
        x: centerX,
        y: centerY,
        angle: angle
      })
    }
    setParticles(newParticles)

    // Xóa particles sau animation
    setTimeout(() => {
      setParticles([])
    }, 1000)
  }

  // Xử lý khi thả tay ra
  const handleEnd = useCallback(() => {
    if (!isDragging || confirmed || !containerRef.current || !sliderRef.current) return
    setIsDragging(false)

    const containerWidth = containerRef.current.clientWidth
    const sliderWidth = sliderRef.current.clientWidth
    const maxDrag = containerWidth - sliderWidth

    // Nếu kéo được hơn 90% quãng đường -> Xác nhận
    if (sliderLeft >= maxDrag * 0.9) {
      setSliderLeft(maxDrag)
      setConfirmed(true)
      createParticles() // Tạo particles effect
      if (onConfirm) onConfirm()
    } else {
      // Nếu chưa đủ -> Trượt về vị trí cũ
      setSliderLeft(0)
    }
  }, [isDragging, confirmed, sliderLeft, onConfirm])

  // Lắng nghe sự kiện nhả chuột/touch toàn màn hình để tránh lỗi bị kẹt khi kéo ra ngoài div
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleEnd)
      window.addEventListener('touchend', handleEnd)
      window.addEventListener('mousemove', handleMove)
      window.addEventListener('touchmove', handleMove)
    } else {
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchend', handleEnd)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchmove', handleMove)
    }
    return () => {
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchend', handleEnd)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchmove', handleMove)
    }
  }, [isDragging, handleEnd, handleMove])

  // Tính toán scale và shadow khi kéo
  const dragScale = isDragging ? 1.1 : 1
  const dragShadow = isDragging
    ? '0 8px 20px rgba(88, 206, 92, 0.4), 0 4px 10px rgba(76, 175, 80, 0.3), 0 2px 5px rgba(0, 0, 0, 0.2)'
    : confirmed
      ? '0 6px 16px rgba(76, 175, 80, 0.35), 0 3px 8px rgba(76, 175, 80, 0.25), 0 1px 3px rgba(0, 0, 0, 0.15)'
      : '0 4px 12px rgba(76, 175, 80, 0.3), 0 2px 6px rgba(76, 175, 80, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)'

  // Tính toán progress percentage
  const containerWidth = containerRef.current?.clientWidth || 0
  const sliderWidth = 50
  const maxDrag = containerWidth - sliderWidth
  const progress = maxDrag > 0 ? (sliderLeft / maxDrag) * 100 : 0

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .shimmer-bg {
          background: linear-gradient(
            90deg,
            #E0E0E0 0%,
            #E0E0E0 40%,
            rgba(104, 224, 108, 0.3) 50%,
            #E0E0E0 60%,
            #E0E0E0 100%
          );
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }
      `}</style>

      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '50px',
          backgroundColor: '#E0E0E0',
          borderRadius: '25px',
          userSelect: 'none',
          overflow: 'visible', // Cho phép particles hiển thị ngoài container
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        className={!confirmed ? 'shimmer-bg' : ''}
      >
        {/* Text hướng dẫn (nằm dưới nút trượt) */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: confirmed ? '#4CAF50' : '#666',
            fontWeight: 'bold',
            zIndex: 1,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            textShadow: confirmed ? '0 1px 2px rgba(76, 175, 80, 0.3)' : 'none'
          }}
        >
          {confirmed ? 'ĐÃ XÁC NHẬN ✓' : 'Trượt để đặt hàng >>'}
        </div>

        {/* Màu nền xanh chạy theo nút (Progress bar) với shimmer */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: sliderLeft + 25,
            background: confirmed
              ? 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 50%, #4CAF50 100%)'
              : 'linear-gradient(135deg, #A5D6A7 0%, #C8E6C9 50%, #A5D6A7 100%)',
            borderRadius: '25px 0 0 25px',
            zIndex: 0,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: progress > 0 ? `inset 0 0 20px rgba(76, 175, 80, ${progress / 200})` : 'none'
          }}
        />

        {/* Nút trượt (Slider) với 3D effect */}
        <div
          ref={sliderRef}
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          style={{
            position: 'absolute',
            left: sliderLeft,
            top: 0,
            width: '50px',
            height: '50px',
            background: confirmed
              ? 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 50%, #4CAF50 100%)'
              : 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
            borderRadius: '50%',
            cursor: confirmed ? 'default' : 'grab',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: dragShadow,
            transform: `scale(${dragScale})`,
            transition: isDragging
              ? 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.1s cubic-bezier(0.4, 0, 0.2, 1)'
              : 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            outline: 'none'
          }}
          onMouseUp={() => {
            if (!isDragging) return
            handleEnd()
          }}
        >
          {/* Icon mũi tên hoặc checkmark */}
          {confirmed ? (
            <span
              style={{
                color: 'white',
                fontSize: '22px',
                fontWeight: 'bold',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: 'scale(1.2)'
              }}
            >
              ✓
            </span>
          ) : (
            <span
              style={{
                color: 'white',
                fontSize: '20px',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isDragging ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              ➜
            </span>
          )}
        </div>

        {/* Particles Effect */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            style={{
              position: 'fixed',
              left: particle.x - 4,
              top: particle.y - 4,
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #4CAF50 0%, #66BB6A 100%)',
              boxShadow: '0 0 10px rgba(76, 175, 80, 0.8), 0 0 20px rgba(76, 175, 80, 0.4)',
              zIndex: 1000,
              pointerEvents: 'none',
              animation: `particle-${particle.id} 1s cubic-bezier(0.4, 0, 0.2, 1) forwards`
            }}
          />
        ))}

        {/* Dynamic keyframes for particles */}
        {particles.length > 0 && (
          <style>
            {particles
              .map((particle) => {
                const distance = 80
                const tx = Math.cos(particle.angle) * distance
                const ty = Math.sin(particle.angle) * distance
                return `
              @keyframes particle-${particle.id} {
                0% {
                  opacity: 1;
                  transform: translate(0, 0) scale(1);
                }
                100% {
                  opacity: 0;
                  transform: translate(${tx}px, ${ty}px) scale(0);
                }
              }
            `
              })
              .join('')}
          </style>
        )}
      </div>
    </>
  )
}

export default SwipeButton
