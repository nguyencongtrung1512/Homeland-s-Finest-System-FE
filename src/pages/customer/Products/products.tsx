import { useState, useEffect, useMemo } from 'react'
import AsideFilter from './AsideFilter/asideFilter'
import ProductCard, { type ProductCardData } from './Product/productCard'
import Discover from './discover'
import Pagination from '../../../components/Pagination/Pagination'
import Loading from '../../../components/Loading/loading'
import { useCart } from '../../../contexts/cart.context'
import { getAllCombos } from '../../../apis/combo.api'
import { type Combo } from '../../../types/combo.type'
import { ComboList } from '../combo/combo'
import { PromotionBubble } from '../../../components/PromotionBubble'
import ChatBot from '../../../components/ChatBot/chatbot'
import ChatSystem from '../Chat/chatSystem'
import { useAuth } from '../../../contexts/auth.context'
import searchApi, { type SearchRequest } from '../../../apis/search.api'
import type { Product } from '../../../types/productType'

function Products() {
  const { isAuthenticated, user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1) // 1-based for UI
  const [pageSize] = useState(10) // Items per page
  const { addToCart } = useCart()
  const [activeTab, setActiveTab] = useState<'product' | 'combo'>('product')
  const [combos, setCombos] = useState<Combo[]>([])
  const [combosLoading, setCombosLoading] = useState(false)
  const [combosError, setCombosError] = useState<string | null>(null)

  // Search state
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [filters, setFilters] = useState<{
    minPrice?: number
    maxPrice?: number
    categoryFilters?: string[]
    provinceFilters?: string[]
    regionFilters?: string[]
    subRegionFilters?: string[]
  }>({})

  // Fetch products using search API
  useEffect(() => {
    const fetchProducts = async () => {
      if (activeTab !== 'product') return

      try {
        setLoading(true)
        setError(null)

        const searchRequest: SearchRequest = {
          queryText: searchQuery.trim() || '', // Empty string for trending
          userId: user?.userId || null,
          limit: 10, // Get more results for client-side pagination
          sortBy: sortBy || null,
          minPrice: filters.minPrice || null,
          maxPrice: filters.maxPrice || null,
          categoryFilters: filters.categoryFilters || null,
          provinceFilters: filters.provinceFilters || null,
          regionFilters: filters.regionFilters || null,
          subRegionFilters: filters.subRegionFilters || null
        }

        const results = await searchApi.search(searchRequest)
        setProducts(results)
      } catch (err: unknown) {
        console.error('Error fetching products:', err)
        const errorMessage = err instanceof Error ? err.message : 'Không thể tải sản phẩm. Vui lòng thử lại.'
        setError(errorMessage)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [activeTab, searchQuery, sortBy, filters, user?.userId])

  // Fetch combos
  useEffect(() => {
    const fetchCombos = async () => {
      if (activeTab !== 'combo') return
      try {
        setCombosLoading(true)
        setCombosError(null)
        const data = await getAllCombos({ pageNumber: currentPage, pageSize: 12 })
        setCombos(data)
      } catch {
        setCombosError('Không thể tải combo.')
      } finally {
        setCombosLoading(false)
      }
    }
    fetchCombos()
  }, [activeTab, currentPage])

  // Client-side pagination
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return products.slice(start, start + pageSize)
  }, [products, currentPage, pageSize])

  const totalPages = Math.ceil(products.length / pageSize)

  const productCardData: ProductCardData[] = paginatedProducts.map((product) => ({
    ...product,
    price: product.price
  }))

  const handleAddCombo = async (comboId: string) => {
    try {
      await addToCart('', 1, comboId)
    } catch {
      // swallow and rely on global error handling/toast if any
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page on new search
  }

  const handleSortChange = (sort: string) => {
    // Map UI sort labels to API sortBy values
    const sortMap: Record<string, string> = {
      'Mới nhất': 'newest',
      'Bán chạy': 'best-selling',
      'Giá thấp → cao': 'price-asc',
      'Giá cao → thấp': 'price-desc'
    }
    setSortBy(sortMap[sort] || null)
    setCurrentPage(1) // Reset to first page on sort change
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
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
                placeholder={activeTab === 'product' ? 'Tìm kiếm sản phẩm, vùng miền...' : 'Tìm kiếm combo...'}
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
                onClick={() => {
                  if (activeTab === 'product') {
                    // Trigger refetch by updating a dependency
                    setFilters({ ...filters })
                  } else {
                    setActiveTab('combo')
                  }
                }}
                className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Products/Combos grid */}
          {!(activeTab === 'product' ? loading || !!error : combosLoading || !!combosError) && (
            <>
              {activeTab === 'product' ? (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                  {productCardData.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <ComboList
                  combos={combos}
                  loading={combosLoading}
                  error={combosError}
                  onAddToCart={handleAddCombo}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              )}

              {activeTab === 'product' && productCardData.length === 0 && (
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
              )}

              {activeTab === 'product' && (
                <>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    maxVisiblePages={5}
                  />

                  {/* Results info */}
                  <div className='text-center text-sm text-gray-600 mt-4'>
                    Hiển thị {productCardData.length} trong tổng số {products.length} sản phẩm
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div>
        <Discover />
      </div>
      <div>{isAuthenticated ? <ChatSystem /> : <ChatBot />}</div>
      <PromotionBubble />
    </div>
  )
}

export default Products
