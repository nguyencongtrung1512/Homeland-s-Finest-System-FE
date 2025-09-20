import { useState } from 'react'
import { Search, Filter, Eye, ChevronLeft, ChevronRight, Repeat, CheckCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import TransactionDetail from './transactionDetail'

interface Transaction {
  id: string
  customer: string
  shop: string
  createDate: string
  amount: number
  status: 'disbursed' | 'pending' | 'delivering' | 'pending_confirmation' | 'refunded'
}

function TransactionManagement() {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  // Mock data
  const transactions: Transaction[] = [
    {
      id: 'TXN001234',
      customer: 'Nguyễn Văn An',
      shop: 'Shop Thời Trang ABC',
      createDate: '15/01/2024',
      amount: 2500000,
      status: 'disbursed'
    },
    {
      id: 'TXN001235',
      customer: 'Trần Thị Bình',
      shop: 'Shop Điện Tử XYZ',
      createDate: '15/01/2024',
      amount: 1200000,
      status: 'disbursed'
    },
    {
      id: 'TXN001236',
      customer: 'Lê Minh Cường',
      shop: 'Shop Gia Dụng 123',
      createDate: '14/01/2024',
      amount: 850000,
      status: 'delivering'
    },
    {
      id: 'TXN001237',
      customer: 'Phạm Thị Dung',
      shop: 'Shop Mỹ Phẩm DEF',
      createDate: '14/01/2024',
      amount: 450000,
      status: 'pending_confirmation'
    },
    {
      id: 'TXN001238',
      customer: 'Hoàng Văn Em',
      shop: 'Shop Sách Online',
      createDate: '13/01/2024',
      amount: 320000,
      status: 'refunded'
    }
  ]

  const getStatusConfig = (status: string) => {
    const configs = {
      disbursed: { color: 'green', text: 'Đã giải ngân', bgColor: 'bg-green-100', textColor: 'text-green-600' },
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
        <span className='font-mono text-gray-900 font-medium text-sm'>#{transaction.id}</span>
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

      {/* Cửa hàng */}
      <td className='px-6 py-4'>
        <span className='text-gray-700 text-sm'>{transaction.shop}</span>
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

  const totalTransactions = 15847
  const disbursed = 12340
  const refunded = 660

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-gray-900'>Quản lý giao dịch</h1>
        <p className='text-gray-600 mt-1'>Theo dõi và quản lý tất cả giao dịch trên hệ thống</p>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
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
                <p className='text-sm text-gray-600 mb-1'>Đã giải ngân</p>
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
      </div>

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
                <SelectItem value='disbursed'>Đã giải ngân</SelectItem>
                <SelectItem value='delivering'>Đang giao</SelectItem>
                <SelectItem value='pending_confirmation'>Chờ xác nhận</SelectItem>
                <SelectItem value='refunded'>Hoàn tiền</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder='mm/dd/yyyy'
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className='h-10 w-32 border-gray-200'
            />

            <Button className='h-10 px-6 bg-blue-600 hover:bg-blue-700'>
              <Filter size={16} className='mr-2' />
              Lọc
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
                  <th className='text-left px-6 py-4 font-medium text-gray-700 text-sm'>Cửa hàng</th>
                  <th className='text-left px-6 py-4 font-medium text-gray-700 text-sm'>Ngày tạo</th>
                  <th className='text-left px-6 py-4 font-medium text-gray-700 text-sm'>Số tiền</th>
                  <th className='text-left px-6 py-4 font-medium text-gray-700 text-sm'>Trạng thái</th>
                  <th className='text-left px-6 py-4 font-medium text-gray-700 text-sm'>Hành động</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className='bg-white'>{transactions.map(renderTransactionRow)}</tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className='flex items-center justify-between px-6 py-4 border-t border-gray-200'>
            <span className='text-gray-600 text-sm'>Hiển thị 1 đến 5 của 97 kết quả</span>
            <div className='flex items-center gap-1'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className='h-8 w-8 p-0 text-gray-500 hover:text-gray-700'
              >
                <ChevronLeft size={16} />
              </Button>

              {[1, 2, 3].map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'ghost'}
                  size='sm'
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 p-0 ${
                    currentPage === page
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
                onClick={() => setCurrentPage(Math.min(3, currentPage + 1))}
                disabled={currentPage === 3}
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
