import { useState } from 'react'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { Headphones, ChevronDown, Upload, Send } from 'lucide-react'

interface CreateHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

function CreateHelpModal({ isOpen, onClose }: CreateHelpModalProps) {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    attachments: [] as File[]
  })

  const [isDragOver, setIsDragOver] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files)
      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...newFiles]
      }))
    }
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

  const handleSubmit = () => {
    console.log('Submit support request:', formData)
    // Handle submit logic here
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 flex items-center justify-center z-50 p-4'>
      <Card className='w-500 max-w-xl bg-[#F8F5F0]'>
        <CardContent className=''>
          {/* Header */}
          <div className='p-6'>
            <div className='flex items-center gap-3 mb-3'>
              <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                <Headphones className='w-5 h-5 text-green-600' />
              </div>
              <h2 className='text-2xl font-bold text-green-700'>Gửi yêu cầu hỗ trợ</h2>
            </div>
          </div>

          {/* Form */}
          <div className='space-y-6'>
            {/* Subject Field */}
            <div>
              <Label htmlFor='subject' className='text-green-700 font-medium mb-2 block'>
                Chủ đề
              </Label>
              <div className='relative'>
                <Input
                  id='subject'
                  placeholder='Chọn chủ đề...'
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className='pr-10'
                />
                <ChevronDown className='absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              </div>
            </div>

            {/* Description Field */}
            <div>
              <Label htmlFor='description' className='text-green-700 font-medium mb-2 block'>
                Mô tả chi tiết
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
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-white hover:border-gray-400'
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
                    <div key={index} className='flex items-center justify-between p-2 bg-gray-50 rounded'>
                      <span className='text-sm text-gray-700'>{file.name}</span>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            attachments: prev.attachments.filter((_, i) => i !== index)
                          }))
                        }}
                        className='text-red-500 hover:text-red-700'
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex justify-end gap-3 mt-8'>
            <Button type='button' variant='outline' onClick={onClose} className='px-6'>
              Hủy
            </Button>
            <Button type='button' onClick={handleSubmit} className='bg-green-600 hover:bg-green-700 text-white px-6'>
              <Send className='w-4 h-4 mr-2' />
              Gửi Yêu Cầu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreateHelpModal
