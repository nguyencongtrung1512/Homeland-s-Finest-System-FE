import { useState, useEffect } from 'react'
import { Search, Filter, Eye, ChevronLeft, ChevronRight, Repeat, Loader2 } from 'lucide-react'
import { Card, CardContent } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import TransactionDetail from './transactionDetail'
import { getAllTransactions } from '../../../apis/transaction.api'
import { getOrderDetail } from '../../../apis/order.api'
import { storeApi } from '../../../apis/store.api'
import type { Transaction as APITransaction } from '../../../types/transactionType'
import { getTransactionTypeLabel } from '../../../types/transactionType'
import { formatDate } from '../../../utils/formatDate'

interface Transaction {
  id: string
  customer: string
  shop: string
  createDate: string
  amount: number
  status: 'disbursed' | 'pending' | 'delivering' | 'pending_confirmation' | 'refunded'
  type: APITransaction['type']
}

function TransactionManagement() {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    pageSize: 10,
    pageNumber: 1,
    totalItems: 0,
    totalPages: 1
  })

  // Map status từ API sang UI
  const mapStatusToUI = (apiStatus: string, orderStatus?: string): Transaction['status'] => {
    if (apiStatus === 'Completed') return 'disbursed'
    if (apiStatus === 'Failed') return 'refunded'
    if (apiStatus === 'Cancelled') return 'refunded'
    if (orderStatus === 'Delivering' || orderStatus === 'Shipped') return 'delivering'
    if (orderStatus === 'Confirmed') return 'pending_confirmation'
    return 'pending'
  }

  // Map transaction từ API format sang UI format
  const mapTransactionToUI = async (apiTransaction: APITransaction): Promise<Transaction> => {
    let shopName = 'Chưa xác định'

    try {
      // Lấy order detail để có storeId
      const order = await getOrderDetail(apiTransaction.orderId)
      if (order?.storeId) {
        // Lấy store info
        const storeResponse = await storeApi.getStoreById(order.storeId)
        if (storeResponse?.data?.storeName) {
          shopName = storeResponse.data.storeName
        }
      }
    } catch (error) {
      console.error('Error fetching store info:', error)
    }

    return {
      id: apiTransaction.id,
      customer: apiTransaction.userFullName || 'Khách hàng',
      shop: shopName,
      createDate: formatDate(apiTransaction.createdAt) || '',
      amount: apiTransaction.amount,
      status: mapStatusToUI(apiTransaction.status, apiTransaction.orderStatus),
      type: apiTransaction.type
    }
  }

  // Fetch transactions từ API
  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query params
      const params: any = {
        pageSize: pagination.pageSize,
        pageNumber: currentPage
      }

      // Filter by status
      if (statusFilter !== 'all') {
        if (statusFilter === 'disbursed') params.status = 'Completed'
        if (statusFilter === 'delivering') params.status = 'Pending' // Có thể cần điều chỉnh
        if (statusFilter === 'pending_confirmation') params.status = 'Pending'
        if (statusFilter === 'refunded') params.status = 'Failed'
      }

      // Filter by payment method
      if (paymentMethodFilter !== 'all') {
        params.paymentMethod = paymentMethodFilter
      }

      // Filter by date
      if (dateFilter) {
        const [month, day, year] = dateFilter.split('/')
        if (year && month && day) {
          params.fromDate = `${year}-${month}-${day}`
          params.toDate = `${year}-${month}-${day}`
        }
      }

      const response = await getAllTransactions(params)

      // Map transactions
      const mappedTransactions = await Promise.all(
        response.data.map((tx: APITransaction) => mapTransactionToUI(tx))
      )

      // Filter by search text nếu có
      let filteredTransactions = mappedTransactions
      if (searchText) {
        filteredTransactions = mappedTransactions.filter(
          (tx) =>
            tx.id.toLowerCase().includes(searchText.toLowerCase()) ||
            tx.customer.toLowerCase().includes(searchText.toLowerCase())
        )
      }

      setTransactions(filteredTransactions)

      // Update pagination từ API response
      if (response.pagination) {
        setPagination((prev) => ({
          ...prev,
          totalItems: response.pagination!.totalItems,
          totalPages: response.pagination!.totalPages || Math.ceil(response.pagination!.totalItems / prev.pageSize)
        }))
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err)
      setError('Không thể tải danh sách giao dịch. Vui lòng thử lại sau.')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch data khi component mount và khi filter thay đổi
  useEffect(() => {
    fetchTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, paymentMethodFilter, dateFilter])

  // Handle filter button click
  const handleFilter = () => {
    setCurrentPage(1)
    fetchTransactions()
  }

  // Reset filters
  const handleResetFilters = () => {
    setSearchText('')
    setStatusFilter('all')
    setPaymentMethodFilter('all')
    setDateFilter('')
    setCurrentPage(1)
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      disbursed: { color: 'green', text: 'Thành công', bgColor: 'bg-green-100', textColor: 'text-green-600' },
      delivering: { color: 'blue', text: 'Đang giao', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
      pending_confirmation: {
        color: 'yellow',
        text: 'Chờ xác nhận',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-600'
      },
      refunded: { color: 'red', text: 'Hoàn tiền', bgColor: 'bg-red-100', textColor: 'text-red-600' },
      pending: { color: 'orange', text: 'Chờ xử lý', bgColor: 'bg-orange-100', textColor: 'text-orange-600' }
    }
    return (
      configs[status as keyof typeof configs] || {
        color: 'gray',
        text: 'Unknown',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600'
      }
    )
  }

  const handleView = (record: Transaction) => {
    setSelectedTransaction(record)
  }

  const handleCloseModal = () => {
    setSelectedTransaction(null)
  }

  const renderTransactionRow = (transaction: Transaction) => (
    <tr key={transaction.id} className='border-b border-gray-100 hover:bg-gray-50'>
      {/* Mã giao dịch */}
      <td className='px-6 py-4'>
        <span className='font-mono text-gray-900 font-medium text-sm'>#{(transaction.id).slice(0, 8)}</span>
      </td>

      {/* Khách hàng */}
      <td className='px-6 py-4'>
        <div className='flex items-center gap-3'>
          <Avatar className='w-8 h-8'>
            <AvatarFallback className='bg-blue-100 text-blue-600 text-xs font-medium'>
              {transaction.customer.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className='text-gray-900 text-sm font-medium'>{transaction.customer}</span>
        </div>
      </td>

      {/* Thể loại */}
      <td className='px-6 py-4'>
        <span className='text-gray-700 text-sm'>{getTransactionTypeLabel(transaction.type)}</span>
      </td>

      {/* Ngày tạo */}
      <td className='px-6 py-4'>
        <span className='text-gray-600 text-sm'>{transaction.createDate}</span>
      </td>

      {/* Số tiền */}
      <td className='px-6 py-4'>
        <span className='font-semibold text-gray-900 text-sm'>{transaction.amount.toLocaleString('vi-VN')}₫</span>
      </td>

      {/* Trạng thái */}
      <td className='px-6 py-4'>
        <div className='inline-flex items-center gap-1'>
          {(() => {
            const config = getStatusConfig(transaction.status)
            return (
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${config.textColor.replace('text-', 'bg-')}`}></div>
                {config.text}
              </span>
            )
          })()}
        </div>
      </td>

      {/* Hành động */}
      <td className='px-6 py-4'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => handleView(transaction)}
          title='Xem chi tiết'
          className='h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full'
        >
          <Eye size={14} />
        </Button>
      </td>
    </tr>
  )

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-gray-900'>Quản lý giao dịch</h1>
        <p className='text-gray-600 mt-1'>Theo dõi và quản lý tất cả giao dịch đi vào hệ thống</p>
      </div>

      {/* Summary Cards */}
      {/* <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card className='bg-white shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 mb-1'>Tổng giao dịch</p>
                <p className='text-2xl font-bold text-gray-900'>{totalTransactions.toLocaleString()}</p>
              </div>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                <Repeat className='w-6 h-6 text-blue-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 mb-1'>Thành công</p>
                <p className='text-2xl font-bold text-green-600'>{disbursed.toLocaleString()}</p>
              </div>
              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                <CheckCircle className='w-6 h-6 text-green-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 mb-1'>Hoàn tiền</p>
                <p className='text-2xl font-bold text-red-600'>{refunded.toLocaleString()}</p>
              </div>
              <div className='w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center'>
                <RefreshCw className='w-6 h-6 text-red-600' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Filters */}
      <Card className='bg-white shadow-sm'>
        <CardContent className='p-6'>
          <div className='flex flex-wrap items-center gap-4'>
            <div className='flex-1 min-w-[300px]'>
              <div className='relative'>
                <Search size={16} className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                <Input
                  placeholder='ID giao dịch hoặc tên khách hàng'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className='pl-10 h-10 border-gray-200'
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-48 h-10 border-gray-200'>
                <SelectValue placeholder='Trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                <SelectItem value='disbursed'>Thành công</SelectItem>
                <SelectItem value='delivering'>Đang giao</SelectItem>
                <SelectItem value='pending_confirmation'>Chờ xác nhận</SelectItem>
                <SelectItem value='refunded'>Hoàn tiền</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger className='w-48 h-10 border-gray-200'>
                <SelectValue placeholder='Phương thức thanh toán' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả phương thức</SelectItem>
                <SelectItem value='COD'>Thanh toán khi nhận hàng</SelectItem>
                <SelectItem value='Banking'>Thanh toán qua ngân hàng</SelectItem>
                <SelectItem value='MyWallet'>Ví của tôi</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder='mm/dd/yyyy'
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className='h-10 w-32 border-gray-200'
            />

            <Button className='h-10 px-6 bg-blue-600 hover:bg-blue-700' onClick={handleFilter} disabled={loading}>
              <Filter size={16} className='mr-2' />
              Lọc
            </Button>

            <Button
              variant='outline'
              className='h-10 px-6 border-gray-300 hover:bg-gray-50'
              onClick={handleResetFilters}
              disabled={loading}
            >
              <Repeat size={16} className='mr-2' />
              Đặt lại
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Table */}
      <Card className='bg-white shadow-sm'>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              {/* Table Header */}
              <thead>
                <tr className='border-b border-gray-200 bg-gray-50'>
                  <th className='text-left px-6 py-4 font-medium text-gray-700 text-sm'>Mã giao dịch</th>
                  <th className='text-left px-6 py-4 font-medium text-gray-700 text-sm'>Khách hàng</th>
                  <th className='text-left px-6 py-4 font-medium text-gray-700 text-sm'>Thể loại</th>
                  <th className='text-left px-6 py-4 font-medium text-gray-700 text-sm'>Ngày tạo</th>
                  <th className='text-left px-6 py-4 font-medium text-gray-700 text-sm'>Số tiền</th>
                  <th className='text-left px-6 py-4 font-medium text-gray-700 text-sm'>Trạng thái</th>
                  <th className='text-left px-6 py-4 font-medium text-gray-700 text-sm'>Hành động</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className='bg-white'>
                {loading ? (
                  <tr>
                    <td colSpan={7} className='px-6 py-12 text-center'>
                      <div className='flex flex-col items-center justify-center gap-2'>
                        <Loader2 className='w-6 h-6 animate-spin text-blue-600' />
                        <span className='text-gray-600 text-sm'>Đang tải dữ liệu...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className='px-6 py-12 text-center'>
                      <div className='flex flex-col items-center justify-center gap-2'>
                        <span className='text-red-600 text-sm'>{error}</span>
                        <Button variant='outline' size='sm' onClick={fetchTransactions}>
                          Thử lại
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className='px-6 py-12 text-center'>
                      <span className='text-gray-500 text-sm'>Không có giao dịch nào</span>
                    </td>
                  </tr>
                ) : (
                  transactions.map(renderTransactionRow)
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className='flex items-center justify-between px-6 py-4 border-t border-gray-200'>
            <span className='text-gray-600 text-sm'>
              Hiển thị {(currentPage - 1) * pagination.pageSize + 1} đến{' '}
              {Math.min(currentPage * pagination.pageSize, pagination.totalItems)} của {pagination.totalItems} kết quả
            </span>
            <div className='flex items-center gap-1'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || loading}
                className='h-8 w-8 p-0 text-gray-500 hover:text-gray-700'
              >
                <ChevronLeft size={16} />
              </Button>

              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let page: number
                if (pagination.totalPages <= 5) {
                  page = i + 1
                } else if (currentPage <= 3) {
                  page = i + 1
                } else if (currentPage >= pagination.totalPages - 2) {
                  page = pagination.totalPages - 4 + i
                } else {
                  page = currentPage - 2 + i
                }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'ghost'}
                    size='sm'
                    onClick={() => setCurrentPage(page)}
                    disabled={loading}
                    className={`h-8 w-8 p-0 ${currentPage === page
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {page}
                  </Button>
                )
              })}

              <Button
                variant='ghost'
                size='sm'
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={currentPage === pagination.totalPages || loading}
                className='h-8 w-8 p-0 text-gray-500 hover:text-gray-700'
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetail transaction={selectedTransaction} open={!!selectedTransaction} onClose={handleCloseModal} />
      )}
    </div>
  )
}

export default TransactionManagement
