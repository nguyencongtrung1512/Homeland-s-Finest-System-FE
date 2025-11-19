import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Upload, Video, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import { productApi, type ProductCreateFormData } from '../../../apis/product.api'
import { getAllProductCategory, type ProductCategoryItem } from '../../../apis/productCategory.api'
import { toast } from '../../../utils/toast'
import type { Product } from '../../../types/productType'

interface ModalProductDetailProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  parentId: string | undefined
  onSuccess: () => void
}

export default function ModalProductDetail({
  open,
  onOpenChange,
  product,
  parentId,
  onSuccess
}: ModalProductDetailProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<ProductCategoryItem[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  const [productDetailData, setProductDetailData] = useState({
    name: '',
    description: '',
    categoryId: null as string | null,
    material: ''
  })

  const [mediaData, setMediaData] = useState({
    productImages: [] as File[],
    productVideo: null as File | null
  })

  // Validation errors
  const [nameError, setNameError] = useState<string>('')
  const [materialError, setMaterialError] = useState<string>('')
  const [descriptionError, setDescriptionError] = useState<string>('')

  // Constants for validation
  const MAX_NAME_LENGTH = 20
  const MAX_MATERIAL_LENGTH = 20
  const MAX_DESCRIPTION_WORDS = 500
  const MAX_IMAGES = 10
  const MIN_NAME_LENGTH = 1

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

  // Helper functions
  const createPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file)
  }

  const removeProductImage = (indexToRemove: number) => {
    setMediaData((prev) => ({
      ...prev,
      productImages: prev.productImages.filter((_, index) => index !== indexToRemove)
    }))
  }

  const addProductImages = (newFiles: File[]) => {
    const currentCount = mediaData.productImages.length
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
      setMediaData((prev) => ({
        ...prev,
        productImages: [...prev.productImages, ...validFiles]
      }))
    }
  }

  const handleDetailInputChange = (field: string, value: string) => {
    // Clear errors when user starts typing
    if (field === 'name') {
      setNameError('')
      if (value.length > MAX_NAME_LENGTH) {
        setNameError(`Tên sản phẩm chỉ được tối đa ${MAX_NAME_LENGTH} ký tự.`)
        return
      }
    }

    if (field === 'material') {
      setMaterialError('')
      if (value.length > MAX_MATERIAL_LENGTH) {
        setMaterialError(`Material chỉ được tối đa ${MAX_MATERIAL_LENGTH} ký tự.`)
        return
      }
    }

    if (field === 'description') {
      setDescriptionError('')
      const wordCount = countWords(value)
      if (wordCount > MAX_DESCRIPTION_WORDS) {
        setDescriptionError(`Mô tả chỉ được tối đa ${MAX_DESCRIPTION_WORDS} từ.`)
      }
    }

    setProductDetailData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCategorySelect = (categoryId: string) => {
    setProductDetailData((prev) => ({
      ...prev,
      categoryId: prev.categoryId === categoryId ? null : categoryId
    }))
  }

  const handleCreateProductDetail = async () => {
    try {
      setIsSubmitting(true)

      if (!product) {
        toast.error('Không tìm thấy thông tin sản phẩm gốc')
        return
      }

      // Validate name
      if (!productDetailData.name.trim()) {
        toast.error('Vui lòng nhập tên sản phẩm')
        setNameError('Vui lòng nhập tên sản phẩm')
        return
      }

      if (productDetailData.name.trim().length < MIN_NAME_LENGTH) {
        toast.error('Tên sản phẩm phải có ít nhất 1 ký tự')
        setNameError('Tên sản phẩm phải có ít nhất 1 ký tự')
        return
      }

      if (productDetailData.name.trim().length > MAX_NAME_LENGTH) {
        toast.error(`Tên sản phẩm chỉ được tối đa ${MAX_NAME_LENGTH} ký tự`)
        setNameError(`Tên sản phẩm chỉ được tối đa ${MAX_NAME_LENGTH} ký tự`)
        return
      }

      // Validate material
      if (productDetailData.material && productDetailData.material.length > MAX_MATERIAL_LENGTH) {
        toast.error(`Material chỉ được tối đa ${MAX_MATERIAL_LENGTH} ký tự`)
        setMaterialError(`Material chỉ được tối đa ${MAX_MATERIAL_LENGTH} ký tự`)
        return
      }

      // Validate description
      const descriptionWordCount = countWords(productDetailData.description)
      if (descriptionWordCount > MAX_DESCRIPTION_WORDS) {
        toast.error(`Mô tả chỉ được tối đa ${MAX_DESCRIPTION_WORDS} từ.`)
        setDescriptionError(`Mô tả chỉ được tối đa ${MAX_DESCRIPTION_WORDS} từ.`)
        return
      }

      // Validate images count
      if (mediaData.productImages.length > MAX_IMAGES) {
        toast.error(`Chỉ được tối đa ${MAX_IMAGES} hình ảnh.`)
        return
      }

      // Validate video (only one video allowed)
      if (mediaData.productVideo && mediaData.productVideo.size > 50 * 1024 * 1024) {
        toast.error('Video quá lớn. Tối đa 50MB.')
        return
      }

      // Hardcode HashtagIds
      const hashtagIds = ['20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002']

      // Prepare form data theo cấu trúc API yêu cầu
      const formData: ProductCreateFormData = {
        storeId: product.storeId,
        parentId: parentId || null, // ParentId = id của product hiện tại
        name: productDetailData.name,
        categoryId: productDetailData.categoryId || undefined,
        description: productDetailData.description || undefined,
        material: productDetailData.material || undefined,
        productImages: mediaData.productImages.length > 0 ? mediaData.productImages : undefined,
        productVideo: mediaData.productVideo || undefined,
        hashtagIds: hashtagIds
      }

      const response = await productApi.createDetail(formData)

      // Accept both 200 (OK) and 201 (Created) status codes
      if ((response.status === 200 || response.status === 201) && response.data) {
        toast.success(response.message || 'Tạo sản phẩm chi tiết thành công!')
        onOpenChange(false)
        // Reset form
        setProductDetailData({
          name: '',
          description: '',
          categoryId: null,
          material: ''
        })
        setMediaData({
          productImages: [],
          productVideo: null
        })
        setNameError('')
        setMaterialError('')
        setDescriptionError('')
        // Call success callback
        onSuccess()
      } else {
        toast.error(response.message || 'Không thể tạo sản phẩm chi tiết')
      }
    } catch (error: unknown) {
      console.error('Error creating product detail:', error)

      // Extract error message from backend response
      let errorMessage = 'Có lỗi xảy ra khi tạo sản phẩm chi tiết'

      if (error && typeof error === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any

        // Check for axios error response structure (error.response.data)
        if (err.response?.data) {
          const responseData = err.response.data

          // Priority 1: Check for message in response.data
          if (responseData.message) {
            errorMessage = responseData.message
          }
          // Priority 2: Check for errors object (validation errors)
          else if (responseData.errors && typeof responseData.errors === 'object') {
            const errorMessages: string[] = []
            Object.keys(responseData.errors).forEach((field) => {
              const fieldErrors = responseData.errors[field]
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
          // Priority 3: Check for title field
          else if (responseData.title) {
            errorMessage = responseData.title
          }
          // Priority 4: Check for errors array
          else if (responseData.errors && Array.isArray(responseData.errors)) {
            errorMessage = responseData.errors.join(', ')
          }
          // Priority 5: Check for error string
          else if (responseData.error && typeof responseData.error === 'string') {
            errorMessage = responseData.error
          }
        }
        // Check for direct errors object (validation errors)
        else if (err.errors && typeof err.errors === 'object') {
          const errorMessages: string[] = []
          Object.keys(err.errors).forEach((field) => {
            const fieldErrors = err.errors[field]
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
        else if (err.title) {
          errorMessage = err.title
        }
        // Check for message field
        else if (err.message) {
          errorMessage = err.message
        }
        // Check for errors array
        else if (err.errors && Array.isArray(err.errors)) {
          errorMessage = err.errors.join(', ')
        }
        // Check for error string
        else if (err.error && typeof err.error === 'string') {
          errorMessage = err.error
        }
      }

      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Tạo Product Detail</DialogTitle>
        </DialogHeader>

        <div className='space-y-6 mt-4'>
          {/* Basic Information */}
          <div className='space-y-4'>
            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label htmlFor='detail-name' className='text-sm font-medium'>
                  Tên sản phẩm <span className='text-red-500'>*</span>
                </Label>
                <span
                  className={`text-xs ${productDetailData.name.length > MAX_NAME_LENGTH ? 'text-red-500' : 'text-gray-500'}`}
                >
                  {productDetailData.name.length} / {MAX_NAME_LENGTH} ký tự
                </span>
              </div>
              <Input
                id='detail-name'
                placeholder='Nhập tên sản phẩm...'
                value={productDetailData.name}
                onChange={(e) => handleDetailInputChange('name', e.target.value)}
                className={`mt-1 ${nameError ? 'border-red-500' : ''}`}
              />
              {nameError && <p className='mt-1 text-sm text-red-500'>{nameError}</p>}
            </div>

            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label htmlFor='detail-description' className='text-sm font-medium'>
                  Mô tả chi tiết
                </Label>
                <span
                  className={`text-xs ${countWords(productDetailData.description) > MAX_DESCRIPTION_WORDS ? 'text-red-500' : 'text-gray-500'
                    }`}
                >
                  {countWords(productDetailData.description)} / {MAX_DESCRIPTION_WORDS} từ
                </span>
              </div>
              <Textarea
                id='detail-description'
                placeholder='Mô tả chi tiết về sản phẩm...'
                value={productDetailData.description}
                onChange={(e) => handleDetailInputChange('description', e.target.value)}
                className={`mt-1 min-h-[100px] ${descriptionError ? 'border-red-500' : ''}`}
              />
              {descriptionError && <p className='mt-1 text-sm text-red-500'>{descriptionError}</p>}
            </div>

            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label htmlFor='detail-material' className='text-sm font-medium'>
                  Material
                </Label>
                <span
                  className={`text-xs ${productDetailData.material.length > MAX_MATERIAL_LENGTH ? 'text-red-500' : 'text-gray-500'}`}
                >
                  {productDetailData.material.length} / {MAX_MATERIAL_LENGTH} ký tự
                </span>
              </div>
              <Input
                id='detail-material'
                placeholder='Nhập material...'
                value={productDetailData.material}
                onChange={(e) => handleDetailInputChange('material', e.target.value)}
                className={`mt-1 ${materialError ? 'border-red-500' : ''}`}
              />
              {materialError && <p className='mt-1 text-sm text-red-500'>{materialError}</p>}
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <Label className='text-sm font-medium'>Danh mục sản phẩm</Label>
            {categoriesLoading ? (
              <div className='flex items-center justify-center py-4 mt-1 border rounded-md'>
                <Loader2 className='w-4 h-4 animate-spin mr-2' />
                <span className='text-sm text-gray-500'>Đang tải danh mục...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className='flex items-center justify-center py-4 mt-1 border rounded-md'>
                <span className='text-sm text-gray-500'>Không có danh mục nào</span>
              </div>
            ) : (
              <div className='mt-1 space-y-2 max-h-60 overflow-y-auto border rounded-md p-3'>
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`flex items-start space-x-3 p-2 rounded-md cursor-pointer transition-colors ${productDetailData.categoryId === category.id
                      ? 'bg-green-50 border border-green-200'
                      : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <div className='flex items-center'>
                      <input
                        type='radio'
                        name='detail-category'
                        checked={productDetailData.categoryId === category.id}
                        onChange={() => handleCategorySelect(category.id)}
                        className='w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500'
                      />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900'>{category.name}</p>
                      {category.description && <p className='text-xs text-gray-500 mt-1'>{category.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {productDetailData.categoryId && (
              <div className='mt-3'>
                <p className='text-sm font-medium text-gray-700 mb-2'>Danh mục đã chọn:</p>
                <div className='flex items-center gap-2'>
                  {(() => {
                    const category = categories.find((cat) => cat.id === productDetailData.categoryId)
                    return category ? (
                      <div className='inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-md'>
                        <span>{category.name}</span>
                        <button
                          type='button'
                          onClick={() => handleCategorySelect(productDetailData.categoryId!)}
                          className='ml-1 text-green-600 hover:text-green-800'
                        >
                          <X className='w-3 h-3' />
                        </button>
                      </div>
                    ) : null
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Product Images */}
          <div>
            <div className='flex items-center justify-between mb-1'>
              <Label className='text-sm font-medium'>Hình ảnh sản phẩm</Label>
              <span className='text-xs text-gray-500'>
                {mediaData.productImages.length} / {MAX_IMAGES} ảnh
              </span>
            </div>
            {mediaData.productImages.length < MAX_IMAGES ? (
              <div
                className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer'
                onClick={() => document.getElementById('detail-product-images')?.click()}
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
                    addProductImages(files)
                  }
                }}
              >
                <ImageIcon className='w-10 h-10 text-gray-400 mx-auto mb-3' />
                <p className='text-gray-600 mb-2'>
                  {mediaData.productImages.length > 0 ? 'Thêm ảnh khác' : 'Kéo thả hoặc click để tải ảnh lên'}
                </p>
                <input
                  type='file'
                  multiple
                  accept='image/*'
                  className='hidden'
                  id='detail-product-images'
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    if (files.length > 0) {
                      addProductImages(files)
                    }
                    e.target.value = ''
                  }}
                />
                <Button type='button' variant='outline' size='sm' className='mt-3'>
                  <Upload className='w-4 h-4 mr-2' />
                  {mediaData.productImages.length > 0 ? 'Thêm ảnh' : 'Chọn ảnh'}
                </Button>
              </div>
            ) : (
              <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                <p className='text-sm text-amber-600'>
                  Đã đạt giới hạn tối đa {MAX_IMAGES} hình ảnh. Vui lòng xóa ảnh cũ để thêm ảnh mới.
                </p>
              </div>
            )}

            {mediaData.productImages.length > 0 && (
              <div className='mt-4 grid grid-cols-4 gap-2'>
                {mediaData.productImages.map((file, index) => (
                  <div key={`${file.name}-${index}`} className='relative group'>
                    <div className='aspect-square rounded-lg overflow-hidden border-2 border-gray-200'>
                      <img
                        src={createPreviewUrl(file)}
                        alt={`Product ${index + 1}`}
                        className='w-full h-full object-cover'
                      />
                    </div>
                    <button
                      type='button'
                      onClick={() => removeProductImage(index)}
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
              <span className='text-xs text-gray-500'>{mediaData.productVideo ? '1 / 1 video' : '0 / 1 video'}</span>
            </div>
            {!mediaData.productVideo ? (
              <div
                className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer'
                onClick={() => document.getElementById('detail-product-video')?.click()}
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
                  const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('video/'))
                  if (files.length > 0) {
                    setMediaData((prev) => ({ ...prev, productVideo: files[0] }))
                  }
                }}
              >
                <Video className='w-10 h-10 text-gray-400 mx-auto mb-3' />
                <p className='text-gray-600 mb-2'>
                  {mediaData.productVideo ? 'Thay đổi video' : 'Kéo thả hoặc click để tải video lên'}
                </p>
                <input
                  type='file'
                  accept='video/*'
                  className='hidden'
                  id='detail-product-video'
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setMediaData((prev) => ({ ...prev, productVideo: file }))
                    e.target.value = ''
                  }}
                />
                <Button type='button' variant='outline' size='sm' className='mt-3'>
                  <Upload className='w-4 h-4 mr-2' />
                  Chọn video
                </Button>
              </div>
            ) : (
              <div className='mt-2 space-y-3'>
                <div className='relative group'>
                  <div className='aspect-video rounded-lg overflow-hidden border-2 border-gray-200'>
                    <video src={createPreviewUrl(mediaData.productVideo)} controls className='w-full h-full' />
                  </div>
                  <button
                    type='button'
                    onClick={() => setMediaData((prev) => ({ ...prev, productVideo: null }))}
                    className='absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all'
                  >
                    <X className='w-3 h-3' />
                  </button>
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => document.getElementById('detail-product-video')?.click()}
                  className='w-full'
                >
                  <Upload className='w-4 h-4 mr-2' />
                  Thay thế video
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={handleCreateProductDetail}
            disabled={isSubmitting}
            className='bg-green-600 hover:bg-green-700'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Đang tạo...
              </>
            ) : (
              'Tạo Product Detail'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
