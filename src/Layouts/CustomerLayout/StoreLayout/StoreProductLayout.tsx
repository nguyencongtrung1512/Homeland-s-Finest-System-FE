import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../Header'
import Footer from '../Footer/Footer'

interface StoreProductLayoutProps {
  children?: React.ReactNode
}

function StoreProductLayout({ children }: StoreProductLayoutProps) {
  return (
    <div className='min-h-screen bg-gray-50'>
      <Header />
      <main className='min-h-screen pt-0'>{children || <Outlet />}</main>
      <Footer />
    </div>
  )
}

export default StoreProductLayout
