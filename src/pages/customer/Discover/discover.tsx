import React, { useState } from 'react'
import MapBoxByStore from '../../../components/Mapbox/mapBoxByStore'
import mapstore from './data'
import Loading from '../../../components/Loading/loading'

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
  lng?: number
  lat?: number
}

function Discover() {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleStoreSelect = (store: Store) => {
    setSelectedStoreId(store.ID)
  }

  const handleSidebarStoreClick = (store: Store) => {
    setSelectedStoreId(store.ID)
  }

  return (
    <div className='container mx-auto py-8 px-4'>
      <h1 className='text-3xl font-bold text-green-800 mb-6'>Khám phá cửa hàng</h1>

      {isLoading ? (
        <div className='w-full h-96 flex items-center justify-center'>
          <Loading text='Đang tải danh sách cửa hàng...' />
        </div>
      ) : (
        <div className='flex flex-col lg:flex-row gap-6'>
          {/* Sidebar danh sách cửa hàng */}
          <div className='lg:w-1/3 bg-white rounded-lg shadow-md p-4 h-[600px] overflow-y-auto'>
            <h2 className='text-xl font-semibold text-green-700 mb-4'>Danh sách cửa hàng</h2>
            <div className='space-y-4'>
              {mapstore.map((store) => (
                <div
                  key={store.ID}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${selectedStoreId === store.ID
                      ? 'bg-amber-100 border-l-4 border-amber-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  onClick={() => handleSidebarStoreClick(store)}
                >
                  {store.CoverImageURL && (
                    <img
                      src={store.CoverImageURL}
                      alt={store.StoreName}
                      className='w-full h-24 object-cover rounded-md mb-2'
                    />
                  )}
                  <h3 className='font-medium text-lg'>{store.StoreName}</h3>
                  <p className='text-gray-600 text-sm mt-1'>{store.Address}</p>
                  <p className='text-gray-500 text-sm'>
                    {store.Ward}, {store.District}, {store.Province}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Map container */}
          <div className='lg:w-2/3 h-[600px] bg-white rounded-lg shadow-md overflow-hidden'>
            <MapBoxByStore stores={mapstore} onStoreSelect={handleStoreSelect} />
          </div>
        </div>
      )}
    </div>
  )
}

export default Discover
