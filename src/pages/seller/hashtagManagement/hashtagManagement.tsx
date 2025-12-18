import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog'
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
import { Plus, Edit, RefreshCw, Search, Tag } from 'lucide-react'
import { toast } from '../../../utils/toast'
import { useStore } from '../../../contexts/store.context'
import {
  getHashtagsByStoreId,
  createHashtag,
  updateHashtag,
  softDeleteHashtag,
  getHashtagById,
  type HashtagItem,
  type HashtagCreateRequest,
  type HashtagUpdateRequest
} from '../../../apis/hashtag.api'
import Pagination from '../../../components/Pagination/Pagination'
import Loading from '../../../components/Loading/loading'

function HashtagManagement() {
  const { store } = useStore()
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

  // Validation constants
  const MAX_HASHTAG_LENGTH = 30

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedHashtag, setSelectedHashtag] = useState<HashtagItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [nameError, setNameError] = useState<string>('')

  // Form states
  const [formData, setFormData] = useState<HashtagCreateRequest>({
    name: '',
    storeId: '',
    isActive: true
  })

  // Fetch hashtags theo storeId
  const fetchHashtags = async () => {
    if (!store?.id) {
      setError('Không tìm thấy thông tin cửa hàng')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Nếu có search term hoặc filter status, load tất cả dữ liệu để filter ở frontend
      // Nếu không có search và filter status === 'all', sử dụng phân trang từ API
      const hasSearchTerm = searchTerm.trim().length > 0
      const hasStatusFilter = statusFilter !== 'all'
      const apiPageSize = hasSearchTerm || hasStatusFilter ? 0 : pageSize
      const apiPageNumber = hasSearchTerm || hasStatusFilter ? 1 : currentPage

      // Lấy hashtag theo storeId từ API endpoint /store/{storeId}
      const response = await getHashtagsByStoreId(store.id, apiPageSize, apiPageNumber)

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
  }

  useEffect(() => {
    if (store?.id) {
      fetchHashtags()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id, currentPage, statusFilter, searchTerm])

  // Filtered hashtags (chỉ filter status nếu cần, search đã được xử lý ở API nếu có)
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

    // Filter by search term ở frontend với xử lý khoảng trắng
    const trimmedSearchTerm = searchTerm.trim()
    if (trimmedSearchTerm) {
      const searchLower = trimmedSearchTerm.toLowerCase()
      filtered = filtered.filter((hashtag) => hashtag.name.toLowerCase().includes(searchLower))
    }

    return filtered
  }, [hashtags, searchTerm, statusFilter])

  // Paginated hashtags
  // Nếu có search term hoặc filter status, cần phân trang ở frontend
  const paginatedHashtags = useMemo(() => {
    const hasSearchTerm = searchTerm.trim().length > 0
    const hasStatusFilter = statusFilter !== 'all'

    // Nếu có search hoặc filter status, phân trang ở frontend
    if (hasSearchTerm || hasStatusFilter) {
      const startIndex = (currentPage - 1) * pageSize
      const endIndex = startIndex + pageSize
      return filteredHashtags.slice(startIndex, endIndex)
    } else {
      // Không có search và filter, sử dụng phân trang từ API
      return hashtags
    }
  }, [hashtags, filteredHashtags, currentPage, pageSize, statusFilter, searchTerm])

  // Total pages
  const totalPages = useMemo(() => {
    const hasSearchTerm = searchTerm.trim().length > 0
    const hasStatusFilter = statusFilter !== 'all'

    // Nếu có search hoặc filter status, tính từ filteredHashtags
    if (hasSearchTerm || hasStatusFilter) {
      return Math.max(1, Math.ceil(filteredHashtags.length / pageSize))
    } else {
      // Không có search và filter, sử dụng totalPages từ API
      return pagination.totalPages
    }
  }, [statusFilter, pagination.totalPages, filteredHashtags.length, pageSize, searchTerm])

  // Validate hashtag name - check rỗng và độ dài
  const validateHashtagName = (name: string): string => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      return 'Vui lòng nhập tên nhãn dán'
    }

    if (trimmedName.length > MAX_HASHTAG_LENGTH) {
      return `Tên nhãn dán không được vượt quá ${MAX_HASHTAG_LENGTH} ký tự`
    }

    return ''
  }

  // Check duplicate hashtag name in store
  const checkDuplicateHashtag = (name: string, excludeId?: string): boolean => {
    const trimmedName = name.trim().toLowerCase()
    return hashtags.some(
      (hashtag) =>
        hashtag.name.toLowerCase() === trimmedName &&
        hashtag.id !== excludeId &&
        hashtag.description === store?.storeName
    )
  }

  // Handle create
  const handleCreateClick = () => {
    if (!store?.id) {
      toast.error('Không tìm thấy thông tin cửa hàng')
      return
    }
    setFormData({
      name: '',
      storeId: store.id,
      isActive: true
    })
    setNameError('')
    setShowCreateModal(true)
  }

  const handleCreateSubmit = async () => {
    // Validate hashtag name
    const validationError = validateHashtagName(formData.name)
    if (validationError) {
      setNameError(validationError)
      toast.error(validationError)
      return
    }

    // Check duplicate in store
    if (checkDuplicateHashtag(formData.name)) {
      const errorMsg = 'Tên nhãn dán này đã tồn tại trong cửa hàng của bạn'
      setNameError(errorMsg)
      toast.error(errorMsg)
      return
    }

    if (!formData.storeId) {
      toast.error('Không tìm thấy thông tin cửa hàng')
      return
    }

    try {
      setLoading(true)
      // Luôn gửi isActive: true khi tạo mới
      const createData = {
        ...formData,
        isActive: true
      }
      const response = await createHashtag(createData)

      if (response.status === 200 || response.status === 201) {
        toast.success('Tạo nhãn dán thành công')
        setShowCreateModal(false)
        setFormData({
          name: '',
          storeId: '',
          isActive: true
        })
        setNameError('')
        await fetchHashtags()
      } else {
        toast.error(response.message || 'Không thể tạo nhãn dán')
      }
    } catch (error: any) {
      console.error('Error creating hashtag:', error)
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tạo nhãn dán')
    } finally {
      setLoading(false)
    }
  }

  // Handle edit
  const handleEditClick = async (hashtag: HashtagItem) => {
    try {
      setLoading(true)
      const response = await getHashtagById(hashtag.id)

      if (response.status === 200 && response.data) {
        setSelectedHashtag(response.data)
        setFormData({
          name: response.data.name,
          storeId: store?.id || '',
          isActive: response.data.isActive
        })
        setNameError('')
        setShowEditModal(true)
      } else {
        toast.error('Không thể tải thông tin nhãn dán')
      }
    } catch (error: any) {
      console.error('Error fetching hashtag:', error)
      toast.error('Có lỗi xảy ra khi tải thông tin nhãn dán')
    } finally {
      setLoading(false)
    }
  }

  const handleEditSubmit = async () => {
    if (!selectedHashtag) return

    // Validate hashtag name
    const validationError = validateHashtagName(formData.name)
    if (validationError) {
      setNameError(validationError)
      toast.error(validationError)
      return
    }

    // Check duplicate in store (exclude current hashtag)
    if (checkDuplicateHashtag(formData.name, selectedHashtag.id)) {
      const errorMsg = 'Tên nhãn dán này đã tồn tại trong cửa hàng của bạn'
      setNameError(errorMsg)
      toast.error(errorMsg)
      return
    }

    try {
      setLoading(true)
      const updateData: HashtagUpdateRequest = {
        name: formData.name,
        storeId: formData.storeId,
        isActive: formData.isActive
      }

      const response = await updateHashtag(selectedHashtag.id, updateData)

      if (response.status === 200 || response.status === 202) {
        toast.success('Cập nhật nhãn dán thành công')
        setShowEditModal(false)
        setSelectedHashtag(null)
        setFormData({
          name: '',
          storeId: '',
          isActive: true
        })
        setNameError('')
        await fetchHashtags()
      } else {
        toast.error(response.message || 'Không thể cập nhật nhãn dán')
      }
    } catch (error: any) {
      console.error('Error updating hashtag:', error)
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật nhãn dán')
    } finally {
      setLoading(false)
    }
  }

  // Handle delete
 

  const handleDeleteConfirm = async () => {
    if (!selectedHashtag) return

    try {
      setIsDeleting(true)
      const response = await softDeleteHashtag(selectedHashtag.id)

      if (response.status === 200 || response.status === 202) {
        toast.success('Xóa nhãn dán thành công')
        setShowDeleteDialog(false)
        setSelectedHashtag(null)
        await fetchHashtags()
      } else {
        toast.error(response.message || 'Không thể xóa nhãn dán')
      }
    } catch (error: any) {
      console.error('Error deleting hashtag:', error)
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi xóa nhãn dán')
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
          <h1 className='text-3xl font-bold text-green-700 flex items-center gap-2'>Quản lý nhãn dán</h1>
          <p className='text-gray-600 mt-2'>Quản lý các nhãn dán của cửa hàng</p>
        </div>
        <Button onClick={handleCreateClick} variant='yellow'>
          <Plus className='w-4 h-4 mr-2' />
          Tạo nhãn dán mới
        </Button>
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
                  className='pl-10 h-9 border-gray-300 focus:border-green-500 focus:ring-green-500 w-full'
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
                  className='h-10 border-gray-300 focus:border-green-500 focus:ring-green-500 w-full'
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
          <CardTitle className='text-green-700 py-2'>Danh sách nhãn dán</CardTitle>
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
                              onClick={() => handleEditClick(hashtag)}
                              className='text-blue-600 hover:text-blue-700'
                            >
                              <Edit className='w-4 h-4' />
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

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo nhãn dán mới</DialogTitle>
            <DialogDescription>Nhập thông tin để tạo nhãn dán mới cho cửa hàng</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='create-name'>Tên nhãn dán *</Label>
              <Input
                id='create-name'
                placeholder='Nhập tên nhãn dán...'
                value={formData.name}
                onChange={(e) => {
                  const value = e.target.value
                  // Giới hạn độ dài
                  if (value.length > MAX_HASHTAG_LENGTH) {
                    return
                  }
                  setFormData({ ...formData, name: value })
                  // Real-time validation
                  if (!value.trim()) {
                    setNameError('')
                    return
                  }
                  const error = validateHashtagName(value)
                  if (!error && checkDuplicateHashtag(value)) {
                    setNameError('Tên nhãn dán này đã tồn tại trong cửa hàng của bạn')
                  } else {
                    setNameError(error)
                  }
                }}
                maxLength={MAX_HASHTAG_LENGTH}
                className={nameError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {nameError && <p className='text-sm text-red-500'>{nameError}</p>}
              {!nameError && formData.name && (
                <p className='text-xs text-gray-500'>
                  {formData.name.length}/{MAX_HASHTAG_LENGTH} ký tự
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowCreateModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateSubmit} disabled={loading} variant='yellow'>
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa nhãn dán</DialogTitle>
            <DialogDescription>Cập nhật thông tin nhãn dán</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit-name'>Tên nhãn dán *</Label>
              <Input
                id='edit-name'
                placeholder='Nhập tên nhãn dán...'
                value={formData.name}
                onChange={(e) => {
                  const value = e.target.value
                  // Giới hạn độ dài
                  if (value.length > MAX_HASHTAG_LENGTH) {
                    return
                  }
                  setFormData({ ...formData, name: value })
                  // Real-time validation
                  if (!value.trim()) {
                    setNameError('')
                    return
                  }
                  const error = validateHashtagName(value)
                  if (!error && checkDuplicateHashtag(value, selectedHashtag?.id)) {
                    setNameError('Tên nhãn dán này đã tồn tại trong cửa hàng của bạn')
                  } else {
                    setNameError(error)
                  }
                }}
                maxLength={MAX_HASHTAG_LENGTH}
                className={nameError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {nameError && <p className='text-sm text-red-500'>{nameError}</p>}
              {!nameError && formData.name && (
                <p className='text-xs text-gray-500'>
                  {formData.name.length}/{MAX_HASHTAG_LENGTH} ký tự
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='edit-isActive'>Trạng thái</Label>
              <Select
                value={formData.isActive ? 'true' : 'false'}
                onValueChange={(value) => setFormData({ ...formData, isActive: value === 'true' })}
              >
                <SelectTrigger id='edit-isActive'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='true'>Đang hoạt động</SelectItem>
                  <SelectItem value='false'>Tạm dừng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowEditModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleEditSubmit} disabled={loading} className='bg-green-600 hover:bg-green-700'>
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dừng hoạt động nhãn dán</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn dừng hoạt động nhãn dán <strong>#{selectedHashtag?.name}</strong>? Hành động này sẽ ảnh hưởng
              tới các sản phẩm liên quan
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className='bg-red-600 hover:bg-red-700'
            >
              {isDeleting ? 'Đang dừng...' : 'Dừng'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default HashtagManagement
