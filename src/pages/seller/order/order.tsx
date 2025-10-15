import { useState, useEffect, useCallback } from 'react'
import { ArrowUpDown, ChevronDown, Eye, Loader2 } from 'lucide-react'

import { Button } from '../../../components/ui/button'
import { Checkbox } from '../../../components/ui/checkbox'
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

function OrderManagement() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('all')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<keyof Order | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    select: true,
    ghnorderCode: true,
    createdAt: true,
    toName: true,
    finalPrice: true,
    status: true,
    actions: true
  })
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'NotYet', label: 'Chờ xác nhận' },
    { key: 'Processing', label: 'Đang xử lý' },
    { key: 'Shipping', label: 'Đang giao' },
    { key: 'Delivered', label: 'Đã giao' },
    { key: 'Cancel', label: 'Đã hủy' },
    { key: 'Returned', label: 'Đã trả hàng' }
  ]

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      const [, date] = dateString.split(' ')
      const [day, month, year] = date.split('-')
      return `${day}/${month}/${year}`
    } catch {
      return dateString
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NotYet':
        return <Badge className='bg-orange-100 text-orange-800 hover:bg-orange-100'>Chờ xác nhận</Badge>
      case 'Processing':
        return <Badge className='bg-blue-100 text-blue-800 hover:bg-blue-100'>Đang xử lý</Badge>
      case 'Shipping':
        return <Badge className='bg-purple-100 text-purple-800 hover:bg-purple-100'>Đang giao</Badge>
      case 'Delivered':
        return <Badge className='bg-green-100 text-green-800 hover:bg-green-100'>Đã giao</Badge>
      case 'Cancel':
        return <Badge className='bg-red-100 text-red-800 hover:bg-red-100'>Đã hủy</Badge>
      case 'Returned':
        return <Badge className='bg-gray-100 text-gray-800 hover:bg-gray-100'>Đã trả hàng</Badge>
      default:
        return <Badge className='bg-gray-100 text-gray-800 hover:bg-gray-100'>{status}</Badge>
    }
  }

  // Filter orders by search term
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchTerm === '' ||
      order.ghnorderCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.toName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortField) return 0

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

  // Handle column sorting
  const handleSort = (field: keyof Order) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Handle row selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(sortedOrders.map((order) => order.id)))
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleSelectRow = (orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(orderId)
    } else {
      newSelected.delete(orderId)
    }
    setSelectedRows(newSelected)
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

  // Sort button component
  const SortButton = ({ field, children }: { field: keyof Order; children: React.ReactNode }) => (
    <Button variant='ghost' size='sm' className='h-8 px-2 lg:px-3' onClick={() => handleSort(field)}>
      {children}
      <ArrowUpDown className='ml-2 h-4 w-4' />
    </Button>
  )

  // Column visibility options
  const columnOptions = [
    { key: 'ghnorderCode', label: 'Mã đơn hàng' },
    { key: 'createdAt', label: 'Ngày đặt' },
    { key: 'toName', label: 'Tên khách hàng' },
    { key: 'finalPrice', label: 'Tổng tiền' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'actions', label: 'Hành động' }
  ]

  const fetchOrders = useCallback(
    async (status?: OrderStatus) => {
      if (!user?.userId) {
        setError('Vui lòng đăng nhập để xem đơn hàng')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const params = status ? { status } : undefined
        const ordersData = await getCustomerOrders(user.userId, params)
        setOrders(ordersData)
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

  useEffect(() => {
    const status = activeTab === 'all' ? undefined : (activeTab as OrderStatus)
    fetchOrders(status)
  }, [activeTab, fetchOrders])

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-green-700 mb-6'>Quản lý Đơn hàng</h1>

        <div className='flex space-x-8 border-b border-gray-200 mb-6'>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium transition-colors ${activeTab === tab.key
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              {tab.label}
            </button>
          ))}
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
              <div className='flex items-center py-4'>
                <Input
                  placeholder='Tìm theo Mã đơn hàng hoặc Tên khách hàng...'
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className='max-w-sm'
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' className='ml-auto'>
                      Cột hiển thị <ChevronDown className='ml-2 h-4 w-4' />
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
                      {columnVisibility.select && (
                        <TableHead>
                          <Checkbox
                            checked={selectedRows.size === sortedOrders.length && sortedOrders.length > 0}
                            onCheckedChange={handleSelectAll}
                            aria-label='Select all'
                          />
                        </TableHead>
                      )}
                      {columnVisibility.ghnorderCode && (
                        <TableHead>
                          <SortButton field='ghnorderCode'>Mã đơn hàng</SortButton>
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
                    {sortedOrders.length ? (
                      sortedOrders.map((order) => (
                        <TableRow key={order.id} data-state={selectedRows.has(order.id) && 'selected'}>
                          {columnVisibility.select && (
                            <TableCell>
                              <Checkbox
                                checked={selectedRows.has(order.id)}
                                onCheckedChange={(checked) => handleSelectRow(order.id, !!checked)}
                                aria-label='Select row'
                              />
                            </TableCell>
                          )}
                          {columnVisibility.ghnorderCode && (
                            <TableCell className='font-medium'>#{order.ghnorderCode || order.id}</TableCell>
                          )}
                          {columnVisibility.createdAt && <TableCell>{formatDate(order.createdAt)}</TableCell>}
                          {columnVisibility.toName && <TableCell>{order.toName || 'N/A'}</TableCell>}
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
                                className='text-green-600 hover:text-green-700 hover:bg-green-50'
                                onClick={() => handleViewOrderDetail(order.id)}
                              >
                                <Eye className='w-4 h-4 mr-1' />
                                Xem
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
              <div className='flex items-center justify-end space-x-2 py-4'>
                <div className='flex-1 text-sm text-muted-foreground'>
                  {selectedRows.size} trong {sortedOrders.length} hàng được chọn.
                </div>
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
