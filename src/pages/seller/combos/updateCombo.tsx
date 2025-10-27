import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Badge } from '../../../components/ui/badge'
import { Switch } from '../../../components/ui/switch'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import { toast } from 'react-toastify'
import {
  getComboById,
  updateComboShell,
  addItemToCombo,
  updateComboItem,
  removeItemFromCombo
} from '../../../apis/combo.api'
import ComboItemsManager from './ComboItemsManager'
import type {
  Combo,
  CreateComboItemRequest,
  UpdateComboItemRequest,
  UpdateComboRequest
} from '../../../types/combo.type'

function UpdateComboSeller() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [combo, setCombo] = useState<Combo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const fetchCombo = useCallback(async () => {
    if (!id) return

    setLoading(true)
    try {
      const response = await getComboById(id)
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
      }
    } catch (error) {
      console.error('Error fetching combo:', error)
      toast.error('Không thể tải thông tin combo')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchCombo()
  }, [fetchCombo])

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
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const removeFile = () => {
    setThumbnailFile(null)
    if (previewUrl && !combo?.thumbnailUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(combo?.thumbnailUrl || null)
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
        isActive: combo.isActive,
        thumbnailFile: thumbnailFile || undefined
      }

      const response = await updateComboShell(combo.id, updateData)

      if (response) {
        setCombo({
          ...response.data as unknown as Combo,
          isActive: (response.data as unknown as Combo).isActive ?? true
        })
        toast.success('Cập nhật thông tin combo thành công')

        if (response.data?.status === 'Pending') {
          toast.info('Combo đã được gửi duyệt do có thay đổi')
        }

        await fetchCombo()
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } }; message?: string }
        const errorMessage = axiosError.response?.data?.message || axiosError.message || 'Có lỗi xảy ra khi cập nhật combo'
        toast.error(errorMessage)
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật combo')
      }
    } finally {
      setSaving(false)
    }
  }


  const handleAddItem = async (itemData: CreateComboItemRequest) => {
    if (!combo) return

    setSaving(true)
    try {
      const response = await addItemToCombo(combo.id, itemData)

      if (response) {
        setCombo({
          ...response,
          isActive: response.isActive ?? true
        })
        toast.success('Thêm sản phẩm vào combo thành công')

        if (response.status === 'Pending') {
          toast.info('Combo đã được gửi duyệt do có đủ 2 sản phẩm')
        }

        await fetchCombo()
      }
    } catch (error) {

      let errorMessage = 'Có lỗi xảy ra khi thêm sản phẩm'

      if (error && typeof error === 'object') {
        // Kiểm tra axios error structure
        if ('response' in error) {
          const axiosError = error as { response?: { data?: { message?: string; error?: string } }; message?: string }

          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message
          } else if (axiosError.response?.data?.error) {
            errorMessage = axiosError.response.data.error
          } else if (axiosError.message) {
            errorMessage = axiosError.message
          }
        } else if ('message' in error) {
          errorMessage = (error as Error).message
        }
      }

      toast.error(errorMessage)
      throw error
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateItem = async (itemId: string, itemData: UpdateComboItemRequest) => {
    if (!combo) return

    setSaving(true)
    try {
      const response = await updateComboItem(combo.id, itemId, itemData)

      if (response) {
        setCombo({
          ...response,
          isActive: response.isActive ?? true
        })
        toast.success('Cập nhật sản phẩm thành công')

        if (response.status === 'Pending') {
          toast.info('Combo đã được gửi duyệt do có thay đổi')
        } else if (response.status === 'Draft') {
          toast.info('Combo đã chuyển về trạng thái nháp')
        }

        await fetchCombo()
      }
    } catch (error) {
      console.error('Error updating item:', error)

      let errorMessage = 'Có lỗi xảy ra khi cập nhật sản phẩm'

      if (error && typeof error === 'object') {
        if ('response' in error) {
          const axiosError = error as { response?: { data?: { message?: string; error?: string } }; message?: string }

          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message
          } else if (axiosError.response?.data?.error) {
            errorMessage = axiosError.response.data.error
          } else if (axiosError.message) {
            errorMessage = axiosError.message
          }
        } else if ('message' in error) {
          errorMessage = (error as Error).message
        }
      }

      toast.error(errorMessage)
      throw error
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!combo) return

    setSaving(true)
    try {
      const response = await removeItemFromCombo(combo.id, itemId)

      if (response) {
        setCombo({
          ...response.data as unknown as Combo,
          isActive: (response.data as unknown as Combo).isActive ?? true
        })
        toast.success('Xóa sản phẩm thành công')

        if (response.data?.status === 'Draft') {
          toast.info('Combo đã chuyển về trạng thái nháp')
        }

        await fetchCombo()


      }
    } catch (error) {
      console.error('Error removing item:', error)

      let errorMessage = 'Có lỗi xảy ra khi xóa sản phẩm'

      if (error && typeof error === 'object') {
        // Kiểm tra axios error structure
        if ('response' in error) {
          const axiosError = error as { response?: { data?: { message?: string; error?: string } }; message?: string }

          // Lấy message từ response.data.message
          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message
          } else if (axiosError.response?.data?.error) {
            errorMessage = axiosError.response.data.error
          } else if (axiosError.message) {
            errorMessage = axiosError.message
          }
        } else if ('message' in error) {
          errorMessage = (error as Error).message
        }
      }

      toast.error(errorMessage)
      throw error
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    navigate('/seller/combo-management')
  }

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return {
        text: 'Đã xóa',
        className: 'bg-gray-100 text-gray-800 hover:bg-gray-100'
      }
    }

    switch (status) {
      case 'Draft':
        return {
          text: 'Nháp',
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-100'
        }
      case 'Pending':
        return {
          text: 'Chờ duyệt',
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
        }
      case 'Approved':
        return {
          text: 'Đã duyệt',
          className: 'bg-green-100 text-green-800 hover:bg-green-100'
        }
      case 'Rejected':
        return {
          text: 'Bị từ chối',
          className: 'bg-red-100 text-red-800 hover:bg-red-100'
        }
      default:
        return {
          text: 'Đã duyệt',
          className: 'bg-green-100 text-green-800 hover:bg-green-100'
        }
    }
  }

  const canEdit = combo?.status === 'Draft' || combo?.status === 'Rejected' || combo?.status === 'Pending'

  if (loading) {
    return (
      <div className='p-6'>
        <div className='flex justify-center items-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-600'></div>
          <span className='ml-2 text-gray-600'>Đang tải...</span>
        </div>
      </div>
    )
  }

  if (!combo) {
    return (
      <div className='p-6'>
        <div className='text-center py-12'>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Không tìm thấy combo</h2>
          <p className='text-gray-600 mb-6'>Combo bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <Button onClick={handleBack} className='bg-green-600 hover:bg-green-700'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Quay lại
          </Button>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusBadge(combo.status, combo.isActive)

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' onClick={handleBack}>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Quay lại
          </Button>
          <h1 className='text-2xl font-semibold text-gray-900'>Chỉnh sửa Combo</h1>
        </div>
        <div className='flex items-center gap-4'>
          <Badge variant='secondary' className={statusInfo.className}>
            {statusInfo.text}
          </Badge>
          {combo?.status === 'Approved' && (
            <div className='text-sm text-green-600 bg-green-50 px-3 py-1 rounded'>
              Combo đã được duyệt, không thể chỉnh sửa
            </div>
          )}
          {combo?.status === 'Pending' && (
            <div className='text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded'>
              Combo đang chờ duyệt, vẫn có thể chỉnh sửa
            </div>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Combo Shell Form */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin Combo</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
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

            {/* Trạng thái hoạt động */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='isActive'>Trạng thái hoạt động</Label>
                <Switch
                  id='isActive'
                  checked={combo?.isActive ?? true}
                  onCheckedChange={(checked) => {
                    if (combo) {
                      setCombo({ ...combo, isActive: checked })
                    }
                  }}
                  disabled={!canEdit}
                />
              </div>
              <p className='text-sm text-gray-500'>
                {combo?.isActive ? 'Combo đang hoạt động' : 'Combo đã bị vô hiệu hóa'}
              </p>
            </div>

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

            {/* Save Button */}
            {canEdit && (
              <Button
                onClick={handleSaveComboShell}
                disabled={saving || !formData.name.trim()}
                className='w-full bg-green-600 hover:bg-green-700'
              >
                <Save className='w-4 h-4 mr-2' />
                {saving ? 'Đang lưu...' : 'Lưu thông tin combo'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Combo Items */}
        <ComboItemsManager
          items={combo.comboItems}
          canEdit={canEdit}
          comboStatus={combo.status}
          onAddItem={handleAddItem}
          onUpdateItem={handleUpdateItem}
          onRemoveItem={handleRemoveItem}
        />
      </div>
    </div>
  )
}

export default UpdateComboSeller
