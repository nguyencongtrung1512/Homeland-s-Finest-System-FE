import { Button } from '../../../components/ui/button'
import { CheckCircle, XCircle, CreditCard, BadgeCheck } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

function Invoice() {
  const location = useLocation()
  const navigate = useNavigate()
  // Lấy trạng thái thanh toán từ query string (?status=success|fail)
  const params = new URLSearchParams(location.search)
  const status = params.get('status') === 'fail' ? 'fail' : 'success'

  // Giả lập dữ liệu đơn hàng
  const order = {
    id: 'TH24042001324',
    date: '15/07/2024',
    payment: 'Thẻ tín dụng',
    status: 'Đã xác nhận',
    items: [
      {
        name: 'Nước mắm Phú Linh',
        desc: 'Số lượng: 1',
        price: 180000,
        image: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?q=80&w=400&auto=format&fit=crop'
      }
    ],
    shipping: 30000,
    total: 210000
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
              Mã đơn hàng <span className='font-semibold'>#{order.id}</span>
            </div>
            <div>
              Ngày đặt hàng <span className='font-semibold'>{order.date}</span>
            </div>
          </div>
          <div className='flex items-center gap-2 mb-2 text-sm'>
            <CreditCard className='w-4 h-4 text-green-600' />
            <span>
              Phương thức thanh toán: <span className='font-semibold'>{order.payment}</span>
            </span>
          </div>
          <div className='flex items-center gap-2 mb-4 text-sm'>
            <CheckCircle className='w-4 h-4 text-green-600' />
            <span>
              Trạng thái: <span className='font-semibold text-green-700'>{order.status}</span>
            </span>
          </div>
          <div className='border-t pt-4 mb-2'>
            <div className='font-semibold mb-2'>Sản phẩm đã đặt</div>
            {order.items.map((item, idx) => (
              <div key={idx} className='flex items-center gap-4 mb-2'>
                <img src={item.image} alt={item.name} className='w-14 h-14 rounded object-cover border' />
                <div className='flex-1'>
                  <div className='font-medium'>{item.name}</div>
                  <div className='text-xs text-gray-500'>{item.desc}</div>
                </div>
                <div className='font-semibold'>{item.price.toLocaleString('vi-VN')}₫</div>
              </div>
            ))}
          </div>
          <div className='flex justify-between text-sm'>
            <span>Tạm tính</span>
            <span>{order.items[0].price.toLocaleString('vi-VN')}₫</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span>Phí vận chuyển</span>
            <span>{order.shipping.toLocaleString('vi-VN')}₫</span>
          </div>
          <div className='flex justify-between font-bold text-lg mt-2'>
            <span>Tổng cộng</span>
            <span>{order.total.toLocaleString('vi-VN')}₫</span>
          </div>
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
