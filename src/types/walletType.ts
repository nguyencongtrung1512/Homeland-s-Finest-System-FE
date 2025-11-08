/**
 * Loại người dùng thực hiện giao dịch wallet
 */
export type TransactionWalletUserType =
  | 'Seller' // Thực hiện luôn
  | 'Customer' // Đang chờ
  | 'System' // Liên quan về nợ

/**
 * Trạng thái giao dịch wallet
 */
export type TransactionWalletStatus =
  | 'Pending' // Đang chờ
  | 'Completed' // Hoàn thành
  | 'Cancel' // Đã hủy
  | 'Approved' // Đã duyệt
  | 'Rejected' // Đã từ chối
  | 'Disputed' // Đang tranh chấp

/**
 * Loại giao dịch wallet
 */
export type TransactionWalletType =
  | 'OrderPayment' // Customer trả tiền cho hệ thống giữ (gồm banking hoặc my wallet)
  | 'CustomerPayment' // Hệ thống nhận được tiền từ user
  | 'OrderBankingPending' // Khi seller shipping thì ra trạng thái seller đang chờ được nhận tiền khi đơn hàng thành công
  | 'OrderBankingCompleted' // Khi đơn hàng thành công (pending -> approved) vì đơn thành công thì đợi time hoặc customer đã nhận hàng rồi
  | 'OrderCodDebt' // Ghi nợ hoa hồng đơn khi đơn là COD cho seller khi nhận shipping
  | 'OrderCodPaid' // Ghi nhận seller chưa trả tiền hoa hồng
  | 'Deposit' // Nạp tiền
  | 'CommissionReceived' // Nhận hoa hồng
  | 'DebtPayment' // Trả nợ từ deposit
  | 'Withdrawal' // Rút tiền
  | 'PayDebt' // Trả nợ (user chủ động)
  | 'PayoutToSeller' // Thanh toán cho seller
  | 'RefundToCustomer' // Hệ thống trả tiền refund customer
  | 'Refund' // Customer nhận được tiền refund từ hệ thống

export interface WalletTransactionDTO {
  id: string
  walletId: string
  orderId: string
  transactionId: string
  type: TransactionWalletType
  amount: number
  balanceBefore: number
  balanceAfter: number
  status: TransactionWalletStatus
  description: string
  paymentMethod: string
  orderVerificationId: string
  billImages: string[]
  debtBefore: number
  debtAfter: number
  debtPaid: number
  processedBy: string
  processedByName: string
  processNote: string
  createdAt: string
  updatedAt: string
}

export interface WalletData {
  id: string
  userId: string
  userEmail: string
  userFullName: string
  userRole: string
  phoneNumber: string
  walletType: TransactionWalletUserType
  availableBalance: number
  pendingBalance: number
  debtBalance: number
  grossRevenue: number
  totalDiscount: number
  netRevenue: number
  totalCommissionPaid: number
  createdAt: string
  updatedAt: string
  walletTransactionDTOs: WalletTransactionDTO[]
}

export interface WalletResponse {
  status: number
  message: string
  data: WalletData
}

// ========================================
// CONSTANTS
// ========================================

export const TRANSACTION_WALLET_USER_TYPES: TransactionWalletUserType[] = ['Seller', 'Customer', 'System']

export const TRANSACTION_WALLET_STATUSES: TransactionWalletStatus[] = [
  'Pending',
  'Completed',
  'Cancel',
  'Approved',
  'Rejected',
  'Disputed'
]

export const TRANSACTION_WALLET_TYPES: TransactionWalletType[] = [
  'OrderPayment',
  'CustomerPayment',
  'OrderBankingPending',
  'OrderBankingCompleted',
  'OrderCodDebt',
  'OrderCodPaid',
  'Deposit',
  'CommissionReceived',
  'DebtPayment',
  'Withdrawal',
  'PayDebt',
  'PayoutToSeller',
  'RefundToCustomer',
  'Refund'
]
