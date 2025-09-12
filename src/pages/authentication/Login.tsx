import React from 'react'
import LoginLayout from '../../Layouts/Authentication/loginLayout'
import { Leaf, ThumbsUp } from 'lucide-react'
import logoImage from '../../assets/luachin2-7984.webp'
import path from '../../constants/path'

function Login() {
  return (
    <LoginLayout>
      <div className='w-full max-w-md bg-white shadow-xl rounded-tr-xl rounded-br-xl'>
        <div className='text-center pb-6 pt-6'>
          <div className='mx-auto mb-4'>
            <div className='w-16 h-16 rounded-full overflow-hidden mx-auto mb-3'>
              <img src={logoImage} alt='Logo' className='w-full h-full object-cover object-center' />
            </div>
            <h2 className='text-xl font-bold text-gray-800'>Đặc Sản Quê Hương</h2>
            <p className='text-sm text-gray-600 mt-1'>Khám phá hương vị truyền thống Việt Nam</p>
          </div>
        </div>

        <div className='px-6 pb-6 space-y-4'>
          <form className='space-y-4'>
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
                  placeholder='Nhập địa chỉ email của bạn'
                  className='w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500'
                />
              </div>
            </div>

            <div>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <svg className='h-5 w-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                    />
                  </svg>
                </div>
                <input
                  type='password'
                  name='password'
                  placeholder='Nhập mật khẩu'
                  className='w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500'
                />
              </div>
            </div>

            <button
              type='submit'
              className='w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2'
            >
              Tiếp tục →
            </button>
          </form>

          <div className='text-center'>
            <a href={path.forgotPassword} className='text-sm text-gray-600 hover:text-green-600'>
              Quên mật khẩu?
            </a>
          </div>

          <div className='text-center'>
            <p className='text-sm text-gray-600'>
              Bạn chưa có tài khoản?{' '}
              <a href='/register' className='text-green-600 hover:text-green-700 font-medium'>
                Đăng ký
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
    </LoginLayout>
  )
}

export default Login
