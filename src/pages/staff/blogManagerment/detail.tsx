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
import { toast } from '../../../utils/toast'
import { resolveImageUrl } from '../../../utils/image'

function BlogByCategoryStaff() {
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
    navigate(path.updateBlogStaff.replace(':id', blogId))
  }

  const handleDeleteBlog = async () => {
    if (!blogToDelete) return

    try {
      const response: any = await blogApi.delete(blogToDelete)
      // Axios interceptor đã return response.data, nên response là { status, message, data }
      // Backend trả về status: 204 (SUCCESS_DELETE_CODE) hoặc 200 trong body
      if (response?.status === 204 || response?.status === 200) {
        toast.success('Xóa blog thành công!')
        loadCategoryDetail()
        setIsDeleteDialogOpen(false)
        setBlogToDelete(null)
      } else {
        toast.error(response?.message || 'Có lỗi xảy ra khi xóa blog')
      }
    } catch (error: any) {
      console.error('Error deleting blog:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi xóa blog'
      toast.error(errorMessage)
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
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6'>
      <div className='max-w-7xl mx-auto space-y-8'>
        {/* Header */}
        <div className='space-y-5'>
          {/* Back Button */}
          <div>
            <Button 
              variant='outline' 
              onClick={handleBack} 
              className='border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-all duration-200 shadow-sm px-5 py-2.5 font-medium group'
            >
              <ArrowLeft className='h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200' />
              Quay lại
            </Button>
          </div>

          {/* Title Section - Title, subtitle and button on same row */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between flex-wrap gap-4'>
              <div className='flex items-center gap-4 flex-wrap'>
                <h1 className='text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent'>
                  {categoryDetail?.name}
                </h1>
                <div className='h-8 w-px bg-gray-300'></div>
                <p className='text-gray-600 font-medium text-lg'>Chi tiết danh mục blog</p>
              </div>
              <Button
                onClick={() => navigate(path.createBlogStaff.replace(':id', categoryDetail?.categoryId || ''))}
                variant='greenLight'
                className='shadow-md hover:shadow-lg transition-all duration-200'
              >
                <Database className='h-4 w-4 mr-2' />
                Tạo blog mới
              </Button>
            </div>
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
                    className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 relative'
                  >
                    {/* Status Badge and Menu - Top Right */}
                    <div className='absolute top-6 right-6 flex items-center gap-2'>
                      <Badge
                        variant={blog.isActive ? 'default' : 'destructive'}
                        className={
                          blog.isActive 
                            ? 'bg-green-100 text-green-700 border-green-200 font-medium' 
                            : 'bg-red-100 text-red-700 border-red-200 font-medium'
                        }
                      >
                        {blog.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon' className='h-8 w-8'>
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

                    {/* Main Content Layout */}
                    <div className='flex items-start gap-6 pr-32'>
                      {/* Left Side - Image Thumbnail */}
                      {blog.image ? (
                        <div className='flex-shrink-0'>
                          <img
                            src={resolveImageUrl(blog.image)}
                            alt={blog.title}
                            className='w-24 h-24 object-cover rounded-lg border-2 border-gray-200 shadow-sm'
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = 'https://via.placeholder.com/96x96?text=No+Image'
                            }}
                          />
                        </div>
                      ) : (
                        <div className='flex-shrink-0 w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50'>
                          <span className='text-xs text-gray-400'>Ảnh</span>
                        </div>
                      )}

                      {/* Right Side - Text Content (Stacked) */}
                      <div className='flex-1 space-y-3'>
                        {/* Title */}
                        <h4 className='text-xl font-bold text-gray-900 leading-tight'>
                          {blog.title}
                        </h4>
                        
                        {/* Description */}
                        <p className='text-gray-600 text-base leading-relaxed'>
                          {blog.description}
                        </p>

                        {/* Date */}
                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                          <Calendar className='h-4 w-4 text-gray-500' />
                          <span className='font-medium'>{formatDate(blog.createdAt || categoryDetail.createdAt)}</span>
                        </div>
                      </div>
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
                    src={resolveImageUrl(selectedBlog.image)}
                    alt={selectedBlog.title}
                    className='w-full max-h-[300px] object-cover rounded-md'
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'https://via.placeholder.com/600x300?text=No+Image'
                    }}
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

export default BlogByCategoryStaff
