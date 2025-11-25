// Order Status Enum - Khớp với backend enum
// Các trạng thái đơn hàng được sắp xếp theo quy trình từ khi tạo đến khi hoàn thành
export type OrderStatus =
  // === TRẠNG THÁI KHỞI TẠO VÀ CHỜ XỬ LÝ ===
  | 'NotYet' // Chưa xác nhận - Đơn hàng mới được tạo, chờ xử lý
  | 'Processing' // Chờ xác nhận - Đơn hàng đang được xử lý, chờ người bán xác nhận
  | 'PendingPayment' // Chờ thanh toán - Đơn hàng đã được xác nhận, chờ khách hàng thanh toán

  // === TRẠNG THÁI ĐÃ XÁC NHẬN VÀ CHUẨN BỊ ===
  | 'Confirmed' // Đã xác nhận - Đơn hàng đã được người bán xác nhận
  | 'ReadyToPick' // Đang chuẩn bị hàng - Người bán đang chuẩn bị hàng để giao cho shipper
  | 'Picking' // Đang trên đường lấy hàng - Shipper đang trên đường đến lấy hàng
  | 'Picked' // Shipper đã lấy hàng - Shipper đã lấy hàng, đơn hàng không thể hủy

  // === TRẠNG THÁI VẬN CHUYỂN ===
  | 'Storing' // Đang lưu kho - Hàng đang được lưu tại kho trung chuyển
  | 'Transporting' // Đang vận chuyển - Hàng đang được vận chuyển từ kho đến điểm giao
  | 'Sorting' // Đang phân loại - Hàng đang được phân loại tại trung tâm phân phối
  | 'Delivering' // Đang giao hàng - Shipper đang trên đường giao hàng đến khách

  // === TRẠNG THÁI HOÀN THÀNH ===
  | 'Delivered' // Đã giao hàng thành công - Khách hàng đã nhận được hàng
  | 'Paid' // Đã thanh toán cho người bán - Đã thanh toán tiền cho người bán

  // === TRẠNG THÁI TRẢ HÀNG VÀ HOÀN TIỀN ===
  | 'Refunding' // Đang hoàn tiền - Đơn hàng đang được hoàn tiền
  | 'Returning' // Đang trả hàng - Đơn hàng đang được trả lại
  | 'Returned' // Đã trả hàng - Đơn hàng đã được trả lại thành công
  | 'Refunded' // Đã hoàn tiền - Đã hoàn tiền cho khách hàng
  | 'DeliveryFail' // Giao hàng thất bại - Không thể giao hàng cho khách

  // === TRẠNG THÁI SỰ CỐ VÀ KHIẾU NẠI ===
  | 'Exception' // Gặp sự cố - Đơn hàng gặp sự cố trong quá trình vận chuyển
  | 'Damaged' // Hàng hư hỏng - Hàng bị hư hỏng trong quá trình vận chuyển
  | 'Lost' // Hàng thất lạc - Hàng bị thất lạc trong quá trình vận chuyển
  | 'Complaining' // Đang phản hồi - Khách hàng đang khiếu nại về đơn hàng
  | 'Complained' // Đã phản hồi - Đã xử lý khiếu nại của khách hàng

  // === TRẠNG THÁI HỦY ===
  | 'Cancel' // Đã hủy - Đơn hàng đã bị hủy

// Helper types để nhóm các status theo category
export type OrderStatusPending = 'NotYet' | 'Processing' | 'PendingPayment'
export type OrderStatusConfirmed = 'Confirmed' | 'ReadyToPick' | 'Picking' | 'Picked'
export type OrderStatusShipping = 'Storing' | 'Transporting' | 'Sorting' | 'Delivering'
export type OrderStatusCompleted = 'Delivered' | 'Paid'
export type OrderStatusReturning = 'Returning' | 'Returned' | 'Refunded' | 'DeliveryFail'
export type OrderStatusIssue = 'Exception' | 'Damaged' | 'Lost' | 'Complaining' | 'Complained'
export type OrderStatusCancelled = 'Cancel'

// Helper type để kiểm tra trạng thái có thể hủy được không
export type CancellableOrderStatus = 'NotYet' | 'Processing' | 'PendingPayment'

// Helper type để kiểm tra trạng thái đã hoàn thành
export type CompletedOrderStatus = 'Delivered' | 'Paid' | 'Returned' | 'Refunded' | 'Cancel'

// Helper type để kiểm tra trạng thái đang vận chuyển
export type ShippingOrderStatus = 'Storing' | 'Transporting' | 'Sorting' | 'Delivering' | 'Picked'

// Helper type để kiểm tra trạng thái có thể xác nhận nhận hàng
export type ConfirmableOrderStatus = 'Delivered'

// Helper type để kiểm tra trạng thái có thể khiếu nại
export type ComplainableOrderStatus = 'Delivered'

// Constants cho các nhóm status (dùng cho UI filtering)
export const ORDER_STATUS_GROUPS = {
  PENDING: ['NotYet', 'Processing', 'PendingPayment'] as const,
  CONFIRMED: ['Confirmed', 'ReadyToPick', 'Picking', 'Picked'] as const,
  SHIPPING: ['Storing', 'Transporting', 'Sorting', 'Delivering'] as const,
  COMPLETED: ['Delivered', 'Paid'] as const,
  RETURNING: ['Returned', 'DeliveryFail'] as const,
  ISSUE: ['Exception', 'Damaged', 'Lost'] as const,
  CANCELLED: ['Cancel'] as const
} as const

