import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Truck,
  Package,
  User,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Settings,
  X,
  Star,
  Flag
} from 'lucide-react'

function OrderDetail() {
  const navigate = useNavigate()
  // const { orderId } = useParams()
  const [orderStatus, setOrderStatus] = useState('pending') // pending, confirmed, delivering, delivered, cancelled

  // Mock data - trong thực tế sẽ fetch từ API
  const orderData = {
    id: 'THQN170421',
    date: '03/09/2025, 14:14',
    status: orderStatus,
    customer: {
      name: 'Nguyễn Văn A',
      type: 'Khách hàng thân thiết',
      phone: '0987.654.321',
      email: 'nguyenvana@email.com',
      avatar: null
    },
    shipping: {
      address: '123 Đường Lê Lợi, Phường 1, Quận 1, TP. Hồ Chí Minh',
      carrier: 'Giao hàng nhanh',
      note: 'Vui lòng gọi trước khi giao'
    },
    products: [
      {
        id: 1,
        name: 'Bánh tráng nướng Tây Ninh',
        description: 'Đặc sản truyền thống',
        price: 45000,
        quantity: 2,
        image: '/api/placeholder/60/60'
      },
      {
        id: 2,
        name: 'Nem chua Thanh Hóa',
        description: 'Đặc sản miền Bắc',
        price: 35000,
        quantity: 3,
        image: '/api/placeholder/60/60'
      }
    ],
    summary: {
      subtotal: 195000,
      shipping: 25000,
      total: 220000
    },
    history: [
      {
        id: 1,
        action: 'Khách hàng Nguyễn Văn A đã đặt hàng thành công',
        timestamp: '03/09/2025, 14:14',
        status: 'completed'
      },
      {
        id: 2,
        action: 'Người bán đã xác nhận đơn hàng',
        timestamp: '03/09/2025, 14:30',
        status: orderStatus === 'pending' ? 'pending' : 'completed'
      },
      {
        id: 3,
        action: 'Đơn hàng đang được vận chuyển',
        timestamp: '03/09/2025, 15:30',
        status: orderStatus === 'delivering' || orderStatus === 'delivered' ? 'completed' : 'pending'
      },
      {
        id: 4,
        action: 'Hàng đã đến',
        timestamp: '04/09/2025, 7:30',
        status: orderStatus === 'delivered' ? 'completed' : 'pending'
      }
    ]
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className='bg-orange-100 text-orange-800 hover:bg-orange-100'>
            <Clock className='w-3 h-3 mr-1' />
            Chờ xác nhận
          </Badge>
        )
      case 'confirmed':
        return (
          <Badge className='bg-blue-100 text-blue-800 hover:bg-blue-100'>
            <CheckCircle className='w-3 h-3 mr-1' />
            Đã xác nhận
          </Badge>
        )
      case 'delivering':
        return (
          <Badge className='bg-blue-100 text-blue-800 hover:bg-blue-100'>
            <Truck className='w-3 h-3 mr-1' />
            Đang giao
          </Badge>
        )
      case 'delivered':
        return (
          <Badge className='bg-green-100 text-green-800 hover:bg-green-100'>
            <Package className='w-3 h-3 mr-1' />
            Đã giao
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className='bg-red-100 text-red-800 hover:bg-red-100'>
            <X className='w-3 h-3 mr-1' />
            Đã hủy
          </Badge>
        )
      default:
        return (
          <Badge className='bg-gray-100 text-gray-800 hover:bg-gray-100'>
            {status}
          </Badge>
        )
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className='w-4 h-4 text-blue-600' />
      case 'pending':
        return <Clock className='w-4 h-4 text-gray-400' />
      default:
        return <Clock className='w-4 h-4 text-gray-400' />
    }
  }

  const handleStatusChange = (newStatus: string) => {
    setOrderStatus(newStatus)
  }

  const getActionButtons = () => {
    switch (orderStatus) {
      case 'pending':
        return (
          <>
            <Button
              className='bg-green-600 hover:bg-green-700 text-white'
              onClick={() => handleStatusChange('confirmed')}
            >
              <CheckCircle className='w-4 h-4 mr-2' />
              XÁC NHẬN ĐƠN HÀNG
            </Button>
            <Button
              variant='outline'
              className='border-red-500 text-red-600 hover:bg-red-50'
              onClick={() => handleStatusChange('cancelled')}
            >
              <X className='w-4 h-4 mr-2' />
              Hủy đơn hàng
            </Button>
          </>
        )
      case 'confirmed':
        return (
          <Button
            className='bg-blue-600 hover:bg-blue-700 text-white'
            onClick={() => handleStatusChange('delivering')}
          >
            <Truck className='w-4 h-4 mr-2' />
            BẮT ĐẦU GIAO HÀNG
          </Button>
        )
      case 'delivering':
        return (
          <Button
            className='bg-green-600 hover:bg-green-700 text-white'
            onClick={() => handleStatusChange('delivered')}
          >
            <Package className='w-4 h-4 mr-2' />
            ĐÃ GIAO HÀNG
          </Button>
        )
      case 'delivered':
        return (
          <>
            <Button variant='outline' className='border-blue-500 text-blue-600 hover:bg-blue-50'>
              <Star className='w-4 h-4 mr-2' />
              Xem đánh giá
            </Button>
            <Button variant='outline' className='border-red-500 text-red-600 hover:bg-red-50'>
              <Flag className='w-4 h-4 mr-2' />
              Báo cáo
            </Button>
          </>
        )
      case 'cancelled':
        return (
          <div className='text-sm text-gray-500'>
            Đơn hàng đã bị hủy
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => navigate('/ordersSeller')}
            className='text-gray-600 hover:text-gray-900'
          >
            <ArrowLeft className='w-4 h-4' />
          </Button>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>
              Chi tiết Đơn hàng #{orderData.id}
            </h1>
            <p className='text-gray-600 mt-1'>Ngày đặt: {orderData.date}</p>
          </div>
        </div>
        {getStatusBadge(orderData.status)}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column - Main Content */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Product List */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-green-700'>
                <Package className='w-5 h-5' />
                Danh sách sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {orderData.products.map((product) => (
                  <div key={product.id} className='flex items-center gap-4 p-4 border border-gray-200 rounded-lg'>
                    <div className='w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center'>
                      <Package className='w-8 h-8 text-gray-400' />
                    </div>
                    <div className='flex-1'>
                      <h4 className='font-medium text-gray-900'>{product.name}</h4>
                      <p className='text-sm text-gray-600'>{product.description}</p>
                    </div>
                    <div className='text-right'>
                      <p className='font-medium text-gray-900'>{product.price.toLocaleString()}₫</p>
                      <p className='text-sm text-gray-600'>x{product.quantity}</p>
                    </div>
                    <div className='text-right font-medium text-gray-900'>
                      {(product.price * product.quantity).toLocaleString()}₫
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-green-700'>
                <CheckCircle className='w-5 h-5' />
                Tổng kết thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Tổng tiền hàng:</span>
                  <span className='font-medium'>{orderData.summary.subtotal.toLocaleString()}₫</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Phí vận chuyển:</span>
                  <span className='font-medium'>{orderData.summary.shipping.toLocaleString()}₫</span>
                </div>
                <div className='border-t pt-3'>
                  <div className='flex justify-between'>
                    <span className='text-lg font-semibold text-gray-900'>Tổng cộng:</span>
                    <span className='text-lg font-bold text-green-600'>
                      {orderData.summary.total.toLocaleString()}₫
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order History */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-green-700'>
                <Clock className='w-5 h-5' />
                Lịch sử đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {orderData.history.map((item) => (
                  <div key={item.id} className='flex items-start gap-3'>
                    <div className='flex-shrink-0 mt-1'>
                      {getStatusIcon(item.status)}
                    </div>
                    <div className='flex-1'>
                      <p className='text-sm text-gray-900'>{item.action}</p>
                      <p className='text-xs text-gray-500'>{item.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className='space-y-6'>
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-green-700'>
                <User className='w-5 h-5' />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center'>
                  <User className='w-6 h-6 text-gray-400' />
                </div>
                <div>
                  <h4 className='font-medium text-gray-900'>{orderData.customer.name}</h4>
                  <p className='text-sm text-green-600'>{orderData.customer.type}</p>
                </div>
              </div>

              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Phone className='w-4 h-4' />
                  {orderData.customer.phone}
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Mail className='w-4 h-4' />
                  {orderData.customer.email}
                </div>
              </div>

              <Button variant='outline' className='w-full border-blue-500 text-blue-600 hover:bg-blue-50'>
                <MessageCircle className='w-4 h-4 mr-2' />
                Gửi tin nhắn cho khách hàng
              </Button>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-green-700'>
                <Truck className='w-5 h-5' />
                Thông tin giao hàng
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <p className='text-sm font-medium text-gray-700 mb-1'>Địa chỉ giao hàng:</p>
                <p className='text-sm text-gray-600 flex items-start gap-2'>
                  <MapPin className='w-4 h-4 mt-0.5 flex-shrink-0' />
                  {orderData.shipping.address}
                </p>
              </div>

              <div>
                <p className='text-sm font-medium text-gray-700 mb-1'>Đơn vị vận chuyển:</p>
                <p className='text-sm text-gray-600'>{orderData.shipping.carrier}</p>
              </div>

              <div>
                <p className='text-sm font-medium text-gray-700 mb-1'>Ghi chú từ khách hàng:</p>
                <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
                  <p className='text-sm text-gray-700'>"{orderData.shipping.note}"</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-green-700'>
                <Settings className='w-5 h-5' />
                Thao tác
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {getActionButtons()}
                {orderStatus === 'cancelled' && (
                  <p className='text-xs text-gray-500'>Hủy đơn cần lý do hủy</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default OrderDetail
