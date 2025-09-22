import { useState } from 'react'
import AsideFilter from './AsideFilter/asideFilter'
import ProductCard, { type ProductCardData } from './Product/productCard'
import Discover from './discover'
import { useProducts } from '../../../hooks/useProducts'
import Pagination from '../../../components/Pagination/Pagination'
import Loading from '../../../components/Loading/loading'

function Products() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(0) // Backend expect zero-based page
  // const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt' | 'saleCount' | 'rating'>('createdAt')
  // const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Call API giống hệt Swagger UI
  const { products, loading, error, pagination, refetch } = useProducts({
    pageNumber: currentPage + 1, // Swagger UI dùng pageNumber (1-based)
    pageSize: 10 // Hiển thị 10 sản phẩm mỗi trang
    // Không gửi search và isActive để tránh lỗi
  })

  // Convert Product[] to ProductCardData[]
  const productCardData: ProductCardData[] = products.map((product) => ({
    ...product,
    // Thêm các fields cần thiết cho ProductCard
    // price: Math.floor(Math.random() * 100000) + 20000, // Mock price, sẽ được thay thế bằng API thực tế
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
    // Tạm thời disable search để test API cơ bản
    console.log('Search disabled for testing basic API call')
    refetch()
  }

  const handleSortChange = (sort: string) => {
    // Tạm thời disable sort để test API cơ bản
    console.log('Sort disabled for testing basic API call:', sort)
    refetch()
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page - 1) // Convert 1-based UI to 0-based API
    // Không cần gọi refetch vì useProducts sẽ tự động refetch khi currentPage thay đổi
  }

  return (
    <div>
      <div className='max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-6'>
        <div className='lg:w-64 flex-shrink-0'>
          <AsideFilter />
        </div>

        {/* Main content */}
        <div className='flex-1'>
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

            {/* Search box */}
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
          {loading && (
            <div className='py-12'>
              <Loading size='lg' text='Đang tải sản phẩm...' />
            </div>
          )}

          {/* Error state */}
          {error && (
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
              <p className='text-gray-600 mb-4'>{error}</p>
              <button
                onClick={() => refetch()}
                className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Products grid */}
          {!loading && !error && (
            <>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                {productCardData.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Empty state */}
              {productCardData.length === 0 && (
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

              {/* Pagination */}
              <Pagination
                currentPage={currentPage + 1}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                maxVisiblePages={5}
              />

              {/* Results info */}
              <div className='text-center text-sm text-gray-600 mt-4'>
                Hiển thị {productCardData.length} trong tổng số {pagination.totalItems} sản phẩm
              </div>
            </>
          )}
        </div>
      </div>

      <div>
        <Discover />
      </div>
    </div>
  )
}

export default Products
