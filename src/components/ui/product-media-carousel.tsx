import { useRef, useEffect } from 'react'
import { Stream } from '@cloudflare/stream-react'
import { Play } from 'lucide-react'

interface VideoSources {
  hls?: string
  dash?: string
  preview?: string
  fallback?: string
}

interface MediaItem {
  type: 'image' | 'video'
  url: string
  thumbnail?: string // For video thumbnail
  videoId?: string // For Cloudflare Stream
  videoSources?: VideoSources
}

interface ProductMediaCarouselProps {
  images: string[]
  video?: {
    url: string
    videoId?: string
    videoSources?: VideoSources
    thumbnail?: string
  } | null
  productName: string
  selectedIndex: number
  onMediaSelect: (index: number) => void
  defaultImage?: string
}

export default function ProductMediaCarousel({
  images,
  video,
  productName,
  selectedIndex,
  onMediaSelect,
  defaultImage = 'https://i.pinimg.com/736x/91/7a/51/917a51df0d444def3cade8d626305a67.jpg'
}: ProductMediaCarouselProps) {
  // Combine images and video into media items
  const mediaItems: MediaItem[] = [
    ...images.map((img) => ({ type: 'image' as const, url: img })),
    ...(video
      ? [
          {
            type: 'video' as const,
            url: video.url,
            videoId: video.videoId,
            videoSources: video.videoSources,
            thumbnail: video.thumbnail || images[0] // Use first image as video thumbnail if not provided
          }
        ]
      : [])
  ]

  const currentMedia = mediaItems[selectedIndex]
  const isVideo = currentMedia?.type === 'video'

  // Auto-scroll thumbnails to show selected item
  const thumbnailContainerRef = useRef<HTMLDivElement>(null)
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (thumbnailContainerRef.current && thumbnailRefs.current[selectedIndex]) {
      const thumbnail = thumbnailRefs.current[selectedIndex]
      if (thumbnail) {
        const container = thumbnailContainerRef.current
        const thumbnailRect = thumbnail.getBoundingClientRect()

        const scrollLeft = thumbnail.offsetLeft - container.offsetLeft - container.clientWidth / 2 + thumbnailRect.width / 2

        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        })
      }
    }
  }, [selectedIndex])

  if (mediaItems.length === 0) {
    return (
      <div className='w-full'>
        <div className='relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center'>
          <img src={defaultImage} alt={productName} className='w-full h-full object-cover' />
        </div>
      </div>
    )
  }

  return (
    <div className='w-full space-y-3'>
      {/* Main Display */}
      <div className='relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center'>
        <style>{`
          .video-container video,
          .video-container iframe {
            max-width: 100% !important;
            max-height: 100% !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
          }
        `}</style>
        {isVideo && currentMedia.videoId ? (
          // Cloudflare Stream video - hiển thị với tỷ lệ gốc, tự do trong khung
          <div className='w-full h-full flex items-center justify-center bg-black video-container'>
            <Stream
              src={currentMedia.videoId}
              controls
              responsive
              className='max-w-full max-h-full'
              preload='metadata'
            />
          </div>
        ) : isVideo && currentMedia.videoSources ? (
          // Regular video with multiple sources - hiển thị với tỷ lệ gốc, tự do trong khung
          <video
            controls
            className='bg-black video-container'
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain'
            }}
            poster={currentMedia.thumbnail || images[0] || undefined}
            preload='metadata'
            playsInline
          >
            {currentMedia.videoSources.preview && (
              <source src={currentMedia.videoSources.preview} type='video/mp4' />
            )}
            {currentMedia.videoSources.hls && (
              <source src={currentMedia.videoSources.hls} type='application/vnd.apple.mpegurl' />
            )}
            {currentMedia.videoSources.dash && (
              <source src={currentMedia.videoSources.dash} type='application/dash+xml' />
            )}
            {currentMedia.videoSources.fallback && (
              <source src={currentMedia.videoSources.fallback} type='video/mp4' />
            )}
            {(!currentMedia.videoSources.preview &&
              !currentMedia.videoSources.hls &&
              !currentMedia.videoSources.dash &&
              !currentMedia.videoSources.fallback) && (
              <source src={currentMedia.url} type='video/mp4' />
            )}
            Trình duyệt của bạn không hỗ trợ video.
          </video>
        ) : (
          // Image
          <img
            src={currentMedia?.url || defaultImage}
            alt={productName}
            className='w-full h-full object-contain'
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = defaultImage
            }}
          />
        )}

        {/* Video indicator overlay for images */}
        {isVideo && (
          <div className='absolute top-2 left-2 flex items-center gap-2 bg-black/60 text-white px-2 py-1 rounded text-xs z-10'>
            <Play size={14} className='text-green-400' />
            <span>Video sản phẩm</span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {mediaItems.length > 1 && (
        <div className='w-full'>
          <div
            ref={thumbnailContainerRef}
            className='flex gap-2 overflow-x-auto pb-2 scrollbar-hide'
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {mediaItems.map((media, index) => {
              const isSelected = selectedIndex === index
              const isVideoThumbnail = media.type === 'video'

              return (
                <button
                  key={index}
                  ref={(el) => {
                    thumbnailRefs.current[index] = el
                  }}
                  onClick={() => onMediaSelect(index)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    isSelected
                      ? 'border-green-500 ring-2 ring-green-200'
                      : 'border-gray-300 hover:border-green-300'
                  }`}
                >
                  {isVideoThumbnail ? (
                    <>
                      <img
                        src={media.thumbnail || images[0] || defaultImage}
                        alt={`${productName} video`}
                        className='w-full h-full object-cover'
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = defaultImage
                        }}
                      />
                      {/* Play button overlay */}
                      <div className='absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors'>
                        <div className='bg-white/90 rounded-full p-1.5'>
                          <Play size={16} className='text-green-600 fill-green-600' />
                        </div>
                      </div>
                      {/* Video badge */}
                      <div className='absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded'>
                        VIDEO
                      </div>
                    </>
                  ) : (
                    <img
                      src={media.url}
                      alt={`${productName} ${index + 1}`}
                      className='w-full h-full object-cover'
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = defaultImage
                      }}
                    />
                  )}

                  {isSelected && (
                    <div className='absolute inset-0 ring-2 ring-green-500 rounded-lg pointer-events-none' />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

