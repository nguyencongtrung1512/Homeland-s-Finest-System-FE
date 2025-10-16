// combo.type.ts

// Request types for creating combo
export interface CreateComboRequest {
  name: string
  provinceId: number
  description: string
  thumbnailFile: File
}

// Response types for combo operations
export interface ComboResponse {
  succeeded: boolean
  message: string
  errors: string[] | null
  data: ComboData | null
}

export interface ComboData {
  id: string
  name: string
  provinceId: number
  thumbnailUrl: string
  description: string
  status: 'Pending' | 'Approved' | 'Rejected'
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
  productName: string
  variantName: string
  storeName: string
}

// Full combo with items
export interface Combo {
  id: string
  name: string
  provinceId: number
  provinceName: string
  description: string
  isActive: boolean
  thumbnailUrl: string
  staffNote: string | null
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
  search?: string
  provinceId?: number
  isActive?: boolean
}
