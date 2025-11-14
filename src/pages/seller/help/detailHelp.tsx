import { useEffect, useState } from 'react'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { ArrowLeft, CheckCircle, Paperclip, User, Clock, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { formApi } from '../../../apis/form.api'
import type { FormDTO, FormStatus, FormType } from '../../../types/form.type'
import { toast } from 'react-toastify'

function DetailHelp() {
  const navigate = useNavigate()
  const { requestId } = useParams<{ requestId: string }>()
  const [formData, setFormData] = useState<FormDTO | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch form detail
  useEffect(() => {
    const fetchFormDetail = async () => {
      if (!requestId) {
        setError('Không tìm thấy mã yêu cầu')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const data = await formApi.getFormById(requestId)
        setFormData(data)
      } catch (error: any) {
        console.error('Error fetching form detail:', error)
        setError('Không thể tải thông tin yêu cầu hỗ trợ')
        toast.error('Không thể tải thông tin yêu cầu hỗ trợ')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFormDetail()
  }, [requestId])

  const handleBack = () => {
    navigate('/helpSeller')
  }

  const handleCreateNew = () => {
    navigate('/helpSeller')
    // Có thể trigger mở modal tạo mới ở đây nếu cần
  }

  // Map FormType to Vietnamese
  const getFormTypeLabel = (type: FormType): string => {
    const typeMap: Record<FormType, string> = {
      SupportAccount: 'Hỗ trợ tài khoản',
      SupportPayment: 'Hỗ trợ thanh toán',
      SupportTechnical: 'Hỗ trợ kỹ thuật',
      ComplaintContent: 'Khiếu nại nội dung',
      ComplaintOrder: 'Khiếu nại đơn hàng',
      RequestInformation: 'Yêu cầu thông tin',
      ReportSeller: 'Báo cáo người bán',
      FeedbackSuggestion: 'Góp ý đề xuất',
      PrivacyDataRequest: 'Yêu cầu dữ liệu cá nhân',
      SupportMarketing: 'Hỗ trợ marketing',
      SupportOther: 'Hỗ trợ khác',
      SupportRefundMoney: 'Hỗ trợ hoàn tiền'
    }
    return typeMap[type] || type
  }

  // Get status display with icon
  const getStatusDisplay = (status: FormStatus) => {
    const statusMap: Record<FormStatus, { text: string; icon: React.ReactElement; className: string }> = {
      Pending: {
        text: 'Chờ xử lý',
        icon: <Clock className='w-4 h-4' />,
        className: 'text-yellow-600'
      },
      Processing: {
        text: 'Đang xử lý',
        icon: <Clock className='w-4 h-4' />,
        className: 'text-blue-600'
      },
      ApprovedByStaff: {
        text: 'Staff đã phê duyệt',
        icon: <CheckCircle className='w-4 h-4' />,
        className: 'text-cyan-600'
      },
      DeniedByStaff: {
        text: 'Staff từ chối',
        icon: <XCircle className='w-4 h-4' />,
        className: 'text-red-600'
      },
      ApprovedByAdmin: {
        text: 'Đã giải quyết',
        icon: <CheckCircle className='w-4 h-4' />,
        className: 'text-green-600'
      },
      DeniedByAdmin: {
        text: 'Admin từ chối',
        icon: <XCircle className='w-4 h-4' />,
        className: 'text-red-600'
      },
      Rejected: {
        text: 'Bị từ chối',
        icon: <XCircle className='w-4 h-4' />,
        className: 'text-red-600'
      },
      Confirmed: {
        text: 'Đã xác nhận',
        icon: <CheckCircle className='w-4 h-4' />,
        className: 'text-green-600'
      },
      Cancel: {
        text: 'Đã hủy',
        icon: <XCircle className='w-4 h-4' />,
        className: 'text-gray-600'
      }
    }

    const statusInfo = statusMap[status] || {
      text: status,
      icon: <AlertCircle className='w-4 h-4' />,
      className: 'text-gray-600'
    }

    return (
      <div className={`flex items-center gap-2 ${statusInfo.className} font-medium`}>
        {statusInfo.icon}
        <span>{statusInfo.text}</span>
      </div>
    )
  }

  // Format date
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get file name from URL
  const getFileNameFromUrl = (url: string) => {
    const parts = url.split('/')
    return parts[parts.length - 1]
  }

  if (isLoading) {
    return (
      <div className='p-6 bg-gray-50 min-h-screen'>
        <div className='flex items-center justify-center py-20'>
          <Loader2 className='w-8 h-8 text-green-600 animate-spin' />
          <span className='ml-3 text-gray-600'>Đang tải...</span>
        </div>
      </div>
    )
  }

  if (error || !formData) {
    return (
      <div className='p-6 bg-gray-50 min-h-screen'>
        <div className='flex flex-col items-center justify-center py-20'>
          <AlertCircle className='w-16 h-16 text-red-400 mb-4' />
          <p className='text-gray-600 text-lg mb-4'>{error || 'Không tìm thấy thông tin yêu cầu'}</p>
          <Button onClick={handleBack} className='bg-green-600 hover:bg-green-700 text-white'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Quay lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Breadcrumb */}
      <div className='mb-4'>
        <button onClick={handleBack} className='text-green-600 hover:text-green-700 text-sm font-medium'>
          Trung tâm Trợ giúp
        </button>
      </div>

      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-green-700 mb-4'>
          Chi tiết yêu cầu #{formData.id.substring(0, 8).toUpperCase()}
        </h1>

        {/* Request Info Card */}
        <Card className='mb-6'>
          <CardContent className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div>
                <p className='text-sm text-gray-600 mb-1'>Mã yêu cầu</p>
                <p className='font-medium text-gray-900'>#{formData.id.substring(0, 8).toUpperCase()}</p>
              </div>
              <div>
                <p className='text-sm text-gray-600 mb-1'>Loại yêu cầu</p>
                <p className='font-medium text-gray-900'>{getFormTypeLabel(formData.type)}</p>
              </div>
              <div>
                <p className='text-sm text-gray-600 mb-1'>Ngày gửi</p>
                <p className='font-medium text-gray-900'>{formatDateTime(formData.createdAt)}</p>
              </div>
              <div>
                <p className='text-sm text-gray-600 mb-1'>Trạng thái</p>
                {getStatusDisplay(formData.status)}
              </div>
            </div>

            {formData.orderId && (
              <div className='mt-4 pt-4 border-t border-gray-200'>
                <p className='text-sm text-gray-600 mb-1'>Mã đơn hàng</p>
                <p className='font-medium text-gray-900'>{formData.orderId}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Request Section */}
      <div className='mb-8'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold text-green-700'>Nội dung yêu cầu của bạn</h2>
          <span className='text-sm text-gray-500'>Bạn đã gửi vào lúc {formatDateTime(formData.createdAt)}</span>
        </div>

        <Card>
          <CardContent className='p-6'>
            <div className='border-l-4 border-green-500 bg-gray-50 p-4 rounded-r-lg'>
              {/* Subject */}
              <h3 className='font-semibold text-gray-900 mb-3'>{formData.subject}</h3>

              {/* Description */}
              <div className='whitespace-pre-line text-gray-700 mb-4'>{formData.description}</div>

              {/* Attachments */}
              {formData.imageUrl && formData.imageUrl.length > 0 && (
                <div className='mt-4 pt-4 border-t border-gray-200'>
                  <p className='text-sm font-medium text-gray-700 mb-2'>Tệp đính kèm:</p>
                  <div className='space-y-2'>
                    {formData.imageUrl.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline'
                      >
                        <Paperclip className='w-4 h-4' />
                        <span className='text-sm'>{getFileNameFromUrl(url)}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support Response Section - Only show if there's a reply from staff */}
      {formData.reply && formData.staffName && (
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold text-green-700'>Phản hồi từ đội ngũ hỗ trợ</h2>
            <span className='text-sm text-gray-500'>
              {formData.staffName} đã phản hồi vào lúc {formatDateTime(formData.updatedAt)}
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
                    <p className='font-medium text-gray-900'>{formData.staffName}</p>
                    <p className='text-sm text-gray-600'>Chuyên viên hỗ trợ</p>
                  </div>
                </div>

                {/* Response Content */}
                <div className='whitespace-pre-line text-gray-700'>{formData.reply}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Information */}
      {(formData.status === 'Pending' || formData.status === 'Processing') && (
        <Card className='mb-8 bg-blue-50 border-blue-200'>
          <CardContent className='p-4'>
            <div className='flex items-start gap-3'>
              <Clock className='w-5 h-5 text-blue-600 mt-0.5' />
              <div>
                <p className='font-medium text-blue-900 mb-1'>
                  {formData.status === 'Pending' ? 'Yêu cầu đang chờ xử lý' : 'Yêu cầu đang được xử lý'}
                </p>
                <p className='text-sm text-blue-700'>
                  {formData.status === 'Pending'
                    ? 'Chúng tôi đã nhận được yêu cầu của bạn và sẽ xử lý trong thời gian sớm nhất.'
                    : 'Đội ngũ hỗ trợ đang xem xét và xử lý yêu cầu của bạn. Vui lòng chờ phản hồi.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className='flex justify-end gap-3 mt-8'>
        <Button variant='outline' onClick={handleBack} className='px-6'>
          <ArrowLeft className='w-4 h-4 mr-2' />
          Quay lại
        </Button>
        <Button onClick={handleCreateNew} className='bg-green-600 hover:bg-green-700 text-white px-6'>
          Tạo yêu cầu mới
        </Button>
      </div>
    </div>
  )
}

export default DetailHelp