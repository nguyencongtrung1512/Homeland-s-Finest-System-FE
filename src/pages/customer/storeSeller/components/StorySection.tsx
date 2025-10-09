import type { FC } from 'react'
import VideoPlayer from './VideoPlayer'

interface StorySectionProps {
  storeName: string
  story: string
}

const StorySection: FC<StorySectionProps> = ({ story }) => {
  return (
    <div className='space-y-8'>
      {/* Hero Story Section with Video */}
      <div className='relative rounded-xl overflow-hidden bg-white shadow-sm'>
        <VideoPlayer />
      </div>

      {/* Story Content */}
      <div className='bg-white rounded-lg p-8 shadow-sm'>
        <div className='max-w-4xl mx-auto'>
          <h3 className='text-2xl font-bold text-gray-900 mb-6 text-center'>Câu chuyện của chúng tôi</h3>

          <div className='grid md:grid-cols-2 gap-8 items-center mb-8'>
            <div className='space-y-4 text-gray-700 leading-relaxed'>
              <p>{story}</p>
              <p>
                Với hơn 10 năm kinh nghiệm trong lĩnh vực nông nghiệp, chúng tôi hiểu rõ giá trị của từng sản phẩm và
                cam kết mang đến chất lượng tốt nhất cho khách hàng.
              </p>
            </div>
            <div>
              <img
                src='https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=600&h=400&fit=crop&crop=center'
                alt='Cánh đồng lúa xanh'
                className='w-full h-auto rounded-lg shadow-md'
              />
            </div>
          </div>

          <div className='space-y-4 text-gray-700 leading-relaxed'>
            <p>
              Chúng tôi tin rằng mỗi sản phẩm không chỉ là thực phẩm mà còn là câu chuyện về nguồn gốc, về người nông dân và về tình yêu với mảnh đất quê hương. Đó là lý do tại sao chúng tôi luôn đảm bảo mọi sản phẩm đều được trồng và thu hoạch với sự tận tâm và trách nhiệm cao nhất.
            </p>
            <p>
              Hãy cùng chúng tôi khám phá hương vị tự nhiên và thuần khiết của nông sản Việt Nam, nơi mỗi hạt gạo, mỗi trái cây đều mang trong mình câu chuyện về một Việt Nam phong phú và đa dạng.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StorySection
