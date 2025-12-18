import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import Loading from '../Loading/loading'
import path from '../../constants/path'
import { storeApi, type StoreProductItemDTO } from '../../apis/store.api'

// Định nghĩa kiểu dữ liệu cho cửa hàng
interface Store {
  ID: string
  StoreName: string
  Province: string
  District: string
  Ward: string
  Address: string
  LogoURL: string | null
  Description: string
  CoverImageURL: string | null
  lng?: number
  lat?: number
  provinceId?: number | null
  targetProvinceId?: number | null
}

interface MapBoxByStoreProps {
  stores: Store[]
  onStoreSelect?: (store: Store) => void
  selectedStoreId?: string | null
  onStoreIdChange?: (storeId: string | null) => void
  hidePanel?: boolean
  userLocation?: { lng: number; lat: number } | null
  radiusKm?: number
  zoomToUserLocation?: boolean
  onStoresWithCoordinatesLoaded?: (stores: Store[]) => void // Callback khi đã geocode xong stores
  limitToRadius?: boolean // Nếu true, chỉ hiển thị marker trong bán kính radiusKm quanh userLocation
  visibleStoreIds?: string[] // Danh sách storeId cần hiển thị (sync với list bên trái)
}

const MapBoxByStore: React.FC<MapBoxByStoreProps> = ({
  stores,
  onStoreSelect,
  selectedStoreId: externalSelectedStoreId,
  onStoreIdChange,
  hidePanel = false,
  userLocation = null,
  radiusKm = 100,
  zoomToUserLocation = false,
  onStoresWithCoordinatesLoaded,
  limitToRadius = false,
  visibleStoreIds
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({})
  const userLocationMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [storesWithCoordinates, setStoresWithCoordinates] = useState<Store[]>([])
  const [isPanelOpen, setIsPanelOpen] = useState(!hidePanel)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  // State để cache preview sản phẩm/combo theo storeId
  const [storePreviewCache, setStorePreviewCache] = useState<{
    [storeId: string]: { products: StoreProductItemDTO[]; combos: StoreProductItemDTO[] }
  }>({})
  const [storePreviewLoading, setStorePreviewLoading] = useState<{ [storeId: string]: boolean }>({})
  const cacheRef = useRef<{ [storeId: string]: { products: StoreProductItemDTO[]; combos: StoreProductItemDTO[] } }>({})
  const loadingRef = useRef<{ [storeId: string]: boolean }>({})

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
    // Nếu đã có toạ độ từ backend thì dùng luôn, không gọi Mapbox Geocoding nữa
    if (store.lat != null && store.lng != null) {
      console.log('📍 [GEOCODE] Skip, dùng toạ độ từ backend:', {
        storeId: store.ID,
        storeName: store.StoreName,
        lat: store.lat,
        lng: store.lng
      })
      return store
    }

    try {
      const fullAddress = `${store.Address}, ${store.Ward}, ${store.District}, ${store.Province}, Việt Nam`

      console.log('📍 [GEOCODE] Bắt đầu geocode:', {
        storeId: store.ID,
        storeName: store.StoreName,
        originalAddress: store.Address,
        ward: store.Ward,
        district: store.District,
        province: store.Province,
        fullAddress: fullAddress
      })

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          fullAddress
        )}.json?access_token=${mapboxgl.accessToken}&country=vn&limit=1`
      )
      const data = await response.json()

      console.log('📍 [GEOCODE] Mapbox response:', {
        storeId: store.ID,
        storeName: store.StoreName,
        fullAddress: fullAddress,
        responseData: data,
        featuresCount: data.features?.length || 0
      })

      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].geometry.coordinates as [number, number]
        const placeName = data.features[0].place_name

        console.log('✅ [GEOCODE] Thành công:', {
          storeId: store.ID,
          storeName: store.StoreName,
          originalAddress: store.Address,
          mapboxPlaceName: placeName,
          coordinates: coordinates,
          lng: coordinates[0],
          lat: coordinates[1]
        })

        return {
          ...store,
          lng: coordinates[0],
          lat: coordinates[1]
        }
      } else {
        console.warn('⚠️ [GEOCODE] Không tìm thấy kết quả:', {
          storeId: store.ID,
          storeName: store.StoreName,
          fullAddress: fullAddress
        })
        return store
      }
    } catch (error) {
      console.error(`❌ [GEOCODE] Lỗi khi geocoding địa chỉ của cửa hàng ${store.StoreName}:`, {
        storeId: store.ID,
        storeName: store.StoreName,
        error: error
      })
      return store
    }
  }, [])

  // Geocoding tất cả các cửa hàng
  useEffect(() => {
    if (!isMapLoaded || !stores.length) return

    setIsLoading(true)

    const geocodeAllStores = async () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7dd65070-5a76-435b-8591-8105b696a5a2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H3',
          location: 'mapBoxByStore.tsx:geocodeAllStores',
          message: 'geocode all start',
          data: { stores: stores.length },
          timestamp: Date.now()
        })
      }).catch(() => { })
      // #endregion
      try {
        console.log('🔄 [GEOCODE ALL] Bắt đầu geocode tất cả stores, tổng số:', stores.length)
        console.log('🔄 [GEOCODE ALL] Danh sách stores:', stores.map(s => ({
          id: s.ID,
          name: s.StoreName,
          address: s.Address,
          ward: s.Ward,
          district: s.District,
          province: s.Province
        })))

        const storesPromises = stores.map((store) => geocodeStoreAddress(store))
        const storesWithCoords = await Promise.all(storesPromises)
        const validStores = storesWithCoords.filter((store) => store.lng && store.lat)

        console.log('✅ [GEOCODE ALL] Hoàn thành geocode:', {
          total: stores.length,
          valid: validStores.length,
          invalid: stores.length - validStores.length,
          validStores: validStores.map(s => ({
            id: s.ID,
            name: s.StoreName,
            address: s.Address,
            coordinates: [s.lng, s.lat]
          })),
          invalidStores: storesWithCoords
            .filter((store) => !store.lng || !store.lat)
            .map(s => ({
              id: s.ID,
              name: s.StoreName,
              address: s.Address
            }))
        })

        setStoresWithCoordinates(validStores)
        // Gọi callback để trả về stores đã có coordinates
        if (onStoresWithCoordinatesLoaded) {
          onStoresWithCoordinatesLoaded(validStores)
        }
      } catch (error) {
        console.error('❌ [GEOCODE ALL] Lỗi khi geocoding các cửa hàng:', error)
      } finally {
        setIsLoading(false)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7dd65070-5a76-435b-8591-8105b696a5a2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'pre-fix',
            hypothesisId: 'H3',
            location: 'mapBoxByStore.tsx:geocodeAllStores',
            message: 'geocode all end',
            data: { valid: storesWithCoordinates.length },
            timestamp: Date.now()
          })
        }).catch(() => { })
        // #endregion
      }
    }

    geocodeAllStores()
  }, [isMapLoaded, stores, geocodeStoreAddress, onStoresWithCoordinatesLoaded])

  // Tạo custom marker element với thiết kế đẹp hơn
  const createMarkerElement = (store: Store, isSelected: boolean, markerColor: 'blue' | 'green') => {
    const el = document.createElement('div')
    el.className = 'store-marker-container'

    // Tạo pin SVG với gradient và shadow
    el.innerHTML = `
      <div class="marker-wrapper" style="position: relative; cursor: pointer; transition: all 0.3s ease;">
        <svg width="35" height="45" viewBox="0 0 40 50" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.3));">
          <defs>
            <linearGradient id="gradient-${store.ID}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:${markerColor === 'green' ? (isSelected ? '#16a34a' : '#22c55e') : isSelected ? '#2563eb' : '#3b82f6'
      };stop-opacity:1" />
              <stop offset="100%" style="stop-color:${markerColor === 'green' ? (isSelected ? '#15803d' : '#16a34a') : isSelected ? '#1d4ed8' : '#1e40af'
      };stop-opacity:1" />
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
                  fill="${markerColor === 'green' ? (isSelected ? '#16a34a' : '#22c55e') : isSelected ? '#2563eb' : '#3b82f6'}" 
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

  // Hàm tính khoảng cách giữa 2 điểm (Haversine) để filter theo bán kính
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Hàm helper để format giá tiền
  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }, [])

  // Hàm helper để render popup HTML với preview products/combos
  const renderPopupHTML = useCallback((
    store: Store,
    previewData?: { products: StoreProductItemDTO[]; combos: StoreProductItemDTO[] },
    isLoading?: boolean
  ): string => {
    const preview = previewData || { products: [], combos: [] }
    const hasPreview = preview.products.length > 0 || preview.combos.length > 0
    const displayProducts = preview.products.slice(0, 2)
    const displayCombos = preview.combos.slice(0, 1)

    return `
        <div class="store-popup-card">
          <!-- Cover Image -->
          <div class="store-popup-cover">
            <img src="${store.CoverImageURL || ''}" 
                 alt="${store.StoreName}" 
                 class="store-popup-cover-img" 
                 onerror="this.src='https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'" />
          </div>
          
          <!-- Content -->
          <div class="store-popup-content">
            <!-- Header with Avatar and Title -->
            <div class="store-popup-header">
              <div class="store-popup-avatar-wrapper">
                <img src="${store.LogoURL || ''}" 
                     alt="${store.StoreName}" 
                     class="store-popup-avatar"
                     onerror="this.src='https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'" />
              </div>
              <div class="store-popup-title-wrapper">
                <h3 class="store-name-link store-popup-title" data-store-id="${store.ID}">
                  ${store.StoreName}
                </h3>
              </div>
            </div>
            
            <!-- Description -->
            ${store.Description
        ? `
              <p class="store-popup-description">
                ${store.Description}
              </p>
            `
        : ''
      }
            
            <!-- Location Info -->
            <div class="store-popup-location">
              <div class="store-popup-location-item">
                <svg class="store-popup-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span class="store-popup-location-text">${store.Address}</span>
              </div>
            </div>

            <!-- Preview Products/Combos Section -->
            ${isLoading
        ? `
              <div class="store-popup-preview-loading">
                <p class="store-popup-preview-loading-text">Đang tải sản phẩm...</p>
              </div>
            `
        : hasPreview
          ? `
              <div class="store-popup-preview">
                <h4 class="store-popup-preview-title">Sản phẩm nổi bật</h4>
                <div class="store-popup-preview-grid">
                  ${displayProducts
            .map(
              (product) => `
                    <div class="store-popup-preview-item" data-product-id="${product.id}" data-product-type="Product">
                      <div class="store-popup-preview-item-image-wrapper">
                        <img src="${product.imageUrl || 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'}" 
                             alt="${product.name}" 
                             class="store-popup-preview-item-image"
                             onerror="this.src='https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'" />
                      </div>
                      <div class="store-popup-preview-item-info">
                        <p class="store-popup-preview-item-name" title="${product.name}">${product.name}</p>
                        <p class="store-popup-preview-item-price">${formatPrice(product.price)}</p>
                      </div>
                    </div>
                  `
            )
            .join('')}
                  ${displayCombos
            .map(
              (combo) => `
                    <div class="store-popup-preview-item store-popup-preview-item-combo" data-product-id="${combo.id}" data-product-type="Combo">
                      <div class="store-popup-preview-item-badge">Combo</div>
                      <div class="store-popup-preview-item-image-wrapper">
                        <img src="${combo.imageUrl || 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'}" 
                             alt="${combo.name}" 
                             class="store-popup-preview-item-image"
                             onerror="this.src='https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'" />
                      </div>
                      <div class="store-popup-preview-item-info">
                        <p class="store-popup-preview-item-name" title="${combo.name}">${combo.name}</p>
                        <p class="store-popup-preview-item-price">${formatPrice(combo.price)}</p>
                      </div>
                    </div>
                  `
            )
            .join('')}
                </div>
              </div>
            `
          : ''
      }
          </div>
        </div>
      `
  }, [formatPrice])

  // Hàm load preview sản phẩm/combo cho một cửa hàng
  const loadStorePreviewProducts = useCallback(async (storeId: string) => {
    // Nếu đã có cache hoặc đang loading thì không load lại
    if (cacheRef.current[storeId] || loadingRef.current[storeId]) {
      return
    }

    // Set loading state
    loadingRef.current[storeId] = true
    setStorePreviewLoading((prev) => ({ ...prev, [storeId]: true }))

    try {
      // Load 2 sản phẩm và 1 combo song song
      const [productsResponse, combosResponse] = await Promise.all([
        storeApi.getStoreProducts(storeId, {
          productType: 'Product',
          pageSize: 2,
          pageNumber: 1
        }),
        storeApi.getStoreProducts(storeId, {
          productType: 'Combo',
          pageSize: 1,
          pageNumber: 1
        })
      ])

      // Cache kết quả vào ref và state
      const previewData = {
        products: productsResponse.data || [],
        combos: combosResponse.data || []
      }
      cacheRef.current[storeId] = previewData
      setStorePreviewCache((prev) => ({
        ...prev,
        [storeId]: previewData
      }))
    } catch (error) {
      console.error(`Error loading preview products for store ${storeId}:`, error)
      // Cache empty array nếu lỗi
      const emptyData = { products: [], combos: [] }
      cacheRef.current[storeId] = emptyData
      setStorePreviewCache((prev) => ({
        ...prev,
        [storeId]: emptyData
      }))
    } finally {
      // Remove loading state
      loadingRef.current[storeId] = false
      setStorePreviewLoading((prev) => {
        const newState = { ...prev }
        delete newState[storeId]
        return newState
      })
    }
  }, [])

  // Thêm markers lên map
  useEffect(() => {
    if (!map.current || !storesWithCoordinates.length) return

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7dd65070-5a76-435b-8591-8105b696a5a2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H4',
        location: 'mapBoxByStore.tsx:useEffect markers',
        message: 'render markers',
        data: {
          storesWithCoordinates: storesWithCoordinates.length,
          limitToRadius: limitToRadius,
          userLocation: !!userLocation,
          visibleStoreIds: visibleStoreIds ? visibleStoreIds.length : null
        },
        timestamp: Date.now()
      })
    }).catch(() => { })
    // #endregion

    // Nếu limitToRadius = true và có userLocation + radiusKm thì chỉ lấy store trong bán kính
    let storesToRender = storesWithCoordinates
    if (limitToRadius && userLocation && radiusKm) {
      storesToRender = storesWithCoordinates.filter((store) => {
        if (!store.lat || !store.lng) return false
        const distance = calculateDistanceKm(userLocation.lat, userLocation.lng, store.lat, store.lng)
        return distance <= radiusKm
      })
    }

    // Nếu có visibleStoreIds thì chỉ hiển thị những storeId nằm trong danh sách này
    if (visibleStoreIds && visibleStoreIds.length > 0) {
      const idSet = new Set(visibleStoreIds)
      storesToRender = storesToRender.filter((store) => idSet.has(store.ID))
    }

    if (!storesToRender.length) {
      // Không có store nào thỏa điều kiện thì xóa hết marker và thoát
      Object.values(markersRef.current).forEach((marker) => marker.remove())
      markersRef.current = {}
      return
    }

    // Xóa tất cả markers hiện tại
    Object.values(markersRef.current).forEach((marker) => marker.remove())
    markersRef.current = {}

    // Tạo bounds để fit map
    const bounds = new mapboxgl.LngLatBounds()

    // Thêm markers mới
    console.log('🗺️ [MARKERS] Bắt đầu thêm markers, tổng số:', storesToRender.length)

    storesToRender.forEach((store) => {
      if (!store.lng || !store.lat) {
        console.warn('⚠️ [MARKERS] Store không có tọa độ:', {
          storeId: store.ID,
          storeName: store.StoreName,
          address: store.Address
        })
        return
      }

      console.log('📍 [MARKERS] Thêm marker:', {
        storeId: store.ID,
        storeName: store.StoreName,
        address: store.Address,
        ward: store.Ward,
        district: store.District,
        province: store.Province,
        coordinates: [store.lng, store.lat],
        fullAddress: `${store.Address}, ${store.Ward}, ${store.District}, ${store.Province}`
      })

      const isSelected = selectedStoreId === store.ID
      // Xác định màu marker theo logic đặc sản địa phương / khác vùng
      // provinceId === targetProvinceId → màu xanh lá (đặc sản địa phương)
      // provinceId !== targetProvinceId → màu xanh dương (đặc sản khác vùng)
      const markerColor: 'blue' | 'green' =
        store.provinceId != null && store.targetProvinceId != null && store.provinceId === store.targetProvinceId
          ? 'green'
          : 'blue'

      const el = createMarkerElement(store, isSelected, markerColor)

      // Tạo popup với thiết kế đẹp hơn, giống card thông tin
      const popup = new mapboxgl.Popup({
        offset: 30,
        closeButton: true,
        closeOnClick: false,
        className: 'custom-popup',
        maxWidth: '320px'
      }).setHTML(renderPopupHTML(store))

      // Thêm marker vào map
      const marker = new mapboxgl.Marker(el).setLngLat([store.lng, store.lat]).setPopup(popup).addTo(map.current!)

      // Lưu marker vào ref
      markersRef.current[store.ID] = marker

      // Sự kiện khi popup được mở
      popup.on('open', () => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7dd65070-5a76-435b-8591-8105b696a5a2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'pre-fix',
            hypothesisId: 'H6',
            location: 'mapBoxByStore.tsx:popup open',
            message: 'popup open',
            data: { storeId: store.ID },
            timestamp: Date.now()
          })
        }).catch(() => { })
        // #endregion
        // Set selected store để sync với panel bên trái
        setSelectedStoreId(store.ID)
        if (onStoreIdChange) {
          onStoreIdChange(store.ID)
        }
        if (onStoreSelect) {
          onStoreSelect(store)
        }

        // Đảm bảo chỉ có 1 popup mở: đóng các popup khác
        Object.values(markersRef.current).forEach((m) => {
          const p = m.getPopup()
          if (p && p !== popup) {
            p.remove()
          }
        })

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

          // Load preview products/combo khi popup mở
          loadStorePreviewProducts(store.ID)
        }
      })

      // Sự kiện khi popup bị đóng
      popup.on('close', () => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7dd65070-5a76-435b-8591-8105b696a5a2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'pre-fix',
            hypothesisId: 'H7',
            location: 'mapBoxByStore.tsx:popup close',
            message: 'popup close',
            data: { storeId: store.ID },
            timestamp: Date.now()
          })
        }).catch(() => { })
        // #endregion
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
  }, [
    storesWithCoordinates,
    isPanelOpen,
    navigate,
    limitToRadius,
    userLocation,
    radiusKm,
    loadStorePreviewProducts,
    renderPopupHTML,
    visibleStoreIds
  ])

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
          // Đóng mọi popup khác trước khi mở popup mới
          Object.values(markersRef.current).forEach((m) => {
            const p = m.getPopup()
            if (p && p !== popup) {
              p.remove()
            }
          })
          popup.addTo(map.current!)
        }
      }
    }
  }, [selectedStoreId, storesWithCoordinates, isPanelOpen])

  // Cập nhật popup HTML khi cache preview thay đổi
  useEffect(() => {
    if (!map.current) return

    // Update popup HTML cho tất cả markers đang mở
    Object.keys(markersRef.current).forEach((storeId) => {
      const marker = markersRef.current[storeId]
      const popup = marker?.getPopup()
      if (popup && popup.isOpen()) {
        const store = storesWithCoordinates.find((s) => s.ID === storeId)
        if (store) {
          const previewData = storePreviewCache[storeId]
          const isLoading = storePreviewLoading[storeId]
          popup.setHTML(renderPopupHTML(store, previewData, isLoading))

          // Re-attach event listeners sau khi update HTML
          const popupContent = popup.getElement()
          if (popupContent) {
            const storeNameElement = popupContent.querySelector('.store-name-link')
            if (storeNameElement) {
              storeNameElement.addEventListener('click', (e) => {
                e.stopPropagation()
                const storePath = path.store.replace(':storeId', storeId)
                navigate(storePath)
              })
            }
          }
        }
      }
    })
  }, [storePreviewCache, storePreviewLoading, storesWithCoordinates, navigate, renderPopupHTML])

  // Helper function để tạo circle geometry
  const createCircle = useCallback((center: [number, number], radiusMeters: number, points: number): [number, number][] => {
    const circle: [number, number][] = []
    for (let i = 0; i <= points; i++) {
      const angle = (i * 360) / points
      const dx = radiusMeters * Math.cos((angle * Math.PI) / 180)
      const dy = radiusMeters * Math.sin((angle * Math.PI) / 180)

      // Chuyển đổi mét sang độ (xấp xỉ)
      const latOffset = dy / 111320 // 1 độ lat ≈ 111320 mét
      const lngOffset = dx / (111320 * Math.cos((center[1] * Math.PI) / 180))

      circle.push([center[0] + lngOffset, center[1] + latOffset])
    }
    return circle
  }, [])

  // Helper function để tính zoom level phù hợp với bán kính
  const calculateZoomForRadius = useCallback((radiusKm: number): number => {
    // Công thức xấp xỉ để tính zoom level dựa trên bán kính
    if (radiusKm >= 500) return 5
    if (radiusKm >= 200) return 6
    if (radiusKm >= 100) return 7
    if (radiusKm >= 50) return 8
    if (radiusKm >= 20) return 9
    if (radiusKm >= 10) return 10
    if (radiusKm >= 5) return 11
    return 12
  }, [])

  // Hiển thị vị trí người dùng và vòng tròn bán kính
  useEffect(() => {
    if (!map.current || !isMapLoaded) return

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7dd65070-5a76-435b-8591-8105b696a5a2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H5',
        location: 'mapBoxByStore.tsx:userLocation effect',
        message: 'user location effect',
        data: { hasUserLocation: !!userLocation, radiusKm },
        timestamp: Date.now()
      })
    }).catch(() => { })
    // #endregion

    // Xóa marker cũ nếu có
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.remove()
      userLocationMarkerRef.current = null
    }

    // Xóa layer và source cũ nếu có
    if (map.current.getLayer('radius-circle-border')) {
      map.current.removeLayer('radius-circle-border')
    }
    if (map.current.getLayer('radius-circle')) {
      map.current.removeLayer('radius-circle')
    }
    if (map.current.getSource('radius-circle')) {
      map.current.removeSource('radius-circle')
    }

    if (!userLocation) return

    // Tạo marker cho vị trí người dùng
    const userMarkerEl = document.createElement('div')
    userMarkerEl.className = 'user-location-marker'
    userMarkerEl.innerHTML = `
      <div style="position: relative; width: 30px; height: 30px;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); z-index: 10;"></div>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 30px; height: 30px; background: rgba(59, 130, 246, 0.2); border-radius: 50%; animation: pulse 2s infinite;"></div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.5; }
        }
      </style>
    `

    userLocationMarkerRef.current = new mapboxgl.Marker(userMarkerEl)
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current)

    // Tính toán bán kính theo mét (Mapbox sử dụng mét)
    const radiusMeters = radiusKm * 1000

    // Tạo circle geometry
    const circle = createCircle([userLocation.lng, userLocation.lat], radiusMeters, 64)

    // Thêm source và layer cho vòng tròn
    map.current.addSource('radius-circle', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [circle]
        }
      }
    })

    map.current.addLayer({
      id: 'radius-circle',
      type: 'fill',
      source: 'radius-circle',
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.1
      }
    })

    map.current.addLayer({
      id: 'radius-circle-border',
      type: 'line',
      source: 'radius-circle',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 2,
        'line-opacity': 0.5,
        'line-dasharray': [2, 2]
      }
    })

    // Nếu cần zoom đến vị trí người dùng
    if (zoomToUserLocation) {
      // Tính zoom level phù hợp với bán kính
      const zoomLevel = calculateZoomForRadius(radiusKm)
      map.current.easeTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: zoomLevel,
        duration: 1500
      })
    }

    return () => {
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove()
        userLocationMarkerRef.current = null
      }
      if (map.current) {
        if (map.current.getLayer('radius-circle-border')) {
          map.current.removeLayer('radius-circle-border')
        }
        if (map.current.getLayer('radius-circle')) {
          map.current.removeLayer('radius-circle')
        }
        if (map.current.getSource('radius-circle')) {
          map.current.removeSource('radius-circle')
        }
      }
    }
  }, [userLocation, radiusKm, zoomToUserLocation, isMapLoaded, createCircle, calculateZoomForRadius])

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
                      src={
                        store.CoverImageURL ||
                        'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'
                      }
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
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
          overflow: hidden;
          background: white;
          max-width: 320px;
          width: 100%;
        }
        
        .custom-popup .mapboxgl-popup-tip {
          border-top-color: white;
        }
        
        .custom-popup .mapboxgl-popup-close-button {
          width: 28px;
          height: 28px;
          font-size: 18px;
          color: rgba(0,0,0,0.6);
          background: rgba(255,255,255,0.9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 10;
        }
        
        .custom-popup .mapboxgl-popup-close-button:hover {
          background: rgba(255,255,255,1);
          color: rgba(0,0,0,0.8);
          transform: scale(1.1);
        }
        
        /* Store Popup Card Styles */
        .store-popup-card {
          width: 100%;
          background: white;
          overflow: hidden;
        }
        
        /* Cover Image */
        .store-popup-cover {
          width: 100%;
          height: 180px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .store-popup-cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        
        .store-popup-cover:hover .store-popup-cover-img {
          transform: scale(1.05);
        }
        
        /* Content */
        .store-popup-content {
          padding: 16px;
        }
        
        /* Header with Avatar */
        .store-popup-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .store-popup-avatar-wrapper {
          position: relative;
          flex-shrink: 0;
        }
        
        .store-popup-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          margin-top: -28px;
          background: white;
          position: relative;
          z-index: 1;
        }
        
        .store-popup-title-wrapper {
          flex: 1;
          min-width: 0;
          padding-top: 4px;
        }
        
        .store-popup-title {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
          line-height: 1.3;
          cursor: pointer;
          transition: color 0.2s ease;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .store-popup-title:hover {
          color: #3b82f6;
        }
        
        /* Description */
        .store-popup-description {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.5;
          margin: 0 0 12px 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* Location */
        .store-popup-location {
          border-top: 1px solid #e5e7eb;
          padding-top: 12px;
        }
        
        .store-popup-location-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 6px;
        }
        
        .store-popup-icon {
          width: 16px;
          height: 16px;
          color: #6b7280;
          flex-shrink: 0;
          margin-top: 2px;
        }
        
        .store-popup-location-text {
          font-size: 13px;
          color: #374151;
          line-height: 1.4;
          flex: 1;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .store-popup-location-detail {
          font-size: 12px;
          color: #9ca3af;
          margin-left: 24px;
          line-height: 1.4;
        }

        /* Preview Products/Combos Section */
        .store-popup-preview {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .store-popup-preview-title {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 12px 0;
        }

        .store-popup-preview-loading {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }

        .store-popup-preview-loading-text {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
        }

        .store-popup-preview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .store-popup-preview-item {
          position: relative;
          background: #f9fafb;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid #e5e7eb;
        }

        .store-popup-preview-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          border-color: #3b82f6;
        }

        .store-popup-preview-item-combo {
          border-color: #f97316;
        }

        .store-popup-preview-item-combo:hover {
          border-color: #ea580c;
        }

        .store-popup-preview-item-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #f97316;
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          z-index: 1;
          text-transform: uppercase;
        }

        .store-popup-preview-item-image-wrapper {
          width: 100%;
          height: 70px;
          overflow: hidden;
          background: #e5e7eb;
        }

        .store-popup-preview-item-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .store-popup-preview-item-info {
          padding: 6px 8px;
        }

        .store-popup-preview-item-name {
          font-size: 11px;
          font-weight: 500;
          color: #1f2937;
          margin: 0 0 4px 0;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          min-height: 26px;
        }

        .store-popup-preview-item-price {
          font-size: 12px;
          font-weight: 600;
          color: #3b82f6;
          margin: 0;
        }

        .store-popup-preview-item-combo .store-popup-preview-item-price {
          color: #f97316;
        }
        
        /* Responsive */
        @media (max-width: 640px) {
          .custom-popup .mapboxgl-popup-content {
            max-width: 280px;
          }
          
          .store-popup-cover {
            height: 160px;
          }
          
          .store-popup-avatar {
            width: 48px;
            height: 48px;
            margin-top: -24px;
          }
          
          .store-popup-title {
            font-size: 16px;
          }
          
          .store-popup-content {
            padding: 14px;
          }
        }
        
        @media (max-width: 480px) {
          .custom-popup .mapboxgl-popup-content {
            max-width: 240px;
          }
          
          .store-popup-cover {
            height: 140px;
          }
          
          .store-popup-avatar {
            width: 44px;
            height: 44px;
            margin-top: -22px;
          }
          
          .store-popup-title {
            font-size: 15px;
          }
          
          .store-popup-description {
            font-size: 13px;
            -webkit-line-clamp: 2;
          }
        }
      `}</style>
    </div>
  )
}

export default MapBoxByStore
