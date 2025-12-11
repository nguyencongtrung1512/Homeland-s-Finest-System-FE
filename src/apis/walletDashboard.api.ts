import axiosInstance from '../service/axiosInstance'

const API_URL = '/wallet-dashboard'

// ========================================
// INTERFACES - Request Params
// ========================================

/**
 * Query parameters for GetWalletDashboard API
 */
export interface GetWalletDashboardParams {
  userId?: string // User ID (optional - tự động lấy từ token)
  userRole?: string // Role: Customer, Seller, Admin, Staff (optional - tự động lấy từ token)
  startDate?: string // Ngày bắt đầu (yyyy-MM-dd). VD: 2025-01-01
  endDate?: string // Ngày kết thúc (yyyy-MM-dd). VD: 2025-12-31
  year?: number // Năm (override startDate/endDate). VD: 2025
  page?: number // Trang hiện tại (default: 1)
  pageSize?: number // Số items/trang (default: 20, max: 100)
}

/**
 * Query parameters for GetWalletMonthlyStats API
 */
export interface GetWalletMonthlyStatsParams {
  userId?: string // User ID (optional - tự động lấy từ token)
  userRole?: string // Role (optional - tự động lấy từ token)
  year?: number // Năm (2000-2100). VD: 2025 (default: 2025)
}

/**
 * Query parameters for GetSellerDashboard API
 */
export interface GetSellerDashboardParams {
  year?: number // Năm (optional). VD: 2025
}

// ========================================
// INTERFACES - Response Types
// ========================================

/**
 * Wallet Transaction DTO
 */
export interface WalletTransactionDTO {
  id: string
  walletId: string
  orderId?: string
  transactionId?: string
  type: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  status?: string
  description?: string
  paymentMethod: string
  billImages?: string[]
  debtBefore?: number
  debtAfter?: number
  debtPaid?: number
  orderGrossRevenue?: number
  totalSellerDiscount?: number
  totalSystemDiscount?: number
  orderShipFee?: number
  orderInsurance?: number
  orderCommission?: number
  orderNetRevenue?: number
  createdAt?: string
  updatedAt?: string
}

/**
 * Customer Wallet Summary
 */
export interface CustomerWalletSummary {
  availableBalance: number
  totalWithdrawn: number
  totalDeposits: number
  totalSpent: number
  totalRefunded: number
  transactionCount: number
}

/**
 * Seller Wallet Summary - ĐẦY ĐỦ tất cả fields
 */
export interface SellerWalletSummary {
  // Current Balances
  availableBalance: number
  pendingBalance: number
  debtBalance: number

  // Revenue Breakdown
  grossRevenue: number
  totalSellerDiscount: number
  totalSystemDiscount: number
  netRevenue: number
  totalCommissionPaid: number
  netIncome: number
  totalWithdrawn: number

  // Period Statistics
  periodRevenue: number
  periodOrders: number
  periodWithdrawals: number
  periodCommission: number
  periodSellerDiscount: number
  periodSystemSupport: number

  // Charts
  revenueByMonth: Record<string, number> // Format: { "01": 5000000, "02": 8000000, ..., "12": 6000000 }
  ordersByMonth: Record<string, number> // Format: { "01": 50, "02": 80, ..., "12": 60 }

  transactionCount: number
}

/**
 * Seller Revenue Detail (for Top Sellers)
 */
export interface SellerRevenueDetail {
  sellerId: string
  sellerName: string
  sellerEmail: string
  storeName: string
  grossRevenue: number
  netRevenue: number
  totalCommissionPaid: number
  totalSellerDiscount: number
  totalSystemDiscount: number
  availableBalance: number
  pendingBalance: number
  debtBalance: number
  totalWithdrawn: number
}

/**
 * Admin Wallet Summary
 */
export interface AdminWalletSummary {
  // System Wallet
  systemAvailableBalance: number
  systemPendingBalance: number

  // Totals
  totalSellers: number
  totalCustomers: number
  totalSellerAvailableBalance: number
  totalSellerPendingBalance: number
  totalSellerDebtBalance: number
  totalCustomerBalance: number

  // Platform Revenue
  totalPlatformRevenue: number
  totalCommissionCollected: number
  totalSellerDiscountsGiven: number
  totalSystemDiscountsGiven: number

  // Period Statistics
  periodTransactionCount: number
  periodRevenue: number
  periodWithdrawals: number
  periodRefunds: number
  periodSellerDiscount: number
  periodSystemSupport: number

  // Charts
  revenueByMonth: Record<string, number>
  commissionByMonth: Record<string, number>
  sellerDiscountByMonth: Record<string, number>
  systemSupportByMonth: Record<string, number>

  // Top Sellers
  topSellersByRevenue: SellerRevenueDetail[]
}

/**
 * Wallet Dashboard Data
 */
export interface WalletDashboardData {
  customerSummary?: CustomerWalletSummary
  sellerSummary?: SellerWalletSummary
  adminSummary?: AdminWalletSummary
  transactions: WalletTransactionDTO[]
  totalCount: number
  totalPages: number
  currentPage: number
}

/**
 * Wallet Dashboard Response
 */
export interface WalletDashboardResponse {
  status: number
  message: string
  data: WalletDashboardData
}

/**
 * Wallet Monthly Stats Response
 */
export interface WalletMonthlyStatsResponse {
  // Customer
  spendingByMonth?: Record<string, number> // Format: { "01": 100000, "02": 150000, ..., "12": 80000 }
  depositsByMonth?: Record<string, number> // Format: { "01": 500000, "02": 0, ..., "12": 300000 }

  // Seller
  revenueByMonth?: Record<string, number> // Format: { "01": 5000000, "02": 8000000, ..., "12": 6000000 }
  ordersByMonth?: Record<string, number> // Format: { "01": 50, "02": 80, ..., "12": 60 }
  withdrawalsByMonth?: Record<string, number> // Format: { "01": 2000000, "02": 3000000, ..., "12": 2500000 }

  // Admin
  commissionByMonth?: Record<string, number>
  refundsByMonth?: Record<string, number>
}

// ========================================
// API FUNCTIONS
// ========================================

/**
 * Lấy dashboard ví tiền dựa theo Role (Customer/Seller/Admin)
 * GET /api/wallet-dashboard
 *
 * API này trả về dashboard KHÁC NHAU tùy theo role:
 * - Customer: Chỉ xem AvailableBalance, TotalWithdrawn, spending history
 * - Seller: Xem ĐẦY ĐỦ tất cả fields (Revenue, Commission, Debt, Pending)
 * - Admin: Xem tổng quan toàn hệ thống + Top Sellers
 *
 * User chỉ được xem wallet của chính mình (trừ Admin/Staff)
 */
export const getWalletDashboard = async (
  params?: GetWalletDashboardParams
): Promise<WalletDashboardResponse> => {
  const response = await axiosInstance.get<WalletDashboardResponse>(API_URL, {
    params: {
      userId: params?.userId,
      userRole: params?.userRole,
      startDate: params?.startDate,
      endDate: params?.endDate,
      year: params?.year,
      page: params?.page || 1,
      pageSize: params?.pageSize || 20
    }
  })

  return response.data as WalletDashboardResponse
}

/**
 * Lấy thống kê theo tháng cho biểu đồ (dựa theo Role)
 * GET /api/wallet-dashboard/monthly-stats
 *
 * Trả về data cho 12 tháng để vẽ biểu đồ:
 * - Customer: SpendingByMonth, DepositsByMonth
 * - Seller: RevenueByMonth, OrdersByMonth, WithdrawalsByMonth
 * - Admin: RevenueByMonth, CommissionByMonth, WithdrawalsByMonth, RefundsByMonth
 *
 * Tất cả 12 tháng đều có data (tháng nào không có sẽ là 0)
 */
export const getWalletMonthlyStats = async (
  params?: GetWalletMonthlyStatsParams
): Promise<WalletMonthlyStatsResponse> => {
  const response = await axiosInstance.get<WalletMonthlyStatsResponse>(`${API_URL}/monthly-stats`, {
    params: {
      userId: params?.userId,
      userRole: params?.userRole,
      year: params?.year || new Date().getFullYear()
    }
  })

  return response.data as WalletMonthlyStatsResponse
}

/**
 * [ADMIN ONLY] Xem dashboard của một seller cụ thể
 * GET /api/wallet-dashboard/seller/{sellerId}
 *
 * Cho phép Admin/Staff xem dashboard ĐẦY ĐỦ của bất kỳ seller nào
 */
export const getSellerDashboard = async (
  sellerId: string,
  params?: GetSellerDashboardParams
): Promise<WalletDashboardResponse> => {
  const response = await axiosInstance.get<WalletDashboardResponse>(
    `${API_URL}/seller/${sellerId}`,
    {
      params: {
        year: params?.year
      }
    }
  )

  return response.data as WalletDashboardResponse
}

// ========================================
// ADMIN DASHBOARD INTERFACES
// ========================================

/**
 * Admin Dashboard Overview Response
 */
export interface AdminDashboardResponse {
  totalOrder: number
  totalGrossRevenue: number
  totalProcessingOrder: number
  totalPromotionActive: number
  totalSystemDiscount: number
  totalUsedPromotion: number
  totalUserPromotionOrder: number
}

/**
 * Revenue Chart Response (Monthly Revenue)
 */
export interface RevenueChartResponse {
  revenueByMonth: Record<string, number> // Format: { "T1": 5000000, "T2": 8000000, ..., "T12": 6000000 }
}

