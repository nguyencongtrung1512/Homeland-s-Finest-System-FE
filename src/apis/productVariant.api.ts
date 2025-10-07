import axiosInstance from '../service/axiosInstance'
import type { ProductVariant, ProductVariantInput } from '../types/productVariantType'

const API_URL = `/Product`

export const productVariantApi = {
  // Create product variant
  create: async (productId: string, data: ProductVariantInput) => {
    return await axiosInstance.post<ProductVariant>(`${API_URL}/${productId}/variants`, data)
  },
  // Update variant
  update: async (productId: string, variantId: string, data: ProductVariantInput) => {
    return await axiosInstance.put<ProductVariant>(`${API_URL}/${productId}/variants/${variantId}`, data)
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
