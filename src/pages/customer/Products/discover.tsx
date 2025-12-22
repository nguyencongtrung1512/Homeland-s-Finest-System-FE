import { useNavigate } from 'react-router-dom'
import path from '../../../constants/path'
import discoverImg from '../../../assets/discover.png'

function Discover() {
  const navigate = useNavigate()
  return (
    <section className='relative w-full h-[300px] overflow-hidden'>
      {/* Background Image */}
      <div className='absolute inset-0'>
        <img src={discoverImg} alt='Nông dân thu hoạch lúa' className='w-full h-full object-cover' />
        {/* Dark overlay */}
        <div className='absolute inset-0 bg-black/40' />
      </div>

      {/* Content */}
      <div className='relative z-10 flex items-center justify-center h-full'>
        <div className='text-center text-white max-w-4xl px-6'>
          <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight'>
            Mỗi sản phẩm là một câu chuyện
          </h1>
          <p className='text-lg md:text-xl mb-8 leading-relaxed max-w-3xl mx-auto'>
            Khám phá hành trình từ nông trại đến bàn ăn, từ đôi tay nghệ nhân đến trái tim người tiêu dùng
          </p>
          <button
            onClick={() => navigate(path.discover)}
            className='bg-[#D4A017] hover:bg-[#B8911A] text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-300 shadow-lg'
          >
            Khám phá cửa hàng
          </button>
        </div>
      </div>
    </section>
  )
}

export default Discover
