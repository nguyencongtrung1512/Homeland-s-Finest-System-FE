import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  RotateCcw,
  Download,
  Eye,
  User,
  ShoppingCart,
  Store,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Calendar as CalendarComponent } from '../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { format } from 'date-fns'
import { formApi } from '../../../apis/form.api'
import type { FormDTO, FormStatus, FormType } from '../../../types/form.type'
import { useAuth } from '../../../contexts/auth.context'
import Loading from '../../../components/Loading/loading'
import EmptyState from '../../../components/EmptyState/emptyState'
import { toast } from 'react-toastify'

function ReportManagement() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [forms, setForms] = useState<FormDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState<FormType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<FormStatus | 'all'>('all')
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Load assigned forms
  const loadAssignedForms = useCallback(async () => {
    if (!user?.userId) {
      console.log('No user ID available')
      return
    }

    console.log('Loading assigned forms for staff ID:', user.userId)
    try {
      setLoading(true)
      const response = await formApi.getAssignedForms(user.userId, {
        pageSize: 100, // Load all for now
        pageNumber: 1
      })
      console.log('Assigned forms API response:', response)
      setForms(response || [])
    } catch (error) {
      console.error('Error loading assigned forms:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách khiếu nại')
    } finally {
      setLoading(false)
    }
  }, [user?.userId])

  useEffect(() => {
    loadAssignedForms()
  }, [loadAssignedForms])

  const getTypeConfig = (type: FormType) => {
    const configs = {
      SupportAccount: {
        text: 'Hỗ trợ tài khoản',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        icon: <User className='w-3 h-3' />
      },
      SupportPayment: {
        text: 'Hỗ trợ thanh toán',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        icon: <CreditCard className='w-3 h-3' />
      },
      SupportTechnical: {
        text: 'Hỗ trợ kỹ thuật',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600',
        icon: <User className='w-3 h-3' />
      },
      ComplaintContent: {
        text: 'Khiếu nại nội dung',
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        icon: <ShoppingCart className='w-3 h-3' />
      },
      RequestInformation: {
        text: 'Yêu cầu thông tin',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-600',
        icon: <User className='w-3 h-3' />
      },
      ReportSeller: {
        text: 'Báo cáo người bán',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600',
        icon: <Store className='w-3 h-3' />
      },
      FeedbackSuggestion: {
        text: 'Phản hồi góp ý',
        bgColor: 'bg-indigo-100',
        textColor: 'text-indigo-600',
        icon: <User className='w-3 h-3' />
      },
      PrivacyDataRequest: {
        text: 'Yêu cầu dữ liệu cá nhân',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
        icon: <User className='w-3 h-3' />
      },
      SupportMarketing: {
        text: 'Hỗ trợ marketing',
        bgColor: 'bg-pink-100',
        textColor: 'text-pink-600',
        icon: <User className='w-3 h-3' />
      },
      SupportOther: {
        text: 'Hỗ trợ khác',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
        icon: <User className='w-3 h-3' />
      },
      SupportRefundMoney: {
        text: 'Hỗ trợ hoàn tiền',
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-600',
        icon: <CreditCard className='w-3 h-3' />
      }
    }
    return configs[type] || configs.SupportOther
  }

  const getStatusConfig = (status: FormStatus) => {
    const configs = {
      Pending: {
        text: 'Chờ phân công',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-600',
        icon: <Clock className='w-3 h-3' />
      },
      Processing: {
        text: 'Đang xử lý',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        icon: <AlertCircle className='w-3 h-3' />
      },
      ApprovedByStaff: {
        text: 'Đã duyệt (Staff)',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        icon: <CheckCircle className='w-3 h-3' />
      },
      DeniedByStaff: {
        text: 'Từ chối (Staff)',
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        icon: <XCircle className='w-3 h-3' />
      },
      ApprovedByAdmin: {
        text: 'Đã duyệt (Admin)',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        icon: <CheckCircle className='w-3 h-3' />
      },
      DeniedByAdmin: {
        text: 'Từ chối (Admin)',
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        icon: <XCircle className='w-3 h-3' />
      },
      Rejected: {
        text: 'Bị từ chối',
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        icon: <XCircle className='w-3 h-3' />
      },
      Confirmed: {
        text: 'Đã xác nhận',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        icon: <CheckCircle className='w-3 h-3' />
      },
      Cancel: {
        text: 'Đã hủy',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
        icon: <XCircle className='w-3 h-3' />
      }
    }
    return configs[status] || configs.Pending
  }

  const filteredForms = forms.filter((form) => {
    const matchesSearch =
      searchText === '' ||
      form.id.toLowerCase().includes(searchText.toLowerCase()) ||
      form.subject.toLowerCase().includes(searchText.toLowerCase()) ||
      form.description.toLowerCase().includes(searchText.toLowerCase())

    const matchesType = typeFilter === 'all' || form.type === typeFilter
    const matchesStatus = statusFilter === 'all' || form.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const totalPages = Math.ceil(filteredForms.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentForms = filteredForms.slice(startIndex, endIndex)

  const handleView = (form: FormDTO) => {
    navigate(`/staff/formReport/${form.id}`)
  }

  const handleExport = () => {
    console.log('Export to Excel')
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
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <h1 className='text-2xl font-bold text-gray-900'>Khiếu nại được phân công</h1>
          <span className='bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm font-medium'>
            {forms.length} khiếu nại
          </span>
        </div>
      </div>

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
                    placeholder='Mã báo cáo hoặc tên khách hàng...'
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className='pl-10 h-10'
                  />
                </div>
              </div>
              <div className='w-56'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Loại khiếu nại</label>
                <Select value={typeFilter} onValueChange={(value: FormType | 'all') => setTypeFilter(value)}>
                  <SelectTrigger className='h-10'>
                    <SelectValue placeholder='Tất cả' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả</SelectItem>
                    <SelectItem value='ComplaintContent'>Khiếu nại nội dung</SelectItem>
                    <SelectItem value='ReportSeller'>Báo cáo người bán</SelectItem>
                    <SelectItem value='SupportRefundMoney'>Hỗ trợ hoàn tiền</SelectItem>
                    <SelectItem value='SupportAccount'>Hỗ trợ tài khoản</SelectItem>
                    <SelectItem value='SupportPayment'>Hỗ trợ thanh toán</SelectItem>
                    <SelectItem value='SupportTechnical'>Hỗ trợ kỹ thuật</SelectItem>
                    <SelectItem value='RequestInformation'>Yêu cầu thông tin</SelectItem>
                    <SelectItem value='FeedbackSuggestion'>Phản hồi góp ý</SelectItem>
                    <SelectItem value='PrivacyDataRequest'>Yêu cầu dữ liệu cá nhân</SelectItem>
                    <SelectItem value='SupportMarketing'>Hỗ trợ marketing</SelectItem>
                    <SelectItem value='SupportOther'>Hỗ trợ khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='w-56'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Trạng thái</label>
                <Select value={statusFilter} onValueChange={(value: FormStatus | 'all') => setStatusFilter(value)}>
                  <SelectTrigger className='h-10'>
                    <SelectValue placeholder='Tất cả' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả</SelectItem>
                    <SelectItem value='Pending'>Chờ phân công</SelectItem>
                    <SelectItem value='Processing'>Đang xử lý</SelectItem>
                    <SelectItem value='ApprovedByStaff'>Đã duyệt (Staff)</SelectItem>
                    <SelectItem value='DeniedByStaff'>Từ chối (Staff)</SelectItem>
                    <SelectItem value='ApprovedByAdmin'>Đã duyệt (Admin)</SelectItem>
                    <SelectItem value='DeniedByAdmin'>Từ chối (Admin)</SelectItem>
                    <SelectItem value='Rejected'>Bị từ chối</SelectItem>
                    <SelectItem value='Confirmed'>Đã xác nhận</SelectItem>
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
                        onSelect={setStartDate}
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
                        onSelect={setEndDate}
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
                  onClick={() => { }}
                  className='bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 rounded-lg shadow-sm'
                >
                  <Filter className='w-4 h-4 mr-2' />
                  Lọc
                </Button>
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
            <p className='text-sm text-gray-600 mt-1'>
              Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredForms.length)} của {filteredForms.length} khiếu nại
            </p>
          </div>
          <Button onClick={handleExport} className='bg-green-600 hover:bg-green-700 text-white'>
            <Download className='w-4 h-4 mr-2' />
            Xuất Excel
          </Button>
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
                          <div>
                            <p className='font-medium text-gray-900 text-sm'>{form.subject}</p>
                            <p className='text-xs text-gray-600 mt-1 line-clamp-2'>{form.description}</p>
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
                          <span className='text-sm text-gray-700'>{form.createdAt}</span>
                        </td>
                        <td className='px-6 py-3'>
                          <Button
                            variant='ghost'
                            size='sm'
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
          <div className='flex items-center justify-between px-6 py-4 border-t border-gray-200'>
            <p className='text-sm text-gray-600'>
              Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredForms.length)} của {filteredForms.length} kết quả
            </p>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className='h-8 w-8 p-0'
              >
                ←
              </Button>
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-blue-600 text-white' : ''}`}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className='h-8 w-8 p-0'
              >
                →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ReportManagement
