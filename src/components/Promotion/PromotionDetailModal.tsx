import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import { Calendar, Gift, Users, Store, Globe, Edit, X } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { PromotionAdminDTO, PromotionType } from '../../types/promotionType'

interface PromotionDetailModalProps {
  promotion: PromotionAdminDTO | null
  isOpen: boolean
  onClose: () => void
  onEdit: (promotion: PromotionAdminDTO) => void
  loading?: boolean
}

const PromotionDetailModal: React.FC<PromotionDetailModalProps> = ({
  promotion,
  isOpen,
  onClose,
  onEdit,
  loading = false
}) => {
  if (!promotion) return null

  // Parse backend date format
  const parseBackendDate = (dateString: string): Date => {
    try {
      if (dateString.includes(' ') && dateString.includes('/')) {
        const [timePart, datePart] = dateString.split(' ')
        const [hours, minutes, seconds] = timePart.split(':')
        const [day, month, year] = datePart.split('/')
        return new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
          parseInt(seconds)
        )
      }
      return new Date(dateString)
    } catch (error) {
      console.error('Error parsing date:', dateString, error)
      return new Date()
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = parseBackendDate(dateString)
      return format(date, 'dd/MM/yyyy HH:mm', { locale: vi })
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return 'Invalid Date'
    }
  }

  const getTypeIcon = (type: PromotionType) => {
    switch (type) {
      case 'Global':
        return <Globe className='h-4 w-4' />
      case 'User':
        return <Users className='h-4 w-4' />
      case 'Product':
        return <Store className='h-4 w-4' />
      default:
        return <Gift className='h-4 w-4' />
    }
  }

  const getTypeColor = (type: PromotionType) => {
    switch (type) {
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

  const getDiscountTypeLabel = (discountType: string) => {
    switch (discountType) {
      case 'FreeShip':
        return 'Miễn phí vận chuyển'
      case 'FixedAmount':
        return 'Giảm giá cố định'
      case 'Percentage':
        return 'Giảm giá phần trăm'
      default:
        return discountType
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price)
  }

  const getDiscountDisplay = () => {
    const discountType = promotion.discountType as string
    if (discountType === 'FreeShip') {
      return 'Miễn phí vận chuyển'
    } else if (discountType === 'Percentage') {
      return `${promotion.discountValue}%`
    } else {
      return `₫${formatPrice(promotion.discountValue)}`
    }
  }

  const isExpired = () => {
    const now = new Date()
    const endDate = parseBackendDate(promotion.endDate)
    return endDate < now
  }

  const isActive = () => {
    const now = new Date()
    const startDate = parseBackendDate(promotion.startDate)
    const endDate = parseBackendDate(promotion.endDate)
    return promotion.isActive && now >= startDate && now <= endDate
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold text-gray-900 flex items-center gap-3'>
            <Gift className='h-6 w-6 text-blue-600' />
            Chi tiết mã giảm giá
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Header Info */}
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-3'>
                <h2 className='text-xl font-semibold text-gray-900'>{promotion.title}</h2>
                <Badge className={getTypeColor(promotion.type)}>
                  {getTypeIcon(promotion.type)}
                  <span className='ml-1'>{promotion.type}</span>
                </Badge>
                <Badge className={isActive() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {isActive() ? 'Đang hoạt động' : isExpired() ? 'Đã hết hạn' : 'Chưa có hiệu lực'}
                </Badge>
              </div>
              <p className='text-gray-600 text-sm'>{promotion.description}</p>
            </div>
          </div>

          {/* Basic Information */}
          <Card>
            <CardContent className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <div className='w-1 h-5 bg-blue-500 rounded'></div>
                Thông tin cơ bản
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-600'>Loại mã giảm giá</label>
                  <p className='text-gray-900'>{promotion.type}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-600'>Trạng thái</label>
                  <p className={`font-medium ${isActive() ? 'text-green-600' : 'text-red-600'}`}>
                    {isActive() ? 'Đang hoạt động' : isExpired() ? 'Đã hết hạn' : 'Chưa có hiệu lực'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discount Configuration */}
          <Card>
            <CardContent className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <div className='w-1 h-5 bg-blue-500 rounded'></div>
                Cấu hình giảm giá
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-600'>Loại giảm giá</label>
                  <p className='text-gray-900'>{getDiscountTypeLabel(promotion.discountType)}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-600'>Giá trị giảm giá</label>
                  <p className='text-gray-900 font-semibold'>{getDiscountDisplay()}</p>
                </div>
                {promotion.minValueDiscount && (
                  <div>
                    <label className='text-sm font-medium text-gray-600'>Giá trị đơn tối thiểu</label>
                    <p className='text-gray-900'>₫{formatPrice(promotion.minValueDiscount)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Time Configuration */}
          <Card>
            <CardContent className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <div className='w-1 h-5 bg-blue-500 rounded'></div>
                Thời gian áp dụng
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4 text-blue-500' />
                  <div>
                    <label className='text-sm font-medium text-gray-600'>Ngày bắt đầu</label>
                    <p className='text-gray-900'>{formatDate(promotion.startDate)}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4 text-blue-500' />
                  <div>
                    <label className='text-sm font-medium text-gray-600'>Ngày kết thúc</label>
                    <p className='text-gray-900'>{formatDate(promotion.endDate)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quantity Configuration */}
          <Card>
            <CardContent className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <div className='w-1 h-5 bg-blue-500 rounded'></div>
                Cấu hình số lượng
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {promotion.maxQuantity && (
                  <div>
                    <label className='text-sm font-medium text-gray-600'>Số lượng tối đa</label>
                    <p className='text-gray-900'>{promotion.maxQuantity}</p>
                  </div>
                )}
                <div>
                  <label className='text-sm font-medium text-gray-600'>Số lượt sử dụng tối đa mỗi user</label>
                  <p className='text-gray-900'>{promotion.maxPerUser}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Configuration (if User type) */}
          {promotion.type === 'User' && promotion.promotionUsers && promotion.promotionUsers.length > 0 && (
            <Card>
              <CardContent className='p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <div className='w-1 h-5 bg-blue-500 rounded'></div>
                  Người dùng được áp dụng
                </h3>
                <div className='space-y-2'>
                  <p className='text-sm text-gray-600 mb-3'>
                    Có {promotion.promotionUsers.length} người dùng được áp dụng mã giảm giá này
                  </p>
                  <div className='max-h-32 overflow-y-auto space-y-1'>
                    {promotion.promotionUsers.map((user, index) => (
                      <div key={index} className='flex items-center gap-2 p-2 bg-gray-50 rounded'>
                        <Users className='h-4 w-4 text-gray-500' />
                        <span className='text-sm text-gray-700'>{user.userID}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className='flex items-center justify-end space-x-4 pt-4 border-t border-gray-200'>
            <Button
              variant='outline'
              onClick={onClose}
              disabled={loading}
              className='border-gray-300 text-gray-700 hover:bg-gray-50'
            >
              <X className='h-4 w-4 mr-2' />
              Đóng
            </Button>
            <Button
              onClick={() => onEdit(promotion)}
              disabled={loading}
              className='bg-blue-600 hover:bg-blue-700 text-white'
            >
              <Edit className='h-4 w-4 mr-2' />
              Chỉnh sửa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { PromotionDetailModal }
