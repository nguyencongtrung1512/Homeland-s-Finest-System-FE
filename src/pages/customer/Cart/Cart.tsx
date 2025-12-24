// Cart component
import { Button } from '../../../components/ui/button'
import { Plus, Minus, ShoppingCart, Trash2, Store, Gift, Tag } from 'lucide-react'
import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../../contexts/cart.context'
import { useAuth } from '../../../contexts/auth.context'
import { useActiveUserGuard } from '../../../hooks/useActiveUserGuard'
import {
  updateCartItem,
  removeCartItem,
  getCartByUserId,
  removePromotionFromCart,
  updateCombo,
  updateSelectedCartItems
} from '../../../apis/cart.api'
import { getComboById } from '../../../apis/combo.api'
import productApi from '../../../apis/product.api'
import { toast } from '../../../utils/toast'
import { path } from '../../../constants/path'
import type { CartData, CartItem as APICartItem } from '../../../types/cartType'
import type { ComboItem as ComboDetailItem } from '../../../types/combo.type'

// Import Promotion Components
import { PromotionModal } from '../../../components/Promotion'
import AppliedPromotionModal from '../../../components/Cart/AppliedPromotionModal'

// Order validation constants
const ORDER_BLOCK_THRESHOLD = 30_000_000 // 30 triệu

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
  const { refreshCart, loading, removeComboFromCart } = useCart()
  const { user } = useAuth()
  const { isActiveUser } = useActiveUserGuard()
  const [cartData, setCartData] = useState<CartData | null>(null)
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({})
  const [selectAll, setSelectAll] = useState(false)
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false)
  const [selectedStoreForPromotion, setSelectedStoreForPromotion] = useState<string | null>(null)
  const [storePromotions] = useState<Record<string, StorePromotion[]>>({})
  const [isAppliedPromotionsModalOpen, setIsAppliedPromotionsModalOpen] = useState(false)
  const [selectedStoreForAppliedPromotions, setSelectedStoreForAppliedPromotions] = useState<string | null>(null)
  const isInitialLoad = useRef(true) // Track if this is the first load
  const quantityUpdateTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const pendingQuantityUpdates = useRef<Record<string, number>>({})
  const isRemovingExpiredPromotions = useRef(false) // Track if we're removing expired promotions
  const [comboNames, setComboNames] = useState<Record<string, string>>({})
  const [comboChildItems, setComboChildItems] = useState<Record<string, Record<string, ComboChildRequirement>>>({})
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({}) // Temporary input values

  // Checkbox styling (gray accent + click animation)
  const checkboxClass =
    'w-5 h-5 rounded border-gray-300 focus:ring-2 focus:ring-gray-400 transition-transform duration-150 ease-out hover:scale-105 active:scale-95'
  const checkboxStyle: CSSProperties = { accentColor: '#6b7280' }

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

  // Reset initial load flag when user changes
  useEffect(() => {
    isInitialLoad.current = true
  }, [user?.userId])

  useEffect(() => {
    reloadCartData()
  }, [reloadCartData])

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
              const hasExpiredPromotions = expiredPromotions.some((exp) => exp.storeIndex === storeIndex)
              if (hasExpiredPromotions && store.appliedPromotions) {
                return {
                  ...store,
                  appliedPromotions: store.appliedPromotions.filter((promo) => !promo.isExpired)
                }
              }
              return store
            })
          }
        })

        // Silently remove from backend
        try {
          await Promise.all(
            expiredPromotions.map(({ cartId, promotionId }) => removePromotionFromCart(cartId, promotionId))
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

    // Reset quantity inputs when cart data changes
    setQuantityInputs({})
  }, [cartData])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price)
  }

  // Handle quantity input change
  const handleQuantityInputChange = (itemId: string, value: string) => {
    // Allow empty string for editing
    if (value === '') {
      setQuantityInputs((prev) => ({ ...prev, [itemId]: '' }))
      return
    }

    // Only allow numbers
    const numValue = parseInt(value, 10)
    if (isNaN(numValue) || numValue < 1) {
      return
    }

    setQuantityInputs((prev) => ({ ...prev, [itemId]: value }))
  }

  // Handle quantity input blur/enter - validate and update
  const handleQuantityInputBlur = (itemId: string, value: string, isCombo: boolean = false, comboId?: string) => {
    const numValue = parseInt(value, 10)

    if (isNaN(numValue) || numValue < 1) {
      // Reset to current quantity if invalid
      const currentItem = cartData?.carts.flatMap((store) => store.items).find((item) => item.id === itemId)

      if (currentItem) {
        let currentQuantity = currentItem.quantity
        if (isCombo && comboId) {
          // Calculate current combo quantity
          const requirement = comboChildItems[comboId]?.[currentItem.productVariantId]?.requiredQuantity || 1
          currentQuantity = Math.max(1, Math.round(currentItem.quantity / requirement))
        }
        setQuantityInputs((prev) => ({ ...prev, [itemId]: currentQuantity.toString() }))
      } else {
        setQuantityInputs((prev) => {
          const updated = { ...prev }
          delete updated[itemId]
          return updated
        })
      }
      return
    }

    // Find the item to check availableQuantity
    let targetItem: APICartItem | null = null
    let comboItems: APICartItem[] = []
    if (cartData) {
      for (const store of cartData.carts) {
        for (const item of store.items) {
          if (item.id === itemId) {
            targetItem = item
            if (isCombo && comboId) {
              // Get all items in the combo
              comboItems = store.items.filter((i) => i.comboId === comboId)
            }
            break
          }
        }
        if (targetItem) break
      }
    }

    let finalQuantity = numValue
    let maxAvailable = 0

    // Check availableQuantity limit and adjust if needed
    if (isCombo && comboId && comboItems.length > 0) {
      // For combo, find the minimum max combo quantity across all items
      const maxComboQuantities = comboItems
        .filter((item) => item.availableQuantity !== undefined)
        .map((item) => {
          const requirement = comboChildItems[comboId]?.[item.productVariantId]?.requiredQuantity || 1
          return Math.floor((item.availableQuantity || 0) / requirement)
        })

      if (maxComboQuantities.length > 0) {
        maxAvailable = Math.min(...maxComboQuantities)
        if (numValue > maxAvailable) {
          finalQuantity = maxAvailable
        }
      }
    } else if (targetItem && typeof targetItem.availableQuantity === 'number') {
      // For regular item
      maxAvailable = targetItem.availableQuantity
      if (numValue > maxAvailable) {
        finalQuantity = maxAvailable
      }
    }

    // Clear input state and update quantity
    setQuantityInputs((prev) => {
      const updated = { ...prev }
      delete updated[itemId]
      return updated
    })

    // Auto-adjust to max if exceeded, no toast needed
    updateQuantity(itemId, finalQuantity)
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (!user?.userId || newQuantity < 1) return

    let targetComboId: string | null = null
    let targetItem: APICartItem | null = null

    // Find the item to check availableQuantity
    if (cartData) {
      for (const store of cartData.carts) {
        for (const item of store.items) {
          if (item.id === itemId) {
            targetItem = item
            if (item.isCombo && item.comboId) {
              targetComboId = item.comboId
            }
            break
          }
        }
        if (targetItem) break
      }
    }

    // Check availableQuantity limit
    if (targetItem && typeof targetItem.availableQuantity === 'number') {
      if (targetComboId) {
        // For combo, check based on requirement
        const requirement = comboChildItems[targetComboId]?.[targetItem.productVariantId]?.requiredQuantity || 1
        const maxComboQuantity = Math.floor(targetItem.availableQuantity / requirement)
        if (newQuantity > maxComboQuantity) {
          return
        }
      } else {
        // For regular item
        if (newQuantity > targetItem.availableQuantity) {
          return
        }
      }
    }

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

        // Lấy lỗi từ backend (axios interceptor trả về error.response.data)
        let errorMessage = 'Có lỗi xảy ra khi cập nhật số lượng'

        if (error && typeof error === 'object') {
          const err = error as { message?: string; response?: { data?: { message?: string } } }

          // Priority 1: Lấy message từ backend response (vì axios interceptor trả về error.response.data)
          if (err.message && typeof err.message === 'string') {
            errorMessage = err.message
          }
          // Priority 2: Nếu vẫn có response.data.message (fallback)
          else if (err.response?.data?.message) {
            errorMessage = err.response.data.message
          }
          // Priority 3: Lấy từ error.message (Error object)
          else if ((error as Error).message) {
            errorMessage = (error as Error).message
          }
        } else if (typeof error === 'string') {
          errorMessage = error
        }

        toast.error(errorMessage)
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
    // Sử dụng summary.totalItems từ API để đếm đúng (1 combo = 1 item)
    return cartData?.summary?.totalItems ?? 0
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

  // Check if any selected items are from stores that exceed shipping limit
  const hasMaxShippingLimitStores = () => {
    if (!cartData) return false
    return cartData.carts.some((store) => {
      if (!store.isMax) return false
      // Check if this store has any selected items
      return store.items.some((item) => selectedItems[item.id])
    })
  }

  // Get list of stores that exceed shipping limit and have selected items
  const getMaxShippingLimitStores = () => {
    if (!cartData) return []
    return cartData.carts
      .filter((store) => store.isMax && store.items.some((item) => selectedItems[item.id]))
      .map((store) => store.storeName)
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

  // Handle product image click - navigate to product detail or combo detail
  const handleProductImageClick = async (productVariantId: string, isCombo: boolean, comboId?: string) => {
    try {
      if (isCombo && comboId) {
        // Navigate directly to combo detail
        navigate(path.detailCombo.replace(':id', comboId))
        return
      }

      // Validate productVariantId
      if (!productVariantId) {
        toast.error('Không tìm thấy thông tin sản phẩm')
        return
      }

      // For products, get productId from variantId
      const response = await productApi.getDisplayRootByVariantId(productVariantId)

      if (response?.data?.id) {
        navigate(path.productDetail.replace(':id', response.data.id))
      } else {
        toast.error('Không thể tìm thấy thông tin sản phẩm')
      }
    } catch (error) {
      console.error('Error getting product ID:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error).message ||
        'Có lỗi xảy ra khi tải thông tin sản phẩm. Vui lòng thử lại.'
      toast.error(errorMessage)
    }
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
          const comboRequirement = comboChildItems[item.comboId]?.[item.productVariantId]?.requiredQuantity
          const derivedQuantity =
            comboRequirement && comboRequirement > 0
              ? Math.max(1, Math.round(item.quantity / comboRequirement))
              : item.quantity
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
          const comboRequirement = comboChildItems[item.comboId]?.[item.productVariantId]?.requiredQuantity
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
  const handleOpenAppliedPromotionsModal = (storeId: string) => {
    const store = cartData?.carts.find((s) => s.storeId === storeId)
    if (store?.appliedPromotions && store.appliedPromotions.length > 0) {
      setSelectedStoreForAppliedPromotions(storeId)
      setIsAppliedPromotionsModalOpen(true)
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
  const isOrderBlocked = finalTotal >= ORDER_BLOCK_THRESHOLD
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
                    ? cartData.carts.reduce(
                        (sum, store) => sum + store.items.filter((item) => item.isStock !== false).length,
                        0
                      )
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
                      {store.isMax && (
                        <span className='bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium'>
                          Quá số lượng vận chuyển
                        </span>
                      )}
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='text-xs'
                        disabled={!isActiveUser || cartData?.carts.length === 0}
                        onClick={() => {
                          setSelectedStoreForPromotion(store.storeId)
                          setIsPromotionModalOpen(true)
                        }}
                      >
                        <Tag className='h-3 w-3 mr-1' />
                        Mã khuyến mãi
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        disabled={!store.appliedPromotions || store.appliedPromotions.length === 0}
                        onClick={() => {
                          handleOpenAppliedPromotionsModal(store.storeId)
                          setIsAppliedPromotionsModalOpen(true)
                        }}
                        className={`text-xs ${store.appliedPromotions && store.appliedPromotions.length > 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-700 opacity-60'}`}
                      >
                        <Gift className='h-3 w-3 mr-1' />
                        Đã áp dụng ({store.appliedPromotions?.length || 0})
                      </Button>
                      <button
                        className='text-sm text-orange-600 hover:text-orange-700 font-medium'
                        onClick={() => navigate(`/store/${store.storeId}`)}
                      >
                        Xem shop
                      </button>
                    </div>
                  </div>
                  {/* Warning message for stores exceeding shipping limit */}
                  {store.isMax && (
                    <div className='mt-2 bg-red-50 border border-red-200 rounded-lg p-3'>
                      <div className='flex items-start gap-2'>
                        <div className='flex-1'>
                          <p className='text-sm font-medium text-red-800'>
                            Cửa hàng này đã vượt quá số lượng vận chuyển cho phép
                          </p>
                          <p className='text-xs text-red-600 mt-1'>
                            Vui lòng giảm số lượng sản phẩm để có thể đặt hàng, vui lòng tách đơn.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
                                  <h3
                                    className='text-base font-semibold text-gray-900 mt-3 cursor-pointer hover:text-orange-600 transition-colors'
                                    onClick={() => navigate(path.detailCombo.replace(':id', comboItem.comboId))}
                                  >
                                    {comboTitle}
                                  </h3>
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
                                <div className='flex flex-col gap-1 items-center'>
                                  <div className='flex items-center gap-3'>
                                    <div className='flex items-center border border-gray-300 rounded-lg'>
                                      <button
                                        onClick={() => updateQuantity(comboItem.items[0].id, comboItem.quantity - 1)}
                                        className='w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                                        disabled={isComboOutOfStock || comboItem.quantity <= 1}
                                      >
                                        <Minus className='w-4 h-4' />
                                      </button>
                                      <input
                                        type='text'
                                        value={
                                          quantityInputs[comboItem.items[0].id] !== undefined
                                            ? quantityInputs[comboItem.items[0].id]
                                            : comboItem.quantity
                                        }
                                        onChange={(e) =>
                                          handleQuantityInputChange(comboItem.items[0].id, e.target.value)
                                        }
                                        onBlur={(e) =>
                                          handleQuantityInputBlur(
                                            comboItem.items[0].id,
                                            e.target.value,
                                            true,
                                            comboItem.comboId
                                          )
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.currentTarget.blur()
                                          }
                                        }}
                                        className='w-12 text-center font-medium border-0 focus:outline-none focus:ring-0'
                                        disabled={isComboOutOfStock}
                                      />
                                      <button
                                        onClick={() => updateQuantity(comboItem.items[0].id, comboItem.quantity + 1)}
                                        className='w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                                        disabled={
                                          isComboOutOfStock ||
                                          comboItem.items.some((item: APICartItem) => {
                                            if (item.availableQuantity === undefined) return false
                                            const comboId = item.comboId || comboItem.comboId
                                            const requirement =
                                              (comboId &&
                                                comboChildItems[comboId]?.[item.productVariantId]?.requiredQuantity) ||
                                              1
                                            const currentItemQuantity = requirement * comboItem.quantity
                                            return currentItemQuantity >= item.availableQuantity
                                          })
                                        }
                                      >
                                        <Plus className='w-4 h-4' />
                                      </button>
                                    </div>
                                    <div className='flex items-center'>
                                      <span className='text-xs text-gray-500 mt-2 pl-3'>x</span>
                                      <span className='text-xs text-gray-500 mt-2 px-2'>
                                        {formatPrice(
                                          comboItem.quantity > 0 ? comboItem.totalPrice / comboItem.quantity : 0
                                        )}
                                        ₫
                                      </span>
                                    </div>
                                  </div>
                                  {/* Hiển thị availableQuantity cho combo - chính giữa, dưới quantity selector, màu xanh */}
                                  {comboItem.items.some(
                                    (item: APICartItem) => item.availableQuantity !== undefined
                                  ) && (
                                    <span
                                      className='text-xs text-green-600 font-medium text-center w-full block'
                                      style={{ marginRight: '46%' }}
                                    >
                                      {(() => {
                                        // Tìm availableQuantity nhỏ nhất trong combo
                                        const availableQuantities = comboItem.items
                                          .filter((item: APICartItem) => item.availableQuantity !== undefined)
                                          .map((item: APICartItem) => {
                                            const comboId = item.comboId || comboItem.comboId
                                            const requirement =
                                              (comboId &&
                                                comboChildItems[comboId]?.[item.productVariantId]?.requiredQuantity) ||
                                              1
                                            // Tính số combo có thể mua dựa trên availableQuantity và requiredQuantity
                                            return Math.floor((item.availableQuantity || 0) / requirement)
                                          })
                                        const minAvailable = Math.min(...availableQuantities)
                                        return `${minAvailable} combo có sẵn`
                                      })()}
                                    </span>
                                  )}
                                </div>
                                <p className='text-orange-600 font-bold text-lg whitespace-nowrap'>
                                  {formatPrice(comboItem.totalPrice)}đ
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
                                      <div
                                        className='w-12 h-12 bg-white rounded flex items-center justify-center shadow-sm cursor-pointer hover:opacity-80 transition-opacity'
                                        onClick={() => handleProductImageClick(childItem.productVariantId, false)}
                                      >
                                        <img
                                          src={
                                            childItem.imageUrl || childRequirement?.imageUrl || '/api/placeholder/48/48'
                                          }
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

                          <div
                            className='w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity'
                            onClick={() => handleProductImageClick(regularItem.productVariantId, false)}
                          >
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
                              <div className='flex flex-col gap-1 items-center'>
                                <div className='flex items-center'>
                                  <div className='flex items-center border border-gray-300 rounded-lg'>
                                    <button
                                      onClick={() => updateQuantity(regularItem.id, regularItem.quantity - 1)}
                                      className='w-8 h-8  flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                                      disabled={regularItem.quantity <= 1 || isOutOfStock}
                                    >
                                      <Minus className='w-4 h-4' />
                                    </button>
                                    <input
                                      type='text'
                                      value={
                                        quantityInputs[regularItem.id] !== undefined
                                          ? quantityInputs[regularItem.id]
                                          : regularItem.quantity
                                      }
                                      onChange={(e) => handleQuantityInputChange(regularItem.id, e.target.value)}
                                      onBlur={(e) => handleQuantityInputBlur(regularItem.id, e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.currentTarget.blur()
                                        }
                                      }}
                                      className='w-12 text-center font-medium border-0 focus:outline-none focus:ring-0'
                                      disabled={isOutOfStock}
                                    />
                                    <button
                                      onClick={() => updateQuantity(regularItem.id, regularItem.quantity + 1)}
                                      className='w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                                      disabled={
                                        isOutOfStock ||
                                        (regularItem.availableQuantity !== undefined &&
                                          regularItem.quantity >= regularItem.availableQuantity)
                                      }
                                    >
                                      <Plus className='w-4 h-4' />
                                    </button>
                                  </div>
                                  <div className='flex items-center'>
                                    <span className='text-xs text-gray-500 mt-2 pl-3'>x</span>
                                    <span className='text-xs text-gray-500 mt-2 px-2'>
                                      {formatPrice(regularItem.unitPrice)}₫
                                    </span>
                                  </div>
                                </div>
                                {/* Hiển thị availableQuantity cho sản phẩm thường - chính giữa, dưới quantity selector, màu xanh */}
                                {regularItem.availableQuantity !== undefined && (
                                  <span
                                    className='text-xs text-green-600 font-medium text-center w-full block'
                                    style={{ marginRight: '46%' }}
                                  >
                                    {regularItem.availableQuantity} sản phẩm có sẵn
                                  </span>
                                )}
                              </div>
                              <span className='text-orange-600 font-bold text-lg'>
                                {formatPrice(regularItem.totalPrice)}đ
                              </span>
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
                              <span className='font-semibold text-orange-600'>{formatPrice(entry.totalPrice)}đ</span>
                            </div>
                          ) : (
                            <div key={entry.id} className='flex justify-between text-sm text-gray-700'>
                              <span className='truncate pr-4'>{entry.name}</span>
                              <span>{formatPrice(entry.totalPrice)}đ</span>
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
                    <div className='text-sm text-gray-500 line-through'>{formatPrice(subtotal)}đ</div>
                  )}
                  <span className='text-2xl font-bold text-orange-600'>{formatPrice(finalTotal)}đ</span>
                </div>
              </div>

              {/* Savings Summary */}
              {totalDiscount > 0 && (
                <div className='bg-green-50 border border-green-200 rounded-lg p-3 mb-4'>
                  <div className='flex items-center gap-2'>
                    <Gift className='h-4 w-4 text-green-600' />
                    <span className='text-sm font-medium text-green-800'>
                      Bạn đã tiết kiệm được {formatPrice(totalDiscount)}đ
                    </span>
                  </div>
                </div>
              )}
              {/* Warning for order exceeding 30 million */}
              {isOrderBlocked && (
                <div className='mb-4 bg-red-50 border border-red-200 rounded-lg p-3'>
                  <div className='flex items-start gap-2'>
                    <div className='flex-1'>
                      <p className='text-sm font-medium text-red-800'>
                        Đơn hàng có giá trị từ {formatPrice(ORDER_BLOCK_THRESHOLD)}đ trở lên không thể đặt hàng.
                      </p>
                      <p className='text-sm text-red-600 mt-1'>Vui lòng tách đơn.</p>
                    </div>
                  </div>
                </div>
              )}
              {/* Warning for stores exceeding shipping limit */}
              {hasMaxShippingLimitStores() && (
                <div className='mb-4 bg-red-50 border border-red-200 rounded-lg p-3'>
                  <div className='flex items-start gap-2'>
                    <div className='flex-1'>
                      <p className='text-sm font-medium text-red-800'>Không thể đặt hàng, vui lòng tách đơn.</p>
                    </div>
                  </div>
                </div>
              )}
              <div className='flex flex-col gap-4'>
                <button
                  onClick={() => {
                    if (!isActiveUser) return
                    if (getSelectedCount() === 0) {
                      toast.error('Vui lòng chọn ít nhất một sản phẩm')
                      return
                    }
                    if (hasOutOfStockSelectedItems()) {
                      toast.error('Vui lòng bỏ chọn các sản phẩm đã hết hàng')
                      return
                    }
                    if (hasMaxShippingLimitStores()) {
                      const storeNames = getMaxShippingLimitStores().join(', ')
                      toast.error(`Không thể đặt hàng. Các cửa hàng sau vượt quá số lượng vận chuyển: ${storeNames}`)
                      return
                    }
                    if (isOrderBlocked) {
                      toast.error(
                        `Đơn hàng có giá trị từ ${formatPrice(ORDER_BLOCK_THRESHOLD)}đ trở lên không thể đặt hàng. Vui lòng tách đơn giúp tôi.`
                      )
                      return
                    }
                    navigate('/cart/checkout', {
                      state: {
                        selectedItems: selectedItems,
                        cartData: cartData
                      }
                    })
                  }}
                  className='w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg mb-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  disabled={
                    !isActiveUser ||
                    getSelectedCount() === 0 ||
                    hasOutOfStockSelectedItems() ||
                    hasMaxShippingLimitStores() ||
                    isOrderBlocked
                  }
                >
                  {hasOutOfStockSelectedItems()
                    ? 'Có sản phẩm hết hàng'
                    : hasMaxShippingLimitStores()
                      ? 'Vượt quá số lượng vận chuyển'
                      : isOrderBlocked
                        ? 'Đơn hàng quá 30 triệu'
                        : 'Mua hàng'}
                </button>

                <button
                  onClick={() => {
                    if (!isActiveUser) return
                    navigate('/products')
                  }}
                  className='w-full hover:bg-green-50 border border-gray-300 text-green-600 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors'
                  disabled={!isActiveUser}
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
    </div>
  )
}
