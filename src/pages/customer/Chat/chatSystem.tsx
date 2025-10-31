import React, { useState, useRef, useEffect } from 'react'
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

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  hasImage?: boolean
}

interface Conversation {
  id: number
  name: string
  avatar: string
  lastMessage: string
  online?: boolean
  time?: string
  unread?: number
  storeId?: string
}

const ChatSystem: React.FC = () => {
  const { isOpen, setIsOpen, activeTab, setActiveTab, selectedStoreId, selectedStoreName, setSelectedStoreId } =
    useChat()
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [dynamicConversations, setDynamicConversations] = useState<Conversation[]>([])
  const [aiMessages, setAiMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là trợ lý ảo của Tinh Hoa Quê Nhà. Tôi có thể giúp bạn tìm hiểu về sản phẩm, câu chuyện người nông dân, hoặc hỗ trợ mua sắm. Bạn cần tôi giúp gì?',
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [sellerMessage, setSellerMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const baseConversations: Conversation[] = [
    {
      id: 1,
      name: 'Cửa hàng Đặc sản Hà Giang',
      avatar: '🏪',
      lastMessage: 'Các bánh kẹnh có thêm bánh su',
      online: true,
      unread: 2,
      storeId: 'store-1'
    },
    {
      id: 2,
      name: 'Nguyễn Văn Minh',
      avatar: '👨',
      lastMessage: 'Cảm ơn shop, sản phẩm rất ok',
      time: 'Hôm qua',
      storeId: 'store-2'
    },
    {
      id: 3,
      name: 'Làng nghề Bát Tràng',
      avatar: '🏺',
      lastMessage: 'Bộ ấm chén đã sẵn sàng giao hàng',
      time: '2 ngày',
      storeId: 'store-3'
    }
  ]

  // Kết hợp conversations cố định và động
  const conversations = [...baseConversations, ...dynamicConversations]

  // Tự động chọn hoặc tạo conversation khi selectedStoreId thay đổi
  useEffect(() => {
    if (selectedStoreId && isOpen) {
      // Tìm trong cả base và dynamic conversations
      const allConversations = [...baseConversations, ...dynamicConversations]
      const foundConversation = allConversations.find((conv) => conv.storeId === selectedStoreId)

      if (foundConversation) {
        setSelectedConversation(foundConversation.id)
        setActiveTab('seller')
      } else {
        // Tạo conversation mới nếu không tìm thấy
        const newConversationId = Date.now()
        const newConversation: Conversation = {
          id: newConversationId,
          name: selectedStoreName || 'Cửa hàng',
          avatar: '🏪',
          lastMessage: 'Bắt đầu cuộc trò chuyện',
          online: true,
          storeId: selectedStoreId
        }

        setDynamicConversations((prev) => {
          // Kiểm tra xem conversation với storeId này đã tồn tại chưa
          const existing = prev.find((c) => c.storeId === selectedStoreId)
          if (existing) {
            setSelectedConversation(existing.id)
            return prev
          }
          return [...prev, newConversation]
        })

        setSelectedConversation(newConversationId)
        setActiveTab('seller')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId, isOpen, selectedStoreName])

  const sellerMessages: { [key: number]: Message[] } = {
    1: [
      {
        id: '1',
        text: 'Chào bạn! Cảm ơn bạn đã quan tâm đến bánh tầm giác mạch của shop. Mình có thêm lô mới vô rất thơm ngon đó!',
        isUser: false,
        timestamp: new Date()
      },
      {
        id: '2',
        text: 'Bánh có thể bảo quản được bao lâu ạ? Mình muốn mua làm quà cho gia đình.',
        isUser: true,
        timestamp: new Date()
      },
      {
        id: '3',
        text: 'Bánh có thể bảo quản 7-10 ngày ở nhiệt độ thường, hoặc 1 tháng nếu cho vào tủ lạnh. Đây là hình ảnh lô mới:',
        isUser: false,
        timestamp: new Date(),
        hasImage: true
      }
    ],
    2: [
      {
        id: '1',
        text: 'Xin chào shop!',
        isUser: true,
        timestamp: new Date()
      },
      {
        id: '2',
        text: 'Cảm ơn shop, sản phẩm rất ok chất lượng!',
        isUser: true,
        timestamp: new Date()
      }
    ]
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [aiMessages, selectedConversation])

  const handleSendAIMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    }

    setAiMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    setTimeout(() => {
      const botResponse = generateBotResponse(inputValue)
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isUser: false,
        timestamp: new Date()
      }
      setAiMessages((prev) => [...prev, botMessage])
      setIsTyping(false)
    }, 1000)
  }

  const generateBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()
    if (input.includes('sản phẩm'))
      return 'Chúng tôi có rất nhiều sản phẩm nông sản chất lượng cao. Bạn quan tâm loại sản phẩm nào?'
    if (input.includes('giá'))
      return 'Giá sản phẩm rất cạnh tranh. Bạn có thể xem chi tiết tại trang sản phẩm hoặc hỏi trực tiếp người bán.'
    if (input.includes('seller') || input.includes('người bán'))
      return 'Bạn có thể chuyển sang tab "Tin nhắn" để chat trực tiếp với người bán nhé!'
    return 'Cảm ơn bạn! Tôi có thể giúp bạn về sản phẩm, mua hàng, hoặc kết nối với người bán. Bạn cần gì?'
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (activeTab === 'ai') {
        handleSendAIMessage()
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
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className='fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-green-600 hover:bg-green-700 shadow-lg'
          size='icon'
        >
          <MessageCircle className='h-7 w-7 text-white' />
          {totalUnread > 0 && (
            <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center'>
              {totalUnread}
            </span>
          )}
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className='fixed bottom-6 right-6 w-96 h-[600px] flex flex-col'>
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
                            className={`max-w-[85%] rounded-lg px-4 py-3 ${
                              message.isUser ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-900'
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
                      </ScrollArea>
                    </div>
                  </div>
                ) : (
                  /* Show Chat Detail when conversation selected */
                  <div className='flex-1 flex flex-col min-h-0'>
                    {/* Chat Header with Back Button */}
                    <div className='bg-white border-b p-3 flex items-center gap-3 flex-shrink-0'>
                      <Button onClick={handleBackToList} variant='ghost' size='icon' className='h-8 w-8 flex-shrink-0'>
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
                          {currentSellerMessages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                              {!msg.isUser && (
                                <div className='h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-sm mr-2 flex-shrink-0'>
                                  {selectedConv?.avatar}
                                </div>
                              )}
                              <div
                                className={`max-w-[70%] ${
                                  msg.isUser
                                    ? 'bg-green-600 text-white rounded-2xl rounded-br-sm'
                                    : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm'
                                } p-3 shadow-sm`}
                              >
                                <p className='text-sm break-words'>{msg.text}</p>
                                {msg.hasImage && (
                                  <div className='mt-2 rounded-lg overflow-hidden bg-gray-200 h-32 flex items-center justify-center'>
                                    <span className='text-4xl'>🍪</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Input */}
                    <div className='bg-white border-t p-3 flex-shrink-0'>
                      <div className='flex items-center gap-2'>
                        <Button variant='ghost' size='icon' className='h-9 w-9 flex-shrink-0'>
                          <Paperclip className='h-4 w-4 text-gray-500' />
                        </Button>
                        <Button variant='ghost' size='icon' className='h-9 w-9 flex-shrink-0'>
                          <Image className='h-4 w-4 text-gray-500' />
                        </Button>
                        <Input
                          placeholder='Nhập tin nhắn...'
                          value={sellerMessage}
                          onChange={(e) => setSellerMessage(e.target.value)}
                          className='flex-1'
                        />
                        <Button
                          size='icon'
                          className='bg-green-600 hover:bg-green-700 text-white rounded-lg h-9 w-9 flex-shrink-0'
                        >
                          <Send className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      )}
    </>
  )
}

export default ChatSystem
