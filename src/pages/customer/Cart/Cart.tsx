import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Checkbox } from '../../../components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog'
import { MapPin, Trash2, Plus, Minus, ShoppingCart, Truck, Shield, Gift, Edit } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CheckedState } from '@radix-ui/react-checkbox'

type CartItem = {
  id: number
  name: string
  description: string
  price: number
  originalPrice: number
  quantity: number
  image: string
  shop: string
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

export default function Cart() {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 1,
      name: 'Nước mắm Phú Quốc truyền thống',
      description: 'Chai 500ml - Độ đạm 30°N',
      price: 89000,
      originalPrice: 120000,
      quantity: 1,
      image: '/src/assets/BannerWelcome.png',
      shop: 'Cửa hàng Đặc sản miền Nam',
      selected: true,
      inStock: true
    },
    {
      id: 2,
      name: 'Mắm tôm chua Cần Thơ',
      description: 'Hũ 250g - Đặc sản truyền thống',
      price: 65000,
      originalPrice: 85000,
      quantity: 2,
      image: '/src/assets/BannerWelcome.png',
      shop: 'Cửa hàng Đặc sản miền Nam',
      selected: true,
      inStock: true
    },
    {
      id: 3,
      name: 'Bánh tráng nướng Tây Ninh',
      description: 'Gói 200g - Vị tôm cay',
      price: 45000,
      originalPrice: 60000,
      quantity: 1,
      image: '/src/assets/BannerWelcome.png',
      shop: 'Cửa hàng Đặc sản Tây Ninh',
      selected: false,
      inStock: false
    }
  ])

  const [selectAll, setSelectAll] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<number>(1)
  const [isAddingAddress, setIsAddingAddress] = useState(false)
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

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return
    setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
  }

  const toggleItemSelection = (id: number) => {
    setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)))
  }

  const removeItem = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
  }

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll
    setSelectAll(newSelectAll)
    setCartItems((prev) => prev.map((item) => ({ ...item, selected: newSelectAll && item.inStock })))
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

  const selectedItems = cartItems.filter((item) => item.selected)
  const subtotal = selectedItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const shipping = 30000
  const total = subtotal + shipping

  const groupedItems = cartItems.reduce<Record<string, CartItem[]>>((acc, item) => {
    if (!acc[item.shop]) {
      acc[item.shop] = []
    }
    acc[item.shop].push(item)
    return acc
  }, {})

  // Empty state
  if (cartItems.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] bg-gray-50'>
        <ShoppingCart className='w-16 h-16 text-gray-300 mb-4' />
        <h2 className='text-xl font-semibold mb-2 text-gray-700'>Bạn chưa có sản phẩm nào!</h2>
        <Button variant='outline' className='mt-2' onClick={() => navigate('/products')}>
          Tiếp tục mua sắm
        </Button>
      </div>
    )
  }

  return (
    <div className='bg-gray-50 min-h-screen'>
      <div className='container mx-auto px-4 py-6'>
        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
            <ShoppingCart className='w-6 h-6' />
            Giỏ hàng ({cartItems.length} sản phẩm)
          </h1>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          {/* Left: Cart Items */}
          <div className='lg:col-span-3 space-y-4'>
            {/* Select All Header */}
            <Card className='bg-white shadow-sm'>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Checkbox checked={selectAll} onCheckedChange={toggleSelectAll} />
                    <span className='font-medium'>Chọn tất cả ({cartItems.length} sản phẩm)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cart Items by Shop */}
            {Object.entries(groupedItems).map(([shopName, items]) => (
              <Card key={shopName} className='bg-white shadow-sm'>
                <CardContent className='p-0'>
                  {/* Shop Header */}
                  <div className='p-4 border-b bg-gray-50 flex items-center gap-2'>
                    <div className='w-6 h-6 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold'>
                      S
                    </div>
                    <span className='font-medium text-gray-900'>{shopName}</span>
                    <Button variant='ghost' size='sm' className='ml-auto text-orange-600'>
                      Xem shop
                    </Button>
                  </div>

                  {/* Shop Items */}
                  <div className='divide-y'>
                    {(items as CartItem[]).map((item) => (
                      <div key={item.id} className='p-4 flex items-center gap-4'>
                        {/* Checkbox */}
                        <Checkbox
                          checked={item.selected}
                          disabled={!item.inStock}
                          onCheckedChange={() => toggleItemSelection(item.id)}
                        />

                        {/* Product Image */}
                        <div className='relative'>
                          <img
                            src={item.image}
                            alt={item.name}
                            className={`w-20 h-20 rounded object-cover border ${!item.inStock ? 'opacity-50' : ''}`}
                          />
                          {!item.inStock && (
                            <div className='absolute inset-0 bg-black bg-opacity-50 rounded flex items-center justify-center'>
                              <span className='text-white text-xs font-bold'>Hết hàng</span>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className='flex-1 min-w-0'>
                          <h3 className={`font-medium text-gray-900 mb-1 ${!item.inStock ? 'text-gray-400' : ''}`}>
                            {item.name}
                          </h3>
                          <p className='text-sm text-gray-500 mb-2'>{item.description}</p>
                        </div>

                        {/* Quantity Controls */}
                        <div className='flex items-center border rounded min-w-[120px]'>
                          <Button
                            variant='ghost'
                            size='sm'
                            disabled={!item.inStock}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className='h-8 w-8 p-0'
                          >
                            <Minus className='w-3 h-3' />
                          </Button>
                          <Input
                            value={item.quantity}
                            disabled={!item.inStock}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                            className='h-8 w-16 text-center border-none'
                          />
                          <Button
                            variant='ghost'
                            size='sm'
                            disabled={!item.inStock}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className='h-8 w-8 p-0'
                          >
                            <Plus className='w-3 h-3' />
                          </Button>
                        </div>

                        {/* Total Price */}
                        <div className='text-right min-w-[100px]'>
                          <div className='font-bold text-orange-600'>
                            ₫{(item.price * item.quantity).toLocaleString('vi-VN')}
                          </div>
                        </div>

                        {/* Delete Button */}
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => removeItem(item.id)}
                          className='text-gray-400 hover:text-red-500'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

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
          </div>

          {/* Right: Order Summary */}
          <div className='lg:col-span-1'>
            <div className='sticky top-4'>
              <Card className='bg-white shadow-sm'>
                <CardContent className='p-6'>
                  <h3 className='font-semibold text-lg mb-4'>Tóm tắt đơn hàng</h3>

                  <div className='space-y-3 mb-6'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Tạm tính ({selectedItems.length} sản phẩm)</span>
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
                      className='w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3'
                      disabled={selectedItems.length === 0}
                      onClick={() => navigate('/cart/confirm')}
                    >
                      Mua hàng ({selectedItems.length})
                    </Button>
                    <Button variant='outline' className='w-full' onClick={() => navigate('/products')}>
                      Tiếp tục mua sắm
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
