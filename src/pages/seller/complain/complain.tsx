import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../../contexts/store.context'
import { useAuth } from '../../../contexts/auth.context'
import { formApi } from '../../../apis/form.api'
import { createOrGetChatRoom } from '../../../apis/chat.api'
import type { FormDTO, FormStatus, FormType } from '../../../types/form.type'
import { toast } from '../../../utils/toast'
import Loading from '../../../components/Loading/loading'
import EmptyState from '../../../components/EmptyState/emptyState'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Image as ImageIcon,
  Upload,
  X,
  MessageCircle
} from 'lucide-react'
import { resolveImageUrl } from '../../../utils/image'
import ImagePreviewModal from '../../../components/ui/image-preview-modal'
import { CopyButton } from '../../../components/ui/copy'

function ComplainSeller() {
  const { store, loading: storeLoading } = useStore()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [forms, setForms] = useState<FormDTO[]>([])
  const [totalViolationCount, setTotalViolationCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [creatingChat, setCreatingChat] = useState<string | null>(null) // Track which form is creating chat
  const [selectedForm, setSelectedForm] = useState<FormDTO | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [sellerReply, setSellerReply] = useState('')
  const [sellerImages, setSellerImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [isListPreviewOpen, setIsListPreviewOpen] = useState(false)
  const [listPreviewIndex, setListPreviewIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  // Ref to track current image count for immediate validation
  const imageCountRef = useRef(0)
  // Ref to prevent duplicate processing
  const isProcessingRef = useRef(false)

  // Sync ref with state whenever sellerImages changes
  useEffect(() => {
    imageCountRef.current = sellerImages.length
    // Reset processing flag when images change
    isProcessingRef.current = false
  }, [sellerImages])

  // Sync imagePreviews with sellerImages (similar to ComplaintModal)
  useEffect(() => {
    const urls = sellerImages.map((file) => URL.createObjectURL(file))
    setImagePreviews(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [sellerImages])

  // Load forms by storeId (only ComplaintOrder and ReportSeller)
  const loadForms = useCallback(async () => {
    if (!store?.id) return

    try {
      setLoading(true)
      // formApi.getFormsByStoreId trả về FormListResponseData có issues và totalViolationCount
      const responseData = await formApi.getFormsByStoreId(store.id, {
        pageSize: 0,
        pageNumber: 1,
        sortBy: 'createdat',
        sortOrder: 'desc'
      })
      // Filter to only show ComplaintOrder and ReportSeller
      const filteredForms = Array.isArray(responseData.issues)
        ? responseData.issues.filter((form) => form.type === 'ComplaintOrder' || form.type === 'ReportSeller')
        : []
      setForms(filteredForms)
      setTotalViolationCount(responseData.totalViolationCount ?? null)
    } catch (error) {
      console.error('Error loading forms:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách khiếu nại')
      setForms([]) // Set empty array on error
      setTotalViolationCount(null)
    } finally {
      setLoading(false)
    }
  }, [store?.id])

  useEffect(() => {
    loadForms()
  }, [loadForms])

  // Get status info
  const getStatusInfo = (status: FormStatus) => {
    switch (status) {
      case 'Pending':
        return {
          icon: <Clock className='w-4 h-4 text-yellow-500' />,
          badge: 'secondary',
          text: 'Chờ phân công',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-50'
        }
      case 'Processing':
        return {
          icon: <AlertCircle className='w-4 h-4 text-blue-500' />,
          badge: 'default',
          text: 'Đang xử lý',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50'
        }
      case 'Confirmed':
        return {
          icon: <Clock className='w-4 h-4 text-blue-500' />,
          badge: 'default',
          text: 'Đang xử lý',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50'
        }
      case 'ApprovedByStaff':
        return {
          icon: <CheckCircle className='w-4 h-4 text-green-500' />,
          badge: 'default',
          text: 'Đang phân xử',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50'
        }
      case 'DeniedByStaff':
        return {
          icon: <XCircle className='w-4 h-4 text-red-500' />,
          badge: 'destructive',
          text: 'Đang phân xử',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50'
        }
      case 'ApprovedByAdmin':
        return {
          icon: <CheckCircle className='w-4 h-4 text-green-500' />,
          badge: 'default',
          text: 'Đã phân xử',
          color: 'text-green-700',
          bgColor: 'bg-green-50'
        }
      case 'DeniedByAdmin':
        return {
          icon: <XCircle className='w-4 h-4 text-red-500' />,
          badge: 'destructive',
          text: 'Đã phân xử',
          color: 'text-green-700',
          bgColor: 'bg-green-50'
        }
      case 'Rejected':
        return {
          icon: <XCircle className='w-4 h-4 text-red-500' />,
          badge: 'destructive',
          text: 'Đang phân xử',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50'
        }
      case 'Cancel':
        return {
          icon: <XCircle className='w-4 h-4 text-gray-500' />,
          badge: 'outline',
          text: 'Khách hàng hủy khiếu nại',
          color: 'text-gray-700',
          bgColor: 'bg-gray-50'
        }
      default:
        return {
          icon: <Clock className='w-4 h-4 text-gray-500' />,
          badge: 'secondary',
          text: status,
          color: 'text-gray-700',
          bgColor: 'bg-gray-50'
        }
    }
  }

  // Get type text
  const getTypeText = (type: FormType) => {
    switch (type) {
      case 'ComplaintOrder':
        return 'Khiếu nại đơn hàng'
      case 'ReportSeller':
        return 'Khiếu nại cửa hàng'
      default:
        return type
    }
  }

  // Handle view detail
  const handleViewDetail = async (formId: string) => {
    try {
      setLoadingDetail(true)
      setShowDetailModal(true)
      const form = await formApi.getFormById(formId)
      setSelectedForm(form)
    } catch (error: unknown) {
      console.error('Error loading form detail:', error)
      setShowDetailModal(false)
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as { message?: string })?.message ||
        'Có lỗi xảy ra khi tải chi tiết khiếu nại'
      toast.error(errorMessage)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Handle chat with customer
  const handleChatWithCustomer = async (form: FormDTO) => {
    if (!user?.userId || !form.userId) {
      toast.error('Không thể xác định thông tin người dùng')
      return
    }

    // Get sellerId from store
    if (!store?.sellerId) {
      toast.error('Không tìm thấy thông tin cửa hàng')
      return
    }

    try {
      setCreatingChat(form.id)

      // Create or get chat room
      const response = await createOrGetChatRoom({
        sellerId: store.sellerId,
        customerId: form.userId
      })

      if (response?.data?.id) {
        // Navigate to chat page with roomId
        navigate(`/seller/chat?roomId=${response.data.id}`)
        toast.success('Đang chuyển đến cuộc trò chuyện...')
      } else {
        toast.error('Không thể tạo phòng chat')
      }
    } catch (error: unknown) {
      console.error('Error creating/getting chat room:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as { message?: string })?.message ||
        'Có lỗi xảy ra khi tạo phòng chat'
      toast.error(errorMessage)
    } finally {
      setCreatingChat(null)
    }
  }

  // Handle open reply modal (only allow if status is Confirmed and not replied yet)
  const handleOpenReply = (form: FormDTO) => {
    if (form.status !== 'Confirmed') {
      toast.error('Chỉ có thể phản hồi khi trạng thái là "Chờ phản hồi từ người bán"')
      return
    }
    // Không cho phép chỉnh sửa - chỉ cho phép phản hồi khi chưa phản hồi
    if (form.isSellerReplied) {
      toast.error('Bạn đã phản hồi khiếu nại này. Đơn sẽ được nhân viên xử lý và bạn không thể chỉnh sửa phản hồi.')
      return
    }
    // Không cho phép phản hồi nếu đã quá hạn
    if (form.deadlineForSellerReply && isDeadlineExpired(form.deadlineForSellerReply)) {
      return // Ẩn button nên không cần toast
    }
    setSelectedForm(form)
    setSellerReply('')
    setSellerImages([])
    setImagePreviews([])
    imageCountRef.current = 0
    setShowReplyModal(true)
  }

  // Helper function to check if two files are the same
  const isSameFile = (file1: File, file2: File): boolean => {
    return (
      file1.name === file2.name &&
      file1.size === file2.size &&
      file1.lastModified === file2.lastModified &&
      file1.type === file2.type
    )
  }

  // Process image files with validation (max 5 images)
  const processImageFiles = useCallback((files: File[]) => {
    if (files.length === 0) return

    // Prevent duplicate processing
    if (isProcessingRef.current) {
      return
    }

    // Filter only image files
    const imageFiles = files.filter((file) => file.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      toast.error('Vui lòng chọn file ảnh hợp lệ')
      return
    }

    const maxImages = 5

    // Set processing flag
    isProcessingRef.current = true

    // Use functional update to get current state and validate
    setSellerImages((currentImages) => {
      // Double check with actual state
      const actualCurrentCount = currentImages.length
      const actualRemainingSlots = maxImages - actualCurrentCount

      if (actualRemainingSlots <= 0) {
        toast.error(`Bạn chỉ có thể tải lên tối đa ${maxImages} ảnh`)
        imageCountRef.current = actualCurrentCount
        isProcessingRef.current = false
        return currentImages // Return unchanged state
      }

      // Filter out duplicate files - check against existing images and within the batch
      const uniqueFiles: File[] = []
      const seenFiles = new Set<string>()

      for (const file of imageFiles) {
        // Create a unique key for the file
        const fileKey = `${file.name}_${file.size}_${file.lastModified}_${file.type}`

        // Skip if already seen in this batch
        if (seenFiles.has(fileKey)) {
          continue
        }

        // Check if file already exists in current images
        const isDuplicate = currentImages.some((existingFile) => isSameFile(file, existingFile))
        if (!isDuplicate) {
          seenFiles.add(fileKey)
          uniqueFiles.push(file)
        }
      }

      // Show warning if duplicates were found
      const duplicateCount = imageFiles.length - uniqueFiles.length
      if (duplicateCount > 0) {
        toast.warning(`${duplicateCount} ảnh đã tồn tại và đã được bỏ qua`)
      }

      // Take only the files that fit within the limit
      const filesToAdd = uniqueFiles.slice(0, actualRemainingSlots)

      // If no new files to add after filtering duplicates, return current state
      if (filesToAdd.length === 0) {
        isProcessingRef.current = false
        return currentImages
      }

      const newFiles = [...currentImages, ...filesToAdd]

      // Update ref immediately
      imageCountRef.current = newFiles.length

      // Show warning if some files were skipped due to limit
      if (uniqueFiles.length > actualRemainingSlots) {
        toast.warning(`Chỉ ${actualRemainingSlots} ảnh được thêm vào (tối đa ${maxImages} ảnh)`)
      }

      // Reset processing flag
      isProcessingRef.current = false

      // Return new files - useEffect will handle previews
      return newFiles
    })
  }, [])

  // Handle image selection from file input
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      processImageFiles(files)
    }
    // Reset input value to allow selecting same file again
    // Use setTimeout to ensure processImageFiles completes first
    setTimeout(() => {
      if (e.target) {
        e.target.value = ''
      }
    }, 100)
  }

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files || [])
    processImageFiles(files)
  }

  // Remove image
  const handleRemoveImage = (index: number) => {
    setSellerImages((prev) => {
      const newFiles = prev.filter((_, i) => i !== index)
      imageCountRef.current = newFiles.length
      // useEffect will handle previews cleanup automatically
      return newFiles
    })
  }

  // Handle submit reply (only allow if status is Confirmed)
  const handleSubmitReply = async () => {
    if (!selectedForm || !sellerReply.trim()) {
      toast.error('Vui lòng nhập phản hồi')
      return
    }

    if (selectedForm.status !== 'Confirmed') {
      toast.error('Chỉ có thể phản hồi khi trạng thái là "Chờ phản hồi từ người bán"')
      return
    }

    // Không cho phép phản hồi nếu đã quá hạn
    if (selectedForm.deadlineForSellerReply && isDeadlineExpired(selectedForm.deadlineForSellerReply)) {
      return // Ẩn button nên không cần toast
    }

    // Backend requires proof images
    if (!sellerImages || sellerImages.length === 0) {
      toast.error('Vui lòng cập nhật ảnh bằng chứng')
      return
    }

    // Validate max 5 images
    if (sellerImages.length > 5) {
      toast.error('Bạn chỉ có thể tải lên tối đa 5 ảnh')
      return
    }

    try {
      setSubmitting(true)
      await formApi.sellerUpdateForm(selectedForm.id, {
        sellerReply: sellerReply.trim(),
        sellerImageFiles: sellerImages
      })

      // Show success toast with confirmation message
      toast.success(
        'Phản hồi đã được gửi thành công! Đơn sẽ được nhân viên xử lý và bạn không thể chỉnh sửa phản hồi.',
        undefined,
        6000
      )

      // Close modal and reset after a short delay to ensure toast is visible
      setTimeout(() => {
        setShowReplyModal(false)
        setSellerReply('')
        setSellerImages([])
        setImagePreviews([])
        imageCountRef.current = 0
        loadForms() // Reload forms
      }, 500)
    } catch (error: unknown) {
      console.error('Error submitting reply:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string }; message?: string } })?.response?.data?.message ||
        (error as { message?: string })?.message ||
        'Có lỗi xảy ra khi gửi phản hồi'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  // Helper function to parse deadline date from "HH:mm:ss dd/MM/yyyy" format
  const parseDeadlineDate = useCallback((deadlineString: string): Date | null => {
    if (!deadlineString || deadlineString.trim() === '') return null
    try {
      // Parse format "HH:mm:ss dd/MM/yyyy"
      const match = deadlineString.match(/(\d{2}):(\d{2}):(\d{2})\s+(\d{2})\/(\d{2})\/(\d{4})/)
      if (match) {
        const [, hours, minutes, seconds, day, month, year] = match
        return new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
          parseInt(seconds)
        )
      }
      // Try ISO format
      const date = new Date(deadlineString)
      return isNaN(date.getTime()) ? null : date
    } catch {
      return null
    }
  }, [])

  // Check if deadline is expired
  const isDeadlineExpired = useCallback(
    (deadlineString: string | undefined): boolean => {
      if (!deadlineString) return false
      const deadline = parseDeadlineDate(deadlineString)
      if (!deadline) return false
      return new Date() > deadline
    },
    [parseDeadlineDate]
  )

  // Check if deadline is expiring soon (within 24 hours)
  const isDeadlineExpiringSoon = useCallback(
    (deadlineString: string | undefined): boolean => {
      if (!deadlineString) return false
      const deadline = parseDeadlineDate(deadlineString)
      if (!deadline) return false
      const now = new Date()
      const diffMs = deadline.getTime() - now.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      return diffHours > 0 && diffHours <= 24
    },
    [parseDeadlineDate]
  )

  // Get days remaining until deadline
  const getDaysRemaining = useCallback(
    (deadlineString: string | undefined): number | null => {
      if (!deadlineString) return null
      const deadline = parseDeadlineDate(deadlineString)
      if (!deadline) return null
      const now = new Date()
      const diffMs = deadline.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      return diffDays
    },
    [parseDeadlineDate]
  )

  // Filter forms that need seller response (only Confirmed status)
  const formsNeedingResponse = useMemo(() => {
    return forms.filter((form) => form.status === 'Confirmed' && !form.isSellerReplied)
  }, [forms])

  // Filter forms with violations
  const formsWithViolations = useMemo(() => {
    return forms.filter((form) => form.hasIncreasedReportCount === true)
  }, [forms])

  // Filter forms with expired deadlines
  const formsWithExpiredDeadlines = useMemo(() => {
    return forms.filter(
      (form) =>
        form.status === 'Confirmed' &&
        !form.isSellerReplied &&
        form.deadlineForSellerReply &&
        isDeadlineExpired(form.deadlineForSellerReply)
    )
  }, [forms, isDeadlineExpired])

  // Filter forms with expiring soon deadlines
  const formsWithExpiringSoonDeadlines = useMemo(() => {
    return forms.filter(
      (form) =>
        form.status === 'Confirmed' &&
        !form.isSellerReplied &&
        form.deadlineForSellerReply &&
        isDeadlineExpiringSoon(form.deadlineForSellerReply) &&
        !isDeadlineExpired(form.deadlineForSellerReply)
    )
  }, [forms, isDeadlineExpiringSoon, isDeadlineExpired])

  // Calculate attachment images when selectedForm changes
  const attachmentImages = useMemo(() => {
    if (!selectedForm?.imageUrl) return []
    const rawImages = selectedForm.imageUrl
    return Array.isArray(rawImages)
      ? rawImages.map((img) => resolveImageUrl(img)).filter((url): url is string => Boolean(url))
      : []
  }, [selectedForm])

  if (storeLoading || loading) {
    return <Loading />
  }

  if (!store?.id) {
    return (
      <div className='p-6'>
        <EmptyState title='Không tìm thấy cửa hàng' description='Vui lòng thiết lập cửa hàng trước.' type='search' />
      </div>
    )
  }

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-green-700'>Khiếu nại về cửa hàng</h1>
          <p className='text-gray-600 mt-1'>Quản lý và phản hồi các khiếu nại về cửa hàng của bạn</p>
        </div>
        <Button onClick={loadForms} variant='outline' className='text-green-600 border-green-600 hover:bg-green-50'>
          Làm mới
        </Button>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card className='border-blue-200'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Tổng khiếu nại</p>
                <p className='text-2xl font-bold text-blue-600 mt-1'>{forms.length}</p>
              </div>
              <AlertCircle className='w-8 h-8 text-blue-500' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-orange-200'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Cần phản hồi</p>
                <p className='text-2xl font-bold text-orange-600 mt-1'>{formsNeedingResponse.length}</p>
                {formsWithExpiredDeadlines.length > 0 && (
                  <p className='text-xs text-red-600 mt-1 font-medium'>
                    {formsWithExpiredDeadlines.length} đơn quá hạn
                  </p>
                )}
                {formsWithExpiringSoonDeadlines.length > 0 && formsWithExpiredDeadlines.length === 0 && (
                  <p className='text-xs text-orange-600 mt-1 font-medium'>
                    {formsWithExpiringSoonDeadlines.length} đơn sắp hết hạn
                  </p>
                )}
              </div>
              <Clock className='w-8 h-8 text-orange-500' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-green-200'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Đã phản hồi</p>
                <p className='text-2xl font-bold text-green-600 mt-1'>
                  {forms.filter((f) => f.isSellerReplied).length}
                </p>
              </div>
              <CheckCircle className='w-8 h-8 text-green-500' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-red-200'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Tổng vi phạm</p>
                <p className='text-2xl font-bold text-red-600 mt-1'>
                  {totalViolationCount !== null ? totalViolationCount : '-'}
                </p>
                {formsWithViolations.length > 0 && (
                  <p className='text-xs text-red-600 mt-1 font-medium'>{formsWithViolations.length} đơn vi phạm</p>
                )}
              </div>
              <XCircle className='w-8 h-8 text-red-500' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forms List */}
      {forms.length > 0 ? (
        <div className='space-y-4'>
          {forms
            .sort((a, b) => {
              // Sort priority: expired > expiring soon > others
              const aExpired =
                a.status === 'Confirmed' &&
                !a.isSellerReplied &&
                a.deadlineForSellerReply &&
                isDeadlineExpired(a.deadlineForSellerReply)
              const bExpired =
                b.status === 'Confirmed' &&
                !b.isSellerReplied &&
                b.deadlineForSellerReply &&
                isDeadlineExpired(b.deadlineForSellerReply)
              if (aExpired && !bExpired) return -1
              if (!aExpired && bExpired) return 1

              const aExpiringSoon =
                a.status === 'Confirmed' &&
                !a.isSellerReplied &&
                a.deadlineForSellerReply &&
                isDeadlineExpiringSoon(a.deadlineForSellerReply) &&
                !isDeadlineExpired(a.deadlineForSellerReply)
              const bExpiringSoon =
                b.status === 'Confirmed' &&
                !b.isSellerReplied &&
                b.deadlineForSellerReply &&
                isDeadlineExpiringSoon(b.deadlineForSellerReply) &&
                !isDeadlineExpired(b.deadlineForSellerReply)
              if (aExpiringSoon && !bExpiringSoon) return -1
              if (!aExpiringSoon && bExpiringSoon) return 1

              // Then sort by created date (newest first)
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            })
            .map((form) => {
              const statusInfo = getStatusInfo(form.status)
              const canReply = form.status === 'Confirmed'
              const needsResponse = canReply && !form.isSellerReplied
              const isExpired =
                form.status === 'Confirmed' &&
                !form.isSellerReplied &&
                form.deadlineForSellerReply &&
                isDeadlineExpired(form.deadlineForSellerReply)
              const isExpiringSoon =
                form.status === 'Confirmed' &&
                !form.isSellerReplied &&
                form.deadlineForSellerReply &&
                isDeadlineExpiringSoon(form.deadlineForSellerReply) &&
                !isDeadlineExpired(form.deadlineForSellerReply)
              const daysRemaining = getDaysRemaining(form.deadlineForSellerReply)

              return (
                <Card key={form.id} className='hover:shadow-lg transition-shadow border border-gray-100'>
                  <CardHeader className='pb-4 border-b border-gray-100'>
                    <div className='flex flex-col gap-3'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Badge
                          variant={statusInfo.badge as 'default' | 'secondary' | 'destructive' | 'outline'}
                          className={`${statusInfo.bgColor} ${statusInfo.color} border-0 flex items-center gap-1`}
                        >
                          {statusInfo.icon}
                          {statusInfo.text}
                        </Badge>
                        <Badge variant='outline' className='text-xs'>
                          {getTypeText(form.type)}
                        </Badge>
                        {form.hasIncreasedReportCount && (
                          <Badge variant='destructive' className='text-xs bg-red-600 text-white border-0'>
                            <XCircle className='w-3 h-3 mr-1' />
                            Đơn vi phạm
                          </Badge>
                        )}
                        {needsResponse && (
                          <Badge variant='destructive' className='text-xs'>
                            Cần phản hồi
                          </Badge>
                        )}
                        {isExpired && (
                          <Badge variant='destructive' className='text-xs bg-red-700 text-white border-0'>
                            <AlertCircle className='w-3 h-3 mr-1' />
                            Đã quá hạn
                          </Badge>
                        )}
                        {isExpiringSoon && !isExpired && (
                          <Badge variant='destructive' className='text-xs bg-orange-600 text-white border-0'>
                            <Clock className='w-3 h-3 mr-1' />
                            Sắp hết hạn (
                            {daysRemaining !== null && daysRemaining > 0 ? `${daysRemaining} ngày` : 'Hôm nay'})
                          </Badge>
                        )}
                        {form.deadlineForSellerReply && !form.isSellerReplied && !isExpired && !isExpiringSoon && (
                          <Badge variant='secondary' className='text-xs'>
                            <Clock className='w-3 h-3 mr-1' />
                            Hạn: {form.deadlineForSellerReply}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <h3 className='text-lg font-semibold text-gray-900 mb-1'>{form.subject}</h3>
                        <p className='text-sm text-gray-600 line-clamp-2'>{form.description}</p>
                      </div>
                      {form.orderId && (
                        <div className='flex items-center gap-2 text-xs text-gray-500'>
                          <span>Đơn hàng:</span>
                          <CopyButton
                            textToCopy={form.orderId.slice(-8)}
                            idleText={form.orderId.slice(-8)}
                            copiedText='Đã copy!'
                            className='h-6 px-2 text-xs min-w-16'
                            successDuration={2000}
                          />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className='pt-4 space-y-3'>
                    {/* Images */}
                    {form.imageUrl && Array.isArray(form.imageUrl) && form.imageUrl.length > 0 && (
                      <div>
                        <Label className='text-xs font-medium text-gray-600 mb-2 block flex items-center gap-1'>
                          <ImageIcon className='w-3 h-3' />
                          Hình ảnh đính kèm ({form.imageUrl.length})
                        </Label>
                        <div className='flex gap-2 flex-wrap'>
                          {form.imageUrl.map((imageUrl: string, index: number) => {
                            const resolvedUrl = resolveImageUrl(imageUrl)
                            return (
                              <img
                                key={index}
                                src={resolvedUrl}
                                alt={`Tệp đính kèm ${index + 1}`}
                                className='w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity hover:border-blue-400'
                                onClick={() => {
                                  const images = form.imageUrl
                                    .map((img: string) => resolveImageUrl(img))
                                    .filter((url): url is string => Boolean(url))
                                  setPreviewImages(images)
                                  setListPreviewIndex(index)
                                  setIsListPreviewOpen(true)
                                }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = '/placeholder-image.png'
                                }}
                              />
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-4 text-xs text-gray-500'>
                        <div className='flex items-center gap-1'>
                          <Calendar className='w-3 h-3' />
                          Tạo: {form.createdAt}
                        </div>
                        {form.updatedAt !== form.createdAt && (
                          <div className='flex items-center gap-1'>
                            <Clock className='w-3 h-3' />
                            Cập nhật: {form.updatedAt}
                          </div>
                        )}
                      </div>
                      <div className='flex gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleViewDetail(form.id)}
                          className='text-blue-600 border-blue-600 hover:bg-blue-50'
                        >
                          <Eye className='w-4 h-4 mr-2' />
                          Xem chi tiết
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleChatWithCustomer(form)}
                          disabled={creatingChat === form.id}
                          className='text-green-600 border-green-600 hover:bg-green-50'
                          title='Nhắn tin với khách hàng để giải quyết khiếu nại'
                        >
                          <MessageCircle className='w-4 h-4 mr-2' />
                          {creatingChat === form.id ? 'Đang tải...' : 'Nhắn tin'}
                        </Button>
                        {/* Chỉ hiển thị nút phản hồi khi chưa phản hồi và chưa quá hạn - không cho phép chỉnh sửa */}
                        {form.status === 'Confirmed' &&
                          !form.isSellerReplied &&
                          (!form.deadlineForSellerReply || !isDeadlineExpired(form.deadlineForSellerReply)) && (
                            <Button
                              variant='default'
                              size='sm'
                              onClick={() => handleOpenReply(form)}
                              className='bg-yellow-500 text-white hover:bg-[#FFD700]'
                            >
                              Phản hồi
                            </Button>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      ) : (
        <EmptyState
          title='Không có khiếu nại nào'
          description='Hiện tại không có khiếu nại nào về cửa hàng của bạn.'
          type='search'
        />
      )}

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 [scrollbar-width:thin] [scrollbar-color:rgb(209_213_219)_transparent]'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold'>Chi tiết khiếu nại</DialogTitle>
          </DialogHeader>
          {loadingDetail ? (
            <div className='flex items-center justify-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              <span className='ml-3 text-gray-600'>Đang tải chi tiết...</span>
            </div>
          ) : selectedForm ? (
            <div className='space-y-6'>
              {/* Form Info */}
              <Card>
                <CardHeader>
                  <div className='flex items-center gap-3 mb-2'>
                    <Badge
                      variant={
                        getStatusInfo(selectedForm.status).badge as 'default' | 'secondary' | 'destructive' | 'outline'
                      }
                      className={`${getStatusInfo(selectedForm.status).bgColor} ${getStatusInfo(selectedForm.status).color} border-0`}
                    >
                      {getStatusInfo(selectedForm.status).icon}
                      {getStatusInfo(selectedForm.status).text}
                    </Badge>
                    <Badge variant='outline'>{getTypeText(selectedForm.type)}</Badge>
                    {selectedForm.hasIncreasedReportCount && (
                      <Badge variant='destructive' className='bg-red-600 text-white border-0'>
                        <XCircle className='w-3 h-3 mr-1' />
                        Đơn vi phạm
                      </Badge>
                    )}
                  </div>
                  <CardTitle>{selectedForm.subject}</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-2 block'>Mô tả</Label>
                    <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                      <p className='text-gray-800 whitespace-pre-wrap break-words'>{selectedForm.description}</p>
                    </div>
                  </div>

                  {/* Images */}
                  {attachmentImages.length > 0 && (
                    <div>
                      <Label className='text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2'>
                        <ImageIcon className='w-4 h-4' />
                        Hình ảnh đính kèm ({attachmentImages.length})
                      </Label>
                      <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                        {attachmentImages.map((imageUrl: string, index: number) => (
                          <div
                            key={index}
                            className='relative group cursor-pointer'
                            onClick={() => {
                              setPreviewIndex(index)
                              setIsPreviewOpen(true)
                            }}
                          >
                            <img
                              src={imageUrl}
                              alt={`Tệp đính kèm ${index + 1}`}
                              className='w-full h-32 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity'
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Staff Reply */}
                  {selectedForm.reply && (
                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                      <Label className='text-sm font-medium text-blue-700 mb-2 block'>Phản hồi từ nhân viên</Label>
                      <p className='text-blue-800 whitespace-pre-wrap break-words'>{selectedForm.reply}</p>
                      {selectedForm.staffName && (
                        <p className='text-blue-600 text-sm mt-2'>- {selectedForm.staffName}</p>
                      )}
                    </div>
                  )}

                  {/* Seller Reply */}
                  {selectedForm.sellerReply && (
                    <div className='bg-purple-50 border border-purple-200 rounded-lg p-4'>
                      <Label className='text-sm font-medium text-purple-700 mb-2 block'>Phản hồi của bạn</Label>
                      <p className='text-purple-800 whitespace-pre-wrap break-words'>{selectedForm.sellerReply}</p>
                      {selectedForm.sellerReplyAt && (
                        <p className='text-purple-600 text-xs mt-2'>Phản hồi lúc: {selectedForm.sellerReplyAt}</p>
                      )}
                      {selectedForm.sellerImages && selectedForm.sellerImages.length > 0 && (
                        <div className='mt-3'>
                          <Label className='text-sm font-medium text-purple-700 mb-2 block'>Hình ảnh bằng chứng</Label>
                          <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                            {selectedForm.sellerImages.map((imageUrl: string, index: number) => (
                              <img
                                key={index}
                                src={resolveImageUrl(imageUrl)}
                                alt={`Bằng chứng ${index + 1}`}
                                className='w-full h-24 object-cover rounded border border-purple-200 cursor-pointer hover:opacity-90'
                                onClick={() => window.open(resolveImageUrl(imageUrl), '_blank')}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Deadline - Chỉ hiển thị khi chưa phản hồi */}
                  {selectedForm.deadlineForSellerReply && !selectedForm.isSellerReplied && (
                    <div
                      className={`rounded-lg p-3 border ${isDeadlineExpired(selectedForm.deadlineForSellerReply)
                        ? 'bg-red-50 border-red-200'
                        : isDeadlineExpiringSoon(selectedForm.deadlineForSellerReply)
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-blue-50 border-blue-200'
                        }`}
                    >
                      <div className='flex items-center gap-2'>
                        {isDeadlineExpired(selectedForm.deadlineForSellerReply) ? (
                          <>
                            <AlertCircle className='w-4 h-4 text-red-600' />
                            <span className='text-sm font-medium text-red-700'>
                              Đã quá hạn phản hồi: {selectedForm.deadlineForSellerReply}
                            </span>
                          </>
                        ) : isDeadlineExpiringSoon(selectedForm.deadlineForSellerReply) ? (
                          <>
                            <Clock className='w-4 h-4 text-orange-600' />
                            <span className='text-sm font-medium text-orange-700'>
                              Sắp hết hạn phản hồi: {selectedForm.deadlineForSellerReply} (
                              {getDaysRemaining(selectedForm.deadlineForSellerReply) !== null &&
                                getDaysRemaining(selectedForm.deadlineForSellerReply)! > 0
                                ? `Còn ${getDaysRemaining(selectedForm.deadlineForSellerReply)} ngày`
                                : 'Hôm nay'}
                              )
                            </span>
                          </>
                        ) : (
                          <>
                            <Clock className='w-4 h-4 text-blue-600' />
                            <span className='text-sm font-medium text-blue-700'>
                              Hạn phản hồi: {selectedForm.deadlineForSellerReply}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons in Detail Modal */}
                  <div className='pt-4 border-t space-y-2'>
                    <Button
                      onClick={() => {
                        setShowDetailModal(false)
                        handleChatWithCustomer(selectedForm)
                      }}
                      disabled={creatingChat === selectedForm.id}
                      className='w-full bg-green-600 hover:bg-green-700 text-white'
                    >
                      <MessageCircle className='w-4 h-4 mr-2' />
                      {creatingChat === selectedForm.id ? 'Đang tải...' : 'Nhắn tin với khách hàng'}
                    </Button>
                    {/* Reply Button - Chỉ hiển thị khi chưa phản hồi và chưa quá hạn - không cho phép chỉnh sửa */}
                    {selectedForm.status === 'Confirmed' &&
                      !selectedForm.isSellerReplied &&
                      (!selectedForm.deadlineForSellerReply ||
                        !isDeadlineExpired(selectedForm.deadlineForSellerReply)) && (
                        <Button
                          onClick={() => {
                            setShowDetailModal(false)
                            handleOpenReply(selectedForm)
                          }}
                          className='w-full bg-orange-600 hover:bg-orange-700 text-white'
                        >
                          Phản hồi khiếu nại
                        </Button>
                      )}
                  </div>

                  {/* Thông báo khi đã phản hồi */}
                  {selectedForm.status === 'Confirmed' && selectedForm.isSellerReplied && (
                    <div className='pt-4 border-t'>
                      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                        <div className='flex items-start gap-2'>
                          <AlertCircle className='w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0' />
                          <div>
                            <p className='text-sm font-medium text-blue-800'>Bạn đã phản hồi khiếu nại này</p>
                            <p className='text-xs text-blue-600 mt-1'>
                              Đơn sẽ được nhân viên xử lý và bạn không thể chỉnh sửa phản hồi.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className='text-center py-12'>
              <p className='text-gray-500'>Không tìm thấy thông tin khiếu nại</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply Modal */}
      <Dialog open={showReplyModal} onOpenChange={setShowReplyModal}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-lg sm:text-xl font-bold'>Phản hồi khiếu nại</DialogTitle>
          </DialogHeader>
          {selectedForm && (
            <div className='space-y-4'>
              <div className='bg-gray-50 rounded-lg p-3'>
                <p className='text-sm text-gray-600'>
                  <span className='font-medium'>Khiếu nại:</span> {selectedForm.subject}
                </p>
                {selectedForm.deadlineForSellerReply && !selectedForm.isSellerReplied && (
                  <p
                    className={`text-xs mt-1 font-medium ${isDeadlineExpired(selectedForm.deadlineForSellerReply)
                      ? 'text-red-600'
                      : isDeadlineExpiringSoon(selectedForm.deadlineForSellerReply)
                        ? 'text-orange-600'
                        : 'text-blue-600'
                      }`}
                  >
                    {isDeadlineExpired(selectedForm.deadlineForSellerReply) ? (
                      <> Đã quá hạn: {selectedForm.deadlineForSellerReply}</>
                    ) : isDeadlineExpiringSoon(selectedForm.deadlineForSellerReply) ? (
                      <>
                        Sắp hết hạn: {selectedForm.deadlineForSellerReply} (Còn{' '}
                        {getDaysRemaining(selectedForm.deadlineForSellerReply) !== null &&
                          getDaysRemaining(selectedForm.deadlineForSellerReply)! > 0
                          ? `${getDaysRemaining(selectedForm.deadlineForSellerReply)} ngày`
                          : 'hôm nay'}
                        )
                      </>
                    ) : (
                      <>Hạn phản hồi: {selectedForm.deadlineForSellerReply}</>
                    )}
                  </p>
                )}
              </div>

              {/* Warning message */}
              <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
                <div className='flex items-start gap-2'>
                  <AlertCircle className='w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0' />
                  <div>
                    <p className='text-sm font-medium text-amber-800'>Lưu ý quan trọng</p>
                    <p className='text-xs text-amber-700 mt-1'>
                      Sau khi gửi phản hồi, đơn sẽ được chuyển cho nhân viên xử lý. Bạn sẽ không thể chỉnh sửa hoặc thay
                      đổi phản hồi sau khi đã gửi. Vui lòng kiểm tra kỹ thông tin trước khi gửi.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>Phản hồi của bạn *</Label>
                <Textarea
                  placeholder='Nhập phản hồi và giải thích của bạn...'
                  value={sellerReply}
                  onChange={(e) => setSellerReply(e.target.value)}
                  className='min-h-[100px] sm:min-h-[120px] resize-none text-sm sm:text-base'
                />
              </div>

              <div>
                <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Hình ảnh bằng chứng <span className='text-red-500'>*</span>
                  <span className='text-xs text-gray-500 font-normal ml-2'>(Tối đa 5 ảnh)</span>
                </Label>
                <div className='space-y-3'>
                  {/* Drag and Drop Zone */}
                  <div
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors ${isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                      }`}
                  >
                    <input
                      type='file'
                      id='seller-images'
                      multiple
                      accept='image/*'
                      onChange={handleImageSelect}
                      className='hidden'
                    />
                    <div className='flex flex-col items-center gap-2 sm:gap-3'>
                      <Upload className={`w-8 h-8 sm:w-10 sm:h-10 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                      <div className='flex flex-col items-center gap-2'>
                        <p className='text-xs sm:text-sm font-medium text-gray-700'>
                          {isDragging ? 'Thả ảnh vào đây' : 'Kéo thả ảnh vào đây hoặc'}
                        </p>
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => document.getElementById('seller-images')?.click()}
                          className='text-blue-600 border-blue-600 hover:bg-blue-50'
                          size='sm'
                        >
                          <Upload className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
                          <span className='text-xs sm:text-sm'>Chọn ảnh</span>
                        </Button>
                      </div>
                      <p className='text-xs text-gray-500 px-2'>
                        Định dạng hỗ trợ: JPG, PNG, GIF
                        <br className='sm:hidden' />
                        <span className='hidden sm:inline'> </span>(Tối đa 5 ảnh)
                      </p>
                      {imagePreviews.length > 0 && (
                        <p className='text-xs sm:text-sm text-green-600 font-medium'>
                          Đã chọn: {imagePreviews.length}/5 ảnh
                        </p>
                      )}
                    </div>
                  </div>

                  {imagePreviews.length === 0 && (
                    <p className='text-sm text-red-500 text-center'>Vui lòng chọn ít nhất 1 ảnh bằng chứng</p>
                  )}

                  {imagePreviews.length > 0 && (
                    <div className='grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3'>
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className='relative group'>
                          <img
                            src={preview}
                            alt={`Xem trước ${index + 1}`}
                            className='w-full h-20 sm:h-24 object-cover rounded border border-gray-200'
                          />
                          <button
                            type='button'
                            onClick={() => handleRemoveImage(index)}
                            className='absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                          >
                            <X className='w-3 h-3' />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className='flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setShowReplyModal(false)
                    setSellerReply('')
                    setSellerImages([])
                    setImagePreviews([])
                    imageCountRef.current = 0
                  }}
                  className='flex-1 w-full sm:w-auto'
                  disabled={submitting}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleSubmitReply}
                  disabled={submitting || !sellerReply.trim() || sellerImages.length === 0}
                  className='flex-1 w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal for Detail */}
      <ImagePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        images={attachmentImages}
        initialIndex={previewIndex}
      />

      {/* Image Preview Modal for List */}
      <ImagePreviewModal
        isOpen={isListPreviewOpen}
        onClose={() => setIsListPreviewOpen(false)}
        images={previewImages}
        initialIndex={listPreviewIndex}
      />
    </div>
  )
}

export default ComplainSeller
