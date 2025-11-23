import axiosInstance from '../service/axiosInstance'
import type {
  ChatMessageRequest,
  ChatMessageResponse,
  CreateChatRoomRequest,
  ChatRoomResponse,
  SendChatRoomMessageRequest,
  ChatRoomMessageResponse,
  ChatRoomMessagesResponse,
  ChatRoomsListResponse
} from '../types/chat.type'

/**
 * Gửi tin nhắn đến AI chatbot
 * @param data - Dữ liệu tin nhắn bao gồm senderId và messageText
 * @returns Phản hồi từ AI chatbot với thông tin roomId, message và response từ AI
 */
export const sendChatMessage = async (data: ChatMessageRequest): Promise<ChatMessageResponse> => {
  try {
    const response = await axiosInstance.post<ChatMessageResponse>('/Chat/homelandFinest/message', {
      senderId: data.senderId,
      messageText: data.messageText
    })
    // Interceptor đã trả về response.data
    return response as unknown as ChatMessageResponse
  } catch (error) {
    console.error('Error sending chat message:', error)
    throw error
  }
}

/**
 * Tạo hoặc lấy chat room giữa seller và customer
 * Nếu chat room đã tồn tại thì trả về thông tin room đó, nếu chưa thì tạo mới
 * @param data - Dữ liệu bao gồm sellerId và customerId
 * @returns Thông tin chat room (tạo mới hoặc đã tồn tại)
 */
export const createOrGetChatRoom = async (data: CreateChatRoomRequest): Promise<ChatRoomResponse> => {
  try {
    // Validate input
    if (!data.sellerId || !data.customerId) {
      throw new Error('sellerId and customerId are required')
    }

    // Log request data for debugging
    console.log('[chat.api] Creating/getting chat room:', {
      sellerId: data.sellerId,
      customerId: data.customerId
    })

    const requestBody = {
      sellerId: data.sellerId,
      customerId: data.customerId
    }

    const response = await axiosInstance.post<ChatRoomResponse>('/Chat', requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Interceptor đã trả về response.data
    console.log('[chat.api] Chat room created/retrieved successfully:', response)
    return response as unknown as ChatRoomResponse
  } catch (error: unknown) {
    console.error('[chat.api] Error creating or getting chat room:', error)

    // Log detailed error information
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: { status?: number; statusText?: string; data?: { message?: string } }
        message?: string
      }
      console.error('[chat.api] Error response:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.response?.data?.message || axiosError.message || 'Unknown error'
      })
    } else if (error && typeof error === 'object' && 'message' in error) {
      const errorWithMessage = error as { message: string }
      console.error('[chat.api] Error message:', errorWithMessage.message)
    }

    throw error
  }
}

/**
 * Gửi tin nhắn vào phòng chat (giữa seller và customer)
 * @param data - Dữ liệu tin nhắn bao gồm roomId, senderId, messageText và images (optional)
 * @returns Thông tin tin nhắn đã gửi với id, roomId, senderId, messageText, images và sentAt
 */
export const sendChatRoomMessage = async (data: SendChatRoomMessageRequest): Promise<ChatRoomMessageResponse> => {
  try {
    const formData = new FormData()
    formData.append('RoomId', data.roomId)
    formData.append('SenderId', data.senderId)
    let messageText = ''
    if (data.messageText && typeof data.messageText === 'string') {
      messageText = data.messageText.trim()
    }
    if (!messageText || messageText.length === 0) {
      messageText = ' ' // Dùng space làm giá trị mặc định
    }

    formData.append('MessageText', messageText)

    if (data.images && data.images.length > 0) {
      data.images.forEach((image) => {
        formData.append('Images', image)
      })
    }
    const response = await axiosInstance.post<ChatRoomMessageResponse>('/Chat/message', formData)
    // Interceptor đã trả về response.data
    return response as unknown as ChatRoomMessageResponse
  } catch (error) {
    console.error('Error sending chat room message:', error)
    throw error
  }
}

/**
 * Lấy danh sách tin nhắn trong phòng chat
 * @param roomId - ID của phòng chat
 * @returns Danh sách tin nhắn trong phòng chat
 */
export const getChatRoomMessages = async (roomId: string): Promise<ChatRoomMessagesResponse> => {
  try {
    const token = localStorage.getItem('token')
    const baseURL = import.meta.env.VITE_API_URL || 'http://154.26.130.248:8080'

    // Loại bỏ /api nếu có trong baseURL để dùng endpoint /messages/{roomId}
    const apiBase = baseURL.replace(/\/api$/, '')

    const response = await fetch(`${apiBase}/messages/${roomId}`, {
      method: 'GET',
      headers: {
        accept: 'text/plain',
        Authorization: `Bearer ${token || ''}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: ChatRoomMessagesResponse = await response.json()

    // Đảm bảo data.data là array, nếu không thì set thành array rỗng
    if (!data || !data.data || !Array.isArray(data.data)) {
      console.warn('[chat.api] Invalid response structure, setting empty array:', data)
      return {
        status: data?.status || 200,
        message: data?.message || 'No messages',
        data: []
      } as ChatRoomMessagesResponse
    }

    return data
  } catch (error) {
    console.error('Error getting chat room messages:', error)
    throw error
  }
}

/**
 * Lấy danh sách tất cả chat rooms của một user (seller hoặc customer)
 * @param userId - ID của user (có thể là sellerId hoặc customerId)
 * @returns Danh sách tất cả chat rooms của user
 */
export const getAllChatRoomsByUserId = async (userId: string): Promise<ChatRoomsListResponse> => {
  try {
    const response = await axiosInstance.get<ChatRoomsListResponse>(`/Chat/all/${userId}`)
    // Interceptor đã trả về response.data
    return response as unknown as ChatRoomsListResponse
  } catch (error) {
    console.error('Error getting all chat rooms by user id:', error)
    throw error
  }
}
