// Types for AI Chat
export interface ChatMessageRequest {
  senderId: string
  messageText: string
}

export interface RecommendedProduct {
  productId: string
  productName: string
  price: number
  imageUrl: string
  productLink: string
}

export interface ChatMessageData {
  roomId: string
  senderId: string
  userMessageText: string
  homeLandFinestText: string
  productImages?: string[] // Array of image URLs
  recommendedProducts?: RecommendedProduct[] // Recommended products from AI
}

export interface ChatMessageResponse {
  status: number
  message: string
  data: ChatMessageData
}

// Types for Chat Room (Seller-Customer)
export interface CreateChatRoomRequest {
  sellerId: string
  customerId: string
}

export interface ChatRoomData {
  id: string
  sellerId: string
  sellerName: string
  sellerEmail: string
  sellerPhoneNumber: string
  customerId: string
  customername: string
  customerEmail: string
  customerPhoneNumber: string
  storeName?: string // Store name from API response
  status: boolean
  createdAt: string
  updatedAt: string
}

export interface ChatRoomResponse {
  status: number
  message: string
  data: ChatRoomData
}

// Types for sending message to chat room
export interface SendChatRoomMessageRequest {
  roomId: string
  senderId: string
  messageText: string
  images?: File[] // Optional array of image files
}

export interface ChatRoomMessageData {
  id: string
  roomId: string
  senderId: string
  images?: string[] // Array of image URLs
  messageText: string
  sentAt: string
}

export interface ChatRoomMessageResponse {
  status: number
  message: string
  data: ChatRoomMessageData
}

// Types for getting list of messages in chat room
export interface ChatRoomMessagesResponse {
  status: number
  message: string
  data: ChatRoomMessageData[]
}

// Types for getting all chat rooms of a user
export interface ChatRoomsListResponse {
  status: number
  message: string
  data: ChatRoomData[]
}
