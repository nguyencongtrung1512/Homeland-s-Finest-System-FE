// Cart component
import { Button } from '../../../components/ui/button'
import { Plus, Minus, ShoppingCart, Trash2, Store, MapPin, Edit, Trash, Gift, Tag, Wallet, Loader2 } from 'lucide-react'
import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../../contexts/cart.context'
import { useAuth } from '../../../contexts/auth.context'
import {
  updateCartItem,
  removeCartItem,
  getCartByUserId,
  removePromotionFromCart,
  updateCombo,
  updateSelectedCartItems
} from '../../../apis/cart.api'
import { getComboById } from '../../../apis/combo.api'
import { toast } from '../../../utils/toast'
import { createOrder } from '../../../apis/order.api'
import { addressApi } from '../../../apis/address.api'
import { getWalletBalance } from '../../../apis/wallet.api'
import type { CartData, CartItem as APICartItem } from '../../../types/cartType'
import type { Address, AddressCreateInput } from '../../../types/addressType'
import type { WalletData } from '../../../types/walletType'
import type { ComboItem as ComboDetailItem } from '../../../types/combo.type'

// Import Promotion Components
import { PromotionModal } from '../../../components/Promotion'
import AppliedPromotionModal from '../../../components/Cart/AppliedPromotionModal'
import AddressModal from '../../customer/Profile/components/address/AddressModal'
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

interface ComboGroup {
  comboId: string
  comboName: string
  items: APICartItem[]
  quantity: number
  totalPrice: number
}

interface ComboChildRequirement {
  requiredQuantity: number
  productName?: string
  imageUrl?: string
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

type StoreSummaryEntry =
  | {
    type: 'combo'
    comboId: string
    comboName: string
    itemCount: number
    quantity: number
    totalPrice: number
  }
  | {
    type: 'single'
    id: string
    name: string
    totalPrice: number
  }

export default function Cart() {
  const navigate = useNavigate()
  const { refreshCart, loading, clearCartAfterOrder, removeComboFromCart } = useCart()
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
  const [walletBalance, setWalletBalance] = useState<WalletData | null>(null)
  const [isLoadingWallet, setIsLoadingWallet] = useState(false)
  const isInitialLoad = useRef(true) // Track if this is the first load
  const quantityUpdateTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const pendingQuantityUpdates = useRef<Record<string, number>>({})
  const [comboNames, setComboNames] = useState<Record<string, string>>({})
  const [comboChildItems, setComboChildItems] = useState<Record<string, Record<string, ComboChildRequirement>>>({})

  // Checkbox styling (gray accent + click animation)
  const checkboxClass =
    'w-5 h-5 rounded border-gray-300 focus:ring-2 focus:ring-gray-400 transition-transform duration-150 ease-out hover:scale-105 active:scale-95'
  const checkboxStyle: CSSProperties = { accentColor: '#6b7280' }

  // Address management states
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null)
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

  // Reset initial load flag when user changes
  useEffect(() => {
    isInitialLoad.current = true
  }, [user?.userId])

  useEffect(() => {
    reloadCartData()
    loadUserAddresses()
  }, [reloadCartData, loadUserAddresses])

  useEffect(() => {
    if (!cartData) return
    const idsToFetch = new Set<string>()
    cartData.carts.forEach((store) => {
      store.items.forEach((item) => {
        if (item.isCombo && item.comboId && (!comboNames[item.comboId] || !comboChildItems[item.comboId])) {
          idsToFetch.add(item.comboId)
        }
      })
    })
    if (idsToFetch.size === 0) return
    let isCancelled = false
    const fetchComboDetails = async () => {
      try {
        const comboEntries = await Promise.all(
          Array.from(idsToFetch).map(async (comboId) => {
            try {
              const response = await getComboById(comboId)
              const comboData = response?.data?.data || response?.data
              const name = comboData?.name || 'Combo'
              const comboItems = (comboData?.comboItems ?? []) as ComboDetailItem[]
              const quantityMap = comboItems.reduce<Record<string, ComboChildRequirement>>((acc, comboItem) => {
                if (!comboItem.productVariantId) return acc
                acc[comboItem.productVariantId] = {
                  requiredQuantity: comboItem.quantity ?? 0,
                  productName: comboItem.productName || comboItem.comboItemName,
                  imageUrl: comboItem.comboItemImageUrl
                }
                return acc
              }, {})
              return { comboId, name, quantityMap }
            } catch (error) {
              console.error('Error fetching combo detail:', error)
              return { comboId, name: comboNames[comboId] || 'Combo', quantityMap: {} }
            }
          })
        )
        if (!isCancelled) {
          setComboNames((prev) => {
            const updated = { ...prev }
            comboEntries.forEach(({ comboId, name }) => {
              updated[comboId] = name
            })
            return updated
          })
          setComboChildItems((prev) => {
            const updated = { ...prev }
            comboEntries.forEach(({ comboId, quantityMap }) => {
              updated[comboId] = quantityMap
            })
            return updated
          })
        }
      } catch (error) {
        console.error('Error fetching combo names/details:', error)
      }
    }
    fetchComboDetails()
    return () => {
      isCancelled = true
    }
  }, [cartData, comboNames, comboChildItems])

