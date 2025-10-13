// Order Status Enum
export type OrderStatus =
  | 'NotYet' // Chờ xử lý (vừa tạo)
  | 'Processing' // Sau khi thanh toán/reserve xong
  | 'Shipping' // Seller đã confirm, đang giao
  | 'Delivered' // Đã giao hàng thành công
  | 'Canceled' // hủy
  | 'Returned' // Customer đã trả hàng

// Promotion interface
export interface OrderPromotion {
  promotionId: string
  promotionType: string
  title: string
  description: string
  discountType: string
  discountValue: number
  discountAmount: number
  createdAt: string
}

// Order Item interface
export interface OrderItem {
  id: string
  orderId: string
  productInventoryId: string
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
  promotions: OrderPromotion[]
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
  totalPrice: number
  note: string | null
  payoutDate: string | null
  cancelDate: string | null
  orderItems: OrderItem[]
  orderItemsWithCombo: any[]
  orderHistories: OrderHistory[]
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
