import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  CreditCard as IdCard,
  Loader2,
  UserPlus,
  Check,
  X,
  Ban,
  Unlock,
  Package,
  Download
} from 'lucide-react'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { storeApi, type StoreResponse } from '../../../apis/store.api'
import { adminApi, type Staff, type StatusStoreRequest } from '../../../apis/admin.api'
import { getAllCombos } from '../../../apis/combo.api'
import { type Combo } from '../../../types/combo.type'
import { toast } from 'react-toastify'
import ProductModal, { type ProductWithCreatedAt } from './modalProduct'
import { exportStoreToExcel } from './excelExport'

function StoreDetailAdmin() {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const [store, setStore] = useState<StoreResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detailedError, setDetailedError] = useState<any>(null)
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'Approve' | 'Reject' | 'Ban' | 'Unban' | null>(null)
  const [reason, setReason] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [comboModalOpen, setComboModalOpen] = useState(false)
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('')

  // Combo states
  const [combos, setCombos] = useState<Combo[]>([])
  const [comboLoading, setComboLoading] = useState(false)
  const [comboError, setComboError] = useState<string | null>(null)
  const [comboCurrentPage, setComboCurrentPage] = useState(1)
  const comboItemsPerPage = 6

  const DEFAULT_STORE_LOGO = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'

  const handleApiError = (error: any, defaultMessage: string) => {
    console.error('API Error:', error)

    if (error?.response?.data) {
      const backendError = error.response.data

      if (backendError.errors && typeof backendError.errors === 'object') {
        const errorMessages: string[] = []

        Object.keys(backendError.errors).forEach((field) => {
          const fieldErrors = backendError.errors[field]
          if (Array.isArray(fieldErrors)) {
            errorMessages.push(...fieldErrors)
          } else if (typeof fieldErrors === 'string') {
            errorMessages.push(fieldErrors)
          }
        })

        if (errorMessages.length > 0) {
          return errorMessages.join(', ')
        }
      }

      if (backendError.title) {
        return backendError.title
      }

      if (backendError.message) {
        return backendError.message
      }

      if (backendError.errors && Array.isArray(backendError.errors)) {
        return backendError.errors.join(', ')
      }

      if (typeof backendError.error === 'string') {
        return backendError.error
      }
    }

    if (error?.message) {
      return error.message
    }

    return defaultMessage
  }

  const handleImagePreview = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl)
    setImagePreviewOpen(true)
  }

  const handleCloseImagePreview = () => {
    setImagePreviewOpen(false)
    setPreviewImageUrl('')
  }

  const handleExportToExcel = () => {
    if (!store) {
      toast.error('Không có dữ liệu để xuất')
      return
    }

    const result = exportStoreToExcel(store)

    if (result.success) {
      console.log('Xuất Excel thành công! File: ', result.fileName)
    } else {
      toast.error('Có lỗi xảy ra khi xuất Excel')
    }
  }

  const fetchStoreDetail = async () => {
    if (!storeId) return

    try {
      setLoading(true)
      setError(null)

      const response = await storeApi.getStoreById(storeId)
      let storeData = null

      if (response) {
        if (response.id || response.storeName) {
          storeData = response
        } else if ((response as any).data && ((response as any).data.id || (response as any).data.storeName)) {
          storeData = (response as any).data
        }
      }

      if (storeData) {
        setStore(storeData)
      } else {
        if (response && typeof response === 'object' && response !== null) {
          setStore(response)
        } else {
          setError('Không tìm thấy thông tin cửa hàng')
        }
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err, 'Có lỗi xảy ra khi tải thông tin cửa hàng')
      setError(errorMessage)
      setDetailedError(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStaffList = async () => {
    try {
      const response = await adminApi.getAllStaff()
      if (Array.isArray(response)) setStaffList(response)
      else if (response && response.data && Array.isArray(response.data)) setStaffList(response.data)
      else toast.error('Định dạng dữ liệu nhân viên không đúng')
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'Có lỗi xảy ra khi tải danh sách nhân viên')
      toast.error(errorMessage)
    }
  }

  const fetchCombos = async () => {
    if (!storeId) return

    try {
      setComboLoading(true)
      setComboError(null)

      const response = await getAllCombos({
        storeId: storeId,
        pageSize: 0,
        pageNumber: 1
      })

      setCombos(response)
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'Có lỗi xảy ra khi tải danh sách combo')
      setComboError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setComboLoading(false)
    }
  }

  useEffect(() => {
    fetchStoreDetail()
    fetchStaffList()
    fetchCombos()
  }, [storeId])

  const getStatusConfig = (status: string) => {
    const configs = {
      Approved: { text: 'Hoạt động', color: 'bg-green-500', textColor: 'text-green-700' },
      Pending: { text: 'Chờ duyệt', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
      Rejected: { text: 'Từ chối', color: 'bg-red-500', textColor: 'text-red-700' },
      Processing: { text: 'Nhân viên xử lí', color: 'bg-indigo-500', textColor: 'text-indigo-700' },
      ReviewedByStaff: { text: 'Đã duyệt bởi nhân viên', color: 'bg-purple-500', textColor: 'text-purple-700' },
      ApprovedByStaff: { text: 'Đã chấp nhận bởi nhân viên', color: 'bg-green-500', textColor: 'text-green-700' },
      RejectedByStaff: { text: 'Đã từ chối bởi nhân viên', color: 'bg-red-500', textColor: 'text-red-700' },
      Inactive: { text: 'Bị khóa', color: 'bg-red-500', textColor: 'text-red-700' }
    }
    return configs[status as keyof typeof configs] || configs.Pending
  }

  const formatDateToVietnamese = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Chưa có'

    try {
      // Format từ backend: "11:10:06 12/11/2025" hoặc các format khác
      let date: Date

      // Kiểm tra format "HH:mm:ss dd/MM/yyyy" hoặc "HH:mm:ss dd-MM-yyyy"
      const timeDateMatch = dateString.match(/(\d{1,2}):(\d{1,2}):(\d{1,2})\s+(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
      if (timeDateMatch) {
        const [, hours, minutes, seconds, day, month, year] = timeDateMatch
        date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
          parseInt(seconds)
        )
      } else {
        // Thử parse với Date constructor
        date = new Date(dateString)
      }

      // Kiểm tra date hợp lệ
      if (isNaN(date.getTime())) {
        return 'Ngày không hợp lệ'
      }

      // Format: "HH:mm dd/MM/yyyy" (bỏ giây)
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()

      return `${hours}:${minutes} ${day}/${month}/${year}`
    } catch {
      return 'Ngày không hợp lệ'
    }
  }

  const handleStatusAction = (action: 'Approve' | 'Reject' | 'Ban' | 'Unban') => {
    setSelectedAction(action)
    setReason('')
    setStatusDialogOpen(true)
  }

  const handleSaveReason = () => {
    const trimmedReason = reason.trim()

    if (!trimmedReason) {
      toast.error('Vui lòng nhập lý do')
      return
    }

    if (trimmedReason.length < 10) {
      toast.error('Lý do phải có ít nhất 10 ký tự')
      return
    }

    if (trimmedReason.length > 200) {
      toast.error('Lý do không được vượt quá 200 ký tự')
      return
    }

    setStatusDialogOpen(false)
    setConfirmDialogOpen(true)
  }

  const handleConfirmStatusUpdate = async () => {
    if (!store || !selectedAction || !reason.trim()) return

    try {
      setStatusLoading(true)
      const statusData: StatusStoreRequest = {
        action: selectedAction,
        reason: reason.trim()
      }

      const response = await adminApi.statusStore(store.id, statusData)

      if (response) {
        const actionText = {
          Approve: 'duyệt',
          Reject: 'từ chối',
          Ban: 'khóa',
          Unban: 'mở khóa'
        }
        toast.success(`Cửa hàng đã được ${actionText[selectedAction]} thành công!`)
        fetchStoreDetail()
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật trạng thái')
      }
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'Có lỗi xảy ra khi cập nhật trạng thái')
      toast.error(errorMessage)
    } finally {
      setStatusLoading(false)
      setConfirmDialogOpen(false)
      setSelectedAction(null)
      setReason('')
    }
  }

  const handleCancelStatusUpdate = () => {
    setConfirmDialogOpen(false)
    setStatusDialogOpen(false)
    setSelectedAction(null)
    setReason('')
  }

  const handleAssignStaff = () => {
    setSelectedStaffId('')
    setAssignDialogOpen(true)
  }

  const handleConfirmAssign = async () => {
    if (!store || !selectedStaffId) return

    try {
      setAssignLoading(true)
      const response = await adminApi.assignStaffToStore(store.id, selectedStaffId)
      if (response) {
        toast.success('Gán nhân viên thành công!')
        setAssignDialogOpen(false)
        fetchStoreDetail()
      } else {
        toast.error('Có lỗi xảy ra khi gán nhân viên')
      }
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'Có lỗi xảy ra khi gán nhân viên')
      toast.error(errorMessage)
    } finally {
      setAssignLoading(false)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='flex items-center gap-3 text-gray-600'>
          <Loader2 className='w-6 h-6 animate-spin text-blue-500' />
          <p>Đang tải thông tin cửa hàng...</p>
        </div>
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center max-w-md'>
          <p className='text-red-500 mb-4'>{error || 'Không tìm thấy thông tin cửa hàng'}</p>

          {detailedError && (
            <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left'>
              <h4 className='text-sm font-medium text-red-800 mb-2'>Chi tiết lỗi:</h4>
              <div className='text-xs text-red-700 space-y-1'>
                {detailedError?.response?.data?.message && (
                  <p>
                    <strong>Message:</strong> {detailedError.response.data.message}
                  </p>
                )}
                {detailedError?.response?.data?.errors && Array.isArray(detailedError.response.data.errors) && (
                  <p>
                    <strong>Validation Errors:</strong> {detailedError.response.data.errors.join(', ')}
                  </p>
                )}
                {detailedError?.response?.status && (
                  <p>
                    <strong>Status Code:</strong> {detailedError.response.status}
                  </p>
                )}
                {detailedError?.response?.statusText && (
                  <p>
                    <strong>Status Text:</strong> {detailedError.response.statusText}
                  </p>
                )}
                {detailedError?.message && (
                  <p>
                    <strong>Error Message:</strong> {detailedError.message}
                  </p>
                )}
              </div>
            </div>
          )}

          <Button onClick={() => navigate('/admin/storeManagement')} variant='outline'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Quay lại danh sách
          </Button>
        </div>
      </div>
    )
  }

  if (!store.id && !store.storeName) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-red-500 mb-4'>Dữ liệu cửa hàng không hợp lệ</p>
          <Button onClick={() => navigate('/admin/storeManagement')} variant='outline'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Quay lại danh sách
          </Button>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(store.status || 'Pending')

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-6 py-8'>
        {/* Header */}
        <div className='mb-6'>
          <Button
            onClick={() => navigate(-1 as any)}
            variant='ghost'
            className='mb-4 text-gray-600 hover:text-gray-900'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Trở về danh sách cửa hàng
          </Button>
          <div className='flex items-center justify-between'>
            <h1 className='text-2xl font-semibold text-gray-900'>Chi tiết cửa hàng</h1>
            <Button
              onClick={handleExportToExcel}
              className='bg-green-600 hover:bg-green-700 text-white'
            >
              <Download className='w-4 h-4 mr-2' />
              Xuất Excel
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Thông tin cửa hàng */}
            <Card className='border-0 shadow-sm'>
              <CardContent className='p-6'>
                <div className='flex items-start gap-4'>
                  <Avatar className='w-16 h-16 border-2 border-blue-200'>
                    <AvatarImage
                      src={store.logoUrl || DEFAULT_STORE_LOGO}
                      alt={store.storeName || 'Store logo'}
                      className='object-cover'
                    />
                    <AvatarFallback className='bg-blue-100 text-blue-600 text-lg font-medium'>
                      <Building2 className='w-8 h-8' />
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-4'>
                      <h2 className='text-xl font-semibold text-gray-900'>
                        {store.storeName || 'tên cửa hanggf chua có '}
                      </h2>
                      <div className='flex items-center gap-2'>
                        <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                        <span className={`text-sm font-medium ${statusConfig.textColor}`}>{statusConfig.text}</span>
                      </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='space-y-3'>
                        <div>
                          <span className='text-sm text-gray-500'>Địa chỉ:</span>
                          <p className='text-sm font-medium text-gray-900'>
                            {store.address || 'Chưa có thông tin địa chỉ'}
                          </p>
                        </div>
                      </div>
                      <div className='space-y-3'>
                        <div>
                          <span className='text-sm text-gray-500'>Ngày nộp đơn:</span>
                          <p className='text-sm font-medium text-gray-900'>
                            {formatDateToVietnamese(store.submittedDate)}
                          </p>
                        </div>
                        <div>
                          <span className='text-sm text-gray-500'>Ngày quyết định:</span>
                          <p className='text-sm font-medium text-gray-900'>
                            {formatDateToVietnamese(store.decisionDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className='mb-2'>
                  <Button
                    onClick={() => setProductModalOpen(true)}
                    variant='outline'
                    className='w-full border-green-200 text-green-600 hover:bg-green-50'
                  >
                    <Package className='w-4 h-4 mr-2' />
                    Xem sản phẩm ({store?.products?.length || 0})
                  </Button>
                </div>
                <div>
                  <Button
                    onClick={() => setComboModalOpen(true)}
                    variant='outline'
                    className='w-full border-purple-200 text-purple-600 hover:bg-purple-50'
                  >
                    <Package className='w-4 h-4 mr-2' />
                    Xem combo ({combos.length || 0})
                  </Button>
                </div>
              </CardContent>
            </Card>


            {/* Người đại diện pháp lý */}
            <Card className='border-0 shadow-sm'>
              <CardContent className='p-6'>
                <div className='flex items-start gap-4'>
                  <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                    <User className='w-6 h-6 text-blue-600' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-4'>Người đại diện pháp lý</h3>

                    {store.sellerInfo ? (
                      <div className='space-y-4'>
                        <div className='flex items-center gap-3'>
                          <div>
                            <p className='font-medium text-gray-900'>
                              {store.sellerInfo.userInfo.firstName} {store.sellerInfo.userInfo.lastName}
                            </p>
                          </div>
                        </div>

                        <div className='space-y-2'>
                          <div className='flex items-center gap-2 text-sm text-gray-600'>
                            <Mail className='w-4 h-4' />
                            <span>{store.sellerInfo.userInfo.email || 'Chưa có thông tin'}</span>
                          </div>
                          <div className='flex items-center gap-2 text-sm text-gray-600'>
                            <Phone className='w-4 h-4' />
                            <span>{store.sellerInfo.userInfo.phoneNumber || 'Chưa có thông tin'}</span>
                          </div>
                          <div className='flex items-center gap-2 text-sm text-gray-600'>
                            <IdCard className='w-4 h-4' />
                            <span>{store.sellerInfo.identifyCard || 'Chưa có thông tin'}</span>
                          </div>
                        </div>

                        <div>
                          <p className='text-sm font-medium text-gray-700 mb-2'>Ảnh CMND/CCCD:</p>
                          <div className='flex gap-4'>
                            <div className='text-center'>
                              <div className='w-24 h-16 border rounded-lg overflow-hidden mb-1 relative bg-gray-50'>
                                <img
                                  src={
                                    store.sellerInfo?.identifyFrontImage &&
                                      store.sellerInfo.identifyFrontImage.trim() !== '' &&
                                      store.sellerInfo.identifyFrontImage !== 'null' &&
                                      store.sellerInfo.identifyFrontImage !== 'undefined'
                                      ? store.sellerInfo.identifyFrontImage
                                      : DEFAULT_STORE_LOGO
                                  }
                                  alt='Mặt trước CMND'
                                  className='w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity'
                                  style={{ display: 'block', minHeight: '100%' }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    if (!target.src.includes(DEFAULT_STORE_LOGO)) {
                                      target.src = DEFAULT_STORE_LOGO
                                    }
                                  }}
                                  onClick={() =>
                                    handleImagePreview(
                                      store.sellerInfo?.identifyFrontImage &&
                                        store.sellerInfo.identifyFrontImage.trim() !== '' &&
                                        store.sellerInfo.identifyFrontImage !== 'null' &&
                                        store.sellerInfo.identifyFrontImage !== 'undefined'
                                        ? store.sellerInfo.identifyFrontImage
                                        : DEFAULT_STORE_LOGO
                                    )
                                  }
                                />
                              </div>
                              <p className='text-xs text-gray-500'>Mặt trước</p>
                            </div>
                            <div className='text-center'>
                              <div className='w-24 h-16 border rounded-lg overflow-hidden mb-1 relative bg-gray-50'>
                                <img
                                  src={
                                    store.sellerInfo?.identifyBackImage &&
                                      store.sellerInfo.identifyBackImage.trim() !== '' &&
                                      store.sellerInfo.identifyBackImage !== 'null' &&
                                      store.sellerInfo.identifyBackImage !== 'undefined'
                                      ? store.sellerInfo.identifyBackImage
                                      : DEFAULT_STORE_LOGO
                                  }
                                  alt='Mặt sau CMND'
                                  className='w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity'
                                  style={{ display: 'block', minHeight: '100%' }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    if (!target.src.includes(DEFAULT_STORE_LOGO)) {
                                      target.src = DEFAULT_STORE_LOGO
                                    }
                                  }}
                                  onClick={() =>
                                    handleImagePreview(
                                      store.sellerInfo?.identifyBackImage &&
                                        store.sellerInfo.identifyBackImage.trim() !== '' &&
                                        store.sellerInfo.identifyBackImage !== 'null' &&
                                        store.sellerInfo.identifyBackImage !== 'undefined'
                                        ? store.sellerInfo.identifyBackImage
                                        : DEFAULT_STORE_LOGO
                                    )
                                  }
                                />
                              </div>
                              <p className='text-xs text-gray-500'>Mặt sau</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className='space-y-4'>
                        <div className='flex items-center gap-3'>
                          <Avatar className='w-10 h-10'>
                            <AvatarFallback className='bg-gray-100 text-blue-600'>
                              {store.storeName?.charAt(0) || 'S'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='font-medium text-gray-900'>Chủ cửa hàng</p>
                          </div>
                        </div>

                        <div className='space-y-2'>
                          <div className='flex items-center gap-2 text-sm text-gray-600'>
                            <Mail className='w-4 h-4' />
                            <span>Chưa có thông tin email</span>
                          </div>
                          <div className='flex items-center gap-2 text-sm text-gray-600'>
                            <Phone className='w-4 h-4' />
                            <span>Chưa có thông tin số điện thoại</span>
                          </div>
                          <div className='flex items-center gap-2 text-sm text-gray-600'>
                            <IdCard className='w-4 h-4' />
                            <span>Chưa có thông tin CMND/CCCD</span>
                          </div>
                        </div>

                        <div>
                          <p className='text-sm font-medium text-gray-700 mb-2'>Ảnh CMND/CCCD:</p>
                          <div className='flex gap-4'>
                            <div className='text-center'>
                              <div className='w-24 h-16 border rounded-lg overflow-hidden mb-1 relative bg-gray-50'>
                                <img
                                  src={DEFAULT_STORE_LOGO}
                                  alt='Mặt trước CMND'
                                  className='w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity'
                                  style={{ display: 'block', minHeight: '100%' }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    if (!target.src.includes(DEFAULT_STORE_LOGO)) {
                                      target.src = DEFAULT_STORE_LOGO
                                    }
                                  }}
                                  onClick={() => handleImagePreview(DEFAULT_STORE_LOGO)}
                                />
                              </div>
                              <p className='text-xs text-gray-500'>Mặt trước</p>
                            </div>
                            <div className='text-center'>
                              <div className='w-24 h-16 border rounded-lg overflow-hidden mb-1 relative bg-gray-50'>
                                <img
                                  src={DEFAULT_STORE_LOGO}
                                  alt='Mặt sau CMND'
                                  className='w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity'
                                  style={{ display: 'block', minHeight: '100%' }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    if (!target.src.includes(DEFAULT_STORE_LOGO)) {
                                      target.src = DEFAULT_STORE_LOGO
                                    }
                                  }}
                                  onClick={() => handleImagePreview(DEFAULT_STORE_LOGO)}
                                />
                              </div>
                              <p className='text-xs text-gray-500'>Mặt sau</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ghi chú của Admin */}
            <Card className='border-0 shadow-sm'>
              <CardContent className='p-6'>
                <div className='flex items-start gap-4'>
                  <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
                    <User className='w-6 h-6 text-red-600' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-4'>Ghi chú của Admin</h3>

                    <div className='space-y-4'>
                      {store.adminNote ? (
                        <div>
                          <span className='text-sm text-gray-500'>Ghi chú:</span>
                          <p className='text-sm font-medium text-gray-900 bg-red-50 p-3 rounded-lg mt-1 border-l-4 border-red-200'>
                            {store.adminNote}
                          </p>
                        </div>
                      ) : (
                        <div className='text-center py-8 text-gray-500'>
                          <User className='w-12 h-12 mx-auto mb-2 text-gray-300' />
                          <p>Chưa có ghi chú từ Admin</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ghi chú của nhân viên */}
            <Card className='border-0 shadow-sm'>
              <CardContent className='p-6'>
                <div className='flex items-start gap-4'>
                  <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                    <User className='w-6 h-6 text-blue-600' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-4'>Ghi chú của nhân viên</h3>

                    <div className='space-y-4'>
                      <div>
                        <span className='text-sm text-gray-500'>Nhân viên đã đánh giá:</span>
                        <p className='text-sm font-medium text-gray-900'>{store.staffName || 'Chưa có'}</p>
                      </div>

                      <div>
                        <span className='text-sm text-gray-500'>Ngày duyệt:</span>
                        <p className='text-sm font-medium text-gray-900'>
                          {formatDateToVietnamese(store.decisionDate)}
                        </p>
                      </div>

                      {store.staffNotes && (
                        <div>
                          <span className='text-sm text-gray-500'>Ghi chú:</span>
                          <p className='text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg mt-1'>
                            {store.staffNotes}
                          </p>
                        </div>
                      )}

                      <div>
                        <span className='text-sm text-gray-500'>Ảnh chứng minh:</span>
                        <div className='mt-2'>
                          <img
                            src={store.staffImage || DEFAULT_STORE_LOGO}
                            alt='Ảnh chứng minh của nhân viên'
                            className='w-32 h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity'
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = DEFAULT_STORE_LOGO
                            }}
                            onClick={() => handleImagePreview(store.staffImage || DEFAULT_STORE_LOGO)}
                          />
                        </div>
                      </div>

                      {!store.reviewedBy && !store.staffNotes && !store.staffImage && (
                        <div className='text-center py-8 text-gray-500'>
                          <User className='w-12 h-12 mx-auto mb-2 text-gray-300' />
                          <p>Chưa có ghi chú từ nhân viên</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Panel */}
          <div className='lg:col-span-1'>
            <Card className='border-0 shadow-sm'>
              <CardContent className='p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>Hành động</h3>
                <div className='space-y-3'>
                  {store.status === 'Pending' && (
                    <Button onClick={() => handleStatusAction('Ban')} variant='destructive' className='w-full'>
                      <Ban className='w-4 h-4 mr-2' />
                      Khóa cửa hàng
                    </Button>
                  )}

                  {store.status === 'ReviewedByStaff' && (
                    <>
                      <Button
                        onClick={() => handleStatusAction('Approve')}
                        className='w-full bg-green-500 hover:bg-green-600 text-white'
                      >
                        <Check className='w-4 h-4 mr-2' />
                        Duyệt cửa hàng
                      </Button>
                      <Button onClick={() => handleStatusAction('Reject')} variant='destructive' className='w-full'>
                        <X className='w-4 h-4 mr-2' />
                        Từ chối cửa hàng
                      </Button>
                    </>
                  )}

                  {store.status === 'ApprovedByStaff' && (
                    <>
                      <Button
                        onClick={() => handleStatusAction('Approve')}
                        className='w-full bg-green-500 hover:bg-green-600 text-white'
                      >
                        <Check className='w-4 h-4 mr-2' />
                        Duyệt cửa hàng
                      </Button>
                      <Button onClick={() => handleStatusAction('Reject')} variant='destructive' className='w-full'>
                        <X className='w-4 h-4 mr-2' />
                        Từ chối cửa hàng
                      </Button>
                    </>
                  )}

                  {store.status === 'RejectedByStaff' && (
                    <div className='text-center py-4 text-gray-500'>
                      <p className='text-sm'>Cửa hàng đã bị từ chối bởi nhân viên</p>
                      <p className='text-xs mt-1'>Không có hành động khả dụng</p>
                    </div>
                  )}

                  {store.status === 'Approved' && (
                    <Button onClick={() => handleStatusAction('Ban')} variant='destructive' className='w-full'>
                      <Ban className='w-4 h-4 mr-2' />
                      Khóa cửa hàng
                    </Button>
                  )}

                  {store.status === 'Inactive' && (
                    <Button
                      onClick={() => handleStatusAction('Unban')}
                      className='w-full bg-blue-500 hover:bg-blue-600 text-white'
                    >
                      <Unlock className='w-4 h-4 mr-2' />
                      Mở khóa cửa hàng
                    </Button>
                  )}

                  {/* Nút giao cho nhân viên - hiển thị cho tất cả trạng thái */}
                  <div className='pt-3 border-t border-gray-200'>
                    <Button
                      onClick={handleAssignStaff}
                      className='w-full bg-purple-500 hover:bg-purple-600 text-white'
                    >
                      <UserPlus className='w-4 h-4 mr-2' />
                      Giao cho nhân viên
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ProductModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        products={(store?.products as ProductWithCreatedAt[]) || []}
        storeName={store?.storeName || ''}
      />

      {/* Combo Modal */}
      <Dialog open={comboModalOpen} onOpenChange={setComboModalOpen}>
        <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-gray-900'>
              <Package className='w-5 h-5 text-purple-500' />
              Danh sách Combo - {store?.storeName || 'Cửa hàng'}
            </DialogTitle>
          </DialogHeader>

          <div className='mt-4'>
            {comboLoading ? (
              <div className='flex items-center justify-center py-12'>
                <div className='flex items-center gap-3 text-gray-600'>
                  <Loader2 className='w-6 h-6 animate-spin text-purple-500' />
                  <p>Đang tải danh sách combo...</p>
                </div>
              </div>
            ) : comboError ? (
              <div className='text-center py-12'>
                <div className='text-red-500 text-lg mb-2'>⚠️</div>
                <p className='text-red-600 font-medium mb-4'>{comboError}</p>
                <Button onClick={fetchCombos} variant='outline'>
                  Thử lại
                </Button>
              </div>
            ) : combos.length > 0 ? (
              <div className='space-y-6'>
                {/* Combo Cards Grid */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {combos
                    .slice((comboCurrentPage - 1) * comboItemsPerPage, comboCurrentPage * comboItemsPerPage)
                    .map((combo) => (
                      <Card key={combo.id} className='hover:shadow-lg transition-shadow duration-200'>
                        <CardContent className='p-4'>
                          {/* Combo Header */}
                          <div className='flex items-start justify-between mb-3'>
                            <div className='flex-1'>
                              <h3 className='font-semibold text-gray-900 text-lg mb-1 line-clamp-2'>
                                {combo.name}
                              </h3>
                              <div className='flex items-center gap-2'>
                                <Badge
                                  variant='secondary'
                                  className={`text-xs ${combo.status === 'Approved'
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : combo.status === 'Pending'
                                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                      : combo.status === 'Rejected'
                                        ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                        : combo.status === 'Processing'
                                          ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                    }`}
                                >
                                  {combo.status === 'Approved'
                                    ? 'Đã duyệt'
                                    : combo.status === 'Pending'
                                      ? 'Chờ duyệt'
                                      : combo.status === 'Rejected'
                                        ? 'Từ chối'
                                        : combo.status === 'Processing'
                                          ? 'Đang xử lý'
                                          : combo.status}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Combo Description */}
                          {combo.description && (
                            <p className='text-sm text-gray-600 mb-3 line-clamp-2'>
                              {combo.description}
                            </p>
                          )}

                          {/* Combo Stats */}
                          <div className='space-y-2 mb-4'>
                            <div className='flex justify-between items-center text-sm'>
                              <span className='text-gray-500'>Số sản phẩm:</span>
                              <span className='font-medium text-gray-900'>
                                {combo.comboItems?.length || 0}
                              </span>
                            </div>
                            <div className='flex justify-between items-center text-sm'>
                              <span className='text-gray-500'>Giá gốc:</span>
                              <span className='font-semibold text-green-600'>
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND'
                                }).format(combo.totalBasePrice)}
                              </span>
                            </div>
                            <div className='flex justify-between items-center text-sm'>
                              <span className='text-gray-500'>Giá bán:</span>
                              <span className='font-semibold text-blue-600'>
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND'
                                }).format(combo.totalFinalPrice)}
                              </span>
                            </div>
                          </div>

                          {/* Combo Items Preview */}
                          {combo.comboItems && combo.comboItems.length > 0 && (
                            <div className='border-t pt-3'>
                              <p className='text-xs text-gray-500 mb-2'>Sản phẩm trong combo:</p>
                              <div className='space-y-1'>
                                {combo.comboItems.slice(0, 3).map((item, index) => (
                                  <div key={index} className='flex justify-between items-center text-xs'>
                                    <span className='text-gray-600 truncate flex-1 mr-2'>
                                      {item.comboItemName}
                                    </span>
                                    <span className='text-gray-500'>
                                      x{item.quantity}
                                    </span>
                                  </div>
                                ))}
                                {combo.comboItems.length > 3 && (
                                  <p className='text-xs text-gray-400 italic'>
                                    +{combo.comboItems.length - 3} sản phẩm khác...
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {/* Pagination */}
                {combos.length > comboItemsPerPage && (
                  <div className='flex items-center justify-between pt-4 border-t'>
                    <div className='text-sm text-gray-700'>
                      Hiển thị {(comboCurrentPage - 1) * comboItemsPerPage + 1} đến{' '}
                      {Math.min(comboCurrentPage * comboItemsPerPage, combos.length)} trong {combos.length} combo
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Button
                        onClick={() => setComboCurrentPage(comboCurrentPage - 1)}
                        disabled={comboCurrentPage === 1}
                        variant='outline'
                        size='sm'
                      >
                        Trước
                      </Button>
                      {Array.from(
                        { length: Math.ceil(combos.length / comboItemsPerPage) },
                        (_, i) => i + 1
                      ).map((page) => (
                        <Button
                          key={page}
                          onClick={() => setComboCurrentPage(page)}
                          variant={comboCurrentPage === page ? 'default' : 'outline'}
                          size='sm'
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        onClick={() => setComboCurrentPage(comboCurrentPage + 1)}
                        disabled={comboCurrentPage === Math.ceil(combos.length / comboItemsPerPage)}
                        variant='outline'
                        size='sm'
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className='text-center py-12 text-gray-500'>
                <Package size={64} className='mx-auto mb-4 text-gray-300' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>Chưa có combo nào</h3>
                <p className='text-gray-500'>Cửa hàng này chưa tạo combo nào.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Staff Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-gray-900'>
              <UserPlus className='w-5 h-5 text-purple-500' />
              Gán nhân viên cho cửa hàng
            </DialogTitle>
          </DialogHeader>
          {store && (
            <div className='space-y-4 mt-4'>
              <div className='p-4 bg-gray-50 border rounded-lg'>
                <h4 className='text-xs font-medium text-gray-500 mb-2'>Cửa hàng được chọn:</h4>
                <div className='flex items-center gap-3'>
                  <div>
                    <p className='font-medium text-sm'>{store.storeName}</p>
                    <p className='text-xs text-gray-500'>Trạng thái: {getStatusConfig(store.status).text}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-600 mb-2'>Chọn nhân viên:</label>
                {!staffList || staffList.length === 0 ? (
                  <div className='p-6 bg-gray-50 border rounded-lg text-center text-sm text-gray-500'>
                    Chưa có nhân viên nào
                  </div>
                ) : (
                  <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                    <SelectTrigger className='w-full h-[120px]'>
                      <SelectValue placeholder='Chọn nhân viên...' />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList.map((staff) => (
                        <SelectItem
                          key={staff.staffId}
                          value={staff.staffId}
                          className='hover:bg-gray-100 focus:bg-gray-100 px-2 py-2 rounded-md cursor-pointer'
                        >
                          <div className='flex items-center gap-3 w-full h-[64px]'>
                            <div className='w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center'>
                              <span className='text-sm font-semibold text-purple-600'>
                                {staff.staffName?.charAt(0)?.toUpperCase() || 'S'}
                              </span>
                            </div>

                            <div className='flex items-center gap-3 mt-3'>
                              <p className='text-sm font-medium text-gray-900'>{staff.staffName}</p>
                              <p className='text-xs text-gray-500'>{staff.email}</p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className='flex justify-end gap-3 pt-2'>
                <Button variant='outline' onClick={() => setAssignDialogOpen(false)} disabled={assignLoading}>
                  Hủy
                </Button>
                <Button
                  onClick={handleConfirmAssign}
                  disabled={!selectedStaffId || assignLoading}
                  className='bg-purple-500 hover:bg-purple-600 text-white'
                >
                  {assignLoading ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Đang gán...
                    </>
                  ) : (
                    <>
                      <UserPlus className='w-4 h-4 mr-2' />
                      Gán nhân viên
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Action Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-gray-900'>
              {selectedAction === 'Approve' && <Check className='w-5 h-5 text-green-500' />}
              {selectedAction === 'Reject' && <X className='w-5 h-5 text-red-500' />}
              {selectedAction === 'Ban' && <Ban className='w-5 h-5 text-red-500' />}
              {selectedAction === 'Unban' && <Unlock className='w-5 h-5 text-blue-500' />}
              {selectedAction === 'Approve' && 'Duyệt cửa hàng'}
              {selectedAction === 'Reject' && 'Từ chối cửa hàng'}
              {selectedAction === 'Ban' && 'Khóa cửa hàng'}
              {selectedAction === 'Unban' && 'Mở khóa cửa hàng'}
            </DialogTitle>
          </DialogHeader>
          {store && (
            <div className='space-y-4 mt-4'>
              <div className='p-4 bg-gray-50 border rounded-lg'>
                <h4 className='text-xs font-medium text-gray-500 mb-2'>Cửa hàng:</h4>
                <div className='flex items-center gap-3'>
                  <div>
                    <p className='font-medium text-sm'>{store.storeName}</p>
                    <p className='text-xs text-gray-500'>Trạng thái hiện tại: {getStatusConfig(store.status).text}</p>
                  </div>
                </div>
              </div>

              <div className='space-y-3'>
                <Label htmlFor='reason' className='text-sm font-medium text-gray-700'>
                  Lý do{' '}
                  {selectedAction === 'Approve'
                    ? 'duyệt'
                    : selectedAction === 'Reject'
                      ? 'từ chối'
                      : selectedAction === 'Ban'
                        ? 'khóa'
                        : 'mở khóa'}{' '}
                  *
                </Label>
                <Textarea
                  id='reason'
                  placeholder={`Nhập lý do ${selectedAction === 'Approve' ? 'duyệt' : selectedAction === 'Reject' ? 'từ chối' : selectedAction === 'Ban' ? 'khóa' : 'mở khóa'} cửa hàng...`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className='min-h-[100px] resize-none'
                  maxLength={200}
                />
                <div className='flex pt-3 justify-between items-center'>
                  <p className='text-xs text-gray-500'>Lý do này sẽ được gửi đến chủ cửa hàng</p>
                  <p
                    className={`text-xs ${reason.length < 10 ? 'text-red-500' : reason.length > 200 ? 'text-red-500' : 'text-gray-500'}`}
                  >
                    {reason.length}/200 ký tự
                    {reason.length < 10 && reason.length > 0 && ' (tối thiểu 10 ký tự)'}
                  </p>
                </div>
              </div>

              <div className='flex justify-end gap-3 pt-2'>
                <Button variant='outline' onClick={() => setStatusDialogOpen(false)}>
                  Hủy
                </Button>
                <Button
                  onClick={handleSaveReason}
                  disabled={!reason.trim() || reason.trim().length < 10 || reason.trim().length > 200}
                  className={
                    selectedAction === 'Approve'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : selectedAction === 'Reject' || selectedAction === 'Ban'
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }
                >
                  Lưu và tiếp tục
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-gray-900'>
              {selectedAction === 'Approve' && <Check className='w-5 h-5 text-green-500' />}
              {selectedAction === 'Reject' && <X className='w-5 h-5 text-red-500' />}
              {selectedAction === 'Ban' && <Ban className='w-5 h-5 text-red-500' />}
              {selectedAction === 'Unban' && <Unlock className='w-5 h-5 text-blue-500' />}
              Xác nhận hành động
            </DialogTitle>
          </DialogHeader>
          {store && selectedAction && (
            <div className='space-y-4 mt-4'>
              <div className='p-4 bg-gray-50 border rounded-lg'>
                <p className='text-sm text-gray-700 mb-2'>
                  Bạn có chắc chắn muốn{' '}
                  <strong>
                    {selectedAction === 'Approve'
                      ? 'duyệt'
                      : selectedAction === 'Reject'
                        ? 'từ chối'
                        : selectedAction === 'Ban'
                          ? 'khóa'
                          : 'mở khóa'}
                  </strong>{' '}
                  cửa hàng <strong>{store.storeName}</strong>?
                  {selectedAction === 'Unban' && (
                    <span className='block text-xs text-blue-600 mt-1'>
                      Cửa hàng sẽ chuyển về trạng thái "Chờ duyệt"
                    </span>
                  )}
                </p>
                <div className='mt-3 p-3 bg-white border rounded'>
                  <p className='text-xs text-gray-500 mb-1'>Lý do:</p>
                  <p className='text-sm text-gray-900'>{reason}</p>
                </div>
              </div>

              <div className='flex justify-end gap-3 pt-2'>
                <Button variant='outline' onClick={handleCancelStatusUpdate} disabled={statusLoading}>
                  Hủy
                </Button>
                <Button
                  onClick={handleConfirmStatusUpdate}
                  disabled={statusLoading}
                  className={
                    selectedAction === 'Approve'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : selectedAction === 'Reject' || selectedAction === 'Ban'
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }
                >
                  {statusLoading ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      {selectedAction === 'Approve' && <Check className='w-4 h-4 mr-2' />}
                      {selectedAction === 'Reject' && <X className='w-4 h-4 mr-2' />}
                      {selectedAction === 'Ban' && <Ban className='w-4 h-4 mr-2' />}
                      {selectedAction === 'Unban' && <Unlock className='w-4 h-4 mr-2' />}
                      Xác nhận
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      {imagePreviewOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50'
          onClick={handleCloseImagePreview}
        >
          <div className='relative max-w-4xl max-h-[90vh] p-4'>
            <button
              onClick={handleCloseImagePreview}
              className='absolute top-2 right-2 text-white hover:text-gray-300 z-10'
            >
              <X className='w-8 h-8' />
            </button>
            <img
              src={previewImageUrl}
              alt='Preview'
              className='max-w-full max-h-full object-contain rounded-lg'
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default StoreDetailAdmin