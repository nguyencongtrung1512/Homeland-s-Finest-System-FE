import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Search, Eye } from 'lucide-react'
import type { OrderListResponse } from '../../../types/orderType'
import { getUsers } from '../../../apis/user.api'
import type { Order, OrderStatus } from '../../../types/orderType'
import type { User } from '../../../apis/user.api'
import axiosInstance from '../../../service/axiosInstance'
import { formatDate } from '../../../utils/formatDate'
import Pagination from '../../../components/Pagination/Pagination'
import Loading from '../../../components/Loading/loading'
import EmptyState from '../../../components/EmptyState/emptyState'
import { toast } from '../../../utils/toast'
import path from '../../../constants/path'

// Status text mapping
const statusTextMap: Record<OrderStatus, string> = {
  NotYet: 'Chưa xử lí',
  Processing: 'Chờ xác nhận',
  PendingPayment: 'Chờ thanh toán',
  Confirmed: 'Đã xác nhận',
  ReadyToPick: 'Đang chuẩn bị hàng',
  Picking: 'Đang trên đường lấy hàng',
  Picked: 'Đã lấy hàng',
  Storing: 'Đang lưu kho',
  Transporting: 'Đang vận chuyển',
  Sorting: 'Đang phân loại',
  Delivering: 'Đang giao hàng',
  Delivered: 'Đã giao hàng',
  Paid: 'Đã thanh toán',
  Refunding: 'Đang hoàn tiền',
  Returning: 'Đang trả hàng',
  Returned: 'Đã trả hàng',
  Refunded: 'Đã hoàn tiền',
  DeliveryFail: 'Giao hàng thất bại',
  Exception: 'Gặp sự cố',
  Damaged: 'Hàng hư hỏng',
  Lost: 'Thất lạc',
  Complaining: 'Đang phản hồi',
  Complained: 'Đã phản hồi',
  Cancel: 'Đã hủy'
}

// Status badge color mapping
const getStatusBadgeColor = (status: OrderStatus): string => {
  switch (status) {
    case 'NotYet':
    case 'Processing':
    case 'PendingPayment':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-100'
    case 'Confirmed':
    case 'ReadyToPick':
    case 'Picking':
    case 'Picked':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
    case 'Storing':
    case 'Transporting':
    case 'Sorting':
    case 'Delivering':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-100'
    case 'Delivered':
    case 'Paid':
      return 'bg-green-100 text-green-800 hover:bg-green-100'
    case 'Cancel':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    case 'Returning':
    case 'Returned':
    case 'Refunded':
    case 'DeliveryFail':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
    case 'Exception':
    case 'Damaged':
    case 'Lost':
    case 'Complaining':
    case 'Complained':
      return 'bg-red-100 text-red-800 hover:bg-red-100'
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
  }
}

function OrderManagementStaff() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 10

  // Load users for filter
  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true)
      const response = await getUsers({ role: 'Customer', pageSize: 1000 })
      setUsers(response || [])
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách khách hàng')
    } finally {
      setUsersLoading(false)
    }
  }, [])

  // Load orders
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      const status = activeTab !== 'all' ? (activeTab as OrderStatus) : undefined

      // Build params object
      const params: Record<string, string | number> = {
        PageSize: pageSize,
        PageNumber: currentPage
      }

      // Add userId only if not 'all'
      if (selectedUserId !== 'all') {
        params.userId = selectedUserId
      }

      // Add status if provided
      if (status) {
        params.Status = status
      }

      // Call API - always use /Order/user-order endpoint
      const response: OrderListResponse = await axiosInstance.get('/Order/user-order', {
        params
      })

      let ordersData = response.data || []

      // Filter by search term on client side if needed
      if (searchTerm) {
        ordersData = ordersData.filter(
          (order) =>
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.ghnorderCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.toName?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      setOrders(ordersData)
      setTotalPages(response.pagination?.totalPages || 1)
    } catch (error: unknown) {
      console.error('Error loading orders:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Có lỗi xảy ra khi tải danh sách đơn hàng'
      toast.error(errorMessage)
      setOrders([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [selectedUserId, activeTab, currentPage, searchTerm, pageSize])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, selectedUserId, searchTerm])

  const tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'Delivered', label: 'Đã giao hàng' },
    { key: 'Paid', label: 'Đã thanh toán' },
    { key: 'Returned', label: 'Đã trả hàng' },
    { key: 'Cancel', label: 'Đã hủy' }
  ]

  const getStatusBadge = (status: OrderStatus) => {
    const statusText = statusTextMap[status] || status
    const badgeColor = getStatusBadgeColor(status)
    return <Badge className={badgeColor}>{statusText}</Badge>
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-bold mb-6'>Quản lý Đơn hàng</h1>

        {/* Filters */}
        <div className='flex flex-wrap items-center gap-4 mb-6'>
          {/* User Filter */}
          <div className='w-full md:w-64'>
            <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={usersLoading}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder={usersLoading ? 'Đang tải...' : 'Chọn khách hàng'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả khách hàng</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Bar */}
          <div className='flex-1 min-w-[150px] relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <Input
              placeholder='Tìm theo Mã đơn hàng hoặc Tên khách hàng...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10 rounded-lg border-gray-300'
            />
          </div>
        </div>

        {/* Tabs */}
        <div className='flex gap-8 border-b border-gray-200 mb-6 overflow-x-auto'>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.key
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <Loading />
      ) : orders.length === 0 ? (
        <EmptyState
          type='orders'
          title='Không có đơn hàng nào'
          description='Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.'
        />
      ) : (
        <>
          <Card>
            <CardContent className='p-0'>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-gray-200'>
                      <th className='text-left py-4 px-6 font-medium text-gray-700'>Mã đơn hàng</th>
                      <th className='text-left py-4 px-6 font-medium text-gray-700'>Ngày đặt</th>
                      <th className='text-left py-4 px-6 font-medium text-gray-700'>Tên khách hàng</th>
                      <th className='text-left py-4 px-6 font-medium text-gray-700'>Tổng tiền</th>
                      <th className='text-left py-4 px-6 font-medium text-gray-700'>Trạng thái</th>
                      <th className='text-left py-4 px-6 font-medium text-gray-700'>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className='border-b border-gray-100 hover:bg-gray-50'>
                        <td className='py-4 px-6 text-gray-900 font-medium'>
                          {order.ghnorderCode || `#${order.id.slice(0, 8)}`}
                        </td>
                        <td className='py-4 px-6 text-gray-700'>{formatDate(order.createdAt)}</td>
                        <td className='py-4 px-6 text-gray-700'>{order.toName || 'N/A'}</td>
                        <td className='py-4 px-6 text-gray-900 font-medium'>
                          {order.finalPrice.toLocaleString('vi-VN')}₫
                        </td>
                        <td className='py-4 px-6'>{getStatusBadge(order.status)}</td>
                        <td className='py-4 px-6'>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-green-600 hover:text-green-700 hover:bg-green-50'
                            onClick={() => navigate(path.orderDetailStaff.replace(':id', order.id))}
                          >
                            <Eye className='w-4 h-4' />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          )}
        </>
      )}
    </div>
  )
}

export default OrderManagementStaff
