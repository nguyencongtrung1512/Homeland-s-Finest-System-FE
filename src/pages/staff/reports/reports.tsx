import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, RotateCcw, Download, Eye, User, ShoppingCart, Store, CreditCard, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Calendar as CalendarComponent } from '../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { format } from 'date-fns'

interface Report {
  id: string
  customerName: string
  customerEmail: string
  customerAvatar: string
  reportedObjectName: string
  reportedObjectId: string
  reportDate: string
  type: 'product' | 'store' | 'transaction' | 'other'
  status: 'pending' | 'processing' | 'processed' | 'not_processed'
}

function ReportManagement() {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Mock data
  const reports: Report[] = [
    {
      id: 'R001',
      customerName: 'Nguyễn Thị Lan',
      customerEmail: 'lan.nguyen@email.com',
      customerAvatar: 'NL',
      reportedObjectName: 'Áo thun nam basic',
      reportedObjectId: 'P12345',
      reportDate: '15/12/2024',
      type: 'product',
      status: 'pending'
    },
    {
      id: 'R002',
      customerName: 'Trần Văn Minh',
      customerEmail: 'minh.tran@email.com',
      customerAvatar: 'TM',
      reportedObjectName: 'Cửa hàng ABC Fashion',
      reportedObjectId: 'S67890',
      reportDate: '14/12/2024',
      type: 'store',
      status: 'processing'
    },
    {
      id: 'R003',
      customerName: 'Lê Thị Hoa',
      customerEmail: 'hoa.le@email.com',
      customerAvatar: 'LH',
      reportedObjectName: 'Giao dịch thanh toán',
      reportedObjectId: 'T98765',
      reportDate: '13/12/2024',
      type: 'transaction',
      status: 'processed'
    },
    {
      id: 'R004',
      customerName: 'Phạm Văn Đức',
      customerEmail: 'duc.pham@email.com',
      customerAvatar: 'PD',
      reportedObjectName: 'Quần jean nữ',
      reportedObjectId: 'P54321',
      reportDate: '12/12/2024',
      type: 'product',
      status: 'not_processed'
    },
    {
      id: 'R005',
      customerName: 'Hoàng Thị Mai',
      customerEmail: 'mai.hoang@email.com',
      customerAvatar: 'HM',
      reportedObjectName: 'Fashion Store Premium',
      reportedObjectId: 'S11111',
      reportDate: '11/12/2024',
      type: 'store',
      status: 'processed'
    }
  ]

  const getTypeConfig = (type: string) => {
    const configs = {
      product: {
        text: 'Sản phẩm',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        icon: <ShoppingCart className='w-3 h-3' />
      },
      store: {
        text: 'Cửa hàng',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600',
        icon: <Store className='w-3 h-3' />
      },
      transaction: {
        text: 'Giao dịch',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        icon: <CreditCard className='w-3 h-3' />
      },
      other: {
        text: 'Khác',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
        icon: <User className='w-3 h-3' />
      }
    }
    return configs[type as keyof typeof configs] || configs.other
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        text: 'Chưa xử lý',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-600'
      },
      processing: {
        text: 'Đang xử lý',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600'
      },
      processed: {
        text: 'Đã xử lý',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600'
      },
      not_processed: {
        text: 'Không xử lý',
        bgColor: 'bg-red-100',
        textColor: 'text-red-600'
      }
    }
    return configs[status as keyof typeof configs] || configs.pending
  }

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      searchText === '' ||
      report.id.toLowerCase().includes(searchText.toLowerCase()) ||
      report.customerName.toLowerCase().includes(searchText.toLowerCase())

    const matchesType = typeFilter === 'all' || report.type === typeFilter
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const totalPages = Math.ceil(filteredReports.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentReports = filteredReports.slice(startIndex, endIndex)

  const handleView = (report: Report) => {
    navigate(`/reportDetail/${report.id}`)
  }

  const handleExport = () => {
    console.log('Export to Excel')
  }

  const handleReset = () => {
    setSearchText('')
    setTypeFilter('all')
    setStatusFilter('all')
    setLevelFilter('all')
    setStartDate(undefined)
    setEndDate(undefined)
    setCurrentPage(1)
  }

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <h1 className='text-2xl font-bold text-gray-900'>Quản lý báo cáo</h1>
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
                <label className='block text-sm font-medium text-gray-700 mb-2'>Loại báo cáo</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className='h-10'>
                    <SelectValue placeholder='Tất cả' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả</SelectItem>
                    <SelectItem value='product'>Sản phẩm</SelectItem>
                    <SelectItem value='store'>Cửa hàng</SelectItem>
                    <SelectItem value='transaction'>Giao dịch</SelectItem>
                    <SelectItem value='other'>Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='w-56'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Trạng thái</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='h-10'>
                    <SelectValue placeholder='Tất cả' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả</SelectItem>
                    <SelectItem value='pending'>Chưa xử lý</SelectItem>
                    <SelectItem value='processing'>Đang xử lý</SelectItem>
                    <SelectItem value='processed'>Đã xử lý</SelectItem>
                    <SelectItem value='not_processed'>Không xử lý</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='w-56'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Mức độ</label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className='h-10'>
                    <SelectValue placeholder='Tất cả' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả</SelectItem>
                    <SelectItem value='low'>Thấp</SelectItem>
                    <SelectItem value='medium'>Trung bình</SelectItem>
                    <SelectItem value='high'>Cao</SelectItem>
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
                  onClick={() => {}}
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

      {/* Reports List Section */}
      <Card className='bg-white shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between p-6 border-b border-gray-200'>
          <div>
            <CardTitle className='text-lg font-semibold text-gray-900'>Danh sách báo cáo</CardTitle>
            <p className='text-sm text-gray-600 mt-1'>
              Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredReports.length)} của {filteredReports.length} báo
              cáo
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
                  <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Mã báo cáo</th>
                  <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Khách hàng</th>
                  <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Đối tượng bị báo cáo</th>
                  <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Ngày báo cáo</th>
                  <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Loại</th>
                  <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Trạng thái</th>
                  <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Hành động</th>
                </tr>
              </thead>
              <tbody className='bg-white'>
                {currentReports.map((report) => {
                  const typeConfig = getTypeConfig(report.type)
                  const statusConfig = getStatusConfig(report.status)

                  return (
                    <tr key={report.id} className='border-b border-gray-100 hover:bg-gray-50'>
                      <td className='px-6 py-3'>
                        <span className='text-blue-600 font-medium'>#{report.id}</span>
                      </td>
                      <td className='px-6 py-3'>
                        <div className='flex items-center gap-3'>
                          <Avatar className='w-10 h-10'>
                            <AvatarFallback className='bg-blue-100 text-blue-600 text-sm font-semibold'>
                              {report.customerAvatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='font-medium text-gray-900 text-sm'>{report.customerName}</p>
                            <p className='text-xs text-gray-600'>{report.customerEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-3'>
                        <div>
                          <p className='font-medium text-gray-900 text-sm'>{report.reportedObjectName}</p>
                          <p className='text-xs text-gray-600'>ID: #{report.reportedObjectId}</p>
                        </div>
                      </td>
                      <td className='px-6 py-3'>
                        <span className='text-sm text-gray-700'>{report.reportDate}</span>
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
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
                        >
                          {statusConfig.text}
                        </div>
                      </td>
                      <td className='px-6 py-3'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleView(report)}
                          className='h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full'
                        >
                          <Eye size={16} />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className='flex items-center justify-between px-6 py-4 border-t border-gray-200'>
            <p className='text-sm text-gray-600'>
              Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredReports.length)} của {filteredReports.length} kết
              quả
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
