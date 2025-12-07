import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, Loader2 } from 'lucide-react'
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
import { blogCategoryApi } from '../../../apis/categoryBlog.api'
import { resolveImageUrl } from '../../../utils/image'

function UpdateBlogByCategory() {
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
  const [categoryName, setCategoryName] = useState('')
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
          // Load category name
          try {
            const categoryResponse = await blogCategoryApi.getById(blogData.blogCategoryId)
            if (categoryResponse.status === 200 && categoryResponse.data) {
              setCategoryName(categoryResponse.data.name)
            }
          } catch (error) {
            console.error('Error loading category detail:', error)
            try {
              const fallbackResponse = await blogCategoryApi.getDetail(blogData.blogCategoryId)
              if (fallbackResponse.status === 200 && fallbackResponse.data && fallbackResponse.data.length > 0) {
                setCategoryName(fallbackResponse.data[0].name)
              }
            } catch (fallbackError) {
              console.error('Fallback also failed:', fallbackError)
            }
          }
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
      <div className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6'>
        <div className='max-w-5xl mx-auto'>
          <div className='flex justify-center items-center h-64'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6'>
      <div className='max-w-5xl mx-auto space-y-8'>
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
          
          {/* Title Section with improved design */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between flex-wrap gap-4'>
              <div className='flex items-center gap-4 flex-wrap'>
                <h1 className='text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent'>
                  Chỉnh sửa Blog
                </h1>
                {categoryName && (
                  <>
                    <div className='h-8 w-px bg-gray-300'></div>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-medium text-gray-500 uppercase tracking-wide'>Danh mục</span>
                      <span className='px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm shadow-sm'>
                        {categoryName}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className='bg-white border-gray-200 shadow-lg shadow-gray-200/50 rounded-xl overflow-hidden'>
          <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200'>
            <CardTitle className='text-2xl font-semibold text-gray-800'>Thông tin blog</CardTitle>
          </CardHeader>
          <CardContent className='p-8'>
            <form onSubmit={handleSubmit} className='space-y-8'>
              <div className='space-y-3'>
                <Label htmlFor='title' className='text-base font-semibold text-gray-700'>
                  Tiêu đề <span className='text-red-500'>*</span>
                </Label>
                <div className='relative'>
                  <Input
                    id='title'
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder='Nhập tiêu đề blog (10-100 ký tự)'
                    className={`transition-all duration-200 ${
                      titleError 
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                    } focus:ring-2 rounded-lg py-2.5 text-base`}
                  />
                </div>
                {titleError && (
                  <p className='text-sm text-red-600 font-medium flex items-center gap-1'>
                    <span>⚠</span> {titleError}
                  </p>
                )}
                {!titleError && title && (
                  <p className='text-xs text-gray-500 font-medium'>
                    Độ dài: <span className='text-blue-600'>{title.trim().length}</span>/100 ký tự
                  </p>
                )}
              </div>

              <div className='space-y-3'>
                <Label htmlFor='description' className='text-base font-semibold text-gray-700'>
                  Mô tả ngắn
                </Label>
                <Textarea
                  id='description'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Nhập mô tả ngắn về blog'
                  required
                  className='border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg transition-all duration-200 min-h-[100px] text-base'
                />
              </div>

              <div className='space-y-3'>
                <Label htmlFor='content' className='text-base font-semibold text-gray-700'>
                  Nội dung
                </Label>
                <div className='min-h-[350px] bg-white rounded-lg border border-gray-300 overflow-hidden'>
                  <ReactQuill
                    theme='snow'
                    value={content}
                    onChange={setContent}
                    modules={modules}
                    placeholder='Nhập nội dung blog...'
                    className='h-[300px] mb-12'
                  />
                </div>
              </div>

              <div className='space-y-3'>
                <Label htmlFor='image' className='text-base font-semibold text-gray-700'>
                  Ảnh đại diện
                </Label>
                <div className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all duration-200'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className='flex items-center gap-2 bg-white hover:bg-blue-50 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-600 transition-all duration-200 shadow-sm'
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
                  <span className={`text-sm font-medium ${image ? 'text-green-600' : 'text-gray-500'}`}>
                    {image ? `✓ ${image.name}` : 'Giữ nguyên ảnh hiện tại'}
                  </span>
                </div>

                {imagePreview && (
                  <div className='mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200'>
                    <p className='text-sm font-semibold mb-3 text-gray-700'>Xem trước:</p>
                    <div className='relative aspect-video w-full max-w-2xl overflow-hidden rounded-xl border-2 border-gray-200 shadow-lg'>
                      <img src={imagePreview} alt='Xem trước' className='h-full w-full object-cover' />
                    </div>
                  </div>
                )}
              </div>

              <div className='flex justify-end gap-4 pt-6 border-t border-gray-200'>
                <Button 
                  type='button' 
                  variant='outline' 
                  onClick={handleBack}
                  className='px-6 py-2.5 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm font-medium'
                >
                  Hủy
                </Button>
                <Button 
                  type='submit' 
                  disabled={loading}
                  variant='greenLight'
                >
                  {loading ? (
                    <span className='flex items-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Đang cập nhật...
                    </span>
                  ) : (
                    'Cập nhật blog'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default UpdateBlogByCategory
