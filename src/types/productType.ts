export interface Product {
  id: string // UUID - Primary Key
  storeId: string // UUID - Foreign Key to Store
  provinceId: number // Foreign Key to Province (changed from string to number)
  editedById: string // UUID - Foreign Key to User who edited
  name: string // varchar(255)
  description: string // text
  price: number // Product price
  productImages: string[] // JSONB - Array of image URLs
  productVideo: string // varchar(500) - Video URL
  categoryIds: string[] // JSONB - Array of category IDs (changed from categoryId)
  material: string // varchar(255) - Brand/Manufacturer
  saleCount: number // integer
  rating: number // numeric(3,2) - Average rating
  reviewCount: number // integer
  isActive: boolean // boolean
  typeProduct: string // varchar(100) - Product type
  status: string // varchar(50) - Product status
  staffNote: string // text (changed from note)
  comboItems: string // Combo items information
  createdAt: string // TIMESTAMPTZ
  updatedAt: string // TIMESTAMPTZ
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
