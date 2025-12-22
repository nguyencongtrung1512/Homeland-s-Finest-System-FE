import { useState, useEffect } from 'react'
import type { FC } from 'react'
import ImageCarousel, { type CarouselItem } from '../../../../components/ui/imagecarousel'
import { StoryContentCarousel } from '../../../../components/ui/next-storyConten'
import { storeStoryApi } from '../../../../apis/storeStory.api'
import type { StoreStory, StoreStoryListResponse } from '../../../../types/storeStoryType'
import { StoreStoryContentType, isVideoContent, isTextContent, isImageContent } from '../../../../constants/storeStoryContentType'
import Loading from '../../../../components/Loading/loading'
import { Stream } from '@cloudflare/stream-react'
import { formatDate } from '../../../../utils/formatDate'

interface StorySectionProps {
  storeName: string
  story: string
  storeId: string
}

const StorySection: FC<StorySectionProps> = ({ storeId }) => {
  const [stories, setStories] = useState<StoreStory[]>([])
  const [selectedStory, setSelectedStory] = useState<StoreStory | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch list of stories
  useEffect(() => {
    const fetchStories = async () => {
      if (!storeId) return

      try {
        setLoading(true)
        setError(null)
        const response: StoreStoryListResponse = await storeStoryApi.getByStore(storeId)
        const storiesData = response.data || []
        // Filter only active stories (isActive may not be in type but exists in API response)
        const activeStories = storiesData.filter((story: StoreStory & { isActive?: boolean }) => {
          return (story as StoreStory & { isActive?: boolean }).isActive !== false
        })
        setStories(activeStories)

        // Auto-select first story if available
        if (activeStories.length > 0 && !selectedStory) {
          handleStoryClick(activeStories[0].id)
        }
      } catch (err) {
        console.error('Error fetching stories:', err)
        setError('Không thể tải danh sách câu chuyện')
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId])

  // Fetch story detail when clicked
  const handleStoryClick = async (storyId: string) => {
    try {
      setLoadingDetail(true)
      const response = await storeStoryApi.getById(storyId)
      setSelectedStory(response.data)
    } catch (err) {
      console.error('Error fetching story detail:', err)
      setError('Không thể tải chi tiết câu chuyện')
    } finally {
      setLoadingDetail(false)
    }
  }

  // Convert stories to carousel items
  const carouselItems: CarouselItem[] = stories.map((story) => ({
    id: story.id,
    name: story.title,
    title: formatDate(story.createdAt),
    img: story.thumbnailUrl || 'https://i.pinimg.com/736x/05/01/bc/0501bcd327d9df915e83154bbf9456e3.jpg'
  }))

  // Helper function to extract Cloudflare Stream video ID from URL
  const extractVideoId = (url: string): string | undefined => {
    try {
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

    if (content.videoPlayBackUrl) {
      const playbackVideoId = extractVideoId(content.videoPlayBackUrl)
      videoId = playbackVideoId

      const playbackUrls = content.videoPlayBackUrl.split(',').map((url: string) => url.trim())
      const hlsUrl = playbackUrls.find((url: string) => url.includes('.m3u8'))
      const dashUrl = playbackUrls.find((url: string) => url.includes('.mpd'))

      videoSources = {}
      if (hlsUrl) videoSources.hls = hlsUrl
      if (dashUrl) videoSources.dash = dashUrl
      if (content.videoPreviewUrl?.trim()) {
        videoSources.preview = content.videoPreviewUrl.trim()
      }
      if (content.videoFallBackUrl?.trim()) {
        videoSources.fallback = content.videoFallBackUrl.trim()
      }

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
    const contentTypeLower = contentType.toLowerCase()

    // Ưu tiên contentType chuẩn
    if (isVideoContent(contentType) || contentTypeLower === 'video') {
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
                  <Stream src={videoId} controls responsive className='w-full h-full' preload='metadata' />
                </div>
              ) : (
                <video controls className='w-full aspect-video' preload='metadata' playsInline>
                  {videoSources?.preview && <source src={videoSources.preview} type='video/mp4' />}
                  {videoSources?.hls && <source src={videoSources.hls} type='application/vnd.apple.mpegurl' />}
                  {videoSources?.dash && <source src={videoSources.dash} type='application/dash+xml' />}
                  {videoSources?.fallback && <source src={videoSources.fallback} type='video/mp4' />}
                  {(!videoSources ||
                    (!videoSources.hls && !videoSources.dash && !videoSources.preview && !videoSources.fallback)) && (
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

    if (isTextContent(contentType) || contentTypeLower === 'text') {
      return (
        <div className='bg-gray-50 p-4 rounded-lg'>
          <p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>
            {content.contentData || 'Không có nội dung'}
          </p>
        </div>
      )
    }

    if (isImageContent(contentType) || contentTypeLower === 'image') {
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

    // Fallback: không hiển thị loại, chỉ hiển thị nội dung và ảnh nếu có
        return (
      <div className='bg-gray-50 p-4 rounded-lg space-y-3'>
            {content.contentData && content.contentData !== 'string' && (
          <p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>{content.contentData}</p>
            )}
            {content.imageUrls && content.imageUrls.length > 0 && (
          <div className='grid grid-cols-2 gap-3'>
                {content.imageUrls.map((url: string, idx: number) => (
              <img
                key={idx}
                src={url}
                alt={`Image ${idx + 1}`}
                className='w-full rounded-md border border-gray-200 object-cover'
              />
                ))}
              </div>
            )}
          </div>
        )
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loading />
        <span className='ml-2 text-gray-600'>Đang tải câu chuyện...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className='bg-white rounded-lg p-8 shadow-sm text-center'>
        <p className='text-red-600'>{error}</p>
      </div>
    )
  }

  if (stories.length === 0) {
    return (
      <div className='bg-white rounded-lg p-8 shadow-sm text-center'>
        <h3 className='text-xl font-semibold text-gray-900 mb-2'>Chưa có câu chuyện nào</h3>
        <p className='text-gray-600'>Cửa hàng này chưa có câu chuyện nào được chia sẻ.</p>
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      {/* Story Carousel */}
      <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
        <ImageCarousel items={carouselItems} onItemClick={(item: CarouselItem) => handleStoryClick(item.id)} />
      </div>

      {/* Story Detail */}
      {loadingDetail ? (
        <div className='flex items-center justify-center py-12 bg-white rounded-lg shadow-sm'>
          <Loading />
          <span className='ml-2 text-gray-600'>Đang tải chi tiết...</span>
        </div>
      ) : selectedStory ? (
        <div className='bg-white rounded-lg p-8 shadow-sm'>
          <div className='max-w-4xl mx-auto space-y-6'>
            {/* Story Title */}
            <div className='text-center border-b border-gray-200 pb-4'>
              <h2 className='text-3xl font-bold text-gray-900 mb-2'>{selectedStory.title}</h2>
              <p className='text-sm text-gray-500'>Ngày tạo: {formatDate(selectedStory.createdAt)}</p>
            </div>

            {/* Story Contents */}
            {selectedStory.contents && selectedStory.contents.length > 0 ? (
              <div className='space-y-6'>
                {selectedStory.contents
                  .sort((a: StoreStory['contents'][0], b: StoreStory['contents'][0]) => a.order - b.order)
                  .map((content: StoreStory['contents'][0]) => (
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
      ) : (
        <div className='bg-white rounded-lg p-8 shadow-sm text-center'>
          <p className='text-gray-500'>Chọn một câu chuyện để xem chi tiết</p>
        </div>
      )}
    </div>
  )
}

export default StorySection
