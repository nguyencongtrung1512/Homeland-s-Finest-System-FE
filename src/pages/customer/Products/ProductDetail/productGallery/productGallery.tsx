import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCart } from '../../../../../contexts/cart.context'
import { useAuth } from '../../../../../contexts/auth.context'
import { useProductDetailContext } from '../productsDetail'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../../../components/ui/dialog'
import { Button } from '../../../../../components/ui/button'
import { useProductDetail } from '../../../../../hooks/useProductDetail'

// ✅ Type definitions
interface VariantOption {
  id: string
  name: string
  description: string | null
  productImages: string[] | null
  basePrice: number
  finalPrice: number
  weight: number
  length: number
  width: number
  height: number
  quantity: number
  saleCount: number | null
  rating: number | null
  reviewCount: number | null
  isActive: boolean | null
  childVariantGroups: VariantGroup[] | null
}

interface VariantGroup {
  attributeType: string
  options: VariantOption[]
}

interface Product {
  id: string
  storeId: string
  storeName: string
  provinceId: number | null
  name: string
  description: string | null
  productImages: string[] | null
  productVideo: string | null
  material: string | null
  saleCount: number | null
  rating: number
  reviewCount: number | null
  isActive: boolean
  typeProduct: string | null
  status: string | null
  variantGroups: VariantGroup[]
  productCategories: any
  productCertificateDTOs: any[]
}

// ✅ Selection state type: { groupAttributeType: optionId }
type VariantSelection = Record<string, string>