// Helper function type để check status group
export type OrderStatusGroup = keyof typeof ORDER_STATUS_GROUPS

export interface OrderPromotion {
  orderId: string
  promotionId: string
  promotionType: string
  title: string
  description: string
  discountType: string
  discountValue: number
  discountAmount: number
  createdAt: string
}

// Transaction interface
export interface Transaction {
  id: string
  userId: string
  orderId: string
  type: 'Sale' | 'Refund' | 'Payout' | 'Withdrawal'
  paymentMethod: string
  payosOrderCode: string
  checkoutUrl: string
  description: string
  amount: number
  status: string
  createdAt: string
  updatedAt: string
  userEmail: string
  userFullName: string
  orderStatus: string
}

// Order Item interface
export interface OrderItem {
  id: string
  orderId: string
  productId: string
  productVariantId: string
  length: number
  width: number
  height: number
  weight: number
  orderItemName: string
  orderItemImageUrl: string
  isReviewed: boolean
  basePrice: number
  commission: number
  finalPrice: number
  quantity: number
  totalPrice: number
}

// Order Item with Combo interface
export interface OrderItemWithCombo {
  id: string
  orderId: string
  productId: string
  productVariantId: string
  comboId?: string
  comboItemId: string
  comboName: string
  orderItemName: string
  orderItemImageUrl: string
  length: number
  width: number
  height: number
  weight: number
  isReviewed: boolean
  basePrice: number
  commission: number
  finalPrice: number
  quantity: number
  totalPrice: number
  isActive: boolean
}

// Order History interface
export interface OrderHistory {
  id: string
  description: string
  time: string
}

// Order interface
export interface Order {
  id: string
  ghnorderCode: string
  storeId: string
  fromName: string
  fromPhone: string
  fromAddress: string
  paymentType: string
  userId: string
  toAddressId: string
  toName: string
  toAddress: string
  totalLength: number
  totalWidth: number
  totalHeight: number
  totalWeight: number
  status: OrderStatus
  isComplained: boolean
  isFreeship: boolean
  isRefunded?: boolean
  isPayOut?: boolean
  isVerification?: boolean
  shipPrice: number
  totalOrder: number
  totalCommission: number
  totalDiscount: number
  insurance?: number
  finalPrice: number
  payoutDate: string | null
  cancelDate: string | null
  createdAt: string
  updatedAt: string
  VerificationImages: string[]
  VerificationAt: string | null
  note: string | null
  orderItems: OrderItem[]
  orderItemsWithCombo: OrderItemWithCombo[]
  orderHistories: OrderHistory[]
  orderPromotions: OrderPromotion[]
  transactions: Transaction[]
}

// Pagination interface
export interface OrderPagination {
  pageSize: number
  pageNumber: number
  totalItems: number
  totalPages: number
}

// Order List Response interface
export interface OrderListResponse {
  status: number
  message: string
  data: Order[]
  pagination: OrderPagination
}

// Single Order Response interface
export interface OrderResponse {
  status: number
  message: string
  data: Order
}

// Order Query Parameters
export interface OrderQueryParams {
  pageSize?: number
  pageNumber?: number
  status?: OrderStatus
  userId?: string
  storeId?: string
  fromDate?: string
  toDate?: string
  sortBy?: 'createdAt' | 'totalPrice' | 'status'
  sortOrder?: 'asc' | 'desc'
}

// Create Order Input theo API documentation
export interface CreateOrderInput {
  userId: string
  userAddressId: string
  paymentMethod: PaymentMethod
  storePromotions?: {
    storeId: string
    promotionIds: string[]
  }[]
  orderItemCreates: {
    productVariantId: string
    comboId?: string | null
    quantity: number
    promotionIds?: string[]
  }[]
}

// Update Order Status Input
export interface UpdateOrderStatusInput {
  status: OrderStatus
  note?: string
}

export type PaymentMethod = 'COD' | 'Banking' | 'MyWallet' | 'BankTransfer'

// Helper types cho Payment Method
export type PaymentMethodCOD = 'COD'
export type PaymentMethodBanking = 'Banking'
export type PaymentMethodWallet = 'MyWallet'
export type PaymentMethodBankTransfer = 'BankTransfer'
// Payment Method display names
export const PAYMENT_METHOD_NAMES: Record<PaymentMethod, string> = {
  COD: 'Thanh toán khi nhận hàng',
  Banking: 'Chuyển khoản ngân hàng',
  MyWallet: 'Ví của tôi',
  BankTransfer: 'Rút tiền về ngân hàng'
} as const

// Complaint Order type - dùng cho dữ liệu khiếu nại đơn hàng
// Giúp thống nhất kiểu dữ liệu khi truyền từ modal khiếu nại sang API
import type { FormType } from './form.type'

export interface ComplaintOrder {
  orderId: string
  storeId: string
  userId: string
  type: FormType // Nên dùng 'ComplaintOrder' khi khiếu nại đơn hàng
  subject: string
  description: string
  images?: File[]
}
