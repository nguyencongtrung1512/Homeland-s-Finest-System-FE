// combo.type.ts

export interface CreateComboRequest {
  name: string
  description?: string
  sellerId: string
  thumbnailFile?: File
}

export interface UpdateComboRequest {
  name: string
  description?: string
  isActive: boolean
  thumbnailFile?: File
  finalPrice?: number
  removeThumbnail?: boolean
}

export interface CreateComboItemRequest {
  productVariantId: string
  quantity: number
}

export interface UpdateComboItemRequest {
  productVariantId: string
  quantity: number
  isActive?: boolean
}

export interface ComboResponse {
  status: number
  message: string
  data: ComboData | null
}

export interface ComboData {
  id: string
  name: string
  storeId?: string
  provinceId: number
  provinceName: string
  thumbnailUrl?: string
  description?: string
  totalBasePrice: number
  totalFinalPrice: number
  availableQuantity?: number
  disabledReason?: string | null
  status: 'Draft' | 'Pending' | 'Denied' | 'Rejected' | 'Confirmed' | 'Processing' | 'Cancelled' | 'Approved'
  staffNote?: string | null
  assignedToId?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  comboItems: ComboItem[]
}

export interface ComboErrorResponse {
  succeeded: false
  message: string
  errors: string[] | null
  data: null
}
export interface ComboItem {
  id: string
  productVariantId: string
  comboItemName: string
  comboItemImageUrl?: string
  price: number
  basePrice: number
  finalPrice: number
  quantity: number
  availableQuantity?: number
  isActive: boolean
  productName: string
  variantName: string
  storeName: string
}
export interface Combo {
  id: string
  storeName: string
  name: string
  storeId?: string
  provinceId: number
  provinceName: string
  thumbnailUrl?: string
  description?: string
  totalSavings: number
  totalBasePrice: number
  totalFinalPrice: number
  availableQuantity?: number
  disabledReason?: string | null
  status: 'Draft' | 'Pending' | 'Denied' | 'Rejected' | 'Confirmed' | 'Processing' | 'Cancelled' | 'Approved'
  staffNote?: string | null
  assignedToId?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  comboItems: ComboItem[]
}

export interface ComboPagination {
  pageSize: number
  pageNumber: number
  totalItems: number
  totalPages: number
}

export interface ComboListResponse {
  status: number
  message: string
  data: Combo[]
  pagination: ComboPagination
}

export interface ComboParams {
  pageSize?: number
  pageNumber?: number
  sellerID?: string
  storeId?: string
}
