import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { BookOpen } from 'lucide-react'
import { productStoryApi } from '../../../apis/productStory.api'
import type { ProductStory } from '../../../types/productStoryType'

interface ProductStoryProps {
  productId: string
}

function ProductStoryComponent({ productId }: ProductStoryProps) {
  const [stories, setStories] = useState<ProductStory[]>([])
  const [loading, setLoading] = useState(false)


  // Fetch stories when component mounts or productId changes
  const fetchStories = async () => {
    try {
      setLoading(true)
      const response = await productStoryApi.getByProductId(productId)

      if (response.status === 200) {
        if (response.data) {
          setStories([response.data])
        } else {
          setStories([])
        }
      }
    } catch {
      console.error('❌ Error fetching stories')
      toast.error('Không thể tải danh sách câu chuyện')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (productId) {
      fetchStories()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  // Process ProductStory data to match component's expected format
  const processStoryData = (story: ProductStory) => {
    const textContents = story.contents
      .filter((content) => content.contentType === 'text')
      .sort((a, b) => a.order - b.order)
      .map((content) => content.contentData)
      .join('\n\n')

    const mediaContents = story.contents
      .filter((content) => content.contentType === 'media')
      .sort((a, b) => a.order - b.order)

    const images: string[] = []
    let video = ''

    mediaContents.forEach((content) => {
      try {
        // Check if contentData is a JSON array (for images)
        if (content.contentData.startsWith('[')) {
          const parsedImages = JSON.parse(content.contentData)
          if (Array.isArray(parsedImages)) {
            images.push(...parsedImages)
          }
        } else {
          // Single media file - check if it's video or image
          if (content.contentData.includes('.mp4') || content.contentData.includes('.mov')) {
            video = content.contentData
          } else {
            images.push(content.contentData)
          }
        }
      } catch {
        // If not JSON, treat as single media file
        if (content.contentData.includes('.mp4') || content.contentData.includes('.mov')) {
          video = content.contentData
        } else {
          images.push(content.contentData)
        }
      }
    })

    return {
      title: story.title || '',
      content: textContents,
      images,
      video
    }
  }

  // Get current story data for display
  const currentStory = stories.length > 0 ? processStoryData(stories[0]) : null

  if (loading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center'>Đang tải...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-green-700 flex items-center gap-2'>
          <BookOpen className='w-5 h-5 text-green-600' />
          Câu chuyện sản phẩm
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {currentStory ? (
            <>
              <div>
                <h3 className='text-xl font-semibold text-gray-900 mb-3'>{currentStory.title}</h3>
                <p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>{currentStory.content}</p>
              </div>

              {/* Story Images */}
              {currentStory.images && currentStory.images.length > 0 && (
                <div>
                  <h4 className='text-lg font-medium text-gray-900 mb-3'>Hình ảnh minh họa</h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {currentStory.images.map((image: string, index: number) => (
                      <div key={index} className='aspect-video bg-gray-100 rounded-lg overflow-hidden'>
                        <img
                          src={image}
                          alt={`Story ${index + 1}`}
                          className='w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer'
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Story Video */}
              {currentStory.video && (
                <div>
                  <h4 className='text-lg font-medium text-gray-900 mb-3'>Video câu chuyện</h4>
                  <video src={currentStory.video} controls className='w-full max-w-2xl rounded-lg' />
                </div>
              )}
            </>
          ) : (
            <div className='text-center py-12'>
              <BookOpen className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>Chưa có câu chuyện</h3>
              <p className='text-gray-500'>Chưa có thông tin câu chuyện về sản phẩm này.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ProductStoryComponent
