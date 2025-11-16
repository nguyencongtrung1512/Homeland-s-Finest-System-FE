import axiosInstance from '../service/axiosInstance'
import type { ProductReviewCreateInput } from '../types/productReviewType'

const API_URL = '/ProductReview'

export const productReviewApi = {
  // Create product review
  // Backend will validate: OrderItemId exists, belongs to user, order is completed, and not reviewed yet
  createReview: async (reviewData: ProductReviewCreateInput): Promise<unknown> => {
    const formData = new FormData()

    formData.append('OrderItemId', reviewData.orderItemId)
    formData.append('UserId', reviewData.userId)
    formData.append('Rating', reviewData.rating.toString())
    formData.append('Comment', reviewData.comment || '')

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
  }
}

export default productReviewApi