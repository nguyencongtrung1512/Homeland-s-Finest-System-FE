import { useNavigate } from 'react-router-dom'
import type { Product } from '../../../../types/productType'
import path from '../../../../constants/path'

export interface ProductCardData extends Product {
  price: number // Giá từ Product
  badge?: { text: string; color: string } // Badge cho hiển thị huy hiệu
}

// Card hiển thị sản phẩm
const ProductCard: React.FC<{ product: ProductCardData; onClick?: () => void }> = ({ product, onClick }) => {
  const navigate = useNavigate()
  const defaultImage = 'https://toigingiuvedep.vn/wp-content/uploads/2023/03/anh-kha-banh-trai-tim-om-bo-hoa.jpg'

  const handleProductClick = () => {
    if (onClick) {
      onClick()
      return
    }
    navigate(path.productDetail.replace(':id', product.id))
  }

  return (
    <div
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition p-2 flex flex-col cursor-pointer ${
        product.soldOut ? 'opacity-75' : ''
      }`}
      onClick={handleProductClick}
    >
      {/* Ảnh */}
      <div className='relative h-40 w-full rounded-lg overflow-hidden'>
        <img
          src={product.productImages?.[0] || defaultImage}
          alt={product.name}
          className={`w-full h-full object-cover ${product.soldOut ? 'grayscale' : ''}`}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = defaultImage
          }}
        />
        {/* Badge hiển thị ở góc trên bên phải */}
        {product.badge && (
          <div
            className={`absolute top-2 right-2 ${product.badge.color} text-white px-2 py-1 rounded text-xs font-medium shadow-md z-10`}
          >
            {product.badge.text}
          </div>
        )}
        {product.soldOut && (
          <div className='absolute inset-0 bg-black/30 flex items-center justify-center'>
            <span className='bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg'>
              Hết hàng
            </span>
          </div>
        )}
      </div>

      {/* Nội dung */}
      <h3 className={`font-semibold text-lg mb-1 ${product.soldOut ? 'text-gray-500' : 'text-gray-800'}`}>
        {product.name}
      </h3>
      <p className='text-sm text-gray-500 mb-2'>{product.material}</p>

      {/* Giá + Rating */}
      <div className='flex items-center justify-between mt-auto'>
        <div className='flex items-center mb-2 text-yellow-500 text-sm'>
          {'★'.repeat(Math.floor(product.rating))}
          {'☆'.repeat(5 - Math.floor(product.rating))}
          <span className='ml-2 text-gray-400'>({product.reviewCount})</span>
        </div>
        <span className={`font-bold text-lg ${product.soldOut ? 'text-gray-400 line-through' : 'text-green-700'}`}>
          {product.price ? `${product.price.toLocaleString('vi-VN')}₫` : 'lỗi nhận giá'}
        </span>
      </div>
    </div>
  )
}

export default ProductCard
