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

export interface ReviewProduct {
  orderItemId?: string
  productId?: string
  name: string
  image: string
  category?: string
  isCombo?: boolean
  comboId?: string
  comboItemId?: string
  comboName?: string
  comboGroupKey?: string
}

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  products: ReviewProduct[]
  userId: string
  onReviewSubmitted?: () => void
}

interface ComboGroup {
  comboGroupKey: string
  comboId?: string
  comboName: string
  items: ReviewProduct[]
}

const DEFAULT_PRODUCT_IMAGE = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  products,
  userId, // userId is passed but not used - backend gets it from token
  onReviewSubmitted
}) => {
  // Suppress unused variable warning - userId may be needed in future
  void userId
  const [selectedProduct, setSelectedProduct] = useState<ReviewProduct | null>(null)
  const [selectedCombo, setSelectedCombo] = useState<ComboGroup | null>(null)
  const [overallRating, setOverallRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0) // Track which star is being hovered
  const [qualityComment, setQualityComment] = useState('')
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Group products by combo - use useMemo to calculate before useEffect
  const { comboGroups, regularProducts, selectionItems, hasMultipleItems } = useMemo(() => {
    if (!products || products.length === 0) {
      return {
        comboGroups: [],
        regularProducts: [],
        selectionItems: [],
        hasMultipleItems: false
      }
    }

    const groupedProducts = products.reduce(
      (acc, product) => {
        if (product.isCombo) {
          const comboKey =
            product.comboGroupKey ||
            product.comboId ||
            product.comboName ||
            product.orderItemId ||
            product.productId ||
            product.name
          if (!acc.combos[comboKey]) {
            acc.combos[comboKey] = {
              comboGroupKey: comboKey,
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
        combos: {} as Record<string, ComboGroup>,
        regular: [] as ReviewProduct[]
      }
    )

    const comboGroups = Object.values(groupedProducts.combos) as ComboGroup[]
    const regularProducts = groupedProducts.regular
    const selectionItems = [
      ...comboGroups.map((combo) => ({ type: 'combo' as const, combo })),
      ...regularProducts.map((product) => ({ type: 'product' as const, product }))
    ]
    const hasMultipleItems = selectionItems.length > 1

    return { comboGroups, regularProducts, selectionItems, hasMultipleItems }
  }, [products])

  // Auto-select first item if only one item
  useEffect(() => {
    if (selectionItems.length === 1) {
      const item = selectionItems[0]
      if (item.type === 'combo') {
        setSelectedCombo(item.combo)
        setSelectedProduct(null)
      } else if (item.type === 'product') {
        setSelectedProduct(item.product)
        setSelectedCombo(null)
      }
    } else if (selectionItems.length > 1) {
      setSelectedProduct(null)
      setSelectedCombo(null)
    }
  }, [selectionItems])

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
    const isProductSelected = selectedProduct !== null

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

      // Get orderItemId from selected item
      // For combo: use first item's orderItemId (backend will handle combo review automatically)
      // For product: use the product's orderItemId
      const targetItem = isComboSelected ? selectedCombo?.items[0] : selectedProduct
      const orderItemId = targetItem?.orderItemId

      if (!orderItemId) {
        toast.error('Không tìm thấy thông tin đơn hàng để đánh giá')
        return
      }

      // Prepare review data - only send orderItemId, rating, comment, images
      // Backend will automatically detect if it's a combo or product based on orderItemId
      const reviewData: ProductReviewCreateInput = {
        orderItemId, // Backend will validate and get product/combo info from this
        rating: overallRating,
        comment: qualityComment.trim() || undefined,
        images: uploadedImages.length > 0 ? uploadedImages : undefined
      }

      await productReviewApi.createReview(reviewData)

      toast.success(isComboSelected ? 'Đánh giá combo thành công!' : 'Đánh giá sản phẩm thành công!')
      onClose()

      // Callback to refresh orders list
      if (onReviewSubmitted) {
        onReviewSubmitted()
      }
    } catch (error: unknown) {
      console.error('Error submitting review:', error)

      // Extract error message from backend response
      let errorMessage = 'Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.'

      if (error) {
        // Backend error response structure: { message: string, status: number, errors?: [] }
        const errorObj = error as {
          message?: string
          response?: { data?: { message?: string; errors?: Array<{ field?: string; message?: string }> } }
        }

        if (errorObj.message) {
          errorMessage = errorObj.message
        } else if (errorObj.response?.data?.message) {
          errorMessage = errorObj.response.data.message
        } else if (
          errorObj.response?.data?.errors &&
          Array.isArray(errorObj.response.data.errors) &&
          errorObj.response.data.errors.length > 0
        ) {
          // Handle validation errors
          const validationErrors = errorObj.response.data.errors
            .map((err) => err.message || err.field)
            .filter(Boolean)
            .join(', ')
          errorMessage = validationErrors || errorMessage
        } else if (typeof error === 'string') {
          errorMessage = error
        }
      }

      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    event.currentTarget.onerror = null
    event.currentTarget.src = DEFAULT_PRODUCT_IMAGE
  }

  const getProductImage = (image?: string) => image || DEFAULT_PRODUCT_IMAGE

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
                    key={combo.comboGroupKey}
                    onClick={() => {
                      setSelectedCombo(combo)
                      setSelectedProduct(null)
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${selectedCombo?.comboGroupKey === combo.comboGroupKey
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
                    {selectedCombo?.comboGroupKey === combo.comboGroupKey && <div className='text-orange-600'>✓</div>}
                  </button>
                ))}

                {/* Regular Products */}
                {regularProducts.map((product) => {
                  const isSelected =
                    (!!selectedProduct?.orderItemId && selectedProduct.orderItemId === product.orderItemId) ||
                    (!!selectedProduct?.productId && selectedProduct.productId === product.productId) ||
                    selectedProduct?.name === product.name

                  return (
                    <button
                      key={product.orderItemId || product.productId || product.name}
                      onClick={() => {
                        setSelectedProduct(product)
                        setSelectedCombo(null)
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                    >
                      <div className='flex-1 text-left'>
                        <h4 className='font-medium text-gray-900 text-sm'>{product.name}</h4>
                        {product.category && <p className='text-xs text-gray-600 mt-1'>{product.category}</p>}
                      </div>
                      {isSelected ? <div className='text-green-600'>✓</div> : null}
                    </button>
                  )
                })}
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
                    <div
                      key={item.orderItemId || item.productId || `${item.name}-${index}`}
                      className='flex items-center gap-2 bg-white rounded-lg p-2'
                    >
                      <img
                        src={getProductImage(item.image)}
                        alt={item.name}
                        className='w-10 h-10 object-cover rounded'
                        onError={handleImageError}
                      />
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
                  src={getProductImage(selectedProduct.image)}
                  alt={selectedProduct.name}
                  className='w-16 h-16 object-cover rounded-xl'
                  onError={handleImageError}
                />
                <div className='flex-1'>
                  <h3 className='font-medium text-gray-900 text-sm'>{selectedProduct.name}</h3>
                  {selectedProduct.category && <p className='text-xs text-gray-600 mt-1'>{selectedProduct.category}</p>}
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
