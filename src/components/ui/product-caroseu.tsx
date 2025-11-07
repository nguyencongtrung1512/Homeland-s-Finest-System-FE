import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface ProductImageCarouselProps {
  images: string[]
  productName: string
  selectedIndex: number
  onImageSelect: (index: number) => void
  defaultImage?: string
}

const ImageCard = ({
  image,
  index,
  productName,
  isSelected,
  onClick,
  defaultImage = 'https://i.pinimg.com/736x/91/7a/51/917a51df0d444def3cade8d626305a67.jpg'
}: {
  image: string
  index: number
  productName: string
  isSelected: boolean
  onClick: () => void
  defaultImage?: string
}) => {
  return (
    <motion.div
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

export default function ProductImageCarousel({
  images,
  productName,
  selectedIndex,
  onImageSelect,
  defaultImage = 'https://i.pinimg.com/736x/91/7a/51/917a51df0d444def3cade8d626305a67.jpg'
}: ProductImageCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragConstraint, setDragConstraint] = useState(0)

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
  }, [images])

  if (!images || images.length === 0) {
    return null
  }

  // If only 1 image, show it as a static image
  if (images.length === 1) {
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
        <p className='text-xs text-gray-500 mt-0.5'>Kéo để xem thêm ảnh • {images.length} ảnh</p>
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
        >
          {images.map((image, index) => (
            <ImageCard
              key={index}
              image={image}
              index={index}
              productName={productName}
              isSelected={selectedIndex === index}
              onClick={() => onImageSelect(index)}
              defaultImage={defaultImage}
            />
          ))}
        </motion.div>
      </motion.div>

      <div className='mt-4 flex items-center justify-center gap-1.5'>
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => onImageSelect(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${selectedIndex === index ? 'w-6 bg-green-500' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
              }`}
            aria-label={`Chuyển đến ảnh ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
