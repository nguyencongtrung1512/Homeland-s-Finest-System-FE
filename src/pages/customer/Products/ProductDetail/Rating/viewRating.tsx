import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { productReviewApi } from '../../../../../apis/productReview.api'
import type {
  ReviewResponse,
  ReviewStatsResponse,
  PaginationInfo,
  ProductReviewUpdateInput
} from '../../../../../types/productReviewType'
import Loading from '../../../../../components/Loading/loading'
import { UserIcon, Star, Image as ImageIcon, ArrowUpDown, Filter, Edit, X, Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select'
import { Badge } from '../../../../../components/ui/badge'
import { Button } from '../../../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '../../../../../components/ui/dialog'
import { Textarea } from '../../../../../components/ui/textarea'
import { Label } from '../../../../../components/ui/label'
import Pagination from '../../../../../components/Pagination/Pagination'
import { useAuth } from '../../../../../contexts/auth.context'
import { toast } from '../../../../../utils/toast'
import ImagePreviewModal from '../../../../../components/ui/image-preview-modal'

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
  const { user } = useAuth()
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

  // Edit review state
  const [editingReview, setEditingReview] = useState<ReviewResponse | null>(null)
  const [editRating, setEditRating] = useState<number>(0)
  const [editComment, setEditComment] = useState<string>('')
  const [editKeepImages, setEditKeepImages] = useState<string[]>([])
  const [editNewImages, setEditNewImages] = useState<File[]>([])
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([])
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  // Image preview modal state
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

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

  // Handle open edit modal
  const handleOpenEdit = (review: ReviewResponse) => {
    setEditingReview(review)
    setEditRating(review.rating)
    setEditComment(review.comment || '')
    setEditKeepImages(review.images || [])
    setEditNewImages([])
    setEditImagePreviews([])
  }

  // Handle close edit modal
  const handleCloseEdit = () => {
    setEditingReview(null)
    setEditRating(0)
    setEditComment('')
    setEditKeepImages([])
    setEditNewImages([])
    // Clean up preview URLs
    editImagePreviews.forEach((url) => URL.revokeObjectURL(url))
    setEditImagePreviews([])
  }

  // Handle image upload for edit
  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Limit to 3 images total (keepImages + newImages)
    const totalImages = editKeepImages.length + editNewImages.length + files.length
    if (totalImages > 3) {
      toast.warning('Tối đa 3 hình ảnh cho mỗi đánh giá')
      return
    }

    const newFiles = files.slice(0, 3 - editKeepImages.length - editNewImages.length)
    setEditNewImages((prev) => [...prev, ...newFiles])

    // Create preview URLs
    const previews = newFiles.map((file) => URL.createObjectURL(file))
    setEditImagePreviews((prev) => [...prev, ...previews])
  }

  // Handle remove keep image
  const handleRemoveKeepImage = (imageUrl: string) => {
    setEditKeepImages((prev) => prev.filter((url) => url !== imageUrl))
  }

  // Handle remove new image
  const handleRemoveNewImage = (index: number) => {
    setEditNewImages((prev) => prev.filter((_, i) => i !== index))
    // Revoke preview URL
    const previewUrl = editImagePreviews[index]
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setEditImagePreviews((prev) => prev.filter((_, i) => i !== index))
    }
  }

  // Handle submit edit
  const handleSubmitEdit = async () => {
    if (!editingReview || !productId) return

    if (editRating === 0) {
      toast.warning('Vui lòng chọn số sao đánh giá')
      return
    }

    try {
      setIsSubmittingEdit(true)

      const updateData: ProductReviewUpdateInput = {
        rating: editRating,
        comment: editComment.trim() || undefined,
        keepImages: editKeepImages.length > 0 ? editKeepImages : undefined,
        newImages: editNewImages.length > 0 ? editNewImages : undefined
      }

      await productReviewApi.updateReview(editingReview.id, updateData)
      toast.success('Cập nhật đánh giá thành công!')

      // Refresh reviews and stats
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

      // Refresh stats
      const statsResponse = await productReviewApi.getReviewStats(productId)
      if (statsResponse.status === 200 && statsResponse.data) {
        setStats(statsResponse.data)
      }

      handleCloseEdit()
    } catch (err: unknown) {
      console.error('Error updating review:', err)
      const errorObj = err as { message?: string; response?: { data?: { message?: string } } }
      toast.error(errorObj.message || errorObj.response?.data?.message || 'Có lỗi xảy ra khi cập nhật đánh giá')
    } finally {
      setIsSubmittingEdit(false)
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
                        {/* Edit Button - Only show if userId matches current user */}
                        {user && review.userId === user.userId && (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleOpenEdit(review)}
                            className='h-7 px-2 text-xs text-gray-600 hover:text-green-600 hover:bg-green-50 ml-auto'
                          >
                            <Edit className='w-3 h-3 mr-1' />
                            Chỉnh sửa
                          </Button>
                        )}
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
                              alt={`Hình ảnh đánh giá ${index + 1}`}
                              className='w-20 h-20 object-cover rounded-lg cursor-pointer border border-gray-200 hover:border-green-400 transition-all shadow-sm hover:shadow-md'
                              onClick={() => {
                                setPreviewImages(review.images || [])
                                setPreviewIndex(index)
                                setIsPreviewOpen(true)
                              }}
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

      {/* Edit Review Modal */}
      <Dialog open={editingReview !== null} onOpenChange={(open) => !open && handleCloseEdit()}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa đánh giá</DialogTitle>
            <DialogDescription>Bạn có thể cập nhật đánh giá và hình ảnh của mình</DialogDescription>
          </DialogHeader>

          <div className='space-y-6 py-4'>
            {/* Rating Selection */}
            <div className='space-y-2'>
              <Label>Số sao đánh giá *</Label>
              <div className='flex items-center gap-2'>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type='button'
                    onClick={() => setEditRating(star)}
                    className={`transition-all ${editRating >= star ? 'text-yellow-500 scale-110' : 'text-gray-300 hover:text-yellow-400'
                      }`}
                  >
                    <Star className={`w-8 h-8 ${editRating >= star ? 'fill-current' : ''}`} />
                  </button>
                ))}
                {editRating > 0 && <span className='ml-2 text-sm text-gray-600'>{editRating} sao</span>}
              </div>
            </div>

            {/* Comment */}
            <div className='space-y-2'>
              <Label htmlFor='edit-comment'>Nhận xét</Label>
              <Textarea
                id='edit-comment'
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                placeholder='Chia sẻ trải nghiệm của bạn về sản phẩm này...'
                rows={4}
                className='resize-none'
              />
            </div>

            {/* Existing Images */}
            {editKeepImages.length > 0 && (
              <div className='space-y-2'>
                <Label>Hình ảnh hiện tại</Label>
                <div className='flex gap-2 flex-wrap'>
                  {editKeepImages.map((imageUrl, index) => (
                    <div key={index} className='relative group'>
                      <img
                        src={imageUrl}
                        alt={`Hình ảnh ${index + 1}`}
                        className='w-20 h-20 object-cover rounded-lg border border-gray-200'
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_REVIEW_IMAGE
                        }}
                      />
                      <button
                        type='button'
                        onClick={() => handleRemoveKeepImage(imageUrl)}
                        className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images Preview */}
            {editImagePreviews.length > 0 && (
              <div className='space-y-2'>
                <Label>Hình ảnh mới</Label>
                <div className='flex gap-2 flex-wrap'>
                  {editImagePreviews.map((previewUrl, index) => (
                    <div key={index} className='relative group'>
                      <img
                        src={previewUrl}
                        alt={`Hình ảnh mới ${index + 1}`}
                        className='w-20 h-20 object-cover rounded-lg border border-gray-200'
                      />
                      <button
                        type='button'
                        onClick={() => handleRemoveNewImage(index)}
                        className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New Images */}
            {editKeepImages.length + editNewImages.length < 3 && (
              <div className='space-y-2'>
                <Label htmlFor='edit-images'>
                  Thêm hình ảnh (tối đa {3 - editKeepImages.length - editNewImages.length} ảnh)
                </Label>
                <input
                  id='edit-images'
                  type='file'
                  accept='image/*'
                  multiple
                  onChange={handleEditImageUpload}
                  className='w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100'
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={handleCloseEdit} disabled={isSubmittingEdit}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={isSubmittingEdit || editRating === 0}
              className='bg-green-600 hover:bg-green-700'
            >
              {isSubmittingEdit ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Đang cập nhật...
                </>
              ) : (
                'Cập nhật đánh giá'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        images={previewImages}
        initialIndex={previewIndex}
        alt='Hình ảnh đánh giá'
      />
    </section>
  )
}
