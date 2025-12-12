import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Eye } from 'lucide-react'
import type { ProductCardData } from '../Products/Product/productCard'
import path from '../../../constants/path'

interface ExpandableProductCardProps {
  product: ProductCardData
  onClick?: () => void
}

export default function ExpandableProductCard({ product, onClick }: ExpandableProductCardProps) {
  const navigate = useNavigate()
  const defaultImage = 'https://afamilycdn.com/150157425591193600/2021/3/1/hai-san-kho-1614570286027617117145-30-0-655-1000-crop-16145702916331421560673.jpg'

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }
    navigate(path.productDetail.replace(':id', product.id))
  }

  const formattedPrice = product.price ? `${product.price.toLocaleString('vi-VN')}₫` : 'N/A'

  return (
    <div
      className={`group relative h-[280px] md:h-[320px] w-full rounded-2xl overflow-hidden cursor-pointer ${product.soldOut ? 'opacity-75' : ''
        }`}
      onClick={handleClick}
    >
      {/* Background Image */}
      <div className='absolute inset-0'>
        <img
          src={product.productImages?.[0] || defaultImage}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110 ${product.soldOut ? 'grayscale' : ''
            }`}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = defaultImage
          }}
        />
        {/* Overlay gradient for better text readability */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent' />
        {product.soldOut && (
          <div className='absolute inset-0 bg-black/40 flex items-center justify-center'>
            <span className='bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg'>
              Hết hàng
            </span>
          </div>
        )}
      </div>

      {/* Glass-morphism Overlay */}
      <div className='absolute bottom-0 left-0 right-0 bg-white/40 backdrop-blur-md p-3 md:p-4 transition-all duration-500 ease-in-out'>
        {/* Product Name - Always visible */}
        <h3 className='font-semibold text-gray-900 text-base md:text-lg mb-1.5 line-clamp-2'>{product.name}</h3>

        {/* Price and View Button - Visible on hover/expanded (desktop) or always (mobile) */}
        <div className='opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 delay-100'>
          <div className='flex items-center justify-between mt-2'>
            <span className='text-green-700 font-bold text-lg md:text-xl'>
              {formattedPrice}
            </span>
            <Button
              variant='outline'
              size='sm'
              className='rounded-full border-green-600 text-green-700 hover:bg-green-50 bg-white/80 backdrop-blur-sm'
              onClick={(e) => {
                e.stopPropagation()
                handleClick()
              }}
            >
              <Eye className='h-4 w-4 mr-1' />
              Xem
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

