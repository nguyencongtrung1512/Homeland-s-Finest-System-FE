import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { productReviewApi } from '../../../../../apis/productReview.api'
import type { ReviewResponse, ReviewStatsResponse, PaginationInfo } from '../../../../../types/productReviewType'
import Loading from '../../../../../components/Loading/loading'
import { UserIcon } from 'lucide-react'

const DEFAULT_REVIEW_IMAGE = 'https://i.pinimg.com/1200x/93/b6/9f/93b69fd5d973b3f2fbc325982eb8e658.jpg'

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export const ViewRating: React.FC = () => {
  const { id: productId } = useParams<{ id: string }>()
  const [stats, setStats] = useState<ReviewStatsResponse | null>(null)
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined)
  const [hasImage, setHasImage] = useState<boolean | undefined>(undefined)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'high_score' | 'low_score'>('newest')
  const pageSize = 10

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) {
        setError('Không tìm thấy ID sản phẩm')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch stats and reviews in parallel
        const [statsResponse, reviewsResponse] = await Promise.all([
          productReviewApi.getReviewStats(productId),
          productReviewApi.getReviewsByProduct(productId, {
            page: currentPage,
            pageSize,
            rating: selectedRating,
            hasImage,
            sortBy
          })
        ])

        if (statsResponse.status === 200 && statsResponse.data) {
          setStats(statsResponse.data)
        }

        if (reviewsResponse.status === 200 && reviewsResponse.data) {
          setReviews(reviewsResponse.data)
          if (reviewsResponse.pagination) {
            setPagination(reviewsResponse.pagination)
          }
        }
      } catch (err: unknown) {
        console.error('Error fetching reviews:', err)
        const errorObj = err as { message?: string; response?: { data?: { message?: string } } }
        setError(errorObj.message || errorObj.response?.data?.message || 'Có lỗi xảy ra khi tải đánh giá')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [productId, currentPage, selectedRating, hasImage, sortBy, pageSize])

  const getStarPercentage = (starCount: number) => {
    if (!stats || stats.totalReviews === 0) return 0
    return (starCount / stats.totalReviews) * 100
  }

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  if (loading) {
    return (
      <section className='max-w-6xl mx-auto px-6 py-8'>
        <div className='flex justify-center items-center h-64'>
          <Loading />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className='max-w-6xl mx-auto px-6 py-8'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <p className='text-red-600 text-center'>{error}</p>
        </div>
      </section>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <section className='max-w-6xl mx-auto px-6 py-8'>
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        {/* Header */}
        <div className='mb-6'>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>Đánh giá sản phẩm</h2>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              <span className='text-3xl font-bold text-gray-900'>{stats.averageRating.toFixed(1)}</span>
              <div className='flex text-yellow-500 text-xl'>{renderStars(Math.round(stats.averageRating))}</div>
            </div>
            <span className='text-gray-600'>({stats.totalReviews} đánh giá)</span>
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className='mb-8'>
          <div className='space-y-2'>
            {[5, 4, 3, 2, 1].map((star) => {
              const count =
                star === 5
                  ? stats.count5Star
                  : star === 4
                    ? stats.count4Star
                    : star === 3
                      ? stats.count3Star
                      : star === 2
                        ? stats.count2Star
                        : stats.count1Star
              const percentage = getStarPercentage(count)
              return (
                <div key={star} className='flex items-center gap-3'>
                  <span className='text-sm text-gray-600 w-12'>{star} sao</span>
                  <div className='flex-1 bg-gray-200 rounded-full h-2'>
                    <div className='bg-green-500 h-2 rounded-full' style={{ width: `${percentage}%` }}></div>
                  </div>
                  <span className='text-sm text-gray-600 w-8'>{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Filters */}
        <div className='mb-6 flex flex-wrap gap-2'>
          <select
            value={selectedRating || ''}
            onChange={(e) => setSelectedRating(e.target.value ? Number(e.target.value) : undefined)}
            className='px-3 py-2 border border-gray-300 rounded-md text-sm'
          >
            <option value=''>Tất cả đánh giá</option>
            <option value='5'>5 sao</option>
            <option value='4'>4 sao</option>
            <option value='3'>3 sao</option>
            <option value='2'>2 sao</option>
            <option value='1'>1 sao</option>
          </select>
          <button
            onClick={() => setHasImage(hasImage ? undefined : true)}
            className={`px-3 py-2 border rounded-md text-sm ${hasImage ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-300'}`}
          >
            Có hình ảnh
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className='px-3 py-2 border border-gray-300 rounded-md text-sm'
          >
            <option value='newest'>Mới nhất</option>
            <option value='oldest'>Cũ nhất</option>
            <option value='high_score'>Điểm cao nhất</option>
            <option value='low_score'>Điểm thấp nhất</option>
          </select>
        </div>

        {/* Individual Reviews */}
        <div className='border-t border-gray-200 pt-6 space-y-6'>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className='flex items-start gap-4'>
                {/* Avatar */}
                <div className='w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden'>
                  {review.userAvatar ? (
                    <img
                      src={review.userAvatar}
                      alt={review.userFullName}
                      className='w-full h-full object-cover'
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const iconDiv = e.currentTarget.parentElement?.querySelector('.user-icon-fallback')
                        if (iconDiv) {
                          iconDiv.classList.remove('hidden')
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full flex items-center justify-center user-icon-fallback ${review.userAvatar ? 'hidden' : ''}`}
                  >
                    <UserIcon className='w-6 h-6 text-gray-600' />
                  </div>
                </div>

                {/* Review Content */}
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-2 flex-wrap'>
                    <span className='font-medium text-gray-900'>{review.userFullName}</span>
                    <div className='flex text-yellow-500'>{renderStars(review.rating)}</div>
                    <span className='text-sm text-gray-500'>{formatDate(review.createdAt)}</span>
                    {review.variantName && <span className='text-xs text-gray-400'>({review.variantName})</span>}
                  </div>

                  {review.comment && <p className='text-gray-700 mb-4'>{review.comment}</p>}

                  {/* Product Images */}
                  {review.images && review.images.length > 0 && (
                    <div className='flex gap-2 mb-4 flex-wrap'>
                      {review.images.map((imageUrl, index) => (
                        <img
                          key={index}
                          src={imageUrl}
                          alt={`Review image ${index + 1}`}
                          className='w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80'
                          onClick={() => window.open(imageUrl, '_blank')}
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_REVIEW_IMAGE
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Store Response */}
                  {review.sellerReply && (
                    <div className='border border-green-200 rounded-lg p-3 bg-green-50'>
                      <div className='flex items-center gap-2 mb-1'>
                        <span className='text-sm font-medium text-green-800'>
                          Phản hồi từ {review.sellerReply.shopName}
                        </span>
                      </div>
                      <p className='text-sm text-green-700'>{review.sellerReply.content}</p>
                      <span className='text-xs text-green-600 mt-1 block'>
                        {formatDate(review.sellerReply.createdAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className='text-center py-8 text-gray-500'>
              <p>Chưa có đánh giá nào cho sản phẩm này.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages && pagination.totalPages > 1 && (
          <div className='flex justify-center items-center gap-2 mt-6 pt-6 border-t'>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className='px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
            >
              Trước
            </button>
            <span className='text-sm text-gray-600'>
              Trang {currentPage} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages || 1))}
              disabled={currentPage === (pagination.totalPages || 1)}
              className='px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
