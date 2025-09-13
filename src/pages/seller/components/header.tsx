import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import path from '../../../constants/path'


function Header() {
  return (
    <div className='w-full fixed top-0 left-0 z-50 bg-[#ecf2ea] flex justify-center items-center border-b border-gray-500'>
      <div className='mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-3 flex-nowrap'>
        {/* Logo + Tên */}
        <div className='flex items-center gap-2'>
          <svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none'>
            <path d='M24 24H0V0H24V24Z' stroke='#ecf2ea' />
            <path
              d='M22 3.25C22 7.6875 18.6953 11.3555 14.4141 11.9219C14.1367 9.83594 13.2188 7.95312 11.8633 6.48047C13.3594 3.80859 16.2188 2 19.5 2H20.75C21.4414 2 22 2.55859 22 3.25ZM2 5.75C2 5.05859 2.55859 4.5 3.25 4.5H4.5C9.33203 4.5 13.25 8.41797 13.25 13.25V14.5V20.75C13.25 21.4414 12.6914 22 12 22C11.3086 22 10.75 21.4414 10.75 20.75V14.5C5.91797 14.5 2 10.582 2 5.75Z'
              fill='#F4A261'
            />
          </svg>
          <h3 className='text-xl font-bold text-[#2D5016] whitespace-nowrap'>Tinh Hoa Quê Nhà</h3>
        </div>

        {/* Menu */}
        <nav className='flex mr-100 items-start gap-8 text-[#2D5016] font-medium whitespace-nowrap'>
          <a href='/AboutUs' className=' hover:text-green-700 transition'>
            Về Chúng Tôi
          </a>
          <a href='/Services' className=' hover:text-green-700 transition'>
            Dịch Vụ
          </a>
          <a href='/Contact' className='  hover:text-green-700 transition'>
            Liên Hệ
          </a>
        </nav>
        {/* Cart + Đăng nhập */}
        <div className='flex items-center justify-end gap-3'>
          <Link to={path.loginSeller}>
            <Button variant='green' className='rounded-full px-5 py-2 ml-5'>
              Đăng nhập
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Header
