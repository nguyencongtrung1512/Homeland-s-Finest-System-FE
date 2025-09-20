import React, { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapComponentProps {
  storeAddress: string
  storeName?: string
}

const MapComponent: React.FC<MapComponentProps> = ({ storeAddress, storeName }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    // Lấy Mapbox token từ Vite environment variables
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

    if (!mapboxToken) {
      console.error(
        '❌ Mapbox access token không được tìm thấy! Vui lòng kiểm tra file .env và đảm bảo có VITE_MAPBOX_ACCESS_TOKEN'
      )
      return
    }

    mapboxgl.accessToken = mapboxToken

    console.log('Đang khởi tạo Mapbox...')
    console.log('Container element:', mapContainer.current)
    console.log('Access token loaded:', mapboxToken ? 'Yes' : 'No')

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/trungtrun/cmfo6rabb00ct01sdgggw33eq',
        center: [106.6297, 10.8231], // HCM
        zoom: 12
      })

      map.current.on('load', () => {
        console.log('✅ Mapbox map đã load thành công!')
        map.current?.resize()
        setIsMapLoaded(true)
      })

      // Fallback: Set loaded state sau 2 giây nếu load event không fire
      setTimeout(() => {
        if (map.current && !isMapLoaded) {
          console.log('⚠️ Fallback: Set map loaded state')
          setIsMapLoaded(true)
        }
      }, 2000)

      map.current.on('error', (e) => {
        console.error('❌ Mapbox error:', e)
      })

      map.current.addControl(new mapboxgl.NavigationControl())

      console.log('Map instance created:', map.current)

      // Kiểm tra map đã sẵn sàng ngay lập tức
      if (map.current.isStyleLoaded()) {
        console.log('✅ Map style đã load sẵn!')
        setIsMapLoaded(true)
      }
    } catch (error) {
      console.error('❌ Lỗi khi khởi tạo Mapbox:', error)
    }

    return () => {
      if (marker.current) {
        marker.current.remove()
        marker.current = null
      }
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [isMapLoaded])

  // Geocoding function để tìm tọa độ của địa chỉ cửa hàng
  const geocodeStoreAddress = useCallback(
    async (address: string) => {
      if (!map.current || !address) return

      setIsGeocoding(true)
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            address
          )}.json?access_token=${mapboxgl.accessToken}&country=vn&limit=1`
        )
        const data = await response.json()

        if (data.features && data.features.length > 0) {
          const coordinates = data.features[0].geometry.coordinates as [number, number]
          const placeName = data.features[0].place_name

          // Xóa marker cũ nếu có
          if (marker.current) {
            marker.current.remove()
          }

          // Tạo marker mới cho cửa hàng
          const el = document.createElement('div')
          el.className = 'store-marker'
          el.style.cssText = `
          width: 30px;
          height: 30px;
          background-color: #3b82f6;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
        `

          // Thêm marker vào map
          marker.current = new mapboxgl.Marker(el)
            .setLngLat(coordinates)
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div class="p-2">
                <h3 class="font-semibold text-gray-900">${storeName || 'Cửa hàng'}</h3>
                <p class="text-sm text-gray-600">${placeName}</p>
              </div>
            `)
            )
            .addTo(map.current)

          // Fly to location
          map.current.flyTo({
            center: coordinates,
            zoom: 15,
            essential: true
          })

          console.log('✅ Đã tìm thấy vị trí cửa hàng:', placeName, coordinates)
        } else {
          console.error('❌ Không tìm thấy địa chỉ cửa hàng:', address)
        }
      } catch (error) {
        console.error('❌ Lỗi khi geocoding địa chỉ:', error)
      } finally {
        setIsGeocoding(false)
      }
    },
    [storeName]
  )

  // Geocoding khi map load xong và có địa chỉ
  useEffect(() => {
    if (isMapLoaded && storeAddress && map.current) {
      geocodeStoreAddress(storeAddress)
    }
  }, [isMapLoaded, storeAddress, geocodeStoreAddress])

  return (
    <div className='w-full'>
      {!isMapLoaded && (
        <div className='text-center p-5 bg-gray-100 rounded-lg mb-4'>
          <div className='animate-pulse text-gray-600'>Đang tải bản đồ...</div>
        </div>
      )}

      {isGeocoding && (
        <div className='text-center p-3 bg-blue-50 rounded-lg mb-4'>
          <div className='animate-pulse text-blue-600'>Đang tìm vị trí cửa hàng...</div>
        </div>
      )}

      <div className='w-full h-96 rounded-lg shadow-lg border border-gray-200' ref={mapContainer}></div>
    </div>
  )
}

export default MapComponent
