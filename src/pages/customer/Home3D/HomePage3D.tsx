import { useEffect, useRef } from 'react'
import NextJsHomepageIframe from '../../../components/3D/NextJsHomepageIframe'

function HomePage3D() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Ngăn chặn navigation events từ iframe gây vòng lặp
    const handleMessage = (event: MessageEvent) => {
      const iframeSrc = import.meta.env.VITE_NEXTJS_HOMEPAGE_URL || 'https://homeland-finest-homepage.vercel.app'
      const allowedOrigin = new URL(iframeSrc).origin

      // Chỉ xử lý messages từ iframe
      if (event.origin !== allowedOrigin) return

      // Nếu iframe muốn navigate parent window, ngăn chặn
      if (event.data?.type === 'navigate-parent' || event.data?.type === 'navigation') {
        event.preventDefault?.()
        console.log('Navigation từ iframe đã bị chặn:', event.data)
      }
    }

    // Ngăn chặn beforeunload events không mong muốn
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Chỉ prevent nếu thực sự cần thiết
      // Không prevent mặc định để tránh ảnh hưởng UX
    }

    // Intercept popstate để ngăn navigation từ iframe
    const handlePopState = (e: PopStateEvent) => {
      // Nếu navigation được trigger từ iframe, có thể cần xử lý đặc biệt
      // Nhưng thường thì popstate chỉ xảy ra ở parent window
    }

    window.addEventListener('message', handleMessage)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('message', handleMessage)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // Ngăn chặn click events từ iframe leak ra ngoài
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleClick = (e: MouseEvent) => {
      // Kiểm tra xem click có phải từ iframe không
      const target = e.target as HTMLElement
      const iframe = container.querySelector('iframe')

      if (iframe && target === iframe) {
        // Click vào iframe, không làm gì cả
        return
      }
    }

    container.addEventListener('click', handleClick, true)

    return () => {
      container.removeEventListener('click', handleClick, true)
    }
  }, [])

  return (
    <div ref={containerRef} className="min-h-screen">
      <NextJsHomepageIframe
        src={import.meta.env.VITE_NEXTJS_HOMEPAGE_URL || 'https://homeland-finest-homepage.vercel.app'}
        height="100vh"
        autoResize={true}
      />
    </div>
  )
}

export default HomePage3D