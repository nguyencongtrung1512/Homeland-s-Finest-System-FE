import { useEffect, useRef, useState } from 'react'

interface NextJsHomepageIframeProps {
  /** URL của Next.js app (local hoặc production) */
  src?: string
  /** Chiều cao iframe (default: '100vh') */
  height?: string
  /** Có tự động resize theo content không */
  autoResize?: boolean
  /** Callback khi iframe load xong */
  onLoad?: () => void
  /** Callback khi có lỗi */
  onError?: (error: Error) => void
}

const NextJsHomepageIframe: React.FC<NextJsHomepageIframeProps> = ({
  src = 'https://homeland-finest-homepage.vercel.app',
  height = '100vh',
  autoResize = true,
  onLoad,
  onError
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    // Handle load event
    const handleLoad = () => {
      setIsLoading(false)
      onLoad?.()
    }

    // Handle error event
    const handleError = () => {
      const err = new Error('Failed to load iframe content')
      setError('Không thể tải nội dung. Vui lòng thử lại sau.')
      setIsLoading(false)
      onError?.(err)
    }

    iframe.addEventListener('load', handleLoad)
    iframe.addEventListener('error', handleError)

    return () => {
      iframe.removeEventListener('load', handleLoad)
      iframe.removeEventListener('error', handleError)
    }
  }, [onLoad, onError])

  // Auto-resize iframe theo content (nếu enabled)
  useEffect(() => {
    if (!autoResize || !iframeRef.current) return

    const iframe = iframeRef.current

    const handleMessage = (event: MessageEvent) => {
      // Security: Chỉ nhận messages từ domain của Next.js app
      const allowedOrigin = new URL(src).origin
      if (event.origin !== allowedOrigin) return

      // Nhận height từ Next.js app
      if (event.data?.type === 'iframe-resize' && event.data?.height) {
        iframe.style.height = `${event.data.height}px`
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [autoResize, src])

  return (
    <div className='relative w-full' style={{ height }}>
      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center bg-gray-100'>
          <div className='text-center'>
            <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent'></div>
            <p className='mt-2 text-sm text-gray-600'>Đang tải...</p>
          </div>
        </div>
      )}

      {error && (
        <div className='absolute inset-0 flex items-center justify-center bg-gray-100'>
          <div className='text-center'>
            <p className='text-red-600'>{error}</p>
            <button
              onClick={() => {
                setError(null)
                setIsLoading(true)
                if (iframeRef.current) {
                  iframeRef.current.src = iframeRef.current.src 
                }
              }}
              className='mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={src}
        className='w-full border-0'
        style={{
          height: autoResize ? 'auto' : height,
          minHeight: height
        }}
        title='Tinh Hoa Quê Nhà - 3D Homepage'
        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
        allowFullScreen
        loading='lazy'
      />
    </div>
  )
}

export default NextJsHomepageIframe
