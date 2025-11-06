import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Package,
  Star,
  Eye,
  Calendar,
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
  AlertCircle
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

function DetailProductStaff() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // States for action modal
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'Confirmed' | 'Rejected' | 'Approved' | 'Denied' | null>(null)
  const [actionNote, setActionNote] = useState('')
  const [processingAction, setProcessingAction] = useState(false)

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

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
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
      </div>
      {/* Action Card */}
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
                  Chấp nhận xử lý
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
                  Chấp nhận
                </Button>
                <Button
                  onClick={() => handleActionClick('Denied')}
                  variant='destructive'
                  size='lg'
                  className='bg-red-600 hover:bg-red-700'
                >
                  <XCircle className='w-5 h-5 mr-2' />
                  Từ chối
                </Button>
              </div>
            )}

            {/* Show message if already processed */}
            {!canProcess() && !isConfirmed() && (
              <div className='flex items-center gap-2 text-gray-600'>
                <AlertCircle className='w-5 h-5' />
                <span>
                  Sản phẩm đã được xử lý. Trạng thái hiện tại: <strong>{product?.status}</strong>
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue='info' className='w-full'>
        <TabsList className='mb-6'>
          <TabsTrigger value='info'>Thông tin sản phẩm</TabsTrigger>
          <TabsTrigger value='certificates'>Chứng nhận</TabsTrigger>
          <TabsTrigger value='story'>Câu chuyện</TabsTrigger>
        </TabsList>

        {/* Tab 1: Thông tin sản phẩm */}
        <TabsContent value='info' className='space-y-6'>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Left Column - Product Images */}
            <div className='lg:col-span-1'>
              <Card className='shadow-lg'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <ImageIcon size={20} className='text-green-600' />
                    Hình ảnh sản phẩm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Main Image */}
                  <div className='mb-4'>
                    <div className='aspect-square bg-gray-100 rounded-lg overflow-hidden'>
                      {product?.productImages && product.productImages.length > 0 ? (
                        <img
                          src={product.productImages[selectedImageIndex]}
                          alt={product.name}
                          className='w-full h-full object-cover'
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-image.png'
                          }}
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center'>
                          <ImageIcon size={48} className='text-gray-400' />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail Images */}
                  {product?.productImages && product.productImages.length > 1 && (
                    <div className='grid grid-cols-4 gap-2'>
                      {product.productImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${selectedImageIndex === index ? 'border-green-600' : 'border-transparent'
                            }`}
                        >
                          <img
                            src={image}
                            alt={`${product.name} ${index + 1}`}
                            className='w-full h-full object-cover'
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/placeholder-image.png'
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Product Video */}
                  {product?.productVideo && (
                    <div className='mt-4'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Play size={16} className='text-green-600' />
                        <span className='text-sm font-medium text-gray-700'>Video sản phẩm</span>
                      </div>
                      <div className='aspect-video bg-gray-100 rounded-lg overflow-hidden'>
                        <video controls className='w-full h-full' poster={product.productImages?.[0]}>
                          <source src={product.productVideo} type='video/mp4' />
                          Trình duyệt của bạn không hỗ trợ video.
                        </video>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Product Information */}
            <div className='lg:col-span-2 space-y-6'>
              {/* Basic Information */}
              <Card className='shadow-lg'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Package size={20} className='text-green-600' />
                    Thông tin cơ bản
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <h2 className='text-2xl font-bold text-gray-900 mb-2'>{product?.name}</h2>
                    <div className='flex items-center gap-4 mb-4'>
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

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-3'>
                      <div className='flex items-center gap-2'>
                        <Tag size={16} className='text-green-600' />
                        <span className='text-sm font-medium text-gray-700'>Loại sản phẩm:</span>
                        <span className='text-gray-900'>{product?.typeProduct}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <MapPin size={16} className='text-green-600' />
                        <span className='text-sm font-medium text-gray-700'>Xuất xứ:</span>
                        <span className='text-gray-900'>{product?.material}</span>
                      </div>
                    </div>
                    <div className='space-y-3'>
                      <div className='flex items-center gap-2'>
                        <Calendar size={16} className='text-green-600' />
                      </div>
                      <div className='flex items-center gap-2'>
                        <FileText size={16} className='text-green-600' />
                        <span className='text-sm font-medium text-gray-700'>Mã tỉnh:</span>
                        <span className='text-gray-900'>{product?.provinceId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Product Categories */}
                  {product?.productCategories && (
                    <div>
                      <div className='flex items-center gap-2 mb-3'>
                        <Layers size={16} className='text-green-600' />
                        <span className='text-sm font-medium text-gray-700'>Danh mục sản phẩm:</span>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200 hover:bg-green-100'>
                          {product.productCategories.name}
                        </Badge>
                      </div>
                    </div>
                  )}

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

                  {/* Summary Price */}
                  {product?.summaryPrice && (
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-2'>Tóm tắt giá</h3>
                      <p className='text-2xl font-bold text-green-600'>{product.summaryPrice}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Certificates */}
              {product?.productCertificateDTOs && product.productCertificateDTOs.length > 0 && (
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
                              <div className='w-32 h-32 bg-gray-100 rounded-lg overflow-hidden'>
                                <img
                                  src={certificate.imageUrl}
                                  alt='Chứng nhận'
                                  className='w-full h-full object-cover'
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = '/placeholder-image.png'
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Statistics */}
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
            </div>
          </div>

          {/* No variants message */}
          {parentVariants.length === 0 && (
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
          )}

          {/* Variants Display */}
          {parentVariants.length > 0 && (
            <Card className='shadow-lg'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-green-700'>
                  <Archive size={20} />
                  Loại sản phẩm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-6'>
                  {parentVariants.map((parentVariant) => {
                    const attributeType = getAttributeTypeForVariant(parentVariant)
                    const hasChildren = hasChildVariants(parentVariant)
                    const childVariants = getChildVariants(parentVariant)

                    return (
                      <div
                        key={parentVariant.id}
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

                        {/* Variant Con - Hiển thị nếu có */}
                        {hasChildren && childVariants.length > 0 && (
                          <div className='mt-4 space-y-4'>
                            <div className='flex items-center gap-2 mb-3'>
                              <div className='h-px flex-1 bg-gray-200'></div>
                              <span className='text-sm font-semibold text-gray-700 px-2'>
                                Variant con ({childVariants.length})
                              </span>
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
                          </div>
                        )}

                      </div>
                    )
                  })}
                </div>

                {/* Summary */}
                {parentVariants.length > 0 && (
                  <div className='mt-6 p-4 bg-green-50 rounded-lg border border-green-200'>
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
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Chứng nhận */}
        <TabsContent value='certificates' className='space-y-6'>
          {id && <ProductCertificate productId={id} />}
        </TabsContent>

        {/* Tab 3: Câu chuyện */}
        <TabsContent value='story' className='space-y-6'>
          {id && <ProductStoryComponent productId={id} />}
        </TabsContent>
      </Tabs>

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
    </div>
  )
}

export default DetailProductStaff
