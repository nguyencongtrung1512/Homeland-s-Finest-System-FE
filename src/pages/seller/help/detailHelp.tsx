import { useEffect, useState } from 'react'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../../../components/ui/dialog'
import { ArrowLeft, CheckCircle, User, Clock, XCircle, Loader2, AlertCircle, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { formApi } from '../../../apis/form.api'
import type { FormDTO, FormStatus, FormType } from '../../../types/form.type'
import { toast } from '../../../utils/toast'

function DetailHelp() {
  const navigate = useNavigate()
  const { requestId } = useParams<{ requestId: string }>()
  const [formData, setFormData] = useState<FormDTO | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

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
      } catch (error: unknown) {
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

  const handleCancelRequest = async () => {
    if (!requestId || !formData) return

    try {
      setIsCancelling(true)
      await formApi.cancelForm(requestId)
      toast.success('Hủy yêu cầu hỗ trợ thành công!')
      setShowCancelModal(false)
      // Refresh form data to update status
      const updatedData = await formApi.getFormById(requestId)
      setFormData(updatedData)
      // Navigate back after a short delay
      setTimeout(() => {
        navigate('/helpSeller')
      }, 1500)
    } catch (error: unknown) {
      console.error('Error cancelling form:', error)
      const errorMessage =
        (error && typeof error === 'object' && 'response' in error
          ? (error.response as { data?: { message?: string } })?.data?.message
          : null) ||
        (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : null) ||
        'Có lỗi xảy ra khi hủy yêu cầu hỗ trợ'
      toast.error(errorMessage)
    } finally {
      setIsCancelling(false)
    }
  }

  // Map FormType to Vietnamese
  const getFormTypeLabel = (type: FormType): string => {
    const typeMap: Record<FormType, string> = {
      ComplaintOrder: 'Khiếu nại đơn hàng',
      ReportSeller: 'Báo cáo người bán',
      Orther: 'Hỗ trợ khác'
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
        text: 'Đang xử lý',
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
          Chi tiết yêu cầu
        </h1>

        {/* Request Info Card */}
        <Card className='mb-6'>
          <CardContent className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>

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
        {formData.status === 'Pending' && (
          <Button
            variant='outline'
            onClick={() => setShowCancelModal(true)}
            className='px-6 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700'
          >
            <X className='w-4 h-4 mr-2' />
            Hủy đơn
          </Button>
        )}
        <Button onClick={handleCreateNew} className='bg-green-600 hover:bg-green-700 text-white px-6'>
          Tạo yêu cầu mới
        </Button>
      </div>

      {/* Cancel Confirmation Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-red-700'>
              <AlertCircle className='w-6 h-6 text-red-600' />
              Xác nhận hủy yêu cầu hỗ trợ
            </DialogTitle>
            <DialogDescription>Bạn có chắc chắn muốn hủy yêu cầu hỗ trợ này không?</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='rounded-2xl border-2 border-red-200 bg-red-50 p-6 space-y-3'>
              <div className='flex items-start gap-3'>
                <div className='flex-shrink-0 pt-0.5'>
                  <AlertCircle className='w-5 h-5 text-red-600' />
                </div>
                <div className='flex-1'>
                  <h3 className='font-semibold text-red-900 mb-2'>Lưu ý quan trọng</h3>
                  <p className='text-sm text-red-800'>
                    Sau khi hủy, yêu cầu hỗ trợ này sẽ không thể được khôi phục. Bạn sẽ cần tạo yêu cầu mới nếu cần hỗ trợ sau này.
                  </p>
                </div>
              </div>
            </div>
            {formData && (
              <div className='rounded-xl border border-gray-200 bg-gray-50 p-4'>
                <p className='text-sm text-gray-600 mt-2 mb-1'>Tiêu đề</p>
                <p className='font-medium text-gray-900'>{formData.subject}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowCancelModal(false)}
              variant='outline'
              disabled={isCancelling}
              className='px-6'
            >
              <X className='w-4 h-4 mr-2' />
              Không hủy
            </Button>
            <Button
              onClick={handleCancelRequest}
              className='bg-red-600 hover:bg-red-700 text-white px-6'
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Đang hủy...
                </>
              ) : (
                <>
                  <XCircle className='w-4 h-4 mr-2' />
                  Xác nhận hủy
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DetailHelp