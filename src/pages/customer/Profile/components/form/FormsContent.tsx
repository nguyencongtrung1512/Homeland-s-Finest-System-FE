import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Button } from '../../../../../components/ui/button'
import { Badge } from '../../../../../components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '../../../../../components/ui/alert-dialog'

import { MessageSquare, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Trash2, Edit, Store } from 'lucide-react'
import type { FormDTO } from '../../../../../types/form.type'
import type { FormStatus, FormType } from '../../../../../types/form.type'
import { formApi } from '../../../../../apis/form.api'
import Loading from '../../../../../components/Loading/loading'
import EmptyState from '../../../../../components/EmptyState/emptyState'
import { toast } from '../../../../../utils/toast'
import UpdateFormModal from './UpdateFormModal'
import ImagePreviewModal from '../../../../../components/ui/image-preview-modal'
import { storeApi } from '../../../../../apis/store.api'
import { useNavigate } from 'react-router-dom'
import { path } from '../../../../../constants/path'
import GeneralSupportFormModal from './GeneralSupportFormModal'
import { CopyButton } from '../../../../../components/ui/copy'

interface FormsContentProps {
  forms: FormDTO[]
  loading: boolean
  onRefresh: () => void
  userId?: string
}

const SUPPORT_FORM_TYPES: FormType[] = ['ComplaintOrder', 'ReportSeller', 'Orther']

