import { useState, useEffect, useRef, useCallback } from 'react'
import { storeApi, type StoreProductItemDTO, type StoreProductsRequest } from '../apis/store.api'

interface UseStoreProductsReturn {
  products: StoreProductItemDTO[]
  loading: boolean
  error: string | null
  pagination: {
    pageSize: number
    pageNumber: number
    totalItems: number
    totalPages: number
  }
  refetch: () => Promise<void>
}

export function useStoreProducts(
  storeId: string | undefined,
  params: StoreProductsRequest
): UseStoreProductsReturn {
  const [products, setProducts] = useState<StoreProductItemDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    pageSize: 0,
    pageNumber: 0,
    totalItems: 0,
    totalPages: 0
  })

  // Debounce timer ref for search query
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousNameRef = useRef<string | undefined>(params.name)
  // Use ref to store latest params to avoid closure issues
  const paramsRef = useRef<StoreProductsRequest>(params)
  paramsRef.current = params

  const fetchStoreProducts = useCallback(async () => {
    const currentParams = paramsRef.current

    if (!storeId) {
      setProducts([])
      setPagination({
        pageSize: 0,
        pageNumber: 0,
        totalItems: 0,
        totalPages: 0
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await storeApi.getStoreProducts(storeId, currentParams)
      setProducts(response.data || [])
      setPagination(
        response.pagination || {
          pageSize: currentParams.pageSize || 20,
          pageNumber: currentParams.pageNumber || 1,
          totalItems: 0,
          totalPages: 0
        }
      )
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách sản phẩm'
      console.error('Error fetching store products:', err)
      setError(errorMessage)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [storeId])

  // Extract hashtagIds string for dependency comparison
  const hashtagIdsString = params.hashtagIds?.join(',') || ''

  useEffect(() => {
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Check if only the name parameter changed
    const nameChanged = previousNameRef.current !== params.name
    previousNameRef.current = params.name

    // Debounce search query by 500ms only if name changed
    if (nameChanged && params.name !== undefined && params.name.trim() !== '') {
      debounceTimerRef.current = setTimeout(() => {
        fetchStoreProducts()
      }, 500)
    } else {
      // For other params or when name is cleared, fetch immediately
      fetchStoreProducts()
    }

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [
    storeId,
    params.pageSize,
    params.pageNumber,
    params.productType,
    hashtagIdsString,
    params.sortBy,
    params.name,
    fetchStoreProducts
  ])

  return {
    products,
    loading,
    error,
    pagination,
    refetch: fetchStoreProducts
  }
}

