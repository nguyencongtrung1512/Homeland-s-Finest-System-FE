import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Shield, Edit, Save, X, Trash2, Plus } from 'lucide-react'
import { toast } from 'react-toastify'
import { productCertificateApi } from '../../../apis/productCertificate.api'
import type { ProductCertificate } from '../../../types/productCertificateType'

interface ProductCertificateProps {
  productId: string
  editModes: {
    certificates: boolean
  }
  onToggleEditMode: (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => void
  onCancelEdit: (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => void
  onSaveSection: (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => Promise<void>
}

function ProductCertificate({
  productId,
  editModes,
  onToggleEditMode,
  onCancelEdit,
  onSaveSection
}: ProductCertificateProps) {
  const [certificates, setCertificates] = useState<ProductCertificate[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Fetch certificates khi component mount
  useEffect(() => {
    if (productId) {
      fetchCertificates()
    }
  }, [productId])

  const fetchCertificates = async () => {
    try {
      setLoading(true)
      const response = await productCertificateApi.getByProductId(productId)

      // Thử cả hai cách để xem cái nào work
      const certificatesData = response.data.data || response.data || []
      setCertificates(certificatesData)
    } catch (error) {
      toast.error('Không thể tải danh sách chứng nhận')
    } finally {
      setLoading(false)
    }
  }

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
    } catch (error) {
      toast.error('Không thể thêm chứng nhận')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCertificate = async (certificateId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chứng nhận này?')) {
      return
    }

    try {
      setLoading(true)
      await productCertificateApi.delete(certificateId)
      toast.success('Ẩn chứng nhận thành công')
      fetchCertificates() // Reload danh sách
    } catch (error) {
      toast.error('Không thể xóa chứng nhận')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-green-700 flex items-center gap-2'>
          <Shield className='w-5 h-5 text-green-600' />
          Chứng nhận sản phẩm
        </CardTitle>
        <div className='flex gap-2'>
          {editModes.certificates ? (
            <>
              <Button size='sm' variant='outline' onClick={() => onCancelEdit('certificates')}>
                <X className='w-4 h-4 mr-2' />
                Hủy
              </Button>
              <Button
                size='sm'
                onClick={() => onSaveSection('certificates')}
                className='bg-green-600 hover:bg-green-700'
              >
                <Save className='w-4 h-4 mr-2' />
                Lưu
              </Button>
            </>
          ) : (
            <Button size='sm' variant='outline' onClick={() => onToggleEditMode('certificates')}>
              <Edit className='w-4 h-4 mr-2' />
              Chỉnh sửa
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editModes.certificates ? (
          // Edit mode for certificates
          <div className='space-y-6'>
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
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                          <Shield className='w-8 h-8 text-green-600' />
                          <div>
                            <h4 className='font-medium text-gray-900'>Chứng nhận #{cert.id.slice(0, 8)}</h4>
                            <p className='text-sm text-gray-600'>Trạng thái: {cert.status}</p>
                            <p className='text-sm text-gray-600'>Ngày nộp: {new Date(cert.submittedDate).toLocaleDateString('vi-VN')}</p>
                          </div>
                        </div>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => handleDeleteCertificate(cert.id)}
                          className='text-red-600 hover:text-red-700 hover:bg-red-50'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                      {cert.imageUrl && (
                        <div className='mt-3'>
                          <img
                            src={cert.imageUrl}
                            alt='Certificate'
                            className='w-full max-w-xs h-32 object-cover rounded border'
                          />
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
        ) : (
          // View mode for certificates
          <div className='space-y-4'>
            {loading ? (
              <div className='text-center py-8'>
                <p className='text-gray-500'>Đang tải chứng nhận...</p>
              </div>
            ) : certificates.length > 0 ? (
              <div className='grid gap-4'>
                {certificates.map((cert) => (
                  <div key={cert.id} className='border border-gray-200 rounded-lg p-4 bg-gray-50'>
                    <div className='flex items-center gap-4'>
                      <Shield className='w-8 h-8 text-green-600' />
                      <div className='flex-1'>
                        <h4 className='font-medium text-gray-900'>Chứng nhận #{cert.id.slice(0, 8)}</h4>
                        <p className='text-sm text-gray-600'>Trạng thái: {cert.status}</p>
                        <p className='text-sm text-gray-600'>Ngày nộp: {new Date(cert.submittedDate).toLocaleDateString('vi-VN')}</p>
                        {cert.staffNotes && (
                          <p className='text-sm text-gray-600 mt-1'>Ghi chú: {cert.staffNotes}</p>
                        )}
                      </div>
                    </div>
                    {cert.imageUrl && (
                      <div className='mt-3'>
                        <img
                          src={cert.imageUrl}
                          alt='Certificate'
                          className='w-full max-w-xs h-32 object-cover rounded border'
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8'>
                <Shield className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500'>Chưa có chứng nhận nào cho sản phẩm này</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ProductCertificate

