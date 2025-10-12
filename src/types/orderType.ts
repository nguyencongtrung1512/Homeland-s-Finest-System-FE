// Order Status Enum
export type OrderStatus =
  | 'NotYet'      // Chờ xử lý (vừa tạo)
  | 'Processing'  // Sau khi thanh toán/reserve xong
  | 'Shipping'    // Seller đã confirm, đang giao
  | 'Delivered'   // Đã giao hàng thành công
  | 'Cancel'
  | 'Returned'    // Customer đã trả hàng

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
  orderItemName: string
  orderItemImageUrl: string
  quantity: number
  totalPrice: number
  promotions: OrderPromotion[]
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
  isPayOut: boolean
  shipPrice: number
  totalOrder: number
  totalPrice: number
  note: string
  payoutDate: string
  cancelDate: string
  orderItems: OrderItem[]
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

// Create Order Input
export interface CreateOrderInput {
  storeId: string
  fromName: string
  fromPhone: string
  fromAddress: string
  paymentType: string
  toAddressId: string
  toName: string
  toAddress: string
  totalLength: number
  totalWidth: number
  totalHeight: number
  totalWeight: number
  shipPrice: number
  totalOrder: number
  totalPrice: number
  note?: string
  orderItems: {
    orderItemName: string
    orderItemImageUrl: string
    quantity: number
    totalPrice: number
  }[]
}

// Update Order Status Input
export interface UpdateOrderStatusInput {
  status: OrderStatus
  note?: string
}

export interface PaymentMethod {
  COD: string
  Banking: string
}
