import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './auth.context'
import { getCartByUserId, addToCart as addToCartAPI, getCartCount } from '../apis/cart.api'
import type { CartData, Cart as APICart, CartItem as APICartItem } from '../types/cartType'
import { toast } from 'react-toastify'

// Local cart item interface for UI
export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  variant?: string
  storeId?: string
  productVariantId?: string
  comboId?: string
  isCombo?: boolean
}

interface CartContextProps {
  cart: CartItem[]
  cartCount: number
  loading: boolean
  addToCart: (productVariantId: string, quantity: number, comboId?: string) => Promise<void>
  refreshCart: () => Promise<void>
  clearCart: () => void
}

const CartContext = createContext<CartContextProps | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth()
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartCount, setCartCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Transform API cart data to local cart items
  const transformCartData = (cartData?: CartData | null): CartItem[] => {
    if (!cartData || !Array.isArray(cartData.carts)) return []

    const items: CartItem[] = []
    cartData.carts.forEach((storeCart: APICart) => {
      if (!Array.isArray(storeCart?.items)) return
      storeCart.items.forEach((item: APICartItem) => {
        items.push({
          id: item.id,
          name: item.name,
          price: item.unitPrice,
          image: item.imageUrl,
          quantity: item.quantity,
          storeId: storeCart.storeId,
          productVariantId: item.productVariantId,
          comboId: item.comboId,
          isCombo: item.isCombo
        })
      })
    })

    return items
  }

  // Load cart data from API
  const loadCart = async () => {
    if (!user?.userId || !isAuthenticated) {
      setCart([])
      setCartCount(0)
      return
    }

    try {
      setLoading(true)
      const cartResponse = await getCartByUserId(user.userId)
      const transformedCart = transformCartData(cartResponse?.data)
      const countFromSummary =
        cartResponse?.data?.summary?.totalItems ?? transformedCart.reduce((sum, i) => sum + i.quantity, 0)

      setCart(transformedCart)
      setCartCount(countFromSummary)
    } catch (error) {
      console.error('Error loading cart:', error)
      setCart([])
      setCartCount(0)
    } finally {
      setLoading(false)
    }
  }

  // Add item to cart via API
  // CartProvider: addToCart
  const addToCart = async (productVariantId: string, quantity: number, comboId?: string) => {
    if (!user?.userId || !isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng')
      return
    }

    if (quantity <= 0) {
      toast.error('Số lượng phải lớn hơn 0')
      return
    }

    try {
      const items = [
        {
          productVariantId: comboId ? undefined : productVariantId,
          comboId: comboId,
          quantity: quantity
        }
      ]
      console.log('[AddToCart] payload:', items)
      await addToCartAPI(user.userId, items)
      await loadCart()
      toast.success('Đã thêm sản phẩm vào giỏ hàng!')
    } catch (error: any) {
      console.error('Error adding to cart:', error)
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng'
      toast.error(errorMessage)
    }
  }

  // Refresh cart data
  const refreshCart = async () => {
    await loadCart()
  }

  // Clear cart (local only)
  const clearCart = () => {
    setCart([])
    setCartCount(0)
  }

  // Load cart when user changes
  useEffect(() => {
    loadCart()
  }, [user?.userId, isAuthenticated])

  return (
    <CartContext.Provider 
      value={{ 
        cart, 
        cartCount, 
        loading, 
        addToCart, 
        refreshCart, 
        clearCart 
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
