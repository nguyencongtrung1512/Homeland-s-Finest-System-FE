import { useNavigate } from 'react-router-dom'
import { TrendingUp, ShoppingBag, MapPin } from 'lucide-react'
import type { Product } from '../../../../types/productType'
import path from '../../../../constants/path'

export interface ProductCardData extends Product {
  price: number // Giá từ Product
  badge?: { text: string; color: string } // Badge cho hiển thị huy hiệu
  province_name?: string // Support snake_case format from API
  sale_count?: number // Support snake_case format from API
}

// Card hiển thị sản phẩm
const ProductCard: React.FC<{ product: ProductCardData; onClick?: () => void }> = ({ product, onClick }) => {
  const navigate = useNavigate()
  const defaultImage = 'https://tse1.mm.bing.net/th/id/OIP.SAKe7PaOdMq1jWY41hkCxAHaHa?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3'

  // Format số lượt bán
  const formatSaleCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  // Lấy số lượt bán - hỗ trợ cả camelCase và snake_case
  const getSaleCount = (): number => {
    const productData = product as ProductCardData
    return product.saleCount ?? productData.sale_count ?? 0
  }

  const saleCount = getSaleCount()
  const isHotProduct = saleCount >= 100 // Sản phẩm bán chạy nếu >= 100 lượt bán

  // Lấy province name - hỗ trợ cả camelCase và snake_case
  const getProvinceName = (): string | undefined => {
    const provinceName = product.provinceName || (product as ProductCardData).province_name
    // Return undefined nếu là empty string
    return provinceName && provinceName.trim() !== '' ? provinceName : undefined
  }

  const handleProductClick = () => {
    if (onClick) {
      onClick()
      return
    }
    // Nếu là Combo thì điều hướng đến combo detail, ngược lại điều hướng đến product detail
    if (product.typeProduct === 'Combo') {
      navigate(path.detailCombo.replace(':id', product.id))
    } else {
      navigate(path.productDetail.replace(':id', product.id))
    }
  }

  return (
    <div
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-3 flex flex-col cursor-pointer group ${product.soldOut ? 'opacity-75' : ''
        }`}
      onClick={handleProductClick}
    >
      {/* Ảnh */}
      <div className='relative h-40 w-full rounded-lg overflow-hidden mb-3 bg-gray-100'>
        <img
          src={product.productImages?.[0] || defaultImage}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${product.soldOut ? 'grayscale' : ''
            }`}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = defaultImage
          }}
        />
        {/* Badge hiển thị ở góc trên bên phải */}
        {product.badge && (
          <div
            className={`absolute top-2 right-2 ${product.badge.color} text-white px-2 py-1 rounded-md text-xs font-medium shadow-lg z-10`}
          >
            {product.badge.text}
          </div>
        )}
        {/* Badge "Bán chạy" nếu lượt bán cao */}
        {isHotProduct && !product.soldOut && (
          <div className='absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-lg z-10 flex items-center gap-1'>
            <TrendingUp className='w-3 h-3' />
            <span>Bán chạy</span>
          </div>
        )}
        {product.soldOut && (
          <div className='absolute inset-0 bg-black/40 flex items-center justify-center'>
            <span className='bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg'>
              Hết hàng
            </span>
          </div>
        )}
      </div>

      {/* Nội dung */}
      <div className='flex-1 flex flex-col'>
        <h3
          className={`font-semibold text-base mb-1 line-clamp-2 min-h-[2.5rem] ${product.soldOut ? 'text-gray-500' : 'text-gray-800 group-hover:text-green-700 transition-colors'
            }`}
        >
          {product.name}
        </h3>


        {/* Rating và Giá - cùng hàng */}
        <div className='flex items-center justify-between mb-2'>
          {/* Rating với sao như cũ */}
          {/* <div className='flex items-center text-yellow-500 text-sm'>
            {'★'.repeat(Math.floor(product.rating || 0))}
            {'☆'.repeat(5 - Math.floor(product.rating || 0))}
            {product.reviewCount && product.reviewCount > 0 && (
              <span className='ml-2 text-gray-400'>({product.reviewCount})</span>
            )}
          </div> */}
          <div className='flex items-center gap-1 mt-auto'>
            <ShoppingBag className='w-4 h-4 text-green-600' />
            <span className='text-sm font-medium text-gray-600'>{formatSaleCount(saleCount)}</span>
            <span className='text-xs text-gray-500'>đã bán</span>
          </div>
          {/* Giá ở góc phải */}
          <span className={`font-bold text-lg ${product.soldOut ? 'text-gray-400 line-through' : 'text-green-700'}`}>
            {product.price ? `${product.price.toLocaleString('vi-VN')}₫` : 'Liên hệ'}
          </span>
        </div>

        {/* Vị trí tỉnh/thành phố */}
        {getProvinceName() && (
          <div className='flex items-center mb-2'>
            <MapPin className='w-4 h-4 text-green-600 mr-1 mb-3' />
            <p className='text-xs text-green-600 font-medium'>{getProvinceName()}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductCard
