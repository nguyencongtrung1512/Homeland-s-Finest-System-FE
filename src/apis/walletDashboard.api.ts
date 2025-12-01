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
// DEFAULT EXPORT
// ========================================

export default {
  getWalletDashboard,
  getWalletMonthlyStats,
  getSellerDashboard
}

