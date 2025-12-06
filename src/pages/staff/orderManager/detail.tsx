import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent } from '../../../components/ui/card'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '../../../components/ui/breadcrumb'
import { getOrderDetail } from '../../../apis/order.api'
import type { Order as APIOrder } from '../../../types/orderType'
import { Loader2, Package, MapPin, CreditCard, Clock, RefreshCw, AlertCircle, Gift, CheckCircle } from 'lucide-react'
import { toast } from '../../../utils/toast'
import { formatDate } from '../../../utils/formatDate'
import { PAYMENT_METHOD_NAMES } from '../../../types/orderType'

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
  fromName?: string
  fromAddress?: string
  paymentType: string
  totalOrder: number
  totalDiscount: number
  shipPrice: number
  finalPrice: number
  isFreeship?: boolean
  note?: string
  orderItems: OrderItem[]
  orderItemsWithCombo: OrderItemWithCombo[]
  orderHistories: Array<{
    id: string
    description: string
    time: string
  }>
  orderPromotions: OrderPromotion[]
}

const DEFAULT_PRODUCT_IMAGE = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'

// Status text mapping
const statusTextMap: Record<string, string> = {
  NotYet: 'Chưa xử lí',
  Processing: 'Chờ xác nhận',
  PendingPayment: 'Chờ thanh toán',
  Confirmed: 'Đã xác nhận',
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
  Lost: 'Thất lạc',
  Cancel: 'Đã hủy'
}

// Status badge color mapping
const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'NotYet':
    case 'Processing':
    case 'PendingPayment':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-100'
    case 'Confirmed':
    case 'ReadyToPick':
    case 'Picking':
    case 'Picked':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
    case 'Storing':
    case 'Transporting':
    case 'Sorting':
    case 'Delivering':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-100'
    case 'Delivered':
    case 'Paid':
      return 'bg-green-100 text-green-800 hover:bg-green-100'
    case 'Cancel':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    case 'Returning':
    case 'Returned':
    case 'Refunded':
    case 'DeliveryFail':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
    case 'Exception':
    case 'Damaged':
    case 'Lost':
    case 'Complaining':
    case 'Complained':
      return 'bg-red-100 text-red-800 hover:bg-red-100'
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
  }
}

