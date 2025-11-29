import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Upload, Video, Image as ImageIcon, X, Loader2 } from 'lucide-react'
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

  // Lấy thông tin sản phẩm khi dialog mở
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
          console.error('Error fetching product:', error)
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
      categoryId: prev.categoryId === categoryId ? null : categoryId
    }))
  }

  const handleUpdateProduct = async () => {
    if (!product?.id) return

    try {
      setIsSubmitting(true)

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
      if (!productData.categoryId) {
        toast.error('Vui lòng chọn loại sản phẩm')
        setCategoryError('Vui lòng chọn loại sản phẩm')
        return
      }

      // Validate images - at least 1 image required
      const totalImages = existingImageUrls.length + mediaData.newProductImages.length
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
      setCategoryError('')
      setImagesError('')
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
                  className={`text-xs ${countWords(productData.name) > MAX_NAME_WORDS ? 'text-red-500' : 'text-gray-500'}`}
                >
                  {countWords(productData.name)} / {MAX_NAME_WORDS} từ
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
                  Xuất xứ (Material) <span className='text-red-500'>*</span>
                </Label>
                <span
                  className={`text-xs ${countWords(productData.material) > MAX_MATERIAL_WORDS ? 'text-red-500' : 'text-gray-500'}`}
                >
                  {countWords(productData.material)} / {MAX_MATERIAL_WORDS} từ
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

            {/* Description */}
            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label htmlFor='update-description' className='text-sm font-medium'>
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
                <div className='flex items-center justify-between mb-1'>
                  <Label className='text-sm font-medium'>
                    Ảnh hiện có (click để xóa) <span className='text-red-500'>*</span>
                  </Label>
                  <span className='text-xs text-gray-500'>
                    {existingImageUrls.length + mediaData.newProductImages.length} / {MAX_IMAGES} ảnh
                  </span>
                </div>
                <div className='mt-2 grid grid-cols-4 gap-2'>
                  {existingImageUrls.map((imageUrl, index) => (
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
                  Ảnh sản phẩm {existingImageUrls.length === 0 && <span className='text-red-500'>*</span>}
                </Label>
                <span className='text-xs text-gray-500'>
                  {existingImageUrls.length + mediaData.newProductImages.length} / {MAX_IMAGES} ảnh
                </span>
              </div>
              {imagesError && <p className='mb-2 text-sm text-red-500'>{imagesError}</p>}
              {existingImageUrls.length + mediaData.newProductImages.length < MAX_IMAGES ? (
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
                    {mediaData.newProductImages.length > 0 ? 'Thêm ảnh khác' : 'Kéo thả hoặc click để tải ảnh lên'}
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
                    {mediaData.newProductImages.length > 0 ? 'Thêm ảnh' : 'Chọn ảnh'}
                  </Button>
                </div>
              ) : (
                <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                  <p className='text-sm text-amber-600'>
                    Đã đạt giới hạn tối đa {MAX_IMAGES} hình ảnh. Vui lòng xóa ảnh cũ để thêm ảnh mới.
                  </p>
                </div>
              )}

              {mediaData.newProductImages.length > 0 && (
                <div className='mt-4 grid grid-cols-4 gap-2'>
                  {mediaData.newProductImages.map((file, index) => (
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
                  {(fetchedProduct?.productVideo && !mediaData.removeExistingVideo) || mediaData.newProductVideo
                    ? '1 / 1 video'
                    : '0 / 1 video'}
                </span>
              </div>
              <div className='mt-2 space-y-2'>
                {fetchedProduct?.productVideo && !mediaData.removeExistingVideo && (
                  <div className='space-y-2'>
                    <div className='relative group'>
                      <div className='aspect-video rounded-lg overflow-hidden border-2 border-gray-200'>
                        <video
                          src={fetchedProduct.productVideo}
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
                        onClick={() => setMediaData((prev) => ({ ...prev, removeExistingVideo: true }))}
                        className='absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </div>
                    <div className='flex items-center justify-between p-2 bg-gray-50 rounded-lg border'>
                      <div className='flex items-center gap-2'>
                        <Video className='w-4 h-4 text-gray-500' />
                        <span className='text-xs text-gray-600 truncate max-w-md'>{fetchedProduct.productVideo}</span>
                      </div>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => setMediaData((prev) => ({ ...prev, removeExistingVideo: true }))}
                      >
                        Xóa video
                      </Button>
                    </div>
                  </div>
                )}

                {(!fetchedProduct?.productVideo || mediaData.removeExistingVideo) && (
                  <div
                    className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer'
                    onClick={() => document.getElementById('product-video')?.click()}
                  >
                    <Video className='w-10 h-10 text-gray-400 mx-auto mb-3' />
                    <p className='text-gray-600 mb-2'>
                      {mediaData.newProductVideo ? 'Thay đổi video' : 'Kéo thả hoặc click để tải video lên'}
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
                          setMediaData((prev) => ({
                            ...prev,
                            newProductVideo: file,
                            removeExistingVideo: false
                          }))
                        }
                        e.target.value = ''
                      }}
                    />
                    <Button type='button' variant='outline' size='sm' className='mt-3'>
                      <Upload className='w-4 h-4 mr-2' />
                      {mediaData.newProductVideo ? 'Thay đổi video' : 'Chọn video'}
                    </Button>
                  </div>
                )}

                {mediaData.newProductVideo && (
                  <div className='relative group'>
                    <div className='aspect-video rounded-lg overflow-hidden border-2 border-gray-200'>
                      <video src={createPreviewUrl(mediaData.newProductVideo)} controls className='w-full h-full' />
                    </div>
                    <button
                      type='button'
                      onClick={() => {
                        setMediaData((prev) => ({
                          ...prev,
                          newProductVideo: null,
                          removeExistingVideo: true
                        }))
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
