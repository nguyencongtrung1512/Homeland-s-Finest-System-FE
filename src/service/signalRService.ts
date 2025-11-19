import * as signalR from '@microsoft/signalr'
import type { ChatRoomMessageData } from '../types/chat.type'

class SignalRService {
  private connection: signalR.HubConnection | null = null
  private isConnecting = false
  private reconnectAttempts = 0
  private messageHandlers: Map<string, (message: ChatRoomMessageData) => void> = new Map()

  /**
   * Khởi tạo và kết nối SignalR Hub
   */
  async startConnection(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('SignalR already connected')
      return
    }

    if (this.isConnecting) {
      console.log('SignalR connection in progress...')
      return
    }

    try {
      this.isConnecting = true
      const token = localStorage.getItem('token')

      // URL SignalR Hub
      const chatHubUrl = 'http://154.26.130.248:8080/chatHub'

      // Cấu hình connection options
      const connectionOptions: signalR.IHttpConnectionOptions = {}

      // Thêm token nếu có
      if (token) {
        connectionOptions.accessTokenFactory = () => token
      }

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(chatHubUrl, connectionOptions)
        .configureLogging(signalR.LogLevel.Information)
        .withAutomaticReconnect()
        .build()

      // Xử lý khi kết nối thành công
      this.connection.onclose((error?: Error) => {
        console.log('SignalR connection closed', error)
        this.isConnecting = false
        this.reconnectAttempts++
      })

      this.connection.onreconnecting((error?: Error) => {
        console.log('SignalR reconnecting...', error)
      })

      this.connection.onreconnected((connectionId?: string) => {
        console.log('SignalR reconnected', connectionId)
        this.reconnectAttempts = 0
        // Re-join all active rooms after reconnection
        this.rejoinAllRooms()
      })

      // ✅ QUAN TRỌNG: Đăng ký event 'ReceiveMessage' TRƯỚC KHI start connection
      // Backend C# gửi: SendAsync("ReceiveMessage", senderId, images, messageText, sentAt)
      this.connection.on(
        'ReceiveMessage',
        (senderId: string, images: string[], messageText: string, sentAt: string) => {
          console.log('[SignalR] ReceiveMessage event:', { senderId, images, messageText, sentAt })

          // Tạo message object từ parameters
          // Tạo unique ID từ senderId + messageText + sentAt để đảm bảo cùng một message có cùng ID
          // (Backend chưa gửi ID thật, nên dùng hash này làm unique key)
          const uniqueKey = `${senderId}-${messageText}-${sentAt}`
          const message: ChatRoomMessageData = {
            id: uniqueKey, // Unique ID từ senderId + messageText + sentAt
            roomId: '', // Sẽ được set bởi handler
            senderId: senderId,
            messageText: messageText,
            sentAt: sentAt,
            images: images || []
          }

          console.log('[SignalR] Created message object:', {
            id: message.id,
            senderId: message.senderId,
            messageText: message.messageText,
            sentAt: message.sentAt,
            handlersCount: this.messageHandlers.size
          })

          // Gọi tất cả các handlers đã đăng ký
          console.log('[SignalR] Calling handlers. Total handlers:', this.messageHandlers.size)
          this.messageHandlers.forEach((handler, roomId) => {
            console.log('[SignalR] Calling handler for room:', roomId)
            message.roomId = roomId
            try {
              handler(message)
              console.log('[SignalR] Handler called successfully for room:', roomId)
            } catch (error) {
              console.error('[SignalR] Error calling handler for room:', roomId, error)
            }
          })
        }
      )

      // Xử lý event 'UserJoined'
      this.connection.on('UserJoined', (connectionId: string) => {
        console.log('[SignalR] UserJoined event received:', connectionId)
      })

      // Xử lý event 'UserLeft'
      this.connection.on('UserLeft', (connectionId: string) => {
        console.log('[SignalR] UserLeft event received:', connectionId)
      })

      await this.connection.start()
      console.log('✅ SignalR connected successfully')
      this.isConnecting = false
      this.reconnectAttempts = 0
    } catch (error) {
      console.error('❌ Error starting SignalR connection:', error)
      this.isConnecting = false
      throw error
    }
  }

  /**
   * Re-join tất cả rooms sau khi reconnect
   */
  private async rejoinAllRooms(): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return
    }

    const roomIds = Array.from(this.messageHandlers.keys())
    console.log(`[SignalR] Re-joining ${roomIds.length} rooms after reconnection`)

    for (const roomId of roomIds) {
      try {
        await this.connection.invoke('JoinRoom', roomId)
        console.log(`[SignalR] Re-joined room: ${roomId}`)
      } catch (error) {
        console.error(`[SignalR] Error re-joining room ${roomId}:`, error)
      }
    }
  }

  /**
   * Ngắt kết nối SignalR
   */
  async stopConnection(): Promise<void> {
    if (this.connection) {
      try {
        // Clear all handlers
        this.messageHandlers.clear()
        await this.connection.stop()
        console.log('SignalR connection stopped')
      } catch (error) {
        console.error('Error stopping SignalR connection:', error)
      } finally {
        this.connection = null
        this.isConnecting = false
      }
    }
  }

  /**
   * ✅ FIX: Lắng nghe tin nhắn mới từ một room cụ thể
   * Đăng ký handler để nhận messages cho room này
   */
  onReceiveMessage(roomId: string, callback: (message: ChatRoomMessageData) => void): void {
    if (!this.connection) {
      console.error('SignalR connection not established')
      return
    }

    console.log(`[SignalR] Registering message handler for room: ${roomId}`)
    // Lưu handler vào Map
    this.messageHandlers.set(roomId, callback)
  }

  /**
   * ✅ FIX: Hủy đăng ký handler cho một room
   */
  offReceiveMessage(roomId: string): void {
    console.log(`[SignalR] Removing message handler for room: ${roomId}`)
    this.messageHandlers.delete(roomId)
  }

  /**
   * Gửi tin nhắn qua SignalR
   */
  async sendMessage(roomId: string, senderId: string, messageText: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR connection not established')
    }

    try {
      console.log('[SignalR] Sending message:', { roomId, senderId, messageText })
      await this.connection.invoke('SendMessage', roomId, senderId, messageText)
      console.log('[SignalR] Message sent successfully')
    } catch (error) {
      console.error('Error sending message via SignalR:', error)
      throw error
    }
  }

  /**
   * ✅ FIX: Tham gia vào một room (join group)
   * Đảm bảo join thành công trước khi tiếp tục
   */
  async joinRoom(roomId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      const errorMsg = `SignalR connection not established. State: ${this.connection?.state || 'null'}`
      console.error('[SignalR]', errorMsg)
      throw new Error(errorMsg)
    }

    try {
      console.log(`[SignalR] Joining room: ${roomId}`)

      // ✅ Gọi method JoinRoom trên server (theo ChatHub.cs)
      await this.connection.invoke('JoinRoom', roomId)

      console.log(`✅ [SignalR] Successfully joined room: ${roomId}`)

      // Đợi một chút để đảm bảo server đã add vào group
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error('[SignalR] Error joining room:', {
        roomId,
        error: errorMsg,
        connectionState: this.connection?.state
      })
      throw error
    }
  }

  /**
   * Rời khỏi một room (leave group)
   */
  async leaveRoom(roomId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      console.log(`[SignalR] Cannot leave room ${roomId}: connection not established`)
      return
    }

    try {
      console.log(`[SignalR] Leaving room: ${roomId}`)

      // Hủy đăng ký message handler
      this.offReceiveMessage(roomId)

      // Gọi method LeaveRoom trên server
      await this.connection.invoke('LeaveRoom', roomId)

      console.log(`✅ [SignalR] Successfully left room: ${roomId}`)
    } catch (error) {
      // LeaveRoom error is non-critical
      console.warn('[SignalR] Error leaving room (non-critical):', {
        roomId,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected
  }

  /**
   * Lấy connection instance (nếu cần)
   */
  getConnection(): signalR.HubConnection | null {
    return this.connection
  }

  /**
   * Lấy connection state
   */
  getConnectionState(): signalR.HubConnectionState | 'Disconnected' {
    return this.connection?.state || 'Disconnected'
  }
}

// Export singleton instance
export const signalRService = new SignalRService()
