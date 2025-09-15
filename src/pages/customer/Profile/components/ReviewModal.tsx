import React, { useState } from 'react'
import { Button } from '../../../../components/ui/button'

interface Product {
  name: string
  image: string
  category?: string
}

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, product }) => {
  const [overallRating, setOverallRating] = useState(0)
  const [highlights, setHighlights] = useState<string[]>([])
  const [qualityComment, setQualityComment] = useState('')
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [uploadedVideos, setUploadedVideos] = useState<File[]>([])

  if (!isOpen || !product) return null

  const highlightOptions = [
    'Chất lượng tốt',
    'Đóng gói cẩn thận',
    'Giao hàng nhanh',
    'Giá cả hợp lý',
    'Sản phẩm đúng mô tả',
    'Dịch vụ tốt'
  ]

  const handleStarClick = (rating: number) => {
    setOverallRating(rating)
  }

  const handleHighlightToggle = (highlight: string) => {
    setHighlights((prev) => (prev.includes(highlight) ? prev.filter((h) => h !== highlight) : [...prev, highlight]))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedImages((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedVideos((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const handleSubmit = () => {
    // Handle review submission
    console.log({
      product: product.name,
      overallRating,
      highlights,
      qualityComment,
      images: uploadedImages,
      videos: uploadedVideos
    })
    onClose()
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4' style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className='bg-white rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b shrink-0'>
          <h2 className='text-lg font-semibold text-gray-800'>Đánh Giá Sản Phẩm</h2>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 text-xl font-bold'>
            ×
          </button>
        </div>

        {/* Content */}
        <div className='p-4 space-y-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'>
          {/* Product Info */}
          <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-2xl'>
            <img src={product.image} alt={product.name} className='w-16 h-16 object-cover rounded-xl' />
            <div className='flex-1'>
              <h3 className='font-medium text-gray-900 text-sm'>{product.name}</h3>
              {product.category && <p className='text-xs text-gray-600 mt-1'>{product.category}</p>}
              <div className='flex items-center gap-1 mt-1'>
                <span className='text-yellow-500'>⭐</span>
                <span className='text-xs text-gray-600'>127 đánh giá</span>
              </div>
            </div>
          </div>

          {/* Overall Rating */}
          <div>
            <h3 className='font-semibold mb-3 text-gray-800'>Đánh giá tổng thể</h3>
            <div className='flex items-center gap-1 mb-2'>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  className={`text-2xl ${star <= overallRating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ⭐
                </button>
              ))}
            </div>
            <p className='text-sm text-gray-600'>
              {overallRating === 0 && 'Chưa chọn đánh giá'}
              {overallRating === 1 && 'Rất không hài lòng'}
              {overallRating === 2 && 'Không hài lòng'}
              {overallRating === 3 && 'Bình thường'}
              {overallRating === 4 && 'Hài lòng'}
              {overallRating === 5 && 'Rất hài lòng'}
            </p>
          </div>

          {/* Highlights */}
          <div>
            <h3 className='font-semibold mb-3 text-gray-800'>Tính năng nổi bật</h3>
            <div className='grid grid-cols-2 gap-2'>
              {highlightOptions.map((highlight) => (
                <button
                  key={highlight}
                  onClick={() => handleHighlightToggle(highlight)}
                  className={`p-2 text-xs rounded-xl border text-left ${
                    highlights.includes(highlight)
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {highlight}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Comment */}
          <div>
            <h3 className='font-semibold mb-3 text-gray-800'>Chất lượng sản phẩm</h3>
            <textarea
              value={qualityComment}
              onChange={(e) => setQualityComment(e.target.value)}
              placeholder='Hãy chia sẻ trải nghiệm thực tế để giúp người mua khác. Chất lượng ra sao? Bạn có mua trong dịp thường?'
              className='w-full h-24 p-3 border border-gray-300 rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
            />
          </div>

          {/* Upload Section */}
          <div>
            <h3 className='font-semibold mb-3 text-gray-800'>Thêm hình ảnh & video (tùy chọn)</h3>
            <div className='grid grid-cols-2 gap-2'>
              {/* Image Upload */}
              <label className='flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-400 hover:bg-green-50'>
                <div className='text-green-600 text-lg mb-1'>📷</div>
                <span className='text-xs text-gray-600 text-center'>Thêm Hình ảnh</span>
                <input type='file' multiple accept='image/*' onChange={handleImageUpload} className='hidden' />
              </label>

              {/* Video Upload */}
              <label className='flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-400 hover:bg-green-50'>
                <div className='text-green-600 text-lg mb-1'>🎥</div>
                <span className='text-xs text-gray-600 text-center'>Thêm Video</span>
                <input type='file' multiple accept='video/*' onChange={handleVideoUpload} className='hidden' />
              </label>
            </div>
            <p className='text-xs text-gray-500 text-center mt-2'>
              Hình ảnh thực tế sẽ giúp đánh giá của bạn hữu ích hơn
            </p>
          </div>

          {/* Uploaded Files Preview */}
          {(uploadedImages.length > 0 || uploadedVideos.length > 0) && (
            <div>
              <h4 className='font-medium mb-2 text-gray-700'>Files đã tải lên:</h4>
              <div className='space-y-1'>
                {uploadedImages.map((file, index) => (
                  <div key={`img-${index}`} className='text-xs text-gray-600 flex items-center gap-2'>
                    <span>📷</span>
                    <span>{file.name}</span>
                  </div>
                ))}
                {uploadedVideos.map((file, index) => (
                  <div key={`vid-${index}`} className='text-xs text-gray-600 flex items-center gap-2'>
                    <span>🎥</span>
                    <span>{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className='flex gap-3 p-4 border-t shrink-0'>
          <Button variant='outline' className='flex-1 rounded-xl' onClick={onClose}>
            Trở lại
          </Button>
          <Button
            className='flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl'
            onClick={handleSubmit}
            disabled={overallRating === 0}
          >
            Hoàn thành
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ReviewModal
