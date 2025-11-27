import FeaturedProducts from './featuredProducts'
import HandicraftProducts from './handicraftProducts'
import VietnamSpecialtyMap from './VietnamSpecialtyMap'
import BannerWelcome from '../../../assets/BannerWelcome.png'
import ChatBot from '../../../components/ChatBot/chatbot'
import ChatSystem from '../Chat/chatSystem'
import { PromotionBubble } from '../../../components/PromotionBubble'
import { useAuth } from '../../../contexts/auth.context'
import ListStore from './listStore'

function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <main>
      <section className='relative w-full'>
        <img src={BannerWelcome} alt='Tinh Hoa Quê Nhà' className='h-[420px] w-full object-cover' />
        <div className='absolute inset-0 bg-lime-900/35' />

        <div className='absolute left-6 top-1/2 z-10 -translate-y-1/2 sm:left-12 md:left-16 lg:left-20'>
          <h1 className='max-w-3xl text-3xl font-extrabold leading-tight text-white drop-shadow lg:text-5xl'>
            Hành Trình Khám Phá
            <br />
            Tinh Hoa Quê Nhà
          </h1>
          <p className='mt-4 max-w-2xl text-sm text-white/90 md:text-base'>
            Kết nối bạn với những câu chuyện đích thực từ các làng nghề, nông trại trên khắp đất nước
          </p>
          <a
            href='https://homeland-finest-homepage.vercel.app/'
            target='_blank'
            rel='noopener noreferrer'
            className='mt-6 rounded-full bg-[#D4A017] px-6 py-3 text-sm font-semibold text-black hover:opacity-90'
          >
            Bắt Đầu Khám Phá
          </a>
        </div>
      </section>
      <section className='bg-[#F6FAF3] py-8 text-center'>
        <h3 className='text-2xl font-bold text-green-900 mb-2'>Khám Phá Theo Vùng Miền</h3>
        <p className='text-gray-600 max-w-2xl mx-auto'>
          Mỗi vùng miền mang một hương vị riêng, một câu chuyện riêng. Hãy cùng chúng tôi khám phá tinh hoa từng miền
          đất nước.
        </p>
      </section>
      <section>
        <VietnamSpecialtyMap />
      </section>
      <section>
        <FeaturedProducts />
      </section>
      <section>
        <HandicraftProducts />
      </section>
      <section>
        <ListStore />
      </section>
      {isAuthenticated ? <ChatSystem /> : <ChatBot />}
      <PromotionBubble />
    </main>
  )
}

export default HomePage
