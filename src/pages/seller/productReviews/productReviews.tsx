import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Textarea } from '../../../components/ui/textarea'
import { Badge } from '../../../components/ui/badge'
import { Star, MessageSquare, Search, Filter } from 'lucide-react'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { toast } from '../../../utils/toast'
// import { productReviewApi } from '../../../apis/productReview.api' // Uncomment when ready to use API
import { useStore } from '../../../contexts/store.context'
import type { ProductReview } from '../../../types/productReviewType'

interface ProductReviewWithReply extends ProductReview {
  userName?: string
  userAvatar?: string
  productName?: string
  productImage?: string
  reply?: ProductReview
}

export default function ProductReviews() {
  const { store } = useStore()
  const [reviews, setReviews] = useState<ProductReviewWithReply[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [selectedReview, setSelectedReview] = useState<ProductReviewWithReply | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false)
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  // Mock data - Replace with actual API call later
  useEffect(() => {
    setLoading(true)
    // Simulate API delay
    setTimeout(() => {
      const mockReviews: ProductReviewWithReply[] = [
        {
          id: '1',
          productId: 'p1',
          userId: 'u1',
          rating: 5,
          comment: 'Mật ong rất ngon, vị ngọt tự nhiên, không bị pha trộn. Đóng gói cẩn thận, giao hàng nhanh. Gia đình tôi rất hài lòng với sản phẩm này.',
          imageUrl: [
            'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?q=80&w=200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=200&auto=format&fit=crop'
          ],
          isActive: true,
          createdAt: '2024-12-15T10:30:00Z',
          updatedAt: '2024-12-15T10:30:00Z',
          userName: 'Nguyễn Thị Lan',
          productName: 'Mật ong rừng nguyên chất - 500g',
          productImage: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?q=80&w=200&auto=format&fit=crop',
          reply: {
            id: 'r1',
            productId: 'p1',
            userId: 'store1',
            rating: 0,
            comment: 'Cảm ơn chị đã tin tưởng sản phẩm. Chúng tôi cam kết chất lượng 100% tự nhiên!',
            isActive: true,
            createdAt: '2024-12-15T14:20:00Z',
            updatedAt: '2024-12-15T14:20:00Z'
          }
        },
        {
          id: '2',
          productId: 'p2',
          userId: 'u2',
          rating: 4,
          comment: 'Dâu tây tươi ngon, đóng gói đẹp. Sẽ mua lại lần sau.',
          imageUrl: ['https://images.unsplash.com/photo-1604908554027-432ea0b96227?q=80&w=200&auto=format&fit=crop'],
          isActive: true,
          createdAt: '2024-12-14T09:15:00Z',
          updatedAt: '2024-12-14T09:15:00Z',
          userName: 'Trần Văn Bình',
          productName: 'Dâu tây - 500g - giỏ quà',
          productImage: 'https://images.unsplash.com/photo-1604908554027-432ea0b96227?q=80&w=200&auto=format&fit=crop'
        },
        {
          id: '3',
          productId: 'p3',
          userId: 'u3',
          rating: 5,
          comment: 'Cà chua bi rất ngọt, tươi ngon. Đúng như mô tả. Rất hài lòng!',
          imageUrl: [],
          isActive: true,
          createdAt: '2024-12-13T16:45:00Z',
          updatedAt: '2024-12-13T16:45:00Z',
          userName: 'Lê Thị Mai',
          productName: 'Cà Chua Bi Hà Nội Ngọt Thanh - Hộp 500g',
          productImage: 'https://images.unsplash.com/photo-1548907040-4a1b2e04e8f1?q=80&w=200&auto=format&fit=crop'
        },
        {
          id: '4',
          productId: 'p4',
          userId: 'u4',
          rating: 3,
          comment: 'Sản phẩm ổn, nhưng giao hàng hơi chậm. Chất lượng đúng như mô tả.',
          imageUrl: [],
          isActive: true,
          createdAt: '2024-12-12T11:20:00Z',
          updatedAt: '2024-12-12T11:20:00Z',
          userName: 'Phạm Văn Đức',
          productName: 'Rau củ quả tươi - Combo 2kg',
          productImage: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=200&auto=format&fit=crop'
        },
        {
          id: '5',
          productId: 'p5',
          userId: 'u5',
          rating: 2,
          comment: 'Sản phẩm không đúng như mong đợi. Một số quả bị dập.',
          imageUrl: [],
          isActive: true,
          createdAt: '2024-12-11T08:30:00Z',
          updatedAt: '2024-12-11T08:30:00Z',
          userName: 'Hoàng Thị Hoa',
          productName: 'Táo xanh - 1kg',
          productImage: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?q=80&w=200&auto=format&fit=crop'
        },
        {
          id: '6',
          productId: 'p1',
          userId: 'u6',
          rating: 5,
          comment: 'Mật ong chất lượng tốt, đóng gói chuyên nghiệp. Đã mua nhiều lần và rất hài lòng!',
          imageUrl: [
            'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?q=80&w=200&auto=format&fit=crop'
          ],
          isActive: true,
          createdAt: '2024-12-10T14:10:00Z',
          updatedAt: '2024-12-10T14:10:00Z',
          userName: 'Võ Văn Nam',
          productName: 'Mật ong rừng nguyên chất - 500g',
          productImage: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?q=80&w=200&auto=format&fit=crop'
        }
      ]

      // Filter by rating if needed
      let filtered = mockReviews
      if (ratingFilter !== 'all') {
        filtered = mockReviews.filter((r) => r.rating.toString() === ratingFilter)
      }

      setReviews(filtered)
      setLoading(false)
    }, 500) // Simulate API delay
  }, [ratingFilter])

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = !searchTerm || review.productName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRating =
      ratingFilter === 'all' || review.rating.toString() === ratingFilter
    return matchesSearch && matchesRating
  })

  const handleReply = (review: ProductReviewWithReply) => {
    setSelectedReview(review)
    setReplyText(review.reply?.comment || '')
    setIsReplyDialogOpen(true)
  }

  const handleSubmitReply = async () => {
    if (!selectedReview || !replyText.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi')
      return
    }

    try {
      setIsSubmittingReply(true)

      // Mock API call - Replace with actual API call later
      // await productReviewApi.replyToReview(selectedReview.id, {
      //   comment: replyText.trim()
      // })

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      toast.success('Phản hồi thành công!')
      setIsReplyDialogOpen(false)

      // Update review with reply (mock - replace with API refresh later)
      if (selectedReview) {
        const updatedReviews = reviews.map((r) =>
          r.id === selectedReview.id
            ? {
              ...r,
              reply: {
                id: `reply-${Date.now()}`,
                productId: r.productId,
                userId: store?.id || 'store',
                rating: 0,
                comment: replyText.trim(),
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            }
            : r
        )
        setReviews(updatedReviews)
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
    }
  }

  const getRatingStats = () => {
    const stats = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, total: 0, average: 0 }
    reviews.forEach((review) => {
      stats[review.rating as keyof typeof stats]++
      stats.total++
      stats.average += review.rating
    })
    if (stats.total > 0) {
      stats.average = stats.average / stats.total
    }
    return stats
  }

  const stats = getRatingStats()

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
        <p className='text-gray-600'>Quản lý và phản hồi đánh giá từ khách hàng</p>
      </div>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Thống kê đánh giá</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='text-center'>
              <div className='text-3xl font-bold text-green-600 mb-1'>{stats.average.toFixed(1)}</div>
              <div className='flex justify-center mb-2'>{renderStars(Math.round(stats.average))}</div>
              <div className='text-sm text-gray-600'>Đánh giá trung bình</div>
            </div>
            <div className='text-center'>
              <div className='text-3xl font-bold text-blue-600 mb-1'>{stats.total}</div>
              <div className='text-sm text-gray-600'>Tổng số đánh giá</div>
            </div>
            <div className='text-center'>
              <div className='text-3xl font-bold text-purple-600 mb-1'>
                {reviews.filter((r) => r.reply).length}
              </div>
              <div className='text-sm text-gray-600'>Đã phản hồi</div>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className='mt-6 space-y-2'>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats[rating as keyof typeof stats] as number
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
              return (
                <div key={rating} className='flex items-center gap-3'>
                  <span className='text-sm text-gray-600 w-12'>{rating} sao</span>
                  <div className='flex-1 bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-green-500 h-2 rounded-full transition-all'
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className='text-sm text-gray-600 w-8'>{count}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={20} />
                <Input
                  placeholder='Tìm kiếm theo tên sản phẩm...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
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
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className='space-y-4'>
        {loading ? (
          <div className='text-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto'></div>
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
                <div className='flex gap-4'>
                  {/* Product Image */}
                  <img
                    src={review.productImage || 'https://via.placeholder.com/80'}
                    alt={review.productName}
                    className='w-20 h-20 object-cover rounded-lg border'
                  />

                  {/* Review Content */}
                  <div className='flex-1'>
                    <div className='flex items-start justify-between mb-2'>
                      <div>
                        <h3 className='font-semibold text-gray-900 mb-1'>{review.productName}</h3>
                        <div className='flex items-center gap-2 mb-2'>
                          {renderStars(review.rating)}
                          <span className='text-sm text-gray-500'>
                            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                      <Badge variant={review.reply ? 'default' : 'outline'}>
                        {review.reply ? 'Đã phản hồi' : 'Chưa phản hồi'}
                      </Badge>
                    </div>

                    {/* User Info */}
                    <div className='flex items-center gap-2 mb-3'>
                      <div className='w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center'>
                        <span className='text-xs text-gray-600'>
                          {review.userName?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className='text-sm text-gray-700'>{review.userName || 'Khách hàng'}</span>
                    </div>

                    {/* Comment */}
                    <p className='text-gray-700 mb-3'>{review.comment}</p>

                    {/* Review Images */}
                    {review.imageUrl && review.imageUrl.length > 0 && (
                      <div className='flex gap-2 mb-3'>
                        {review.imageUrl.map((img, index) => (
                          <img
                            key={index}
                            src={img}
                            alt={`Review image ${index + 1}`}
                            className='w-16 h-16 object-cover rounded-lg border'
                          />
                        ))}
                      </div>
                    )}

                    {/* Store Reply */}
                    {review.reply && (
                      <div className='bg-green-50 border border-green-200 rounded-lg p-3 mb-3'>
                        <div className='flex items-center gap-2 mb-1'>
                          <span className='text-sm font-medium text-green-800'>Phản hồi từ cửa hàng</span>
                          <span className='text-xs text-green-600'>
                            {new Date(review.reply.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <p className='text-sm text-green-700'>{review.reply.comment}</p>
                      </div>
                    )}

                    {/* Reply Button */}
                    {!review.reply && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleReply(review)}
                        className='text-green-600 border-green-600 hover:bg-green-50'
                      >
                        <MessageSquare size={16} className='mr-2' />
                        Phản hồi
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phản hồi đánh giá</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-gray-600 mb-2'>Sản phẩm: {selectedReview?.productName}</p>
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsReplyDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmitReply}
              disabled={isSubmittingReply || !replyText.trim()}
              className='bg-green-600 hover:bg-green-700'
            >
              {isSubmittingReply ? 'Đang gửi...' : 'Gửi phản hồi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

