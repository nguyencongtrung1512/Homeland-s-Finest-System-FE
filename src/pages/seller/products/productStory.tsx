import { useState, useEffect, useRef } from 'react'
import { toast } from '../../../utils/toast'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { BookOpen, Edit, Save, X, Trash2, Image, Video, Upload, AlertCircle } from 'lucide-react'
import { Stream } from '@cloudflare/stream-react'
import ThreeDCarousel from '../../../components/ui/3d-caroseu'
import { productStoryApi } from '../../../apis/productStory.api'
import type { ProductStory } from '../../../types/productStoryType'

interface ProductStoryProps {
  productId: string
  productStory?: ProductStory
  isEditMode: boolean
  onToggleEditMode: (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => void
  onCancelEdit: (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => void
  onSaveSection: (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => Promise<void>
  onRefresh?: () => Promise<void> | void
  canEdit?: boolean
}

interface StoryEditData {
  title: string
  content: string
  images: string[]
  video: string
  videoId?: string // Cloudflare Stream video ID (UID)
  videoSources?: { hls?: string; dash?: string; preview?: string; fallback?: string } // Multiple video sources for HLS/DASH
  // Add file storage for actual files
  imageFiles: File[]
  videoFile: File | null
  // Track original images/video from server (to distinguish old vs new)
  originalImages: string[]
  originalVideo: string
  originalVideoId?: string
  originalVideoSources?: { hls?: string; dash?: string; preview?: string; fallback?: string }
}

function ProductStoryComponent({
  productId,
  isEditMode,
  onToggleEditMode,
  onCancelEdit,
  onRefresh,
  canEdit = true
}: ProductStoryProps) {
  const [stories, setStories] = useState<ProductStory[]>([])
  const [loading, setLoading] = useState(false)
  const [editData, setEditData] = useState<StoryEditData>({
    title: '',
    content: '',
    images: [],
    video: '',
    videoId: undefined,
    videoSources: undefined,
    imageFiles: [],
    videoFile: null,
    originalImages: [],
    originalVideo: '',
    originalVideoId: undefined,
    originalVideoSources: undefined
  })

  // Fix: Add setters for upload states
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  // File input refs
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Constants for validation
  const MAX_TITLE_WORDS = 50
  const MAX_CONTENT_WORDS = 500
  const MAX_IMAGES = 3

  // Helper function to count words
  const countWords = (text: string): number => {
    if (!text || text.trim().length === 0) return 0
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  // Handle image upload - just store files and create preview URLs
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true) // Set loading state

    // Check current image count
    const currentImageCount = editData.images.length
    const availableSlots = MAX_IMAGES - currentImageCount

    if (availableSlots <= 0) {
      toast.error(`Chỉ được tối đa ${MAX_IMAGES} hình ảnh.`)
      setUploadingImages(false)
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
      return
    }

    const validFiles: File[] = []
    const previewUrls: string[] = []

    Array.from(files).forEach((file) => {
      // Check if we've reached the limit
      if (currentImageCount + validFiles.length >= MAX_IMAGES) {
        toast.error(`Chỉ được tối đa ${MAX_IMAGES} hình ảnh. Đã dừng upload.`)
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} quá lớn. Tối đa 5MB.`)
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} không phải là hình ảnh.`)
        return
      }

      validFiles.push(file)
      previewUrls.push(URL.createObjectURL(file))
    })

    if (validFiles.length > 0) {
      setEditData((prev) => ({
        ...prev,
        images: [...prev.images, ...previewUrls],
        imageFiles: [...prev.imageFiles, ...validFiles]
      }))
    }

    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }

