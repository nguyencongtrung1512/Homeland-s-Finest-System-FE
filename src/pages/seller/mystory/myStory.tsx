import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import { Badge } from '../../../components/ui/badge'
import Loading from '../../../components/Loading/loading'
import EmptyState from '../../../components/EmptyState/emptyState'
import { useAuth } from '../../../contexts/auth.context'
import { storeApi } from '../../../apis/store.api'
import { storeStoryApi } from '../../../apis/storeStory.api'
import type { StoreStory } from '../../../types/storeStoryType'
import { Edit, Plus } from 'lucide-react'

function MyStory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeStories, setStoreStories] = useState<StoreStory[]>([])
  const [error, setError] = useState<string | null>(null)

  // Fetch store ID and store stories
  useEffect(() => {
    const fetchStoreData = async () => {
      if (!user?.userId) {
        setError('Không tìm thấy thông tin người dùng')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const storeResponse = await storeApi.getStoreBySellerId(user.userId)
        const storeId = storeResponse.data.id
        setStoreId(storeId)

        const storiesResponse = await storeStoryApi.getByStore(storeId)

        const storiesData = storiesResponse.data
        const storiesArray = Array.isArray(storiesData) ? storiesData : [storiesData]

        setStoreStories(storiesArray)

        console.log('Store Stories:', storiesArray)
      } catch (error) {
        console.error('Error fetching store data:', error)
        setError('Không thể tải dữ liệu câu chuyện cửa hàng')
      } finally {
        setLoading(false)
      }
    }

    fetchStoreData()
  }, [user?.userId])

  // Show loading state
  if (loading) {
    return (
      <div className='p-6 bg-gray-50 min-h-screen flex items-center justify-center'>
        <Loading />
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className='p-6 bg-gray-50 min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-red-600 mb-2'>Lỗi tải dữ liệu</h2>
          <p className='text-gray-600 mb-4'>{error}</p>
          <Button onClick={() => window.location.reload()} className='bg-green-600 hover:bg-green-700'>
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  // Show empty state if no stories
  if (storeStories.length === 0) {
    return (
      <div className='p-6 bg-gray-50 min-h-screen'>
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-green-700'>Câu chuyện của bạn</h1>
            <p className='text-gray-600 mt-2'>Chưa có câu chuyện nào được tạo</p>
          </div>
          <Button className='bg-green-600 hover:bg-green-700 text-white' onClick={() => navigate('/createMyStory')}>
            <Plus className='w-4 h-4 mr-2' />
            Tạo câu chuyện mới
          </Button>
        </div>
        <EmptyState />
      </div>
    )
  }

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div className='flex items-center gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-green-700'>Câu chuyện của bạn</h1>
            <div className='flex items-center gap-4 mt-2'>
              <span className='text-sm text-gray-500'>Store ID: {storeId}</span>
              <span className='text-sm text-gray-500'>Số câu chuyện: {storeStories.length}</span>
            </div>
          </div>
        </div>
        {/* Chỉ hiển thị nút tạo câu chuyện khi chưa có story nào */}
        {storeStories.length === 0 && (
          <Button className='bg-green-600 hover:bg-green-700 text-white' onClick={() => navigate('/createMyStory')}>
            <Plus className='w-4 h-4 mr-2' />
            Tạo câu chuyện mới
          </Button>
        )}
      </div>

      <div className='max-w-4xl mx-auto space-y-8'>
        {/* Store Stories from API */}
        {storeStories.length > 0 && (
          <Card>
            <CardContent className='p-6'>
              <div className='space-y-4'>
                <Label className='text-lg font-semibold text-green-700'>Câu chuyện từ API</Label>
                <div className='space-y-4'>
                  {storeStories.map((story, index) => (
                    <div key={story.id} className='border border-gray-200 rounded-lg p-4'>
                      <div className='flex items-start justify-between mb-3'>
                        <h3 className='text-lg font-semibold text-gray-900'>{story.title}</h3>
                        <div className='flex items-center gap-2'>
                          <Badge className='bg-blue-100 text-blue-800'>Story {index + 1}</Badge>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => navigate(`/editMyStory/${story.id}`)}
                            className='text-green-600 hover:text-green-700'
                          >
                            <Edit className='w-4 h-4 mr-1' />
                            Chỉnh sửa
                          </Button>
                        </div>
                      </div>

                      {story.thumbnailUrl && (
                        <div className='mb-3'>
                          <img
                            src={story.thumbnailUrl}
                            alt={story.title}
                            className='w-full h-48 object-cover rounded-lg'
                          />
                        </div>
                      )}

                      <div className='space-y-2'>
                        <p className='text-sm text-gray-600'>
                          <strong>Store ID:</strong> {story.storeId}
                        </p>
                        <p className='text-sm text-gray-600'>
                          <strong>Ngày tạo:</strong> {new Date(story.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                        <p className='text-sm text-gray-600'>
                          <strong>Số nội dung:</strong> {story.contents.length}
                        </p>
                      </div>

                      {story.contents.length > 0 && (
                        <div className='mt-4'>
                          <h4 className='font-medium text-gray-900 mb-2'>Nội dung:</h4>
                          <div className='space-y-2'>
                            {story.contents.map((content, contentIndex) => (
                              <div key={content.id} className='bg-gray-50 p-3 rounded border'>
                                <div className='flex items-center justify-between mb-2'>
                                  <span className='text-sm font-medium text-gray-700'>{content.contentType}</span>
                                  <span className='text-xs text-gray-500'>Thứ tự: {content.order}</span>
                                </div>

                                {content.contentData && (
                                  <p className='text-sm text-gray-600 mb-2'>
                                    {content.contentData.length > 100
                                      ? `${content.contentData.substring(0, 100)}...`
                                      : content.contentData}
                                  </p>
                                )}

                                {content.imageUrls && content.imageUrls.length > 0 && (
                                  <div className='flex gap-2 mb-2'>
                                    {content.imageUrls.map((imageUrl, imgIndex) => (
                                      <img
                                        key={imgIndex}
                                        src={imageUrl}
                                        alt={`Content ${contentIndex + 1} - Image ${imgIndex + 1}`}
                                        className='w-16 h-16 object-cover rounded border'
                                      />
                                    ))}
                                  </div>
                                )}

                                {content.videoPreviewUrl && (
                                  <div className='text-xs text-gray-500'>
                                    <strong>Video Preview:</strong> {content.videoPreviewUrl}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default MyStory
