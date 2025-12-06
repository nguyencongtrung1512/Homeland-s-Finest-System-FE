import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../../components/ui/dialog'
import { Button } from '../../../../../components/ui/button'
import { Badge } from '../../../../../components/ui/badge'
import { Label } from '../../../../../components/ui/label'
import { Input } from '../../../../../components/ui/input'
import { Textarea } from '../../../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select'
import { AlertTriangle, Loader2, Eye, Edit, XCircle } from 'lucide-react'
import { formApi } from '../../../../../apis/form.api'
import type { FormDTO, FormStatus, FormType } from '../../../../../types/form.type'
import { toast } from '../../../../../utils/toast'
import UpdateFormModal from './UpdateFormModal'

interface ViewComplaintModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
}

const getFormTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    ComplaintOrder: 'Khiếu nại đơn hàng',
    ReportSeller: 'Khiếu nại cửa hàng',
    Orther: 'Các đơn khác'
  }
  return typeMap[type] || type
}

const getStatusLabel = (status: FormStatus): string => {
  const statusMap: Record<FormStatus, string> = {
    Pending: 'Chờ xử lý',
    Processing: 'Đang xử lý',
    DeniedByAdmin: 'Bị từ chối',
    DeniedByStaff: 'Đang xử lý',
    ApprovedByStaff: 'Đang xử lý',
    ApprovedByAdmin: 'Đã xử lí',
    Rejected: 'Đang xử lý',
    Confirmed: 'Đang xử lý',
    Cancel: 'Đã hủy'
  }
  return statusMap[status] || 'Chưa xác định'
}

const getStatusColor = (status: FormStatus): string => {
  if (status === 'ApprovedByStaff' || status === 'ApprovedByAdmin' || status === 'Confirmed') {
    return 'bg-green-100 text-green-700'
  }
  if (status === 'DeniedByAdmin' || status === 'DeniedByStaff' || status === 'Rejected') {
    return 'bg-red-100 text-red-700'
  }
  if (status === 'Processing') {
    return 'bg-blue-100 text-blue-700'
  }
  if (status === 'Cancel') {
    return 'bg-gray-100 text-gray-700'
  }
  return 'bg-yellow-100 text-yellow-700'
}

