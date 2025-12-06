import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { Stream } from '@cloudflare/stream-react'

interface VideoSources {
  hls?: string
  dash?: string
  preview?: string
  fallback?: string
}

interface ProductImageCarouselProps {
  images: string[]
  productName: string
  selectedIndex: number
  onImageSelect: (index: number) => void
  defaultImage?: string
  video?: {
    url: string
    videoId?: string
    videoSources?: VideoSources
    thumbnail?: string
  } | null
}

const ImageCard = ({
  image,
  index,
  productName,
  isSelected,
  onClick,
  cardRef,
  defaultImage = 'https://i.pinimg.com/736x/91/7a/51/917a51df0d444def3cade8d626305a67.jpg'
}: {
  image: string
  index: number
  productName: string
  isSelected: boolean
  onClick: () => void
  cardRef?: (el: HTMLDivElement | null) => void
  defaultImage?: string
}) => {
  return (
    <motion.div
      ref={cardRef}
      className={`relative w-56 h-80 flex-shrink-0 rounded-lg overflow-hidden shadow-lg group cursor-pointer ${isSelected ? 'ring-2 ring-green-500' : ''
        }`}
      whileHover={{ y: -4, scale: 1.01, transition: { type: 'spring', stiffness: 300 } }}
      onClick={onClick}
    >
      <img
        src={image}
        alt={`${productName} ${index + 1}`}
        className='absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 pointer-events-none'
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.src = defaultImage
        }}
      />
      <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>

      {isSelected && (
        <div className='absolute top-2 right-2 bg-green-500 text-white rounded-full p-1.5 shadow-md'>
          <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
              clipRule='evenodd'
            />
          </svg>
        </div>
      )}

      <div className='absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
        <p className='text-xs font-medium'>Ảnh {index + 1}</p>
      </div>
    </motion.div>
  )
}

const VideoCard = ({
  video,
  thumbnail,
  productName,
  isSelected,
  onClick,
  cardRef,
  defaultImage = 'https://i.pinimg.com/736x/91/7a/51/917a51df0d444def3cade8d626305a67.jpg'
}: {
  video: { url: string; videoId?: string; videoSources?: VideoSources; thumbnail?: string }
  thumbnail?: string
  productName: string
  isSelected: boolean
  onClick: () => void
  cardRef?: (el: HTMLDivElement | null) => void
  defaultImage?: string
}) => {
  return (
    <motion.div
      ref={cardRef}
      className={`relative w-56 h-80 flex-shrink-0 rounded-lg overflow-hidden shadow-lg group cursor-pointer ${isSelected ? 'ring-2 ring-green-500' : ''
        }`}
      whileHover={{ y: -4, scale: 1.01, transition: { type: 'spring', stiffness: 300 } }}
      onClick={onClick}
    >
      {isSelected ? (
        // Show video player when selected
        <>
          <style>{`
            .video-player-container video,
            .video-player-container iframe {
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
            }
          `}</style>
          {video.videoId ? (
            <div className='absolute inset-0 w-full h-full bg-black overflow-hidden video-player-container'>
              <Stream
                src={video.videoId}
                controls
                responsive={false}
                className='w-full h-full'
                preload='metadata'
              />
            </div>
          ) : (
            <video
              controls
              className='absolute inset-0 w-full h-full object-cover'
              poster={video.thumbnail || thumbnail || defaultImage}
              preload='metadata'
              playsInline
              autoPlay
            >
              {video.videoSources?.preview && (
                <source src={video.videoSources.preview} type='video/mp4' />
              )}
              {video.videoSources?.hls && (
                <source src={video.videoSources.hls} type='application/vnd.apple.mpegurl' />
              )}
              {video.videoSources?.dash && (
                <source src={video.videoSources.dash} type='application/dash+xml' />
              )}
              {video.videoSources?.fallback && (
                <source src={video.videoSources.fallback} type='video/mp4' />
              )}
              {(!video.videoSources ||
                (!video.videoSources.hls &&
                  !video.videoSources.dash &&
                  !video.videoSources.preview &&
                  !video.videoSources.fallback)) && (
                  <source src={video.url} type='video/mp4' />
                )}
              Trình duyệt của bạn không hỗ trợ video.
            </video>
          )}
          <div className='absolute top-2 left-2 flex items-center gap-2 bg-black/60 text-white px-2 py-1 rounded text-xs z-10'>
            <Play size={14} className='text-green-400' />
            <span>Video sản phẩm</span>
          </div>
          {isSelected && (
            <div className='absolute top-2 right-2 bg-green-500 text-white rounded-full p-1.5 shadow-md z-10'>
              <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
          )}
        </>
      ) : (
        // Show thumbnail when not selected
        <>
          <img
            src={thumbnail || defaultImage}
            alt={`${productName} video`}
            className='absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 pointer-events-none'
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = defaultImage
            }}
          />
          <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
          
          {/* Play button overlay */}
          <div className='absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors'>
            <div className='bg-white/90 rounded-full p-3 group-hover:scale-110 transition-transform'>
              <Play size={24} className='text-green-600 fill-green-600 ml-0.5' />
            </div>
          </div>

          {/* Video badge */}
          <div className='absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium'>
            VIDEO
          </div>

          <div className='absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
            <p className='text-xs font-medium'>Video sản phẩm</p>
          </div>
        </>
      )}
    </motion.div>
  )
}

