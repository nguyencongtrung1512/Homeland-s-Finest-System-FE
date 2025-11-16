import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Image,
  ArrowLeft,
  Store,
  ShoppingBag
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardHeader, CardTitle } from '../../../components/ui/card'
import { ScrollArea } from '../../../components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { useChat } from '../../../contexts/chat.context'
import {
  sendChatMessage,
  createOrGetChatRoom,
  sendChatRoomMessage,
  getChatRoomMessages,
  getAllChatRoomsByUserId
} from '../../../apis/chat.api'
import { useAuth } from '../../../contexts/auth.context'
import { signalRService } from '../../../service/signalRService'
import { resolveImageUrl } from '../../../utils/image'
import type { ChatRoomData, ChatRoomMessageData } from '../../../types/chat.type'
import ImagePreviewModal from '../../../components/ui/image-preview-modal'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  images?: string[] // Array of image URLs
}

interface Conversation {
  id: string // roomId
  name: string
  avatar: string
  lastMessage: string
  online?: boolean
  time?: string
  unread?: number
  storeId?: string
  sellerId?: string
  customerId?: string
}

const ChatSystem: React.FC = () => {
  const { user } = useAuth()
  const { isOpen, setIsOpen, activeTab, setActiveTab, selectedStoreId, selectedStoreName, setSelectedStoreId } =
    useChat()
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [aiMessages, setAiMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là trợ lý ảo của Tinh Hoa Quê Nhà. Tôi có thể giúp bạn tìm hiểu về sản phẩm, câu chuyện người nông dân, hoặc hỗ trợ mua sắm. Bạn cần tôi giúp gì?',
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [sellerMessages, setSellerMessages] = useState<{ [roomId: string]: Message[] }>({})
  const [inputValue, setInputValue] = useState('')
  const [sellerMessage, setSellerMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load chat rooms từ API
  useEffect(() => {
    const loadChatRooms = async () => {
      if (!user?.userId || !isOpen || activeTab !== 'seller') return

      try {
        setLoadingRooms(true)
        const response = await getAllChatRoomsByUserId(user.userId)

        const mappedConversations: Conversation[] = response.data.map((room: ChatRoomData) => {
          // Xác định tên và avatar dựa trên role của user hiện tại
          const isCustomer = user.userId === room.customerId
          const otherName = isCustomer ? room.sellerName : room.customername

          return {
            id: room.id,
            name: otherName,
            avatar: '🏪',
            lastMessage: '',
            online: false,
            sellerId: room.sellerId,
            customerId: room.customerId,
            storeId: room.sellerId // Dùng sellerId làm storeId
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
  }, [user?.userId, isOpen, activeTab])

  // Kết nối SignalR khi mở chat
  useEffect(() => {
    if (isOpen && user?.userId) {
      signalRService.startConnection().catch((error) => {
        console.error('Failed to start SignalR connection:', error)
      })

      return () => {
        // Không disconnect khi đóng chat, chỉ khi unmount component
      }
    }
  }, [isOpen, user?.userId])

  // Tự động chọn hoặc tạo conversation khi selectedStoreId thay đổi
  useEffect(() => {
    const handleStoreSelection = async () => {
      if (!selectedStoreId || !isOpen || !user?.userId) return

      try {
        // Tìm conversation đã tồn tại
        const existingConv = conversations.find((conv) => conv.sellerId === selectedStoreId)

        if (existingConv) {
          setSelectedConversation(existingConv.id)
          setActiveTab('seller')
        } else {
          // Tạo chat room mới
          const response = await createOrGetChatRoom({
            sellerId: selectedStoreId,
            customerId: user.userId
          })

          const newConversation: Conversation = {
            id: response.data.id,
            name: selectedStoreName || response.data.sellerName || 'Cửa hàng',
            avatar: '🏪',
            lastMessage: 'Bắt đầu cuộc trò chuyện',
            online: false,
            sellerId: response.data.sellerId,
            customerId: response.data.customerId,
            storeId: response.data.sellerId
          }

          setConversations((prev) => [...prev, newConversation])
          setSelectedConversation(response.data.id)
          setActiveTab('seller')
        }
      } catch (error) {
        console.error('Error creating/getting chat room:', error)
      }
    }

    handleStoreSelection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId, isOpen, user?.userId, selectedStoreName, conversations])

  // Load messages khi chọn conversation
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation) {
        setCurrentRoomId(null)
        setFailedImages(new Set()) // Reset failed images when no conversation selected
        return
      }

      // Reset failed images when switching to a new conversation
      setFailedImages(new Set())

      try {
        setLoadingMessages(true)
        setCurrentRoomId(selectedConversation)

        // Join SignalR room - đợi connection sẵn sàng
        console.log('[ChatSystem] Loading messages for room:', selectedConversation)
        let roomJoined = false
        if (signalRService.isConnected()) {
          try {
            console.log('[ChatSystem] SignalR connected, joining room...')
            await signalRService.joinRoom(selectedConversation)
            console.log('[ChatSystem] Successfully joined room:', selectedConversation)
            roomJoined = true
          } catch (joinError) {
            console.warn('[ChatSystem] Error joining room (non-critical, continuing to load messages):', joinError)
            // Tiếp tục load messages dù join room thất bại
          }
        } else {
          // Nếu chưa connected, thử start connection trước
          console.log('[ChatSystem] SignalR not connected, starting connection...')
          try {
            await signalRService.startConnection()
            // Đợi một chút để connection ổn định
            await new Promise((resolve) => setTimeout(resolve, 500))
            if (signalRService.isConnected()) {
              console.log('[ChatSystem] Connection established, joining room...')
              await signalRService.joinRoom(selectedConversation)
              console.log('[ChatSystem] Successfully joined room:', selectedConversation)
              roomJoined = true
            } else {
              console.warn('[ChatSystem] Connection failed to establish')
            }
          } catch (connectionError) {
            console.warn(
              '[ChatSystem] Error starting connection (non-critical, continuing to load messages):',
              connectionError
            )
            // Tiếp tục load messages dù connection thất bại
          }
        }

        // Đảm bảo handler được đăng ký sau khi join room
        if (roomJoined && signalRService.isConnected()) {
          console.log('[ChatSystem] Room joined, handler will be registered by useEffect')
        }

        // Load messages từ API
        const response = await getChatRoomMessages(selectedConversation)

        // Kiểm tra response.data có tồn tại và là array không
        if (!response || !response.data || !Array.isArray(response.data)) {
          console.warn('[ChatSystem] Invalid response data:', response)
          setSellerMessages((prev) => ({
            ...prev,
            [selectedConversation]: []
          }))
          return
        }

        // Map và deduplicate messages theo ID để tránh duplicate
        const messageMap = new Map<string, Message>()
        response.data.forEach((msg: ChatRoomMessageData) => {
          // Chỉ thêm nếu chưa có message với ID này
          if (!messageMap.has(msg.id)) {
            messageMap.set(msg.id, {
              id: msg.id,
              text: msg.messageText,
              isUser: msg.senderId === user?.userId,
              timestamp: new Date(msg.sentAt),
              images: Array.isArray(msg.images) ? msg.images : [] // Thêm images từ response
            })
          }
        })

        // Chuyển Map thành Array và sort theo timestamp
        const mappedMessages: Message[] = Array.from(messageMap.values()).sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        )

        // Replace messages thay vì merge để tránh duplicate khi reload
        setSellerMessages((prev) => ({
          ...prev,
          [selectedConversation]: mappedMessages
        }))
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
  }, [selectedConversation, user?.userId, currentRoomId])

  // Lắng nghe tin nhắn mới từ SignalR
  useEffect(() => {
    if (!currentRoomId || !signalRService.isConnected()) {
      console.log('[chatSystem] SignalR handler not set up:', {
        currentRoomId,
        isConnected: signalRService.isConnected()
      })
      return
    }

    console.log('[chatSystem] Setting up SignalR handler for room:', currentRoomId)

    const handleNewMessage = (message: ChatRoomMessageData) => {
      const isFromCurrentUser = message.senderId === user?.userId
      console.log('[chatSystem] SignalR received message:', {
        roomId: message.roomId,
        currentRoomId,
        senderId: message.senderId,
        userId: user?.userId,
        isFromCurrentUser,
        messageText: message.messageText,
        messageId: message.id,
        sentAt: message.sentAt
      })

      if (message.roomId === currentRoomId) {
        const newMessage: Message = {
          id: message.id,
          text: message.messageText,
          isUser: isFromCurrentUser,
          timestamp: new Date(message.sentAt),
          images: Array.isArray(message.images) ? message.images : [] // Thêm images từ SignalR
        }

        // Kiểm tra xem tin nhắn đã tồn tại chưa để tránh duplicate
        setSellerMessages((prev) => {
          const existingMessages = prev[currentRoomId] || []
          console.log('[chatSystem] Checking for duplicates. Existing messages count:', existingMessages.length, {
            messageText: message.messageText,
            isFromCurrentUser,
            messageId: message.id
          })

          // Kiểm tra duplicate cho tất cả messages (cả từ user và từ seller)
          // So sánh bằng nội dung + thời gian để tránh duplicate
          const sentAtTime = new Date(message.sentAt).getTime()
          const now = Date.now()

          const contentDuplicate = existingMessages.some((msg) => {
            // Kiểm tra cùng text và cùng sender
            if (msg.text !== message.messageText || msg.isUser !== isFromCurrentUser) {
              return false
            }

            // Kiểm tra thời gian: nếu message mới được thêm gần đây (trong 30 giây) và có cùng text
            const msgAge = now - msg.timestamp.getTime()
            const timeDiff = Math.abs(msg.timestamp.getTime() - sentAtTime)

            // Nếu message đã có trong vòng 30 giây và thời gian chênh lệch < 10 giây → duplicate
            if (msgAge < 30000 && timeDiff < 10000) {
              console.log('[chatSystem] Found duplicate by content and time:', {
                existingTime: msg.timestamp.toISOString(),
                newTime: new Date(message.sentAt).toISOString(),
                timeDiff: timeDiff,
                msgAge: msgAge,
                text: message.messageText,
                isFromCurrentUser,
                existingId: msg.id,
                newId: message.id
              })
              return true
            }

            return false
          })

          if (contentDuplicate) {
            console.log('[chatSystem] Duplicate message detected, skipping:', message.messageText)
            return prev // Không thêm nếu đã có message với cùng nội dung và thời gian
          }

          // Thêm message vào UI (từ seller hoặc từ user nhưng chưa có trong UI)
          console.log('[chatSystem] Adding new message to UI:', {
            messageText: message.messageText,
            isFromCurrentUser,
            senderId: message.senderId
          })
          return {
            ...prev,
            [currentRoomId]: [...existingMessages, newMessage]
          }
        })
      } else {
        console.warn('[chatSystem] Message roomId mismatch:', {
          messageRoomId: message.roomId,
          currentRoomId,
          messageText: message.messageText
        })
      }
    }

    // Lắng nghe tin nhắn từ room hiện tại
    console.log('[chatSystem] Registering SignalR handler for room:', currentRoomId)
    signalRService.onReceiveMessage(currentRoomId, handleNewMessage)
    console.log('[chatSystem] SignalR handler registered successfully')

    // Cleanup listener khi unmount hoặc đổi room
    return () => {
      console.log('[chatSystem] Cleaning up SignalR handler for room:', currentRoomId)
      signalRService.offReceiveMessage(currentRoomId)
    }
  }, [currentRoomId, user?.userId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [aiMessages, sellerMessages, selectedConversation])

  const handleSendAIMessage = async () => {
    if (!inputValue.trim()) return

    // Kiểm tra user đã đăng nhập chưa
    if (!user?.userId) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Vui lòng đăng nhập để sử dụng tính năng chat với AI.',
        isUser: false,
        timestamp: new Date()
      }
      setAiMessages((prev) => [...prev, errorMessage])
      return
    }

    const userMessageText = inputValue.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userMessageText,
      isUser: true,
      timestamp: new Date()
    }

    setAiMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      // Gọi API chat với AI
      const response = await sendChatMessage({
        senderId: user.userId,
        messageText: userMessageText
      })

      // roomId từ AI chat có thể được lưu nếu cần

      // Thêm tin nhắn từ AI vào danh sách
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.homeLandFinestText,
        isUser: false,
        timestamp: new Date()
      }
      setAiMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error('Error sending message to AI:', error)
      // Hiển thị thông báo lỗi
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Xin lỗi, có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau.',
        isUser: false,
        timestamp: new Date()
      }
      setAiMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
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

  // Gửi tin nhắn seller qua API (backend sẽ tự động gửi SignalR)
  const handleSendSellerMessage = async () => {
    // Phải có ít nhất message hoặc ảnh
    if ((!sellerMessage.trim() && selectedImages.length === 0) || !currentRoomId || !user?.userId) return

    const messageText = sellerMessage.trim() || ''

    try {
      // Debug: Log trước khi gọi API
      console.log('[chatSystem] Before sending:', {
        roomId: currentRoomId,
        senderId: user.userId,
        messageText: messageText,
        messageTextLength: messageText.length,
        selectedImagesCount: selectedImages.length,
        hasImages: selectedImages.length > 0
      })

      // Gửi qua API để lưu vào database
      // Backend sẽ tự động gửi SignalR sau khi lưu DB, SignalR handler sẽ thêm message vào UI
      await sendChatRoomMessage({
        roomId: currentRoomId,
        senderId: user.userId,
        messageText: messageText,
        images: selectedImages.length > 0 ? selectedImages : undefined
      })

      // Reset form
      setSellerMessage('')
      setSelectedImages([])
      setImagePreviews([])
    } catch (error) {
      console.error('Error sending seller message:', error)
      // Hiển thị thông báo lỗi nếu cần
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (activeTab === 'ai') {
        handleSendAIMessage()
      } else if (activeTab === 'seller') {
        handleSendSellerMessage()
      }
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'ai' | 'seller')
    if (value === 'seller') {
      // Nếu có selectedStoreId, giữ lại conversation đã chọn
      if (!selectedStoreId) {
        setSelectedConversation(null)
      }
    } else {
      setSelectedConversation(null)
      setSelectedStoreId(null)
    }
  }

  const handleBackToList = () => {
    setSelectedConversation(null)
    setSelectedStoreId(null)
  }

  const selectedConv = conversations.find((c) => c.id === selectedConversation)
  const currentSellerMessages = selectedConversation ? sellerMessages[selectedConversation] || [] : []
  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread || 0), 0)

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
            className='fixed bottom-6 right-6 z-50'
          >
            <Button
              onClick={() => setIsOpen(true)}
              className='h-16 w-16 rounded-full bg-green-600 hover:bg-green-700 shadow-lg'
              size='icon'
            >
              <MessageCircle className='h-7 w-7 text-white' />
              {totalUnread > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className='absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center'
                >
                  {totalUnread}
                </motion.span>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.1,
              x: 0,
              y: 0,
              borderRadius: '9999px'
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
              borderRadius: '0px'
            }}
            exit={{
              opacity: 0,
              scale: 0.1,
              x: 0,
              y: 0,
              borderRadius: '9999px'
            }}
            transition={{
              duration: 0.4,
              type: 'spring',
              stiffness: 300,
              damping: 25
            }}
            className='fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[calc(100vh-2rem)] sm:h-[600px] max-h-[600px] flex flex-col origin-bottom-right z-50'
          >
            <Card className='h-full flex flex-col border-0 py-0 shadow-2xl overflow-hidden !gap-0'>
              {/* Header */}
              <CardHeader className='bg-green-600 text-white px-5 py-3 rounded-t-xl !px-5 !pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <ShoppingBag className='h-5 w-5' />
                    <CardTitle className='text-white text-base font-semibold'>Tinh Hoa Quê Nhà</CardTitle>
                  </div>
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant='ghost'
                    size='icon'
                    className='h-6 w-6 text-white hover:bg-green-700'
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              </CardHeader>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={handleTabChange} className='flex-1 flex flex-col min-h-0 py-2'>
                <TabsList className='w-full justify-start rounded-none border-b bg-white px-5 flex-shrink-0 !pt-0 !mt-0'>
                  <TabsTrigger
                    value='ai'
                    className='gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-700'
                  >
                    <Bot className='h-4 w-4' />
                    Trợ lý AI
                  </TabsTrigger>
                  <TabsTrigger
                    value='seller'
                    className='gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-700'
                  >
                    <Store className='h-4 w-4' />
                    Tin nhắn
                    {totalUnread > 0 && (
                      <span className='ml-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center'>
                        {totalUnread}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* AI Chat Tab */}
                <TabsContent value='ai' className='flex-1 flex flex-col m-0 min-h-0'>
                  {/* Messages Area */}
                  <div className='flex-1 min-h-0 bg-white/95'>
                    <ScrollArea className='h-full px-5 py-3'>
                      <div className='flex flex-col gap-3 pb-2'>
                        {aiMessages.map((message) => (
                          <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[85%] rounded-lg px-4 py-3 ${message.isUser ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-900'
                                }`}
                            >
                              <div className='flex items-start gap-2'>
                                {!message.isUser && <Bot className='h-4 w-4 mt-0.5 text-green-600 flex-shrink-0' />}
                                {message.isUser && <User className='h-4 w-4 mt-0.5 text-white flex-shrink-0' />}
                                <p className='text-sm leading-relaxed break-words'>{message.text}</p>
                              </div>
                            </div>
                          </div>
                        ))}

                        {isTyping && (
                          <div className='flex justify-start'>
                            <div className='bg-gray-100 rounded-lg px-3 py-2'>
                              <div className='flex items-center gap-2'>
                                <Bot className='h-4 w-4 text-green-600' />
                                <div className='flex space-x-1'>
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
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Input Area */}
                  <div className='px-5 py-3 border-t bg-white/95 flex-shrink-0'>
                    <div className='flex gap-2'>
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder='Nhập tin nhắn...'
                        className='flex-1'
                      />
                      <Button
                        onClick={handleSendAIMessage}
                        disabled={!inputValue.trim()}
                        size='icon'
                        className='bg-green-600 hover:bg-green-700 flex-shrink-0'
                      >
                        <Send className='h-5 w-5' />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Seller Chat Tab */}
                <TabsContent value='seller' className='flex-1 flex flex-col m-0 min-h-0'>
                  {/* Show Conversation List if no conversation selected */}
                  {!selectedConversation ? (
                    <div className='flex-1 flex flex-col min-h-0'>
                      {/* Search */}
                      <div className='p-3 border-b bg-white flex-shrink-0'>
                        <Input placeholder='Tìm kiếm cuộc trò chuyện' className='w-full' />
                      </div>

                      {/* Conversation List */}
                      <div className='flex-1 min-h-0'>
                        <ScrollArea className='h-full'>
                          {loadingRooms ? (
                            <div className='p-4 text-center text-gray-500'>Đang tải...</div>
                          ) : (
                            <div className='divide-y'>
                              {conversations.map((conv) => (
                                <div
                                  key={conv.id}
                                  onClick={() => setSelectedConversation(conv.id)}
                                  className='flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors'
                                >
                                  <div className='relative flex-shrink-0'>
                                    <div className='h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-2xl'>
                                      {conv.avatar}
                                    </div>
                                    {conv.online && (
                                      <div className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white'></div>
                                    )}
                                  </div>
                                  <div className='flex-1 min-w-0'>
                                    <div className='flex items-start justify-between mb-1'>
                                      <h3 className='font-semibold text-sm truncate'>{conv.name}</h3>
                                      {conv.time && (
                                        <span className='text-xs text-gray-500 ml-2 flex-shrink-0'>{conv.time}</span>
                                      )}
                                    </div>
                                    <p className='text-sm text-gray-600 truncate'>{conv.lastMessage}</p>
                                  </div>
                                  {conv.unread && conv.unread > 0 && (
                                    <span className='flex-shrink-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center'>
                                      {conv.unread}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    </div>
                  ) : (
                    /* Show Chat Detail when conversation selected */
                    <div className='flex-1 flex flex-col min-h-0'>
                      {/* Chat Header with Back Button */}
                      <div className='bg-white border-b p-3 flex items-center gap-3 flex-shrink-0'>
                        <Button
                          onClick={handleBackToList}
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 flex-shrink-0'
                        >
                          <ArrowLeft className='h-5 w-5' />
                        </Button>
                        <div className='h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-xl flex-shrink-0'>
                          {selectedConv?.avatar}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <h3 className='font-semibold text-sm truncate'>{selectedConv?.name}</h3>
                          {selectedConv?.online && (
                            <p className='text-xs text-green-600 flex items-center gap-1'>
                              <span className='w-2 h-2 bg-green-600 rounded-full'></span>
                              Đang hoạt động
                            </p>
                          )}
                        </div>
                        <div className='flex items-center gap-1 flex-shrink-0'>
                          <Button variant='ghost' size='icon' className='h-8 w-8'>
                            <Phone className='h-4 w-4' />
                          </Button>
                          <Button variant='ghost' size='icon' className='h-8 w-8'>
                            <Video className='h-4 w-4' />
                          </Button>
                          <Button variant='ghost' size='icon' className='h-8 w-8'>
                            <MoreVertical className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className='flex-1 min-h-0 bg-gray-50'>
                        <ScrollArea className='h-full p-4'>
                          <div className='space-y-3 pb-2'>
                            {loadingMessages ? (
                              <div className='flex items-center justify-center py-8'>
                                <div className='flex flex-col items-center gap-3'>
                                  <div className='flex space-x-1'>
                                    <div className='w-2 h-2 bg-green-600 rounded-full animate-bounce'></div>
                                    <div
                                      className='w-2 h-2 bg-green-600 rounded-full animate-bounce'
                                      style={{ animationDelay: '0.1s' }}
                                    ></div>
                                    <div
                                      className='w-2 h-2 bg-green-600 rounded-full animate-bounce'
                                      style={{ animationDelay: '0.2s' }}
                                    ></div>
                                  </div>
                                  <p className='text-sm text-gray-500'>Đang tải tin nhắn...</p>
                                </div>
                              </div>
                            ) : (
                              <>
                                {currentSellerMessages.map((msg, msgIndex) => (
                                  <React.Fragment key={msg.id}>
                                    {/* Hiển thị ảnh riêng biệt */}
                                    {Array.isArray(msg.images) &&
                                      msg.images.length > 0 &&
                                      msg.images.map((imageUrl, idx) => {
                                        const resolvedUrl = resolveImageUrl(imageUrl)
                                        const imageKey = `${msg.id}-${idx}`
                                        const hasFailed = failedImages.has(imageKey)
                                        const fallbackImage =
                                          'https://i.pinimg.com/736x/91/7a/51/917a51df0d444def3cade8d626305a67.jpg'

                                        // Chuẩn bị danh sách ảnh để preview (tất cả ảnh của message này)
                                        const handleImageClick = () => {
                                          const allImages = msg.images
                                            ? msg.images.map((img) => {
                                              const url = resolveImageUrl(img)
                                              return url || img
                                            })
                                            : []
                                          setPreviewImages(allImages)
                                          setPreviewIndex(idx)
                                          setIsPreviewOpen(true)
                                        }

                                        return (
                                          <motion.div
                                            key={`img-${msg.id}-${idx}`}
                                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            transition={{
                                              duration: 0.3,
                                              delay: msgIndex * 0.05 + idx * 0.05,
                                              ease: 'easeOut'
                                            }}
                                            className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} mb-2`}
                                          >
                                            {!msg.isUser && (
                                              <motion.div
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                                className='h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-sm mr-2 flex-shrink-0'
                                              >
                                                {selectedConv?.avatar}
                                              </motion.div>
                                            )}
                                            {hasFailed ? (
                                              <motion.img
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                src={fallbackImage}
                                                alt={`Image ${idx + 1} (fallback)`}
                                                className='max-w-[200px] sm:max-w-[250px] max-h-[200px] sm:max-h-[300px] rounded-lg cursor-pointer object-contain shadow-md'
                                                onClick={handleImageClick}
                                                onError={() => {
                                                  console.error('[chatSystem] Fallback image also failed to load')
                                                }}
                                              />
                                            ) : (
                                              <motion.img
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                transition={{ duration: 0.2 }}
                                                src={resolvedUrl || imageUrl}
                                                alt={`Image ${idx + 1}`}
                                                className='max-w-[200px] sm:max-w-[250px] max-h-[200px] sm:max-h-[300px] rounded-lg cursor-pointer object-contain shadow-md'
                                                onClick={handleImageClick}
                                                loading='lazy'
                                                onError={(e) => {
                                                  const img = e.currentTarget as HTMLImageElement
                                                  console.error('[chatSystem] Image load error:', {
                                                    attemptedUrl: img.src,
                                                    originalUrl: imageUrl
                                                  })
                                                  if (img && img.src !== fallbackImage) {
                                                    img.src = fallbackImage
                                                  } else {
                                                    setFailedImages((prev) => new Set(prev).add(imageKey))
                                                  }
                                                }}
                                                onLoad={() => {
                                                  console.log(
                                                    '[chatSystem] Image loaded successfully:',
                                                    resolvedUrl || imageUrl
                                                  )
                                                }}
                                              />
                                            )}
                                          </motion.div>
                                        )
                                      })}
                                    {/* Hiển thị text riêng biệt (nếu có) */}
                                    {msg.text && (
                                      <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{
                                          duration: 0.3,
                                          delay: msgIndex * 0.05,
                                          ease: 'easeOut'
                                        }}
                                        className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} mb-2`}
                                      >
                                        {!msg.isUser && (
                                          <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                            className='h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-sm mr-2 flex-shrink-0'
                                          >
                                            {selectedConv?.avatar}
                                          </motion.div>
                                        )}
                                        <motion.div
                                          whileHover={{ scale: 1.02 }}
                                          className={`max-w-[85%] sm:max-w-[70%] ${msg.isUser
                                            ? 'bg-green-600 text-white rounded-2xl rounded-br-sm'
                                            : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm'
                                            } px-4 py-3 shadow-sm`}
                                        >
                                          <p className='text-sm break-words'>{msg.text}</p>
                                        </motion.div>
                                      </motion.div>
                                    )}
                                  </React.Fragment>
                                ))}
                                <div ref={messagesEndRef} />
                              </>
                            )}
                          </div>
                        </ScrollArea>
                      </div>

                      {/* Input */}
                      <div className='bg-white border-t p-3 flex-shrink-0'>
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

                        <div className='flex items-center gap-2'>
                          <Button variant='ghost' size='icon' className='h-9 w-9 flex-shrink-0'>
                            <Paperclip className='h-4 w-4 text-gray-500' />
                          </Button>
                          <input
                            type='file'
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            accept='image/*'
                            multiple
                            className='hidden'
                            id='seller-image-input'
                          />
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-9 w-9 flex-shrink-0'
                            onClick={() => fileInputRef.current?.click()}
                            disabled={selectedImages.length >= 3}
                            title={selectedImages.length >= 3 ? 'Tối đa 3 ảnh' : 'Chọn ảnh'}
                          >
                            <Image className='h-4 w-4 text-gray-500' />
                          </Button>
                          <Input
                            placeholder='Nhập tin nhắn...'
                            value={sellerMessage}
                            onChange={(e) => setSellerMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className='flex-1'
                            disabled={loadingMessages || !currentRoomId}
                          />
                          <Button
                            onClick={handleSendSellerMessage}
                            disabled={
                              (!sellerMessage.trim() && selectedImages.length === 0) ||
                              loadingMessages ||
                              !currentRoomId
                            }
                            size='icon'
                            className='bg-green-600 hover:bg-green-700 text-white rounded-lg h-9 w-9 flex-shrink-0'
                          >
                            <Send className='h-4 w-4' />
                          </Button>
                        </div>
                        {selectedImages.length > 0 && (
                          <p className='text-xs text-gray-500 mt-2'>Đã chọn {selectedImages.length}/3 ảnh</p>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        images={previewImages}
        initialIndex={previewIndex}
        alt='Chat image'
      />
    </>
  )
}

export default ChatSystem
