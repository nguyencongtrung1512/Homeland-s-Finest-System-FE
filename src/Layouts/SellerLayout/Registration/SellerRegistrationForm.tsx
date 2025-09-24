import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Checkbox } from '../../../components/ui/checkbox'
import { Calendar } from '../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { ChevronDownIcon, Eye, EyeOff } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Upload as AntUpload, message } from 'antd'
import type { UploadFile, UploadProps } from 'antd'
import 'antd/dist/reset.css'
import { toast } from 'react-toastify'
import { path } from '../../../constants/path'
import { registerSeller } from '../../../apis/auth.api'
import type { GHNProvince, GHNDistrict, GHNWard } from '../../../apis/address.api'
import Loading from '../../../components/Loading/loading'

// Custom CSS for checkbox styling
const checkboxStyles = `
  .custom-checkbox {
    appearance: none;
    width: 20px;
    height: 20px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    background-color: white;
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease-in-out;
  }
  
  .custom-checkbox:hover {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
  
  .custom-checkbox:checked {
    background-color: #10b981;
    border-color: #10b981;
  }
  
  .custom-checkbox:checked::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 14px;
    font-weight: bold;
  }
  
  .custom-checkbox:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }
`

// Types
interface FormData {
  // Thông tin tài khoản (userInfo)
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  password: string
  confirmPassword: string
  gender: string
  dateOfBirth: string

  // Thông tin seller (sellerInfo)
  businessName: string
  taxCode: string
  bankAccount: string
  identifyCard: string
  identifyFrontImage: File[]
  identifyBackImage: File[]
  vendorApplicationImageUrl: File[]

  // Thông tin cửa hàng (storeInfo)
  storeName: string
  address: string

  // Cam kết
  agreements: {
    terms: boolean
    policy: boolean
    commission: boolean
    productQuality: boolean
  }
}

interface FormErrors {
  [key: string]: string
}

