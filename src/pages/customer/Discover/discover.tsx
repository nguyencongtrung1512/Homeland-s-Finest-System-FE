import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import MapBoxByStore from '../../../components/Mapbox/mapBoxByStore'
import { storeApi } from '../../../apis/store.api'
import type { StoreFilterByLocationParams, StoreLocationDTO } from '../../../apis/store.api'
import { storeStoryApi } from '../../../apis/storeStory.api'
import type { StoreStory } from '../../../types/storeStoryType'
import { path } from '../../../constants/path'
import Loading from '../../../components/Loading/loading'
import { getProvinces, getProvincesDetail, type Province } from '../../../apis/province'

const DEFAULT_IMAGE_URL = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'

interface Store {
  ID: string
  StoreName: string
  Province: string
  District: string
  Ward: string
  Address: string
  LogoURL: string | null
  CoverImageURL: string | null
  Description: string
  lng?: number
  lat?: number
  provinceId?: number | null
  targetProvinceId?: number | null
}

interface UserLocation {
  lng: number
  lat: number
}

const normalizeProvinceName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/thanh pho/gi, '')
    .replace(/tp\./gi, '')
    .replace(/city/gi, '')
    .replace(/tinh/gi, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

// Hàm normalize tên tỉnh/thành từ Mapbox để chuẩn hóa (bỏ City, Thành phố, etc.) nhưng GIỮ NGUYÊN DẤU
const normalizeProvinceNameForAPI = (name: string): string => {
  return name
    .replace(/\s+City\s*$/i, '') // Bỏ "City" ở cuối (case-insensitive)
    .replace(/^Thành phố\s+/i, '') // Bỏ "Thành phố" ở đầu
    .replace(/^TP\.?\s*/i, '') // Bỏ "TP" hoặc "TP." ở đầu
    .replace(/^Tỉnh\s+/i, '') // Bỏ "Tỉnh" ở đầu
    .replace(/\s+/g, ' ') // Chuẩn hóa khoảng trắng (nhiều space thành 1 space)
    .trim()
}

const findProvinceIdByName = (provinceName: string, provinces: Province[]): number | null => {
  const normalizedTarget = normalizeProvinceName(provinceName)
  const exact = provinces.find((p) => normalizeProvinceName(p.name) === normalizedTarget)
  if (exact) return exact.id

  const contains = provinces.find((p) => normalizedTarget.includes(normalizeProvinceName(p.name)))
  if (contains) return contains.id

  return null
}

function Discover() {
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [provinceSearch, setProvinceSearch] = useState('')
  const [selectedFilterType, setSelectedFilterType] = useState<string | null>(null) // 'near-me' | 'local' | 'origin' | 'browse'
  const [isNearMeLoading, setIsNearMeLoading] = useState(false)
  const [nearMeError, setNearMeError] = useState<string | null>(null)
  const [provinces, setProvinces] = useState<Province[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userProvinceId, setUserProvinceId] = useState<number | null>(null)
  const [userProvinceName, setUserProvinceName] = useState<string | null>(null)
  // States cho filter "Cửa hàng gần tôi" với các option phụ
  const [isNearMeEnabled, setIsNearMeEnabled] = useState(false) // Cửa hàng gần tôi
  const [localSpecialtyEnabled, setLocalSpecialtyEnabled] = useState(false) // Đặc sản địa phương
  const [otherSpecialtyEnabled, setOtherSpecialtyEnabled] = useState(false) // Đặc sản khác vùng
  const [isNearMeDetailsOpen, setIsNearMeDetailsOpen] = useState(false) // Thu gọn / mở rộng tuỳ chọn nâng cao

  // States cho hiển thị cửa hàng gần
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [nearbyStores, setNearbyStores] = useState<Store[]>([])
  const [zoomToUserLocation, setZoomToUserLocation] = useState(false)
  const [storesWithCoords, setStoresWithCoords] = useState<Store[]>([]) // Stores đã có lng/lat từ geocode

  // Từ khóa search được áp dụng (Enter hoặc bấm nút search)
  const [appliedSearch, setAppliedSearch] = useState('')

  // Dropdown states for filters
  const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(null) // 'near-me' | 'local' | 'origin' | null
  const nearMeDropdownRef = useRef<HTMLDivElement>(null)
  const localDropdownRef = useRef<HTMLDivElement>(null)
  const originDropdownRef = useRef<HTMLDivElement>(null)

  // Story dropdown states
  const [isStoryDropdownOpen, setIsStoryDropdownOpen] = useState(false)
  const [currentStory, setCurrentStory] = useState<StoreStory | null>(null)
  const [currentStoryStore, setCurrentStoryStore] = useState<Store | null>(null)
  const [isStoryButtonHidden, setIsStoryButtonHidden] = useState(false) // Ẩn nút khi scroll

  // Swipeable story viewer states
  const [allStories, setAllStories] = useState<Array<{ story: StoreStory; store: Store }>>([])
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [isLoadingAllStories, setIsLoadingAllStories] = useState(false)
  const storyViewerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const isDragging = useRef<boolean>(false)
  // #region agent log note
  // Instrumentation logs: see debug instructions. Do not remove until post-fix verification.
  // #endregion

  // Hàm tính khoảng cách giữa hai điểm (Haversine formula)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Bán kính Trái Đất (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Khoảng cách (km)
  }, [])

  // Map StoreLocationDTO to Store format
  const mapStoreResponseToStore = (storeResponse: StoreLocationDTO): Store => {
    // Parse lat/lng từ backend (string) sang number nếu có
    const parsedLat =
      storeResponse.lat !== undefined && storeResponse.lat !== null ? Number.parseFloat(storeResponse.lat) : undefined
    const parsedLng =
      storeResponse.lng !== undefined && storeResponse.lng !== null ? Number.parseFloat(storeResponse.lng) : undefined

    return {
      ID: storeResponse.id,
      StoreName: storeResponse.storeName,
      Province: storeResponse.province,
      District: storeResponse.district,
      Ward: storeResponse.ward,
      Address: storeResponse.address,
      LogoURL: storeResponse.logo || DEFAULT_IMAGE_URL,
      CoverImageURL: storeResponse.coverImage || DEFAULT_IMAGE_URL,
      Description: storeResponse.description || '',
      provinceId: storeResponse.provinceId,
      targetProvinceId: storeResponse.targetProvinceId,
      // Ưu tiên dùng toạ độ từ backend nếu có
      lat: Number.isFinite(parsedLat || NaN) ? parsedLat : undefined,
      lng: Number.isFinite(parsedLng || NaN) ? parsedLng : undefined
    }
  }

  // Load all stories from all filtered stores
  const loadAllStoriesFromStores = async () => {
    if (stores.length === 0) {
      setAllStories([])
      setCurrentStory(null)
      setCurrentStoryStore(null)
      return
    }

    setIsLoadingAllStories(true)
    try {
      const storiesList: Array<{ story: StoreStory; store: Store }> = []

      // Fetch stories from all stores
      for (const store of stores) {
        try {
          const response = await storeStoryApi.getByStore(store.ID)
          const storiesData = response.data || []

          // Filter only active stories
          const activeStories = storiesData.filter((story: StoreStory & { isActive?: boolean }) => {
            return (story as StoreStory & { isActive?: boolean }).isActive !== false
          })

          // Add each active story with its store info
          activeStories.forEach((story) => {
            storiesList.push({ story, store })
          })
        } catch (error) {
          console.error(`Error loading stories for store ${store.ID}:`, error)
          // Continue with other stores
        }
      }

      setAllStories(storiesList)

      // Set current story to first one if available
      if (storiesList.length > 0) {
        setCurrentStoryIndex(0)
        setCurrentStory(storiesList[0].story)
        setCurrentStoryStore(storiesList[0].store)
      } else {
        setCurrentStory(null)
        setCurrentStoryStore(null)
        setCurrentStoryIndex(0)
      }
    } catch (error) {
      console.error('Error loading all stories:', error)
      setAllStories([])
      setCurrentStory(null)
      setCurrentStoryStore(null)
    } finally {
      setIsLoadingAllStories(false)
    }
  }

  // Load random story from a specific store
  const loadRandomStoryFromStore = async (storeId: string) => {
    try {
      const response = await storeStoryApi.getByStore(storeId)
      const storiesData = response.data || []

      // Filter only active stories
      const activeStories = storiesData.filter((story: StoreStory & { isActive?: boolean }) => {
        return (story as StoreStory & { isActive?: boolean }).isActive !== false
      })

      if (activeStories.length > 0) {
        // Select random story
        const randomIndex = Math.floor(Math.random() * activeStories.length)
        const selectedStory = activeStories[randomIndex]
        setCurrentStory(selectedStory)

        // Find the store info
        const store = stores.find((s) => s.ID === storeId)
        setCurrentStoryStore(store || null)
      } else {
        setCurrentStory(null)
        setCurrentStoryStore(null)
      }
    } catch (error) {
      console.error('Error loading story from store:', error)
      setCurrentStory(null)
      setCurrentStoryStore(null)
    }
  }

  // Navigate to store story page
  const handleExploreStory = () => {
    if (currentStoryStore) {
      navigate(path.store.replace(':storeId', currentStoryStore.ID) + '?tab=story')
    }
  }

  // Toggle dropdown and load all stories when opening
  const handleToggleDropdown = () => {
    const newState = !isStoryDropdownOpen
    setIsStoryDropdownOpen(newState)

    if (newState) {
      // Load all stories when opening viewer
      loadAllStoriesFromStores()
    }
  }

  // Load stores từ API (không phụ thuộc vào \"Cửa hàng gần tôi\" để tránh giật khi toggle)
  useEffect(() => {
    const loadStores = async () => {
      setIsLoading(true)
      try {
        const params: StoreFilterByLocationParams = {
          pageSize: 0, // Get all stores
          pageNumber: 1
        }

        if (selectedFilterType === 'origin' && selectedRegion) {
          // Filter \"Đặc sản theo vùng\" - sử dụng filter của backend
          params.region = selectedRegion
        }

        const response = await storeApi.filterStoresByLocation(params)

        if (response.data && Array.isArray(response.data)) {
          const mappedStores = response.data.map(mapStoreResponseToStore)
          setStores(mappedStores)
        } else {
          setStores([])
        }
      } catch (error) {
        console.error('Error loading stores:', error)
        setStores([])
      } finally {
        setIsLoading(false)
      }
    }

    loadStores()
  }, [selectedRegion, selectedFilterType])

  // Load danh sách tỉnh để map tên từ Mapbox -> provinceId
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await getProvinces()
        setProvinces(res)
      } catch (error) {
        console.error('Error loading provinces:', error)
      }
    }

    fetchProvinces()
  }, [])

  // Lọc cửa hàng gần vị trí người dùng (trong bán kính 200km)
  // - Cửa hàng gần tôi: Hiển thị tất cả trong bán kính 200km
  // - Đặc sản địa phương: provinceId = targetProvinceId (cửa hàng bán đặc sản tại địa phương của mình)
  // - Đặc sản khác vùng: provinceId ≠ targetProvinceId (cửa hàng bán đặc sản từ vùng khác)
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7dd65070-5a76-435b-8591-8105b696a5a2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H2',
        location: 'discover.tsx:useEffect filterNearby',
        message: 'filter nearby triggered',
        data: {
          userLocation: !!userLocation,
          stores: stores.length,
          storesWithCoords: storesWithCoords.length,
          isNearMeEnabled,
          localSpecialtyEnabled,
          otherSpecialtyEnabled
        },
        timestamp: Date.now()
      })
    }).catch(() => { })
    // #endregion
    if (!userLocation || !storesWithCoords.length || !isNearMeEnabled) {
      setNearbyStores([])
      return
    }

    // Lọc cửa hàng trong bán kính 200km
    let filteredStores = storesWithCoords
      .map((store) => {
        if (!store.lng || !store.lat) return null
        const distance = calculateDistance(userLocation.lat, userLocation.lng, store.lat, store.lng)
        return { store, distance }
      })
      .filter((item): item is { store: Store; distance: number } => item !== null && item.distance <= 200)

    // Áp dụng filter Đặc sản địa phương: provinceId = targetProvinceId
    if (localSpecialtyEnabled) {
      filteredStores = filteredStores.filter(
        (item) =>
          item.store.provinceId != null &&
          item.store.targetProvinceId != null &&
          item.store.provinceId === item.store.targetProvinceId
      )
    }
    // Áp dụng filter Đặc sản khác vùng: provinceId ≠ targetProvinceId
    else if (otherSpecialtyEnabled) {
      filteredStores = filteredStores.filter(
        (item) =>
          item.store.provinceId != null &&
          item.store.targetProvinceId != null &&
          item.store.provinceId !== item.store.targetProvinceId
      )
    }

    // Sắp xếp theo khoảng cách và lấy kết quả
    const result = filteredStores.sort((a, b) => a.distance - b.distance).map((item) => item.store)

    setNearbyStores(result)
  }, [userLocation, storesWithCoords, calculateDistance, isNearMeEnabled, localSpecialtyEnabled, otherSpecialtyEnabled])

  // Reset zoomToUserLocation sau khi zoom xong (tránh re-zoom khi re-render)
  useEffect(() => {
    if (zoomToUserLocation) {
      const timer = setTimeout(() => {
        setZoomToUserLocation(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [zoomToUserLocation])

  // Load all stories when dropdown opens and stores change
  useEffect(() => {
    if (isStoryDropdownOpen && stores.length > 0) {
      loadAllStoriesFromStores()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStoryDropdownOpen, stores.length])

  // Update current story when index changes
  useEffect(() => {
    if (allStories.length > 0 && currentStoryIndex >= 0 && currentStoryIndex < allStories.length) {
      setCurrentStory(allStories[currentStoryIndex].story)
      setCurrentStoryStore(allStories[currentStoryIndex].store)
    }
  }, [currentStoryIndex, allStories])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStoryDropdownOpen(false)
      }
    }

    if (isStoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isStoryDropdownOpen])

  const handleStoreSelect = (store: Store) => {
    setSelectedStoreId(store.ID)

    // If all stories are loaded, find and show story from this store
    if (allStories.length > 0) {
      const storeStoryIndex = allStories.findIndex((item) => item.store.ID === store.ID)
      if (storeStoryIndex !== -1) {
        setCurrentStoryIndex(storeStoryIndex)
        setCurrentStory(allStories[storeStoryIndex].story)
        setCurrentStoryStore(allStories[storeStoryIndex].store)
      } else {
        // If no story found for this store, load one
        loadRandomStoryFromStore(store.ID)
      }
    } else {
      // If stories not loaded yet, load random story from selected store
      loadRandomStoryFromStore(store.ID)
    }
  }

  // Navigate to next story
  const handleNextStory = () => {
    if (allStories.length > 0 && currentStoryIndex < allStories.length - 1) {
      const nextIndex = currentStoryIndex + 1
      setCurrentStoryIndex(nextIndex)
      setCurrentStory(allStories[nextIndex].story)
      setCurrentStoryStore(allStories[nextIndex].store)
    }
  }

  // Navigate to previous story
  const handlePreviousStory = () => {
    if (allStories.length > 0 && currentStoryIndex > 0) {
      const prevIndex = currentStoryIndex - 1
      setCurrentStoryIndex(prevIndex)
      setCurrentStory(allStories[prevIndex].story)
      setCurrentStoryStore(allStories[prevIndex].store)
    }
  }

  // Handle touch start for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    isDragging.current = true
  }

  // Handle touch move for swipe
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    touchEndX.current = e.touches[0].clientX
  }

  // Handle touch end for swipe
  const handleTouchEnd = () => {
    if (!isDragging.current) return
    isDragging.current = false

    const swipeDistance = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50 // Minimum distance to trigger swipe

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swipe left - next story
        handleNextStory()
      } else {
        // Swipe right - previous story
        handlePreviousStory()
      }
    }

    touchStartX.current = 0
    touchEndX.current = 0
  }

  // Handle mouse drag for swipe (desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX
    isDragging.current = true
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    touchEndX.current = e.clientX
  }

  const handleMouseUp = () => {
    if (!isDragging.current) return
    isDragging.current = false

    const swipeDistance = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50 // Minimum distance to trigger swipe

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swipe left - next story
        handleNextStory()
      } else {
        // Swipe right - previous story
        handlePreviousStory()
      }
    }

    touchStartX.current = 0
    touchEndX.current = 0
  }

  const handleRegionClick = (region: string) => {
    // Chỉ thay đổi miền được chọn, KHÔNG đụng tới trạng thái "Cửa hàng gần tôi"
    // và KHÔNG tự động bật/tắt loại filter (origin) ở đây.
    if (selectedRegion === region) {
      setSelectedRegion(null)
    } else {
      setSelectedRegion(region)
    }
    setProvinceSearch('')
  }

  // Handle filter type selection
  const handleFilterTypeClick = (filterType: string) => {
    if (selectedFilterType === filterType) {
      // Nếu bỏ chọn filter
      setSelectedFilterType(null)
      // Nếu đang bỏ chọn "Đặc sản theo vùng", cũng reset filter miền
      if (filterType === 'origin') {
        setSelectedRegion(null)
      }
    } else {
      // Chọn filter mới
      setSelectedFilterType(filterType)

      // Nếu chọn "Đặc sản theo vùng", reset filter "Cửa hàng gần tôi"
      if (filterType === 'origin') {
        setIsNearMeEnabled(false)
        setUserProvinceId(null)
        setUserProvinceName(null)
        setLocalSpecialtyEnabled(false)
        setOtherSpecialtyEnabled(false)
        // Đồng thời reset vị trí & dữ liệu gần tôi để xoá vòng tròn radius trên map
        setUserLocation(null)
        setNearbyStores([])
        setZoomToUserLocation(false)
      } else {
        // Nếu chọn filter khác "Đặc sản theo vùng", reset filter miền
        setSelectedRegion(null)
      }
    }

    // Reset province search khi đổi filter
    setProvinceSearch('')

    // TODO: Call API filter based on filterType
    // switch (filterType) {
    //   case 'near-me':
    //     // Call API to get stores near user location
    //     break
    //   case 'local':
    //     // Call API to get local stores
    //     break
    //   case 'origin':
    //     // Call API to get stores by origin (sẽ dùng selectedRegion)
    //     break
    // }
  }

  // Lấy vị trí hiện tại, reverse geocode qua Mapbox để lấy provinceId
  const resolveNearMeProvince = async () => {
    setIsNearMeLoading(true)
    setNearMeError(null)

    try {
      if (!navigator.geolocation) {
        setNearMeError('Trình duyệt không hỗ trợ lấy vị trí hiện tại.')
        setIsNearMeLoading(false)
        return
      }

      const getPosition = () =>
        new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          })
        })

      const position = await getPosition()
      const { latitude, longitude } = position.coords

      // Lưu vị trí người dùng
      setUserLocation({ lng: longitude, lat: latitude })
      setZoomToUserLocation(true)

      const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
      if (!mapboxToken) {
        setNearMeError('Thiếu cấu hình Mapbox access token.')
        setIsNearMeLoading(false)
        return
      }

      const resp = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&country=vn&limit=1`
      )
      const data = await resp.json()

      const feature = data?.features?.[0]
      if (!feature) {
        setNearMeError('Không xác định được địa chỉ từ vị trí hiện tại.')
        setIsNearMeLoading(false)
        return
      }

      // Ưu tiên lấy TỈNH/THÀNH từ context (place/region/locality), KHÔNG dùng tên đường (feature.text)
      const contextEntries: Array<{ id: string; text: string }> = feature.context || []

      const provinceFromPlace =
        contextEntries.find((c) => c.id?.startsWith('place')) ||
        contextEntries.find((c) => c.id?.startsWith('region')) ||
        contextEntries.find((c) => c.id?.startsWith('locality'))

      const contextProvince = provinceFromPlace?.text

      if (!contextProvince) {
        setNearMeError('Không đọc được tỉnh/thành từ địa chỉ.')
        setIsNearMeLoading(false)
        return
      }

      // Normalize tên tỉnh/thành từ Mapbox (bỏ City, Thành phố, etc.) nhưng giữ nguyên dấu
      const normalizedProvinceName = normalizeProvinceNameForAPI(contextProvince)

      // Ưu tiên gọi API backend để map tên Mapbox -> Province trong hệ thống
      let matchedProvinceId: number | null = null
      let matchedProvinceName: string | null = null

      try {
        // Thử với tên đã normalize trước (ví dụ: "Ho Chi Minh City" -> "Ho Chi Minh")
        const provinceDetail = await getProvincesDetail(normalizedProvinceName)
        matchedProvinceId = provinceDetail.data.id
        matchedProvinceName = provinceDetail.data.name
      } catch {
        // Nếu fail với tên normalize, thử với tên gốc từ Mapbox
        try {
          const provinceDetail = await getProvincesDetail(contextProvince)
          matchedProvinceId = provinceDetail.data.id
          matchedProvinceName = provinceDetail.data.name
        } catch {
          // Fallback: dùng danh sách provinces đã load sẵn trên FE
          // Thử với tên normalize trước
          matchedProvinceId = findProvinceIdByName(normalizedProvinceName, provinces)
          if (matchedProvinceId) {
            // Tìm tên chính xác từ danh sách provinces
            const foundProvince = provinces.find((p) => {
              const normalizedP = normalizeProvinceName(p.name)
              const normalizedTarget = normalizeProvinceName(normalizedProvinceName)
              return normalizedP === normalizedTarget || normalizedTarget.includes(normalizedP)
            })
            matchedProvinceName = foundProvince?.name || normalizedProvinceName
          } else {
            // Nếu không tìm thấy với tên normalize, thử với tên gốc
            matchedProvinceId = findProvinceIdByName(contextProvince, provinces)
            if (matchedProvinceId) {
              const foundProvince = provinces.find((p) => {
                const normalizedP = normalizeProvinceName(p.name)
                const normalizedTarget = normalizeProvinceName(contextProvince)
                return normalizedP === normalizedTarget || normalizedTarget.includes(normalizedP)
              })
              matchedProvinceName = foundProvince?.name || contextProvince
            } else {
              matchedProvinceName = normalizedProvinceName
            }
          }
        }
      }

      if (!matchedProvinceId) {
        setNearMeError(`Không map được tỉnh/thành "${normalizedProvinceName}" với danh sách hệ thống.`)
        setIsNearMeLoading(false)
        return
      }

      setUserProvinceId(matchedProvinceId)
      setUserProvinceName(matchedProvinceName)
      setIsNearMeEnabled(true)
      setSelectedFilterType('near-me')
      // Reset filter "Đặc sản theo vùng" khi chọn "Cửa hàng gần tôi"
      setSelectedRegion(null)
      setProvinceSearch('')
    } catch (error) {
      console.error('Error resolving near-me province:', error)
      setNearMeError('Đã xảy ra lỗi khi lấy vị trí. Vui lòng thử lại.')
    } finally {
      setIsNearMeLoading(false)
    }
  }

  // Toggle "Cửa hàng gần tôi"
  const handleToggleNearMe = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7dd65070-5a76-435b-8591-8105b696a5a2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H1',
        location: 'discover.tsx:handleToggleNearMe',
        message: 'toggle near-me clicked',
        data: { isNearMeEnabled },
        timestamp: Date.now()
      })
    }).catch(() => { })
    // #endregion
    if (isNearMeEnabled) {
      // Tắt filter "gần tôi" -> reset tất cả
      setIsNearMeEnabled(false)
      setUserProvinceId(null)
      setUserProvinceName(null)
      setLocalSpecialtyEnabled(false)
      setOtherSpecialtyEnabled(false)
      setSelectedFilterType(null)
      // Reset vị trí người dùng và trạng thái hiển thị cửa hàng gần
      setUserLocation(null)
      setNearbyStores([])
      setZoomToUserLocation(false)
    } else {
      // Bật filter "gần tôi" -> lấy vị trí
      await resolveNearMeProvince()
    }
  }

  // Toggle "Đặc sản địa phương"
  const handleToggleLocalSpecialty = () => {
    if (!isNearMeEnabled) return // Chỉ toggle được khi đã bật "Cửa hàng gần tôi"
    const newValue = !localSpecialtyEnabled
    setLocalSpecialtyEnabled(newValue)
    // Nếu bật "Đặc sản địa phương" thì tắt "Đặc sản khác vùng" (chỉ chọn 1 trong 2)
    if (newValue) {
      setOtherSpecialtyEnabled(false)
    }
  }

  // Toggle "Đặc sản khác vùng"
  const handleToggleOtherSpecialty = () => {
    if (!isNearMeEnabled) return // Chỉ toggle được khi đã bật "Cửa hàng gần tôi"
    const newValue = !otherSpecialtyEnabled
    setOtherSpecialtyEnabled(newValue)
    // Nếu bật "Đặc sản khác vùng" thì tắt "Đặc sản địa phương" (chỉ chọn 1 trong 2)
    if (newValue) {
      setLocalSpecialtyEnabled(false)
    }
  }

  // Handle search box change
  const handleProvinceSearchChange = (value: string) => {
    setProvinceSearch(value)

    // Nếu đang bật "Cửa hàng gần tôi" thì chỉ cập nhật từ khoá,
    // không được reset filter hay tắt chế độ gần tôi.
    if (isNearMeEnabled) {
      return
    }

    // Khi KHÔNG ở chế độ "gần tôi" và user nhập vào search box,
    // reset các filter khác (tỉnh/vùng) để dùng search theo tỉnh/cửa hàng.
    if (value.trim()) {
      setIsNearMeEnabled(false)
      setUserProvinceId(null)
      setUserProvinceName(null)
      setLocalSpecialtyEnabled(false)
      setOtherSpecialtyEnabled(false)
      setSelectedFilterType(null)
      setSelectedRegion(null)
      // Đồng thời reset vị trí người dùng và dữ liệu gần tôi (xoá vòng tròn radius)
      setUserLocation(null)
      setNearbyStores([])
      setZoomToUserLocation(false)
    }
  }

  // Toggle filter dropdown
  const handleToggleFilterDropdown = (filterType: string) => {
    if (openFilterDropdown === filterType) {
      setOpenFilterDropdown(null)
    } else {
      setOpenFilterDropdown(filterType)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isClickInside =
        (nearMeDropdownRef.current && nearMeDropdownRef.current.contains(target)) ||
        (localDropdownRef.current && localDropdownRef.current.contains(target)) ||
        (originDropdownRef.current && originDropdownRef.current.contains(target))

      if (!isClickInside) {
        setOpenFilterDropdown(null)
      }
    }

    if (openFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openFilterDropdown])

  // Ẩn nút "Có thể bạn chưa biết?" khi scroll (tránh che header)
  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          // Nếu scroll xuống > 50px thì ẩn nút
          if (currentScrollY > 50) {
            setIsStoryButtonHidden(true)
          } else {
            setIsStoryButtonHidden(false)
          }
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Hàm filter cửa hàng theo từ khoá search (frontend only)
  const filterStoresBySearch = (inputStores: Store[]): Store[] => {
    const term = appliedSearch.trim().toLowerCase()
    if (!term) return inputStores

    return inputStores.filter((store) => {
      const name = store.StoreName?.toLowerCase() || ''
      // Nếu đang bật "Cửa hàng gần tôi" -> chỉ cho search theo tên cửa hàng (không search theo tỉnh)
      if (isNearMeEnabled) {
        return name.includes(term)
      }

      const province = store.Province?.toLowerCase() || ''
      const address = store.Address?.toLowerCase() || ''
      return name.includes(term) || province.includes(term) || address.includes(term)
    })
  }

  const baseVisibleStores = isNearMeEnabled ? nearbyStores : stores
  const visibleStores = filterStoresBySearch(baseVisibleStores)
  // Memo hoá danh sách ID để tránh tạo mảng mới mỗi lần render (gây re-render marker liên tục)
  const visibleStoreIds = useMemo(() => visibleStores.map((s) => s.ID), [visibleStores])

  return (
    <div className='w-full h-screen relative'>
      {/* Loading overlay */}
      {isLoading && (
        <div className='absolute inset-0 z-50 bg-white bg-opacity-90 flex items-center justify-center'>
          <Loading text='Đang tải danh sách cửa hàng...' />
        </div>
      )}

      {/* Map với list overlay bên trong */}
      <MapBoxByStore
        stores={stores}
        onStoreSelect={handleStoreSelect}
        selectedStoreId={selectedStoreId}
        onStoreIdChange={setSelectedStoreId}
        hidePanel={true}
        userLocation={userLocation}
        radiusKm={200}
        zoomToUserLocation={zoomToUserLocation}
        onStoresWithCoordinatesLoaded={setStoresWithCoords}
        limitToRadius={isNearMeEnabled}
        visibleStoreIds={visibleStoreIds}
      />

      {/* Left Panel - Store List with Search */}
      <div className='absolute top-0 left-0 h-full w-96 bg-white shadow-2xl z-30 flex flex-col'>
        {/* Header with Title */}
        <div className='bg-white p-6 border-b-2 border-gray-200'>
          <p className='text-sm text-gray-600'>Khám phá các cửa hàng đặc sản trên khắp Việt Nam</p>
        </div>

        {/* Filter Type Buttons with Dropdowns */}
        <div className='px-6 py-4 border-b border-gray-200 space-y-3'>
          {/* Gần tôi Filter - Card Design */}
          <div ref={nearMeDropdownRef} className='relative'>
            <div
              className={`rounded-xl border-2 transition-all duration-300 overflow-hidden ${isNearMeEnabled
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                }`}
            >
              {/* Header Button */}
              <button
                onClick={handleToggleNearMe}
                className='w-full px-4 py-3.5 flex items-center justify-between group'
              >
                <div className='flex items-center gap-3'>
                  <div
                    className={`p-2 rounded-lg transition-colors ${isNearMeEnabled ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'
                      }`}
                  >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                      />
                    </svg>
                  </div>
                  <div className='text-left'>
                    <p className={`font-semibold text-sm ${isNearMeEnabled ? 'text-blue-900' : 'text-gray-900'}`}>
                      Cửa hàng gần tôi
                    </p>
                    {userProvinceName && !nearMeError && (
                      <p className='text-xs text-gray-500 mt-0.5'>{userProvinceName}</p>
                    )}
                  </div>
                </div>
                <div className='flex items-center gap-1.5'>
                  {isNearMeLoading && (
                    <div className='animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent'></div>
                  )}
                  {isNearMeEnabled && !isNearMeLoading && (
                    <div className='w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center'>
                      <svg className='w-4 h-4 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={3} d='M5 13l4 4L19 7' />
                      </svg>
                    </div>
                  )}
                  {!isNearMeEnabled && !isNearMeLoading && (
                    <div className='w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-blue-400'></div>
                  )}
                  {/* Nút thu gọn / mở rộng tuỳ chọn nâng cao */}
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsNearMeDetailsOpen((prev) => !prev)
                    }}
                    className='p-1 rounded-full hover:bg-blue-50 transition-colors'
                    aria-label={isNearMeDetailsOpen ? 'Thu gọn tuỳ chọn gần tôi' : 'Mở rộng tuỳ chọn gần tôi'}
                  >
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isNearMeDetailsOpen ? 'rotate-180' : ''
                        }`}
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                    </svg>
                  </button>
                </div>
              </button>

              {/* Status Message */}
              {(isNearMeLoading || nearMeError) && (
                <div className='px-4 pb-3'>
                  {isNearMeLoading && (
                    <div className='flex items-center gap-2 text-xs text-blue-600'>
                      <div className='animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent'></div>
                      <span>Đang xác định vị trí của bạn...</span>
                    </div>
                  )}
                  {nearMeError && (
                    <div className='flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg'>
                      <svg className='w-4 h-4 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                      </svg>
                      <span>{nearMeError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-options với animation (thu gọn khi isNearMeDetailsOpen = false) */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isNearMeEnabled && isNearMeDetailsOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                  }`}
              >
                <div className='px-4 pb-3 space-y-2 pt-1'>
                  <button
                    onClick={handleToggleLocalSpecialty}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${localSpecialtyEnabled
                      ? 'bg-emerald-500 text-white shadow-md transform scale-[1.02]'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                  >
                    <div className='flex items-center gap-2.5'>
                      <div
                        className={`p-1.5 rounded-md transition-colors ${localSpecialtyEnabled ? 'bg-white/20' : 'bg-emerald-100 text-emerald-600'
                          }`}
                      >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                          />
                        </svg>
                      </div>
                      <span>Đặc sản địa phương</span>
                    </div>
                    {localSpecialtyEnabled && (
                      <div className='w-5 h-5 rounded-full bg-white flex items-center justify-center'>
                        <svg className='w-3 h-3 text-emerald-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={3} d='M5 13l4 4L19 7' />
                        </svg>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={handleToggleOtherSpecialty}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${otherSpecialtyEnabled
                      ? 'bg-amber-500 text-white shadow-md transform scale-[1.02]'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                  >
                    <div className='flex items-center gap-2.5'>
                      <div
                        className={`p-1.5 rounded-md transition-colors ${otherSpecialtyEnabled ? 'bg-white/20' : 'bg-amber-100 text-amber-600'
                          }`}
                      >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9'
                          />
                        </svg>
                      </div>
                      <span>Đặc sản vùng khác</span>
                    </div>
                    {otherSpecialtyEnabled && (
                      <div className='w-5 h-5 rounded-full bg-white flex items-center justify-center'>
                        <svg className='w-3 h-3 text-amber-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={3} d='M5 13l4 4L19 7' />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Đặc sản theo vùng Filter - Card Design */}
          <div ref={originDropdownRef} className='relative'>
            <div
              className={`rounded-xl border-2 transition-all duration-300 overflow-hidden ${selectedFilterType === 'origin'
                ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                }`}
            >
              <button
                onClick={() => handleToggleFilterDropdown('origin')}
                className='w-full px-4 py-3.5 flex items-center justify-between group'
              >
                <div className='flex items-center gap-3'>
                  <div
                    className={`p-2 rounded-lg transition-colors ${selectedFilterType === 'origin'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 text-green-600 group-hover:bg-green-200'
                      }`}
                  >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  </div>
                  <div className='text-left'>
                    <p
                      className={`font-semibold text-sm ${selectedFilterType === 'origin' ? 'text-green-900' : 'text-gray-900'}`}
                    >
                      Đặc sản theo vùng
                    </p>
                    {selectedRegion && <p className='text-xs text-gray-500 mt-0.5'>{selectedRegion}</p>}
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  {selectedFilterType === 'origin' && (
                    <div className='w-6 h-6 rounded-full bg-green-600 flex items-center justify-center'>
                      <svg className='w-4 h-4 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={3} d='M5 13l4 4L19 7' />
                      </svg>
                    </div>
                  )}
                  <svg
                    className={`w-5 h-5 transition-transform duration-300 text-gray-400 ${openFilterDropdown === 'origin' ? 'rotate-180' : ''
                      }`}
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                  </svg>
                </div>
              </button>

              {/* Dropdown với animation */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${openFilterDropdown === 'origin' ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
                  }`}
              >
                <div className='px-4 pb-3 space-y-1.5 pt-1'>
                  <button
                    onClick={() => {
                      handleFilterTypeClick('origin')
                      setOpenFilterDropdown(null)
                    }}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2.5 ${selectedFilterType === 'origin' && !selectedRegion
                      ? 'bg-green-500 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'
                      />
                    </svg>
                    <span>Tất cả các vùng miền</span>
                  </button>
                  <button
                    onClick={() => {
                      handleFilterTypeClick('origin')
                      handleRegionClick('Miền bắc')
                      setOpenFilterDropdown(null)
                    }}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2.5 ${selectedRegion === 'Miền bắc'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
                      />
                    </svg>
                    <span>Miền Bắc</span>
                  </button>
                  <button
                    onClick={() => {
                      handleFilterTypeClick('origin')
                      handleRegionClick('Miền trung')
                      setOpenFilterDropdown(null)
                    }}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2.5 ${selectedRegion === 'Miền trung'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                      />
                    </svg>
                    <span>Miền Trung</span>
                  </button>
                  <button
                    onClick={() => {
                      handleFilterTypeClick('origin')
                      handleRegionClick('Miền nam')
                      setOpenFilterDropdown(null)
                    }}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2.5 ${selectedRegion === 'Miền nam'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                    <span>Miền Nam</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='relative group'>
            <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
              <svg
                className='w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors'
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
            <input
              type='text'
              placeholder={isNearMeEnabled ? 'Nhập tên cửa hàng' : 'Nhập tên tỉnh - Cửa hàng'}
              value={provinceSearch}
              onChange={(e) => handleProvinceSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  setAppliedSearch(provinceSearch.trim())
                }
              }}
              className='w-full px-4 py-3 pl-11 pr-10 rounded-xl border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-200 transition-all duration-200 text-sm placeholder:text-gray-400'
            />
            {provinceSearch && (
              <button
                onClick={() => {
                  setProvinceSearch('')
                  setAppliedSearch('')
                }}
                className='absolute inset-y-0 right-9 pr-2 flex items-center text-gray-400 hover:text-gray-600 transition-colors'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            )}
            {/* Nút search để chủ động áp dụng, tránh filter mỗi ký tự */}
            <button
              onClick={() => setAppliedSearch(provinceSearch.trim())}
              className='absolute inset-y-0 right-0 pr-3 flex items-center text-green-600 hover:text-green-700 transition-colors'
              aria-label='Search'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Store List */}
        <div className='flex-1 overflow-y-auto px-6 py-4'>
          {visibleStores.length === 0 ? (
            <div className='text-center py-12 text-gray-500'>
              <svg
                className='w-16 h-16 mx-auto mb-4 text-gray-300'
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
            <div className='space-y-4'>
              {visibleStores.map((store) => (
                <div
                  key={store.ID}
                  onClick={() => handleStoreSelect(store)}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 transform hover:scale-[1.02] active:scale-[0.98] ${selectedStoreId === store.ID
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 shadow-lg'
                    : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-md'
                    }`}
                >
                  {/* Store Image */}
                  <div className='mb-3'>
                    <img
                      src={store.CoverImageURL || DEFAULT_IMAGE_URL}
                      alt={store.StoreName}
                      className='w-full h-32 object-cover rounded-lg shadow-sm'
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = DEFAULT_IMAGE_URL
                      }}
                    />
                  </div>

                  {/* Store Info */}
                  <div>
                    <h3 className='font-bold text-gray-900 text-base mb-1 line-clamp-2'>{store.StoreName}</h3>
                    <p className='text-sm text-gray-600 mb-1'>{store.Province}</p>
                    <p className='text-xs text-gray-500 line-clamp-2'>{store.Address}</p>
                    {store.Description && (
                      <p className='text-xs text-gray-400 mt-2 line-clamp-2'>{store.Description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Story Dropdown - Góc trên bên phải, ẩn khi scroll để không che header */}
      <div
        ref={dropdownRef}
        className={`absolute top-4 right-4 z-50 transition-all duration-300 ${isStoryButtonHidden && !isStoryDropdownOpen
          ? 'opacity-0 pointer-events-none -translate-y-4'
          : 'opacity-100 translate-y-0'
          }`}
      >
        {/* Toggle Button */}
        <button
          onClick={handleToggleDropdown}
          className={`relative px-5 py-3 rounded-xl font-semibold text-sm shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 hover:shadow-xl ${isStoryDropdownOpen
            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-xl'
            : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
            }`}
        >
          <div className='flex items-center gap-2'>
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
              />
            </svg>
            <span>Có thể bạn chưa biết ?</span>
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${isStoryDropdownOpen ? 'rotate-180' : ''}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
            </svg>
          </div>
        </button>

        {/* Swipeable Story Viewer Panel */}
        {isStoryDropdownOpen && (
          <div className='absolute top-full right-0 mt-3 w-[350px] bg-white rounded-xl shadow-2xl border-2 border-green-600 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300'>
            <div
              ref={storyViewerRef}
              className='relative max-h-[600px] overflow-hidden'
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {isLoadingAllStories ? (
                <div className='p-8 flex flex-col items-center justify-center min-h-[300px]'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4'></div>
                  <p className='text-sm text-gray-600'>Đang tải câu chuyện...</p>
                </div>
              ) : allStories.length > 0 && currentStory && currentStoryStore ? (
                <div className='relative select-none'>
                  {/* Navigation Buttons */}
                  {allStories.length > 1 && (
                    <>
                      {/* Previous Button */}
                      {currentStoryIndex > 0 && (
                        <button
                          onClick={handlePreviousStory}
                          className='absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors'
                          aria-label='Câu chuyện trước'
                        >
                          <svg className='w-6 h-6 text-gray-700' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                          </svg>
                        </button>
                      )}

                      {/* Next Button */}
                      {currentStoryIndex < allStories.length - 1 && (
                        <button
                          onClick={handleNextStory}
                          className='absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors'
                          aria-label='Câu chuyện tiếp theo'
                        >
                          <svg className='w-6 h-6 text-gray-700' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                          </svg>
                        </button>
                      )}
                    </>
                  )}

                  {/* Story Counter */}
                  {allStories.length > 1 && (
                    <div className='absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-md'>
                      {currentStoryIndex + 1} / {allStories.length}
                    </div>
                  )}

                  {/* Story Card with Image Background (Image 2 Style) */}
                  {currentStory.thumbnailUrl ? (
                    <div className='relative w-full h-[500px] overflow-hidden'>
                      {/* Background Image */}
                      <img
                        src={currentStory.thumbnailUrl}
                        alt={currentStory.title}
                        className='w-full h-full object-cover'
                        draggable={false}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = DEFAULT_IMAGE_URL
                        }}
                      />

                      {/* Gradient Overlay for Text Readability */}
                      <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent' />

                      {/* Content Overlay */}
                      <div className='absolute inset-0 flex flex-col justify-between p-6'>
                        {/* Top Section - Label and Icon */}
                        <div className='flex items-start justify-between'>
                          <span className='text-white text-xs font-semibold uppercase tracking-wider bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full'>
                            CÂU CHUYỆN CỬA HÀNG
                          </span>
                          {/* Story Icon */}
                          <div className='bg-white/20 backdrop-blur-sm p-2 rounded-full'>
                            <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Bottom Section - Title, Preview Text, and Button */}
                        <div className='space-y-5 max-w-[320px]'>
                          {/* Story Title */}
                          <h4 className='text-white text-2xl font-bold leading-snug drop-shadow-lg line-clamp-3'>
                            {currentStory.title}
                          </h4>

                          {/* Story Preview Text */}
                          {currentStory.contents && currentStory.contents.length > 0 && (
                            <div className='space-y-2'>
                              {currentStory.contents.find((c) => c.contentType === 'TextIntro') && (
                                <p className='text-white/90 text-sm leading-relaxed line-clamp-4 drop-shadow-md'>
                                  {currentStory.contents.find((c) => c.contentType === 'TextIntro')?.contentData}
                                </p>
                              )}
                              {!currentStory.contents.find((c) => c.contentType === 'TextIntro') &&
                                currentStory.contents.find((c) => c.contentType === 'TextExpanded') && (
                                  <p className='text-white/90 text-sm leading-relaxed line-clamp-4 drop-shadow-md'>
                                    {currentStory.contents.find((c) => c.contentType === 'TextExpanded')?.contentData}
                                  </p>
                                )}
                            </div>
                          )}

                          {/* Store Info */}
                          <div className='flex items-center gap-2 text-white/90 text-xs'>
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                              />
                            </svg>
                            <span className='truncate'>{currentStoryStore.StoreName}</span>
                            <span className='mx-1'>•</span>
                            <span>{currentStoryStore.Province}</span>
                          </div>

                          {/* Explore Button */}
                          <button
                            onClick={handleExploreStory}
                            className='w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 backdrop-blur-sm'
                          >
                            <span>Khám phá</span>
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M13 7l5 5m0 0l-5 5m5-5H6'
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Fallback when no thumbnail */
                    <div className='p-6'>
                      {/* Store Info Header */}
                      <div className='flex items-start gap-4 mb-4 pb-4 border-b border-gray-200'>
                        <div className='flex-shrink-0'>
                          <img
                            src={currentStoryStore.LogoURL || currentStoryStore.CoverImageURL || DEFAULT_IMAGE_URL}
                            alt={currentStoryStore.StoreName}
                            className='w-16 h-16 rounded-lg object-cover shadow-md'
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = DEFAULT_IMAGE_URL
                            }}
                          />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2 mb-1'>
                            <svg
                              className='w-4 h-4 text-green-600 flex-shrink-0'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                              />
                            </svg>
                            <h3 className='font-bold text-gray-900 text-base truncate'>
                              {currentStoryStore.StoreName}
                            </h3>
                          </div>
                          <p className='text-xs text-gray-500 truncate'>{currentStoryStore.Province}</p>
                        </div>
                      </div>

                      {/* Story Title */}
                      <h4 className='font-bold text-lg text-gray-900 mb-3 line-clamp-2'>{currentStory.title}</h4>

                      {/* Story Preview Text */}
                      {currentStory.contents && currentStory.contents.length > 0 && (
                        <div className='mb-4'>
                          {currentStory.contents.find((c) => c.contentType === 'TextIntro') && (
                            <p className='text-sm text-gray-600 line-clamp-3'>
                              {currentStory.contents.find((c) => c.contentType === 'TextIntro')?.contentData}
                            </p>
                          )}
                          {!currentStory.contents.find((c) => c.contentType === 'TextIntro') &&
                            currentStory.contents.find((c) => c.contentType === 'TextExpanded') && (
                              <p className='text-sm text-gray-600 line-clamp-3'>
                                {currentStory.contents.find((c) => c.contentType === 'TextExpanded')?.contentData}
                              </p>
                            )}
                        </div>
                      )}

                      {/* Explore Button */}
                      <button
                        onClick={handleExploreStory}
                        className='w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2'
                      >
                        <span>Khám phá</span>
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M13 7l5 5m0 0l-5 5m5-5H6'
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className='p-8 flex flex-col items-center justify-center text-center min-h-[300px]'>
                  <svg className='w-16 h-16 text-gray-300 mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                  <p className='text-sm text-gray-500 mb-2'>Chưa có câu chuyện nào</p>
                  <p className='text-xs text-gray-400'>Hãy thử chọn một cửa hàng khác</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Discover
