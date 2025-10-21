import axiosInstance from '../service/axiosInstance'
import type { CartResponse, ShippingFeeResponse } from '../types/cartType'

const API_URL = '/Cart'
export const getCartByUserId = async (userId: string): Promise<any> => {
  const response = await axiosInstance.get<CartResponse>(`${API_URL}/${userId}`)
  return response
}

export const getCartCount = async (userId: string): Promise<any> => {
  const response = await axiosInstance.get<{ data: number }>(`${API_URL}/count/${userId}`)
  return response
}

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

export const updateCartItem = async (cartItemId: string, quantity: number): Promise<any> => {
  const response = await axiosInstance.put<CartResponse>(`${API_URL}/update-item`, {
    cartItemId,
    quantity
  })
  return response.data
}

export const removeCartItem = async (userId: string, itemId: string): Promise<any> => {
  const response = await axiosInstance.put<CartResponse>(`${API_URL}/remove-item/${itemId}`, { userId })
  return response.data
}

export const removeCartItemDirect = async (cartItemId: string): Promise<any> => {
  const response = await axiosInstance.put<CartResponse>(`${API_URL}/remove-item/${cartItemId}`)
  return response.data
}

export const updateCombo = async (userId: string, comboId: string, quantity: number): Promise<CartResponse> => {
  const response = await axiosInstance.put<CartResponse>(`${API_URL}/update-combo`, {
    userId,
    comboId,
    quantity
  })
  return response.data
}

export const removeCombo = async (userId: string, comboId: string): Promise<CartResponse> => {
  const response = await axiosInstance.put<CartResponse>(`${API_URL}/${userId}/remove-combo/${comboId}`)
  return response.data
}

export const removePromotionFromCart = async (cartId: string, promotionId: string): Promise<any> => {
  const response = await axiosInstance.put(`${API_URL}/${cartId}/delete-promotion/${promotionId}`)
  return response
}

export const calculateShippingFee = async (
  cartItemIds: string[],
  userAddressId: string
): Promise<ShippingFeeResponse> => {
  const response = await axiosInstance.post<ShippingFeeResponse>(`${API_URL}/calculate-shipping-fee`, {
    cartItemIds,
    userAddressId
  })
  return response.data
}
