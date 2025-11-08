import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { productApi, type ProductCreateFormData } from '../../../apis/product.api'
import { storeApi } from '../../../apis/store.api'
import { getAllProductCategory, type ProductCategoryItem } from '../../../apis/productCategory.api'
import { useAuth } from '../../../contexts/auth.context'
import { Upload, ChevronRight, Trash2, Video, Image as ImageIcon, Package, FileImage, Loader2, X } from 'lucide-react'
import { toast } from '../../../utils/toast'

function CreateProduct() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [provinceId, setProvinceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<ProductCategoryItem[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  // Validation constants
  const MAX_NAME_WORDS = 20
  const MAX_DESCRIPTION_WORDS = 500
  const MAX_MATERIAL_WORDS = 10

  // Error states
  const [nameError, setNameError] = useState('')
  const [descriptionError, setDescriptionError] = useState('')
  const [materialError, setMaterialError] = useState('')

  const [productData, setProductData] = useState({
    name: '',
    description: '',
    categoryId: null as string | null,
    material: ''
  })

  const [mediaData, setMediaData] = useState({
    productImages: [] as File[],
    productVideo: null as File | null,
    certificateImages: [] as File[]
  })
  const createPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file)
  }

  const countWords = (text: string): number => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }
  // Helper function to validate image file
  const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type - only allow image types
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validImageTypes.includes(file.type.toLowerCase())) {
      return {
        valid: false,
        error: `File "${file.name}" không phải là file ảnh hợp lệ. Chỉ chấp nhận PNG, JPG, JPEG, WEBP, GIF.`
      }
    }

    const maxSizeInBytes = 5 * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2)
      return {
        valid: false,
        error: `File "${file.name}" có kích thước ${fileSizeInMB}MB, vượt quá giới hạn 5MB.`
      }
    }

    return { valid: true }
  }

  // Helper function to validate video file
  const validateVideoFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type - only allow video types
    const validVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm']
    if (!validVideoTypes.includes(file.type.toLowerCase())) {
      return {
        valid: false,
        error: `File "${file.name}" không phải là file video hợp lệ. Chỉ chấp nhận MP4, MOV, AVI, WEBM.`
      }
    }

    // Check file size - max 50MB
    const maxSizeInBytes = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSizeInBytes) {
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2)
      return {
        valid: false,
        error: `File "${file.name}" có kích thước ${fileSizeInMB}MB, vượt quá giới hạn 50MB.`
      }
    }

    return { valid: true }
  }

  // Helper function to remove image from array
  const removeProductImage = (indexToRemove: number) => {
    setMediaData((prev) => ({
      ...prev,
      productImages: prev.productImages.filter((_, index) => index !== indexToRemove)
    }))
  }

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setProductData((prev) => ({
      ...prev,
      [field]: value
    }))

    // Real-time validation
    if (typeof value === 'string') {
      if (field === 'name') {
        const wordCount = countWords(value)
        if (wordCount > MAX_NAME_WORDS) {
          setNameError(`Tên sản phẩm không được vượt quá ${MAX_NAME_WORDS} từ (hiện tại: ${wordCount} từ)`)
        } else {
          setNameError('')
        }
      } else if (field === 'description') {
        const wordCount = countWords(value)
        if (wordCount > MAX_DESCRIPTION_WORDS) {
          setDescriptionError(`Mô tả không được vượt quá ${MAX_DESCRIPTION_WORDS} từ (hiện tại: ${wordCount} từ)`)
        } else {
          setDescriptionError('')
        }
      } else if (field === 'material') {
        const wordCount = countWords(value)
        if (wordCount > MAX_MATERIAL_WORDS) {
          setMaterialError(`Xuất xứ không được vượt quá ${MAX_MATERIAL_WORDS} từ (hiện tại: ${wordCount} từ)`)
        } else {
          setMaterialError('')
        }
      }
    }
  }

  const handleCategorySelect = (categoryId: string) => {
    setProductData((prev) => ({
      ...prev,
      categoryId: prev.categoryId === categoryId ? null : categoryId
    }))
  }

  // Helper function to add more images to existing array with validation
  const addProductImages = (newFiles: File[]) => {
    const validFiles: File[] = []
    const errors: string[] = []

    newFiles.forEach((file) => {
      const validation = validateImageFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        errors.push(validation.error || 'File không hợp lệ')
      }
    })

    // Show errors if any
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error))
    }

    // Only add valid files
    if (validFiles.length > 0) {
      setMediaData((prev) => ({
        ...prev,
        productImages: [...prev.productImages, ...validFiles]
      }))
      if (validFiles.length < newFiles.length) {
        toast.warning(`Đã thêm ${validFiles.length}/${newFiles.length} ảnh hợp lệ.`)
      }
    }
  }

  // Helper function to add more certificate images with validation
  const addCertificateImages = (newFiles: File[]) => {
    const validFiles: File[] = []
    const errors: string[] = []

    newFiles.forEach((file) => {
      const validation = validateImageFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        errors.push(validation.error || 'File không hợp lệ')
      }
    })

    // Show errors if any
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error))
    }

    // Only add valid files
    if (validFiles.length > 0) {
      setMediaData((prev) => ({
        ...prev,
        certificateImages: [...prev.certificateImages, ...validFiles]
      }))
      if (validFiles.length < newFiles.length) {
        toast.warning(`Đã thêm ${validFiles.length}/${newFiles.length} ảnh hợp lệ.`)
      }
    }
  }

  const handleMediaChange = (field: string, value: File | File[] | null) => {
    if (field === 'productImages' && Array.isArray(value)) {
      // Add new images to existing array instead of replacing
      addProductImages(value)
    } else if (field === 'certificateImages' && Array.isArray(value)) {
      // Add new certificate images to existing array
      addCertificateImages(value)
    } else if (field === 'productVideo' && value instanceof File) {
      // Validate video file before setting
      const validation = validateVideoFile(value)
      if (validation.valid) {
        setMediaData((prev) => ({
          ...prev,
          [field]: value
        }))
      } else {
        toast.error(validation.error || 'Video không hợp lệ')
      }
    } else {
      setMediaData((prev) => ({
        ...prev,
        [field]: value
      }))
    }
  }
  const handleCancel = () => {
    navigate('../product-management')
  }

  // Fetch store ID from authenticated user
  const fetchStoreId = useCallback(async () => {
    try {
      if (!user?.userId) {
        setError('Không tìm thấy thông tin người dùng')
        return null
      }

      const response = await storeApi.getStoreBySellerId(user.userId)
      console.log('response getStoreBySellerId', response)
      if (response.status === 200 && response.data) {
        setStoreId(response.data.id)
        setProvinceId(response.data.provinceId.toString())
        return response.data.id
      } else {
        setError('Không tìm thấy thông tin cửa hàng')
        return null
      }
    } catch (err) {
      console.error('Error fetching store ID:', err)
      setError('Có lỗi xảy ra khi tải thông tin cửa hàng')
      return null
    }
  }, [user?.userId])

  // Fetch product categories
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true)

      const response = await getAllProductCategory({ pageSize: 100, pageNumber: 1 })
      if (response.status === 200 && response.data) {
        // Filter only active categories
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

  // Load store ID and categories on component mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true)

      // Fetch store ID and categories in parallel
      const [fetchedStoreId] = await Promise.all([fetchStoreId(), fetchCategories()])

      if (fetchedStoreId) {
        setError(null)
      }
      setLoading(false)
    }

    initializeData()
  }, [user?.userId, fetchStoreId])

  const handleCreateProduct = async () => {
    setIsSubmitting(true)

    // Validation before submit
    let hasError = false

    // Validate name
    if (!productData.name.trim()) {
      setNameError('Tên sản phẩm không được để trống')
      hasError = true
    } else {
      const nameWordCount = countWords(productData.name)
      if (nameWordCount > MAX_NAME_WORDS) {
        setNameError(`Tên sản phẩm không được vượt quá ${MAX_NAME_WORDS} từ (hiện tại: ${nameWordCount} từ)`)
        hasError = true
      } else if (nameWordCount < 1) {
        setNameError('Tên sản phẩm phải có ít nhất 1 từ')
        hasError = true
      }
    }

    // Validate description
    if (productData.description.trim()) {
      const descriptionWordCount = countWords(productData.description)
      if (descriptionWordCount > MAX_DESCRIPTION_WORDS) {
        setDescriptionError(
          `Mô tả không được vượt quá ${MAX_DESCRIPTION_WORDS} từ (hiện tại: ${descriptionWordCount} từ)`
        )
        hasError = true
      }
    }

    // Validate material
    if (!productData.material.trim()) {
      setMaterialError('Xuất xứ không được để trống')
      hasError = true
    } else {
      const materialWordCount = countWords(productData.material)
      if (materialWordCount > MAX_MATERIAL_WORDS) {
        setMaterialError(`Xuất xứ không được vượt quá ${MAX_MATERIAL_WORDS} từ (hiện tại: ${materialWordCount} từ)`)
        hasError = true
      } else if (materialWordCount < 1) {
        setMaterialError('Xuất xứ phải có ít nhất 1 từ')
        hasError = true
      }
    }

    if (hasError) {
      setIsSubmitting(false)
      toast.error('Vui lòng kiểm tra lại thông tin')
      return
    }

    try {
      // Check if storeId and provinceId are available
      if (!storeId || !provinceId) {
        toast.error('Không tìm thấy thông tin cửa hàng. Vui lòng thử lại.')
        return
      }

      // Validate required fields
      if (!productData.name.trim()) {
        toast.error('Vui lòng nhập tên sản phẩm')
        return
      }

      if (!productData.description.trim()) {
        toast.error('Vui lòng nhập mô tả chi tiết')
        return
      }

      if (!productData.material.trim()) {
        toast.error('Vui lòng nhập xuất xứ / material')
        return
      }

      // Validate product images - required and at least 1 image
      if (!mediaData.productImages || mediaData.productImages.length === 0) {
        toast.error('Vui lòng thêm ít nhất một hình ảnh sản phẩm')
        return
      }

      // Validate each image file before submit (double check)
      const imageValidationErrors: string[] = []
      mediaData.productImages.forEach((file) => {
        const validation = validateImageFile(file)
        if (!validation.valid && validation.error) {
          imageValidationErrors.push(validation.error)
        }
      })

      if (imageValidationErrors.length > 0) {
        imageValidationErrors.forEach((error) => toast.error(error))
        return
      }

      // Validate video if provided
      if (mediaData.productVideo) {
        const videoValidation = validateVideoFile(mediaData.productVideo)
        if (!videoValidation.valid) {
          toast.error(videoValidation.error || 'Video không hợp lệ')
          return
        }
      }

      // Validation: Chỉ validate các trường bắt buộc theo API
      // Description, ProductImages, ProductVideo không bắt buộc theo API spec
      // Nhưng có thể giữ validation cho UX tốt hơn

      // Prepare form data theo cấu trúc API yêu cầu
      const formData: ProductCreateFormData = {
        storeId: storeId,
        // productType: 'ProductMaster', // Tạo Product Master (Gốc Hiển thị Cấp 1)
        parentId: null, // ProductMaster không có parent, phải là null
        name: productData.name,
        categoryId: productData.categoryId || undefined, // Chỉ gửi nếu có chọn category
        provinceId: provinceId ? parseInt(provinceId) : 0, // Convert sang number, mặc định 0 nếu không có
        description: productData.description || undefined, // Không bắt buộc
        material: productData.material.trim(), // Luôn gửi material (đã validate không rỗng ở trên)
        productImages: mediaData.productImages.length > 0 ? mediaData.productImages : undefined, // Không bắt buộc
        productVideo: mediaData.productVideo || undefined // Không bắt buộc
      }
      // Call API với FormData
      const response = await productApi.createMaster(formData)

      // Hiển thị thông tin response theo format mẫu
      if (response.data) {
        const productData = response.data
        console.log('Product Response Data:', {
          id: productData.id,
          name: productData.name,
          status: productData.status,
          productImages: productData.productImages,
          productVideo: productData.productVideo
        })
      }

      // Show success message
      toast.success('Tạo sản phẩm thành công!')

      // Navigate back to product management
      navigate('../product-management')
    } catch (error: unknown) {
      console.error('Error creating product:', error)

      // Extract error message from backend response
      let errorMessage = 'Có lỗi xảy ra khi tạo sản phẩm'

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
  if (loading) {
    return (
      <div className='p-6'>
        <div className='flex justify-center items-center h-64'>
          <div className='text-lg'>Đang tải thông tin cửa hàng...</div>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className='p-6'>
        <div className='flex justify-center items-center h-64'>
          <div className='text-red-600'>{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Breadcrumb */}
      <div className='flex items-center space-x-2 text-sm text-gray-600 mb-4'>
        <span
          className='text-gray-600 hover:text-gray-900 cursor-pointer'
          onClick={() => navigate('../product-management')}
        >
          Quản lý sản phẩm
        </span>
        <ChevronRight className='w-4 h-4' />
        <span className='text-gray-900 font-medium'>Tạo sản phẩm mới nha</span>
      </div>

      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-semibold text-gray-900'>Tạo sản phẩm mới</h1>
        <p className='text-gray-600 mt-1'>Thêm sản phẩm mới vào cửa hàng của bạn</p>
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column - Main Content */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Basic Information */}
          <Card className='border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <CardHeader className='bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100'>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <Package className='w-5 h-5' />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <Label htmlFor='name' className='text-sm font-medium'>
                  Tên sản phẩm <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='name'
                  placeholder='Nhập tên sản phẩm...'
                  value={productData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`mt-1 transition-all duration-200 ${nameError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500 focus:border-green-500'}`}
                />
                <div className='flex justify-between items-center mt-1'>
                  {nameError && <p className='text-red-500 text-xs'>{nameError}</p>}
                  <p
                    className={`text-xs ${countWords(productData.name) > MAX_NAME_WORDS ? 'text-red-500' : 'text-gray-500'}`}
                  >
                    {countWords(productData.name)}/{MAX_NAME_WORDS} từ
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor='description' className='text-sm font-medium'>
                  Mô tả chi tiết <span className='text-red-500'>*</span>
                </Label>
                <Textarea
                  id='description'
                  placeholder='Mô tả chi tiết về sản phẩm của bạn...'
                  value={productData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`mt-1 min-h-[120px] transition-all duration-200 ${descriptionError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500 focus:border-green-500'}`}
                />
                <div className='flex justify-between items-center mt-1'>
                  {descriptionError && <p className='text-red-500 text-xs'>{descriptionError}</p>}
                  <p
                    className={`text-xs ${countWords(productData.description) > MAX_DESCRIPTION_WORDS ? 'text-red-500' : 'text-gray-500'}`}
                  >
                    {countWords(productData.description)}/{MAX_DESCRIPTION_WORDS} từ
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor='material' className='text-sm font-medium'>
                  Xuất xứ / Material <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='material'
                  placeholder='Nhập xuất xứ hoặc nguyên liệu sản phẩm...'
                  value={productData.material}
                  onChange={(e) => handleInputChange('material', e.target.value)}
                  className={`mt-1 transition-all duration-200 ${materialError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500 focus:border-green-500'}`}
                />
                <div className='flex justify-between items-center mt-1'>
                  {materialError && <p className='text-red-500 text-xs'>{materialError}</p>}
                  <p
                    className={`text-xs ${countWords(productData.material) > MAX_MATERIAL_WORDS ? 'text-red-500' : 'text-gray-500'}`}
                  >
                    {countWords(productData.material)}/{MAX_MATERIAL_WORDS} từ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media Section */}
          <Card className='border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <CardHeader className='bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100'>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <FileImage className='w-5 h-5' />
                Hình ảnh & Video
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Product Images */}
              <div>
                <Label className='text-sm font-medium'>
                  Hình ảnh sản phẩm <span className='text-red-500'>*</span>
                </Label>

                {/* Upload Area */}
                <div
                  className='mt-2 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 hover:bg-green-50 transition-all duration-200 cursor-pointer bg-gradient-to-br from-white to-gray-50'
                  onClick={() => document.getElementById('product-images')?.click()}
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
                    const files = Array.from(e.dataTransfer.files)
                    if (files.length > 0) {
                      addProductImages(files)
                    }
                  }}
                >
                  <ImageIcon className='w-10 h-10 text-gray-400 mx-auto mb-3' />
                  <p className='text-gray-600 mb-2'>
                    {mediaData.productImages.length > 0 ? 'Thêm ảnh khác' : 'Kéo thả hoặc click để tải ảnh lên'}
                  </p>
                  <p className='text-sm text-gray-500'>PNG, JPG tối đa 5MB mỗi ảnh</p>
                  <input
                    type='file'
                    multiple
                    accept='image/*'
                    className='hidden'
                    id='product-images'
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      if (files.length > 0) {
                        addProductImages(files)
                      }
                      // Reset input value to allow selecting same files again
                      e.target.value = ''
                    }}
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-300 hover:from-green-100 hover:to-emerald-100 text-green-700 hover:text-green-800 font-medium transition-all duration-200 shadow-sm hover:shadow-md'
                    onClick={(e) => {
                      e.stopPropagation()
                      document.getElementById('product-images')?.click()
                    }}
                  >
                    <Upload className='w-4 h-4 mr-2' />
                    {mediaData.productImages.length > 0 ? 'Thêm ảnh' : 'Chọn ảnh'}
                  </Button>
                </div>

                {/* Image Preview Grid */}
                {mediaData.productImages.length > 0 && (
                  <div className='mt-6'>
                    <div className='flex items-center justify-between mb-4'>
                      <p className='text-sm font-medium text-gray-700'>Đã chọn {mediaData.productImages.length} ảnh</p>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => setMediaData((prev) => ({ ...prev, productImages: [] }))}
                        className='text-red-600 hover:text-red-700 hover:bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 hover:border-red-300 font-medium transition-all duration-200 shadow-sm hover:shadow-md'
                      >
                        <Trash2 className='w-4 h-4 mr-1' />
                        Xóa tất cả
                      </Button>
                    </div>

                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
                      {mediaData.productImages.map((file, index) => (
                        <div key={`${file.name}-${index}`} className='relative group'>
                          <div className='aspect-square rounded-xl overflow-hidden border-2 border-gray-200 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-md group'>
                            <img
                              src={createPreviewUrl(file)}
                              alt={`Product ${index + 1}`}
                              className='w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-300 group-hover:brightness-105'
                              onClick={() => {
                                const newWindow = window.open()
                                if (newWindow) {
                                  newWindow.document.write(`
                                        <html>
                                          <head><title>${file.name}</title></head>
                                          <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000;">
                                            <img src="${createPreviewUrl(file)}" style="max-width:100%;max-height:100vh;object-fit:contain;" />
                                          </body>
                                        </html>
                                      `)
                                }
                              }}
                            />
                          </div>

                          {/* Remove button */}
                          <button
                            type='button'
                            onClick={() => removeProductImage(index)}
                            className='absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110'
                            title='Xóa ảnh này'
                          >
                            <X className='w-4 h-4' />
                          </button>

                          {/* Image index */}
                          <div className='absolute top-2 left-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md'>
                            #{index + 1}
                          </div>

                          {/* File info */}
                          <div className='mt-2 p-2 bg-gray-50 rounded-lg'>
                            {/* File name */}
                            <p className='text-xs text-gray-600 font-medium truncate' title={file.name}>
                              📷 {file.name}
                            </p>
                            {/* File size */}
                            <p className='text-xs text-gray-500 mt-1'>💾 {(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Product Video */}
              <div>
                <Label className='text-sm font-medium'>
                  Video sản phẩm <span className='text-red-500'>*</span>
                </Label>
                <div
                  className='mt-2 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 hover:bg-green-50 transition-all duration-200 cursor-pointer bg-gradient-to-br from-white to-gray-50'
                  onClick={() => document.getElementById('product-video')?.click()}
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
                    const files = Array.from(e.dataTransfer.files)
                    if (files.length > 0) {
                      handleMediaChange('productVideo', files[0])
                    }
                  }}
                >
                  <Video className='w-10 h-10 text-gray-400 mx-auto mb-3' />
                  <p className='text-gray-600 mb-2'>
                    {mediaData.productVideo ? 'Thay đổi video' : 'Kéo thả hoặc click để tải video lên'}
                  </p>
                  <p className='text-sm text-gray-500'>MP4, MOV tối đa 50MB</p>
                  <input
                    type='file'
                    accept='video/*'
                    className='hidden'
                    id='product-video'
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      if (file) {
                        handleMediaChange('productVideo', file)
                      }
                      e.target.value = ''
                    }}
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 hover:border-blue-300 hover:from-blue-100 hover:to-indigo-100 text-blue-700 hover:text-blue-800 font-medium transition-all duration-200 shadow-sm hover:shadow-md'
                    onClick={(e) => {
                      e.stopPropagation()
                      document.getElementById('product-video')?.click()
                    }}
                  >
                    <Upload className='w-4 h-4 mr-2' />
                    {mediaData.productVideo ? 'Thay đổi video' : 'Chọn video'}
                  </Button>
                </div>

                {mediaData.productVideo && (
                  <div className='mt-6'>
                    <div className='flex items-center justify-between mb-4'>
                      <p className='text-sm font-medium text-gray-700'>Video đã chọn:</p>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => handleMediaChange('productVideo', null)}
                        className='text-red-600 hover:text-red-700 hover:bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 hover:border-red-300 font-medium transition-all duration-200 shadow-sm hover:shadow-md'
                      >
                        <Trash2 className='w-4 h-4 mr-1' />
                        Xóa video
                      </Button>
                    </div>

                    <div className='relative group max-w-2xl'>
                      <div className='aspect-video rounded-xl overflow-hidden border-2 border-gray-200 bg-black shadow-lg group-hover:shadow-xl transition-all duration-300'>
                        <video
                          src={createPreviewUrl(mediaData.productVideo)}
                          controls
                          className='w-full h-full object-contain group-hover:brightness-105 transition-all duration-300'
                          preload='metadata'
                        />
                      </div>

                      <div className='mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm'>
                        <p
                          className='text-sm font-semibold text-gray-800 truncate mb-2'
                          title={mediaData.productVideo.name}
                        >
                          🎬 {mediaData.productVideo.name}
                        </p>
                        <div className='flex items-center gap-4 text-xs text-gray-600'>
                          <span className='flex items-center gap-1'>
                            💾 Kích thước: {(mediaData.productVideo.size / (1024 * 1024)).toFixed(1)} MB
                          </span>
                          <span className='flex items-center gap-1'>⏱️ Thời lượng: Video</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className='space-y-6'>
          {/* Category */}
          <Card className='border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <CardHeader className='bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100'>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <Package className='w-5 h-5' />
                Phân loại
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor='category' className='text-sm font-medium'>
                  Danh mục sản phẩm <span className='text-red-500'>*</span>
                </Label>

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
                  <div className='mt-1 space-y-2 max-h-60 overflow-y-auto border-2 border-gray-200 rounded-xl p-4 bg-gradient-to-br from-white to-gray-50'>
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                          productData.categoryId === category.id
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 shadow-sm'
                            : 'hover:bg-gray-50 border-2 border-transparent hover:border-gray-300 hover:shadow-sm'
                        }`}
                        onClick={() => handleCategorySelect(category.id)}
                      >
                        <div className='flex items-center'>
                          <input
                            type='radio'
                            name='category'
                            checked={productData.categoryId === category.id}
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

                {/* Show selected category */}
                {productData.categoryId && (
                  <div className='mt-3'>
                    <p className='text-sm font-medium text-gray-700 mb-2'>Danh mục đã chọn:</p>
                    <div className='flex items-center gap-2'>
                      {(() => {
                        const category = categories.find((cat) => cat.id === productData.categoryId)
                        return category ? (
                          <div className='inline-flex items-center px-3 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-sm font-medium rounded-full border border-green-200 shadow-sm'>
                            <span className='font-semibold'>{category.name}</span>
                            <button
                              type='button'
                              onClick={() => handleCategorySelect(productData.categoryId!)}
                              className='ml-2 text-green-600 hover:text-green-800 hover:bg-green-200 rounded-full p-1 transition-all duration-150'
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex justify-start gap-4 mt-8'>
        <Button
          variant='outline'
          onClick={handleCancel}
          className='px-6 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200'
          disabled={isSubmitting}
        >
          Hủy bỏ
        </Button>
        <Button
          className='bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'
          onClick={handleCreateProduct}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              Đang tạo...
            </>
          ) : (
            'Tạo sản phẩm'
          )}
        </Button>
      </div>
    </div>
  )
}

export default CreateProduct
