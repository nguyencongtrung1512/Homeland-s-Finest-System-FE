import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { productApi, type ProductCreateFormData } from '../../../apis/product.api'
import { storeApi } from '../../../apis/store.api'
import { getAllProductCategory, type ProductCategoryItem } from '../../../apis/productCategory.api'
import { useAuth } from '../../../contexts/auth.context'
import {
  Upload,
  BookOpen,
  Shield,
  Info,
  ChevronRight,
  Plus,
  Trash2,
  Video,
  Image as ImageIcon,
  Package,
  FileImage,
  DollarSign,
  Archive,
  Loader2,
  X
} from 'lucide-react'
import { toast } from 'react-toastify'

function CreateProduct() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('product-info')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<ProductCategoryItem[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  const [productData, setProductData] = useState({
    name: '',
    description: '',
    categories: [] as string[],
    region: '',
    story: ''
  })

  const [mediaData, setMediaData] = useState({
    productImages: [] as File[],
    productVideo: null as File | null,
    certificateImages: [] as File[]
  })

  const [storyData, setStoryData] = useState({
    mainTitle: '',
    storyDetail: '',
    storyImage: null as File | null,
    storyVideo: null as File | null
  })

  const [productVariants, setProductVariants] = useState([
    {
      id: 1,
      name: '',
      price: 0,
      stock: 0,
      unit: '',
      weight: '',
      dimensions: ''
    }
  ])

  // State for managing variant form visibility
  const [showVariantForm, setShowVariantForm] = useState(false)
  const [editingVariant, setEditingVariant] = useState<number | null>(null)
  const [newVariant, setNewVariant] = useState({
    name: '',
    price: 0,
    stock: 0,
    unit: '',
    weight: '',
    dimensions: ''
  })

  // Helper function to create preview URL
  const createPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file)
  }

  // Helper function to remove image from array
  const removeProductImage = (indexToRemove: number) => {
    setMediaData((prev) => ({
      ...prev,
      productImages: prev.productImages.filter((_, index) => index !== indexToRemove)
    }))
  }

  // Helper function to remove certificate image from array
  const removeCertificateImage = (indexToRemove: number) => {
    setMediaData((prev) => ({
      ...prev,
      certificateImages: prev.certificateImages.filter((_, index) => index !== indexToRemove)
    }))
  }

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setProductData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCategoryToggle = (categoryId: string) => {
    setProductData((prev) => {
      const categories = prev.categories.includes(categoryId)
        ? prev.categories.filter((id) => id !== categoryId)
        : [...prev.categories, categoryId]
      return { ...prev, categories }
    })
  }

  const handleStoryInputChange = (field: string, value: string) => {
    setStoryData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  // Helper function to add more images to existing array
  const addProductImages = (newFiles: File[]) => {
    setMediaData((prev) => ({
      ...prev,
      productImages: [...prev.productImages, ...newFiles]
    }))
  }

  // Helper function to add more certificate images
  const addCertificateImages = (newFiles: File[]) => {
    setMediaData((prev) => ({
      ...prev,
      certificateImages: [...prev.certificateImages, ...newFiles]
    }))
  }

  const handleStoryMediaChange = (field: string, value: File | File[] | null) => {
    setStoryData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleMediaChange = (field: string, value: File | File[] | null) => {
    if (field === 'productImages' && Array.isArray(value)) {
      // Add new images to existing array instead of replacing
      addProductImages(value)
    } else if (field === 'certificateImages' && Array.isArray(value)) {
      // Add new certificate images to existing array
      addCertificateImages(value)
    } else {
      setMediaData((prev) => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleVariantChange = (variantId: number, field: string, value: string | number) => {
    setProductVariants((prev) =>
      prev.map((variant) => (variant.id === variantId ? { ...variant, [field]: value } : variant))
    )
  }

  const addVariant = () => {
    const newId = Math.max(...productVariants.map((v) => v.id)) + 1
    setProductVariants((prev) => [
      ...prev,
      {
        id: newId,
        name: '',
        price: 0,
        stock: 0,
        unit: '',
        weight: '',
        dimensions: ''
      }
    ])
  }

  const removeVariant = (variantId: number) => {
    if (productVariants.length > 1) {
      setProductVariants((prev) => prev.filter((variant) => variant.id !== variantId))
    }
  }

  // New functions for variant form management
  const handleAddVariantClick = () => {
    setNewVariant({
      name: '',
      price: 0,
      stock: 0,
      unit: '',
      weight: '',
      dimensions: ''
    })
    setEditingVariant(null)
    setShowVariantForm(true)
  }

  const handleEditVariant = (variantId: number) => {
    const variant = productVariants.find((v) => v.id === variantId)
    if (variant) {
      setNewVariant({
        name: variant.name,
        price: variant.price,
        stock: variant.stock,
        unit: variant.unit,
        weight: variant.weight,
        dimensions: variant.dimensions
      })
      setEditingVariant(variantId)
      setShowVariantForm(true)
    }
  }

  const handleSaveVariant = () => {
    if (!newVariant.name.trim()) {
      alert('Vui lòng nhập tên loại sản phẩm')
      return
    }
    if (newVariant.price <= 0) {
      alert('Vui lòng nhập giá bán hợp lệ')
      return
    }
    if (newVariant.stock < 0) {
      alert('Vui lòng nhập số lượng tồn kho hợp lệ')
      return
    }

    if (editingVariant) {
      // Update existing variant
      setProductVariants((prev) => prev.map((v) => (v.id === editingVariant ? { ...v, ...newVariant } : v)))
    } else {
      // Add new variant
      const newId = Math.max(...productVariants.map((v) => v.id)) + 1
      setProductVariants((prev) => [...prev, { id: newId, ...newVariant }])
    }

    // Reset form
    setNewVariant({
      name: '',
      price: 0,
      stock: 0,
      unit: '',
      weight: '',
      dimensions: ''
    })
    setEditingVariant(null)
    setShowVariantForm(false)
  }

  const handleCancelVariant = () => {
    setNewVariant({
      name: '',
      price: 0,
      stock: 0,
      unit: '',
      weight: '',
      dimensions: ''
    })
    setEditingVariant(null)
    setShowVariantForm(false)
  }

  const handleNewVariantChange = (field: string, value: string | number) => {
    setNewVariant((prev) => ({ ...prev, [field]: value }))
  }

  const handleCancel = () => {
    navigate('../product-management')
  }

  // Fetch store ID from authenticated user
  const fetchStoreId = async () => {
    try {
      if (!user?.userId) {
        setError('Không tìm thấy thông tin người dùng')
        return null
      }

      const response = await storeApi.getStoreBySellerId(user.userId)
      console.log('response getStoreBySellerId', response)
      if (response.status === 200 && response.data) {
        setStoreId(response.data.id)
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
  }

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
    } catch (err) {
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
  }, [user?.userId])

  const handleCreateProduct = async () => {
    try {
      setIsSubmitting(true)

      // Check if storeId is available
      if (!storeId) {
        toast.error('Không tìm thấy thông tin cửa hàng. Vui lòng thử lại.')
        return
      }

      // Validate required fields
      if (!productData.name.trim()) {
        toast.error('Vui lòng nhập tên sản phẩm')
        return
      }

      if (!productData.description.trim()) {
        toast.error('Vui lòng nhập mô tả sản phẩm')
        return
      }

      // Thêm validation cho categories
      if (productData.categories.length === 0) {
        toast.error('Vui lòng chọn ít nhất một danh mục sản phẩm')
        return
      }

  
      if (mediaData.productImages.length === 0) {
        toast.error('Vui lòng chọn ít nhất một hình ảnh sản phẩm')
        return
      }

      if (!mediaData.productVideo) {
        toast.error('Vui lòng chọn video sản phẩm')
        return
      }

      // Prepare story images array
      const storyImages: File[] = []
      if (storyData.storyImage) {
        storyImages.push(storyData.storyImage)
      }

      // Prepare form data theo cấu trúc mới
      const formData: ProductCreateFormData = {
        storeId: storeId,
        provinceId: '1', // Default province ID, có thể làm dynamic
        name: productData.name,
        description: productData.description,
        categoryIds: productData.categories, // Sửa từ productData.category thành productData.categories
        madeBy: productData.region || 'Việt Nam',
        typeProduct: 'nông sản', // Default type, có thể làm dynamic
        note: productData.story,
        storyTitle: storyData.mainTitle,
        storyDetail: storyData.storyDetail || '',
        productImages: mediaData.productImages,
        productVideo: mediaData.productVideo,
        certificateImages: mediaData.certificateImages,
        storyVideo: storyData.storyVideo || undefined,
        storyImages: storyImages.length > 0 ? storyImages : undefined
      }
      // Call API với FormData
      const response = await productApi.create(formData)


      // Hiển thị thông tin response theo format mẫu
      if (response.data) {
        const productData = response.data
        console.log('Product Response Data:', {
          id: productData.id,
          name: productData.name,
          status: productData.status,
          createdAt: productData.createdAt,
          productImages: productData.productImages,
          productVideo: productData.productVideo,
          certificates: productData.certificates || [],
          storyId: productData.storyId,
          storyTitle: productData.storyTitle,
          contentCount: productData.contentCount || 0
        })
      }

      // Show success message
      toast.success('Tạo sản phẩm thành công!')

      // Navigate back to product management
      navigate('../product-management')
    } catch (error: any) {
      console.error('Error creating product:', error)

      // Show error message
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tạo sản phẩm'
      alert(`Lỗi: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state while fetching store ID
  if (loading) {
    return (
      <div className='p-6'>
        <div className='flex justify-center items-center h-64'>
          <div className='text-lg'>Đang tải thông tin cửa hàng...</div>
        </div>
      </div>
    )
  }

  // Show error state if can't fetch store ID
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
        <span className='text-gray-900 font-medium'>Tạo sản phẩm mới</span>
      </div>

      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-semibold text-gray-900'>Tạo sản phẩm mới</h1>
        <p className='text-gray-600 mt-1'>Thêm sản phẩm mới vào cửa hàng của bạn</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-2 mb-6'>
          <TabsTrigger value='product-info' className='flex items-center gap-2'>
            <Package className='w-4 h-4' />
            Thông tin sản phẩm
          </TabsTrigger>
          <TabsTrigger value='variants' className='flex items-center gap-2'>
            <Archive className='w-4 h-4' />
            Loại sản phẩm
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Product Information (Combined) */}
        <TabsContent value='product-info'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Left Column - Main Content */}
            <div className='lg:col-span-2 space-y-6'>
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-green-700'>Thông tin cơ bản</CardTitle>
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
                      className='mt-1'
                    />
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
                      className='mt-1 min-h-[120px]'
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Media Section */}
              <Card>
                <CardHeader>
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
                      className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer'
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
                        className='mt-3'
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
                          <p className='text-sm font-medium text-gray-700'>
                            Đã chọn {mediaData.productImages.length} ảnh
                          </p>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => setMediaData((prev) => ({ ...prev, productImages: [] }))}
                            className='text-red-600 hover:text-red-700 hover:bg-red-50'
                          >
                            <Trash2 className='w-4 h-4 mr-1' />
                            Xóa tất cả
                          </Button>
                        </div>

                        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
                          {mediaData.productImages.map((file, index) => (
                            <div key={`${file.name}-${index}`} className='relative group'>
                              <div className='aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-colors'>
                                <img
                                  src={createPreviewUrl(file)}
                                  alt={`Product ${index + 1}`}
                                  className='w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform'
                                  onClick={() => {
                                    // Open image in new tab for full view
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
                                className='absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg'
                                title='Xóa ảnh này'
                              >
                                <X className='w-3 h-3' />
                              </button>

                              {/* Image index */}
                              <div className='absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity'>
                                {index + 1}
                              </div>

                              {/* File name */}
                              <p className='text-xs text-gray-500 mt-2 truncate' title={file.name}>
                                {file.name}
                              </p>

                              {/* File size */}
                              <p className='text-xs text-gray-400'>{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
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
                      className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer'
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
                        const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('video/'))
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
                          handleMediaChange('productVideo', file)
                          e.target.value = ''
                        }}
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        className='mt-3'
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
                            className='text-red-600 hover:text-red-700 hover:bg-red-50'
                          >
                            <Trash2 className='w-4 h-4 mr-1' />
                            Xóa video
                          </Button>
                        </div>

                        <div className='relative group max-w-2xl'>
                          <div className='aspect-video rounded-lg overflow-hidden border-2 border-gray-200 bg-black'>
                            <video
                              src={createPreviewUrl(mediaData.productVideo)}
                              controls
                              className='w-full h-full object-contain'
                              preload='metadata'
                            />
                          </div>

                          <div className='mt-3 p-3 bg-gray-50 rounded-lg'>
                            <p
                              className='text-sm font-medium text-gray-700 truncate'
                              title={mediaData.productVideo.name}
                            >
                              📹 {mediaData.productVideo.name}
                            </p>
                            <p className='text-xs text-gray-500 mt-1'>
                              Kích thước: {(mediaData.productVideo.size / (1024 * 1024)).toFixed(1)} MB
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Story Section */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-green-700 flex items-center gap-2'>
                    <BookOpen className='w-5 h-5 text-green-600' />
                    Câu chuyện gắn kết
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-start gap-2'>
                    <Info className='w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0' />
                    <p className='text-sm text-gray-600'>Câu chuyện giúp khách hàng hiểu rõ hơn về giá trị sản phẩm</p>
                  </div>

                  <div>
                    <Label className='text-sm font-medium'>Tiêu đề chính</Label>
                    <Input
                      placeholder='Nông sản sạch Việt Nam'
                      value={storyData.mainTitle}
                      onChange={(e) => handleStoryInputChange('mainTitle', e.target.value)}
                      className='mt-1'
                    />
                  </div>

                  <div>
                    <Label className='text-sm font-medium'>Nội dung câu chuyện</Label>
                    <Textarea
                      placeholder='Chia sẻ câu chuyện về sản phẩm của bạn...'
                      value={storyData.storyDetail}
                      onChange={(e) => handleStoryInputChange('storyDetail', e.target.value)}
                      className='mt-1 min-h-[100px]'
                    />
                  </div>

                  {/* Story Images */}
                  <div>
                    <Label className='text-sm font-medium'>Hình ảnh câu chuyện</Label>
                    <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer'>
                      <ImageIcon className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                      <p className='text-gray-600 mb-2'>Tải ảnh minh họa cho câu chuyện</p>
                      <input
                        type='file'
                        accept='image/*'
                        className='hidden'
                        id='story-image'
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          handleStoryMediaChange('storyImage', file)
                        }}
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        className='mt-2'
                        onClick={() => document.getElementById('story-image')?.click()}
                      >
                        <Upload className='w-4 h-4 mr-2' />
                        Chọn ảnh
                      </Button>
                    </div>
                    {storyData.storyImage && (
                      <div className='mt-4'>
                        <p className='text-sm text-gray-600 mb-3'>Ảnh câu chuyện:</p>
                        <div className='relative group max-w-xs'>
                          <div className='aspect-video rounded-lg overflow-hidden border-2 border-gray-200'>
                            <img
                              src={createPreviewUrl(storyData.storyImage)}
                              alt='Story'
                              className='w-full h-full object-cover'
                            />
                          </div>
                          <button
                            type='button'
                            onClick={() => handleStoryMediaChange('storyImage', null)}
                            className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                          >
                            <X className='w-4 h-4' />
                          </button>
                          <p className='text-xs text-gray-500 mt-1 truncate'>{storyData.storyImage.name}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Story Video */}
                  <div>
                    <Label className='text-sm font-medium'>Video câu chuyện</Label>
                    <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer'>
                      <Video className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                      <p className='text-gray-600 mb-2'>Tải video minh họa cho câu chuyện</p>
                      <input
                        type='file'
                        accept='video/*'
                        className='hidden'
                        id='story-video'
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          handleStoryMediaChange('storyVideo', file)
                        }}
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        className='mt-2'
                        onClick={() => document.getElementById('story-video')?.click()}
                      >
                        <Upload className='w-4 h-4 mr-2' />
                        Chọn video
                      </Button>
                    </div>
                    {storyData.storyVideo && (
                      <div className='mt-4'>
                        <p className='text-sm text-gray-600 mb-3'>Video câu chuyện:</p>
                        <div className='relative group max-w-xs'>
                          <div className='aspect-video rounded-lg overflow-hidden border-2 border-gray-200 bg-black'>
                            <video
                              src={createPreviewUrl(storyData.storyVideo)}
                              controls
                              className='w-full h-full object-contain'
                            />
                          </div>
                          <button
                            type='button'
                            onClick={() => handleStoryMediaChange('storyVideo', null)}
                            className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                          >
                            <X className='w-4 h-4' />
                          </button>
                          <p className='text-xs text-gray-500 mt-1 truncate'>{storyData.storyVideo.name}</p>
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
              <Card>
                <CardHeader>
                  <CardTitle className='text-green-700'>Phân loại</CardTitle>
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
                      <div className='mt-1 space-y-2 max-h-60 overflow-y-auto border rounded-md p-3'>
                        {categories.map((category) => (
                          <div
                            key={category.id}
                            className={`flex items-start space-x-3 p-2 rounded-md cursor-pointer transition-colors ${productData.categories.includes(category.id)
                                ? 'bg-green-50 border border-green-200'
                                : 'hover:bg-gray-50 border border-transparent'
                              }`}
                            onClick={() => handleCategoryToggle(category.id)}
                          >
                            <div className='flex items-center'>
                              <input
                                type='checkbox'
                                checked={productData.categories.includes(category.id)}
                                onChange={() => handleCategoryToggle(category.id)}
                                className='w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500'
                              />
                            </div>
                            <div className='flex-1 min-w-0'>
                              <p className='text-sm font-medium text-gray-900'>{category.name}</p>
                              {category.description && (
                                <p className='text-xs text-gray-500 mt-1'>{category.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show selected categories */}
                    {productData.categories.length > 0 && (
                      <div className='mt-3'>
                        <p className='text-sm font-medium text-gray-700 mb-2'>
                          Đã chọn {productData.categories.length} danh mục:
                        </p>
                        <div className='flex flex-wrap gap-2'>
                          {productData.categories.map((categoryId) => {
                            const category = categories.find((cat) => cat.id === categoryId)
                            return category ? (
                              <div
                                key={categoryId}
                                className='inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-md'
                              >
                                <span>{category.name}</span>
                                <button
                                  type='button'
                                  onClick={() => handleCategoryToggle(categoryId)}
                                  className='ml-1 text-green-600 hover:text-green-800'
                                >
                                  <X className='w-3 h-3' />
                                </button>
                              </div>
                            ) : null
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Origin & Certification */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-green-700 flex items-center gap-2'>
                    <Shield className='w-5 h-5' />
                    Xuất xứ & Chứng nhận
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <Label htmlFor='region' className='text-sm font-medium'>
                      Vùng miền
                    </Label>
                    <Input
                      id='region'
                      placeholder='Ví dụ: Đồng bằng sông Cửu Long'
                      value={productData.region}
                      onChange={(e) => handleInputChange('region', e.target.value)}
                      className='mt-1'
                    />
                  </div>

                  <div>
                    <Label className='text-sm font-medium'>Hình ảnh chứng nhận</Label>
                    <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer'>
                      <Shield className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                      <p className='text-gray-600 text-sm mb-2'>Tải lên chứng nhận chất lượng</p>
                      <input
                        type='file'
                        multiple
                        accept='image/*'
                        className='hidden'
                        id='certificate-images'
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          handleMediaChange('certificateImages', files)
                        }}
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => document.getElementById('certificate-images')?.click()}
                      >
                        <Upload className='w-4 h-4 mr-2' />
                        Chọn ảnh
                      </Button>
                    </div>
                    {mediaData.certificateImages.length > 0 && (
                      <div className='mt-4'>
                        <p className='text-sm text-gray-600 mb-3'>Chứng nhận ({mediaData.certificateImages.length}):</p>
                        <div className='grid grid-cols-2 gap-3'>
                          {mediaData.certificateImages.map((file, index) => (
                            <div key={index} className='relative group'>
                              <div className='aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-colors'>
                                <img
                                  src={createPreviewUrl(file)}
                                  alt={`Certificate ${index + 1}`}
                                  className='w-full h-full object-cover'
                                />
                              </div>
                              <button
                                type='button'
                                onClick={() => removeCertificateImage(index)}
                                className='absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg'
                                title='Xóa chứng nhận này'
                              >
                                <X className='w-3 h-3' />
                              </button>
                              <div className='absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity'>
                                {index + 1}
                              </div>
                              <p className='text-xs text-gray-500 mt-1 truncate'>{file.name}</p>
                              <p className='text-xs text-gray-400'>{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Product Variants */}
        <TabsContent value='variants'>
          <Card>
            <CardHeader>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <Archive className='w-5 h-5' />
                Loại sản phẩm
              </CardTitle>
              <p className='text-sm text-gray-600'>Thêm các loại sản phẩm khác nhau với giá và thông tin riêng biệt</p>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                {productVariants.map((variant, index) => (
                  <div key={variant.id} className='border border-gray-200 rounded-lg p-6 bg-gray-50'>
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='text-lg font-medium text-gray-900'>Loại sản phẩm {index + 1}</h3>
                      {productVariants.length > 1 && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => removeVariant(variant.id)}
                          className='text-red-600 hover:text-red-700 hover:bg-red-50'
                        >
                          <Trash2 className='w-4 h-4 mr-1' />
                          Xóa
                        </Button>
                      )}
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                      {/* Tên loại sản phẩm */}
                      <div>
                        <Label className='text-sm font-medium p-2'>
                          Tên loại <span className='text-red-500'>*</span>
                        </Label>
                        <Input
                          placeholder='VD: Gạo tám xoan 5kg'
                          value={variant.name}
                          onChange={(e) => handleVariantChange(variant.id, 'name', e.target.value)}
                          className='mt-1'
                        />
                      </div>

                      {/* Giá */}
                      <div>
                        <Label className='text-sm font-medium p-2'>
                          Giá bán <span className='text-red-500'>*</span>
                        </Label>
                        <div className='relative '>
                          <DollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                          <Input
                            type='number'
                            placeholder='0'
                            value={variant.price || ''}
                            onChange={(e) => handleVariantChange(variant.id, 'price', parseFloat(e.target.value) || 0)}
                            className='pl-10 mt-3'
                            min='0'
                            step='1000'
                          />
                        </div>
                      </div>

                      {/* Số lượng tồn kho */}
                      <div>
                        <Label className='text-sm font-medium p-2'>
                          Số lượng tồn kho <span className='text-red-500'>*</span>
                        </Label>
                        <Input
                          type='number'
                          placeholder='0'
                          value={variant.stock || ''}
                          onChange={(e) => handleVariantChange(variant.id, 'stock', parseInt(e.target.value) || 0)}
                          className='mt-1'
                          min='0'
                        />
                      </div>

                      {/* Đơn vị */}
                      <div>
                        <Label className='text-sm font-medium p-2'>Đơn vị</Label>
                        <Select
                          value={variant.unit}
                          onValueChange={(value) => handleVariantChange(variant.id, 'unit', value)}
                        >
                          <SelectTrigger className='mt-1'>
                            <SelectValue placeholder='Chọn đơn vị' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='kg'>Kilogram (kg)</SelectItem>
                            <SelectItem value='g'>Gram (g)</SelectItem>
                            <SelectItem value='lít'>Lít</SelectItem>
                            <SelectItem value='ml'>Mililít (ml)</SelectItem>
                            <SelectItem value='cái'>Cái</SelectItem>
                            <SelectItem value='hộp'>Hộp</SelectItem>
                            <SelectItem value='túi'>Túi</SelectItem>
                            <SelectItem value='thùng'>Thùng</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Trọng lượng */}
                      <div>
                        <Label className='text-sm font-medium p-2'>Trọng lượng</Label>
                        <Input
                          placeholder='VD: 5kg, 500g'
                          value={variant.weight}
                          onChange={(e) => handleVariantChange(variant.id, 'weight', e.target.value)}
                          className='mt-1'
                        />
                      </div>

                      {/* Kích thước */}
                      <div>
                        <Label className='text-sm font-medium p-2'>Kích thước</Label>
                        <Input
                          placeholder='VD: 30x20x10 cm'
                          value={variant.dimensions}
                          onChange={(e) => handleVariantChange(variant.id, 'dimensions', e.target.value)}
                          className='mt-1'
                        />
                      </div>
                    </div>

                    {/* Preview card cho variant */}
                    <div className='mt-4 p-4 bg-white border border-gray-200 rounded-lg'>
                      <h4 className='text-sm font-medium text-gray-700 mb-2'>Xem trước:</h4>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='font-medium text-gray-900'>{variant.name || 'Tên sản phẩm chưa nhập'}</p>
                          <p className='text-sm text-gray-600'>
                            {variant.weight && `${variant.weight} • `}
                            {variant.unit && `Đơn vị: ${variant.unit} • `}
                            Tồn kho: {variant.stock || 0}
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-lg font-bold text-green-600'>
                            {variant.price ? `${variant.price.toLocaleString('vi-VN')} ₫` : '0 ₫'}
                          </p>
                          {variant.dimensions && <p className='text-xs text-gray-500'>{variant.dimensions}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add new variant button */}
                <div className='flex justify-center'>
                  <Button
                    variant='outline'
                    onClick={addVariant}
                    className='border-dashed border-2 border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-700'
                  >
                    <Plus className='w-4 h-4 mr-2' />
                    Thêm loại sản phẩm mới
                  </Button>
                </div>

                {/* Summary */}
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                  <div className='flex items-start gap-3'>
                    <Info className='w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0' />
                    <div>
                      <h4 className='font-medium text-blue-900 mb-1'>Tóm tắt loại sản phẩm</h4>
                      <div className='text-sm text-blue-800 space-y-1'>
                        <p>• Tổng số loại: {productVariants.length}</p>
                        <p>• Tổng tồn kho: {productVariants.reduce((sum, v) => sum + (v.stock || 0), 0)} sản phẩm</p>
                        <p>
                          • Giá từ: {Math.min(...productVariants.map((v) => v.price || 0)).toLocaleString('vi-VN')} ₫
                          đến {Math.max(...productVariants.map((v) => v.price || 0)).toLocaleString('vi-VN')} ₫
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className='flex justify-start gap-4 mt-8'>
        <Button variant='outline' onClick={handleCancel} className='px-6' disabled={isSubmitting}>
          Hủy bỏ
        </Button>
        <Button
          className='bg-green-600 hover:bg-green-700 text-white px-6'
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
