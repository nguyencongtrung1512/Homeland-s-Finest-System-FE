import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Database, Users, Activity, MoreHorizontal, Eye } from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../../../components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../../components/ui/dropdown-menu'
import Pagination from '../../../components/Pagination/Pagination'
import {
  blogCategoryApi,
  type BlogCategoryItem,
  type CreateBlogCategoryInput,
  type UpdateBlogCategoryInput
} from '../../../apis/categoryBlog.api'
import { Switch } from '../../../components/ui/switch'


function BlogCategoryList() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<BlogCategoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Frontend pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<BlogCategoryItem | null>(null)

  // Form states
  const [formData, setFormData] = useState<CreateBlogCategoryInput>({
    name: '',
    isActive: true
  })

  // Function to display notifications with react-toastify
  const showNotification = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      toast.success(message, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
    } else {
      toast.error(message, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      })
    }
  }

  useEffect(() => {
    loadAllCategories() // Load all categories without pagination
  }, [])

  // Load all categories without pagination
  const loadAllCategories = async () => {
    setLoading(true)
    try {
      console.log('Loading all categories without pagination')

      const response = await blogCategoryApi.getAll()

      console.log('All categories response:', response)

      if (response.status === 200) {
        if (response.data && Array.isArray(response.data)) {
          console.log('Setting all categories:', response.data)
          setCategories(response.data)
          setTotalPages(1) // All in one page
        } else {
          console.log('No data found, trying alternative approach...')
          // If still no data, try calling with a large pageSize
          const largePageResponse = await blogCategoryApi.getAll({
            pageNumber: 1,
            pageSize: 100
          })
          console.log('Large page response:', largePageResponse)

          if (largePageResponse.status === 200 && largePageResponse.data) {
            setCategories(largePageResponse.data)
            setTotalPages(1)
          } else {
            setCategories([])
          }
        }
      }
    } catch (error) {
      console.error('Error loading all categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  // Create category
  const handleCreate = async () => {
    try {
      const response = await blogCategoryApi.create(formData)
      if (response.status === 201 || response.status === 200) {
        setIsCreateDialogOpen(false)
        setFormData({ name: '', isActive: true })
        loadAllCategories() // Reload all
        showNotification('success', 'Tạo danh mục thành công!')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      showNotification('error', 'Có lỗi xảy ra khi tạo danh mục!')
    }
  }

  // Update category
  const handleUpdate = async () => {
    if (!selectedCategory) return

    try {
      const updateData: UpdateBlogCategoryInput = {
        name: formData.name,
        isActive: formData.isActive
      }

      const response = await blogCategoryApi.update(selectedCategory.categoryId, updateData)
      console.log('Update response:', response)
      console.log('Update response status:', response.status)

      if (response.status === 200 || response.status === 202) {
        setIsEditDialogOpen(false)
        setSelectedCategory(null)
        setFormData({ name: '', isActive: true })
        loadAllCategories() // Reload all
        showNotification('success', 'Cập nhật danh mục thành công!')
      } else {
        console.log('Unexpected update response status:', response.status)
        showNotification('error', 'Cập nhật thất bại với status: ' + response.status)
      }
    } catch (error) {
      console.error('Error updating category:', error)
      showNotification('error', 'Có lỗi xảy ra khi cập nhật danh mục!')
    }
  }

  // Open edit dialog
  const openEditDialog = (category: BlogCategoryItem) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      isActive: category.isActive
    })
    setIsEditDialogOpen(true)
  }

  // Navigate to detail page
  const openDetailPage = (category: BlogCategoryItem) => {
    navigate(`/admin/blogManagement/detail/${category.categoryId}`)
  }

  // Filter categories by search term
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate pagination for filtered data
  const totalFilteredItems = filteredCategories.length
  const totalPagesCalculated = Math.ceil(totalFilteredItems / pageSize)

  // Get current page data
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentPageData = filteredCategories.slice(startIndex, endIndex)

  // Update total pages when filtered data changes
  useEffect(() => {
    setTotalPages(totalPagesCalculated)
    // Reset to page 1 if current page is greater than total pages
    if (currentPage > totalPagesCalculated && totalPagesCalculated > 0) {
      setCurrentPage(1)
    }
  }, [totalPagesCalculated, currentPage])

  // Calculate stats
  const activeCategories = categories.filter((cat) => cat.isActive).length
  const inactiveCategories = categories.length - activeCategories

  return (
    <div className='min-h-screen bg-background p-6'>
      <div className='max-w-7xl mx-auto space-y-8'>
        {/* Header Section */}
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold text-foreground'>Quản lý Danh mục Blog</h1>
          <p className='text-muted-foreground'>Quản lý các danh mục blog trong hệ thống</p>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-card border border-border rounded-lg p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Tổng danh mục</p>
                <p className='text-2xl font-bold text-foreground'>{categories.length}</p>
              </div>
              <div className='h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center'>
                <Database className='h-6 w-6 text-primary' />
              </div>
            </div>
          </div>

          <div className='bg-card border border-border rounded-lg p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Đang hoạt động</p>
                <p className='text-2xl font-bold text-success'>{activeCategories}</p>
              </div>
              <div className='h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center'>
                <Activity className='h-6 w-6 text-success' />
              </div>
            </div>
          </div>

          <div className='bg-card border border-border rounded-lg p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>Không hoạt động</p>
                <p className='text-2xl font-bold text-warning'>{inactiveCategories}</p>
              </div>
              <div className='h-12 w-12 bg-warning/10 rounded-lg flex items-center justify-center'>
                <Users className='h-6 w-6 text-warning' />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className='bg-card border border-border rounded-lg'>
          {/* Search and Actions */}
          <div className='p-6 border-b border-border'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
              <div className='flex items-center space-x-4'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                  <Input
                    placeholder='Tìm kiếm danh mục...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10 w-80 bg-input border-border'
                  />
                </div>
                <Button
                  variant='outline'
                  onClick={loadAllCategories}
                  className='border-border hover:bg-accent bg-transparent'
                >
                  Tải lại
                </Button>
              </div>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant='green'>
                    <Plus className='h-4 w-4 mr-2' />
                    Thêm danh mục
                  </Button>
                </DialogTrigger>
                <DialogContent className='bg-card border-border'>
                  <DialogHeader>
                    <DialogTitle className='text-foreground'>Thêm danh mục mới</DialogTitle>
                    <DialogDescription className='text-muted-foreground'>
                      Tạo danh mục blog mới trong hệ thống
                    </DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4'>
                    <div>
                      <label className='text-sm font-medium text-foreground'>Tên danh mục</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder='Nhập tên danh mục'
                        className='mt-1 bg-input border-border'
                      />
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                      <label className='text-sm font-medium text-foreground'>Kích hoạt</label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant='outline' onClick={() => setIsCreateDialogOpen(false)} className='border-border'>
                      Hủy
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={!formData.name.trim()}
                      className='bg-primary hover:bg-primary/90'
                    >
                      Tạo
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Table */}
          <div className='overflow-x-auto px-2'>
            <Table>
              <TableHeader>
                <TableRow className='border-border hover:bg-muted/50'>
                  <TableHead className='text-muted-foreground'>STT</TableHead>
                  <TableHead className='text-muted-foreground'>Tên danh mục</TableHead>
                  <TableHead className='text-muted-foreground'>Trạng thái</TableHead>
                  <TableHead className='text-muted-foreground'>Ngày tạo</TableHead>
                  <TableHead className='text-muted-foreground'>Ngày cập nhật</TableHead>
                  <TableHead className='text-center text-muted-foreground'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className='text-center py-12'>
                      <div className='flex justify-center'>
                        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : currentPageData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='text-center py-12 text-muted-foreground'>
                      Không có danh mục nào
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPageData.map((category, index) => (
                    <TableRow key={category.categoryId} className='border-border hover:bg-muted/50'>
                      <TableCell className='text-foreground'>{startIndex + index + 1}</TableCell>
                      <TableCell className='font-medium text-foreground'>{category.name}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            category.isActive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                          }`}
                        >
                          {category.isActive ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {new Date(category.createdAt).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {category.updatedAt ? new Date(category.updatedAt).toLocaleDateString('vi-VN') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className='flex justify-center'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='outline' size='sm' className='border-border hover:bg-accent'>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='bg-card border-border'>
                              <DropdownMenuItem
                                onClick={() => openDetailPage(category)}
                                className='cursor-pointer hover:bg-accent'
                              >
                                <Eye className='h-4 w-4 mr-2' />
                                Xem chi tiết
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openEditDialog(category)}
                                className='cursor-pointer hover:bg-accent'
                              >
                                <Edit className='h-4 w-4 mr-2' />
                                Chỉnh sửa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          {totalFilteredItems > 0 && (
            <div className='p-6 border-t border-border'>
              <div className='flex flex-col sm:flex-row justify-between items-center gap-4'>
                <div className='text-sm text-muted-foreground'>
                  Hiển thị {startIndex + 1}-{Math.min(endIndex, totalFilteredItems)} trong tổng số {totalFilteredItems}{' '}
                  danh mục
                </div>
                <div className='text-sm text-muted-foreground'>
                  Trang {currentPage} / {totalPages}
                </div>
              </div>

              {totalPages > 1 && (
                <div className='mt-4 flex justify-center'>
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className='bg-card border-border'>
            <DialogHeader>
              <DialogTitle className='text-foreground'>Chỉnh sửa danh mục</DialogTitle>
              <DialogDescription className='text-muted-foreground'>Cập nhật thông tin danh mục blog</DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium text-foreground'>Tên danh mục</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder='Nhập tên danh mục'
                  className='mt-1 bg-input border-border'
                />
              </div>
              <div className='flex items-center space-x-2'>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <label className='text-sm p-3 font-medium text-foreground'>Kích hoạt</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setIsEditDialogOpen(false)} className='border-border'>
                Hủy
              </Button>
              <Button onClick={handleUpdate} disabled={!formData.name.trim()} variant='green'>
                Cập nhật
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Toast Container */}
        <ToastContainer
          position='top-right'
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme='dark'
        />
      </div>
    </div>
  )
}

export default BlogCategoryList