const FormsContent = ({ forms, loading, onRefresh, userId }: FormsContentProps) => {
  const [selectedStatus, setSelectedStatus] = useState<FormStatus | 'all'>('all')
  const [cancellingFormId, setCancellingFormId] = useState<string | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedForm, setSelectedForm] = useState<FormDTO | null>(null)
  const [updatingFormId, setUpdatingFormId] = useState<string | null>(null)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [storeNames, setStoreNames] = useState<Record<string, string>>({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creatingForm, setCreatingForm] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchStoreNames = async () => {
      const storeIdList = (forms || [])
        .map((form) => form.storeId)
        .filter((id): id is string => {
          if (typeof id !== 'string') {
            return false
          }
          return !storeNames[id]
        })
      const uniqueStoreIds = Array.from(new Set(storeIdList))
      if (uniqueStoreIds.length === 0) return

      const results = await Promise.all(
        uniqueStoreIds.map(async (id) => {
          try {
            const response = await storeApi.getStoreById(id)
            return { id, name: response.data?.storeName || id }
          } catch (error) {
            console.error('Failed to fetch store info for', id, error)
            return { id, name: id }
          }
        })
      )

      setStoreNames((prev) => {
        const next = { ...prev }
        results.forEach(({ id, name }) => {
          next[id] = name
        })
        return next
      })
    }

    fetchStoreNames()
  }, [forms, storeNames])

  const handleStoreClick = (storeId: string) => {
    const storePath = path.store.replace(':storeId', storeId)
    navigate(storePath)
  }

  const handleCreateForm = async (payload: {
    type: FormType
    subject: string
    description: string
    images?: File[]
  }) => {
    if (!userId) {
      toast.error('Vui lòng đăng nhập để gửi khiếu nại')
      return
    }

    try {
      setCreatingForm(true)
      await formApi.createForm({
        userId,
        type: payload.type,
        subject: payload.subject,
        description: payload.description,
        imageFiles: payload.images
      })
      toast.success('Gửi khiếu nại thành công! Chúng tôi sẽ phản hồi sớm nhất.')
      setShowCreateModal(false)
      onRefresh()
    } catch (error) {
      console.error('Error creating form:', error)
      toast.error('Có lỗi xảy ra khi gửi khiếu nại. Vui lòng thử lại sau.')
    } finally {
      setCreatingForm(false)
    }
  }
  const openImagePreview = (images: string[], index: number) => {
    if (!images || images.length === 0) return
    setPreviewImages(images)
    setPreviewIndex(index)
    setIsPreviewOpen(true)
  }

  const closeImagePreview = () => {
    setIsPreviewOpen(false)
    setPreviewImages([])
    setPreviewIndex(0)
  }

  const getStatusIcon = (status: FormStatus) => {
    switch (status) {
      case 'Pending':
        return <Clock className='w-4 h-4 text-yellow-500' />
      case 'Processing':
        return <AlertCircle className='w-4 h-4 text-blue-500' />
      case 'Confirmed':
        return <AlertCircle className='w-4 h-4 text-blue-500' />
      case 'ApprovedByStaff':
      case 'ApprovedByAdmin':
        return <CheckCircle className='w-4 h-4 text-green-500' />
      case 'DeniedByStaff':
      case 'DeniedByAdmin':
      case 'Rejected':
        return <XCircle className='w-4 h-4 text-red-500' />
      case 'Cancel':
        return <XCircle className='w-4 h-4 text-gray-500' />
      default:
        return <Clock className='w-4 h-4 text-gray-500' />
    }
  }

  const getStatusBadgeVariant = (status: FormStatus) => {
    switch (status) {
      case 'Pending':
        return 'secondary'
      case 'Processing':
        return 'default'
      case 'Confirmed':
        return 'default'
      case 'ApprovedByStaff':
      case 'ApprovedByAdmin':
        return 'default'
      case 'DeniedByStaff':
      case 'DeniedByAdmin':
      case 'Rejected':
        return 'destructive'
      case 'Cancel':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getStatusText = (status: FormStatus) => {
    switch (status) {
      case 'Pending':
        return 'Chờ xử lý'
      case 'Processing':
        return 'Đang xử lý'
      case 'DeniedByAdmin':
        return 'Bị từ chối'
      case 'DeniedByStaff':
        return 'Đang xử lý'
      case 'ApprovedByStaff':
        return 'Đang xử lý'
      case 'ApprovedByAdmin':
        return 'Đã xử lí'
      case 'Rejected':
        return 'Đã từ chối'
      case 'Confirmed':
        return 'Đang xử lý'
      case 'Cancel':
        return 'Đã hủy'
      default:
        return status
    }
  }

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

  const filteredForms =
    selectedStatus === 'all' ? forms || [] : (forms || []).filter((form) => form.status === selectedStatus)

  const handleCancelForm = async (formId: string) => {
    try {
      setCancellingFormId(formId)
      await formApi.cancelForm(formId)

      // Refresh the forms list after successful cancellation
      onRefresh()

      toast.success('Hủy khiếu nại thành công!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined
      })
    } catch (error) {
      console.error('Error cancelling form:', error)
      toast.error('Có lỗi xảy ra khi hủy khiếu nại. Vui lòng thử lại sau.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined
      })
    } finally {
      setCancellingFormId(null)
    }
  }

  const handleOpenUpdateModal = (form: FormDTO) => {
    setSelectedForm(form)
    setShowUpdateModal(true)
  }

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false)
    setSelectedForm(null)
  }

  const handleUpdateForm = async (
    formId: string,
    data: { type: FormType; subject: string; description: string; images?: File[]; existingImageUrls?: string[] }
  ) => {
    try {
      setUpdatingFormId(formId)
      const form = forms.find((f) => f.id === formId)
      if (!form) {
        toast.error('Không tìm thấy khiếu nại')
        return
      }

      await formApi.updateForm(formId, {
        storeId: form.storeId || '',
        orderId: form.orderId || '',
        type: data.type,
        subject: data.subject,
        description: data.description,
        imageFiles: data.images,
        existingImageUrls: data.existingImageUrls
      })

      onRefresh()
      handleCloseUpdateModal()

      toast.success('Cập nhật khiếu nại thành công!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined
      })
    } catch (error) {
      console.error('Error updating form:', error)
      toast.error('Có lỗi xảy ra khi cập nhật khiếu nại. Vui lòng thử lại sau.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined
      })
    } finally {
      setUpdatingFormId(null)
    }
  }

  const statusOptions: Array<{ value: FormStatus | 'all'; label: string }> = [
    { value: 'all', label: 'Tất cả' },
    { value: 'Pending', label: 'Chờ xử lý' },
    { value: 'Processing', label: 'Đang xử lý' },
    { value: 'Cancel', label: 'Đã hủy' }
  ]

  if (loading) {
    return <Loading size='lg' text='Đang tải khiếu nại...' />
  }

  if (!forms || forms.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='space-y-6'
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className='flex items-center justify-between'
        >
          <h3 className='text-lg font-semibold text-gray-900'>Đơn hỗ trợ của tôi</h3>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={onRefresh} variant='outline' size='sm'>
              Làm mới
            </Button>
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <EmptyState
            title='Chưa có đơn hỗ trợ nào'
            description='Bạn chưa gửi đơn nào. Hãy liên hệ với chúng tôi nếu cần hỗ trợ.'
            type='search'
          />
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='space-y-6'
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className='flex items-center justify-between gap-3 flex-wrap'
      >
        <h3 className='text-lg font-semibold text-gray-900'>Đơn hỗ trợ của tôi</h3>
        <div className='flex items-center gap-2'>
          {userId && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setShowCreateModal(true)}
                className='bg-green-600 hover:bg-green-700 text-white'
                size='sm'
              >
                Tạo đơn hỗ trợ
              </Button>
            </motion.div>
          )}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={onRefresh} variant='outline' size='sm'>
              Làm mới
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className='flex gap-2 flex-wrap'
      >
        {statusOptions.map((option, index) => (
          <motion.div
            key={option.value}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant={selectedStatus === option.value ? 'default' : 'outline'}
              size='sm'
              onClick={() => setSelectedStatus(option.value)}
              className={selectedStatus === option.value ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {option.label}
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Forms List */}
      <AnimatePresence mode='wait'>
        <div className='space-y-4'>
          {filteredForms.map((form, index) => (
            <motion.div
              key={form.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.8 }}
              transition={{
                duration: 0.4,
                delay: index * 0.1,
                type: 'spring',
                stiffness: 100
              }}
              layout
            >
              <Card className='hover:shadow-lg transition-shadow border border-gray-100'>
                <CardHeader className='pb-4 border-b border-gray-100'>
                  <div className='flex flex-col gap-3'>
                    <div className='flex flex-wrap items-center gap-2 text-xs font-medium text-gray-700'>
                      <span className='px-3 text-center text-xl py-1 rounded-full bg-green-50 text-green-700'>
                        {getTypeText(form.type)}
                      </span>
                      <Badge variant={getStatusBadgeVariant(form.status)} className='text-xs flex items-center gap-1'>
                        {getStatusIcon(form.status)}
                        {getStatusText(form.status)}
                      </Badge>
                    </div>
                    <div className='flex items-center gap-2'>
                      {form.storeId &&
                        (() => {
                          const currentStoreId = form.storeId as string
                          return (
                            <button
                              type='button'
                              className='flex items-center gap-1 text-xs text-green-600 hover:text-green-700 underline-offset-2 hover:underline'
                              onClick={() => handleStoreClick(currentStoreId)}
                            >
                              <Store className='w-3 h-3' />
                              {storeNames[currentStoreId] || 'Đang tải cửa hàng...'}
                            </button>
                          )
                        })()}
                      {form.orderId && (
                        <div className='flex items-center gap-2'>

                          <CopyButton
                            textToCopy={form.orderId}
                            idleText={`${form.orderId}`}
                            copiedText='Đã copy'
                            className='h-7 px-3 text-xs bg-white text-green-700 border border-green-200 hover:bg-green-50'
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <CardTitle className='text-base font-semibold text-gray-900'>{form.subject}</CardTitle>
                      <p className='text-sm text-gray-600 mt-1'>{form.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='pt-4'>
                  <div className='space-y-3'>
                    {/* Images */}
                    {form.imageUrl && form.imageUrl.length > 0 && (
                      <div>
                        <p className='text-xs text-gray-500 mb-2'>Hình ảnh đính kèm:</p>
                        <div className='flex gap-2 flex-wrap'>
                          {form.imageUrl.map((imageUrl, index) => (
                            <button
                              key={index}
                              type='button'
                              onClick={() => openImagePreview(form.imageUrl ?? [], index)}
                              className='relative group w-16 h-16 rounded border overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500'
                            >
                              <img
                                src={imageUrl}
                                alt={`Attachment ${index + 1}`}
                                className='w-full h-full object-cover transition-transform duration-200 group-hover:scale-105'
                              />
                              <div className='absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity'>
                                Xem
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reply */}
                    {form.reply && (
                      <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
                        <p className='text-xs text-green-600 font-medium mb-1'>Phản hồi từ nhân viên:</p>
                        <p className='text-sm text-green-800'>{form.reply}</p>
                      </div>
                    )}

                    {/* Timestamps and Actions */}
                    <div className='pt-2 border-t'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4 text-xs text-gray-500'>
                          <div className='flex items-center gap-1'>
                            <Calendar className='w-3 h-3' />
                            Tạo: {form.createdAt}
                          </div>
                          {form.updatedAt && form.updatedAt !== form.createdAt && (
                            <div className='flex items-center gap-1'>
                              <Clock className='w-3 h-3' />
                              Cập nhật: {form.updatedAt}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons - Only show for Pending status */}
                        {form.status === 'Pending' && (
                          <div className='flex gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleOpenUpdateModal(form)}
                              disabled={updatingFormId === form.id}
                              className='text-green-600 border-green-300 hover:bg-green-50 hover:border-green-400'
                            >
                              <Edit className='w-3 h-3 mr-1' />
                              Cập nhật
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  disabled={cancellingFormId === form.id}
                                  className='text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400'
                                >
                                  {cancellingFormId === form.id ? (
                                    <>
                                      <div className='w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin mr-1' />
                                      Đang hủy...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className='w-3 h-3 mr-1' />
                                      Hủy
                                    </>
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className='flex items-center gap-2'>
                                    <AlertCircle className='w-5 h-5 text-red-500' />
                                    Xác nhận hủy khiếu nại
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className='text-gray-600'>
                                    Bạn có chắc chắn muốn hủy khiếu nại này không? Hành động này không thể hoàn tác.
                                    <br />
                                    <br />
                                    <span className='font-medium text-gray-900'>Tiêu đề:</span> {form.subject}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Không hủy</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleCancelForm(form.id)}
                                    className='bg-red-600 hover:bg-red-700 text-white'
                                  >
                                    <Trash2 className='w-4 h-4 mr-2' />
                                    Xác nhận hủy
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {/* Empty filtered results */}
      <AnimatePresence>
        {filteredForms.length === 0 && forms && forms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className='text-center py-8'
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <MessageSquare className='w-12 h-12 text-gray-400 mx-auto mb-4' />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className='text-lg font-medium text-gray-900 mb-2'
            >
              Không tìm thấy khiếu nại
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className='text-gray-600'
            >
              Không có khiếu nại nào với trạng thái "{getStatusText(selectedStatus as FormStatus)}"
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Form Modal */}
      <UpdateFormModal
        isOpen={showUpdateModal}
        onClose={handleCloseUpdateModal}
        form={selectedForm}
        onSubmit={handleUpdateForm}
        isLoading={updatingFormId !== null}
      />

      <ImagePreviewModal
        isOpen={isPreviewOpen}
        onClose={closeImagePreview}
        images={previewImages}
        initialIndex={previewIndex}
        alt='Ảnh khiếu nại'
      />
      <GeneralSupportFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateForm}
        isSubmitting={creatingForm}
        allowedTypes={SUPPORT_FORM_TYPES}
      />
    </motion.div>
  )
}

export default FormsContent
