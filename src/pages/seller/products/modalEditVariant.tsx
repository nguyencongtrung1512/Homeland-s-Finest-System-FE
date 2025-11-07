import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { productVariantApi, type UpdateVariantRequest } from '../../../apis/productVariant.api'
import { toast } from '../../../utils/toast'
import { handlePriceInput, validateQuantity, formatQuantity, parseVietnameseNumber, sanitizeAttribute } from '../../../utils/validation'
import type { Product, VariantOption } from '../../../types/productType'

interface ModalEditVariantProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  variant: VariantOption | null
  parentVariant: VariantOption | null // Variant cha nếu đây là variant con
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

  // Xác định xem có phải variant cha không
  const isParentVariant = !parentVariant

  const [variantData, setVariantData] = useState({
    attributeName: '',
    attributeType: '',
    description: '',
    basePrice: 0,
    quantity: 0,
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    isActive: true
  })

  // State để lưu giá trị hiển thị (formatted) cho price và quantity
  const [displayPrice, setDisplayPrice] = useState('')
  const [displayQuantity, setDisplayQuantity] = useState('')
  
  // Lưu số lượng ban đầu để validate không vượt quá
  const [originalQuantity, setOriginalQuantity] = useState<number | null>(null)

  // Load data khi mở dialog
  useEffect(() => {
    if (open && variant) {
      const basePrice = variant.basePrice || 0
      const quantity = variant.quantity || 0
      
      setVariantData({
        attributeName: variant.attributeName || '',
        attributeType: '', // Sẽ lấy từ getAttributeTypeForVariant()
        description: variant.description || '',
        basePrice: basePrice,
        quantity: quantity,
        length: variant.length || 0,
        width: variant.width || 0,
        height: variant.height || 0,
        weight: variant.weight || 0,
        isActive: variant.isActive ?? true
      })
      
      // Set display values với format
      setDisplayPrice(basePrice > 0 ? basePrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')
      setDisplayQuantity(quantity > 0 ? quantity.toString() : '')
      
      // Lưu số lượng ban đầu để validate
      setOriginalQuantity(quantity)
    }
  }, [open, variant])

  // Helper để lấy attributeType từ variantGroup
  const getAttributeTypeForVariant = (): string | null => {
    if (!product?.variantGroups || !variant) return null
    for (const group of product.variantGroups) {
      const found = group.options.find((opt) => opt.id === variant.id)
      if (found) return group.attributeType
    }
    // Nếu là variant con, lấy từ childVariantGroups của parent
    if (parentVariant?.childVariantGroups) {
      for (const childGroup of parentVariant.childVariantGroups) {
        const found = childGroup.options.find((opt) => opt.id === variant.id)
        if (found) return childGroup.attributeType
      }
    }
    return null
  }

  const handleVariantInputChange = (field: string, value: string | number | boolean) => {
    let processedValue: string | number | boolean = value
    
    // Validate và sanitize cho attributeName
    if (typeof value === 'string') {
      if (field === 'attributeName') {
        // Chỉ cho phép chữ cái, số, khoảng trắng - không cho phép ký tự đặc biệt
        processedValue = sanitizeAttribute(value)
      }
    }
    
    setVariantData((prev) => ({
      ...prev,
      [field]: processedValue
    }))
  }

  // Handler cho price input với format VN
  const handlePriceChange = (value: string) => {
    // Khi đang gõ, chỉ loại bỏ ký tự không hợp lệ, KHÔNG format real-time
    // Format sẽ được thực hiện khi blur
    const cleaned = value.replace(/[^\d.,]/g, '')
    setDisplayPrice(cleaned)
    
    // Parse số để lưu vào state (nhưng không hiển thị format khi đang gõ)
    const numeric = parseVietnameseNumber(cleaned)
    setVariantData((prev) => ({
      ...prev,
      basePrice: numeric
    }))
  }

  // Handler cho quantity input với validation
  const handleQuantityChange = (value: string) => {
    // Validate với maxQuantity = originalQuantity (không được vượt quá số lượng ban đầu)
    const validation = validateQuantity(value, originalQuantity)
    
    if (validation.valid) {
      setDisplayQuantity(formatQuantity(validation.numeric))
      setVariantData((prev) => ({
        ...prev,
        quantity: validation.numeric
      }))
    } else {
      // Vẫn hiển thị giá trị đã nhập nhưng sẽ validate khi blur
      setDisplayQuantity(value)
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
      if (isParentVariant) {
        // Variant cha: chỉ validate attributeName và description
        if (!variantData.attributeName.trim()) {
          toast.error('Vui lòng nhập tên thuộc tính')
          return
        }
      } else {
        // Variant con: validate đầy đủ
        if (!variantData.attributeName.trim()) {
          toast.error('Vui lòng nhập tên thuộc tính')
          return
        }
        if (variantData.basePrice <= 0) {
          toast.error('Vui lòng nhập giá bán hợp lệ (lớn hơn 0)')
          return
        }
        
        // Validate quantity với đầy đủ rules (không vượt quá số lượng ban đầu)
        const quantityValidation = validateQuantity(displayQuantity || variantData.quantity.toString(), originalQuantity)
        if (!quantityValidation.valid) {
          toast.error(quantityValidation.error || 'Vui lòng nhập số lượng tồn kho hợp lệ')
          return
        }
        
        // Cập nhật quantity từ validation result
        if (quantityValidation.numeric !== variantData.quantity) {
          setVariantData((prev) => ({
            ...prev,
            quantity: quantityValidation.numeric
          }))
        }
      }

      // Prepare update data
      const updateData: UpdateVariantRequest = {}

      if (isParentVariant) {
        // Variant cha: chỉ gửi attributeName và description
        updateData.attributeName = variantData.attributeName
        if (variantData.description) {
          updateData.description = variantData.description
        }
      } else {
        // Variant con: gửi đầy đủ
        const attributeType = getAttributeTypeForVariant()
        if (attributeType) {
          updateData.attributeType = attributeType
        }
        updateData.attributeName = variantData.attributeName
        if (variantData.description) {
          updateData.description = variantData.description
        }
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
        description: '',
        basePrice: 0,
        quantity: 0,
        length: 0,
        width: 0,
        height: 0,
        weight: 0,
        isActive: true
      })
      setDisplayPrice('')
      setDisplayQuantity('')
      setOriginalQuantity(null)
    }
  }

  if (!variant) return null

  const attributeType = getAttributeTypeForVariant()

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa Product Variant</DialogTitle>
        </DialogHeader>

        <div className='space-y-6 mt-4'>
          {/* Basic Information */}
          <div className='space-y-4'>
            {/* Attribute Type - Chỉ hiển thị cho variant con */}
            {!isParentVariant && attributeType && (
              <div>
                <Label htmlFor='edit-attribute-type' className='text-sm font-medium'>
                  Loại thuộc tính
                </Label>
                <Input
                  id='edit-attribute-type'
                  value={attributeType}
                  className='mt-1 bg-gray-100'
                  readOnly
                />
              </div>
            )}

            {/* Attribute Name */}
            <div>
              <Label htmlFor='edit-attribute-name' className='text-sm font-medium'>
                Tên thuộc tính <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='edit-attribute-name'
                placeholder='Ví dụ: Đỏ, Xanh, XL, Lớn...'
                value={variantData.attributeName}
                onChange={(e) => handleVariantInputChange('attributeName', e.target.value)}
                className='mt-1'
              />
              <p className='text-xs text-gray-500 mt-1'>
                💡 Chỉ cho phép chữ cái, số và khoảng trắng (không ký tự đặc biệt).
              </p>
            </div>

            {/* Price - Chỉ hiển thị cho variant con */}
            {!isParentVariant && (
              <div>
                <Label htmlFor='edit-price' className='text-sm font-medium'>
                  Giá bán (VNĐ) <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='edit-price'
                  type='text'
                  placeholder='Nhập giá bán (ví dụ: 100000 hoặc 100.000)...'
                  value={displayPrice}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  onBlur={(e) => {
                    // Format lại khi blur
                    const { formatted, numeric } = handlePriceInput(e.target.value, true)
                    setDisplayPrice(formatted)
                    setVariantData((prev) => ({
                      ...prev,
                      basePrice: numeric
                    }))
                  }}
                  className='mt-1'
                />
                {variantData.basePrice > 0 && (
                  <p className='text-xs text-gray-500 mt-1'>
                    Giá trị: {variantData.basePrice.toLocaleString('vi-VN')} VNĐ
                  </p>
                )}
              </div>
            )}

            {/* Quantity - Chỉ hiển thị cho variant con */}
            {!isParentVariant && (
              <div>
                <Label htmlFor='edit-quantity' className='text-sm font-medium'>
                  Số lượng tồn kho <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='edit-quantity'
                  type='text'
                  placeholder='Nhập số lượng tồn kho...'
                  value={displayQuantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  onBlur={(e) => {
                    // Validate và format lại khi blur
                    const validation = validateQuantity(e.target.value, originalQuantity)
                    if (validation.valid) {
                      setDisplayQuantity(formatQuantity(validation.numeric))
                      setVariantData((prev) => ({
                        ...prev,
                        quantity: validation.numeric
                      }))
                    } else {
                      toast.error(validation.error || 'Số lượng không hợp lệ')
                      // Reset về giá trị hợp lệ cuối cùng hoặc original
                      setDisplayQuantity(
                        variantData.quantity > 0
                          ? variantData.quantity.toString()
                          : originalQuantity !== null
                            ? originalQuantity.toString()
                            : ''
                      )
                    }
                  }}
                  className='mt-1'
                />
                <div className='mt-1 space-y-1'>
                  <p className='text-xs text-gray-500'>
                    Chỉ nhập số, không được nhập số âm, chữ hoặc ký tự đặc biệt
                  </p>
                  {originalQuantity !== null && (
                    <p className='text-xs text-blue-600'>
                      Số lượng hiện tại trong kho: {originalQuantity.toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <Label htmlFor='edit-description' className='text-sm font-medium'>
                Mô tả
              </Label>
              <Textarea
                id='edit-description'
                placeholder='Mô tả về loại sản phẩm...'
                value={variantData.description}
                onChange={(e) => handleVariantInputChange('description', e.target.value)}
                className='mt-1 min-h-[100px]'
              />
            </div>
          </div>

          {/* Dimensions - Chỉ hiển thị cho variant con */}
          {!isParentVariant && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between mb-2'>
                <Label className='text-sm font-medium'>Kích thước (cm)</Label>
                <span className='text-xs text-gray-500'>Tùy chọn</span>
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
                    placeholder='cm'
                    value={variantData.length || ''}
                    onChange={(e) => handleVariantInputChange('length', Number(e.target.value))}
                    className='mt-1'
                  />
                </div>

                {/* Width */}
                <div>
                  <Label htmlFor='edit-width' className='text-sm font-medium'>
                    Chiều rộng
                  </Label>
                  <Input
                    id='edit-width'
                    type='number'
                    placeholder='cm'
                    value={variantData.width || ''}
                    onChange={(e) => handleVariantInputChange('width', Number(e.target.value))}
                    className='mt-1'
                  />
                </div>

                {/* Height */}
                <div>
                  <Label htmlFor='edit-height' className='text-sm font-medium'>
                    Chiều cao
                  </Label>
                  <Input
                    id='edit-height'
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
                <Label htmlFor='edit-weight' className='text-sm font-medium'>
                  Trọng lượng (g)
                </Label>
                <Input
                  id='edit-weight'
                  type='number'
                  placeholder='gram'
                  value={variantData.weight || ''}
                  onChange={(e) => handleVariantInputChange('weight', Number(e.target.value))}
                  className='mt-1'
                />
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
                  Kích hoạt variant
                </Label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={handleUpdateVariant}
            disabled={isSubmitting}
            className='bg-green-600 hover:bg-green-700'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Đang cập nhật...
              </>
            ) : (
              'Cập nhật Variant'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

