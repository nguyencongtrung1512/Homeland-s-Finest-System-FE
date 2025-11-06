import { useEffect, useState } from 'react'
import ProductCard, { type ProductCardData } from '../Products/Product/productCard'

function FeaturedProducts() {
  const [products, setProducts] = useState<ProductCardData[]>([])

  useEffect(() => {
    async function fetchProducts() {
      const data: ProductCardData[] = [
        {
          id: '1',
          storeId: 'store-1',
          storeName: 'Cửa hàng Nông sản Yên Bái',
          provinceId: 1,
          editedById: 'user-1',
          summaryPrice: '450.000₫',
          name: 'Trà Shan Tuyết Cổ Thụ',
          description:
            'Trà Shan Tuyết cổ thụ được hái từ những cây trà cổ thụ hàng trăm năm tuổi tại vùng núi cao Yên Bái, mang hương vị đặc trưng và tinh tế.',
          productImages: [
            'https://th.bing.com/th/id/R.57068721a0c60a3621bcbc48f2e3318c?rik=kM4e5KdL74pvEg&pid=ImgRaw&r=0'
          ],
          productVideo: '',
          material: 'Nông sản Yên Bái',
          saleCount: 89,
          rating: 5,
          reviewCount: 127,
          isActive: true,
          typeProduct: 'Beverage',
          status: 'active',
          staffNote: '',
          variantGroups: [],
          productCategories: {
            id: 'cat-1',
            name: 'Đồ uống',
            description: 'Các sản phẩm đồ uống truyền thống',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          productCertificateDTOs: [],
          // Thêm fields cho ProductCard
          price: 450000,
          badge: { text: 'VietGAP', color: 'bg-green-600' }
        },
        {
          id: '2',
          storeId: 'store-2',
          storeName: 'Cửa hàng Cà phê Tây Nguyên',
          provinceId: 2,
          editedById: 'user-1',
          summaryPrice: '320.000₫',
          name: 'Cà Phê Robusta Đặc Biệt',
          description:
            'Cà phê Robusta được trồng và chế biến theo phương pháp truyền thống tại nông trại Ea Kar, Đắk Lắk với hương vị đậm đà đặc trưng.',
          productImages: ['https://tse4.mm.bing.net/th/id/OIP.eyClux-tbPJODVkWttmwdQHaFA?rs=1&pid=ImgDetMain&o=7&rm=3'],
          productVideo: '',
          material: 'Cà phê Tây Nguyên',
          saleCount: 67,
          rating: 4,
          reviewCount: 89,
          isActive: true,
          typeProduct: 'Beverage',
          status: 'active',
          staffNote: '',
          variantGroups: [],
          productCategories: {
            id: 'cat-1',
            name: 'Đồ uống',
            description: 'Các sản phẩm đồ uống truyền thống',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          productCertificateDTOs: [],
          // Thêm fields cho ProductCard
          price: 320000,
          badge: { text: 'OCOP 4 sao', color: 'bg-yellow-500' }
        },
        {
          id: '3',
          storeId: 'store-3',
          storeName: 'Cửa hàng Gốm Bát Tràng',
          provinceId: 3,
          editedById: 'user-1',
          summaryPrice: '1.250.000₫',
          name: 'Bộ Ấm Chén Gốm Bát Tràng',
          description:
            'Bộ ấm chén gốm Bát Tràng được làm thủ công bởi các nghệ nhân lành nghề, mang đậm nét văn hóa truyền thống Việt Nam.',
          productImages: ['https://cbu01.alicdn.com/img/ibank/2016/511/227/3707722115_220681559.jpg'],
          productVideo: '',
          material: 'Gốm Bát Tràng',
          saleCount: 45,
          rating: 5,
          reviewCount: 156,
          isActive: true,
          typeProduct: 'Handicraft',
          status: 'active',
          staffNote: '',
          variantGroups: [],
          productCategories: {
            id: 'cat-3',
            name: 'Thủ công mỹ nghệ',
            description: 'Các sản phẩm thủ công truyền thống',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          productCertificateDTOs: [],
          // Thêm fields cho ProductCard
          price: 1250000,
          badge: { text: 'Thủ công', color: 'bg-red-500' }
        },
        {
          id: '4',
          storeId: 'store-4',
          storeName: 'Cửa hàng Đặc sản Phú Quốc',
          provinceId: 4,
          editedById: 'user-1',
          summaryPrice: '180.000₫',
          name: 'Nước Mắm Phú Quốc',
          description:
            'Nước mắm Phú Quốc được ủ chín từ cá cơm tươi ngon theo công thức truyền thống, mang hương vị đậm đà đặc trưng của biển.',
          productImages: [
            'https://tse3.mm.bing.net/th/id/OIP.P9LAOlp5UA-1KAmvcXdPFAHaFj?w=206&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3'
          ],
          productVideo: '',
          material: 'Mắm Phú Quốc',
          saleCount: 123,
          rating: 4,
          reviewCount: 203,
          isActive: true,
          typeProduct: 'Food',
          status: 'active',
          staffNote: '',
          variantGroups: [],
          productCategories: {
            id: 'cat-4',
            name: 'Thực phẩm',
            description: 'Các sản phẩm thực phẩm truyền thống',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          productCertificateDTOs: [],
          // Thêm fields cho ProductCard
          price: 180000,
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
          <h2 className='text-2xl font-bold text-green-800'>Sản Phẩm Nổi Bật</h2>
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

export default FeaturedProducts
