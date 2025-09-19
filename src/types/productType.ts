export interface Product {
  id: string // UUID - Primary Key
  storeId: string // UUID - Foreign Key to Store
  provinceId: string // UUID - Foreign Key to Province
  name: string // varchar(255)
  description: string // text
  productImages: string[] // JSONB - Array of image URLs
  productVideo: string // varchar(500) - Video URL
  categoryId: string[] // JSONB - Array of category IDs
  madeBy: string // varchar(255) - Brand/Manufacturer
  saleCount: number // integer
  rating: number // numeric(3,2) - Average rating
  reviewCount: number // integer
  isActive: boolean // boolean
  typeProduct: string // varchar(100) - Product type
  status: string // varchar(50) - Product status
  note: string // text
  embedding: number[] // JSONB - Vector embedding for search
  createdAt: string // TIMESTAMPTZ
  updatedAt: string // TIMESTAMPTZ
}

export interface ProductCreateInput {
  storeId: string
  provinceId: string
  name: string
  description: string
  productImages?: string[]
  productVideo?: string
  categoryId?: string[]
  madeBy?: string
  saleCount?: number
  rating?: number
  reviewCount?: number
  isActive?: boolean
  typeProduct?: string
  status?: string
  note?: string
  embedding?: number[]
}

export interface ProductUpdateInput {
  name?: string
  description?: string
  productImages?: string[]
  productVideo?: string
  categoryId?: string[]
  madeBy?: string
  saleCount?: number
  rating?: number
  reviewCount?: number
  isActive?: boolean
  typeProduct?: string
  status?: string
  note?: string
  embedding?: number[]
}
