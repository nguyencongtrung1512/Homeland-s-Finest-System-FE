export interface ProductReview {
  id: string // UUID
  productId: string // UUID - Foreign key to Product
  userId: string // UUID - Foreign key to User
  replyId?: string // UUID - Foreign key to ProductReview (optional, for replies)
  rating: number // numeric(3,2) - Rating from 1 to 5
  comment: string // text
  imageUrl?: string[] // JSONB - Array of image URLs
  isActive: boolean // BOOLEAN
  createdAt: string // TIMESTAMPTZ
  updatedAt: string // TIMESTAMPTZ
}

export interface ProductReviewCreateInput {
  orderItemId: string // UUID - Foreign key to OrderItem (for validation: user must have purchased this item)
  userId: string
  rating: number
  comment: string
  images?: File[] // Optional images to upload
}

export interface ProductReviewUpdateInput {
  rating?: number
  comment?: string
}
