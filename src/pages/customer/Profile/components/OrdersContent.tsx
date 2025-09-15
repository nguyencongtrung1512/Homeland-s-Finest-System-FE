import { useState } from 'react'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import ReportModal from './ReportModal'
import CancelOrderModal from './CancelOrderModal'
import OrderDetailModal from './OrderDetailModal'
import ReviewModal from './ReviewModal'

interface Order {
  id: string
  date: string
  status: 'Đang giao' | 'Đã giao' | 'Đã hủy' | 'Chờ xác nhận' | 'Đã xác nhận'
  statusColor: string
  statusBgColor: string
  statusText: string
  products: {
    id?: string
    name: string
    image: string
    description?: string
    hasRefund?: boolean
    refundNote?: string
    quantity?: string
    price?: number
    variant?: string
  }[]
  total: string
  totalAmount?: number
  originalTotal?: string
  note?: string
  canReturn?: boolean
  returnDeadline?: string
  // Action states
  showRefundRequest?: boolean // TH1: Shipper giao mà khách không nhận
  autoRefund?: boolean // TH2: Chưa xác nhận, tự hoàn tiền
  autoConfirmDays?: number // Số ngày tự động xác nhận nhận hàng
  canConfirmReceived?: boolean // Có thể click "Đã nhận được hàng"
  // Detail modal data
  shippingInfo?: {
    recipientName: string
    phone: string
    address: string
    note?: string
  }
  transactionInfo?: {
    orderId: string
    paymentDate: string
    paymentMethod: string
  }
  timeline?: {
    status: string
    date: string
    isCompleted: boolean
    isCurrent: boolean
  }[]
}

export default function OrdersContent() {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedFilter, setSelectedFilter] = useState<string>('all') // 'all', 'Đang giao', 'Đã giao', 'Chờ xử lý', 'Đã hủy'
  const [showReportModal, setShowReportModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<{ name: string; image: string; category?: string } | null>(
    null
  )
  const [selectedOrderId, setSelectedOrderId] = useState<string>('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const ordersPerPage = 3

  const orders: Order[] = [
    // TH1: Đã giao hàng thành công - Khách đã nhận được hàng
    {
      id: 'DH001234',
      date: 'Ngày đặt: 15/01/2024',
      status: 'Đã giao',
      statusColor: 'text-green-700',
      statusBgColor: 'bg-green-50',
      statusText: 'Đã về đến nhà bạn rồi',
      products: [
        {
          id: '1',
          name: 'Báo chì hiệu cư babi',
          image: '/src/assets/luachin2-7984.webp',
          quantity: '2',
          price: 450000,
          variant: 'Combo báo chì nướng lửa'
        }
      ],
      total: '450.000đ',
      totalAmount: 450000,
      canConfirmReceived: true,
      autoConfirmDays: 7,
      shippingInfo: {
        recipientName: 'Nguyễn Văn An',
        phone: '0987 654 321',
        address: '123 Đường Lê Lợi, Phường 1, Quận 1, TP.HCM',
        note: 'Giao hàng vào buổi sáng, gọi trước 15 phút'
      },
      transactionInfo: {
        orderId: '430324731',
        paymentDate: 'Ngày hôm nay',
        paymentMethod: '10:00 AM'
      },
      timeline: [
        {
          status: 'Đặt hàng',
          date: '15/01/2024',
          isCompleted: true,
          isCurrent: false
        },
        {
          status: 'Đã giao',
          date: 'Hôm nay, image 8 đầy đã xác hoàn thành',
          isCompleted: true,
          isCurrent: false
        },
        {
          status: 'Tài nhà',
          date: '',
          isCompleted: true,
          isCurrent: false
        }
      ]
    },

    // TH2: Đang giao - Shipper đang giao hàng
    {
      id: 'ORD-2024-004',
      date: 'Ngày đặt: 10/01/2024',
      status: 'Đang giao',
      statusColor: 'text-blue-700',
      statusBgColor: 'bg-blue-50',
      statusText: 'Đang trên đường đến với bạn',
      products: [
        {
          name: 'Apple Watch Series 9',
          image: '/src/assets/react.svg',
          quantity: 'và 3 sản phẩm khác'
        }
      ],
      total: '15.490.000đ'
    },

    // TH3: Đã hủy - TH1 Bom hàng (Shipper giao mà khách không nhận)
    {
      id: 'ORD-2024-003',
      date: 'Ngày đặt: 10/01/2024',
      status: 'Đã hủy',
      statusColor: 'text-red-700',
      statusBgColor: 'bg-red-50',
      statusText: 'Đã hủy, hẹn bạn lần sau',
      products: [
        {
          name: 'Apple Watch Series 9',
          image: '/src/assets/react.svg',
          hasRefund: true,
          quantity: 'và 3 sản phẩm khác'
        }
      ],
      total: '15.490.000đ',
      showRefundRequest: true
    },

    // TH4: Đã hủy - TH2 Tự động hoàn tiền (Cửa hàng chưa xác nhận)
    {
      id: 'ORD-2024-002',
      date: 'Ngày đặt: 08/01/2024',
      status: 'Đã hủy',
      statusColor: 'text-red-700',
      statusBgColor: 'bg-red-50',
      statusText: 'Đã hủy, hẹn bạn lần sau',
      products: [
        {
          name: 'Apple Watch Series 9',
          image: '/src/assets/react.svg',
          hasRefund: true,
          quantity: 'và 3 sản phẩm khác'
        }
      ],
      total: '15.490.000đ',
      autoRefund: true
    },

    // TH5: Chờ xử lý - Order mới chưa được xác nhận
    {
      id: 'ORD-2024-005',
      date: 'Ngày đặt: 12/01/2024',
      status: 'Chờ xác nhận',
      statusColor: 'text-yellow-700',
      statusBgColor: 'bg-yellow-50',
      statusText: 'Chờ xử lý',
      products: [
        {
          name: 'Gạo hữu cơ cao cấp',
          image: '/src/assets/hinh-anh-canh-dong-lua-que-huong-viet-nam_082308136.jpg',
          quantity: 'Túi 5kg'
        }
      ],
      total: '800.000đ'
    }
  ]

  // Filter logic
  const filteredOrders =
    selectedFilter === 'all'
      ? orders
      : orders.filter((order) => {
          if (selectedFilter === 'Chờ xử lý') {
            return order.status === 'Chờ xác nhận'
          }
          return order.status === selectedFilter
        })

  // Count orders by status for tabs
  const getOrderCount = (status: string) => {
    if (status === 'all') return orders.length
    if (status === 'Chờ xử lý') {
      return orders.filter((order) => order.status === 'Chờ xác nhận').length
    }
    return orders.filter((order) => order.status === status).length
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)
  const startIndex = (currentPage - 1) * ordersPerPage
  const currentOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage)

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter)
    setCurrentPage(1) // Reset to first page when filter changes
  }

  const handleReportProduct = (product: { name: string; image: string }) => {
    setSelectedProduct({
      name: product.name,
      image: product.image,
      category: 'Gốm sứ truyền thống - Màu xanh lá'
    })
    setShowReportModal(true)
  }

  const handleCloseReportModal = () => {
    setShowReportModal(false)
    setSelectedProduct(null)
  }

  const handleCancelOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
    setShowCancelModal(true)
  }

  const handleCloseCancelModal = () => {
    setShowCancelModal(false)
    setSelectedOrderId('')
  }

  const handleViewOrderDetail = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderDetailModal(true)
  }

  const handleCloseOrderDetailModal = () => {
    setShowOrderDetailModal(false)
    setSelectedOrder(null)
  }

  const handleReviewProduct = (product: { name: string; image: string }) => {
    setSelectedProduct({
      name: product.name,
      image: product.image,
      category: 'Gốm sứ truyền thống - Màu xanh lá'
    })
    setShowReviewModal(true)
  }

  const handleCloseReviewModal = () => {
    setShowReviewModal(false)
    setSelectedProduct(null)
  }

  return (
    <div className='bg-gradient-to-br from-[#f8f9f5] to-[#f0f2ec] min-h-screen'>
      {/* Header with enhanced styling */}
      <div className='bg-white/80 backdrop-blur-sm p-6 border-b border-gray-200/50 shadow-sm'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900 mb-1'>Lịch sử đơn hàng</h2>
            <p className='text-sm text-gray-600'>Theo dõi tình trạng các đơn hàng bạn đặt đây</p>
          </div>
        </div>

        {/* Enhanced Status tabs with improved styling */}
        <div className='mt-8'>
          <div className='flex items-center space-x-2 bg-gray-50/70 p-1.5 rounded-xl border border-gray-200/50 backdrop-blur-sm overflow-x-auto'>
            {/* All orders */}
            <button
              onClick={() => handleFilterChange('all')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 whitespace-nowrap ${
                selectedFilter === 'all'
                  ? 'bg-white text-gray-900 font-semibold shadow-md border border-gray-200'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/60'
              }`}
            >
              <span className='text-sm font-medium'>Tất cả</span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  selectedFilter === 'all' ? 'bg-gray-100 text-gray-800' : 'bg-gray-200/70 text-gray-600'
                }`}
              >
                {getOrderCount('all')}
              </span>
            </button>

            {/* Đang giao */}
            <button
              onClick={() => handleFilterChange('Đang giao')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 whitespace-nowrap ${
                selectedFilter === 'Đang giao'
                  ? 'bg-blue-50 text-blue-900 font-semibold shadow-md border border-blue-200'
                  : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50/60'
              }`}
            >
              <span className='text-sm font-medium'>Đang giao</span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  selectedFilter === 'Đang giao' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200/70 text-gray-600'
                }`}
              >
                {getOrderCount('Đang giao')}
              </span>
            </button>

            {/* Đã giao */}
            <button
              onClick={() => handleFilterChange('Đã giao')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 whitespace-nowrap ${
                selectedFilter === 'Đã giao'
                  ? 'bg-green-50 text-green-900 font-semibold shadow-md border border-green-200'
                  : 'text-gray-600 hover:text-green-700 hover:bg-green-50/60'
              }`}
            >
              <span className='text-sm font-medium'>Đã giao</span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  selectedFilter === 'Đã giao' ? 'bg-green-100 text-green-800' : 'bg-gray-200/70 text-gray-600'
                }`}
              >
                {getOrderCount('Đã giao')}
              </span>
            </button>

            {/* Chờ xử lý */}
            <button
              onClick={() => handleFilterChange('Chờ xử lý')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 whitespace-nowrap ${
                selectedFilter === 'Chờ xử lý'
                  ? 'bg-yellow-50 text-yellow-900 font-semibold shadow-md border border-yellow-200'
                  : 'text-gray-600 hover:text-yellow-700 hover:bg-yellow-50/60'
              }`}
            >
              <span className='text-sm font-medium'>Chờ xử lý</span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  selectedFilter === 'Chờ xử lý' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200/70 text-gray-600'
                }`}
              >
                {getOrderCount('Chờ xử lý')}
              </span>
            </button>

            {/* Đã hủy */}
            <button
              onClick={() => handleFilterChange('Đã hủy')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 whitespace-nowrap ${
                selectedFilter === 'Đã hủy'
                  ? 'bg-red-50 text-red-900 font-semibold shadow-md border border-red-200'
                  : 'text-gray-600 hover:text-red-700 hover:bg-red-50/60'
              }`}
            >
              <span className='text-sm font-medium'>Đã hủy</span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  selectedFilter === 'Đã hủy' ? 'bg-red-100 text-red-800' : 'bg-gray-200/70 text-gray-600'
                }`}
              >
                {getOrderCount('Đã hủy')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Orders list with animations */}
      <div className='p-6 space-y-4'>
        {currentOrders.length > 0 ? (
          <div className='space-y-4'>
            {currentOrders.map((order, orderIndex) => (
              <div
                key={order.id}
                className='bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:border-gray-300/50'
                style={{ animationDelay: `${orderIndex * 100}ms` }}
              >
                {/* Enhanced Order header */}
                <div className='bg-gradient-to-r from-gray-50/70 to-gray-100/30 px-6 py-4 border-b border-gray-200/50 flex items-center justify-between'>
                  <div className='flex items-center space-x-4'>
                    <span className='font-semibold text-gray-900 bg-white/50 px-3 py-1 rounded-lg'>#{order.id}</span>
                    <span className='text-sm text-gray-600 font-medium'>{order.date}</span>
                    <span className='text-xs text-gray-500 bg-gray-200/50 px-2 py-1 rounded-full'>
                      Có thể đổi mới trong vòng 7 ngày
                    </span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Badge
                      className={`${order.statusBgColor} ${order.statusColor} border-0 font-medium px-3 py-1.5 text-xs shadow-sm`}
                    >
                      {order.statusText || order.status}
                    </Badge>
                  </div>
                </div>

                {/* Enhanced Product info */}
                <div className='p-6'>
                  {order.products.map((product, index) => (
                    <div
                      key={index}
                      className='flex items-start space-x-4 group hover:bg-gray-50/50 p-4 rounded-xl transition-all duration-200'
                    >
                      <div className='relative'>
                        <img
                          src={product.image}
                          alt={product.name}
                          className='w-20 h-20 rounded-xl border-2 border-gray-200/50 object-cover shadow-sm group-hover:shadow-md transition-all duration-200'
                        />
                        <div className='absolute inset-0 bg-black/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200'></div>
                      </div>
                      <div className='flex-1'>
                        <h3 className='font-semibold text-gray-900 mb-2 leading-snug'>
                          {product.name}
                          {product.quantity && (
                            <span className='text-sm text-gray-500 ml-2 bg-gray-100 px-2 py-0.5 rounded-full'>
                              {product.quantity}
                            </span>
                          )}
                        </h3>

                        {product.description && (
                          <p className='text-sm text-gray-600 mb-3 leading-relaxed bg-gray-50/50 p-3 rounded-lg'>
                            {product.description}
                          </p>
                        )}

                        {product.hasRefund && product.refundNote && (
                          <div className='bg-gradient-to-r from-green-50 to-green-100/50 p-4 rounded-xl border border-green-200/50 shadow-sm'>
                            <p className='text-sm text-green-800 font-semibold mb-2 flex items-center'>
                              <span className='w-2 h-2 bg-green-500 rounded-full mr-2'></span>
                              Thông tin hoàn tiền:
                            </p>
                            <div className='text-sm text-green-700 space-y-1'>
                              {product.refundNote.split('\n').map((line, i) => (
                                <div key={i} className='flex items-start'>
                                  <span className='w-1 h-1 bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0'></span>
                                  {line}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className='text-right'>
                        <div className='font-bold text-lg text-gray-900 bg-gray-50/70 px-3 py-1 rounded-lg'>
                          {order.total}
                        </div>
                        {order.note && (
                          <p className='text-xs text-gray-500 mt-2 max-w-32 bg-gray-100/50 p-2 rounded-lg'>
                            {order.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Enhanced Action buttons */}
                  <div className='flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200/50'>
                    {/* Common buttons for all orders */}
                    <Button
                      variant='outline'
                      size='sm'
                      className='text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-medium'
                      onClick={() => handleViewOrderDetail(order)}
                    >
                      Xem chi tiết
                    </Button>

                    {/* Conditional buttons based on order status and conditions */}
                    {order.status === 'Đã giao' && order.canConfirmReceived && (
                      <Button
                        variant='outline'
                        size='sm'
                        className='text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-medium'
                      >
                        đã nhận được hàng
                      </Button>
                    )}

                    {order.status === 'Đã giao' && (
                      <>
                        <Button
                          variant='outline'
                          size='sm'
                          className='text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-medium'
                          onClick={() => handleReportProduct(order.products[0])}
                        >
                          Báo Cáo
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          className='text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-medium'
                          onClick={() => handleReviewProduct(order.products[0])}
                        >
                          Đánh Giá
                        </Button>
                      </>
                    )}

                    {order.status === 'Đang giao' && (
                      <div className='flex gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          className='text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-medium'
                        >
                          Liên hệ với người bán
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleCancelOrder(order.id)}
                          className='text-red-600 border-red-600 hover:bg-red-600 hover:text-white transition-all duration-200 font-medium shadow-sm hover:shadow-md'
                        >
                          Hủy đơn hàng
                        </Button>
                      </div>
                    )}

                    {order.status === 'Chờ xác nhận' && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleCancelOrder(order.id)}
                        className='text-red-600 border-red-600 hover:bg-red-600 hover:text-white transition-all duration-200 font-medium shadow-sm hover:shadow-md'
                      >
                        Hủy đơn hàng
                      </Button>
                    )}

                    {/* TH1: Bom hàng - Show "Yêu cầu hoàn tiền" button */}
                    {order.showRefundRequest && (
                      <Button
                        variant='outline'
                        size='sm'
                        className='text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-medium'
                      >
                        Yêu cầu hoàn tiền
                      </Button>
                    )}

                    {/* For all cancelled/completed orders */}
                    {(order.status === 'Đã hủy' || order.status === 'Đã giao') && (
                      <Button
                        variant='outline'
                        size='sm'
                        className='text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-medium'
                      >
                        Mua lại
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty state with beautiful design */
          <div className='text-center py-16'>
            <div className='bg-white/60 backdrop-blur-sm rounded-2xl p-12 border border-gray-200/50 shadow-sm'>
              <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                <svg className='w-12 h-12 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.5}
                    d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                {selectedFilter === 'all'
                  ? 'Chưa có đơn hàng nào'
                  : `Không có đơn hàng ${selectedFilter.toLowerCase()}`}
              </h3>
              <p className='text-gray-600 max-w-md mx-auto'>
                {selectedFilter === 'all'
                  ? 'Bạn chưa có đơn hàng nào. Hãy khám phá sản phẩm và đặt hàng ngay!'
                  : `Hiện tại không có đơn hàng nào trong trạng thái ${selectedFilter.toLowerCase()}.`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className='flex justify-center items-center space-x-2 py-6'>
        <button
          onClick={() => goToPage(1)}
          disabled={currentPage === 1}
          className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium ${
            currentPage === 1
              ? 'bg-green-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          1
        </button>

        {totalPages > 1 && (
          <>
            <button
              onClick={() => goToPage(2)}
              disabled={currentPage === 2}
              className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium ${
                currentPage === 2
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              2
            </button>

            {totalPages > 2 && (
              <button
                onClick={() => goToPage(3)}
                disabled={currentPage === 3}
                className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium ${
                  currentPage === 3
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                3
              </button>
            )}

            <button
              onClick={() => goToPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className='w-8 h-8 rounded flex items-center justify-center text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
            >
              &gt;
            </button>
          </>
        )}
      </div>

      {/* Report Modal */}
      {selectedProduct && (
        <ReportModal isOpen={showReportModal} onClose={handleCloseReportModal} product={selectedProduct} />
      )}

      {/* Cancel Order Modal */}
      <CancelOrderModal isOpen={showCancelModal} onClose={handleCloseCancelModal} orderId={selectedOrderId} />

      {/* Order Detail Modal */}
      <OrderDetailModal isOpen={showOrderDetailModal} onClose={handleCloseOrderDetailModal} order={selectedOrder} />

      {/* Review Modal */}
      <ReviewModal isOpen={showReviewModal} onClose={handleCloseReviewModal} product={selectedProduct} />
    </div>
  )
}
