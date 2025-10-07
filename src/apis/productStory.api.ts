import axiosInstance from '../service/axiosInstance'
import type { ProductStoryUpdateInput, ProductStoryResponse, ProductStoryListResponse } from '../types/productStoryType'

const API_URL = `/ProductStory`

export const productStoryApi = {
  // Get all stories by product ID
  getByProductId: async (productId: string) => {
    return await axiosInstance.get<ProductStoryListResponse>(`${API_URL}/by-product/${productId}`)
  },

  // Update story with multipart/form-data
  update: async (
    storyId: string,
    data: ProductStoryUpdateInput & {
      thumbnail?: File
      storyDetail?: string
      storyVideo?: File
      storyImages?: File[]
    }
  ) => {
    const formData = new FormData()

    // Add basic fields if provided
    if (data.title) {
      formData.append('Title', data.title)
    }

    if (data.thumbnailUrl) {
      formData.append('ThumbnailUrl', data.thumbnailUrl)
    }

    if (data.storyDetail) {
      formData.append('StoryDetail', data.storyDetail)
    }

    // Add optional files
    if (data.thumbnail) {
      formData.append('Thumbnail', data.thumbnail)
    }

    if (data.storyVideo) {
      formData.append('StoryVideo', data.storyVideo)
    }

    if (data.storyImages && data.storyImages.length > 0) {
      data.storyImages.forEach((image) => {
        formData.append('StoryImages', image)
      })
    }

    return await axiosInstance.put<ProductStoryResponse>(`/api/ProductStory/${storyId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export default productStoryApi
