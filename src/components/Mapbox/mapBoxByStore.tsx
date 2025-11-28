import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import Loading from '../Loading/loading'
import path from '../../constants/path'

// Định nghĩa kiểu dữ liệu cho cửa hàng
interface Store {
  ID: string
  StoreName: string
  Province: string
  ProvinceID: number | null
  District: string
  DistrictID: number | null
  Ward: string
  WardID: number | null
  Address: string
  LogoURL: string | null
  Description: string
  CoverImageURL: string | null
  lng?: number
  lat?: number
}

interface MapBoxByStoreProps {
  stores: Store[]
  onStoreSelect?: (store: Store) => void
  selectedStoreId?: string | null
  onStoreIdChange?: (storeId: string | null) => void
  hidePanel?: boolean
}

const MapBoxByStore: React.FC<MapBoxByStoreProps> = ({
  stores,
  onStoreSelect,
  selectedStoreId: externalSelectedStoreId,
  onStoreIdChange,
  hidePanel = false
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({})
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [storesWithCoordinates, setStoresWithCoordinates] = useState<Store[]>([])
  const [isPanelOpen, setIsPanelOpen] = useState(!hidePanel)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  // Sync với external state nếu có
  useEffect(() => {
    if (externalSelectedStoreId !== undefined) {
      setSelectedStoreId(externalSelectedStoreId)
    }
  }, [externalSelectedStoreId])

  // Khởi tạo map
  useEffect(() => {
    if (map.current || !mapContainer.current) return

    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

    if (!mapboxToken) {
      console.error('❌ Mapbox access token không được tìm thấy!')
      return
    }

    mapboxgl.accessToken = mapboxToken

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [105.8542, 21.0285],
        zoom: 5
      })

      map.current.on('load', () => {
        console.log('✅ Mapbox map đã load thành công!')
        map.current?.resize()
        setIsMapLoaded(true)
      })

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

      if (map.current.isStyleLoaded()) {
        setIsMapLoaded(true)
      }
    } catch (error) {
      console.error('❌ Lỗi khi khởi tạo Mapbox:', error)
    }

    return () => {
      Object.values(markersRef.current).forEach((marker) => marker.remove())
      markersRef.current = {}

      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Geocoding function
  const geocodeStoreAddress = useCallback(async (store: Store): Promise<Store> => {
    try {
      const fullAddress = `${store.Address}, ${store.Ward}, ${store.District}, ${store.Province}, Việt Nam`
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          fullAddress
        )}.json?access_token=${mapboxgl.accessToken}&country=vn&limit=1`
      )
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].geometry.coordinates as [number, number]
        return {
          ...store,
          lng: coordinates[0],
          lat: coordinates[1]
        }
      }
      return store
    } catch (error) {
      console.error(`❌ Lỗi khi geocoding địa chỉ của cửa hàng ${store.StoreName}:`, error)
      return store
    }
  }, [])

  // Geocoding tất cả các cửa hàng
  useEffect(() => {
    if (!isMapLoaded || !stores.length) return

    setIsLoading(true)

    const geocodeAllStores = async () => {
      try {
        const storesPromises = stores.map((store) => geocodeStoreAddress(store))
        const storesWithCoords = await Promise.all(storesPromises)
        setStoresWithCoordinates(storesWithCoords.filter((store) => store.lng && store.lat))
      } catch (error) {
        console.error('❌ Lỗi khi geocoding các cửa hàng:', error)
      } finally {
        setIsLoading(false)
      }
    }

    geocodeAllStores()
  }, [isMapLoaded, stores, geocodeStoreAddress])

  // Tạo custom marker element với thiết kế đẹp hơn
  const createMarkerElement = (store: Store, isSelected: boolean) => {
    const el = document.createElement('div')
    el.className = 'store-marker-container'

    // Tạo pin SVG với gradient và shadow
    el.innerHTML = `
      <div class="marker-wrapper" style="position: relative; cursor: pointer; transition: all 0.3s ease;">
        <svg width="35" height="45" viewBox="0 0 40 50" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.3));">
          <defs>
            <linearGradient id="gradient-${store.ID}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:${isSelected ? '#f59e0b' : '#3b82f6'};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${isSelected ? '#d97706' : '#1e40af'};stop-opacity:1" />
            </linearGradient>
          </defs>
          <!-- Pin shape -->
          <path d="M20 0 C9 0 0 9 0 20 C0 25 2 29 5 32 L20 50 L35 32 C38 29 40 25 40 20 C40 9 31 0 20 0 Z" 
                fill="url(#gradient-${store.ID})" 
                stroke="white" 
                stroke-width="2"/>
          <!-- Inner circle -->
          <circle cx="20" cy="18" r="7" fill="white" opacity="0.9"/>
          <!-- Store icon -->
          <g transform="translate(20, 18)">
            <path d="M -3.5 -1.5 L -3.5 3.5 L 3.5 3.5 L 3.5 -1.5 Z M -2.5 -3.5 L 2.5 -3.5 L 2.5 -1.5 L -2.5 -1.5 Z" 
                  fill="${isSelected ? '#f59e0b' : '#3b82f6'}" 
                  stroke="none"/>
          </g>
        </svg>
        ${isSelected ? '<div style="position: absolute; top: -4px; right: -4px; width: 10px; height: 10px; background: #ef4444; border: 2px solid white; border-radius: 50%; animation: pulse 2s infinite;"></div>' : ''}
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        .marker-wrapper:hover {
          transform: translateY(-4px) scale(1.08);
        }
      </style>
    `

    return el
  }

  // Thêm markers lên map
  useEffect(() => {
    if (!map.current || !storesWithCoordinates.length) return

    // Xóa tất cả markers hiện tại
    Object.values(markersRef.current).forEach((marker) => marker.remove())
    markersRef.current = {}

    // Tạo bounds để fit map
    const bounds = new mapboxgl.LngLatBounds()

    // Thêm markers mới
    storesWithCoordinates.forEach((store) => {
      if (!store.lng || !store.lat) return

      const isSelected = selectedStoreId === store.ID
      const el = createMarkerElement(store, isSelected)

      // Tạo popup với thiết kế đẹp hơn
      const popup = new mapboxgl.Popup({
        offset: 30,
        closeButton: true,
        closeOnClick: false,
        className: 'custom-popup'
      }).setHTML(`
        <div class="p-3 min-w-[220px] max-w-[280px]">
          <img src="${store.CoverImageURL || ''}" 
               alt="${store.StoreName}" 
               class="w-full h-28 object-cover rounded-lg mb-2 shadow-sm" 
               onerror="this.src='https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'" />
          <div class="flex items-start gap-2">
            <img src="${store.LogoURL || ''}" 
                 alt="${store.StoreName}" 
                 class="w-10 h-10 object-cover rounded-full border-2 border-gray-200 flex-shrink-0"
                 onerror="this.src='https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'" />
            <div class="flex-1 min-w-0"></div>
              <h3 class="store-name-link font-bold text-gray-900 text-base mb-1 leading-tight cursor-pointer hover:text-blue-600 transition-colors" data-store-id="${store.ID}">${store.StoreName}</h3>
              <p class="text-xs text-gray-600 mb-0.5 flex items-start gap-1">
                <svg class="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                
                <span class="line-clamp-2">${store.Address}</span>
              </p>
              <p class="text-1xl mb-0.5 flex items-start gap-1">
                <span class="line-clamp-2">${store.Description}</span>
              </p>
              <p class="text-xs text-gray-500">
                ${store.Ward}, ${store.District}
              </p>
            </div>
          </div>
        </div>
      `)

      // Thêm marker vào map
      const marker = new mapboxgl.Marker(el).setLngLat([store.lng, store.lat]).setPopup(popup).addTo(map.current!)

      // Lưu marker vào ref
      markersRef.current[store.ID] = marker

      // Thêm event listener cho store name trong popup sau khi popup được mở
      popup.on('open', () => {
        const popupContent = popup.getElement()
        if (popupContent) {
          const storeNameElement = popupContent.querySelector('.store-name-link')
          if (storeNameElement) {
            storeNameElement.addEventListener('click', (e) => {
              e.stopPropagation()
              const storePath = path.store.replace(':storeId', store.ID)
              navigate(storePath)
            })
          }
        }
      })

      // Thêm sự kiện click cho marker
      el.addEventListener('click', () => {
        setSelectedStoreId(store.ID)
        if (onStoreIdChange) {
          onStoreIdChange(store.ID)
        }
        if (onStoreSelect) {
          onStoreSelect(store)
        }
      })

      // Mở rộng bounds
      bounds.extend([store.lng, store.lat])
    })

    // Fit map to bounds nếu có ít nhất 1 marker
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: { top: 100, bottom: 100, left: isPanelOpen ? 370 : 100, right: 100 },
        maxZoom: 15
      })
    }
  }, [storesWithCoordinates, selectedStoreId, onStoreSelect, onStoreIdChange, isPanelOpen, navigate])

  // Cập nhật marker khi chọn cửa hàng
  useEffect(() => {
    if (!map.current || !selectedStoreId) return

    // Tìm cửa hàng được chọn
    const selectedStore = storesWithCoordinates.find((store) => store.ID === selectedStoreId)
    if (selectedStore && selectedStore.lng && selectedStore.lat) {
      // Di chuyển mượt mà đến cửa hàng (giữ nguyên zoom level hiện tại)
      map.current.easeTo({
        center: [selectedStore.lng, selectedStore.lat],
        padding: { left: isPanelOpen ? 350 : 0 },
        duration: 1000 // Animation 1 giây
      })

      // Mở popup
      const marker = markersRef.current[selectedStoreId]
      if (marker) {
        const popup = marker.getPopup()
        if (popup && !popup.isOpen()) {
          marker.togglePopup()
        }
      }
    }
  }, [selectedStoreId, storesWithCoordinates, isPanelOpen])

  // Filter stores dựa trên search query
  const filteredStores = storesWithCoordinates.filter(
    (store) =>
      store.StoreName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.Address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.Province.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.District.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStoreClick = (store: Store) => {
    setSelectedStoreId(store.ID)
    if (onStoreIdChange) {
      onStoreIdChange(store.ID)
    }
    if (onStoreSelect) {
      onStoreSelect(store)
    }
  }

  // Navigate to store page when clicking on store name
  const handleStoreNameClick = (storeId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering parent click event
    const storePath = path.store.replace(':storeId', storeId)
    navigate(storePath)
  }

  return (
    <div className='w-full h-full relative'>
      {/* Loading overlay */}
      {isLoading && (
        <div className='absolute inset-0 z-50 bg-white bg-opacity-90 flex items-center justify-center'>
          <Loading text='Đang tải bản đồ cửa hàng...' />
        </div>
      )}

      {/* Map container */}
      <div className='w-full h-full' ref={mapContainer}></div>

      {/* Store list panel - Overlay on map */}
      {!hidePanel && (
        <div
          className={`absolute top-0 left-0 h-full bg-white shadow-2xl border-r-4 border-green-600 transition-all duration-300 z-40 ${isPanelOpen ? 'w-80' : 'w-0'
            } overflow-hidden`}
        >
          <div className='h-full flex flex-col'>
            {/* Header */}
            <div className='bg-gradient-to-r from-green-600 to-green-700 text-white p-3 shadow-lg border-b-2 border-green-800'>
              <div className='flex items-center justify-between mb-2'>
                <h2 className='text-lg font-bold flex items-center gap-2'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                    />
                  </svg>
                  Danh sách cửa hàng
                </h2>
                <span className='bg-white text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold'>
                  {filteredStores.length}
                </span>
              </div>

              {/* Search box */}
              <div className='relative'>
                <input
                  type='text'
                  placeholder='Tìm kiếm...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full px-3 py-1.5 pl-9 rounded-lg text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400'
                />
                <svg
                  className='absolute left-2.5 top-2 w-4 h-4 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                  />
                </svg>
              </div>
            </div>

            {/* Store list */}
            <div className='flex-1 overflow-y-auto p-3 space-y-2'>
              {filteredStores.length === 0 ? (
                <div className='text-center py-6 text-gray-500'>
                  <svg
                    className='w-12 h-12 mx-auto mb-2 text-gray-300'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  <p className='text-sm'>Không tìm thấy cửa hàng</p>
                </div>
              ) : (
                filteredStores.map((store) => (
                  <div
                    key={store.ID}
                    onClick={() => handleStoreClick(store)}
                    className={`p-2.5 rounded-lg cursor-pointer transition-all duration-200 border-2 ${selectedStoreId === store.ID
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-400 shadow-md scale-[1.02]'
                      : 'bg-gray-50 border-transparent hover:bg-gray-100 hover:border-gray-200 hover:shadow'
                      }`}
                  >
                    <img
                      src={store.CoverImageURL || 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'}
                      alt={store.StoreName}
                      className='w-full h-20 object-cover rounded-md mb-2 shadow-sm'
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'
                      }}
                    />
                    <div className='flex items-start gap-2'>
                      <img
                        src={store.LogoURL || 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'}
                        alt={store.StoreName}
                        className='w-8 h-8 object-cover rounded-full border-2 border-white shadow-sm flex-shrink-0'
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'
                        }}
                      />
                      <div className='flex-1 min-w-0'>
                        <h3
                          className='font-semibold text-gray-900 text-sm truncate cursor-pointer hover:text-blue-600 transition-colors'
                          onClick={(e) => handleStoreNameClick(store.ID, e)}
                        >
                          {store.StoreName}
                        </h3>
                        <p className='text-gray-600 text-xs mt-0.5 line-clamp-1'>{store.Province}</p>
                        <p className='text-gray-600 text-xs mt-0.5 line-clamp-1'>{store.Address}</p>
                        <p className='text-gray-500 text-xs mt-0.5'>
                          {store.Ward}, {store.District}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      {!hidePanel && (
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className={`absolute top-4 z-50 bg-white hover:bg-gray-50 text-gray-700 p-2.5 rounded-lg shadow-xl transition-all duration-300 border-2 border-green-600 ${isPanelOpen ? 'left-[332px]' : 'left-4'
            }`}
          title={isPanelOpen ? 'Ẩn danh sách' : 'Hiện danh sách'}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${isPanelOpen ? 'rotate-180' : ''}`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
          </svg>
        </button>
      )}

      {/* Custom CSS for popup */}
      <style>{`
        .custom-popup .mapboxgl-popup-content {
          padding: 0;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .custom-popup .mapboxgl-popup-tip {
          border-top-color: white;
        }
      `}</style>
    </div>
  )
}

export default MapBoxByStore
