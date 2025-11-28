import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { EllipsisVertical, MessageCircle } from 'lucide-react'
import { Button } from '../../../../../components/ui/button'
import { Badge } from '../../../../../components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '../../../../../components/ui/alert-dialog'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../../../components/ui/dialog'
import CancelOrderModal from './CancelOrderModal'
import OrderDetailModal from './OrderDetailModal'
import ReviewModal, { type ReviewProduct } from './ReviewModal'
import ComplaintModal from '../form/ComplaintModal'
import ViewComplaintModal from '../form/ViewComplaintModal'
import { confirmOrderReceived, getOrderDetail, refundOrder } from '../../../../../apis/order.api'
import { purchaseOrder } from '../../../../../apis/transaction.api'
import { formApi } from '../../../../../apis/form.api'
import { getRequestWalletMoney } from '../../../../../apis/requestWalletMoney.api'
import { path } from '../../../../../constants/path'
import type { Order as APIOrder, OrderStatus } from '../../../../../types/orderType'
import type { RequestWalletMoney } from '../../../../../types/requestWalletMoneyType'
import { toast } from '../../../../../utils/toast'
import { useAuth } from '../../../../../contexts/auth.context'
import { useChat } from '../../../../../contexts/chat.context'
import type { CreateFormRequest, FormType } from '../../../../../types/form.type'
import { Input } from '../../../../../components/ui/input'
import Pagination from '../../../../../components/Pagination/Pagination'

const DEFAULT_PRODUCT_IMAGE = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'

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

