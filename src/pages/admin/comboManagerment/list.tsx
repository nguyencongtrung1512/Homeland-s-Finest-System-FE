import { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar, Store } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

import { adminApi, type ComboAdminParams } from '../../../apis/admin.api'
import { type Combo } from '../../../types/combo.type'

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-medium'
      case 'Rejected':
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

  return <span className={getStatusColor(status)}>{status}</span>
}

function ManagerComboAdmin() {
  const [data, setData] = useState<Combo[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [storeSearch, setStoreSearch] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  // Fetch data
  const fetchCombos = useCallback(async () => {
    try {
      setLoading(true)
      const params: ComboAdminParams = {
        pageSize: 0, // Get all data
        pageNumber: 1
      }

      if (statusFilter) {
        params.status = statusFilter
      }

      const combos = await adminApi.getAllCombos(params)
      setData(combos)
    } catch (error) {
      console.error('Error fetching combos:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchCombos()
  }, [fetchCombos])

  // Filter data based on frontend filters
  const filteredData = useMemo(() => {
    let filtered = data

    // Store search filter
    if (storeSearch) {
      filtered = filtered.filter((combo) =>
        (combo.comboItems || []).some((item) => item.storeName.toLowerCase().includes(storeSearch.toLowerCase()))
      )
    }

    // Date range filter
    if (dateFrom && dateTo) {
      filtered = filtered.filter((combo) => {
        if (!combo.createdAt) return false
        const comboDate = new Date(combo.createdAt)
        // Validate that the date is valid
        if (isNaN(comboDate.getTime())) return false
        const fromDate = new Date(dateFrom)
        const toDate = new Date(dateTo)
        return comboDate >= fromDate && comboDate <= toDate
      })
    }

    return filtered
  }, [data, storeSearch, dateFrom, dateTo])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredData.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
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
              onChange={(e) => setStoreSearch(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className='px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          >
            <option value=''>Tất cả trạng thái</option>
            <option value='Draft'>Draft</option>
            <option value='Pending'>Pending</option>
            <option value='Approved'>Approved</option>
            <option value='Rejected'>Rejected</option>
            <option value='Processing'>Processing</option>
            <option value='Cancelled'>Cancelled</option>
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
                  <input type='checkbox' className='rounded border-gray-300' />
                </th>
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
              {currentData.length > 0 ? (
                currentData.map((combo) => {
                  const storeNames = (combo.comboItems || []).map((item) => item.storeName)
                  const uniqueStoreNames = [...new Set(storeNames)]

                  return (
                    <tr key={combo.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <input type='checkbox' className='rounded border-gray-300' />
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900 max-w-[200px] truncate'>{combo.name}</div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <StatusBadge status={combo.status} />
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900 max-w-[150px] truncate'>{combo.provinceName}</div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900 max-w-[200px] truncate'>
                          {uniqueStoreNames.join(', ')}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {combo.createdAt && !isNaN(Date.parse(combo.createdAt))
                          ? format(new Date(combo.createdAt), 'dd/MM/yyyy HH:mm', {
                            locale: vi
                          })
                          : '-'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                        <button
                          onClick={() => navigator.clipboard.writeText(combo.id)}
                          className='text-blue-600 hover:text-blue-900'
                        >
                          Copy ID
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className='px-6 py-12 text-center text-gray-500'>
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
            Hiển thị {startIndex + 1} đến {Math.min(endIndex, filteredData.length)} trong {filteredData.length} kết quả
          </div>
          <div className='flex items-center space-x-2'>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManagerComboAdmin
