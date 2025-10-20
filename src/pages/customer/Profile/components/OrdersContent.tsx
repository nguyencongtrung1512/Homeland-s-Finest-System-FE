import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import ReportModal from './ReportModal'
import CancelOrderModal from './CancelOrderModal'
import OrderDetailModal from './OrderDetailModal'
import ReviewModal from './ReviewModal'
import { confirmOrderReceived } from '../../../../apis/order.api'
import { purchaseOrder } from '../../../../apis/transaction.api'
import { path } from '../../../../constants/path'
import type { Order as APIOrder } from '../../../../types/orderType'
import { toast } from 'react-toastify'

interface Order {
  id: string
  date: string
  status: 'Chưa xác nhận' | 'Chờ xác nhận' | 'Đã xác nhận' | 'Đang giao' | 'Đã giao' | 'Đã hủy'
  statusColor: string
  statusBgColor: string
  statusText: string
  products: {
    id?: string
    productInventoryId?: string // Add this field for navigation
    name: string
    image: string
    description?: string
    hasRefund?: boolean
    refundNote?: string
    quantity?: string
    price?: number
    finalPrice?: number
    variant?: string
    isCombo?: boolean
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

interface OrdersContentProps {
  orders: APIOrder[]
  loading: boolean
  onRefreshOrders: () => void
  onFilterByStatus?: (status: string) => void
}

// Utility function to transform API order to UI order format
const transformAPIOrderToUIOrder = (apiOrder: APIOrder): Order => {
  // Map API status to UI status
  const getUIStatus = (apiStatus: string) => {
    switch (apiStatus) {
      case 'NotYet':
        return {
          status: 'Chưa xác nhận' as const,
          statusColor: 'text-yellow-700',
          statusBgColor: 'bg-yellow-50',
          statusText: 'Đang chờ xác nhận đơn hàng'
        }
      case 'Processing':
        return {
          status: 'Chờ xác nhận' as const,
          statusColor: 'text-blue-700',
          statusBgColor: 'bg-blue-50',
          statusText: 'Đang chờ xác nhận đơn hàng'
        }
      case 'Confirmed':
        return {
          status: 'Đã xác nhận' as const,
          statusColor: 'text-green-700',
          statusBgColor: 'bg-green-50',
          statusText: 'Đơn hàng đã được xác nhận'
        }
      case 'Shipping':
        return {
          status: 'Đang giao' as const,
          statusColor: 'text-blue-700',
          statusBgColor: 'bg-blue-50',
          statusText: 'Đang trên đường đến với bạn'
        }
      case 'Delivered':
        return {
          status: 'Đã giao' as const,
          statusColor: 'text-green-700',
          statusBgColor: 'bg-green-50',
          statusText: 'Đã về đến nhà bạn rồi'
        }
      case 'Cancel':
        return {
          status: 'Đã hủy' as const,
          statusColor: 'text-red-700',
          statusBgColor: 'bg-red-50',
          statusText: 'Đơn hàng đã bị hủy'
        }
      case 'Returned':
        return {
          status: 'Đã hủy' as const,
          statusColor: 'text-red-700',
          statusBgColor: 'bg-red-50',
          statusText: 'Đơn hàng đã được trả lại'
        }
      default:
        return {
          status: 'Chờ xác nhận' as const,
          statusColor: 'text-gray-700',
          statusBgColor: 'bg-gray-50',
          statusText: 'Trạng thái không xác định'
        }
    }
  }

  const statusInfo = getUIStatus(apiOrder?.status || '')

  // Transform order items to products - add safety checks
  const products = [
    // Regular order items
    ...(apiOrder?.orderItems || []).map((item) => ({
      id: item?.id || '',
      productInventoryId: item?.productVariantId || '', // Use productVariantId instead
      name: item?.orderItemName || 'Sản phẩm không xác định',
      image: item?.orderItemImageUrl || '/src/assets/react.svg',
      quantity: (item?.quantity || 0).toString(),
      price: item?.totalPrice || 0,
      finalPrice: item?.totalPrice || 0,
      variant:
        item?.length && item?.width && item?.height && item?.weight
          ? `${item.length}x${item.width}x${item.height}cm, ${item.weight}g`
          : 'Thông tin kích thước không có',
      isCombo: false
    })),
    // Combo order items
    ...(apiOrder?.orderItemsWithCombo || []).map((item) => ({
      id: item?.id || '',
      productInventoryId: item?.productVariantId || '',
      name: `${item?.comboName || 'Combo'} - ${item?.orderItemName || 'Sản phẩm không xác định'}`,
      image: item?.orderItemImageUrl || '/src/assets/react.svg',
      quantity: (item?.quantity || 0).toString(),
      price: item?.finalPrice || 0,
      finalPrice: item?.finalPrice || 0,
      variant:
        item?.length > 0 && item?.width > 0 && item?.height > 0 && item?.weight > 0
          ? `${item.length}x${item.width}x${item.height}cm, ${item.weight}g`
          : 'Thông tin kích thước không có',
      isCombo: true
    }))
  ]

  // Format total price - add safety check
  const formatPrice = (price?: number) => {
    if (typeof price !== 'number' || isNaN(price)) {
      return '0đ'
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    })
      .format(price)
      .replace('₫', 'đ')
  }

  // Get order history safely
  const orderHistories = apiOrder?.orderHistories || []

  return {
    id: apiOrder?.id || '',
    date: apiOrder?.createdAt,
    ...statusInfo,
    products,
    total: formatPrice(apiOrder?.finalPrice),
    totalAmount: apiOrder?.finalPrice || 0,
    note: apiOrder?.note || '',
    canConfirmReceived: apiOrder?.status === 'Delivered' && !apiOrder?.isPayOut,
    canReturn: apiOrder?.status === 'Delivered',
    shippingInfo: {
      recipientName: apiOrder?.toName || '',
      phone: '', // API doesn't provide phone in order
      address: apiOrder?.toAddress || '',
      note: apiOrder?.note || undefined
    },
    transactionInfo: {
      orderId: apiOrder?.id || '',
      paymentDate: apiOrder?.createdAt,
      paymentMethod: apiOrder?.paymentType === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng'
    },
    timeline: orderHistories.map((history, index) => ({
      status: history?.description || 'Không có mô tả',
      date: history?.time ? new Date(history.time).toLocaleDateString('vi-VN') : '',
      isCompleted: true,
      isCurrent: index === orderHistories.length - 1
    }))
  }
}

export default function OrdersContent({
  orders: apiOrders,
  loading,
  onRefreshOrders,
  onFilterByStatus
}: OrdersContentProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [showReportModal, setShowReportModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<{ name: string; image: string; category?: string } | null>(
    null
  )
  const [selectedOrderId, setSelectedOrderId] = useState<string>('')
  const [confirmingOrderId, setConfirmingOrderId] = useState<string>('') // Thêm state để track loading
  const [processingPaymentOrderId, setProcessingPaymentOrderId] = useState<string>('') // State để track payment loading
  const ordersPerPage = 3

  // Transform API orders to UI orders - add safety check
  const orders: Order[] = useMemo(() => {
    if (!apiOrders || !Array.isArray(apiOrders)) {
      return []
    }
    try {
      return apiOrders.map(transformAPIOrderToUIOrder)
    } catch (error) {
      console.error('Error transforming orders:', error)
      return []
    }
  }, [apiOrders])

  // Filter orders based on selected filter
  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'all') return orders
    return orders.filter((order) => order.status === selectedFilter)
  }, [orders, selectedFilter])

  // Handle filter change - call API with new status
  const handleFilterChange = (filterKey: string) => {
    setSelectedFilter(filterKey)
    setCurrentPage(1) // Reset to first page when filter changes

    // Map UI filter to API status
    const apiStatusMap: { [key: string]: string | undefined } = {
      all: undefined,
      'Chưa xác nhận': 'NotYet',
      'Chờ xác nhận': 'Processing',
      'Đã xác nhận': 'Confirmed',
      'Đang giao': 'Shipping',
      'Đã giao': 'Delivered',
      'Đã hủy': 'Cancel',
      'Trả hàng': 'Returned'
    }

    const apiStatus = apiStatusMap[filterKey]
    if (onFilterByStatus) {
      onFilterByStatus(apiStatus || '')
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)
  const startIndex = (currentPage - 1) * ordersPerPage
  const endIndex = startIndex + ordersPerPage
  const currentOrders = filteredOrders.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }
  const handleConfirmReceived = async (orderId: string) => {
    try {
      setConfirmingOrderId(orderId) // Bắt đầu loading
      await confirmOrderReceived(orderId)
      // Refresh orders sau khi xác nhận thành công
      onRefreshOrders()
    } catch (error) {
      console.error('Lỗi khi xác nhận đã nhận hàng:', error)
      // Có thể thêm toast notification ở đây
      alert('Có lỗi xảy ra khi xác nhận đã nhận hàng. Vui lòng thử lại.')
    } finally {
      setConfirmingOrderId('') // Kết thúc loading
    }
  }

  // Handle payment for unconfirmed orders
  const handlePayment = async (orderId: string) => {
    try {
      setProcessingPaymentOrderId(orderId) // Bắt đầu loading

      // Call purchase API to create transaction
      const transactions = await purchaseOrder({ orderIds: [orderId] })
      const transaction = transactions[0]

      if (transaction.paymentMethod === 'COD') {
        toast.success('Đơn hàng COD đã được xác nhận! Chờ giao hàng.')
        // Refresh orders to show updated status
        onRefreshOrders()
      } else if (transaction.paymentMethod === 'Banking') {
        toast.success('Đang chuyển đến trang thanh toán...')
        // Redirect to payment URL
        if (transaction.checkoutUrl) {
          window.location.href = transaction.checkoutUrl
        } else {
          toast.error('Không tìm thấy URL thanh toán')
        }
      }
    } catch (error) {
      console.error('Lỗi khi xử lý thanh toán:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error).message ||
        'Có lỗi xảy ra khi xử lý thanh toán'
      toast.error(errorMessage)
    } finally {
      setProcessingPaymentOrderId('') // Kết thúc loading
    }
  }

  // Modal handlers
  // const handleOpenReportModal = (product: { name: string; image: string; category?: string }) => {
  //   setSelectedProduct(product)
  //   setShowReportModal(true)
  // }

  const handleCloseReportModal = () => {
    setShowReportModal(false)
    setSelectedProduct(null)
  }

  const handleOpenCancelModal = (orderId: string) => {
    setSelectedOrderId(orderId)
    setShowCancelModal(true)
  }

  const handleCloseCancelModal = () => {
    setShowCancelModal(false)
    setSelectedOrderId('')
    // Refresh orders after cancellation
    onRefreshOrders()
  }

  const handleOpenOrderDetailModal = (orderId: string) => {
    setSelectedOrderId(orderId)
    setShowOrderDetailModal(true)
  }

  const handleCloseOrderDetailModal = () => {
    setShowOrderDetailModal(false)
    setSelectedOrderId('')
  }

  const handleOpenReviewModal = (product: { name: string; image: string; category?: string }) => {
    setSelectedProduct(product)
    setShowReviewModal(true)
  }

  const handleCloseReviewModal = () => {
    setShowReviewModal(false)
    setSelectedProduct(null)
  }

  // Handle buy again functionality - Sửa hàm này
  const handleBuyAgain = (order: Order) => {
    console.log('=== DEBUG BUY AGAIN ===')
    console.log('Order object:', order)
    console.log('Order products:', order.products)

    // Navigate to the first product in the order
    const firstProduct = order.products[0]
    console.log('First product:', firstProduct)

    if (firstProduct?.productInventoryId) {
      // Log the path template and productInventoryId
      console.log('Path template:', path.productDetail)
      console.log('Product Inventory ID:', firstProduct.productInventoryId)

      // Create the final navigation path
      const navigationPath = path.productDetail.replace(':id', firstProduct.productInventoryId)
      console.log('Final navigation path:', navigationPath)
      console.log('Full URL would be:', window.location.origin + navigationPath)

      // Navigate to the product detail page
      navigate(navigationPath)
      console.log('Navigation executed!')
    } else {
      console.log('No productInventoryId found in first product')
      console.log('Available product fields:', Object.keys(firstProduct || {}))
      alert('Không thể tìm thấy thông tin sản phẩm để mua lại.')
    }
    console.log('=== END DEBUG ===')
  }

  // Loading state
  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-600'></div>
        <span className='ml-2 text-gray-600'>Đang tải đơn hàng...</span>
      </div>
    )
  }

  return (
    <div className='max-w-4xl'>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-lg font-semibold text-gray-900'>Đơn hàng của tôi</h2>
        <Button
          variant='outline'
          onClick={onRefreshOrders}
          className='text-green-600 border-green-600 hover:bg-green-50'
        >
          Làm mới
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className='flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg'>
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'Chưa xác nhận', label: 'Chưa xác nhận' },
          { key: 'Chờ xác nhận', label: 'Chờ xác nhận' },
          { key: 'Đã xác nhận', label: 'Đã xác nhận' },
          { key: 'Đang giao', label: 'Đang giao' },
          { key: 'Đã giao', label: 'Đã giao' },
          { key: 'Đã hủy', label: 'Đã hủy' },
          { key: 'Trả hàng', label: 'Trả hàng' }
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => handleFilterChange(filter.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedFilter === filter.key ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className='space-y-4'>
        {currentOrders.length > 0 ? (
          currentOrders.map((order) => (
            <div key={order.id} className='bg-white border rounded-lg p-6'>
              {/* Order Header */}
              <div className='flex justify-between items-start mb-4'>
                <div>
                  <div className='flex items-center gap-3 mb-2'>
                    <span className='font-medium text-gray-900'>Mã đơn hàng: {order.id}</span>
                    <Badge className={`${order.statusBgColor} ${order.statusColor} border-0`}>{order.status}</Badge>
                  </div>
                  <p className='text-sm text-gray-600'>{order.date}</p>
                  <p className={`text-sm ${order.statusColor} mt-1`}>{order.statusText}</p>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleOpenOrderDetailModal(order.id)}
                  className='text-green-600 border-green-600 hover:bg-green-50'
                >
                  Xem chi tiết
                </Button>
              </div>

              {/* Products */}
              <div className='space-y-3 mb-4'>
                {order.products.map((product, index) => (
                  <div key={index} className='flex items-center gap-4'>
                    <img src={product.image} alt={product.name} className='w-16 h-16 object-cover rounded-lg border' />
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h4 className='font-medium text-gray-900'>{product.name}</h4>
                        {product.isCombo && (
                          <Badge className='bg-purple-100 text-purple-700 border-0 text-xs'>Combo</Badge>
                        )}
                      </div>
                      {product.variant && <p className='text-sm text-gray-600'>{product.variant}</p>}
                      <p className='text-sm text-gray-600'>Số lượng: {product.quantity}</p>
                    </div>
                    {product.finalPrice && (
                      <div className='text-right'>
                        <p className='font-medium text-gray-900'>
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          })
                            .format(product.finalPrice)
                            .replace('₫', 'đ')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Order Total */}
              <div className='flex justify-between items-center pt-4 border-t'>
                <span className='text-gray-600'>Tổng tiền:</span>
                <span className='text-lg font-semibold text-gray-900'>{order.total}</span>
              </div>

              {/* Action Buttons */}
              <div className='flex gap-2 pt-4'>
                {order.status === 'Chưa xác nhận' && (
                  <Button
                    size='sm'
                    onClick={() => handlePayment(order.id)}
                    disabled={processingPaymentOrderId === order.id}
                    className='bg-green-600 hover:bg-green-700 text-white disabled:opacity-50'
                  >
                    {processingPaymentOrderId === order.id ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                        Đang xử lý...
                      </>
                    ) : (
                      'Thanh toán'
                    )}
                  </Button>
                )}
                {order.status === 'Chờ xác nhận' && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleOpenCancelModal(order.id)}
                    className='text-red-600 border-red-600 hover:bg-red-50'
                  >
                    Hủy đơn hàng
                  </Button>
                )}
                {order.canConfirmReceived && (
                  <Button
                    size='sm'
                    onClick={() => handleConfirmReceived(order.id)}
                    disabled={confirmingOrderId === order.id}
                    className='bg-green-600 hover:bg-green-700 text-white disabled:opacity-50'
                  >
                    {confirmingOrderId === order.id ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                        Đang xử lý...
                      </>
                    ) : (
                      'Đã nhận được hàng'
                    )}
                  </Button>
                )}
                {order.status === 'Đã giao' && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      handleOpenReviewModal({
                        name: order.products[0]?.name || '',
                        image: order.products[0]?.image || ''
                      })
                    }
                    className='text-green-600 border-green-600 hover:bg-green-50'
                  >
                    Đánh giá
                  </Button>
                )}
                {order.status === 'Đã hủy' && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleBuyAgain(order)}
                    className='text-blue-600 border-blue-600 hover:bg-blue-50'
                  >
                    Mua lại
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className='text-center py-12'>
            <div className='w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center'>
              <svg className='w-12 h-12 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
                />
              </svg>
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              {selectedFilter === 'all' ? 'Chưa có đơn hàng nào' : `Không có đơn hàng ${selectedFilter.toLowerCase()}`}
            </h3>
            <p className='text-gray-600 max-w-md mx-auto'>
              {selectedFilter === 'all'
                ? 'Bạn chưa có đơn hàng nào. Hãy khám phá sản phẩm và đặt hàng ngay!'
                : `Hiện tại không có đơn hàng nào trong trạng thái ${selectedFilter.toLowerCase()}.`}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex justify-center items-center space-x-2 py-6'>
          <button
            onClick={() => goToPage(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className='w-8 h-8 rounded flex items-center justify-center text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
          >
            &lt;
          </button>

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const page = i + 1
            return (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium ${currentPage === page
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {page}
              </button>
            )
          })}

          <button
            onClick={() => goToPage(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className='w-8 h-8 rounded flex items-center justify-center text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
          >
            &gt;
          </button>
        </div>
      )}

      {/* Report Modal */}
      {selectedProduct && (
        <ReportModal isOpen={showReportModal} onClose={handleCloseReportModal} product={selectedProduct} />
      )}

      {/* Cancel Order Modal */}
      <CancelOrderModal isOpen={showCancelModal} onClose={handleCloseCancelModal} orderId={selectedOrderId} />

      {/* Order Detail Modal */}
      <OrderDetailModal isOpen={showOrderDetailModal} onClose={handleCloseOrderDetailModal} orderId={selectedOrderId} />

      {/* Review Modal */}
      <ReviewModal isOpen={showReviewModal} onClose={handleCloseReviewModal} product={selectedProduct} />
    </div>
  )
}
