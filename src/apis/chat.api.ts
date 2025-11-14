import axiosInstance from '../service/axiosInstance'

export interface ChatMessageRequest {
  senderId: string
  messageText: string
}

export interface ChatMessageData {
  roomId: string
  senderId: string
  userMessageText: string
  homeLandFinestText: string
}

export interface ChatMessageResponse {
  status: number
  message: string
  data: ChatMessageData
}

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
