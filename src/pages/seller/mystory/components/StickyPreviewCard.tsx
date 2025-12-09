import React, { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { FileText } from 'lucide-react'

interface StickyPreviewCardProps {
  children: React.ReactNode
}

export const StickyPreviewCard: React.FC<StickyPreviewCardProps> = ({ children }) => {
  const [isFixed, setIsFixed] = useState(false)
  const [topOffset, setTopOffset] = useState(0)
  const [leftOffset, setLeftOffset] = useState<number>(0)
  const [width, setWidth] = useState<number | undefined>(undefined)
  const [height, setHeight] = useState<number | undefined>(undefined)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const initialDimensionsRef = useRef<{ width: number; left: number; height: number } | null>(null)
  const fixedLeftRef = useRef<number>(0) // Lưu left position khi bắt đầu fixed

  // Lưu kích thước và vị trí ban đầu - chỉ lưu một lần khi mount
  useLayoutEffect(() => {
    const saveInitialDimensions = () => {
      if (cardRef.current && containerRef.current && !initialDimensionsRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        // Lưu vị trí và kích thước ban đầu
        initialDimensionsRef.current = {
          width: rect.width,
          left: rect.left, // Left position ban đầu (từ viewport)
          height: rect.height
        }
        // Lưu vào ref để dùng khi fixed
        fixedLeftRef.current = rect.left
        setWidth(rect.width)
        setHeight(rect.height)
      }
    }

    // Đợi layout render xong - có thể cần delay nhiều hơn
    const timer = setTimeout(saveInitialDimensions, 200)
    // Gọi ngay để không bỏ lỡ
    const rafId = requestAnimationFrame(() => {
      saveInitialDimensions()
    })

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    // Tìm Content container (Ant Design Layout Content)
    const findContentContainer = (): HTMLElement | null => {
      let element: HTMLElement | null = containerRef.current
      while (element) {
        const parent = element.parentElement
        if (parent && parent.classList.contains('ant-layout-content')) {
          return parent as HTMLElement
        }
        element = parent
      }
      return null
    }

    const handleScroll = () => {
      if (!containerRef.current || !cardRef.current || !initialDimensionsRef.current) return

      const contentContainer = findContentContainer()
      if (!contentContainer) return

      const containerRect = containerRef.current.getBoundingClientRect()
      
      // Tính toán top offset: Header height + Content margin
      const header = document.querySelector('.ant-layout-header') as HTMLElement
      const headerHeight = header ? header.offsetHeight : 64
      const contentMarginTop = 24 // margin của Content
      const calculatedTopOffset = headerHeight + contentMarginTop

      // Khi container scroll ra khỏi viewport trên
      if (containerRect.top < calculatedTopOffset) {
        if (!isFixed) {
          // Chuyển sang fixed - sử dụng left position ban đầu đã lưu
          // Không lấy từ cardRect.left vì lúc này card có thể đã scroll
          setLeftOffset(initialDimensionsRef.current.left)
          fixedLeftRef.current = initialDimensionsRef.current.left
          setWidth(initialDimensionsRef.current.width)
          setHeight(initialDimensionsRef.current.height)
          setTopOffset(calculatedTopOffset)
          setIsFixed(true)
        }
        // Khi đã fixed, giữ nguyên left position (không cần update trong scroll)
      } else {
        // Quay lại normal position khi scroll lên lại
        if (isFixed) {
          setIsFixed(false)
          setWidth(undefined)
          setHeight(undefined)
          setLeftOffset(0)
          setTopOffset(0)
          fixedLeftRef.current = 0
        }
      }
    }

    const handleResize = () => {
      if (!containerRef.current || !cardRef.current) return

      // Nếu chưa fixed, recalculate initial dimensions (chỉ khi chưa có)
      if (!isFixed && !initialDimensionsRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        initialDimensionsRef.current = {
          width: rect.width,
          left: rect.left,
          height: rect.height
        }
        fixedLeftRef.current = rect.left
      }

      // Nếu đang fixed, cập nhật left position từ container
      // Nhưng chỉ khi window resize (không phải scroll)
      if (isFixed && containerRef.current && initialDimensionsRef.current) {
        // Khi resize, container position thay đổi, cần cập nhật left
        const containerRect = containerRef.current.getBoundingClientRect()
        // Tính left position mới dựa trên container position hiện tại
        // Nhưng vẫn giữ nguyên relative position với container
        const newLeft = containerRect.left
        fixedLeftRef.current = newLeft
        setLeftOffset(newLeft)
        
        // Có thể cần recalculate width nếu container width thay đổi
        // Nhưng giữ nguyên height từ initial
        const currentRect = cardRef.current.getBoundingClientRect()
        if (currentRect.width !== initialDimensionsRef.current.width) {
          // Nếu width thay đổi do resize, update initial nhưng giữ left
          initialDimensionsRef.current.width = currentRect.width
          setWidth(currentRect.width)
        } else {
          setWidth(initialDimensionsRef.current.width)
        }
        setHeight(initialDimensionsRef.current.height)
      }

      handleScroll()
    }

    const contentContainer = findContentContainer()

    // Lắng nghe scroll events
    if (contentContainer) {
      contentContainer.addEventListener('scroll', handleScroll, { passive: true })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })

    // Gọi ngay để set initial state
    handleScroll()

    return () => {
      if (contentContainer) {
        contentContainer.removeEventListener('scroll', handleScroll)
      }
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [isFixed])

  return (
    <div className='lg:col-span-1' ref={containerRef}>
      {/* Placeholder để giữ không gian khi fixed */}
      {isFixed && height && (
        <div 
          style={{ 
            height: `${height}px`, 
            width: width ? `${width}px` : '100%' 
          }} 
          aria-hidden='true' 
        />
      )}
      
      <div
        ref={cardRef}
        style={{
          position: isFixed ? 'fixed' : 'relative',
          top: isFixed ? `${topOffset}px` : 'auto',
          left: isFixed ? `${leftOffset}px` : 'auto',
          width: isFixed && width ? `${width}px` : '100%',
          zIndex: isFixed ? 100 : 'auto',
          transition: 'none',
          boxSizing: 'border-box'
        }}
      >
        <Card 
          className='border-green-100 shadow-lg'
          style={{
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <CardHeader className='bg-gradient-to-r from-green-100 to-emerald-100 border-t-2 border-b border-green-100 text-green-700 pt-4'>
            <CardTitle className='text-green-700 flex items-center gap-2'>
              <FileText className='w-5 h-5' />
              Xem trước trực tiếp
            </CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            <div 
              className='overflow-y-auto'
              style={{
                maxHeight: isFixed ? `calc(100vh - ${topOffset + 100}px)` : 'calc(100vh - 200px)',
                minHeight: '400px'
              }}
            >
              {children}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}