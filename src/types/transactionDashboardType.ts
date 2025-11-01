// Transaction Dashboard Types

export interface TransactionDashboardParams {
  StartDate: string
  EndDate: string
  Year: number
}

export interface RevenueByPaymentMethod {
  Banking: number
  COD: number
}

export interface RevenueByMonth {
  [key: string]: number
}

export interface RevenueByYear {
  [key: string]: number
}

export interface RevenueByCategoryPercentage {
  [key: string]: number
}

export interface RevenueByCategory {
  [key: string]: number
}

export interface TopStoreByRevenue {
  storeId: string
  storeName: string
  revenue: number
  orderCount: number
}

export interface TransactionSummary {
  totalRevenue: number
  totalTransactions: number
  successfulTransactions: number
  pendingTransactions: number
  failedTransactions: number
  revenueByPaymentMethod: RevenueByPaymentMethod
  revenueByMonth: RevenueByMonth
  transactionsByMonth: RevenueByMonth
  revenueByYear: RevenueByYear
  transactionsByYear: RevenueByYear
  revenueByCategoryPercentage: RevenueByCategoryPercentage
  revenueByCategory: RevenueByCategory
  topStoresByRevenue: TopStoreByRevenue[]
}

export interface Transaction {
  id: string
  userId: string
  orderId: string
  paymentMethod: string
  payosOrderCode: string
  checkoutUrl: string
  description: string
  amount: number
  status: 'Paid' | 'Pending' | 'Failed'
  createdAt: string
  updatedAt: string
  userEmail: string
  userFullName: string
  orderStatus: 'Processing' | 'Delivered' | 'Cancelled'
}

export interface TransactionDashboardResponse {
  status: number
  message: string
  data: {
    summary: TransactionSummary
    transactions: Transaction[]
    totalCount: number
    totalPages: number
    currentPage: number
  }
}

// Interface cho response sau khi qua axios interceptor (chỉ trả về data)
export interface TransactionDashboardData {
  summary: TransactionSummary
  transactions: Transaction[]
  totalCount: number
  totalPages: number
  currentPage: number
}

// Interface cho dữ liệu thống kê theo tháng
export interface MonthlyStatsData {
  storeRegistrationsByMonth: {
    [key: string]: number
  }
  successfulTransactionsByMonth: {
    [key: string]: number
  }
  cancelledTransactionsByMonth: {
    [key: string]: number
  }
}
