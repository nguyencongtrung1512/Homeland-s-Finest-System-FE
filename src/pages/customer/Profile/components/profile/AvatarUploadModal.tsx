import { useState, useRef } from 'react'
import { motion } from 'motion/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../../components/ui/dialog'
import { Button } from '../../../../../components/ui/button'
import { Camera } from 'lucide-react'
import { toast } from '../../../../../utils/toast'

const DEFAULT_AVATAR_IMAGE = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'

interface AvatarUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (file: File) => Promise<void>
  currentAvatar?: string | null
}

export default function AvatarUploadModal({ isOpen, onClose, onSave, currentAvatar }: AvatarUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh hợp lệ')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB')
        return
      }

      setSelectedFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)
      await onSave(selectedFile)
      toast.success('Cập nhật ảnh đại diện thành công!')
      handleClose()
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Cập nhật ảnh đại diện thất bại')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const handleCancel = () => {
    handleClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Chọn ảnh đại diện</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Preview Section */}
          <div className='flex justify-center'>
            <motion.div
              className='relative'
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className='w-48 h-48 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center'>
                {preview ? (
                  <motion.img
                    src={preview}
                    alt='Avatar preview'
                    className='w-full h-full object-cover'
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      if (target.src !== DEFAULT_AVATAR_IMAGE) {
                        target.src = DEFAULT_AVATAR_IMAGE
                      }
                    }}
                  />
                ) : currentAvatar ? (
                  <motion.img
                    src={currentAvatar}
                    alt='Current avatar'
                    className='w-full h-full object-cover'
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      if (target.src !== DEFAULT_AVATAR_IMAGE) {
                        target.src = DEFAULT_AVATAR_IMAGE
                      }
                    }}
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center bg-gray-200'>
                    <Camera className='w-16 h-16 text-gray-400' />
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* File Input */}
          <div className='flex justify-center'>
            <label
              htmlFor='avatar-upload-modal'
              className='cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
            >
              <Camera className='w-4 h-4' />
              Chọn ảnh
            </label>
            <input
              id='avatar-upload-modal'
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleFileSelect}
              className='hidden'
            />
          </div>

          {/* Info */}
          <div className='text-center text-xs text-gray-500 space-y-1'>
            <p>• Định dạng: JPG, PNG, GIF</p>
            <p>• Kích thước tối đa: 5MB</p>
            <p>• Khuyến nghị: ảnh vuông, độ phân giải cao</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={handleCancel} disabled={uploading}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={!selectedFile || uploading} className='bg-green-600 hover:bg-green-700'>
            {uploading ? 'Đang tải lên...' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

