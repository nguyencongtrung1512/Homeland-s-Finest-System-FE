import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Package,
  Star,
  Eye,
  MapPin,
  Tag,
  FileText,
  Award,
  Play,
  Image as ImageIcon,
  Archive,
  Layers,
  UserPlus,
  User,
  ChevronDown,
  ZoomIn,
  Maximize2,
  Hash
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import type { Product, VariantGroup, VariantOption, ProductCategory } from '../../../types/productType'
import { productApi } from '../../../apis/product.api'
import { adminApi, type Staff } from '../../../apis/admin.api'
import { staffApi, type StaffInfo } from '../../../apis/staff.api'
import { storeApi, type StoreResponse } from '../../../apis/store.api'
import { getHashtagById, type HashtagItem } from '../../../apis/hashtag.api'
import StaffComboBox from '../../../components/ui/staff-combo-box'
import { Button as UIButton } from '../../../components/ui/button'
import { toast } from '../../../utils/toast'
import { Store } from 'lucide-react'
import ProductCertificate from '../../staff/productManagerment/productCertificate'
import ProductStoryComponent from '../../staff/productManagerment/productStory'
import ProductImageCarousel from '../../../components/ui/product-image-carousel'
import ImagePreviewModal from '../../../components/ui/image-preview-modal'
import { motion, AnimatePresence } from 'motion/react'
import { Stream } from '@cloudflare/stream-react'

// Helper function to translate product type to Vietnamese
const getProductTypeLabel = (typeProduct: string | null | undefined): string => {
  if (!typeProduct) return 'Chưa xác định'
  switch (typeProduct) {
    case 'ProductMaster':
      return 'Sản phẩm chính'
    case 'ProductDetail':
      return 'Sản phẩm chi tiết'
    default:
      return typeProduct
  }
}

// Helper function to get category with highest level
const getHighestLevelCategory = (categories: ProductCategory[] | ProductCategory | null | undefined): ProductCategory | null => {
  if (!categories) return null

  // Handle case where categories is a single object (backward compatibility)
  if (!Array.isArray(categories)) {
    return categories
  }

  // Handle case where categories is an array
  if (categories.length === 0) return null

  // Find category with highest level
  return categories.reduce((highest, current) => {
    return (current.level || 0) > (highest.level || 0) ? current : highest
  }, categories[0])
}

function DetailProductAdmin() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  // States for expanded variants (collapse/expand)
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set())

  // States for assigned staff
  const [assignedStaffId, setAssignedStaffId] = useState<string | null>(null)
  const [assignedStaffName, setAssignedStaffName] = useState<string | null>(null)
  const [assignedStaffEmail, setAssignedStaffEmail] = useState<string | null>(null)
  const [loadingStaff, setLoadingStaff] = useState(false)

  // States for store info
  const [storeInfo, setStoreInfo] = useState<StoreResponse | null>(null)
  const [loadingStore, setLoadingStore] = useState(false)

  // States for assign staff modal
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loadingStaffList, setLoadingStaffList] = useState(false)
  const [assigning, setAssigning] = useState(false)

  // States for action modal
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'Confirmed' | 'Rejected' | 'Approved' | 'Denied' | null>(null)
  const [actionNote, setActionNote] = useState('')
  const [processingAction, setProcessingAction] = useState(false)

  // States for image preview
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0)

  // State for hashtags
  const [hashtags, setHashtags] = useState<HashtagItem[]>([])
  const [loadingHashtags, setLoadingHashtags] = useState(false)

  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!id) {
        toast.error('Không tìm thấy ID sản phẩm')
        navigate(-1)
        return
      }

      try {
        setLoading(true)
        const response = await productApi.getById(id)

        if (response.status === 200 && response.data) {
          setProduct(response.data)
          // Check if product has assignedToId (from API response)
          const productData = response.data as Product & { assignedToId?: string }
          if (productData.assignedToId) {
            setAssignedStaffId(productData.assignedToId)
            fetchStaffInfo(productData.assignedToId)
          }
          // Fetch store info if storeId exists
          if (productData.storeId) {
            fetchStoreInfo(productData.storeId)
          }
        } else {
          const errorMessage =
            (response as { data?: { message?: string }; message?: string })?.data?.message ||
            (response as { message?: string })?.message ||
            'Không thể tải thông tin sản phẩm'
          toast.error(errorMessage)
        }
      } catch (error) {
        console.error('Error fetching product detail:', error)
        const errorMessage =
          (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
          (error as { message?: string })?.message ||
          'Có lỗi xảy ra khi tải thông tin sản phẩm'
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchProductDetail()
  }, [id, navigate])

  // Fetch staff info by ID
  const fetchStaffInfo = async (staffId: string) => {
    if (!staffId) return

    try {
      setLoadingStaff(true)
      const response = await staffApi.getStaffInfo(staffId)

      const staffInfo: StaffInfo | undefined =
        response.data?.data || (response.data as StaffInfo) || (response as unknown as StaffInfo)

      if (staffInfo) {
        if (staffInfo.firstName && staffInfo.lastName) {
          const fullName = `${staffInfo.firstName} ${staffInfo.lastName}`.trim()
          setAssignedStaffName(fullName)
        }
        if (staffInfo.email) {
          setAssignedStaffEmail(staffInfo.email)
        }
      }
    } catch (error) {
      console.error(`Error fetching staff info for ${staffId}:`, error)
    } finally {
      setLoadingStaff(false)
    }
  }

  // Fetch store info by ID
  const fetchStoreInfo = async (storeId: string) => {
    if (!storeId) return

    try {
      setLoadingStore(true)
      const response = await storeApi.getStoreById(storeId)

      if (response.data) {
        const storeData = response.data.data || response.data
        setStoreInfo(storeData as StoreResponse)
      }
    } catch (error) {
      console.error(`Error fetching store info for ${storeId}:`, error)
      toast.error('Không thể tải thông tin cửa hàng')
    } finally {
      setLoadingStore(false)
    }
  }

  // Fetch hashtags if product has hashtagIds
  useEffect(() => {
    const fetchHashtags = async () => {
      // Check if product has hashtagIds (it might be in the response but not in the type)
      const productWithHashtags = product as Product & { hashtagIds?: string[] }
      if (!productWithHashtags?.hashtagIds || productWithHashtags.hashtagIds.length === 0) {
        setHashtags([])
        return
      }

      try {
        setLoadingHashtags(true)
        // Fetch all hashtags in parallel
        const hashtagPromises = productWithHashtags.hashtagIds.map((hashtagId) => getHashtagById(hashtagId))
        const responses = await Promise.all(hashtagPromises)

        // Extract hashtag data from responses
        const fetchedHashtags: HashtagItem[] = []
        responses.forEach((response) => {
          if (response.status === 200 && response.data) {
            fetchedHashtags.push(response.data)
          }
        })

        setHashtags(fetchedHashtags)
      } catch (error) {
        console.error('Error fetching hashtags:', error)
        setHashtags([])
      } finally {
        setLoadingHashtags(false)
      }
    }

    if (product) {
      fetchHashtags()
    }
  }, [product])

  // Load staff list for assign modal
  const loadStaffList = async () => {
    try {
      setLoadingStaffList(true)
      // Only get active staff for assignment
      const response = await staffApi.getAllStaff({ isActive: true })

      // Handle different response formats
      let staffData: StaffInfo[] = []

      if (Array.isArray(response)) {
        // Response is directly an array
        staffData = response
      } else if (response && typeof response === 'object' && 'data' in response) {
        const responseWithData = response as { data?: StaffInfo[] }
        if (Array.isArray(responseWithData.data)) {
          // Response has structure {status, message, data: [...]}
          staffData = responseWithData.data
        }
      }

      if (staffData.length > 0) {
        // Map StaffInfo[] to Staff[] format for StaffComboBox
        const mappedStaffList: Staff[] = staffData.map((staffInfo: StaffInfo) => {
          // Generate staff name with fallbacks
          let staffName = 'Nhân viên'
          if (staffInfo.firstName && staffInfo.lastName) {
            staffName = `${staffInfo.firstName} ${staffInfo.lastName}`.trim()
          } else if (staffInfo.email) {
            // Use email username as fallback
            staffName = staffInfo.email.split('@')[0]
          }

          return {
            staffId: staffInfo.userId,
            staffName: staffName,
            email: staffInfo.email || '',
            processingStoreCount: 0 // StaffInfo doesn't have this field, set default
          }
        })
        setStaffList(mappedStaffList)
      } else {
        setStaffList([])
      }
    } catch (error) {
      console.error('Error loading staff list:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách nhân viên')
      setStaffList([])
    } finally {
      setLoadingStaffList(false)
    }
  }

  // Handle open assign modal
  const handleOpenAssignModal = () => {
    setSelectedStaffId(assignedStaffId || '')
    setShowAssignModal(true)
    loadStaffList()
  }

  // Handle close assign modal
  const handleCloseAssignModal = () => {
    setShowAssignModal(false)
    setSelectedStaffId('')
    setStaffList([])
  }

  // Handle assign staff
  const handleAssignStaff = async () => {
    if (!id || !selectedStaffId) {
      toast.error('Vui lòng chọn nhân viên')
      return
    }

    try {
      setAssigning(true)
      const response = await adminApi.reassignProduct(id, selectedStaffId)

      const successMessage = (response as { message?: string })?.message || 'Gán nhân viên thành công'

      toast.success(successMessage)
      handleCloseAssignModal()

      // Update assigned staff info
      setAssignedStaffId(selectedStaffId)
      await fetchStaffInfo(selectedStaffId)

      // Refresh product data
      await handleRefreshProduct()
    } catch (error) {
      console.error('Error assigning staff:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (error as { message?: string })?.message ||
        'Có lỗi xảy ra khi gán nhân viên'
      toast.error(errorMessage)
    } finally {
      setAssigning(false)
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa có'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  // Lấy tất cả variant cha (cấp 1) từ variantGroups
  const getParentVariants = (variantGroups: VariantGroup[]): VariantOption[] => {
    const result: VariantOption[] = []
    variantGroups.forEach((group) => {
      result.push(...group.options)
    })
    return result
  }

  // Kiểm tra variant có phải là variant cha có con không
  const hasChildVariants = (variant: VariantOption): boolean => {
    return Array.isArray(variant.childVariantGroups) && variant.childVariantGroups.length > 0
  }

  // Lấy tất cả variant con từ một variant cha
  const getChildVariants = (variant: VariantOption): VariantOption[] => {
    if (!hasChildVariants(variant)) return []
    const result: VariantOption[] = []
    variant.childVariantGroups?.forEach((childGroup) => {
      result.push(...childGroup.options)
    })
    return result
  }

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge className='bg-red-100 text-red-800'>Tạm dừng</Badge>
    }

    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge className='bg-yellow-100 text-yellow-800'>Chờ duyệt</Badge>
      case 'approved':
        return <Badge className='bg-green-100 text-green-800'>Đã duyệt</Badge>
      case 'rejected':
        return <Badge className='bg-red-100 text-red-800'>Từ chối</Badge>
      default:
        return <Badge className='bg-gray-100 text-gray-800'>{status}</Badge>
    }
  }

  const getCertificateStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <Badge className='bg-green-100 text-green-800'>Đã duyệt</Badge>
      case 'pending':
        return <Badge className='bg-yellow-100 text-yellow-800'>Chờ duyệt</Badge>
      case 'rejected':
        return <Badge className='bg-red-100 text-red-800'>Từ chối</Badge>
      default:
        return <Badge className='bg-gray-100 text-gray-800'>{status}</Badge>
    }
  }

  // Refresh product data
  const handleRefreshProduct = async () => {
    if (!id) return
    try {
      const refreshResponse = await productApi.getById(id)
      if (refreshResponse.status === 200 && refreshResponse.data) {
        setProduct(refreshResponse.data)
      }
    } catch (error) {
      console.error('Error refreshing product:', error)
    }
  }


  // Handle confirm action
  const handleConfirmAction = async () => {
    if (!id || !actionType) return

    try {
      setProcessingAction(true)
      const response = await staffApi.updateProductStatus(id, actionType, actionNote || '')

      // Lấy thông báo từ backend response
      const successMessage =
        (response as { data?: { message?: string }; message?: string })?.data?.message ||
        (response as { message?: string })?.message ||
        'Cập nhật trạng thái thành công'

      toast.success(successMessage)
      setShowActionModal(false)
      setActionNote('')
      setActionType(null)
      await handleRefreshProduct()
    } catch (error) {
      console.error('Error updating product status:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (error as { response?: { data?: { errors?: string[] }; errors?: string[] } })?.response?.data?.errors?.join(
          ', '
        ) ||
        (error as { message?: string })?.message ||
        'Có lỗi xảy ra khi cập nhật trạng thái'
      toast.error(errorMessage)
    } finally {
      setProcessingAction(false)
    }
  }

  // Handle image preview
  const handleImagePreview = (imageUrl: string, allImages?: string[], index?: number) => {
    if (allImages && index !== undefined) {
      setPreviewImages(allImages)
      setPreviewInitialIndex(index)
    } else {
      setPreviewImages([imageUrl])
      setPreviewInitialIndex(0)
    }
    setImagePreviewOpen(true)
  }

  const handleCloseImagePreview = () => {
    setImagePreviewOpen(false)
    setPreviewImages([])
    setPreviewInitialIndex(0)
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

  // Process product video data to get video sources and ID
  const processProductVideo = (product: Product) => {
    let video = ''
    let videoId: string | undefined = undefined
    let videoSources: { hls?: string; dash?: string; preview?: string; fallback?: string } | undefined = undefined

    // Priority according to document: videoPlayBackUrl (Priority 1) > videoPreviewUrl (Priority 2) > videoFallBackUrl (Priority 3) > productVideo (legacy)
    if (product.videoPlayBackUrl) {
      // Try to extract video ID from any Cloudflare Stream URL
      const playbackVideoId = extractVideoId(product.videoPlayBackUrl)
      videoId = playbackVideoId

      // Parse videoPlayBackUrl: contains both HLS (.m3u8) and DASH (.mpd) URLs
      const playbackUrls = product.videoPlayBackUrl.split(',').map((url) => url.trim())
      const hlsUrl = playbackUrls.find((url) => url.includes('.m3u8'))
      const dashUrl = playbackUrls.find((url) => url.includes('.mpd'))

      // Build videoSources object, only including URLs that exist
      videoSources = {}
      if (hlsUrl) videoSources.hls = hlsUrl
      if (dashUrl) videoSources.dash = dashUrl
      // Include preview as fallback for browsers that don't support HLS/DASH
      if (product.videoPreviewUrl?.trim()) {
        videoSources.preview = product.videoPreviewUrl.trim()
      }
      if (product.videoFallBackUrl?.trim()) {
        videoSources.fallback = product.videoFallBackUrl.trim()
      }

      // Use preview URL as primary (most compatible), fallback to HLS/DASH if preview not available
      video =
        product.videoPreviewUrl?.trim() ||
        hlsUrl ||
        dashUrl ||
        product.videoFallBackUrl?.trim() ||
        playbackUrls[0] ||
        ''
    } else if (product.videoPreviewUrl) {
      video = product.videoPreviewUrl.trim()
      const previewVideoId = extractVideoId(video)
      videoId = previewVideoId
      videoSources = {
        preview: product.videoPreviewUrl.trim(),
        fallback: product.videoFallBackUrl?.trim() || undefined
      }
    } else if (product.videoFallBackUrl) {
      video = product.videoFallBackUrl.trim()
      const fallbackVideoId = extractVideoId(video)
      videoId = fallbackVideoId
      videoSources = {
        fallback: product.videoFallBackUrl.trim()
      }
    } else if (product.productVideo) {
      // Legacy support
      video = product.productVideo
      const legacyVideoId = extractVideoId(video)
      videoId = legacyVideoId
    }

    return { video, videoId, videoSources }
  }




  if (loading) {
    return (
      <div className='p-6'>
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-600'></div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className='p-6'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-gray-600'>Không tìm thấy thông tin sản phẩm</div>
        </div>
      </div>
    )
  }

  // Lấy tất cả variant cha để hiển thị
  const parentVariants = product?.variantGroups ? getParentVariants(product.variantGroups) : []

  // Helper để lấy attributeType từ variantGroup dựa vào variant option
  const getAttributeTypeForVariant = (variant: VariantOption): string | null => {
    if (!product?.variantGroups) return null
    for (const group of product.variantGroups) {
      const found = group.options.find((opt) => opt.id === variant.id)
      if (found) return group.attributeType
    }
    return null
  }

  // Handler toggle expanded variant
  const toggleVariantExpanded = (variantId: string) => {
    setExpandedVariants((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(variantId)) {
        newSet.delete(variantId)
      } else {
        newSet.add(variantId)
      }
      return newSet
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className='p-6 space-y-6'
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className='flex items-center justify-between'
      >
        <div className='flex items-center gap-3'>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleBack}
            className='flex items-center gap-2 text-gray-600 hover:text-gray-900'
          >
            <ArrowLeft size={16} />
            Quay lại
          </Button>
          <div className='h-6 w-px bg-gray-300'></div>
          <h1 className='text-2xl font-bold text-gray-900'>Chi tiết sản phẩm</h1>
        </div>
      </motion.div>


      {/* Assign Staff Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <UserPlus size={20} className='text-green-600' />
              <h3 className='text-lg font-semibold text-gray-900'>Gán nhân viên xử lý</h3>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {/* Chỉ hiển thị phần gán nhân viên khi status là Pending hoặc Processing */}
              {product?.status?.toLowerCase() === 'pending' ||
                product?.status?.toLowerCase() === 'processing' ? (
                assignedStaffId ? (
                  <div className='space-y-3'>
                    <div className='flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200'>
                      <User size={20} className='text-green-600' />
                      <div className='flex-1'>
                        <div className='text-sm font-medium text-gray-700 mb-1'>Nhân viên đã được gán:</div>
                        <div className='text-lg font-semibold text-green-900'>
                          {loadingStaff ? 'Đang tải...' : assignedStaffName || assignedStaffId.slice(0, 8) + '...'}
                        </div>
                        {assignedStaffEmail && (
                          <div className='text-sm text-gray-600 mt-1'>
                            <span className='font-medium'>Email:</span> {assignedStaffEmail}
                          </div>
                        )}
                      </div>
                    </div>
                    {product?.staffNote && (
                      <div className='p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
                        <div className='text-sm font-medium text-yellow-800 mb-2'>Ghi chú từ nhân viên:</div>
                        <div className='text-gray-900 whitespace-pre-wrap'>{product.staffNote}</div>
                      </div>
                    )}
                    <Button onClick={handleOpenAssignModal} variant='outline' className='w-full'>
                      <UserPlus size={16} className='mr-2' />
                      Thay đổi nhân viên
                    </Button>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    <div className='p-4 bg-gray-50 rounded-lg border border-gray-200 text-center'>
                      <User size={24} className='text-gray-400 mx-auto mb-2' />
                      <div className='text-sm text-gray-600 mb-3'>Chưa có nhân viên được gán</div>
                    </div>
                    <Button onClick={handleOpenAssignModal} className='w-full bg-green-600 hover:bg-green-700 text-white'>
                      <UserPlus size={16} className='mr-2' />
                      Gán nhân viên
                    </Button>
                  </div>
                )
              ) : (
                <div className='space-y-3'>
                  {assignedStaffId ? (
                    <div className='flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200'>
                      <User size={20} className='text-green-600' />
                      <div className='flex-1'>
                        <div className='text-sm font-medium text-gray-700 mb-1'>Nhân viên đã được gán:</div>
                        <div className='text-lg font-semibold text-green-900'>
                          {loadingStaff ? 'Đang tải...' : assignedStaffName || assignedStaffId.slice(0, 8) + '...'}
                        </div>
                        {assignedStaffEmail && (
                          <div className='text-sm text-gray-600 mt-1'>
                            <span className='font-medium'>Email:</span> {assignedStaffEmail}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className='p-4 bg-gray-50 rounded-lg border border-gray-200 text-center'>
                      <User size={24} className='text-gray-400 mx-auto mb-2' />
                      <div className='text-sm text-gray-600'>Chưa có nhân viên được gán</div>
                    </div>
                  )}
                  {product?.staffNote && (
                    <div className='p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
                      <div className='text-sm font-medium text-yellow-800 mb-2'>Ghi chú từ nhân viên:</div>
                      <div className='text-gray-900 whitespace-pre-wrap'>{product.staffNote}</div>
                    </div>
                  )}
                  <div className='p-3 bg-blue-50 rounded-lg border border-blue-200 text-center'>
                    <div className='text-sm text-blue-800 font-medium'>
                      Sản phẩm đã ở trạng thái{' '}
                      {product?.status === 'Approved'
                        ? 'Đã duyệt'
                        : product?.status === 'Denied'
                          ? 'Từ chối xử lý'
                          : product?.status === 'Confirmed'
                            ? 'Đã xác nhận'
                            : product?.status === 'Rejected'
                              ? 'Từ chối'
                              : product?.status}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
      {/* Store Info Card */}
      {product?.storeId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Store size={20} className='text-blue-600' />
                <h3 className='text-lg font-semibold text-gray-900'>Thông tin cửa hàng</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStore ? (
                <div className='flex items-center justify-center py-4'>
                  <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600'></div>
                </div>
              ) : storeInfo ? (
                <div className='space-y-4'>
                  <div className='flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200'>
                    <Store size={24} className='text-blue-600' />
                    <div className='flex-1'>
                      <div className='text-sm font-medium text-gray-700 mb-1'>Tên cửa hàng:</div>
                      <div className='text-lg font-semibold text-blue-900'>{storeInfo.storeName}</div>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {/* Địa chỉ */}
                    <div className='space-y-2'>
                      <div className='text-sm font-medium text-gray-700'>Địa chỉ:</div>
                      <div className='text-gray-900'>
                        {storeInfo.address && (
                          <div>
                            {storeInfo.address}
                            {storeInfo.ward && `, ${storeInfo.ward}`}
                            {storeInfo.district && `, ${storeInfo.district}`}
                            {storeInfo.province && `, ${storeInfo.province}`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Trạng thái */}
                    <div className='space-y-2'>
                      <div className='text-sm font-medium text-gray-700'>Trạng thái:</div>
                      <div>
                        {storeInfo.status === 'Approved' ? (
                          <Badge className='bg-green-100 text-green-800'>Đã duyệt</Badge>
                        ) : storeInfo.status === 'Pending' || storeInfo.status === 'Processing' ? (
                          <Badge className='bg-yellow-100 text-yellow-800'>Đang xử lý</Badge>
                        ) : storeInfo.status === 'Rejected' ? (
                          <Badge className='bg-red-100 text-red-800'>Từ chối</Badge>
                        ) : (
                          <Badge className='bg-gray-100 text-gray-800'>{storeInfo.status}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Thông tin seller */}
                    {storeInfo.sellerInfo?.userInfo && (
                      <>
                        <div className='space-y-2'>
                          <div className='text-sm font-medium text-gray-700'>Người bán:</div>
                          <div className='text-gray-900'>
                            {`${storeInfo.sellerInfo.userInfo.firstName || ''} ${storeInfo.sellerInfo.userInfo.lastName || ''}`.trim() || 'Chưa có thông tin'}
                          </div>
                        </div>

                        <div className='space-y-2'>
                          <div className='text-sm font-medium text-gray-700'>Email:</div>
                          <div className='text-gray-900'>{storeInfo.sellerInfo.userInfo.email}</div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Mô tả cửa hàng */}
                  {storeInfo.description && (
                    <div className='space-y-2'>
                      <div className='text-sm font-medium text-gray-700'>Mô tả:</div>
                      <div className='text-gray-900 whitespace-pre-wrap'>{storeInfo.description}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className='text-center py-4 text-gray-500'>Không thể tải thông tin cửa hàng</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Tabs defaultValue='info' className='w-full'>
          <TabsList className='mb-6'>
            <TabsTrigger value='info'>Thông tin sản phẩm</TabsTrigger>
            <TabsTrigger value='certificates'>Chứng nhận</TabsTrigger>
            <TabsTrigger value='story'>Câu chuyện</TabsTrigger>
          </TabsList>

          {/* Tab 1: Thông tin sản phẩm */}
          <TabsContent value='info' className='space-y-6'>
            {/* Product Images - Full Width Horizontal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Card className='shadow-lg'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <ImageIcon size={20} className='text-green-600' />
                    Hình ảnh sản phẩm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Product Image Gallery - Using Carousel for Better Preview */}
                  {/* Ensure productImages is array from BE */}
                  {product?.productImages &&
                    Array.isArray(product.productImages) &&
                    product.productImages.length > 0 ? (
                    <div className='space-y-4'>
                      {/* Product Image Carousel */}
                      <div className='relative'>
                        <ProductImageCarousel
                          images={product.productImages}
                          productName={product.name}
                          height='450px'
                        />
                        {/* Fullscreen Preview Button */}
                        <button
                          onClick={() => handleImagePreview(product.productImages[0], product.productImages, 0)}
                          className='absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-3 transition-all flex items-center gap-2 shadow-lg'
                          title='Xem ảnh lớn'
                        >
                          <Maximize2 className='w-5 h-5' />
                          <span className='text-sm font-medium hidden sm:inline'>Xem lớn</span>
                        </button>
                      </div>
                      <p className='text-xs text-gray-500 text-center'>
                        Kéo hoặc dùng nút để xem các ảnh khác | Click nút "Xem lớn" để xem fullscreen ({product.productImages.length} ảnh)
                      </p>
                    </div>
                  ) : (
                    <div className='w-full h-[350px] flex items-center justify-center bg-gray-100 rounded-lg'>
                      <ImageIcon size={48} className='text-gray-400' />
                      <span className='ml-2 text-gray-500 text-sm'>Không có hình ảnh từ server</span>
                    </div>
                  )}

                  {/* Product Video */}
                  {(() => {
                    const { video, videoId, videoSources } = product
                      ? processProductVideo(product)
                      : { video: '', videoId: undefined, videoSources: undefined }

                    if (!video) return null

                    return (
                      <div className='mt-6'>
                        <div className='flex items-center gap-2 mb-2'>
                          <Play size={16} className='text-green-600' />
                          <span className='text-sm font-medium text-gray-700'>Video sản phẩm</span>
                        </div>
                        <div className='flex justify-center bg-gray-100 rounded-lg overflow-hidden p-4'>
                          {/* Use Cloudflare Stream component if video ID is available */}
                          {videoId ? (
                            <div className='w-full max-w-2xl rounded-lg overflow-hidden'>
                              <Stream
                                src={videoId}
                                controls
                                responsive
                                className='w-full'
                                preload='metadata'
                              />
                            </div>
                          ) : (
                            /* Fallback to regular video tag if no video ID */
                            <video
                              controls
                              className='w-full max-w-2xl rounded-lg'
                              poster={product.productImages?.[0]}
                              preload='metadata'
                              playsInline
                            >
                              {/* Priority: Preview (for compatibility) > HLS > DASH > Fallback > Direct URL */}
                              {/* Preview URL first - works on all browsers, including those without HLS/DASH support */}
                              {videoSources?.preview && (
                                <source src={videoSources.preview} type='video/mp4' />
                              )}
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
                                  !videoSources.fallback)) && (
                                  <source src={video} type='video/mp4' />
                                )}
                              Trình duyệt của bạn không hỗ trợ video.
                            </video>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </motion.div>

            <div className='space-y-6'>
              {/* Basic Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <Card className='shadow-lg'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Package size={20} className='text-green-600' />
                      Thông tin cơ bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                      {/* Left Column */}
                      <div className='space-y-4'>
                        <div>
                          <h2 className='text-2xl font-bold text-gray-900 mb-3'>{product?.name}</h2>
                          <div className='flex flex-wrap items-center gap-4 mb-4'>
                            {product && getStatusBadge(product.status, product.isActive)}
                            <div className='flex items-center gap-1'>
                              <Star className='text-yellow-500 fill-current' size={16} />
                              <span className='font-medium'>{product?.rating?.toFixed(1) || '0.0'}</span>
                              <span className='text-gray-600'>({product?.reviewCount || 0} đánh giá)</span>
                            </div>
                            <div className='flex items-center gap-1'>
                              <Eye size={16} className='text-gray-500' />
                              <span className='text-gray-600'>{product?.saleCount || 0} lượt bán</span>
                            </div>
                          </div>
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                          <div className='flex items-center gap-2'>
                            <Tag size={16} className='text-green-600 flex-shrink-0' />
                            <div>
                              <span className='text-sm text-gray-600 block'>Loại sản phẩm</span>
                              <span className='text-sm font-medium text-gray-900'>{getProductTypeLabel(product?.typeProduct)}</span>
                            </div>
                          </div>
                          <div className='flex items-center gap-2'>
                            <MapPin size={16} className='text-green-600 flex-shrink-0' />
                            <div>
                              <span className='text-sm text-gray-600 block'>Xuất xứ</span>
                              <span className='text-sm font-medium text-gray-900'>{product?.material}</span>
                            </div>
                          </div>
                          <div className='flex items-center gap-2'>
                            <FileText size={16} className='text-green-600 flex-shrink-0' />
                            <div>
                              <span className='text-sm text-gray-600 block'>Tỉnh/Thành phố</span>
                              <span className='text-sm font-medium text-gray-900'>{product?.provinceName}</span>
                            </div>
                          </div>
                          {(() => {
                            const highestCategory = getHighestLevelCategory(product?.productCategories)
                            return highestCategory ? (
                              <div className='flex items-center gap-2'>
                                <Layers size={16} className='text-green-600 flex-shrink-0' />
                                <div>
                                  <span className='text-sm text-gray-600 block'>Danh mục</span>
                                  <Badge
                                    variant='outline'
                                    className='bg-green-50 text-green-700 border-green-200 hover:bg-green-100 text-xs'
                                  >
                                    {highestCategory.name}
                                  </Badge>
                                </div>
                              </div>
                            ) : null
                          })()}
                        </div>

                        {/* Hashtags */}
                        {hashtags.length > 0 && (
                          <div className='pt-4 border-t'>
                            <div className='flex items-center gap-2 mb-2'>
                              <Hash size={16} className='text-green-600 flex-shrink-0' />
                              <span className='text-sm text-gray-600 font-medium'>Hashtags</span>
                            </div>
                            <div className='flex flex-wrap gap-2'>
                              {loadingHashtags ? (
                                <div className='flex items-center gap-2 text-sm text-gray-500'>
                                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-green-600'></div>
                                  <span>Đang tải hashtags...</span>
                                </div>
                              ) : (
                                hashtags.map((hashtag) => (
                                  <Badge
                                    key={hashtag.id}
                                    variant='outline'
                                    className='bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200 hover:bg-green-100 text-xs'
                                  >
                                    <Hash size={12} className='mr-1' />
                                    {hashtag.name}
                                    {hashtag.usageCount !== undefined && (
                                      <span className='ml-1 text-gray-500'>
                                        ({hashtag.usageCount >= 1000
                                          ? `${(hashtag.usageCount / 1000).toFixed(1)}K`
                                          : hashtag.usageCount})
                                      </span>
                                    )}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </div>
                        )}

                        {/* Summary Price */}
                        {product?.summaryPrice && (
                          <div className='pt-4 border-t'>
                            <span className='text-sm text-gray-600 block mb-1'>Tóm tắt giá</span>
                            <p className='text-2xl font-bold text-green-600'>{product.summaryPrice}</p>
                          </div>
                        )}
                      </div>

                      {/* Right Column */}
                      <div className='space-y-4'>
                        <div>
                          <h3 className='text-lg font-semibold text-gray-900 mb-2'>Mô tả sản phẩm</h3>
                          <p className='text-gray-700 leading-relaxed'>{product?.description}</p>
                        </div>

                        {product?.staffNote && (
                          <div>
                            <h3 className='text-lg font-semibold text-gray-900 mb-2'>Ghi chú từ staff</h3>
                            <p className='text-gray-700 leading-relaxed'>{product.staffNote}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Certificates */}
              {product?.productCertificateDTOs && product.productCertificateDTOs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  <Card className='shadow-lg'>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <Award size={20} className='text-green-600' />
                        Chứng nhận sản phẩm
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-4'>
                        {product.productCertificateDTOs.map((certificate) => (
                          <div key={certificate.id} className='border border-gray-200 rounded-lg p-4'>
                            <div className='flex items-start justify-between mb-3'>
                              <div className='flex items-center gap-2'>
                                <Award size={16} className='text-green-600' />
                                <span className='font-medium text-gray-900'>Chứng nhận #{certificate.id.slice(0, 8)}</span>
                              </div>
                              {getCertificateStatusBadge(certificate.status)}
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-3'>
                              <div>
                                <span className='text-sm text-gray-600'>Ngày nộp:</span>
                                <p className='font-medium'>{formatDate(certificate.submittedDate)}</p>
                              </div>
                              <div>
                                <span className='text-sm text-gray-600'>Ngày quyết định:</span>
                                <p className='font-medium'>{formatDate(certificate.decisionDate)}</p>
                              </div>
                            </div>

                            {certificate.staffNotes && (
                              <div className='mb-3'>
                                <span className='text-sm text-gray-600'>Ghi chú từ staff:</span>
                                <p className='text-gray-900'>{certificate.staffNotes}</p>
                              </div>
                            )}

                            {certificate.imageUrl && (
                              <div>
                                <span className='text-sm text-gray-600 block mb-2'>Hình ảnh chứng nhận:</span>
                                <div
                                  className='relative w-full max-w-md h-64 bg-gray-100 rounded-lg overflow-hidden cursor-pointer group hover:ring-2 ring-green-500 transition-all'
                                  onClick={() => handleImagePreview(certificate.imageUrl!)}
                                >
                                  <img
                                    src={certificate.imageUrl}
                                    alt='Chứng nhận'
                                    className='w-full h-full object-contain transition-transform duration-300 group-hover:scale-105'
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.src = '/placeholder-image.png'
                                    }}
                                  />
                                  <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 flex items-center justify-center'>
                                    <div className='opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 text-white'>
                                      <ZoomIn className='w-6 h-6' />
                                      <span className='text-sm font-medium'>Click để xem lớn</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Statistics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
              >
                <Card className='shadow-lg'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Star size={20} className='text-green-600' />
                      Thống kê
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <div className='text-center p-4 bg-green-50 rounded-lg'>
                        <div className='text-2xl font-bold text-green-600'>{product?.saleCount || 0}</div>
                        <div className='text-sm text-gray-600'>Lượt bán</div>
                      </div>
                      <div className='text-center p-4 bg-yellow-50 rounded-lg'>
                        <div className='text-2xl font-bold text-yellow-600'>{product?.rating?.toFixed(1) || '0.0'}</div>
                        <div className='text-sm text-gray-600'>Đánh giá trung bình</div>
                      </div>
                      <div className='text-center p-4 bg-blue-50 rounded-lg'>
                        <div className='text-2xl font-bold text-blue-600'>{product?.reviewCount || 0}</div>
                        <div className='text-sm text-gray-600'>Số lượt đánh giá</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* No variants message */}
            {parentVariants.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              >
                <Card className='shadow-lg'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-green-700'>
                      <Archive size={20} />
                      Loại sản phẩm
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-center py-8 text-gray-500'>
                      <Archive size={48} className='mx-auto mb-4 text-gray-400' />
                      <p>Chưa có product variant.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Variants Display */}
            {parentVariants.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              >
                <Card className='shadow-lg'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-green-700'>
                      <Archive size={20} />
                      Loại sản phẩm
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-6'>
                      {parentVariants.map((parentVariant, index) => {
                        const attributeType = getAttributeTypeForVariant(parentVariant)
                        const hasChildren = hasChildVariants(parentVariant)
                        const childVariants = getChildVariants(parentVariant)

                        return (
                          <motion.div
                            key={parentVariant.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                            className='border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white'
                          >
                            {/* Variant Cha Header */}
                            <div className='mb-4 pb-4 border-b border-gray-200'>
                              <h3 className='text-lg font-semibold text-gray-900 mb-4'>Biến thể sản phẩm</h3>
                              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                {/* Attribute Type */}
                                {attributeType && (
                                  <div className='space-y-2'>
                                    <label className='text-sm font-medium text-gray-700'>Loại thuộc tính</label>
                                    <div className='p-3 bg-gray-50 rounded-lg border'>
                                      <span className='text-gray-900 font-medium'>{attributeType}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Attribute Name */}
                                {parentVariant.attributeName && (
                                  <div className='space-y-2'>
                                    <label className='text-sm font-medium text-gray-700'>Tên thuộc tính</label>
                                    <div className='p-3 bg-gray-50 rounded-lg border'>
                                      <span className='text-gray-900 font-medium'>{parentVariant.attributeName}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Variant Name */}
                                <div className='space-y-2'>
                                  <label className='text-sm font-medium text-gray-700'>Tên loại sản phẩm</label>
                                  <div className='p-3 bg-gray-50 rounded-lg border'>
                                    <span className='text-gray-900 font-medium'>{parentVariant.name}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Description */}
                              {parentVariant.description && (
                                <div className='mt-4 space-y-2'>
                                  <label className='text-sm font-medium text-gray-700'>Mô tả</label>
                                  <div className='p-3 bg-gray-50 rounded-lg border'>
                                    <span className='text-gray-700'>{parentVariant.description}</span>
                                  </div>
                                </div>
                              )}

                              {/* Images */}
                              {parentVariant.productImages &&
                                Array.isArray(parentVariant.productImages) &&
                                parentVariant.productImages.length > 0 &&
                                parentVariant.productImages.some((img) => img && img.trim() !== '') && (
                                  <div className='mt-4 space-y-2'>
                                    <label className='text-sm font-medium text-gray-700'>
                                      Hình ảnh (
                                      {parentVariant.productImages.filter((img) => img && img.trim() !== '').length})
                                    </label>
                                    <div className='grid grid-cols-3 md:grid-cols-4 gap-2'>
                                      {parentVariant.productImages
                                        .filter((img) => img && img.trim() !== '')
                                        .map((image, idx) => (
                                          <div
                                            key={idx}
                                            className='relative aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer group hover:ring-2 ring-green-500 transition-all bg-gray-100'
                                            onClick={() => {
                                              const validImages = (parentVariant.productImages || []).filter(
                                                (img) => img && img.trim() !== ''
                                              )
                                              handleImagePreview(image, validImages, validImages.indexOf(image))
                                            }}
                                          >
                                            <img
                                              src={image}
                                              alt={`${parentVariant.name} ${idx + 1}`}
                                              className='block w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 bg-white'
                                              loading='lazy'
                                              onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.src = '/placeholder-image.png'
                                                target.onerror = null // Prevent infinite loop
                                              }}
                                            />
                                            <div className='absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-opacity duration-300 flex items-center justify-center pointer-events-none'>
                                              <ZoomIn className='w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}

                              {/* SKU Details - Chỉ hiển thị nếu KHÔNG có variant con */}
                              {!hasChildren && (
                                <div className='mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                  {/* Price */}
                                  {parentVariant.finalPrice !== null && (
                                    <div className='space-y-2'>
                                      <label className='text-sm font-medium text-gray-700 flex items-center gap-1'>
                                        <span className='text-green-600 font-bold'>đ</span>
                                        Giá bán (đ)
                                      </label>
                                      <div className='p-3 bg-gray-50 rounded-lg border'>
                                        <span className='text-green-600 font-bold'>
                                          {parentVariant.finalPrice.toLocaleString('vi-VN')} đ
                                        </span>
                                        {parentVariant.basePrice !== null &&
                                          parentVariant.basePrice !== parentVariant.finalPrice && (
                                            <span className='ml-2 text-sm text-gray-500 line-through'>
                                              {parentVariant.basePrice.toLocaleString('vi-VN')} đ
                                            </span>
                                          )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Stock */}
                                  {parentVariant.quantity !== null && (
                                    <div className='space-y-2'>
                                      <label className='text-sm font-medium text-gray-700 flex items-center gap-1'>
                                        <Package size={14} />
                                        Số lượng tồn kho
                                      </label>
                                      <div className='p-3 bg-gray-50 rounded-lg border'>
                                        <span
                                          className={`font-medium ${parentVariant.quantity > 20 ? 'text-green-600' : parentVariant.quantity > 10 ? 'text-yellow-600' : 'text-red-600'}`}
                                        >
                                          {parentVariant.quantity} sản phẩm
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Weight */}
                                  {parentVariant.weight !== null && (
                                    <div className='space-y-2'>
                                      <label className='text-sm font-medium text-gray-700'>Trọng lượng (g)</label>
                                      <div className='p-3 bg-gray-50 rounded-lg border'>
                                        <span className='text-gray-900'>{parentVariant.weight}g</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Dimensions */}
                                  {parentVariant.length !== null &&
                                    parentVariant.width !== null &&
                                    parentVariant.height !== null && (
                                      <div className='space-y-2'>
                                        <label className='text-sm font-medium text-gray-700'>Kích thước (cm)</label>
                                        <div className='p-3 bg-gray-50 rounded-lg border'>
                                          <span className='text-gray-900'>
                                            {parentVariant.length}x{parentVariant.width}x{parentVariant.height} cm
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                </div>
                              )}

                              {/* Stock Status Indicator - Chỉ hiển thị nếu KHÔNG có variant con */}
                              {!hasChildren && parentVariant.quantity !== null && (
                                <div className='mt-4 pt-4 border-t border-gray-200'>
                                  <div className='flex items-center justify-between'>
                                    <span className='text-sm text-gray-600'>Trạng thái kho:</span>
                                    <Badge
                                      className={
                                        parentVariant.quantity > 20
                                          ? 'bg-green-100 text-green-800'
                                          : parentVariant.quantity > 10
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                      }
                                    >
                                      {parentVariant.quantity > 20
                                        ? 'Còn nhiều'
                                        : parentVariant.quantity > 10
                                          ? 'Sắp hết'
                                          : 'Ít hàng'}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* ChevronDown để expand/collapse variant con */}
                            {hasChildren && childVariants.length > 0 && (
                              <div className='mt-4 pt-4 border-t border-gray-200'>
                                <button
                                  onClick={() => toggleVariantExpanded(parentVariant.id)}
                                  className='w-full flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-green-600 transition-colors cursor-pointer'
                                >
                                  <span className='text-sm font-medium'>
                                    {expandedVariants.has(parentVariant.id) ? 'Variant con' : 'Variant con'} ({childVariants.length})
                                  </span>
                                  <motion.div
                                    animate={{ rotate: expandedVariants.has(parentVariant.id) ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <ChevronDown size={20} className='text-gray-500' />
                                  </motion.div>
                                </button>
                              </div>
                            )}

                            {/* Variant Con - Hiển thị nếu có và đã expand */}
                            <AnimatePresence>
                              {hasChildren && childVariants.length > 0 && expandedVariants.has(parentVariant.id) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                                  className='mt-4 space-y-4 overflow-hidden'
                                >
                                  <div className='flex items-center gap-2 mb-3'>
                                    <div className='h-px flex-1 bg-gray-200'></div>
                                  </div>
                                  <div className='space-y-3 pl-4 border-l-2 border-green-200'>
                                    {childVariants.map((childVariant) => (
                                      <div
                                        key={childVariant.id}
                                        className='border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors'
                                      >
                                        <h4 className='text-sm font-semibold text-gray-700 mb-3'>Variant con</h4>
                                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                          {/* Child Variant Name */}
                                          <div className='space-y-2'>
                                            <label className='text-sm font-medium text-gray-700'>Tên variant con</label>
                                            <div className='p-2 bg-white rounded border'>
                                              <span className='text-gray-900 text-sm'>{childVariant.name}</span>
                                            </div>
                                          </div>

                                          {/* Child Attribute Name */}
                                          {childVariant.attributeName && (
                                            <div className='space-y-2'>
                                              <label className='text-sm font-medium text-gray-700'>Tên thuộc tính</label>
                                              <div className='p-2 bg-white rounded border'>
                                                <span className='text-gray-900 text-sm'>{childVariant.attributeName}</span>
                                              </div>
                                            </div>
                                          )}

                                          {/* Child Price */}
                                          {childVariant.finalPrice !== null && (
                                            <div className='space-y-2'>
                                              <label className='text-sm font-medium text-gray-700'>
                                                Giá bán (đ)
                                              </label>
                                              <div className='p-2 bg-white rounded border'>
                                                <span className='text-green-600 font-bold text-sm'>
                                                  {childVariant.finalPrice.toLocaleString('vi-VN')} đ
                                                </span>
                                                {childVariant.basePrice !== null &&
                                                  childVariant.basePrice !== childVariant.finalPrice && (
                                                    <span className='ml-2 text-xs text-gray-500 line-through'>
                                                      {childVariant.basePrice.toLocaleString('vi-VN')} đ
                                                    </span>
                                                  )}
                                              </div>
                                            </div>
                                          )}

                                          {/* Child Stock */}
                                          {childVariant.quantity !== null && (
                                            <div className='space-y-2'>
                                              <label className='text-sm font-medium text-gray-700 flex items-center gap-1'>
                                                <Package size={14} />
                                                Số lượng tồn kho
                                              </label>
                                              <div className='p-2 bg-white rounded border'>
                                                <span
                                                  className={`text-sm font-medium ${childVariant.quantity > 20 ? 'text-green-600' : childVariant.quantity > 10 ? 'text-yellow-600' : 'text-red-600'}`}
                                                >
                                                  {childVariant.quantity} sản phẩm
                                                </span>
                                              </div>
                                            </div>
                                          )}

                                          {/* Child Weight */}
                                          {childVariant.weight !== null && (
                                            <div className='space-y-2'>
                                              <label className='text-sm font-medium text-gray-700'>Trọng lượng (g)</label>
                                              <div className='p-2 bg-white rounded border'>
                                                <span className='text-gray-900 text-sm'>{childVariant.weight}g</span>
                                              </div>
                                            </div>
                                          )}

                                          {/* Child Dimensions */}
                                          {childVariant.length !== null &&
                                            childVariant.width !== null &&
                                            childVariant.height !== null && (
                                              <div className='space-y-2'>
                                                <label className='text-sm font-medium text-gray-700'>Kích thước (cm)</label>
                                                <div className='p-2 bg-white rounded border'>
                                                  <span className='text-gray-900 text-sm'>
                                                    {childVariant.length}x{childVariant.width}x{childVariant.height} cm
                                                  </span>
                                                </div>
                                              </div>
                                            )}

                                          {/* Child Images */}
                                          {childVariant.productImages &&
                                            Array.isArray(childVariant.productImages) &&
                                            childVariant.productImages.length > 0 &&
                                            childVariant.productImages.some((img) => img && img.trim() !== '') && (
                                              <div className='space-y-2 md:col-span-2 lg:col-span-3'>
                                                <label className='text-sm font-medium text-gray-700'>
                                                  Hình ảnh (
                                                  {
                                                    childVariant.productImages.filter(
                                                      (img) => img && img.trim() !== ''
                                                    ).length
                                                  }
                                                  )
                                                </label>
                                                <div className='grid grid-cols-4 md:grid-cols-6 gap-2'>
                                                  {childVariant.productImages
                                                    .filter((img) => img && img.trim() !== '')
                                                    .map((image, idx) => (
                                                      <div
                                                        key={idx}
                                                        className='relative aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer group hover:ring-2 ring-green-500 transition-all bg-gray-100'
                                                        onClick={() => {
                                                          const validImages = (childVariant.productImages || []).filter(
                                                            (img) => img && img.trim() !== ''
                                                          )
                                                          handleImagePreview(
                                                            image,
                                                            validImages,
                                                            validImages.indexOf(image)
                                                          )
                                                        }}
                                                      >
                                                        <img
                                                          src={image}
                                                          alt={`${childVariant.name} ${idx + 1}`}
                                                          className='block w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 bg-white'
                                                          loading='lazy'
                                                          onError={(e) => {
                                                            const target = e.target as HTMLImageElement
                                                            target.src = '/placeholder-image.png'
                                                            target.onerror = null // Prevent infinite loop
                                                          }}
                                                        />
                                                        <div className='absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-opacity duration-300 flex items-center justify-center pointer-events-none'>
                                                          <ZoomIn className='w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                                                        </div>
                                                      </div>
                                                    ))}
                                                </div>
                                              </div>
                                            )}
                                        </div>

                                        {/* Child Stock Status */}
                                        {childVariant.quantity !== null && (
                                          <div className='mt-3 pt-3 border-t border-gray-200'>
                                            <div className='flex items-center justify-between'>
                                              <span className='text-xs text-gray-600'>Trạng thái kho:</span>
                                              <Badge
                                                className={
                                                  childVariant.quantity > 20
                                                    ? 'bg-green-100 text-green-800 text-xs'
                                                    : childVariant.quantity > 10
                                                      ? 'bg-yellow-100 text-yellow-800 text-xs'
                                                      : 'bg-red-100 text-red-800 text-xs'
                                                }
                                              >
                                                {childVariant.quantity > 20
                                                  ? 'Còn nhiều'
                                                  : childVariant.quantity > 10
                                                    ? 'Sắp hết'
                                                    : 'Ít hàng'}
                                              </Badge>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                          </motion.div>
                        )
                      })}
                    </div>

                    {/* Summary */}
                    {parentVariants.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 1.0 + parentVariants.length * 0.1 }}
                        className='mt-6 p-4 bg-green-50 rounded-lg border border-green-200'
                      >
                        <h3 className='text-lg font-semibold text-green-800 mb-2'>Tổng quan</h3>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                          <div>
                            <span className='text-green-700 font-medium'>Tổng số nhóm</span>
                            <span className='ml-2 text-green-900'>{parentVariants.length}</span>
                          </div>
                          <div>
                            <span className='text-green-700 font-medium'>Tổng tồn kho:</span>
                            <span className='ml-2 text-green-900'>
                              {(() => {
                                let total = 0
                                parentVariants.forEach((pv) => {
                                  if (hasChildVariants(pv)) {
                                    const children = getChildVariants(pv)
                                    total += children.reduce((sum, cv) => sum + (cv.quantity || 0), 0)
                                  } else {
                                    total += pv.quantity || 0
                                  }
                                })
                                return `${total} sản phẩm`
                              })()}
                            </span>
                          </div>
                          <div>
                            <span className='text-green-700 font-medium'>Giá từ:</span>
                            <span className='ml-2 text-green-900'>
                              {(() => {
                                const prices: number[] = []
                                parentVariants.forEach((pv) => {
                                  if (hasChildVariants(pv)) {
                                    const children = getChildVariants(pv)
                                    children.forEach((cv) => {
                                      if (cv.finalPrice !== null) prices.push(cv.finalPrice)
                                    })
                                  } else {
                                    if (pv.finalPrice !== null) prices.push(pv.finalPrice)
                                  }
                                })
                                return prices.length > 0
                                  ? `${Math.min(...prices).toLocaleString('vi-VN')} - ${Math.max(...prices).toLocaleString('vi-VN')} đ`
                                  : 'Chưa có giá'
                              })()}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Tab 2: Chứng nhận */}
          <TabsContent value='certificates' className='space-y-6'>
            {id && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ProductCertificate productId={id} />
              </motion.div>
            )}
          </TabsContent>

          {/* Tab 3: Câu chuyện */}
          <TabsContent value='story' className='space-y-6'>
            {id && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ProductStoryComponent productId={id} />
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Assign Staff Modal */}
      <Dialog open={showAssignModal} onOpenChange={handleCloseAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gán nhân viên xử lý</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div>
              <Label htmlFor='staff-select' className='text-sm font-medium'>
                Chọn nhân viên
              </Label>
              {loadingStaffList ? (
                <div className='mt-2 flex items-center justify-center py-4 border border-gray-300 rounded-lg'>
                  <span className='text-sm text-gray-500'>Đang tải danh sách nhân viên...</span>
                </div>
              ) : (
                <div className='mt-2'>
                  <StaffComboBox
                    options={staffList}
                    placeholder='Chọn nhân viên xử lý...'
                    value={selectedStaffId}
                    onSelect={(staffId: string | null) => setSelectedStaffId(staffId || '')}
                    disabled={assigning}
                  />
                </div>
              )}
              {staffList.length > 0 && !loadingStaffList && (
                <p className='text-xs text-gray-500 mt-1'>Tìm thấy {staffList.length} nhân viên</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <UIButton variant='outline' onClick={handleCloseAssignModal} disabled={assigning}>
              Hủy
            </UIButton>
            <UIButton
              onClick={handleAssignStaff}
              disabled={!selectedStaffId || assigning}
              className='bg-green-600 hover:bg-green-700 text-white'
            >
              {assigning ? 'Đang gán...' : 'Xác nhận'}
            </UIButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Modal */}
      <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'Confirmed' && 'Chấp nhận xử lý'}
              {actionType === 'Rejected' && 'Từ chối xử lý'}
              {actionType === 'Approved' && 'Chấp nhận sản phẩm'}
              {actionType === 'Denied' && 'Từ chối sản phẩm'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div>
              <Label htmlFor='action-note'>Ghi chú (tùy chọn)</Label>
              <Textarea
                id='action-note'
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder='Nhập ghi chú cho hành động này...'
                className='mt-2 min-h-[100px]'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setShowActionModal(false)
                setActionNote('')
                setActionType(null)
              }}
              disabled={processingAction}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={processingAction}
              className={
                actionType === 'Rejected' || actionType === 'Denied'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }
            >
              {processingAction ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={imagePreviewOpen}
        onClose={handleCloseImagePreview}
        images={previewImages}
        initialIndex={previewInitialIndex}
        alt={product?.name || 'Hình ảnh sản phẩm'}
      />
    </motion.div>
  )
}

export default DetailProductAdmin
