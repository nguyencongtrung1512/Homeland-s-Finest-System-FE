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
  // SKU Details - optional, if not provided, creates a group node
  SkuDetails?: {
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
  removeExistingImage?: boolean
  newProductImage?: File
}

export const productVariantApi = {
  // Create single product variant with FormData
  create: async (data: CreateVariantRequest): Promise<CreateVariantResponse> => {
    const formData = new FormData()

    // Required fields
    formData.append('StoreId', data.StoreId)
    formData.append('ParentId', data.ParentId)

    // SKU Details - only append if provided (if not provided, creates a group node)
    if (data.SkuDetails) {
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
    const formData = new FormData()

    // Optional fields - only append if they have values
    if (data.attributeName !== undefined) {
      formData.append('AttributeName', data.attributeName)
    }
    if (data.attributeType !== undefined) {
      formData.append('AttributeType', data.attributeType)
    }
    if (data.description !== undefined) {
      formData.append('Description', data.description)
    }
    if (data.basePrice !== undefined) {
      formData.append('BasePrice', data.basePrice.toString())
    }
    if (data.quantity !== undefined) {
      formData.append('Quantity', data.quantity.toString())
    }
    if (data.length !== undefined) {
      formData.append('Length', data.length.toString())
    }
    if (data.width !== undefined) {
      formData.append('Width', data.width.toString())
    }
    if (data.height !== undefined) {
      formData.append('Height', data.height.toString())
    }
    if (data.weight !== undefined) {
      formData.append('Weight', data.weight.toString())
    }
    if (data.isActive !== undefined) {
      formData.append('IsActive', data.isActive.toString())
    }
    if (data.removeExistingImage !== undefined) {
      formData.append('RemoveExistingImage', data.removeExistingImage.toString())
    }
    if (data.newProductImage !== undefined) {
      formData.append('NewProductImage', data.newProductImage)
    }

    return await axiosInstance.put(`${API_URL}/${parentId}/variants/${variantId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
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
