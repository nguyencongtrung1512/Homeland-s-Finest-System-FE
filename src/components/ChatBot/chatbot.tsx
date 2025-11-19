import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { MessageCircle, Send, X, Bot, User } from 'lucide-react'
import { sendChatMessage } from '../../apis/chat.api'
import { useAuth } from '../../contexts/auth.context'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

const ChatBot: React.FC = () => {
  const { user } = useAuth()
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Kiểm tra user đã đăng nhập chưa
    if (!user?.userId) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Vui lòng đăng nhập để sử dụng tính năng chat với AI.',
        isUser: false,
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, errorMessage])
      return
    }

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
      // Gọi API chat với AI
      const response = await sendChatMessage({
        senderId: user.userId,
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
        timestamp: new Date()
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
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-lg px-4 py-3 ${message.isUser ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-900'
                          }`}
                      >
                        <div className='flex items-start gap-2'>
                          {!message.isUser && <Bot className='h-4 w-4 mt-0.5 text-green-600 flex-shrink-0' />}
                          {message.isUser && <User className='h-4 w-4 mt-0.5 text-white flex-shrink-0' />}
                          <p className='text-base leading-relaxed'>{message.text}</p>
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
