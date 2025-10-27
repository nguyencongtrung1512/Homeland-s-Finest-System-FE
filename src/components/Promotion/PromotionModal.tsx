import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Loader2, Clock, CheckCircle, XCircle, Gift, Store, User,
  AlertCircle, TrendingDown, BarChart3
} from 'lucide-react'
import {
  type PromotionModalProps,
  type PromotionDTO,
  type UserPromotionDetailDTO,
  PROMOTION_TYPE_LABELS
} from '../../types/promotionType'
import { promotionApi } from '../../apis/promotion.api'
import { removePromotionFromCart } from '../../apis/cart.api'
import { useAuth } from '../../contexts/auth.context'
import { usePromotions } from '../../hooks/usePromotions'
import { toast } from 'react-toastify'

// ========================================
// Types
// ========================================

interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
  message?: string
}

// ========================================
// Utility Functions
// ========================================

// ✅ HELPER FUNCTION TO CATEGORIZE PROMOTIONS
const categorizePromotions = <T extends { canApply?: boolean }>(promotions: T[]) => {
  const available = promotions.filter(p => p.canApply !== false);
  const unavailable = promotions.filter(p => p.canApply === false);
  return { available, unavailable };
};

const formatDate = (dateString: string): string => {
  try {
    // Handle backend format: "HH:mm:ss dd/MM/yyyy"
    if (dateString.includes(' ')) {
      const [, date] = dateString.split(' ')
      const [day, month, year] = date.split('/')
      const dateObj = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)

      if (isNaN(dateObj.getTime())) {
        return 'Ngày không hợp lệ'
      }

      return dateObj.toLocaleDateString('vi-VN')
    }

    // Handle ISO format
    const dateObj = new Date(dateString)
    if (isNaN(dateObj.getTime())) {
      return 'Ngày không hợp lệ'
    }

    return dateObj.toLocaleDateString('vi-VN')
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Ngày không hợp lệ'
  }
}

// ========================================
// PromotionCard Component
// ========================================

interface PromotionCardProps {
  promotion: PromotionDTO | UserPromotionDetailDTO
  isApplied?: boolean
  isExpired?: boolean
  userQuantity?: number
  onApply?: (promotionId: string, promotionType: 'global' | 'store' | 'user') => void
  onRemove?: () => void
  showActions?: boolean
  loading?: boolean
  promotionType?: 'global' | 'store' | 'user'
}

