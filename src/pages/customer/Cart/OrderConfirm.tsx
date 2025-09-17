import { Button } from '../../../components/ui/button'
import { CheckCircle, Truck, ShieldCheck, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function OrderConfirm() {
  const navigate = useNavigate()

  // Giả lập dữ liệu đơn hàng, thực tế sẽ lấy từ context/cart
  const order = {
    items: [
      {
        id: 1,
        name: 'Nước mắm Phú Linh',
        desc: 'Nước mắm cá cơm\nChai 500ml - Độ đạm 30°N',
        price: 180000,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?q=80&w=400&auto=format&fit=crop'
      },
      {
        id: 2,
        name: 'Mắm tôm chua Cần Thơ',
        desc: 'Mắm tôm truyền thống\nHũ 250g',
        price: 120000,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=400&auto=format&fit=crop'
      }
    ],
    shipping: 30000,
    subtotal: 420000, // 180000*1 + 120000*2
    total: 450000 // subtotal + shipping
  }

  const handlePayment = () => {
    // Logic thanh toán
    navigate('/cart/invoice?status=success')
  }

  const handleContinueShopping = () => {
    navigate('/products')
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-6xl mx-auto px-4'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>Xác nhận đơn hàng</h1>
          <p className='text-gray-600'>Vui lòng kiểm tra lại thông tin đơn hàng trước khi thanh toán</p>
        </div>

        {/* Main content */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Order items - Takes 2 columns on large screens */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <h2 className='text-xl font-semibold mb-6 flex items-center gap-2'>
                <CheckCircle className='w-5 h-5 text-green-600' />
                Sản phẩm trong đơn hàng
              </h2>

              <div className='space-y-4'>
                {order.items.map((item) => (
                  <div key={item.id} className='flex items-start gap-4 p-4 border border-gray-100 rounded-lg'>
                    <img
                      src={item.image}
                      alt={item.name}
                      className='w-20 h-20 rounded-lg object-cover border flex-shrink-0'
                    />
                    <div className='flex-1 min-w-0'>
                      <h3 className='font-semibold text-gray-900 mb-1'>{item.name}</h3>
                      <p className='text-sm text-gray-600 whitespace-pre-line mb-2'>{item.desc}</p>
                      <div className='flex items-center justify-between'>
                        <span className='text-lg font-bold text-green-700'>{item.price.toLocaleString('vi-VN')}₫</span>
                        <span className='text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded'>
                          Số lượng: {item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping info */}
              <div className='mt-6 pt-4 border-t border-gray-200'>
                <div className='flex items-center justify-between text-sm text-gray-600'>
                  <div className='flex items-center gap-2'>
                    <Truck className='w-4 h-4' />
                    <span>Phí vận chuyển</span>
                  </div>
                  <span className='font-medium'>{order.shipping.toLocaleString('vi-VN')}₫</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order summary and actions - Takes 1 column */}
          <div className='lg:col-span-1'>
            <div className='sticky top-4 space-y-4'>
              {/* Order total */}
              <div className='bg-white rounded-lg shadow-sm border p-6'>
                <h3 className='font-semibold text-lg mb-4'>Tổng kết đơn hàng</h3>

                <div className='space-y-3 mb-4'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Tạm tính ({order.items.length} sản phẩm)</span>
                    <span className='font-medium'>{order.subtotal.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Phí vận chuyển</span>
                    <span className='font-medium'>{order.shipping.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className='border-t pt-3'>
                    <div className='flex justify-between text-lg font-bold'>
                      <span>Tổng cộng</span>
                      <span className='text-green-700'>{order.total.toLocaleString('vi-VN')}₫</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className='space-y-3'>
                  <Button
                    onClick={handlePayment}
                    className='w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3'
                  >
                    Thanh toán ngay
                  </Button>
                  <Button
                    onClick={handleContinueShopping}
                    variant='outline'
                    className='w-full border-green-600 text-green-600 hover:bg-green-50'
                  >
                    Tiếp tục mua sắm
                  </Button>
                </div>
              </div>

              {/* Security features */}
              <div className='bg-white rounded-lg shadow-sm border p-4'>
                <div className='space-y-3 text-sm'>
                  <div className='flex items-center gap-3'>
                    <ShieldCheck className='w-5 h-5 text-green-600 flex-shrink-0' />
                    <span className='text-gray-700'>Thanh toán an toàn & bảo mật</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Truck className='w-5 h-5 text-green-600 flex-shrink-0' />
                    <span className='text-gray-700'>Giao hàng toàn quốc</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirm
