import { useMemo, useEffect, useRef } from 'react'
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

// Tạo số ngẫu nhiên từ seed để đảm bảo tính nhất quán
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Tạo các thuộc tính ngẫu nhiên cho mỗi voucher
function generateVoucherProps(index: number) {
  const seed = index * 1234.5678 // Seed để tạo số ngẫu nhiên nhất quán

  // Vị trí xuất phát ngẫu nhiên (phân tán trên khu vực rộng hơn)
  const startTop = -20 - seededRandom(seed) * 15 // -20% đến -35%
  const startLeft = 20 + seededRandom(seed + 1) * 60 // 20% đến 80%

  // Góc rơi ban đầu ngẫu nhiên (-15deg đến 15deg)
  const initialRotation = (seededRandom(seed + 2) - 0.5) * 30

  // Lực đẩy ngang ngẫu nhiên (gió) - từ -20px đến 20px
  const horizontalDrift = (seededRandom(seed + 3) - 0.5) * 40

  // Delay ngẫu nhiên để tránh rơi đồng loạt
  const delay = seededRandom(seed + 4) * 1.5

  // Duration ngẫu nhiên (2.5s đến 4s)
  const duration = 2.5 + seededRandom(seed + 5) * 1.5

  // Rotation trong quá trình rơi
  const maxRotation = initialRotation + (seededRandom(seed + 6) - 0.5) * 40

  // Tính toán các keyframe values
  const rotationDelta = maxRotation - initialRotation

  return {
    startTop,
    startLeft,
    initialRotation,
    horizontalDrift,
    rotationDelta,
    delay,
    duration
  }
}

