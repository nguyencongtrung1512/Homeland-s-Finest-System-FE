import axiosInstance from '../service/axiosInstance'
import type { ProductReviewCreateInput } from '../types/productReviewType'

const API_URL = '/ProductReview'

export const productReviewApi = {
  // Create product review
  // Backend will validate: OrderItemId exists, belongs to user, order is completed, and not reviewed yet
  createReview: async (reviewData: ProductReviewCreateInput): Promise<unknown> => {
    const formData = new FormData()

    formData.append('OrderItemId', reviewData.orderItemId)
    formData.append('ProductId', reviewData.productId)
    formData.append('UserId', reviewData.userId)
    formData.append('Rating', reviewData.rating.toString())
    formData.append('Comment', reviewData.comment || '')

    if (reviewData.comboId) {
      formData.append('ComboId', reviewData.comboId)
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
    return response
  },

  // Get reviews by store (for seller)
  getReviewsByStore: async (
    storeId: string,
    params?: { pageSize?: number; pageNumber?: number; rating?: number }
  ): Promise<unknown> => {
    const queryParams = new URLSearchParams()
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())
    if (params?.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString())
    if (params?.rating) queryParams.append('rating', params.rating.toString())

    const url = `${API_URL}/store/${storeId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await axiosInstance.get(url)
    return response
  },

  // Reply to a review (for seller)
  replyToReview: async (reviewId: string, replyData: { comment: string }): Promise<unknown> => {
    const formData = new FormData()
    formData.append('Comment', replyData.comment)

    const response = await axiosInstance.post(`${API_URL}/${reviewId}/reply`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response
  }
}

export default productReviewApi
