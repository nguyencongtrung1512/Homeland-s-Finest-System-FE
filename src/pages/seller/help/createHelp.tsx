import { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Headphones, Upload, Send, X, Eye, Paperclip } from 'lucide-react'
import { formApi } from '../../../apis/form.api'
import type { FormType } from '../../../types/form.type'
import { toast } from '../../../utils/toast'
import { useAuth } from '../../../contexts/auth.context'
import ImagePreviewModal from '../../../components/ui/image-preview-modal'

interface CreateHelpModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void // callback sau khi tạo thành công
}

function CreateHelpModal({ isOpen, onClose, onSuccess }: CreateHelpModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    type: 'Orther' as FormType,
    subject: '',
    description: '',
    attachments: [] as File[]
  })

  const [isDragOver, setIsDragOver] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files)
      // Validate file types và size
      const validFiles = newFiles.filter((file) => {
        const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(file.type)
        const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB

        if (!isValidType) {
          toast.error(`File ${file.name} không đúng định dạng (chỉ chấp nhận JPG, PNG, PDF)`)
        }
        if (!isValidSize) {
          toast.error(`File ${file.name} vượt quá 10MB`)
        }

        return isValidType && isValidSize
      })

      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...validFiles]
      }))
    }
  }

  const handleRemoveFile = (index: number) => {
    const fileToRemove = formData.attachments[index]
    // Revoke object URL if it's an image
    if (fileToRemove && fileToRemove.type.startsWith('image/')) {
      const url = URL.createObjectURL(fileToRemove)
      URL.revokeObjectURL(url)
    }
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      formData.attachments.forEach((file) => {
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file)
          URL.revokeObjectURL(url)
        }
      })
      previewImages.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.type) {
      toast.error('Vui lòng chọn chủ đề')
      return
    }
    if (!formData.subject.trim()) {
      toast.error('Vui lòng nhập tiêu đề')
      return
    }
    if (!formData.description.trim()) {
      toast.error('Vui lòng nhập mô tả chi tiết')
      return
    }

    if (!user?.userId) {
      toast.error('Không tìm thấy thông tin người dùng')
      return
    }

    try {
      setIsSubmitting(true)

      const requestData = {
        userId: user.userId,
        type: formData.type,
        subject: formData.subject,
        description: formData.description,
        imageFiles: formData.attachments.length > 0 ? formData.attachments : undefined
      }

      await formApi.createForm(requestData)

      toast.success('Gửi yêu cầu hỗ trợ thành công!')

      // Reset form
      setFormData({
        type: 'Orther' as FormType,
        subject: '',
        description: '',
        attachments: []
      })

      // Call success callback
      onSuccess?.()

      // Close modal
      onClose()
    } catch (error: unknown) {
      console.error('Error creating form:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message ||
        (error as { message?: string }).message ||
        'Có lỗi xảy ra khi gửi yêu cầu'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Reset form nếu cần
    setFormData({
      type: 'Orther' as FormType,
      subject: '',
      description: '',
      attachments: []
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
              <Headphones className='w-5 h-5 text-green-600' />
            </div>
            Gửi yêu cầu hỗ trợ
          </DialogTitle>
        </DialogHeader>

        {/* Form */}
        <div className='space-y-6'>
          <div>
            <Label htmlFor='subject' className='text-green-700 font-medium mb-2 block'>
              Tiêu đề <span className='text-red-500'>*</span>
            </Label>
            <Input
              id='subject'
              placeholder='Nhập tiêu đề vấn đề của bạn...'
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
            />
          </div>

          {/* Description Field */}
          <div>
            <Label htmlFor='description' className='text-green-700 font-medium mb-2 block'>
              Mô tả chi tiết <span className='text-red-500'>*</span>
            </Label>
            <Textarea
              id='description'
              placeholder='Vui lòng mô tả chi tiết vấn đề của bạn...'
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={6}
              className='resize-none'
            />
          </div>

          {/* Attachment Field */}
          <div>
            <Label className='text-green-700 font-medium mb-2 block'>Tệp đính kèm</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragOver ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className='flex flex-col items-center space-y-3'>
                <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center'>
                  <Upload className='w-6 h-6 text-gray-400' />
                </div>
                <div>
                  <p className='text-gray-700 font-medium'>Kéo thả tệp vào đây hoặc chọn tệp</p>
                  <p className='text-sm text-gray-500 mt-1'>JPG, PNG, PDF tối đa 10MB</p>
                </div>
                <input
                  type='file'
                  multiple
                  accept='.jpg,.jpeg,.png,.pdf'
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className='hidden'
                  id='file-upload'
                />
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className='mt-2'
                >
                  Chọn tệp
                </Button>
              </div>
            </div>

            {/* Display uploaded files */}
            {formData.attachments.length > 0 && (
              <div className='mt-4'>
                <p className='text-sm font-medium text-gray-700 mb-3'>Tệp đã chọn:</p>
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
                  {formData.attachments.map((file, index) => {
                    const isImage = file.type.startsWith('image/')
                    const isPdf = file.type === 'application/pdf'
                    const previewUrl = isImage ? URL.createObjectURL(file) : null

                    return (
                      <div
                        key={index}
                        className='relative group overflow-hidden rounded-lg border border-gray-200 hover:border-green-400 transition-all'
                      >
                        {isImage && previewUrl ? (
                          <>
                            <img
                              src={previewUrl}
                              alt={file.name}
                              className='w-full h-32 object-cover group-hover:scale-105 transition-transform'
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                            <div
                              className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'
                              onClick={() => {
                                const imageUrls = formData.attachments
                                  .filter((f) => f.type.startsWith('image/'))
                                  .map((f) => URL.createObjectURL(f))
                                const imageIndex = formData.attachments
                                  .slice(0, index)
                                  .filter((f) => f.type.startsWith('image/')).length
                                setPreviewImages(imageUrls)
                                setPreviewInitialIndex(imageIndex)
                                setImagePreviewOpen(true)
                              }}
                            >
                              <Eye className='w-6 h-6 text-white' />
                            </div>
                            <button
                              type='button'
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveFile(index)
                                if (previewUrl) URL.revokeObjectURL(previewUrl)
                              }}
                              className='absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600'
                            >
                              <X className='w-3 h-3' />
                            </button>
                            <div className='absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate'>
                              {file.name}
                            </div>
                          </>
                        ) : (
                          <div className='w-full h-32 bg-gray-100 flex flex-col items-center justify-center p-2 relative'>
                            <Paperclip className='w-8 h-8 text-gray-400 mb-2' />
                            <span className='text-xs text-gray-600 text-center truncate w-full mb-1'>
                              {isPdf ? 'PDF' : file.name}
                            </span>
                            <span className='text-xs text-gray-500'>
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <button
                              type='button'
                              onClick={() => handleRemoveFile(index)}
                              className='absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600'
                            >
                              <X className='w-3 h-3' />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex justify-end gap-3 mt-8'>
          <Button type='button' variant='outline' onClick={handleCancel} className='px-6' disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            type='button'
            onClick={handleSubmit}
            className='bg-green-600 hover:bg-green-700 text-white px-6'
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
                Đang gửi...
              </>
            ) : (
              <>
                <Send className='w-4 h-4 mr-2' />
                Gửi Yêu Cầu
              </>
            )}
          </Button>
        </div>
      </DialogContent>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={imagePreviewOpen}
        onClose={() => {
          setImagePreviewOpen(false)
          // Revoke object URLs when closing
          previewImages.forEach((url) => {
            if (url.startsWith('blob:')) {
              URL.revokeObjectURL(url)
            }
          })
        }}
        images={previewImages}
        initialIndex={previewInitialIndex}
        alt='Xem trước hình ảnh đính kèm'
      />
    </Dialog>
  )
}

export default CreateHelpModal