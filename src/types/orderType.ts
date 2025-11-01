// Order Status Enum
export type OrderStatus =
  | 'NotYet' // Chưa xác nhận
  | 'Processing' // Chờ xác nhận
  | 'Confirmed' // Đã xác nhận bên seller   
  | 'Shipping' // Đang giao
  | 'Delivered' // Đã giao hàng thành công
  | 'Canceled' // Đã hủy
  | 'Returned' // Customer trả hàng 
  | 'Returning' // Shipper đang trả hàng
  | 'Refunded' // Seller hoàn tiền
  | 'Paid' // Đã thanh toán
  | 'PendingPayment' // Chờ thanh toán
  | 'Complaining' // Đang phản hồi
  | 'Complained' // Đã phản hồi

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

// Order Item interface (simplified for actual API response)
export interface OrderItem {
  id: string
  orderItemName: string
  orderItemImageUrl: string
  quantity: number
  totalPrice: number
  // Optional fields that may not be present in all responses
  orderId?: string
  productId?: string
  productVariantId?: string
  length?: number
  width?: number
  height?: number
  weight?: number
  basePrice?: number
  commission?: number
  finalPrice?: number
  promotions?: OrderPromotion[]
}

// Order Item with Combo interface
export interface OrderItemWithCombo {
  id: string
  orderId: string
  productId: string
  productVariantId: string
  comboId: string
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
  totalPrice: number
  quantity: number
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
  toAddressId?: string
  toName: string
  toAddress: string
  totalLength: number
  totalWidth: number
  totalHeight: number
  totalWeight: number
  status: OrderStatus
  isPayOut: boolean
  shipPrice: number
  totalOrder: number
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

export type PaymentMethod = 'COD' | 'Banking'