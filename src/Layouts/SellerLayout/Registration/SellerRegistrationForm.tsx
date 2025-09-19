import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Checkbox } from '../../../components/ui/checkbox'
import { path } from '../../../constants/path'

// Types
interface FormData {
  // Thông tin tài khoản
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string

  // Thông tin cửa hàng
  storeName: string
  storeDescription: string
  storeAddress: string
  businessType: string
  productCategories: string[]

  // Thông tin ngân hàng
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
  bankBranch: string

  // Giấy tờ cá nhân
  citizenId: string
  citizenIdFront: File | null
  citizenIdBack: File | null

  // Giấy tờ kinh doanh
  businessLicense: File | null
  taxCode: string

  // Chứng nhận sản phẩm
  productCertificates: File[]

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

// File Upload Component
const FileUploadField = ({
  label,
  onChange,
  accept = 'image/*',
  required = false,
  multiple = false,
  description
}: {
  label: string
  onChange: (files: FileList | null) => void
  accept?: string
  required?: boolean
  multiple?: boolean
  description?: string
}) => (
  <div className='space-y-2'>
    <Label className='text-sm font-medium'>
      {label} {required && <span className='text-red-500'>*</span>}
    </Label>
    {description && <p className='text-xs text-gray-500'>{description}</p>}
    <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors'>
      <input
        type='file'
        accept={accept}
        multiple={multiple}
        onChange={(e) => onChange(e.target.files)}
        className='hidden'
        id={`file-${label.replace(/\s+/g, '-')}`}
      />
      <label htmlFor={`file-${label.replace(/\s+/g, '-')}`} className='cursor-pointer block'>
        <div className='flex flex-col items-center justify-center space-y-2'>
          <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
            />
          </svg>
          <div className='space-y-1'>
            <p className='text-sm text-gray-600'>Nhấp để chọn file hoặc kéo thả file vào đây</p>
            <p className='text-xs text-gray-500'>{multiple ? 'Có thể chọn nhiều file' : 'Chỉ chọn 1 file'}</p>
          </div>
        </div>
      </label>
    </div>
  </div>
)

function SellerRegistrationForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    storeName: '',
    storeDescription: '',
    storeAddress: '',
    businessType: '',
    productCategories: [],
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
    bankBranch: '',
    citizenId: '',
    citizenIdFront: null,
    citizenIdBack: null,
    businessLicense: null,
    taxCode: '',
    productCertificates: [],
    agreements: {
      terms: false,
      policy: false,
      commission: false,
      productQuality: false
    }
  })

  const [errors, setErrors] = useState<FormErrors>({})

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
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
  const handleFileChange = (field: string, files: FileList | null) => {
    if (!files) return

    if (field === 'productCertificates') {
      setFormData((prev) => ({
        ...prev,
        [field]: Array.from(files)
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: files[0]
      }))
    }
  }

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Required fields validation
    const requiredFields = [
      'fullName',
      'email',
      'phone',
      'password',
      'confirmPassword',
      'storeName',
      'storeDescription',
      'storeAddress',
      'storeCity',
      'bankName',
      'bankAccountNumber',
      'bankAccountName',
      'citizenId',
      'taxCode'
    ]

    requiredFields.forEach((field) => {
      if (!formData[field as keyof FormData]) {
        newErrors[field] = 'Trường này là bắt buộc'
      }
    })

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ'
    }

    // Phone validation
    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ'
    }

    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    // File validation
    if (!formData.citizenIdFront) {
      newErrors.citizenIdFront = 'Vui lòng tải lên mặt trước CCCD'
    }
    if (!formData.citizenIdBack) {
      newErrors.citizenIdBack = 'Vui lòng tải lên mặt sau CCCD'
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      console.log('Form data:', formData)
      alert('Đăng ký thành công! Chúng tôi sẽ xem xét và phản hồi trong vòng 24h.')
      navigate(path.home)
    }
  }

  return (
    <div className='max-w-4xl mx-auto'>
      {/* Header */}
      <div className='text-center mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>Đăng ký trở thành đối tác bán hàng</h1>
        <p className='text-gray-600'>
          Cùng chúng tôi chia sẻ những sản phẩm đặc sản và thủ công tuyệt vời đến khắp mọi miền
        </p>
      </div>

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
                <Label htmlFor='fullName'>
                  Họ và tên <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='fullName'
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder='Nhập họ và tên đầy đủ'
                />
                {errors.fullName && <p className='text-sm text-red-500'>{errors.fullName}</p>}
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
                <Label htmlFor='phone'>
                  Số điện thoại <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='phone'
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder='0987654321'
                />
                {errors.phone && <p className='text-sm text-red-500'>{errors.phone}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password'>
                  Mật khẩu <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='password'
                  type='password'
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder='Nhập mật khẩu'
                />
                {errors.password && <p className='text-sm text-red-500'>{errors.password}</p>}
              </div>

              <div className='space-y-2 md:col-span-2'>
                <Label htmlFor='confirmPassword'>
                  Xác nhận mật khẩu <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder='Nhập lại mật khẩu'
                />
                {errors.confirmPassword && <p className='text-sm text-red-500'>{errors.confirmPassword}</p>}
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

              <div className='space-y-2'>
                <Label htmlFor='businessType'>Loại hình kinh doanh</Label>
                <Select onValueChange={(value) => handleInputChange('businessType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder='Chọn loại hình kinh doanh' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='individual'>Cá nhân</SelectItem>
                    <SelectItem value='company'>Công ty</SelectItem>
                    <SelectItem value='cooperative'>Hợp tác xã</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2 md:col-span-2'>
                <Label htmlFor='storeDescription'>
                  Mô tả cửa hàng <span className='text-red-500'>*</span>
                </Label>
                <Textarea
                  id='storeDescription'
                  value={formData.storeDescription}
                  onChange={(e) => handleInputChange('storeDescription', e.target.value)}
                  placeholder='Mô tả về cửa hàng, sản phẩm và dịch vụ của bạn...'
                  rows={4}
                />
                {errors.storeDescription && <p className='text-sm text-red-500'>{errors.storeDescription}</p>}
              </div>

              <div className='space-y-2 md:col-span-2'>
                <Label htmlFor='storeAddress'>
                  Địa chỉ cửa hàng <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='storeAddress'
                  value={formData.storeAddress}
                  onChange={(e) => handleInputChange('storeAddress', e.target.value)}
                  placeholder='Số nhà, tên đường'
                />
                {errors.storeAddress && <p className='text-sm text-red-500'>{errors.storeAddress}</p>}
              </div>
            </div>
          </div>

          {/* Thông tin ngân hàng */}
          <div className='space-y-6'>
            <div className='flex items-center space-x-3 border-b border-gray-200 pb-3'>
              <div className='w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center'>
                <span className='text-yellow-600 font-semibold'>3</span>
              </div>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>Thông tin ngân hàng</h2>
                <p className='text-sm text-gray-500'>Thông tin tài khoản nhận thanh toán</p>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='bankName'>
                  Ngân hàng <span className='text-red-500'>*</span>
                </Label>
                <Select onValueChange={(value) => handleInputChange('bankName', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder='Chọn ngân hàng' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='vietcombank'>Vietcombank</SelectItem>
                    <SelectItem value='techcombank'>Techcombank</SelectItem>
                    <SelectItem value='bidv'>BIDV</SelectItem>
                    <SelectItem value='vietinbank'>Vietinbank</SelectItem>
                    <SelectItem value='acb'>ACB</SelectItem>
                    <SelectItem value='mbbank'>MB Bank</SelectItem>
                    <SelectItem value='sacombank'>Sacombank</SelectItem>
                  </SelectContent>
                </Select>
                {errors.bankName && <p className='text-sm text-red-500'>{errors.bankName}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='bankAccountNumber'>
                  Số tài khoản <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='bankAccountNumber'
                  value={formData.bankAccountNumber}
                  onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                  placeholder='Số tài khoản ngân hàng'
                />
                {errors.bankAccountNumber && <p className='text-sm text-red-500'>{errors.bankAccountNumber}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='bankAccountName'>
                  Tên chủ tài khoản <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='bankAccountName'
                  value={formData.bankAccountName}
                  onChange={(e) => handleInputChange('bankAccountName', e.target.value)}
                  placeholder='Tên chủ tài khoản'
                />
                {errors.bankAccountName && <p className='text-sm text-red-500'>{errors.bankAccountName}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='bankBranch'>Chi nhánh</Label>
                <Input
                  id='bankBranch'
                  value={formData.bankBranch}
                  onChange={(e) => handleInputChange('bankBranch', e.target.value)}
                  placeholder='Chi nhánh ngân hàng'
                />
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

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Giấy tờ cá nhân */}
              <div className='md:col-span-2'>
                <h3 className='font-medium text-gray-900 mb-4'>Giấy tờ cá nhân</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='citizenId'>
                      Số CCCD/CMND <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='citizenId'
                      value={formData.citizenId}
                      onChange={(e) => handleInputChange('citizenId', e.target.value)}
                      placeholder='Số căn cước công dân'
                    />
                    {errors.citizenId && <p className='text-sm text-red-500'>{errors.citizenId}</p>}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='taxCode'>
                      Mã số thuế <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='taxCode'
                      value={formData.taxCode}
                      onChange={(e) => handleInputChange('taxCode', e.target.value)}
                      placeholder='Mã số thuế cá nhân'
                    />
                    {errors.taxCode && <p className='text-sm text-red-500'>{errors.taxCode}</p>}
                  </div>

                  <FileUploadField
                    label='Mặt trước CCCD/CMND'
                    onChange={(files) => handleFileChange('citizenIdFront', files)}
                    required
                    description='File ảnh rõ nét, đầy đủ 4 góc'
                  />

                  <FileUploadField
                    label='Mặt sau CCCD/CMND'
                    onChange={(files) => handleFileChange('citizenIdBack', files)}
                    required
                    description='File ảnh rõ nét, đầy đủ 4 góc'
                  />
                </div>
                {errors.citizenIdFront && <p className='text-sm text-red-500 mt-2'>{errors.citizenIdFront}</p>}
                {errors.citizenIdBack && <p className='text-sm text-red-500 mt-2'>{errors.citizenIdBack}</p>}
              </div>

              {/* Giấy tờ kinh doanh */}
              <div className='md:col-span-2'>
                <h3 className='font-medium text-gray-900 mb-4'>Giấy tờ kinh doanh</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <FileUploadField
                    label='Giấy phép kinh doanh'
                    onChange={(files) => handleFileChange('businessLicense', files)}
                    description='Giấy chứng nhận đăng ký kinh doanh (nếu có)'
                  />

                  <FileUploadField
                    label='Chứng nhận chất lượng sản phẩm'
                    onChange={(files) => handleFileChange('productCertificates', files)}
                    multiple
                    description='Các chứng nhận về chất lượng, an toàn thực phẩm (nếu có)'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cam kết và thỏa thuận */}
          <div className='space-y-6'>
            <div className='flex items-center space-x-3 border-b border-gray-200 pb-3'>
              <div className='w-8 h-8 bg-red-100 rounded-full flex items-center justify-center'>
                <span className='text-red-600 font-semibold'>5</span>
              </div>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>Cam kết của người bán</h2>
                <p className='text-sm text-gray-500'>Đọc và đồng ý với các điều khoản</p>
              </div>
            </div>

            <div className='space-y-4'>
              <div className='flex items-start space-x-3'>
                <Checkbox
                  id='terms'
                  checked={formData.agreements.terms}
                  onCheckedChange={(checked) => handleAgreementChange('terms', checked as boolean)}
                />
                <div className='space-y-1'>
                  <Label htmlFor='terms' className='text-sm font-medium cursor-pointer'>
                    Tôi đồng ý với Điều khoản dịch vụ và Quy chế hoạt động của Tinh hoa quê nhà{' '}
                    <span className='text-red-500'>*</span>
                  </Label>
                </div>
              </div>

              <div className='flex items-start space-x-3'>
                <Checkbox
                  id='policy'
                  checked={formData.agreements.policy}
                  onCheckedChange={(checked) => handleAgreementChange('policy', checked as boolean)}
                />
                <div className='space-y-1'>
                  <Label htmlFor='policy' className='text-sm font-medium cursor-pointer'>
                    Tôi đồng ý với Chính sách bảo mật và xử lý dữ liệu cá nhân <span className='text-red-500'>*</span>
                  </Label>
                </div>
              </div>

              <div className='flex items-start space-x-3'>
                <Checkbox
                  id='commission'
                  checked={formData.agreements.commission}
                  onCheckedChange={(checked) => handleAgreementChange('commission', checked as boolean)}
                />
                <div className='space-y-1'>
                  <Label htmlFor='commission' className='text-sm font-medium cursor-pointer'>
                    Tôi đồng ý với chính sách hoa hồng và phí dịch vụ của nền tảng{' '}
                    <span className='text-red-500'>*</span>
                  </Label>
                </div>
              </div>

              <div className='flex items-start space-x-3'>
                <Checkbox
                  id='productQuality'
                  checked={formData.agreements.productQuality}
                  onCheckedChange={(checked) => handleAgreementChange('productQuality', checked as boolean)}
                />
                <div className='space-y-1'>
                  <Label htmlFor='productQuality' className='text-sm font-medium cursor-pointer'>
                    Tôi cam kết về chất lượng, nguồn gốc và tính xác thực của sản phẩm{' '}
                    <span className='text-red-500'>*</span>
                  </Label>
                  <p className='text-xs text-gray-500'>
                    Tôi đồng ý chịu trách nhiệm hoàn toàn về chất lượng và nguồn gốc sản phẩm
                  </p>
                </div>
              </div>
            </div>
            {errors.agreements && <p className='text-sm text-red-500'>{errors.agreements}</p>}
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
            <Button type='submit' className='w-full sm:w-auto bg-green-600 hover:bg-green-700 px-8'>
              Đăng ký bán hàng
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SellerRegistrationForm
