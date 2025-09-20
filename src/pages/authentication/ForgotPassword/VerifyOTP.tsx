import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import VerifyOTPLayout from '../../../Layouts/Authentication/ForgotPasswordLayout/VerifyOTPLayout'
import { Leaf, ThumbsUp, Mail, RectangleEllipsis, BadgeCheck } from 'lucide-react'
import logoImage from '../../../assets/luachin2-7984.webp'

interface VerifyOTPProps {
  email?: string
  onOTPSubmit?: (otp: string) => void
}

function VerifyOTP({ email: propEmail, onOTPSubmit }: VerifyOTPProps) {
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const location = useLocation()

  // Get email from navigation state or props
  const email = location.state?.email || propEmail || 'của bạn'

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (otp.trim() && otp.length === 6) {
      setIsLoading(true)
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false)
        if (onOTPSubmit) {
          onOTPSubmit(otp)
        }
      }, 1500)
    }
  }

  return (
    <VerifyOTPLayout>
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
                  <RectangleEllipsis className='w-4 h-4' />
                </div>
                <div className='w-12 h-0.5 bg-gray-300'></div>
                <div className='w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm'>
                  <BadgeCheck className='w-4 h-4' />
                </div>
              </div>
            </div>

            <div className='w-16 h-16 rounded-full overflow-hidden mx-auto mb-3'>
              <img src={logoImage} alt='Logo' className='w-full h-full object-cover object-center' />
            </div>
            <h2 className='text-xl font-bold text-gray-800'>Nhập mã xác thực</h2>
            <p className='text-sm text-gray-600 mt-1'>Chúng tôi đã gửi mã 6 số đến email {email || 'của bạn'}</p>
          </div>
        </div>

        <div className='px-6 pb-6 space-y-4'>
          <form className='space-y-4' onSubmit={handleSubmit}>
            <div>
              <label className='block text-gray-700 text-sm font-medium mb-2'>
                Mã xác thực<span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <input
                  type='text'
                  name='otp'
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder='Nhập mã 6 số'
                  className='w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-2xl tracking-widest'
                  maxLength={6}
                  required
                />
              </div>
            </div>

            <button
              type='submit'
              disabled={isLoading || otp.length !== 6}
              className='w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2'
            >
              {isLoading ? 'Đang xác thực...' : 'Xác thực →'}
            </button>
          </form>

          <div className='text-center'>
            <p className='text-sm text-gray-600'>
              Không nhận được mã? <button className='text-green-600 hover:text-green-700 font-medium'>Gửi lại</button>
            </p>
          </div>

          <div className='text-center'>
            <p className='text-sm text-gray-600'>
              Muốn thay đổi email?{' '}
              <a href='/forgot-password/verify-email' className='text-green-600 hover:text-green-700 font-medium'>
                Quay lại
              </a>
            </p>
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
    </VerifyOTPLayout>
  )
}

export default VerifyOTP
