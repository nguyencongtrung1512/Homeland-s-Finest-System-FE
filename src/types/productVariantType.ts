export interface ProductVariant {
  id: string // UUID
  productId: string // UUID - Foreign key to Product
  variantName: string // varchar(255)
  price: number // numeric(10,2)
  isActive: boolean // boolean
  createdAt: string // TIMESTAMPTZ
  updatedAt: string // TIMESTAMPTZ
}

export interface ProductVariantCreateInput {
  productId: string
  variantName: string
  price: number
  isActive?: boolean
}

export interface ProductVariantUpdateInput {
  variantName?: string
  price?: number
  isActive?: boolean
}
