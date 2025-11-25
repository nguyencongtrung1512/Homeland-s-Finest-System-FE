import { useState, useEffect, useMemo, useCallback } from 'react'
import { useStore } from '../../../contexts/store.context'
import { formApi } from '../../../apis/form.api'
import type { FormDTO, FormStatus, FormType } from '../../../types/form.type'
import { toast } from '../../../utils/toast'
import Loading from '../../../components/Loading/loading'
import EmptyState from '../../../components/EmptyState/emptyState'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Image as ImageIcon,
  Upload,
  X
} from 'lucide-react'
import { resolveImageUrl } from '../../../utils/image'
import ImagePreviewModal from '../../../components/ui/image-preview-modal'
import { CopyButton } from '../../../components/ui/copy'

function ComplainSeller() {
  const { store, loading: storeLoading } = useStore()
  const [forms, setForms] = useState<FormDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedForm, setSelectedForm] = useState<FormDTO | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [sellerReply, setSellerReply] = useState('')
  const [sellerImages, setSellerImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [isListPreviewOpen, setIsListPreviewOpen] = useState(false)
  const [listPreviewIndex, setListPreviewIndex] = useState(0)

  // Load forms by storeId
  const loadForms = useCallback(async () => {
    if (!store?.id) return

    try {
      setLoading(true)
      const response = await formApi.getFormsByStoreId(store.id, {
        pageSize: 0,
        pageNumber: 1,
        sortBy: 'createdat',
        sortOrder: 'desc'
      })
      setForms(response || [])
    } catch (error) {
      console.error('Error loading forms:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách khiếu nại')
    } finally {
      setLoading(false)
    }
  }, [store?.id])

  useEffect(() => {
    loadForms()
  }, [loadForms])

  // Get status info
  const getStatusInfo = (status: FormStatus) => {
    switch (status) {
      case 'Pending':
        return {
          icon: <Clock className='w-4 h-4 text-yellow-500' />,
          badge: 'secondary',
          text: 'Chờ phân công',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-50'
        }
      case 'Processing':
        return {
          icon: <AlertCircle className='w-4 h-4 text-blue-500' />,
          badge: 'default',
          text: 'Đang xử lý',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50'
        }
      case 'WaitingSellerResponse':
        return {
          icon: <Clock className='w-4 h-4 text-blue-500' />,
          badge: 'default',
          text: 'Đang xử lý',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50'
        }
      case 'ApprovedByStaff':
        return {
          icon: <CheckCircle className='w-4 h-4 text-green-500' />,
          badge: 'default',
          text: 'Đang phân xử',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50'
        }
      case 'DeniedByStaff':
        return {
          icon: <XCircle className='w-4 h-4 text-red-500' />,
          badge: 'destructive',
          text: 'Đang phân xử',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50'
        }
      case 'ApprovedByAdmin':
        return {
          icon: <CheckCircle className='w-4 h-4 text-green-500' />,
          badge: 'default',
          text: 'Đã phân xử',
          color: 'text-green-700',
          bgColor: 'bg-green-50'
        }
      case 'DeniedByAdmin':
        return {
          icon: <XCircle className='w-4 h-4 text-red-500' />,
          badge: 'destructive',
          text: 'Đã phân xử',
          color: 'text-green-700',
          bgColor: 'bg-green-50'
        }
      case 'Rejected':
        return {
          icon: <XCircle className='w-4 h-4 text-red-500' />,
          badge: 'destructive',
          text: 'Đang phân xử',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50'
        }
      case 'Cancel':
        return {
          icon: <XCircle className='w-4 h-4 text-gray-500' />,
          badge: 'outline',
          text: 'Khách hàng hủy khiếu nại',
          color: 'text-gray-700',
          bgColor: 'bg-gray-50'
        }
      default:
        return {
          icon: <Clock className='w-4 h-4 text-gray-500' />,
          badge: 'secondary',
          text: status,
          color: 'text-gray-700',
          bgColor: 'bg-gray-50'
        }
    }
  }

  // Get type text
  const getTypeText = (type: FormType) => {
    switch (type) {
      case 'ComplaintOrder':
        return 'Khiếu nại đơn hàng'
      case 'ComplaintContent':
        return 'Khiếu nại nội dung'
      case 'ReportSeller':
        return 'Báo cáo người bán'
      case 'SupportAccount':
        return 'Hỗ trợ tài khoản'
      case 'SupportPayment':
        return 'Hỗ trợ thanh toán'
      case 'SupportTechnical':
        return 'Hỗ trợ kỹ thuật'
      case 'RequestInformation':
        return 'Yêu cầu thông tin'
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

  // Handle view detail
  const handleViewDetail = async (formId: string) => {
    try {
      setLoadingDetail(true)
      setShowDetailModal(true)
      const form = await formApi.getFormById(formId)
      setSelectedForm(form)
    } catch (error: unknown) {
      console.error('Error loading form detail:', error)
      setShowDetailModal(false)
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as { message?: string })?.message ||
        'Có lỗi xảy ra khi tải chi tiết khiếu nại'
      toast.error(errorMessage)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Handle open reply modal (only allow if status is WaitingSellerResponse)
  const handleOpenReply = (form: FormDTO) => {
    if (form.status !== 'WaitingSellerResponse') {
      toast.error('Chỉ có thể phản hồi khi trạng thái là "Chờ phản hồi từ người bán"')
      return
    }
    setSelectedForm(form)
    // Load existing reply if seller has already replied
    setSellerReply(form.sellerReply || '')
    setSellerImages([])
    setImagePreviews([])
    // If seller has already replied, we need to reload form to get sellerImages
    if (form.isSellerReplied && form.sellerImages && form.sellerImages.length > 0) {
      // Note: sellerImages from backend are URLs, not Files
      // We'll need to handle this differently - show existing images but allow adding new ones
      // For now, we'll just show the existing reply text
    }
    setShowReplyModal(true)
  }

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newFiles = [...sellerImages, ...files]
    setSellerImages(newFiles)

    // Create previews
    const newPreviews = files.map((file) => URL.createObjectURL(file))
    setImagePreviews((prev) => [...prev, ...newPreviews])
  }

  // Remove image
  const handleRemoveImage = (index: number) => {
    setSellerImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => {
      const newPreviews = prev.filter((_, i) => i !== index)
      // Revoke object URLs
      URL.revokeObjectURL(prev[index])
      return newPreviews
    })
  }

  // Handle submit reply (only allow if status is WaitingSellerResponse)
  const handleSubmitReply = async () => {
    if (!selectedForm || !sellerReply.trim()) {
      toast.error('Vui lòng nhập phản hồi')
      return
    }

    if (selectedForm.status !== 'WaitingSellerResponse') {
      toast.error('Chỉ có thể phản hồi khi trạng thái là "Chờ phản hồi từ người bán"')
      return
    }

    // Backend requires proof images
    if (!sellerImages || sellerImages.length === 0) {
      toast.error('Vui lòng cập nhật ảnh bằng chứng')
      return
    }

    try {
      setSubmitting(true)
      await formApi.sellerUpdateForm(selectedForm.id, {
        sellerReply: sellerReply.trim(),
        sellerImageFiles: sellerImages
      })

      // Show success toast first
      toast.success('Phản hồi đã được gửi thành công!', undefined, 4000)

      // Close modal and reset after a short delay to ensure toast is visible
      setTimeout(() => {
        setShowReplyModal(false)
        setSellerReply('')
        setSellerImages([])
        setImagePreviews([])
        loadForms() // Reload forms
      }, 500)
    } catch (error: unknown) {
      console.error('Error submitting reply:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string }; message?: string } })?.response?.data?.message ||
        (error as { message?: string })?.message ||
        'Có lỗi xảy ra khi gửi phản hồi'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  // Filter forms that need seller response (only WaitingSellerResponse status)
  const formsNeedingResponse = useMemo(() => {
    return forms.filter((form) => form.status === 'WaitingSellerResponse')
  }, [forms])

  // Calculate attachment images when selectedForm changes
  const attachmentImages = useMemo(() => {
    if (!selectedForm?.imageUrl) return []
    const rawImages = selectedForm.imageUrl
    return Array.isArray(rawImages)
      ? rawImages.map((img) => resolveImageUrl(img)).filter((url): url is string => Boolean(url))
      : []
  }, [selectedForm])

  if (storeLoading || loading) {
    return <Loading />
  }

  if (!store?.id) {
    return (
      <div className='p-6'>
        <EmptyState title='Không tìm thấy cửa hàng' description='Vui lòng thiết lập cửa hàng trước.' type='search' />
      </div>
    )
  }

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Khiếu nại về cửa hàng</h1>
          <p className='text-gray-600 mt-1'>Quản lý và phản hồi các khiếu nại về cửa hàng của bạn</p>
        </div>
        <Button onClick={loadForms} variant='outline' className='text-green-600 border-green-600 hover:bg-green-50'>
          Làm mới
        </Button>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card className='border-blue-200'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Tổng khiếu nại</p>
                <p className='text-2xl font-bold text-blue-600 mt-1'>{forms.length}</p>
              </div>
              <AlertCircle className='w-8 h-8 text-blue-500' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-orange-200'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Cần phản hồi</p>
                <p className='text-2xl font-bold text-orange-600 mt-1'>{formsNeedingResponse.length}</p>
              </div>
              <Clock className='w-8 h-8 text-orange-500' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-green-200'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Đã phản hồi</p>
                <p className='text-2xl font-bold text-green-600 mt-1'>
                  {forms.filter((f) => f.isSellerReplied).length}
                </p>
              </div>
              <CheckCircle className='w-8 h-8 text-green-500' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forms List */}
      {forms.length > 0 ? (
        <div className='space-y-4'>
          {forms.map((form) => {
            const statusInfo = getStatusInfo(form.status)
            const canReply = form.status === 'WaitingSellerResponse'
            const needsResponse = canReply && !form.isSellerReplied

            return (
              <Card key={form.id} className='hover:shadow-lg transition-shadow border border-gray-100'>
                <CardHeader className='pb-4 border-b border-gray-100'>
                  <div className='flex flex-col gap-3'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Badge
                        variant={statusInfo.badge as 'default' | 'secondary' | 'destructive' | 'outline'}
                        className={`${statusInfo.bgColor} ${statusInfo.color} border-0 flex items-center gap-1`}
                      >
                        {statusInfo.icon}
                        {statusInfo.text}
                      </Badge>
                      <Badge variant='outline' className='text-xs'>
                        {getTypeText(form.type)}
                      </Badge>
                      {needsResponse && (
                        <Badge variant='destructive' className='text-xs'>
                          Cần phản hồi
                        </Badge>
                      )}
                      {form.deadlineForSellerReply && (
                        <Badge variant='secondary' className='text-xs'>
                          <Clock className='w-3 h-3 mr-1' />
                          Hạn: {form.deadlineForSellerReply}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-1'>{form.subject}</h3>
                      <p className='text-sm text-gray-600 line-clamp-2'>{form.description}</p>
                    </div>
                    {form.orderId && (
                      <div className='flex items-center gap-2 text-xs text-gray-500'>
                        <span>Đơn hàng:</span>
                        <CopyButton
                          textToCopy={form.orderId}
                          idleText={form.orderId}
                          copiedText='Đã copy!'
                          className='h-6 px-2 text-xs min-w-16'
                          successDuration={2000}
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className='pt-4 space-y-3'>
                  {/* Images */}
                  {form.imageUrl && Array.isArray(form.imageUrl) && form.imageUrl.length > 0 && (
                    <div>
                      <Label className='text-xs font-medium text-gray-600 mb-2 block flex items-center gap-1'>
                        <ImageIcon className='w-3 h-3' />
                        Hình ảnh đính kèm ({form.imageUrl.length})
                      </Label>
                      <div className='flex gap-2 flex-wrap'>
                        {form.imageUrl.map((imageUrl: string, index: number) => {
                          const resolvedUrl = resolveImageUrl(imageUrl)
                          return (
                            <img
                              key={index}
                              src={resolvedUrl}
                              alt={`Attachment ${index + 1}`}
                              className='w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity hover:border-blue-400'
                              onClick={() => {
                                const images = form.imageUrl
                                  .map((img: string) => resolveImageUrl(img))
                                  .filter((url): url is string => Boolean(url))
                                setPreviewImages(images)
                                setListPreviewIndex(index)
                                setIsListPreviewOpen(true)
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = '/placeholder-image.png'
                              }}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4 text-xs text-gray-500'>
                      <div className='flex items-center gap-1'>
                        <Calendar className='w-3 h-3' />
                        Tạo: {form.createdAt}
                      </div>
                      {form.updatedAt !== form.createdAt && (
                        <div className='flex items-center gap-1'>
                          <Clock className='w-3 h-3' />
                          Cập nhật: {form.updatedAt}
                        </div>
                      )}
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleViewDetail(form.id)}
                        className='text-blue-600 border-blue-600 hover:bg-blue-50'
                      >
                        <Eye className='w-4 h-4 mr-2' />
                        Xem chi tiết
                      </Button>
                      {form.status === 'WaitingSellerResponse' && (
                        <Button
                          variant='default'
                          size='sm'
                          onClick={() => handleOpenReply(form)}
                          className={
                            form.isSellerReplied
                              ? 'bg-yellow-500 text-white hover:bg-[#FFD700]'
                              : 'bg-yellow-500 text-white hover:bg-[#FFD700]'
                          }
                        >
                          {form.isSellerReplied ? 'Chỉnh sửa phản hồi' : 'Phản hồi'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title='Không có khiếu nại nào'
          description='Hiện tại không có khiếu nại nào về cửa hàng của bạn.'
          type='search'
        />
      )}

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold'>Chi tiết khiếu nại</DialogTitle>
          </DialogHeader>
          {loadingDetail ? (
            <div className='flex items-center justify-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              <span className='ml-3 text-gray-600'>Đang tải chi tiết...</span>
            </div>
          ) : selectedForm ? (
            <div className='space-y-6'>
              {/* Form Info */}
              <Card>
                <CardHeader>
                  <div className='flex items-center gap-3 mb-2'>
                    <Badge
                      variant={
                        getStatusInfo(selectedForm.status).badge as 'default' | 'secondary' | 'destructive' | 'outline'
                      }
                      className={`${getStatusInfo(selectedForm.status).bgColor} ${getStatusInfo(selectedForm.status).color} border-0`}
                    >
                      {getStatusInfo(selectedForm.status).icon}
                      {getStatusInfo(selectedForm.status).text}
                    </Badge>
                    <Badge variant='outline'>{getTypeText(selectedForm.type)}</Badge>
                  </div>
                  <CardTitle>{selectedForm.subject}</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-2 block'>Mô tả</Label>
                    <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                      <p className='text-gray-800 whitespace-pre-wrap break-words'>{selectedForm.description}</p>
                    </div>
                  </div>

                  {/* Images */}
                  {attachmentImages.length > 0 && (
                    <div>
                      <Label className='text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2'>
                        <ImageIcon className='w-4 h-4' />
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
                              className='w-full h-32 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity'
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Staff Reply */}
                  {selectedForm.reply && (
                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                      <Label className='text-sm font-medium text-blue-700 mb-2 block'>Phản hồi từ nhân viên</Label>
                      <p className='text-blue-800 whitespace-pre-wrap break-words'>{selectedForm.reply}</p>
                      {selectedForm.staffName && (
                        <p className='text-blue-600 text-sm mt-2'>- {selectedForm.staffName}</p>
                      )}
                    </div>
                  )}

                  {/* Seller Reply */}
                  {selectedForm.sellerReply && (
                    <div className='bg-purple-50 border border-purple-200 rounded-lg p-4'>
                      <Label className='text-sm font-medium text-purple-700 mb-2 block'>Phản hồi của bạn</Label>
                      <p className='text-purple-800 whitespace-pre-wrap break-words'>{selectedForm.sellerReply}</p>
                      {selectedForm.sellerReplyAt && (
                        <p className='text-purple-600 text-xs mt-2'>Phản hồi lúc: {selectedForm.sellerReplyAt}</p>
                      )}
                      {selectedForm.sellerImages && selectedForm.sellerImages.length > 0 && (
                        <div className='mt-3'>
                          <Label className='text-sm font-medium text-purple-700 mb-2 block'>Hình ảnh bằng chứng</Label>
                          <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                            {selectedForm.sellerImages.map((imageUrl: string, index: number) => (
                              <img
                                key={index}
                                src={resolveImageUrl(imageUrl)}
                                alt={`Evidence ${index + 1}`}
                                className='w-full h-24 object-cover rounded border border-purple-200 cursor-pointer hover:opacity-90'
                                onClick={() => window.open(resolveImageUrl(imageUrl), '_blank')}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Deadline */}
                  {selectedForm.deadlineForSellerReply && (
                    <div className='bg-orange-50 border border-orange-200 rounded-lg p-3'>
                      <div className='flex items-center gap-2'>
                        <Clock className='w-4 h-4 text-orange-600' />
                        <span className='text-sm font-medium text-orange-700'>
                          Hạn phản hồi: {selectedForm.deadlineForSellerReply}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Reply Button in Detail Modal - Only show if status is WaitingSellerResponse */}
                  {selectedForm.status === 'WaitingSellerResponse' && (
                    <div className='pt-4 border-t'>
                      <Button
                        onClick={() => {
                          setShowDetailModal(false)
                          handleOpenReply(selectedForm)
                        }}
                        className={
                          selectedForm.isSellerReplied
                            ? 'w-full bg-blue-600 hover:bg-blue-700 text-white'
                            : 'w-full bg-orange-600 hover:bg-orange-700 text-white'
                        }
                      >
                        {selectedForm.isSellerReplied ? 'Chỉnh sửa phản hồi' : 'Phản hồi khiếu nại'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className='text-center py-12'>
              <p className='text-gray-500'>Không tìm thấy thông tin khiếu nại</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply Modal */}
      <Dialog open={showReplyModal} onOpenChange={setShowReplyModal}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold'>
              {selectedForm?.isSellerReplied ? 'Chỉnh sửa phản hồi' : 'Phản hồi khiếu nại'}
            </DialogTitle>
          </DialogHeader>
          {selectedForm && (
            <div className='space-y-4'>
              <div className='bg-gray-50 rounded-lg p-3'>
                <p className='text-sm text-gray-600'>
                  <span className='font-medium'>Khiếu nại:</span> {selectedForm.subject}
                </p>
                {selectedForm.deadlineForSellerReply && (
                  <p className='text-xs text-orange-600 mt-1'>Hạn phản hồi: {selectedForm.deadlineForSellerReply}</p>
                )}
                {selectedForm.isSellerReplied && (
                  <p className='text-xs text-blue-600 mt-1 font-medium'>Bạn đã phản hồi trước đó</p>
                )}
              </div>

              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>Phản hồi của bạn *</Label>
                <Textarea
                  placeholder='Nhập phản hồi và giải thích của bạn...'
                  value={sellerReply}
                  onChange={(e) => setSellerReply(e.target.value)}
                  className='min-h-[120px] resize-none'
                />
              </div>

              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Hình ảnh bằng chứng <span className='text-red-500'>*</span>
                </Label>
                <div className='space-y-3'>
                  <div className='flex items-center gap-2'>
                    <input
                      type='file'
                      id='seller-images'
                      multiple
                      accept='image/*'
                      onChange={handleImageSelect}
                      className='hidden'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => document.getElementById('seller-images')?.click()}
                      className='text-blue-600 border-blue-600 hover:bg-blue-50'
                    >
                      <Upload className='w-4 h-4 mr-2' />
                      Chọn ảnh
                    </Button>
                    {imagePreviews.length > 0 && (
                      <span className='text-sm text-green-600 font-medium'>{imagePreviews.length} ảnh đã chọn</span>
                    )}
                    {imagePreviews.length === 0 && (
                      <span className='text-sm text-red-500'>Vui lòng chọn ít nhất 1 ảnh bằng chứng</span>
                    )}
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className='grid grid-cols-3 gap-3'>
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className='relative group'>
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className='w-full h-24 object-cover rounded border border-gray-200'
                          />
                          <button
                            type='button'
                            onClick={() => handleRemoveImage(index)}
                            className='absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                          >
                            <X className='w-3 h-3' />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className='flex gap-3 pt-4'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setShowReplyModal(false)
                    setSellerReply('')
                    setSellerImages([])
                    setImagePreviews([])
                  }}
                  className='flex-1'
                  disabled={submitting}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleSubmitReply}
                  disabled={submitting || !sellerReply.trim() || sellerImages.length === 0}
                  className='flex-1 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {submitting ? 'Đang gửi...' : selectedForm.isSellerReplied ? 'Cập nhật phản hồi' : 'Gửi phản hồi'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal for Detail */}
      <ImagePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        images={attachmentImages}
        initialIndex={previewIndex}
      />

      {/* Image Preview Modal for List */}
      <ImagePreviewModal
        isOpen={isListPreviewOpen}
        onClose={() => setIsListPreviewOpen(false)}
        images={previewImages}
        initialIndex={listPreviewIndex}
      />
    </div>
  )
}

export default ComplainSeller
