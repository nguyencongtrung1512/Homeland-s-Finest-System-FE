import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { Video, Upload, Image as ImageIcon, X, FileText, Loader2, ChevronRight, Plus, Eye } from 'lucide-react'
import { storeStoryApi, type StoreStoryUpdateData } from '../../../apis/storeStory.api'
import { storeApi } from '../../../apis/store.api'
import { useAuth } from '../../../contexts/auth.context'
import { toast } from '../../../utils/toast'
import { Stream } from '@cloudflare/stream-react'
import { StoryContentCarousel } from '../../../components/ui/next-storyConten'
import { formatDate } from '../../../utils/formatDate'
import path from '../../../constants/path'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogTrigger } from '../../../components/ui/dialog'
import { StoreStoryContentType } from '../../../constants/storeStoryContentType'

function CreateMyStoryPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const params = useParams<{ storyId?: string }>()
  const [searchParams] = useSearchParams()
  const editStoryId = params.storyId || searchParams.get('edit')
  const isEditMode = !!editStoryId
  const [loading, setLoading] = useState(false)
  const [loadingStory, setLoadingStory] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false)
  const dragCounterThumbnail = React.useRef(0)
  const [isDraggingSingleImage, setIsDraggingSingleImage] = useState(false)
  const dragCounterSingleImage = React.useRef(0)
  const [isDraggingGallery, setIsDraggingGallery] = useState(false)
  const dragCounterGallery = React.useRef(0)
  const [isDraggingVideoOpener, setIsDraggingVideoOpener] = useState(false)
  const dragCounterVideoOpener = React.useRef(0)
  const [isDraggingVideoProcess, setIsDraggingVideoProcess] = useState(false)
  const dragCounterVideoProcess = React.useRef(0)
  const [isDraggingVideoTestimonial, setIsDraggingVideoTestimonial] = useState(false)
  const dragCounterVideoTestimonial = React.useRef(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // State để track các flag RemoveExisting khi chỉnh sửa
  const [removeFlags, setRemoveFlags] = useState({
    RemoveExistingThumbnail: false,
    RemoveExistingVideoOpener: false,
    RemoveExistingSingleImage: false,
    RemoveExistingTextExpanded: false,
    RemoveExistingVideoProcess: false,
    RemoveExistingGalleryImages: false,
    RemoveExistingVideoTestimonial: false
  })

  // Hàm kiểm tra phần bắt buộc đã hoàn thành chưa
  // const isRequiredFieldCompleted = (field: 'title' | 'thumbnail' | 'videoOpener' | 'textIntro' | 'textClosing'): boolean => {
  //   switch (field) {
  //     case 'title':
  //       return !!storyData.Title.trim()
  //     case 'thumbnail':
  //       return !!storyData.ThumbnailImage
  //     case 'videoOpener':
  //       return !!storyData.VideoOpener
  //     case 'textIntro':
  //       return !!storyData.TextIntro.trim()
  //     case 'textClosing':
  //       return !!storyData.TextClosing.trim()
  //     default:
  //       return false
  //   }
  // }



  const [storyData, setStoryData] = useState({
    Title: '',
    TextIntro: '',
    TextExpanded: '',
    TextClosing: '',
    VideoOpener: null as File | null,
    VideoOpenerDescription: '',
    VideoOpenerUrl: null as string | null,
    VideoOpenerPreviewUrl: null as string | null,
    VideoOpenerPlayBackUrl: null as string | null,
    VideoOpenerFallBackUrl: null as string | null,
    SingleImage: null as File | null,
    SingleImageDescription: '',
    SingleImageUrl: null as string | null,
    GalleryImages: [] as File[],
    GalleryImageUrls: [] as string[],
    GalleryDescription: '',
    VideoProcess: null as File | null,
    VideoProcessDescription: '',
    VideoProcessUrl: null as string | null,
    VideoProcessPreviewUrl: null as string | null,
    VideoProcessPlayBackUrl: null as string | null,
    VideoProcessFallBackUrl: null as string | null,
    VideoTestimonial: null as File | null,
    VideoTestimonialDescription: '',
    VideoTestimonialUrl: null as string | null,
    VideoTestimonialPreviewUrl: null as string | null,
    VideoTestimonialPlayBackUrl: null as string | null,
    VideoTestimonialFallBackUrl: null as string | null,
    ThumbnailImage: null as File | null,
    ThumbnailUrl: null as string | null
  })

  // Memoize riêng các text fields để tránh re-render khi nhập text
  const titleCompleted = useMemo(() => !!storyData.Title.trim(), [storyData.Title])
  const textIntroCompleted = useMemo(() => !!storyData.TextIntro.trim(), [storyData.TextIntro])
  const textClosingCompleted = useMemo(() => !!storyData.TextClosing.trim(), [storyData.TextClosing])

  // Memoize các giá trị completion để tránh tính toán lại không cần thiết
  const requiredFieldsCompleted = useMemo(() => ({
    title: titleCompleted,
    thumbnail: !!storyData.ThumbnailImage,
    videoOpener: !!storyData.VideoOpener,
    textIntro: textIntroCompleted,
    textClosing: textClosingCompleted
  }), [titleCompleted, storyData.ThumbnailImage, storyData.VideoOpener, textIntroCompleted, textClosingCompleted])

  const optionalFieldsCompleted = useMemo(() => ({
    singleImage: !!storyData.SingleImage,
    galleryImages: storyData.GalleryImages.length > 0 || storyData.GalleryImageUrls.length > 0,
    textExpanded: !!storyData.TextExpanded.trim(),
    videoProcess: !!storyData.VideoProcess,
    videoTestimonial: !!storyData.VideoTestimonial
  }), [
    storyData.SingleImage,
    storyData.GalleryImages.length,
    storyData.GalleryImageUrls.length,
    storyData.TextExpanded,
    storyData.VideoProcess,
    storyData.VideoTestimonial
  ])

  // Memoize URLs để tránh tạo lại mỗi lần render
  // Priority: New file > Existing URL from backend
  const videoOpenerUrl = useMemo(() => {
    if (storyData.VideoOpener) {
      return URL.createObjectURL(storyData.VideoOpener)
    }
    // Use backend URL if no new file uploaded - check all URL fields
    return (
      storyData.VideoOpenerUrl ||
      storyData.VideoOpenerPlayBackUrl ||
      storyData.VideoOpenerPreviewUrl ||
      storyData.VideoOpenerFallBackUrl ||
      null
    )
  }, [
    storyData.VideoOpener,
    storyData.VideoOpenerUrl,
    storyData.VideoOpenerPlayBackUrl,
    storyData.VideoOpenerPreviewUrl,
    storyData.VideoOpenerFallBackUrl
  ])

  const singleImageUrl = useMemo(() => {
    return storyData.SingleImage ? URL.createObjectURL(storyData.SingleImage) : null
  }, [storyData.SingleImage])

  const videoProcessUrl = useMemo(() => {
    if (storyData.VideoProcess) {
      return URL.createObjectURL(storyData.VideoProcess)
    }
    // Use backend URL if no new file uploaded - check all URL fields
    return (
      storyData.VideoProcessUrl ||
      storyData.VideoProcessPlayBackUrl ||
      storyData.VideoProcessPreviewUrl ||
      storyData.VideoProcessFallBackUrl ||
      null
    )
  }, [
    storyData.VideoProcess,
    storyData.VideoProcessUrl,
    storyData.VideoProcessPlayBackUrl,
    storyData.VideoProcessPreviewUrl,
    storyData.VideoProcessFallBackUrl
  ])

  const videoTestimonialUrl = useMemo(() => {
    if (storyData.VideoTestimonial) {
      return URL.createObjectURL(storyData.VideoTestimonial)
    }
    // Use backend URL if no new file uploaded - check all URL fields
    return (
      storyData.VideoTestimonialUrl ||
      storyData.VideoTestimonialPlayBackUrl ||
      storyData.VideoTestimonialPreviewUrl ||
      storyData.VideoTestimonialFallBackUrl ||
      null
    )
  }, [
    storyData.VideoTestimonial,
    storyData.VideoTestimonialUrl,
    storyData.VideoTestimonialPlayBackUrl,
    storyData.VideoTestimonialPreviewUrl,
    storyData.VideoTestimonialFallBackUrl
  ])

  const thumbnailUrl = useMemo(() => {
    // Priority: New file > Existing URL from backend
    if (storyData.ThumbnailImage) {
      return URL.createObjectURL(storyData.ThumbnailImage)
    }
    // Use backend URL if no new file uploaded
    return storyData.ThumbnailUrl || null
  }, [storyData.ThumbnailImage, storyData.ThumbnailUrl])

  // Memoize gallery image URLs - chỉ tạo lại khi mảng thay đổi
  const galleryImageUrls = useMemo(() => {
    return storyData.GalleryImages.map((file) => URL.createObjectURL(file))
  }, [storyData.GalleryImages])

  // Cleanup URLs khi component unmount hoặc file thay đổi
  useEffect(() => {
    return () => {
      if (videoOpenerUrl) URL.revokeObjectURL(videoOpenerUrl)
      if (singleImageUrl) URL.revokeObjectURL(singleImageUrl)
      if (videoProcessUrl) URL.revokeObjectURL(videoProcessUrl)
      if (videoTestimonialUrl) URL.revokeObjectURL(videoTestimonialUrl)
      if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl)
      galleryImageUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [videoOpenerUrl, singleImageUrl, videoProcessUrl, videoTestimonialUrl, thumbnailUrl, galleryImageUrls])

  const handleInputChange = useCallback((field: keyof typeof storyData, value: string) => {
    setStoryData((prev) => ({
      ...prev,
      [field]: value
    }))
  }, [])

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

    // Khi xóa file (file = null) trong chế độ chỉnh sửa, cần set flag RemoveExisting và clear URL
    if (!file && isEditMode) {
      if (field === 'ThumbnailImage') {
        setRemoveFlags((prev) => ({ ...prev, RemoveExistingThumbnail: true }))
        setStoryData((prev) => ({
          ...prev,
          ThumbnailImage: null,
          ThumbnailUrl: null
        }))
        return
      } else if (field === 'VideoOpener') {
        setRemoveFlags((prev) => ({ ...prev, RemoveExistingVideoOpener: true }))
        setStoryData((prev) => ({
          ...prev,
          VideoOpener: null,
          VideoOpenerUrl: null,
          VideoOpenerPreviewUrl: null,
          VideoOpenerPlayBackUrl: null,
          VideoOpenerFallBackUrl: null
        }))
        return
      } else if (field === 'SingleImage') {
        setRemoveFlags((prev) => ({ ...prev, RemoveExistingSingleImage: true }))
        setStoryData((prev) => ({
          ...prev,
          SingleImage: null,
          SingleImageUrl: null
        }))
        return
      } else if (field === 'VideoProcess') {
        setRemoveFlags((prev) => ({ ...prev, RemoveExistingVideoProcess: true }))
        setStoryData((prev) => ({
          ...prev,
          VideoProcess: null,
          VideoProcessUrl: null,
          VideoProcessPreviewUrl: null,
          VideoProcessPlayBackUrl: null,
          VideoProcessFallBackUrl: null
        }))
        return
      } else if (field === 'VideoTestimonial') {
        setRemoveFlags((prev) => ({ ...prev, RemoveExistingVideoTestimonial: true }))
        setStoryData((prev) => ({
          ...prev,
          VideoTestimonial: null,
          VideoTestimonialUrl: null,
          VideoTestimonialPreviewUrl: null,
          VideoTestimonialPlayBackUrl: null,
          VideoTestimonialFallBackUrl: null
        }))
        return
      }
    }

    // Khi upload file mới, clear flag RemoveExisting (vì sẽ upload file mới thay thế)
    if (file && isEditMode) {
      if (field === 'ThumbnailImage') {
        setRemoveFlags((prev) => ({ ...prev, RemoveExistingThumbnail: false }))
      } else if (field === 'VideoOpener') {
        setRemoveFlags((prev) => ({ ...prev, RemoveExistingVideoOpener: false }))
      } else if (field === 'SingleImage') {
        setRemoveFlags((prev) => ({ ...prev, RemoveExistingSingleImage: false }))
      } else if (field === 'VideoProcess') {
        setRemoveFlags((prev) => ({ ...prev, RemoveExistingVideoProcess: false }))
      } else if (field === 'VideoTestimonial') {
        setRemoveFlags((prev) => ({ ...prev, RemoveExistingVideoTestimonial: false }))
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

  const countCharacters = (text: string): number => {
    return text.trim().length
  }

  const validateForm = (): string | null => {
    if (!storyData.Title.trim()) {
      return 'Vui lòng nhập tiêu đề câu chuyện'
    }
    const titleChars = countCharacters(storyData.Title)
    if (titleChars > 100) {
      return `Tiêu đề không được vượt quá 100 ký tự (hiện tại: ${titleChars} ký tự)`
    }

    if (storyData.TextIntro.trim()) {
      const introChars = countCharacters(storyData.TextIntro)
      if (introChars > 1000) {
        return `Giới thiệu không được vượt quá 1000 ký tự (hiện tại: ${introChars} ký tự)`
      }
    }

    if (storyData.TextExpanded.trim()) {
      const expandedChars = countCharacters(storyData.TextExpanded)
      if (expandedChars > 500) {
        return `Nội dung mở rộng không được vượt quá 1000 ký tự (hiện tại: ${expandedChars} ký tự)`
      }
    }

    if (storyData.TextClosing.trim()) {
      const closingChars = countCharacters(storyData.TextClosing)
      if (closingChars > 500) {
        return `Kết luận không được vượt quá 1000 ký tự (hiện tại: ${closingChars} ký tự)`
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
        const descChars = countCharacters(desc.text)
        if (descChars > 500) {
          return `${desc.label} không được vượt quá 1000 ký tự (hiện tại: ${descChars} ký tự)`
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

  // Load story data when in edit mode
  useEffect(() => {
    const loadStoryData = async () => {
      if (!isEditMode || !editStoryId) return

      try {
        setLoadingStory(true)
        const response = await storeStoryApi.getById(editStoryId)
        const story = response.data

        // Extract and map story data to form state
        const sortedContents = [...(story.contents || [])].sort(
          (a: { order: number }, b: { order: number }) => a.order - b.order
        )

        // Initialize form data
        const initialData: typeof storyData = {
          Title: story.title || '',
          TextIntro: '',
          TextExpanded: '',
          TextClosing: '',
          VideoOpener: null,
          VideoOpenerDescription: '',
          VideoOpenerUrl: null,
          VideoOpenerPreviewUrl: null,
          VideoOpenerPlayBackUrl: null,
          VideoOpenerFallBackUrl: null,
          SingleImage: null,
          SingleImageDescription: '',
          SingleImageUrl: null,
          GalleryImages: [],
          GalleryImageUrls: [],
          GalleryDescription: '',
          VideoProcess: null,
          VideoProcessDescription: '',
          VideoProcessUrl: null,
          VideoProcessPreviewUrl: null,
          VideoProcessPlayBackUrl: null,
          VideoProcessFallBackUrl: null,
          VideoTestimonial: null,
          VideoTestimonialDescription: '',
          VideoTestimonialUrl: null,
          VideoTestimonialPreviewUrl: null,
          VideoTestimonialPlayBackUrl: null,
          VideoTestimonialFallBackUrl: null,
          ThumbnailImage: null,
          ThumbnailUrl: story.thumbnailUrl || null
        }

        // Process contents to extract data - Use new contentType values directly
        sortedContents.forEach((content: {
          contentType?: string
          contentData?: string
          order: number
          videoPreviewUrl?: string | null
          videoPlayBackUrl?: string | null
          videoFallBackUrl?: string | null
          imageUrls?: string[]
        }) => {
          const contentType = content.contentType || ''

          // Use new contentType values: VideoOpener, TextIntro, SingleImage, TextExpanded, VideoProcess, ImageGallery, VideoTestimonial, TextClosing
          // Support both new format (specific contentType) and old format (generic contentType + order) for backward compatibility

          if (
            contentType === StoreStoryContentType.VideoOpener ||
            (contentType.toLowerCase() === 'video' && content.order === 1)
          ) {
            initialData.VideoOpenerDescription = content.contentData || ''
            // Store all video URLs for proper playback
            initialData.VideoOpenerPreviewUrl = content.videoPreviewUrl || null
            initialData.VideoOpenerPlayBackUrl = content.videoPlayBackUrl || null
            initialData.VideoOpenerFallBackUrl = content.videoFallBackUrl || null
            // Use playback URL as primary (contains HLS/DASH), fallback to preview, then fallback URL
            initialData.VideoOpenerUrl =
              content.videoPlayBackUrl || content.videoPreviewUrl || content.videoFallBackUrl || null
            console.log('Loaded VideoOpener:', {
              order: content.order,
              contentType,
              videoPlayBackUrl: content.videoPlayBackUrl,
              videoPreviewUrl: content.videoPreviewUrl,
              VideoOpenerUrl: initialData.VideoOpenerUrl
            })
          } else if (contentType === StoreStoryContentType.TextIntro || (contentType.toLowerCase() === 'text' && content.order === 2)) {
            initialData.TextIntro = content.contentData || ''
          } else if (contentType === StoreStoryContentType.SingleImage || (contentType.toLowerCase() === 'image' && Array.isArray(content.imageUrls) && content.imageUrls.length === 1)) {
            const imageUrls = content.imageUrls || []
            if (Array.isArray(imageUrls) && imageUrls.length === 1) {
              initialData.SingleImageUrl = imageUrls[0]
              initialData.SingleImageDescription = content.contentData || ''
            }
          } else if (contentType === StoreStoryContentType.TextExpanded || (contentType.toLowerCase() === 'text' && content.order === 4)) {
            initialData.TextExpanded = content.contentData || ''
          } else if (
            contentType === StoreStoryContentType.VideoProcess ||
            (contentType.toLowerCase() === 'video' && content.order === 5)
          ) {
            initialData.VideoProcessDescription = content.contentData || ''
            initialData.VideoProcessPreviewUrl = content.videoPreviewUrl || null
            initialData.VideoProcessPlayBackUrl = content.videoPlayBackUrl || null
            initialData.VideoProcessFallBackUrl = content.videoFallBackUrl || null
            initialData.VideoProcessUrl =
              content.videoPlayBackUrl || content.videoPreviewUrl || content.videoFallBackUrl || null
            console.log('Loaded VideoProcess:', {
              order: content.order,
              contentType,
              videoPlayBackUrl: content.videoPlayBackUrl,
              videoPreviewUrl: content.videoPreviewUrl,
              VideoProcessUrl: initialData.VideoProcessUrl
            })
          } else if (contentType === StoreStoryContentType.ImageGallery || (contentType.toLowerCase() === 'image' && Array.isArray(content.imageUrls) && content.imageUrls.length > 1)) {
            const imageUrls = content.imageUrls || []
            if (Array.isArray(imageUrls) && imageUrls.length > 1) {
              initialData.GalleryImageUrls = imageUrls
              initialData.GalleryDescription = content.contentData || ''
            }
          } else if (
            contentType === StoreStoryContentType.VideoTestimonial ||
            (contentType.toLowerCase() === 'video' && content.order === 7)
          ) {
            initialData.VideoTestimonialDescription = content.contentData || ''
            initialData.VideoTestimonialPreviewUrl = content.videoPreviewUrl || null
            initialData.VideoTestimonialPlayBackUrl = content.videoPlayBackUrl || null
            initialData.VideoTestimonialFallBackUrl = content.videoFallBackUrl || null
            initialData.VideoTestimonialUrl =
              content.videoPlayBackUrl || content.videoPreviewUrl || content.videoFallBackUrl || null
            console.log('Loaded VideoTestimonial:', {
              order: content.order,
              contentType,
              videoPlayBackUrl: content.videoPlayBackUrl,
              videoPreviewUrl: content.videoPreviewUrl,
              VideoTestimonialUrl: initialData.VideoTestimonialUrl
            })
          } else if (contentType === StoreStoryContentType.TextClosing || (contentType.toLowerCase() === 'text' && content.order === 8)) {
            initialData.TextClosing = content.contentData || ''
          }
        })

        console.log('Final initialData:', {
          VideoOpenerUrl: initialData.VideoOpenerUrl,
          VideoOpenerPreviewUrl: initialData.VideoOpenerPreviewUrl,
          VideoOpenerPlayBackUrl: initialData.VideoOpenerPlayBackUrl,
          VideoProcessUrl: initialData.VideoProcessUrl,
          VideoTestimonialUrl: initialData.VideoTestimonialUrl
        })

        setStoryData(initialData)
        // Reset remove flags when loading story data
        setRemoveFlags({
          RemoveExistingThumbnail: false,
          RemoveExistingVideoOpener: false,
          RemoveExistingSingleImage: false,
          RemoveExistingTextExpanded: false,
          RemoveExistingVideoProcess: false,
          RemoveExistingGalleryImages: false,
          RemoveExistingVideoTestimonial: false
        })
      } catch (error) {
        console.error('Error loading story data:', error)
        toast.error('Không thể tải dữ liệu câu chuyện')
        navigate(`../${path.myStorySeller}`)
      } finally {
        setLoadingStory(false)
      }
    }

    loadStoryData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, editStoryId])

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

  // State để quản lý các field optional đang được hiển thị
  const [visibleOptionalFields, setVisibleOptionalFields] = useState<Set<string>>(new Set())

  // Hàm xác định field optional tiếp theo cần hiển thị (memoized)
  const getNextOptionalField = useMemo((): 'singleImage' | 'galleryImages' | 'textExpanded' | 'videoProcess' | 'videoTestimonial' | null => {
    const order: Array<'singleImage' | 'galleryImages' | 'textExpanded' | 'videoProcess' | 'videoTestimonial'> = [
      'singleImage',
      'galleryImages',
      'textExpanded',
      'videoProcess',
      'videoTestimonial'
    ]

    for (let i = 0; i < order.length; i++) {
      const field = order[i]
      const isCompleted = optionalFieldsCompleted[field]
      const isVisible = visibleOptionalFields.has(field)

      // Nếu field này chưa hoàn thành và chưa được hiển thị, trả về field này
      if (!isCompleted && !isVisible) {
        // Kiểm tra field trước đó đã hoàn thành hoặc đã được thêm vào chưa
        if (i === 0) {
          // Field đầu tiên (singleImage) chỉ hiển thị khi Video Opener đã hoàn thành
          if (requiredFieldsCompleted.videoOpener) {
            return field
          }
        } else {
          const prevField = order[i - 1]
          const prevCompleted = optionalFieldsCompleted[prevField]
          const prevVisible = visibleOptionalFields.has(prevField)

          // Chỉ hiển thị field này nếu field trước đó đã hoàn thành hoặc đã được thêm vào
          if (prevCompleted || prevVisible) {
            return field
          }
        }
      }
    }
    return null
  }, [optionalFieldsCompleted, visibleOptionalFields, requiredFieldsCompleted.videoOpener])

  const toggleOptionalField = (field: string) => {
    setVisibleOptionalFields((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(field)) {
        newSet.delete(field)
      } else {
        newSet.add(field)
      }
      return newSet
    })
  }

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

      // In edit mode, handle file updates with RemoveExisting flags
      if (isEditMode) {
        // Thumbnail
        if (storyData.ThumbnailImage) {
          storyPayload.ThumbnailImage = storyData.ThumbnailImage
          storyPayload.RemoveExistingThumbnail = true // Upload new file, remove old one
        } else if (removeFlags.RemoveExistingThumbnail) {
          // User deleted thumbnail, set flag to remove existing
          storyPayload.RemoveExistingThumbnail = true
        }

        // Video Opener
        if (storyData.VideoOpener) {
          storyPayload.VideoOpener = storyData.VideoOpener
          storyPayload.RemoveExistingVideoOpener = true
        } else if (removeFlags.RemoveExistingVideoOpener) {
          // User deleted video opener, set flag to remove existing
          storyPayload.RemoveExistingVideoOpener = true
        }

        // Single Image
        if (storyData.SingleImage) {
          storyPayload.SingleImage = storyData.SingleImage
          storyPayload.RemoveExistingSingleImage = true
        } else if (removeFlags.RemoveExistingSingleImage) {
          // User deleted single image, set flag to remove existing
          storyPayload.RemoveExistingSingleImage = true
        }

        // Text Expanded - if empty and was previously set, remove it
        if (!storyData.TextExpanded.trim() && storyData.TextExpanded !== '') {
          storyPayload.RemoveExistingTextExpanded = true
        } else if (removeFlags.RemoveExistingTextExpanded) {
          // User deleted text expanded, set flag to remove existing
          storyPayload.RemoveExistingTextExpanded = true
        }

        // Video Process
        if (storyData.VideoProcess) {
          storyPayload.VideoProcess = storyData.VideoProcess
          storyPayload.RemoveExistingVideoProcess = true
        } else if (removeFlags.RemoveExistingVideoProcess) {
          // User deleted video process, set flag to remove existing
          storyPayload.RemoveExistingVideoProcess = true
        }

        // Gallery Images
        if (storyData.GalleryImages.length > 0) {
          storyPayload.GalleryImages = storyData.GalleryImages
          storyPayload.RemoveExistingGalleryImages = true
        } else if (removeFlags.RemoveExistingGalleryImages) {
          // User deleted gallery images, set flag to remove existing
          storyPayload.RemoveExistingGalleryImages = true
        }

        // Video Testimonial
        if (storyData.VideoTestimonial) {
          storyPayload.VideoTestimonial = storyData.VideoTestimonial
          storyPayload.RemoveExistingVideoTestimonial = true
        } else if (removeFlags.RemoveExistingVideoTestimonial) {
          // User deleted video testimonial, set flag to remove existing
          storyPayload.RemoveExistingVideoTestimonial = true
        }
      } else {
        // Create mode - just add files if they exist
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
      }

      let response
      let successMessage

      if (isEditMode && editStoryId) {
        // Update existing story
        response = await storeStoryApi.update(editStoryId, storyPayload)
        successMessage = 'Câu chuyện đã được cập nhật thành công.'
        if (response?.data?.message) {
          successMessage = response.data.message
        } else if (response?.message) {
          successMessage = response.message
        }
      } else {
        // Create new story
        response = await storeStoryApi.create(storyPayload)
        successMessage = 'Câu chuyện của hàng đã được tạo thành công.'
        if (response?.data?.message) {
          successMessage = response.data.message
        } else if (response?.message) {
          successMessage = response.message
        }
      }

      toast.success(successMessage)
      navigate(`../${path.myStorySeller}`)
    } catch (error: unknown) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} story:`, error)
      let errorMessage = `Có lỗi xảy ra khi ${isEditMode ? 'cập nhật' : 'tạo'} câu chuyện. Vui lòng thử lại.`

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
                    <img key={idx} src={url} alt={`Hình ảnh ${idx + 1}`} className='w-full rounded' />
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
        videoPreviewUrl?: string | null
        videoPlayBackUrl?: string | null
        videoFallBackUrl?: string | null
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
      const videoOpenerUrlForPreview = storyData.VideoOpener
        ? URL.createObjectURL(storyData.VideoOpener)
        : storyData.VideoOpenerUrl
      if (videoOpenerUrlForPreview) {
        contents.push({
          id: 'video-opener',
          contentType: 'video',
          contentData: storyData.VideoOpenerDescription || '',
          videoUrl: videoOpenerUrlForPreview,
          videoPreviewUrl: storyData.VideoOpenerPreviewUrl,
          videoPlayBackUrl: storyData.VideoOpenerPlayBackUrl,
          videoFallBackUrl: storyData.VideoOpenerFallBackUrl,
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
          videoPreviewUrl: storyData.VideoProcessPreviewUrl,
          videoPlayBackUrl: storyData.VideoProcessPlayBackUrl,
          videoFallBackUrl: storyData.VideoProcessFallBackUrl,
          order: 4
        })
      }

      // VideoTestimonial (order 5) - hiển thị trước Text Closing
      const videoTestimonialUrl = storyData.VideoTestimonial
        ? URL.createObjectURL(storyData.VideoTestimonial)
        : storyData.VideoTestimonialUrl
      if (videoTestimonialUrl) {
        contents.push({
          id: 'video-testimonial',
          contentType: 'video',
          contentData: storyData.VideoTestimonialDescription || '',
          videoUrl: videoTestimonialUrl,
          videoPreviewUrl: storyData.VideoTestimonialPreviewUrl,
          videoPlayBackUrl: storyData.VideoTestimonialPlayBackUrl,
          videoFallBackUrl: storyData.VideoTestimonialFallBackUrl,
          order: 5
        })
      }

      // TextClosing (order 8) - hiển thị cuối cùng
      if (storyData.TextClosing) {
        contents.push({
          id: 'text-closing',
          contentType: 'text',
          contentData: storyData.TextClosing,
          order: 8
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
                  {renderContent(
                    content.contentType,
                    content.contentData,
                    content.imageUrls,
                    content.videoUrl
                  )}
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
        <span className='text-gray-900 font-medium'>{isEditMode ? 'Chỉnh sửa câu chuyện' : 'Tạo câu chuyện mới'}</span>
      </div>

      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold text-gray-900'>{isEditMode ? 'Chỉnh sửa câu chuyện' : 'Tạo câu chuyện mới'}</h1>
          <p className='text-gray-600 mt-1'>{isEditMode ? 'Chỉnh sửa thông tin câu chuyện của bạn' : 'Thêm câu chuyện mới cho cửa hàng của bạn'}</p>
        </div>
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogTrigger asChild>
            <Button type='button' variant='outline' className='flex items-center gap-2'>
              <Eye className='w-4 h-4' />
              Xem trước
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
            <div className='p-4'>
              <StoryPreview />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Full Width Layout */}
      <div className='max-w-6xl mx-auto'>
        <div className='space-y-6'>
          {/* Basic Information */}
          <Card className='border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <CardHeader className='bg-gradient-to-r from-green-100 to-emerald-100 border-t-2 border-b border-green-100 text-green-700 pt-4'>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <FileText className='w-5 h-5' />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 pt-6'>
              {/* Title - Bắt buộc */}
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
                    className={`text-xs ${countCharacters(storyData.Title) > 100 ? 'text-red-500' : 'text-gray-500'}`}
                  >
                    {countCharacters(storyData.Title)}/100 ký tự
                  </p>
                </div>
              </div>

              {/* Thumbnail Image - Bắt buộc */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Label className='text-sm font-medium'>
                  Ảnh đại diện câu chuyện <span className='text-red-500'>*</span>
                </Label>
                <p className='text-xs text-gray-500 mt-1 mb-2'>
                  Ảnh này sẽ hiển thị ở đầu câu chuyện và trong danh sách câu chuyện của cửa hàng, không hiện thị trong nội dung
                </p>
                <div
                  className={`mt-2 border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 relative overflow-hidden ${isDraggingThumbnail
                    ? 'border-green-500 bg-green-50 scale-[1.02] shadow-lg'
                    : 'border-gray-300 hover:border-green-400'
                    }`}
                  onDragEnter={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    dragCounterThumbnail.current++
                    if (dragCounterThumbnail.current === 1) {
                      setIsDraggingThumbnail(true)
                    }
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    dragCounterThumbnail.current--
                    if (dragCounterThumbnail.current === 0) {
                      setIsDraggingThumbnail(false)
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (dragCounterThumbnail.current === 0) {
                      dragCounterThumbnail.current = 1
                      setIsDraggingThumbnail(true)
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    dragCounterThumbnail.current = 0
                    setIsDraggingThumbnail(false)

                    const files = e.dataTransfer.files
                    if (files.length > 0) {
                      const file = files[0]
                      if (file.type.startsWith('image/')) {
                        handleFileChange('ThumbnailImage', file)
                      } else {
                        toast.error('Chỉ được upload file ảnh!')
                      }
                    }
                  }}
                >
                  {/* Overlay khi đang kéo thả */}
                  {isDraggingThumbnail && (
                    <div className='absolute inset-0 bg-green-50/90 flex items-center justify-center z-10 transition-all duration-200'>
                      <div className='text-center transform transition-transform duration-200'>
                        <div className='text-green-600 font-semibold text-lg mb-2'>Thả ảnh vào đây</div>
                        <div className='text-green-500 text-sm'>PNG, JPG tối đa 5MB</div>
                      </div>
                    </div>
                  )}

                  {thumbnailUrl ? (
                    <div className={`space-y-2 transition-all duration-200 ${isDraggingThumbnail ? 'opacity-30' : 'opacity-100'}`}>
                      <div className='flex justify-center items-center'>
                        <img
                          src={thumbnailUrl}
                          alt='Ảnh đại diện câu chuyện'
                          className='max-w-full max-h-96 object-contain rounded'
                        />
                      </div>
                      {storyData.ThumbnailImage && (
                        <p className='text-sm text-gray-500'>{storyData.ThumbnailImage.name}</p>
                      )}
                      <div className='flex flex-col items-center gap-2 mt-2'>
                        {!storyData.ThumbnailImage && storyData.ThumbnailUrl && (
                          <p className='text-sm text-gray-500'>Ảnh đại diện hiện tại từ câu chuyện</p>
                        )}
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleFileChange('ThumbnailImage', null)}
                          className='border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400'
                        >
                          <X className='w-4 h-4 mr-1' />
                          {storyData.ThumbnailImage ? 'Xóa ảnh mới' : 'Xóa ảnh'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={`transition-all duration-200 ${isDraggingThumbnail ? 'opacity-0 scale-95' : 'opacity-100'}`}>
                      <ImageIcon className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                      <p className='text-gray-500 mb-2 text-sm'>Kéo thả hoặc click để tải ảnh đại diện</p>
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
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Text Intro - Bắt buộc */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Label htmlFor='textIntro' className='text-sm font-medium'>
                  Phần giới thiệu câu chuyện <span className='text-red-500'>*</span>
                </Label>
                <p className='text-xs text-gray-500 mt-1 mb-2'>
                  Nhập phần giới thiệu ngắn gọn về câu chuyện của bạn để thu hút người đọc
                </p>
                <Textarea
                  id='textIntro'
                  placeholder='Ví dụ: Câu chuyện về hành trình làm nông sản sạch của gia đình tôi...'
                  value={storyData.TextIntro}
                  onChange={(e) => handleInputChange('TextIntro', e.target.value)}
                  className={`mt-1 min-h-[100px] transition-all duration-200 focus:ring-green-500 focus:border-green-500 ${countCharacters(storyData.TextIntro) > 1000 ? 'border-red-500' : ''
                    }`}
                />
                <div className='flex justify-end items-center mt-1'>
                  <p
                    className={`text-xs ${countCharacters(storyData.TextIntro) > 1000 ? 'text-red-500' : 'text-gray-500'}`}
                  >
                    {countCharacters(storyData.TextIntro)}/1000 ký tự
                  </p>
                </div>
              </motion.div>
            </CardContent>
          </Card>

          {/* Video Opener - Bắt buộc */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className='border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200'>
              <CardHeader className='bg-gradient-to-r from-green-100 to-emerald-100 border-t-2 border-b border-green-100 text-green-700 pt-4'>
                <CardTitle className='text-green-700 flex items-center gap-2'>
                  <Video className='w-5 h-5' />
                  Video mở đầu câu chuyện <span className='text-red-500'>*</span>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4 pt-6'>
                <div>
                  <Label className='text-sm font-medium'>Video mở đầu</Label>
                  <p className='text-xs text-gray-500 mt-1 mb-2'>
                    Video này sẽ hiển thị ngay sau phần giới thiệu để thu hút người xem
                  </p>
                  <div
                    className={`mt-2 border-2 border-dashed rounded-lg p-4 transition-all duration-200 relative overflow-hidden ${isDraggingVideoOpener
                      ? 'border-green-500 bg-green-50 scale-[1.02] shadow-lg'
                      : 'border-gray-300 hover:border-green-400'
                      }`}
                    onDragEnter={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      dragCounterVideoOpener.current++
                      if (dragCounterVideoOpener.current === 1) {
                        setIsDraggingVideoOpener(true)
                      }
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      dragCounterVideoOpener.current--
                      if (dragCounterVideoOpener.current === 0) {
                        setIsDraggingVideoOpener(false)
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (dragCounterVideoOpener.current === 0) {
                        dragCounterVideoOpener.current = 1
                        setIsDraggingVideoOpener(true)
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      dragCounterVideoOpener.current = 0
                      setIsDraggingVideoOpener(false)

                      const files = e.dataTransfer.files
                      if (files.length > 0) {
                        const file = files[0]
                        if (file.type.startsWith('video/')) {
                          handleFileChange('VideoOpener', file)
                        } else {
                          toast.error('Chỉ được upload file video!')
                        }
                      }
                    }}
                  >
                    {/* Overlay khi đang kéo thả */}
                    {isDraggingVideoOpener && (
                      <div className='absolute inset-0 bg-green-50/90 flex items-center justify-center z-10 transition-all duration-200'>
                        <div className='text-center transform transition-transform duration-200'>
                          <div className='text-green-600 font-semibold text-lg mb-2'>Thả video vào đây</div>
                          <div className='text-green-500 text-sm'>MP4, MOV tối đa 50MB</div>
                        </div>
                      </div>
                    )}

                    {videoOpenerUrl ? (
                      <div className={`transition-all duration-200 ${isDraggingVideoOpener ? 'opacity-30' : 'opacity-100'}`}>
                        <div className='flex justify-center items-center mb-4'>
                          {/* Extract Cloudflare Stream video ID if available */}
                          {(() => {
                            const extractVideoId = (url: string): string | undefined => {
                              try {
                                const match = url.match(/cloudflarestream\.com\/([a-f0-9]+)/i)
                                return match ? match[1] : undefined
                              } catch {
                                return undefined
                              }
                            }
                            const videoId = extractVideoId(videoOpenerUrl)

                            if (videoId) {
                              // Use Cloudflare Stream component for Cloudflare URLs
                              return (
                                <div className='w-full max-w-2xl aspect-video'>
                                  <Stream src={videoId} controls responsive className='w-full h-full rounded' preload='metadata' />
                                </div>
                              )
                            } else {
                              // Use regular video tag for other URLs
                              return (
                                <video
                                  src={videoOpenerUrl}
                                  controls
                                  className='max-w-full max-h-96 object-contain rounded'
                                  preload='metadata'
                                />
                              )
                            }
                          })()}
                        </div>
                        {/* Info and delete button - always visible below video */}
                        <div className='flex flex-col items-center gap-2 py-3 border-t border-gray-100'>
                          {storyData.VideoOpener && (
                            <p className='text-sm text-gray-500'>{storyData.VideoOpener.name}</p>
                          )}
                          {!storyData.VideoOpener && (storyData.VideoOpenerUrl || storyData.VideoOpenerPlayBackUrl || storyData.VideoOpenerPreviewUrl) && (
                            <p className='text-sm text-gray-500'>Video hiện tại từ câu chuyện</p>
                          )}
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleFileChange('VideoOpener', null)}
                            className='border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400'
                          >
                            <X className='w-4 h-4 mr-1' />
                            {storyData.VideoOpener ? 'Xóa video mới' : 'Xóa video'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className={`text-center transition-all duration-200 ${isDraggingVideoOpener ? 'opacity-0 scale-95' : 'opacity-100'}`}>
                        <Video className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                        <p className='text-gray-500 mb-2 text-sm'>Kéo thả hoặc click để tải video mở đầu</p>
                        <p className='text-xs text-gray-400 mb-3'>Định dạng: MP4, MOV. Kích thước tối đa: 50MB</p>
                        <input
                          type='file'
                          accept='video/*'
                          onChange={(e) => handleFileChange('VideoOpener', e.target.files?.[0] || null)}
                          className='hidden'
                          id='video-opener-upload'
                        />
                        <Button variant='outline' size='sm' onClick={() => document.getElementById('video-opener-upload')?.click()} className='mx-auto'>
                          <Upload className='w-4 h-4 mr-1' />
                          Chọn video mở đầu
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className='mt-2'>
                    <Label className='text-xs text-gray-600'>Mô tả cho video mở đầu</Label>
                    <Textarea
                      placeholder='Ví dụ: Video giới thiệu về quy trình trồng trọt của gia đình...'
                      value={storyData.VideoOpenerDescription}
                      onChange={(e) => handleInputChange('VideoOpenerDescription', e.target.value)}
                      className={`mt-1 min-h-[60px] text-sm ${countCharacters(storyData.VideoOpenerDescription) > 1000 ? 'border-red-500' : ''
                        }`}
                    />
                    <div className='flex justify-end items-center mt-1'>
                      <p
                        className={`text-xs ${countCharacters(storyData.VideoOpenerDescription) > 1000 ? 'text-red-500' : 'text-gray-500'
                          }`}
                      >
                        {countCharacters(storyData.VideoOpenerDescription)}/1000 ký tự
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Single Image Section - Optional, hiển thị ngay sau Video Opener */}
          <AnimatePresence>
            {(visibleOptionalFields.has('singleImage') || storyData.SingleImage ||
              (requiredFieldsCompleted.videoOpener && getNextOptionalField === 'singleImage')) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className='overflow-hidden'
                >
                  {/* Button để thêm Single Image */}
                  {!storyData.SingleImage && !visibleOptionalFields.has('singleImage') &&
                    requiredFieldsCompleted.videoOpener && getNextOptionalField === 'singleImage' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => toggleOptionalField('singleImage')}
                          className='w-full border-dashed border-2 border-gray-300 hover:border-green-400 hover:bg-green-50 transition-all duration-200 mb-4'
                        >
                          <Plus className='w-4 h-4 mr-2' />
                          Thêm hình ảnh minh họa
                        </Button>
                      </motion.div>
                    )}

                  {/* Single Image Card */}
                  {(visibleOptionalFields.has('singleImage') || storyData.SingleImage) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
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
                            <div
                              className={`mt-2 border-2 border-dashed rounded-lg p-4 transition-all duration-200 relative overflow-hidden ${isDraggingSingleImage
                                ? 'border-green-500 bg-green-50 scale-[1.02] shadow-lg'
                                : 'border-gray-300 hover:border-green-400'
                                }`}
                              onDragEnter={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                dragCounterSingleImage.current++
                                if (dragCounterSingleImage.current === 1) {
                                  setIsDraggingSingleImage(true)
                                }
                              }}
                              onDragLeave={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                dragCounterSingleImage.current--
                                if (dragCounterSingleImage.current === 0) {
                                  setIsDraggingSingleImage(false)
                                }
                              }}
                              onDragOver={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (dragCounterSingleImage.current === 0) {
                                  dragCounterSingleImage.current = 1
                                  setIsDraggingSingleImage(true)
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                dragCounterSingleImage.current = 0
                                setIsDraggingSingleImage(false)

                                const files = e.dataTransfer.files
                                if (files.length > 0) {
                                  const file = files[0]
                                  if (file.type.startsWith('image/')) {
                                    handleFileChange('SingleImage', file)
                                  } else {
                                    toast.error('Chỉ được upload file ảnh!')
                                  }
                                }
                              }}
                            >
                              {/* Overlay khi đang kéo thả */}
                              {isDraggingSingleImage && (
                                <div className='absolute inset-0 bg-green-50/90 flex items-center justify-center z-10 transition-all duration-200'>
                                  <div className='text-center transform transition-transform duration-200'>
                                    <div className='text-green-600 font-semibold text-lg mb-2'>Thả ảnh vào đây</div>
                                    <div className='text-green-500 text-sm'>PNG, JPG tối đa 5MB</div>
                                  </div>
                                </div>
                              )}

                              {storyData.SingleImage && singleImageUrl ? (
                                <div className={`space-y-2 transition-all duration-200 ${isDraggingSingleImage ? 'opacity-30' : 'opacity-100'}`}>
                                  <div className='flex justify-center items-center'>
                                    <img
                                      src={singleImageUrl}
                                      alt='Hình ảnh minh họa câu chuyện'
                                      className='max-w-full max-h-96 object-contain rounded'
                                    />
                                  </div>
                                  <p className='text-sm text-gray-500'>{storyData.SingleImage.name}</p>
                                  <Button variant='outline' size='sm' onClick={() => handleFileChange('SingleImage', null)}>
                                    <X className='w-4 h-4 mr-1' />
                                    Xóa ảnh
                                  </Button>
                                </div>
                              ) : (
                                <div className={`text-center transition-all duration-200 ${isDraggingSingleImage ? 'opacity-0 scale-95' : 'opacity-100'}`}>
                                  <ImageIcon className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                                  <p className='text-gray-500 mb-2 text-sm'>Kéo thả hoặc click để tải hình ảnh minh họa</p>
                                  <p className='text-xs text-gray-400 mb-3'>Định dạng: PNG, JPG. Kích thước tối đa: 5MB</p>
                                  <input
                                    type='file'
                                    accept='image/*'
                                    onChange={(e) => {
                                      const file = e.target.files?.[0] || null
                                      if (file) {
                                        handleFileChange('SingleImage', file)
                                        // Reset input để có thể chọn lại cùng file
                                        e.target.value = ''
                                      }
                                    }}
                                    className='hidden'
                                    id='single-image-upload'
                                  />
                                  <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      document.getElementById('single-image-upload')?.click()
                                    }}
                                    className='mx-auto'
                                  >
                                    <Upload className='w-4 h-4 mr-1' />
                                    Chọn hình ảnh
                                  </Button>
                                </div>
                              )}
                            </div>
                            <div className='mt-2'>
                              <Label className='text-xs text-gray-600'>Mô tả cho hình ảnh minh họa</Label>
                              <Textarea
                                placeholder='Ví dụ: Hình ảnh cánh đồng lúa chín vàng vào mùa thu hoạch...'
                                value={storyData.SingleImageDescription}
                                onChange={(e) => handleInputChange('SingleImageDescription', e.target.value)}
                                className={`mt-1 min-h-[60px] text-sm ${countCharacters(storyData.SingleImageDescription) > 1000 ? 'border-red-500' : ''
                                  }`}
                              />
                              <div className='flex justify-end items-center mt-1'>
                                <p
                                  className={`text-xs ${countCharacters(storyData.SingleImageDescription) > 1000 ? 'text-red-500' : 'text-gray-500'
                                    }`}
                                >
                                  {countCharacters(storyData.SingleImageDescription)}/1000 ký tự
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      {!storyData.SingleImage && (
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => toggleOptionalField('singleImage')}
                          className='mt-2 text-gray-500 hover:text-gray-700 w-full'
                        >
                          <X className='w-4 h-4 mr-1' />
                          Ẩn phần này
                        </Button>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
          </AnimatePresence>

          {/* Gallery Images Section - Optional, hiển thị sau Single Image */}
          <AnimatePresence>
            {(visibleOptionalFields.has('galleryImages') || storyData.GalleryImages.length > 0 || storyData.GalleryImageUrls.length > 0 ||
              (optionalFieldsCompleted.singleImage && getNextOptionalField === 'galleryImages')) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className='overflow-hidden'
                >
                  {/* Button để thêm Gallery Images */}
                  {storyData.GalleryImages.length === 0 && storyData.GalleryImageUrls.length === 0 &&
                    !visibleOptionalFields.has('galleryImages') &&
                    optionalFieldsCompleted.singleImage && getNextOptionalField === 'galleryImages' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => toggleOptionalField('galleryImages')}
                          className='w-full border-dashed border-2 border-gray-300 hover:border-green-400 hover:bg-green-50 transition-all duration-200 mb-4'
                        >
                          <Plus className='w-4 h-4 mr-2' />
                          Thêm bộ sưu tập hình ảnh
                        </Button>
                      </motion.div>
                    )}

                  {/* Gallery Images Card */}
                  {(visibleOptionalFields.has('galleryImages') || storyData.GalleryImages.length > 0 || storyData.GalleryImageUrls.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
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
                                className={`text-xs ${storyData.GalleryImages.length + storyData.GalleryImageUrls.length > 3 ? 'text-red-500' : 'text-gray-500'
                                  }`}
                              >
                                {storyData.GalleryImages.length + storyData.GalleryImageUrls.length}/3 ảnh
                              </span>
                            </div>
                            <p className='text-xs text-gray-500 mb-2'>
                              Tải lên tối đa 3 hình ảnh để tạo bộ sưu tập minh họa cho câu chuyện
                            </p>
                            <div
                              className={`border-2 border-dashed rounded-lg p-4 transition-all duration-200 relative overflow-hidden ${isDraggingGallery
                                ? 'border-green-500 bg-green-50 scale-[1.02] shadow-lg'
                                : 'border-gray-300 hover:border-green-400'
                                }`}
                              onDragEnter={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (storyData.GalleryImages.length + storyData.GalleryImageUrls.length < 3) {
                                  dragCounterGallery.current++
                                  if (dragCounterGallery.current === 1) {
                                    setIsDraggingGallery(true)
                                  }
                                }
                              }}
                              onDragLeave={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                dragCounterGallery.current--
                                if (dragCounterGallery.current === 0) {
                                  setIsDraggingGallery(false)
                                }
                              }}
                              onDragOver={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (storyData.GalleryImages.length + storyData.GalleryImageUrls.length < 3 && dragCounterGallery.current === 0) {
                                  dragCounterGallery.current = 1
                                  setIsDraggingGallery(true)
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                dragCounterGallery.current = 0
                                setIsDraggingGallery(false)

                                if (storyData.GalleryImages.length + storyData.GalleryImageUrls.length >= 3) {
                                  toast.error('Đã đạt tối đa 3 ảnh')
                                  return
                                }

                                const files = e.dataTransfer.files
                                if (files.length > 0) {
                                  handleGalleryImagesChange(files)
                                }
                              }}
                            >
                              {/* Overlay khi đang kéo thả */}
                              {isDraggingGallery && (
                                <div className='absolute inset-0 bg-green-50/90 flex items-center justify-center z-10 transition-all duration-200'>
                                  <div className='text-center transform transition-transform duration-200'>
                                    <div className='text-green-600 font-semibold text-lg mb-2'>Thả ảnh vào đây</div>
                                    <div className='text-green-500 text-sm'>PNG, JPG tối đa 5MB mỗi ảnh</div>
                                  </div>
                                </div>
                              )}

                              <div className={`text-center transition-all duration-200 ${isDraggingGallery ? 'opacity-0 scale-95' : 'opacity-100'}`}>
                                <ImageIcon className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                                <p className='text-gray-500 mb-2 text-sm'>Kéo thả hoặc click để tải nhiều ảnh (tối đa 3 ảnh)</p>
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
                                  className='mx-auto'
                                >
                                  <Upload className='w-4 h-4 mr-1' />
                                  Chọn nhiều ảnh
                                </Button>
                              </div>
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
                                    {storyData.GalleryImages.map((_, idx) => (
                                      <div key={`file-${idx}`} className='relative group'>
                                        <img
                                          src={galleryImageUrls[idx]}
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
                                className={`mt-1 min-h-[60px] text-sm ${countCharacters(storyData.GalleryDescription) > 1000 ? 'border-red-500' : ''
                                  }`}
                              />
                              <div className='flex justify-end items-center mt-1'>
                                <p
                                  className={`text-xs ${countCharacters(storyData.GalleryDescription) > 1000 ? 'text-red-500' : 'text-gray-500'}`}
                                >
                                  {countCharacters(storyData.GalleryDescription)}/1000 ký tự
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      {storyData.GalleryImages.length === 0 && storyData.GalleryImageUrls.length === 0 && (
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => toggleOptionalField('galleryImages')}
                          className='mt-2 text-gray-500 hover:text-gray-700 w-full'
                        >
                          <X className='w-4 h-4 mr-1' />
                          Ẩn phần này
                        </Button>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
          </AnimatePresence>

          {/* Text Expanded Section - Optional, hiển thị sau Gallery Images */}
          <AnimatePresence>
            {(visibleOptionalFields.has('textExpanded') || storyData.TextExpanded ||
              (optionalFieldsCompleted.galleryImages && getNextOptionalField === 'textExpanded')) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className='overflow-hidden'
                >
                  {/* Button để thêm Text Expanded */}
                  {!storyData.TextExpanded && !visibleOptionalFields.has('textExpanded') &&
                    optionalFieldsCompleted.galleryImages && getNextOptionalField === 'textExpanded' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => toggleOptionalField('textExpanded')}
                          className='w-full border-dashed border-2 border-gray-300 hover:border-green-400 hover:bg-green-50 transition-all duration-200 mb-4'
                        >
                          <Plus className='w-4 h-4 mr-2' />
                          Thêm nội dung chi tiết
                        </Button>
                      </motion.div>
                    )}

                  {/* Text Expanded Card */}
                  {(visibleOptionalFields.has('textExpanded') || storyData.TextExpanded) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
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
                              className={`mt-1 min-h-[100px] transition-all duration-200 focus:ring-green-500 focus:border-green-500 ${countCharacters(storyData.TextExpanded) > 1000 ? 'border-red-500' : ''
                                }`}
                            />
                            <div className='flex justify-end items-center mt-1'>
                              <p
                                className={`text-xs ${countCharacters(storyData.TextExpanded) > 1000 ? 'text-red-500' : 'text-gray-500'}`}
                              >
                                {countCharacters(storyData.TextExpanded)}/1000 ký tự
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      {!storyData.TextExpanded && (
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => toggleOptionalField('textExpanded')}
                          className='mt-2 text-gray-500 hover:text-gray-700 w-full'
                        >
                          <X className='w-4 h-4 mr-1' />
                          Ẩn phần này
                        </Button>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
          </AnimatePresence>

          {/* Video Process Section - Optional, hiển thị sau Text Expanded */}
          <AnimatePresence>
            {(visibleOptionalFields.has('videoProcess') || storyData.VideoProcess ||
              (optionalFieldsCompleted.textExpanded && getNextOptionalField === 'videoProcess')) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className='overflow-hidden'
                >
                  {/* Button để thêm Video Process */}
                  {!storyData.VideoProcess && !visibleOptionalFields.has('videoProcess') &&
                    optionalFieldsCompleted.textExpanded && getNextOptionalField === 'videoProcess' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => toggleOptionalField('videoProcess')}
                          className='w-full border-dashed border-2 border-gray-300 hover:border-green-400 hover:bg-green-50 transition-all duration-200 mb-4'
                        >
                          <Plus className='w-4 h-4 mr-2' />
                          Thêm video quy trình sản xuất
                        </Button>
                      </motion.div>
                    )}

                  {/* Video Process Card */}
                  {(visibleOptionalFields.has('videoProcess') || storyData.VideoProcess) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
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
                            <div
                              className={`mt-2 border-2 border-dashed rounded-lg p-4 transition-all duration-200 relative overflow-hidden ${isDraggingVideoProcess
                                ? 'border-green-500 bg-green-50 scale-[1.02] shadow-lg'
                                : 'border-gray-300 hover:border-green-400'
                                }`}
                              onDragEnter={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                dragCounterVideoProcess.current++
                                if (dragCounterVideoProcess.current === 1) {
                                  setIsDraggingVideoProcess(true)
                                }
                              }}
                              onDragLeave={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                dragCounterVideoProcess.current--
                                if (dragCounterVideoProcess.current === 0) {
                                  setIsDraggingVideoProcess(false)
                                }
                              }}
                              onDragOver={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (dragCounterVideoProcess.current === 0) {
                                  dragCounterVideoProcess.current = 1
                                  setIsDraggingVideoProcess(true)
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                dragCounterVideoProcess.current = 0
                                setIsDraggingVideoProcess(false)

                                const files = e.dataTransfer.files
                                if (files.length > 0) {
                                  const file = files[0]
                                  if (file.type.startsWith('video/')) {
                                    handleFileChange('VideoProcess', file)
                                  } else {
                                    toast.error('Chỉ được upload file video!')
                                  }
                                }
                              }}
                            >
                              {/* Overlay khi đang kéo thả */}
                              {isDraggingVideoProcess && (
                                <div className='absolute inset-0 bg-green-50/90 flex items-center justify-center z-10 transition-all duration-200'>
                                  <div className='text-center transform transition-transform duration-200'>
                                    <div className='text-green-600 font-semibold text-lg mb-2'>Thả video vào đây</div>
                                    <div className='text-green-500 text-sm'>MP4, MOV tối đa 50MB</div>
                                  </div>
                                </div>
                              )}

                              {videoProcessUrl ? (
                                <div className={`transition-all duration-200 ${isDraggingVideoProcess ? 'opacity-30' : 'opacity-100'}`}>
                                  <div className='flex justify-center items-center mb-4'>
                                    {/* Extract Cloudflare Stream video ID if available */}
                                    {(() => {
                                      const extractVideoId = (url: string): string | undefined => {
                                        try {
                                          const match = url.match(/cloudflarestream\.com\/([a-f0-9]+)/i)
                                          return match ? match[1] : undefined
                                        } catch {
                                          return undefined
                                        }
                                      }
                                      const videoId = extractVideoId(videoProcessUrl)

                                      if (videoId) {
                                        // Use Cloudflare Stream component for Cloudflare URLs
                                        return (
                                          <div className='w-full max-w-2xl aspect-video'>
                                            <Stream src={videoId} controls responsive className='w-full h-full rounded' preload='metadata' />
                                          </div>
                                        )
                                      } else {
                                        // Use regular video tag for other URLs
                                        return (
                                          <video
                                            src={videoProcessUrl}
                                            controls
                                            className='max-w-full max-h-96 object-contain rounded'
                                            preload='metadata'
                                          />
                                        )
                                      }
                                    })()}
                                  </div>
                                  {/* Info and delete button - always visible below video */}
                                  <div className='flex flex-col items-center gap-2 py-3 border-t border-gray-100'>
                                    {storyData.VideoProcess && (
                                      <p className='text-sm text-gray-500'>{storyData.VideoProcess.name}</p>
                                    )}
                                    {!storyData.VideoProcess && (storyData.VideoProcessUrl || storyData.VideoProcessPlayBackUrl || storyData.VideoProcessPreviewUrl) && (
                                      <p className='text-sm text-gray-500'>Video hiện tại từ câu chuyện</p>
                                    )}
                                    <Button
                                      variant='outline'
                                      size='sm'
                                      onClick={() => handleFileChange('VideoProcess', null)}
                                      className='border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400'
                                    >
                                      <X className='w-4 h-4 mr-1' />
                                      {storyData.VideoProcess ? 'Xóa video mới' : 'Xóa video'}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className={`text-center transition-all duration-200 ${isDraggingVideoProcess ? 'opacity-0 scale-95' : 'opacity-100'}`}>
                                  <Video className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                                  <p className='text-gray-500 mb-2 text-sm'>Kéo thả hoặc click để tải video quy trình sản xuất</p>
                                  <p className='text-xs text-gray-400 mb-3'>Định dạng: MP4, MOV. Kích thước tối đa: 50MB</p>
                                  <input
                                    type='file'
                                    accept='video/*'
                                    onChange={(e) => handleFileChange('VideoProcess', e.target.files?.[0] || null)}
                                    className='hidden'
                                    id='video-process-upload'
                                  />
                                  <Button variant='outline' size='sm' onClick={() => document.getElementById('video-process-upload')?.click()} className='mx-auto'>
                                    <Upload className='w-4 h-4 mr-1' />
                                    Chọn video quy trình
                                  </Button>
                                </div>
                              )}
                            </div>
                            <div className='mt-2'>
                              <Label className='text-xs text-gray-600'>Mô tả cho video quy trình sản xuất</Label>
                              <Textarea
                                placeholder='Ví dụ: Video giới thiệu chi tiết các bước trong quy trình sản xuất...'
                                value={storyData.VideoProcessDescription}
                                onChange={(e) => handleInputChange('VideoProcessDescription', e.target.value)}
                                className={`mt-1 min-h-[60px] text-sm ${countCharacters(storyData.VideoProcessDescription) > 1000 ? 'border-red-500' : ''
                                  }`}
                              />
                              <div className='flex justify-end items-center mt-1'>
                                <p
                                  className={`text-xs ${countCharacters(storyData.VideoProcessDescription) > 1000 ? 'text-red-500' : 'text-gray-500'
                                    }`}
                                >
                                  {countCharacters(storyData.VideoProcessDescription)}/1000 ký tự
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      {!storyData.VideoProcess && (
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => toggleOptionalField('videoProcess')}
                          className='mt-2 text-gray-500 hover:text-gray-700 w-full'
                        >
                          <X className='w-4 h-4 mr-1' />
                          Ẩn phần này
                        </Button>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
          </AnimatePresence>

          {/* Video Testimonial Section - Optional, hiển thị trước Text Closing */}
          <AnimatePresence>
            {(visibleOptionalFields.has('videoTestimonial') || storyData.VideoTestimonial ||
              (optionalFieldsCompleted.videoProcess && getNextOptionalField === 'videoTestimonial')) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className='overflow-hidden'
                >
                  {/* Button để thêm Video Testimonial */}
                  {!storyData.VideoTestimonial && !visibleOptionalFields.has('videoTestimonial') &&
                    optionalFieldsCompleted.videoProcess && getNextOptionalField === 'videoTestimonial' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => toggleOptionalField('videoTestimonial')}
                          className='w-full border-dashed border-2 border-gray-300 hover:border-green-400 hover:bg-green-50 transition-all duration-200 mb-4'
                        >
                          <Plus className='w-4 h-4 mr-2' />
                          Thêm video tổng kết
                        </Button>
                      </motion.div>
                    )}

                  {/* Video Testimonial Card */}
                  {(visibleOptionalFields.has('videoTestimonial') || storyData.VideoTestimonial) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className='border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200'>
                        <CardHeader className='bg-gradient-to-r from-green-100 to-emerald-100 border-t-2 border-b border-green-100 text-green-700 pt-4'>
                          <CardTitle className='text-green-700 flex items-center gap-2'>
                            <Video className='w-5 h-5' />
                            Video tổng kết
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-4 pt-6'>
                          <div>
                            <Label className='text-sm font-medium'>Video tổng kết</Label>
                            <p className='text-xs text-gray-500 mt-1 mb-2'>
                              Video này sẽ là lời kết thúc cho câu chuyện
                            </p>
                            <div
                              className={`mt-2 border-2 border-dashed rounded-lg p-4 transition-all duration-200 relative overflow-hidden ${isDraggingVideoTestimonial
                                ? 'border-green-500 bg-green-50 scale-[1.02] shadow-lg'
                                : 'border-gray-300 hover:border-green-400'
                                }`}
                              onDragEnter={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                dragCounterVideoTestimonial.current++
                                if (dragCounterVideoTestimonial.current === 1) {
                                  setIsDraggingVideoTestimonial(true)
                                }
                              }}
                              onDragLeave={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                dragCounterVideoTestimonial.current--
                                if (dragCounterVideoTestimonial.current === 0) {
                                  setIsDraggingVideoTestimonial(false)
                                }
                              }}
                              onDragOver={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (dragCounterVideoTestimonial.current === 0) {
                                  dragCounterVideoTestimonial.current = 1
                                  setIsDraggingVideoTestimonial(true)
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                dragCounterVideoTestimonial.current = 0
                                setIsDraggingVideoTestimonial(false)

                                const files = e.dataTransfer.files
                                if (files.length > 0) {
                                  const file = files[0]
                                  if (file.type.startsWith('video/')) {
                                    handleFileChange('VideoTestimonial', file)
                                  } else {
                                    toast.error('Chỉ được upload file video!')
                                  }
                                }
                              }}
                            >
                              {/* Overlay khi đang kéo thả */}
                              {isDraggingVideoTestimonial && (
                                <div className='absolute inset-0 bg-green-50/90 flex items-center justify-center z-10 transition-all duration-200'>
                                  <div className='text-center transform transition-transform duration-200'>
                                    <div className='text-green-600 font-semibold text-lg mb-2'>Thả video vào đây</div>
                                    <div className='text-green-500 text-sm'>MP4, MOV tối đa 50MB</div>
                                  </div>
                                </div>
                              )}

                              {videoTestimonialUrl ? (
                                <div className={`transition-all duration-200 ${isDraggingVideoTestimonial ? 'opacity-30' : 'opacity-100'}`}>
                                  <div className='flex justify-center items-center mb-4'>
                                    {/* Extract Cloudflare Stream video ID if available */}
                                    {(() => {
                                      const extractVideoId = (url: string): string | undefined => {
                                        try {
                                          const match = url.match(/cloudflarestream\.com\/([a-f0-9]+)/i)
                                          return match ? match[1] : undefined
                                        } catch {
                                          return undefined
                                        }
                                      }
                                      const videoId = extractVideoId(videoTestimonialUrl)

                                      if (videoId) {
                                        // Use Cloudflare Stream component for Cloudflare URLs
                                        return (
                                          <div className='w-full max-w-2xl aspect-video'>
                                            <Stream src={videoId} controls responsive className='w-full h-full rounded' preload='metadata' />
                                          </div>
                                        )
                                      } else {
                                        // Use regular video tag for other URLs
                                        return (
                                          <video
                                            src={videoTestimonialUrl}
                                            controls
                                            className='max-w-full max-h-96 object-contain rounded'
                                            preload='metadata'
                                          />
                                        )
                                      }
                                    })()}
                                  </div>
                                  {/* Info and delete button - always visible below video */}
                                  <div className='flex flex-col items-center gap-2 py-3 border-t border-gray-100'>
                                    {storyData.VideoTestimonial && (
                                      <p className='text-sm text-gray-500'>{storyData.VideoTestimonial.name}</p>
                                    )}
                                    {!storyData.VideoTestimonial && (storyData.VideoTestimonialUrl || storyData.VideoTestimonialPlayBackUrl || storyData.VideoTestimonialPreviewUrl) && (
                                      <p className='text-sm text-gray-500'>Video hiện tại từ câu chuyện</p>
                                    )}
                                    <Button
                                      variant='outline'
                                      size='sm'
                                      onClick={() => handleFileChange('VideoTestimonial', null)}
                                      className='border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400'
                                    >
                                      <X className='w-4 h-4 mr-1' />
                                      {storyData.VideoTestimonial ? 'Xóa video mới' : 'Xóa video'}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className={`text-center transition-all duration-200 ${isDraggingVideoTestimonial ? 'opacity-0 scale-95' : 'opacity-100'}`}>
                                  <Video className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                                  <p className='text-gray-500 mb-2 text-sm'>Kéo thả hoặc click để tải video tổng kết</p>
                                  <p className='text-xs text-gray-400 mb-3'>Định dạng: MP4, MOV. Kích thước tối đa: 50MB</p>
                                  <input
                                    type='file'
                                    accept='video/*'
                                    onChange={(e) => handleFileChange('VideoTestimonial', e.target.files?.[0] || null)}
                                    className='hidden'
                                    id='video-testimonial-upload'
                                  />
                                  <Button variant='outline' size='sm' onClick={() => document.getElementById('video-testimonial-upload')?.click()} className='mx-auto'>
                                    <Upload className='w-4 h-4 mr-1' />
                                    Chọn video tổng kết
                                  </Button>
                                </div>
                              )}
                            </div>
                            <div className='mt-2'>
                              <Label className='text-xs text-gray-600'>Mô tả cho video tổng kết</Label>
                              <Textarea
                                placeholder='Ví dụ: Video tổng kết câu chuyện của bạn...'
                                value={storyData.VideoTestimonialDescription}
                                onChange={(e) => handleInputChange('VideoTestimonialDescription', e.target.value)}
                                className={`mt-1 min-h-[60px] text-sm ${countCharacters(storyData.VideoTestimonialDescription) > 1000 ? 'border-red-500' : ''
                                  }`}
                              />
                              <div className='flex justify-end items-center mt-1'>
                                <p
                                  className={`text-xs ${countCharacters(storyData.VideoTestimonialDescription) > 1000 ? 'text-red-500' : 'text-gray-500'
                                    }`}
                                >
                                  {countCharacters(storyData.VideoTestimonialDescription)}/1000 ký tự
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      {!storyData.VideoTestimonial && (
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => toggleOptionalField('videoTestimonial')}
                          className='mt-2 text-gray-500 hover:text-gray-700 w-full'
                        >
                          <X className='w-4 h-4 mr-1' />
                          Ẩn phần này
                        </Button>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
          </AnimatePresence>

          {/* Text Closing - Bắt buộc, hiển thị cuối cùng */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className='border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200'>
              <CardHeader className='bg-gradient-to-r from-green-100 to-emerald-100 border-t-2 border-b border-green-100 text-green-700 pt-4'>
                <CardTitle className='text-green-700 flex items-center gap-2'>
                  <FileText className='w-5 h-5' />
                  Phần kết thúc câu chuyện <span className='text-red-500'>*</span>
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
                    className={`mt-1 min-h-[100px] transition-all duration-200 focus:ring-green-500 focus:border-green-500 ${countCharacters(storyData.TextClosing) > 1000 ? 'border-red-500' : ''
                      }`}
                  />
                  <div className='flex justify-end items-center mt-1'>
                    <p
                      className={`text-xs ${countCharacters(storyData.TextClosing) > 1000 ? 'text-red-500' : 'text-gray-500'}`}
                    >
                      {countCharacters(storyData.TextClosing)}/1000 ký tự
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

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
              disabled={loading || loadingStory}
            >
              {loading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  {isEditMode ? 'Đang cập nhật...' : 'Đang tạo...'}
                </>
              ) : (
                isEditMode ? 'Cập nhật câu chuyện' : 'Tạo câu chuyện'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateMyStoryPage