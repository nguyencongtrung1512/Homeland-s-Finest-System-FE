import { useState, useEffect } from 'react'
import MapBoxByStore from '../../../components/Mapbox/mapBoxByStore'
import { storeApi } from '../../../apis/store.api'
import type { StoreResponse } from '../../../apis/store.api'
import Loading from '../../../components/Loading/loading'

const DEFAULT_IMAGE_URL = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'

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
  Description: string
  lng?: number
  lat?: number
}

function Discover() {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState<string | null>('Miền bắc')
  const [provinceSearch, setProvinceSearch] = useState('')

  // Map StoreResponse to Store format
  const mapStoreResponseToStore = (storeResponse: StoreResponse): Store => {
    return {
      ID: storeResponse.id,
      StoreName: storeResponse.storeName,
      Province: storeResponse.province,
      ProvinceID: storeResponse.provinceId,
      District: storeResponse.district,
      DistrictID: storeResponse.districtId,
      Ward: storeResponse.ward,
      WardID: storeResponse.wardId,
      Address: storeResponse.address,
      LogoURL: storeResponse.logoUrl || DEFAULT_IMAGE_URL,
      CoverImageURL: storeResponse.coverImageUrl || DEFAULT_IMAGE_URL,
      Description: storeResponse.description || ''
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

  const handleStoreSelect = (store: Store) => {
    setSelectedStoreId(store.ID)
  }

  const handleRegionClick = (region: string) => {
    if (selectedRegion === region) {
      setSelectedRegion(null)
    } else {
      setSelectedRegion(region)
    }
    setProvinceSearch('')
  }

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
      <div className='absolute top-0 left-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col'>
        {/* Header with Title */}
        <div className='bg-white p-6 border-b-2 border-gray-200'>
          <p className='text-sm text-gray-600'>Khám phá các cửa hàng đặc sản trên khắp Việt Nam</p>
        </div>

        {/* Search Box */}
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='relative'>
            <input
              type='text'
              placeholder='Nhập tên tỉnh/thành phố...'
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
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${selectedStoreId === store.ID
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

      {/* Region filter panel - Góc dưới bên phải */}
      <div className='absolute bottom-16 right-4 z-50 bg-white rounded-lg shadow-xl border-2 border-green-600 p-4 min-w-[200px]'>
        <h3 className='text-lg font-bold text-gray-800 mb-3 flex items-center gap-2'>
          <svg className='w-5 h-5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 002 2h2.945M3.055 11H1m2.055 0a8.001 8.001 0 0115.89 0M21 11a8.001 8.001 0 00-2.945-5.055M21 11v1a2 2 0 01-2 2h-2.945M21 11h2m-2.055 0a8.001 8.001 0 00-15.89 0M9 11a2 2 0 012-2h2a2 2 0 012 2m-6 4h6'
            />
          </svg>
          Lọc theo miền
        </h3>
        <div className='space-y-2'>
          <button
            onClick={() => handleRegionClick('Miền bắc')}
            className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${selectedRegion === 'Miền bắc'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Miền Bắc
          </button>
          <button
            onClick={() => handleRegionClick('Miền trung')}
            className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${selectedRegion === 'Miền trung'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Miền Trung
          </button>
          <button
            onClick={() => handleRegionClick('Miền nam')}
            className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${selectedRegion === 'Miền nam'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Miền Nam
          </button>
        </div>
      </div>
    </div>
  )
}

export default Discover
