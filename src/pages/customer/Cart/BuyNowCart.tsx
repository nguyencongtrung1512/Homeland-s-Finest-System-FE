import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Checkbox } from '../../../components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog'
import {
  MapPin,
  Plus,
  ShoppingCart,
  Truck,
  Shield,
  Edit,
  CheckCircle,
  Loader2,
  AlertCircle,
  Trash2
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { CheckedState } from '@radix-ui/react-checkbox'
import { createOrder } from '../../../apis/order.api'
import type { CreateOrderInput, PaymentMethod } from '../../../types/orderType'
import { toast } from 'react-toastify'
import CancelOrderDialog from '../../../components/CancelOrderDialog/CancelOrderDialog'

type BuyNowProduct = {
  id: string
  productVariantId: string
  name: string
  description: string
  price: number
  quantity: number
  image: string
  variant: string
  storeId: string
}

type Address = {
  id: number
  name: string
  phone: string
  address: string
  isDefault: boolean
}

export default function BuyNowCart() {
  const navigate = useNavigate()
  const location = useLocation()

  const [selectedAddressId, setSelectedAddressId] = useState<number>(1)
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  // Set cứng userId và userAddressId
  const hardcodedUserId = '30000000-0000-0000-0000-000000000003'
  const hardcodedAddressId = '11000000-0000-0000-0000-000000000001'

  // Lấy dữ liệu sản phẩm từ navigation state
  const buyNowProduct: BuyNowProduct = location.state?.product

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([
    {
      id: 1,
      name: 'Nguyễn Văn A',
      phone: '0123456789',
      address: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
      isDefault: true
    },
    {
      id: 2,
      name: 'Nguyễn Văn A',
      phone: '0123456789',
      address: '456 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
      isDefault: false
    }
  ])

  const [newAddress, setNewAddress] = useState<{
    name: string
    phone: string
    address: string
    city: string
    district: string
    ward: string
    isDefault: boolean
  }>({
    name: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    isDefault: false
  })

  // Nếu không có sản phẩm, redirect về trang sản phẩm
  if (!buyNowProduct) {
    navigate('/products')
    return null
  }

  const addNewAddress = () => {
    if (newAddress.name && newAddress.phone && newAddress.address && newAddress.city) {
      const fullAddress = `${newAddress.address}, ${newAddress.ward}, ${newAddress.district}, ${newAddress.city}`
      const newId = Math.max(...savedAddresses.map((a) => a.id)) + 1

      const addressToAdd = {
        id: newId,
        name: newAddress.name,
        phone: newAddress.phone,
        address: fullAddress,
        isDefault: newAddress.isDefault
      }

      setSavedAddresses((prev) => {
        const updated = newAddress.isDefault
          ? prev.map((addr) => ({ ...addr, isDefault: false })).concat(addressToAdd)
          : prev.concat(addressToAdd)
        return updated
      })

      setSelectedAddressId(newId)
      setNewAddress({
        name: '',
        phone: '',
        address: '',
        city: '',
        district: '',
        ward: '',
        isDefault: false
      })
      setIsAddingAddress(false)
    }
  }

  const deleteAddress = (id: number) => {
    setSavedAddresses((prev) => prev.filter((addr) => addr.id !== id))
    if (selectedAddressId === id) {
      const found = savedAddresses.find((addr) => addr.id !== id)
      if (found) setSelectedAddressId(found.id)
    }
  }

  const handleCreateOrder = async () => {
    try {
      // Validate payment method
      if (!selectedPaymentMethod) {
        toast.error('Vui lòng chọn phương thức thanh toán')
        return
      }

      setIsSubmitting(true)

      // Chuẩn bị dữ liệu order theo format API
      const orderData: CreateOrderInput = {
        userId: hardcodedUserId,
        userAddressId: hardcodedAddressId,
        paymentMethod: selectedPaymentMethod,
        orderItemCreates: [
          {
            productVariantId: buyNowProduct.productVariantId,
            quantity: buyNowProduct.quantity
          }
        ]
      }

      console.log('Creating order with data:', orderData)

      // Gọi API tạo order
      const createdOrder = await createOrder(orderData)

      console.log('=== DEBUG ORDER CREATION ===')
      console.log('createdOrder:', createdOrder)
      console.log('createdOrder.id:', createdOrder.id)
      console.log('createdOrder type:', typeof createdOrder)
      console.log('selectedPaymentMethod:', selectedPaymentMethod)

      // Hiển thị thông báo thành công
      toast.success('Đơn hàng đã được tạo! Đang chuyển đến trang thanh toán...')

      // Chuyển đến trang xác nhận đơn hàng với thông tin order
      navigate('/cart/create-order', {
        state: {
          order: createdOrder,
          paymentMethod: selectedPaymentMethod,
          product: buyNowProduct
        }
      })
    } catch (error: any) {
      console.error('Error creating order:', error)

      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi đặt hàng'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelOrder = () => {
    setShowCancelDialog(true)
  }

  const handleConfirmCancel = async (reason: string) => {
    setIsCancelling(true)

    try {
      console.log('=== DEBUG CANCEL BUY NOW ===')
      console.log('Product:', buyNowProduct.name)
      console.log('Reason:', reason)

      // Chỉ cần chuyển về trang sản phẩm vì chưa tạo order
      toast.success('Đã hủy đặt hàng!')

      setShowCancelDialog(false)
      navigate('/products')
    } catch (error: any) {
      console.error('Error cancelling order:', error)
      toast.error('Có lỗi xảy ra khi hủy đặt hàng')
    } finally {
      setIsCancelling(false)
    }
  }

  const subtotal = buyNowProduct.price * buyNowProduct.quantity
  const shipping = 30000
  const total = subtotal + shipping

  return (
    <div className='bg-gray-50 min-h-screen'>
      <div className='container mx-auto px-4 py-6'>
        {/* Header */}
        <div className='mb-6'>
          <h2 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
            <ShoppingCart className='w-6 h-6' />
            Mua ngay - {buyNowProduct.name}
          </h2>
          <p className='text-gray-600 mt-1'>Vui lòng chọn địa chỉ giao hàng và phương thức thanh toán</p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          {/* Left: Product Info */}
          <div className='lg:col-span-3 space-y-4'>
            {/* Product Card */}
            <Card className='bg-white shadow-sm'>
              <CardContent className='p-6'>
                <div className='flex items-center gap-4'>
                  <img
                    src={buyNowProduct.image}
                    alt={buyNowProduct.name}
                    className='w-24 h-24 rounded-lg object-cover border'
                  />
                  <div className='flex-1'>
                    <h3 className='font-semibold text-lg text-gray-900 mb-1'>{buyNowProduct.name}</h3>
                    <p className='text-sm text-gray-600 mb-2'>{buyNowProduct.description}</p>
                    <div className='flex items-center gap-4'>
                      <span className='text-sm text-gray-500'>Phân loại: {buyNowProduct.variant}</span>
                      <span className='text-sm text-gray-500'>Số lượng: {buyNowProduct.quantity}</span>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-xl font-bold text-orange-600'>
                      ₫{(buyNowProduct.price * buyNowProduct.quantity).toLocaleString('vi-VN')}
                    </div>
                    <div className='text-sm text-gray-500'>
                      ₫{buyNowProduct.price.toLocaleString('vi-VN')} × {buyNowProduct.quantity}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card className='bg-white shadow-sm'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center gap-2 font-semibold text-lg'>
                    <MapPin className='w-5 h-5 text-orange-600' />
                    Địa chỉ giao hàng
                  </div>
                  <Dialog open={isAddingAddress} onOpenChange={setIsAddingAddress}>
                    <DialogTrigger asChild>
                      <Button variant='outline' size='sm' className='text-orange-600 border-orange-600'>
                        <Plus className='w-4 h-4 mr-1' />
                        Thêm địa chỉ mới
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-2xl'>
                      <DialogHeader>
                        <DialogTitle>Thêm địa chỉ giao hàng mới</DialogTitle>
                      </DialogHeader>
                      <div className='space-y-4 py-4'>
                        <div className='grid grid-cols-2 gap-4'>
                          <Input
                            placeholder='Họ và tên *'
                            value={newAddress.name}
                            onChange={(e) => setNewAddress((prev) => ({ ...prev, name: e.target.value }))}
                          />
                          <Input
                            placeholder='Số điện thoại *'
                            value={newAddress.phone}
                            onChange={(e) => setNewAddress((prev) => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                        <div className='grid grid-cols-3 gap-4'>
                          <Select
                            value={newAddress.city}
                            onValueChange={(value) => setNewAddress((prev) => ({ ...prev, city: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Tỉnh/Thành phố *' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='TP. Hồ Chí Minh'>TP. Hồ Chí Minh</SelectItem>
                              <SelectItem value='Hà Nội'>Hà Nội</SelectItem>
                              <SelectItem value='Đà Nẵng'>Đà Nẵng</SelectItem>
                              <SelectItem value='Cần Thơ'>Cần Thơ</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={newAddress.district}
                            onValueChange={(value) => setNewAddress((prev) => ({ ...prev, district: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Quận/Huyện *' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='Quận 1'>Quận 1</SelectItem>
                              <SelectItem value='Quận 3'>Quận 3</SelectItem>
                              <SelectItem value='Quận 7'>Quận 7</SelectItem>
                              <SelectItem value='Quận 9'>Quận 9</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={newAddress.ward}
                            onValueChange={(value) => setNewAddress((prev) => ({ ...prev, ward: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Phường/Xã *' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='Phường Bến Nghé'>Phường Bến Nghé</SelectItem>
                              <SelectItem value='Phường Bến Thành'>Phường Bến Thành</SelectItem>
                              <SelectItem value='Phường Nguyễn Thái Bình'>Phường Nguyễn Thái Bình</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Input
                          placeholder='Địa chỉ cụ thể (số nhà, tên đường) *'
                          value={newAddress.address}
                          onChange={(e) => setNewAddress((prev) => ({ ...prev, address: e.target.value }))}
                        />
                        <div className='flex items-center space-x-2'>
                          <Checkbox
                            id='default-address'
                            checked={newAddress.isDefault}
                            onCheckedChange={(checked: CheckedState) =>
                              setNewAddress((prev) => ({ ...prev, isDefault: !!checked }))
                            }
                          />
                          <label htmlFor='default-address' className='text-sm text-gray-600'>
                            Đặt làm địa chỉ mặc định
                          </label>
                        </div>
                        <div className='flex gap-3 pt-4'>
                          <Button variant='outline' onClick={() => setIsAddingAddress(false)} className='flex-1'>
                            Hủy
                          </Button>
                          <Button
                            onClick={addNewAddress}
                            className='flex-1 bg-orange-600 hover:bg-orange-700'
                            disabled={!newAddress.name || !newAddress.phone || !newAddress.address || !newAddress.city}
                          >
                            Thêm địa chỉ
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Address List */}
                <div className='space-y-3'>
                  {savedAddresses.map((address) => (
                    <div
                      key={address.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedAddressId === address.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedAddressId(address.id)}
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex items-start gap-3'>
                          <div className='mt-1'>
                            <input
                              type='radio'
                              checked={selectedAddressId === address.id}
                              onChange={() => setSelectedAddressId(address.id)}
                              className='text-orange-600'
                            />
                          </div>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-1'>
                              <span className='font-medium text-gray-900'>{address.name}</span>
                              <span className='text-sm text-gray-600'>|</span>
                              <span className='text-sm text-gray-600'>{address.phone}</span>
                              {address.isDefault && (
                                <span className='text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded'>
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <p className='text-sm text-gray-600'>{address.address}</p>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Button variant='ghost' size='sm' className='text-blue-600 hover:text-blue-700'>
                            <Edit className='w-4 h-4' />
                          </Button>
                          {!address.isDefault && (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteAddress(address.id)
                              }}
                              className='text-red-500 hover:text-red-600'
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <Card className='bg-white shadow-sm'>
              <CardContent className='p-6'>
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
              </CardContent>
            </Card>
          </div>

          {/* Right: Order Summary */}
          <div className='lg:col-span-1'>
            <div className='sticky top-4'>
              <Card className='bg-white shadow-sm'>
                <CardContent className='p-6'>
                  <h3 className='font-semibold text-lg mb-4'>Tóm tắt đơn hàng</h3>

                  <div className='space-y-3 mb-6'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Sản phẩm (1 món)</span>
                      <span>₫{subtotal.toLocaleString('vi-VN')}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Phí vận chuyển</span>
                      <span>₫{shipping.toLocaleString('vi-VN')}</span>
                    </div>
                    <div className='border-t pt-3'>
                      <div className='flex justify-between text-lg font-bold'>
                        <span>Tổng cộng</span>
                        <span className='text-orange-600'>₫{total.toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <Button
                      onClick={handleCreateOrder}
                      disabled={isSubmitting || isCancelling || !selectedPaymentMethod}
                      className='w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3'
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
                      variant='outline'
                      className='w-full border-red-600 text-red-600 hover:bg-red-50'
                      onClick={handleCancelOrder}
                      disabled={isSubmitting || isCancelling}
                    >
                      {isCancelling ? (
                        <>
                          <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                          Đang hủy...
                        </>
                      ) : (
                        'Hủy đặt hàng'
                      )}
                    </Button>
                  </div>

                  <div className='mt-4 pt-4 border-t space-y-2 text-xs text-gray-500'>
                    <div className='flex items-center gap-2'>
                      <Shield className='w-4 h-4 text-green-600' />
                      <span>Thanh toán an toàn & bảo mật</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Truck className='w-4 h-4 text-green-600' />
                      <span>Giao hàng nhanh toàn quốc</span>
                    </div>
                  </div>

                  {/* Test Data Info */}
                  <div className='mt-4 p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200'>
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Dialog */}
      <CancelOrderDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleConfirmCancel}
        productInfo={{
          name: buyNowProduct.name,
          quantity: buyNowProduct.quantity,
          totalAmount: total
        }}
        isLoading={isCancelling}
      />
    </div>
  )
}
