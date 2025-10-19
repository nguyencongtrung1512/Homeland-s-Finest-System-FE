import React, { useState, useEffect } from 'react'
import VerifyEmailLayout from '../../../Layouts/Authentication/ForgotPasswordLayout/VerifyEmailLayout'
import { Leaf, ThumbsUp, Mail, BadgeCheck, ArrowLeft } from 'lucide-react'
import logoImage from '../../../assets/luachin2-7984.webp'
import { path } from '../../../constants/path'
import { useNavigate } from 'react-router-dom'

interface VerifyEmailProps {
  onEmailSubmit?: (email: string) => void
}

function VerifyEmail({ onEmailSubmit }: VerifyEmailProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const navigate = useNavigate()

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (email.trim()) {
      setIsLoading(true)
      // Simulate loading and redirect to reset password page
      setTimeout(() => {
        setIsLoading(false)
        setEmailSent(true)
        setCountdown(60) // Start 60 second countdown
        if (onEmailSubmit) {
          onEmailSubmit(email)
        }
      }, 1500)
    }
  }

  const handleResendEmail = () => {
    if (countdown === 0) {
      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
        setCountdown(60) // Reset countdown
        alert('📧 Email đã được gửi lại thành công!')
      }, 1000)
    }
  }

  const handleReceivedCode = () => {
    // Navigate to OTP verification page
    navigate(path.verifyOTP)
  }

  const handleBackToLogin = () => {
    const returnTo = localStorage.getItem('forgotPasswordReturnTo') || 'customer'
    const loginPath = returnTo === 'seller' ? path.loginSeller : path.loginCustomer
    navigate(loginPath)
  }

  return (
    <VerifyEmailLayout>
      <div className='w-full max-w-md bg-white shadow-xl rounded-xl'>
        <div className='text-center pb-6 pt-6'>
          <div className='mx-auto mb-4'>
            {/* Progress indicators */}
            <div className='flex items-center justify-center mb-6'>
              <div className='flex items-center'>
                <div className='w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium'>
                  <Mail className='w-4 h-4' />
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
            <h2 className='text-xl font-bold text-gray-800'>
              {emailSent ? 'Email đã được gửi!' : 'Xác minh Email'}
            </h2>
            <p className='text-sm text-gray-600 mt-1'>
              {emailSent
                ? `Mã xác minh đã được gửi đến ${email}`
                : 'Nhập địa chỉ email để khôi phục mật khẩu'
              }
            </p>
          </div>
        </div>

        <div className='px-6 pb-6 space-y-4'>
          {!emailSent ? (
            <form className='space-y-4' onSubmit={handleSubmit}>
              <div>
                <label className='block text-gray-700 text-sm font-medium mb-2'>
                  Địa chỉ Email<span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <svg className='h-5 w-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                      />
                    </svg>
                  </div>
                  <input
                    type='email'
                    name='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='Nhập địa chỉ email của bạn'
                    className='w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500'
                    required
                  />
                </div>
              </div>

              <button
                type='submit'
                disabled={isLoading || !email.trim()}
                className='w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2'
              >
                {isLoading ? 'Đang gửi email...' : 'Gửi email đặt lại mật khẩu →'}
              </button>
            </form>
          ) : (
            <div className='space-y-4'>
              {/* Success message */}
              <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <svg className='h-5 w-5 text-green-400' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                    </svg>
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm text-green-800'>
                      Email đã được gửi thành công! Vui lòng kiểm tra hộp thư của bạn.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className='space-y-3'>
                <button
                  onClick={handleReceivedCode}
                  className='w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2'
                >
                  <BadgeCheck className='w-5 h-5' />
                  Tôi đã nhận được mã
                </button>

                <button
                  onClick={handleResendEmail}
                  disabled={countdown > 0 || isLoading}
                  className='w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2'
                >
                  {isLoading ? (
                    'Đang gửi lại...'
                  ) : countdown > 0 ? (
                    `Tôi chưa nhận được mã (${countdown}s)`
                  ) : (
                    'Tôi chưa nhận được mã'
                  )}
                </button>
              </div>
            </div>
          )}

          <div className='text-center'>
            <button
              onClick={handleBackToLogin}
              className='text-green-600 hover:text-green-700 font-medium text-sm bg-transparent border-none cursor-pointer flex items-center justify-center gap-1 mx-auto'
            >
              <ArrowLeft className='w-4 h-4' />
              Quay về trang đăng nhập
            </button>
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
    </VerifyEmailLayout>
  )
}

export default VerifyEmail
