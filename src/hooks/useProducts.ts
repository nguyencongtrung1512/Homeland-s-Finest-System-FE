import { useState, useEffect } from 'react'
import {
  productApi,
  type ProductListResponse,
  type ProductResponse
} from '../apis/product.api'
import type { Product } from '../types'

// Hook for getting products list
export const useProducts = (params?: any) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    pageSize: 0,
    pageNumber: 0,
    totalItems: 0,
    totalPages: 0
  })

  const fetchProducts = async (queryParams?: any) => {
    try {
      setLoading(true)
      setError(null)

      // Gửi API call giống hệt Swagger UI
      const apiParams = { ...(queryParams || params) }
      console.log('🚀 Fetching products with params (Swagger UI style):', apiParams)

      const response: ProductListResponse = await productApi.getAll(apiParams)
      console.log('✅ API Response:', response)

      setProducts(response.data)
      setPagination(response.pagination)
    } catch (err: any) {
      console.error('❌ Error fetching products:', err)
      // Handle different types of errors
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Không thể kết nối đến server. Đang hiển thị dữ liệu mẫu.')
      } else if (err.response?.status === 500) {
        setError('Lỗi server (OFFSET error). Đang hiển thị dữ liệu mẫu.')
      } else if (err.response?.status === 404) {
        setError('API endpoint không tồn tại. Đang hiển thị dữ liệu mẫu.')
      } else {
        setError('Có lỗi xảy ra. Đang hiển thị dữ liệu mẫu.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [
    params?.page,
    params?.pageNumber,
    params?.pageSize,
    params?.search,
    params?.categoryId,
    params?.provinceId,
    params?.storeId
  ])

  return {
    products,
    loading,
    error,
    pagination,
    refetch: fetchProducts
  }
}

// Hook for getting single product
export const useProduct = (id: string) => {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProduct = async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)
      const response: ProductResponse = await productApi.getById(id)
      setProduct(response.data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch product')
      console.error('Error fetching product:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProduct()
  }, [id])

  return {
    product,
    loading,
    error,
    refetch: fetchProduct
  }
}

// Hook for product mutations
export const useProductMutations = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createProduct = async (data: any) => {
    try {
      setLoading(true)
      setError(null)
      const response = await productApi.create(data)
      return response
    } catch (err: any) {
      setError(err.message || 'Failed to create product')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateProduct = async (id: string, data: any) => {
    try {
      setLoading(true)
      setError(null)
      const response = await productApi.update(id, data)
      return response
    } catch (err: any) {
      setError(err.message || 'Failed to update product')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await productApi.delete(id)
      return response
    } catch (err: any) {
      setError(err.message || 'Failed to delete product')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateProductStatus = async (id: string, status: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await productApi.updateStatus(id, status)
      return response
    } catch (err: any) {
      setError(err.message || 'Failed to update product status')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateProductActiveStatus = async (id: string, isActive: boolean) => {
    try {
      setLoading(true)
      setError(null)
      const response = await productApi.updateActiveStatus(id, isActive)
      return response
    } catch (err: any) {
      setError(err.message || 'Failed to update product active status')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductStatus,
    updateProductActiveStatus
  }
}

// Hook for featured products
export const useFeaturedProducts = (limit?: number) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response: ProductListResponse = await productApi.getFeatured(limit)
      setProducts(response.data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch featured products')
      console.error('Error fetching featured products:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeaturedProducts()
  }, [limit])

  return {
    products,
    loading,
    error,
    refetch: fetchFeaturedProducts
  }
}

// Hook for trending products
export const useTrendingProducts = (limit?: number) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTrendingProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response: ProductListResponse = await productApi.getTrending(limit)
      setProducts(response.data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trending products')
      console.error('Error fetching trending products:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrendingProducts()
  }, [limit])

  return {
    products,
    loading,
    error,
    refetch: fetchTrendingProducts
  }
}

// Hook for products by store
export const useProductsByStore = (storeId: string, params?: any) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    pageSize: 0,
    pageNumber: 0,
    totalItems: 0,
    totalPages: 0
  })

  const fetchProductsByStore = async () => {
    if (!storeId) return

    try {
      setLoading(true)
      setError(null)
      const response: ProductListResponse = await productApi.getByStore(storeId, params)
      setProducts(response.data)
      setPagination(response.pagination)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products by store')
      console.error('Error fetching products by store:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductsByStore()
  }, [storeId, params?.page, params?.pageSize])

  return {
    products,
    loading,
    error,
    pagination,
    refetch: fetchProductsByStore
  }
}

// Hook for product search
export const useProductSearch = (query: string, params?: any) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    pageSize: 0,
    pageNumber: 0,
    totalItems: 0,
    totalPages: 0
  })

  const searchProducts = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setProducts([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response: ProductListResponse = await productApi.search(searchQuery, params)
      setProducts(response.data)
      setPagination(response.pagination)
    } catch (err: any) {
      setError(err.message || 'Failed to search products')
      console.error('Error searching products:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (query) {
      searchProducts(query)
    }
  }, [query, params?.page, params?.pageSize])

  return {
    products,
    loading,
    error,
    pagination,
    search: searchProducts
  }
}
