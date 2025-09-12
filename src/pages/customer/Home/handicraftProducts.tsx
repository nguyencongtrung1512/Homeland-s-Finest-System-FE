import React, { useEffect, useState } from 'react'
import type { Product } from '../../../types/productType'
import ProductCard from '../Products/Product/productCard'


const HandicraftProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])

  // Giả lập call API
  useEffect(() => {
    async function fetchProducts() {
      // Gọi API backend thật ở đây
      // const res = await fetch("/api/products");
      // const data = await res.json();

      const data: Product[] = [
        {
          id: 1,
          name: 'Trà Shan Tuyết Cổ Thụ',
          price: 450000,
          image: 'https://th.bing.com/th/id/R.57068721a0c60a3621bcbc48f2e3318c?rik=kM4e5KdL74pvEg&pid=ImgRaw&r=0',
          location: 'Làng Suối Giàng, Yên Bái',
          rating: 5,
          ratingCount: 127,
          badge: { text: 'VietGAP', color: 'bg-green-600' }
        },
        {
          id: 2,
          name: 'Cà Phê Robusta Đặc Biệt',
          price: 320000,
          image: 'https://tse4.mm.bing.net/th/id/OIP.eyClux-tbPJODVkWttmwdQHaFA?rs=1&pid=ImgDetMain&o=7&rm=3',
          location: 'Nông trại Ea Kar, Đắk Lắk',
          rating: 4,
          ratingCount: 89,
          badge: { text: 'OCOP 4 sao', color: 'bg-yellow-500' }
        },
        {
          id: 3,
          name: 'Bộ Ấm Chén Gốm Bát Tràng',
          price: 1250000,
          image: 'https://cbu01.alicdn.com/img/ibank/2016/511/227/3707722115_220681559.jpg',
          location: 'Làng gốm Bát Tràng, Hà Nội',
          rating: 5,
          ratingCount: 156,
          badge: { text: 'Thủ công', color: 'bg-red-500' }
        },
        {
          id: 4,
          name: 'Nước Mắm Phú Quốc',
          price: 180000,
          image: 'https://tse3.mm.bing.net/th/id/OIP.P9LAOlp5UA-1KAmvcXdPFAHaFj?w=206&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
          location: 'Làng chài Hàm Ninh, Phú Quốc',
          rating: 4,
          ratingCount: 203,
          badge: { text: 'Truyền thống', color: 'bg-sky-500' }
        }
      ]

      setProducts(data)
    }
    fetchProducts()
  }, [])

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
