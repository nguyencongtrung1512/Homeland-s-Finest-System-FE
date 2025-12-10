import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent } from '../../../components/ui/card'
import { Dialog, DialogContent } from '../../../components/ui/dialog'
import { Textarea } from '../../../components/ui/textarea'
import { Input } from '../../../components/ui/input'
import {
  getOrderDetail,
  confirmOrder,
  readyToPickOrder,
  cancelOrder,
  uploadVerificationImages
} from '../../../apis/order.api'
import type { Order as APIOrder } from '../../../types/orderType'
import {
  Loader2,
  Package,
  MapPin,
  CreditCard,
  Clock,
  RefreshCw,
  AlertCircle,
  Gift,
  CheckCircle,
  XCircle,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react'
import { toast } from '../../../utils/toast'

interface OrderItemWithCombo {
  id: string
  comboItemId?: string
  comboId?: string
  comboName?: string
  orderItemName: string
  orderItemImageUrl: string
  quantity: number
  finalPrice?: number
  totalPrice: number
  length?: number
  width?: number
  height?: number
  weight?: number
}

interface OrderItem {
  id: string
  orderItemName: string
  orderItemImageUrl: string
  quantity: number
  finalPrice?: number
  totalPrice: number
  length?: number
  width?: number
  height?: number
  weight?: number
}

interface OrderPromotion {
  promotionType: string
  title: string
  description: string
  discountType: string
  discountValue: number
  discountAmount: number
}

interface Order {
  id: string
  ghnorderCode: string
  status: string
  createdAt: string
  toName: string
  toAddress: string
  fromPhone?: string
  paymentType: string
  totalOrder: number
  totalDiscount: number
  shipPrice: number
  finalPrice: number
  note?: string
  orderItems: OrderItem[]
  orderItemsWithCombo: OrderItemWithCombo[]
  orderHistories: Array<{
    id: string
    description: string
    time: string
  }>
  orderPromotions: OrderPromotion[]
  VerificationImages?: string[]
  VerificationAt?: string | null
  deadlineVerificationAt?: string | null
}

interface OrderDetailModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string | null
}
const DEFAULT_PRODUCT_IMAGE = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'

// Interface for API error response
interface ApiError {
  message?: string
  error?: string
  errors?: string[] | Array<{ field: string; message: string }> | Record<string, string[]>
  title?: string
  response?: {
    data?: {
      message?: string
      error?: string
      errors?: string[] | Array<{ field: string; message: string }> | Record<string, string[]>
      title?: string
    }
  }
}

// Helper function to extract error message from backend response
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (!error || typeof error !== 'object') {
    if (typeof error === 'string') {
      return error
    }
    return defaultMessage
  }

  const apiError = error as ApiError

  // Priority 1: Check for direct message field (axios interceptor returns error.response.data directly)
  if (apiError.message) {
    return apiError.message
  }

  // Priority 2: Check for error field
  if (apiError.error) {
    return apiError.error
  }

  // Priority 3: Check for title field
  if (apiError.title) {
    return apiError.title
  }

  // Priority 4: Check for errors array
  if (apiError.errors) {
    if (Array.isArray(apiError.errors)) {
      if (apiError.errors.length > 0) {
        // Check if it's array of objects with message field
        if (typeof apiError.errors[0] === 'object' && 'message' in apiError.errors[0]) {
          return apiError.errors
            .map((e: { field?: string; message?: string } | string) => {
              if (typeof e === 'object' && 'message' in e) {
                return e.message || String(e)
              }
              return String(e)
            })
            .join(', ')
        }
        // Otherwise, it's array of strings
        return apiError.errors.map((e) => String(e)).join(', ')
      }
    } else if (typeof apiError.errors === 'object') {
      // errors is an object with field names as keys
      const errorMessages: string[] = []
      Object.values(apiError.errors).forEach((fieldErrors) => {
        if (Array.isArray(fieldErrors)) {
          errorMessages.push(...fieldErrors.map((e) => String(e)))
        } else if (typeof fieldErrors === 'string') {
          errorMessages.push(fieldErrors)
        }
      })
      if (errorMessages.length > 0) {
        return errorMessages.join(', ')
      }
    }
  }

  // Priority 5: Check for axios error response structure (fallback)
  if (apiError.response?.data) {
    const responseData = apiError.response.data
    if (responseData.message) {
      return responseData.message
    }
    if (responseData.error) {
      return responseData.error
    }
    if (responseData.title) {
      return responseData.title
    }
    if (responseData.errors) {
      if (Array.isArray(responseData.errors)) {
        if (responseData.errors.length > 0) {
          if (typeof responseData.errors[0] === 'object' && 'message' in responseData.errors[0]) {
            return responseData.errors
              .map((e: { field?: string; message?: string } | string) => {
                if (typeof e === 'object' && 'message' in e) {
                  return e.message || String(e)
                }
                return String(e)
              })
              .join(', ')
          }
          return responseData.errors.map((e) => String(e)).join(', ')
        }
      } else if (typeof responseData.errors === 'object') {
        const errorMessages: string[] = []
        Object.values(responseData.errors).forEach((fieldErrors) => {
          if (Array.isArray(fieldErrors)) {
            errorMessages.push(...fieldErrors.map((e) => String(e)))
          } else if (typeof fieldErrors === 'string') {
            errorMessages.push(fieldErrors)
          }
        })
        if (errorMessages.length > 0) {
          return errorMessages.join(', ')
        }
      }
    }
  }

  return defaultMessage
}

