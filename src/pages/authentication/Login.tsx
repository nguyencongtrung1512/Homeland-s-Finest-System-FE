import { useNavigate } from 'react-router-dom'
import LoginLayout from '../../Layouts/Authentication/loginLayout'
import { Eye, EyeOff, Leaf, ThumbsUp } from 'lucide-react'
import logoImage from '../../assets/luachin2-7984.webp'
import { path } from '../../constants/path'
import { useState } from 'react'
import { login, type LoginData, type LoginResponseData } from '../../apis/auth.api'
import { toast } from '../../utils/toast'
import { useAuth } from '../../contexts/auth.context'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'

function Login() {
  const navigate = useNavigate()
  const authContext = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const { login: authLogin } = authContext
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  // Hàm xác định đường dẫn redirect theo role
  const getRedirectPath = (role: string): string => {
    switch (role) {
      case 'Seller':
        return path.BASE_SELLER
      case 'Staff':
        return path.BASE_STAFF
      case 'Admin':
        return path.BASE_ADMIN
      case 'Customer':
      default:
        return path.home
    }
  }

  const validateForm = (): boolean => {
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
    if (!formData.password) {
      const errorMsg = 'Vui lòng nhập mật khẩu'
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

    try {
      const loginData = {
        ...formData,
        email: formData.email.toLowerCase()
      }
      const response: LoginResponseData = await login(loginData)

      // Kiểm tra response có token không (vì interceptor đã trả về response.data)
      // Response thực tế chứa { token: "...", expiresAt: "...", role: "..." }
      if (response && response.token) {
        // Lưu thông tin user vào auth context
        const userData = {
          roleName: response.role,
          token: response.token,
          expiresAt: response.expiresAt,
          userId: response.userId,
          email: response.email,
          isPermission: response.isPermission
        }

        // Kiểm tra xem authLogin có tồn tại không
        if (authLogin && typeof authLogin === 'function') {
          try {
            authLogin(userData)
            console.log('authLogin called successfully')
          } catch (error) {
            console.error('Error calling authLogin:', error)
          }
        } else {
          console.error('authLogin is not a function or is undefined:', authLogin)
        }

        // Show success toast
        // toast.success('Đăng nhập thành công!', {
        //   position: 'top-right',
        //   autoClose: 2000,
        //   hideProgressBar: false,
        //   closeOnClick: true,
        //   pauseOnHover: true,
        //   draggable: true
        // })

        // Delay redirect to allow toast to show
        setTimeout(() => {
          // Xác định đường dẫn redirect theo role
          const redirectPath = getRedirectPath(response.role)

          // Try navigate first
          navigate(redirectPath)

          // Fallback: direct window.location if navigate doesn't work
          setTimeout(() => {
            if (window.location.pathname !== redirectPath) {
              window.location.href = redirectPath
            }
          }, 100)
        }, 1500)
      } else {
        const errorMsg = 'Đăng nhập thất bại'
        setError(errorMsg)
        toast.error(errorMsg, {
          position: 'top-right',
          autoClose: 3000
        })
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; error?: string } }; message?: string }

      // Handle different error formats
      const errorMessage =
        error.response?.data?.message || error.response?.data?.error || error.message || 'Có lỗi xảy ra khi đăng nhập'

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

  const handleForgotPassword = () => {
    // Lưu thông tin về nguồn gốc vào localStorage
    localStorage.setItem('forgotPasswordReturnTo', 'customer')
    navigate(`${path.forgotPassword}?returnTo=customer`)
  }

  return (
    <LoginLayout>
      <Card className='w-full max-w-md shadow-xl'>
        <CardHeader className='text-center pb-6 pt-6'>
          <div className='mx-auto mb-4'>
            <div className='w-16 h-16 rounded-full overflow-hidden mx-auto mb-3'>
              <img src={logoImage} alt='Logo' className='w-full h-full object-cover object-center' />
            </div>
            <CardTitle className='text-xl font-bold text-gray-800'>Đặc Sản Quê Hương</CardTitle>
            <CardDescription className='text-sm text-gray-600 mt-1'>
              Khám phá hương vị truyền thống Việt Nam
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className='px-6 pb-6 space-y-4'>
          {/* Error Message */}
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm'>{error}</div>
          )}

          <form className='space-y-4' onSubmit={handleSubmit}>
            <div className='space-y-2'>
              <Label htmlFor='email' className='text-sm font-medium'>
                Địa chỉ Email<span className='text-red-500 ml-1'>*</span>
              </Label>
              <Input
                id='email'
                type='email'
                name='email'
                value={formData.email}
                onChange={handleInputChange}
                placeholder='Nhập địa chỉ email của bạn'
                className='w-full'
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password' className='text-sm font-medium'>
                Mật khẩu<span className='text-red-500 ml-1'>*</span>
              </Label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  name='password'
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder='Nhập mật khẩu'
                  className='w-full pr-10'
                  required
                />
                <button
                  type='button'
                  className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-500'
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              type='submit'
              disabled={loading}
              className='w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3'
            >
              {loading ? (
                <>
                  <svg
                    className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                  Đang đăng nhập...
                </>
              ) : (
                'Tiếp tục →'
              )}
            </Button>
          </form>

          <div className='text-center space-y-2'>
            <Button
              type='button'
              variant='link'
              onClick={handleForgotPassword}
              className='text-sm text-gray-600 hover:text-green-600 p-0 h-auto'
            >
              Quên mật khẩu?
            </Button>
          </div>

          <div className='text-center'>
            <p className='text-sm text-gray-600'>
              Bạn chưa có tài khoản?{' '}
              <Button variant='link' className='text-green-600 hover:text-green-700 font-medium p-0 h-auto'>
                <a href='/register'>Đăng ký</a>
              </Button>
            </p>
          </div>

          <div className='grid grid-cols-3 gap-4 pt-4'>
            <div className='flex flex-col items-center space-y-2'>
              <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                <Leaf className='w-6 h-6 text-green-600' />
              </div>
              <span className='text-sm text-gray-600'>Tự nhiên</span>
            </div>
            <div className='flex flex-col items-center space-y-2'>
              <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                <ThumbsUp className='w-6 h-6 text-green-600' />
              </div>
              <span className='text-sm text-gray-600'>Uy tín</span>
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
              <span className='text-sm text-gray-600'>Chất lượng</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </LoginLayout>
  )
}

export default Login