const PromotionCard: React.FC<PromotionCardProps> = ({
  promotion,
  isApplied = false,
  onApply,
  onRemove,
  showActions = true,
  loading = false,
  promotionType = 'global'
}) => {
  const promo = 'promotion' in promotion ? promotion.promotion : promotion

  // ✅ DETERMINE CARD STATUS
  const isUnavailable = promo.canApply === false;
  const cardVariant = isApplied ? 'applied' : isUnavailable ? 'unavailable' : 'available';

  // Check if promotion is upcoming (start date in future)
  const isUpcoming = () => {
    try {
      let startDateObj: Date

      // Handle backend format: "HH:mm:ss dd/MM/yyyy"
      if (promo.startDate.includes(' ')) {
        const [timePart, datePart] = promo.startDate.split(' ')
        const [hours, minutes, seconds] = timePart.split(':')
        const [day, month, year] = datePart.split('/')
        startDateObj = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
          parseInt(seconds)
        )
      } else {
        startDateObj = new Date(promo.startDate)
      }

      return startDateObj > new Date()
    } catch (error) {
      console.error('Error checking upcoming date:', error)
      return false
    }
  }


  const getDiscountText = () => {
    switch (promo.discountType) {
      case 'percentage':
        return `Giảm ${promo.discountValue}%`
      case 'fixed_amount':
        return `Giảm ${promo.discountValue.toLocaleString('vi-VN')}₫`
      case 'freeship':
        return 'Miễn phí vận chuyển'
      default:
        return 'Giảm giá'
    }
  }

  const getTypeColor = () => {
    switch (promo.type) {
      case 'Global':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'User':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Product':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = () => {
    switch (promo.type) {
      case 'Global':
        return <Gift className='h-4 w-4' />
      case 'User':
        return <User className='h-4 w-4' />
      case 'Product':
        return <Store className='h-4 w-4' />
      default:
        return <Gift className='h-4 w-4' />
    }
  }

  // ✅ GET CARD STYLING BASED ON STATUS
  const getCardClassName = () => {
    const base = 'transition-all duration-200 hover:shadow-md';
    switch (cardVariant) {
      case 'applied':
        return `${base} border-green-500 bg-green-50`;
      case 'unavailable':
        return `${base} border-red-300 bg-red-50 opacity-75`;
      case 'available':
        return `${base} border-gray-200 hover:border-gray-300`;
      default:
        return base;
    }
  };

  // ✅ FORMAT USAGE INFO DISPLAY
  const formatUsageInfo = () => {
    if (promo.usedCount === undefined) return null;

    if ('claimedQuantity' in promotion && promotion.claimedQuantity !== undefined) {
      // User promotion
      return (
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
          <BarChart3 className="h-3 w-3" />
          <span>
            Đã claim: <strong>{promotion.claimedQuantity}</strong> |
            Đã dùng: <strong>{promotion.usedCount}</strong> |
            Còn lại: <strong>{promotion.remainingCount || 0}</strong>
          </span>
        </div>
      );
    } else {
      // Global/Product promotion
      const maxPerUser = promo.maxPerUser || 0;
      const remainingText = promo.remainingCount === -1
        ? 'Không giới hạn'
        : `${promo.remainingCount || 0}`;

      return (
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
          <TrendingDown className="h-3 w-3" />
          <span>
            Đã dùng: <strong>{promo.usedCount}</strong>/{maxPerUser > 0 ? maxPerUser : '∞'} |
            Còn lại: <strong>{remainingText}</strong>
          </span>
        </div>
      );
    }
  };

  // ✅ RENDER ACTION BUTTON
  const renderActionButton = () => {
    if (!showActions) return null;

    if (isApplied) {
      return (
        <Button
          onClick={onRemove}
          disabled={loading}
          variant="destructive"
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          🗑️ Bỏ áp dụng
        </Button>
      );
    }

    if (isUnavailable) {
      return (
        <Button
          disabled
          variant="secondary"
          className="w-full bg-gray-200 text-gray-500 cursor-not-allowed"
        >
          <AlertCircle className="mr-2 h-4 w-4" />
          {promo.reasonCannotApply || 'Không thể sử dụng'}
        </Button>
      );
    }

    // Available promotion
    return (
      <Button
        onClick={() => onApply?.(promo.id, promotionType)}
        disabled={loading || isUpcoming()}
        className="w-full bg-blue-500 hover:bg-blue-600"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isUpcoming() ? (
          <>
            <Clock className="mr-2 h-4 w-4" />
            Sắp có thể dùng
          </>
        ) : (
          <>
            ✅ Áp dụng
          </>
        )}
      </Button>
    );
  };

  return (
    <Card className={getCardClassName()}>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-2 flex-wrap'>
            <Badge variant='outline' className={`${getTypeColor()} flex items-center gap-1`}>
              {getTypeIcon()}
              {PROMOTION_TYPE_LABELS[promo.type]}
            </Badge>
            <Badge variant='destructive' className='bg-red-500 hover:bg-red-600'>
              {getDiscountText()}
            </Badge>
            {/* ✅ STATUS INDICATOR */}
            {isApplied && <CheckCircle className='h-5 w-5 text-green-500' />}
            {isUnavailable && <XCircle className='h-5 w-5 text-red-500' />}
            {isUpcoming() && <Clock className='h-5 w-5 text-yellow-500' />}
          </div>
        </div>
        <CardTitle className='text-lg font-semibold text-gray-900'>{promo.title}</CardTitle>
      </CardHeader>

      <CardContent className='pt-0'>
        <p className='text-sm text-gray-600 mb-4 line-clamp-2'>{promo.description}</p>

        {/* ✅ USAGE INFO SECTION */}
        {formatUsageInfo() && (
          <div className="mb-3">
            {formatUsageInfo()}
          </div>
        )}

        {/* ✅ PROMOTION DETAILS */}
        <div className='space-y-2 mb-4'>
          {promo.minValueDiscount && (
            <div className='flex items-center gap-2 text-xs text-gray-600'>
              <span className="font-medium">Đơn tối thiểu:</span>
              <span>{promo.minValueDiscount.toLocaleString('vi-VN')}₫</span>
            </div>
          )}

          <div className='flex items-center gap-2 text-xs text-gray-600'>
            <Clock className='h-3 w-3' />
            <span>
              {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
            </span>
          </div>

          {/* ✅ UNAVAILABLE REASON */}
          {isUnavailable && promo.reasonCannotApply && (
            <div className='flex items-center gap-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded'>
              <AlertCircle className='h-3 w-3' />
              <span>{promo.reasonCannotApply}</span>
            </div>
          )}
        </div>

        {/* ✅ ACTION BUTTON */}
        {renderActionButton()}
      </CardContent>
    </Card>
  )
}

// ========================================
// PromotionList Component
// ========================================

interface PromotionListProps {
  applied: PromotionDTO[]
  notYet: PromotionDTO[]
  onApply: (promotionId: string, promotionType: 'global' | 'store' | 'user') => void
  onRemove: (promotionId: string) => void
  loading?: boolean
  promotionType: 'global' | 'store' | 'user'
}

const PromotionList: React.FC<PromotionListProps> = ({
  applied,
  notYet,
  onApply,
  onRemove,
  loading = false,
  promotionType
}) => {
  // ✅ CATEGORIZE PROMOTIONS BASED ON canApply
  const { available, unavailable } = categorizePromotions(notYet);

  return (
    <div className="space-y-6">
      {/* ✅ APPLIED PROMOTIONS */}
      {applied.length > 0 && (
        <div>
          <h4 className='text-sm font-medium text-green-700 mb-3 flex items-center gap-2'>
            <CheckCircle className='h-4 w-4' />
            Đã áp dụng ({applied.length})
          </h4>
          <div className='space-y-3'>
            {applied.map((promotion) => (
              <PromotionCard
                key={promotion.id}
                promotion={promotion}
                isApplied={true}
                onRemove={() => onRemove(promotion.id)}
                loading={loading}
                promotionType={promotionType}
              />
            ))}
          </div>
        </div>
      )}

      {/* ✅ AVAILABLE PROMOTIONS */}
      {available.length > 0 && (
        <div>
          <h4 className='text-sm font-medium text-blue-700 mb-3 flex items-center gap-2'>
            <Gift className='h-4 w-4' />
            Có thể áp dụng ({available.length})
          </h4>
          <div className='space-y-3'>
            {available.map((promotion) => (
              <PromotionCard
                key={promotion.id}
                promotion={promotion}
                isApplied={false}
                onApply={onApply}
                loading={loading}
                promotionType={promotionType}
              />
            ))}
          </div>
        </div>
      )}

      {/* ✅ UNAVAILABLE PROMOTIONS */}
      {unavailable.length > 0 && (
        <div>
          <h4 className='text-sm font-medium text-red-700 mb-3 flex items-center gap-2'>
            <XCircle className='h-4 w-4' />
            Không thể sử dụng ({unavailable.length})
          </h4>
          <div className='space-y-3'>
            {unavailable.map((promotion) => (
              <PromotionCard
                key={promotion.id}
                promotion={promotion}
                isApplied={false}
                onApply={onApply}
                loading={loading}
                promotionType={promotionType}
              />
            ))}
          </div>
        </div>
      )}

      {/* ✅ EMPTY STATE */}
      {applied.length === 0 && notYet.length === 0 && (
        <div className='text-center py-8 text-gray-500'>
          <Gift className='h-12 w-12 mx-auto mb-4 text-gray-300' />
          <p>Không có Mã khuyến mãi  nào</p>
        </div>
      )}
    </div>
  )
}

// ========================================
// UserPromotionList Component
// ========================================

interface UserPromotionListProps {
  applied: UserPromotionDetailDTO[]
  notYet: UserPromotionDetailDTO[]
  onApply: (promotionId: string, promotionType: 'global' | 'store' | 'user') => void
  onRemove: (promotionId: string) => void
  loading?: boolean
  promotionType: 'global' | 'store' | 'user'
}

