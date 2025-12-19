/**
 * Utility functions for geocoding using Mapbox API
 */

// Cache để lưu kết quả geocode theo provinceName
const geocodeCache: Map<string, { lat: number; lng: number }> = new Map()

/**
 * Geocode province name to coordinates using Mapbox API
 * @param provinceName - Tên tỉnh/thành phố
 * @returns Promise với tọa độ {lat, lng} hoặc null nếu thất bại
 */
export const geocodeProvinceName = async (provinceName: string): Promise<{ lat: number; lng: number } | null> => {
  if (!provinceName || provinceName.trim() === '') {
    return null
  }

  // Kiểm tra cache trước
  const cached = geocodeCache.get(provinceName.trim())
  if (cached) {
    return cached
  }

  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
  if (!mapboxToken) {
    console.error('Mapbox access token không được tìm thấy')
    return null
  }

  try {
    // Thêm "Việt Nam" vào query để tăng độ chính xác
    const query = `${provinceName}, Việt Nam`
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=vn&limit=1`

    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Geocode API error: ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const coordinates = data.features[0].center // [lng, lat]
      const result = {
        lat: coordinates[1],
        lng: coordinates[0]
      }

      // Lưu vào cache
      geocodeCache.set(provinceName.trim(), result)
      return result
    }

    return null
  } catch (error) {
    console.error('Error geocoding province name:', error)
    return null
  }
}

/**
 * Geocode store address to coordinates
 * @param address - Địa chỉ đầy đủ của cửa hàng
 * @returns Promise với tọa độ {lat, lng} hoặc null nếu thất bại
 */
export const geocodeStoreAddress = async (
  address: string,
  province?: string,
  district?: string,
  ward?: string
): Promise<{ lat: number; lng: number } | null> => {
  if (!address || address.trim() === '') {
    return null
  }

  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
  if (!mapboxToken) {
    console.error('Mapbox access token không được tìm thấy')
    return null
  }

  try {
    // Tạo query đầy đủ với địa chỉ
    let query = address
    if (ward) query += `, ${ward}`
    if (district) query += `, ${district}`
    if (province) query += `, ${province}`
    query += ', Việt Nam'

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=vn&limit=1`

    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Geocode API error: ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const coordinates = data.features[0].center // [lng, lat]
      return {
        lat: coordinates[1],
        lng: coordinates[0]
      }
    }

    return null
  } catch (error) {
    console.error('Error geocoding store address:', error)
    return null
  }
}

/**
 * Clear geocode cache
 */
export const clearGeocodeCache = () => {
  geocodeCache.clear()
}

