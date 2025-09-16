import { User, Mail, Store, ShoppingCart, TrendingUp, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'

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

  // Mock product data
  const products = [
    { id: 1, name: 'Giày thể thao trắng', quantity: 2, price: 1200000 },
    { id: 2, name: 'Áo khoác jean xanh', quantity: 1, price: 800000 }
  ]

  const totalAmount = products.reduce((sum, product) => sum + product.price * product.quantity, 0)

  // Mock transaction timeline
  const timeline = [
    { text: 'Đang chờ', time: '09:30', completed: true },
    { text: 'Đang giải ngân', time: '10:15', completed: true },
    { text: 'Đã giải ngân', time: '11:45', completed: true }
  ]

  const handleRefund = () => {
    console.log('Refund transaction:', transaction.id)
  }

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
                    {transaction.customer.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                  <p className='font-medium text-gray-900 text-sm'>{transaction.customer}</p>
                  <div className='flex items-center gap-2 mt-1'>
                    <Mail className='w-3 h-3 text-gray-400' />
                    <span className='text-xs text-gray-600'>minhanh@email.com</span>
                  </div>
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
                  <p className='font-medium text-gray-900 text-sm'>Fashion Store</p>
                  <p className='text-xs text-gray-600 mt-1'>Trần Văn Nam</p>
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
              {products.map((product) => (
                <div key={product.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center'>
                      <span className='text-xs text-gray-400'>IMG</span>
                    </div>
                    <div>
                      <p className='font-medium text-gray-900 text-sm'>{product.name}</p>
                      <p className='text-xs text-gray-500'>SL: {product.quantity}</p>
                    </div>
                  </div>
                  <p className='font-semibold text-gray-900 text-sm'>
                    {(product.price * product.quantity).toLocaleString('vi-VN')}₫
                  </p>
                </div>
              ))}

              <div className='border-t border-gray-200 pt-3 mt-3'>
                <div className='flex justify-between items-center'>
                  <span className='font-semibold text-gray-900'>Tổng cộng:</span>
                  <span className='font-bold text-lg text-gray-900'>{totalAmount.toLocaleString('vi-VN')}₫</span>
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
              <div className='flex items-center gap-2'>
                {timeline.map((item, index) => (
                  <div key={index} className='flex items-center gap-2'>
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
                        <p className='text-xs font-medium text-gray-900'>{item.text}</p>
                        <p className='text-xs text-gray-500'>{item.time}</p>
                      </div>
                    </div>
                    {index < timeline.length - 1 && <div className='w-8 h-0.5 bg-green-200 mb-6'></div>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <DialogFooter className='p-5 pt-2'>
          <div className='flex justify-end gap-3 w-full'>
            <Button variant='outline' onClick={onClose} className='px-6'>
              Đóng
            </Button>
            <Button
              onClick={handleRefund}
              className='bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6'
            >
              <RefreshCw className='w-4 h-4 mr-2' />
              Hoàn tiền
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TransactionDetail
