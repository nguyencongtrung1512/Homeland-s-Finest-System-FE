import axiosInstance from '../service/axiosInstance'
import type { StoreStoryListResponse, StoreStoryResponse } from '../types/storeStoryType'

export interface StoreStoryUpdateData {
  Title: string
  TextIntro: string
  VideoOpener?: File
  RemoveExistingVideoOpener?: boolean
  VideoOpenerDescription: string
  SingleImage?: File
  RemoveExistingSingleImage?: boolean
  SingleImageDescription: string
  GalleryImages?: File[]
  RemoveExistingGalleryImages?: boolean
  GalleryDescription: string
  VideoProcess?: File
  RemoveExistingVideoProcess?: boolean
  VideoProcessDescription: string
  TextExpanded: string
  RemoveExistingTextExpanded?: boolean
  VideoTestimonial?: File
  RemoveExistingVideoTestimonial?: boolean
  VideoTestimonialDescription: string
  TextClosing: string
  ThumbnailImage?: File
  RemoveExistingThumbnail?: boolean
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
    formData.append('TextIntro', data.TextIntro || '')
    formData.append('TextClosing', data.TextClosing || '')
    
    // Optional text fields
    if (data.TextExpanded) {
      formData.append('TextExpanded', data.TextExpanded)
    }
    formData.append('VideoOpenerDescription', data.VideoOpenerDescription || '')
    formData.append('SingleImageDescription', data.SingleImageDescription || '')
    formData.append('GalleryDescription', data.GalleryDescription || '')
    formData.append('VideoProcessDescription', data.VideoProcessDescription || '')
    formData.append('VideoTestimonialDescription', data.VideoTestimonialDescription || '')

    // Thumbnail - Backend expects NewThumbnail and RemoveExistingThumbnail
    if (data.ThumbnailImage) {
      formData.append('NewThumbnail', data.ThumbnailImage)
    }
    if (data.RemoveExistingThumbnail !== undefined) {
      formData.append('RemoveExistingThumbnail', data.RemoveExistingThumbnail.toString())
    }

    // Video Opener - Backend expects NewVideoOpener and RemoveExistingVideoOpener
    if (data.VideoOpener) {
      formData.append('NewVideoOpener', data.VideoOpener)
    }
    if (data.RemoveExistingVideoOpener !== undefined) {
      formData.append('RemoveExistingVideoOpener', data.RemoveExistingVideoOpener.toString())
    }

    // Single Image - Backend expects NewSingleImage and RemoveExistingSingleImage
    if (data.SingleImage) {
      formData.append('NewSingleImage', data.SingleImage)
    }
    if (data.RemoveExistingSingleImage !== undefined) {
      formData.append('RemoveExistingSingleImage', data.RemoveExistingSingleImage.toString())
    }

    // Text Expanded - Backend expects RemoveExistingTextExpanded
    if (data.RemoveExistingTextExpanded !== undefined) {
      formData.append('RemoveExistingTextExpanded', data.RemoveExistingTextExpanded.toString())
    }

    // Video Process - Backend expects NewVideoProcess and RemoveExistingVideoProcess
    if (data.VideoProcess) {
      formData.append('NewVideoProcess', data.VideoProcess)
    }
    if (data.RemoveExistingVideoProcess !== undefined) {
      formData.append('RemoveExistingVideoProcess', data.RemoveExistingVideoProcess.toString())
    }

    // Gallery Images - Backend expects NewGalleryImages and RemoveExistingGalleryImages
    if (data.GalleryImages && data.GalleryImages.length > 0) {
      data.GalleryImages.forEach((image) => {
        formData.append('NewGalleryImages', image)
      })
    }
    if (data.RemoveExistingGalleryImages !== undefined) {
      formData.append('RemoveExistingGalleryImages', data.RemoveExistingGalleryImages.toString())
    }

    // Video Testimonial - Backend expects NewVideoTestimonial and RemoveExistingVideoTestimonial
    if (data.VideoTestimonial) {
      formData.append('NewVideoTestimonial', data.VideoTestimonial)
    }
    if (data.RemoveExistingVideoTestimonial !== undefined) {
      formData.append('RemoveExistingVideoTestimonial', data.RemoveExistingVideoTestimonial.toString())
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
