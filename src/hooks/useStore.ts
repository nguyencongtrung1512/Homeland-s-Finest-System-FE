import { useState, useEffect } from 'react'
import { storeApi, type StoreResponse } from '../apis/store.api'

interface UseStoreReturn {
  store: StoreResponse | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export const useStore = (storeId: string | undefined): UseStoreReturn => {
  const [store, setStore] = useState<StoreResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStore = async () => {
    if (!storeId) {
      setError('Store ID is required')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await storeApi.getStoreById(storeId)
      console.log("data store", response)

      // Check if response has the expected structure
      if (response && typeof response === 'object') {
        // If response has a 'data' property, use it; otherwise use the response directly
        const storeData = 'data' in response ? (response as any).data : response
        setStore(storeData)
      } else {
        setError('Invalid response format')
      }
    } catch (err: any) {
      console.error('Error fetching store:', err)
      setError(err?.response?.data?.message || err?.message || 'Không thể tải thông tin cửa hàng')
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    fetchStore()
  }

  useEffect(() => {
    fetchStore()
  }, [storeId])

  return {
    store,
    loading,
    error,
    refetch
  }
}