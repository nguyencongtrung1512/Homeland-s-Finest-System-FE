import { Store, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useStore } from '../../contexts/store.context'
import { useNavigate } from 'react-router-dom'
import path from '../../constants/path'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import { formatDate } from '../../utils/formatDate'

interface StepItem {
  title: string
  description: string
  icon: React.ReactNode
}

interface StepsProps {
  current: number
  status?: 'process' | 'error' | 'finish' | 'wait'
  items: StepItem[]
}

function Steps({ current, status = 'process', items }: StepsProps) {
  return (
    <div className='w-full'>
      <div className='flex items-start justify-between'>
        {items.map((item, index) => {
          const isCompleted = index < current
          const isCurrent = index === current
          const isError = status === 'error' && index === current
          const isWait = index > current

          return (
            <div key={index} className='flex flex-col items-center flex-1 relative'>
              {/* Connector Line */}
              {index < items.length - 1 && (
                <div
                  className={cn(
                    'absolute top-5 left-[50%] w-full h-0.5 -z-10',
                    isCompleted && status === 'error' && index + 1 === current
                      ? 'bg-red-500'
                      : isCompleted
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                  )}
                  style={{ width: 'calc(100% - 2rem)' }}
                />
              )}

              {/* Step Icon */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all mb-2 bg-white z-10',
                  isCompleted && !isError && 'bg-green-500 border-green-500 text-white',
                  isCurrent && !isError && 'border-blue-500 bg-blue-50 text-blue-500',
                  isError && 'border-red-500 bg-red-50 text-red-500',
                  isWait && 'border-gray-300 bg-white text-gray-400'
                )}
              >
                {isError ? (
                  <XCircle size={20} className='text-red-500' />
                ) : isCompleted ? (
                  <CheckCircle size={20} />
                ) : (
                  <div className='flex items-center justify-center'>{item.icon}</div>
                )}
              </div>

              {/* Step Content */}
              <div className='text-center max-w-[150px]'>
                <h4
                  className={cn(
                    'text-sm font-medium mb-1',
                    isCompleted && 'text-green-600',
                    isCurrent && !isError && 'text-blue-600',
                    isError && 'text-red-600',
                    isWait && 'text-gray-400'
                  )}
                >
                  {item.title}
                </h4>
                <p
                  className={cn(
                    'text-xs',
                    isCompleted && 'text-green-600',
                    isCurrent && !isError && 'text-blue-600',
                    isError && 'text-red-600',
                    isWait && 'text-gray-400'
                  )}
                >
                  {item.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StoreStatusNotice() {
  const { store } = useStore()
  const navigate = useNavigate()

  if (!store) return null

  const getStatusInfo = () => {
    switch (store.status) {
      case 'Pending':
        return {
          icon: <Clock className='text-yellow-500' size={24} />,
          title: 'Cửa hàng đang chờ duyệt',
          description: 'Hồ sơ cửa hàng của bạn đang được xem xét bởi đội ngũ quản trị.',
          color: 'warning',
          step: 0
        }
      case 'Processing':
        return {
          icon: <AlertCircle className='text-blue-500' size={24} />,
          title: 'Đang được xử lý',
          description: 'Nhân viên đang xem xét chi tiết hồ sơ cửa hàng của bạn.',
          color: 'processing',
          step: 1
        }
      case 'ApprovedByStaff':
        return {
          icon: <CheckCircle className='text-blue-500' size={24} />,
          title: 'Đang được xử lý',
          description: 'Nhân viên đã phê duyệt hồ sơ cửa hàng của bạn. Hồ sơ đang chờ admin phê duyệt cuối cùng.',
          color: 'processing',
          step: 2
        }
      case 'Rejected':
        return {
          icon: <XCircle className='text-red-500' size={24} />,
          title: 'Hồ sơ bị từ chối',
          description: 'Hồ sơ cửa hàng không đáp ứng yêu cầu. Vui lòng cập nhật và gửi lại.',
          color: 'error',
          step: 3
        }
      case 'RejectedByStaff':
        return {
          icon: <XCircle className='text-red-500' size={24} />,
          title: 'Hồ sơ bị từ chối',
          description: 'Nhân viên đã từ chối hồ sơ cửa hàng của bạn. Vui lòng kiểm tra lý do và cập nhật lại thông tin.',
          color: 'error',
          step: 2
        }
      case 'Inactive':
        return {
          icon: <XCircle className='text-red-500' size={24} />,
          title: 'Cửa hàng bị tạm khóa',
          description: 'Cửa hàng của bạn đã bị tạm khóa. Liên hệ admin để biết thêm chi tiết.',
          color: 'error',
          step: 0
        }
      default:
        return null
    }
  }

  const statusInfo = getStatusInfo()
  if (!statusInfo) return null

  // Create steps array with dynamic content based on status
  const steps: StepItem[] = [
    {
      title: 'Gửi hồ sơ',
      description: 'Hoàn thành thông tin cửa hàng',
      icon: <Store size={16} />
    },
    {
      title: 'Xử lý bởi nhân viên',
      description: 'Nhân viên xem xét hồ sơ',
      icon: <AlertCircle size={16} />
    },
    {
      title: store.status === 'RejectedByStaff' ? 'Từ chối bởi nhân viên' : 'Duyệt bởi nhân viên',
      description: store.status === 'RejectedByStaff' ? 'Nhân viên từ chối hồ sơ' : 'Nhân viên phê duyệt hồ sơ',
      icon: store.status === 'RejectedByStaff' ? <XCircle size={16} /> : <CheckCircle size={16} />
    },
    {
      title: store.status === 'Rejected' ? 'Từ chối hồ sơ' : 'Phê duyệt cuối cùng',
      description: store.status === 'Rejected' ? 'Admin từ chối hồ sơ' : 'Admin phê duyệt và kích hoạt',
      icon: store.status === 'Rejected' ? <XCircle size={16} /> : <CheckCircle size={16} />
    }
  ]

  const getBadgeVariant = () => {
    if (statusInfo.color === 'warning') return 'default'
    if (statusInfo.color === 'error') return 'destructive'
    if (statusInfo.color === 'success') return 'default'
    return 'default'
  }

  const getBadgeClassName = () => {
    if (statusInfo.color === 'warning') return 'bg-orange-500 text-white border-orange-500'
    if (statusInfo.color === 'processing') return 'bg-blue-500 text-white border-blue-500'
    if (statusInfo.color === 'success') return 'bg-green-500 text-white border-green-500'
    if (statusInfo.color === 'error') return 'bg-red-500 text-white border-red-500'
    return ''
  }

  return (
    <div className='space-y-6'>
      {/* Status Card */}
      <Card className={cn('border-l-4', statusInfo.color === 'warning' && 'border-l-yellow-400')}>
        <CardContent className='pt-6'>
          <div className='flex items-start gap-4'>
            {statusInfo.icon}
            <div className='flex-1'>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>{statusInfo.title}</h3>
              <p className='text-gray-600 mb-4'>{statusInfo.description}</p>

              {/* Store Info */}
              <div className='bg-gray-50 rounded-lg p-4 mb-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-medium text-gray-900'>{store.storeName}</h4>
                    <p className='text-sm text-gray-500'>Ngày đăng ký: {formatDate(store.createdAt)}</p>
                  </div>
                  <Badge variant={getBadgeVariant()} className={getBadgeClassName()}>
                    {statusInfo.title}
                  </Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex gap-3'>
                <Button variant='green' onClick={() => navigate(`${path.BASE_SELLER}/${path.setupStoreSeller}`)}>
                  Xem thông tin cửa hàng
                </Button>
                {(store.status === 'Rejected' || store.status === 'RejectedByStaff') && (
                  <Button variant='outline' onClick={() => navigate(`${path.BASE_SELLER}/${path.setupStoreSeller}`)}>
                    Cập nhật hồ sơ
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Steps */}
      {statusInfo.step !== -1 && statusInfo.step >= 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tiến trình phê duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <Steps
              current={statusInfo.step}
              status={store.status === 'Rejected' || store.status === 'RejectedByStaff' ? 'error' : 'process'}
              items={steps}
            />

            {/* Additional Info */}
            <div className='mt-6 p-4 bg-blue-50 rounded-lg'>
              <h4 className='font-medium text-blue-900 mb-2'>💡 Lưu ý quan trọng</h4>
              <ul className='text-sm text-blue-800 space-y-1'>
                <li>• Thời gian xử lý hồ sơ thường từ 1-3 ngày làm việc</li>
                <li>• Đảm bảo thông tin cửa hàng chính xác và đầy đủ</li>
                <li>• Kiểm tra email thường xuyên để nhận thông báo cập nhật</li>
                <li>• Liên hệ hỗ trợ nếu có thắc mắc về quá trình duyệt</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejection Details */}
      {store.status === 'RejectedByStaff' && (
        <Card className='border-l-4 border-l-red-400'>
          <CardHeader>
            <CardTitle>Lý do từ chối</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='bg-red-50 p-4 rounded-lg'>
              <p className='text-red-800'>{store.staffNotes || 'Không có lý do được cung cấp.'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejection Details */}
      {store.status === 'Rejected' && (
        <Card className='border-l-4 border-l-red-400'>
          <CardHeader>
            <CardTitle>Lý do từ chối</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='bg-red-50 p-4 rounded-lg'>
              <p className='text-red-800'>{store.adminNote || 'Không có lý do được cung cấp.'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default StoreStatusNotice