interface Order {
  id: string
  ghnorderCode?: string
  storeId: string
  fromName: string
  date: string
  originalStatus: OrderStatus
  status:
  | 'Chưa xác nhận'
  | 'Chờ xác nhận'
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
    productInventoryId?: string
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
    comboId?: string
    comboName?: string
  }[]
  total: string
  totalAmount?: number
  originalTotal?: string
  note?: string
  isComplained?: boolean
  canReturn?: boolean
  returnDeadline?: string
  // Action states
  showRefundRequest?: boolean // TH1: Shipper giao mà khách không nhận
  autoRefund?: boolean // TH2: Chưa xác nhận, tự hoàn tiền
  autoConfirmDays?: number // Số ngày tự động xác nhận nhận hàng
  canConfirmReceived?: boolean // Có thể click "Đã nhận được hàng"
  canComplain?: boolean // Có thể khiếu nại (ẩn nếu đã Complaining/Complained)
  isRefunded?: boolean // Đã yêu cầu hoàn tiền
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
          statusColor: 'text-yellow-700',
          statusBgColor: 'bg-yellow-50',
          statusText: 'Đang chờ xác nhận đơn hàng'
        }
      case 'PendingPayment':
        return {
          status: 'Chờ thanh toán' as const,
          statusColor: 'text-orange-700',
          statusBgColor: 'bg-orange-50',
          statusText: 'Bạn đã khởi tạo thanh toán, vui lòng hoàn tất'
        }
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
      case 'Cancel':
        return {
          status: 'Đã hủy' as const,
          statusColor: 'text-red-700',
          statusBgColor: 'bg-red-50',
          statusText: 'Đơn hàng đã bị hủy'
        }
      case 'Refunding':
        return {
          status: 'Trả hàng/Hoàn tiền' as const,
          statusColor: 'text-orange-700',
          statusBgColor: 'bg-orange-50',
          statusText: 'Đang hoàn tiền'
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
      productInventoryId: item?.productVariantId || '',
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
      name: item?.orderItemName || 'Sản phẩm không xác định',
      image: item?.orderItemImageUrl || DEFAULT_PRODUCT_IMAGE,
      quantity: (item?.quantity || 0).toString(),
      price: item?.finalPrice || 0,
      finalPrice: item?.finalPrice || 0,
      variant:
        item?.length > 0 && item?.width > 0 && item?.height > 0 && item?.weight > 0
          ? `${item.length}x${item.width}x${item.height}cm, ${item.weight}g`
          : 'Thông tin kích thước không có',
      isCombo: true,
      comboId: item?.comboId,
      comboName: item?.comboName
    }))
  ]

  const orderHistories = apiOrder?.orderHistories || []

  const statusVal: OrderStatus = apiOrder?.status || 'NotYet'
  const isComplaintInProgress = statusVal === 'Complaining' || statusVal === 'Complained'

  const isComplainedValue = apiOrder?.isComplained === true
  const canComplainOrder =
    (statusVal === 'Delivered' || statusVal === 'Paid') && !isComplaintInProgress && !isComplainedValue

  return {
    id: apiOrder?.id || '',
    ghnorderCode: apiOrder?.ghnorderCode || '',
    storeId: apiOrder?.storeId || '',
    fromName: apiOrder?.fromName || '',
    date: apiOrder?.createdAt,
    originalStatus: statusVal,
    isComplained: isComplainedValue,
    isRefunded: apiOrder?.isRefunded || false,
    ...statusInfo,
    isFreeship: apiOrder?.isFreeship || false,
    products,
    total: formatPrice(apiOrder?.finalPrice),
    totalAmount: apiOrder?.finalPrice || 0,
    note: apiOrder?.note || '',
    canConfirmReceived: statusVal === 'Delivered' && !apiOrder?.isPayOut,
    canComplain: canComplainOrder,
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
  const { openChatWithStore } = useChat()
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showComplaintModal, setShowComplaintModal] = useState(false)
  const [showViewComplaintModal, setShowViewComplaintModal] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string>('')
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>('')
  const [confirmingOrderId, setConfirmingOrderId] = useState<string>('')
  const [processingPaymentOrderId, setProcessingPaymentOrderId] = useState<string>('')
  const [submittingComplaintOrderId, setSubmittingComplaintOrderId] = useState<string>('')
  const [reviewProducts, setReviewProducts] = useState<ReviewProduct[]>([])
  const [loadingReviewOrderId, setLoadingReviewOrderId] = useState<string>('')
  const [showRefundConfirmDialog, setShowRefundConfirmDialog] = useState(false)
  const [refundingOrderId, setRefundingOrderId] = useState<string>('')
  const [showRefundInfoModal, setShowRefundInfoModal] = useState(false)
  const [refundInfo, setRefundInfo] = useState<RequestWalletMoney | null>(null)
  const [loadingRefundInfo, setLoadingRefundInfo] = useState(false)
  const ordersPerPage = 3

  const extractReviewProducts = (orderDetail?: APIOrder | null): ReviewProduct[] => {
    if (!orderDetail) return []

    const regularItems: ReviewProduct[] = (orderDetail.orderItems || []).map((item) => ({
      orderItemId: item?.id || '',
      productId: item?.productId || item?.productVariantId || '',
      name: item?.orderItemName || 'Sản phẩm không xác định',
      image: item?.orderItemImageUrl || DEFAULT_PRODUCT_IMAGE,
      isCombo: false,
      isReviewed: item?.isReviewed || false
    }))

    const comboItems: ReviewProduct[] = (orderDetail.orderItemsWithCombo || []).map((item, index) => {
      const comboNameKey = item?.comboName ? `${orderDetail.id || ''}-${item.comboName}` : ''
      const comboGroupKey =
        item?.comboId || comboNameKey || item?.id || item?.comboItemId || `${orderDetail.id || 'order'}-combo-${index}`

      return {
        orderItemId: item?.id || '',
        productId: item?.productId || item?.productVariantId || '',
        name: item?.orderItemName || 'Sản phẩm combo',
        image: item?.orderItemImageUrl || DEFAULT_PRODUCT_IMAGE,
        isCombo: true,
        comboId: item?.comboId || undefined,
        comboItemId: item?.comboItemId || undefined,
        comboName: item?.comboName || 'Combo',
        comboGroupKey,
        isReviewed: item?.isReviewed || false
      }
    })

    return [...regularItems, ...comboItems].filter((product) => product.productId && product.orderItemId)
  }

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
          'Complained',
          'Refunding'
        ]
      case 'Đã hủy':
        return ['Cancel']
      default:
        return []
    }
  }

  const filteredOrders = useMemo(() => {
    let filtered = orders

    // Filter by status if not "all"
    if (selectedFilter !== 'all') {
      const statusesForTab = getStatusesForTab(selectedFilter)
      filtered = filtered.filter((order) => statusesForTab.includes(order.originalStatus))
    }

    // Filter by search query only when "all" tab is selected
    if (selectedFilter === 'all' && searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()

      // Try to parse as number for price search
      const queryAsNumber = parseFloat(query.replace(/[^\d]/g, ''))
      const isNumericSearch = !isNaN(queryAsNumber) && queryAsNumber > 0

      filtered = filtered.filter((order) => {
        // Search by order ID
        if (order.id.toLowerCase().includes(query)) return true

        // Search by GHN order code (mã đơn GHN)
        if (order.ghnorderCode && order.ghnorderCode.toLowerCase().includes(query)) return true

        // Search by store name (tên cửa hàng)
        if (order.fromName.toLowerCase().includes(query)) return true

        // Search by product names (tên sản phẩm)
        const productMatch = order.products.some(
          (product) => product.name.toLowerCase().includes(query)
        )
        if (productMatch) return true

        // Search by note (ghi chú)
        if (order.note && order.note.toLowerCase().includes(query)) return true

        // Search by recipient name (tên người nhận)
        if (order.shippingInfo?.recipientName?.toLowerCase().includes(query)) return true

        // Search by shipping address (địa chỉ giao hàng)
        if (order.shippingInfo?.address?.toLowerCase().includes(query)) return true

        // Search by total amount (tổng tiền) - compare with numeric value
        if (isNumericSearch && order.totalAmount) {
          const orderAmount = Math.floor(order.totalAmount)
          const searchAmount = Math.floor(queryAsNumber)
          if (orderAmount.toString().includes(searchAmount.toString())) return true
        }

        // Search in formatted total price (format: "1.000.000đ")
        if (order.total.replace(/[^\d]/g, '').includes(query.replace(/[^\d]/g, ''))) return true

        return false
      })
    }

    return filtered
  }, [orders, selectedFilter, searchQuery])

  const handleFilterChange = (filterKey: string) => {
    setSelectedFilter(filterKey)
    setCurrentPage(1)
    // Reset search query when switching tabs
    setSearchQuery('')
    if (onFilterByStatus) {
      onFilterByStatus('')
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
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
      toast.error('Có lỗi xảy ra khi xác nhận đã nhận hàng. Vui lòng thử lại.')
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
      setProcessingPaymentOrderId('')
    }
  }

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

      setShowComplaintModal(false)
      toast.success('Gửi khiếu nại thành công! Chúng tôi sẽ xem xét và phản hồi sớm nhất.')
      onRefreshOrders()
    } catch (error) {
      console.error('Error submitting complaint:', error)
      toast.error('Có lỗi xảy ra khi gửi khiếu nại. Vui lòng thử lại sau.')
    } finally {
      setSubmittingComplaintOrderId('')
    }
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

  const handleOpenReviewModal = async (orderId: string) => {
    try {
      setLoadingReviewOrderId(orderId)
      const orderDetail = await getOrderDetail(orderId)
      const productsForReview = extractReviewProducts(orderDetail)

      if (!productsForReview.length) {
        toast.info('Không tìm thấy sản phẩm nào để đánh giá trong đơn hàng này.')
        return
      }

      setReviewProducts(productsForReview)
      setSelectedOrderId(orderId)
      setShowReviewModal(true)
    } catch (error) {
      console.error('Error fetching order detail for review:', error)
      toast.error('Không thể tải thông tin sản phẩm để đánh giá. Vui lòng thử lại.')
    } finally {
      setLoadingReviewOrderId('')
    }
  }

  const handleCloseReviewModal = () => {
    setShowReviewModal(false)
    setReviewProducts([])
    setSelectedOrderId('')
  }

  const handleOpenComplaintModal = (orderId: string) => {
    setSelectedOrderId(orderId)
    setShowComplaintModal(true)
  }

  const handleCloseComplaintModal = () => {
    setShowComplaintModal(false)
    setSelectedOrderId('')
  }

  const handleOpenViewComplaintModal = (orderId: string) => {
    setSelectedOrderId(orderId)
    setShowViewComplaintModal(true)
  }

  const handleCloseViewComplaintModal = () => {
    setShowViewComplaintModal(false)
    setSelectedOrderId('')
  }

  const handleOpenRefundConfirmDialog = (orderId: string) => {
    setSelectedOrderId(orderId)
    setShowRefundConfirmDialog(true)
  }

  const handleCloseRefundConfirmDialog = () => {
    setShowRefundConfirmDialog(false)
    setSelectedOrderId('')
    setRefundingOrderId('')
  }

  const handleConfirmRefund = async () => {
    if (!selectedOrderId) return

    try {
      setRefundingOrderId(selectedOrderId)
      await refundOrder(selectedOrderId)
      toast.success('Yêu cầu hoàn tiền đã được gửi thành công!')
      setShowRefundConfirmDialog(false)
      onRefreshOrders()
    } catch (error) {
      console.error('Lỗi khi yêu cầu hoàn tiền:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error).message ||
        'Có lỗi xảy ra khi yêu cầu hoàn tiền'
      toast.error(errorMessage)
    } finally {
      setRefundingOrderId('')
      setSelectedOrderId('')
    }
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

  const handleOpenRefundInfoModal = async (orderId: string) => {
    try {
      setLoadingRefundInfo(true)
      setSelectedOrderId(orderId)
      const response = await getRequestWalletMoney({
        orderId,
        type: 'Refund',
        pageSize: 1,
        pageNumber: 0
      })

      if (response.data && response.data.length > 0) {
        setRefundInfo(response.data[0])
        setShowRefundInfoModal(true)
      } else {
        toast.error('Không tìm thấy thông tin hoàn tiền cho đơn hàng này')
      }
    } catch (error) {
      console.error('Error fetching refund info:', error)
      toast.error('Không thể tải thông tin hoàn tiền. Vui lòng thử lại.')
    } finally {
      setLoadingRefundInfo(false)
    }
  }

  const handleCloseRefundInfoModal = () => {
    setShowRefundInfoModal(false)
    setRefundInfo(null)
    setSelectedOrderId('')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return { text: 'Đang chờ xử lý', className: 'bg-yellow-100 text-yellow-800' }
      case 'Completed':
        return { text: 'Đã hoàn thành', className: 'bg-green-100 text-green-800' }
      case 'Cancel':
        return { text: 'Đã hủy', className: 'bg-red-100 text-red-800' }
      default:
        return { text: status, className: 'bg-gray-100 text-gray-800' }
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

      {selectedFilter === 'all' && (
        <div className='flex justify-between items-center mb-6'>
          <Input
            placeholder='Tìm kiếm: Mã đơn hàng, mã GHN, tên cửa hàng, tổng tiền...'
            value={searchQuery}
            onChange={handleSearchChange}
            className='w-full'
          />
        </div>
      )}

      <div className='space-y-4'>
        {currentOrders.length > 0 ? (
          currentOrders.map((order) => (
            <div key={order.id} className='bg-white border rounded-lg p-6'>
              <div className='flex justify-between items-start mb-4'>
                <div>
                  <div className='flex items-center gap-3 mb-2 flex-wrap'>
                    <div className='flex items-center gap-2'>
                      <span className=''>Cửa hàng: {order.fromName}</span>
                    </div>
                    <Badge className={`${order.statusBgColor} ${order.statusColor} border-0`}>{order.status}</Badge>
                    {order.isFreeship && (
                      <Badge className='bg-green-100 text-green-700 border-0 text-xs'>Miễn phí ship</Badge>
                    )}
                  </div>
                  <p className='text-sm text-gray-600'>{order.date}</p>
                  <p className={`text-sm ${order.statusColor} mt-1`}>
                    {order.statusText}

                  </p>
                </div>
                <div>
                  <Button
                    variant='yellow'
                    size='sm'
                    onClick={() => openChatWithStore(order.storeId, order.fromName)}
                    className='h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50'
                    title='Nhắn tin với cửa hàng'
                  >
                    <MessageCircle className='h-4 w-4 mr-1' />
                    <span className='text-xs'>Nhắn tin</span>
                  </Button>
                  <button
                    className='text-gray-600 hover:text-green-900 pl-2'
                    onClick={() => handleOpenOrderDetailModal(order.id)}
                  >
                    <EllipsisVertical className='h-4 w-4' />
                  </button>
                </div>
              </div>

              <div className='flex justify-between items-center pt-4 border-t'>
                <span className='text-gray-600'>Tổng tiền:</span>
                <span className='text-lg font-semibold text-gray-900'>{order.total}</span>
              </div>

              <div className='flex gap-2 pt-4 flex-wrap'>
                {(order.originalStatus === 'NotYet' || order.originalStatus === 'PendingPayment') && (
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
                      'Xác nhận đặt hàng'
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
                {(order.originalStatus === 'Delivered' || order.originalStatus === 'Paid') && (
                  <>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleOpenReviewModal(order.id)}
                      disabled={loadingReviewOrderId === order.id}
                      className='text-green-600 border-green-600 hover:bg-green-50 disabled:opacity-50'
                    >
                      {loadingReviewOrderId === order.id ? (
                        <>
                          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2'></div>
                          Đang tải...
                        </>
                      ) : (
                        'Đánh giá'
                      )}
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
                {(order.originalStatus === 'Complaining' || order.originalStatus === 'Complained') && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleOpenViewComplaintModal(order.id)}
                    className='text-blue-600 border-blue-600 hover:bg-blue-50'
                  >
                    Xem khiếu nại
                  </Button>
                )}
                {order.isComplained &&
                  order.originalStatus !== 'Complaining' &&
                  order.originalStatus !== 'Complained' && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleOpenViewComplaintModal(order.id)}
                      className='text-blue-600 border-blue-600 hover:bg-blue-50'
                    >
                      Xem khiếu nại
                    </Button>
                  )}
                {(order.originalStatus === 'Lost' ||
                  order.originalStatus === 'Exception' ||
                  order.originalStatus === 'Damaged' ||
                  order.originalStatus === 'Returned') && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleOpenRefundConfirmDialog(order.id)}
                      disabled={refundingOrderId === order.id}
                      className='text-orange-600 border-orange-600 hover:bg-orange-50 disabled:opacity-50'
                    >
                      {refundingOrderId === order.id ? (
                        <>
                          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2'></div>
                          Đang xử lý...
                        </>
                      ) : (
                        'Yêu cầu hoàn tiền'
                      )}
                    </Button>
                  )}
                {order.isRefunded && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleOpenRefundInfoModal(order.id)}
                    disabled={loadingRefundInfo && selectedOrderId === order.id}
                    className='text-blue-600 border-blue-600 hover:bg-blue-50 disabled:opacity-50'
                  >
                    {loadingRefundInfo && selectedOrderId === order.id ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2'></div>
                        Đang tải...
                      </>
                    ) : (
                      'Xem thông tin hoàn tiền'
                    )}
                  </Button>
                )}
                {(order.originalStatus === 'Cancel' ||
                  order.originalStatus === 'Refunding' ||
                  order.originalStatus === 'Delivered' ||
                  order.originalStatus === 'Paid' ||
                  order.originalStatus === 'Returned') && (
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
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} maxVisiblePages={2} />
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

      <ReviewModal
        isOpen={showReviewModal}
        onClose={handleCloseReviewModal}
        products={reviewProducts}
        userId={user?.userId || ''}
        onReviewSubmitted={onRefreshOrders}
      />

      <ComplaintModal
        isOpen={showComplaintModal}
        onClose={handleCloseComplaintModal}
        orderId={selectedOrderId}
        storeId={orders.find((order) => order.id === selectedOrderId)?.storeId || ''}
        userId={user?.userId || ''}
        onSubmit={handleComplaint}
        isLoading={submittingComplaintOrderId === selectedOrderId}
      />

      <ViewComplaintModal
        isOpen={showViewComplaintModal}
        onClose={handleCloseViewComplaintModal}
        orderId={selectedOrderId}
      />

      {/* Refund Confirmation Dialog */}
      <AlertDialog open={showRefundConfirmDialog} onOpenChange={setShowRefundConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận yêu cầu hoàn tiền</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn yêu cầu hoàn tiền cho đơn hàng này? Yêu cầu của bạn sẽ được xử lý và tiền sẽ được
              hoàn lại vào tài khoản của bạn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseRefundConfirmDialog} disabled={!!refundingOrderId}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRefund}
              disabled={!!refundingOrderId}
              className='bg-orange-600 hover:bg-orange-700 text-white'
            >
              {refundingOrderId ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block'></div>
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund Info Modal */}
      <Dialog open={showRefundInfoModal} onOpenChange={setShowRefundInfoModal}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <span>Thông tin hoàn tiền</span>
            </DialogTitle>
          </DialogHeader>
          {refundInfo && (
            <div className='space-y-4 mt-4'>
              {/* Status Badge */}
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium text-gray-700'>Trạng thái:</span>
                <Badge className={getStatusBadge(refundInfo.status).className}>
                  {getStatusBadge(refundInfo.status).text}
                </Badge>
              </div>

              {/* Amount */}
              <div className='p-4 bg-gray-50 rounded-lg'>
                <div className='text-sm text-gray-600 mb-1'>Số tiền hoàn lại</div>
                <div className='text-2xl font-bold text-green-600'>
                  {formatPrice(refundInfo.amount)}
                </div>
              </div>

              {/* Bank Information */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <div className='text-sm text-gray-600 mb-1'>Ngân hàng</div>
                  <div className='text-sm font-medium text-gray-900'>{refundInfo.bankName || '-'}</div>
                </div>
                <div>
                  <div className='text-sm text-gray-600 mb-1'>Số tài khoản</div>
                  <div className='text-sm font-medium text-gray-900'>{refundInfo.bankAccount || '-'}</div>
                </div>
                <div className='col-span-2'>
                  <div className='text-sm text-gray-600 mb-1'>Tên chủ tài khoản</div>
                  <div className='text-sm font-medium text-gray-900'>{refundInfo.accountHolderName || '-'}</div>
                </div>
              </div>

              {/* Process Information */}
              {refundInfo.processedBy && (
                <div className='p-4 bg-blue-50 rounded-lg'>
                  <div className='text-sm font-medium text-gray-900 mb-2'>Thông tin xử lý</div>
                  <div className='text-sm text-gray-700'>
                    <div>Người xử lý: {refundInfo.processedBy}</div>
                    {refundInfo.processedAt && <div>Thời gian: {refundInfo.processedAt}</div>}
                  </div>
                </div>
              )}

              {/* Process Note */}
              {refundInfo.processNote && (
                <div>
                  <div className='text-sm text-gray-600 mb-1'>Ghi chú xử lý</div>
                  <div className='p-3 bg-gray-50 rounded-lg text-sm text-gray-900'>{refundInfo.processNote}</div>
                </div>
              )}

              {/* Timestamps */}
              <div className='grid grid-cols-2 gap-4 pt-4 border-t'>
                <div>
                  <div className='text-sm text-gray-600 mb-1'>Ngày tạo yêu cầu</div>
                  <div className='text-sm text-gray-900'>{refundInfo.createdAt || '-'}</div>
                </div>
                <div>
                  <div className='text-sm text-gray-600 mb-1'>Cập nhật lần cuối</div>
                  <div className='text-sm text-gray-900'>{refundInfo.updatedAt || '-'}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={handleCloseRefundInfoModal}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
