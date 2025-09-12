import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import path from '../../constants/path'

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
          <a href='/products' className=' hover:text-green-700 transition'>
            Sản phẩm
          </a>
          <a href='/stories' className=' hover:text-green-700 transition'>
            Câu chuyện
          </a>
          <a href='/contact' className='  hover:text-green-700 transition'>
            Liên hệ
          </a>
        </nav>

        {/* Search box */}
        {/* <div className='flex w-full max-w-[420px] items-center justify-self-center rounded-full border border-[#D5E4CF] bg-white px-3 py-1.5 shadow-sm'>
          <svg
            className='mr-2 h-4 w-4 text-gray-400'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.75 3.75a7.5 7.5 0 0012.9 12.9z'
            />
          </svg>
          <input
            className='w-full border-none bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none'
            type='text'
            placeholder='Tìm kiếm sản phẩm, vùng miền...'
          />
        </div> */}

        {/* Cart + Đăng nhập */}
        <div className='flex items-center justify-end gap-3'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='23'
            height='24'
            viewBox='0 0 23 24'
            fill='none'
            className='text-[#2D5016]'
          >
            <path d='M22.6406 24H0.140625V0H22.6406V24Z' stroke='#ecf2ea' />
            <g clipPath='url(#clip0_2_301)'>
              <path
                d='M0.140625 2.4375C0.140625 1.91797 0.558594 1.5 1.07812 1.5H2.85547C3.71484 1.5 4.47656 2 4.83203 2.75H20.8867C21.9141 2.75 22.6641 3.72656 22.3945 4.71875L20.793 10.668C20.4609 11.8945 19.3477 12.75 18.0781 12.75H6.80859L7.01953 13.8633C7.10547 14.3047 7.49219 14.625 7.94141 14.625H19.2031C19.7227 14.625 20.1406 15.043 20.1406 15.5625C20.1406 16.082 19.7227 16.5 19.2031 16.5H7.94141C6.58984 16.5 5.42969 15.5391 5.17969 14.2148L3.16406 3.62891C3.13672 3.48047 3.00781 3.375 2.85547 3.375H1.07812C0.558594 3.375 0.140625 2.95703 0.140625 2.4375ZM5.14062 19.625C5.14062 19.3788 5.18912 19.135 5.28335 18.9075C5.37758 18.68 5.51569 18.4733 5.6898 18.2992C5.86391 18.1251 6.07061 17.987 6.29809 17.8927C6.52558 17.7985 6.7694 17.75 7.01562 17.75C7.26185 17.75 7.50567 17.7985 7.73316 17.8927C7.96064 17.987 8.16734 18.1251 8.34145 18.2992C8.51556 18.4733 8.65367 18.68 8.7479 18.9075C8.84213 19.135 8.89062 19.3788 8.89062 19.625C8.89062 19.8712 8.84213 20.115 8.7479 20.3425C8.65367 20.57 8.51556 20.7767 8.34145 20.9508C8.16734 21.1249 7.96064 21.263 7.73316 21.3573C7.50567 21.4515 7.26185 21.5 7.01562 21.5C6.7694 21.5 6.52558 21.4515 6.29809 21.3573C6.07061 21.263 5.86391 21.1249 5.6898 20.9508C5.51569 20.7767 5.37758 20.57 5.28335 20.3425C5.18912 20.115 5.14062 19.8712 5.14062 19.625ZM18.2656 17.75C18.7629 17.75 19.2398 17.9475 19.5914 18.2992C19.9431 18.6508 20.1406 19.1277 20.1406 19.625C20.1406 20.1223 19.9431 20.5992 19.5914 20.9508C19.2398 21.3025 18.7629 21.5 18.2656 21.5C17.7683 21.5 17.2914 21.3025 16.9398 20.9508C16.5882 20.5992 16.3906 20.1223 16.3906 19.625C16.3906 19.1277 16.5882 18.6508 16.9398 18.2992C17.2914 17.9475 17.7683 17.75 18.2656 17.75Z'
                fill='#2D5016'
              />
            </g>
            <defs>
              <clipPath id='clip0_2_301'>
                <path d='M0.140625 1.5H22.6406V21.5H0.140625V1.5Z' fill='white' />
              </clipPath>
            </defs>
          </svg>
          <Link to={path.loginCustomer}>
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
