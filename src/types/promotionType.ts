// ========================================
// ENUM TYPES
// ========================================

export type PromotionType = 'Global' | 'User' | 'Product'

export type DiscountType = 'percentage' | 'fixed_amount' | 'freeship'

export type CartPromotionStatus = 'Reserved' | 'Used' | 'Released'

// ========================================
// BASE PROMOTION TYPES
// ========================================

export interface PromotionDTO {
  id: string
  type: PromotionType
  title: string
  description: string
  discountType: DiscountType
  discountValue: number
  minValueDiscount?: number
  startDate: string
  endDate: string
  maxQuantity?: number
  usedQuantity: number
  maxPerUser: number
  isActive: boolean
  storeId?: string
  createdAt: string
  updatedAt: string

  // ✅ USAGE INFO FIELDS
  usedCount?: number         // Đã sử dụng bao nhiêu lần
  remainingCount?: number    // Còn lại bao nhiêu lần (-1 = unlimited)
  canApply?: boolean         // Có thể apply không
  reasonCannotApply?: string // Lý do không thể apply
}

export interface UserPromotionDetailDTO {
  promotionId: string
  userId: string
  quantity: number
  isActive: boolean
  promotion: PromotionDTO

  // ✅ USER-SPECIFIC USAGE INFO
  claimedQuantity?: number   // Đã claim
  usedCount?: number         // Đã sử dụng thực tế
  remainingCount?: number    // Còn lại
  canApply?: boolean
  reasonCannotApply?: string
}

export interface CartPromotionDto {
  cartPromotionId: string
  promotionId: string
  type: string
  title: string
  description: string
  discountType: string
  discountValue: number
  discountAmount: number
  minValueDiscount: number
  appliedAt: string
  expiredAt: string
  minutesLeft: number
  secondsLeft: number
  status: CartPromotionStatus
  isExpiringSoon: boolean
  isExpired: boolean
  discountDisplayText: string
  timeLeftDisplayText: string
}

// ========================================
// REQUEST TYPES
// ========================================

export interface ClaimPromotionRequest {
  promotionID: string
  userID: string
}

export interface ApplyPromotionToCartRequest {
  cartId: string
  promotionId: string
}

export interface PromotionAdminRequest {
  type: PromotionType
  title: string
  description: string
  discountType: DiscountType
  discountValue: number
  minValueDiscount?: number
  startDate: string
  endDate: string
  maxQuantity?: number
  maxPerUser: number
  isActive: boolean
  userIds: string[] // Chỉ dùng cho type User
}

export interface PromotionSellerRequest {
  sellerId: string
  title: string
  description: string
  discountType: DiscountType
  discountValue: number
  minValueDiscount?: number
  startDate: string
  endDate: string
  maxQuantity?: number
  maxPerUser: number
  isActive: boolean
  productIds?: string[] // For Product type promotions
}

// ========================================
// RESPONSE TYPES
// ========================================

export interface ApiResponse<T> {
  status: number
  message: string
  data: T
}

export interface PaginationInfo {
  pageNumber: number
  pageSize: number
  totalItems: number
  totalPages?: number
}

export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  pagination: PaginationInfo
}

export interface PaginationState {
  pageNumber: number
  pageSize: number
  totalItems: number
  totalPages: number
}

// ✅ API RESPONSE (updated)
export interface DisplayPromotionToApply {
  applied: PromotionDTO[]
  notYet: PromotionDTO[]  // Bao gồm cả available và unavailable
}

export interface DisplayUserPromotionToApply {
  applied: UserPromotionDetailDTO[]
  notYet: UserPromotionDetailDTO[]  // Bao gồm cả available và unavailable
}

// ========================================
// EXTENDED TYPES FOR SPECIFIC USE CASES
// ========================================

export interface PromotionDetailDTO extends PromotionDTO {
  // Additional fields for detailed view
  totalUsed: number
  remainingQuantity: number
  isEligible: boolean
  eligibilityReason?: string
}

