import { useState, useEffect } from 'react'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import Loading from '../../../components/Loading/loading'
import EmptyState from '../../../components/EmptyState/emptyState'
import { useAuth } from '../../../contexts/auth.context'
import { storeApi } from '../../../apis/store.api'
import { storeStoryApi } from '../../../apis/storeStory.api'
import type { StoreStory } from '../../../types/storeStoryType'
import { Plus, FileText } from 'lucide-react'
import StoryDetailModal from './detail'
import CreateMyStory from './createMyStory'

function MyStory() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeStories, setStoreStories] = useState<StoreStory[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null)

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

  // Handle refresh stories after creating
  const handleRefreshStories = async () => {
    if (!storeId) return
    try {
      const storiesResponse = await storeStoryApi.getByStore(storeId)
      const storiesData = storiesResponse.data
      const storiesArray = Array.isArray(storiesData) ? storiesData : [storiesData]
      setStoreStories(storiesArray)
    } catch (error) {
      console.error('Error refreshing stories:', error)
    }
  }

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
          <Button className='bg-green-600 hover:bg-green-700 text-white' onClick={() => setShowCreateDialog(true)}>
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
        <Button className='bg-green-600 hover:bg-green-700 text-white' onClick={() => setShowCreateDialog(true)}>
          <Plus className='w-4 h-4 mr-2' />
          Tạo câu chuyện mới
        </Button>
      </div>

      <div className='max-w-6xl lg:mx-0 mx-auto'>
        {/* Stories Grid */}
        {storeStories.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {storeStories.map((story) => (
              <Card key={story.id} className='hover:shadow-lg transition-shadow'>
                <CardContent className='p-6'>
                  <div className='space-y-4'>
                    {/* Story Title */}
                    <h3 className='text-lg font-semibold text-gray-900 line-clamp-2'>{story.title}</h3>

                    {/* Story Thumbnail */}
                    {story.thumbnailUrl && (
                      <div
                        className='aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity'
                        onClick={() => {
                          setSelectedStoryId(story.id)
                          setShowDetailDialog(true)
                        }}
                      >
                        <img src={story.thumbnailUrl} alt={story.title} className='w-full h-full object-cover' />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className='text-center py-12'>
            <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <FileText className='w-12 h-12 text-gray-400' />
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>Chưa có câu chuyện nào</h3>
            <p className='text-gray-600 mb-6'>Hãy tạo câu chuyện đầu tiên để chia sẻ về cửa hàng của bạn</p>
            <Button className='bg-green-600 hover:bg-green-700 text-white' onClick={() => setShowCreateDialog(true)}>
              <Plus className='w-4 h-4 mr-2' />
              Tạo câu chuyện đầu tiên
            </Button>
          </div>
        )}
      </div>

      {/* Create Story Dialog */}
      <CreateMyStory open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={handleRefreshStories} />

      {/* Story Detail Modal */}
      <StoryDetailModal
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        storyId={selectedStoryId}
        onRefresh={handleRefreshStories}
      />
    </div>
  )
}

export default MyStory
