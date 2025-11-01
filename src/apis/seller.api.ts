import axiosInstance from '../service/axiosInstance'

const API_URL = `/Seller`

// Interface cho thông tin seller
export interface SellerInfo {
  id: string
  email: string
  gender: string
  phoneNumber: string
  role: string
  firstName: string
  lastName: string
  avatar: string
  isActive: boolean
  note: string
  dateOfBirth: string
  isPermission: boolean
  approvedBy: string
  editedById: string | null
  businessName: string
  businessLicense: string
  identifyCard: string
  taxCode: string
  bankAccount: string | null
  approvedAt: string
  createdAt: string
  updatedAt: string
  reportCount: number
}

export interface SellerDetailResponse {
  status: number
  message: string
  data: SellerInfo
}

export interface SellersListResponse {
  status: number
  message: string
  data: SellerInfo[]
}

export interface SellersListParams {
  pageSize?: number
  pageNumber?: number
  search?: string
  isActive?: boolean
}

export const sellerApi = {
  // Lấy danh sách tất cả seller (backend trả về tất cả, frontend tự phân trang)
  getAllSellers: async (params?: SellersListParams): Promise<SellersListResponse> => {
    const queryParams = new URLSearchParams()

    // Luôn lấy tất cả sellers từ backend (pageSize = 0)
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

  // Lấy thông tin chi tiết seller theo ID
  getSellerDetail: async (sellerId: string): Promise<any> => {
    const response = await axiosInstance.get(`${API_URL}/${sellerId}`)
    return response
  }
}
