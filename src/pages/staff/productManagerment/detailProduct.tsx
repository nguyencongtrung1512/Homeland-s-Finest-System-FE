import { ArrowLeft, X, Check, XCircle, User, Mail, Phone, Home, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'

function DetailProduct() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate('/managerProductStaff')
  }

  const handleApprove = () => {
    console.log('Approving product')
  }

  const handleReject = () => {
    console.log('Rejecting product')
  }

  // const handleCancel = () => {
  //   console.log('Canceling action')
  // }

  // const handleConfirm = () => {
  //   console.log('Confirming action')
  // }

  return (
    <div className='space-y-6'>
      {/* Header with Back Button */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleBack}
            className='flex items-center gap-2 text-gray-600 hover:text-gray-900'
          >
            <ArrowLeft size={16} />
            Quay lại quản lý sản phẩm
          </Button>
        </div>
        <h1 className='text-2xl font-bold text-gray-900'>Chi tiết sản phẩm</h1>
        <div></div>
      </div>

      {/* Main Content */}
      <Card className='shadow-lg p-5'>
        {/* Product Review Section */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 bg-orange-500 rounded-full'></div>
              <h2 className='text-xl font-bold text-gray-900'>Đánh giá sản phẩm</h2>
            </div>
            <Button variant='ghost' size='sm' className='text-gray-400 hover:text-gray-600'>
              <X size={16} />
            </Button>
          </div>

          <div className='flex gap-6'>
            {/* Product Image */}
            <div className='w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center'>
              <div className='text-center'>
                <div className='w-48 h-48 bg-green-100 rounded-lg mb-2 flex items-center justify-center'>
                  <span className='text-green-600 text-sm'>Product Image</span>
                </div>
                <p className='text-xs text-gray-500'>Rau củ hữu cơ</p>
              </div>
            </div>

            {/* Product Details */}
            <div className='flex-1'>
              <h3 className='text-2xl font-bold text-gray-900 mb-4'>Rau củ hữu cơ tươi ngon</h3>

              <p className='text-gray-700 mb-4 leading-relaxed'>
                Combo rau củ hữu cơ được trồng hoàn toàn tự nhiên, không sử dụng thuốc trừ sâu hay phân bón hóa học. Sản
                phẩm được thu hoạch tươi mỗi ngày, đảm bảo chất lượng và độ tươi ngon cao nhất cho gia đình bạn.
              </p>

              <div className='mb-6'>
                <Badge variant='secondary' className='text-lg px-4 py-2 bg-green-100 text-green-800'>
                  250.000₫ /combo
                </Badge>
              </div>

              {/* Staff Actions */}
              <div className='mb-4'>
                <div className='flex items-center gap-2 mb-3'>
                  <User size={16} className='text-green-600' />
                  <span className='font-semibold text-gray-900'>Hành động của Staff</span>
                </div>

                <div className='flex gap-3 mb-3'>
                  <Button
                    onClick={handleApprove}
                    className='bg-green-600 hover:bg-green-700 text-white'
                  >
                    <Check size={16} className='mr-2' />
                    Duyệt sản phẩm
                  </Button>
                  <Button
                    onClick={handleReject}
                    className='bg-red-600 hover:bg-red-700 text-white'
                  >
                    <XCircle size={16} className='mr-2' />
                    Từ chối
                  </Button>
                </div>
              </div>

              <div className='text-sm text-gray-600'>
                <span className='font-medium'>note của staff:</span> sản phẩm ko liên quan đến cửa hàng
              </div>
            </div>
          </div>
        </div>

        {/* Store Information and Approval History - Side by Side */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Store Information Section */}
          <div className='bg-gray-50 rounded-lg p-6 border border-gray-200'>
            <div className='flex items-center gap-2 mb-6'>
              <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                <Home size={18} className='text-blue-600' />
              </div>
              <h2 className='text-xl font-bold text-gray-900'>Thông tin cửa hàng</h2>
            </div>

            <div className='flex items-start gap-4'>
              <Avatar className='w-16 h-16 shadow-md'>
                <AvatarFallback className='bg-green-600 text-white'>
                  <Home size={24} />
                </AvatarFallback>
              </Avatar>
              <div className='flex-1'>
                <h3 className='text-lg font-bold text-gray-900 mb-2'>Nông trại Xanh</h3>
                <p className='text-gray-600 mb-4 text-sm'>Cửa hàng thực phẩm hữu cơ</p>

                <div className='space-y-3'>
                  <div className='flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100'>
                    <div className='w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center'>
                      <User size={14} className='text-gray-500' />
                    </div>
                    <span className='text-gray-700 font-medium'>Nguyễn Văn An</span>
                  </div>
                  <div className='flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100'>
                    <div className='w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center'>
                      <Mail size={14} className='text-gray-500' />
                    </div>
                    <span className='text-gray-700 font-medium'>nongtraixen@email.com</span>
                  </div>
                  <div className='flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100'>
                    <div className='w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center'>
                      <Phone size={14} className='text-gray-500' />
                    </div>
                    <span className='text-gray-700 font-medium'>0123 456 789</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Approval History Section */}
          <div className='bg-gray-50 rounded-lg p-6 border border-gray-200'>
            <div className='flex items-center gap-2 mb-6'>
              <div className='w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center'>
                <Clock size={18} className='text-orange-600' />
              </div>
              <h2 className='text-xl font-bold text-gray-900'>Lịch sử duyệt</h2>
            </div>

            <div className='space-y-4'>
              <div className='bg-white rounded-lg p-4 border border-gray-100'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-600'>Trạng thái</span>
                </div>
                <Badge variant='secondary' className='bg-orange-100 text-orange-800 px-3 py-1 text-sm font-medium'>
                  Chờ duyệt
                </Badge>
              </div>

              <div className='bg-white rounded-lg p-4 border border-gray-100'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-600'>Ngày gửi</span>
                </div>
                <span className='text-gray-900 font-semibold'>15/01/2024</span>
              </div>

              <div className='bg-white rounded-lg p-4 border border-gray-100'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-600'>Thời gian xử lý</span>
                </div>
                <span className='text-gray-900 font-semibold'>2 ngày</span>
              </div>
            </div>
          </div>
        </div>

      </Card>
    </div>
  )
}

export default DetailProduct
