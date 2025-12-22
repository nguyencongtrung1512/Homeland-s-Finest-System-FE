import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '../../../components/ui/alert-dialog'
import Loading from '../../../components/Loading/loading'
import { storeStoryApi } from '../../../apis/storeStory.api'
import type { StoreStory } from '../../../types/storeStoryType'
import { formatDate } from '../../../utils/formatDate'
import { Stream } from '@cloudflare/stream-react'
import { StoryContentCarousel } from '../../../components/ui/next-storyConten'
import { Edit, Loader2, Trash } from 'lucide-react'
import { toast } from '../../../utils/toast'
import path from '../../../constants/path'
import { StoreStoryContentType, isVideoContent, isTextContent, isImageContent } from '../../../constants/storeStoryContentType'

interface StoryDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storyId: string | null
  onRefresh?: () => void
}

function StoryDetailModal({ open, onOpenChange, storyId, onRefresh }: StoryDetailModalProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [story, setStory] = useState<StoreStory | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [activeStoriesCount, setActiveStoriesCount] = useState<number | null>(null)


  const fetchStoryDetail = async () => {
    if (!storyId) return

    try {
      setLoading(true)
      setError(null)

      const response = await storeStoryApi.getById(storyId)
      const storyData = response.data
      setStory(storyData)

      // Fetch active stories count for validation
      if (storyData.storeId) {
        try {
          const storiesResponse = await storeStoryApi.getByStore(storyData.storeId)
          const stories = Array.isArray(storiesResponse.data) ? storiesResponse.data : []
          // Count stories where isActive is not false (includes true and null/undefined)
          const activeCount = stories.filter((s: StoreStory) => s.isActive !== false).length
          setActiveStoriesCount(activeCount)
        } catch (err) {
          console.error('Error fetching active stories count:', err)
        }
      }
    } catch (error) {
      console.error('Error fetching story detail:', error)
      setError('Không thể tải thông tin chi tiết câu chuyện')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    if (!storyId) return
    // Navigate to edit page
    navigate(`${path.BASE_SELLER}/${path.editMyStorySeller.replace(':storyId', storyId)}`)
    onOpenChange(false)
  }

  const handleDeactivate = async () => {
    if (!storyId || !story) return

    // Validation: Check if this is the only active story
    // activeStoriesCount includes current story, so if <= 1, it means only this story is active
    if (activeStoriesCount !== null && activeStoriesCount <= 1 && story.isActive !== false) {
      toast.error('Cửa hàng phải có ít nhất 1 câu chuyện đang hoạt động. Không thể xóa câu chuyện này.')
      setShowDeactivateDialog(false)
      return
    }

    try {
      setIsDeactivating(true)

      // Lấy dữ liệu text/description hiện có từ contents để thỏa validation backend
      const findContent = (contentType: string) =>
        story.contents?.find((c) => (c.contentType || '').toLowerCase() === contentType.toLowerCase())

      const textIntroContent = findContent(StoreStoryContentType.TextIntro)
      const textExpandedContent = findContent(StoreStoryContentType.TextExpanded)
      const textClosingContent = findContent(StoreStoryContentType.TextClosing)
      const videoOpenerContent = findContent(StoreStoryContentType.VideoOpener)
      const singleImageContent = findContent(StoreStoryContentType.SingleImage)
      const imageGalleryContent = findContent(StoreStoryContentType.ImageGallery)
      const videoProcessContent = findContent(StoreStoryContentType.VideoProcess)
      const videoTestimonialContent = findContent(StoreStoryContentType.VideoTestimonial)

      const payload = {
        Title: story.title || '',
        TextIntro: textIntroContent?.contentData || '',
        TextExpanded: textExpandedContent?.contentData || '',
        TextClosing: textClosingContent?.contentData || '',
        VideoOpenerDescription: videoOpenerContent?.contentData || '',
        SingleImageDescription: singleImageContent?.contentData || '',
        GalleryDescription: imageGalleryContent?.contentData || '',
        VideoProcessDescription: videoProcessContent?.contentData || '',
        VideoTestimonialDescription: videoTestimonialContent?.contentData || '',
        StoreId: story.storeId || ''
      }

      // Use update API with IsActive = false
      await storeStoryApi.deactivateUsingUpdate(storyId, payload)
      toast.success('Câu chuyện đã được xóa thành công')
      setShowDeactivateDialog(false)
      onOpenChange(false)
      if (onRefresh) {
        onRefresh()
      }
    } catch (error: any) {
      console.error('Error deleting story:', error)
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể xóa câu chuyện. Vui lòng thử lại sau.'
      toast.error('Lỗi', errorMessage)
      setShowDeactivateDialog(false)
    } finally {
      setIsDeactivating(false)
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

  // Helper function to extract Cloudflare Stream video ID from URL
  const extractVideoId = (url: string): string | undefined => {
    try {
      // Cloudflare Stream URL format: https://customer-xxx.cloudflarestream.com/{videoId}/watch
      // or: https://customer-xxx.cloudflarestream.com/{videoId}/manifest/video.m3u8
      const match = url.match(/cloudflarestream\.com\/([a-f0-9]+)/i)
      return match ? match[1] : undefined
    } catch {
      return undefined
    }
  }

  // Process video data to get video sources and ID
  const processVideo = (content: StoreStory['contents'][0]) => {
    let video = ''
    let videoId: string | undefined = undefined
    let videoSources: { hls?: string; dash?: string; preview?: string; fallback?: string } | undefined = undefined

    // Priority according to document: videoPlayBackUrl (Priority 1) > videoPreviewUrl (Priority 2) > videoFallBackUrl (Priority 3)
    if (content.videoPlayBackUrl) {
      // Try to extract video ID from any Cloudflare Stream URL
      const playbackVideoId = extractVideoId(content.videoPlayBackUrl)
      videoId = playbackVideoId

      // Parse videoPlayBackUrl: contains both HLS (.m3u8) and DASH (.mpd) URLs
      const playbackUrls = content.videoPlayBackUrl.split(',').map((url) => url.trim())
      const hlsUrl = playbackUrls.find((url) => url.includes('.m3u8'))
      const dashUrl = playbackUrls.find((url) => url.includes('.mpd'))

      // Build videoSources object, only including URLs that exist
      videoSources = {}
      if (hlsUrl) videoSources.hls = hlsUrl
      if (dashUrl) videoSources.dash = dashUrl
      // Include preview as fallback for browsers that don't support HLS/DASH
      if (content.videoPreviewUrl?.trim()) {
        videoSources.preview = content.videoPreviewUrl.trim()
      }
      if (content.videoFallBackUrl?.trim()) {
        videoSources.fallback = content.videoFallBackUrl.trim()
      }

      // Use preview URL as primary (most compatible), fallback to HLS/DASH if preview not available
      video =
        content.videoPreviewUrl?.trim() ||
        hlsUrl ||
        dashUrl ||
        content.videoFallBackUrl?.trim() ||
        playbackUrls[0] ||
        ''
    } else if (content.videoPreviewUrl) {
      video = content.videoPreviewUrl.trim()
      const previewVideoId = extractVideoId(video)
      videoId = previewVideoId
      videoSources = {
        preview: content.videoPreviewUrl.trim(),
        fallback: content.videoFallBackUrl?.trim() || undefined
      }
    } else if (content.videoFallBackUrl) {
      video = content.videoFallBackUrl.trim()
      const fallbackVideoId = extractVideoId(video)
      videoId = fallbackVideoId
      videoSources = {
        fallback: content.videoFallBackUrl.trim()
      }
    }

    return { video, videoId, videoSources }
  }

  const renderContent = (content: StoreStory['contents'][0]) => {
    const contentType = content.contentType || ''

    // Use new contentType values: VideoOpener, TextIntro, SingleImage, TextExpanded, VideoProcess, ImageGallery, VideoTestimonial, TextClosing
    // Check by specific contentType first, then fallback to helper functions for backward compatibility

    // Handle video content types
    if (isVideoContent(contentType)) {
      const { video, videoId, videoSources } = processVideo(content)

      if (!video && !videoId) {
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

      return (
        <div className='space-y-2'>
          <div className='aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200'>
            {/* Use Cloudflare Stream component if video ID is available */}
            {videoId ? (
              <div className='w-full aspect-video'>
                <Stream
                  src={videoId}
                  controls
                  responsive
                  className='w-full h-full'
                  preload='metadata'
                />
              </div>
            ) : (
              /* Fallback to regular video tag if no video ID */
              <video
                controls
                className='w-full aspect-video'
                preload='metadata'
                playsInline
              >
                {/* Priority: Preview (for compatibility) > HLS > DASH > Fallback > Direct URL */}
                {/* Preview URL first - works on all browsers, including those without HLS/DASH support */}
                {videoSources?.preview && (
                  <source src={videoSources.preview} type='video/mp4' />
                )}
                {/* HLS - supported by Safari, iOS, and some Android browsers */}
                {videoSources?.hls && (
                  <source src={videoSources.hls} type='application/vnd.apple.mpegurl' />
                )}
                {/* DASH - supported by Chrome, Firefox, Edge (with proper codec support) */}
                {videoSources?.dash && (
                  <source src={videoSources.dash} type='application/dash+xml' />
                )}
                {/* Fallback URL */}
                {videoSources?.fallback && (
                  <source src={videoSources.fallback} type='video/mp4' />
                )}
                {/* Fallback to direct video URL if no sources or if videoSources is empty */}
                {(!videoSources ||
                  (!videoSources.hls &&
                    !videoSources.dash &&
                    !videoSources.preview &&
                    !videoSources.fallback)) && (
                    <source src={video} type='video/mp4' />
                  )}
                Trình duyệt của bạn không hỗ trợ video.
              </video>
            )}
          </div>
          {content.contentData && content.contentData !== 'string' && (
            <p className='text-sm text-gray-600 italic mt-2'>{content.contentData}</p>
          )}
        </div>
      )
    }

    // Handle text content types
    if (isTextContent(contentType)) {
      return (
        <div className='bg-gray-50 p-4 rounded-lg'>
          <p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>
            {content.contentData || 'Không có nội dung'}
          </p>
        </div>
      )
    }

    // Handle image content types
    if (isImageContent(contentType)) {
      // Handle image URLs - can be null or array
      const imageUrls =
        content.imageUrls && Array.isArray(content.imageUrls) && content.imageUrls.length > 0 ? content.imageUrls : []

      if (imageUrls.length > 0) {
        return (
          <div className='space-y-2'>
            <StoryContentCarousel imageUrls={imageUrls} showBadge={false} />
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

    // Backward compatibility: handle old contentType format (lowercase)
    const contentTypeLower = contentType?.toLowerCase()
    if (contentTypeLower === 'text') {
      return (
        <div className='bg-gray-50 p-4 rounded-lg'>
          <p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>
            {content.contentData || 'Không có nội dung'}
          </p>
        </div>
      )
    }

    if (contentTypeLower === 'video') {
      const { video, videoId, videoSources } = processVideo(content)

      if (!video && !videoId) {
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

      return (
        <div className='space-y-2'>
          <div className='aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200'>
            {videoId ? (
              <div className='w-full aspect-video'>
                <Stream
                  src={videoId}
                  controls
                  responsive
                  className='w-full h-full'
                  preload='metadata'
                />
              </div>
            ) : (
              <video
                controls
                className='w-full aspect-video'
                preload='metadata'
                playsInline
              >
                {videoSources?.preview && (
                  <source src={videoSources.preview} type='video/mp4' />
                )}
                {videoSources?.hls && (
                  <source src={videoSources.hls} type='application/vnd.apple.mpegurl' />
                )}
                {videoSources?.dash && (
                  <source src={videoSources.dash} type='application/dash+xml' />
                )}
                {videoSources?.fallback && (
                  <source src={videoSources.fallback} type='video/mp4' />
                )}
                {(!videoSources ||
                  (!videoSources.hls &&
                    !videoSources.dash &&
                    !videoSources.preview &&
                    !videoSources.fallback)) && (
                    <source src={video} type='video/mp4' />
                  )}
                Trình duyệt của bạn không hỗ trợ video.
              </video>
            )}
          </div>
          {content.contentData && content.contentData !== 'string' && (
            <p className='text-sm text-gray-600 italic mt-2'>{content.contentData}</p>
          )}
        </div>
      )
    }

    if (contentTypeLower === 'image') {
      const imageUrls =
        content.imageUrls && Array.isArray(content.imageUrls) && content.imageUrls.length > 0 ? content.imageUrls : []

      if (imageUrls.length > 0) {
        return (
          <div className='space-y-2'>
            <StoryContentCarousel imageUrls={imageUrls} showBadge={false} />
            {content.contentData && content.contentData !== 'string' && (
              <p className='text-sm text-gray-600 italic mt-2'>{content.contentData}</p>
            )}
          </div>
        )
      }
      if (content.contentData && content.contentData !== 'string') {
        return (
          <div className='bg-gray-50 p-4 rounded-lg'>
            <p className='text-gray-700'>{content.contentData}</p>
          </div>
        )
      }
      return null
    }

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
              <img key={idx} src={url} alt={`Hình ảnh ${idx + 1}`} className='w-full rounded' />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl md:max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden rounded-2xl'>
        <DialogHeader className='px-6 pt-6 pb-4 flex-shrink-0'>
          <DialogTitle className='text-2xl font-bold text-green-700 flex items-center justify-between'>
            <span>Chi tiết câu chuyện</span>
            <button
              onClick={() => onOpenChange(false)}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            ></button>
          </DialogTitle>
          <DialogDescription>Xem thông tin chi tiết về câu chuyện của bạn</DialogDescription>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent'>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <Loading />
            </div>
          ) : error ? (
            <div className='text-center py-12'>
              <p className='text-red-600'>{error}</p>
            </div>
          ) : story ? (
            <div className='bg-white rounded-lg p-8 shadow-sm'>
              <div className='max-w-4xl mx-auto space-y-6'>
                {/* Story Title */}
                <div className='text-center border-b border-gray-200 pb-4'>
                  <h2 className='text-3xl font-bold text-gray-900 mb-2'>{story.title}</h2>
                  <p className='text-sm text-gray-500'>Ngày tạo: {formatDate(story.createdAt)}</p>
                </div>

                {/* Story Contents */}
                {story.contents && story.contents.length > 0 ? (
                  <div className='space-y-6'>
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
            </div>
          ) : null}
        </div>

        {/* Dialog Footer with Action Buttons */}
        {story && !loading && !error && (
          <DialogFooter className='px-6 pb-6 pt-4 border-t border-gray-200 flex-shrink-0 gap-2'>
            <Button
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isDeactivating}
            >
              Đóng
            </Button>
            {story.isActive !== false && (
              <>
                <Button
                  variant='outline'
                  onClick={handleEdit}
                  disabled={isDeactivating}
                  className='text-blue-600 border-blue-600 hover:bg-blue-50'
                >
                  <Edit className='w-4 h-4 mr-2' />
                  Chỉnh sửa
                </Button>
                <Button
                  variant='outline'
                  onClick={() => setShowDeactivateDialog(true)}
                  disabled={isDeactivating}
                  className='text-orange-600 border-orange-600 hover:bg-orange-50'
                >
                  <Trash className='w-4 h-4 mr-2' />
                  Xóa
                </Button>
              </>
            )}
            {story.isActive === false && (
              <Button
                variant='outline'
                onClick={handleEdit}
                disabled={isDeactivating}
                className='text-blue-600 border-blue-600 hover:bg-blue-50'
              >
                <Edit className='w-4 h-4 mr-2' />
                Chỉnh sửa
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa câu chuyện này</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa câu chuyện <strong>"{story?.title}"</strong>?
              <br />
              <br />
              {activeStoriesCount !== null && activeStoriesCount <= 1 && story?.isActive !== false && (
                <span className='text-red-600 font-semibold'>
                  Cảnh báo: Đây là câu chuyện đang hoạt động duy nhất. Cửa hàng phải có ít nhất 1 câu chuyện đang hoạt động.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeactivateDialog(false)} disabled={isDeactivating}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={isDeactivating || (activeStoriesCount !== null && activeStoriesCount <= 1 && story?.isActive !== false)}
              className='bg-orange-600 hover:bg-orange-700'
            >
              {isDeactivating ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận xóa câu chuyện này'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

export default StoryDetailModal
