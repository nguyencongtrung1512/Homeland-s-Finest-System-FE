import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '../../../components/ui/alert-dialog'
import { Trash2, RefreshCw, Search, Tag, Store } from 'lucide-react'
import { toast } from '../../../utils/toast'
import { getAllHashtags, deleteHashtag, type HashtagItem } from '../../../apis/hashtag.api'
import Pagination from '../../../components/Pagination/Pagination'
import Loading from '../../../components/Loading/loading'

function HashtagManagementStaff() {
  const [hashtags, setHashtags] = useState<HashtagItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [pagination, setPagination] = useState<{
    totalItems: number
    totalPages: number
    pageNumber: number
    pageSize: number
  }>({
    totalItems: 0,
    totalPages: 1,
    pageNumber: 1,
    pageSize: 10
  })

  // Modal states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedHashtag, setSelectedHashtag] = useState<HashtagItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch hashtags
  const fetchHashtags = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Nếu có filter status, load tất cả dữ liệu để filter ở frontend
      // Nếu không có filter status, sử dụng phân trang từ API
      const apiPageSize = statusFilter === 'all' ? pageSize : 0
      const apiPageNumber = statusFilter === 'all' ? currentPage : 1

      const response = await getAllHashtags(apiPageSize, apiPageNumber, searchTerm || undefined)

      if (response.status === 200) {
        setHashtags(response.data || [])
        if (response.pagination) {
          setPagination({
            totalItems: response.pagination.totalItems || 0,
            totalPages: response.pagination.totalPages || 1,
            pageNumber: response.pagination.pageNumber || 1,
            pageSize: response.pagination.pageSize || pageSize
          })
        }
      } else {
        setError('Không thể tải danh sách nhãn dán')
      }
    } catch (err) {
      console.error('Error fetching hashtags:', err)
      setError('Có lỗi xảy ra khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, pageSize, statusFilter])

  useEffect(() => {
    fetchHashtags()
  }, [fetchHashtags])

  // Filtered hashtags (chỉ filter status nếu cần, search đã được xử lý ở API)
  const filteredHashtags = useMemo(() => {
    let filtered = hashtags

    // Filter by status (nếu không phải 'all')
    if (statusFilter !== 'all') {
      filtered = filtered.filter((hashtag) => {
        if (statusFilter === 'active') return hashtag.isActive
        if (statusFilter === 'inactive') return !hashtag.isActive
        return true
      })
    }

    // Filter by search term ở frontend (nếu API không hỗ trợ search theo name)
    if (searchTerm.trim()) {
      filtered = filtered.filter((hashtag) => hashtag.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    return filtered
  }, [hashtags, searchTerm, statusFilter])

  // Paginated hashtags (chỉ khi có filter status, vì khi không có filter thì API đã phân trang)
  const paginatedHashtags = useMemo(() => {
    if (statusFilter === 'all') {
      // API đã phân trang, sử dụng trực tiếp
      return hashtags
    } else {
      // Filter ở frontend, cần phân trang lại
      const startIndex = (currentPage - 1) * pageSize
      const endIndex = startIndex + pageSize
      return filteredHashtags.slice(startIndex, endIndex)
    }
  }, [hashtags, filteredHashtags, currentPage, pageSize, statusFilter])

  // Total pages
  const totalPages = useMemo(() => {
    if (statusFilter === 'all') {
      // Sử dụng totalPages từ API
      return pagination.totalPages
    } else {
      // Tính từ filteredHashtags
      return Math.max(1, Math.ceil(filteredHashtags.length / pageSize))
    }
  }, [statusFilter, pagination.totalPages, filteredHashtags.length, pageSize])

  // Handle delete
  const handleDeleteClick = (hashtag: HashtagItem) => {
    setSelectedHashtag(hashtag)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedHashtag) return

    try {
      setIsDeleting(true)
      const response = await deleteHashtag(selectedHashtag.id)

      if (response.status === 200 || response.status === 202) {
        toast.success('Xóa nhãn dán thành công')
        setShowDeleteDialog(false)
        setSelectedHashtag(null)
        await fetchHashtags()
      } else {
        toast.error(response.message || 'Không thể xóa nhãn dán')
      }
    } catch (error) {
      console.error('Error deleting hashtag:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Có lỗi xảy ra khi xóa nhãn dán'
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
    setSelectedHashtag(null)
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-blue-700 flex items-center gap-2'>
            <Tag className='w-8 h-8' />
            Quản lý nhãn dán
          </h1>
          <p className='text-gray-600 mt-2'>Quản lý tất cả nhãn dán của hệ thống</p>
        </div>
      </div>

      {/* Filters */}
      <Card className='shadow-sm'>
        <CardContent className='p-6'>
          <div className='flex flex-col md:flex-row gap-4 md:gap-6 items-end'>
            {/* Search Input - Chiếm nhiều không gian */}
            <div className='space-y-2 flex-1 w-full md:w-auto'>
              <Label htmlFor='search' className='text-sm font-semibold text-gray-700'>
                Tìm kiếm
              </Label>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10' />
                <Input
                  id='search'
                  placeholder='Tìm kiếm theo tên...'
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setCurrentPage(1)
                      fetchHashtags()
                    }
                  }}
                  className='pl-10 h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full'
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className='space-y-2 w-full md:w-[220px]'>
              <Label htmlFor='status' className='text-sm font-semibold text-gray-700'>
                Trạng thái
              </Label>
              <Select
                value={statusFilter}
                onValueChange={(value: 'all' | 'active' | 'inactive') => {
                  setStatusFilter(value)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger
                  id='status'
                  className='h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full'
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả</SelectItem>
                  <SelectItem value='active'>Đang hoạt động</SelectItem>
                  <SelectItem value='inactive'>Tạm dừng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Refresh Button - Ở góc phải */}
            <div className='flex items-end w-full md:w-auto'>
              <Button
                variant='outline'
                onClick={fetchHashtags}
                disabled={loading}
                className='w-full md:w-auto h-10 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors'
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hashtags Table */}
      <Card>
        <CardHeader>
          <CardTitle className='text-blue-700 py-2'>Danh sách nhãn dán ({filteredHashtags.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && hashtags.length === 0 ? (
            <Loading size='md' text='Đang tải dữ liệu...' />
          ) : error ? (
            <div className='text-center py-12'>
              <p className='text-red-500'>{error}</p>
              <Button variant='outline' onClick={fetchHashtags} className='mt-4'>
                Thử lại
              </Button>
            </div>
          ) : paginatedHashtags.length === 0 ? (
            <div className='text-center py-12'>
              <Tag className='w-12 h-12 mx-auto text-gray-400' />
              <p className='text-gray-500 mt-4'>Chưa có nhãn dán nào</p>
            </div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b'>
                      <th className='text-left py-3 px-4 font-medium text-gray-700'>Tên nhãn dán</th>
                      <th className='text-left py-3 px-4 font-medium text-gray-700'>Cửa hàng</th>
                      <th className='text-left py-3 px-4 font-medium text-gray-700'>Số lần sử dụng</th>
                      <th className='text-left py-3 px-4 font-medium text-gray-700'>Trạng thái</th>
                      <th className='text-left py-3 px-4 font-medium text-gray-700'>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedHashtags.map((hashtag) => (
                      <tr key={hashtag.id} className='border-b hover:bg-gray-50'>
                        <td className='py-3 px-4'>
                          <div className='font-medium text-gray-900'>#{hashtag.name}</div>
                        </td>
                        <td className='py-3 px-4'>
                          <div className='flex items-center gap-2 text-gray-600'>
                            <Store className='w-4 h-4' />
                            {hashtag.description || '-'}
                          </div>
                        </td>
                        <td className='py-3 px-4 text-gray-600'>{hashtag.usageCount || 0}</td>
                        <td className='py-3 px-4'>
                          <Badge
                            className={hashtag.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            {hashtag.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                          </Badge>
                        </td>
                        <td className='py-3 px-4'>
                          <div className='flex items-center gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleDeleteClick(hashtag)}
                              className='text-red-600 hover:text-red-700'
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className='mt-4'>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                      setCurrentPage(page)
                      // Scroll to top when page changes
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa nhãn dán <strong>#{selectedHashtag?.name}</strong>? Hành động này có thể bị ảnh hưởng tới sản phẩm liên quan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className='bg-red-600 hover:bg-red-700'
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default HashtagManagementStaff