const UserPromotionList: React.FC<UserPromotionListProps> = ({
  applied,
  notYet,
  onApply,
  onRemove,
  loading = false,
  promotionType
}) => {
  // ✅ CATEGORIZE USER PROMOTIONS
  const { available, unavailable } = categorizePromotions(notYet);

  return (
    <div className="space-y-6">
      {/* ✅ APPLIED USER PROMOTIONS */}
      {applied.length > 0 && (
        <div>
          <h4 className='text-sm font-medium text-green-700 mb-3 flex items-center gap-2'>
            <CheckCircle className='h-4 w-4' />
            Đã áp dụng ({applied.length})
          </h4>
          <div className='space-y-3'>
            {applied.map((userPromotion) => (
              <PromotionCard
                key={userPromotion.promotionId}
                promotion={userPromotion}
                isApplied={true}
                userQuantity={userPromotion.quantity}
                onRemove={() => onRemove(userPromotion.promotionId)}
                loading={loading}
                promotionType={promotionType}
              />
            ))}
          </div>
        </div>
      )}

      {/* ✅ AVAILABLE USER PROMOTIONS */}
      {available.length > 0 && (
        <div>
          <h4 className='text-sm font-medium text-blue-700 mb-3 flex items-center gap-2'>
            <User className='h-4 w-4' />
            Có thể áp dụng ({available.length})
          </h4>
          <div className='space-y-3'>
            {available.map((userPromotion) => (
              <PromotionCard
                key={userPromotion.promotionId}
                promotion={userPromotion}
                isApplied={false}
                userQuantity={userPromotion.quantity}
                onApply={onApply}
                loading={loading}
                promotionType={promotionType}
              />
            ))}
          </div>
        </div>
      )}

      {/* ✅ UNAVAILABLE USER PROMOTIONS */}
      {unavailable.length > 0 && (
        <div>
          <h4 className='text-sm font-medium text-red-700 mb-3 flex items-center gap-2'>
            <XCircle className='h-4 w-4' />
            Đã hết lượt ({unavailable.length})
          </h4>
          <div className='space-y-3'>
            {unavailable.map((userPromotion) => (
              <PromotionCard
                key={userPromotion.promotionId}
                promotion={userPromotion}
                isApplied={false}
                userQuantity={userPromotion.quantity}
                onApply={onApply}
                loading={loading}
                promotionType={promotionType}
              />
            ))}
          </div>
        </div>
      )}

      {/* ✅ EMPTY STATE */}
      {applied.length === 0 && notYet.length === 0 && (
        <div className='text-center py-8 text-gray-500'>
          <User className='h-12 w-12 mx-auto mb-4 text-gray-300' />
          <p>Không có Mã khuyến mãi  cá nhân nào</p>
        </div>
      )}
    </div>
  )
}

// ========================================
// PromotionModal Component
// ========================================

