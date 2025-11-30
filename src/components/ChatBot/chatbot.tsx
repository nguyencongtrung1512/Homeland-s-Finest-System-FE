import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { MessageCircle, Send, X, Bot, User, ExternalLink } from 'lucide-react'
import { sendChatMessage } from '../../apis/chat.api'
import { useAuth } from '../../contexts/auth.context'
import { useNavigate } from 'react-router-dom'
import path from '../../constants/path'
import { resolveImageUrl } from '../../utils/image'

// Default image URL khi không load được ảnh
const DEFAULT_IMAGE_URL = 'https://i.pinimg.com/736x/91/7a/51/917a51df0d444def3cade8d626305a67.jpg'

interface RecommendedProduct {
  productId: string
  productName: string
  price: number
  imageUrl: string
  productLink: string
}

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  recommendedProducts?: RecommendedProduct[] // Recommended products from AI
}

const ChatBot: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là trợ lý ảo của Tinh Hoa Quê Nhà. Tôi có thể giúp bạn tìm hiểu về các sản phẩm nông sản, câu chuyện của người nông dân, hoặc hỗ trợ bạn trong việc mua sắm. Bạn cần tôi giúp gì?',
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [, setRoomId] = useState<string | null>(null) // Lưu roomId để có thể dùng cho các tính năng sau (lưu lịch sử chat, tiếp tục conversation)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Tạo hoặc lấy guest ID từ localStorage cho user chưa đăng nhập
  const getGuestId = (): string => {
    const guestIdKey = 'chatbot_guest_id'
    let guestId = localStorage.getItem(guestIdKey)
    if (!guestId) {
      // Tạo UUID đơn giản
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      localStorage.setItem(guestIdKey, guestId)
    }
    return guestId
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessageText = inputValue.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userMessageText,
      isUser: true,
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      // Sử dụng userId nếu đã đăng nhập, nếu không thì dùng guestId
      const senderId = user?.userId || getGuestId()

      // Gọi API chat với AI
      const response = await sendChatMessage({
        senderId: senderId,
        messageText: userMessageText
      })

      // Lưu roomId nếu có (có thể dùng để tiếp tục conversation sau)
      if (response.data.roomId) {
        setRoomId(response.data.roomId)
        // roomId có thể được dùng cho các tính năng như lưu lịch sử chat, tiếp tục conversation, etc.
      }

      // Thêm tin nhắn từ AI vào danh sách
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.homeLandFinestText,
        isUser: false,
        timestamp: new Date(),
        recommendedProducts:
          response.data.recommendedProducts && Array.isArray(response.data.recommendedProducts)
            ? response.data.recommendedProducts
            : undefined
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error('Error sending message to AI:', error)
      // Hiển thị thông báo lỗi
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Xin lỗi, có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau.',
        isUser: false,
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

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
            className='fixed bottom-6 right-6 w-96 h-[600px] flex flex-col origin-bottom-right'
          >
            <Card className='h-full flex flex-col shadow-2xl border-0 py-0 rounded-xl overflow-hidden'>
              {/* Header */}
              <CardHeader className='bg-green-600 text-white px-5 py-3 rounded-t-xl !px-5'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Bot className='h-5 w-5' />
                    <CardTitle className='text-white text-base font-semibold'>Trợ lý Tinh Hoa Quê Nhà</CardTitle>
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

              {/* Messages */}
              <CardContent className='flex-1 px-5 py-2 overflow-y-auto bg-white/95 !px-5'>
                <div className='flex flex-col gap-3'>
                  {messages.map((message) => {
                    // Parse markdown (bold với **text**)
                    const parseMarkdown = (text: string, baseKey: number): (string | React.JSX.Element)[] => {
                      const parts: (string | React.JSX.Element)[] = []
                      const boldRegex = /\*\*(.+?)\*\*/g
                      let lastIndex = 0
                      let match
                      let keyIndex = 0

                      while ((match = boldRegex.exec(text)) !== null) {
                        // Thêm text trước bold
                        if (match.index > lastIndex) {
                          parts.push(text.substring(lastIndex, match.index))
                        }

                        // Thêm bold text
                        parts.push(
                          <strong key={`bold-${baseKey}-${keyIndex++}`} className='font-semibold'>
                            {match[1]}
                          </strong>
                        )

                        lastIndex = match.index + match[0].length
                      }

                      // Thêm phần text còn lại
                      if (lastIndex < text.length) {
                        parts.push(text.substring(lastIndex))
                      }

                      return parts.length > 0 ? parts : [text]
                    }

                    // Parse text để format markdown, links và line breaks
                    const parseTextWithFormatting = (text: string) => {
                      // Tách text thành các dòng để xử lý line breaks
                      const lines = text.split('\n')
                      const result: (string | React.JSX.Element)[][] = []

                      lines.forEach((line, lineIndex) => {
                        const lineParts: (string | React.JSX.Element)[] = []

                        // Tìm pattern: /products/{productId} hoặc /product/{productId}
                        const productLinkRegex = /\/product[s]?\/([a-f0-9-]+)/gi
                        let lastIndex = 0
                        let match
                        let linkIndex = 0

                        while ((match = productLinkRegex.exec(line)) !== null) {
                          // Thêm text trước link
                          if (match.index > lastIndex) {
                            const beforeLink = line.substring(lastIndex, match.index)
                            // Parse markdown trong phần text trước link
                            lineParts.push(...parseMarkdown(beforeLink, linkIndex++))
                          }

                          // Thêm link
                          const productId = match[1]
                          const fullMatch = match[0]
                          lineParts.push(
                            <a
                              key={`link-${linkIndex++}`}
                              href={`${window.location.origin}${path.productDetail.replace(':id', productId)}`}
                              onClick={(e) => {
                                e.preventDefault()
                                navigate(path.productDetail.replace(':id', productId))
                              }}
                              className='text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1'
                            >
                              {fullMatch}
                              <ExternalLink className='h-3 w-3' />
                            </a>
                          )

                          lastIndex = match.index + fullMatch.length
                        }

                        // Thêm phần text còn lại
                        if (lastIndex < line.length) {
                          const remainingText = line.substring(lastIndex)
                          lineParts.push(...parseMarkdown(remainingText, linkIndex++))
                        }

                        // Nếu line rỗng, thêm space để tạo khoảng cách
                        if (lineParts.length === 0 && line.trim() === '') {
                          result.push([<br key={`br-${lineIndex}`} />])
                        } else {
                          result.push(lineParts)
                        }
                      })

                      // Flatten và thêm line breaks giữa các dòng
                      const flattened: (string | React.JSX.Element)[] = []
                      result.forEach((lineParts, index) => {
                        flattened.push(...lineParts)
                        if (index < result.length - 1) {
                          flattened.push(<br key={`line-break-${index}`} />)
                        }
                      })

                      return flattened.length > 0 ? flattened : [text]
                    }

                    return (
                      <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[95%] sm:max-w-[90%] md:max-w-[80%] rounded-lg px-4 py-3 ${message.isUser ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-900'
                            }`}
                        >
                          <div className='flex flex-col gap-3'>
                            {/* Avatar và Text */}
                            <div className='flex items-start gap-2'>
                              {!message.isUser && <Bot className='h-4 w-4 mt-0.5 text-green-600 flex-shrink-0' />}
                              {message.isUser && <User className='h-4 w-4 mt-0.5 text-white flex-shrink-0' />}
                              <div className='flex-1'>
                                <div className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                  {!message.isUser ? parseTextWithFormatting(message.text) : message.text}
                                </div>
                              </div>
                            </div>

                            {/* Hiển thị recommended products dạng list */}
                            {!message.isUser &&
                              message.recommendedProducts &&
                              message.recommendedProducts.length > 0 && (
                                <div className='mt-2 bg-white rounded-lg border border-gray-200 overflow-hidden'>
                                  <div className='max-h-[300px] overflow-y-auto'>
                                    <div className='divide-y divide-gray-100'>
                                      {message.recommendedProducts.map((product, index) => (
                                        <motion.div
                                          key={product.productId}
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ duration: 0.3, delay: index * 0.1 }}
                                          className='p-3 hover:bg-gray-50 transition-colors cursor-pointer'
                                          onClick={() => {
                                            const productId = product.productId
                                            navigate(path.productDetail.replace(':id', productId))
                                          }}
                                        >
                                          <div className='flex gap-3 items-center'>
                                            <img
                                              src={
                                                product.imageUrl
                                                  ? resolveImageUrl(product.imageUrl) ||
                                                  product.imageUrl ||
                                                  DEFAULT_IMAGE_URL
                                                  : DEFAULT_IMAGE_URL
                                              }
                                              alt={product.productName}
                                              className='w-12 h-12 rounded-lg object-cover flex-shrink-0'
                                              onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                // Chỉ set lại nếu chưa phải là default image
                                                if (target.src !== DEFAULT_IMAGE_URL) {
                                                  target.src = DEFAULT_IMAGE_URL
                                                }
                                              }}
                                            />
                                            <div className='flex-1 min-w-0'>
                                              <h4 className='font-semibold text-sm text-gray-900 truncate'>
                                                {product.productName}
                                              </h4>
                                              <p className='text-green-600 font-bold text-xs mt-0.5'>
                                                {product.price.toLocaleString('vi-VN')}₫
                                              </p>
                                            </div>
                                            <ExternalLink className='h-4 w-4 text-gray-400 flex-shrink-0' />
                                          </div>
                                        </motion.div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

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
              </CardContent>

              {/* Input */}
              <div className='px-5 py-3 border-t bg-white/95'>
                <div className='flex gap-2'>
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder='Nhập tin nhắn...'
                    className='flex-1 h-11'
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    size='icon'
                    className='bg-green-600 hover:bg-green-700 h-11 w-11'
                  >
                    <Send className='h-5 w-5' />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ChatBot
