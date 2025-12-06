import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import { Badge } from '../../../components/ui/badge'
import { Switch } from '../../../components/ui/switch'
import {
  Shield,
  Plus,
  User,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  X
} from 'lucide-react'
import { toast } from '../../../utils/toast'
import { productCertificateApi } from '../../../apis/productCertificate.api'
import { n8nApi } from '../../../apis/n8n.api'
import Loading from '../../../components/Loading/loading'
import type { ProductCertificateType } from '../../../types/productCertificateType'

interface ProductCertificateProps {
  productId: string
  editModes: {
    certificates: boolean
  }
  onToggleEditMode: (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => void
  onCancelEdit: (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => void
  onSaveSection: (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => Promise<void>
  onRefresh?: () => Promise<void> | void
  canEdit?: boolean
}

// Chỉ có 2 trạng thái: Active và Inactive

function ProductCertificate({ productId, onRefresh, canEdit = true }: ProductCertificateProps) {
  const [certificates, setCertificates] = useState<ProductCertificateType[]>([])
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchCertificates = async () => {
    try {
      setLoading(true)
      const response = await productCertificateApi.getByProductId(productId)

      // Thử cả hai cách để xem cái nào work
      const certificatesData = response.data.data || response.data || []
      setCertificates(certificatesData)
    } catch (error: unknown) {
      console.error('Error fetching certificates:', error)

      // Extract error message from backend response
      let errorMessage = 'Không thể tải danh sách chứng nhận'

      if (error && typeof error === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any

        // Check for axios error response structure (error.response.data)
        if (err.response?.data) {
          const responseData = err.response.data

          // Priority 1: Check for message in response.data
          if (responseData.message) {
            errorMessage = responseData.message
          }
          // Priority 2: Check for title field
          else if (responseData.title) {
            errorMessage = responseData.title
          }
          // Priority 3: Check for error string
          else if (responseData.error && typeof responseData.error === 'string') {
            errorMessage = responseData.error
          }
        }
        // Check for direct message property
        else if (err.message && typeof err.message === 'string') {
          errorMessage = err.message
        }
      }

      toast.error(errorMessage)
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('File phải là hình ảnh')
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File quá lớn. Tối đa 5MB')
        return
      }

      setSelectedFile(file)
      setValidationError(null) // Reset validation error when new file is selected
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const removeSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setValidationError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleAddCertificate = async () => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn file ảnh chứng nhận')
      return
    }

    try {
      // Bước 1: Kiểm tra giấy chứng nhận hợp lệ hay không
      setValidating(true)
      setValidationError(null)

      const validationResult = await n8nApi.validateCertificate(selectedFile)

      if (!validationResult.isValid) {
        // Nếu không hợp lệ, hiển thị lý do và không upload (không hiển thị toast)
        setValidationError(validationResult.reason)
        setValidating(false)
        return
      }

      // Nếu hợp lệ, tiếp tục upload
      setValidating(false)
      setLoading(true)

      await productCertificateApi.create({
        productId,
        certificateImage: selectedFile
      })

      toast.success('Thêm chứng nhận thành công')
      removeSelectedFile()
      // Wait a bit for backend to process
      await new Promise((resolve) => setTimeout(resolve, 500))
      // Reload local certificates list first to ensure we have latest data
      await fetchCertificates()
      // Notify parent component to refresh validation data (skip delay since we already waited)
      if (onRefresh) {
        await onRefresh()
      }
    } catch (error: unknown) {
      console.error('Error creating certificate:', error)

      // Extract error message from backend response
      let errorMessage = 'Không thể thêm chứng nhận'

      if (error && typeof error === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any

        // Check for axios error response structure (error.response.data)
        if (err.response?.data) {
          const responseData = err.response.data

          // Priority 1: Check for message in response.data
          if (responseData.message) {
            errorMessage = responseData.message
          }
          // Priority 2: Check for errors object (validation errors)
          else if (responseData.errors && typeof responseData.errors === 'object') {
            const errorMessages: string[] = []
            Object.keys(responseData.errors).forEach((field) => {
              const fieldErrors = responseData.errors[field]
              if (Array.isArray(fieldErrors)) {
                errorMessages.push(...fieldErrors)
              } else if (typeof fieldErrors === 'string') {
                errorMessages.push(fieldErrors)
              }
            })
            if (errorMessages.length > 0) {
              errorMessage = errorMessages.join(', ')
            }
          }
          // Priority 3: Check for title field
          else if (responseData.title) {
            errorMessage = responseData.title
          }
          // Priority 4: Check for errors array
          else if (responseData.errors && Array.isArray(responseData.errors)) {
            errorMessage = responseData.errors.join(', ')
          }
          // Priority 5: Check for error string
          else if (responseData.error && typeof responseData.error === 'string') {
            errorMessage = responseData.error
          }
        }
        // Check for direct message property
        else if (err.message && typeof err.message === 'string') {
          errorMessage = err.message
        }
      }

      // Nếu lỗi từ validation API, set validation error
      if (errorMessage.includes('certificate') || errorMessage.includes('chứng nhận')) {
        setValidationError(errorMessage)
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
      setValidating(false)
    }
  }

  const handleStatusChange = async (certificateId: string, isActive: boolean) => {
    try {
      setUpdatingStatus(certificateId)
      const newStatus = isActive ? 'Active' : 'Inactive'
      await productCertificateApi.updateStatus(certificateId, newStatus)
      toast.success('Cập nhật trạng thái thành công')
      fetchCertificates() // Reload danh sách
    } catch (error: unknown) {
      console.error('Error updating certificate status:', error)

      // Extract error message from backend response
      let errorMessage = 'Không thể cập nhật trạng thái'

      if (error && typeof error === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any

        // Check for axios error response structure (error.response.data)
        if (err.response?.data) {
          const responseData = err.response.data

          // Priority 1: Check for message in response.data
          if (responseData.message) {
            errorMessage = responseData.message
          }
          // Priority 2: Check for errors object (validation errors)
          else if (responseData.errors && typeof responseData.errors === 'object') {
            const errorMessages: string[] = []
            Object.keys(responseData.errors).forEach((field) => {
              const fieldErrors = responseData.errors[field]
              if (Array.isArray(fieldErrors)) {
                errorMessages.push(...fieldErrors)
              } else if (typeof fieldErrors === 'string') {
                errorMessages.push(fieldErrors)
              }
            })
            if (errorMessages.length > 0) {
              errorMessage = errorMessages.join(', ')
            }
          }
          // Priority 3: Check for title field
          else if (responseData.title) {
            errorMessage = responseData.title
          }
          // Priority 4: Check for errors array
          else if (responseData.errors && Array.isArray(responseData.errors)) {
            errorMessage = responseData.errors.join(', ')
          }
          // Priority 5: Check for error string
          else if (responseData.error && typeof responseData.error === 'string') {
            errorMessage = responseData.error
          }
        }
        // Check for direct message property
        else if (err.message && typeof err.message === 'string') {
          errorMessage = err.message
        }
      }

      toast.error(errorMessage)
    } finally {
      setUpdatingStatus(null)
    }
  }

  // Format date helper

  // Get status badge - chỉ có Active và Inactive
  const getStatusBadge = (status: string) => {
    const isActive = status?.toLowerCase() === 'active'
    return isActive ? (
      <Badge className='bg-emerald-100 text-emerald-700 font-medium flex items-center gap-1 w-fit'>
        <CheckCircle2 className='w-3 h-3' />
        Hoạt động
      </Badge>
    ) : (
      <Badge className='bg-slate-100 text-slate-600 font-medium flex items-center gap-1 w-fit'>
        <AlertCircle className='w-3 h-3' />
        Không hoạt động
      </Badge>
    )
  }

  // Check if status is Active
  const isActiveStatus = (status: string) => {
    return status?.toLowerCase() === 'active'
  }

  return (
    <Card className='border-0 shadow-sm bg-background'>
      <CardHeader className='border-b border-border bg-gradient-to-r from-slate-50 to-white px-6 py-4'>
        <CardTitle className='text-emerald-700 flex items-center gap-3 text-xl font-semibold'>
          <div className='p-2 bg-emerald-100 rounded-lg'>
            <Shield className='w-5 h-5 text-emerald-600' />
          </div>
          Chứng nhận sản phẩm
        </CardTitle>
      </CardHeader>

      <CardContent className='px-6 py-6'>
        <div className='space-y-8'>
          {/* Hiển thị thông báo khi không được phép chỉnh sửa */}
          {!canEdit && (
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
              <div className='flex items-start gap-3'>
                <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
                <div>
                  <p className='text-sm font-medium text-yellow-800 mb-1'>
                    Không thể chỉnh sửa trong trạng thái hiện tại
                  </p>
                  <p className='text-xs text-yellow-700'>
                    Sản phẩm đang được xử lý bởi hệ thống. Bạn có thể hủy để chỉnh sửa hoặc chờ kết quả duyệt.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className='bg-gradient-to-br from-slate-50 to-white border border-border rounded-lg p-6'>
            <h3 className='text-base font-semibold text-slate-900 mb-4 flex items-center gap-2'>
              <Plus className='w-5 h-5 text-emerald-600' />
              Thêm chứng nhận mới
            </h3>

            <div className='space-y-4'>
              <Label htmlFor='certificate-image' className='text-sm font-medium text-slate-700'>
                Hình ảnh chứng nhận
              </Label>

              {validating ? (
                <div className='border-2 border-emerald-200 rounded-lg p-8 bg-slate-50'>
                  <Loading text='Đang kiểm tra giấy chứng nhận...' size='md' />
                </div>
              ) : previewUrl ? (
                <div className='space-y-3'>
                  <div className='relative group'>
                    <div
                      className={`border-2 rounded-lg overflow-hidden bg-slate-50 ${validationError ? 'border-red-300' : 'border-emerald-200'
                        }`}
                    >
                      <img src={previewUrl} alt='Xem trước' className='w-full h-auto max-h-64 object-contain' />
                    </div>
                    <button
                      type='button'
                      onClick={removeSelectedFile}
                      className='absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg'
                    >
                      <X className='w-4 h-4' />
                    </button>
                  </div>
                  {validationError ? (
                    <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
                      <div className='flex items-start gap-2'>
                        <AlertCircle className='w-4 h-4 text-red-600 flex-shrink-0 mt-0.5' />
                        <div className='flex-1'>
                          <p className='text-sm font-medium text-red-800 mb-1'>Giấy chứng nhận không hợp lệ</p>
                          <p className='text-xs text-red-700'>{validationError}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='flex items-center gap-2 text-sm text-emerald-600'>
                      <CheckCircle2 className='w-4 h-4' />
                      <span className='font-medium'>{selectedFile?.name}</span>
                      <span className='text-xs text-slate-500'>
                        ({selectedFile?.size ? (selectedFile.size / 1024 / 1024).toFixed(2) : '0'} MB)
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className='border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-emerald-400 transition-colors cursor-pointer bg-slate-50/50'
                  onClick={() => {
                    if (canEdit) {
                      fileInputRef.current?.click()
                    }
                  }}
                  onDragOver={(e) => {
                    if (!canEdit) return
                    e.preventDefault()
                    e.currentTarget.classList.add('border-emerald-400', 'bg-emerald-50/50')
                  }}
                  onDragLeave={(e) => {
                    if (!canEdit) return
                    e.preventDefault()
                    e.currentTarget.classList.remove('border-emerald-400', 'bg-emerald-50/50')
                  }}
                  onDrop={(e) => {
                    if (!canEdit) {
                      e.preventDefault()
                      return
                    }
                    e.preventDefault()
                    e.currentTarget.classList.remove('border-emerald-400', 'bg-emerald-50/50')
                    const file = e.dataTransfer.files[0]
                    if (file && file.type.startsWith('image/')) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error('File quá lớn. Tối đa 5MB')
                        return
                      }
                      setSelectedFile(file)
                      setValidationError(null) // Reset validation error when new file is dropped
                      setPreviewUrl(URL.createObjectURL(file))
                    } else {
                      toast.error('File phải là hình ảnh')
                    }
                  }}
                  style={{ cursor: canEdit ? 'pointer' : 'not-allowed', opacity: canEdit ? 1 : 0.6 }}
                >
                  <ImageIcon className='w-12 h-12 text-slate-400 mx-auto mb-3' />
                  <p className='text-slate-600 mb-1 font-medium'>Kéo thả hoặc click để tải ảnh lên</p>
                  <p className='text-xs text-slate-500'>PNG, JPG tối đa 5MB</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                id='certificate-image'
                type='file'
                accept='image/*'
                onChange={handleFileChange}
                className='hidden'
              />

              <div className='flex gap-3'>
                {!previewUrl && (
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => fileInputRef.current?.click()}
                    className='flex-1 sm:flex-initial'
                    disabled={!canEdit}
                  >
                    <Upload className='w-4 h-4 mr-2' />
                    Chọn ảnh
                  </Button>
                )}
                <Button
                  onClick={handleAddCertificate}
                  disabled={!selectedFile || loading || validating || !canEdit}
                  className='flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2 transition-colors'
                >
                  {validating ? (
                    <>
                      <Clock className='w-4 h-4 animate-spin' />
                      Đang kiểm tra...
                    </>
                  ) : loading ? (
                    <>
                      <Clock className='w-4 h-4 animate-spin' />
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <Plus className='w-4 h-4' />
                      Thêm chứng nhận
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h3 className='text-base font-semibold text-slate-900 mb-4 flex items-center gap-2'>
              <FileText className='w-5 h-5 text-slate-600' />
              Chứng nhận hiện có
            </h3>

            {loading ? (
              <div className='flex items-center justify-center py-12 bg-slate-50 rounded-lg border border-dashed border-border'>
                <div className='text-center'>
                  <div className='inline-flex items-center justify-center w-10 h-10 bg-slate-200 rounded-full mb-3'>
                    <Clock className='w-5 h-5 text-slate-600 animate-spin' />
                  </div>
                  <p className='text-sm text-slate-500 font-medium'>Đang tải...</p>
                </div>
              </div>
            ) : certificates.length > 0 ? (
              <div className='space-y-3'>
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className='group border border-border rounded-lg p-5 bg-white hover:shadow-md transition-all duration-200 hover:border-emerald-200'
                  >
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-4 border-b border-slate-100'>
                      <div className='flex items-center gap-4'>
                        <div className='p-2.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors'>
                          <Shield className='w-5 h-5 text-emerald-600' />
                        </div>
                        <div>
                          <h4 className='font-semibold text-slate-900'>Chứng nhận #{cert.id.slice(0, 8)}</h4>
                          <div className='mt-2'>{getStatusBadge(cert.status)}</div>
                        </div>
                      </div>

                      <div className='flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-lg'>
                        <span className='text-sm font-medium text-slate-600'>Hoạt động:</span>
                        <Switch
                          checked={isActiveStatus(cert.status)}
                          onCheckedChange={(checked) => handleStatusChange(cert.id, checked)}
                          disabled={updatingStatus === cert.id || !canEdit}
                          className='data-[state=checked]:bg-emerald-600'
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4'>
                      <div className='space-y-3'>
                        {/* <div className='flex gap-3'>
                          <FileText size={16} className='text-slate-400 mt-0.5 flex-shrink-0' />
                          <div className='min-w-0'>
                            <span className='text-xs font-medium text-slate-500 uppercase tracking-wide'>ID</span>
                            <p className='text-sm font-medium text-slate-900 truncate'>{cert.id}</p>
                          </div>
                        </div>
                        <div className='flex gap-3'>
                          <Package size={16} className='text-slate-400 mt-0.5 flex-shrink-0' />
                          <div className='min-w-0'>
                            <span className='text-xs font-medium text-slate-500 uppercase tracking-wide'>
                              Product ID
                            </span>
                            <p className='text-sm font-medium text-slate-900 truncate'>{cert.productId}</p>
                          </div>
                        </div> */}
                        {cert.reviewedByStaffId && (
                          <div className='flex gap-3'>
                            <User size={16} className='text-slate-400 mt-0.5 flex-shrink-0' />
                            <div className='min-w-0'>
                              <span className='text-xs font-medium text-slate-500 uppercase tracking-wide'>
                                Người duyệt
                              </span>
                              <p className='text-sm font-medium text-slate-900 truncate'>{cert.reviewedByStaffId}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* <div className='space-y-3'>
                        <div className='flex gap-3'>
                          <Calendar size={16} className='text-slate-400 mt-0.5 flex-shrink-0' />
                          <div className='min-w-0'>
                            <span className='text-xs font-medium text-slate-500 uppercase tracking-wide'>Ngày nộp</span>
                            <p className='text-sm font-medium text-slate-900'>{formatDate(cert.submittedDate)}</p>
                          </div>
                        </div>
                        <div className='flex gap-3'>
                          <Calendar size={16} className='text-slate-400 mt-0.5 flex-shrink-0' />
                          <div className='min-w-0'>
                            <span className='text-xs font-medium text-slate-500 uppercase tracking-wide'>
                              Ngày quyết định
                            </span>
                            <p className='text-sm font-medium text-slate-900'>{formatDate(cert.decisionDate)}</p>
                          </div>
                        </div>
                        <div className='flex gap-3'>
                          <Clock size={16} className='text-slate-400 mt-0.5 flex-shrink-0' />
                          <div className='min-w-0'>
                            <span className='text-xs font-medium text-slate-500 uppercase tracking-wide'>Cập nhật</span>
                            <p className='text-sm font-medium text-slate-900'>{formatDate(cert.updatedAt)}</p>
                          </div>
                        </div>
                      </div> */}
                    </div>

                    {cert.staffNotes && (
                      <div className='mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200'>
                        <div className='flex gap-3'>
                          <AlertCircle size={16} className='text-amber-600 mt-0.5 flex-shrink-0' />
                          <div className='min-w-0'>
                            <span className='text-sm font-semibold text-amber-900 block mb-1'>Ghi chú từ staff:</span>
                            <p className='text-sm text-amber-800'>{cert.staffNotes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {cert.imageUrl && (
                      <div className='pt-4 border-t border-slate-100'>
                        <span className='text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3 block'>
                          Hình ảnh chứng nhận
                        </span>
                        <div className='relative group flex justify-center items-center'>
                          <div
                            className={`w-full max-w-md rounded-lg overflow-hidden border-2 border-slate-200 bg-slate-50 hover:border-emerald-300 transition-colors flex justify-center items-center min-h-[400px] py-6 px-4`}
                          >
                            <img
                              src={cert.imageUrl || '/placeholder.svg'}
                              alt='Chứng nhận'
                              className='max-w-full max-h-[700px] w-auto h-auto object-contain cursor-pointer mx-auto'
                              onClick={() => {
                                // Có thể thêm modal preview ở đây nếu cần
                                window.open(cert.imageUrl, '_blank')
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = '/placeholder-image.png'
                              }}
                            />
                          </div>
                          <div className='absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-lg pointer-events-none' />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex items-center justify-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200'>
                <div className='text-center'>
                  <div className='inline-flex items-center justify-center w-12 h-12 bg-slate-200 rounded-full mb-4'>
                    <Shield className='w-6 h-6 text-slate-500' />
                  </div>
                  <p className='text-slate-600 font-medium'>Chưa có chứng nhận nào</p>
                  <p className='text-sm text-slate-500 mt-1'>Thêm chứng nhận đầu tiên để bắt đầu</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProductCertificate
