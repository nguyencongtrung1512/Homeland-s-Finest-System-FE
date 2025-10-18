import axiosInstance from '../service/axiosInstance'
import {
  type PromotionDTO,
  type UserPromotionDetailDTO,
  type CartPromotionDto,
  type ClaimPromotionRequest,
  type ApplyPromotionToCartRequest,
  type PromotionAdminRequest,
  type PromotionSellerRequest,
  type ApiResponse,
  type ApiResponseWithPagination,
  type DisplayPromotionToApply,
  type DisplayUserPromotionToApply,
  type PromotionDetailDTO,
  type PromotionAdminDTO,
  type PromotionSellerDTO,
  type PromotionUserDTO,
  type PromotionFilter,
  type PromotionSort
} from '../types/promotionType'

// ========================================
// ADMIN PROMOTION APIs
// ========================================

/**
 * Tạo promotion mới (Admin)
 */
export const createPromotionAdmin = async (data: PromotionAdminRequest): Promise<ApiResponse<PromotionAdminDTO>> => {
  const formData = new FormData()

  // Add all fields to FormData with correct field names (PascalCase)
  formData.append('Type', data.type)
  formData.append('Title', data.title)
  formData.append('Description', data.description)
  formData.append('DiscountType', data.discountType)
  formData.append('DiscountValue', data.discountValue.toString())

  if (data.minValueDiscount) {
    formData.append('MinValueDiscount', data.minValueDiscount.toString())
  }

  formData.append('StartDate', data.startDate)
  formData.append('EndDate', data.endDate)

  if (data.maxQuantity) {
    formData.append('MaxQuantity', data.maxQuantity.toString())
  }

  formData.append('MaxPerUser', data.maxPerUser.toString())
  formData.append('IsActive', data.isActive.toString())

  // Add userIds for User type promotions (only when type is User)
  if (data.type === 'User' && data.userIds && data.userIds.length > 0) {
    data.userIds.forEach((userId) => {
      formData.append('UserIds', userId)
    })
  }

  return axiosInstance.post('/Admin/Promotion/create', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * Cập nhật promotion (Admin)
 */
export const updatePromotionAdmin = async (
  id: string,
  data: PromotionAdminRequest
): Promise<ApiResponse<PromotionAdminDTO>> => {
  const formData = new FormData()

  // Add all fields to FormData with correct field names (PascalCase)
  formData.append('Type', data.type)
  formData.append('Title', data.title)
  formData.append('Description', data.description)
  formData.append('DiscountType', data.discountType)
  formData.append('DiscountValue', data.discountValue.toString())

  if (data.minValueDiscount) {
    formData.append('MinValueDiscount', data.minValueDiscount.toString())
  }

  formData.append('StartDate', data.startDate)
  formData.append('EndDate', data.endDate)

  if (data.maxQuantity) {
    formData.append('MaxQuantity', data.maxQuantity.toString())
  }

  formData.append('MaxPerUser', data.maxPerUser.toString())
  formData.append('IsActive', data.isActive.toString())

  // Add userIds for User type promotions (only when type is User)
  if (data.type === 'User' && data.userIds && data.userIds.length > 0) {
    data.userIds.forEach((userId) => {
      formData.append('UserIds', userId)
    })
  }

  return axiosInstance.put(`/Admin/Promotion/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * Lấy chi tiết promotion (Admin)
 */
export const getPromotionDetailAdmin = async (id: string): Promise<ApiResponse<PromotionAdminDTO>> => {
  console.log('🔍 Getting promotion detail:', id)

  return axiosInstance.get(`/Promotion/detail/${id}`)
}

/**
 * Lấy tất cả promotions (Admin)
 */
export const getAllPromotionsAdmin = async (
  pageSize: number = 0,
  pageNumber: number = 1,
  filter?: PromotionFilter,
  sort?: PromotionSort
): Promise<ApiResponseWithPagination<PromotionDTO[]>> => {
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    pageNumber: pageNumber.toString()
  })

  // Add filter parameters
  if (filter) {
    if (filter.type) params.append('type', filter.type)
    if (filter.discountType) params.append('discountType', filter.discountType)
    if (filter.isActive !== undefined) params.append('isActive', filter.isActive.toString())
    if (filter.startDate) params.append('startDate', filter.startDate)
    if (filter.endDate) params.append('endDate', filter.endDate)
    if (filter.storeId) params.append('storeId', filter.storeId)
  }

  // Add sort parameters
  if (sort) {
    params.append('sortField', sort.field)
    params.append('sortDirection', sort.direction)
  }

  return axiosInstance.get(`/Admin/Promotion/GetAll?${params.toString()}`)
}

/**
 * Xóa promotion (Admin)
 */
export const deletePromotion = async (id: string): Promise<ApiResponse<PromotionDetailDTO>> => {
  return axiosInstance.put(`/Promotion/delete/${id}`)
}

// ========================================
// SELLER PROMOTION APIs
// ========================================

/**
 * Lấy promotions của seller
 */
export const getSellerPromotions = async (
  sellerId: string,
  pageSize: number = 0,
  pageNumber: number = 1,
  filter?: PromotionFilter,
  sort?: PromotionSort
): Promise<ApiResponse<PromotionDTO[]>> => {
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    pageNumber: pageNumber.toString()
  })

  // Add filter parameters
  if (filter) {
    if (filter.type) params.append('type', filter.type)
    if (filter.discountType) params.append('discountType', filter.discountType)
    if (filter.isActive !== undefined) params.append('isActive', filter.isActive.toString())
    if (filter.startDate) params.append('startDate', filter.startDate)
    if (filter.endDate) params.append('endDate', filter.endDate)
  }

  // Add sort parameters
  if (sort) {
    params.append('sortField', sort.field)
    params.append('sortDirection', sort.direction)
  }

  return axiosInstance.get(`/Seller/${sellerId}/Promotion/GetAll?${params.toString()}`)
}

/**
 * Tạo promotion (Seller)
 */
export const createPromotionSeller = async (data: PromotionSellerRequest): Promise<ApiResponse<PromotionSellerDTO>> => {
  const formData = new FormData()

  // Add all fields to FormData with PascalCase field names (matching backend)
  formData.append('sellerId', data.sellerId)
  formData.append('Title', data.title)
  formData.append('Description', data.description)
  formData.append('DiscountType', data.discountType)
  formData.append('DiscountValue', data.discountValue.toString())
  if (data.minValueDiscount) {
    formData.append('MinValueDiscount', data.minValueDiscount.toString())
  }
  formData.append('StartDate', data.startDate)
  formData.append('EndDate', data.endDate)
  if (data.maxQuantity) {
    formData.append('MaxQuantity', data.maxQuantity.toString())
  }
  formData.append('MaxPerUser', data.maxPerUser.toString())
  formData.append('IsActive', data.isActive.toString())

  // Add ProductIds if provided (for Product type promotions)
  if (data.productIds && data.productIds.length > 0) {
    data.productIds.forEach((productId) => {
      formData.append('ProductIds', productId)
    })
  }

  return axiosInstance.post('/Seller/Promotion/create', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * Cập nhật promotion (Seller)
 */
export const updatePromotionSeller = async (
  id: string,
  data: PromotionSellerRequest
): Promise<ApiResponse<PromotionSellerDTO>> => {
  console.log('🔍 Updating promotion with ID:', id)
  console.log('🔍 Update data:', data)

  const formData = new FormData()

  // Add all fields to FormData with PascalCase field names (matching backend)
  formData.append('sellerId', data.sellerId)
  formData.append('Title', data.title)
  formData.append('Description', data.description)
  formData.append('DiscountType', data.discountType)
  formData.append('DiscountValue', data.discountValue.toString())
  if (data.minValueDiscount) {
    formData.append('MinValueDiscount', data.minValueDiscount.toString())
  }
  formData.append('StartDate', data.startDate)
  formData.append('EndDate', data.endDate)
  if (data.maxQuantity) {
    formData.append('MaxQuantity', data.maxQuantity.toString())
  }
  formData.append('MaxPerUser', data.maxPerUser.toString())
  formData.append('IsActive', data.isActive.toString())

  // Add ProductIds if provided (for Product type promotions)
  if (data.productIds && data.productIds.length > 0) {
    data.productIds.forEach((productId) => {
      formData.append('ProductIds', productId)
    })
  }

  console.log('🔍 FormData entries:')
  for (const [key, value] of formData.entries()) {
    console.log(`  ${key}: ${value}`)
  }

  return axiosInstance.put(`/Seller/Promotion/update/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// ========================================
// USER PROMOTION APIs
// ========================================

/**
 * Lấy danh sách promotion active cho user
 */
export const getActivePromotionsForUser = async (): Promise<ApiResponse<PromotionDTO[]>> => {
  return axiosInstance.get('/Promotion/display-active-user')
}

/**
 * User claim promotion
 */
export const claimPromotion = async (promotionId: string, userId: string): Promise<ApiResponse<unknown>> => {
  console.log('🔍 Claiming promotion with:', { promotionID: promotionId, userID: userId })

  const requestData = {
    promotionID: promotionId,
    userID: userId
  }

  console.log('🔍 Request data:', requestData)

  return axiosInstance.post('/User/claim-promotion', requestData)
}

/**
 * Lấy chi tiết promotion của user
 */

/**
 * Claim promotion (legacy - keeping for compatibility)
 */
export const claimPromotionLegacy = async (data: ClaimPromotionRequest): Promise<ApiResponse<PromotionUserDTO>> => {
  return axiosInstance.post('/User/claim-promotion', data)
}

/**
 * Lấy promotions của user
 */
export const getUserPromotions = async (
  userId: string,
  pageSize: number = 0,
  pageNumber: number = 1
): Promise<ApiResponseWithPagination<UserPromotionDetailDTO[]>> => {
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    pageNumber: pageNumber.toString()
  })

  return axiosInstance.get(`/User/MyPromotion/${userId}?${params.toString()}`)
}

/**
 * Chi tiết promotion user
 */
export const getUserPromotionDetail = async (
  userId: string,
  promotionId: string
): Promise<ApiResponse<PromotionUserDTO>> => {
  return axiosInstance.get(`/User/${userId}/promotion-detail/${promotionId}`)
}

// ========================================
// PUBLIC PROMOTION APIs
// ========================================

/**
 * Chi tiết promotion
 */
export const getPromotionDetail = async (id: string): Promise<ApiResponse<PromotionDetailDTO>> => {
  return axiosInstance.get(`/Promotion/detail/${id}`)
}

/**
 * Lấy Global Promotions đang active
 */
export const getActiveGlobalPromotions = async (
  pageSize: number = 0,
  pageNumber: number = 1
): Promise<ApiResponseWithPagination<PromotionDTO[]>> => {
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    pageNumber: pageNumber.toString()
  })

  return axiosInstance.get(`/Promotion/display-active-global?${params.toString()}`)
}