export default function PromoMascot({ promotion = {} }: PromoMascotProps) {
  const discountText = promotion && 'discountType' in promotion ? getDiscountText(promotion as PromotionDTO) : 'VOUCHER'
  const voucherTexts = [discountText, ...genericVoucherTexts]
  // Tăng số lượng voucher để hiệu ứng lì xì rõ ràng hơn
  const vouchers = Array.from({ length: 10 })
  const styleSheetRef = useRef<HTMLStyleElement | null>(null)

  // Tạo props cho mỗi voucher một lần (memoized)
  const voucherPropsList = useMemo(() => {
    return vouchers.map((_, i) => generateVoucherProps(i))
  }, [vouchers])

  // Tạo keyframes động cho mỗi voucher
  useEffect(() => {
    if (!styleSheetRef.current) {
      styleSheetRef.current = document.createElement('style')
      document.head.appendChild(styleSheetRef.current)
    }

    const styleSheet = styleSheetRef.current
    let keyframesCSS = ''

    voucherPropsList.forEach((props, i) => {
      const animationName = `voucherFall-${i}`
      const { initialRotation, rotationDelta, horizontalDrift } = props

      // Container height là 250px, vouchers bắt đầu từ trên và rơi xuống
      // Tính toán quãng đường rơi: từ startTop (khoảng -20% đến -35%) xuống gần bottom (khoảng 220px)
      // Vì startTop đã được set trong style, translateY sẽ cộng thêm vào
      const fallDistance = 280 // Khoảng cách rơi tính bằng px (từ top âm xuống gần bottom)

      // Tính toán các giá trị transform cho từng keyframe với gia tốc
      const rotationAt50 = initialRotation + rotationDelta * 0.7
      const rotationAt85 = initialRotation + rotationDelta
      const rotationAt100 = initialRotation + rotationDelta + 15

      keyframesCSS += `
        @keyframes ${animationName} {
          0% {
            transform: translateY(0px) translateX(0px) rotate(${initialRotation}deg) scale(0.7);
            opacity: 0;
          }
          3% {
            opacity: 0.6;
            transform: translateY(${fallDistance * 0.02}px) translateX(${horizontalDrift * 0.1}px) rotate(${initialRotation + 2}deg) scale(0.75);
          }
          8% {
            opacity: 1;
            transform: translateY(${fallDistance * 0.08}px) translateX(${horizontalDrift * 0.3}px) rotate(${initialRotation + 4}deg) scale(0.8);
          }
          15% {
            transform: translateY(${fallDistance * 0.18}px) translateX(${horizontalDrift * 0.5}px) rotate(${initialRotation + 6}deg) scale(0.85);
          }
          25% {
            transform: translateY(${fallDistance * 0.35}px) translateX(${horizontalDrift * 0.7}px) rotate(${initialRotation + rotationDelta * 0.3}deg) scale(0.9);
          }
          35% {
            transform: translateY(${fallDistance * 0.50}px) translateX(${horizontalDrift * 0.85}px) rotate(${initialRotation + rotationDelta * 0.5}deg) scale(0.95);
          }
          50% {
            transform: translateY(${fallDistance * 0.70}px) translateX(${horizontalDrift}px) rotate(${rotationAt50}deg) scale(1);
          }
          65% {
            transform: translateY(${fallDistance * 0.85}px) translateX(${horizontalDrift * 1.1}px) rotate(${initialRotation + rotationDelta * 0.85}deg) scale(0.98);
          }
          80% {
            transform: translateY(${fallDistance * 0.95}px) translateX(${horizontalDrift * 1.15}px) rotate(${rotationAt85}deg) scale(0.95);
            opacity: 0.9;
          }
          85% {
            transform: translateY(${fallDistance}px) translateX(${horizontalDrift * 1.2}px) rotate(${rotationAt85 + 5}deg) scale(0.92);
            opacity: 0.8;
          }
          88% {
            transform: translateY(${fallDistance * 0.98}px) translateX(${horizontalDrift * 1.25}px) rotate(${rotationAt85 + 8}deg) scale(0.9);
            opacity: 0.6;
          }
          92% {
            transform: translateY(${fallDistance}px) translateX(${horizontalDrift * 1.3}px) rotate(${rotationAt85 + 10}deg) scale(0.88);
            opacity: 0.4;
          }
          96% {
            transform: translateY(${fallDistance * 0.995}px) translateX(${horizontalDrift * 1.35}px) rotate(${rotationAt85 + 12}deg) scale(0.85);
            opacity: 0.2;
          }
          100% {
            transform: translateY(${fallDistance}px) translateX(${horizontalDrift * 1.4}px) rotate(${rotationAt100}deg) scale(0.8);
            opacity: 0;
          }
        }
      `
    })

    styleSheet.textContent = keyframesCSS

    return () => {
      if (styleSheetRef.current && styleSheetRef.current.parentNode) {
        styleSheetRef.current.parentNode.removeChild(styleSheetRef.current)
        styleSheetRef.current = null
      }
    }
  }, [voucherPropsList])

  return (
    <div className='relative w-full max-w-[250px] h-[250px] flex-shrink-0 mascot-container mx-auto lg:mx-0'>
      {/* Mascot với animation nhún + tay giơ lên - nâng lên một chút, to và rộng hơn */}
      <div className='absolute bottom-4 left-1/2 -translate-x-1/2 z-10'>
        <img
          src={mascotvoucher}
          alt='mascot'
          className='w-[200px] lg:w-[240px] animate-mascot-bounce drop-shadow-lg'
          style={{ display: 'block' }}
        />
      </div>

      {/* Falling vouchers như lì xì - với gia tốc, gió, và bật nảy */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        {vouchers.map((_, i) => {
          const props = voucherPropsList[i]
          const animationName = `voucherFall-${i}`

          return (
            <Badge
              key={i}
              variant='destructive'
              className='absolute font-bold text-xs lg:text-sm'
              style={{
                left: `${props.startLeft}%`,
                top: `${props.startTop}%`,
                animationName: animationName,
                animationDuration: `${props.duration}s`,
                animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                animationDelay: `${props.delay}s`,
                animationIterationCount: 'infinite'
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
