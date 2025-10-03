import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  User,
  FileText,
  Mail,
  Phone,
  CreditCard as IdCard,
  Edit,
  Lock,
  Loader2,
  UserPlus
} from 'lucide-react'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { storeApi, type StoreResponse } from '../../../apis/store.api'
import { adminApi, type Staff } from '../../../apis/admin.api'
import { toast } from 'react-toastify'

function StoreDetailAdmin() {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const [store, setStore] = useState<StoreResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Staff assignment states
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)

  const fetchStoreDetail = async () => {
    if (!storeId) return

    try {
      setLoading(true)
      setError(null)

      const response = await storeApi.getStoreById(storeId)
      console.log('API Response:', response) // Debug log

      // Xử lý response có thể có nhiều format khác nhau
      let storeData = null

      if (response) {
        // Trường hợp 1: response trực tiếp là StoreResponse
        if (response.id || response.storeName) {
          storeData = response
        }
        // Trường hợp 2: response có cấu trúc { data: StoreResponse }
        else if ((response as any).data && ((response as any).data.id || (response as any).data.storeName)) {
          storeData = (response as any).data
        }
        // Trường hợp 3: response có cấu trúc { status: 200, data: StoreResponse }
        // else if ((response as any).status && (response as any).data && ((response as any).data.id || (response as any).data.storeName)) {
        //   storeData = (response as any).data
        // }
      }

      if (storeData) {
        console.log('Setting store data:', storeData) // Debug log
        setStore(storeData)
      } else {
        console.log('No valid data found in response:', response) // Debug log
        console.log('Response type:', typeof response) // Debug log
        console.log('Response keys:', Object.keys(response || {})) // Debug log

        // Fallback: thử set response trực tiếp nếu có vẻ hợp lệ
        if (response && typeof response === 'object' && response !== null) {
          console.log('Trying to use response directly as fallback') // Debug log
          setStore(response as StoreResponse)
        } else {
          setError('Không tìm thấy thông tin cửa hàng')
        }
      }
    } catch (err: unknown) {
      console.error('API Error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải thông tin cửa hàng'
      setError(errorMessage)
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
    } catch {
      toast.error('Có lỗi xảy ra khi tải danh sách nhân viên')
    }
  }

  useEffect(() => {
    fetchStoreDetail()
    fetchStaffList()
  }, [storeId])

  const getStatusConfig = (status: string) => {
    const configs = {
      Approved: { text: 'Hoạt động', color: 'bg-green-500', textColor: 'text-green-700' },
      Pending: { text: 'Chờ duyệt', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
      Rejected: { text: 'Từ chối', color: 'bg-red-500', textColor: 'text-red-700' },
      Processing: { text: 'Nhân viên xử lí', color: 'bg-indigo-500', textColor: 'text-indigo-700' },
      ReviewedByStaff: { text: 'Đã duyệt bởi nhân viên', color: 'bg-purple-500', textColor: 'text-purple-700' }
    }
    return configs[status as keyof typeof configs] || configs.Pending
  }

  const formatDateToVietnamese = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Chưa có'

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Ngày không hợp lệ'
    }
  }

  const handleRequestEdit = () => {
    toast.info('Tính năng yêu cầu chỉnh sửa đang được phát triển')
  }

  const handleLockStore = async () => {
    if (!store) return

    try {
      // TODO: Implement lock store API
      // await storeApi.updateStoreStatus(store.id, 'Blocked', 'Cửa hàng bị khóa bởi admin')
      toast.success('Cửa hàng đã được khóa thành công')
    } catch (error) {
      toast.error('Có lỗi xảy ra khi khóa cửa hàng')
    }
  }

  const handleUpdateStatus = async (newStatus: 'Approved' | 'Rejected' | 'Blocked') => {
    if (!store) return

    try {
      const response = await adminApi.reviewStore(store.id, {
        newStatus: newStatus,
        adminFeedback: `Trạng thái được cập nhật bởi admin: ${newStatus}`
      })

      if (response.status === 200 || response.status === 202) {
        toast.success(`Cửa hàng đã được ${newStatus} thành công!`)
        // Refresh store data
        fetchStoreDetail()
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật trạng thái')
      }
    } catch (error) {
      console.error('Review store error:', error)
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái')
    }
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
        // Refresh store data
        fetchStoreDetail()
      } else {
        toast.error('Có lỗi xảy ra khi gán nhân viên')
      }
    } catch {
      toast.error('Có lỗi xảy ra khi gán nhân viên')
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
        <div className='text-center'>
          <p className='text-red-500 mb-4'>{error || 'Không tìm thấy thông tin cửa hàng'}</p>
          <Button onClick={() => navigate('/admin/storeManagement')} variant='outline'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Quay lại danh sách
          </Button>
        </div>
      </div>
    )
  }

  // Safety check: đảm bảo store có đủ thông tin cần thiết
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
            onClick={() => navigate('/admin/storeManagement')}
            variant='ghost'
            className='mb-4 text-gray-600 hover:text-gray-900'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Trở về danh sách cửa hàng
          </Button>
          <h1 className='text-2xl font-semibold text-gray-900'>Chi tiết cửa hàng</h1>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Thông tin cửa hàng */}
            <Card className='border-0 shadow-sm'>
              <CardContent className='p-6'>
                <div className='flex items-start gap-4'>
                  <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center'>
                    <Building2 className='w-8 h-8 text-blue-600' />
                  </div>
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
                            {[store.address, store.ward, store.district, store.province].filter(Boolean).join(', ') ||
                              'Chưa có thông tin địa chỉ'}
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
                              <div className='w-24 h-16 bg-gray-100 border rounded-lg flex items-center justify-center mb-1'>
                                {store.sellerInfo.identifyFrontImage ? (
                                  <img
                                    src={store.sellerInfo.identifyFrontImage}
                                    alt='Mặt trước CMND'
                                    className='w-full h-full object-cover rounded'
                                  />
                                ) : (
                                  <FileText className='w-6 h-6 text-gray-400' />
                                )}
                              </div>
                              <p className='text-xs text-gray-500'>Mặt trước</p>
                            </div>
                            <div className='text-center'>
                              <div className='w-24 h-16 bg-gray-100 border rounded-lg flex items-center justify-center mb-1'>
                                {store.sellerInfo.identifyBackImage ? (
                                  <img
                                    src={store.sellerInfo.identifyBackImage}
                                    alt='Mặt sau CMND'
                                    className='w-full h-full object-cover rounded'
                                  />
                                ) : (
                                  <FileText className='w-6 h-6 text-gray-400' />
                                )}
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
                              <div className='w-24 h-16 bg-gray-100 border rounded-lg flex items-center justify-center mb-1'>
                                <FileText className='w-6 h-6 text-gray-400' />
                              </div>
                              <p className='text-xs text-gray-500'>Mặt trước</p>
                            </div>
                            <div className='text-center'>
                              <div className='w-24 h-16 bg-gray-100 border rounded-lg flex items-center justify-center mb-1'>
                                <FileText className='w-6 h-6 text-gray-400' />
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
                      {/* Thông tin nhân viên đã review */}
                      <div>
                        <span className='text-sm text-gray-500'>Nhân viên đã đánh giá:</span>
                        <p className='text-sm font-medium text-gray-900'>{store.reviewedBy || 'Chưa có'}</p>
                      </div>

                      {/* Ngày quyết định */}
                      <div>
                        <span className='text-sm text-gray-500'>Ngày duyệt:</span>
                        <p className='text-sm font-medium text-gray-900'>
                          {formatDateToVietnamese(store.decisionDate)}
                        </p>
                      </div>

                      {/* Ghi chú của nhân viên */}
                      {store.staffNotes && (
                        <div>
                          <span className='text-sm text-gray-500'>Ghi chú:</span>
                          <p className='text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg mt-1'>
                            {store.staffNotes}
                          </p>
                        </div>
                      )}

                      {/* Phản hồi của nhân viên */}
                      {store.staffFeedback && (
                        <div>
                          <span className='text-sm text-gray-500'>Phản hồi:</span>
                          <p className='text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg mt-1'>
                            {store.staffFeedback}
                          </p>
                        </div>
                      )}

                      {/* Ảnh của nhân viên */}
                      {store.staffImage && (
                        <div>
                          <span className='text-sm text-gray-500'>Ảnh chứng minh:</span>
                          <div className='mt-2'>
                            <img
                              src={store.staffImage}
                              alt='Ảnh chứng minh của nhân viên'
                              className='w-32 h-32 object-cover rounded-lg border'
                              onClick={() => store.staffImage && window.open(store.staffImage, '_blank')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Trạng thái khi chưa có thông tin */}
                      {!store.reviewedBy && !store.staffNotes && !store.staffFeedback && !store.staffImage && (
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
                  {/* Pending: Giao cho nhân viên */}
                  {store.status === 'Pending' && (
                    <Button onClick={handleAssignStaff} className='w-full bg-purple-500 hover:bg-purple-600 text-white'>
                      <UserPlus className='w-4 h-4 mr-2' />
                      Giao cho nhân viên
                    </Button>
                  )}

                  {/* ReviewedByStaff: Approved hoặc Rejected */}
                  {store.status === 'ReviewedByStaff' && (
                    <>
                      <Button
                        onClick={() => handleUpdateStatus('Approved')}
                        className='w-full bg-green-500 hover:bg-green-600 text-white'
                      >
                        <Edit className='w-4 h-4 mr-2' />
                        Approved
                      </Button>
                      <Button onClick={() => handleUpdateStatus('Rejected')} variant='destructive' className='w-full'>
                        <Lock className='w-4 h-4 mr-2' />
                        Rejected
                      </Button>
                    </>
                  )}

                  {/* Approved: Chỉ hiện Booked (Khóa cửa hàng) */}
                  {store.status === 'Approved' && (
                    <Button onClick={handleLockStore} variant='destructive' className='w-full'>
                      <Lock className='w-4 h-4 mr-2' />
                      Khóa cửa hàng
                    </Button>
                  )}

                  {/* Các trạng thái khác: Yêu cầu chỉnh sửa và Khóa cửa hàng */}
                  {store.status !== 'Pending' && store.status !== 'ReviewedByStaff' && store.status !== 'Approved' && (
                    <>
                      <Button
                        onClick={handleRequestEdit}
                        className='w-full bg-yellow-500 hover:bg-yellow-600 text-white'
                      >
                        <Edit className='w-4 h-4 mr-2' />
                        Yêu cầu chỉnh sửa
                      </Button>
                      <Button onClick={handleLockStore} variant='destructive' className='w-full'>
                        <Lock className='w-4 h-4 mr-2' />
                        Khóa cửa hàng
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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
                            {/* Avatar tròn */}
                            <div className='w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center'>
                              <span className='text-sm font-semibold text-purple-600'>
                                {staff.staffName?.charAt(0)?.toUpperCase() || 'S'}
                              </span>
                            </div>

                            {/* Thông tin nhân viên */}
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
    </div>
  )
}

export default StoreDetailAdmin
