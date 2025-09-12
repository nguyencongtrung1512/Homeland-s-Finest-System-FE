import React, { useEffect, useState } from 'react'
import AsideFilter from './AsideFilter/asideFilter'
import type { Product } from '../../../types/productType'
import ProductCard from './Product/productCard'
import Discover from './discover'
function Products() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    setProducts([
      {
        id: '1',
        name: 'Sữa Tươi Milk Organic',
        price: 28000,
        image: 'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?q=80&w=800&auto=format&fit=crop',
        location: 'Nông trại TH True Milk, Hà Nội',
        rating: 5,
        reviewCount: 456
      },
      {
        id: '2'     ,
        name: 'Hạt dinh dưỡng mix',
        price: 165000,
        image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=800&auto=format&fit=crop',
        description: 'Làng nghề Bình Phước',
        rating: 4,
        reviewCount: 112
      },
      {
        id: '3',
        name: 'Nước dừa tươi',
        price: 18000,
        image: 'https://images.unsplash.com/photo-1604908554027-432ea0b96227?q=80&w=800&auto=format&fit=crop',
        description: 'Vườn dừa Bến Tre',
        rating: 4,
        reviewCount: 89
      },
      {
        id: '4',
        name: 'Socola đắng 70%',
        price: 89000,
        image: 'https://images.unsplash.com/photo-1548907040-4a1b2e04e8f1?q=80&w=800&auto=format&fit=crop',
        description: 'Xưởng sản xuất TP.HCM',
        rating: 5,
        reviewCount: 321
      }
    ])
  }, [])

  return (
    <div>
      <div className='max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-6'>
        <div className='lg:w-64 flex-shrink-0'>
          <AsideFilter />
        </div>
        {/* Tabs filter top (mock) */}
        <div className='flex-1'>
          <div className='flex justify-between'>
            <div className='mb-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap'>
              {['Mới nhất', 'Bán chạy', 'Giá thấp → cao', 'Giá cao → thấp'].map((t) => (
                <button key={t} className='px-3 py-1.5 rounded-full border text-sm bg-white hover:border-green-400'>
                  {t}
                </button>
              ))}
              {/* Search box */}
              <div className='flex w-full max-w-[420px] items-center justify-self-center rounded-full border border-[#D5E4CF] bg-white px-3 py-1.5 shadow-sm'>
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
                />
              </div>
            </div>
          </div>

          {/* Product grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
      <div>
        <Discover />
      </div>
    </div>
  )
}

export default Products
