import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Upload, Video, Image as ImageIcon, Trash2, X, Loader2 } from 'lucide-react'
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
    setMediaData((prev) => ({
      ...prev,
      productImages: [...prev.productImages, ...newFiles]
    }))
  }

  const handleDetailInputChange = (field: string, value: string) => {
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

      if (!productDetailData.name.trim()) {
        toast.error('Vui lòng nhập tên sản phẩm')
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
        provinceId: product.provinceId || 0,
        description: productDetailData.description || undefined,
        material: productDetailData.material || undefined,
        productImages: mediaData.productImages.length > 0 ? mediaData.productImages : undefined,
        productVideo: mediaData.productVideo || undefined,
        hashtagIds: hashtagIds
      }

      const response = await productApi.createDetail(formData)

      if (response.status === 200 && response.data) {
        toast.success('Tạo sản phẩm chi tiết thành công!')
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
        // Call success callback
        onSuccess()
      } else {
        toast.error('Không thể tạo sản phẩm chi tiết')
      }
    } catch (error: unknown) {
      console.error('Error creating product detail:', error)

      // Extract error message from backend response
      let errorMessage = 'Có lỗi xảy ra khi tạo sản phẩm chi tiết'

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
              <Label htmlFor='detail-name' className='text-sm font-medium'>
                Tên sản phẩm <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='detail-name'
                placeholder='Nhập tên sản phẩm...'
                value={productDetailData.name}
                onChange={(e) => handleDetailInputChange('name', e.target.value)}
                className='mt-1'
              />
            </div>

            <div>
              <Label htmlFor='detail-description' className='text-sm font-medium'>
                Mô tả chi tiết
              </Label>
              <Textarea
                id='detail-description'
                placeholder='Mô tả chi tiết về sản phẩm...'
                value={productDetailData.description}
                onChange={(e) => handleDetailInputChange('description', e.target.value)}
                className='mt-1 min-h-[100px]'
              />
            </div>

            <div>
              <Label htmlFor='detail-material' className='text-sm font-medium'>
                Material
              </Label>
              <Input
                id='detail-material'
                placeholder='Nhập material...'
                value={productDetailData.material}
                onChange={(e) => handleDetailInputChange('material', e.target.value)}
                className='mt-1'
              />
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
                    className={`flex items-start space-x-3 p-2 rounded-md cursor-pointer transition-colors ${
                      productDetailData.categoryId === category.id
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
            <Label className='text-sm font-medium'>Hình ảnh sản phẩm</Label>
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
            <Label className='text-sm font-medium'>Video sản phẩm</Label>
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
                {mediaData.productVideo ? 'Thay đổi video' : 'Chọn video'}
              </Button>
            </div>

            {mediaData.productVideo && (
              <div className='mt-4'>
                <div className='flex items-center justify-between mb-2'>
                  <p className='text-sm font-medium text-gray-700'>Video đã chọn:</p>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setMediaData((prev) => ({ ...prev, productVideo: null }))}
                    className='text-red-600 hover:text-red-700'
                  >
                    <Trash2 className='w-4 h-4 mr-1' />
                    Xóa
                  </Button>
                </div>
                <div className='aspect-video rounded-lg overflow-hidden border bg-black'>
                  <video src={createPreviewUrl(mediaData.productVideo)} controls className='w-full h-full' />
                </div>
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
