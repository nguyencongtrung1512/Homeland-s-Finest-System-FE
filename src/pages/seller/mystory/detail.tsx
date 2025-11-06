import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import Loading from '../../../components/Loading/loading'
import { storeStoryApi } from '../../../apis/storeStory.api'
import type { StoreStory } from '../../../types/storeStoryType'
import { X, Edit } from 'lucide-react'
import CreateMyStory from './createMyStory'

interface StoryDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storyId: string | null
  onRefresh?: () => void
}

function StoryDetailModal({ open, onOpenChange, storyId, onRefresh }: StoryDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [story, setStory] = useState<StoreStory | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Extract initial data from story for edit form
  const getInitialData = () => {
    if (!story) return undefined

    // Extract data from contents array
    const contents = story.contents || []

    // Sort contents by order
    const sortedContents = [...contents].sort((a, b) => a.order - b.order)

    // Find text contents
    const textContents = sortedContents.filter((c) => c.contentType?.toLowerCase() === 'text')
    // Find video contents
    const videoContents = sortedContents.filter((c) => c.contentType?.toLowerCase() === 'video')
    // Find image contents
    const imageContents = sortedContents.filter((c) => c.contentType?.toLowerCase() === 'image')

    // Extract text fields by order
    // Order 1: TextIntro, Order 3: TextExpanded, Order 5: TextClosing
    const textIntro = textContents.find((c) => c.order === 1)
    const textExpanded = textContents.find((c) => c.order === 3)
    const textClosing = textContents.find((c) => c.order === 5)

    // Extract video fields by order
    // Order 2: VideoOpener, Order 4: VideoProcess, Order 5: VideoTestimonial
    const videoOpener = videoContents.find((c) => c.order === 2)
    const videoProcess = videoContents.find((c) => c.order === 4)
    const videoTestimonial = videoContents.find((c) => c.order === 5)

    // Extract image fields by order
    // Order 2: SingleImage, Order 3: GalleryImages
    const singleImage = imageContents.find((c) => c.order === 2)
    const galleryImages = imageContents.find((c) => c.order === 3)

    // Get video URLs (prefer playback, fallback to preview, then fallback)
    const getVideoUrl = (content: (typeof videoContents)[0] | undefined) => {
      if (!content) return null
      return content.videoPlayBackUrl || content.videoPreviewUrl || content.videoFallBackUrl || null
    }

    // Get single image URL
    const getSingleImageUrl = (content: (typeof imageContents)[0] | undefined) => {
      if (!content || !content.imageUrls || content.imageUrls.length === 0) return null
      return content.imageUrls[0] || null
    }

    // Get gallery image URLs
    const getGalleryImageUrls = (content: (typeof imageContents)[0] | undefined) => {
      if (!content || !content.imageUrls || content.imageUrls.length === 0) return []
      return content.imageUrls
    }

    return {
      Title: story.title || '',
      TextIntro: textIntro?.contentData || '',
      TextExpanded: textExpanded?.contentData || '',
      TextClosing: textClosing?.contentData || '',
      VideoOpenerDescription: videoOpener?.contentData || '',
      VideoOpenerUrl: getVideoUrl(videoOpener),
      SingleImageDescription: singleImage?.contentData || '',
      SingleImageUrl: getSingleImageUrl(singleImage),
      GalleryDescription: galleryImages?.contentData || '',
      GalleryImageUrls: getGalleryImageUrls(galleryImages),
      VideoProcessDescription: videoProcess?.contentData || '',
      VideoProcessUrl: getVideoUrl(videoProcess),
      VideoTestimonialDescription: videoTestimonial?.contentData || '',
      VideoTestimonialUrl: getVideoUrl(videoTestimonial),
      ThumbnailUrl: story.thumbnailUrl || null
    }
  }

  const handleEditSuccess = () => {
    setShowEditDialog(false)
    if (onRefresh) {
      onRefresh()
    }
    // Refresh story detail
    if (storyId) {
      fetchStoryDetail()
    }
  }

  const fetchStoryDetail = async () => {
    if (!storyId) return

    try {
      setLoading(true)
      setError(null)

      const response = await storeStoryApi.getById(storyId)
      setStory(response.data)
    } catch (error) {
      console.error('Error fetching story detail:', error)
      setError('Không thể tải thông tin chi tiết câu chuyện')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && storyId) {
      fetchStoryDetail()
    } else {
      setStory(null)
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, storyId])

  const renderContent = (content: StoreStory['contents'][0]) => {
    // Normalize contentType to handle both lowercase and capitalized versions
    const contentType = content.contentType?.toLowerCase() || ''

    switch (contentType) {
      case 'text': {
        return (
          <div className='bg-gray-50 p-4 rounded-lg'>
            <p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>
              {content.contentData || 'Không có nội dung'}
            </p>
          </div>
        )
      }

      case 'video': {
        // Try to get video URL from any available source
        const videoUrl = content.videoPlayBackUrl || content.videoPreviewUrl || content.videoFallBackUrl || null

        if (videoUrl) {
          return (
            <div className='space-y-2'>
              <div className='aspect-video bg-gray-100 rounded-lg overflow-hidden'>
                <video controls className='w-full h-full'>
                  <source src={videoUrl} type='video/mp4' />
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
              </div>
              {content.contentData && content.contentData !== 'string' && (
                <p className='text-sm text-gray-600 italic mt-2'>{content.contentData}</p>
              )}
            </div>
          )
        }
        // If no video URL but has contentData, show as text
        if (content.contentData && content.contentData !== 'string') {
          return (
            <div className='bg-yellow-50 border border-yellow-200 p-4 rounded-lg'>
              <p className='text-yellow-800 text-sm'>
                <strong>Video:</strong> {content.contentData}
              </p>
              <p className='text-yellow-600 text-xs mt-1'>Video URL không khả dụng</p>
            </div>
          )
        }
        return null
      }

      case 'image': {
        // Handle image URLs - can be null or array
        const imageUrls =
          content.imageUrls && Array.isArray(content.imageUrls) && content.imageUrls.length > 0 ? content.imageUrls : []

        if (imageUrls.length > 0) {
          return (
            <div className='space-y-2'>
              <div className={`grid gap-4 ${imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                {imageUrls.map((imageUrl, index) => (
                  <div key={index} className='aspect-video bg-gray-100 rounded-lg overflow-hidden'>
                    <img
                      src={imageUrl}
                      alt={`Story image ${index + 1}`}
                      className='w-full h-full object-cover'
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'https://via.placeholder.com/800x400?text=No+Image'
                      }}
                    />
                  </div>
                ))}
              </div>
              {content.contentData && content.contentData !== 'string' && (
                <p className='text-sm text-gray-600 italic mt-2'>{content.contentData}</p>
              )}
            </div>
          )
        }
        // If no images but has contentData, show as text
        if (content.contentData && content.contentData !== 'string') {
          return (
            <div className='bg-gray-50 p-4 rounded-lg'>
              <p className='text-gray-700'>{content.contentData}</p>
            </div>
          )
        }
        return null
      }

      default:
        // Fallback for unknown content types
        return (
          <div className='bg-gray-50 p-4 rounded-lg'>
            <p className='text-xs text-gray-500 mb-2'>Loại: {content.contentType || 'Không xác định'}</p>
            {content.contentData && content.contentData !== 'string' && (
              <p className='text-gray-700'>{content.contentData}</p>
            )}
            {content.imageUrls && content.imageUrls.length > 0 && (
              <div className='grid grid-cols-2 gap-2 mt-2'>
                {content.imageUrls.map((url, idx) => (
                  <img key={idx} src={url} alt={`Image ${idx + 1}`} className='w-full rounded' />
                ))}
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold text-green-700 flex items-center justify-between'>
            <span>Chi tiết câu chuyện</span>
            <button onClick={() => onOpenChange(false)} className='text-gray-400 hover:text-gray-600 transition-colors'>
              <X className='w-5 h-5' />
            </button>
          </DialogTitle>
          <DialogDescription>Xem thông tin chi tiết về câu chuyện của bạn</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <Loading />
          </div>
        ) : error ? (
          <div className='text-center py-12'>
            <p className='text-red-600'>{error}</p>
          </div>
        ) : story ? (
          <div className='space-y-6 py-4'>
            {/* Title and Edit Button */}
            <div className='flex items-start justify-between'>
              <div>
                <h2 className='text-2xl font-bold text-gray-900'>{story.title}</h2>
                <p className='text-sm text-gray-500 mt-1'>
                  Ngày tạo: {new Date(story.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <Button onClick={() => setShowEditDialog(true)} className='bg-green-600 hover:bg-green-700 text-white'>
                <Edit className='w-4 h-4 mr-2' />
                Chỉnh sửa
              </Button>
            </div>

            {/* Thumbnail */}
            {story.thumbnailUrl && (
              <div className='aspect-video bg-gray-100 rounded-lg overflow-hidden'>
                <img src={story.thumbnailUrl} alt={story.title} className='w-full h-full object-cover' />
              </div>
            )}

            {/* Contents */}
            {story.contents && story.contents.length > 0 ? (
              <div className='space-y-6'>
                <h3 className='text-xl font-semibold text-gray-900'>Nội dung</h3>
                {story.contents
                  .sort((a, b) => a.order - b.order)
                  .map((content) => (
                    <div key={content.id} className='space-y-2'>
                      {renderContent(content)}
                    </div>
                  ))}
              </div>
            ) : (
              <div className='text-center py-8 text-gray-500'>
                <p>Chưa có nội dung nào</p>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>

      {/* Edit Story Dialog */}
      {story && (
        <CreateMyStory
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          storyId={storyId}
          initialData={getInitialData()}
          onSuccess={handleEditSuccess}
        />
      )}
    </Dialog>
  )
}

export default StoryDetailModal
