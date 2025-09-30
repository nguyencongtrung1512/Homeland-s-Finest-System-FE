import axiosInstance from '../service/axiosInstance'

// Interface cho Store response từ API
export interface StoreResponse {
  id: string
  sellerId: string
  storeName: string
  address: string
  logoUrl: string
  coverImageUrl: string
  status: 'Approved' | 'Pending' | 'Rejected' | 'Locked'
  note: string
  history: string | null
  createdAt: string
  updatedAt: string
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
