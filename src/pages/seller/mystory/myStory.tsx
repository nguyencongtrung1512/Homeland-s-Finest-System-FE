import { useState, useEffect, useMemo } from 'react'
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
import ImageCarousel, { type CarouselItem } from '../../../components/ui/imagecarousel'

function MyStory() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeStories, setStoreStories] = useState<StoreStory[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null)

  // Debug: Log when showCreateDialog changes
  useEffect(() => {
    console.log('showCreateDialog changed:', showCreateDialog)
  }, [showCreateDialog])

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

  // Convert store stories to carousel items
  const carouselItems: CarouselItem[] = useMemo(() => {
    return storeStories.map((story) => ({
      id: story.id,
      name: story.title,
      title: 'Câu chuyện cửa hàng',
      img: story.thumbnailUrl || 'https://i.pinimg.com/736x/05/01/bc/0501bcd327d9df915e83154bbf9456e3.jpg',
      onClick: () => {
        setSelectedStoryId(story.id)
        setShowDetailDialog(true)
      }
    }))
  }, [storeStories])

  // Handle title click to show detail
  const handleTitleClick = (item: CarouselItem) => {
    setSelectedStoryId(item.id)
    setShowDetailDialog(true)
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

  // Handle create button click
  const handleCreateClick = () => {
    console.log('handleCreateClick called')
    console.log('Current showCreateDialog:', showCreateDialog)
    setShowCreateDialog(true)
    console.log('After setShowCreateDialog(true)')
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
          <Button className='bg-green-600 hover:bg-green-700 text-white' onClick={handleCreateClick} type='button'>
            <Plus className='w-4 h-4 mr-2' />
            Tạo câu chuyện mới
          </Button>
        </div>
        <EmptyState />
        {/* Create Story Dialog - Must be rendered even in empty state */}
        <CreateMyStory open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={handleRefreshStories} />
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
        <Button className='bg-green-600 hover:bg-green-700 text-white' onClick={handleCreateClick} type='button'>
          <Plus className='w-4 h-4 mr-2' />
          Tạo câu chuyện mới
        </Button>
      </div>

      <div className='max-w-7xl mx-auto'>
        {/* Stories Carousel */}
        {storeStories.length > 0 ? (
          <div className='mb-8'>
            <ImageCarousel items={carouselItems} onItemClick={handleTitleClick} />
          </div>
        ) : (
          <div className='text-center py-12'>
            <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <FileText className='w-12 h-12 text-gray-400' />
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>Chưa có câu chuyện nào</h3>
            <p className='text-gray-600 mb-6'>Hãy tạo câu chuyện đầu tiên để chia sẻ về cửa hàng của bạn</p>
            <Button className='bg-green-600 hover:bg-green-700 text-white' onClick={handleCreateClick} type='button'>
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
