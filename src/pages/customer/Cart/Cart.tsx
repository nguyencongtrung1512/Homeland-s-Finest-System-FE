// Cart component
import { Button } from '../../../components/ui/button'
import { Plus, Minus, ShoppingCart, Trash2, Store, MapPin, Edit, Trash, Gift, Tag } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../../contexts/cart.context'
import { useAuth } from '../../../contexts/auth.context'
import { updateCartItem, removeCartItem, getCartByUserId, removePromotionFromCart } from '../../../apis/cart.api'
import { toast } from 'react-toastify'
import { createOrder } from '../../../apis/order.api'
import { addressApi } from '../../../apis/address.api'
import type { CartData, CartItem as APICartItem } from '../../../types/cartType'
import type { Address } from '../../../types/addressType'

// Import Promotion Components
import { PromotionModal } from '../../../components/Promotion'
import AppliedPromotionModal from '../../../components/Cart/AppliedPromotionModal'

type PaymentMethod = 'COD' | 'Banking'

interface ComboGroup {
  comboId: string
  comboName: string
  items: APICartItem[]
  quantity: number
  totalPrice: number
}

interface StorePromotion {
  id: string
  promotionId: string
  title: string
  discountAmount: number
  status: string
  isExpired: boolean
}

type GroupedItem = APICartItem | ComboGroup

