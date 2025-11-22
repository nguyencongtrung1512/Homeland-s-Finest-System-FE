import { useState, useEffect, useCallback } from 'react'
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
  Clock
} from 'lucide-react'
import { staffApi, type ComboForReview } from '../../../apis/staff.api'
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
  status: 'Processing' | 'Confirmed' | 'Approved' | 'Denied' | 'Rejected'
}

function ManagerComboStaff() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [comboData, setComboData] = useState<ComboData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCombos, setTotalCombos] = useState(0)
  const [actionLoading, setActionLoading] = useState(false)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [selectedCombo, setSelectedCombo] = useState<ComboData | null>(null)
  const [actionNote, setActionNote] = useState('')
  const pageSize = 12

  const convertComboResponse = (apiCombo: ComboForReview): ComboData => {
    const formatDate = (dateString: string) => {
      if (!dateString || dateString === 'null' || dateString === 'undefined') {
        return '-'
      }

      // Xử lý định dạng "HH:MM:SS DD/MM/YYYY" từ API
      // Ví dụ: "14:58:24 07/10/2025"
      const timeDateMatch = dateString.match(/(\d{2}:\d{2}:\d{2})\s+(\d{2}\/\d{2}\/\d{4})/)

      if (timeDateMatch) {
        const [, time, date] = timeDateMatch
        const [day, month, year] = date.split('/')
        const [hours, minutes, seconds] = time.split(':')

        // Tạo Date object với định dạng chuẩn
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds))

        if (isNaN(dateObj.getTime())) {
          return '-'
        }

        return dateObj.toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
      }

      // Fallback cho các định dạng khác
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
        name: apiCombo.storeName,
        id: apiCombo.storeId
      },
      seller: {
        name: apiCombo.sellerName
      },
      createdAt: formatDate(apiCombo.createdAt),
      updatedAt: formatDate(apiCombo.updatedAt),
      items: apiCombo.comboItems?.length || 0,
      status: apiCombo.status as 'Processing' | 'Confirmed' | 'Approved' | 'Denied' | 'Rejected'
    }
  }

  // Function để fetch combos for review
  const fetchCombosForReview = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user?.userId) {
        setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
        return
      }

      const response = await staffApi.getCombosForReview(user.userId, {
        pageSize: 0,
        pageNumber: 1
      })

      if (response && response.data && Array.isArray(response.data)) {
        const convertedCombos = response.data.map((combo: unknown) => convertComboResponse(combo as ComboForReview))
        setComboData(convertedCombos)
        setTotalCombos(convertedCombos.length)
      } else {
        setError('Định dạng dữ liệu không đúng')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải danh sách combo'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user?.userId])

  useEffect(() => {
    if (user?.userId) {
      fetchCombosForReview()
    }
  }, [fetchCombosForReview, user?.userId])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchText])

  const filteredCombos = comboData.filter((combo) => {
    const searchLower = searchText.toLowerCase().trim()
    const matchSearch = !searchLower || combo.combo.name.toLowerCase().includes(searchLower)
    const matchStatus = statusFilter === 'all' || combo.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalFilteredCombos = filteredCombos.length
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedCombos = filteredCombos.slice(startIndex, endIndex)

  const handleFilter = () => {
    setCurrentPage(1)
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
      await fetchCombosForReview() // Refresh data
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
      await fetchCombosForReview() // Refresh data
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
      await fetchCombosForReview() // Refresh data
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
      await fetchCombosForReview() // Refresh data
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
      }
    }

    const config = statusConfig[combo.status as keyof typeof statusConfig] || {
      variant: 'default' as const,
      text: combo.status,
      className: 'bg-gray-100 text-gray-700',
      icon: Clock
    }

    const StatusIcon = config.icon

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
              <User size={14} className='text-gray-400' />
              <span>Cửa hàng: {combo.store.name}</span>
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
          </div>

          {/* Action Buttons */}
          <div className='grid grid-cols-2 gap-2'>
            <Button
              variant='outline'
              onClick={() => navigate(`/staff/combo-management/detail-combo/${combo.combo.id}`)}
              className='flex items-center justify-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300'
            >
              <ExternalLink size={16} />
              Xem
            </Button>
            {(combo.status === 'Processing' || combo.status === 'Confirmed') && (
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
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-gray-600 mt-1'>Xét duyệt các combo được phân công ({totalCombos} combo)</p>
        </div>
        <Button
          onClick={fetchCombosForReview}
          disabled={loading}
          variant='outline'
          className='flex items-center gap-2 bg-transparent'
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Đang tải...' : 'Làm mới'}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-wrap items-center gap-4'>
            <div className='flex-1 min-w-[300px] relative'>
              <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
              <Input
                placeholder='Tìm kiếm theo tên combo...'
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
                <SelectItem value='Processing'>Chờ xác nhận</SelectItem>
                <SelectItem value='Confirmed'>Đang xét duyệt</SelectItem>
                <SelectItem value='Approved'>Đã duyệt</SelectItem>
                <SelectItem value='Denied'>Từ chối</SelectItem>
                <SelectItem value='Rejected'>Bị từ chối</SelectItem>
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
          <div className='flex items-center justify-center py-12'>
            <span className='text-gray-600'>Đang tải danh sách combo...</span>
          </div>
        ) : error ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='text-red-500 text-lg mb-2'>⚠️</div>
              <p className='text-red-600 font-medium mb-4'>{error}</p>
              <Button onClick={fetchCombosForReview} className='bg-blue-600 hover:bg-blue-700'>
                Thử lại
              </Button>
            </div>
          </div>
        ) : comboData.length === 0 ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='text-gray-400 text-lg mb-2'>📦</div>
              <p className='text-gray-600'>Chưa có combo nào được phân công</p>
            </div>
          </div>
        ) : filteredCombos.length === 0 ? (
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