import axiosInstance from '../service/axiosInstance'

const API_URL = `/Staff`

export interface AssignedStore {
  id: string
  sellerId: string
  storeName: string
  sellerName: string
  address: string
  logoUrl: string | null
  coverImageUrl: string | null
  status: 'ReviewedByStaff' | 'Processing'
  staffNote: string | null
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

// Interface cho sản phẩm cần review
export interface ProductForReview {
  id: string
  storeId: string
  provinceId: number
  editedById: string | null
  name: string
  description: string
  productImages: string[]
  productVideo: string | null
  categoryIds: string[]
  material: string
  saleCount: number
  rating: number
  reviewCount: number
  isActive: boolean
  typeProduct: string
  status: 'Pending' | 'Approved' | 'Rejected'
  staffNote: string | null
  comboItems: any | null
  createdAt: string
  updatedAt: string | null
}

export interface ProductsForReviewResponse {
  status: number
  message: string
  data: ProductForReview[]
  pagination?: {
    pageSize: number
    pageNumber: number
    totalItems: number
    totalPages: number
  }
}

export interface ProductsForReviewParams {
  pageSize?: number
  pageNumber?: number
  status?: string
  search?: string
}

export interface ReviewStoreRequest {
  NewStatus: 'ReviewedByStaff'
  StaffNotes: string
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
    reviewedAt: string
  }
}

// Interface cho review sản phẩm
export interface ReviewProductRequest {
  newStatus: 'Approved' | 'Rejected' | 'Pending'
  staffNote?: string
}

export interface ReviewProductResponse {
  status: number
  message: string
  data?: {
    productId: string
    newStatus: string
    reviewedAt: string
    note?: string
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

  // Lấy danh sách sản phẩm cần review của staff
  getProductsForReview: async (staffId: string, params?: ProductsForReviewParams): Promise<any> => {
    const queryParams = new URLSearchParams()

    if (params?.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString())
    }

    if (params?.pageNumber) {
      queryParams.append('pageNumber', params.pageNumber.toString())
    }

    if (params?.status) {
      queryParams.append('status', params.status)
    }

    if (params?.search) {
      queryParams.append('search', params.search)
    }

    const url = `${API_URL}/${staffId}/products-for-review${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

    const response = await axiosInstance.get(url)

    return response
  },

  reviewStore: async (
    storeId: string,
    reviewData: ReviewStoreRequest & { selectedImages?: File[] }
  ): Promise<ReviewStoreResponse> => {
    const formData = new FormData()

    formData.append('NewStatus', reviewData.NewStatus)
    formData.append('StaffNotes', reviewData.StaffNotes)

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
  },

  // Review sản phẩm
  reviewProduct: async (productId: string, reviewData: ReviewProductRequest): Promise<ReviewProductResponse> => {
    const formData = new FormData()

    formData.append('newStatus', reviewData.newStatus)
    formData.append('staffNote', reviewData.staffNote || '')

    const response = await axiosInstance.put(`${API_URL}/Product/${productId}/review`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  }
}
