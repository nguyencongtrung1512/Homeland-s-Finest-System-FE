import { type FC, useState } from 'react'
import { Star, ShoppingCart, Search, Grid, List } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { useCart } from '../../../../contexts/cart.context'
import { useActiveUserGuard } from '../../../../hooks/useActiveUserGuard'
import { useNavigate } from 'react-router-dom'

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  ratingCount: number
  badge?: {
    text: string
    color: string
  }
}

interface ProductsSectionProps {
  storeId: string
  products: Product[]
}

const ProductsSection: FC<ProductsSectionProps> = ({ products }) => {
  const { addToCart, cart } = useCart()
  const { isActiveUser } = useActiveUserGuard()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // TODO: Replace with actual API call
  // const { data: productsData, isLoading } = useQuery(['store-products', storeId], () => fetchStoreProducts(storeId))

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
  }

  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating
      case 'price-asc':
        return a.price - b.price
      case 'price-desc':
        return b.price - a.price
      default: // newest
        return 0
    }
  })

  return (
    <div className='space-y-6'>
      {/* Filter Bar */}
      <div className='bg-white rounded-lg p-4 shadow-sm'>
        <div className='flex flex-col lg:flex-row gap-4 items-center'>
          <div className='flex flex-wrap gap-2'>
            <Button size='sm' variant='outline' className='hover:bg-green-50 hover:text-green-600'>
              Combo
            </Button>
            <Button
              size='sm'
              variant={sortBy === 'newest' ? 'default' : 'outline'}
              onClick={() => setSortBy('newest')}
              className={sortBy === 'newest' ? 'bg-green-600 text-white' : ''}
            >
              Mới nhất
            </Button>
            <Button
              size='sm'
              variant={sortBy === 'rating' ? 'default' : 'outline'}
              onClick={() => setSortBy('rating')}
              className={sortBy === 'rating' ? 'bg-green-600 text-white' : ''}
            >
              Bán chạy
            </Button>
            <Button
              size='sm'
              variant={sortBy === 'price-asc' ? 'default' : 'outline'}
              onClick={() => setSortBy('price-asc')}
              className={sortBy === 'price-asc' ? 'bg-green-600 text-white' : ''}
            >
              Giá thấp → cao
            </Button>
            <Button
              size='sm'
              variant={sortBy === 'price-desc' ? 'default' : 'outline'}
              onClick={() => setSortBy('price-desc')}
              className={sortBy === 'price-desc' ? 'bg-green-600 text-white' : ''}
            >
              Giá cao → thấp
            </Button>
          </div>

          <div className='flex items-center gap-4 ml-auto'>
            {/* Search */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              <Input
                placeholder='Tìm kiếm sản phẩm...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 w-64'
              />
            </div>

            {/* View Mode */}
            <div className='flex border rounded-lg'>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setViewMode('grid')}
                className='rounded-r-none'
              >
                <Grid className='w-4 h-4' />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setViewMode('list')}
                className='rounded-l-none'
              >
                <List className='w-4 h-4' />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {sortedProducts.length > 0 ? (
        <div
          className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}
        >
          {sortedProducts.map((product) => (
            <div
              key={product.id}
              className='bg-white rounded-lg shadow-sm overflow-hidden border hover:shadow-md transition-shadow'
            >
              {/* Product Image */}
              <div className='relative'>
                <img src={product.image} alt={product.name} className='w-full h-48 object-cover' />
                {product.badge && (
                  <div
                    className={`absolute top-2 right-2 ${product.badge.color} text-white px-2 py-1 rounded text-xs font-medium`}
                  >
                    {product.badge.text}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className='p-4'>
                <h3 className='font-semibold text-gray-900 mb-2 line-clamp-2'>{product.name}</h3>

                {/* Price */}
                <div className='flex items-center gap-2 mb-2'>
                  <span className='text-lg font-bold text-green-600'>{formatPrice(product.price)}</span>
                </div>

                {/* Rating */}
                <div className='flex items-center gap-1 mb-3'>
                  <Star className='w-4 h-4 fill-yellow-400 text-yellow-400' />
                  <span className='text-sm text-gray-600'>{product.rating}</span>
                  <span className='text-sm text-gray-400'>({product.ratingCount})</span>
                </div>

                {/* Add to cart button */}
                <Button
                  className='w-full bg-green-600 hover:bg-green-700 text-white relative'
                  disabled={!isActiveUser}
                  onClick={() => {
                    if (!isActiveUser) return
                    addToCart(product.id, 1)
                    navigate('/cart')
                  }}
                >
                  <ShoppingCart className='w-4 h-4 mr-2' />
                  Thêm vào giỏ
                  {cart.filter((item) => item.id === product.id).reduce((sum, item) => sum + item.quantity, 0) > 0 && (
                    <span className='absolute top-1 right-2 bg-white text-green-600 border border-green-600 rounded-full text-xs px-2 py-0.5'>
                      {cart.filter((item) => item.id === product.id).reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='bg-white rounded-lg p-12 text-center shadow-sm'>
          <div className='w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4'>
            <ShoppingCart className='w-8 h-8 text-gray-400' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>Không tìm thấy sản phẩm</h3>
          <p className='text-gray-600'>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      )}
    </div>
  )
}

export default ProductsSection
