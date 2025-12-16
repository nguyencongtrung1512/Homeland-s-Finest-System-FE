import { useState, useEffect, useCallback } from 'react'
import { Calendar, CheckCircle, Eye, Store, Loader2, UserPlus } from 'lucide-react'
import { adminApi, type Staff } from '../../../apis/admin.api'
import { staffApi } from '../../../apis/staff.api'
import { type Combo } from '../../../types/combo.type'
import { comboApi } from '../../../apis/combo.api'
import type { ComboParams } from '../../../types/combo.type'
import ComboDetailPopup from './detail'
import { Button } from '../../../components/ui/button'
import { toast } from '../../../utils/toast'

const DEFAULT_STORE_LOGO = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'
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

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium'
      case 'Confirmed':
        return 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-medium'
      case 'Rejected':
        return 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium'
      case 'Denied':
        return 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium'
      case 'Draft':
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm font-medium'
      case 'Processing':
        return 'bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium'
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm font-medium'
      default:
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm font-medium'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'Đã duyệt'
      case 'Pending':
        return 'Chờ duyệt'
      case 'Rejected':
        return 'Từ chối'
      case 'Denied':
        return 'Bị từ chối'
      case 'Confirmed':
        return 'Đã xác nhận'
      case 'Draft':
        return 'Nháp'
      case 'Processing':
        return 'Đang xử lý'
      case 'Cancelled':
        return 'Đã hủy'
      default:
        return status
    }
  }

  return <span className={getStatusColor(status)}>{getStatusText(status)}</span>
}