  // Cleanup quantity update timers on unmount
  useEffect(() => {
    return () => {
      Object.values(quantityUpdateTimers.current).forEach((timer) => {
        clearTimeout(timer)
      })
      quantityUpdateTimers.current = {}
      pendingQuantityUpdates.current = {}
    }
  }, [])

  // Load wallet balance when payment method is MyWallet
  useEffect(() => {
    const loadWalletBalance = async () => {
      if (selectedPaymentMethod === 'MyWallet') {
        setIsLoadingWallet(true)
        setWalletBalance(null) // Reset before loading
        try {
          const walletData = await getWalletBalance()
          console.log('[LoadWalletBalance] walletData:', walletData)
          console.log('[LoadWalletBalance] walletData type:', typeof walletData)
          console.log('[LoadWalletBalance] walletData availableBalance:', walletData?.availableBalance)

          // Validate walletData
          if (walletData && typeof walletData === 'object' && 'availableBalance' in walletData) {
            console.log('[LoadWalletBalance] Setting wallet balance:', walletData)
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
          console.error('[LoadWalletBalance] Error message:', errorMessage)
          toast.error(errorMessage)
          setWalletBalance(null)
        } finally {
          setIsLoadingWallet(false)
        }
      } else {
        // Clear wallet balance when switching to other payment methods
        setWalletBalance(null)
      }
    }

    loadWalletBalance()
  }, [selectedPaymentMethod])

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

      // Remove from local state immediately
      const remainingAddresses = addresses.filter((addr) => addr.id !== deletedAddressId)
      setAddresses(remainingAddresses)

      // If deleted address was selected, select another one
      if (wasSelectedAddress) {
        if (remainingAddresses.length > 0) {
          setSelectedAddress(remainingAddresses[0])
        } else {
          setSelectedAddress(null)
        }
      }

      // Reload addresses from API to ensure sync
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
        // Update existing address
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
        // Create new address
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

  // Initialize selectedItems only on first load, preserve selection state on reload
  useEffect(() => {
    if (cartData) {
      // Get all current item IDs from cart
      const currentItemIds = new Set<string>()
      const itemStockMap = new Map<string, boolean>()
      const comboOutOfStockMap = new Map<string, boolean>() // Track combos with out of stock items
      cartData.carts.forEach((store) => {
        store.items.forEach((item) => {
          currentItemIds.add(item.id)
          // Store stock status, default to true if not provided
          itemStockMap.set(item.id, item.isStock !== false)
          // Track combos with out of stock items
          if (item.isCombo && item.comboId) {
            if (item.isStock === false) {
              comboOutOfStockMap.set(item.comboId, true)
            } else if (!comboOutOfStockMap.has(item.comboId)) {
              comboOutOfStockMap.set(item.comboId, false)
            }
          }
        })
      })

      // If this is the first load, initialize items using isSelected from API (only if in stock and combo doesn't have out of stock items)
      if (isInitialLoad.current) {
        const initialSelectedItems: Record<string, boolean> = {}
        currentItemIds.forEach((itemId) => {
          const isInStock = itemStockMap.get(itemId) ?? true
          // Check if item belongs to a combo with out of stock items
          let isComboDisabled = false
          let apiSelectedValue: boolean | undefined = undefined
          cartData.carts.forEach((store) => {
            const item = store.items.find((i) => i.id === itemId)
            if (item) {
              // Use isSelected from API if available
              if (apiSelectedValue === undefined) {
                apiSelectedValue = item.isSelected
              }
              if (item.isCombo && item.comboId && comboOutOfStockMap.get(item.comboId)) {
                isComboDisabled = true
              }
            }
          })
          // Use API value if available, otherwise default to true for in-stock items not in disabled combos
          initialSelectedItems[itemId] =
            apiSelectedValue !== undefined
              ? apiSelectedValue && isInStock && !isComboDisabled
              : isInStock && !isComboDisabled
        })
        setSelectedItems(initialSelectedItems)
        // Check if all in-stock items (not in disabled combos) are selected
        const inStockItems = Array.from(currentItemIds).filter((id) => {
          const isInStock = itemStockMap.get(id) ?? true
          let isComboDisabled = false
          cartData.carts.forEach((store) => {
            const item = store.items.find((i) => i.id === id)
            if (item?.isCombo && item.comboId && comboOutOfStockMap.get(item.comboId)) {
              isComboDisabled = true
            }
          })
          return isInStock && !isComboDisabled
        })
        const allSelected = inStockItems.length > 0 && inStockItems.every((itemId) => initialSelectedItems[itemId])
        setSelectAll(allSelected)
        isInitialLoad.current = false
      } else {
        // On reload, use isSelected from API for items that exist, preserve for others
        setSelectedItems((prev) => {
          const updated: Record<string, boolean> = {}

          // Use API isSelected value for items that still exist
          currentItemIds.forEach((itemId) => {
            const isInStock = itemStockMap.get(itemId) ?? true
            // Check if item belongs to a combo with out of stock items
            let isComboDisabled = false
            let apiSelectedValue: boolean | undefined = undefined
            cartData.carts.forEach((store) => {
              const item = store.items.find((i) => i.id === itemId)
              if (item) {
                // Use isSelected from API if available
                if (apiSelectedValue === undefined) {
                  apiSelectedValue = item.isSelected
                }
                if (item.isCombo && item.comboId && comboOutOfStockMap.get(item.comboId)) {
                  isComboDisabled = true
                }
              }
            })
            // Use API value if available, otherwise keep existing selection
            if (apiSelectedValue !== undefined) {
              updated[itemId] = apiSelectedValue && isInStock && !isComboDisabled
            } else {
              updated[itemId] = isInStock && !isComboDisabled ? (prev[itemId] ?? true) : false
            }
          })

          // Update selectAll based on updated selection state (only for in-stock items not in disabled combos)
          const inStockItems = Array.from(currentItemIds).filter((id) => {
            const isInStock = itemStockMap.get(id) ?? true
            let isComboDisabled = false
            cartData.carts.forEach((store) => {
              const item = store.items.find((i) => i.id === id)
              if (item?.isCombo && item.comboId && comboOutOfStockMap.get(item.comboId)) {
                isComboDisabled = true
              }
            })
            return isInStock && !isComboDisabled
          })
          const allSelected = inStockItems.length > 0 && inStockItems.every((itemId) => updated[itemId])
          setSelectAll(allSelected)

          return updated
        })
      }
    }
  }, [cartData])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price)
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (!user?.userId || newQuantity < 1) return

    let targetComboId: string | null = null

    setCartData((prev) => {
      if (!prev) return prev

      prev.carts.forEach((store) => {
        store.items.forEach((item) => {
          if (item.id === itemId && item.isCombo && item.comboId) {
            targetComboId = item.comboId
          }
        })
      })

      const updatedCarts = prev.carts.map((store) => {
        const updatedItems = store.items.map((item) => {
          if (item.id === itemId || (targetComboId && item.comboId === targetComboId)) {
            const unitPrice = item.unitPrice ?? (item.quantity ? item.totalPrice / item.quantity : 0)
            const requirement =
              targetComboId && item.isCombo
                ? comboChildItems[targetComboId]?.[item.productVariantId]?.requiredQuantity || 1
                : 1
            const updatedItemQuantity = targetComboId ? requirement * newQuantity : newQuantity
            const updatedTotalPrice = unitPrice * updatedItemQuantity
            return {
              ...item,
              quantity: updatedItemQuantity,
              totalPrice: updatedTotalPrice
            }
          }
          return item
        })

        return {
          ...store,
          items: updatedItems
        }
      })

      return {
        ...prev,
        carts: updatedCarts
      }
    })

    const updateKey = targetComboId ?? itemId
    pendingQuantityUpdates.current[updateKey] = newQuantity

