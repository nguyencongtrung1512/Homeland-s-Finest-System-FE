import type { FC } from 'react'

interface StorySectionProps {
  storeName: string
  story: string
}

const StorySection: FC<StorySectionProps> = ({ storeName, story }) => {
  // TODO: Replace with actual API call
  // const { data: storyData, isLoading } = useQuery(['store-story', storeId], () => fetchStoreStory(storeId))

  return (
    <div className='space-y-8'>
      {/* Hero Story Section */}
      <div className='relative rounded-xl overflow-hidden h-96 bg-gradient-to-r from-green-500 to-green-600'>
        <img
          src='https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=1200&h=600&fit=crop&crop=center'
          alt='Cánh đồng lúa xanh'
          className='w-full h-full object-cover opacity-80'
        />
        <div className='absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center'>
          <div className='text-center text-white max-w-4xl px-6'>
            <h2 className='text-4xl font-bold mb-4'>{storeName}</h2>
            <p className='text-lg leading-relaxed'>
              Câu chuyện bắt đầu từ đây, đất trời - nơi mà những hạt giống đầu tiên được gieo trồng. Với niềm tin vào
              sức mạnh của thiên nhiên và tình yêu đối với đất nước, chúng tôi mang đến những sản phẩm nông nghiệp sạch,
              xanh và an toàn cho sức khỏe.
            </p>
          </div>
        </div>
        {/* Play button overlay */}
        <div className='absolute inset-0 flex items-center justify-center'>
          <button className='w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-200 group'>
            <div className='w-0 h-0 border-l-[12px] border-l-green-600 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1'></div>
          </button>
        </div>
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
            <div className='relative'>
              <img
                src='https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&h=300&fit=crop'
                alt='Nông dân chăm sóc lúa'
                className='w-full h-64 object-cover rounded-lg shadow-md'
              />
            </div>
          </div>

          {/* Image Gallery */}
          <div className='mb-8'>
            <h4 className='text-xl font-semibold text-gray-900 mb-4 text-center'>Hình ảnh hạt trưởng</h4>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='relative group cursor-pointer'>
                <img
                  src='https://images.unsplash.com/photo-1505471768190-275e2ad7bcb9?w=300&h=200&fit=crop'
                  alt='Gạo tươi ngon'
                  className='w-full h-32 object-cover rounded-lg group-hover:opacity-75 transition-opacity'
                />
                <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-end'>
                  <p className='text-white text-sm font-medium p-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                    Gạo tươi ngon
                  </p>
                </div>
              </div>

              <div className='relative group cursor-pointer'>
                <img
                  src='https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=300&h=200&fit=crop'
                  alt='Rau củ organic'
                  className='w-full h-32 object-cover rounded-lg group-hover:opacity-75 transition-opacity'
                />
                <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-end'>
                  <p className='text-white text-sm font-medium p-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                    Rau củ organic
                  </p>
                </div>
              </div>

              <div className='relative group cursor-pointer'>
                <img
                  src='https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&h=200&fit=crop'
                  alt='Trái cây tươi'
                  className='w-full h-32 object-cover rounded-lg group-hover:opacity-75 transition-opacity'
                />
                <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-end'>
                  <p className='text-white text-sm font-medium p-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                    Trái cây tươi
                  </p>
                </div>
              </div>

              <div className='relative group cursor-pointer'>
                <img
                  src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=200&fit=crop'
                  alt='Gia vị thiên nhiên'
                  className='w-full h-32 object-cover rounded-lg group-hover:opacity-75 transition-opacity'
                />
                <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-end'>
                  <p className='text-white text-sm font-medium p-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                    Gia vị thiên nhiên
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Commitment */}
          <div className='bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg text-center'>
            <h4 className='text-xl font-semibold text-gray-900 mb-3'>Cam kết của chúng tôi</h4>
            <p className='text-gray-700 leading-relaxed max-w-3xl mx-auto'>
              💡 <strong>Chúng tôi cam kết:</strong> Tất cả sản phẩm đều được kiểm tra chất lượng nghiêm ngặt trước khi
              đến tay khách hàng. Từ khâu gieo trồng, chăm sóc, thu hoạch đến bảo quản và vận chuyển, mọi quy trình đều
              được thực hiện theo tiêu chuẩn cao nhất để đảm bảo sản phẩm tươi ngon, an toàn và giữ trọn vẹn giá trị
              dinh dưỡng.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StorySection
