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
    setStoryData((prev) => ({
      ...prev,
      [field]: file
    }))
  }

  const handleGalleryImagesChange = (files: FileList | null) => {
    if (files) {
      const filesArray = Array.from(files)
      setStoryData((prev) => ({
        ...prev,
        GalleryImages: [...prev.GalleryImages, ...filesArray]
      }))
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
        const message = response?.message || 'Câu chuyện đã được cập nhật thành công.'
        toast.success(message)
      } else {
        // Create new story
        const response = await storeStoryApi.create(storyPayload)
        const message = response?.message || 'Câu chuyện của hàng đã được tạo thành công.'
        toast.success(message)
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
        const err = error as { response?: { data?: { message?: string } }; message?: string }
        errorMessage = err?.response?.data?.message || err?.message || errorMessage
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
            <Label className='text-base font-semibold'>Tiêu đề câu chuyện *</Label>
            <Input
              placeholder='Nhập tiêu đề câu chuyện'
              value={storyData.Title}
              onChange={(e) => handleInputChange('Title', e.target.value)}
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
            <Label className='text-base font-semibold'>Giới thiệu (TextIntro)</Label>
            <Textarea
              placeholder='Nhập phần giới thiệu...'
              value={storyData.TextIntro}
              onChange={(e) => handleInputChange('TextIntro', e.target.value)}
              className='min-h-[100px]'
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
            <Textarea
              placeholder='Mô tả video mở đầu...'
              value={storyData.VideoOpenerDescription}
              onChange={(e) => handleInputChange('VideoOpenerDescription', e.target.value)}
              className='min-h-[60px]'
            />
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
            <Textarea
              placeholder='Mô tả hình ảnh đơn...'
              value={storyData.SingleImageDescription}
              onChange={(e) => handleInputChange('SingleImageDescription', e.target.value)}
              className='min-h-[60px]'
            />
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
            <Textarea
              placeholder='Mô tả thư viện ảnh...'
              value={storyData.GalleryDescription}
              onChange={(e) => handleInputChange('GalleryDescription', e.target.value)}
              className='min-h-[60px]'
            />
          </div>

          {/* Text Expanded */}
          <div className='space-y-2'>
            <Label className='text-base font-semibold'>Nội dung mở rộng (TextExpanded)</Label>
            <Textarea
              placeholder='Nhập nội dung mở rộng...'
              value={storyData.TextExpanded}
              onChange={(e) => handleInputChange('TextExpanded', e.target.value)}
              className='min-h-[100px]'
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
            <Textarea
              placeholder='Mô tả video quy trình...'
              value={storyData.VideoProcessDescription}
              onChange={(e) => handleInputChange('VideoProcessDescription', e.target.value)}
              className='min-h-[60px]'
            />
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
            <Textarea
              placeholder='Mô tả video đánh giá...'
              value={storyData.VideoTestimonialDescription}
              onChange={(e) => handleInputChange('VideoTestimonialDescription', e.target.value)}
              className='min-h-[60px]'
            />
          </div>

          {/* Text Closing */}
          <div className='space-y-2'>
            <Label className='text-base font-semibold'>Kết luận (TextClosing)</Label>
            <Textarea
              placeholder='Nhập phần kết luận...'
              value={storyData.TextClosing}
              onChange={(e) => handleInputChange('TextClosing', e.target.value)}
              className='min-h-[100px]'
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