export default function ProductImageCarousel({
  images,
  productName,
  selectedIndex,
  onImageSelect,
  defaultImage = 'https://i.pinimg.com/736x/91/7a/51/917a51df0d444def3cade8d626305a67.jpg',
  video
}: ProductImageCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragConstraint, setDragConstraint] = useState(0)
  const [xPosition, setXPosition] = useState(0)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  // Combine images and video into media items
  const mediaItems = [
    ...(video ? [{ type: 'video' as const, ...video }] : []),
    ...images.map((img) => ({ type: 'image' as const, url: img }))
  ]

  const totalMediaCount = mediaItems.length

  useEffect(() => {
    const calculateConstraints = () => {
      if (containerRef.current && trackRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const trackWidth = trackRef.current.scrollWidth
        setDragConstraint(containerWidth - trackWidth)
      }
    }

    calculateConstraints()
    window.addEventListener('resize', calculateConstraints)

    return () => window.removeEventListener('resize', calculateConstraints)
  }, [images, video])

  // Auto-scroll to selected card
  useEffect(() => {
    if (containerRef.current && trackRef.current) {
      const container = containerRef.current

      // Calculate position to center the selected card
      const cardWidth = 224 // w-56 = 14rem = 224px
      const gap = 12 // space-x-3 = 0.75rem = 12px
      const containerWidth = container.offsetWidth

      // Calculate the x position needed to center the selected card
      const cardPosition = selectedIndex * (cardWidth + gap)
      const centerOffset = containerWidth / 2 - cardWidth / 2
      const targetX = -(cardPosition - centerOffset)

      // Clamp to valid range
      const maxX = 0
      const minX = dragConstraint - 24
      const clampedX = Math.max(minX, Math.min(maxX, targetX))

      setXPosition(clampedX)
    }
  }, [selectedIndex, dragConstraint])

  if (!images || images.length === 0) {
    return null
  }

  // If only 1 image and no video, show it as a static image
  if (images.length === 1 && !video) {
    return (
      <div className='w-full'>
        <div className='relative w-full aspect-square max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-md'>
          <img
            src={images[0]}
            alt={productName}
            className='w-full h-full object-cover'
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = defaultImage
            }}
          />
        </div>
      </div>
    )
  }

  // Show carousel for multiple images
  return (
    <div className='w-full'>
      <div className='mb-3'>
        <h3 className='text-sm font-medium text-gray-900'>Hình ảnh sản phẩm</h3>
        <p className='text-xs text-gray-500 mt-0.5'>
          Kéo để xem thêm ảnh • {totalMediaCount} {totalMediaCount === 1 ? 'ảnh' : 'ảnh'}
        </p>
      </div>

      <motion.div ref={containerRef} className='overflow-hidden cursor-grab' whileTap={{ cursor: 'grabbing' }}>
        <motion.div
          ref={trackRef}
          className='flex space-x-3'
          drag='x'
          dragConstraints={{
            right: 0,
            left: dragConstraint - 24
          }}
          dragElastic={0.15}
          dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
          animate={{ x: xPosition }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onDragEnd={(_, info) => {
            // Update position after drag ends to maintain scroll position
            const newX = info.point.x
            const maxX = 0
            const minX = dragConstraint - 24
            const clampedX = Math.max(minX, Math.min(maxX, newX))
            setXPosition(clampedX)
          }}
        >
          {video && (
            <VideoCard
              video={video}
              thumbnail={video.thumbnail || images[0]}
              productName={productName}
              isSelected={selectedIndex === 0}
              onClick={() => onImageSelect(0)}
              cardRef={(el) => {
                cardRefs.current[0] = el
              }}
              defaultImage={defaultImage}
            />
          )}
          {images.map((image, index) => {
            const mediaIndex = video ? index + 1 : index
            return (
              <ImageCard
                key={index}
                image={image}
                index={mediaIndex}
                productName={productName}
                isSelected={selectedIndex === mediaIndex}
                onClick={() => onImageSelect(mediaIndex)}
                cardRef={(el) => {
                  cardRefs.current[mediaIndex] = el
                }}
                defaultImage={defaultImage}
              />
            )
          })}
        </motion.div>
      </motion.div>

      <div className='mt-4 flex items-center justify-center gap-1.5'>
        {mediaItems.map((_, index) => (
          <button
            key={index}
            onClick={() => onImageSelect(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${selectedIndex === index ? 'w-6 bg-green-500' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
              }`}
            aria-label={`Chuyển đến ${index === 0 && video ? 'video' : `ảnh ${index}`}`}
          />
        ))}
      </div>
    </div>
  )
}
