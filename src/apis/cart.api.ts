import axiosInstance from '../service/axiosInstance'
import type { CartData, CartResponse } from '../types/cartType'

const API_URL = '/Cart'
// Get cart data for a specific user
export const getCartByUserId = async (userId: string): Promise<any> => {
  const response = await axiosInstance.get<CartResponse>(`${API_URL}/${userId}`)
  return response
}

// Get cart item count for a specific user
export const getCartCount = async (userId: string): Promise<any> => {
  const response = await axiosInstance.get<{ data: number }>(`${API_URL}/count/${userId}`)
  return response
}

// Add item to cart
// addToCart function
export const addToCart = async (
  userId: string,
  items: Array<{
    productVariantId?: string
    comboId?: string
    quantity: number
  }>
): Promise<CartResponse> => {
  const response = await axiosInstance.post<CartResponse>(`${API_URL}/${userId}/add`, items)
  return response.data
}

// Update cart item quantity
export const updateCartItem = async (userId: string, itemId: string, quantity: number): Promise<CartData> => {
  const response = await axiosInstance.put<CartResponse>(`${API_URL}/update-item`, {
    userId,
    itemId,
    quantity
  })
  return response.data.data
}

// Remove item from cart
export const removeCartItem = async (userId: string, itemId: string): Promise<CartData> => {
  const response = await axiosInstance.put<CartResponse>(`${API_URL}/remove-item/${itemId}`, { userId })
  return response.data.data
}

// Update combo in cart
export const updateCombo = async (userId: string, comboId: string, quantity: number): Promise<CartResponse> => {
  const response = await axiosInstance.put<CartResponse>(`${API_URL}/update-combo`, {
    userId,
    comboId,
    quantity
  })
  return response.data
}

// Remove combo from cart
export const removeCombo = async (userId: string, comboId: string): Promise<CartResponse> => {
  const response = await axiosInstance.put<CartResponse>(`${API_URL}/${userId}/remove-combo/${comboId}`)
  return response.data
}
