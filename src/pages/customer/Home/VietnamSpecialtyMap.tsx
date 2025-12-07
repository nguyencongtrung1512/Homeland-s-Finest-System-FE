import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import VietnamMap, { type ProvinceProperties } from '../../../components/Province/VietnamMap'
import { productApi } from '../../../apis/product.api'
import { getProvincesDetail, type Province } from '../../../apis/province'
import type { Product } from '../../../types'
import EmptyState from '../../../components/EmptyState/emptyState'
import path from '../../../constants/path'
import { AnimationTextImage } from '../../../components/ui/animation-text-image'
import NexusOrb from '../../../components/ui/nexusorb'

function VietnamSpecialtyMap() {
  const navigate = useNavigate()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [selectedProvince, setSelectedProvince] = useState<ProvinceProperties | null>(null)
  const [provinceDetail, setProvinceDetail] = useState<Province | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProvinceDetail, setLoadingProvinceDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const normalizeProvinceName = (name: string) => name

  // Fetch province detail when province is selected
  useEffect(() => {
    const fetchProvinceDetail = async () => {
      if (!selectedProvince) {
        setProvinceDetail(null)
        return
      }

      setLoadingProvinceDetail(true)

      try {
        const provinceName = normalizeProvinceName(selectedProvince.Name)
        const response = await getProvincesDetail(provinceName)

        if (response.status === 200 && response.data) {
          setProvinceDetail(response.data)
        } else {
          setProvinceDetail(null)
        }
      } catch (err) {
        console.error('Error fetching province detail:', err)
        setProvinceDetail(null)
      } finally {
        setLoadingProvinceDetail(false)
      }
    }

    fetchProvinceDetail()
  }, [selectedProvince])

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

  // Check scroll position
  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.querySelector('.product-card')?.clientWidth || 300
      scrollContainerRef.current.scrollBy({
        left: -cardWidth - 24, // card width + gap
        behavior: 'smooth'
      })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.querySelector('.product-card')?.clientWidth || 300
      scrollContainerRef.current.scrollBy({
        left: cardWidth + 24, // card width + gap
        behavior: 'smooth'
      })
    }
  }

  // Update scroll buttons when products change
  useEffect(() => {
    checkScrollButtons()
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScrollButtons)
      return () => {
        scrollContainer.removeEventListener('scroll', checkScrollButtons)
      }
    }
  }, [products])

  return (
    <div className='relative w-full min-h-screen flex flex-col lg:flex-row bg-[#F6FAF3]'>
      {/* Left Panel - Map */}
      <div className='lg:w-1/3 bg-[#D1FAE5] w-full h-full flex flex-col items-center justify-center p-8 lg:p-12 relative overflow-hidden'>
        <div className='text-center mb-12 relative z-10'>
          <div className='inline-flex items-center gap-3 mb-4'>
            <h2 className='text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 via-green-500 to-red-700 bg-clip-text text-transparent'>
              Đặc sản Việt Nam
            </h2>
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
      <div className='w-full lg:w-2/3 h-full bg-white/70 backdrop-blur-sm p-8 lg:p-12 flex flex-col border-l border-white/30 bg-[#F6FAF3] overflow-hidden'>
        {selectedProvince ? (
          <>
            <div className='bg-[#065F46] rounded-2xl p-5 mb-5 text-white shadow-xl relative overflow-hidden'>
              <div className='flex items-center space-x-6 mb-4 relative z-10'>
                <div>
                  <h2 className='text-2xl font-bold mb-2'>{provinceKey}</h2>
                  <p className='text-red-100 text-lg font-medium mb-1'>
                    {provinceDetail?.region || selectedProvince?.Region || 'Chưa có thông tin vùng'}
                  </p>
                </div>
                {loadingProvinceDetail && (
                  <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                )}
              </div>
            </div>

            <div className='bg-white rounded-2xl p-5 mb-5 border border-orange-100 shadow-lg'>
              <h3 className='text-2xl font-bold text-[#065F46] mb-4 flex items-center gap-3'>
                Về {provinceKey}
                {loadingProvinceDetail && (
                  <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-[#065F46]'></div>
                )}
              </h3>
              {provinceDetail?.regionSpecified && (
                <p className='text-[#065F46] text-base font-normal'>{provinceDetail.regionSpecified}</p>
              )}
              <p className='text-[#065F46] text-base leading-relaxed mb-6'>
                {provinceDetail?.description || selectedProvince?.description || ''}
              </p>
            </div>

            <div className='flex-1 '>
              <h3 className='text-2xl font-bold text-[#065F46] mb-6 flex items-center gap-3'>
                Sản phẩm đặc sản
                {loading && <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-[#065F46]'></div>}
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
                  type='products'
                  title='Chưa có sản phẩm đặc sản'
                  description={`Hiện tại chưa có sản phẩm đặc sản nào cho ${provinceKey}. Hãy thử lại sau hoặc chọn tỉnh thành khác.`}
                  actionLabel='Thử lại'
                  onAction={handleRetry}
                  className='border-dashed border-2 border-gray-300'
                />
              ) : (
                <div className='relative overflow-hidden w-full'>
                  {/* Scroll Container */}
                  <div
                    ref={scrollContainerRef}
                    className='flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4'
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                    onScroll={checkScrollButtons}
                  >
                    {products.map((product, index) => {
                      // Tính width động dựa trên số lượng sản phẩm
                      const productCount = products.length
                      let cardWidth = 'w-[calc(25%-12px)]'
                      if (productCount === 1) {
                        cardWidth = 'w-full max-w-[300px]'
                      } else if (productCount === 2) {
                        cardWidth = 'w-[calc(50%-8px)]'
                      } else if (productCount === 3) {
                        cardWidth = 'w-[calc(33.333%-11px)]'
                      }
                      // Nếu có 4 sản phẩm trở lên, giữ nguyên 25%

                      return (
                        <div
                          key={product.id || index}
                          className={`product-card flex-shrink-0 ${cardWidth} min-w-[220px] bg-white rounded-2xl shadow hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-green-200 cursor-pointer transform hover:scale-105`}
                          onClick={() => handleProductClick(product.id)}
                        >
                          {/* Ảnh sản phẩm */}
                          <div className='h-48 w-full overflow-hidden'>
                            <img
                              src={
                                product.productImages?.[0] ||
                                'https://i.pinimg.com/1200x/c5/3e/6e/c53e6e265a893d70b00070563d063606.jpg'
                              }
                              alt={product.name}
                              className='w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300'
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = 'https://i.pinimg.com/1200x/c5/3e/6e/c53e6e265a893d70b00070563d063606.jpg'
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
                              {/* Giá sản phẩm */}
                              <span className='text-gray-400'>
                                {product.price ? `${product.price.toLocaleString('vi-VN')}₫` : 'lỗi nhận giá'}
                              </span>
                            </div>

                            <div className='flex items-center justify-between mt-2'>
                              <span className='text-[#065F46] font-medium text-sm'>{product.material}</span>
                            </div>

                            {/* Thêm indicator cho việc click */}
                            <div className='mt-2 text-center'>
                              <span className='text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity'>
                                Nhấp để xem chi tiết →
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Navigation Buttons */}
                  {products.length > 0 && (
                    <>
                      {/* Left Button */}
                      {canScrollLeft && (
                        <button
                          onClick={scrollLeft}
                          className='absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 text-gray-700 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#065F46]'
                          aria-label='Sản phẩm trước'
                        >
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            width='24'
                            height='24'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          >
                            <path d='m15 18-6-6 6-6' />
                          </svg>
                        </button>
                      )}

                      {/* Right Button */}
                      {canScrollRight && (
                        <button
                          onClick={scrollRight}
                          className='absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 text-gray-700 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#065F46]'
                          aria-label='Sản phẩm tiếp theo'
                        >
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            width='24'
                            height='24'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          >
                            <path d='m9 18 6-6-6-6' />
                          </svg>
                        </button>
                      )}
                    </>
                  )}

                  {/* Hide scrollbar for webkit browsers */}
                  <style>{`
                    .scrollbar-hide::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className='flex-1 flex flex-col items-center justify-center text-center'>
            <div className='w-full flex flex-col items-center justify-center gap-8'>
              <div className='w-full h-[280px] flex flex-col items-center justify-center gap-2'>
                <div className='w-full h-[40%]'>
                  <AnimationTextImage
                    fontFamily='Helvetica, Arial, sans-serif'
                    fontSize={12}
                    letterSpacing='0.15em'
                    textTransform='uppercase'
                    className='w-full h-full'
                  >
                    Tinh Hoa
                  </AnimationTextImage>
                </div>
                <div className='w-full h-[40%] py-2'>
                  <AnimationTextImage
                    fontFamily='Helvetica, Arial, sans-serif'
                    fontSize={12}
                    letterSpacing='0.05em'
                    textTransform='uppercase'
                    className='w-full h-full'
                  >
                    Quê Nhà
                  </AnimationTextImage>
                </div>
              </div>
              <div className='flex flex-row items-center justify-center gap-10'>
                <div className='mb-12'>
                  <h2 className='text-4xl font-bold mb-4 bg-gradient-to-r from-red-600 to-yellow-600 bg-clip-text text-transparent'>
                    Chọn một tỉnh thành
                  </h2>
                  <p className='text-gray-600 text-xl mb-12 max-w-md leading-relaxed'>
                    Nhấp vào bản đồ để khám phá đặc sản địa phương đầy hấp dẫn
                  </p>
                </div>
                <div>
                  <NexusOrb />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VietnamSpecialtyMap