function OrderDetailStaff() {
  const { id: orderId } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      fromName: apiOrder?.fromName || '',
      fromAddress: apiOrder?.fromAddress || '',
      paymentType: apiOrder?.paymentType || '',
      totalOrder: apiOrder?.totalOrder || 0,
      totalDiscount: apiOrder?.totalDiscount || 0,
      shipPrice: apiOrder?.shipPrice || 0,
      finalPrice: apiOrder?.finalPrice || 0,
      isFreeship: apiOrder?.isFreeship || false,
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
      }))
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
    } catch (err) {
      console.error('Error fetching order detail:', err)
      setError('Không thể tải chi tiết đơn hàng')
      toast.error('Không thể tải chi tiết đơn hàng')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrderDetail()
  }, [fetchOrderDetail])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫'
  }

  const getStatusText = (status: string) => {
    return statusTextMap[status] || 'Chưa xác định'
  }

  const getPaymentTypeText = (paymentType: string) => {
    return PAYMENT_METHOD_NAMES[paymentType as keyof typeof PAYMENT_METHOD_NAMES] || paymentType
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

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Breadcrumb */}
      <div className='mb-4'>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={'/staff/orders'}>Quản lý đơn hàng</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Chi tiết đơn hàng</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {loading ? (
        <div className='flex items-center justify-center py-16'>
          <Loader2 className='h-8 w-8 animate-spin text-green-600' />
          <span className='ml-2 text-gray-600'>Đang tải...</span>
        </div>
      ) : error ? (
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
      ) : order ? (
        <div className='space-y-4'>
          {/* Order Info Card */}
          <Card>
            <CardContent className='pt-6'>
              <div className='flex justify-between items-start mb-4'>
                <div>
                  <p className='text-xs text-gray-600 mb-1'>Mã đơn hàng</p>
                  <p className='font-bold text-gray-900 text-lg'>#{order.id}</p>
                  {order.ghnorderCode && <p className='text-sm text-gray-600 mt-1'>Mã GHN: {order.ghnorderCode}</p>}
                </div>
                <div className='text-right'>
                  <p className='text-xs text-gray-600 mb-1'>Ngày đặt</p>
                  <p className='font-medium text-gray-900'>{formatDate(order.createdAt)}</p>
                </div>
              </div>
              <div className='flex justify-between items-start pt-4 border-t'>
                <div>
                  <p className='text-xs text-gray-600 mb-1'>Tổng giá trị</p>
                  <p className='font-bold text-green-600 text-xl'>{formatPrice(order.finalPrice)}</p>
                </div>
                <div className='text-right'>
                  <p className='text-xs text-gray-600 mb-1'>Trạng thái</p>
                  <Badge className={getStatusBadgeColor(order.status)}>{getStatusText(order.status)}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cancel Reason */}
          {(order.status === 'Cancel' || order.status === 'Returned') && order.note && (
            <Card className='border-red-200 bg-red-50'>
              <CardContent className='pt-6'>
                <div className='flex items-center gap-2 text-red-700 mb-2'>
                  <AlertCircle className='h-4 w-4' />
                  <span className='font-semibold text-sm'>Lý do từ chối đơn hàng</span>
                </div>
                <p className='text-red-700 text-sm'>{order.note}</p>
              </CardContent>
            </Card>
          )}

          {/* Order Note */}
          {order.note && order.status !== 'Cancel' && order.status !== 'Returned' && (
            <Card className='border-gray-200 bg-gray-50'>
              <CardContent className='pt-6'>
                <div className='flex items-center gap-2 text-gray-700 mb-2'>
                  <AlertCircle className='h-4 w-4' />
                  <span className='font-semibold text-sm'>Ghi chú đơn hàng</span>
                </div>
                <p className='text-gray-700 text-sm whitespace-pre-wrap'>{order.note}</p>
              </CardContent>
            </Card>
          )}

          {/* Products Section */}
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-2 mb-4'>
                <Package className='h-5 w-5 text-green-600' />
                <h3 className='font-semibold text-gray-900 text-lg'>Sản phẩm trong đơn</h3>
              </div>

              <div className='space-y-4'>
                {/* Combo Products */}
                {comboGroups &&
                  Object.entries(comboGroups).map(([comboId, group]) => (
                    <div key={comboId} className='border-l-4 border-amber-500 pl-4'>
                      {group.comboName && (
                        <div className='flex items-center gap-2 mb-3'>
                          <span className='text-sm text-gray-600'>Combo:</span>
                          <span className='text-sm font-semibold text-amber-800'>{group.comboName}</span>
                        </div>
                      )}
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className='flex gap-4 mb-3 last:mb-0 bg-amber-50/50 rounded-lg p-3 border border-amber-100'
                        >
                          <img
                            src={item.orderItemImageUrl || DEFAULT_PRODUCT_IMAGE}
                            alt={item.orderItemName}
                            className='w-20 h-20 object-cover rounded-lg border-2 border-amber-300'
                            onError={handleImageError}
                          />
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2 mb-1'>
                              <h4 className='font-medium text-gray-900'>{item.orderItemName}</h4>
                            </div>
                            {group.comboName && (
                              <p className='text-xs text-amber-600 font-medium mb-1'>{group.comboName}</p>
                            )}
                            <p className='text-sm text-gray-600'>Số lượng: {item.quantity}</p>
                            {item.length && item.width && item.height && item.weight && (
                              <p className='text-xs text-gray-500 mt-1'>
                                Kích thước: {item.length} x {item.width} x {item.height} cm - {item.weight} kg
                              </p>
                            )}
                          </div>
                          <div className='text-right'>
                            <p className='font-semibold text-gray-900'>{formatPrice(item.totalPrice)}</p>
                            {item.finalPrice && (
                              <p className='text-xs text-gray-500 line-through'>
                                {formatPrice(item.finalPrice * item.quantity)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

                {/* Regular Products */}
                {order.orderItems.map((item) => (
                  <div key={item.id} className='flex gap-4 bg-white rounded-lg p-3 border border-gray-200'>
                    <img
                      src={item.orderItemImageUrl || DEFAULT_PRODUCT_IMAGE}
                      alt={item.orderItemName}
                      className='w-20 h-20 object-cover rounded-lg border border-gray-200'
                      onError={handleImageError}
                    />
                    <div className='flex-1 min-w-0'>
                      <h4 className='font-medium text-gray-900 mb-1'>{item.orderItemName}</h4>
                      <p className='text-sm text-gray-600 mb-1'>Số lượng: {item.quantity}</p>
                      {item.length && item.width && item.height && item.weight && (
                        <p className='text-xs text-gray-500'>
                          Kích thước: {item.length} x {item.width} x {item.height} cm - {item.weight} kg
                        </p>
                      )}
                    </div>
                    <div className='text-right'>
                      <p className='font-semibold text-gray-900'>{formatPrice(item.totalPrice)}</p>
                      {item.finalPrice && (
                        <p className='text-xs text-gray-500 line-through'>
                          {formatPrice(item.finalPrice * item.quantity)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Promotions Section */}
          {order.orderPromotions && order.orderPromotions.length > 0 && (
            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center gap-2 mb-4'>
                  <Gift className='h-5 w-5 text-green-600' />
                  <h3 className='font-semibold text-gray-900 text-lg'>Khuyến mãi đã áp dụng</h3>
                </div>

                <div className='space-y-3'>
                  {order.orderPromotions.map((promotion, index) => (
                    <div
                      key={promotion.promotionType + index}
                      className='flex items-center gap-4 p-4 border border-green-200 rounded-lg bg-green-50'
                    >
                      <div className='w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                        <Gift className='w-8 h-8 text-green-600' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-2'>
                          <h4 className='font-semibold text-gray-900'>{promotion.title}</h4>
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
                        <p className='text-sm text-gray-600 mb-2'>{promotion.description}</p>
                        <div className='flex items-center gap-2 text-sm'>
                          <span className='text-gray-600'>
                            {promotion.discountType === 'percentage'
                              ? `Giảm ${promotion.discountValue}%`
                              : `Giảm ${formatPrice(promotion.discountValue)}`}
                          </span>
                          <span className='font-semibold text-green-600'>-{formatPrice(promotion.discountAmount)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shipping and Payment Info */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center gap-2 mb-4'>
                  <MapPin className='h-5 w-5 text-green-600' />
                  <h3 className='font-semibold text-gray-900'>Thông tin giao hàng</h3>
                </div>
                <div className='space-y-3'>
                  <div>
                    <p className='text-xs text-gray-600 mb-1'>Người nhận</p>
                    <p className='font-medium text-gray-900'>{order.toName}</p>
                  </div>
                  {order.fromPhone && (
                    <div>
                      <p className='text-xs text-gray-600 mb-1'>Số điện thoại</p>
                      <p className='font-medium text-gray-900'>{order.fromPhone}</p>
                    </div>
                  )}
                  <div>
                    <p className='text-xs text-gray-600 mb-1'>Địa chỉ giao hàng</p>
                    <p className='font-medium text-gray-900'>{order.toAddress}</p>
                  </div>
                  {order.fromName && order.fromAddress && (
                    <>
                      <div className='pt-3 border-t'>
                        <p className='text-xs text-gray-600 mb-1'>Người gửi</p>
                        <p className='font-medium text-gray-900'>{order.fromName}</p>
                      </div>
                      <div>
                        <p className='text-xs text-gray-600 mb-1'>Địa chỉ người gửi</p>
                        <p className='font-medium text-gray-900'>{order.fromAddress}</p>
                      </div>
                    </>
                  )}
                  {order.note && order.status !== 'Cancel' && order.status !== 'Returned' && (
                    <div>
                      <p className='text-xs text-gray-600 mb-1'>Ghi chú</p>
                      <p className='font-medium text-gray-900 text-sm italic'>"{order.note}"</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center gap-2 mb-4'>
                  <CreditCard className='h-5 w-5 text-green-600' />
                  <h3 className='font-semibold text-gray-900'>Thông tin thanh toán</h3>
                </div>
                <div className='space-y-3'>
                  <div>
                    <p className='text-xs text-gray-600 mb-1'>Tổng tiền hàng</p>
                    <p className='font-medium text-gray-900'>{formatPrice(order.totalOrder)}</p>
                  </div>
                  {order.totalDiscount > 0 && (
                    <div>
                      <p className='text-xs text-gray-600 mb-1'>Giảm giá</p>
                      <p className='font-medium text-green-600'>-{formatPrice(order.totalDiscount)}</p>
                    </div>
                  )}
                  <div>
                    <p className='text-xs text-gray-600 mb-1'>Phí vận chuyển</p>
                    <p className='font-medium text-gray-900'>
                      {order.isFreeship ? (
                        <span className='text-green-600'>Miễn phí</span>
                      ) : (
                        formatPrice(order.shipPrice)
                      )}
                    </p>
                  </div>
                  <div className='pt-3 border-t'>
                    <p className='text-xs text-gray-600 mb-1'>Phương thức thanh toán</p>
                    <p className='font-medium text-gray-900'>{getPaymentTypeText(order.paymentType)}</p>
                  </div>
                  <div className='pt-3 border-t'>
                    <p className='text-xs text-gray-600 mb-1'>Tổng thanh toán</p>
                    <p className='font-bold text-green-600 text-lg'>{formatPrice(order.finalPrice)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          {order.orderHistories && order.orderHistories.length > 0 && (
            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center gap-2 mb-4'>
                  <Clock className='h-5 w-5 text-green-600' />
                  <h3 className='font-semibold text-gray-900'>Lịch sử đơn hàng</h3>
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
                            {isCurrent || isCompleted ? (
                              <CheckCircle className='h-5 w-5 text-white' />
                            ) : (
                              <Clock className='h-5 w-5 text-gray-400' />
                            )}
                          </div>
                          <div className='flex-1 pb-6'>
                            <p className='font-medium text-gray-900 mb-1'>{history.description}</p>
                            <p className='text-sm text-gray-600'>{formatDate(history.time)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default OrderDetailStaff