/**
 * Store Admin Revenue Response (Top Stores)
 */
export interface StoreAdminRevenueResponse {
  storeId: string
  storeName: string
  storeStatus: string
  sellerUserId: string
  sellerFullName: string
  sellerStatus: string
  totalRevenues: number
}

/**
 * API Response Wrapper
 */
export interface ApiResponse<T> {
  status: number
  message: string
  data: T
}

// ========================================
// ADMIN DASHBOARD API FUNCTIONS
// ========================================

/**
 * Lấy thông tin tổng quan dashboard cho Admin
 * GET /api/wallet-dashboard/Admin
 */
export const getAdminDashboard = async (): Promise<ApiResponse<AdminDashboardResponse>> => {
  const response = await axiosInstance.get<ApiResponse<AdminDashboardResponse>>(
    `${API_URL}/Admin`
  )
  // axiosInstance interceptor đã trả về response.data, nên response ở đây đã là {status, message, data}
  return response as any
}

/**
 * Lấy doanh thu theo tháng trong năm
 * GET /api/wallet-dashboard/Admin/revenue-monthly?year=2025
 */
export const getMonthlyRevenue = async (
  year?: number
): Promise<ApiResponse<RevenueChartResponse>> => {
  const response = await axiosInstance.get<ApiResponse<RevenueChartResponse>>(
    `${API_URL}/Admin/revenue-monthly`,
    {
      params: {
        year: year || new Date().getFullYear()
      }
    }
  )
  // axiosInstance interceptor đã trả về response.data, nên response ở đây đã là {status, message, data}
  return response as any
}

/**
 * Lấy danh sách cửa hàng có doanh thu cao nhất
 * GET /api/wallet-dashboard/top-stores?topCount=10&year=2025
 * 
 * @param topCount - Số lượng cửa hàng cần lấy (mặc định: 10)
 * @param year - Năm cần xem (optional)
 */
export const getTopStores = async (
  topCount: number = 10,
  year?: number
): Promise<ApiResponse<StoreAdminRevenueResponse[]>> => {
  const response = await axiosInstance.get<ApiResponse<StoreAdminRevenueResponse[]>>(
    `${API_URL}/top-stores`,
    {
      params: {
        topCount,
        ...(year && { year })
      }
    }
  )
  // axiosInstance interceptor đã trả về response.data, nên response ở đây đã là {status, message, data}
  return response as any
}

/**
 * Lấy danh sách cửa hàng đang chờ duyệt (status Pending)
 * GET /api/wallet-dashboard/Admin/processing-stores
 */
export const getProcessingStores = async (): Promise<ApiResponse<any[]>> => {
  const response = await axiosInstance.get<ApiResponse<any[]>>(
    `${API_URL}/Admin/processing-stores`
  )
  // axiosInstance interceptor đã trả về response.data, nên response ở đây đã là {status, message, data}
  return response as any
}

// ========================================
// STAFF DASHBOARD INTERFACES
// ========================================

/**
 * Staff Dashboard Overview Response
 */
export interface StaffDashboardResponse {
  TotalGrossRevenue: number
  TotalTransaction: number
  TotalSuccessTransaction: number
  TotalCancelTransaction: number
  TotalPendingTransaction: number
}

/**
 * Store Registration Chart Response
 */
export interface StoreRegistrationChartResponse {
  Year: number
  StoreCountByMonth: Record<string, number> // Format: { "T1": 15, "T2": 23, ..., "T12": 29 }
}

/**
 * Region Stats
 */
export interface RegionStats {
  StoreCount: number
  Percentage: number
}

/**
 * Store Region Distribution Response
 */
export interface StoreRegionDistributionResponse {
  North: RegionStats // Miền Bắc
  Central: RegionStats // Miền Trung
  South: RegionStats // Miền Nam
  TotalStores: number
}

/**
 * Payment Method Stats
 */
export interface PaymentMethodStats {
  Revenue: number
  OrderCount: number
  Percentage: number // % so với tổng
}

/**
 * Payment Method Distribution Response
 */
export interface PaymentMethodDistributionResponse {
  Banking: PaymentMethodStats
  COD: PaymentMethodStats
  MyWallet: PaymentMethodStats
  TotalRevenue: number
  TotalOrders: number
}

/**
 * Admin Dashboard KPI Response
 */
export interface AdminDashboardKpiDTO {
  totalAvailableBalance: number
  pendingRequestCount: number
  processingBankAmount: number
  totalDebtReceivable: number
  totalDisbursed: number
  calculatedAt: string
}

// ========================================
// STAFF DASHBOARD API FUNCTIONS
// ========================================

/**
 * Lấy thông tin tổng quan dashboard cho Staff
 * GET /api/wallet-dashboard/Staff
 */
