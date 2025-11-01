import { useState, useEffect, useCallback } from 'react'
import { Search, Eye, Calendar, CheckCircle, XCircle, Plus, Edit } from 'lucide-react'
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

function ListCategory() {
  // State management
  const [productCategoryData, setProductCategoryData] = useState<ProductCategoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchText, setSearchText] = useState('')

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

  // Filter data based on search
  const filteredData = productCategoryData.filter(
    (item) =>
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.description.toLowerCase().includes(searchText.toLowerCase())
  )

  // Handle view details
  const handleViewDetails = (item: ProductCategoryItem) => {
    setViewingItem(item)
    setIsDetailModalOpen(true)
  }

  // Handle create new
  const handleCreateNew = () => {
    setEditingItem(null)
    setFormData({ name: '', description: '', isActive: true })
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
    setIsModalOpen(true)
  }

  // Handle form submit
  const handleFormSubmit = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin')
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
      fetchProductCategory() // Refresh data
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
    setFormData({ name: '', description: '', isActive: true })
  }

  // Handle detail modal close
  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false)
    setViewingItem(null)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-gray-900'>Danh mục sản phẩm</h1>
        <div className='flex items-center gap-4'>
          <div className='text-sm text-gray-600'>Tổng cộng: {filteredData.length} danh mục</div>
          <Button onClick={handleCreateNew} className='bg-green-600 hover:bg-green-700 text-white'>
            <Plus className='w-4 h-4 mr-2' />
            Thêm mới
          </Button>
        </div>
      </div>

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
            <Button variant='outline' onClick={fetchProductCategory} disabled={loading}>
              {loading ? 'Đang tải...' : 'Làm mới'}
            </Button>
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
                  filteredData.map((item) => (
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
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className='sm:max-w-[500px] bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'>
          <DialogHeader className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-green-100 rounded-lg'>
                {editingItem ? (
                  <Edit className='w-5 h-5 text-green-600' />
                ) : (
                  <Plus className='w-5 h-5 text-green-600' />
                )}
              </div>
              <DialogTitle className='text-xl font-bold text-green-800'>
                {editingItem ? 'Chỉnh sửa danh mục sản phẩm' : 'Tạo danh mục sản phẩm mới'}
              </DialogTitle>
            </div>
            <DialogDescription className='text-green-600'>
              {editingItem ? 'Cập nhật thông tin danh mục sản phẩm.' : 'Điền thông tin để tạo danh mục sản phẩm mới.'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-6 py-4'>
            {/* Tên danh mục */}
            <div className='bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-green-200'>
              <div className='flex items-center gap-2 mb-3'>
                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                <Label htmlFor='name' className='text-sm font-semibold text-green-700'>
                  Tên danh mục *
                </Label>
              </div>
              <Input
                id='name'
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className='border-green-300 focus:border-green-500 focus:ring-green-500'
                placeholder='Nhập tên danh mục...'
              />
            </div>

            {/* Mô tả */}
            <div className='bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-green-200'>
              <div className='flex items-center gap-2 mb-3'>
                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                <Label htmlFor='description' className='text-sm font-semibold text-green-700'>
                  Mô tả *
                </Label>
              </div>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className='border-green-300 focus:border-green-500 focus:ring-green-500'
                placeholder='Nhập mô tả danh mục...'
                rows={3}
              />
            </div>

            {/* Trạng thái */}
            <div className='bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-green-200'>
              <div className='flex items-center gap-2 mb-3'>
                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                <Label htmlFor='isActive' className='text-sm font-semibold text-green-700'>
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
          <DialogFooter className='bg-green-50/50 rounded-lg p-4 border-t border-green-200'>
            <div className='flex gap-3 w-full'>
              <Button
                variant='outline'
                onClick={handleModalClose}
                disabled={formLoading}
                className='flex-1 border-green-300 text-green-700 hover:bg-green-50'
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
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className='sm:max-w-[500px] bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'>
          <DialogHeader className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-green-100 rounded-lg'>
                <Eye className='w-5 h-5 text-green-600' />
              </div>
              <DialogTitle className='text-xl font-bold text-green-800'>Chi tiết danh mục sản phẩm</DialogTitle>
            </div>
            <DialogDescription className='text-green-600'>Thông tin chi tiết về danh mục sản phẩm</DialogDescription>
          </DialogHeader>

          {viewingItem && (
            <div className='space-y-6 py-4'>
              {/* Tên danh mục */}
              <div className='bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-green-200'>
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  <Label className='text-sm font-semibold text-green-700'>Tên danh mục</Label>
                </div>
                <p className='text-gray-800 font-medium text-lg'>{viewingItem.name}</p>
              </div>

              {/* Mô tả */}
              <div className='bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-green-200'>
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  <Label className='text-sm font-semibold text-green-700'>Mô tả</Label>
                </div>
                <p className='text-gray-700 leading-relaxed'>{viewingItem.description}</p>
              </div>

              {/* Trạng thái */}
              <div className='bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-green-200'>
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  <Label className='text-sm font-semibold text-green-700'>Trạng thái</Label>
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

              {/* Ngày tạo */}
              <div className='bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-green-200'>
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  <Label className='text-sm font-semibold text-green-700'>Ngày tạo</Label>
                </div>
                <div className='flex items-center gap-2 text-gray-700'>
                  <Calendar className='w-4 h-4 text-green-600' />
                  <span className='font-medium'>{formatDate(viewingItem.createdAt)}</span>
                </div>
              </div>

              {/* Ngày cập nhật */}
              <div className='bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-green-200'>
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  <Label className='text-sm font-semibold text-green-700'>Ngày cập nhật</Label>
                </div>
                <div className='flex items-center gap-2 text-gray-700'>
                  <Calendar className='w-4 h-4 text-green-600' />
                  <span className='font-medium'>
                    {viewingItem.updatedAt ? formatDate(viewingItem.updatedAt) : 'Chưa cập nhật'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className='bg-green-50/50 rounded-lg p-4 border-t border-green-200'>
            <div className='flex gap-3 w-full'>
              <Button
                variant='outline'
                onClick={handleDetailModalClose}
                className='flex-1 border-green-300 text-green-700 hover:bg-green-50'
              >
                Đóng
              </Button>
              <Button
                onClick={() => {
                  handleDetailModalClose()
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
