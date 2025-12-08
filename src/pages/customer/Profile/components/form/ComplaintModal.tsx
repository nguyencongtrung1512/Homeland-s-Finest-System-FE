import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../../components/ui/dialog'
import { Button } from '../../../../../components/ui/button'
import { Textarea } from '../../../../../components/ui/textarea'
import { Label } from '../../../../../components/ui/label'
import { Input } from '../../../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select'
import { Camera, AlertTriangle, Loader2, X } from 'lucide-react'
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
  const [isDragOver, setIsDragOver] = useState(false)
  const MAX_IMAGES = 5

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [images])

  const formTypeOptions = [
    { value: 'ComplaintOrder' as FormType, label: 'Khiếu nại đơn hàng' },
    { value: 'ReportSeller' as FormType, label: 'Khiếu nại cửa hàng' },
    { value: 'Orther' as FormType, label: 'Các đơn khác' }
  ]

  const getFormTypeDescription = (type: FormType) => {
    switch (type) {
      case 'ComplaintOrder':
        return 'Khiếu nại liên quan trực tiếp đến đơn hàng (giao nhận, thiếu/hư hỏng)'
      case 'ReportSeller':
        return 'Khiếu nại về cửa hàng, người bán hoặc dịch vụ của cửa hàng'
      case 'Orther':
        return 'Các vấn đề khác không thuộc khiếu nại đơn hàng hoặc cửa hàng'
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

  const processFiles = (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'))
    const currentCount = images.length
    const remainingSlots = MAX_IMAGES - currentCount

    if (remainingSlots <= 0) {
      alert(`Bạn chỉ có thể tải lên tối đa ${MAX_IMAGES} hình ảnh`)
      return
    }

    const filesToAdd = imageFiles.slice(0, remainingSlots)
    if (filesToAdd.length < imageFiles.length) {
      alert(`Bạn chỉ có thể thêm tối đa ${remainingSlots} hình ảnh nữa (tối đa ${MAX_IMAGES} hình)`)
    }

    setImages((prev: File[]) => [...prev, ...filesToAdd])
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    processFiles(files)
    // Reset input để có thể chọn lại cùng file
    event.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoading && images.length < MAX_IMAGES) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (isLoading) return

    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
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
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Hình ảnh minh chứng (tùy chọn) <span className='text-gray-500 text-xs'>(Tối đa {MAX_IMAGES} ảnh)</span>
                </Label>
                <motion.div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  animate={{
                    borderColor: isDragOver ? '#10b981' : images.length >= MAX_IMAGES ? '#ef4444' : '#d1d5db',
                    backgroundColor: isDragOver ? '#f0fdf4' : 'transparent',
                    scale: isDragOver ? 1.02 : 1
                  }}
                  transition={{ duration: 0.2 }}
                  className={`border-2 border-dashed rounded-lg p-6 text-center ${
                    images.length >= MAX_IMAGES ? 'opacity-60' : ''
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <input
                    type='file'
                    multiple
                    accept='image/*'
                    onChange={handleImageUpload}
                    className='hidden'
                    id='complaint-image-upload'
                    disabled={isLoading || images.length >= MAX_IMAGES}
                  />
                  <Label
                    htmlFor='complaint-image-upload'
                    className={`cursor-pointer ${isLoading || images.length >= MAX_IMAGES ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <motion.div whileHover={{ scale: images.length >= MAX_IMAGES ? 1 : 1.1, rotate: images.length >= MAX_IMAGES ? 0 : 5 }} transition={{ duration: 0.2 }}>
                      <Camera className={`w-8 h-8 mx-auto mb-2 ${isDragOver ? 'text-green-500' : 'text-gray-400'}`} />
                    </motion.div>
                    <span className='text-sm text-gray-600 block'>
                      {isDragOver ? 'Thả ảnh vào đây' : images.length >= MAX_IMAGES ? `Đã đạt giới hạn ${MAX_IMAGES} ảnh` : 'Kéo thả ảnh hoặc click để chọn'}
                    </span>
                    <span className='text-xs text-gray-500 block mt-1'>
                      {images.length >= MAX_IMAGES
                        ? 'Bạn đã tải lên đủ số lượng ảnh cho phép'
                        : 'Hình ảnh sẽ giúp chúng tôi hiểu rõ vấn đề hơn'}
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
                      className='mt-4'
                    >
                      <p className='text-xs text-gray-600 mb-2'>
                        Đã chọn {images.length}/{MAX_IMAGES} hình ảnh
                      </p>
                      <div className='grid grid-cols-3 gap-2'>
                        {previewUrls.map((url, idx) => (
                          <motion.div
                            key={url}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className='relative group'
                          >
                            <img
                              src={url}
                              alt={`complaint-image-${idx + 1}`}
                              className='w-full h-20 object-contain rounded-md border bg-gray-50'
                            />
                            <motion.button
                              type='button'
                              onClick={() => handleRemoveImage(idx)}
                              disabled={isLoading}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50'
                              title='Xóa ảnh'
                            >
                              <X className='w-3 h-3' />
                            </motion.button>
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
