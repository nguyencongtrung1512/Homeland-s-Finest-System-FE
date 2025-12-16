import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import MapBoxByStore from '../../../components/Mapbox/mapBoxByStore'
import { storeApi } from '../../../apis/store.api'
import type { StoreLocationDTO } from '../../../apis/store.api'
import { storeStoryApi } from '../../../apis/storeStory.api'
import type { StoreStory } from '../../../types/storeStoryType'
import { path } from '../../../constants/path'
import Loading from '../../../components/Loading/loading'

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

  // Dropdown states for filters
  const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(null) // 'near-me' | 'local' | 'origin' | null
  const nearMeDropdownRef = useRef<HTMLDivElement>(null)
  const localDropdownRef = useRef<HTMLDivElement>(null)
  const originDropdownRef = useRef<HTMLDivElement>(null)

  // Story dropdown states
  const [isStoryDropdownOpen, setIsStoryDropdownOpen] = useState(false)
  const [currentStory, setCurrentStory] = useState<StoreStory | null>(null)
  const [currentStoryStore, setCurrentStoryStore] = useState<Store | null>(null)

  // Swipeable story viewer states
  const [allStories, setAllStories] = useState<Array<{ story: StoreStory; store: Store }>>([])
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [isLoadingAllStories, setIsLoadingAllStories] = useState(false)
  const storyViewerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const isDragging = useRef<boolean>(false)

  // Map StoreLocationDTO to Store format
  const mapStoreResponseToStore = (storeResponse: StoreLocationDTO): Store => {
    return {
      ID: storeResponse.id,
      StoreName: storeResponse.storeName,
      Province: storeResponse.province,
      District: storeResponse.district,
      Ward: storeResponse.ward,
      Address: storeResponse.address,
      LogoURL: storeResponse.logo || DEFAULT_IMAGE_URL,
      CoverImageURL: storeResponse.coverImage || DEFAULT_IMAGE_URL,
      Description: storeResponse.description || ''
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

  // Load stores from API
  useEffect(() => {
    const loadStores = async () => {
      setIsLoading(true)
      try {
        const params: {
          region?: string
          provinceName?: string
          pageSize?: number
          pageNumber?: number
        } = {
          pageSize: 0, // Get all stores
          pageNumber: 1
        }

        if (selectedRegion) {
          params.region = selectedRegion
        }

        if (provinceSearch.trim()) {
          params.provinceName = provinceSearch.trim()
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
  }, [selectedRegion, provinceSearch])

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
    if (selectedRegion === region) {
      setSelectedRegion(null)
      // Nếu bỏ chọn miền, có thể bỏ chọn "Đặc sản theo vùng" nếu đang chọn
      if (selectedFilterType === 'origin') {
        setSelectedFilterType(null)
      }
    } else {
      setSelectedRegion(region)
      // Tự động chọn "Đặc sản theo vùng" khi chọn miền
      if (selectedFilterType !== 'origin') {
        setSelectedFilterType('origin')
      }
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

      // Nếu chọn filter khác "Đặc sản theo vùng", reset filter miền
      if (filterType !== 'origin') {
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
      />

      {/* Left Panel - Store List with Search */}
      <div className='absolute top-0 left-0 h-full w-96 bg-white shadow-2xl z-30 flex flex-col'>
        {/* Header with Title */}
        <div className='bg-white p-6 border-b-2 border-gray-200'>
          <p className='text-sm text-gray-600'>Khám phá các cửa hàng đặc sản trên khắp Việt Nam</p>
        </div>

        {/* Filter Type Buttons with Dropdowns */}
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='flex flex-col gap-2'>
            {/* Gần tôi Filter */}
            <div ref={nearMeDropdownRef} className='relative'>
              <button
                onClick={() => handleToggleFilterDropdown('near-me')}
                className={`w-full px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-between gap-3 ${selectedFilterType === 'near-me'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-2 border-blue-200'
                  }`}
              >
                <div className='flex items-center gap-3'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
                  <span>Cửa hàng</span>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${openFilterDropdown === 'near-me' ? 'rotate-180' : ''
                    }`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
              </button>
              {openFilterDropdown === 'near-me' && (
                <div className='absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border-2 border-blue-200 overflow-hidden z-50'>
                  <button
                    onClick={() => {
                      handleFilterTypeClick('near-me')
                      setOpenFilterDropdown(null)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${selectedFilterType === 'near-me'
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    Cửa hàng gần tôi
                  </button>
                  <button
                    onClick={() => {
                      handleFilterTypeClick('near-me')
                      setOpenFilterDropdown(null)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${selectedFilterType === 'near-me'
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    Đặc sản địa phương
                  </button>
                  <button
                    onClick={() => {
                      handleFilterTypeClick('near-me')
                      setOpenFilterDropdown(null)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${selectedFilterType === 'near-me'
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    Đặc sản khác vùng
                  </button>

                </div>
              )}
            </div>

            {/* Đặc sản địa phương Filter */}


            {/* Đặc sản theo vùng Filter */}
            <div ref={originDropdownRef} className='relative'>
              <button
                onClick={() => handleToggleFilterDropdown('origin')}
                className={`w-full px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-between gap-3 ${selectedFilterType === 'origin'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border-2 border-green-200'
                  }`}
              >
                <div className='flex items-center gap-3'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                    />
                  </svg>
                  <span>Đặc sản theo vùng</span>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${openFilterDropdown === 'origin' ? 'rotate-180' : ''
                    }`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
              </button>
              {openFilterDropdown === 'origin' && (
                <div className='absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border-2 border-green-200 overflow-hidden z-50'>
                  <button
                    onClick={() => {
                      handleFilterTypeClick('origin')
                      setOpenFilterDropdown(null)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${selectedFilterType === 'origin'
                      ? 'bg-green-100 text-green-700 font-semibold'
                      : 'hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    Tất cả các vùng miền
                  </button>
                  <button
                    onClick={() => {
                      handleFilterTypeClick('origin')
                      handleRegionClick('Miền bắc')
                      setOpenFilterDropdown(null)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${selectedRegion === 'Miền bắc'
                      ? 'bg-green-100 text-green-700 font-semibold'
                      : 'hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    Miền Bắc
                  </button>
                  <button
                    onClick={() => {
                      handleFilterTypeClick('origin')
                      handleRegionClick('Miền trung')
                      setOpenFilterDropdown(null)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${selectedRegion === 'Miền trung'
                      ? 'bg-green-100 text-green-700 font-semibold'
                      : 'hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    Miền Trung
                  </button>
                  <button
                    onClick={() => {
                      handleFilterTypeClick('origin')
                      handleRegionClick('Miền nam')
                      setOpenFilterDropdown(null)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${selectedRegion === 'Miền nam'
                      ? 'bg-green-100 text-green-700 font-semibold'
                      : 'hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    Miền Nam
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='relative'>
            <input
              type='text'
              placeholder='Nhập tên tỉnh/thành phố - Cửa hàng'
              value={provinceSearch}
              onChange={(e) => setProvinceSearch(e.target.value)}
              className='w-full px-4 py-2.5 pl-11 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-green-500 text-sm'
            />
            <svg
              className='absolute left-3.5 top-3.5 w-5 h-5 text-gray-400'
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
            {provinceSearch && (
              <button
                onClick={() => setProvinceSearch('')}
                className='absolute right-3 top-3.5 text-gray-400 hover:text-gray-600'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Store List */}
        <div className='flex-1 overflow-y-auto px-6 py-4'>
          {stores.length === 0 ? (
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
              {stores.map((store) => (
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

      {/* Story Dropdown - Góc trên bên phải */}
      <div ref={dropdownRef} className='absolute top-4 right-4 z-50'>
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
