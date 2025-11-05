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
import { blogCategoryApi } from '../../../apis/categoryBlog.api'
import { blogApi } from '../../../apis/blog.api'

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

  useEffect(() => {
    if (categoryId) {
      loadCategoryDetail()
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

    if (!title || !description || !content) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    if (!image) {
      toast.error('Vui lòng chọn ảnh cho blog')
      return
    }

    setLoading(true)
    try {
      const response = await blogApi.create({
        userId,
        blogCategoryId: [categoryId], // ✅ Truyền mảng
        title,
        description,
        content,
        image // ⚠️ trong blog.api.ts sửa `image: string` → `image: File`
      } as any)

      if (response.status === 200 || response.status === 201) {
        toast.success('Tạo blog thành công!')
        navigate(path.BLOG_CATEGORY_DETAIL.replace(':id', categoryId))
      } else {
        toast.error('Có lỗi xảy ra khi tạo blog')
      }
    } catch (error) {
      console.error('Error creating blog:', error)
      toast.error('Có lỗi xảy ra khi tạo blog')
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
              <h1 className='text-3xl font-bold text-foreground'>Tạo Blog Mới</h1>
              <p className='text-muted-foreground'>Danh mục: {categoryName}</p>
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
                <Label htmlFor='title'>Tiêu đề</Label>
                <Input
                  id='title'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='Nhập tiêu đề blog'
                  required
                />
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
                    Chọn ảnh
                  </Button>
                  <Input
                    id='image-upload'
                    type='file'
                    accept='image/*'
                    onChange={handleImageChange}
                    className='hidden'
                  />
                  <span className='text-sm text-muted-foreground'>{image ? image.name : 'Chưa chọn file nào'}</span>
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
                  {loading ? 'Đang tạo...' : 'Tạo blog'}
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