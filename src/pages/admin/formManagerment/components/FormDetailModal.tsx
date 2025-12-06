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
import { toast } from '../../../../utils/toast'
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
          text: 'Đã duyệt bởi nhân viên',
          color: 'text-green-700',
          bgColor: 'bg-green-50'
        }
      case 'DeniedByStaff':
        return {
          icon: <XCircle className='w-5 h-5 text-red-500' />,
          badge: 'destructive',
          text: 'Từ chối bởi nhân viên',
          color: 'text-red-700',
          bgColor: 'bg-red-50'
        }
      case 'ApprovedByAdmin':
        return {
          icon: <CheckCircle className='w-5 h-5 text-green-500' />,
          badge: 'default',
          text: 'Đã duyệt bởi admin',
          color: 'text-green-700',
          bgColor: 'bg-green-50'
        }
      case 'DeniedByAdmin':
        return {
          icon: <XCircle className='w-5 h-5 text-red-500' />,
          badge: 'destructive',
          text: 'Từ chối bởi admin',
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
          icon: <Clock className='w-5 h-5 text-orange-500' />,
          badge: 'default',
          text: 'Nhân viên đã xác nhận kiểm duyệt',
          color: 'text-orange-700',
          bgColor: 'bg-orange-50'
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
      case 'ComplaintOrder':
        return 'Khiếu nại đơn hàng'
      case 'ReportSeller':
        return 'Báo cáo người bán'
      case 'Orther':
        return 'Các đơn khác'
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
        <DialogContent
          className='w-[96vw] sm:w-auto sm:max-w-3xl lg:max-w-6xl
              max-h-[85vh] sm:max-h-[90vh]
             overflow-y-auto p-0 sm:p-6
              rounded-2xl border border-gray-200 shadow-xl overflow-hidden'
        >
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
        <DialogContent className='w-[92vw] sm:max-w-md mx-auto p-0 sm:p-6'>
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
      <DialogContent
        className='w-[96vw] sm:w-auto sm:max-w-3xl lg:max-w-6xl
              max-h-[85vh] sm:max-h-[90vh] overflow-y-auto
              p-0 sm:p-6'
      >
        <DialogHeader>
          <DialogTitle className='text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2'>
            <ArrowLeft className='w-5 h-5 text-gray-500' />
            Chi tiết khiếu nại #{form.id}
          </DialogTitle>
        </DialogHeader>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Form Info */}
            <Card className='border-gray-200 shadow-sm'>
              <CardHeader className='bg-gray-50/50'>
                <div className='flex items-center gap-3 mb-3'>
                  <Badge
                    variant={statusInfo.badge as 'default' | 'secondary' | 'destructive' | 'outline'}
                    className={`${statusInfo.bgColor} ${statusInfo.color} border-0 px-3 py-1`}
                  >
                    <div className='flex items-center gap-1.5'>
                      {statusInfo.icon}
                      <span className='font-medium'>{statusInfo.text}</span>
                    </div>
                  </Badge>
                  <Badge variant='outline' className='text-xs px-2.5 py-1 border-gray-300'>
                    {getTypeText(form.type)}
                  </Badge>
                </div>
                <CardTitle className='text-xl text-gray-900 font-bold'>{form.subject}</CardTitle>
              </CardHeader>
              <CardContent className='pt-4'>
                <div className='space-y-4'>
                  {/* Description */}
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-2 block'>Mô tả chi tiết</Label>
                    <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                      <p className='text-gray-800 whitespace-pre-wrap break-words leading-relaxed'>
                        {form.description}
                      </p>
                    </div>
                  </div>

                  {/* Images */}
                  {form.imageUrl && form.imageUrl.length > 0 && (
                    <div>
                      <Label className='text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2'>
                        <ImageIcon className='w-4 h-4 text-gray-600' />
                        Hình ảnh đính kèm ({form.imageUrl.length})
                      </Label>
                      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
                        {form.imageUrl.map((imageUrl: string, index: number) => (
                          <div key={index} className='relative'>
                            <img
                              src={imageUrl}
                              alt={`Tệp đính kèm ${index + 1}`}
                              className='w-full h-28 sm:h-32 object-cover rounded-lg border border-gray-200 shadow-sm'
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-gray-500 pt-4 border-t border-gray-200'>
                    <div className='flex items-center gap-2'>
                      <Calendar className='w-4 h-4 text-gray-400' />
                      <span className='font-medium'>Tạo:</span>
                      <span>{form.createdAt}</span>
                    </div>
                    {form.updatedAt !== form.createdAt && (
                      <div className='flex items-center gap-2'>
                        <Clock className='w-4 h-4 text-gray-400' />
                        <span className='font-medium'>Cập nhật:</span>
                        <span>{form.updatedAt}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Staff Reply */}
            {form.reply && (
              <Card className='border-blue-200 shadow-sm'>
                <CardHeader className='bg-blue-50/50'>
                  <CardTitle className='flex items-center gap-2 text-lg text-blue-700'>
                    <User className='w-5 h-5 text-blue-500' />
                    Phản hồi từ nhân viên
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-4'>
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                    <p className='text-blue-800 whitespace-pre-wrap break-words'>{form.reply}</p>
                    {form.staffName && (
                      <p className='text-blue-600 text-sm mt-3 font-medium border-t border-blue-200 pt-2'>
                        - {form.staffName}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Seller Reply */}
            {form.sellerReply && (
              <Card className='border-purple-200 shadow-sm'>
                <CardHeader className='bg-purple-50/50'>
                  <CardTitle className='flex items-center gap-2 text-lg text-purple-700'>
                    <Store className='w-5 h-5 text-purple-500' />
                    Phản hồi từ người bán
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-4 space-y-4'>
                  <div className='bg-purple-50 border border-purple-200 rounded-lg p-4'>
                    <p className='text-purple-800 whitespace-pre-wrap break-words'>{form.sellerReply}</p>
                    {form.sellerReplyAt && (
                      <p className='text-purple-600 text-xs mt-3 border-t border-purple-200 pt-2'>
                        Phản hồi lúc: {form.sellerReplyAt}
                      </p>
                    )}
                  </div>

                  {/* Seller Images */}
                  {form.sellerImages && form.sellerImages.length > 0 && (
                    <div>
                      <Label className='text-sm font-medium text-purple-700 mb-2 block flex items-center gap-2'>
                        <ImageIcon className='w-4 h-4 text-purple-600' />
                        Hình ảnh từ người bán ({form.sellerImages.length})
                      </Label>
                      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
                        {form.sellerImages.map((imageUrl: string, index: number) => (
                          <div key={index} className='relative'>
                            <img
                              src={imageUrl}
                              alt={`Hình ảnh người bán ${index + 1}`}
                              className='w-full h-28 sm:h-32 object-cover rounded-lg border border-purple-200 shadow-sm'
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {form.deadlineForSellerReply && (
                    <div className='text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded-lg p-2'>
                      <Clock className='w-3 h-3 inline mr-1' />
                      Hạn phản hồi: {form.deadlineForSellerReply}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Admin Actions - Only show if status is not Cancel */}
            {form.status !== 'Cancel' && (
              <Card className='border-green-200 shadow-sm'>
                <CardHeader className='bg-green-50/50'>
                  <CardTitle className='text-lg text-green-700'>Phản hồi quản trị viên</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4 pt-4'>
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-2 block'>Trạng thái</Label>
                    <Select
                      value={adminStatus}
                      onValueChange={(value: 'ApprovedByAdmin' | 'DeniedByAdmin') => setAdminStatus(value)}
                    >
                      <SelectTrigger className='border-gray-300 focus:ring-green-500 focus:border-green-500'>
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
                      className='min-h-[120px] resize-none border-gray-300 focus:ring-green-500 focus:border-green-500'
                    />
                  </div>

                  <Button
                    onClick={handleAdminUpdate}
                    disabled={updating || !adminText.trim()}
                    className='w-full bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
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
            )}

            {/* Form Details */}
            <Card className='border-gray-200 shadow-sm'>
              <CardHeader className='bg-gray-50/50'>
                <CardTitle className='text-lg text-gray-700'>Thông tin chi tiết</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4 pt-4'>
                <div className='pb-3 border-b border-gray-100'>
                  <Label className='text-sm font-medium text-gray-500 mb-1 block'>Tên người dùng</Label>
                  {loadingUser ? (
                    <div className='flex items-center gap-2 mt-1'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                      <span className='text-sm text-gray-500'>Đang tải...</span>
                    </div>
                  ) : userInfo ? (
                    <div className='mt-1'>
                      <p className='text-sm text-gray-900 font-medium'>
                        {userInfo.firstName} {userInfo.lastName}
                      </p>
                      <p className='text-xs text-gray-500 mt-0.5'>{userInfo.email}</p>
                    </div>
                  ) : (
                    <p className='text-sm text-gray-500 mt-1'>Không tìm thấy thông tin</p>
                  )}
                </div>
                {form.orderId && (
                  <div className='pb-3 border-b border-gray-100'>
                    <Label className='text-sm font-medium text-gray-500 mb-1 block'>ID đơn hàng</Label>
                    <p className='text-sm text-gray-900 font-mono mt-1 break-all'>{form.orderId}</p>
                  </div>
                )}
                {form.storeId && (
                  <div className='pb-3 border-b border-gray-100'>
                    <Label className='text-sm font-medium text-gray-500 mb-1 block'>Cửa hàng</Label>
                    {loadingStore ? (
                      <div className='flex items-center gap-2 mt-1'>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                        <span className='text-sm text-gray-500'>Đang tải...</span>
                      </div>
                    ) : storeInfo ? (
                      <div
                        className='cursor-pointer hover:bg-blue-50 p-2 rounded-lg transition-colors border border-transparent hover:border-blue-200 mt-1'
                        onClick={() => navigate(`/admin/storeManagement/store-detail/${form.storeId}`)}
                      >
                        <div className='flex items-center gap-2'>
                          <Store className='w-4 h-4 text-blue-500 flex-shrink-0' />
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm text-gray-900 font-medium truncate'>{storeInfo.storeName}</p>
                            <p className='text-xs text-gray-500 truncate mt-0.5'>{storeInfo.address}</p>
                          </div>
                        </div>
                        <p className='text-xs text-blue-600 mt-1.5 font-medium'>Click để xem chi tiết</p>
                      </div>
                    ) : (
                      <p className='text-sm text-gray-500 mt-1'>Không tìm thấy thông tin cửa hàng</p>
                    )}
                  </div>
                )}
                <div className='pb-3 border-b border-gray-100'>
                  <Label className='text-sm font-medium text-gray-500 mb-1 block'>Loại</Label>
                  <p className='text-sm text-gray-900 mt-1'>{getTypeText(form.type)}</p>
                </div>
                <div>
                  <Label className='text-sm font-medium text-gray-500 mb-1 block'>Trạng thái</Label>
                  <div className='flex items-center gap-2 mt-1'>
                    {statusInfo.icon}
                    <span className='text-sm text-gray-900 font-medium'>{statusInfo.text}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Reply (if exists) */}
            {form.adminText && (
              <Card className='border-green-200 shadow-sm'>
                <CardHeader className='bg-green-50/50'>
                  <CardTitle className='text-lg text-green-700'>Phản hồi quản trị viên</CardTitle>
                </CardHeader>
                <CardContent className='pt-4'>
                  <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                    <p className='text-green-800 whitespace-pre-wrap break-words'>{form.adminText}</p>
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
