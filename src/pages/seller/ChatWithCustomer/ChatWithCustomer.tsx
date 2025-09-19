import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'
import { Search, Phone, Video, MoreVertical, Paperclip, Image as ImageIcon, Send, Share2 } from 'lucide-react'

function ChatWithCustomer() {
  const [selectedChat, setSelectedChat] = useState(1)
  const [message, setMessage] = useState('')

  // Mock data
  const conversations = [
    {
      id: 1,
      name: 'Cửa hàng Đặc sản Hà Giang',
      lastMessage: 'Chào bạn! Mình có thêm bánh buckwheat mới về...',
      timestamp: '10:30',
      unreadCount: 2,
      avatar: '/api/placeholder/40/40',
      isActive: true
    },
    {
      id: 2,
      name: 'Nguyễn Văn Minh',
      lastMessage: 'Cảm ơn shop, sản phẩm rất chất lượng!',
      timestamp: 'Hôm qua',
      unreadCount: 0,
      avatar: '/api/placeholder/40/40',
      isActive: false
    },
    {
      id: 3,
      name: 'Làng nghề Bát Tràng',
      lastMessage: 'Bộ ấm chén đã sẵn sàng giao hàng',
      timestamp: '2 ngày',
      unreadCount: 0,
      avatar: '/api/placeholder/40/40',
      isActive: false
    }
  ]

  const messages = [
    {
      id: 1,
      sender: 'shop',
      content:
        'Chào bạn! Cảm ơn bạn đã quan tâm đến bánh tam giác mạch của shop. Mình có thêm lô mới về rất thơm ngon đó!',
      timestamp: '10:25',
      avatar: '/api/placeholder/32/32'
    },
    {
      id: 2,
      sender: 'customer',
      content: 'Bánh có thể bảo quản được bao lâu ạ? Mình muốn mua làm quà cho gia đình.',
      timestamp: '10:26'
    },
    {
      id: 3,
      sender: 'shop',
      content:
        'Bánh có thể bảo quản 7-10 ngày ở nhiệt độ thường, hoặc 1 tháng nếu cho vào tủ lạnh. Đây là hình ảnh lô mới',
      timestamp: '10:28',
      avatar: '/api/placeholder/32/32',
      image: '/api/placeholder/200/150'
    },
    {
      id: 4,
      sender: 'customer',
      content: 'Wao trông ngon quá! Mình muốn đặt 2 hộp. Ship tôi Hà Nội được không ạ?',
      timestamp: '10:30'
    },
    {
      id: 5,
      sender: 'shop',
      content: '',
      timestamp: '10:32',
      avatar: '/api/placeholder/32/32',
      isTyping: true
    }
  ]

  const currentChat = conversations.find((chat) => chat.id === selectedChat)

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Sending message:', message)
      setMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className='h-screen bg-gray-50 flex'>
      {/* Left Sidebar - Chat List */}
      <div className='w-80 bg-white border-r border-gray-200 flex flex-col'>
        {/* Header */}
        <div className='bg-green-700 text-white p-4'>
          <h1 className='text-lg font-semibold'>Tin nhắn</h1>
          <p className='text-sm text-green-100'>Tinh hoa quê nhà</p>
        </div>

        {/* Search Bar */}
        <div className='p-4 border-b border-gray-200'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <Input placeholder='Tìm kiếm cuộc trò chuyện...' className='pl-10 bg-gray-50 border-gray-200' />
          </div>
        </div>

        {/* Chat List */}
        <div className='flex-1 overflow-y-auto'>
          {conversations.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                chat.id === selectedChat ? 'bg-green-50 border-l-4 border-l-green-500' : ''
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
                    <span className='text-xs text-gray-500'>{chat.timestamp}</span>
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
          ))}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className='flex-1 flex flex-col'>
        {/* Chat Header */}
        <div className='bg-white border-b border-gray-200 p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='relative'>
                <div className='w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center'>
                  <span className='text-sm font-medium text-gray-600'>{currentChat?.name.charAt(0)}</span>
                </div>
                <div className='absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white'></div>
              </div>
              <div>
                <h2 className='font-semibold text-gray-900'>{currentChat?.name}</h2>
                <p className='text-sm text-green-600 flex items-center gap-1'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  Đang hoạt động
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Button variant='ghost' size='sm' className='text-gray-600 hover:text-gray-900'>
                <Phone className='w-4 h-4' />
              </Button>
              <Button variant='ghost' size='sm' className='text-gray-600 hover:text-gray-900'>
                <Video className='w-4 h-4' />
              </Button>
              <Button variant='ghost' size='sm' className='text-gray-600 hover:text-gray-900'>
                <MoreVertical className='w-4 h-4' />
              </Button>
            </div>
          </div>

          {/* Product Card */}
          <div className='mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center'>
                  <span className='text-xs text-gray-600'>IMG</span>
                </div>
                <div>
                  <h4 className='font-medium text-gray-900'>Bánh tam giác mạch Hà Giang</h4>
                  <p className='text-sm text-green-600 font-medium'>120.000₫ - 150.000₫</p>
                </div>
              </div>
              <Button variant='ghost' size='sm' className='text-gray-600 hover:text-gray-900'>
                <Share2 className='w-4 h-4' />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          {/* Date Separator */}
          <div className='text-center'>
            <span className='text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full'>Hôm nay</span>
          </div>

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2 max-w-xs lg:max-w-md ${msg.sender === 'customer' ? 'flex-row-reverse' : ''}`}>
                {msg.sender === 'shop' && (
                  <div className='w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0'>
                    <span className='text-xs font-medium text-gray-600'>S</span>
                  </div>
                )}

                <div
                  className={`rounded-lg px-3 py-2 ${
                    msg.sender === 'customer' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-900'
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
                      <p className='text-sm'>{msg.content}</p>
                      {msg.image && (
                        <div className='mt-2'>
                          <img src={msg.image} alt='Product' className='w-32 h-24 object-cover rounded-lg' />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className='bg-white border-t border-gray-200 p-4'>
          <div className='flex items-center gap-3'>
            <Button variant='ghost' size='sm' className='text-gray-600 hover:text-gray-900'>
              <Paperclip className='w-4 h-4' />
            </Button>
            <Button variant='ghost' size='sm' className='text-gray-600 hover:text-gray-900'>
              <ImageIcon className='w-4 h-4' />
            </Button>

            <div className='flex-1'>
              <Input
                placeholder='Nhập tin nhắn...'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className='border-gray-200 focus:border-green-500 focus:ring-green-500'
              />
            </div>

            <Button
              onClick={handleSendMessage}
              className='bg-green-600 hover:bg-green-700 text-white'
              disabled={!message.trim()}
            >
              <Send className='w-4 h-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatWithCustomer
