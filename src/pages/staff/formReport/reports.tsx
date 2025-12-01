import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  RotateCcw,
  Eye,
  User,
  ShoppingCart,
  Store,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Calendar as CalendarComponent } from '../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { format } from 'date-fns'
import { staffApi } from '../../../apis/staff.api'
import type { StaffForm } from '../../../apis/staff.api'
import Loading from '../../../components/Loading/loading'
import EmptyState from '../../../components/EmptyState/emptyState'
import { toast } from 'react-toastify'
import { ShimmerBorder } from '../../../components/ui/shimmer'
import Pagination from '../../../components/Pagination/Pagination'
import { formatDate } from '../../../utils/formatDate'

function ReportManagement() {
  const navigate = useNavigate()
  const [forms, setForms] = useState<StaffForm[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<string | 'all'>('all')
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const isFutureDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)
    return compareDate > today
  }

  // Load assigned forms
  const loadAssignedForms = useCallback(async () => {
    try {
      setLoading(true)
      const response = await staffApi.getMyForms()
      console.log('Staff forms API response:', response)
      setForms(response.data || [])
    } catch (error) {
      console.error('Error loading staff forms:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách khiếu nại')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAssignedForms()
  }, [loadAssignedForms])

  const handleStartDateChange = (date: Date | undefined) => {
    if (!date) {
      setStartDate(undefined)
      return
    }

    if (isFutureDate(date)) {
      toast.error('Không thể chọn ngày ở tương lai')
      return
    }

    if (endDate && date > endDate) {
      toast.error('Ngày bắt đầu không được sau ngày kết thúc')
      return
    }

    setStartDate(date)
  }

  const handleEndDateChange = (date: Date | undefined) => {
    if (!date) {
      setEndDate(undefined)
      return
    }

    if (isFutureDate(date)) {
      toast.error('Không thể chọn ngày ở tương lai')
      return
    }

    if (startDate && date < startDate) {
      toast.error('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu')
      return
    }

    setEndDate(date)
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [searchText, typeFilter, statusFilter, startDate, endDate])

  const getTypeConfig = (type: string) => {
    const configs: Record<string, { text: string; bgColor: string; textColor: string; icon: React.ReactElement }> = {
      ComplaintOrder: {
        text: 'Khiếu nại đơn hàng',
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-600',
        icon: <ShoppingCart className='w-3 h-3' />
      },
      ReportSeller: {
        text: 'Khiếu nại cửa hàng',
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-600',
        icon: <Store className='w-3 h-3' />
      },
      Orther: {
        text: 'Các đơn khác',
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-600',
        icon: <User className='w-3 h-3' />
      }
    }
    return configs[type] || configs.Orther
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { text: string; bgColor: string; textColor: string; icon: React.ReactElement }> = {
      Pending: {
        text: 'Chờ phân công',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-600',
        icon: <AlertCircle className='w-3 h-3' />
      },
      Processing: {
        text: 'Chờ xử lý',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        icon: <RefreshCw className='w-3 h-3' />
      },
      ApprovedByStaff: {
        text: 'Chấp nhận bởi nhân viên',
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-600',
        icon: <CheckCircle className='w-3 h-3' />
      },
      DeniedByStaff: {
        text: 'Từ chối bởi nhân viên',
        bgColor: 'bg-rose-100',
        textColor: 'text-rose-600',
        icon: <XCircle className='w-3 h-3' />
      },
      ApprovedByAdmin: {
        text: 'Đã duyệt',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        icon: <CheckCircle className='w-3 h-3' />
      },
      DeniedByAdmin: {
        text: 'Từ chối',
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        icon: <XCircle className='w-3 h-3' />
      },
      Rejected: {
        text: 'Bị từ chối',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
        icon: <XCircle className='w-3 h-3' />
      },
      Confirmed: {
        text: 'Đang xử lí đơn',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600',
        icon: <Clock className='w-3 h-3' />
      },
      Cancel: {
        text: 'Đã hủy',
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-600',
        icon: <XCircle className='w-3 h-3' />
      }
    }
    return configs[status] || configs.Pending
  }

  const normalizeDateValue = (input?: string | number | Date | null) => {
    if (input === null || input === undefined) return undefined
    if (input instanceof Date) return isNaN(input.getTime()) ? undefined : input

    const raw = typeof input === 'string' ? input.trim() : input
    if (raw === '' || raw === 'null' || raw === 'undefined' || raw === '0' || raw === 0) return undefined

    if (typeof raw === 'number' || /^[0-9]+$/.test(String(raw))) {
      const num = Number(raw)
      const ms = num < 1e12 ? num * 1000 : num
      const date = new Date(ms)
      return isNaN(date.getTime()) ? undefined : date
    }

    const match = String(raw).match(/(\d{2}):(\d{2}):(\d{2})\s+(\d{2})\/(\d{2})\/(\d{4})/)
    if (match) {
      const [, hh, mm, ss, dd, MM, yyyy] = match
      const date = new Date(Number(yyyy), Number(MM) - 1, Number(dd), Number(hh), Number(mm), Number(ss))
      return isNaN(date.getTime()) ? undefined : date
    }

    const parsed = new Date(String(raw))
    return isNaN(parsed.getTime()) ? undefined : parsed
  }

  const startTimestamp = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : undefined
  const endTimestamp = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : undefined

  const filteredForms = forms.filter((form) => {
    const matchesSearch =
      searchText === '' ||
      form.id.toLowerCase().includes(searchText.toLowerCase()) ||
      form.subject.toLowerCase().includes(searchText.toLowerCase()) ||
      form.description.toLowerCase().includes(searchText.toLowerCase())

    const matchesType = typeFilter === 'all' || form.type === typeFilter
    const matchesStatus = statusFilter === 'all' || form.status === statusFilter
    const normalizedCreatedAt = normalizeDateValue(form.createdAt)
    const formCreatedAt = normalizedCreatedAt?.getTime()
    const matchesDateRange =
      (!startTimestamp || (formCreatedAt && formCreatedAt >= startTimestamp)) &&
      (!endTimestamp || (formCreatedAt && formCreatedAt <= endTimestamp))

    return matchesSearch && matchesType && matchesStatus && matchesDateRange
  })

  const totalPages = Math.ceil(filteredForms.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentForms = filteredForms.slice(startIndex, endIndex)

  const handleView = (form: StaffForm) => {
    navigate(`/staff/formReport/${form.id}`)
  }

  const handleReset = () => {
    setSearchText('')
    setTypeFilter('all')
    setStatusFilter('all')
    setStartDate(undefined)
    setEndDate(undefined)
    setCurrentPage(1)
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <Card className='bg-gradient-to-br from-cyan-500 to-cyan-600 border-0 shadow-lg'>
        <CardContent className='py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <h2 className='text-3xl font-bold text-white m-0'>Khiếu nại được phân công</h2>
            </div>
            <ShimmerBorder
              className='cursor-pointer'
              color='#ffffff'
              animationDuration='3s'
              contentClassName='bg-white/10 rounded-lg'
            >
              <Button
                onClick={loadAssignedForms}
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
            Quản lý và xử lý tất cả khiếu nại được phân công ({forms.length} khiếu nại)
          </p>
        </CardContent>
      </Card>

      {/* Search and Filter Section */}
      <Card className='bg-white shadow-sm'>
        <CardContent className='p-6'>
          <div className='space-y-4'>
            {/* Search Row */}
            <div className='flex items-end gap-4'>
              <div className='flex-1'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Tìm kiếm</label>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    placeholder='Tiêu đề hoặc nội dung...'
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className='pl-10 h-10'
                  />
                </div>
              </div>
              <div className='w-56'>
                <label className='block text-sm font-medium text-gray-700 mb-2 '>Loại khiếu nại</label>
                <Select value={typeFilter} onValueChange={(value: string) => setTypeFilter(value)}>
                  <SelectTrigger className='h-10 w-[200px]'>
                    <SelectValue placeholder='Tất cả' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả</SelectItem>
                    <SelectItem value='ComplaintOrder'>Khiếu nại đơn hàng</SelectItem>
                    <SelectItem value='ReportSeller'>Khiếu nại cửa hàng</SelectItem>
                    <SelectItem value='Orther'>Các đơn khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='w-56'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Trạng thái</label>
                <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value)}>
                  <SelectTrigger className='h-10 w-[200px]'>
                    <SelectValue placeholder='Tất cả' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả</SelectItem>
                    <SelectItem value='Pending'>Chờ phân công</SelectItem>
                    <SelectItem value='Processing'>Chờ xử lý</SelectItem>
                    <SelectItem value='ApprovedByStaff'>Chấp nhận bởi nhân viên</SelectItem>
                    <SelectItem value='DeniedByStaff'>Từ chối bởi nhân viên</SelectItem>
                    <SelectItem value='ApprovedByAdmin'>Đã duyệt</SelectItem>
                    <SelectItem value='DeniedByAdmin'>Từ chối</SelectItem>
                    <SelectItem value='Rejected'>Bị từ chối</SelectItem>
                    <SelectItem value='Confirmed'>Đang xử lí đơn</SelectItem>
                    <SelectItem value='Cancel'>Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Filter Row */}
            <div className='flex items-end gap-6'>
              <div className='flex-1'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Ngày báo cáo</label>
                <div className='flex items-center gap-3'>
                  {/* Start date */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className='h-10 flex-1 justify-start text-left font-normal rounded-lg border-gray-300 shadow-sm hover:border-blue-400'
                      >
                        <Calendar className='mr-2 h-4 w-4 text-blue-500' />
                        {startDate ? format(startDate, 'dd/MM/yyyy') : 'Chọn ngày bắt đầu'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-2 bg-white rounded-lg shadow-lg border' align='start'>
                      <CalendarComponent
                        mode='single'
                        selected={startDate}
                        onSelect={handleStartDateChange}
                        disabled={(date) => isFutureDate(date)}
                        initialFocus
                        showOutsideDays={false}
                      />
                    </PopoverContent>
                  </Popover>

                  <span className='text-gray-500 text-sm'>đến</span>

                  {/* End date */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className='h-10 flex-1 justify-start text-left font-normal rounded-lg border-gray-300 shadow-sm hover:border-blue-400'
                      >
                        <Calendar className='mr-2 h-4 w-4 text-blue-500' />
                        {endDate ? format(endDate, 'dd/MM/yyyy') : 'Chọn ngày kết thúc'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-2 bg-white rounded-lg shadow-lg border' align='start'>
                      <CalendarComponent
                        mode='single'
                        selected={endDate}
                        onSelect={handleEndDateChange}
                        disabled={(date) => isFutureDate(date)}
                        initialFocus
                        showOutsideDays={false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Action buttons */}
              <div className='flex items-end gap-2'>
                <Button
                  variant='outline'
                  onClick={handleReset}
                  className='h-10 px-4 rounded-lg shadow-sm hover:border-red-400'
                >
                  <RotateCcw className='w-4 h-4 mr-2' />
                  Đặt lại
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forms List Section */}
      <Card className='bg-white shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between p-6 border-b border-gray-200'>
          <div>
            <CardTitle className='text-lg font-semibold text-gray-900'>Danh sách khiếu nại</CardTitle>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-200 bg-gray-50'>
                  <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Tiêu đề</th>
                  <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Loại</th>
                  <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Trạng thái</th>
                  <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Ngày tạo</th>
                  <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Hành động</th>
                </tr>
              </thead>
              <tbody className='bg-white'>
                {currentForms.length > 0 ? (
                  currentForms.map((form) => {
                    const typeConfig = getTypeConfig(form.type)
                    const statusConfig = getStatusConfig(form.status)
                    return (
                      <tr key={form.id} className='border-b border-gray-100 hover:bg-gray-50'>
                        <td className='px-6 py-3'>
                          <div className='max-w-[250px]'>
                            <p className='font-medium text-gray-900 text-sm line-clamp-1'>{form.subject}</p>
                            <p className='text-xs text-gray-600 mt-1 line-clamp-1'>{form.description}</p>
                          </div>
                        </td>
                        <td className='px-6 py-3'>
                          <div
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${typeConfig.bgColor} ${typeConfig.textColor}`}
                          >
                            {typeConfig.icon}
                            {typeConfig.text}
                          </div>
                        </td>
                        <td className='px-6 py-3'>
                          <div
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
                          >
                            {statusConfig.icon}
                            {statusConfig.text}
                          </div>
                        </td>
                        <td className='px-6 py-3'>
                          <span className='text-sm text-gray-700'>{formatDate(form.createdAt || 'null')}</span>
                        </td>
                        <td className='px-6 py-3'>
                          <Button
                            variant='ghost'
                            size='sm'
                            title='Xem chi tiết'
                            onClick={() => handleView(form)}
                            className='h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full'
                          >
                            <Eye size={16} />
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className='px-6 py-12 text-center'>
                      <EmptyState
                        title='Không có khiếu nại nào'
                        description='Không tìm thấy khiếu nại nào phù hợp với bộ lọc hiện tại.'
                        type='search'
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className='flex flex-col gap-3 px-6 py-4 border-t border-gray-200'>
            <p className='text-sm text-gray-600'>
              Hiển thị {filteredForms.length === 0 ? 0 : startIndex + 1}-
              {Math.min(endIndex, filteredForms.length)} của {filteredForms.length} kết quả
            </p>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ReportManagement
