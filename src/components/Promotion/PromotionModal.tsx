import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Loader2, Clock, CheckCircle, XCircle, Gift, Store, User } from 'lucide-react'
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
  isExpired = false,
  userQuantity,
  onApply,
  onRemove,
  showActions = true,
  loading = false,
  promotionType = 'global'
}) => {
  const promo = 'promotion' in promotion ? promotion.promotion : promotion

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

  // Check if promotion is currently active
  const isCurrentlyActive = () => {
    try {
      let startDateObj: Date
      let endDateObj: Date

      // Handle start date
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

      // Handle end date
      if (promo.endDate.includes(' ')) {
        const [timePart, datePart] = promo.endDate.split(' ')
        const [hours, minutes, seconds] = timePart.split(':')
        const [day, month, year] = datePart.split('/')
        endDateObj = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
          parseInt(seconds)
        )
      } else {
        endDateObj = new Date(promo.endDate)
      }

      const now = new Date()
      return startDateObj <= now && now <= endDateObj
    } catch (error) {
      console.error('Error checking active date:', error)
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
    const promo = 'promotion' in promotion ? promotion.promotion : promotion
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
    const promo = 'promotion' in promotion ? promotion.promotion : promotion
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

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${isApplied
        ? 'border-green-500 bg-green-50'
        : isExpired
          ? 'border-red-300 bg-red-50 opacity-70'
          : 'border-gray-200 hover:border-gray-300'
        }`}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-2'>
            <Badge variant='outline' className={`${getTypeColor()} flex items-center gap-1`}>
              {getTypeIcon()}
              {PROMOTION_TYPE_LABELS[promo.type]}
            </Badge>
            <Badge variant='destructive' className='bg-red-500 hover:bg-red-600'>
              {getDiscountText()}
            </Badge>
          </div>
          {isApplied && <CheckCircle className='h-5 w-5 text-green-500' />}
          {isExpired && <XCircle className='h-5 w-5 text-red-500' />}
        </div>
        <CardTitle className='text-lg font-semibold text-gray-900'>{promo.title}</CardTitle>
      </CardHeader>

      <CardContent className='pt-0'>
        <p className='text-sm text-gray-600 mb-4 line-clamp-2'>{promo.description}</p>

        <div className='space-y-2 mb-4'>
          {promo.minValueDiscount && (
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Clock className='h-4 w-4' />
              <span>Đơn tối thiểu {promo.minValueDiscount.toLocaleString('vi-VN')}₫</span>
            </div>
          )}

          {promo.type === 'User' && userQuantity !== undefined && (
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <User className='h-4 w-4' />
              <span>Còn {userQuantity} lượt sử dụng</span>
            </div>
          )}

          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <Clock className='h-4 w-4' />
            <span>
              Có hiệu lực từ {formatDate(promo.startDate)} đến {formatDate(promo.endDate)}
            </span>
          </div>
        </div>

        {showActions && (
          <div className='flex gap-2'>
            {isApplied ? (
              <Button
                variant='outline'
                size='sm'
                onClick={onRemove}
                disabled={loading}
                className='flex-1 border-red-300 text-red-600 hover:bg-red-50'
              >
                {loading ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Hủy áp dụng'}
              </Button>
            ) : (
              <Button
                size='sm'
                variant='green'
                onClick={() => {
                  const promo = 'promotion' in promotion ? promotion.promotion : promotion
                  onApply?.(promo.id, promotionType)
                }}
                disabled={
                  isExpired ||
                  (promo.type === 'User' && userQuantity === 0) ||
                  loading ||
                  isUpcoming() ||
                  !isCurrentlyActive()
                }
                className='flex-1'
              >
                {loading ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : isExpired ? (
                  'Đã hết hạn'
                ) : promo.type === 'User' && userQuantity === 0 ? (
                  'Hết lượt'
                ) : isUpcoming() ? (
                  'Sắp tới'
                ) : !isCurrentlyActive() ? (
                  'Chưa có hiệu lực'
                ) : (
                  'Lấy'
                )}
              </Button>
            )}
          </div>
        )}
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
  // const appliedIds = applied.map(p => p.id)

  return (
    <div className='space-y-4'>
      {/* Applied Promotions */}
      {applied.length > 0 && (
        <div>
          <h4 className='text-sm font-medium text-green-600 mb-3 flex items-center gap-2'>
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

      {/* Available Promotions */}
      {notYet.length > 0 && (
        <div>
          <h4 className='text-sm font-medium text-gray-700 mb-3'>Có thể áp dụng ({notYet.length})</h4>
          <div className='space-y-3'>
            {notYet.map((promotion) => (
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

      {/* Empty State */}
      {applied.length === 0 && notYet.length === 0 && (
        <div className='text-center py-8 text-gray-500'>
          <Gift className='h-12 w-12 mx-auto mb-4 text-gray-300' />
          <p>Không có mã giảm giá nào</p>
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
  // const appliedIds = applied.map(p => p.promotionId)

  return (
    <div className='space-y-4'>
      {/* Applied Promotions */}
      {applied.length > 0 && (
        <div>
          <h4 className='text-sm font-medium text-green-600 mb-3 flex items-center gap-2'>
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

      {/* Available Promotions */}
      {notYet.length > 0 && (
        <div>
          <h4 className='text-sm font-medium text-gray-700 mb-3'>Có thể áp dụng ({notYet.length})</h4>
          <div className='space-y-3'>
            {notYet.map((userPromotion) => (
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

      {/* Empty State */}
      {applied.length === 0 && notYet.length === 0 && (
        <div className='text-center py-8 text-gray-500'>
          <User className='h-12 w-12 mx-auto mb-4 text-gray-300' />
          <p>Không có mã giảm giá cá nhân nào</p>
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
      toast.error('Vui lòng đăng nhập để sử dụng mã giảm giá')
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

      toast.success('Áp dụng mã giảm giá thành công!', {
        position: 'top-right',
        autoClose: 2000
      })

      // Call the onApply callback to refresh data
      onApply(promotionId)
    } catch (error: unknown) {
      console.error('Error applying promotion:', error)

      // Extract error message from backend response
      let errorMessage = 'Không thể áp dụng mã giảm giá'

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

      toast.success('Hủy mã giảm giá thành công!', {
        position: 'top-right',
        autoClose: 2000
      })

      // Call the onApply callback to refresh data
      onApply(promotionId)
    } catch (error: unknown) {
      console.error('Error removing promotion:', error)

      // Extract error message from backend response
      let errorMessage = 'Không thể hủy mã giảm giá'

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
          <DialogTitle className='text-xl font-bold text-gray-900'>Chọn mã giảm giá</DialogTitle>
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
              </TabsTrigger>
              <TabsTrigger value='store' className='flex items-center gap-2'>
                <Store className='h-4 w-4' />
                Mã của shop
              </TabsTrigger>
              <TabsTrigger value='user' className='flex items-center gap-2'>
                <User className='h-4 w-4' />
                Mã cá nhân
              </TabsTrigger>
            </TabsList>

            <div className='mt-4 overflow-y-auto flex-1 min-h-0 pr-2 max-h-[60vh]'>
              <TabsContent value='global' className='mt-0'>
                {loading ? (
                  <div className='flex items-center justify-center py-8'>
                    <Loader2 className='h-8 w-8 animate-spin' />
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
