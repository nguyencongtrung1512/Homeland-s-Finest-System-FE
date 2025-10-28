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

// Form Data interface for creating product with files
export interface ProductCreateFormData {
  storeId: string
  provinceId: string
  name: string
  description: string
  categoryIds: string[]
  productImages?: File[]
  productVideo?: File
  material?: string
  saleCount?: number
  rating?: number
  reviewCount?: number
  isActive?: boolean
  typeProduct?: string
  status?: string
  note?: string
  storyTitle?: string
  storyDetail?: string
  certificateImages?: File[]
  storyVideo?: File
  storyImages?: File[]
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

  // Get product by ID
  getById: async (id: string): Promise<any> => {
    const response = await axiosInstance.get(`${API_URL}/${id}`)
    return response
  },

  // Create new product with FormData (for file uploads)
  create: async (data: ProductCreateFormData): Promise<ProductResponse> => {
    const formData = new FormData()

    // Add basic product info
    formData.append('StoreId', data.storeId)
    formData.append('ProvinceId', data.provinceId)
    formData.append('Name', data.name)
    formData.append('Description', data.description)

    // Fix: Properly handle categoryIds array
    console.log('🔍 DEBUG - Before processing categoryIds:', data.categoryIds)
    if (data.categoryIds && data.categoryIds.length > 0) {
      console.log('🔍 DEBUG - Processing categoryIds array...')
      data.categoryIds.forEach((categoryId, index) => {
        console.log(`🔍 DEBUG - Adding CategoryIds[${index}]: ${categoryId}`)
        formData.append(`CategoryIds[${index}]`, categoryId)
      })
    } else {
      console.log('🔍 DEBUG - No categoryIds to process or empty array')
    }

    // 🔍 DEBUG: Log FormData contents
    console.log('🔍 DEBUG - FormData entries:')
    for (const [key, value] of formData.entries()) {
      console.log(`🔍 DEBUG - FormData[${key}]:`, value)
    }

    if (data.material) formData.append('material', data.material)
    if (data.typeProduct) formData.append('TypeProduct', data.typeProduct)
    if (data.note) formData.append('Note', data.note)
    if (data.storyTitle) formData.append('StoryTitle', data.storyTitle)
    if (data.storyDetail) formData.append('StoryDetail', data.storyDetail)

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

    // Add certificate images
    if (data.certificateImages && data.certificateImages.length > 0) {
      data.certificateImages.forEach((file) => {
        formData.append('CertificateImages', file)
      })
    }

    // Add story video
    if (data.storyVideo) {
      formData.append('StoryVideo', data.storyVideo)
    }

    // Add story images
    if (data.storyImages && data.storyImages.length > 0) {
      data.storyImages.forEach((file) => {
        formData.append('StoryImages', file)
      })
    }

    const response = await axiosInstance.post(API_URL, formData, {
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
  updateWithFormData: async (id: string, formData: FormData): Promise<ProductResponse> => {
    const response = await axiosInstance.put(`${API_URL}/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response as unknown as ProductResponse
  },

  // Delete product
  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.delete(`${API_URL}/${id}`)
    return response as unknown as ApiResponse<null>
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
  }
}

export default productApi
