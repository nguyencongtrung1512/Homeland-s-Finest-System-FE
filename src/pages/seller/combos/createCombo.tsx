import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { createComboShell } from '../../../apis/combo.api'
import { useAuth } from '../../../contexts/auth.context'
import path from '../../../constants/path'
import type { CreateComboRequest } from '../../../types/combo.type'

function CreateComboSeller() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [thumbnailFile, setThumbnailFile] = useState<File | undefined>(undefined)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB')
        return
      }

      setThumbnailFile(file)

      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const removeFile = () => {
    setThumbnailFile(undefined)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(undefined)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.userId) {
      toast.error('Chưa đăng nhập')
      return
    }

    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên combo')
      return
    }

    // Thumbnail is optional for combo creation

    setLoading(true)

    try {
      const comboData: CreateComboRequest = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        sellerId: user.userId,
        thumbnailFile: thumbnailFile
      }

      const response = await createComboShell(comboData)

      if (response.status === 201) {
        toast.success('Tạo combo thành công! Bạn có thể thêm sản phẩm vào combo.')
        navigate(`../${path.detailComboSeller.replace(':id', response.data.id)}`)
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi tạo combo')
      }
    } catch (error: unknown) {
      console.error('Error creating combo:', error)
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo combo'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='flex items-center gap-4 mb-6'>
        <Button variant='ghost' onClick={handleBack}>
          <ArrowLeft className='w-4 h-4 mr-2' />
          Quay lại
        </Button>
        <h1 className='text-2xl font-semibold text-gray-900'>Tạo Combo Mới</h1>
      </div>

      <Card className='max-w-3xl mx-auto'>
        <CardHeader>
          <CardTitle>Thông tin Combo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Tên combo */}
            <div className='space-y-2'>
              <Label htmlFor='name'>Tên combo *</Label>
              <Input
                id='name'
                name='name'
                value={formData.name}
                onChange={handleInputChange}
                placeholder='Nhập tên combo...'
                required
                maxLength={200}
              />
              <p className='text-sm text-gray-500'>{formData.name.length}/200 ký tự</p>
            </div>

            {/* Mô tả */}
            <div className='space-y-2'>
              <Label htmlFor='description'>Mô tả</Label>
              <Textarea
                id='description'
                name='description'
                value={formData.description}
                onChange={handleInputChange}
                placeholder='Nhập mô tả combo...'
                rows={4}
                maxLength={500}
              />
              <p className='text-sm text-gray-500'>{formData.description.length}/500 ký tự</p>
            </div>

            {/* Upload ảnh */}
            <div className='space-y-2'>
              <Label htmlFor='thumbnail'>Ảnh thumbnail</Label>

              {!thumbnailFile ? (
                <div
                  className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer'
                  onClick={() => document.getElementById('thumbnail')?.click()}
                >
                  <Upload className='w-8 h-8 mx-auto text-gray-400 mb-2' />
                  <p className='text-gray-600 mb-2'>Kéo thả ảnh vào đây hoặc click để chọn</p>
                  <p className='text-sm text-gray-500'>PNG, JPG, JPEG (tối đa 5MB)</p>
                  <Input id='thumbnail' type='file' accept='image/*' onChange={handleFileChange} className='hidden' />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='mt-4'
                    onClick={(e) => {
                      e.stopPropagation()
                      document.getElementById('thumbnail')?.click()
                    }}
                  >
                    <Upload className='w-4 h-4 mr-2' />
                    Chọn ảnh
                  </Button>
                </div>
              ) : (
                <div className='space-y-4'>
                  <div className='relative inline-block'>
                    <img src={previewUrl || ''} alt='Preview' className='w-32 h-32 object-cover rounded-lg border' />
                    <Button
                      type='button'
                      variant='destructive'
                      size='sm'
                      className='absolute -top-2 -right-2'
                      onClick={removeFile}
                    >
                      <X className='w-4 h-4' />
                    </Button>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>{thumbnailFile.name}</p>
                    <p className='text-xs text-gray-500'>{(thumbnailFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button type='button' variant='outline' onClick={() => document.getElementById('thumbnail')?.click()}>
                    Chọn ảnh khác
                  </Button>
                  <Input id='thumbnail' type='file' accept='image/*' onChange={handleFileChange} className='hidden' />
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className='flex gap-4 pt-4'>
              <Button type='button' variant='outline' onClick={handleBack} disabled={loading}>
                Hủy
              </Button>
              <Button
                type='submit'
                disabled={loading || !formData.name.trim()}
                className='bg-green-600 hover:bg-green-700'
              >
                {loading ? 'Đang tạo...' : 'Tạo Combo'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className='max-w-3xl mx-auto mt-6'>
        <CardHeader>
          <CardTitle className='text-lg'>Lưu ý</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className='space-y-2 text-sm text-gray-600'>
            <li>• Combo sẽ được tạo với trạng thái "Nháp"</li>
            <li>• Sau khi tạo, bạn sẽ được chuyển đến trang chỉnh sửa để thêm sản phẩm</li>
            <li>• Combo cần ít nhất 2 sản phẩm để có thể gửi duyệt</li>
            <li>• Khi có đủ 2 sản phẩm, combo sẽ tự động chuyển sang trạng thái "Chờ duyệt"</li>
            <li>• Ảnh thumbnail là tùy chọn và sẽ được tự động resize</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreateComboSeller
