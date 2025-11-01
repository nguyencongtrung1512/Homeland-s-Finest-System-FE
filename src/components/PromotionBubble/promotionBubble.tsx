import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Gift, X, Percent, DollarSign, Users, Clock, CheckCircle, AlertCircle, Target, TrendingUp } from 'lucide-react'
import { useAuth } from '../../contexts/auth.context'
import { promotionApi } from '../../apis/promotion.api'
import { type PromotionDTO } from '../../types/promotionType'
import { toast } from 'react-toastify'

interface PromotionBubbleProps {
  className?: string
}

const PromotionBubble: React.FC<PromotionBubbleProps> = ({ className = '' }) => {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [promotions, setPromotions] = useState<PromotionDTO[]>([])
  const [claiming, setClaiming] = useState<string | null>(null)
  const [hasCheckedPromotions, setHasCheckedPromotions] = useState(false)

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

      // Close bubble if no more promotions
      if (promotions.length <= 1) {
        setIsOpen(false)
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

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A'

      let date: Date
      if (dateString.includes(' ') && dateString.includes('/')) {
        // Backend format: "HH:mm:ss dd/MM/yyyy"
        const [timePart, datePart] = dateString.split(' ')
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
        // ISO format
        date = new Date(dateString)
      }

      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }

      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return 'Invalid Date'
    }
  }

  const getDiscountIcon = (discountType: string) => {
    switch (discountType) {
      case 'percentage':
        return <Percent className='h-4 w-4 text-blue-500' />
      case 'fixed_amount':
        return <DollarSign className='h-4 w-4 text-green-500' />
      case 'freeship':
        return <Users className='h-4 w-4 text-purple-500' />
      default:
        return <Percent className='h-4 w-4 text-gray-500' />
    }
  }

  const getDiscountTypeLabel = (discountType: string) => {
    switch (discountType) {
      case 'percentage':
        return 'Phần trăm'
      case 'fixed_amount':
        return 'Số tiền cố định'
      case 'freeship':
        return 'Miễn phí vận chuyển'
      default:
        return 'Không xác định'
    }
  }

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

  // Don't show if no user or no promotions
  if (!user || promotions.length === 0) {
    return null
  }

  return (
    <>
      {/* Promotion Bubble Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 left-6 z-50 h-16 w-16 rounded-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 shadow-lg animate-pulse ${className}`}
          size='icon'
        >
          <div className='relative'>
            <Gift className='h-7 w-7 text-white' />
            <Badge
              variant='destructive'
              className='absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold'
            >
              {promotions.length}
            </Badge>
          </div>
        </Button>
      )}

      {/* Promotion Window */}
      {isOpen && (
        <div className='fixed bottom-6 left-6 w-96 h-[500px] flex flex-col z-50'>
          <Card className='h-full flex flex-col shadow-2xl border-0'>
            {/* Header */}
            <CardHeader className='bg-gradient-to-r from-pink-500 to-red-500 text-white px-5 py-3 rounded-t-xl'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Gift className='h-5 w-5' />
                  <CardTitle className='text-white text-base font-semibold'>
                    Promotion của bạn ({promotions.length})
                  </CardTitle>
                </div>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6 text-white hover:bg-pink-600'
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            </CardHeader>

            {/* Promotions List */}
            <CardContent className='flex-1 px-5 py-3 overflow-y-auto bg-white/95'>
              <div className='flex flex-col gap-4'>
                {promotions.map((promotion) => (
                  <div key={promotion.id} className='border rounded-lg p-4 bg-white shadow-sm'>
                    {/* Promotion Header */}
                    <div className='flex items-start justify-between mb-3'>
                      <div className='flex-1'>
                        <h3 className='font-semibold text-gray-900 mb-1'>{promotion.title}</h3>
                        <p className='text-sm text-gray-600 line-clamp-2'>{promotion.description}</p>
                      </div>
                      {isExpired(promotion.endDate) ? (
                        <Badge variant='destructive' className='flex items-center gap-1'>
                          <AlertCircle className='h-3 w-3' />
                          Hết hạn
                        </Badge>
                      ) : (
                        <Badge variant='default' className='flex items-center gap-1 bg-green-500'>
                          <CheckCircle className='h-3 w-3' />
                          Còn hạn
                        </Badge>
                      )}
                    </div>

                    {/* Discount Info */}
                    <div className='flex items-center gap-2 mb-3'>
                      {getDiscountIcon(promotion.discountType)}
                      <span className='text-sm font-medium text-gray-600'>
                        {getDiscountTypeLabel(promotion.discountType)}
                      </span>
                      <span className='text-sm font-bold text-gray-900'>
                        {promotion.discountType === 'percentage'
                          ? `${promotion.discountValue}%`
                          : `${promotion.discountValue?.toLocaleString()}₫`}
                      </span>
                    </div>

                    {/* Time Info */}
                    <div className='flex items-center gap-2 mb-3 text-xs text-gray-500'>
                      <Clock className='h-3 w-3' />
                      <span>Hết hạn: {formatDate(promotion.endDate)}</span>
                    </div>

                    {/* Usage Info */}
                    <div className='flex items-center justify-between text-xs text-gray-500 mb-3'>
                      <div className='flex items-center gap-1'>
                        <TrendingUp className='h-3 w-3' />
                        <span>Đã dùng: {promotion.usedQuantity || 0}</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Target className='h-3 w-3' />
                        <span>Tối đa: {promotion.maxQuantity || '∞'}</span>
                      </div>
                    </div>

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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

export default PromotionBubble
