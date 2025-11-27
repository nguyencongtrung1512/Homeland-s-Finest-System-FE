import { useEffect, useState } from 'react'
import ProductCard, { type ProductCardData } from '../Products/Product/productCard'
import { productApi } from '../../../apis/product.api'
import Loading from '../../../components/Loading/loading'
import type { Product } from '../../../types/productType'

const HandicraftProducts: React.FC = () => {
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        setError(null)
        const response = await productApi.getCategoryGroups()

        // Only get handicraftProducts
        const handicraftProducts: Product[] = response.data.handicraftProducts || []

        // Transform Product to ProductCardData
        const transformedProducts: ProductCardData[] = handicraftProducts.map((product) => ({
          ...product,
          price: product.price || product.summaryPrice || 0,
          badge: product.productCategories?.name
            ? {
              text: product.productCategories.name,
              color: 'bg-green-600'
            }
            : undefined
        }))

        setProducts(transformedProducts)
      } catch (err) {
        console.error('Error fetching handicraft products:', err)
        setError('Không thể tải sản phẩm thủ công')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) {
    return (
      <div className='max-w-7xl mx-auto px-6 py-12'>
        <div className='flex justify-center items-center py-16'>
          <Loading />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='max-w-7xl mx-auto px-6 py-12'>
        <div className='text-center py-16 text-red-600'>{error}</div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className='max-w-7xl mx-auto px-6 py-12'>
        <div className='text-center py-16 text-gray-500'>Chưa có sản phẩm thủ công</div>
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto px-6 py-12'>
      {/* Tiêu đề */}
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h2 className='text-2xl font-bold text-green-800'>Sản Phẩm Thủ Công</h2>
          <p className='text-gray-500 text-sm'>Được tuyển chọn từ những nghệ nhân tâm huyết</p>
        </div>
        <a href='/products' className='text-green-700 font-medium hover:underline'>
          Xem tất cả →
        </a>
      </div>

      {/* Grid sản phẩm */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}

export default HandicraftProducts
