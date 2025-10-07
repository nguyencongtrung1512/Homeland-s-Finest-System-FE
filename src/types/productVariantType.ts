export interface ProductVariant {
  id: string // UUID
  productId: string // UUID - Foreign key to Product
  variantName: string // varchar(255)
  quantity: number // int
  price: number // numeric(10,2)
  isActive: boolean // boolean
  length?: number // int
  width?: number // int
  height?: number // int
  weight?: number // int
  createdAt: string // TIMESTAMPTZ
  updatedAt: string // TIMESTAMPTZ
}

export interface ProductVariantInput {
  productId: string
  variantName: string
  quantity: number
  price: number
   length?: number // int
  width?: number // int
  height?: number // int
  weight?: number // int
  isActive?: boolean
}