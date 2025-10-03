import React, { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import Loading from '../Loading/loading'


// Định nghĩa kiểu dữ liệu cho cửa hàng
interface Store {
  ID: string
  StoreName: string
  Province: string
  ProvinceID: number
  District: string
  DistrictID: number
  Ward: string
  WardID: number
  Address: string
  LogoURL: string | null
  CoverImageURL: string | null
  // Thêm các trường tọa độ
  lng?: number
  lat?: number
}

interface MapBoxByStoreProps {
  stores: Store[]
  onStoreSelect?: (store: Store) => void
}

const MapBoxByStore: React.FC<MapBoxByStoreProps> = ({ stores, onStoreSelect }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({})
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [storesWithCoordinates, setStoresWithCoordinates] = useState<Store[]>([])

  // Khởi tạo map
  useEffect(() => {
    if (map.current || !mapContainer.current) return

    // Lấy Mapbox token từ Vite environment variables
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
        center: [105.8542, 21.0285], // Hà Nội
        zoom: 5
      })

      map.current.on('load', () => {
        console.log('✅ Mapbox map đã load thành công!')
        map.current?.resize()
        setIsMapLoaded(true)
      })

      map.current.addControl(new mapboxgl.NavigationControl())

      // Kiểm tra map đã sẵn sàng ngay lập tức
      if (map.current.isStyleLoaded()) {
        setIsMapLoaded(true)
      }
    } catch (error) {
      console.error('❌ Lỗi khi khởi tạo Mapbox:', error)
    }

    return () => {
      // Xóa tất cả markers
      Object.values(markersRef.current).forEach(marker => marker.remove())
      markersRef.current = {}
      
      // Xóa map
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Geocoding function để tìm tọa độ của địa chỉ cửa hàng
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
        const storesPromises = stores.map(store => geocodeStoreAddress(store))
        const storesWithCoords = await Promise.all(storesPromises)
        setStoresWithCoordinates(storesWithCoords.filter(store => store.lng && store.lat))
      } catch (error) {
        console.error('❌ Lỗi khi geocoding các cửa hàng:', error)
      } finally {
        setIsLoading(false)
      }
    }

    geocodeAllStores()
  }, [isMapLoaded, stores, geocodeStoreAddress])

  // Thêm markers lên map
  useEffect(() => {
    if (!map.current || !storesWithCoordinates.length) return

    // Xóa tất cả markers hiện tại
    Object.values(markersRef.current).forEach(marker => marker.remove())
    markersRef.current = {}

    // Tạo bounds để fit map
    const bounds = new mapboxgl.LngLatBounds()

    // Thêm markers mới
    storesWithCoordinates.forEach(store => {
      if (!store.lng || !store.lat) return

      // Tạo element cho marker
      const el = document.createElement('div')
      el.className = 'store-marker'
      el.style.cssText = `
        width: 30px;
        height: 30px;
        background-color: ${selectedStoreId === store.ID ? '#f59e0b' : '#3b82f6'};
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
      `

      // Tạo popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-3">
          ${store.CoverImageURL ? `<img src="${store.CoverImageURL}" alt="${store.StoreName}" class="w-full h-16 object-cover rounded-md mb-2" />` : ''}
          <h3 class="font-semibold text-gray-900 text-lg">${store.StoreName}</h3>
          <p class="text-sm text-gray-600 mt-1">${store.Address}</p>
          <p class="text-sm text-gray-600">${store.Ward}, ${store.District}, ${store.Province}</p>
          ${store.LogoURL ? `<img src="${store.LogoURL}" alt="${store.StoreName}" class="w-16 h-16 object-cover rounded-full mt-2" />` : ''}
        </div>
      `)

      // Thêm marker vào map
      const marker = new mapboxgl.Marker(el)
        .setLngLat([store.lng, store.lat])
        .setPopup(popup)
        .addTo(map.current!)

      // Lưu marker vào ref
      markersRef.current[store.ID] = marker

      // Thêm sự kiện click cho marker
      el.addEventListener('click', () => {
        setSelectedStoreId(store.ID)
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
        padding: 50,
        maxZoom: 15
      })
    }
  }, [storesWithCoordinates, selectedStoreId, onStoreSelect])

  // Cập nhật marker khi chọn cửa hàng
  useEffect(() => {
    if (!map.current || !selectedStoreId) return

    // Cập nhật style cho tất cả markers
    Object.entries(markersRef.current).forEach(([storeId, marker]) => {
      const el = marker.getElement()
      el.style.backgroundColor = selectedStoreId === storeId ? '#f59e0b' : '#3b82f6'
    })

    // Tìm cửa hàng được chọn
    const selectedStore = storesWithCoordinates.find(store => store.ID === selectedStoreId)
    if (selectedStore && selectedStore.lng && selectedStore.lat) {
      // Fly to cửa hàng được chọn
      map.current.flyTo({
        center: [selectedStore.lng, selectedStore.lat],
        zoom: 15,
        essential: true
      })

      // Mở popup
      const marker = markersRef.current[selectedStoreId]
      if (marker) {
        marker.togglePopup()
      }
    }
  }, [selectedStoreId, storesWithCoordinates])

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-white bg-opacity-80 flex items-center justify-center">
          <Loading text="Đang tải bản đồ cửa hàng..." />
        </div>
      )}
      <div className="w-full h-full rounded-lg shadow-lg border border-gray-200" ref={mapContainer}></div>
    </div>
  )
}

export default MapBoxByStore