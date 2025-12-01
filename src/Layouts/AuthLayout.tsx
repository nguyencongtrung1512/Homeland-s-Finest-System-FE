import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Sprout } from 'lucide-react'
import { path } from '../constants/path'
import backgroundImage from '../assets/luachin2-7984.webp'

interface AuthLayoutProps {
  children: React.ReactNode
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const navigate = useNavigate()

  return (
    <div className='relative h-screen w-full overflow-hidden flex flex-col'>
      {/* Background Image */}
      <img
        src={backgroundImage}
        alt='Terraced rice fields'
        className='absolute inset-0 object-cover w-full h-full -z-10'
      />

      {/* Top Navigation - Left */}
      <div className='absolute top-6 left-6 z-20'>
        <button
          onClick={() => navigate(path.home)}
          className='flex items-center gap-2 text-white/90 hover:text-white transition-colors group'
        >
          <ChevronLeft className='w-5 h-5 group-hover:-translate-x-1 transition-transform' />
          <div className='flex flex-col items-start'>
            <span className='text-sm font-medium'>Tinh Hoa Quê Nhà</span>
            <div className='flex items-center gap-1.5'>
              <Sprout className='w-4 h-4' />
              <span className='text-xs'>Đặc Sản Quê Hương</span>
            </div>
          </div>
        </button>
      </div>

      {/* Top Navigation - Right */}
      <div className='absolute top-6 right-6 z-20'>
        <a
          href='#'
          className='text-white/90 hover:text-white hover:underline transition-colors text-sm'
        >
          Bạn muốn làm cộng tác viên?
        </a>
      </div>

      {/* Main Content */}
      <div className='flex-1 flex items-center justify-center p-4'>
        <div className='w-full max-w-md mx-auto md:mr-[10%] md:ml-auto relative z-10'>{children}</div>
      </div>
    </div>
  )
}

export default AuthLayout

