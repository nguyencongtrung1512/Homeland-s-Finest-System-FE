import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { BookOpen } from 'lucide-react'
import { Stream } from '@cloudflare/stream-react'
import { productStoryApi } from '../../../apis/productStory.api'
import type { ProductStory } from '../../../types/productStoryType'

interface ProductStoryProps {
  productId: string
}

interface ProcessedStoryData {
  title: string
  content: string
  images: string[]
  video: string
  videoId?: string
  videoSources?: { hls?: string; dash?: string; preview?: string; fallback?: string }
}

function ProductStoryComponent({ productId }: ProductStoryProps) {
  const [stories, setStories] = useState<ProductStory[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch stories when component mounts or productId changes
  const fetchStories = async () => {
    try {
      setLoading(true)
      const response = await productStoryApi.getByProductId(productId)

      if (response.status === 200) {
        // Response structure: { status, message, data: ProductStory }
        const storyData = response.data?.data || response.data
        if (storyData) {
          setStories([storyData])
        } else {
          setStories([])
        }
      }
    } catch {
      console.error('❌ Error fetching stories')
      toast.error('Không thể tải danh sách câu chuyện')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (productId) {
      fetchStories()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  // Process ProductStory data to match component's expected format
  const processStoryData = (story: ProductStory): ProcessedStoryData => {
    // Sort all contents by order
    const sortedContents = [...story.contents].sort((a, b) => a.order - b.order)

    const textParts: string[] = []
    const images: string[] = []
    let video = ''
    let videoId: string | undefined = undefined
    let videoSources: { hls?: string; dash?: string; preview?: string; fallback?: string } | undefined = undefined

    // Helper function to check if a string is a URL
    const isUrl = (str: string): boolean => {
      try {
        return str.startsWith('http://') || str.startsWith('https://')
      } catch {
        return false
      }
    }

    // Helper function to check if a string is a JSON array
    const isJsonArray = (str: string): boolean => {
      return str.trim().startsWith('[') && str.trim().endsWith(']')
    }

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

    // Process each content item based on actual data structure, not contentType
    sortedContents.forEach((content) => {
      const contentData = content.contentData?.trim() || ''

      // Check for video URLs (for Cloudflare Stream videos)
      // Priority according to document: videoPlayBackUrl (Priority 1) > videoPreviewUrl (Priority 2) > videoFallBackUrl (Priority 3)
      // Only set video if not already set (first video found wins)
      if (!video) {
        // Try to extract video ID from any Cloudflare Stream URL
        const previewVideoId = content.videoPreviewUrl ? extractVideoId(content.videoPreviewUrl) : undefined
        const playbackVideoId = content.videoPlayBackUrl ? extractVideoId(content.videoPlayBackUrl) : undefined
        const fallbackVideoId = content.videoFallBackUrl ? extractVideoId(content.videoFallBackUrl) : undefined

        // Use the first available video ID
        videoId = previewVideoId || playbackVideoId || fallbackVideoId

        if (content.videoPlayBackUrl) {
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
          videoSources = {
            preview: content.videoPreviewUrl.trim(),
            fallback: content.videoFallBackUrl?.trim() || undefined
          }
        } else if (content.videoFallBackUrl) {
          video = content.videoFallBackUrl.trim()
          videoSources = {
            fallback: content.videoFallBackUrl.trim()
          }
        }
      }

      // Process contentData (skip if empty)
      if (!contentData) {
        return
      }

      // Check if contentData is a JSON array (for images)
      if (isJsonArray(contentData)) {
        try {
          const parsed = JSON.parse(contentData)
          if (Array.isArray(parsed)) {
            // Check if array contains URLs (images/videos)
            const urls = parsed.filter((item) => typeof item === 'string' && isUrl(item))
            if (urls.length > 0) {
              // Check if any URL is a video (only if we don't already have a video from video URLs)
              if (!video) {
                const videoUrl = urls.find(
                  (url) =>
                    url.includes('.mp4') ||
                    url.includes('.mov') ||
                    url.includes('video.m3u8') ||
                    url.includes('video.mpd')
                )
                if (videoUrl) {
                  video = videoUrl
                  // Remove video from images array
                  const imageUrls = urls.filter((url) => url !== videoUrl)
                  images.push(...imageUrls)
                } else {
                  // All are images
                  images.push(...urls)
                }
              } else {
                // We already have a video, treat all as images
                images.push(...urls)
              }
            }
          }
        } catch {
          // If parsing fails, treat as text
          textParts.push(contentData)
        }
      } else if (isUrl(contentData)) {
        // Single URL - check if it's video or image
        if (
          !video &&
          (contentData.includes('.mp4') ||
            contentData.includes('.mov') ||
            contentData.includes('video.m3u8') ||
            contentData.includes('video.mpd'))
        ) {
          video = contentData
        } else {
          // Assume it's an image (or we already have a video)
          images.push(contentData)
        }
      } else {
        // Plain text content
        textParts.push(contentData)
      }
    })

    return {
      title: story.title || '',
      content: textParts.join('\n\n'),
      images,
      video,
      videoId,
      videoSources
    }
  }

  // Get current story data for display
  const currentStory = stories.length > 0 ? processStoryData(stories[0]) : null

  if (loading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center'>Đang tải...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-green-700 flex items-center gap-2'>
          <BookOpen className='w-5 h-5 text-green-600' />
          Câu chuyện sản phẩm
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {currentStory ? (
            <>
              <div className='flex flex-col items-center'>
                <h3 className='text-xl font-semibold text-gray-900 mb-3 text-center w-full'>{currentStory.title}</h3>
                <p className='text-gray-700 whitespace-pre-wrap leading-relaxed max-w-4xl'>{currentStory.content}</p>
              </div>

              {/* Story Images */}
              {currentStory.images && currentStory.images.length > 0 && (
                <div className='flex flex-col items-center'>
                  <h4 className='text-lg font-medium text-gray-900 mb-4 text-center w-full'>Hình ảnh minh họa</h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl justify-items-center'>
                    {currentStory.images.map((image: string, index: number) => (
                      <div key={index} className='aspect-video bg-gray-100 rounded-lg overflow-hidden w-full max-w-md'>
                        <img
                          src={image}
                          alt={`Story ${index + 1}`}
                          className='w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer'
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Story Video */}
              {currentStory.video && (
                <div className='flex flex-col items-center'>
                  <h4 className='text-lg font-medium text-gray-900 mb-4 text-center w-full'>Video câu chuyện</h4>
                  {/* Use Cloudflare Stream component if video ID is available */}
                  {currentStory.videoId ? (
                    <div className='w-full max-w-4xl rounded-lg overflow-hidden'>
                      <Stream src={currentStory.videoId} controls responsive className='w-full' preload='metadata' />
                    </div>
                  ) : (
                    /* Fallback to regular video tag if no video ID */
                    <div className='w-full max-w-4xl rounded-lg overflow-hidden'>
                      <video controls className='w-full rounded-lg' preload='metadata' playsInline>
                        {/* Priority: Preview (for compatibility) > HLS > DASH > Fallback > Direct URL */}
                        {/* Preview URL first - works on all browsers, including those without HLS/DASH support */}
                        {currentStory.videoSources?.preview && (
                          <source src={currentStory.videoSources.preview} type='video/mp4' />
                        )}
                        {/* HLS - supported by Safari, iOS, and some Android browsers */}
                        {currentStory.videoSources?.hls && (
                          <source src={currentStory.videoSources.hls} type='application/vnd.apple.mpegurl' />
                        )}
                        {/* DASH - supported by Chrome, Firefox, Edge (with proper codec support) */}
                        {currentStory.videoSources?.dash && (
                          <source src={currentStory.videoSources.dash} type='application/dash+xml' />
                        )}
                        {/* Fallback URL */}
                        {currentStory.videoSources?.fallback && (
                          <source src={currentStory.videoSources.fallback} type='video/mp4' />
                        )}
                        {/* Fallback to direct video URL if no sources or if videoSources is empty */}
                        {(!currentStory.videoSources ||
                          (!currentStory.videoSources.hls &&
                            !currentStory.videoSources.dash &&
                            !currentStory.videoSources.preview &&
                            !currentStory.videoSources.fallback)) && (
                          <source src={currentStory.video} type='video/mp4' />
                        )}
                        Trình duyệt của bạn không hỗ trợ video.
                      </video>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className='text-center py-12'>
              <BookOpen className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>Chưa có câu chuyện</h3>
              <p className='text-gray-500'>Chưa có thông tin câu chuyện về sản phẩm này.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ProductStoryComponent
