import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Search, MapPin, Users } from 'lucide-react'

interface StoryData {
  id: string
  storeId: string
  storeName: string
  storyTitle: string
  storyContent: string
  coverImage: string
  province: string
  publishedDate: string
  tags: string[]
}

const Stories: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  // Mock data - replace with API call
  const stories: StoryData[] = [
    {
      id: '1',
      storeId: 'store-1',
      storeName: 'Gạo Thơm Việt',
      storyTitle: 'Hành trình 30 năm gìn giữ hạt gạo quê hương',
      storyContent:
        'Từ những ruộng lúa xanh mướt ở đồng bằng sông Cửu Long, chúng tôi đã mang đến những hạt gạo thơm ngon nhất...',
      coverImage: '/src/assets/hinh-anh-canh-dong-lua-que-huong-viet-nam_082308136.jpg',
      province: 'An Giang',
      publishedDate: '2024-01-15',
      tags: ['Nông sản', 'Truyền thống', 'Gia đình']
    },
    {
      id: '2',
      storeId: 'store-2',
      storeName: 'Lúa Chín Vàng',
      storyTitle: 'Bí quyết trồng lúa hữu cơ không hóa chất',
      storyContent:
        'Với phương pháp canh tác tự nhiên được truyền lại từ ông bà, chúng tôi tạo ra những hạt gạo sạch...',
      coverImage: '/src/assets/luachin2-7984.webp',
      province: 'Đồng Tháp',
      publishedDate: '2024-01-10',
      tags: ['Hữu cơ', 'Sức khỏe', 'Môi trường']
    },
    {
      id: '3',
      storeId: 'store-3',
      storeName: 'Cơm Ngon Miền Tây',
      storyTitle: 'Từ hạt gạo đến bữa cơm gia đình',
      storyContent: 'Mỗi bữa cơm là một câu chuyện về tình yêu và sự gắn kết của gia đình Việt...',
      coverImage: '/src/assets/discover.png',
      province: 'Cần Thơ',
      publishedDate: '2024-01-08',
      tags: ['Gia đình', 'Văn hóa', 'Ẩm thực']
    }
  ]

  const filteredStories = stories.filter(
    (story) =>
      story.storyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.province.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleStoryClick = (storeId: string) => {
    navigate(`/store/${storeId}?tab=story`)
  }

  const handleStoreClick = (storeId: string) => {
    navigate(`/store/${storeId}?tab=story`)
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Header Section */}
      <div className='text-center mb-8'>
        <h1 className='text-4xl font-bold text-gray-900 mb-4'>Câu Chuyện Đồng Quê</h1>
        <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
          Khám phá những câu chuyện đầy cảm hứng từ các nhà sản xuất nông sản Việt Nam. Mỗi câu chuyện là một hành trình
          của tình yêu đất, tình yêu nghề.
        </p>
      </div>

      {/* Search Section */}
      <div className='max-w-md mx-auto mb-8'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
          <Input
            type='text'
            placeholder='Tìm kiếm câu chuyện, cửa hàng, tỉnh thành...'
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>
      </div>

      {/* Stories Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredStories.map((story) => (
          <Card key={story.id} className='overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group'>
            <div
              className='aspect-video bg-cover bg-center relative'
              style={{ backgroundImage: `url('${story.coverImage}')` }}
              onClick={() => handleStoryClick(story.storeId)}
            >
              <div className='absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-opacity' />
              <div className='absolute bottom-4 right-4'>
                <span className='bg-white text-gray-900 px-3 py-1 rounded-full text-xs font-medium shadow-md'>
                  Xem câu chuyện →
                </span>
              </div>
            </div>

            <CardContent className='p-6'>
              {/* Store Info */}
              <div
                className='flex items-center gap-2 mb-3 cursor-pointer hover:text-green-600'
                onClick={() => handleStoreClick(story.storeId)}
              >
                <Users className='h-4 w-4 text-gray-500' />
                <span className='text-sm font-medium text-gray-900'>{story.storeName}</span>
                <MapPin className='h-3 w-3 text-gray-400 ml-1' />
                <span className='text-xs text-gray-500'>{story.province}</span>
              </div>

              {/* Story Title */}
              <h3
                className='font-bold text-lg text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-green-600'
                onClick={() => handleStoryClick(story.storeId)}
              >
                {story.storyTitle}
              </h3>

              {/* Story Preview */}
              <p className='text-gray-600 text-sm mb-4 line-clamp-3'>{story.storyContent}</p>

              {/* Tags */}
              <div className='flex flex-wrap gap-1 mb-4'>
                {story.tags.map((tag, index) => (
                  <span key={index} className='bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs'>
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredStories.length === 0 && (
        <div className='text-center py-12'>
          <div className='text-gray-400 mb-4'>
            <Search className='h-12 w-12 mx-auto' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>Không tìm thấy câu chuyện nào</h3>
          <p className='text-gray-500'>Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc</p>
        </div>
      )}
    </div>
  )
}

export default Stories
