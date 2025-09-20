import { useNavigate } from 'react-router-dom'
import { path } from '../../../constants/path'
import Footer from '../../../Layouts/CustomerLayout/Footer/Footer'
import BannerWelcome from '../../../assets/BannerWelcome.png'
import HeaderRegister from '../components/headerRegister'

function IntroPage() {
  const navigate = useNavigate()

  const handleRegisterClick = () => {
    navigate(path.registerSeller)
  }

  return (
    <div>
      <HeaderRegister />
      <div className='min-h-screen bg-green-50'>
        {/* Hero Banner Section */}
        <section className='relative w-full bg-[#f2f2ea]'>
          <div className='max-w-7xl mx-auto px-6 py-16 lg:py-24'>
            <div className='grid lg:grid-cols-2 gap-12 items-center'>
              {/* Left Content */}
              <div className='text-black space-y-6'>
                <h1 className='text-4xl lg:text-6xl font-bold leading-tight'>
                  <span className='block'>Mang Câu Chuyện &</span>
                  <span className='block'>Sản Vật Quê Hương</span>
                  <span className='block text-yellow-300'>Vươn Xa</span>
                </h1>

                <p className='text-lg lg:text-xl text-black/90 leading-relaxed max-w-2xl'>
                  Tinh hoa Quê nhà không chỉ là một nền tảng thương mại điện tử. Đây là nơi những giá trị đích thực được
                  tôn vinh, kết nối những nhà sản xuất tâm huyết với khách hàng trân trọng câu chuyện và chất lượng.
                </p>

                <button
                  onClick={handleRegisterClick}
                  className='bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200'
                >
                  Trở thành đối tác
                </button>
              </div>

              {/* Right Image */}
              <div className='relative'>
                <div className='relative rounded-2xl overflow-hidden shadow-2xl'>
                  <img
                    src={BannerWelcome}
                    alt='Thợ thủ công đang làm việc'
                    className='w-full h-[500px] lg:h-[600px] object-cover'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent'></div>
                </div>

                {/* Decorative elements */}
                <div className='absolute -top-4 -right-4 w-24 h-24 bg-yellow-400/20 rounded-full blur-xl'></div>
                <div className='absolute -bottom-4 -left-4 w-32 h-32 bg-amber-300/20 rounded-full blur-xl'></div>
              </div>
            </div>
          </div>

          {/* Background decorative elements */}
          <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
            <div className='absolute top-20 left-10 w-64 h-64 bg-yellow-300/10 rounded-full blur-3xl'></div>
            <div className='absolute bottom-20 right-10 w-80 h-80 bg-amber-200/10 rounded-full blur-3xl'></div>
          </div>
        </section>

        {/* Section 1: Why Choose Tinh Hoa Quê nhà */}
        <section className='py-16 px-6'>
          <div className='max-w-6xl mx-auto'>
            {/* Header */}
            <div className='text-center mb-12'>
              <h1 className='text-4xl font-bold text-green-800 mb-4'>Tại sao chọn Tinh Hoa Quê nhà?</h1>
              <p className='text-lg text-gray-600 max-w-3xl mx-auto'>
                Chúng tôi tạo ra một môi trường kinh doanh lý tưởng cho những người làm nghề thủ công và sản xuất địa
                phương
              </p>
            </div>

            {/* Features Grid */}
            <div className='grid md:grid-cols-2 gap-8'>
              {/* Feature 1 */}
              <div className='flex items-start gap-4'>
                <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                  <svg className='w-6 h-6 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path d='M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z' />
                  </svg>
                </div>
                <div>
                  <h3 className='text-xl font-semibold text-gray-900 mb-2'>Tiếp cận đúng khách hàng</h3>
                  <p className='text-gray-600 leading-relaxed'>
                    Kết nối với cộng đồng những người mua trân trọng sản phẩm có nguồn gốc rõ ràng và giá trị văn hóa.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className='flex items-start gap-4'>
                <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                  <svg className='w-6 h-6 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div>
                  <h3 className='text-xl font-semibold text-gray-900 mb-2'>Kể câu chuyện của riêng bạn</h3>
                  <p className='text-gray-600 leading-relaxed'>
                    Chúng tôi cung cấp không gian để bạn chia sẻ hành trình, quy trình sản xuất và tâm huyết đằng sau
                    mỗi sản phẩm.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className='flex items-start gap-4'>
                <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                  <svg className='w-6 h-6 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div>
                  <h3 className='text-xl font-semibold text-gray-900 mb-2'>Vận hành đơn giản, hiệu quả</h3>
                  <p className='text-gray-600 leading-relaxed'>
                    Nền tảng công nghệ tinh gọn giúp bạn dễ dàng quản lý sản phẩm, đơn hàng và theo dõi hiệu suất kinh
                    doanh.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className='flex items-start gap-4'>
                <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                  <svg className='w-6 h-6 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div>
                  <h3 className='text-xl font-semibold text-gray-900 mb-2'>Đối tác tin cậy & minh bạch</h3>
                  <p className='text-gray-600 leading-relaxed'>
                    Với quy trình thanh toán an toàn (Escrow) và chính sách bảo vệ rõ ràng, chúng tôi cam kết một môi
                    trường kinh doanh công bằng.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Journey to become a partner */}
        <section className='py-16 px-6 bg-green-50'>
          <div className='max-w-6xl mx-auto'>
            {/* Header */}
            <div className='text-center mb-12'>
              <h2 className='text-4xl font-bold text-green-800 mb-4'>Hành trình trở thành đối tác</h2>
              <p className='text-lg text-gray-600 max-w-3xl mx-auto'>
                Chỉ với 4 bước đơn giản, bạn có thể bắt đầu kinh doanh trên nền tảng của chúng tôi
              </p>
            </div>

            {/* Steps */}
            <div className='relative'>
              {/* Connection Line */}
              <div className='hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-gray-300'></div>

              <div className='grid md:grid-cols-4 gap-8'>
                {/* Step 1 */}
                <div className='text-center relative'>
                  <div className='w-16 h-16 bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10'>
                    <span className='text-white text-xl font-bold'>1</span>
                  </div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>Đăng ký hồ sơ</h3>
                  <p className='text-gray-600 text-sm leading-relaxed'>
                    Hoàn tất thông tin cửa hàng và xác minh danh tính
                  </p>
                </div>

                {/* Step 2 */}
                <div className='text-center relative'>
                  <div className='w-16 h-16 bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10'>
                    <span className='text-white text-xl font-bold'>2</span>
                  </div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>Chờ xét duyệt</h3>
                  <p className='text-gray-600 text-sm leading-relaxed'>
                    Đội ngũ của chúng tôi sẽ tiến hành thẩm định thông tin và chất lượng sản phẩm.
                  </p>
                </div>

                {/* Step 3 */}
                <div className='text-center relative'>
                  <div className='w-16 h-16 bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10'>
                    <span className='text-white text-xl font-bold'>3</span>
                  </div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>Xây dựng cửa hàng</h3>
                  <p className='text-gray-600 text-sm leading-relaxed'>
                    Đăng tải sản phẩm, viết câu chuyện thương hiệu và trang trí gian hàng online.
                  </p>
                </div>

                {/* Step 4 */}
                <div className='text-center relative'>
                  <div className='w-16 h-16 bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10'>
                    <span className='text-white text-xl font-bold'>4</span>
                  </div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>Bắt đầu kinh doanh</h3>
                  <p className='text-gray-600 text-sm leading-relaxed'>
                    Tiếp nhận đơn hàng đầu tiên và phát triển cùng cộng đồng.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Call to Action */}
        <section className='py-16 px-6 bg-green-50'>
          <div className='max-w-4xl mx-auto text-center'>
            <h2 className='text-4xl font-bold text-green-800 mb-4'>
              HƯỚNG DẪN ĐĂNG KÝ TRỞ THÀNH CỘNG TÁC VIÊN BÁN HÀNG CÙNG CHÚNG TÔI
            </h2>
            <p className='text-lg text-black mb-8 max-w-2xl mx-auto'>
              Hãy cùng chúng tôi mang những sản phẩm đặc sản và thủ công tuyệt vời của bạn đến với nhiều khách hàng hơn.
            </p>
            <h1 className='text-red-500'> Bussiness Role và cách tính hoa hồng....CHƯA LÀM</h1>
          </div>
        </section>
        <div className='mt-10'>
          <Footer />
        </div>
      </div>
    </div>
  )
}

export default IntroPage
