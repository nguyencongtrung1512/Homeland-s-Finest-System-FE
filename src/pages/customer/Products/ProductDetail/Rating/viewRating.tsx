import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { productReviewApi } from '../../../../../apis/productReview.api'
import type { ReviewResponse, ReviewStatsResponse, PaginationInfo } from '../../../../../types/productReviewType'
import Loading from '../../../../../components/Loading/loading'
import { UserIcon, Star, Image as ImageIcon, ArrowUpDown, Filter } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select'
import { Badge } from '../../../../../components/ui/badge'
import { Button } from '../../../../../components/ui/button'
import Pagination from '../../../../../components/Pagination/Pagination'

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
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined)
  const [hasImage, setHasImage] = useState<boolean | undefined>(undefined)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'high_score' | 'low_score'>('newest')
  const pageSize = 10

  // Fetch stats only once when productId changes (not affected by filters)
  useEffect(() => {
    const fetchStats = async () => {
      if (!productId) {
        setError('Không tìm thấy ID sản phẩm')
        setLoadingStats(false)
        return
      }

      try {
        setLoadingStats(true)
        const statsResponse = await productReviewApi.getReviewStats(productId)

        if (statsResponse.status === 200 && statsResponse.data) {
          setStats(statsResponse.data)
        }
      } catch (err: unknown) {
        console.error('Error fetching stats:', err)
        const errorObj = err as { message?: string; response?: { data?: { message?: string } } }
        setError(errorObj.message || errorObj.response?.data?.message || 'Có lỗi xảy ra khi tải thống kê đánh giá')
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [productId])

  // Fetch reviews when filters change (separate from stats)
  useEffect(() => {
    const fetchReviews = async () => {
      if (!productId) {
        return
      }

      try {
        setLoadingReviews(true)
        setError(null)

        const reviewsResponse = await productReviewApi.getReviewsByProduct(productId, {
          page: currentPage,
          pageSize,
          rating: selectedRating,
          hasImage,
          sortBy
        })

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
        setLoadingReviews(false)
      }
    }

    fetchReviews()
  }, [productId, currentPage, selectedRating, hasImage, sortBy, pageSize])

  const getStarPercentage = (starCount: number) => {
    if (!stats || stats.totalReviews === 0) return 0
    return (starCount / stats.totalReviews) * 100
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-500 text-yellow-500' : 'fill-gray-300 text-gray-300'}`}
      />
    ))
  }

  const getSortLabel = (value: string) => {
    switch (value) {
      case 'newest':
        return 'Mới nhất'
      case 'oldest':
        return 'Cũ nhất'
      case 'high_score':
        return 'Điểm cao nhất'
      case 'low_score':
        return 'Điểm thấp nhất'
      default:
        return 'Mới nhất'
    }
  }

  // Show loading only for initial stats load
  if (loadingStats && !stats) {
    return (
      <section className='max-w-6xl mx-auto px-6 py-8'>
        <div className='flex justify-center items-center h-64'>
          <Loading />
        </div>
      </section>
    )
  }

  if (error && !stats) {
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className='mb-8'
        >
          <div className='space-y-2'>
            {[5, 4, 3, 2, 1].map((star, index) => {
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
                <motion.div
                  key={star}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className='flex items-center gap-3'
                >
                  <span className='text-sm text-gray-600 w-12 font-medium'>{star} sao</span>
                  <div className='flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden'>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className='bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full'
                    />
                  </div>
                  <span className='text-sm text-gray-600 w-8 font-medium'>{count}</span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className='mb-6'
        >
          <div className='flex flex-wrap items-center gap-3'>
            {/* Rating Filter */}
            <Select
              value={selectedRating?.toString() || 'all'}
              onValueChange={(value) => {
                setSelectedRating(value === 'all' ? undefined : Number(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className='w-[160px] h-9'>
                <div className='flex items-center gap-2 px-1'>
                  <Star className='w-4 h-4 text-yellow-500' />
                  <SelectValue placeholder='Tất cả đánh giá' />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả đánh giá</SelectItem>
                <SelectItem value='5'>
                  <div className='flex items-center gap-2'>
                    <Star className='w-4 h-4 fill-yellow-500 text-yellow-500' />
                    <span>5 sao</span>
                  </div>
                </SelectItem>
                <SelectItem value='4'>
                  <div className='flex items-center gap-2'>
                    <Star className='w-4 h-4 fill-yellow-500 text-yellow-500' />
                    <span>4 sao</span>
                  </div>
                </SelectItem>
                <SelectItem value='3'>
                  <div className='flex items-center gap-2'>
                    <Star className='w-4 h-4 fill-yellow-500 text-yellow-500' />
                    <span>3 sao</span>
                  </div>
                </SelectItem>
                <SelectItem value='2'>
                  <div className='flex items-center gap-2'>
                    <Star className='w-4 h-4 fill-yellow-500 text-yellow-500' />
                    <span>2 sao</span>
                  </div>
                </SelectItem>
                <SelectItem value='1'>
                  <div className='flex items-center gap-2'>
                    <Star className='w-4 h-4 fill-yellow-500 text-yellow-500' />
                    <span>1 sao</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Image Filter Button */}
            <Button
              variant={hasImage ? 'default' : 'outline'}
              size='sm'
              onClick={() => {
                setHasImage(hasImage ? undefined : true)
                setCurrentPage(1)
              }}
              className={`h-9 gap-2 ${hasImage ? 'bg-green-50 border-green-500 text-green-700 hover:bg-green-100' : ''}`}
            >
              <ImageIcon className='w-4 h-4' />
              Có hình ảnh
              {hasImage && (
                <Badge variant='secondary' className='ml-1 bg-green-200 text-green-800'>
                  ✓
                </Badge>
              )}
            </Button>

            {/* Sort Filter */}
            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value as typeof sortBy)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className='w-[180px] h-9 px-2'>
                <div className='flex items-center gap-2'>
                  <ArrowUpDown className='w-4 h-4 text-gray-500' />
                  <SelectValue>{getSortLabel(sortBy)}</SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='newest'>
                  <div className='flex items-center gap-2'>
                    <ArrowUpDown className='w-4 h-4' />
                    <span>Mới nhất</span>
                  </div>
                </SelectItem>
                <SelectItem value='oldest'>
                  <div className='flex items-center gap-2'>
                    <ArrowUpDown className='w-4 h-4 rotate-180' />
                    <span>Cũ nhất</span>
                  </div>
                </SelectItem>
                <SelectItem value='high_score'>
                  <div className='flex items-center gap-2'>
                    <Star className='w-4 h-4 fill-yellow-500 text-yellow-500' />
                    <span>Điểm cao nhất</span>
                  </div>
                </SelectItem>
                <SelectItem value='low_score'>
                  <div className='flex items-center gap-2'>
                    <Star className='w-4 h-4 fill-gray-400 text-gray-400' />
                    <span>Điểm thấp nhất</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Active Filters Badge */}
            {(selectedRating || hasImage) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className='flex items-center gap-2'
              >
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    setSelectedRating(undefined)
                    setHasImage(undefined)
                    setCurrentPage(1)
                  }}
                  className='h-9 text-xs text-gray-600 hover:text-gray-900'
                >
                  <Filter className='w-3 h-3 mr-1' />
                  Xóa bộ lọc
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Individual Reviews */}
        <div className='border-t border-gray-200 pt-6'>
          {loadingReviews ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='flex justify-center items-center py-8'
            >
              <Loading />
            </motion.div>
          ) : reviews.length > 0 ? (
            <AnimatePresence mode='popLayout'>
              <div className='space-y-6'>
                {reviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className='flex items-start gap-4'
                  >
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
                        <div className='flex items-center gap-0.5'>{renderStars(review.rating)}</div>
                        <span className='text-sm text-gray-500'>{formatDate(review.createdAt)}</span>
                        {review.variantName && <span className='text-xs text-gray-400'>({review.variantName})</span>}
                      </div>

                      {review.comment && <p className='text-gray-700 mb-4 leading-relaxed'>{review.comment}</p>}

                      {/* Product Images */}
                      {review.images && review.images.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className='flex gap-2 mb-4 flex-wrap'
                        >
                          {review.images.map((imageUrl, index) => (
                            <motion.img
                              key={index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.05 }}
                              src={imageUrl}
                              alt={`Review image ${index + 1}`}
                              className='w-20 h-20 object-cover rounded-lg cursor-pointer border border-gray-200 hover:border-green-400 transition-all shadow-sm hover:shadow-md'
                              onClick={() => window.open(imageUrl, '_blank')}
                              onError={(e) => {
                                e.currentTarget.src = DEFAULT_REVIEW_IMAGE
                              }}
                            />
                          ))}
                        </motion.div>
                      )}

                      {/* Store Response */}
                      {review.sellerReply && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className='border border-green-200 rounded-lg p-3 bg-green-50 mt-3'
                        >
                          <div className='flex items-center gap-2 mb-1'>
                            <span className='text-sm font-medium text-green-800'>
                              Phản hồi từ {review.sellerReply.shopName}
                            </span>
                          </div>
                          <p className='text-sm text-green-700'>{review.sellerReply.content}</p>
                          <span className='text-xs text-green-600 mt-1 block'>
                            {formatDate(review.sellerReply.createdAt)}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='text-center py-8 text-gray-500'>
              <p>Chưa có đánh giá nào cho sản phẩm này.</p>
            </motion.div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages && pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className='mt-6 pt-6 border-t'
          >
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
              maxVisiblePages={2}
            />
          </motion.div>
        )}
      </div>
    </section>
  )
}
