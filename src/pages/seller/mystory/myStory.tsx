import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Plus, Edit, Eye, EyeOff } from 'lucide-react'

function MyStory() {
  const navigate = useNavigate()

  const stories = [
    {
      id: 1,
      title: 'Nghệ thuật đan lát tre truyền thống',
      date: '15/11/2024',
      status: 'published',
      image: 'https://th.bing.com/th/id/OIP.cFKEp9deg6VsLHI1acycpwHaEK?w=277&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
      description: 'Khám phá nghệ thuật đan lát tre truyền thống từ những nghệ nhân lành nghề'
    },
    {
      id: 2,
      title: 'Hành trình làm bánh tráng',
      date: '12/11/2024',
      status: 'draft',
      image: 'https://th.bing.com/th/id/OIP.cFKEp9deg6VsLHI1acycpwHaEK?w=277&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
      description: 'Câu chuyện về quy trình làm bánh tráng truyền thống tại làng nghề'
    },
    {
      id: 3,
      title: 'Gốm sứ Bát Tràng',
      date: '08/11/2024',
      status: 'hidden',
      image: 'https://th.bing.com/th/id/OIP.cFKEp9deg6VsLHI1acycpwHaEK?w=277&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
      description: 'Tìm hiểu về nghề gốm sứ truyền thống tại làng gốm Bát Tràng'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className='bg-green-100 text-green-800 hover:bg-green-100 border-green-200'>được duyệt</Badge>
      case 'draft':
        return <Badge className='bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200'>chờ duyệt</Badge>
      case 'hidden':
        return <Badge className='bg-red-100 text-red-800 hover:bg-red-100 border-red-200'>từ chối duyệt</Badge>
      default:
        return <Badge className='bg-gray-100 text-gray-800 hover:bg-gray-100'>{status}</Badge>
    }
  }

  const handleCreateStory = () => {
    navigate('/createMyStory')
  }

  const handleEditStory = (storyId: number) => {
    navigate(`/detailMyStory/${storyId}`)
  }

  const handleViewStory = (storyId: number) => {
    navigate(`/detailMyStory/${storyId}`)
  }

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-xl font-bold text-green-700 mb-2'>Câu chuyện của tôi</h1>
          <p className='text-gray-600 text-lg'>Chia sẻ câu chuyện đằng sau sản phẩm và thương hiệu của bạn</p>
        </div>
        <Button
          className='bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 text-base font-medium'
          onClick={handleCreateStory}
        >
          <Plus className='w-5 h-5 mr-2' />
          Viết câu chuyện mới
        </Button>
      </div>

      {/* Stories Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {stories.map((story) => (
          <Card key={story.id} className='overflow-hidden hover:shadow-lg transition-shadow duration-300'>
            <CardContent className='p-0 pt-0'>
              {/* Story Image */}
              <img src={story.image} alt={story.title} className='w-full h-48 object-cover' />

              {/* Story Content */}
              <div className='p-6'>
                <h3
                  className='text-lg font-semibold text-green-700 mb-2 line-clamp-2 cursor-pointer hover:text-green-800'
                  onClick={() => handleViewStory(story.id)}
                >
                  {story.title}
                </h3>

                <p className='text-sm text-gray-500 mb-4'>Ngày đăng: {story.date}</p>

                <p className='text-sm text-gray-600 mb-4 line-clamp-2'>{story.description}</p>

                {/* Status Badge */}
                <div className='flex items-center justify-between'>
                  {getStatusBadge(story.status)}

                  {/* Action Buttons */}
                  <div className='flex gap-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleEditStory(story.id)}
                      className='text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    >
                      <Edit className='w-4 h-4' />
                    </Button>
                    {story.status === 'hidden' ? (
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-green-600 hover:text-green-700 hover:bg-green-50'
                      >
                        <Eye className='w-4 h-4' />
                      </Button>
                    ) : (
                      <Button variant='ghost' size='sm' className='text-gray-600 hover:text-gray-900 hover:bg-gray-100'>
                        <EyeOff className='w-4 h-4' />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State (if no stories) */}
      {stories.length === 0 && (
        <div className='text-center py-12'>
          <div className='w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center'>
            <Plus className='w-12 h-12 text-gray-400' />
          </div>
          <h3 className='text-xl font-semibold text-gray-700 mb-2'>Chưa có câu chuyện nào</h3>
          <p className='text-gray-500 mb-6'>Hãy bắt đầu chia sẻ câu chuyện của bạn</p>
          <Button className='bg-orange-500 hover:bg-orange-600 text-white' onClick={handleCreateStory}>
            <Plus className='w-4 h-4 mr-2' />
            Viết câu chuyện đầu tiên
          </Button>
        </div>
      )}
    </div>
  )
}

export default MyStory
