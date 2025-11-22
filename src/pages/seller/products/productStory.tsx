import { useState, useEffect, useRef } from 'react'
import { toast } from '../../../utils/toast'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { BookOpen, Edit, Save, X, Trash2, Image, Video, Upload, AlertCircle } from 'lucide-react'
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
  // Add file storage for actual files
  imageFiles: File[]
  videoFile: File | null
  // Track original images/video from server (to distinguish old vs new)
  originalImages: string[]
  originalVideo: string
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
    imageFiles: [],
    videoFile: null,
    originalImages: [],
    originalVideo: ''
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
        originalVideo: processedData.video
      })
    } else {
      // Reset to default when no story exists
      setEditData({
        title: '',
        content: '',
        images: [],
        video: '',
        imageFiles: [],
        videoFile: null,
        originalImages: [],
        originalVideo: ''
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
          originalVideo: processedData.video // Store original video from server
        })
      } else {
        // Reset to default when creating new story
        setEditData({
          title: '',
          content: '',
          images: [],
          video: '',
          imageFiles: [],
          videoFile: null,
          originalImages: [],
          originalVideo: ''
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
    const textContents = story.contents
      .filter((content) => content.contentType === 'text')
      .sort((a, b) => a.order - b.order)
      .map((content) => content.contentData)
      .join('\n\n')

    const mediaContents = story.contents
      .filter((content) => content.contentType === 'media')
      .sort((a, b) => a.order - b.order)

    const images: string[] = []
    let video = ''

    mediaContents.forEach((content) => {
      try {
        // Check if contentData is a JSON array (for images)
        if (content.contentData.startsWith('[')) {
          const parsedImages = JSON.parse(content.contentData)
          if (Array.isArray(parsedImages)) {
            images.push(...parsedImages)
          }
        } else {
          // Single media file - check if it's video or image
          if (content.contentData.includes('.mp4') || content.contentData.includes('.mov')) {
            video = content.contentData
          } else {
            images.push(content.contentData)
          }
        }
      } catch {
        // If not JSON, treat as single media file
        if (content.contentData.includes('.mp4') || content.contentData.includes('.mov')) {
          video = content.contentData
        } else {
          images.push(content.contentData)
        }
      }
    })

    return {
      title: story.title || '',
      content: textContents,
      images,
      video,
      imageFiles: [], // New files start empty
      videoFile: null,
      originalImages: images, // Store original images
      originalVideo: video // Store original video
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
                <span
                  className={`text-xs ${editData.images.length > MAX_IMAGES ? 'text-red-500' : 'text-gray-500'}`}
                >
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
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                      {currentStory.images.map((image: string, index: number) => (
                        <div key={index} className='aspect-video bg-gray-100 rounded-lg overflow-hidden'>
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
                  <div>
                    <h4 className='text-lg font-medium text-gray-900 mb-3'>Video câu chuyện</h4>
                    <video src={currentStory.video} controls className='w-full max-w-2xl rounded-lg' />
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