    if (quantityUpdateTimers.current[updateKey]) {
      clearTimeout(quantityUpdateTimers.current[updateKey])
    }

    quantityUpdateTimers.current[updateKey] = setTimeout(async () => {
      try {
        const quantityToUpdate = pendingQuantityUpdates.current[updateKey]
        if (targetComboId) {
          await updateCombo(user.userId, targetComboId, quantityToUpdate)
        } else {
          await updateCartItem(itemId, quantityToUpdate)
        }
        await refreshCart({ silent: true })
        await reloadCartData()
      } catch (error) {
        console.error('Error updating quantity:', error)
        toast.error('Có lỗi xảy ra khi cập nhật số lượng')
        await reloadCartData()
      } finally {
        if (quantityUpdateTimers.current[updateKey]) {
          clearTimeout(quantityUpdateTimers.current[updateKey])
          delete quantityUpdateTimers.current[updateKey]
        }
        delete pendingQuantityUpdates.current[updateKey]
      }
    }, 2000)
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

  const handleRemoveCombo = async (comboId?: string) => {
    if (!comboId) return
    try {
      await removeComboFromCart(comboId)
      await reloadCartData()
      toast.success('Đã xóa combo khỏi giỏ hàng')
    } catch (error) {
      console.error('Error removing combo:', error)
      toast.error('Có lỗi xảy ra khi xóa combo')
    }
  }

