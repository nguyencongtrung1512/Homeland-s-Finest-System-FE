import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'react-toastify'
import {
  type CartPromotionDto,
  type DisplayPromotionToApply,
  type DisplayUserPromotionToApply,
  type PromotionDTO,
  type PromotionAdminDTO,
  type UserPromotionDetailDTO,
  type UsePromotionsReturn,
  type UsePromotionTimerReturn,
  type UsePromotionValidationReturn,
  type PromotionFilter,
  type PromotionSort,
  type PromotionAdminRequest,
  type PromotionSellerRequest,
  type PaginationState
} from '../types/promotionType'
import { promotionApi } from '../apis/promotion.api'

// ========================================
// Utility Functions
// ========================================

/**
 * Formats time to 12-hour format with AM/PM
 * @param date - Date object
 * @returns Formatted time string (e.g., "3:00 PM")
 */
const formatTime12Hour = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

// ========================================
// usePromotions Hook
// ========================================

export const usePromotions = (cartId: string): UsePromotionsReturn => {
  const [appliedPromotions, setAppliedPromotions] = useState<CartPromotionDto[]>([])
  const [availablePromotions, setAvailablePromotions] = useState<{
    global: DisplayPromotionToApply
    store: DisplayPromotionToApply
    user: DisplayUserPromotionToApply
  }>({
    global: { applied: [], notYet: [] },
    store: { applied: [], notYet: [] },
    user: { applied: [], notYet: [] }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAppliedPromotions = useCallback(async () => {
    if (!cartId) return

    try {
      // Fetch applied promotions from all three APIs
      const [globalResponse, storeResponse, userResponse] = await Promise.all([
        promotionApi.getGlobalPromotions(cartId, 0, 1),
        promotionApi.getStorePromotions(cartId, 0, 1),
        promotionApi.getCartUserPromotionsWithUsage(cartId, 0, 1)
      ])

      // Combine all applied promotions
      const appliedPromotions: CartPromotionDto[] = [
        ...(globalResponse.data?.applied || []),
        ...(storeResponse.data?.applied || []),
        ...(userResponse.data?.applied || [])
      ].map((promotion) => {
        // Handle different promotion types
        const promo = 'promotion' in promotion ? promotion.promotion : promotion

        return {
          cartPromotionId: promo.id,
          promotionId: promo.id,
          type: promo.type,
          title: promo.title,
          description: promo.description,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          discountAmount: promo.discountValue, // Assuming discountAmount = discountValue for now
          minValueDiscount: promo.minValueDiscount || 0,
          appliedAt: new Date().toISOString(),
          expiredAt: promo.endDate,
          minutesLeft: 0,
          secondsLeft: 0,
          status: 'Reserved' as const,
          isExpired: false,
          isExpiringSoon: false,
          discountDisplayText:
            promo.discountType === 'percentage'
              ? `Giảm ${promo.discountValue}%`
              : `Giảm ${promo.discountValue.toLocaleString('vi-VN')}₫`,
          timeLeftDisplayText: 'Còn hiệu lực'
        }
      })

      setAppliedPromotions(appliedPromotions)
    } catch (err: unknown) {
      console.error('Error fetching applied promotions:', err)
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải promotions đã áp dụng'
      setError(errorMessage)
    }
  }, [cartId])

  const fetchAvailablePromotions = useCallback(async () => {
    if (!cartId) return

    try {
      setLoading(true)

      // ✅ Fetch với usage info mặc định
      const [globalResponse, storeResponse, userResponse] = await Promise.all([
        promotionApi.getGlobalPromotions(cartId, 0, 1),  // API đã có usage info
        promotionApi.getStorePromotions(cartId, 0, 1),   // API đã có usage info  
        promotionApi.getCartUserPromotionsWithUsage(cartId, 0, 1)     // API đã có usage info
      ])

      setAvailablePromotions({
        global: globalResponse.data || { applied: [], notYet: [] },
        store: storeResponse.data || { applied: [], notYet: [] },
        user: userResponse.data || { applied: [], notYet: [] }
      })
    } catch (err: unknown) {
      console.error('Error fetching available promotions:', err)
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải promotions có sẵn'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [cartId])

  const applyPromotion = useCallback(
    async (promotionId: string): Promise<boolean> => {
      if (!cartId) return false

      setLoading(true)
      try {
        await promotionApi.applyPromotionToCart({ cartId, promotionId })
        await Promise.all([fetchAppliedPromotions(), fetchAvailablePromotions()])

        toast.success('Áp dụng Mã khuyến mãi  thành công!', {
          position: 'top-right',
          autoClose: 2000
        })

        return true
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Không thể áp dụng Mã khuyến mãi '
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [cartId, fetchAppliedPromotions, fetchAvailablePromotions]
  )

  const removePromotion = useCallback(
    async (promotionId: string): Promise<boolean> => {
      if (!cartId) return false

      setLoading(true)
      try {
        await promotionApi.removePromotionFromCart(cartId, promotionId)
        await Promise.all([fetchAppliedPromotions(), fetchAvailablePromotions()])

        toast.success('Hủy áp dụng Mã khuyến mãi  thành công!', {
          position: 'top-right',
          autoClose: 2000
        })

        return true
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Không thể hủy áp dụng Mã khuyến mãi '
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [cartId, fetchAppliedPromotions, fetchAvailablePromotions]
  )

  const refreshPromotions = useCallback(async () => {
    if (!cartId) return

    setLoading(true)
    try {
      await Promise.all([fetchAppliedPromotions(), fetchAvailablePromotions()])
    } catch (err) {
      console.error('Error refreshing promotions:', err)
    } finally {
      setLoading(false)
    }
  }, [cartId, fetchAppliedPromotions, fetchAvailablePromotions])

  useEffect(() => {
    if (cartId) {
      refreshPromotions()
    }
  }, [cartId, refreshPromotions])

  // Auto-refresh expired promotions
  useEffect(() => {
    const interval = setInterval(() => {
      setAppliedPromotions((prev) => prev.filter((promo) => !promo.isExpired))
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return {
    appliedPromotions,
    availablePromotions,
    loading,
    error,
    applyPromotion,
    removePromotion,
    refreshPromotions,
    fetchAvailablePromotions
  }
}

// ========================================
// usePromotionTimer Hook
// ========================================

export const usePromotionTimer = (expiredAt: string): UsePromotionTimerReturn => {
  const [timeLeft, setTimeLeft] = useState({
    minutes: 0,
    seconds: 0,
    isExpired: false,
    isExpiringSoon: false
  })

  const calculateTimeLeft = useCallback((expiredAt: string) => {
    const now = new Date().getTime()
    let expiry: Date

    // Parse backend date format "HH:mm:ss dd/MM/yyyy"
    if (expiredAt.includes(' ') && expiredAt.includes('/')) {
      const [timePart, datePart] = expiredAt.split(' ')
      const [hours, minutes, seconds] = timePart.split(':')
      const [day, month, year] = datePart.split('/')
      expiry = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      )
    } else {
      // Handle ISO string format - use as is since backend handles timezone
      expiry = new Date(expiredAt)
    }

    const difference = expiry.getTime() - now

    if (difference > 0) {
      return {
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
        isExpiringSoon: difference < 5 * 60 * 1000 // 5 minutes
      }
    }

    return {
      minutes: 0,
      seconds: 0,
      isExpired: true,
      isExpiringSoon: false
    }
  }, [])

  const timeLeftDisplayText = useMemo(() => {
    if (timeLeft.isExpired) {
      return 'Đã hết hạn'
    }

    if (timeLeft.minutes === 0 && timeLeft.seconds === 0) {
      return 'Sắp hết hạn'
    }

    return `${timeLeft.minutes.toString().padStart(2, '0')}:${timeLeft.seconds.toString().padStart(2, '0')}`
  }, [timeLeft])

  const originalTimeDisplay = useMemo(() => {
    let expiry: Date

    // Parse backend date format "HH:mm:ss dd/MM/yyyy"
    if (expiredAt.includes(' ') && expiredAt.includes('/')) {
      const [timePart, datePart] = expiredAt.split(' ')
      const [hours, minutes, seconds] = timePart.split(':')
      const [day, month, year] = datePart.split('/')
      expiry = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      )
    } else {
      // Handle ISO string format - use as is since backend handles timezone
      expiry = new Date(expiredAt)
    }

    return formatTime12Hour(expiry)
  }, [expiredAt])

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(expiredAt))

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(expiredAt))
    }, 1000)

    return () => clearInterval(timer)
  }, [expiredAt, calculateTimeLeft])

  return {
    minutes: timeLeft.minutes,
    seconds: timeLeft.seconds,
    isExpired: timeLeft.isExpired,
    isExpiringSoon: timeLeft.isExpiringSoon,
    timeLeftDisplayText,
    originalTimeDisplay
  }
}

// ========================================
// usePromotionValidation Hook
// ========================================

export const usePromotionValidation = (): UsePromotionValidationReturn => {
  const [isValid, setIsValid] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const validatePromotion = useCallback((promotion: PromotionDTO, cartValue: number): boolean => {
    const validationErrors: string[] = []

    // Check if promotion is active
    if (!promotion.isActive) {
      validationErrors.push('Mã khuyến mãi  không còn hoạt động')
    }

    // Check if promotion is within date range
    const now = new Date()
    const startDate = new Date(promotion.startDate)
    const endDate = new Date(promotion.endDate)

    if (now < startDate) {
      validationErrors.push('Mã khuyến mãi  chưa có hiệu lực')
    }

    if (now > endDate) {
      validationErrors.push('Mã khuyến mãi  đã hết hạn')
    }

    // Check minimum value requirement
    if (promotion.minValueDiscount && cartValue < promotion.minValueDiscount) {
      validationErrors.push(`Đơn hàng tối thiểu ${promotion.minValueDiscount.toLocaleString('vi-VN')}₫`)
    }

    // Check quantity limits
    if (promotion.maxQuantity && promotion.usedQuantity >= promotion.maxQuantity) {
      validationErrors.push('Mã khuyến mãi  đã hết lượt sử dụng')
    }

    // Check discount value validity
    if (promotion.discountValue <= 0) {
      validationErrors.push('Giá trị giảm giá không hợp lệ')
    }

    if (promotion.discountType === 'percentage' && promotion.discountValue > 100) {
      validationErrors.push('Phần trăm giảm giá không được vượt quá 100%')
    }

    setErrors(validationErrors)
    setIsValid(validationErrors.length === 0)

    return validationErrors.length === 0
  }, [])

  return {
    isValid,
    errors,
    validatePromotion
  }
}

// ========================================
// useUserPromotions Hook
// ========================================

export const useUserPromotions = (userId: string) => {
  const [userPromotions, setUserPromotions] = useState<UserPromotionDetailDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 0,
    totalItems: 0
  })

  const fetchUserPromotions = useCallback(
    async (pageNumber: number = 1) => {
      if (!userId) return

      setLoading(true)
      setError(null)

      try {
        const response = await promotionApi.getUserPromotions(userId, pagination.pageSize, pageNumber)
        setUserPromotions(response.data)
        setPagination({
          pageNumber: response.pagination.pageNumber,
          pageSize: response.pagination.pageSize,
          totalItems: response.pagination.totalItems
        })
      } catch (err: unknown) {
        console.error('Error fetching user promotions:', err)
        const errorMessage = err instanceof Error ? err.message : 'Không thể tải promotions của user'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [userId, pagination.pageSize]
  )

  const claimPromotion = useCallback(
    async (promotionId: string): Promise<boolean> => {
      setLoading(true)
      try {
        await promotionApi.claimPromotion({ promotionID: promotionId, userID: userId })
        await fetchUserPromotions()

        toast.success('Nhận Mã khuyến mãi  thành công!', {
          position: 'top-right',
          autoClose: 2000
        })

        return true
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Không thể nhận Mã khuyến mãi '
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [userId, fetchUserPromotions]
  )

  useEffect(() => {
    if (userId) {
      fetchUserPromotions()
    }
  }, [userId, fetchUserPromotions])

  return {
    userPromotions,
    loading,
    error,
    pagination,
    fetchUserPromotions,
    claimPromotion
  }
}

// ========================================
// useAdminPromotions Hook
// ========================================

export const useAdminPromotions = () => {
  const [adminPromotions, setAdminPromotions] = useState<PromotionDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    pageNumber: 1,
    pageSize: 0,
    totalItems: 0,
    totalPages: 1
  })
  const [filters, setFilters] = useState<PromotionFilter>({})
  const [sort, setSort] = useState<PromotionSort>({ field: 'createdAt', direction: 'desc' })

  const getPromotionDetail = useCallback(async (id: string): Promise<PromotionAdminDTO | null> => {
    setLoading(true)
    try {
      const response = await promotionApi.getPromotionDetailAdmin(id)

      return response.data
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể lấy chi tiết promotion'
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAdminPromotions = useCallback(
    async (pageNumber: number = 1, customFilters?: PromotionFilter, customSort?: PromotionSort) => {
      setLoading(true)
      setError(null)

      try {
        const currentFilters = customFilters || filters
        const currentSort = customSort || sort

        const response = await promotionApi.getAllPromotionsAdmin(
          pagination.pageSize,
          pageNumber,
          currentFilters,
          currentSort
        )

        setAdminPromotions(response.data)
        setPagination({
          pageNumber: response.pagination.pageNumber,
          pageSize: response.pagination.pageSize,
          totalItems: response.pagination.totalItems,
          totalPages: Math.ceil(response.pagination.totalItems / response.pagination.pageSize) || 1
        })
      } catch (err: unknown) {
        console.error('Error fetching admin promotions:', err)
        const errorMessage = err instanceof Error ? err.message : 'Không thể tải promotions admin'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [filters, sort, pagination.pageSize]
  )

  const createPromotion = useCallback(
    async (data: PromotionAdminRequest): Promise<boolean> => {
      setLoading(true)
      try {
        await promotionApi.createPromotionAdmin(data)
        await fetchAdminPromotions(pagination.pageNumber)

        return true
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Không thể tạo promotion'
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [fetchAdminPromotions]
  )

  const updatePromotion = useCallback(
    async (id: string, data: PromotionAdminRequest): Promise<boolean> => {
      setLoading(true)
      try {
        await promotionApi.updatePromotionAdmin(id, data)
        await fetchAdminPromotions(pagination.pageNumber)

        toast.success('Cập nhật promotion thành công!', {
          position: 'top-right',
          autoClose: 2000
        })

        return true
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Không thể cập nhật promotion'
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [fetchAdminPromotions]
  )

  const deletePromotion = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true)
      try {
        await promotionApi.deletePromotion(id)
        await fetchAdminPromotions(pagination.pageNumber)

        toast.success('Xóa promotion thành công!', {
          position: 'top-right',
          autoClose: 2000
        })

        return true
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Không thể xóa promotion'
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [fetchAdminPromotions]
  )

  const togglePromotionStatus = useCallback(
    async (promotionId: string): Promise<boolean> => {
      setLoading(true)
      try {
        await promotionApi.togglePromotionStatus(promotionId)
        await fetchAdminPromotions(pagination.pageNumber)

        toast.success('Thay đổi trạng thái promotion thành công!', {
          position: 'top-right',
          autoClose: 2000
        })

        return true
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Không thể thay đổi trạng thái promotion'
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [fetchAdminPromotions]
  )

  const getPromotionById = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const response = await promotionApi.getPromotionById(id)
      return response.data
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải chi tiết promotion'
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAdminPromotions(1)
  }, [fetchAdminPromotions])

  return {
    promotions: adminPromotions,
    loading,
    error,
    pagination,
    filters,
    sort,
    setFilters,
    setSort,
    fetchPromotions: fetchAdminPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotionStatus,
    getPromotionById,
    getPromotionDetail
  }
}

// ========================================
// useSellerPromotions Hook
// ========================================

// Generic seller promotions hook without sellerId parameter
export const useSellerPromotions = () => {
  const [promotions, setPromotions] = useState<PromotionDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const fetchPromotions = useCallback(
    async (
      sellerId: string,
      pageNumber: number = 1,
      pageSize: number = 10,
      filter?: PromotionFilter,
      sort?: PromotionSort
    ) => {
      console.log('🔍 Hook: fetchPromotions called with:', { sellerId, pageNumber, pageSize, filter, sort })

      setLoading(true)
      setError(null)
      try {
        console.log('🔍 Hook: Calling promotionApi.getSellerPromotions...')
        const response = await promotionApi.getSellerPromotions(sellerId, pageSize, pageNumber, filter, sort)

        // Backend trả về data là array trực tiếp, không có items/pagination wrapper
        let items: PromotionDTO[] = []
        let totalPages = 1
        let totalItems = 0

        if (Array.isArray(response.data)) {
          // Response data là array trực tiếp
          items = response.data
          totalItems = response.data.length
          totalPages = Math.ceil(totalItems / pageSize) || 1
          console.log('🔍 Hook: Processing direct array response')
        } else if (response.data?.items && Array.isArray(response.data.items)) {
          // Response data có wrapper với items/pagination
          items = response.data.items
          totalPages = response.data.pagination?.totalPages || 1
          totalItems = response.data.pagination?.totalItems || response.data.items.length
          console.log('🔍 Hook: Processing wrapped response')
        } else {
          console.warn('🔍 Hook: Unexpected response structure:', response.data)
          items = []
        }

        console.log('🔍 Hook: Final processed data:', { items: items.length, totalPages, totalItems })

        setPromotions(items)
        setTotalPages(totalPages)
        setTotalItems(totalItems)

        console.log('✅ Hook: State updated successfully')
      } catch (err: unknown) {
        console.error('❌ Hook: Error fetching seller promotions:', err)
        const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách promotion'
        toast.error(errorMessage, { position: 'top-right', autoClose: 3000 })
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const createPromotion = useCallback(async (data: PromotionSellerRequest): Promise<void> => {
    setLoading(true)
    try {
      await promotionApi.createPromotionSeller(data)
    } catch (err: unknown) {
      console.error('Error creating seller promotion:', err)
      const errorMessage = err instanceof Error ? err.message : 'Không thể tạo promotion'
      toast.error(errorMessage, { position: 'top-right', autoClose: 3000 })
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePromotion = useCallback(async (id: string, data: PromotionSellerRequest): Promise<void> => {
    setLoading(true)
    try {
      await promotionApi.updatePromotionSeller(id, data)
      toast.success('Cập nhật promotion thành công', { position: 'top-right', autoClose: 3000 })
    } catch (err: unknown) {
      console.error('Error updating seller promotion:', err)
      const errorMessage = err instanceof Error ? err.message : 'Không thể cập nhật promotion'
      toast.error(errorMessage, { position: 'top-right', autoClose: 3000 })
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deletePromotion = useCallback(async (id: string): Promise<void> => {
    setLoading(true)
    try {
      await promotionApi.deletePromotion(id)
      toast.success('Xóa promotion thành công', { position: 'top-right', autoClose: 3000 })
    } catch (err: unknown) {
      console.error('Error deleting promotion:', err)
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa promotion'
      toast.error(errorMessage, { position: 'top-right', autoClose: 3000 })
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const togglePromotionStatus = useCallback(async (promotionId: string): Promise<void> => {
    setLoading(true)
    try {
      await promotionApi.togglePromotionStatus(promotionId)
      toast.success('Cập nhật trạng thái promotion thành công', { position: 'top-right', autoClose: 3000 })
    } catch (err: unknown) {
      console.error('Error toggling promotion status:', err)
      const errorMessage = err instanceof Error ? err.message : 'Không thể cập nhật trạng thái'
      toast.error(errorMessage, { position: 'top-right', autoClose: 3000 })
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getPromotionDetail = useCallback(async (id: string): Promise<any> => {
    setLoading(true)
    try {
      const response = await promotionApi.getPromotionDetail(id)
      return response.data
    } catch (err: unknown) {
      console.error('Error getting seller promotion detail:', err)
      const errorMessage = err instanceof Error ? err.message : 'Không thể lấy chi tiết promotion'
      toast.error(errorMessage, { position: 'top-right', autoClose: 3000 })
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    promotions,
    loading,
    error,
    totalPages,
    totalItems,
    fetchPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotionStatus,
    getPromotionDetail
  }
}

// Original seller promotions hook with sellerId parameter
export const useSellerPromotionsWithId = (sellerId: string) => {
  const [sellerPromotions, setSellerPromotions] = useState<PromotionDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 0,
    totalItems: 0
  })
  const [filters, setFilters] = useState<PromotionFilter>({})
  const [sort, setSort] = useState<PromotionSort>({ field: 'createdAt', direction: 'desc' })

  const fetchSellerPromotions = useCallback(
    async (pageNumber: number = 1, customFilters?: PromotionFilter, customSort?: PromotionSort) => {
      if (!sellerId) return

      setLoading(true)
      setError(null)

      try {
        const currentFilters = customFilters || filters
        const currentSort = customSort || sort

        const response = await promotionApi.getSellerPromotions(
          sellerId,
          pagination.pageSize,
          pageNumber,
          currentFilters,
          currentSort
        )

        setSellerPromotions(response.data)
        setPagination({
          pageNumber: response.pagination.pageNumber,
          pageSize: response.pagination.pageSize,
          totalItems: response.pagination.totalItems
        })
      } catch (err: unknown) {
        console.error('Error fetching seller promotions:', err)
        const errorMessage = err instanceof Error ? err.message : 'Không thể tải promotions của seller'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [sellerId, filters, sort, pagination.pageSize]
  )

  const createPromotion = useCallback(
    async (data: PromotionSellerRequest): Promise<boolean> => {
      setLoading(true)
      try {
        await promotionApi.createPromotionSeller(data)
        await fetchSellerPromotions()
        return true
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Không thể tạo promotion'
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [fetchSellerPromotions]
  )

  const updatePromotion = useCallback(
    async (id: string, data: PromotionSellerRequest): Promise<boolean> => {
      setLoading(true)
      try {
        await promotionApi.updatePromotionSeller(id, data)
        await fetchSellerPromotions()

        return true
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Không thể cập nhật promotion'
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [fetchSellerPromotions]
  )

  useEffect(() => {
    if (sellerId) {
      fetchSellerPromotions()
    }
  }, [sellerId, fetchSellerPromotions])

  return {
    sellerPromotions,
    loading,
    error,
    pagination,
    filters,
    sort,
    setFilters,
    setSort,
    fetchSellerPromotions,
    createPromotion,
    updatePromotion
  }
}

// ========================================
// usePromotionStats Hook
// ========================================

export const usePromotionStats = () => {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getPromotionStats = useCallback(async (timeRangeDays: number = 30) => {
    setLoading(true)
    setError(null)

    try {
      const response = await promotionApi.getPromotionStats(timeRangeDays)
      setStats(response.data)
      return response.data
    } catch (err: unknown) {
      console.error('Error fetching promotion stats:', err)
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải thống kê promotions'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    stats,
    loading,
    error,
    getPromotionStats
  }
}