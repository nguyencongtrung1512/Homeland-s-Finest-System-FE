import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { CheckCircle, Truck, ShieldCheck, Loader2, AlertCircle } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
// import { useAuth } from '../../../contexts/auth.context'
import { createOrder } from '../../../apis/order.api'
import type { CreateOrderInput, PaymentMethod } from '../../../types/orderType'
import { toast } from 'react-toastify'

interface CartItem {
  id: string
  productVariantId: string
  name: string
  desc: string
  price: number
  quantity: number
  image: string
}

function OrderCreate() {
  const navigate = useNavigate()
  const location = useLocation()
  // const { user } = useAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>()

  // Set cứng userId và userAddressId
  const hardcodedUserId = '30000000-0000-0000-0000-000000000003'
  const hardcodedAddressId = '11000000-0000-0000-0000-000000000001'

  // Lấy dữ liệu sản phẩm từ navigation state (từ "Mua ngay")
  const buyNowProduct = location.state?.product

  // Giả lập dữ liệu đơn hàng - Thực tế sẽ lấy từ context/cart hoặc từ "Mua ngay"
  const cartItems: CartItem[] = buyNowProduct
    ? [
        {
          id: buyNowProduct.id,
          productVariantId: buyNowProduct.productVariantId,
          name: buyNowProduct.name,
          desc: buyNowProduct.desc || buyNowProduct.description,
          price: buyNowProduct.price,
          quantity: buyNowProduct.quantity,
          image: buyNowProduct.image
        }
      ]
    : [
        {
          id: '1',
          productVariantId: '15000000-0000-0000-0000-000000000004',
          name: 'Nước mắm Phú Linh',
          desc: 'Nước mắm cá cơm\nChai 500ml - Độ đạm 30°N',
          price: 180000,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?q=80&w=400&auto=format&fit=crop'
        },
        {
          id: '2',
          productVariantId: '15000000-0000-0000-0000-000000000005',
          name: 'Mắm tôm chua Cần Thơ',
          desc: 'Mắm tôm truyền thống\nHũ 250g',
          price: 120000,
          quantity: 2,
          image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=400&auto=format&fit=crop'
        }
      ]

  const shipping = 30000
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal + shipping

  const handlePayment = async () => {
    try {
      // Validate cart
      if (cartItems.length === 0) {
        toast.error('Giỏ hàng trống')
        return
      }

      // Validate payment method
      if (!selectedPaymentMethod) {
        toast.error('Vui lòng chọn phương thức thanh toán')
        return
      }

      setIsSubmitting(true)

      // Chuẩn bị dữ liệu order theo format API với userId và addressId cứng
      const orderData: CreateOrderInput = {
        userId: hardcodedUserId,
        userAddressId: hardcodedAddressId,
        paymentMethod: selectedPaymentMethod,
        orderItemCreates: cartItems.map((item) => ({
          productVariantId: item.productVariantId,
          quantity: item.quantity
        }))
      }

      console.log('Creating order with data:', orderData)

      // Gọi API tạo order
      const createdOrder = await createOrder(orderData)

      console.log('Order created successfully:', createdOrder)

      // Hiển thị thông báo thành công
      toast.success('Đặt hàng thành công!')

      // Xóa cart (nếu có)
      // clearCart()

      // Chuyển đến trang hóa đơn/chi tiết đơn hàng
      navigate(`/cart/invoice?orderId=${createdOrder.id}&status=success`)
    } catch (error: any) {
      console.error('Error creating order:', error)

      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi đặt hàng'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
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
          {buyNowProduct && (
            <div className='mt-2 p-2 bg-blue-100 rounded-lg'>
              <p className='text-sm text-blue-800'>🛒 Đơn hàng từ "Mua ngay"</p>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Order items - Takes 2 columns on large screens */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Products List */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <h2 className='text-xl font-semibold mb-6 flex items-center gap-2'>
                <CheckCircle className='w-5 h-5 text-green-600' />
                Sản phẩm trong đơn hàng
              </h2>

              <div className='space-y-4'>
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className='flex items-start gap-4 p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors'
                  >
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
                  <span className='font-medium'>{shipping.toLocaleString('vi-VN')}₫</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <h2 className='text-xl font-semibold mb-4'>Phương thức thanh toán</h2>
              <div className='space-y-3'>
                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPaymentMethod === 'COD'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type='radio'
                    name='paymentMethod'
                    value='COD'
                    checked={selectedPaymentMethod === 'COD'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethod)}
                    className='w-4 h-4 text-green-600'
                  />
                  <div className='flex-1'>
                    <p className='font-medium text-gray-900'>💵 Thanh toán khi nhận hàng (COD)</p>
                    <p className='text-sm text-gray-500'>Thanh toán bằng tiền mặt khi nhận hàng</p>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPaymentMethod === 'VNPay'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type='radio'
                    name='paymentMethod'
                    value='VNPay'
                    checked={selectedPaymentMethod === 'VNPay'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethod)}
                    className='w-4 h-4 text-green-600'
                  />
                  <div className='flex-1'>
                    <p className='font-medium text-gray-900'>💳 VNPay</p>
                    <p className='text-sm text-gray-500'>Thanh toán qua cổng VNPay</p>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPaymentMethod === 'Momo'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type='radio'
                    name='paymentMethod'
                    value='Momo'
                    checked={selectedPaymentMethod === 'Momo'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethod)}
                    className='w-4 h-4 text-green-600'
                  />
                  <div className='flex-1'>
                    <p className='font-medium text-gray-900'>📱 Ví Momo</p>
                    <p className='text-sm text-gray-500'>Thanh toán qua ví điện tử Momo</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Shipping Address Info */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
                <Truck className='w-5 h-5 text-green-600' />
                Địa chỉ giao hàng
              </h2>
              <div className='flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200'>
                <AlertCircle className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
                <div className='flex-1'>
                  <p className='text-sm text-gray-700 font-medium mb-1'>Địa chỉ đã chọn (Cứng)</p>
                  <p className='text-sm text-gray-600'>
                    User ID: <span className='font-mono text-xs'>{hardcodedUserId}</span>
                  </p>
                  <p className='text-sm text-gray-600'>
                    Address ID: <span className='font-mono text-xs'>{hardcodedAddressId}</span>
                  </p>
                  <p className='text-xs text-gray-500 mt-2'>💡 Đang sử dụng dữ liệu test cứng</p>
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
                    <span className='text-gray-600'>Tạm tính ({cartItems.length} sản phẩm)</span>
                    <span className='font-medium'>{subtotal.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Phí vận chuyển</span>
                    <span className='font-medium'>{shipping.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className='border-t pt-3 mt-3'>
                    <div className='flex justify-between text-lg font-bold'>
                      <span>Tổng cộng</span>
                      <span className='text-green-700'>{total.toLocaleString('vi-VN')}₫</span>
                    </div>
                  </div>
                </div>

                {/* Payment method display */}
                <div className='mb-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200'>
                  <p className='text-xs text-gray-600 mb-1'>Phương thức thanh toán:</p>
                  <p className='text-sm font-semibold text-gray-900'>
                    {selectedPaymentMethod === 'COD' && '💵 Thanh toán khi nhận hàng'}
                    {selectedPaymentMethod === 'VNPay' && '💳 VNPay'}
                    {selectedPaymentMethod === 'Momo' && '📱 Ví Momo'}
                    {!selectedPaymentMethod && '⚠️ Chưa chọn phương thức'}
                  </p>
                </div>

                {/* Action buttons */}
                <div className='space-y-3'>
                  <Button
                    onClick={handlePayment}
                    disabled={isSubmitting || !selectedPaymentMethod}
                    className='w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all'
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <CheckCircle className='w-4 h-4 mr-2' />
                        Đặt hàng ngay
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleContinueShopping}
                    variant='outline'
                    disabled={isSubmitting}
                    className='w-full border-green-600 text-green-600 hover:bg-green-50 transition-all'
                  >
                    Tiếp tục mua sắm
                  </Button>
                </div>
              </div>

              {/* Security features */}
              <div className='bg-white rounded-lg shadow-sm border p-4'>
                <h4 className='font-semibold text-sm mb-3 text-gray-700'>Cam kết của chúng tôi</h4>
                <div className='space-y-3 text-sm'>
                  <div className='flex items-center gap-3'>
                    <ShieldCheck className='w-5 h-5 text-green-600 flex-shrink-0' />
                    <span className='text-gray-700'>Thanh toán an toàn & bảo mật</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Truck className='w-5 h-5 text-green-600 flex-shrink-0' />
                    <span className='text-gray-700'>Giao hàng toàn quốc</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <CheckCircle className='w-5 h-5 text-green-600 flex-shrink-0' />
                    <span className='text-gray-700'>Hỗ trợ 24/7</span>
                  </div>
                </div>
              </div>

              {/* Test Data Info */}
              <div className='bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow-sm border border-yellow-200 p-4'>
                <h4 className='font-semibold text-sm mb-2 text-gray-700 flex items-center gap-2'>
                  <AlertCircle className='w-4 h-4 text-yellow-600' />
                  Dữ liệu Test
                </h4>
                <p className='text-xs text-gray-600 font-mono bg-white px-2 py-1 rounded border mb-1'>
                  User: {hardcodedUserId}
                </p>
                <p className='text-xs text-gray-600 font-mono bg-white px-2 py-1 rounded border'>
                  Address: {hardcodedAddressId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderCreate
