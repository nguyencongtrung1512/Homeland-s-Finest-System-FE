import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Eye, ChevronLeft, ChevronRight, Loader2, UserPlus, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { storeApi, type StoreResponse } from '../../../apis/store.api'
import { adminApi, type Staff } from '../../../apis/admin.api'
import EmptyState from '../../../components/EmptyState/emptyState'
import { toast } from 'react-toastify'

// Interface cho Store hiển thị trong UI
interface Store {
  id: string
  name: string
  ownerName: string
  ownerEmail: string
  ownerAvatar: string
  createDate: string
  productCount: number
  status: 'active' | 'pending' | 'locked'
}

function StoreManagement() {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pageSize = 10

  const [staffList, setStaffList] = useState<Staff[]>([])
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)


  const convertStoreResponse = (apiStore: StoreResponse): Store => {
    const avatarText = apiStore.storeName
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)

    const statusMap: Record<string, 'active' | 'pending' | 'locked'> = {
      Approved: 'active',
      Pending: 'pending',
      Rejected: 'locked',
      Locked: 'locked'
    }

    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN')
    }

    return {
      id: apiStore.id,
      name: apiStore.storeName,
      ownerName: 'Chủ cửa hàng', // API không có thông tin owner name, có thể cần call API khác
      ownerEmail: 'N/A', // API không có thông tin owner email
      ownerAvatar: avatarText,
      createDate: formatDate(apiStore.createdAt),
      productCount: 0, // API không có thông tin product count, có thể cần call API khác
      status: statusMap[apiStore.status] || 'pending'
    }
  }

  // Function để fetch stores từ API
  const fetchStores = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await storeApi.getAllStores({
        pageSize: 100, // Lấy tất cả để có thể filter ở frontend
        pageNumber: 1
      })
      if (response.status === 200) {
        const convertedStores = response.data.map(convertStoreResponse)
        setStores(convertedStores)
      } else {
        setError('Không thể tải danh sách cửa hàng')
      }
    } catch (err: unknown) {
      console.error('Error fetching stores:', err)
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải danh sách cửa hàng'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Function để fetch staff list
  const fetchStaffList = async () => {
    try {
      const response = await adminApi.getAllStaff()
      
      // Kiểm tra xem response có phải là array không
      if (Array.isArray(response)) {
        setStaffList(response)
      } else if (response && response.data && Array.isArray(response.data)) {
        setStaffList(response.data)
      } else {
        toast.error('Định dạng dữ liệu nhân viên không đúng')
      }
    } catch (err: any) {
      toast.error('Có lỗi xảy ra khi tải danh sách nhân viên')
    }
  }

  // Load stores và staff khi component mount
  useEffect(() => {
    fetchStores()
    fetchStaffList()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusConfig = (status: string) => {
    const configs = {
      active: {
        text: 'Hoạt động',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600'
      },
      pending: {
        text: 'Chờ duyệt',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-600'
      },
      locked: {
        text: 'Bị khóa',
        bgColor: 'bg-red-100',
        textColor: 'text-red-600'
      }
    }
    return configs[status as keyof typeof configs] || configs.pending
  }

  const filteredStores = stores.filter((store) => {
    const matchesSearch =
      searchText === '' ||
      store.name.toLowerCase().includes(searchText.toLowerCase()) ||
      store.id.toLowerCase().includes(searchText.toLowerCase()) ||
      store.ownerName.toLowerCase().includes(searchText.toLowerCase())

    const matchesStatus = statusFilter === 'all' || store.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil((filteredStores?.length || 0) / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentStores = (filteredStores || []).slice(startIndex, endIndex)

  const handleView = (store: Store) => {
    navigate(`/admin/store-detail/${store.id}`)
  }

  const handleFilter = () => {
    // Filter logic here
    console.log('Filtering with:', { searchText, statusFilter, dateFilter })
  }

  const handleRefresh = () => {
    fetchStores()
    fetchStaffList()
  }

  // Function để mở dialog assign staff
  const handleAssignStaff = (store: Store) => {
    setSelectedStore(store)
    setSelectedStaffId('')
    setAssignDialogOpen(true)
  }

  // Function để assign staff cho store
  const handleConfirmAssign = async () => {
    if (!selectedStore || !selectedStaffId) return

    try {
      setAssignLoading(true)
      const response = await adminApi.assignStaffToStore(selectedStore.id, selectedStaffId)
      
      // Kiểm tra nếu response có status property
      if (response.status === 200 || response.status === 202) {
        toast.success('Gán nhân viên thành công!')
        setAssignDialogOpen(false)
        // Refresh data
        fetchStores()
        fetchStaffList()
      } 
      // Nếu response không có status property nhưng có data (thành công)
      else if (response && ((response as any).storeId || (response as any).assignedStaffId || (response as any).newStatus)) {
        toast.success('Gán nhân viên thành công!')
        setAssignDialogOpen(false)
        // Refresh data
        fetchStores()
        fetchStaffList()
      } 
      else {
        toast.error(`Có lỗi xảy ra khi gán nhân viên: ${response.message || 'Lỗi không xác định'}`)
      }
    } catch (err: any) {
      toast.error('Có lỗi xảy ra khi gán nhân viên')
    } finally {
      setAssignLoading(false)
    }
  }

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <h1 className='text-2xl font-bold text-gray-900'>Quản lý cửa hàng</h1>
        </div>
        <Button onClick={handleRefresh} disabled={loading} variant='outline' className='flex items-center gap-2'>
          {loading ? <Loader2 className='w-4 h-4 animate-spin' /> : <Search className='w-4 h-4' />}
          Làm mới
        </Button>
      </div>

      {/* Search and Filter Section */}
      <Card className='bg-white shadow-sm'>
        <CardContent className='p-6'>
          <div className='flex items-end gap-4'>
            {/* Search Bar */}
            <div className='flex-1'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Tìm kiếm</label>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                <Input
                  placeholder='Tìm kiếm theo tên cửa hàng hoặc ID...'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className='pl-10 h-10'
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className='w-48'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Trạng thái</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='h-10'>
                  <SelectValue placeholder='Tất cả trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                  <SelectItem value='active'>Hoạt động</SelectItem>
                  <SelectItem value='pending'>Chờ duyệt</SelectItem>
                  <SelectItem value='locked'>Bị khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className='w-40'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Ngày tạo</label>
              <Input
                placeholder='mm/dd/yyyy'
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className='h-10'
              />
            </div>

            {/* Filter Button */}
            <div>
              <Button
                onClick={handleFilter}
                className='bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 rounded-lg shadow-sm'
              >
                <Filter className='w-4 h-4 mr-2' />
                Lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stores List Section */}
      <Card className='bg-white shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between p-6 border-b border-gray-200'>
          <div>
            <CardTitle className='text-lg font-semibold text-gray-900'>Danh sách cửa hàng</CardTitle>
            <p className='text-sm text-gray-600 mt-1'>
              Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredStores?.length || 0)} của {filteredStores?.length || 0} cửa hàng
            </p>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='flex flex-col items-center gap-3'>
                <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
                <p className='text-gray-600'>Đang tải danh sách cửa hàng...</p>
              </div>
            </div>
          ) : error ? (
            <div className='flex items-center justify-center py-12'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
                  <span className='text-red-600 text-xl'>!</span>
                </div>
                <p className='text-red-600 font-medium'>{error}</p>
                <Button onClick={handleRefresh} variant='outline' size='sm'>
                  Thử lại
                </Button>
              </div>
            </div>
          ) : !stores || stores.length === 0 ? (
            <div className='flex items-center justify-center py-12'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center'>
                  <span className='text-gray-600 text-xl'>📦</span>
                </div>
                <p className='text-gray-600'>Chưa có cửa hàng nào</p>
              </div>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-gray-200 bg-gray-50'>
                    <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Cửa hàng</th>
                    <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Chủ sở hữu</th>
                    <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Ngày tạo</th>
                    <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Sản phẩm</th>
                    <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Trạng thái</th>
                    <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Hành động</th>
                  </tr>
                </thead>
                <tbody className='bg-white'>
                  {currentStores.map((store) => {
                    const statusConfig = getStatusConfig(store.status)

                    return (
                      <tr key={store.id} className='border-b border-gray-100 hover:bg-gray-50'>
                        <td className='px-6 py-3'>
                          <div className='flex items-center gap-3'>
                            <Avatar className='w-10 h-10'>
                              <AvatarFallback className='bg-blue-100 text-blue-600 text-sm font-semibold'>
                                {store.ownerAvatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className='font-medium text-gray-900 text-sm'>{store.name}</p>
                              <p className='text-xs text-gray-600'>#{store.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-3'>
                          <div>
                            <p className='font-medium text-gray-900 text-sm'>{store.ownerName}</p>
                            <p className='text-xs text-gray-600'>{store.ownerEmail}</p>
                          </div>
                        </td>
                        <td className='px-6 py-3'>
                          <span className='text-sm text-gray-700'>{store.createDate}</span>
                        </td>
                        <td className='px-6 py-3'>
                          <span className='text-sm text-gray-700'>{store.productCount}</span>
                        </td>
                        <td className='px-6 py-3'>
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
                          >
                            {statusConfig.text}
                          </div>
                        </td>
                        <td className='px-6 py-3'>
                          <div className='flex items-center gap-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleView(store)}
                              className='h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full'
                              title='Xem chi tiết'
                            >
                              <Eye size={16} />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleAssignStaff(store)}
                              className='h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full'
                              title='Gán nhân viên'
                            >
                              <UserPlus size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination - chỉ hiển thị khi có dữ liệu */}
          {!loading && !error && stores && stores.length > 0 && (
            <div className='flex items-center justify-between px-6 py-4 border-t border-gray-200'>
              <p className='text-sm text-gray-600'>
                Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredStores?.length || 0)} của {filteredStores?.length || 0} kết
                quả
              </p>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className='h-8 px-3 flex items-center gap-1'
                >
                  <ChevronLeft className='w-4 h-4' />
                  Trước
                </Button>
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-blue-600 text-white' : ''}`}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className='h-8 px-3 flex items-center gap-1'
                >
                  Sau
                  <ChevronRight className='w-4 h-4' />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog để assign staff */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Users className='w-5 h-5 text-green-600' />
              Gán nhân viên cho cửa hàng
            </DialogTitle>
          </DialogHeader>
          
          {selectedStore && (
            <div className='space-y-4'>
              {/* Thông tin cửa hàng */}
              <div className='p-4 bg-gray-50 rounded-lg'>
                <h4 className='font-medium text-gray-900 mb-2'>Cửa hàng được chọn:</h4>
                <div className='flex items-center gap-3'>
                  <Avatar className='w-8 h-8'>
                    <AvatarFallback className='bg-blue-100 text-blue-600 text-xs font-semibold'>
                      {selectedStore.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='font-medium text-sm'>{selectedStore.name}</p>
                    <p className='text-xs text-gray-600'>#{selectedStore.id}</p>
                  </div>
                </div>
              </div>

              {/* Chọn nhân viên */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Chọn nhân viên:
                </label>
                {!staffList || staffList.length === 0 ? (
                  <EmptyState 
                    type='users' 
                    title='Chưa có nhân viên nào'
                    description='Vui lòng thêm nhân viên trước khi gán cho cửa hàng'
                    showAction={false}
                    className='border-0 shadow-none'
                  />
                ) : (
                  <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Chọn nhân viên...' />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList.map((staff) => (
                        <SelectItem key={staff.staffId} value={staff.staffId}>
                          <div className='flex items-center gap-2'>
                            <div className='w-6 h-6 bg-green-100 rounded-full flex items-center justify-center'>
                              <span className='text-xs font-medium text-green-600'>
                                {staff.staffName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className='font-medium text-sm'>{staff.staffName}</p>
                              <p className='text-xs text-gray-500'>{staff.email}</p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Buttons */}
              <div className='flex items-center justify-end gap-3 pt-4'>
                <Button
                  variant='outline'
                  onClick={() => setAssignDialogOpen(false)}
                  disabled={assignLoading}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleConfirmAssign}
                  disabled={!selectedStaffId || assignLoading}
                  className='bg-green-600 hover:bg-green-700 text-white'
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

export default StoreManagement
