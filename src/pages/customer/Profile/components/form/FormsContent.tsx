import { useState } from 'react'
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

import { MessageSquare, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react'
import type { FormDTO } from '../../../../../types/form.type'
import type { FormStatus } from '../../../../../types/form.type'
import { formApi } from '../../../../../apis/form.api'
import Loading from '../../../../../components/Loading/loading'
import EmptyState from '../../../../../components/EmptyState/emptyState'
import { toast } from '../../../../../utils/toast'

interface FormsContentProps {
  forms: FormDTO[]
  loading: boolean
  onRefresh: () => void
}

const FormsContent = ({ forms, loading, onRefresh }: FormsContentProps) => {
  const [selectedStatus, setSelectedStatus] = useState<FormStatus | 'all'>('all')
  const [cancellingFormId, setCancellingFormId] = useState<string | null>(null)

  const getStatusIcon = (status: FormStatus) => {
    switch (status) {
      case 'Pending':
        return <Clock className='w-4 h-4 text-yellow-500' />
      case 'Processing':
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
      case 'Cancel':
        return 'Đã hủy'
      default:
        return status
    }
  }

  const getTypeText = (type: string) => {
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
          <h3 className='text-lg font-semibold text-gray-900'>Khiếu nại của tôi</h3>
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
            title='Chưa có khiếu nại nào'
            description='Bạn chưa gửi khiếu nại nào. Hãy liên hệ với chúng tôi nếu cần hỗ trợ.'
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
        className='flex items-center justify-between'
      >
        <h3 className='text-lg font-semibold text-gray-900'>Khiếu nại của tôi</h3>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button onClick={onRefresh} variant='outline' size='sm'>
            Làm mới
          </Button>
        </motion.div>
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
              <Card className='hover:shadow-md transition-shadow'>
                <CardHeader className='pb-3'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <CardTitle className='text-base font-medium text-gray-900 mb-2'>{form.subject}</CardTitle>
                      <div className='flex items-center gap-2 mb-2'>
                        <Badge variant={getStatusBadgeVariant(form.status)} className='text-xs'>
                          <div className='flex items-center gap-1'>
                            {getStatusIcon(form.status)}
                            {getStatusText(form.status)}
                          </div>
                        </Badge>
                        <Badge variant='outline' className='text-xs'>
                          {getTypeText(form.type)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='pt-0'>
                  <div className='space-y-3'>
                    {/* Description */}
                    <div>
                      <p className='text-sm text-gray-600 line-clamp-3'>{form.description}</p>
                    </div>

                    {/* Images */}
                    {form.imageUrl && form.imageUrl.length > 0 && (
                      <div>
                        <p className='text-xs text-gray-500 mb-2'>Hình ảnh đính kèm:</p>
                        <div className='flex gap-2 flex-wrap'>
                          {form.imageUrl.map((imageUrl, index) => (
                            <img
                              key={index}
                              src={imageUrl}
                              alt={`Attachment ${index + 1}`}
                              className='w-16 h-16 object-cover rounded border'
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reply */}
                    {form.reply && (
                      <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
                        <p className='text-xs text-blue-600 font-medium mb-1'>Phản hồi từ nhân viên:</p>
                        <p className='text-sm text-blue-800'>{form.reply}</p>
                        {form.staffName && <p className='text-xs text-blue-600 mt-1'>- {form.staffName}</p>}
                      </div>
                    )}

                    {/* Admin Text */}
                    {form.adminText && (
                      <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
                        <p className='text-xs text-green-600 font-medium mb-1'>Phản hồi từ quản trị viên:</p>
                        <p className='text-sm text-green-800'>{form.adminText}</p>
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
                          {form.updatedAt !== form.createdAt && (
                            <div className='flex items-center gap-1'>
                              <Clock className='w-3 h-3' />
                              Cập nhật: {form.updatedAt}
                            </div>
                          )}
                        </div>

                        {/* Cancel Button - Only show for Pending status */}
                        {form.status === 'Pending' && (
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
    </motion.div>
  )
}

export default FormsContent
