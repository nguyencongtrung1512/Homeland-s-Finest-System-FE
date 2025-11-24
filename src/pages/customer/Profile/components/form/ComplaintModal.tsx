import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../../components/ui/dialog'
import { Button } from '../../../../../components/ui/button'
import { Textarea } from '../../../../../components/ui/textarea'
import { Label } from '../../../../../components/ui/label'
import { Input } from '../../../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select'
import { Camera, AlertTriangle, Loader2 } from 'lucide-react'
import type { FormType } from '../../../../../types/form.type'

interface ComplaintModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  storeId: string
  userId: string
  onSubmit: (
    orderId: string,
    storeId: string,
    userId: string,
    data: { formType: FormType; subject: string; description: string; images?: File[] }
  ) => void
  isLoading?: boolean
}

const ComplaintModal = ({
  isOpen,
  onClose,
  orderId,
  storeId,
  userId,
  onSubmit,
  isLoading = false
}: ComplaintModalProps) => {
  const [formType, setFormType] = useState<FormType>('ComplaintOrder')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [images])

  const formTypeOptions = [
    { value: 'ComplaintOrder' as FormType, label: 'Khiếu nại đơn hàng' },
    { value: 'SupportRefundMoney' as FormType, label: 'Hỗ trợ hoàn tiền' },
    { value: 'ReportSeller' as FormType, label: 'Báo cáo người bán' },
    { value: 'SupportOther' as FormType, label: 'Khác' }
  ]

  const getFormTypeDescription = (type: FormType) => {
    switch (type) {
      case 'ComplaintOrder':
        return 'Khiếu nại liên quan trực tiếp đến đơn hàng (giao nhận, thiếu/hư hỏng)'
      case 'SupportOther':
        return 'Khiếu nại về chất lượng sản phẩm, dịch vụ hoặc nội dung khác'
      case 'SupportRefundMoney':
        return 'Yêu cầu hoàn tiền cho đơn hàng'
      case 'ReportSeller':
        return 'Báo cáo về hành vi không đúng của người bán'
      default:
        return ''
    }
  }

  const handleSubmit = () => {
    if (!subject.trim()) {
      alert('Vui lòng nhập tiêu đề khiếu nại')
      return
    }
    if (!description.trim()) {
      alert('Vui lòng nhập mô tả chi tiết')
      return
    }

    onSubmit(orderId, storeId, userId, {
      formType,
      subject: subject.trim(),
      description: description.trim(),
      images: images.length > 0 ? images : undefined
    })
  }

  const handleCancel = () => {
    setFormType('ComplaintOrder')
    setSubject('')
    setDescription('')
    setImages([])
    onClose()
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormType('ComplaintOrder')
      setSubject('')
      setDescription('')
      setImages([])
    }
  }, [isOpen])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setImages((prev: File[]) => [...prev, ...files])
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-3xl max-h-[90vh] flex flex-col p-0'>
        <div className='flex flex-col h-full overflow-hidden'>
          {/* Fixed Header */}
          <DialogHeader className='px-6 pt-6 pb-4 border-b border-gray-200 flex-shrink-0'>
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
                  <AlertTriangle className='w-5 h-5 text-red-500' />
                </motion.div>
                Khiếu nại đơn hàng
              </DialogTitle>
            </motion.div>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className='flex-1 overflow-y-auto px-6 py-4'>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className='space-y-6'
            >
              {/* Order Info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className='bg-gray-50 rounded-lg p-3'
              >
                <p className='text-sm text-gray-600'>
                  <span className='font-medium'>Mã đơn hàng:</span> {orderId}
                </p>
                <p className='text-xs text-gray-500 mt-1'>
                  Vui lòng mô tả chi tiết vấn đề bạn gặp phải với đơn hàng này
                </p>
              </motion.div>

              {/* Form Type Selection */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Loại khiếu nại <span className='text-red-500'>*</span>
                </Label>
                <Select value={formType} onValueChange={(value: FormType) => setFormType(value)} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder='Chọn loại khiếu nại' />
                  </SelectTrigger>
                  <SelectContent>
                    {formTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <motion.p
                  key={formType}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className='text-xs text-gray-500 mt-1'
                >
                  {getFormTypeDescription(formType)}
                </motion.p>
              </motion.div>

              {/* Subject */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Tiêu đề khiếu nại <span className='text-red-500'>*</span>
                </Label>
                <Input
                  placeholder='Ví dụ: Sản phẩm bị hỏng, không đúng mô tả...'
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isLoading}
                />
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Mô tả chi tiết <span className='text-red-500'>*</span>
                </Label>
                <Textarea
                  placeholder='Hãy mô tả chi tiết vấn đề bạn gặp phải...'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className='min-h-[120px] resize-none'
                  disabled={isLoading}
                />
              </motion.div>

              {/* Image Upload */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.7 }}
              >
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>Hình ảnh minh chứng (tùy chọn)</Label>
                <motion.div
                  whileHover={{ scale: 1.02, borderColor: '#10b981' }}
                  transition={{ duration: 0.2 }}
                  className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'
                >
                  <input
                    type='file'
                    multiple
                    accept='image/*'
                    onChange={handleImageUpload}
                    className='hidden'
                    id='complaint-image-upload'
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor='complaint-image-upload'
                    className={`cursor-pointer ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ duration: 0.2 }}>
                      <Camera className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                    </motion.div>
                    <span className='text-sm text-gray-600 block'>Thêm hình ảnh</span>
                    <span className='text-xs text-gray-500 block mt-1'>
                      Hình ảnh sẽ giúp chúng tôi hiểu rõ vấn đề hơn
                    </span>
                  </Label>
                </motion.div>
                <AnimatePresence>
                  {images.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className='mt-2'
                    >
                      <p className='text-xs text-gray-600 mb-2'>Đã chọn {images.length} hình ảnh</p>
                      <div className='grid grid-cols-3 gap-2'>
                        {previewUrls.map((url, idx) => (
                          <motion.div key={url} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='relative'>
                            <img
                              src={url}
                              alt={`complaint-image-${idx + 1}`}
                              className='w-full h-20 object-cover rounded-md border'
                            />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Footer Note */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.9 }}
                className='text-xs text-gray-500 text-center'
              >
                Chúng tôi sẽ xem xét khiếu nại của bạn và phản hồi trong vòng 24-48 giờ
              </motion.p>
            </motion.div>
          </div>

          {/* Fixed Footer */}
          <div className='px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white'>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.8 }}
              className='flex gap-3'
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className='flex-1'>
                <Button variant='outline' onClick={handleCancel} className='w-full' disabled={isLoading}>
                  Hủy
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className='flex-1'>
                <Button
                  onClick={handleSubmit}
                  disabled={!subject.trim() || !description.trim() || isLoading}
                  className='w-full bg-red-600 hover:bg-red-700 text-white'
                >
                  {isLoading ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Đang gửi...
                    </>
                  ) : (
                    'Gửi khiếu nại'
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ComplaintModal