const PromotionModal: React.FC<PromotionModalProps> = ({ cartId, isOpen, onClose, onApply }) => {
  const [activeTab, setActiveTab] = useState<'global' | 'store' | 'user'>('global')
  const { availablePromotions, loading } = usePromotions(cartId)
  const { user } = useAuth()

  const handleApply = async (promotionId: string, promotionType: 'global' | 'store' | 'user') => {
    if (!user?.userId) {
      toast.error('Vui lòng đăng nhập để sử dụng Mã khuyến mãi ')
      return
    }

    // Check if there's already an applied promotion of the same type
    const hasAppliedPromotionOfSameType = (availablePromotions[promotionType]?.applied?.length || 0) > 0

    if (hasAppliedPromotionOfSameType) {
      const typeLabels = {
        global: 'mã toàn hệ thống',
        store: 'mã của shop',
        user: 'mã cá nhân'
      }

      toast.warning(
        `Bạn chỉ có thể áp dụng 1 ${typeLabels[promotionType]} tại một thời điểm. Vui lòng hủy mã hiện tại trước khi chọn mã khác.`,
        {
          position: 'top-right',
          autoClose: 4000
        }
      )
      return
    }

    try {
      // Call applyPromotionToCart API
      await promotionApi.applyPromotionToCart({
        cartId: cartId,
        promotionId: promotionId
      })

      toast.success('Áp dụng Mã khuyến mãi  thành công!', {
        position: 'top-right',
        autoClose: 2000
      })

      // Call the onApply callback to refresh data
      onApply(promotionId)
    } catch (error: unknown) {
      console.error('Error applying promotion:', error)

      // Extract error message from backend response
      let errorMessage = 'Không thể áp dụng Mã khuyến mãi '

      const apiError = error as ApiError
      if (apiError?.response?.data?.message) {
        // Use backend error message
        errorMessage = apiError.response.data.message
      } else if (apiError?.message) {
        // Use generic error message
        errorMessage = apiError.message
      }

      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000
      })
    }
  }

  const handleRemove = async (promotionId: string) => {
    try {
      // Call removePromotionFromCart API
      await removePromotionFromCart(cartId, promotionId)

      toast.success('Hủy Mã khuyến mãi  thành công!', {
        position: 'top-right',
        autoClose: 2000
      })

      // Call the onApply callback to refresh data
      onApply(promotionId)
    } catch (error: unknown) {
      console.error('Error removing promotion:', error)

      // Extract error message from backend response
      let errorMessage = 'Không thể hủy Mã khuyến mãi '

      const apiError = error as ApiError
      if (apiError?.response?.data?.message) {
        // Use backend error message
        errorMessage = apiError.response.data.message
      } else if (apiError?.message) {
        // Use generic error message
        errorMessage = apiError.message
      }

      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[80vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle className='text-xl font-bold text-gray-900 flex items-center gap-2'>
            <Gift className="h-5 w-5" />
            Chọn Mã khuyến mãi
          </DialogTitle>
        </DialogHeader>

        <div className='flex flex-col flex-1 min-h-0'>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as typeof activeTab)}
            className='flex flex-col flex-1'
          >
            <TabsList className='grid w-full grid-cols-3 flex-shrink-0'>
              <TabsTrigger value='global' className='flex items-center gap-2'>
                <Gift className='h-4 w-4' />
                Mã toàn hệ thống
                {(availablePromotions.global?.applied?.length || 0) > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {availablePromotions.global.applied.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value='store' className='flex items-center gap-2'>
                <Store className='h-4 w-4' />
                Mã của shop
                {(availablePromotions.store?.applied?.length || 0) > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {availablePromotions.store.applied.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value='user' className='flex items-center gap-2'>
                <User className='h-4 w-4' />
                Mã cá nhân
                {(availablePromotions.user?.applied?.length || 0) > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {availablePromotions.user.applied.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className='mt-4 overflow-y-auto flex-1 min-h-0 pr-2 max-h-[60vh]'>
              <TabsContent value='global' className='mt-0'>
                {loading ? (
                  <div className='flex items-center justify-center py-8'>
                    <Loader2 className='h-8 w-8 animate-spin' />
                    <span className="ml-2">Đang tải mã toàn hệ thống...</span>
                  </div>
                ) : (
                  <PromotionList
                    applied={availablePromotions.global?.applied || []}
                    notYet={availablePromotions.global?.notYet || []}
                    onApply={handleApply}
                    onRemove={handleRemove}
                    loading={loading}
                    promotionType='global'
                  />
                )}
              </TabsContent>

              <TabsContent value='store' className='mt-0'>
                {loading ? (
                  <div className='flex items-center justify-center py-8'>
                    <Loader2 className='h-8 w-8 animate-spin' />
                    <span className="ml-2">Đang tải mã của shop...</span>
                  </div>
                ) : (
                  <PromotionList
                    applied={availablePromotions.store?.applied || []}
                    notYet={availablePromotions.store?.notYet || []}
                    onApply={handleApply}
                    onRemove={handleRemove}
                    loading={loading}
                    promotionType='store'
                  />
                )}
              </TabsContent>

              <TabsContent value='user' className='mt-0'>
                {loading ? (
                  <div className='flex items-center justify-center py-8'>
                    <Loader2 className='h-8 w-8 animate-spin' />
                    <span className="ml-2">Đang tải mã cá nhân...</span>
                  </div>
                ) : (
                  <UserPromotionList
                    applied={availablePromotions.user?.applied || []}
                    notYet={availablePromotions.user?.notYet || []}
                    onApply={handleApply}
                    onRemove={handleRemove}
                    loading={loading}
                    promotionType='user'
                  />
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { PromotionModal, PromotionCard, PromotionList, UserPromotionList }
