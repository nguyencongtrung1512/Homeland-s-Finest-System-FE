// Admin Promotion Management - Detail Page
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Gift,
  Users,
  Store,
  Globe,
  Clock,
  BarChart3,
  Activity
} from 'lucide-react'
import { useAdminPromotions } from '../../../hooks/usePromotions'
import { PromotionForm } from '../../../components/Promotion'
import type { PromotionType, PromotionDTO } from '../../../types/promotionType'
import { toast } from 'react-toastify'

const AdminPromotionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [promotion, setPromotion] = useState<PromotionDTO | null>(null)
  const [loading, setLoading] = useState(true)

  const {
    getPromotionById,
    updatePromotion,
    deletePromotion,
    togglePromotionStatus
  } = useAdminPromotions()

  useEffect(() => {
    if (id) {
      loadPromotionDetail()
    }
  }, [id])

  const loadPromotionDetail = async () => {
    try {
      setLoading(true)
      const data = await getPromotionById(id!)
      setPromotion(data)
    } catch (error) {
      toast.error('Không thể tải thông tin Mã khuyến mãi ')
      navigate('/admin/promotions')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePromotion = async (data: any) => {
    try {
      await updatePromotion(id!, data)
      setIsEditModalOpen(false)
      await loadPromotionDetail() // Reload data
      toast.success('Cập nhật Mã khuyến mãi  thành công')
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật Mã khuyến mãi ')
    }
  }

  const handleDeletePromotion = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa Mã khuyến mãi  này?')) {
      try {
        await deletePromotion(id!)
        toast.success('Xóa Mã khuyến mãi  thành công')
        navigate('/admin/promotions')
      } catch (error) {
        toast.error('Có lỗi xảy ra khi xóa Mã khuyến mãi ')
      }
    }
  }

  const handleToggleStatus = async () => {
    try {
      await togglePromotionStatus(id!)
      await loadPromotionDetail() // Reload data
      toast.success('Cập nhật trạng thái thành công')
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái')
    }
  }

  const getTypeIcon = (type: PromotionType) => {
    switch (type) {
      case 'Global':
        return <Globe className='h-5 w-5' />
      case 'User':
        return <Users className='h-5 w-5' />
      case 'Product':
        return <Store className='h-5 w-5' />
      default:
        return <Gift className='h-5 w-5' />
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

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = () => {
    if (!promotion?.endDate) return false
    return new Date(promotion.endDate) < new Date()
  }

  const isExpiringSoon = () => {
    if (!promotion?.endDate) return false
    const endDate = new Date(promotion.endDate)
    const now = new Date()
    const diffDays = (endDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
    return diffDays <= 7 && diffDays > 0
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (!promotion) {
    return (
      <div className='text-center py-12'>
        <Gift className='h-12 w-12 mx-auto text-gray-400 mb-4' />
        <h3 className='text-lg font-medium text-gray-900 mb-2'>Không tìm thấy Mã khuyến mãi </h3>
        <Button onClick={() => navigate('/admin/promotions')}>
          <ArrowLeft className='h-4 w-4 mr-2' />
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            onClick={() => navigate('/admin/promotions')}
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Quay lại
          </Button>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>{promotion.title}</h1>
            <p className='text-gray-600 mt-1'>Chi tiết Mã khuyến mãi </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit className='h-4 w-4 mr-2' />
            Chỉnh sửa
          </Button>
          <Button
            variant='outline'
            onClick={handleToggleStatus}
            className={promotion.isActive ? 'text-red-600' : 'text-green-600'}
          >
            {promotion.isActive ? 'Tắt' : 'Bật'}
          </Button>
          <Button
            variant='outline'
            onClick={handleDeletePromotion}
            className='text-red-600 hover:text-red-700'
          >
            <Trash2 className='h-4 w-4 mr-2' />
            Xóa
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {isExpired() && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-center'>
            <Clock className='h-5 w-5 text-red-600 mr-2' />
            <span className='text-red-800 font-medium'>Mã khuyến mãi  đã hết hạn</span>
          </div>
        </div>
      )}

      {isExpiringSoon() && !isExpired() && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <div className='flex items-center'>
            <Clock className='h-5 w-5 text-yellow-600 mr-2' />
            <span className='text-yellow-800 font-medium'>Mã khuyến mãi  sắp hết hạn</span>
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Info */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Gift className='h-5 w-5' />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center gap-3'>
                <Badge className={getTypeColor(promotion.type)}>
                  {getTypeIcon(promotion.type)}
                  <span className='ml-1'>{promotion.type}</span>
                </Badge>
                <Badge className={getStatusColor(promotion.isActive)}>
                  {promotion.isActive ? 'Hoạt động' : 'Không hoạt động'}
                </Badge>
              </div>

              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>{promotion.title}</h3>
                <p className='text-gray-600'>{promotion.description}</p>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-500'>Giá trị giảm</label>
                  <p className='text-lg font-semibold text-green-600'>
                    {promotion.discountType === 'percentage'
                      ? `${promotion.discountValue}%`
                      : `₫${formatPrice(promotion.discountValue)}`
                    }
                  </p>
                </div>

                {promotion.minValueDiscount && (
                  <div>
                    <label className='text-sm font-medium text-gray-500'>Đơn tối thiểu</label>
                    <p className='text-lg font-semibold text-gray-900'>
                      ₫{formatPrice(promotion.minValueDiscount)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Time Info */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='h-5 w-5' />
                Thời gian áp dụng
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-500'>Ngày bắt đầu</label>
                  <p className='text-lg font-semibold text-gray-900'>{formatDate(promotion.startDate)}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500'>Ngày kết thúc</label>
                  <p className='text-lg font-semibold text-gray-900'>{formatDate(promotion.endDate)}</p>
                </div>
              </div>

              <div className='bg-gray-50 rounded-lg p-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-500'>Thời gian còn lại</span>
                  <span className='text-sm font-semibold text-gray-900'>
                    {isExpired() ? 'Đã hết hạn' :
                      isExpiringSoon() ? 'Sắp hết hạn' : 'Còn hiệu lực'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Rules */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Activity className='h-5 w-5' />
                Điều kiện sử dụng
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-500'>Số lượng tối đa</label>
                  <p className='text-lg font-semibold text-gray-900'>
                    {promotion.maxQuantity || 'Không giới hạn'}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500'>Số lượng đã sử dụng</label>
                  <p className='text-lg font-semibold text-gray-900'>
                    {promotion.usedQuantity || 0}
                  </p>
                </div>
              </div>

              {promotion.maxPerUser && (
                <div>
                  <label className='text-sm font-medium text-gray-500'>Giới hạn mỗi người dùng</label>
                  <p className='text-lg font-semibold text-gray-900'>
                    {promotion.maxPerUser} lần
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BarChart3 className='h-5 w-5' />
                Thống kê nhanh
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='text-center'>
                <p className='text-3xl font-bold text-blue-600'>{promotion.usedQuantity || 0}</p>
                <p className='text-sm text-gray-500'>Lần sử dụng</p>
              </div>

              <div className='text-center'>
                <p className='text-3xl font-bold text-green-600'>
                  ₫{formatPrice((promotion.usedQuantity || 0) * promotion.discountValue)}
                </p>
                <p className='text-sm text-gray-500'>Tổng giá trị giảm</p>
              </div>

              <div className='text-center'>
                <p className='text-3xl font-bold text-purple-600'>
                  {promotion.maxQuantity ?
                    Math.round(((promotion.usedQuantity || 0) / promotion.maxQuantity) * 100) : 0}%
                </p>
                <p className='text-sm text-gray-500'>Tỷ lệ sử dụng</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Hành động</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Button
                className='w-full'
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit className='h-4 w-4 mr-2' />
                Chỉnh sửa
              </Button>

              <Button
                variant='outline'
                className='w-full'
                onClick={handleToggleStatus}
              >
                {promotion.isActive ? 'Tắt Mã khuyến mãi ' : 'Bật Mã khuyến mãi '}
              </Button>

              <Button
                variant='outline'
                className='w-full text-red-600 hover:text-red-700'
                onClick={handleDeletePromotion}
              >
                <Trash2 className='h-4 w-4 mr-2' />
                Xóa Mã khuyến mãi
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <PromotionForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdatePromotion}
        title='Chỉnh sửa Mã khuyến mãi '
        mode='edit'
        initialData={promotion}
      />
    </div>
  )
}

export default AdminPromotionDetail
