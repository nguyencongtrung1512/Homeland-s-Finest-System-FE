import { useState, useEffect, useCallback } from 'react'
import { Search, Eye, UserPlus, CheckCircle, Loader2, Calendar, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { adminApi, type Staff } from '../../../apis/admin.api'
import { staffApi, type StaffInfo } from '../../../apis/staff.api'
import { productApi } from '../../../apis/product.api'
import type { Product } from '../../../types/productType'

// Extended Product type for admin page with additional fields from backend
type AdminProductFromAPI = Product & {
  assignedToId?: string | null
  createdAt?: string
  updatedAt?: string
}
import { Button } from '../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog'
import StaffComboBox from '../../../components/ui/staff-combo-box'
import Pagination from '../../../components/Pagination/Pagination'
import { toast } from '../../../utils/toast'

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium'
      case 'confirmed':
        return 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-medium'
      case 'rejected':
        return 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium'
      case 'denied':
        return 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium'
      case 'processing':
        return 'bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium'
      default:
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm font-medium'
    }
  }

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'Đã duyệt'
      case 'pending':
        return 'Chờ duyệt'
      case 'rejected':
        return 'Từ chối xử lý'
      case 'denied':
        return 'Từ chối'
      case 'confirmed':
        return 'Đã xác nhận'
      case 'processing':
        return 'Đang xử lý'
      default:
        return status
    }
  }

  return <span className={getStatusColor(status)}>{getStatusText(status)}</span>
}

