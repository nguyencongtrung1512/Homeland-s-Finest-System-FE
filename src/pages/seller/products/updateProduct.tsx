import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Badge } from '../../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { Checkbox } from '../../../components/ui/checkbox'
import {
  Upload,
  BookOpen,
  Shield,
  ChevronRight,
  Plus,
  Video,
  Edit,
  Save,
  X,
  Package,
  FileText,
  Award,
  Trash2,
  Image
} from 'lucide-react'
import { productApi } from '../../../apis/product.api'
import { getAllProductCategory, type ProductCategoryItem } from '../../../apis/productCategory.api'
import type { Product } from '../../../types'

interface ProductDetail extends Product {
  variants?: any[]
  productCategories?: any[]
  productCertificateDTOs?: any[]
  productStory?: any
}

function UpdateProduct() {
  const navigate = useNavigate()
  const { id } = useParams()

  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Product data
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null)

  // Categories data
  const [allCategories, setAllCategories] = useState<ProductCategoryItem[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  // Edit modes for different sections
  const [editModes, setEditModes] = useState({
    basicInfo: false,
    variants: false,
    story: false,
    certificates: false
  })

  // Form data for editing
  const [editData, setEditData] = useState({
    basicInfo: {
      name: '',
      description: '',
      categoryIds: [] as string[], // Changed from categoryId to categoryIds
      madeBy: '',
      typeProduct: '', // Added typeProduct
      isActive: true,
      existingImages: [] as string[], // URLs của ảnh cũ được giữ lại
      newImageFiles: [] as File[], // File objects của ảnh mới
      productVideo: ''
    },
    variants: [],
    story: {
      title: '',
      content: '',
      images: [],
      video: ''
    },
    certificates: []
  })

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true)
      const response = await getAllProductCategory()
      if (response.status === 200) {
        setAllCategories(response.data)
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    } finally {
      setCategoriesLoading(false)
    }
  }
  // Handle image upload
  const handleImageUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files)
      setEditData((prev) => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          newImageFiles: [...prev.basicInfo.newImageFiles, ...newFiles]
        }
      }))
    }
  }

  // Remove existing image (move from existingImages)
  const removeExistingImage = (imageUrl: string) => {
    setEditData((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        existingImages: prev.basicInfo.existingImages.filter(url => url !== imageUrl)
      }
    }))
  }

  // Remove new image file
  const removeNewImageFile = (index: number) => {
    setEditData((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        newImageFiles: prev.basicInfo.newImageFiles.filter((_, i) => i !== index)
      }
    }))
  }

  // Get all images for display (existing + new)
  const getAllImages = () => {
    const existingImages = editData.basicInfo.existingImages.map(url => ({ type: 'existing', url, file: null }))
    const newImages = editData.basicInfo.newImageFiles.map(file => ({
      type: 'new',
      url: URL.createObjectURL(file),
      file
    }))
    return [...existingImages, ...newImages]
  }

  // Handle category selection
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setEditData((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        categoryIds: checked
          ? [...prev.basicInfo.categoryIds, categoryId]
          : prev.basicInfo.categoryIds.filter((id) => id !== categoryId)
      }
    }))
  }
  // Fetch product details
  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!id) return

      try {
        setLoading(true)
        const response = await productApi.getById(id)
        console.log(' DEBUG - product id:', response)
        if (response.status === 200) {
          setProductDetail(response.data)
          // Initialize edit data with current product data
          setEditData({
            basicInfo: {
              name: response.data.name || '',
              description: response.data.description || '',
              categoryIds: response.data.productCategories?.map((cat: any) => cat.id) || [],
              madeBy: response.data.madeBy || '',
              typeProduct: response.data.typeProduct || '',
              isActive: response.data.isActive || true,
              existingImages: response.data.productImages || [],
              newImageFiles: [],
              productVideo: response.data.productVideo || ''
            },
            variants: response.data.variants || [],
            story: response.data.productStory || {
              title: '',
              content: '',
              images: [],
              video: ''
            },
            certificates: response.data.productCertificateDTOs || []
          })
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Không thể tải thông tin sản phẩm')
      } finally {
        setLoading(false)
      }
    }

    fetchProductDetail()
  }, [id])

  // Fetch categories when entering edit mode
  useEffect(() => {
    if (editModes.basicInfo && allCategories.length === 0) {
      fetchCategories()
    }
  }, [editModes.basicInfo])

  // Toggle edit mode for sections
  const toggleEditMode = (section: keyof typeof editModes) => {
    // If entering edit mode, sync current data to editData
    if (!editModes[section] && productDetail) {
      if (section === 'basicInfo') {
        setEditData((prev) => ({
          ...prev,
          basicInfo: {
            name: productDetail.name || '',
            description: productDetail.description || '',
            categoryIds: productDetail.productCategories?.map((cat: any) => cat.id) || [],
            madeBy: productDetail.madeBy || '',
            typeProduct: productDetail.typeProduct || '',
            isActive: productDetail.isActive || true,
            existingImages: productDetail.productImages || [],
            newImageFiles: [],
            productVideo: productDetail.productVideo || ''
          }
        }))
      }
      // Add similar logic for other sections if needed
    }

    setEditModes((prev) => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Save changes for specific section
  const saveSection = async (section: keyof typeof editModes) => {
    try {
      switch (section) {
        case 'basicInfo': {
          // PUT /api/Product/{id} for basic info, images, video
          console.log('Saving basic info:', editData.basicInfo)
          console.log('🖼️ Existing images to keep:', editData.basicInfo.existingImages)
          console.log('📁 New image files to upload:', editData.basicInfo.newImageFiles.map(f => f.name))

          const formData = new FormData()
          formData.append('Name', editData.basicInfo.name)
          formData.append('Description', editData.basicInfo.description)
          formData.append('MadeBy', editData.basicInfo.madeBy)
          formData.append('TypeProduct', editData.basicInfo.typeProduct)
          formData.append('IsActive', editData.basicInfo.isActive.toString())

          // Add category IDs with correct format
          editData.basicInfo.categoryIds.forEach((categoryId, index) => {
            formData.append(`CategoryIds[${index}]`, categoryId)
          })

          // Add existing images (URLs của ảnh cũ được giữ lại)
          editData.basicInfo.existingImages.forEach((imageUrl, index) => {
            formData.append(`ExistingImageUrls[${index}]`, imageUrl)
            console.log(`✅ Added ExistingImageUrls[${index}]:`, imageUrl)
          })

          // Add new image files (File objects của ảnh mới)
          editData.basicInfo.newImageFiles.forEach((file, index) => {
            formData.append(`NewImageFiles[${index}]`, file)
            console.log(`📎 Added NewImageFiles[${index}]:`, file.name)
          })

          // Add existing video (if any)
          if (editData.basicInfo.productVideo) {
            if (typeof editData.basicInfo.productVideo === 'string') {
              // Existing video URL
              formData.append('ExistingVideoUrl', editData.basicInfo.productVideo)
            } else {
              // New video file
              formData.append('NewVideoFile', editData.basicInfo.productVideo)
            }
          }

          // Use updateWithFormData instead of update
          await productApi.updateWithFormData(id!, formData)

          // Refresh product data after successful update
          const response = await productApi.getById(id!)
          if (response.data) {
            setProductDetail(response.data)
            // Update edit data with fresh data
            setEditData((prev) => ({
              ...prev,
              basicInfo: {
                name: response.data.name || '',
                description: response.data.description || '',
                categoryIds: response.data.productCategories?.map((cat: any) => cat.id) || [],
                madeBy: response.data.madeBy || '',
                typeProduct: response.data.typeProduct || '',
                isActive: response.data.isActive || true,
                existingImages: response.data.productImages || [],
                newImageFiles: [],
                productVideo: response.data.productVideo || ''
              }
            }))
          }
          break
        }
        case 'variants': {
          // API call for product variants
          console.log('Saving variants:', editData.variants)
          break
        }
        case 'story': {
          // API call for product story
          console.log('Saving story:', editData.story)
          break
        }
        case 'certificates': {
          // API call for certificates
          console.log('Saving certificates:', editData.certificates)
          break
        }
      }

      // Turn off edit mode after saving
      toggleEditMode(section)
    } catch (err) {
      console.error(`Error saving ${section}:`, err)
      // TODO: Show error toast
    }
  }

  // Cancel edit mode
  const cancelEdit = (section: keyof typeof editModes) => {
    // Reset edit data to original values
    if (productDetail) {
      setEditData((prev) => ({
        ...prev,
        [section]:
          section === 'basicInfo'
            ? {
              name: productDetail.name || '',
              description: productDetail.description || '',
              categoryIds: productDetail.productCategories?.map((cat: any) => cat.id) || [],
              madeBy: productDetail.madeBy || '',
              typeProduct: productDetail.typeProduct || '',
              isActive: productDetail.isActive || true,
              existingImages: productDetail.productImages || [],
              newImageFiles: [],
              productVideo: productDetail.productVideo || ''
            }
            : prev[section]
      }))
    }
    toggleEditMode(section)
  }

  if (loading) {
    return (
      <div className='p-6 bg-gray-50 min-h-screen'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4'></div>
            <p className='text-gray-600'>Đang tải thông tin sản phẩm...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !productDetail) {
    return (
      <div className='p-6 bg-gray-50 min-h-screen'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <p className='text-red-600 mb-4'>{error || 'Không tìm thấy sản phẩm'}</p>
            <Button onClick={() => navigate('../product-management')}>Quay lại danh sách sản phẩm</Button>
          </div>
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
        <span className='text-gray-900 font-medium'>Chỉnh sửa sản phẩm</span>
      </div>

      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-semibold text-gray-900'>Chỉnh sửa sản phẩm</h1>
        <p className='text-gray-600 mt-1'>Xem và cập nhật thông tin sản phẩm: {productDetail.name}</p>
      </div>

      {/* Product Status Badge */}
      <div className='mb-6'>
        <Badge
          variant={productDetail.isActive ? 'default' : 'secondary'}
          className={productDetail.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
        >
          {productDetail.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
        </Badge>
        <Badge variant='outline' className='ml-2'>
          Trạng thái: {productDetail.status}
        </Badge>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue='basic-info' className='w-full'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='basic-info' className='flex items-center gap-2'>
            <Package className='w-4 h-4' />
            Thông tin cơ bản
          </TabsTrigger>
          <TabsTrigger value='variants' className='flex items-center gap-2'>
            <FileText className='w-4 h-4' />
            Loại sản phẩm
          </TabsTrigger>
          <TabsTrigger value='story' className='flex items-center gap-2'>
            <BookOpen className='w-4 h-4' />
            Câu chuyện
          </TabsTrigger>
          <TabsTrigger value='certificates' className='flex items-center gap-2'>
            <Award className='w-4 h-4' />
            Chứng nhận
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value='basic-info' className='space-y-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle className='text-green-700'>Thông tin cơ bản</CardTitle>
              <div className='flex gap-2'>
                {editModes.basicInfo ? (
                  <>
                    <Button size='sm' variant='outline' onClick={() => cancelEdit('basicInfo')}>
                      <X className='w-4 h-4 mr-2' />
                      Hủy
                    </Button>
                    <Button
                      size='sm'
                      onClick={() => saveSection('basicInfo')}
                      className='bg-green-600 hover:bg-green-700'
                    >
                      <Save className='w-4 h-4 mr-2' />
                      Lưu
                    </Button>
                  </>
                ) : (
                  <Button size='sm' variant='outline' onClick={() => toggleEditMode('basicInfo')}>
                    <Edit className='w-4 h-4 mr-2' />
                    Chỉnh sửa
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              {editModes.basicInfo ? (
                // Edit mode
                <>
                  <div>
                    <Label htmlFor='name' className='text-sm font-medium'>
                      Tên sản phẩm <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='name'
                      value={editData.basicInfo.name}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          basicInfo: { ...prev.basicInfo, name: e.target.value }
                        }))
                      }
                      className='mt-1'
                    />
                  </div>

                  <div>
                    <Label htmlFor='description' className='text-sm font-medium'>
                      Mô tả chi tiết
                    </Label>
                    <Textarea
                      id='description'
                      value={editData.basicInfo.description}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          basicInfo: { ...prev.basicInfo, description: e.target.value }
                        }))
                      }
                      className='mt-1 min-h-[120px]'
                    />
                  </div>

                  <div>
                    <Label htmlFor='madeBy' className='text-sm font-medium'>
                      Nhà sản xuất
                    </Label>
                    <Input
                      id='madeBy'
                      value={editData.basicInfo.madeBy}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          basicInfo: { ...prev.basicInfo, madeBy: e.target.value }
                        }))
                      }
                      className='mt-1'
                    />
                  </div>

                  {/* Type Product */}
                  <div>
                    <Label htmlFor='typeProduct' className='text-sm font-medium'>
                      Loại sản phẩm
                    </Label>
                    <Input
                      id='typeProduct'
                      value={editData.basicInfo.typeProduct}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          basicInfo: { ...prev.basicInfo, typeProduct: e.target.value }
                        }))
                      }
                      className='mt-1'
                    />
                  </div>

                  {/* Product Categories */}
                  <div>
                    <Label className='text-sm font-medium'>Danh mục sản phẩm</Label>
                    <div className='mt-2'>
                      {categoriesLoading ? (
                        <div className='flex items-center justify-center py-4'>
                          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-green-600'></div>
                          <span className='ml-2 text-sm text-gray-600'>Đang tải danh mục...</span>
                        </div>
                      ) : allCategories.length > 0 ? (
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-lg p-3'>
                          {allCategories.map((category) => (
                            <div key={category.id} className='flex items-center space-x-2'>
                              <Checkbox
                                id={`category-${category.id}`}
                                checked={editData.basicInfo.categoryIds.includes(category.id)}
                                onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                              />
                              <Label
                                htmlFor={`category-${category.id}`}
                                className='text-sm font-normal cursor-pointer flex-1'
                              >
                                {category.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className='text-center py-4 text-gray-500 text-sm'>Không có danh mục nào</div>
                      )}
                      {editData.basicInfo.categoryIds.length > 0 && (
                        <div className='mt-2'>
                          <p className='text-xs text-gray-600 mb-1'>
                            Đã chọn {editData.basicInfo.categoryIds.length} danh mục:
                          </p>
                          <div className='flex flex-wrap gap-1'>
                            {editData.basicInfo.categoryIds.map((categoryId) => {
                              const category = allCategories.find((cat) => cat.id === categoryId)
                              return category ? (
                                <Badge key={categoryId} variant='secondary' className='text-xs'>
                                  {category.name}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <Label className='text-sm font-medium'>Hình ảnh sản phẩm</Label>
                    <div className='mt-2 space-y-4'>
                      {/* Existing Images */}
                      {editData.basicInfo.existingImages.length > 0 && (
                        <div>
                          <p className='text-sm text-gray-600 mb-2'>Hình ảnh hiện tại:</p>
                          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                            {editData.basicInfo.existingImages.map((imageUrl, index) => (
                              <div key={`existing-${index}`} className='relative group'>
                                <div className='aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200'>
                                  <img
                                    src={imageUrl}
                                    alt={`Existing ${index + 1}`}
                                    className='w-full h-full object-cover'
                                  />
                                </div>
                                <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                                  <Button
                                    size='sm'
                                    variant='destructive'
                                    className='h-8 w-8 p-0'
                                    onClick={() => removeExistingImage(imageUrl)}
                                  >
                                    <Trash2 className='w-4 h-4' />
                                  </Button>
                                </div>
                                <div className='absolute bottom-2 left-2'>
                                  <Badge variant='secondary' className='text-xs bg-blue-100 text-blue-800'>
                                    Ảnh cũ
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* New Images */}
                      {editData.basicInfo.newImageFiles.length > 0 && (
                        <div>
                          <p className='text-sm text-gray-600 mb-2'>Ảnh mới sẽ được thêm:</p>
                          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                            {editData.basicInfo.newImageFiles.map((file, index) => (
                              <div key={`new-${index}`} className='relative group'>
                                <div className='aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-green-200'>
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={`New ${index + 1}`}
                                    className='w-full h-full object-cover'
                                  />
                                </div>
                                <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                                  <Button
                                    size='sm'
                                    variant='destructive'
                                    className='h-8 w-8 p-0'
                                    onClick={() => removeNewImageFile(index)}
                                  >
                                    <Trash2 className='w-4 h-4' />
                                  </Button>
                                </div>
                                <div className='absolute bottom-2 left-2'>
                                  <Badge variant='secondary' className='text-xs bg-green-100 text-green-800'>
                                    Ảnh mới
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upload New Images */}
                      <div>
                        <input
                          type='file'
                          id='image-upload'
                          multiple
                          accept='image/*'
                          onChange={(e) => handleImageUpload(e.target.files)}
                          className='hidden'
                        />
                        <label
                          htmlFor='image-upload'
                          className='block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer'
                        >
                          <Upload className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                          <p className='text-gray-600 mb-2'>Kéo thả hoặc click để tải ảnh lên</p>
                          <p className='text-sm text-gray-500'>PNG, JPG tối đa 5MB mỗi ảnh</p>
                          <p className='text-xs text-gray-400 mt-1'>Có thể chọn nhiều ảnh cùng lúc</p>
                        </label>
                      </div>

                      {/* Image Summary */}
                      <div className='bg-gray-50 rounded-lg p-3'>
                        <p className='text-sm text-gray-600'>
                          <strong>Tổng kết:</strong> {editData.basicInfo.existingImages.length} ảnh cũ được giữ lại, {editData.basicInfo.newImageFiles.length} ảnh mới sẽ được thêm
                        </p>
                        {(editData.basicInfo.existingImages.length + editData.basicInfo.newImageFiles.length) === 0 && (
                          <p className='text-sm text-orange-600 mt-1'>⚠️ Sản phẩm chưa có ảnh nào</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Video Upload */}
                  <div>
                    <Label className='text-sm font-medium'>Video sản phẩm</Label>
                    <div className='mt-2 space-y-4'>
                      {editData.basicInfo.productVideo && (
                        <div>
                          <p className='text-sm text-gray-600 mb-2'>Video hiện tại:</p>
                          <div className='relative'>
                            <video
                              src={typeof editData.basicInfo.productVideo === 'string' ? editData.basicInfo.productVideo : URL.createObjectURL(editData.basicInfo.productVideo)}
                              controls
                              className='w-full max-w-md rounded-lg'
                            />
                            <Button
                              size='sm'
                              variant='destructive'
                              className='absolute top-2 right-2'
                              onClick={() => {
                                setEditData((prev) => ({
                                  ...prev,
                                  basicInfo: { ...prev.basicInfo, productVideo: '' }
                                }))
                              }}
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          </div>
                        </div>
                      )}

                      <div>
                        <input
                          type='file'
                          id='video-upload'
                          accept='video/*'
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setEditData((prev) => ({
                                ...prev,
                                basicInfo: { ...prev.basicInfo, productVideo: file }
                              }))
                            }
                          }}
                          className='hidden'
                        />
                        <label
                          htmlFor='video-upload'
                          className='block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer'
                        >
                          <Video className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                          <p className='text-gray-600 mb-2'>Kéo thả hoặc click để tải video lên</p>
                          <p className='text-sm text-gray-500'>MP4, MOV tối đa 50MB</p>
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // View mode
                <>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>Tên sản phẩm</Label>
                      <p className='mt-1 text-gray-900 font-medium'>{productDetail.name}</p>
                    </div>
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>Nhà sản xuất</Label>
                      <p className='mt-1 text-gray-900'>{productDetail.madeBy || 'Chưa cập nhật'}</p>
                    </div>
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>Loại sản phẩm</Label>
                      <p className='mt-1 text-gray-900'>{productDetail.typeProduct || 'Chưa cập nhật'}</p>
                    </div>
                  </div>

                  {/* Display product categories */}
                  <div>
                    <Label className='text-sm font-medium text-gray-600'>Danh mục sản phẩm</Label>
                    <div className='mt-2'>
                      {productDetail.productCategories && productDetail.productCategories.length > 0 ? (
                        <div className='flex flex-wrap gap-2'>
                          {productDetail.productCategories.map((category) => (
                            <Badge
                              key={category.id}
                              variant='secondary'
                              className='bg-green-100 text-green-800 hover:bg-green-200'
                            >
                              {category.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className='text-gray-500 text-sm'>Chưa có danh mục nào</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className='text-sm font-medium text-gray-600'>Mô tả chi tiết</Label>
                    <p className='mt-1 text-gray-900 whitespace-pre-wrap'>{productDetail.description}</p>
                  </div>

                  {/* Display current images */}
                  {productDetail.productImages && productDetail.productImages.length > 0 && (
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>Hình ảnh sản phẩm</Label>
                      <div className='mt-2 grid grid-cols-2 md:grid-cols-4 gap-4'>
                        {productDetail.productImages.map((image, index) => (
                          <div key={index} className='aspect-square bg-gray-100 rounded-lg overflow-hidden'>
                            <img src={image} alt={`Product ${index + 1}`} className='w-full h-full object-cover' />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Display current video */}
                  {productDetail.productVideo && (
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>Video sản phẩm</Label>
                      <div className='mt-2'>
                        <video src={productDetail.productVideo} controls className='w-full max-w-md rounded-lg' />
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Variants Tab */}
        <TabsContent value='variants' className='space-y-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle className='text-green-700'>Loại sản phẩm</CardTitle>
              <div className='flex gap-2'>
                {editModes.variants ? (
                  <>
                    <Button size='sm' variant='outline' onClick={() => cancelEdit('variants')}>
                      <X className='w-4 h-4 mr-2' />
                      Hủy
                    </Button>
                    <Button
                      size='sm'
                      onClick={() => saveSection('variants')}
                      className='bg-green-600 hover:bg-green-700'
                    >
                      <Save className='w-4 h-4 mr-2' />
                      Lưu
                    </Button>
                  </>
                ) : (
                  <Button size='sm' variant='outline' onClick={() => toggleEditMode('variants')}>
                    <Edit className='w-4 h-4 mr-2' />
                    Chỉnh sửa
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editModes.variants ? (
                // Edit mode for variants
                <div className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <p className='text-sm text-gray-600'>Quản lý các loại sản phẩm khác nhau</p>
                    <Button size='sm' variant='outline' className='text-green-600 border-green-600 hover:bg-green-50'>
                      <Plus className='w-4 h-4 mr-2' />
                      Thêm loại mới
                    </Button>
                  </div>
                  {/* Add variant editing form here */}
                  <p className='text-gray-500 italic'>Chức năng chỉnh sửa loại sản phẩm sẽ được cập nhật...</p>
                </div>
              ) : (
                // View mode for variants
                <div className='space-y-4'>
                  {productDetail.variants && productDetail.variants.length > 0 ? (
                    <div className='grid gap-4'>
                      {productDetail.variants.map((variant: any, index: number) => (
                        <div key={index} className='border border-gray-200 rounded-lg p-4 bg-gray-50'>
                          <div className='grid grid-cols-3 gap-4'>
                            <div>
                              <Label className='text-sm font-medium text-gray-600'>Tên loại</Label>
                              <p className='mt-1 text-gray-900'>{variant.variantName || `Loại ${index + 1}`}</p>
                            </div>
                            <div>
                              <Label className='text-sm font-medium text-gray-600'>Giá bán</Label>
                              <p className='mt-1 text-gray-900 font-medium'>
                                {variant.price?.toLocaleString('vi-VN')} VNĐ
                              </p>
                            </div>
                            <div>
                              <Label className='text-sm font-medium text-gray-600'>Trạng thái</Label>
                              <Badge
                                variant={variant.isActive ? 'default' : 'secondary'}
                                className={
                                  variant.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {variant.isActive ? 'Hoạt động' : 'Tạm dừng'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-12'>
                      <Package className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                      <h3 className='text-lg font-medium text-gray-900 mb-2'>Chưa có loại sản phẩm nào</h3>
                      <p className='text-gray-500 mb-6'>
                        Thêm các loại sản phẩm khác nhau để khách hàng có thể lựa chọn
                      </p>
                      <Button
                        className='bg-green-600 hover:bg-green-700 text-white'
                        onClick={() => {
                          // TODO: Handle add product variant
                          console.log('Add product variant')
                        }}
                      >
                        <Plus className='w-4 h-4 mr-2' />
                        Thêm loại sản phẩm
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Story Tab */}
        <TabsContent value='story' className='space-y-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <BookOpen className='w-5 h-5 text-green-600' />
                Câu chuyện sản phẩm
              </CardTitle>
              <div className='flex gap-2'>
                {editModes.story ? (
                  <>
                    <Button size='sm' variant='outline' onClick={() => cancelEdit('story')}>
                      <X className='w-4 h-4 mr-2' />
                      Hủy
                    </Button>
                    <Button size='sm' onClick={() => saveSection('story')} className='bg-green-600 hover:bg-green-700'>
                      <Save className='w-4 h-4 mr-2' />
                      Lưu
                    </Button>
                  </>
                ) : (
                  <Button size='sm' variant='outline' onClick={() => toggleEditMode('story')}>
                    <Edit className='w-4 h-4 mr-2' />
                    Chỉnh sửa
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editModes.story ? (
                // Edit mode for story
                <div className='space-y-6'>
                  <div>
                    <Label htmlFor='storyTitle' className='text-sm font-medium'>
                      Tiêu đề câu chuyện
                    </Label>
                    <Input
                      id='storyTitle'
                      value={editData.story.title}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          story: { ...prev.story, title: e.target.value }
                        }))
                      }
                      placeholder='Nhập tiêu đề cho câu chuyện sản phẩm'
                      className='mt-1'
                    />
                  </div>

                  <div>
                    <Label htmlFor='storyContent' className='text-sm font-medium'>
                      Nội dung câu chuyện
                    </Label>
                    <Textarea
                      id='storyContent'
                      value={editData.story.content}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          story: { ...prev.story, content: e.target.value }
                        }))
                      }
                      placeholder='Kể câu chuyện về sản phẩm, nguồn gốc, quy trình sản xuất...'
                      className='mt-1 min-h-[150px]'
                    />
                  </div>

                  {/* Story Images */}
                  <div>
                    <Label className='text-sm font-medium'>Hình ảnh minh họa</Label>
                    <div className='mt-2 space-y-4'>
                      {/* Current Story Images */}
                      {editData.story.images && editData.story.images.length > 0 && (
                        <div>
                          <p className='text-sm text-gray-600 mb-2'>Hình ảnh hiện tại:</p>
                          <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                            {editData.story.images.map((image, index) => (
                              <div key={index} className='relative group'>
                                <div className='aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200'>
                                  <img src={image} alt={`Story ${index + 1}`} className='w-full h-full object-cover' />
                                </div>
                                <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                                  <Button
                                    size='sm'
                                    variant='destructive'
                                    className='h-8 w-8 p-0'
                                    onClick={() => {
                                      const newImages = editData.story.images.filter((_, i) => i !== index)
                                      setEditData((prev) => ({
                                        ...prev,
                                        story: { ...prev.story, images: newImages }
                                      }))
                                    }}
                                  >
                                    <Trash2 className='w-4 h-4' />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upload New Story Images */}
                      <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer'>
                        <Image className='w-10 h-10 text-gray-400 mx-auto mb-3' />
                        <p className='text-gray-600 mb-1'>Thêm hình ảnh cho câu chuyện</p>
                        <p className='text-sm text-gray-500'>PNG, JPG tối đa 5MB mỗi ảnh</p>
                      </div>
                    </div>
                  </div>

                  {/* Story Video */}
                  <div>
                    <Label className='text-sm font-medium'>Video câu chuyện</Label>
                    <div className='mt-2 space-y-4'>
                      {editData.story.video && (
                        <div>
                          <p className='text-sm text-gray-600 mb-2'>Video hiện tại:</p>
                          <div className='relative'>
                            <video src={editData.story.video} controls className='w-full max-w-md rounded-lg' />
                            <Button
                              size='sm'
                              variant='destructive'
                              className='absolute top-2 right-2'
                              onClick={() => {
                                setEditData((prev) => ({
                                  ...prev,
                                  story: { ...prev.story, video: '' }
                                }))
                              }}
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer'>
                        <Video className='w-10 h-10 text-gray-400 mx-auto mb-3' />
                        <p className='text-gray-600 mb-1'>Thêm video cho câu chuyện</p>
                        <p className='text-sm text-gray-500'>MP4, MOV tối đa 50MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // View mode for story
                <div className='space-y-6'>
                  {productDetail.productStory ? (
                    <>
                      <div>
                        <h3 className='text-xl font-semibold text-gray-900 mb-3'>{productDetail.productStory.title}</h3>
                        <p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>
                          {productDetail.productStory.content}
                        </p>
                      </div>

                      {/* Story Images */}
                      {productDetail.productStory.images && productDetail.productStory.images.length > 0 && (
                        <div>
                          <h4 className='text-lg font-medium text-gray-900 mb-3'>Hình ảnh minh họa</h4>
                          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                            {productDetail.productStory.images.map((image, index) => (
                              <div key={index} className='aspect-video bg-gray-100 rounded-lg overflow-hidden'>
                                <img
                                  src={image}
                                  alt={`Story ${index + 1}`}
                                  className='w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer'
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Story Video */}
                      {productDetail.productStory.video && (
                        <div>
                          <h4 className='text-lg font-medium text-gray-900 mb-3'>Video câu chuyện</h4>
                          <video
                            src={productDetail.productStory.video}
                            controls
                            className='w-full max-w-2xl rounded-lg'
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className='text-center py-12'>
                      <BookOpen className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                      <h3 className='text-lg font-medium text-gray-900 mb-2'>Chưa có câu chuyện</h3>
                      <p className='text-gray-500 mb-6'>Thêm câu chuyện để khách hàng hiểu rõ hơn về sản phẩm</p>
                      <Button variant='outline' onClick={() => toggleEditMode('story')}>
                        <Edit className='w-4 h-4 mr-2' />
                        Thêm câu chuyện
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value='certificates' className='space-y-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <Shield className='w-5 h-5 text-green-600' />
                Chứng nhận sản phẩm
              </CardTitle>
              <div className='flex gap-2'>
                {editModes.certificates ? (
                  <>
                    <Button size='sm' variant='outline' onClick={() => cancelEdit('certificates')}>
                      <X className='w-4 h-4 mr-2' />
                      Hủy
                    </Button>
                    <Button
                      size='sm'
                      onClick={() => saveSection('certificates')}
                      className='bg-green-600 hover:bg-green-700'
                    >
                      <Save className='w-4 h-4 mr-2' />
                      Lưu
                    </Button>
                  </>
                ) : (
                  <Button size='sm' variant='outline' onClick={() => toggleEditMode('certificates')}>
                    <Edit className='w-4 h-4 mr-2' />
                    Chỉnh sửa
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editModes.certificates ? (
                // Edit mode for certificates
                <div className='space-y-4'>
                  <p className='text-sm text-gray-600'>Quản lý chứng nhận chất lượng sản phẩm</p>
                  {/* Add certificate editing form here */}
                  <p className='text-gray-500 italic'>Chức năng chỉnh sửa chứng nhận sẽ được cập nhật...</p>
                </div>
              ) : (
                // View mode for certificates
                <div className='space-y-4'>
                  {productDetail.productCertificateDTOs && productDetail.productCertificateDTOs.length > 0 ? (
                    <div className='grid gap-4'>
                      {productDetail.productCertificateDTOs.map((cert: any, index: number) => (
                        <div key={index} className='border border-gray-200 rounded-lg p-4 bg-gray-50'>
                          <div className='flex items-center gap-4'>
                            <Shield className='w-8 h-8 text-green-600' />
                            <div>
                              <h4 className='font-medium text-gray-900'>{cert.name}</h4>
                              <p className='text-sm text-gray-600'>{cert.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-8'>
                      <Shield className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                      <p className='text-gray-500'>Chưa có chứng nhận nào cho sản phẩm này</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default UpdateProduct
