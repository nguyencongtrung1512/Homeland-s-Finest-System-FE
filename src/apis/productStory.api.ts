import axiosInstance from '../service/axiosInstance'
import type { ProductStoryUpdateInput, ProductStoryResponse } from '../types/productStoryType'

const API_URL = `/ProductStory`

export const productStoryApi = {
  getByProductId: async (productId: string) => {
    return await axiosInstance.get<any>(`${API_URL}/by-product/${productId}`)
  },

  create: async (data: {
    productId: string
    title: string
    storyDetail?: string
    storyVideo?: File
    storyImages?: File[]
  }) => {
    const formData = new FormData()
    formData.append('ProductId', data.productId)
    formData.append('Title', data.title)

    if (data.storyDetail) {
      formData.append('StoryDetail', data.storyDetail)
    }

    if (data.storyVideo) {
      formData.append('StoryVideo', data.storyVideo)
    }

    if (data.storyImages && data.storyImages.length > 0) {
      data.storyImages.forEach((image) => {
        formData.append('StoryImages', image)
      })
    }

    return await axiosInstance.post<ProductStoryResponse>(API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

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
    if (data.title) {
      formData.append('Title', data.title)
    }

    if (data.thumbnailUrl) {
      formData.append('ThumbnailUrl', data.thumbnailUrl)
    }

    if (data.storyDetail) {
      formData.append('StoryDetail', data.storyDetail)
    }

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

    return await axiosInstance.put<ProductStoryResponse>(`${API_URL}/${storyId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export default productStoryApi
