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
  provinceId: number | null
  districtId: number | null
  wardId: number | null
  address: string
  targetProvinceName: string | null
  targetProvinceId: number | null
  logoUrl: string | null
  coverImageUrl: string | null
  status: 'Approved' | 'Pending' | 'Rejected' | 'Inactive' | 'Processing' | 'ApprovedByStaff' | 'RejectedByStaff'
  adminNote: string | null
  reviewedBy: string | null
  approvedBy: string | null
  description: string | null
  vendorApplicationImageUrl: string[]
  staffNotes: string | null
  staffImage: string | null
  staffName: string | null
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
  storeStories: unknown[]
  products: unknown[]
}

// Interface cho API response wrapper
export interface StoreApiResponse {
  status: number
  message: string
  data: StoreResponse
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

// Interface cho filter stores by location params
export interface StoreFilterByLocationParams {
  provinceId?: number
  region?: string
  provinceName?: string
  locationFilter?: 'Local' | 'Other'
  termName?: string
  pageSize?: number
  pageNumber?: number
}

// Interface cho StoreLocationDTO (response từ filter-by-location API)
export interface StoreLocationDTO {
  id: string
  storeName: string
  logo: string
  coverImage: string
  province: string
  district: string
  ward: string
  address: string
  description: string
  provinceId?: number | null
  targetProvinceId?: number | null
  // Toạ độ cửa hàng từ backend (ưu tiên dùng cho Mapbox)
  lat?: string | null
  lng?: string | null
}

// Interface cho StoreLocationListResponse (response từ filter-by-location API)
export interface StoreLocationListResponse {
  status: number
  message: string
  data: StoreLocationDTO[]
  pagination?: {
    pageNumber: number
    pageSize: number
    totalItems: number
  }
}

// Interface cho Store Product Item DTO (response từ API)
export interface StoreProductItemDTO {
  id: string
  type: 'Product' | 'Combo'
  name: string
  description?: string
  price: number
  imageUrl: string
  saleCount: number
  rating: number
  reviewCount: number
  soldOut: boolean
  hashtagIds?: string[]
  createdAt: string
}

// Interface cho Store Products Request params
export interface StoreProductsRequest {
  pageSize?: number
  pageNumber?: number
  productType?: 'Product' | 'Combo' | null
  hashtagIds?: string[]
  sortBy?: 'popular' | 'newest' | 'price-low' | 'price-high'
  name?: string
}

// Interface cho Store Products Response
export interface StoreProductsResponse {
  status: number
  message: string
  data: StoreProductItemDTO[]
  pagination: {
    pageSize: number
    pageNumber: number
    totalItems: number
    totalPages: number
  }
}

// Interface cho Category Product
export interface CategoryProduct {
  id: string
  imageUrl: string
  name: string
}

// Interface cho Store Category
export interface StoreCategory {
  categoryId: string
  categoryName: string
  products: CategoryProduct[]
}

// Interface cho Store Categories Response
export interface StoreCategoriesResponse {
  status: number
  message: string
  data: StoreCategory[]
}

// API function để lấy danh sách store
export const storeApi = {
  // Lấy danh sách tất cả stores
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
  getStoreById: async (storeId: string): Promise<any> => {
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
  },

  // Cập nhật thông tin store theo seller ID
  updateStoreBySeller: async (
    sellerId: string,
    formData: FormData
  ): Promise<{ status: number; message: string; data: StoreResponse }> => {
    return await axiosInstance.put(`/Store/by-seller/${sellerId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // Filter stores by location
  filterStoresByLocation: async (params: StoreFilterByLocationParams): Promise<StoreLocationListResponse> => {
    const queryParams = new URLSearchParams()

    if (params.provinceId !== undefined && params.provinceId !== null) {
      queryParams.append('provinceId', params.provinceId.toString())
    }
    if (params.locationFilter) {
      queryParams.append('locationFilter', params.locationFilter)
    }
    if (params.region) {
      queryParams.append('region', params.region)
    }
    if (params.provinceName) {
      queryParams.append('provinceName', params.provinceName)
    }
    if (params.termName) {
      queryParams.append('termName', params.termName)
    }
    if (params.pageSize !== undefined) {
      queryParams.append('pageSize', params.pageSize.toString())
    }
    if (params.pageNumber !== undefined) {
      queryParams.append('pageNumber', params.pageNumber.toString())
    }

    const url = `/Store/filter-by-location${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

    return await axiosInstance.get(url)
  },

  // Get store products with filters
  getStoreProducts: async (storeId: string, params?: StoreProductsRequest): Promise<StoreProductsResponse> => {
    const queryParams: any = {}

    if (params?.pageSize !== undefined) {
      queryParams.pageSize = params.pageSize
    }
    if (params?.pageNumber !== undefined) {
      queryParams.pageNumber = params.pageNumber
    }
    if (params?.productType) {
      queryParams.productType = params.productType
    }
    if (params?.hashtagIds && params.hashtagIds.length > 0) {
      // Axios will handle array params as hashtagIds[]=id1&hashtagIds[]=id2
      queryParams.hashtagIds = params.hashtagIds
    }
    if (params?.sortBy) {
      queryParams.sortBy = params.sortBy
    }
    if (params?.name) {
      queryParams.name = params.name
    }

    return await axiosInstance.get(`/Store/${storeId}/products`, { params: queryParams })
  },

  // Lấy danh sách categories và products của store
  getStoreCategories: async (storeId: string): Promise<StoreCategoriesResponse> => {
    return await axiosInstance.get(`/Store/${storeId}/categories`)
  }
}