    setUploadingImages(false) // Reset loading state
  }

  // Handle video upload - just store file and create preview URL
  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingVideo(true) // Set loading state

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video quá lớn. Tối đa 50MB.')
      setUploadingVideo(false)
      return
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('File không phải là video.')
      setUploadingVideo(false)
      return
    }

    const videoUrl = URL.createObjectURL(file)

    setEditData((prev) => ({
      ...prev,
      video: videoUrl,
      videoFile: file
    }))
    // Reset input
    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }

    setUploadingVideo(false) // Reset loading state
  }

  // Handle title change
  const handleTitleChange = (value: string) => {
    setEditData((prev) => ({ ...prev, title: value }))
  }

  // Handle content change
  const handleContentChange = (value: string) => {
    setEditData((prev) => ({ ...prev, content: value }))
  }

  const handleSave = async () => {
    try {
      // Validate title
      const titleWordCount = countWords(editData.title)
      if (titleWordCount === 0) {
        toast.error('Vui lòng nhập tiêu đề câu chuyện.')
        return
      }
      if (titleWordCount > MAX_TITLE_WORDS) {
        toast.error(`Tiêu đề chỉ được tối đa ${MAX_TITLE_WORDS} từ.`)
        return
      }

      // Validate content
      const contentWordCount = countWords(editData.content)
      if (contentWordCount === 0) {
        toast.error('Vui lòng nhập nội dung câu chuyện.')
        return
      }
      if (contentWordCount > MAX_CONTENT_WORDS) {
        toast.error(`Nội dung chỉ được tối đa ${MAX_CONTENT_WORDS} từ.`)
        return
      }

      // Validate images count
      if (editData.images.length > MAX_IMAGES) {
        toast.error(`Chỉ được tối đa ${MAX_IMAGES} hình ảnh.`)
        return
      }

      if (stories.length > 0) {
        // Update existing story
        const storyId = stories[0].id

        // Determine which images are new (blob URLs or files) vs old (server URLs)
        const currentImages = editData.images || []
        const originalImages = editData.originalImages || []

        // Images that are still from server (not blob URLs) = kept images
        const keptImages = currentImages.filter((img) => !img.startsWith('blob:') && originalImages.includes(img))

        // Check if we have new image files uploaded
        const hasNewImageFiles = editData.imageFiles && editData.imageFiles.length > 0

        // If user removed some original images but kept some, we still need to replace
        // because API doesn't support partial removal - it's all or nothing
        const hasPartialRemoval =
          originalImages.length > 0 && keptImages.length > 0 && keptImages.length < originalImages.length

        // Determine video status
        const hasOriginalVideo = editData.originalVideo && editData.originalVideo.length > 0
        const hasNewVideoFile = editData.videoFile !== null
        const currentVideoIsOriginal = editData.video === editData.originalVideo && hasOriginalVideo
        const hasRemovedVideo = hasOriginalVideo && !currentVideoIsOriginal && !hasNewVideoFile

        // Prepare data for API call
        const updateData: {
          title: string
          storyDetail: string
          newThumbnail?: File
          removeExistingThumbnail?: boolean
          newStoryVideo?: File
          removeExistingStoryVideo?: boolean
          newStoryImages?: File[]
          removeExistingStoryImages?: boolean
        } = {
          title: editData.title,
          storyDetail: editData.content
        }

        // Handle Story Images
        // Logic:
        // - If user uploads new files → replace all (RemoveExisting = true)
        // - If user removes some/all original images → replace all (RemoveExisting = true)
        // - If user keeps all original images and no new files → keep existing (RemoveExisting = false)
        if (hasNewImageFiles || hasPartialRemoval || keptImages.length === 0) {
          // If we have new files OR removed some/all originals, send new files and remove existing
          if (hasNewImageFiles) {
            updateData.newStoryImages = editData.imageFiles
          }
          updateData.removeExistingStoryImages = true
        } else {
          // Keep all existing images, no new files, no removals
          updateData.removeExistingStoryImages = false
        }

        // Handle Story Video
        if (hasNewVideoFile && editData.videoFile) {
          // New video file uploaded - replace existing
          updateData.newStoryVideo = editData.videoFile
          updateData.removeExistingStoryVideo = true
        } else if (hasRemovedVideo) {
          // Video was removed but no new one uploaded
          updateData.removeExistingStoryVideo = true
        } else {
          // Keep existing video
          updateData.removeExistingStoryVideo = false
        }

        // Note: Thumbnail is not currently handled in the UI, but API supports it
        // If needed in future, add similar logic for thumbnail

        await productStoryApi.update(storyId, updateData)
        toast.success('Cập nhật câu chuyện thành công!')
      } else {
        // Create new story
        const createData: {
          productId: string
          title: string
          storyDetail?: string
          storyVideo?: File
          storyImages?: File[]
        } = {
          productId: productId,
          title: editData.title,
          storyDetail: editData.content
        }

        // Add files if they exist
        if (editData.imageFiles && editData.imageFiles.length > 0) {
          createData.storyImages = editData.imageFiles
        }

        if (editData.videoFile) {
          createData.storyVideo = editData.videoFile
        }

        await productStoryApi.create(createData)
        toast.success('Tạo câu chuyện thành công!')
      }

      await fetchStories() // Refresh data after save
      // Wait a bit to ensure state is updated
      await new Promise((resolve) => setTimeout(resolve, 100))
      // Notify parent component to refresh validation data
      if (onRefresh) {
        await onRefresh()
      }
      onToggleEditMode('story') // Exit edit mode
    } catch (err) {
      console.error('❌ Error saving story:', err)
      toast.error('Có lỗi xảy ra khi lưu câu chuyện')
    }
  }

  const handleCancel = () => {
    onCancelEdit('story')
    // Reset edit data and clean up object URLs
    editData.images.forEach((url) => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
      }
    })
    if (editData.video && editData.video.startsWith('blob:')) {
      URL.revokeObjectURL(editData.video)
    }

    if (stories.length > 0) {
      const processedData = processStoryData(stories[0])
      setEditData({
        ...processedData,
        imageFiles: [],
        videoFile: null,
        originalImages: processedData.images,
        originalVideo: processedData.video,
        originalVideoId: processedData.videoId,
        originalVideoSources: processedData.videoSources
      })
    } else {
      // Reset to default when no story exists
      setEditData({
        title: '',
        content: '',
        images: [],
        video: '',
        videoId: undefined,
        videoSources: undefined,
        imageFiles: [],
        videoFile: null,
        originalImages: [],
        originalVideo: '',
        originalVideoId: undefined,
        originalVideoSources: undefined
      })
    }
  }

  const removeImage = (index: number) => {
    const imageToRemove = editData.images[index]
    if (!imageToRemove) return

    // Check if the removed image is a blob URL (newly uploaded file)
    const isBlobUrl = imageToRemove.startsWith('blob:')

    // Clean up object URL if it's a blob
    if (isBlobUrl) {
      URL.revokeObjectURL(imageToRemove)
      // Find the corresponding file index in imageFiles
      // Count how many blob URLs appear before this index
      let blobUrlIndex = 0
      for (let i = 0; i < index; i++) {
        if (editData.images[i] && editData.images[i].startsWith('blob:')) {
          blobUrlIndex++
        }
      }
      // Remove the corresponding file from imageFiles
      const newFiles = editData.imageFiles.filter((_, i) => i !== blobUrlIndex)
      const newImages = editData.images.filter((_, i) => i !== index)

      setEditData((prev) => ({
        ...prev,
        images: newImages,
        imageFiles: newFiles
      }))
    } else {
      // If it's a server URL, just remove from images array
      // Don't remove from imageFiles since it wasn't a new upload
      const newImages = editData.images.filter((_, i) => i !== index)
      setEditData((prev) => ({
        ...prev,
        images: newImages
      }))
    }
  }

  const removeVideo = () => {
    // Clean up object URL if it's a blob
    if (editData.video && editData.video.startsWith('blob:')) {
      URL.revokeObjectURL(editData.video)
    }

    setEditData((prev) => ({
      ...prev,
      video: '',
      videoFile: null
    }))
  }

  // Process ProductStory data to match component's expected format

  // Initialize edit data when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      if (stories.length > 0) {
        const story = stories[0] // Get first story
        const processedData = processStoryData(story)
        setEditData({
          ...processedData,
          imageFiles: [], // New files start empty
          videoFile: null,
          originalImages: processedData.images, // Store original images from server
          originalVideo: processedData.video, // Store original video from server
          originalVideoId: processedData.videoId // Store original video ID from server
        })
      } else {
        // Reset to default when creating new story
        setEditData({
          title: '',
          content: '',
          images: [],
          video: '',
          videoId: undefined,
          videoSources: undefined,
          imageFiles: [],
          videoFile: null,
          originalImages: [],
          originalVideo: '',
          originalVideoId: undefined,
          originalVideoSources: undefined
        })
      }
    }
  }, [isEditMode, stories])

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      editData.images.forEach((url) => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
      if (editData.video && editData.video.startsWith('blob:')) {
        URL.revokeObjectURL(editData.video)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch stories when component mounts or productId changes
  useEffect(() => {
    if (productId) {
      fetchStories()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  // Process ProductStory data to match component's expected format
  const processStoryData = (story: ProductStory): StoryEditData => {
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
      videoSources,
      imageFiles: [], // New files start empty
      videoFile: null,
      originalImages: images, // Store original images
      originalVideo: video, // Store original video
      originalVideoId: videoId, // Store original video ID
      originalVideoSources: videoSources // Store original video sources
    }
  }

  const fetchStories = async () => {
    try {
      setLoading(true)
      const response = await productStoryApi.getByProductId(productId)
      console.log('📖 Product stories response:', response)

      if (response.status === 200) {
        // Response structure: { status, message, data: ProductStory }
        const storyData = response.data?.data || response.data
        if (storyData) {
          setStories([storyData])
        } else {
          setStories([])
        }
      }
    } catch (err) {
      console.error('❌ Error fetching stories:', err)
    } finally {
      setLoading(false)
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
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-green-700 flex items-center gap-2'>
          <BookOpen className='w-5 h-5 text-green-600' />
          Câu chuyện sản phẩm
        </CardTitle>
        <div className='flex gap-2'>
          {isEditMode ? (
            <>
              <Button size='sm' variant='outline' onClick={handleCancel}>
                <X className='w-4 h-4 mr-2' />
                Hủy
              </Button>
              <Button size='sm' onClick={handleSave} className='bg-green-600 hover:bg-green-700'>
                <Save className='w-4 h-4 mr-2' />
                Lưu
              </Button>
            </>
          ) : canEdit && stories.length > 0 ? (
            <Button size='sm' variant='outline' onClick={() => onToggleEditMode('story')}>
              <Edit className='w-4 h-4 mr-2' />
              Chỉnh sửa
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {/* Hiển thị thông báo khi không được phép chỉnh sửa */}
        {!canEdit && !isEditMode && (
          <div className='mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
            <div className='flex items-start gap-3'>
              <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
              <div>
                <p className='text-sm font-medium text-yellow-800 mb-1'>
                  Không thể chỉnh sửa trong trạng thái hiện tại
                </p>
                <p className='text-xs text-yellow-700'>
                  Sản phẩm đang được xử lý bởi hệ thống. Bạn có thể hủy để chỉnh sửa hoặc chờ kết quả duyệt.
                </p>
              </div>
            </div>
          </div>
        )}
        {isEditMode ? (
          // Edit mode for story
          <div className='space-y-6'>
            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label htmlFor='storyTitle' className='text-sm font-medium'>
                  Tiêu đề câu chuyện
                </Label>
                <span
                  className={`text-xs ${countWords(editData.title) > MAX_TITLE_WORDS ? 'text-red-500' : 'text-gray-500'
                    }`}
                >
                  {countWords(editData.title)} / {MAX_TITLE_WORDS} từ
                </span>
              </div>
              <Input
                id='storyTitle'
                value={editData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder='Nhập tiêu đề cho câu chuyện sản phẩm'
                className='mt-1'
              />
            </div>

            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label htmlFor='storyContent' className='text-sm font-medium'>
                  Nội dung câu chuyện
                </Label>
                <span
                  className={`text-xs ${countWords(editData.content) > MAX_CONTENT_WORDS ? 'text-red-500' : 'text-gray-500'
                    }`}
                >
                  {countWords(editData.content)} / {MAX_CONTENT_WORDS} từ
                </span>
              </div>
              <Textarea
                id='storyContent'
                value={editData.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder='Kể câu chuyện về sản phẩm, nguồn gốc, quy trình sản xuất...'
                className='mt-1 min-h-[150px]'
              />
            </div>

            {/* Story Images */}
            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label className='text-sm font-medium'>Hình ảnh minh họa</Label>
                <span className={`text-xs ${editData.images.length > MAX_IMAGES ? 'text-red-500' : 'text-gray-500'}`}>
                  {editData.images.length} / {MAX_IMAGES} ảnh
                </span>
              </div>
              <div className='mt-2 space-y-4'>
                {/* Current Story Images */}
                {editData.images && editData.images.length > 0 && (
                  <div>
                    <p className='text-sm text-gray-600 mb-2'>Hình ảnh hiện tại:</p>
                    <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                      {editData.images.map((image, index) => (
                        <div key={index} className='relative group'>
                          <div className='aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200'>
                            <img src={image} alt={`Story ${index + 1}`} className='w-full h-full object-cover' />
                          </div>
                          <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                            <Button
                              size='sm'
                              variant='destructive'
                              className='h-8 w-8 p-0'
                              onClick={() => removeImage(index)}
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload New Story Images */}
                {editData.images.length < MAX_IMAGES && (
                  <div className='space-y-3'>
                    <div
                      className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer'
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <Image className='w-10 h-10 text-gray-400 mx-auto mb-3' />
                      <p className='text-gray-600 mb-1'>Thêm hình ảnh cho câu chuyện</p>
                      <p className='text-sm text-gray-500'>PNG, JPG tối đa 5MB mỗi ảnh</p>
                    </div>

                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImages || editData.images.length >= MAX_IMAGES}
                      className='w-full'
                    >
                      <Upload className='w-4 h-4 mr-2' />
                      {uploadingImages ? 'Đang upload...' : 'Chọn hình ảnh'}
                    </Button>

                    <input
                      ref={imageInputRef}
                      type='file'
                      accept='image/*'
                      multiple
                      onChange={handleImageUpload}
                      className='hidden'
                    />
                  </div>
                )}
                {editData.images.length >= MAX_IMAGES && (
                  <p className='text-sm text-amber-600 text-center py-2'>
                    Đã đạt giới hạn tối đa {MAX_IMAGES} hình ảnh. Vui lòng xóa ảnh cũ để thêm ảnh mới.
                  </p>
                )}
              </div>
            </div>

            {/* Story Video */}
            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label className='text-sm font-medium'>Video câu chuyện</Label>
                <span className='text-xs text-gray-500'>{editData.video ? '1 / 1 video' : '0 / 1 video'}</span>
              </div>
              <div className='mt-2 space-y-4'>
                {editData.video && (
                  <div>
                    <p className='text-sm text-gray-600 mb-2'>Video hiện tại:</p>
                    <div className='relative'>
                      <video src={editData.video} controls className='w-full max-w-md rounded-lg' />
                      <Button size='sm' variant='destructive' className='absolute top-2 right-2' onClick={removeVideo}>
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>
                )}

                {!editData.video && (
                  <div className='space-y-3'>
                    <div
                      className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer'
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <Video className='w-10 h-10 text-gray-400 mx-auto mb-3' />
                      <p className='text-gray-600 mb-1'>Thêm video cho câu chuyện</p>
                      <p className='text-sm text-gray-500'>MP4, MOV tối đa 50MB</p>
                    </div>

                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => videoInputRef.current?.click()}
                      disabled={uploadingVideo}
                      className='w-full'
                    >
                      <Upload className='w-4 h-4 mr-2' />
                      {uploadingVideo ? 'Đang upload...' : 'Chọn video'}
                    </Button>

                    <input
                      ref={videoInputRef}
                      type='file'
                      accept='video/*'
                      onChange={handleVideoUpload}
                      className='hidden'
                    />
                  </div>
                )}
                {editData.video && (
                  <div className='space-y-3'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => videoInputRef.current?.click()}
                      disabled={uploadingVideo}
                      className='w-full'
                    >
                      <Upload className='w-4 h-4 mr-2' />
                      {uploadingVideo ? 'Đang upload...' : 'Thay thế video'}
                    </Button>

                    <input
                      ref={videoInputRef}
                      type='file'
                      accept='video/*'
                      onChange={handleVideoUpload}
                      className='hidden'
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // View mode for story
          <div className='space-y-6'>
            {currentStory ? (
              <>
                <div>
                  <h3 className='text-xl font-semibold text-gray-900 mb-3'> Tiêu đề: {currentStory.title}</h3>
                  <p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>Nội dung: {currentStory.content}</p>
                </div>

                {/* Story Images */}
                {currentStory.images && currentStory.images.length > 0 && (
                  <div>
                    <h4 className='text-lg font-medium text-gray-900 mb-3'>Hình ảnh minh họa</h4>
                    <div className='w-full h-[600px]'>
                      <ThreeDCarousel images={currentStory.images} cardW={240} cardH={320} radius={300} />
                    </div>
                  </div>
                )}

                {/* Story Video */}
                {currentStory.video && (
                  <div>
                    <h4 className='text-lg font-medium text-gray-900 mb-3'>Video câu chuyện</h4>
                    {/* Use Cloudflare Stream component if video ID is available */}
                    {currentStory.videoId ? (
                      <div className='flex justify-center'>
                        <div className='w-full max-w-2xl rounded-lg overflow-hidden'>
                          <Stream
                            src={currentStory.videoId}
                            controls
                            responsive
                            className='w-full'
                            preload='metadata'
                          />
                        </div>
                      </div>
                    ) : (
                      /* Fallback to regular video tag if no video ID */
                      <div className='flex justify-center'>
                        <video controls className='w-full max-w-2xl rounded-lg' preload='metadata' playsInline>
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
                <p className='text-gray-500 mb-6'>Thêm câu chuyện để khách hàng hiểu rõ hơn về sản phẩm</p>
                {canEdit && (
                  <Button variant='outline' onClick={() => onToggleEditMode('story')}>
                    <Edit className='w-4 h-4 mr-2' />
                    Thêm câu chuyện
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ProductStoryComponent
