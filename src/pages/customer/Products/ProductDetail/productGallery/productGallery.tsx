import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCart } from '../../../../../contexts/cart.context'
import type { Product } from '../../../../../types/productType'

interface ProductDetail extends Product {
  originalPrice?: number
  soldCount?: number
  stockCount?: number
  weightOptions?: { value: string; price: number }[]
}

function ProductGallery() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedWeight, setSelectedWeight] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()

  useEffect(() => {
    // Mock data theo ảnh mẫu mật ong
    const mockProducts: ProductDetail[] = [
      {
        id: '1',
        storeId: 'store-1',
        provinceId: 'province-1',
        name: 'Mật Ong Rừng Nguyên Chất U Minh Hạ',
        description:
          'Mật ong rừng nguyên chất từ rừng U Minh Hạ, Cà Mau. Sản phẩm tự nhiên, không pha trộn, đảm bảo chất lượng cao.',
        productImages: [
          'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=800&auto=format&fit=crop'
        ],
        productVideo: '',
        categoryId: ['cat-1'],
        madeBy: 'U Minh Hạ, Cà Mau',
        saleCount: 1000,
        rating: 4.9,
        reviewCount: 47,
        isActive: true,
        typeProduct: 'Food',
        status: 'active',
        note: 'Sản phẩm tự nhiên từ rừng U Minh Hạ',
        embedding: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        // Thêm fields cho ProductDetail
        soldCount: 3216,
        stockCount: 49,
        weightOptions: [
          { value: '800g', price: 289000 },
          { value: '500g', price: 189000 }
        ]
      },
      {
        id: '2',
        storeId: 'store-2',
        provinceId: 'province-2',
        name: 'Sữa Tươi Milk Organic',
        description: 'Sữa tươi organic từ nông trại TH True Milk, Hà Nội. Đảm bảo chất lượng và an toàn thực phẩm cao nhất.',
        productImages: ['https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?q=80&w=800&auto=format&fit=crop'],
        productVideo: '',
        categoryId: ['cat-2'],
        madeBy: 'TH True Milk, Hà Nội',
        saleCount: 1200,
        rating: 4.5,
        reviewCount: 456,
        isActive: true,
        typeProduct: 'Dairy',
        status: 'active',
        note: 'Sản phẩm organic chất lượng cao',
        embedding: [],
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-16T00:00:00Z',
        // Thêm fields cho ProductDetail
        soldCount: 1200,
        stockCount: 100,
        weightOptions: [
          { value: '1L', price: 28000 },
          { value: '500ml', price: 15000 }
        ]
      }
    ]

    const foundProduct = mockProducts.find((p) => p.id === id)
    if (foundProduct) {
      setProduct(foundProduct)
    } else {
      // Redirect về trang sản phẩm nếu không tìm thấy
      navigate('/products')
    }
  }, [id, navigate])

  if (!product) {
    return (
      <div className='max-w-7xl mx-auto px-6 py-8'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    )
  }

  const currentPrice = product.weightOptions?.[selectedWeight]?.price || 0

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: currentPrice,
      image: product.productImages[0],
      quantity,
      weight: product.weightOptions?.[selectedWeight]?.value
    })
    // Không chuyển trang, chỉ cập nhật badge trên Header
  }

  const handleBuyNow = () => {
    // Không thêm vào giỏ, chỉ chuyển sang trang xác nhận đơn hàng
    navigate('/cart/confirm')
  }

  return (
    <div className='max-w-7xl mx-auto px-6 py-8'>
      {/* Breadcrumb */}
      <nav className='mb-6'>
        <ol className='flex items-center space-x-2 text-sm text-gray-500'>
          <li>
            <button onClick={() => navigate('/products')} className='hover:text-green-600'>
              Sản phẩm
            </button>
          </li>
          <li>/</li>
          <li className='text-gray-900'>{product.name}</li>
        </ol>
      </nav>

      {/* Product Detail */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Product Image Gallery */}
        <div className='space-y-4'>
          {/* Main Image */}
          <div className='max-w-[600px] aspect-square rounded-xl overflow-hidden bg-gray-100'>
            <img
              src={product.productImages?.[selectedImage] ?? product.productImages[0]}
              alt={product.name}
              className='w-full h-full object-cover'
            />
          </div>

          {/* Thumbnail Images with Navigation */}
          {product.productImages && product.productImages.length > 1 && (
            <div className='space-y-2 flex flex-col items-center'>
              <div className='flex items-center justify-center gap-2'>
                {/* Previous Button */}
                <button
                  onClick={() =>
                    setSelectedImage(selectedImage > 0 ? selectedImage - 1 : (product.productImages?.length || 1) - 1)
                  }
                  className='w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors'
                  disabled={(product.productImages?.length || 0) <= 1}
                >
                  <svg className='w-4 h-4 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                  </svg>
                </button>

                {/* Thumbnail Grid */}
                <div className='grid grid-cols-4 gap-2 flex-1'>
                  {product.productImages.slice(0, 4).map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors 
              ${selectedImage === index ? 'border-green-500' : 'border-gray-200'}`}
                    >
                      <img src={img} alt={`${product.name} ${index + 1}`} className='w-full h-full object-cover' />
                    </button>
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={() =>
                    setSelectedImage(selectedImage < (product.productImages?.length || 1) - 1 ? selectedImage + 1 : 0)
                  }
                  className='w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors'
                  disabled={(product.productImages?.length || 0) <= 1}
                >
                  <svg className='w-4 h-4 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                  </svg>
                </button>
              </div>

              {/* Image Counter */}
              <div className='text-center text-sm text-gray-500'>
                {selectedImage + 1} / {product.productImages?.length || 1}
              </div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className='space-y-6 ml-5'>
          {/* Product Name */}
          <div>
            <h2 className='text-4xl font-bold text-gray-900 '>{product.name}</h2>
          </div>

          {/* Rating & Reviews */}
          <div className='flex items-center space-x-2'>
            <div className='flex text-yellow-500 text-lg'>
              {'★'.repeat(Math.floor(product.rating))}
              {product.rating % 1 !== 0 && '★'}
              {'☆'.repeat(5 - Math.ceil(product.rating))}
            </div>
            <span className='text-gray-600 font-medium'>{product.rating}</span>
            <span className='text-gray-500'>({product.reviewCount} đánh giá)</span>
            <span className='text-gray-500'>•</span>
            <span className='text-gray-500'>{product.soldCount?.toLocaleString('vi-VN')} đã bán</span>
          </div>

          {/* Price */}
          <div className='flex items-center space-x-3'>
            <div className='text-3xl font-bold text-green-600'>
              {currentPrice > 0 ? `${currentPrice.toLocaleString('vi-VN')}₫` : 'Liên hệ để biết giá'}
            </div>
          </div>
          {/* Weight Options */}
          {product.weightOptions && (
            <div>
              <h3 className='text-lg font-semibold mb-3'>Khối lượng</h3>
              <div className='flex space-x-3'>
                {product.weightOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedWeight(index)}
                    className={`px-4 py-2 border-2 rounded-lg font-medium transition-colors ${selectedWeight === index
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                      }`}
                  >
                    {option.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Info */}
          {product.stockCount && (
            <div className='text-sm text-gray-600'>Số lượng sản phẩm: {product.stockCount} sản phẩm</div>
          )}

          {/* Quantity & Actions */}
          <div className='space-y-4'>
            {/* Quantity Selector */}
            <div>
              <h3 className='text-lg font-semibold mb-3'>Số lượng</h3>
              <div className='flex items-center space-x-3'>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className='w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50'
                >
                  -
                </button>
                <input
                  type='number'
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className='w-16 h-10 border border-gray-300 rounded-lg text-center'
                  min='1'
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className='w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50'
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex space-x-3'>
              <button
                className='flex-1 border-2 border-green-500 text-green-600 py-3 px-6 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center justify-center space-x-2 relative'
                onClick={handleAddToCart}
              >
                <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z' />
                </svg>
                <span>Thêm vào giỏ</span>
              </button>
              <button
                className='flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors'
                onClick={handleBuyNow}
              >
                Mua ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductGallery
