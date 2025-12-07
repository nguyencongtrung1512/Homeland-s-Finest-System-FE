import React, { useState, useMemo } from 'react'
import type { ElementType, ReactNode } from 'react'
import riceFieldImage from '../../assets/hinh-anh-canh-dong-lua-que-huong-viet-nam_082308136.jpg'

// Improved type-safe class name utility
const cn = (...inputs: (string | undefined | null | false)[]) => {
  return inputs.filter(Boolean).join(' ')
}

export interface AnimationTextImageProps {
  src?: string
  className?: string
  children: ReactNode
  fontSize?: string | number
  fontWeight?: string | number
  textAnchor?: 'start' | 'middle' | 'end'
  dominantBaseline?: 'auto' | 'middle' | 'hanging' | 'alphabetic' | 'ideographic' | 'text-bottom' | 'text-top'
  fontFamily?: string
  as?: ElementType<{ className?: string; children?: ReactNode }>
  letterSpacing?: string | number
  lineHeight?: string | number
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  onImageLoad?: () => void
  onImageError?: (error: Event) => void
  alt?: string
}

export function AnimationTextImage({
  src,
  children,
  className = '',
  fontSize = 18,
  fontWeight = 'bold',
  textAnchor = 'middle',
  dominantBaseline = 'middle',
  fontFamily = 'sans-serif',
  as: Component = 'div',
  letterSpacing,
  textTransform = 'none',
  onImageLoad,
  onImageError,
  alt = 'Text with background image'
}: AnimationTextImageProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const imageSrc = src || riceFieldImage

  // Memoize content conversion to avoid unnecessary recalculations
  const content = useMemo(() => {
    return React.Children.toArray(children)
      .map((child) => {
        if (typeof child === 'string' || typeof child === 'number') {
          return child
        }
        return ''
      })
      .join('')
  }, [children])

  // Memoize SVG generation
  const svgMask = useMemo(() => {
    const responsiveFontSize = typeof fontSize === 'number' ? `${fontSize}vw` : fontSize

    // Escape special characters in content for SVG
    const escapedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

    const svgString = `
      <svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>
        <text 
          x='50%' 
          y='50%' 
          font-size='${responsiveFontSize}' 
          font-weight='${fontWeight}' 
          text-anchor='${textAnchor}' 
          dominant-baseline='${dominantBaseline}' 
          font-family='${fontFamily}'
          ${letterSpacing ? `letter-spacing='${letterSpacing}'` : ''}
          ${textTransform !== 'none' ? `text-transform='${textTransform}'` : ''}
        >
          ${escapedContent}
        </text>
      </svg>
    `

    return `url("data:image/svg+xml,${encodeURIComponent(svgString.trim())}")`
  }, [content, fontSize, fontWeight, textAnchor, dominantBaseline, fontFamily, letterSpacing, textTransform])

  // Handle image load
  const handleImageLoad = () => {
    setIsImageLoaded(true)
    onImageLoad?.()
  }

  // Handle image error
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Image failed to load:', event)
    onImageError?.(event.nativeEvent)
  }

  return (
    <Component className={cn('relative w-full h-full overflow-hidden', className)}>
      {/* Image container with mask */}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          !isImageLoaded && 'opacity-0 transition-opacity duration-500'
        )}
        style={{
          maskImage: svgMask,
          WebkitMaskImage: svgMask,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
          opacity: isImageLoaded ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out'
        }}
      >
        <img
          src={imageSrc}
          alt={alt}
          className='w-full h-full object-cover'
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>

      {/* Loading state (optional) */}
      {!isImageLoaded && (
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='text-white text-opacity-50'>Loading...</div>
        </div>
      )}

      {/* Screen reader text */}
      <span className='sr-only'>{content}</span>
    </Component>
  )
}

// -----------------------------------------------------------------------------
// Default Export with Example
// -----------------------------------------------------------------------------
export default function AnimationTextImageExample() {
  return (
    <main className='text-white flex items-center justify-center w-screen h-[400px] overflow-hidden'>
      <div className='w-full h-1/2 max-w-4xl'>
        <AnimationTextImage
          fontFamily='Helvetica, Arial, sans-serif'
          fontSize={20}
          letterSpacing='0.05em'
          textTransform='uppercase'
          onImageLoad={() => console.log('Image loaded successfully')}
          onImageError={(error) => console.error('Image error:', error)}
        >
          Tinh hoa quê nha
        </AnimationTextImage>
      </div>
    </main>
  )
}

