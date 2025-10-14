import { Button } from '../../../components/ui/button'
import { CheckCircle, XCircle, CreditCard, BadgeCheck, Loader2 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getOrderDetail } from '../../../apis/order.api'
import type { Order } from '../../../types/orderType'
import { toast } from 'react-toastify'

function Invoice() {
  const location = useLocation()
  const navigate = useNavigate()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Lấy trạng thái thanh toán và orderId từ query string
  const params = new URLSearchParams(location.search)
  const status = params.get('status') === 'fail' ? 'fail' : 'success'
  const orderId = params.get('orderId')

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!orderId) {
        setError('Không tìm thấy mã đơn hàng')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const orderData = await getOrderDetail(orderId)
        setOrder(orderData)
      } catch (err) {
        console.error('Error fetching order detail:', err)
        setError('Không thể tải thông tin đơn hàng')
        toast.error('Không thể tải thông tin đơn hàng')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetail()
  }, [orderId])

  // Format date function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      // Handle the format "01:29:03 13-10-2025"
      const [, date] = dateString.split(' ')
      const [day, month, year] = date.split('-')
      return `${day}/${month}/${year}`
    } catch {
      return dateString
    }
  }

  // Get payment method display text
  const getPaymentMethodText = (paymentType: string) => {
    switch (paymentType) {
      case 'COD':
        return 'Thanh toán khi nhận hàng'
      case 'VNPay':
        return 'VNPay'
      case 'Momo':
        return 'Momo'
      case 'Banking':
        return 'Chuyển khoản ngân hàng'
      default:
        return paymentType
    }
  }

  // Get status display text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'NotYet':
        return 'Chờ xử lý'
      case 'Processing':
        return 'Đang xử lý'
      case 'Shipping':
        return 'Đang giao hàng'
      case 'Delivered':
        return 'Đã giao hàng'
      case 'Cancel':
        return 'Đã hủy'
      case 'Returned':
        return 'Đã trả hàng'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className='max-w-3xl mx-auto px-4 py-10 flex justify-center items-center'>
        <Loader2 className='animate-spin' size={48} />
        <span className='ml-2'>Đang tải thông tin đơn hàng...</span>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className='max-w-3xl mx-auto px-4 py-10 text-center'>
        <XCircle className='mx-auto text-red-500' size={48} />
        <h2 className='text-2xl font-bold text-red-600 mt-4 mb-2'>Lỗi</h2>
        <p className='text-gray-700 mb-4'>{error || 'Không tìm thấy thông tin đơn hàng'}</p>
        <Button onClick={() => navigate('/profile?tab=orders')} className='bg-green-600 hover:bg-green-700'>
          Quay lại danh sách đơn hàng
        </Button>
      </div>
    )
  }

  return (
    <div className='max-w-3xl mx-auto px-4 py-10'>
      {/* Main content */}
      <div className='text-center mb-8'>
        {status === 'success' ? (
          <>
            <BadgeCheck className='mx-auto text-green-500' size={48} />
            <h2 className='text-3xl font-bold text-green-700 mt-4 mb-2'>Cảm ơn!</h2>
            <p className='text-gray-700 mb-2'>
              Đơn hàng của bạn đã được xác nhận và đang được chuẩn bị. Cảm ơn bạn đã tin tưởng Tinh Hoa Quê Nhà!
            </p>
          </>
        ) : (
          <>
            <XCircle className='mx-auto text-red-500' size={48} />
            <h2 className='text-3xl font-bold text-red-600 mt-4 mb-2'>Thanh toán thất bại</h2>
            <p className='text-gray-700 mb-2'>
              Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại hoặc chọn phương thức khác.
            </p>
            <Button className='mt-4 bg-green-600 hover:bg-green-700' onClick={() => navigate('/cart/confirm')}>
              Quay lại thanh toán
            </Button>
          </>
        )}
      </div>

      {/* Invoice info (only show if success) */}
      {status === 'success' && (
        <div className='bg-white rounded-lg shadow p-6 mx-auto max-w-xl'>
          <div className='flex justify-between mb-2 text-sm'>
            <div>
              Mã đơn hàng <span className='font-semibold'>#{order.ghnorderCode || 'N/A'}</span>
            </div>
            <div>
              Ngày đặt hàng <span className='font-semibold'>{formatDate(order.orderHistories?.[0]?.time)}</span>
            </div>
          </div>
          <div className='flex items-center gap-2 mb-2 text-sm'>
            <CreditCard className='w-4 h-4 text-green-600' />
            <span>
              Phương thức thanh toán: <span className='font-semibold'>{getPaymentMethodText(order.paymentType || '')}</span>
            </span>
          </div>
          <div className='flex items-center gap-2 mb-4 text-sm'>
            <CheckCircle className='w-4 h-4 text-green-600' />
            <span>
              Trạng thái: <span className='font-semibold text-green-700'>{getStatusText(order.status || '')}</span>
            </span>
          </div>

          {/* Shipping Information */}
          <div className='border-t pt-4 mb-4'>
            <div className='font-semibold mb-2'>Thông tin giao hàng</div>
            <div className='text-sm text-gray-600'>
              <div>Người nhận: <span className='font-medium'>{order.toName || 'N/A'}</span></div>
              <div>Địa chỉ: <span className='font-medium'>{order.toAddress || 'N/A'}</span></div>
              <div>Cửa hàng: <span className='font-medium'>{order.fromName || 'N/A'}</span></div>
            </div>
          </div>

          <div className='border-t pt-4 mb-2'>
            <div className='font-semibold mb-2'>Sản phẩm đã đặt</div>
            {order.orderItems.map((item, idx) => (
              <div key={idx} className='flex items-center gap-4 mb-2'>
                <img
                  src={item.orderItemImageUrl}
                  alt={item.orderItemName}
                  className='w-14 h-14 rounded object-cover border'
                />
                <div className='flex-1'>
                  <div className='font-medium'>{item.orderItemName}</div>
                  <div className='text-xs text-gray-500'>Số lượng: {item.quantity}</div>
                  {item.basePrice && item.finalPrice && item.basePrice !== item.finalPrice && (
                    <div className='text-xs text-gray-500'>
                      Giá gốc: {item.basePrice.toLocaleString('vi-VN')}₫
                    </div>
                  )}
                </div>
                <div className='font-semibold'>{(item.totalPrice || 0).toLocaleString('vi-VN')}₫</div>
              </div>
            ))}
          </div>

          <div className='flex justify-between text-sm'>
            <span>Tạm tính</span>
            <span>{(order.totalOrder || 0).toLocaleString('vi-VN')}₫</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span>Phí vận chuyển</span>
            <span>{(order.shipPrice || 0).toLocaleString('vi-VN')}₫</span>
          </div>
          <div className='flex justify-between font-bold text-lg mt-2'>
            <span>Tổng cộng</span>
            <span>{(order.finalPrice || 0).toLocaleString('vi-VN')}₫</span>
          </div>

          {/* Order History */}
          {order.orderHistories && order.orderHistories.length > 0 && (
            <div className='border-t pt-4 mt-4'>
              <div className='font-semibold mb-2'>Lịch sử đơn hàng</div>
              {order.orderHistories.map((history, idx) => (
                <div key={idx} className='text-sm text-gray-600 mb-1'>
                  <span className='font-medium'>{history.time}</span>: {history.description}
                </div>
              ))}
            </div>
          )}

          <Button
            className='w-full mt-6 bg-orange-400 hover:bg-orange-500'
            onClick={() => navigate('/profile?tab=orders')}
          >
            Lịch sử mua hàng
          </Button>
        </div>
      )}
    </div>
  )
}

export default Invoice
