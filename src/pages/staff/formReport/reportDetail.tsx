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
  Image as ImageIcon,
  Store
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
import { storeApi } from '../../../apis/store.api'
import type { FormDTO, FormStatus } from '../../../types/form.type'
import type { StoreResponse } from '../../../apis/store.api'
import Loading from '../../../components/Loading/loading'
import EmptyState from '../../../components/EmptyState/emptyState'
import { toast } from 'react-toastify'
import ImagePreviewModal from '../../../components/ui/image-preview-modal'
import { resolveImageUrl } from '../../../utils/image'

function ReportDetail() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<{ firstName: string; lastName: string; email: string } | null>(null)
  const [loadingUser, setLoadingUser] = useState(false)
  const [storeInfo, setStoreInfo] = useState<StoreResponse | null>(null)
  const [loadingStore, setLoadingStore] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [staffReply, setStaffReply] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'ApprovedByStaff' | 'DeniedByStaff' | 'WaitingSellerResponse' | 'Rejected'>(
    'ApprovedByStaff'
  )
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [isSellerPreviewOpen, setIsSellerPreviewOpen] = useState(false)
  const [sellerPreviewIndex, setSellerPreviewIndex] = useState(0)
  const rawImages = form?.imageUrl
  const attachmentImages = Array.isArray(rawImages)
    ? rawImages.map((img) => resolveImageUrl(img)).filter((url): url is string => Boolean(url))
    : []
  const rawSellerImages = form?.sellerImages
  const sellerImages = Array.isArray(rawSellerImages)
    ? rawSellerImages.map((img) => resolveImageUrl(img)).filter((url): url is string => Boolean(url))
    : []

  // Set default status based on current form status
  useEffect(() => {
    if (form) {
      if (form.status === 'Processing') {
        setSelectedStatus('WaitingSellerResponse') // Default to waiting seller response for initial processing
      } else if (form.status === 'WaitingSellerResponse' || form.status === 'Rejected') {
        setSelectedStatus('ApprovedByStaff') // Default to approve for waiting seller response/rejected
      }
    }
  }, [form])

  // Load form detail
  const loadFormDetail = useCallback(async () => {
    console.log('Current URL params formId:', formId)
    console.log('Type of formId:', typeof formId)

    if (!formId) {
      console.log('No form ID provided - formId is:', formId)
      return
    }

    try {
      setLoading(true)
      const response = await formApi.getFormById(formId)
      setForm(response)
      setStaffReply(response.reply || '')

      // Load user info
      if (response.userId) {
        try {
          setLoadingUser(true)
          const user = await getUserById(response.userId)
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

      // Load store info
      if (response.storeId) {
        try {
          setLoadingStore(true)
          const storeResponse = await storeApi.getStoreById(response.storeId)
          setStoreInfo(storeResponse.data)
        } catch (error) {
          console.error('Error loading store info:', error)
          setStoreInfo(null)
        } finally {
          setLoadingStore(false)
        }
      }
    } catch (error) {
      console.error('Error loading form detail:', error)
      toast.error('Có lỗi xảy ra khi tải chi tiết khiếu nại')
    } finally {
      setLoading(false)
    }
  }, [formId])

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
          text: 'Đã xử lý khiếu nại',
          color: 'text-green-700',
          bgColor: 'bg-green-50'
        }
      case 'DeniedByStaff':
        return {
          icon: <XCircle className='w-5 h-5 text-red-500' />,
          badge: 'destructive',
          text: 'Từ chối khiếu nại',
          color: 'text-red-700',
          bgColor: 'bg-red-50'
        }
      case 'ApprovedByAdmin':
        return {
          icon: <CheckCircle className='w-5 h-5 text-green-500' />,
          badge: 'default',
          text: 'Đã duyệt khiếu nại',
          color: 'text-green-700',
          bgColor: 'bg-green-50'
        }
      case 'DeniedByAdmin':
        return {
          icon: <XCircle className='w-5 h-5 text-red-500' />,
          badge: 'destructive',
          text: 'Từ chối khiếu nại',
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
      case 'WaitingSellerResponse':
        return {
          icon: <Clock className='w-5 h-5 text-orange-500' />,
          badge: 'default',
          text: 'Chờ phản hồi từ người bán',
          color: 'text-orange-700',
          bgColor: 'bg-orange-50'
        }
      case 'Cancel':
        return {
          icon: <XCircle className='w-5 h-5 text-gray-500' />,
          badge: 'outline',
          text: 'Khách hàng hủy khiếu nại',
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
  const getTypeText = (type: string) => {
    switch (type) {
      case 'SupportAccount':
        return 'Hỗ trợ tài khoản'
      case 'ComplaintOrder':
        return 'Khiếu nại đơn hàng'
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

  // Handle staff update with modal
  const handleStaffUpdate = async () => {
    if (!form || !staffReply.trim()) {
      toast.error('Vui lòng nhập phản hồi từ nhân viên')
      return
    }

    try {
      setUpdating(true)
      await formApi.staffUpdateForm(form.id, {
        reply: staffReply.trim(),
        status: selectedStatus
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

  const handleStoreClick = () => {
    if (form?.storeId) {
      navigate(`/staff/store-detail/${form.storeId}`)
    }
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
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Left Column */}
        <div className='space-y-6'>
          {/* Customer Information */}
          <Card className='bg-white shadow-sm gap-3 border-gray-200'>
            <CardHeader className='pt-4 pb-2 bg-gray-50/50'>
              <CardTitle className='flex items-center gap-2 text-lg text-gray-700'>
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-0 pb-4'>
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
            </CardContent>
          </Card>

          {/* Store Information */}
          {form.storeId && (
            <Card className='bg-white shadow-sm gap-3 border-gray-200'>
              <CardHeader className='pt-4 pb-2 bg-gray-50/50'>
                <CardTitle className='flex items-center gap-2 text-lg text-gray-700'>
                  <Store className='w-5 h-5 text-green-600' />
                  Thông tin cửa hàng
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4 pt-0 pb-4'>
                {loadingStore ? (
                  <div className='flex items-center justify-center py-8'>
                    <div className='flex items-center gap-2'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-green-600'></div>
                      <span className='text-sm text-gray-500'>Đang tải thông tin cửa hàng...</span>
                    </div>
                  </div>
                ) : storeInfo ? (
                  <>
                    <div className='flex items-center gap-4'>
                      <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center'>
                        {storeInfo.logoUrl ? (
                          <img
                            src={
                              storeInfo.logoUrl ||
                              'http://154.26.130.248:8080/images/FormImages/3d8e4b7b-948b-44de-8ad4-97e9af520e11.png'
                            }
                            alt={storeInfo.storeName}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'
                            }}
                            className='w-12 h-12 rounded-full object-cover'
                          />
                        ) : (
                          <Store className='w-8 h-8 text-green-600' />
                        )}
                      </div>
                      <div>
                        <button className='font-semibold text-gray-900 text-lg hover:text-blue-600 hover:underline' onClick={handleStoreClick}>{storeInfo.storeName}</button>
                        <div className='space-y-1 mt-2'>
                          <div className='flex items-center gap-2'>
                            <span className='text-sm text-gray-700'>{storeInfo.address}</span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <span className='text-sm text-gray-500'>
                              {storeInfo.province}, {storeInfo.district}, {storeInfo.ward}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </>
                ) : (
                  <div className='text-center py-4'>
                    <p className='text-sm text-gray-500'>Không thể tải thông tin cửa hàng</p>
                    <p className='text-xs text-gray-400 mt-1'>ID: {form.storeId}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Form Content */}
          <Card className='bg-white shadow-sm gap-3 border-gray-200'>
            <CardHeader className='pt-4 pb-2 bg-gray-50/50'>
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
            <CardContent className='space-y-4 pt-4 pb-4'>
              {/* Description */}
              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>Mô tả chi tiết</Label>
                <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                  <p className='text-gray-800 text-sm leading-relaxed whitespace-pre-wrap break-words'>
                    {form.description}
                  </p>
                </div>
              </div>

              {/* Images */}
              {attachmentImages.length > 0 && (
                <div>
                  <Label className='text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2'>
                    <ImageIcon className='w-4 h-4 text-gray-600' />
                    Hình ảnh đính kèm ({attachmentImages.length})
                  </Label>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                    {attachmentImages.map((imageUrl: string, index: number) => (
                      <div
                        key={index}
                        className='relative group cursor-pointer'
                        onClick={() => {
                          setPreviewIndex(index)
                          setIsPreviewOpen(true)
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt={`Attachment ${index + 1}`}
                          className='w-full h-32 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md'
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            if (target.dataset.fallbackApplied) return
                            target.dataset.fallbackApplied = 'true'
                            target.src = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'
                          }}
                        />
                        <div className='pointer-events-none absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center'>
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
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className='space-y-6'>
          {/* Form Details */}
          <Card className='bg-white shadow-sm gap-3'>
            <CardHeader className='pt-4 pb-2'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <Flag className='w-5 h-5 text-blue-600' />
                Thông tin chi tiết
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 pt-0 pb-4'>
              <div className='pb-3 border-b border-gray-100'>
                <Label className='text-sm font-medium text-gray-500 mb-1 block'>Loại</Label>
                <p className='text-sm text-gray-900 font-medium mt-1'>{getTypeText(form.type)}</p>
              </div>
              <div className='pb-3 border-b border-gray-100'>
                <Label className='text-sm font-medium text-gray-500 mb-1 block'>Trạng thái</Label>
                <div className='flex items-center gap-2 mt-1'>
                  {statusInfo.icon}
                  <span className='text-sm text-gray-900 font-medium'>{statusInfo.text}</span>
                </div>
              </div>
              {form.orderId && (
                <div className='pb-3 border-b border-gray-100'>
                  <Label className='text-sm font-medium text-gray-500 mb-1 block'>ID đơn hàng</Label>
                  <p className='text-sm text-gray-900 font-mono break-all mt-1'>{form.orderId}</p>
                </div>
              )}
              {form.deadlineForSellerReply && (
                <div>
                  <Label className='text-sm font-medium text-gray-500 mb-1 block'>Hạn phản hồi từ người bán</Label>
                  <div className='flex items-center gap-2 mt-1'>
                    <Clock className='w-4 h-4 text-orange-500' />
                    <p className='text-sm text-gray-900'>{form.deadlineForSellerReply}</p>
                  </div>
                  {form.isSellerReplied !== undefined && (
                    <div className='mt-2'>
                      <Badge
                        variant={form.isSellerReplied ? 'default' : 'secondary'}
                        className={form.isSellerReplied ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                      >
                        {form.isSellerReplied ? 'Đã phản hồi' : 'Chưa phản hồi'}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Staff Reply (if exists) */}
          {form.reply && (
            <Card className='bg-white shadow-sm border-blue-200'>
              <CardHeader className='pb-3 bg-blue-50/50'>
                <CardTitle className='flex items-center gap-2 text-lg text-blue-700'>
                  <User className='w-5 h-5 text-blue-600' />
                  Phản hồi từ nhân viên
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                  <p className='text-blue-800 whitespace-pre-wrap break-words leading-relaxed'>{form.reply}</p>
                  {form.staffName && (
                    <p className='text-blue-600 text-sm mt-3 font-medium border-t border-blue-200 pt-2'>
                      - {form.staffName}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seller Reply (if exists) */}
          {form.sellerReply && (
            <Card className='bg-white shadow-sm border-purple-200'>
              <CardHeader className='pb-3 bg-purple-50/50'>
                <CardTitle className='flex items-center gap-2 text-lg text-purple-700'>
                  <Store className='w-5 h-5 text-purple-600' />
                  Phản hồi từ người bán
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='bg-purple-50 border border-purple-200 rounded-lg p-4'>
                  <p className='text-purple-800 whitespace-pre-wrap break-words leading-relaxed'>
                    {form.sellerReply}
                  </p>
                  {form.sellerReplyAt && (
                    <p className='text-purple-600 text-xs mt-3 border-t border-purple-200 pt-2'>
                      Phản hồi lúc: {form.sellerReplyAt}
                    </p>
                  )}
                </div>

                {/* Seller Images */}
                {sellerImages.length > 0 && (
                  <div>
                    <Label className='text-sm font-medium text-purple-700 mb-2 block flex items-center gap-2'>
                      <ImageIcon className='w-4 h-4 text-purple-600' />
                      Hình ảnh từ người bán ({sellerImages.length})
                    </Label>
                    <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                      {sellerImages.map((imageUrl: string, index: number) => (
                        <div
                          key={index}
                          className='relative group cursor-pointer'
                          onClick={() => {
                            setSellerPreviewIndex(index)
                            setIsSellerPreviewOpen(true)
                          }}
                        >
                          <img
                            src={imageUrl}
                            alt={`Seller image ${index + 1}`}
                            className='w-full h-32 object-cover rounded-lg border border-purple-200 hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md'
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              if (target.dataset.fallbackApplied) return
                              target.dataset.fallbackApplied = 'true'
                              target.src = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'
                            }}
                          />
                          <div className='pointer-events-none absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center'>
                            <span className='text-white opacity-0 group-hover:opacity-100 text-sm font-medium'>
                              Click để xem
                            </span>
                          </div>
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

          {/* Admin Reply (if exists) */}
          {form.adminText && (
            <Card className='bg-white shadow-sm border-green-200'>
              <CardHeader className='pb-3 bg-green-50/50'>
                <CardTitle className='flex items-center gap-2 text-lg text-green-700'>
                  <CheckCircle className='w-5 h-5 text-green-600' />
                  Phản hồi quản trị viên
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                  <p className='text-green-800 whitespace-pre-wrap break-words'>{form.adminText}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staff Actions - Show for Processing, WaitingSellerResponse, and Rejected status */}
          {(form.status === 'Processing' || form.status === 'WaitingSellerResponse' || form.status === 'Rejected') && (
            <Card className='bg-white shadow-sm border-blue-200'>
              <CardHeader className='pb-3 bg-blue-50/50'>
                <CardTitle className='flex items-center gap-2 text-lg text-blue-700'>
                  <RefreshCw className='w-5 h-5 text-blue-600' />
                  Hành động xử lý
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {/* Action Buttons */}
                  {form.status === 'Processing' ? (
                    <div className='space-y-3'>
                      <div className='grid grid-cols-2 gap-3'>
                        <Button
                          onClick={() => {
                            setSelectedStatus('WaitingSellerResponse')
                            setShowUpdateModal(true)
                          }}
                          disabled={updating}
                          className='w-full bg-green-600 hover:bg-green-700 text-white h-12'
                        >
                          <CheckCircle className='w-4 h-4 mr-2' />
                          Tiếp nhận
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedStatus('Rejected')
                            setShowUpdateModal(true)
                          }}
                          disabled={updating}
                          className='w-full bg-red-600 hover:bg-red-700 text-white h-12'
                        >
                          <XCircle className='w-4 h-4 mr-2' />
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  ) : form.status === 'WaitingSellerResponse' || form.status === 'Rejected' ? (
                    <div className='space-y-3'>
                      <div className='grid grid-cols-2 gap-3'>
                        <Button
                          onClick={() => {
                            setSelectedStatus('ApprovedByStaff')
                            setShowUpdateModal(true)
                          }}
                          disabled={updating}
                          className='w-full bg-green-600 hover:bg-green-700 text-white h-12'
                        >
                          <CheckCircle className='w-4 h-4 mr-2' />
                          Chấp nhận
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedStatus('DeniedByStaff')
                            setShowUpdateModal(true)
                          }}
                          disabled={updating}
                          className='w-full bg-red-600 hover:bg-red-700 text-white h-12'
                        >
                          <XCircle className='w-4 h-4 mr-2' />
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ImagePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        images={attachmentImages}
        initialIndex={previewIndex}
      />

      <ImagePreviewModal
        isOpen={isSellerPreviewOpen}
        onClose={() => setIsSellerPreviewOpen(false)}
        images={sellerImages}
        initialIndex={sellerPreviewIndex}
      />

      {/* Staff Update Modal */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent className='max-w-md mx-auto'>
          <DialogHeader>
            <DialogTitle className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
              <RefreshCw className='w-5 h-5 text-blue-500' />
              {selectedStatus === 'ApprovedByStaff'
                ? 'Chấp nhận khiếu nại'
                : selectedStatus === 'DeniedByStaff'
                  ? 'Từ chối khiếu nại'
                  : selectedStatus === 'WaitingSellerResponse'
                    ? 'Tiếp nhận khiếu nại'
                    : selectedStatus === 'Rejected'
                      ? 'Từ chối xử lý khiếu nại'
                      : 'Cập nhật trạng thái khiếu nại'}
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
                value={selectedStatus}
                onValueChange={(value: 'ApprovedByStaff' | 'DeniedByStaff' | 'WaitingSellerResponse' | 'Rejected') =>
                  setSelectedStatus(value)
                }
                disabled={updating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {form.status === 'Processing' ? (
                    <>
                      <SelectItem value='WaitingSellerResponse'>Tiếp nhận</SelectItem>
                      <SelectItem value='Rejected'>Từ chối</SelectItem>
                    </>
                  ) : form.status === 'WaitingSellerResponse' || form.status === 'Rejected' ? (
                    <>
                      <SelectItem value='ApprovedByStaff'>Chấp nhận</SelectItem>
                      <SelectItem value='DeniedByStaff'>Từ chối</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value='ApprovedByStaff'>Duyệt</SelectItem>
                      <SelectItem value='DeniedByStaff'>Từ chối</SelectItem>
                      <SelectItem value='WaitingSellerResponse'>Chờ phản hồi người bán</SelectItem>
                      <SelectItem value='Rejected'>Từ chối</SelectItem>
                    </>
                  )}
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
                ) : selectedStatus === 'ApprovedByStaff' ? (
                  'Chấp nhận'
                ) : selectedStatus === 'DeniedByStaff' ? (
                  'Từ chối'
                ) : selectedStatus === 'WaitingSellerResponse' ? (
                  'Tiếp nhận'
                ) : selectedStatus === 'Rejected' ? (
                  'Từ chối'
                ) : (
                  'Cập nhật'
                )}
              </Button>
            </div>           
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ReportDetail
