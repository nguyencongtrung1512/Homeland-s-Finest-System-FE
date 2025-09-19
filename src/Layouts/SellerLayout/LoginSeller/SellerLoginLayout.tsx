import SellerLogin from '../../../pages/seller/components/login'

function SellerLoginLayout() {
  return (
    <div className='h-screen w-full grid md:grid-cols-2'>
      {/* Left side - Image */}
      <div className='hidden md:block relative overflow-hidden'>
        <div 
          className='absolute inset-0 bg-cover bg-center bg-no-repeat'
          style={{
            backgroundImage: "url('/src/assets/hinh-anh-canh-dong-lua-que-huong-viet-nam_082308136.jpg')"
          }}
        />
        <div className='absolute inset-0 bg-black/20' />
      </div>

      {/* Right side - Login form */}
      <div className='flex items-center justify-center p-4 bg-white overflow-hidden'>
        <div className='w-full max-w-[420px] max-h-full overflow-y-auto'>
          <div className='text-center mb-6'>
            <h1 className='text-3xl font-medium text-green-700 whitespace-nowrap'>Tinh Hoa Quê Nhà</h1>
          </div>
          <SellerLogin />
        </div>
      </div>
    </div>
  )
}

export default SellerLoginLayout
