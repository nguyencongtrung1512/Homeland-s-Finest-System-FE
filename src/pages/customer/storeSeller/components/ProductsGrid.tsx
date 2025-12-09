import { memo } from 'react'
import ProductCard from '../../Products/Product/productCard'
import type { Product } from '../../../../types'
import { Star } from 'lucide-react'
import { ProductsGridSkeleton } from '../../../../components/ui/product-skeleton'

interface ProductsGridProps {
  products: Product[]
  loading: boolean
  error: string | null
  onRetry?: () => void
  selectedCategory?: string
  selectedHashtagIds?: string[]
  searchQuery?: string
}

function ProductsGrid({
  products,
  loading,
  error,
  onRetry,
  selectedCategory,
  selectedHashtagIds = [],
  searchQuery = ''
}: ProductsGridProps) {
  // Loading state - hiển thị skeleton
  if (loading) {
    return <ProductsGridSkeleton count={8} />
  }

  // Error state
  if (error) {
    return (
      <div className='bg-white rounded-lg p-12 text-center shadow-sm'>
        <div className='text-red-500 mb-4'>
          <svg
            className='w-12 h-12 mx-auto'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        </div>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>Không thể tải sản phẩm</h3>
        <p className='text-gray-600 mb-4'>{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
          >
            Thử lại
          </button>
        )}
      </div>
    )
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className='bg-white rounded-lg p-12 text-center shadow-sm'>
        <div className='text-gray-400 mb-4'>
          <Star className='w-12 h-12 mx-auto' />
        </div>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>Chưa có sản phẩm</h3>
        <p className='text-gray-600'>
          {selectedCategory || selectedHashtagIds.length > 0 || searchQuery
            ? 'Không tìm thấy sản phẩm phù hợp với bộ lọc đã chọn.'
            : 'Cửa hàng này chưa có sản phẩm nào.'}
        </p>
      </div>
    )
  }

  // Products grid
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

// Memoize để tránh re-render không cần thiết
export default memo(ProductsGrid)

