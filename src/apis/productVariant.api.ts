import axiosInstance from '../service/axiosInstance'
import type { ProductVariant, CreateVariantResponse } from '../types/productVariantType'

const API_URL = `/Product`

// Type for creating single variant - matching curl example
export interface CreateVariantRequest {
  StoreId: string
  ParentId: string
  Description?: string
  ProductImages?: File[]
  AttributeName?: string
  AttributeType?: string
  // SKU Details
  SkuDetails: {
    Weight?: number
    BasePrice: number
    Length?: number
    Height?: number
    Quantity: number
    Width?: number
  }
}

// Type for updating variant - matching curl example
export interface UpdateVariantRequest {
  attributeName?: string
  attributeType?: string
  description?: string
  basePrice?: number
  quantity?: number
  length?: number
  width?: number
  height?: number
  weight?: number
  isActive?: boolean
}

export const productVariantApi = {
  // Create single product variant with FormData
  create: async (data: CreateVariantRequest): Promise<CreateVariantResponse> => {
    const formData = new FormData()

    // Required fields
    formData.append('StoreId', data.StoreId)
    formData.append('ParentId', data.ParentId)

    // SKU Details
    formData.append('SkuDetails.BasePrice', data.SkuDetails.BasePrice.toString())
    formData.append('SkuDetails.Quantity', data.SkuDetails.Quantity.toString())

    if (data.SkuDetails.Weight !== undefined) {
      formData.append('SkuDetails.Weight', data.SkuDetails.Weight.toString())
    }
    if (data.SkuDetails.Length !== undefined) {
      formData.append('SkuDetails.Length', data.SkuDetails.Length.toString())
    }
    if (data.SkuDetails.Height !== undefined) {
      formData.append('SkuDetails.Height', data.SkuDetails.Height.toString())
    }
    if (data.SkuDetails.Width !== undefined) {
      formData.append('SkuDetails.Width', data.SkuDetails.Width.toString())
    }

    // Optional fields
    if (data.Description) {
      formData.append('Description', data.Description)
    }

    if (data.ProductImages && data.ProductImages.length > 0) {
      data.ProductImages.forEach((file) => {
        formData.append('ProductImages', file)
      })
    }

    if (data.AttributeName) {
      formData.append('AttributeName', data.AttributeName)
    }

    if (data.AttributeType) {
      formData.append('AttributeType', data.AttributeType)
    }

    const response = await axiosInstance.post(`${API_URL}/CreateProductVariant`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return response as unknown as CreateVariantResponse
  },
  // Update variant - PUT /api/Product/{parentId}/variants/{variantId}
  update: async (parentId: string, variantId: string, data: UpdateVariantRequest) => {
    return await axiosInstance.put(`${API_URL}/${parentId}/variants/${variantId}`, data)
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