  const toggleItemSelection = async (itemId: string) => {
    // Find the item to check if it's out of stock
    if (!cartData) return

    let isOutOfStock = false
    let isComboDisabled = false
    let comboId: string | null = null

    cartData.carts.forEach((store) => {
      const item = store.items.find((i) => i.id === itemId)
      if (item) {
        if (item.isStock === false) {
          isOutOfStock = true
        }
        if (item.isCombo && item.comboId) {
          comboId = item.comboId
          // Check if combo has any out of stock items
          const comboItems = store.items.filter((i) => i.comboId === comboId)
          if (comboItems.some((i) => i.isStock === false)) {
            isComboDisabled = true
          }
        }
      }
    })

    // Don't allow selecting out of stock items or items in disabled combos
    if (isOutOfStock || isComboDisabled) {
      if (isComboDisabled && comboId) {
        toast.error('Combo này có sản phẩm hết hàng, không thể chọn')
      } else {
        toast.error('Sản phẩm này đã hết hàng')
      }
      return
    }

    // Update local state immediately for better UX
    const newSelectedState = !selectedItems[itemId]
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: newSelectedState
    }))

    // Call API to update selection on backend
    try {
      await updateSelectedCartItems([itemId], newSelectedState)
      // Reload cart data to sync with backend
      await reloadCartData()
    } catch (error) {
      console.error('Error updating item selection:', error)
      // Revert local state on error
      setSelectedItems((prev) => ({
        ...prev,
        [itemId]: !newSelectedState
      }))
      toast.error('Có lỗi xảy ra khi cập nhật lựa chọn sản phẩm')
    }
  }

  const toggleSelectAll = async () => {
    const newSelectAll = !selectAll
    setSelectAll(newSelectAll)
    const newSelectedItems: Record<string, boolean> = {}
    const comboOutOfStockMap = new Map<string, boolean>() // Track combos with out of stock items
    const itemIdsToUpdate: string[] = []

    if (cartData) {
      // First pass: identify combos with out of stock items
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

      // Second pass: set selection state and collect item IDs to update
      cartData.carts.forEach((store) => {
        store.items.forEach((item) => {
          const isInStock = item.isStock !== false
          const isComboDisabled = item.isCombo && item.comboId && comboOutOfStockMap.get(item.comboId)
          // Only select items that are in stock and not in disabled combos
          const shouldSelect = isInStock && !isComboDisabled ? newSelectAll : false
          newSelectedItems[item.id] = shouldSelect
          // Only include items that can be selected (in stock, not in disabled combo)
          if (isInStock && !isComboDisabled) {
            itemIdsToUpdate.push(item.id)
          }
        })
      })
    }

    // Update local state immediately for better UX
    setSelectedItems(newSelectedItems)

    // Call API to update selection on backend
    if (itemIdsToUpdate.length > 0) {
      try {
        await updateSelectedCartItems(itemIdsToUpdate, newSelectAll)
        // Reload cart data to sync with backend
        await reloadCartData()
      } catch (error) {
        console.error('Error updating item selection:', error)
        // Revert local state on error
        setSelectAll(!newSelectAll)
        setSelectedItems((prev) => {
          const reverted: Record<string, boolean> = { ...prev }
          itemIdsToUpdate.forEach((itemId) => {
            reverted[itemId] = !newSelectAll
          })
          return reverted
        })
        toast.error('Có lỗi xảy ra khi cập nhật lựa chọn sản phẩm')
      }
    }
  }

  const getTotalItems = () => {
    return cartData ? cartData.carts.reduce((sum, store) => sum + store.items.length, 0) : 0
  }

  const getSelectedTotal = () => {
    let total = 0
    const comboOutOfStockMap = new Map<string, boolean>() // Track combos with out of stock items

    if (cartData) {
      // First pass: identify combos with out of stock items
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

      // Second pass: calculate total
      cartData.carts.forEach((store) => {
        store.items.forEach((item) => {
          const isInStock = item.isStock !== false
          const isComboDisabled = item.isCombo && item.comboId && comboOutOfStockMap.get(item.comboId)
          // Only count items that are selected, in stock, and not in disabled combos
          if (selectedItems[item.id] && isInStock && !isComboDisabled) {
            total += item.totalPrice
          }
        })
      })
    }
    return total
  }

  // Check if any selected items are out of stock or in disabled combos
  const hasOutOfStockSelectedItems = () => {
    if (!cartData) return false
    const comboOutOfStockMap = new Map<string, boolean>() // Track combos with out of stock items

    // First pass: identify combos with out of stock items
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

    // Second pass: check if any selected items are out of stock or in disabled combos
    return cartData.carts.some((store) =>
      store.items.some((item) => {
        const isInStock = item.isStock !== false
        const isComboDisabled = item.isCombo && item.comboId && comboOutOfStockMap.get(item.comboId)
        return selectedItems[item.id] && (!isInStock || isComboDisabled)
      })
    )
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
      if (item.isCombo && item.comboId) {
        if (!comboMap.has(item.comboId)) {
          const derivedComboName =
            (item.comboId && comboNames[item.comboId]) ||
            (item as APICartItem & { comboName?: string }).comboName ||
            'Combo'
          const comboRequirement =
            comboChildItems[item.comboId]?.[item.productVariantId]?.requiredQuantity
          const derivedQuantity =
            comboRequirement && comboRequirement > 0 ? Math.max(1, Math.round(item.quantity / comboRequirement)) : item.quantity
          comboMap.set(item.comboId, {
            comboId: item.comboId,
            comboName: derivedComboName,
            items: [],
            quantity: derivedQuantity,
            totalPrice: 0
          })
        }
        const combo = comboMap.get(item.comboId)!
        combo.items.push(item)
        if (!combo.quantity) {
          const comboRequirement =
            comboChildItems[item.comboId]?.[item.productVariantId]?.requiredQuantity
          if (comboRequirement && comboRequirement > 0) {
            combo.quantity = Math.max(1, Math.round(item.quantity / comboRequirement))
          }
        }
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
        ? cartData.carts.flatMap((store) => store.items.filter((item) => selectedItems[item.id] && item.isStock !== false))
        : []

      if (selectedItemsList.length === 0) {
        toast.error('Vui lòng chọn ít nhất một sản phẩm còn hàng')
        return
      }

      // Check if there are any out of stock items selected
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
        return
      }

      // Create storePromotions from appliedPromotions in cart data
      const storePromotionsMap = new Map<string, string[]>()

      if (cartData) {
        cartData.carts.forEach((store) => {
          // Only include stores that have selected items
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

      // Convert Map to array format expected by backend
      const storePromotionsArray = Array.from(storePromotionsMap.entries()).map(([storeId, promotionIds]) => ({
        storeId,
        promotionIds
      }))

      const orderData = {
        userId: user.userId,
        userAddressId: selectedAddress.id,
        paymentMethod: selectedPaymentMethod,
        orderItemCreates: selectedItemsList.map((item) => ({
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          ...(item.isCombo && item.comboId ? { comboId: item.comboId } : {})
        })),
        storePromotions: storePromotionsArray
      }

      console.log('[Cart] orderData being sent:', orderData)
      console.log('[Cart] storePromotions:', orderData.storePromotions)

      const createdOrder = await createOrder(orderData)
      console.log('[Cart] createdOrder response:', createdOrder)
      console.log('[Cart] createdOrder length:', createdOrder.length)
      console.log(
        '[Cart] createdOrder items:',
        createdOrder.map((order) => ({
          orderId: order.id.slice(-8),
          storeName: order.fromName,
          itemsCount: order.orderItems?.length || 0
        }))
      )
      toast.success('Đơn hàng đã được tạo! Đang chuyển đến trang thanh toán...')

      // Store selected item IDs for later clearing after successful payment
      const selectedItemIds = selectedItemsList.map((item) => item.id)

      // Clear cart items immediately after successful order creation
      await clearCartAfterOrder(selectedItemIds)

      console.log('[Cart] Navigating with orders:', createdOrder)
      navigate('/cart/create-order', {
        state: {
          orders: createdOrder, // Truyền tất cả orders từ array
          paymentMethod: selectedPaymentMethod,
          selectedItemIds: selectedItemIds, // Pass item IDs to clear later
          selectedAddress: selectedAddress, // Pass selected address
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
      toast.success('Áp dụng Mã khuyến mãi  thành công')
      return true
    } catch {
      toast.error('Có lỗi xảy ra khi áp dụng Mã khuyến mãi ')
      return false
    }
  }

  const handleRemoveAppliedPromotion = async (cartId: string, promotionId: string) => {
    try {
      await removePromotionFromCart(cartId, promotionId)
      await reloadCartData() // Reload cart data to get updated appliedPromotions
      toast.success('Hủy Mã khuyến mãi  thành công')
    } catch (error) {
      console.error('Error removing applied promotion:', error)
      toast.error('Có lỗi xảy ra khi hủy Mã khuyến mãi ')
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

  const subtotal = getSelectedTotal()
  const totalDiscount = getTotalDiscount()
  const finalTotal = Math.max(0, subtotal - totalDiscount)
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
  // Only check when MyWallet is selected and balance is loaded
  const isWalletBalanceSufficient =
    selectedPaymentMethod === 'MyWallet' && walletBalance ? walletBalance.availableBalance >= finalTotal : false

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
                  className={checkboxClass}
                  style={checkboxStyle}
                />
                <span className='text-gray-700'>
                  Chọn tất cả (
                  {cartData
                    ? cartData.carts.reduce((sum, store) => sum + store.items.filter((item) => item.isStock !== false).length, 0)
                    : 0}{' '}
                  sản phẩm còn hàng)
                </span>
              </label>
            </div>

            {/* Store Items */}
            {cartData.carts.map((store) => (
              <div key={store.cartId} className='bg-white rounded-lg shadow-sm overflow-hidden'>
                {/* Store Header */}
                <div className='bg-green-100 px-4 py-3 border-b border-green-200'>
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
                      const comboTitle =
                        (comboItem.comboId && comboNames[comboItem.comboId]) || comboItem.comboName || 'Combo'
                      // Check if any item in combo is out of stock - if so, disable entire combo
                      const isComboOutOfStock = comboItem.items.some((i: APICartItem) => i.isStock === false)
                      // Ensure all items in combo are unselected if combo is disabled
                      const allComboItemsSelected = comboItem.items.every((i: APICartItem) => selectedItems[i.id])
                      return (
                        <div
                          key={comboItem.comboId}
                          className={`p-4 bg-white rounded-xl ${isComboOutOfStock ? 'opacity-60' : ''}`}
                        >
                          <div className='flex items-start gap-4'>
                            <input
                              type='checkbox'
                              checked={!isComboOutOfStock && allComboItemsSelected}
                              onChange={() => {
                                if (isComboOutOfStock) {
                                  toast.error('Combo này có sản phẩm hết hàng, không thể chọn')
                                  return
                                }
                                comboItem.items.forEach((i: APICartItem) => toggleItemSelection(i.id))
                              }}
                              disabled={isComboOutOfStock}
                              className={`${checkboxClass} mt-1 ${isComboOutOfStock ? 'cursor-not-allowed opacity-50' : ''}`}
                              style={checkboxStyle}
                            />

                            <div className='flex-1 space-y-4'>
                              <div className='flex items-start justify-between gap-4'>
                                <div className='flex items-center gap-2'>
                                  <span className='mb-3 inline-flex items-center text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full'>
                                    Sản phẩm combo
                                  </span>
                                  <h3 className='text-base font-semibold text-gray-900 mt-3'>{comboTitle}</h3>
                                  {isComboOutOfStock && (
                                    <span className='bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium'>
                                      Hết hàng
                                    </span>
                                  )}
                                </div>
                                <div className='text-right space-y-2'>
                                  <button
                                    onClick={() => handleRemoveCombo(comboItem.comboId)}
                                    className='text-gray-400 hover:text-red-500 inline-flex justify-end w-full'
                                    title='Xóa combo'
                                  >
                                    <Trash2 className='w-4 h-4' />
                                  </button>
                                </div>
                              </div>

                              <div className='flex flex-wrap items-center justify-between gap-4'>
                                <div className='flex items-center gap-3'>
                                  <button
                                    onClick={() => updateQuantity(comboItem.items[0].id, comboItem.quantity - 1)}
                                    className='w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                                    disabled={isComboOutOfStock}
                                  >
                                    <Minus className='w-4 h-4' />
                                  </button>
                                  <span className='w-12 text-center font-semibold text-gray-900'>
                                    {comboItem.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(comboItem.items[0].id, comboItem.quantity + 1)}
                                    className='w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                                    disabled={isComboOutOfStock}
                                  >
                                    <Plus className='w-4 h-4' />
                                  </button>
                                </div>
                                <p className='text-orange-600 font-bold text-lg whitespace-nowrap'>
                                  ₫{formatPrice(comboItem.totalPrice)}
                                </p>
                              </div>

                              <div className='space-y-2 bg-orange-50 rounded-lg p-2'>
                                {comboItem.items.map((childItem: APICartItem) => {
                                  const comboId = childItem.comboId || comboItem.comboId
                                  const childRequirement =
                                    (comboId && comboChildItems[comboId]?.[childItem.productVariantId]) || null
                                  const requiredQuantity = childRequirement?.requiredQuantity
                                  const isChildOutOfStock = childItem.isStock === false
                                  return (
                                    <div
                                      key={childItem.id}
                                      className={`flex items-center gap-3 p-2 ${isChildOutOfStock ? 'opacity-60' : ''}`}
                                    >
                                      <div className='w-12 h-12 bg-white rounded flex items-center justify-center shadow-sm'>
                                        <img
                                          src={childItem.imageUrl || childRequirement?.imageUrl || '/api/placeholder/48/48'}
                                          alt={childItem.name}
                                          className='w-10 h-10 object-cover rounded'
                                        />
                                      </div>
                                      <div className='flex-1'>
                                        <div className='flex items-center gap-2'>
                                          <p className='text-sm font-medium text-gray-800'>
                                            {childRequirement?.productName || childItem.name}
                                          </p>
                                          {isChildOutOfStock && (
                                            <span className='bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full font-medium'>
                                              Hết hàng
                                            </span>
                                          )}
                                        </div>
                                        <p className='text-xs text-gray-500'>
                                          {typeof requiredQuantity === 'number'
                                            ? `Số lượng định mức: ${requiredQuantity}`
                                            : `Số lượng: ${childItem.quantity}`}
                                        </p>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    // Regular item
                    const regularItem = item as APICartItem
                    const isOutOfStock = regularItem.isStock === false
                    return (
                      <div key={regularItem.id} className={`p-4 ${isOutOfStock ? 'opacity-60' : ''}`}>
                        <div className='flex items-start gap-4'>
                          <input
                            type='checkbox'
                            checked={selectedItems[regularItem.id] || false}
                            onChange={() => toggleItemSelection(regularItem.id)}
                            disabled={isOutOfStock}
                            className={`${checkboxClass} mt-1 ${isOutOfStock ? 'cursor-not-allowed opacity-50' : ''}`}
                            style={checkboxStyle}
                          />

                          <div className='w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0'>
                            <img
                              src={regularItem.imageUrl || '/api/placeholder/80/80'}
                              alt={regularItem.name}
                              className='w-full h-full object-cover'
                            />
                          </div>

                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2 mb-1'>
                              <h3 className='font-semibold text-gray-800'>{regularItem.name}</h3>
                              {isOutOfStock && (
                                <span className='bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium'>
                                  Hết hàng
                                </span>
                              )}
                            </div>

                            <div className='flex items-center justify-between mt-3'>
                              <div className='flex items-center gap-3'>
                                <button
                                  onClick={() => updateQuantity(regularItem.id, regularItem.quantity - 1)}
                                  className='w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                                  disabled={regularItem.quantity <= 1 || isOutOfStock}
                                >
                                  <Minus className='w-4 h-4' />
                                </button>
                                <span className='w-12 text-center font-medium'>{regularItem.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(regularItem.id, regularItem.quantity + 1)}
                                  className='w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                                  disabled={isOutOfStock}
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
                {/* Selected items with pricing */}
                <div className='space-y-3 max-h-64 overflow-y-auto pr-1'>
                  {cartData?.carts.map((store) => {
                    const storeSummaryEntries = groupComboItems(store.items).reduce<StoreSummaryEntry[]>(
                      (entries, groupedItem) => {
                        if ('items' in groupedItem) {
                          const comboGroup = groupedItem as ComboGroup
                          const selectedComboItems = comboGroup.items.filter((comboItem) => selectedItems[comboItem.id])
                          const allSelected = selectedComboItems.length === comboGroup.items.length

                          if (allSelected && comboGroup.items.length > 0) {
                            entries.push({
                              type: 'combo',
                              comboId: comboGroup.comboId,
                              comboName: comboGroup.comboName || 'Combo',
                              itemCount: comboGroup.items.length,
                              quantity: comboGroup.quantity,
                              totalPrice: comboGroup.totalPrice
                            })
                          } else {
                            selectedComboItems.forEach((comboItem) => {
                              entries.push({
                                type: 'single',
                                id: comboItem.id,
                                name: comboItem.name,
                                totalPrice: comboItem.totalPrice
                              })
                            })
                          }
                        } else if (selectedItems[groupedItem.id]) {
                          entries.push({
                            type: 'single',
                            id: groupedItem.id,
                            name: groupedItem.name,
                            totalPrice: groupedItem.totalPrice
                          })
                        }

                        return entries
                      },
                      []
                    )

                    if (storeSummaryEntries.length === 0) return null

                    return (
                      <div key={store.storeId} className='rounded-lg border border-gray-100 p-3 bg-gray-50 space-y-2'>
                        <div className='flex justify-between text-xs text-gray-500'>
                          <span>{store.storeName}</span>
                          {store.hasFreeship && <span className='text-green-600 font-medium'>Miễn phí vận chuyển</span>}
                        </div>
                        {storeSummaryEntries.map((entry) =>
                          entry.type === 'combo' ? (
                            <div key={`combo-${entry.comboId}`} className='flex justify-between text-sm text-gray-700'>
                              <span className='truncate pr-4'>
                                {entry.comboName}
                                <span className='block text-xs text-gray-500'>
                                  {entry.itemCount} sản phẩm · x{entry.quantity}
                                </span>
                              </span>
                              <span className='font-semibold text-orange-600'>₫{formatPrice(entry.totalPrice)}</span>
                            </div>
                          ) : (
                            <div key={entry.id} className='flex justify-between text-sm text-gray-700'>
                              <span className='truncate pr-4'>{entry.name}</span>
                              <span>₫{formatPrice(entry.totalPrice)}</span>
                            </div>
                          )
                        )}
                      </div>
                    )
                  })}
                  {selectedItemsList.length === 0 && (
                    <p className='text-xs text-gray-500'>Chưa có sản phẩm được chọn.</p>
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
              <div className='flex flex-col gap-4'>
                <button
                  onClick={handleCreateOrder}
                  className='w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg mb-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  disabled={
                    getSelectedCount() === 0 ||
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
                          : 'Mua hàng'}
                </button>

                <button
                  onClick={() => navigate('/products')}
                  className='w-full hover:bg-green-50 border border-gray-300 text-green-600 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  Tiếp tục mua sắm
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

        {/* Delivery Address Section */}
        <div className='mt-6'>
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
        </div>
      </div>

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
    </div>
  )
}
