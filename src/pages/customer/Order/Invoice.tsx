import { Button } from '../../../components/ui/button'
import { CheckCircle, XCircle, CreditCard, BadgeCheck, Loader2, ChevronDown, Package, Truck, ShoppingBag, Calendar } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getOrderDetail } from '../../../apis/order.api'
import type { Order } from '../../../types/orderType'
import { toast } from 'react-toastify'

function Invoice() {
  const location = useLocation()
  const navigate = useNavigate()

  const [order, setOrder] = useState<Order | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  
  const params = new URLSearchParams(location.search)
  const status = params.get('status') === 'fail' ? 'fail' : 'success'
  const orderId = params.get('orderId')
  const multiple = params.get('multiple') === 'true'

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId) {
        setError('Không tìm thấy mã đơn hàng')
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        if (multiple) {
          const orderIds = orderId.split(',').filter((id) => id.trim())

          if (orderIds.length === 0) {
            setError('Không tìm thấy danh sách đơn hàng')
            return
          }

          const orderPromises = orderIds.map((orderId) => getOrderDetail(orderId))
          const orderDetails = await Promise.all(orderPromises)
          const flattenedOrders = orderDetails.flat()
          
          setOrders(flattenedOrders)
          setOrder(flattenedOrders[0])
        } else {
          const orderData = await getOrderDetail(orderId)
          const singleOrder = Array.isArray(orderData) ? orderData[0] : orderData
          setOrder(singleOrder)
          setOrders([singleOrder])
        }
      } catch (err) {
        console.error('Error fetching order data:', err)
        setError('Không thể tải thông tin đơn hàng')
        toast.error('Không thể tải thông tin đơn hàng')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderData()
  }, [orderId, multiple])

  const toggleOrder = (orderId: string) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      const [, date] = dateString.split(' ')
      const [day, month, year] = date.split('-')
      return `${day}/${month}/${year}`
    } catch {
      return dateString
    }
  }

  const getPaymentMethodText = (paymentType: string) => {
    switch (paymentType) {
      case 'COD': return 'COD'
      case 'VNPay': return 'VNPay'
      case 'Momo': return 'Momo'
      case 'Banking': return 'Chuyển khoản'
      default: return paymentType
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NotYet': return 'Chờ xử lý'
      case 'Processing': return 'Đang xử lý'
      case 'Shipping': return 'Đang giao'
      case 'Delivered': return 'Đã giao'
      case 'Cancel': return 'Đã hủy'
      case 'Returned': return 'Đã trả'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processing': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'Shipping': return 'bg-amber-100 text-amber-700 border-amber-300'
      case 'Delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-300'
      case 'Cancel': return 'bg-red-100 text-red-700 border-red-300'
      case 'NotYet': return 'bg-gray-100 text-gray-700 border-gray-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const calculateTotals = () => {
    const totalOrder = orders.reduce((sum, order) => sum + (order.totalOrder || 0), 0)
    const totalShipPrice = orders.reduce((sum, order) => sum + (order.shipPrice || 0), 0)
    const totalDiscount = orders.reduce((sum, order) => sum + (order.totalDiscount || 0), 0)
    const totalFinalPrice = orders.reduce((sum, order) => sum + (order.finalPrice || 0), 0)
    return { totalOrder, totalShipPrice, totalDiscount, totalFinalPrice }
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50'>
        <div className='text-center space-y-4'>
          <Loader2 className='w-12 h-12 animate-spin text-green-600 mx-auto' />
          <p className='text-gray-600 font-medium'>Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4'>
        <div className='w-full max-w-md'>
          <div className='bg-white rounded-2xl shadow-xl border border-red-200 p-8 text-center space-y-4'>
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto'>
              <XCircle className='w-9 h-9 text-red-600' />
            </div>
            <h2 className='text-2xl font-bold text-gray-900'>Lỗi</h2>
            <p className='text-gray-600'>{error || 'Không tìm thấy thông tin đơn hàng'}</p>
            <Button 
              onClick={() => navigate('/profile?tab=orders')} 
              className='w-full bg-green-600 hover:bg-green-700'
            >
              Quay lại danh sách đơn hàng
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-12 px-4'>
      <div className='max-w-5xl mx-auto space-y-8'>
        
        {/* Success/Fail Status Header */}
        <div className='relative overflow-hidden'>
          {status === 'success' ? (
            <div className='bg-white rounded-3xl shadow-2xl border-2 border-green-300 p-10 relative'>
              <div className='absolute -top-20 -right-20 w-40 h-40 bg-green-200/30 rounded-full blur-3xl' />
              <div className='absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-200/30 rounded-full blur-3xl' />
              <div className='relative z-10 text-center space-y-4'>
                <div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg'>
                  <BadgeCheck className='w-11 h-11 text-white' />
                </div>
                <h1 className='text-4xl font-bold text-gray-900'>Đặt hàng thành công!</h1>
                <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
                  Cảm ơn bạn đã tin tưởng Tinh Hoa Quê Nhà. Đơn hàng đang được xử lý.
                </p>
              </div>
            </div>
          ) : (
            <div className='bg-white rounded-3xl shadow-2xl border-2 border-red-300 p-10'>
              <div className='text-center space-y-4'>
                <div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl shadow-lg'>
                  <XCircle className='w-11 h-11 text-white' />
                </div>
                <h1 className='text-4xl font-bold text-gray-900'>Thanh toán thất bại</h1>
                <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
                  Đã có lỗi xảy ra. Vui lòng thử lại hoặc chọn phương thức khác.
                </p>
                <Button 
                  className='mt-4 bg-green-600 hover:bg-green-700' 
                  onClick={() => navigate('/cart/confirm')}
                >
                  Quay lại thanh toán
                </Button>
              </div>
            </div>
          )}
        </div>

        {status === 'success' && (
          <>
            {/* Summary Card - Multiple Orders */}
            {orders.length > 1 && (
              <div className='bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 rounded-3xl shadow-xl p-8 text-white'>
                <div className='flex items-center gap-4 mb-6'>
                  <div className='w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center'>
                    <ShoppingBag className='w-7 h-7' />
                  </div>
                  <div>
                    <h2 className='text-2xl font-bold'>Tổng kết đơn hàng</h2>
                    <p className='text-green-100'>{orders.length} đơn từ các cửa hàng khác nhau</p>
                  </div>
                </div>
                
                <div className='bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-3'>
                  <div className='flex justify-between text-green-50'>
                    <span>Tạm tính ({orders.length} đơn)</span>
                    <span className='font-semibold text-white'>{calculateTotals().totalOrder.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className='flex justify-between text-green-50'>
                    <span>Phí vận chuyển</span>
                    <span className='font-semibold text-white'>{calculateTotals().totalShipPrice.toLocaleString('vi-VN')}₫</span>
                  </div>
                  {calculateTotals().totalDiscount > 0 && (
                    <div className='flex justify-between text-yellow-200'>
                      <span>Giảm giá</span>
                      <span className='font-bold'>-{calculateTotals().totalDiscount.toLocaleString('vi-VN')}₫</span>
                    </div>
                  )}
                  <div className='border-t border-white/20 pt-3 mt-2'>
                    <div className='flex justify-between items-center'>
                      <span className='text-xl font-bold'>Tổng thanh toán</span>
                      <span className='text-3xl font-bold'>{calculateTotals().totalFinalPrice.toLocaleString('vi-VN')}₫</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Cards with Accordion */}
            <div className='space-y-4'>
              {orders.map((orderItem, index) => (
                <div 
                  key={orderItem.id} 
                  className='bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300'
                >
                  {/* Order Header - Always Visible */}
                  <button
                    onClick={() => toggleOrder(orderItem.id)}
                    className='w-full p-6 text-left hover:bg-gray-50 transition-colors'
                  >
                    <div className='flex items-start justify-between gap-4 mb-4'>
                      <div className='flex items-center gap-3 flex-1 min-w-0'>
                        <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md'>
                          <span className='text-white font-bold'>{index + 1}</span>
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='font-bold text-gray-900 text-lg truncate'>
                            #{orderItem.ghnorderCode || orderItem.id.slice(-8)}
                          </div>
                          <div className='flex items-center gap-2 text-sm text-gray-500 mt-1'>
                            <Calendar className='w-4 h-4' />
                            <span>{formatDate(orderItem.orderHistories?.[0]?.time)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className='flex items-center gap-3 flex-shrink-0'>
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(orderItem.status || '')}`}>
                          {getStatusText(orderItem.status || '')}
                        </span>
                        <ChevronDown 
                          className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${expandedOrders.has(orderItem.id) ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>

                    {/* Quick Info - Always Visible */}
                    <div className='flex items-center justify-between gap-4 flex-wrap'>
                      <div className='flex items-center gap-3 text-sm'>
                        <div className='flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg'>
                          <CreditCard className='w-4 h-4 text-gray-600' />
                          <span className='font-medium text-gray-700'>{getPaymentMethodText(orderItem.paymentType || '')}</span>
                        </div>
                        <div className='flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg'>
                          <Package className='w-4 h-4 text-gray-600' />
                          <span className='font-medium text-gray-700'>{orderItem.orderItems.length} sản phẩm</span>
                        </div>
                      </div>
                      <div className='text-2xl font-bold text-green-600'>
                        {(orderItem.finalPrice || 0).toLocaleString('vi-VN')}₫
                      </div>
                    </div>
                  </button>

                  {/* Collapsible Content */}
                  {expandedOrders.has(orderItem.id) && (
                    <div className='border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 space-y-6'>
                      
                      {/* Shipping Info */}
                      <div className='bg-white rounded-xl p-5 border border-gray-200 shadow-sm'>
                        <div className='flex items-start gap-4'>
                          <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                            <Truck className='w-6 h-6 text-blue-600' />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <h3 className='font-semibold text-gray-900 mb-2'>Thông tin giao hàng</h3>
                            <div className='space-y-1 text-sm text-gray-600'>
                              <p><span className='font-medium text-gray-900'>Người nhận:</span> {orderItem.toName}</p>
                              <p><span className='font-medium text-gray-900'>Địa chỉ:</span> {orderItem.toAddress}</p>
                              <p className='text-xs text-gray-500 mt-2'>📍 Từ: {orderItem.fromName}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Products */}
                      <div>
                        <h3 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                          <Package className='w-5 h-5 text-green-600' />
                          Sản phẩm ({orderItem.orderItems.length})
                        </h3>
                        <div className='space-y-3'>
                          {orderItem.orderItems.map((item, idx) => (
                            <div key={idx} className='flex gap-4 bg-white rounded-xl p-4 border border-gray-200 hover:border-green-300 transition-colors'>
                              <img
                                src={item.orderItemImageUrl}
                                alt={item.orderItemName}
                                className='w-20 h-20 rounded-lg object-cover border border-gray-200 flex-shrink-0'
                              />
                              <div className='flex-1 min-w-0'>
                                <p className='font-medium text-gray-900 mb-2 line-clamp-2'>{item.orderItemName}</p>
                                <div className='flex items-center gap-3 text-sm'>
                                  <span className='bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium'>
                                    x{item.quantity}
                                  </span>
                                  {item.basePrice && item.finalPrice && item.basePrice !== item.finalPrice && (
                                    <span className='text-red-500 line-through'>
                                      {item.basePrice.toLocaleString('vi-VN')}₫
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className='text-right flex-shrink-0'>
                                <p className='font-bold text-green-600 text-lg'>
                                  {(item.totalPrice || 0).toLocaleString('vi-VN')}₫
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Promotions */}
                      {orderItem.orderPromotions && orderItem.orderPromotions.length > 0 && (
                        <div className='bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200'>
                          <div className='flex items-center gap-2 mb-3'>
                            <CheckCircle className='w-5 h-5 text-green-600' />
                            <h3 className='font-semibold text-green-900'>Khuyến mãi đã áp dụng</h3>
                          </div>
                          <div className='space-y-2'>
                            {orderItem.orderPromotions.map((promo, idx) => (
                              <div key={idx} className='flex items-center justify-between'>
                                <span className='text-green-700 text-sm'>{promo.title}</span>
                                {promo.discountAmount > 0 && (
                                  <span className='font-bold text-green-600'>
                                    -{promo.discountAmount.toLocaleString('vi-VN')}₫
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Price Summary */}
                      <div className='bg-white rounded-xl p-5 border-2 border-gray-200'>
                        <div className='space-y-3'>
                          <div className='flex justify-between text-gray-600'>
                            <span>Tạm tính</span>
                            <span className='font-medium'>{(orderItem.totalOrder || 0).toLocaleString('vi-VN')}₫</span>
                          </div>
                          <div className='flex justify-between text-gray-600'>
                            <span>Phí vận chuyển</span>
                            <span className='font-medium'>{(orderItem.shipPrice || 0).toLocaleString('vi-VN')}₫</span>
                          </div>
                          {orderItem.totalDiscount > 0 && (
                            <div className='flex justify-between text-green-600'>
                              <span>Giảm giá</span>
                              <span className='font-bold'>-{(orderItem.totalDiscount || 0).toLocaleString('vi-VN')}₫</span>
                            </div>
                          )}
                          <div className='pt-3 border-t-2 border-dashed border-gray-300'>
                            <div className='flex justify-between items-center'>
                              <span className='text-lg font-bold text-gray-900'>Thành tiền</span>
                              <span className='text-2xl font-bold text-green-600'>
                                {(orderItem.finalPrice || 0).toLocaleString('vi-VN')}₫
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className='flex flex-col sm:flex-row justify-center gap-4 pt-4'>
              <Button 
                onClick={() => navigate('/profile?tab=orders')}
                className='bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all'
              >
                <Package className='w-5 h-5 mr-2' />
                Xem lịch sử mua hàng
              </Button>
              <Button 
                onClick={() => navigate('/')}
                className='bg-white hover:bg-gray-50 text-gray-700 px-8 py-6 text-lg font-semibold rounded-xl border-2 border-gray-300 hover:border-green-400 transition-all'
              >
                <ShoppingBag className='w-5 h-5 mr-2' />
                Tiếp tục mua sắm
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Invoice