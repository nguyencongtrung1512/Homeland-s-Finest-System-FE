import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../../components/ui/dialog'
import { Button } from '../../../../../components/ui/button'
import { Textarea } from '../../../../../components/ui/textarea'
import { Label } from '../../../../../components/ui/label'
import { Input } from '../../../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select'
import { Edit, Loader2, X } from 'lucide-react'
import type { FormType, FormDTO } from '../../../../../types/form.type'

interface UpdateFormModalProps {
  isOpen: boolean
  onClose: () => void
  form: FormDTO | null
  onSubmit: (
    formId: string,
    data: { type: FormType; subject: string; description: string; images?: File[] }
  ) => Promise<void>
  isLoading?: boolean
}

const UpdateFormModal = ({ isOpen, onClose, form, onSubmit, isLoading = false }: UpdateFormModalProps) => {
  const [formType, setFormType] = useState<FormType>('SupportAccount')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([])

  useEffect(() => {
    if (form) {
      setFormType(form.type)
      setSubject(form.subject)
      setDescription(form.description)
      setExistingImageUrls(form.imageUrl || [])
      setImages([])
    }
  }, [form])

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [images])

  const formTypeOptions = [
    { value: 'SupportAccount' as FormType, label: 'Hỗ trợ tài khoản' },
    { value: 'SupportPayment' as FormType, label: 'Hỗ trợ thanh toán' },
    { value: 'SupportTechnical' as FormType, label: 'Hỗ trợ kỹ thuật' },
    { value: 'ComplaintContent' as FormType, label: 'Khiếu nại nội dung' },
    { value: 'ComplaintOrder' as FormType, label: 'Khiếu nại đơn hàng' },
    { value: 'RequestInformation' as FormType, label: 'Yêu cầu thông tin' },
    { value: 'ReportSeller' as FormType, label: 'Báo cáo người bán' },
    { value: 'FeedbackSuggestion' as FormType, label: 'Phản hồi góp ý' },
    { value: 'PrivacyDataRequest' as FormType, label: 'Yêu cầu dữ liệu cá nhân' },
    { value: 'SupportMarketing' as FormType, label: 'Hỗ trợ marketing' },
    { value: 'SupportOther' as FormType, label: 'Hỗ trợ khác' },
    { value: 'SupportRefundMoney' as FormType, label: 'Hỗ trợ hoàn tiền' }
  ]

  const handleSubmit = async () => {
    if (!form) return

    if (!subject.trim()) {
      alert('Vui lòng nhập tiêu đề')
      return
    }
    if (!description.trim()) {
      alert('Vui lòng nhập mô tả chi tiết')
      return
    }

    await onSubmit(form.id, {
      type: formType,
      subject: subject.trim(),
      description: description.trim(),
      images: images.length > 0 ? images : undefined
    })
  }

  const handleCancel = () => {
    if (form) {
      setFormType(form.type)
      setSubject(form.subject)
      setDescription(form.description)
      setExistingImageUrls(form.imageUrl || [])
      setImages([])
    }
    onClose()
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setImages((prev: File[]) => [...prev, ...files])
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  // const removeExistingImage = (index: number) => {
  //   setExistingImageUrls((prev) => prev.filter((_, i) => i !== index))
  // }

  if (!form) return null

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
                  <Edit className='w-5 h-5 text-green-500' />
                </motion.div>
                Cập nhật khiếu nại
              </DialogTitle>
            </motion.div>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className='space-y-6'
          >
            {/* Form Type Selection */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
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
            </motion.div>

            {/* Subject */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Tiêu đề <span className='text-red-500'>*</span>
              </Label>
              <Input
                placeholder='Nhập tiêu đề khiếu nại...'
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
                placeholder='Hãy mô tả chi tiết...'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className='min-h-[120px] resize-none'
                disabled={isLoading}
              />
            </motion.div>

            {/* Existing Images */}
            {existingImageUrls.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>Hình ảnh hiện tại</Label>
                <div className='grid grid-cols-4 gap-2'>
                  {existingImageUrls.map((url, idx) => (
                    <div key={idx} className='relative group'>
                      <img src={url} alt={`existing-${idx}`} className='w-full h-20 object-cover rounded-md border' />
                      <button
                        type='button'
                        // onClick={() => removeExistingImage(idx)}
                        className='absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                        disabled={isLoading}
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Image Upload */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
            >
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>Thêm hình ảnh mới (tùy chọn)</Label>
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
                  id='update-form-image-upload'
                  disabled={isLoading}
                />
                <Label
                  htmlFor='update-form-image-upload'
                  className={`cursor-pointer ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ duration: 0.2 }}>
                    <Edit className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                  </motion.div>
                  <span className='text-sm text-gray-600 block'>Thêm hình ảnh</span>
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
                    <p className='text-xs text-gray-600 mb-2'>Đã chọn {images.length} hình ảnh mới</p>
                    <div className='grid grid-cols-4 gap-2'>
                      {previewUrls.map((url, idx) => (
                        <motion.div
                          key={url}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className='relative group'
                        >
                          <img
                            src={url}
                            alt={`new-image-${idx + 1}`}
                            className='w-full h-20 object-cover rounded-md border'
                          />
                          <button
                            type='button'
                            onClick={() => removeImage(idx)}
                            className='absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                            disabled={isLoading}
                          >
                            <X className='w-3 h-3' />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.8 }}
              className='flex gap-3 pt-4'
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
                  className='w-full bg-green-600 hover:bg-green-700 text-white'
                >
                  {isLoading ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Đang cập nhật...
                    </>
                  ) : (
                    'Cập nhật'
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

export default UpdateFormModal

