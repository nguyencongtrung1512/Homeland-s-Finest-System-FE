import { useState, useEffect, useCallback } from 'react'
import { X, ArrowLeft, ArrowRight, ZoomIn, ZoomOut } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

interface ImagePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  images: string[]
  initialIndex?: number
  alt?: string
}

export default function ImagePreviewModal({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  alt = 'Preview'
}: ImagePreviewModalProps) {
  // Validate and normalize images array from BE
  const normalizedImages = Array.isArray(images) ? images.filter((img) => img && typeof img === 'string') : []

  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)

  // Navigation handlers - defined before useEffect
  const handleNext = useCallback(() => {
    if (normalizedImages.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % normalizedImages.length)
      setZoom(1)
    }
  }, [normalizedImages.length])

  const handlePrev = useCallback(() => {
    if (normalizedImages.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + normalizedImages.length) % normalizedImages.length)
      setZoom(1)
    }
  }, [normalizedImages.length])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 1))
  }

  // Update current index when initialIndex changes
  useEffect(() => {
    if (isOpen && normalizedImages.length > 0 && initialIndex >= 0 && initialIndex < normalizedImages.length) {
      setCurrentIndex(initialIndex)
    }
  }, [isOpen, initialIndex, normalizedImages.length])

  // Reset to first image when modal opens
  useEffect(() => {
    if (isOpen && normalizedImages.length > 0) {
      setCurrentIndex(initialIndex >= 0 && initialIndex < normalizedImages.length ? initialIndex : 0)
      setZoom(1)
    }
  }, [isOpen, normalizedImages.length, initialIndex])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && normalizedImages.length > 1) {
        handlePrev()
      } else if (e.key === 'ArrowRight' && normalizedImages.length > 1) {
        handleNext()
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn()
      } else if (e.key === '-') {
        handleZoomOut()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, normalizedImages.length, handlePrev, handleNext, onClose])

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index)
    setZoom(1)
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Early return if no valid images from BE
  if (!isOpen || normalizedImages.length === 0) return null

  const currentImage = normalizedImages[currentIndex]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className='fixed inset-0 bg-black/98 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm'
          onClick={handleBackdropClick}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className='absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black/60 rounded-full p-2.5 hover:bg-black/80 transition-colors backdrop-blur-sm'
            aria-label='Đóng'
            title='Đóng (Esc)'
          >
            <X className='w-6 h-6' />
          </button>

          {/* Zoom Controls */}
          <div className='absolute top-4 left-4 flex gap-2 z-10'>
            <button
              onClick={handleZoomOut}
              className='text-white hover:text-gray-300 bg-black/60 rounded-full p-2.5 hover:bg-black/80 transition-colors backdrop-blur-sm'
              aria-label='Thu nhỏ'
              title='Thu nhỏ (-)'
            >
              <ZoomOut className='w-5 h-5' />
            </button>
            <div className='flex items-center gap-2 bg-black/60 rounded-full px-4 py-2 backdrop-blur-sm'>
              <span className='text-white text-sm font-medium'>{Math.round(zoom * 100)}%</span>
            </div>
            <button
              onClick={handleZoomIn}
              className='text-white hover:text-gray-300 bg-black/60 rounded-full p-2.5 hover:bg-black/80 transition-colors backdrop-blur-sm'
              aria-label='Phóng to'
              title='Phóng to (+)'
            >
              <ZoomIn className='w-5 h-5' />
            </button>
          </div>

          {/* Navigation Buttons */}
          {normalizedImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrev()
                }}
                className='absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black/60 rounded-full p-3 hover:bg-black/80 transition-colors backdrop-blur-sm'
                aria-label='Ảnh trước'
                title='Ảnh trước (←)'
              >
                <ArrowLeft className='w-6 h-6' />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleNext()
                }}
                className='absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black/60 rounded-full p-3 hover:bg-black/80 transition-colors backdrop-blur-sm'
                aria-label='Ảnh tiếp theo'
                title='Ảnh tiếp theo (→)'
              >
                <ArrowRight className='w-6 h-6' />
              </button>
            </>
          )}

          {/* Image Display with Zoom */}
          <div className='relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center overflow-hidden'>
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className='flex items-center justify-center w-full h-full'
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                src={currentImage}
                alt={`${alt} ${currentIndex + 1}`}
                className='max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-zoom-in'
                animate={{ scale: zoom }}
                transition={{ duration: 0.3 }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder-image.png'
                }}
              />
            </motion.div>
          </div>

          {/* Image Counter */}
          {normalizedImages.length > 1 && (
            <div className='absolute bottom-24 left-1/2 -translate-x-1/2 text-white bg-black/70 backdrop-blur-md rounded-full px-4 py-2 text-sm font-medium shadow-lg'>
              {currentIndex + 1} / {normalizedImages.length}
            </div>
          )}

          {/* Thumbnail Strip (if multiple images) */}
          {normalizedImages.length > 1 && (
            <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-4xl overflow-x-auto px-4 py-3 bg-black/70 backdrop-blur-md rounded-lg shadow-xl scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent'>
              {normalizedImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleThumbnailClick(idx)
                  }}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    idx === currentIndex
                      ? 'border-emerald-400 ring-2 ring-emerald-300/50 scale-110 shadow-lg'
                      : 'border-white/30 hover:border-white/60 opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className='w-full h-full object-cover'
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder-image.png'
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

