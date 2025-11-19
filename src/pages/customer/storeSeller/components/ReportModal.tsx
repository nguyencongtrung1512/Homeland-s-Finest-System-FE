import { Camera, AlertTriangle, Loader2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog'
import { Button } from '../../../../components/ui/button'
import { Textarea } from '../../../../components/ui/textarea'
import { Label } from '../../../../components/ui/label'
import { useState, useEffect } from 'react'
import { formApi } from '../../../../apis/form.api'
import { useAuth } from '../../../../contexts/auth.context'
import type { CreateFormRequest } from '../../../../types/form.type'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  storeName: string
  storeId: string
}

const ReportModal = ({ isOpen, onClose, storeName, storeId }: ReportModalProps) => {
  const { user } = useAuth()
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ description?: string; images?: string }>({})

  // Constants for validation
  const MAX_WORDS = 100
  const MAX_IMAGES = 5

  // Helper function to count words
  const countWords = (text: string): number => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [images])

  const reportReasons = [
    'Người bán hàng có hành cám',
    'Người bán có đáu hiệu lừa đảo',
    'Người bán đăng sản phẩm giả mạo'
  ]

  const handleReasonToggle = (reason: string) => {
    setSelectedReasons((prev: string[]) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    )
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const totalAfterAdd = images.length + files.length

    if (totalAfterAdd > MAX_IMAGES) {
      setErrors((prev) => ({
        ...prev,
        images: `Tối đa ${MAX_IMAGES} hình ảnh. Bạn có thể thêm tối đa ${MAX_IMAGES - images.length} hình ảnh nữa.`
      }))
      // Reset input
      event.target.value = ''
      return
    }

    setImages((prev: File[]) => [...prev, ...files])
    setErrors((prev) => ({ ...prev, images: undefined }))
    // Reset input để có thể chọn lại file giống nhau
    event.target.value = ''
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setErrors((prev) => ({ ...prev, images: undefined }))
  }

  const validateForm = (): boolean => {
    const newErrors: { description?: string; images?: string } = {}

    // Validate description word count
    const wordCount = countWords(description)
    if (wordCount > MAX_WORDS) {
      newErrors.description = `Mô tả không được vượt quá ${MAX_WORDS} từ (hiện tại: ${wordCount} từ)`
    }

    // Validate images count
    if (images.length > MAX_IMAGES) {
      newErrors.images = `Tối đa ${MAX_IMAGES} hình ảnh (hiện tại: ${images.length})`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!user?.userId) {
      setError('Vui lòng đăng nhập để gửi khiếu nại')
      return
    }

    if (selectedReasons.length === 0) {
      setError('Vui lòng chọn ít nhất một lý do báo cáo')
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData: CreateFormRequest = {
        userId: user.userId,
        storeId: storeId,
        type: 'ReportSeller',
        subject: `Báo cáo cửa hàng: ${storeName}`,
        description: `Lý do báo cáo: ${selectedReasons.join(', ')}\n\nMô tả chi tiết: ${description}`,
        imageFiles: images.length > 0 ? images : undefined
      }

      await formApi.createForm(formData)

      // Reset form and close modal
      setSelectedReasons([])
      setDescription('')
      setImages([])
      onClose()
    } catch (err) {
      console.error('Error submitting report:', err)
      setError('Có lỗi xảy ra khi gửi khiếu nại. Vui lòng thử lại sau.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Reset form and close modal
    setSelectedReasons([])
    setDescription('')
    setImages([])
    setError(null)
    onClose()
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedReasons([])
      setDescription('')
      setImages([])
      setError(null)
      setErrors({})
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-3xl max-h-[90vh] flex flex-col p-0'>
        <div className='flex flex-col h-full overflow-hidden'>
          {/* Fixed Header */}
          <DialogHeader className='px-6 pt-6 pb-4 border-b border-gray-200 flex-shrink-0'>
            <DialogTitle className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
              <AlertTriangle className='w-5 h-5 text-red-500' />
              Báo cáo cửa hàng
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className='flex-1 overflow-y-auto px-6 py-4'>
            <div className='space-y-6'>
              {/* Store Info */}
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0'>
                  <AlertTriangle className='w-6 h-6 text-white' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900'>{storeName}</h3>
                  <p className='text-sm text-gray-600'>
                    Thành lập từ 2015, chúng tôi cam kết mang đến sản phẩm nông sản sạch, an toàn từ những vùng đất màu
                    mỡ Việt Nam.
                  </p>
                </div>
              </div>

              {/* Report Reasons */}
              <div>
                <Label className='text-sm font-medium text-gray-700 mb-3 block'>Báo cáo:</Label>
                <div className='space-y-2'>
                  {reportReasons.map((reason, index) => (
                    <div key={index} className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        id={`reason-${index}`}
                        checked={selectedReasons.includes(reason)}
                        onChange={() => handleReasonToggle(reason)}
                        disabled={isSubmitting}
                        className='h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50'
                      />
                      <Label
                        htmlFor={`reason-${index}`}
                        className={`text-sm text-gray-700 ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      >
                        {reason}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Mô tả <span className='text-xs text-gray-500'>(Tối đa {MAX_WORDS} từ)</span>
                </Label>
                <Textarea
                  placeholder='Điều gì làm bạn báo cáo về cửa hàng này?'
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    setErrors((prev) => ({ ...prev, description: undefined }))
                  }}
                  className={`min-h-[100px] resize-none ${errors.description ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.description && <p className='text-sm text-red-600 mt-1'>{errors.description}</p>}
                <p className='text-xs text-gray-500 mt-1'>
                  {countWords(description)}/{MAX_WORDS} từ
                </p>
              </div>

              {/* Image Upload */}
              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Thêm hình ảnh (tùy chọn) - Tối đa {MAX_IMAGES} ảnh
                </Label>
                {errors.images && <p className='text-sm text-red-600 mb-2'>{errors.images}</p>}
                <p className='text-xs text-gray-500 mb-2'>
                  Đã chọn {images.length}/{MAX_IMAGES} ảnh
                </p>
                <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                  <input
                    type='file'
                    multiple
                    accept='image/*'
                    onChange={handleImageUpload}
                    className='hidden'
                    id='image-upload'
                    disabled={isSubmitting || images.length >= MAX_IMAGES}
                  />
                  <Label
                    htmlFor='image-upload'
                    className={`cursor-pointer ${isSubmitting || images.length >= MAX_IMAGES ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Camera className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                    <span className='text-sm text-gray-600 block'>Thêm Hình ảnh</span>
                    <span className='text-xs text-gray-500 block mt-1'>
                      Hình ảnh thực tế sẽ giúp đánh giá của bạn hữu ích hơn
                    </span>
                  </Label>
                </div>
                {images.length > 0 && (
                  <div className='mt-2'>
                    <p className='text-xs text-gray-600 mb-2'>Đã chọn {images.length} hình ảnh</p>
                    <div className='grid grid-cols-3 gap-2'>
                      {previewUrls.map((url, idx) => (
                        <div key={url} className='relative group'>
                          <img
                            src={url}
                            alt={`report-image-${idx + 1}`}
                            className='w-full h-20 object-cover rounded-md border'
                          />
                          <button
                            type='button'
                            onClick={() => removeImage(idx)}
                            className='absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600'
                            disabled={isSubmitting}
                          >
                            <X className='w-3 h-3' />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                  <p className='text-sm text-red-600'>{error}</p>
                </div>
              )}

              {/* Footer Note */}
              <p className='text-xs text-gray-500 text-center'>Đánh giá của bạn sẽ giúp cộng đồng mua sắm tốt hơn</p>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className='px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white'>
            <div className='flex gap-3'>
              <Button variant='outline' onClick={handleCancel} className='flex-1' disabled={isSubmitting}>
                Trở lại
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  selectedReasons.length === 0 ||
                  isSubmitting ||
                  countWords(description) > MAX_WORDS ||
                  images.length > MAX_IMAGES
                }
                className='flex-1 bg-red-600 hover:bg-red-700 text-white'
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Đang gửi...
                  </>
                ) : (
                  'Hoàn thành'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ReportModal
