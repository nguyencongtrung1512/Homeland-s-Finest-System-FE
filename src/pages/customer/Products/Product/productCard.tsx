import { useNavigate } from 'react-router-dom'
import type { Product } from '../../../../types/productType'

// Interface mở rộng cho ProductCard để hiển thị thêm thông tin
export interface ProductCardData extends Product {
  price?: number // Giá từ ProductVariant
  badge?: { text: string; color: string } // Badge cho hiển thị huy hiệu
}

// Card hiển thị sản phẩm
const ProductCard: React.FC<{ product: ProductCardData }> = ({ product }) => {
  const navigate = useNavigate()

  const handleProductClick = () => {
    navigate(`/product/${product.id}`)
  }

  return (
    <div
      className='bg-white rounded-xl shadow-md hover:shadow-xl transition p-2 flex flex-col cursor-pointer'
      onClick={handleProductClick}
    >
      {/* Ảnh */}
      <div className='relative h-40 w-full rounded-lg overflow-hidden'>
        <img
          src={product.productImages[0] || '/placeholder-image.jpg'}
          alt={product.name}
          className='w-full h-full object-cover'
        />
        {product.badge && (
          <span className={`absolute top-2 left-2 px-2 py-1 text-xs text-white rounded ${product.badge.color}`}>
            {product.badge.text}
          </span>
        )}
      </div>

      {/* Nội dung */}
      <h3 className='font-semibold text-gray-800 text-lg mb-1'>{product.name}</h3>
      <p className='text-sm text-gray-500 mb-2'>{product.madeBy}</p>

      {/* Giá + Rating */}
      <div className='flex items-center justify-between mt-auto'>
        <div className='flex items-center mb-2 text-yellow-500 text-sm'>
          {'★'.repeat(Math.floor(product.rating))}
          {'☆'.repeat(5 - Math.floor(product.rating))}
          <span className='ml-2 text-gray-400'>({product.reviewCount})</span>
        </div>
        <span className='text-green-700 font-bold text-lg'>
          {product.price ? `${product.price.toLocaleString('vi-VN')}₫` : 'lỗi nhận giá'}
        </span>
      </div>
    </div>
  )
}

export default ProductCard
