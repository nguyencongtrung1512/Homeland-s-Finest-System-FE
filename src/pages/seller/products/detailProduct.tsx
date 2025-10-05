import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Package, Star, Eye, Calendar, MapPin, Tag, FileText, Award, Play, Image as ImageIcon, Archive, DollarSign, Layers } from 'lucide-react'
import { message } from 'antd'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { productApi, type ProductResponse } from '../../../apis/product.api'

interface ProductCertificate {
  id: string
  productId: string
  reviewedByStaffId: string
  imageUrl: string
  status: string
  staffNotes: string
  submittedDate: string
  decisionDate: string
  updatedAt: string | null
}

interface ProductDetail {
  id: string
  storeId: string
  provinceId: number
  editedById: string | null
  name: string
  description: string
  productImages: string[]
  productVideo: string | null
  madeBy: string
  saleCount: number
  rating: number
  reviewCount: number
  isActive: boolean
  typeProduct: string
  status: string
  note: string
  variants: any[]
  productCategories: any[]
  productCertificateDTOs: ProductCertificate[]
}

function DetailProductSeller() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('product-info')

  // Mock data cho product variants (dữ liệu cứng)
  const mockProductVariants = [
    {
      id: 1,
      name: 'Gói 1kg',
      price: 150000,
      stock: 50,
      unit: 'kg',
      weight: '1kg',
      dimensions: '20x15x10 cm'
    },
    {
      id: 2,
      name: 'Gói 2kg',
      price: 280000,
      stock: 30,
      unit: 'kg',
      weight: '2kg',
      dimensions: '25x20x12 cm'
    },
    {
      id: 3,
      name: 'Gói 5kg',
      price: 650000,
      stock: 15,
      unit: 'kg',
      weight: '5kg',
      dimensions: '35x25x15 cm'
    }
  ]

  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!id) {
        message.error('Không tìm thấy ID sản phẩm')
        navigate(-1)
        return
      }

      try {
        setLoading(true)
        const response: ProductResponse = await productApi.getById(id)

        if (response.status === 200 && response.data) {
          setProduct(response.data as ProductDetail)
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

  const handleBack = () => {
    navigate(-1)
  }

  const formatDate = (dateString: string) => {
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
          <Package className='text-green-600' size={20} />
          <span className='text-sm text-gray-600'>ID: {product?.id.slice(0, 8)}...</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-2 mb-6'>
          <TabsTrigger value='product-info' className='flex items-center gap-2'>
            <Package className='w-4 h-4' />
            Thông tin sản phẩm
          </TabsTrigger>
          <TabsTrigger value='variants' className='flex items-center gap-2'>
            <Archive className='w-4 h-4' />
            Loại sản phẩm
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Product Information */}
        <TabsContent value='product-info'>
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
                        <video
                          controls
                          className='w-full h-full'
                          poster={product.productImages?.[0]}
                        >
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
                        <span className='font-medium'>{product?.rating.toFixed(1)}</span>
                        <span className='text-gray-600'>({product?.reviewCount} đánh giá)</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Eye size={16} className='text-gray-500' />
                        <span className='text-gray-600'>{product?.saleCount} lượt bán</span>
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
                        <span className='text-gray-900'>{product?.madeBy}</span>
                      </div>
                    </div>
                    <div className='space-y-3'>
                      <div className='flex items-center gap-2'>
                        <Calendar size={16} className='text-green-600' />
                        <span className='text-sm font-medium text-gray-700'>Mã cửa hàng:</span>
                        <span className='text-gray-900'>{product?.storeId.slice(0, 8)}...</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <FileText size={16} className='text-green-600' />
                        <span className='text-sm font-medium text-gray-700'>Mã tỉnh:</span>
                        <span className='text-gray-900'>{product?.provinceId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Product Categories */}
                  {product?.productCategories && product.productCategories.length > 0 && (
                    <div>
                      <div className='flex items-center gap-2 mb-3'>
                        <Layers size={16} className='text-green-600' />
                        <span className='text-sm font-medium text-gray-700'>Danh mục sản phẩm:</span>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {product.productCategories.map((category, index) => (
                          <Badge
                            key={category.id || index}
                            variant="outline"
                            className='bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                          >
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>Mô tả sản phẩm</h3>
                    <p className='text-gray-700 leading-relaxed'>{product?.description}</p>
                  </div>

                  {product?.note && (
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-2'>Ghi chú</h3>
                      <p className='text-gray-700 leading-relaxed'>{product.note}</p>
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
                      <div className='text-2xl font-bold text-green-600'>{product?.saleCount}</div>
                      <div className='text-sm text-gray-600'>Lượt bán</div>
                    </div>
                    <div className='text-center p-4 bg-yellow-50 rounded-lg'>
                      <div className='text-2xl font-bold text-yellow-600'>{product?.rating.toFixed(1)}</div>
                      <div className='text-sm text-gray-600'>Đánh giá trung bình</div>
                    </div>
                    <div className='text-center p-4 bg-blue-50 rounded-lg'>
                      <div className='text-2xl font-bold text-blue-600'>{product?.reviewCount}</div>
                      <div className='text-sm text-gray-600'>Số lượt đánh giá</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Product Variants */}
        <TabsContent value='variants'>
          <Card className='shadow-lg'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-green-700'>
                <Archive size={20} />
                Loại sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {mockProductVariants.map((variant) => (
                  <div key={variant.id} className='border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow'>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                      {/* Variant Name */}
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-700'>Tên loại sản phẩm</label>
                        <div className='p-3 bg-gray-50 rounded-lg border'>
                          <span className='text-gray-900 font-medium'>{variant.name}</span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-700 flex items-center gap-1'>
                          <DollarSign size={14} />
                          Giá bán (VNĐ)
                        </label>
                        <div className='p-3 bg-gray-50 rounded-lg border'>
                          <span className='text-green-600 font-bold'>
                            {variant.price.toLocaleString('vi-VN')} VNĐ
                          </span>
                        </div>
                      </div>

                      {/* Stock */}
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-700 flex items-center gap-1'>
                          <Package size={14} />
                          Số lượng tồn kho
                        </label>
                        <div className='p-3 bg-gray-50 rounded-lg border'>
                          <span className={`font-medium ${variant.stock > 20 ? 'text-green-600' : variant.stock > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {variant.stock} {variant.unit}
                          </span>
                        </div>
                      </div>

                      {/* Weight */}
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-700'>Trọng lượng</label>
                        <div className='p-3 bg-gray-50 rounded-lg border'>
                          <span className='text-gray-900'>{variant.weight}</span>
                        </div>
                      </div>

                      {/* Dimensions */}
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-700'>Kích thước</label>
                        <div className='p-3 bg-gray-50 rounded-lg border'>
                          <span className='text-gray-900'>{variant.dimensions}</span>
                        </div>
                      </div>

                      {/* Unit */}
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-700'>Đơn vị</label>
                        <div className='p-3 bg-gray-50 rounded-lg border'>
                          <span className='text-gray-900'>{variant.unit}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Status Indicator */}
                    <div className='mt-4 pt-4 border-t border-gray-200'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-600'>Trạng thái kho:</span>
                        <Badge
                          className={
                            variant.stock > 20
                              ? 'bg-green-100 text-green-800'
                              : variant.stock > 10
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }
                        >
                          {variant.stock > 20 ? 'Còn nhiều' : variant.stock > 10 ? 'Sắp hết' : 'Ít hàng'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className='mt-6 p-4 bg-green-50 rounded-lg border border-green-200'>
                <h3 className='text-lg font-semibold text-green-800 mb-2'>Tổng quan</h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                  <div>
                    <span className='text-green-700 font-medium'>Tổng số loại:</span>
                    <span className='ml-2 text-green-900'>{mockProductVariants.length} loại</span>
                  </div>
                  <div>
                    <span className='text-green-700 font-medium'>Tổng tồn kho:</span>
                    <span className='ml-2 text-green-900'>
                      {mockProductVariants.reduce((total, variant) => total + variant.stock, 0)} sản phẩm
                    </span>
                  </div>
                  <div>
                    <span className='text-green-700 font-medium'>Giá từ:</span>
                    <span className='ml-2 text-green-900'>
                      {Math.min(...mockProductVariants.map(v => v.price)).toLocaleString('vi-VN')} - {Math.max(...mockProductVariants.map(v => v.price)).toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DetailProductSeller
