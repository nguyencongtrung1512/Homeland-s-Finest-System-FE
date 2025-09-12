import React from 'react'

export const ViewRating: React.FC = () => {
  return (
    <section className='max-w-6xl mx-auto px-6 py-8'>
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        {/* Header */}
        <div className='mb-6'>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>Đánh giá sản phẩm</h2>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              <span className='text-3xl font-bold text-gray-900'>4.9</span>
              <div className='flex text-yellow-500 text-xl'>
                {'★'.repeat(5)}
              </div>
            </div>
            <span className='text-gray-600'>(47 đánh giá)</span>
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className='mb-8'>
          <div className='space-y-2'>
            {/* 5 stars */}
            <div className='flex items-center gap-3'>
              <span className='text-sm text-gray-600 w-12'>5 sao</span>
              <div className='flex-1 bg-gray-200 rounded-full h-2'>
                <div className='bg-green-500 h-2 rounded-full' style={{ width: '85%' }}></div>
              </div>
              <span className='text-sm text-gray-600 w-8'>40</span>
            </div>

            {/* 4 stars */}
            <div className='flex items-center gap-3'>
              <span className='text-sm text-gray-600 w-12'>4 sao</span>
              <div className='flex-1 bg-gray-200 rounded-full h-2'>
                <div className='bg-green-500 h-2 rounded-full' style={{ width: '15%' }}></div>
              </div>
              <span className='text-sm text-gray-600 w-8'>7</span>
            </div>

            {/* 3 stars */}
            <div className='flex items-center gap-3'>
              <span className='text-sm text-gray-600 w-12'>3 sao</span>
              <div className='flex-1 bg-gray-200 rounded-full h-2'>
                <div className='bg-green-500 h-2 rounded-full' style={{ width: '0%' }}></div>
              </div>
              <span className='text-sm text-gray-600 w-8'>0</span>
            </div>
          </div>
        </div>

        {/* Individual Review */}
        <div className='border-t border-gray-200 pt-6'>
          <div className='flex items-start gap-4'>
            {/* Avatar */}
            <div className='w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center'>
              <span className='text-gray-600 font-medium'>NL</span>
            </div>

            {/* Review Content */}
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-2'>
                <span className='font-medium text-gray-900'>Nguyễn Thị Lan</span>
                <div className='flex text-yellow-500'>
                  {'★'.repeat(5)}
                </div>
                <span className='text-sm text-gray-500'>15/12/2024</span>
              </div>

              <p className='text-gray-700 mb-4'>
                Mật ong rất ngon, vị ngọt tự nhiên, không bị pha trộn. Đóng gói cẩn thận, giao hàng nhanh.
                Gia đình tôi rất hài lòng với sản phẩm này.
              </p>

              {/* Product Images */}
              <div className='flex gap-2 mb-4'>
                <img
                  src='https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?q=80&w=100&auto=format&fit=crop'
                  alt='Honey jar'
                  className='w-16 h-16 object-cover rounded-lg'
                />
                <img
                  src='https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=100&auto=format&fit=crop'
                  alt='Nuts'
                  className='w-16 h-16 object-cover rounded-lg'
                />
                <img
                  src='https://images.unsplash.com/photo-1604908554027-432ea0b96227?q=80&w=100&auto=format&fit=crop'
                  alt='Coconut water'
                  className='w-16 h-16 object-cover rounded-lg'
                />
                <img
                  src='https://images.unsplash.com/photo-1548907040-4a1b2e04e8f1?q=80&w=100&auto=format&fit=crop'
                  alt='Chocolate'
                  className='w-16 h-16 object-cover rounded-lg'
                />
              </div>

              {/* Store Response */}
              <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <span className='text-sm font-medium text-green-800'>Phản hồi từ cửa hàng</span>
                </div>
                <p className='text-sm text-green-700'>
                  Cảm ơn chị đã tin tưởng sản phẩm. Chúng tôi cam kết chất lượng 100% tự nhiên!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
