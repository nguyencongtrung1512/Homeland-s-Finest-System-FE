export interface ProductStoryContent {
  id: string // UUID
  contentType: string // varchar - loại nội dung (text, image, video, etc.)
  contentData: string // text - dữ liệu nội dung
  order: number // int - thứ tự hiển thị
  videoPreviewUrl?: string | null // Video preview URL
  videoPlayBackUrl?: string | null // Video playback URL (HLS/DASH)
  videoFallBackUrl?: string | null // Video fallback URL (highest priority)
}

export interface ProductStory {
  id: string // UUID
  productId: string // UUID - Foreign key to Product
  title: string // varchar(255)
  thumbnailUrl: string // varchar(500)
  updatedAt: string // TIMESTAMPTZ
  contents: ProductStoryContent[] // Mảng các nội dung của story
}

export interface ProductStoryCreateInput {
  productId: string
  title: string
  thumbnailUrl: string
  contents?: ProductStoryContent[] // Optional khi tạo mới
}

export interface ProductStoryUpdateInput {
  title?: string
  thumbnailUrl?: string
  contents?: ProductStoryContent[]
}

// Response từ API
export interface ProductStoryResponse {
  status: number
  message: string
  data: ProductStory
}

export interface ProductStoryListResponse {
  status: number
  message: string
  data: ProductStory[]
  pagination?: {
    pageSize: number
    pageNumber: number
    totalItems: number
    totalPages: number
  }
}
