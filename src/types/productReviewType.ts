export interface ProductReview {
  id: string // UUID
  productId: string // UUID - Foreign key to Product
  userId: string // UUID - Foreign key to User
  orderId: string // UUID - Foreign key to Order
  rating: number // numeric(3,2) - Rating from 1 to 5
  comment: string // text
  createdAt: string // TIMESTAMPTZ
  updatedAt: string // TIMESTAMPTZ
}

export interface ProductReviewCreateInput {
  productId: string
  userId: string
  orderId: string
  rating: number
  comment: string
}

export interface ProductReviewUpdateInput {
  rating?: number
  comment?: string
}
