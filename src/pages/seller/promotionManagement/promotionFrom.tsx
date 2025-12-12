import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Switch } from '../../../components/ui/switch'
import { Calendar } from '../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import {
  Calendar as CalendarIcon,
  Clock,
  Percent,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Tag,
  Target,
  TrendingUp,
  Edit,
  X,
  Plus,
  Search,
  Package
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { cn } from '../../../lib/utils'
import { toast } from '../../../utils/toast'
import { useAuth } from '../../../contexts/auth.context'
import {
  type PromotionSellerDTO,
  type PromotionDetailDTO,
  type PromotionSellerRequest,
  type DiscountType
} from '../../../types/promotionType'
import { storeApi } from '../../../apis/store.api'
import { productApi } from '../../../apis/product.api'
import { type Product } from '../../../types/productType'
import Loading from '../../../components/Loading/loading'
import EmptyState from '../../../components/EmptyState/emptyState'

interface PromotionDetailModalProps {
  promotion: PromotionDetailDTO | PromotionSellerDTO | null
  isOpen: boolean
  onClose: () => void
  mode?: 'view' | 'edit' | 'create'
  onSubmit?: (data: PromotionSellerRequest) => Promise<void>
  loading?: boolean
}

// Helper function to format date to ISO string without timezone conversion
const formatDateToISO = (date: Date, hours: number, minutes: number): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const h = String(hours).padStart(2, '0')
  const m = String(minutes).padStart(2, '0')
  const s = '00'
  return `${year}-${month}-${day}T${h}:${m}:${s}.000Z`
}

