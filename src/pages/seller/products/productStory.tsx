import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { BookOpen, Edit, Save, X, Trash2, Image, Video, Upload } from 'lucide-react'
import { productStoryApi } from '../../../apis/productStory.api'
import type { ProductStory } from '../../../types/productStoryType'

interface ProductStoryProps {
  productId: string
  productStory?: ProductStory
  isEditMode: boolean
  onToggleEditMode: (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => void
  onCancelEdit: (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => void
  onSaveSection: (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => Promise<void>
}

interface StoryEditData {
  title: string
  content: string
  images: string[]
  video: string
  // Add file storage for actual files
  imageFiles: File[]
  videoFile: File | null
}

function ProductStoryComponent({ productId, isEditMode, onToggleEditMode, onCancelEdit }: ProductStoryProps) {
  const [stories, setStories] = useState<ProductStory[]>([])
  const [loading, setLoading] = useState(false)
  const [editData, setEditData] = useState<StoryEditData>({
    title: '',
    content: '',
    images: [],
    video: '',
    imageFiles: [],
    videoFile: null
  })

  // Fix: Add setters for upload states
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  // File input refs
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Handle image upload - just store files and create preview URLs
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true) // Set loading state

    const validFiles: File[] = []
    const previewUrls: string[] = []

    Array.from(files).forEach((file) => {
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
      toast.success(`Đã chọn ${validFiles.length} hình ảnh!`)
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

    toast.success('Đã chọn video!')

    // Reset input
    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }

    setUploadingVideo(false) // Reset loading state
  }

  const handleSave = async () => {
    try {
      if (stories.length > 0) {
        const storyId = stories[0].id

        // Prepare data for API call
        const updateData: any = {
          title: editData.title,
          storyDetail: editData.content
        }

        // Add files if they exist
        if (editData.imageFiles && editData.imageFiles.length > 0) {
          updateData.storyImages = editData.imageFiles
        }

        if (editData.videoFile) {
          updateData.storyVideo = editData.videoFile
        }

        await productStoryApi.update(storyId, updateData)
      }

      await fetchStories() // Refresh data after save
      onToggleEditMode('story') // Exit edit mode
      toast.success('Lưu câu chuyện thành công!')
    } catch (error) {
      console.error('❌ Error saving story:', error)
      toast.error('Có lỗi xảy ra khi lưu câu chuyện')
    }
  }

  const handleCancel = () => {
    onCancelEdit('story')
    // Reset edit data and clean up object URLs
    editData.images.forEach((url) => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
      }
    })
    if (editData.video.startsWith('blob:')) {
      URL.revokeObjectURL(editData.video)
    }

    if (stories.length > 0) {
      const processedData = processStoryData(stories[0])
      setEditData({
        ...processedData,
        imageFiles: [],
        videoFile: null
      })
    }
  }

  const removeImage = (index: number) => {
    const imageToRemove = editData.images[index]

    // Clean up object URL if it's a blob
    if (imageToRemove && imageToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove)
    }

    const newImages = editData.images.filter((_, i) => i !== index)
    const newFiles = editData.imageFiles.filter((_, i) => i !== index)

    setEditData((prev) => ({
      ...prev,
      images: newImages,
      imageFiles: newFiles
    }))
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
    if (isEditMode && stories.length > 0) {
      const story = stories[0] // Get first story
      const processedData = processStoryData(story)
      setEditData({
        ...processedData,
        imageFiles: [], // New files start empty
        videoFile: null
      })
    }
  }, [isEditMode, stories])

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      editData.images.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
      if (editData.video.startsWith('blob:')) {
        URL.revokeObjectURL(editData.video)
      }
    }
  }, [])

  // Fetch stories when component mounts or productId changes
  useEffect(() => {
    if (productId) {
      fetchStories()
    }
  }, [productId])

  // Initialize edit data when entering edit mode
  useEffect(() => {
    if (isEditMode && stories.length > 0) {
      const story = stories[0] // Get first story
      const processedData = processStoryData(story)
      setEditData(processedData)
    }
  }, [isEditMode, stories])

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
      } catch (error) {
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
      videoFile: null
    }
  }

  const fetchStories = async () => {
    try {
      setLoading(true)
      const response = await productStoryApi.getByProductId(productId)
      console.log('📖 Product stories response:', response)

      if (response.status === 200) {
        if (response.data) {
          setStories([response.data])
        } else {
          setStories([])
        }
      }
    } catch (error) {
      console.error('❌ Error fetching stories:', error)
      toast.error('Không thể tải danh sách câu chuyện')
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
          ) : (
            <Button size='sm' variant='outline' onClick={() => onToggleEditMode('story')}>
              <Edit className='w-4 h-4 mr-2' />
              Chỉnh sửa
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditMode ? (
          // Edit mode for story
          <div className='space-y-6'>
            <div>
              <Label htmlFor='storyTitle' className='text-sm font-medium'>
                Tiêu đề câu chuyện
              </Label>
              <Input
                id='storyTitle'
                value={editData.title}
                onChange={(e) => setEditData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder='Nhập tiêu đề cho câu chuyện sản phẩm'
                className='mt-1'
              />
            </div>

            <div>
              <Label htmlFor='storyContent' className='text-sm font-medium'>
                Nội dung câu chuyện
              </Label>
              <Textarea
                id='storyContent'
                value={editData.content}
                onChange={(e) => setEditData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder='Kể câu chuyện về sản phẩm, nguồn gốc, quy trình sản xuất...'
                className='mt-1 min-h-[150px]'
              />
            </div>

            {/* Story Images */}
            <div>
              <Label className='text-sm font-medium'>Hình ảnh minh họa</Label>
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
                    disabled={uploadingImages}
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
              </div>
            </div>

            {/* Story Video */}
            <div>
              <Label className='text-sm font-medium'>Video câu chuyện</Label>
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
              </div>
            </div>
          </div>
        ) : (
          // View mode for story
          <div className='space-y-6'>
            {currentStory ? (
              <>
                <div>
                  <h3 className='text-xl font-semibold text-gray-900 mb-3'>{currentStory.title}</h3>
                  <p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>{currentStory.content}</p>
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
                <Button variant='outline' onClick={() => onToggleEditMode('story')}>
                  <Edit className='w-4 h-4 mr-2' />
                  Thêm câu chuyện
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ProductStoryComponent
