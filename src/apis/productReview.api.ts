import axiosInstance from '../service/axiosInstance'
import type {
  ProductReviewCreateInput,
  ProductReviewUpdateInput,
  GetReviewListParams,
  ReplyReviewRequest,
  UpdateReplyRequest,
  ReviewListResponse,
  ReviewStatsApiResponse,
  ReviewApiResponse,
  SellerReplyResponse
} from '../types/productReviewType'

const API_URL = '/ProductReview'

export const productReviewApi = {
  // 1. Get reviews by product (with pagination & filters)
  getReviewsByProduct: async (productId: string, params?: GetReviewListParams): Promise<ReviewListResponse> => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())
    if (params?.rating) queryParams.append('rating', params.rating.toString())
    if (params?.hasImage !== undefined) queryParams.append('hasImage', params.hasImage.toString())
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)

    const url = `${API_URL}/products/${productId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await axiosInstance.get(url)
    return response as unknown as ReviewListResponse
  },

  // 2. Get review stats for a product
  getReviewStats: async (productId: string): Promise<ReviewStatsApiResponse> => {
    const response = await axiosInstance.get(`${API_URL}/products/${productId}/stats`)
    return response as unknown as ReviewStatsApiResponse
  },

  // 3. Create product review
  // Backend will validate: OrderItemId exists, belongs to user, order is completed, and not reviewed yet
  createReview: async (reviewData: ProductReviewCreateInput): Promise<ReviewApiResponse> => {
    const formData = new FormData()

    // Required fields per documentation
    formData.append('OrderItemId', reviewData.orderItemId)
    formData.append('Rating', reviewData.rating.toString())

    // Optional fields
    if (reviewData.comment) {
      formData.append('Comment', reviewData.comment)
    }

    // Add images if provided
    if (reviewData.images && reviewData.images.length > 0) {
      reviewData.images.forEach((image) => {
        formData.append('Images', image)
      })
    }

    const response = await axiosInstance.post(API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response as unknown as ReviewApiResponse
  },

  // 4. Update review
  updateReview: async (reviewId: string, updateData: ProductReviewUpdateInput): Promise<ReviewApiResponse> => {
    const formData = new FormData()

    // Required field
    formData.append('Rating', updateData.rating.toString())

    // Optional comment
    if (updateData.comment !== undefined) {
      formData.append('Comment', updateData.comment || '')
    }

    // Keep old images (array of URLs)
    if (updateData.keepImages && updateData.keepImages.length > 0) {
      updateData.keepImages.forEach((url) => {
        formData.append('KeepImages', url)
      })
    }

    // Add new images (files)
    if (updateData.newImages && updateData.newImages.length > 0) {
      updateData.newImages.forEach((image) => {
        formData.append('NewImages', image)
      })
    }

    const response = await axiosInstance.put(`${API_URL}/${reviewId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response as unknown as ReviewApiResponse
  },

  // 5. Reply to a review (for seller)
  replyToReview: async (reviewId: string, replyData: ReplyReviewRequest): Promise<SellerReplyResponse> => {
    const response = await axiosInstance.post(
      `${API_URL}/${reviewId}/reply`,
      { content: replyData.content },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    return response as unknown as SellerReplyResponse
  },

  // 6. Update seller reply
  updateReply: async (replyId: string, replyData: UpdateReplyRequest): Promise<SellerReplyResponse> => {
    const response = await axiosInstance.put(
      `${API_URL}/reply/${replyId}`,
      { content: replyData.content },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    return response as unknown as SellerReplyResponse
  },

  // 7. Ban/Remove review (Admin/Staff)
  banReview: async (reviewId: string): Promise<{ status: number; message: string; data: boolean }> => {
    const response = await axiosInstance.put(`${API_URL}/${reviewId}/ban`)
    return response as unknown as { status: number; message: string; data: boolean }
  },

  // 8. Get reviews by combo
  getReviewsByCombo: async (comboId: string, params?: GetReviewListParams): Promise<ReviewListResponse> => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())
    if (params?.rating) queryParams.append('rating', params.rating.toString())
    if (params?.hasImage !== undefined) queryParams.append('hasImage', params.hasImage.toString())
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)

    const url = `${API_URL}/combos/${comboId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await axiosInstance.get(url)
    return response as unknown as ReviewListResponse
  },

  // Get reviews by store (for seller) - existing method
  getReviewsByStore: async (
    storeId: string,
    params?: { pageSize?: number; pageNumber?: number; rating?: number }
  ): Promise<ReviewListResponse> => {
    const queryParams = new URLSearchParams()
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())
    if (params?.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString())
    if (params?.rating) queryParams.append('rating', params.rating.toString())

    const url = `${API_URL}/store/${storeId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await axiosInstance.get(url)
    return response as unknown as ReviewListResponse
  }
}

export default productReviewApi
