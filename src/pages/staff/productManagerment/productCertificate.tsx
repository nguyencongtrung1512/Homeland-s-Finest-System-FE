import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Shield, Calendar, User, FileText, Clock, Package, ZoomIn, Image as ImageIcon } from 'lucide-react'
import { toast } from '../../../utils/toast'
import { productCertificateApi } from '../../../apis/productCertificate.api'
import type { ProductCertificateType } from '../../../types/productCertificateType'
import ImagePreviewModal from '../../../components/ui/image-preview-modal'

interface ProductCertificateProps {
  productId: string
}

function ProductCertificate({ productId }: ProductCertificateProps) {
  const [certificates, setCertificates] = useState<ProductCertificateType[]>([])
  const [loading, setLoading] = useState(false)
  
  // States for image preview
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0)

  const fetchCertificates = async () => {
    try {
      setLoading(true)
      const response = await productCertificateApi.getByProductId(productId)

      // Thử cả hai cách để xem cái nào work
      const certificatesData = response.data.data || response.data || []
      
      // Debug: Log để kiểm tra dữ liệu từ BE
      console.log('Certificate data from BE:', certificatesData)
      certificatesData.forEach((cert: ProductCertificateType, index: number) => {
        console.log(`Certificate ${index + 1} imageUrl:`, cert.imageUrl, 'Type:', typeof cert.imageUrl)
      })
      
      setCertificates(certificatesData)
    } catch {
      toast.error('Không thể tải danh sách chứng nhận')
    } finally {
      setLoading(false)
    }
  }

  // Fetch certificates khi component mount
  useEffect(() => {
    if (productId) {
      fetchCertificates()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])


  // Format date helper
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Chưa có'
    try {
      // Handle format "10:53:56 31/10/2025"
      if (dateString.includes(' ')) {
        return dateString
      }
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

  // Get status badge - chỉ có Active và Inactive
  const getStatusBadge = (status: string) => {
    const isActive = status?.toLowerCase() === 'active'
    return isActive ? (
      <Badge className='bg-green-100 text-green-800'>Hoạt động</Badge>
    ) : (
      <Badge className='bg-gray-100 text-gray-800'>Không hoạt động</Badge>
    )
  }

  // Validate imageUrl - check nhiều trường hợp
  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false
    if (typeof url !== 'string') return false
    const trimmed = url.trim()
    return trimmed.length > 0 && (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/'))
  }

  // Handle image preview
  const handleImagePreview = (imageUrl: string) => {
    if (isValidImageUrl(imageUrl)) {
      setPreviewImages([imageUrl])
      setPreviewInitialIndex(0)
      setImagePreviewOpen(true)
    }
  }

  const handleCloseImagePreview = () => {
    setImagePreviewOpen(false)
    setPreviewImages([])
    setPreviewInitialIndex(0)
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-green-700 flex items-center gap-2'>
          <Shield className='w-5 h-5 text-green-600' />
          Chứng nhận sản phẩm
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {/* Danh sách chứng nhận */}
          <div className='space-y-4'>
            {loading ? (
              <div className='text-center py-4'>
                <p className='text-gray-500'>Đang tải...</p>
              </div>
            ) : certificates.length > 0 ? (
              <div className='grid gap-4'>
                {certificates.map((cert) => (
                  <div key={cert.id} className='border border-gray-200 rounded-lg p-4 bg-gray-50'>
                    <div className='flex items-center justify-between mb-4'>
                      <div className='flex items-center gap-4'>
                        <Shield className='w-8 h-8 text-green-600' />
                        <div>
                          <h4 className='font-medium text-gray-900'>Chứng nhận #{cert.id.slice(0, 8)}</h4>
                          <div className='mt-1'>{getStatusBadge(cert.status)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Thông tin chi tiết */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                      <div className='space-y-3'>
                        <div className='flex items-start gap-2'>
                          <FileText size={16} className='text-green-600 mt-0.5' />
                          <div>
                            <span className='text-sm text-gray-600'>ID:</span>
                            <p className='text-sm font-medium text-gray-900'>{cert.id}</p>
                          </div>
                        </div>
                        <div className='flex items-start gap-2'>
                          <Package size={16} className='text-green-600 mt-0.5' />
                          <div>
                            <span className='text-sm text-gray-600'>Product ID:</span>
                            <p className='text-sm font-medium text-gray-900'>{cert.productId}</p>
                          </div>
                        </div>
                        {cert.reviewedByStaffId && (
                          <div className='flex items-start gap-2'>
                            <User size={16} className='text-green-600 mt-0.5' />
                            <div>
                              <span className='text-sm text-gray-600'>Người duyệt:</span>
                              <p className='text-sm font-medium text-gray-900'>{cert.reviewedByStaffId}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className='space-y-3'>
                        <div className='flex items-start gap-2'>
                          <Calendar size={16} className='text-green-600 mt-0.5' />
                          <div>
                            <span className='text-sm text-gray-600'>Ngày nộp:</span>
                            <p className='text-sm font-medium text-gray-900'>{formatDate(cert.submittedDate)}</p>
                          </div>
                        </div>
                        <div className='flex items-start gap-2'>
                          <Calendar size={16} className='text-green-600 mt-0.5' />
                          <div>
                            <span className='text-sm text-gray-600'>Ngày quyết định:</span>
                            <p className='text-sm font-medium text-gray-900'>{formatDate(cert.decisionDate)}</p>
                          </div>
                        </div>
                        <div className='flex items-start gap-2'>
                          <Clock size={16} className='text-green-600 mt-0.5' />
                          <div>
                            <span className='text-sm text-gray-600'>Cập nhật lần cuối:</span>
                            <p className='text-sm font-medium text-gray-900'>{formatDate(cert.updatedAt)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {cert.staffNotes && (
                      <div className='mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200'>
                        <div className='flex items-start gap-2'>
                          <FileText size={16} className='text-yellow-600 mt-0.5' />
                          <div>
                            <span className='text-sm font-medium text-yellow-800'>Ghi chú từ staff:</span>
                            <p className='text-sm text-yellow-900 mt-1'>{cert.staffNotes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Certificate Images Section - Always show label, conditionally show image */}
                    <div className='mt-4'>
                      <span className='text-sm font-medium text-gray-700 mb-2 block'>Hình ảnh chứng nhận:</span>
                      {isValidImageUrl(cert.imageUrl) ? (
                        <div 
                          className='relative w-full max-w-md h-64 bg-gray-100 rounded-lg overflow-hidden cursor-pointer group hover:ring-2 ring-green-500 transition-all'
                          onClick={() => handleImagePreview(cert.imageUrl!)}
                        >
                          <img
                            src={cert.imageUrl}
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
                      ) : (
                        <div className='w-full max-w-md h-32 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200'>
                          <div className='flex flex-col items-center gap-2 text-gray-400'>
                            <ImageIcon size={32} />
                            <span className='text-sm'>Không có hình ảnh</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8'>
                <Shield className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500'>Chưa có chứng nhận nào</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={imagePreviewOpen}
        onClose={handleCloseImagePreview}
        images={previewImages}
        initialIndex={previewInitialIndex}
        alt='Certificate image'
      />
    </Card>
  )
}

export default ProductCertificate
