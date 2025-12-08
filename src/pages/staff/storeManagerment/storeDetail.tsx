import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Store,
  User,
  FileText,
  Clock,
  Edit,
  Mail,
  Phone,
  CreditCard,
  Upload as UploadIcon,
  Loader2,
  CheckCircle,
  X,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { useNavigate, useParams } from 'react-router-dom'
import { storeApi, type StoreResponse } from '../../../apis/store.api'
import { staffApi } from '../../../apis/staff.api'
import { toast } from '../../../utils/toast'
import { cn } from '../../../lib/utils'
import { formatDate, formatDateAndTime } from '../../../utils/formatDate'

function StaffStoreDetail() {
  const navigate = useNavigate()
  const { storeId } = useParams<{ storeId: string }>()
  const [store, setStore] = useState<StoreResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [newStatus, setNewStatus] = useState<'ApprovedByStaff' | 'RejectedByStaff' | ''>('')
  const [staffNotes, setStaffNotes] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [errors, setErrors] = useState<{
    newStatus?: string
    staffNotes?: string
    staffImages?: string
  }>({})

  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)

  const handleBack = () => {
    navigate(-1)
  }

  const fetchStoreDetail = async () => {
    if (!storeId) {
      setError('Không tìm thấy ID cửa hàng')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await storeApi.getStoreById(storeId)
      console.log('data', response)
      // Handle different response formats
      let storeData = null
      if (response) {
        if ('id' in response || 'storeName' in response) {
          storeData = response
        } else if ('data' in response && response.data && ('id' in response.data || 'storeName' in response.data)) {
          storeData = response.data
        }
      }

      if (storeData) {
        setStore(storeData as StoreResponse)
      } else {
        setError('Không tìm thấy thông tin cửa hàng')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải thông tin cửa hàng'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStoreDetail()
  }, [storeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReview = () => {
    if (store) {
      setReviewModalOpen(true)
      setNewStatus('')
      setStaffNotes('')
      setSelectedImages([])
      setImagePreviews([])
      setErrors({})
      setIsDragging(false)
    }
  }

  // Handle image selection and preview
  const processFiles = (files: File[]) => {
    if (files.length === 0) return

    const currentCount = selectedImages.length
    const remainingSlots = 5 - currentCount

    if (remainingSlots <= 0) {
      toast.error('Bạn chỉ có thể tải lên tối đa 5 hình ảnh')
      return
    }

    const filesToAdd = files.slice(0, remainingSlots)
    
    if (files.length > remainingSlots) {
      toast.warning(`Chỉ có thể thêm tối đa ${remainingSlots} hình ảnh nữa (tổng cộng 5 ảnh)`)
    }

    setSelectedImages((prev) => [...prev, ...filesToAdd])

    // Create previews
    const newPreviews = filesToAdd.map((file: File) => URL.createObjectURL(file))
    setImagePreviews((prev) => [...prev, ...newPreviews])
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    processFiles(fileArray)

    // Clear input
    event.target.value = ''
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Check if we're actually leaving the drop zone (not just moving to a child element)
    const currentTarget = e.currentTarget as HTMLElement
    const relatedTarget = e.relatedTarget as HTMLElement | null
    
    if (!currentTarget.contains(relatedTarget)) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('image/'))
    if (files.length === 0) {
      toast.error('Vui lòng kéo thả các file hình ảnh')
      return
    }

    processFiles(files)
  }

  // Remove image
  const removeImage = (index: number) => {
    // Cleanup URL object to prevent memory leak
    URL.revokeObjectURL(imagePreviews[index])

    const newImages = selectedImages.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)

    setSelectedImages(newImages)
    setImagePreviews(newPreviews)
  }
  const handleImagePreview = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl)
    setImagePreviewOpen(true)
  }
  const handleReviewSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!store || !storeId) return

    // Validation
    const newErrors: typeof errors = {}
    if (!newStatus) {
      newErrors.newStatus = 'Vui lòng chọn quyết định'
    }
    if (!staffNotes.trim()) {
      newErrors.staffNotes = 'Vui lòng nhập ghi chú'
    }
    if (selectedImages.length === 0) {
      newErrors.staffImages = 'Vui lòng chọn ít nhất 1 hình ảnh'
    }
    if (selectedImages.length > 5) {
      newErrors.staffImages = 'Bạn chỉ có thể tải lên tối đa 5 hình ảnh'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      setReviewLoading(true)
      setErrors({})

      const response = await staffApi.reviewStore(storeId, {
        NewStatus: newStatus as 'ApprovedByStaff' | 'RejectedByStaff',
        StaffNotes: staffNotes,
        selectedImages: selectedImages
      })

      // Check success conditions
      if (response) {
        toast.success('Đánh giá cửa hàng thành công!')
        setReviewModalOpen(false)
        setNewStatus('')
        setStaffNotes('')
        setSelectedImages([])
        setImagePreviews([])
        setIsDragging(false)
        fetchStoreDetail() // Refresh store data
      } else {
        console.error('❌ Unexpected response format:', response)
        toast.error('Không thể đánh giá cửa hàng')
      }
    } catch {
      toast.error('Có lỗi xảy ra khi đánh giá cửa hàng')
    } finally {
      setReviewLoading(false)
    }
  }


  const getStatusDisplay = (status: string) => {
    const statusMap = {
      Processing: { text: 'Đang xử lý', color: 'blue' },
      ApprovedByStaff: { text: 'Đã chấp nhận', color: 'blue' },
      RejectedByStaff: { text: 'Đã từ chối', color: 'red' },
      Approved: { text: 'Đã duyệt', color: 'blue' },
      Rejected: { text: 'Từ chối', color: 'red' },
      Active: { text: 'Hoạt động', color: 'blue' },
      Inactive: { text: 'Không hoạt động', color: 'gray' }
    }
    return statusMap[status as keyof typeof statusMap] || { text: status, color: 'gray' }
  }

  const getStoreAvatar = (storeName: string) => {
    return storeName
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getFullAddress = (store: StoreResponse) => {
    return `${store.address}, ${store.ward}, ${store.district}, ${store.province}`
  }

  const getFullName = (userInfo: { firstName?: string | null; lastName?: string | null }) => {
    const firstName = userInfo.firstName || ''
    const lastName = userInfo.lastName || ''
    return `${firstName} ${lastName}`.trim() || 'Chưa cập nhật'
  }

  const renderDateTime = (dateInput?: string | number | Date | null) => {
    const dateTime = formatDateAndTime(dateInput)
    if (!dateTime) return '-'
    return (
      <>
        {dateTime.time} {dateTime.date}
      </>
    )
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-cyan-600' />
        <span className='ml-3 text-gray-600'>Đang tải thông tin cửa hàng...</span>
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <p className='text-red-600 font-medium mb-4'>{error || 'Không tìm thấy thông tin cửa hàng'}</p>
          <Button onClick={handleBack} className='bg-cyan-600 hover:bg-cyan-700'>
            Quay lại
          </Button>
        </div>
      </div>
    )
  }

  const statusDisplay = getStatusDisplay(store.status)
  const reportCount = store.sellerInfo?.reportCount ?? 0
  const isTrustworthyStore = reportCount === 0

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <Card className='bg-gradient-to-br from-cyan-500 to-cyan-600 border-0 shadow-lg'>
        <CardContent>
          <div className='flex items-center justify-between py-4'>
            <div className='flex items-center gap-3'>
              <h2 className='text-3xl font-bold text-white m-0'>Chi tiết cửa hàng</h2>
            </div>
            <Button
              variant='outline'
              onClick={handleBack}
              className='flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white'
            >
              <ArrowLeft size={16} />
              Trở về danh sách cửa hàng
            </Button>
          </div>
          {store && <p className='text-white/90 mt-2'>{store.storeName}</p>}
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column - Main Content */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Store Information */}
          <Card className='border-l-4 border-l-blue-500 shadow-sm'>
            <CardHeader>
              <CardTitle className=' py-2 flex items-center gap-2 text-blue-600'>
                <Store size={18} />
                <span>Thông tin cửa hàng</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-start gap-4 mb-6'>
                <Avatar className='w-16 h-16 border-2 border-blue-200'>
                  {store.logoUrl ? (
                    <AvatarImage src={store.logoUrl} alt={store.storeName} className='object-cover' />
                  ) : null}
                  <AvatarFallback className='bg-blue-600 text-white text-2xl font-bold'>
                    {getStoreAvatar(store.storeName)}
                  </AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-2 flex-wrap'>
                    <h2 className='text-xl font-bold text-gray-900'>{store.storeName}</h2>
                  </div>
                  {isTrustworthyStore && (
                    <div className='flex items-center gap-2 text-sm text-green-600 p-2 rounded-lg bg-green-50 border border-green-200'>
                      <span>Cửa hàng đáng tin cậy</span>
                    </div>
                  )}
                  {!isTrustworthyStore && reportCount > 0 && (
                    <div className='flex items-center gap-2 text-sm text-red-600 p-2 rounded-lg bg-red-50 border border-red-200'>
                      <AlertTriangle className='w-4 h-4 text-red-500' />
                      <span>Bị báo cáo {reportCount} lần</span>
                    </div>
                  )}
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <div>
                    <span className='text-sm font-medium text-gray-500 block mb-1'>Tên doanh nghiệp</span>
                    <p className='font-semibold text-gray-900'>{store.sellerInfo.businessName || 'Chưa cập nhật'}</p>
                  </div>
                  <div>
                    <span className='text-sm font-medium text-gray-500 block mb-1'>Địa chỉ kinh doanh</span>
                    <p className='font-semibold text-gray-900'>{getFullAddress(store)}</p>
                  </div>
                </div>
                <div className='space-y-4'>
                  <div>
                    <span className='text-sm font-medium text-gray-500 block mb-1'>Ngày đăng ký</span>
                    <p className='font-semibold text-gray-900'>{formatDate(store.createdAt as string)}</p>
                  </div>
                  <div>
                    <span className='text-sm font-medium text-gray-500 block mb-1'>Số lượng sản phẩm</span>
                    <p className='font-semibold text-gray-900'>{store.products?.length || 0} sản phẩm</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Representative */}
          <Card className='border-l-4 border-l-blue-500 shadow-sm'>
            <CardHeader>
              <CardTitle className=' py-2 flex items-center gap-2 text-blue-600'>
                <User size={18} />
                <span>Người đại diện pháp lý</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-start gap-4 mb-6'>
                <Avatar className='w-16 h-16 border-2 border-blue-200'>
                  <AvatarImage src={store.sellerInfo.userInfo.avatar || undefined} />
                  <AvatarFallback className='bg-blue-600 text-white text-lg font-bold'>
                    {getStoreAvatar(getFullName(store.sellerInfo.userInfo))}
                  </AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                  <h3 className='text-lg font-bold text-gray-900 mb-4'>{getFullName(store.sellerInfo.userInfo)}</h3>
                  <div className='space-y-3'>
                    <div className='flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors'>
                      <Mail size={18} className='text-blue-500' />
                      <span className='text-gray-700 font-medium'>{store.sellerInfo.userInfo.email}</span>
                    </div>
                    <div className='flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors'>
                      <Phone size={18} className='text-blue-500' />
                      <span className='text-gray-700 font-medium'>
                        {store.sellerInfo.userInfo.phoneNumber || 'Chưa cập nhật'}
                      </span>
                    </div>
                    <div className='flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors'>
                      <CreditCard size={18} className='text-blue-500' />
                      <span className='text-gray-700 font-medium'>
                        {store.sellerInfo.identifyCard || 'Chưa cập nhật'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className='mt-6'>
                <p className='text-sm font-medium text-gray-700 mb-4'>Ảnh CCCD</p>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 mb-2'>Mặt trước</p>
                    {store.sellerInfo.identifyFrontImage ? (
                      <div
                        className='cursor-pointer hover:opacity-80 transition-opacity'
                        onClick={() => handleImagePreview(store.sellerInfo.identifyFrontImage!)}
                      >
                        <img
                          src={store.sellerInfo.identifyFrontImage}
                          alt='CCCD mặt trước'
                          className='w-full h-48 object-cover rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow'
                        />
                      </div>
                    ) : (
                      <div className='w-full h-48 bg-blue-50 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300'>
                        <div className='text-center'>
                          <CreditCard size={32} className='text-blue-400 mx-auto mb-2' />
                          <p className='text-xs text-blue-600 font-medium'>Chưa có ảnh</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className='text-sm font-medium text-gray-600 mb-2'>Mặt sau</p>
                    {store.sellerInfo.identifyBackImage ? (
                      <div
                        className='cursor-pointer hover:opacity-80 transition-opacity'
                        onClick={() => handleImagePreview(store.sellerInfo.identifyBackImage!)}
                      >
                        <img
                          src={store.sellerInfo.identifyBackImage}
                          alt='CCCD mặt sau'
                          className='w-full h-48 object-cover rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow'
                        />
                      </div>
                    ) : (
                      <div className='w-full h-48 bg-red-50 rounded-lg flex items-center justify-center border-2 border-dashed border-red-300'>
                        <div className='text-center'>
                          <CreditCard size={32} className='text-red-400 mx-auto mb-2' />
                          <p className='text-xs text-red-600 font-medium'>Chưa có ảnh</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Documents & Bank Account */}
          <Card className='border-l-4 border-l-blue-500 shadow-sm'>
            <CardHeader>
              <CardTitle className=' py-2 flex items-center gap-2 text-blue-600'>
                <FileText size={18} />
                <span>Giấy tờ & tài khoản pháp lý</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                {/* Certification Documents */}
                <div>
                  <h4 className='font-semibold text-gray-900 mb-4'>Giấy tờ chứng nhận</h4>
                  <div className='space-y-4'>
                    {/* Giấy phép kinh doanh */}
                    <div className='p-4 bg-gray-50 rounded-lg border border-gray-200'>
                      <div className='flex items-center gap-3 mb-3'>
                        <FileText size={18} className='text-blue-600' />
                        <span className='font-medium text-gray-700'>Giấy phép kinh doanh</span>
                      </div>
                      {store.sellerInfo?.businessLicense ? (
                        <div className='space-y-3'>
                          <p className='text-sm font-medium text-gray-600'>Ảnh giấy phép (1 ảnh)</p>
                          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                            <div
                              className='cursor-pointer hover:opacity-80 transition-opacity'
                              onClick={() => handleImagePreview(store.sellerInfo!.businessLicense!)}
                            >
                              <img
                                src={store.sellerInfo.businessLicense}
                                alt='Giấy phép kinh doanh'
                                className='w-full h-32 object-cover rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow'
                              />
                              <p className='text-xs text-center text-gray-500 font-medium' style={{ marginTop: '6%' }}>Ảnh 1</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className='text-gray-400 text-sm'>Chưa có</span>
                      )}
                    </div>
                    {/* Chứng nhận cửa hàng */}
                    <div className='p-4 bg-gray-50 rounded-lg border border-gray-200'>
                      <div className='flex items-center gap-3 mb-3'>
                        <FileText size={18} className='text-blue-600' />
                        <span className='font-medium text-gray-700'>Chứng nhận cửa hàng</span>
                      </div>
                      {store.vendorApplicationImageUrl && store.vendorApplicationImageUrl.length > 0 ? (
                        <div className='space-y-3'>
                          <p className='text-sm font-medium text-gray-600'>
                            Ảnh chứng nhận ({store.vendorApplicationImageUrl.length} ảnh)
                          </p>
                          <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                            {store.vendorApplicationImageUrl.map((imageUrl, index) => (
                              <div
                                key={index}
                                className='cursor-pointer hover:opacity-80 transition-opacity'
                                onClick={() => handleImagePreview(imageUrl)}
                              >
                                <img
                                  src={imageUrl}
                                  alt={`Chứng nhận ${index + 1}`}
                                  className='w-full h-32 object-cover rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow'
                                />
                                <p className='text-xs text-center text-gray-500 font-medium' style={{ marginTop: '6%' }}>Ảnh {index + 1}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className='text-gray-400 text-sm'>Chưa có</span>
                      )}
                    </div>
                    <div className='p-4 bg-gray-50 rounded-lg border border-gray-200'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <FileText size={18} className='text-blue-600' />
                          <span className='font-medium text-gray-700'>Mã số thuế</span>
                        </div>
                        <span className='font-semibold text-gray-900'>
                          {store.sellerInfo.taxCode || 'Chưa cập nhật'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bank Account Information */}
                <div>
                  <h4 className='font-semibold text-gray-900 mb-4'>Thông tin tài khoản ngân hàng</h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='p-4 bg-gray-50 rounded-lg border border-gray-200'>
                      <span className='text-sm font-medium text-gray-500 block mb-2'>Số tài khoản</span>
                      <p className='font-semibold text-gray-900'>
                        {store.sellerInfo.userInfo.bankAccount || 'Chưa cập nhật'}
                      </p>
                    </div>
                    <div className='p-4 bg-gray-50 rounded-lg border border-gray-200'>
                      <span className='text-sm font-medium text-gray-500 block mb-2'>Chủ tài khoản</span>
                      <p className='font-semibold text-gray-900'>{getFullName(store.sellerInfo.userInfo)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processing History */}
          <Card className='border-l-4 border-l-blue-500 shadow-sm'>
            <CardHeader>
              <CardTitle className=' py-2 flex items-center gap-2 text-blue-600'>
                <Clock size={18} />
                <span>Lịch sử xử lý</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='relative'>
                {/* Timeline line */}
                <div className='absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200'></div>

                <div className='space-y-6'>
                  {/* Đăng ký cửa hàng */}
                  <div className='relative flex items-start gap-4'>
                    <div className='relative z-10 flex-shrink-0'>
                      <div className='w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center shadow-lg border-4 border-white'>
                        <Store size={20} className='text-white' />
                      </div>
                    </div>
                    <div className='flex-1 pt-1'>
                      <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'>
                        <div className='flex items-center gap-2 mb-2'>
                          <p className='font-bold text-gray-900'>Đăng ký cửa hàng</p>
                          <Badge className='bg-gray-100 text-gray-700 hover:bg-gray-100 text-xs'>Bắt đầu</Badge>
                        </div>
                        <p className='text-sm text-gray-600 flex items-center gap-2'>
                          <Clock size={14} />
                          {renderDateTime(store.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Nộp hồ sơ */}
                  {store.submittedDate && (
                    <div className='relative flex items-start gap-4'>
                      <div className='relative z-10 flex-shrink-0'>
                        <div
                          className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-white',
                            store.decisionDate ? 'bg-gray-400' : 'bg-blue-500'
                          )}
                        >
                          <FileText size={20} className='text-white' />
                        </div>
                      </div>
                      <div className='flex-1 pt-1'>
                        <div
                          className={cn(
                            'border rounded-lg p-4 hover:shadow-md transition-shadow',
                            store.decisionDate ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                          )}
                        >
                          <div className='flex items-center gap-2 mb-2'>
                            <p className='font-bold text-gray-900'>Nộp hồ sơ</p>
                            <Badge
                              className={cn(
                                'text-xs',
                                store.decisionDate
                                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                              )}
                            >
                              {store.decisionDate ? 'Đã xử lý' : 'Đang xử lý'}
                            </Badge>
                          </div>
                          <p className='text-sm text-gray-600 flex items-center gap-2'>
                            <Clock size={14} />
                            {renderDateTime(store.submittedDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quyết định */}
                  {store.decisionDate && (
                    <div className='relative flex items-start gap-4'>
                      <div className='relative z-10 flex-shrink-0'>
                        <div className='w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white'>
                          {store.status === 'Approved' ? (
                            <CheckCircle size={20} className='text-white' />
                          ) : (
                            <X size={20} className='text-white' />
                          )}
                        </div>
                      </div>
                      <div className='flex-1 pt-1'>
                        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow'>
                          <div className='flex items-center gap-2 mb-2'>
                            <p className='font-bold text-gray-900'>
                              {store.status === 'Approved'
                                ? 'Duyệt cửa hàng thành công'
                                : store.status === 'Rejected'
                                  ? 'Từ chối duyệt cửa hàng'
                                  : 'Cập nhật trạng thái'}
                            </p>
                            <Badge className='bg-blue-100 mb-2 text-blue-700 hover:bg-blue-100 text-xs'>
                              {store.status === 'Approved'
                                ? 'Hoàn thành'
                                : store.status === 'Rejected'
                                  ? 'Từ chối'
                                  : 'Đang xử lý'}
                            </Badge>
                          </div>
                          <p className='text-sm text-gray-600 flex items-center gap-2'>
                            <Clock size={14} />
                            {renderDateTime(store.decisionDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Notes & Feedback */}
          {(store.staffNotes || store.staffImage) && (
            <Card className='border-l-4 border-l-indigo-500 shadow-sm'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-indigo-600'>
                  <FileText size={18} />
                  <span>Ghi chú của nhân viên</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {store.staffNotes && (
                    <div>
                      <h4 className='font-semibold text-gray-900 mb-3'>Ghi chú của nhân viên</h4>
                      <p className='text-gray-700 bg-indigo-50 p-4 rounded-lg border border-indigo-100'>
                        {store.staffNotes}
                      </p>
                    </div>
                  )}
                  {(() => {
                    // Xử lý cả trường hợp staffImage là string (có thể chứa nhiều URL phân cách bởi dấu phẩy) hoặc array
                    let images: string[] = []
                    
                    if (Array.isArray(store.staffImage)) {
                      // Nếu là array, filter các giá trị hợp lệ
                      images = store.staffImage.filter((img) => img && typeof img === 'string' && img.trim() !== '')
                    } else if (typeof store.staffImage === 'string' && store.staffImage.trim() !== '') {
                      // Nếu là string, kiểm tra xem có chứa dấu phẩy không (nhiều URL)
                      if (store.staffImage.includes(',')) {
                        // Split thành mảng nếu có dấu phẩy
                        images = store.staffImage
                          .split(',')
                          .map((url) => url.trim())
                          .filter((url) => url !== '')
                      } else {
                        // Nếu không có dấu phẩy, chỉ là 1 URL
                        images = [store.staffImage.trim()]
                      }
                    }
                    
                    if (images.length === 0) return null
                    
                    return (
                      <div>
                        <h4 className='font-semibold text-gray-900 mb-3'>Ảnh từ nhân viên</h4>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                          {images.map((imageUrl, index) => (
                            <div
                              key={index}
                              className='cursor-pointer hover:opacity-80 transition-opacity'
                              onClick={() => handleImagePreview(imageUrl)}
                            >
                              <img
                                src={imageUrl}
                                alt={`Ảnh từ nhân viên ${index + 1}`}
                                className='w-full h-48 object-cover rounded-lg border-2 border-indigo-200 shadow-sm hover:shadow-md transition-shadow'
                                onError={(e) => {
                                  // Xử lý lỗi khi ảnh không load được
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className='space-y-6'>
          <Card className='border-l-4 border-l-gray-400 shadow-sm'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-gray-600'>
                <Edit size={18} />
                <span>Hành động</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='p-3 bg-gray-50 rounded-lg border border-gray-200'>
                  <p className='text-gray-600 text-sm font-medium mb-1'>Trạng thái hiện tại</p>
                  <span className='text-gray-700 font-medium'>{statusDisplay.text}</span>
                </div>
                {/* Add Review button if store status allows it */}
                {store && store.status === 'Processing' && (
                  <Button
                    onClick={handleReview}
                    className='w-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2'
                    size='lg'
                  >
                    <FileText size={18} />
                    Đánh giá cửa hàng
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className='max-w-4xl'>
          <div className='text-center'>
            <img src={previewImageUrl} alt='Preview' className='w-full h-auto max-h-[70vh] object-contain rounded-lg' />
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog
        open={reviewModalOpen}
        onOpenChange={(open) => {
          setReviewModalOpen(open)
          if (!open) {
            setIsDragging(false)
            setNewStatus('')
            setStaffNotes('')
            setSelectedImages([])
            setImagePreviews([])
            setErrors({})
          }
        }}
      >
        <DialogContent className='max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden'>
          <DialogHeader className='px-6 pt-6 pb-4 flex-shrink-0'>
            <DialogTitle>Đánh giá cửa hàng: {store?.storeName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReviewSubmit} className='flex flex-col flex-1 min-h-0'>
            <div className='flex-1 overflow-y-auto px-6 space-y-6'>
            {/* Quyết định */}
            <div className='space-y-2'>
              <Label htmlFor='newStatus' className='text-sm font-medium text-gray-700'>
                Quyết định <span className='text-red-500'>*</span>
              </Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as typeof newStatus)}>
                <SelectTrigger id='newStatus' className={cn(errors.newStatus && 'border-red-500')}>
                  <SelectValue placeholder='Chọn quyết định đánh giá' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ApprovedByStaff'>Chấp nhận cửa hàng</SelectItem>
                  <SelectItem value='RejectedByStaff'>Từ chối cửa hàng</SelectItem>
                </SelectContent>
              </Select>
              {errors.newStatus && <p className='text-sm text-red-500'>{errors.newStatus}</p>}
            </div>

            {/* Ghi chú */}
            <div className='space-y-2'>
              <Label htmlFor='staffNotes' className='text-sm font-medium text-gray-700'>
                Ghi chú của nhân viên <span className='text-red-500'>*</span>
              </Label>
              <Textarea
                id='staffNotes'
                rows={4}
                placeholder='Nhập ghi chú về cửa hàng...'
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                className={cn(errors.staffNotes && 'border-red-500')}
              />
              {errors.staffNotes && <p className='text-sm text-red-500'>{errors.staffNotes}</p>}
            </div>

            {/* Hình ảnh đính kèm */}
            <div className='space-y-2'>
              <Label htmlFor='staffImages' className='text-sm font-medium text-gray-700'>
                Hình ảnh đính kèm (Bắt buộc) <span className='text-red-500'>*</span>
                {selectedImages.length > 0 && (
                  <span className='text-gray-500 font-normal ml-2'>
                    ({selectedImages.length}/5)
                  </span>
                )}
              </Label>
              <div className='space-y-4'>
                <input
                  type='file'
                  id='staffImages'
                  multiple
                  accept='image/*'
                  onChange={handleImageChange}
                  className='hidden'
                />
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('staffImages')?.click()}
                  className={cn(
                    'relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 cursor-pointer',
                    isDragging
                      ? 'border-green-500 bg-green-50 scale-[1.02]'
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100',
                    errors.staffImages && 'border-red-500 bg-red-50'
                  )}
                >
                  <div className='flex flex-col items-center justify-center gap-4 pointer-events-none'>
                    <div
                      className={cn(
                        'p-4 rounded-full transition-colors duration-200',
                        isDragging ? 'bg-green-100' : 'bg-gray-200'
                      )}
                    >
                      <UploadIcon
                        size={32}
                        className={cn(
                          'transition-colors duration-200',
                          isDragging ? 'text-green-600' : 'text-gray-600'
                        )}
                      />
                    </div>
                    <div className='text-center'>
                      <p className='text-sm font-medium text-gray-700 mb-1'>
                        {isDragging ? (
                          <span className='text-green-600'>Thả hình ảnh vào đây</span>
                        ) : (
                          <span>Kéo thả hình ảnh vào đây hoặc click để chọn</span>
                        )}
                      </p>
                      <p className='text-xs text-gray-500 mt-1'>
                        Tối đa 5 hình ảnh (JPG, PNG, GIF)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <>
                    <style>
                      {`
                        .image-preview-scroll-container::-webkit-scrollbar {
                          width: 8px;
                        }
                        .image-preview-scroll-container::-webkit-scrollbar-track {
                          background: #f1f5f9;
                          border-radius: 10px;
                        }
                        .image-preview-scroll-container::-webkit-scrollbar-thumb {
                          background: #cbd5e1;
                          border-radius: 10px;
                          border: 2px solid #f1f5f9;
                        }
                        .image-preview-scroll-container::-webkit-scrollbar-thumb:hover {
                          background: #94a3b8;
                        }
                        .image-preview-scroll-container {
                          scrollbar-width: thin;
                          scrollbar-color: #cbd5e1 #f1f5f9;
                        }
                      `}
                    </style>
                    <div
                      className='image-preview-scroll-container max-h-[200px] sm:max-h-[250px] lg:max-h-[280px] overflow-y-auto overflow-x-hidden pr-2'
                      style={{
                        scrollBehavior: 'smooth'
                      }}
                    >
                      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pb-1'>
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className='relative border border-gray-200 rounded-lg p-2 bg-gray-50 min-w-0'>
                            <div className='relative w-full aspect-square overflow-hidden rounded'>
                              <img 
                                src={preview} 
                                alt={`Preview ${index + 1}`} 
                                className='w-full h-full object-cover'
                              />
                              <button
                                type='button'
                                onClick={() => removeImage(index)}
                                className='absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-md z-10'
                              >
                                ×
                              </button>
                            </div>
                            <div className='text-xs text-gray-500 mt-2 truncate px-1'>{selectedImages[index]?.name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {errors.staffImages && <p className='text-sm text-red-500'>{errors.staffImages}</p>}
              </div>
            </div>

            </div>
            <DialogFooter className='px-6 pb-6 pt-4 border-t bg-gray-50 flex-shrink-0 rounded-b-lg'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setReviewModalOpen(false)
                  setNewStatus('')
                  setStaffNotes('')
                  setSelectedImages([])
                  setImagePreviews([])
                  setErrors({})
                  setIsDragging(false)
                }}
                disabled={reviewLoading}
              >
                Hủy
              </Button>
              <Button 
                type='submit' 
                disabled={reviewLoading} 
                className='bg-green-500 hover:bg-green-600 text-white'
              >
                {reviewLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận đánh giá'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StaffStoreDetail
