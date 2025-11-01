import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, ChevronLeft, ChevronRight, Loader2, UserPlus, Users, RefreshCw, ArrowUpDown } from 'lucide-react'
import { Card, CardContent } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { storeApi, type StoreResponse } from '../../../apis/store.api'
import { adminApi, type Staff } from '../../../apis/admin.api'
import { toast } from 'react-toastify'

interface Store {
  id: string
  name: string
  ownerName: string
  ownerEmail: string
  logoUrl: string
  createDate: string
  createDateTimestamp: number
  productCount: number
  status:
    | 'Approved'
    | 'Pending'
    | 'Rejected'
    | 'Processing'
    | 'ApprovedByStaff'
    | 'RejectedByStaff'
    | 'Approve'
    | 'Ban'
    | 'Unban'
    | 'Inactive'
}

function StoreManagement() {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
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

    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN')
    }

    return {
      id: apiStore.id,
      name: apiStore.storeName,
      ownerName: 'Chủ cửa hàng',
      ownerEmail: 'N/A',
      logoUrl: avatarText,
      createDate: formatDate(apiStore.createdAt),
      createDateTimestamp: new Date(apiStore.createdAt).getTime(), // THÊM MỚI
      productCount: 0,
      status: apiStore.status as Store['status']
    }
  }

  const fetchStores = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await storeApi.getAllStores({ pageSize: 100, pageNumber: 1 })
      if (response.status === 200) {
        const convertedStores = response.data.map(convertStoreResponse)
        setStores(convertedStores)
      } else {
        setError('Không thể tải danh sách cửa hàng')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải danh sách cửa hàng'
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
    fetchStores()
    fetchStaffList()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchText, statusFilter, dateFilter, sortBy])

  const getStatusConfig = (status: string) => {
    const configs = {
      Approved: { text: 'Hoạt động', dotColor: 'bg-green-500' },
      Pending: { text: 'Chờ duyệt', dotColor: 'bg-yellow-500' },
      Rejected: { text: 'Từ chối', dotColor: 'bg-red-500' },
      Processing: { text: 'Nhân viên xử lí', dotColor: 'bg-indigo-500' },
      ApprovedByStaff: { text: 'Đã duyệt bởi nhân viên', dotColor: 'bg-purple-500' },
      RejectedByStaff: { text: 'Đã từ chối bởi nhân viên', dotColor: 'bg-red-500' },
      Inactive: { text: 'Bị khóa', dotColor: 'bg-red-500' },
    }

    return configs[status as keyof typeof configs] || configs.Pending
  }

  const filteredAndSortedStores = (() => {
    // Bước 1: FILTER
    let result = stores.filter((store) => {
      const matchesSearch =
        searchText === '' ||
        store.name.toLowerCase().includes(searchText.toLowerCase()) ||
        store.ownerName.toLowerCase().includes(searchText.toLowerCase())

      const matchesStatus = statusFilter === 'all' || store.status === statusFilter

      // Filter theo ngày nếu có
      let matchesDate = true
      if (dateFilter) {
        const filterDate = new Date(dateFilter).toLocaleDateString('vi-VN')
        matchesDate = store.createDate === filterDate
      }

      return matchesSearch && matchesStatus && matchesDate
    })

    // Bước 2: SORT
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name, 'vi')
        case 'name-desc':
          return b.name.localeCompare(a.name, 'vi')
        case 'date-asc':
          return a.createDateTimestamp - b.createDateTimestamp
        case 'date-desc':
          return b.createDateTimestamp - a.createDateTimestamp
        case 'status':
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

    return result
  })()

  // CẬP NHẬT: Dùng filteredAndSortedStores thay vì filteredStores
  const totalPages = Math.ceil((filteredAndSortedStores?.length || 0) / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentStores = (filteredAndSortedStores || []).slice(startIndex, endIndex)

  const handleView = (store: Store) => {
    navigate(`/admin/storeManagement/store-detail/${store.id}`)
  }

  const handleRefresh = () => {
    fetchStores()
    fetchStaffList()
  }

  const handleAssignStaff = (store: Store) => {
    setSelectedStore(store)
    setSelectedStaffId('')
    setAssignDialogOpen(true)
  }

  const handleConfirmAssign = async () => {
    if (!selectedStore || !selectedStaffId) return
    try {
      setAssignLoading(true)
      const response = await adminApi.assignStaffToStore(selectedStore.id, selectedStaffId)
      console.log('response', response)
      if (response) {
        toast.success('Gán nhân viên thành công!')
        setAssignDialogOpen(false)
        fetchStores()
        fetchStaffList()
      } else toast.error('Có lỗi xảy ra khi gán nhân viên')
    } catch {
      toast.error('Có lỗi xảy ra khi gán nhân viên')
    } finally {
      setAssignLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 text-gray-900'>
      <div className='max-w-7xl mx-auto px-6 py-8'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-2xl font-semibold text-gray-900 mb-1'>Quản lý cửa hàng</h1>
            <p className='text-sm text-gray-500'>Quản lý và theo dõi tất cả các cửa hàng trong hệ thống</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant='outline'
            className='h-9 border-gray-300 text-gray-700 hover:bg-gray-100'
          >
            {loading ? <Loader2 className='w-4 h-4 mr-2 animate-spin' /> : <RefreshCw className='w-4 h-4 mr-2' />}
            Làm mới
          </Button>
        </div>

        {/* Search and Filter */}
        <div className='flex items-center gap-3 mb-6 flex-wrap'>
          <div className='flex-1 min-w-[250px] relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <Input
              placeholder='Tìm kiếm cửa hàng...'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className='pl-10 h-9'
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-[200px] h-9'>
              <SelectValue placeholder='Tất cả trạng thái' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả trạng thái</SelectItem>
              <SelectItem value='Approved'>Đã duyệt</SelectItem>
              <SelectItem value='Pending'>Chờ duyệt</SelectItem>
              <SelectItem value='Rejected'>Từ chối</SelectItem>
              <SelectItem value='Processing'>Xử lý</SelectItem>
              <SelectItem value='ApprovedByStaff'>Đã duyệt bởi nhân viên</SelectItem>
              <SelectItem value='RejectedByStaff'>Đã từ chối bởi nhân viên</SelectItem>
              <SelectItem value='Inactive'>Bị khóa</SelectItem>
            </SelectContent>
          </Select>

          {/* THÊM MỚI: Dropdown Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className='w-[200px] h-9'>
              <ArrowUpDown className='w-4 h-4 mr-2' />
              <SelectValue placeholder='Sắp xếp theo' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='date-desc'>Ngày tạo: Mới nhất</SelectItem>
              <SelectItem value='date-asc'>Ngày tạo: Cũ nhất</SelectItem>
              <SelectItem value='name-asc'>Tên: A → Z</SelectItem>
              <SelectItem value='name-desc'>Tên: Z → A</SelectItem>
              <SelectItem value='status'>Theo trạng thái</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            type='date'
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className='w-[160px] h-9'
            placeholder='Lọc theo ngày'
          />
        </div>

        {/* Store List */}
        <Card>
          <CardContent className='p-0'>
            {loading ? (
              <div className='flex items-center justify-center py-20 text-gray-500'>
                <Loader2 className='w-6 h-6 animate-spin text-blue-500' />
                <p className='ml-2 text-sm'>Đang tải danh sách cửa hàng...</p>
              </div>
            ) : error ? (
              <div className='flex flex-col items-center justify-center py-20 text-red-500'>
                <p className='text-sm'>{error}</p>
                <Button onClick={handleRefresh} variant='outline' size='sm' className='mt-3'>
                  Thử lại
                </Button>
              </div>
            ) : !stores || stores.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-20 text-gray-400'>
                <span className='text-2xl'>📦</span>
                <p className='text-sm mt-2'>Chưa có cửa hàng nào</p>
              </div>
            ) : filteredAndSortedStores.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-20 text-gray-400'>
                <span className='text-2xl'>🔍</span>
                <p className='text-sm mt-2'>Không tìm thấy kết quả phù hợp</p>
              </div>
            ) : (
              <>
                <div className='divide-y'>
                  {currentStores.map((store) => {
                    const statusConfig = getStatusConfig(store.status)
                    return (
                      <div key={store.id} className='px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer group'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-4 flex-1'>
                            <Avatar className='w-10 h-10 border border-gray-200'>
                              <AvatarFallback className='bg-gray-100 text-blue-500 text-sm font-medium'>
                                {store.logoUrl}
                              </AvatarFallback>
                            </Avatar>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-3 mb-1'>
                                <h3 className='font-medium text-gray-900 text-sm truncate'>{store.name}</h3>
                                <div className='flex items-center gap-1.5'>
                                  <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                                  <span className='text-xs text-gray-500'>{statusConfig.text}</span>
                                </div>
                              </div>
                              <span className='text-xs text-gray-500'>{store.createDate}</span>
                            </div>
                          </div>
                          <div className='flex items-center gap-2 '>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={(e) => {
                                e.stopPropagation()
                                handleView(store)
                              }}
                              className='h-8 w-8 p-0 flex items-center justify-center text-black hover:text-blue-600'
                              title='Xem chi tiết'
                            >
                              <Eye className='w-4 h-4' />
                            </Button>
                            {store.status === 'Pending' && (
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAssignStaff(store)
                                }}
                                className='h-8 w-8 p-0 flex items-center justify-center text-black hover:text-purple-600'
                                title='Gán nhân viên'
                              >
                                <UserPlus className='w-4 h-4' />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className='flex items-center justify-between px-6 py-4 border-t text-xs text-gray-500'>
                    <p>
                      Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredAndSortedStores?.length || 0)} của{' '}
                      {filteredAndSortedStores?.length || 0} kết quả
                    </p>
                    <div className='flex items-center gap-1'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className='w-4 h-4 mr-1' />
                        Trước
                      </Button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) pageNum = i + 1
                        else if (currentPage <= 3) pageNum = i + 1
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                        else pageNum = currentPage - 2 + i

                        return (
                          <Button
                            key={pageNum}
                            variant='ghost'
                            size='sm'
                            onClick={() => setCurrentPage(pageNum)}
                            className={`${currentPage === pageNum ? 'bg-blue-500 text-white hover:bg-blue-600 hover:text-white' : 'text-gray-600'}`}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Sau
                        <ChevronRight className='w-4 h-4 ml-1' />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-gray-900'>
              <Users className='w-5 h-5 text-blue-500' />
              Gán nhân viên cho cửa hàng
            </DialogTitle>
          </DialogHeader>
          {selectedStore && (
            <div className='space-y-4 mt-4'>
              <div className='p-4 bg-gray-50 border rounded-lg'>
                <h4 className='text-xs font-medium text-gray-500 mb-2'>Cửa hàng được chọn:</h4>
                <div className='flex items-center gap-3'>
                  <div>
                    <p className='font-medium text-sm'>{selectedStore.name}</p>
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
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Chọn nhân viên...' />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList.map((staff) => (
                        <SelectItem
                          key={staff.staffId}
                          value={staff.staffId}
                          className='hover:bg-gray-100 focus:bg-gray-100 px-2 py-2 rounded-md cursor-pointer'
                        >
                          <div className='flex items-center gap-3 w-full'>
                            <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0'>
                              <span className='text-sm font-semibold text-blue-600'>
                                {staff.staffName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className='flex flex-col'>
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
                  className='bg-blue-500 hover:bg-blue-600 text-white'
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