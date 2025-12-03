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

// Dashboard Types
export interface OverviewStats {
  totalRevenue: number
  totalOrders: number
  successfulOrders: number
  availableBalance: number
}

export interface OrderStatusDistribution {
  statusCounts: Record<string, number>
}

export interface SalesReport {
  labels: string[]
  data: number[]
}

export interface TopSellingProduct {
  productId: string
  productName: string
  totalSold: number
  thumbnailUrl: string
}

export interface LowStockProduct {
  productId: string
  productName: string
  variantName: string
  remainingQuantity: number
  thumbnailUrl: string
}

export interface PromotionStatistics {
  activePromotions: number
  expiringSoonPromotions: number
  totalUsage: number
}

export interface ProductRevenueItem {
  productId: string
  productVariantId: string
  productName: string
  variantName: string
  totalSold: number
  retailRevenue: number
  comboRevenue: number
  totalRevenue: number
}

export interface ProductRevenueReport {
  items: ProductRevenueItem[]
  totalItems: number
  pageNumber: number
  pageSize: number
}

// Request/Response Types
export interface ApiResponse<T> {
  status: number
  message: string
  data: T
}

export interface ApiResponseWithPagination<T> {
  status: number
  message: string
  data: T
  pagination: {
    pageNumber: number
    pageSize: number
    totalItems: number
  }
}

// Request Params Types
export interface SalesReportParams {
  period: 'month' | 'year' // Required: 'month' or 'year'
  year?: number // Required if period is 'year'
  month?: number // Required if period is 'month' (1-12)
}

export interface TopSellingProductsParams {
  limit?: number // Default: 5
  period?: string // Default: 'month'
}

export interface LowStockProductsParams {
  threshold?: number // Default: 10
  limit?: number // Default: 10
}

export interface ProductRevenueReportParams {
  fromDate?: string // DateTime format
  toDate?: string // DateTime format
  salesType?: 'All' | 'Retail' | 'Combo' // Default: 'All'
  sortBy?: 'Revenue' | 'Quantity' // Default: 'Revenue'
  pageNumber?: number // Default: 1
  pageSize?: number // Default: 20
}

export interface OrdersNeedingProcessingParams {
  pageSize?: number // Default: 10
  pageNumber?: number // Default: 1
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
    // axiosInstance interceptor đã trả về response.data, nên response ở đây đã là {status, message, data}
    const response = (await axiosInstance.get(url)) as unknown as DashboardFinanceResponse
    return response.data
  },

  // Cập nhật thông tin seller
  updateSeller: async (sellerId: string, formData: FormData): Promise<SellerDetailResponse> => {
    const response = await axiosInstance.put<SellerDetailResponse>(`${API_URL}/${sellerId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Gửi lại đơn đăng ký seller
  resubmitSellerApplication: async (userId: string, formData: FormData): Promise<any> => {
    const response = await axiosInstance.put(`${API_URL}/${userId}/ResubmitApplication`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response
  },

  // Lấy thống kê tổng quan dashboard
  getOverviewStats: async (): Promise<OverviewStats> => {
    // axiosInstance interceptor đã trả về response.data, nên response ở đây đã là {status, message, data}
    const response = (await axiosInstance.get(`${API_URL}/dashboard/overview`)) as ApiResponse<OverviewStats>
    return response.data
  },

  // Lấy phân bổ trạng thái đơn hàng
  getOrderStatusDistribution: async (): Promise<OrderStatusDistribution> => {
    // axiosInstance interceptor đã trả về response.data, nên response ở đây đã là {status, message, data}
    const response = (await axiosInstance.get(
      `${API_URL}/dashboard/order-status-distribution`
    )) as ApiResponse<OrderStatusDistribution>
    return response.data
  },

  // Lấy danh sách đơn hàng cần xử lý
  getOrdersNeedingProcessing: async (
    params?: OrdersNeedingProcessingParams
  ): Promise<ApiResponseWithPagination<any[]>> => {
    const queryParams = new URLSearchParams()

    if (params?.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString())
    }
    if (params?.pageNumber) {
      queryParams.append('pageNumber', params.pageNumber.toString())
    }

    const url = `${API_URL}/dashboard/orders-needing-processing${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await axiosInstance.get<ApiResponseWithPagination<any[]>>(url)
    return response as any
  },

  // Lấy báo cáo doanh thu
  getSalesReport: async (params: SalesReportParams): Promise<SalesReport> => {
    const queryParams = new URLSearchParams()

    queryParams.append('period', params.period)

    if (params.year) {
      queryParams.append('year', params.year.toString())
    }
    if (params.month) {
      queryParams.append('month', params.month.toString())
    }

    const url = `${API_URL}/dashboard/sales-report?${queryParams.toString()}`
    // axiosInstance interceptor đã trả về response.data, nên response ở đây đã là {status, message, data}
    const response = (await axiosInstance.get(url)) as ApiResponse<SalesReport>
    return response.data
  },

  // Lấy danh sách sản phẩm bán chạy
  getTopSellingProducts: async (params?: TopSellingProductsParams): Promise<TopSellingProduct[]> => {
    const queryParams = new URLSearchParams()

    if (params?.limit) {
      queryParams.append('limit', params.limit.toString())
    }
    if (params?.period) {
      queryParams.append('period', params.period)
    }

    const url = `${API_URL}/dashboard/top-selling-products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    // axiosInstance interceptor đã trả về response.data, nên response ở đây đã là {status, message, data}
    const response = (await axiosInstance.get(url)) as ApiResponse<TopSellingProduct[]>
    return response.data
  },

  // Lấy danh sách sản phẩm sắp hết hàng
  getLowStockProducts: async (params?: LowStockProductsParams): Promise<LowStockProduct[]> => {
    const queryParams = new URLSearchParams()

    if (params?.threshold) {
      queryParams.append('threshold', params.threshold.toString())
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString())
    }

    const url = `${API_URL}/dashboard/low-stock-products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    // axiosInstance interceptor đã trả về response.data, nên response ở đây đã là {status, message, data}
    const response = (await axiosInstance.get(url)) as ApiResponse<LowStockProduct[]>
    return response.data
  },

  // Lấy thống kê khuyến mãi
  getPromotionStatistics: async (): Promise<PromotionStatistics> => {
    // axiosInstance interceptor đã trả về response.data, nên response ở đây đã là {status, message, data}
    const response = (await axiosInstance.get(
      `${API_URL}/dashboard/promotion-statistics`
    )) as ApiResponse<PromotionStatistics>
    return response.data
  },

  // Lấy báo cáo doanh thu theo sản phẩm
  getProductRevenueReport: async (params?: ProductRevenueReportParams): Promise<ProductRevenueReport> => {
    const queryParams = new URLSearchParams()

    if (params?.fromDate) {
      queryParams.append('fromDate', params.fromDate)
    }
    if (params?.toDate) {
      queryParams.append('toDate', params.toDate)
    }
    if (params?.salesType) {
      queryParams.append('salesType', params.salesType)
    }
    if (params?.sortBy) {
      queryParams.append('sortBy', params.sortBy)
    }
    if (params?.pageNumber) {
      queryParams.append('pageNumber', params.pageNumber.toString())
    }
    if (params?.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString())
    }

    const url = `${API_URL}/finance-dashboard/product-revenue-report${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    // axiosInstance interceptor đã trả về response.data, nên response ở đây đã là {status, message, data}
    const response = (await axiosInstance.get(url)) as unknown as ApiResponse<ProductRevenueReport>
    return response.data
  }
}
