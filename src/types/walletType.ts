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
  | 'SystemDiscountCompensation' // Seller nhận tiền bù SystemDiscount từ Platform
  | 'SystemDiscountCompensationPayout' // Platform trả tiền bù SystemDiscount
  | 'PayDebt' // Trả nợ (user chủ động)
  | 'PayoutToSeller' // Thanh toán cho seller
  | 'RefundToCustomer' // Hệ thống trả tiền refund customer
  | 'Refund' // Customer nhận được tiền refund từ hệ thống

/**
 * Chuyển đổi TransactionWalletType sang tiếng Việt
 * Ưu tiên dùng typeDisplay từ BE, fallback về typeMap nếu không có
 */
export const getTransactionTypeLabel = (transaction: WalletTransactionDTO | TransactionWalletType): string => {
  // Nếu nhận WalletTransactionDTO, ưu tiên dùng typeDisplay
  if (typeof transaction === 'object' && 'typeDisplay' in transaction) {
    if (transaction.typeDisplay) {
      return transaction.typeDisplay
    }
    // Fallback về type nếu không có typeDisplay
    const type = transaction.type
    const typeMap: Record<TransactionWalletType, string> = {
      OrderPayment: 'Thanh toán đơn hàng',
      CustomerPayment: 'Khách hàng thanh toán',
      OrderBankingPending: 'Chờ thanh toán đơn hàng',
      OrderBankingCompleted: 'Hoàn thành thanh toán đơn hàng',
      OrderCodDebt: 'Ghi nợ COD',
      OrderCodPaid: 'Đã trả nợ COD',
      Deposit: 'Nạp tiền',
      CommissionReceived: 'Nhận hoa hồng',
      DebtPayment: 'Trả nợ từ nạp tiền',
      Withdrawal: 'Rút tiền',
      SystemDiscountCompensation: 'Nhận bù giảm giá hệ thống',
      SystemDiscountCompensationPayout: 'Trả bù giảm giá hệ thống',
      PayDebt: 'Trả nợ',
      PayoutToSeller: 'Thanh toán cho người bán',
      RefundToCustomer: 'Hoàn tiền cho khách hàng',
      Refund: 'Nhận hoàn tiền'
    }
    return typeMap[type] || type
  }

  // Nếu nhận TransactionWalletType (backward compatibility)
  const type = transaction as TransactionWalletType
  const typeMap: Record<TransactionWalletType, string> = {
    OrderPayment: 'Thanh toán đơn hàng',
    CustomerPayment: 'Khách hàng thanh toán',
    OrderBankingPending: 'Chờ thanh toán đơn hàng',
    OrderBankingCompleted: 'Hoàn thành thanh toán đơn hàng',
    OrderCodDebt: 'Ghi nợ COD',
    OrderCodPaid: 'Đã trả nợ COD',
    Deposit: 'Nạp tiền',
    CommissionReceived: 'Nhận hoa hồng',
    DebtPayment: 'Trả nợ từ nạp tiền',
    Withdrawal: 'Rút tiền',
    SystemDiscountCompensation: 'Nhận bù giảm giá hệ thống',
    SystemDiscountCompensationPayout: 'Trả bù giảm giá hệ thống',
    PayDebt: 'Trả nợ',
    PayoutToSeller: 'Thanh toán cho người bán',
    RefundToCustomer: 'Hoàn tiền cho khách hàng',
    Refund: 'Nhận hoàn tiền'
  }
  return typeMap[type] || type
}

/**
 * Chuyển đổi TransactionWalletStatus sang tiếng Việt
 */
export const getTransactionStatusLabel = (status: TransactionWalletStatus): string => {
  const statusMap: Record<TransactionWalletStatus, string> = {
    Pending: 'Đang chờ',
    Completed: 'Hoàn thành',
    Cancel: 'Đã hủy',
    Approved: 'Đã duyệt',
    Rejected: 'Đã từ chối',
    Disputed: 'Tranh chấp'
  }
  return statusMap[status] || status
}

export interface WalletTransactionDTO {
  id: string
  walletId: string
  orderId: string | null
  transactionId: string | null
  type: TransactionWalletType
  typeDisplay: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  status: TransactionWalletStatus | null
  description: string | null
  paymentMethod: string
  userEmail?: string | null
  userPhoneNumber?: string | null
  orderVerificationId?: string
  billImages: string[] | null
  processedBy?: string
  processedByName?: string
  processNote?: string
  // Order breakdown fields (only visible for Seller/Admin/Staff)
  orderGrossRevenue?: number | null
  orderSellerDiscount?: number | null
  orderSystemDiscount?: number | null
  orderShipFee?: number | null
  orderInsurance?: number | null
  orderCommission?: number | null
  orderNetRevenue?: number | null
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
  totalSellerDiscount: number
  totalSystemDiscount: number
  TotalWithdrawn: number
  totalCommissionPaid: number
  totalCommission?: number
  totalShip?: number
  totalInsurance?: number
  totalWithdrawn?: number
  createdAt: string
  updatedAt: string
  walletTransactionDTOs: WalletTransactionDTO[]
}

export interface WalletResponse {
  status: number
  message: string
  data: WalletData
}

/**
 * DTO cho kết quả nạp tiền
 */
export interface DepositResultDTO {
  success: boolean
  message: string
  amountDeposited: number
  currentAvailable: number
  currentDebt: number
}

/**
 * DTO cho kết quả trả nợ
 */
export interface PayDebtResultDTO {
  success: boolean
  message: string
  amountPaid: number
  remainingDebt: number
  currentAvailable: number
}

/**
 * DTO cho yêu cầu rút tiền
 */
export interface RequestWalletMoneyDTO {
  id: string
  walletId: string
  orderId: string | null
  userId: string
  userEmail: string
  userPhoneNumber: string
  type: string
  amount: number
  bankAccount: string
  bankName: string
  accountHolderName: string
  status: string | null
  processedBy: string | null
  deadlineAt: string | null
  processNote: string | null
  processedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

/**
 * DTO cho chi tiết ví (từ API GetMyWallet)
 */
export interface WalletDetailDTO {
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
  totalSellerDiscount: number
  totalSystemDiscount: number
  netRevenue: number
  totalCommissionPaid: number
  totalWithdrawn: number
  createdAt: string | null
  updatedAt: string | null
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
  'SystemDiscountCompensation',
  'SystemDiscountCompensationPayout',
  'PayDebt',
  'PayoutToSeller',
  'RefundToCustomer',
  'Refund'
]
