import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, Repeat, RefreshCw, Loader2 } from 'lucide-react'
import { Card, CardContent } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import TransactionDetail from '../../staff/transactions/transactionDetail'
import { getAllTransactions } from '../../../apis/transaction.api'
import type {
  Transaction as APITransaction,
  TransactionQueryParams,
  TransactionType
} from '../../../types/transactionType'
import { getTransactionTypeLabel } from '../../../types/transactionType'
import { formatDate } from '../../../utils/formatDate'
import { getOrderDetail } from '../../../apis/order.api'
import { storeApi } from '../../../apis/store.api'

interface Transaction {
  id: string
  payosOrderCode: string
  customer: string
  shop: string
  type: string
  createDate: string
  amount: number
  status: 'pending' | 'disbursed' | 'delivering' | 'pending_confirmation' | 'refunded'
}

function TransactionManagementAdmin() {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    pageSize: 10
  })

  // Map status từ API sang UI format
  const mapStatusToUI = (status: string, orderStatus?: string): Transaction['status'] => {
    // Map transaction status
    if (status === 'Completed') return 'disbursed'
    if (status === 'Pending') return 'pending'
    if (status === 'Failed') return 'refunded'
    if (status === 'Cancelled') return 'refunded'

    // Map order status nếu có
    if (orderStatus === 'Delivered') return 'disbursed'
    if (orderStatus === 'Processing' || orderStatus === 'ReadyToPick') return 'delivering'
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
      payosOrderCode: apiTransaction.payosOrderCode,
      customer: apiTransaction.userFullName || 'Khách hàng',
      shop: shopName,
      type: apiTransaction.type || 'Sale',
      createDate: formatDate(apiTransaction.createdAt) || '',
      amount: apiTransaction.amount,
      status: mapStatusToUI(apiTransaction.status, apiTransaction.orderStatus)
    }
  }

  // Fetch transactions từ API
  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query params
      const params: TransactionQueryParams = {
        pageSize: pagination.pageSize,
        pageNumber: currentPage
      }

      // Filter by status
      if (statusFilter !== 'all') {
        if (statusFilter === 'waiting') params.status = 'Pending'
        if (statusFilter === 'disbursed') params.status = 'Completed'
        if (statusFilter === 'refunded') params.status = 'Cancel'
      }

      // Filter by type
      if (typeFilter !== 'all') {
        params.type = typeFilter
      }

      // Search by username (API hỗ trợ search theo email/firstName/lastName)
      // Nếu searchText là transaction ID thì sẽ filter ở client-side sau
      const isTransactionId = searchText && /^[a-f0-9-]{36}$/i.test(searchText.trim())
      if (searchText && !isTransactionId) {
        params.username = searchText.trim()
      }

      const response = await getAllTransactions(params)

      // Map transactions
      const mappedTransactions = await Promise.all(response.data.map((tx: APITransaction) => mapTransactionToUI(tx)))

      // Filter by transaction ID nếu searchText là transaction ID
      let filteredTransactions = mappedTransactions
      if (searchText && isTransactionId) {
        filteredTransactions = mappedTransactions.filter((tx: Transaction) =>
          tx.id.toLowerCase().includes(searchText.toLowerCase())
        )
      }

      setTransactions(filteredTransactions)

      // Update pagination từ API response
      if (response.pagination) {
        setPagination({
          pageSize: response.pagination.pageSize || pagination.pageSize,
          totalItems: response.pagination.totalItems || 0,
          totalPages: response.pagination.totalPages || 1
        })
      }
    } catch (err) {
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
  }, [currentPage, statusFilter, typeFilter, searchText])

  // Reset filters
  const handleResetFilters = () => {
    setSearchText('')
    setStatusFilter('all')
    setTypeFilter('all')
    setCurrentPage(1)
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      disbursed: { color: 'green', text: 'Đã hoàn thành', bgColor: 'bg-green-100', textColor: 'text-green-600' },
      waiting: { color: 'blue', text: 'Đang giao', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
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

  const handleCloseModal = () => {
    setSelectedTransaction(null)
  }

  const renderTransactionRow = (transaction: Transaction) => (
    <tr key={transaction.payosOrderCode} className='border-b border-gray-100 hover:bg-gray-50'>
      {/* Mã giao dịch */}
      <td className='px-6 py-4'>
        <span className='font-mono text-gray-900 font-medium text-sm'>#{transaction.payosOrderCode}</span>
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
        <span className='text-gray-700 text-sm'>{getTransactionTypeLabel(transaction.type as TransactionType)}</span>
      </td>

      {/* Ngày tạo */}
      <td className='px-6 py-4'>
        <span className='text-gray-600 text-sm'>{transaction.createDate}</span>
      </td>

      {/* Số tiền */}
      <td className='px-6 py-4'>
        <span className='font-semibold text-gray-900 text-sm'>{transaction.amount.toLocaleString('vi-VN')}đ</span>
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
    </tr>
  )

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div>
        <h3 className='text-gray-600 mt-1'>Theo dõi các khoản tiền đi vào hoặc rút ra khỏi hệ thống(khách thanh toán, nạp , rút tiền về ngân hàng)</h3>
      </div>

      {/* Filters */}
      <Card className='bg-white shadow-sm'>
        <CardContent className='p-6'>
          <div className='flex flex-wrap items-center gap-4'>
            <div className='flex-1 min-w-[300px]'>
              <div className='relative'>
                <Search size={16} className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                <Input
                  placeholder='Tên khách hàng'
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
                <SelectItem value='waiting'>Đang chờ</SelectItem>
                <SelectItem value='disbursed'>Đã hoàn thành</SelectItem>
                <SelectItem value='refunded'>Đã hoàn tiền</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className='w-48 h-10 border-gray-200'>
                <SelectValue placeholder='Loại giao dịch' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả loại</SelectItem>
                <SelectItem value='Deposit'>Nạp tiền</SelectItem>
                <SelectItem value='Withdrawal'>Rút tiền</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant='outline'
              className='h-10 px-6 border-gray-300 hover:bg-gray-50'
              onClick={handleResetFilters}
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
          {error && (
            <div className='p-6 text-center'>
              <p className='text-red-600 text-sm'>{error}</p>
              <Button variant='outline' size='sm' onClick={fetchTransactions} className='mt-4'>
                <RefreshCw size={14} className='mr-2' />
                Thử lại
              </Button>
            </div>
          )}

          {loading && !error ? (
            <div className='p-12 text-center'>
              <Loader2 className='w-8 h-8 animate-spin text-blue-600 mx-auto mb-4' />
              <p className='text-gray-600 text-sm'>Đang tải dữ liệu...</p>
            </div>
          ) : !error ? (
            <>
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
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className='bg-white'>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className='px-6 py-12 text-center'>
                          <p className='text-gray-500 text-sm'>Không có giao dịch nào</p>
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
                  Hiển thị {transactions.length > 0 ? (currentPage - 1) * pagination.pageSize + 1 : 0} đến{' '}
                  {Math.min(currentPage * pagination.pageSize, pagination.totalItems || transactions.length)} của{' '}
                  {pagination.totalItems || transactions.length} kết quả
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

                  {Array.from({ length: Math.min(pagination.totalPages || 1, 5) }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'blue' : 'ghost'}
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
                  ))}

                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages || 1, currentPage + 1))}
                    disabled={currentPage >= (pagination.totalPages || 1) || loading}
                    className='h-8 w-8 p-0 text-gray-500 hover:text-gray-700'
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className='p-12 text-center'>
              <p className='text-gray-600 text-sm'>Không có giao dịch nào</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetail transaction={selectedTransaction} open={!!selectedTransaction} onClose={handleCloseModal} />
      )}
    </div>
  )
}

export default TransactionManagementAdmin
