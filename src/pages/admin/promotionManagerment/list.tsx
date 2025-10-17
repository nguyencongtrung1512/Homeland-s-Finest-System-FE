// Admin Promotion Management - List Page
import React, { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Gift,
  Users,
  Store,
  Globe,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { useAdminPromotions } from '../../../hooks/usePromotions'
import { PromotionForm } from '../../../components/Promotion'
import type { PromotionType, PromotionDTO, PromotionAdminRequest } from '../../../types/promotionType'
import { toast } from 'react-toastify'

const AdminPromotionList: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionDTO | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<PromotionType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'createdAt' | 'startDate' | 'endDate' | 'title' | 'discountValue'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const {
    promotions,
    loading,
    pagination,
    filters,
    fetchPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotionStatus,
    getPromotionDetail
  } = useAdminPromotions()

  // Load promotions on component mount
  useEffect(() => {
    fetchPromotions()
  }, [fetchPromotions])

  // Apply filters and search
  useEffect(() => {
    const newFilters = {
      ...filters,
      search: searchTerm,
      type: filterType !== 'all' ? filterType : undefined,
      status: filterStatus !== 'all' ? filterStatus : undefined
    }

    const newSort = {
      field: sortBy,
      direction: sortOrder
    }

    fetchPromotions(1, newFilters, newSort)
  }, [searchTerm, filterType, filterStatus, sortBy, sortOrder, fetchPromotions])

  const handleCreatePromotion = async (data: PromotionAdminRequest) => {
    try {
      await createPromotion(data)
      setIsCreateModalOpen(false)
      toast.success('Tạo mã giảm giá thành công')
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tạo mã giảm giá')
    }
  }

  const handleEditPromotion = async (promotion: PromotionDTO) => {
    try {
      console.log('🔍 List: Starting edit promotion:', promotion.id)

      // Fetch promotion detail with promotionUsers
      const promotionDetail = await getPromotionDetail(promotion.id)

      if (promotionDetail) {
        console.log('✅ List: Promotion detail fetched:', promotionDetail)
        setSelectedPromotion(promotionDetail)
        setIsEditModalOpen(true)
      } else {
        toast.error('Không thể lấy chi tiết promotion')
      }
    } catch (error) {
      console.error('❌ List: Error fetching promotion detail:', error)
      toast.error('Có lỗi xảy ra khi lấy chi tiết promotion')
    }
  }

  const handleUpdatePromotion = async (data: any) => {
    try {
      console.log('🔄 List: Updating promotion:', { selectedPromotion, data })

      await updatePromotion(selectedPromotion!.id, data as PromotionAdminRequest)
      setIsEditModalOpen(false)
      setSelectedPromotion(null)
      toast.success('Cập nhật mã giảm giá thành công')
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật mã giảm giá')
    }
  }

  const handleDeletePromotion = async (promotionId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) {
      try {
        await deletePromotion(promotionId)
        toast.success('Xóa mã giảm giá thành công')
      } catch (error) {
        toast.error('Có lỗi xảy ra khi xóa mã giảm giá')
      }
    }
  }

  const handleToggleStatus = async (promotionId: string) => {
    try {
      await togglePromotionStatus(promotionId)
      toast.success('Cập nhật trạng thái thành công')
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái')
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

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price)
  }

  const parseBackendDate = (dateString: string): Date => {
    try {
      // Backend trả về format: "HH:mm:ss dd/MM/yyyy" (ví dụ: "02:00:00 18/10/2025")
      if (dateString.includes(' ') && dateString.includes('/')) {
        const [timePart, datePart] = dateString.split(' ')
        const [hours, minutes, seconds] = timePart.split(':')
        const [day, month, year] = datePart.split('/')

        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds))
      } else {
        return new Date(dateString)
      }
    } catch (error) {
      console.error('❌ Error parsing backend date:', dateString, error)
      return new Date()
    }
  }

  const formatDate = (dateString: string) => {
    try {
      // Backend trả về format: "HH:mm:ss dd/MM/yyyy" (ví dụ: "02:00:00 18/10/2025")
      // Cần parse format này thành Date object

      // Kiểm tra nếu là format từ backend
      if (dateString.includes(' ') && dateString.includes('/')) {
        // Format: "02:00:00 18/10/2025"
        const [timePart, datePart] = dateString.split(' ')
        const [hours, minutes, seconds] = timePart.split(':')
        const [day, month, year] = datePart.split('/')

        // Tạo Date object
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds))



        return date.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } else {
        // Fallback cho ISO string hoặc format khác
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    } catch (error) {
      console.error('❌ Error parsing date:', dateString, error)
      return 'Invalid Date'
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Quản lý mã giảm giá</h1>
          <p className='text-gray-600 mt-1'>Quản lý và theo dõi các mã giảm giá trong hệ thống</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className='bg-blue-600 hover:bg-blue-700'>
          <Plus className='h-4 w-4 mr-2' />
          Tạo mã giảm giá
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-blue-100 rounded-lg'>
                <Gift className='h-6 w-6 text-blue-600' />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Tổng mã giảm giá</p>
                <p className='text-2xl font-bold text-gray-900'>{pagination?.totalItems || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-green-100 rounded-lg'>
                <TrendingUp className='h-6 w-6 text-green-600' />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Đang hoạt động</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {promotions?.filter(p => p.isActive).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-red-100 rounded-lg'>
                <TrendingDown className='h-6 w-6 text-red-600' />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Đã hết hạn</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {promotions?.filter(p => parseBackendDate(p.endDate) < new Date()).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-purple-100 rounded-lg'>
                <Clock className='h-6 w-6 text-purple-600' />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Sắp hết hạn</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {promotions?.filter(p => {
                    const endDate = parseBackendDate(p.endDate)
                    const now = new Date()
                    const diffDays = (endDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
                    return diffDays <= 7 && diffDays > 0
                  }).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='p-6'>
          <div className='flex flex-wrap gap-4'>
            <div className='flex-1 min-w-64'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  placeholder='Tìm kiếm mã giảm giá...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            <Select value={filterType} onValueChange={(value) => setFilterType(value as PromotionType | 'all')}>
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Loại mã giảm giá' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả loại</SelectItem>
                <SelectItem value='Global'>Toàn hệ thống</SelectItem>
                <SelectItem value='User'>Cá nhân</SelectItem>
                <SelectItem value='Product'>Sản phẩm</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                <SelectItem value='active'>Đang hoạt động</SelectItem>
                <SelectItem value='inactive'>Không hoạt động</SelectItem>
                <SelectItem value='expired'>Đã hết hạn</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'createdAt' | 'startDate' | 'endDate' | 'title' | 'discountValue')}>
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Sắp xếp theo' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='createdAt'>Ngày tạo</SelectItem>
                <SelectItem value='title'>Tên mã giảm giá</SelectItem>
                <SelectItem value='discountValue'>Giá trị giảm</SelectItem>
                <SelectItem value='endDate'>Ngày hết hạn</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant='outline'
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Promotions List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách mã giảm giá</CardTitle>
        </CardHeader>
        <CardContent>
          {promotions && promotions.length > 0 ? (
            <div className='space-y-4'>
              {promotions.map((promotion) => (
                <div key={promotion.id} className='border rounded-lg p-4 hover:bg-gray-50 transition-colors'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <h3 className='text-lg font-semibold text-gray-900'>{promotion.title}</h3>
                        <Badge className={getTypeColor(promotion.type)}>
                          {getTypeIcon(promotion.type)}
                          <span className='ml-1'>{promotion.type}</span>
                        </Badge>
                        <Badge className={getStatusColor(promotion.isActive)}>
                          {promotion.isActive ? 'Hoạt động' : 'Không hoạt động'}
                        </Badge>
                      </div>

                      <p className='text-gray-600 mb-3'>{promotion.description}</p>

                      <div className='flex items-center gap-6 text-sm text-gray-500'>
                        <div className='flex items-center gap-1'>
                          <Calendar className='h-4 w-4' />
                          <span>Từ {formatDate(promotion.startDate)}</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <Calendar className='h-4 w-4' />
                          <span>Đến {formatDate(promotion.endDate)}</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <Gift className='h-4 w-4' />
                          <span>
                            {promotion.discountType === 'percentage'
                              ? `${promotion.discountValue}%`
                              : `₫${formatPrice(promotion.discountValue)}`
                            }
                          </span>
                        </div>
                        {promotion.minValueDiscount && (
                          <div className='flex items-center gap-1'>
                            <TrendingUp className='h-4 w-4' />
                            <span>Tối thiểu ₫{formatPrice(promotion.minValueDiscount)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='flex items-center gap-2 ml-4'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleEditPromotion(promotion)}
                      >
                        <Edit className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleToggleStatus(promotion.id)}
                      >
                        {promotion.isActive ? 'Tắt' : 'Bật'}
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleDeletePromotion(promotion.id)}
                        className='text-red-600 hover:text-red-700'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-12'>
              <Gift className='h-12 w-12 mx-auto text-gray-400 mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>Không có mã giảm giá</h3>
              <p className='text-gray-500 mb-4'>Hãy tạo mã giảm giá đầu tiên của bạn</p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className='h-4 w-4 mr-2' />
                Tạo mã giảm giá
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Promotion Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <PromotionForm
              onSubmit={handleCreatePromotion}
              onCancel={() => setIsCreateModalOpen(false)}
              loading={loading}
              isEdit={false}
            />
          </div>
        </div>
      )}

      {/* Edit Promotion Modal */}
      {selectedPromotion && isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <PromotionForm
              initialData={selectedPromotion}
              onSubmit={handleUpdatePromotion}
              onCancel={() => {
                setIsEditModalOpen(false)
                setSelectedPromotion(null)
              }}
              loading={loading}
              isEdit={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPromotionList
