import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Textarea } from '../../../components/ui/textarea'
import { Badge } from '../../../components/ui/badge'
import { Star, MessageSquare, Search, Filter, Package, Box } from 'lucide-react'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { toast } from '../../../utils/toast'
import { productReviewApi } from '../../../apis/productReview.api'
import { productApi } from '../../../apis/product.api'
import { getAllCombos } from '../../../apis/combo.api'
import { useStore } from '../../../contexts/store.context'
import type { ReviewResponse } from '../../../types/productReviewType'
import type { ProductForCombo } from '../../../apis/product.api'
import type { Combo } from '../../../types/combo.type'
import Loading from '../../../components/Loading/loading'

const DEFAULT_THUMBNAIL = 'https://i.pinimg.com/1200x/93/b6/9f/93b69fd5d973b3f2fbc325982eb8e658.jpg'

interface SelectedItem {
  type: 'product' | 'combo'
  id: string
  name: string
  thumbnailUrl?: string
}

export default function ProductReviews() {
  const { store } = useStore()
  const [products, setProducts] = useState<ProductForCombo[]>([])
  const [combos, setCombos] = useState<Combo[]>([])
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [selectedReview, setSelectedReview] = useState<ReviewResponse | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false)
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [isUpdatingReply, setIsUpdatingReply] = useState(false)
  const [allStoreReviews, setAllStoreReviews] = useState<ReviewResponse[]>([])
  const [loadingStoreStats, setLoadingStoreStats] = useState(false)

  // Fetch products and combos on mount
  useEffect(() => {
    const fetchItems = async () => {
      if (!store?.id) return

      try {
        setLoading(true)

        // Fetch products for combo
        const productsResponse = await productApi.getForCombo()
        if (productsResponse.status === 200 && productsResponse.data) {
          setProducts(productsResponse.data)
        }

        // Fetch combos - filter by isActive=true and status="Approved"
        const combosData = await getAllCombos({ storeId: store.id })
        const approvedCombos = combosData.data.filter((combo) => combo.isActive === true && combo.status === 'Approved')
        setCombos(approvedCombos)
      } catch (error) {
        console.error('Error fetching items:', error)
        toast.error('Có lỗi xảy ra khi tải danh sách sản phẩm và combo')
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [store?.id])

  // Fetch all store reviews for overall statistics
  useEffect(() => {
    const fetchStoreReviews = async () => {
      if (!store?.id) return

      try {
        setLoadingStoreStats(true)
        const response = await productReviewApi.getReviewsByStore(store.id, {
          pageSize: 1000,
          pageNumber: 1
        })

        if (response.status === 200 && response.data) {
          setAllStoreReviews(response.data)
        }
      } catch (error) {
        console.error('Error fetching store reviews:', error)
      } finally {
        setLoadingStoreStats(false)
      }
    }

    fetchStoreReviews()
  }, [store?.id])

  // Fetch reviews when item is selected
  useEffect(() => {
    const fetchReviews = async () => {
      if (!selectedItem) {
        setReviews([])
        return
      }

      try {
        setLoadingReviews(true)
        const params = {
          page: 1,
          pageSize: 100,
          rating: ratingFilter !== 'all' ? Number(ratingFilter) : undefined
        }

        let response
        if (selectedItem.type === 'product') {
          response = await productReviewApi.getReviewsByProduct(selectedItem.id, params)
        } else {
          response = await productReviewApi.getReviewsByCombo(selectedItem.id, params)
        }

        if (response.status === 200 && response.data) {
          setReviews(response.data)
        }
      } catch (error) {
        console.error('Error fetching reviews:', error)
        toast.error('Có lỗi xảy ra khi tải đánh giá')
        setReviews([])
      } finally {
        setLoadingReviews(false)
      }
    }

    fetchReviews()
  }, [selectedItem, ratingFilter])

  // Filter items by search term
  const filteredItems = useMemo(() => {
    const allItems: Array<{ type: 'product' | 'combo'; id: string; name: string; thumbnailUrl?: string }> = [
      ...products.map((p) => ({ type: 'product' as const, id: p.id, name: p.name, thumbnailUrl: p.thumbnailUrl })),
      ...combos.map((c) => ({ type: 'combo' as const, id: c.id, name: c.name, thumbnailUrl: c.thumbnailUrl }))
    ]

    if (!searchTerm) return allItems

    return allItems.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [products, combos, searchTerm])

  // Filter reviews by rating
  const filteredReviews = useMemo(() => {
    if (ratingFilter === 'all') return reviews
    return reviews.filter((review) => review.rating.toString() === ratingFilter)
  }, [reviews, ratingFilter])

  const handleItemClick = (item: { type: 'product' | 'combo'; id: string; name: string; thumbnailUrl?: string }) => {
    setSelectedItem(item)
  }

  const handleReply = (review: ReviewResponse) => {
    setSelectedReview(review)
    setReplyText(review.sellerReply?.content || '')
    setIsReplyDialogOpen(true)
  }

  const handleSubmitReply = async () => {
    if (!selectedReview || !replyText.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi')
      return
    }

    try {
      if (selectedReview.sellerReply) {
        // Update existing reply
        setIsUpdatingReply(true)
        await productReviewApi.updateReply(selectedReview.sellerReply.replyId, {
          content: replyText.trim()
        })
        toast.success('Cập nhật phản hồi thành công!')
      } else {
        // Create new reply
        setIsSubmittingReply(true)
        await productReviewApi.replyToReview(selectedReview.id, {
          content: replyText.trim()
        })
        toast.success('Phản hồi thành công!')
      }

      setIsReplyDialogOpen(false)

      // Refresh reviews
      if (selectedItem) {
        const params = {
          page: 1,
          pageSize: 100,
          rating: ratingFilter !== 'all' ? Number(ratingFilter) : undefined
        }

        let response
        if (selectedItem.type === 'product') {
          response = await productReviewApi.getReviewsByProduct(selectedItem.id, params)
        } else {
          response = await productReviewApi.getReviewsByCombo(selectedItem.id, params)
        }

        if (response.status === 200 && response.data) {
          setReviews(response.data)
        }
      }

      setReplyText('')
      setSelectedReview(null)
    } catch (error) {
      console.error('Error submitting reply:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error)?.message ||
        'Có lỗi xảy ra khi gửi phản hồi'
      toast.error(errorMessage)
    } finally {
      setIsSubmittingReply(false)
      setIsUpdatingReply(false)
    }
  }

  const getRatingStats = (reviewList: ReviewResponse[]) => {
    const stats = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, total: 0, average: 0, withImages: 0, withReply: 0, withoutReply: 0 }
    reviewList.forEach((review) => {
      stats[review.rating as keyof typeof stats]++
      stats.total++
      stats.average += review.rating
      if (review.images && review.images.length > 0) {
        stats.withImages++
      }
      if (review.sellerReply) {
        stats.withReply++
      } else {
        stats.withoutReply++
      }
    })
    if (stats.total > 0) {
      stats.average = stats.average / stats.total
    }
    return stats
  }

  const stats = getRatingStats(reviews)
  const overallStats = getRatingStats(allStoreReviews)

  const renderStars = (rating: number) => {
    return (
      <div className='flex items-center gap-1'>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 fill-gray-300'}
            fill={star <= rating ? 'currentColor' : 'none'}
          />
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (!store) {
    return (
      <div className='p-6'>
        <Card>
          <CardContent className='py-12 text-center'>
            <MessageSquare className='mx-auto text-gray-400 mb-4' size={48} />
            <p className='text-gray-600'>Vui lòng thiết lập cửa hàng trước khi xem đánh giá</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>Đánh giá sản phẩm</h1>
        <p className='text-green-700'>Quản lý và phản hồi đánh giá từ khách hàng</p>
      </div>

      {/* Overall Statistics Card */}
      {!loadingStoreStats && overallStats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Thống kê tổng quan cửa hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
              <div className='text-center p-4 bg-green-50 rounded-lg'>
                <div className='text-3xl font-bold text-green-600 mb-1'>{overallStats.average.toFixed(1)}</div>
                <div className='flex justify-center mb-2'>{renderStars(Math.round(overallStats.average))}</div>
                <div className='text-sm text-gray-600'>Đánh giá trung bình</div>
              </div>
              <div className='text-center p-4 bg-blue-50 rounded-lg'>
                <div className='text-3xl font-bold text-blue-600 mb-1'>{overallStats.total}</div>
                <div className='text-sm text-gray-600'>Tổng số đánh giá</div>
              </div>
              <div className='text-center p-4 bg-purple-50 rounded-lg'>
                <div className='text-3xl font-bold text-purple-600 mb-1'>{overallStats.withReply}</div>
                <div className='text-sm text-gray-600'>Đã phản hồi</div>
                <div className='text-xs text-gray-500 mt-1'>
                  {overallStats.total > 0
                    ? `${Math.round((overallStats.withReply / overallStats.total) * 100)}%`
                    : '0%'}
                </div>
              </div>
              <div className='text-center p-4 bg-orange-50 rounded-lg'>
                <div className='text-3xl font-bold text-orange-600 mb-1'>{overallStats.withoutReply}</div>
                <div className='text-sm text-gray-600'>Chưa phản hồi</div>
                <div className='text-xs text-gray-500 mt-1'>
                  {overallStats.total > 0
                    ? `${Math.round((overallStats.withoutReply / overallStats.total) * 100)}%`
                    : '0%'}
                </div>
              </div>
            </div>

            {/* Overall Rating Breakdown */}
            <div className='border-t pt-4'>
              <h3 className='text-sm font-semibold text-gray-700 mb-3'>Phân bố đánh giá tổng quan</h3>
              <div className='space-y-2'>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = overallStats[rating as keyof typeof overallStats] as number
                  const percentage = overallStats.total > 0 ? (count / overallStats.total) * 100 : 0
                  return (
                    <div key={rating} className='flex items-center gap-3'>
                      <span className='text-sm text-gray-600 w-12'>{rating} sao</span>
                      <div className='flex-1 bg-gray-200 rounded-full h-2.5'>
                        <div
                          className='bg-green-500 h-2.5 rounded-full transition-all'
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className='text-sm text-gray-600 w-12 text-right'>{count}</span>
                      <span className='text-xs text-gray-500 w-12 text-right'>
                        {percentage > 0 ? `${percentage.toFixed(0)}%` : '0%'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Sidebar - Products and Combos List */}
        <div className='lg:col-span-1'>
          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm & Combo</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className='mb-4'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={20} />
                  <Input
                    placeholder='Tìm kiếm sản phẩm/combo...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>

              {/* Items List */}
              {loading ? (
                <div className='text-center py-8'>
                  <Loading />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  <p>Không tìm thấy sản phẩm hoặc combo nào</p>
                </div>
              ) : (
                <div className='space-y-2 max-h-[600px] overflow-y-auto'>
                  {filteredItems.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleItemClick(item)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedItem?.id === item.id && selectedItem?.type === item.type
                        ? 'bg-green-50 border-green-500'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <div className='flex items-center gap-3'>
                        {/* Thumbnail Image */}
                        <div className='w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0'>
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.name}
                              className='w-full h-full object-cover'
                              onError={(e) => {
                                e.currentTarget.src = DEFAULT_THUMBNAIL
                              }}
                            />
                          ) : (
                            <div className='w-full h-full flex items-center justify-center bg-gray-100'>
                              {item.type === 'combo' ? (
                                <Package className='text-green-600' size={20} />
                              ) : (
                                <Box className='text-blue-600' size={20} />
                              )}
                            </div>
                          )}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='font-medium text-sm text-gray-900 truncate'>{item.name}</p>
                          <p className='text-xs text-gray-500'>{item.type === 'combo' ? 'Combo' : 'Sản phẩm'}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Content - Reviews */}
        <div className='lg:col-span-2 space-y-6'>
          {!selectedItem ? (
            <Card>
              <CardContent className='py-12 text-center'>
                <MessageSquare className='mx-auto text-gray-400 mb-4' size={48} />
                <p className='text-gray-600'>Vui lòng chọn một sản phẩm hoặc combo để xem đánh giá</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Selected Item Info */}
              <Card>
                <CardContent className='pt-6'>
                  <div className='flex items-center gap-3 mb-4'>
                    {selectedItem.type === 'combo' ? (
                      <Package className='text-green-600' size={24} />
                    ) : (
                      <Box className='text-blue-600' size={24} />
                    )}
                    <div>
                      <h2 className='text-lg font-semibold text-gray-900'>{selectedItem.name}</h2>
                      <p className='text-sm text-gray-500'>{selectedItem.type === 'combo' ? 'Combo' : 'Sản phẩm'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics Card */}
              {reviews.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className='text-xl font-bold text-gray-900 mb-4'>Đánh giá sản phẩm</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Overall Rating Summary */}
                    <div className='mb-6 pb-6 border-b'>
                      <div className='flex items-center gap-4'>
                        <div className='flex items-center gap-2'>
                          <span className='text-4xl font-bold text-gray-900'>{stats.average.toFixed(1)}</span>
                          <div className='flex text-yellow-500 text-2xl'>{renderStars(Math.round(stats.average))}</div>
                        </div>
                        <span className='text-gray-600 text-lg'>({stats.total} đánh giá)</span>
                      </div>
                    </div>

                    {/* Additional Metrics */}
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
                      <div className='text-center p-3 bg-blue-50 rounded-lg'>
                        <div className='text-2xl font-bold text-blue-600 mb-1'>{stats.total}</div>
                        <div className='text-xs text-gray-600'>Tổng đánh giá</div>
                      </div>
                      <div className='text-center p-3 bg-purple-50 rounded-lg'>
                        <div className='text-2xl font-bold text-purple-600 mb-1'>{stats.withReply}</div>
                        <div className='text-xs text-gray-600'>Đã phản hồi</div>
                      </div>
                      <div className='text-center p-3 bg-orange-50 rounded-lg'>
                        <div className='text-2xl font-bold text-orange-600 mb-1'>{stats.withoutReply}</div>
                        <div className='text-xs text-gray-600'>Chưa phản hồi</div>
                      </div>
                      <div className='text-center p-3 bg-pink-50 rounded-lg'>
                        <div className='text-2xl font-bold text-pink-600 mb-1'>{stats.withImages}</div>
                        <div className='text-xs text-gray-600'>Có hình ảnh</div>
                      </div>
                    </div>

                    {/* Rating Breakdown */}
                    <div className='space-y-2'>
                      <h3 className='text-sm font-semibold text-gray-700 mb-3'>Phân bố đánh giá</h3>
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = stats[rating as keyof typeof stats] as number
                        const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
                        return (
                          <div key={rating} className='flex items-center gap-3'>
                            <span className='text-sm text-gray-600 w-12'>{rating} sao</span>
                            <div className='flex-1 bg-gray-200 rounded-full h-2.5'>
                              <div
                                className='bg-green-500 h-2.5 rounded-full transition-all'
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className='text-sm text-gray-600 w-12 text-right'>{count}</span>
                            <span className='text-xs text-gray-500 w-12 text-right'>
                              {percentage > 0 ? `${percentage.toFixed(0)}%` : '0%'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Filters */}
              <Card>
                <CardContent className='pt-6'>
                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger className='w-full md:w-[200px]'>
                      <Filter className='mr-2' size={16} />
                      <SelectValue placeholder='Lọc theo đánh giá' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Tất cả</SelectItem>
                      <SelectItem value='5'>5 sao</SelectItem>
                      <SelectItem value='4'>4 sao</SelectItem>
                      <SelectItem value='3'>3 sao</SelectItem>
                      <SelectItem value='2'>2 sao</SelectItem>
                      <SelectItem value='1'>1 sao</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Reviews List */}
              <div className='space-y-4'>
                {loadingReviews ? (
                  <div className='text-center py-12'>
                    <Loading />
                    <p className='mt-2 text-gray-600'>Đang tải đánh giá...</p>
                  </div>
                ) : filteredReviews.length === 0 ? (
                  <Card>
                    <CardContent className='py-12 text-center'>
                      <MessageSquare className='mx-auto text-gray-400 mb-4' size={48} />
                      <p className='text-gray-600'>Chưa có đánh giá nào</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredReviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className='pt-6'>
                        <div className='flex items-start justify-between mb-2'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-2'>
                              {renderStars(review.rating)}
                              <span className='text-sm text-gray-500'>{formatDate(review.createdAt)}</span>
                            </div>
                            <div className='flex items-center gap-2 mb-3'>
                              <div className='w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center'>
                                <span className='text-xs text-gray-600'>
                                  {review.userFullName?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                              <span className='text-sm text-gray-700'>{review.userFullName || 'Khách hàng'}</span>
                              {review.variantName && (
                                <span className='text-xs text-gray-400'>({review.variantName})</span>
                              )}
                            </div>
                          </div>
                          <Badge variant={review.sellerReply ? 'default' : 'outline'}>
                            {review.sellerReply ? 'Đã phản hồi' : 'Chưa phản hồi'}
                          </Badge>
                        </div>

                        {/* Comment */}
                        {review.comment && <p className='text-gray-700 mb-3'>{review.comment}</p>}

                        {/* Review Images */}
                        {review.images && review.images.length > 0 && (
                          <div className='flex gap-2 mb-3 flex-wrap'>
                            {review.images.map((img, index) => (
                              <img
                                key={index}
                                src={img}
                                alt={`Review image ${index + 1}`}
                                className='w-16 h-16 object-cover rounded-lg border cursor-pointer hover:opacity-80'
                                onClick={() => window.open(img, '_blank')}
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/80'
                                }}
                              />
                            ))}
                          </div>
                        )}

                        {/* Store Reply */}
                        {review.sellerReply && (
                          <div className='bg-green-50 border border-green-200 rounded-lg p-3 mb-3'>
                            <div className='flex items-center gap-2 mb-1'>
                              <span className='text-sm font-medium text-green-800'>
                                Phản hồi từ {review.sellerReply.shopName}
                              </span>
                              <span className='text-xs text-green-600'>{formatDate(review.sellerReply.createdAt)}</span>
                            </div>
                            <p className='text-sm text-green-700'>{review.sellerReply.content}</p>
                          </div>
                        )}

                        {/* Reply Button */}
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleReply(review)}
                          className='text-green-600 border-green-600 hover:bg-green-50'
                        >
                          <MessageSquare size={16} className='mr-2' />
                          {review.sellerReply ? 'Chỉnh sửa phản hồi' : 'Phản hồi'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedReview?.sellerReply ? 'Chỉnh sửa phản hồi' : 'Phản hồi đánh giá'}</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-gray-600 mb-2'>
                {selectedItem?.type === 'combo' ? 'Combo' : 'Sản phẩm'}: {selectedItem?.name}
              </p>
              <p className='text-sm text-gray-700 bg-gray-50 p-3 rounded-lg'>{selectedReview?.comment}</p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-700 mb-2 block'>Nội dung phản hồi</label>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder='Nhập phản hồi của bạn...'
                rows={4}
                className='resize-none'
                maxLength={200}
              />
              <p className='text-xs text-gray-500 mt-1'>{replyText.length}/200 ký tự</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsReplyDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmitReply}
              disabled={isSubmittingReply || isUpdatingReply || !replyText.trim()}
              className='bg-green-600 hover:bg-green-700'
            >
              {isSubmittingReply || isUpdatingReply
                ? 'Đang gửi...'
                : selectedReview?.sellerReply
                  ? 'Cập nhật phản hồi'
                  : 'Gửi phản hồi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
