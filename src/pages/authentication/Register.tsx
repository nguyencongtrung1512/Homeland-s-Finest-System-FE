import RegisterLayout from '../../Layouts/Authentication/registerLayout'
import { User, Phone, ChevronDownIcon, Loader2, ChevronsUpDown, Check, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProvinces, type Province } from '../../apis/province'
import { toast } from '../../utils/toast'
import { registerCustomer } from '../../apis/auth.api'
import { path } from '../../constants/path'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '../../components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { Calendar as CalendarComponent } from '../../components/ui/calendar'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Label } from '../../components/ui/label'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Checkbox } from '../../components/ui/checkbox'
import CurveSeparator from '../../components/register/CurveSeparator'
import RegistrationStepper from '../../components/register/RegistrationStepper'
import unnamedImage from '../../assets/unnamed.jpg'

interface RegisterFormData {
  firstName: string
  lastName: string
  phoneNumber: string
  provinceId: number | undefined
  gender: string
  dateOfBirth: Date | undefined
  email: string
  password: string
  confirmPassword: string
  acceptedTerms: boolean
}

interface FormErrors {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  provinceId?: string
  gender?: string
  dateOfBirth?: string
  email?: string
  password?: string
  confirmPassword?: string
  acceptedTerms?: string
}

// Vietnamese phone number regex (10-11 digits, can start with 0 or +84)
const VN_PHONE_REGEX = /^(0|\+84)[1-9][0-9]{8,9}$/

