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
  Plus,
  Edit,
  CircleFadingArrowUp
} from 'lucide-react'
import { message } from 'antd'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs'
import type { Product, VariantGroup, VariantOption } from '../../../types/productType'
import type { ProductCertificateType } from '../../../types/productCertificateType'
import type { ProductStory } from '../../../types/productStoryType'
import { productApi } from '../../../apis/product.api'
import { productCertificateApi } from '../../../apis/productCertificate.api'
import { productStoryApi } from '../../../apis/productStory.api'
import ModalProductDetail from './modalProductDetail'
import ModalVariantProduct from './modalVariantProduct'
import ModalEditVariant from './modalEditVariant'
import ModalEditProduct from './modalEditProduct'
import ProductCertificate from './productCertificate'
import ProductStoryComponent from './productStory'

function DetailProductSeller() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // States for Dialogs
  const [showCreateDetailDialog, setShowCreateDetailDialog] = useState(false)
  const [showCreateVariantDialog, setShowCreateVariantDialog] = useState(false)
  const [variantParentId, setVariantParentId] = useState<string | undefined>(undefined)
  const [selectedParentVariant, setSelectedParentVariant] = useState<VariantOption | null>(null)

  // States for Edit Dialogs
  const [showEditProductDialog, setShowEditProductDialog] = useState(false)
  const [showEditVariantDialog, setShowEditVariantDialog] = useState(false)
  const [editingVariant, setEditingVariant] = useState<VariantOption | null>(null)
  const [editingParentVariant, setEditingParentVariant] = useState<VariantOption | null>(null)

  // States for Edit Modes (for ProductCertificate and ProductStory)
  const [editModes, setEditModes] = useState({
    certificates: false,
    story: false
  })

  // States for validation
  const [certificates, setCertificates] = useState<ProductCertificateType[]>([])
  const [stories, setStories] = useState<ProductStory[]>([])
  const [checkingValidation, setCheckingValidation] = useState(false)

  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!id) {
        message.error('Không tìm thấy ID sản phẩm')
        navigate(-1)
        return
      }

      try {
        setLoading(true)
        const response = await productApi.getById(id)

        if (response.status === 200 && response.data) {
          setProduct(response.data)
        } else {
          message.error('Không thể tải thông tin sản phẩm')
        }
      } catch (error) {
        console.error('Error fetching product detail:', error)
        message.error('Có lỗi xảy ra khi tải thông tin sản phẩm')
      } finally {
        setLoading(false)
      }
    }

    fetchProductDetail()
  }, [id, navigate])

  // Fetch certificates and stories for validation
  useEffect(() => {
    const fetchValidationData = async () => {
      if (!id) return

      try {
        setCheckingValidation(true)
        // Fetch certificates
        const certResponse = await productCertificateApi.getByProductId(id)
        const certData = certResponse.data?.data || certResponse.data || []
        setCertificates(Array.isArray(certData) ? certData : [])

        // Fetch stories - API returns single story or array
        const storyResponse = await productStoryApi.getByProductId(id)
        if (storyResponse.status === 200 && storyResponse.data) {
          // Response có thể là single story object hoặc array
          const storyData = storyResponse.data
          if (Array.isArray(storyData)) {
            setStories(storyData)
          } else {
            setStories([storyData])
          }
        } else {
          setStories([])
        }
      } catch (error) {
        console.error('Error fetching validation data:', error)
        // Set empty arrays on error
        setCertificates([])
        setStories([])
      } finally {
        setCheckingValidation(false)
      }
    }

    if (product) {
      fetchValidationData()
    }
  }, [id, product])

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

  const handleRefreshProduct = async () => {
    if (!id) return
    try {
      const refreshResponse = await productApi.getById(id)
      if (refreshResponse.status === 200 && refreshResponse.data) {
        setProduct(refreshResponse.data)
      }
      // Refresh certificates and stories
      const certResponse = await productCertificateApi.getByProductId(id)
      const certData = certResponse.data?.data || certResponse.data || []
      setCertificates(Array.isArray(certData) ? certData : [])

      const storyResponse = await productStoryApi.getByProductId(id)
      if (storyResponse.status === 200 && storyResponse.data) {
        const storyData = storyResponse.data
        if (Array.isArray(storyData)) {
          setStories(storyData)
        } else {
          setStories([storyData])
        }
      } else {
        setStories([])
      }
    } catch (error) {
      console.error('Error refreshing product:', error)
    }
  }

  // Kiểm tra điều kiện submit
  const canSubmit = (): boolean => {
    if (!product) return false

    // Kiểm tra thông tin sản phẩm
    const hasProductInfo = !!(
      product.name &&
      product.name.trim() !== '' &&
      product.description &&
      product.description.trim() !== '' &&
      product.productImages &&
      product.productImages.length > 0 &&
      product.provinceId &&
      product.productCategories &&
      product.productCategories.id &&
      product.material &&
      product.material.trim() !== ''
    )

    // Kiểm tra chứng nhận (có ít nhất 1 chứng nhận)
    const hasCertificates = certificates.length > 0

    // Kiểm tra câu chuyện (có ít nhất 1 story với title và contents)
    const hasStory = stories.some(
      (story) => story.title && story.title.trim() !== '' && story.contents && story.contents.length > 0
    )

    return hasProductInfo && hasCertificates && hasStory
  }

  // Handler submit product
  const handleSubmit = async () => {
    if (!id) return

    if (!canSubmit()) {
      message.warning('Vui lòng điền đầy đủ thông tin sản phẩm, chứng nhận và câu chuyện trước khi gửi')
      return
    }

    try {
      setCheckingValidation(true)
      const response = await productApi.submit(id)
      if (response.status === 200) {
        message.success('Gửi sản phẩm thành công')
        await handleRefreshProduct()
      } else {
        message.error('Không thể gửi sản phẩm')
      }
    } catch (error) {
      console.error('Error submitting product:', error)
      message.error('Có lỗi xảy ra khi gửi sản phẩm')
    } finally {
      setCheckingValidation(false)
    }
  }

  // Handler cancel product
  const handleCancel = async () => {
    if (!id) return

    try {
      setCheckingValidation(true)
      const response = await productApi.cancel(id)
      if (response.status === 200) {
        message.success('Hủy sản phẩm thành công')
        await handleRefreshProduct()
      } else {
        message.error('Không thể hủy sản phẩm')
      }
    } catch (error) {
      console.error('Error canceling product:', error)
      message.error('Có lỗi xảy ra khi hủy sản phẩm')
    } finally {
      setCheckingValidation(false)
    }
  }

  // Handlers for edit modes
  const handleToggleEditMode = (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => {
    if (section === 'certificates') {
      setEditModes((prev) => ({ ...prev, certificates: !prev.certificates }))
    } else if (section === 'story') {
      setEditModes((prev) => ({ ...prev, story: !prev.story }))
    }
  }

  const handleCancelEdit = (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => {
    if (section === 'certificates') {
      setEditModes((prev) => ({ ...prev, certificates: false }))
    } else if (section === 'story') {
      setEditModes((prev) => ({ ...prev, story: false }))
    }
  }

  const handleSaveSection = async (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => {
    // ProductCertificate và ProductStory tự xử lý save, chỉ cần tắt edit mode
    if (section === 'certificates') {
      setEditModes((prev) => ({ ...prev, certificates: false }))
    } else if (section === 'story') {
      setEditModes((prev) => ({ ...prev, story: false }))
    }
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
        <div className='flex items-center gap-2'>
          <Button
            onClick={() => setShowEditProductDialog(true)}
            className='bg-blue-600 hover:bg-blue-700 text-white'
            variant='outline'
            size='sm'
          >
            <Edit className='w-4 h-4 mr-2' />
            Chỉnh sửa sản phẩm
          </Button>
          <Button
            onClick={() => setShowCreateDetailDialog(true)}
            className='bg-green-600 hover:bg-green-700 text-white'
            variant='outline'
            size='sm'
          >
            <Plus className='w-4 h-4 mr-2' />
            Thêm Product Detail
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CircleFadingArrowUp size={20} className='text-green-600' />
            Xác nhận xử lý sản phẩm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium text-gray-700'>Trạng thái:</span>
              {product && getStatusBadge(product.status, product.isActive)}
            </div>
            <div className='flex items-center gap-2'>
              {/* Hiển thị button Submit khi status là Draft */}
              {product?.status?.toLowerCase() === 'draft' && (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit() || checkingValidation}
                  className='bg-green-600 hover:bg-green-700 text-white'
                >
                  <CircleFadingArrowUp size={16} className='mr-2' />
                  Gửi sản phẩm
                </Button>
              )}
              {/* Hiển thị button Cancel khi status là Pending */}
              {product?.status?.toLowerCase() === 'pending' && (
                <Button
                  onClick={handleCancel}
                  disabled={checkingValidation}
                  variant='destructive'
                  className='bg-red-600 hover:bg-red-700 text-white'
                >
                  Hủy sản phẩm
                </Button>
              )}
            </div>
          </div>
          {/* Hiển thị thông báo khi không đủ điều kiện submit */}
          {product?.status?.toLowerCase() === 'draft' && !canSubmit() && (
            <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
              <p className='text-sm text-yellow-800'>
                <strong>Lưu ý:</strong> Vui lòng điền đầy đủ thông tin sản phẩm, chứng nhận và câu chuyện để có thể gửi
                sản phẩm.
              </p>
            </div>
          )}
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

          {/* Create Product Detail Button - Show if no variants */}
          {parentVariants.length === 0 && (
            <Card className='shadow-lg'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='flex items-center gap-2 text-green-700'>
                    <Archive size={20} />
                    Loại sản phẩm
                  </CardTitle>
                  <Button
                    onClick={() => {
                      setSelectedParentVariant(null)
                      setShowCreateVariantDialog(true)
                    }}
                    className='bg-green-600 hover:bg-green-700 text-white'
                  >
                    <Plus className='w-4 h-4 mr-2' />
                    Tạo Product Variant
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-center py-8 text-gray-500'>
                  <Archive size={48} className='mx-auto mb-4 text-gray-400' />
                  <p>Chưa có product variant. Hãy tạo product variant mới.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Variants Display */}
          {parentVariants.length > 0 && (
            <Card className='shadow-lg'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='flex items-center gap-2 text-green-700'>
                    <Archive size={20} />
                    Loại sản phẩm
                  </CardTitle>
                  <Button
                    onClick={() => {
                      setSelectedParentVariant(null)
                      setShowCreateVariantDialog(true)
                    }}
                    className='bg-green-600 hover:bg-green-700 text-white'
                    variant='outline'
                    size='sm'
                  >
                    <Plus className='w-4 h-4 mr-2' />
                    Thêm Product variant
                  </Button>
                </div>
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
                          <div className='flex items-center justify-between mb-4'>
                            <h3 className='text-lg font-semibold text-gray-900'>Variant cha</h3>
                            <Button
                              onClick={() => {
                                setEditingVariant(parentVariant)
                                setEditingParentVariant(null)
                                setShowEditVariantDialog(true)
                              }}
                              variant='outline'
                              size='sm'
                              className='flex items-center gap-2'
                            >
                              <Edit size={14} />
                              Chỉnh sửa
                            </Button>
                          </div>
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
                                  <div className='flex items-center justify-between mb-3'>
                                    <h4 className='text-sm font-semibold text-gray-700'>Variant con</h4>
                                    <Button
                                      onClick={() => {
                                        setEditingVariant(childVariant)
                                        setEditingParentVariant(parentVariant)
                                        setShowEditVariantDialog(true)
                                      }}
                                      variant='outline'
                                      size='sm'
                                      className='flex items-center gap-2'
                                    >
                                      <Edit size={12} />
                                      Chỉnh sửa
                                    </Button>
                                  </div>
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

                        {/* Add Child Variant Button */}
                        <div className='mt-4 pt-4 border-t border-gray-200'>
                          <Button
                            onClick={() => {
                              setVariantParentId(parentVariant.id)
                              setSelectedParentVariant(parentVariant)
                              setShowCreateVariantDialog(true)
                            }}
                            variant='outline'
                            size='sm'
                            className='w-full'
                          >
                            <Plus className='w-4 h-4 mr-2' />
                            {hasChildren ? 'Thêm variant con' : 'Tạo variant con'}
                          </Button>
                        </div>
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
          {id && (
            <ProductCertificate
              productId={id}
              editModes={editModes}
              onToggleEditMode={handleToggleEditMode}
              onCancelEdit={handleCancelEdit}
              onSaveSection={handleSaveSection}
            />
          )}
        </TabsContent>

        {/* Tab 3: Câu chuyện */}
        <TabsContent value='story' className='space-y-6'>
          {id && (
            <ProductStoryComponent
              productId={id}
              isEditMode={editModes.story}
              onToggleEditMode={handleToggleEditMode}
              onCancelEdit={handleCancelEdit}
              onSaveSection={handleSaveSection}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Create Product Detail */}
      <ModalProductDetail
        open={showCreateDetailDialog}
        onOpenChange={setShowCreateDetailDialog}
        product={product}
        parentId={id}
        onSuccess={handleRefreshProduct}
      />

      {/* Modal Create Product Variant */}
      <ModalVariantProduct
        open={showCreateVariantDialog}
        onOpenChange={(open) => {
          setShowCreateVariantDialog(open)
          if (!open) {
            setVariantParentId(undefined) // Reset parentId when dialog closes
            setSelectedParentVariant(null)
          }
        }}
        product={product}
        parentId={variantParentId || id}
        selectedParentVariant={selectedParentVariant}
        onSuccess={handleRefreshProduct}
      />

      {/* Modal Edit Variant */}
      <ModalEditVariant
        open={showEditVariantDialog}
        onOpenChange={(open) => {
          setShowEditVariantDialog(open)
          if (!open) {
            setEditingVariant(null)
            setEditingParentVariant(null)
          }
        }}
        product={product}
        variant={editingVariant}
        parentVariant={editingParentVariant}
        onSuccess={handleRefreshProduct}
      />

      {/* Modal Edit Product */}
      <ModalEditProduct
        open={showEditProductDialog}
        onOpenChange={setShowEditProductDialog}
        product={product}
        onSuccess={handleRefreshProduct}
      />
    </div>
  )
}

export default DetailProductSeller
