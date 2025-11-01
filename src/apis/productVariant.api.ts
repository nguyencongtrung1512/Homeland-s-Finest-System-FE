import axiosInstance from '../service/axiosInstance'
import type { ProductVariant, CreateVariantResponse } from '../types/productVariantType'

const API_URL = `/Product`

// Type for creating single variant
interface CreateVariantRequest {
  variantName: string
  quantity: number
  price: number
  length?: number
  width?: number
  height?: number
  weight?: number
}
interface UpdateVariantRequest {
  variants: Array<{
    id?: string 
    variantName: string
    quantity: number
    price: number
    isActive?: boolean
    length?: number
    width?: number
    height?: number
    weight?: number
  }>
}

export const productVariantApi = {
  // Create single product variant
  create: async (productId: string, data: CreateVariantRequest) => {
    return await axiosInstance.post<CreateVariantResponse>(`${API_URL}/${productId}/variants`, data)
  },
  // Update variant - không cần variantId, chỉ cần productId
  update: async (productId: string, data: UpdateVariantRequest) => {
    return await axiosInstance.put<ProductVariant>(`${API_URL}/${productId}/variants`, data)
  },

  // Activate variant
  activate: async (variantId: string) => {
    return await axiosInstance.put<ProductVariant>(`${API_URL}/variant/${variantId}/activate`)
  },

  // Deactivate variant
  deactivate: async (variantId: string) => {
    return await axiosInstance.put<ProductVariant>(`${API_URL}/variant/${variantId}/deactivate`)
  }
}

export default productVariantApi
