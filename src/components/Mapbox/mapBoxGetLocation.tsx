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

// Helper chuẩn hóa chuỗi tiếng Việt để so khớp tên địa lý ổn định hơn
const normalizeVietnamese = (str: string) =>
  str
    ? str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[.,]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    : ''

// Chuẩn hóa thêm cho tên tỉnh/thành, quận/huyện, phường/xã
const normalizeLocationString = (str: string) => {
  let s = normalizeVietnamese(str)

  // Đồng nhất các tiền tố "thành phố" / "tp", "quận" / "q", "huyện" / "h"
  s = s
    .replace(/\b(tp|thanh pho)\b/g, 'thanhpho')
    .replace(/\b(q|quan)\b/g, 'quan')
    .replace(/\b(h|huyen)\b/g, 'huyen')

  return s
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
        if (map.current) {
          getCurrentLocation()
        }
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
    if (!map.current) {
      console.error('❌ Map chưa được khởi tạo')
      return
    }

    setIsLoading(true)
    console.log('🔄 Đang lấy vị trí hiện tại...')

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log('✅ Đã lấy được vị trí hiện tại:', position.coords)
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
          map.current?.flyTo({
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

          // Hiển thị thông báo lỗi cụ thể
          let errorMessage = 'Không thể lấy vị trí hiện tại'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                'Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép truy cập vị trí trong cài đặt trình duyệt.'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Thông tin vị trí không khả dụng.'
              break
            case error.TIMEOUT:
              errorMessage = 'Yêu cầu lấy vị trí đã hết thời gian chờ.'
              break
          }

          alert(errorMessage)
          setIsLoading(false)

          // Fallback: Sử dụng vị trí mặc định (HCM)
          console.log('🔄 Sử dụng vị trí mặc định (HCM)')
          const defaultCoords: [number, number] = [106.809432, 10.841679]
          setCoordinates(defaultCoords)

          // Tạo marker mặc định
          const el = document.createElement('div')
          el.className = 'location-marker'
          el.style.cssText = `
            width: 15px;
            height: 30px;
            background-color: #3fd23a;
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
        {
          enableHighAccuracy: true,
          timeout: 10000, // 10 giây timeout
          maximumAge: 60000 // Cache trong 1 phút
        }
      )
    } else {
      console.error('❌ Geolocation không được hỗ trợ bởi trình duyệt này')
      alert('Trình duyệt của bạn không hỗ trợ tính năng lấy vị trí hiện tại.')
      setIsLoading(false)
    }
  }, [])

  // Reverse geocoding để lấy thông tin địa chỉ từ tọa độ
  const reverseGeocode = async (coords: [number, number]) => {
    if (!coords) return

    try {
      console.log('🔄 Đang lấy thông tin địa chỉ cho tọa độ:', coords)

      // Sử dụng Mapbox Geocoding API để lấy thông tin địa chỉ
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json?access_token=${mapboxgl.accessToken}&country=vn&limit=1`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('📍 Mapbox Geocoding response:', data)

      if (data.features && data.features.length > 0) {
        const placeName = data.features[0].place_name
        console.log('✅ Đã tìm thấy địa chỉ:', placeName)

        // Phân tích thông tin địa chỉ từ placeName
        // Mapbox có thể trả về: "Đường, Tên Phường/Xã, Mã Phường/Xã, Quận/Huyện, Tỉnh/Thành phố, Việt Nam"
        // Ví dụ: "Đường D1, Long Thạnh Mỹ, 71200, Quận 9, Ho Chi Minh City, Vietnam"
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

          // Xử lý Phường/Xã - Mapbox có thể trả về mã phường/xã (số) giữa tên phường và quận
          // Ví dụ: "Long Thạnh Mỹ, 71200, Quận 9" → cần lấy "Long Thạnh Mỹ" chứ không phải "71200"
          if (addressParts.length >= 5) {
            const potentialWardIndex = addressParts.length - 4
            const potentialWard = addressParts[potentialWardIndex]

            // Kiểm tra nếu phần tử này là mã phường/xã (chỉ chứa số, không có chữ)
            const isWardCode = /^\d+$/.test(potentialWard.trim())

            if (isWardCode) {
              // Nếu là mã phường, lấy phần trước đó làm tên phường
              if (addressParts.length >= 6) {
                wardName = addressParts[potentialWardIndex - 1]
                // Địa chỉ đường phố là các phần từ đầu đến trước tên phường
                streetAddress = addressParts.slice(0, potentialWardIndex - 1).join(', ')
              } else {
                // Nếu không có phần trước, dùng mã phường (fallback - ít xảy ra)
                wardName = potentialWard
                streetAddress = addressParts.slice(0, potentialWardIndex).join(', ')
              }
            } else {
              // Nếu không phải mã phường, đó là tên phường
              wardName = potentialWard
              // Địa chỉ đường phố là các phần còn lại
              streetAddress = addressParts.slice(0, potentialWardIndex).join(', ')
            }
          } else if (addressParts.length >= 4) {
            // Trường hợp không có phường/xã rõ ràng
            streetAddress = addressParts.slice(0, addressParts.length - 3).join(', ')
          }
        }

        console.log('📍 Phân tích địa chỉ:', { provinceName, districtName, wardName, streetAddress })

        // Mapping tên tỉnh/thành phố từ Mapbox sang GHN API
        const provinceMapping: { [key: string]: string } = {
          'Ho Chi Minh City': 'Thành phố Hồ Chí Minh',
          'Hồ Chí Minh': 'Thành phố Hồ Chí Minh',
          'Ho Chi Minh': 'Thành phố Hồ Chí Minh',
          'Hanoi': 'Hà Nội',
          'Hà Nội': 'Hà Nội',
          'Hanoi City': 'Hà Nội',
          'Da Nang': 'Đà Nẵng',
          'Đà Nẵng': 'Đà Nẵng',
          'Can Tho': 'Cần Thơ',
          'Cần Thơ': 'Cần Thơ',
          'Hai Phong': 'Hải Phòng',
          'Hải Phòng': 'Hải Phòng',
          'An Giang': 'An Giang',
          'Ba Ria - Vung Tau': 'Bà Rịa - Vũng Tàu',
          'Bà Rịa - Vũng Tàu': 'Bà Rịa - Vũng Tàu',
          'Bac Lieu': 'Bạc Liêu',
          'Bạc Liêu': 'Bạc Liêu',
          'Bac Kan': 'Bắc Kạn',
          'Bắc Kạn': 'Bắc Kạn',
          'Bac Giang': 'Bắc Giang',
          'Bắc Giang': 'Bắc Giang',
          'Bac Ninh': 'Bắc Ninh',
          'Bắc Ninh': 'Bắc Ninh',
          'Ben Tre': 'Bến Tre',
          'Bến Tre': 'Bến Tre',
          'Binh Dinh': 'Bình Định',
          'Bình Định': 'Bình Định',
          'Binh Duong': 'Bình Dương',
          'Bình Dương': 'Bình Dương',
          'Binh Phuoc': 'Bình Phước',
          'Bình Phước': 'Bình Phước',
          'Binh Thuan': 'Bình Thuận',
          'Bình Thuận': 'Bình Thuận',
          'Ca Mau': 'Cà Mau',
          'Cà Mau': 'Cà Mau',
          'Cao Bang': 'Cao Bằng',
          'Cao Bằng': 'Cao Bằng',
          'Dak Lak': 'Đắk Lắk',
          'Đắk Lắk': 'Đắk Lắk',
          'Dak Nong': 'Đắk Nông',
          'Đắk Nông': 'Đắk Nông',
          'Dien Bien': 'Điện Biên',
          'Điện Biên': 'Điện Biên',
          'Dong Nai': 'Đồng Nai',
          'Đồng Nai': 'Đồng Nai',
          'Dong Thap': 'Đồng Tháp',
          'Đồng Tháp': 'Đồng Tháp',
          'Gia Lai': 'Gia Lai',
          'Ha Giang': 'Hà Giang',
          'Hà Giang': 'Hà Giang',
          'Ha Nam': 'Hà Nam',
          'Hà Nam': 'Hà Nam',
          'Ha Tinh': 'Hà Tĩnh',
          'Hà Tĩnh': 'Hà Tĩnh',
          'Hau Giang': 'Hậu Giang',
          'Hậu Giang': 'Hậu Giang',
          'Hoa Binh': 'Hòa Bình',
          'Hòa Bình': 'Hòa Bình',
          'Hung Yen': 'Hưng Yên',
          'Hưng Yên': 'Hưng Yên',
          'Khanh Hoa': 'Khánh Hòa',
          'Khánh Hòa': 'Khánh Hòa',
          'Kien Giang': 'Kiên Giang',
          'Kiên Giang': 'Kiên Giang',
          'Kon Tum': 'Kon Tum',
          'Lai Chau': 'Lai Châu',
          'Lai Châu': 'Lai Châu',
          'Lam Dong': 'Lâm Đồng',
          'Lâm Đồng': 'Lâm Đồng',
          'Lang Son': 'Lạng Sơn',
          'Lạng Sơn': 'Lạng Sơn',
          'Lao Cai': 'Lào Cai',
          'Lào Cai': 'Lào Cai',
          'Long An': 'Long An',
          'Nam Dinh': 'Nam Định',
          'Nam Định': 'Nam Định',
          'Nghe An': 'Nghệ An',
          'Nghệ An': 'Nghệ An',
          'Ninh Binh': 'Ninh Bình',
          'Ninh Bình': 'Ninh Bình',
          'Ninh Thuan': 'Ninh Thuận',
          'Ninh Thuận': 'Ninh Thuận',
          'Phu Tho': 'Phú Thọ',
          'Phú Thọ': 'Phú Thọ',
          'Phu Yen': 'Phú Yên',
          'Phú Yên': 'Phú Yên',
          'Quang Binh': 'Quảng Bình',
          'Quảng Bình': 'Quảng Bình',
          'Quang Nam': 'Quảng Nam',
          'Quảng Nam': 'Quảng Nam',
          'Quang Ngai': 'Quảng Ngãi',
          'Quảng Ngãi': 'Quảng Ngãi',
          'Quang Ninh': 'Quảng Ninh',
          'Quảng Ninh': 'Quảng Ninh',
          'Quang Tri': 'Quảng Trị',
          'Quảng Trị': 'Quảng Trị',
          'Soc Trang': 'Sóc Trăng',
          'Sóc Trăng': 'Sóc Trăng',
          'Son La': 'Sơn La',
          'Sơn La': 'Sơn La',
          'Tay Ninh': 'Tây Ninh',
          'Tây Ninh': 'Tây Ninh',
          'Thai Binh': 'Thái Bình',
          'Thái Bình': 'Thái Bình',
          'Thai Nguyen': 'Thái Nguyên',
          'Thái Nguyên': 'Thái Nguyên',
          'Thanh Hoa': 'Thanh Hóa',
          'Thanh Hóa': 'Thanh Hóa',
          'Thua Thien Hue': 'Thừa Thiên Huế',
          'Thừa Thiên Huế': 'Thừa Thiên Huế',
          'Tien Giang': 'Tiền Giang',
          'Tiền Giang': 'Tiền Giang',
          'Tra Vinh': 'Trà Vinh',
          'Trà Vinh': 'Trà Vinh',
          'Tuyen Quang': 'Tuyên Quang',
          'Tuyên Quang': 'Tuyên Quang',
          'Vinh Long': 'Vĩnh Long',
          'Vĩnh Long': 'Vĩnh Long',
          'Vinh Phuc': 'Vĩnh Phúc',
          'Vĩnh Phúc': 'Vĩnh Phúc',
          'Yen Bai': 'Yên Bái',
          'Yên Bái': 'Yên Bái'
        }

        // Áp dụng mapping cho provinceName
        const mappedProvinceName = provinceMapping[provinceName] || provinceName
        console.log('🔄 Mapping province:', provinceName, '→', mappedProvinceName)

        // Mapping tên quận/huyện từ Mapbox sang GHN API
        const districtMapping: { [key: string]: string } = {
          'Thu Duc': 'Thành phố Thủ Đức',
          'Thủ Đức': 'Thành phố Thủ Đức',
          'Thu Duc City': 'Thành phố Thủ Đức',
          'District 1': 'Quận 1',
          'Quận 1': 'Quận 1',
          'District 2': 'Quận 2',
          'Quận 2': 'Quận 2',
          'District 3': 'Quận 3',
          'Quận 3': 'Quận 3',
          'District 4': 'Quận 4',
          'Quận 4': 'Quận 4',
          'District 5': 'Quận 5',
          'Quận 5': 'Quận 5',
          'District 6': 'Quận 6',
          'Quận 6': 'Quận 6',
          'District 7': 'Quận 7',
          'Quận 7': 'Quận 7',
          'District 8': 'Quận 8',
          'Quận 8': 'Quận 8',
          'District 9': 'Quận 9',
          'Quận 9': 'Quận 9',
          'District 10': 'Quận 10',
          'Quận 10': 'Quận 10',
          'District 11': 'Quận 11',
          'Quận 11': 'Quận 11',
          'District 12': 'Quận 12',
          'Quận 12': 'Quận 12',
          'Binh Thanh': 'Quận Bình Thạnh',
          'Quận Bình Thạnh': 'Quận Bình Thạnh',
          'Tan Binh': 'Quận Tân Bình',
          'Quận Tân Bình': 'Quận Tân Bình',
          'Tan Phu': 'Quận Tân Phú',
          'Quận Tân Phú': 'Quận Tân Phú',
          'Phu Nhuan': 'Quận Phú Nhuận',
          'Quận Phú Nhuận': 'Quận Phú Nhuận',
          'Go Vap': 'Quận Gò Vấp',
          'Quận Gò Vấp': 'Quận Gò Vấp',
          'Binh Tan': 'Quận Bình Tân',
          'Quận Bình Tân': 'Quận Bình Tân',
          'Hoc Mon': 'Huyện Hóc Môn',
          'Huyện Hóc Môn': 'Huyện Hóc Môn',
          'Cu Chi': 'Huyện Củ Chi',
          'Huyện Củ Chi': 'Huyện Củ Chi',
          'Nha Be': 'Huyện Nhà Bè',
          'Huyện Nhà Bè': 'Huyện Nhà Bè',
          'Can Gio': 'Huyện Cần Giờ',
          'Huyện Cần Giờ': 'Huyện Cần Giờ'
        }

        // Áp dụng mapping cho districtName
        const mappedDistrictName = districtMapping[districtName] || districtName
        console.log('🔄 Mapping district:', districtName, '→', mappedDistrictName)

        // Mapping tên phường/xã từ Mapbox sang GHN API
        const wardMapping: { [key: string]: string } = {
          'Linh Trung': 'Phường Linh Trung',
          'Phường Linh Trung': 'Phường Linh Trung',
          'Linh Chieu': 'Phường Linh Chiểu',
          'Phường Linh Chiểu': 'Phường Linh Chiểu',
          'Linh Dong': 'Phường Linh Đông',
          'Phường Linh Đông': 'Phường Linh Đông',
          'Linh Tay': 'Phường Linh Tây',
          'Phường Linh Tây': 'Phường Linh Tây',
          'Linh Xuan': 'Phường Linh Xuân',
          'Phường Linh Xuân': 'Phường Linh Xuân',
          'Tam Binh': 'Phường Tam Bình',
          'Phường Tam Bình': 'Phường Tam Bình',
          'Tam Phu': 'Phường Tam Phú',
          'Phường Tam Phú': 'Phường Tam Phú',
          'Hiep Binh Chanh': 'Phường Hiệp Bình Chánh',
          'Phường Hiệp Bình Chánh': 'Phường Hiệp Bình Chánh',
          'Hiep Binh Phuoc': 'Phường Hiệp Bình Phước',
          'Phường Hiệp Bình Phước': 'Phường Hiệp Bình Phước',
          'Thu Duc': 'Phường Thủ Đức',
          'Phường Thủ Đức': 'Phường Thủ Đức',
          'Binh Tho': 'Phường Bình Thọ',
          'Phường Bình Thọ': 'Phường Bình Thọ',
          'Binh Chieu': 'Phường Bình Chiểu',
          'Phường Bình Chiểu': 'Phường Bình Chiểu',
          'Binh An': 'Phường Bình An',
          'Phường Bình An': 'Phường Bình An',
          'Binh Duong': 'Phường Bình Dương',
          'Phường Bình Dương': 'Phường Bình Dương',
          'Binh Khanh': 'Phường Bình Khánh',
          'Phường Bình Khánh': 'Phường Bình Khánh',
          'Binh Minh': 'Phường Bình Minh',
          'Phường Bình Minh': 'Phường Bình Minh',
          'Binh Nghia': 'Phường Bình Nghĩa',
          'Phường Bình Nghĩa': 'Phường Bình Nghĩa',
          'Binh Phu': 'Phường Bình Phú',
          'Phường Bình Phú': 'Phường Bình Phú',
          'Binh Quoi': 'Phường Bình Quới',
          'Phường Bình Quới': 'Phường Bình Quới',
          'Binh Trung': 'Phường Bình Trung',
          'Phường Bình Trung': 'Phường Bình Trung',
          'Binh Yen': 'Phường Bình Yên',
          'Phường Bình Yên': 'Phường Bình Yên'
        }

        // Áp dụng mapping cho wardName
        const mappedWardName = wardMapping[wardName] || wardName
        console.log('🔄 Mapping ward:', wardName, '→', mappedWardName)

        // Lấy thông tin provinceId, districtId, wardId từ GHN API
        try {
          // Lấy danh sách tỉnh/thành phố
          const provincesResponse = await addressApi.getProvinces()
          const provinces = Array.isArray(provincesResponse) ? provincesResponse : provincesResponse.data

          const normalizedMappedProvince = normalizeLocationString(mappedProvinceName)

          // Tìm provinceId dựa trên tên tỉnh/thành phố đã được mapping (không phân biệt dấu, cách viết)
          const province = provinces.find((p) => {
            const normProvince = normalizeLocationString(p.ProvinceName)
            return (
              normProvince === normalizedMappedProvince ||
              normProvince.includes(normalizedMappedProvince) ||
              normalizedMappedProvince.includes(normProvince)
            )
          })

          if (province) {
            console.log('✅ Tìm thấy tỉnh/thành phố:', province.ProvinceName)
            const provinceId = province.ProvinceID

            // Lấy danh sách quận/huyện dựa trên provinceId
            const districtsResponse = await addressApi.getDistricts(provinceId)
            const districts = Array.isArray(districtsResponse) ? districtsResponse : districtsResponse.data

            const normalizedMappedDistrict = normalizeLocationString(mappedDistrictName)

            // Tìm districtId dựa trên tên quận/huyện đã được mapping (không phân biệt dấu, cách viết)
            const district = districts.find((d) => {
              const normDistrict = normalizeLocationString(d.DistrictName)
              return (
                normDistrict === normalizedMappedDistrict ||
                normDistrict.includes(normalizedMappedDistrict) ||
                normalizedMappedDistrict.includes(normDistrict)
              )
            })

            if (district) {
              console.log('✅ Tìm thấy quận/huyện:', district.DistrictName)
              const districtId = district.DistrictID

              // Lấy danh sách phường/xã dựa trên districtId
              const wardsResponse = await addressApi.getWards(districtId)
              const wards = Array.isArray(wardsResponse) ? wardsResponse : wardsResponse.data

              const normalizedMappedWard = normalizeLocationString(mappedWardName)

              // Tìm wardId dựa trên tên phường/xã đã được mapping (không phân biệt dấu, cách viết)
              const ward = wards.find((w) => {
                const normWard = normalizeLocationString(w.WardName)
                return (
                  normWard === normalizedMappedWard ||
                  normWard.includes(normalizedMappedWard) ||
                  normalizedMappedWard.includes(normWard)
                )
              })

              if (ward) {
                console.log('✅ Tìm thấy phường/xã:', ward.WardName)
                const wardId = parseInt(ward.WardCode)

                // Cập nhật thông tin địa chỉ
                const locationData = {
                  province: province.ProvinceName,
                  provinceId: provinceId,
                  district: district.DistrictName,
                  districtId: districtId,
                  ward: ward.WardName,
                  wardId: wardId,
                  streetAddress: streetAddress
                }

                setLocationInfo(locationData)
                console.log('✅ Đã cập nhật thông tin địa chỉ:', locationData)
              } else {
                console.warn('⚠️ Không tìm thấy phường/xã phù hợp:', mappedWardName)
                // Không tự chọn phường fallback để tránh sai lệch – giữ wardId = 0
                setLocationInfo({
                  province: province.ProvinceName,
                  provinceId: provinceId,
                  district: district.DistrictName,
                  districtId: districtId,
                  ward: mappedWardName || 'Không xác định',
                  wardId: 0,
                  streetAddress: streetAddress
                })
              }
            } else {
              console.warn('⚠️ Không tìm thấy quận/huyện phù hợp:', mappedDistrictName)
              // Không tự chọn quận/huyện fallback – giữ districtId = 0
              setLocationInfo({
                province: province.ProvinceName,
                provinceId: provinceId,
                district: mappedDistrictName || 'Không xác định',
                districtId: 0,
                ward: mappedWardName || 'Không xác định',
                wardId: 0,
                streetAddress: streetAddress
              })
            }
          } else {
            console.warn('⚠️ Không tìm thấy tỉnh/thành phố phù hợp:', mappedProvinceName)
            // Không tự chọn province fallback – giữ provinceId = 0
            setLocationInfo({
              province: mappedProvinceName || 'Không xác định',
              provinceId: 0,
              district: mappedDistrictName || 'Không xác định',
              districtId: 0,
              ward: mappedWardName || 'Không xác định',
              wardId: 0,
              streetAddress: streetAddress
            })
          }
        } catch (error) {
          console.error('❌ Lỗi khi lấy thông tin địa chỉ từ GHN API:', error)
          // Fallback: Set thông tin cơ bản
          setLocationInfo({
            province: mappedProvinceName || 'Không xác định',
            provinceId: 0,
            district: mappedDistrictName || 'Không xác định',
            districtId: 0,
            ward: mappedWardName || 'Không xác định',
            wardId: 0,
            streetAddress: streetAddress
          })
        }
      } else {
        console.error('❌ Không tìm thấy địa chỉ cho tọa độ:', coords)
        // Fallback: Sử dụng thông tin từ Mapbox nếu có
        setLocationInfo({
          province: 'Không xác định',
          provinceId: 0,
          district: 'Không xác định',
          districtId: 0,
          ward: 'Không xác định',
          wardId: 0,
          streetAddress: 'Địa chỉ không xác định'
        })
      }
    } catch (error) {
      console.error('❌ Lỗi khi reverse geocoding:', error)
      // Fallback: Set thông tin cơ bản từ Mapbox
      setLocationInfo({
        province: 'Không xác định',
        provinceId: 0,
        district: 'Không xác định',
        districtId: 0,
        ward: 'Không xác định',
        wardId: 0,
        streetAddress: 'Địa chỉ không xác định'
      })
    }
  }

  // Xác nhận vị trí
  const handleConfirmLocation = () => {
    if (coordinates && locationInfo) {
      // Kiểm tra xem có đầy đủ ID không
      if (locationInfo.provinceId > 0 && locationInfo.districtId > 0 && locationInfo.wardId > 0) {
        console.log('✅ Đầy đủ thông tin địa chỉ với ID:', locationInfo)
        onLocationConfirm({
          coordinates,
          ...locationInfo
        })
      } else {
        console.warn('⚠️ Thiếu thông tin ID:', locationInfo)
        alert('Thông tin địa chỉ chưa đầy đủ. Vui lòng thử lại hoặc chọn vị trí khác.')
      }
    } else {
      console.warn('⚠️ Chưa có tọa độ hoặc thông tin địa chỉ')
      alert('Vui lòng lấy vị trí hiện tại trước khi xác nhận.')
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
          <div className='animate-pulse text-blue-600'>
            {coordinates ? 'Đang lấy thông tin địa chỉ...' : 'Đang lấy vị trí hiện tại...'}
          </div>
        </div>
      )}

      <div className='w-full h-96 rounded-lg shadow-lg border border-gray-200 mb-4' ref={mapContainer}></div>

      {locationInfo && (
        <div className='bg-green-50 border border-green-200 p-4 rounded-lg mb-4'>
          <h3 className='font-semibold text-green-900 mb-2 flex items-center'>
            <span className='mr-2'>📍</span>
            Thông tin địa chỉ đã lấy được:
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-2 text-sm'>
            <p className='text-green-700'>
              <span className='font-medium'>Tỉnh/Thành phố:</span> {locationInfo.province}
            </p>
            <p className='text-green-700'>
              <span className='font-medium'>Quận/Huyện:</span> {locationInfo.district}
            </p>
            <p className='text-green-700'>
              <span className='font-medium'>Phường/Xã:</span> {locationInfo.ward}
            </p>
            <p className='text-green-700'>
              <span className='font-medium'>Địa chỉ:</span> {locationInfo.streetAddress}
            </p>
            <p className='text-green-700 col-span-2'>
              <span className='font-medium'>Tọa độ:</span>{' '}
              {coordinates ? `${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}` : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {coordinates && !locationInfo && !isLoading && (
        <div className='bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4'>
          <p className='text-yellow-700 text-sm'>
            ⚠️ Đã lấy được tọa độ nhưng chưa lấy được thông tin địa chỉ. Vui lòng thử lại hoặc kéo thả marker đến vị trí
            khác.
          </p>
        </div>
      )}

      {locationInfo &&
        (locationInfo.provinceId === 0 || locationInfo.districtId === 0 || locationInfo.wardId === 0) && (
          <div className='bg-orange-50 border border-orange-200 p-4 rounded-lg mb-4'>
            <p className='text-orange-700 text-sm'>
              ⚠️ Đã lấy được thông tin địa chỉ nhưng thiếu một số ID. Vui lòng thử lại hoặc chọn vị trí khác để có đầy
              đủ thông tin.
            </p>
            <div className='mt-2 text-xs text-orange-600'>
              <p>
                ProvinceId: {locationInfo.provinceId} | DistrictId: {locationInfo.districtId} | WardId:{' '}
                {locationInfo.wardId}
              </p>
            </div>
          </div>
        )}

      <div className='flex gap-4'>
        <Button onClick={getCurrentLocation} variant='outline' className='flex-1' disabled={isLoading}>
          Lấy vị trí hiện tại
        </Button>
        <Button
          onClick={handleConfirmLocation}
          variant='green'
          className='flex-1'
          disabled={
            isLoading ||
            !coordinates ||
            !locationInfo ||
            !(locationInfo.provinceId > 0 && locationInfo.districtId > 0 && locationInfo.wardId > 0)
          }
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
