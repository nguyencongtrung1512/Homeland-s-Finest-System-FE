// Checkout component
import { Button } from '../../../components/ui/button'
import { Textarea } from '../../../components/ui/textarea'
import { ShoppingCart, MapPin, Edit, Trash, Wallet, Loader2, ArrowLeft, Gift, Tag, Store } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../../../contexts/cart.context'
import { useAuth } from '../../../contexts/auth.context'
import { getCartByUserId, removePromotionFromCart, calculateShippingFee } from '../../../apis/cart.api'
import { toast } from '../../../utils/toast'
import { createOrder } from '../../../apis/order.api'
import { addressApi } from '../../../apis/address.api'
import { getWalletBalance } from '../../../apis/wallet.api'
import type { CartData, StoreShippingFee } from '../../../types/cartType'
import type { Address, AddressCreateInput } from '../../../types/addressType'
import type { WalletData } from '../../../types/walletType'
import AddressModal from '../../customer/Profile/components/address/AddressModal'
import { PromotionModal } from '../../../components/Promotion'
import AppliedPromotionModal from '../../../components/Cart/AppliedPromotionModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '../../../components/ui/alert-dialog'

type PaymentMethod = 'COD' | 'Banking' | 'MyWallet'

export default function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { clearCartAfterOrder } = useCart()
  const { user } = useAuth()
  const [cartData, setCartData] = useState<CartData | null>(location.state?.cartData || null)
  const [selectedItems] = useState<Record<string, boolean>>(location.state?.selectedItems || {})
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>()
  const [orderNote, setOrderNote] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [walletBalance, setWalletBalance] = useState<WalletData | null>(null)
  const [isLoadingWallet, setIsLoadingWallet] = useState(false)
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false)
  const [selectedStoreForPromotion, setSelectedStoreForPromotion] = useState<string | null>(null)
  const [isAppliedPromotionsModalOpen, setIsAppliedPromotionsModalOpen] = useState(false)
  const [selectedStoreForAppliedPromotions, setSelectedStoreForAppliedPromotions] = useState<string | null>(null)
  const isRemovingExpiredPromotions = useRef(false) // Track if we're removing expired promotions
  const [shippingFeeData, setShippingFeeData] = useState<StoreShippingFee[] | null>(null)
  const [isLoadingShippingFee, setIsLoadingShippingFee] = useState(false)

  // Address management states
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null)

  // Helper function to filter active addresses
  const toArray = <T,>(x: T | T[] | null | undefined): T[] => (Array.isArray(x) ? x : x ? [x] : [])
  const isActiveAddress = (a: Address | null | undefined): a is Address => !!a && a.isActive === true

  // Helper function to load user addresses
  const loadUserAddresses = useCallback(async () => {
    if (!user?.userId) return

    try {
      const response = await addressApi.getUserAddresses(user.userId)
      if (response?.status === 200) {
        // Filter only active addresses
        const activeAddresses = toArray<Address>(response.data).filter(isActiveAddress)
        setAddresses(activeAddresses)

        const defaultAddress = activeAddresses.find((addr) => addr.isDefault)
        if (defaultAddress) {
          setSelectedAddress(defaultAddress)
        } else if (activeAddresses.length > 0) {
          setSelectedAddress(activeAddresses[0])
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error)
    }
  }, [user?.userId])

  // Reload cart data
  const reloadCartData = useCallback(async () => {
    if (!user?.userId) return
    try {
      const response = await getCartByUserId(user.userId)
      if (response?.status === 200) {
        setCartData(response.data)
      }
    } catch (error) {
      console.error('Error reloading cart data:', error)
    }
  }, [user?.userId])

  useEffect(() => {
    if (!cartData || !location.state?.cartData) {
      reloadCartData()
    }
    loadUserAddresses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto remove expired promotions
  useEffect(() => {
    const removeExpiredPromotions = async () => {
      if (!cartData || !user?.userId || isRemovingExpiredPromotions.current) return

      const expiredPromotions: Array<{ cartId: string; promotionId: string; storeIndex: number }> = []

      cartData.carts.forEach((store, storeIndex) => {
        if (store.appliedPromotions) {
          store.appliedPromotions.forEach((promo) => {
            if (promo.isExpired) {
              expiredPromotions.push({
                cartId: store.cartId,
                promotionId: promo.promotionId,
                storeIndex
              })
            }
          })
        }
      })

      if (expiredPromotions.length > 0) {
        isRemovingExpiredPromotions.current = true

        // Update local state immediately to hide expired promotions
        setCartData((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            carts: prev.carts.map((store, storeIndex) => {
              const hasExpiredPromotions = expiredPromotions.some(
                (exp) => exp.storeIndex === storeIndex
              )
              if (hasExpiredPromotions && store.appliedPromotions) {
                return {
                  ...store,
                  appliedPromotions: store.appliedPromotions.filter(
                    (promo) => !promo.isExpired
                  )
                }
              }
              return store
            })
          }
        })

        // Silently remove from backend
        try {
          await Promise.all(
            expiredPromotions.map(({ cartId, promotionId }) =>
              removePromotionFromCart(cartId, promotionId)
            )
          )
        } catch (error) {
          console.error('Error removing expired promotions:', error)
        } finally {
          isRemovingExpiredPromotions.current = false
        }
      }
    }

    removeExpiredPromotions()
  }, [cartData, user?.userId])

  // Load wallet balance when payment method is MyWallet
  useEffect(() => {
    const loadWalletBalance = async () => {
      if (selectedPaymentMethod === 'MyWallet') {
        setIsLoadingWallet(true)
        setWalletBalance(null)
        try {
          const walletData = await getWalletBalance()
          if (walletData && typeof walletData === 'object' && 'availableBalance' in walletData) {
            setWalletBalance(walletData)
          } else {
            console.error('[LoadWalletBalance] Invalid wallet data structure:', walletData)
            toast.error('Dữ liệu ví không hợp lệ')
            setWalletBalance(null)
          }
        } catch (error: unknown) {
          console.error('[LoadWalletBalance] Error loading wallet balance:', error)
          const errorMessage =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            (error as { message?: string })?.message ||
            'Không thể tải số dư ví'
          toast.error(errorMessage)
          setWalletBalance(null)
        } finally {
          setIsLoadingWallet(false)
        }
      } else {
        setWalletBalance(null)
      }
    }

    loadWalletBalance()
  }, [selectedPaymentMethod])

  // Calculate shipping fee when address or selected items change
  useEffect(() => {
    const fetchShippingFee = async () => {
      if (!selectedAddress || !cartData) {
        setShippingFeeData(null)
        return
      }

      // Get selected items
      const selectedItemsList = cartData.carts.flatMap((store) =>
        store.items.filter((item) => selectedItems[item.id] && item.isStock !== false)
      )

      if (selectedItemsList.length === 0) {
        setShippingFeeData(null)
        return
      }

      // Prepare orderItemCreates
      const orderItemCreates = selectedItemsList.map((item) => ({
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        ...(item.isCombo && item.comboId ? { comboId: item.comboId } : {})
      }))

      setIsLoadingShippingFee(true)
      try {
        const response = await calculateShippingFee(orderItemCreates, selectedAddress.id)
        if (response?.status === 200 && response?.data && Array.isArray(response.data)) {
          setShippingFeeData(response.data)
        } else {
          setShippingFeeData(null)
        }
      } catch (error: unknown) {
        console.error('Error calculating shipping fee:', error)
        setShippingFeeData(null)
      } finally {
        setIsLoadingShippingFee(false)
      }
    }

    fetchShippingFee()
  }, [selectedAddress, cartData, selectedItems])

  // Address management handlers
  const handleAddAddress = () => {
    setEditingAddress(null)
    setShowAddressModal(true)
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setShowAddressModal(true)
  }

  const handleDeleteClick = (addressId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setAddressToDelete(addressId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!addressToDelete || !user?.userId) return

    const deletedAddressId = addressToDelete
    const wasSelectedAddress = selectedAddress?.id === deletedAddressId

    try {
      await addressApi.delete(deletedAddressId)
      toast.success('Đã xóa địa chỉ thành công!', {
        position: 'top-right',
        autoClose: 2000
      })

      const remainingAddresses = addresses.filter((addr) => addr.id !== deletedAddressId)
      setAddresses(remainingAddresses)

      if (wasSelectedAddress) {
        if (remainingAddresses.length > 0) {
          setSelectedAddress(remainingAddresses[0])
        } else {
          setSelectedAddress(null)
        }
      }

      await loadUserAddresses()
    } catch (error) {
      console.error('Error deleting address:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error).message ||
        'Không thể xóa địa chỉ'
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 4000
      })
    } finally {
      setDeleteDialogOpen(false)
      setAddressToDelete(null)
    }
  }

  const handleSetDefault = async (addressId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!user?.userId) {
      toast.error('Không tìm thấy thông tin người dùng')
      return
    }

    try {
      await addressApi.setAsDefault(addressId, user.userId)
      await loadUserAddresses()
      toast.success('Đã đặt địa chỉ mặc định thành công!')
    } catch (error) {
      console.error('Error setting default address:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error).message ||
        'Không thể đặt địa chỉ mặc định'
      toast.error(errorMessage)
    }
  }

  const handleSaveAddress = async (formData: AddressCreateInput) => {
    if (!user?.userId) return

    try {
      if (editingAddress) {
        const updateData = {
          userId: user.userId,
          province: formData.province,
          district: formData.district,
          ward: formData.ward,
          provinceId: formData.provinceId,
          districtId: formData.districtId,
          wardId: formData.wardId,
          streetAddress: formData.streetAddress,
          isDefault: formData.isDefault
        }
        await addressApi.update(editingAddress.id, updateData)
        toast.success('Cập nhật địa chỉ thành công!')
      } else {
        await addressApi.create(formData)
        toast.success('Thêm địa chỉ thành công!')
      }

      setShowAddressModal(false)
      setEditingAddress(null)
      await loadUserAddresses()
    } catch (error) {
      console.error('Error saving address:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error).message ||
        'Có lỗi xảy ra khi lưu địa chỉ'
      toast.error(errorMessage)
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
      // Note: Toast message is already shown in PromotionModal from backend response
      return true
    } catch {
      // Note: Error toast is already shown in PromotionModal from backend response
      return false
    }
  }

  const handleRemoveAppliedPromotion = async (cartId: string, promotionId: string, silent?: boolean) => {
    try {
      const response = await removePromotionFromCart(cartId, promotionId)
      await reloadCartData() // Reload cart data to get updated appliedPromotions
      if (!silent) {
        // Show success message from backend
        const successMessage = response?.message || 'Hủy Mã khuyến mãi thành công'
        toast.success(successMessage)
      }
    } catch (error: unknown) {
      console.error('Error removing applied promotion:', error)
      if (!silent) {
        // Extract error message from backend response
        let errorMessage = 'Có lỗi xảy ra khi hủy Mã khuyến mãi'
        const apiError = error as { error?: string; message?: string; errors?: string[] | Record<string, string[]> }

        if (apiError?.error) {
          errorMessage = apiError.error
        } else if (apiError?.message) {
          errorMessage = apiError.message
        } else if (apiError?.errors) {
          if (Array.isArray(apiError.errors)) {
            errorMessage = apiError.errors.join(', ')
          } else if (typeof apiError.errors === 'object') {
            const errorMessages = Object.values(apiError.errors).flat()
            errorMessage = errorMessages.join(', ')
          }
        }

        toast.error(errorMessage)
      }
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price)
  }

  const getSelectedTotal = () => {
    let total = 0
    const comboOutOfStockMap = new Map<string, boolean>()

    if (cartData) {
      cartData.carts.forEach((store) => {
        store.items.forEach((item) => {
          if (item.isCombo && item.comboId) {
            if (item.isStock === false) {
              comboOutOfStockMap.set(item.comboId, true)
            } else if (!comboOutOfStockMap.has(item.comboId)) {
              comboOutOfStockMap.set(item.comboId, false)
            }
          }
        })
      })

      cartData.carts.forEach((store) => {
        store.items.forEach((item) => {
          const isInStock = item.isStock !== false
          const isComboDisabled = item.isCombo && item.comboId && comboOutOfStockMap.get(item.comboId)
          if (selectedItems[item.id] && isInStock && !isComboDisabled) {
            total += item.totalPrice
          }
        })
      })
    }
    return total
  }

  const getStoreDiscount = (storeId: string) => {
    const store = cartData?.carts.find((s) => s.storeId === storeId)
    if (!store) return 0

    let discount = 0

    if (store.appliedPromotions) {
      const promotionDiscount = store.appliedPromotions.reduce((sum, promo) => {
        if (!promo.isExpired && promo.status === 'Reserved') {
          return sum + promo.discountAmount
        }
        return sum
      }, 0)
      discount += promotionDiscount
    }

    return discount
  }

  const getTotalDiscount = () => {
    if (!cartData) return 0
    return cartData.carts.reduce((total, store) => {
      return total + getStoreDiscount(store.storeId)
    }, 0)
  }

  const hasOutOfStockSelectedItems = () => {
    if (!cartData) return false
    const comboOutOfStockMap = new Map<string, boolean>()

    cartData.carts.forEach((store) => {
      store.items.forEach((item) => {
        if (item.isCombo && item.comboId) {
          if (item.isStock === false) {
            comboOutOfStockMap.set(item.comboId, true)
          } else if (!comboOutOfStockMap.has(item.comboId)) {
            comboOutOfStockMap.set(item.comboId, false)
          }
        }
      })
    })

    return cartData.carts.some((store) =>
      store.items.some((item) => {
        const isInStock = item.isStock !== false
        const isComboDisabled = item.isCombo && item.comboId && comboOutOfStockMap.get(item.comboId)
        return selectedItems[item.id] && (!isInStock || isComboDisabled)
      })
    )
  }

  const handleCreateOrder = async () => {
    try {
      if (!user?.userId) {
        toast.error('Vui lòng đăng nhập trước khi đặt hàng')
        return
      }

      const selectedItemsList = cartData
        ? cartData.carts.flatMap((store) => store.items.filter((item) => selectedItems[item.id] && item.isStock !== false))
        : []

      if (selectedItemsList.length === 0) {
        toast.error('Vui lòng chọn ít nhất một sản phẩm còn hàng')
        return
      }

      const outOfStockSelected = cartData
        ? cartData.carts.some((store) => store.items.some((item) => selectedItems[item.id] && item.isStock === false))
        : false

      if (outOfStockSelected) {
        toast.error('Vui lòng bỏ chọn các sản phẩm đã hết hàng')
        return
      }

      if (!selectedPaymentMethod) {
        toast.error('Vui lòng chọn phương thức thanh toán')
        return
      }

      setIsSubmitting(true)

      if (!selectedAddress) {
        toast.error('Vui lòng chọn địa chỉ giao hàng')
        setIsSubmitting(false)
        return
      }

      // Create storePromotions from appliedPromotions in cart data
      const storePromotionsMap = new Map<string, string[]>()

      if (cartData) {
        cartData.carts.forEach((store) => {
          const hasSelectedItems = store.items.some((item) => selectedItems[item.id])

          if (hasSelectedItems && store.appliedPromotions && store.appliedPromotions.length > 0) {
            const validPromotionIds = store.appliedPromotions
              .filter((promo) => !promo.isExpired && promo.status === 'Reserved')
              .map((promo) => promo.promotionId)

            if (validPromotionIds.length > 0) {
              storePromotionsMap.set(store.storeId, validPromotionIds)
            }
          }
        })
      }

      const storePromotionsArray = Array.from(storePromotionsMap.entries()).map(([storeId, promotionIds]) => ({
        storeId,
        promotionIds
      }))

      const orderData = {
        userId: user.userId,
        userAddressId: selectedAddress.id,
        paymentMethod: selectedPaymentMethod,
        note: orderNote.trim() || '',
        orderItemCreates: selectedItemsList.map((item) => ({
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          ...(item.isCombo && item.comboId ? { comboId: item.comboId } : {})
        })),
        storePromotions: storePromotionsArray
      }

      const createdOrder = await createOrder(orderData)
      toast.success('Đơn hàng đã được tạo! Đang chuyển đến trang thanh toán...')

      const selectedItemIds = selectedItemsList.map((item) => item.id)

      await clearCartAfterOrder(selectedItemIds)

      navigate('/cart/create-order', {
        state: {
          orders: createdOrder,
          paymentMethod: selectedPaymentMethod,
          selectedItemIds: selectedItemIds,
          selectedAddress: selectedAddress,
          appliedPromotions: storePromotionsArray
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

  const subtotal = getSelectedTotal()
  const totalDiscount = getTotalDiscount()

  // Check if any selected store has free ship
  const hasFreeShip = cartData
    ? cartData.carts.some((store) => {
      const hasSelectedItems = store.items.some((item) => selectedItems[item.id])
      return hasSelectedItems && store.hasFreeship
    })
    : false

  // Calculate shipping fee from API, but set to 0 if free ship
  const calculatedShippingFee = shippingFeeData ? shippingFeeData.reduce((sum, store) => sum + store.shipPrice, 0) : 0
  const shippingFee = hasFreeShip ? 0 : calculatedShippingFee

  // Final total includes shipping fee if not free ship
  const finalTotal = Math.max(0, subtotal - totalDiscount + shippingFee)
  const selectedItemsList = cartData
    ? cartData.carts.flatMap((store) =>
      store.items
        .filter((item) => selectedItems[item.id])
        .map((item) => ({
          ...item,
          storeId: store.storeId,
          storeName: store.storeName,
          hasFreeship: store.hasFreeship
        }))
    )
    : []

  // Check if wallet balance is sufficient
  const isWalletBalanceSufficient =
    selectedPaymentMethod === 'MyWallet' && walletBalance ? walletBalance.availableBalance >= finalTotal : false

  if (!cartData || cartData.carts.length === 0) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <ShoppingCart size={64} className='mx-auto text-gray-400 mb-4' />
          <h2 className='text-2xl font-semibold text-gray-700 mb-2'>Giỏ hàng trống</h2>
          <p className='text-gray-500 mb-6'>Vui lòng quay lại giỏ hàng để chọn sản phẩm</p>
          <Button onClick={() => navigate('/cart')} className='bg-green-600 hover:bg-green-700'>
            Quay lại giỏ hàng
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='flex items-center gap-3 mb-6'>
          <button
            onClick={() => navigate('/cart')}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            title='Quay lại giỏ hàng'
          >
            <ArrowLeft className='w-6 h-6 text-gray-600' />
          </button>
          <ShoppingCart className='w-8 h-8 text-orange-600' />
          <h1 className='text-3xl font-bold text-gray-800'>Thanh toán</h1>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>

          {/* Selected Cart Items */}
          <div className='lg:col-span-2 space-y-4'>
            {/* Delivery Address Section */}
            <div className='bg-white rounded-lg shadow-sm p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <MapPin className='w-6 h-6 text-green-600' />
                <h2 className='text-xl font-bold text-gray-800'>Địa chỉ giao hàng</h2>
                <button
                  onClick={handleAddAddress}
                  className='ml-auto text-green-600 hover:text-green-700 font-medium text-sm'
                >
                  + Thêm địa chỉ mới
                </button>
              </div>

              <div className='space-y-3'>
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedAddress?.id === address.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                    onClick={() => {
                      setSelectedAddress(address)
                    }}
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex items-start gap-3'>
                        <input
                          type='radio'
                          checked={selectedAddress?.id === address.id}
                          onChange={() => {
                            setSelectedAddress(address)
                          }}
                          className='w-4 h-4 text-orange-600 mt-1'
                        />
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
                            <span className='font-medium text-gray-900'>
                              {address?.receiverName} | {address?.receiverPhoneNumber}
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditAddress(address)
                          }}
                          className='text-gray-400 hover:text-blue-500'
                          title='Sửa địa chỉ'
                        >
                          <Edit className='w-4 h-4' />
                        </button>
                        {!address.isDefault && (
                          <button
                            onClick={(e) => handleDeleteClick(address.id, e)}
                            className='text-gray-400 hover:text-red-500'
                            title='Xóa địa chỉ'
                          >
                            <Trash className='w-4 h-4' />
                          </button>
                        )}
                        {!address.isDefault && (
                          <button
                            onClick={(e) => handleSetDefault(address.id, e)}
                            className='text-xs text-green-600 hover:text-green-700 px-2 py-1 rounded border border-green-300 hover:bg-green-50'
                            title='Đặt làm mặc định'
                          >
                            Đặt mặc định
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className='bg-white rounded-lg shadow-sm p-6'>
              <h2 className='text-xl font-bold text-gray-800 mb-4'>Sản phẩm đã chọn</h2>
              <div className='space-y-4'>
                {cartData.carts.map((store) => (
                  <div key={store.cartId} className='border-b border-gray-200 pb-4 last:border-b-0 last:pb-0'>
                    <div className='bg-green-50 px-4 py-3 rounded-lg mb-3 border border-green-200'>
                      <div className='flex items-center justify-between mb-2'>
                        <div className='flex items-center gap-2'>
                          <Store className='w-5 h-5 text-green-600' />
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
                            Mã khuyến mãi
                          </Button>
                          {store.appliedPromotions && store.appliedPromotions.length > 0 && (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleOpenAppliedPromotionsModal(store.storeId)}
                              className='text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                            >
                              <Gift className='h-3 w-3 mr-1' />
                              Đã áp dụng ({store.appliedPromotions.length})
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className='space-y-3'>
                      {store.items
                        .filter((item) => selectedItems[item.id])
                        .map((item) => (
                          <div key={item.id} className='flex items-start gap-4 p-3 bg-gray-50 rounded-lg'>
                            <div className='w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0'>
                              <img
                                src={item.imageUrl || '/api/placeholder/64/64'}
                                alt={item.name}
                                className='w-full h-full object-cover'
                              />
                            </div>
                            <div className='flex-1 min-w-0'>
                              <h3 className='font-semibold text-gray-800 mb-1'>{item.name}</h3>
                              <div className='flex items-center justify-between'>
                                <div className='flex flex-col'>
                                  <span className='text-sm text-gray-500'>Số lượng: {item.quantity}</span>
                                  <span className='text-xs text-gray-400'>
                                    ₫{formatPrice(item.unitPrice)}/sản phẩm
                                  </span>
                                </div>
                                <span className='text-lg font-bold text-orange-600'>
                                  ₫{formatPrice(item.totalPrice)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>



            {/* Payment Method Section */}
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

                <label
                  className={`flex items-center gap-3 p-4 border rounded-lg transition-all ${selectedPaymentMethod === 'MyWallet' && walletBalance && !isWalletBalanceSufficient
                    ? 'border-red-300 bg-red-50'
                    : selectedPaymentMethod === 'MyWallet'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                    } cursor-pointer`}
                >
                  <input
                    type='radio'
                    name='paymentMethod'
                    value='MyWallet'
                    checked={selectedPaymentMethod === 'MyWallet'}
                    onChange={(e) => {
                      setSelectedPaymentMethod(e.target.value as PaymentMethod)
                    }}
                    className='w-4 h-4 text-green-600'
                  />
                  <div className='flex-1'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium text-gray-900 flex items-center gap-2'>
                          <Wallet className='w-4 h-4' />
                          Thanh toán bằng ví của tôi
                        </p>
                        {isLoadingWallet ? (
                          <div className='flex items-center gap-2 text-xs text-gray-500 mt-1'>
                            <Loader2 className='w-3 h-3 animate-spin' />
                            <span>Đang tải số dư...</span>
                          </div>
                        ) : walletBalance && walletBalance.availableBalance !== undefined ? (
                          <div className='mt-1'>
                            <p className='text-sm text-gray-500'>
                              Số dư khả dụng:{' '}
                              <span
                                className={`font-semibold ${isWalletBalanceSufficient ? 'text-green-600' : 'text-red-600'
                                  }`}
                              >
                                {walletBalance.availableBalance.toLocaleString('vi-VN')}₫
                              </span>
                            </p>
                            {!isWalletBalanceSufficient && (
                              <p className='text-xs text-red-600 mt-1'>
                                ⚠️ Số dư không đủ. Tổng đơn hàng: {finalTotal.toLocaleString('vi-VN')}₫
                              </p>
                            )}
                          </div>
                        ) : selectedPaymentMethod === 'MyWallet' && !isLoadingWallet ? (
                          <p className='text-sm text-red-500 mt-1'>Không thể tải số dư ví</p>
                        ) : (
                          <p className='text-sm text-gray-500 mt-1'>Thanh toán từ số dư ví của bạn</p>
                        )}
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Order Note Section */}
            <div className='bg-white rounded-lg shadow-sm p-6'>
              <h2 className='text-xl font-bold text-gray-800 mb-4'>Ghi chú đơn hàng</h2>
              <Textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder='Nhập ghi chú cho đơn hàng (tùy chọn)...'
                className='min-h-[100px] resize-none'
                maxLength={500}
              />
              <p className='text-xs text-gray-500 mt-2'>{orderNote.length}/500 ký tự</p>
            </div>
          </div>

          {/* Order Summary */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg shadow-sm p-6 sticky top-8'>
              <h2 className='text-lg font-bold text-gray-800 mb-4'>Tóm tắt đơn hàng</h2>

              <div className='space-y-3 mb-4 pb-4 border-b border-gray-200'>
                <div className='space-y-2 max-h-64 overflow-y-auto pr-1'>
                  {selectedItemsList.map((item) => (
                    <div key={item.id} className='flex justify-between text-sm text-gray-700'>
                      <span className='truncate pr-4'>{item.name}</span>
                      <span>₫{formatPrice(item.totalPrice)}</span>
                    </div>
                  ))}
                  {selectedItemsList.length === 0 && (
                    <p className='text-xs text-gray-500'>Chưa có sản phẩm được chọn.</p>
                  )}
                </div>
              </div>

              <div className='space-y-2 mb-4 pb-4 border-b border-gray-200'>
                <div className='flex justify-between text-sm text-gray-700'>
                  <span>Tạm tính:</span>
                  <span>₫{formatPrice(subtotal)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className='flex justify-between text-sm text-green-600'>
                    <span>Giảm giá:</span>
                    <span>-₫{formatPrice(totalDiscount)}</span>
                  </div>
                )}
                <div className='flex justify-between text-sm text-gray-700'>
                  <span>Phí vận chuyển:</span>
                  {isLoadingShippingFee ? (
                    <div className='flex items-center gap-1'>
                      <Loader2 className='w-3 h-3 animate-spin' />
                      <span>Đang tính...</span>
                    </div>
                  ) : hasFreeShip ? (
                    <span className='text-green-600 font-medium'>Miễn phí</span>
                  ) : shippingFeeData ? (
                    <span>
                      {shippingFee === 0 ? (
                        <span className='text-green-600 font-medium'>Miễn phí</span>
                      ) : (
                        `₫${formatPrice(shippingFee)}`
                      )}
                    </span>
                  ) : (
                    <span className='text-gray-400'>Chưa tính</span>
                  )}
                </div>
              </div>

              <div className='flex justify-between items-center mb-6'>
                <span className='text-lg font-bold text-gray-800'>Tổng cộng</span>
                <div className='text-right'>
                  {totalDiscount > 0 && (
                    <div className='text-sm text-gray-500 line-through'>₫{formatPrice(subtotal)}</div>
                  )}
                  <span className='text-2xl font-bold text-orange-600'>₫{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {totalDiscount > 0 && (
                <div className='bg-green-50 border border-green-200 rounded-lg p-3 mb-4'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium text-green-800'>
                      Bạn đã tiết kiệm được ₫{formatPrice(totalDiscount)}
                    </span>
                  </div>
                </div>
              )}

              <div className='flex flex-col gap-4'>
                <button
                  onClick={handleCreateOrder}
                  className='w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg mb-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  disabled={
                    selectedItemsList.length === 0 ||
                    !selectedPaymentMethod ||
                    !selectedAddress ||
                    isSubmitting ||
                    isLoadingWallet ||
                    (selectedPaymentMethod === 'MyWallet' && !isWalletBalanceSufficient) ||
                    hasOutOfStockSelectedItems()
                  }
                >
                  {isSubmitting
                    ? 'Đang tạo đơn hàng...'
                    : isLoadingWallet
                      ? 'Đang kiểm tra số dư...'
                      : hasOutOfStockSelectedItems()
                        ? 'Có sản phẩm hết hàng'
                        : selectedPaymentMethod === 'MyWallet' && !isWalletBalanceSufficient
                          ? 'Số dư không đủ'
                          : 'Đặt hàng'}
                </button>

                <button
                  onClick={() => navigate('/cart')}
                  className='w-full hover:bg-green-50 border border-gray-300 text-green-600 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  Quay lại giỏ hàng
                </button>
              </div>
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
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => {
          setShowAddressModal(false)
          setEditingAddress(null)
        }}
        address={editingAddress}
        onSave={handleSaveAddress}
        existingAddresses={addresses}
        userId={user?.userId}
      />

      {/* Delete Address Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa địa chỉ</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa địa chỉ này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAddressToDelete(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className='bg-red-600 hover:bg-red-700 text-white'>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promotion Modal */}
      <PromotionModal
        cartId={cartData?.carts.find((store) => store.storeId === selectedStoreForPromotion)?.cartId || ''}
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
