import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Loader2, Upload, Image as ImageIcon, X } from 'lucide-react'
import { productVariantApi, type UpdateVariantRequest } from '../../../apis/productVariant.api'
import { getSystemStorageByName } from '../../../apis/systemStorage.api'
import { toast } from '../../../utils/toast'
import type { Product, VariantOption } from '../../../types/productType'

interface ModalEditVariantProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  variant: VariantOption | null
  parentVariant: VariantOption | null // Nhóm tùy chọn nếu đây là phiên bản bán được
  onSuccess: () => void
}

export default function ModalEditVariant({
  open,
  onOpenChange,
  product,
  variant,
  parentVariant,
  onSuccess
}: ModalEditVariantProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Xác định xem có phải nhóm tùy chọn không
  const isParentVariant = !parentVariant

  // Validation errors
  const [attributeNameError, setAttributeNameError] = useState<string>('')
  const [priceError, setPriceError] = useState<string>('')
  const [quantityError, setQuantityError] = useState<string>('')
  const [lengthError, setLengthError] = useState<string>('')
  const [widthError, setWidthError] = useState<string>('')
  const [heightError, setHeightError] = useState<string>('')
  const [weightError, setWeightError] = useState<string>('')

  // Constants for validation
  const MAX_ATTRIBUTE_NAME_LENGTH = 25
  const MIN_ATTRIBUTE_NAME_LENGTH = 1
  const MAX_DIMENSION = 200 // cm
  const MAX_WEIGHT = 50000 // gram (50kg)

  const [variantData, setVariantData] = useState({
    attributeName: '',
    attributeType: '',
    basePrice: 0,
    quantity: 0,
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    isActive: true
  })
  const [commissionRate, setCommissionRate] = useState<number>(0)
  const [commissionLoading, setCommissionLoading] = useState(false)
  const [commissionError, setCommissionError] = useState<string>('')
  const [newProductImage, setNewProductImage] = useState<File | null>(null)
  const [removeExistingImage, setRemoveExistingImage] = useState<boolean>(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const extractCommissionValue = useCallback((payload: unknown): number => {
    if (!payload) return NaN

    const toNumber = (value: unknown) => {
      if (value === null || value === undefined) return NaN
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : NaN
    }

    if (Array.isArray(payload)) {
      const target =
        payload.find(
          (item) =>
            item &&
            typeof item === 'object' &&
            'name' in item &&
            typeof (item as { name: string }).name === 'string' &&
            ((item as { name: string }).name.toLowerCase() === 'commission' ||
              (item as { name: string }).name.toLowerCase() === 'commissionrate')
        ) || payload[0]
      return extractCommissionValue(target)
    }

    if (typeof payload === 'object') {
      const obj = payload as Record<string, unknown>
      if ('value' in obj) {
        return toNumber(obj.value)
      }
      if ('data' in obj) {
        const nested = extractCommissionValue(obj.data)
        if (!Number.isNaN(nested)) return nested
      }
      if ('items' in obj) {
        const nested = extractCommissionValue(obj.items)
        if (!Number.isNaN(nested)) return nested
      }
    }

    return NaN
  }, [])

  useEffect(() => {
    if (!open) return
    let isCancelled = false

    const fetchCommission = async () => {
      try {
        setCommissionLoading(true)
        setCommissionError('')
        const response = await getSystemStorageByName('commission')
        const payload = response?.data ?? response
        const parsedValue = extractCommissionValue(payload)
        if (!isCancelled) {
          setCommissionRate(Number.isFinite(parsedValue) ? parsedValue : 0)
        }
      } catch (error) {
        console.error('Error fetching commission:', error)
        if (!isCancelled) {
          setCommissionError('Không thể tải tỷ lệ hoa hồng, dùng mặc định 0%.')
          setCommissionRate(0)
        }
      } finally {
        if (!isCancelled) {
          setCommissionLoading(false)
        }
      }
    }

    fetchCommission()

    return () => {
      isCancelled = true
    }
  }, [open, extractCommissionValue])

  const computeSalePrice = (basePrice: number, rate: number) => {
    if (basePrice <= 0) return 0
    const multiplier = 1 + rate / 100
    return Math.round(basePrice * multiplier)
  }

  const formatCurrency = (value: number) => {
    if (!value) return '0 đ'
    return `${value.toLocaleString('vi-VN')} đ`
  }

  // Load data khi mở dialog
  useEffect(() => {
    if (open && variant) {
      setVariantData({
        attributeName: variant.attributeName || '',
        attributeType: '', // Sẽ lấy từ getAttributeTypeForVariant()
        basePrice: variant.basePrice || 0,
        quantity: variant.quantity || 0,
        length: variant.length || 0,
        width: variant.width || 0,
        height: variant.height || 0,
        weight: variant.weight || 0,
        isActive: variant.isActive ?? true
      })
      // Reset image states
      setNewProductImage(null)
      setRemoveExistingImage(false)
      setImagePreview(null)
      // Set preview for existing image if available
      if (variant.productImages && variant.productImages.length > 0) {
        setImagePreview(variant.productImages[0])
      }
    }
  }, [open, variant])

  const variantHasChildren = (variantOption?: VariantOption | null) =>
    Array.isArray(variantOption?.childVariantGroups) && variantOption.childVariantGroups.length > 0

  // Helper để lấy attributeType từ variantGroup
  const getAttributeTypeForVariant = (): string | null => {
    if (!product?.variantGroups || !variant) return null
    for (const group of product.variantGroups) {
      const found = group.options.find((opt) => opt.id === variant.id)
      if (found) return group.attributeType
    }
    // Nếu là phiên bản bán được, lấy từ childVariantGroups của nhóm tùy chọn
    if (parentVariant?.childVariantGroups) {
      for (const childGroup of parentVariant.childVariantGroups) {
        const found = childGroup.options.find((opt) => opt.id === variant.id)
        if (found) return childGroup.attributeType
      }
    }
    return null
  }

  const handleVariantInputChange = (field: string, value: string | number | boolean) => {
    // Clear errors when user starts typing
    if (field === 'attributeName') {
      setAttributeNameError('')
      const stringValue = value as string
      if (stringValue.length > MAX_ATTRIBUTE_NAME_LENGTH) {
        setAttributeNameError(`Tên thuộc tính chỉ được tối đa ${MAX_ATTRIBUTE_NAME_LENGTH} ký tự.`)
        return
      }
    }

    if (field === 'basePrice') {
      setPriceError('')
      const numValue = value as number
      if (numValue < 0) {
        setPriceError('Giá bán không được là số âm')
        return
      }
    }

    if (field === 'quantity') {
      setQuantityError('')
      const numValue = value as number
      if (numValue < 0) {
        setQuantityError('Số lượng tồn kho không được là số âm')
        return
      }
    }

    if (field === 'length') {
      setLengthError('')
      const numValue = value as number
      if (numValue > MAX_DIMENSION) {
        setLengthError(`Chiều dài không được vượt quá ${MAX_DIMENSION} cm`)
      }
    }

    if (field === 'width') {
      setWidthError('')
      const numValue = value as number
      if (numValue > MAX_DIMENSION) {
        setWidthError(`Chiều rộng không được vượt quá ${MAX_DIMENSION} cm`)
      }
    }

    if (field === 'height') {
      setHeightError('')
      const numValue = value as number
      if (numValue > MAX_DIMENSION) {
        setHeightError(`Chiều cao không được vượt quá ${MAX_DIMENSION} cm`)
      }
    }

    if (field === 'weight') {
      setWeightError('')
      const numValue = value as number
      if (numValue > MAX_WEIGHT) {
        setWeightError(`Trọng lượng không được vượt quá ${MAX_WEIGHT} gram (50kg)`)
      }
    }

    // Prevent negative values for numeric fields
    if (
      typeof value === 'number' &&
      value < 0 &&
      (field === 'length' || field === 'width' || field === 'height' || field === 'weight')
    ) {
      return
    }

    setVariantData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const parentHasChildren = isParentVariant && variantHasChildren(variant)
  const canEditFullFields = !isParentVariant || !parentHasChildren

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    processImageFile(file)
  }

  // Process image file (used by both upload and drag-drop)
  const processImageFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File phải là hình ảnh')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File quá lớn. Tối đa 5MB.')
      return
    }

    setNewProductImage(file)
    setImagePreview(URL.createObjectURL(file))
    setRemoveExistingImage(false) // Reset remove flag when uploading new image
  }

  // Handle remove image
  const handleRemoveImage = () => {
    setNewProductImage(null)
    setImagePreview(null)
    setRemoveExistingImage(true)
  }

  // Handle remove new image (before upload)
  const handleRemoveNewImage = () => {
    setNewProductImage(null)
    // Restore existing image preview if available
    if (variant?.productImages && variant.productImages.length > 0 && !removeExistingImage) {
      setImagePreview(variant.productImages[0])
    } else {
      setImagePreview(null)
    }
  }

  const handleUpdateVariant = async () => {
    try {
      setIsSubmitting(true)

      if (!variant || !product) {
        toast.error('Không tìm thấy thông tin variant')
        return
      }

      // Xác định parentId
      let parentIdForUpdate = product.id
      if (parentVariant) {
        parentIdForUpdate = parentVariant.id
      }

      // Validate
      if (!canEditFullFields) {
        // Nhóm tùy chọn có phiên bản con: chỉ kiểm tra tên & mô tả
        if (!variantData.attributeName.trim()) {
          toast.error('Vui lòng nhập tên thuộc tính')
          setAttributeNameError('Vui lòng nhập tên thuộc tính')
          return
        }

        if (variantData.attributeName.trim().length < MIN_ATTRIBUTE_NAME_LENGTH) {
          toast.error('Tên thuộc tính phải có ít nhất 1 ký tự')
          setAttributeNameError('Tên thuộc tính phải có ít nhất 1 ký tự')
          return
        }

        if (variantData.attributeName.trim().length > MAX_ATTRIBUTE_NAME_LENGTH) {
          toast.error(`Tên thuộc tính chỉ được tối đa ${MAX_ATTRIBUTE_NAME_LENGTH} ký tự`)
          setAttributeNameError(`Tên thuộc tính chỉ được tối đa ${MAX_ATTRIBUTE_NAME_LENGTH} ký tự`)
          return
        }
      } else {
        // Phiên bản bán được hoặc nhóm tùy chọn chưa có con: kiểm tra đầy đủ
        if (!variantData.attributeName.trim()) {
          toast.error('Vui lòng nhập tên thuộc tính')
          setAttributeNameError('Vui lòng nhập tên thuộc tính')
          return
        }

        if (variantData.attributeName.trim().length < MIN_ATTRIBUTE_NAME_LENGTH) {
          toast.error('Tên thuộc tính phải có ít nhất 1 ký tự')
          setAttributeNameError('Tên thuộc tính phải có ít nhất 1 ký tự')
          return
        }

        if (variantData.attributeName.trim().length > MAX_ATTRIBUTE_NAME_LENGTH) {
          toast.error(`Tên thuộc tính chỉ được tối đa ${MAX_ATTRIBUTE_NAME_LENGTH} ký tự`)
          setAttributeNameError(`Tên thuộc tính chỉ được tối đa ${MAX_ATTRIBUTE_NAME_LENGTH} ký tự`)
          return
        }

        if (variantData.basePrice < 0) {
          toast.error('Giá bán không được là số âm')
          setPriceError('Giá bán không được là số âm')
          return
        }

        if (variantData.basePrice === 0) {
          toast.error('Vui lòng nhập giá bán hợp lệ (lớn hơn 0)')
          setPriceError('Vui lòng nhập giá bán hợp lệ (lớn hơn 0)')
          return
        }

        if (variantData.quantity < 0) {
          toast.error('Số lượng tồn kho không được là số âm')
          setQuantityError('Số lượng tồn kho không được là số âm')
          return
        }
        // Validate dimensions
        if (variantData.length > MAX_DIMENSION) {
          toast.error(`Chiều dài không được vượt quá ${MAX_DIMENSION} cm`)
          setLengthError(`Chiều dài không được vượt quá ${MAX_DIMENSION} cm`)
          return
        }

        if (variantData.width > MAX_DIMENSION) {
          toast.error(`Chiều rộng không được vượt quá ${MAX_DIMENSION} cm`)
          setWidthError(`Chiều rộng không được vượt quá ${MAX_DIMENSION} cm`)
          return
        }

        if (variantData.height > MAX_DIMENSION) {
          toast.error(`Chiều cao không được vượt quá ${MAX_DIMENSION} cm`)
          setHeightError(`Chiều cao không được vượt quá ${MAX_DIMENSION} cm`)
          return
        }

        // Validate weight
        if (variantData.weight > MAX_WEIGHT) {
          toast.error(`Trọng lượng không được vượt quá ${MAX_WEIGHT} gram (50kg)`)
          setWeightError(`Trọng lượng không được vượt quá ${MAX_WEIGHT} gram (50kg)`)
          return
        }
      }

      // Prepare update data
      const updateData: UpdateVariantRequest = {}

      if (!canEditFullFields) {
        // Nhóm tùy chọn có con: chỉ gửi attributeName
        updateData.attributeName = variantData.attributeName
      } else {
        // Phiên bản bán được hoặc nhóm tùy chọn chưa có con: gửi đầy đủ
        const attributeType = getAttributeTypeForVariant()
        if (attributeType) {
          updateData.attributeType = attributeType
        }
        updateData.attributeName = variantData.attributeName
        updateData.basePrice = variantData.basePrice
        updateData.quantity = variantData.quantity
        updateData.isActive = variantData.isActive

        if (variantData.weight > 0) {
          updateData.weight = variantData.weight
        }
        if (variantData.length > 0) {
          updateData.length = variantData.length
        }
        if (variantData.width > 0) {
          updateData.width = variantData.width
        }
        if (variantData.height > 0) {
          updateData.height = variantData.height
        }

        // Handle image update
        if (newProductImage) {
          updateData.newProductImage = newProductImage
        }
        if (removeExistingImage) {
          updateData.removeExistingImage = removeExistingImage
        }
      }

      await productVariantApi.update(parentIdForUpdate, variant.id, updateData)

      toast.success('Cập nhật variant thành công!')
      onSuccess()
      onOpenChange(false)
    } catch (error: unknown) {
      console.error('Error updating variant:', error)

      // Extract error message from backend response
      let errorMessage = 'Có lỗi xảy ra khi cập nhật variant'

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
        basePrice: 0,
        quantity: 0,
        length: 0,
        width: 0,
        height: 0,
        weight: 0,
        isActive: true
      })
      setAttributeNameError('')
      setPriceError('')
      setQuantityError('')
      setLengthError('')
      setWidthError('')
      setHeightError('')
      setWeightError('')
      setNewProductImage(null)
      setRemoveExistingImage(false)
      setImagePreview(null)
    }
  }

  if (!variant) return null

  const attributeType = getAttributeTypeForVariant()

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa biến thể sản phẩm</DialogTitle>
        </DialogHeader>

        <div className='space-y-6 mt-4'>
          {/* Basic Information */}
          <div className='space-y-4'>
            {/* Attribute Type */}
            {attributeType && (!isParentVariant || !parentHasChildren) && (
              <div>
                <Label htmlFor='edit-attribute-type' className='text-sm font-medium'>
                  Loại thuộc tính
                </Label>
                <Input id='edit-attribute-type' value={attributeType} className='mt-1 bg-gray-100' readOnly />
              </div>
            )}

            {/* Attribute Name */}
            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label htmlFor='edit-attribute-name' className='text-sm font-medium'>
                  Tên thuộc tính <span className='text-red-500'>*</span>
                </Label>
                <span
                  className={`text-xs ${variantData.attributeName.length > MAX_ATTRIBUTE_NAME_LENGTH ? 'text-red-500' : 'text-gray-500'
                    }`}
                >
                  {variantData.attributeName.length} / {MAX_ATTRIBUTE_NAME_LENGTH} ký tự
                </span>
              </div>
              <Input
                id='edit-attribute-name'
                placeholder='Ví dụ: Đỏ, 100ml, X, XL...'
                value={variantData.attributeName}
                onChange={(e) => handleVariantInputChange('attributeName', e.target.value)}
                maxLength={MAX_ATTRIBUTE_NAME_LENGTH}
                className={`mt-1 ${attributeNameError ? 'border-red-500' : ''}`}
              />
              {attributeNameError && <p className='mt-1 text-sm text-red-500'>{attributeNameError}</p>}
            </div>

            {/* Price */}
            {canEditFullFields && (
              <div>
                <Label htmlFor='edit-price' className='text-sm font-medium'>
                  Giá cửa hàng thu về (đ) <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='edit-price'
                  type='number'
                  min='0'
                  step='1000'
                  placeholder='Nhập giá cửa hàng thu về...'
                  value={variantData.basePrice || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : Number(e.target.value)
                    if (value >= 0) {
                      handleVariantInputChange('basePrice', value)
                    }
                  }}
                  className={`mt-1 ${priceError ? 'border-red-500' : ''}`}
                />
                {priceError && <p className='mt-1 text-sm text-red-500'>{priceError}</p>}
                <p className='mt-1 text-xs text-gray-500'>
                  {`Nhập giá gốc. Hệ thống sẽ áp dụng hoa hồng ${commissionLoading ? '...' : `${commissionRate}%`} để tính giá bán ra.`}
                </p>
                <div className='mt-4'>
                  <Label className='text-sm font-medium'>Giá bán trên sàn dự kiến (đ)</Label>
                  <Input
                    value={formatCurrency(computeSalePrice(variantData.basePrice, commissionRate))}
                    readOnly
                    className='mt-1 bg-gray-100'
                  />

                  {commissionError && <p className='mt-1 text-sm text-amber-600'>{commissionError}</p>}
                </div>
              </div>
            )}

            {/* Quantity */}
            {canEditFullFields && (
              <div>
                <Label htmlFor='edit-quantity' className='text-sm font-medium'>
                  Số lượng tồn kho <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='edit-quantity'
                  type='number'
                  min='0'
                  placeholder='Nhập số lượng tồn kho...'
                  value={variantData.quantity || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : Number(e.target.value)
                    if (value >= 0) {
                      handleVariantInputChange('quantity', value)
                    }
                  }}
                  className={`mt-1 ${quantityError ? 'border-red-500' : ''}`}
                />
                {quantityError && <p className='mt-1 text-sm text-red-500'>{quantityError}</p>}
              </div>
            )}

            {/* Description */}
            {/* <div>
              <div className='flex items-center justify-between mb-1'>
                <Label htmlFor='edit-description' className='text-sm font-medium'>
                  Mô tả
                </Label>
                <span
                  className={`text-xs ${countWords(variantData.description) > MAX_DESCRIPTION_WORDS ? 'text-red-500' : 'text-gray-500'
                    }`}
                >
                  {countWords(variantData.description)} / {MAX_DESCRIPTION_WORDS} từ
                </span>
              </div>
              <Textarea
                id='edit-description'
                placeholder='Mô tả về loại sản phẩm...'
                value={variantData.description}
                onChange={(e) => handleVariantInputChange('description', e.target.value)}
                className={`mt-1 min-h-[100px] ${descriptionError ? 'border-red-500' : ''}`}
              />
              {descriptionError && <p className='mt-1 text-sm text-red-500'>{descriptionError}</p>}
            </div> */}

            {/* Image Upload */}
            {canEditFullFields && (
              <div>
                <Label className='text-sm font-medium'>Hình ảnh variant</Label>
                <div className='mt-2 space-y-4'>
                  {/* Current/Preview Image */}
                  {imagePreview && (
                    <div className='relative inline-block'>
                      <div className='w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200'>
                        <img src={imagePreview} alt='Variant preview' className='w-full h-full object-cover' />
                      </div>
                      <button
                        type='button'
                        onClick={newProductImage ? handleRemoveNewImage : handleRemoveImage}
                        className='absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-all'
                      >
                        <X className='w-4 h-4' />
                      </button>
                      {newProductImage && <p className='mt-1 text-xs text-green-600'>Ảnh mới đã chọn</p>}
                    </div>
                  )}

                  {/* Upload Area */}
                  {!imagePreview && (
                    <div
                      className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer'
                      onClick={() => document.getElementById('edit-variant-image')?.click()}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.add('border-blue-400')
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('border-blue-400')
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.remove('border-blue-400')
                        const files = Array.from(e.dataTransfer.files)
                        if (files.length > 0) {
                          processImageFile(files[0])
                        }
                      }}
                    >
                      <ImageIcon className='w-10 h-10 text-gray-400 mx-auto mb-3' />
                      <p className='text-gray-600 mb-2'>Kéo thả hoặc click để tải ảnh lên</p>
                      <input
                        type='file'
                        id='edit-variant-image'
                        accept='image/*'
                        className='hidden'
                        onChange={handleImageUpload}
                      />
                      <Button type='button' variant='outline' size='sm' className='mt-3'>
                        <Upload className='w-4 h-4 mr-2' />
                        Chọn ảnh
                      </Button>
                      <p className='text-xs text-gray-500 mt-2'>Tối đa 5MB, định dạng: JPG, PNG, WEBP</p>
                    </div>
                  )}

                  {/* Upload New Image Button (when existing image is shown) */}
                  {imagePreview && !newProductImage && (
                    <div>
                      <input
                        type='file'
                        id='edit-variant-image'
                        accept='image/*'
                        className='hidden'
                        onChange={handleImageUpload}
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => document.getElementById('edit-variant-image')?.click()}
                      >
                        <Upload className='w-4 h-4 mr-2' />
                        Thay đổi ảnh
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dimensions */}
          {canEditFullFields && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between mb-2'>
                <Label className='text-sm font-medium'>Kích thước (cm)</Label>
              </div>
              <div className='grid grid-cols-3 gap-4'>
                {/* Length */}
                <div>
                  <Label htmlFor='edit-length' className='text-sm font-medium'>
                    Chiều dài
                  </Label>
                  <Input
                    id='edit-length'
                    type='number'
                    min='0'
                    max={MAX_DIMENSION}
                    placeholder='cm'
                    value={variantData.length || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : Number(e.target.value)
                      if (value >= 0) {
                        handleVariantInputChange('length', value)
                      }
                    }}
                    className={`mt-2 text-sm ${lengthError ? 'border-red-500' : ''}`}
                  />
                  {lengthError && <p className='mt-2 text-sm text-red-500'>{lengthError}</p>}
                </div>

                {/* Width */}
                <div>
                  <Label htmlFor='edit-width' className='text-sm font-medium'>
                    Chiều rộng
                  </Label>
                  <Input
                    id='edit-width'
                    type='number'
                    min='0'
                    max={MAX_DIMENSION}
                    placeholder='cm'
                    value={variantData.width || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : Number(e.target.value)
                      if (value >= 0) {
                        handleVariantInputChange('width', value)
                      }
                    }}
                    className={`mt-2 text-sm ${widthError ? 'border-red-500' : ''}`}
                  />
                  {widthError && <p className='mt-2 text-sm text-red-500'>{widthError}</p>}
                </div>

                {/* Height */}
                <div>
                  <Label htmlFor='edit-height' className='text-sm font-medium'>
                    Chiều cao
                  </Label>
                  <Input
                    id='edit-height'
                    type='number'
                    min='0'
                    max={MAX_DIMENSION}
                    placeholder='cm'
                    value={variantData.height || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : Number(e.target.value)
                      if (value >= 0) {
                        handleVariantInputChange('height', value)
                      }
                    }}
                    className={`mt-2 ${heightError ? 'border-red-500' : ''}`}
                  />
                  {heightError && <p className='mt-2 text-sm text-red-500'>{heightError}</p>}
                </div>
              </div>

              {/* Weight */}
              <div>
                <Label htmlFor='edit-weight' className='text-sm font-medium'>
                  Trọng lượng (g)
                </Label>
                <Input
                  id='edit-weight'
                  type='number'
                  min='0'
                  max={MAX_WEIGHT}
                  placeholder='gram'
                  value={variantData.weight || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : Number(e.target.value)
                    if (value >= 0) {
                      handleVariantInputChange('weight', value)
                    }
                  }}
                  className={`mt-2 ${weightError ? 'border-red-500' : ''}`}
                />
                {weightError && <p className='mt-2 text-sm text-red-500'>{weightError}</p>}
              </div>

              {/* Is Active */}
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='edit-is-active'
                  checked={variantData.isActive}
                  onChange={(e) => handleVariantInputChange('isActive', e.target.checked)}
                  className='w-4 h-4 rounded border-gray-300'
                />
                <Label htmlFor='edit-is-active' className='text-sm font-medium'>
                  Kích hoạt biến thể
                </Label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleUpdateVariant} disabled={isSubmitting} className='bg-green-600 hover:bg-green-700'>
            {isSubmitting ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Đang cập nhật...
              </>
            ) : (
              'Cập nhật biến thể'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
