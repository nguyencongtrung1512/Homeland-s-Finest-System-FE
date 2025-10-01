import React, { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Button } from '../../components/ui/button'
import addressApi from '../../apis/address.api'

interface MapBoxGetLocationProps {
  onLocationConfirm: (locationData: {
    coordinates: [number, number]
    province: string
    provinceId: number
    district: string
    districtId: number
    ward: string
    wardId: number
    streetAddress: string
  }) => void
}

const MapBoxGetLocation: React.FC<MapBoxGetLocationProps> = ({ onLocationConfirm }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null)
  const [locationInfo, setLocationInfo] = useState<{
    province: string
    provinceId: number
    district: string
    districtId: number
    ward: string
    wardId: number
    streetAddress: string
  } | null>(null)

  // Khởi tạo map
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

        // Lấy vị trí hiện tại khi map đã load xong
        getCurrentLocation()
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

  // Lấy vị trí hiện tại
  const getCurrentLocation = useCallback(() => {
    if (!map.current) return

    setIsLoading(true)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { longitude, latitude } = position.coords
          const newCoordinates: [number, number] = [longitude, latitude]
          setCoordinates(newCoordinates)

          // Xóa marker cũ nếu có
          if (marker.current) {
            marker.current.remove()
          }

          // Tạo marker mới cho vị trí hiện tại
          const el = document.createElement('div')
          el.className = 'location-marker'
          el.style.cssText = `
            width: 30px;
            height: 30px;
            background-color: #3b82f6;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: move;
          `

          // Thêm marker vào map với khả năng kéo thả
          marker.current = new mapboxgl.Marker({
            element: el,
            draggable: true
          })
            .setLngLat(newCoordinates)
            .addTo(map.current as mapboxgl.Map)

          // Fly to location
          map.current.flyTo({
            center: newCoordinates,
            zoom: 15,
            essential: true
          })

          // Lấy thông tin địa chỉ từ tọa độ
          await reverseGeocode(newCoordinates)

          // Xử lý sự kiện khi kéo thả marker xong
          marker.current?.on('dragend', async () => {
            const lngLat = marker.current?.getLngLat()
            if (lngLat) {
              const newCoords: [number, number] = [lngLat.lng, lngLat.lat]
              setCoordinates(newCoords)
              await reverseGeocode(newCoords)
            }
          })

          setIsLoading(false)
        },
        (error) => {
          console.error('❌ Lỗi khi lấy vị trí hiện tại:', error)
          setIsLoading(false)

          // Fallback: Sử dụng vị trí mặc định (HCM)
          const defaultCoords: [number, number] = [106.6297, 10.8231]
          setCoordinates(defaultCoords)

          // Tạo marker mặc định
          const el = document.createElement('div')
          el.className = 'location-marker'
          el.style.cssText = `
            width: 30px;
            height: 30px;
            background-color: #3b82f6;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: move;
          `

          marker.current = new mapboxgl.Marker({
            element: el,
            draggable: true
          })
            .setLngLat(defaultCoords)
            .addTo(map.current as mapboxgl.Map)

          // Xử lý sự kiện khi kéo thả marker xong
          marker.current?.on('dragend', async () => {
            const lngLat = marker.current?.getLngLat()
            if (lngLat) {
              const newCoords: [number, number] = [lngLat.lng, lngLat.lat]
              setCoordinates(newCoords)
              await reverseGeocode(newCoords)
            }
          })

          reverseGeocode(defaultCoords)
        },
        { enableHighAccuracy: true }
      )
    } else {
      console.error('❌ Geolocation không được hỗ trợ bởi trình duyệt này')
      setIsLoading(false)
    }
  }, [])

  // Reverse geocoding để lấy thông tin địa chỉ từ tọa độ
  const reverseGeocode = async (coords: [number, number]) => {
    if (!coords) return

    try {
      setIsLoading(true)

      // Sử dụng Mapbox Geocoding API để lấy thông tin địa chỉ
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json?access_token=${mapboxgl.accessToken}&country=vn&limit=1`
      )
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const placeName = data.features[0].place_name
        console.log('✅ Đã tìm thấy địa chỉ:', placeName)

        // Phân tích thông tin địa chỉ từ placeName
        // Thông thường, placeName có dạng: "Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố, Việt Nam"
        const addressParts = placeName.split(', ')

        // Lấy thông tin tỉnh/thành phố, quận/huyện, phường/xã
        let provinceName = ''
        let districtName = ''
        let wardName = ''
        let streetAddress = ''

        if (addressParts.length >= 3) {
          // Tỉnh/Thành phố thường là phần tử thứ 2 từ cuối (trước "Việt Nam")
          provinceName = addressParts[addressParts.length - 2]

          // Quận/Huyện thường là phần tử thứ 3 từ cuối
          if (addressParts.length >= 4) {
            districtName = addressParts[addressParts.length - 3]
          }

          // Phường/Xã thường là phần tử thứ 4 từ cuối
          if (addressParts.length >= 5) {
            wardName = addressParts[addressParts.length - 4]
          }

          // Địa chỉ đường phố là các phần còn lại
          streetAddress = addressParts.slice(0, addressParts.length - 4).join(', ')
        }

        // Lấy thông tin provinceId, districtId, wardId từ GHN API
        try {
          // Lấy danh sách tỉnh/thành phố
          const provincesResponse = await addressApi.getProvinces()
          const provinces = provincesResponse.data

          // Tìm provinceId dựa trên tên tỉnh/thành phố
          const province = provinces.find(p =>
            provinceName.includes(p.ProvinceName) || p.ProvinceName.includes(provinceName)
          )

          if (province) {
            const provinceId = province.ProvinceID

            // Lấy danh sách quận/huyện dựa trên provinceId
            const districtsResponse = await addressApi.getDistricts(provinceId)
            const districts = districtsResponse.data

            // Tìm districtId dựa trên tên quận/huyện
            const district = districts.find(d =>
              districtName.includes(d.DistrictName) || d.DistrictName.includes(districtName)
            )

            if (district) {
              const districtId = district.DistrictID

              // Lấy danh sách phường/xã dựa trên districtId
              const wardsResponse = await addressApi.getWards(districtId)
              const wards = wardsResponse.data

              // Tìm wardId dựa trên tên phường/xã
              const ward = wards.find(w =>
                wardName.includes(w.WardName) || w.WardName.includes(wardName)
              )

              if (ward) {
                const wardId = parseInt(ward.WardCode)

                // Cập nhật thông tin địa chỉ
                setLocationInfo({
                  province: province.ProvinceName,
                  provinceId: provinceId,
                  district: district.DistrictName,
                  districtId: districtId,
                  ward: ward.WardName,
                  wardId: wardId,
                  streetAddress: streetAddress
                })
              } else {
                console.error('❌ Không tìm thấy phường/xã phù hợp')
              }
            } else {
              console.error('❌ Không tìm thấy quận/huyện phù hợp')
            }
          } else {
            console.error('❌ Không tìm thấy tỉnh/thành phố phù hợp')
          }
        } catch (error) {
          console.error('❌ Lỗi khi lấy thông tin địa chỉ từ GHN API:', error)
        }
      } else {
        console.error('❌ Không tìm thấy địa chỉ cho tọa độ:', coords)
      }
    } catch (error) {
      console.error('❌ Lỗi khi reverse geocoding:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Xác nhận vị trí
  const handleConfirmLocation = () => {
    if (coordinates && locationInfo) {
      onLocationConfirm({
        coordinates,
        ...locationInfo
      })
    }
  }

  return (
    <div className='w-full'>
      {!isMapLoaded && (
        <div className='text-center p-5 bg-gray-100 rounded-lg mb-4'>
          <div className='animate-pulse text-gray-600'>Đang tải bản đồ...</div>
        </div>
      )}

      {isLoading && (
        <div className='text-center p-3 bg-blue-50 rounded-lg mb-4'>
          <div className='animate-pulse text-blue-600'>Đang xử lý...</div>
        </div>
      )}

      <div className='w-full h-96 rounded-lg shadow-lg border border-gray-200 mb-4' ref={mapContainer}></div>

      {locationInfo && (
        <div className='bg-gray-50 p-4 rounded-lg mb-4'>
          <h3 className='font-semibold text-gray-900 mb-2'>Thông tin địa chỉ:</h3>
          <p className='text-sm text-gray-600 mb-1'>
            <span className='font-medium'>Tỉnh/Thành phố:</span> {locationInfo.province}
          </p>
          <p className='text-sm text-gray-600 mb-1'>
            <span className='font-medium'>Quận/Huyện:</span> {locationInfo.district}
          </p>
          <p className='text-sm text-gray-600 mb-1'>
            <span className='font-medium'>Phường/Xã:</span> {locationInfo.ward}
          </p>
          <p className='text-sm text-gray-600 mb-1'>
            <span className='font-medium'>Địa chỉ:</span> {locationInfo.streetAddress}
          </p>
          <p className='text-sm text-gray-600 mb-1'>
            <span className='font-medium'>Tọa độ:</span> {coordinates ? `${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}` : 'N/A'}
          </p>
        </div>
      )}

      <div className='flex gap-4'>
        <Button
          onClick={getCurrentLocation}
          variant="outline"
          className='flex-1'
          disabled={isLoading}
        >
          Lấy vị trí hiện tại
        </Button>
        <Button
          onClick={handleConfirmLocation}
          variant="default"
          className='flex-1'
          disabled={isLoading || !coordinates || !locationInfo}
        >
          Xác nhận vị trí
        </Button>
      </div>

      <div className='mt-4 text-sm text-gray-500'>
        <p>* Kéo thả marker để điều chỉnh vị trí chính xác</p>
      </div>
    </div>
  )
}

export default MapBoxGetLocation