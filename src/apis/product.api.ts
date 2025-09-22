import axiosInstance from '../service/axiosInstance'
import type { Product, ProductCreateInput, ProductUpdateInput } from '../types'

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

// Query Parameters
export interface ProductQueryParams {
  page?: number
  pageNumber?: number // Swagger UI dùng pageNumber
  pageSize?: number
  search?: string
  categoryId?: string
  provinceId?: string
  storeId?: string
  typeProduct?: string
  status?: string
  isActive?: boolean
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'saleCount' | 'rating'
  sortOrder?: 'asc' | 'desc'
}

// Product API Functions
export const productApi = {
  // Get all products with pagination and filters
  getAll: async (params?: ProductQueryParams): Promise<ProductListResponse> => {
    console.log('API Request params:', params)
    const response = await axiosInstance.get(API_URL, { params })
    console.log('API Response:', response)
    return response as unknown as ProductListResponse
  },

  // Get product by ID
  getById: async (id: string): Promise<ProductResponse> => {
    const response = await axiosInstance.get(`${API_URL}/${id}`)
    return response as unknown as ProductResponse
  },

  // Create new product
  create: async (data: ProductCreateInput): Promise<ProductResponse> => {
    const response = await axiosInstance.post(API_URL, data)
    return response as unknown as ProductResponse
  },

  // Update product
  update: async (id: string, data: ProductUpdateInput): Promise<ProductResponse> => {
    const response = await axiosInstance.put(`${API_URL}/${id}`, data)
    return response as unknown as ProductResponse
  },

  // Delete product
  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.delete(`${API_URL}/${id}`)
    return response as unknown as ApiResponse<null>
  },

  // Get products by store
  getByStore: async (storeId: string, params?: Omit<ProductQueryParams, 'storeId'>): Promise<ProductListResponse> => {
    const response = await axiosInstance.get(`${API_URL}/store/${storeId}`, { params })
    return response as unknown as ProductListResponse
  },

  // Get products by category
  getByCategory: async (
    categoryId: string,
    params?: Omit<ProductQueryParams, 'categoryId'>
  ): Promise<ProductListResponse> => {
    const response = await axiosInstance.get(`${API_URL}/category/${categoryId}`, { params })
    return response as unknown as ProductListResponse
  },

  // Get products by province
  getByProvince: async (
    provinceId: string,
    params?: Omit<ProductQueryParams, 'provinceId'>
  ): Promise<ProductListResponse> => {
    const response = await axiosInstance.get(`${API_URL}/province/${provinceId}`, { params })
    return response as unknown as ProductListResponse
  },

  // Search products
  search: async (query: string, params?: Omit<ProductQueryParams, 'search'>): Promise<ProductListResponse> => {
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
  }
}

export default productApi
