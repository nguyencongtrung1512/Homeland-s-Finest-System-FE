import { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/button'
import { CheckCircle, Truck, ShieldCheck, Loader2, AlertCircle } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../contexts/auth.context'
import { createOrder, cancelOrder, getOrderDetail } from '../../../apis/order.api'
import { purchaseOrder } from '../../../apis/transaction.api'
import type { CreateOrderInput, PaymentMethod, Order } from '../../../types/orderType'
import { toast } from 'react-toastify'
import CancelOrderDialog from '../../../components/CancelOrderDialog/CancelOrderDialog'

interface CartItem {
  id: string
  productVariantId: string
  name: string
  desc: string
  price: number
  quantity: number
  image: string
}

// import & setup

function OrderCreate() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>()

  const hardcodedAddressId = '11000000-0000-0000-0000-000000000001'

  // Lấy dữ liệu từ navigation state
  const buyNowProduct = location.state?.product
  const existingOrder: Order = location.state?.order
  const existingPaymentMethod: PaymentMethod = location.state?.paymentMethod

  const params = new URLSearchParams(location.search)
  const orderId = params.get('orderId')
  const [order, setOrder] = useState<Order | null>(existingOrder ?? null)

  useEffect(() => {
    if (!existingOrder && orderId) {
      getOrderDetail(orderId)
        .then(setOrder)
        .catch((err) => {
          console.error('Error fetching order detail:', err)
          toast.error('Không thể tải thông tin đơn hàng')
        })
    }
  }, [existingOrder, orderId])

  // Giữ fallback cho "Mua ngay" nhưng ưu tiên dữ liệu Backend từ order
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
    : []

  // NEW: Dùng dữ liệu động để hiển thị sản phẩm
  const displayItems: CartItem[] = order
    ? order.orderItems.map((it) => ({
        id: it.id,
        productVariantId: it.productInventoryId,
        name: it.orderItemName,
        desc: '',
        price: it.finalPrice,
        quantity: it.quantity,
        image: it.orderItemImageUrl
      }))
    : cartItems

  // NEW: Tổng tiền/ship đọc từ order nếu có
  const shipping = order ? order.shipPrice : 30000
  const subtotal = order
    ? Math.max(0, order.totalPrice - order.shipPrice)
    : displayItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const total = order ? order.totalPrice : subtotal + shipping

  // NEW: Text phương thức thanh toán
  const paymentDisplay: PaymentMethod | undefined = order
    ? (existingPaymentMethod ?? (order.paymentType as PaymentMethod))
    : selectedPaymentMethod

  // Sửa flow thanh toán để dùng order.id
  const handlePayment = async () => {
    try {
      if (order) {
        await handlePurchasePayment()
        return
      }
      await handleCreateNewOrder()
    } catch (error: any) {
      console.error('Error in payment process:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi xử lý thanh toán'
      toast.error(errorMessage)
    }
  }

  const handleCreateNewOrder = async () => {
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

    // NEW: Validate user from auth
    if (!user?.userId) {
      toast.error('Vui lòng đăng nhập trước khi đặt hàng')
      return
    }

    setIsSubmitting(true)

    try {
      // Chuẩn bị dữ liệu order theo format API với userId từ auth và addressId cứng
      const orderData: CreateOrderInput = {
        userId: user.userId,
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

      // Chuyển đến trang hóa đơn/chi tiết đơn hàng
      navigate(`/cart/invoice?orderId=${createdOrder.id}&status=success`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePurchasePayment = async () => {
    if (!order) {
      toast.error('Không tìm thấy thông tin đơn hàng')
      return
    }

    setIsSubmitting(true)

    try {
      const transactions = await purchaseOrder({ orderIds: [order.id] })
      const transaction = transactions[0]

      if (transaction.paymentMethod === 'COD') {
        toast.success('Đơn hàng COD đã được xác nhận! Chờ giao hàng.')
        navigate(`/cart/invoice?orderId=${order.id}&status=success&type=cod`)
      } else if (transaction.paymentMethod === 'Banking') {
        toast.success('Đang chuyển đến trang thanh toán...')
        if (transaction.checkoutUrl) {
          window.location.href = transaction.checkoutUrl
        } else {
          navigate(`/cart/invoice?orderId=${order.id}&status=pending&type=banking`)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelOrder = () => {
    if (!order) {
      toast.error('Không tìm thấy thông tin đơn hàng để hủy')
      return
    }
    setShowCancelDialog(true)
  }

  const handleConfirmCancel = async (reason: string) => {
    if (!order) return

    setIsCancelling(true)
    try {
      const cancelledOrders = await cancelOrder(order.id, reason)
      toast.success(`Đã hủy ${cancelledOrders.length} đơn hàng thành công!`)
      setShowCancelDialog(false)
      navigate('/products')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi hủy đơn hàng'
      toast.error(errorMessage)
    } finally {
      setIsCancelling(false)
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
          {existingOrder && (
            <div className='mt-2 p-3 bg-green-100 rounded-lg border border-green-200'>
              <p className='text-sm text-green-800 font-medium'>✅ Đơn hàng đã được tạo thành công</p>
              <p className='text-xs text-green-700 mt-1'>Order ID: {existingOrder.id}</p>
              <p className='text-xs text-green-700'>Phương thức: {existingPaymentMethod}</p>
            </div>
          )}
          {buyNowProduct && !existingOrder && (
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
              {existingOrder ? (
                <div className='p-4 bg-blue-50 rounded-lg border border-blue-200'>
                  <p className='text-sm text-blue-800 font-medium mb-2'>Phương thức đã chọn:</p>
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                      {existingPaymentMethod === 'COD' ? '💵' : '💳'}
                    </div>
                    <div>
                      <p className='font-medium text-gray-900'>
                        {existingPaymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'}
                      </p>
                      <p className='text-sm text-gray-500'>
                        {existingPaymentMethod === 'COD'
                          ? 'Thanh toán bằng tiền mặt khi nhận hàng'
                          : 'Thanh toán qua chuyển khoản ngân hàng'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
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
                      selectedPaymentMethod === 'Banking'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type='radio'
                      name='paymentMethod'
                      value='Banking'
                      checked={selectedPaymentMethod === 'Banking'}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethod)}
                      className='w-4 h-4 text-green-600'
                    />
                    <div className='flex-1'>
                      <p className='font-medium text-gray-900'>💳 Chuyển khoản ngân hàng</p>
                      <p className='text-sm text-gray-500'>Thanh toán qua chuyển khoản ngân hàng</p>
                    </div>
                  </label>
                </div>
              )}
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
                    {existingOrder
                      ? existingPaymentMethod === 'COD'
                        ? '💵 Thanh toán khi nhận hàng'
                        : '💳 Chuyển khoản ngân hàng'
                      : selectedPaymentMethod === 'COD'
                        ? '💵 Thanh toán khi nhận hàng'
                        : selectedPaymentMethod === 'Banking'
                          ? '💳 Chuyển khoản ngân hàng'
                          : '⚠️ Chưa chọn phương thức'}
                  </p>
                </div>

                {/* Action buttons */}
                <div className='space-y-3'>
                  <Button
                    onClick={handlePayment}
                    disabled={isSubmitting || (!order && !selectedPaymentMethod)}
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
                        {paymentDisplay === 'COD'
                          ? 'Đặt hàng ngay'
                          : paymentDisplay === 'Banking'
                            ? 'Thanh toán ngay'
                            : order || existingOrder
                              ? 'Thanh toán'
                              : 'Đặt hàng'}
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={existingOrder ? handleCancelOrder : handleContinueShopping}
                    variant='outline'
                    disabled={isSubmitting || isCancelling}
                    className='w-full border-red-600 text-red-600 hover:bg-red-50 transition-all'
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        Đang hủy...
                      </>
                    ) : existingOrder ? (
                      'Hủy đặt hàng'
                    ) : (
                      'Hủy đặt hàng'
                    )}
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
                  User: {user?.userId || 'Chưa đăng nhập'}
                </p>
                <p className='text-xs text-gray-600 font-mono bg-white px-2 py-1 rounded border'>
                  Address: {hardcodedAddressId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Dialog */}
      <CancelOrderDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleConfirmCancel}
        orderInfo={order ? { orderId: order.id, totalAmount: order.totalPrice } : undefined}
        isLoading={isCancelling}
      />
    </div>
  )
}

export default OrderCreate
