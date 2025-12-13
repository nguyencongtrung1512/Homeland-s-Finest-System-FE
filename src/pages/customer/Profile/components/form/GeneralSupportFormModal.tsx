import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '../../../../../components/ui/dialog'
import { Button } from '../../../../../components/ui/button'
import { Input } from '../../../../../components/ui/input'
import { Textarea } from '../../../../../components/ui/textarea'
import { Label } from '../../../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select'
import { Camera, HelpCircle, Loader2, X } from 'lucide-react'
import type { FormType } from '../../../../../types/form.type'
import { motion, AnimatePresence } from 'framer-motion'

interface GeneralSupportFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: { type: FormType; subject: string; description: string; images?: File[] }) => Promise<void>
  isSubmitting: boolean
  allowedTypes: FormType[]
}

export const GENERAL_FORM_TYPE_INFO: Record<
  FormType,
  { label: string; description: string }
> = {
  ComplaintOrder: {
    label: 'Khiếu nại đơn hàng',
    description: 'Khiếu nại liên quan trực tiếp đến đơn hàng (giao nhận, thiếu/hư hỏng sản phẩm)'
  },
  ReportSeller: {
    label: 'Khiếu nại cửa hàng',
    description: 'Khiếu nại về cửa hàng, người bán hoặc dịch vụ của cửa hàng'
  },
  Orther: {
    label: 'Các đơn khác',
    description: 'Các vấn đề khác không thuộc khiếu nại đơn hàng hoặc cửa hàng'
  }
}

const MAX_SUBJECT_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 2000
const MAX_IMAGES = 5

const GeneralSupportFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  allowedTypes
}: GeneralSupportFormModalProps) => {
  const initialType = useMemo(() => allowedTypes[0], [allowedTypes])
  const [selectedType, setSelectedType] = useState<FormType>(initialType)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [errors, setErrors] = useState<{ subject?: string; description?: string; images?: string }>({})

  useEffect(() => {
    setSelectedType(initialType)
  }, [initialType])

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [images])

  useEffect(() => {
    if (!isOpen) {
      setSubject('')
      setDescription('')
      setImages([])
      setErrors({})
      setSelectedType(initialType)
    }
  }, [isOpen, initialType])

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (images.length + files.length > MAX_IMAGES) {
      setErrors((prev) => ({
        ...prev,
        images: `Tối đa ${MAX_IMAGES} hình ảnh`
      }))
      return
    }
    setImages((prev) => [...prev, ...files])
    setErrors((prev) => ({ ...prev, images: undefined }))
  }

  const validate = () => {
    const nextErrors: typeof errors = {}
    if (!subject.trim()) {
      nextErrors.subject = 'Vui lòng nhập tiêu đề'
    } else if (subject.trim().length > MAX_SUBJECT_LENGTH) {
      nextErrors.subject = `Không vượt quá ${MAX_SUBJECT_LENGTH} ký tự`
    }

    if (!description.trim()) {
      nextErrors.description = 'Vui lòng nhập mô tả chi tiết'
    } else if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
      nextErrors.description = `Không vượt quá ${MAX_DESCRIPTION_LENGTH} ký tự`
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    await onSubmit({
      type: selectedType,
      subject: subject.trim(),
      description: description.trim(),
      images: images.length ? images : undefined
    })
  }

  const availableTypeOptions = allowedTypes.map((type) => ({
    value: type,
    label: GENERAL_FORM_TYPE_INFO[type]?.label || type,
    description: GENERAL_FORM_TYPE_INFO[type]?.description || ''
  }))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-3xl max-h-[90vh] flex flex-col p-0'>
        <DialogHeader className='px-6 pt-6 pb-2 border-b border-gray-100'>
          <DialogTitle className='flex items-center gap-2 text-lg font-semibold text-gray-900'>
            <HelpCircle className='w-5 h-5 text-green-600' />
            Tạo yêu cầu hỗ trợ
          </DialogTitle>
        </DialogHeader>
        <div className='flex-1 overflow-y-auto px-6 py-4 space-y-6'>
          {allowedTypes.length > 1 && (
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>Loại yêu cầu</Label>
              <Select value={selectedType} onValueChange={(value: FormType) => setSelectedType(value)} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder='Chọn loại yêu cầu' />
                </SelectTrigger>
                <SelectContent>
                  {availableTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-gray-500 mt-2'>{availableTypeOptions.find((o) => o.value === selectedType)?.description}</p>
            </div>
          )}

          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>
              Tiêu đề <span className='text-red-500'>*</span>
            </Label>
            <Input
              placeholder='Ví dụ: Tôi cần hỗ trợ đăng nhập'
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value)
                setErrors((prev) => ({ ...prev, subject: undefined }))
              }}
              maxLength={MAX_SUBJECT_LENGTH}
              disabled={isSubmitting}
              className={errors.subject ? 'border-red-500' : ''}
            />
            <div className='flex justify-between text-xs text-gray-500 mt-1'>
              <span>{errors.subject}</span>
              <span>
                {subject.length}/{MAX_SUBJECT_LENGTH}
              </span>
            </div>
          </div>

          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>
              Mô tả chi tiết <span className='text-red-500'>*</span>
            </Label>
            <Textarea
              placeholder='Hãy mô tả rõ vấn đề bạn gặp phải...'
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setErrors((prev) => ({ ...prev, description: undefined }))
              }}
              maxLength={MAX_DESCRIPTION_LENGTH}
              className={`min-h-[140px] resize-none ${errors.description ? 'border-red-500' : ''}`}
              disabled={isSubmitting}
            />
            <div className='flex justify-between text-xs text-gray-500 mt-1'>
              <span>{errors.description}</span>
              <span>
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
          </div>

          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>
              Hình ảnh minh họa (tùy chọn, tối đa {MAX_IMAGES} ảnh)
            </Label>
            {errors.images && <p className='text-xs text-red-600 mb-2'>{errors.images}</p>}
            <motion.label
              htmlFor='general-support-upload'
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer block ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 hover:border-green-500'}`}
              whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
            >
              <input
                id='general-support-upload'
                type='file'
                accept='image/*'
                multiple
                className='hidden'
                onChange={handleImageUpload}
                disabled={isSubmitting}
              />
              <Camera className='w-8 h-8 text-gray-400 mx-auto mb-2' />
              <p className='text-sm text-gray-600'>Thêm hình ảnh</p>
              <p className='text-xs text-gray-500'>Hình ảnh giúp chúng tôi hiểu vấn đề rõ hơn</p>
            </motion.label>
            <AnimatePresence>
              {previewUrls.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='mt-3 grid grid-cols-3 gap-2'>
                  {previewUrls.map((url, index) => (
                    <div key={url} className='relative group'>
                      <img src={url} alt={`support-${index}`} className='w-full h-24 object-contain rounded-md border bg-gray-50' />
                      <button
                        type='button'
                        className='absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                        onClick={() => handleRemoveImage(index)}
                        disabled={isSubmitting}
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className='px-6 py-4 border-t border-gray-100 flex gap-3'>
          <Button variant='outline' className='flex-1' onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button className='flex-1 bg-green-600 hover:bg-green-700 text-white' onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Đang gửi...
              </>
            ) : (
              'Gửi khiếu nại'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default GeneralSupportFormModal


