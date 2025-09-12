import React from 'react'

function Brand() {
  return (
    <div className='max-w-6xl mx-auto px-6 py-8'>
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='bg-gray-50 rounded-lg p-6'>
          <div className='flex flex-col lg:flex-row gap-6'>
            {/* Left Section - Brand Information */}
            <div className='flex-1'>
              {/* Brand Header */}
              <div className='flex items-start gap-4 mb-6'>
                {/* Brand Logo */}
                <div className='w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0'>
                  <svg className='w-8 h-8 text-white' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z' clipRule='evenodd' />
                  </svg>
                </div>

                {/* Brand Info */}
                <div className='flex-1'>
                  <h3 className='text-2xl font-bold text-gray-900 mb-2'>Ngon Lành</h3>
                  <p className='text-gray-700 text-base leading-6 mb-4'>
                    Thương hiệu đặc sản An Giang, mang đến sản phẩm tự nhiên, nguyên chất 100% từ nông trại quê hương. Cam kết chất lượng và an toàn thực phẩm.
                  </p>

                  {/* Send Message Button */}
                  <button className='bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center gap-2'>
                    <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z' clipRule='evenodd' />
                    </svg>
                    Gửi tin nhắn
                  </button>
                </div>
              </div>

              {/* Trust Certifications */}
              <div>
                <h4 className='text-lg font-semibold text-gray-900 mb-3'>Chứng nhận uy tín</h4>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                  {/* VietGAP */}
                  <div className='bg-green-100 border border-green-200 rounded-lg p-3 text-center'>
                    <div className='w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2'>
                      <svg className='w-4 h-4 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                      </svg>
                    </div>
                    <span className='text-sm font-medium text-green-800'>VietGAP</span>
                  </div>

                  {/* OCOP 4 sao */}
                  <div className='bg-yellow-100 border border-yellow-200 rounded-lg p-3 text-center'>
                    <div className='w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2'>
                      <svg className='w-4 h-4 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                      </svg>
                    </div>
                    <span className='text-sm font-medium text-yellow-800'>OCOP 4 sao</span>
                  </div>

                  {/* Hữu cơ */}
                  <div className='bg-green-50 border border-green-300 rounded-lg p-3 text-center'>
                    <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2'>
                      <svg className='w-4 h-4 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z' clipRule='evenodd' />
                      </svg>
                    </div>
                    <span className='text-sm font-medium text-green-700'>Hữu cơ</span>
                  </div>

                  {/* An toàn thực phẩm */}
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 text-center'>
                    <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2'>
                      <svg className='w-4 h-4 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                      </svg>
                    </div>
                    <span className='text-sm font-medium text-blue-800'>An toàn thực phẩm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Action Buttons */}
            <div className='lg:w-80 flex flex-col gap-3'>
              <button className='w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2'>
                <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M9 2a1 1 0 000 2h2a1 1 0 100-2H9z' />
                  <path fillRule='evenodd' d='M4 5a2 2 0 012-2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z' clipRule='evenodd' />
                </svg>
                Xem câu chuyện thương hiệu
              </button>
              <button className='w-full border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-2'>
                <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z' />
                </svg>
                Khám phá cửa hàng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Brand