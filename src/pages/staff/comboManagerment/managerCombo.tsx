import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Search,
  Filter,
  RefreshCw,
  Package,
  ExternalLink,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Store,
  Eye,
  ArrowUpDown
} from 'lucide-react'
import { staffApi } from '../../../apis/staff.api'
import { getAllCombos } from '../../../apis/combo.api'
import type { Combo } from '../../../types/combo.type'
import { toast } from 'react-toastify'
import { Card, CardContent } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/auth.context'
import { ShimmerBorder } from '../../../components/ui/shimmer'
import path from '../../../constants/path'
import Loading from '../../../components/Loading/loading'

interface ComboData {
  key: string
  combo: {
    thumbnailUrl: string
    name: string
    id: string
  }
  store: {
    name: string
    id: string
  }
  seller: {
    name: string
  }
  createdAt: string
  updatedAt: string
  items: number
  status: 'Processing' | 'Confirmed' | 'Approved' | 'Denied' | 'Rejected' | 'Pending' | 'Cancelled'
  assignedToId?: string
  assignedStaffName?: string
}

type SortField = 'name' | 'createdAt' | 'updatedAt' | 'status' | 'items'
type SortOrder = 'asc' | 'desc'

function ManagerComboStaff() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'assigned' | 'unassigned'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [comboData, setComboData] = useState<ComboData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCombos, setTotalCombos] = useState(0)
  const [actionLoading, setActionLoading] = useState(false)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [selectedCombo, setSelectedCombo] = useState<ComboData | null>(null)
  const [actionNote, setActionNote] = useState('')
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [staffMap, setStaffMap] = useState<Map<string, string>>(new Map())
  const pageSize = 12

  // Fetch staff list để hiển thị tên nhân viên được phân công
  const fetchStaffList = useCallback(async () => {
    try {
      const response = await staffApi.getAllStaff({
        pageSize: 0,
        pageNumber: 1
      })

      if (response && Array.isArray(response)) {
        const map = new Map<string, string>()
        response.forEach((staff: any) => {
          const fullName = `${staff.firstName} ${staff.lastName}`.trim()
          map.set(staff.userId, fullName)
        })
        setStaffMap(map)
      }
    } catch (error) {
      console.error('Error fetching staff list:', error)
    }
  }, [])

  const convertComboResponse = (apiCombo: Combo): ComboData => {
    const formatDate = (dateString: string | undefined) => {
      if (!dateString || dateString === 'null' || dateString === 'undefined') {
        return '-'
      }

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

    return {
      key: apiCombo.id,
      combo: {
        thumbnailUrl: apiCombo.thumbnailUrl || '',
        name: apiCombo.name,
        id: apiCombo.id
      },
      store: {
        name: apiCombo.storeName || 'Chưa xác định',
        id: apiCombo.storeId || ''
      },
      seller: {
        name: 'Chưa xác định'
      },
      createdAt: formatDate(apiCombo.createdAt),
      updatedAt: formatDate(apiCombo.updatedAt),
      items: apiCombo.comboItems?.length || 0,
      status: (apiCombo.status as ComboData['status']) || 'Pending',
      assignedToId: apiCombo.assignedToId,
      assignedStaffName: apiCombo.assignedToId ? staffMap.get(apiCombo.assignedToId) : undefined
    }
  }

  // Function để fetch tất cả combos
  const fetchCombos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await getAllCombos({
        pageSize: 0,
        pageNumber: 1
      })

      const allCombos: Combo[] = ((response as unknown) as { data: Combo[] }).data || []

      // Lọc bỏ Draft status
      const filteredCombos = Array.isArray(allCombos)
        ? allCombos.filter((combo: Combo) => combo.status !== 'Draft')
        : []

      if (filteredCombos.length > 0) {
        const convertedCombos = filteredCombos.map((combo: Combo) => convertComboResponse(combo))
        setComboData(convertedCombos)
        setTotalCombos(convertedCombos.length)
      } else {
        setComboData([])
        setTotalCombos(0)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải danh sách combo'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [staffMap])

  useEffect(() => {
    fetchStaffList()
  }, [fetchStaffList])

  useEffect(() => {
    if (staffMap.size > 0) {
      fetchCombos()
    }
  }, [fetchCombos, staffMap.size])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchText, statusFilter, assignmentFilter])

  // Filter và sort combos
  const filteredAndSortedCombos = useMemo(() => {
    let filtered = [...comboData]

    // Search filter
    const searchLower = searchText.toLowerCase().trim()
    if (searchLower) {
      filtered = filtered.filter(
        (combo) =>
          combo.combo.name.toLowerCase().includes(searchLower) ||
          combo.store.name.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((combo) => combo.status === statusFilter)
    }

    // Assignment filter
    if (assignmentFilter === 'assigned') {
      filtered = filtered.filter((combo) => combo.assignedToId === user?.userId)
    } else if (assignmentFilter === 'unassigned') {
      filtered = filtered.filter((combo) => !combo.assignedToId)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'name':
          aValue = a.combo.name.toLowerCase()
          bValue = b.combo.name.toLowerCase()
          break
        case 'createdAt':
          aValue = a.createdAt
          bValue = b.createdAt
          break
        case 'updatedAt':
          aValue = a.updatedAt
          bValue = b.updatedAt
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'items':
          aValue = a.items
          bValue = b.items
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [comboData, searchText, statusFilter, assignmentFilter, sortField, sortOrder, user?.userId])

  const totalFilteredCombos = filteredAndSortedCombos.length
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedCombos = filteredAndSortedCombos.slice(startIndex, endIndex)

  const handleFilter = () => {
    setCurrentPage(1)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Handle action dialog open
  const handleOpenActionDialog = (combo: ComboData) => {
    setSelectedCombo(combo)
    setActionNote('')
    setShowActionDialog(true)
  }

  // Handle confirm assignment (Processing → Confirmed)
  const handleConfirmAssignment = async () => {
    if (!selectedCombo || !actionNote.trim()) {
      toast.error('Vui lòng nhập ghi chú')
      return
    }

    setActionLoading(true)
    try {
      await staffApi.confirmComboAssignment(selectedCombo.combo.id, actionNote)
      toast.success('Đã chấp nhận nhiệm vụ xử lý combo')
      setShowActionDialog(false)
      setActionNote('')
      await fetchCombos()
      await fetchStaffList()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi chấp nhận nhiệm vụ'
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle reject assignment (Processing → Rejected)
  const handleRejectAssignment = async () => {
    if (!selectedCombo || !actionNote.trim()) {
      toast.error('Vui lòng nhập lý do từ chối')
      return
    }

    setActionLoading(true)
    try {
      await staffApi.rejectComboAssignment(selectedCombo.combo.id, actionNote)
      toast.success('Đã từ chối nhiệm vụ thành công')
      setShowActionDialog(false)
      setActionNote('')
      await fetchCombos()
      await fetchStaffList()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi từ chối nhiệm vụ'
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle approve combo (Confirmed → Approved)
  const handleApproveCombo = async () => {
    if (!selectedCombo || !actionNote.trim()) {
      toast.error('Vui lòng nhập ghi chú')
      return
    }

    setActionLoading(true)
    try {
      await staffApi.approveCombo(selectedCombo.combo.id, actionNote)
      toast.success('Đã phê duyệt combo thành công')
      setShowActionDialog(false)
      setActionNote('')
      await fetchCombos()
      await fetchStaffList()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi phê duyệt combo'
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle deny combo (Confirmed → Denied)
  const handleDenyCombo = async () => {
    if (!selectedCombo || !actionNote.trim()) {
      toast.error('Vui lòng nhập lý do từ chối')
      return
    }

    setActionLoading(true)
    try {
      await staffApi.denyCombo(selectedCombo.combo.id, actionNote)
      toast.success('Đã từ chối combo thành công')
      setShowActionDialog(false)
      setActionNote('')
      await fetchCombos()
      await fetchStaffList()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi từ chối combo'
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  // Render combo card component
  const renderComboCard = (combo: ComboData) => {
    const statusConfig = {
      Processing: {
        variant: 'default' as const,
        text: 'Chờ xác nhận',
        className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
        icon: Clock
      },
      Confirmed: {
        variant: 'default' as const,
        text: 'Đang xét duyệt',
        className: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
        icon: Clock
      },
      Approved: {
        variant: 'default' as const,
        text: 'Đã duyệt',
        className: 'bg-green-100 text-green-700 hover:bg-green-100',
        icon: CheckCircle
      },
      Denied: {
        variant: 'default' as const,
        text: 'Từ chối',
        className: 'bg-red-100 text-red-700 hover:bg-red-100',
        icon: XCircle
      },
      Rejected: {
        variant: 'default' as const,
        text: 'Bị từ chối',
        className: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
        icon: XCircle
      },
      Pending: {
        variant: 'default' as const,
        text: 'Chờ duyệt',
        className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
        icon: Clock
      },
      Cancelled: {
        variant: 'default' as const,
        text: 'Đã hủy',
        className: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
        icon: XCircle
      }
    }

    const config = statusConfig[combo.status as keyof typeof statusConfig] || {
      variant: 'default' as const,
      text: combo.status,
      className: 'bg-gray-100 text-gray-700',
      icon: Clock
    }

    const StatusIcon = config.icon
    const canProcess = combo.assignedToId === user?.userId && (combo.status === 'Processing' || combo.status === 'Confirmed')

    return (
      <Card
        key={combo.key}
        className='h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-300'
      >
        <CardContent className='p-4'>
          {/* Header with Avatar and Combo Info */}
          <div className='flex items-start gap-4 mb-4'>
            <div className='relative'>
              <Avatar className='h-14 w-14'>
                {combo.combo.thumbnailUrl ? (
                  <img
                    src={combo.combo.thumbnailUrl}
                    alt={combo.combo.name}
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
                  {combo.combo.name
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
              <h3 className='text-lg font-semibold text-gray-900 truncate mb-1'>{combo.combo.name}</h3>
              <Badge variant={config.variant} className={config.className}>
                <StatusIcon size={12} className='mr-1' />
                {config.text}
              </Badge>
            </div>
          </div>

          {/* Combo Details */}
          <div className='space-y-3 mb-6'>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Store size={14} className='text-gray-400' />
              <span className='truncate'>Cửa hàng: {combo.store.name}</span>
            </div>

            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Calendar size={14} className='text-gray-400' />
              <span>Ngày tạo: {combo.createdAt}</span>
            </div>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Calendar size={14} className='text-gray-400' />
              <span>Ngày cập nhật: {combo.updatedAt}</span>
            </div>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Package size={14} className='text-gray-400' />
              <span>{combo.items} sản phẩm</span>
            </div>
            {combo.assignedToId && (
              <div className='flex items-center gap-2 text-sm text-gray-600'>
                <User size={14} className='text-gray-400' />
                <span>
                  Nhân viên:{' '}
                  <span className={`font-medium ${combo.assignedToId === user?.userId ? 'text-blue-600' : ''}`}>
                    {combo.assignedStaffName || 'Chưa xác định'}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className='grid grid-cols-2 gap-2'>
            <Button
              variant='outline'
              onClick={() => navigate(path.detailComboStaff.replace(':id', combo.combo.id))}
              className='flex items-center justify-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300'
            >
              <Eye size={16} />
              Xem
            </Button>
            {canProcess && (
              <Button
                variant='outline'
                onClick={() => handleOpenActionDialog(combo)}
                className='flex items-center justify-center gap-2 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300'
              >
                <CheckCircle size={16} />
                Xử lý
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <Card className='bg-gradient-to-br from-cyan-500 to-cyan-600 border-0 shadow-lg'>
        <CardContent className='py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <h2 className='text-3xl font-bold text-white m-0'>Quản lý Combo</h2>
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
                variant='blue'
                className='flex items-center gap-2 bg-transparent border-transparent text-white hover:bg-white/20 hover:text-white w-full'
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Đang tải...' : 'Làm mới'}
              </Button>
            </ShimmerBorder>
          </div>
          <p className='text-white/90 mt-2'>
            Quản lý và xử lý tất cả combo trong hệ thống ({totalCombos} combo)
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
                placeholder='Tìm kiếm theo tên combo, cửa hàng...'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className='pl-10'
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Tất cả trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                <SelectItem value='Pending'>Chờ duyệt</SelectItem>
                <SelectItem value='Processing'>Chờ xác nhận</SelectItem>
                <SelectItem value='Confirmed'>Đang xét duyệt</SelectItem>
                <SelectItem value='Approved'>Đã duyệt</SelectItem>
                <SelectItem value='Denied'>Từ chối</SelectItem>
                <SelectItem value='Rejected'>Bị từ chối</SelectItem>
                <SelectItem value='Cancelled'>Đã hủy</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assignmentFilter} onValueChange={(value: 'all' | 'assigned' | 'unassigned') => setAssignmentFilter(value)}>
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Phân công' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='assigned'>Được phân công cho tôi</SelectItem>
                <SelectItem value='unassigned'>Chưa phân công</SelectItem>
              </SelectContent>
            </Select>

            <Select value={`${sortField}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-') as [SortField, SortOrder]
              setSortField(field)
              setSortOrder(order)
            }}>
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Sắp xếp' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='updatedAt-desc'>Mới nhất</SelectItem>
                <SelectItem value='updatedAt-asc'>Cũ nhất</SelectItem>
                <SelectItem value='name-asc'>Tên A-Z</SelectItem>
                <SelectItem value='name-desc'>Tên Z-A</SelectItem>
                <SelectItem value='createdAt-desc'>Ngày tạo (mới)</SelectItem>
                <SelectItem value='createdAt-asc'>Ngày tạo (cũ)</SelectItem>
                <SelectItem value='status-asc'>Trạng thái</SelectItem>
                <SelectItem value='items-desc'>Số sản phẩm (nhiều)</SelectItem>
                <SelectItem value='items-asc'>Số sản phẩm (ít)</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleFilter} className='bg-blue-600 hover:bg-blue-700'>
              <Filter size={16} className='mr-2' />
              Lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Combo Cards Grid */}
      <div>
        {loading ? (
          <Loading size='lg' text='Đang tải danh sách combo...' />
        ) : error ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='text-red-500 text-lg mb-2'>⚠️</div>
              <p className='text-red-600 font-medium mb-4'>{error}</p>
              <Button onClick={fetchCombos} className='bg-blue-600 hover:bg-blue-700'>
                Thử lại
              </Button>
            </div>
          </div>
        ) : comboData.length === 0 ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='text-gray-400 text-lg mb-2'>📦</div>
              <p className='text-gray-600'>Chưa có combo nào</p>
            </div>
          </div>
        ) : filteredAndSortedCombos.length === 0 ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='text-gray-400 text-lg mb-2'>🔍</div>
              <p className='text-gray-600'>Không tìm thấy combo phù hợp với bộ lọc</p>
            </div>
          </div>
        ) : (
          <>
            {/* Cards Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {paginatedCombos.map(renderComboCard)}
            </div>

            {/* Pagination */}
            <div className='flex items-center justify-between mt-8 pt-6 border-t border-gray-200'>
              <div className='text-sm text-gray-600'>
                Hiển thị {startIndex + 1} đến {Math.min(endIndex, totalFilteredCombos)} của {totalFilteredCombos} kết
                quả
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>
                <span className='text-sm text-gray-600'>
                  Trang {currentPage} / {Math.ceil(totalFilteredCombos / pageSize)}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(Math.ceil(totalFilteredCombos / pageSize), prev + 1))
                  }
                  disabled={currentPage >= Math.ceil(totalFilteredCombos / pageSize)}
                >
                  Sau
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>
              {selectedCombo?.status === 'Processing' ? 'Xử lý nhiệm vụ' : 'Xét duyệt combo'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            {selectedCombo && (
              <div className='p-3 bg-gray-50 rounded-lg'>
                <h4 className='font-medium text-gray-900 mb-2'>{selectedCombo.combo.name}</h4>
                <p className='text-sm text-gray-600'>
                  {selectedCombo.status === 'Processing'
                    ? 'Chọn hành động cho nhiệm vụ này:'
                    : 'Chọn hành động cho combo này:'}
                </p>
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='actionNote'>Ghi chú *</Label>
              <Textarea
                id='actionNote'
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder={
                  selectedCombo?.status === 'Processing'
                    ? 'Nhập ghi chú khi xử lý nhiệm vụ...'
                    : 'Nhập ghi chú khi xét duyệt combo...'
                }
                rows={4}
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              {selectedCombo?.status === 'Processing' ? (
                <>
                  <Button
                    onClick={handleConfirmAssignment}
                    disabled={actionLoading}
                    className='bg-green-600 hover:bg-green-700'
                  >
                    <CheckCircle size={16} className='mr-2' />
                    {actionLoading ? 'Đang xử lý...' : 'Chấp nhận'}
                  </Button>
                  <Button
                    onClick={handleRejectAssignment}
                    disabled={actionLoading}
                    variant='destructive'
                  >
                    <XCircle size={16} className='mr-2' />
                    {actionLoading ? 'Đang xử lý...' : 'Từ chối'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleApproveCombo}
                    disabled={actionLoading}
                    className='bg-green-600 hover:bg-green-700'
                  >
                    <CheckCircle size={16} className='mr-2' />
                    {actionLoading ? 'Đang xử lý...' : 'Phê duyệt'}
                  </Button>
                  <Button
                    onClick={handleDenyCombo}
                    disabled={actionLoading}
                    variant='destructive'
                  >
                    <XCircle size={16} className='mr-2' />
                    {actionLoading ? 'Đang xử lý...' : 'Từ chối'}
                  </Button>
                </>
              )}
            </div>

            <Button
              variant='outline'
              onClick={() => setShowActionDialog(false)}
              className='w-full'
            >
              Hủy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ManagerComboStaff
