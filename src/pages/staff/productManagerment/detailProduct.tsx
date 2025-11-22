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
  DollarSign,
  Layers,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ZoomIn,
  Maximize2
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import type { Product, VariantGroup, VariantOption } from '../../../types/productType'
import { productApi } from '../../../apis/product.api'
import { staffApi } from '../../../apis/staff.api'
import { toast } from '../../../utils/toast'
import ProductCertificate from './productCertificate'
import ProductStoryComponent from './productStory'
import ProductImageCarousel from '../../../components/ui/product-image-carousel'
import ImagePreviewModal from '../../../components/ui/image-preview-modal'
import { motion, AnimatePresence } from 'motion/react'

function DetailProductStaff() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  // States for expanded variants (collapse/expand)
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set())

  // States for action modal
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'Confirmed' | 'Rejected' | 'Approved' | 'Denied' | null>(null)
  const [actionNote, setActionNote] = useState('')
  const [processingAction, setProcessingAction] = useState(false)

  // States for image preview
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0)

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

  // Helper function to get Vietnamese status text
  const getStatusText = (status: string, isActive: boolean): string => {
    if (!isActive) {
      return 'Tạm dừng'
    }

    switch (status?.toLowerCase()) {
      case 'draft':
        return 'Nháp'
      case 'pending':
        return 'Chờ duyệt'
      case 'processing':
        return 'Đang xử lý'
      case 'confirmed':
        return 'Đã xác nhận'
      case 'approved':
        return 'Đã duyệt'
      case 'rejected':
        return 'Từ chối'
      case 'denied':
        return 'Bị từ chối'
      case 'cancelled':
        return 'Đã hủy'
      default:
        return 'Không xác định'
    }
  }

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge className='bg-red-100 text-red-800'>Tạm dừng</Badge>
    }

    switch (status?.toLowerCase()) {
      case 'draft':
        return <Badge className='bg-gray-100 text-gray-800'>Nháp</Badge>
      case 'pending':
        return <Badge className='bg-yellow-100 text-yellow-800'>Chờ duyệt</Badge>
      case 'processing':
        return <Badge className='bg-yellow-100 text-yellow-800'>Đang xử lý</Badge>
      case 'confirmed':
        return <Badge className='bg-yellow-100 text-yellow-800'>Đã xác nhận</Badge>
      case 'approved':
        return <Badge className='bg-green-100 text-green-800'>Đã duyệt</Badge>
      case 'rejected':
        return <Badge className='bg-red-100 text-red-800'>Từ chối</Badge>
      case 'denied':
        return <Badge className='bg-red-100 text-red-800'>Bị từ chối</Badge>
      case 'cancelled':
        return <Badge className='bg-gray-100 text-gray-800'>Đã hủy</Badge>
      default:
        return <Badge className='bg-gray-100 text-gray-800'>Không xác định</Badge>
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
        return <Badge className='bg-gray-100 text-gray-800'>Không xác định</Badge>
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

  // Handle action button click
  const handleActionClick = (type: 'Confirmed' | 'Rejected' | 'Approved' | 'Denied') => {
    setActionType(type)
    setActionNote('')
    setShowActionModal(true)
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

  // Check if product status is Pending, Processing, or Rejected - can be processed
  const canProcess = () => {
    if (!product) return false
    const status = product.status?.toLowerCase()
    return status === 'pending' || status === 'processing' || status === 'rejected'
  }

  // Check if product status is Confirmed
  const isConfirmed = () => {
    if (!product) return false
    return product.status?.toLowerCase() === 'confirmed'
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
      {/* Action Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>
              <h3 className='text-lg font-semibold text-gray-900'>Hành động</h3>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {/* Show initial actions if status is Pending or Rejected */}
              {canProcess() && (
                <div className='flex flex-wrap gap-3'>
                  <Button
                    onClick={() => handleActionClick('Confirmed')}
                    className='bg-green-600 hover:bg-green-700 text-white'
                    size='lg'
                  >
                    <CheckCircle className='w-5 h-5 mr-2' />
                    Tiếp nhận xử lý
                  </Button>
                  <Button
                    onClick={() => handleActionClick('Rejected')}
                    variant='destructive'
                    size='lg'
                    className='bg-red-600 hover:bg-red-700'
                  >
                    <XCircle className='w-5 h-5 mr-2' />
                    Từ chối xử lý
                  </Button>
                </div>
              )}

              {/* Show final actions if status is Confirmed */}
              {isConfirmed() && (
                <div className='flex flex-wrap gap-3'>
                  <Button
                    onClick={() => handleActionClick('Approved')}
                    className='bg-green-600 hover:bg-green-700 text-white'
                    size='lg'
                  >
                    <CheckCircle className='w-5 h-5 mr-2' />
                    Duyệt sản phẩm
                  </Button>
                  <Button
                    onClick={() => handleActionClick('Denied')}
                    variant='destructive'
                    size='lg'
                    className='bg-red-600 hover:bg-red-700'
                  >
                    <XCircle className='w-5 h-5 mr-2' />
                    Từ chối Duyệt sản phẩm
                  </Button>
                </div>
              )}

              {/* Show message if already processed */}
              {!canProcess() && !isConfirmed() && (
                <div className='flex items-center gap-2 text-gray-600'>
                  <AlertCircle className='w-5 h-5' />
                  <span>
                    Sản phẩm đã được xử lý. Trạng thái hiện tại:{' '}
                    <strong>{product ? getStatusText(product.status, product.isActive) : 'Không xác định'}</strong>
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
                  {product?.productVideo && (
                    <div className='mt-6'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Play size={16} className='text-green-600' />
                        <span className='text-sm font-medium text-gray-700'>Video sản phẩm</span>
                      </div>
                      <div className='h-[350px] bg-gray-100 rounded-lg overflow-hidden'>
                        <video controls className='w-full h-full' poster={product.productImages?.[0]}>
                          <source src={product.productVideo} type='video/mp4' />
                          Trình duyệt của bạn không hỗ trợ video.
                        </video>
                      </div>
                    </div>
                  )}
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
                              <span className='text-sm font-medium text-gray-900'>{product?.typeProduct}</span>
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
                              <span className='text-sm text-gray-600 block'>Mã tỉnh</span>
                              <span className='text-sm font-medium text-gray-900'>{product?.provinceId}</span>
                            </div>
                          </div>
                          {product?.productCategories && (
                            <div className='flex items-center gap-2'>
                              <Layers size={16} className='text-green-600 flex-shrink-0' />
                              <div>
                                <span className='text-sm text-gray-600 block'>Danh mục</span>
                                <Badge
                                  variant='outline'
                                  className='bg-green-50 text-green-700 border-green-200 hover:bg-green-100 text-xs'
                                >
                                  {product.productCategories.name}
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>

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
                              <h3 className='text-lg font-semibold text-gray-900 mb-4'>Variant cha</h3>
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
                              {parentVariant.productImages && parentVariant.productImages.length > 0 && (
                                <div className='mt-4 space-y-2'>
                                  <label className='text-sm font-medium text-gray-700'>Hình ảnh</label>
                                  <div className='flex gap-2 flex-wrap'>
                                    {parentVariant.productImages.map((image, idx) => (
                                      <div key={idx} className='w-20 h-20 rounded-lg overflow-hidden border border-gray-200'>
                                        <img
                                          src={image}
                                          alt={`${parentVariant.name} ${idx + 1}`}
                                          className='w-full h-full object-cover'
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.src = '/placeholder-image.png'
                                          }}
                                        />
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
                                        <DollarSign size={14} />
                                        Giá bán (VNĐ)
                                      </label>
                                      <div className='p-3 bg-gray-50 rounded-lg border'>
                                        <span className='text-green-600 font-bold'>
                                          {parentVariant.finalPrice.toLocaleString('vi-VN')} VNĐ
                                        </span>
                                        {parentVariant.basePrice !== null &&
                                          parentVariant.basePrice !== parentVariant.finalPrice && (
                                            <span className='ml-2 text-sm text-gray-500 line-through'>
                                              {parentVariant.basePrice.toLocaleString('vi-VN')} VNĐ
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
                                              <label className='text-sm font-medium text-gray-700 flex items-center gap-1'>
                                                <DollarSign size={14} />
                                                Giá bán (VNĐ)
                                              </label>
                                              <div className='p-2 bg-white rounded border'>
                                                <span className='text-green-600 font-bold text-sm'>
                                                  {childVariant.finalPrice.toLocaleString('vi-VN')} VNĐ
                                                </span>
                                                {childVariant.basePrice !== null &&
                                                  childVariant.basePrice !== childVariant.finalPrice && (
                                                    <span className='ml-2 text-xs text-gray-500 line-through'>
                                                      {childVariant.basePrice.toLocaleString('vi-VN')} VNĐ
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
                                          {childVariant.productImages && childVariant.productImages.length > 0 && (
                                            <div className='space-y-2 md:col-span-2 lg:col-span-3'>
                                              <label className='text-sm font-medium text-gray-700'>Hình ảnh</label>
                                              <div className='flex gap-2 flex-wrap'>
                                                {childVariant.productImages.map((image, idx) => (
                                                  <div
                                                    key={idx}
                                                    className='w-16 h-16 rounded-lg overflow-hidden border border-gray-200'
                                                  >
                                                    <img
                                                      src={image}
                                                      alt={`${childVariant.name} ${idx + 1}`}
                                                      className='w-full h-full object-cover'
                                                      onError={(e) => {
                                                        const target = e.target as HTMLImageElement
                                                        target.src = '/placeholder-image.png'
                                                      }}
                                                    />
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
                            <span className='text-green-700 font-medium'>Tổng số variant cha:</span>
                            <span className='ml-2 text-green-900'>{parentVariants.length} loại</span>
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
                                  ? `${Math.min(...prices).toLocaleString('vi-VN')} - ${Math.max(...prices).toLocaleString('vi-VN')} VNĐ`
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
        alt={product?.name || 'Product image'}
      />
    </motion.div>
  )
}

export default DetailProductStaff
