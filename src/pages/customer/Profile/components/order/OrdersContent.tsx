import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../../../components/ui/button'
import { Badge } from '../../../../../components/ui/badge'
import ReportModal from '../ReportModal'
import CancelOrderModal from './CancelOrderModal'
import OrderDetailModal from './OrderDetailModal'
import ReviewModal from '../ReviewModal'
import ComplaintModal from '../form/ComplaintModal'
import { confirmOrderReceived } from '../../../../../apis/order.api'
import { purchaseOrder } from '../../../../../apis/transaction.api'
import { formApi } from '../../../../../apis/form.api'
import { path } from '../../../../../constants/path'
import type { Order as APIOrder, OrderStatus } from '../../../../../types/orderType'
import { toast } from 'react-toastify'
import { useAuth } from '../../../../../contexts/auth.context'
import type { CreateFormRequest, FormType } from '../../../../../types/form.type'

const DEFAULT_PRODUCT_IMAGE = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'

interface Order {
  id: string
  storeId: string
  date: string
  originalStatus: OrderStatus // Lưu status gốc từ API
  status:
  | 'Chưa xác nhận'
  | 'Chờ thanh toán'
  | 'Đã xác nhận'
  | 'Vận chuyển'
  | 'Hoàn thành'
  | 'Trả hàng/Hoàn tiền'
  | 'Đã hủy'
  statusColor: string
  statusBgColor: string
  statusText: string
  isFreeship?: boolean
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
  canComplain?: boolean // Có thể khiếu nại (ẩn nếu đã Complaining/Complained)
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

const transformAPIOrderToUIOrder = (apiOrder: APIOrder): Order => {
  const getUIStatus = (apiStatus: OrderStatus) => {
    switch (apiStatus) {
      // Chưa xác nhận
      case 'NotYet':
        return {
          status: 'Chưa xác nhận' as const,
          statusColor: 'text-yellow-700',
          statusBgColor: 'bg-yellow-50',
          statusText: 'Đang chờ xác nhận đơn hàng'
        }
      case 'Processing':
        return {
          status: 'Chưa xác nhận' as const,
          statusColor: 'text-yellow-700',
          statusBgColor: 'bg-yellow-50',
          statusText: 'Đang chờ xác nhận đơn hàng'
        }
      // Chờ thanh toán
      case 'PendingPayment':
        return {
          status: 'Chờ thanh toán' as const,
          statusColor: 'text-orange-700',
          statusBgColor: 'bg-orange-50',
          statusText: 'Bạn đã khởi tạo thanh toán, vui lòng hoàn tất'
        }
      // Đã xác nhận
      case 'Confirmed':
        return {
          status: 'Đã xác nhận' as const,
          statusColor: 'text-green-700',
          statusBgColor: 'bg-green-50',
          statusText: 'Đơn hàng đã được xác nhận'
        }
      case 'ReadyToPick':
        return {
          status: 'Đã xác nhận' as const,
          statusColor: 'text-green-700',
          statusBgColor: 'bg-green-50',
          statusText: 'Đang chuẩn bị hàng'
        }
      case 'Picking':
        return {
          status: 'Đã xác nhận' as const,
          statusColor: 'text-green-700',
          statusBgColor: 'bg-green-50',
          statusText: 'Đang trên đường lấy hàng'
        }
      case 'Picked':
        return {
          status: 'Đã xác nhận' as const,
          statusColor: 'text-green-700',
          statusBgColor: 'bg-green-50',
          statusText: 'Shipper đã lấy hàng'
        }
      // Vận chuyển
      case 'Storing':
        return {
          status: 'Vận chuyển' as const,
          statusColor: 'text-blue-700',
          statusBgColor: 'bg-blue-50',
          statusText: 'Đang lưu kho'
        }
      case 'Transporting':
        return {
          status: 'Vận chuyển' as const,
          statusColor: 'text-blue-700',
          statusBgColor: 'bg-blue-50',
          statusText: 'Đang vận chuyển'
        }
      case 'Sorting':
        return {
          status: 'Vận chuyển' as const,
          statusColor: 'text-blue-700',
          statusBgColor: 'bg-blue-50',
          statusText: 'Đang phân loại'
        }
      case 'Delivering':
        return {
          status: 'Vận chuyển' as const,
          statusColor: 'text-blue-700',
          statusBgColor: 'bg-blue-50',
          statusText: 'Đang giao hàng'
        }
      // Hoàn thành
      case 'Delivered':
        return {
          status: 'Hoàn thành' as const,
          statusColor: 'text-green-700',
          statusBgColor: 'bg-green-50',
          statusText: 'Đã giao hàng thành công'
        }
      case 'Paid':
        return {
          status: 'Hoàn thành' as const,
          statusColor: 'text-green-700',
          statusBgColor: 'bg-green-50',
          statusText: 'Đã giao hàng thành công'
        }
      // Trả hàng/Hoàn tiền
      case 'Returning':
        return {
          status: 'Trả hàng/Hoàn tiền' as const,
          statusColor: 'text-orange-700',
          statusBgColor: 'bg-orange-50',
          statusText: 'Đang trả hàng'
        }
      case 'Returned':
        return {
          status: 'Trả hàng/Hoàn tiền' as const,
          statusColor: 'text-orange-700',
          statusBgColor: 'bg-orange-50',
          statusText: 'Đã trả hàng'
        }
      case 'Refunded':
        return {
          status: 'Trả hàng/Hoàn tiền' as const,
          statusColor: 'text-orange-700',
          statusBgColor: 'bg-orange-50',
          statusText: 'Đã hoàn tiền'
        }
      case 'DeliveryFail':
        return {
          status: 'Trả hàng/Hoàn tiền' as const,
          statusColor: 'text-orange-700',
          statusBgColor: 'bg-orange-50',
          statusText: 'Giao hàng thất bại'
        }
      case 'Exception':
        return {
          status: 'Trả hàng/Hoàn tiền' as const,
          statusColor: 'text-orange-700',
          statusBgColor: 'bg-orange-50',
          statusText: 'Gặp sự cố'
        }
      case 'Damaged':
        return {
          status: 'Trả hàng/Hoàn tiền' as const,
          statusColor: 'text-orange-700',
          statusBgColor: 'bg-orange-50',
          statusText: 'Hàng hư hỏng'
        }
      case 'Lost':
        return {
          status: 'Trả hàng/Hoàn tiền' as const,
          statusColor: 'text-orange-700',
          statusBgColor: 'bg-orange-50',
          statusText: 'Thất lạc'
        }
      case 'Complaining':
        return {
          status: 'Trả hàng/Hoàn tiền' as const,
          statusColor: 'text-orange-700',
          statusBgColor: 'bg-orange-50',
          statusText: 'Đang phản hồi'
        }
      case 'Complained':
        return {
          status: 'Trả hàng/Hoàn tiền' as const,
          statusColor: 'text-orange-700',
          statusBgColor: 'bg-orange-50',
          statusText: 'Đã phản hồi'
        }
      // Đã hủy
      case 'Cancel':
        return {
          status: 'Đã hủy' as const,
          statusColor: 'text-red-700',
          statusBgColor: 'bg-red-50',
          statusText: 'Đơn hàng đã bị hủy'
        }
      default:
        return {
          status: 'Chưa xác nhận' as const,
          statusColor: 'text-gray-700',
          statusBgColor: 'bg-gray-50',
          statusText: 'Đơn hàng đang chờ xử lý'
        }
    }
  }

  const statusInfo = getUIStatus(apiOrder?.status || 'NotYet')

  const products = [
    ...(apiOrder?.orderItems || []).map((item) => ({
      id: item?.id || '',
      productInventoryId: item?.productVariantId || '', // Use productVariantId instead
      name: item?.orderItemName || 'Sản phẩm không xác định',
      image: item?.orderItemImageUrl || DEFAULT_PRODUCT_IMAGE,
      quantity: (item?.quantity || 0).toString(),
      price: item?.totalPrice || 0,
      finalPrice: item?.totalPrice || 0,
      variant:
        item?.length && item?.width && item?.height && item?.weight
          ? `${item.length}x${item.width}x${item.height}cm, ${item.weight}g`
          : 'Thông tin kích thước không có',
      isCombo: false
    })),

    ...(apiOrder?.orderItemsWithCombo || []).map((item) => ({
      id: item?.id || '',
      productInventoryId: item?.productVariantId || '',
      name: `${item?.comboName || 'Combo'} - ${item?.orderItemName || 'Sản phẩm không xác định'}`,
      image: item?.orderItemImageUrl || DEFAULT_PRODUCT_IMAGE,
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

  const orderHistories = apiOrder?.orderHistories || []

  const statusVal: OrderStatus = apiOrder?.status || 'NotYet'
  const isComplaintInProgress = statusVal === 'Complaining' || statusVal === 'Complained'

  return {
    id: apiOrder?.id || '',
    storeId: apiOrder?.storeId || '',
    date: apiOrder?.createdAt,
    originalStatus: statusVal,
    ...statusInfo,
    isFreeship: apiOrder?.isFreeship || false,
    products,
    total: formatPrice(apiOrder?.finalPrice),
    totalAmount: apiOrder?.finalPrice || 0,
    note: apiOrder?.note || '',
    canConfirmReceived: statusVal === 'Delivered' && !apiOrder?.isPayOut,
    // Chỉ cho phép khiếu nại nếu đã giao xong và không ở trạng thái đã/đang khiếu nại
    canComplain: statusVal === 'Delivered' && !isComplaintInProgress,
    canReturn: apiOrder?.status === 'Delivered',
    shippingInfo: {
      recipientName: apiOrder?.toName || '',
      phone: '',
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
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [showReportModal, setShowReportModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showComplaintModal, setShowComplaintModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<{ name: string; image: string; category?: string } | null>(
    null
  )
  const [selectedOrderId, setSelectedOrderId] = useState<string>('')
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>('')
  const [confirmingOrderId, setConfirmingOrderId] = useState<string>('') // Thêm state để track loading
  const [processingPaymentOrderId, setProcessingPaymentOrderId] = useState<string>('') // State để track payment loading
  const [submittingComplaintOrderId, setSubmittingComplaintOrderId] = useState<string>('') // State để track complaint loading
  const ordersPerPage = 3

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

  // Map các status API vào các tab
  const getStatusesForTab = (tabKey: string): OrderStatus[] => {
    switch (tabKey) {
      case 'Chưa xác nhận':
        return ['NotYet', 'Processing']
      case 'Chờ thanh toán':
        return ['PendingPayment']
      case 'Đã xác nhận':
        return ['Confirmed', 'ReadyToPick', 'Picking', 'Picked']
      case 'Vận chuyển':
        return ['Storing', 'Transporting', 'Sorting', 'Delivering']
      case 'Hoàn thành':
        return ['Delivered', 'Paid']
      case 'Trả hàng/Hoàn tiền':
        return [
          'Returning',
          'Returned',
          'Refunded',
          'DeliveryFail',
          'Exception',
          'Damaged',
          'Lost',
          'Complaining',
          'Complained'
        ]
      case 'Đã hủy':
        return ['Cancel']
      default:
        return []
    }
  }

  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'all') return orders

    const statusesForTab = getStatusesForTab(selectedFilter)
    return orders.filter((order) => statusesForTab.includes(order.originalStatus))
  }, [orders, selectedFilter])

  const handleFilterChange = (filterKey: string) => {
    setSelectedFilter(filterKey)
    setCurrentPage(1)
    // Không gọi onFilterByStatus nữa vì sẽ get all và filter ở frontend
    if (onFilterByStatus) {
      onFilterByStatus('') // Gửi empty để get all
    }
  }

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)
  const startIndex = (currentPage - 1) * ordersPerPage
  const endIndex = startIndex + ordersPerPage
  const currentOrders = filteredOrders.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }
  const handleConfirmReceived = async (orderId: string) => {
    try {
      setConfirmingOrderId(orderId)
      await confirmOrderReceived(orderId)
      onRefreshOrders()
    } catch (error) {
      console.error('Lỗi khi xác nhận đã nhận hàng:', error)
      alert('Có lỗi xảy ra khi xác nhận đã nhận hàng. Vui lòng thử lại.')
    } finally {
      setConfirmingOrderId('')
    }
  }

  const handlePayment = async (orderId: string): Promise<boolean> => {
    setProcessingPaymentOrderId(orderId)
    try {
      const transactions = await purchaseOrder({ orderIds: [orderId] })
      const transaction = transactions[0]

      if (!transaction) {
        toast.error('Không nhận được thông tin giao dịch')
        return false
      }

      if (transaction.paymentMethod === 'COD') {
        toast.success('Đơn hàng COD đã được xác nhận! Chờ giao hàng.')
        onRefreshOrders()
        return true
      }

      if (transaction.paymentMethod === 'Banking') {
        if (transaction.orderStatus === 'PendingPayment') {
          toast.info('Đơn hàng đang chờ bạn hoàn tất thanh toán.')
        } else {
          toast.success('Đang chuyển đến trang thanh toán...')
        }
        if (transaction.checkoutUrl) {
          window.location.href = transaction.checkoutUrl
          return true
        }
        toast.error('Không tìm thấy URL thanh toán')
        return false
      }

      toast.success('Thanh toán đã được xử lý!')
      onRefreshOrders()
      return true
    } catch (error) {
      console.error('Lỗi khi xử lý thanh toán:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error).message ||
        'Có lỗi xảy ra khi xử lý thanh toán'
      toast.error(errorMessage)
      return false
    } finally {
      setProcessingPaymentOrderId('') // Kết thúc loading
    }
  }

  // Handle complaint for delivered orders
  const handleComplaint = async (
    orderId: string,
    storeId: string,
    userId: string,
    complaintData: { formType: FormType; subject: string; description: string; images?: File[] }
  ) => {
    if (!user?.userId) {
      toast.error('Vui lòng đăng nhập để gửi khiếu nại')
      return
    }

    try {
      setSubmittingComplaintOrderId(orderId)

      const formData: CreateFormRequest = {
        userId: userId,
        storeId: storeId,
        orderId: orderId,
        type: complaintData.formType,
        subject: complaintData.subject,
        description: complaintData.description,
        imageFiles: complaintData.images
      }

      await formApi.createForm(formData)

      toast.success('Gửi khiếu nại thành công! Chúng tôi sẽ xem xét và phản hồi sớm nhất.')
      setShowComplaintModal(false)
    } catch (error) {
      console.error('Error submitting complaint:', error)
      toast.error('Có lỗi xảy ra khi gửi khiếu nại. Vui lòng thử lại sau.')
    } finally {
      setSubmittingComplaintOrderId('')
    }
  }

  const handleCloseReportModal = () => {
    setShowReportModal(false)
    setSelectedProduct(null)
  }

  const handleOpenCancelModal = (orderId: string) => {
    setSelectedOrderId(orderId)
    const targetOrder = apiOrders?.find((item) => item.id === orderId)
    setSelectedOrderStatus(targetOrder?.status || '')
    setShowCancelModal(true)
  }

  const handleCloseCancelModal = () => {
    setShowCancelModal(false)
    setSelectedOrderId('')
    setSelectedOrderStatus('')
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

  const handleOpenComplaintModal = (orderId: string) => {
    setSelectedOrderId(orderId)
    setShowComplaintModal(true)
  }

  const handleCloseComplaintModal = () => {
    setShowComplaintModal(false)
    setSelectedOrderId('')
  }

  const handleContinuePaymentFromModal = async () => {
    if (!selectedOrderId || selectedOrderStatus !== 'PendingPayment') {
      return
    }
    const success = await handlePayment(selectedOrderId)
    if (success) {
      setShowCancelModal(false)
    }
  }

  const handleBuyAgain = (order: Order) => {
    const firstProduct = order.products[0]

    if (firstProduct?.productInventoryId) {
      const navigationPath = path.productDetail.replace(':id', firstProduct.productInventoryId)

      navigate(navigationPath)
    } else {
      toast.error('Không thể tìm thấy thông tin sản phẩm để mua lại.')
    }
  }

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

      <div className='flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto'>
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'Chưa xác nhận', label: 'Chưa xác nhận' },
          { key: 'Chờ thanh toán', label: 'Chờ thanh toán' },
          { key: 'Đã xác nhận', label: 'Đã xác nhận' },
          { key: 'Vận chuyển', label: 'Vận chuyển' },
          { key: 'Hoàn thành', label: 'Hoàn thành' },
          { key: 'Trả hàng/Hoàn tiền', label: 'Trả hàng/Hoàn tiền' }
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => handleFilterChange(filter.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${selectedFilter === filter.key ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className='space-y-4'>
        {currentOrders.length > 0 ? (
          currentOrders.map((order) => (
            <div key={order.id} className='bg-white border rounded-lg p-6'>
              <div className='flex justify-between items-start mb-4'>
                <div>
                  <div className='flex items-center gap-3 mb-2'>
                    <span className='font-medium text-gray-900'>Mã đơn hàng: {order.id}</span>
                    <Badge className={`${order.statusBgColor} ${order.statusColor} border-0`}>{order.status}</Badge>
                    {order.isFreeship && (
                      <Badge className='bg-green-100 text-green-700 border-0 text-xs'>Miễn phí ship</Badge>
                    )}
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

              <div className='space-y-3 mb-4'>
                {order.products.map((product, index) => (
                  <div key={index} className='flex items-center gap-4'>
                    <img
                      src={product.image || DEFAULT_PRODUCT_IMAGE}
                      alt={product.name}
                      className='w-16 h-16 object-cover rounded-lg border'
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        if (target.src !== DEFAULT_PRODUCT_IMAGE) {
                          target.src = DEFAULT_PRODUCT_IMAGE
                        }
                      }}
                    />
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

              <div className='flex justify-between items-center pt-4 border-t'>
                <span className='text-gray-600'>Tổng tiền:</span>
                <span className='text-lg font-semibold text-gray-900'>{order.total}</span>
              </div>

              {/* Action Buttons */}
              <div className='flex gap-2 pt-4 flex-wrap'>
                {(order.originalStatus === 'NotYet' ||
                  order.originalStatus === 'Processing' ||
                  order.originalStatus === 'PendingPayment') && (
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
                      ) : order.originalStatus === 'PendingPayment' ? (
                        'Tiếp tục thanh toán'
                      ) : (
                        'Thanh toán'
                      )}
                    </Button>
                  )}
                {(order.originalStatus === 'NotYet' ||
                  order.originalStatus === 'Processing' ||
                  order.originalStatus === 'PendingPayment') && (
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
                {order.originalStatus === 'Delivered' && (
                  <>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        handleOpenReviewModal({
                          name: order.products[0]?.name || '',
                          image: order.products[0]?.image || DEFAULT_PRODUCT_IMAGE
                        })
                      }
                      className='text-green-600 border-green-600 hover:bg-green-50'
                    >
                      Đánh giá
                    </Button>
                    {order.canComplain && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleOpenComplaintModal(order.id)}
                        disabled={submittingComplaintOrderId === order.id}
                        className='text-red-600 border-red-600 hover:bg-red-50 disabled:opacity-50'
                      >
                        {submittingComplaintOrderId === order.id ? (
                          <>
                            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2'></div>
                            Đang gửi...
                          </>
                        ) : (
                          'Khiếu nại'
                        )}
                      </Button>
                    )}
              </>
            )}
                {order.originalStatus === 'Cancel' && (
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

      {selectedProduct && (
        <ReportModal isOpen={showReportModal} onClose={handleCloseReportModal} product={selectedProduct} />
      )}

      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={handleCloseCancelModal}
        orderId={selectedOrderId}
        userId={user?.userId || ''}
        orderStatus={selectedOrderStatus}
        onContinuePayment={handleContinuePaymentFromModal}
        isProcessingPayment={processingPaymentOrderId === selectedOrderId}
      />

      <OrderDetailModal isOpen={showOrderDetailModal} onClose={handleCloseOrderDetailModal} orderId={selectedOrderId} />

      <ReviewModal isOpen={showReviewModal} onClose={handleCloseReviewModal} product={selectedProduct} />

      <ComplaintModal
        isOpen={showComplaintModal}
        onClose={handleCloseComplaintModal}
        orderId={selectedOrderId}
        storeId={orders.find((order) => order.id === selectedOrderId)?.storeId || ''}
        userId={user?.userId || ''}
        onSubmit={handleComplaint}
        isLoading={submittingComplaintOrderId === selectedOrderId}
      />
    </div>
  )
}
