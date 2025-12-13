export interface StoreStoryContent {
  id: string
  contentType: string
  contentData: string
  imageUrls: string[]
  videoPreviewUrl: string
  videoPlayBackUrl: string
  videoFallBackUrl: string
  order: number
}

export interface StoreStory {
  id: string
  storeId: string
  title: string
  thumbnailUrl: string
  contents: StoreStoryContent[]
  createdAt: string
  isActive?: boolean
}

export interface StoreStoryResponse {
  data: StoreStory
}

export interface StoreStoryListResponse {
  data: StoreStory[]
}
