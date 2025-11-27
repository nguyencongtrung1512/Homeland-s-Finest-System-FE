'use client'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { storeApi, type StoreResponse } from '../../../apis/store.api'
import Loading from '../../../components/Loading/loading'
import path from '../../../constants/path'

const StoreLogoItem: React.FC<{ store: StoreResponse; onClick: () => void; isPaused?: boolean }> = ({
  store,
  onClick,
  isPaused = false
}) => {
  const defaultLogo = 'https://i.pinimg.com/736x/5d/bf/f2/5dbff2b4c0fdcb9815e989f0db386f95.jpg'
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className='flex-shrink-0 flex justify-center items-center bg-white border border-gray-200 rounded-2xl text-white cursor-pointer transition-all duration-300 overflow-hidden relative'
      style={{
        width: 'var(--item-width)',
        aspectRatio: '1 / 1.2',
        marginRight: 'var(--item-gap)',
        animation: `marquee-move var(--speed) linear infinite var(--direction)`,
        animationPlayState: isPaused || isHovered ? 'paused' : 'running',
        boxShadow: isHovered
          ? '0 0 20px rgba(34, 197, 94, 0.8), 0 0 40px rgba(34, 197, 94, 0.6), 0 0 60px rgba(34, 197, 94, 0.4)'
          : 'none',
        borderColor: isHovered ? 'rgb(34, 197, 94)' : 'rgb(229, 231, 235)',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        zIndex: isHovered ? 10 : 1
      }}
    >
      <img
        src={store.logoUrl || defaultLogo}
        alt={store.storeName}
        className='w-full h-full object-cover'
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.onerror = null
          target.src = defaultLogo
        }}
      />
      {isHovered && (
        <div className='absolute inset-0 bg-green-500/10 flex items-center justify-center'>
          <span className='text-green-600 font-semibold text-sm px-2 py-1 bg-white/90 rounded-md'>
            {store.storeName}
          </span>
        </div>
      )}
    </div>
  )
}

function ListStore() {
  const navigate = useNavigate()
  const [stores, setStores] = useState<StoreResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // We need to inject the keyframes animation into the document's head
  React.useEffect(() => {
    const styleSheet = document.createElement('style')
    styleSheet.innerText = `
      @keyframes marquee-move {
        to {
          transform: translateX(calc(-100cqw - var(--item-gap)));
        }
      }
    `
    document.head.appendChild(styleSheet)
    return () => {
      document.head.removeChild(styleSheet)
    }
  }, [])

  useEffect(() => {
    async function fetchStores() {
      try {
        setLoading(true)
        setError(null)
        const response = await storeApi.getAllStores({
          pageSize: 20,
          pageNumber: 1
        })

        // Filter only approved stores
        const approvedStores =
          response.data?.filter(
            (store) => store.status === 'Approved' || store.status === 'Active' || store.status === 'ApprovedByStaff'
          ) || []

        setStores(approvedStores)
      } catch (err) {
        console.error('Error fetching stores:', err)
        setError('Không thể tải danh sách cửa hàng')
      } finally {
        setLoading(false)
      }
    }

    fetchStores()
  }, [])

  const handleStoreClick = (storeId: string) => {
    navigate(path.store.replace(':storeId', storeId))
  }

  const Marquee = ({ stores, direction = 'forwards' }: { stores: StoreResponse[]; direction?: string }) => {
    const [isPaused, setIsPaused] = useState(false)

    if (stores.length === 0) return null

    const numItems = stores.length
    const speed = '30s'
    const itemWidth = '150px'
    const itemGap = '20px'

    return (
      <div
        className='max-w-full overflow-hidden'
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={
          {
            '--speed': speed,
            '--numItems': numItems,
            '--item-width': itemWidth,
            '--item-gap': itemGap,
            '--direction': direction,
            maskImage: 'linear-gradient(to right, transparent, black 2rem, black calc(100% - 2rem), transparent)'
          } as React.CSSProperties
        }
      >
        <div
          className='w-max flex'
          style={
            {
              '--track-width': `calc(var(--item-width) * ${numItems})`,
              '--track-gap': `calc(var(--item-gap) * ${numItems})`
            } as React.CSSProperties
          }
        >
          {[...stores, ...stores].map((store, index) => (
            <StoreLogoItem
              key={`${store.id}-${index}`}
              store={store}
              onClick={() => handleStoreClick(store.id)}
              isPaused={isPaused}
            />
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className='max-w-7xl mx-auto px-6 py-12'>
        <div className='flex justify-center items-center py-16'>
          <Loading />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='max-w-7xl mx-auto px-6 py-12'>
        <div className='text-center py-16 text-red-600'>{error}</div>
      </div>
    )
  }

  if (stores.length === 0) {
    return (
      <div className='max-w-7xl mx-auto px-6 py-12'>
        <div className='text-center py-16 text-gray-500'>Chưa có cửa hàng nào</div>
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto px-6 py-12'>
      {/* Tiêu đề */}
      <div className='mb-8 text-center'>
        <h2 className='text-3xl font-bold text-green-800 mb-2'>Các Cửa Hàng Đối Tác</h2>
        <p className='text-gray-600'>Khám phá những cửa hàng uy tín và chất lượng</p>
      </div>

      {/* Marquee */}
      <div className='items-center overflow-hidden'>
        <div className='w-full max-w-6xl mx-auto flex flex-col gap-y-8'>
          <Marquee stores={stores} />
          <Marquee stores={stores} direction='reverse' />
        </div>
      </div>
    </div>
  )
}

export default ListStore
