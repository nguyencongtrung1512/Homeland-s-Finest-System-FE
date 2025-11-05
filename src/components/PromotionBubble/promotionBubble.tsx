import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Gift } from 'lucide-react'
import { useAuth } from '../../contexts/auth.context'
import { useChat } from '../../contexts/chat.context'
import { promotionApi } from '../../apis/promotion.api'
import { type PromotionDTO } from '../../types/promotionType'
import { toast } from '../../utils/toast'
import PromoMascot from '../ui/promo-mascot'
import givePromotionImg from '../../assets/give-promotion.png'

interface PromotionBubbleProps {
  className?: string
}

const PromotionBubble: React.FC<PromotionBubbleProps> = ({ className = '' }) => {
  const { user } = useAuth()
  const { isOpen: isChatOpen } = useChat()
  const [showModal, setShowModal] = useState(false)
  const [promotions, setPromotions] = useState<PromotionDTO[]>([])
  const [claiming, setClaiming] = useState<string | null>(null)
  const [hasCheckedPromotions, setHasCheckedPromotions] = useState(false)
  const [hasShownAutoModal, setHasShownAutoModal] = useState(false)

  const checkActivePromotions = useCallback(async () => {
    if (!user) return

    try {
      const response = await promotionApi.getActivePromotionsForUser()

      if (response.data && response.data.length > 0) {
        setPromotions(response.data)
        console.log('🎁 Found active promotions:', response.data)
      } else {
        console.log('🎁 No active promotions found')
      }
    } catch (error) {
      console.error('Error fetching active promotions:', error)
    } finally {
      setHasCheckedPromotions(true)
    }
  }, [user])

  // Check for active promotions when component mounts
  useEffect(() => {
    if (user && !hasCheckedPromotions) {
      checkActivePromotions()
    }
  }, [user, hasCheckedPromotions, checkActivePromotions])

  // Auto show modal after 5 seconds when user is logged in and has promotions
  useEffect(() => {
    if (user && promotions.length > 0 && !hasShownAutoModal && hasCheckedPromotions) {
      const timer = setTimeout(() => {
        setShowModal(true)
        setHasShownAutoModal(true)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [user, promotions, hasShownAutoModal, hasCheckedPromotions])

  const handleClaimPromotion = async (promotionId: string) => {
    if (!user) return

    try {
      setClaiming(promotionId)
      console.log('🎁 Claiming promotion:', { promotionId, userId: user.userId })

      await promotionApi.claimPromotion(promotionId, user.userId)

      toast.success('Nhận promotion thành công! 🎉', {
        position: 'top-right',
        autoClose: 3000
      })

      // Remove claimed promotion from list
      setPromotions((prev) => prev.filter((p) => p.id !== promotionId))

      // Close modal if no more promotions
      if (promotions.length <= 1) {
        setShowModal(false)
      }
    } catch (error) {
      console.error('Error claiming promotion:', error)
      toast.error('Không thể nhận promotion. Vui lòng thử lại!', {
        position: 'top-right',
        autoClose: 3000
      })
    } finally {
      setClaiming(null)
    }
  }

  // const formatDate = (dateString: string) => {
  //   try {
  //     if (!dateString) return 'N/A'

  //     let date: Date
  //     if (dateString.includes(' ') && dateString.includes('/')) {
  //       // Backend format: "HH:mm:ss dd/MM/yyyy"
  //       const [timePart, datePart] = dateString.split(' ')
  //       const [hours, minutes, seconds] = timePart.split(':')
  //       const [day, month, year] = datePart.split('/')
  //       date = new Date(
  //         parseInt(year),
  //         parseInt(month) - 1,
  //         parseInt(day),
  //         parseInt(hours),
  //         parseInt(minutes),
  //         parseInt(seconds)
  //       )
  //     } else {
  //       // ISO format
  //       date = new Date(dateString)
  //     }

  //     if (isNaN(date.getTime())) {
  //       return 'Invalid Date'
  //     }

  //     return date.toLocaleDateString('vi-VN', {
  //       day: '2-digit',
  //       month: '2-digit',
  //       year: 'numeric',
  //       hour: '2-digit',
  //       minute: '2-digit'
  //     })
  //   } catch (error) {
  //     console.error('Error formatting date:', dateString, error)
  //     return 'Invalid Date'
  //   }
  // }

  // const getDiscountIcon = (discountType: string) => {
  //   switch (discountType) {
  //     case 'percentage':
  //       return <Percent className='h-4 w-4 text-blue-500' />
  //     case 'fixed_amount':
  //       return <DollarSign className='h-4 w-4 text-green-500' />
  //     case 'freeship':
  //       return <Users className='h-4 w-4 text-purple-500' />
  //     default:
  //       return <Percent className='h-4 w-4 text-gray-500' />
  //   }
  // }

  // const getDiscountTypeLabel = (discountType: string) => {
  //   switch (discountType) {
  //     case 'percentage':
  //       return 'Phần trăm'
  //     case 'fixed_amount':
  //       return 'Số tiền cố định'
  //     case 'freeship':
  //       return 'Miễn phí vận chuyển'
  //     default:
  //       return 'Không xác định'
  //   }
  // }

  const isExpired = (endDate: string) => {
    try {
      if (!endDate) return false

      let date: Date
      if (endDate.includes(' ') && endDate.includes('/')) {
        const [timePart, datePart] = endDate.split(' ')
        const [hours, minutes, seconds] = timePart.split(':')
        const [day, month, year] = datePart.split('/')
        date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
          parseInt(seconds)
        )
      } else {
        date = new Date(endDate)
      }

      if (isNaN(date.getTime())) {
        return false
      }

      return date < new Date()
    } catch (error) {
      console.error('Error checking if expired:', endDate, error)
      return false
    }
  }

  if (!user || promotions.length === 0) {
    return null
  }

  return (
    <>
      {/* Auto Modal Popup */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className='max-h-[60vh] !w-[95vw] !max-w-[50vw] sm:!max-w-[50vw] md:!max-w-[50vw] lg:!max-w-[50vw]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-xl'>
              <Gift className='h-6 w-6 text-pink-500' />
              🎉 Promotion của bạn ({promotions.length})
            </DialogTitle>
          </DialogHeader>

          {/* Layout 2 cột: List vouchers (trái 2/3) + Mascot (phải 1/3) */}
          <div className='flex gap-6 mt-4 min-h-0'>
            {/* List vouchers bên trái - chiếm 2/3 không gian */}
            <div className='flex-[2] overflow-y-auto pr-2 max-h-[35vh]'>
              <div className='flex flex-col gap-4'>
                {promotions.map((promotion) => (
                  <div key={promotion.id} className='border rounded-lg p-4 bg-white shadow-sm'>
                    {/* Content bên trái */}
                    <div className='w-full'>
                      {/* Promotion Header */}
                      <div className='flex items-start justify-between mb-3'>
                        <div className='flex-1'>
                          <h3 className='font-semibold text-gray-900 mb-1'>{promotion.title}</h3>
                          <p className='text-sm text-gray-600 line-clamp-2'>{promotion.description}</p>
                        </div>
                        {/* {isExpired(promotion.endDate) ? (
                          <Badge variant='destructive' className='flex items-center gap-1 ml-2 flex-shrink-0'>
                            <AlertCircle className='h-3 w-3' />
                            Hết hạn
                          </Badge>
                        ) : (
                          <Badge variant='default' className='flex items-center gap-1 bg-green-500 ml-2 flex-shrink-0'>
                            <CheckCircle className='h-3 w-3' />
                            Còn hạn
                          </Badge>
                        )} */}
                      </div>

                      {/* Discount Info */}
                      {/* <div className='flex items-center gap-2 mb-3'>
                        {getDiscountIcon(promotion.discountType)}
                        <span className='text-sm font-medium text-gray-600'>
                          {getDiscountTypeLabel(promotion.discountType)}
                        </span>
                        <span className='text-sm font-bold text-gray-900'>
                          {promotion.discountType === 'percentage'
                            ? `${promotion.discountValue}%`
                            : `${promotion.discountValue?.toLocaleString()}₫`}
                        </span>
                      </div> */}

                      {/* Time Info */}
                      {/* <div className='flex items-center gap-2 mb-3 text-xs text-gray-500'>
                        <Clock className='h-3 w-3' />
                        <span>Hết hạn: {formatDate(promotion.endDate)}</span>
                      </div> */}

                      {/* Usage Info */}
                      {/* <div className='flex items-center justify-between text-xs text-gray-500 mb-3'>
                        <div className='flex items-center gap-1'>
                          <TrendingUp className='h-3 w-3' />
                          <span>Đã dùng: {promotion.usedQuantity || 0}</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <Target className='h-3 w-3' />
                          <span>Tối đa: {promotion.maxQuantity || '∞'}</span>
                        </div>
                      </div> */}

                      {/* Claim Button */}
                      <Button
                        onClick={() => handleClaimPromotion(promotion.id)}
                        disabled={claiming === promotion.id || isExpired(promotion.endDate)}
                        className='w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600'
                        size='sm'
                      >
                        {claiming === promotion.id ? (
                          <>
                            <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
                            Đang nhận...
                          </>
                        ) : (
                          <>
                            <Gift className='h-4 w-4 mr-2' />
                            Nhận ngay
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mascot bên phải popup - chiếm 1/3 không gian, chỉ hiển thị trên desktop */}
            <div className='hidden lg:flex items-center justify-center flex-[1]'>
              <PromoMascot promotion={promotions[0] || {}} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Promotion Bubble Image - bên phải, phía trên chat */}
      <button
        onClick={() => setShowModal(true)}
        className={`fixed right-6 z-40 cursor-pointer hover:scale-105 transition-all duration-300 animate-bounce ${isChatOpen ? 'bottom-[620px]' : 'bottom-24'
          } ${className}`}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          outline: 'none',
          boxShadow: 'none'
        }}
      >
        <img
          src={givePromotionImg}
          alt='Nhận khuyến mãi'
          className='w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28'
          style={{
            backgroundColor: 'transparent',
            background: 'none',
            display: 'block',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            padding: 0,
            margin: 0,
            verticalAlign: 'middle'
          }}
        />
      </button>
    </>
  )
}

export default PromotionBubble