// Ant Design Upload Component
const FileUploadField = ({
  label,
  onChange,
  accept = 'image/*',
  required = false,
  multiple = false,
  description,
  maxCount = 1
}: {
  label: string
  onChange: (files: File[]) => void
  accept?: string
  required?: boolean
  multiple?: boolean
  description?: string
  maxCount?: number
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [previewImage, setPreviewImage] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList)

    // Convert UploadFile[] to File[]
    const newFiles = newFileList.filter((file) => file.originFileObj).map((file) => file.originFileObj as File)

    onChange(newFiles)
  }

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('Chỉ được upload file ảnh!')
      return false
    }

    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      message.error('Kích thước file phải nhỏ hơn 10MB!')
      return false
    }

    return false // Prevent auto upload
  }

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File)
    }

    setPreviewImage(file.url || file.preview || '')
    setShowPreview(true)
  }

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const uploadButton = (
    <div className='flex w-full h-full flex-col items-center justify-center space-y-2 p-4 cursor-pointer hover:bg-gray-100 rounded-lg '>
      <div className='text-sm text-gray-600'>Nhấp để chọn file</div>
      <div className='text-xs text-gray-500'>{multiple ? 'Có thể chọn nhiều file' : 'Chỉ chọn 1 file'}</div>
    </div>
  )

  return (
    <div className='space-y-2'>
      <Label className='text-sm font-medium'>
        {label} {required && <span className='text-red-500'>*</span>}
      </Label>
      {description && <p className='text-xs text-gray-500'>{description}</p>}

      <AntUpload
        listType='picture-card'
        fileList={fileList}
        onChange={handleChange}
        beforeUpload={beforeUpload}
        onPreview={handlePreview}
        multiple={multiple}
        maxCount={maxCount}
        accept={accept}
        showUploadList={{
          showPreviewIcon: true,
          showRemoveIcon: true,
          showDownloadIcon: false
        }}
        className='w-full'
      >
        {fileList.length >= maxCount ? null : uploadButton}
      </AntUpload>

      {/* Preview Dialog using shadcn/ui */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className='max-w-4xl max-h-4xl'>
          <DialogHeader>
            <DialogTitle>Preview ảnh</DialogTitle>
          </DialogHeader>
          <div className='flex justify-center'>
            <img src={previewImage} alt='Preview' className='max-w-full max-h-96 object-contain rounded-lg' />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SellerRegistrationForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<FormData>({
    // userInfo
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    gender: '',
    dateOfBirth: '',

    // sellerInfo
    businessName: '',
    taxCode: '',
    bankAccount: '',
    identifyCard: '',
    identifyFrontImage: [],
    identifyBackImage: [],
    vendorApplicationImageUrl: [],

    // storeInfo
    storeName: '',
    address: '',

    // agreements
    agreements: {
      terms: false,
      policy: false,
      commission: false,
      productQuality: false
    }
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Address states
  const [provinces, setProvinces] = useState<GHNProvince[]>([])
  const [districts, setDistricts] = useState<GHNDistrict[]>([])
  const [wards, setWards] = useState<GHNWard[]>([])
  const [selectedProvince, setSelectedProvince] = useState<GHNProvince | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<GHNDistrict | null>(null)
  const [selectedWard, setSelectedWard] = useState<GHNWard | null>(null)
  const [specificAddress, setSpecificAddress] = useState<string>('')
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false)
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false)
  const [isLoadingWards, setIsLoadingWards] = useState(false)

  // Handle input changes
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Handle agreement changes
  const handleAgreementChange = (field: keyof FormData['agreements'], value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      agreements: {
        ...prev.agreements,
        [field]: value
      }
    }))
  }

  // Handle file uploads
  const handleFileChange = (field: string, files: File[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: files
    }))
  }

  // Load provinces from GHN API
  const loadProvinces = async () => {
    setIsLoadingProvinces(true)
    try {
      const response = await fetch('https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/province', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Token: 'ed8771b7-8afe-11f0-bdaf-ae7fa045a771'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setProvinces(data.data)
    } catch (error) {
      console.error('Error loading provinces:', error)
      toast.error('Không thể tải danh sách tỉnh/thành phố')
    } finally {
      setIsLoadingProvinces(false)
    }
  }

  // Load districts by province from GHN API
  const loadDistricts = async (provinceId: number) => {
    setIsLoadingDistricts(true)
    setDistricts([])
    setWards([])
    setSelectedDistrict(null)
    setSelectedWard(null)
    try {
      const response = await fetch(
        `https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/district?province_id=${provinceId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Token: 'ed8771b7-8afe-11f0-bdaf-ae7fa045a771'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setDistricts(data.data)
    } catch (error) {
      console.error('Error loading districts:', error)
      toast.error('Không thể tải danh sách quận/huyện')
    } finally {
      setIsLoadingDistricts(false)
    }
  }

  // Load wards by district from GHN API
  const loadWards = async (districtId: number) => {
    setIsLoadingWards(true)
    setWards([])
    setSelectedWard(null)
    try {
      const response = await fetch(
        `https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/ward?district_id=${districtId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Token: 'ed8771b7-8afe-11f0-bdaf-ae7fa045a771'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setWards(data.data)
    } catch (error) {
      console.error('Error loading wards:', error)
      toast.error('Không thể tải danh sách phường/xã')
    } finally {
      setIsLoadingWards(false)
    }
  }

  // Handle province change
  const handleProvinceChange = (provinceId: string) => {
    const province = provinces.find((p) => p.ProvinceID.toString() === provinceId)
    if (province) {
      setSelectedProvince(province)
      loadDistricts(province.ProvinceID)
    }
  }

  // Handle district change
  const handleDistrictChange = (districtId: string) => {
    const district = districts.find((d) => d.DistrictID.toString() === districtId)
    if (district) {
      setSelectedDistrict(district)
      loadWards(district.DistrictID)
    }
  }

  // Handle ward change
  const handleWardChange = (wardCode: string) => {
    const ward = wards.find((w) => w.WardCode === wardCode)
    if (ward) {
      setSelectedWard(ward)
    }
  }

  // Update full address when components change
  React.useEffect(() => {
    if (selectedProvince && selectedDistrict && selectedWard && specificAddress) {
      const fullAddress = `${specificAddress}, ${selectedWard.WardName}, ${selectedDistrict.DistrictName}, ${selectedProvince.ProvinceName}`
      setFormData((prev) => ({
        ...prev,
        address: fullAddress
      }))
    }
  }, [selectedProvince, selectedDistrict, selectedWard, specificAddress])

  // Load provinces on mount
  React.useEffect(() => {
    loadProvinces()
  }, [])

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Required fields validation
    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'password',
      'confirmPassword',
      'gender',
      'dateOfBirth',
      'businessName',
      'taxCode',
      'bankAccount',
      'identifyCard',
      'storeName',
      'address'
    ]

    requiredFields.forEach((field) => {
      if (!formData[field as keyof FormData]) {
        newErrors[field] = 'Trường này là bắt buộc'
      }
    })

    // Email validation (more comprehensive)
    if (formData.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ'
    }

    // Phone validation (10-12 digits)
    if (formData.phoneNumber && !/^[0-9]{10,12}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Số điện thoại phải có 10-12 chữ số'
    }

    // Password validation (8+ chars, uppercase, lowercase, number, special char)
    if (formData.password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      if (!passwordRegex.test(formData.password)) {
        newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
      }
    }

    // Date of birth validation
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        // Haven't had birthday this year yet
        if (age - 1 < 18) {
          newErrors.dateOfBirth = 'Bạn phải ít nhất 18 tuổi để đăng ký'
        }
      } else {
        if (age < 18) {
          newErrors.dateOfBirth = 'Bạn phải ít nhất 18 tuổi để đăng ký'
        }
      }

      if (age > 100) {
        newErrors.dateOfBirth = 'Ngày sinh không hợp lệ'
      }
    }

    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    // Address validation
    if (!selectedProvince) {
      newErrors.address = 'Vui lòng chọn tỉnh/thành phố'
    } else if (!selectedDistrict) {
      newErrors.address = 'Vui lòng chọn quận/huyện'
    } else if (!selectedWard) {
      newErrors.address = 'Vui lòng chọn phường/xã'
    } else if (!specificAddress.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ cụ thể'
    }

    // File validation
    if (formData.identifyFrontImage.length === 0) {
      newErrors.identifyFrontImage = 'Vui lòng tải lên mặt trước CCCD'
    }
    if (formData.identifyBackImage.length === 0) {
      newErrors.identifyBackImage = 'Vui lòng tải lên mặt sau CCCD'
    }

    // Agreements validation
    const requiredAgreements = ['terms', 'policy', 'commission', 'productQuality']
    const missingAgreements = requiredAgreements.filter(
      (agreement) => !formData.agreements[agreement as keyof FormData['agreements']]
    )

    if (missingAgreements.length > 0) {
      newErrors.agreements = 'Vui lòng đồng ý với tất cả các điều khoản bắt buộc'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin đã kí!')
      return
    }

    setIsLoading(true)
    try {
      // Prepare data for API
      const apiData = {
        userInfo: {
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth
        },
        sellerInfo: {
          businessName: formData.businessName,
          taxCode: formData.taxCode,
          bankAccount: formData.bankAccount,
          identifyCard: formData.identifyCard,
          identifyFrontImage: formData.identifyFrontImage[0] || null, // Take first file
          identifyBackImage: formData.identifyBackImage[0] || null // Take first file
        },
        storeInfo: {
          storeName: formData.storeName,
          address: formData.address,
          vendorApplicationImageUrl: formData.vendorApplicationImageUrl
        }
      }

      // Call API
      const response = await registerSeller(apiData)

      if (response) {
        toast.success('Đăng ký thành công! Chúng tôi sẽ xem xét và phản hồi trong vòng 24h.')
        setTimeout(() => {
          navigate(path.loginSeller)
        }, 2000)
      }
    } catch (error: unknown) {
      console.error('Registration error:', error)

      // Handle different types of errors
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message) {
          // Backend error message
          toast.error(axiosError.response.data.message)
        } else {
          toast.error('Có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.')
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        const errorWithMessage = error as { message: string }
        toast.error(errorWithMessage.message)
      } else {
        // Generic error
        toast.error('Có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='max-w-4xl mx-auto'>
      {/* Custom CSS for checkbox */}
      <style>{checkboxStyles}</style>

      {/* Header */}
      <div className='text-center mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>Đăng ký trở thành đối tác bán hàng</h1>
        <p className='text-gray-600'>
          Cùng chúng tôi chia sẻ những sản phẩm đặc sản và thủ công tuyệt vời đến khắp mọi miền
        </p>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-xl p-8 shadow-xl'>
            <Loading size='lg' text='Đang xử lý đăng ký...' />
          </div>
        </div>
      )}

      <div className='bg-white rounded-lg shadow-sm p-8'>
        <form onSubmit={handleSubmit} className='space-y-12'>
          {/* Thông tin tài khoản */}
          <div className='space-y-6'>
            <div className='flex items-center space-x-3 border-b border-gray-200 pb-3'>
              <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                <span className='text-blue-600 font-semibold'>1</span>
              </div>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>Thông tin tài khoản</h2>
                <p className='text-sm text-gray-500'>Thông tin đăng nhập và liên hệ của bạn</p>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='firstName'>
                  Họ <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='firstName'
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder='Nhập họ'
                />
                {errors.firstName && <p className='text-sm text-red-500'>{errors.firstName}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='lastName'>
                  Tên <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='lastName'
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder='Nhập tên'
                />
                {errors.lastName && <p className='text-sm text-red-500'>{errors.lastName}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email'>
                  Email <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='email'
                  type='email'
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder='example@email.com'
                />
                {errors.email && <p className='text-sm text-red-500'>{errors.email}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='phoneNumber'>
                  Số điện thoại <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='phoneNumber'
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder='0987654321'
                />
                {errors.phoneNumber && <p className='text-sm text-red-500'>{errors.phoneNumber}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password'>
                  Mật khẩu <span className='text-red-500'>*</span>
                </Label>
                <div className='relative'>
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder='Nhập mật khẩu'
                    className='pr-10'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className='text-sm text-red-500'>{errors.password}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>
                  Xác nhận mật khẩu <span className='text-red-500'>*</span>
                </Label>
                <div className='relative'>
                  <Input
                    id='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder='Nhập lại mật khẩu'
                    className='pr-10'
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className='text-sm text-red-500'>{errors.confirmPassword}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='gender'>
                  Giới tính <span className='text-red-500'>*</span>
                </Label>
                <Select onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder='Chọn giới tính' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Male'>Nam</SelectItem>
                    <SelectItem value='Female'>Nữ</SelectItem>
                    <SelectItem value='Other'>Khác</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className='text-sm text-red-500'>{errors.gender}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='dateOfBirth' className='px-1'>
                  Ngày sinh<span className='text-destructive'>*</span>
                </Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant='outline' id='dateOfBirth' className='w-full justify-between font-normal'>
                      {formData.dateOfBirth
                        ? format(new Date(formData.dateOfBirth), 'dd/MM/yyyy', { locale: vi })
                        : 'Chọn ngày sinh'}
                      <ChevronDownIcon className='h-4 w-4' />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined}
                      captionLayout='dropdown'
                      onSelect={(date) => {
                        if (date) {
                          handleInputChange('dateOfBirth', date.toISOString().split('T')[0])
                        }
                        setCalendarOpen(false)
                      }}
                      disabled={(date) => {
                        const today = new Date()
                        const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
                        const hundredYearsAgo = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())
                        return date > eighteenYearsAgo || date < hundredYearsAgo
                      }}
                      locale={vi}
                      defaultMonth={new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Thông tin cửa hàng */}
          <div className='space-y-6'>
            <div className='flex items-center space-x-3 border-b border-gray-200 pb-3'>
              <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                <span className='text-green-600 font-semibold'>2</span>
              </div>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>Thông tin cửa hàng</h2>
                <p className='text-sm text-gray-500'>Thông tin về cửa hàng và sản phẩm kinh doanh</p>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='storeName'>
                  Tên cửa hàng <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='storeName'
                  value={formData.storeName}
                  onChange={(e) => handleInputChange('storeName', e.target.value)}
                  placeholder='Tên cửa hàng của bạn'
                />
                {errors.storeName && <p className='text-sm text-red-500'>{errors.storeName}</p>}
              </div>
            </div>
            <div className='space-y-4'>
              <Label className='text-sm font-medium'>
                Địa chỉ cửa hàng <span className='text-red-500'>*</span>
              </Label>

              {/* Address Selection - Horizontal Layout */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {/* Province Selection */}
                <div className='space-y-2'>
                  <Label htmlFor='province' className='text-sm text-gray-600'>
                    Tỉnh/Thành phố <span className='text-red-500'>*</span>
                  </Label>
                  <Select
                    value={selectedProvince?.ProvinceID.toString() || ''}
                    onValueChange={handleProvinceChange}
                    disabled={isLoadingProvinces}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingProvinces ? 'Đang tải...' : 'Chọn tỉnh/thành phố'} />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province.ProvinceID} value={province.ProvinceID.toString()}>
                          {province.ProvinceName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* District Selection */}
                <div className='space-y-2'>
                  <Label htmlFor='district' className='text-sm text-gray-600'>
                    Quận/Huyện <span className='text-red-500'>*</span>
                  </Label>
                  <Select
                    value={selectedDistrict?.DistrictID.toString() || ''}
                    onValueChange={handleDistrictChange}
                    disabled={!selectedProvince || isLoadingDistricts}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !selectedProvince
                            ? 'Chọn tỉnh/thành phố trước'
                            : isLoadingDistricts
                              ? 'Đang tải...'
                              : 'Chọn quận/huyện'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem key={district.DistrictID} value={district.DistrictID.toString()}>
                          {district.DistrictName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ward Selection */}
                <div className='space-y-2'>
                  <Label htmlFor='ward' className='text-sm text-gray-600'>
                    Phường/Xã <span className='text-red-500'>*</span>
                  </Label>
                  <Select
                    value={selectedWard?.WardCode || ''}
                    onValueChange={handleWardChange}
                    disabled={!selectedDistrict || isLoadingWards}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !selectedDistrict
                            ? 'Chọn quận/huyện trước'
                            : isLoadingWards
                              ? 'Đang tải...'
                              : 'Chọn phường/xã'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.map((ward) => (
                        <SelectItem key={ward.WardCode} value={ward.WardCode}>
                          {ward.WardName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Specific Address - Full Width */}
              <div className='space-y-2'>
                <Label htmlFor='specificAddress' className='text-sm text-gray-600'>
                  Địa chỉ cụ thể (số nhà, tên đường) <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='specificAddress'
                  value={specificAddress}
                  onChange={(e) => setSpecificAddress(e.target.value)}
                  placeholder='Số nhà, tên đường, tòa nhà...'
                  className='w-full'
                />
              </div>

              {/* Full Address Preview */}
              {formData.address && (
                <div className='p-3 bg-gray-50 rounded-lg border'>
                  <Label className='text-sm text-gray-600'>Địa chỉ hoàn chỉnh:</Label>
                  <p className='text-sm text-gray-800 mt-1'>{formData.address}</p>
                </div>
              )}

              {errors.address && <p className='text-sm text-red-500'>{errors.address}</p>}
            </div>
          </div>

          {/* Thông tin seller */}
          <div className='space-y-6'>
            <div className='flex items-center space-x-3 border-b border-gray-200 pb-3'>
              <div className='w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center'>
                <span className='text-yellow-600 font-semibold'>3</span>
              </div>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>Thông tin seller</h2>
                <p className='text-sm text-gray-500'>Thông tin kinh doanh và ngân hàng</p>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='businessName'>
                  Tên doanh nghiệp <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='businessName'
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder='Tên doanh nghiệp/công ty'
                />
                {errors.businessName && <p className='text-sm text-red-500'>{errors.businessName}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='taxCode'>
                  Mã số thuế <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='taxCode'
                  value={formData.taxCode}
                  onChange={(e) => handleInputChange('taxCode', e.target.value)}
                  placeholder='Mã số thuế doanh nghiệp'
                />
                {errors.taxCode && <p className='text-sm text-red-500'>{errors.taxCode}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='bankAccount'>
                  Số tài khoản ngân hàng <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='bankAccount'
                  value={formData.bankAccount}
                  onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                  placeholder='Số tài khoản ngân hàng'
                />
                {errors.bankAccount && <p className='text-sm text-red-500'>{errors.bankAccount}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='identifyCard'>
                  Số CCCD/CMND <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='identifyCard'
                  value={formData.identifyCard}
                  onChange={(e) => handleInputChange('identifyCard', e.target.value)}
                  placeholder='Số căn cước công dân'
                />
                {errors.identifyCard && <p className='text-sm text-red-500'>{errors.identifyCard}</p>}
              </div>
            </div>
          </div>

          {/* Giấy tờ và chứng nhận */}
          <div className='space-y-6'>
            <div className='flex items-center space-x-3 border-b border-gray-200 pb-3'>
              <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center'>
                <span className='text-purple-600 font-semibold'>4</span>
              </div>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>Giấy tờ và chứng nhận</h2>
                <p className='text-sm text-gray-500'>Upload các giấy tờ cần thiết</p>
              </div>
            </div>

            <div className='space-y-8'>
              {/* Giấy tờ cá nhân */}
              <div className=' rounded-xl p-6 border border-blue-200'>
                <div className='flex items-center gap-3 mb-6'>
                  <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                    <svg className='w-5 h-5 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900'>Giấy tờ cá nhân</h3>
                    <p className='text-sm text-gray-600'>CCCD/CMND mặt trước và mặt sau</p>
                  </div>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <FileUploadField
                    label='Mặt trước CCCD/CMND'
                    onChange={(files) => handleFileChange('identifyFrontImage', files)}
                    required
                    description='File ảnh rõ nét, đầy đủ 4 góc, định dạng JPG/PNG'
                    maxCount={1}
                  />

                  <FileUploadField
                    label='Mặt sau CCCD/CMND'
                    onChange={(files) => handleFileChange('identifyBackImage', files)}
                    required
                    description='File ảnh rõ nét, đầy đủ 4 góc, định dạng JPG/PNG'
                    maxCount={1}
                  />
                </div>
                {errors.identifyFrontImage && <p className='text-sm text-red-500 mt-2'>{errors.identifyFrontImage}</p>}
                {errors.identifyBackImage && <p className='text-sm text-red-500 mt-2'>{errors.identifyBackImage}</p>}
              </div>

              {/* Giấy tờ đăng ký bán hàng */}
              <div className=' rounded-xl p-6 border border-green-200'>
                <div className='flex items-center gap-3 mb-6'>
                  <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
                    <svg className='w-5 h-5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      Các giấy tờ liên quan đến hoạt động kinh doanh
                    </h3>
                  </div>
                </div>
                <div className='space-y-4'>
                  <FileUploadField
                    label='Giấy tờ đăng ký bán hàng'
                    onChange={(files) => handleFileChange('vendorApplicationImageUrl', files)}
                    multiple
                    description='Có thể upload nhiều file (tối đa 5 file), định dạng JPG/PNG/PDF'
                    maxCount={5}
                  />

                  {/* Hướng dẫn các loại giấy tờ */}
                  <div className='bg-white/60 rounded-lg p-4 border border-green-200'>
                    <h4 className='font-medium text-gray-900 mb-3'>Các loại giấy tờ có thể upload:</h4>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600'>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        <span>Giấy phép kinh doanh</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        <span>Giấy chứng nhận đăng ký thuế</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        <span>Giấy phép vệ sinh an toàn thực phẩm</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        <span>Giấy chứng nhận chất lượng sản phẩm</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cam kết và thỏa thuận */}
          <div className='space-y-6'>
            {/* Header */}
            <div className='flex items-center space-x-3 border-b border-gray-200 pb-4'>
              <div className='w-9 h-9 bg-red-100 rounded-full flex items-center justify-center shadow-sm'>
                <span className='text-red-600 font-semibold'>5</span>
              </div>
              <div>
                <h2 className='text-lg md:text-xl font-semibold text-gray-900'>Cam kết của người bán</h2>
                <p className='text-sm text-gray-500'>Đọc và đồng ý với các điều khoản</p>
              </div>
            </div>

            {/* Agreement Items */}
            <div className='space-y-5'>
              <div className='flex items-start gap-3'>
                <Checkbox
                  className='mt-1 h-5 w-5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 data-[state=checked]:text-white border-2 border-gray-300 hover:border-green-500 transition-colors'
                  id='terms'
                  checked={formData.agreements.terms}
                  onCheckedChange={(checked) => handleAgreementChange('terms', checked as boolean)}
                />
                <Label htmlFor='terms' className='text-sm font-medium leading-5 cursor-pointer'>
                  Tôi đồng ý với Điều khoản dịch vụ và Quy chế hoạt động của
                  <span className='ml-1 text-red-500'>*</span>
                </Label>
              </div>

              <div className='flex items-start gap-3'>
                <Checkbox
                  className='mt-1 h-5 w-5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 data-[state=checked]:text-white border-2 border-gray-300 hover:border-green-500 transition-colors'
                  id='policy'
                  checked={formData.agreements.policy}
                  onCheckedChange={(checked) => handleAgreementChange('policy', checked as boolean)}
                />
                <Label htmlFor='policy' className='text-sm font-medium leading-5 cursor-pointer'>
                  Tôi đồng ý với Chính sách bảo mật và xử lý dữ liệu cá nhân
                  <span className='ml-1 text-red-500'>*</span>
                </Label>
              </div>

              <div className='flex items-start gap-3'>
                <Checkbox
                  className='mt-1 h-5 w-5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 data-[state=checked]:text-white border-2 border-gray-300 hover:border-green-500 transition-colors'
                  id='commission'
                  checked={formData.agreements.commission}
                  onCheckedChange={(checked) => handleAgreementChange('commission', checked as boolean)}
                />
                <Label htmlFor='commission' className='text-sm font-medium leading-5 cursor-pointer'>
                  Tôi đồng ý với chính sách hoa hồng và phí dịch vụ của nền tảng
                  <span className='ml-1 text-red-500'>*</span>
                </Label>
              </div>

              <div className='flex items-start gap-3'>
                <Checkbox
                  className='mt-1 h-5 w-5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 data-[state=checked]:text-white border-2 border-gray-300 hover:border-green-500 transition-colors'
                  id='productQuality'
                  checked={formData.agreements.productQuality}
                  onCheckedChange={(checked) => handleAgreementChange('productQuality', checked as boolean)}
                />
                <div>
                  <Label htmlFor='productQuality' className='text-sm font-medium leading-5 cursor-pointer'>
                    Tôi cam kết về chất lượng, nguồn gốc và tính xác thực của sản phẩm
                    <span className='ml-1 text-red-500'>*</span>
                  </Label>
                  <p className='mt-1 text-xs text-gray-500'>
                    Tôi đồng ý chịu trách nhiệm hoàn toàn về chất lượng và nguồn gốc sản phẩm.
                  </p>
                </div>
              </div>
            </div>

            {/* Error */}
            {errors.agreements && <p className='text-sm text-red-500 font-medium'>{errors.agreements}</p>}
          </div>

          {/* Submit buttons */}
          <div className='flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200'>
            <Button
              type='button'
              variant='outline'
              onClick={() => navigate(path.home)}
              className='w-full sm:w-auto px-8'
            >
              Hủy bỏ
            </Button>
            <Button
              type='submit'
              variant='green'
              disabled={isLoading}
              className='w-full sm:w-auto bg-green-600 hover:bg-green-700 px-8'
            >
              {isLoading ? (
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                  Đang xử lý...
                </div>
              ) : (
                'Đăng ký bán hàng'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SellerRegistrationForm
