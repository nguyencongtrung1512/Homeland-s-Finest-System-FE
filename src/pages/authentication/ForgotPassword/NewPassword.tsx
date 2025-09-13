import React, { useState } from 'react'
import NewPasswordLayout from '../../../Layouts/Authentication/ForgotPasswordLayout/NewPasswordLayout'
import { Leaf, ThumbsUp, Mail, BadgeCheck, Eye, EyeOff } from 'lucide-react'
import logoImage from '../../../assets/luachin2-7984.webp'
import { useNavigate } from 'react-router-dom'
import path from '../../../constants/path'

interface NewPasswordProps {
  onPasswordSubmit?: (password: string) => void
}

function NewPassword({ onPasswordSubmit }: NewPasswordProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (password.trim() && password === confirmPassword && password.length >= 8) {
      setIsLoading(true)
      // Simulate API call (code cứng)
      setTimeout(() => {
        setIsLoading(false)
        if (onPasswordSubmit) {
          onPasswordSubmit(password)
        }
        // Hiển thị thông báo thành công
        alert('🎉 Bạn đã cập nhật mật khẩu thành công!\n\nVui lòng đăng nhập lại với mật khẩu mới.')
        // Chuyển về trang đăng nhập
        navigate(path.loginCustomer)
      }, 1500)
    }
  }

  return (
    <NewPasswordLayout>
      <div className='w-full max-w-md bg-white shadow-xl rounded-xl'>
        <div className='text-center pb-6 pt-6'>
          <div className='mx-auto mb-4'>
            {/* Progress indicators */}
            <div className='flex items-center justify-center mb-6'>
              <div className='flex items-center'>
                <div className='w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium'>
                  <Mail className='w-4 h-4' />
                </div>
                <div className='w-12 h-0.5 bg-green-600'></div>
                <div className='w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm'>
                  <BadgeCheck className='w-4 h-4' />
                </div>
              </div>
            </div>

            <div className='w-16 h-16 rounded-full overflow-hidden mx-auto mb-3'>
              <img src={logoImage} alt='Logo' className='w-full h-full object-cover object-center' />
            </div>
            <h2 className='text-xl font-bold text-gray-800'>Tạo Mật Khẩu Mới</h2>
            <p className='text-sm text-gray-600 mt-1'>Mật khẩu mới của bạn phải khác với những mật khẩu đã sử dụng trước đây</p>
          </div>
        </div>

        <div className='px-6 pb-6 space-y-4'>
          <form className='space-y-4' onSubmit={handleSubmit}>
            <div>
              <label className='block text-gray-700 text-sm font-medium mb-2'>
                Mật khẩu<span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Phải có ít nhất 8 ký tự'
                  className='w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500'
                  minLength={8}
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                >
                  {showPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                </button>
              </div>
            </div>

            <div>
              <label className='block text-gray-700 text-sm font-medium mb-2'>
                Xác nhận mật khẩu<span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name='confirmPassword'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder='Cả hai mật khẩu phải trùng khớp'
                  className='w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500'
                  minLength={8}
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                >
                  {showConfirmPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className='text-red-500 text-sm mt-1'>Mật khẩu không trùng khớp</p>
              )}
            </div>

            <button
              type='submit'
              disabled={isLoading || !password.trim() || password !== confirmPassword || password.length < 8}
              className='w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2'
            >
              {isLoading ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
          </form>

          <div className='text-center'>
            <a href={path.loginCustomer} className='text-green-600 hover:text-green-700 font-medium text-sm'>
              ← Quay về trang đăng nhập
            </a>
          </div>

          <div className='grid grid-cols-3 gap-4'>
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
        </div>
      </div>
    </NewPasswordLayout>
  )
}

export default NewPassword