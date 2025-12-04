import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Search, Eye, PieChart, Calendar, Loader2 } from 'lucide-react'
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
import { getPaymentMethodDistribution, type PaymentMethodDistributionResponse } from '../../../apis/walletDashboard.api'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Pie } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

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

  // Payment method distribution stats
  const [paymentStats, setPaymentStats] = useState<PaymentMethodDistributionResponse | null>(null)
  const [paymentStatsLoading, setPaymentStatsLoading] = useState(false)
  const [startDate, setStartDate] = useState<string>('') // Empty = get all
  const [endDate, setEndDate] = useState<string>('') // Empty = get all
  const [showStats, setShowStats] = useState(false)

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

  // Fetch payment method distribution
  const fetchPaymentStats = useCallback(async () => {
    try {
      setPaymentStatsLoading(true)
      // Nếu không có startDate hoặc endDate thì gọi get all (không truyền params)
      const response = await getPaymentMethodDistribution(
        undefined,
        startDate || undefined,
        endDate || undefined
      )
      if (response.status === 200 && response.data) {
        setPaymentStats(response.data)
      }
    } catch (err) {
      console.error('Error fetching payment stats:', err)
      toast.error('Không thể tải thống kê phương thức thanh toán')
    } finally {
      setPaymentStatsLoading(false)
    }
  }, [startDate, endDate])

  // Fetch payment stats when section is opened (auto fetch all if no dates)
  useEffect(() => {
    if (showStats) {
      fetchPaymentStats()
    }
  }, [showStats]) // eslint-disable-line react-hooks/exhaustive-deps

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Prepare chart data for payment method distribution
  const paymentChartData = useMemo(() => {
    if (!paymentStats) return null

    // Backend có thể trả về camelCase hoặc PascalCase, cần handle cả 2
    const stats = paymentStats as any
    const banking = stats.Banking || stats.banking || {}
    const cod = stats.COD || stats.cod || {}
    const myWallet = stats.MyWallet || stats.myWallet || {}

    return {
      labels: ['Banking', 'COD', 'MyWallet'],
      datasets: [
        {
          label: 'Doanh thu (VNĐ)',
          data: [
            banking.Revenue || banking.revenue || 0,
            cod.Revenue || cod.revenue || 0,
            myWallet.Revenue || myWallet.revenue || 0
          ],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)', // Banking - Blue
            'rgba(34, 197, 94, 0.8)',  // COD - Green
            'rgba(249, 115, 22, 0.8)'  // MyWallet - Orange
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(34, 197, 94)',
            'rgb(249, 115, 22)'
          ],
          borderWidth: 2
        }
      ]
    }
  }, [paymentStats])

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
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-2xl font-bold'>Quản lý Đơn hàng</h1>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant='outline'
              onClick={() => setShowStats(!showStats)}
              className='flex items-center gap-2'
            >
              <PieChart className='w-4 h-4' />
              {showStats ? 'Ẩn thống kê' : 'Xem thống kê'}
            </Button>
          </motion.div>
        </div>

        {/* Payment Method Statistics Section */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className='overflow-hidden mb-6'
            >
              <Card className='mb-6'>
                <CardHeader>
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <CardTitle className='flex items-center gap-2'>
                      <PieChart className='w-5 h-5' />
                      Thống kê phương thức thanh toán
                    </CardTitle>
                    <CardDescription>Phân bổ doanh thu và số lượng đơn hàng theo phương thức thanh toán</CardDescription>
                  </motion.div>
                </CardHeader>
                <CardContent>
                  {/* Date Range Selector */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className='flex flex-col sm:flex-row gap-4 mb-6'
                  >
                    <div className='flex-1'>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        <Calendar className='w-4 h-4 inline mr-1' />
                        Từ ngày (để trống = tất cả)
                      </label>
                      <Input
                        type='date'
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className='w-full'
                      />
                    </div>
                    <div className='flex-1'>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        <Calendar className='w-4 h-4 inline mr-1' />
                        Đến ngày (để trống = tất cả)
                      </label>
                      <Input
                        type='date'
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className='w-full'
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className='flex items-end gap-2'>
                      <Button
                        variant='outline'
                        onClick={() => {
                          setStartDate('')
                          setEndDate('')
                        }}
                        className='w-full sm:w-auto'
                        disabled={paymentStatsLoading}
                      >
                        Xóa ngày
                      </Button>
                      <Button
                        onClick={fetchPaymentStats}
                        disabled={paymentStatsLoading}
                        className='w-full sm:w-auto'
                        variant='yellow'
                      >
                        {paymentStatsLoading ? (
                          <>
                            <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                            Đang tải...
                          </>
                        ) : startDate || endDate ? (
                          'Tải thống kê'
                        ) : (
                          'Tải tất cả'
                        )}
                      </Button>
                    </div>
                  </motion.div>

                  {/* Stats Display */}
                  <AnimatePresence mode='wait'>
                    {paymentStatsLoading ? (
                      <motion.div
                        key='loading'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className='flex items-center justify-center py-12'
                      >
                        <Loader2 className='w-8 h-8 animate-spin text-green-600' />
                        <span className='ml-2 text-gray-600'>Đang tải thống kê...</span>
                      </motion.div>
                    ) : paymentStats ? (
                      <motion.div
                        key='stats'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className='grid grid-cols-1 lg:grid-cols-2 gap-6'
                      >
                        {/* Pie Chart */}
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <h3 className='text-lg font-semibold mb-4'>Phân bổ doanh thu</h3>
                          {paymentChartData && (
                            <motion.div
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.4 }}
                              className='h-[300px]'
                            >
                              <Pie
                                data={paymentChartData}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      position: 'bottom'
                                    },
                                    tooltip: {
                                      callbacks: {
                                        label: function (context) {
                                          const label = context.label || ''
                                          const value = context.parsed || 0
                                          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                                          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                                          return `${label}: ${formatCurrency(value)} (${percentage}%)`
                                        }
                                      }
                                    }
                                  }
                                }}
                              />
                            </motion.div>
                          )}
                        </motion.div>

                        {/* Stats Cards */}
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                          className='space-y-4'
                        >
                          <h3 className='text-lg font-semibold mb-4'>Chi tiết thống kê</h3>

                          {/* Total Stats */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className='p-4 bg-gray-50 rounded-lg border'
                          >
                            <div className='flex justify-between items-center mb-2'>
                              <span className='text-sm font-medium text-gray-600'>Tổng doanh thu</span>
                              <span className='text-lg font-bold text-gray-900'>
                                {formatCurrency((paymentStats as any).TotalRevenue || (paymentStats as any).totalRevenue || 0)}
                              </span>
                            </div>
                            <div className='flex justify-between items-center'>
                              <span className='text-sm font-medium text-gray-600'>Tổng số đơn hàng</span>
                              <span className='text-lg font-bold text-gray-900'>
                                {((paymentStats as any).TotalOrders || (paymentStats as any).totalOrders || 0).toLocaleString('vi-VN')}
                              </span>
                            </div>
                          </motion.div>

                          {/* Banking */}
                          {(() => {
                            const stats = paymentStats as any
                            const banking = stats.Banking || stats.banking || {}
                            return (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className='p-4 bg-blue-50 rounded-lg border border-blue-200'
                              >
                                <div className='flex items-center justify-between mb-3'>
                                  <span className='font-semibold text-blue-900'>Banking</span>
                                  <span className='text-sm text-blue-700'>
                                    {(banking.Percentage || banking.percentage || 0).toFixed(1)}%
                                  </span>
                                </div>
                                <div className='space-y-2'>
                                  <div className='flex justify-between text-sm'>
                                    <span className='text-gray-600'>Doanh thu:</span>
                                    <span className='font-medium'>{formatCurrency(banking.Revenue || banking.revenue || 0)}</span>
                                  </div>
                                  <div className='flex justify-between text-sm'>
                                    <span className='text-gray-600'>Số đơn:</span>
                                    <span className='font-medium'>
                                      {(banking.OrderCount || banking.orderCount || 0).toLocaleString('vi-VN')}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })()}

                          {/* COD */}
                          {(() => {
                            const stats = paymentStats as any
                            const cod = stats.COD || stats.cod || {}
                            return (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className='p-4 bg-green-50 rounded-lg border border-green-200'
                              >
                                <div className='flex items-center justify-between mb-3'>
                                  <span className='font-semibold text-green-900'>COD</span>
                                  <span className='text-sm text-green-700'>
                                    {(cod.Percentage || cod.percentage || 0).toFixed(1)}%
                                  </span>
                                </div>
                                <div className='space-y-2'>
                                  <div className='flex justify-between text-sm'>
                                    <span className='text-gray-600'>Doanh thu:</span>
                                    <span className='font-medium'>{formatCurrency(cod.Revenue || cod.revenue || 0)}</span>
                                  </div>
                                  <div className='flex justify-between text-sm'>
                                    <span className='text-gray-600'>Số đơn:</span>
                                    <span className='font-medium'>
                                      {(cod.OrderCount || cod.orderCount || 0).toLocaleString('vi-VN')}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })()}

                          {/* MyWallet */}
                          {(() => {
                            const stats = paymentStats as any
                            const myWallet = stats.MyWallet || stats.myWallet || {}
                            return (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className='p-4 bg-orange-50 rounded-lg border border-orange-200'
                              >
                                <div className='flex items-center justify-between mb-3'>
                                  <span className='font-semibold text-orange-900'>MyWallet</span>
                                  <span className='text-sm text-orange-700'>
                                    {(myWallet.Percentage || myWallet.percentage || 0).toFixed(1)}%
                                  </span>
                                </div>
                                <div className='space-y-2'>
                                  <div className='flex justify-between text-sm'>
                                    <span className='text-gray-600'>Doanh thu:</span>
                                    <span className='font-medium'>{formatCurrency(myWallet.Revenue || myWallet.revenue || 0)}</span>
                                  </div>
                                  <div className='flex justify-between text-sm'>
                                    <span className='text-gray-600'>Số đơn:</span>
                                    <span className='font-medium'>
                                      {(myWallet.OrderCount || myWallet.orderCount || 0).toLocaleString('vi-VN')}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })()}
                        </motion.div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key='empty'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className='text-center py-12 text-gray-500'
                      >
                        <PieChart className='w-12 h-12 mx-auto mb-2 text-gray-300' />
                        <p>
                          {startDate || endDate
                            ? 'Chọn khoảng ngày và nhấn "Tải thống kê" để xem dữ liệu'
                            : 'Nhấn "Tải tất cả" để xem thống kê toàn bộ hoặc chọn khoảng ngày để lọc'}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

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
