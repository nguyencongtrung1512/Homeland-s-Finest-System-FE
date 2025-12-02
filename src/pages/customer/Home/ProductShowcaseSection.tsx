import SectionHeader from './SectionHeader'
import ExpandableProductGrid from './ExpandableProductGrid'
import Loading from '../../../components/Loading/loading'
import type { ProductCardData } from '../Products/Product/productCard'

interface ProductShowcaseSectionProps {
  title: string
  subtitle?: string
  products: ProductCardData[]
  loading?: boolean
  error?: string | null
  viewAllLink?: string
  maxItems?: number
}

export default function ProductShowcaseSection({
  title,
  subtitle,
  products,
  loading = false,
  error = null,
  viewAllLink,
  maxItems = 4
}: ProductShowcaseSectionProps) {
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
        <SectionHeader title={title} subtitle={subtitle} viewAllLink={viewAllLink} />
        <div className='text-center py-16 text-gray-500'>Chưa có sản phẩm để hiển thị</div>
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto px-6 py-12'>
      <SectionHeader title={title} subtitle={subtitle} viewAllLink={viewAllLink} />
      <ExpandableProductGrid products={products} maxItems={maxItems} />
    </div>
  )
}

