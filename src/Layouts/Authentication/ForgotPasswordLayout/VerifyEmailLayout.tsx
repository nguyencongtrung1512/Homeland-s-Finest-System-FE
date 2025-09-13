import React from 'react'
import HeaderLayout from '../headerLayout'
import Footer from '../../CustomerLayout/Footer/Footer'

interface VerifyEmailLayoutProps {
  children: React.ReactNode
}

const VerifyEmailLayout: React.FC<VerifyEmailLayoutProps> = ({ children }) => {
  return (
    <div>
      <HeaderLayout />
      <div className='min-h-screen bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center p-4 pt-20'>
        <div className='w-full max-w-md mx-auto'>
          {children}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default VerifyEmailLayout