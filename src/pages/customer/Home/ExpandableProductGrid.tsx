import { useState } from 'react'
import ExpandableProductCard from './ExpandableProductCard'
import type { ProductCardData } from '../Products/Product/productCard'

interface ExpandableProductGridProps {
  products: ProductCardData[]
  maxItems?: number
}

export default function ExpandableProductGrid({ products, maxItems = 4 }: ExpandableProductGridProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const displayProducts = products.slice(0, maxItems)

  if (displayProducts.length === 0) {
    return (
      <div className='text-center py-12 text-gray-500'>Chưa có sản phẩm để hiển thị</div>
    )
  }

  return (
    <div className='w-full'>
      {/* Desktop: Horizontal Flex Row with Expandable Effect */}
      <div className='hidden lg:flex w-full gap-4 overflow-hidden'>
        {displayProducts.map((product, index) => (
          <div
            key={product.id}
            className={`flex-shrink-0 transition-[flex-grow,width] duration-500 ease-in-out ${
              hoveredIndex === index ? 'flex-[3]' : 'flex-1'
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <ExpandableProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Tablet: Horizontal but with reduced effect */}
      <div className='hidden md:flex lg:hidden w-full gap-4 overflow-hidden'>
        {displayProducts.map((product, index) => (
          <div
            key={product.id}
            className={`flex-shrink-0 transition-[flex-grow,width] duration-500 ease-in-out ${
              hoveredIndex === index ? 'flex-[2]' : 'flex-1'
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <ExpandableProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Mobile: Vertical Grid */}
      <div className='grid grid-cols-1 md:hidden gap-4'>
        {displayProducts.map((product) => (
          <div key={product.id} className='w-full'>
            <ExpandableProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  )
}

