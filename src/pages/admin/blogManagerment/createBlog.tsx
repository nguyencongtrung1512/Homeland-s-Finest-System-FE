import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, Loader2, Sparkles } from 'lucide-react'
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
import { blogCategoryApi } from '../../../apis/categoryBlog.api'
import { blogApi } from '../../../apis/blog.api'
import { n8nApi } from '../../../apis/n8n.api'

function CreateBlogByCategory() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.userId

  const categoryId = id

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [titleError, setTitleError] = useState<string>('')
  
  // N8N suggestion states
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [suggestedContent, setSuggestedContent] = useState<string>('')
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (categoryId) {
      loadCategoryDetail()
    }

    // Cleanup timeout on unmount
    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current)
      }
    }
  }, [categoryId])

  const loadCategoryDetail = async () => {
    if (!categoryId) return
    try {
      const response = await blogCategoryApi.getById(categoryId)
      if (response.status === 200 && response.data) {
        setCategoryName(response.data.name)
      }
    } catch (error) {
      console.error('Error loading category detail:', error)
      try {
        const fallbackResponse = await blogCategoryApi.getDetail(categoryId)
        if (fallbackResponse.status === 200 && fallbackResponse.data && fallbackResponse.data.length > 0) {
          setCategoryName(fallbackResponse.data[0].name)
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
      }
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

    // Clear previous timeout
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current)
    }

    // Reset suggestion if title is too short
    if (value.trim().length < 10) {
      setSuggestedContent('')
      return
    }

    // Debounce: Wait 1.5 seconds after user stops typing before calling n8n
    suggestionTimeoutRef.current = setTimeout(async () => {
      if (value.trim().length >= 10) {
        await fetchSuggestion(value.trim())
      }
    }, 1500)
  }

  const fetchSuggestion = async (topic: string) => {
    if (!topic || topic.trim().length < 10) return

    setSuggestionLoading(true)
    setSuggestedContent('')
    try {
      const suggestion = await n8nApi.getBlogSuggestion(topic)
      setSuggestedContent(suggestion)
    } catch (error: any) {
      console.error('Error fetching suggestion:', error)
      // Don't show error toast, just silently fail
    } finally {
      setSuggestionLoading(false)
    }
  }

  const handleUseSuggestion = () => {
    if (suggestedContent) {
      setContent(suggestedContent)
      toast.success('Đã áp dụng nội dung gợi ý!')
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

    if (!userId || !categoryId) {
      toast.error('Thiếu thông tin người dùng hoặc danh mục')
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

    if (!image) {
      toast.error('Vui lòng chọn ảnh cho blog')
      return
    }

    setLoading(true)
    try {
      if (!image || !(image instanceof File)) {
        toast.error('Vui lòng chọn ảnh hợp lệ')
        setLoading(false)
        return
      }

      const response = await blogApi.create({
        userId,
        blogCategoryId: categoryId,
        title: title.trim(),
        description,
        content,
        image
      })

      if (response.status === 200 || response.status === 201) {
        toast.success('Tạo blog thành công!')
        navigate(path.BLOG_CATEGORY_DETAIL.replace(':id', categoryId))
      } else {
        toast.error('Có lỗi xảy ra khi tạo blog')
      }
    } catch (error: any) {
      console.error('Error creating blog:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tạo blog'
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
                  Tạo Blog Mới
                </h1>
                <div className='h-8 w-px bg-gray-300'></div>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium text-gray-500 uppercase tracking-wide'>Danh mục</span>
                  <span className='px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm shadow-sm'>
                    {categoryName}
                  </span>
                </div>
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
                <div className='flex items-center justify-between'>
                  <Label htmlFor='title' className='text-base font-semibold text-gray-700'>
                    Tiêu đề <span className='text-red-500'>*</span>
                  </Label>
                  {suggestionLoading && (
                    <div className='flex items-center gap-2 text-sm text-blue-600 font-medium'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      <span>Đang tạo gợi ý...</span>
                    </div>
                  )}
                </div>
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
                  {suggestionLoading && (
                    <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                      <Loader2 className='h-4 w-4 animate-spin text-blue-500' />
                    </div>
                  )}
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

              {/* N8N Suggestion Card */}
              {suggestedContent && (
                <Card className='bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 shadow-md rounded-xl overflow-hidden'>
                  <CardHeader className='pb-3 bg-white/50'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <div className='p-1.5 bg-blue-100 rounded-lg'>
                          <Sparkles className='h-5 w-5 text-blue-600' />
                        </div>
                        <CardTitle className='text-base font-semibold text-blue-900'>
                          Gợi ý nội dung từ AI
                        </CardTitle>
                      </div>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={handleUseSuggestion}
                        className='h-8 text-xs bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700 transition-all duration-200 shadow-sm'
                      >
                        Áp dụng
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className='pt-4'>
                    <div className='prose prose-sm max-w-none'>
                      <div
                        className='text-sm text-gray-800 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed'
                        dangerouslySetInnerHTML={{ __html: suggestedContent.replace(/\n/g, '<br>') }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

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
                    Chọn ảnh
                  </Button>
                  <Input
                    id='image-upload'
                    type='file'
                    accept='image/*'
                    onChange={handleImageChange}
                    className='hidden'
                  />
                  <span className={`text-sm font-medium ${image ? 'text-green-600' : 'text-gray-500'}`}>
                    {image ? `✓ ${image.name}` : 'Chưa chọn file nào'}
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
                  variant='blue'
                >
                  {loading ? (
                    <span className='flex items-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Đang tạo...
                    </span>
                  ) : (
                    'Tạo blog'
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

export default CreateBlogByCategory