export default function Cart() {
  const navigate = useNavigate()
  const { refreshCart, loading } = useCart()
  const { user } = useAuth()
  const [cartData, setCartData] = useState<CartData | null>(null)
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({})
  const [selectAll, setSelectAll] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false)
  const [selectedStoreForPromotion, setSelectedStoreForPromotion] = useState<string | null>(null)
  const [storePromotions] = useState<Record<string, StorePromotion[]>>({})
  const [isAppliedPromotionsModalOpen, setIsAppliedPromotionsModalOpen] = useState(false)
  const [selectedStoreForAppliedPromotions, setSelectedStoreForAppliedPromotions] = useState<string | null>(null)
  const reloadCartData = useCallback(async () => {
    if (!user?.userId) return
    try {
      const response = await getCartByUserId(user.userId)
      console.log('[ReloadCartData] response:', response)
      if (response?.status === 200) {
        setCartData(response.data)
      }
    } catch (error) {
      console.error('Error reloading cart data:', error)
    }
  }, [user?.userId])

  // Helper function to load user addresses
  const loadUserAddresses = useCallback(async () => {
    if (!user?.userId) return

    try {
      const response = await addressApi.getUserAddresses(user.userId)
      if (response?.status === 200) {
        setAddresses(response.data)
        const defaultAddress = response.data.find((addr) => addr.isDefault)
        if (defaultAddress) {
          setSelectedAddress(defaultAddress)
        } else if (response.data.length > 0) {
          setSelectedAddress(response.data[0])
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error)
    }
  }, [user?.userId])

  useEffect(() => {
    reloadCartData()
    loadUserAddresses()
  }, [reloadCartData, loadUserAddresses])

  useEffect(() => {
    if (cartData) {
      const initialSelectedItems: Record<string, boolean> = {}
      cartData.carts.forEach((store) => {
        store.items.forEach((item) => {
          initialSelectedItems[item.id] = true
        })
      })
      setSelectedItems(initialSelectedItems)
      setSelectAll(true)
    }
  }, [cartData])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price)
  }

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (!user?.userId || newQuantity < 1) return

    try {
      await updateCartItem(itemId, newQuantity)
      await refreshCart()
      await reloadCartData()
      toast.success('Cập nhật số lượng thành công')
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast.error('Có lỗi xảy ra khi cập nhật số lượng')
    }
  }

  const removeItem = async (itemId: string) => {
    if (!user?.userId) return

    try {
      await removeCartItem(user.userId, itemId)
      await refreshCart()
      await reloadCartData()
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng')
    } catch (error) {
      console.error('Error removing item:', error)
      toast.error('Có lỗi xảy ra khi xóa sản phẩm')
    }
  }

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll
    setSelectAll(newSelectAll)
    const newSelectedItems: Record<string, boolean> = {}
    if (cartData) {
      cartData.carts.forEach((store) => {
        store.items.forEach((item) => {
          newSelectedItems[item.id] = newSelectAll
        })
      })
    }
    setSelectedItems(newSelectedItems)
  }

  const getTotalItems = () => {
    return cartData ? cartData.carts.reduce((sum, store) => sum + store.items.length, 0) : 0
  }

  const getSelectedTotal = () => {
    let total = 0
    if (cartData) {
      cartData.carts.forEach((store) => {
        store.items.forEach((item) => {
          if (selectedItems[item.id]) {
            total += item.totalPrice
          }
        })
      })
    }
    return total
  }

  const getSelectedCount = () => {
    return Object.values(selectedItems).filter(Boolean).length
  }

  // Get promotions for a specific store
  const getStorePromotions = (storeId: string) => {
    return storePromotions[storeId] || []
  }

  // Calculate discount for a specific store
  const getStoreDiscount = (storeId: string) => {
    const store = cartData?.carts.find((s) => s.storeId === storeId)
    if (!store) return 0

    let discount = 0

    // Check if store has free shipping
    if (store.hasFreeship) {
      discount += shippingFee // Free shipping = shipping fee discount
      console.log('🚚 Free shipping applied for store:', store.storeName, 'discount:', shippingFee)
    }

    // Add applied promotions discount
    if (store.appliedPromotions) {
      const promotionDiscount = store.appliedPromotions.reduce((sum, promo) => {
        if (!promo.isExpired && promo.status === 'Reserved') {
          return sum + promo.discountAmount
        }
        return sum
      }, 0)
      discount += promotionDiscount
      console.log('🎁 Promotion discount for store:', store.storeName, 'discount:', promotionDiscount)
    }

    // Fallback to mock promotions if no appliedPromotions
    const promotions = getStorePromotions(storeId)
    const mockDiscount = promotions.reduce((sum, promo) => {
      if (!promo.isExpired && promo.status === 'Reserved') {
        return sum + promo.discountAmount
      }
      return sum
    }, 0)
    discount += mockDiscount

    console.log('💰 Total discount for store:', store.storeName, 'total:', discount)
    return discount
  }

  const getTotalDiscount = () => {
    if (!cartData) return 0
    return cartData.carts.reduce((total, store) => {
      return total + getStoreDiscount(store.storeId)
    }, 0)
  }

  const groupComboItems = (items: APICartItem[]): GroupedItem[] => {
    const grouped: GroupedItem[] = []
    const comboMap = new Map<string, ComboGroup>()

    items.forEach((item) => {
      if (item.isCombo) {
        if (!comboMap.has(item.comboId)) {
          comboMap.set(item.comboId, {
            comboId: item.comboId,
            comboName: 'Combo',
            items: [],
            quantity: item.quantity,
            totalPrice: 0
          })
        }
        const combo = comboMap.get(item.comboId)!
        combo.items.push(item)
        combo.totalPrice += item.totalPrice
      } else {
        grouped.push(item)
      }
    })

    comboMap.forEach((combo) => {
      grouped.push(combo)
    })

    return grouped
  }

  const handleCreateOrder = async () => {
    try {
      if (!user?.userId) {
        toast.error('Vui lòng đăng nhập trước khi đặt hàng')
        return
      }

      const selectedItemsList = cartData
        ? cartData.carts.flatMap((store) => store.items.filter((item) => selectedItems[item.id]))
        : []

      if (selectedItemsList.length === 0) {
        toast.error('Vui lòng chọn ít nhất một sản phẩm')
        return
      }
      if (!selectedPaymentMethod) {
        toast.error('Vui lòng chọn phương thức thanh toán')
        return
      }

      setIsSubmitting(true)

      if (!selectedAddress) {
        toast.error('Vui lòng chọn địa chỉ giao hàng')
        return
      }

      const orderData = {
        userId: user.userId,
        userAddressId: selectedAddress.id,
        paymentMethod: selectedPaymentMethod,
        orderItemCreates: selectedItemsList.map((item) => ({
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          ...(item.isCombo && item.comboId ? { comboId: item.comboId } : {})
        })),
        // Include applied promotions for each store
        appliedPromotions: Object.entries(storePromotions).flatMap(([storeId, promotions]) =>
          promotions
            .filter((promo) => !promo.isExpired && promo.status === 'Reserved')
            .map((promo) => ({
              storeId,
              promotionId: promo.promotionId,
              discountAmount: promo.discountAmount
            }))
        )
      }

      const createdOrder = await createOrder(orderData)
      toast.success('Đơn hàng đã được tạo! Đang chuyển đến trang thanh toán...')

      // Store selected item IDs for later clearing after successful payment
      const selectedItemIds = selectedItemsList.map((item) => item.id)

      navigate('/cart/create-order', {
        state: {
          order: createdOrder[0], // Lấy order đầu tiên từ array
          paymentMethod: selectedPaymentMethod,
          selectedItemIds: selectedItemIds, // Pass item IDs to clear later
          appliedPromotions: storePromotions // Pass promotions for order confirmation
        }
      })
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error).message ||
        'Có lỗi xảy ra khi đặt hàng'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Promotion handlers for specific store
  const handleOpenPromotionModal = (storeId: string) => {
    setSelectedStoreForPromotion(storeId)
    setIsPromotionModalOpen(true)
  }

  const handleOpenAppliedPromotionsModal = (storeId: string) => {
    const store = cartData?.carts.find((s) => s.storeId === storeId)
    if (store?.appliedPromotions && store.appliedPromotions.length > 0) {
      setSelectedStoreForAppliedPromotions(storeId)
      setIsAppliedPromotionsModalOpen(true)
    }
  }

  const handleApplyPromotion = async () => {
    if (!selectedStoreForPromotion) return false

    try {
      // Reload cart data to get updated appliedPromotions
      await reloadCartData()

      setIsPromotionModalOpen(false)
      setSelectedStoreForPromotion(null)
      toast.success('Áp dụng mã giảm giá thành công')
      return true
    } catch {
      toast.error('Có lỗi xảy ra khi áp dụng mã giảm giá')
      return false
    }
  }

  const handleRemoveAppliedPromotion = async (cartId: string, promotionId: string) => {
    try {
      await removePromotionFromCart(cartId, promotionId)
      await reloadCartData() // Reload cart data to get updated appliedPromotions
      toast.success('Hủy mã giảm giá thành công')
    } catch (error) {
      console.error('Error removing applied promotion:', error)
      toast.error('Có lỗi xảy ra khi hủy mã giảm giá')
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

  if (!cartData || cartData.carts.length === 0) {
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

  const shippingFee = 30000
  const subtotal = getSelectedTotal()
  const totalDiscount = getTotalDiscount()
  const finalTotal = Math.max(0, subtotal + shippingFee - totalDiscount)

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='flex items-center gap-3 mb-6'>
          <ShoppingCart className='w-8 h-8 text-orange-600' />
          <h1 className='text-3xl font-bold text-gray-800'>Giỏ hàng ({getTotalItems()} sản phẩm)</h1>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Cart Items */}
          <div className='lg:col-span-2 space-y-4'>
            {/* Select All */}
            <div className='bg-white rounded-lg shadow-sm p-4'>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  className='w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500'
                />
                <span className='text-gray-700'>Chọn tất cả ({getTotalItems()} sản phẩm)</span>
              </label>
            </div>

            {/* Store Items */}
            {cartData.carts.map((store) => (
              <div key={store.cartId} className='bg-white rounded-lg shadow-sm overflow-hidden'>
                {/* Store Header */}
                <div className='bg-orange-50 px-4 py-3 border-b border-orange-100'>
                  <div className='flex items-center justify-between mb-2'>
                    <div className='flex items-center gap-2'>
                      <Store className='w-5 h-5 text-orange-600' />
                      <span className='font-semibold text-gray-800'>{store.storeName}</span>
                      {store.hasFreeship && (
                        <span className='bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium'>
                          Miễn phí vận chuyển
                        </span>
                      )}
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleOpenPromotionModal(store.storeId)}
                        className='text-xs'
                      >
                        <Tag className='h-3 w-3 mr-1' />
                        Mã giảm giá
                      </Button>
                      {store.appliedPromotions && store.appliedPromotions.length > 0 && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleOpenAppliedPromotionsModal(store.storeId)}
                          className='text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                        >
                          <Gift className='h-3 w-3 mr-1' />
                          Xem voucher ({store.appliedPromotions.length})
                        </Button>
                      )}
                      <button className='text-sm text-orange-600 hover:text-orange-700 font-medium'>Xem shop</button>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className='divide-y divide-gray-100'>
                  {groupComboItems(store.items).map((item) => {
                    // Check if it's a combo group
                    if ('comboId' in item && 'items' in item) {
                      const comboItem = item as ComboGroup
                      return (
                        <div key={comboItem.comboId} className='p-4 bg-purple-50'>
                          <div className='flex items-start gap-4'>
                            <input
                              type='checkbox'
                              checked={comboItem.items.every((i: APICartItem) => selectedItems[i.id])}
                              onChange={() => {
                                comboItem.items.forEach((i: APICartItem) => toggleItemSelection(i.id))
                              }}
                              className='w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 mt-1'
                            />

                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-3'>
                                <span className='bg-purple-600 text-white text-xs px-2 py-1 rounded'>
                                  Sản phẩm combo
                                </span>
                                <span className='text-purple-600 font-medium text-sm'>COMBO</span>
                              </div>

                              <div className='bg-white rounded-lg p-3 mb-2'>
                                <div className='flex justify-between items-start mb-2'>
                                  <h3 className='font-semibold text-gray-800'>{comboItem.comboName}</h3>
                                  <button
                                    onClick={() => removeItem(comboItem.items[0].id)}
                                    className='text-gray-400 hover:text-red-500'
                                  >
                                    <Trash2 className='w-4 h-4' />
                                  </button>
                                </div>
                                <p className='text-sm text-gray-600 mb-3'>
                                  {comboItem.items.length} sản phẩm trong combo
                                </p>
                                <div className='flex items-center justify-between'>
                                  <div className='flex items-center gap-3'>
                                    <button
                                      onClick={() => updateQuantity(comboItem.items[0].id, comboItem.quantity - 1)}
                                      className='w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50'
                                    >
                                      <Minus className='w-4 h-4' />
                                    </button>
                                    <span className='w-12 text-center font-medium'>{comboItem.quantity}</span>
                                    <button
                                      onClick={() => updateQuantity(comboItem.items[0].id, comboItem.quantity + 1)}
                                      className='w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50'
                                    >
                                      <Plus className='w-4 h-4' />
                                    </button>
                                  </div>
                                  <div className='text-right'>
                                    <p className='text-purple-600 font-bold text-lg'>
                                      ₫{formatPrice(comboItem.totalPrice)}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Combo Items */}
                              <div className='space-y-2'>
                                {comboItem.items.map((comboItem: APICartItem) => (
                                  <div key={comboItem.id} className='flex items-center gap-3 bg-white rounded p-2'>
                                    <div className='w-12 h-12 bg-gray-100 rounded flex items-center justify-center'>
                                      <img
                                        src={comboItem.imageUrl || '/api/placeholder/48/48'}
                                        alt={comboItem.name}
                                        className='w-10 h-10 object-cover rounded'
                                      />
                                    </div>
                                    <div className='flex-1'>
                                      <p className='text-sm font-medium text-gray-800'>{comboItem.name}</p>
                                      <p className='text-xs text-gray-500'>
                                        ₫{formatPrice(comboItem.unitPrice)} x {comboItem.quantity}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    // Regular item
                    const regularItem = item as APICartItem
                    return (
                      <div key={regularItem.id} className='p-4'>
                        <div className='flex items-start gap-4'>
                          <input
                            type='checkbox'
                            checked={selectedItems[regularItem.id] || false}
                            onChange={() => toggleItemSelection(regularItem.id)}
                            className='w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 mt-1'
                          />

                          <div className='w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0'>
                            <img
                              src={regularItem.imageUrl || '/api/placeholder/80/80'}
                              alt={regularItem.name}
                              className='w-full h-full object-cover'
                            />
                          </div>

                          <div className='flex-1 min-w-0'>
                            <h3 className='font-semibold text-gray-800 mb-1'>{regularItem.name}</h3>

                            <div className='flex items-center justify-between mt-3'>
                              <div className='flex items-center gap-3'>
                                <button
                                  onClick={() => updateQuantity(regularItem.id, regularItem.quantity - 1)}
                                  className='w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50'
                                  disabled={regularItem.quantity <= 1}
                                >
                                  <Minus className='w-4 h-4' />
                                </button>
                                <span className='w-12 text-center font-medium'>{regularItem.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(regularItem.id, regularItem.quantity + 1)}
                                  className='w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50'
                                >
                                  <Plus className='w-4 h-4' />
                                </button>
                              </div>

                              <div className='text-right'>
                                <p className='text-orange-600 font-bold text-lg'>
                                  ₫{formatPrice(regularItem.totalPrice)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => removeItem(regularItem.id)}
                            className='text-gray-400 hover:text-red-500 flex-shrink-0'
                          >
                            <Trash2 className='w-5 h-5' />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg shadow-sm p-6 sticky top-8'>
              <h2 className='text-lg font-bold text-gray-800 mb-4'>Tóm tắt đơn hàng</h2>

              <div className='space-y-3 mb-4 pb-4 border-b border-gray-200'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Sản phẩm ({getSelectedCount()} món)</span>
                  <span className='font-medium'>₫{formatPrice(subtotal)}</span>
                </div>

                {/* Store-wise breakdown with promotions */}
                {cartData?.carts.map((store) => {
                  const storeSubtotal = store.items
                    .filter((item) => selectedItems[item.id])
                    .reduce((sum, item) => sum + item.totalPrice, 0)
                  const storeDiscount = getStoreDiscount(store.storeId)
                  const storeFinal = Math.max(0, storeSubtotal - storeDiscount)

                  if (storeSubtotal === 0) return null

                  return (
                    <div key={store.storeId} className='ml-4 space-y-1'>
                      <div className='flex justify-between text-xs text-gray-500'>
                        <span>{store.storeName}</span>
                        <span>₫{formatPrice(storeSubtotal)}</span>
                      </div>
                      {storeDiscount > 0 && (
                        <div className='flex justify-between text-xs text-green-600'>
                          <span>
                            {store.hasFreeship && storeDiscount >= shippingFee ? 'Miễn phí vận chuyển' : 'Giảm giá'}
                          </span>
                          <span>-₫{formatPrice(storeDiscount)}</span>
                        </div>
                      )}
                      <div className='flex justify-between text-sm font-medium'>
                        <span>Thành tiền</span>
                        <span>₫{formatPrice(storeFinal)}</span>
                      </div>
                    </div>
                  )
                })}

                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Phí vận chuyển</span>
                  <span className={`font-medium ${getTotalDiscount() > 0 ? 'text-green-600' : ''}`}>
                    {getTotalDiscount() >= shippingFee ? 'Miễn phí' : `₫${formatPrice(shippingFee)}`}
                  </span>
                </div>
              </div>

              <div className='flex justify-between items-center mb-6'>
                <span className='text-lg font-bold text-gray-800'>Tổng cộng</span>
                <div className='text-right'>
                  {totalDiscount > 0 && (
                    <div className='text-sm text-gray-500 line-through'>₫{formatPrice(subtotal + shippingFee)}</div>
                  )}
                  <span className='text-2xl font-bold text-orange-600'>₫{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {/* Savings Summary */}
              {totalDiscount > 0 && (
                <div className='bg-green-50 border border-green-200 rounded-lg p-3 mb-4'>
                  <div className='flex items-center gap-2'>
                    <Gift className='h-4 w-4 text-green-600' />
                    <span className='text-sm font-medium text-green-800'>
                      Bạn đã tiết kiệm được ₫{formatPrice(totalDiscount)}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleCreateOrder}
                className='w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg mb-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                disabled={getSelectedCount() === 0 || !selectedPaymentMethod || !selectedAddress || isSubmitting}
              >
                {isSubmitting ? 'Đang tạo đơn hàng...' : `Mua hàng (${getSelectedCount()})`}
              </button>

              <button
                onClick={() => navigate('/products')}
                className='w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors'
              >
                Tiếp tục mua sắm
              </button>

              <div className='mt-4 pt-4 border-t border-gray-200 space-y-2 text-xs text-gray-600'>
                <div className='flex items-center gap-2'>
                  <div className='w-1 h-1 rounded-full bg-green-500'></div>
                  <span>Thanh toán an toàn & bảo mật</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-1 h-1 rounded-full bg-green-500'></div>
                  <span>Giao hàng nhanh toàn quốc</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Address Section */}
        <div className='mt-6'>
          <div className='bg-white rounded-lg shadow-sm p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <MapPin className='w-6 h-6 text-orange-600' />
              <h2 className='text-xl font-bold text-gray-800'>Địa chỉ giao hàng</h2>
              <button className='ml-auto text-orange-600 hover:text-orange-700 font-medium text-sm'>
                + Thêm địa chỉ mới
              </button>
            </div>

            <div className='space-y-3'>
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedAddress?.id === address.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => setSelectedAddress(address)}
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start gap-3'>
                      <input
                        type='radio'
                        checked={selectedAddress?.id === address.id}
                        onChange={() => setSelectedAddress(address)}
                        className='w-4 h-4 text-orange-600 mt-1'
                      />
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <span className='font-medium text-gray-900'>
                            {user?.email || 'user@example.com'} | 0123456789
                          </span>
                          {address.isDefault && (
                            <span className='bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full'>
                              Mặc định
                            </span>
                          )}
                        </div>
                        <p className='text-gray-600 text-sm'>
                          {address.streetAddress}, {address.ward}, {address.district}, {address.province}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <button className='text-gray-400 hover:text-blue-500'>
                        <Edit className='w-4 h-4' />
                      </button>
                      {!address.isDefault && (
                        <button className='text-gray-400 hover:text-red-500'>
                          <Trash className='w-4 h-4' />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Method Section */}
        <div className='mt-6'>
          <div className='bg-white rounded-lg shadow-sm p-6'>
            <h2 className='text-xl font-bold text-gray-800 mb-4'>Phương thức thanh toán</h2>
            <div className='space-y-3'>
              <label
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${selectedPaymentMethod === 'COD'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
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
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${selectedPaymentMethod === 'Banking'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
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
          </div>
        </div>
      </div>

      {/* Promotion Modal */}
      <PromotionModal
        cartId={cartData?.carts.find(store => store.storeId === selectedStoreForPromotion)?.cartId || ''}
        isOpen={isPromotionModalOpen}
        onClose={() => {
          setIsPromotionModalOpen(false)
          setSelectedStoreForPromotion(null)
        }}
        onApply={handleApplyPromotion}
      />

      {/* Applied Promotions Modal */}
      {selectedStoreForAppliedPromotions && (
        <AppliedPromotionModal
          isOpen={isAppliedPromotionsModalOpen}
          onClose={() => {
            setIsAppliedPromotionsModalOpen(false)
            setSelectedStoreForAppliedPromotions(null)
          }}
          appliedPromotions={
            cartData?.carts.find((store) => store.storeId === selectedStoreForAppliedPromotions)?.appliedPromotions ||
            []
          }
          storeName={
            cartData?.carts.find((store) => store.storeId === selectedStoreForAppliedPromotions)?.storeName || ''
          }
          cartId={cartData?.carts.find((store) => store.storeId === selectedStoreForAppliedPromotions)?.cartId || ''}
          onRemovePromotion={handleRemoveAppliedPromotion}
        />
      )}
    </div>
  )
}
