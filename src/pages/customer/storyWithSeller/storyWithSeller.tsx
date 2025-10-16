import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Search, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import ChatBot from '../../../components/ChatBot/chatbot'
import { storeApi, type StoreResponse, type StoreListParams } from '../../../apis/store.api'
import { toast } from 'react-toastify'

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

const StoryWithSeller: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [stores, setStores] = useState<StoreResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalStores, setTotalStores] = useState(0)
  const [pageSize] = useState(10) // 10 stores per page

  // Helper function to extract province/city from address
  const extractProvinceFromAddress = (address: string): string => {
    if (!address) return 'Không xác định'

    // Split address by commas and get the last part (usually province/city)
    const parts = address.split(',').map((part) => part.trim())
    const lastPart = parts[parts.length - 1]

    // Remove common prefixes
    const province = lastPart.replace(/^(Thành phố|Tỉnh|TP\.|T\.)/i, '').trim()

    return province || 'Không xác định'
  }

  // Convert StoreResponse to StoryData format
  const convertStoreToStory = (store: StoreResponse): StoryData => {
    const latestStory =
      store.storeStories && store.storeStories.length > 0 ? store.storeStories[store.storeStories.length - 1] : null

    const extractedProvince = extractProvinceFromAddress(store.address)

    return {
      id: store.id,
      storeId: store.id,
      storeName: store.storeName,
      storyTitle: latestStory?.title || `${store.storeName} - Câu chuyện nông sản`,
      storyContent:
        latestStory?.content ||
        `Khám phá câu chuyện đặc biệt từ ${store.storeName} tại ${extractedProvince}. Những sản phẩm chất lượng được tạo ra từ tình yêu và sự tận tâm của người nông dân Việt Nam.`,
      coverImage: store.coverImageUrl || '/src/assets/hinh-anh-canh-dong-lua-que-huong-viet-nam_082308136.jpg',
      province: extractedProvince,
      publishedDate: latestStory?.createdAt || store.createdAt,
      tags: latestStory?.tags || ['Nông sản', 'Chất lượng', 'Truyền thống']
    }
  }

  // Fetch stores from API
  const fetchStores = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true)
        const params: StoreListParams = {
          pageSize,
          pageNumber: page
        }

        const response = await storeApi.getAllStores(params)

        if (response.status === 200) {
          setStores(response.data)

          // Handle pagination logic
          if (response.data.length === 0 && currentPage > 1) {
            // No data on this page, go back to previous page
            setCurrentPage(currentPage - 1)
            setTotalPages(currentPage - 1)
          } else if (response.data.length < pageSize) {
            // This is the last page
            setTotalPages(currentPage)
          } else {
            // There might be more pages
            setTotalPages(currentPage + 1)
          }

          // Update total stores count
          setTotalStores((currentPage - 1) * pageSize + response.data.length)
        } else {
          toast.error('Không thể tải danh sách cửa hàng')
        }
      } catch (error) {
        console.error('Error fetching stores:', error)
        toast.error('Có lỗi xảy ra khi tải dữ liệu')
      } finally {
        setLoading(false)
      }
    },
    [pageSize, currentPage]
  )

  // Load stores on component mount
  useEffect(() => {
    fetchStores(currentPage)
  }, [currentPage, fetchStores])

  // Convert stores to stories format
  const stories = stores.map(convertStoreToStory)

  // Filter stories based on search term
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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleSearch = () => {
    // Reset to first page when searching
    setCurrentPage(1)
    fetchStores(1)
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
        <div className='flex gap-2'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
            <Input
              type='text'
              placeholder='Tìm kiếm câu chuyện, cửa hàng, tỉnh thành...'
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className='pl-10'
            />
          </div>
          <Button onClick={handleSearch} className='bg-green-600 hover:bg-green-700'>
            <Search className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className='flex justify-center items-center py-12'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4'></div>
            <p className='text-gray-600'>Đang tải dữ liệu...</p>
          </div>
        </div>
      )}

      {/* Stories Grid */}
      {!loading && (
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
      )}

      {/* Pagination Info */}
      {!loading && stores.length > 0 && (
        <div className='text-center text-sm text-gray-600 mb-4'>
          Hiển thị {stores.length} cửa hàng - Trang {currentPage} / {totalPages}
          {totalStores > 0 && <span className='ml-2'>(Tổng: {totalStores} cửa hàng)</span>}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className='flex justify-center items-center gap-2 mt-4'>
          <Button
            variant='outline'
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className='flex items-center gap-1'
          >
            <ChevronLeft className='h-4 w-4' />
            Trước
          </Button>

          <div className='flex gap-1'>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                onClick={() => handlePageChange(page)}
                className={`w-10 h-10 ${currentPage === page ? 'bg-green-600 hover:bg-green-700 text-white' : 'hover:bg-gray-100'
                  }`}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant='outline'
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className='flex items-center gap-1'
          >
            Sau
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredStories.length === 0 && (
        <div className='text-center py-12'>
          <div className='text-gray-400 mb-4'>
            <Search className='h-12 w-12 mx-auto' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>Không tìm thấy câu chuyện nào</h3>
          <p className='text-gray-500'>Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc</p>
        </div>
      )}
      <ChatBot />
    </div>
  )
}

export default StoryWithSeller
