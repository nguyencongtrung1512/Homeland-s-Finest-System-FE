import { useEffect, useState } from 'react'
import AsideFilter from './AsideFilter/asideFilter'
import ProductCard, { type ProductCardData } from './Product/productCard'
import Discover from './discover'

function Products() {
  const [products, setProducts] = useState<ProductCardData[]>([])

  useEffect(() => {
    setProducts([
      {
        id: '1',
        storeId: 'store-1',
        provinceId: 'province-1',
        name: 'Sữa Tươi Milk Organic',
        description: 'Sữa tươi organic từ nông trại TH True Milk, đảm bảo chất lượng và an toàn thực phẩm',
        productImages: ['https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?q=80&w=800&auto=format&fit=crop'],
        productVideo: '',
        categoryId: ['category-1'],
        madeBy: 'Nông trại TH True Milk, Hà Nội',
        saleCount: 1250,
        rating: 4.5,
        reviewCount: 456,
        isActive: true,
        typeProduct: 'Dairy',
        status: 'active',
        note: '',
        embedding: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        // Thêm fields cho ProductCard
        price: 25000,
        badge: { text: 'Organic', color: 'bg-green-600' }
      },
      {
        id: '2',
        storeId: 'store-2',
        provinceId: 'province-2',
        name: 'Hạt dinh dưỡng mix',
        description: 'Hỗn hợp hạt dinh dưỡng từ các loại hạt tự nhiên, giàu protein và vitamin',
        productImages: ['https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=800&auto=format&fit=crop'],
        productVideo: '',
        categoryId: ['category-2'],
        madeBy: 'Làng nghề Bình Phước',
        saleCount: 890,
        rating: 4.2,
        reviewCount: 112,
        isActive: true,
        typeProduct: 'Snack',
        status: 'active',
        note: '',
        embedding: [],
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-16T00:00:00Z',
        // Thêm fields cho ProductCard
        price: 85000,
        badge: { text: 'Tự nhiên', color: 'bg-yellow-500' }
      },
      {
        id: '3',
        storeId: 'store-3',
        provinceId: 'province-3',
        name: 'Nước dừa tươi',
        description: 'Nước dừa tươi nguyên chất từ vườn dừa Bến Tre, giải khát tự nhiên',
        productImages: ['https://images.unsplash.com/photo-1604908554027-432ea0b96227?q=80&w=800&auto=format&fit=crop'],
        productVideo: '',
        categoryId: ['category-3'],
        madeBy: 'Vườn dừa Bến Tre',
        saleCount: 2100,
        rating: 4.0,
        reviewCount: 89,
        isActive: true,
        typeProduct: 'Beverage',
        status: 'active',
        note: '',
        embedding: [],
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-17T00:00:00Z',
        // Thêm fields cho ProductCard
        price: 18000,
        badge: { text: 'Tươi ngon', color: 'bg-sky-500' }
      },
      {
        id: '4',
        storeId: 'store-4',
        provinceId: 'province-4',
        name: 'Socola đắng 70%',
        description: 'Socola đắng cao cấp với 70% cacao nguyên chất, không đường',
        productImages: ['https://images.unsplash.com/photo-1548907040-4a1b2e04e8f1?q=80&w=800&auto=format&fit=crop'],
        productVideo: '',
        categoryId: ['category-4'],
        madeBy: 'Xưởng sản xuất TP.HCM',
        saleCount: 650,
        rating: 4.8,
        reviewCount: 321,
        isActive: true,
        typeProduct: 'Confectionery',
        status: 'active',
        note: '',
        embedding: [],
        createdAt: '2024-01-04T00:00:00Z',
        updatedAt: '2024-01-18T00:00:00Z',
        // Thêm fields cho ProductCard
        price: 89000,
        badge: { text: 'Cao cấp', color: 'bg-purple-600' }
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
