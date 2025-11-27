import { useState, useEffect, useCallback } from 'react'
import { Search, Eye, CheckCircle, XCircle, Plus, Edit, RefreshCw } from 'lucide-react'
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
import { Switch } from '../../../components/ui/switch'
import Loading from '../../../components/Loading/loading'
import {
  getAllProductCategory,
  createProductCategory,
  updateProductCategory,
  type ProductCategoryItem
} from '../../../apis/productCategory.api'
import { toast } from 'react-toastify'
import Pagination from '../../../components/Pagination/Pagination'
import { ShimmerBorder } from '../../../components/ui/shimmer'

function ListCategory() {
  // State management
  const [productCategoryData, setProductCategoryData] = useState<ProductCategoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchText, setSearchText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ProductCategoryItem | null>(null)
  const [viewingItem, setViewingItem] = useState<ProductCategoryItem | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  })
  const [nameError, setNameError] = useState('')
  const [descriptionError, setDescriptionError] = useState('')

  // Fetch data function
  const fetchProductCategory = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const response = await getAllProductCategory({})
      console.log('response', response)

      if (response.status === 200) {
        setProductCategoryData(response.data)
      } else {
        setError('Có lỗi xảy ra khi tải dữ liệu')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu'
      setError(errorMessage)
      toast.error('Không thể tải dữ liệu ProductCategory')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load data on component mount
  useEffect(() => {
    fetchProductCategory()
  }, [fetchProductCategory])

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchText])

  // Filter data based on search
  const filteredData = productCategoryData.filter(
    (item) =>
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.description.toLowerCase().includes(searchText.toLowerCase())
  )

  // Pagination logic
  const totalFilteredItems = filteredData.length
  const totalPages = Math.ceil(totalFilteredItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = filteredData.slice(startIndex, endIndex)

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle view details
  const handleViewDetails = (item: ProductCategoryItem) => {
    setViewingItem(item)
    setIsDetailModalOpen(true)
  }

  // Handle create new
  const handleCreateNew = () => {
    setEditingItem(null)
    setFormData({ name: '', description: '', isActive: true })
    setNameError('')
    setDescriptionError('')
    setIsModalOpen(true)
  }

  // Handle edit
  const handleEdit = (item: ProductCategoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      isActive: item.isActive
    })
    setNameError('')
    setDescriptionError('')
    setIsModalOpen(true)
  }

  // Handle form submit
  const handleFormSubmit = async () => {
    // Reset errors
    setNameError('')
    setDescriptionError('')

    // Validate required fields
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      if (!formData.name.trim()) {
        setNameError('Tên danh mục là bắt buộc')
      }
      if (!formData.description.trim()) {
        setDescriptionError('Mô tả là bắt buộc')
      }
      return
    }

    // Validate name length (max 10 characters)
    if (formData.name.length > 10) {
      setNameError(`Tên danh mục không được vượt quá 10 ký tự (${formData.name.length}/10 ký tự)`)
      toast.error(`Tên danh mục không được vượt quá 10 ký tự`)
      return
    }

    // Validate description length (max 20 characters)
    if (formData.description.length > 20) {
      setDescriptionError(`Mô tả không được vượt quá 20 ký tự (${formData.description.length}/20 ký tự)`)
      toast.error(`Mô tả không được vượt quá 20 ký tự`)
      return
    }

    try {
      setFormLoading(true)

      if (editingItem) {
        // Update existing item
        await updateProductCategory(editingItem.id, formData as ProductCategoryItem)
        toast.success('Cập nhật danh mục sản phẩm thành công')
      } else {
        // Create new item
        await createProductCategory(formData as ProductCategoryItem)
        toast.success('Tạo danh mục sản phẩm mới thành công')
      }

      setIsModalOpen(false)
      setFormData({ name: '', description: '', isActive: true })
      setEditingItem(null)
      setNameError('')
      setDescriptionError('')
      fetchProductCategory() // Refresh data
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra'
      toast.error(errorMessage)
    } finally {
      setFormLoading(false)
    }
  }

  // Handle modal close with form reset
  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open)
    if (!open) {
      setEditingItem(null)
      setFormData({ name: '', description: '', isActive: true })
      setNameError('')
      setDescriptionError('')
    }
  }

  // Handle detail modal close
  const handleDetailModalClose = (open: boolean) => {
    setIsDetailModalOpen(open)
    if (!open) {
      setViewingItem(null)
    }
  }

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <Card className='bg-gradient-to-br from-cyan-500 to-cyan-600 border-0 shadow-lg'>
        <CardContent className='py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <h2 className='text-3xl font-bold text-white m-0'>Danh mục sản phẩm</h2>
            </div>
            <div className='flex items-center gap-3'>

              <Button onClick={handleCreateNew} className='bg-white/10 hover:bg-white/20 text-white border-white/20'>
                <Plus className='w-4 h-4 mr-2' />
                Thêm mới
              </Button>
            </div>
          </div>
          <p className='text-white/90 mt-2'>
            Quản lý và theo dõi tất cả danh mục sản phẩm ({totalFilteredItems} danh mục)
          </p>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className='bg-white shadow-sm'>
        <CardContent className='p-6'>
          <div className='flex items-center gap-4'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <Input
                placeholder='Tìm kiếm theo tên hoặc mô tả danh mục...'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className='pl-10'
              />
            </div>
            <ShimmerBorder
              className='cursor-pointer'
              color='#fff'
              animationDuration='3s'
              contentClassName='bg-white/10 rounded-lg'
            >
              <Button
                onClick={fetchProductCategory}
                disabled={loading}
                variant='outline'
                className='flex items-center gap-2 bg-transparent border-transparent text-white hover:bg-white/20 hover:text-white w-full'
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Đang tải...' : 'Làm mới'}
              </Button>
            </ShimmerBorder>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className='bg-white shadow-sm'>
        <CardHeader>
          <CardTitle className='text-lg font-semibold text-gray-900'>
            Danh sách danh mục sản phẩm ({filteredData.length} mục)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='py-12'>
              <Loading size='md' text='Đang tải dữ liệu danh mục...' />
            </div>
          ) : error ? (
            <div className='text-center py-12'>
              <p className='text-red-600 mb-4'>{error}</p>
              <Button onClick={fetchProductCategory} variant='outline'>
                Thử lại
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='px-6 py-3'>Tên danh mục</TableHead>
                  <TableHead className='px-6 py-3'>Mô tả</TableHead>
                  <TableHead className='px-6 py-3'>Trạng thái</TableHead>
                  <TableHead className='px-6 py-3'>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className='text-center py-12 text-gray-500'>
                      {searchText ? 'Không tìm thấy kết quả phù hợp' : 'Không có dữ liệu'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => (
                    <TableRow key={item.id} className='hover:bg-gray-50'>
                      <TableCell className='px-6 py-4'>
                        <div className='font-medium text-gray-900'>{item.name}</div>
                      </TableCell>
                      <TableCell className='px-6 py-4'>
                        <div className='text-gray-600 max-w-xs truncate' title={item.description}>
                          {item.description}
                        </div>
                      </TableCell>
                      <TableCell className='px-6 py-4'>
                        <Badge
                          variant='outline'
                          className={
                            item.isActive
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }
                        >
                          <div className='flex items-center gap-1'>
                            {item.isActive ? <CheckCircle className='w-3 h-3' /> : <XCircle className='w-3 h-3' />}
                            {item.isActive ? 'Hoạt động' : 'Không hoạt động'}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className='px-6 py-4'>
                        <div className='flex items-center gap-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => handleViewDetails(item)}
                            className='text-blue-600 hover:text-blue-700'
                          >
                            <Eye className='w-4 h-4' />
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => handleEdit(item)}
                            className='text-green-600 hover:text-green-700'
                          >
                            <Edit className='w-4 h-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          {/* Pagination */}
          {!loading && !error && filteredData.length > 0 && (
            <div className='mt-6'>
              <div className='flex items-center justify-between mb-4'>
                <div className='text-sm text-gray-600'>
                  Hiển thị {startIndex + 1} đến {Math.min(endIndex, totalFilteredItems)} của {totalFilteredItems} kết
                  quả
                </div>
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className='sm:max-w-[500px] bg-white border-gray-200'>
          <DialogHeader className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-gray-100 rounded-lg'>
                {editingItem ? <Edit className='w-5 h-5 text-gray-600' /> : <Plus className='w-5 h-5 text-gray-600' />}
              </div>
              <DialogTitle className='text-xl font-bold text-gray-900'>
                {editingItem ? 'Chỉnh sửa danh mục sản phẩm' : 'Tạo danh mục sản phẩm mới'}
              </DialogTitle>
            </div>
            <DialogDescription className='text-gray-600'>
              {editingItem ? 'Cập nhật thông tin danh mục sản phẩm.' : 'Điền thông tin để tạo danh mục sản phẩm mới.'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-6 py-4'>
            {/* Tên danh mục */}
            <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
              <div className='flex items-center gap-2 mb-3'>
                <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
                <Label htmlFor='name' className='text-sm font-semibold text-gray-900'>
                  Tên danh mục *
                </Label>
              </div>
              <Input
                id='name'
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  if (e.target.value.length > 10) {
                    setNameError(`Tên danh mục không được vượt quá 10 ký tự (${e.target.value.length}/10 ký tự)`)
                  } else {
                    setNameError('')
                  }
                }}
                className={`border-gray-300 focus:border-gray-500 focus:ring-gray-500 ${nameError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                placeholder='Nhập tên danh mục...'
                maxLength={10}
              />
              <div className='mt-2 flex items-center justify-between'>
                <span className={`text-xs ${nameError ? 'text-red-500' : 'text-gray-500'}`}>
                  {nameError
                    ? `Tên danh mục không được vượt quá 10 ký tự (${formData.name.length}/10 ký tự)`
                    : `Số ký tự: ${formData.name.length}/10`}
                </span>
              </div>
            </div>

            {/* Mô tả */}
            <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
              <div className='flex items-center gap-2 mb-3'>
                <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
                <Label htmlFor='description' className='text-sm font-semibold text-gray-900'>
                  Mô tả *
                </Label>
              </div>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value })
                  if (e.target.value.length > 20) {
                    setDescriptionError(`Mô tả không được vượt quá 20 ký tự (${e.target.value.length}/20 ký tự)`)
                  } else {
                    setDescriptionError('')
                  }
                }}
                className={`border-gray-300 focus:border-gray-500 focus:ring-gray-500 ${descriptionError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                placeholder='Nhập mô tả danh mục...'
                rows={3}
                maxLength={20}
              />
              <div className='mt-2 flex items-center justify-between'>
                <span className={`text-xs ${descriptionError ? 'text-red-500' : 'text-gray-500'}`}>
                  {descriptionError
                    ? `Mô tả không được vượt quá 20 ký tự (${formData.description.length}/20 ký tự)`
                    : `Số ký tự: ${formData.description.length}/20`}
                </span>
              </div>
            </div>

            {/* Trạng thái */}
            <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
              <div className='flex items-center gap-2 mb-3'>
                <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
                <Label htmlFor='isActive' className='text-sm font-semibold text-gray-900'>
                  Trạng thái
                </Label>
              </div>
              <div className='flex items-center gap-3'>
                <Switch
                  id='isActive'
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor='isActive' className='text-sm font-medium text-gray-700'>
                  {formData.isActive ? 'Hoạt động' : 'Không hoạt động'}
                </Label>
                <Badge
                  variant='outline'
                  className={
                    formData.isActive
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                  }
                >
                  {formData.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter className='bg-gray-50 rounded-lg p-4 border-t border-gray-200'>
            <div className='flex gap-3 w-full'>
              <Button
                variant='outline'
                onClick={() => handleModalClose(false)}
                disabled={formLoading}
                className='flex-1 border-gray-300 text-gray-700 hover:bg-gray-50'
              >
                Hủy
              </Button>
              <Button
                onClick={handleFormSubmit}
                disabled={formLoading}
                className='flex-1 bg-green-600 hover:bg-green-700 text-white'
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
      <Dialog open={isDetailModalOpen} onOpenChange={handleDetailModalClose}>
        <DialogContent className='sm:max-w-[500px] bg-white border-gray-200'>
          <DialogHeader className='space-y-3'>
            <div className='flex items-center gap-3'>
              <DialogTitle className='text-xl font-bold text-gray-900'>Chi tiết danh mục sản phẩm</DialogTitle>
            </div>
          </DialogHeader>

          {viewingItem && (
            <div className='space-y-6 py-4'>
              {/* Tên danh mục */}
              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
                  <Label className='text-sm font-semibold text-gray-900'>Tên danh mục</Label>
                </div>
                <p className='text-gray-900 font-medium text-lg'>{viewingItem.name}</p>
              </div>

              {/* Mô tả */}
              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
                  <Label className='text-sm font-semibold text-gray-900'>Mô tả</Label>
                </div>
                <p className='text-gray-900 leading-relaxed'>{viewingItem.description}</p>
              </div>

              {/* Trạng thái */}
              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
                  <Label className='text-sm font-semibold text-gray-900'>Trạng thái</Label>
                </div>
                <Badge
                  variant='outline'
                  className={
                    viewingItem.isActive
                      ? 'bg-green-100 text-green-800 border-green-300 px-3 py-1'
                      : 'bg-red-100 text-red-800 border-red-300 px-3 py-1'
                  }
                >
                  <div className='flex items-center gap-2'>
                    {viewingItem.isActive ? <CheckCircle className='w-4 h-4' /> : <XCircle className='w-4 h-4' />}
                    {viewingItem.isActive ? 'Hoạt động' : 'Không hoạt động'}
                  </div>
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter className='bg-gray-50 rounded-lg p-4 border-t border-gray-200'>
            <div className='flex gap-3 w-full'>
              <Button
                variant='outline'
                onClick={() => handleDetailModalClose(false)}
                className='flex-1 border-gray-300 text-gray-700 hover:bg-gray-50'
              >
                Đóng
              </Button>
              <Button
                onClick={() => {
                  handleDetailModalClose(false)
                  handleEdit(viewingItem!)
                }}
                className='flex-1 bg-green-600 hover:bg-green-700 text-white'
              >
                <Edit className='w-4 h-4 mr-2' />
                Chỉnh sửa
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ListCategory
