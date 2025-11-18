import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '../../../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../../../components/ui/dialog'
import { Camera, Star } from 'lucide-react'
import { productReviewApi } from '../../../../../apis/productReview.api'
import { toast } from '../../../../../utils/toast'
import type { ProductReviewCreateInput } from '../../../../../types/productReviewType'

interface Product {
  id?: string
  name: string
  image: string
  category?: string
  isCombo?: boolean
  comboId?: string
  comboName?: string
}

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  userId: string
  onReviewSubmitted?: () => void
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, products, userId, onReviewSubmitted }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedCombo, setSelectedCombo] = useState<{
    comboId: string
    comboName: string
    items: Product[]
  } | null>(null)
  const [overallRating, setOverallRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0) // Track which star is being hovered
  const [qualityComment, setQualityComment] = useState('')
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Group products by combo - use useMemo to calculate before useEffect
  const { comboGroups, regularProducts, allItems, hasMultipleItems } = useMemo(() => {
    if (!products || products.length === 0) {
      return {
        comboGroups: [],
        regularProducts: [],
        allItems: [],
        hasMultipleItems: false
      }
    }

    const groupedProducts = products.reduce(
      (acc, product) => {
        if (product.isCombo && product.comboId) {
          const comboKey = product.comboId
          if (!acc.combos[comboKey]) {
            acc.combos[comboKey] = {
              comboId: product.comboId,
              comboName: product.comboName || 'Combo',
              items: []
            }
          }
          acc.combos[comboKey].items.push(product)
        } else {
          acc.regular.push(product)
        }
        return acc
      },
      {
        combos: {} as Record<string, { comboId: string; comboName: string; items: Product[] }>,
        regular: [] as Product[]
      }
    )

    const comboGroups = Object.values(groupedProducts.combos)
    const regularProducts = groupedProducts.regular
    const allItems = [...comboGroups, ...regularProducts]
    const hasMultipleItems = allItems.length > 1

    return { comboGroups, regularProducts, allItems, hasMultipleItems }
  }, [products])

  // Auto-select first item if only one item
  useEffect(() => {
    if (allItems.length === 1) {
      const item = allItems[0]
      if ('comboId' in item && 'items' in item) {
        setSelectedCombo(item as { comboId: string; comboName: string; items: Product[] })
        setSelectedProduct(null)
      } else {
        setSelectedProduct(item as Product)
        setSelectedCombo(null)
      }
    } else if (allItems.length > 1) {
      setSelectedProduct(null)
      setSelectedCombo(null)
    }
  }, [allItems])

  // Reset form when modal closes or product changes
  useEffect(() => {
    if (!isOpen) {
      setSelectedProduct(null)
      setSelectedCombo(null)
      setOverallRating(0)
      setQualityComment('')
      setUploadedImages([])
      setIsSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen || products.length === 0) return null

  const handleStarClick = (rating: number) => {
    setOverallRating(rating)
    setHoveredRating(0) // Reset hover after click
  }

  const handleStarHover = (rating: number) => {
    setHoveredRating(rating)
  }

  const handleStarLeave = () => {
    setHoveredRating(0)
  }

  // Determine if a star should be highlighted
  const getStarColor = (starNumber: number) => {
    const activeRating = hoveredRating || overallRating
    if (starNumber <= activeRating) {
      return 'text-yellow-500 fill-yellow-500' // Filled and colored when selected/hovered
    }
    return 'text-gray-300 fill-gray-300' // Empty and gray when not selected
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedImages((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const handleSubmit = async () => {
    // Check if combo or product is selected
    const isComboSelected = selectedCombo !== null
    const isProductSelected = selectedProduct !== null && selectedProduct.id

    if (!isComboSelected && !isProductSelected) {
      toast.error('Vui lòng chọn sản phẩm hoặc combo để đánh giá')
      return
    }

    if (overallRating === 0) {
      toast.error('Vui lòng chọn điểm đánh giá')
      return
    }

    try {
      setIsSubmitting(true)

      // For combo, use the first item's orderItemId
      // Backend should handle combo review based on comboId or orderItemId
      const orderItemId =
        isComboSelected && selectedCombo?.items[0]?.id ? selectedCombo.items[0].id : selectedProduct?.id

      if (!orderItemId) {
        toast.error('Không tìm thấy thông tin đơn hàng để đánh giá')
        return
      }

      // Prepare review data according to ProductReviewCreateInput interface
      const reviewData: ProductReviewCreateInput = {
        orderItemId: orderItemId, // OrderItemId for backend validation
        userId: userId,
        rating: overallRating,
        comment: qualityComment.trim() || '',
        images: uploadedImages.length > 0 ? uploadedImages : undefined
      }

      // Call API to submit review
      // Backend will validate: OrderItemId exists, belongs to user, order is completed (Delivered/Paid), and not reviewed yet
      // For combo, backend should recognize it's a combo review based on orderItemId
      await productReviewApi.createReview(reviewData)

      toast.success(isComboSelected ? 'Đánh giá combo thành công!' : 'Đánh giá sản phẩm thành công!')
      onClose()

      // Callback to refresh orders list
      if (onReviewSubmitted) {
        onReviewSubmitted()
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error)?.message ||
        'Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden'>
        <DialogHeader className='p-4 border-b shrink-0'>
          <DialogTitle>Đánh Giá Sản Phẩm</DialogTitle>
          <DialogDescription>
            {hasMultipleItems
              ? 'Chọn sản phẩm hoặc combo bạn muốn đánh giá'
              : 'Chia sẻ trải nghiệm của bạn về sản phẩm'}
          </DialogDescription>
        </DialogHeader>

        <div className='p-4 space-y-6 overflow-y-auto flex-1'>
          {/* Item Selection (if multiple items) */}
          {hasMultipleItems && (
            <div>
              <h3 className='font-semibold mb-3 text-gray-800'>Chọn sản phẩm hoặc combo đánh giá</h3>
              <div className='space-y-2'>
                {/* Combo Groups */}
                {comboGroups.map((combo) => (
                  <button
                    key={combo.comboId}
                    onClick={() => {
                      setSelectedCombo(combo)
                      setSelectedProduct(null)
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${selectedCombo?.comboId === combo.comboId
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                  >
                    <div className='flex-1 text-left'>
                      <div className='flex items-center gap-2'>
                        <h4 className='font-medium text-gray-900 text-sm'>{combo.comboName}</h4>
                        <span className='bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium'>
                          Combo
                        </span>
                      </div>
                      <p className='text-xs text-gray-600 mt-1'>{combo.items.length} sản phẩm trong combo</p>
                    </div>
                    {selectedCombo?.comboId === combo.comboId && <div className='text-orange-600'>✓</div>}
                  </button>
                ))}

                {/* Regular Products */}
                {regularProducts.map((product) => (
                  <button
                    key={product.id || product.name}
                    onClick={() => {
                      setSelectedProduct(product)
                      setSelectedCombo(null)
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${selectedProduct?.id === product.id || selectedProduct?.name === product.name
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                  >
                    <div className='flex-1 text-left'>
                      <h4 className='font-medium text-gray-900 text-sm'>{product.name}</h4>
                      {product.category && <p className='text-xs text-gray-600 mt-1'>{product.category}</p>}
                    </div>
                    {selectedProduct?.id === product.id || selectedProduct?.name === product.name ? (
                      <div className='text-green-600'>✓</div>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Combo Info (when combo is selected) */}
          {selectedCombo && (
            <>
              <div className='flex items-center gap-3 p-3 bg-orange-50 rounded-2xl border border-orange-200'>
                <div className='w-16 h-16 bg-white rounded-xl flex items-center justify-center border border-orange-300'>
                  <span className='text-2xl'>📦</span>
                </div>
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <h3 className='font-medium text-gray-900 text-sm'>{selectedCombo.comboName}</h3>
                    <span className='bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full font-medium'>Combo</span>
                  </div>
                  <p className='text-xs text-gray-600 mt-1'>{selectedCombo.items.length} sản phẩm trong combo</p>
                </div>
              </div>

              {/* Combo Items List */}
              <div className='bg-orange-50 rounded-lg p-3 border border-orange-200'>
                <h4 className='text-xs font-semibold text-orange-800 mb-2'>Sản phẩm trong combo:</h4>
                <div className='space-y-2'>
                  {selectedCombo.items.map((item, index) => (
                    <div key={item.id || index} className='flex items-center gap-2 bg-white rounded-lg p-2'>
                      <img src={item.image} alt={item.name} className='w-10 h-10 object-cover rounded' />
                      <div className='flex-1 min-w-0'>
                        <p className='text-xs font-medium text-gray-800 truncate'>{item.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Product Info (when product is selected) */}
          {selectedProduct && !selectedCombo && (
            <>
              <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-2xl'>
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className='w-16 h-16 object-cover rounded-xl'
                />
                <div className='flex-1'>
                  <h3 className='font-medium text-gray-900 text-sm'>{selectedProduct.name}</h3>
                  {selectedProduct.category && <p className='text-xs text-gray-600 mt-1'>{selectedProduct.category}</p>}
                  <div className='flex items-center gap-1 mt-1'>
                    <span className='text-yellow-500'>⭐</span>
                    <span className='text-xs text-gray-600'>127 đánh giá</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Overall Rating - Only show when item is selected */}
          {(selectedProduct || selectedCombo) && (
            <>
              <div>
                <h3 className='font-semibold mb-3 text-gray-800'>Đánh giá tổng thể</h3>
                <div className='flex items-center gap-2 mb-2'>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = star <= (hoveredRating || overallRating)
                    return (
                      <button
                        key={star}
                        type='button'
                        onClick={() => handleStarClick(star)}
                        onMouseEnter={() => handleStarHover(star)}
                        onMouseLeave={handleStarLeave}
                        className={`transition-all duration-200 hover:scale-110 ${isActive ? 'transform scale-105' : ''
                          }`}
                        aria-label={`Đánh giá ${star} sao`}
                      >
                        <Star
                          size={32}
                          className={`${getStarColor(star)} transition-all duration-200 ${isActive ? 'drop-shadow-sm' : ''
                            }`}
                          fill={isActive ? 'currentColor' : 'none'}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quality Comment */}
              <div>
                <h3 className='font-semibold mb-3 text-gray-800'>Chất lượng sản phẩm</h3>
                <textarea
                  value={qualityComment}
                  onChange={(e) => setQualityComment(e.target.value)}
                  placeholder='Hãy chia sẻ trải nghiệm thực tế để giúp sản phẩm được cải thiện tốt hơn'
                  className='w-full h-24 p-3 border border-gray-300 rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
                />
              </div>

              {/* Upload Section */}
              <div>
                <h3 className='font-semibold mb-3 text-gray-800'>Thêm hình ảnh & video (tùy chọn)</h3>
                <div className='gap-2'>
                  {/* Image Upload */}
                  <label className='flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-400 hover:bg-green-50'>
                    <div className='text-green-600 text-lg mb-1'>
                      <Camera />
                    </div>
                    <span className='text-xs text-gray-600 text-center'>Thêm Hình ảnh</span>
                    <input type='file' multiple accept='image/*' onChange={handleImageUpload} className='hidden' />
                  </label>
                </div>
                <p className='text-xs text-gray-500 text-center mt-2'>
                  Hình ảnh thực tế sẽ giúp đánh giá của bạn hữu ích hơn
                </p>
              </div>

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div>
                  <h4 className='font-medium mb-2 text-gray-700'>Hình ảnh đã tải lên:</h4>
                  <div className='space-y-1'>
                    {uploadedImages.map((file, index) => (
                      <div key={`img-${index}`} className='text-xs text-gray-600 flex items-center gap-2'>
                        <span>📷</span>
                        <span>{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {hasMultipleItems && !selectedProduct && !selectedCombo && (
            <div className='text-center py-8 text-gray-500'>
              <p>Vui lòng chọn sản phẩm hoặc combo để đánh giá</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <DialogFooter className='p-4 border-t shrink-0'>
          <Button variant='outline' className='flex-1 rounded-xl' onClick={onClose}>
            Trở lại
          </Button>
          <Button
            className='flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl'
            onClick={handleSubmit}
            disabled={(!selectedProduct && !selectedCombo) || overallRating === 0 || isSubmitting}
          >
            {isSubmitting ? 'Đang gửi...' : 'Hoàn thành'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ReviewModal
