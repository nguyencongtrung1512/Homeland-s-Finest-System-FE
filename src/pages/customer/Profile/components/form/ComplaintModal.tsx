import { useState } from 'react'
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
  const [formType, setFormType] = useState<FormType>('ComplaintContent')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<File[]>([])

  const formTypeOptions = [
    { value: 'ComplaintContent' as FormType, label: 'Khiếu nại nội dung' },
    { value: 'SupportRefundMoney' as FormType, label: 'Hỗ trợ hoàn tiền' },
    { value: 'ReportSeller' as FormType, label: 'Báo cáo người bán' }
  ]

  const getFormTypeDescription = (type: FormType) => {
    switch (type) {
      case 'ComplaintContent':
        return 'Khiếu nại về chất lượng sản phẩm, dịch vụ hoặc nội dung'
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
    setFormType('ComplaintContent')
    setSubject('')
    setDescription('')
    setImages([])
    onClose()
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setImages((prev: File[]) => [...prev, ...files])
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md mx-auto'>
        <DialogHeader>
          <DialogTitle className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
            <AlertTriangle className='w-5 h-5 text-red-500' />
            Khiếu nại đơn hàng
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Order Info */}
          <div className='bg-gray-50 rounded-lg p-3'>
            <p className='text-sm text-gray-600'>
              <span className='font-medium'>Mã đơn hàng:</span> {orderId}
            </p>
            <p className='text-xs text-gray-500 mt-1'>Vui lòng mô tả chi tiết vấn đề bạn gặp phải với đơn hàng này</p>
          </div>

          {/* Form Type Selection */}
          <div>
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
            <p className='text-xs text-gray-500 mt-1'>{getFormTypeDescription(formType)}</p>
          </div>

          {/* Subject */}
          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>
              Tiêu đề khiếu nại <span className='text-red-500'>*</span>
            </Label>
            <Input
              placeholder='Ví dụ: Sản phẩm bị hỏng, không đúng mô tả...'
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
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
          </div>

          {/* Image Upload */}
          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>Hình ảnh minh chứng (tùy chọn)</Label>
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
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
                <Camera className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                <span className='text-sm text-gray-600 block'>Thêm hình ảnh</span>
                <span className='text-xs text-gray-500 block mt-1'>Hình ảnh sẽ giúp chúng tôi hiểu rõ vấn đề hơn</span>
              </Label>
            </div>
            {images.length > 0 && (
              <div className='mt-2'>
                <p className='text-xs text-gray-600'>Đã chọn {images.length} hình ảnh</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className='flex gap-3 pt-4'>
            <Button variant='outline' onClick={handleCancel} className='flex-1' disabled={isLoading}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!subject.trim() || !description.trim() || isLoading}
              className='flex-1 bg-red-600 hover:bg-red-700 text-white'
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
          </div>

          {/* Footer Note */}
          <p className='text-xs text-gray-500 text-center'>
            Chúng tôi sẽ xem xét khiếu nại của bạn và phản hồi trong vòng 24-48 giờ
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ComplaintModal
