import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { MessageCircle, Send, X, Bot, User } from 'lucide-react'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

const ChatBot: React.FC = () => {
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate bot response
    setTimeout(() => {
      const botResponse = generateBotResponse(inputValue)
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isUser: false,
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, botMessage])
      setIsTyping(false)
    }, 1000)
  }

  const generateBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()

    if (input.includes('sản phẩm') || input.includes('nông sản')) {
      return 'Chúng tôi có rất nhiều sản phẩm nông sản chất lượng cao từ khắp các vùng miền Việt Nam như gạo, rau củ, trái cây, thảo dược... Bạn có thể xem chi tiết tại trang sản phẩm hoặc cho tôi biết bạn quan tâm đến loại sản phẩm nào cụ thể?'
    }

    if (input.includes('câu chuyện') || input.includes('story')) {
      return 'Tôi rất vui được chia sẻ những câu chuyện cảm động từ các nhà sản xuất nông sản. Mỗi sản phẩm đều mang trong mình một câu chuyện về tình yêu đất, tình yêu nghề. Bạn có thể khám phá tại trang "Câu Chuyện Đồng Quê" hoặc hỏi tôi về câu chuyện cụ thể nào đó.'
    }

    if (input.includes('giá') || input.includes('mua') || input.includes('đặt hàng')) {
      return 'Để mua sản phẩm, bạn có thể: 1) Chọn sản phẩm từ trang sản phẩm, 2) Thêm vào giỏ hàng, 3) Thanh toán. Tôi có thể hướng dẫn bạn chi tiết từng bước. Bạn muốn mua sản phẩm nào?'
    }

    if (input.includes('vận chuyển') || input.includes('ship')) {
      return 'Chúng tôi giao hàng toàn quốc với nhiều phương thức vận chuyển khác nhau. Phí ship sẽ được tính dựa trên khoảng cách và trọng lượng sản phẩm. Thời gian giao hàng thường từ 2-5 ngày làm việc.'
    }

    if (input.includes('chất lượng') || input.includes('organic') || input.includes('hữu cơ')) {
      return 'Tất cả sản phẩm của chúng tôi đều được kiểm định chất lượng nghiêm ngặt, có chứng nhận hữu cơ và đảm bảo an toàn thực phẩm. Chúng tôi cam kết mang đến những sản phẩm tốt nhất cho sức khỏe gia đình bạn.'
    }

    if (input.includes('cảm ơn') || input.includes('thanks')) {
      return 'Không có gì! Tôi rất vui được hỗ trợ bạn. Nếu bạn có thêm câu hỏi nào khác, đừng ngần ngại hỏi tôi nhé! 😊'
    }

    return 'Cảm ơn bạn đã hỏi! Tôi có thể giúp bạn tìm hiểu về sản phẩm, câu chuyện của người nông dân, hướng dẫn mua hàng, hoặc bất kỳ thông tin nào khác về Tinh Hoa Quê Nhà. Bạn có thể hỏi cụ thể hơn không?'
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
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className='fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-green-600 hover:bg-green-700 shadow-lg'
          size='icon'
        >
          <MessageCircle className='h-7 w-7 text-white' />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className='fixed bottom-6 right-6 w-96 h-[600px] flex flex-col'>
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
        </div>
      )}
    </>
  )
}

export default ChatBot
