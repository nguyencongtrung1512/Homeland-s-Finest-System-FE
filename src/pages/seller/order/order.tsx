import { useState, useEffect, useCallback, useMemo } from 'react'
import { ArrowUpDown, ChevronDown, Eye, Loader2, ChevronLeft, ChevronRight, Menu, X, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

import { Button } from '../../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '../../../components/ui/dropdown-menu'
import { Input } from '../../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent } from '../../../components/ui/card'
import { getCustomerOrders } from '../../../apis/order.api'
import { useAuth } from '../../../contexts/auth.context'
import type { Order, OrderStatus } from '../../../types/orderType'
import { toast } from 'react-toastify'
import OrderDetail from './orderDetail'
import Pagination from '../../../components/Pagination/Pagination'
import { createOrGetChatRoom } from '../../../apis/chat.api'
import path from '../../../constants/path'

const HIDDEN_STATUSES: OrderStatus[] = ['NotYet', 'PendingPayment']

// Status text mapping - moved outside component to avoid re-renders
const statusTextMap: Record<string, string> = {
  NotYet: 'Chưa xử lí',
  PendingPayment: 'Chờ thanh toán',
  Processing: 'Chờ xác nhận',
  Confirmed: 'Đã xác nhận',
  Cancel: 'Đã hủy',
  ReadyToPick: 'Đang chuẩn bị hàng',
  Picking: 'Đang trên đường lấy hàng',
  Picked: 'Đã lấy hàng',
  Storing: 'Đang lưu kho',
  Transporting: 'Đang vận chuyển',
  Sorting: 'Đang phân loại',
  Delivering: 'Đang giao hàng',
  Delivered: 'Đã giao hàng thành công',
  DeliveryFail: 'Giao hàng thất bại',
  Returning: 'Đang trả hàng',
  Returned: 'Đã trả hàng',
  Refunded: 'Đã hoàn tiền',
  Complaining: 'Đang phản hồi',
  Complained: 'Đã phản hồi',
  Paid: 'Đã thanh toán',
  Exception: 'Gặp sự cố',
  Damaged: 'Hàng hư hỏng',
  Lost: 'Thất lạc'
}

function OrderManagement() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('all')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<keyof Order | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    ghnorderCode: true,
    createdAt: true,
    toName: true,
    finalPrice: true,
    status: true,
    actions: true
  })
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [allOrders, setAllOrders] = useState<Order[]>([]) // Store all orders for counting
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Không có'
    // Backend đã trả về định dạng "10:03:51 14/10/2025" nên chỉ cần hiển thị
    return dateString
  }

  const getStatusText = (status: string) => {
    return statusTextMap[status] || 'Chưa xác định'
  }

  // Create tabs from statusTextMap
  const tabs = useMemo(() => {
    const statusTabs = Object.keys(statusTextMap)
      .filter((key) => !HIDDEN_STATUSES.includes(key as OrderStatus))
      .map((key) => ({
        key: key as OrderStatus | 'all' | 'pendingVerification',
        label: statusTextMap[key]
      }))
    return [
      { key: 'all' as const, label: 'Tất cả' },
      { key: 'pendingVerification' as const, label: 'Chờ xác minh' },
      ...statusTabs
    ]
  }, [])

  // Count orders by status
  const orderCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allOrders.length }

    // Count pending verification orders (isVerification: false, status: Paid or Delivered)
    const pendingVerificationCount = allOrders.filter(
      (order) =>
        !order.isVerification &&
        (order.status === 'Paid' || order.status === 'Delivered')
    ).length
    counts.pendingVerification = pendingVerificationCount

    allOrders.forEach((order) => {
      counts[order.status] = (counts[order.status] || 0) + 1
    })
    return counts
  }, [allOrders])

  const getStatusBadge = (status: string) => {
    return <Badge className='bg-gray-100 text-gray-800 hover:bg-gray-100'>{getStatusText(status)}</Badge>
  }

  // Filter orders by search term
  const filteredOrders = orders.filter((order) => {
    const trimmedSearchTerm = searchTerm.trim()
    const matchesSearch =
      trimmedSearchTerm === '' ||
      order.ghnorderCode?.toLowerCase().includes(trimmedSearchTerm.toLowerCase()) ||
      order.toName?.toLowerCase().includes(trimmedSearchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(trimmedSearchTerm.toLowerCase())
    return matchesSearch
  })

  // Sort orders (excluding ghnorderCode)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortField || sortField === 'ghnorderCode') return 0

    const aValue = a[sortField]
    const bValue = b[sortField]

    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  // Pagination logic
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedOrders = sortedOrders.slice(startIndex, endIndex)

  // Handle column sorting (excluding ghnorderCode)
  const handleSort = (field: keyof Order) => {
    if (field === 'ghnorderCode') return // Disable sorting for order code
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    const clampedPage = Math.min(Math.max(page, 1), totalPages || 1)
    setCurrentPage(clampedPage)
  }

  // Handle order detail modal
  const handleViewOrderDetail = (orderId: string) => {
    setSelectedOrderId(orderId)
    setIsOrderDetailModalOpen(true)
  }

  const handleCloseOrderDetailModal = () => {
    setIsOrderDetailModalOpen(false)
    setSelectedOrderId(null)
  }

  // Handle chat with customer
  const handleChatWithCustomer = async (orderId: string) => {
    try {
      // Find order from current orders or all orders
      const order = orders.find((o) => o.id === orderId) || allOrders.find((o) => o.id === orderId)
      if (!order) {
        toast.error('Không tìm thấy đơn hàng')
        return
      }

      // Check if user is logged in
      if (!user?.userId) {
        toast.error('Vui lòng đăng nhập để nhắn tin')
        return
      }

      // Get customerId from order
      const customerId = order.userId
      if (!customerId) {
        toast.error('Không tìm thấy thông tin khách hàng')
        return
      }

      // Show loading toast
      toast.info('Đang mở chat với khách hàng...', { autoClose: 1000 })

      // Create or get chat room
      const chatRoomResponse = await createOrGetChatRoom({
        sellerId: user.userId,
        customerId: customerId
      })

      // Navigate to chat page with roomId as query param
      navigate(`${path.BASE_SELLER}/${path.chatWithCustomerSeller}?roomId=${chatRoomResponse.data.id}`)
    } catch (error) {
      console.error('Error opening chat with customer:', error)
      toast.error('Không thể mở chat với khách hàng. Vui lòng thử lại.')
    }
  }

  // Sort button component
  const SortButton = ({ field, children }: { field: keyof Order; children: React.ReactNode }) => (
    <Button variant='ghost' size='sm' className='h-8 px-2 lg:px-3' onClick={() => handleSort(field)}>
      {children}
      <ArrowUpDown className='ml-2 h-4 w-4' />
    </Button>
  )

  // Column header component (without sort for ghnorderCode)
  const ColumnHeader = ({ field, children }: { field: keyof Order; children: React.ReactNode }) => {
    if (field === 'ghnorderCode') {
      return <span className='font-medium'>{children}</span>
    }
    return (
      <Button variant='ghost' size='sm' className='h-8 px-2 lg:px-3' onClick={() => handleSort(field)}>
        {children}
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    )
  }

  // Column visibility options
  const columnOptions = [
    { key: 'ghnorderCode', label: 'Mã đơn hàng' },
    { key: 'createdAt', label: 'Ngày đặt' },
    { key: 'toName', label: 'Tên khách hàng' },
    { key: 'finalPrice', label: 'Tổng tiền' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'actions', label: 'Hành động' }
  ]

  // Fetch all orders for counting
  const fetchAllOrders = useCallback(async () => {
    if (!user?.userId) return

    try {
      const allOrdersData = await getCustomerOrders(user.userId, { pageSize: 0 })
      setAllOrders(allOrdersData.filter((order) => !HIDDEN_STATUSES.includes(order.status as OrderStatus)))
    } catch (err) {
      console.error('Error fetching all orders:', err)
    }
  }, [user?.userId])

  const fetchOrders = useCallback(
    async (status?: OrderStatus | 'pendingVerification') => {
      if (!user?.userId) {
        setError('Vui lòng đăng nhập để xem đơn hàng')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        if (status === 'pendingVerification') {
          // Fetch orders with Paid and Delivered status
          const [paidOrders, deliveredOrders] = await Promise.all([
            getCustomerOrders(user.userId, { status: 'Paid' }),
            getCustomerOrders(user.userId, { status: 'Delivered' })
          ])

          // Combine and filter: isVerification: false
          const allOrdersData = [...paidOrders, ...deliveredOrders]
          const filteredOrders = allOrdersData.filter(
            (order) =>
              !HIDDEN_STATUSES.includes(order.status as OrderStatus) &&
              !order.isVerification &&
              (order.status === 'Paid' || order.status === 'Delivered')
          )

          // Remove duplicates by order id
          const uniqueOrders = Array.from(
            new Map(filteredOrders.map((order) => [order.id, order])).values()
          )

          setOrders(uniqueOrders)
        } else {
          const params = status ? { status } : undefined
          const ordersData = await getCustomerOrders(user.userId, params)
          setOrders(ordersData.filter((order) => !HIDDEN_STATUSES.includes(order.status as OrderStatus)))
        }
      } catch (err) {
        console.error('Error fetching orders:', err)
        setError('Không thể tải danh sách đơn hàng')
        toast.error('Không thể tải danh sách đơn hàng')
      } finally {
        setLoading(false)
      }
    },
    [user?.userId]
  )

  // Fetch all orders on mount
  useEffect(() => {
    fetchAllOrders()
  }, [fetchAllOrders])

  useEffect(() => {
    const status = activeTab === 'all' ? undefined : (activeTab as OrderStatus | 'pendingVerification')
    fetchOrders(status)
    setCurrentPage(1) // Reset to first page when tab changes
    setIsMobileMenuOpen(false) // Close mobile menu when tab changes
  }, [activeTab, fetchOrders])

  // Handle desktop tab scrolling
  const handleDesktopTabScroll = (direction: 'left' | 'right') => {
    const tabContainer = document.getElementById('desktop-tabs-container')
    if (!tabContainer) return

    const scrollAmount = 200
    const currentScroll = tabContainer.scrollLeft
    const newScroll = direction === 'right' ? currentScroll + scrollAmount : currentScroll - scrollAmount
    tabContainer.scrollTo({ left: newScroll, behavior: 'smooth' })
  }

  // Check if tabs can scroll
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const tabContainer = document.getElementById('desktop-tabs-container')
    if (!tabContainer) return

    const checkScroll = () => {
      setCanScrollLeft(tabContainer.scrollLeft > 0)
      setCanScrollRight(tabContainer.scrollLeft < tabContainer.scrollWidth - tabContainer.clientWidth - 1)
    }

    checkScroll()
    tabContainer.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)

    return () => {
      tabContainer.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [orders])

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-green-700 mb-6'>Quản lý Đơn hàng</h1>

        {/* Desktop Tabs */}
        <div className='hidden lg:block relative mb-6'>
          <div className='flex items-center border-b border-gray-200'>
            {/* Scroll Left Button */}
            {canScrollLeft && (
              <Button
                variant='ghost'
                size='sm'
                className='absolute left-0 z-10 h-full px-2 bg-white/80 backdrop-blur-sm'
                onClick={() => handleDesktopTabScroll('left')}
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
            )}

            {/* Tabs Container */}
            <div
              id='desktop-tabs-container'
              className='flex space-x-2 overflow-x-auto scrollbar-hide scroll-smooth px-8'
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {tabs.map((tab) => {
                const count = orderCounts[tab.key] || 0
                const isActive = activeTab === tab.key
                return (
                  <motion.button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative pb-3 text-sm font-medium px-4 transition-all duration-300 whitespace-nowrap ${isActive ? 'text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className='flex items-center gap-2'>
                      {tab.label}
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {count}
                      </span>
                    </span>
                    {isActive && (
                      <motion.div
                        className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600'
                        layoutId='activeTab'
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
                )
              })}
            </div>

            {/* Scroll Right Button */}
            {canScrollRight && (
              <Button
                variant='ghost'
                size='sm'
                className='absolute right-0 z-10 h-full px-2 bg-white/80 backdrop-blur-sm'
                onClick={() => handleDesktopTabScroll('right')}
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className='lg:hidden mb-6'>
          <div className='flex items-center justify-between border-b border-gray-200 pb-3'>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors'
            >
              {isMobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
              <span className='font-medium'>
                {tabs.find((t) => t.key === activeTab)?.label || 'Tất cả'}
                <span className='ml-2 text-xs text-gray-500'>({orderCounts[activeTab] || 0})</span>
              </span>
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className='overflow-hidden'
              >
                <motion.div
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  exit={{ y: -20 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className='bg-white border border-gray-200 rounded-lg shadow-lg mt-2 max-h-[70vh] overflow-y-auto'
                >
                  {tabs.map((tab, index) => {
                    const count = orderCounts[tab.key] || 0
                    const isActive = activeTab === tab.key
                    return (
                      <motion.button
                        key={tab.key}
                        onClick={() => {
                          setActiveTab(tab.key)
                          setIsMobileMenuOpen(false)
                        }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.2 }}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between transition-all duration-200 ${isActive
                          ? 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span>{tab.label}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${isActive ? 'bg-orange-200 text-orange-800' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {count}
                        </span>
                      </motion.button>
                    )
                  })}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Card>
        <CardContent className='p-6'>
          {loading ? (
            <div className='flex justify-center items-center py-12'>
              <Loader2 className='w-8 h-8 animate-spin text-green-600' />
              <span className='ml-2 text-gray-600'>Đang tải danh sách đơn hàng...</span>
            </div>
          ) : error ? (
            <div className='text-center py-12'>
              <p className='text-red-600 mb-4'>{error}</p>
              <Button onClick={() => fetchOrders(activeTab === 'all' ? undefined : (activeTab as OrderStatus))}>
                Thử lại
              </Button>
            </div>
          ) : (
            <div className='w-full'>
              <div className='flex items-center justify-between py-4'>
                <Input
                  placeholder='Tìm theo Mã đơn hàng hoặc Tên khách hàng...'
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className='max-w-sm'
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' className='ml-auto'>
                      Cột hiện thị <ChevronDown className='ml-2 h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    {columnOptions.map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.key}
                        className='capitalize'
                        checked={columnVisibility[column.key]}
                        onCheckedChange={(value) => setColumnVisibility((prev) => ({ ...prev, [column.key]: !!value }))}
                      >
                        {column.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columnVisibility.ghnorderCode && (
                        <TableHead>
                          <ColumnHeader field='ghnorderCode'>Mã đơn hàng</ColumnHeader>
                        </TableHead>
                      )}
                      {columnVisibility.createdAt && (
                        <TableHead>
                          <SortButton field='createdAt'>Ngày đặt</SortButton>
                        </TableHead>
                      )}
                      {columnVisibility.toName && (
                        <TableHead>
                          <SortButton field='toName'>Tên khách hàng</SortButton>
                        </TableHead>
                      )}
                      {columnVisibility.finalPrice && (
                        <TableHead className='text-right'>
                          <SortButton field='finalPrice'>Tổng tiền</SortButton>
                        </TableHead>
                      )}
                      {columnVisibility.status && (
                        <TableHead>
                          <SortButton field='status'>Trạng thái</SortButton>
                        </TableHead>
                      )}
                      {columnVisibility.actions && <TableHead className='text-right'>Hành động</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.length ? (
                      paginatedOrders.map((order) => (
                        <TableRow key={order.id}>
                          {columnVisibility.ghnorderCode && (
                            <TableCell className='font-medium'>#{order.ghnorderCode || order.id}</TableCell>
                          )}
                          {columnVisibility.createdAt && <TableCell>{formatDate(order.createdAt)}</TableCell>}
                          {columnVisibility.toName && <TableCell>{order.toName || 'Không có'}</TableCell>}
                          {columnVisibility.finalPrice && (
                            <TableCell className='text-right font-medium'>
                              {(order.finalPrice || 0).toLocaleString('vi-VN')}₫
                            </TableCell>
                          )}
                          {columnVisibility.status && <TableCell>{getStatusBadge(order.status)}</TableCell>}
                          {columnVisibility.actions && (
                            <TableCell className='text-right'>
                              <Button
                                variant='ghost'
                                size='sm'
                                title='Xem chi tiết'
                                className='text-green-600 hover:text-green-700 hover:bg-green-50'
                                onClick={() => handleViewOrderDetail(order.id)}
                              >
                                <Eye className='w-4 h-4 mr-1' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                title='Nhắn tin với khách hàng'
                                className='text-green-600 hover:text-green-700 hover:bg-green-50'
                                onClick={() => handleChatWithCustomer(order.id)}
                              >
                                <MessageCircle className='w-4 h-4 mr-1' />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={Object.values(columnVisibility).filter(Boolean).length}
                          className='h-24 text-center'
                        >
                          Không có đơn hàng nào.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className='flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between'>
                <div className='text-sm text-muted-foreground'>
                  Hiển thị {startIndex + 1}-{Math.min(endIndex, sortedOrders.length)} trong {sortedOrders.length} đơn
                  hàng
                </div>
                {totalPages > 1 && (
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      <OrderDetail isOpen={isOrderDetailModalOpen} onClose={handleCloseOrderDetailModal} orderId={selectedOrderId} />
    </div>
  )
}

export default OrderManagement
