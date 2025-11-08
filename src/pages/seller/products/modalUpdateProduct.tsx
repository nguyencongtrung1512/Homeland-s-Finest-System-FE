import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Upload, Video, Trash2, X, Loader2 } from 'lucide-react'
import { productApi } from '../../../apis/product.api'
import { getAllProductCategory, type ProductCategoryItem } from '../../../apis/productCategory.api'
import { toast } from '../../../utils/toast'
import type { Product } from '../../../types/productType'
import { storeApi } from '../../../apis/store.api'
import { useAuth } from '../../../contexts/auth.context'

interface ModalUpdateProductProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSuccess: () => void
}

export default function ModalUpdateProduct({ open, onOpenChange, product, onSuccess }: ModalUpdateProductProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingProductDetail, setLoadingProductDetail] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [provinceId, setProvinceId] = useState<number | null>(null)
  const [categories, setCategories] = useState<ProductCategoryItem[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([])
  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null)

  const [productData, setProductData] = useState({
    name: '',
    description: '',
    categoryId: null as string | null,
    material: '',
    isActive: true
  })

  const [mediaData, setMediaData] = useState({
    newProductImages: [] as File[],
    newProductVideo: null as File | null,
    removeExistingVideo: false
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

  // Fetch store ID and province ID
  useEffect(() => {
    const fetchStoreId = async () => {
      if (!user?.userId) return

      try {
        const response = await storeApi.getStoreBySellerId(user.userId)
        if (response.status === 200 && response.data) {
          setStoreId(response.data.id)
          setProvinceId(response.data.provinceId)
        }
      } catch (error) {
        console.error('Error fetching store ID:', error)
      }
    }

    if (open && user?.userId) {
      fetchStoreId()
    }
  }, [open, user?.userId])

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

  // Fetch product detail when dialog opens
  useEffect(() => {
    const fetchProductDetail = async () => {
      if (open && product?.id) {
        try {
          setLoadingProductDetail(true)
          const response = await productApi.getById(product.id)

          if (response.status === 200 && response.data) {
            setFetchedProduct(response.data)
            // Load product data from fetched detail
            setProductData({
              name: response.data.name || '',
              description: response.data.description || '',
              categoryId: response.data.productCategories?.id || null,
              material: response.data.material || '',
              isActive: response.data.isActive
            })
            setExistingImageUrls(response.data.productImages || [])
          } else {
            toast.error('Không thể tải thông tin sản phẩm')
          }
        } catch (error) {
          console.error('Error fetching product detail:', error)
          toast.error('Có lỗi xảy ra khi tải thông tin sản phẩm')
        } finally {
          setLoadingProductDetail(false)
        }
      }
    }

    fetchProductDetail()
  }, [open, product?.id])

  // Helper functions
  const createPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file)
  }

  const removeExistingImage = (indexToRemove: number) => {
    setExistingImageUrls((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const removeNewImage = (indexToRemove: number) => {
    setMediaData((prev) => ({
      ...prev,
      newProductImages: prev.newProductImages.filter((_, index) => index !== indexToRemove)
    }))
  }

  const addNewImages = (newFiles: File[]) => {
    const currentCount = existingImageUrls.length + mediaData.newProductImages.length
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
        newProductImages: [...prev.newProductImages, ...validFiles]
      }))
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    // Clear errors when user starts typing
    if (field === 'name') {
      setNameError('')
      const stringValue = value as string
      if (stringValue.length > MAX_NAME_LENGTH) {
        setNameError(`Tên sản phẩm chỉ được tối đa ${MAX_NAME_LENGTH} ký tự.`)
        return
      }
    }

    if (field === 'material') {
      setMaterialError('')
      const stringValue = value as string
      if (stringValue.length > MAX_MATERIAL_LENGTH) {
        setMaterialError(`Material chỉ được tối đa ${MAX_MATERIAL_LENGTH} ký tự.`)
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
    setProductData((prev) => ({
      ...prev,
      categoryId: prev.categoryId === categoryId ? null : categoryId
    }))
  }

  const handleMediaChange = (field: string, value: File | File[] | null) => {
    if (field === 'newProductImages' && Array.isArray(value)) {
      addNewImages(value)
    } else {
      setMediaData((prev) => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleUpdateProduct = async () => {
    if (!product?.id) return

    try {
      setIsSubmitting(true)

      // Validation
      if (!productData.name.trim()) {
        toast.error('Vui lòng nhập tên sản phẩm')
        setNameError('Vui lòng nhập tên sản phẩm')
        return
      }

      if (productData.name.trim().length < MIN_NAME_LENGTH) {
        toast.error('Tên sản phẩm phải có ít nhất 1 ký tự')
        setNameError('Tên sản phẩm phải có ít nhất 1 ký tự')
        return
      }

      if (productData.name.trim().length > MAX_NAME_LENGTH) {
        toast.error(`Tên sản phẩm chỉ được tối đa ${MAX_NAME_LENGTH} ký tự`)
        setNameError(`Tên sản phẩm chỉ được tối đa ${MAX_NAME_LENGTH} ký tự`)
        return
      }

      // Validate material
      if (productData.material && productData.material.length > MAX_MATERIAL_LENGTH) {
        toast.error(`Material chỉ được tối đa ${MAX_MATERIAL_LENGTH} ký tự`)
        setMaterialError(`Material chỉ được tối đa ${MAX_MATERIAL_LENGTH} ký tự`)
        return
      }

      // Validate description
      const descriptionWordCount = countWords(productData.description)
      if (descriptionWordCount > MAX_DESCRIPTION_WORDS) {
        toast.error(`Mô tả chỉ được tối đa ${MAX_DESCRIPTION_WORDS} từ.`)
        setDescriptionError(`Mô tả chỉ được tối đa ${MAX_DESCRIPTION_WORDS} từ.`)
        return
      }

      // Validate images count
      const totalImages = existingImageUrls.length + mediaData.newProductImages.length
      if (totalImages > MAX_IMAGES) {
        toast.error(`Chỉ được tối đa ${MAX_IMAGES} hình ảnh.`)
        return
      }

      // Validate video (only one video allowed)
      if (mediaData.newProductVideo && fetchedProduct?.productVideo && !mediaData.removeExistingVideo) {
        toast.error('Chỉ được tối đa 1 video. Vui lòng xóa video cũ trước khi thêm video mới.')
        return
      }

      if (!storeId || !provinceId) {
        toast.error('Không tìm thấy thông tin cửa hàng')
        return
      }

      // Prepare FormData according to the curl request
      const formData = new FormData()

      // Required and basic fields
      formData.append('Name', productData.name)
      formData.append('ProvinceId', provinceId.toString())
      formData.append('IsActive', productData.isActive.toString())
      formData.append('RemoveExistingVideo', mediaData.removeExistingVideo.toString())

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

      // Existing image URLs
      if (existingImageUrls.length > 0) {
        existingImageUrls.forEach((url) => {
          formData.append('ExistingImageUrls', url)
        })
      }

      // New product images
      if (mediaData.newProductImages.length > 0) {
        mediaData.newProductImages.forEach((file) => {
          formData.append('NewProductImages', file)
        })
      }

      // New product video (can be empty)
      if (mediaData.newProductVideo) {
        formData.append('ProductVideo', mediaData.newProductVideo)
      } else if (mediaData.removeExistingVideo) {
        formData.append('ProductVideo', '')
      }

      // Call API
      const response = await productApi.updateWithFormData(product.id, formData)

      if (response.status === 202) {
        toast.success('Cập nhật sản phẩm thành công!')
        onSuccess()
        onOpenChange(false)
      }
    } catch (error: unknown) {
      console.error('Error updating product:', error)

      // Extract error message from backend response
      let errorMessage = 'Có lỗi xảy ra khi cập nhật sản phẩm'

      if (error && typeof error === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any

        // Check for errors object (validation errors)
        if (err.errors && typeof err.errors === 'object') {
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

  // Reset form when dialog closes
  const handleDialogClose = (open: boolean) => {
    onOpenChange(open)
    if (!open) {
      setProductData({
        name: '',
        description: '',
        categoryId: null,
        material: '',
        isActive: true
      })
      setExistingImageUrls([])
      setMediaData({
        newProductImages: [],
        newProductVideo: null,
        removeExistingVideo: false
      })
      setNameError('')
      setMaterialError('')
      setDescriptionError('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Cập nhật sản phẩm</DialogTitle>
        </DialogHeader>

        {loadingProductDetail ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='w-8 h-8 animate-spin text-green-600' />
            <span className='ml-2 text-gray-600'>Đang tải thông tin sản phẩm...</span>
          </div>
        ) : (
          <div className='space-y-6 mt-4'>
            {/* Product Name */}
            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label htmlFor='update-name' className='text-sm font-medium'>
                  Tên sản phẩm <span className='text-red-500'>*</span>
                </Label>
                <span
                  className={`text-xs ${productData.name.length > MAX_NAME_LENGTH ? 'text-red-500' : 'text-gray-500'}`}
                >
                  {productData.name.length} / {MAX_NAME_LENGTH} ký tự
                </span>
              </div>
              <Input
                id='update-name'
                placeholder='Nhập tên sản phẩm'
                value={productData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`mt-1 ${nameError ? 'border-red-500' : ''}`}
              />
              {nameError && <p className='mt-1 text-sm text-red-500'>{nameError}</p>}
            </div>

            {/* Material */}
            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label htmlFor='update-material' className='text-sm font-medium'>
                  Material
                </Label>
                <span
                  className={`text-xs ${productData.material.length > MAX_MATERIAL_LENGTH ? 'text-red-500' : 'text-gray-500'}`}
                >
                  {productData.material.length} / {MAX_MATERIAL_LENGTH} ký tự
                </span>
              </div>
              <Input
                id='update-material'
                placeholder='Nhập material (ví dụ: string)'
                value={productData.material}
                onChange={(e) => handleInputChange('material', e.target.value)}
                className={`mt-1 ${materialError ? 'border-red-500' : ''}`}
              />
              {materialError && <p className='mt-1 text-sm text-red-500'>{materialError}</p>}
            </div>

            {/* Province ID */}
            <div>
              <Label htmlFor='update-province' className='text-sm font-medium'>
                Province ID <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='update-province'
                type='number'
                value={provinceId || ''}
                disabled
                className='mt-1 bg-gray-100'
              />
            </div>

            {/* Category Selection */}
            <div>
              <Label className='text-sm font-medium'>
                Loại sản phẩm <span className='text-red-500'>*</span>
              </Label>
              <div className='mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2'>
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

            {/* Description */}
            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label htmlFor='update-description' className='text-sm font-medium'>
                  Mô tả sản phẩm
                </Label>
                <span
                  className={`text-xs ${countWords(productData.description) > MAX_DESCRIPTION_WORDS ? 'text-red-500' : 'text-gray-500'
                    }`}
                >
                  {countWords(productData.description)} / {MAX_DESCRIPTION_WORDS} từ
                </span>
              </div>
              <Textarea
                id='update-description'
                placeholder='Nhập mô tả sản phẩm'
                value={productData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`mt-1 ${descriptionError ? 'border-red-500' : ''}`}
                rows={4}
              />
              {descriptionError && <p className='mt-1 text-sm text-red-500'>{descriptionError}</p>}
            </div>

            {/* Active Status */}
            <div>
              <Label className='text-sm font-medium'>Trạng thái hoạt động</Label>
              <div className='mt-2 flex items-center space-x-4'>
                <label className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='radio'
                    name='isActive'
                    checked={productData.isActive === true}
                    onChange={() => handleInputChange('isActive', true)}
                    className='h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300'
                  />
                  <span className='text-sm text-gray-900'>Hoạt động</span>
                </label>
                <label className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='radio'
                    name='isActive'
                    checked={productData.isActive === false}
                    onChange={() => handleInputChange('isActive', false)}
                    className='h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300'
                  />
                  <span className='text-sm text-gray-900'>Tạm dừng</span>
                </label>
              </div>
            </div>

            {/* Existing Images */}
            {existingImageUrls.length > 0 && (
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <Label className='text-sm font-medium'>Ảnh hiện tại</Label>
                  <span className='text-xs text-gray-500'>
                    {existingImageUrls.length + mediaData.newProductImages.length} / {MAX_IMAGES} ảnh
                  </span>
                </div>
                <div className='grid grid-cols-3 gap-4 mt-2'>
                  {existingImageUrls.map((imageUrl, index) => (
                    <div key={index} className='relative group'>
                      <div className='aspect-square bg-gray-100 rounded-lg overflow-hidden border'>
                        <img src={imageUrl} alt={`Existing ${index + 1}`} className='w-full h-full object-cover' />
                      </div>
                      <button
                        onClick={() => removeExistingImage(index)}
                        className='absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Product Images */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <Label className='text-sm font-medium'>Ảnh sản phẩm mới</Label>
                <span className='text-xs text-gray-500'>
                  {existingImageUrls.length + mediaData.newProductImages.length} / {MAX_IMAGES} ảnh
                </span>
              </div>
              {existingImageUrls.length + mediaData.newProductImages.length < MAX_IMAGES ? (
                <div className='grid grid-cols-3 gap-4'>
                  {/* Existing new images */}
                  {mediaData.newProductImages.map((file, index) => (
                    <div key={index} className='relative group'>
                      <div className='aspect-square bg-gray-100 rounded-lg overflow-hidden border'>
                        <img
                          src={createPreviewUrl(file)}
                          alt={`New ${index + 1}`}
                          className='w-full h-full object-cover'
                        />
                      </div>
                      <button
                        onClick={() => removeNewImage(index)}
                        className='absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </div>
                  ))}

                  {/* Add image button */}
                  <label className='aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-600 hover:bg-green-50 transition-colors'>
                    <Upload className='w-8 h-8 text-gray-400 mb-2' />
                    <span className='text-sm text-gray-600 text-center px-2'>Thêm ảnh</span>
                    <input
                      type='file'
                      accept='image/*'
                      multiple
                      className='hidden'
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleMediaChange('newProductImages', Array.from(e.target.files))
                        }
                      }}
                    />
                  </label>
                </div>
              ) : (
                <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                  <p className='text-sm text-amber-600'>
                    Đã đạt giới hạn tối đa {MAX_IMAGES} hình ảnh. Vui lòng xóa ảnh cũ để thêm ảnh mới.
                  </p>
                </div>
              )}
            </div>

            {/* Remove Existing Video */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <Label className='text-sm font-medium'>Video sản phẩm</Label>
                <span className='text-xs text-gray-500'>
                  {(fetchedProduct?.productVideo && !mediaData.removeExistingVideo) || mediaData.newProductVideo
                    ? '1 / 1 video'
                    : '0 / 1 video'}
                </span>
              </div>
              {fetchedProduct?.productVideo && !mediaData.removeExistingVideo && (
                <div className='mt-2 mb-4'>
                  <div className='aspect-video bg-gray-100 rounded-lg overflow-hidden border'>
                    <video controls className='w-full h-full'>
                      <source src={fetchedProduct.productVideo} type='video/mp4' />
                    </video>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setMediaData((prev) => ({
                        ...prev,
                        removeExistingVideo: true
                      }))
                    }
                    className='mt-2 text-red-600 hover:text-red-700'
                  >
                    <Trash2 className='w-4 h-4 mr-2' />
                    Xóa video hiện tại
                  </Button>
                </div>
              )}

              {/* Upload new video */}
              {mediaData.removeExistingVideo && (
                <div className='mt-2'>
                  <Label htmlFor='upload-video' className='cursor-pointer'>
                    <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:border-green-600 hover:bg-green-50 transition-colors'>
                      <Video className='w-8 h-8 text-gray-400 mb-2' />
                      <span className='text-sm text-gray-600'>Chọn video mới</span>
                    </div>
                    <input
                      id='upload-video'
                      type='file'
                      accept='video/*'
                      className='hidden'
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0]
                          // Validate video file size (50MB max)
                          if (file.size > 50 * 1024 * 1024) {
                            toast.error('Video quá lớn. Tối đa 50MB.')
                            return
                          }
                          handleMediaChange('newProductVideo', file)
                        }
                      }}
                    />
                  </Label>
                </div>
              )}

              {/* Show new video preview */}
              {mediaData.newProductVideo && (
                <div className='mt-2'>
                  <div className='aspect-video bg-gray-100 rounded-lg overflow-hidden border'>
                    <video controls className='w-full h-full'>
                      <source src={createPreviewUrl(mediaData.newProductVideo)} type='video/mp4' />
                    </video>
                  </div>
                </div>
              )}

              {/* If not removed existing video and no new video, show upload option */}
              {!fetchedProduct?.productVideo && !mediaData.removeExistingVideo && (
                <div className='mt-2'>
                  <Label htmlFor='upload-new-video' className='cursor-pointer'>
                    <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:border-green-600 hover:bg-green-50 transition-colors'>
                      <Video className='w-8 h-8 text-gray-400 mb-2' />
                      <span className='text-sm text-gray-600'>Chọn video</span>
                    </div>
                    <input
                      id='upload-new-video'
                      type='file'
                      accept='video/*'
                      className='hidden'
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0]
                          // Validate video file size (50MB max)
                          if (file.size > 50 * 1024 * 1024) {
                            toast.error('Video quá lớn. Tối đa 50MB.')
                            return
                          }
                          handleMediaChange('newProductVideo', file)
                        }
                      }}
                    />
                  </Label>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className='mt-6'>
          <Button variant='outline' onClick={() => handleDialogClose(false)} disabled={isSubmitting}>
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