function ManagerComboAdmin() {
  const [data, setData] = useState<Combo[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [storeSearch, setStoreSearch] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  // Popup states
  const [selectedComboId, setSelectedComboId] = useState<string | null>(null)
  const [isDetailPopupOpen, setIsDetailPopupOpen] = useState(false)

  // Assign staff modal states
  const [isAssignStaffModalOpen, setIsAssignStaffModalOpen] = useState(false)
  const [selectedComboForAssign, setSelectedComboForAssign] = useState<Combo | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [assigning, setAssigning] = useState(false)

  // Fetch data
  const fetchCombos = useCallback(async () => {
    try {
      setLoading(true)
      const params: ComboParams = {
        pageSize: itemsPerPage,
        pageNumber: currentPage
      }

      if (storeSearch) {
        // Try to parse as GUID, if not valid, skip storeId filter
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (guidRegex.test(storeSearch)) {
          params.storeId = storeSearch
        }
      }

      if (dateFrom) {
        params.fromDate = dateFrom
      }

      if (dateTo) {
        params.toDate = dateTo
      }

      const response = await comboApi.getAllCombos(params)

      // Response structure: { data: Combo[], pagination?: {...} }
      let combos: Combo[] = response.data || []

      // Filter by status on client-side since backend doesn't support status filter in GetAll
      if (statusFilter) {
        combos = combos.filter((combo) => combo.status === statusFilter)
      }

      setData(combos)

      // Set pagination info
      if (response.pagination) {
        const pag = response.pagination
        setTotalPages(pag.totalPages || Math.ceil((pag.totalItems || 0) / itemsPerPage))
        setTotalItems(pag.totalItems || 0)
      } else {
        // Fallback: calculate from data length if no pagination info
        setTotalPages(Math.ceil(combos.length / itemsPerPage))
        setTotalItems(combos.length)
      }
    } catch (error) {
      console.error('Error fetching combos:', error)
      toast.error('Không thể tải danh sách combo')
      setData([])
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter, storeSearch, dateFrom, dateTo, itemsPerPage])

  useEffect(() => {
    fetchCombos()
  }, [fetchCombos])

  // Fetch staff list
  const fetchStaffList = useCallback(async () => {
    try {
      setLoadingStaff(true)
      const response = await staffApi.getAllStaff({ pageSize: 0, pageNumber: 1 })

      // Handle different response formats
      let staffData: unknown[] = []

      if (Array.isArray(response)) {
        // Response is directly an array
        staffData = response
      } else if (response && typeof response === 'object' && 'data' in response) {
        const responseWithData = response as { data?: unknown[] }
        if (Array.isArray(responseWithData.data)) {
          // Response has structure {status, message, data: [...]}
          staffData = responseWithData.data
        }
      }

      if (staffData.length > 0) {
        // Map StaffInfo to Staff format for compatibility
        const mappedStaffList: Staff[] = staffData.map((staffInfo: unknown) => {
          const info = staffInfo as {
            userId?: string
            id?: string
            firstName?: string
            lastName?: string
            staffName?: string
            name?: string
            email?: string
          }

          // Generate staff name with fallbacks
          let staffName = 'Nhân viên'
          if (info.firstName && info.lastName) {
            staffName = `${info.firstName} ${info.lastName}`.trim()
          } else if (info.staffName) {
            staffName = info.staffName
          } else if (info.name) {
            staffName = info.name
          } else if (info.email) {
            // Use email username as fallback
            staffName = info.email.split('@')[0]
          }

          return {
            staffId: info.userId || info.id || '',
            staffName: staffName,
            email: info.email || '',
            processingStoreCount: 0 // Default value as this field is not available in StaffInfo
          }
        })
        setStaffList(mappedStaffList)
      } else {
        setStaffList([])
      }
    } catch (error) {
      console.error('Error fetching staff list:', error)
      setStaffList([])
    } finally {
      setLoadingStaff(false)
    }
  }, [])

  // Open assign staff modal
  const handleOpenAssignStaff = (combo: Combo) => {
    setSelectedComboForAssign(combo)
    setSelectedStaffId(null)
    setIsAssignStaffModalOpen(true)
    if (staffList.length === 0) {
      fetchStaffList()
    }
  }

  // Close assign staff modal
  const handleCloseAssignStaff = () => {
    setIsAssignStaffModalOpen(false)
    setSelectedComboForAssign(null)
    setSelectedStaffId(null)
  }

  // Handle staff assignment
  const handleAssignStaff = async () => {
    if (!selectedComboForAssign || !selectedStaffId) {
      return
    }

    // Check if combo has storeId
    if (!selectedComboForAssign.storeId) {
      toast.error('Combo không có thông tin cửa hàng (storeId)')
      return
    }

    try {
      setAssigning(true)
      const response = await adminApi.assignStaffToStore(selectedComboForAssign.storeId, selectedStaffId)
      if (response) {
        toast.success('Gán nhân viên cho cửa hàng thành công!')
        // Refresh combo list
        await fetchCombos()
        handleCloseAssignStaff()
      } else {
        toast.error('Có lỗi xảy ra khi gán nhân viên')
      }
    } catch (error) {
      console.error('Error assigning staff:', error)
      toast.error('Có lỗi xảy ra khi gán nhân viên cho cửa hàng')
    } finally {
      setAssigning(false)
    }
  }

  // Filter out Draft status combos from UI (client-side filter only)
  const filteredData = data.filter((combo) => combo.status !== 'Draft')

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFilterChange = () => {
    setCurrentPage(1) // Reset to first page when filter changes
  }

  const handleViewDetail = (comboId: string) => {
    setSelectedComboId(comboId)
    setIsDetailPopupOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailPopupOpen(false)
    setSelectedComboId(null)
  }
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return '-'
    }

    // Xử lý định dạng "HH:MM:SS DD/MM/YYYY" từ API
    // Ví dụ: "14:58:24 07/10/2025"
    const timeDateMatch = dateString.match(/(\d{2}:\d{2}:\d{2})\s+(\d{2}\/\d{2}\/\d{4})/)

    if (timeDateMatch) {
      const [, time, date] = timeDateMatch
      const [day, month, year] = date.split('/')
      const [hours, minutes, seconds] = time.split(':')

      // Tạo Date object với định dạng chuẩn
      const dateObj = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      )

      if (isNaN(dateObj.getTime())) {
        return '-'
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
      return '-'
    }

    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-lg'>Đang tải...</div>
      </div>
    )
  }

  return (
    <div className='w-full space-y-4 p-6'>
      <div className='bg-white rounded-lg shadow-sm border p-6'>
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>Quản lý Combo</h1>
        <p className='text-gray-600 mb-6'>Quản lý và theo dõi tất cả combo trong hệ thống</p>

        {/* Filters */}
        <div className='flex items-center gap-4 mb-6 flex-wrap'>
          {/* Store Search */}
          <div className='relative flex-1 min-w-[200px]'>
            <Store className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
            <input
              type='text'
              placeholder='Tìm kiếm cửa hàng...'
              value={storeSearch}
              onChange={(e) => {
                setStoreSearch(e.target.value)
                handleFilterChange()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchCombos()
                }
              }}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              handleFilterChange()
            }}
            className='px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          >
            <option value=''>Tất cả trạng thái</option>
            <option value='Pending'>Chờ duyệt</option>
            <option value='Approved'>Đã duyệt</option>
            <option value='Confirmed'>Đã xác nhận bởi nhân viên</option>
            <option value='Rejected'>Đã từ chối bởi nhân viên</option>
            <option value='Denied'>Bị từ chối</option>
            <option value='Processing'>Đang xử lý</option>
            <option value='Cancelled'>Đã hủy</option>
          </select>

          {/* Date Range */}
          <div className='flex items-center gap-2'>
            <Calendar className='h-4 w-4 text-gray-400' />
            <input
              type='date'
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                handleFilterChange()
              }}
              className='px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
            <span className='text-gray-500'>đến</span>
            <input
              type='date'
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                handleFilterChange()
              }}
              className='px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setStoreSearch('')
              setStatusFilter('')
              setDateFrom('')
              setDateTo('')
              setCurrentPage(1)
            }}
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
                  Tên Combo
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Trạng thái
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Tỉnh/Thành phố
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Cửa hàng
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Ngày tạo
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {filteredData.length > 0 ? (
                filteredData.map((combo) => {
                  // Ưu tiên dùng storeName trực tiếp từ combo object (backend trả về)
                  // Nếu không có, thì lấy từ comboItems
                  let displayStoreName = combo.storeName || ''

                  if (!displayStoreName && combo.comboItems && combo.comboItems.length > 0) {
                    const storeNames = combo.comboItems.map((item) => item.storeName).filter(Boolean)
                    const uniqueStoreNames = [...new Set(storeNames)]
                    displayStoreName = uniqueStoreNames.join(', ')
                  }

                  const comboImage = combo.thumbnailUrl || ''

                  return (
                    <tr key={combo.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center gap-3'>
                          <div className='w-15 h-15 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0'>
                            {comboImage ? (
                              <img
                                src={comboImage}
                                alt={combo.name}
                                className='w-full h-full object-cover'
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  if (target.src !== DEFAULT_STORE_LOGO) {
                                    target.src = DEFAULT_STORE_LOGO
                                  }
                                }}
                              />
                            ) : (
                              <img src={DEFAULT_STORE_LOGO} alt={combo.name} className='w-full h-full object-cover' />
                            )}
                          </div>
                          <div className='min-w-0'>
                            <div className='text-sm font-medium text-gray-900 truncate max-w-[200px]'>{combo.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <StatusBadge status={combo.status} />
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900 max-w-[150px] truncate'>{combo.provinceName}</div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900 max-w-[200px] truncate'>{displayStoreName || '-'}</div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {formatDate(combo.createdAt || '-')}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm flex items-center gap-2 font-medium'>
                        <Button
                          variant='outline'
                          title='Xem chi tiết'
                          size='sm'
                          onClick={() => handleViewDetail(combo.id)}
                          className='text-blue-600 hover:text-blue-900'
                        >
                          <Eye className='w-4 h-4' />
                        </Button>
                        <Button
                          variant='outline'
                          title='Gán nhân viên'
                          size='sm'
                          onClick={() => handleOpenAssignStaff(combo)}
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
                  <td colSpan={6} className='px-6 py-12 text-center text-gray-500'>
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
            Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến {Math.min(currentPage * itemsPerPage, totalItems)} trong{' '}
            {totalItems} kết quả
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      </div>

      {/* Combo Detail Popup */}
      <ComboDetailPopup comboId={selectedComboId} isOpen={isDetailPopupOpen} onClose={handleCloseDetail} />

      {/* Assign Staff Modal */}
      <Dialog open={isAssignStaffModalOpen} onOpenChange={setIsAssignStaffModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-gray-900'>
              <CheckCircle className='w-5 h-5 text-green-500' />
              Gán nhân viên xử lý combo
            </DialogTitle>
            <DialogDescription>
              Chọn nhân viên để gán xử lý combo <strong>{selectedComboForAssign?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 mt-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Chọn nhân viên</label>
              {loadingStaff ? (
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

            {selectedComboForAssign && (
              <div className='p-4 bg-gray-50 border rounded-lg'>
                <p className='text-xs text-gray-500 mb-1'>Thông tin combo:</p>
                <p className='text-sm font-medium text-gray-900'>{selectedComboForAssign.name}</p>
                <p className='text-xs text-gray-600 mt-1'>
                  Trạng thái: <StatusBadge status={selectedComboForAssign.status} />
                </p>
              </div>
            )}
          </div>

          <DialogFooter className='mt-6'>
            <Button variant='outline' onClick={handleCloseAssignStaff} disabled={assigning}>
              Hủy
            </Button>
            <Button
              onClick={handleAssignStaff}
              disabled={assigning || !selectedStaffId || loadingStaff}
              variant='blue'
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

export default ManagerComboAdmin