function ProductGallery() {
  const { id } = useParams<{ id: string }>()
  const { product } = useProductDetail(id)
  console.log('product', product)
  const navigate = useNavigate()

  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariants, setSelectedVariants] = useState<VariantSelection>({})
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()

  // ✅ Get deepest selected variant
  const getCurrentVariant = (): VariantOption | null => {
    if (!product?.variantGroups || product.variantGroups.length === 0) {
      return null
    }

    let currentOption: VariantOption | null = null

    // Level 1: Find selected option in main groups
    for (const group of product.variantGroups) {
      const selectedId = selectedVariants[group.attributeType]
      if (selectedId) {
        currentOption = group.options.find((opt) => opt.id === selectedId) || null
        if (currentOption) break
      }
    }

    if (!currentOption) return null

    // Level 2: If has child groups, find selected child
    if (currentOption.childVariantGroups && currentOption.childVariantGroups.length > 0) {
      for (const childGroup of currentOption.childVariantGroups) {
        const selectedChildId = selectedVariants[childGroup.attributeType]
        if (selectedChildId) {
          const childOption = childGroup.options.find((opt) => opt.id === selectedChildId)
          if (childOption) {
            return childOption // Return deepest level
          }
        }
      }
    }

    return currentOption
  }

  const currentVariant = getCurrentVariant()
  const currentPrice = currentVariant?.finalPrice || 0
  const currentStock = currentVariant?.quantity || 0

  // ✅ Auto-select first option in each group on mount
  useEffect(() => {
    if (product?.variantGroups && product.variantGroups.length > 0) {
      const initialSelection: VariantSelection = {}

      // Select first option in level 1
      const firstGroup = product.variantGroups[0]
      if (firstGroup.options.length > 0) {
        const firstOption = firstGroup.options[0]
        initialSelection[firstGroup.attributeType] = firstOption.id

        // If first option has child groups, select first child too
        if (firstOption.childVariantGroups && firstOption.childVariantGroups.length > 0) {
          const firstChildGroup = firstOption.childVariantGroups[0]
          if (firstChildGroup.options.length > 0) {
            initialSelection[firstChildGroup.attributeType] = firstChildGroup.options[0].id
          }
        }
      }

      setSelectedVariants(initialSelection)
    }
  }, [product])

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

  // ✅ Handle variant selection (any level)
  const handleVariantSelect = (attributeType: string, optionId: string, parentOption?: VariantOption) => {
    const newSelection = { ...selectedVariants }
    newSelection[attributeType] = optionId

    // If selecting parent, reset child selections
    if (parentOption?.childVariantGroups) {
      parentOption.childVariantGroups.forEach((childGroup) => {
        delete newSelection[childGroup.attributeType]
      })

      // Auto-select first child if exists
      const selectedOption = parentOption.childVariantGroups[0]?.options.find((opt) => opt.id === optionId)
      if (selectedOption && selectedOption.childVariantGroups && selectedOption.childVariantGroups.length > 0) {
        const firstChildGroup = selectedOption.childVariantGroups[0]
        if (firstChildGroup.options.length > 0) {
          newSelection[firstChildGroup.attributeType] = firstChildGroup.options[0].id
        }
      }
    }

    setSelectedVariants(newSelection)
    setQuantity(1)
  }

  // ✅ Get selected parent option to show child groups
  const getSelectedParentOption = (group: VariantGroup): VariantOption | null => {
    const selectedId = selectedVariants[group.attributeType]
    if (!selectedId) return null
    return group.options.find((opt) => opt.id === selectedId) || null
  }

  if (!product) {
    return null
  }

  // ✅ Display images: from selected variant or product
  const displayImages = currentVariant?.productImages || product.productImages || []
  const mainImage = displayImages.length > 0 ? displayImages[selectedImage] : '/images/placeholder.jpg'

  return (
    <>
      <div className='bg-white'>
        <div className='max-w-7xl mx-auto px-6 py-8'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
            {/* Image Gallery */}
            <div className='space-y-4'>
              {/* Main Image */}
              <div className='aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200'>
                <img
                  src={mainImage}
                  alt={product.name}
                  className='w-full h-full object-cover'
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'https://via.placeholder.com/600x600?text=No+Image'
                  }}
                />
              </div>

              {/* Thumbnail Images */}
              {displayImages.length > 1 && (
                <div className='grid grid-cols-6 gap-2'>
                  {displayImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index ? 'border-orange-500' : 'border-transparent hover:border-gray-300'
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
            <div className='space-y-5'>
              {/* Product Title and Rating */}
              <div>
                <h1 className='text-2xl font-normal text-gray-900 mb-3'>{product.name}</h1>

                <div className='flex items-center gap-4 mb-3'>
                  <div className='flex items-center gap-1'>
                    <span className='text-orange-500 text-lg font-medium border-b border-orange-500'>
                      {product.rating.toFixed(1)}
                    </span>
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-orange-400' : 'text-gray-300'}`}
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                      </svg>
                    ))}
                  </div>

                  <span className='text-gray-400'>|</span>

                  <div className='flex items-center gap-1'>
                    <span className='text-gray-600 border-b border-gray-600'>{product.reviewCount || 0}</span>
                    <span className='text-gray-500 text-sm'>Đánh Giá</span>
                  </div>

                  <span className='text-gray-400'>|</span>

                  <div className='flex items-center gap-1'>
                    <span className='text-gray-900 font-medium'>{product.saleCount || 0}</span>
                    <span className='text-gray-500 text-sm'>Đã Bán</span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className='bg-gray-50 px-5 py-4 rounded'>
                <div className='flex items-center gap-4'>
                  {currentVariant?.basePrice && currentVariant.basePrice > currentPrice && (
                    <div className='text-gray-400 line-through text-base'>
                      ₫{currentVariant.basePrice.toLocaleString('vi-VN')}
                    </div>
                  )}
                  <div className='text-3xl font-medium text-orange-500'>₫{currentPrice.toLocaleString('vi-VN')}</div>
                  {currentVariant?.basePrice && currentVariant.basePrice > currentPrice && (
                    <div className='bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium'>
                      -{Math.round(((currentVariant.basePrice - currentPrice) / currentVariant.basePrice) * 100)}% GIẢM
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ Variant Groups (Level 1) */}
              {product.variantGroups && product.variantGroups.length > 0 && (
                <div className='space-y-5'>
                  {product.variantGroups.map((group, groupIndex) => (
                    <div key={groupIndex}>
                      {/* Group Label */}
                      <div className='flex items-center gap-5 mb-3'>
                        <span className='text-gray-600 min-w-[100px]'>{group.attributeType}</span>
                        <div className='flex flex-wrap gap-2'>
                          {group.options.map((option) => {
                            const isSelected = selectedVariants[group.attributeType] === option.id
                            const isDisabled = !option.isActive || option.quantity === 0

                            return (
                              <button
                                key={option.id}
                                onClick={() => handleVariantSelect(group.attributeType, option.id, option)}
                                disabled={isDisabled}
                                className={`
                                  min-w-[80px] px-4 py-2 border rounded text-sm transition-all
                                  ${
                                    isSelected
                                      ? 'border-orange-500 text-orange-500 bg-orange-50'
                                      : 'border-gray-300 text-gray-700 hover:border-orange-300'
                                  }
                                  ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                                  relative
                                `}
                              >
                                {option.name}
                                {isSelected && (
                                  <svg
                                    className='absolute bottom-0 right-0 w-4 h-4 text-orange-500'
                                    fill='currentColor'
                                    viewBox='0 0 20 20'
                                  >
                                    <path d='M0 20 L20 20 L20 0 Z' />
                                    <path
                                      fill='white'
                                      d='M14.5 6.5 L8.5 12.5 L5.5 9.5'
                                      stroke='white'
                                      strokeWidth='1.5'
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                    />
                                  </svg>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* ✅ Child Variant Groups (Level 2) */}
                      {(() => {
                        const selectedParent = getSelectedParentOption(group)
                        if (selectedParent?.childVariantGroups && selectedParent.childVariantGroups.length > 0) {
                          return selectedParent.childVariantGroups.map((childGroup, childIndex) => (
                            <div key={childIndex} className='ml-[100px] mt-3'>
                              <div className='flex items-center gap-5 mb-3'>
                                <span className='text-gray-600 min-w-[100px]'>{childGroup.attributeType}</span>
                                <div className='flex flex-wrap gap-2'>
                                  {childGroup.options.map((childOption) => {
                                    const isChildSelected =
                                      selectedVariants[childGroup.attributeType] === childOption.id
                                    const isChildDisabled = !childOption.isActive || childOption.quantity === 0

                                    return (
                                      <button
                                        key={childOption.id}
                                        onClick={() => handleVariantSelect(childGroup.attributeType, childOption.id)}
                                        disabled={isChildDisabled}
                                        className={`
                                          min-w-[80px] px-4 py-2 border rounded text-sm transition-all
                                          ${
                                            isChildSelected
                                              ? 'border-orange-500 text-orange-500 bg-orange-50'
                                              : 'border-gray-300 text-gray-700 hover:border-orange-300'
                                          }
                                          ${isChildDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                                          relative
                                        `}
                                      >
                                        {childOption.name}
                                        {isChildSelected && (
                                          <svg
                                            className='absolute bottom-0 right-0 w-4 h-4 text-orange-500'
                                            fill='currentColor'
                                            viewBox='0 0 20 20'
                                          >
                                            <path d='M0 20 L20 20 L20 0 Z' />
                                            <path
                                              fill='white'
                                              d='M14.5 6.5 L8.5 12.5 L5.5 9.5'
                                              stroke='white'
                                              strokeWidth='1.5'
                                              strokeLinecap='round'
                                              strokeLinejoin='round'
                                            />
                                          </svg>
                                        )}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          ))
                        }
                        return null
                      })()}
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity */}
              <div className='flex items-center gap-5'>
                <span className='text-gray-600 min-w-[100px]'>Số Lượng</span>
                <div className='flex items-center gap-4'>
                  <div className='flex items-center border border-gray-300'>
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className='px-3 py-1 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
                    >
                      <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                        <path d='M3 10h14' stroke='currentColor' strokeWidth='2' />
                      </svg>
                    </button>
                    <input
                      type='text'
                      value={quantity}
                      readOnly
                      className='w-12 text-center border-l border-r border-gray-300 py-1 focus:outline-none'
                    />
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= currentStock}
                      className='px-3 py-1 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
                    >
                      <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                        <path d='M10 3v14M3 10h14' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                      </svg>
                    </button>
                  </div>
                  <span className='text-gray-500 text-sm'>{currentStock} sản phẩm có sẵn</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex items-center gap-4 mt-6'>
                <button
                  onClick={handleAddToCart}
                  disabled={!product.isActive || currentStock === 0 || !currentVariant || isAddingToCart}
                  className='flex-1 border border-orange-500 text-orange-500 bg-orange-50 py-3 px-6 rounded hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-normal'
                >
                  {isAddingToCart ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500'></div>
                      Đang thêm...
                    </>
                  ) : (
                    <>
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'
                        />
                      </svg>
                      {!product.isActive || currentStock === 0 ? 'Hết hàng' : 'Thêm Vào Giỏ Hàng'}
                    </>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={!product.isActive || currentStock === 0 || !currentVariant}
                  className='flex-1 bg-orange-500 text-white py-3 px-6 rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-normal'
                >
                  {!product.isActive || currentStock === 0 ? 'Hết hàng' : 'Mua Ngay'}
                </button>
              </div>

              {/* Product Description */}
              {product.description && (
                <div className='bg-gray-50 p-5 rounded mt-6'>
                  <h3 className='text-base font-medium text-gray-900 mb-2'>Chi tiết sản phẩm</h3>
                  <p className='text-gray-700 text-sm leading-relaxed whitespace-pre-wrap'>{product.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Đăng nhập để tiếp tục</DialogTitle>
            <DialogDescription>Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowLoginModal(false)}>
              Hủy
            </Button>
            <Button className='bg-orange-500 hover:bg-orange-600' onClick={() => navigate('/login')}>
              Đăng nhập
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ProductGallery
