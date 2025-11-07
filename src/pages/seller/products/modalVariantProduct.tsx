import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import { productVariantApi, type CreateVariantRequest } from '../../../apis/productVariant.api'
import { toast } from '../../../utils/toast'
import type { Product, VariantOption } from '../../../types/productType'

interface ModalVariantProductProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  parentId: string | undefined
  selectedParentVariant?: VariantOption | null
  onSuccess: () => void
}

export default function ModalVariantProduct({
  open,
  onOpenChange,
  product,
  parentId,
  selectedParentVariant,
  onSuccess
}: ModalVariantProductProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [variantData, setVariantData] = useState({
    attributeName: '',
    attributeType: '',
    price: 0,
    quantity: 0,
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    description: ''
  })

  const [variantImages, setVariantImages] = useState<File[]>([])

  const [hasAutoAttributeType, setHasAutoAttributeType] = useState(false)
  const [attributeTypeError, setAttributeTypeError] = useState<string>('')

  // Auto-set attributeType when dialog opens (chỉ khi variant cha đã có con)
  useEffect(() => {
    if (open) {
      // Find attributeType from existing variants
      let autoAttributeType = ''

      if (product?.variantGroups) {
        // Case 1: Tạo variant con từ variant cha
        if (selectedParentVariant) {
          // Kiểm tra xem variant cha đã có con chưa
          const hasExistingChildren =
            selectedParentVariant.childVariantGroups &&
            Array.isArray(selectedParentVariant.childVariantGroups) &&
            selectedParentVariant.childVariantGroups.length > 0 &&
            selectedParentVariant.childVariantGroups[0].options &&
            selectedParentVariant.childVariantGroups[0].options.length > 0

          if (hasExistingChildren && selectedParentVariant.childVariantGroups) {
            // Variant cha đã có con → auto-set attributeType theo con đầu tiên
            const childGroups = selectedParentVariant.childVariantGroups
            autoAttributeType = childGroups[0].attributeType
          }
          // Nếu variant cha chưa có con → không auto-set, cho phép nhập tự do
        }
        // Case 2: Tạo variant cấp 1 (không có parent variant)
        else if (product.variantGroups.length > 0 && product.variantGroups[0].options.length > 0) {
          // Lấy attributeType từ variantGroups đầu tiên
          autoAttributeType = product.variantGroups[0].attributeType
        }
      }

      if (autoAttributeType) {
        setHasAutoAttributeType(true)
        setVariantData((prev) => ({
          ...prev,
          attributeType: autoAttributeType
        }))
      } else {
        setHasAutoAttributeType(false)
        // Reset attributeType nếu không auto-set
        setVariantData((prev) => ({
          ...prev,
          attributeType: ''
        }))
      }

      // Reset attributeName - luôn cho phép nhập tự do, không auto-set
      setVariantData((prev) => ({
        ...prev,
        attributeName: ''
      }))
    }
  }, [open, product, selectedParentVariant])

  // Helper function to find parent variant's attributeType
  const getParentVariantAttributeType = (): string | null => {
    if (!product?.variantGroups || !selectedParentVariant) {
      return null
    }

    // Tìm variant cha trong product.variantGroups
    for (const group of product.variantGroups) {
      const foundVariant = group.options.find((option) => option.id === selectedParentVariant.id)
      if (foundVariant) {
        // Trả về attributeType của VariantGroup chứa variant cha
        return group.attributeType
      }
    }

    return null
  }

  // Helper functions
  const createPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file)
  }

  const removeVariantImage = (indexToRemove: number) => {
    setVariantImages((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const addVariantImages = (newFiles: File[]) => {
    setVariantImages((prev) => [...prev, ...newFiles])
  }

  const handleVariantInputChange = (field: string, value: string | number) => {
    // Clear error when user starts typing
    if (field === 'attributeType') {
      setAttributeTypeError('')
    }

    setVariantData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  // Validate attributeType không trùng với variant cha
  const validateAttributeType = (attributeType: string): boolean => {
    // Chỉ validate khi tạo variant con (có selectedParentVariant)
    if (!selectedParentVariant) {
      return true
    }

    const parentAttributeType = getParentVariantAttributeType()
    if (!parentAttributeType) {
      return true
    }

    // So sánh không phân biệt hoa thường
    if (attributeType.trim().toLowerCase() === parentAttributeType.trim().toLowerCase()) {
      setAttributeTypeError(
        `Loại thuộc tính không được trùng với loại thuộc tính của variant cha (${parentAttributeType})`
      )
      return false
    }

    setAttributeTypeError('')
    return true
  }

  const handleCreateProductVariant = async () => {
    try {
      setIsSubmitting(true)

      if (!product || !parentId) {
        toast.error('Không tìm thấy thông tin sản phẩm gốc')
        return
      }

      if (!variantData.attributeName.trim()) {
        toast.error('Vui lòng nhập tên thuộc tính (ví dụ: Đỏ, 100ml)')
        return
      }

      if (!variantData.attributeType.trim()) {
        toast.error('Vui lòng nhập loại thuộc tính (ví dụ: Màu sắc, Dung tích)')
        return
      }

      // Validate attributeType không trùng với variant cha
      if (selectedParentVariant && !validateAttributeType(variantData.attributeType)) {
        toast.error(attributeTypeError || 'Loại thuộc tính không được trùng với loại thuộc tính của variant cha')
        return
      }

      // Validate price và quantity cho cả variant cha và variant con
      if (variantData.price <= 0) {
        toast.error('Vui lòng nhập giá bán hợp lệ')
        return
      }

      if (variantData.quantity < 0) {
        toast.error('Vui lòng nhập số lượng tồn kho hợp lệ')
        return
      }

      // Prepare form data theo cấu trúc API yêu cầu
      const formData: CreateVariantRequest = {
        StoreId: product.storeId,
        ParentId: parentId,
        AttributeName: variantData.attributeName,
        AttributeType: variantData.attributeType,
        Description: variantData.description || undefined,
        ProductImages: variantImages.length > 0 ? variantImages : undefined,
        // Gửi đầy đủ SkuDetails cho cả variant cha và variant con
        SkuDetails: {
          Weight: variantData.weight > 0 ? variantData.weight : undefined,
          BasePrice: variantData.price,
          Length: variantData.length > 0 ? variantData.length : undefined,
          Height: variantData.height > 0 ? variantData.height : undefined,
          Quantity: variantData.quantity,
          Width: variantData.width > 0 ? variantData.width : undefined
        }
      }

      const response = await productVariantApi.create(formData)

      if (response) {
        toast.success('Tạo product variant thành công!')
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error('Không thể tạo product variant')
      }
    } catch (error: unknown) {
      console.error('Error creating product variant:', error)

      // Extract error message from backend response
      let errorMessage = 'Có lỗi xảy ra khi tạo product variant'

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
      setVariantData({
        attributeName: '',
        attributeType: '',
        price: 0,
        quantity: 0,
        length: 0,
        width: 0,
        height: 0,
        weight: 0,
        description: ''
      })
      setVariantImages([])
      setHasAutoAttributeType(false)
      setAttributeTypeError('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Tạo Product Variant</DialogTitle>
        </DialogHeader>

        <div className='space-y-6 mt-4'>
          {/* Basic Information */}
          <div className='space-y-4'>
            {/* Attribute Type */}
            {hasAutoAttributeType ? (
              <div>
                <Label htmlFor='variant-attribute-type' className='text-sm font-medium'>
                  Loại thuộc tính <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='variant-attribute-type'
                  placeholder='Ví dụ: Màu sắc, Dung tích, Kích thước...'
                  value={variantData.attributeType}
                  onChange={(e) => {
                    handleVariantInputChange('attributeType', e.target.value)
                    // Validate real-time khi người dùng nhập (ngay cả khi readOnly bị override)
                    if (selectedParentVariant) {
                      validateAttributeType(e.target.value)
                    }
                  }}
                  className={`mt-1 bg-gray-100 ${attributeTypeError ? 'border-red-500' : ''}`}
                  readOnly
                />
                {attributeTypeError && <p className='mt-1 text-sm text-red-500'>{attributeTypeError}</p>}
                {selectedParentVariant && (
                  <p className='mt-1 text-xs text-gray-500'>
                    Loại thuộc tính của variant cha:{' '}
                    <span className='font-medium'>{getParentVariantAttributeType()}</span>
                  </p>
                )}
              </div>
            ) : (
              <div>
                <Label htmlFor='variant-attribute-type' className='text-sm font-medium'>
                  Loại thuộc tính <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='variant-attribute-type'
                  placeholder='Ví dụ: Màu sắc, Dung tích, Kích thước...'
                  value={variantData.attributeType}
                  onChange={(e) => {
                    handleVariantInputChange('attributeType', e.target.value)
                    // Validate real-time khi người dùng nhập
                    if (selectedParentVariant) {
                      validateAttributeType(e.target.value)
                    }
                  }}
                  onBlur={() => {
                    // Validate khi người dùng rời khỏi input
                    if (selectedParentVariant && variantData.attributeType.trim()) {
                      validateAttributeType(variantData.attributeType)
                    }
                  }}
                  className={`mt-1 ${attributeTypeError ? 'border-red-500' : ''}`}
                />
                {attributeTypeError && <p className='mt-1 text-sm text-red-500'>{attributeTypeError}</p>}
                {selectedParentVariant && (
                  <p className='mt-1 text-xs text-gray-500'>
                    Loại thuộc tính của variant cha:{' '}
                    <span className='font-medium'>{getParentVariantAttributeType()}</span>
                  </p>
                )}
              </div>
            )}

            {/* Attribute Name - Luôn cho phép nhập tự do */}
            <div>
              <Label htmlFor='variant-attribute-name' className='text-sm font-medium'>
                Tên thuộc tính <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='variant-attribute-name'
                placeholder='Ví dụ: Đỏ, 100ml, X, XL...'
                value={variantData.attributeName}
                onChange={(e) => handleVariantInputChange('attributeName', e.target.value)}
                className='mt-1'
              />
            </div>

            {/* Price - Hiển thị cho cả variant cha và variant con */}
            <div>
              <Label htmlFor='variant-price' className='text-sm font-medium'>
                Giá bán (VNĐ) <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='variant-price'
                type='number'
                placeholder='Nhập giá bán...'
                value={variantData.price || ''}
                onChange={(e) => handleVariantInputChange('price', Number(e.target.value))}
                className='mt-1'
              />
            </div>

            {/* Quantity - Hiển thị cho cả variant cha và variant con */}
            <div>
              <Label htmlFor='variant-quantity' className='text-sm font-medium'>
                Số lượng tồn kho <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='variant-quantity'
                type='number'
                placeholder='Nhập số lượng tồn kho...'
                value={variantData.quantity || ''}
                onChange={(e) => handleVariantInputChange('quantity', Number(e.target.value))}
                className='mt-1'
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor='variant-description' className='text-sm font-medium'>
                Mô tả
              </Label>
              <Textarea
                id='variant-description'
                placeholder='Mô tả về loại sản phẩm...'
                value={variantData.description}
                onChange={(e) => handleVariantInputChange('description', e.target.value)}
                className='mt-1 min-h-[100px]'
              />
            </div>
          </div>

          {/* Dimensions - Hiển thị cho cả variant cha và variant con */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between mb-2'>
              <Label className='text-sm font-medium'>Kích thước (cm)</Label>
              <span className='text-xs text-gray-500'>Tùy chọn</span>
            </div>
            <div className='grid grid-cols-3 gap-4'>
              {/* Length */}
              <div>
                <Label htmlFor='variant-length' className='text-sm font-medium'>
                  Chiều dài
                </Label>
                <Input
                  id='variant-length'
                  type='number'
                  placeholder='cm'
                  value={variantData.length || ''}
                  onChange={(e) => handleVariantInputChange('length', Number(e.target.value))}
                  className='mt-1'
                />
              </div>

              {/* Width */}
              <div>
                <Label htmlFor='variant-width' className='text-sm font-medium'>
                  Chiều rộng
                </Label>
                <Input
                  id='variant-width'
                  type='number'
                  placeholder='cm'
                  value={variantData.width || ''}
                  onChange={(e) => handleVariantInputChange('width', Number(e.target.value))}
                  className='mt-1'
                />
              </div>

              {/* Height */}
              <div>
                <Label htmlFor='variant-height' className='text-sm font-medium'>
                  Chiều cao
                </Label>
                <Input
                  id='variant-height'
                  type='number'
                  placeholder='cm'
                  value={variantData.height || ''}
                  onChange={(e) => handleVariantInputChange('height', Number(e.target.value))}
                  className='mt-1'
                />
              </div>
            </div>

            {/* Weight */}
            <div>
              <Label htmlFor='variant-weight' className='text-sm font-medium'>
                Trọng lượng (g)
              </Label>
              <Input
                id='variant-weight'
                type='number'
                placeholder='gram'
                value={variantData.weight || ''}
                onChange={(e) => handleVariantInputChange('weight', Number(e.target.value))}
                className='mt-1'
              />
            </div>
          </div>

          {/* Variant Images */}
          <div>
            <Label className='text-sm font-medium'>Hình ảnh variant</Label>
            <div
              className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer'
              onClick={() => document.getElementById('variant-images')?.click()}
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
                  addVariantImages(files)
                }
              }}
            >
              <ImageIcon className='w-10 h-10 text-gray-400 mx-auto mb-3' />
              <p className='text-gray-600 mb-2'>
                {variantImages.length > 0 ? 'Thêm ảnh khác' : 'Kéo thả hoặc click để tải ảnh lên'}
              </p>
              <input
                type='file'
                multiple
                accept='image/*'
                className='hidden'
                id='variant-images'
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  if (files.length > 0) {
                    addVariantImages(files)
                  }
                  e.target.value = ''
                }}
              />
              <Button type='button' variant='outline' size='sm' className='mt-3'>
                <Upload className='w-4 h-4 mr-2' />
                {variantImages.length > 0 ? 'Thêm ảnh' : 'Chọn ảnh'}
              </Button>
            </div>

            {variantImages.length > 0 && (
              <div className='mt-4 grid grid-cols-4 gap-2'>
                {variantImages.map((file, index) => (
                  <div key={`${file.name}-${index}`} className='relative group'>
                    <div className='aspect-square rounded-lg overflow-hidden border-2 border-gray-200'>
                      <img
                        src={createPreviewUrl(file)}
                        alt={`Variant ${index + 1}`}
                        className='w-full h-full object-cover'
                      />
                    </div>
                    <button
                      type='button'
                      onClick={() => removeVariantImage(index)}
                      className='absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all'
                    >
                      <X className='w-3 h-3' />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={handleCreateProductVariant}
            disabled={isSubmitting}
            className='bg-green-600 hover:bg-green-700'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Đang tạo...
              </>
            ) : (
              'Tạo Product Variant'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
