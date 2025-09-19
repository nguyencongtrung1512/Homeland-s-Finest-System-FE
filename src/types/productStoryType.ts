export interface ProductStory {
  id: string // UUID
  productId: string // UUID - Foreign key to Product
  title: string // varchar(255)
  thumbnailUrl: string // varchar(500)
  isActive: boolean // boolean
  createdAt: string // TIMESTAMPTZ
  updatedAt: string // TIMESTAMPTZ
}

export interface ProductStoryCreateInput {
  productId: string
  title: string
  thumbnailUrl: string
  isActive?: boolean
}

export interface ProductStoryUpdateInput {
  title?: string
  thumbnailUrl?: string
  isActive?: boolean
}
