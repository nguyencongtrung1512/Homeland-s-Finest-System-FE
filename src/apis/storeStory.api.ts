import axiosInstance from '../service/axiosInstance'
import type { StoreStoryListResponse } from '../types/storeStoryType'

export interface StoreStoryUpdateData {
  Title: string
  TextIntro: string
  VideoOpener?: File
  VideoOpenerDescription: string
  SingleImage?: File
  SingleImageDescription: string
  GalleryImages?: File[]
  GalleryDescription: string
  VideoProcess?: File
  VideoProcessDescription: string
  TextExpanded: string
  VideoTestimonial?: File
  VideoTestimonialDescription: string
  TextClosing: string
  ThumbnailImage?: File
}

export const storeStoryApi = {
  getByStore: (storeId: string): Promise<StoreStoryListResponse> =>
    axiosInstance.get(`/StoreStory/by-store/${storeId}`),

  create: (data: StoreStoryUpdateData): Promise<any> => {
    const formData = new FormData()

    // Add text fields
    formData.append('Title', data.Title)
    formData.append('TextIntro', data.TextIntro)
    formData.append('VideoOpenerDescription', data.VideoOpenerDescription)
    formData.append('SingleImageDescription', data.SingleImageDescription)
    formData.append('GalleryDescription', data.GalleryDescription)
    formData.append('VideoProcessDescription', data.VideoProcessDescription)
    formData.append('TextExpanded', data.TextExpanded)
    formData.append('VideoTestimonialDescription', data.VideoTestimonialDescription)
    formData.append('TextClosing', data.TextClosing)

    // Add file fields
    if (data.VideoOpener) {
      formData.append('VideoOpener', data.VideoOpener)
    }
    if (data.SingleImage) {
      formData.append('SingleImage', data.SingleImage)
    }
    if (data.GalleryImages && data.GalleryImages.length > 0) {
      data.GalleryImages.forEach(image => {
        formData.append('GalleryImages', image)
      })
    }
    if (data.VideoProcess) {
      formData.append('VideoProcess', data.VideoProcess)
    }
    if (data.VideoTestimonial) {
      formData.append('VideoTestimonial', data.VideoTestimonial)
    }
    if (data.ThumbnailImage) {
      formData.append('ThumbnailImage', data.ThumbnailImage)
    }

    return axiosInstance.post('/Story', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  update: (storyId: string, data: StoreStoryUpdateData): Promise<any> => {
    const formData = new FormData()

    // Add text fields
    formData.append('Title', data.Title)
    formData.append('TextIntro', data.TextIntro)
    formData.append('VideoOpenerDescription', data.VideoOpenerDescription)
    formData.append('SingleImageDescription', data.SingleImageDescription)
    formData.append('GalleryDescription', data.GalleryDescription)
    formData.append('VideoProcessDescription', data.VideoProcessDescription)
    formData.append('TextExpanded', data.TextExpanded)
    formData.append('VideoTestimonialDescription', data.VideoTestimonialDescription)
    formData.append('TextClosing', data.TextClosing)

    // Add file fields
    if (data.VideoOpener) {
      formData.append('VideoOpener', data.VideoOpener)
    }
    if (data.SingleImage) {
      formData.append('SingleImage', data.SingleImage)
    }
    if (data.GalleryImages && data.GalleryImages.length > 0) {
      data.GalleryImages.forEach(image => {
        formData.append('GalleryImages', image)
      })
    }
    if (data.VideoProcess) {
      formData.append('VideoProcess', data.VideoProcess)
    }
    if (data.VideoTestimonial) {
      formData.append('VideoTestimonial', data.VideoTestimonial)
    }
    if (data.ThumbnailImage) {
      formData.append('ThumbnailImage', data.ThumbnailImage)
    }

    return axiosInstance.put(`/Story/${storyId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}
