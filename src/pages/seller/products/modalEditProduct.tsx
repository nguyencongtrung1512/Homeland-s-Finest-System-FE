import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Upload, Image as ImageIcon, X, Loader2, Video } from 'lucide-react'
import { productApi } from '../../../apis/product.api'
import { getAllProductCategory, type ProductCategoryItem } from '../../../apis/productCategory.api'
import { toast } from '../../../utils/toast'
import type { Product } from '../../../types/productType'

interface ModalEditProductProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSuccess: () => void
}

export default function ModalEditProduct({ open, onOpenChange, product, onSuccess }: ModalEditProductProps) {
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
  const [categories, setCategories] = useState<ProductCategoryItem[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  // Validation errors
  const [nameError, setNameError] = useState<string>('')
  const [materialError, setMaterialError] = useState<string>('')
  const [descriptionError, setDescriptionError] = useState<string>('')
  const [categoryError, setCategoryError] = useState<string>('')
  const [imagesError, setImagesError] = useState<string>('')

  // Constants for validation
  const MAX_NAME_WORDS = 20
  const MAX_MATERIAL_WORDS = 10
  const MAX_DESCRIPTION_WORDS = 500
  const MAX_IMAGES = 10

  // Helper function to count words
  const countWords = (text: string): number => {
    if (!text || text.trim().length === 0) return 0
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  // Fetch categories when dialog opens
  useEffect(() => {
    if (open) {
      const fetchCategories = async () => {
        try {
          setCategoriesLoading(true)
          const response = await getAllProductCategory({ pageSize: 100, pageNumber: 1 })
          if (response.status === 200 && response.data) {
            const activeCategories = response.data.filter((category: ProductCategoryItem) => category.isActive)
            setCategories(activeCategories)
          } else {
            setCategories([])
          }
        } catch {
          setCategories([])
        } finally {
          setCategoriesLoading(false)
        }
      }
      fetchCategories()
    }
  }, [open])

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
    const currentCount = existingImages.length + newProductImages.length
    const availableSlots = MAX_IMAGES - currentCount

    if (availableSlots <= 0) {
      toast.error(`Chỉ được tối đa ${MAX_IMAGES} hình ảnh.`)
      return
    }

    // Limit number of files that can be added
    const filesToAdd = newFiles.slice(0, availableSlots)

    if (filesToAdd.length < newFiles.length) {
      toast.error(`Chỉ có thể thêm tối đa ${availableSlots} ảnh nữa.`)
    }

    // Validate file types and sizes
    const validFiles: File[] = []
    filesToAdd.forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} không phải là hình ảnh.`)
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} quá lớn. Tối đa 5MB.`)
        return
      }

      validFiles.push(file)
    })

    if (validFiles.length > 0) {
      setNewProductImages((prev) => [...prev, ...validFiles])
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    // Clear errors when user starts typing
    if (field === 'name') {
      setNameError('')
      const stringValue = value as string
      const wordCount = countWords(stringValue)
      if (wordCount > MAX_NAME_WORDS) {
        setNameError(`Tên sản phẩm chỉ được tối đa ${MAX_NAME_WORDS} từ.`)
        return
      }
    }

    if (field === 'material') {
      setMaterialError('')
      const stringValue = value as string
      const wordCount = countWords(stringValue)
      if (wordCount > MAX_MATERIAL_WORDS) {
        setMaterialError(`Material chỉ được tối đa ${MAX_MATERIAL_WORDS} từ.`)
        return
      }
    }

    if (field === 'description') {
      setDescriptionError('')
      const stringValue = value as string
      const wordCount = countWords(stringValue)
      if (wordCount > MAX_DESCRIPTION_WORDS) {
        setDescriptionError(`Mô tả chỉ được tối đa ${MAX_DESCRIPTION_WORDS} từ.`)
      }
    }

    setProductData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCategorySelect = (categoryId: string) => {
    setCategoryError('')
    setProductData((prev) => ({
      ...prev,
      categoryId: prev.categoryId === categoryId ? '' : categoryId
    }))
  }

  const handleUpdateProduct = async () => {
    try {
      setIsSubmitting(true)

      if (!product) {
        toast.error('Không tìm thấy thông tin sản phẩm')
        return
      }

      // Validate name
      if (!productData.name.trim()) {
        toast.error('Vui lòng nhập tên sản phẩm')
        setNameError('Vui lòng nhập tên sản phẩm')
        return
      }

      const nameWordCount = countWords(productData.name)
      if (nameWordCount === 0) {
        toast.error('Tên sản phẩm phải có ít nhất 1 từ')
        setNameError('Tên sản phẩm phải có ít nhất 1 từ')
        return
      }

      if (nameWordCount > MAX_NAME_WORDS) {
        toast.error(`Tên sản phẩm chỉ được tối đa ${MAX_NAME_WORDS} từ`)
        setNameError(`Tên sản phẩm chỉ được tối đa ${MAX_NAME_WORDS} từ`)
        return
      }

      // Validate description - required
      if (!productData.description.trim()) {
        toast.error('Vui lòng nhập mô tả sản phẩm')
        setDescriptionError('Vui lòng nhập mô tả sản phẩm')
        return
      }

      const descriptionWordCount = countWords(productData.description)
      if (descriptionWordCount > MAX_DESCRIPTION_WORDS) {
        toast.error(`Mô tả chỉ được tối đa ${MAX_DESCRIPTION_WORDS} từ.`)
        setDescriptionError(`Mô tả chỉ được tối đa ${MAX_DESCRIPTION_WORDS} từ.`)
        return
      }

      // Validate material - required
      if (!productData.material.trim()) {
        toast.error('Vui lòng nhập xuất xứ (material)')
        setMaterialError('Vui lòng nhập xuất xứ (material)')
        return
      }

      const materialWordCount = countWords(productData.material)
      if (materialWordCount > MAX_MATERIAL_WORDS) {
        toast.error(`Material chỉ được tối đa ${MAX_MATERIAL_WORDS} từ`)
        setMaterialError(`Material chỉ được tối đa ${MAX_MATERIAL_WORDS} từ`)
        return
      }

      // Validate category - required
      if (!productData.categoryId || productData.categoryId.trim() === '') {
        toast.error('Vui lòng chọn loại sản phẩm')
        setCategoryError('Vui lòng chọn loại sản phẩm')
        return
      }

      // Validate images - at least 1 image required
      const totalImages = existingImages.length + newProductImages.length
      if (totalImages === 0) {
        toast.error('Vui lòng thêm ít nhất 1 hình ảnh sản phẩm')
        setImagesError('Vui lòng thêm ít nhất 1 hình ảnh sản phẩm')
        return
      }

      if (totalImages > MAX_IMAGES) {
        toast.error(`Chỉ được tối đa ${MAX_IMAGES} hình ảnh.`)
        setImagesError(`Chỉ được tối đa ${MAX_IMAGES} hình ảnh.`)
        return
      }

      // Validate video (only one video allowed)
      if (productVideo && product.productVideo && !removeExistingVideo) {
        toast.error('Chỉ được tối đa 1 video. Vui lòng xóa video cũ trước khi thêm video mới.')
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
      setNameError('')
      setMaterialError('')
      setDescriptionError('')
      setCategoryError('')
      setImagesError('')
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
              <div className='flex items-center justify-between mb-1'>
                <Label htmlFor='edit-product-name' className='text-sm font-medium'>
                  Tên sản phẩm <span className='text-red-500'>*</span>
                </Label>
                <span
                  className={`text-xs ${countWords(productData.name) > MAX_NAME_WORDS ? 'text-red-500' : 'text-gray-500'}`}
                >
                  {countWords(productData.name)} / {MAX_NAME_WORDS} từ
                </span>
              </div>
              <Input
                id='edit-product-name'
                placeholder='Nhập tên sản phẩm...'
                value={productData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`mt-1 ${nameError ? 'border-red-500' : ''}`}
              />
              {nameError && <p className='mt-1 text-sm text-red-500'>{nameError}</p>}
            </div>

            {/* Material */}
            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label htmlFor='edit-product-material' className='text-sm font-medium'>
                  Xuất xứ (Material) <span className='text-red-500'>*</span>
                </Label>
                <span
                  className={`text-xs ${countWords(productData.material) > MAX_MATERIAL_WORDS ? 'text-red-500' : 'text-gray-500'}`}
                >
                  {countWords(productData.material)} / {MAX_MATERIAL_WORDS} từ
                </span>
              </div>
              <Input
                id='edit-product-material'
                placeholder='Nhập xuất xứ...'
                value={productData.material}
                onChange={(e) => handleInputChange('material', e.target.value)}
                className={`mt-1 ${materialError ? 'border-red-500' : ''}`}
              />
              {materialError && <p className='mt-1 text-sm text-red-500'>{materialError}</p>}
            </div>

            {/* Description */}
            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label htmlFor='edit-product-description' className='text-sm font-medium'>
                  Mô tả sản phẩm <span className='text-red-500'>*</span>
                </Label>
                <span
                  className={`text-xs ${countWords(productData.description) > MAX_DESCRIPTION_WORDS ? 'text-red-500' : 'text-gray-500'
                    }`}
                >
                  {countWords(productData.description)} / {MAX_DESCRIPTION_WORDS} từ
                </span>
              </div>
              <Textarea
                id='edit-product-description'
                placeholder='Mô tả về sản phẩm...'
                value={productData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`mt-1 min-h-[100px] ${descriptionError ? 'border-red-500' : ''}`}
              />
              {descriptionError && <p className='mt-1 text-sm text-red-500'>{descriptionError}</p>}
            </div>

            {/* Category Selection */}
            <div>
              <Label className='text-sm font-medium'>
                Loại sản phẩm <span className='text-red-500'>*</span>
              </Label>
              {categoryError && <p className='mt-1 text-sm text-red-500'>{categoryError}</p>}
              <div
                className={`mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2 ${categoryError ? 'border-red-500' : ''}`}
              >
                {categoriesLoading ? (
                  <div className='text-center py-4 text-gray-500'>Đang tải danh mục...</div>
                ) : categories.length === 0 ? (
                  <div className='text-center py-4 text-gray-500'>Không có danh mục nào</div>
                ) : (
                  categories.map((category) => (
                    <label
                      key={category.id}
                      className='flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer'
                    >
                      <input
                        type='radio'
                        name='category'
                        checked={productData.categoryId === category.id}
                        onChange={() => handleCategorySelect(category.id)}
                        className='h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300'
                      />
                      <span className='text-sm text-gray-900'>{category.name}</span>
                    </label>
                  ))
                )}
              </div>
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
              <div className='flex items-center justify-between mb-1'>
                <Label className='text-sm font-medium'>
                  Ảnh hiện có (click để xóa) <span className='text-red-500'>*</span>
                </Label>
                <span className='text-xs text-gray-500'>
                  {existingImages.length + newProductImages.length} / {MAX_IMAGES} ảnh
                </span>
              </div>
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
            <div className='flex items-center justify-between mb-1'>
              <Label className='text-sm font-medium'>
                Ảnh sản phẩm {existingImages.length === 0 && <span className='text-red-500'>*</span>}
              </Label>
              <span className='text-xs text-gray-500'>
                {existingImages.length + newProductImages.length} / {MAX_IMAGES} ảnh
              </span>
            </div>
            {imagesError && <p className='mb-2 text-sm text-red-500'>{imagesError}</p>}
            {existingImages.length + newProductImages.length < MAX_IMAGES ? (
              <div
                className={`mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer ${imagesError ? 'border-red-500' : ''}`}
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
            ) : (
              <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                <p className='text-sm text-amber-600'>
                  Đã đạt giới hạn tối đa {MAX_IMAGES} hình ảnh. Vui lòng xóa ảnh cũ để thêm ảnh mới.
                </p>
              </div>
            )}

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
            <div className='flex items-center justify-between mb-1'>
              <Label className='text-sm font-medium'>Video sản phẩm</Label>
              <span className='text-xs text-gray-500'>
                {(product.productVideo && !removeExistingVideo) || productVideo ? '1 / 1 video' : '0 / 1 video'}
              </span>
            </div>
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
                      <span className='text-xs text-gray-600 truncate max-w-md'>{product.productVideo}</span>
                    </div>
                    <Button type='button' variant='outline' size='sm' onClick={() => setRemoveExistingVideo(true)}>
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
                        // Validate video file size (50MB max)
                        if (file.size > 50 * 1024 * 1024) {
                          toast.error('Video quá lớn. Tối đa 50MB.')
                          return
                        }
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
          <Button onClick={handleUpdateProduct} disabled={isSubmitting} className='bg-green-600 hover:bg-green-700'>
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
