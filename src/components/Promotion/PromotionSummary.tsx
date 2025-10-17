import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Gift, Clock, AlertTriangle } from 'lucide-react'
import { type CartPromotionDto } from '../../types/promotionType'
import { usePromotionTimer } from '../../hooks/usePromotions'

// ========================================
// PromotionSummaryItem Component
// ========================================

interface PromotionSummaryItemProps {
  promotion: CartPromotionDto
}

const PromotionSummaryItem: React.FC<PromotionSummaryItemProps> = ({ promotion }) => {
  const { timeLeftDisplayText, isExpired, isExpiringSoon } = usePromotionTimer(promotion.expiredAt)

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

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 flex-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${getTypeColor()} text-xs`}>
            {promotion.type}
          </Badge>
          <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 text-xs">
            {getDiscountText()}
          </Badge>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {promotion.title}
          </p>
          
          <div className="flex items-center gap-2 mt-1">
            <div className={`flex items-center gap-1 text-xs ${
              isExpired ? 'text-red-600' : 
              isExpiringSoon ? 'text-orange-600' : 
              'text-gray-500'
            }`}>
              <Clock className="h-3 w-3" />
              <span>{timeLeftDisplayText}</span>
            </div>
            
            {isExpiringSoon && !isExpired && (
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                <span>Sắp hết hạn</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <span className="text-sm font-semibold text-red-600">
          -{promotion.discountAmount.toLocaleString('vi-VN')}₫
        </span>
      </div>
    </div>
  )
}

// ========================================
// OrderSummary Component
// ========================================

interface OrderSummaryProps {
  subtotal: number
  appliedPromotions: CartPromotionDto[]
  shippingFee: number
  total: number
  className?: string
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  subtotal,
  appliedPromotions,
  shippingFee,
  total,
  className = ''
}) => {
  const totalDiscount = appliedPromotions.reduce((sum, promo) => sum + promo.discountAmount, 0)
  const activePromotions = appliedPromotions.filter(p => !p.isExpired && p.status === 'Reserved')
  const expiredPromotions = appliedPromotions.filter(p => p.isExpired)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Tóm tắt đơn hàng
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Tạm tính</span>
          <span className="text-sm font-medium">
            {subtotal.toLocaleString('vi-VN')}₫
          </span>
        </div>

        {/* Applied Promotions */}
        {activePromotions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Mã giảm giá đã áp dụng ({activePromotions.length})
              </span>
            </div>
            
            <div className="space-y-2">
              {activePromotions.map((promotion) => (
                <PromotionSummaryItem
                  key={promotion.cartPromotionId}
                  promotion={promotion}
                />
              ))}
            </div>
            
            <Separator className="my-3" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tổng giảm giá</span>
              <span className="text-sm font-semibold text-red-600">
                -{totalDiscount.toLocaleString('vi-VN')}₫
              </span>
            </div>
          </div>
        )}

        {/* Expired Promotions Warning */}
        {expiredPromotions.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Có {expiredPromotions.length} mã giảm giá đã hết hạn
              </span>
            </div>
            <p className="text-xs text-orange-700 mt-1">
              Mã giảm giá hết hạn sẽ không được áp dụng vào đơn hàng
            </p>
          </div>
        )}

        {/* Shipping Fee */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Phí vận chuyển</span>
          <span className="text-sm font-medium">
            {shippingFee.toLocaleString('vi-VN')}₫
          </span>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-gray-900">Tổng cộng</span>
          <span className="text-lg font-bold text-gray-900">
            {total.toLocaleString('vi-VN')}₫
          </span>
        </div>

        {/* Savings Summary */}
        {totalDiscount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Bạn đã tiết kiệm được {totalDiscount.toLocaleString('vi-VN')}₫
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ========================================
// PromotionSummary Component (Simplified)
// ========================================

interface PromotionSummaryProps {
  appliedPromotions: CartPromotionDto[]
  className?: string
}

const PromotionSummary: React.FC<PromotionSummaryProps> = ({
  appliedPromotions,
  className = ''
}) => {
  const totalDiscount = appliedPromotions.reduce((sum, promo) => sum + promo.discountAmount, 0)
  const activePromotions = appliedPromotions.filter(p => !p.isExpired && p.status === 'Reserved')

  if (activePromotions.length === 0) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Gift className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium text-green-600">
          Mã giảm giá đã áp dụng ({activePromotions.length})
        </span>
      </div>
      
      <div className="space-y-2">
        {activePromotions.map((promotion) => (
          <PromotionSummaryItem
            key={promotion.cartPromotionId}
            promotion={promotion}
          />
        ))}
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-sm font-medium text-gray-700">Tổng giảm giá</span>
        <span className="text-sm font-semibold text-red-600">
          -{totalDiscount.toLocaleString('vi-VN')}₫
        </span>
      </div>
    </div>
  )
}

export { OrderSummary, PromotionSummary, PromotionSummaryItem }
