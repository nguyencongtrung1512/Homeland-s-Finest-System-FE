import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import VietnamMap, { type ProvinceProperties } from '../../../components/Province/VietnamMap'
import { productApi } from '../../../apis/product.api'
import type { Product } from '../../../types'
import EmptyState from '../../../components/EmptyState/emptyState'
import path from '../../../constants/path'


function VietnamSpecialtyMap() {
  const navigate = useNavigate()
  const [selectedProvince, setSelectedProvince] = useState<ProvinceProperties | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizeProvinceName = (name: string) => name

  // Fetch products when province is selected
  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedProvince) {
        setProducts([])
        return
      }

      setLoading(true)
      setError(null)
      
      try {
        const provinceName = normalizeProvinceName(selectedProvince.Name)
        const response = await productApi.getByProvinceName(provinceName, {
          pageSize: 20,
          pageNumber: 1
        })
        
        if (response.status === 200) {
          setProducts(response.data)
        } else {
          setError('Không thể tải dữ liệu sản phẩm')
          setProducts([])
        }
      } catch (err) {
        console.error('Error fetching products:', err)
        setError('Có lỗi xảy ra khi tải dữ liệu')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [selectedProvince])

  const provinceKey = selectedProvince ? normalizeProvinceName(selectedProvince.Name) : null

  const handleRetry = () => {
    if (selectedProvince) {
      // Trigger re-fetch by updating the selectedProvince state
      const currentProvince = selectedProvince
      setSelectedProvince(null)
      setTimeout(() => setSelectedProvince(currentProvince), 100)
    }
  }

  const handleProductClick = (productId: string) => {
    navigate(path.productDetail.replace(':id', productId))
  }

  return (
    <div className='relative w-full min-h-screen flex flex-col lg:flex-row bg-[#F6FAF3]'>
      {/* Left Panel - Map */}
      <div className='lg:w-1/2 bg-[#D1FAE5] w-full h-full flex flex-col items-center justify-center p-8 lg:p-12 relative overflow-hidden'>
        <div className='text-center mb-12 relative z-10'>
          <div className='inline-flex items-center gap-3 mb-4'>
            <h1 className='text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 via-green-500 to-red-700 bg-clip-text text-transparent'>
              Đặc sản Việt Nam
            </h1>
          </div>
          <p className='text-lg text-gray-600 font-medium'>Khám phá hương vị đặc trưng 63 tỉnh thành</p>
          <div className='w-24 h-1 bg-gradient-to-r from-green-500 to-yellow-500 mx-auto rounded-full'></div>
        </div>

        <div className='relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50'>
          <VietnamMap setSelectedProvince={setSelectedProvince} />

          <div className='absolute -top-6 -right-6 w-24 h-16 bg-red-600 flex items-center justify-center shadow-lg animate-pulse'>
            <svg className='w-8 h-8 text-yellow-400' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
            </svg>
          </div>
        </div>
      </div>

      {/* Right Panel - Information and Products */}
      <div className='w-full h-full bg-white/70 backdrop-blur-sm p-8 lg:p-12 flex flex-col border-l border-white/30 bg-[#F6FAF3]'>
        {selectedProvince ? (
          <>
            <div className='bg-[#065F46] rounded-2xl p-5 mb-5 text-white shadow-xl relative overflow-hidden'>
              <div className='flex items-center space-x-6 mb-4 relative z-10'>
                <div>
                  <h2 className='text-2xl font-bold mb-2'>{provinceKey}</h2>
                  <p className='text-red-100 text-lg font-medium'>
                    {selectedProvince?.Region ?? 'Chưa có mô tả cho tỉnh này'}
                  </p>
                </div>
              </div>
            </div>

            <div className='bg-white rounded-2xl p-5 mb-5 border border-orange-100 shadow-lg'>
              <h3 className='text-2xl font-bold text-[#065F46] mb-4 flex items-center gap-3'>Về {provinceKey}</h3>
              <p className='text-[#065F46] text-base leading-relaxed mb-6'>
                {selectedProvince?.details ?? 'Đang cập nhật thông tin'}
              </p>
            </div>

            <div className='flex-1'>
              <h3 className='text-2xl font-bold text-[#065F46] mb-6 flex items-center gap-3'>
                Sản phẩm đặc sản
                {loading && (
                  <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-[#065F46]'></div>
                )}
              </h3>

              {error && (
                <div className='bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4'>
                  {error}
                </div>
              )}

              {loading ? (
                <div className='text-gray-600 text-center py-12'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#065F46] mx-auto mb-4'></div>
                  <p className='text-lg'>Đang tải dữ liệu sản phẩm...</p>
                </div>
              ) : !products || products.length === 0 ? (
                <EmptyState
                  type="products"
                  title="Chưa có sản phẩm đặc sản"
                  description={`Hiện tại chưa có sản phẩm đặc sản nào cho ${provinceKey}. Hãy thử lại sau hoặc chọn tỉnh thành khác.`}
                  actionLabel="Thử lại"
                  onAction={handleRetry}
                  className="border-dashed border-2 border-gray-300"
                />
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                  {products.map((product, index) => (
                    <div
                      key={product.id || index}
                      className='bg-white rounded-2xl shadow hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-green-200 cursor-pointer transform hover:scale-105'
                      onClick={() => handleProductClick(product.id)}
                    >
                      {/* Ảnh sản phẩm */}
                      <div className='h-48 w-full overflow-hidden'>
                        <img
                          src={product.productImages?.[0] || '/images/placeholder.jpg'}
                          alt={product.name}
                          className='w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300'
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = 'https://via.placeholder.com/300x200?text=No+Image'
                          }}
                        />
                      </div>

                      {/* Nội dung */}
                      <div className='p-4 flex flex-col space-y-2'>
                        <h4 className='font-semibold text-gray-800 text-lg line-clamp-2 hover:text-[#065F46] transition-colors'>
                          {product.name}
                        </h4>
                        <p className='text-gray-600 text-sm line-clamp-2'>{product.description}</p>
                        
                        <div className='flex items-center gap-2 text-sm text-gray-500 justify-between'>
                          {/* Rating sao */}
                          <div className='flex items-center gap-1 text-yellow-500 text-lg'>
                            {'★'.repeat(Math.floor(product.rating || 0))}
                            {'☆'.repeat(5 - Math.floor(product.rating || 0))}
                            <span className='text-gray-500 text-sm ml-1'>({product.rating || 0})</span>
                          </div>
                          {/* Số lượt bán */}
                          <span className='text-gray-400'>
                            {product.saleCount ? `${product.saleCount} đã bán` : 'Mới ra mắt'}
                          </span>
                        </div>

                        <div className='flex items-center justify-between mt-2'>
                          <span className='text-[#065F46] font-medium text-sm'>{product.material}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.isActive ? 'Còn hàng' : 'Hết hàng'}
                          </span>
                        </div>

                        {/* Thêm indicator cho việc click */}
                        <div className='mt-2 text-center'>
                          <span className='text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity'>
                            Nhấp để xem chi tiết →
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className='flex-1 flex flex-col items-center justify-center text-center'>
            <div className='w-40 h-40 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center text-7xl text-white mb-8 shadow-2xl animate-bounce'>
              🗺️
            </div>
            <h2 className='text-4xl font-bold mb-4 bg-gradient-to-r from-red-600 to-yellow-600 bg-clip-text text-transparent'>
              Chọn một tỉnh thành
            </h2>
            <p className='text-gray-600 text-xl mb-12 max-w-md leading-relaxed'>
              Nhấp vào bản đồ để khám phá đặc sản địa phương đầy hấp dẫn
            </p>

            <div className='grid grid-cols-3 gap-6 mt-8'>
              {[
                { emoji: '🍜', name: 'Phở', color: 'from-red-400 to-red-500' },
                { emoji: '🥖', name: 'Bánh mì', color: 'from-yellow-400 to-orange-500' },
                { emoji: '🦀', name: 'Hải sản', color: 'from-blue-400 to-cyan-500' }
              ].map((item, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-br ${item.color} p-6 rounded-2xl text-center text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer`}
                >
                  <div className='text-4xl mb-3'>{item.emoji}</div>
                  <p className='font-semibold'>{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VietnamSpecialtyMap
