import axiosInstance from '../service/axiosInstance'
import type { Product, ProductUpdateInput, ProductVariant } from '../types'

const API_URL = `/Product`

// API Response Types
export interface ApiResponse<T> {
  status: number
  message: string
  data: T
}

export interface PaginationInfo {
  pageSize: number
  pageNumber: number
  totalItems: number
  totalPages: number
}

export interface ProductListResponse {
  status: number
  message: string
  data: Product[]
  pagination: PaginationInfo
}

export interface ProductResponse {
  status: number
  message: string
  data: Product
}

// Product for combo response type
export interface ProductForCombo {
  id: string
  name: string
  thumbnailUrl: string
  categoryName: string
}

export interface ProductForComboResponse {
  status: number
  message: string
  data: ProductForCombo[]
}

// Product SKU response type
export interface ProductSku {
  id: string
  name: string
  finalPrice: number
  quantity: number
  isActive: boolean
}

export interface ProductSkuResponse {
  status: number
  message: string
  data: ProductSku[]
}

// Form Data interface for creating product with files
export interface ProductCreateFormData {
  storeId: string
  // "ProductMaster" or "ProductDetail" - REQUIRED
  parentId?: string | null // Required if ProductType = ProductDetail, must be null if ProductMaster
  name: string
  categoryId?: string // Single category ID - NOT array
  description?: string
  material?: string
  productImages?: File[]
  productVideo?: File
  hashtagIds?: string[] // Optional array of hashtag IDs
}

