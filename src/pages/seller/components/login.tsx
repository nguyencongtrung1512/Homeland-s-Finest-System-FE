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

function SellerLogin() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.email || !formData.password) {
      toast.error('Vui lòng nhập đầy đủ thông tin')
      return
    }

    setIsLoading(true)
    try {
      const response = await loginSeller({
        email: formData.email,
        password: formData.password
      })

      if (response.token) {
        // Store token and user info
        localStorage.setItem('token', response.token)
        localStorage.setItem('userRole', response.role)
        localStorage.setItem('userEmail', formData.email)

        toast.success('Đăng nhập thành công!')

        // Redirect to seller dashboard
        setTimeout(() => {
          navigate(path.BASE_SELLER)
        }, 1000)
      }
    } catch (error: any) {
      console.error('Login error:', error)

      // Handle different types of errors
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message)
      } else if (error?.message) {
        toast.error(error.message)
      } else {
        toast.error('Đăng nhập thất bại. Vui lòng thử lại.')
      }
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

      {/* Login Form */}
      <form onSubmit={handleSubmit} className='space-y-5'>
        {/* Email Field */}
        <div className='space-y-2'>
          <Label htmlFor='email' className='text-sm font-medium text-gray-700'>
            Email / Số điện thoại
          </Label>
          <Input
            id='email'
            type='text'
            name='email'
            value={formData.email}
            onChange={handleInputChange}
            placeholder='Nhập email hoặc số điện thoại'
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