/**
 * Lấy User Promotions đang active
 */
export const getActiveUserPromotions = async (
  pageSize: number = 10,
  pageNumber: number = 1
): Promise<ApiResponseWithPagination<PromotionDTO[]>> => {
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    pageNumber: pageNumber.toString()
  })

  return axiosInstance.get(`/Promotion/display-active-user?${params.toString()}`)
}

// ========================================
// CART PROMOTION APIs
// ========================================

/**
 * Lấy Global Promotions có thể apply vào Cart
 */
export const getCartGlobalPromotions = async (
  cartId: string,
  pageSize: number = 0,
  pageNumber: number = 1
): Promise<ApiResponse<DisplayPromotionToApply>> => {
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    pageNumber: pageNumber.toString()
  })

  return axiosInstance.get(`/Promotion/display-applied-global/${cartId}?${params.toString()}`)
}

/**
 * Lấy Store Promotions có thể apply vào Cart
 */
export const getCartStorePromotions = async (
  cartId: string,
  pageSize: number = 0,
  pageNumber: number = 1
): Promise<ApiResponse<DisplayPromotionToApply>> => {
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    pageNumber: pageNumber.toString()
  })

  return axiosInstance.get(`/Promotion/display-applied-store/${cartId}?${params.toString()}`)
}

