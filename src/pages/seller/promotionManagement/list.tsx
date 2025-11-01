import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Badge } from '../../../components/ui/badge'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Users,
  Percent,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { useSellerPromotions } from '../../../hooks/usePromotions'
import { useAuth } from '../../../contexts/auth.context'
import {
  type PromotionDTO,
  type PromotionSellerDTO,
  type PromotionSellerRequest,
  type PromotionFilter,
  type PromotionSort,
  PROMOTION_TYPE_LABELS
} from '../../../types/promotionType'
import PromotionDetailModal from './promotionFrom'

const SellerPromotionList: React.FC = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'Global' | 'Product'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all')
  const [sortBy, setSortBy] = useState<'createdAt' | 'startDate' | 'endDate' | 'title' | 'discountValue'>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionSellerDTO | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view')

  const {
    promotions,
    loading,
    totalPages,
    totalItems,
    fetchPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotionStatus,
    getPromotionDetail
  } = useSellerPromotions()

  // Lấy seller ID từ auth context
  const sellerId = user?.userId

  const loadPromotions = useCallback(async () => {
    if (!sellerId) {
      console.error('Seller ID not found in auth context')
      return
    }
    const filters: PromotionFilter = {
      type: filterType === 'all' ? undefined : filterType,
      isActive: filterStatus === 'all' ? undefined : filterStatus === 'active'
    }

    const sort: PromotionSort = {
      field: sortBy,
      direction: sortDirection
    }

    console.log('🔍 Final filters:', filters)
    console.log('🔍 Final sort:', sort)

    try {
      const result = await fetchPromotions(sellerId, currentPage, pageSize, filters, sort)
      console.log('✅ Promotions loaded successfully:', result)
    } catch (error) {
      console.error('❌ Error loading promotions:', error)
    }
  }, [fetchPromotions, sellerId, currentPage, pageSize, filterType, filterStatus, sortBy, sortDirection])

  useEffect(() => {
    if (sellerId) {
      loadPromotions()
    }
  }, [loadPromotions, sellerId])

  // Debug: Log state changes
  useEffect(() => {
    console.log(
      '🔍 Component: State changed - promotions:',
      promotions.length,
      'loading:',
      loading,
      'totalItems:',
      totalItems
    )
  }, [promotions, loading, totalItems])

  // Hiển thị loading hoặc error nếu không có seller ID
  if (!sellerId) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-center py-8'>
          <div className='text-center'>
            <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>Không tìm thấy thông tin người dùng</h3>
            <p className='text-gray-600'>Vui lòng đăng nhập lại để tiếp tục</p>
          </div>
        </div>
      </div>
    )
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadPromotions()
  }

  const handleFilterChange = () => {
    setCurrentPage(1)
    loadPromotions()
  }

  const handleDeletePromotion = async (promotionId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa promotion này?')) {
      try {
        await deletePromotion(promotionId)
        console.log('Xóa promotion thành công')
        loadPromotions()
      } catch {
        console.error('Có lỗi xảy ra khi xóa promotion')
      }
    }
  }

  const handleToggleStatus = async (promotionId: string) => {
    try {
      await togglePromotionStatus(promotionId)
      console.log('Cập nhật trạng thái promotion thành công')
      loadPromotions()
    } catch {
      console.error('Có lỗi xảy ra khi cập nhật trạng thái')
    }
  }

  const handleViewDetail = async (promotionId: string) => {
    try {
      const promotionDetail = await getPromotionDetail(promotionId)
      if (promotionDetail) {
        setSelectedPromotion(promotionDetail)
        setModalMode('view')
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error('Có lỗi xảy ra khi lấy chi tiết promotion:', error)
    }
  }

  const handleEditPromotion = async (promotionId: string) => {
    try {
      const promotionDetail = await getPromotionDetail(promotionId)
      if (promotionDetail) {
        setSelectedPromotion(promotionDetail)
        setModalMode('edit')
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error('Có lỗi xảy ra khi lấy chi tiết promotion:', error)
    }
  }

  const handleCreatePromotion = () => {
    setSelectedPromotion(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedPromotion(null)
    setModalMode('view')
  }

  const handleSubmitPromotion = async (data: PromotionSellerRequest) => {
    try {
      if (modalMode === 'create') {
        await createPromotion(data)
        console.log('Tạo promotion thành công')
      } else if (modalMode === 'edit' && selectedPromotion) {
        await updatePromotion(selectedPromotion.id, data)
        console.log('Cập nhật promotion thành công')
      }
      await loadPromotions()
    } catch (error) {
      console.error('Có lỗi xảy ra khi xử lý promotion:', error)
      throw error // Re-throw để form có thể handle error
    }
  }

  const formatDate = (dateString: string) => {
    try {
      if (dateString.includes(' ') && dateString.includes('/')) {
        // Backend format: "HH:mm:ss dd/MM/yyyy"
        const [timePart, datePart] = dateString.split(' ')
        const [hours, minutes, seconds] = timePart.split(':')
        const [day, month, year] = datePart.split('/')
        const date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
          parseInt(seconds)
        )
        return date.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } else {
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    } catch {
      return 'Invalid Date'
    }
  }

  const isExpired = (endDate: string) => {
    try {
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
      return date < new Date()
    } catch {
      return false
    }
  }

  const getStatusBadge = (promotion: PromotionDTO) => {
    if (isExpired(promotion.endDate)) {
      return (
        <Badge variant='destructive' className='flex items-center gap-1'>
          <XCircle className='h-3 w-3' />
          Hết hạn
        </Badge>
      )
    }
    if (promotion.isActive) {
      return (
        <Badge variant='default' className='flex items-center gap-1 bg-green-500'>
          <CheckCircle className='h-3 w-3' />
          Hoạt động
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

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Quản lý Promotion</h1>
          <p className='text-gray-600 mt-1'>Quản lý các Mã khuyến mãi  của cửa hàng</p>
        </div>
        <Button className='bg-blue-500 hover:bg-blue-600 text-white' onClick={handleCreatePromotion}>
          <Plus className='h-4 w-4 mr-2' />
          Tạo Promotion Mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Tổng Promotion</p>
                <p className='text-2xl font-bold text-gray-900'>{totalItems}</p>
              </div>
              <div className='h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center'>
                <Calendar className='h-4 w-4 text-blue-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Đang Hoạt động</p>
                <p className='text-2xl font-bold text-green-600'>
                  {promotions.filter((p) => p.isActive && !isExpired(p.endDate)).length}
                </p>
              </div>
              <div className='h-8 w-8 bg-green-100 rounded-full flex items-center justify-center'>
                <CheckCircle className='h-4 w-4 text-green-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Hết Hạn</p>
                <p className='text-2xl font-bold text-red-600'>
                  {promotions.filter((p) => isExpired(p.endDate)).length}
                </p>
              </div>
              <div className='h-8 w-8 bg-red-100 rounded-full flex items-center justify-center'>
                <XCircle className='h-4 w-4 text-red-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Tạm Dừng</p>
                <p className='text-2xl font-bold text-yellow-600'>
                  {promotions.filter((p) => !p.isActive && !isExpired(p.endDate)).length}
                </p>
              </div>
              <div className='h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center'>
                <AlertCircle className='h-4 w-4 text-yellow-600' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='p-4'>
          <div className='flex flex-col lg:flex-row gap-4'>
            {/* Search */}
            <form onSubmit={handleSearch} className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  placeholder='Tìm kiếm theo tiêu đề hoặc mô tả...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </form>

            {/* Type Filter */}
            <div className='flex flex-col gap-2'>
              <Label className='text-sm font-medium'>Loại</Label>
              <Select
                value={filterType}
                onValueChange={(value) => {
                  setFilterType(value as 'all' | 'Global' | 'Product')
                  handleFilterChange()
                }}
              >
                <SelectTrigger className='w-40'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả</SelectItem>
                  <SelectItem value='Global'>Toàn hệ thống</SelectItem>
                  <SelectItem value='Product'>Sản phẩm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className='flex flex-col gap-2'>
              <Label className='text-sm font-medium'>Trạng thái</Label>
              <Select
                value={filterStatus}
                onValueChange={(value) => {
                  setFilterStatus(value as 'all' | 'active' | 'inactive' | 'expired')
                  handleFilterChange()
                }}
              >
                <SelectTrigger className='w-40'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả</SelectItem>
                  <SelectItem value='active'>Hoạt động</SelectItem>
                  <SelectItem value='inactive'>Tạm dừng</SelectItem>
                  <SelectItem value='expired'>Hết hạn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className='flex flex-col gap-2'>
              <Label className='text-sm font-medium'>Sắp xếp</Label>
              <Select
                value={`${sortBy}-${sortDirection}`}
                onValueChange={(value) => {
                  const [field, direction] = value.split('-')
                  setSortBy(field as 'createdAt' | 'startDate' | 'endDate' | 'title' | 'discountValue')
                  setSortDirection(direction as 'asc' | 'desc')
                  handleFilterChange()
                }}
              >
                <SelectTrigger className='w-48'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='createdAt-desc'>Mới nhất</SelectItem>
                  <SelectItem value='createdAt-asc'>Cũ nhất</SelectItem>
                  <SelectItem value='title-asc'>Tên A-Z</SelectItem>
                  <SelectItem value='title-desc'>Tên Z-A</SelectItem>
                  <SelectItem value='startDate-desc'>Ngày bắt đầu</SelectItem>
                  <SelectItem value='endDate-desc'>Ngày kết thúc</SelectItem>
                  <SelectItem value='discountValue-desc'>Giá trị giảm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promotions Table */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            Danh sách Promotion ({totalItems})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
              <span className='ml-2 text-gray-600'>Đang tải...</span>
            </div>
          ) : promotions.length === 0 ? (
            <div className='text-center py-8'>
              <Calendar className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>Chưa có promotion nào</h3>
              <p className='text-gray-600 mb-4'>Tạo promotion đầu tiên để bắt đầu</p>
              <Button className='bg-blue-500 hover:bg-blue-600 text-white' onClick={handleCreatePromotion}>
                <Plus className='h-4 w-4 mr-2' />
                Tạo Promotion Mới
              </Button>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b'>
                    <th className='text-left py-3 px-4 font-medium text-gray-900'>Promotion</th>
                    <th className='text-left py-3 px-4 font-medium text-gray-900'>Loại</th>
                    <th className='text-left py-3 px-4 font-medium text-gray-900'>Giảm giá</th>
                    <th className='text-left py-3 px-4 font-medium text-gray-900'>Thời gian</th>
                    <th className='text-left py-3 px-4 font-medium text-gray-900'>Trạng thái</th>
                    <th className='text-left py-3 px-4 font-medium text-gray-900'>Sử dụng</th>
                    <th className='text-right py-3 px-4 font-medium text-gray-900'>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.map((promotion) => (
                    <tr key={promotion.id} className='border-b hover:bg-gray-50'>
                      <td className='py-4 px-4'>
                        <div>
                          <h3 className='font-medium text-gray-900'>{promotion.title}</h3>
                          <p className='text-sm text-gray-600 mt-1 line-clamp-2'>{promotion.description}</p>
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <Badge variant='outline'>{PROMOTION_TYPE_LABELS[promotion.type]}</Badge>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='flex items-center gap-2'>
                          {getDiscountIcon(promotion.discountType)}
                          <span className='font-medium'>
                            {promotion.discountType === 'percentage'
                              ? `${promotion.discountValue}%`
                              : `${promotion.discountValue.toLocaleString()}₫`}
                          </span>
                        </div>
                        {promotion.minValueDiscount && (
                          <p className='text-xs text-gray-500 mt-1'>
                            Tối thiểu: {promotion.minValueDiscount.toLocaleString()}₫
                          </p>
                        )}
                      </td>
                      <td className='py-4 px-4'>
                        <div className='text-sm'>
                          <div className='flex items-center gap-1 text-gray-600'>
                            <Clock className='h-3 w-3' />
                            <span>Từ: {formatDate(promotion.startDate)}</span>
                          </div>
                          <div className='flex items-center gap-1 text-gray-600 mt-1'>
                            <Clock className='h-3 w-3' />
                            <span>Đến: {formatDate(promotion.endDate)}</span>
                          </div>
                        </div>
                      </td>
                      <td className='py-4 px-4'>{getStatusBadge(promotion)}</td>
                      <td className='py-4 px-4'>
                        <div className='text-sm'>
                          <p className='text-gray-900'>
                            {promotion.usedQuantity || 0} / {promotion.maxQuantity || '∞'}
                          </p>
                          <p className='text-gray-500'>{promotion.maxPerUser} lần/user</p>
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='flex items-center justify-end gap-2'>
                          <Button variant='outline' size='sm' onClick={() => handleViewDetail(promotion.id)}>
                            <Eye className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleEditPromotion(promotion.id)}
                          >
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button variant='outline' size='sm' onClick={() => handleToggleStatus(promotion.id)}>
                            {promotion.isActive ? <XCircle className='h-4 w-4' /> : <CheckCircle className='h-4 w-4' />}
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between mt-6'>
              <p className='text-sm text-gray-600'>
                Hiển thị {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} của{' '}
                {totalItems} kết quả
              </p>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>
                <span className='text-sm text-gray-600'>
                  Trang {currentPage} / {totalPages}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unified Promotion Modal */}
      <PromotionDetailModal
        promotion={selectedPromotion}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        onSubmit={handleSubmitPromotion}
        loading={loading}
      />
    </div>
  )
}

export default SellerPromotionList
