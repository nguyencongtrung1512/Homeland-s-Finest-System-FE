import React, { useState, useEffect } from 'react'
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
  const [overallRating, setOverallRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0) // Track which star is being hovered
  const [qualityComment, setQualityComment] = useState('')
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-select first product if only one product
  useEffect(() => {
    if (products.length === 1) {
      setSelectedProduct(products[0])
    } else if (products.length > 1 && !selectedProduct) {
      setSelectedProduct(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products])

  // Reset form when modal closes or product changes
  useEffect(() => {
    if (!isOpen) {
      setSelectedProduct(null)
      setOverallRating(0)
      setQualityComment('')
      setUploadedImages([])
      setIsSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen || products.length === 0) return null

  const hasMultipleProducts = products.length > 1

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
    if (!selectedProduct || !selectedProduct.id) {
      toast.error('Vui lòng chọn sản phẩm để đánh giá')
      return
    }

    if (overallRating === 0) {
      toast.error('Vui lòng chọn điểm đánh giá')
      return
    }

    try {
      setIsSubmitting(true)

      // Prepare review data according to ProductReviewCreateInput interface
      // selectedProduct.id is OrderItemId (from OrdersContent)
      const reviewData: ProductReviewCreateInput = {
        orderItemId: selectedProduct.id, // OrderItemId for backend validation
        userId: userId,
        rating: overallRating,
        comment: qualityComment.trim() || '',
        images: uploadedImages.length > 0 ? uploadedImages : undefined
      }

      // Call API to submit review
      // Backend will validate: OrderItemId exists, belongs to user, order is completed (Delivered/Paid), and not reviewed yet
      await productReviewApi.createReview(reviewData)

      toast.success('Đánh giá sản phẩm thành công!')
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
            {hasMultipleProducts ? 'Chọn sản phẩm bạn muốn đánh giá' : 'Chia sẻ trải nghiệm của bạn về sản phẩm'}
          </DialogDescription>
        </DialogHeader>

        <div className='p-4 space-y-6 overflow-y-auto flex-1'>
          {/* Product Selection (if multiple products) */}
          {hasMultipleProducts && (
            <div>
              <h3 className='font-semibold mb-3 text-gray-800'>Chọn sản phẩm đánh giá</h3>
              <div className='space-y-2'>
                {products.map((product) => (
                  <button
                    key={product.id || product.name}
                    onClick={() => setSelectedProduct(product)}
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

          {/* Product Info (when product is selected or only one product) */}
          {selectedProduct && (
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

              {/* Overall Rating */}
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

          {hasMultipleProducts && !selectedProduct && (
            <div className='text-center py-8 text-gray-500'>
              <p>Vui lòng chọn sản phẩm để đánh giá</p>
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
            disabled={!selectedProduct || overallRating === 0 || isSubmitting}
          >
            {isSubmitting ? 'Đang gửi...' : 'Hoàn thành'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ReviewModal
