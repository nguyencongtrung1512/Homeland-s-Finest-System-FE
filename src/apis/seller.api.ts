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

// Finance Dashboard Types
export interface WalletOverview {
  availableBalance: number
  pendingBalance: number
  debtBalance: number
  netAsset: number
}

export interface PerformanceMetrics {
  grossRevenue: number
  netIncome: number
  totalCommissionPaid: number
  profitMargin: number | null
}

export interface UpcomingPayout {
  payoutDate: string
  amount: number
  orderCount: number
}

export interface CashFlowForecast {
  upcomingPayouts: UpcomingPayout[]
  frozenAmount: number
}

export interface WalletTransactionDetail {
  id: string
  createdAt: string
  type: string
  typeCode: string
  amount: number
  balanceAfter: number
  orderId: string | null
  description: string
}

export interface TransactionHistory {
  items: WalletTransactionDetail[]
  totalItems: number
  pageNumber: number
  pageSize: number
}

export interface RevenueByDay {
  date: string
  netRevenue: number
  commission: number
}

export interface PaymentMethodStats {
  count: number
  totalAmount: number
}

export interface PaymentMethodDistribution {
  cod: PaymentMethodStats
  banking: PaymentMethodStats
}

export interface Charts {
  revenue30Days: RevenueByDay[]
  paymentMethodDistribution: PaymentMethodDistribution
}

export interface DashboardFinanceData {
  walletOverview: WalletOverview
  performanceMetrics: PerformanceMetrics
  cashFlowForecast: CashFlowForecast
  transactionHistory: TransactionHistory
  charts: Charts
}

export interface DashboardFinanceResponse {
  status: number
  message: string
  data: DashboardFinanceData
}

export interface FinanceDashboardParams {
  days?: number
  pageNumber?: number
  pageSize?: number
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
  },

  // Lấy dữ liệu dashboard finance
  getFinanceDashboard: async (params?: FinanceDashboardParams): Promise<DashboardFinanceData> => {
    const queryParams = new URLSearchParams()
    
    if (params?.days) {
      queryParams.append('days', params.days.toString())
    }
    if (params?.pageNumber) {
      queryParams.append('pageNumber', params.pageNumber.toString())
    }
    if (params?.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString())
    }

    const url = `${API_URL}/finance-dashboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await axiosInstance.get<DashboardFinanceResponse>(url)
    return response.data.data
  }
}