/**
 * Lấy User Promotions có thể apply vào Cart
 */
export const getCartUserPromotions = async (
  cartId: string,
  pageSize: number = 0,
  pageNumber: number = 1
): Promise<ApiResponse<DisplayUserPromotionToApply>> => {
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    pageNumber: pageNumber.toString()
  })

  return axiosInstance.get(`/Promotion/display-applied-user/${cartId}?${params.toString()}`)
}

/**
 * Apply Promotion vào Cart
 */
export const applyPromotionToCart = async (
  data: ApplyPromotionToCartRequest
): Promise<ApiResponse<CartPromotionDto>> => {
  return axiosInstance.post('/CartPromotion/apply', data)
}

/**
 * Remove Promotion khỏi Cart
 */
export const removePromotionFromCart = async (cartId: string, promotionId: string): Promise<ApiResponse<boolean>> => {
  return axiosInstance.delete(`/Cart/${cartId}/promotion/${promotionId}`)
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Lấy tất cả promotions có thể apply vào cart (combine global, store, user)
 */
export const getAllAvailablePromotionsForCart = async (
  cartId: string,
  options?: {
    pageSize?: number
    pageNumber?: number
    globalPageSize?: number
    globalPageNumber?: number
    storePageSize?: number
    storePageNumber?: number
    userPageSize?: number
    userPageNumber?: number
  }
) => {
  try {
    // Default values
    const defaultPageSize = 0
    const defaultPageNumber = 1

    // Extract options with defaults
    const {
      pageSize = defaultPageSize,
      pageNumber = defaultPageNumber,
      globalPageSize = pageSize,
      globalPageNumber = pageNumber,
      storePageSize = pageSize,
      storePageNumber = pageNumber,
      userPageSize = pageSize,
      userPageNumber = pageNumber
    } = options || {}

    const [globalPromotions, storePromotions, userPromotions] = await Promise.all([
      getCartGlobalPromotions(cartId, globalPageSize, globalPageNumber),
      getCartStorePromotions(cartId, storePageSize, storePageNumber),
      getCartUserPromotions(cartId, userPageSize, userPageNumber)
    ])

    return {
      global: globalPromotions.data,
      store: storePromotions.data,
      user: userPromotions.data
    }
  } catch (error) {
    console.error('Error fetching available promotions:', error)
    throw error
  }
}

/**
 * Validate promotion có thể apply vào cart không
 */
export const validatePromotionForCart = async (cartId: string, promotionId: string): Promise<boolean> => {
  try {
    const response = await axiosInstance.get(`/Cart/${cartId}/validate-promotion/${promotionId}`)
    return response.data
  } catch (error) {
    console.error('Error validating promotion:', error)
    return false
  }
}

/**
 * Lấy promotion statistics (Admin)
 */
export const getPromotionStats = async (
  timeRangeDays: number = 30
): Promise<
  ApiResponse<{
    totalPromotions: number
    activePromotions: number
    expiredPromotions: number
    totalDiscountGiven: number
    totalOrdersWithPromotion: number
    totalUsage: number
    uniqueUsers: number
    todayUsage: number
    weekUsage: number
    monthUsage: number
    avgDailyUsage: number
    topPromotions: Array<{
      id: string
      title: string
      type: string
      usageCount: number
    }>
    promotionTypes: Array<{
      type: string
      count: number
    }>
    hourlyUsage: Array<{
      hour: number
      count: number
    }>
    maxHourlyUsage: number
    conversionRate: number
    ordersWithPromotion: number
    totalOrders: number
    recentActivity: Array<{
      description: string
      time: string
      value: string
    }>
  }>
> => {
  const params = new URLSearchParams({
    timeRangeDays: timeRangeDays.toString()
  })

  return axiosInstance.get(`/Admin/Promotion/stats?${params.toString()}`)
}

/**
 * Toggle promotion status (Admin/Seller)
 */
export const togglePromotionStatus = async (promotionId: string): Promise<ApiResponse<PromotionDTO>> => {
  return axiosInstance.put(`/Promotion/toggle-status/${promotionId}`)
}

/**
 * Duplicate promotion (Admin/Seller)
 */
export const duplicatePromotion = async (promotionId: string): Promise<ApiResponse<PromotionDTO>> => {
  return axiosInstance.post(`/Promotion/duplicate/${promotionId}`)
}

/**
 * Lấy promotion by ID (Admin)
 */
export const getPromotionById = async (id: string): Promise<ApiResponse<PromotionDetailDTO>> => {
  return axiosInstance.get(`/Admin/Promotion/${id}`)
}


// ========================================
// EXPORT ALL FUNCTIONS
// ========================================

export const promotionApi = {
  // Admin APIs
  createPromotionAdmin,
  updatePromotionAdmin,
  getPromotionDetailAdmin,
  getAllPromotionsAdmin,
  getPromotionById,
  deletePromotion,
  getPromotionStats,

  getSellerPromotions,
  createPromotionSeller,
  updatePromotionSeller,

  // User APIs
  getActivePromotionsForUser,
  claimPromotion,
  getUserPromotionDetail,
  claimPromotionLegacy,
  getUserPromotions,

  getPromotionDetail,
  getActiveGlobalPromotions,
  getActiveUserPromotions,

  getCartGlobalPromotions,
  getCartStorePromotions,
  getCartUserPromotions,
  applyPromotionToCart,
  removePromotionFromCart,
  getAllAvailablePromotionsForCart,
  validatePromotionForCart,

  togglePromotionStatus,
  duplicatePromotion
}

export default promotionApi