// Helper function to get verification images from API response (handles both camelCase and PascalCase)
const getVerificationImages = (apiOrder: APIOrder): string[] => {
  // Check both possible field names (camelCase and PascalCase)
  const orderWithAny = apiOrder as APIOrder & { verificationImages?: string[]; verificationAt?: string | null }
  return apiOrder?.VerificationImages || orderWithAny?.verificationImages || []
}

// Helper function to get verification timestamp from API response
const getVerificationAt = (apiOrder: APIOrder): string | null => {
  const orderWithAny = apiOrder as APIOrder & { verificationAt?: string | null }
  return apiOrder?.VerificationAt || orderWithAny?.verificationAt || null
}

const OrderDetail: React.FC<OrderDetailModalProps> = ({ isOpen, onClose, orderId }) => {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [ghnCode, setGhnCode] = useState('')
  const [showShipDialog, setShowShipDialog] = useState(false)
  const [verificationImages, setVerificationImages] = useState<File[]>([])
  const [verificationImagePreviews, setVerificationImagePreviews] = useState<string[]>([])
  const [existingVerificationImages, setExistingVerificationImages] = useState<string[]>([])
  const [uploadVerificationLoading, setUploadVerificationLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Transform API order to UI order format
  const transformAPIOrderToUIOrder = (apiOrder: APIOrder): Order => {
    return {
      id: apiOrder?.id || '',
      ghnorderCode: apiOrder?.ghnorderCode || '',
      status: apiOrder?.status || '',
      createdAt: apiOrder?.createdAt || '',
      toName: apiOrder?.toName || '',
      toAddress: apiOrder?.toAddress || '',
      fromPhone: apiOrder?.fromPhone || '',
      paymentType: apiOrder?.paymentType || '',
      totalOrder: apiOrder?.totalOrder || 0,
      totalDiscount: apiOrder?.totalDiscount || 0,
      shipPrice: apiOrder?.shipPrice || 0,
      finalPrice: apiOrder?.finalPrice || 0,
      note: apiOrder?.note || undefined,
      orderItems: (apiOrder?.orderItems || []).map((item) => ({
        id: item?.id || '',
        orderItemName: item?.orderItemName || 'Sản phẩm không xác định',
        orderItemImageUrl: item?.orderItemImageUrl || DEFAULT_PRODUCT_IMAGE,
        quantity: item?.quantity || 0,
        finalPrice: item?.finalPrice,
        totalPrice: item?.totalPrice || 0,
        length: item?.length,
        width: item?.width,
        height: item?.height,
        weight: item?.weight
      })),
      orderItemsWithCombo: (apiOrder?.orderItemsWithCombo || []).map((item) => {
        const comboItem = item as Partial<OrderItemWithCombo>
        return {
          id: comboItem?.id || '',
          comboItemId: comboItem?.comboItemId,
          comboId: comboItem?.comboId,
          comboName: comboItem?.comboName,
          orderItemName: comboItem?.orderItemName || 'Sản phẩm không xác định',
          orderItemImageUrl: comboItem?.orderItemImageUrl || DEFAULT_PRODUCT_IMAGE,
          quantity: comboItem?.quantity || 0,
          finalPrice: comboItem?.finalPrice,
          totalPrice: comboItem?.totalPrice || 0,
          length: comboItem?.length,
          width: comboItem?.width,
          height: comboItem?.height,
          weight: comboItem?.weight
        }
      }),
      orderHistories: apiOrder?.orderHistories || [],
      orderPromotions: (apiOrder?.orderPromotions || []).map((promo) => ({
        promotionType: promo?.promotionType || '',
        title: promo?.title || '',
        description: promo?.description || '',
        discountType: promo?.discountType || '',
        discountValue: promo?.discountValue || 0,
        discountAmount: promo?.discountAmount || 0
      })),
      VerificationImages: getVerificationImages(apiOrder),
      VerificationAt: getVerificationAt(apiOrder),
      deadlineVerificationAt: apiOrder?.deadlineVerificationAt || null
    }
  }

  // Fetch order details
  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) return

    setLoading(true)
    setError(null)

    try {
      const apiOrder = await getOrderDetail(orderId)
      const transformedOrder = transformAPIOrderToUIOrder(apiOrder)
      setOrder(transformedOrder)
      // Set existing verification images
      const verificationImages = transformedOrder.VerificationImages || []
      setExistingVerificationImages(verificationImages)
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Không thể tải chi tiết đơn hàng')
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  // Fetch data when modal opens or orderId changes
  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetail()
    }
  }, [isOpen, orderId, fetchOrderDetail])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setOrder(null)
      setError(null)
      setCancelReason('')
      setShowCancelDialog(false)
      setGhnCode('')
      setShowShipDialog(false)
      setVerificationImages([])
      setVerificationImagePreviews([])
      setExistingVerificationImages([])
    }
  }, [isOpen])

  // Handle accept order
  const handleAcceptOrder = async () => {
    if (!order?.id) return

    setActionLoading(true)
    try {
      await confirmOrder(order.id)
      toast.success('Đơn hàng đã được xác nhận thành công!')
      // Refresh order data
      await fetchOrderDetail()
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Không thể xác nhận đơn hàng')
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle ship order - mở dialog để nhập GHNcode
  const handleShipOrder = () => {
    setShowShipDialog(true)
  }

  // Xác nhận đơn hàng sẵn sàng lấy hàng với GHNcode
  const handleConfirmReadyToPick = async () => {
    if (!order?.id || !ghnCode.trim()) {
      toast.error('Vui lòng nhập mã GHN')
      return
    }

    setActionLoading(true)
    try {
      await readyToPickOrder(order.id, ghnCode.trim())
      toast.success('Đơn hàng đã được xác nhận sẵn sàng lấy hàng!')
      setShowShipDialog(false)
      setGhnCode('')
      // Refresh order data
      await fetchOrderDetail()
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Không thể xác nhận đơn hàng sẵn sàng lấy hàng')
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle cancel order
  const handleCancelOrder = async () => {
    if (!order?.id || !cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối')
      return
    }

    setActionLoading(true)
    try {
      await cancelOrder(order.id, cancelReason.trim())
      toast.success('Đơn hàng đã được hủy thành công!')
      setShowCancelDialog(false)
      setCancelReason('')
      // Refresh order data
      await fetchOrderDetail()
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Không thể từ chối đơn hàng')
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusText = (status: string) => {
    const statusTextMap: Record<string, string> = {
      NotYet: 'Chưa xử lí',
      PendingPayment: 'Chờ thanh toán',
      Processing: 'Chờ xác nhận',
      Confirmed: 'Đã xác nhận',
      Cancel: 'Đã hủy',
      ReadyToPick: 'Đang chuẩn bị hàng',
      Picking: 'Đang trên đường lấy hàng',
      Picked: 'Đã lấy hàng',
      Storing: 'Đang lưu kho',
      Transporting: 'Đang vận chuyển',
      Sorting: 'Đang phân loại',
      Delivering: 'Đang giao hàng',
      Delivered: 'Đã giao hàng thành công',
      DeliveryFail: 'Giao hàng thất bại',
      Returning: 'Đang trả hàng',
      Returned: 'Đã trả hàng',
      Refunded: 'Đã hoàn tiền',
      Complaining: 'Đang phản hồi',
      Complained: 'Đã phản hồi',
      Paid: 'Đã thanh toán',
      Exception: 'Gặp sự cố',
      Damaged: 'Hàng hư hỏng',
      Lost: 'Thất lạc'
    }
    return statusTextMap[status] || 'Chưa xác định'
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ'
  }

  const getPaymentTypeText = (paymentType: string) => {
    const paymentTypeMap: Record<string, string> = {
      COD: 'Thanh toán khi nhận hàng',
      MyWallet: 'Thanh toán bằng ví',
      Banking: 'Thanh toán bằng thẻ ngân hàng'
    }
    return paymentTypeMap[paymentType] || paymentType
  }

  // Group combo items
  const comboGroups = order?.orderItemsWithCombo.reduce(
    (acc, item) => {
      const comboKey = item.comboId || item.comboName || item.comboItemId || item.id
      if (!acc[comboKey]) {
        acc[comboKey] = {
          comboName: item.comboName,
          items: [],
          totalPrice: 0
        }
      }
      acc[comboKey].items.push(item)
      acc[comboKey].totalPrice += item.totalPrice || 0
      return acc
    },
    {} as Record<string, { comboName?: string; items: OrderItemWithCombo[]; totalPrice: number }>
  )

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    event.currentTarget.onerror = null
    event.currentTarget.src = DEFAULT_PRODUCT_IMAGE
  }

  // Calculate days since order completed (Delivered or Paid)
  const calculateDaysSinceCompleted = (order: Order): number | null => {
    if (order.status !== 'Delivered' && order.status !== 'Paid') {
      return null
    }

    let completedTime: Date | null = null

    // First, try to find in orderHistories - look for most recent Delivered/Paid status
    const histories = order.orderHistories || []

    // Search from newest to oldest
    for (let i = histories.length - 1; i >= 0; i--) {
      const history = histories[i]
      const desc = history.description.toLowerCase()

      if (
        desc.includes('delivered') ||
        desc.includes('đã giao hàng') ||
        desc.includes('đã giao') ||
        desc.includes('giao hàng thành công') ||
        (order.status === 'Paid' && (desc.includes('paid') || desc.includes('đã thanh toán')))
      ) {
        try {
          completedTime = new Date(history.time)
          if (!isNaN(completedTime.getTime())) {
            break
          }
        } catch {
          // Error parsing history time
        }
      }
    }

    // If still not found and status is Delivered, check for any status change history
    if (!completedTime && histories.length > 0) {
      // Use the latest history entry that might indicate completion
      const latestHistory = histories[histories.length - 1]
      try {
        completedTime = new Date(latestHistory.time)
        if (isNaN(completedTime.getTime())) {
          completedTime = null
        }
      } catch {
        // Error parsing latest history time
      }
    }

    if (!completedTime) {
      return null
    }

    const now = new Date()
    const diffTime = now.getTime() - completedTime.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    return Math.max(0, diffDays) // Ensure non-negative
  }

  // Check if verification warning should be shown
  const shouldShowVerificationWarning = (order: Order): { show: boolean; days: number; isOverdue: boolean } => {
    if (order.status !== 'Delivered' && order.status !== 'Paid') {
      return { show: false, days: 0, isOverdue: false }
    }

    // Check if verification images exist
    const hasVerificationImages = order.VerificationImages && order.VerificationImages.length > 0

    // If already has verification images, no warning needed
    if (hasVerificationImages) {
      return { show: false, days: 0, isOverdue: false }
    }

    const daysSinceCompleted = calculateDaysSinceCompleted(order)

    if (daysSinceCompleted === null) {
      // Can't determine completion date, show warning anyway
      return { show: true, days: 0, isOverdue: false }
    }

    const isOverdue = daysSinceCompleted >= 2

    return {
      show: true,
      days: daysSinceCompleted,
      isOverdue
    }
  }

  // Process image files (shared logic for file input and drag & drop)
  const processImageFiles = (files: File[]) => {
    if (files.length === 0) return

    const imageFiles = files.filter((file) => {
      // Check file type
      if (!file.type.startsWith('image/')) return false
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} vượt quá 10MB`)
        return false
      }
      return true
    })

    if (imageFiles.length !== files.length) {
      toast.error('Vui lòng chỉ chọn file ảnh (PNG, JPG, GIF) và không quá 10MB mỗi ảnh')
      return
    }

    // Calculate total images: existing + current new + new files
    const totalImages = existingVerificationImages.length + verificationImages.length + imageFiles.length
    const MAX_IMAGES = 3

    if (totalImages > MAX_IMAGES) {
      const allowedNewImages = MAX_IMAGES - existingVerificationImages.length - verificationImages.length
      if (allowedNewImages <= 0) {
        toast.error(`Tối đa chỉ được ${MAX_IMAGES} ảnh. Bạn đã đạt giới hạn.`)
        return
      }
      const limitedImages = imageFiles.slice(0, allowedNewImages)
      toast.warning(`Chỉ có thể thêm tối đa ${MAX_IMAGES} ảnh. Đã chọn ${limitedImages.length} ảnh đầu tiên.`)
      setVerificationImages((prev) => [...prev, ...limitedImages])

      // Create previews for limited images
      limitedImages.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const previewUrl = e.target?.result as string
          setVerificationImagePreviews((prev) => [...prev, previewUrl])
        }
        reader.readAsDataURL(file)
      })
      return
    }

    setVerificationImages((prev) => [...prev, ...imageFiles])

    // Create previews
    imageFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string
        setVerificationImagePreviews((prev) => [...prev, previewUrl])
      }
      reader.readAsDataURL(file)
    })
  }

  // Handle verification image selection
  const handleVerificationImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    processImageFiles(files)
    // Reset input value to allow selecting the same file again
    event.target.value = ''
  }

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    processImageFiles(files)
  }

  // Remove verification image
  const handleRemoveVerificationImage = (index: number) => {
    setVerificationImages((prev) => prev.filter((_, i) => i !== index))
    setVerificationImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  // Handle upload verification images
  const handleUploadVerificationImages = async () => {
    if (!order?.id) return

    if (verificationImages.length === 0 && existingVerificationImages.length === 0) {
      toast.error('Vui lòng chọn ít nhất một ảnh')
      return
    }

    setUploadVerificationLoading(true)
    try {
      await uploadVerificationImages(order.id, verificationImages, existingVerificationImages)
      toast.success('Upload ảnh xác minh thành công!')

      // Reset upload state first
      setVerificationImages([])
      setVerificationImagePreviews([])

      // Always refresh order data to ensure VerificationImages are up to date
      await fetchOrderDetail()
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Không thể upload ảnh xác minh')
      toast.error(errorMessage)
    } finally {
      setUploadVerificationLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-7xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0'>
        {/* Header */}
        <div className='bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 flex items-center justify-between'>
          <div className='flex items-center gap-2 text-white'>
            <Package className='h-5 w-5' />
            <span className='font-semibold'>Chi tiết đơn hàng</span>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto bg-gray-50'>
          {loading ? (
            <div className='flex items-center justify-center py-16'>
              <Loader2 className='h-8 w-8 animate-spin text-green-600' />
              <span className='ml-2 text-gray-600'>Đang tải...</span>
            </div>
          ) : error ? (
            <div className='p-4'>
              <Card className='border-red-200 bg-red-50'>
                <CardContent className='pt-6'>
                  <div className='flex items-center gap-2 text-red-600 mb-3'>
                    <AlertCircle className='h-5 w-5' />
                    <span>{error}</span>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={fetchOrderDetail}
                    className='text-red-600 border-red-600 hover:bg-red-50'
                  >
                    <RefreshCw className='h-4 w-4 mr-2' />
                    Thử lại
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : order ? (
            <div className='space-y-3 p-4'>
              {/* Order Info Card */}
              <div className='bg-white rounded-lg p-4 shadow-sm border border-gray-100'>
                <div className='flex justify-between items-start mb-3'>
                  <div>
                    <p className='text-xs text-gray-600'>Mã đơn hàng</p>
                    <div className='flex flex-col gap-1'>
                      <p className='font-bold text-gray-900'>#{order.id}</p>
                      {order.ghnorderCode && (
                        <p className='text-sm font-medium text-orange-600'>GHN: {order.ghnorderCode}</p>
                      )}
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='text-xs text-gray-600'>Ngày đặt</p>
                    <p className='font-medium text-gray-900 text-sm'>{order.createdAt}</p>
                  </div>
                </div>
                <div className='flex justify-between items-start'>
                  <div>
                    <p className='text-xs text-gray-600'>Tổng giá trị</p>
                    <p className='font-bold text-green-600 text-lg'>{formatPrice(order.finalPrice)}</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-xs text-gray-600'>Trạng thái</p>
                    <div className='flex items-center gap-1 mt-1'>
                      <div className='w-2 h-2 rounded-full bg-green-600'></div>
                      <span className='text-sm font-medium text-green-600'>{getStatusText(order.status)}</span>
                      <Package className='h-4 w-4 text-green-600' />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cancel Reason */}
              {(order.status === 'Cancel' || order.status === 'Returned') && order.note && (
                <div className='bg-red-50 rounded-lg p-3 border border-red-200'>
                  <div className='flex items-center gap-2 text-red-700 mb-2'>
                    <AlertCircle className='h-4 w-4' />
                    <span className='font-semibold text-sm'>Lý do từ chối đơn hàng</span>
                  </div>
                  <p className='text-red-700 text-sm'>{order.note}</p>
                </div>
              )}

              {/* Order Note */}
              {order.note && order.status !== 'Cancel' && order.status !== 'Returned' && (
                <div className='bg-gray-50 rounded-lg p-3 border border-gray-200'>
                  <div className='flex items-center gap-2 text-gray-700 mb-2'>
                    <AlertCircle className='h-4 w-4' />
                    <span className='font-semibold text-sm'>Ghi chú đơn hàng</span>
                  </div>
                  <p className='text-gray-700 text-sm whitespace-pre-wrap'>{order.note}</p>
                </div>
              )}

              {/* Verification Warning - Only for Delivered or Paid status without verification images */}
              {(() => {
                const warning = shouldShowVerificationWarning(order)
                if (!warning.show) return null

                return (
                  <div
                    className={`rounded-lg p-4 border-2 ${warning.isOverdue ? 'bg-red-50 border-red-300 shadow-md' : 'bg-yellow-50 border-yellow-300'
                      }`}
                  >
                    <div className='flex items-start gap-3'>
                      <div className={`flex-shrink-0 ${warning.isOverdue ? 'text-red-600' : 'text-yellow-600'}`}>
                        <AlertCircle className='h-5 w-5' />
                      </div>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-2'>
                          <h3 className={`font-bold text-sm ${warning.isOverdue ? 'text-red-800' : 'text-yellow-800'}`}>
                            {warning.isOverdue ? '⚠️ CẢNH BÁO NGHIÊM TRỌNG' : '⚠️ CẢNH BÁO'}
                          </h3>
                        </div>
                        <p className={`text-sm mb-2 ${warning.isOverdue ? 'text-red-700' : 'text-yellow-700'}`}>
                          Đơn hàng đã hoàn thành nhưng bạn chưa upload ảnh xác minh giao hàng.
                        </p>
                        {order.deadlineVerificationAt && (
                          <div
                            className={`mb-2 p-2 rounded-lg border ${warning.isOverdue ? 'bg-red-100 border-red-300' : 'bg-yellow-100 border-yellow-300'
                              }`}
                          >
                            <p
                              className={`text-xs font-medium mb-1 ${warning.isOverdue ? 'text-red-800' : 'text-yellow-800'
                                }`}
                            >
                              Hạn upload ảnh xác minh:
                            </p>
                            <p
                              className={`text-sm font-bold ${warning.isOverdue ? 'text-red-900' : 'text-yellow-900'}`}
                            >
                              {order.deadlineVerificationAt}
                            </p>
                          </div>
                        )}
                        {warning.days > 0 && (
                          <p
                            className={`text-sm font-semibold mb-2 ${warning.isOverdue ? 'text-red-800' : 'text-yellow-800'
                              }`}
                          >
                            Đã qua {warning.days} {warning.days === 1 ? 'ngày' : 'ngày'} kể từ khi đơn hàng hoàn thành.
                          </p>
                        )}
                        {warning.isOverdue ? (
                          <div className='mt-3 p-3 bg-red-100 rounded-lg border border-red-200'>
                            <p className='text-sm font-bold text-red-900 mb-1'>⛔ BẠN SẼ BỊ PHẠT TĂNG ĐIỂM VI PHẠM!</p>
                            <p className='text-sm text-red-800'>
                              Đã quá 2 ngày kể từ khi đơn hàng hoàn thành. Nếu không upload ảnh xác minh ngay, hệ thống
                              sẽ tự động tăng số lượng điểm vi phạm của cửa hàng.
                            </p>
                          </div>
                        ) : (
                          <div className='mt-3 p-3 bg-yellow-100 rounded-lg border border-yellow-200'>
                            <p className='text-sm font-semibold text-yellow-900 mb-1'>
                              Còn {2 - warning.days} {2 - warning.days === 1 ? 'ngày' : 'ngày'} để upload ảnh
                            </p>
                            <p className='text-sm text-yellow-800'>
                              Vui lòng upload ảnh xác minh giao hàng ngay để tránh bị phạt tăng điểm vi phạm sau 2 ngày.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Products Section */}
              <div className='bg-white rounded-lg p-4 shadow-sm border border-gray-100'>
                <div className='flex items-center gap-2 mb-3'>
                  <Package className='h-4 w-4 text-green-600' />
                  <h3 className='font-semibold text-gray-900 mt-3'>Sản phẩm trong đơn</h3>
                </div>

                <div className='space-y-3'>
                  {/* Combo Products */}
                  {comboGroups &&
                    Object.entries(comboGroups).map(([comboId, group]) => (
                      <div key={comboId} className='border-l-4 border-amber-500 pl-3'>
                        {group.comboName && (
                          <div className='flex items-center gap-2 mb-2'>
                            <span className='text-xs text-gray-600'>Combo:</span>
                            <span className='text-xs font-semibold text-amber-800'>{group.comboName}</span>
                          </div>
                        )}
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className='flex gap-3 mb-3 last:mb-0 bg-amber-50/50 rounded-lg p-2 border border-amber-100'
                          >
                            <img
                              src={item.orderItemImageUrl || DEFAULT_PRODUCT_IMAGE}
                              alt={item.orderItemName}
                              className='w-16 h-16 object-cover rounded-lg border-2 border-amber-300'
                              onError={handleImageError}
                            />
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-2 mb-1'>
                                <h4 className='font-medium text-gray-900 text-sm line-clamp-2'>{item.orderItemName}</h4>
                              </div>
                              {group.comboName && (
                                <p className='text-xs text-amber-600 font-medium'>Combo Sạch bà nông trại</p>
                              )}
                              <p className='text-xs text-gray-600'>Số lượng: {item.quantity}</p>
                            </div>
                            <div className='text-right'>
                              <p className='font-semibold text-gray-900'>{formatPrice(item.totalPrice)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}

                  {/* Regular Products */}
                  {order.orderItems.map((item) => (
                    <div key={item.id} className='flex gap-3 bg-white rounded-lg p-2 border border-gray-200'>
                      <img
                        src={item.orderItemImageUrl || DEFAULT_PRODUCT_IMAGE}
                        alt={item.orderItemName}
                        className='w-16 h-16 object-cover rounded-lg border border-gray-200'
                        onError={handleImageError}
                      />
                      <div className='flex-1 min-w-0'>
                        <h4 className='font-medium text-gray-900 text-sm line-clamp-2'>{item.orderItemName}</h4>
                        {item.length && item.width && (
                          <p className='text-xs text-gray-600'>Túi {item.length}kg từ nông quê</p>
                        )}
                        <p className='text-xs text-gray-600'>Số lượng: {item.quantity}</p>
                      </div>
                      <div className='text-right'>
                        <p className='font-semibold text-gray-900'>{formatPrice(item.totalPrice)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Promotions Section */}
              {order.orderPromotions && order.orderPromotions.length > 0 && (
                <div className='bg-white rounded-lg p-4 shadow-sm border border-gray-100'>
                  <div className='flex items-center gap-2 mb-3'>
                    <Gift className='h-4 w-4 text-green-600' />
                    <h3 className='font-semibold text-gray-900'>Khuyến mãi đã áp dụng</h3>
                  </div>

                  <div className='space-y-3'>
                    {order.orderPromotions.map((promotion, index) => (
                      <div
                        key={promotion.promotionType + index}
                        className='flex items-center gap-4 p-4 border border-green-200 rounded-lg bg-green-50 shadow-sm'
                      >
                        {/* Logo Section */}
                        <div className='w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                          <img src='/src/assets/tinhhoa.svg' alt='Logo Tinh Hoa' className='w-8 h-8' />
                        </div>

                        {/* Promotion Details Section */}
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2 mb-2'>
                            <h4 className='font-semibold text-gray-900 text-sm'>{promotion.title}</h4>
                            <Badge
                              variant='outline'
                              className={`text-xs ${promotion.promotionType === 'Product'
                                ? 'border-blue-200 text-blue-700 bg-blue-50'
                                : 'border-purple-200 text-purple-700 bg-purple-50'
                                }`}
                            >
                              {promotion.promotionType === 'Product' ? 'Sản phẩm' : 'Toàn cửa hàng'}
                            </Badge>
                          </div>

                          <p className='text-xs text-gray-600 mb-2'>{promotion.description}</p>

                          <div className='space-y-1'>
                            <div className='flex items-center gap-2 text-xs'>
                              <span className='text-gray-600'>
                                {promotion.discountType === 'percentage'
                                  ? `Giảm ${promotion.discountValue}%`
                                  : `Giảm ${formatPrice(promotion.discountValue)}`}
                              </span>
                              <span className='font-semibold text-green-600'>
                                -{formatPrice(promotion.discountAmount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping Info */}
              <div className='grid grid-cols-2 gap-3'>
                <div className='bg-white rounded-lg p-3 shadow-sm border border-gray-100'>
                  <div className='flex items-center gap-2 mb-2'>
                    <MapPin className='h-4 w-4 text-green-600' />
                    <h3 className='font-semibold text-gray-900 text-sm'>Thông tin giao hàng</h3>
                  </div>
                  <div className='space-y-1'>
                    <p className='text-xs text-gray-600'>Người nhận</p>
                    <p className='font-medium text-gray-900 text-sm'>{order.toName}</p>
                    <p className='text-xs text-gray-600 mt-2'>Số điện thoại</p>
                    <p className='font-medium text-gray-900 text-sm'>{order.fromPhone || 'Không có'}</p>
                    <p className='text-xs text-gray-600 mt-2'>Địa chỉ giao hàng</p>
                    <p className='font-medium text-gray-900 text-sm'>{order.toAddress}</p>
                    {order.note && order.status !== 'Cancel' && order.status !== 'Returned' && (
                      <>
                        <p className='text-xs text-gray-600 mt-2'>Ghi chú</p>
                        <p className='font-medium text-gray-900 text-sm italic'>"{order.note}"</p>
                      </>
                    )}
                  </div>
                </div>

                <div className='bg-white rounded-lg p-3 shadow-sm border border-gray-100'>
                  <div className='flex items-center gap-2 mb-2'>
                    <CreditCard className='h-4 w-4 text-green-600' />
                    <h3 className='font-semibold text-gray-900 text-sm'>Thông tin giao dịch</h3>
                  </div>
                  <div className='space-y-1'>
                    <p className='text-xs text-gray-600'>Số thẻ</p>
                    <p className='font-medium text-gray-900 text-sm'>{order.fromPhone || '040324231'}</p>
                    <p className='text-xs text-gray-600 mt-2'>Phương thức thanh toán</p>
                    <p className='font-medium text-gray-900 text-sm'>{getPaymentTypeText(order.paymentType)}</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {order.orderHistories && order.orderHistories.length > 0 && (
                <div className='bg-white rounded-lg p-4 shadow-sm border border-gray-100'>
                  <div className='flex items-center gap-2 mb-4'>
                    <Clock className='h-4 w-4 text-green-600' />
                    <h3 className='font-semibold text-gray-900'>Hành trình từ quê nhà đến tay bạn</h3>
                  </div>

                  <div className='relative'>
                    {/* Timeline line */}
                    <div className='absolute left-5 top-8 bottom-8 w-0.5 bg-gray-300'></div>

                    <div className='space-y-6'>
                      {order.orderHistories.map((history, index) => {
                        const isCurrent = index === order.orderHistories.length - 1
                        const isCompleted = index < order.orderHistories.length - 1

                        return (
                          <div key={history.id} className='flex items-start gap-4 relative'>
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${isCurrent
                                ? 'bg-green-600'
                                : isCompleted
                                  ? 'bg-gray-400'
                                  : 'bg-white border-2 border-gray-300'
                                }`}
                            >
                              {isCurrent ? (
                                <Package className='h-5 w-5 text-white' />
                              ) : isCompleted ? (
                                <div className='w-3 h-3 rounded-full bg-white'></div>
                              ) : (
                                <div className='w-3 h-3 rounded-full bg-gray-300'></div>
                              )}
                            </div>
                            <div className='flex-1 pt-1'>
                              <p className={`font-medium text-sm ${isCurrent ? 'text-gray-900' : 'text-gray-600'}`}>
                                {history.description}
                              </p>
                              <p className='text-xs text-gray-500'>{history.time}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Images Display Section - Only for Delivered or Paid status */}
              {(order.status === 'Delivered' || order.status === 'Paid') && (
                <div className='bg-white rounded-lg p-4 shadow-sm border border-gray-100'>
                  <div className='flex items-center gap-2 mb-3'>
                    <ImageIcon className='h-4 w-4 text-green-600' />
                    <div className='flex-1'>
                      <h3 className='font-semibold text-gray-900'>
                        Ảnh xác minh giao hàng. Vui lòng kiểm tra kĩ trước khi nộp
                      </h3>
                      {order.deadlineVerificationAt && existingVerificationImages.length === 0 && (
                        <p className='text-xs text-orange-600 mt-1 font-medium'>
                          ⏰ Hạn upload: {order.deadlineVerificationAt}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Display verification images if available */}
                  {existingVerificationImages.length > 0 ? (
                    <div>
                      {/* Verification timestamp */}
                      {order.VerificationAt && (
                        <div className='mb-3 p-2 bg-green-50 rounded-lg border border-green-200'>
                          <div className='flex items-center gap-2'>
                            <CheckCircle className='h-4 w-4 text-green-600' />
                            <span className='text-xs text-gray-600'>Thời gian cập nhật:</span>
                            <span className='text-sm font-medium text-gray-900'>{order.VerificationAt}</span>
                          </div>
                        </div>
                      )}

                      {/* Existing Images - Read only, no delete button */}
                      <div>
                        <p className='text-sm font-medium text-gray-700 mb-2'>Ảnh đã upload:</p>
                        <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3'>
                          {existingVerificationImages.map((imageUrl, index) => (
                            <div key={index} className='relative'>
                              <img
                                src={imageUrl}
                                alt={`Xác minh ${index + 1}`}
                                className='w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity'
                                onClick={() => {
                                  const newWindow = window.open()
                                  if (newWindow) {
                                    newWindow.document.write(`
                                    <html>
                                      <head><title>Hình ảnh xác minh ${index + 1}</title></head>
                                      <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000;">
                                        <img src="${imageUrl}" style="max-width:100%;max-height:100vh;object-fit:contain;" />
                                      </body>
                                    </html>
                                  `)
                                  }
                                }}
                                onError={handleImageError}
                              />
                              {/* No delete button - images are read-only once uploaded */}
                            </div>
                          ))}
                        </div>
                        <div className='mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200'>
                          <p className='text-xs text-blue-700'>Ảnh đã được upload và không thể chỉnh sửa hoặc xóa.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className='p-6 text-center bg-gray-50 rounded-lg border border-gray-200 mb-4'>
                        <div className='flex flex-col items-center justify-center gap-2'>
                          <AlertCircle className='h-8 w-8 text-gray-400' />
                          <p className='text-sm font-medium text-gray-600'>Chưa cập nhật</p>
                          <p className='text-xs text-gray-500 mt-1'>Chưa có ảnh xác minh giao hàng</p>
                        </div>
                      </div>

                      {/* Upload Section - Only when no images exist */}
                      <div>
                        {/* New Image Previews */}
                        {verificationImagePreviews.length > 0 && (
                          <div className='mb-4'>
                            <p className='text-sm font-medium text-gray-700 mb-2'>
                              Ảnh mới (chưa upload): {verificationImages.length}/3
                            </p>
                            <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3'>
                              {verificationImagePreviews.map((preview, index) => (
                                <div key={index} className='relative group'>
                                  <img
                                    src={preview}
                                    alt={`Xác minh mới ${index + 1}`}
                                    className='w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity'
                                    onClick={() => {
                                      const newWindow = window.open()
                                      if (newWindow) {
                                        newWindow.document.write(`
                                    <html>
                                      <head><title>Hình ảnh xác minh mới ${index + 1}</title></head>
                                      <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000;">
                                        <img src="${preview}" style="max-width:100%;max-height:100vh;object-fit:contain;" />
                                      </body>
                                    </html>
                                  `)
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => handleRemoveVerificationImage(index)}
                                    className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors'
                                  >
                                    <X className='h-4 w-4' />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Upload Button */}
                        <div className='space-y-3'>
                          <label
                            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                              }`}
                            onDragEnter={handleDragEnter}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                          >
                            <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                              <Upload className={`w-8 h-8 mb-2 ${isDragging ? 'text-green-600' : 'text-gray-400'}`} />
                              <p
                                className={`mb-2 text-sm ${isDragging ? 'text-green-700 font-semibold' : 'text-gray-500'}`}
                              >
                                <span className='font-semibold'>Chọn ảnh</span> hoặc kéo thả vào đây
                              </p>
                              <p className='text-xs text-gray-500'>PNG, JPG, GIF (Tối đa 10MB mỗi ảnh, tối đa 3 ảnh)</p>
                            </div>
                            <input
                              type='file'
                              className='hidden'
                              accept='image/*'
                              multiple
                              onChange={handleVerificationImageSelect}
                            />
                          </label>

                          {verificationImages.length > 0 && (
                            <Button
                              onClick={handleUploadVerificationImages}
                              disabled={uploadVerificationLoading}
                              className='w-full bg-green-600 hover:bg-green-700 text-white'
                            >
                              {uploadVerificationLoading ? (
                                <>
                                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                                  Đang upload...
                                </>
                              ) : (
                                <>
                                  <Upload className='w-4 h-4 mr-2' />
                                  Upload ảnh xác minh
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Seller Action Buttons */}
              <div className='flex gap-3 pt-2'>
                {order.status === 'Processing' && (
                  <>
                    <Button
                      onClick={handleAcceptOrder}
                      disabled={actionLoading}
                      className='flex-1 bg-green-600 hover:bg-green-700 text-white'
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <CheckCircle className='w-4 h-4 mr-2' />
                          Chấp nhận đơn hàng
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowCancelDialog(true)}
                      disabled={actionLoading}
                      variant='outline'
                      className='flex-1 border-red-600 text-red-600 hover:bg-red-50'
                    >
                      <XCircle className='w-4 h-4 mr-2' />
                      Từ chối đơn hàng
                    </Button>
                  </>
                )}
                {order.status === 'Confirmed' && (
                  <Button
                    onClick={handleShipOrder}
                    disabled={actionLoading}
                    className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Package className='w-4 h-4 mr-2' />
                        Đã chuẩn bị hàng
                      </>
                    )}
                  </Button>
                )}
                {(order.status === 'Shipping' || order.status === 'Delivered') && (
                  <Button className='flex-1 bg-gray-600 hover:bg-gray-700 text-white' disabled>
                    Đơn hàng đã được xử lý
                  </Button>
                )}
                {(order.status === 'Cancel' || order.status === 'Returned') && (
                  <Button className='flex-1 bg-gray-600 hover:bg-gray-700 text-white' disabled>
                    Đơn hàng đã bị hủy
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>

      {/* Cancel Order Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className='max-w-md'>
          <div className='flex items-center gap-2 mb-4'>
            <XCircle className='h-5 w-5 text-red-600' />
            <h3 className='font-semibold text-gray-900'>Từ chối đơn hàng</h3>
          </div>

          <div className='space-y-4'>
            <div>
              <label className='text-sm font-medium text-gray-700 mb-2 block'>
                Lý do từ chối đơn hàng <span className='text-red-500'>*</span>
              </label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder='Nhập lý do từ chối đơn hàng...'
                className='min-h-[100px]'
                maxLength={200}
              />
              <p className='text-xs text-gray-500 mt-1'>{cancelReason.length}/200 ký tự</p>
            </div>

            <div className='flex gap-3 pt-2'>
              <Button
                onClick={() => setShowCancelDialog(false)}
                variant='outline'
                className='flex-1'
                disabled={actionLoading}
              >
                Hủy
              </Button>
              <Button
                onClick={handleCancelOrder}
                disabled={actionLoading || !cancelReason.trim()}
                className='flex-1 bg-red-600 hover:bg-red-700 text-white'
              >
                {actionLoading ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <XCircle className='w-4 h-4 mr-2' />
                    Xác nhận hủy
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ready to Pick Dialog */}
      <Dialog open={showShipDialog} onOpenChange={setShowShipDialog}>
        <DialogContent className='max-w-md'>
          <div className='flex items-center gap-2 mb-4'>
            <Package className='h-5 w-5 text-blue-600' />
            <h3 className='font-semibold text-gray-900'>Xác nhận sẵn sàng lấy hàng</h3>
          </div>

          <div className='space-y-4'>
            <div>
              <label className='text-sm font-medium text-gray-700 mb-2 block'>
                Mã GHN <span className='text-red-500'>*</span>
              </label>
              <Input
                value={ghnCode}
                onChange={(e) => setGhnCode(e.target.value)}
                placeholder='Nhập mã GHN...'
                className='w-full'
              />
              <p className='text-xs text-gray-500 mt-1'>Vui lòng nhập mã đơn hàng từ GHN</p>
            </div>

            <div className='flex gap-3 pt-2'>
              <Button
                onClick={() => {
                  setShowShipDialog(false)
                  setGhnCode('')
                }}
                variant='outline'
                className='flex-1'
                disabled={actionLoading}
              >
                Hủy
              </Button>
              <Button
                onClick={handleConfirmReadyToPick}
                disabled={actionLoading || !ghnCode.trim()}
                className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
              >
                {actionLoading ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Package className='w-4 h-4 mr-2' />
                    Xác nhận
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

export default OrderDetail
