import { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog'
import { Video, Upload, Image as ImageIcon, X } from 'lucide-react'
import { storeStoryApi, type StoreStoryUpdateData } from '../../../apis/storeStory.api'
import { storeApi } from '../../../apis/store.api'
import { useAuth } from '../../../contexts/auth.context'
import { toast } from '../../../utils/toast'

interface CreateMyStoryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  storyId?: string | null // For edit mode
  initialData?: {
    Title: string
    TextIntro: string
    TextExpanded: string
    TextClosing: string
    VideoOpenerDescription: string
    VideoOpenerUrl?: string | null
    SingleImageDescription: string
    SingleImageUrl?: string | null
    GalleryDescription: string
    GalleryImageUrls?: string[]
    VideoProcessDescription: string
    VideoProcessUrl?: string | null
    VideoTestimonialDescription: string
    VideoTestimonialUrl?: string | null
    ThumbnailUrl?: string | null
  }
}

function CreateMyStory({ open, onOpenChange, onSuccess, storyId, initialData }: CreateMyStoryProps) {
  const isEditMode = !!storyId
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
    VideoOpenerUrl: null as string | null, // URL of existing video
    SingleImage: null as File | null,
    SingleImageDescription: '',
    SingleImageUrl: null as string | null, // URL of existing image
    GalleryImages: [] as File[],
    GalleryImageUrls: [] as string[], // URLs of existing gallery images
    GalleryDescription: '',
    VideoProcess: null as File | null,
    VideoProcessDescription: '',
    VideoProcessUrl: null as string | null, // URL of existing video
    VideoTestimonial: null as File | null,
    VideoTestimonialDescription: '',
    VideoTestimonialUrl: null as string | null, // URL of existing video
    ThumbnailImage: null as File | null,
    ThumbnailUrl: null as string | null // URL of existing thumbnail
  })

  // Load initial data when in edit mode
  useEffect(() => {
    if (open && isEditMode && initialData) {
      setStoryData({
        Title: initialData.Title || '',
        TextIntro: initialData.TextIntro || '',
        TextExpanded: initialData.TextExpanded || '',
        TextClosing: initialData.TextClosing || '',
        VideoOpener: null,
        VideoOpenerDescription: initialData.VideoOpenerDescription || '',
        VideoOpenerUrl: initialData.VideoOpenerUrl || null,
        SingleImage: null,
        SingleImageDescription: initialData.SingleImageDescription || '',
        SingleImageUrl: initialData.SingleImageUrl || null,
        GalleryImages: [],
        GalleryImageUrls: initialData.GalleryImageUrls || [],
        GalleryDescription: initialData.GalleryDescription || '',
        VideoProcess: null,
        VideoProcessDescription: initialData.VideoProcessDescription || '',
        VideoProcessUrl: initialData.VideoProcessUrl || null,
        VideoTestimonial: null,
        VideoTestimonialDescription: initialData.VideoTestimonialDescription || '',
        VideoTestimonialUrl: initialData.VideoTestimonialUrl || null,
        ThumbnailImage: null,
        ThumbnailUrl: initialData.ThumbnailUrl || null
      })
    } else if (open && !isEditMode) {
      // Reset form when opening in create mode
      setStoryData({
        Title: '',
        TextIntro: '',
        TextExpanded: '',
        TextClosing: '',
        VideoOpener: null,
        VideoOpenerDescription: '',
        VideoOpenerUrl: null,
        SingleImage: null,
        SingleImageDescription: '',
        SingleImageUrl: null,
        GalleryImages: [],
        GalleryImageUrls: [],
        GalleryDescription: '',
        VideoProcess: null,
        VideoProcessDescription: '',
        VideoProcessUrl: null,
        VideoTestimonial: null,
        VideoTestimonialDescription: '',
        VideoTestimonialUrl: null,
        ThumbnailImage: null,
        ThumbnailUrl: null
      })
    }
  }, [open, isEditMode, initialData])

  const handleInputChange = (field: keyof typeof storyData, value: string) => {
    setStoryData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileChange = (field: keyof typeof storyData, file: File | null) => {
    if (file) {
      // Validate file type and size
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
      const maxImageSize = 5 * 1024 * 1024 // 5MB
      const validFiles: File[] = []
      
      filesArray.forEach((file) => {
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
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }


  const validateForm = (): string | null => {
    // Validate Title (max 20 words)
    if (!storyData.Title.trim()) {
      return 'Vui lòng nhập tiêu đề câu chuyện'
    }
    const titleWords = countWords(storyData.Title)
    if (titleWords > 20) {
      return `Tiêu đề không được vượt quá 20 từ (hiện tại: ${titleWords} từ)`
    }

    // Validate TextIntro (max 200 words)
    if (storyData.TextIntro.trim()) {
      const introWords = countWords(storyData.TextIntro)
      if (introWords > 200) {
        return `Giới thiệu không được vượt quá 200 từ (hiện tại: ${introWords} từ)`
      }
    }

    // Validate TextExpanded (max 200 words)
    if (storyData.TextExpanded.trim()) {
      const expandedWords = countWords(storyData.TextExpanded)
      if (expandedWords > 200) {
        return `Nội dung mở rộng không được vượt quá 200 từ (hiện tại: ${expandedWords} từ)`
      }
    }

    // Validate TextClosing (max 200 words)
    if (storyData.TextClosing.trim()) {
      const closingWords = countWords(storyData.TextClosing)
      if (closingWords > 200) {
        return `Kết luận không được vượt quá 200 từ (hiện tại: ${closingWords} từ)`
      }
    }

    // Validate Descriptions (max 200 words each)
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

    // Validate Image files (max 5MB each)
    const maxImageSize = 5 * 1024 * 1024 // 5MB in bytes
    const imageFiles = [
      { file: storyData.ThumbnailImage, label: 'Ảnh đại diện' },
      { file: storyData.SingleImage, label: 'Hình ảnh đơn' }
    ]

    for (const img of imageFiles) {
      if (img.file && img.file.size > maxImageSize) {
        return `${img.label} không được vượt quá 5MB (hiện tại: ${(img.file.size / 1024 / 1024).toFixed(2)}MB)`
      }
    }

    // Validate Gallery images (max 5MB each)
    for (let i = 0; i < storyData.GalleryImages.length; i++) {
      const galleryImage = storyData.GalleryImages[i]
      if (galleryImage.size > maxImageSize) {
        return `Ảnh thư viện #${i + 1} không được vượt quá 5MB (hiện tại: ${(galleryImage.size / 1024 / 1024).toFixed(2)}MB)`
      }
    }

    // Validate Video files (max 50MB each)
    const maxVideoSize = 50 * 1024 * 1024 // 50MB in bytes
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

  // Fetch store ID
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

    // Run validation
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

      // Add optional files if they exist
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

      if (isEditMode && storyId) {
        // Update existing story
        const response = await storeStoryApi.update(storyId, storyPayload)
        // Lấy message từ backend, kiểm tra cả response.message và response.data?.message
        let successMessage = 'Câu chuyện đã được cập nhật thành công.'
        if (response?.data?.message) {
          successMessage = response.data.message
        } else if (response?.message) {
          successMessage = response.message
        }
        toast.success(successMessage)
      } else {
        // Create new story
        const response = await storeStoryApi.create(storyPayload)
        // Lấy message từ backend, kiểm tra cả response.message và response.data?.message
        let successMessage = 'Câu chuyện của hàng đã được tạo thành công.'
        if (response?.data?.message) {
          successMessage = response.data.message
        } else if (response?.message) {
          successMessage = response.message
        }
        toast.success(successMessage)
      }

      // Reset form
      setStoryData({
        Title: '',
        TextIntro: '',
        TextExpanded: '',
        TextClosing: '',
        VideoOpener: null,
        VideoOpenerDescription: '',
        VideoOpenerUrl: null,
        SingleImage: null,
        SingleImageDescription: '',
        SingleImageUrl: null,
        GalleryImages: [],
        GalleryImageUrls: [],
        GalleryDescription: '',
        VideoProcess: null,
        VideoProcessDescription: '',
        VideoProcessUrl: null,
        VideoTestimonial: null,
        VideoTestimonialDescription: '',
        VideoTestimonialUrl: null,
        ThumbnailImage: null,
        ThumbnailUrl: null
      })

      // Close dialog and call onSuccess callback
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: unknown) {
      console.error('Error creating story:', error)
      let errorMessage = 'Có lỗi xảy ra khi tạo câu chuyện. Vui lòng thử lại.'

      if (error && typeof error === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any

        // Kiểm tra message từ backend
        if (err?.message) {
          errorMessage = err.message
        } else if (err?.response?.data?.message) {
          errorMessage = err.response.data.message
        }
        // Kiểm tra errors array từ backend (validation errors)
        else if (err?.errors && Array.isArray(err.errors) && err.errors.length > 0) {
          errorMessage = err.errors.join(', ')
        } else if (
          err?.response?.data?.errors &&
          Array.isArray(err.response.data.errors) &&
          err.response.data.errors.length > 0
        ) {
          errorMessage = err.response.data.errors.join(', ')
        }
        // Kiểm tra errors object từ backend (validation errors theo field)
        else if (err?.errors && typeof err.errors === 'object' && !Array.isArray(err.errors)) {
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

  const handleClose = () => {
    // Reset form when closing
    setStoryData({
      Title: '',
      TextIntro: '',
      TextExpanded: '',
      TextClosing: '',
      VideoOpener: null,
      VideoOpenerDescription: '',
      VideoOpenerUrl: null,
      SingleImage: null,
      SingleImageDescription: '',
      SingleImageUrl: null,
      GalleryImages: [],
      GalleryImageUrls: [],
      GalleryDescription: '',
      VideoProcess: null,
      VideoProcessDescription: '',
      VideoProcessUrl: null,
      VideoTestimonial: null,
      VideoTestimonialDescription: '',
      VideoTestimonialUrl: null,
      ThumbnailImage: null,
      ThumbnailUrl: null
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-6xl lg:max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold text-green-700'>
            {isEditMode ? 'Chỉnh sửa câu chuyện' : 'Tạo câu chuyện mới'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Chỉnh sửa câu chuyện của bạn' : 'Tạo câu chuyện để chia sẻ về cửa hàng của bạn'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {/* Title */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label className='text-base font-semibold'>Tiêu đề câu chuyện *</Label>
              <span className={`text-xs ${countWords(storyData.Title) > 20 ? 'text-red-500' : 'text-gray-500'}`}>
                {countWords(storyData.Title)} / 20 từ
              </span>
            </div>
            <Input
              placeholder='Nhập tiêu đề câu chuyện'
              value={storyData.Title}
              onChange={(e) => handleInputChange('Title', e.target.value)}
              className={countWords(storyData.Title) > 20 ? 'border-red-500' : ''}
            />
          </div>

          {/* Thumbnail Image */}
          <div className='space-y-2'>
            <Label className='text-base font-semibold'>Ảnh đại diện</Label>
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center'>
              {storyData.ThumbnailImage ? (
                <div className='space-y-2'>
                  <img
                    src={URL.createObjectURL(storyData.ThumbnailImage)}
                    alt='Thumbnail'
                    className='w-full h-32 object-cover rounded mx-auto'
                  />
                  <p className='text-sm text-gray-600'>{storyData.ThumbnailImage.name}</p>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleFileChange('ThumbnailImage', null)}
                    className='text-red-600 hover:text-red-700'
                  >
                    <X className='w-4 h-4 mr-1' />
                    Xóa
                  </Button>
                </div>
              ) : storyData.ThumbnailUrl ? (
                <div className='space-y-2'>
                  <img
                    src={storyData.ThumbnailUrl}
                    alt='Thumbnail'
                    className='w-full h-32 object-cover rounded mx-auto'
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'https://via.placeholder.com/800x400?text=No+Image'
                    }}
                  />
                  <p className='text-sm text-gray-600'>Ảnh hiện tại</p>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setStoryData((prev) => ({ ...prev, ThumbnailUrl: null }))
                      document.getElementById('thumbnail-upload')?.click()
                    }}
                    className='text-blue-600 hover:text-blue-700'
                  >
                    <Upload className='w-4 h-4 mr-1' />
                    Thay đổi
                  </Button>
                </div>
              ) : (
                <>
                  <ImageIcon className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                  <p className='text-gray-500 mb-2 text-sm'>Tải lên ảnh đại diện</p>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={(e) => handleFileChange('ThumbnailImage', e.target.files?.[0] || null)}
                    className='hidden'
                    id='thumbnail-upload'
                  />
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => document.getElementById('thumbnail-upload')?.click()}
                  >
                    <Upload className='w-4 h-4 mr-1' />
                    Chọn ảnh
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Text Intro */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label className='text-base font-semibold'>Giới thiệu (TextIntro)</Label>
              <span className={`text-xs ${countWords(storyData.TextIntro) > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                {countWords(storyData.TextIntro)} / 200 từ
              </span>
            </div>
            <Textarea
              placeholder='Nhập phần giới thiệu...'
              value={storyData.TextIntro}
              onChange={(e) => handleInputChange('TextIntro', e.target.value)}
              className={`min-h-[100px] ${countWords(storyData.TextIntro) > 200 ? 'border-red-500' : ''}`}
            />
          </div>

          {/* Video Opener */}
          <div className='space-y-2'>
            <Label className='text-base font-semibold'>Video mở đầu</Label>
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-4'>
              {storyData.VideoOpener ? (
                <div className='space-y-2'>
                  <video src={URL.createObjectURL(storyData.VideoOpener)} controls className='w-full h-32 rounded' />
                  <p className='text-sm text-gray-600'>{storyData.VideoOpener.name}</p>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleFileChange('VideoOpener', null)}
                    className='text-red-600 hover:text-red-700'
                  >
                    <X className='w-4 h-4 mr-1' />
                    Xóa
                  </Button>
                </div>
              ) : storyData.VideoOpenerUrl ? (
                <div className='space-y-2'>
                  <video src={storyData.VideoOpenerUrl} controls className='w-full h-32 rounded' />
                  <p className='text-sm text-gray-600'>Video hiện tại</p>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setStoryData((prev) => ({ ...prev, VideoOpenerUrl: null }))
                      document.getElementById('video-opener-upload')?.click()
                    }}
                    className='text-blue-600 hover:text-blue-700'
                  >
                    <Upload className='w-4 h-4 mr-1' />
                    Thay đổi
                  </Button>
                </div>
              ) : (
                <>
                  <Video className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                  <p className='text-gray-500 mb-2 text-sm'>Tải lên video mở đầu</p>
                  <input
                    type='file'
                    accept='video/*'
                    onChange={(e) => handleFileChange('VideoOpener', e.target.files?.[0] || null)}
                    className='hidden'
                    id='video-opener-upload'
                  />
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => document.getElementById('video-opener-upload')?.click()}
                  >
                    <Upload className='w-4 h-4 mr-1' />
                    Chọn video
                  </Button>
                </>
              )}
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label className='text-sm font-medium'>Mô tả video mở đầu</Label>
                <span className={`text-xs ${countWords(storyData.VideoOpenerDescription) > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                  {countWords(storyData.VideoOpenerDescription)} / 200 từ
                </span>
              </div>
              <Textarea
                placeholder='Mô tả video mở đầu...'
                value={storyData.VideoOpenerDescription}
                onChange={(e) => handleInputChange('VideoOpenerDescription', e.target.value)}
                className={`min-h-[60px] ${countWords(storyData.VideoOpenerDescription) > 200 ? 'border-red-500' : ''}`}
              />
            </div>
          </div>

          {/* Single Image */}
          <div className='space-y-2'>
            <Label className='text-base font-semibold'>Hình ảnh đơn</Label>
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-4'>
              {storyData.SingleImage ? (
                <div className='space-y-2'>
                  <img
                    src={URL.createObjectURL(storyData.SingleImage)}
                    alt='Single image'
                    className='w-full h-32 object-cover rounded mx-auto'
                  />
                  <p className='text-sm text-gray-600'>{storyData.SingleImage.name}</p>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleFileChange('SingleImage', null)}
                    className='text-red-600 hover:text-red-700'
                  >
                    <X className='w-4 h-4 mr-1' />
                    Xóa
                  </Button>
                </div>
              ) : storyData.SingleImageUrl ? (
                <div className='space-y-2'>
                  <img
                    src={storyData.SingleImageUrl}
                    alt='Single image'
                    className='w-full h-32 object-cover rounded mx-auto'
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'https://via.placeholder.com/800x400?text=No+Image'
                    }}
                  />
                  <p className='text-sm text-gray-600'>Ảnh hiện tại</p>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setStoryData((prev) => ({ ...prev, SingleImageUrl: null }))
                      document.getElementById('single-image-upload')?.click()
                    }}
                    className='text-blue-600 hover:text-blue-700'
                  >
                    <Upload className='w-4 h-4 mr-1' />
                    Thay đổi
                  </Button>
                </div>
              ) : (
                <>
                  <ImageIcon className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                  <p className='text-gray-500 mb-2 text-sm'>Tải lên hình ảnh đơn</p>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={(e) => handleFileChange('SingleImage', e.target.files?.[0] || null)}
                    className='hidden'
                    id='single-image-upload'
                  />
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => document.getElementById('single-image-upload')?.click()}
                  >
                    <Upload className='w-4 h-4 mr-1' />
                    Chọn ảnh
                  </Button>
                </>
              )}
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label className='text-sm font-medium'>Mô tả hình ảnh đơn</Label>
                <span className={`text-xs ${countWords(storyData.SingleImageDescription) > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                  {countWords(storyData.SingleImageDescription)} / 200 từ
                </span>
              </div>
              <Textarea
                placeholder='Mô tả hình ảnh đơn...'
                value={storyData.SingleImageDescription}
                onChange={(e) => handleInputChange('SingleImageDescription', e.target.value)}
                className={`min-h-[60px] ${countWords(storyData.SingleImageDescription) > 200 ? 'border-red-500' : ''}`}
              />
            </div>
          </div>

          {/* Gallery Images */}
          <div className='space-y-2'>
            <Label className='text-base font-semibold'>Thư viện ảnh</Label>
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-4'>
              <ImageIcon className='w-8 h-8 text-gray-400 mx-auto mb-2' />
              <p className='text-gray-500 mb-2 text-sm'>Tải lên nhiều ảnh (có thể chọn nhiều)</p>
              <input
                type='file'
                accept='image/*'
                multiple
                onChange={(e) => handleGalleryImagesChange(e.target.files)}
                className='hidden'
                id='gallery-images-upload'
              />
              <Button
                variant='outline'
                size='sm'
                onClick={() => document.getElementById('gallery-images-upload')?.click()}
              >
                <Upload className='w-4 h-4 mr-1' />
                Chọn nhiều ảnh
              </Button>
              {(storyData.GalleryImages.length > 0 || storyData.GalleryImageUrls.length > 0) && (
                <div className='mt-4'>
                  <p className='text-sm text-gray-600 mb-2'>
                    Đã chọn {storyData.GalleryImages.length} ảnh mới, {storyData.GalleryImageUrls.length} ảnh hiện có
                  </p>
                  <div className='grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3'>
                    {/* Existing gallery images */}
                    {storyData.GalleryImageUrls.map((imgUrl, idx) => (
                      <div key={`url-${idx}`} className='relative group'>
                        <img
                          src={imgUrl}
                          alt={`Gallery existing ${idx + 1}`}
                          className='w-full h-24 object-cover rounded border border-gray-200'
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = 'https://via.placeholder.com/800x400?text=No+Image'
                          }}
                        />
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => removeGalleryImageUrl(idx)}
                          className='absolute top-1 right-1 p-1 h-6 w-6 bg-red-500 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity'
                        >
                          <X className='w-3 h-3' />
                        </Button>
                        <div className='absolute bottom-1 left-1 bg-blue-500/50 text-white text-xs px-1 rounded'>
                          Cũ
                        </div>
                      </div>
                    ))}
                    {/* New gallery images */}
                    {storyData.GalleryImages.map((img, idx) => (
                      <div key={`file-${idx}`} className='relative group'>
                        <img
                          src={URL.createObjectURL(img)}
                          alt={`Gallery new ${idx + 1}`}
                          className='w-full h-24 object-cover rounded border border-gray-200'
                        />
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => removeGalleryImage(idx)}
                          className='absolute top-1 right-1 p-1 h-6 w-6 bg-red-500 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity'
                        >
                          <X className='w-3 h-3' />
                        </Button>
                        <div className='absolute bottom-1 left-1 bg-green-500/50 text-white text-xs px-1 rounded'>
                          Mới
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label className='text-sm font-medium'>Mô tả thư viện ảnh</Label>
                <span className={`text-xs ${countWords(storyData.GalleryDescription) > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                  {countWords(storyData.GalleryDescription)} / 200 từ
                </span>
              </div>
              <Textarea
                placeholder='Mô tả thư viện ảnh...'
                value={storyData.GalleryDescription}
                onChange={(e) => handleInputChange('GalleryDescription', e.target.value)}
                className={`min-h-[60px] ${countWords(storyData.GalleryDescription) > 200 ? 'border-red-500' : ''}`}
              />
            </div>
          </div>

          {/* Text Expanded */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label className='text-base font-semibold'>Nội dung mở rộng (TextExpanded)</Label>
              <span className={`text-xs ${countWords(storyData.TextExpanded) > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                {countWords(storyData.TextExpanded)} / 200 từ
              </span>
            </div>
            <Textarea
              placeholder='Nhập nội dung mở rộng...'
              value={storyData.TextExpanded}
              onChange={(e) => handleInputChange('TextExpanded', e.target.value)}
              className={`min-h-[100px] ${countWords(storyData.TextExpanded) > 200 ? 'border-red-500' : ''}`}
            />
          </div>

          {/* Video Process */}
          <div className='space-y-2'>
            <Label className='text-base font-semibold'>Video quy trình</Label>
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-4'>
              {storyData.VideoProcess ? (
                <div className='space-y-2'>
                  <video src={URL.createObjectURL(storyData.VideoProcess)} controls className='w-full h-32 rounded' />
                  <p className='text-sm text-gray-600'>{storyData.VideoProcess.name}</p>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleFileChange('VideoProcess', null)}
                    className='text-red-600 hover:text-red-700'
                  >
                    <X className='w-4 h-4 mr-1' />
                    Xóa
                  </Button>
                </div>
              ) : storyData.VideoProcessUrl ? (
                <div className='space-y-2'>
                  <video src={storyData.VideoProcessUrl} controls className='w-full h-32 rounded' />
                  <p className='text-sm text-gray-600'>Video hiện tại</p>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setStoryData((prev) => ({ ...prev, VideoProcessUrl: null }))
                      document.getElementById('video-process-upload')?.click()
                    }}
                    className='text-blue-600 hover:text-blue-700'
                  >
                    <Upload className='w-4 h-4 mr-1' />
                    Thay đổi
                  </Button>
                </div>
              ) : (
                <>
                  <Video className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                  <p className='text-gray-500 mb-2 text-sm'>Tải lên video quy trình</p>
                  <input
                    type='file'
                    accept='video/*'
                    onChange={(e) => handleFileChange('VideoProcess', e.target.files?.[0] || null)}
                    className='hidden'
                    id='video-process-upload'
                  />
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => document.getElementById('video-process-upload')?.click()}
                  >
                    <Upload className='w-4 h-4 mr-1' />
                    Chọn video
                  </Button>
                </>
              )}
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label className='text-sm font-medium'>Mô tả video quy trình</Label>
                <span className={`text-xs ${countWords(storyData.VideoProcessDescription) > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                  {countWords(storyData.VideoProcessDescription)} / 200 từ
                </span>
              </div>
              <Textarea
                placeholder='Mô tả video quy trình...'
                value={storyData.VideoProcessDescription}
                onChange={(e) => handleInputChange('VideoProcessDescription', e.target.value)}
                className={`min-h-[60px] ${countWords(storyData.VideoProcessDescription) > 200 ? 'border-red-500' : ''}`}
              />
            </div>
          </div>

          {/* Video Testimonial */}
          <div className='space-y-2'>
            <Label className='text-base font-semibold'>Video đánh giá</Label>
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-4'>
              {storyData.VideoTestimonial ? (
                <div className='space-y-2'>
                  <video
                    src={URL.createObjectURL(storyData.VideoTestimonial)}
                    controls
                    className='w-full h-32 rounded'
                  />
                  <p className='text-sm text-gray-600'>{storyData.VideoTestimonial.name}</p>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleFileChange('VideoTestimonial', null)}
                    className='text-red-600 hover:text-red-700'
                  >
                    <X className='w-4 h-4 mr-1' />
                    Xóa
                  </Button>
                </div>
              ) : storyData.VideoTestimonialUrl ? (
                <div className='space-y-2'>
                  <video src={storyData.VideoTestimonialUrl} controls className='w-full h-32 rounded' />
                  <p className='text-sm text-gray-600'>Video hiện tại</p>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setStoryData((prev) => ({ ...prev, VideoTestimonialUrl: null }))
                      document.getElementById('video-testimonial-upload')?.click()
                    }}
                    className='text-blue-600 hover:text-blue-700'
                  >
                    <Upload className='w-4 h-4 mr-1' />
                    Thay đổi
                  </Button>
                </div>
              ) : (
                <>
                  <Video className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                  <p className='text-gray-500 mb-2 text-sm'>Tải lên video đánh giá</p>
                  <input
                    type='file'
                    accept='video/*'
                    onChange={(e) => handleFileChange('VideoTestimonial', e.target.files?.[0] || null)}
                    className='hidden'
                    id='video-testimonial-upload'
                  />
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => document.getElementById('video-testimonial-upload')?.click()}
                  >
                    <Upload className='w-4 h-4 mr-1' />
                    Chọn video
                  </Button>
                </>
              )}
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label className='text-sm font-medium'>Mô tả video đánh giá</Label>
                <span className={`text-xs ${countWords(storyData.VideoTestimonialDescription) > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                  {countWords(storyData.VideoTestimonialDescription)} / 200 từ
                </span>
              </div>
              <Textarea
                placeholder='Mô tả video đánh giá...'
                value={storyData.VideoTestimonialDescription}
                onChange={(e) => handleInputChange('VideoTestimonialDescription', e.target.value)}
                className={`min-h-[60px] ${countWords(storyData.VideoTestimonialDescription) > 200 ? 'border-red-500' : ''}`}
              />
            </div>
          </div>

          {/* Text Closing */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label className='text-base font-semibold'>Kết luận (TextClosing)</Label>
              <span className={`text-xs ${countWords(storyData.TextClosing) > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                {countWords(storyData.TextClosing)} / 200 từ
              </span>
            </div>
            <Textarea
              placeholder='Nhập phần kết luận...'
              value={storyData.TextClosing}
              onChange={(e) => handleInputChange('TextClosing', e.target.value)}
              className={`min-h-[100px] ${countWords(storyData.TextClosing) > 200 ? 'border-red-500' : ''}`}
            />
          </div>
        </div>

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleCreateStory} disabled={loading} className='bg-green-600 hover:bg-green-700 text-white'>
            {loading ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                {isEditMode ? 'Đang cập nhật...' : 'Đang tạo...'}
              </>
            ) : isEditMode ? (
              'Cập nhật câu chuyện'
            ) : (
              'Tạo câu chuyện'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateMyStory
