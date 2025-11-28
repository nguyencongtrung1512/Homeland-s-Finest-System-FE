import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Gift } from 'lucide-react'
import { AppliedPromotions } from '../Promotion/AppliedPromotions'
import type { AppliedPromotion } from '../../types/cartType'

interface AppliedPromotionModalProps {
  isOpen: boolean
  onClose: () => void
  appliedPromotions: AppliedPromotion[]
  storeName: string
  cartId: string
  onRemovePromotion: (cartId: string, promotionId: string, silent?: boolean) => Promise<void>
}

const AppliedPromotionModal: React.FC<AppliedPromotionModalProps> = ({
  isOpen,
  onClose,
  appliedPromotions,
  storeName,
  cartId,
  onRemovePromotion
}) => {
  const handleRemovePromotion = async (promotionId: string, silent?: boolean) => {
    try {
      await onRemovePromotion(cartId, promotionId, silent)
    } catch (error) {
      console.error('Error removing promotion:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Gift className='h-5 w-5 text-green-600' />
            Mã khuyến mãi  đã áp dụng - {storeName}
          </DialogTitle>
        </DialogHeader>

        <AppliedPromotions
          cartPromotions={
            appliedPromotions?.map((promo) => ({
              cartPromotionId: promo.cartPromotionId,
              promotionId: promo.promotionId,
              type: promo.type as 'Global' | 'User' | 'Product' | 'Store',
              title: promo.title,
              description: promo.description,
              discountType: promo.discountType as 'percentage' | 'fixed_amount' | 'freeship',
              discountValue: promo.discountValue,
              discountAmount: promo.discountAmount,
              minValueDiscount: promo.minValueDiscount,
              appliedAt: promo.appliedAt,
              expiredAt: promo.expiredAt,
              minutesLeft: promo.minutesLeft,
              secondsLeft: promo.secondsLeft,
              status: promo.status as 'Reserved' | 'Used' | 'Released',
              isExpired: promo.isExpired,
              isExpiringSoon: promo.isExpiringSoon,
              discountDisplayText: promo.discountDisplayText,
              timeLeftDisplayText: promo.timeLeftDisplayText
            })) || []
          }
          onRemove={handleRemovePromotion}
        />
      </DialogContent>
    </Dialog>
  )
}

export default AppliedPromotionModal
