import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Headphones, Upload, Send, X } from 'lucide-react'
import { formApi } from '../../../apis/form.api'
import type { FormType } from '../../../types/form.type'
import { toast } from '../../../utils/toast'
import { useAuth } from '../../../contexts/auth.context'

interface CreateHelpModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void // callback sau khi tạo thành công
}

// Danh sách các loại form
const FORM_TYPES: { value: FormType; label: string }[] = [
  { value: 'SupportAccount', label: 'Hỗ trợ tài khoản' },
  { value: 'SupportPayment', label: 'Hỗ trợ thanh toán' },
  { value: 'SupportTechnical', label: 'Hỗ trợ kỹ thuật' },
  { value: 'ComplaintContent', label: 'Khiếu nại nội dung' },
  { value: 'RequestInformation', label: 'Yêu cầu thông tin' },
  { value: 'ReportSeller', label: 'Báo cáo người bán' },
  { value: 'FeedbackSuggestion', label: 'Góp ý đề xuất' },
  { value: 'PrivacyDataRequest', label: 'Yêu cầu dữ liệu cá nhân' },
  { value: 'SupportMarketing', label: 'Hỗ trợ marketing' },
  { value: 'SupportRefundMoney', label: 'Hỗ trợ hoàn tiền' },
  { value: 'SupportOther', label: 'Hỗ trợ khác' }
]

function CreateHelpModal({ isOpen, onClose, onSuccess }: CreateHelpModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    type: '' as FormType,
    subject: '',
    description: '',
    orderId: '',
    attachments: [] as File[]
  })

  const [isDragOver, setIsDragOver] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

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
        orderId: formData.orderId || undefined,
        imageFiles: formData.attachments.length > 0 ? formData.attachments : undefined
      }

      await formApi.createForm(requestData)

      toast.success('Gửi yêu cầu hỗ trợ thành công!')

      // Reset form
      setFormData({
        type: '' as FormType,
        subject: '',
        description: '',
        orderId: '',
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
      type: '' as FormType,
      subject: '',
      description: '',
      orderId: '',
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
          {/* Type Field - Select */}
          <div>
            <Label htmlFor='type' className='text-green-700 font-medium mb-2 block'>
              Chủ đề <span className='text-red-500'>*</span>
            </Label>
            <Select value={formData.type} onValueChange={(value: FormType) => handleInputChange('type', value)}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Chọn chủ đề...' />
              </SelectTrigger>
              <SelectContent>
                {FORM_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Order ID Field (Optional) */}
          <div>
            <Label htmlFor='orderId' className='text-green-700 font-medium mb-2 block'>
              Mã đơn hàng (nếu có)
            </Label>
            <Input
              id='orderId'
              placeholder='VD: DH-2025-001234'
              value={formData.orderId}
              onChange={(e) => handleInputChange('orderId', e.target.value)}
            />
          </div>

          {/* Subject Field */}
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
              <div className='mt-4 space-y-2'>
                {formData.attachments.map((file, index) => (
                  <div key={index} className='flex items-center justify-between p-3 bg-gray-50 rounded border'>
                    <div className='flex items-center gap-2 flex-1 min-w-0'>
                      <span className='text-sm text-gray-700 truncate'>{file.name}</span>
                      <span className='text-xs text-gray-500'>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => handleRemoveFile(index)}
                      className='text-red-500 hover:text-red-700 hover:bg-red-50'
                    >
                      <X className='w-4 h-4' />
                    </Button>
                  </div>
                ))}
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
    </Dialog>
  )
}

export default CreateHelpModal