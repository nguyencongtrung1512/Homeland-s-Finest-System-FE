import React from 'react'
import HeaderLayout from './headerLayout'
import Footer from '../CustomerLayout/Footer/Footer'
import logoImage1 from '../../assets/hinh-anh-canh-dong-lua-que-huong-viet-nam_082308136.jpg'

interface RegisterLayoutProps {
  children: React.ReactNode
}

const RegisterLayout: React.FC<RegisterLayoutProps> = ({ children }) => {
  return (
    <div className='relative min-h-screen w-full overflow-hidden'>
      {/* Full-screen immersive background */}
      <div className='fixed inset-0 z-0'>
        <img
          src={logoImage1}
          alt='Cánh đồng lúa quê hương Việt Nam'
          className='h-full w-full object-cover'
        />
        {/* Subtle overlay for better text readability */}
        <div className='absolute inset-0 bg-black/10' />
      </div>

      {/* Floating Header */}
      <HeaderLayout />

      {/* Main Content Area - Centered */}
      <div className='relative z-10 min-h-[50vh] flex items-center justify-center p-4 pt-12 md:pt-16 pb-8'>
        {children}
      </div>

      {/* Footer */}
      <div className='relative z-10'>
        <Footer />
      </div>
    </div>
  )
}

export default RegisterLayout
