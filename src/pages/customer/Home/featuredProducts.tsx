import { useEffect, useState } from 'react'
import ProductShowcaseSection from './ProductShowcaseSection'
import { productApi } from '../../../apis/product.api'
import type { ProductCardData } from '../Products/Product/productCard'
import type { Product } from '../../../types/productType'

function FeaturedProducts() {
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        setError(null)
        const response = await productApi.getCategoryGroups()

        // Combine foodProducts and handicraftProducts
        const allProducts: Product[] = [
          ...(response.data.foodProducts || []),
          ...(response.data.handicraftProducts || [])
        ]

        // Transform Product to ProductCardData
        const transformedProducts: ProductCardData[] = allProducts.map((product) => ({
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
        console.error('Error fetching featured products:', err)
        setError('Không thể tải sản phẩm nổi bật')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <ProductShowcaseSection
      title='Sản Phẩm Nổi Bật'
      subtitle='Được tuyển chọn từ những nghệ nhân tâm huyết'
      products={products}
      loading={loading}
      error={error}
      viewAllLink='/products'
      maxItems={4}
    />
  )
}

export default FeaturedProducts
