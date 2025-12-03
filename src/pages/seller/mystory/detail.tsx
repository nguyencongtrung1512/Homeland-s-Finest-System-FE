import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import Loading from '../../../components/Loading/loading'
import { storeStoryApi } from '../../../apis/storeStory.api'
import type { StoreStory } from '../../../types/storeStoryType'
import { formatDate } from '../../../utils/formatDate'
import { Stream } from '@cloudflare/stream-react'
import { StoryContentCarousel } from '../../../components/ui/next-storyConten'

interface StoryDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storyId: string | null
  onRefresh?: () => void
}

function StoryDetailModal({ open, onOpenChange, storyId }: StoryDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [story, setStory] = useState<StoreStory | null>(null)
  const [error, setError] = useState<string | null>(null)


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
      </DialogContent>

    </Dialog>
  )
}

export default StoryDetailModal
