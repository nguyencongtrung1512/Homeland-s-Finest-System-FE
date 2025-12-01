import { useState, useEffect } from 'react'
import {
  Users,
  Eye,
  Ban,
  CheckCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  XCircle,
  User as UserIcon
} from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog'
import { Calendar } from '../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { Label } from '../../../components/ui/label'
import { getUsers, updateUser, type User } from '../../../apis/user.api'
import { toast } from '../../../utils/toast'
import { formatDate } from '../../../utils/formatDate'
import { Badge } from '../../../components/ui/badge'
import Pagination from '../../../components/Pagination/Pagination'

// Sử dụng User interface từ API, thêm một số field computed
interface Customer extends User {
  name: string // Computed từ firstName + lastName
  phone: string // Alias cho phoneNumber
  joinDate: string // Computed từ createdAt
  status: 'active' | 'temporarily_locked' | 'banned' // Computed từ isActive
}

function CustomerManagement() {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [dateFromOpen, setDateFromOpen] = useState(false)
  const [dateToOpen, setDateToOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Ban states
  const [showBanModal, setShowBanModal] = useState(false)
  const [customerToBan, setCustomerToBan] = useState<Customer | null>(null)
  const [banType, setBanType] = useState<'permanent' | 'temporary'>('permanent')
  const [banDateOption, setBanDateOption] = useState<'7days' | '30days' | 'custom'>('7days')
  const [banUntilDate, setBanUntilDate] = useState<Date | undefined>(undefined)
  const [banUntilOpen, setBanUntilOpen] = useState(false)

  // API states
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Function để transform User data thành Customer format
  const transformUserToCustomer = (user: User): Customer => {
    const firstName = user.firstName || ''
    const lastName = user.lastName || ''
    const fullName = `${firstName} ${lastName}`.trim()

    return {
      ...user,
      name: fullName || 'Không có tên',
      phone: user.phoneNumber || '',
      joinDate: user.createdAt || '',
      status: user.isActive ? 'active' : 'temporarily_locked'
    }
  }

  // Function để fetch users từ API
  const fetchUsers = async () => {
    setLoading(true)
    setError('')

    try {
      // Prepare API parameters - chỉ lấy role customer
      const apiParams: {
        pageSize: number
        pageNumber: number
        searchTerm?: string
        role?: string
        isActive?: boolean
      } = {
        pageSize: 100,
        pageNumber: 1,
        role: 'customer' // Chỉ lấy customer
      }

      // Add search term if provided
      if (searchText.trim()) {
        apiParams.searchTerm = searchText.trim()
      }

      // Add status filter if not 'all'
      if (statusFilter !== 'all') {
        apiParams.isActive = statusFilter === 'active'
      }

      console.log('API params:', apiParams)

      const users = await getUsers(apiParams)

      const transformedCustomers = users.map(transformUserToCustomer)
      console.log('Fetched users:', users.length)
      console.log('Transformed customers:', transformedCustomers.length)
      console.log('Sample customer:', transformedCustomers[0])
      setCustomers(transformedCustomers)
    } catch (err: unknown) {
      const error = err as { message?: string }
      const errorMessage = error.message || 'Có lỗi xảy ra khi tải danh sách người dùng'
      setError(errorMessage)
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch data khi component mount và khi có thay đổi filter
  useEffect(() => {
    fetchUsers()
  }, [searchText, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge className='bg-green-100 text-green-800 hover:bg-green-100'>
          <CheckCircle className='w-3 h-3 mr-1' />
          Hoạt động
        </Badge>
      )
    } else {
      return (
        <Badge className='bg-red-100 text-red-800 hover:bg-red-100'>
          <XCircle className='w-3 h-3 mr-1' />
          Không hoạt động
        </Badge>
      )
    }
  }

  // Filter customers by date range
  const filterByDateRange = (customers: Customer[]) => {
    if (!dateFrom && !dateTo) return customers

    return customers.filter((customer) => {
      const customerDate = new Date(customer.createdAt)
      customerDate.setHours(0, 0, 0, 0)

      if (dateFrom && dateTo) {
        const from = new Date(dateFrom)
        from.setHours(0, 0, 0, 0)
        const to = new Date(dateTo)
        to.setHours(23, 59, 59, 999)
        return customerDate >= from && customerDate <= to
      } else if (dateFrom) {
        const from = new Date(dateFrom)
        from.setHours(0, 0, 0, 0)
        return customerDate >= from
      } else if (dateTo) {
        const to = new Date(dateTo)
        to.setHours(23, 59, 59, 999)
        return customerDate <= to
      }
      return true
    })
  }

  // Calculate summary statistics
  const filteredCustomers = filterByDateRange(customers)
  const totalPages = Math.ceil(filteredCustomers.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex)

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowDetailModal(true)
  }

  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (customerToDelete) {
      setActionLoading(true)
      try {
        await updateUser(customerToDelete.id, {
          isActive: false
        })

        toast.success(`Đã xóa tài khoản ${customerToDelete.name}`, {
          position: 'top-right',
          autoClose: 3000
        })

        // Refresh data
        await fetchUsers()
      } catch (err: unknown) {
        const error = err as { message?: string }
        const errorMessage = error.message || 'Có lỗi xảy ra khi xóa tài khoản'
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 5000
        })
      } finally {
        setActionLoading(false)
        setShowDeleteConfirm(false)
        setCustomerToDelete(null)
      }
    }
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedCustomer(null)
  }

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false)
    setCustomerToDelete(null)
  }

  // Handle ban
  const handleBan = (customer: Customer) => {
    setCustomerToBan(customer)
    setBanType('permanent')
    setBanDateOption('7days')
    setBanUntilDate(undefined)
    setShowBanModal(true)
  }

  // Calculate ban until date based on option
  const calculateBanUntilDate = (option: '7days' | '30days' | 'custom', customDate?: Date): Date | undefined => {
    if (option === 'custom' && customDate) {
      return customDate
    }
    if (option === '7days') {
      const date = new Date()
      date.setDate(date.getDate() + 7)
      return date
    }
    if (option === '30days') {
      const date = new Date()
      date.setDate(date.getDate() + 30)
      return date
    }
    return undefined
  }

  // Update banUntilDate when banDateOption changes
  useEffect(() => {
    if (banType === 'temporary' && banDateOption !== 'custom') {
      const calculatedDate = calculateBanUntilDate(banDateOption)
      setBanUntilDate(calculatedDate)
    } else if (banDateOption === 'custom') {
      // Keep custom date if user has selected one
      // Don't override if user already selected a custom date
    }
  }, [banDateOption, banType])

  const confirmBan = async () => {
    if (customerToBan) {
      setActionLoading(true)
      try {
        // Khi ban: tự động set isActive = false
        const updateData: {
          isActive: boolean
          role: string
          banUntil?: string | null
        } = {
          isActive: false, // Tự động set isActive = false khi ban
          role: 'Customer'
        }

        if (banType === 'temporary') {
          // Ban tạm thời: tính toán ngày dựa trên option
          let finalDate: Date | undefined
          if (banDateOption === 'custom' && banUntilDate) {
            finalDate = banUntilDate
          } else if (banDateOption !== 'custom') {
            finalDate = calculateBanUntilDate(banDateOption)
          }

          if (finalDate) {
            // Set time to end of day (23:59:59)
            finalDate.setHours(23, 59, 59, 999)
            updateData.banUntil = finalDate.toISOString()
          }
        }
        // Ban vĩnh viễn: không truyền banUntil vào data (undefined)

        await updateUser(customerToBan.id, updateData)

        toast.success(`Đã ${banType === 'permanent' ? 'cấm vĩnh viễn' : 'cấm có thời hạn'} ${customerToBan.name}`, {
          position: 'top-right',
          autoClose: 3000
        })

        // Refresh data
        await fetchUsers()
        setShowBanModal(false)
        setCustomerToBan(null)
        setBanType('permanent')
        setBanUntilDate(undefined)
      } catch (err: unknown) {
        const error = err as { message?: string }
        const errorMessage = error.message || 'Có lỗi xảy ra khi khóa khách hàng'
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 5000
        })
      } finally {
        setActionLoading(false)
      }
    }
  }

  // Handle unban
  const handleUnban = async (customer: Customer) => {
    setActionLoading(true)
    try {
      // Khi unban: tự động set isActive = true và không truyền data vào banUntil
      await updateUser(customer.id, {
        banUntil: null,
        isActive: true, // Tự động set isActive = true khi unban
        role: 'Customer'
      })

      toast.success(`Đã mở khóa ${customer.name}`, {
        position: 'top-right',
        autoClose: 3000
      })

      // Refresh data
      await fetchUsers()
    } catch (err: unknown) {
      const error = err as { message?: string }
      const errorMessage = error.message || 'Có lỗi xảy ra khi mở khóa khách hàng'
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      })
    } finally {
      setActionLoading(false)
    }
  }

  const closeBanModal = () => {
    setShowBanModal(false)
    setCustomerToBan(null)
    setBanType('permanent')
    setBanDateOption('7days')
    setBanUntilDate(undefined)
  }

  // Calculate summary statistics
  const totalCustomers = customers.length

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Quản lý khách hàng</h1>
          <p className='text-gray-600 mt-1'>Quản lý thông tin và trạng thái của các khách hàng</p>
        </div>
        <div className='flex items-center space-x-2'>
          <Users className='w-8 h-8 text-blue-600' />
          <span className='text-2xl font-bold text-blue-600'>{filteredCustomers.length}</span>
          <span className='text-sm text-gray-500'>/ {totalCustomers} tổng</span>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>{error}</div>}

      {/* Filters */}
      <Card>
        <CardContent>
          <div className='flex flex-col sm:flex-row gap-4 items-end'>
            <div className='flex-1 py-5'>
              <Label className='text-sm font-medium text-gray-700 mb-2'>Tìm kiếm</Label>
              <div className='w-full sm:w-120'>
                <Input
                  placeholder='Tìm kiếm theo tên, email, số điện thoại...'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchUsers()}
                  className='w-full'
                />
              </div>
            </div>
            <div className='w-full sm:w-48 py-5'>
              <Label className='text-sm font-medium text-gray-700 mb-2'>Trạng thái</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả</SelectItem>
                  <SelectItem value='active'>Hoạt động</SelectItem>
                  <SelectItem value='inactive'>Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='w-full sm:w-48 py-5'>
              <Label className='text-sm font-medium text-gray-700 mb-2'>Từ ngày</Label>
              <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                <PopoverTrigger asChild>
                  <Button variant='outline' className='w-full justify-start text-left font-normal'>
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'Chọn ngày bắt đầu'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={dateFrom}
                    onSelect={(date) => {
                      setDateFrom(date)
                      setDateFromOpen(false)
                    }}
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(23, 59, 59, 999)
                      return date > today
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className='w-full sm:w-48 py-5'>
              <Label className='text-sm font-medium text-gray-700 mb-2'>Đến ngày</Label>
              <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                <PopoverTrigger asChild>
                  <Button variant='outline' className='w-full justify-start text-left font-normal'>
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'Chọn ngày kết thúc'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={dateTo}
                    onSelect={(date) => {
                      setDateTo(date)
                      setDateToOpen(false)
                    }}
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(23, 59, 59, 999)
                      // Không cho chọn ngày trong tương lai
                      if (date > today) return true
                      // Không cho chọn ngày trước dateFrom nếu đã chọn
                      if (dateFrom) {
                        const from = new Date(dateFrom)
                        from.setHours(0, 0, 0, 0)
                        return date < from
                      }
                      return false
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {(dateFrom || dateTo) && (
              <div>
                <Button
                  variant='outline'
                  onClick={() => {
                    setDateFrom(undefined)
                    setDateTo(undefined)
                  }}
                >
                  Xóa lọc ngày
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customers List Section */}
      <Card>
        <CardHeader className='py-2'>
          <CardTitle>Danh sách khách hàng</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex justify-center items-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Email / Số điện thoại</TableHead>
                    <TableHead>Vi phạm</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center py-12 text-gray-500'>
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className='flex items-center space-x-3'>
                            <Avatar className='w-10 h-10'>
                              <AvatarImage src={customer.avatar || undefined} alt={customer.name} />
                              <AvatarFallback className='bg-blue-100 text-blue-600 text-sm font-semibold flex items-center justify-center'>
                                {customer.name && customer.name.trim() ? (
                                  customer.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)
                                ) : (
                                  <UserIcon className='w-5 h-5' />
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className='font-medium'>{customer.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='space-y-1'>
                            <div className='text-sm font-medium'>{customer.email}</div>
                            <div className='text-sm text-gray-500'>{customer.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='text-sm text-center'>{customer.violationCount}</div>
                        </TableCell>
                        <TableCell>{getStatusBadge(customer.isActive)}</TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleView(customer)}
                              className='flex items-center'
                            >
                              <Eye className='w-4 h-4 mr-2' />
                              Xem chi tiết
                            </Button>
                            {customer.isActive ? (
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => handleBan(customer)}
                                className='text-orange-600 hover:text-orange-800 hover:bg-orange-50 flex items-center'
                              >
                                <Ban className='w-4 h-4 mr-2' />
                                Khóa
                              </Button>
                            ) : (
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => handleUnban(customer)}
                                className='text-blue-600 hover:text-blue-800 hover:bg-blue-50 flex items-center'
                              >
                                <CheckCircle className='w-4 h-4 mr-2' />
                                Mở khóa
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            maxVisiblePages={2}
          />
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className='sm:max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Thông tin cơ bản</DialogTitle>
            <DialogDescription>Thông tin chi tiết về khách hàng {selectedCustomer?.name}</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className='space-y-6'>
              {/* Thông tin cơ bản */}
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>Thông tin cá nhân</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Họ tên</label>
                    <div className='bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-900'>{selectedCustomer.name}</div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
                    <div className='bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-900'>{selectedCustomer.email}</div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Số điện thoại</label>
                    <div className='bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-900'>{selectedCustomer.phone}</div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Ngày tham gia</label>
                    <div className='bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-900'>{formatDate(selectedCustomer.createdAt)}</div>
                  </div>
                </div>
              </div>

              {/* Thông tin khóa */}
              {!selectedCustomer.isActive && (selectedCustomer.banAt || selectedCustomer.banUntil) && (
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Thông tin khóa</h3>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    {selectedCustomer.banAt && (
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Ngày bị khóa</label>
                        <div className='bg-red-50 px-3 py-2 rounded-md text-sm text-red-900'>{formatDate(selectedCustomer.banAt)}</div>
                      </div>
                    )}

                    {selectedCustomer.banUntil && (
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Ngày hết hạn khóa</label>
                        <div className='bg-orange-50 px-3 py-2 rounded-md text-sm text-orange-900'>
                          {formatDate(selectedCustomer.banUntil)}
                        </div>
                      </div>
                    )}

                    {!selectedCustomer.banUntil && selectedCustomer.banAt && (
                      <div className='sm:col-span-2'>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Trạng thái khóa</label>
                        <div className='bg-red-50 px-3 py-2 rounded-md text-sm text-red-900 font-semibold'>Khóa vĩnh viễn</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Thông tin khác */}
              {selectedCustomer.violationCount !== undefined && (
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Thông tin khác</h3>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Số lần phạm</label>
                      <div className='bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-900'>{selectedCustomer.violationCount}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className='flex gap-2'>
            <Button variant='outline' onClick={closeDetailModal}>
              Đóng
            </Button>
            {selectedCustomer && selectedCustomer.isActive && (
              <Button
                variant='destructive'
                onClick={() => {
                  closeDetailModal()
                  handleDelete(selectedCustomer)
                }}
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang xử lý...' : 'Xóa tài khoản'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa tài khoản</DialogTitle>
            <DialogDescription>
              {customerToDelete && (
                <>
                  Bạn có muốn xóa tài khoản <span className='font-semibold'>{customerToDelete.name}</span> không?
                  <br />
                  <span className='text-sm text-gray-500 mt-2 block'>
                    Tài khoản sẽ bị vô hiệu hóa và không thể đăng nhập vào hệ thống.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant='outline' onClick={closeDeleteConfirm} disabled={actionLoading}>
              Hủy
            </Button>
            <Button onClick={confirmDelete} className='bg-red-600 hover:bg-red-700 text-white' disabled={actionLoading}>
              {actionLoading ? 'Đang xử lý...' : 'Xóa tài khoản'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Modal */}
      <Dialog open={showBanModal} onOpenChange={setShowBanModal}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center'>
              <Ban className='w-5 h-5 mr-2 text-orange-600' />
              Khóa khách hàng
            </DialogTitle>
            <DialogDescription>
              {customerToBan && (
                <>
                  Bạn đang khóa khách hàng <span className='font-semibold'>{customerToBan.name}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {customerToBan && (
            <div className='space-y-4 py-4'>
              <div className='space-y-3'>
                <Label>Loại khóa</Label>
                <div className='space-y-2'>
                  <label className='flex items-center space-x-2 cursor-pointer'>
                    <input
                      type='radio'
                      name='banType'
                      value='permanent'
                      checked={banType === 'permanent'}
                      onChange={(e) => setBanType(e.target.value as 'permanent' | 'temporary')}
                      className='h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300'
                    />
                    <span className='text-sm text-gray-900'>Khóa vĩnh viễn</span>
                  </label>
                  <label className='flex items-center space-x-2 cursor-pointer'>
                    <input
                      type='radio'
                      name='banType'
                      value='temporary'
                      checked={banType === 'temporary'}
                      onChange={(e) => setBanType(e.target.value as 'permanent' | 'temporary')}
                      className='h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300'
                    />
                    <span className='text-sm text-gray-900'>Khóa có thời hạn</span>
                  </label>
                </div>
              </div>

              {banType === 'temporary' && (
                <div className='space-y-3'>
                  <Label>Chọn thời hạn khóa</Label>
                  <div className='space-y-2'>
                    <label className='flex items-center space-x-2 cursor-pointer'>
                      <input
                        type='radio'
                        name='banDateOption'
                        value='7days'
                        checked={banDateOption === '7days'}
                        onChange={(e) => setBanDateOption(e.target.value as '7days' | '30days' | 'custom')}
                        className='h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300'
                      />
                      <span className='text-sm text-gray-900'>7 ngày</span>
                    </label>
                    <label className='flex items-center space-x-2 cursor-pointer'>
                      <input
                        type='radio'
                        name='banDateOption'
                        value='30days'
                        checked={banDateOption === '30days'}
                        onChange={(e) => setBanDateOption(e.target.value as '7days' | '30days' | 'custom')}
                        className='h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300'
                      />
                      <span className='text-sm text-gray-900'>30 ngày</span>
                    </label>
                    <label className='flex items-center space-x-2 cursor-pointer'>
                      <input
                        type='radio'
                        name='banDateOption'
                        value='custom'
                        checked={banDateOption === 'custom'}
                        onChange={(e) => setBanDateOption(e.target.value as '7days' | '30days' | 'custom')}
                        className='h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300'
                      />
                      <span className='text-sm text-gray-900'>Chọn ngày tùy ý</span>
                    </label>
                  </div>

                  {banDateOption === 'custom' && (
                    <div className='space-y-2'>
                      <Label>Ngày hết hạn khóa</Label>
                      <Popover open={banUntilOpen} onOpenChange={setBanUntilOpen}>
                        <PopoverTrigger asChild>
                          <Button variant='outline' className='w-full justify-start text-left font-normal'>
                            <CalendarIcon className='mr-2 h-4 w-4' />
                            {banUntilDate ? format(banUntilDate, 'dd/MM/yyyy') : 'Chọn ngày hết hạn'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={banUntilDate}
                            onSelect={(date) => {
                              setBanUntilDate(date)
                              setBanUntilOpen(false)
                            }}
                            disabled={(date) => date <= new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {banDateOption !== 'custom' && banUntilDate && (
                    <div className='text-sm text-gray-600'>
                      Khách hàng sẽ bị khóa đến ngày: <span className='font-semibold'>{format(banUntilDate, 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                </div>
              )}

              {banType === 'permanent' && (
                <div className='rounded-md bg-orange-50 p-3 text-sm text-orange-800'>
                  <AlertCircle className='w-4 h-4 inline mr-2' />
                  Khách hàng sẽ bị khóa vĩnh viễn và không thể đăng nhập vào hệ thống.
                </div>
              )}

              {banType === 'temporary' && banUntilDate && (
                <div className='rounded-md bg-blue-50 p-3 text-sm text-blue-800'>
                  <AlertCircle className='w-4 h-4 inline mr-2' />
                  Khách hàng sẽ bị khóa đến ngày {format(banUntilDate, 'dd/MM/yyyy')}.
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant='outline' onClick={closeBanModal} disabled={actionLoading}>
              Hủy
            </Button>
            <Button
              onClick={confirmBan}
              variant='red'
              disabled={actionLoading || (banType === 'temporary' && banDateOption === 'custom' && !banUntilDate)}
            >
              {actionLoading ? 'Đang xử lý...' : 'Xác nhận khóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CustomerManagement
