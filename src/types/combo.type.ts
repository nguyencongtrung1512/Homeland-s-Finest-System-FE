// combo.type.ts

export interface CreateComboRequest {
  name: string
  description?: string
  sellerId: string
  thumbnailFile?: File
  videoFile?: File
}

export interface UpdateComboRequest {
  name: string
  description?: string
  isActive: boolean
  thumbnailFile?: File
  videoFile?: File
  finalPrice?: number
  discountPercent?: number
  removeThumbnail?: boolean
  removeVideo?: boolean
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
  sortByDate?: string
  fromDate?: string
  toDate?: string
}

export interface ComboFilterRequest {
  // Price Filters
  minPrice?: number
  maxPrice?: number

  // Location Filters
  provinceFilters?: string[]
  regionFilters?: string[]
  subRegionFilters?: string[]

  // Category Filters
  categoryFilterIds?: string[]

  // Store Filters
  storeFilters?: string[]
  storeNameFilters?: string[]

  // Status Filters
  statusFilters?: string[]
  isActiveFilter?: boolean

  // Date Filters
  fromDate?: string
  toDate?: string

  // Sales Filters
  minSaleCount?: number
  maxSaleCount?: number

  // Rating Filters
  minRating?: number
  maxRating?: number
  hasRating?: boolean

  // Savings Filters
  minSavings?: number
  maxSavings?: number

  // Stock Filters
  minAvailableQuantity?: number
  maxAvailableQuantity?: number
  inStock?: boolean

  // Item Count Filters
  minItemCount?: number
  maxItemCount?: number

  // Sorting Options
  sortBy?: string

  // Search Text
  queryText?: string

  // Staff Filters
  assignedToFilters?: string[]

  // Pagination
  pageNumber?: number
  pageSize?: number
}