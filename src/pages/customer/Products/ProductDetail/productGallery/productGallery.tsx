import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../../../../contexts/cart.context'
import { useAuth } from '../../../../../contexts/auth.context'
import { useProductDetailContext } from '../productsDetail'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../../../components/ui/dialog'
import { Button } from '../../../../../components/ui/button'

function ProductGallery() {
  const { product } = useProductDetailContext()
  const navigate = useNavigate()
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()

  if (!product) {
    return null
  }

  const currentVariant = product.variants?.[selectedVariant]
  const currentPrice = currentVariant?.price || 0
  const currentStock = currentVariant?.availableQuantity || 0

  const handleAddToCart = async () => {
    if (!currentVariant) {
      return
    }

    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    try {
      setIsAddingToCart(true)
      await addToCart(currentVariant.id, quantity)
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    if (!currentVariant) {
      return
    }

    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    try {
      setIsAddingToCart(true)
      await addToCart(currentVariant.id, quantity)
      // Sau khi thêm vào giỏ hàng thành công, chuyển đến trang Cart
      navigate('/cart')
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= currentStock) {
      setQuantity(newQuantity)
    }
  }

  return (
    <>
      <div className='bg-white'>
        <div className='max-w-7xl mx-auto px-6 py-8'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
            {/* Image Gallery */}
            <div className='space-y-4'>
              {/* Main Image */}
              <div className='aspect-square bg-gray-100 rounded-lg overflow-hidden'>
                <img
                  src={product.productImages[selectedImage] || '/images/placeholder.jpg'}
                  alt={product.name}
                  className='w-full h-full object-cover'
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'https://via.placeholder.com/600x600?text=No+Image'
                  }}
                />
              </div>

              {/* Thumbnail Images */}
              {product.productImages.length > 1 && (
                <div className='grid grid-cols-6 gap-2'>
                  {product.productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === index ? 'border-green-500' : 'border-transparent hover:border-gray-300'
                        }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className='w-full h-full object-cover'
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'https://via.placeholder.com/100x100?text=No+Image'
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className='space-y-6'>
              {/* Product Title and Rating */}
              <div>
                <h1 className='text-3xl font-bold text-gray-900 mb-4'>{product.name}</h1>

                <div className='flex items-center gap-4 mb-4'>
                  <div className='flex items-center gap-1'>
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                      </svg>
                    ))}
                    <span className='text-gray-600 ml-2'>
                      {product.rating.toFixed(1)} ({product.reviewCount} đánh giá)
                    </span>
                  </div>

                  <span className='text-gray-500'>|</span>
                  <span className='text-gray-600'>{product.saleCount} đã bán</span>
                </div>

                {/* Status */}
                <div className='flex items-center gap-2 mb-4'>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {product.isActive ? 'Còn hàng' : 'Hết hàng'}
                  </span>
                  <span className='text-gray-500'>•</span>
                  <span className='text-gray-600'>{product.material}</span>
                </div>
              </div>

              {/* Price */}
              <div className='border-t border-b border-gray-200 py-6'>
                <div className='text-3xl font-bold text-red-600 mb-2'>
                  {currentPrice.toLocaleString('vi-VN')}₫
                </div>
                {currentVariant?.basePrice && currentVariant.basePrice > currentPrice && (
                  <div className='text-lg text-gray-500 line-through'>
                    {currentVariant.basePrice.toLocaleString('vi-VN')}₫
                  </div>
                )}
              </div>

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div>
                  <h3 className='text-lg font-semibold mb-3'>Phân loại:</h3>
                  <div className='grid grid-cols-2 gap-3'>
                    {product.variants.map((variant, index) => (
                      <button
                        key={variant.id}
                        onClick={() => {
                          setSelectedVariant(index)
                          setQuantity(1)
                        }}
                        disabled={!variant.isActive || variant.availableQuantity === 0}
                        className={`p-3 border rounded-lg text-left transition-colors ${selectedVariant === index
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 hover:border-gray-400'
                          } ${!variant.isActive || variant.availableQuantity === 0
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                          }`}
                      >
                        <div className='font-medium'>{variant.variantName}</div>
                        <div className='text-sm text-gray-600'>
                          {variant.price.toLocaleString('vi-VN')}₫
                        </div>
                        <div className='text-xs text-gray-500'>
                          Còn {variant.availableQuantity} sản phẩm
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <h3 className='text-lg font-semibold mb-3'>Số lượng:</h3>
                <div className='flex items-center gap-4'>
                  <div className='flex items-center border border-gray-300 rounded-lg'>
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className='px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      -
                    </button>
                    <span className='px-4 py-2 border-l border-r border-gray-300'>{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= currentStock}
                      className='px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      +
                    </button>
                  </div>
                  <span className='text-gray-600'>
                    {currentStock} sản phẩm có sẵn
                  </span>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className='space-y-4 '>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={handleAddToCart}
                    disabled={!product.isActive || currentStock === 0 || !currentVariant || isAddingToCart}
                    className='w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
                  >
                    {isAddingToCart ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                        Đang thêm...
                      </>
                    ) : (
                      <>
                        {!product.isActive || currentStock === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={!product.isActive || currentStock === 0 || !currentVariant}
                    className='w-full border border-green-600 text-green-600 py-3 px-6 rounded-lg font-semibold hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  >
                    {!product.isActive || currentStock === 0 ? 'Hết hàng' : 'Mua ngay'}
                  </button>
                </div>

              </div>

              {/* Product Description */}
              <div className='border-t border-gray-200 pt-6'>
                <h3 className='text-lg font-semibold mb-3'>Mô tả sản phẩm:</h3>
                <p className='text-gray-700 leading-relaxed'>{product.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đăng nhập để tiếp tục</DialogTitle>
            <DialogDescription>
              Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoginModal(false)}>
              Hủy
            </Button>
            <Button variant='green' onClick={() => navigate('/login')}>
              Đăng nhập
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ProductGallery
