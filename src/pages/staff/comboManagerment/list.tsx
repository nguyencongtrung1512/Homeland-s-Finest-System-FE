import { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar, Eye, Store, Search, RefreshCw, Package, User } from 'lucide-react'
import { getAllCombos } from '../../../apis/combo.api'
import { type ComboParams } from '../../../types/combo.type'
import { type Combo } from '../../../types/combo.type'
import { staffApi, type StaffInfo } from '../../../apis/staff.api'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import path from '../../../constants/path'
import { ShimmerBorder } from '../../../components/ui/shimmer'

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800'
      case 'Confirmed':
        return 'bg-purple-100 text-purple-800'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'Rejected':
        return 'bg-red-100 text-red-800'
      case 'Denied':
        return 'bg-red-100 text-red-800'
      case 'Draft':
        return 'bg-gray-100 text-gray-800'
      case 'Processing':
        return 'bg-orange-100 text-orange-800'
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'Đã duyệt'
      case 'Pending':
        return 'Chờ duyệt'
      case 'Rejected':
        return 'Từ chối'
      case 'Denied':
        return 'Bị từ chối'
      case 'Confirmed':
        return 'Đã xác nhận'
      case 'Draft':
        return 'Nháp'
      case 'Processing':
        return 'Cần xử lý'
      case 'Cancelled':
        return 'Đã hủy'
      default:
        return status
    }
  }

  return <Badge className={getStatusColor(status)}>{getStatusText(status)}</Badge>
}

