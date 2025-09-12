import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer/Footer'

export default function MainLayout() {
  return (
    <div className='min-h-screen w-full flex flex-col'>
      <Header />
      <main className='flex-1 pt-15'>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}