// Order Status Enum - Khớp với backend enum
export type OrderStatus =
  | 'NotYet' // Chờ xử lý
  | 'PendingPayment' // Chờ thanh toán
  | 'Processing' // Sau khi thanh toán xong
  | 'Confirmed' // Đã xác nhận
  | 'Cancel' // Đã hủy
  | 'ReadyToPick' // Sẵn sàng lấy hàng
  | 'Picking' // Đang lấy hàng
  | 'Picked' // Đã lấy hàng
  | 'Storing' // Đang lưu kho
  | 'Transporting' // Đang vận chuyển
  | 'Sorting' // Đang phân loại
  | 'Delivering' // Đang giao hàng
  | 'Delivered' // Đã giao hàng thành công
  | 'Complaining' // Đang phản hồi
  | 'Complained' // Đã phản hồi
  | 'DeliveryFail' // Giao hàng thất bại
  | 'Returning' // Đang trả hàng (Hủy trước khi xác nhận)
  | 'Returned' // Đã trả hàng
  | 'Paid' // Đã thanh toán
  | 'Refunded' // Đã hoàn tiền

// Promotion interface
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
  comboItemId: string
  comboName: string
  orderItemName: string
  orderItemImageUrl: string
  length: number
  width: number
  height: number
  weight: number
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
  isFreeship: boolean
  shipPrice: number
  totalOrder: number
  totalCommission: number
  totalDiscount: number
  finalPrice: number
  payoutDate: string | null
  cancelDate: string | null
  createdAt: string
  updatedAt: string
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

export type PaymentMethod = 'COD' | 'Banking' | 'MyWallet'
