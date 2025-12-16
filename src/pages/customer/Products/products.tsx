import { useState, useEffect, useMemo } from 'react'
import AsideFilter from './AsideFilter/asideFilter'
import ProductCard, { type ProductCardData } from './Product/productCard'
import Discover from './discover'
import Pagination from '../../../components/Pagination/Pagination'
import Loading from '../../../components/Loading/loading'
import { useCart } from '../../../contexts/cart.context'
import { filterCombos } from '../../../apis/combo.api'
import { type Combo, type ComboFilterRequest } from '../../../types/combo.type'
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
  const [pageSize] = useState(24) // Items per page
  const { addToCart } = useCart()
  const [activeTab, setActiveTab] = useState<'product' | 'combo'>('product')

  // Product state
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [productFilters, setProductFilters] = useState<{
    minPrice?: number
    maxPrice?: number
    provinceFilters?: string[]
  }>({})

  // Combo state
  const [combos, setCombos] = useState<Combo[]>([])
  const [combosLoading, setCombosLoading] = useState(false)
  const [combosError, setCombosError] = useState<string | null>(null)
  const [comboFilters, setComboFilters] = useState<ComboFilterRequest>({
    pageNumber: 1,
    pageSize: 24,
    isActiveFilter: true,
    statusFilters: ['Approved']
  })
  const [comboPagination, setComboPagination] = useState<{
    pageSize: number
    pageNumber: number
    totalItems: number
    totalPages?: number
  } | null>(null)

  // Handler để nhận filters từ AsideFilter - áp dụng filter cho tab hiện tại (product hoặc combo)
  const handleFilterChange = (filterState: {
    minPrice?: number
    maxPrice?: number
    provinceFilters?: string[]
  }) => {
    // Áp dụng filter cho tab hiện tại, không tự động chuyển tab
    if (activeTab === 'product') {
      // Apply filters for products
      setProductFilters({
        minPrice: filterState.minPrice,
        maxPrice: filterState.maxPrice,
        provinceFilters: filterState.provinceFilters
      })
      setCurrentPage(1) // Reset về trang đầu khi filter thay đổi
    } else if (activeTab === 'combo') {
      // Apply filters for combos
      setComboFilters((prev) => ({
        ...prev,
        minPrice: filterState.minPrice,
        maxPrice: filterState.maxPrice,
        provinceFilters: filterState.provinceFilters,
        pageNumber: 1 // Reset về trang đầu khi filter thay đổi
      }))
      setCurrentPage(1)
    }
  }

  // Fetch products using search API
  useEffect(() => {
    const fetchProducts = async () => {
      if (activeTab !== 'product') return

      try {
        setLoading(true)
        setError(null)

        // Calculate limit based on current page: page 1 = 10, page 2 = 20, page 3 = 30, etc.
        const limit = currentPage * pageSize

        const searchRequest: SearchRequest = {
          queryText: searchQuery.trim() || '', // Empty string for trending
          userId: user?.userId || null,
          limit: limit,
          sortBy: sortBy || null,
          minPrice: productFilters.minPrice || null,
          maxPrice: productFilters.maxPrice || null,
          provinceFilters: productFilters.provinceFilters || null
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
  }, [activeTab, searchQuery, sortBy, productFilters, currentPage, pageSize, user?.userId])

  // Fetch combos with filters
  useEffect(() => {
    const fetchCombos = async () => {
      if (activeTab !== 'combo') return
      try {
        setCombosLoading(true)
        setCombosError(null)

        // Prepare filter request
        const filterRequest: ComboFilterRequest = {
          ...comboFilters,
          pageNumber: currentPage,
          pageSize: 12,
          isActiveFilter: true,
          statusFilters: ['Approved']
        }

        // Add search and sort if provided
        if (searchQuery.trim()) {
          filterRequest.queryText = searchQuery.trim()
        }
        if (sortBy) {
          filterRequest.sortBy = sortBy
        }

        // Remove undefined and empty array values (but keep pageNumber and pageSize)
        Object.keys(filterRequest).forEach((key) => {
          if (key === 'pageNumber' || key === 'pageSize') return // Always keep pagination

          const value = filterRequest[key as keyof ComboFilterRequest]
          if (value === undefined || (Array.isArray(value) && value.length === 0)) {
            delete filterRequest[key as keyof ComboFilterRequest]
          }
        })

        const result = await filterCombos(filterRequest)
        setCombos(result.data)
        setComboPagination(result.pagination || null)
      } catch (err) {
        console.error('Error fetching combos:', err)
        const errorMessage = err instanceof Error ? err.message : 'Không thể tải combo.'
        setCombosError(errorMessage)
        setCombos([])
      } finally {
        setCombosLoading(false)
      }
    }
    fetchCombos()
  }, [activeTab, currentPage, comboFilters, searchQuery, sortBy])

  // Client-side pagination - slice products for current page
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return products.slice(start, end)
  }, [products, currentPage, pageSize])

  // Calculate total pages: if we got fewer results than requested, we're on the last page
  const totalPages = useMemo(() => {
    const limit = currentPage * pageSize
    if (products.length < limit) {
      // We got fewer results than requested, so this is the last page
      return currentPage
    }
    // If we got exactly the limit, there might be more pages
    // Estimate based on current results, add 1 more page if we got full results
    return Math.ceil(products.length / pageSize) + (products.length === limit ? 1 : 0)
  }, [products.length, currentPage, pageSize])

  const productCardData: ProductCardData[] = paginatedProducts.map((product) => {
    const productWithExtraFields = product as ProductCardData
    return {
      ...product,
      price: product.price,
      // Giữ lại province_name nếu có (từ API response)
      province_name: productWithExtraFields.province_name || undefined,
      // Giữ lại sale_count nếu có (từ API response)
      sale_count: productWithExtraFields.sale_count || undefined
    }
  })

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

    // Update combo filters if on combo tab
    if (activeTab === 'combo') {
      setComboFilters((prev) => ({
        ...prev,
        pageNumber: 1
      }))
    }
  }

  // Map API sortBy values to UI sort labels (reverse mapping)
  const sortLabelMap: Record<string, string> = {
    'newest': 'Mới nhất',
    'best-selling': 'Bán chạy',
    'price-asc': 'Giá thấp → cao',
    'price-desc': 'Giá cao → thấp'
  }

  // Get current selected sort label based on active tab
  const getSelectedSortLabel = () => {
    if (activeTab === 'combo') {
      return comboFilters.sortBy ? sortLabelMap[comboFilters.sortBy] || null : null
    } else {
      return sortBy ? sortLabelMap[sortBy] || null : null
    }
  }
  const selectedSortLabel = getSelectedSortLabel()

  const handleSortChange = (sort: string) => {
    // Map UI sort labels to API sortBy values
    const sortMap: Record<string, string> = {
      'Mới nhất': 'newest',
      'Bán chạy': 'best-selling',
      'Giá thấp → cao': 'price-asc',
      'Giá cao → thấp': 'price-desc'
    }
    const sortValue = sortMap[sort] || null
    setSortBy(sortValue)
    setCurrentPage(1) // Reset to first page on sort change

    // Update combo filters if on combo tab
    if (activeTab === 'combo') {
      setComboFilters((prev) => ({
        ...prev,
        sortBy: sortValue || undefined,
        pageNumber: 1
      }))
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleTabChange = (tab: 'product' | 'combo') => {
    setActiveTab(tab)
    setCurrentPage(1) // Reset to first page when switching tabs
    setSearchQuery('') // Reset search query when switching tabs
    // Reset sort when switching tabs
    setSortBy(null)
    if (tab === 'combo') {
      setComboFilters((prev) => ({
        ...prev,
        sortBy: undefined,
        pageNumber: 1
      }))
    }
  }

  return (
    <div>
      <div className='max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-6'>
        <div className='lg:w-64 flex-shrink-0'>
          <AsideFilter
            onFilterChange={handleFilterChange}
            initialFilters={
              activeTab === 'combo'
                ? {
                  minPrice: comboFilters.minPrice,
                  maxPrice: comboFilters.maxPrice,
                  provinceFilters: comboFilters.provinceFilters
                }
                : {
                  minPrice: productFilters.minPrice,
                  maxPrice: productFilters.maxPrice,
                  provinceFilters: productFilters.provinceFilters
                }
            }
          />
        </div>

        {/* Main content */}
        <div className='flex-1'>
          {/* Switch tabs */}
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2 bg-gray-50 p-1 rounded-full'>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeTab === 'product'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-white'
                  }`}
                onClick={() => handleTabChange('product')}
              >
                Sản phẩm
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeTab === 'combo'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-white'
                  }`}
                onClick={() => handleTabChange('combo')}
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
                  className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${selectedSortLabel === sort
                    ? 'bg-green-600 text-white border-green-600 font-semibold'
                    : 'bg-white hover:border-green-400'
                    }`}
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
                    setProductFilters({ ...productFilters })
                  } else {
                    // Trigger refetch for combo
                    setComboFilters({ ...comboFilters })
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
                <>
                  <ComboList
                    combos={combos}
                    loading={combosLoading}
                    error={combosError}
                    onAddToCart={handleAddCombo}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                  {comboPagination && (
                    <>
                      <Pagination
                        currentPage={currentPage}
                        totalPages={comboPagination.totalPages || Math.ceil(comboPagination.totalItems / comboPagination.pageSize)}
                        onPageChange={handlePageChange}
                        maxVisiblePages={5}
                      />

                    </>
                  )}
                </>
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
