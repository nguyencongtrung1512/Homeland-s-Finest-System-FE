import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, type PanInfo } from 'motion/react'

interface ProductImageCarouselProps {
  images: string[]
  productName?: string
  height?: string
}

interface IconProps {
  className?: string
}

const ChevronLeftIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='24'
    height='24'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    className={className}
  >
    <path d='m15 18-6-6 6-6' />
  </svg>
)

const ChevronRightIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='24'
    height='24'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    className={className}
  >
    <path d='m9 18 6-6-6-6' />
  </svg>
)

function ImageCard({
  imageUrl,
  index,
  activeIndex,
  totalImages,
  productName
}: {
  imageUrl: string
  index: number
  activeIndex: number
  totalImages: number
  productName?: string
}) {
  let offset = index - activeIndex
  if (offset > totalImages / 2) {
    offset -= totalImages
  } else if (offset < -totalImages / 2) {
    offset += totalImages
  }

  const isVisible = Math.abs(offset) <= 1

  const animate = {
    x: `${offset * 50}%`,
    scale: offset === 0 ? 1 : 0.8,
    zIndex: totalImages - Math.abs(offset),
    opacity: isVisible ? 1 : 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 30 }
  }

  return (
    <motion.div
      className='absolute w-1/2 md:w-1/3 h-[95%]'
      style={{
        transformStyle: 'preserve-3d'
      }}
      animate={animate}
      initial={false}
    >
      <div className='relative w-full h-full rounded-3xl shadow-2xl overflow-hidden bg-gray-200 dark:bg-neutral-800'>
        <img
          src={imageUrl}
          alt={productName ? `${productName} ${index + 1}` : `Image ${index + 1}`}
          className='w-full h-full object-cover pointer-events-none'
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.onerror = null
            target.src = '/placeholder-image.png'
          }}
        />
      </div>
    </motion.div>
  )
}

export default function ProductImageCarousel({ images, productName, height = '400px' }: ProductImageCarouselProps) {
  // Hooks must be called before any early returns
  const [activeIndex, setActiveIndex] = useState(
    images && images.length > 0 ? Math.floor(images.length / 2) : 0
  )
  const [isPaused, setIsPaused] = useState(false)
  const autoplayIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const autoplayDelay = 5000 // Tăng thời gian autoplay cho product images

  const goToNext = useCallback(() => {
    if (images && images.length > 0) {
      setActiveIndex((prev) => (prev + 1) % images.length)
    }
  }, [images])

  useEffect(() => {
    if (!isPaused && images && images.length > 1) {
      autoplayIntervalRef.current = setInterval(goToNext, autoplayDelay)
    }
    return () => {
      if (autoplayIntervalRef.current) {
        clearInterval(autoplayIntervalRef.current)
      }
    }
  }, [isPaused, goToNext, images, autoplayDelay])

  // Early return after hooks
  if (!images || images.length === 0) {
    return (
      <div className='w-full flex items-center justify-center bg-gray-100 rounded-lg' style={{ height }}>
        <div className='text-gray-400'>Không có hình ảnh</div>
      </div>
    )
  }

  const changeSlide = (newIndex: number) => {
    const newSafeIndex = (newIndex + images.length) % images.length
    setActiveIndex(newSafeIndex)
    if (autoplayIntervalRef.current) {
      clearInterval(autoplayIntervalRef.current)
    }
    if (!isPaused && images.length > 1) {
      autoplayIntervalRef.current = setInterval(goToNext, autoplayDelay)
    }
  }

  const onDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const dragThreshold = 75
    const dragOffset = info.offset.x
    if (dragOffset > dragThreshold) {
      changeSlide(activeIndex - 1)
    } else if (dragOffset < -dragThreshold) {
      changeSlide(activeIndex + 1)
    }
  }

  return (
    <div className='w-full' onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      <div className='relative w-full flex items-center justify-center overflow-hidden rounded-lg' style={{ height }}>
        <motion.div
          className='w-full h-full flex items-center justify-center'
          drag='x'
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={onDragEnd}
        >
          {images.map((imageUrl, index) => (
            <ImageCard
              key={index}
              imageUrl={imageUrl}
              index={index}
              activeIndex={activeIndex}
              totalImages={images.length}
              productName={productName}
            />
          ))}
        </motion.div>
      </div>

      {images.length > 1 && (
        <div className='flex items-center justify-center gap-6 mt-6'>
          <button
            onClick={() => changeSlide(activeIndex - 1)}
            className='p-2 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-green-500'
            aria-label='Previous image'
          >
            <ChevronLeftIcon className='w-6 h-6' />
          </button>

          <div className='flex items-center justify-center gap-2'>
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => changeSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 focus:outline-none ${activeIndex === index
                  ? 'w-6 bg-green-500'
                  : 'w-2 bg-gray-300 dark:bg-neutral-600 hover:bg-gray-400 dark:hover:bg-neutral-500'
                  }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => changeSlide(activeIndex + 1)}
            className='p-2 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-green-500'
            aria-label='Next image'
          >
            <ChevronRightIcon className='w-6 h-6' />
          </button>
        </div>
      )}
    </div>
  )
}
