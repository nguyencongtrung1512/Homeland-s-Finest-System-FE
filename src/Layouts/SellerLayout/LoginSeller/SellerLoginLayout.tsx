import SellerLogin from '../../../pages/seller/components/login'
import RiceFieldImage from '../../../assets/hinh-anh-canh-dong-lua-que-huong-viet-nam_082308136.jpg'
import Footer from '../../CustomerLayout/Footer/Footer'
import HeaderLogin from '../../../pages/seller/components/headerLogin'

function SellerLoginLayout() {
  return (
    <div>
      <HeaderLogin />
      <div className='h-screen w-full grid md:grid-cols-2'>
        {/* Left side - Image */}
        <div className='hidden md:block relative overflow-hidden'>
          <img
            src={RiceFieldImage}
            alt='Cánh đồng lúa quê hương Việt Nam'
            className='absolute inset-0 w-full h-full object-cover'
          />
          <div className='absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent' />

          {/* Overlay content */}
          <div className='absolute inset-0 flex items-center justify-center p-8 mb-95'>
            <div className='text-white text-center max-w-md'>
              <div className='mb-6'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='48'
                  height='48'
                  viewBox='0 0 24 24'
                  fill='none'
                  className='mx-auto mb-4'
                >
                  <path
                    d='M22 3.25C22 7.6875 18.6953 11.3555 14.4141 11.9219C14.1367 9.83594 13.2188 7.95312 11.8633 6.48047C13.3594 3.80859 16.2188 2 19.5 2H20.75C21.4414 2 22 2.55859 22 3.25ZM2 5.75C2 5.05859 2.55859 4.5 3.25 4.5H4.5C9.33203 4.5 13.25 8.41797 13.25 13.25V14.5V20.75C13.25 21.4414 12.6914 22 12 22C11.3086 22 10.75 21.4414 10.75 20.75V14.5C5.91797 14.5 2 10.582 2 5.75Z'
                    fill='#F4A261'
                  />
                </svg>
                <h2 className='text-3xl font-bold mb-2'>Tinh Hoa Quê Nhà</h2>
                <p className='text-lg text-white/90'>Nền tảng kết nối sản phẩm địa phương</p>
              </div>
              <p className='text-white/80 leading-relaxed'>
                Chào mừng bạn đến với cộng đồng những người bán hàng tâm huyết, mang những sản phẩm chất lượng từ quê
                hương đến với khách hàng trên toàn quốc.
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className='flex items-center justify-center p-6 bg-gradient-to-br from-green-50 to-white overflow-hidden'>
          <div className='w-full max-w-[420px] max-h-full overflow-y-auto'>
            {/* Mobile logo */}
            <div className='text-center mb-8 md:hidden'>
              <div className='flex items-center justify-center gap-2 mb-2'>
                <svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none'>
                  <path
                    d='M22 3.25C22 7.6875 18.6953 11.3555 14.4141 11.9219C14.1367 9.83594 13.2188 7.95312 11.8633 6.48047C13.3594 3.80859 16.2188 2 19.5 2H20.75C21.4414 2 22 2.55859 22 3.25ZM2 5.75C2 5.05859 2.55859 4.5 3.25 4.5H4.5C9.33203 4.5 13.25 8.41797 13.25 13.25V14.5V20.75C13.25 21.4414 12.6914 22 12 22C11.3086 22 10.75 21.4414 10.75 20.75V14.5C5.91797 14.5 2 10.582 2 5.75Z'
                    fill='#F4A261'
                  />
                </svg>
                <h1 className='text-2xl font-bold text-green-700'>Tinh Hoa Quê Nhà</h1>
              </div>
              <p className='text-sm text-gray-600'>Đăng nhập để quản lý cửa hàng</p>
            </div>

            <SellerLogin />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default SellerLoginLayout