export interface PromotionUser {
  id: string
  userID: string
  userName: string
  userEmail: string
  quantity: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PromotionAdminDTO extends PromotionDTO {
  // Admin specific fields
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  promotionUsers?: PromotionUser[]
}

export interface PromotionSellerDTO extends PromotionDTO {
  // Seller specific fields
  storeName: string
  productCount: number
}

export interface PromotionUserDTO extends UserPromotionDetailDTO {
  // User specific fields
  canUse: boolean
  reason?: string
}

// ========================================
// UTILITY TYPES
// ========================================

export interface PromotionFilter {
  type?: PromotionType
  discountType?: DiscountType
  isActive?: boolean
  startDate?: string
  endDate?: string
  storeId?: string
}

export interface PromotionSort {
  field: 'title' | 'discountValue' | 'startDate' | 'endDate' | 'createdAt'
  direction: 'asc' | 'desc'
}

export interface PromotionStats {
  totalPromotions: number
  activePromotions: number
  expiredPromotions: number
  totalDiscountGiven: number
  totalOrdersWithPromotion: number
}

// ========================================
// FORM TYPES
// ========================================

export interface PromotionFormData {
  type: PromotionType
  title: string
  description: string
  discountType: DiscountType
  discountValue: number
  minValueDiscount?: number
  startDate: string
  endDate: string
  maxQuantity?: number
  maxPerUser: number
  isActive: boolean
  userIds?: string[] // For User type promotions
}

export interface PromotionFormErrors {
  title?: string
  description?: string
  discountValue?: string
  minValueDiscount?: string
  startDate?: string
  startTime?: string
  endDate?: string
  maxQuantity?: string
  maxPerUser?: string
  userIds?: string
}

// ========================================
// COMPONENT PROPS TYPES
// ========================================

export interface PromotionModalProps {
  cartId: string
  isOpen: boolean
  onClose: () => void
  onApply: (promotionId: string) => void
}

export interface PromotionCardProps {
  promotion: PromotionDTO
  isApplied?: boolean
  isExpired?: boolean
  userQuantity?: number
  onApply?: () => void
  onRemove?: () => void
  showActions?: boolean
}

export interface AppliedPromotionsProps {
  cartPromotions: CartPromotionDto[]
  onRemove: (promotionId: string) => void
}

export interface PromotionListProps {
  promotions: PromotionDTO[]
  loading?: boolean
  onEdit?: (promotion: PromotionDTO) => void
  onDelete?: (promotionId: string) => void
  onToggleStatus?: (promotionId: string) => void
}

export interface PromotionFormProps {
  initialData?: PromotionFormData
  onSubmit: (data: PromotionFormData) => void
  onCancel: () => void
  loading?: boolean
  isEdit?: boolean
}

// ========================================
// HOOK RETURN TYPES
// ========================================

export interface UsePromotionsReturn {
  appliedPromotions: CartPromotionDto[]
  availablePromotions: {
    global: DisplayPromotionToApply
    store: DisplayPromotionToApply
    user: DisplayUserPromotionToApply
  }
  loading: boolean
  error: string | null
  applyPromotion: (promotionId: string) => Promise<boolean>
  removePromotion: (promotionId: string) => Promise<boolean>
  refreshPromotions: () => Promise<void>
  fetchAvailablePromotions: (options?: {
    pageSize?: number
    pageNumber?: number
    globalPageSize?: number
    globalPageNumber?: number
    storePageSize?: number
    storePageNumber?: number
    userPageSize?: number
    userPageNumber?: number
  }) => Promise<void>
}

export interface UsePromotionTimerReturn {
  minutes: number
  seconds: number
  isExpired: boolean
  isExpiringSoon: boolean
  timeLeftDisplayText: string
  originalTimeDisplay: string
}

export interface UsePromotionValidationReturn {
  isValid: boolean
  errors: string[]
  validatePromotion: (promotion: PromotionDTO, cartValue: number) => boolean
}

// ========================================
// CONSTANTS
// ========================================

export const PROMOTION_TYPES: PromotionType[] = ['Global', 'User', 'Product']

export const DISCOUNT_TYPES: DiscountType[] = ['percentage', 'fixed_amount', 'freeship']

export const CART_PROMOTION_STATUSES: CartPromotionStatus[] = ['Reserved', 'Used', 'Released']

export const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
  Global: 'Toàn hệ thống',
  User: 'Cá nhân',
  Product: 'Sản phẩm'
}

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: 'Phần trăm',
  fixed_amount: 'Số tiền cố định',
  freeship: 'Miễn phí vận chuyển'
}

export const CART_PROMOTION_STATUS_LABELS: Record<CartPromotionStatus, string> = {
  Reserved: 'Đã đặt',
  Used: 'Đã sử dụng',
  Released: 'Đã hủy'
}
