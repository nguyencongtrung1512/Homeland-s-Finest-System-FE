// combo.type.ts

// Request types for creating combo
export interface CreateComboRequest {
  name: string
  description?: string
  sellerId: string
  thumbnailFile?: File
}

// Request types for updating combo
export interface UpdateComboRequest {
  name: string
  description?: string
  isActive: boolean
  thumbnailFile?: File
}

// Request types for combo items
export interface CreateComboItemRequest {
  productVariantId: string
  comboItemName: string
  price: number
  quantity: number
  isActive: boolean
}

export interface UpdateComboItemRequest {
  id?: string // Có ID = update, không có ID = thêm mới
  productVariantId: string
  comboItemName: string
  price: number
  quantity: number
  isActive: boolean
}

// Response types for combo operations
export interface ComboResponse {
  status: number
  message: string
  data: ComboData | null
}

export interface ComboData {
  id: string
  name: string
  description: string
  thumbnailUrl: string
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected'
  provinceId: string
  isActive: boolean
}

// Error response types
export interface ComboErrorResponse {
  succeeded: false
  message: string
  errors: string[] | null
  data: null
}

// Combo item types
export interface ComboItem {
  id: string
  productVariantId: string
  comboItemName: string
  comboItemImageUrl: string
  price: number
  quantity: number
  isActive: boolean
}

// Full combo with items
export interface Combo {
  id: string
  name: string
  description: string
  thumbnailUrl: string
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected'
  provinceId: string
  provinceName?: string
  isActive: boolean
  comboItems: ComboItem[]
}

// Pagination types
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

// Query parameters
export interface ComboParams {
  pageSize?: number
  pageNumber?: number
  sellerID?: string
}