function ComboListStaff() {
  const navigate = useNavigate()
  const [data, setData] = useState<Combo[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [staffMap, setStaffMap] = useState<Map<string, string>>(new Map())
  const itemsPerPage = 12

  // Fetch staff list
  const fetchStaffList = useCallback(async () => {
    try {
      const response = await staffApi.getAllStaff({
        pageSize: 0,
        pageNumber: 1
      })

      console.log('response staff', response)

      if (response && Array.isArray(response)) {
        // Create map from userId to full name
        const map = new Map<string, string>()
        response.forEach((staff: StaffInfo) => {
          const fullName = `${staff.firstName} ${staff.lastName}`.trim()
          map.set(staff.userId, fullName)
        })
        setStaffMap(map)
      }
    } catch (error) {
      console.error('Error fetching staff list:', error)
      // Don't show error toast for staff list, just log it
    }
  }, [])

  // Fetch data
  const fetchCombos = useCallback(async () => {
    try {
      setLoading(true)
      const params: ComboParams = {
        pageSize: 0, // Get all data
        pageNumber: 1
      }

      const combos = await getAllCombos(params)
      setData(Array.isArray(combos) ? combos : [])
    } catch (error) {
      console.error('Error fetching combos:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách combo')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCombos()
    fetchStaffList()
  }, [fetchCombos, fetchStaffList])

  // Filter data based on frontend filters
  const filteredData = useMemo(() => {
    let filtered = data

    // Hide Draft status combos from UI
    filtered = filtered.filter((combo) => combo.status !== 'Draft')

    // Search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase()
      filtered = filtered.filter(
        (combo) =>
          combo.name.toLowerCase().includes(searchLower) ||
          combo.storeName?.toLowerCase().includes(searchLower) ||
          combo.provinceName?.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((combo) => combo.status === statusFilter)
    }

    return filtered
  }, [data, searchText, statusFilter])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredData.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return '-'
    }

    // Xử lý định dạng "HH:MM:SS DD/MM/YYYY" từ API
    const timeDateMatch = dateString.match(/(\d{2}:\d{2}:\d{2})\s+(\d{2}\/\d{2}\/\d{4})/)

    if (timeDateMatch) {
      const [, time, date] = timeDateMatch
      const [day, month, year] = date.split('/')
      const [hours, minutes, seconds] = time.split(':')

      const dateObj = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      )

      if (isNaN(dateObj.getTime())) {
        return '-'
      }

      return dateObj.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return '-'
    }

    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const renderComboCard = (combo: Combo) => {
    return (
      <Card
        key={combo.id}
        className='h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-300'
      >
        <CardContent className='p-4'>
          {/* Header with Avatar and Combo Info */}
          <div className='flex items-start gap-4 mb-4'>
            <div className='relative'>
              <Avatar className='h-14 w-14'>
                {combo.thumbnailUrl ? (
                  <img
                    src={combo.thumbnailUrl}
                    alt={combo.name}
                    className='w-full h-full object-cover'
                    onError={(e) => {
                      const target = e.currentTarget
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback) {
                        target.style.display = 'none'
                        fallback.style.display = 'flex'
                      }
                    }}
                  />
                ) : null}
                <AvatarFallback className='text-white font-semibold bg-gradient-to-br from-blue-500 to-blue-600'>
                  {combo.name
                    .split(' ')
                    .map((word) => word.charAt(0))
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className='absolute -bottom-1 -right-1 bg-white rounded-full p-1 border-2 border-gray-200'>
                <Package size={14} className='text-blue-600' />
              </div>
            </div>
            <div className='flex-1 min-w-0'>
              <h3 className='text-lg font-semibold text-gray-900 truncate mb-1'>{combo.name}</h3>
              <StatusBadge status={combo.status} />
            </div>
          </div>

          {/* Combo Details */}
          <div className='space-y-3 mb-6'>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Store size={14} className='text-gray-400' />
              <span className='truncate'>Cửa hàng: {combo.storeName || '-'}</span>
            </div>

            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Calendar size={14} className='text-gray-400' />
              <span>Ngày tạo: {formatDate(combo.createdAt)}</span>
            </div>

            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Package size={14} className='text-gray-400' />
              <span>{combo.comboItems?.length || 0} sản phẩm</span>
            </div>

            {combo.assignedToId && (
              <div className='flex items-center gap-2 text-sm text-gray-600'>
                <User size={14} className='text-gray-400' />
                <span>
                  Nhân viên xử lý:{' '}
                  <span className='font-medium'>{staffMap.get(combo.assignedToId) || 'Chưa xác định'}</span>
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={() => navigate(path.detailComboStaff.replace(':id', combo.id))}
              className='flex-1 flex items-center justify-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300'
            >
              <Eye size={16} />
              Xem chi tiết
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-lg'>Đang tải...</div>
      </div>
    )
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <Card className='bg-gradient-to-br from-cyan-500 to-cyan-600 border-0 shadow-lg'>
        <CardContent className='py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <h2 className='text-3xl font-bold text-white m-0'>Danh sách Combo</h2>
            </div>
            <ShimmerBorder
              className='cursor-pointer'
              color='#ffffff'
              animationDuration='3s'
              contentClassName='bg-white/10 rounded-lg'
            >
              <Button
                onClick={() => {
                  fetchCombos()
                  fetchStaffList()
                }}
                disabled={loading}
                variant='outline'
                className='flex items-center gap-2 bg-transparent border-transparent text-white hover:bg-white/20 hover:text-white w-full'
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Đang tải...' : 'Làm mới'}
              </Button>
            </ShimmerBorder>
          </div>
          <p className='text-white/90 mt-2'>
            Quản lý và theo dõi tất cả combo trong hệ thống ({filteredData.length} combo)
          </p>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-wrap items-center gap-4'>
            <div className='flex-1 min-w-[300px] relative'>
              <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
              <Input
                placeholder='Tìm kiếm theo tên combo, cửa hàng'
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value)
                  setCurrentPage(1)
                }}
                className='pl-10'
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Tất cả trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                <SelectItem value='Pending'>Chờ duyệt</SelectItem>
                <SelectItem value='Approved'>Đã duyệt</SelectItem>
                <SelectItem value='Confirmed'>Đã xác nhận</SelectItem>
                <SelectItem value='Rejected'>Từ chối</SelectItem>
                <SelectItem value='Denied'>Bị từ chối</SelectItem>
                <SelectItem value='Processing'>Cần xử lý</SelectItem>
                <SelectItem value='Cancelled'>Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Combo Cards Grid */}
      <div>
        {filteredData.length === 0 ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='text-gray-400 text-lg mb-2'>📦</div>
              <p className='text-gray-600'>
                {searchText || statusFilter !== 'all' ? 'Không tìm thấy combo phù hợp với bộ lọc' : 'Chưa có combo nào'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Cards Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {currentData.map(renderComboCard)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='flex items-center justify-between mt-8 pt-6 border-t border-gray-200'>
                <div className='text-sm text-gray-600'>
                  Hiển thị {startIndex + 1} đến {Math.min(endIndex, filteredData.length)} của {filteredData.length} kết
                  quả
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handlePageChange(currentPage - 1)}
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
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ComboListStaff
