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
  status: 'ApprovedByStaff' | 'RejectedByStaff' | 'Processing'
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
  comboItems: unknown | null
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
  NewStatus: 'ApprovedByStaff' | 'RejectedByStaff'
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
export interface ReviewProductRequest {
  status: 'Approved' | 'Rejected' | 'Pending'
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

// Interface cho thông tin staff
export interface StaffInfo {
  userId: string
  provinceId: number | null
  email: string
  phoneNumber: string
  role: string
  firstName: string
  lastName: string
  avatar: string
  isActive: boolean
  note: string | null
  dateOfBirth: string
  isPermission: boolean
  hireDate: string
  createdAt: string
  updatedAt: string
}

export interface StaffInfoResponse {
  status: number
  message: string
  data: StaffInfo
}

export interface StaffListResponse {
  status: number
  message: string
  data: StaffInfo[]
}

export interface StaffListParams {
  pageSize?: number
  pageNumber?: number
  search?: string
  isActive?: boolean
}

export const staffApi = {
  // Lấy danh sách tất cả staff (backend trả về tất cả, frontend tự phân trang)
  getAllStaff: async (params?: StaffListParams): Promise<StaffListResponse> => {
    const queryParams = new URLSearchParams()

    // Luôn lấy tất cả staff từ backend (pageSize = 0)
    queryParams.append('pageSize', '0')
    queryParams.append('pageNumber', '1')

    // Chỉ truyền search và isActive filter lên backend
    if (params?.search) {
      queryParams.append('search', params.search)
    }

    if (params?.isActive !== undefined) {
      queryParams.append('isActive', params.isActive.toString())
    }

    const url = `${API_URL}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

    const response = await axiosInstance.get(url)
    return response.data
  },

  getStaffInfo: async (staffId: string): Promise<any> => {
    const response = await axiosInstance.get(`${API_URL}/${staffId}`)
    return response
  },

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
  getProductsForReview: async (staffId: string, params?: ProductsForReviewParams): Promise<ProductsForReviewResponse> => {
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

    formData.append('Status', reviewData.status)
    formData.append('StaffNote', reviewData.staffNote || '')

    const response = await axiosInstance.put(`${API_URL}/Product/${productId}/review`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  }
}
