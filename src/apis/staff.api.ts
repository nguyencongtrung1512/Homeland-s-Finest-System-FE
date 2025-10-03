import axiosInstance from '../service/axiosInstance'

const API_URL = `/Staff`

export interface AssignedStore {
  id: string
  sellerId: string
  storeName: string
  address: string
  logoUrl: string | null
  coverImageUrl: string | null
  status: 'ReviewedByStaff' | 'Processing'
  note: string | null
  history: string | null
  createdAt: string
  updatedAt: string
}

export interface AssignedStoresResponse {
  status: number
  message: string
  data: AssignedStore[]
}

export interface AssignedStoresParams {
  pageSize?: number
  pageNumber?: number
}

export interface ReviewStoreRequest {
  NewStatus: 'ReviewedByStaff'
  StaffNotes: string
  StaffFeedback: string
  StaffImages?: string[]
}

export interface ReviewStoreResponse {
  status?: number
  message?: string
  storeId?: string
  newStatus?: string
  reviewedByStaffId?: string
  decisionDate?: string
  data?: {
    storeId: string
    newStatus: string
    staffNotes: string
    staffFeedback: string
    reviewedAt: string
  }
}

export const staffApi = {
  getAssignedStores: async (staffId: string, params?: AssignedStoresParams): Promise<AssignedStoresResponse> => {
    const queryParams = new URLSearchParams()

    if (params?.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString())
    }

    if (params?.pageNumber) {
      queryParams.append('pageNumber', params.pageNumber.toString())
    }

    const url = `${API_URL}/assigned-stores/${staffId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    
    const response = await axiosInstance.get(url)
    return response.data
  },

  reviewStore: async (storeId: string, reviewData: ReviewStoreRequest & { selectedImages?: File[] }): Promise<ReviewStoreResponse> => {
    const formData = new FormData()
    
    formData.append('NewStatus', reviewData.NewStatus)
    formData.append('StaffNotes', reviewData.StaffNotes)
    formData.append('StaffFeedback', reviewData.StaffFeedback)
    
    if (reviewData.selectedImages && reviewData.selectedImages.length > 0) {
      reviewData.selectedImages.forEach((image) => {
        formData.append('StaffImages', image)
      })
    }
    
    const response = await axiosInstance.put(`${API_URL}/stores/${storeId}/review`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response.data
  }
}