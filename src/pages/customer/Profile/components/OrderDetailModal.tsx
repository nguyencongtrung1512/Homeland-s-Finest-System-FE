import React from 'react'
import { Button } from '../../../../components/ui/button'

interface Product {
  id?: string
  name: string
  image: string
  quantity?: number | string
  price?: number
  variant?: string
}

interface Order {
  id: string
  date: string
  totalAmount?: number
  status: 'Đang giao' | 'Đã giao' | 'Đã hủy' | 'Chờ xác nhận' | 'Đã xác nhận'
  products: Product[]
  shippingInfo?: {
    recipientName: string
    phone: string
    address: string
    note?: string
  }
  transactionInfo?: {
    orderId: string
    paymentDate: string
    paymentMethod: string
  }
  timeline?: {
    status: string
    date: string
    isCompleted: boolean
    isCurrent: boolean
  }[]
  canConfirmReceived?: boolean
  showRefundRequest?: boolean
}

interface OrderDetailModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đang giao':
        return 'text-orange-500'
      case 'Đã giao':
        return 'text-green-600'
      case 'Đã hủy':
        return 'text-red-500'
      case 'Chờ xác nhận':
        return 'text-yellow-600'
      case 'Đã xác nhận':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ'
  }

  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4'
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className='bg-white rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl'>
        {/* Header - Fixed */}
        <div className='flex items-center justify-between p-4 border-b shrink-0'>
          <h2 className='text-lg font-semibold text-gray-800'>Chi tiết đơn hàng</h2>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 text-xl font-bold'>
            ×
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className='p-4 space-y-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'>
          {/* Order Info */}
          <div className='bg-gray-50 rounded-2xl p-4'>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <p className='text-gray-600'>Mã đơn hàng</p>
                <p className='font-semibold'>#{order.id}</p>
              </div>
              <div>
                <p className='text-gray-600'>Ngày đặt</p>
                <p className='font-semibold'>{order.date}</p>
              </div>
              <div>
                <p className='text-gray-600'>Tổng giá trị</p>
                <p className='font-semibold text-green-600'>{formatPrice(order.totalAmount || 0)}</p>
              </div>
              <div>
                <p className='text-gray-600'>Trạng thái</p>
                <div className='flex items-center gap-1'>
                  <div
                    className={`w-2 h-2 rounded-full ${order.status === 'Đang giao' ? 'bg-orange-500' : order.status === 'Đã giao' ? 'bg-green-500' : 'bg-gray-400'}`}
                  ></div>
                  <p className={`font-semibold ${getStatusColor(order.status)}`}>{order.status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className='font-semibold mb-3 flex items-center gap-2'>🛍️ Sản phẩm trong đơn</h3>
            <div className='space-y-3'>
              {order.products.map((product) => (
                <div key={product.id} className='flex gap-3 p-3 bg-gray-50 rounded-2xl'>
                  <img src={product.image} alt={product.name} className='w-16 h-16 object-cover rounded-xl' />
                  <div className='flex-1'>
                    <h4 className='font-medium text-sm'>{product.name}</h4>
                    {product.variant && <p className='text-xs text-gray-600'>{product.variant}</p>}
                    <p className='text-xs text-gray-600'>SL: {product.quantity}</p>
                  </div>
                  <div className='text-right'>
                    <p className='font-semibold text-sm'>{formatPrice(product.price || 0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Info */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <h3 className='font-semibold mb-2 flex items-center gap-2'>📍 Thông tin giao hàng</h3>
              <div className='text-sm space-y-1'>
                <p className='font-medium'>{order.shippingInfo?.recipientName}</p>
                <p className='text-gray-600'>{order.shippingInfo?.phone}</p>
                <p className='text-gray-600'>{order.shippingInfo?.address}</p>
                {order.shippingInfo?.note && <p className='text-gray-600 italic'>"{order.shippingInfo.note}"</p>}
              </div>
            </div>

            <div>
              <h3 className='font-semibold mb-2 flex items-center gap-2'>💳 Thông tin giao dịch</h3>
              <div className='text-sm space-y-1'>
                <p className='text-gray-600'>GD #{order.transactionInfo?.orderId}</p>
                <p className='text-gray-600'>{order.transactionInfo?.paymentDate}</p>
                <p className='text-gray-600'>{order.transactionInfo?.paymentMethod}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className='font-semibold mb-3 flex items-center gap-2'>📊 Hành trình tới quê nhà đến tay bạn</h3>
            <div className='space-y-3'>
              {order.timeline?.map((step, index) => (
                <div key={index} className='flex items-center gap-3'>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.isCompleted
                        ? 'bg-green-100 text-green-600'
                        : step.isCurrent
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {step.isCompleted ? '✓' : step.isCurrent ? '○' : '○'}
                  </div>
                  <div className='flex-1'>
                    <p
                      className={`text-sm font-medium ${
                        step.isCompleted || step.isCurrent ? 'text-gray-800' : 'text-gray-400'
                      }`}
                    >
                      {step.status}
                    </p>
                    {step.date && <p className='text-xs text-gray-500'>{step.date}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-2 pt-4'>
            <Button
              variant='outline'
              size='sm'
              className='flex-1 text-orange-600 border-orange-600 hover:bg-orange-50 rounded-xl'
            >
              Theo dõi đơn hàng
            </Button>
            <Button size='sm' className='flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl'>
              Tái đặt hàng
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailModal
