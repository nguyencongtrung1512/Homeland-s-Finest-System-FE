import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Database, Calendar, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { blogCategoryApi, type BlogCategoryDetail } from '../../../apis/categoryBlog.api'
import { blogApi } from '../../../apis/blog.api'
import { path } from '../../../constants/path'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../../../components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
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
import { formatDate } from '../../../utils/formatDate'

function BlogByCategory() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [categoryDetail, setCategoryDetail] = useState<BlogCategoryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedBlog, setSelectedBlog] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [blogToDelete, setBlogToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadCategoryDetail()
    }
  }, [id])

  const loadCategoryDetail = async () => {
    if (!id) return

    setLoading(true)
    try {
      const response = await blogCategoryApi.getDetail(id)
      if (response.status === 200) {
        // Lấy data từ response.data
        const responseData = response.data
        const blogsArray = Array.isArray(responseData[0].blogs) ? responseData[0].blogs : []
        const categoryData: BlogCategoryDetail = {
          categoryId: responseData[0].categoryId,
          name: responseData[0].name,
          isActive: responseData[0].isActive,
          createdAt: responseData[0].createdAt,
          updatedAt: responseData[0].updatedAt,
          blogs: blogsArray
        }

        setCategoryDetail(categoryData)
      }
    } catch (error) {
      console.error('Error loading category detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleViewBlogDetail = (blog: any) => {
    setSelectedBlog(blog)
    setIsDialogOpen(true)
  }

  const handleEditBlog = (blogId: string) => {
    navigate(`/admin/blogManagement/edit/${blogId}`)
  }

  const handleDeleteBlog = async () => {
    if (!blogToDelete) return

    try {
      const response = await blogApi.delete(blogToDelete)
      if (response.status === 200) {
        loadCategoryDetail()
        setIsDeleteDialogOpen(false)
        setBlogToDelete(null)
      }
    } catch (error) {
      console.error('Error deleting blog:', error)
    }
  }

  const openDeleteDialog = (blogId: string) => {
    setBlogToDelete(blogId)
    setIsDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-background p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex justify-center items-center h-64'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
          </div>
        </div>
      </div>
    )
  }

  if (!categoryDetail) {
    return (
      <div className='min-h-screen bg-background p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center py-12'>
            <h2 className='text-2xl font-bold text-foreground mb-4'>Không tìm thấy danh mục</h2>
            <Button onClick={handleBack} variant='outline'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Trong phần return, thêm nút tạo blog mới bên cạnh nút chỉnh sửa
  return (
    <div className='min-h-screen bg-background p-6'>
      <div className='max-w-7xl mx-auto space-y-8'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Button variant='outline' onClick={handleBack} className='border-border'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Quay lại
            </Button>
            <div>
              <h1 className='text-3xl font-bold text-foreground'>{categoryDetail?.name}</h1>
              <p className='text-muted-foreground'>Chi tiết danh mục blog</p>
            </div>
          </div>
          <div className='flex space-x-3'>
            <Button
              onClick={() => navigate(path.CREATE_BLOG.replace(':id', categoryDetail?.categoryId || ''))}
              variant='blue'
            >
              <Database className='h-4 w-4 mr-2' />
              Tạo blog mới
            </Button>
          </div>
        </div>

        {/* Category Info Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <Card className='bg-card border-border'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>Trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center space-x-2'>
                <Badge
                  variant={categoryDetail.isActive ? 'default' : 'destructive'}
                  className={
                    categoryDetail.isActive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                  }
                >
                  {categoryDetail.isActive ? 'Hoạt động' : 'Không hoạt động'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-card border-border'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>Ngày tạo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center space-x-2'>
                <Calendar className='h-4 w-4 text-muted-foreground' />
                <span className='text-foreground'>{formatDate(categoryDetail.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-card border-border'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>Ngày cập nhật</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center space-x-2'>
                <Calendar className='h-4 w-4 text-muted-foreground' />
                <span className='text-foreground'>{formatDate(categoryDetail?.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-card border-border'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>Số bài viết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center space-x-2'>
                <Database className='h-4 w-4 text-muted-foreground' />
                <span className='text-2xl font-bold text-foreground'>
                  {categoryDetail.blogs ? categoryDetail.blogs.length : 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Details */}
        <Card className='bg-card border-border'>
          <CardHeader>
            <CardTitle className='text-foreground'>Thông tin chi tiết</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='text-sm font-medium text-muted-foreground'>Tên danh mục</label>
                <p className='text-foreground font-medium mt-1'>{categoryDetail.name}</p>
              </div>
              <div>
                <label className='text-sm font-medium text-muted-foreground'>ID danh mục</label>
                <p className='text-foreground font-mono text-sm mt-1 bg-muted p-2 rounded'>
                  {categoryDetail.categoryId}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blogs Section */}
        <Card className='bg-card border-border'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-foreground'>Các bài viết trong danh mục</CardTitle>
              <span className='text-sm text-muted-foreground'>
                {`${categoryDetail?.blogs ? categoryDetail.blogs.length : 0} bài viết`}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {!categoryDetail?.blogs || categoryDetail.blogs.length === 0 ? (
              <div className='text-center py-12'>
                <Database className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <h3 className='text-lg font-medium text-foreground mb-2'>Chưa có bài viết</h3>
                <p className='text-muted-foreground'>Chưa có bài viết nào trong danh mục này</p>
              </div>
            ) : (
              <div className='space-y-4'>
                {categoryDetail.blogs.map((blog) => (
                  <div
                    key={blog.blogId}
                    className='bg-muted/50 rounded-lg p-6 border border-border hover:bg-muted/70 transition-colors'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center justify-between mb-2'>
                          <h4 className='font-semibold text-foreground text-lg'>{blog.title}</h4>
                          <Badge
                            variant={blog.isActive ? 'default' : 'destructive'}
                            className={
                              blog.isActive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                            }
                          >
                            {blog.isActive ? 'Hoạt động' : 'Không hoạt động'}
                          </Badge>
                        </div>
                        <p className='text-muted-foreground mb-4 line-clamp-3'>{blog.description}</p>

                        <div className='flex items-center space-x-6 text-sm text-muted-foreground'>
                          <div className='flex items-center space-x-2'>
                            <Calendar className='h-4 w-4' />
                            <span>{formatDate(categoryDetail.createdAt)}</span>
                          </div>
                          {blog.image && (
                            <div className='mt-3'>
                              <img src={blog.image} alt={blog.title} className='w-20 h-20 object-cover rounded-md' />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Thêm nút 3 chấm với dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon'>
                            <MoreVertical className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => handleViewBlogDetail(blog)}>
                            <Eye className='mr-2 h-4 w-4' />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditBlog(blog.blogId)}>
                            <Edit className='mr-2 h-4 w-4' />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className='text-destructive focus:text-destructive'
                            onClick={() => openDeleteDialog(blog.blogId)}
                          >
                            <Trash2 className='mr-2 h-4 w-4' />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal xem chi tiết blog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>Chi tiết bài viết</DialogTitle>
            <DialogDescription>Thông tin chi tiết về bài viết</DialogDescription>
          </DialogHeader>

          {selectedBlog && (
            <div className='space-y-4 mt-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold'>{selectedBlog.title}</h3>
                <Badge
                  variant={selectedBlog.isActive ? 'default' : 'destructive'}
                  className={
                    selectedBlog.isActive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                  }
                >
                  {selectedBlog.isActive ? 'Hoạt động' : 'Không hoạt động'}
                </Badge>
              </div>
              <p className='text-sm text-muted-foreground'>Ngày tạo: {formatDate(categoryDetail.createdAt)}</p>

              {selectedBlog.image && (
                <div className='my-4'>
                  <img
                    src={selectedBlog.image}
                    alt={selectedBlog.title}
                    className='w-full max-h-[300px] object-cover rounded-md'
                  />
                </div>
              )}

              <div>
                <h4 className='font-medium mb-2'>Mô tả</h4>
                <p className='text-muted-foreground'>{selectedBlog.description}</p>
              </div>

              <div>
                <h4 className='font-medium mb-2'>Nội dung</h4>
                <div className='prose max-w-none' dangerouslySetInnerHTML={{ __html: selectedBlog.content }} />
              </div>

              <DialogFooter className='flex justify-end space-x-2 pt-4'>
                <Button variant='outline' onClick={() => setIsDialogOpen(false)}>
                  Đóng
                </Button>
                <Button onClick={() => handleEditBlog(selectedBlog.blogId)}>Chỉnh sửa</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa blog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa bài viết</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBlogToDelete(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBlog}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default BlogByCategory
