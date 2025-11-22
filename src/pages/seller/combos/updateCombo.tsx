import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Save, Upload, X } from 'lucide-react'
import { toast } from '../../../utils/toast'
import { getComboById, updateComboShell } from '../../../apis/combo.api'
import type { Combo, UpdateComboRequest } from '../../../types/combo.type'

interface UpdateComboModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  combo: Combo | null
  onSuccess: () => void
}

function UpdateComboModal({ open, onOpenChange, combo: initialCombo, onSuccess }: UpdateComboModalProps) {
  const [combo, setCombo] = useState<Combo | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removeThumbnail, setRemoveThumbnail] = useState(false)

  // Fetch combo data when modal opens
  useEffect(() => {
    const fetchCombo = async () => {
      if (!open || !initialCombo?.id) return

      setLoading(true)
      try {
        const response = await getComboById(initialCombo.id)
        if (response.data) {
          const comboData = response.data
          setCombo(comboData)
          setFormData({
            name: comboData.name,
            description: comboData.description || ''
          })
          if (comboData.thumbnailUrl) {
            setPreviewUrl(comboData.thumbnailUrl)
          }
          setRemoveThumbnail(false)
          setThumbnailFile(null)
        }
      } catch (error) {
        console.error('Error fetching combo:', error)
        toast.error('Không thể tải thông tin combo')
      } finally {
        setLoading(false)
      }
    }

    fetchCombo()
  }, [open, initialCombo?.id])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setCombo(null)
      setFormData({ name: '', description: '' })
      setThumbnailFile(null)
      setPreviewUrl(null)
      setRemoveThumbnail(false)
    }
  }, [open])

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
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB')
        return
      }

      setThumbnailFile(file)
      setRemoveThumbnail(false) // Reset removeThumbnail khi có file mới
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const removeFile = () => {
    setThumbnailFile(null)
    setRemoveThumbnail(true)
    if (previewUrl && !combo?.thumbnailUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
  }

  const handleSaveComboShell = async () => {
    if (!combo || !formData.name.trim()) {
      toast.error('Vui lòng nhập tên combo')
      return
    }

    setSaving(true)
    try {
      const updateData: UpdateComboRequest = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        // Giữ nguyên isActive (toggle isActive được xử lý riêng trong listCombo.tsx)
        isActive: combo.isActive,
        thumbnailFile: thumbnailFile || undefined,
        removeThumbnail: removeThumbnail || undefined
      }

      const response = await updateComboShell(combo.id, updateData)

      if (response) {
        toast.success('Cập nhật thông tin combo thành công')

        if (response.data?.status === 'Pending') {
          toast.info('Combo đã được gửi duyệt do có thay đổi')
        }

        onSuccess()
        onOpenChange(false)
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } }; message?: string }
        const errorMessage =
          axiosError.response?.data?.message || axiosError.message || 'Có lỗi xảy ra khi cập nhật combo'
        toast.error(errorMessage)
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật combo')
      }
    } finally {
      setSaving(false)
    }
  }

  // Chỉ cho phép chỉnh sửa khi status là 'Draft'
  const canEdit = combo?.status === 'Draft'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa Combo</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className='flex justify-center items-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-600'></div>
            <span className='ml-2 text-gray-600'>Đang tải...</span>
          </div>
        ) : !combo ? (
          <div className='text-center py-12'>
            <p className='text-gray-600'>Không tìm thấy thông tin combo</p>
          </div>
        ) : (
          <div className='space-y-6'>
            {/* Tên combo */}
            <div className='space-y-2'>
              <Label htmlFor='name'>Tên combo *</Label>
              <Input
                id='name'
                name='name'
                value={formData.name}
                onChange={handleInputChange}
                placeholder='Nhập tên combo...'
                disabled={!canEdit}
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
                disabled={!canEdit}
                maxLength={500}
              />
              <p className='text-sm text-gray-500'>{formData.description.length}/500 ký tự</p>
            </div>

            {/* Trạng thái hoạt động - Đã được di chuyển sang nút toggle trong listCombo.tsx */}
            {/* Chức năng toggle isActive được xử lý riêng để tránh nhầm lẫn với việc chỉnh sửa thông tin cơ bản */}

            {/* Upload ảnh */}
            <div className='space-y-2'>
              <Label htmlFor='thumbnail'>Ảnh thumbnail</Label>

              {!previewUrl ? (
                <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors'>
                  <Upload className='w-8 h-8 mx-auto text-gray-400 mb-2' />
                  <p className='text-gray-600 mb-2'>Kéo thả ảnh vào đây hoặc click để chọn</p>
                  <p className='text-sm text-gray-500'>PNG, JPG, JPEG (tối đa 5MB)</p>
                  <Input
                    id='thumbnail'
                    type='file'
                    accept='image/*'
                    onChange={handleFileChange}
                    className='mt-4'
                    disabled={!canEdit}
                  />
                </div>
              ) : (
                <div className='space-y-4'>
                  <div className='relative inline-block'>
                    <img src={previewUrl} alt='Preview' className='w-32 h-32 object-cover rounded-lg border' />
                    {canEdit && (
                      <Button
                        type='button'
                        variant='destructive'
                        size='sm'
                        className='absolute -top-2 -right-2'
                        onClick={removeFile}
                      >
                        <X className='w-4 h-4' />
                      </Button>
                    )}
                  </div>
                  {thumbnailFile && (
                    <div>
                      <p className='text-sm text-gray-600'>{thumbnailFile.name}</p>
                      <p className='text-xs text-gray-500'>{(thumbnailFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                  {canEdit && (
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => document.getElementById('thumbnail')?.click()}
                    >
                      Chọn ảnh khác
                    </Button>
                  )}
                  <Input id='thumbnail' type='file' accept='image/*' onChange={handleFileChange} className='hidden' />
                </div>
              )}
            </div>

            {/* Status Info - Chỉ hiển thị cho Draft vì chỉ có Draft mới mở được modal */}
            {canEdit && combo?.status === 'Draft' && (
              <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                <div className='flex items-start gap-3'>
                  <div className='flex-shrink-0 mt-0.5'>
                    <svg
                      className='w-5 h-5 text-blue-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  </div>
                  <div className='flex-1'>
                    <h4 className='text-sm font-semibold text-blue-800 mb-1'>Combo ở trạng thái nháp</h4>
                    <p className='text-sm text-blue-700'>Bạn có thể chỉnh sửa thông tin combo trước khi gửi duyệt.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            {canEdit && (
              <div className='flex justify-end gap-2 pt-4'>
                <Button variant='outline' onClick={() => onOpenChange(false)} disabled={saving}>
                  Hủy
                </Button>
                <Button
                  onClick={handleSaveComboShell}
                  disabled={saving || !formData.name.trim()}
                  className='bg-green-600 hover:bg-green-700'
                >
                  <Save className='w-4 h-4 mr-2' />
                  {saving ? 'Đang lưu...' : 'Lưu thông tin combo'}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default UpdateComboModal
