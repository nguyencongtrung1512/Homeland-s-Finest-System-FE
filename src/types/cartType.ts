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
}

// Cart interface for each store
export interface Cart {
  cartId: string
  storeId: string
  storeName: string
  storeLogoUrl: string
  items: CartItem[]
  subTotal: number
  totalItems: number
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