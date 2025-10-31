import { useNavigate } from 'react-router-dom'
import { useProductDetailContext } from '../productsDetail'
import path from '../../../../../constants/path'

function Brand() {
  const navigate = useNavigate()
  const { product } = useProductDetailContext()

  if (!product) {
    return null
  }

  const handleExploreStore = () => {
    navigate(`${path.store.replace(':storeId', product.storeId)}?tab=products`)
  }

  const handleViewStory = () => {
    navigate(`${path.store.replace(':storeId', product.storeId)}?tab=story`)
  }

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
                    <path
                      fillRule='evenodd'
                      d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>

                {/* Brand Info */}
                <div className='flex-1'>
                  <h2 className='text-2xl font-bold text-gray-900 mb-2'>{product.storeName}</h2>
                  <h4 className='text-base font-bold text-gray-900 mb-2'>Nhà sản xuất: {product.material}</h4>
                  <p className='text-gray-700 text-base leading-6 mb-4'>
                    Cửa hàng chuyên cung cấp {product.typeProduct.toLowerCase()} chất lượng cao.
                    Cam kết mang đến những sản phẩm tốt nhất cho khách hàng.
                  </p>

                  {/* Send Message Button */}
                  <button className='bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center gap-2'>
                    <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z'
                        clipRule='evenodd'
                      />
                    </svg>
                    Nhắn tin
                  </button>
                </div>
              </div>

              {/* Store Stats */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
                <div className='text-center p-3 bg-white rounded-lg border border-gray-200'>
                  <div className='text-2xl font-bold text-green-600'>{product.rating.toFixed(1)}</div>
                  <div className='text-sm text-gray-600'>Đánh giá</div>
                </div>
                <div className='text-center p-3 bg-white rounded-lg border border-gray-200'>
                  <div className='text-2xl font-bold text-green-600'>{product.saleCount}</div>
                  <div className='text-sm text-gray-600'>Đã bán</div>
                </div>
                <div className='text-center p-3 bg-white rounded-lg border border-gray-200'>
                  <div className='text-2xl font-bold text-green-600'>{product.reviewCount}</div>
                  <div className='text-sm text-gray-600'>Lượt đánh giá</div>
                </div>
                <div className='text-center p-3 bg-white rounded-lg border border-gray-200'>
                  <div className='text-2xl font-bold text-green-600'>
                    {product.variants?.length || 0}
                  </div>
                  <div className='text-sm text-gray-600'>Sản phẩm</div>
                </div>
              </div>

              {/* Categories */}
              {product.productCategories && product.productCategories.length > 0 && (
                <div className='mb-6'>
                  <h4 className='text-lg font-semibold text-gray-900 mb-3'>Danh mục sản phẩm:</h4>
                  <div className='flex flex-wrap gap-2'>
                    {product.productCategories.map((category) => (
                      <span
                        key={category.id}
                        className='px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium'
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Section - Action Buttons */}
            <div className='lg:w-80'>
              <div className='space-y-4'>
                <button
                  onClick={handleExploreStore}
                  className='w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2'
                >
                  <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'
                      clipRule='evenodd'
                    />
                  </svg>
                  Khám phá cửa hàng
                </button>

                <button
                  onClick={handleViewStory}
                  className='w-full border border-green-600 text-green-600 py-3 px-6 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center justify-center gap-2'
                >
                  <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z'
                      clipRule='evenodd'
                    />
                  </svg>
                  Xem câu chuyện
                </button>

                {/* Certificates */}
                {product.productCertificateDTOs && product.productCertificateDTOs.length > 0 && (
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                    <h4 className='text-sm font-semibold text-blue-900 mb-2'>Chứng nhận chất lượng:</h4>
                    <div className='space-y-2'>
                      {product.productCertificateDTOs.map((cert) => (
                        <div key={cert.id} className='flex items-center gap-2'>
                          <div className={`w-2 h-2 rounded-full ${cert.status === 'approved' ? 'bg-green-500' :
                            cert.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                          <span className='text-sm text-blue-800'>
                            Chứng nhận {cert.status === 'approved' ? 'đã duyệt' :
                              cert.status === 'pending' ? 'đang chờ' : 'bị từ chối'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Brand
