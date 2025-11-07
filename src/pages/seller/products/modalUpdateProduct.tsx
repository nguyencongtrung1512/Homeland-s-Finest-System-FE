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
    setMediaData((prev) => ({
      ...prev,
      newProductImages: [...prev.newProductImages, ...newFiles]
    }))
  }

  const handleInputChange = (field: string, value: string | boolean) => {
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
              <Label htmlFor='update-name' className='text-sm font-medium'>
                Tên sản phẩm <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='update-name'
                placeholder='Nhập tên sản phẩm'
                value={productData.name}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.length <= 200) {
                    handleInputChange('name', value)
                  }
                }}
                maxLength={200}
                className='mt-1'
              />
              <p className='text-xs text-gray-500 mt-1 text-right'>
                {productData.name?.length || 0}/200 ký tự
              </p>
            </div>

            {/* Material */}
            <div>
              <Label htmlFor='update-material' className='text-sm font-medium'>
                Material
              </Label>
              <Input
                id='update-material'
                placeholder='Nhập material (ví dụ: string)'
                value={productData.material}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.length <= 200) {
                    handleInputChange('material', value)
                  }
                }}
                maxLength={200}
                className='mt-1'
              />
              <p className='text-xs text-gray-500 mt-1 text-right'>
                {productData.material?.length || 0}/200 ký tự
              </p>
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
              <Label htmlFor='update-description' className='text-sm font-medium'>
                Mô tả sản phẩm
              </Label>
              <Textarea
                id='update-description'
                placeholder='Nhập mô tả sản phẩm'
                value={productData.description}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.length <= 2000) {
                    handleInputChange('description', value)
                  }
                }}
                maxLength={2000}
                className='mt-1'
                rows={4}
              />
              <p className='text-xs text-gray-500 mt-1 text-right'>
                {productData.description?.length || 0}/2000 ký tự
              </p>
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
                <Label className='text-sm font-medium mb-2 block'>Ảnh hiện tại</Label>
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
              <Label className='text-sm font-medium mb-2 block'>Ảnh sản phẩm mới</Label>
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
            </div>

            {/* Remove Existing Video */}
            <div>
              <Label className='text-sm font-medium mb-2 block'>Video sản phẩm</Label>
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
                          handleMediaChange('newProductVideo', e.target.files[0])
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
                          handleMediaChange('newProductVideo', e.target.files[0])
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
