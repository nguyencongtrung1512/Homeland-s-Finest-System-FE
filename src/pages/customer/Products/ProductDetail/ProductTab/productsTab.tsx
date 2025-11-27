import React, { useState, useEffect, useMemo } from 'react'
import { useProductDetailContext } from '../productsDetail'
import { productCertificateApi } from '../../../../../apis/productCertificate.api'
import { productStoryApi } from '../../../../../apis/productStory.api'
import type { ProductCertificateType } from '../../../../../types/productCertificateType'
import type { ProductStory } from '../../../../../types/productStoryType'
import Loading from '../../../../../components/Loading/loading'
import { Stream } from '@cloudflare/stream-react'
import ThreeDCarousel from '../../../../../components/ui/3d-caroseu'

interface TabContent {
  id: string
  label: string
  content: React.ReactNode
}

export const ProductTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('description')
  const { product } = useProductDetailContext()
  const [certificates, setCertificates] = useState<ProductCertificateType[]>([])
  const [story, setStory] = useState<ProductStory | null>(null)
  const [certificatesLoading, setCertificatesLoading] = useState(false)
  const [storyLoading, setStoryLoading] = useState(false)
  const [certificatesError, setCertificatesError] = useState<string | null>(null)
  const [storyError, setStoryError] = useState<string | null>(null)

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

  // Process content video data to get video sources and ID
  const processContentVideo = (content: any) => {
    let video = ''
    let videoId: string | undefined = undefined
    let videoSources: { hls?: string; dash?: string; preview?: string; fallback?: string } | undefined = undefined

    // Priority according to document: videoPlayBackUrl (Priority 1) > videoPreviewUrl (Priority 2) > videoFallBackUrl (Priority 3)
    if (content.videoPlayBackUrl) {
      // Try to extract video ID from any Cloudflare Stream URL
      const playbackVideoId = extractVideoId(content.videoPlayBackUrl)
      videoId = playbackVideoId

      // Parse videoPlayBackUrl: contains both HLS (.m3u8) and DASH (.mpd) URLs
      const playbackUrls = content.videoPlayBackUrl.split(',').map((url: string) => url.trim())
      const hlsUrl = playbackUrls.find((url: string) => url.includes('.m3u8'))
      const dashUrl = playbackUrls.find((url: string) => url.includes('.mpd'))

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

  // Fetch certificates
  useEffect(() => {
    if (product?.id) {
      setCertificatesLoading(true)
      setCertificatesError(null)
      productCertificateApi
        .getByProductId(product.id)
        .then((response: any) => {
          if (response.status === 200 && response.data) {
            setCertificates(response.data)
          } else {
            setCertificates([])
          }
        })
        .catch((error: any) => {
          console.error('Error fetching certificates:', error)
          setCertificatesError('Không thể tải chứng chỉ sản phẩm')
          setCertificates([])
        })
        .finally(() => {
          setCertificatesLoading(false)
        })
    }
  }, [product?.id])

  // Fetch story
  useEffect(() => {
    if (product?.id) {
      setStoryLoading(true)
      setStoryError(null)
      productStoryApi
        .getByProductId(product.id)
        .then((response: any) => {
          if (response.status === 200 && response.data) {
            setStory(response.data)
          } else {
            setStory(null)
          }
        })
        .catch((error: any) => {
          console.error('Error fetching story:', error)
          setStoryError('Không thể tải câu chuyện sản phẩm')
          setStory(null)
        })
        .finally(() => {
          setStoryLoading(false)
        })
    }
  }, [product?.id])

  // Collect all images from story for 3D carousel
  const storyImages = useMemo(() => {
    if (!story?.contents) return []
    const images: string[] = []

    story.contents.forEach((content: any) => {
      if (content.contentType === 'image' && content.contentData) {
        images.push(content.contentData)
      } else if (content.contentType === 'media') {
        try {
          const parsed = JSON.parse(content.contentData)
          if (Array.isArray(parsed)) {
            images.push(...parsed)
          }
        } catch {
          const contentData = content.contentData
          if (
            contentData &&
            (contentData.includes('.jpg') ||
              contentData.includes('.jpeg') ||
              contentData.includes('.png') ||
              contentData.includes('/images/'))
          ) {
            images.push(contentData)
          }
        }
      }
    })

    return images
  }, [story])

  const tabs: TabContent[] = [
    {
      id: 'description',
      label: 'Mô tả sản phẩm',
      content: (
        <div className='max-w-4xl mx-auto'>
          {product?.description ? (
            <div className='p-4 max-h-[600px] overflow-y-auto'>
              <div className='text-gray-700 text-base leading-6 whitespace-pre-wrap break-words'>
                {product.description}
              </div>
            </div>
          ) : (
            <p className='text-gray-500 text-base'>Chưa có mô tả cho sản phẩm này.</p>
          )}
        </div>
      )
    },
    {
      id: 'usage',
      label: 'Chứng chỉ sản phẩm',
      content: (
        <div className='max-w-4xl mx-auto'>
          {certificatesLoading ? (
            <div className='flex justify-center py-8'>
              <Loading />
            </div>
          ) : certificatesError ? (
            <div className='text-center py-8'>
              <p className='text-red-500'>{certificatesError}</p>
            </div>
          ) : !certificates || certificates.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-gray-500 text-base'>Chưa có chứng chỉ sản phẩm.</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {certificates
                ?.filter((cert) => cert.status === 'Approved')
                .map((certificate) => (
                  <div key={certificate.id} className='border border-gray-200 rounded-lg overflow-hidden'>
                    <img
                      src={certificate.imageUrl}
                      alt={`Chứng chỉ ${certificate.id}`}
                      className='w-full h-auto object-contain'
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'https://via.placeholder.com/400x300?text=No+Image'
                      }}
                    />
                    {certificate.staffNotes && (
                      <div className='p-4 bg-gray-50'>
                        <p className='text-sm text-gray-600'>{certificate.staffNotes}</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'store story',
      label: 'Câu chuyện sản phẩm',
      content: (
        <div className='max-w-4xl mx-auto'>
          {storyLoading ? (
            <div className='flex justify-center py-8'>
              <Loading />
            </div>
          ) : storyError ? (
            <div className='text-center py-8'>
              <p className='text-red-500'>{storyError}</p>
            </div>
          ) : !story ? (
            <div className='text-center py-8'>
              <p className='text-gray-500 text-base'>Chưa có câu chuyện sản phẩm.</p>
            </div>
          ) : (
            <div className='space-y-6'>
              {/* Title */}
              <div className=' grid grid-cols-1 lg:grid-cols-2'>
                <div>
                  <h3 className='text-black text-xl font-bold'>{story.title}</h3>
                  {story.contents && story.contents.length > 0 ? (
                    <div className=' mt-22'>
                      <div className='lg:col-span-2 space-y-4'>
                        {story.contents
                          .sort((a: any, b: any) => a.order - b.order)
                          .map((content: any) => {
                            if (content.contentType === 'text') {
                              return (
                                <p key={content.id} className='text-gray-700 text-base leading-6 whitespace-pre-wrap'>
                                  {content.contentData}
                                </p>
                              )
                            }
                            return null
                          })}
                      </div>

                      {/* Images List - Right Side with ThreeDCarousel */}

                    </div>
                  ) : (
                    <p className='text-gray-500 text-base'>Chưa có nội dung câu chuyện.</p>
                  )}
                </div>
                {storyImages.length > 0 && (
                  <div className='lg:col-span-1'>
                    <div className='sticky top-6'>
                      <div style={{ height: '500px' }}>
                        <ThreeDCarousel
                          images={storyImages}
                          radius={storyImages.length <= 3 ? 100 : 240}
                          cardW={storyImages.length <= 3 ? 200 : 180}
                          cardH={storyImages.length <= 3 ? 280 : 240}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>



              {/* Video - Bottom */}
              {story.contents &&
                story.contents.length > 0 &&
                (() => {
                  // Find all video contents
                  const videoContents = story.contents
                    .sort((a: any, b: any) => a.order - b.order)
                    .filter((content: any) => {
                      if (content.contentType === 'video') return true
                      if (content.contentType === 'media') {
                        const { video } = processContentVideo(content)
                        if (video) return true
                        // Check if contentData is a video URL
                        try {
                          const parsed = JSON.parse(content.contentData)
                          if (Array.isArray(parsed)) return false
                        } catch {
                          const contentData = content.contentData
                          if (
                            contentData &&
                            (contentData.includes('.mp4') ||
                              contentData.includes('.webm') ||
                              contentData.includes('.ogg') ||
                              contentData.includes('/videos/'))
                          ) {
                            return true
                          }
                        }
                      }
                      return false
                    })

                  if (videoContents.length === 0) return null

                  return (
                    <div className='space-y-4'>
                      {videoContents.map((content: any) => {
                        if (content.contentType === 'video') {
                          return (
                            <div key={content.id} className='flex justify-center'>
                              <div className='w-full max-w-2xl rounded-lg overflow-hidden'>
                                <video controls className='w-full aspect-video rounded-lg' preload='metadata' playsInline>
                                  <source src={content.contentData} type='video/mp4' />
                                  Trình duyệt của bạn không hỗ trợ video.
                                </video>
                              </div>
                            </div>
                          )
                        } else if (content.contentType === 'media') {
                          // First, check if content has video URLs (videoPreviewUrl, videoPlayBackUrl, videoFallBackUrl)
                          const { video, videoId, videoSources } = processContentVideo(content)

                          // If video URLs exist, render video
                          if (video) {
                            return (
                              <div key={content.id} className='flex justify-center'>
                                <div className='w-full max-w-2xl rounded-lg overflow-hidden'>
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
                                      className='w-full aspect-video rounded-lg'
                                      preload='metadata'
                                      playsInline
                                    >
                                      {/* Priority: Preview (for compatibility) > HLS > DASH > Fallback > Direct URL */}
                                      {/* Preview URL first - works on all browsers, including those without HLS/DASH support */}
                                      {videoSources?.preview && <source src={videoSources.preview} type='video/mp4' />}
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
                                          !videoSources.fallback)) && <source src={video} type='video/mp4' />}
                                      Trình duyệt của bạn không hỗ trợ video.
                                    </video>
                                  )}
                                </div>
                              </div>
                            )
                          }

                          // Check if contentData is a video URL
                          try {
                            const parsed = JSON.parse(content.contentData)
                            if (Array.isArray(parsed)) return null
                          } catch {
                            const contentData = content.contentData
                            if (
                              contentData &&
                              (contentData.includes('.mp4') ||
                                contentData.includes('.webm') ||
                                contentData.includes('.ogg') ||
                                contentData.includes('/videos/'))
                            ) {
                              // It's a video URL
                              return (
                                <div key={content.id} className='flex justify-center'>
                                  <div className='w-full max-w-2xl rounded-lg overflow-hidden'>
                                    <video
                                      controls
                                      className='w-full aspect-video rounded-lg'
                                      preload='metadata'
                                      playsInline
                                    >
                                      <source src={contentData} type='video/mp4' />
                                      Trình duyệt của bạn không hỗ trợ video.
                                    </video>
                                  </div>
                                </div>
                              )
                            }
                          }
                        }
                        return null
                      })}
                    </div>
                  )
                })()}
            </div>
          )}
        </div>
      )
    }
  ]

  return (
    <section className='max-w-6xl mx-auto px-6 py-8'>
      <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
        <div className='border-b border-gray-200'>
          <nav className='flex'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-base font-medium border-b-2 transition-colors ${activeTab === tab.id
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className='p-6'>{tabs.find((tab) => tab.id === activeTab)?.content}</div>
      </div>
    </section>
  )
}
