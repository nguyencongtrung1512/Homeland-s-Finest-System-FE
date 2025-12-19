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
  X,
  AlertTriangle,
  Info
} from 'lucide-react'
import { toast } from '../../../utils/toast'
import { productCertificateApi } from '../../../apis/productCertificate.api'
import { n8nApi, type ValidateCertificateResponse, type CertificateData } from '../../../apis/n8n.api'
import { getCategoryLabel } from '../../../utils/certificateUtils'
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
  const [validationResult, setValidationResult] = useState<ValidateCertificateResponse | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      setValidationError(null)
      setValidationResult(null)
      setNeedsConfirmation(false)
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)

      // Tự động validate khi chọn file
      await validateFile(file)
    }
  }

  const validateFile = async (file: File) => {
    try {
      setValidating(true)
      setValidationError(null)

      const result = await n8nApi.validateCertificate(file)
      // Áp dụng logic tương tự SellerRegistration: nếu category không phải product thì hạ xuống cảnh báo
      const categoryLower = result.category?.toLowerCase()
      const rawLevel = result.level?.toLowerCase() || ''
      const effectiveLevel = categoryLower && categoryLower !== 'product' ? 'fair' : rawLevel

      setValidationResult(result)

      // Nếu level/effectiveLevel là Fair hoặc Bad, cần xác nhận
      if (effectiveLevel === 'fair' || effectiveLevel === 'bad') {
        setNeedsConfirmation(true)
      } else {
        setNeedsConfirmation(false)
      }
    } catch (error: unknown) {
      console.warn('n8n validation API error:', error)
      setValidationResult(null)
      setValidationError('Không thể kiểm tra giấy chứng nhận. Bạn vẫn có thể tiếp tục upload.')
    } finally {
      setValidating(false)
    }
  }

  const removeSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setValidationError(null)
    setValidationResult(null)
    setNeedsConfirmation(false)
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

    // Nếu cần xác nhận và chưa xác nhận, yêu cầu xác nhận
    if (needsConfirmation) {
      toast.error('Vui lòng xác nhận trước khi tiếp tục')
      return
    }

    try {
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

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmUpload = () => {
    setNeedsConfirmation(false)
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

  // Get level badge với màu sắc
  const getLevelBadge = (level: string) => {
    const levelLower = level?.toLowerCase() || ''
    if (levelLower === 'good') {
      return (
        <Badge className='bg-emerald-100 text-emerald-700 font-medium flex items-center gap-1 w-fit'>
          <CheckCircle2 className='w-3 h-3' />
          Tốt
        </Badge>
      )
    } else if (levelLower === 'fair') {
      return (
        <Badge className='bg-amber-100 text-amber-700 font-medium flex items-center gap-1 w-fit'>
          <AlertTriangle className='w-3 h-3' />
          Trung bình
        </Badge>
      )
    } else {
      return (
        <Badge className='bg-red-100 text-red-700 font-medium flex items-center gap-1 w-fit'>
          <AlertCircle className='w-3 h-3' />
          Không hợp lệ
        </Badge>
      )
    }
  }

  // Get border color theo level
  const getBorderColor = (level: string) => {
    const levelLower = level?.toLowerCase() || ''
    if (levelLower === 'good') {
      return 'border-emerald-300'
    } else if (levelLower === 'fair') {
      return 'border-amber-300'
    } else {
      return 'border-red-300'
    }
  }

  // Format certificate type name
  const formatCertificateType = (type: string) => {
    const typeMap: Record<string, string> = {
      CHUNG_NHAN_ISO_22000: 'Chứng nhận ISO 22000',
      CHUNG_NHAN_HACCP: 'Chứng nhận HACCP',
      GIAY_CHUNG_NHAN_DANG_KY_DOANH_NGHIEP: 'Giấy chứng nhận đăng ký doanh nghiệp',
      GIAY_CHUNG_NHAN_DANG_KY_HO_KINH_DOANH: 'Giấy chứng nhận đăng ký hộ kinh doanh',
      GIAY_CHUNG_NHAN_DIA_DIEM_KINH_DOANH: 'Giấy chứng nhận địa điểm kinh doanh',
      CHUNG_NHAN_OCCOP: 'Chứng nhận OCOP',
      CHUNG_NHAN_VIETGAP: 'Chứng nhận VietGAP'
    }
    return typeMap[type] || type
  }

  // Render certificate data details
  const renderCertificateData = (data: CertificateData | null, type: string) => {
    if (!data) return null

    const renderField = (label: string, value: string | number | undefined) => {
      if (!value) return null
      return (
        <div className='flex gap-2 py-1.5'>
          <span className='text-sm font-medium text-slate-600 min-w-[140px]'>{label}:</span>
          <span className='text-sm text-slate-900 flex-1'>{String(value)}</span>
        </div>
      )
    }

    const renderObjectField = (label: string, obj: Record<string, unknown> | undefined) => {
      if (!obj) return null
      return (
        <div className='mt-2 pl-4 border-l-2 border-slate-200'>
          <p className='text-sm font-semibold text-slate-700 mb-1'>{label}</p>
          {Object.entries(obj).map(([key, value]) => {
            if (!value) return null
            const formattedKey = key
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
            return (
              <div key={key} className='flex gap-2 py-1'>
                <span className='text-xs font-medium text-slate-500 min-w-[120px]'>{formattedKey}:</span>
                <span className='text-xs text-slate-700 flex-1'>{String(value)}</span>
              </div>
            )
          })}
        </div>
      )
    }

    return (
      <div className='space-y-2 text-sm'>
        {type.includes('ISO_22000') && 'so_giay_chung_nhan' in data && 'ngay_chung_nhan' in data && (
          <>
            {renderField('Tên đơn vị', 'ten_don_vi' in data ? data.ten_don_vi : undefined)}
            {renderField('Địa chỉ', 'dia_chi' in data ? data.dia_chi : undefined)}
            {renderField('Tiêu chuẩn áp dụng', 'tieu_chuan_ap_dung' in data ? data.tieu_chuan_ap_dung : undefined)}
            {renderField('Phạm vi chứng nhận', 'pham_vi_chung_nhan' in data ? data.pham_vi_chung_nhan : undefined)}
            {renderField('Số giấy chứng nhận', data.so_giay_chung_nhan)}
            {renderField('Ngày chứng nhận', data.ngay_chung_nhan)}
            {renderField('Ngày hết hạn', data.ngay_het_han)}
          </>
        )}
        {type.includes('HACCP') && 'so_chung_chi' in data && (
          <>
            {renderField('Tên đơn vị', 'ten_don_vi' in data ? data.ten_don_vi : undefined)}
            {renderField('Địa chỉ', 'dia_chi' in data ? data.dia_chi : undefined)}
            {renderField('Tiêu chuẩn áp dụng', 'tieu_chuan_ap_dung' in data ? data.tieu_chuan_ap_dung : undefined)}
            {renderField('Phạm vi chứng nhận', 'pham_vi_chung_nhan' in data ? data.pham_vi_chung_nhan : undefined)}
            {renderField('Số chứng chỉ', data.so_chung_chi)}
            {renderField('Ngày cấp', data.ngay_cap)}
            {renderField('Ngày hết hạn', data.ngay_het_han)}
          </>
        )}
        {type.includes('DOANH_NGHIEP') && 'ma_so_doanh_nghiep' in data && (
          <>
            {renderField('Tên doanh nghiệp (Tiếng Việt)', data.ten_doanh_nghiep_tieng_viet)}
            {renderField('Tên doanh nghiệp (Tiếng nước ngoài)', data.ten_doanh_nghiep_tieng_nuoc_ngoai)}
            {renderField('Tên doanh nghiệp (Viết tắt)', data.ten_doanh_nghiep_viet_tat)}
            {renderField('Mã số doanh nghiệp', data.ma_so_doanh_nghiep)}
            {renderField('Ngày đăng ký lần đầu', data.ngay_dang_ky_lan_dau)}
            {renderField('Địa chỉ trụ sở chính', data.dia_chi_tru_so_chinh)}
            {renderField('Vốn điều lệ', data.von_dieu_le)}
            {renderObjectField('Người đại diện pháp luật', data.nguoi_dai_dien_phap_luat)}
          </>
        )}
        {type.includes('HO_KINH_DOANH') && 'ten_ho_kinh_doanh' in data && (
          <>
            {renderField('Tên hộ kinh doanh', data.ten_ho_kinh_doanh)}
            {renderField('Mã số đăng ký', data.ma_so_dang_ky_ho_kinh_doanh)}
            {renderField('Ngày đăng ký lần đầu', data.ngay_dang_ky_lan_dau)}
            {renderField('Địa chỉ trụ sở', data.dia_chi_tru_so)}
            {renderField('Ngành nghề kinh doanh', data.nganh_nghe_kinh_doanh)}
            {renderField('Vốn kinh doanh', data.von_kinh_doanh)}
            {renderObjectField('Chủ hộ kinh doanh', data.chu_ho_kinh_doanh)}
          </>
        )}
        {type.includes('DIA_DIEM') && 'ten_dia_diem_kinh_doanh' in data && (
          <>
            {renderField('Tên địa điểm kinh doanh', data.ten_dia_diem_kinh_doanh)}
            {renderField('Mã số địa điểm', data.ma_so_dia_diem_kinh_doanh)}
            {renderField('Địa chỉ', data.dia_chi)}
            {renderObjectField('Người đứng đầu', data.nguoi_dung_dau)}
            {renderObjectField('Đơn vị chủ quản', data.don_vi_chu_quan)}
          </>
        )}
        {type.includes('OCCOP') && 'ten_san_pham' in data && (
          <>
            {renderField('Tên sản phẩm', data.ten_san_pham)}
            {renderField('Tên chủ thể', data.ten_chu_the)}
            {renderField('Hạng sao', data.hang_sao)}
            {renderField('Số quyết định', data.so_quyet_dinh)}
            {renderField('Năm đánh giá', data.nam_danh_gia)}
            {renderField('Tên cuộc thi', data.ten_cuoc_thi)}
            {renderField('Tỉnh/Thành phố', data.tinh_thanh_pho)}
            {renderField('Ngày hết hạn', data.ngay_het_han)}
          </>
        )}
        {type.includes('VIETGAP') && 'san_pham_duoc_chung_nhan' in data && (
          <>
            {renderField('Sản phẩm được chứng nhận', data.san_pham_duoc_chung_nhan)}
            {renderField('Tên cơ sở', data.ten_co_so)}
            {renderField('Địa chỉ vùng trồng', data.dia_chi_vung_trong)}
            {renderField('Diện tích canh tác', data.dien_tich_canh_tac)}
            {renderField('Sản lượng dự kiến', data.san_luong_du_kien)}
            {renderField('Tiêu chuẩn áp dụng', data.tieu_chuan_ap_dung)}
            {renderField('Số giấy chứng nhận', data.so_giay_chung_nhan)}
            {renderField('Hiệu lực từ ngày', data.hieu_luc_tu_ngay)}
            {renderField('Hiệu lực đến ngày', data.hieu_luc_den_ngay)}
          </>
        )}
      </div>
    )
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
                <div className='space-y-4'>
                  <div className='relative group'>
                    <div
                      className={`border-2 rounded-lg overflow-hidden bg-slate-50 ${validationResult
                        ? getBorderColor(validationResult.level)
                        : validationError
                          ? 'border-red-300'
                          : 'border-emerald-200'
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

                  {/* Hiển thị thông tin file */}
                  <div className='flex items-center gap-2 text-sm text-slate-600'>
                    <FileText className='w-4 h-4' />
                    <span className='font-medium'>{selectedFile?.name}</span>
                    <span className='text-xs text-slate-500'>
                      ({selectedFile?.size ? (selectedFile.size / 1024 / 1024).toFixed(2) : '0'} MB)
                    </span>
                  </div>

                  {/* Hiển thị kết quả validation */}
                  {validationResult && (
                    <div
                      className={`p-4 rounded-lg border-2 ${(() => {
                        const categoryLower = validationResult.category?.toLowerCase()
                        const rawLevel = validationResult.level?.toLowerCase() || ''
                        const effectiveLevel = categoryLower && categoryLower !== 'product' ? 'fair' : rawLevel
                        if (effectiveLevel === 'good') return 'bg-emerald-50 border-emerald-200'
                        if (effectiveLevel === 'fair') return 'bg-amber-50 border-amber-200'
                        return 'bg-red-50 border-red-200'
                      })()}`}
                    >
                      <div className='flex items-start justify-between mb-3'>
                        <div className='flex items-center gap-2'>
                          {(() => {
                            const categoryLower = validationResult.category?.toLowerCase()
                            const rawLevel = validationResult.level?.toLowerCase() || ''
                            const effectiveLevel = categoryLower && categoryLower !== 'product' ? 'fair' : rawLevel
                            if (effectiveLevel === 'good') return <CheckCircle2 className='w-5 h-5 text-emerald-600' />
                            if (effectiveLevel === 'fair') return <AlertTriangle className='w-5 h-5 text-amber-600' />
                            return <AlertCircle className='w-5 h-5 text-red-600' />
                          })()}
                          <div>
                            <p className='font-semibold text-slate-900'>
                              {formatCertificateType(validationResult.type)}
                            </p>
                            <div className='mt-1'>
                              {getLevelBadge(
                                (() => {
                                  const categoryLower = validationResult.category?.toLowerCase()
                                  const rawLevel = validationResult.level?.toLowerCase() || ''
                                  return categoryLower && categoryLower !== 'product' ? 'fair' : rawLevel
                                })()
                              )}
                            </div>
                            {validationResult.category && (
                              <div className='mt-1'>
                                <Badge className='bg-blue-100 text-blue-700 border-blue-300 text-xs font-medium'>
                                  {getCategoryLabel(validationResult.category)}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Cảnh báo cho Fair và Bad */}
                      {(() => {
                        const categoryLower = validationResult.category?.toLowerCase()
                        const rawLevel = validationResult.level?.toLowerCase() || ''
                        const effectiveLevel = categoryLower && categoryLower !== 'product' ? 'fair' : rawLevel
                        return effectiveLevel === 'fair' || effectiveLevel === 'bad'
                      })() && (
                          <div
                            className={`mb-3 p-3 rounded-lg ${(() => {
                              const categoryLower = validationResult.category?.toLowerCase()
                              const rawLevel = validationResult.level?.toLowerCase() || ''
                              const effectiveLevel = categoryLower && categoryLower !== 'product' ? 'fair' : rawLevel
                              return effectiveLevel === 'fair'
                                ? 'bg-amber-100 border border-amber-300'
                                : 'bg-red-100 border border-red-300'
                            })()}`}
                          >
                            <div className='flex items-start gap-2'>
                              {(() => {
                                const categoryLower = validationResult.category?.toLowerCase()
                                const rawLevel = validationResult.level?.toLowerCase() || ''
                                const effectiveLevel = categoryLower && categoryLower !== 'product' ? 'fair' : rawLevel
                                return (
                                  <AlertTriangle
                                    className={`w-4 h-4 flex-shrink-0 mt-0.5 ${effectiveLevel === 'fair' ? 'text-amber-700' : 'text-red-700'
                                      }`}
                                  />
                                )
                              })()}
                              <div className='flex-1'>
                                <p
                                  className={`text-sm font-medium mb-1 ${(() => {
                                    const categoryLower = validationResult.category?.toLowerCase()
                                    const rawLevel = validationResult.level?.toLowerCase() || ''
                                    const effectiveLevel = categoryLower && categoryLower !== 'product' ? 'fair' : rawLevel
                                    return effectiveLevel === 'fair' ? 'text-amber-900' : 'text-red-900'
                                  })()}`}
                                >
                                  {(() => {
                                    const categoryLower = validationResult.category?.toLowerCase()
                                    const rawLevel = validationResult.level?.toLowerCase() || ''
                                    const effectiveLevel = categoryLower && categoryLower !== 'product' ? 'fair' : rawLevel
                                    return effectiveLevel === 'fair'
                                      ? 'Cảnh báo: Chứng chỉ không thuộc loại được khuyến nghị'
                                      : 'Cảnh báo: Chứng chỉ có thể không hợp lệ'
                                  })()}
                                </p>
                                {validationResult.reason && (
                                  <p
                                    className={`text-xs ${(() => {
                                      const categoryLower = validationResult.category?.toLowerCase()
                                      const rawLevel = validationResult.level?.toLowerCase() || ''
                                      const effectiveLevel = categoryLower && categoryLower !== 'product' ? 'fair' : rawLevel
                                      return effectiveLevel === 'fair' ? 'text-amber-800' : 'text-red-800'
                                    })()}`}
                                  >
                                    {validationResult.reason}
                                  </p>
                                )}
                                {validationResult.category && validationResult.category.toLowerCase() !== 'product' && (
                                  <p
                                    className={`text-xs mt-1 ${(() => {
                                      const categoryLower = validationResult.category?.toLowerCase()
                                      const rawLevel = validationResult.level?.toLowerCase() || ''
                                      const effectiveLevel = categoryLower && categoryLower !== 'product' ? 'fair' : rawLevel
                                      return effectiveLevel === 'fair' ? 'text-amber-800' : 'text-red-800'
                                    })()}`}
                                  >
                                    Loại: {getCategoryLabel(validationResult.category)} (Khuyến nghị: Sản phẩm)
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Hiển thị thông tin chi tiết (kể cả khi không có data) */}
                      <div className='mt-3 pt-3 border-t border-slate-200'>
                        <p className='text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2'>
                          <Info className='w-4 h-4' />
                          Thông tin giấy tờ
                        </p>
                        <div className='bg-white rounded-lg p-3 border border-slate-200 space-y-2'>
                          <div className='text-sm text-slate-800'>
                            <p>
                              <span className='font-medium'>Loại: </span>
                              {formatCertificateType(validationResult.type)}
                            </p>
                            <p>
                              <span className='font-medium'>Mức: </span>
                              {(() => {
                                const categoryLower = validationResult.category?.toLowerCase()
                                const rawLevel = validationResult.level?.toLowerCase() || ''
                                const effectiveLevel = categoryLower && categoryLower !== 'product' ? 'fair' : rawLevel
                                return effectiveLevel === 'good'
                                  ? 'Tốt'
                                  : effectiveLevel === 'fair'
                                    ? 'Cần xem xét'
                                    : 'Không hợp lệ'
                              })()}
                            </p>
                            {validationResult.category && (
                              <p>
                                <span className='font-medium'>Danh mục: </span>
                                {getCategoryLabel(validationResult.category)}
                              </p>
                            )}
                            {validationResult.IsExpired !== undefined && (
                              <p>
                                <span className='font-medium'>Hiệu lực: </span>
                                {validationResult.IsExpired ? 'Đã hết hạn' : 'Còn hiệu lực'}
                              </p>
                            )}
                            {validationResult.reason && (
                              <p className='text-sm text-slate-700'>
                                <span className='font-medium'>Ghi chú: </span>
                                {validationResult.reason}
                              </p>
                            )}
                          </div>

                          {validationResult.data ? (
                            <div className='mt-2'>
                              {renderCertificateData(validationResult.data, validationResult.type)}
                            </div>
                          ) : (
                            <p className='text-xs text-slate-500'>Không có dữ liệu chi tiết.</p>
                          )}
                        </div>
                      </div>

                      {/* Thông báo hết hạn */}
                      {validationResult.IsExpired && (
                        <div className='mt-3 p-2 bg-red-100 border border-red-300 rounded-lg'>
                          <p className='text-xs font-medium text-red-800 flex items-center gap-1'>
                            <AlertCircle className='w-3 h-3' />
                            Chứng chỉ đã hết hạn
                          </p>
                        </div>
                      )}

                      {/* Nút xác nhận cho Fair và Bad */}
                      {needsConfirmation && (
                        <div className='mt-4 p-3 bg-slate-100 rounded-lg border border-slate-300'>
                          <p className='text-sm font-medium text-slate-800 mb-2'>
                            Bạn có chắc chắn muốn tiếp tục upload chứng chỉ này?
                          </p>
                          <Button
                            type='button'
                            onClick={handleConfirmUpload}
                            className='w-full bg-green-300 hover:bg-green-400 text-white'
                            size='sm'
                          >
                            Xác nhận và tiếp tục
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hiển thị lỗi validation nếu có */}
                  {validationError && !validationResult && (
                    <div className='p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                      <div className='flex items-start gap-2'>
                        <AlertCircle className='w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5' />
                        <div className='flex-1'>
                          <p className='text-sm font-medium text-yellow-800 mb-1'>Lưu ý</p>
                          <p className='text-xs text-yellow-700'>{validationError}</p>
                        </div>
                      </div>
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
                      setValidationError(null)
                      setValidationResult(null)
                      setNeedsConfirmation(false)
                      const url = URL.createObjectURL(file)
                      setPreviewUrl(url)
                      // Tự động validate khi drop file
                      validateFile(file)
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
                  disabled={!selectedFile || loading || validating || !canEdit || needsConfirmation}
                  className='flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
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
