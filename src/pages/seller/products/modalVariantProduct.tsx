import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Switch } from '../../../components/ui/switch'
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import { productVariantApi, type CreateVariantRequest } from '../../../apis/productVariant.api'
import { getSystemStorageByName } from '../../../apis/systemStorage.api'
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
  const [commissionRate, setCommissionRate] = useState<number>(0)
  const [commissionLoading, setCommissionLoading] = useState(false)
  const [commissionError, setCommissionError] = useState<string>('')

  const [hasAutoAttributeType, setHasAutoAttributeType] = useState(false)
  const [attributeTypeError, setAttributeTypeError] = useState<string>('')
  const [attributeNameError, setAttributeNameError] = useState<string>('')
  const [lengthError, setLengthError] = useState<string>('')
  const [widthError, setWidthError] = useState<string>('')
  const [heightError, setHeightError] = useState<string>('')
  const [weightError, setWeightError] = useState<string>('')
  const [showWarning, setShowWarning] = useState(true)
  const [isGroupNode, setIsGroupNode] = useState(false)

  // Constants for validation
  const MAX_IMAGES = 1
  const MAX_ATTRIBUTE_TYPE_LENGTH = 25
  const MAX_ATTRIBUTE_NAME_LENGTH = 25
  const MIN_ATTRIBUTE_TYPE_LENGTH = 1
  const MIN_ATTRIBUTE_NAME_LENGTH = 1
  const MAX_DIMENSION = 200 // cm
  const MAX_WEIGHT = 50000 // gram (50kg)

  // Helper function to count words
  // const countWords = (text: string): number => {
  //   if (!text || text.trim().length === 0) return 0
  //   return text
  //     .trim()
  //     .split(/\s+/)
  //     .filter((word) => word.length > 0).length
  // }

  // Tự động đặt attributeType khi dialog mở (chỉ khi nhóm tùy chọn đã có con)
  useEffect(() => {
    if (open) {
      // Reset warning when dialog opens
      setShowWarning(true)
      // Find attributeType from existing variants
      let autoAttributeType = ''

      if (product?.variantGroups) {
        // Trường hợp 1: Tạo phiên bản bán được từ nhóm tùy chọn
        if (selectedParentVariant) {
          // Kiểm tra xem nhóm tùy chọn đã có con chưa
          const hasExistingChildren =
            selectedParentVariant.childVariantGroups &&
            Array.isArray(selectedParentVariant.childVariantGroups) &&
            selectedParentVariant.childVariantGroups.length > 0 &&
            selectedParentVariant.childVariantGroups[0].options &&
            selectedParentVariant.childVariantGroups[0].options.length > 0

          if (hasExistingChildren && selectedParentVariant.childVariantGroups) {
            // Nhóm tùy chọn đã có con → tự động đặt attributeType theo con đầu tiên
            const childGroups = selectedParentVariant.childVariantGroups
            autoAttributeType = childGroups[0].attributeType
          }
          // Nếu nhóm tùy chọn chưa có con → không tự động đặt, cho phép nhập tự do
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
      
      // Reset isGroupNode when dialog opens
      setIsGroupNode(false)
    }
  }, [open, product, selectedParentVariant])

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
        const result = extractCommissionValue(obj.data)
        if (!Number.isNaN(result)) return result
      }
      if ('items' in obj) {
        const result = extractCommissionValue(obj.items)
        if (!Number.isNaN(result)) return result
      }
    }

    return NaN
  }, [])

  // Fetch commission config khi mở modal
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

  // Helper function to find parent variant's attributeType
  const getParentVariantAttributeType = (): string | null => {
    if (!product?.variantGroups || !selectedParentVariant) {
      return null
    }

    // Tìm nhóm tùy chọn trong product.variantGroups
    for (const group of product.variantGroups) {
      const foundVariant = group.options.find((option) => option.id === selectedParentVariant.id)
      if (foundVariant) {
        // Trả về attributeType của VariantGroup chứa nhóm tùy chọn
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
    const currentCount = variantImages.length

    if (currentCount >= MAX_IMAGES) {
      toast.error(`Chỉ được tối đa ${MAX_IMAGES} hình ảnh.`)
      return
    }

    // Chỉ lấy file đầu tiên nếu upload nhiều file
    const fileToAdd = newFiles[0]

    if (newFiles.length > 1) {
      toast.error(`Chỉ được upload 1 ảnh. Đã chọn ảnh đầu tiên.`)
    }

    // Validate file type
    if (!fileToAdd.type.startsWith('image/')) {
      toast.error(`File ${fileToAdd.name} không phải là hình ảnh.`)
      return
    }

    // Validate file size (5MB max)
    if (fileToAdd.size > 5 * 1024 * 1024) {
      toast.error(`File ${fileToAdd.name} quá lớn. Tối đa 5MB.`)
      return
    }

    // Replace existing image or add new one
    setVariantImages([fileToAdd])
  }

  const handleVariantInputChange = (field: string, value: string | number) => {
    // Clear error when user starts typing
    if (field === 'attributeType') {
      const stringValue = value as string
      // Prevent input if exceeds limit
      if (stringValue.length > MAX_ATTRIBUTE_TYPE_LENGTH) {
        setAttributeTypeError(`Loại thuộc tính chỉ được tối đa ${MAX_ATTRIBUTE_TYPE_LENGTH} ký tự.`)
        return
      }
      setAttributeTypeError('')
      // Validate real-time when typing
      if (selectedParentVariant && stringValue.trim()) {
        validateAttributeType(stringValue)
      }
    }

    if (field === 'attributeName') {
      const stringValue = value as string
      // Prevent input if exceeds limit
      if (stringValue.length > MAX_ATTRIBUTE_NAME_LENGTH) {
        setAttributeNameError(`Tên thuộc tính chỉ được tối đa ${MAX_ATTRIBUTE_NAME_LENGTH} ký tự.`)
        return
      }
      setAttributeNameError('')
    }

    // if (field === 'description') {
    //   setDescriptionError('')
    //   // Validate description word count (allow input but show warning)
    //   const wordCount = countWords(value as string)
    //   if (wordCount > MAX_DESCRIPTION_WORDS) {
    //     setDescriptionError(`Mô tả chỉ được tối đa ${MAX_DESCRIPTION_WORDS} từ.`)
    //   }
    // }

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
    if (typeof value === 'number' && value < 0) {
      // Don't allow negative values
      return
    }

    setVariantData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  // Kiểm tra attributeType không trùng với nhóm tùy chọn
  const validateAttributeType = (attributeType: string): boolean => {
    // Chỉ kiểm tra khi tạo phiên bản bán được (có selectedParentVariant)
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
        `Loại thuộc tính không được trùng với loại thuộc tính của nhóm tùy chọn (${parentAttributeType})`
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

      // Validate attributeName
      if (!variantData.attributeName.trim()) {
        toast.error('Vui lòng nhập tên thuộc tính (ví dụ: Đỏ, 100ml)')
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

      // Validate attributeType
      if (!variantData.attributeType.trim()) {
        toast.error('Vui lòng nhập loại thuộc tính (ví dụ: Màu sắc, Dung tích)')
        setAttributeTypeError('Vui lòng nhập loại thuộc tính')
        return
      }

      if (variantData.attributeType.trim().length < MIN_ATTRIBUTE_TYPE_LENGTH) {
        toast.error('Loại thuộc tính phải có ít nhất 1 ký tự')
        setAttributeTypeError('Loại thuộc tính phải có ít nhất 1 ký tự')
        return
      }

      if (variantData.attributeType.trim().length > MAX_ATTRIBUTE_TYPE_LENGTH) {
        toast.error(`Loại thuộc tính chỉ được tối đa ${MAX_ATTRIBUTE_TYPE_LENGTH} ký tự`)
        setAttributeTypeError(`Loại thuộc tính chỉ được tối đa ${MAX_ATTRIBUTE_TYPE_LENGTH} ký tự`)
        return
      }

      // Kiểm tra attributeType không trùng với nhóm tùy chọn
      if (selectedParentVariant && !validateAttributeType(variantData.attributeType)) {
        toast.error(attributeTypeError || 'Loại thuộc tính không được trùng với loại thuộc tính của nhóm tùy chọn')
        return
      }

      // Kiểm tra giá và số lượng chỉ khi không phải nút nhóm
      if (!isGroupNode) {
        if (variantData.price < 0) {
          toast.error('Giá gốc không được là số âm')
          return
        }

        if (variantData.price === 0) {
          toast.error('Vui lòng nhập giá gốc hợp lệ (lớn hơn 0)')
          return
        }

        if (variantData.quantity < 0) {
          toast.error('Số lượng tồn kho không được là số âm')
          return
        }
      }

      // Validate description word count
      // const descriptionWordCount = countWords(variantData.description)
      // if (descriptionWordCount > MAX_DESCRIPTION_WORDS) {
      //   toast.error(`Mô tả chỉ được tối đa ${MAX_DESCRIPTION_WORDS} từ.`)
      //   return
      // }

      // Validate dimensions chỉ khi không phải nút nhóm
      if (!isGroupNode) {
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

        // Validate images count
        if (variantImages.length > MAX_IMAGES) {
          toast.error(`Chỉ được tối đa ${MAX_IMAGES} hình ảnh.`)
          return
        }
      }

      // Prepare form data theo cấu trúc API yêu cầu
      const formData: CreateVariantRequest = {
        StoreId: product.storeId,
        ParentId: parentId,
        AttributeName: variantData.attributeName,
        AttributeType: variantData.attributeType,
        Description: variantData.description || undefined,
        ProductImages: variantImages.length > 0 ? variantImages : undefined
      }

      // Chỉ gửi SkuDetails nếu không phải nút nhóm
      if (!isGroupNode) {
        formData.SkuDetails = {
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
        toast.success('Tạo biến thể thành công!')
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error('Không thể tạo biến thể sản phẩm.')
      }
    } catch (error: unknown) {
      console.error('Error creating product variant:', error)

      // Extract error message from backend response
      let errorMessage = 'Có lỗi xảy ra khi tạo biến thể sản phẩm.'

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
      setAttributeNameError('')
      setLengthError('')
      setWidthError('')
      setHeightError('')
      setWeightError('')
      setShowWarning(true) // Reset warning when dialog closes
      setIsGroupNode(false) // Reset isGroupNode when dialog closes
    }
  }

  // Check if this is the first child variant being created from a parent variant with SKU info
  const isFirstChildVariant =
    selectedParentVariant &&
    !(
      selectedParentVariant.childVariantGroups &&
      Array.isArray(selectedParentVariant.childVariantGroups) &&
      selectedParentVariant.childVariantGroups.length > 0 &&
      selectedParentVariant.childVariantGroups[0].options &&
      selectedParentVariant.childVariantGroups[0].options.length > 0
    )

  // Check if parent variant has SKU information
  const parentHasSkuInfo =
    selectedParentVariant &&
    (selectedParentVariant.basePrice !== null ||
      selectedParentVariant.quantity !== null ||
      selectedParentVariant.length !== null ||
      selectedParentVariant.width !== null ||
      selectedParentVariant.height !== null ||
      selectedParentVariant.weight !== null)

  const shouldShowWarning = isFirstChildVariant && parentHasSkuInfo

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Tạo biến thể sản phẩm</DialogTitle>
        </DialogHeader>

        {/* Warning when creating first child variant from parent with SKU info */}
        {shouldShowWarning && showWarning && (
          <div className='mt-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg relative'>
            <button
              type='button'
              onClick={() => setShowWarning(false)}
              className='absolute top-2 right-2 text-amber-600 hover:text-amber-800 transition-colors'
              aria-label='Đóng cảnh báo'
            >
              <X className='w-5 h-5' />
            </button>
            <div className='flex items-start'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-5 w-5 text-amber-400'
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3 flex-1 pr-6'>
                <h3 className='text-sm font-semibold text-amber-800 mb-2'>
                  Lưu ý quan trọng khi tạo phiên bản bán được đầu tiên
                </h3>
                <div className='text-sm text-amber-700 space-y-2'>
                  <p>
                    Bạn đang tạo <strong>phiên bản bán được đầu tiên</strong> từ nhóm tùy chọn{' '}
                    <strong>"{selectedParentVariant.attributeName}"</strong>.
                  </p>
                  <p>
                    <strong>Nhóm tùy chọn này hiện đang có thông tin SKU</strong> (giá bán, số lượng tồn kho, kích
                    thước, trọng lượng).
                  </p>
                  <div className='bg-amber-100 p-3 rounded-md mt-3'>
                    <p className='font-semibold text-amber-900 mb-1'>Khi bạn tạo phiên bản bán được đầu tiên:</p>
                    <ul className='list-disc list-inside space-y-1 text-amber-800'>
                      <li>
                        <strong>Tất cả thông tin SKU của nhóm tùy chọn sẽ bị xóa</strong> (giá bán, số lượng, kích
                        thước, trọng lượng)
                      </li>
                      <li>
                        Thông tin SKU sẽ được chuyển sang các <strong>phiên bản bán được</strong> (con) thay vì lưu ở
                        nhóm tùy chọn (cha)
                      </li>
                      <li>
                        Bạn cần nhập lại thông tin SKU cho từng <strong>phiên bản bán được</strong> sau khi tạo
                      </li>
                    </ul>
                  </div>
                  <p className='mt-2 font-medium text-amber-900'>
                    Vui lòng xác nhận bạn đã hiểu và muốn tiếp tục tạo phiên bản bán được.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className='space-y-6 mt-4'>
          {/* Basic Information */}
          <div className='space-y-4'>
            {/* Group Node Toggle Switch */}
            <div className='flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <Label htmlFor='is-group-node' className='text-sm font-medium text-blue-900 cursor-pointer'>
                Đây có phải là nút nhóm?
              </Label>
              <Switch
                id='is-group-node'
                checked={isGroupNode}
                onCheckedChange={(checked) => {
                  setIsGroupNode(checked)
                  // Reset SKU fields when toggling to group node
                  if (checked) {
                    setVariantData((prev) => ({
                      ...prev,
                      price: 0,
                      quantity: 0,
                      length: 0,
                      width: 0,
                      height: 0,
                      weight: 0
                    }))
                    setVariantImages([])
                  }
                }}
              />
            </div>
            {isGroupNode && (
              <div className='p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg'>
                <p className='text-sm text-amber-800'>
                  <strong>Lưu ý:</strong> Nút nhóm chỉ chứa thông tin phân loại (Loại thuộc tính và Tên thuộc tính), 
                  không có thông tin SKU (giá, số lượng, kích thước, trọng lượng, hình ảnh).
                </p>
              </div>
            )}

            {/* Attribute Type */}
            {hasAutoAttributeType ? (
              <div>
                <div className='flex items-center justify-between mb-1'>
                  <Label htmlFor='variant-attribute-type' className='text-sm font-medium'>
                    Loại thuộc tính <span className='text-red-500'>*</span>
                  </Label>
                  <span
                    className={`text-xs ${variantData.attributeType.length > MAX_ATTRIBUTE_TYPE_LENGTH ? 'text-red-500' : 'text-gray-500'
                      }`}
                  >
                    {variantData.attributeType.length} / {MAX_ATTRIBUTE_TYPE_LENGTH} ký tự
                  </span>
                </div>
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
                    Loại thuộc tính của nhóm tùy chọn:{' '}
                    <span className='font-medium'>{getParentVariantAttributeType()}</span>
                  </p>
                )}
              </div>
            ) : (
              <div>
                <div className='flex items-center justify-between mb-1'>
                  <Label htmlFor='variant-attribute-type' className='text-sm font-medium'>
                    Loại thuộc tính <span className='text-red-500'>*</span>
                  </Label>
                  <span
                    className={`text-xs ${variantData.attributeType.length > MAX_ATTRIBUTE_TYPE_LENGTH ? 'text-red-500' : 'text-gray-500'
                      }`}
                  >
                    {variantData.attributeType.length} / {MAX_ATTRIBUTE_TYPE_LENGTH} ký tự
                  </span>
                </div>
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
                    Loại thuộc tính của nhóm tùy chọn:{' '}
                    <span className='font-medium'>{getParentVariantAttributeType()}</span>
                  </p>
                )}
              </div>
            )}

            {/* Attribute Name - Luôn cho phép nhập tự do */}
            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label htmlFor='variant-attribute-name' className='text-sm font-medium'>
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
                id='variant-attribute-name'
                placeholder='Ví dụ: Đỏ, 100ml, X, XL...'
                value={variantData.attributeName}
                onChange={(e) => handleVariantInputChange('attributeName', e.target.value)}
                maxLength={MAX_ATTRIBUTE_NAME_LENGTH}
                className={`mt-1 ${attributeNameError ? 'border-red-500' : ''}`}
              />
              {attributeNameError && <p className='mt-1 text-sm text-red-500'>{attributeNameError}</p>}
            </div>

            {/* Giá - Chỉ hiển thị khi không phải nút nhóm */}
            {!isGroupNode && (
              <div>
                <Label htmlFor='variant-price' className='text-sm font-medium'>
                  Giá cửa hàng thu về (đ) <span className='text-red-500'>*</span>
                </Label>
              <Input
                id='variant-price'
                type='number'
                min='0'
                step='1000'
                placeholder='Nhập giá cửa hàng thu về...'
                value={variantData.price || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : Number(e.target.value)
                  if (value >= 0) {
                    handleVariantInputChange('price', value)
                  }
                }}
                className='mt-1'
              />
                {variantData.price < 0 && <p className='mt-1 text-sm text-red-500'>Giá không được là số âm</p>}
              </div>
            )}

            {/* Sale Price - Chỉ hiển thị khi không phải nút nhóm */}
            {!isGroupNode && (
              <div>
              <Label className='text-sm font-medium'>Giá bán trên sàn dự kiến (đ)</Label>
              <div className='relative mt-1'>
                <Input
                  value={
                    commissionLoading
                      ? 'Đang tải...'
                      : formatCurrency(computeSalePrice(variantData.price, commissionRate))
                  }
                  readOnly
                  className='bg-gray-100'
                  disabled={commissionLoading}
                />
                {commissionLoading && (
                  <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                    <Loader2 className='w-4 h-4 animate-spin text-gray-400' />
                  </div>
                )}
              </div>

                {commissionError && <p className='mt-1 text-sm text-amber-600'>{commissionError}</p>}
              </div>
            )}

            {/* Số lượng - Chỉ hiển thị khi không phải nút nhóm */}
            {!isGroupNode && (
              <div>
              <Label htmlFor='variant-quantity' className='text-sm font-medium'>
                Số lượng tồn kho <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='variant-quantity'
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
                className='mt-1'
              />
                {variantData.quantity < 0 && (
                  <p className='mt-1 text-sm text-red-500'>Số lượng tồn kho không được là số âm</p>
                )}
              </div>
            )}

            {/* Description */}
            {/* <div>
              <div className='flex items-center justify-between mb-1'>
                <Label htmlFor='variant-description' className='text-sm font-medium'>
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
                id='variant-description'
                placeholder='Mô tả về loại sản phẩm...'
                value={variantData.description}
                onChange={(e) => handleVariantInputChange('description', e.target.value)}
                className={`mt-1 min-h-[100px] ${descriptionError ? 'border-red-500' : ''}`}
              />
              {descriptionError && <p className='mt-1 text-sm text-red-500'>{descriptionError}</p>}
            </div> */}
          </div>

          {/* Kích thước - Chỉ hiển thị khi không phải nút nhóm */}
          {!isGroupNode && (
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
                  className={`mt-2 ${lengthError ? 'border-red-500' : ''}`}
                />
                {lengthError && <p className='mt-2 text-sm text-red-500'>{lengthError}</p>}
              </div>

              {/* Width */}
              <div>
                <Label htmlFor='variant-width' className='text-sm font-medium'>
                  Chiều rộng
                </Label>
                <Input
                  id='variant-width'
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
                  className={`mt-2 ${widthError ? 'border-red-500' : ''}`}
                />
                {widthError && <p className='mt-2 text-sm text-red-500'>{widthError}</p>}
              </div>

              {/* Height */}
              <div>
                <Label htmlFor='variant-height' className='text-sm font-medium'>
                  Chiều cao
                </Label>
                <Input
                  id='variant-height'
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
              <Label htmlFor='variant-weight' className='text-sm font-medium'>
                Trọng lượng (g)
              </Label>
              <Input
                id='variant-weight'
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
          </div>
          )}

          {/* Variant Images - Chỉ hiển thị khi không phải nút nhóm */}
          {!isGroupNode && (
            <div>
            <div className='flex items-center justify-between mb-1'>
              <Label className='text-sm font-medium'>Hình ảnh biến thể sản phẩm</Label>
              <span className={`text-xs ${variantImages.length > MAX_IMAGES ? 'text-red-500' : 'text-gray-500'}`}>
                {variantImages.length} / {MAX_IMAGES} ảnh
              </span>
            </div>
            {variantImages.length < MAX_IMAGES ? (
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
                  {variantImages.length > 0 ? 'Thay đổi ảnh' : 'Kéo thả hoặc click để tải ảnh lên'}
                </p>
                <input
                  type='file'
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
                  {variantImages.length > 0 ? 'Thay đổi ảnh' : 'Chọn ảnh'}
                </Button>
                <p className='text-xs text-gray-500 mt-2'>Tối đa 1 ảnh, định dạng: JPG, PNG, WEBP, tối đa 5MB</p>
              </div>
            ) : (
              <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                <p className='text-sm text-amber-600'>
                  Đã đạt giới hạn tối đa {MAX_IMAGES} hình ảnh. Vui lòng xóa ảnh cũ để thêm ảnh mới.
                </p>
              </div>
            )}

            {variantImages.length > 0 && (
              <div className='mt-4'>
                <div className='relative inline-block group'>
                  <div className='w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200'>
                    <img
                      src={createPreviewUrl(variantImages[0])}
                      alt='Variant image'
                      className='w-full h-full object-cover'
                    />
                  </div>
                  <button
                    type='button'
                    onClick={() => removeVariantImage(0)}
                    className='absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all'
                  >
                    <X className='w-4 h-4' />
                  </button>
                </div>
              </div>
            )}
          </div>
          )}
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
              'Tạo biến thể sản phẩm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
