import React from 'react'
import { Link } from 'react-router-dom'

interface SellerRegistrationLayoutProps {
  children: React.ReactNode
}

function SellerRegistrationLayout({ children }: SellerRegistrationLayoutProps) {
  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 to-blue-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-6 py-3'>
          <div className='flex items-center justify-between'>
            {/* Logo */}
            <Link to='/' className='flex items-center gap-3 hover:opacity-80 transition-opacity'>
              <svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none'>
                <path
                  d='M22 3.25C22 7.6875 18.6953 11.3555 14.4141 11.9219C14.1367 9.83594 13.2188 7.95312 11.8633 6.48047C13.3594 3.80859 16.2188 2 19.5 2H20.75C21.4414 2 22 2.55859 22 3.25ZM2 5.75C2 5.05859 2.55859 4.5 3.25 4.5H4.5C9.33203 4.5 13.25 8.41797 13.25 13.25V14.5V20.75C13.25 21.4414 12.6914 22 12 22C11.3086 22 10.75 21.4414 10.75 20.75V14.5C5.91797 14.5 2 10.582 2 5.75Z'
                  fill='#F4A261'
                />
              </svg>
              <div>
                <h1 className='!text-[1.2em] font-bold text-[#2D5016] whitespace-nowrap'>Tinh Hoa Quê Nhà</h1>
                <p className='text-sm text-gray-600'>Nền tảng kết nối người mua và người bán</p>
              </div>
            </Link>
            
            {/* Security Info */}
            <div className='flex items-center space-x-2 text-gray-600'>
              <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                  clipRule='evenodd'
                />
              </svg>
              <span className='text-sm font-medium'>Thông tin được bảo mật an toàn</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="py-8">
        <div className="max-w-full mx-auto px-6">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            © 2024 Tinh Hoa Quê Nhà. Tất cả quyền được bảo lưu.
          </div>
        </div>
      </div>
    </div>
  )
}

export default SellerRegistrationLayout