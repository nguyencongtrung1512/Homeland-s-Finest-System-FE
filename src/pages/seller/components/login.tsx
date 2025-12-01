import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import path from '../../../constants/path'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { loginSeller } from '../../../apis/auth.api'
import Loading from '../../../components/Loading/loading'
import { useAuth } from '../../../contexts/auth.context'

function SellerLogin() {
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error message when user starts typing
    if (errorMessage) {
      setErrorMessage(null)
    }
  }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous error
    setErrorMessage(null)

    // Validation
    if (!formData.email || !formData.password) {
      const validationError = 'Vui lòng nhập đầy đủ thông tin'
      setErrorMessage(validationError)
      toast.error(validationError)
      return
    }

    setIsLoading(true)
    try {
      const response = await loginSeller({
        email: formData.email.toLowerCase(),
        password: formData.password
      })

      if (response.token) {
        // Tạo userData object cho Auth Context
        const userData = {
          roleName: response.role,
          token: response.token,
          expiresAt: response.expiresAt,
          userId: response.userId,
          email: response.email
        }

        // Cập nhật Auth Context (sẽ tự động lưu vào localStorage)
        authLogin(userData)

        // toast.success('Đăng nhập thành công!')

        // Redirect to seller dashboard
        setTimeout(() => {
          // Xác định đường dẫn redirect theo role
          const redirectPath = getRedirectPath(response.role)
          console.log('Redirecting to:', redirectPath, 'Role:', response.role)

          // Try navigate first
          navigate(redirectPath)

          // Fallback: direct window.location if navigate doesn't work
          setTimeout(() => {
            if (window.location.pathname !== redirectPath) {
              console.log('Navigate failed, using window.location.href')
              window.location.href = redirectPath
            }
          }, 100)
        }, 1000)
      }
    } catch (error: unknown) {
      console.error('Login error:', error)

      // Extract error message from backend response
      // Note: axios interceptor returns error.response.data directly
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.'

      if (error && typeof error === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any

        // Priority 1: Check for direct message field (most common - axios interceptor returns error.response.data directly)
        if (err.message) {
          errorMessage = err.message
        }
        // Priority 2: Check for axios error response structure (error.response.data) - fallback case
        else if (err.response?.data) {
          const responseData = err.response.data

          if (responseData.message) {
            errorMessage = responseData.message
          }
          // Check for errors object (validation errors)
          else if (responseData.errors && typeof responseData.errors === 'object') {
            const errorMessages: string[] = []
            Object.keys(responseData.errors).forEach((field) => {
              const fieldErrors = responseData.errors[field]
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
          else if (responseData.title) {
            errorMessage = responseData.title
          }
          // Check for errors array
          else if (responseData.errors && Array.isArray(responseData.errors)) {
            errorMessage = responseData.errors.join(', ')
          }
          // Check for error string
          else if (responseData.error && typeof responseData.error === 'string') {
            errorMessage = responseData.error
          }
        }
        // Priority 3: Check for direct errors object (validation errors)
        else if (err.errors && typeof err.errors === 'object') {
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
        // Priority 4: Check for direct title field
        else if (err.title) {
          errorMessage = err.title
        }
        // Priority 5: Check for direct errors array
        else if (err.errors && Array.isArray(err.errors)) {
          errorMessage = err.errors.join(', ')
        }
        // Priority 6: Check for direct error string
        else if (err.error && typeof err.error === 'string') {
          errorMessage = err.error
        }
      } else if (error && typeof error === 'string') {
        errorMessage = error
      }

      // Set error message to display on UI
      setErrorMessage(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = () => {
    // Lưu thông tin về nguồn gốc vào localStorage
    localStorage.setItem('forgotPasswordReturnTo', 'seller')
    navigate(`${path.forgotPassword}?returnTo=seller`)
  }

  const handleRegister = () => {
    navigate(path.registerSeller)
  }

  return (
    <div className='w-full'>
      {/* Loading overlay */}
      {isLoading && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-xl p-8 shadow-xl'>
            <Loading size='lg' text='Đang đăng nhập...' />
          </div>
        </div>
      )}

      {/* Welcome Title - Hidden on mobile since it's in layout */}
      <div className='text-center mb-6 hidden md:block'>
        <h2 className='text-xl font-semibold text-gray-800 mb-2'>Chào mừng đối tác</h2>
        <p className='text-sm text-gray-600'>Đăng nhập để quản lý cửa hàng của bạn</p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-lg'>
          <div className='flex items-start gap-3'>
            <div className='flex-shrink-0 mt-0.5'>
              <svg
                className='w-5 h-5 text-red-600'
                fill='currentColor'
                viewBox='0 0 20 20'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
            <div className='flex-1'>
              <p className='text-sm font-medium text-red-800'>{errorMessage}</p>
            </div>
            <button
              type='button'
              onClick={() => setErrorMessage(null)}
              className='flex-shrink-0 text-red-400 hover:text-red-600 transition-colors'
            >
              <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'>
                <path
                  fillRule='evenodd'
                  d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                  clipRule='evenodd'
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className='space-y-5'>
        {/* Email Field */}
        <div className='space-y-2'>
          <Label htmlFor='email' className='text-sm font-medium text-gray-700'>
            Email
          </Label>
          <Input
            id='email'
            type='text'
            name='email'
            value={formData.email}
            onChange={handleInputChange}
            placeholder='Nhập email'
            className='w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors'
          />
        </div>

        {/* Password Field */}
        <div className='space-y-2'>
          <Label htmlFor='password' className='text-sm font-medium text-gray-700'>
            Mật khẩu
          </Label>
          <div className='relative'>
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              name='password'
              value={formData.password}
              onChange={handleInputChange}
              placeholder='Nhập mật khẩu'
              className='w-full h-12 px-4 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors'
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Remember Me and Forgot Password */}
        <div className='flex items-center justify-end pt-2'>
          <button
            type='button'
            onClick={handleForgotPassword}
            className='text-sm text-green-600 hover:text-green-700 font-medium transition-colors'
          >
            Quên mật khẩu?
          </button>
        </div>

        {/* Login Button */}
        <Button
          type='submit'
          disabled={isLoading}
          className='w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-50'
        >
          {isLoading ? (
            <div className='flex items-center gap-2'>
              <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
              Đang đăng nhập...
            </div>
          ) : (
            'Đăng nhập →'
          )}
        </Button>

        {/* Registration Section */}
        <div className='text-center space-y-4 pt-3'>
          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-200'></div>
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='px-4 bg-white text-gray-500'>Hoặc</span>
            </div>
          </div>

          <div className='space-y-3'>
            <p className='text-sm text-gray-500'>Chưa có tài khoản?</p>
            <p className='text-sm text-gray-600'>Tham gia cộng đồng người bán</p>
            <Button
              type='button'
              variant='outline'
              className='w-full h-12 border-2 border-green-600 text-green-600 hover:bg-green-50 font-semibold rounded-lg transition-colors'
              onClick={handleRegister}
            >
              Đăng ký bán hàng
            </Button>
          </div>
        </div>

        {/* Terms and Privacy */}
        <div className='text-center pt-6 border-t border-gray-200'>
          <p className='text-xs text-gray-500 mb-3'>Bằng việc đăng nhập, bạn đồng ý với</p>
          <div className='space-x-4 text-xs text-green-600'>
            <button type='button' className='hover:underline transition-colors'>
              Điều khoản sử dụng
            </button>
            <button type='button' className='hover:underline transition-colors'>
              Chính sách bảo mật
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
export default SellerLogin
