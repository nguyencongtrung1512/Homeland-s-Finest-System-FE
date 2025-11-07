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
  DollarSign,
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
      setFormData((prev) => ({
        ...prev,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }))
      console.log('🔍 Updated formData with ISO dates:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
    }
  }, [startDate, endDate, mode])

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

  // Form handlers
  const handleInputChange = (
    field: keyof PromotionSellerRequest,
    value: string | number | boolean | string[] | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDateChange = (date: Date | undefined, type: 'start' | 'end') => {
    if (type === 'start') {
      setStartDate(date)
      if (date) {
        const [hours, minutes] = startTime.split(':')
        const newDate = new Date(date)
        newDate.setHours(parseInt(hours), parseInt(minutes))
        handleInputChange('startDate', newDate.toISOString())
      }
    } else {
      setEndDate(date)
      if (date) {
        const [hours, minutes] = endTime.split(':')
        const newDate = new Date(date)
        newDate.setHours(parseInt(hours), parseInt(minutes))
        handleInputChange('endDate', newDate.toISOString())
      }
    }
  }

  const handleTimeChange = (time: string, type: 'start' | 'end') => {
    if (type === 'start') {
      setStartTime(time)
      if (startDate) {
        const [hours, minutes] = time.split(':')
        const newDate = new Date(startDate)
        newDate.setHours(parseInt(hours), parseInt(minutes))
        handleInputChange('startDate', newDate.toISOString())
      }
    } else {
      setEndTime(time)
      if (endDate) {
        const [hours, minutes] = time.split(':')
        const newDate = new Date(endDate)
        newDate.setHours(parseInt(hours), parseInt(minutes))
        handleInputChange('endDate', newDate.toISOString())
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!onSubmit) return

    // Validate required fields
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tiêu đề promotion')
      return
    }

    if (!formData.description.trim()) {
      alert('Vui lòng nhập mô tả promotion')
      return
    }

    if (formData.discountValue <= 0) {
      alert('Vui lòng nhập giá trị giảm giá hợp lệ')
      return
    }

    if (!formData.startDate || !formData.endDate) {
      alert('Vui lòng chọn ngày bắt đầu và kết thúc')
      return
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      alert('Ngày kết thúc phải sau ngày bắt đầu')
      return
    }

    const finalData = {
      ...formData,
      productIds: selectedProducts
    }

    console.log('🔍 Submitting promotion data:', finalData)
    console.log('🔍 Mode:', mode)
    console.log('🔍 Promotion ID:', promotion?.id)
    console.log('🔍 Final startDate:', finalData.startDate)
    console.log('🔍 Final endDate:', finalData.endDate)
    console.log('🔍 StartDate type:', typeof finalData.startDate)
    console.log('🔍 EndDate type:', typeof finalData.endDate)

    try {
      await onSubmit(finalData)
      onClose()
    } catch (error) {
      console.error('Error submitting promotion:', error)
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
        return <DollarSign className='h-5 w-5 text-green-500' />
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
              {mode === 'create' ? 'Tạo Promotion Mới' : mode === 'edit' ? 'Chỉnh sửa Promotion' : 'Chi tiết Promotion'}
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
                      required
                    />
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
                    required
                  />
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
                    <Label htmlFor='discountValue'>Giá trị giảm giá *</Label>
                    <Input
                      id='discountValue'
                      type='number'
                      min='0'
                      step='0.01'
                      value={formData.discountValue}
                      onChange={(e) => handleInputChange('discountValue', parseFloat(e.target.value) || 0)}
                      placeholder={formData.discountType === 'percentage' ? 'Nhập %' : 'Nhập số tiền'}
                      required
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='minValueDiscount'>Giá trị đơn hàng tối thiểu</Label>
                    <Input
                      id='minValueDiscount'
                      type='number'
                      min='0'
                      step='1000'
                      value={formData.minValueDiscount || ''}
                      onChange={(e) => handleInputChange('minValueDiscount', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder='Nhập số tiền tối thiểu'
                    />
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
                          <Button variant='outline' className='flex-1 justify-start text-left font-normal'>
                            <CalendarIcon className='mr-2 h-4 w-4' />
                            {startDate ? format(startDate, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0'>
                          <Calendar
                            mode='single'
                            selected={startDate}
                            onSelect={(date) => handleDateChange(date, 'start')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Input
                        type='time'
                        value={startTime}
                        onChange={(e) => handleTimeChange(e.target.value, 'start')}
                        className='w-24'
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label>Ngày kết thúc *</Label>
                    <div className='flex gap-2'>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant='outline' className='flex-1 justify-start text-left font-normal'>
                            <CalendarIcon className='mr-2 h-4 w-4' />
                            {endDate ? format(endDate, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0'>
                          <Calendar
                            mode='single'
                            selected={endDate}
                            onSelect={(date) => handleDateChange(date, 'end')}
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
                      value={formData.maxQuantity || ''}
                      onChange={(e) => handleInputChange('maxQuantity', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder='Không giới hạn nếu để trống'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='maxPerUser'>Tối đa/user *</Label>
                    <Input
                      id='maxPerUser'
                      type='number'
                      min='1'
                      value={formData.maxPerUser}
                      onChange={(e) => handleInputChange('maxPerUser', parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Selection */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Package className='h-5 w-5 text-blue-500' />
                  Sản phẩm áp dụng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {/* Search Products */}
                  <div className='space-y-2'>
                    <Label htmlFor='productSearch'>Tìm kiếm sản phẩm</Label>
                    <div className='relative'>
                      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                      <Input
                        id='productSearch'
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        placeholder='Tìm kiếm theo tên hoặc ID sản phẩm...'
                        className='pl-10'
                      />
                    </div>
                  </div>

                  {/* Products List */}
                  <div className='space-y-2'>
                    <Label>Danh sách sản phẩm</Label>
                    {productsLoading ? (
                      <div className='flex items-center justify-center py-8'>
                        <Loading />
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <EmptyState
                        type='search'
                        title='Không tìm thấy sản phẩm nào'
                        description='Hãy thử tìm kiếm với từ khóa khác'
                        showAction={false}
                      />
                    ) : (
                      <div className='max-h-60 overflow-y-auto border rounded-lg'>
                        {filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            className={`flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50 ${selectedProducts.includes(product.id) ? 'bg-blue-50' : ''
                              }`}
                          >
                            <div className='flex-1'>
                              <div className='flex items-center gap-2'>
                                <h4 className='font-medium text-sm'>{product.name}</h4>
                                {product.isActive ? (
                                  <Badge variant='default' className='text-xs bg-green-100 text-green-800'>
                                    Hoạt động
                                  </Badge>
                                ) : (
                                  <Badge variant='secondary' className='text-xs'>
                                    Tạm dừng
                                  </Badge>
                                )}
                              </div>
                              <p className='text-xs text-gray-500 mt-1'>ID: {product.id}</p>
                              <p className='text-xs text-gray-600 mt-1 line-clamp-2'>{product.description}</p>
                            </div>
                            <Button
                              type='button'
                              variant={selectedProducts.includes(product.id) ? 'default' : 'outline'}
                              size='sm'
                              onClick={() => {
                                if (selectedProducts.includes(product.id)) {
                                  removeProduct(product.id)
                                } else {
                                  addProduct(product.id)
                                }
                              }}
                              className='ml-2'
                            >
                              {selectedProducts.includes(product.id) ? (
                                <>
                                  <X className='h-3 w-3 mr-1' />
                                  Bỏ chọn
                                </>
                              ) : (
                                <>
                                  <Plus className='h-3 w-3 mr-1' />
                                  Chọn
                                </>
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Products */}
                  {selectedProducts.length > 0 && (
                    <div className='space-y-2'>
                      <Label>Sản phẩm đã chọn ({selectedProducts.length})</Label>
                      <div className='flex flex-wrap gap-2'>
                        {getSelectedProductNames().map((productName, index) => (
                          <Badge key={selectedProducts[index]} variant='secondary' className='flex items-center gap-1'>
                            {productName}
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              onClick={() => removeProduct(selectedProducts[index])}
                              className='h-4 w-4 p-0 hover:bg-transparent'
                            >
                              <X className='h-3 w-3' />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

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
              <Button type='submit' disabled={loading}>
                {loading ? 'Đang xử lý...' : mode === 'create' ? 'Tạo Promotion' : 'Cập nhật'}
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
                    <div className='flex items-center justify-center mb-2'>
                      <DollarSign className='h-5 w-5 text-green-500' />
                    </div>
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