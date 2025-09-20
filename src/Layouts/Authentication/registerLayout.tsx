import React from 'react'
import HeaderLayout from './headerLayout'
import Footer from '../CustomerLayout/Footer/Footer'
import logoImage1 from '../../assets/hinh-anh-canh-dong-lua-que-huong-viet-nam_082308136.jpg'

interface RegisterLayoutProps {
  children: React.ReactNode
}

const RegisterLayout: React.FC<RegisterLayoutProps> = ({ children }) => {
  return (
    <div>
      <HeaderLayout />
      <div className='min-h-screen bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center p-4 pt-20'>
        <div className='w-full max-w-9xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-stretch'>
          {/* Left side - Image */}
          <div className='flex justify-end items-center'>
            <div className='relative h-full w-full max-w-lg'>
              <div className='h-full bg-white shadow-lg overflow-hidden rounded-tl-xl rounded-bl-xl'>
                <img src={logoImage1} alt='Traditional Vietnamese Food' className='w-full h-full object-cover' />
              </div>
            </div>
          </div>
          {/* Right side - Form */}
          <div className='flex justify-start items-center'>
            <div className='w-full max-w-md'>{children}</div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default RegisterLayout
