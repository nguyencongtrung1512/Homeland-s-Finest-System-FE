import { useState } from 'react'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { FileText, Star, DollarSign, Truck, RotateCcw, Lock, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import CreateHelpModal from './createHelp'

function HelpCenter() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('pending')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Mock data for policies
  const policies = [
    {
      id: 1,
      title: 'Điều khoản dịch vụ',
      description: 'Quy định chung về việc sử dụng nền tảng và dịch vụ của chúng tôi.',
      icon: <FileText className='w-6 h-6 text-green-600' />
    },
    {
      id: 2,
      title: 'Chính sách chất lượng',
      description: 'Tiêu chuẩn chất lượng sản phẩm và dịch vụ khách hàng.',
      icon: <Star className='w-6 h-6 text-green-600' />
    },
    {
      id: 3,
      title: 'Chính sách thanh toán',
      description: 'Hướng dẫn về phương thức thanh toán và quy trình rút tiền.',
      icon: <DollarSign className='w-6 h-6 text-green-600' />
    },
    {
      id: 4,
      title: 'Chính sách vận chuyển',
      description: 'Quy định về đóng gói, giao hàng và xử lý khiếu nại.',
      icon: <Truck className='w-6 h-6 text-green-600' />
    },
    {
      id: 5,
      title: 'Chính sách đổi trả',
      description: 'Quy trình xử lý đơn hàng đổi trả và hoàn tiền.',
      icon: <RotateCcw className='w-6 h-6 text-green-600' />
    },
    {
      id: 6,
      title: 'Chính sách bảo mật',
      description: 'Cam kết bảo vệ thông tin cá nhân và dữ liệu của người dùng.',
      icon: <Lock className='w-6 h-6 text-green-600' />
    }
  ]

  // Mock data for support requests
  const supportRequests = [
    {
      id: 'HT-86251',
      title: 'Không thể cập nhật thông tin sản phẩm',
      dateSent: '15/12/2024',
      lastUpdated: '16/12/2024, 14:30',
      status: 'waiting_staff',
      statusText: 'Đang chờ NV hỗ trợ'
    },
    {
      id: 'HT-86198',
      title: 'Vấn đề thanh toán từ khách hàng',
      dateSent: '14/12/2024',
      lastUpdated: '15/12/2024, 09:15',
      status: 'waiting_response',
      statusText: 'Đang chờ bạn phản hồi'
    },
    {
      id: 'HT-86142',
      title: 'Hướng dẫn tối ưu hóa cửa hàng',
      dateSent: '12/12/2024',
      lastUpdated: '13/12/2024, 16:45',
      status: 'resolved',
      statusText: 'Đã giải quyết'
    },
    {
      id: 'HT-86089',
      title: 'Lỗi upload ảnh sản phẩm',
      dateSent: '10/12/2024',
      lastUpdated: '11/12/2024, 11:20',
      status: 'waiting_staff',
      statusText: 'Đang chờ NV hỗ trợ'
    },
    {
      id: 'HT-86034',
      title: 'Thay đổi thông tin ngân hàng',
      dateSent: '06/12/2024',
      lastUpdated: '09/12/2024, 14:55',
      status: 'resolved',
      statusText: 'Đã giải quyết'
    }
  ]

  const getStatusBadge = (status: string, statusText: string) => {
    switch (status) {
      case 'waiting_staff':
        return <Badge className='bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200'>{statusText}</Badge>
      case 'waiting_response':
        return (
          <Badge className='bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200'>{statusText}</Badge>
        )
      case 'resolved':
        return <Badge className='bg-green-100 text-green-800 hover:bg-green-100 border-green-200'>{statusText}</Badge>
      default:
        return <Badge className='bg-gray-100 text-gray-800 hover:bg-gray-100'>{statusText}</Badge>
    }
  }

  const handleCreateRequest = () => {
    setIsCreateModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
  }

  const handleViewDetails = (requestId: string) => {
    navigate(`/detailHelp/${requestId}`)
  }

  const filteredRequests = supportRequests.filter((request) => {
    if (activeTab === 'all') return true
    if (activeTab === 'pending') return request.status !== 'resolved'
    if (activeTab === 'resolved') return request.status === 'resolved'
    return true
  })

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-green-700 mb-2'>Trung tâm trợ giúp</h1>
        <p className='text-gray-600'>Chúng tôi có thể giúp gì cho bạn?</p>
      </div>

      {/* Policies & Regulations Section */}
      <div className='mb-12'>
        <div className='flex items-center gap-2 mb-6'>
          <div className='w-6 h-6 bg-green-100 rounded flex items-center justify-center'>
            <Lock className='w-4 h-4 text-green-600' />
          </div>
          <h2 className='text-xl font-semibold text-green-700'>Chính sách & Quy định</h2>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {policies.map((policy) => (
            <Card key={policy.id} className='hover:shadow-md transition-shadow cursor-pointer'>
              <CardContent className='p-6'>
                <div className='flex flex-col items-center text-center space-y-4'>
                  <div className='w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center'>{policy.icon}</div>
                  <div>
                    <h3 className='font-semibold text-green-700 mb-2'>{policy.title}</h3>
                    <p className='text-sm text-gray-600 mb-4'>{policy.description}</p>
                    <button className='text-yellow-600 text-sm font-medium hover:text-yellow-700'>
                      Xem chi tiết →
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Support Requests Section */}
      <div>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-xl font-semibold text-green-700'>Yêu cầu Hỗ trợ của tôi</h2>
          <Button onClick={handleCreateRequest} className='bg-yellow-500 hover:bg-yellow-600 text-white'>
            <Plus className='w-4 h-4 mr-2' />
            Tạo yêu cầu mới
          </Button>
        </div>

        {/* Tabs */}
        <div className='flex space-x-8 border-b border-gray-200 mb-6'>
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'pending', label: 'Đang chờ xử lý' },
            { key: 'resolved', label: 'Đã giải quyết' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Support Requests Table */}
        <Card>
          <CardContent className='p-0'>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-gray-200'>
                    <th className='text-left py-4 px-6 font-medium text-gray-700'>Mã yêu cầu</th>
                    <th className='text-left py-4 px-6 font-medium text-gray-700'>Tiêu đề</th>
                    <th className='text-left py-4 px-6 font-medium text-gray-700'>Ngày gửi</th>
                    <th className='text-left py-4 px-6 font-medium text-gray-700'>Cập nhật lần cuối</th>
                    <th className='text-left py-4 px-6 font-medium text-gray-700'>Trạng thái</th>
                    <th className='text-left py-4 px-6 font-medium text-gray-700'>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className='border-b border-gray-100 hover:bg-gray-50'>
                      <td className='py-4 px-6 text-gray-900 font-medium'>#{request.id}</td>
                      <td className='py-4 px-6 text-gray-700'>{request.title}</td>
                      <td className='py-4 px-6 text-gray-700'>{request.dateSent}</td>
                      <td className='py-4 px-6 text-gray-700'>{request.lastUpdated}</td>
                      <td className='py-4 px-6'>{getStatusBadge(request.status, request.statusText)}</td>
                      <td className='py-4 px-6'>
                        <button
                          onClick={() => handleViewDetails(request.id)}
                          className='text-yellow-600 text-sm font-medium hover:text-yellow-700'
                        >
                          Xem chi tiết →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className='flex items-center justify-between p-6 border-t border-gray-200'>
              <div className='text-sm text-gray-700'>Hiển thị 1 đến 5 của 23 kết quả</div>
              <div className='flex items-center gap-2'>
                <Button variant='outline' size='sm' className='text-gray-600'>
                  Trước
                </Button>
                <Button size='sm' className='bg-green-600 hover:bg-green-700 text-white'>
                  1
                </Button>
                <Button variant='outline' size='sm' className='text-gray-600'>
                  2
                </Button>
                <Button variant='outline' size='sm' className='text-gray-600'>
                  3
                </Button>
                <Button variant='outline' size='sm' className='text-gray-600'>
                  Tiếp
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Help Modal */}
      <CreateHelpModal isOpen={isCreateModalOpen} onClose={handleCloseModal} />
    </div>
  )
}

export default HelpCenter
