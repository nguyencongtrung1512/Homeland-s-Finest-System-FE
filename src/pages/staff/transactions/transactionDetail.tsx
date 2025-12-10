import { useState, useEffect } from 'react'
import { User, Mail, Store, ShoppingCart, TrendingUp, CheckCircle, Clock, Loader2, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { getTransactionDetail } from '../../../apis/transaction.api'
import { getOrderDetail } from '../../../apis/order.api'
import { storeApi } from '../../../apis/store.api'
import type { Transaction as APITransaction } from '../../../types/transactionType'
import { getTransactionTypeLabel } from '../../../types/transactionType'
import { formatDate } from '../../../utils/formatDate'

interface TransactionDetailProps {
  transaction: {
    id: string
    customer: string
    shop: string
    createDate: string
    amount: number
    status: 'disbursed' | 'pending' | 'delivering' | 'pending_confirmation' | 'refunded'
  }
  open: boolean
  onClose: () => void
}

function TransactionDetail({ transaction, open, onClose }: TransactionDetailProps) {
  const [apiTransaction, setApiTransaction] = useState<APITransaction | null>(null)
  const [order, setOrder] = useState<any>(null)
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch transaction detail và order detail khi modal mở
  useEffect(() => {
    if (open && transaction.id) {
      fetchTransactionDetail()
    } else {
      // Reset state khi đóng modal
      setApiTransaction(null)
      setOrder(null)
      setStore(null)
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction.id])

  const fetchTransactionDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch transaction detail
      const txDetail = await getTransactionDetail(transaction.id)
      setApiTransaction(txDetail)

      // Fetch order detail để lấy products và store info
      if (txDetail.orderId) {
        const orderDetail = await getOrderDetail(txDetail.orderId)
        setOrder(orderDetail)

        // Fetch store info
        if (orderDetail?.storeId) {
          try {
            const storeResponse = await storeApi.getStoreById(orderDetail.storeId)
            setStore(storeResponse?.data)
          } catch (err) {
            console.error('Error fetching store:', err)
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching transaction detail:', err)
      setError('Không thể tải chi tiết giao dịch')
    } finally {
      setLoading(false)
    }
  }
  const getStatusConfig = (status: string) => {
    const configs = {
      disbursed: {
        color: 'green',
        text: 'Đã giải ngân',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        iconColor: 'text-green-600'
      },
      delivering: {
        color: 'blue',
        text: 'Đang giao',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        iconColor: 'text-blue-600'
      },
      pending_confirmation: {
        color: 'yellow',
        text: 'Chờ xác nhận',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        iconColor: 'text-yellow-600'
      },
      refunded: {
        color: 'red',
        text: 'Hoàn tiền',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        iconColor: 'text-red-600'
      },
      pending: {
        color: 'orange',
        text: 'Chờ xử lý',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        iconColor: 'text-orange-600'
      }
    }
    return (
      configs[status as keyof typeof configs] || {
        color: 'gray',
        text: 'Unknown',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        iconColor: 'text-gray-600'
      }
    )
  }

  const statusConfig = getStatusConfig(transaction.status)

  // Get products from order
  const products = order
    ? [
      ...(order.orderItems || []).map((item: any) => ({
        id: item.id,
        name: item.orderItemName || 'Sản phẩm không xác định',
        quantity: item.quantity || 0,
        price: item.finalPrice || item.totalPrice || 0,
        image: item.orderItemImageUrl
      })),
      ...(order.orderItemsWithCombo || []).map((item: any) => ({
        id: item.id,
        name: item.orderItemName || item.comboName || 'Sản phẩm không xác định',
        quantity: item.quantity || 0,
        price: item.finalPrice || item.totalPrice || 0,
        image: item.orderItemImageUrl
      }))
    ]
    : []

  const totalAmount = apiTransaction?.amount || transaction.amount

  // Build timeline from transaction status và order histories
  const buildTimeline = () => {
    const timeline = []
    const createdAt = apiTransaction?.createdAt || transaction.createDate
    const updatedAt = apiTransaction?.updatedAt

    if (order?.orderHistories && order.orderHistories.length > 0) {
      order.orderHistories.forEach((history: any, index: number) => {
        timeline.push({
          text: history.status || 'Cập nhật',
          time: formatDate(history.createdAt) || '',
          completed: index < order.orderHistories.length - 1
        })
      })
    } else {
      // Fallback timeline
      timeline.push({
        text: transaction.status === 'disbursed' ? 'Đã giải ngân' : 'Đang xử lý',
        time: formatDate(createdAt) || '',
        completed: true
      })
    }

    return timeline.length > 0 ? timeline : [
      { text: 'Đã tạo', time: formatDate(createdAt) || '', completed: true },
      { text: transaction.status === 'disbursed' ? 'Đã giải ngân' : 'Đang xử lý', time: formatDate(updatedAt) || '', completed: transaction.status === 'disbursed' }
    ]
  }

  const timeline = buildTimeline()


  const customerEmail = apiTransaction?.userEmail || ''
  const customerName = apiTransaction?.userFullName || transaction.customer
  const shopName = store?.storeName || transaction.shop
  const sellerName = store?.sellerInfo?.userInfo?.fullName || ''

  // Map payment method to Vietnamese
  const getPaymentMethodText = (paymentMethod: string | undefined): string => {
    if (!paymentMethod) return 'Chưa xác định'
    switch (paymentMethod.toUpperCase()) {
      case 'COD':
        return 'Thanh toán khi nhận hàng (COD)'
      case 'BANKING':
        return 'Chuyển khoản ngân hàng'
      case 'MYWALLET':
        return 'Ví điện tử'
      default:
        return paymentMethod
    }
  }

  const getPaymentMethodIcon = (paymentMethod: string | undefined) => {
    if (!paymentMethod) return null
    switch (paymentMethod.toUpperCase()) {
      case 'COD':
        return <CreditCard className='w-5 h-5 text-green-600' />
      case 'BANKING':
        return <CreditCard className='w-5 h-5 text-green-600' />
      case 'MYWALLET':
        return <CreditCard className='w-5 h-5 text-green-600' />
      default:
        return <CreditCard className='w-5 h-5 text-green-600' />
    }
  }

  const paymentMethod = apiTransaction?.paymentMethod || ''

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl w-full max-h-[85vh] overflow-y-auto p-0'>
        {/* Header */}
        <DialogHeader className='p-5 border-b border-gray-100'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center'>
              <TrendingUp className='w-5 h-5 text-white' />
            </div>
            <div>
              <DialogTitle className='text-lg font-bold text-gray-900'>Chi tiết giao dịch</DialogTitle>
              <p className='text-sm text-gray-500'>#{transaction.id}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className='p-5 space-y-5'>
          {loading ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <Loader2 className='w-8 h-8 animate-spin text-blue-600 mb-4' />
              <span className='text-gray-600 text-sm'>Đang tải chi tiết...</span>
            </div>
          ) : error ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <span className='text-red-600 text-sm mb-4'>{error}</span>
              <Button variant='outline' size='sm' onClick={fetchTransactionDetail}>
                Thử lại
              </Button>
            </div>
          ) : (
            <>
              {/* Customer & Store Info - Horizontal Layout */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Customer Information */}
                <div className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-3'>
                    <User className='w-4 h-4 text-blue-600' />
                    <h3 className='font-semibold text-gray-900 text-sm'>Khách hàng</h3>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Avatar className='w-10 h-10'>
                      <AvatarFallback className='bg-blue-500 text-white text-sm font-semibold'>
                        {customerName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex-1'>
                      <p className='font-medium text-gray-900 text-sm'>{customerName}</p>
                      {customerEmail && (
                        <div className='flex items-center gap-2 mt-1'>
                          <Mail className='w-3 h-3 text-gray-400' />
                          <span className='text-xs text-gray-600'>{customerEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Store Information */}
                <div className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-3'>
                    <Store className='w-4 h-4 text-green-600' />
                    <h3 className='font-semibold text-gray-900 text-sm'>Cửa hàng</h3>
                  </div>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center'>
                      <ShoppingCart className='w-5 h-5 text-white' />
                    </div>
                    <div className='flex-1'>
                      <p className='font-medium text-gray-900 text-sm'>{shopName}</p>
                      {sellerName && <p className='text-xs text-gray-600 mt-1'>{sellerName}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Products */}
              <Card className='shadow-sm border border-gray-100'>
                <CardHeader className='pb-2'>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <ShoppingCart className='w-4 h-4 text-green-600' />
                    Sản phẩm ({products.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {products.length === 0 ? (
                    <p className='text-gray-500 text-sm text-center py-4'>Chưa có thông tin sản phẩm</p>
                  ) : (
                    products.map((product) => (
                      <div key={product.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                        <div className='flex items-center gap-3'>
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className='w-10 h-10 rounded-lg object-cover'
                              onError={(e) => {
                                ; (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className='w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center'>
                              <span className='text-xs text-gray-400'>IMG</span>
                            </div>
                          )}
                          <div>
                            <p className='font-medium text-gray-900 text-sm'>{product.name}</p>
                            <p className='text-xs text-gray-500'>SL: {product.quantity}</p>
                          </div>
                        </div>
                        <p className='font-semibold text-gray-900 text-sm'>
                          {(product.price * product.quantity).toLocaleString('vi-VN')}₫
                        </p>
                      </div>
                    ))
                  )}

                  <div className='border-t border-gray-200 pt-3 mt-3'>
                    <div className='flex justify-between items-center'>
                      <span className='font-semibold text-gray-900'>Tổng cộng:</span>
                      <span className='font-bold text-lg text-gray-900'>{totalAmount.toLocaleString('vi-VN')}₫</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method & Transaction Info */}
              <Card className='shadow-sm border border-gray-100'>
                <CardContent className='p-4 space-y-3'>
                  {/* Transaction Type */}
                  {apiTransaction?.type && (
                    <div className='flex items-center gap-3 p-3 bg-purple-50 rounded-lg'>
                      <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-lg'>
                        <TrendingUp className='w-5 h-5 text-purple-600' />
                      </div>
                      <div className='flex-1'>
                        <p className='text-xs text-gray-500 mb-1'>Loại giao dịch</p>
                        <p className='font-semibold text-gray-900 text-sm'>{getTransactionTypeLabel(apiTransaction.type)}</p>
                      </div>
                    </div>
                  )}
                  {/* Payment Method */}
                  <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
                    <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg'>
                      {getPaymentMethodIcon(paymentMethod)}
                    </div>
                    <div className='flex-1'>
                      <p className='text-xs text-gray-500 mb-1'>Phương thức thanh toán</p>
                      <p className='font-semibold text-gray-900 text-sm'>{getPaymentMethodText(paymentMethod)}</p>
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* Status & Timeline */}
              <Card className='shadow-sm border border-gray-100'>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='font-semibold text-gray-900 text-sm'>Trạng thái</h3>
                    <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0 px-3 py-1`}>
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${statusConfig.iconColor.replace('text-', 'bg-')} mr-2`}
                      ></div>
                      {statusConfig.text}
                    </Badge>
                  </div>

                  {/* Compact Timeline */}
                  <div className='flex items-center gap-2 overflow-x-auto'>
                    {timeline.map((item, index) => (
                      <div key={index} className='flex items-center gap-2 flex-shrink-0'>
                        <div className='flex flex-col items-center'>
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${item.completed ? 'bg-green-100' : 'bg-gray-100'
                              }`}
                          >
                            {item.completed ? (
                              <CheckCircle className='w-3 h-3 text-green-600' />
                            ) : (
                              <Clock className='w-3 h-3 text-gray-400' />
                            )}
                          </div>
                          <div className='text-center mt-1'>
                            <p className='text-xs font-medium text-gray-900 whitespace-nowrap'>{item.text}</p>
                            <p className='text-xs text-gray-500 whitespace-nowrap'>{item.time}</p>
                          </div>
                        </div>
                        {index < timeline.length - 1 && <div className='w-8 h-0.5 bg-green-200 mb-6'></div>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <DialogFooter className='p-5 pt-2'>
          <div className='flex justify-end gap-3 w-full'>
            <Button variant='outline' onClick={onClose} className='px-6'>
              Đóng
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TransactionDetail
