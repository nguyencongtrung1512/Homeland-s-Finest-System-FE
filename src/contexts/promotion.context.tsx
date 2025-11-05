import { type ReactNode, createContext, useContext, useState, useCallback, useEffect } from 'react'
import { toast } from '../utils/toast'
import {
  type PromotionDTO,
  type UserPromotionDetailDTO,
  type CartPromotionDto,
  type DisplayPromotionToApply,
  type DisplayUserPromotionToApply,
  type PromotionFilter,
  type PromotionSort,
  type PromotionStats
} from '../types/promotionType'
import { promotionApi } from '../apis/promotion.api'

// ========================================
// PROMOTION CONTEXT TYPES
// ========================================

interface PromotionContextType {
  // Applied Promotions in Cart
  appliedPromotions: CartPromotionDto[]
  setAppliedPromotions: (promotions: CartPromotionDto[]) => void

  // Available Promotions for Cart
  availablePromotions: {
    global: DisplayPromotionToApply | null
    store: DisplayPromotionToApply | null
    user: DisplayUserPromotionToApply | null
  }
  setAvailablePromotions: (promotions: {
    global: DisplayPromotionToApply | null
    store: DisplayPromotionToApply | null
    user: DisplayUserPromotionToApply | null
  }) => void

  // User Promotions
  userPromotions: UserPromotionDetailDTO[]
  setUserPromotions: (promotions: UserPromotionDetailDTO[]) => void

  // Admin/Seller Promotions
  adminPromotions: PromotionDTO[]
  setAdminPromotions: (promotions: PromotionDTO[]) => void

  sellerPromotions: PromotionDTO[]
  setSellerPromotions: (promotions: PromotionDTO[]) => void

  // Loading States
  loading: {
    applied: boolean
    available: boolean
    user: boolean
    admin: boolean
    seller: boolean
    applying: boolean
    removing: boolean
  }
  setLoading: (loading: Partial<PromotionContextType['loading']>) => void

  // Error States
  error: string | null
  setError: (error: string | null) => void

  // Pagination
  pagination: {
    pageNumber: number
    pageSize: number
    totalItems: number
  }
  setPagination: (pagination: Partial<PromotionContextType['pagination']>) => void

  // Filters & Sort
  filters: PromotionFilter
  setFilters: (filters: Partial<PromotionFilter>) => void
  sort: PromotionSort
  setSort: (sort: PromotionSort) => void

  // Stats
  stats: PromotionStats | null
  setStats: (stats: PromotionStats | null) => void

  // Actions
  fetchAppliedPromotions: (cartId: string) => Promise<void>
  fetchAvailablePromotions: (cartId: string) => Promise<void>
  fetchUserPromotions: (userId: string, pageNumber?: number) => Promise<void>
  fetchAdminPromotions: (pageNumber?: number, filters?: PromotionFilter, sort?: PromotionSort) => Promise<void>
  fetchSellerPromotions: (
    sellerId: string,
    pageNumber?: number,
    filters?: PromotionFilter,
    sort?: PromotionSort
  ) => Promise<void>
  applyPromotion: (cartId: string, promotionId: string) => Promise<boolean>
  removePromotion: (cartId: string, promotionId: string) => Promise<boolean>
  claimPromotion: (promotionId: string, userId: string) => Promise<boolean>
  refreshPromotions: (cartId: string) => Promise<void>
  clearPromotions: () => void
  fetchPromotionStats: () => Promise<void>
}

// ========================================
// CONTEXT CREATION
// ========================================

const PromotionContext = createContext<PromotionContextType>({
  // State
  appliedPromotions: [],
  setAppliedPromotions: () => { },
  availablePromotions: {
    global: null,
    store: null,
    user: null
  },
  setAvailablePromotions: () => { },
  userPromotions: [],
  setUserPromotions: () => { },
  adminPromotions: [],
  setAdminPromotions: () => { },
  sellerPromotions: [],
  setSellerPromotions: () => { },

  // Loading
  loading: {
    applied: false,
    available: false,
    user: false,
    admin: false,
    seller: false,
    applying: false,
    removing: false
  },
  setLoading: () => { },

  // Error
  error: null,
  setError: () => { },

  // Pagination
  pagination: {
    pageNumber: 1,
    pageSize: 10,
    totalItems: 0
  },
  setPagination: () => { },

  // Filters & Sort
  filters: {},
  setFilters: () => { },
  sort: { field: 'createdAt', direction: 'desc' },
  setSort: () => { },

  // Stats
  stats: null,
  setStats: () => { },

  // Actions
  fetchAppliedPromotions: async () => { },
  fetchAvailablePromotions: async () => { },
  fetchUserPromotions: async () => { },
  fetchAdminPromotions: async () => { },
  fetchSellerPromotions: async () => { },
  applyPromotion: async () => false,
  removePromotion: async () => false,
  claimPromotion: async () => false,
  refreshPromotions: async () => { },
  clearPromotions: () => { },
  fetchPromotionStats: async () => { }
})

