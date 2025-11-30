import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'
import { Search, Paperclip, Image as ImageIcon, Send } from 'lucide-react'
import { useAuth } from '../../../contexts/auth.context'
import { getAllChatRoomsByUserId, getChatRoomMessages, sendChatRoomMessage } from '../../../apis/chat.api'
import { signalRService } from '../../../service/signalRService'
import { resolveImageUrl } from '../../../utils/image'
import type { ChatRoomData, ChatRoomMessageData } from '../../../types/chat.type'
import ImagePreviewModal from '../../../components/ui/image-preview-modal'

interface Message {
  id: string
  sender: 'shop' | 'customer'
  content: string
  timestamp: string
  avatar?: string
  images?: string[] // Array of image URLs
  isTyping?: boolean
}

interface Conversation {
  id: string
  name: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  avatar: string
  isActive: boolean
  customerId: string
  sellerId: string
}

// Utility functions to parse Vietnamese timestamp format "HH:mm:ss DD/MM/YYYY"
const parseVietnameseTimestamp = (timestamp: string): Date => {
  // Try to parse format "11:54:27 23/11/2025"
  const match = timestamp.match(/(\d{2}):(\d{2}):(\d{2})\s+(\d{2})\/(\d{2})\/(\d{4})/)
  if (match) {
    const [, hours, minutes, seconds, day, month, year] = match
    return new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1, // Month is 0-indexed
      parseInt(day, 10),
      parseInt(hours, 10),
      parseInt(minutes, 10),
      parseInt(seconds, 10)
    )
  }
  // Fallback to standard Date parsing
  return new Date(timestamp)
}

const formatDate = (timestamp: string): string => {
  const date = parseVietnameseTimestamp(timestamp)
  if (isNaN(date.getTime())) {
    // If parsing fails, try to extract date from original string
    const dateMatch = timestamp.match(/(\d{2})\/(\d{2})\/(\d{4})/)
    if (dateMatch) {
      const [, day, month, year] = dateMatch
      return `${day}/${month}/${year}`
    }
    return timestamp
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)

  if (dateOnly.getTime() === today.getTime()) {
    return 'Hôm nay'
  } else if (dateOnly.getTime() === yesterday.getTime()) {
    return 'Hôm qua'
  } else {
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })
  }
}

