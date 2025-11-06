import { useState, useRef, useEffect } from 'react'
import { FileText } from 'lucide-react'

const classNames = (...classes: (string | boolean | undefined | null)[]): string => {
  return classes.filter(Boolean).join(' ')
}

export interface CarouselItem {
  id: string
  name: string
  title: string
  img: string
  onClick?: () => void
}

interface ImageCarouselProps {
  items: CarouselItem[]
  defaultActiveIndex?: number
  onItemClick?: (item: CarouselItem, index: number) => void
}

function ImageCarousel({ items, defaultActiveIndex, onItemClick }: ImageCarouselProps) {
  const initialActiveIndex = defaultActiveIndex ?? Math.floor(items.length / 2)
  const [activeItem, setActiveItem] = useState(initialActiveIndex)
  const wrapperRef = useRef<HTMLUListElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!wrapperRef.current) return
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    wrapperRef.current.style.setProperty('--transition', '600ms cubic-bezier(0.22, 0.61, 0.36, 1)')

    timeoutRef.current = setTimeout(() => {
      wrapperRef.current?.style.removeProperty('--transition')
    }, 900)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [activeItem])

  // Update active item when defaultActiveIndex changes
  useEffect(() => {
    if (defaultActiveIndex !== undefined && defaultActiveIndex !== activeItem) {
      setActiveItem(defaultActiveIndex)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultActiveIndex])

  if (!items || items.length === 0) {
    return null
  }

  const handleImageClick = (index: number) => {
    setActiveItem(index)
  }

  const handleTitleClick = (item: CarouselItem, index: number, e: React.MouseEvent) => {
    e.stopPropagation() // Ngăn chặn event bubble lên parent
    if (onItemClick) {
      onItemClick(item, index)
    }
    if (item.onClick) {
      item.onClick()
    }
  }

  return (
    <div className='w-full font-sans'>
      <div className='w-full max-w-7xl p-4 sm:p-6 md:p-8'>
        <ul ref={wrapperRef} className='flex w-full flex-col gap-2 md:h-[640px] md:flex-row md:gap-[1.5%]'>
          {items.map((item, index) => (
            <li
              onClick={() => handleImageClick(index)}
              aria-current={activeItem === index}
              className={classNames(
                'relative group cursor-pointer transition-all duration-500 ease-in-out',
                'md:w-[8%]',
                "md:[&[aria-current='true']]:w-[48%]",
                'md:[transition:width_var(--transition,300ms_ease_in)]'
              )}
              key={item.id}
            >
              <div className='relative h-full w-full overflow-hidden rounded-2xl bg-black shadow-2xl transition-transform duration-500 ease-in-out group-hover:scale-105 group-hover:z-10 transform-gpu'>
                <img
                  className={classNames(
                    'absolute left-1/2 top-1/2 h-full w-auto max-w-none -translate-x-1/2 -translate-y-1/2 object-cover transition-all duration-500 ease-in-out',
                    activeItem === index ? 'scale-105 grayscale-0' : 'scale-100 grayscale'
                  )}
                  src={item.img || 'https://via.placeholder.com/590x640?text=No+Image'}
                  alt={item.name}
                  width='590'
                  height='640'
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'https://via.placeholder.com/590x640?text=No+Image'
                  }}
                />
                <div
                  className={classNames(
                    'absolute inset-0 transition-opacity duration-500',
                    activeItem === index ? 'opacity-100' : 'opacity-0',
                    'bg-gradient-to-t from-black/70 via-black/30 to-transparent',
                    'md:absolute'
                  )}
                />
                <div
                  className={classNames(
                    'absolute bottom-0 left-0 w-full p-6 text-white transition-[transform,opacity] duration-700 ease-in-out md:p-8',
                    activeItem === index ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                  )}
                >
                  <div className='flex items-start justify-between gap-4'>
                    <div className='flex-1'>
                      <p className='text-sm font-light uppercase tracking-widest text-gray-200 md:text-base'>
                        {item.title}
                      </p>
                      <p
                        onClick={(e) => handleTitleClick(item, index, e)}
                        className='text-2xl font-bold tracking-tight md:text-5xl cursor-pointer hover:underline transition-all'
                        style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}
                      >
                        {item.name}
                      </p>
                    </div>
                    {activeItem === index && (
                      <div className='flex-shrink-0'>
                        <FileText className='w-6 h-6 md:w-8 md:h-8 text-pink-300' />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default ImageCarousel
