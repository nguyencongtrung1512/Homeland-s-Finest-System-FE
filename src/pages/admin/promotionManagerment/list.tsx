// Admin Promotion Management - List Page (Optimized)
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import {
  Plus,
  Search,
  Edit,
  Calendar,
  Gift,
  Users,
  Globe,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { useAdminPromotions } from '../../../hooks/usePromotions'
import { PromotionForm } from '../../../components/Promotion'
import type {
  PromotionType,
  PromotionDTO,
  PromotionAdminRequest,
  PromotionFormData
} from '../../../types/promotionType'
import { toast } from '../../../utils/toast'

const AdminPromotionList: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionDTO | null>(null)

  // Local filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<PromotionType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'createdAt' | 'startDate' | 'endDate' | 'title' | 'discountValue'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  const {
    promotions: allPromotions,
    loading,
    createPromotion,
    updatePromotion,
    getPromotionDetail,
    fetchPromotions
  } = useAdminPromotions()

  // Load all promotions once
  useEffect(() => {
    fetchPromotions(1, {}, { field: 'createdAt', direction: 'desc' })
  }, [])

  // Parse backend date
  const parseBackendDate = useCallback((dateString: string): Date => {
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
  }, [])

  // Client-side filtering and sorting
  const filteredAndSortedPromotions = useMemo(() => {
    if (!allPromotions) return []

    let filtered = [...allPromotions]

    // Filter out Product type promotions
    filtered = filtered.filter((promo) => promo.type !== 'Product')

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (promo) => promo.title.toLowerCase().includes(search) || promo.description.toLowerCase().includes(search)
      )
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((promo) => promo.type === filterType)
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      const now = new Date()
      filtered = filtered.filter((promo) => {
        const endDate = parseBackendDate(promo.endDate)
        const isExpired = endDate < now

        switch (filterStatus) {
          case 'active':
            return promo.isActive && !isExpired
          case 'inactive':
            return !promo.isActive
          case 'expired':
            return isExpired
          default:
            return true
        }
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'discountValue':
          aValue = a.discountValue
          bValue = b.discountValue
          break
        case 'startDate':
          aValue = parseBackendDate(a.startDate).getTime()
          bValue = parseBackendDate(b.startDate).getTime()
          break
        case 'endDate':
          aValue = parseBackendDate(a.endDate).getTime()
          bValue = parseBackendDate(b.endDate).getTime()
          break
        case 'createdAt':
        default:
          aValue = parseBackendDate(a.createdAt || a.startDate).getTime()
          bValue = parseBackendDate(b.createdAt || b.startDate).getTime()
          break
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [allPromotions, searchTerm, filterType, filterStatus, sortBy, sortOrder, parseBackendDate])

  // Calculate pagination
  const paginationData = useMemo(() => {
    const totalItems = filteredAndSortedPromotions.length
    const totalPages = Math.ceil(totalItems / pageSize) || 1
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedPromotions = filteredAndSortedPromotions.slice(startIndex, endIndex)

    return {
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      paginatedPromotions,
      currentPage,
      pageSize
    }
  }, [filteredAndSortedPromotions, currentPage, pageSize])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterType, filterStatus, sortBy, sortOrder])

  // Statistics calculations
  const stats = useMemo(() => {
    if (!allPromotions) {
      return {
        total: 0,
        active: 0,
        expired: 0,
        expiringSoon: 0
      }
    }

    // Filter out Product type promotions
    const filteredPromotions = allPromotions.filter((p) => p.type !== 'Product')

    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    return {
      total: filteredPromotions.length,
      active: filteredPromotions.filter((p) => p.isActive).length,
      expired: filteredPromotions.filter((p) => parseBackendDate(p.endDate) < now).length,
      expiringSoon: filteredPromotions.filter((p) => {
        const endDate = parseBackendDate(p.endDate)
        return endDate > now && endDate <= sevenDaysLater
      }).length
    }
  }, [allPromotions, parseBackendDate])

  const handleCreatePromotion = async (data: PromotionFormData) => {
    try {
      const adminRequest: PromotionAdminRequest = {
        ...data,
        discountValue: data.discountType === 'freeship' ? 0 : (data.discountValue ?? 0),
        maxPerUser: data.maxPerUser ?? 1,
        userIds: data.userIds || [],
        isPrivate: data.type === 'User' ? (data.isPrivate ?? true) : undefined
      }
      await createPromotion(adminRequest)
      setIsCreateModalOpen(false)
      toast.success('Tạo Mã khuyến mãi  thành công')
    } catch {
      toast.error('Có lỗi xảy ra khi tạo Mã khuyến mãi ')
    }
  }

  const handleEditPromotion = async (promotion: PromotionDTO) => {
    try {
      const promotionDetail = await getPromotionDetail(promotion.id)
      if (promotionDetail) {
        setSelectedPromotion(promotionDetail)
        setIsEditModalOpen(true)
      } else {
        toast.error('Không thể lấy chi tiết mã khuyến mãi')
      }
    } catch {
      toast.error('Có lỗi xảy ra khi lấy chi tiết promotion')
    }
  }

  const handleUpdatePromotion = async (data: PromotionFormData) => {
    try {
      const adminRequest: PromotionAdminRequest = {
        ...data,
        discountValue: data.discountType === 'freeship' ? 0 : (data.discountValue ?? 0),
        maxPerUser: data.maxPerUser ?? 1,
        userIds: data.userIds || [],
        isPrivate: data.type === 'User' ? (data.isPrivate ?? true) : undefined
      }
      await updatePromotion(selectedPromotion!.id, adminRequest)
      setIsEditModalOpen(false)
      setSelectedPromotion(null)
      toast.success('Cập nhật mã khuyến mãi thành công')
    } catch {
      toast.error('Có lỗi xảy ra khi cập nhật mã khuyến mãi ')
    }
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= paginationData.totalPages) {
      setCurrentPage(page)
    }
  }

  const getTypeIcon = (type: PromotionType) => {
    switch (type) {
      case 'Global':
        return <Globe className='h-4 w-4' />
      case 'User':
        return <Users className='h-4 w-4' />
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
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: PromotionType) => {
    switch (type) {
      case 'Global':
        return 'Hệ thống'
      case 'User':
        return 'Cá nhân'
      default:
        return type
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price)
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    try {
      if (dateString.includes(' ') && dateString.includes('/')) {
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
      }
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Error parsing date:', dateString, error)
      return 'Invalid Date'
    }
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const { totalPages, currentPage } = paginationData
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      if (currentPage <= 3) {
        end = maxVisible - 1
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - maxVisible + 2
      }

      if (start > 2) {
        pages.push('...')
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages - 1) {
        pages.push('...')
      }

      pages.push(totalPages)
    }

    return pages
  }

  if (loading && !allPromotions) {
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
          <h1 className='text-3xl font-bold text-gray-900'>Quản lý Mã khuyến mãi </h1>
          <p className='text-gray-600 mt-1'>Quản lý và theo dõi các Mã khuyến mãi trong hệ thống</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className='bg-blue-600 hover:bg-blue-700'>
          <Plus className='h-4 w-4 mr-2' />
          Tạo Mã khuyến mãi
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
                <p className='text-sm font-medium text-gray-600'>Tổng Mã khuyến mãi </p>
                <p className='text-2xl font-bold text-gray-900'>{stats.total}</p>
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
                <p className='text-2xl font-bold text-gray-900'>{stats.active}</p>
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
                <p className='text-2xl font-bold text-gray-900'>{stats.expired}</p>
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
                <p className='text-2xl font-bold text-gray-900'>{stats.expiringSoon}</p>
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
                  placeholder='Tìm kiếm Mã khuyến mãi ...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            <Select value={filterType} onValueChange={(value) => setFilterType(value as PromotionType | 'all')}>
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Loại Mã khuyến mãi ' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả loại</SelectItem>
                <SelectItem value='Global'>Hệ thống</SelectItem>
                <SelectItem value='User'>Cá nhân</SelectItem>
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

            <Select
              value={sortBy}
              onValueChange={(value) =>
                setSortBy(value as 'createdAt' | 'startDate' | 'endDate' | 'title' | 'discountValue')
              }
            >
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Sắp xếp theo' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='createdAt'>Ngày tạo</SelectItem>
                <SelectItem value='title'>Tên Mã khuyến mãi </SelectItem>
                <SelectItem value='discountValue'>Giá trị giảm</SelectItem>
                <SelectItem value='endDate'>Ngày hết hạn</SelectItem>
              </SelectContent>
            </Select>

            <Button variant='outline' onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
              {sortOrder === 'asc' ? <ArrowUp className='h-4 w-4' /> : <ArrowDown className='h-4 w-4' />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Promotions List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Mã khuyến mãi ({paginationData.totalItems} kết quả)</CardTitle>
        </CardHeader>
        <CardContent>
          {paginationData.paginatedPromotions && paginationData.paginatedPromotions.length > 0 ? (
            <div className='space-y-4'>
              {paginationData.paginatedPromotions.map((promotion) => (
                <div key={promotion.id} className='border rounded-lg p-4 hover:bg-gray-50 transition-colors'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <h3 className='text-lg font-semibold text-gray-900'>{promotion.title}</h3>
                        <Badge className={getTypeColor(promotion.type)}>
                          {getTypeIcon(promotion.type)}
                          <span className='ml-1'>{getTypeLabel(promotion.type)}</span>
                        </Badge>
                        <Badge className={getStatusColor(promotion.isActive)}>
                          {promotion.isActive ? 'Hoạt động' : 'Không hoạt động'}
                        </Badge>
                      </div>

                      <div className='flex items-center gap-3 '>
                        {promotion.type === 'User' && (
                          <span
                            className={promotion.isPrivate ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'}
                          >
                            {promotion.isPrivate ? 'Riêng tư' : 'Công khai'}
                          </span>
                        )}
                        <span className='text-gray-600'>- {promotion.description}</span>
                      </div>

                      {promotion.createdAt && (
                        <div className='flex items-center gap-1 text-sm text-gray-500 mb-3'>
                          <Clock className='h-4 w-4' />
                          <span>Ngày tạo: {formatDate(promotion.createdAt)}</span>
                        </div>
                      )}

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
                              : `₫${formatPrice(promotion.discountValue)}`}
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
                      <Button variant='outline' size='sm' onClick={() => handleEditPromotion(promotion)}>
                        <Edit className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-12'>
              <Gift className='h-12 w-12 mx-auto text-gray-400 mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>Không có Mã khuyến mãi </h3>
              <p className='text-gray-500 mb-4'>
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Không tìm thấy kết quả phù hợp'
                  : 'Hãy tạo Mã khuyến mãi  đầu tiên của bạn'}
              </p>
              {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className='h-4 w-4 mr-2' />
                  Tạo Mã khuyến mãi
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {paginationData.totalPages > 1 && (
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='text-sm text-gray-600'>
                Hiển thị {paginationData.startIndex + 1} -{' '}
                {Math.min(paginationData.endIndex, paginationData.totalItems)} trong tổng số {paginationData.totalItems}{' '}
                Mã khuyến mãi
              </div>
              <div className='flex items-center gap-2'>
                <Button variant='outline' size='sm' onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
                  <ChevronsLeft className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>

                <div className='flex items-center gap-1'>
                  {getPageNumbers().map((page, index) =>
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className='px-2'>
                        ...
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size='sm'
                        onClick={() => handlePageChange(page as number)}
                        className={currentPage === page ? 'bg-blue-600 text-white' : ''}
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === paginationData.totalPages}
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(paginationData.totalPages)}
                  disabled={currentPage === paginationData.totalPages}
                >
                  <ChevronsRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Promotion Modal */}
      {isCreateModalOpen && (
        <div
          className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCreateModalOpen(false)
            }
          }}
        >
          <div className='bg-white rounded-lg max-w-4xl w-full max-h-[90vh] h-[90vh] overflow-hidden shadow-xl flex flex-col'>
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
        <div
          className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsEditModalOpen(false)
              setSelectedPromotion(null)
            }
          }}
        >
          <div className='bg-white rounded-lg max-w-4xl w-full max-h-[90vh] h-[90vh] overflow-hidden shadow-xl flex flex-col'>
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
