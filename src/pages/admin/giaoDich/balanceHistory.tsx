import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Wallet, Eye, EllipsisVertical } from 'lucide-react'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { getWalletTransactions } from '../../../apis/wallet.api'
import type { WalletTransactionDTO } from '../../../types/walletType'
import { getTransactionTypeLabel } from '../../../types/walletType'
import Loading from '../../../components/Loading/loading'
import Pagination from '../../../components/Pagination/Pagination'

function BalanceHistory() {
  const [walletTransactions, setWalletTransactions] = useState<WalletTransactionDTO[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [transactionPage, setTransactionPage] = useState(1)
  const [transactionPageSize] = useState(10)
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | 'COD' | 'WalletOrBanking' | 'Orther'>('all')
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransactionDTO | null>(null)
  const [isTransactionDetailModalOpen, setIsTransactionDetailModalOpen] = useState(false)

  const fetchWalletTransactions = async () => {
    try {
      setLoadingTransactions(true)
      const params: {
        pageSize: number
        pageNumber: number
        paymentMethod?: 'COD' | 'WalletOrBanking' | 'Orther' | null
      } = {
        pageSize: transactionPageSize,
        pageNumber: transactionPage
      }

      if (paymentMethodFilter !== 'all') {
        params.paymentMethod = paymentMethodFilter
      }

      const response = await getWalletTransactions(params)
      if (response?.data?.items) {
        setWalletTransactions(response.data.items)
      } else if (Array.isArray(response?.data)) {
        setWalletTransactions(response.data)
      } else if (Array.isArray(response)) {
        setWalletTransactions(response)
      } else {
        setWalletTransactions([])
      }
    } catch (err) {
      console.error('Error fetching wallet transactions:', err)
      setWalletTransactions([])
    } finally {
      setLoadingTransactions(false)
    }
  }

  useEffect(() => {
    fetchWalletTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionPage, paymentMethodFilter])

  const getTransactionStatusConfig = (status: string) => {
    const statusMap: Record<string, { text: string; bgColor: string; textColor: string }> = {
      Pending: { text: 'Đang chờ', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
      Completed: { text: 'Hoàn thành', bgColor: 'bg-green-100', textColor: 'text-green-800' },
      Cancel: { text: 'Đã hủy', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
      Approved: { text: 'Đã duyệt', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
      Rejected: { text: 'Đã từ chối', bgColor: 'bg-red-100', textColor: 'text-red-800' },
      Disputed: { text: 'Tranh chấp', bgColor: 'bg-orange-100', textColor: 'text-orange-800' }
    }
    return (
      statusMap[status] || {
        text: status || 'Không xác định',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800'
      }
    )
  }

  const getBalanceChangeSign = (balanceBefore: number, balanceAfter: number): string => {
    const change = balanceAfter - balanceBefore
    if (change > 0) return '+'
    if (change < 0) return '-'
    return ''
  }

  const getAmountColor = (balanceBefore: number, balanceAfter: number): string => {
    const balanceChange = balanceAfter - balanceBefore
    if (balanceChange > 0) {
      return 'text-green-600' // Tiền vào hệ thống
    } else if (balanceChange < 0) {
      return 'text-red-600' // Tiền ra hệ thống
    }
    return 'text-gray-600' // Không đổi
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-xl font-bold text-gray-900'>Dòng tiền trong ví</h2>
        <p className='text-gray-600 text-sm mt-1'>Lịch sử tiền di chuyển giữa các ví trong hệ thống</p>
      </div>

      {/* Filters */}
      <Card className='bg-white shadow-sm'>
        <CardContent className='p-4 md:p-6'>
          <div className='flex flex-col gap-4 mb-4 md:mb-6'>
            <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
              <div>
                <h3 className='text-lg md:text-xl font-bold text-gray-900'>Lịch sử giao dịch ví</h3>
                <p className='text-gray-600 text-sm mt-1'>Xem tất cả các giao dịch ví của hệ thống</p>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={fetchWalletTransactions}
                disabled={loadingTransactions}
                className='h-9 w-full md:w-auto'
              >
                <RefreshCw size={14} className={`mr-2 ${loadingTransactions ? 'animate-spin' : ''}`} />
                <span className='hidden md:inline'>Làm mới</span>
                <span className='md:hidden'>Làm mới</span>
              </Button>
            </div>

            {/* Payment Method Filter */}
            <div className='bg-gray-50 rounded-lg p-2'>
              {/* Desktop: Buttons/Tabs */}
              <div className='hidden md:flex items-center gap-1 w-full'>
                {[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'COD', label: '📦 COD' },
                  { value: 'WalletOrBanking', label: '💳 Banking/Ví' },
                  { value: 'Orther', label: '💸 Nạp/Rút' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setPaymentMethodFilter(option.value as 'all' | 'COD' | 'WalletOrBanking' | 'Orther')
                      setTransactionPage(1)
                    }}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all text-center ${
                      paymentMethodFilter === option.value
                        ? 'bg-[#38bdf8] text-white shadow-sm hover:bg-[#0ea5e9]'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Mobile: Dropdown */}
              <div className='md:hidden w-full'>
                <Select
                  value={paymentMethodFilter}
                  onValueChange={(value: 'all' | 'COD' | 'WalletOrBanking' | 'Orther') => {
                    setPaymentMethodFilter(value)
                    setTransactionPage(1)
                  }}
                >
                  <SelectTrigger className='w-full h-9 border-gray-200 text-sm bg-white'>
                    <SelectValue placeholder='Phương thức thanh toán' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả phương thức</SelectItem>
                    <SelectItem value='COD'>📦 COD</SelectItem>
                    <SelectItem value='WalletOrBanking'>💳 Banking/Ví</SelectItem>
                    <SelectItem value='Orther'>💸 Nạp/Rút</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {loadingTransactions ? (
            <div className='py-12'>
              <Loading size='md' text='Đang tải lịch sử giao dịch...' />
            </div>
          ) : walletTransactions.length === 0 ? (
            <div className='py-12 text-center'>
              <Wallet className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-500 text-sm'>Chưa có giao dịch nào</p>
            </div>
          ) : (
            <>
              <div className='space-y-3'>
                {walletTransactions.map((transaction, index) => {
                  const statusConfig = getTransactionStatusConfig(transaction.status || '')
                  const balanceChange = transaction.balanceAfter - transaction.balanceBefore
                  const amountSign = getBalanceChangeSign(transaction.balanceBefore, transaction.balanceAfter)
                  const amountColor = getAmountColor(transaction.balanceBefore, transaction.balanceAfter)

                  return (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className='hover:shadow-md transition-shadow relative'>
                        <CardContent className='p-4'>
                          <button
                            onClick={() => {
                              setSelectedTransaction(transaction)
                              setIsTransactionDetailModalOpen(true)
                            }}
                            className='absolute top-3 right-3 text-gray-600 hover:text-blue-600 transition-colors p-1 z-10'
                            title='Xem chi tiết'
                          >
                            <EllipsisVertical className='h-5 w-5' />
                          </button>

                          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 pr-8'>
                            <div className='flex items-start gap-3 flex-1'>
                              <div className='flex-1'>
                                <div className='flex items-center gap-2 mb-1 flex-wrap'>
                                  <p className='text-sm font-bold text-gray-900'>
                                    {transaction.typeDisplay || transaction.type}
                                  </p>
                                  <Badge
                                    className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0 text-xs mb-3`}
                                  >
                                    {statusConfig.text}
                                  </Badge>
                                </div>

                                {transaction.userEmail && (
                                  <p className='text-xs text-gray-500 mt-1'>
                                    Email người dùng: {transaction.userEmail}
                                  </p>
                                )}
                                {transaction.description && (
                                  <p className='text-xs text-gray-500 mt-1'>{transaction.description}</p>
                                )}

                                <p className='text-xs text-gray-400 mt-1'>
                                  {transaction.createdAt || 'Không xác định'}
                                </p>
                              </div>
                            </div>

                            <div className='flex-shrink-0'>
                              <div className='text-right'>
                                <p className={`text-xl font-bold ${amountColor}`}>
                                  {amountSign}
                                  {Math.abs(balanceChange).toLocaleString('vi-VN')} đ
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>

              {/* Pagination */}
              {walletTransactions.length > 0 && (
                <div className='mt-6 pt-4 border-t border-gray-200'>
                  <Pagination
                    currentPage={transactionPage}
                    totalPages={
                      walletTransactions.length >= transactionPageSize ? transactionPage + 1 : transactionPage
                    }
                    onPageChange={setTransactionPage}
                    maxVisiblePages={2}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      <Dialog open={isTransactionDetailModalOpen} onOpenChange={setIsTransactionDetailModalOpen}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Eye className='w-5 h-5' />
              Chi tiết giao dịch
            </DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className='space-y-4 mt-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {selectedTransaction.id && (
                  <div>
                    <p className='text-sm text-gray-600 mb-1'>Mã giao dịch</p>
                    <p className='text-sm font-semibold text-gray-900'>{selectedTransaction.id}</p>
                  </div>
                )}
                {selectedTransaction.typeDisplay && (
                  <div>
                    <p className='text-sm text-gray-600 mb-1'>Loại giao dịch</p>
                    <p className='text-sm font-semibold text-gray-900'>
                      {getTransactionTypeLabel(selectedTransaction)}
                    </p>
                  </div>
                )}
                {selectedTransaction.status && (
                  <div>
                    <p className='text-sm text-gray-600 mb-1'>Trạng thái</p>
                    <Badge
                      className={`${getTransactionStatusConfig(selectedTransaction.status).bgColor} ${getTransactionStatusConfig(selectedTransaction.status).textColor} border-0`}
                    >
                      {getTransactionStatusConfig(selectedTransaction.status).text}
                    </Badge>
                  </div>
                )}
                {selectedTransaction.balanceBefore !== undefined && (
                  <div>
                    <p className='text-sm text-gray-600 mb-1'>Số dư trước</p>
                    <p className='text-sm font-semibold text-gray-900'>
                      {selectedTransaction.balanceBefore.toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                )}
                {selectedTransaction.balanceAfter !== undefined && (
                  <div>
                    <p className='text-sm text-gray-600 mb-1'>Số dư sau</p>
                    <p className='text-sm font-semibold text-gray-900'>
                      {selectedTransaction.balanceAfter.toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                )}
                {selectedTransaction.paymentMethod && (
                  <div>
                    <p className='text-sm text-gray-600 mb-1'>Phương thức thanh toán</p>
                    <p className='text-sm font-semibold text-gray-900'>{selectedTransaction.paymentMethod}</p>
                  </div>
                )}
                {selectedTransaction.userEmail && (
                  <div>
                    <p className='text-sm text-gray-600 mb-1'>Email người dùng</p>
                    <p className='text-sm font-semibold text-gray-900 break-all'>{selectedTransaction.userEmail}</p>
                  </div>
                )}
                {selectedTransaction.userPhoneNumber && (
                  <div>
                    <p className='text-sm text-gray-600 mb-1'>Số điện thoại người dùng</p>
                    <p className='text-sm font-semibold text-gray-900'>{selectedTransaction.userPhoneNumber}</p>
                  </div>
                )}
                {selectedTransaction.orderId && (
                  <div>
                    <p className='text-sm text-gray-600 mb-1'>Mã đơn hàng</p>
                    <p className='text-sm font-semibold text-gray-900'>{selectedTransaction.orderId}</p>
                  </div>
                )}
                {selectedTransaction.createdAt && (
                  <div>
                    <p className='text-sm text-gray-600 mb-1'>Ngày tạo</p>
                    <p className='text-sm font-semibold text-gray-900'>{selectedTransaction.createdAt}</p>
                  </div>
                )}
                {selectedTransaction.description && (
                  <div>
                    <p className='text-sm text-gray-600 mb-1'>Mô tả</p>
                    <p className='text-sm text-gray-900'>{selectedTransaction.description}</p>
                  </div>
                )}
              </div>

              {/* Chi tiết đơn hàng */}
              {(selectedTransaction.orderGrossRevenue !== null &&
                selectedTransaction.orderGrossRevenue !== undefined) ||
              (selectedTransaction.orderNetRevenue !== null && selectedTransaction.orderNetRevenue !== undefined) ? (
                <div className='mt-4 border border-blue-100 bg-blue-50 rounded-xl p-4 md:p-5'>
                  <p className='font-semibold text-gray-900 mb-3'>Chi tiết đơn hàng</p>
                  <div className='space-y-1 text-sm'>
                    <div className='flex items-center justify-between'>
                      <span className='text-gray-700'>Doanh thu gộp:</span>
                      <span className='font-semibold text-gray-900'>
                        {(selectedTransaction.orderGrossRevenue || 0).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-gray-700'>Phí ship:</span>
                      <span className='font-semibold text-red-500'>
                        -{(selectedTransaction.orderShipFee || 0).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-gray-700'>Bảo hiểm:</span>
                      <span className='font-semibold text-red-500'>
                        -{(selectedTransaction.orderInsurance || 0).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-gray-700'>Hoa hồng:</span>
                      <span className='font-semibold text-red-500'>
                        -{(selectedTransaction.orderCommission || 0).toLocaleString('vi-VN')} đ
                      </span>
                      </div>
                      <div className='flex items-center justify-between'>
                      <span className='text-gray-700'>Giảm giá người bán:</span>
                     <span className='font-semibold text-red-500'>
                        -{(selectedTransaction.orderSellerDiscount || 0).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                     <span className='text-gray-700'>Giảm giá hệ thống:</span>
                      <span className='font-semibold text-red-500'>
                       -{(selectedTransaction.orderSystemDiscount || 0).toLocaleString('vi-VN')} đ
                     </span>
                    </div>
                    <hr className='my-2 border-blue-100' />
                    <div className='flex items-center justify-between'>
                      <span className='font-semibold text-gray-900'>Doanh thu ròng:</span>
                      <span className='font-bold text-blue-600'>
                        {(selectedTransaction.orderNetRevenue || 0).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsTransactionDetailModalOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BalanceHistory