const getDateKey = (timestamp: string): string => {
  const date = parseVietnameseTimestamp(timestamp)
  if (isNaN(date.getTime())) {
    // If parsing fails, try to extract date from original string
    const dateMatch = timestamp.match(/(\d{2})\/(\d{2})\/(\d{4})/)
    if (dateMatch) {
      const [, day, month, year] = dateMatch
      return `${year}-${month}-${day}` // Return as YYYY-MM-DD for consistent key
    }
    return timestamp
  }
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

function ChatWithCustomer() {
  const { user } = useAuth()
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<{ [roomId: string]: Message[] }>({})
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState<{ [roomId: string]: boolean }>({})
  const [allMessages, setAllMessages] = useState<{ [roomId: string]: Message[] }>({}) // Store all loaded messages
  const [messagePage, setMessagePage] = useState<{ [roomId: string]: number }>({})
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date()) // For real-time updates
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const MESSAGES_PER_PAGE = 20

  // Format relative time helper function inside component to use currentTime
  const formatRelativeTime = (timestamp: string): string => {
    const date = parseVietnameseTimestamp(timestamp)
    if (isNaN(date.getTime())) {
      return timestamp
    }

    const now = currentTime
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    // Less than 1 minute
    if (diffInSeconds < 60) {
      return 'Vừa xong'
    }

    // Less than 1 hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} phút trước`
    }

    // Less than 24 hours
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} giờ trước`
    }

    // Less than 7 days
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} ngày trước`
    }

    // More than 7 days - show date
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const dateOnly = new Date(date)
    dateOnly.setHours(0, 0, 0, 0)

    if (dateOnly.getTime() === today.getTime()) {
      return 'Hôm nay'
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      return 'Hôm qua'
    } else {
      // Show full date for older messages
      return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })
    }
  }

  // Update current time every minute for real-time relative time display
  useEffect(() => {
    // Update immediately on mount
    setCurrentTime(new Date())

    // Then update every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  // Load chat rooms từ API
  useEffect(() => {
    const loadChatRooms = async () => {
      if (!user?.userId) return

      try {
        setLoadingRooms(true)
        const response = await getAllChatRoomsByUserId(user.userId)

        const mappedConversations: Conversation[] = response.data.map((room: ChatRoomData) => {
          // Seller sẽ thấy tên customer
          return {
            id: room.id,
            name: room.customername,
            lastMessage: '',
            timestamp: room.updatedAt,
            unreadCount: 0, // Có thể tính từ API sau
            avatar: '',
            isActive: false,
            customerId: room.customerId,
            sellerId: room.sellerId
          }
        })

        setConversations(mappedConversations)
      } catch (error) {
        console.error('Error loading chat rooms:', error)
      } finally {
        setLoadingRooms(false)
      }
    }

    loadChatRooms()
  }, [user?.userId])

  // Kết nối SignalR khi component mount
  useEffect(() => {
    if (user?.userId) {
      signalRService.startConnection().catch((error) => {
        console.error('Failed to start SignalR connection:', error)
      })

      return () => {
        // Cleanup khi unmount
      }
    }
  }, [user?.userId])

  // Load messages khi chọn conversation
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedChat || !user?.userId) {
        setCurrentRoomId(null)
        setFailedImages(new Set()) // Reset failed images when no chat selected
        return
      }

      // Reset failed images when switching to a new chat
      setFailedImages(new Set())

      try {
        setLoadingMessages(true)
        setCurrentRoomId(selectedChat)

        // Join SignalR room - đợi connection sẵn sàng
        console.log('[ChatWithCustomer] Loading messages for room:', selectedChat)
        if (signalRService.isConnected()) {
          try {
            console.log('[ChatWithCustomer] SignalR connected, joining room...')
            await signalRService.joinRoom(selectedChat)
            console.log('[ChatWithCustomer] Successfully joined room')
          } catch (joinError) {
            console.warn(
              '[ChatWithCustomer] Error joining room (non-critical, continuing to load messages):',
              joinError
            )
            // Tiếp tục load messages dù join room thất bại
          }
        } else {
          // Nếu chưa connected, thử start connection trước
          console.log('[ChatWithCustomer] SignalR not connected, starting connection...')
          try {
            await signalRService.startConnection()
            // Đợi một chút để connection ổn định
            await new Promise((resolve) => setTimeout(resolve, 500))
            if (signalRService.isConnected()) {
              console.log('[ChatWithCustomer] Connection established, joining room...')
              await signalRService.joinRoom(selectedChat)
            } else {
              console.warn('[ChatWithCustomer] Connection failed to establish')
            }
          } catch (connectionError) {
            console.warn(
              '[ChatWithCustomer] Error starting connection (non-critical, continuing to load messages):',
              connectionError
            )
            // Tiếp tục load messages dù connection thất bại
          }
        }

        // Load messages từ API
        const response = await getChatRoomMessages(selectedChat)

        // Kiểm tra response.data có tồn tại và là array không
        if (!response || !response.data || !Array.isArray(response.data)) {
          console.warn('[ChatWithCustomer] Invalid response data:', response)
          setMessages((prev) => ({
            ...prev,
            [selectedChat]: []
          }))
          return
        }

        // Map và deduplicate messages theo ID để tránh duplicate
        const messageMap = new Map<string, Message>()
        response.data.forEach((msg: ChatRoomMessageData) => {
          // Chỉ thêm nếu chưa có message với ID này
          if (!messageMap.has(msg.id)) {
            // Đảm bảo images là array of strings
            const imageUrls: string[] = Array.isArray(msg.images)
              ? msg.images
                .map((img) => {
                  // Nếu đã là string, dùng trực tiếp
                  if (typeof img === 'string') return img
                  // Nếu là object, thử lấy URL từ các property phổ biến
                  if (img && typeof img === 'object') {
                    const imgObj = img as Record<string, unknown>
                    return (
                      (typeof imgObj.url === 'string' ? imgObj.url : '') ||
                      (typeof imgObj.path === 'string' ? imgObj.path : '') ||
                      (typeof imgObj.src === 'string' ? imgObj.src : '') ||
                      (typeof imgObj.imageUrl === 'string' ? imgObj.imageUrl : '') ||
                      String(img)
                    )
                  }
                  return String(img || '')
                })
                .filter((url) => url && url !== '[object Object]' && url.trim() !== '')
              : []

            messageMap.set(msg.id, {
              id: msg.id,
              sender: msg.senderId === user.userId ? 'shop' : 'customer',
              content: msg.messageText,
              timestamp: msg.sentAt,
              avatar: msg.senderId === user.userId ? '' : '',
              images: imageUrls // Đã convert thành strings
            })
          }
        })

        // Chuyển Map thành Array và sort theo timestamp (oldest first)
        const mappedMessages: Message[] = Array.from(messageMap.values()).sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime()
          const timeB = new Date(b.timestamp).getTime()
          return timeA - timeB
        })

        // Store all messages
        setAllMessages((prev) => ({
          ...prev,
          [selectedChat]: mappedMessages
        }))

        // For bottom-up: show latest N messages initially
        const initialCount = Math.min(MESSAGES_PER_PAGE, mappedMessages.length)
        const initialMessages = mappedMessages.slice(-initialCount)
        setHasMoreMessages((prev) => ({
          ...prev,
          [selectedChat]: mappedMessages.length > MESSAGES_PER_PAGE
        }))
        setMessagePage((prev) => ({
          ...prev,
          [selectedChat]: 1
        }))

        // Set visible messages (latest N)
        setMessages((prev) => ({
          ...prev,
          [selectedChat]: initialMessages
        }))

        // Cập nhật lastMessage trong conversations
        if (mappedMessages.length > 0) {
          const lastMsg = mappedMessages[mappedMessages.length - 1]
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === selectedChat ? { ...conv, lastMessage: lastMsg.content, timestamp: lastMsg.timestamp } : conv
            )
          )
        }

        // Scroll to bottom after initial load
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
          }
        }, 100)
      } catch (error) {
        console.error('Error loading messages:', error)
      } finally {
        setLoadingMessages(false)
      }
    }

    loadMessages()

    // Cleanup: leave room khi chuyển conversation
    return () => {
      if (currentRoomId && signalRService.isConnected()) {
        // leaveRoom không throw error, chỉ log warning nếu có lỗi
        signalRService.leaveRoom(currentRoomId).catch(() => {
          // Error đã được handle trong leaveRoom, không cần log thêm
        })
      }
    }
  }, [selectedChat, user?.userId, currentRoomId])

  // Lắng nghe tin nhắn mới từ SignalR
  useEffect(() => {
    if (!currentRoomId || !signalRService.isConnected() || !user?.userId) return

    const handleNewMessage = (messageData: ChatRoomMessageData) => {
      console.log('[ChatWithCustomer] SignalR received message:', {
        roomId: messageData.roomId,
        currentRoomId,
        senderId: messageData.senderId,
        userId: user.userId,
        messageText: messageData.messageText,
        messageId: messageData.id
      })

      if (messageData.roomId === currentRoomId) {
        // Đảm bảo images là array of strings
        const imageUrls: string[] = Array.isArray(messageData.images)
          ? messageData.images
            .map((img) => {
              // Nếu đã là string, dùng trực tiếp
              if (typeof img === 'string') return img
              // Nếu là object, thử lấy URL từ các property phổ biến
              if (img && typeof img === 'object') {
                const imgObj = img as Record<string, unknown>
                return (
                  (typeof imgObj.url === 'string' ? imgObj.url : '') ||
                  (typeof imgObj.path === 'string' ? imgObj.path : '') ||
                  (typeof imgObj.src === 'string' ? imgObj.src : '') ||
                  (typeof imgObj.imageUrl === 'string' ? imgObj.imageUrl : '') ||
                  String(img)
                )
              }
              return String(img || '')
            })
            .filter((url) => url && url !== '[object Object]' && url.trim() !== '')
          : []

        const newMessage: Message = {
          id: messageData.id,
          sender: messageData.senderId === user.userId ? 'shop' : 'customer',
          content: messageData.messageText,
          timestamp: messageData.sentAt,
          avatar: messageData.senderId === user.userId ? '' : '',
          images: imageUrls // Đã convert thành strings
        }

        // Kiểm tra xem tin nhắn đã tồn tại chưa để tránh duplicate
        setMessages((prev) => {
          const existingMessages = prev[currentRoomId] || []

          // Kiểm tra duplicate bằng nội dung và thời gian (vì SignalR có thể tạo ID khác nhau)
          const contentDuplicate = existingMessages.some(
            (msg) =>
              msg.content === messageData.messageText &&
              msg.timestamp === messageData.sentAt &&
              msg.sender === (messageData.senderId === user.userId ? 'shop' : 'customer')
          )

          if (contentDuplicate) {
            console.log('[ChatWithCustomer] Duplicate message detected, skipping:', messageData.messageText)
            return prev // Không thêm nếu đã có message với cùng nội dung và thời gian
          }

          console.log('[ChatWithCustomer] Adding new message to UI:', messageData.messageText)
          return {
            ...prev,
            [currentRoomId]: [...existingMessages, newMessage]
          }
        })

        // Cập nhật lastMessage trong conversations
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentRoomId
              ? { ...conv, lastMessage: newMessage.content, timestamp: newMessage.timestamp }
              : conv
          )
        )
      }
    }

    // Lắng nghe tin nhắn từ room hiện tại
    signalRService.onReceiveMessage(currentRoomId, handleNewMessage)
  }, [currentRoomId, user?.userId])

  // Scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, selectedChat])

  // Filter conversations based on search term
  const filteredConversations = conversations.filter((chat) => {
    if (!searchTerm.trim()) return true
    const searchLower = searchTerm.toLowerCase().trim()
    return chat.name.toLowerCase().includes(searchLower) || chat.lastMessage.toLowerCase().includes(searchLower)
  })

  // Load more messages when scrolling up
  const loadMoreMessages = async () => {
    if (!selectedChat || loadingMore || !hasMoreMessages[selectedChat]) return

    const allMsgs = allMessages[selectedChat] || []
    const currentPage = messagePage[selectedChat] || 1
    const nextPage = currentPage + 1
    const totalLoaded = currentPage * MESSAGES_PER_PAGE

    if (totalLoaded >= allMsgs.length) {
      setHasMoreMessages((prev) => ({
        ...prev,
        [selectedChat]: false
      }))
      return
    }

    try {
      setLoadingMore(true)

      // Save current scroll position
      const container = messagesContainerRef.current
      const previousScrollHeight = container?.scrollHeight || 0

      // Load more messages (older ones)
      const startIndex = Math.max(0, allMsgs.length - (nextPage * MESSAGES_PER_PAGE))
      const endIndex = allMsgs.length - (currentPage * MESSAGES_PER_PAGE)
      const newMessages = allMsgs.slice(startIndex, endIndex)

      // Append older messages to the beginning (visually top)
      setMessages((prev) => {
        const current = prev[selectedChat] || []
        return {
          ...prev,
          [selectedChat]: [...newMessages, ...current]
        }
      })

      setMessagePage((prev) => ({
        ...prev,
        [selectedChat]: nextPage
      }))

      // Restore scroll position after new messages are added
      setTimeout(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight
          const scrollDiff = newScrollHeight - previousScrollHeight
          container.scrollTop = scrollDiff
        }
      }, 0)
    } catch (error) {
      console.error('Error loading more messages:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  // Handle scroll to detect when user scrolls to top (bottom of reversed container)
  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (!container || !selectedChat || loadingMore) return

    // In column-reverse, scrollTop = 0 means at the "top" (which is actually the oldest messages)
    const scrollThreshold = 100 // Load when within 100px of top
    if (container.scrollTop <= scrollThreshold && hasMoreMessages[selectedChat]) {
      loadMoreMessages()
    }
  }

  const currentChat = conversations.find((chat) => chat.id === selectedChat)
  const currentMessages = selectedChat ? messages[selectedChat] || [] : []

  // Group messages by date for date headers
  const messagesByDate = currentMessages.reduce((acc, msg) => {
    const dateKey = getDateKey(msg.timestamp)
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(msg)
    return acc
  }, {} as Record<string, Message[]>)

  // Debug: Log messagesByDate to check if grouping works
  if (currentMessages.length > 0 && Object.keys(messagesByDate).length === 0) {
    console.warn('[ChatWithCustomer] messagesByDate is empty but currentMessages has items:', {
      currentMessagesCount: currentMessages.length,
      firstMessageTimestamp: currentMessages[0]?.timestamp,
      parsedDateKey: currentMessages[0] ? getDateKey(currentMessages[0].timestamp) : 'N/A'
    })
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files)
    const totalImages = selectedImages.length + newFiles.length

    // Validate tối đa 3 ảnh
    if (totalImages > 3) {
      alert('Chỉ được gửi tối đa 3 ảnh mỗi lần')
      // Chỉ lấy số ảnh còn thiếu để đủ 3 ảnh
      const remainingSlots = 3 - selectedImages.length
      if (remainingSlots > 0) {
        const filesToAdd = newFiles.slice(0, remainingSlots)
        setSelectedImages((prev) => [...prev, ...filesToAdd])
        // Tạo preview cho các ảnh mới
        filesToAdd.forEach((file) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            setImagePreviews((prev) => [...prev, reader.result as string])
          }
          reader.readAsDataURL(file)
        })
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Thêm ảnh mới
    setSelectedImages((prev) => [...prev, ...newFiles])

    // Tạo preview cho các ảnh mới
    newFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSendMessage = async () => {
    // Phải có ít nhất message hoặc ảnh
    if ((!message.trim() && selectedImages.length === 0) || !currentRoomId || !user?.userId) return

    const messageText = message.trim() || ''

    try {
      // Gửi qua API để lưu vào database
      // Backend sẽ tự động gửi SignalR sau khi lưu DB, SignalR handler sẽ thêm message vào UI
      await sendChatRoomMessage({
        roomId: currentRoomId,
        senderId: user.userId,
        messageText: messageText,
        images: selectedImages.length > 0 ? selectedImages : undefined
      })

      // Reset form
      setMessage('')
      setSelectedImages([])
      setImagePreviews([])
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className='h-screen bg-gray-50 flex flex-col sm:flex-row'>
      {/* Left Sidebar - Chat List */}
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className='w-full sm:w-80 bg-white border-r border-gray-200 flex flex-col h-full sm:h-auto'
      >
        {/* Header */}
        <div className='bg-green-700 text-white p-4'>
          <h1 className='text-lg font-semibold'>Tin nhắn</h1>
          <p className='text-sm text-green-100'>Tinh hoa quê nhà</p>
        </div>

        {/* Search Bar */}
        <div className='p-4 border-b border-gray-200'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <Input
              placeholder='Tìm kiếm cuộc trò chuyện...'
              className='pl-10 bg-gray-50 border-gray-200'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Chat List */}
        <div className='flex-1 overflow-y-auto'>
          {loadingRooms ? (
            <div className='p-4 text-center text-gray-500'>Đang tải...</div>
          ) : filteredConversations.length === 0 ? (
            <div className='p-4 text-center text-gray-500'>
              {searchTerm.trim() ? 'Không tìm thấy cuộc trò chuyện nào' : 'Chưa có cuộc trò chuyện nào'}
            </div>
          ) : (
            filteredConversations.map((chat) => (
              <div
                key={`${chat.id}-${currentTime.getMinutes()}`}
                onClick={() => setSelectedChat(chat.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${chat.id === selectedChat ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                  }`}
              >
                <div className='flex items-center gap-3'>
                  <div className='relative'>
                    <div className='w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center'>
                      <span className='text-sm font-medium text-gray-600'>{chat.name.charAt(0)}</span>
                    </div>
                    {chat.isActive && (
                      <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white'></div>
                    )}
                  </div>

                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between mb-1'>
                      <h3 className='font-medium text-gray-900 truncate'>{chat.name}</h3>
                      <span className='text-xs text-gray-500'>{formatRelativeTime(chat.timestamp)}</span>
                    </div>
                    <p className='text-sm text-gray-600 truncate'>{chat.lastMessage}</p>
                  </div>

                  {chat.unreadCount > 0 && (
                    <Badge className='bg-green-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center'>
                      {chat.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Right Side - Chat Area */}
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
        className='flex-1 flex flex-col min-w-0'
      >
        {/* Chat Header */}
        {currentChat && (
          <div className='bg-white border-b border-gray-200 p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='relative'>
                  <div className='w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center'>
                    <span className='text-sm font-medium text-gray-600'>{currentChat?.name.charAt(0)}</span>
                  </div>
                </div>
                <div>
                  <h2 className='font-semibold text-gray-900'>{currentChat?.name}</h2>
                </div>
              </div>
            </div>


          </div>
        )}

        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className='flex-1 overflow-y-auto overflow-x-hidden p-4'
          style={{ display: 'flex', flexDirection: 'column-reverse', overflowAnchor: 'auto' }}
        >
          {!selectedChat ? (
            <div className='h-full flex items-center justify-center text-gray-500'>
              Chọn một cuộc trò chuyện để bắt đầu
            </div>
          ) : loadingMessages ? (
            <div className='h-full flex items-center justify-center text-gray-500'>Đang tải tin nhắn...</div>
          ) : (
            <>
              {/* Loading more indicator */}
              {loadingMore && (
                <div className='text-center py-2'>
                  <div className='inline-flex items-center gap-2 text-sm text-gray-500'>
                    <div className='w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin'></div>
                    Đang tải thêm...
                  </div>
                </div>
              )}

              {/* Messages - rendered in reverse order for bottom-up */}
              {Object.keys(messagesByDate).length === 0 && currentMessages.length > 0 ? (
                // Fallback: if grouping fails, show all messages without date headers
                <div className='text-center my-4'>
                  <span className='text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm'>
                    {formatDate(currentMessages[0]?.timestamp || '')}
                  </span>
                </div>
              ) : null}
              {Object.entries(messagesByDate)
                .sort(([dateKeyA], [dateKeyB]) => {
                  // Sort by date key (YYYY-MM-DD format) - oldest first for column-reverse
                  return dateKeyA.localeCompare(dateKeyB)
                })
                .map(([dateKey, dateMessages]) => (
                  <div key={dateKey} className='mb-4'>
                    {/* Date Header */}
                    <div className='sticky top-0 z-10 text-center my-4 bg-transparent pointer-events-none'>
                      <span className='text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm pointer-events-auto'>
                        {formatDate(dateMessages[0]?.timestamp || '')}
                      </span>
                    </div>

                    {/* Messages for this date */}
                    {dateMessages.map((msg) => {
                      // Calculate relative time for real-time updates
                      const relativeTime = formatRelativeTime(msg.timestamp)

                      // Chuẩn bị danh sách ảnh để preview
                      const handleImageClick = (idx: number) => {
                        const allImages = msg.images
                          ? msg.images.map((img) => {
                            const urlString = typeof img === 'string' ? img : String(img || '')
                            return urlString.startsWith('http://') || urlString.startsWith('https://')
                              ? urlString
                              : resolveImageUrl(urlString)
                          })
                          : []
                        setPreviewImages(allImages)
                        setPreviewIndex(idx)
                        setIsPreviewOpen(true)
                      }

                      // Check if this is an old message (loaded from history)
                      const isOldMessage = loadingMore

                      return (
                        <motion.div
                          key={msg.id}
                          layout
                          initial={
                            isOldMessage
                              ? { opacity: 0 }
                              : { opacity: 0, y: 20, scale: 0.9 }
                          }
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={
                            isOldMessage
                              ? { duration: 0.2 }
                              : {
                                type: 'spring',
                                stiffness: 300,
                                damping: 20
                              }
                          }
                          className={`flex ${msg.sender === 'shop' ? 'justify-end' : 'justify-start'} mb-2 group items-end gap-2`}
                        >
                          {msg.sender === 'customer' && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                              className='w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 self-end'
                            >
                              <span className='text-xs font-medium text-gray-600'>C</span>
                            </motion.div>
                          )}

                          <div className='flex flex-col relative max-w-[80%]'>
                            <motion.div
                              layout
                              whileHover={{ scale: 1.02 }}
                              className={`w-fit max-w-full rounded-xl px-4 py-2.5 relative break-words ${msg.sender === 'shop' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-900'
                                }`}
                            >
                              {msg.isTyping ? (
                                <div className='flex items-center gap-1'>
                                  <div className='flex gap-1'>
                                    <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
                                    <div
                                      className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                                      style={{ animationDelay: '0.1s' }}
                                    ></div>
                                    <div
                                      className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                                      style={{ animationDelay: '0.2s' }}
                                    ></div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {Array.isArray(msg.images) && msg.images.length > 0 && (
                                    <div className='mt-2 flex flex-wrap gap-2'>
                                      {msg.images.map((imageUrl, idx) => {
                                        // Đảm bảo imageUrl là string
                                        const imageUrlString = typeof imageUrl === 'string' ? imageUrl : String(imageUrl || '')

                                        // Nếu đã là full URL (bắt đầu với http:// hoặc https://) thì dùng trực tiếp
                                        // Nếu không thì resolve với base URL
                                        const finalUrl =
                                          imageUrlString.startsWith('http://') || imageUrlString.startsWith('https://')
                                            ? imageUrlString
                                            : resolveImageUrl(imageUrlString)

                                        const imageKey = `${msg.id}-${idx}`
                                        const hasFailed = failedImages.has(imageKey)
                                        const fallbackImage = 'https://i.pinimg.com/736x/91/7a/51/917a51df0d444def3cade8d626305a67.jpg'

                                        return hasFailed ? (
                                          <motion.img
                                            key={idx}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            src={fallbackImage}
                                            alt={`Image ${idx + 1} (fallback)`}
                                            className='max-w-[200px] sm:max-w-[250px] max-h-[200px] sm:max-h-[300px] object-contain rounded-lg cursor-pointer shadow-md'
                                            onClick={() => handleImageClick(idx)}
                                            onError={() => {
                                              console.error('[ChatWithCustomer] Fallback image also failed to load')
                                            }}
                                          />
                                        ) : (
                                          <motion.img
                                            key={idx}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                                            src={finalUrl}
                                            alt={`Image ${idx + 1}`}
                                            className='max-w-[200px] sm:max-w-[250px] max-h-[200px] sm:max-h-[300px] object-contain rounded-lg cursor-pointer shadow-md'
                                            onClick={() => handleImageClick(idx)}
                                            loading='lazy'
                                            onError={(e) => {
                                              // Khi ảnh gốc fail, thử fallback
                                              const img = e.currentTarget as HTMLImageElement
                                              console.error('[ChatWithCustomer] Image load error:', {
                                                attemptedUrl: img.src,
                                                originalUrl: imageUrl,
                                                finalUrl: finalUrl
                                              })
                                              if (img && img.src !== fallbackImage) {
                                                console.log('[ChatWithCustomer] Trying fallback image')
                                                img.src = fallbackImage
                                              } else {
                                                console.log('[ChatWithCustomer] Fallback also failed, marking as failed')
                                                setFailedImages((prev) => new Set(prev).add(imageKey))
                                              }
                                            }}
                                            onLoad={() => {
                                              console.log('[ChatWithCustomer] Image loaded successfully:', finalUrl)
                                            }}
                                          />
                                        )
                                      })}
                                    </div>
                                  )}
                                  {msg.content && <p className='text-sm break-words whitespace-normal'>{msg.content}</p>}
                                </>
                              )}
                            </motion.div>

                            {/* Time display - always show below message */}
                            <motion.div
                              key={`time-${msg.id}-${currentTime.getMinutes()}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className={`text-xs text-gray-400 mt-1 ${msg.sender === 'shop' ? 'text-right' : 'text-left'}`}
                              style={{ fontSize: '11px' }}
                            >
                              {relativeTime}
                            </motion.div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                ))}
            </>
          )}
        </div>

        {/* Message Input */}
        {currentChat && (
          <div className='bg-white border-t border-gray-200 p-4'>
            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className='mb-3 flex flex-wrap gap-2'>
                {imagePreviews.map((preview, index) => (
                  <div key={index} className='relative'>
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className='w-20 h-20 object-cover rounded-lg border border-gray-200'
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600'
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className='flex items-center gap-3'>
              <Button variant='ghost' size='sm' className='text-gray-600 hover:text-gray-900'>
                <Paperclip className='w-4 h-4' />
              </Button>
              <input
                type='file'
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept='image/*'
                multiple
                className='hidden'
                id='image-input'
              />
              <Button
                variant='ghost'
                size='sm'
                className='text-gray-600 hover:text-gray-900'
                onClick={() => fileInputRef.current?.click()}
                disabled={selectedImages.length >= 3}
                title={selectedImages.length >= 3 ? 'Tối đa 3 ảnh' : 'Chọn ảnh'}
              >
                <ImageIcon className='w-4 h-4' />
              </Button>

              <div className='flex-1'>
                <Input
                  placeholder='Nhập tin nhắn...'
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className='border-gray-200 focus:border-green-500 focus:ring-green-500'
                  disabled={loadingMessages || !currentRoomId}
                />
              </div>

              <Button
                onClick={handleSendMessage}
                className='bg-green-600 hover:bg-green-700 text-white'
                disabled={(!message.trim() && selectedImages.length === 0) || loadingMessages || !currentRoomId}
              >
                <Send className='w-4 h-4' />
              </Button>
            </div>
            {selectedImages.length > 0 && (
              <p className='text-xs text-gray-500 mt-2'>Đã chọn {selectedImages.length}/3 ảnh</p>
            )}
          </div>
        )}
      </motion.div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        images={previewImages}
        initialIndex={previewIndex}
        alt='Chat image'
      />
    </div>
  )
}

export default ChatWithCustomer