const PromotionDetailModal: React.FC<PromotionDetailModalProps> = ({
  promotion,
  isOpen,
  onClose,
  mode = 'view',
  onSubmit,
  loading = false
}) => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(mode === 'edit' || mode === 'create')
  const [formData, setFormData] = useState<PromotionSellerRequest>({
    sellerId: user?.userId || '',
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minValueDiscount: undefined,
    startDate: '',
    endDate: '',
    maxQuantity: undefined,
    maxPerUser: 1,
    isActive: true,
    productIds: []
  })

  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState('00:00')
  const [endTime, setEndTime] = useState('23:59')
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  // Product selection states
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

  // Validation errors
  interface FormErrors {
    title?: string
    description?: string
    discountValue?: string
    minValueDiscount?: string
    startDate?: string
    startTime?: string
    endDate?: string
    maxQuantity?: string
    maxPerUser?: string
  }
  const [errors, setErrors] = useState<FormErrors>({})

  // Initialize form data when modal opens or promotion changes
  useEffect(() => {
    if (isOpen) {
      if (promotion && mode !== 'create') {
        console.log('🔍 Loading promotion data for edit:', promotion)
        console.log('🔍 Start date:', promotion.startDate)
        console.log('🔍 End date:', promotion.endDate)

        // Load existing promotion data
        setFormData({
          sellerId: promotion.storeId || user?.userId || '',
          title: promotion.title,
          description: promotion.description,
          discountType: promotion.discountType,
          discountValue: promotion.discountValue,
          minValueDiscount: promotion.minValueDiscount,
          startDate: '', // Will be set after parsing dates
          endDate: '', // Will be set after parsing dates
          maxQuantity: promotion.maxQuantity,
          maxPerUser: promotion.maxPerUser,
          isActive: promotion.isActive,
          productIds: []
        })

        // Parse dates from backend format "HH:mm:ss dd/MM/yyyy"
        if (promotion.startDate) {
          try {
            let startDateObj: Date
            if (promotion.startDate.includes(' ') && promotion.startDate.includes('/')) {
              // Backend format: "HH:mm:ss dd/MM/yyyy"
              const [timePart, datePart] = promotion.startDate.split(' ')
              const [hours, minutes, seconds] = timePart.split(':')
              const [day, month, year] = datePart.split('/')
              startDateObj = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hours),
                parseInt(minutes),
                parseInt(seconds)
              )
            } else {
              // ISO format
              startDateObj = new Date(promotion.startDate)
            }

            if (!isNaN(startDateObj.getTime())) {
              console.log('✅ Parsed start date successfully:', startDateObj)
              setStartDate(startDateObj)
              setStartTime(startDateObj.toTimeString().slice(0, 5))
            } else {
              console.error('❌ Invalid start date after parsing:', startDateObj)
            }
          } catch (error) {
            console.error('❌ Invalid start date format:', promotion.startDate, error)
          }
        }

        if (promotion.endDate) {
          try {
            let endDateObj: Date
            if (promotion.endDate.includes(' ') && promotion.endDate.includes('/')) {
              // Backend format: "HH:mm:ss dd/MM/yyyy"
              const [timePart, datePart] = promotion.endDate.split(' ')
              const [hours, minutes, seconds] = timePart.split(':')
              const [day, month, year] = datePart.split('/')
              endDateObj = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hours),
                parseInt(minutes),
                parseInt(seconds)
              )
            } else {
              // ISO format
              endDateObj = new Date(promotion.endDate)
            }

            if (!isNaN(endDateObj.getTime())) {
              console.log('✅ Parsed end date successfully:', endDateObj)
              setEndDate(endDateObj)
              setEndTime(endDateObj.toTimeString().slice(0, 5))
            } else {
              console.error('❌ Invalid end date after parsing:', endDateObj)
            }
          } catch (error) {
            console.error('❌ Invalid end date format:', promotion.endDate, error)
          }
        }

        console.log('🔍 Form data set:', formData)
        console.log('🔍 Start date state:', startDate)
        console.log('🔍 End date state:', endDate)
        console.log('🔍 FormData startDate:', formData.startDate)
        console.log('🔍 FormData endDate:', formData.endDate)
        console.log('🔍 Expected ISO startDate:', startDate?.toISOString())
        console.log('🔍 Expected ISO endDate:', endDate?.toISOString())
      } else if (mode === 'create') {
        // Reset form for new promotion
        setFormData({
          sellerId: user?.userId || '',
          title: '',
          description: '',
          discountType: 'percentage',
          discountValue: 0,
          minValueDiscount: undefined,
          startDate: '',
          endDate: '',
          maxQuantity: undefined,
          maxPerUser: 1,
          isActive: true,
          productIds: []
        })
        setStartDate(undefined)
        setEndDate(undefined)
        setStartTime('00:00')
        setEndTime('23:59')
        setSelectedProducts([])
        setProductSearchTerm('')
        setProducts([])
        setFilteredProducts([])
      }
    }
  }, [isOpen, promotion, mode, user?.userId])

  // Update formData with ISO format dates when startDate/endDate change
  useEffect(() => {
    if (startDate && endDate && mode !== 'create') {
      const [startHours, startMinutes] = startTime.split(':').map(Number)
      const [endHours, endMinutes] = endTime.split(':').map(Number)
      const startISO = formatDateToISO(startDate, startHours, startMinutes)
      const endISO = formatDateToISO(endDate, endHours, endMinutes)
      setFormData((prev) => ({
        ...prev,
        startDate: startISO,
        endDate: endISO
      }))
      console.log('🔍 Updated formData with ISO dates:', {
        startDate: startISO,
        endDate: endISO
      })
    }
  }, [startDate, endDate, startTime, endTime, mode])

  // Update isEditing when mode changes
  useEffect(() => {
    setIsEditing(mode === 'edit' || mode === 'create')
  }, [mode])

  // Fetch store and products when modal opens
  useEffect(() => {
    const fetchStoreAndProducts = async () => {
      if (!isOpen || !user?.userId) return

      try {
        // Get store by seller ID
        const storeResponse = await storeApi.getStoreBySellerId(user.userId)
        if (storeResponse.data?.id) {
          // Get products by store
          setProductsLoading(true)
          const productsResponse = await productApi.getByStore(storeResponse.data.id, {
            pageSize: 100, // Get more products for selection
            pageNumber: 1
          })
          if (productsResponse.data) {
            setProducts(productsResponse.data)
            setFilteredProducts(productsResponse.data)
          }
        }
      } catch (error) {
        console.error('Error fetching store and products:', error)
      } finally {
        setProductsLoading(false)
      }
    }

    fetchStoreAndProducts()
  }, [isOpen, user?.userId])

  // Filter products based on search term
  useEffect(() => {
    if (!productSearchTerm.trim()) {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
          product.id.toLowerCase().includes(productSearchTerm.toLowerCase())
      )
      setFilteredProducts(filtered)
    }
  }, [productSearchTerm, products])

  // Safety check
  if (!promotion && mode !== 'create') {
    console.log('🔍 No promotion data and not create mode, returning null')
    return null
  }

  // Helper function to handle number input and remove leading zeros
  const handleNumberInput = (value: string): number | undefined => {
    if (!value || value.trim() === '') {
      return undefined
    }
    const trimmedValue = value.trim()
    if (trimmedValue === '0') {
      return 0
    }
    const cleanedValue = trimmedValue.replace(/^0+/, '') || '0'
    const numValue = Number(cleanedValue)
    return isNaN(numValue) ? undefined : numValue
  }

  // Form handlers
  const handleInputChange = (
    field: keyof PromotionSellerRequest,
    value: string | number | boolean | string[] | undefined
  ) => {
    if (
      field === 'discountValue' ||
      field === 'minValueDiscount' ||
      field === 'maxQuantity' ||
      field === 'maxPerUser'
    ) {
      // Handle number inputs with string value to process leading zeros
      const processedValue = typeof value === 'string' ? handleNumberInput(value) : value
      setFormData((prev) => ({
        ...prev,
        [field]: processedValue
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value
      }))
    }

    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleDateChange = (date: Date | undefined, type: 'start' | 'end') => {
    if (type === 'start') {
      setStartDate(date)
      if (date) {
        const [hours, minutes] = startTime.split(':').map(Number)
        const isoString = formatDateToISO(date, hours, minutes)
        handleInputChange('startDate', isoString)
      }
    } else {
      setEndDate(date)
      if (date) {
        const [hours, minutes] = endTime.split(':').map(Number)
        const isoString = formatDateToISO(date, hours, minutes)
        handleInputChange('endDate', isoString)
      }
    }
  }

  const handleTimeChange = (time: string, type: 'start' | 'end') => {
    if (type === 'start') {
      setStartTime(time)
      if (startDate) {
        const [hours, minutes] = time.split(':').map(Number)
        const isoString = formatDateToISO(startDate, hours, minutes)
        handleInputChange('startDate', isoString)
      }
    } else {
      setEndTime(time)
      if (endDate) {
        const [hours, minutes] = time.split(':').map(Number)
        const isoString = formatDateToISO(endDate, hours, minutes)
        handleInputChange('endDate', isoString)
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề không được để trống'
    } else if (formData.title.length < 3) {
      newErrors.title = 'Tiêu đề phải có ít nhất 3 ký tự'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Mô tả không được để trống'
    } else if (formData.description.length < 10) {
      newErrors.description = 'Mô tả phải có ít nhất 10 ký tự'
    }

    // Only validate discount value if not free shipping
    if (formData.discountType !== 'freeship') {
      if (formData.discountValue === undefined || formData.discountValue === null) {
        newErrors.discountValue = 'Giá trị giảm giá không được để trống'
      } else if (formData.discountValue <= 0) {
        newErrors.discountValue = 'Giá trị giảm giá phải lớn hơn 0'
      } else if (formData.discountType === 'percentage' && formData.discountValue > 100) {
        newErrors.discountValue = 'Phần trăm giảm giá không được vượt quá 100%'
      }
    }

    if (formData.minValueDiscount && formData.minValueDiscount <= 0) {
      newErrors.minValueDiscount = 'Giá trị đơn tối thiểu phải lớn hơn 0'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Ngày bắt đầu không được để trống'
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Ngày kết thúc không được để trống'
    }

    // Validate start time not after current time if start date is today
    if (formData.startDate) {
      const startDate = new Date(formData.startDate)
      const today = new Date()

      // Check if start date is today
      if (startDate.toDateString() === today.toDateString()) {
        const [hours, minutes] = startTime.split(':').map(Number)
        const selectedTime = new Date(startDate)
        selectedTime.setHours(hours, minutes, 0, 0)

        const now = new Date()
        now.setSeconds(0, 0) // Ignore seconds for comparison

        if (selectedTime <= now) {
          newErrors.startTime = 'Giờ bắt đầu không được trước hoặc bằng giờ hiện tại khi chọn ngày hôm nay'
        }
      }
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      if (start >= end) {
        newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu'
      }
    }

    if (formData.maxQuantity && formData.maxQuantity <= 0) {
      newErrors.maxQuantity = 'Số lượng tối đa phải lớn hơn 0'
    }

    if (formData.maxPerUser === undefined || formData.maxPerUser === null) {
      newErrors.maxPerUser = 'Số lượt sử dụng tối đa mỗi user không được để trống'
    } else if (formData.maxPerUser <= 0) {
      newErrors.maxPerUser = 'Số lượt sử dụng tối đa mỗi user phải lớn hơn 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!onSubmit) return

    if (!validateForm()) {
      return
    }

    // Prepare final data
    const finalData: PromotionSellerRequest = {
      ...formData,
      discountValue: formData.discountType === 'freeship' ? 0 : (formData.discountValue ?? 0),
      maxPerUser: formData.maxPerUser ?? 1,
      productIds: selectedProducts
    }

    console.log('🔍 Submitting promotion data:', finalData)
    console.log('🔍 Mode:', mode)
    console.log('🔍 Promotion ID:', promotion?.id)

    try {
      await onSubmit(finalData)
      toast.success(mode === 'create' ? 'Tạo khuyến mãi thành công!' : 'Cập nhật khuyến mãi thành công!')
      onClose()
    } catch (error) {
      console.error('Error submitting promotion:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error)?.message ||
        (mode === 'create' ? 'Có lỗi xảy ra khi tạo khuyến mãi' : 'Có lỗi xảy ra khi cập nhật khuyến mãi')
      toast.error(errorMessage)
    }
  }

  const addProduct = (productId: string) => {
    if (!selectedProducts.includes(productId)) {
      setSelectedProducts((prev) => [...prev, productId])
    }
  }

  const removeProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((id) => id !== productId))
  }

  const getSelectedProductNames = () => {
    return selectedProducts.map((productId) => {
      const product = products.find((p) => p.id === productId)
      return product ? product.name : productId
    })
  }

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A'

      let date: Date
      if (dateString.includes(' ') && dateString.includes('/')) {
        // Backend format: "HH:mm:ss dd/MM/yyyy"
        const [timePart, datePart] = dateString.split(' ')
        const [hours, minutes, seconds] = timePart.split(':')
        const [day, month, year] = datePart.split('/')
        date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
          parseInt(seconds)
        )
      } else {
        // ISO format
        date = new Date(dateString)
      }

      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }

      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return 'Invalid Date'
    }
  }

  const isExpired = (endDate: string) => {
    try {
      if (!endDate) return false

      let date: Date
      if (endDate.includes(' ') && endDate.includes('/')) {
        // Backend format: "HH:mm:ss dd/MM/yyyy"
        const [timePart, datePart] = endDate.split(' ')
        const [hours, minutes, seconds] = timePart.split(':')
        const [day, month, year] = datePart.split('/')
        date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
          parseInt(seconds)
        )
      } else {
        // ISO format
        date = new Date(endDate)
      }

      if (isNaN(date.getTime())) {
        return false
      }

      return date < new Date()
    } catch (error) {
      console.error('Error checking if expired:', endDate, error)
      return false
    }
  }

  const getStatusBadge = () => {
    if (!promotion) return null

    if (isExpired(promotion.endDate)) {
      return (
        <Badge variant='destructive' className='flex items-center gap-1'>
          <XCircle className='h-3 w-3' />
          Hết hạn
        </Badge>
      )
    }
    if (promotion.isActive) {
      return (
        <Badge variant='default' className='flex items-center gap-1 bg-green-500'>
          <CheckCircle className='h-3 w-3' />
          Hoạt động
        </Badge>
      )
    }
    return (
      <Badge variant='secondary' className='flex items-center gap-1'>
        <AlertCircle className='h-3 w-3' />
        Tạm dừng
      </Badge>
    )
  }

  const getDiscountIcon = (discountType: string) => {
    switch (discountType) {
      case 'percentage':
        return <Percent className='h-5 w-5 text-blue-500' />
      case 'fixed_amount':
        return <span className='text-green-500 font-bold'>₫</span>
      case 'freeship':
        return <Users className='h-5 w-5 text-purple-500' />
      default:
        return <Percent className='h-5 w-5 text-gray-500' />
    }
  }

  const getDiscountTypeLabel = (discountType: string) => {
    switch (discountType) {
      case 'percentage':
        return 'Phần trăm'
      case 'fixed_amount':
        return 'Số tiền cố định'
      case 'freeship':
        return 'Miễn phí vận chuyển'
      default:
        return 'Không xác định'
    }
  }

  console.log('🔍 Rendering modal with:', {
    isOpen,
    mode,
    isEditing,
    promotion: !!promotion,
    startDate,
    endDate
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center justify-between'>
            <div className='flex items-center gap-2 text-xl'>
              <Tag className='h-5 w-5 text-blue-500' />
              {mode === 'create' ? 'Tạo Khuyến Mãi Mới' : mode === 'edit' ? 'Chỉnh sửa Khuyến Mãi' : 'Chi tiết Khuyến Mãi'}
            </div>
            {mode === 'view' && (
              <Button variant='outline' size='sm' onClick={() => setIsEditing(true)}>
                <Edit className='h-4 w-4 mr-2' />
                Chỉnh sửa
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {isEditing ? (
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cơ bản</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='title'>Tiêu đề *</Label>
                    <Input
                      id='title'
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder='Nhập tiêu đề promotion'
                      className={cn(errors.title && 'border-red-500')}
                      required
                    />
                    {errors.title && <p className='text-sm text-red-600'>{errors.title}</p>}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='discountType'>Loại giảm giá *</Label>
                    <Select
                      value={formData.discountType}
                      onValueChange={(value: DiscountType) => handleInputChange('discountType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='percentage'>Phần trăm (%)</SelectItem>
                        <SelectItem value='fixed_amount'>Số tiền cố định (₫)</SelectItem>
                        <SelectItem value='freeship'>Miễn phí vận chuyển</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='description'>Mô tả *</Label>
                  <Textarea
                    id='description'
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder='Nhập mô tả chi tiết về promotion'
                    rows={3}
                    className={cn(errors.description && 'border-red-500')}
                    required
                  />
                  {errors.description && <p className='text-sm text-red-600'>{errors.description}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Discount Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt giảm giá</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='discountValue'>
                      Giá trị giảm giá *{formData.discountType === 'percentage' && ' (%)'}
                      {formData.discountType === 'fixed_amount' && ' (₫)'}
                    </Label>
                    <Input
                      id='discountValue'
                      type='number'
                      min='0'
                      max={formData.discountType === 'percentage' ? 100 : undefined}
                      step={formData.discountType === 'percentage' ? '1' : '0.01'}
                      value={formData.discountType === 'freeship' ? 0 : (formData.discountValue ?? '')}
                      onChange={(e) => handleInputChange('discountValue', e.target.value)}
                      placeholder={formData.discountType === 'percentage' ? 'Nhập %' : 'Nhập số tiền'}
                      className={cn(
                        errors.discountValue && 'border-red-500',
                        '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]'
                      )}
                      disabled={formData.discountType === 'freeship'}
                      required
                    />
                    {errors.discountValue && <p className='text-sm text-red-600'>{errors.discountValue}</p>}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='minValueDiscount'>Giá trị đơn hàng tối thiểu (₫)</Label>
                    <Input
                      id='minValueDiscount'
                      type='number'
                      min='0'
                      step='1000'
                      value={formData.minValueDiscount ?? ''}
                      onChange={(e) => handleInputChange('minValueDiscount', e.target.value)}
                      placeholder='Nhập số tiền tối thiểu'
                      className={cn(
                        errors.minValueDiscount && 'border-red-500',
                        '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]'
                      )}
                    />
                    {errors.minValueDiscount && <p className='text-sm text-red-600'>{errors.minValueDiscount}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date & Time Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Thời gian áp dụng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Ngày bắt đầu *</Label>
                    <div className='flex gap-2'>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant='outline'
                            className={cn('flex-1 justify-start text-left font-normal', errors.startDate && 'border-red-500')}
                          >
                            <CalendarIcon className='mr-2 h-4 w-4' />
                            {startDate ? format(startDate, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0'>
                          <Calendar
                            mode='single'
                            selected={startDate}
                            onSelect={(date) => handleDateChange(date, 'start')}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Input
                        type='time'
                        value={startTime}
                        onChange={(e) => handleTimeChange(e.target.value, 'start')}
                        className={cn('w-24', errors.startTime && 'border-red-500')}
                      />
                    </div>
                    {errors.startDate && <p className='text-sm text-red-600'>{errors.startDate}</p>}
                    {errors.startTime && <p className='text-sm text-red-600'>{errors.startTime}</p>}
                  </div>

                  <div className='space-y-2'>
                    <Label>Ngày kết thúc *</Label>
                    <div className='flex gap-2'>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant='outline'
                            className={cn('flex-1 justify-start text-left font-normal', errors.endDate && 'border-red-500')}
                          >
                            <CalendarIcon className='mr-2 h-4 w-4' />
                            {endDate ? format(endDate, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0'>
                          <Calendar
                            mode='single'
                            selected={endDate}
                            onSelect={(date) => handleDateChange(date, 'end')}
                            disabled={(date) => {
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)
                              if (startDate) {
                                const start = new Date(startDate)
                                start.setHours(0, 0, 0, 0)
                                return date <= start
                              }
                              return date < today
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Input
                        type='time'
                        value={endTime}
                        onChange={(e) => handleTimeChange(e.target.value, 'end')}
                        className='w-24'
                      />
                    </div>
                    {errors.endDate && <p className='text-sm text-red-600'>{errors.endDate}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Limits */}
            <Card>
              <CardHeader>
                <CardTitle>Giới hạn sử dụng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='maxQuantity'>Số lượng tối đa</Label>
                    <Input
                      id='maxQuantity'
                      type='number'
                      min='0'
                      value={formData.maxQuantity ?? ''}
                      onChange={(e) => handleInputChange('maxQuantity', e.target.value)}
                      placeholder='Không giới hạn nếu để trống'
                      className={cn(
                        errors.maxQuantity && 'border-red-500',
                        '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]'
                      )}
                    />
                    {errors.maxQuantity && <p className='text-sm text-red-600'>{errors.maxQuantity}</p>}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='maxPerUser'>Tối đa/user *</Label>
                    <Input
                      id='maxPerUser'
                      type='number'
                      min='1'
                      value={formData.maxPerUser ?? ''}
                      onChange={(e) => handleInputChange('maxPerUser', e.target.value)}
                      placeholder='Nhập số lượt sử dụng tối đa'
                      className={cn(
                        errors.maxPerUser && 'border-red-500',
                        '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]'
                      )}
                      required
                    />
                    {errors.maxPerUser && <p className='text-sm text-red-600'>{errors.maxPerUser}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Selection */}
           

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Trạng thái</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center space-x-2'>
                  <Switch
                    id='isActive'
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                  <Label htmlFor='isActive'>Kích hoạt promotion</Label>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className='flex justify-end gap-3 pt-4 border-t'>
              <Button type='button' variant='outline' onClick={onClose}>
                Hủy
              </Button>
              <Button variant='yellow' type='submit' disabled={loading}>
                {loading ? 'Đang xử lý...' : mode === 'create' ? 'Tạo khuyến mãi' : 'Cập nhật'}
              </Button>
            </div>
          </form>
        ) : (
          <div className='space-y-6'>
            {/* Header Info */}
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <h2 className='text-2xl font-bold text-gray-900 mb-2'>{promotion?.title}</h2>
                    <p className='text-gray-600 text-lg leading-relaxed'>{promotion?.description}</p>
                  </div>
                  <div className='ml-4'>{getStatusBadge()}</div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='flex items-center gap-3'>
                    <div className='h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center'>
                      <Tag className='h-5 w-5 text-blue-600' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>ID Promotion</p>
                      <p className='text-sm text-gray-900 font-mono'>{promotion?.id}</p>
                    </div>
                  </div>

                  <div className='flex items-center gap-3'>
                    <div className='h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center'>
                      <Target className='h-5 w-5 text-purple-600' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>Store ID</p>
                      <p className='text-sm text-gray-900 font-mono'>{promotion?.storeId}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Discount Info */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <TrendingUp className='h-5 w-5 text-green-500' />
                  Thông tin Giảm giá
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <div className='text-center p-4 bg-gray-50 rounded-lg'>
                    <div className='flex items-center justify-center mb-2'>{getDiscountIcon(promotion?.discountType || 'percentage')}</div>
                    <p className='text-sm font-medium text-gray-600'>Loại giảm giá</p>
                    <p className='text-lg font-bold text-gray-900'>{getDiscountTypeLabel(promotion?.discountType || 'percentage')}</p>
                  </div>

                  <div className='text-center p-4 bg-gray-50 rounded-lg'>
                    <p className='text-sm font-medium text-gray-600'>Giá trị giảm</p>
                    <p className='text-lg font-bold text-gray-900'>
                      {promotion?.discountType === 'percentage'
                        ? `${promotion?.discountValue}%`
                        : `${promotion?.discountValue?.toLocaleString()}₫`}
                    </p>
                  </div>

                  {promotion?.minValueDiscount && (
                    <div className='text-center p-4 bg-gray-50 rounded-lg'>
                      <div className='flex items-center justify-center mb-2'>
                        <Target className='h-5 w-5 text-orange-500' />
                      </div>
                      <p className='text-sm font-medium text-gray-600'>Giá trị tối thiểu</p>
                      <p className='text-lg font-bold text-gray-900'>{promotion.minValueDiscount.toLocaleString()}₫</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Time Info */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Clock className='h-5 w-5 text-blue-500' />
                  Thông tin Thời gian
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-4'>
                    <div className='flex items-center gap-3'>
                      <div className='h-8 w-8 bg-green-100 rounded-full flex items-center justify-center'>
                        <CalendarIcon className='h-4 w-4 text-green-600' />
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-600'>Ngày bắt đầu</p>
                        <p className='text-sm text-gray-900'>{promotion?.startDate ? formatDate(promotion.startDate) : 'N/A'}</p>
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      <div className='h-8 w-8 bg-red-100 rounded-full flex items-center justify-center'>
                        <CalendarIcon className='h-4 w-4 text-red-600' />
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-600'>Ngày kết thúc</p>
                        <p className='text-sm text-gray-900'>{promotion?.endDate ? formatDate(promotion.endDate) : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <div className='flex items-center gap-3'>
                      <div className='h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center'>
                        <Clock className='h-4 w-4 text-blue-600' />
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-600'>Ngày tạo</p>
                        <p className='text-sm text-gray-900'>{promotion?.createdAt ? formatDate(promotion.createdAt) : 'N/A'}</p>
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      <div className='h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center'>
                        <Clock className='h-4 w-4 text-purple-600' />
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-600'>Cập nhật lần cuối</p>
                        <p className='text-sm text-gray-900'>{promotion?.updatedAt ? formatDate(promotion.updatedAt) : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Info */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='h-5 w-5 text-purple-500' />
                  Thông tin Sử dụng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <div className='text-center p-4 bg-gray-50 rounded-lg'>
                    <div className='flex items-center justify-center mb-2'>
                      <TrendingUp className='h-5 w-5 text-blue-500' />
                    </div>
                    <p className='text-sm font-medium text-gray-600'>Đã sử dụng</p>
                    <p className='text-lg font-bold text-gray-900'>{promotion?.usedQuantity || 0}</p>
                  </div>

                  <div className='text-center p-4 bg-gray-50 rounded-lg'>
                    <div className='flex items-center justify-center mb-2'>
                      <Target className='h-5 w-5 text-green-500' />
                    </div>
                    <p className='text-sm font-medium text-gray-600'>Tổng số lượng</p>
                    <p className='text-lg font-bold text-gray-900'>{promotion?.maxQuantity || '∞'}</p>
                  </div>

                  <div className='text-center p-4 bg-gray-50 rounded-lg'>
                    <div className='flex items-center justify-center mb-2'>
                      <Users className='h-5 w-5 text-purple-500' />
                    </div>
                    <p className='text-sm font-medium text-gray-600'>Tối đa/user</p>
                    <p className='text-lg font-bold text-gray-900'>{promotion?.maxPerUser}</p>
                  </div>
                </div>

                {/* Usage Progress Bar */}
                {promotion?.maxQuantity && promotion.maxQuantity > 0 && (
                  <div className='mt-6'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm font-medium text-gray-600'>Tiến độ sử dụng</span>
                      <span className='text-sm text-gray-600'>
                        {promotion.usedQuantity || 0} / {promotion.maxQuantity}
                      </span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-blue-500 h-2 rounded-full transition-all duration-300'
                        style={{
                          width: `${Math.min(((promotion.usedQuantity || 0) / promotion.maxQuantity) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default PromotionDetailModal