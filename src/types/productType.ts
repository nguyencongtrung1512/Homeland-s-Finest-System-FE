import type { ProductCertificateType } from './productCertificateType'

// Variant Option Interface
export interface VariantOption {
  id: string // UUID
  name: string // varchar(255)
  attributeName: string // varchar(255)
  description: string // text
  productImages: string[] | null // Array of image URLs
  basePrice: number | null // numeric(10,2)
  finalPrice: number | null // numeric(10,2)
  quantity: number | null // integer
  reservedCOD: number | null // integer - inventory reserved for COD orders
  reservedCombo: number | null // integer - inventory reserved for combos
  weight: number | null // numeric(10,2)
  length: number | null // numeric(10,2)
  width: number | null // numeric(10,2)
  height: number | null // numeric(10,2)
  saleCount: number | null // integer
  rating: number | null // numeric(3,2)
  reviewCount: number | null // integer
  isActive: boolean // boolean
  childVariantGroups: VariantGroup[] | null // Nested variant groups
}

// Variant Group Interface
export interface VariantGroup {
  attributeType: string // varchar(255) - Loại thuộc tính (Color, Size, etc.)
  options: VariantOption[] // Array of variant options
}

// Product Category Interface
export interface ProductCategory {
  id: string // UUID
  name: string // varchar(255)
  description: string // text
  isActive: boolean // boolean
  createdAt: string // TIMESTAMPTZ
  updatedAt: string // TIMESTAMPTZ
}

export interface Product {
  id: string // UUID - Primary Key
  storeId: string // UUID - Foreign Key to Store
  storeName: string // varchar(255)
  provinceId: number // Foreign Key to Province
  editedById: string // UUID - Foreign Key to User who edited
  summaryPrice: number // numeric(10,2)
  price: number // numeric(10,2)
  name: string // varchar(255)
  description: string // text
  productImages: string[] // JSONB - Array of image URLs
  productVideo: string // varchar(500) - Video URL (legacy, kept for backward compatibility)
  // Video URLs from backend - priority: videoFallBackUrl > videoPlayBackUrl > videoPreviewUrl > productVideo
  videoPreviewUrl?: string | null // Video preview URL
  videoPlayBackUrl?: string | null // Video playback URL (HLS/DASH)
  videoFallBackUrl?: string | null // Video fallback URL (highest priority)
  material: string // varchar(255) - Brand/Manufacturer
  saleCount: number // integer
  rating: number // numeric(3,2) - Average rating
  reviewCount: number // integer
  isActive: boolean // boolean
  typeProduct: string // varchar(100) - Product type
  status: string // varchar(50) - Product status
  staffNote: string // text
  variantGroups: VariantGroup[] // Array of variant groups
  productCategories: ProductCategory // Single product category
  productCertificateDTOs: ProductCertificateType[] // Array of product certificates
}

export interface ProductCreateInput {
  storeId: string
  provinceId: number // Changed from string to number
  name: string
  description: string
  categoryIds: string[] // Changed from categoryId to categoryIds
  productImages?: string[]
  productVideo?: string
  material?: string
  saleCount?: number
  rating?: number
  reviewCount?: number
  isActive?: boolean
  typeProduct?: string
  status?: string
  staffNote?: string // Changed from note to staffNote
  storyTitle?: string
  storyDetail?: string
  certificateImages?: string[]
  storyVideo?: string
  storyImages?: string[]
}

export interface ProductUpdateInput {
  name?: string
  description?: string
  productImages?: string[]
  productVideo?: string
  categoryIds?: string[] // Changed from categoryId to categoryIds
  material?: string
  saleCount?: number
  rating?: number
  reviewCount?: number
  isActive?: boolean
  typeProduct?: string
  status?: string
  staffNote?: string // Changed from note to staffNote
}