function ManagerProductAdmin() {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('Approved')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10) // Fixed page size, can be made dynamic in future if needed
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<AdminProductFromAPI[]>([])
  const [staffNames, setStaffNames] = useState<Map<string, string>>(new Map())
  const [loadingStaff, setLoadingStaff] = useState<Set<string>>(new Set())

  // States for assign staff modal
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<AdminProductFromAPI | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loadingStaffList, setLoadingStaffList] = useState(false)
  const [assigning, setAssigning] = useState(false)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const params: {
        pageSize: number
        pageNumber: number
        productStatus?: string
        name?: string
        fromDate?: string
        toDate?: string
      } = {
        pageSize,
        pageNumber: currentPage
      }

      if (statusFilter && statusFilter !== 'all') {
        params.productStatus = statusFilter
      }

      if (searchText) {
        params.name = searchText
      }

      if (dateFrom) {
        // Convert to ISO 8601 format with UTC timezone: YYYY-MM-DDT00:00:00Z
        const date = new Date(dateFrom)
        date.setUTCHours(0, 0, 0, 0)
        params.fromDate = date.toISOString()
      }

      if (dateTo) {
        // Convert to ISO 8601 format with UTC timezone: YYYY-MM-DDT23:59:59Z
        const date = new Date(dateTo)
        date.setUTCHours(23, 59, 59, 999)
        params.toDate = date.toISOString()
      }

      const response = await productApi.getAll(params)

      if (response.data) {
        setProducts(response.data)
        if (response.pagination) {
          setTotalItems(response.pagination.totalItems)
        } else {
          setTotalItems(response.data.length)
        }
      } else {
        setProducts([])
        setTotalItems(0)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Không thể tải danh sách sản phẩm')
      setProducts([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, statusFilter, searchText, dateFrom, dateTo])

  // Fetch staff info by ID
  const fetchStaffInfo = useCallback(
    async (staffId: string) => {
      // Check if already in cache or loading
      if (staffNames.has(staffId) || loadingStaff.has(staffId)) {
        return
      }

      try {
        setLoadingStaff((prev) => new Set(prev).add(staffId))
        const response = await staffApi.getStaffInfo(staffId)

        // Response structure: response.data = { status, message, data: StaffInfo }
        const staffInfo: StaffInfo | undefined =
          response.data?.data || (response.data as StaffInfo) || (response as unknown as StaffInfo)

        if (staffInfo && staffInfo.firstName && staffInfo.lastName) {
          const fullName = `${staffInfo.firstName} ${staffInfo.lastName}`.trim()

          setStaffNames((prev) => {
            const newMap = new Map(prev)
            newMap.set(staffId, fullName)
            return newMap
          })
        }
      } catch (error) {
        console.error(`Error fetching staff info for ${staffId}:`, error)
      } finally {
        setLoadingStaff((prev) => {
          const newSet = new Set(prev)
          newSet.delete(staffId)
          return newSet
        })
      }
    },
    [staffNames, loadingStaff]
  )

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Fetch staff info for all assigned staff when products change
  useEffect(() => {
    products.forEach((product) => {
      if (product.assignedToId && !staffNames.has(product.assignedToId) && !loadingStaff.has(product.assignedToId)) {
        fetchStaffInfo(product.assignedToId)
      }
    })
  }, [products, staffNames, loadingStaff, fetchStaffInfo])

  // Load staff list for assign modal
  const loadStaffList = useCallback(async () => {
    try {
      setLoadingStaffList(true)
      const response = await adminApi.getAllStaff()

      if (response && response.data && Array.isArray(response.data)) {
        setStaffList(response.data)
      } else {
        const staffData = response?.data || response || []
        setStaffList(Array.isArray(staffData) ? staffData : [])
      }
    } catch (error) {
      console.error('Error loading staff list:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách nhân viên')
      setStaffList([])
    } finally {
      setLoadingStaffList(false)
    }
  }, [])

  // Handle open assign modal
  const handleOpenAssignModal = (product: AdminProductFromAPI) => {
    setSelectedProductId(product.id)
    setSelectedProduct(product)
    setSelectedStaffId(null)
    setShowAssignModal(true)
    if (staffList.length === 0) {
      loadStaffList()
    }
  }

  // Handle close assign modal
  const handleCloseAssignModal = () => {
    setShowAssignModal(false)
    setSelectedProductId(null)
    setSelectedProduct(null)
    setSelectedStaffId(null)
  }

  // Handle assign staff
  const handleAssignStaff = async () => {
    if (!selectedProductId || !selectedStaffId) {
      toast.error('Vui lòng chọn nhân viên')
      return
    }

    try {
      setAssigning(true)
      const response = await adminApi.reassignProduct(selectedProductId, selectedStaffId)

      const successMessage = (response as { message?: string })?.message || 'Gán nhân viên thành công'

      toast.success(successMessage)
      handleCloseAssignModal()
      await fetchProducts() // Refresh product list

      // Refresh staff name for the newly assigned staff
      if (selectedStaffId) {
        await fetchStaffInfo(selectedStaffId)
      }
    } catch (error) {
      console.error('Error assigning staff:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (error as { message?: string })?.message ||
        'Có lỗi xảy ra khi gán nhân viên'
      toast.error(errorMessage)
    } finally {
      setAssigning(false)
    }
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return '-'
    }

    // Format: "19:23:34 21/10/2025" -> "21/10/2025"
    if (dateString.includes(' ')) {
      return dateString.split(' ')[1] || dateString
    }

    // Xử lý định dạng "HH:MM:SS DD/MM/YYYY" từ API
    const timeDateMatch = dateString.match(/(\d{2}:\d{2}:\d{2})\s+(\d{2}\/\d{2}\/\d{4})/)

    if (timeDateMatch) {
      const [, time, date] = timeDateMatch
      const [day, month, year] = date.split('/')

      // Tạo Date object với định dạng chuẩn
      const dateObj = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        ...(time ? time.split(':').map(Number) : [0, 0, 0])
      )

      if (isNaN(dateObj.getTime())) {
        return dateString
      }

      return dateObj.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    // Fallback cho các định dạng khác
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return dateString
    }

    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // Pagination
  const totalPages = Math.ceil(totalItems / pageSize)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchProducts()
  }

  const handleFilter = () => {
    setCurrentPage(1)
    fetchProducts()
  }

  const handleClearFilters = () => {
    setSearchText('')
    setStatusFilter('Approved')
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
  }

  if (loading && products.length === 0) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-lg'>Đang tải...</div>
      </div>
    )
  }

  return (
    <div className='w-full space-y-4 p-6'>
      <div className='bg-white rounded-lg shadow-sm border p-6'>
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>Quản lý sản phẩm</h1>
        <p className='text-gray-600 mb-6'>Duyệt và quản lý tất cả sản phẩm trên hệ thống</p>

        {/* Search and Filters */}
        <div className='flex items-center gap-4 mb-6 flex-wrap'>
          {/* Search */}
          <div className='relative flex-1 min-w-[200px]'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
            <input
              type='text'
              placeholder='Tên sản phẩm hoặc ID...'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch()
                }
              }}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className='px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          >
            <option value='all'>Tất cả trạng thái</option>
            <option value='Pending'>Chờ duyệt</option>
            <option value='Processing'>Đang xử lý</option>
            <option value='Confirmed'>Đã xác nhận</option>
            <option value='Approved'>Đã duyệt</option>
            <option value='Rejected'>Từ chối</option>
            <option value='Denied'>Từ chối xử lý</option>
          </select>

          {/* Date Range */}
          <div className='flex items-center gap-2'>
            <Calendar className='h-4 w-4 text-gray-400' />
            <input
              type='date'
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className='px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
            <span className='text-gray-500'>đến</span>
            <input
              type='date'
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className='px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          {/* Filter Button */}
          <Button onClick={handleFilter} className='bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2'>
            <Filter className='w-4 h-4' />
            Lọc
          </Button>

          {/* Clear Filters */}
          <button
            onClick={handleClearFilters}
            className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50'
          >
            Xóa bộ lọc
          </button>
        </div>

        {/* Table */}
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Sản phẩm
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Ngày tạo
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Nhân viên xử lý
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Trạng thái
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {products.length > 0 ? (
                products.map((product) => {
                  const staffName = product.assignedToId ? staffNames.get(product.assignedToId) : null
                  const isLoadingStaff = product.assignedToId ? loadingStaff.has(product.assignedToId) : false
                  const productImage =
                    product.productImages && product.productImages.length > 0 ? product.productImages[0] : ''

                  return (
                    <tr key={product.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center gap-3'>
                          <div className='w-15 h-15 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0'>
                            {productImage ? (
                              <img src={productImage} alt={product.name} className='w-full h-full object-cover' />
                            ) : (
                              <span className='text-xs text-gray-500'>IMG</span>
                            )}
                          </div>
                          <div className='min-w-0'>
                            <div className='text-sm font-medium text-gray-900 truncate max-w-[200px]'>
                              {product.name}
                            </div>
                            <div className='text-xs text-gray-500'>#{product.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {formatDate(product.createdAt || undefined)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {!product.assignedToId ? (
                          <span className='text-gray-400'>Chưa phân công</span>
                        ) : isLoadingStaff ? (
                          <span className='text-gray-400'>Đang tải...</span>
                        ) : (
                          <span className='text-gray-700'>{staffName || product.assignedToId.slice(0, 8) + '...'}</span>
                        )}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <StatusBadge status={product.status} />
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm flex items-center gap-2 font-medium'>
                        <Button
                          variant='outline'
                          title='Xem chi tiết'
                          size='sm'
                          onClick={() => navigate(`/admin/productManagement/detail-product/${product.id}`)}
                          className='text-blue-600 hover:text-blue-900'
                        >
                          <Eye className='w-4 h-4' />
                        </Button>
                        <Button
                          variant='outline'
                          title='Gán nhân viên'
                          size='sm'
                          onClick={() => handleOpenAssignModal(product)}
                          className='text-green-600 hover:text-green-900'
                        >
                          <UserPlus className='w-4 h-4' />
                        </Button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className='px-6 py-12 text-center text-gray-500'>
                    Không có kết quả.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className='flex items-center justify-between mt-6'>
          <div className='text-sm text-gray-700'>
            Hiển thị {(currentPage - 1) * pageSize + 1} đến {Math.min(currentPage * pageSize, totalItems)} trong{' '}
            {totalItems} kết quả
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      </div>

      {/* Assign Staff Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-gray-900'>
              <CheckCircle className='w-5 h-5 text-green-500' />
              Gán nhân viên xử lý sản phẩm
            </DialogTitle>
            <DialogDescription>
              Chọn nhân viên để gán xử lý sản phẩm <strong>{selectedProduct?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 mt-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Chọn nhân viên</label>
              {loadingStaffList ? (
                <div className='flex items-center justify-center py-8'>
                  <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
                  <span className='ml-2 text-sm text-gray-500'>Đang tải danh sách nhân viên...</span>
                </div>
              ) : (
                <StaffComboBox
                  options={staffList}
                  placeholder='Chọn nhân viên...'
                  onSelect={(staffId) => setSelectedStaffId(staffId)}
                  value={selectedStaffId || undefined}
                />
              )}
            </div>

            {selectedProduct && (
              <div className='p-4 bg-gray-50 border rounded-lg'>
                <p className='text-xs text-gray-500 mb-1'>Thông tin sản phẩm:</p>
                <p className='text-sm font-medium text-gray-900'>{selectedProduct.name}</p>
                <p className='text-xs text-gray-600 mt-1'>
                  Trạng thái: <StatusBadge status={selectedProduct.status} />
                </p>
              </div>
            )}
          </div>

          <DialogFooter className='mt-6'>
            <Button variant='outline' onClick={handleCloseAssignModal} disabled={assigning}>
              Hủy
            </Button>
            <Button
              onClick={handleAssignStaff}
              disabled={assigning || !selectedStaffId || loadingStaffList}
              className='bg-green-500 hover:bg-green-600 text-white'
            >
              {assigning ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle className='w-4 h-4 mr-2' />
                  Gán nhân viên
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ManagerProductAdmin
