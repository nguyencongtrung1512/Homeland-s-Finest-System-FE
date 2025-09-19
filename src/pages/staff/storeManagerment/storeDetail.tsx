import { Card, Button, Avatar } from 'antd'
import { ArrowLeft, Store, User, FileText, Clock, Edit, Lock, Mail, Phone, CreditCard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function StoreDetail() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1) // Go back to previous page
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="text"
            icon={<ArrowLeft size={16} />}
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            Trở về danh sách cửa hàng
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Chi tiết cửa hàng</h1>
        <div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Store Information */}
          <Card
            title={
              <div className="flex items-center gap-2 text-blue-600">
                <Store size={18} />
                <span>Thông tin cửa hàng</span>
              </div>
            }
            className="border-l-4 border-l-blue-500"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl font-bold">T</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-gray-900">TechMart Vietnam</h2>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 font-medium">Hoạt động</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Ngành hàng:</span>
                  <p className="font-medium text-gray-900">Điện tử & Công nghệ</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Địa chỉ kinh doanh:</span>
                  <p className="font-medium text-gray-900">123 Nguyễn Huệ, Quận 1, TP.HCM</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Ngày đăng ký:</span>
                  <p className="font-medium text-gray-900">15/03/2024</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Số lượng sản phẩm:</span>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">247 sản phẩm</p>
                    <Button type="link" className="p-0 h-auto text-blue-600">
                      Xem tất cả sản phẩm
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Legal Representative */}
          <Card
            title={
              <div className="flex items-center gap-2 text-purple-600">
                <User size={18} />
                <span>Người đại diện pháp lý</span>
              </div>
            }
            className="border-l-4 border-l-purple-500"
          >
            <div className="flex items-start gap-4">
              <Avatar
                size={64}
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop"
                className="border-2 border-gray-200"
              />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Nguyễn Văn An</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-gray-700">nguyen.van.an@techmart.vn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <span className="text-gray-700">0901234567</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-gray-400" />
                    <span className="text-gray-700">123456789012</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-3">Ảnh CMND/CCCD</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Mặt trước</p>
                  <div className="w-full h-32 bg-blue-100 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300">
                    <div className="text-center">
                      <div className="w-16 h-10 bg-blue-600 rounded mb-2 mx-auto"></div>
                      <p className="text-xs text-blue-600">CMND Mặt trước</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Mặt sau</p>
                  <div className="w-full h-32 bg-red-100 rounded-lg flex items-center justify-center border-2 border-dashed border-red-300">
                    <div className="text-center">
                      <div className="w-16 h-10 bg-red-600 rounded mb-2 mx-auto"></div>
                      <p className="text-xs text-red-600">CMND Mặt sau</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Legal Documents & Bank Account */}
          <Card
            title={
              <div className="flex items-center gap-2 text-green-600">
                <FileText size={18} />
                <span>Giấy tờ & tài khoản pháp lý</span>
              </div>
            }
            className="border-l-4 border-l-green-500"
          >
            <div className="space-y-6">
              {/* Certification Documents */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Giấy tờ chứng nhận</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-gray-400" />
                      <span className="text-gray-700">Giấy phép kinh doanh</span>
                    </div>
                    <Button type="link" className="text-blue-600 p-0 h-auto">
                      Xem
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-gray-400" />
                      <span className="text-gray-700">Chứng nhận đăng ký thuế</span>
                    </div>
                    <Button type="link" className="text-blue-600 p-0 h-auto">
                      Xem
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bank Account Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Thông tin tài khoản ngân hàng</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Ngân hàng</span>
                    <p className="font-medium text-gray-900">Vietcombank</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Số tài khoản</span>
                    <p className="font-medium text-gray-900">0123456789</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Chủ tài khoản</span>
                    <p className="font-medium text-gray-900">NGUYEN VAN AN</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Processing History */}
          <Card
            title={
              <div className="flex items-center gap-2 text-orange-600">
                <Clock size={18} />
                <span>Lịch sử xử lý</span>
              </div>
            }
            className="border-l-4 border-l-orange-500"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Đăng ký tài khoản seller</p>
                  <p className="text-sm text-gray-500">15/03/2024, 09:30</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Cập nhật thông tin cửa hàng</p>
                  <p className="text-sm text-gray-500">16/03/2024, 14:15</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Duyệt cửa hàng thành công</p>
                  <p className="text-sm text-gray-500">18/03/2024, 10:45</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          <Card
            title={
              <div className="flex items-center gap-2 text-gray-600">
                <Edit size={18} />
                <span>Hành động</span>
              </div>
            }
            className="border-l-4 border-l-gray-400"
          >
            <div className="space-y-3">
              <Button
                type="primary"
                icon={<Edit size={16} />}
                className="w-full bg-yellow-500 hover:bg-yellow-600 border-yellow-500 hover:border-yellow-600"
                size="large"
              >
                Yêu cầu chỉnh sửa
              </Button>
              <Button
                type="primary"
                icon={<Lock size={16} />}
                className="w-full bg-red-500 hover:bg-red-600 border-red-500 hover:border-red-600"
                size="large"
              >
                Khóa cửa hàng
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default StoreDetail
