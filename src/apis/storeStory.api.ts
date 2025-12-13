import axiosInstance from '../service/axiosInstance'
import type { StoreStoryListResponse, StoreStoryResponse } from '../types/storeStoryType'

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
  StoreId: string
  IsActive?: boolean
}

export const storeStoryApi = {
  getByStore: (storeId: string): Promise<StoreStoryListResponse> =>
    axiosInstance.get(`/StoreStory/by-store/${storeId}`),

  getById: (storyId: string): Promise<StoreStoryResponse> => axiosInstance.get(`/StoreStory/${storyId}`),

  create: async (data: StoreStoryUpdateData): Promise<any> => {
    const formData = new FormData()

    formData.append('Title', data.Title)
    formData.append('TextIntro', data.TextIntro)
    formData.append('VideoOpenerDescription', data.VideoOpenerDescription)
    formData.append('SingleImageDescription', data.SingleImageDescription)
    formData.append('GalleryDescription', data.GalleryDescription)
    formData.append('VideoProcessDescription', data.VideoProcessDescription)
    formData.append('TextExpanded', data.TextExpanded)
    formData.append('VideoTestimonialDescription', data.VideoTestimonialDescription)
    formData.append('TextClosing', data.TextClosing)
    formData.append('StoreId', data.StoreId)

    if (data.VideoOpener) {
      formData.append('VideoOpener', data.VideoOpener)
    }
    if (data.SingleImage) {
      formData.append('SingleImage', data.SingleImage)
    }
    if (data.GalleryImages && data.GalleryImages.length > 0) {
      data.GalleryImages.forEach((image) => {
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

    const response = await axiosInstance.post<any>('/Story', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response
  },

  update: async (storyId: string, data: StoreStoryUpdateData): Promise<any> => {
    const formData = new FormData()

    // Required text fields
    formData.append('Title', data.Title)
    formData.append('TextIntro', data.TextIntro)
    formData.append('TextExpanded', data.TextExpanded)
    formData.append('TextClosing', data.TextClosing)
    formData.append('VideoOpenerDescription', data.VideoOpenerDescription)
    formData.append('SingleImageDescription', data.SingleImageDescription)
    formData.append('GalleryDescription', data.GalleryDescription)
    formData.append('VideoProcessDescription', data.VideoProcessDescription)
    formData.append('VideoTestimonialDescription', data.VideoTestimonialDescription)

    // File fields - append file if exists, otherwise append empty Blob to match curl format
    if (data.VideoOpener) {
      formData.append('VideoOpener', data.VideoOpener)
    } else {
      formData.append('VideoOpener', new Blob(), '')
    }

    if (data.SingleImage) {
      formData.append('SingleImage', data.SingleImage)
    } else {
      formData.append('SingleImage', new Blob(), '')
    }

    if (data.VideoProcess) {
      formData.append('VideoProcess', data.VideoProcess)
    } else {
      formData.append('VideoProcess', new Blob(), '')
    }

    if (data.VideoTestimonial) {
      formData.append('VideoTestimonial', data.VideoTestimonial)
    } else {
      formData.append('VideoTestimonial', new Blob(), '')
    }

    // GalleryImages - can have multiple files
    if (data.GalleryImages && data.GalleryImages.length > 0) {
      data.GalleryImages.forEach((image) => {
        formData.append('GalleryImages', image)
      })
    }

    // ThumbnailImage - append if exists
    if (data.ThumbnailImage) {
      formData.append('ThumbnailImage', data.ThumbnailImage)
    }

    // IsActive - append if provided
    if (data.IsActive !== undefined) {
      formData.append('IsActive', data.IsActive.toString())
    }

    const response = await axiosInstance.put<any>(`/Story/${storyId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response
  },

  // Deactivate story using update API with IsActive = false
  deactivateUsingUpdate: async (
    storyId: string,
    currentStory: {
      Title: string
      TextIntro: string
      VideoOpenerDescription: string
      SingleImageDescription: string
      GalleryDescription: string
      VideoProcessDescription: string
      TextExpanded: string
      VideoTestimonialDescription: string
      TextClosing: string
      StoreId: string
    }
  ): Promise<any> => {
    const formData = new FormData()

    // Required text fields (use current story data)
    formData.append('Title', currentStory.Title)
    formData.append('TextIntro', currentStory.TextIntro)
    formData.append('TextExpanded', currentStory.TextExpanded)
    formData.append('TextClosing', currentStory.TextClosing)
    formData.append('VideoOpenerDescription', currentStory.VideoOpenerDescription)
    formData.append('SingleImageDescription', currentStory.SingleImageDescription)
    formData.append('GalleryDescription', currentStory.GalleryDescription)
    formData.append('VideoProcessDescription', currentStory.VideoProcessDescription)
    formData.append('VideoTestimonialDescription', currentStory.VideoTestimonialDescription)

    // File fields - append empty Blob to maintain form structure
    formData.append('VideoOpener', new Blob(), '')
    formData.append('SingleImage', new Blob(), '')
    formData.append('VideoProcess', new Blob(), '')
    formData.append('VideoTestimonial', new Blob(), '')

    // Set IsActive = false to deactivate
    formData.append('IsActive', 'false')

    const response = await axiosInstance.put<any>(`/Story/${storyId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response
  }
}
