// Cart component
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Checkbox } from '../../../components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog'
import { MapPin, Trash2, Plus, Minus, ShoppingCart, Truck, Shield, Edit } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../../contexts/cart.context'
import { useAuth } from '../../../contexts/auth.context'
import { updateCartItem, removeCartItem } from '../../../apis/cart.api'
import { toast } from 'react-toastify'
import { createOrder } from '../../../apis/order.api'
import type { CheckedState } from '@radix-ui/react-checkbox'

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  storeId?: string
  productVariantId?: string
  comboId?: string
  isCombo?: boolean
  selected: boolean
  inStock: boolean
}

type Address = {
  id: number
  name: string
  phone: string
  address: string
  isDefault: boolean
}
type PaymentMethod = 'COD' | 'Banking'

export default function Cart() {
  const navigate = useNavigate()
  const { cart, refreshCart, loading } = useCart()
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const hardcodedAddressId = '11000000-0000-0000-0000-000000000001'
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: 2,
      name: 'Nguyễn Văn A',
      phone: '0123456789',
      address: '456 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
      isDefault: false
    }
  ])
  const [selectedAddress, setSelectedAddress] = useState<Address>(addresses[0])
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    address: ''
  })
  const [isAddingAddress, setIsAddingAddress] = useState(false)

  // Transform cart data from context to local state
  useEffect(() => {
    const transformedItems = cart.map((item) => ({
      ...item,
      selected: true,
      inStock: true
    }))
    setCartItems(transformedItems)
  }, [cart])

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (!user?.userId || newQuantity < 1) return

    try {
      // gọi API với (cartItemId, quantity)
      await updateCartItem(id, newQuantity)
      await refreshCart()
      toast.success('Cập nhật số lượng thành công')
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast.error('Có lỗi xảy ra khi cập nhật số lượng')
    }
  }

  const removeItem = async (id: string) => {
    if (!user?.userId) return

    try {
      await removeCartItem(user.userId, id)
      await refreshCart()
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng')
    } catch (error) {
      console.error('Error removing item:', error)
      toast.error('Có lỗi xảy ra khi xóa sản phẩm')
    }
  }

  const toggleItemSelection = (id: string) => {
    setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)))
  }

  const toggleAllSelection = (checked: CheckedState) => {
    setCartItems((prev) => prev.map((item) => ({ ...item, selected: checked === true })))
  }

  const selectedItems = cartItems.filter((item) => item.selected)
  const totalPrice = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const allSelected = cartItems.length > 0 && cartItems.every((item) => item.selected)

  const handleAddAddress = () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.address) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    const address: Address = {
      id: Date.now(),
      ...newAddress,
      isDefault: addresses.length === 0
    }

    setAddresses((prev) => [...prev, address])
    setNewAddress({ name: '', phone: '', address: '' })
    setIsAddingAddress(false)
    toast.success('Thêm địa chỉ thành công')
  }

  const handleCreateOrder = async () => {
    try {
      if (!user?.userId) {
        toast.error('Vui lòng đăng nhập trước khi đặt hàng')
        return
      }
      if (selectedItems.length === 0) {
        toast.error('Vui lòng chọn ít nhất một sản phẩm')
        return
      }
      if (!selectedPaymentMethod) {
        toast.error('Vui lòng chọn phương thức thanh toán')
        return
      }

      setIsSubmitting(true)

      const orderData = {
        userId: user.userId,
        userAddressId: hardcodedAddressId,
        paymentMethod: selectedPaymentMethod,
        orderItemCreates: selectedItems.map((item) => ({
          productVariantId: item.productVariantId as string,
          quantity: item.quantity,
          ...(item.isCombo && item.comboId ? { comboId: item.comboId } : {})
        }))
      }

      const createdOrder = await createOrder(orderData)
      toast.success('Đơn hàng đã được tạo! Đang chuyển đến trang thanh toán...')

      navigate('/cart/create-order', {
        state: {
          order: createdOrder,
          paymentMethod: selectedPaymentMethod
        }
      })
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || 'Có lỗi xảy ra khi đặt hàng'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Đang tải giỏ hàng...</p>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <ShoppingCart size={64} className='mx-auto text-gray-400 mb-4' />
          <h2 className='text-2xl font-semibold text-gray-700 mb-2'>Giỏ hàng trống</h2>
          <p className='text-gray-500 mb-6'>Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</p>
          <Button onClick={() => navigate('/products')} className='bg-green-600 hover:bg-green-700'>
            Tiếp tục mua sắm
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        <h1 className='text-3xl font-bold text-gray-900 mb-8'>Giỏ hàng của bạn</h1>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Cart Items */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Select All */}
            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <Checkbox checked={allSelected} onCheckedChange={toggleAllSelection} id='select-all' />
                  <label htmlFor='select-all' className='text-sm font-medium cursor-pointer'>
                    Chọn tất cả ({cartItems.length} sản phẩm)
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Cart Items List */}
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className='p-6'>
                  <div className='flex items-start gap-4'>
                    <Checkbox checked={item.selected} onCheckedChange={() => toggleItemSelection(item.id)} />

                    <img
                      src={item.image}
                      alt={item.name}
                      className='w-20 h-20 object-cover rounded-lg'
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'https://via.placeholder.com/80x80?text=No+Image'
                      }}
                    />

                    <div className='flex-1'>
                      <h3 className='font-semibold text-lg text-gray-900'>{item.name}</h3>
                      <p className='text-gray-600 text-sm mt-1'>
                        {item.isCombo ? 'Combo sản phẩm' : 'Sản phẩm đơn lẻ'}
                      </p>

                      <div className='flex items-center justify-between mt-4'>
                        <div className='flex items-center gap-3'>
                          <span className='text-xl font-bold text-red-600'>{item.price.toLocaleString('vi-VN')}₫</span>
                        </div>

                        <div className='flex items-center gap-3'>
                          {/* Quantity Controls */}
                          <div className='flex items-center border border-gray-300 rounded-lg'>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className='px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                              <Minus size={16} />
                            </button>
                            <span className='px-4 py-1 border-l border-r border-gray-300'>{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className='px-3 py-1 hover:bg-gray-100'
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeItem(item.id)}
                            className='p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors'
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className='space-y-6'>
            {/* Delivery Address */}
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='font-semibold text-lg'>Địa chỉ giao hàng</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant='outline' size='sm'>
                        <Edit size={16} className='mr-2' />
                        Thay đổi
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-md'>
                      <DialogHeader>
                        <DialogTitle>Chọn địa chỉ giao hàng</DialogTitle>
                      </DialogHeader>
                      <div className='space-y-4'>
                        {addresses.map((address) => (
                          <div
                            key={address.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddress.id === address.id
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                              }`}
                            onClick={() => setSelectedAddress(address)}
                          >
                            <div className='flex items-start justify-between'>
                              <div>
                                <p className='font-medium'>{address.name}</p>
                                <p className='text-sm text-gray-600'>{address.phone}</p>
                                <p className='text-sm text-gray-600 mt-1'>{address.address}</p>
                              </div>
                              {address.isDefault && (
                                <span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded'>Mặc định</span>
                              )}
                            </div>
                          </div>
                        ))}

                        {!isAddingAddress ? (
                          <Button variant='outline' className='w-full' onClick={() => setIsAddingAddress(true)}>
                            <Plus size={16} className='mr-2' />
                            Thêm địa chỉ mới
                          </Button>
                        ) : (
                          <div className='space-y-3 p-4 border border-gray-200 rounded-lg'>
                            <Input
                              placeholder='Họ và tên'
                              value={newAddress.name}
                              onChange={(e) => setNewAddress((prev) => ({ ...prev, name: e.target.value }))}
                            />
                            <Input
                              placeholder='Số điện thoại'
                              value={newAddress.phone}
                              onChange={(e) => setNewAddress((prev) => ({ ...prev, phone: e.target.value }))}
                            />
                            <Input
                              placeholder='Địa chỉ chi tiết'
                              value={newAddress.address}
                              onChange={(e) => setNewAddress((prev) => ({ ...prev, address: e.target.value }))}
                            />
                            <div className='flex gap-2'>
                              <Button size='sm' onClick={handleAddAddress}>
                                Thêm
                              </Button>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => {
                                  setIsAddingAddress(false)
                                  setNewAddress({ name: '', phone: '', address: '' })
                                }}
                              >
                                Hủy
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className='flex items-start gap-3'>
                  <MapPin size={20} className='text-green-600 mt-1 flex-shrink-0' />
                  <div>
                    <p className='font-medium'>{selectedAddress.name}</p>
                    <p className='text-sm text-gray-600'>{selectedAddress.phone}</p>
                    <p className='text-sm text-gray-600 mt-1'>{selectedAddress.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <Card className='bg-white shadow-sm'>
              <CardContent className='p-6'>
                <h2 className='text-xl font-semibold mb-4'>Phương thức thanh toán</h2>
                <div className='space-y-3'>
                  <label
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedPaymentMethod === 'COD'
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
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedPaymentMethod === 'Banking'
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
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardContent className='p-6'>
                <h3 className='font-semibold text-lg mb-4'>Tóm tắt đơn hàng</h3>

                <div className='space-y-3'>
                  <div className='flex justify-between'>
                    <span>Tạm tính ({selectedItems.length} sản phẩm)</span>
                    <span>{totalPrice.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Phí vận chuyển</span>
                    <span className='text-green-600'>Miễn phí</span>
                  </div>
                  <div className='border-t pt-3'>
                    <div className='flex justify-between text-lg font-semibold'>
                      <span>Tổng cộng</span>
                      <span className='text-red-600'>{totalPrice.toLocaleString('vi-VN')}₫</span>
                    </div>
                  </div>
                </div>

                <Button
                  className='w-full mt-6 bg-green-600 hover:bg-green-700'
                  onClick={handleCreateOrder}
                  disabled={selectedItems.length === 0 || !selectedPaymentMethod || isSubmitting}
                >
                  {isSubmitting ? 'Đang tạo đơn hàng...' : 'Đặt hàng'}
                </Button>

                {/* Trust Badges */}
                <div className='mt-6 space-y-3'>
                  <div className='flex items-center gap-3 text-sm text-gray-600'>
                    <Truck size={16} className='text-green-600' />
                    <span>Giao hàng miễn phí toàn quốc</span>
                  </div>
                  <div className='flex items-center gap-3 text-sm text-gray-600'>
                    <Shield size={16} className='text-green-600' />
                    <span>Đảm bảo chất lượng 100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}


