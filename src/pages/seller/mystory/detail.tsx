import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import Loading from '../../../components/Loading/loading'
import { storeStoryApi } from '../../../apis/storeStory.api'
import type { StoreStory } from '../../../types/storeStoryType'
import { Edit } from 'lucide-react'
import CreateMyStory from './createMyStory'
import { formatDate } from '../../../utils/formatDate'
import { Stream } from '@cloudflare/stream-react'

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

    // Debug: Log all contents to see structure
    console.log('All story contents:', JSON.stringify(contents, null, 2))

    // Sort contents by order
    const sortedContents = [...contents].sort((a, b) => a.order - b.order)

    // Find text contents
    const textContents = sortedContents.filter((c) => c.contentType?.toLowerCase() === 'text')
    // Find video contents
    const videoContents = sortedContents.filter((c) => c.contentType?.toLowerCase() === 'video')
    // Find image contents
    const imageContents = sortedContents.filter((c) => c.contentType?.toLowerCase() === 'image')

    console.log(
      'Text contents:',
      textContents.map((c) => ({ order: c.order, data: c.contentData?.substring(0, 50) }))
    )
    console.log(
      'Video contents:',
      videoContents.map((c) => ({ order: c.order, playback: c.videoPlayBackUrl, preview: c.videoPreviewUrl }))
    )
    console.log(
      'Image contents:',
      imageContents.map((c) => ({ order: c.order, urls: c.imageUrls?.length || 0 }))
    )

    // Extract text fields by order and position
    // Text contents should be in order: TextIntro (order 1), TextExpanded (order 3), TextClosing (last text)
    // Try to find by order first, then fallback to position
    const textIntro = textContents.find((c) => c.order === 1) || textContents[0]
    const textExpanded = textContents.find((c) => c.order === 3) || textContents[1]
    // TextClosing is the last text content (usually highest order or last in array)
    const textClosing =
      textContents.find((c) => c.order === 6) ||
      textContents.find((c) => c.order === 5) ||
      textContents[textContents.length - 1]

    // Extract video fields by order and position
    // Video contents should be in order: VideoOpener (order 2), VideoProcess (order 4), VideoTestimonial (last video)
    // Try to find by order first, then fallback to position
    const videoOpener = videoContents.find((c) => c.order === 2) || videoContents[0]
    const videoProcess = videoContents.find((c) => c.order === 4) || videoContents[1]
    // VideoTestimonial is the last video content (usually highest order or last in array)
    const videoTestimonial =
      videoContents.find((c) => c.order === 7) ||
      videoContents.find((c) => c.order === 6) ||
      videoContents.find((c) => c.order === 5) ||
      videoContents[videoContents.length - 1]

    // Extract image fields by order and position
    // Image contents: SingleImage (order 2), GalleryImages (order 3)
    // Try to find by order first, then fallback to position
    const singleImage = imageContents.find((c) => c.order === 2) || imageContents[0]
    const galleryImages = imageContents.find((c) => c.order === 3) || imageContents[1]

    // Get video URLs (prefer playback, fallback to preview, then fallback)
    const getVideoUrl = (content: (typeof videoContents)[0] | undefined) => {
      if (!content) return null
      const url = content.videoPlayBackUrl || content.videoPreviewUrl || content.videoFallBackUrl || null
      console.log('Getting video URL for content:', { order: content.order, url })
      return url
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

    const initialData = {
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

    console.log('Extracted initial data:', initialData)

    return initialData
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
                        target.src = 'https://i.pinimg.com/736x/d6/8a/12/d68a121e960094f99ad8acd37505fb7d.jpg'
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
      <DialogContent className='max-w-4xl md:max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold text-green-700 flex items-center justify-between'>
            <span>Chi tiết câu chuyện</span>
            <button
              onClick={() => onOpenChange(false)}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            ></button>
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
                  Ngày tạo: {formatDate(story.createdAt)}
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
