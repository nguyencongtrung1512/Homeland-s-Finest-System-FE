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
}

export interface CreateComboItemRequest {
  productVariantId: string
  comboItemName: string
  price: number
  quantity: number
}

export interface UpdateComboItemRequest {
  productVariantId: string
  comboItemName: string
  price: number
  quantity: number
  isActive: boolean
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
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected'
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
  quantity: number
  isActive: boolean
  productName: string
  variantName: string
  storeName: string
}
export interface Combo {
  id: string
  name: string
  storeId?: string
  provinceId: number
  provinceName: string
  thumbnailUrl?: string
  description?: string
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected'
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  comboItems: ComboItem[]
  staffNote?: string
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
}
