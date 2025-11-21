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

// Request Types
export interface ProductReviewCreateInput {
  orderItemId: string // UUID - Foreign key to OrderItem (required) - Backend will validate and get product/combo info from this
  rating: number // 1-5 (required)
  comment?: string // Optional comment
  images?: File[] // Optional images to upload (max 3)
}

export interface ProductReviewUpdateInput {
  rating: number // 1-5 (required)
  comment?: string
  keepImages?: string[] // URLs of old images to keep
  newImages?: File[] // New images to upload
}

export interface GetReviewListParams {
  page?: number // Default: 1
  pageSize?: number // Default: 10
  rating?: number // 1-5, filter by rating
  hasImage?: boolean // true = only reviews with images
  sortBy?: 'newest' | 'oldest' | 'high_score' | 'low_score' // Default: "newest"
}

export interface ReplyReviewRequest {
  content: string // Max 200 characters, required
}

export interface UpdateReplyRequest {
  content: string // Max 200 characters, required
}

// Response Types
export interface SellerReply {
  replyId: string // UUID
  shopName: string
  content: string
  createdAt: string // ISO date string
}

export interface ReviewResponse {
  id: string // UUID
  userId: string // UUID
  userFullName: string
  userAvatar?: string // URL
  variantName: string
  rating: number // 1-5
  comment?: string
  images?: string[] // Array of image URLs (max 3)
  createdAt: string // ISO date string
  sellerReply?: SellerReply
}

export interface ReviewStatsResponse {
  averageRating: number // e.g., 4.5
  totalReviews: number
  count5Star: number
  count4Star: number
  count3Star: number
  count2Star: number
  count1Star: number
}

export interface PaginationInfo {
  pageNumber: number
  pageSize: number
  totalItems: number
  totalPages?: number
}

export interface ReviewListResponse {
  status: number
  message: string
  data: ReviewResponse[]
  pagination: PaginationInfo
}

export interface ReviewStatsApiResponse {
  status: number
  message: string
  data: ReviewStatsResponse
}

export interface ReviewApiResponse {
  status: number
  message: string
  data: ReviewResponse
}

export interface SellerReplyResponse {
  status: number
  message: string
  data: SellerReply
}
