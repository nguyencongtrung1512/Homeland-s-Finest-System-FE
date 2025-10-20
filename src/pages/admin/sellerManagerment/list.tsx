import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Users,
  UserX,
  ChevronLeft,
  ChevronRight,
  Eye,
  Building2,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  FileText,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lock,
  Trash2
} from 'lucide-react'
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
import { toast } from 'react-toastify'

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [sellerToDelete, setSellerToDelete] = useState<SellerInfo | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

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

  // Filter sellers dựa trên search và status
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

    setFilteredSellers(filtered)
    setCurrentPage(1) // Reset về trang đầu khi filter
  }, [allSellers, searchText, statusFilter])

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
      toast.error('Không thể tải thông tin chi tiết seller')
    }
  }

  // Handle lock permission
  const handleLock = (seller: SellerInfo) => {
    setSellerToLock(seller)
    setShowLockConfirm(true)
  }

  const confirmLock = async () => {
    if (sellerToLock) {
      setActionLoading(true)
      try {
        await updateUser(sellerToLock.id, {
          isPermission: false
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

  // Handle delete account
  const handleDelete = (seller: SellerInfo) => {
    setSellerToDelete(seller)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (sellerToDelete) {
      setActionLoading(true)
      try {
        await updateUser(sellerToDelete.id, {
          isActive: false
        })

        toast.success(`Đã xóa tài khoản ${sellerToDelete.firstName} ${sellerToDelete.lastName}`, {
          position: 'top-right',
          autoClose: 3000
        })

        // Refresh data
        await fetchSellers()
      } catch (err: unknown) {
        const error = err as { message?: string }
        const errorMessage = error.message || 'Có lỗi xảy ra khi xóa tài khoản'
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 5000
        })
      } finally {
        setActionLoading(false)
        setShowDeleteConfirm(false)
        setSellerToDelete(null)
      }
    }
  }

  // Close modal functions
  const closeLockConfirm = () => {
    setShowLockConfirm(false)
    setSellerToLock(null)
  }

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false)
    setSellerToDelete(null)
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

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Get avatar URL with fallback
  const getAvatarUrl = (avatar: string) => {
    const defaultAvatar = 'https://scontent.fsgn2-7.fna.fbcdn.net/v/t39.30808-6/465035753_1661013661514519_1627670806811343264_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=5mOa7Gq6_bUQ7kNvwHRbhKw&_nc_oc=Adn3WhVjw5Wtj6FQhxzAO17d70tHXNI_NFMKYkyiF27-6gP0H454mkF4QLv581AV61I&_nc_zt=23&_nc_ht=scontent.fsgn2-7.fna&_nc_gid=mFuBPxElXDeTfVFh0IcEtw&oh=00_AffkK-HwLzMpjLePHbZSdd8gGf0elGj51mwvEyIxTd0uIg&oe=68FB86F6'

    console.log('Avatar from API:', avatar)

    // Kiểm tra nếu avatar là URL thật (không phải example.com)
    if (avatar &&
      avatar.trim() !== '' &&
      avatar !== 'null' &&
      avatar !== 'undefined' &&
      avatar.startsWith('http') &&
      !avatar.includes('example.com')) {
      console.log('Using seller avatar:', avatar)
      return avatar
    }

    console.log('Using default avatar:', defaultAvatar)
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
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Search className='w-5 h-5 mr-2' />
            Tìm kiếm và lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <Input
                placeholder='Tìm kiếm theo tên, email, số điện thoại...'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className='w-full'
              />
            </div>
            <div className='w-full sm:w-48'>
              <Select value={statusFilter} onValueChange={handleFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder='Trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả</SelectItem>
                  <SelectItem value='active'>Hoạt động</SelectItem>
                  <SelectItem value='inactive'>Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch} className='w-full sm:w-auto'>
              <Search className='w-4 h-4 mr-2' />
              Tìm kiếm
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sellers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Seller</CardTitle>
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
                    <TableHead>Thông tin liên hệ</TableHead>
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
                          <div className='w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center'>
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
                            <div className='w-full h-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600' style={{ display: 'none' }}>
                              {getInitials(seller.firstName, seller.lastName)}
                            </div>
                          </div>
                          <div>
                            <div className='font-medium'>
                              {seller.firstName} {seller.lastName}
                            </div>
                            <div className='text-sm text-gray-500'>ID: {seller.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='space-y-1'>
                          <div className='flex items-center text-sm'>
                            <Mail className='w-4 h-4 mr-2 text-gray-400' />
                            {seller.email}
                          </div>
                          <div className='flex items-center text-sm'>
                            <Phone className='w-4 h-4 mr-2 text-gray-400' />
                            {seller.phoneNumber}
                          </div>
                          <div className='flex items-center text-sm'>
                            <CalendarIcon className='w-4 h-4 mr-2 text-gray-400' />
                            {seller.dateOfBirth}
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
                          {seller.isPermission && (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleLock(seller)}
                              className='text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 flex items-center'
                            >
                              <Lock className='w-4 h-4 mr-2' />
                              Khóa quyền
                            </Button>
                          )}
                          {seller.isActive && (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleDelete(seller)}
                              className='text-red-600 hover:text-red-800 hover:bg-red-50 flex items-center'
                            >
                              <Trash2 className='w-4 h-4 mr-2' />
                              Xóa tài khoản
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
          {totalPages > 1 && (
            <div className='flex items-center justify-between mt-4'>
              <div className='text-sm text-gray-500'>
                Hiển thị {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredSellers.length)}{' '}
                trong tổng số {filteredSellers.length} sellers
                <br />
                Trang {currentPage} / {totalPages}
              </div>
              <div className='flex space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className='w-4 h-4' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className='w-4 h-4' />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seller Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center'>
              <UserX className='w-5 h-5 mr-2' />
              Thông tin chi tiết Seller
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
                        <div className='w-full h-full bg-gray-300 flex items-center justify-center text-lg font-medium text-gray-600' style={{ display: 'none' }}>
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
                        <span>{selectedSeller.dateOfBirth}</span>
                      </div>
                      <div className='flex items-center'>
                        <Shield className='w-4 h-4 mr-2 text-gray-400' />
                        <span>Giới tính: {selectedSeller.gender}</span>
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
                        <label className='text-sm font-medium text-gray-500'>CMND/CCCD</label>
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

              {/* Status and Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <CalendarIcon className='w-5 h-5 mr-2' />
                    Trạng thái và thời gian
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    <div>
                      <label className='text-sm font-medium text-gray-500'>Trạng thái phê duyệt</label>
                      <div className='mt-1'>
                        {selectedSeller.isPermission ? (
                          <Badge className='bg-green-100 text-green-800'>
                            <CheckCircle className='w-3 h-3 mr-1' />
                            Đã phê duyệt
                          </Badge>
                        ) : (
                          <Badge className='bg-yellow-100 text-yellow-800'>
                            <AlertCircle className='w-3 h-3 mr-1' />
                            Chờ phê duyệt
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className='text-sm font-medium text-gray-500'>Ngày phê duyệt</label>
                      <p className='text-sm'>{formatDate(selectedSeller.approvedAt)}</p>
                    </div>
                    <div>
                      <label className='text-sm font-medium text-gray-500'>Ngày tạo tài khoản</label>
                      <p className='text-sm'>{formatDate(selectedSeller.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <FileText className='w-5 h-5 mr-2' />
                    Thống kê
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center space-x-6'>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-blue-600'>{selectedSeller.reportCount}</div>
                      <div className='text-sm text-gray-500'>Số lần báo cáo</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-green-600'>
                        {selectedSeller.isActive ? 'Hoạt động' : 'Tạm khóa'}
                      </div>
                      <div className='text-sm text-gray-500'>Trạng thái hiện tại</div>
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

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa tài khoản</DialogTitle>
            <DialogDescription>
              {sellerToDelete && (
                <>
                  Bạn có muốn xóa tài khoản của seller{' '}
                  <span className='font-semibold'>
                    {sellerToDelete.firstName} {sellerToDelete.lastName}
                  </span>{' '}
                  không?
                  <br />
                  <span className='text-sm text-gray-500 mt-2 block'>
                    Tài khoản sẽ bị vô hiệu hóa và không thể đăng nhập vào hệ thống.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant='outline' onClick={closeDeleteConfirm} disabled={actionLoading}>
              Hủy
            </Button>
            <Button
              onClick={confirmDelete}
              className='bg-red-600 hover:bg-red-700 text-white'
              disabled={actionLoading}
            >
              {actionLoading ? 'Đang xử lý...' : 'Xóa tài khoản'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SellerManagement
