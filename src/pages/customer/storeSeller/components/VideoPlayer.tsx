import { useState, useRef, useEffect } from 'react'
import { Stream } from '@cloudflare/stream-react'
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'
// @ts-expect-error - No declaration file for data.js
import { videoData } from '../data.js'

export default function VideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(videoData.duration || 0)
  const [playerInstance, setPlayerInstance] = useState<HTMLVideoElement | null>(null)
  const [showThumbnail, setShowThumbnail] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [previewEnded, setPreviewEnded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Xử lý khi hover vào video
  const handleMouseEnter = () => {
    if (showThumbnail) {
      setShowPreview(true)
      setShowThumbnail(false)
    }
  }

  const handleMouseLeave = () => {
    if (!previewEnded && !isPlaying) {
      setShowThumbnail(true)
      setShowPreview(false)
    }
  }

  // Xử lý khi preview kết thúc
  const handlePreviewEnded = () => {
    setPreviewEnded(true)
    setShowPreview(false)
    setIsPlaying(true)
  }

  const togglePlay = () => {
    if (playerInstance) {
      if (isPlaying) {
        playerInstance.pause()
      } else {
        playerInstance.play()
      }
      setIsPlaying(!isPlaying)
    } else if (showThumbnail) {
      setShowThumbnail(false)
      setShowPreview(true)
    }
  }

  const toggleMute = () => {
    if (playerInstance) {
      playerInstance.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    }
  }

  const handleTimeUpdate = (event: Event) => {
    const target = event.target as HTMLVideoElement
    setCurrentTime(target.currentTime)
  }

  const handleLoadedMetadata = (event: Event) => {
    const target = event.target as HTMLVideoElement
    setDuration(target.duration)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = (parseInt(e.target.value) / 100) * duration
    if (playerInstance) {
      playerInstance.currentTime = seekTime
      setCurrentTime(seekTime)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = (currentTime / duration) * 100 || 0

  useEffect(() => {
    // Get video element after Stream component mounts
    const videoElement = document.querySelector('video')
    if (videoElement) {
      setPlayerInstance(videoElement as HTMLVideoElement)
    }
  }, [previewEnded, showPreview, showThumbnail])

  // Reset state khi component unmount
  useEffect(() => {
    return () => {
      setShowThumbnail(true)
      setShowPreview(false)
      setPreviewEnded(false)
      setIsPlaying(false)
    }
  }, [])

  return (
    <div className='w-full bg-white rounded-lg overflow-hidden shadow-md'>
      <div className='w-full'>
        <div className='bg-black rounded-lg overflow-hidden'>
          {/* Video Container */}
          <div
            ref={containerRef}
            className='relative aspect-video bg-black cursor-pointer'
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={togglePlay}
          >
            {/* Thumbnail */}
            {showThumbnail && (
              <div className='absolute inset-0 z-10'>
                <img src={videoData.thumbnail} alt='Video thumbnail' className='w-full h-full object-cover' />
                <div className='absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center'>
                  <div className='w-16 h-16 rounded-full bg-green-500 bg-opacity-80 flex items-center justify-center'>
                    <Play size={32} className='text-white ml-1' />
                  </div>
                </div>
              </div>
            )}

            {/* Preview Video */}
            {showPreview && (
              <div className='absolute inset-0 z-5'>
                <Stream
                  controls={false}
                  src={videoData.uid}
                  preload='auto'
                  muted={true}
                  autoplay={true}
                  className='w-full h-full'
                  onEnded={handlePreviewEnded}
                  startTime={0}
                />
              </div>
            )}

            {/* Main Video */}
            <div className={`absolute inset-0 ${showThumbnail || showPreview ? 'opacity-0' : 'opacity-100'}`}>
              <Stream
                controls={false}
                src={videoData.uid}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetaData={handleLoadedMetadata}
                responsive={true}
                className='w-full h-full'
                autoplay={previewEnded}
              />
            </div>

            {/* Custom Controls - Chỉ hiển thị khi đang xem video chính */}
            {!showThumbnail && !showPreview && (
              <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity duration-300 opacity-0 hover:opacity-100'>
                {/* Progress Bar */}
                <div className='mb-2'>
                  <input
                    type='range'
                    min='0'
                    max='100'
                    value={progress}
                    onChange={handleSeek}
                    className='w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer'
                    style={{
                      background: `linear-gradient(to right, #10b981 ${progress}%, #4b5563 ${progress}%)`
                    }}
                  />
                </div>

                {/* Controls */}
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePlay()
                      }}
                      className='text-white hover:text-green-400 transition'
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleMute()
                      }}
                      className='text-white hover:text-green-400 transition'
                    >
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>

                    <span className='text-white text-sm'>
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFullscreen()
                    }}
                    className='text-white hover:text-green-400 transition'
                  >
                    <Maximize size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className='bg-white p-4 border-t border-gray-100'>
            <h2 className='text-gray-800 text-lg font-semibold mb-1'>{videoData.meta.name}</h2>
            <div className='flex items-center gap-2 text-gray-500 text-sm'>
              <span>Thời lượng: {formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
