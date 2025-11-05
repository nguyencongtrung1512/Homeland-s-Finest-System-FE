import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Badge } from '../../../components/ui/badge'
import { Switch } from '../../../components/ui/switch'
import { Shield, Plus, Calendar, User, FileText, Clock, Package } from 'lucide-react'
import { toast } from '../../../utils/toast'
import { productCertificateApi } from '../../../apis/productCertificate.api'
import type { ProductCertificateType } from '../../../types/productCertificateType'

interface ProductCertificateProps {
  productId: string
  editModes: {
    certificates: boolean
  }
  onToggleEditMode: (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => void
  onCancelEdit: (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => void
  onSaveSection: (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => Promise<void>
}

// Chỉ có 2 trạng thái: Active và Inactive

function ProductCertificate({ productId }: ProductCertificateProps) {
  const [certificates, setCertificates] = useState<ProductCertificateType[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const fetchCertificates = async () => {
    try {
      setLoading(true)
      const response = await productCertificateApi.getByProductId(productId)

      // Thử cả hai cách để xem cái nào work
      const certificatesData = response.data.data || response.data || []
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleAddCertificate = async () => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn file ảnh chứng nhận')
      return
    }

    try {
      setLoading(true)
      await productCertificateApi.create({
        productId,
        certificateImage: selectedFile
      })

      toast.success('Thêm chứng nhận thành công')
      setSelectedFile(null)
      fetchCertificates() // Reload danh sách
    } catch {
      toast.error('Không thể thêm chứng nhận')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (certificateId: string, isActive: boolean) => {
    try {
      setUpdatingStatus(certificateId)
      const newStatus = isActive ? 'Active' : 'Inactive'
      await productCertificateApi.updateStatus(certificateId, newStatus)
      toast.success('Cập nhật trạng thái thành công')
      fetchCertificates() // Reload danh sách
    } catch {
      toast.error('Không thể cập nhật trạng thái')
    } finally {
      setUpdatingStatus(null)
    }
  }

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

  // Check if status is Active
  const isActiveStatus = (status: string) => {
    return status?.toLowerCase() === 'active'
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
          {/* Form thêm chứng nhận mới */}
          <div className='space-y-4'>
            <h3 className='text-lg font-medium text-gray-900'>Thêm chứng nhận mới</h3>
            <div className='space-y-4'>
              <div>
                <Label htmlFor='certificate-image' className='text-sm font-medium text-gray-700'>
                  Hình ảnh chứng nhận
                </Label>
                <div className='mt-2'>
                  <Input
                    id='certificate-image'
                    type='file'
                    accept='image/*'
                    onChange={handleFileChange}
                    className='file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100'
                  />
                </div>
              </div>
              <Button
                onClick={handleAddCertificate}
                disabled={!selectedFile || loading}
                className='bg-green-600 hover:bg-green-700'
              >
                <Plus className='w-4 h-4 mr-2' />
                Thêm chứng nhận
              </Button>
            </div>
          </div>

          {/* Danh sách chứng nhận hiện tại */}
          <div className='space-y-4'>
            <h3 className='text-lg font-medium text-gray-900'>Chứng nhận hiện có</h3>
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
                      <div className='flex items-center gap-2'>
                        {/* Switch để cập nhật status Active/Inactive */}
                        <div className='flex items-center gap-2'>
                          <span className='text-sm text-gray-600'>Hoạt động:</span>
                          <Switch
                            checked={isActiveStatus(cert.status)}
                            onCheckedChange={(checked) => handleStatusChange(cert.id, checked)}
                            disabled={updatingStatus === cert.id}
                          />
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

                    {cert.imageUrl && (
                      <div className='mt-4'>
                        <span className='text-sm font-medium text-gray-700 mb-2 block'>Hình ảnh chứng nhận:</span>
                        <div className='w-full max-w-md'>
                          <img
                            src={cert.imageUrl}
                            alt='Certificate'
                            className='w-full h-auto rounded-lg border border-gray-200 object-cover'
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
            ) : (
              <div className='text-center py-8'>
                <Shield className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500'>Chưa có chứng nhận nào</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProductCertificate
