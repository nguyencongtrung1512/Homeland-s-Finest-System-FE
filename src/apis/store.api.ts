import axiosInstance from '../service/axiosInstance'

// Interface cho Store response từ API
export interface StoreResponse {
  /** Thông tin cơ bản của cửa hàng */
  id: string
  sellerId: string
  storeName: string
  province: string
  district: string
  ward: string
  provinceId: number
  districtId: number
  wardId: number
  address: string
  logoUrl: string | null
  coverImageUrl: string | null
  status: 'ReviewedByStaff' | 'Approved' | 'Pending' | 'Rejected' | 'Active' | 'Inactive'
  adminNote: string | null
  reviewedBy: string | null 
  approvedBy: string | null
  vendorApplicationImageUrl: string[]
  staffNotes: string | null
  staffFeedback: string | null
  staffImage: string | null 
  submittedDate: string 
  decisionDate: string | null 
  createdAt: string
  updatedAt: string
  sellerInfo: {
    userId: string
    approvedBy: string | null
    businessName: string | null
    businessLicense: string | null
    identifyCard: string | null
    taxCode: string | null
    identifyFrontImage: string | null
    identifyBackImage: string | null
    sellerStatus: 'Active' | 'Inactive' | 'Pending'
    approvedAt: string | null
    reportCount: number
    userInfo: {
      id: string
      email: string
      gender: 'Male' | 'Female' | 'Other' | null
      phoneNumber: string | null
      role: 'Seller' | 'Admin' | 'User'
      firstName: string | null
      lastName: string | null
      bankAccount: string | null
      avatar: string | null
      isActive: boolean
      dateOfBirth: string | null
    }
  }
  storeStories: any[]
  products: any[]
}

export interface StoreListResponse {
  status: number
  message: string
  data: StoreResponse[]
}

// Interface cho pagination params
export interface StoreListParams {
  pageSize?: number
  pageNumber?: number
}

// API function để lấy danh sách store
export const storeApi = {
  // Lấy danh sách tất cả store
  getAllStores: async (params?: StoreListParams): Promise<StoreListResponse> => {
    const queryParams = new URLSearchParams()

    if (params?.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString())
    }

    if (params?.pageNumber) {
      queryParams.append('pageNumber', params.pageNumber.toString())
    }

    const url = `/Store${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

    return await axiosInstance.get(url)
  },

  // Lấy thông tin chi tiết một store
  getStoreById: async (storeId: string): Promise<StoreResponse> => {
    return await axiosInstance.get(`/Store/${storeId}`)
  },

  // Lấy thông tin store theo seller ID (userId)
  getStoreBySellerId: async (userId: string): Promise<{ status: number; message: string; data: StoreResponse }> => {
    return await axiosInstance.get(`/Store/${userId}/Seller`)
  },

  // Cập nhật trạng thái store
  updateStoreStatus: async (
    storeId: string,
    status: string,
    note?: string
  ): Promise<{ status: number; message: string }> => {
    return await axiosInstance.put(`/Store/${storeId}/status`, {
      status,
      note
    })
  }
}
