import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../../components/ui/dialog'
import { Button } from '../../../../../components/ui/button'
import { Badge } from '../../../../../components/ui/badge'
import { AlertTriangle, Loader2, Eye } from 'lucide-react'
import { formApi } from '../../../../../apis/form.api'
import type { FormDTO, FormStatus } from '../../../../../types/form.type'
import { toast } from 'react-toastify'

interface ViewComplaintModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
}

const getFormTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    SupportAccount: 'Hỗ trợ tài khoản',
    SupportPayment: 'Hỗ trợ thanh toán',
    SupportTechnical: 'Hỗ trợ kỹ thuật',
    ComplaintContent: 'Khiếu nại nội dung',
    ComplaintOrder: 'Khiếu nại đơn hàng',
    RequestInformation: 'Yêu cầu thông tin',
    ReportSeller: 'Báo cáo người bán',
    FeedbackSuggestion: 'Phản hồi góp ý',
    PrivacyDataRequest: 'Yêu cầu dữ liệu cá nhân',
    SupportMarketing: 'Hỗ trợ marketing',
    SupportOther: 'Hỗ trợ khác',
    SupportRefundMoney: 'Hỗ trợ hoàn tiền'
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
  return statusMap[status] || status
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

  useEffect(() => {
    if (isOpen && orderId) {
      loadComplaint()
    } else {
      setComplaint(null)
      setError(null)
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
                  <Eye className='w-5 h-5 text-blue-500' />
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
                  className='bg-gray-50 rounded-lg p-4'
                >
                  <p className='text-sm text-gray-600 mb-1'>
                    <span className='font-medium'>Mã đơn hàng:</span> {complaint.orderId || orderId}
                  </p>
                  <p className='text-sm text-gray-600'>
                    <span className='font-medium'>Mã khiếu nại:</span> {complaint.id}
                  </p>
                </motion.div>

                {/* Status and Type */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className='flex gap-3 flex-wrap'
                >
                  <div>
                    <p className='text-xs text-gray-500 mb-1'>Loại khiếu nại</p>
                    <Badge className='bg-blue-100 text-blue-700 border-0'>{getFormTypeLabel(complaint.type)}</Badge>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500 mb-1'>Trạng thái</p>
                    <Badge className={`${getStatusColor(complaint.status)} border-0`}>
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
                  <p className='text-sm font-medium text-gray-700 mb-2'>Tiêu đề khiếu nại</p>
                  <div className='bg-gray-50 rounded-lg p-3 border border-gray-200'>
                    <p className='text-gray-900'>{complaint.subject}</p>
                  </div>
                </motion.div>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                >
                  <p className='text-sm font-medium text-gray-700 mb-2'>Mô tả chi tiết</p>
                  <div className='bg-gray-50 rounded-lg p-3 border border-gray-200 min-h-[100px]'>
                    <p className='text-gray-900 whitespace-pre-wrap'>{complaint.description}</p>
                  </div>
                </motion.div>

                {/* Images */}
                {complaint.imageUrl && complaint.imageUrl.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 }}
                  >
                    <p className='text-sm font-medium text-gray-700 mb-2'>Hình ảnh minh chứng</p>
                    <div className='grid grid-cols-3 gap-3'>
                      {complaint.imageUrl.map((url, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: 0.8 + idx * 0.1 }}
                          className='relative group'
                        >
                          <img
                            src={url}
                            alt={`complaint-image-${idx + 1}`}
                            className='w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity'
                            onClick={() => window.open(url, '_blank')}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Reply */}
                {complaint.reply && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.8 }}
                  >
                    <p className='text-sm font-medium text-gray-700 mb-2'>Phản hồi từ nhân viên</p>
                    {complaint.staffName && (
                      <p className='text-xs text-gray-500 mb-1'>
                        Nhân viên: <span className='font-medium'>{complaint.staffName}</span>
                      </p>
                    )}
                    <div className='bg-green-50 rounded-lg p-3 border border-green-200'>
                      <p className='text-gray-900 whitespace-pre-wrap'>{complaint.reply}</p>
                    </div>
                  </motion.div>
                )}

                {/* Admin Text */}
                {complaint.adminText && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.9 }}
                  >
                    <p className='text-sm font-medium text-gray-700 mb-2'>Phản hồi từ Admin</p>
                    <div className='bg-blue-50 rounded-lg p-3 border border-blue-200'>
                      <p className='text-gray-900 whitespace-pre-wrap'>{complaint.adminText}</p>
                    </div>
                  </motion.div>
                )}

                {/* Timestamps */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 1.0 }}
                  className='bg-gray-50 rounded-lg p-3 border border-gray-200'
                >
                  <div className='grid grid-cols-2 gap-3 text-sm'>
                    <div>
                      <p className='text-gray-500 mb-1'>Ngày tạo</p>
                      <p className='text-gray-900 font-medium'>{complaint.createdAt}</p>
                    </div>
                    <div>
                      <p className='text-gray-500 mb-1'>Ngày cập nhật</p>
                      <p className='text-gray-900 font-medium'>{complaint.updatedAt}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Close Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 1.1 }}
                  className='flex justify-end pt-4'
                >
                  <Button onClick={onClose} className='bg-green-600 hover:bg-green-700 text-white'>
                    Đóng
                  </Button>
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
    </Dialog>
  )
}

export default ViewComplaintModal
