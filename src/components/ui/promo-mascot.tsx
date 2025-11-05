import mascotvoucher from '../../assets/mascot-voucher.png'
import { Badge } from './badge'
import { type PromotionDTO } from '../../types/promotionType'

const genericVoucherTexts = ['VOUCHER', 'SALE', 'ƯU ĐÃI']

function getDiscountText(promotion: PromotionDTO) {
  if (promotion.discountType === 'percentage') {
    return `-${promotion.discountValue}%`
  }
  if (promotion.discountType === 'fixed_amount' && promotion.discountValue) {
    // Format to K for thousands
    return `-${Math.round(promotion.discountValue / 1000)}K`
  }
  if (promotion.discountType === 'freeship') {
    return 'FREESHIP'
  }
  return 'SALE'
}

interface PromoMascotProps {
  promotion?: PromotionDTO | Record<string, never>
}

export default function PromoMascot({ promotion = {} }: PromoMascotProps) {
  const discountText = promotion && 'discountType' in promotion ? getDiscountText(promotion as PromotionDTO) : 'VOUCHER'
  const voucherTexts = [discountText, ...genericVoucherTexts]
  // Tăng số lượng voucher để hiệu ứng lì xì rõ ràng hơn
  const vouchers = Array.from({ length: 8 })

  return (
    <div className='relative w-full max-w-[250px] h-[250px] flex-shrink-0 mascot-container mx-auto lg:mx-0'>
      {/* Mascot với animation nhún + tay giơ lên - nâng lên một chút, to và rộng hơn */}
      <div className='absolute bottom-4 left-1/2 -translate-x-1/2 z-10'>
        <img
          src={mascotvoucher}
          alt='mascot'
          className='w-[180px] lg:w-[200px] animate-mascot-bounce drop-shadow-lg'
          style={{ display: 'block' }}
        />
      </div>

      {/* Falling vouchers như lì xì - rơi sát xuống hơn */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        {vouchers.map((_, i) => {
          // Random positions for natural falling effect - tập trung gần mascot hơn
          const leftPosition = 20 + ((i * 10) % 60) // Giảm range để sát hơn
          const delay = i * 0.3
          const duration = 2 + (i % 3) * 0.5

          return (
            <Badge
              key={i}
              variant='destructive'
              className='absolute font-bold text-xs lg:text-sm animate-voucher'
              style={{
                left: `${leftPosition}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`
              }}
            >
              {voucherTexts[i % voucherTexts.length]}
            </Badge>
          )
        })}
      </div>
    </div>
  )
}
