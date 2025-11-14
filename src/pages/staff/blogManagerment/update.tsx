import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { useAuth } from '../../../contexts/auth.context'
import { path } from '../../../constants/path'
import { toast } from '../../../utils/toast'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { blogApi } from '../../../apis/blog.api'
import { resolveImageUrl } from '../../../utils/image'

function UpdateBlogByCategoryStaff() {
  const { id } = useParams<{ id: string }>() // id của blog
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.userId

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [blogDetail, setBlogDetail] = useState<any>(null)
  const [categoryId, setCategoryId] = useState('')
  const [isActive, setIsActive] = useState<boolean>(true)
  const [titleError, setTitleError] = useState<string>('')

  useEffect(() => {
    if (id) {
      loadBlogDetail()
    }
  }, [id])

  const loadBlogDetail = async () => {
    if (!id) return

    setLoading(true)
    try {
      const response = await blogApi.getById(id)
      if (response.status === 200 && response.data) {
        const blogData = response.data
        setBlogDetail(blogData)
        setTitle(blogData.title)
        setDescription(blogData.description)
        setContent(blogData.content)
        setImagePreview(resolveImageUrl(blogData.image))

        setIsActive(typeof blogData.isActive === 'boolean' ? blogData.isActive : true)

        // Lấy categoryId (bây giờ là string, không phải array)
        if (blogData.blogCategoryId) {
          setCategoryId(blogData.blogCategoryId)
        }
      }
    } catch (error) {
      console.error('Error loading blog detail:', error)
      toast.error('Không thể tải thông tin blog')
    } finally {
      setLoading(false)
    }
  }

  const validateTitle = (title: string): string => {
    if (!title || !title.trim()) {
      return 'Tiêu đề là bắt buộc.'
    }
    const trimmedTitle = title.trim()
    if (trimmedTitle.length < 10 || trimmedTitle.length > 100) {
      return 'Tiêu đề phải từ 10 đến 100 ký tự.'
    }
    return ''
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (value.trim().length > 0) {
      setTitleError(validateTitle(value))
    } else {
      setTitleError('')
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId || !id) {
      toast.error('Thiếu thông tin người dùng hoặc blog')
      return
    }

    // Validate title
    const titleValidationError = validateTitle(title)
    if (titleValidationError) {
      setTitleError(titleValidationError)
      toast.error(titleValidationError)
      return
    }

    if (!description || !content) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    setLoading(true)

    try {
      // Tạo FormData để gửi dữ liệu
      const formData = new FormData()

      // Thêm các trường với tên viết hoa đầu tiên
      formData.append('Title', title.trim())
      formData.append('Description', description)
      formData.append('Content', content)

      // Xử lý blogCategoryId như một string đơn giản
      if (categoryId) {
        formData.append('BlogCategoryId', categoryId)
      }

      // QUAN TRỌNG: gửi IsActive luôn (string 'true'/'false' cho form-data)
      formData.append('IsActive', String(isActive))

      // Nếu có ảnh mới, thêm vào formData
      if (image) {
        formData.append('Image', image)
      }

      // Gọi API để cập nhật blog
      const response = await blogApi.update(id, formData)
      console.log('Update response:', response)

      if (response.status === 200 || response.status === 202) {
        toast.success('Cập nhật blog thành công!')
        // Quay lại trang chi tiết danh mục
        setTimeout(() => {
          navigate(path.BLOG_CATEGORY_DETAIL.replace(':id', categoryId))
        }, 1500)
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật blog')
      }
    } catch (error: any) {
      console.error('Error updating blog:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi cập nhật blog'
      toast.error(errorMessage)
      // Show field-specific errors if available
      if (error?.response?.data?.errors?.Title) {
        setTitleError(error.response.data.errors.Title[0] || error.response.data.errors.Title)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['link', 'image'],
      ['clean']
    ]
  }

  if (loading && !blogDetail) {
    return (
      <div className='min-h-screen bg-background p-6'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex justify-center items-center h-64'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background p-6'>
      <div className='max-w-4xl mx-auto space-y-8'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Button variant='outline' onClick={handleBack} className='border-border'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Quay lại
            </Button>
            <div>
              <h1 className='text-3xl font-bold text-foreground'>Chỉnh sửa Blog</h1>
              <p className='text-muted-foreground'>Cập nhật thông tin bài viết</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className='bg-card border-border'>
          <CardHeader>
            <CardTitle>Thông tin blog</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div className='space-y-2'>
                <Label htmlFor='title'>
                  Tiêu đề <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='title'
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder='Nhập tiêu đề blog (10-100 ký tự)'
                  className={titleError ? 'border-destructive' : ''}
                />
                {titleError && <p className='text-sm text-destructive'>{titleError}</p>}
                {!titleError && title && (
                  <p className='text-xs text-muted-foreground'>
                    Độ dài: {title.trim().length}/100 ký tự
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='description'>Mô tả ngắn</Label>
                <Textarea
                  id='description'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Nhập mô tả ngắn về blog'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='content'>Nội dung</Label>
                <div className='min-h-[300px]'>
                  <ReactQuill
                    theme='snow'
                    value={content}
                    onChange={setContent}
                    modules={modules}
                    placeholder='Nhập nội dung blog...'
                    className='h-[250px] mb-12'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='image'>Ảnh đại diện</Label>
                <div className='flex items-center gap-4'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className='flex items-center gap-2'
                  >
                    <Upload className='h-4 w-4' />
                    Chọn ảnh mới
                  </Button>
                  <Input
                    id='image-upload'
                    type='file'
                    accept='image/*'
                    onChange={handleImageChange}
                    className='hidden'
                  />
                  <span className='text-sm text-muted-foreground'>
                    {image ? image.name : 'Giữ nguyên ảnh hiện tại'}
                  </span>
                </div>

                {imagePreview && (
                  <div className='mt-4'>
                    <p className='text-sm font-medium mb-2'>Xem trước:</p>
                    <div className='relative aspect-video w-full max-w-md overflow-hidden rounded-lg border border-border'>
                      <img src={imagePreview} alt='Preview' className='h-full w-full object-cover' />
                    </div>
                  </div>
                )}
              </div>

              <div className='flex justify-end gap-4 pt-4'>
                <Button type='button' variant='outline' onClick={handleBack}>
                  Hủy
                </Button>
                <Button type='submit' disabled={loading}>
                  {loading ? 'Đang cập nhật...' : 'Cập nhật blog'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default UpdateBlogByCategoryStaff
