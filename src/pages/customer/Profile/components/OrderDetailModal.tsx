import React, { useState, useEffect } from 'react'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog'
import { getOrderDetail } from '../../../../apis/order.api'
import type { Order as APIOrder } from '../../../../types/orderType'
import { Loader2, Package, MapPin, CreditCard, Clock, RefreshCw, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'

interface Product {
  id?: string
  name: string
  image: string
  quantity?: number | string
  price?: number
  variant?: string
}

interface Order {
  id: string
  date: string
  totalAmount?: number
  status: 'Đang giao' | 'Đã giao' | 'Đã hủy' | 'Chờ xác nhận' | 'Đã xác nhận'
  products: Product[]
  cancelReason?: string // Thêm field lý do hủy
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
  canConfirmReceived?: boolean
  showRefundRequest?: boolean
}

interface OrderDetailModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string | null
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ isOpen, onClose, orderId }) => {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Transform API order to UI order format
  const transformAPIOrderToUIOrder = (apiOrder: APIOrder): Order => {
    const getUIStatus = (apiStatus: string) => {
      switch (apiStatus) {
        case 'NotYet':
          return 'Chờ xác nhận' as const
        case 'Processing':
          return 'Đã xác nhận' as const
        case 'Shipping':
          return 'Đang giao' as const
        case 'Delivered':
          return 'Đã giao' as const
        case 'Cancel':
        case 'Returned':
          return 'Đã hủy' as const
        default:
          return 'Chờ xác nhận' as const
      }
    }

    const products = (apiOrder?.orderItems || []).map((item) => ({
      id: item?.id || '',
      name: item?.orderItemName || 'Sản phẩm không xác định',
      image: item?.orderItemImageUrl || '/src/assets/react.svg',
      quantity: (item?.quantity || 0).toString(),
      price: item?.finalPrice || 0,
      variant:
        item?.length && item?.width && item?.height && item?.weight
          ? `${item.length}x${item.width}x${item.height}cm, ${item.weight}kg`
          : undefined
    }))

    const formatDate = (dateString?: string) => {
      if (!dateString) return new Date().toLocaleDateString('vi-VN')
      try {
        return new Date(dateString).toLocaleDateString('vi-VN')
      } catch {
        return new Date().toLocaleDateString('vi-VN')
      }
    }

    const orderHistories = apiOrder?.orderHistories || []
    const firstHistory = orderHistories[0]

    return {
      id: apiOrder?.id || '',
      date: `Ngày đặt: ${formatDate(firstHistory?.time)}`,
      status: getUIStatus(apiOrder?.status || ''),
      products,
      totalAmount: apiOrder?.totalPrice || 0,
      cancelReason: apiOrder?.note || undefined, // Lấy lý do hủy từ field note
      canConfirmReceived: apiOrder?.status === 'Delivered',
      shippingInfo: {
        recipientName: apiOrder?.toName || '',
        phone: '', // API doesn't provide phone
        address: apiOrder?.toAddress || '',
        note: apiOrder?.note || undefined
      },
      transactionInfo: {
        orderId: apiOrder?.id || '',
        paymentDate: formatDate(firstHistory?.time),
        paymentMethod: apiOrder?.paymentType === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng'
      },
      timeline: orderHistories.map((history, index) => ({
        status: history?.description || 'Không có mô tả',
        date: formatDate(history?.time),
        isCompleted: true,
        isCurrent: index === orderHistories.length - 1
      }))
    }
  }

  // Fetch order details
  const fetchOrderDetail = async () => {
    if (!orderId) return

    setLoading(true)
    setError(null)

    try {
      const apiOrder = await getOrderDetail(orderId)
      const transformedOrder = transformAPIOrderToUIOrder(apiOrder)
      setOrder(transformedOrder)
    } catch (err) {
      console.error('Error fetching order detail:', err)
      setError('Không thể tải chi tiết đơn hàng')
      toast.error('Không thể tải chi tiết đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when modal opens or orderId changes
  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetail()
    }
  }, [isOpen, orderId])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setOrder(null)
      setError(null)
    }
  }, [isOpen])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đang giao':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Đã giao':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Đã hủy':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Chờ xác nhận':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Đã xác nhận':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    })
      .format(price)
      .replace('₫', 'đ')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-hidden flex flex-col'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Package className='h-5 w-5 text-green-600' />
            Chi tiết đơn hàng
          </DialogTitle>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto space-y-6'>
          {loading && (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-green-600' />
              <span className='ml-2 text-gray-600'>Đang tải chi tiết đơn hàng...</span>
            </div>
          )}

          {error && (
            <Card className='border-red-200 bg-red-50'>
              <CardContent className='pt-6'>
                <div className='flex items-center gap-2 text-red-600'>
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={fetchOrderDetail}
                  className='mt-3 text-red-600 border-red-600 hover:bg-red-50'
                >
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Thử lại
                </Button>
              </CardContent>
            </Card>
          )}

          {order && !loading && (
            <>
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center justify-between'>
                    <span>Thông tin đơn hàng</span>
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <p className='text-gray-600'>Mã đơn hàng</p>
                      <p className='font-semibold'>#{order.id}</p>
                    </div>
                    <div>
                      <p className='text-gray-600'>Ngày đặt</p>
                      <p className='font-semibold'>{order.date}</p>
                    </div>
                    <div className='col-span-2'>
                      <p className='text-gray-600'>Tổng giá trị</p>
                      <p className='text-xl font-bold text-green-600'>{formatPrice(order.totalAmount || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cancel Reason - Hiển thị khi đơn hàng bị hủy */}
              {order.status === 'Đã hủy' && order.cancelReason && (
                <Card className='border-red-200 bg-red-50'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-red-700'>
                      <AlertCircle className='h-5 w-5' />
                      Lý do hủy đơn hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-red-700 bg-white p-3 rounded border border-red-200'>{order.cancelReason}</p>
                  </CardContent>
                </Card>
              )}

              {/* Products */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Package className='h-5 w-5' />
                    Sản phẩm trong đơn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {order.products.map((product, index) => (
                      <div key={index} className='flex gap-4 p-4 bg-gray-50 rounded-lg'>
                        <img
                          src={product.image}
                          alt={product.name}
                          className='w-16 h-16 object-cover rounded-lg border'
                        />
                        <div className='flex-1'>
                          <h4 className='font-medium text-gray-900'>{product.name}</h4>
                          {product.variant && <p className='text-sm text-gray-600'>{product.variant}</p>}
                          <p className='text-sm text-gray-600'>Số lượng: {product.quantity}</p>
                        </div>
                        <div className='text-right'>
                          <p className='font-semibold text-gray-900'>{formatPrice(product.price || 0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Shipping & Payment Info */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <MapPin className='h-5 w-5' />
                      Thông tin giao hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2'>
                    <div>
                      <p className='font-medium'>{order.shippingInfo?.recipientName}</p>
                      {order.shippingInfo?.phone && <p className='text-gray-600'>{order.shippingInfo.phone}</p>}
                      <p className='text-gray-600'>{order.shippingInfo?.address}</p>
                      {order.shippingInfo?.note && <p className='text-gray-600 italic'>"{order.shippingInfo.note}"</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <CreditCard className='h-5 w-5' />
                      Thông tin thanh toán
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2'>
                    <div>
                      <p className='text-gray-600'>Mã giao dịch: #{order.transactionInfo?.orderId}</p>
                      <p className='text-gray-600'>Ngày thanh toán: {order.transactionInfo?.paymentDate}</p>
                      <p className='text-gray-600'>Phương thức: {order.transactionInfo?.paymentMethod}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline */}
              {order.timeline && order.timeline.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Clock className='h-5 w-5' />
                      Lịch sử đơn hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {order.timeline.map((step, index) => (
                        <div key={index} className='flex items-start gap-4'>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step.isCompleted
                              ? 'bg-green-100 text-green-600'
                              : step.isCurrent
                                ? 'bg-orange-100 text-orange-600'
                                : 'bg-gray-100 text-gray-400'
                              }`}
                          >
                            {step.isCompleted ? '✓' : step.isCurrent ? '○' : '○'}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p
                              className={`font-medium ${step.isCompleted || step.isCurrent ? 'text-gray-900' : 'text-gray-400'
                                }`}
                            >
                              {step.status}
                            </p>
                            {step.date && <p className='text-sm text-gray-500'>{step.date}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className='flex gap-3 pt-4 border-t'>
                <Button variant='outline' className='flex-1 text-orange-600 border-orange-600 hover:bg-orange-50'>
                  đánh giá
                </Button>
                <Button className='flex-1 bg-green-600 hover:bg-green-700 text-white'>Tái đặt hàng</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default OrderDetailModal
