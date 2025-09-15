import { useState } from 'react'
import { ArrowLeft, Flag, RefreshCw, CheckCircle, Lock, Mail, Phone, Calendar, User, ShoppingCart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'

interface ReportDetail {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAvatar: string
  reportReason: string
  reportDescription: string
  reportEvidence: string[]
  reportCreateTime: string
  productName: string
  productId: string
  productPrice: number
  productImage: string
  productStatus: string
  processingHistory: {
    id: string
    action: string
    time: string
    user: string
    description?: string
    icon: 'flag' | 'refresh' | 'check' | 'lock'
  }[]
}

function ReportDetail() {
  const [report] = useState<ReportDetail>({
    id: 'R001',
    customerName: 'Nguyễn Thị Mai',
    customerEmail: 'mai.nguyen@email.com',
    customerPhone: '0123 456 789',
    customerAvatar: 'NM',
    reportReason: 'Sản phẩm giả mạo',
    reportDescription: 'Sản phẩm này có chất lượng rất kém, không giống như mô tả. Tôi nghi ngờ đây là hàng giả mạo vì logo và bao bì trông rất khác so với sản phẩm chính hãng.',
    reportEvidence: [
      '/api/placeholder/80/80',
      '/api/placeholder/80/80',
      '/api/placeholder/80/80',
      '/api/placeholder/80/80'
    ],
    reportCreateTime: '15/01/2024 14:30',
    productName: 'iPhone 15 Pro Max 256GB',
    productId: 'SP001234',
    productPrice: 25990000,
    productImage: '/api/placeholder/80/80',
    productStatus: 'Đang bán',
    processingHistory: [
      {
        id: '1',
        action: 'Tạo báo cáo',
        time: '15/01/2024 14:30',
        user: 'Khách hàng Nguyễn Thị Mai',
        icon: 'flag'
      },
      {
        id: '2',
        action: 'Đang xử lý',
        time: '15/01/2024 15:00',
        user: 'Admin Trần Văn A',
        description: 'Đã tiếp nhận và bắt đầu xem xét báo cáo',
        icon: 'refresh'
      }
    ]
  })

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'flag':
        return <Flag className='w-4 h-4 text-blue-600' />
      case 'refresh':
        return <RefreshCw className='w-4 h-4 text-orange-600' />
      case 'check':
        return <CheckCircle className='w-4 h-4 text-green-600' />
      case 'lock':
        return <Lock className='w-4 h-4 text-red-600' />
      default:
        return <Flag className='w-4 h-4 text-gray-600' />
    }
  }

  const handleBack = () => {
    console.log('Back to reports list')
  }

  const handleMarkProcessing = () => {
    console.log('Mark as processing')
  }

  const handleMarkProcessed = () => {
    console.log('Mark as processed')
  }

  const handleLockProduct = () => {
    console.log('Lock product')
  }

  const handleSendFeedback = () => {
    console.log('Send feedback')
  }

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='sm' onClick={handleBack} className='h-8 w-8 p-0'>
          <ArrowLeft className='w-4 h-4' />
        </Button>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Chi tiết báo cáo</h1>
          <p className='text-sm text-gray-600'>#{report.id}</p>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Left Column */}
        <div className='space-y-6'>
          {/* Customer Information */}
          <Card className='bg-white shadow-sm'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <User className='w-5 h-5 text-blue-600' />
                Thông tin khách hàng báo cáo
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center gap-4'>
                <Avatar className='w-16 h-16'>
                  <AvatarFallback className='bg-blue-100 text-blue-600 text-lg font-semibold'>
                    {report.customerAvatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className='font-semibold text-gray-900 text-lg'>{report.customerName}</h3>
                  <div className='space-y-1 mt-2'>
                    <div className='flex items-center gap-2'>
                      <Mail className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-700'>{report.customerEmail}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Phone className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-700'>{report.customerPhone}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className='flex items-center gap-2 pt-2 border-t border-gray-200'>
                <Calendar className='w-4 h-4 text-gray-400' />
                <span className='text-sm text-gray-600'>Thời gian tạo: {report.reportCreateTime}</span>
              </div>
            </CardContent>
          </Card>

          {/* Report Content */}
          <Card className='bg-white shadow-sm'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <Flag className='w-5 h-5 text-red-600' />
                Nội dung chi tiết báo cáo
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Report Reason */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Lý do báo cáo</label>
                <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                  <span className='text-red-700 font-medium'>{report.reportReason}</span>
                </div>
              </div>

              {/* Report Description */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Mô tả chi tiết</label>
                <div className='bg-gray-50 border border-gray-200 rounded-lg p-3'>
                  <p className='text-gray-700 text-sm leading-relaxed'>{report.reportDescription}</p>
                </div>
              </div>

              {/* Evidence */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Bằng chứng</label>
                <div className='flex gap-2'>
                  {report.reportEvidence.map((_, index) => (
                    <div key={index} className='w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center'>
                      <span className='text-xs text-gray-500'>IMG</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className='space-y-6'>
          {/* Product Information */}
          <Card className='bg-white shadow-sm'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <ShoppingCart className='w-5 h-5 text-green-600' />
                Thông tin sản phẩm bị báo cáo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center gap-4'>
                <div className='w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center'>
                  <span className='text-xs text-gray-500'>IMG</span>
                </div>
                <div className='flex-1'>
                  <h3 className='font-semibold text-gray-900 text-lg'>{report.productName}</h3>
                  <p className='text-sm text-gray-600 mt-1'>Mã sản phẩm: {report.productId}</p>
                  <p className='text-lg font-bold text-gray-900 mt-2'>
                    {report.productPrice.toLocaleString('vi-VN')} VNĐ
                  </p>
                  <Badge className='bg-green-100 text-green-600 mt-2'>
                    {report.productStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processing History */}
          <Card className='bg-white shadow-sm'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <RefreshCw className='w-5 h-5 text-orange-600' />
                Lịch sử xử lý báo cáo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {report.processingHistory.map((item) => (
                  <div key={item.id} className='flex items-start gap-3'>
                    <div className='w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0'>
                      {getIcon(item.icon)}
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium text-gray-900'>{item.action}</span>
                        <span className='text-xs text-gray-500'>{item.time}</span>
                      </div>
                      <p className='text-sm text-gray-600 mt-1'>{item.user}</p>
                      {item.description && (
                        <p className='text-sm text-gray-500 mt-1'>{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Processing Actions */}
          <Card className='bg-white shadow-sm'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <CheckCircle className='w-5 h-5 text-blue-600' />
                Hành động xử lý
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-3'>
                <Button
                  onClick={handleMarkProcessing}
                  className='bg-blue-600 hover:bg-blue-700 text-white h-12'
                >
                  <RefreshCw className='w-4 h-4 mr-2' />
                  <span className='text-sm'>Đánh dấu 'Đang xử lý'</span>
                </Button>
                <Button
                  onClick={handleMarkProcessed}
                  className='bg-green-600 hover:bg-green-700 text-white h-12'
                >
                  <CheckCircle className='w-4 h-4 mr-2' />
                  <span className='text-sm'>Đã xử lý</span>
                </Button>
                <Button
                  onClick={handleLockProduct}
                  className='bg-red-600 hover:bg-red-700 text-white h-12'
                >
                  <Lock className='w-4 h-4 mr-2' />
                  <span className='text-sm'>Khóa sản phẩm</span>
                </Button>
                <Button
                  onClick={handleSendFeedback}
                  variant='outline'
                  className='h-12'
                >
                  <Mail className='w-4 h-4 mr-2' />
                  <span className='text-sm'>Gửi phản hồi</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ReportDetail
