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
      storyDetail?: string
      newThumbnail?: File
      removeExistingThumbnail?: boolean
      newStoryVideo?: File
      removeExistingStoryVideo?: boolean
      newStoryImages?: File[]
      removeExistingStoryImages?: boolean
    }
  ) => {
    const formData = new FormData()
    if (data.title) {
      formData.append('Title', data.title)
    }

    if (data.storyDetail) {
      formData.append('StoryDetail', data.storyDetail)
    }

    // Handle Thumbnail
    if (data.newThumbnail) {
      formData.append('NewThumbnail', data.newThumbnail)
      formData.append('RemoveExistingThumbnail', String(data.removeExistingThumbnail ?? true))
    } else {
      formData.append('RemoveExistingThumbnail', String(data.removeExistingThumbnail ?? false))
    }

    // Handle Story Video
    if (data.newStoryVideo) {
      formData.append('NewStoryVideo', data.newStoryVideo)
      formData.append('RemoveExistingStoryVideo', String(data.removeExistingStoryVideo ?? true))
    } else {
      formData.append('RemoveExistingStoryVideo', String(data.removeExistingStoryVideo ?? false))
    }

    // Handle Story Images
    if (data.newStoryImages && data.newStoryImages.length > 0) {
      data.newStoryImages.forEach((image) => {
        formData.append('NewStoryImages', image)
      })
      formData.append('RemoveExistingStoryImages', String(data.removeExistingStoryImages ?? true))
    } else {
      formData.append('RemoveExistingStoryImages', String(data.removeExistingStoryImages ?? false))
    }

    return await axiosInstance.put<ProductStoryResponse>(`${API_URL}/${storyId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export default productStoryApi
