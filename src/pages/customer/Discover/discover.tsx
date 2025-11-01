import { useState } from 'react'
import MapBoxByStore from '../../../components/Mapbox/mapBoxByStore'
// @ts-expect-error - No declaration file for data.js
import mapstore from './data.js'

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

  const handleStoreSelect = (store: Store) => {
    setSelectedStoreId(store.ID)
  }

  return (
    <div className='w-full h-screen'>
      {/* Map với list overlay bên trong */}
      <MapBoxByStore 
        stores={mapstore} 
        onStoreSelect={handleStoreSelect}
        selectedStoreId={selectedStoreId}
        onStoreIdChange={setSelectedStoreId}
      />
    </div>
  )
}

export default Discover