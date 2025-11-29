import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  UserX,
  Eye,
  Building2,
  Phone,
  Calendar as CalendarIcon,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ban
} from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { Label } from '../../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../../components/ui/dialog'
import { Badge } from '../../../components/ui/badge'
import { sellerApi, type SellerInfo } from '../../../apis/seller.api'
import { updateUser } from '../../../apis/user.api'
import { toast } from '../../../utils/toast'
import Pagination from '../../../components/Pagination/Pagination'

function SellerManagement() {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [allSellers, setAllSellers] = useState<SellerInfo[]>([]) // Tất cả sellers từ API
  const [filteredSellers, setFilteredSellers] = useState<SellerInfo[]>([]) // Sellers sau khi filter
  const [paginatedSellers, setPaginatedSellers] = useState<SellerInfo[]>([]) // Sellers cho trang hiện tại
  const [selectedSeller, setSelectedSeller] = useState<SellerInfo | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(1)

  // Lock/Delete states
  const [showLockConfirm, setShowLockConfirm] = useState(false)
  const [sellerToLock, setSellerToLock] = useState<SellerInfo | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Ban states
  const [showBanModal, setShowBanModal] = useState(false)
  const [sellerToBan, setSellerToBan] = useState<SellerInfo | null>(null)
  const [banType, setBanType] = useState<'permanent' | 'temporary'>('permanent')
  const [banUntilDate, setBanUntilDate] = useState<Date | undefined>(undefined)
  const [banUntilOpen, setBanUntilOpen] = useState(false)

  // Date filter states
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [dateFromOpen, setDateFromOpen] = useState(false)
  const [dateToOpen, setDateToOpen] = useState(false)

  // Fetch sellers data từ API
  const fetchSellers = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        search: searchText || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
      }

      const response = await sellerApi.getAllSellers(params)

      // Debug: Log the response structure
      console.log('API Response:', response)

      // Check if response and data exist
      if (response && response.data && Array.isArray(response.data)) {
        setAllSellers(response.data)
      } else if (response && Array.isArray(response)) {
        // If response is directly an array (fallback)
        setAllSellers(response)
      } else {
        console.warn('Invalid response structure:', response)
        setAllSellers([])
        toast.warning('Dữ liệu trả về không đúng định dạng')
      }
    } catch (error) {
      console.error('Error fetching sellers:', error)
      setAllSellers([])
      toast.error('Không thể tải danh sách seller')
    } finally {
      setLoading(false)
    }
  }, [searchText, statusFilter])

  // Filter sellers dựa trên search, status và date range
  const applyFilters = useCallback(() => {
    let filtered = [...allSellers]

    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase()
      filtered = filtered.filter(
        (seller) =>
          seller.firstName.toLowerCase().includes(searchLower) ||
          seller.lastName.toLowerCase().includes(searchLower) ||
          seller.email.toLowerCase().includes(searchLower) ||
          seller.phoneNumber.includes(searchText) ||
          seller.businessName.toLowerCase().includes(searchLower)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((seller) => (statusFilter === 'active' ? seller.isActive : !seller.isActive))
    }

    // Apply date range filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter((seller) => {
        const sellerDate = new Date(seller.createdAt)
        sellerDate.setHours(0, 0, 0, 0)

        if (dateFrom && dateTo) {
          const from = new Date(dateFrom)
          from.setHours(0, 0, 0, 0)
          const to = new Date(dateTo)
          to.setHours(23, 59, 59, 999)
          return sellerDate >= from && sellerDate <= to
        } else if (dateFrom) {
          const from = new Date(dateFrom)
          from.setHours(0, 0, 0, 0)
          return sellerDate >= from
        } else if (dateTo) {
          const to = new Date(dateTo)
          to.setHours(23, 59, 59, 999)
          return sellerDate <= to
        }
        return true
      })
    }

    setFilteredSellers(filtered)
    setCurrentPage(1) // Reset về trang đầu khi filter
  }, [allSellers, searchText, statusFilter, dateFrom, dateTo])

  // Paginate filtered sellers
  const paginateSellers = useCallback(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginated = filteredSellers.slice(startIndex, endIndex)

    setPaginatedSellers(paginated)
    setTotalPages(Math.ceil(filteredSellers.length / pageSize))
  }, [filteredSellers, currentPage, pageSize])

  // Handle search
  const handleSearch = () => {
    applyFilters()
  }

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setStatusFilter(value)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle view detail
  const handleViewDetail = async (sellerId: string) => {
    try {
      const response = await sellerApi.getSellerDetail(sellerId)
      console.log('Response:', response)
      setSelectedSeller(response.data)
      setShowDetailModal(true)
    } catch (error) {
      console.error('Error fetching seller detail:', error)
      toast.error('Không thể tải thông tin chi tiết người bán')
    }
  }

  const confirmLock = async () => {
    if (sellerToLock) {
      setActionLoading(true)
      try {
        await updateUser(sellerToLock.id, {
          isPermission: false,
          role: 'Seller' // Thêm role để API biết cách lấy thông tin hiện tại
        })

        toast.success(`Đã khóa quyền hạn của ${sellerToLock.firstName} ${sellerToLock.lastName}`, {
          position: 'top-right',
          autoClose: 3000
        })

        // Refresh data
        await fetchSellers()
      } catch (err: unknown) {
        const error = err as { message?: string }
        const errorMessage = error.message || 'Có lỗi xảy ra khi khóa quyền hạn'
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 5000
        })
      } finally {
        setActionLoading(false)
        setShowLockConfirm(false)
        setSellerToLock(null)
      }
    }
  }

  // Handle ban
  const handleBan = (seller: SellerInfo) => {
    setSellerToBan(seller)
    setBanType('permanent')
    setBanUntilDate(undefined)
    setShowBanModal(true)
  }

  const confirmBan = async () => {
    if (sellerToBan) {
      setActionLoading(true)
      try {
        const now = new Date().toISOString()
        const banAt = now
        let banUntil = ''

        if (banType === 'temporary' && banUntilDate) {
          // Ban có thời hạn
          banUntil = banUntilDate.toISOString()
        } else {
          // Ban vĩnh viễn - banUntil để rỗng
          banUntil = ''
        }

        // Khi ban: tự động set isActive = false
        await updateUser(sellerToBan.id, {
          banAt,
          banUntil,
          isActive: false, // Tự động set isActive = false khi ban
          role: 'Seller'
        })

        toast.success(
          `Đã ${banType === 'permanent' ? 'cấm vĩnh viễn' : 'cấm có thời hạn'} ${sellerToBan.firstName} ${sellerToBan.lastName}`,
          {
            position: 'top-right',
            autoClose: 3000
          }
        )

        // Refresh data
        await fetchSellers()
        setShowBanModal(false)
        setSellerToBan(null)
        setBanType('permanent')
        setBanUntilDate(undefined)
      } catch (err: unknown) {
        const error = err as { message?: string }
        const errorMessage = error.message || 'Có lỗi xảy ra khi cấm người bán'
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 5000
        })
      } finally {
        setActionLoading(false)
      }
    }
  }

  // Handle unban
  const handleUnban = async (seller: SellerInfo) => {
    setActionLoading(true)
    try {
      // Khi unban: tự động set isActive = true và gửi banAt = '', banUntil = ''
      await updateUser(seller.id, {
        banAt: '',
        banUntil: '',
        isActive: true, // Tự động set isActive = true khi unban
        role: 'Seller'
      })

      toast.success(`Đã mở khóa ${seller.firstName} ${seller.lastName}`, {
        position: 'top-right',
        autoClose: 3000
      })

      // Refresh data
      await fetchSellers()
    } catch (err: unknown) {
      const error = err as { message?: string }
      const errorMessage = error.message || 'Có lỗi xảy ra khi mở khóa người bán'
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      })
    } finally {
      setActionLoading(false)
    }
  }

  const closeBanModal = () => {
    setShowBanModal(false)
    setSellerToBan(null)
    setBanType('permanent')
    setBanUntilDate(undefined)
  }

  // Close modal functions
  const closeLockConfirm = () => {
    setShowLockConfirm(false)
    setSellerToLock(null)
  }

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge className='bg-green-100 text-green-800 hover:bg-green-100'>
          <CheckCircle className='w-3 h-3 mr-1' />
          Hoạt động
        </Badge>
      )
    } else {
      return (
        <Badge className='bg-red-100 text-red-800 hover:bg-red-100'>
          <XCircle className='w-3 h-3 mr-1' />
          Không hoạt động
        </Badge>
      )
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  // Format date of birth from DD-MM-YYYY to YYYY-MM-DD
  const formatDateOfBirth = (dateString: string) => {
    if (!dateString) return ''

    // Check if already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString
    }

    // Convert from DD-MM-YYYY to YYYY-MM-DD
    const parts = dateString.split('-')
    if (parts.length === 3) {
      const [day, month, year] = parts
      return `${year}-${month}-${day}`
    }

    // If format is different, try to parse as Date
    try {
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0] // Returns YYYY-MM-DD
      }
    } catch (e) {
      console.error('Error parsing date:', e)
    }

    return dateString // Return original if can't parse
  }

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Get avatar URL with fallback
  const getAvatarUrl = (avatar: string) => {
    const defaultAvatar = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'

    // Kiểm tra nếu avatar là URL thật (không phải example.com)
    if (
      avatar &&
      avatar.trim() !== '' &&
      avatar !== 'null' &&
      avatar !== 'undefined' &&
      avatar.startsWith('http') &&
      !avatar.includes('example.com')
    ) {
      return avatar
    }

    return defaultAvatar
  }

  // Fetch data khi component mount
  useEffect(() => {
    fetchSellers()
  }, [fetchSellers])

  // Apply filters khi allSellers thay đổi
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // Paginate khi filteredSellers hoặc currentPage thay đổi
  useEffect(() => {
    paginateSellers()
  }, [paginateSellers])

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Quản lý Seller</h1>
          <p className='text-gray-600 mt-1'>Quản lý thông tin và trạng thái của các seller</p>
        </div>
        <div className='flex items-center space-x-2'>
          <Users className='w-8 h-8 text-blue-600' />
          <span className='text-2xl font-bold text-blue-600'>{filteredSellers.length}</span>
          <span className='text-sm text-gray-500'>/ {allSellers.length} tổng</span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className='flex flex-col sm:flex-row gap-4 items-end'>
            <div className='flex-1 py-5'>
              <Label className='text-sm font-medium text-gray-700 mb-2'>Tìm kiếm</Label>
              <div className='w-full sm:w-120'>
                <Input
                  placeholder='Tìm kiếm theo tên, email, số điện thoại...'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className='w-full'
                />
              </div>
            </div>
            <div className='w-full sm:w-48 py-5'>
              <Label className='text-sm font-medium text-gray-700 mb-2'>Trạng thái</Label>
              <Select value={statusFilter} onValueChange={handleFilterChange}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả</SelectItem>
                  <SelectItem value='active'>Hoạt động</SelectItem>
                  <SelectItem value='inactive'>Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='w-full sm:w-48 py-5'>
              <Label className='text-sm font-medium text-gray-700 mb-2'>Từ ngày</Label>
              <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                <PopoverTrigger asChild>
                  <Button variant='outline' className='w-full justify-start text-left font-normal'>
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'Chọn ngày bắt đầu'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={dateFrom}
                    onSelect={(date) => {
                      setDateFrom(date)
                      setDateFromOpen(false)
                    }}
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(23, 59, 59, 999)
                      return date > today
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className='w-full sm:w-48 py-5'>
              <Label className='text-sm font-medium text-gray-700 mb-2'>Đến ngày</Label>
              <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                <PopoverTrigger asChild>
                  <Button variant='outline' className='w-full justify-start text-left font-normal'>
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'Chọn ngày kết thúc'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={dateTo}
                    onSelect={(date) => {
                      setDateTo(date)
                      setDateToOpen(false)
                    }}
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(23, 59, 59, 999)
                      // Không cho chọn ngày trong tương lai
                      if (date > today) return true
                      // Không cho chọn ngày trước dateFrom nếu đã chọn
                      if (dateFrom) {
                        const from = new Date(dateFrom)
                        from.setHours(0, 0, 0, 0)
                        return date < from
                      }
                      return false
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {(dateFrom || dateTo) && (
              <div>
                <Button
                  variant='outline'
                  onClick={() => {
                    setDateFrom(undefined)
                    setDateTo(undefined)
                  }}
                >
                  Xóa lọc ngày
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sellers Table */}
      <Card>
        <CardHeader className='py-5'>
          <CardTitle>Danh sách người bán</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex justify-center items-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>Doanh nghiệp</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSellers.map((seller) => (
                    <TableRow key={seller.id}>
                      <TableCell>
                        <div className='flex items-center space-x-3'>
                          <div className='w-15 h-15 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center'>
                            <img
                              src={getAvatarUrl(seller.avatar)}
                              alt={`${seller.firstName} ${seller.lastName}`}
                              className='w-full h-full object-cover'
                              onError={(e) => {
                                console.log('Image failed to load, showing fallback')
                                e.currentTarget.style.display = 'none'
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                if (fallback) fallback.style.display = 'flex'
                              }}
                            />
                            <div
                              className='w-full h-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600'
                              style={{ display: 'none' }}
                            >
                              {getInitials(seller.firstName, seller.lastName)}
                            </div>
                          </div>
                          <div>
                            <div className='font-medium'>
                              {seller.firstName} {seller.lastName}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className='space-y-1'>
                          <div className='flex items-center text-sm font-medium'>
                            <Building2 className='w-4 h-4 mr-2 text-gray-400' />
                            {seller.businessName}
                          </div>
                          <div className='text-sm text-gray-500'>License: {seller.businessLicense}</div>
                          <div className='text-sm text-gray-500'>Tax: {seller.taxCode}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(seller.isActive)}</TableCell>
                      <TableCell>
                        <div className='text-sm'>{formatDate(seller.createdAt)}</div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleViewDetail(seller.id)}
                            className='flex items-center'
                          >
                            <Eye className='w-4 h-4 mr-2' />
                            Xem chi tiết
                          </Button>
                          {seller.isActive ? (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleBan(seller)}
                              className='text-orange-600 hover:text-orange-800 hover:bg-orange-50 flex items-center'
                            >
                              <Ban className='w-4 h-4 mr-2' />
                              Khóa
                            </Button>
                          ) : (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleUnban(seller)}
                              className='text-blue-600 hover:text-blue-800 hover:bg-blue-50 flex items-center'
                            >
                              <CheckCircle className='w-4 h-4 mr-2' />
                              Mở khóa
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            maxVisiblePages={2}
          />
        </CardContent>
      </Card>

      {/* Seller Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center'>
              <UserX className='w-5 h-5 mr-2' />
              Thông tin chi tiết người bán
            </DialogTitle>
            <DialogDescription>Thông tin đầy đủ về seller và doanh nghiệp</DialogDescription>
          </DialogHeader>

          {selectedSeller && (
            <div className='space-y-6'>
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <Users className='w-5 h-5 mr-2' />
                    Thông tin cá nhân
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='flex items-center space-x-4'>
                      <div className='w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center'>
                        <img
                          src={getAvatarUrl(selectedSeller.avatar)}
                          alt={`${selectedSeller.firstName} ${selectedSeller.lastName}`}
                          className='w-full h-full object-cover'
                          onError={(e) => {
                            console.log('Modal image failed to load, showing fallback')
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement
                            if (fallback) fallback.style.display = 'flex'
                          }}
                        />
                        <div
                          className='w-full h-full bg-gray-300 flex items-center justify-center text-lg font-medium text-gray-600'
                          style={{ display: 'none' }}
                        >
                          {getInitials(selectedSeller.firstName, selectedSeller.lastName)}
                        </div>
                      </div>
                      <div>
                        <h3 className='text-xl font-semibold'>
                          {selectedSeller.firstName} {selectedSeller.lastName}
                        </h3>
                        <p className='text-gray-600'>{selectedSeller.email}</p>
                        {getStatusBadge(selectedSeller.isActive)}
                      </div>
                    </div>
                    <div className='space-y-3'>
                      <div className='flex items-center'>
                        <Phone className='w-4 h-4 mr-2 text-gray-400' />
                        <span>{selectedSeller.phoneNumber}</span>
                      </div>
                      <div className='flex items-center'>
                        <CalendarIcon className='w-4 h-4 mr-2 text-gray-400' />
                        <span>{formatDateOfBirth(selectedSeller.dateOfBirth)}</span>
                      </div>
                      <div className='flex items-center'>
                        <Shield className='w-4 h-4 mr-2 text-gray-400' />
                        <span>Giới tính: {selectedSeller.gender}</span>
                      </div>
                      <div className='flex items-center'>
                        <AlertCircle className='w-4 h-4 mr-2 text-gray-400' />
                        <span>Số lượt báo cáo: {selectedSeller.reportCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Information */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <Building2 className='w-5 h-5 mr-2' />
                    Thông tin doanh nghiệp
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-3'>
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Tên doanh nghiệp</label>
                        <p className='text-lg font-semibold'>{selectedSeller.businessName}</p>
                      </div>
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Giấy phép kinh doanh</label>
                        <p className='font-mono text-sm'>{selectedSeller.businessLicense}</p>
                      </div>
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Mã số thuế</label>
                        <p className='font-mono text-sm'>{selectedSeller.taxCode}</p>
                      </div>
                    </div>
                    <div className='space-y-3'>
                      <div>
                        <label className='text-sm font-medium text-gray-500'>CCCD</label>
                        <p className='font-mono text-sm'>{selectedSeller.identifyCard}</p>
                      </div>
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Tài khoản ngân hàng</label>
                        <p className='font-mono text-sm'>{selectedSeller.bankAccount || 'Chưa cập nhật'}</p>
                      </div>
                      <div>
                        <label className='text-sm font-medium text-gray-500'>Ghi chú</label>
                        <p className='text-sm'>{selectedSeller.note || 'Không có ghi chú'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lock Confirmation Modal */}
      <Dialog open={showLockConfirm} onOpenChange={setShowLockConfirm}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Xác nhận khóa quyền hạn</DialogTitle>
            <DialogDescription>
              {sellerToLock && (
                <>
                  Bạn có muốn khóa quyền hạn của seller{' '}
                  <span className='font-semibold'>
                    {sellerToLock.firstName} {sellerToLock.lastName}
                  </span>{' '}
                  không?
                  <br />
                  <span className='text-sm text-gray-500 mt-2 block'>
                    Seller sẽ không thể thực hiện các chức năng trên hệ thống sau khi bị khóa quyền.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant='outline' onClick={closeLockConfirm} disabled={actionLoading}>
              Hủy
            </Button>
            <Button
              onClick={confirmLock}
              className='bg-yellow-600 hover:bg-yellow-700 text-white'
              disabled={actionLoading}
            >
              {actionLoading ? 'Đang xử lý...' : 'Khóa quyền hạn'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Modal */}
      <Dialog open={showBanModal} onOpenChange={setShowBanModal}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center'>
              <Ban className='w-5 h-5 mr-2 text-orange-600' />
              Cấm người bán
            </DialogTitle>
            <DialogDescription>
              {sellerToBan && (
                <>
                  Bạn đang cấm người bán{' '}
                  <span className='font-semibold'>
                    {sellerToBan.firstName} {sellerToBan.lastName}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {sellerToBan && (
            <div className='space-y-4 py-4'>
              <div className='space-y-3'>
                <Label>Loại cấm</Label>
                <div className='space-y-2'>
                  <label className='flex items-center space-x-2 cursor-pointer'>
                    <input
                      type='radio'
                      name='banType'
                      value='permanent'
                      checked={banType === 'permanent'}
                      onChange={(e) => setBanType(e.target.value as 'permanent' | 'temporary')}
                      className='h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300'
                    />
                    <span className='text-sm text-gray-900'>Cấm vĩnh viễn</span>
                  </label>
                  <label className='flex items-center space-x-2 cursor-pointer'>
                    <input
                      type='radio'
                      name='banType'
                      value='temporary'
                      checked={banType === 'temporary'}
                      onChange={(e) => setBanType(e.target.value as 'permanent' | 'temporary')}
                      className='h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300'
                    />
                    <span className='text-sm text-gray-900'>Cấm có thời hạn</span>
                  </label>
                </div>
              </div>

              {banType === 'temporary' && (
                <div className='space-y-2'>
                  <Label>Ngày hết hạn cấm</Label>
                  <Popover open={banUntilOpen} onOpenChange={setBanUntilOpen}>
                    <PopoverTrigger asChild>
                      <Button variant='outline' className='w-full justify-start text-left font-normal'>
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {banUntilDate ? format(banUntilDate, 'dd/MM/yyyy') : 'Chọn ngày hết hạn'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={banUntilDate}
                        onSelect={(date) => {
                          setBanUntilDate(date)
                          setBanUntilOpen(false)
                        }}
                        disabled={(date) => date <= new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {banType === 'permanent' && (
                <div className='rounded-md bg-orange-50 p-3 text-sm text-orange-800'>
                  <AlertCircle className='w-4 h-4 inline mr-2' />
                  Người bán sẽ bị cấm vĩnh viễn và không thể đăng nhập vào hệ thống.
                </div>
              )}

              {banType === 'temporary' && banUntilDate && (
                <div className='rounded-md bg-blue-50 p-3 text-sm text-blue-800'>
                  <AlertCircle className='w-4 h-4 inline mr-2' />
                  Người bán sẽ bị cấm đến ngày {format(banUntilDate, 'dd/MM/yyyy')}.
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant='outline' onClick={closeBanModal} disabled={actionLoading}>
              Hủy
            </Button>
            <Button
              onClick={confirmBan}
              className='bg-orange-600 hover:bg-orange-700 text-white'
              disabled={actionLoading || (banType === 'temporary' && !banUntilDate)}
            >
              {actionLoading ? 'Đang xử lý...' : 'Xác nhận cấm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SellerManagement
