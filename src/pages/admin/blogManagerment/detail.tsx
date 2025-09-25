import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Database, Calendar, User } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { blogCategoryApi, type BlogCategoryItem } from '../../../apis/categoryBlog.api'
import { blogApi, type BlogItem } from '../../../apis/blog.api'
import { path } from '../../../constants/path'


function BlogCategoryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [category, setCategory] = useState<BlogCategoryItem | null>(null)
  const [blogs, setBlogs] = useState<BlogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingBlogs, setLoadingBlogs] = useState(true)

  useEffect(() => {
    if (id) {
      loadCategoryDetail()
      loadBlogsByCategory()
    }
  }, [id])

  const loadCategoryDetail = async () => {
    if (!id) return

    setLoading(true)
    try {
      const response = await blogCategoryApi.getById(id)
      if (response.status === 200 && response.data) {
        setCategory(response.data)
      }
    } catch (error) {
      console.error('Error loading category:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBlogsByCategory = async () => {
    if (!id) return

    setLoadingBlogs(true)
    try {
      const response = await blogApi.getByCategory(id)
      if (response.status === 200 && response.data) {
        setBlogs(response.data)
      }
    } catch (error) {
      console.error('Error loading blogs:', error)
    } finally {
      setLoadingBlogs(false)
    }
  }

  const handleEdit = () => {
    if (category) {
      navigate(path.BLOG_CATEGORY_EDIT_ADMIN.replace(':id', category.categoryId))
    }
  }

  const handleBack = () => {
    navigate(-1)
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

  if (!category) {
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
              <h1 className='text-3xl font-bold text-foreground'>{category.name}</h1>
              <p className='text-muted-foreground'>Chi tiết danh mục blog</p>
            </div>
          </div>
          <Button onClick={handleEdit} variant='green'>
            <Edit className='h-4 w-4 mr-2' />
            Chỉnh sửa
          </Button>
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
                  variant={category.isActive ? 'default' : 'destructive'}
                  className={category.isActive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}
                >
                  {category.isActive ? 'Hoạt động' : 'Không hoạt động'}
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
                <span className='text-foreground'>{new Date(category.createdAt).toLocaleDateString('vi-VN')}</span>
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
                <span className='text-foreground'>
                  {category.updatedAt ? new Date(category.updatedAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                </span>
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
                <span className='text-2xl font-bold text-foreground'>{loadingBlogs ? '...' : blogs.length}</span>
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
                <p className='text-foreground font-medium mt-1'>{category.name}</p>
              </div>
              <div>
                <label className='text-sm font-medium text-muted-foreground'>ID danh mục</label>
                <p className='text-foreground font-mono text-sm mt-1 bg-muted p-2 rounded'>{category.categoryId}</p>
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
                {loadingBlogs ? 'Đang tải...' : `${blogs.length} bài viết`}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {loadingBlogs ? (
              <div className='flex justify-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
              </div>
            ) : blogs.length === 0 ? (
              <div className='text-center py-12'>
                <Database className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <h3 className='text-lg font-medium text-foreground mb-2'>Chưa có bài viết</h3>
                <p className='text-muted-foreground'>Chưa có bài viết nào trong danh mục này</p>
              </div>
            ) : (
              <div className='space-y-4'>
                {blogs.map((blog) => (
                  <div
                    key={blog.blogId}
                    className='bg-muted/50 rounded-lg p-6 border border-border hover:bg-muted/70 transition-colors'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <h4 className='font-semibold text-foreground mb-2 text-lg'>{blog.title}</h4>
                        <p className='text-muted-foreground mb-4 line-clamp-3'>{blog.description}</p>

                        <div className='flex items-center space-x-6 text-sm text-muted-foreground'>
                          <div className='flex items-center space-x-2'>
                            <User className='h-4 w-4' />
                            <span>
                              Tác giả: {blog.user.firstName} {blog.user.lastName}
                            </span>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <Calendar className='h-4 w-4' />
                            <span>{new Date(blog.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <Badge
                            variant={blog.isActive ? 'default' : 'destructive'}
                            className={
                              blog.isActive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                            }
                          >
                            {blog.isActive ? 'Hoạt động' : 'Không hoạt động'}
                          </Badge>
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
    </div>
  )
}

export default BlogCategoryDetail
