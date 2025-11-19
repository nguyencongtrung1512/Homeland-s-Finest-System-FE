import axiosInstance from '../service/axiosInstance'
import type { Combo } from '../types/combo.type'

const API_URL = `/Admin`
// Interface cho Staff
export interface Staff {
  staffId: string
  staffName: string
  email: string
  processingStoreCount: number
}

// Interface cho API response
export interface StaffListResponse {
  status: number
  message: string
  data: Staff[]
}

// Interface cho assign staff request
export interface AssignStaffRequest {
  staffId: string
}

// Interface cho assign staff response
export interface AssignStaffResponse {
  status: number
  message: string
  data?: {
    storeId: string
    storeName: string
    newStatus: string
    assignedStaffId: string
    assignedDate: string
  }
}

// Interface cho review store request
export interface ReviewStoreRequest {
  newStatus: 'Approved' | 'Rejected'
  adminFeedback?: string
}

export interface StatusStoreRequest {
  action: 'Approve' | 'Reject' | 'Ban' | 'Unban'
  reason: string
}

// Interface cho review store response
export interface ReviewStoreResponse {
  status: number
  message: string
  data?: {
    storeId: string
    storeStatus: string
    sellerUserId: string
    sellerStatus: string
    approvedByAdminId: string
    decisionDate: string
    adminFeedback: string
  }
}

// Interface cho combo admin params
export interface ComboAdminParams {
  status?: string
  staffId?: string
  storeId?: string
  pageSize?: number
  pageNumber?: number
}

// Interface cho Product Admin
export interface AdminProduct {
  id: string
  parentId: string | null
  storeId: string
  provinceId: number
  categoryId: string
  name: string
  description: string
  productImages: string[]
  videoPreviewUrl: string | null
  videoPlayBackUrl: string | null
  videoFallBackUrl: string | null
  attributeName: string | null
  attributeType: string | null
  productType: string
  material: string
  hashtagIds: string[]
  isActive: boolean
  status: 'Pending' | 'Processing' | 'Confirmed' | 'Cancelled' | 'Rejected' | 'Denied' | 'Approved'
  staffNote: string | null
  approvedBy: string | null
  assignedToId: string | null
  price: number | null
  saleCount: number | null
  rating: number | null
  reviewCount: number | null
  createdAt: string
  updatedAt: string
}

// Interface cho Product Admin params
export interface ProductAdminParams {
  status?: 'Pending' | 'Processing' | 'Confirmed' | 'Cancelled' | 'Rejected' | 'Denied' | 'Approved'
  staffId?: string
  storeId?: string
  pageSize?: number
  pageNumber?: number
  search?: string
}

// Interface cho Product Admin response
export interface ProductAdminResponse {
  status: number
  message: string
  data: AdminProduct[]
  pagination?: {
    pageSize: number
    pageNumber: number
    totalItems: number
    totalPages: number
  }
}

// API functions
export const adminApi = {
  // Lấy danh sách tất cả staff
  getAllStaff: async (): Promise<any> => {
    const response = await axiosInstance.get(`${API_URL}/staff`)
    return response
  },

  // Gán staff cho store
  assignStaffToStore: async (storeId: string, staffId: string): Promise<AssignStaffResponse> => {
    const response = await axiosInstance.put(`${API_URL}/Store/${storeId}/assign`, {
      staffId
    })

    // Accept both 200 and 202 as success statuses
    if (response.status === 200 || response.status === 202) {
      // The API response structure is { status, message, data }
      // We should return this directly as AssignStaffResponse
      return response.data as AssignStaffResponse
    } else {
      // If the API returns an error message in data, use it, otherwise a generic one
      throw new Error(response.data?.message || `API returned status ${response.status}`)
    }
  },

  // Admin duyệt review của staff
  reviewStore: async (storeId: string, reviewData: ReviewStoreRequest): Promise<ReviewStoreResponse> => {
    // Tạo FormData cho multipart/form-data
    const formData = new FormData()
    formData.append('newStatus', reviewData.newStatus)
    formData.append('adminFeedback', reviewData.adminFeedback || '')

    const response = await axiosInstance.put(`${API_URL}/Store/${storeId}/review`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    // Accept both 200 and 202 as success statuses
    if (response.status === 200 || response.status === 202) {
      return response.data as ReviewStoreResponse
    } else {
      throw new Error(response.data?.message || `API returned status ${response.status}`)
    }
  },
  statusStore: async (storeId: string, statusData: StatusStoreRequest): Promise<ReviewStoreResponse> => {
    const response = await axiosInstance.put(`${API_URL}/Store/${storeId}/status`, statusData, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Accept both 200 and 202 as success statuses
    if (response.status === 200 || response.status === 202) {
      return response.data as ReviewStoreResponse
    } else {
      throw new Error(response.data?.message || `API returned status ${response.status}`)
    }
  },

  // Lấy danh sách tất cả combo cho admin
  getAllCombos: async (params?: ComboAdminParams): Promise<Combo[]> => {
    try {
      // Backend ComboController endpoint: /api/Combo
      // Map params từ ComboAdminParams sang ComboParams format
      const comboParams: any = {
        pageSize: params?.pageSize,
        pageNumber: params?.pageNumber,
        storeId: params?.storeId
      }

      const response = await axiosInstance.get(`/Combo`, { params: comboParams })

      // Backend trả về ApiResponseWithPagination với structure:
      // { status, message, data: Combo[], pagination: {...} }
      // Lưu ý: axios interceptor đã trả về response.data rồi
      console.log('getAllCombos raw response:', response)

      // Response từ axios interceptor đã là response.data rồi
      // Nên response có thể là object { status, message, data, pagination }
      const data = Array.isArray(response) ? response : response?.data

      console.log('getAllCombos processed data:', data)
      return data
    } catch (error) {
      console.error('getAllCombos API error:', error)
      throw error
    }
  },

  // Lấy danh sách sản phẩm cho admin
  getProducts: async (params?: ProductAdminParams): Promise<any> => {
    const queryParams = new URLSearchParams()

    if (params?.status) {
      queryParams.append('Status', params.status)
    }

    if (params?.staffId) {
      queryParams.append('StaffId', params.staffId)
    }

    if (params?.storeId) {
      queryParams.append('StoreId', params.storeId)
    }

    if (params?.pageSize) {
      queryParams.append('PageSize', params.pageSize.toString())
    }

    if (params?.pageNumber) {
      queryParams.append('PageNumber', params.pageNumber.toString())
    }

    if (params?.search) {
      queryParams.append('Search', params.search)
    }

    const url = `${API_URL}/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

    const response = await axiosInstance.get(url)
    return response
  },

  // Gán nhân viên cho sản phẩm
  reassignProduct: async (productId: string, newStaffId: string): Promise<AssignStaffResponse> => {
    const response = await axiosInstance.patch(`${API_URL}/products/${productId}/reassign`, {
      newStaffId
    })
    return response.data
  }
}
