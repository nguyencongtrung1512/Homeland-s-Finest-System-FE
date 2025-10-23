import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Textarea } from '../../../../components/ui/textarea'
import { Label } from '../../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Image as ImageIcon,
  Store
} from 'lucide-react'
import { formApi } from '../../../../apis/form.api'
import type { FormDTO, FormStatus, FormType } from '../../../../types/form.type'
import { getUserById } from '../../../../apis/user.api'
import { storeApi, type StoreResponse } from '../../../../apis/store.api'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

interface FormDetailModalProps {
  isOpen: boolean
  onClose: () => void
  formId: string
  onSuccess: () => void
}

export default function FormDetailModal({ isOpen, onClose, formId, onSuccess }: FormDetailModalProps) {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [adminText, setAdminText] = useState('')
  const [adminStatus, setAdminStatus] = useState<'ApprovedByAdmin' | 'DeniedByAdmin'>('ApprovedByAdmin')
  const [userInfo, setUserInfo] = useState<{ firstName: string; lastName: string; email: string } | null>(null)
  const [loadingUser, setLoadingUser] = useState(false)
  const [storeInfo, setStoreInfo] = useState<StoreResponse | null>(null)
  const [loadingStore, setLoadingStore] = useState(false)

  // Load user info
  const loadUserInfo = useCallback(async (userId: string) => {
    try {
      setLoadingUser(true)
      const user = await getUserById(userId)
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
  }, [])

  // Load store info
  const loadStoreInfo = useCallback(async (storeId: string) => {
    try {
      setLoadingStore(true)
      const response = await storeApi.getStoreById(storeId)
      setStoreInfo(response.data)
    } catch (error) {
      console.error('Error loading store info:', error)
      setStoreInfo(null)
    } finally {
      setLoadingStore(false)
    }
  }, [])

  // Load form detail
  const loadFormDetail = useCallback(async () => {
    if (!formId) return

    try {
      setLoading(true)
      const response = await formApi.getFormById(formId)
      setForm(response)
      setAdminText(response.adminText || '')

      // Load user info
      if (response.userId) {
        await loadUserInfo(response.userId)
      }

      // Load store info
      if (response.storeId) {
        await loadStoreInfo(response.storeId)
      }
    } catch (error) {
      console.error('Error loading form detail:', error)
      toast.error('Có lỗi xảy ra khi tải chi tiết khiếu nại')
    } finally {
      setLoading(false)
    }
  }, [formId, loadUserInfo, loadStoreInfo])

  useEffect(() => {
    if (isOpen && formId) {
      loadFormDetail()
    }
  }, [isOpen, formId, loadFormDetail])

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

  // Handle admin update
  const handleAdminUpdate = async () => {
    if (!form || !adminText.trim()) {
      toast.error('Vui lòng nhập phản hồi từ quản trị viên')
      return
    }

    try {
      setUpdating(true)
      await formApi.adminUpdateForm(form.id, {
        adminText: adminText.trim(),
        status: adminStatus
      })

      toast.success('Cập nhật thành công!')
      onSuccess() // Notify parent to reload forms
      handleClose()
    } catch (error) {
      console.error('Error updating form:', error)
      toast.error('Có lỗi xảy ra khi cập nhật')
    } finally {
      setUpdating(false)
    }
  }

  const handleClose = () => {
    setForm(null)
    setAdminText('')
    setAdminStatus('ApprovedByAdmin')
    setUserInfo(null)
    setStoreInfo(null)
    onClose()
  }

  if (!form && loading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            <span className='ml-3 text-gray-600'>Đang tải chi tiết khiếu nại...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!form) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className='max-w-md mx-auto'>
          <div className='text-center py-12'>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>Không tìm thấy khiếu nại</h2>
            <p className='text-gray-600 mb-4'>Khiếu nại này có thể đã bị xóa hoặc không tồn tại.</p>
            <Button onClick={handleClose} variant='outline'>
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const statusInfo = getStatusInfo(form.status)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-xl font-bold text-gray-900 flex items-center gap-2'>
            <ArrowLeft className='w-5 h-5 text-gray-500' />
            Chi tiết khiếu nại #{form.id}
          </DialogTitle>
        </DialogHeader>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Form Info */}
            <Card>
              <CardHeader>
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
              <CardContent>
                <div className='space-y-4'>
                  {/* Description */}
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-2 block'>Mô tả chi tiết</Label>
                    <div className='bg-gray-50 rounded-lg p-4'>
                      <p className='text-gray-800 whitespace-pre-wrap'>{form.description}</p>
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
                </div>
              </CardContent>
            </Card>

            {/* Staff Reply */}
            {form.reply && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <User className='w-5 h-5 text-blue-500' />
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
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Admin Actions */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Phản hồi quản trị viên</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label className='text-sm font-medium text-gray-700 mb-2 block'>Trạng thái</Label>
                  <Select
                    value={adminStatus}
                    onValueChange={(value: 'ApprovedByAdmin' | 'DeniedByAdmin') => setAdminStatus(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ApprovedByAdmin'>Duyệt</SelectItem>
                      <SelectItem value='DeniedByAdmin'>Từ chối</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className='text-sm font-medium text-gray-700 mb-2 block'>Phản hồi</Label>
                  <Textarea
                    placeholder='Nhập phản hồi từ quản trị viên...'
                    value={adminText}
                    onChange={(e) => setAdminText(e.target.value)}
                    className='min-h-[120px] resize-none'
                  />
                </div>

                <Button
                  onClick={handleAdminUpdate}
                  disabled={updating || !adminText.trim()}
                  className='w-full bg-green-600 hover:bg-green-700 text-white'
                >
                  {updating ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                      Đang cập nhật...
                    </>
                  ) : (
                    'Cập nhật phản hồi'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Form Details */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Thông tin chi tiết</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <Label className='text-sm font-medium text-gray-500'>Tên người dùng</Label>
                  {loadingUser ? (
                    <div className='flex items-center gap-2'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                      <span className='text-sm text-gray-500'>Đang tải...</span>
                    </div>
                  ) : userInfo ? (
                    <div>
                      <p className='text-sm text-gray-900 font-medium'>
                        {userInfo.firstName} {userInfo.lastName}
                      </p>
                      <p className='text-xs text-gray-500'>{userInfo.email}</p>
                    </div>
                  ) : (
                    <p className='text-sm text-gray-500'>Không tìm thấy thông tin</p>
                  )}
                </div>
                {form.orderId && (
                  <div>
                    <Label className='text-sm font-medium text-gray-500'>ID đơn hàng</Label>
                    <p className='text-sm text-gray-900 font-mono'>{form.orderId}</p>
                  </div>
                )}
                {form.storeId && (
                  <div>
                    <Label className='text-sm font-medium text-gray-500'>Cửa hàng</Label>
                    {loadingStore ? (
                      <div className='flex items-center gap-2'>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                        <span className='text-sm text-gray-500'>Đang tải...</span>
                      </div>
                    ) : storeInfo ? (
                      <div
                        className='cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors'
                        onClick={() => navigate(`/admin/storeManagement/store-detail/${form.storeId}`)}
                      >
                        <div className='flex items-center gap-2'>
                          <Store className='w-4 h-4 text-blue-500' />
                          <div>
                            <p className='text-sm text-gray-900 font-medium'>{storeInfo.storeName}</p>
                            <p className='text-xs text-gray-500'>{storeInfo.address}</p>
                          </div>
                        </div>
                        <p className='text-xs text-blue-600 mt-1'>Click để xem chi tiết</p>
                      </div>
                    ) : (
                      <p className='text-sm text-gray-500'>Không tìm thấy thông tin cửa hàng</p>
                    )}
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

            {/* Admin Reply (if exists) */}
            {form.adminText && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg text-green-600'>Phản hồi quản trị viên</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                    <p className='text-green-800 whitespace-pre-wrap'>{form.adminText}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
