import { useState, useEffect, Suspense } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Badge } from '../../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { Checkbox } from '../../../components/ui/checkbox'
import { Upload, BookOpen, ChevronRight, Video, Edit, Save, X, Package, FileText, Award, Trash2 } from 'lucide-react'
import { productApi } from '../../../apis/product.api'
import { getAllProductCategory, type ProductCategoryItem } from '../../../apis/productCategory.api'
import type { Product } from '../../../types'

import ProductStory from './productStory'
import ProductCertificate from './productCertificate'
import ProductVariantManager from './productVariantManager'

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

  // State for managing variant form visibility
  // const [showVariantForm, setShowVariantForm] = useState(false)
  // const [editingVariant, setEditingVariant] = useState<string | null>(null)
  // const [newVariant, setNewVariant] = useState({
  //   variantName: '',
  //   quantity: 0,
  //   price: 0,
  //   isActive: true,
  //   length: 0,
  //   width: 0,
  //   height: 0,
  //   weight: 0
  // })

  // Form data for editing
  const [editData, setEditData] = useState({
    basicInfo: {
      name: '',
      description: '',
      categoryIds: [] as string[], // Changed from categoryId to categoryIds
      material: '',
      typeProduct: '', // Added typeProduct
      isActive: true,
      existingImages: [] as string[], // URLs của ảnh cũ được giữ lại
      newImageFiles: [] as File[], // File objects của ảnh mới
      productVideo: '' as string | File
    },
    variants: [] as any[],
    story: {
      title: '',
      content: '',
      images: [] as string[],
      video: ''
    },
    certificates: [] as any[]
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
  const handleVariantsChange = (updatedVariants: any[]) => {
    setEditData((prev) => ({
      ...prev,
      variants: updatedVariants
    }))
  }

  // Remove existing image (move from existingImages)
  const removeExistingImage = (imageUrl: string) => {
    setEditData((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        existingImages: prev.basicInfo.existingImages.filter((url) => url !== imageUrl)
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

  // New functions for variant form management
  // const handleAddVariantClick = () => {
  //   setNewVariant({
  //     variantName: '',
  //     quantity: 0,
  //     price: 0,
  //     isActive: true,
  //     length: 0,
  //     width: 0,
  //     height: 0,
  //     weight: 0
  //   })
  //   setEditingVariant(null)
  //   setShowVariantForm(true)
  // }

  // const handleEditVariant = (variantId: string) => {
  //   const variant = editData.variants.find((v: any) => v.id === variantId)
  //   if (variant) {
  //     setNewVariant({
  //       variantName: variant.variantName || '',
  //       quantity: variant.quantity || 0,
  //       price: variant.price || 0,
  //       isActive: variant.isActive || true,
  //       length: variant.length || 0,
  //       width: variant.width || 0,
  //       height: variant.height || 0,
  //       weight: variant.weight || 0
  //     })
  //     setEditingVariant(variantId)
  //     setShowVariantForm(true)
  //   }
  // }

  // const handleSaveVariant = async () => {
  //   if (!newVariant.variantName.trim()) {
  //     toast.error('Vui lòng nhập tên loại sản phẩm')
  //     return
  //   }
  //   if (newVariant.price <= 0) {
  //     toast.error('Vui lòng nhập giá bán hợp lệ')
  //     return
  //   }
  //   if (newVariant.quantity < 0) {
  //     toast.error('Vui lòng nhập số lượng tồn kho hợp lệ')
  //     return
  //   }

  //   try {
  //     if (editingVariant) {
  //       // Update existing variant - gọi API để cập nhật
  //       console.log('🔄 Updating variant:', editingVariant, 'with data:', newVariant)

  //       // Chuẩn bị data để cập nhật
  //       const updateData = {
  //         variants: [
  //           {
  //             id: editingVariant,
  //             variantName: newVariant.variantName,
  //             quantity: newVariant.quantity,
  //             price: newVariant.price,
  //             isActive: newVariant.isActive,
  //             length: newVariant.length,
  //             width: newVariant.width,
  //             height: newVariant.height,
  //             weight: newVariant.weight
  //           }
  //         ]
  //       }

  //       // Cập nhật thông tin variant
  //       const response = await productVariantApi.update(id!, updateData)
  //       console.log('🔄 Update response:', response)

  //       if (response.status === 202) {

  //         // Cập nhật local state sau khi API thành công
  //         setEditData((prev) => ({
  //           ...prev,
  //           variants: prev.variants.map((v: any) => (v.id === editingVariant ? { ...v, ...newVariant } : v))
  //         }))

  //         toast.success('Cập nhật loại sản phẩm thành công!')
  //       } else {
  //         toast.error('Có lỗi xảy ra khi cập nhật loại sản phẩm')
  //       }
  //     } else {
  //       // Add new variant - gọi API để tạo variant mới
  //       if (!id) {
  //         toast.error('Không tìm thấy ID sản phẩm')
  //         return
  //       }

  //       // Chuẩn bị data để gửi API - thử format array như backend mong đợi
  //       const variantData = {
  //         variants: [
  //           {
  //             variantName: newVariant.variantName,
  //             quantity: newVariant.quantity,
  //             price: newVariant.price,
  //             length: newVariant.length,
  //             width: newVariant.width,
  //             height: newVariant.height,
  //             weight: newVariant.weight
  //           }
  //         ]
  //       }

  //       console.log('🚀 Creating variant with data:', variantData)
  //       console.log('🚀 Product ID:', id)

  //       // Gọi API từ productVariant.api.ts
  //       const response = await productVariantApi.create(id, variantData)
  //       console.log('🚀 API Response:', response)

  //       if (response.status === 200) {
  //         // API trả về ProductVariant object trực tiếp
  //         const createdVariant = response.data

  //         if (createdVariant && createdVariant.id) {
  //           const newVariantWithId = {
  //             id: createdVariant.id,
  //             productId: id,
  //             ...newVariant,
  //             isActive: true // Backend tự động set isActive = true
  //           }

  //           setEditData((prev) => ({
  //             ...prev,
  //             variants: [...prev.variants, newVariantWithId]
  //           }))

  //           toast.success('Tạo loại sản phẩm thành công!')
  //         } else {
  //           console.error('❌ Unexpected response format:', createdVariant)
  //           toast.error('Không nhận được dữ liệu variant từ server')
  //         }
  //       } else {
  //         toast.error('Có lỗi xảy ra khi tạo loại sản phẩm')
  //       }
  //     }

  //     // Reset form
  //     setNewVariant({
  //       variantName: '',
  //       quantity: 0,
  //       price: 0,
  //       isActive: true,
  //       length: 0,
  //       width: 0,
  //       height: 0,
  //       weight: 0
  //     })
  //     setEditingVariant(null)
  //     setShowVariantForm(false)
  //   } catch (error: any) {
  //     console.error('Error saving variant:', error)

  //     // Lấy thông báo lỗi chi tiết từ backend
  //     const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi lưu loại sản phẩm'
  //     toast.error(`Lỗi: ${errorMessage}`)
  //   }
  // }

  // const handleCancelVariant = () => {
  //   setNewVariant({
  //     variantName: '',
  //     quantity: 0,
  //     price: 0,
  //     isActive: true,
  //     length: 0,
  //     width: 0,
  //     height: 0,
  //     weight: 0
  //   })
  //   setEditingVariant(null)
  //   setShowVariantForm(false)
  // }

  // const handleNewVariantChange = (field: string, value: string | number | boolean) => {
  //   setNewVariant((prev) => ({ ...prev, [field]: value }))
  // }

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
              categoryIds: (response.data as any).productCategories?.map((cat: any) => cat.id) || [],
              material: response.data.material || '',
              typeProduct: response.data.typeProduct || '',
              isActive: response.data.isActive || true,
              existingImages: (response.data as any).productImages || [],
              newImageFiles: [],
              productVideo: (response.data as any).productVideo || ''
            },
            variants: (response.data as any).variants || [],
            story: (response.data as any).productStory || {
              title: '',
              content: '',
              images: [],
              video: ''
            },
            certificates: (response.data as any).productCertificateDTOs || []
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
            categoryIds: (productDetail as any).productCategories?.map((cat: any) => cat.id) || [],
            material: productDetail.material || '',
            typeProduct: productDetail.typeProduct || '',
            isActive: productDetail.isActive || true,
            existingImages: (productDetail as any).productImages || [],
            newImageFiles: [],
            productVideo: (productDetail as any).productVideo || ''
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
          console.log(
            '📁 New image files to upload:',
            editData.basicInfo.newImageFiles.map((f) => f.name)
          )

          const formData = new FormData()
          formData.append('Name', editData.basicInfo.name)
          formData.append('Description', editData.basicInfo.description)
          formData.append('material', editData.basicInfo.material)
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
                categoryIds: (response.data as any).productCategories?.map((cat: any) => cat.id) || [],
                material: response.data.material || '',
                typeProduct: response.data.typeProduct || '',
                isActive: response.data.isActive || true,
                existingImages: (response.data as any).productImages || [],
                newImageFiles: [],
                productVideo: (response.data as any).productVideo || ''
              }
            }))
          }
          break
        }
        case 'variants': {
          // Variants are now handled individually in handleSaveVariant
          // No bulk update needed
          console.log('🔄 Variants are handled individually')
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
    } catch (err: any) {
      console.error(`Error saving ${section}:`, err)

      // Lấy thông báo lỗi chi tiết từ backend
      const errorMessage = err.response?.data?.message || err.message || `Có lỗi xảy ra khi lưu ${section}`
      toast.error(`Lỗi: ${errorMessage}`)
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
              categoryIds: (productDetail as any).productCategories?.map((cat: any) => cat.id) || [],
              material: productDetail.material || '',
              typeProduct: productDetail.typeProduct || '',
              isActive: productDetail.isActive || true,
              existingImages: (productDetail as any).productImages || [],
              newImageFiles: [],
              productVideo: (productDetail as any).productVideo || ''
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
                    <Label htmlFor='material' className='text-sm font-medium'>
                      Nhà sản xuất
                    </Label>
                    <Input
                      id='material'
                      value={editData.basicInfo.material}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          basicInfo: { ...prev.basicInfo, material: e.target.value }
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
                          <strong>Tổng kết:</strong> {editData.basicInfo.existingImages.length} ảnh cũ được giữ lại,{' '}
                          {editData.basicInfo.newImageFiles.length} ảnh mới sẽ được thêm
                        </p>
                        {editData.basicInfo.existingImages.length + editData.basicInfo.newImageFiles.length === 0 && (
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
                              src={
                                typeof editData.basicInfo.productVideo === 'string'
                                  ? editData.basicInfo.productVideo
                                  : URL.createObjectURL(editData.basicInfo.productVideo)
                              }
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
                      <p className='mt-1 text-gray-900'>{productDetail.material || 'Chưa cập nhật'}</p>
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
                      {(productDetail as any).productCategories &&
                        (productDetail as any).productCategories.length > 0 ? (
                        <div className='flex flex-wrap gap-2'>
                          {(productDetail as any).productCategories.map((category: any) => (
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
                  {(productDetail as any).productImages && (productDetail as any).productImages.length > 0 && (
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>Hình ảnh sản phẩm</Label>
                      <div className='mt-2 grid grid-cols-2 md:grid-cols-4 gap-4'>
                        {(productDetail as any).productImages.map((image: any, index: number) => (
                          <div key={index} className='aspect-square bg-gray-100 rounded-lg overflow-hidden'>
                            <img src={image} alt={`Product ${index + 1}`} className='w-full h-full object-cover' />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Display current video */}
                  {(productDetail as any).productVideo && (
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>Video sản phẩm</Label>
                      <div className='mt-2'>
                        <video
                          src={(productDetail as any).productVideo}
                          controls
                          className='w-full max-w-md rounded-lg'
                        />
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
          <ProductVariantManager
            productId={id || ''}
            initialVariants={editData.variants}
            onVariantsChange={handleVariantsChange}
          />
        </TabsContent>

        {/* Product Story Tab */}
        <TabsContent value='story' className='space-y-6'>
          <Suspense fallback={<div>Đang tải...</div>}>
            <ProductStory
              productId={id || ''}
              productStory={productDetail?.productStory}
              isEditMode={editModes.story}
              onToggleEditMode={toggleEditMode}
              onCancelEdit={cancelEdit}
              onSaveSection={saveSection}
            />
          </Suspense>
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value='certificates' className='space-y-6'>
          <Suspense fallback={<div>Đang tải...</div>}>
            <ProductCertificate
              productId={id || ''}
              editModes={editModes}
              onToggleEditMode={toggleEditMode}
              onCancelEdit={cancelEdit}
              onSaveSection={saveSection}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
export default UpdateProduct
