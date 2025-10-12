import axiosInstance from '../service/axiosInstance'
import type { CartData, CartResponse } from '../types/cartType'

// Get cart data for a specific user
export const getCartByUserId = async (userId: string): Promise<CartResponse> => {
  const response = await axiosInstance.get<CartResponse>(`/api/Cart/${userId}`)
  return response.data
}

// Add item to cart
export const addToCart = async (
  userId: string,
  item: {
    productVariantId?: string
    comboId?: string
    quantity: number
  }
): Promise<CartResponse> => {
  const response = await axiosInstance.post<CartResponse>(`/api/Cart/${userId}`, item)
  return response.data
}

// Update cart item quantity
export const updateCartItem = async (userId: string, itemId: string, quantity: number): Promise<CartData> => {
  const response = await axiosInstance.put<CartResponse>(`/api/Cart/${userId}/items/${itemId}`, { quantity })
  return response.data.data
}

// Remove item from cart
export const removeCartItem = async (userId: string, itemId: string): Promise<CartData> => {
  const response = await axiosInstance.delete<CartResponse>(`/api/Cart/${userId}/items/${itemId}`)
  return response.data.data
}
