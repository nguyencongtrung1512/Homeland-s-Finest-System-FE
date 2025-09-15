import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer/Footer'

export default function ProfileLayout() {
  return (
    <div className='min-h-screen w-full flex flex-col bg-[#f8f9f5]'>
      <Header />
      <main className='flex-1 pt-20 pb-8'>
        <div className='container mx-auto px-4 max-w-7xl'>
          <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
            <Outlet />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}