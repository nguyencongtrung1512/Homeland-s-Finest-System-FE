// Cart Item interface
export interface CartItem {
  id: string
  name: string
  imageUrl: string
  quantity: number
  unitPrice: number
  totalPrice: number
  isCombo: boolean
  productVariantId: string
  comboId: string
  isStock?: boolean
  isSelected?: boolean
  availableQuantity?: number
}

// Applied Promotion interface
export interface AppliedPromotion {
  cartPromotionId: string
  promotionId: string
  type: string
  title: string
  description: string
  discountType: string
  discountValue: number
  discountAmount: number
  minValueDiscount: number
  appliedAt: string
  expiredAt: string
  minutesLeft: number
  secondsLeft: number
  status: string
  isExpiringSoon: boolean
  isExpired: boolean
  discountDisplayText: string
  timeLeftDisplayText: string
}

// Cart interface for each store
export interface Cart {
  cartId: string
  storeId: string
  storeName: string
  storeLogoUrl: string
  items: CartItem[]
  appliedPromotions?: AppliedPromotion[]
  hasFreeship?: boolean
  subTotal: number
  totalDiscount?: number
  finalTotal?: number
  totalItems: number
  isMax?: boolean
}

// Cart summary interface
export interface CartSummary {
  totalStores: number
  totalItems: number
  totalAmount: number
}

// Cart data interface
export interface CartData {
  carts: Cart[]
  summary: CartSummary
}

// Cart API response interface
export interface CartResponse {
  status: number
  message: string
  data: CartData
}

// Shipping fee interfaces
export interface ShippingCartItem {
  cartItemId: string
  itemName: string
  imageUrl: string
  quantity: number
  length: number
  width: number
  height: number
  weight: number
  isCombo: boolean
  isStock: boolean
}

export interface StoreShippingInfo {
  storeId: string
  storeName: string
  storeAddress: string
  cartItems: ShippingCartItem[]
  totalLength: number
  totalWidth: number
  totalHeight: number
  totalWeight: number
  shippingFee: number
  shippingService: string
}

export interface ShippingFeeData {
  storeShippingInfos: StoreShippingInfo[]
  totalShippingFee: number
  success: boolean
  message: string
}

// Store shipping fee from API response
export interface StoreShippingFee {
  storeId: string
  shipPrice: number
  insuranceFee: number
}

export interface ShippingFeeResponse {
  status: number
  message: string
  data: StoreShippingFee[]
}
