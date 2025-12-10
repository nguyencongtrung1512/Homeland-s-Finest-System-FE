import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../../components/ui/dialog'
import { Button } from '../../../../../components/ui/button'
import { Textarea } from '../../../../../components/ui/textarea'
import { Label } from '../../../../../components/ui/label'
import { Input } from '../../../../../components/ui/input'
import { Camera, HelpCircle, Loader2, X } from 'lucide-react'
import type { FormType } from '../../../../../types/form.type'

interface SupportModalProps {
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

const SupportModal = ({
  isOpen,
  onClose,
  orderId,
  storeId,
  userId,
  onSubmit,
  isLoading = false
}: SupportModalProps) => {
  // FormType luôn là 'Orther' cho xin hỗ trợ
  const formType: FormType = 'Orther'
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

  const handleSubmit = () => {
    if (!subject.trim()) {
      alert('Vui lòng nhập tiêu đề yêu cầu hỗ trợ')
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
    setSubject('')
    setDescription('')
    setImages([])
    onClose()
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
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
    if (files.length > 0) {
      processFiles(files)
    }
    // Reset input value to allow selecting the same file again
    event.target.value = ''
  }

  const handleRemoveImage = (index: number) => {
    // Revoke the URL for the removed image before removing
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index])
    }
    // Remove image - useEffect will automatically update previewUrls
    setImages((prev) => prev.filter((_, i) => i !== index))
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

    if (isLoading || images.length >= MAX_IMAGES) {
      return
    }

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      processFiles(files)
    }
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
                  <HelpCircle className='w-5 h-5 text-blue-500' />
                </motion.div>
                Xin hỗ trợ
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
                <p className='text-xs text-gray-500 mt-1'>
                  Vui lòng mô tả chi tiết vấn đề bạn cần hỗ trợ liên quan đến đơn hàng này
                </p>
              </motion.div>

              {/* Subject */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Tiêu đề yêu cầu hỗ trợ <span className='text-red-500'>*</span>
                </Label>
                <Input
                  placeholder='Ví dụ: Cần hỗ trợ về đơn hàng, thắc mắc về sản phẩm...'
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isLoading}
                />
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Mô tả chi tiết <span className='text-red-500'>*</span>
                </Label>
                <Textarea
                  placeholder='Hãy mô tả chi tiết vấn đề bạn cần hỗ trợ...'
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
                transition={{ duration: 0.3, delay: 0.6 }}
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
                  className={`border-2 border-dashed rounded-lg p-6 text-center ${images.length >= MAX_IMAGES ? 'opacity-60' : ''
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <input
                    type='file'
                    multiple
                    accept='image/*'
                    onChange={handleImageUpload}
                    className='hidden'
                    id='support-image-upload'
                    disabled={isLoading || images.length >= MAX_IMAGES}
                  />
                  <Label
                    htmlFor='support-image-upload'
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
                      <div className='flex items-center justify-between mb-3'>
                        <p className='text-sm text-gray-600 font-medium'>
                          Đã chọn <span className='text-green-600'>{images.length}</span> hình ảnh
                        </p>
                      </div>
                      <div className='grid grid-cols-3 gap-3'>
                        {previewUrls.map((url, idx) => (
                          <motion.div
                            key={`${url}-${idx}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className='relative group'
                          >
                            <img
                              src={url}
                              alt={`Xem trước ${idx + 1}`}
                              className='w-full h-24 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity'
                            />
                            <motion.button
                              type='button'
                              onClick={() => handleRemoveImage(idx)}
                              disabled={isLoading}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className='absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                              aria-label='Xóa ảnh'
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
                transition={{ duration: 0.3, delay: 0.8 }}
                className='text-xs text-gray-500 text-center'
              >
                Chúng tôi sẽ xem xét yêu cầu hỗ trợ của bạn và phản hồi trong vòng 24-48 giờ
              </motion.p>
            </motion.div>
          </div>

          {/* Fixed Footer */}
          <div className='px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white'>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
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
                  className='w-full bg-blue-600 hover:bg-blue-700 text-white'
                >
                  {isLoading ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Đang gửi...
                    </>
                  ) : (
                    'Gửi yêu cầu hỗ trợ'
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

export default SupportModal

