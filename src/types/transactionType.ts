// Transaction Status Enum
export type TransactionStatus =
  | 'Pending'     // Chờ thanh toán (Banking)
  | 'Completed'   // Đã hoàn thành (COD)
  | 'Failed'      // Thất bại
  | 'Cancelled'   // Đã hủy

// Transaction interface
export interface Transaction {
  id: string
  userId: string
  orderId: string
  paymentMethod: string
  payosOrderCode: string
  checkoutUrl: string
  description: string
  amount: number
  status: TransactionStatus
  createdAt: string
  updatedAt: string
  userEmail: string
  userFullName: string
  orderStatus: string
}

// Transaction Response interface (for list)
export interface TransactionResponse {
  status: number
  message: string
  data: Transaction[]
}

// Single Transaction Response interface (for detail)
export interface SingleTransactionResponse {
  status: number
  message: string
  data: Transaction
}

// Purchase Input interface
export interface PurchaseInput {
  orderIds: string[]
}

// Transaction Query Parameters
export interface TransactionQueryParams {
  pageSize?: number
  pageNumber?: number
  userId?: string
  orderId?: string
  status?: TransactionStatus
  paymentMethod?: string
  fromDate?: string
  toDate?: string
  sortBy?: 'createdAt' | 'amount' | 'status'
  sortOrder?: 'asc' | 'desc'
}

// Transaction List Response interface
export interface TransactionListResponse {
  status: number
  message: string
  data: Transaction[]
  pagination: {
    pageSize: number
    pageNumber: number
    totalItems: number
    totalPages: number
  }
}