export const getStaffDashboard = async (): Promise<ApiResponse<StaffDashboardResponse>> => {
  const response = await axiosInstance.get<ApiResponse<StaffDashboardResponse>>(
    `${API_URL}/Staff`
  )
  // axiosInstance interceptor đã trả về response.data, nên response ở đây đã là {status, message, data}
  return response as any
}

/**
 * Lấy biểu đồ số lượng cửa hàng đăng ký (đã approved) theo tháng
 * GET /api/wallet-dashboard/Staff/store-registration-chart?year=2025
 */
export const getStoreRegistrationChart = async (
  year?: number
): Promise<ApiResponse<StoreRegistrationChartResponse>> => {
  const response = await axiosInstance.get<ApiResponse<StoreRegistrationChartResponse>>(
    `${API_URL}/Staff/store-registration-chart`,
    {
      params: {
        year: year || new Date().getFullYear()
      }
    }
  )
  // axiosInstance interceptor đã trả về response.data, nên response ở đây đã là {status, message, data}
  return response as any
}

/**
 * Lấy phân bổ cửa hàng theo 3 miền (Bắc, Trung, Nam)
 * GET /api/wallet-dashboard/Admin/store-region-distribution?year=2025
 * (Có thể dùng cho cả Admin và Staff)
 * 
 * @param year - Năm cần xem (optional)
 */
export const getStoreRegionDistribution = async (
  year?: number
): Promise<ApiResponse<StoreRegionDistributionResponse>> => {
  const response = await axiosInstance.get<ApiResponse<StoreRegionDistributionResponse>>(
    `${API_URL}/Admin/store-region-distribution`,
    {
      params: {
        ...(year && { year })
      }
    }
  )
  // axiosInstance interceptor đã trả về response.data, nên response ở đây đã là {status, message, data}
  return response as any
}

/**
 * Lấy phân bổ phương thức thanh toán (Banking, COD, MyWallet)
 * GET /api/wallet-dashboard/Admin/payment-method-distribution
 * 
 * @param year - Năm cần xem (nếu có, sẽ tự động convert thành startDate và endDate)
 * @param startDate - Ngày bắt đầu (yyyy-MM-dd hoặc ISO string). Nếu có year thì sẽ bị override. Nếu không có thì get all
 * @param endDate - Ngày kết thúc (yyyy-MM-dd hoặc ISO string). Nếu có year thì sẽ bị override. Nếu không có thì get all
 */
export const getPaymentMethodDistribution = async (
  year?: number,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<PaymentMethodDistributionResponse>> => {
  // Nếu có year, convert thành startDate và endDate
  let finalStartDate: string | undefined = startDate
  let finalEndDate: string | undefined = endDate

  if (year) {
    finalStartDate = `${year}-01-01T00:00:00.000Z`
    finalEndDate = `${year}-12-31T23:59:59.999Z`
  } else if (startDate && endDate) {
    // Convert date string to UTC ISO format
    // Nếu là yyyy-MM-dd format, convert sang UTC
    if (startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      finalStartDate = new Date(startDate + 'T00:00:00.000Z').toISOString()
    }
    if (endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      finalEndDate = new Date(endDate + 'T23:59:59.999Z').toISOString()
    }
  }

  // Chỉ gửi params nếu có giá trị (nếu không có thì get all)
  const params: Record<string, string> = {}
  if (finalStartDate) {
    params.startDate = finalStartDate
  }
  if (finalEndDate) {
    params.endDate = finalEndDate
  }

  const response = await axiosInstance.get<ApiResponse<PaymentMethodDistributionResponse>>(
    `${API_URL}/Admin/payment-method-distribution`,
    {
      params: Object.keys(params).length > 0 ? params : undefined
    }
  )
  // axiosInstance interceptor đã trả về response.data, nên response ở đây đã là {status, message, data}
  return response as any
}

/**
 * Lấy thống kê KPI cho Admin
 * GET /api/wallet-dashboard/Admin/kpi
 */
export const getAdminKpi = async (): Promise<ApiResponse<AdminDashboardKpiDTO>> => {
  const response = await axiosInstance.get<ApiResponse<AdminDashboardKpiDTO>>(
    `${API_URL}/Admin/kpi`
  )
  // axiosInstance interceptor đã trả về response.data, nên response ở đây đã là {status, message, data}
  return response as any
}

// ========================================
// DEFAULT EXPORT
// ========================================

export default {
  getWalletDashboard,
  getWalletMonthlyStats,
  getSellerDashboard,
  getAdminDashboard,
  getMonthlyRevenue,
  getTopStores,
  getProcessingStores,
  getStaffDashboard,
  getStoreRegistrationChart,
  getStoreRegionDistribution,
  getPaymentMethodDistribution,
  getAdminKpi
}

