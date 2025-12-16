import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, ChevronLeft, ChevronRight, Loader2, RefreshCw, ArrowUpDown } from 'lucide-react'
import { Card, CardContent } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../../../components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { storeApi, type StoreResponse } from '../../../apis/store.api'

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

  // Helper function to parse Vietnamese date format "HH:mm:ss DD/MM/YYYY" to Date object
  const parseVietnameseDate = (dateString: string): Date => {
    if (!dateString) return new Date()
    
    // Try to parse format "HH:mm:ss DD/MM/YYYY"
    const match = dateString.match(/(\d{2}):(\d{2}):(\d{2})\s+(\d{2})\/(\d{2})\/(\d{4})/)
    if (match) {
      const [, hours, minutes, seconds, day, month, year] = match
      return new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1, // Month is 0-indexed
        parseInt(day, 10),
        parseInt(hours, 10),
        parseInt(minutes, 10),
        parseInt(seconds, 10)
      )
    }
    // Fallback to standard Date parsing
    return new Date(dateString)
  }

  const convertStoreResponse = (apiStore: StoreResponse): Store => {
    // Use submittedDate instead of createdAt
    const submittedDateObj = parseVietnameseDate(apiStore.submittedDate || apiStore.createdAt)

    return {
      id: apiStore.id,
      name: apiStore.storeName,
      ownerName: 'Chủ cửa hàng',
      ownerEmail: 'N/A',
      logoUrl: apiStore.logoUrl || '',
      createDate: apiStore.submittedDate || apiStore.createdAt,
      createDateTimestamp: submittedDateObj.getTime(),
      productCount: 0,
      status: apiStore.status as Store['status']
    }
  }

  const DEFAULT_STORE_LOGO = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'

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

  useEffect(() => {
    fetchStores()
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
      Inactive: { text: 'Bị khóa', dotColor: 'bg-red-500' }
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
                              <AvatarImage
                                src={store.logoUrl || DEFAULT_STORE_LOGO}
                                alt={store.name}
                                className='object-cover'
                              />
                              <AvatarFallback className='bg-gray-100 text-blue-500 text-sm font-medium'>
                                {store.name
                                  .split(' ')
                                  .map((word) => word.charAt(0))
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
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
    </div>
  )
}

export default StoreManagement
