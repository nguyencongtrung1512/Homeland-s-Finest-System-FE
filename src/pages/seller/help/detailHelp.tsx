import React from 'react'
import { Card, CardContent } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import {
  ArrowLeft,
  CheckCircle,
  Paperclip,
  User
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

function DetailHelp() {
  const navigate = useNavigate()
  const { requestId } = useParams()

  // Mock data for the specific request
  const requestData = {
    id: 'HT-86251',
    dateSent: '03/09/2025',
    status: 'resolved',
    statusText: 'Đã giải quyết',
    userRequest: {
      content: `Chào đội ngũ hỗ trợ,

Tôi là Nguyễn Thị Lan, chủ cửa hàng "Nông sản sạch Lan". Tôi gặp vấn đề nghiêm trọng với đơn hàng #DH-2025-001234. Khách hàng đã thanh toán qua VNPay nhưng giao dịch bị lỗi, tuy nhiên tiền vẫn bị trừ khỏi tài khoản khách hàng.

Đây là lần thứ 3 trong tuần này tôi gặp vấn đề tương tự, điều này ảnh hưởng nghiêm trọng đến uy tín cửa hàng của tôi. Khách hàng đã liên hệ phàn nàn và yêu cầu hoàn tiền ngay lập tức.

Xin hãy hỗ trợ tôi xử lý vấn đề này một cách khẩn cấp.

Trân trọng,
Nguyễn Thị Lan`,
      sentTime: '14:30, 03/09/2025',
      attachments: [
        {
          name: 'loi_thanh_toan.png',
          type: 'image'
        }
      ]
    },
    supportResponse: {
      agent: {
        name: 'Trần Mai Anh',
        title: 'Chuyên viên hỗ trợ kỹ thuật',
        avatar: null
      },
      content: `Chào chị Nguyễn Thị Lan,

Cảm ơn chị đã liên hệ với chúng tôi về vấn đề thanh toán VNPay. Tôi hiểu sự bất tiện này đã gây ra cho chị và khách hàng.

Sau khi kiểm tra hệ thống, chúng tôi đã xác định được nguyên nhân lỗi là do vấn đề đồng bộ dữ liệu tạm thời giữa VNPay và hệ thống của chúng tôi. Vấn đề này đã được khắc phục hoàn toàn.

**Các biện pháp đã thực hiện:**
• Hoàn tiền tự động cho đơn hàng #DH-2025-001234 (đã xử lý)
• Cập nhật cơ chế xử lý lỗi để tránh tình trạng tương tự
• Gửi email xác nhận đến khách hàng về việc hoàn tiền

Chị vui lòng kiểm tra lại và cho tôi biết nếu còn vấn đề gì khác cần hỗ trợ.

Trân trọng,
Trần Mai Anh`,
      responseTime: '09:15, 04/09/2025'
    }
  }

  const handleBack = () => {
    navigate('/helpSeller')
  }

  const getStatusBadge = (status: string, statusText: string) => {
    switch (status) {
      case 'resolved':
        return (
          <div className='flex items-center gap-2'>
            <CheckCircle className='w-4 h-4 text-green-600' />
            <span className='text-green-600 font-medium'>{statusText}</span>
          </div>
        )
      default:
        return (
          <Badge className='bg-gray-100 text-gray-800'>
            {statusText}
          </Badge>
        )
    }
  }

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Breadcrumb */}
      <div className='mb-4'>
        <button
          onClick={handleBack}
          className='text-green-600 hover:text-green-700 text-sm font-medium'
        >
          Trung tâm Trợ giúp
        </button>
      </div>

      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-green-700 mb-4'>
          Chi tiết yêu cầu #{requestData.id}
        </h1>

        {/* Request Info Card */}
        <Card className='mb-6'>
          <CardContent className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <p className='text-sm text-gray-600 mb-1'>Mã yêu cầu</p>
                <p className='font-medium text-gray-900'>#{requestData.id}</p>
              </div>
              <div>
                <p className='text-sm text-gray-600 mb-1'>Ngày gửi</p>
                <p className='font-medium text-gray-900'>{requestData.dateSent}</p>
              </div>
              <div>
                <p className='text-sm text-gray-600 mb-1'>Trạng thái</p>
                {getStatusBadge(requestData.status, requestData.statusText)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Request Section */}
      <div className='mb-8'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold text-green-700'>
            Nội dung yêu cầu của bạn
          </h2>
          <span className='text-sm text-gray-500'>
            Bạn đã gửi vào lúc {requestData.userRequest.sentTime}
          </span>
        </div>

        <Card>
          <CardContent className='p-6'>
            <div className='border-l-4 border-green-500 bg-gray-50 p-4 rounded-r-lg'>
              <div className='whitespace-pre-line text-gray-700 mb-4'>
                {requestData.userRequest.content}
              </div>

              {/* Attachments */}
              {requestData.userRequest.attachments && requestData.userRequest.attachments.length > 0 && (
                <div className='flex items-center gap-2'>
                  <Paperclip className='w-4 h-4 text-gray-500' />
                  <span className='text-sm text-gray-600'>
                    {requestData.userRequest.attachments[0].name}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support Response Section */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold text-green-700'>
            Phản hồi từ đội ngũ hỗ trợ
          </h2>
          <span className='text-sm text-gray-500'>
            {requestData.supportResponse.agent.name} đã phản hồi vào lúc {requestData.supportResponse.responseTime}
          </span>
        </div>

        <Card>
          <CardContent className='p-6'>
            <div className='border-l-4 border-yellow-500 bg-gray-50 p-4 rounded-r-lg'>
              {/* Agent Info */}
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
                  <User className='w-5 h-5 text-green-600' />
                </div>
                <div>
                  <p className='font-medium text-gray-900'>{requestData.supportResponse.agent.name}</p>
                  <p className='text-sm text-gray-600'>{requestData.supportResponse.agent.title}</p>
                </div>
              </div>

              {/* Response Content */}
              <div className='whitespace-pre-line text-gray-700'>
                {requestData.supportResponse.content}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className='flex justify-end gap-3 mt-8'>
        <Button
          variant='outline'
          onClick={handleBack}
          className='px-6'
        >
          <ArrowLeft className='w-4 h-4 mr-2' />
          Quay lại
        </Button>
        <Button
          className='bg-green-600 hover:bg-green-700 text-white px-6'
        >
          Tạo yêu cầu mới
        </Button>
      </div>
    </div>
  )
}

export default DetailHelp
