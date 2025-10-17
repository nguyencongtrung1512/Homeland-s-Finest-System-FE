import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { Gift, Percent, DollarSign, Users, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
// Define the actual API response structure
interface UserPromotionResponse {
  promotionUserID: string
  promotionID: string
  title: string
  description: string
  discountType: string
  discountValue: number
  startDate: string
  endDate: string
  quantity: number
  maxPerUser: number
  isActive: boolean
  isExpired: boolean
  daysRemaining: number
}

interface PromotionsContentProps {
  promotions: UserPromotionResponse[]
  loading: boolean
  onRefresh: () => void
}

const PromotionsContent: React.FC<PromotionsContentProps> = ({ promotions, loading, onRefresh }) => {
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
        return <Percent className='h-5 w-5 text-blue-500' />
      case 'fixed_amount':
        return <DollarSign className='h-5 w-5 text-green-500' />
      case 'freeship':
        return <Users className='h-5 w-5 text-purple-500' />
      default:
        return <Percent className='h-5 w-5 text-gray-500' />
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

  const getStatusBadge = (promotion: UserPromotionResponse) => {
    if (promotion.isExpired) {
      return (
        <Badge variant='destructive' className='flex items-center gap-1'>
          <AlertCircle className='h-3 w-3' />
          Hết hạn
        </Badge>
      )
    }
    if (promotion.isActive) {
      return (
        <Badge variant='default' className='flex items-center gap-1 bg-green-500'>
          <CheckCircle className='h-3 w-3' />
          Còn hạn ({promotion.daysRemaining} ngày)
        </Badge>
      )
    }
    return (
      <Badge variant='secondary' className='flex items-center gap-1'>
        <AlertCircle className='h-3 w-3' />
        Tạm dừng
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='flex items-center gap-2'>
          <RefreshCw className='h-5 w-5 animate-spin text-green-600' />
          <span className='text-gray-600'>Đang tải khuyến mãi...</span>
        </div>
      </div>
    )
  }

  if (promotions.length === 0) {
    return (
      <div className='text-center py-12'>
        <Gift className='h-16 w-16 text-gray-400 mx-auto mb-4' />
        <h3 className='text-lg font-medium text-gray-900 mb-2'>Chưa có khuyến mãi nào</h3>
        <p className='text-gray-500 mb-4'>Bạn chưa có khuyến mãi nào được áp dụng.</p>
        <Button onClick={onRefresh} variant='outline'>
          <RefreshCw className='h-4 w-4 mr-2' />
          Làm mới
        </Button>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Khuyến mãi của tôi</h2>
          <p className='text-gray-600'>Danh sách các khuyến mãi bạn đã nhận</p>
        </div>
        <Button onClick={onRefresh} variant='outline'>
          <RefreshCw className='h-4 w-4 mr-2' />
          Làm mới
        </Button>
      </div>

      {/* Promotions List */}
      <div className='grid gap-4'>
        {promotions.map((promotion) => (
          <Card key={promotion.promotionID} className='hover:shadow-md transition-shadow'>
            <CardHeader className='pb-3'>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <CardTitle className='text-lg font-semibold text-gray-900 mb-1'>{promotion.title}</CardTitle>
                  <p className='text-sm text-gray-600 line-clamp-2'>{promotion.description}</p>
                </div>
                <div className='ml-4'>{getStatusBadge(promotion)}</div>
              </div>
            </CardHeader>

            <CardContent className='pt-0'>
              {/* Discount Info */}
              <div className='flex items-center gap-3 mb-4'>
                <div className='flex items-center gap-2'>
                  {getDiscountIcon(promotion.discountType)}
                  <span className='text-sm font-medium text-gray-600'>
                    {getDiscountTypeLabel(promotion.discountType)}
                  </span>
                </div>
                <div className='text-lg font-bold text-green-600'>
                  {promotion.discountType === 'percentage'
                    ? `${promotion.discountValue}%`
                    : `${promotion.discountValue.toLocaleString()}₫`}
                </div>
              </div>

              {/* Time Info */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Clock className='h-4 w-4' />
                  <span>Bắt đầu: {formatDate(promotion.startDate)}</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Clock className='h-4 w-4' />
                  <span>Hết hạn: {formatDate(promotion.endDate)}</span>
                </div>
              </div>

              {/* User-specific Info */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Users className='h-4 w-4' />
                  <span>Số lượng đã nhận: {promotion.quantity}</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <CheckCircle className='h-4 w-4' />
                  <span>Tối đa/user: {promotion.maxPerUser}</span>
                </div>
              </div>

              {/* Days Remaining */}
              <div className='text-sm text-gray-600 mb-2'>
                <span className='font-medium'>Còn lại:</span> {promotion.daysRemaining} ngày
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default PromotionsContent
