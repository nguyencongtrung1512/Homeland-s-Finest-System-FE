import React from 'react'
import HeaderLayout from '../headerLayout'
import Footer from '../../CustomerLayout/Footer/Footer'

interface NewPasswordLayoutProps {
  children: React.ReactNode
}

function NewPasswordLayout({ children }: NewPasswordLayoutProps) {
  return (
    <div className='min-h-screen bg-gradient-to-br from-green-200 via-green-100 to-green-50 flex flex-col'>
      <HeaderLayout />

      <div className='flex-1 flex items-center justify-center px-4 py-12 mt-8'>
        <div className='w-full max-w-md'>{children}</div>
      </div>

      <Footer />
    </div>
  )
}

export default NewPasswordLayout
