import RegisterLayout from '../../Layouts/Authentication/registerLayout'
import { Leaf, ThumbsUp, User, Mail, Phone, Lock, Loader2, ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'
import { registerCustomer } from '../../apis/auth.api'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { path } from '../../constants/path'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Label } from '../../components/ui/label'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { Calendar as CalendarComponent } from '../../components/ui/calendar'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface RegisterFormData {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  password: string
  confirmPassword: string
  gender: string
  dateOfBirth: Date | undefined
}

function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    gender: 'Male',
    dateOfBirth: undefined
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [calendarOpen, setCalendarOpen] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      gender: value
    }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      const errorMsg = 'Vui lòng nhập tên'
      setError(errorMsg)
      toast.warning(errorMsg, { position: 'top-right', autoClose: 3000 })
      return false
    }
    if (!formData.lastName.trim()) {
      const errorMsg = 'Vui lòng nhập họ'
      setError(errorMsg)
      toast.warning(errorMsg, { position: 'top-right', autoClose: 3000 })
      return false
    }
    if (!formData.email.trim()) {
      const errorMsg = 'Vui lòng nhập địa chỉ email'
      setError(errorMsg)
      toast.warning(errorMsg, { position: 'top-right', autoClose: 3000 })
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      const errorMsg = 'Địa chỉ email không hợp lệ'
      setError(errorMsg)
      toast.warning(errorMsg, { position: 'top-right', autoClose: 3000 })
      return false
    }
    if (!formData.phoneNumber.trim()) {
      const errorMsg = 'Vui lòng nhập số điện thoại'
      setError(errorMsg)
      toast.warning(errorMsg, { position: 'top-right', autoClose: 3000 })
      return false
    }
    if (!formData.password) {
      const errorMsg = 'Vui lòng nhập mật khẩu'
      setError(errorMsg)
      toast.warning(errorMsg, { position: 'top-right', autoClose: 3000 })
      return false
    }
    if (formData.password.length < 6) {
      const errorMsg = 'Mật khẩu phải có ít nhất 6 ký tự'
      setError(errorMsg)
      toast.warning(errorMsg, { position: 'top-right', autoClose: 3000 })
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      const errorMsg = 'Mật khẩu xác nhận không khớp'
      setError(errorMsg)
      toast.warning(errorMsg, { position: 'top-right', autoClose: 3000 })
      return false
    }
    if (!formData.dateOfBirth) {
      const errorMsg = 'Vui lòng chọn ngày sinh'
      setError(errorMsg)
      toast.warning(errorMsg, { position: 'top-right', autoClose: 3000 })
      return false
    }

    // Validate date of birth - cannot be in the future
    const today = new Date()
    today.setHours(23, 59, 59, 999) // Set to end of today
    if (formData.dateOfBirth > today) {
      const errorMsg = 'Ngày sinh không được là ngày trong tương lai'
      setError(errorMsg)
      toast.warning(errorMsg, { position: 'top-right', autoClose: 3000 })
      return false
    }

    // Validate age - must be at least 13 years old
    const age = today.getFullYear() - formData.dateOfBirth.getFullYear()
    const monthDiff = today.getMonth() - formData.dateOfBirth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < formData.dateOfBirth.getDate())) {
      const actualAge = age - 1
      if (actualAge < 13) {
        const errorMsg = 'Bạn phải ít nhất 13 tuổi để đăng ký'
        setError(errorMsg)
        toast.warning(errorMsg, { position: 'top-right', autoClose: 3000 })
        return false
      }
    } else if (age < 13) {
      const errorMsg = 'Bạn phải ít nhất 13 tuổi để đăng ký'
      setError(errorMsg)
      toast.warning(errorMsg, { position: 'top-right', autoClose: 3000 })
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const apiData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth!.toISOString().split('T')[0] // Convert to YYYY-MM-DD format
      }

      const response = await registerCustomer(apiData)

      // Kiểm tra response có thành công không
      if (response && (response.status === 201 || response.status === 200)) {
        // Show success toast
        toast.success(response?.data?.message || 'Tạo tài khoản thành công!', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        })

        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          password: '',
          confirmPassword: '',
          gender: 'Male',
          dateOfBirth: undefined
        })

        // Navigate to login page after successful registration
        setTimeout(() => {
          navigate(path.login)
        }, 2000)
      } else {
        const errorMsg = response?.data?.message || 'Đăng ký thất bại'
        setError(errorMsg)
        toast.error(errorMsg, {
          position: 'top-right',
          autoClose: 5000
        })
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; error?: string } }; message?: string }
      console.error('Registration error in component:', err)
      console.error(
        'Error response data:',
        (err as { response?: { data?: { message?: string; error?: string } } }).response?.data
      )

      // Handle different error formats
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Có lỗi xảy ra khi tạo tài khoản'

      // Show error toast
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <RegisterLayout>
      <Card className='w-full max-w-md shadow-xl'>
        <CardHeader className='text-center pb-4 pt-4'>
          <div className='mx-auto mb-4'>
            <div className='w-24 h-24 rounded-full overflow-hidden mx-auto mb-3'>
              <svg xmlns='http://www.w3.org/2000/svg' width='70' height='100' viewBox='0 0 24 24' fill='none'>
                <path
                  d='M22 3.25C22 7.6875 18.6953 11.3555 14.4141 11.9219C14.1367 9.83594 13.2188 7.95312 11.8633 6.48047C13.3594 3.80859 16.2188 2 19.5 2H20.75C21.4414 2 22 2.55859 22 3.25ZM2 5.75C2 5.05859 2.55859 4.5 3.25 4.5H4.5C9.33203 4.5 13.25 8.41797 13.25 13.25V14.5V20.75C13.25 21.4414 12.6914 22 12 22C11.3086 22 10.75 21.4414 10.75 20.75V14.5C5.91797 14.5 2 10.582 2 5.75Z'
                  fill='#F4A261'
                />
              </svg>
            </div>
            <CardTitle className='text-2xl font-bold text-foreground'>Tinh Hoa Quê Nhà</CardTitle>
            <CardDescription className='text-sm text-muted-foreground mt-1'>
              Tạo tài khoản để khám phá tinh hoa Việt Nam
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className='px-6 pb-6 space-y-4'>
          {/* Error Message */}
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form className='space-y-4' onSubmit={handleSubmit}>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='firstName'>
                  Tên<span className='text-destructive'>*</span>
                </Label>
                <div className='relative'>
                  <User className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                  <Input
                    id='firstName'
                    type='text'
                    name='firstName'
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder='Nhập tên của bạn'
                    className='pl-10'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='lastName'>
                  Họ<span className='text-destructive'>*</span>
                </Label>
                <div className='relative'>
                  <User className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                  <Input
                    id='lastName'
                    type='text'
                    name='lastName'
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder='Nhập họ của bạn'
                    className='pl-10'
                  />
                </div>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email'>
                Địa chỉ Email<span className='text-destructive'>*</span>
              </Label>
              <div className='relative'>
                <Mail className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='email'
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder='Nhập địa chỉ email của bạn'
                  className='pl-10'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phoneNumber'>
                Số điện thoại<span className='text-destructive'>*</span>
              </Label>
              <div className='relative'>
                <Phone className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='phoneNumber'
                  type='tel'
                  name='phoneNumber'
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder='Nhập số điện thoại'
                  className='pl-10'
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>
                  Giới tính<span className='text-destructive'>*</span>
                </Label>
                <div className='relative'>
                  <User className='absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10' />
                  <Select value={formData.gender} onValueChange={handleSelectChange}>
                    <SelectTrigger className='pl-10'>
                      <SelectValue placeholder='Chọn giới tính' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Male'>Nam</SelectItem>
                      <SelectItem value='Female'>Nữ</SelectItem>
                      <SelectItem value='Other'>Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='dateOfBirth' className='px-1'>
                  Ngày sinh<span className='text-destructive'>*</span>
                </Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant='outline' id='dateOfBirth' className='w-full justify-between font-normal'>
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
                        if (error) setError('')
                        if (success) setSuccess('')
                      }}
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                      locale={vi}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>
                Mật khẩu<span className='text-destructive'>*</span>
              </Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='password'
                  type='password'
                  name='password'
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder='Nhập mật khẩu'
                  className='pl-10'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>
                Xác nhận mật khẩu<span className='text-destructive'>*</span>
              </Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='confirmPassword'
                  type='password'
                  name='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder='Nhập lại mật khẩu'
                  className='pl-10'
                />
              </div>
            </div>

            <Button variant='green' type='submit' disabled={loading} className='w-full' size='lg'>
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Đang tạo tài khoản...
                </>
              ) : (
                'Tạo tài khoản →'
              )}
            </Button>
          </form>

          <div className='text-center'>
            <p className='text-sm text-muted-foreground'>
              Đã có tài khoản?{' '}
              <Button
                variant='link'
                onClick={() => navigate(path.login)}
                className='text-primary hover:underline font-medium p-0 h-auto'
              >
                Đăng nhập
              </Button>
            </p>
          </div>

          <div className='grid grid-cols-3 gap-4 pt-4'>
            <div className='flex flex-col items-center space-y-2'>
              <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                <Leaf className='w-6 h-6 text-green-600' />
              </div>
              <span className='text-sm text-muted-foreground'>Tự nhiên</span>
            </div>
            <div className='flex flex-col items-center space-y-2'>
              <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                <ThumbsUp className='w-6 h-6 text-green-600' />
              </div>
              <span className='text-sm text-muted-foreground'>Uy tín</span>
            </div>
            <div className='flex flex-col items-center space-y-2'>
              <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                <svg className='w-6 h-6 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z'
                  />
                </svg>
              </div>
              <span className='text-sm text-muted-foreground'>Chất lượng</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </RegisterLayout>
  )
}

export default Register
