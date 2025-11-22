import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Shield, ZoomIn, Image as ImageIcon } from 'lucide-react'
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
                  <div key={cert.id} className='border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col items-center'>





                    {/* Certificate Images Section - Always show label, conditionally show image */}
                    <div className='mt-4 flex flex-col items-center'>
                      <span className='text-sm font-medium text-gray-700 mb-4 block w-full text-center'>Hình ảnh chứng nhận:</span>
                      {cert.imageUrl ? (
                        <div
                          className='relative w-full max-w-4xl bg-white rounded-lg overflow-hidden cursor-pointer group hover:ring-2 ring-green-500 transition-all border border-gray-200 flex items-center justify-center min-h-[300px]'
                          onClick={() => handleImagePreview(cert.imageUrl!)}
                        >
                          <img
                            src={cert.imageUrl}
                            alt='Chứng nhận'
                            className='w-full h-auto max-h-[500px] object-contain transition-transform duration-300 group-hover:scale-105 relative z-10'
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/placeholder-image.png'
                            }}
                          />
                          <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-opacity duration-300 flex items-center justify-center pointer-events-none z-20'>
                            <div className='opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 text-white bg-black/60 px-4 py-2 rounded-lg'>
                              <ZoomIn className='w-5 h-5' />
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
