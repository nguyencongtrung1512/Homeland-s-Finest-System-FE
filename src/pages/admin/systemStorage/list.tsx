import { useState, useEffect, useCallback } from 'react'
import { Search, Edit, Eye, Trash2, Plus, MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Badge } from '../../../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../../components/ui/dropdown-menu'
import {
  getAllSystemStorage,
  createSystemStorage,
  updateSystemStorage,
  deleteSystemStorage,
  type SystemStorageItem
} from '../../../apis/systemStorage.api'
import { toast } from '../../../utils/toast'
import Loading from '../../../components/Loading/loading'

function SystemStorage() {
  // State management
  const [systemStorageData, setSystemStorageData] = useState<SystemStorageItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchText, setSearchText] = useState('')
  const pageSize = 10

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SystemStorageItem | null>(null)
  const [viewingItem, setViewingItem] = useState<SystemStorageItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<SystemStorageItem | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    value: ''
  })
  const [formErrors, setFormErrors] = useState({
    name: '',
    description: '',
    value: ''
  })
  // Fetch data function
  const fetchSystemStorage = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const response = await getAllSystemStorage({
        pageSize: pageSize,
        pageNumber: 1
      })

      if (response.status === 200) {
        setSystemStorageData(response.data)
      } else {
        setError('Có lỗi xảy ra khi tải dữ liệu')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu'
      setError(errorMessage)
      toast.error('Không thể tải dữ liệu SystemStorage')
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  // Load data on component mount
  useEffect(() => {
    fetchSystemStorage()
  }, [fetchSystemStorage])

  // Filter data based on search
  const filteredData = systemStorageData.filter(
    (item) =>
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.description.toLowerCase().includes(searchText.toLowerCase()) ||
      item.value.toLowerCase().includes(searchText.toLowerCase())
  )

  // Handle view details
  const handleViewDetails = (item: SystemStorageItem) => {
    setViewingItem(item)
    setIsDetailModalOpen(true)
  }

  // Validation function
  const validateForm = () => {
    const errors = {
      name: '',
      description: '',
      value: ''
    }
    let isValid = true

    // Validate name (minimum 20 characters)
    const trimmedName = formData.name.trim()
    if (!trimmedName) {
      errors.name = 'Tên không được để trống'
      isValid = false
    } else if (trimmedName.length < 20) {
      errors.name = `Tên phải có ít nhất 20 ký tự (hiện tại: ${trimmedName.length} ký tự)`
      isValid = false
    } else if (trimmedName.length > 100) {
      errors.name = 'Tên không được vượt quá 100 ký tự'
      isValid = false
    }

    // Validate description (minimum 20 characters)
    const trimmedDescription = formData.description.trim()
    if (!trimmedDescription) {
      errors.description = 'Mô tả không được để trống'
      isValid = false
    } else if (trimmedDescription.length < 20) {
      errors.description = `Mô tả phải có ít nhất 20 ký tự (hiện tại: ${trimmedDescription.length} ký tự)`
      isValid = false
    } else if (trimmedDescription.length > 500) {
      errors.description = 'Mô tả không được vượt quá 500 ký tự'
      isValid = false
    }

    // Validate value (must be >= 0)
    const trimmedValue = formData.value.trim()
    if (!trimmedValue) {
      errors.value = 'Giá trị không được để trống'
      isValid = false
    } else {
      // Check if it's a valid number (allows decimals)
      if (!/^-?\d*\.?\d+$/.test(trimmedValue)) {
        errors.value = 'Giá trị phải là một số hợp lệ'
        isValid = false
      } else {
        const numValue = Number(trimmedValue)
        if (isNaN(numValue)) {
          errors.value = 'Giá trị phải là một số hợp lệ'
          isValid = false
        } else if (numValue < 0) {
          errors.value = 'Giá trị không được nhỏ hơn 0'
          isValid = false
        } else if (!Number.isFinite(numValue)) {
          errors.value = 'Giá trị phải là một số hữu hạn'
          isValid = false
        }
      }
    }

    setFormErrors(errors)
    return isValid
  }

  // Handle create new
  const handleCreateNew = () => {
    setEditingItem(null)
    setFormData({ name: '', description: '', value: '' })
    setFormErrors({ name: '', description: '', value: '' })
    setIsModalOpen(true)
  }

  // Handle edit
  const handleEdit = (item: SystemStorageItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      value: item.value
    })
    setFormErrors({ name: '', description: '', value: '' })
    setIsModalOpen(true)
  }

  // Handle delete
  const handleDelete = (item: SystemStorageItem) => {
    setDeletingItem(item)
    setIsDeleteModalOpen(true)
  }

  // Handle form submit
  const handleFormSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin đã nhập')
      return
    }

    try {
      setFormLoading(true)

      if (editingItem) {
        // Update existing item
        await updateSystemStorage(editingItem.id, formData as SystemStorageItem)
        toast.success('Cập nhật SystemStorage thành công')
      } else {
        // Create new item
        await createSystemStorage(formData as SystemStorageItem)
        toast.success('Tạo SystemStorage mới thành công')
      }

      setIsModalOpen(false)
      setFormData({ name: '', description: '', value: '' })
      setFormErrors({ name: '', description: '', value: '' })
      setEditingItem(null)
      fetchSystemStorage() // Refresh data
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra'
      toast.error(errorMessage)
    } finally {
      setFormLoading(false)
    }
  }

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return

    try {
      setFormLoading(true)
      await deleteSystemStorage(deletingItem.id)
      toast.success('Xóa SystemStorage thành công')
      setIsDeleteModalOpen(false)
      setDeletingItem(null)
      fetchSystemStorage() // Refresh data
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra'
      toast.error(errorMessage)
    } finally {
      setFormLoading(false)
    }
  }

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    setFormData({ name: '', description: '', value: '' })
    setFormErrors({ name: '', description: '', value: '' })
  }

  // Handle detail modal close
  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false)
    setViewingItem(null)
  }

  // Handle delete modal close
  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false)
    setDeletingItem(null)
  }

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-gray-900'>Quản lý System Storage</h1>
        <Button onClick={handleCreateNew} className='text-white' variant='blue'>
          <Plus className='w-4 h-4 mr-2' />
          Thêm mới
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className='bg-white shadow-sm'>
        <CardContent className='p-6'>
          <div className='flex items-center gap-4'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <Input
                placeholder='Tìm kiếm theo tên, mô tả hoặc giá trị...'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className='pl-10'
              />
            </div>
            <Button variant='outline' onClick={fetchSystemStorage} disabled={loading}>
              {loading ? 'Đang tải...' : 'Làm mới'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className='bg-white shadow-sm'>
        <CardHeader>
          <CardTitle className='text-lg font-semibold text-gray-900'>
            Danh sách System Storage ({filteredData.length} mục)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='py-12'>
              <Loading size='md' text='Đang tải dữ liệu SystemStorage...' />
            </div>
          ) : error ? (
            <div className='text-center py-12'>
              <p className='text-red-600 mb-4'>{error}</p>
              <Button onClick={fetchSystemStorage} variant='outline'>
                Thử lại
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='px-6 py-3'>Tên</TableHead>
                  <TableHead className='px-6 py-3'>Mô tả</TableHead>
                  <TableHead className='px-6 py-3'>Giá trị</TableHead>
                  <TableHead className='px-6 py-3'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className='text-center py-12 text-gray-500'>
                      {searchText ? 'Không tìm thấy kết quả phù hợp' : 'Không có dữ liệu'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.id} className='hover:bg-gray-50'>
                      <TableCell className='px-6 py-4'>
                        <div className='font-medium text-gray-900'>{item.name}</div>
                      </TableCell>
                      <TableCell className='px-6 py-4'>
                        <div className='text-gray-600'>{item.description}</div>
                      </TableCell>
                      <TableCell className='px-6 py-4'>
                        <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200'>
                          {item.value}
                        </Badge>
                      </TableCell>
                      <TableCell className='px-6 py-4'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='outline' size='sm' className='border-border hover:bg-accent'>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end' className='w-48'>
                            <DropdownMenuItem onClick={() => handleViewDetails(item)} className='cursor-pointer'>
                              <Eye className='mr-2 h-4 w-4 text-blue-600' />
                              <span>Xem chi tiết</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(item)} className='cursor-pointer'>
                              <Edit className='mr-2 h-4 w-4 text-green-600' />
                              <span>Chỉnh sửa</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(item)}
                              className='cursor-pointer text-red-600 focus:text-red-600'
                            >
                              <Trash2 className='mr-2 h-4 w-4' />
                              <span>Xóa</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className='sm:max-w-[500px] bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200'>
          <DialogHeader className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-blue-100 rounded-lg'>
                {editingItem ? <Edit className='w-5 h-5 text-blue-600' /> : <Plus className='w-5 h-5 text-blue-600' />}
              </div>
              <DialogTitle className='text-xl font-bold text-blue-800'>
                {editingItem ? 'Chỉnh sửa SystemStorage' : 'Tạo SystemStorage mới'}
              </DialogTitle>
            </div>
            <DialogDescription className='text-blue-600'>
              {editingItem ? 'Cập nhật thông tin SystemStorage.' : 'Điền thông tin để tạo SystemStorage mới.'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-6 py-4'>
            {/* Tên */}
            <div className='bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-200'>
              <div className='flex items-center gap-2 mb-3'>
                <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                <Label htmlFor='name' className='text-sm font-semibold text-blue-700'>
                  Tên *
                </Label>
              </div>
              <Input
                id='name'
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  if (formErrors.name) {
                    setFormErrors({ ...formErrors, name: '' })
                  }
                }}
                className={`border-blue-300 focus:border-blue-500 focus:ring-blue-500 ${
                  formErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder='Nhập tên (tối thiểu 20 ký tự)...'
              />
              {formErrors.name && (
                <p className='text-red-600 text-sm mt-2 flex items-center gap-1'>
                  <span className='text-red-500'>•</span>
                  {formErrors.name}
                </p>
              )}
            </div>

            {/* Mô tả */}
            <div className='bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-200'>
              <div className='flex items-center gap-2 mb-3'>
                <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                <Label htmlFor='description' className='text-sm font-semibold text-blue-700'>
                  Mô tả *
                </Label>
              </div>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value })
                  if (formErrors.description) {
                    setFormErrors({ ...formErrors, description: '' })
                  }
                }}
                className={`border-blue-300 focus:border-blue-500 focus:ring-blue-500 ${
                  formErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder='Nhập mô tả (tối thiểu 20 ký tự)...'
                rows={3}
              />
              {formErrors.description && (
                <p className='text-red-600 text-sm mt-2 flex items-center gap-1'>
                  <span className='text-red-500'>•</span>
                  {formErrors.description}
                </p>
              )}
            </div>

            {/* Giá trị */}
            <div className='bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-200'>
              <div className='flex items-center gap-2 mb-3'>
                <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                <Label htmlFor='value' className='text-sm font-semibold text-blue-700'>
                  Giá trị *
                </Label>
              </div>
              <Input
                id='value'
                type='number'
                value={formData.value}
                onChange={(e) => {
                  setFormData({ ...formData, value: e.target.value })
                  if (formErrors.value) {
                    setFormErrors({ ...formErrors, value: '' })
                  }
                }}
                className={`border-blue-300 focus:border-blue-500 focus:ring-blue-500 ${
                  formErrors.value ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder='Nhập giá trị (>= 0)...'
                min='0'
              />
              {formErrors.value && (
                <p className='text-red-600 text-sm mt-2 flex items-center gap-1'>
                  <span className='text-red-500'>•</span>
                  {formErrors.value}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className='bg-blue-50/50 rounded-lg p-4 border-t border-blue-200'>
            <div className='flex gap-3 w-full'>
              <Button
                variant='outline'
                onClick={handleModalClose}
                disabled={formLoading}
                className='flex-1 border-blue-300 text-blue-700 hover:bg-blue-50'
              >
                Hủy
              </Button>
              <Button
                onClick={handleFormSubmit}
                disabled={formLoading}
                className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
              >
                {formLoading ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                    Đang xử lý...
                  </>
                ) : editingItem ? (
                  <>
                    <Edit className='w-4 h-4 mr-2' />
                    Cập nhật
                  </>
                ) : (
                  <>
                    <Plus className='w-4 h-4 mr-2' />
                    Tạo mới
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail View Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className='sm:max-w-[500px] bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200'>
          <DialogHeader className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-blue-100 rounded-lg'>
                <Eye className='w-5 h-5 text-blue-600' />
              </div>
              <DialogTitle className='text-xl font-bold text-blue-800'>Chi tiết SystemStorage</DialogTitle>
            </div>
            <DialogDescription className='text-blue-600'>Thông tin chi tiết về SystemStorage</DialogDescription>
          </DialogHeader>

          {viewingItem && (
            <div className='space-y-6 py-4'>
              {/* Tên */}
              <div className='bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-200'>
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                  <Label className='text-sm font-semibold text-blue-700'>Tên</Label>
                </div>
                <p className='text-gray-800 font-medium text-lg'>{viewingItem.name}</p>
              </div>

              {/* Mô tả */}
              <div className='bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-200'>
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                  <Label className='text-sm font-semibold text-blue-700'>Mô tả</Label>
                </div>
                <p className='text-gray-700 leading-relaxed'>{viewingItem.description}</p>
              </div>

              {/* Giá trị */}
              <div className='bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-200'>
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                  <Label className='text-sm font-semibold text-blue-700'>Giá trị</Label>
                </div>
                <Badge variant='outline' className='bg-blue-100 text-blue-800 border-blue-300 px-3 py-1'>
                  {viewingItem.value}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter className='bg-blue-50/50 rounded-lg p-4 border-t border-blue-200'>
            <div className='flex gap-3 w-full'>
              <Button
                variant='outline'
                onClick={handleDetailModalClose}
                className='flex-1 border-blue-300 text-blue-700 hover:bg-blue-50'
              >
                Đóng
              </Button>
              <Button
                onClick={() => {
                  handleDetailModalClose()
                  handleEdit(viewingItem!)
                }}
                className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
              >
                <Edit className='w-4 h-4 mr-2' />
                Chỉnh sửa
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa SystemStorage "{deletingItem?.name}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={handleDeleteModalClose} disabled={formLoading}>
              Hủy
            </Button>
            <Button variant='destructive' onClick={handleDeleteConfirm} disabled={formLoading}>
              {formLoading ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SystemStorage