// ========================================
// PROVIDER COMPONENT
// ========================================

export const PromotionProvider = ({ children }: { children: ReactNode }) => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  const [appliedPromotions, setAppliedPromotions] = useState<CartPromotionDto[]>([])
  const [availablePromotions, setAvailablePromotions] = useState<{
    global: DisplayPromotionToApply | null
    store: DisplayPromotionToApply | null
    user: DisplayUserPromotionToApply | null
  }>({
    global: null,
    store: null,
    user: null
  })
  const [userPromotions, setUserPromotions] = useState<UserPromotionDetailDTO[]>([])
  const [adminPromotions, setAdminPromotions] = useState<PromotionDTO[]>([])
  const [sellerPromotions, setSellerPromotions] = useState<PromotionDTO[]>([])

  const [loading, setLoadingState] = useState({
    applied: false,
    available: false,
    user: false,
    admin: false,
    seller: false,
    applying: false,
    removing: false
  })

  const [error, setError] = useState<string | null>(null)

  const [pagination, setPaginationState] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalItems: 0
  })

  const [filters, setFiltersState] = useState<PromotionFilter>({})
  const [sort, setSortState] = useState<PromotionSort>({ field: 'createdAt', direction: 'desc' })

  const [stats, setStats] = useState<PromotionStats | null>(null)

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  const setLoading = useCallback((newLoading: Partial<PromotionContextType['loading']>) => {
    setLoadingState((prev) => ({ ...prev, ...newLoading }))
  }, [])

  const setPagination = useCallback((newPagination: Partial<PromotionContextType['pagination']>) => {
    setPaginationState((prev) => ({ ...prev, ...newPagination }))
  }, [])

  const setFilters = useCallback((newFilters: Partial<PromotionFilter>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const setSort = useCallback((newSort: PromotionSort) => {
    setSortState(newSort)
  }, [])

  // ========================================
  // API ACTIONS
  // ========================================

  const fetchAppliedPromotions = useCallback(async (cartId: string) => {
    if (!cartId) return

    setLoading({ applied: true })
    setError(null)

    try {
      const response = await promotionApi.getCartAppliedPromotions(cartId)
      setAppliedPromotions(response.data)
    } catch (err: any) {
      const errorMessage = err?.message || 'Không thể tải promotions đã áp dụng'
      setError(errorMessage)
      console.error('Error fetching applied promotions:', err)
    } finally {
      setLoading({ applied: false })
    }
  }, [])

  const fetchAvailablePromotions = useCallback(async (cartId: string) => {
    if (!cartId) return

    setLoading({ available: true })
    setError(null)

    try {
      const promotions = await promotionApi.getAllAvailablePromotionsForCart(cartId)
      setAvailablePromotions(promotions)
    } catch (err: any) {
      const errorMessage = err?.message || 'Không thể tải promotions có sẵn'
      setError(errorMessage)
      console.error('Error fetching available promotions:', err)
    } finally {
      setLoading({ available: false })
    }
  }, [])

  const fetchUserPromotions = useCallback(
    async (userId: string, pageNumber: number = 1) => {
      if (!userId) return

      setLoading({ user: true })
      setError(null)

      try {
        const response = await promotionApi.getUserPromotions(userId, pagination.pageSize, pageNumber)
        setUserPromotions(response.data)
        setPagination({
          pageNumber: response.pagination.pageNumber,
          pageSize: response.pagination.pageSize,
          totalItems: response.pagination.totalItems
        })
      } catch (err: any) {
        const errorMessage = err?.message || 'Không thể tải promotions của user'
        setError(errorMessage)
        console.error('Error fetching user promotions:', err)
      } finally {
        setLoading({ user: false })
      }
    },
    [pagination.pageSize]
  )

  const fetchAdminPromotions = useCallback(
    async (pageNumber: number = 1, customFilters?: PromotionFilter, customSort?: PromotionSort) => {
      setLoading({ admin: true })
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
          totalItems: response.pagination.totalItems
        })
      } catch (err: any) {
        const errorMessage = err?.message || 'Không thể tải promotions admin'
        setError(errorMessage)
        console.error('Error fetching admin promotions:', err)
      } finally {
        setLoading({ admin: false })
      }
    },
    [filters, sort, pagination.pageSize]
  )

  const fetchSellerPromotions = useCallback(
    async (sellerId: string, pageNumber: number = 1, customFilters?: PromotionFilter, customSort?: PromotionSort) => {
      if (!sellerId) return

      setLoading({ seller: true })
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
      } catch (err: any) {
        const errorMessage = err?.message || 'Không thể tải promotions của seller'
        setError(errorMessage)
        console.error('Error fetching seller promotions:', err)
      } finally {
        setLoading({ seller: false })
      }
    },
    [filters, sort, pagination.pageSize]
  )

  const applyPromotion = useCallback(
    async (cartId: string, promotionId: string): Promise<boolean> => {
      setLoading({ applying: true })
      setError(null)

      try {
        const response = await promotionApi.applyPromotionToCart({ cartId, promotionId })

        // Refresh applied promotions
        await fetchAppliedPromotions(cartId)

        toast.success('Áp dụng Mã khuyến mãi  thành công!', {
          position: 'top-right',
          autoClose: 2000
        })

        return true
      } catch (err: any) {
        const errorMessage = err?.message || 'Không thể áp dụng Mã khuyến mãi '
        setError(errorMessage)
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000
        })
        return false
      } finally {
        setLoading({ applying: false })
      }
    },
    [fetchAppliedPromotions]
  )

  const removePromotion = useCallback(
    async (cartId: string, promotionId: string): Promise<boolean> => {
      setLoading({ removing: true })
      setError(null)

      try {
        await promotionApi.removePromotionFromCart(cartId, promotionId)

        // Refresh applied promotions
        await fetchAppliedPromotions(cartId)

        toast.success('Hủy áp dụng Mã khuyến mãi  thành công!', {
          position: 'top-right',
          autoClose: 2000
        })

        return true
      } catch (err: any) {
        const errorMessage = err?.message || 'Không thể hủy áp dụng Mã khuyến mãi '
        setError(errorMessage)
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000
        })
        return false
      } finally {
        setLoading({ removing: false })
      }
    },
    [fetchAppliedPromotions]
  )

  const claimPromotion = useCallback(
    async (promotionId: string, userId: string): Promise<boolean> => {
      setLoading({ user: true })
      setError(null)

      try {
        await promotionApi.claimPromotion({ promotionID: promotionId, userID: userId })

        // Refresh user promotions
        await fetchUserPromotions(userId)

        toast.success('Nhận Mã khuyến mãi  thành công!', {
          position: 'top-right',
          autoClose: 2000
        })

        return true
      } catch (err: any) {
        const errorMessage = err?.message || 'Không thể nhận Mã khuyến mãi '
        setError(errorMessage)
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000
        })
        return false
      } finally {
        setLoading({ user: false })
      }
    },
    [fetchUserPromotions]
  )

  const refreshPromotions = useCallback(
    async (cartId: string) => {
      try {
        await Promise.all([fetchAppliedPromotions(cartId), fetchAvailablePromotions(cartId)])
      } catch (err) {
        console.error('Error refreshing promotions:', err)
      }
    },
    [fetchAppliedPromotions, fetchAvailablePromotions]
  )

  const clearPromotions = useCallback(() => {
    setAppliedPromotions([])
    setAvailablePromotions({
      global: null,
      store: null,
      user: null
    })
    setUserPromotions([])
    setAdminPromotions([])
    setSellerPromotions([])
    setError(null)
    setStats(null)
  }, [])

  const fetchPromotionStats = useCallback(async () => {
    try {
      const response = await promotionApi.getPromotionStats()
      setStats(response.data)
    } catch (err: any) {
      console.error('Error fetching promotion stats:', err)
    }
  }, [])

  // ========================================
  // AUTO REFRESH EXPIRED PROMOTIONS
  // ========================================

  useEffect(() => {
    const interval = setInterval(() => {
      // Check for expired promotions and remove them
      setAppliedPromotions((prev) => prev.filter((promo) => !promo.isExpired))
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // ========================================
  // CONTEXT VALUE
  // ========================================

  const contextValue: PromotionContextType = {
    // State
    appliedPromotions,
    setAppliedPromotions,
    availablePromotions,
    setAvailablePromotions,
    userPromotions,
    setUserPromotions,
    adminPromotions,
    setAdminPromotions,
    sellerPromotions,
    setSellerPromotions,

    // Loading
    loading,
    setLoading,

    // Error
    error,
    setError,

    // Pagination
    pagination,
    setPagination,

    // Filters & Sort
    filters,
    setFilters,
    sort,
    setSort,

    // Stats
    stats,
    setStats,

    // Actions
    fetchAppliedPromotions,
    fetchAvailablePromotions,
    fetchUserPromotions,
    fetchAdminPromotions,
    fetchSellerPromotions,
    applyPromotion,
    removePromotion,
    claimPromotion,
    refreshPromotions,
    clearPromotions,
    fetchPromotionStats
  }

  return <PromotionContext.Provider value={contextValue}>{children}</PromotionContext.Provider>
}

// ========================================
// CUSTOM HOOK
// ========================================

export const usePromotion = () => {
  const context = useContext(PromotionContext)
  if (!context) {
    throw new Error('usePromotion must be used within a PromotionProvider')
  }
  return context
}

export default PromotionContext