// Product API Functions
export const productApi = {
  // Get all products with pagination and filters
  getAll: async (params?: any): Promise<ProductListResponse> => {
    console.log('API Request params:', params)
    const response = await axiosInstance.get(API_URL, { params })
    console.log('API Response:', response)
    return response as unknown as ProductListResponse
  },
  getTree: async (id: string): Promise<any> => {
    const response = await axiosInstance.get(`${API_URL}/${id}/Tree`)
    return response
  },
  // Get product by ID
  getById: async (id: string): Promise<any> => {
    const response = await axiosInstance.get(`${API_URL}/${id}`)
    return response
  },

  // Create new product with FormData (for file uploads)
  createMaster: async (data: ProductCreateFormData): Promise<ProductResponse> => {
    const formData = new FormData()

    // Required fields
    formData.append('StoreId', data.storeId)
    // "ProductMaster" or "ProductDetail"
    formData.append('Name', data.name)

    // Optional fields
    if (data.parentId !== undefined && data.parentId !== null) {
      formData.append('ParentId', data.parentId)
    }

    if (data.categoryId) {
      formData.append('CategoryId', data.categoryId)
    }

    if (data.description) {
      formData.append('Description', data.description)
    }

    if (data.material) {
      formData.append('Material', data.material)
    }

    // Add product images
    if (data.productImages && data.productImages.length > 0) {
      data.productImages.forEach((file) => {
        formData.append('ProductImages', file)
      })
    }

    // Add product video
    if (data.productVideo) {
      formData.append('ProductVideo', data.productVideo)
    }

    const response = await axiosInstance.post(`${API_URL}/CreateProduct`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response as unknown as ProductResponse
  },
  createDetail: async (data: ProductCreateFormData): Promise<ProductResponse> => {
    const formData = new FormData()

    // Required fields
    formData.append('StoreId', data.storeId)
    formData.append('Name', data.name)

    // Optional fields
    if (data.parentId !== undefined && data.parentId !== null) {
      formData.append('ParentId', data.parentId)
    }

    if (data.categoryId) {
      formData.append('CategoryId', data.categoryId)
    }

    if (data.description) {
      formData.append('Description', data.description)
    }

    if (data.material) {
      formData.append('Material', data.material)
    }

    // Add product images
    if (data.productImages && data.productImages.length > 0) {
      data.productImages.forEach((file) => {
        formData.append('ProductImages', file)
      })
    }

    // Add product video
    if (data.productVideo) {
      formData.append('ProductVideo', data.productVideo)
    }

    // Add hashtag IDs if provided
    if (data.hashtagIds && data.hashtagIds.length > 0) {
      data.hashtagIds.forEach((tagId, index) => {
        formData.append(`HashtagIds[${index}]`, tagId)
      })
    }

    const response = await axiosInstance.post(`${API_URL}/CreateProduct`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response as unknown as ProductResponse
  },

  // Update product
  update: async (id: string, data: ProductUpdateInput): Promise<ProductResponse> => {
    const response = await axiosInstance.put(`${API_URL}/${id}`, data)
    return response as unknown as ProductResponse
  },

  // Update product with FormData (for file uploads)
  updateWithFormData: async (id: string, formData: FormData): Promise<any> => {
    const response = await axiosInstance.put(`${API_URL}/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response
  },

  // Delete product (soft delete - sets IsActive to false)
  delete: async (id: string): Promise<any> => {
    const response = await axiosInstance.put(`${API_URL}/delete/${id}`)
    return response
  },

  // Get products by store
  getByStore: async (storeId: string, params?: Omit<any, 'storeId'>): Promise<ProductListResponse> => {
    const response = await axiosInstance.get(`${API_URL}/by-store/${storeId}`, { params })
    return response as unknown as ProductListResponse
  },

  // Get products by category
  getByCategory: async (categoryId: string, params?: Omit<any, 'categoryId'>): Promise<ProductListResponse> => {
    const response = await axiosInstance.get(`${API_URL}/category/${categoryId}`, { params })
    return response as unknown as ProductListResponse
  },

  // Get products by province
  getByProvince: async (provinceId: string, params?: Omit<any, 'provinceId'>): Promise<ProductListResponse> => {
    const response = await axiosInstance.get(`${API_URL}/province/${provinceId}`, { params })
    return response as unknown as ProductListResponse
  },

  // Search products
  search: async (query: string, params?: Omit<any, 'search'>): Promise<ProductListResponse> => {
    const response = await axiosInstance.get(`${API_URL}/search`, {
      params: { ...params, search: query }
    })
    return response as unknown as ProductListResponse
  },

  // Get featured products
  getFeatured: async (limit?: number): Promise<ProductListResponse> => {
    const response = await axiosInstance.get(`${API_URL}/featured`, {
      params: { limit }
    })
    return response as unknown as ProductListResponse
  },

  // Get trending products
  getTrending: async (limit?: number): Promise<ProductListResponse> => {
    const response = await axiosInstance.get(`${API_URL}/trending`, {
      params: { limit }
    })
    return response as unknown as ProductListResponse
  },

  // Update product status
  updateStatus: async (id: string, status: string): Promise<ProductResponse> => {
    const response = await axiosInstance.patch(`${API_URL}/${id}/status`, { status })
    return response as unknown as ProductResponse
  },

  // Update product active status
  updateActiveStatus: async (id: string, isActive: boolean): Promise<ProductResponse> => {
    const response = await axiosInstance.patch(`${API_URL}/${id}/active`, { isActive })
    return response as unknown as ProductResponse
  },

  getByProvinceName: async (
    provinceName: string,
    params?: { pageSize?: number; pageNumber?: number }
  ): Promise<ProductListResponse> => {
    const response = await axiosInstance.get(`${API_URL}/province/name/${encodeURIComponent(provinceName)}`, { params })
    return response as unknown as ProductListResponse
  },

  // Get all active product variants by store ID
  getAllActiveVariants: async (
    storeId: string,
    params?: { pageSize?: number; pageNumber?: number }
  ): Promise<ApiResponse<ProductVariant[]>> => {
    const response = await axiosInstance.get(`/ProductVavariant/get-all-activce/${storeId}`, { params })
    return response as unknown as ApiResponse<ProductVariant[]>
  },

  // Submit product (for seller)
  submit: async (id: string): Promise<any> => {
    const response = await axiosInstance.put(`${API_URL}/${id}/submit`)
    return response
  },

  // Cancel product (for seller)
  cancel: async (id: string): Promise<any> => {
    const response = await axiosInstance.put(`${API_URL}/${id}/cancel`)
    return response
  },

  // Get products for combo
  getForCombo: async (): Promise<ProductForComboResponse> => {
    const response = await axiosInstance.get(`${API_URL}/for-combo`)
    return response as unknown as ProductForComboResponse
  },

  // Get product SKUs by product ID
  getSkus: async (id: string): Promise<ProductSkuResponse> => {
    const response = await axiosInstance.get(`${API_URL}/${id}/skus`)
    return response as unknown as ProductSkuResponse
  }
}

export default productApi
