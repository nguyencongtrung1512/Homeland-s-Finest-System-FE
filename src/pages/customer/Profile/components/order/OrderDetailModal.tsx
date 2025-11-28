import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../../../../../components/ui/button'
import { Badge } from '../../../../../components/ui/badge'
import { Card, CardContent } from '../../../../../components/ui/card'
import { Dialog, DialogContent } from '../../../../../components/ui/dialog'
import { getOrderDetail } from '../../../../../apis/order.api'
import { storeApi } from '../../../../../apis/store.api'
import type { StoreResponse } from '../../../../../apis/store.api'
import { Loader2, Package, MapPin, CreditCard, Clock, RefreshCw, AlertCircle, Gift, Store } from 'lucide-react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { path } from '../../../../../constants/path'
import { formatDate } from '../../../../../utils/formatDate'

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

interface OrderDetailModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string | null
}
const DEFAULT_PRODUCT_IMAGE = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ isOpen, onClose, orderId }) => {
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [store, setStore] = useState<StoreResponse | null>(null)
  const [storeLoading, setStoreLoading] = useState(false)
  const [storeError, setStoreError] = useState<string | null>(null)

  // Transform API order to UI order format
  const transformAPIOrderToUIOrder = (apiOrder: any): Order => {
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
      isFreeship: apiOrder?.isFreeship || false,
      note: apiOrder?.note || undefined,
      orderItems: (apiOrder?.orderItems || []).map((item: any) => ({
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
      orderItemsWithCombo: (apiOrder?.orderItemsWithCombo || []).map((item: any) => ({
        id: item?.id || '',
        comboItemId: item?.comboItemId,
        comboId: item?.comboId,
        comboName: item?.comboName,
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
      orderHistories: apiOrder?.orderHistories || [],
      orderPromotions: (apiOrder?.orderPromotions || []).map((promo: any) => ({
        promotionType: promo?.promotionType || '',
        title: promo?.title || '',
        description: promo?.description || '',
        discountType: promo?.discountType || '',
        discountValue: promo?.discountValue || 0,
        discountAmount: promo?.discountAmount || 0
      }))
    }
  }

  // Fetch store details
  const fetchStoreDetail = useCallback(async (storeId: string) => {
    if (!storeId) return

    setStoreLoading(true)
    setStoreError(null)

    try {
      const storeResponse = await storeApi.getStoreById(storeId)
      setStore(storeResponse.data)
    } catch (err) {
      console.error('Error fetching store detail:', err)
      setStoreError('Không thể tải thông tin cửa hàng')
      // Don't show toast error for store as it's not critical
    } finally {
      setStoreLoading(false)
    }
  }, [])

  // Fetch order details
  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) return

    setLoading(true)
    setError(null)

    try {
      const apiOrder = await getOrderDetail(orderId)
      const transformedOrder = transformAPIOrderToUIOrder(apiOrder)
      setOrder(transformedOrder)

      if (apiOrder?.storeId) {
        await fetchStoreDetail(apiOrder.storeId)
      }
    } catch (err) {
      console.error('Error fetching order detail:', err)
      setError('Không thể tải chi tiết đơn hàng')
      toast.error('Không thể tải chi tiết đơn hàng')
    } finally {
      setLoading(false)
    }
  }, [orderId, fetchStoreDetail])

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
      setStore(null)
      setStoreError(null)
    }
  }, [isOpen])

  const getStatusText = (status: string) => {
    const statusTextMap: Record<string, string> = {
      NotYet: 'Chưa xác nhận',
      Processing: 'Chờ xác nhận',
      Confirmed: 'Đã xác nhận',
      ReadyToPick: 'Đang chuẩn bị hàng',
      Picking: 'Đang trên đường lấy hàng',
      Picked: 'Shipper đã lấy hàng',
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
      Paid: 'Đã giao hàng thành công',
      Exception: 'Gặp sự cố',
      Damaged: 'Hàng hư hỏng',
      Lost: 'Thất lạc'
    }
    return statusTextMap[status] || status
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ'
  }

  // Handle navigation to store detail page
  const handleStoreClick = (storeId: string) => {
    const storeDetailPath = path.store.replace(':storeId', storeId)
    navigate(storeDetailPath)
    onClose() // Close the modal after navigation
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
                    <p className='font-bold text-gray-900'>#{order.id}</p>
                    {/* Store Name */}
                    <div className='mt-2'>
                      <p className='text-xs text-gray-600'>Cửa hàng</p>
                      {storeLoading ? (
                        <div className='flex items-center gap-2'>
                          <Loader2 className='h-3 w-3 animate-spin text-gray-400' />
                          <p className='text-sm text-gray-500'>Đang tải...</p>
                        </div>
                      ) : storeError ? (
                        <p className='text-sm text-gray-500'>Không tải được thông tin cửa hàng</p>
                      ) : store ? (
                        <button
                          onClick={() => handleStoreClick(store.id)}
                          className='flex items-center gap-1 font-medium text-green-600 hover:text-green-700 text-sm cursor-pointer transition-colors duration-200 hover:underline'
                          title='Xem chi tiết cửa hàng'
                        >
                          <Store className='h-3 w-3' />
                          {store.storeName}
                        </button>
                      ) : (
                        <p className='text-sm text-gray-500'>Không có thông tin cửa hàng</p>
                      )}
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='text-xs text-gray-600'>Ngày đặt</p>
                    <p className='font-medium text-gray-900 text-sm'>{formatDate(order.createdAt)}</p>
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
                    <span className='font-semibold text-sm'>Lý do hủy đơn hàng</span>
                  </div>
                  <p className='text-red-700 text-sm'>{order.note}</p>
                </div>
              )}

              {/* Products Section */}
              <div className='bg-white rounded-lg p-4 shadow-sm border border-gray-100'>
                <div className='flex items-center gap-2 mb-3'>
                  <Package className='h-4 w-4 text-green-600' />
                  <h3 className='font-semibold text-gray-900'>Sản phẩm trong đơn</h3>
                </div>

                <div className='space-y-3'>
                  {/* Combo Products */}
                  {comboGroups &&
                    Object.entries(comboGroups).map(([comboId, group]) => (
                      <div key={comboId} className='border-l-4 border-amber-500 pl-3'>
                        {group.comboName && (
                          <div className='flex items-center justify-between mb-2'>
                            <div className='flex items-center gap-2'>
                              <span className='text-xs text-gray-600'>Combo:</span>
                              <span className='text-xs font-semibold text-amber-800'>{group.comboName}</span>
                            </div>
                            <span className='text-sm font-semibold text-amber-800'>
                              {formatPrice(group.totalPrice)}
                            </span>
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

                              <p className='text-xs text-gray-600'>Số lượng: {item.quantity}</p>
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
                          <img src='/src/assets/tinhhoa.svg' alt='Tinh Hoa Logo' className='w-8 h-8' />
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
                    {order.isFreeship && (
                      <Badge className='bg-green-100 text-green-700 border-0 text-xs ml-auto'>Miễn phí ship</Badge>
                    )}
                  </div>
                  <div className='space-y-1'>
                    <p className='text-xs text-gray-600'>Người nhận</p>
                    <p className='font-medium text-gray-900 text-sm'>{order.toName}</p>
                    <p className='text-xs text-gray-600 mt-2'>Số điện thoại</p>
                    <p className='font-medium text-gray-900 text-sm'>{order.fromPhone || 'N/A'}</p>
                    <p className='text-xs text-gray-600 mt-2'>Địa chỉ giao hàng</p>
                    <p className='font-medium text-gray-900 text-sm'>{order.toAddress}</p>
                    <p className='text-xs text-gray-600 mt-2'>Phí vận chuyển</p>
                    <p className='font-medium text-gray-900 text-sm'>
                      {order.isFreeship ? (
                        <span className='text-green-600'>Miễn phí</span>
                      ) : (
                        formatPrice(order.shipPrice)
                      )}
                    </p>
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
                    <h3 className='font-semibold text-gray-900 text-sm'>Phương thức thanh toán</h3>
                  </div>
                  <div className='space-y-1'>
                    <p className='font-medium text-gray-900 text-sm'>
                      {order.paymentType === 'COD' ? 'Thanh toán khi nhận' : order.paymentType}
                    </p>
                    <p className='text-xs text-gray-600 mt-2'>Thời gian thanh toán</p>
                    <p className='font-medium text-gray-900 text-sm'>{formatDate(order.createdAt)}</p>
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
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default OrderDetailModal
