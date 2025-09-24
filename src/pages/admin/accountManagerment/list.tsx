import { useState, useEffect } from 'react'
import {
  Search,
  Users,
  UserX,
  ChevronLeft,
  ChevronRight,
  Lock,
  Eye,
  UserPlus,
  Calendar as CalendarIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
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
import { getUsers, updateUser, type User } from '../../../apis/user.api'
import { registerStaff, type StaffRegistrationData } from '../../../apis/auth.api'
import { toast } from 'react-toastify'

// Sử dụng User interface từ API, thêm một số field computed
interface Customer extends User {
  name: string // Computed từ firstName + lastName
  phone: string // Alias cho phoneNumber
  joinDate: string // Computed từ createdAt
  status: 'active' | 'temporarily_locked' | 'banned' // Computed từ isActive
}

function CustomerManagement() {
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showLockConfirm, setShowLockConfirm] = useState(false)
  const [customerToLock, setCustomerToLock] = useState<Customer | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Staff creation states
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false)
  const [staffFormData, setStaffFormData] = useState<StaffRegistrationData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    gender: 'Male',
    phoneNumber: '',
    dateOfBirth: '',
    hireDate: ''
  })
  const [staffFormLoading, setStaffFormLoading] = useState(false)
  const [dateOfBirthOpen, setDateOfBirthOpen] = useState(false)
  const [hireDateOpen, setHireDateOpen] = useState(false)

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
      const users = await getUsers({
        pageSize: 100, // Lấy tất cả users, có thể implement pagination sau
        pageNumber: 1
      })

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

  // Fetch data khi component mount
  useEffect(() => {
    fetchUsers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getRoleConfig = (role: string) => {
    const configs = {
      Staff: {
        text: 'Nhân viên',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600'
      },
      Customer: {
        text: 'Khách hàng',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600'
      }
    }
    return configs[role as keyof typeof configs] || configs.Customer
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      active: {
        text: 'Hoạt động',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600'
      },
      temporarily_locked: {
        text: 'Tạm khóa',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-600'
      },
      banned: {
        text: 'Bị cấm',
        bgColor: 'bg-red-100',
        textColor: 'text-red-600'
      }
    }
    return configs[status as keyof typeof configs] || configs.active
  }

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchText.toLowerCase()
    const matchesSearch =
      searchText === '' ||
      customer.name.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phone.includes(searchText) ||
      (customer.firstName && customer.firstName.toLowerCase().includes(searchLower)) ||
      (customer.lastName && customer.lastName.toLowerCase().includes(searchLower))

    const matchesRole = roleFilter === 'all' || customer.role === roleFilter
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter

    const result = matchesSearch && matchesRole && matchesStatus

    // Debug logging
    if (searchText && result) {
      console.log('Search match found:', {
        searchText,
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          firstName: customer.firstName,
          lastName: customer.lastName
        }
      })
    }

    return result
  })

  const totalPages = Math.ceil(filteredCustomers.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex)

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowDetailModal(true)
  }

  const handleLock = (customer: Customer) => {
    setCustomerToLock(customer)
    setShowLockConfirm(true)
  }

  const confirmLock = async () => {
    if (customerToLock) {
      setActionLoading(true)
      try {
        await updateUser(customerToLock.id, {
          isPermission: false
        })

        toast.success(`Đã khóa quyền hạn của ${customerToLock.name}`, {
          position: 'top-right',
          autoClose: 3000
        })

        // Refresh data
        await fetchUsers()
      } catch (err: unknown) {
        const error = err as { message?: string }
        const errorMessage = error.message || 'Có lỗi xảy ra khi khóa quyền hạn'
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 5000
        })
      } finally {
        setActionLoading(false)
        setShowLockConfirm(false)
        setCustomerToLock(null)
      }
    }
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

  const closeLockConfirm = () => {
    setShowLockConfirm(false)
    setCustomerToLock(null)
  }

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false)
    setCustomerToDelete(null)
  }

  // Staff creation functions
  const handleCreateStaff = () => {
    setShowCreateStaffModal(true)
    // Reset form data
    setStaffFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      gender: 'Male',
      phoneNumber: '',
      dateOfBirth: '',
      hireDate: ''
    })
  }

  const handleStaffFormChange = (field: keyof StaffRegistrationData, value: string) => {
    setStaffFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStaffFormSubmit = async () => {
    // Basic validation
    if (
      !staffFormData.email ||
      !staffFormData.password ||
      !staffFormData.firstName ||
      !staffFormData.lastName ||
      !staffFormData.phoneNumber ||
      !staffFormData.dateOfBirth ||
      !staffFormData.hireDate
    ) {
      toast.error('Vui lòng điền đầy đủ thông tin', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    setStaffFormLoading(true)
    try {
      await registerStaff(staffFormData)

      toast.success('Tạo tài khoản nhân viên thành công!', {
        position: 'top-right',
        autoClose: 3000
      })

      // Close modal and refresh data
      setShowCreateStaffModal(false)
      await fetchUsers()
    } catch (err: unknown) {
      const error = err as { message?: string }
      const errorMessage = error.message || 'Có lỗi xảy ra khi tạo tài khoản nhân viên'
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      })
    } finally {
      setStaffFormLoading(false)
    }
  }

  const closeCreateStaffModal = () => {
    setShowCreateStaffModal(false)
    setStaffFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      gender: 'Male',
      phoneNumber: '',
      dateOfBirth: '',
      hireDate: ''
    })
    setDateOfBirthOpen(false)
    setHireDateOpen(false)
  }

  // Date formatting functions
  const formatDate = (date: Date | undefined): string => {
    if (!date) return ''
    return date.toISOString().split('T')[0] // Format as YYYY-MM-DD
  }

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // Calculate summary statistics
  const totalCustomers = customers.length
  const bannedCustomers = customers.filter((c) => c.status === 'banned').length

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <h1 className='text-2xl font-bold text-gray-900'>Quản lý tài khoản</h1>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            onClick={handleCreateStaff}
            className='bg-green-600 hover:bg-green-700 text-white flex items-center gap-2'
          >
            <UserPlus className='w-4 h-4' />
            Tạo nhân viên
          </Button>
          <Button onClick={fetchUsers} disabled={loading} className='bg-blue-600 hover:bg-blue-700 text-white'>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>{error}</div>}

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card className='bg-white shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Tổng khách hàng</p>
                <p className='text-3xl font-bold text-gray-900'>{totalCustomers.toLocaleString()}</p>
              </div>
              <div className='p-3 bg-blue-100 rounded-full'>
                <Users className='w-6 h-6 text-blue-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Khách hàng bị cấm</p>
                <p className='text-3xl font-bold text-gray-900'>{bannedCustomers}</p>
              </div>
              <div className='p-3 bg-red-100 rounded-full'>
                <UserX className='w-6 h-6 text-red-600' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Section */}
      <Card className='bg-white shadow-sm'>
        <CardContent className='p-6'>
          <div className='flex items-end gap-4'>
            {/* Search Bar */}
            <div className='flex-1'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Tìm kiếm</label>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                <Input
                  placeholder='Tìm kiếm khách hàng...'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className='pl-10 h-10'
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className='w-48'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Vai trò</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className='h-10'>
                  <SelectValue placeholder='Tất cả vai trò' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả vai trò</SelectItem>
                  <SelectItem value='staff'>Nhân viên</SelectItem>
                  <SelectItem value='customer'>Khách hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className='w-48'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Trạng thái</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='h-10'>
                  <SelectValue placeholder='Tất cả trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                  <SelectItem value='active'>Hoạt động</SelectItem>
                  <SelectItem value='temporarily_locked'>Tạm khóa</SelectItem>
                  <SelectItem value='banned'>Bị cấm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers List Section */}
      <Card className='bg-white shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between p-6 border-b border-gray-200'>
          <div>
            <CardTitle className='text-lg font-semibold text-gray-900'>Danh sách khách hàng</CardTitle>
            <p className='text-sm text-gray-600 mt-1'>
              Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredCustomers.length)} của {filteredCustomers.length}{' '}
              khách hàng
            </p>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
                <p className='text-gray-600'>Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='px-6 py-3'>Tên khách hàng</TableHead>
                  <TableHead className='px-6 py-3'>Email / SDT</TableHead>
                  <TableHead className='px-6 py-3'>Ngày tham gia</TableHead>
                  <TableHead className='px-6 py-3'>Vai trò</TableHead>
                  <TableHead className='px-6 py-3'>Trạng thái</TableHead>
                  <TableHead className='px-6 py-3'>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='text-center py-12 text-gray-500'>
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  currentCustomers.map((customer) => {
                    const roleConfig = getRoleConfig(customer.role)
                    const statusConfig = getStatusConfig(customer.status)

                    return (
                      <TableRow key={customer.id}>
                        <TableCell className='px-6 py-3'>
                          <div className='flex items-center gap-3'>
                            <Avatar className='w-10 h-10'>
                              <AvatarFallback className='bg-blue-100 text-blue-600 text-sm font-semibold'>
                                {customer.avatar ||
                                  customer.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className='font-medium text-gray-900 text-sm'>{customer.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='px-6 py-3'>
                          <div>
                            <p className='font-medium text-gray-900 text-sm'>{customer.email}</p>
                            <p className='text-xs text-gray-600'>{customer.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell className='px-6 py-3'>
                          <span className='text-sm text-gray-700'>{customer.joinDate}</span>
                        </TableCell>
                        <TableCell className='px-6 py-3'>
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${roleConfig.bgColor} ${roleConfig.textColor}`}
                          >
                            {roleConfig.text}
                          </div>
                        </TableCell>
                        <TableCell className='px-6 py-3'>
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
                          >
                            {statusConfig.text}
                          </div>
                        </TableCell>
                        <TableCell className='px-6 py-3'>
                          <div className='flex items-center gap-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleView(customer)}
                              className='text-black hover:text-blue-800 hover:bg-blue-50 px-3 py-1 text-sm flex items-center gap-1'
                            >
                              <Eye className='w-4 h-4' />
                              Xem chi tiết
                            </Button>
                            {customer.isPermission && (
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => handleLock(customer)}
                                className='text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 text-sm flex items-center gap-1'
                              >
                                <Lock className='w-4 h-4' />
                                Khóa quyền hạn
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          <div className='flex items-center justify-between px-6 py-4 border-t border-gray-200'>
            <p className='text-sm text-gray-600'>
              Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredCustomers.length)} của {filteredCustomers.length}{' '}
              kết quả
            </p>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className='h-8 px-3 flex items-center gap-1'
              >
                <ChevronLeft className='w-4 h-4' />
                Trước
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
                className='h-8 px-3 flex items-center gap-1'
              >
                Sau
                <ChevronRight className='w-4 h-4' />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Thông tin cơ bản</DialogTitle>
            <DialogDescription>Thông tin chi tiết về khách hàng {selectedCustomer?.name}</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className='space-y-4'>
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
                <div className='bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-900'>{selectedCustomer.joinDate}</div>
              </div>

              {/* <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Số đơn đã mua</label>
                <div className='bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-900'>
                  {selectedCustomer.orderCount} đơn hàng
                </div>
              </div> */}
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

      {/* Lock Confirmation Modal */}
      <Dialog open={showLockConfirm} onOpenChange={setShowLockConfirm}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Xác nhận khóa tài khoản</DialogTitle>
            <DialogDescription>
              {customerToLock && (
                <>
                  Bạn có muốn khóa người dùng <span className='font-semibold'>{customerToLock.name}</span> không?
                  <br />
                  <span className='text-sm text-gray-500 mt-2 block'>
                    Người dùng sẽ không thể thực hiện các chức năng trên hệ thống sau khi bị khóa.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant='outline' onClick={closeLockConfirm} disabled={actionLoading}>
              Hủy
            </Button>
            <Button onClick={confirmLock} className='bg-red-600 hover:bg-red-700 text-white' disabled={actionLoading}>
              {actionLoading ? 'Đang xử lý...' : 'Khóa quyền hạn'}
            </Button>
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

      {/* Create Staff Modal */}
      <Dialog open={showCreateStaffModal} onOpenChange={setShowCreateStaffModal}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Tạo tài khoản nhân viên</DialogTitle>
            <DialogDescription>Điền thông tin để tạo tài khoản nhân viên mới</DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {/* First Name and Last Name */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Họ *</label>
                <Input
                  type='text'
                  placeholder='Nhập họ'
                  value={staffFormData.firstName}
                  onChange={(e) => handleStaffFormChange('firstName', e.target.value)}
                  className='h-10'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Tên *</label>
                <Input
                  type='text'
                  placeholder='Nhập tên'
                  value={staffFormData.lastName}
                  onChange={(e) => handleStaffFormChange('lastName', e.target.value)}
                  className='h-10'
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Email *</label>
              <Input
                type='email'
                placeholder='Nhập email nhân viên'
                value={staffFormData.email}
                onChange={(e) => handleStaffFormChange('email', e.target.value)}
                className='h-10'
              />
            </div>

            {/* Password */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Mật khẩu *</label>
              <Input
                type='password'
                placeholder='Nhập mật khẩu'
                value={staffFormData.password}
                onChange={(e) => handleStaffFormChange('password', e.target.value)}
                className='h-10'
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Số điện thoại *</label>
              <Input
                type='tel'
                placeholder='Nhập số điện thoại'
                value={staffFormData.phoneNumber}
                onChange={(e) => handleStaffFormChange('phoneNumber', e.target.value)}
                className='h-10'
              />
            </div>

            {/* Gender */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Giới tính *</label>
              <Select value={staffFormData.gender} onValueChange={(value) => handleStaffFormChange('gender', value)}>
                <SelectTrigger className='h-10'>
                  <SelectValue placeholder='Chọn giới tính' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Male'>Nam</SelectItem>
                  <SelectItem value='Female'>Nữ</SelectItem>
                  <SelectItem value='Other'>Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date of Birth */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Ngày sinh *</label>
              <Popover open={dateOfBirthOpen} onOpenChange={setDateOfBirthOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={`w-full h-10 justify-start text-left font-normal ${!staffFormData.dateOfBirth ? 'text-muted-foreground' : ''
                      }`}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {staffFormData.dateOfBirth ? formatDisplayDate(staffFormData.dateOfBirth) : 'Chọn ngày sinh'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={staffFormData.dateOfBirth ? new Date(staffFormData.dateOfBirth) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleStaffFormChange('dateOfBirth', formatDate(date))
                        setDateOfBirthOpen(false)
                      }
                    }}
                    disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                    captionLayout='dropdown'
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Hire Date */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Ngày tuyển dụng *</label>
              <Popover open={hireDateOpen} onOpenChange={setHireDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={`w-full h-10 justify-start text-left font-normal ${!staffFormData.hireDate ? 'text-muted-foreground' : ''
                      }`}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {staffFormData.hireDate ? formatDisplayDate(staffFormData.hireDate) : 'Chọn ngày tuyển dụng'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={staffFormData.hireDate ? new Date(staffFormData.hireDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleStaffFormChange('hireDate', formatDate(date))
                        setHireDateOpen(false)
                      }
                    }}
                    disabled={(date) => date < new Date('2020-01-01')}
                    captionLayout='dropdown'
                    fromYear={2020}
                    toYear={new Date().getFullYear() + 1}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter className='flex gap-2'>
            <Button variant='outline' onClick={closeCreateStaffModal} disabled={staffFormLoading}>
              Hủy
            </Button>
            <Button
              onClick={handleStaffFormSubmit}
              className='bg-green-600 hover:bg-green-700 text-white'
              disabled={staffFormLoading}
            >
              {staffFormLoading ? 'Đang tạo...' : 'Tạo nhân viên'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CustomerManagement
