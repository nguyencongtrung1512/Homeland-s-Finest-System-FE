import { createContext, useContext, useState } from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  weight?: string
}

interface CartContextProps {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextProps | undefined>(undefined)

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([])

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const found = prev.find((i) => i.id === item.id && i.weight === item.weight)
      if (found) {
        return prev.map((i) =>
          i.id === item.id && i.weight === item.weight ? { ...i, quantity: i.quantity + item.quantity } : i
        )
      }
      return [...prev, item]
    })
  }

  const clearCart = () => setCart([])

  return <CartContext.Provider value={{ cart, addToCart, clearCart }}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
