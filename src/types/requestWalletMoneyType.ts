/**
 * Query parameters cho API RequestWalletMoney
 */
export interface RequestWalletMoneyQueryParams {
  pageSize?: number
  pageNumber?: number
  userId?: string
  orderId?: string
  type?: 'Withdrawal' | 'Refund' | 'Deposit' | string
  status?: 'Pending' | 'Completed' | 'Cancel' | string
}

/**
 * Request Wallet Money item - Yêu cầu rút tiền/nạp tiền/hoàn tiền
 */
export interface RequestWalletMoney {
  id: string
  walletId: string
  orderId: string | null
  userId: string
  userEmail: string
  userPhoneNumber: string
  type: string // 'Withdrawal' | 'Deposit' | 'Refund' | etc.
  amount: number
  bankAccount: string
  bankName: string
  accountHolderName: string
  status: string // 'Pending' | 'Completed' | 'Cancel'
  processedBy: string | null
  processNote: string | null
  processedAt: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Response từ API RequestWalletMoney
 */
export interface RequestWalletMoneyListResponse {
  status: number
  message: string
  data: RequestWalletMoney[]
  pagination?: {
    pageSize: number
    pageNumber: number
    totalItems: number
    totalPages: number
  }
}

/**
 * Response sau khi qua axios interceptor (chỉ trả về data)
 */
export interface RequestWalletMoneyListData {
  data: RequestWalletMoney[]
  pagination?: {
    pageSize: number
    pageNumber: number
    totalItems: number
    totalPages: number
  }
}

/**
 * Input để cập nhật yêu cầu rút tiền/nạp tiền/hoàn tiền
 */
export interface UpdateRequestWalletMoneyInput {
  note?: string
  status: 'Pending' | 'Completed' | 'Cancel' | string
}

/**
 * Response từ API update RequestWalletMoney
 */
export interface UpdateRequestWalletMoneyResponse {
  status: number
  message: string
  data: RequestWalletMoney
}
