import type React from 'react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Checkbox } from '../ui/checkbox'
import { Slider } from '../ui/slider'
import { CalendarIcon, Clock, Loader2, Save, X, Search, Gift } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { cn } from '../../lib/utils'
import { getUsers, type User } from '../../apis/user.api'
import {
  type PromotionFormProps,
  type PromotionFormData,
  type PromotionFormErrors,
  type PromotionType,
  type PromotionAdminDTO,
  type DiscountType,
  DISCOUNT_TYPES,
  PROMOTION_TYPE_LABELS,
  DISCOUNT_TYPE_LABELS
} from '../../types/promotionType'

const PromotionForm: React.FC<PromotionFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false
}) => {
  // Map API discountType format to frontend format
  const mapDiscountTypeFromAPI = (apiDiscountType: string): DiscountType => {
    if (!apiDiscountType) return 'percentage'

    const normalized = apiDiscountType.toLowerCase()

    switch (normalized) {
      case 'freeship':
        return 'freeship'
      case 'fixedamount':
      case 'fixed_amount':
        return 'fixed_amount'
      case 'percentage':
        return 'percentage'
      default:
        // Try original case mapping for API format
        switch (apiDiscountType) {
          case 'FreeShip':
            return 'freeship'
          case 'FixedAmount':
            return 'fixed_amount'
          case 'Percentage':
            return 'percentage'
          default:
            console.warn('Unknown discountType from API:', apiDiscountType)
            return 'percentage'
        }
    }
  }

  // Map frontend discountType format to API format
  const mapDiscountTypeToAPI = (frontendDiscountType: DiscountType): string => {
    switch (frontendDiscountType) {
      case 'freeship':
        return 'FreeShip'
      case 'fixed_amount':
        return 'FixedAmount'
      case 'percentage':
        return 'Percentage'
      default:
        console.warn('Unknown frontend discountType:', frontendDiscountType)
        return 'Percentage'
    }
  }

  const [formData, setFormData] = useState<PromotionFormData>({
    type: 'Global',
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: undefined,
    minValueDiscount: undefined,
    startDate: '',
    endDate: '',
    maxQuantity: undefined,
    maxPerUser: undefined,
    isActive: true,
    isPrivate: true, // Default to true for User type promotions
    userIds: []
  })

  const [errors, setErrors] = useState<PromotionFormErrors>({})
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [isInitialized, setIsInitialized] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [pointRange, setPointRange] = useState<[number, number]>([0, 1000])

  // Debug formData changes
  useEffect(() => {
    console.log('🔄 FormData discountType changed to:', formData.discountType)
    console.log('🔄 Type of discountType:', typeof formData.discountType)
  }, [formData.discountType])

  const adminPromotionTypes = ['Global', 'User'] as const
  const MONTH_OPTIONS = [
    { value: 'all', label: 'Tất cả tháng' },
    { value: '1', label: 'Tháng 1' },
    { value: '2', label: 'Tháng 2' },
    { value: '3', label: 'Tháng 3' },
    { value: '4', label: 'Tháng 4' },
    { value: '5', label: 'Tháng 5' },
    { value: '6', label: 'Tháng 6' },
    { value: '7', label: 'Tháng 7' },
    { value: '8', label: 'Tháng 8' },
    { value: '9', label: 'Tháng 9' },
    { value: '10', label: 'Tháng 10' },
    { value: '11', label: 'Tháng 11' },
    { value: '12', label: 'Tháng 12' }
  ]

  const loadUsers = useCallback(async (searchTerm = '') => {
    setLoadingUsers(true)
    try {
      const userList = await getUsers({
        pageSize: 0,
        pageNumber: 1,
        isActive: true,
        role: 'Customer',
        searchTerm: searchTerm || undefined
      })
      setUsers(userList)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  useEffect(() => {
    if (initialData && !isInitialized) {
      console.log('📝 Initializing form data for edit:', initialData)
      console.log('📝 Initial discountType from API:', initialData.discountType)
      console.log('📝 isInitialized:', isInitialized)

      let processedStartDate = ''
      let processedEndDate = ''

      if (initialData.startDate) {
        try {
          if (initialData.startDate.includes(' ') && initialData.startDate.includes('/')) {
            const [timePart, datePart] = initialData.startDate.split(' ')
            const [hours, minutes, seconds] = timePart.split(':')
            const [day, month, year] = datePart.split('/')
            const date = new Date(
              Number.parseInt(year),
              Number.parseInt(month) - 1,
              Number.parseInt(day),
              Number.parseInt(hours),
              Number.parseInt(minutes),
              Number.parseInt(seconds)
            )
            // Subtract 7 hours to convert from UTC+7 to local time for display
            const adjustedDate = new Date(date.getTime() - 7 * 60 * 60 * 1000)
            processedStartDate = adjustedDate.toISOString()
            setStartTime(`${hours}:${minutes}`)
          } else {
            // Subtract 7 hours to convert from UTC+7 to local time for display
            const backendDate = new Date(initialData.startDate)
            const adjustedDate = new Date(backendDate.getTime() - 7 * 60 * 60 * 1000)
            processedStartDate = adjustedDate.toISOString()
            setStartTime(
              `${adjustedDate.getHours().toString().padStart(2, '0')}:${adjustedDate.getMinutes().toString().padStart(2, '0')}`
            )
          }
        } catch (error) {
          console.error('Error parsing startDate:', error)
          processedStartDate = new Date().toISOString()
        }
      }

      if (initialData.endDate) {
        try {
          if (initialData.endDate.includes(' ') && initialData.endDate.includes('/')) {
            const [timePart, datePart] = initialData.endDate.split(' ')
            const [hours, minutes, seconds] = timePart.split(':')
            const [day, month, year] = datePart.split('/')
            const date = new Date(
              Number.parseInt(year),
              Number.parseInt(month) - 1,
              Number.parseInt(day),
              Number.parseInt(hours),
              Number.parseInt(minutes),
              Number.parseInt(seconds)
            )
            // Subtract 7 hours to convert from UTC+7 to local time for display
            const adjustedDate = new Date(date.getTime() - 7 * 60 * 60 * 1000)
            processedEndDate = adjustedDate.toISOString()
            setEndTime(`${hours}:${minutes}`)
          } else {
            // Subtract 7 hours to convert from UTC+7 to local time for display
            const backendDate = new Date(initialData.endDate)
            const adjustedDate = new Date(backendDate.getTime() - 7 * 60 * 60 * 1000)
            processedEndDate = adjustedDate.toISOString()
            setEndTime(
              `${adjustedDate.getHours().toString().padStart(2, '0')}:${adjustedDate.getMinutes().toString().padStart(2, '0')}`
            )
          }
        } catch (error) {
          console.error('Error parsing endDate:', error)
          processedEndDate = new Date().toISOString()
        }
      }

      let userIds: string[] = []
      if (initialData.type === 'User') {
        const promotionData = initialData as PromotionAdminDTO
        if (promotionData.promotionUsers && promotionData.promotionUsers.length > 0) {
          userIds = promotionData.promotionUsers.map((pu: { userID: string }) => pu.userID)
        }
      }

      const processedType = initialData.type || 'Global'
      const mappedDiscountType = mapDiscountTypeFromAPI(initialData.discountType || 'percentage')
      console.log('📝 Mapped discountType:', mappedDiscountType)

      const processedData = {
        ...initialData,
        type: processedType,
        discountType: mappedDiscountType,
        startDate: processedStartDate,
        endDate: processedEndDate,
        userIds: userIds,
        isPrivate: initialData.isPrivate ?? (processedType === 'User' ? true : undefined)
      }
      setFormData(processedData)
      setIsInitialized(true)
    }
  }, [initialData, isInitialized])

  useEffect(() => {
    if (formData.type === 'User') {
      const timeoutId = setTimeout(
        () => {
          loadUsers(userSearchTerm)
        },
        userSearchTerm ? 500 : 0
      )

      return () => clearTimeout(timeoutId)
    }
  }, [formData.type, userSearchTerm, loadUsers])


  const validateForm = (): boolean => {
    const newErrors: PromotionFormErrors = {}

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
          newErrors.startTime = 'Giờ bắt đầu không được sau giờ hiện tại khi chọn ngày hôm nay'
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

    // if (formData.type === 'User' && (!formData.userIds || formData.userIds.length === 0)) {
    //   newErrors.userIds = 'Phải chọn ít nhất một user cho promotion cá nhân'
    // }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      // Remove discountValue if discountType is freeship
      const submitData = { ...formData }
      if (submitData.discountType === 'freeship') {
        submitData.discountValue = 0
      } else {
        // Ensure discountValue is a number (validation ensures it's not undefined)
        submitData.discountValue = submitData.discountValue ?? 0
      }

      // Ensure maxPerUser is a number (validation ensures it's not undefined)
      submitData.maxPerUser = submitData.maxPerUser ?? 1

      // Map discountType to API format
      const apiData = {
        ...submitData,
        discountType: mapDiscountTypeToAPI(submitData.discountType) as DiscountType // Type assertion for API compatibility
      }

      // Note: Dates are sent with +7 hours added to match Vietnam timezone (UTC+7)
      console.log('📝 Submitting form data:', apiData)
      console.log('📝 Original frontend discountType:', submitData.discountType)
      console.log('📝 Mapped API discountType:', apiData.discountType)
      console.log('📝 Start Date (ISO with +7h):', apiData.startDate)
      console.log('📝 End Date (ISO with +7h):', apiData.endDate)
      onSubmit(apiData)
    }
  }

  // Helper function to handle number input and remove leading zeros
  const handleNumberInput = (value: string): number | undefined => {
    if (!value || value.trim() === '') {
      return undefined
    }
    // Remove leading zeros except for single "0"
    // If value is "0011", it becomes "11"
    // If value is "0", it stays "0"
    const trimmedValue = value.trim()
    if (trimmedValue === '0') {
      return 0
    }
    // Remove leading zeros for numbers with more than one digit
    const cleanedValue = trimmedValue.replace(/^0+/, '') || '0'
    const numValue = Number(cleanedValue)
    return isNaN(numValue) ? undefined : numValue
  }

  const handleInputChange = (
    field: keyof PromotionFormData,
    value: string | number | boolean | string[] | undefined
  ) => {
    if (field === 'type') {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value as PromotionType }
        if (value !== 'User' && !isEdit) {
          newData.userIds = []
          newData.isPrivate = undefined
        } else if (value === 'User') {
          newData.isPrivate = newData.isPrivate ?? true
        }
        return newData
      })
    } else if (field === 'discountType') {
      console.log('🔄 Discount type changed to:', value)
      setFormData((prev) => ({ ...prev, [field]: value as DiscountType }))
    } else if (
      field === 'discountValue' ||
      field === 'minValueDiscount' ||
      field === 'maxQuantity' ||
      field === 'maxPerUser'
    ) {
      // Handle number inputs with string value to process leading zeros
      const processedValue = typeof value === 'string' ? handleNumberInput(value) : value
      setFormData((prev) => ({ ...prev, [field]: processedValue }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

    if (errors[field as keyof PromotionFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    if (date) {
      const selectedTime = field === 'startDate' ? startTime : endTime
      const [hours, minutes] = selectedTime.split(':')
      const combinedDate = new Date(date)
      combinedDate.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)

      // Add 7 hours to match Vietnam timezone (UTC+7)
      const adjustedDate = new Date(combinedDate.getTime() + 7 * 60 * 60 * 1000)
      handleInputChange(field, adjustedDate.toISOString())
    }
  }

  const handleTimeChange = (field: 'startDate' | 'endDate', time: string) => {
    if (field === 'startDate') {
      setStartTime(time)
    } else {
      setEndTime(time)
    }

    const currentDate = field === 'startDate' ? formData.startDate : formData.endDate
    if (currentDate) {
      const date = new Date(currentDate)
      const [hours, minutes] = time.split(':')
      date.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)

      // Add 7 hours to match Vietnam timezone (UTC+7)
      const adjustedDate = new Date(date.getTime() + 7 * 60 * 60 * 1000)
      handleInputChange(field, adjustedDate.toISOString())
    }
  }

  const handleUserToggle = (userId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      userIds: checked ? [...(prev.userIds || []), userId] : (prev.userIds || []).filter((id) => id !== userId)
    }))
  }

  const getMonthFromDate = (dateString?: string) => {
    if (!dateString) return null
    const parsedDate = new Date(dateString)
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.getMonth() + 1
    }
    const dateParts = dateString.split('/')
    if (dateParts.length === 3) {
      const month = Number.parseInt(dateParts[1], 10)
      return Number.isNaN(month) ? null : month
    }
    return null
  }

  const filteredUsers = useMemo(() => {
    const [minPoint, maxPoint] = pointRange

    return users.filter((user) => {
      const birthMonth = getMonthFromDate(user.dateOfBirth)
      const monthMatch = selectedMonth === 'all' || birthMonth === Number(selectedMonth)
      const points = typeof user.userPoint === 'number' ? user.userPoint : 0
      const pointMatch = points >= minPoint && points <= maxPoint
      return monthMatch && pointMatch
    })
  }, [users, selectedMonth, pointRange])

  const handlePointSliderChange = (values: number[]) => {
    if (values.length === 2) {
      const [min, max] = values
      // Đảm bảo min luôn <= max
      setPointRange([Math.min(min, max), Math.max(min, max)])
    }
  }

  const handleSelectAllUsers = () => {
    setFormData((prev) => {
      const currentIds = prev.userIds || []
      const combined = new Set([...currentIds, ...filteredUsers.map((user) => user.id)])
      return { ...prev, userIds: Array.from(combined) }
    })
  }

  const handleDeselectAllUsers = () => {
    setFormData((prev) => {
      const currentIds = prev.userIds || []
      const filteredIds = new Set(filteredUsers.map((user) => user.id))
      return { ...prev, userIds: currentIds.filter((id) => !filteredIds.has(id)) }
    })
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  }

  const headerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  }

  const sectionVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4
      }
    }
  }

  const footerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  }

  return (
    <motion.div
      className='w-full h-full flex flex-col overflow-hidden bg-white'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Header */}
      <motion.div
        className='bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 flex items-center justify-between flex-shrink-0'
        variants={headerVariants}
      >
        <div className='flex items-center gap-2 text-white'>
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Gift className='h-5 w-5' />
          </motion.div>
          <span className='font-semibold'>{isEdit ? 'Chỉnh sửa mã khuyến mãi' : 'Tạo mã khuyến mãi mới'}</span>
        </div>
        <Button
          type='button'
          variant='ghost'
          onClick={onCancel}
          disabled={loading}
          className='text-white hover:bg-white/20 hover:text-white p-2 h-auto w-auto'
        >
          <X className='h-5 w-5' />
        </Button>
      </motion.div>

      {/* Content Area - Scrollable */}
      <div className='flex-1 overflow-y-auto bg-gray-50 flex flex-col'>
        <form onSubmit={handleSubmit} className='flex flex-col h-full'>
          <div className='flex-1 space-y-4 p-4'>
            <motion.div variants={sectionVariants} className='space-y-4'>
              <h3 className='text-lg font-semibold text-blue-900 flex items-center gap-2'>
                <motion.div
                  className='w-1 h-6 bg-blue-500 rounded'
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                />
                Thông tin cơ bản
              </h3>

              <div className='space-y-2'>
                <Label htmlFor='type' className='text-blue-900 font-medium'>
                  Loại Mã khuyến mãi
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => {
                    if (value && value !== formData.type) {
                      handleInputChange('type', value)
                    }
                  }}
                >
                  <SelectTrigger className='border-blue-200 focus:ring-blue-500 focus:border-blue-500'>
                    <SelectValue placeholder='Chọn loại Mã khuyến mãi ' />
                  </SelectTrigger>
                  <SelectContent>
                    {adminPromotionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {PROMOTION_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='title' className='text-blue-900 font-medium'>
                  Tiêu đề *
                </Label>
                <Input
                  id='title'
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder='Nhập tiêu đề Mã khuyến mãi '
                  className={cn(
                    'border-blue-200 focus:ring-blue-500 focus:border-blue-500',
                    errors.title && 'border-red-500'
                  )}
                />
                {errors.title && <p className='text-sm text-red-600'>{errors.title}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='description' className='text-blue-900 font-medium'>
                  Mô tả *
                </Label>
                <Textarea
                  id='description'
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder='Nhập mô tả chi tiết về Mã khuyến mãi '
                  rows={3}
                  className={cn(
                    'border-blue-200 focus:ring-blue-500 focus:border-blue-500',
                    errors.description && 'border-red-500'
                  )}
                />
                {errors.description && <p className='text-sm text-red-600'>{errors.description}</p>}
              </div>

              {formData.type === 'User' && (
                <div className='space-y-2'>
                  <Label className='text-blue-900 font-medium'>Chọn người dùng *</Label>
                  <div className='border-2 border-blue-200 rounded-lg p-4 space-y-3 bg-blue-50'>
                    <div className='relative'>
                      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4' />
                      <Input
                        placeholder='Tìm kiếm người dùng theo tên hoặc email...'
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className='pl-10 border-blue-200 focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      <div className='space-y-1'>
                        <Label className='text-blue-900 text-sm font-medium'>Lọc theo tháng sinh</Label>
                        <Select value={selectedMonth} onValueChange={(value) => setSelectedMonth(value)}>
                          <SelectTrigger className='border-blue-200 focus:ring-blue-500 focus:border-blue-500'>
                            <SelectValue placeholder='Chọn tháng' />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTH_OPTIONS.map((month) => (
                              <SelectItem key={month.value} value={month.value}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <Label className='text-blue-900 text-sm font-medium'>Lọc theo điểm</Label>
                          <span className='text-xs text-blue-700'>
                            {pointRange[0]} - {pointRange[1]} điểm
                          </span>
                        </div>
                        <div className='px-2 py-4'>
                          <Slider
                            value={pointRange}
                            onValueChange={handlePointSliderChange}
                            min={0}
                            max={1000}
                            step={10}
                            className='w-full'
                          />
                          <div className='flex justify-between text-[11px] text-blue-500 mt-2'>
                            <span>0</span>
                            <span>1000</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-blue-700 font-medium'>
                        Đã chọn {formData.userIds?.length || 0} người dùng
                      </span>
                      <div className='space-x-2'>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={handleSelectAllUsers}
                          disabled={loadingUsers}
                          className='border-blue-300 text-blue-700 hover:bg-blue-100'
                        >
                          Chọn tất cả
                        </Button>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={handleDeselectAllUsers}
                          disabled={loadingUsers}
                          className='border-blue-300 text-blue-700 hover:bg-blue-100'
                        >
                          Bỏ chọn tất cả
                        </Button>
                      </div>
                    </div>

                    {loadingUsers ? (
                      <div className='flex items-center justify-center py-4'>
                        <Loader2 className='h-4 w-4 animate-spin mr-2 text-blue-500' />
                        <span className='text-sm text-blue-600'>Đang tải danh sách người dùng...</span>
                      </div>
                    ) : (
                      <div className='max-h-48 overflow-y-auto space-y-2'>
                        {filteredUsers.length === 0 ? (
                          <p className='text-sm text-blue-500 text-center py-4'>Không tìm thấy người dùng</p>
                        ) : (
                          filteredUsers.map((user) => {
                            const isSelected = formData.userIds?.includes(user.id) || false
                            return (
                              <div
                                key={user.id}
                                className='flex items-center space-x-2 p-2 hover:bg-blue-100 rounded transition'
                              >
                                <Checkbox
                                  id={`user-${user.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleUserToggle(user.id, checked as boolean)}
                                />
                                <Label
                                  htmlFor={`user-${user.id}`}
                                  className='flex-1 cursor-pointer text-sm text-blue-900 pl-1'
                                >
                                  {user.firstName} {user.lastName} ({user.userPoint} điểm) - ngày sinh:{' '}
                                  {user.dateOfBirth}
                                </Label>
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                  {errors.userIds && <p className='text-sm text-red-600'>{errors.userIds}</p>}

                  <div className='flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200 mt-3'>
                    <Switch
                      id='isPrivate'
                      checked={formData.isPrivate ?? true}
                      onCheckedChange={(checked) => handleInputChange('isPrivate', checked)}
                    />
                    <Label htmlFor='isPrivate' className='text-blue-900 font-medium cursor-pointer'>
                      Mã khuyến mãi riêng tư (chỉ hiển thị cho người dùng được chọn)
                    </Label>
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div variants={sectionVariants} className='space-y-4 p-4'>
              <h3 className='text-lg font-semibold text-blue-900 flex items-center gap-2'>
                <motion.div
                  className='w-1 h-6 bg-blue-500 rounded'
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                />
                Cấu hình giảm giá
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='discountType' className='text-blue-900 font-medium'>
                    Loại giảm giá *
                  </Label>
                  <Select
                    key={`discount-type-${isInitialized}`}
                    value={formData.discountType}
                    onValueChange={(value) => {
                      console.log('🔄 Changing discountType to:', value)
                      handleInputChange('discountType', value)
                    }}
                  >
                    <SelectTrigger className='border-blue-200 focus:ring-blue-500 focus:border-blue-500'>
                      <SelectValue placeholder='Chọn loại giảm giá' />
                    </SelectTrigger>
                    <SelectContent>
                      {DISCOUNT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {DISCOUNT_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.discountType !== 'freeship' && (
                  <div className='space-y-2'>
                    <Label htmlFor='discountValue' className='text-blue-900 font-medium'>
                      Giá trị giảm giá *{formData.discountType === 'percentage' && ' (%)'}
                      {formData.discountType === 'fixed_amount' && ' (₫)'}
                    </Label>
                    <Input
                      id='discountValue'
                      type='number'
                      min='0'
                      max={formData.discountType === 'percentage' ? 100 : undefined}
                      value={formData.discountValue ?? ''}
                      onChange={(e) => handleInputChange('discountValue', e.target.value)}
                      placeholder='Nhập giá trị giảm giá'
                      className={cn(
                        'border-blue-200 focus:ring-blue-500 focus:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]',
                        errors.discountValue && 'border-red-500'
                      )}
                    />
                    {errors.discountValue && <p className='text-sm text-red-600'>{errors.discountValue}</p>}
                  </div>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='minValueDiscount' className='text-blue-900 font-medium'>
                  Giá trị đơn tối thiểu (₫)
                </Label>
                <Input
                  id='minValueDiscount'
                  type='number'
                  min='0'
                  value={formData.minValueDiscount ?? ''}
                  onChange={(e) => handleInputChange('minValueDiscount', e.target.value)}
                  placeholder='Nhập giá trị đơn tối thiểu (để trống nếu không có)'
                  className={cn(
                    'border-blue-200 focus:ring-blue-500 focus:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]',
                    errors.minValueDiscount && 'border-red-500'
                  )}
                />
                {errors.minValueDiscount && <p className='text-sm text-red-600'>{errors.minValueDiscount}</p>}
              </div>
            </motion.div>

            <motion.div variants={sectionVariants} className='space-y-4 p-4'>
              <h3 className='text-lg font-semibold text-blue-900 flex items-center gap-2'>
                <motion.div
                  className='w-1 h-6 bg-blue-500 rounded'
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                />
                Thời gian áp dụng
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label className='text-blue-900 font-medium'>Ngày bắt đầu *</Label>
                  <div className='flex gap-2'>
                    <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant='outline'
                          className={cn(
                            'flex-1 justify-start text-left font-normal border-blue-200 hover:bg-blue-50',
                            !formData.startDate && 'text-muted-foreground',
                            errors.startDate && 'border-red-500'
                          )}
                        >
                          <CalendarIcon className='mr-2 h-4 w-4 text-blue-500' />
                          {formData.startDate
                            ? format(new Date(formData.startDate), 'dd/MM/yyyy', { locale: vi })
                            : 'Chọn ngày'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={formData.startDate ? new Date(formData.startDate) : undefined}
                          onSelect={(date) => {
                            handleDateChange('startDate', date)
                            setStartDateOpen(false)
                          }}
                          disabled={(date) => {
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)
                            return date < today
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <div className='flex items-center gap-1 px-3 border border-blue-200 rounded-md bg-blue-50'>
                      <Clock className='h-4 w-4 text-blue-500' />
                      <Input
                        type='time'
                        value={startTime}
                        onChange={(e) => handleTimeChange('startDate', e.target.value)}
                        className='w-24 border-0 bg-transparent focus:ring-0 text-blue-900'
                      />
                    </div>
                  </div>
                  {errors.startDate && <p className='text-sm text-red-600'>{errors.startDate}</p>}
                  {errors.startTime && <p className='text-sm text-red-600'>{errors.startTime}</p>}
                </div>

                <div className='space-y-2'>
                  <Label className='text-blue-900 font-medium'>Ngày kết thúc *</Label>
                  <div className='flex gap-2'>
                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant='outline'
                          className={cn(
                            'flex-1 justify-start text-left font-normal border-blue-200 hover:bg-blue-50',
                            !formData.endDate && 'text-muted-foreground',
                            errors.endDate && 'border-red-500'
                          )}
                        >
                          <CalendarIcon className='mr-2 h-4 w-4 text-blue-500' />
                          {formData.endDate
                            ? format(new Date(formData.endDate), 'dd/MM/yyyy', { locale: vi })
                            : 'Chọn ngày'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={formData.endDate ? new Date(formData.endDate) : undefined}
                          onSelect={(date) => {
                            handleDateChange('endDate', date)
                            setEndDateOpen(false)
                          }}
                          disabled={(date) => {
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)

                            if (formData.startDate) {
                              const startDate = new Date(formData.startDate)
                              startDate.setHours(0, 0, 0, 0)
                              return date <= startDate
                            }
                            return date < today
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <div className='flex items-center gap-1 px-3 border border-blue-200 rounded-md bg-blue-50'>
                      <Clock className='h-4 w-4 text-blue-500' />
                      <Input
                        type='time'
                        value={endTime}
                        onChange={(e) => handleTimeChange('endDate', e.target.value)}
                        className='w-24 border-0 bg-transparent focus:ring-0 text-blue-900'
                      />
                    </div>
                  </div>
                  {errors.endDate && <p className='text-sm text-red-600'>{errors.endDate}</p>}
                </div>
              </div>
            </motion.div>

            <motion.div variants={sectionVariants} className='space-y-4 p-4'>
              <h3 className='text-lg font-semibold text-blue-900 flex items-center gap-2'>
                <motion.div
                  className='w-1 h-6 bg-blue-500 rounded'
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                />
                Cấu hình số lượng
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='maxQuantity' className='text-blue-900 font-medium'>
                    Số lượng tối đa
                  </Label>
                  <Input
                    id='maxQuantity'
                    type='number'
                    min='1'
                    value={formData.maxQuantity ?? ''}
                    onChange={(e) => handleInputChange('maxQuantity', e.target.value)}
                    placeholder='Nhập số lượng tối đa (để trống nếu không giới hạn)'
                    className={cn(
                      'border-blue-200 focus:ring-blue-500 focus:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]',
                      errors.maxQuantity && 'border-red-500'
                    )}
                  />
                  {errors.maxQuantity && <p className='text-sm text-red-600'>{errors.maxQuantity}</p>}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='maxPerUser' className='text-blue-900 font-medium'>
                    Số lượt sử dụng tối đa mỗi user *
                  </Label>
                  <Input
                    id='maxPerUser'
                    type='number'
                    min='1'
                    value={formData.maxPerUser ?? ''}
                    onChange={(e) => handleInputChange('maxPerUser', e.target.value)}
                    placeholder='Nhập số lượt sử dụng tối đa'
                    className={cn(
                      'border-blue-200 focus:ring-blue-500 focus:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]',
                      errors.maxPerUser && 'border-red-500'
                    )}
                  />
                  {errors.maxPerUser && <p className='text-sm text-red-600'>{errors.maxPerUser}</p>}
                </div>
              </div>
            </motion.div>

            <motion.div variants={sectionVariants} className='space-y-4 p-4'>
              <h3 className='text-lg font-semibold text-blue-900 flex items-center gap-2'>
                <motion.div
                  className='w-1 h-6 bg-blue-500 rounded'
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                />
                Trạng thái
              </h3>

              <div className='flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200'>
                <Switch
                  id='isActive'
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor='isActive' className='text-blue-900 px-2 font-medium cursor-pointer'>
                  Kích hoạt Mã khuyến mãi
                </Label>
              </div>
            </motion.div>
          </div>

          <motion.div
            className='flex items-center justify-end space-x-4 pt-4 px-4 pb-4 border-t border-gray-200 bg-white flex-shrink-0 mt-auto'
            variants={footerVariants}
          >
            <div className='flex items-center gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                disabled={loading}
                className='border-blue-300 px-4 text-blue-700 hover:bg-blue-50'
              >
                <X className='h-4 w-4 mr-2' />
                Hủy
              </Button>

              <Button type='submit' disabled={loading} className='bg-blue-500  hover:bg-blue-600 text-white'>
                {loading ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : <Save className='h-4 w-4 mr-2' />}
                {isEdit ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </div>
          </motion.div>
        </form>
      </div>
    </motion.div>
  )
}

export { PromotionForm }
