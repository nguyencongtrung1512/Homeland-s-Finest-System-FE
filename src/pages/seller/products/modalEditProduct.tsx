import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Upload, Image as ImageIcon, X, Loader2, Video } from 'lucide-react'
import { productApi } from '../../../apis/product.api'
import { toast } from '../../../utils/toast'
import type { Product } from '../../../types/productType'

interface ModalEditProductProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSuccess: () => void
}

export default function ModalEditProduct({
  open,
  onOpenChange,
  product,
  onSuccess
}: ModalEditProductProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [productData, setProductData] = useState({
    name: '',
    description: '',
    material: '',
    categoryId: '',
    isActive: true
  })

  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newProductImages, setNewProductImages] = useState<File[]>([])
  const [productVideo, setProductVideo] = useState<File | null>(null)
  const [removeExistingVideo, setRemoveExistingVideo] = useState(false)

  // Load data khi mở dialog
  useEffect(() => {
    if (open && product) {
      setProductData({
        name: product.name || '',
        description: product.description || '',
        material: product.material || '',
        categoryId: product.productCategories?.id || '',
        isActive: product.isActive ?? true
      })
      setExistingImages(product.productImages || [])
      setNewProductImages([])
      setProductVideo(null)
      setRemoveExistingVideo(false)
    }
  }, [open, product])

  // Helper functions
  const createPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file)
  }

  const removeExistingImage = (indexToRemove: number) => {
    setExistingImages((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const removeNewImage = (indexToRemove: number) => {
    setNewProductImages((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const addNewImages = (newFiles: File[]) => {
    setNewProductImages((prev) => [...prev, ...newFiles])
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setProductData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleUpdateProduct = async () => {
    try {
      setIsSubmitting(true)

      if (!product) {
        toast.error('Không tìm thấy thông tin sản phẩm')
        return
      }

      if (!productData.name.trim()) {
        toast.error('Vui lòng nhập tên sản phẩm')
        return
      }

      // Prepare FormData
      const formData = new FormData()

      // Required fields
      formData.append('Name', productData.name)

      // Optional fields
      if (productData.description) {
        formData.append('Description', productData.description)
      }

      if (productData.material) {
        formData.append('Material', productData.material)
      }

      if (productData.categoryId) {
        formData.append('CategoryId', productData.categoryId)
      }

      formData.append('IsActive', productData.isActive.toString())

      // Existing images URLs
      existingImages.forEach((imageUrl) => {
        formData.append('ExistingImageUrls', imageUrl)
      })

      // New product images
      if (newProductImages.length > 0) {
        newProductImages.forEach((file) => {
          formData.append('NewProductImages', file)
        })
      }

      // Product video
      if (productVideo) {
        formData.append('ProductVideo', productVideo)
      }

      // Remove existing video
      if (removeExistingVideo) {
        formData.append('RemoveExistingVideo', 'true')
      }

      const response = await productApi.updateWithFormData(product.id, formData)

      // Extract message from response
      let successMessage = 'Cập nhật sản phẩm thành công!'
      if (response?.data?.message) {
        successMessage = response.data.message
      } else if (response?.message) {
        successMessage = response.message
      }

      toast.success(successMessage)
      onSuccess()
      onOpenChange(false)
    } catch (error: unknown) {
      console.error('Error updating product:', error)

      // Extract error message from backend response
      let errorMessage = 'Có lỗi xảy ra khi cập nhật sản phẩm'

      if (error && typeof error === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any

        // Check for errors object (validation errors)
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message
        } else if (err.response?.data?.errors && typeof err.response.data.errors === 'object') {
          const errorMessages: string[] = []
          Object.keys(err.response.data.errors).forEach((field) => {
            const fieldErrors = err.response.data.errors[field]
            if (Array.isArray(fieldErrors)) {
              errorMessages.push(...fieldErrors)
            } else if (typeof fieldErrors === 'string') {
              errorMessages.push(fieldErrors)
            }
          })
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join(', ')
          }
        }
        // Check for title field
        else if (err.response?.data?.title) {
          errorMessage = err.response.data.title
        }
        // Check for message field
        else if (err.message) {
          errorMessage = err.message
        }
        // Check for errors array
        else if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
          errorMessage = err.response.data.errors.join(', ')
        }
        // Check for error string
        else if (err.response?.data?.error && typeof err.response.data.error === 'string') {
          errorMessage = err.response.data.error
        }
      }

      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form when dialog closes
  const handleDialogClose = (open: boolean) => {
    onOpenChange(open)
    if (!open) {
      setProductData({
        name: '',
        description: '',
        material: '',
        categoryId: '',
        isActive: true
      })
      setExistingImages([])
      setNewProductImages([])
      setProductVideo(null)
      setRemoveExistingVideo(false)
    }
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
        </DialogHeader>

        <div className='space-y-6 mt-4'>
          {/* Basic Information */}
          <div className='space-y-4'>
            {/* Name */}
            <div>
              <Label htmlFor='edit-product-name' className='text-sm font-medium'>
                Tên sản phẩm <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='edit-product-name'
                placeholder='Nhập tên sản phẩm...'
                value={productData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className='mt-1'
              />
            </div>

            {/* Material */}
            <div>
              <Label htmlFor='edit-product-material' className='text-sm font-medium'>
                Xuất xứ (Material)
              </Label>
              <Input
                id='edit-product-material'
                placeholder='Nhập xuất xứ...'
                value={productData.material}
                onChange={(e) => handleInputChange('material', e.target.value)}
                className='mt-1'
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor='edit-product-description' className='text-sm font-medium'>
                Mô tả sản phẩm
              </Label>
              <Textarea
                id='edit-product-description'
                placeholder='Mô tả về sản phẩm...'
                value={productData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className='mt-1 min-h-[100px]'
              />
            </div>

            {/* Category ID */}
            <div>
              <Label htmlFor='edit-product-category' className='text-sm font-medium'>
                Mã danh mục
              </Label>
              <Input
                id='edit-product-category'
                placeholder='Nhập mã danh mục...'
                value={productData.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                className='mt-1'
              />
            </div>

            {/* Is Active */}
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='edit-product-active'
                checked={productData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className='w-4 h-4 rounded border-gray-300'
              />
              <Label htmlFor='edit-product-active' className='text-sm font-medium'>
                Kích hoạt sản phẩm
              </Label>
            </div>
          </div>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div>
              <Label className='text-sm font-medium'>Ảnh hiện có (click để xóa)</Label>
              <div className='mt-2 grid grid-cols-4 gap-2'>
                {existingImages.map((imageUrl, index) => (
                  <div key={index} className='relative group'>
                    <div className='aspect-square rounded-lg overflow-hidden border-2 border-gray-200'>
                      <img
                        src={imageUrl}
                        alt={`Existing ${index + 1}`}
                        className='w-full h-full object-cover'
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-image.png'
                        }}
                      />
                    </div>
                    <button
                      type='button'
                      onClick={() => removeExistingImage(index)}
                      className='absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all'
                    >
                      <X className='w-3 h-3' />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Product Images */}
          <div>
            <Label className='text-sm font-medium'>Thêm ảnh mới</Label>
            <div
              className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer'
              onClick={() => document.getElementById('new-product-images')?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add('border-blue-400', 'bg-blue-50')
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50')
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50')
                const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('image/'))
                if (files.length > 0) {
                  addNewImages(files)
                }
              }}
            >
              <ImageIcon className='w-10 h-10 text-gray-400 mx-auto mb-3' />
              <p className='text-gray-600 mb-2'>
                {newProductImages.length > 0 ? 'Thêm ảnh khác' : 'Kéo thả hoặc click để tải ảnh lên'}
              </p>
              <input
                type='file'
                multiple
                accept='image/*'
                className='hidden'
                id='new-product-images'
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  if (files.length > 0) {
                    addNewImages(files)
                  }
                  e.target.value = ''
                }}
              />
              <Button type='button' variant='outline' size='sm' className='mt-3'>
                <Upload className='w-4 h-4 mr-2' />
                {newProductImages.length > 0 ? 'Thêm ảnh' : 'Chọn ảnh'}
              </Button>
            </div>

            {newProductImages.length > 0 && (
              <div className='mt-4 grid grid-cols-4 gap-2'>
                {newProductImages.map((file, index) => (
                  <div key={`${file.name}-${index}`} className='relative group'>
                    <div className='aspect-square rounded-lg overflow-hidden border-2 border-gray-200'>
                      <img
                        src={createPreviewUrl(file)}
                        alt={`New ${index + 1}`}
                        className='w-full h-full object-cover'
                      />
                    </div>
                    <button
                      type='button'
                      onClick={() => removeNewImage(index)}
                      className='absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all'
                    >
                      <X className='w-3 h-3' />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Video */}
          <div>
            <Label className='text-sm font-medium'>Video sản phẩm</Label>
            <div className='mt-2 space-y-2'>
              {product.productVideo && !removeExistingVideo && (
                <div className='space-y-2'>
                  <div className='relative group'>
                    <div className='aspect-video rounded-lg overflow-hidden border-2 border-gray-200'>
                      <video
                        src={product.productVideo}
                        controls
                        className='w-full h-full'
                        onError={(e) => {
                          console.error('Error loading video:', e)
                        }}
                      >
                        Trình duyệt của bạn không hỗ trợ video.
                      </video>
                    </div>
                    <button
                      type='button'
                      onClick={() => setRemoveExistingVideo(true)}
                      className='absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all'
                    >
                      <X className='w-3 h-3' />
                    </button>
                  </div>
                  <div className='flex items-center justify-between p-2 bg-gray-50 rounded-lg border'>
                    <div className='flex items-center gap-2'>
                      <Video className='w-4 h-4 text-gray-500' />
                      <span className='text-xs text-gray-600 truncate max-w-md'>
                        {product.productVideo}
                      </span>
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => setRemoveExistingVideo(true)}
                    >
                      Xóa video
                    </Button>
                  </div>
                </div>
              )}

              {(!product.productVideo || removeExistingVideo) && (
                <div
                  className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer'
                  onClick={() => document.getElementById('product-video')?.click()}
                >
                  <Video className='w-10 h-10 text-gray-400 mx-auto mb-3' />
                  <p className='text-gray-600 mb-2'>
                    {productVideo ? 'Thay đổi video' : 'Kéo thả hoặc click để tải video lên'}
                  </p>
                  <input
                    type='file'
                    accept='video/*'
                    className='hidden'
                    id='product-video'
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setProductVideo(file)
                        setRemoveExistingVideo(false)
                      }
                      e.target.value = ''
                    }}
                  />
                  <Button type='button' variant='outline' size='sm' className='mt-3'>
                    <Upload className='w-4 h-4 mr-2' />
                    {productVideo ? 'Thay đổi video' : 'Chọn video'}
                  </Button>
                </div>
              )}

              {productVideo && (
                <div className='relative group'>
                  <div className='aspect-video rounded-lg overflow-hidden border-2 border-gray-200'>
                    <video src={createPreviewUrl(productVideo)} controls className='w-full h-full' />
                  </div>
                  <button
                    type='button'
                    onClick={() => {
                      setProductVideo(null)
                      setRemoveExistingVideo(true)
                    }}
                    className='absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all'
                  >
                    <X className='w-3 h-3' />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={handleUpdateProduct}
            disabled={isSubmitting}
            className='bg-green-600 hover:bg-green-700'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Đang cập nhật...
              </>
            ) : (
              'Cập nhật sản phẩm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

