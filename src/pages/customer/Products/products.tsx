import { useState, useEffect } from 'react'
import AsideFilter from './AsideFilter/asideFilter'
import ProductCard, { type ProductCardData } from './Product/productCard'
import Discover from './discover'
import { useProducts } from '../../../hooks/useProducts'
import Pagination from '../../../components/Pagination/Pagination'
import Loading from '../../../components/Loading/loading'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../../contexts/cart.context'
import { getAllCombos } from '../../../apis/combo.api'
import { PromotionBubble } from '../../../components/PromotionBubble'

function Products() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(0) // Backend expect zero-based page
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [activeTab, setActiveTab] = useState<'product' | 'combo'>('product')
  const [comboCardData, setComboCardData] = useState<ProductCardData[]>([])
  const [combosLoading, setCombosLoading] = useState(false)
  const [combosError, setCombosError] = useState<string | null>(null)
  // const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt' | 'saleCount' | 'rating'>('createdAt')
  // const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Call API giống hệt Swagger UI
  const { products, loading, error, pagination, refetch } = useProducts({
    pageNumber: currentPage + 1, // Swagger UI dùng pageNumber (1-based)
    pageSize: 10 // Hiển thị 10 sản phẩm mỗi trang
    // Không gửi search và isActive để tránh lỗi
  })

  // Load combos when switching to combo tab
  useEffect(() => {
    const fetchCombos = async () => {
      if (activeTab !== 'combo') return
      try {
        setCombosLoading(true)
        setCombosError(null)
        const data = await getAllCombos({ pageNumber: currentPage + 1, pageSize: 10 })
        const combosArray = Array.isArray(data) ? data : (data as any)?.data || []
        const mapped = combosArray.map(
          (combo: any) =>
            ({
              id: combo.id,
              name: combo.name,
              productImages: [combo.image || '/src/assets/react.svg'],
              material: 'Combo',
              rating: 0,
              reviewCount: 0,
              price: combo.price,
              badge: { text: 'Combo', color: 'bg-amber-500' }
            }) as unknown as ProductCardData
        )
        setComboCardData(mapped)
      } catch (err) {
        setCombosError('Không thể tải combo.')
      } finally {
        setCombosLoading(false)
      }
    }
    fetchCombos()
  }, [activeTab, currentPage])

  // Convert Product[] to ProductCardData[]
  const productCardData: ProductCardData[] = products.map((product) => ({
    ...product,
    badge:
      product.typeProduct === 'Traditional'
        ? { text: 'Truyền thống', color: 'bg-orange-500' }
        : product.typeProduct === 'Premium'
          ? { text: 'Cao cấp', color: 'bg-purple-600' }
          : product.typeProduct === 'Fresh'
            ? { text: 'Tươi ngon', color: 'bg-green-500' }
            : { text: 'Đặc sản', color: 'bg-blue-500' }
  }))

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Search disabled for testing basic API call')
    refetch()
  }

  const handleSortChange = (sort: string) => {
    console.log('Sort disabled for testing basic API call:', sort)
    refetch()
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page - 1) // Convert 1-based UI to 0-based API
  }

  return (
    <div>
      <div className='max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-6'>
        <div className='lg:w-64 flex-shrink-0'>
          <AsideFilter />
        </div>

        {/* Main content */}
        <div className='flex-1'>
          {/* Switch tabs */}
          <div className='flex items-center justify-between mb-4'>
            <div className='flex gap-2'>
              <button
                className={`px-3 py-1.5 rounded-full text-sm ${activeTab === 'product' ? 'bg-green-600 text-white' : 'border bg-white hover:border-green-400'}`}
                onClick={() => setActiveTab('product')}
              >
                Sản phẩm
              </button>
              <button
                className={`px-3 py-1.5 rounded-full text-sm ${activeTab === 'combo' ? 'bg-green-600 text-white' : 'border bg-white hover:border-green-400'}`}
                onClick={() => setActiveTab('combo')}
              >
                Combo
              </button>
            </div>
          </div>

          {/* Search and filter section */}
          <div className='flex flex-col lg:flex-row justify-between gap-4 mb-6'>
            <div className='flex items-center gap-2 overflow-x-auto whitespace-nowrap'>
              {['Mới nhất', 'Bán chạy', 'Giá thấp → cao', 'Giá cao → thấp'].map((sort) => (
                <button
                  key={sort}
                  onClick={() => handleSortChange(sort)}
                  className='px-3 py-1.5 rounded-full border text-sm bg-white hover:border-green-400 transition-colors'
                >
                  {sort}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleSearch}
              className='flex w-full max-w-[420px] items-center rounded-full border border-[#D5E4CF] bg-white px-3 py-1.5 shadow-sm'
            >
              <svg
                className='mr-2 h-4 w-4 text-gray-400'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.75 3.75a7.5 7.5 0 0012.9 12.9z'
                />
              </svg>
              <input
                className='w-full border-none bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none'
                type='text'
                placeholder='Tìm kiếm sản phẩm, vùng miền...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {/* Loading state */}
          {(activeTab === 'product' ? loading : combosLoading) && (
            <div className='py-12'>
              <Loading size='lg' text={activeTab === 'product' ? 'Đang tải sản phẩm...' : 'Đang tải combo...'} />
            </div>
          )}

          {/* Error state */}
          {(activeTab === 'product' ? !!error : !!combosError) && (
            <div className='text-center py-12'>
              <div className='text-red-600 mb-4'>
                <svg className='mx-auto h-12 w-12' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>Có lỗi xảy ra</h3>
              <p className='text-gray-600 mb-4'>{activeTab === 'product' ? error : combosError}</p>
              <button
                onClick={() => (activeTab === 'product' ? refetch() : setActiveTab('combo'))}
                className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Products/Combos grid */}
          {!(activeTab === 'product' ? loading || !!error : combosLoading || !!combosError) && (
            <>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                {activeTab === 'product'
                  ? productCardData.map((product) => <ProductCard key={product.id} product={product} />)
                  : comboCardData.map((combo) => (
                    <ProductCard
                      key={combo.id}
                      product={combo}
                      onClick={() => addToCart({ comboId: combo.id, quantity: 1 })}
                    />
                  ))}
              </div>

              {activeTab === 'product'
                ? productCardData.length === 0 && (
                  <div className='text-center py-12'>
                    <div className='text-gray-400 mb-4'>
                      <svg className='mx-auto h-12 w-12' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='2'
                          d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
                        />
                      </svg>
                    </div>
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>Không tìm thấy sản phẩm</h3>
                    <p className='text-gray-600'>Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc</p>
                  </div>
                )
                : comboCardData.length === 0 && (
                  <div className='text-center py-12'>
                    <div className='text-gray-400 mb-4'>
                      <svg className='mx-auto h-12 w-12' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='2'
                          d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
                        />
                      </svg>
                    </div>
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>Không tìm thấy combo</h3>
                    <p className='text-gray-600'>Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc</p>
                  </div>
                )}

              <Pagination
                currentPage={currentPage + 1}
                totalPages={activeTab === 'product' ? pagination.totalPages : 1}
                onPageChange={handlePageChange}
                maxVisiblePages={5}
              />

              {/* Results info */}
              <div className='text-center text-sm text-gray-600 mt-4'>
                {activeTab === 'product'
                  ? `Hiển thị ${productCardData.length} trong tổng số ${pagination.totalItems} sản phẩm`
                  : `Hiển thị ${comboCardData.length} combo`}
              </div>
            </>
          )}
        </div>
      </div>

      <div>
        <Discover />
      </div>
      <PromotionBubble />
    </div>
  )
}

export default Products
