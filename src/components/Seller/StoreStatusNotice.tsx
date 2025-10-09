import { Card, Button, Steps, Tag } from 'antd'
import { Store, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useStore } from '../../contexts/store.context'
import { useNavigate } from 'react-router-dom'
import path from '../../constants/path'

// const { Step } = Steps

function StoreStatusNotice() {
  const { store } = useStore()
  const navigate = useNavigate()

  if (!store) return null

  const getStatusInfo = () => {
    switch (store.status) {
      case 'Pending':
        return {
          icon: <Clock className="text-yellow-500" size={24} />,
          title: 'Cửa hàng đang chờ duyệt',
          description: 'Hồ sơ cửa hàng của bạn đang được xem xét bởi đội ngũ quản trị.',
          color: 'warning',
          step: 0
        }
      case 'Processing':
        return {
          icon: <AlertCircle className="text-blue-500" size={24} />,
          title: 'Đang được xử lý',
          description: 'Nhân viên đang xem xét chi tiết hồ sơ cửa hàng của bạn.',
          color: 'processing',
          step: 1
        }
      case 'ReviewedByStaff':
        return {
          icon: <CheckCircle className="text-green-500" size={24} />,
          title: 'Đã được nhân viên xem xét',
          description: 'Hồ sơ đã được nhân viên phê duyệt và chuyển lên admin để duyệt cuối cùng.',
          color: 'success',
          step: 2
        }
      case 'Rejected':
        return {
          icon: <XCircle className="text-red-500" size={24} />,
          title: 'Hồ sơ bị từ chối',
          description: 'Hồ sơ cửa hàng không đáp ứng yêu cầu. Vui lòng cập nhật và gửi lại.',
          color: 'error',
          step: -1
        }
      case 'Inactive':
        return {
          icon: <XCircle className="text-red-500" size={24} />,
          title: 'Cửa hàng bị tạm khóa',
          description: 'Cửa hàng của bạn đã bị tạm khóa. Liên hệ admin để biết thêm chi tiết.',
          color: 'error',
          step: -1
        }
      default:
        return null
    }
  }

  const statusInfo = getStatusInfo()
  if (!statusInfo) return null

  const steps = [
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
      title: 'Duyệt bởi nhân viên',
      description: 'Nhân viên phê duyệt hồ sơ',
      icon: <CheckCircle size={16} />
    },
    {
      title: 'Phê duyệt cuối cùng',
      description: 'Admin phê duyệt và kích hoạt',
      icon: <CheckCircle size={16} />
    }
  ]

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="border-l-4 border-l-yellow-400">
        <div className="flex items-start gap-4">
          {statusInfo.icon}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {statusInfo.title}
            </h3>
            <p className="text-gray-600 mb-4">
              {statusInfo.description}
            </p>
            
            {/* Store Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{store.storeName}</h4>
                  <p className="text-sm text-gray-500">
                    Ngày đăng ký: {new Date(store.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <Tag color={statusInfo.color === 'warning' ? 'orange' : statusInfo.color}>
                  {statusInfo.title}
                </Tag>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                type="primary" 
                onClick={() => navigate(`${path.BASE_SELLER}/${path.setupStoreSeller}`)}
              >
                Xem thông tin cửa hàng
              </Button>
              {store.status === 'Rejected' && (
                <Button 
                  onClick={() => navigate(`${path.BASE_SELLER}/${path.setupStoreSeller}`)}
                >
                  Cập nhật hồ sơ
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Progress Steps */}
      {statusInfo.step >= 0 && (
        <Card title="Tiến trình phê duyệt">
          <Steps
            current={statusInfo.step}
            status={store.status === 'Rejected' ? 'error' : 'process'}
            items={steps}
          />
          
          {/* Additional Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 Lưu ý quan trọng</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Thời gian xử lý hồ sơ thường từ 1-3 ngày làm việc</li>
              <li>• Đảm bảo thông tin cửa hàng chính xác và đầy đủ</li>
              <li>• Kiểm tra email thường xuyên để nhận thông báo cập nhật</li>
              <li>• Liên hệ hỗ trợ nếu có thắc mắc về quá trình duyệt</li>
            </ul>
          </div>
        </Card>
      )}

      {/* Rejection Details */}
      {store.status === 'Rejected' && store.adminNote && (
        <Card title="Lý do từ chối" className="border-l-4 border-l-red-400">
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-red-800">{store.adminNote}</p>
          </div>
        </Card>
      )}
    </div>
  )
}

export default StoreStatusNotice