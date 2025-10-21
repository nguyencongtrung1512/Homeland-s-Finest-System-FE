import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Flag,
  RefreshCw,
  CheckCircle,
  Mail,
  Calendar,
  User,
  Clock,
  XCircle,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { formApi } from '../../../apis/form.api'
import { getUserById } from '../../../apis/user.api'
import type { FormDTO, FormStatus, FormType } from '../../../types/form.type'
import Loading from '../../../components/Loading/loading'
import EmptyState from '../../../components/EmptyState/emptyState'
import { toast } from 'react-toastify'

function ReportDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<{ firstName: string; lastName: string; email: string } | null>(null)
  const [loadingUser, setLoadingUser] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [staffReply, setStaffReply] = useState('')
  const [staffStatus, setStaffStatus] = useState<'ApprovedByStaff' | 'DeniedByStaff'>('ApprovedByStaff')

  // Load form detail
  const loadFormDetail = useCallback(async () => {
    if (!id) {
      console.log('No form ID provided')
      return
    }

    console.log('Loading form detail for ID:', id)
    try {
      setLoading(true)
      const response = await formApi.getFormById(id)
      console.log('Form API response:', response)
      setForm(response)
      setStaffReply(response.reply || '')

      // Load user info
      if (response.userId) {
        try {
          setLoadingUser(true)
          const user = await getUserById(response.userId)
          console.log('User API response:', user)
          setUserInfo({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          })
        } catch (error) {
          console.error('Error loading user info:', error)
          setUserInfo(null)
        } finally {
          setLoadingUser(false)
        }
      }
    } catch (error) {
      console.error('Error loading form detail:', error)
      toast.error('Có lỗi xảy ra khi tải chi tiết khiếu nại')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadFormDetail()
  }, [loadFormDetail])

  // Get status info
  const getStatusInfo = (status: FormStatus) => {
    switch (status) {
      case 'Pending':
        return {
          icon: <Clock className='w-5 h-5 text-yellow-500' />,
          badge: 'secondary',
          text: 'Chờ phân công',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-50'
        }
      case 'Processing':
        return {
          icon: <AlertCircle className='w-5 h-5 text-blue-500' />,
          badge: 'default',
          text: 'Đang xử lý',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50'
        }
      case 'ApprovedByStaff':
        return {
          icon: <CheckCircle className='w-5 h-5 text-green-500' />,
          badge: 'default',
          text: 'Đã duyệt (Staff)',
          color: 'text-green-700',
          bgColor: 'bg-green-50'
        }
      case 'DeniedByStaff':
        return {
          icon: <XCircle className='w-5 h-5 text-red-500' />,
          badge: 'destructive',
          text: 'Từ chối (Staff)',
          color: 'text-red-700',
          bgColor: 'bg-red-50'
        }
      case 'ApprovedByAdmin':
        return {
          icon: <CheckCircle className='w-5 h-5 text-green-500' />,
          badge: 'default',
          text: 'Đã duyệt (Admin)',
          color: 'text-green-700',
          bgColor: 'bg-green-50'
        }
      case 'DeniedByAdmin':
        return {
          icon: <XCircle className='w-5 h-5 text-red-500' />,
          badge: 'destructive',
          text: 'Từ chối (Admin)',
          color: 'text-red-700',
          bgColor: 'bg-red-50'
        }
      case 'Rejected':
        return {
          icon: <XCircle className='w-5 h-5 text-red-500' />,
          badge: 'destructive',
          text: 'Bị từ chối',
          color: 'text-red-700',
          bgColor: 'bg-red-50'
        }
      case 'Confirmed':
        return {
          icon: <CheckCircle className='w-5 h-5 text-green-500' />,
          badge: 'default',
          text: 'Đã xác nhận',
          color: 'text-green-700',
          bgColor: 'bg-green-50'
        }
      case 'Cancel':
        return {
          icon: <XCircle className='w-5 h-5 text-gray-500' />,
          badge: 'outline',
          text: 'Đã hủy',
          color: 'text-gray-700',
          bgColor: 'bg-gray-50'
        }
      default:
        return {
          icon: <Clock className='w-5 h-5 text-gray-500' />,
          badge: 'secondary',
          text: status,
          color: 'text-gray-700',
          bgColor: 'bg-gray-50'
        }
    }
  }

  // Get type text in Vietnamese
  const getTypeText = (type: FormType) => {
    switch (type) {
      case 'SupportAccount':
        return 'Hỗ trợ tài khoản'
      case 'SupportPayment':
        return 'Hỗ trợ thanh toán'
      case 'SupportTechnical':
        return 'Hỗ trợ kỹ thuật'
      case 'ComplaintContent':
        return 'Khiếu nại nội dung'
      case 'RequestInformation':
        return 'Yêu cầu thông tin'
      case 'ReportSeller':
        return 'Báo cáo người bán'
      case 'FeedbackSuggestion':
        return 'Phản hồi góp ý'
      case 'PrivacyDataRequest':
        return 'Yêu cầu dữ liệu cá nhân'
      case 'SupportMarketing':
        return 'Hỗ trợ marketing'
      case 'SupportOther':
        return 'Hỗ trợ khác'
      case 'SupportRefundMoney':
        return 'Hỗ trợ hoàn tiền'
      default:
        return type
    }
  }

  // Handle staff update
  const handleStaffUpdate = async () => {
    if (!form || !staffReply.trim()) {
      toast.error('Vui lòng nhập phản hồi từ nhân viên')
      return
    }

    try {
      setUpdating(true)
      await formApi.staffUpdateForm(form.id, {
        reply: staffReply.trim(),
        status: staffStatus
      })

      toast.success('Cập nhật thành công!')
      setShowUpdateModal(false)
      loadFormDetail() // Reload form data
    } catch (error) {
      console.error('Error updating form:', error)
      toast.error('Có lỗi xảy ra khi cập nhật')
    } finally {
      setUpdating(false)
    }
  }

  const handleBack = () => {
    navigate('/staff/formReport')
  }

  if (loading) {
    return <Loading />
  }

  if (!form) {
    return (
      <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
        <EmptyState
          title='Không tìm thấy khiếu nại'
          description='Khiếu nại này có thể đã bị xóa hoặc không tồn tại.'
          type='search'
        />
      </div>
    )
  }

  const statusInfo = getStatusInfo(form.status)

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='sm' onClick={handleBack} className='h-8 w-8 p-0'>
          <ArrowLeft className='w-4 h-4' />
        </Button>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Chi tiết khiếu nại</h1>
          <p className='text-sm text-gray-600'>#{form.id}</p>
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
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center gap-4'>
                <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center'>
                  <User className='w-8 h-8 text-blue-600' />
                </div>
                <div>
                  {loadingUser ? (
                    <div className='flex items-center gap-2'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                      <span className='text-sm text-gray-500'>Đang tải...</span>
                    </div>
                  ) : userInfo ? (
                    <>
                      <h3 className='font-semibold text-gray-900 text-lg'>
                        {userInfo.firstName} {userInfo.lastName}
                      </h3>
                      <div className='space-y-1 mt-2'>
                        <div className='flex items-center gap-2'>
                          <Mail className='w-4 h-4 text-gray-400' />
                          <span className='text-sm text-gray-700'>{userInfo.email}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <h3 className='font-semibold text-gray-900 text-lg'>Khách hàng</h3>
                      <p className='text-sm text-gray-500'>ID: {form.userId}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className='flex items-center gap-2 pt-2 border-t border-gray-200'>
                <Calendar className='w-4 h-4 text-gray-400' />
                <span className='text-sm text-gray-600'>Thời gian tạo: {form.createdAt}</span>
              </div>
            </CardContent>
          </Card>

          {/* Form Content */}
          <Card className='bg-white shadow-sm'>
            <CardHeader className='pb-3'>
              <div className='flex items-center gap-3 mb-2'>
                <Badge
                  variant={statusInfo.badge as 'default' | 'secondary' | 'destructive' | 'outline'}
                  className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}
                >
                  <div className='flex items-center gap-1'>
                    {statusInfo.icon}
                    {statusInfo.text}
                  </div>
                </Badge>
                <Badge variant='outline' className='text-xs'>
                  {getTypeText(form.type)}
                </Badge>
              </div>
              <CardTitle className='text-xl'>{form.subject}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Description */}
              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>Mô tả chi tiết</Label>
                <div className='bg-gray-50 border border-gray-200 rounded-lg p-3'>
                  <p className='text-gray-700 text-sm leading-relaxed'>{form.description}</p>
                </div>
              </div>

              {/* Images */}
              {form.imageUrl && form.imageUrl.length > 0 && (
                <div>
                  <Label className='text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2'>
                    <ImageIcon className='w-4 h-4' />
                    Hình ảnh đính kèm ({form.imageUrl.length})
                  </Label>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                    {form.imageUrl.map((imageUrl: string, index: number) => (
                      <div key={index} className='relative group'>
                        <img
                          src={imageUrl}
                          alt={`Attachment ${index + 1}`}
                          className='w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity'
                          onClick={() => window.open(imageUrl, '_blank')}
                        />
                        <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center'>
                          <span className='text-white opacity-0 group-hover:opacity-100 text-sm font-medium'>
                            Click để xem
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className='flex items-center gap-6 text-sm text-gray-500 pt-4 border-t'>
                <div className='flex items-center gap-2'>
                  <Calendar className='w-4 h-4' />
                  Tạo: {form.createdAt}
                </div>
                {form.updatedAt !== form.createdAt && (
                  <div className='flex items-center gap-2'>
                    <Clock className='w-4 h-4' />
                    Cập nhật: {form.updatedAt}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className='space-y-6'>
          {/* Form Details */}
          <Card className='bg-white shadow-sm'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <Flag className='w-5 h-5 text-blue-600' />
                Thông tin chi tiết
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <Label className='text-sm font-medium text-gray-500'>ID khiếu nại</Label>
                <p className='text-sm text-gray-900 font-mono'>{form.id}</p>
              </div>
              <div>
                <Label className='text-sm font-medium text-gray-500'>ID người dùng</Label>
                <p className='text-sm text-gray-900 font-mono'>{form.userId}</p>
              </div>
              {form.orderId && (
                <div>
                  <Label className='text-sm font-medium text-gray-500'>ID đơn hàng</Label>
                  <p className='text-sm text-gray-900 font-mono'>{form.orderId}</p>
                </div>
              )}
              <div>
                <Label className='text-sm font-medium text-gray-500'>Loại</Label>
                <p className='text-sm text-gray-900'>{getTypeText(form.type)}</p>
              </div>
              <div>
                <Label className='text-sm font-medium text-gray-500'>Trạng thái</Label>
                <div className='flex items-center gap-2 mt-1'>
                  {statusInfo.icon}
                  <span className='text-sm text-gray-900'>{statusInfo.text}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Reply (if exists) */}
          {form.reply && (
            <Card className='bg-white shadow-sm'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <User className='w-5 h-5 text-blue-600' />
                  Phản hồi từ nhân viên
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                  <p className='text-blue-800 whitespace-pre-wrap'>{form.reply}</p>
                  {form.staffName && <p className='text-blue-600 text-sm mt-2 font-medium'>- {form.staffName}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Reply (if exists) */}
          {form.adminText && (
            <Card className='bg-white shadow-sm'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <CheckCircle className='w-5 h-5 text-green-600' />
                  Phản hồi quản trị viên
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                  <p className='text-green-800 whitespace-pre-wrap'>{form.adminText}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staff Actions */}
          <Card className='bg-white shadow-sm'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <RefreshCw className='w-5 h-5 text-blue-600' />
                Hành động xử lý
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <Button
                  onClick={() => setShowUpdateModal(true)}
                  className='w-full bg-blue-600 hover:bg-blue-700 text-white h-12'
                  disabled={form.status === 'ApprovedByStaff' || form.status === 'DeniedByStaff'}
                >
                  <RefreshCw className='w-4 h-4 mr-2' />
                  <span className='text-sm'>
                    {form.status === 'ApprovedByStaff' || form.status === 'DeniedByStaff'
                      ? 'Đã xử lý'
                      : 'Cập nhật phản hồi'
                    }
                  </span>
                </Button>

                {(form.status === 'ApprovedByStaff' || form.status === 'DeniedByStaff') && (
                  <div className='text-center'>
                    <Badge variant={form.status === 'ApprovedByStaff' ? 'default' : 'destructive'} className='text-sm'>
                      {form.status === 'ApprovedByStaff' ? 'Đã duyệt' : 'Đã từ chối'}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Staff Update Modal */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent className='max-w-md mx-auto'>
          <DialogHeader>
            <DialogTitle className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
              <RefreshCw className='w-5 h-5 text-blue-500' />
              Cập nhật phản hồi
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-6'>
            {/* Form Info */}
            <div className='bg-gray-50 rounded-lg p-3'>
              <p className='text-sm text-gray-600'>
                <span className='font-medium'>Khiếu nại:</span> {form.subject}
              </p>
              <p className='text-xs text-gray-500 mt-1'>#{form.id}</p>
            </div>

            {/* Status Selection */}
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>Trạng thái</Label>
              <Select
                value={staffStatus}
                onValueChange={(value: 'ApprovedByStaff' | 'DeniedByStaff') => setStaffStatus(value)}
                disabled={updating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ApprovedByStaff'>Duyệt</SelectItem>
                  <SelectItem value='DeniedByStaff'>Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reply */}
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>Phản hồi</Label>
              <Textarea
                placeholder='Nhập phản hồi từ nhân viên...'
                value={staffReply}
                onChange={(e) => setStaffReply(e.target.value)}
                className='min-h-[120px] resize-none'
                disabled={updating}
              />
            </div>

            {/* Action Buttons */}
            <div className='flex gap-3 pt-4'>
              <Button
                variant='outline'
                onClick={() => setShowUpdateModal(false)}
                className='flex-1'
                disabled={updating}
              >
                Hủy
              </Button>
              <Button
                onClick={handleStaffUpdate}
                disabled={updating || !staffReply.trim()}
                className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
              >
                {updating ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                    Đang cập nhật...
                  </>
                ) : (
                  'Cập nhật'
                )}
              </Button>
            </div>

            {/* Footer Note */}
            <p className='text-xs text-gray-500 text-center'>
              Phản hồi này sẽ được gửi đến khách hàng và admin sẽ được thông báo.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ReportDetail
