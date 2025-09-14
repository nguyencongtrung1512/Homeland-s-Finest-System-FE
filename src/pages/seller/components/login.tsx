import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Checkbox } from '~/components/ui/checkbox'
import { path } from '~/constants/path'

function SellerLogin() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login data:', formData)
    // Handle login logic here
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
      {/* Welcome Title */}
      <div className='text-center mb-4'>
        <h2 className='text-lg font-semibold text-gray-800 mb-1'>Chào mừng đối tác</h2>
        <p className='text-sm text-gray-600'>Đăng nhập để quản lý cửa hàng của bạn</p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* Email Field */}
        <div className='space-y-2'>
          <Label htmlFor='email'>Email / Số điện thoại</Label>
          <Input
            id='email'
            type='text'
            name='email'
            value={formData.email}
            onChange={handleInputChange}
            placeholder='Nhập email hoặc số điện thoại'
            className='w-full focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:border-gray-300'
          />
        </div>

        {/* Password Field */}
        <div className='space-y-2'>
          <Label htmlFor='password'>Mật khẩu</Label>
          <div className='relative'>
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              name='password'
              value={formData.password}
              onChange={handleInputChange}
              placeholder='Nhập mật khẩu'
              className='w-full pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:border-gray-300'
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Remember Me and Forgot Password */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='rememberMe'
              name='rememberMe'
              checked={formData.rememberMe}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
              }
            />
            <Label htmlFor='rememberMe' className='text-sm text-gray-600'>
              Ghi nhớ đăng nhập
            </Label>
          </div>
          <button
            type='button'
            onClick={handleForgotPassword}
            className='text-sm text-green-600 hover:text-green-700 font-medium'
          >
            Quên mật khẩu?
          </button>
        </div>

        {/* Login Button */}
        <Button type='submit' className='w-full bg-green-600 hover:bg-green-700'>
          Đăng nhập →
        </Button>

        {/* Registration Section */}
        <div className='text-center space-y-3 pt-4'>
          <p className='text-sm text-gray-500'>Chưa có tài khoản?</p>
          <p className='text-sm text-gray-600'>Tham gia cộng đồng người bán</p>
          <Button 
            type='button' 
            variant='outline' 
            className='w-full border-green-600 text-green-600 hover:bg-green-50'
            onClick={handleRegister}
          >
            Đăng ký bán hàng
          </Button>
        </div>

        {/* Terms and Privacy */}
        <div className='text-center pt-4 border-t border-gray-200'>
          <p className='text-xs text-gray-500 mb-2'>Bằng việc đăng nhập, bạn đồng ý với</p>
          <div className='space-x-4 text-xs text-green-600'>
            <button type='button' className='hover:underline'>
              Điều khoản sử dụng
            </button>
            <button type='button' className='hover:underline'>
              Chính sách bảo mật
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
export default SellerLogin
