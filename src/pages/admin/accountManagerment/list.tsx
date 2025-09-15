import { useState } from 'react'
import { Search, Users, UserX, ChevronLeft, ChevronRight, Lock, Eye } from 'lucide-react'
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

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  joinDate: string
  role: 'admin' | 'staff' | 'customer'
  status: 'active' | 'temporarily_locked' | 'banned'
  orderCount: number
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

  // Mock data
  const customers: Customer[] = [
    {
      id: 'C001',
      name: 'Nguyễn Thị Lan',
      email: 'lan.nguyen@email.com',
      phone: '0912345678',
      avatar: 'NL',
      joinDate: '15/03/2024',
      role: 'admin',
      status: 'active',
      orderCount: 23
    },
    {
      id: 'C002',
      name: 'Trần Minh Tuấn',
      email: 'tuan.tran@email.com',
      phone: '0987654321',
      avatar: 'TT',
      joinDate: '22/02/2024',
      role: 'staff',
      status: 'temporarily_locked',
      orderCount: 15
    },
    {
      id: 'C003',
      name: 'Lê Thị Mai',
      email: 'mai.le@email.com',
      phone: '0901234567',
      avatar: 'LM',
      joinDate: '08/01/2024',
      role: 'customer',
      status: 'banned',
      orderCount: 8
    },
    {
      id: 'C004',
      name: 'Phạm Văn Hùng',
      email: 'hung.pham@email.com',
      phone: '0934567890',
      avatar: 'PH',
      joinDate: '12/04/2024',
      role: 'customer',
      status: 'active',
      orderCount: 31
    },
    {
      id: 'C005',
      name: 'Hoàng Thị Hoa',
      email: 'hoa.hoang@email.com',
      phone: '0945678901',
      avatar: 'HH',
      joinDate: '05/05/2024',
      role: 'customer',
      status: 'active',
      orderCount: 12
    },
    {
      id: 'C006',
      name: 'Vũ Đức Minh',
      email: 'minh.vu@email.com',
      phone: '0956789012',
      avatar: 'VM',
      joinDate: '18/06/2024',
      role: 'staff',
      status: 'active',
      orderCount: 0
    }
  ]

  const getRoleConfig = (role: string) => {
    const configs = {
      admin: {
        text: 'Admin',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600'
      },
      staff: {
        text: 'Nhân viên',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600'
      },
      customer: {
        text: 'Khách hàng',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600'
      }
    }
    return configs[role as keyof typeof configs] || configs.customer
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
    const matchesSearch =
      searchText === '' ||
      customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchText.toLowerCase()) ||
      customer.phone.includes(searchText)

    const matchesRole = roleFilter === 'all' || customer.role === roleFilter
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
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

  const confirmLock = () => {
    if (customerToLock) {
      // Update customer status to locked
      console.log('Locking customer:', customerToLock.name)
      // Here you would typically make an API call to update the customer status
    }
    setShowLockConfirm(false)
    setCustomerToLock(null)
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedCustomer(null)
  }

  const closeLockConfirm = () => {
    setShowLockConfirm(false)
    setCustomerToLock(null)
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
      </div>

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
                  <SelectItem value='admin'>Admin</SelectItem>
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
              {currentCustomers.map((customer) => {
                const roleConfig = getRoleConfig(customer.role)
                const statusConfig = getStatusConfig(customer.status)

                return (
                  <TableRow key={customer.id}>
                    <TableCell className='px-6 py-3'>
                      <div className='flex items-center gap-3'>
                        <Avatar className='w-10 h-10'>
                          <AvatarFallback className='bg-blue-100 text-blue-600 text-sm font-semibold'>
                            {customer.avatar}
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
                          className='text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 text-sm flex items-center gap-1'
                        >
                          <Eye className='w-4 h-4' />
                          Xem chi tiết
                        </Button>
                        {customer.status !== 'banned' && (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleLock(customer)}
                            className='text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 text-sm flex items-center gap-1'
                          >
                            <Lock className='w-4 h-4' />
                            Khóa
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

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

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Số đơn đã mua</label>
                <div className='bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-900'>
                  {selectedCustomer.orderCount} đơn hàng
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant='outline' onClick={closeDetailModal}>
              Đóng
            </Button>
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
                    Người dùng sẽ không thể đăng nhập vào hệ thống sau khi bị khóa.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant='outline' onClick={closeLockConfirm}>
              Hủy
            </Button>
            <Button onClick={confirmLock} className='bg-red-600 hover:bg-red-700 text-white'>
              Khóa tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CustomerManagement
