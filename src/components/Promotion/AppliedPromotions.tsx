import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { X, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { type AppliedPromotionsProps, type CartPromotionDto } from '../../types/promotionType'
import { usePromotionTimer } from '../../hooks/usePromotions'

// ========================================
// PromotionTimer Component
// ========================================

interface PromotionTimerProps {
  expiredAt: string
  isExpiringSoon?: boolean
}

const PromotionTimer: React.FC<PromotionTimerProps> = ({ expiredAt, isExpiringSoon = false }) => {
  const { timeLeftDisplayText, isExpired, isExpiringSoon: timerExpiringSoon } = usePromotionTimer(expiredAt)
  
  const isReallyExpiringSoon = isExpiringSoon || timerExpiringSoon

  return (
    <div className={`flex items-center gap-1 text-xs ${
      isExpired ? 'text-red-600' : 
      isReallyExpiringSoon ? 'text-orange-600' : 
      'text-gray-600'
    }`}>
      <Clock className="h-3 w-3" />
      <span className={isReallyExpiringSoon ? 'font-semibold' : ''}>
        {timeLeftDisplayText}
      </span>
    </div>
  )
}

// ========================================
// AppliedPromotionItem Component
// ========================================

interface AppliedPromotionItemProps {
  promotion: CartPromotionDto
  onRemove: (promotionId: string) => void
  loading?: boolean
}

const AppliedPromotionItem: React.FC<AppliedPromotionItemProps> = ({
  promotion,
  onRemove,
  loading = false
}) => {
  const getDiscountText = () => {
    switch (promotion.discountType) {
      case 'percentage':
        return `Giảm ${promotion.discountValue}%`
      case 'fixed_amount':
        return `Giảm ${promotion.discountValue.toLocaleString('vi-VN')}₫`
      case 'freeship':
        return 'Miễn phí vận chuyển'
      default:
        return 'Giảm giá'
    }
  }

  const getTypeColor = () => {
    switch (promotion.type) {
      case 'Global':
        return 'bg-blue-100 text-blue-800'
      case 'User':
        return 'bg-green-100 text-green-800'
      case 'Product':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = () => {
    switch (promotion.status) {
      case 'Reserved':
        return 'bg-yellow-100 text-yellow-800'
      case 'Used':
        return 'bg-green-100 text-green-800'
      case 'Released':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = () => {
    switch (promotion.status) {
      case 'Reserved':
        return <Clock className="h-3 w-3" />
      case 'Used':
        return <CheckCircle className="h-3 w-3" />
      case 'Released':
        return <X className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  return (
    <Card className={`transition-all duration-200 ${
      promotion.isExpired ? 'border-red-300 bg-red-50' :
      promotion.isExpiringSoon ? 'border-orange-300 bg-orange-50' :
      'border-green-200 bg-green-50'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`${getTypeColor()} text-xs`}>
              {promotion.type}
            </Badge>
            <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 text-xs">
              {getDiscountText()}
            </Badge>
            <Badge variant="outline" className={`${getStatusColor()} text-xs flex items-center gap-1`}>
              {getStatusIcon()}
              {promotion.status}
            </Badge>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(promotion.promotionId)}
            disabled={loading || promotion.isExpired}
            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <CardTitle className="text-base font-semibold text-gray-900">
          {promotion.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {promotion.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm text-gray-600">
              Giảm: <span className="font-semibold text-red-600">
                -{promotion.discountAmount.toLocaleString('vi-VN')}₫
              </span>
            </div>
            
            {promotion.minValueDiscount > 0 && (
              <div className="text-xs text-gray-500">
                Đơn tối thiểu: {promotion.minValueDiscount.toLocaleString('vi-VN')}₫
              </div>
            )}
          </div>
          
          <div className="text-right">
            <PromotionTimer 
              expiredAt={promotion.expiredAt} 
              isExpiringSoon={promotion.isExpiringSoon}
            />
            
            {promotion.isExpired && (
              <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                <AlertTriangle className="h-3 w-3" />
                <span>Đã hết hạn</span>
              </div>
            )}
            
            {promotion.isExpiringSoon && !promotion.isExpired && (
              <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                <AlertTriangle className="h-3 w-3" />
                <span>Sắp hết hạn</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ========================================
// AppliedPromotions Component
// ========================================

const AppliedPromotions: React.FC<AppliedPromotionsProps> = ({
  cartPromotions,
  onRemove
}) => {
  const [loadingPromotionId, setLoadingPromotionId] = React.useState<string | null>(null)

  const handleRemove = async (promotionId: string) => {
    setLoadingPromotionId(promotionId)
    try {
      await onRemove(promotionId)
    } finally {
      setLoadingPromotionId(null)
    }
  }

  // Group promotions by status
  const activePromotions = cartPromotions.filter(p => !p.isExpired && p.status === 'Reserved')
  const expiredPromotions = cartPromotions.filter(p => p.isExpired)
  const usedPromotions = cartPromotions.filter(p => p.status === 'Used')

  const totalDiscount = cartPromotions.reduce((sum, promo) => sum + promo.discountAmount, 0)

  if (cartPromotions.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Chưa có mã giảm giá nào được áp dụng</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700">
              Mã giảm giá đã áp dụng ({cartPromotions.length})
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Tổng giảm giá: <span className="font-semibold text-red-600">
                -{totalDiscount.toLocaleString('vi-VN')}₫
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Active Promotions */}
      {activePromotions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-green-600 mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Đang áp dụng ({activePromotions.length})
          </h4>
          <div className="space-y-3">
            {activePromotions.map((promotion) => (
              <AppliedPromotionItem
                key={promotion.cartPromotionId}
                promotion={promotion}
                onRemove={handleRemove}
                loading={loadingPromotionId === promotion.promotionId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Expired Promotions */}
      {expiredPromotions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-red-600 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Đã hết hạn ({expiredPromotions.length})
          </h4>
          <div className="space-y-3">
            {expiredPromotions.map((promotion) => (
              <AppliedPromotionItem
                key={promotion.cartPromotionId}
                promotion={promotion}
                onRemove={handleRemove}
                loading={loadingPromotionId === promotion.promotionId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Used Promotions */}
      {usedPromotions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Đã sử dụng ({usedPromotions.length})
          </h4>
          <div className="space-y-3">
            {usedPromotions.map((promotion) => (
              <AppliedPromotionItem
                key={promotion.cartPromotionId}
                promotion={promotion}
                onRemove={handleRemove}
                loading={loadingPromotionId === promotion.promotionId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export { AppliedPromotions, AppliedPromotionItem, PromotionTimer }
