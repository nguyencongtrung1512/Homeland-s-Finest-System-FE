import { Link } from 'react-router-dom'
import path from '../../constants/path'

function HeaderLayout() {
  return (
    <div className='w-full fixed top-0 left-0 z-50 bg-white flex justify-center items-center border-b border-gray-200'>
      <div className='mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-3 flex-nowrap'>
        {/* Back Button + Logo + Tên */}
        <div className='flex items-center gap-4'>
          {/* Back Button */}
          <Link
            to='/'
            className='flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group'
            title='Quay lại trang chủ'
          >
            <svg
              className='w-4 h-4 text-[#2D5016] group-hover:text-[#F4A261] transition-colors'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
            </svg>
          </Link>

          {/* Logo + Tên - Clickable */}
          <Link to='/' className='flex items-center gap-2 hover:opacity-80 transition-opacity'>
            <svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none'>
              <path
                d='M22 3.25C22 7.6875 18.6953 11.3555 14.4141 11.9219C14.1367 9.83594 13.2188 7.95312 11.8633 6.48047C13.3594 3.80859 16.2188 2 19.5 2H20.75C21.4414 2 22 2.55859 22 3.25ZM2 5.75C2 5.05859 2.55859 4.5 3.25 4.5H4.5C9.33203 4.5 13.25 8.41797 13.25 13.25V14.5V20.75C13.25 21.4414 12.6914 22 12 22C11.3086 22 10.75 21.4414 10.75 20.75V14.5C5.91797 14.5 2 10.582 2 5.75Z'
                fill='#F4A261'
              />
            </svg>
            <div>
              <h3 className='text-xl font-bold text-[#2D5016] whitespace-nowrap'>Tinh Hoa Quê Nhà</h3>
              <p className='text-sm text-[#2D5016] opacity-75'>Đặc Sản Quê Hương</p>
            </div>
          </Link>
        </div>

        {/* Link cộng tác viên */}
        <Link
          to={path.sellerPage}
          className='text-sm text-[#2D5016] hover:text-[#F4A261] transition-colors font-medium whitespace-nowrap'
        >
          Bạn muốn làm cộng tác viên?
        </Link>
      </div>
    </div>
  )
}

export default HeaderLayout
