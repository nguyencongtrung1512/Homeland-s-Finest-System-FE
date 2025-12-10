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
import { toast } from '../../../utils/toast'
import ImagePreviewModal from '../../../components/ui/image-preview-modal'
import { resolveImageUrl } from '../../../utils/image'
import { CopyButton } from '../../../components/ui/copy'

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [staffReply, setStaffReply] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'ApprovedByStaff' | 'DeniedByStaff' | 'Confirmed' | 'Rejected'>(
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

  // Helper function to extract error message from various error formats
  // Note: axiosInstance rejects with error.response.data, so error is already the response data object
  const getErrorMessage = useCallback((error: unknown, defaultMessage: string): string => {
    if (!error) return defaultMessage

    // axiosInstance rejects with error.response.data, so error is already:
    // { status: 400, message: "...", data: null }
    const errorObj = error as {
      message?: string | null
      status?: number
      data?: unknown
      response?: { data?: { message?: string } }
      errors?: Array<{ field: string; message: string }> | Record<string, string[]>
    }

    // Priority 1: Direct message property (most common case from axiosInstance)
    if (errorObj?.message && typeof errorObj.message === 'string') {
      return errorObj.message
    }

    // Priority 2: Check response.data.message (fallback for other error formats)
    if (errorObj?.response?.data?.message) {
      return errorObj.response.data.message
    }

    // Priority 3: Check for validation errors array
    if (errorObj?.errors) {
      if (Array.isArray(errorObj.errors)) {
        const messages = errorObj.errors.map((e) => e.message).filter(Boolean)
        if (messages.length > 0) {
          return messages.join(', ')
        }
      } else if (typeof errorObj.errors === 'object') {
        const messages: string[] = []
        Object.values(errorObj.errors).forEach((fieldErrors) => {
          if (Array.isArray(fieldErrors)) {
            messages.push(...fieldErrors)
          } else if (typeof fieldErrors === 'string') {
            messages.push(fieldErrors)
          }
        })
        if (messages.length > 0) {
          return messages.join(', ')
        }
      }
    }

    // Priority 4: Check if error itself is a string
    if (typeof error === 'string') {
      return error
    }

    return defaultMessage
  }, [])

  // Set default status based on current form status
  useEffect(() => {
    if (form) {
      if (form.status === 'Processing') {
        setSelectedStatus('Confirmed') // Default to waiting seller response for initial processing
      } else if (form.status === 'Confirmed') {
        setSelectedStatus('ApprovedByStaff') // Default to approve for waiting seller response
      }
      // Note: Rejected and DeniedByStaff statuses don't need default status as staff cannot take action
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
      const errorMessage = getErrorMessage(error, 'Có lỗi xảy ra khi tải chi tiết khiếu nại')
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [formId, getErrorMessage])

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
      case 'Confirmed':
        return {
          icon: <Clock className='w-5 h-5 text-orange-500' />,
          badge: 'default',
          text: 'Đang xử lí đơn',
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
      case 'ComplaintOrder':
        return 'Khiếu nại đơn hàng'
      case 'ReportSeller':
        return 'Khiếu nại cửa hàng'
      case 'Orther':
        return 'Các đơn khác'
      default:
        return type
    }
  }

  // Handle staff update with modal (for ApprovedByStaff and DeniedByStaff)
  const handleStaffUpdate = async () => {
    if (!form) {
      toast.error('Không tìm thấy khiếu nại')
      return
    }

    try {
      setUpdating(true)
      const response = await formApi.staffUpdateForm(form.id, {
        reply: staffReply.trim() || '',
        status: selectedStatus
      })

      // Hiển thị message từ BE, nếu không có thì dùng message mặc định
      const successMessage = response.message || 'Cập nhật thành công!'
      toast.success(successMessage)
      setShowUpdateModal(false)
      setStaffReply('')
      loadFormDetail() // Reload form data
    } catch (error) {
      console.error('Error updating form:', error)
      const errorMessage = getErrorMessage(error, 'Có lỗi xảy ra khi cập nhật')
      toast.error(errorMessage)
    } finally {
      setUpdating(false)
    }
  }

  // Handle status update without reply (for Confirmed and Rejected)
  const handleStatusUpdate = async () => {
    if (!form) {
      toast.error('Không tìm thấy khiếu nại')
      return
    }

    try {
      setUpdating(true)
      const response = await formApi.staffUpdateForm(form.id, {
        reply: '', // Send empty reply for Confirmed and Rejected
        status: selectedStatus
      })

      // Hiển thị message từ BE, nếu không có thì dùng message mặc định
      const successMessage = response.message || 'Cập nhật thành công!'
      toast.success(successMessage)
      setShowConfirmDialog(false)
      loadFormDetail() // Reload form data
    } catch (error) {
      console.error('Error updating form:', error)
      const errorMessage = getErrorMessage(error, 'Có lỗi xảy ra khi cập nhật')
      toast.error(errorMessage)
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
              <CardTitle className='flex items-center gap-2 text-lg text-gray-700'>Thông tin khách hàng</CardTitle>
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
                        <button
                          className='font-semibold text-gray-900 text-lg hover:text-blue-600 hover:underline'
                          onClick={handleStoreClick}
                        >
                          {storeInfo.storeName}
                        </button>
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
                <Badge variant='outline' className='text-xs px-2.5 py-1 border-gray-300'>
                  Nội dung khiếu nại
                </Badge>
                <Badge
                  variant={statusInfo.badge as 'default' | 'secondary' | 'destructive' | 'outline'}
                  className={`${statusInfo.bgColor} ${statusInfo.color} border-0 px-3 py-1`}
                >
                  <div className='flex items-center gap-1.5'>
                    {statusInfo.icon}
                    <span className='font-medium'>{statusInfo.text}</span>
                  </div>
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
                <div className='flex items-center gap-2 pb-3 border-b border-gray-100'>
                  <div>
                    <Label className='text-sm font-medium text-gray-500 mb-1 block'>ID đơn hàng</Label>
                    <p className='text-sm text-gray-900 font-mono break-all flex-1'>{form.orderId}</p>
                  </div>
                  <div className='flex items-center gap-2 ml-2'>
                    <CopyButton
                      textToCopy={form.orderId}
                      idleText='Copy'
                      copiedText='Đã copy!'
                      className='h-8 px-3 text-xs'
                    />
                  </div>
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
                        className={
                          form.isSellerReplied ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }
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
                  <p className='text-purple-800 whitespace-pre-wrap break-words leading-relaxed'>{form.sellerReply}</p>
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

          {/* Staff Actions - Show for Processing and Confirmed status only */}
          {/* Rejected status: đã từ chối tiếp nhận, không còn hành động nào */}
          {(form.status === 'Processing' || form.status === 'Confirmed') && (
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
                            setSelectedStatus('Confirmed')
                            setShowConfirmDialog(true)
                          }}
                          disabled={updating}
                          className='w-full bg-green-600 hover:bg-green-700 text-white h-12'
                        >
                          <CheckCircle className='w-4 h-4 mr-2' />
                          Tiếp nhận xử lí đơn
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedStatus('Rejected')
                            setShowConfirmDialog(true)
                          }}
                          disabled={updating}
                          className='w-full bg-red-600 hover:bg-red-700 text-white h-12'
                        >
                          <XCircle className='w-4 h-4 mr-2' />
                          Từ chối xử lí đơn
                        </Button>
                      </div>
                    </div>
                  ) : form.status === 'Confirmed' ? (
                    // Check if seller has replied
                    form.sellerReply || form.isSellerReplied ? (
                      // Seller has replied - show action buttons
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
                            Duyệt đơn
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
                            Từ chối đơn
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Seller hasn't replied yet - show waiting message
                      <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
                        <div className='flex items-center gap-3'>
                          <Clock className='w-5 h-5 text-orange-600' />
                          <div>
                            <p className='text-orange-800 font-medium'>Chờ người bán phản hồi</p>
                            <p className='text-orange-600 text-sm mt-1'>
                              Đơn khiếu nại đã được tiếp nhận. Vui lòng đợi người bán phản hồi trước khi thực hiện các hành động tiếp theo.
                            </p>
                            {form.deadlineForSellerReply && (
                              <p className='text-orange-500 text-xs mt-2'>
                                Hạn phản hồi: {form.deadlineForSellerReply}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
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
                  : selectedStatus === 'Confirmed'
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
                onValueChange={(value: 'ApprovedByStaff' | 'DeniedByStaff' | 'Confirmed' | 'Rejected') =>
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
                      <SelectItem value='Confirmed'>Tiếp nhận xử lí đơn</SelectItem>
                      <SelectItem value='Rejected'>Từ chối xử lí đơn</SelectItem>
                    </>
                  ) : form.status === 'Confirmed' || form.status === 'Rejected' ? (
                    <>
                      <SelectItem value='ApprovedByStaff'>Chấp nhận</SelectItem>
                      <SelectItem value='DeniedByStaff'>Từ chối</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value='ApprovedByStaff'>Duyệt</SelectItem>
                      <SelectItem value='DeniedByStaff'>Từ chối</SelectItem>
                      <SelectItem value='Confirmed'>Chờ phản hồi người bán</SelectItem>
                      <SelectItem value='Rejected'>Từ chối</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Reply */}
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Phản hồi <span className='text-gray-400 text-xs font-normal'>(Tùy chọn)</span>
              </Label>
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
                disabled={updating}
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
                ) : selectedStatus === 'Confirmed' ? (
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

      {/* Confirmation Dialog for Confirmed and Rejected */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className='max-w-md mx-auto'>
          <DialogHeader>
            <DialogTitle className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
              {selectedStatus === 'Confirmed' ? (
                <CheckCircle className='w-5 h-5 text-green-500' />
              ) : (
                <XCircle className='w-5 h-5 text-red-500' />
              )}
              {selectedStatus === 'Confirmed' ? 'Xác nhận tiếp nhận khiếu nại' : 'Xác nhận từ chối xử lý khiếu nại'}
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            {/* Form Info */}
            <div className='bg-gray-50 rounded-lg p-3'>
              <p className='text-sm text-gray-600'>
                <span className='font-medium'>Khiếu nại:</span> {form?.subject}
              </p>
              <p className='text-xs text-gray-500 mt-1'>#{form?.id}</p>
            </div>

            {/* Confirmation Message */}
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <p className='text-sm text-blue-800'>
                {selectedStatus === 'Confirmed'
                  ? 'Bạn có chắc chắn muốn tiếp nhận xử lý khiếu nại này?'
                  : 'Bạn có chắc chắn muốn từ chối xử lý khiếu nại này?'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-3 pt-2'>
              <Button
                variant='outline'
                onClick={() => setShowConfirmDialog(false)}
                className='flex-1'
                disabled={updating}
              >
                Hủy
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={updating}
                className={`flex-1 text-white ${selectedStatus === 'Confirmed' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
              >
                {updating ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                    Đang xử lý...
                  </>
                ) : selectedStatus === 'Confirmed' ? (
                  'Xác nhận tiếp nhận'
                ) : (
                  'Xác nhận từ chối'
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
