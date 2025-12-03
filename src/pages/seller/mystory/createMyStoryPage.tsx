import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { Video, Upload, Image as ImageIcon, X, FileText, Loader2, ChevronRight } from 'lucide-react'
import { storeStoryApi, type StoreStoryUpdateData } from '../../../apis/storeStory.api'
import { storeApi } from '../../../apis/store.api'
import { useAuth } from '../../../contexts/auth.context'
import { toast } from '../../../utils/toast'
import { Stream } from '@cloudflare/stream-react'
import { StoryContentCarousel } from '../../../components/ui/next-storyConten'
import { formatDate } from '../../../utils/formatDate'
import path from '../../../constants/path'

function CreateMyStoryPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)

  const [storyData, setStoryData] = useState({
    Title: '',
    TextIntro: '',
    TextExpanded: '',
    TextClosing: '',
    VideoOpener: null as File | null,
    VideoOpenerDescription: '',
    VideoOpenerUrl: null as string | null,
    SingleImage: null as File | null,
    SingleImageDescription: '',
    SingleImageUrl: null as string | null,
    GalleryImages: [] as File[],
    GalleryImageUrls: [] as string[],
    GalleryDescription: '',
    VideoProcess: null as File | null,
    VideoProcessDescription: '',
    VideoProcessUrl: null as string | null,
    VideoTestimonial: null as File | null,
    VideoTestimonialDescription: '',
    VideoTestimonialUrl: null as string | null,
    ThumbnailImage: null as File | null,
    ThumbnailUrl: null as string | null
  })

  const handleInputChange = (field: keyof typeof storyData, value: string) => {
    setStoryData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileChange = (field: keyof typeof storyData, file: File | null) => {
    if (file) {
      const isImage = field === 'ThumbnailImage' || field === 'SingleImage'
      const isVideo = field === 'VideoOpener' || field === 'VideoProcess' || field === 'VideoTestimonial'

      if (isImage) {
        if (!file.type.startsWith('image/')) {
          toast.error('File phải là hình ảnh')
          return
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File ${file.name} quá lớn. Tối đa 5MB (hiện tại: ${(file.size / 1024 / 1024).toFixed(2)}MB)`)
          return
        }
      } else if (isVideo) {
        if (!file.type.startsWith('video/')) {
          toast.error('File phải là video')
          return
        }
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`File ${file.name} quá lớn. Tối đa 50MB (hiện tại: ${(file.size / 1024 / 1024).toFixed(2)}MB)`)
          return
        }
      }
    }

    setStoryData((prev) => ({
      ...prev,
      [field]: file
    }))
  }

  const handleGalleryImagesChange = (files: FileList | null) => {
    if (files) {
      const filesArray = Array.from(files)
      const maxImageSize = 5 * 1024 * 1024
      const maxImages = 3
      const validFiles: File[] = []

      const currentTotalImages = storyData.GalleryImages.length + storyData.GalleryImageUrls.length
      const remainingSlots = maxImages - currentTotalImages

      if (remainingSlots <= 0) {
        toast.error(`Thư viện ảnh chỉ được tối đa ${maxImages} ảnh`)
        return
      }

      filesArray.forEach((file) => {
        if (validFiles.length >= remainingSlots) {
          toast.warning(`Chỉ có thể thêm tối đa ${remainingSlots} ảnh nữa (tổng tối đa ${maxImages} ảnh)`)
          return
        }

        if (!file.type.startsWith('image/')) {
          toast.error(`File ${file.name} không phải là hình ảnh`)
          return
        }
        if (file.size > maxImageSize) {
          toast.error(`File ${file.name} quá lớn. Tối đa 5MB (hiện tại: ${(file.size / 1024 / 1024).toFixed(2)}MB)`)
          return
        }
        validFiles.push(file)
      })

      if (validFiles.length > 0) {
        setStoryData((prev) => ({
          ...prev,
          GalleryImages: [...prev.GalleryImages, ...validFiles]
        }))
      }
    }
  }

  const removeGalleryImage = (index: number) => {
    setStoryData((prev) => ({
      ...prev,
      GalleryImages: prev.GalleryImages.filter((_, i) => i !== index)
    }))
  }

  const removeGalleryImageUrl = (index: number) => {
    setStoryData((prev) => ({
      ...prev,
      GalleryImageUrls: prev.GalleryImageUrls.filter((_, i) => i !== index)
    }))
  }

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length
  }

  const validateForm = (): string | null => {
    if (!storyData.Title.trim()) {
      return 'Vui lòng nhập tiêu đề câu chuyện'
    }
    const titleWords = countWords(storyData.Title)
    if (titleWords > 20) {
      return `Tiêu đề không được vượt quá 20 từ (hiện tại: ${titleWords} từ)`
    }

    if (storyData.TextIntro.trim()) {
      const introWords = countWords(storyData.TextIntro)
      if (introWords > 200) {
        return `Giới thiệu không được vượt quá 200 từ (hiện tại: ${introWords} từ)`
      }
    }

    if (storyData.TextExpanded.trim()) {
      const expandedWords = countWords(storyData.TextExpanded)
      if (expandedWords > 200) {
        return `Nội dung mở rộng không được vượt quá 200 từ (hiện tại: ${expandedWords} từ)`
      }
    }

    if (storyData.TextClosing.trim()) {
      const closingWords = countWords(storyData.TextClosing)
      if (closingWords > 200) {
        return `Kết luận không được vượt quá 200 từ (hiện tại: ${closingWords} từ)`
      }
    }

    const descriptions = [
      { text: storyData.VideoOpenerDescription, label: 'Mô tả video mở đầu' },
      { text: storyData.SingleImageDescription, label: 'Mô tả hình ảnh đơn' },
      { text: storyData.GalleryDescription, label: 'Mô tả thư viện ảnh' },
      { text: storyData.VideoProcessDescription, label: 'Mô tả video quy trình' },
      { text: storyData.VideoTestimonialDescription, label: 'Mô tả video đánh giá' }
    ]

    for (const desc of descriptions) {
      if (desc.text.trim()) {
        const descWords = countWords(desc.text)
        if (descWords > 200) {
          return `${desc.label} không được vượt quá 200 từ (hiện tại: ${descWords} từ)`
        }
      }
    }

    const maxImageSize = 5 * 1024 * 1024
    const imageFiles = [
      { file: storyData.ThumbnailImage, label: 'Ảnh đại diện' },
      { file: storyData.SingleImage, label: 'Hình ảnh đơn' }
    ]

    for (const img of imageFiles) {
      if (img.file && img.file.size > maxImageSize) {
        return `${img.label} không được vượt quá 5MB (hiện tại: ${(img.file.size / 1024 / 1024).toFixed(2)}MB)`
      }
    }

    const totalGalleryImages = storyData.GalleryImages.length + storyData.GalleryImageUrls.length
    if (totalGalleryImages > 3) {
      return `Thư viện ảnh chỉ được tối đa 3 ảnh (hiện tại: ${totalGalleryImages} ảnh)`
    }

    for (let i = 0; i < storyData.GalleryImages.length; i++) {
      const galleryImage = storyData.GalleryImages[i]
      if (galleryImage.size > maxImageSize) {
        return `Ảnh thư viện #${i + 1} không được vượt quá 5MB (hiện tại: ${(galleryImage.size / 1024 / 1024).toFixed(2)}MB)`
      }
    }

    const maxVideoSize = 50 * 1024 * 1024
    const videoFiles = [
      { file: storyData.VideoOpener, label: 'Video mở đầu' },
      { file: storyData.VideoProcess, label: 'Video quy trình' },
      { file: storyData.VideoTestimonial, label: 'Video đánh giá' }
    ]

    for (const video of videoFiles) {
      if (video.file && video.file.size > maxVideoSize) {
        return `${video.label} không được vượt quá 50MB (hiện tại: ${(video.file.size / 1024 / 1024).toFixed(2)}MB)`
      }
    }

    return null
  }

  useEffect(() => {
    const fetchStoreId = async () => {
      if (!user?.userId) {
        return
      }

      try {
        const storeResponse = await storeApi.getStoreBySellerId(user.userId)
        const storeId = storeResponse.data.id
        setStoreId(storeId)
      } catch (error) {
        console.error('Error fetching store ID:', error)
        toast.error('Không thể tải thông tin cửa hàng')
      }
    }

    fetchStoreId()
  }, [user?.userId])

  const handleCreateStory = async () => {
    if (!storeId) {
      toast.error('Không tìm thấy thông tin cửa hàng')
      return
    }

    if (!storyData.Title.trim()) {
      toast.error('Vui lòng nhập tiêu đề câu chuyện')
      return
    }

    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    try {
      setLoading(true)

      const storyPayload: StoreStoryUpdateData = {
        Title: storyData.Title,
        TextIntro: storyData.TextIntro,
        TextExpanded: storyData.TextExpanded,
        TextClosing: storyData.TextClosing,
        VideoOpenerDescription: storyData.VideoOpenerDescription,
        SingleImageDescription: storyData.SingleImageDescription,
        GalleryDescription: storyData.GalleryDescription,
        VideoProcessDescription: storyData.VideoProcessDescription,
        VideoTestimonialDescription: storyData.VideoTestimonialDescription,
        StoreId: storeId
      }

      if (storyData.VideoOpener) {
        storyPayload.VideoOpener = storyData.VideoOpener
      }
      if (storyData.SingleImage) {
        storyPayload.SingleImage = storyData.SingleImage
      }
      if (storyData.GalleryImages.length > 0) {
        storyPayload.GalleryImages = storyData.GalleryImages
      }
      if (storyData.VideoProcess) {
        storyPayload.VideoProcess = storyData.VideoProcess
      }
      if (storyData.VideoTestimonial) {
        storyPayload.VideoTestimonial = storyData.VideoTestimonial
      }
      if (storyData.ThumbnailImage) {
        storyPayload.ThumbnailImage = storyData.ThumbnailImage
      }

      const response = await storeStoryApi.create(storyPayload)
      let successMessage = 'Câu chuyện của hàng đã được tạo thành công.'
      if (response?.data?.message) {
        successMessage = response.data.message
      } else if (response?.message) {
        successMessage = response.message
      }
      toast.success(successMessage)

      navigate(`../${path.myStorySeller}`)
    } catch (error: unknown) {
      console.error('Error creating story:', error)
      let errorMessage = 'Có lỗi xảy ra khi tạo câu chuyện. Vui lòng thử lại.'

      if (error && typeof error === 'object') {
        const err = error as any

        if (err?.message) {
          errorMessage = err.message
        } else if (err?.response?.data?.message) {
          errorMessage = err.response.data.message
        } else if (err?.errors && Array.isArray(err.errors) && err.errors.length > 0) {
          errorMessage = err.errors.join(', ')
        } else if (
          err?.response?.data?.errors &&
          Array.isArray(err.response.data.errors) &&
          err.response.data.errors.length > 0
        ) {
          errorMessage = err.response.data.errors.join(', ')
        } else if (err?.errors && typeof err.errors === 'object' && !Array.isArray(err.errors)) {
          const errorMessages: string[] = []
          Object.keys(err.errors).forEach((field) => {
            const fieldErrors = err.errors[field]
            if (Array.isArray(fieldErrors)) {
              errorMessages.push(...fieldErrors)
            } else if (typeof fieldErrors === 'string') {
              errorMessages.push(fieldErrors)
            }
          })
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join(', ')
          }
        } else if (
          err?.response?.data?.errors &&
          typeof err.response.data.errors === 'object' &&
          !Array.isArray(err.response.data.errors)
        ) {
          const errorMessages: string[] = []
          Object.keys(err.response.data.errors).forEach((field) => {
            const fieldErrors = err.response.data.errors[field]
            if (Array.isArray(fieldErrors)) {
              errorMessages.push(...fieldErrors)
            } else if (typeof fieldErrors === 'string') {
              errorMessages.push(fieldErrors)
            }
          })
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join(', ')
          }
        }
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate(`../${path.myStorySeller}`)
  }

  // Live Preview Component - Matching customer view
  const StoryPreview = () => {
    // Helper function to extract Cloudflare Stream video ID from URL
    const extractVideoId = (url: string | null): string | undefined => {
      if (!url) return undefined
      try {
        const match = url.match(/cloudflarestream\.com\/([a-f0-9]+)/i)
        return match ? match[1] : undefined
      } catch {
        return undefined
      }
    }

    // Process video data similar to StorySection
    const processVideo = (videoUrl: string | null, videoPreviewUrl?: string | null, videoFallBackUrl?: string | null) => {
      let video = ''
      let videoId: string | undefined = undefined
      let videoSources: { hls?: string; dash?: string; preview?: string; fallback?: string } | undefined = undefined

      if (videoUrl) {
        const playbackVideoId = extractVideoId(videoUrl)
        videoId = playbackVideoId

        const playbackUrls = videoUrl.split(',').map((url: string) => url.trim())
        const hlsUrl = playbackUrls.find((url: string) => url.includes('.m3u8'))
        const dashUrl = playbackUrls.find((url: string) => url.includes('.mpd'))

        videoSources = {}
        if (hlsUrl) videoSources.hls = hlsUrl
        if (dashUrl) videoSources.dash = dashUrl
        if (videoPreviewUrl?.trim()) {
          videoSources.preview = videoPreviewUrl.trim()
        }
        if (videoFallBackUrl?.trim()) {
          videoSources.fallback = videoFallBackUrl.trim()
        }

        video =
          videoPreviewUrl?.trim() ||
          hlsUrl ||
          dashUrl ||
          videoFallBackUrl?.trim() ||
          playbackUrls[0] ||
          ''
      } else if (videoPreviewUrl) {
        video = videoPreviewUrl.trim()
        const previewVideoId = extractVideoId(video)
        videoId = previewVideoId
        videoSources = {
          preview: videoPreviewUrl.trim(),
          fallback: videoFallBackUrl?.trim() || undefined
        }
      } else if (videoFallBackUrl) {
        video = videoFallBackUrl.trim()
        const fallbackVideoId = extractVideoId(video)
        videoId = fallbackVideoId
        videoSources = {
          fallback: videoFallBackUrl.trim()
        }
      }

      return { video, videoId, videoSources }
    }

    // Render content similar to StorySection
    const renderContent = (contentType: string, contentData: string, imageUrls?: string[], videoUrl?: string | null) => {
      switch (contentType.toLowerCase()) {
        case 'text': {
          return (
            <div className='bg-gray-50 p-4 rounded-lg'>
              <p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>
                {contentData || 'Không có nội dung'}
              </p>
            </div>
          )
        }

        case 'video': {
          const { video, videoId, videoSources } = processVideo(videoUrl || null)

          if (!video && !videoId) {
            if (contentData && contentData !== 'string') {
              return (
                <div className='bg-yellow-50 border border-yellow-200 p-4 rounded-lg'>
                  <p className='text-yellow-800 text-sm'>
                    <strong>Video:</strong> {contentData}
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
              {contentData && contentData !== 'string' && (
                <p className='text-sm text-gray-600 italic mt-2'>{contentData}</p>
              )}
            </div>
          )
        }

        case 'image': {
          const imageUrlsArray = imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0 ? imageUrls : []

          if (imageUrlsArray.length > 0) {
            return (
              <div className='space-y-2'>
                <StoryContentCarousel imageUrls={imageUrlsArray} showBadge={false} />
                {contentData && contentData !== 'string' && (
                  <p className='text-sm text-gray-600 italic mt-2'>{contentData}</p>
                )}
              </div>
            )
          }
          if (contentData && contentData !== 'string') {
            return (
              <div className='bg-gray-50 p-4 rounded-lg'>
                <p className='text-gray-700'>{contentData}</p>
              </div>
            )
          }
          return null
        }

        default:
          return (
            <div className='bg-gray-50 p-4 rounded-lg'>
              <p className='text-xs text-gray-500 mb-2'>Loại: {contentType || 'Không xác định'}</p>
              {contentData && contentData !== 'string' && <p className='text-gray-700'>{contentData}</p>}
              {imageUrls && imageUrls.length > 0 && (
                <div className='grid grid-cols-2 gap-2 mt-2'>
                  {imageUrls.map((url: string, idx: number) => (
                    <img key={idx} src={url} alt={`Image ${idx + 1}`} className='w-full rounded' />
                  ))}
                </div>
              )}
            </div>
          )
      }
    }

    // Build contents array similar to API response structure
    const buildContents = () => {
      const contents: Array<{
        id: string
        contentType: string
        contentData: string
        imageUrls?: string[]
        videoUrl?: string | null
        order: number
      }> = []

      // TextIntro (order 1)
      if (storyData.TextIntro) {
        contents.push({
          id: 'text-intro',
          contentType: 'text',
          contentData: storyData.TextIntro,
          order: 1
        })
      }

      // VideoOpener (order 2)
      const videoOpenerUrl = storyData.VideoOpener
        ? URL.createObjectURL(storyData.VideoOpener)
        : storyData.VideoOpenerUrl
      if (videoOpenerUrl) {
        contents.push({
          id: 'video-opener',
          contentType: 'video',
          contentData: storyData.VideoOpenerDescription || '',
          videoUrl: videoOpenerUrl,
          order: 2
        })
      }

      // SingleImage (order 2)
      const singleImageUrl = storyData.SingleImage
        ? URL.createObjectURL(storyData.SingleImage)
        : storyData.SingleImageUrl
      if (singleImageUrl) {
        contents.push({
          id: 'single-image',
          contentType: 'image',
          contentData: storyData.SingleImageDescription || '',
          imageUrls: [singleImageUrl],
          order: 2
        })
      }

      // GalleryImages (order 3)
      const galleryUrls: string[] = []
      storyData.GalleryImageUrls.forEach((url) => galleryUrls.push(url))
      storyData.GalleryImages.forEach((file) => galleryUrls.push(URL.createObjectURL(file)))
      if (galleryUrls.length > 0) {
        contents.push({
          id: 'gallery-images',
          contentType: 'image',
          contentData: storyData.GalleryDescription || '',
          imageUrls: galleryUrls,
          order: 3
        })
      }

      // TextExpanded (order 3)
      if (storyData.TextExpanded) {
        contents.push({
          id: 'text-expanded',
          contentType: 'text',
          contentData: storyData.TextExpanded,
          order: 3
        })
      }

      // VideoProcess (order 4)
      const videoProcessUrl = storyData.VideoProcess
        ? URL.createObjectURL(storyData.VideoProcess)
        : storyData.VideoProcessUrl
      if (videoProcessUrl) {
        contents.push({
          id: 'video-process',
          contentType: 'video',
          contentData: storyData.VideoProcessDescription || '',
          videoUrl: videoProcessUrl,
          order: 4
        })
      }

      // VideoTestimonial (order 7)
      const videoTestimonialUrl = storyData.VideoTestimonial
        ? URL.createObjectURL(storyData.VideoTestimonial)
        : storyData.VideoTestimonialUrl
      if (videoTestimonialUrl) {
        contents.push({
          id: 'video-testimonial',
          contentType: 'video',
          contentData: storyData.VideoTestimonialDescription || '',
          videoUrl: videoTestimonialUrl,
          order: 7
        })
      }

      // TextClosing (order 6)
      if (storyData.TextClosing) {
        contents.push({
          id: 'text-closing',
          contentType: 'text',
          contentData: storyData.TextClosing,
          order: 6
        })
      }

      return contents.sort((a, b) => a.order - b.order)
    }

    const contents = buildContents()
    const hasContent = storyData.Title || contents.length > 0

    return (
      <div className='bg-white rounded-lg p-8 shadow-sm overflow-y-auto h-full'>
        <div className='max-w-4xl mx-auto space-y-6'>
          {/* Story Title */}
          <div className='text-center border-b border-gray-200 pb-4'>
            <h2 className='text-3xl font-bold text-gray-900 mb-2'>
              {storyData.Title || 'Tiêu đề câu chuyện'}
            </h2>
            <p className='text-sm text-gray-500'>
              {storyData.Title ? 'Ngày tạo: ' + formatDate(new Date().toISOString()) : 'Xem trước câu chuyện'}
            </p>
          </div>

          {/* Story Contents */}
          {contents.length > 0 ? (
            <div className='space-y-6'>
              {contents.map((content) => (
                <div key={content.id} className='space-y-2'>
                  {renderContent(content.contentType, content.contentData, content.imageUrls, content.videoUrl)}
                </div>
              ))}
            </div>
          ) : hasContent ? null : (
            <div className='text-center py-8 text-gray-500'>
              <p>Chưa có nội dung nào</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Breadcrumb */}
      <div className='flex items-center space-x-2 text-sm text-gray-600 mb-4'>
        <span
          className='text-gray-600 hover:text-gray-900 cursor-pointer'
          onClick={() => navigate(`../${path.myStorySeller}`)}
        >
          Câu chuyện của bạn
        </span>
        <ChevronRight className='w-4 h-4' />
        <span className='text-gray-900 font-medium'>Tạo câu chuyện mới</span>
      </div>

      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-semibold text-gray-900'>Tạo câu chuyện mới</h1>
        <p className='text-gray-600 mt-1'>Thêm câu chuyện mới cho cửa hàng của bạn</p>
      </div>

      {/* Two Column Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column - Form (2/3) */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Basic Information */}
          <Card className='border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <CardHeader className='bg-gradient-to-r from-green-100 to-emerald-100 border-t-2 border-b border-green-100 text-green-700 pt-4'>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <FileText className='w-5 h-5' />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 pt-6'>
              {/* Title */}
              <div>
                <Label htmlFor='title' className='text-sm font-medium'>
                  Tiêu đề câu chuyện <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='title'
                  placeholder='Nhập tiêu đề câu chuyện...'
                  value={storyData.Title}
                  onChange={(e) => handleInputChange('Title', e.target.value)}
                  className={`mt-1 transition-all duration-200 focus:ring-green-500 focus:border-green-500`}
                />
                <div className='flex justify-end items-center mt-1'>
                  <p
                    className={`text-xs ${countWords(storyData.Title) > 20 ? 'text-red-500' : 'text-gray-500'}`}
                  >
                    {countWords(storyData.Title)}/20 từ
                  </p>
                </div>
              </div>

              {/* Thumbnail Image */}
              <div>
                <Label className='text-sm font-medium'>Ảnh đại diện câu chuyện</Label>
                <p className='text-xs text-gray-500 mt-1 mb-2'>
                  Ảnh này sẽ hiển thị ở đầu câu chuyện và trong danh sách câu chuyện của cửa hàng
                </p>
                <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center'>
                  {storyData.ThumbnailImage ? (
                    <div className='space-y-2'>
                      <img
                        src={URL.createObjectURL(storyData.ThumbnailImage)}
                        alt='Ảnh đại diện câu chuyện'
                        className='w-full h-32 object-cover rounded mx-auto'
                      />
                      <p className='text-sm text-gray-500'>{storyData.ThumbnailImage.name}</p>
                      <Button variant='outline' size='sm' onClick={() => handleFileChange('ThumbnailImage', null)}>
                        <X className='w-4 h-4 mr-1' />
                        Xóa ảnh
                      </Button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                      <p className='text-gray-500 mb-2 text-sm'>Tải lên ảnh đại diện</p>
                      <p className='text-xs text-gray-400 mb-3'>Định dạng: PNG, JPG. Kích thước tối đa: 5MB</p>
                      <input
                        type='file'
                        accept='image/*'
                        onChange={(e) => handleFileChange('ThumbnailImage', e.target.files?.[0] || null)}
                        className='hidden'
                        id='thumbnail-upload'
                      />
                      <Button variant='outline' size='sm' onClick={() => document.getElementById('thumbnail-upload')?.click()}>
                        <Upload className='w-4 h-4 mr-1' />
                        Chọn ảnh đại diện
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Text Intro */}
              <div>
                <Label htmlFor='textIntro' className='text-sm font-medium'>
                  Phần giới thiệu câu chuyện
                </Label>
                <p className='text-xs text-gray-500 mt-1 mb-2'>
                  Nhập phần giới thiệu ngắn gọn về câu chuyện của bạn để thu hút người đọc
                </p>
                <Textarea
                  id='textIntro'
                  placeholder='Ví dụ: Câu chuyện về hành trình làm nông sản sạch của gia đình tôi...'
                  value={storyData.TextIntro}
                  onChange={(e) => handleInputChange('TextIntro', e.target.value)}
                  className={`mt-1 min-h-[100px] transition-all duration-200 focus:ring-green-500 focus:border-green-500 ${
                    countWords(storyData.TextIntro) > 200 ? 'border-red-500' : ''
                  }`}
                />
                <div className='flex justify-end items-center mt-1'>
                  <p
                    className={`text-xs ${countWords(storyData.TextIntro) > 200 ? 'text-red-500' : 'text-gray-500'}`}
                  >
                    {countWords(storyData.TextIntro)}/200 từ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media Section */}
          <Card className='border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <CardHeader className='bg-gradient-to-r from-green-100 to-emerald-100 border-t-2 border-b border-green-100 text-green-700 pt-4'>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <Video className='w-5 h-5' />
                Video mở đầu câu chuyện
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 pt-6'>
              <div>
                <Label className='text-sm font-medium'>Video mở đầu</Label>
                <p className='text-xs text-gray-500 mt-1 mb-2'>
                  Video này sẽ hiển thị ngay sau phần giới thiệu để thu hút người xem
                </p>
                <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4'>
                  {storyData.VideoOpener ? (
                    <div className='space-y-2'>
                      <video src={URL.createObjectURL(storyData.VideoOpener)} controls className='w-full h-32 rounded' />
                      <p className='text-sm text-gray-500'>{storyData.VideoOpener.name}</p>
                      <Button variant='outline' size='sm' onClick={() => handleFileChange('VideoOpener', null)}>
                        <X className='w-4 h-4 mr-1' />
                        Xóa video
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Video className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                      <p className='text-gray-500 mb-2 text-sm'>Tải lên video mở đầu</p>
                      <p className='text-xs text-gray-400 mb-3'>Định dạng: MP4, MOV. Kích thước tối đa: 50MB</p>
                      <input
                        type='file'
                        accept='video/*'
                        onChange={(e) => handleFileChange('VideoOpener', e.target.files?.[0] || null)}
                        className='hidden'
                        id='video-opener-upload'
                      />
                      <Button variant='outline' size='sm' onClick={() => document.getElementById('video-opener-upload')?.click()}>
                        <Upload className='w-4 h-4 mr-1' />
                        Chọn video mở đầu
                      </Button>
                    </>
                  )}
                </div>
                <div className='mt-2'>
                  <Label className='text-xs text-gray-600'>Mô tả cho video mở đầu</Label>
                  <Textarea
                    placeholder='Ví dụ: Video giới thiệu về quy trình trồng trọt của gia đình...'
                    value={storyData.VideoOpenerDescription}
                    onChange={(e) => handleInputChange('VideoOpenerDescription', e.target.value)}
                    className={`mt-1 min-h-[60px] text-sm ${
                      countWords(storyData.VideoOpenerDescription) > 200 ? 'border-red-500' : ''
                    }`}
                  />
                  <div className='flex justify-end items-center mt-1'>
                    <p
                      className={`text-xs ${
                        countWords(storyData.VideoOpenerDescription) > 200 ? 'text-red-500' : 'text-gray-500'
                      }`}
                    >
                      {countWords(storyData.VideoOpenerDescription)}/200 từ
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Single Image Section */}
          <Card className='border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <CardHeader className='bg-gradient-to-r from-green-100 to-emerald-100 border-t-2 border-b border-green-100 text-green-700 pt-4'>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <ImageIcon className='w-5 h-5' />
                Hình ảnh minh họa
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 pt-6'>
              <div>
                <Label className='text-sm font-medium'>Hình ảnh minh họa</Label>
                <p className='text-xs text-gray-500 mt-1 mb-2'>
                  Tải lên một hình ảnh đẹp để minh họa cho câu chuyện của bạn
                </p>
                <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4'>
                  {storyData.SingleImage ? (
                    <div className='space-y-2'>
                      <img
                        src={URL.createObjectURL(storyData.SingleImage)}
                        alt='Hình ảnh minh họa câu chuyện'
                        className='w-full h-32 object-cover rounded mx-auto'
                      />
                      <p className='text-sm text-gray-500'>{storyData.SingleImage.name}</p>
                      <Button variant='outline' size='sm' onClick={() => handleFileChange('SingleImage', null)}>
                        <X className='w-4 h-4 mr-1' />
                        Xóa ảnh
                      </Button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                      <p className='text-gray-500 mb-2 text-sm'>Tải lên hình ảnh minh họa</p>
                      <p className='text-xs text-gray-400 mb-3'>Định dạng: PNG, JPG. Kích thước tối đa: 5MB</p>
                      <input
                        type='file'
                        accept='image/*'
                        onChange={(e) => handleFileChange('SingleImage', e.target.files?.[0] || null)}
                        className='hidden'
                        id='single-image-upload'
                      />
                      <Button variant='outline' size='sm' onClick={() => document.getElementById('single-image-upload')?.click()}>
                        <Upload className='w-4 h-4 mr-1' />
                        Chọn hình ảnh
                      </Button>
                    </>
                  )}
                </div>
                <div className='mt-2'>
                  <Label className='text-xs text-gray-600'>Mô tả cho hình ảnh minh họa</Label>
                  <Textarea
                    placeholder='Ví dụ: Hình ảnh cánh đồng lúa chín vàng vào mùa thu hoạch...'
                    value={storyData.SingleImageDescription}
                    onChange={(e) => handleInputChange('SingleImageDescription', e.target.value)}
                    className={`mt-1 min-h-[60px] text-sm ${
                      countWords(storyData.SingleImageDescription) > 200 ? 'border-red-500' : ''
                    }`}
                  />
                  <div className='flex justify-end items-center mt-1'>
                    <p
                      className={`text-xs ${
                        countWords(storyData.SingleImageDescription) > 200 ? 'text-red-500' : 'text-gray-500'
                      }`}
                    >
                      {countWords(storyData.SingleImageDescription)}/200 từ
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gallery Images Section */}
          <Card className='border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <CardHeader className='bg-gradient-to-r from-green-100 to-emerald-100 border-t-2 border-b border-green-100 text-green-700 pt-4'>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <ImageIcon className='w-5 h-5' />
                Bộ sưu tập hình ảnh
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 pt-6'>
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <Label className='text-sm font-medium'>Bộ sưu tập hình ảnh</Label>
                  <span
                    className={`text-xs ${
                      storyData.GalleryImages.length + storyData.GalleryImageUrls.length > 3 ? 'text-red-500' : 'text-gray-500'
                    }`}
                  >
                    {storyData.GalleryImages.length + storyData.GalleryImageUrls.length}/3 ảnh
                  </span>
                </div>
                <p className='text-xs text-gray-500 mb-2'>
                  Tải lên tối đa 3 hình ảnh để tạo bộ sưu tập minh họa cho câu chuyện
                </p>
                <div className='border-2 border-dashed border-gray-300 rounded-lg p-4'>
                  <ImageIcon className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                  <p className='text-gray-500 mb-2 text-sm'>Tải lên nhiều ảnh (tối đa 3 ảnh)</p>
                  <p className='text-xs text-gray-400 mb-3'>Định dạng: PNG, JPG. Mỗi ảnh tối đa: 5MB</p>
                  <input
                    type='file'
                    accept='image/*'
                    multiple
                    onChange={(e) => handleGalleryImagesChange(e.target.files)}
                    className='hidden'
                    id='gallery-images-upload'
                    disabled={storyData.GalleryImages.length + storyData.GalleryImageUrls.length >= 3}
                  />
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => document.getElementById('gallery-images-upload')?.click()}
                    disabled={storyData.GalleryImages.length + storyData.GalleryImageUrls.length >= 3}
                  >
                    <Upload className='w-4 h-4 mr-1' />
                    Chọn nhiều ảnh
                  </Button>
                  {(storyData.GalleryImages.length > 0 || storyData.GalleryImageUrls.length > 0) && (
                    <div className='mt-4'>
                      <div className='grid grid-cols-3 gap-2'>
                        {storyData.GalleryImageUrls.map((imgUrl, idx) => (
                          <div key={`url-${idx}`} className='relative group'>
                            <img
                              src={imgUrl}
                              alt={`Ảnh trong bộ sưu tập ${idx + 1}`}
                              className='w-full h-20 object-cover rounded border'
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = 'https://via.placeholder.com/800x400?text=Khong+co+anh'
                              }}
                            />
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => removeGalleryImageUrl(idx)}
                              className='absolute top-1 right-1 p-1 h-5 w-5 bg-red-500 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity'
                            >
                              <X className='w-3 h-3' />
                            </Button>
                          </div>
                        ))}
                        {storyData.GalleryImages.map((img, idx) => (
                          <div key={`file-${idx}`} className='relative group'>
                            <img
                              src={URL.createObjectURL(img)}
                              alt={`Ảnh mới trong bộ sưu tập ${idx + 1}`}
                              className='w-full h-20 object-cover rounded border'
                            />
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => removeGalleryImage(idx)}
                              className='absolute top-1 right-1 p-1 h-5 w-5 bg-red-500 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity'
                            >
                              <X className='w-3 h-3' />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className='mt-2'>
                  <Label className='text-xs text-gray-600'>Mô tả cho bộ sưu tập hình ảnh</Label>
                  <Textarea
                    placeholder='Ví dụ: Những khoảnh khắc đẹp trong quá trình sản xuất...'
                    value={storyData.GalleryDescription}
                    onChange={(e) => handleInputChange('GalleryDescription', e.target.value)}
                    className={`mt-1 min-h-[60px] text-sm ${
                      countWords(storyData.GalleryDescription) > 200 ? 'border-red-500' : ''
                    }`}
                  />
                  <div className='flex justify-end items-center mt-1'>
                    <p
                      className={`text-xs ${countWords(storyData.GalleryDescription) > 200 ? 'text-red-500' : 'text-gray-500'}`}
                    >
                      {countWords(storyData.GalleryDescription)}/200 từ
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Text Expanded Section */}
          <Card className='border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <CardHeader className='bg-gradient-to-r from-green-100 to-emerald-100 border-t-2 border-b border-green-100 text-green-700 pt-4'>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <FileText className='w-5 h-5' />
                Nội dung chi tiết câu chuyện
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 pt-6'>
              <div>
                <Label htmlFor='textExpanded' className='text-sm font-medium'>
                  Nội dung chi tiết
                </Label>
                <p className='text-xs text-gray-500 mt-1 mb-2'>
                  Viết chi tiết hơn về câu chuyện, quy trình sản xuất, hoặc những điều đặc biệt bạn muốn chia sẻ
                </p>
                <Textarea
                  id='textExpanded'
                  placeholder='Ví dụ: Quy trình làm nông sản sạch của chúng tôi bắt đầu từ việc chọn giống...'
                  value={storyData.TextExpanded}
                  onChange={(e) => handleInputChange('TextExpanded', e.target.value)}
                  className={`mt-1 min-h-[100px] transition-all duration-200 focus:ring-green-500 focus:border-green-500 ${
                    countWords(storyData.TextExpanded) > 200 ? 'border-red-500' : ''
                  }`}
                />
                <div className='flex justify-end items-center mt-1'>
                  <p
                    className={`text-xs ${countWords(storyData.TextExpanded) > 200 ? 'text-red-500' : 'text-gray-500'}`}
                  >
                    {countWords(storyData.TextExpanded)}/200 từ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video Process Section */}
          <Card className='border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <CardHeader className='bg-gradient-to-r from-green-100 to-emerald-100 border-t-2 border-b border-green-100 text-green-700 pt-4'>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <Video className='w-5 h-5' />
                Video về quy trình sản xuất
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 pt-6'>
              <div>
                <Label className='text-sm font-medium'>Video quy trình sản xuất</Label>
                <p className='text-xs text-gray-500 mt-1 mb-2'>
                  Video này sẽ giúp khách hàng hiểu rõ hơn về quy trình sản xuất sản phẩm của bạn
                </p>
                <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4'>
                  {storyData.VideoProcess ? (
                    <div className='space-y-2'>
                      <video src={URL.createObjectURL(storyData.VideoProcess)} controls className='w-full h-32 rounded' />
                      <p className='text-sm text-gray-500'>{storyData.VideoProcess.name}</p>
                      <Button variant='outline' size='sm' onClick={() => handleFileChange('VideoProcess', null)}>
                        <X className='w-4 h-4 mr-1' />
                        Xóa video
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Video className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                      <p className='text-gray-500 mb-2 text-sm'>Tải lên video quy trình sản xuất</p>
                      <p className='text-xs text-gray-400 mb-3'>Định dạng: MP4, MOV. Kích thước tối đa: 50MB</p>
                      <input
                        type='file'
                        accept='video/*'
                        onChange={(e) => handleFileChange('VideoProcess', e.target.files?.[0] || null)}
                        className='hidden'
                        id='video-process-upload'
                      />
                      <Button variant='outline' size='sm' onClick={() => document.getElementById('video-process-upload')?.click()}>
                        <Upload className='w-4 h-4 mr-1' />
                        Chọn video quy trình
                      </Button>
                    </>
                  )}
                </div>
                <div className='mt-2'>
                  <Label className='text-xs text-gray-600'>Mô tả cho video quy trình sản xuất</Label>
                  <Textarea
                    placeholder='Ví dụ: Video giới thiệu chi tiết các bước trong quy trình sản xuất...'
                    value={storyData.VideoProcessDescription}
                    onChange={(e) => handleInputChange('VideoProcessDescription', e.target.value)}
                    className={`mt-1 min-h-[60px] text-sm ${
                      countWords(storyData.VideoProcessDescription) > 200 ? 'border-red-500' : ''
                    }`}
                  />
                  <div className='flex justify-end items-center mt-1'>
                    <p
                      className={`text-xs ${
                        countWords(storyData.VideoProcessDescription) > 200 ? 'text-red-500' : 'text-gray-500'
                      }`}
                    >
                      {countWords(storyData.VideoProcessDescription)}/200 từ
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video Testimonial Section */}
          <Card className='border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <CardHeader className='bg-gradient-to-r from-green-100 to-emerald-100 border-t-2 border-b border-green-100 text-green-700 pt-4'>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <Video className='w-5 h-5' />
                Video phản hồi từ khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 pt-6'>
              <div>
                <Label className='text-sm font-medium'>Video phản hồi khách hàng</Label>
                <p className='text-xs text-gray-500 mt-1 mb-2'>
                  Video này sẽ giúp tăng độ tin cậy với những phản hồi tích cực từ khách hàng đã sử dụng sản phẩm
                </p>
                <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4'>
                  {storyData.VideoTestimonial ? (
                    <div className='space-y-2'>
                      <video src={URL.createObjectURL(storyData.VideoTestimonial)} controls className='w-full h-32 rounded' />
                      <p className='text-sm text-gray-500'>{storyData.VideoTestimonial.name}</p>
                      <Button variant='outline' size='sm' onClick={() => handleFileChange('VideoTestimonial', null)}>
                        <X className='w-4 h-4 mr-1' />
                        Xóa video
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Video className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                      <p className='text-gray-500 mb-2 text-sm'>Tải lên video phản hồi khách hàng</p>
                      <p className='text-xs text-gray-400 mb-3'>Định dạng: MP4, MOV. Kích thước tối đa: 50MB</p>
                      <input
                        type='file'
                        accept='video/*'
                        onChange={(e) => handleFileChange('VideoTestimonial', e.target.files?.[0] || null)}
                        className='hidden'
                        id='video-testimonial-upload'
                      />
                      <Button variant='outline' size='sm' onClick={() => document.getElementById('video-testimonial-upload')?.click()}>
                        <Upload className='w-4 h-4 mr-1' />
                        Chọn video phản hồi
                      </Button>
                    </>
                  )}
                </div>
                <div className='mt-2'>
                  <Label className='text-xs text-gray-600'>Mô tả cho video phản hồi khách hàng</Label>
                  <Textarea
                    placeholder='Ví dụ: Video chia sẻ cảm nhận của khách hàng về chất lượng sản phẩm...'
                    value={storyData.VideoTestimonialDescription}
                    onChange={(e) => handleInputChange('VideoTestimonialDescription', e.target.value)}
                    className={`mt-1 min-h-[60px] text-sm ${
                      countWords(storyData.VideoTestimonialDescription) > 200 ? 'border-red-500' : ''
                    }`}
                  />
                  <div className='flex justify-end items-center mt-1'>
                    <p
                      className={`text-xs ${
                        countWords(storyData.VideoTestimonialDescription) > 200 ? 'text-red-500' : 'text-gray-500'
                      }`}
                    >
                      {countWords(storyData.VideoTestimonialDescription)}/200 từ
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Text Closing Section */}
          <Card className='border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <CardHeader className='bg-gradient-to-r from-green-100 to-emerald-100 border-t-2 border-b border-green-100 text-green-700 pt-4'>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <FileText className='w-5 h-5' />
                Phần kết thúc câu chuyện
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 pt-6'>
              <div>
                <Label htmlFor='textClosing' className='text-sm font-medium'>
                  Lời kết
                </Label>
                <p className='text-xs text-gray-500 mt-1 mb-2'>
                  Viết lời kết để tóm tắt lại câu chuyện hoặc gửi gắm thông điệp đến khách hàng
                </p>
                <Textarea
                  id='textClosing'
                  placeholder='Ví dụ: Chúng tôi cam kết mang đến những sản phẩm chất lượng nhất...'
                  value={storyData.TextClosing}
                  onChange={(e) => handleInputChange('TextClosing', e.target.value)}
                  className={`mt-1 min-h-[100px] transition-all duration-200 focus:ring-green-500 focus:border-green-500 ${
                    countWords(storyData.TextClosing) > 200 ? 'border-red-500' : ''
                  }`}
                />
                <div className='flex justify-end items-center mt-1'>
                  <p
                    className={`text-xs ${countWords(storyData.TextClosing) > 200 ? 'text-red-500' : 'text-gray-500'}`}
                  >
                    {countWords(storyData.TextClosing)}/200 từ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className='flex justify-start gap-4 pb-6'>
            <Button
              variant='outline'
              onClick={handleBack}
              className='px-6 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200'
              disabled={loading}
            >
              Hủy bỏ
            </Button>
            <Button
              className='bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'
              onClick={handleCreateStory}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Đang tạo...
                </>
              ) : (
                'Tạo câu chuyện'
              )}
            </Button>
          </div>
        </div>

        {/* Right Column - Live Preview (1/3) - Sticky */}
        <div className='lg:col-span-1'>
          <div className='sticky top-24 self-start'>
            <Card className='border-green-100 shadow-lg'>
              <CardHeader className='bg-gradient-to-r from-green-100 to-emerald-100 border-t-2 border-b border-green-100 text-green-700 pt-4'>
                <CardTitle className='text-green-700 flex items-center gap-2'>
                  <FileText className='w-5 h-5' />
                  Xem trước trực tiếp
                </CardTitle>
              </CardHeader>
              <CardContent className='p-0'>
                <div className='h-[calc(100vh-180px)] overflow-y-auto'>
                  <StoryPreview />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateMyStoryPage
