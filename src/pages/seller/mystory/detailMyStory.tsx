import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { Badge } from '../../../components/ui/badge'
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  Video,
  Upload,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Image as ImageIcon,
  Type,
  Calendar,
  Share2
} from 'lucide-react'

function DetailMyStory() {
  const navigate = useNavigate()
  const { storyId } = useParams()
  const [isEditing, setIsEditing] = useState(false)
  const [isPublished, setIsPublished] = useState(true)

  // Mock data - trong thực tế sẽ fetch từ API
  const [storyData, setStoryData] = useState({
    id: storyId || '1',
    title: 'Nghệ thuật đan lát tre truyền thống',
    introduction: 'Khám phá nghệ thuật đan lát tre truyền thống từ những nghệ nhân lành nghề, nơi mỗi sản phẩm đều chứa đựng tâm huyết và kinh nghiệm của nhiều thế hệ.',
    mainContent: `Nghệ thuật đan lát tre là một trong những nghề thủ công truyền thống lâu đời nhất của Việt Nam. Từ những chiếc rổ, rá đơn giản đến những tác phẩm nghệ thuật phức tạp, mỗi sản phẩm đều thể hiện sự tinh tế và khéo léo của người thợ.

## Lịch sử và ý nghĩa

Nghề đan lát tre đã có mặt ở Việt Nam từ hàng nghìn năm trước. Ban đầu, đây là kỹ năng sinh tồn cần thiết để tạo ra các dụng cụ phục vụ cuộc sống hàng ngày. Dần dần, nó phát triển thành một nghệ thuật tinh tế, thể hiện văn hóa và tâm hồn của người Việt.

## Quy trình sản xuất

1. **Chọn tre**: Chọn những cây tre già, thẳng, không bị sâu bệnh
2. **Chẻ tre**: Chẻ tre thành những sợi mỏng, đều nhau
3. **Ngâm nước**: Ngâm tre trong nước để tăng độ dẻo dai
4. **Đan lát**: Bắt đầu đan theo mẫu đã định
5. **Hoàn thiện**: Làm mịn và trang trí sản phẩm

## Giá trị văn hóa

Mỗi sản phẩm đan lát tre không chỉ là một vật dụng thực tế mà còn là tác phẩm nghệ thuật, chứa đựng tâm huyết và kinh nghiệm của người thợ. Đây là di sản văn hóa quý báu cần được bảo tồn và phát triển.`,
    video: '/api/placeholder/video',
    status: 'published',
    createdAt: '15/11/2024',
    updatedAt: '15/11/2024',
    author: 'Nguyễn Văn A',
    views: 1250,
    likes: 89
  })

  const handleInputChange = (field: string, value: string) => {
    setStoryData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    console.log('Saving story:', storyData)
    setIsEditing(false)
    // Implement save logic
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset to original data
  }

  const handleTogglePublish = () => {
    setIsPublished(!isPublished)
    // Implement publish/unpublish logic
  }

  const handleBack = () => {
    navigate('/myStorySeller')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <Badge className='bg-green-100 text-green-800 hover:bg-green-100 border-green-200'>
            <Eye className='w-3 h-3 mr-1' />
            Đã xuất bản
          </Badge>
        )
      case 'draft':
        return (
          <Badge className='bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200'>
            Bản nháp
          </Badge>
        )
      case 'hidden':
        return (
          <Badge className='bg-red-100 text-red-800 hover:bg-red-100 border-red-200'>
            <EyeOff className='w-3 h-3 mr-1' />
            Đang ẩn
          </Badge>
        )
      default:
        return (
          <Badge className='bg-gray-100 text-gray-800 hover:bg-gray-100'>
            {status}
          </Badge>
        )
    }
  }

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleBack}
            className='text-gray-600 hover:text-gray-900'
          >
            <ArrowLeft className='w-4 h-4' />
          </Button>
          <div>
            <h1 className='text-3xl font-bold text-green-700'>Chi tiết câu chuyện</h1>
            <div className='flex items-center gap-4 mt-2'>
              {getStatusBadge(storyData.status)}
              <span className='text-sm text-gray-500'>
                <Calendar className='w-4 h-4 inline mr-1' />
                {storyData.createdAt}
              </span>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          {!isEditing ? (
            <>
              <Button
                variant='outline'
                onClick={() => setIsEditing(true)}
                className='border-green-600 text-green-600 hover:bg-green-50'
              >
                <Edit className='w-4 h-4 mr-2' />
                Chỉnh sửa
              </Button>
              <Button
                variant='outline'
                onClick={handleTogglePublish}
                className={isPublished ? 'border-red-500 text-red-600 hover:bg-red-50' : 'border-green-500 text-green-600 hover:bg-green-50'}
              >
                {isPublished ? <EyeOff className='w-4 h-4 mr-2' /> : <Eye className='w-4 h-4 mr-2' />}
                {isPublished ? 'Ẩn' : 'Hiện'}
              </Button>
              <Button variant='outline'>
                <Share2 className='w-4 h-4 mr-2' />
                Chia sẻ
              </Button>
            </>
          ) : (
            <>
              <Button
                variant='outline'
                onClick={handleCancel}
                className='border-gray-500 text-gray-600 hover:bg-gray-50'
              >
                <X className='w-4 h-4 mr-2' />
                Hủy
              </Button>
              <Button
                onClick={handleSave}
                className='bg-green-600 hover:bg-green-700 text-white'
              >
                <Save className='w-4 h-4 mr-2' />
                Lưu thay đổi
              </Button>
            </>
          )}
        </div>
      </div>

      <div className='max-w-4xl mx-auto space-y-8'>
        {/* Story Stats */}
        <Card>
          <CardContent className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>{storyData.views}</div>
                <div className='text-sm text-gray-600'>Lượt xem</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>{storyData.likes}</div>
                <div className='text-sm text-gray-600'>Lượt thích</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>12</div>
                <div className='text-sm text-gray-600'>Bình luận</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Title Section */}
        <Card>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              <Label className='text-lg font-semibold text-green-700'>
                Tiêu đề chính
              </Label>
              {isEditing ? (
                <Input
                  value={storyData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className='text-xl font-semibold'
                />
              ) : (
                <h2 className='text-2xl font-bold text-gray-900'>{storyData.title}</h2>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Introduction Section */}
        <Card>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              <Label className='text-lg font-semibold text-green-700'>
                Đoạn giới thiệu
              </Label>

              {isEditing && (
                <div className='flex gap-2 p-2 border border-gray-200 rounded-lg bg-gray-50'>
                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                    <Bold className='w-4 h-4' />
                  </Button>
                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                    <Italic className='w-4 h-4' />
                  </Button>
                </div>
              )}

              {isEditing ? (
                <Textarea
                  value={storyData.introduction}
                  onChange={(e) => handleInputChange('introduction', e.target.value)}
                  className='min-h-[100px] text-base'
                />
              ) : (
                <p className='text-lg text-gray-700 leading-relaxed'>{storyData.introduction}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Central Video Section */}
        <Card>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              <Label className='text-lg font-semibold text-green-700'>
                Video trung tâm
              </Label>

              {isEditing ? (
                <div className='border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors cursor-pointer'>
                  <Video className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-700 mb-2'>
                    Tải lên video của bạn
                  </h3>
                  <p className='text-gray-500 mb-4'>
                    Kéo và thả tệp vào đây
                  </p>
                  <Button variant='outline' className='bg-white'>
                    <Upload className='w-4 h-4 mr-2' />
                    Chọn tệp
                  </Button>
                </div>
              ) : (
                <div className='relative bg-gray-200 rounded-lg h-64 flex items-center justify-center'>
                  <div className='text-center text-gray-600'>
                    <Video className='w-16 h-16 mx-auto mb-4' />
                    <p>Video câu chuyện</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Section */}
        <Card>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              <Label className='text-lg font-semibold text-green-700'>
                Nội dung chính của câu chuyện
              </Label>

              {isEditing && (
                <div className='flex gap-2 p-2 border border-gray-200 rounded-lg bg-gray-50'>
                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                    <Type className='w-4 h-4' />
                  </Button>
                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                    <Type className='w-4 h-4' />
                  </Button>
                  <div className='w-px h-6 bg-gray-300 mx-1' />
                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                    <Bold className='w-4 h-4' />
                  </Button>
                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                    <Italic className='w-4 h-4' />
                  </Button>
                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                    <Underline className='w-4 h-4' />
                  </Button>
                  <div className='w-px h-6 bg-gray-300 mx-1' />
                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                    <List className='w-4 h-4' />
                  </Button>
                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                    <ListOrdered className='w-4 h-4' />
                  </Button>
                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                    <Quote className='w-4 h-4' />
                  </Button>
                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                    <ImageIcon className='w-4 h-4' />
                  </Button>
                </div>
              )}

              {isEditing ? (
                <Textarea
                  value={storyData.mainContent}
                  onChange={(e) => handleInputChange('mainContent', e.target.value)}
                  className='min-h-[400px] text-base'
                />
              ) : (
                <div className='prose max-w-none'>
                  <div className='whitespace-pre-line text-gray-700 leading-relaxed'>
                    {storyData.mainContent}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Author Info */}
        {/* <Card>
          <CardContent className='p-6'>
            <div className='flex items-center gap-4'>
              <div className='w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center'>
                <User className='w-6 h-6 text-gray-400' />
              </div>
              <div>
                <h4 className='font-medium text-gray-900'>{storyData.author}</h4>
                <p className='text-sm text-gray-600'>Tác giả</p>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  )
}

export default DetailMyStory
