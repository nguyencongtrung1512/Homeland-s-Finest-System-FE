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

// API functions
export const adminApi = {
  // Lấy danh sách tất cả staff
  getAllStaff: async (): Promise<StaffListResponse> => {
    const response = await axiosInstance.get(`${API_URL}/staff`)
    return response.data
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
      const response = await axiosInstance.get(`${API_URL}/combos`, { params })

      // Backend trả về array trực tiếp hoặc object có data property
      const data = Array.isArray(response.data) ? response.data : response.data?.data || []
      return data
    } catch (error) {
      console.error('getAllCombos API error:', error)
      throw error
    }
  }
}