const ViewComplaintModal = ({ isOpen, onClose, orderId }: ViewComplaintModalProps) => {
  const [complaint, setComplaint] = useState<FormDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)

  const loadComplaint = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await formApi.getFormByOrderId(orderId)
      setComplaint(data)
    } catch (err) {
      console.error('Error loading complaint:', err)
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        'Không thể tải thông tin khiếu nại'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  const handleCancel = useCallback(async () => {
    if (!complaint?.id) return

    try {
      setIsCanceling(true)
      await formApi.cancelForm(complaint.id)
      toast.success('Hủy khiếu nại thành công!')
      // Reload complaint data to reflect the new status
      await loadComplaint()
    } catch (err) {
      console.error('Error canceling form:', err)
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        'Không thể hủy khiếu nại'
      toast.error(errorMessage)
    } finally {
      setIsCanceling(false)
    }
  }, [complaint?.id, loadComplaint])

  useEffect(() => {
    if (isOpen && orderId) {
      loadComplaint()
    } else {
      setComplaint(null)
      setError(null)
      setIsUpdateModalOpen(false)
    }
  }, [isOpen, orderId, loadComplaint])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl mx-auto max-h-[90vh] overflow-y-auto'>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <DialogTitle className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
                <motion.div
                  initial={{ rotate: -10, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <Eye className='w-5 h-5 text-green-500' />
                </motion.div>
                Chi tiết khiếu nại
              </DialogTitle>
            </motion.div>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className='space-y-6'
          >
            {loading ? (
              <div className='flex flex-col items-center justify-center py-12'>
                <Loader2 className='w-8 h-8 animate-spin text-green-600 mb-4' />
                <p className='text-gray-600'>Đang tải thông tin khiếu nại...</p>
              </div>
            ) : error ? (
              <div className='flex flex-col items-center justify-center py-12'>
                <AlertTriangle className='w-12 h-12 text-red-500 mb-4' />
                <p className='text-red-600 font-medium mb-2'>Không thể tải thông tin</p>
                <p className='text-gray-600 text-sm text-center'>{error}</p>
                <Button onClick={loadComplaint} variant='outline' className='mt-4'>
                  Thử lại
                </Button>
              </div>
            ) : complaint ? (
              <>
                {/* Order Info */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <Label className='text-sm font-medium text-gray-700 mb-2 block'>Mã đơn hàng</Label>
                  <Input value={complaint.orderId || orderId} disabled className='bg-gray-50' />
                </motion.div>

                {/* Status and Type */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className='grid grid-cols-2 gap-4'
                >
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-2 block'>Loại khiếu nại</Label>
                    <Select value={complaint.type} disabled>
                      <SelectTrigger className='bg-gray-50'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={complaint.type}>{getFormTypeLabel(complaint.type)}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-2 block'>Trạng thái</Label>
                    <Badge className={`${getStatusColor(complaint.status)} border-0 w-full justify-center py-2`}>
                      {getStatusLabel(complaint.status)}
                    </Badge>
                  </div>
                </motion.div>

                {/* Subject */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <Label className='text-sm font-medium text-gray-700 mb-2 block'>Tiêu đề khiếu nại</Label>
                  <Input value={complaint.subject} disabled className='bg-gray-50' />
                </motion.div>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                >
                  <Label className='text-sm font-medium text-gray-700 mb-2 block'>Mô tả chi tiết</Label>
                  <Textarea
                    value={complaint.description}
                    disabled
                    className='min-h-[120px] resize-none bg-gray-50'
                  />
                </motion.div>

                {/* Images */}
                {(() => {
                  const validImages = complaint.imageUrl?.filter((url) => url && url.trim() !== '') || []
                  if (validImages.length === 0) return null

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.7 }}
                    >
                      <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                        Hình ảnh minh chứng ({validImages.length}/5)
                      </Label>
                      <div className='grid grid-cols-4 gap-2'>
                        {validImages.map((url, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2, delay: 0.8 + idx * 0.1 }}
                            className='relative'
                          >
                            <img
                              src={url}
                              alt={`complaint-image-${idx + 1}`}
                              className='w-full h-20 object-contain rounded-md border bg-gray-50'
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )
                })()}

                {/* Reply */}
                {complaint.reply &&
                  (complaint.status === 'DeniedByAdmin' || complaint.status === 'ApprovedByAdmin') && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.8 }}
                    >
                      <Label className='text-sm font-medium text-gray-700 mb-2 block'>Phản hồi từ hệ thống</Label>
  
                      <Textarea
                        value={complaint.reply}
                        disabled
                        className='min-h-[100px] resize-none bg-green-50 border-green-200'
                      />
                    </motion.div>
                  )}

                {/* Admin Text */}
                {complaint.adminText && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.9 }}
                  >
                    <Label className='text-sm font-medium text-gray-700 mb-2 block'>Phản hồi từ quản trị viên</Label>
                    <Textarea
                      value={complaint.adminText}
                      disabled
                      className='min-h-[100px] resize-none bg-blue-50 border-blue-200'
                    />
                  </motion.div>
                )}

                {/* Timestamps */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 1.0 }}
                  className='grid grid-cols-2 gap-4'
                >
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-2 block'>Ngày tạo</Label>
                    <Input value={complaint.createdAt} disabled className='bg-gray-50' />
                  </div>
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-2 block'>Ngày cập nhật</Label>
                    <Input value={complaint.updatedAt} disabled className='bg-gray-50' />
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 1.1 }}
                  className='flex gap-3 pt-4'
                >
                  {complaint.status === 'Pending' && (
                    <>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className='flex-1'>
                        <Button
                          onClick={() => setIsUpdateModalOpen(true)}
                          className='w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2'
                        >
                          <Edit className='w-4 h-4' />
                          Chỉnh sửa
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className='flex-1'>
                        <Button
                          onClick={handleCancel}
                          disabled={isCanceling}
                          className='w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          {isCanceling ? (
                            <>
                              <Loader2 className='w-4 h-4 animate-spin' />
                              Đang hủy...
                            </>
                          ) : (
                            <>
                              <XCircle className='w-4 h-4' />
                              Hủy khiếu nại
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </>
                  )}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className='flex-1'>
                    <Button onClick={onClose} className='w-full bg-green-600 hover:bg-green-700 text-white'>
                      Đóng
                    </Button>
                  </motion.div>
                </motion.div>
              </>
            ) : (
              <div className='flex flex-col items-center justify-center py-12'>
                <AlertTriangle className='w-12 h-12 text-gray-400 mb-4' />
                <p className='text-gray-600'>Không tìm thấy thông tin khiếu nại</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </DialogContent>

      {/* Update Form Modal */}
      {complaint && (
        <UpdateFormModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          form={complaint}
          onSubmit={async (
            formId: string,
            data: {
              type: FormType
              subject: string
              description: string
              images?: File[]
              existingImageUrls?: string[]
            }
          ) => {
            try {
              setIsUpdating(true)
              await formApi.updateForm(formId, {
                storeId: complaint.storeId || '',
                orderId: complaint.orderId || '',
                type: data.type,
                subject: data.subject,
                description: data.description,
                imageFiles: data.images,
                existingImageUrls: data.existingImageUrls
              })
              toast.success('Cập nhật khiếu nại thành công!')
              setIsUpdateModalOpen(false)
              // Reload complaint data
              await loadComplaint()
            } catch (err) {
              console.error('Error updating form:', err)
              const errorMessage =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                (err as Error).message ||
                'Không thể cập nhật khiếu nại'
              toast.error(errorMessage)
            } finally {
              setIsUpdating(false)
            }
          }}
          isLoading={isUpdating}
        />
      )}
    </Dialog>
  )
}

export default ViewComplaintModal