function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    provinceId: undefined,
    gender: 'Male',
    dateOfBirth: undefined,
    email: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [provinces, setProvinces] = useState<Province[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [provinceOpen, setProvinceOpen] = useState(false)
  const [provinceSearchValue, setProvinceSearchValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Load provinces on component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true)
      try {
        const data = await getProvinces()
        setProvinces(data)
      } catch (error) {
        console.error('Error fetching provinces:', error)
        toast.error('Không thể tải danh sách tỉnh/thành phố')
      } finally {
        setLoadingProvinces(false)
      }
    }
    fetchProvinces()
  }, [])

  // Filter provinces based on search
  const filteredProvinces = provinces.filter(
    (province) =>
      province.name.toLowerCase().includes(provinceSearchValue.toLowerCase()) ||
      province.region.toLowerCase().includes(provinceSearchValue.toLowerCase())
  )

  // Get selected province name for display
  const selectedProvince = provinces.find((p) => p.id === formData.provinceId)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      gender: value
    }))
    if (errors.gender) {
      setErrors((prev) => ({
        ...prev,
        gender: undefined
      }))
    }
  }

  const handleProvinceChange = (provinceId: number) => {
    setFormData((prev) => ({
      ...prev,
      provinceId
    }))
    setProvinceOpen(false)
    if (errors.provinceId) {
      setErrors((prev) => ({
        ...prev,
        provinceId: undefined
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (currentStep === 1) {
      // Validate step 1 fields
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'Vui lòng nhập tên'
      } else if (formData.firstName.trim().length > 50) {
        newErrors.firstName = 'Tên không được vượt quá 50 ký tự'
      }

      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Vui lòng nhập họ'
      } else if (formData.lastName.trim().length > 50) {
        newErrors.lastName = 'Họ không được vượt quá 50 ký tự'
      }

      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = 'Vui lòng nhập số điện thoại'
      } else if (!VN_PHONE_REGEX.test(formData.phoneNumber)) {
        newErrors.phoneNumber = 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10-11 chữ số)'
      }

      if (!formData.provinceId) {
        newErrors.provinceId = 'Vui lòng chọn tỉnh/thành phố'
      }

      if (!formData.gender) {
        newErrors.gender = 'Vui lòng chọn giới tính'
      }

      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = 'Vui lòng chọn ngày sinh'
      } else {
        const today = new Date()
        today.setHours(23, 59, 59, 999)

        if (formData.dateOfBirth > today) {
          newErrors.dateOfBirth = 'Ngày sinh không được là ngày trong tương lai'
        } else {
          const age = today.getFullYear() - formData.dateOfBirth.getFullYear()
          const monthDiff = today.getMonth() - formData.dateOfBirth.getMonth()
          const dayDiff = today.getDate() - formData.dateOfBirth.getDate()
          const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age

          if (actualAge < 13) {
            newErrors.dateOfBirth = 'Bạn phải ít nhất 13 tuổi để đăng ký'
          }

          const minDate = new Date('1900-01-01')
          if (formData.dateOfBirth < minDate) {
            newErrors.dateOfBirth = 'Ngày sinh không hợp lệ'
          }
        }
      }
    } else if (currentStep === 2) {
      // Validate step 2 fields
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!formData.email.trim()) {
        newErrors.email = 'Vui lòng nhập email'
      } else if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Email không hợp lệ'
      }

      if (!formData.password) {
        newErrors.password = 'Vui lòng nhập mật khẩu'
      } else if (formData.password.length < 8) {
        newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
      }
    } else if (currentStep === 3) {
      // Validate step 3 fields
      if (!formData.acceptedTerms) {
        newErrors.acceptedTerms = 'Vui lòng đồng ý với điều khoản và quy định của cộng đồng'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      // Show first error toast
      const firstError = Object.values(errors)[0]
      if (firstError) {
        toast.warning(firstError, { position: 'top-right', autoClose: 3000 })
      }
      return
    }

    setIsSubmitting(true)
    try {
      if (currentStep === 1) {
        // Chuyển sang bước 2
        setCurrentStep(2)
        toast.success('Bước 1 hoàn thành!', {
          position: 'top-right',
          autoClose: 2000
        })
      } else if (currentStep === 2) {
        // Chuyển sang bước 3
        setCurrentStep(3)
        toast.success('Bước 2 hoàn thành!', {
          position: 'top-right',
          autoClose: 2000
        })
      } else if (currentStep === 3) {
        // Submit final registration
        if (!formData.dateOfBirth || !formData.provinceId) {
          toast.error('Vui lòng kiểm tra lại thông tin', {
            position: 'top-right',
            autoClose: 3000
          })
          return
        }

        // Format dateOfBirth to ISO string (YYYY-MM-DD)
        const dateOfBirthString = formData.dateOfBirth.toISOString().split('T')[0]

        const registrationData = {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          gender: formData.gender,
          phoneNumber: formData.phoneNumber,
          dateOfBirth: dateOfBirthString,
          provinceId: formData.provinceId
        }

        await registerCustomer(registrationData)

        toast.success('Đăng ký thành công!', {
          position: 'top-right',
          autoClose: 2000
        })

        // Navigate to login page after successful registration
        setTimeout(() => {
          navigate(path.loginCustomer)
        }, 2000)
      }
    } catch (error: unknown) {
      console.error('Error submitting form:', error)
      
      // Xử lý lỗi từ API response
      let errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại.'
      
      if (error && typeof error === 'object') {
        // Kiểm tra error có phải là AxiosError với response.data
        if ('message' in error) {
          const errorData = error as { message?: string; status?: number }
          if (errorData.message) {
            errorMessage = errorData.message
          }
        }
      }
      
      // Hiển thị lỗi cụ thể từ server
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      })
      
      // Nếu là lỗi về số điện thoại đã tồn tại, hiển thị lỗi ở field phoneNumber
      if (errorMessage.includes('Số điện thoại') || errorMessage.includes('số điện thoại')) {
        setErrors((prev) => ({
          ...prev,
          phoneNumber: errorMessage
        }))
      }
      
      // Nếu là lỗi về email đã tồn tại, hiển thị lỗi ở field email
      if (errorMessage.includes('Email') || errorMessage.includes('email')) {
        setErrors((prev) => ({
          ...prev,
          email: errorMessage
        }))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <>
          {/* First Name and Last Name */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='firstName'>
                Tên<span className='text-destructive ml-1'>*</span>
              </Label>
              <div className='relative'>
                <User className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  id='firstName'
                  name='firstName'
                  type='text'
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder='Nhập tên của bạn'
                  className={`pl-10 bg-transparent border-none border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none ${errors.firstName
                      ? 'border-b-red-500 focus-visible:border-b-red-500'
                      : 'border-b-gray-300 focus-visible:border-b-green-600'
                    }`}
                />
              </div>
              {errors.firstName && <p className='text-sm text-destructive'>{errors.firstName}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='lastName'>
                Họ<span className='text-destructive ml-1'>*</span>
              </Label>
              <div className='relative'>
                <User className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  id='lastName'
                  name='lastName'
                  type='text'
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder='Nhập họ của bạn'
                  className={`pl-10 bg-transparent border-none border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none ${errors.lastName
                      ? 'border-b-red-500 focus-visible:border-b-red-500'
                      : 'border-b-gray-300 focus-visible:border-b-green-600'
                    }`}
                />
              </div>
              {errors.lastName && <p className='text-sm text-destructive'>{errors.lastName}</p>}
            </div>
          </div>

          {/* Phone Number */}
          <div className='space-y-2'>
            <Label htmlFor='phoneNumber'>
              Số điện thoại<span className='text-destructive ml-1'>*</span>
            </Label>
            <div className='relative'>
              <Phone className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                id='phoneNumber'
                name='phoneNumber'
                type='tel'
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder='Nhập số điện thoại'
                className={`pl-10 bg-transparent border-none border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none ${errors.phoneNumber
                    ? 'border-b-red-500 focus-visible:border-b-red-500'
                    : 'border-b-gray-300 focus-visible:border-b-green-600'
                  }`}
              />
            </div>
            {errors.phoneNumber && <p className='text-sm text-destructive'>{errors.phoneNumber}</p>}
          </div>

          {/* Hometown (Province) */}
          <div className='space-y-2'>
            <Label>
              Quê quán<span className='text-destructive ml-1'>*</span>
            </Label>
            <Popover open={provinceOpen} onOpenChange={setProvinceOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  role='combobox'
                  aria-expanded={provinceOpen}
                  className={`w-full justify-between bg-transparent border-none border-b-2 rounded-none h-auto py-2 px-0 font-normal focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none ${errors.provinceId
                      ? 'border-b-red-500 focus-visible:border-b-red-500'
                      : 'border-b-gray-300 focus-visible:border-b-green-600'
                    }`}
                  disabled={loadingProvinces}
                  type='button'
                >
                  <span className='flex-1 truncate mr-2 text-left'>
                    {loadingProvinces
                      ? 'Đang tải...'
                      : selectedProvince
                        ? `${selectedProvince.name} - ${selectedProvince.region}`
                        : 'Chọn tỉnh/thành phố'}
                  </span>
                  <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-full p-0' align='start'>
                <Command>
                  <CommandInput
                    placeholder='Tìm kiếm tỉnh/thành phố...'
                    value={provinceSearchValue}
                    onValueChange={setProvinceSearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>Không tìm thấy tỉnh/thành phố nào.</CommandEmpty>
                    <CommandGroup>
                      {filteredProvinces.map((province) => (
                        <CommandItem
                          key={province.id}
                          value={`${province.name} - ${province.region}`}
                          onSelect={() => handleProvinceChange(province.id)}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${formData.provinceId === province.id ? 'opacity-100' : 'opacity-0'
                              }`}
                          />
                          {province.name} - {province.region}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.provinceId && <p className='text-sm text-destructive'>{errors.provinceId}</p>}
          </div>

          {/* Gender and Date of Birth */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>
                Giới tính<span className='text-destructive ml-1'>*</span>
              </Label>
              <Select value={formData.gender} onValueChange={handleSelectChange}>
                <SelectTrigger
                  className={`bg-transparent border-none border-b-2 rounded-none h-auto py-2 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none shadow-none ${errors.gender
                      ? 'border-b-red-500 focus-visible:border-b-red-500'
                      : 'border-b-gray-300 focus-visible:border-b-green-600'
                    }`}
                >
                  <SelectValue placeholder='Chọn giới tính' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Male'>Nam</SelectItem>
                  <SelectItem value='Female'>Nữ</SelectItem>
                  <SelectItem value='Other'>Khác</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className='text-sm text-destructive'>{errors.gender}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='dateOfBirth'>
                Ngày sinh<span className='text-destructive ml-1'>*</span>
              </Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    id='dateOfBirth'
                    type='button'
                    className={`w-full justify-between bg-transparent border-none border-b-2 rounded-none h-auto py-2 px-0 font-normal focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none ${errors.dateOfBirth
                        ? 'border-b-red-500 focus-visible:border-b-red-500'
                        : 'border-b-gray-300 focus-visible:border-b-green-600'
                      }`}
                  >
                    {formData.dateOfBirth
                      ? format(formData.dateOfBirth, 'dd/MM/yyyy', { locale: vi })
                      : 'Chọn ngày sinh'}
                    <ChevronDownIcon className='h-4 w-4' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
                  <CalendarComponent
                    mode='single'
                    selected={formData.dateOfBirth}
                    captionLayout='dropdown'
                    onSelect={(date) => {
                      setFormData((prev) => ({
                        ...prev,
                        dateOfBirth: date
                      }))
                      setCalendarOpen(false)
                      if (errors.dateOfBirth) {
                        setErrors((prev) => ({
                          ...prev,
                          dateOfBirth: undefined
                        }))
                      }
                    }}
                    disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                    locale={vi}
                  />
                </PopoverContent>
              </Popover>
              {errors.dateOfBirth && <p className='text-sm text-destructive'>{errors.dateOfBirth}</p>}
            </div>
          </div>
        </>
      )
    } else if (currentStep === 2) {
      return (
        <>
          {/* Email */}
          <div className='space-y-2'>
            <Label htmlFor='email'>
              Email<span className='text-destructive ml-1'>*</span>
            </Label>
            <div className='relative'>
              <Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                id='email'
                name='email'
                type='email'
                value={formData.email}
                onChange={handleInputChange}
                placeholder='Nhập email của bạn'
                className={`pl-10 bg-transparent border-none border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none ${errors.email
                    ? 'border-b-red-500 focus-visible:border-b-red-500'
                    : 'border-b-gray-300 focus-visible:border-b-green-600'
                  }`}
              />
            </div>
            {errors.email && <p className='text-sm text-destructive'>{errors.email}</p>}
          </div>

          {/* Password */}
          <div className='space-y-2'>
            <Label htmlFor='password'>
              Mật khẩu<span className='text-destructive ml-1'>*</span>
            </Label>
            <div className='relative'>
              <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                id='password'
                name='password'
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                placeholder='Nhập mật khẩu (tối thiểu 8 ký tự)'
                className={`pl-10 pr-10 bg-transparent border-none border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none ${errors.password
                    ? 'border-b-red-500 focus-visible:border-b-red-500'
                    : 'border-b-gray-300 focus-visible:border-b-green-600'
                  }`}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
              >
                {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
              </button>
            </div>
            {errors.password && <p className='text-sm text-destructive'>{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>
              Xác nhận mật khẩu<span className='text-destructive ml-1'>*</span>
            </Label>
            <div className='relative'>
              <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                id='confirmPassword'
                name='confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder='Nhập lại mật khẩu'
                className={`pl-10 pr-10 bg-transparent border-none border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none ${errors.confirmPassword
                    ? 'border-b-red-500 focus-visible:border-b-red-500'
                    : 'border-b-gray-300 focus-visible:border-b-green-600'
                  }`}
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
              >
                {showConfirmPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
              </button>
            </div>
            {errors.confirmPassword && <p className='text-sm text-destructive'>{errors.confirmPassword}</p>}
          </div>
        </>
      )
    } else if (currentStep === 3) {
      return (
        <div className='space-y-4 py-8'>
          <div className='text-center mb-6'>
            <h3 className='text-2xl font-bold mb-2'>Hương ước cộng đồng</h3>
            <p className='text-muted-foreground'>
              Vui lòng đọc và đồng ý với các điều khoản và quy định của cộng đồng
            </p>
          </div>

          <div className='flex items-start space-x-3'>
            <Checkbox
              id='acceptedTerms'
              checked={formData.acceptedTerms}
              onCheckedChange={(checked) => {
                setFormData((prev) => ({
                  ...prev,
                  acceptedTerms: checked === true
                }))
                if (errors.acceptedTerms) {
                  setErrors((prev) => ({
                    ...prev,
                    acceptedTerms: undefined
                  }))
                }
              }}
              className={errors.acceptedTerms ? 'border-destructive' : ''}
            />
            <Label
              htmlFor='acceptedTerms'
              className='text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1'
            >
              Tôi đồng ý với các điều khoản và quy định của cộng đồng
              <span className='text-destructive ml-1'>*</span>
            </Label>
          </div>
          {errors.acceptedTerms && (
            <p className='text-sm text-destructive mt-1'>{errors.acceptedTerms}</p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <RegisterLayout>
      <div className='w-full max-w-4xl mx-auto px-4 py-6'>
        <div className='bg-white rounded-3xl shadow-2xl overflow-hidden'>
          <div className='grid grid-cols-1 lg:grid-cols-[58%_42%] min-h-[350px] relative'>
            {/* Left Panel - Image Background */}
            <div className='relative hidden lg:block overflow-visible'>
              {/* Background Image - Full size */}
              <div className='absolute inset-0 z-0'>
                <img
                  src={unnamedImage}
                  alt='Background'
                  className='w-full h-full object-cover'
                />
              </div>

              {/* Content */}
              <div className='relative z-[2] h-full flex flex-col p-6 pr-12 text-white'>
                {/* Logo and Branding */}
                <div className='mb-6'>
                  <div className='flex items-center space-x-3 mb-3'>
                    <div className='w-10 h-10 rounded-full bg-yellow-400/90 flex items-center justify-center'>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='20'
                        height='20'
                        viewBox='0 0 24 24'
                        fill='none'
                      >
                        <path
                          d='M22 3.25C22 7.6875 18.6953 11.3555 14.4141 11.9219C14.1367 9.83594 13.2188 7.95312 11.8633 6.48047C13.3594 3.80859 16.2188 2 19.5 2H20.75C21.4414 2 22 2.55859 22 3.25ZM2 5.75C2 5.05859 2.55859 4.5 3.25 4.5H4.5C9.33203 4.5 13.25 8.41797 13.25 13.25V14.5V20.75C13.25 21.4414 12.6914 22 12 22C11.3086 22 10.75 21.4414 10.75 20.75V14.5C5.91797 14.5 2 10.582 2 5.75Z'
                          fill='currentColor'
                        />
                      </svg>
                    </div>
                    <span className='text-lg font-bold'>Tinh Hoa Quê Nhà</span>
                  </div>
                  <h1 className='text-4xl font-bold leading-tight'>Khởi đầu hành trình</h1>
                </div>

                {/* Progress Stepper */}
                <RegistrationStepper currentStep={currentStep} />
              </div>
            </div>

            {/* Curve Separator - Positioned slightly to the left of the right edge */}
            <div className='hidden lg:block absolute left-[calc(52%-40px)] top-0 bottom-0 pointer-events-none' style={{ zIndex: 5 }}>
              <CurveSeparator />
            </div>

            {/* Right Panel - White Form */}
            <div className='bg-white flex flex-col justify-center relative z-[10]'>
              <form onSubmit={handleSubmit} className='space-y-5 max-w-md mx-auto w-full pl-4 lg:pl-6 pr-8 lg:pr-12 py-6 lg:py-8'>
                {/* Error Message */}
                {Object.keys(errors).length > 0 && (
                  <Alert variant='destructive'>
                    <AlertDescription>
                      {Object.values(errors).find((error) => error) || 'Vui lòng kiểm tra lại thông tin'}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Step Content */}
                {renderStepContent()}

                {/* Action Buttons */}
                <div className={`flex gap-4 mt-8 ${currentStep > 1 ? 'justify-between' : 'justify-end'}`}>
                  {currentStep > 1 && (
                    <Button
                      type='button'
                      variant='outline'
                      onClick={handleBack}
                      className='rounded-full h-12 text-base font-semibold px-6'
                      size='lg'
                    >
                      <ArrowLeft className='mr-2 h-4 w-4' />
                      Quay lại
                    </Button>
                  )}
                  <Button
                    type='submit'
                    disabled={isSubmitting}
                    variant='green'
                    className={`rounded-full h-12 text-base font-semibold ${currentStep > 1 ? 'flex-1' : 'w-full'}`}
                    size='lg'
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Đang xử lý...
                      </>
                    ) : currentStep === 3 ? (
                      'Hoàn thành'
                    ) : (
                      'Tiếp tục →'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </RegisterLayout>
  )
}

export default Register
