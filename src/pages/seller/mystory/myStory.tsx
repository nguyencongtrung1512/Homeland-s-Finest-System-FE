import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Badge } from '../../../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog'
import Loading from '../../../components/Loading/loading'
import EmptyState from '../../../components/EmptyState/emptyState'
import { useAuth } from '../../../contexts/auth.context'
import { storeApi } from '../../../apis/store.api'
import { storeStoryApi } from '../../../apis/storeStory.api'
import type { StoreStory } from '../../../types/storeStoryType'
import { Edit, Plus, Save, X, AlertTriangle, FileText } from 'lucide-react'
import { toast } from 'react-toastify'

function MyStory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeStories, setStoreStories] = useState<StoreStory[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingStory, setEditingStory] = useState<StoreStory | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

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

  // Handle edit mode
  const handleEdit = (story: StoreStory) => {
    setEditingStory({ ...story })
    setIsEditMode(true)
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditMode(false)
    setEditingStory(null)
  }

  // Handle save with confirmation
  const handleSaveWithConfirmation = () => {
    setShowConfirmDialog(true)
  }

  // Confirm save and update store status
  const confirmSave = async () => {
    setShowConfirmDialog(false)

    try {
      setSaving(true)

      // First update the story
      if (editingStory && storeId) {
        const response = await storeStoryApi.update(editingStory.id, {
          Title: editingStory.title,
          TextIntro: editingStory.contents[0]?.contentData || '',
          TextExpanded: editingStory.contents[1]?.contentData || '',
          TextClosing: editingStory.contents[2]?.contentData || '',
          VideoOpenerDescription: '',
          SingleImageDescription: '',
          GalleryDescription: '',
          VideoProcessDescription: '',
          VideoTestimonialDescription: ''
        })

        if (response.status === 200) {
          // Update local state
          setStoreStories((prev) => prev.map((story) => (story.id === editingStory.id ? editingStory : story)))

          // Update store status to Pending for re-approval
          await storeApi.updateStoreStatus(storeId, 'Pending', 'Cửa hàng đã cập nhật câu chuyện, cần duyệt lại')

          setIsEditMode(false)
          setEditingStory(null)
          toast.success('Cập nhật câu chuyện thành công. Cửa hàng sẽ được xem xét lại.')
        } else {
          toast.error('Có lỗi xảy ra khi cập nhật câu chuyện')
        }
      }
    } catch (error) {
      console.error('Error updating story:', error)
      toast.error('Có lỗi xảy ra khi cập nhật câu chuyện')
    } finally {
      setSaving(false)
    }
  }

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    if (!editingStory) return

    setEditingStory((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [field]: value
      }
    })
  }

  // Handle content changes
  const handleContentChange = (contentIndex: number, field: string, value: string) => {
    if (!editingStory) return

    setEditingStory((prev) => {
      if (!prev) return prev
      const newContents = [...prev.contents]
      newContents[contentIndex] = {
        ...newContents[contentIndex],
        [field]: value
      }
      return {
        ...prev,
        contents: newContents
      }
    })
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
        <Button className='bg-green-600 hover:bg-green-700 text-white' onClick={() => navigate('/createMyStory')}>
          <Plus className='w-4 h-4 mr-2' />
          Tạo câu chuyện mới
        </Button>
      </div>

      <div className='max-w-6xl mx-auto'>
        {/* Stories Grid */}
        {storeStories.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {storeStories.map((story, index) => (
              <Card key={story.id} className='hover:shadow-lg transition-shadow'>
                <CardContent className='p-6'>
                  <div className='space-y-4'>
                    {/* Story Header */}
                    <div className='flex items-start justify-between'>
                      {isEditMode && editingStory?.id === story.id ? (
                        <Input
                          value={editingStory.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          className='text-lg font-semibold'
                          placeholder='Nhập tiêu đề câu chuyện'
                        />
                      ) : (
                        <h3 className='text-lg font-semibold text-gray-900 line-clamp-2'>{story.title}</h3>
                      )}
                      <Badge className='bg-blue-100 text-blue-800 ml-2'>#{index + 1}</Badge>
                    </div>

                    {/* Story Thumbnail */}
                    {story.thumbnailUrl && (
                      <div className='aspect-video rounded-lg overflow-hidden'>
                        <img src={story.thumbnailUrl} alt={story.title} className='w-full h-full object-cover' />
                      </div>
                    )}

                    {/* Story Info */}
                    <div className='space-y-2 text-sm text-gray-600'>
                      <div className='flex justify-between'>
                        <span>Số nội dung:</span>
                        <span className='font-medium'>{story.contents.length}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Ngày tạo:</span>
                        <span className='font-medium'>{new Date(story.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>

                    {/* Story Preview */}
                    {story.contents.length > 0 && (
                      <div className='space-y-2'>
                        <h4 className='font-medium text-gray-900 text-sm'>Nội dung:</h4>
                        <div className='space-y-1'>
                          {story.contents.slice(0, 2).map((content, contentIndex) => (
                            <div key={content.id} className='bg-gray-50 p-2 rounded text-xs'>
                              {isEditMode && editingStory?.id === story.id ? (
                                <Textarea
                                  value={content.contentData || ''}
                                  onChange={(e) => handleContentChange(contentIndex, 'contentData', e.target.value)}
                                  className='w-full min-h-[60px] text-xs'
                                  placeholder='Nhập nội dung...'
                                />
                              ) : (
                                <p className='text-gray-600 line-clamp-2'>{content.contentData?.substring(0, 80)}...</p>
                              )}
                            </div>
                          ))}
                          {story.contents.length > 2 && (
                            <p className='text-xs text-gray-500'>+{story.contents.length - 2} nội dung khác</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className='flex gap-2 pt-2'>
                      {isEditMode && editingStory?.id === story.id ? (
                        <>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={handleCancelEdit}
                            className='text-gray-600 hover:text-gray-700 flex-1'
                          >
                            <X className='w-4 h-4 mr-1' />
                            Hủy
                          </Button>
                          <Button
                            size='sm'
                            onClick={handleSaveWithConfirmation}
                            disabled={saving}
                            className='bg-green-600 hover:bg-green-700 text-white flex-1'
                          >
                            {saving ? (
                              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1'></div>
                            ) : (
                              <Save className='w-4 h-4 mr-1' />
                            )}
                            Lưu
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleEdit(story)}
                          className='text-green-600 hover:text-green-700 flex-1'
                        >
                          <Edit className='w-4 h-4 mr-1' />
                          Chỉnh sửa
                        </Button>
                      )}
                    </div>
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
            <Button className='bg-green-600 hover:bg-green-700 text-white' onClick={() => navigate('/createMyStory')}>
              <Plus className='w-4 h-4 mr-2' />
              Tạo câu chuyện đầu tiên
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-3'>
              <div className='w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center'>
                <AlertTriangle className='w-4 h-4 text-yellow-600' />
              </div>
              Xác nhận cập nhật
            </DialogTitle>
            <DialogDescription className='pt-2'>
              Bạn có chắc chắn muốn cập nhật câu chuyện cửa hàng không?
            </DialogDescription>
          </DialogHeader>

          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3 my-4'>
            <p className='text-sm text-yellow-800'>
              <strong>Lưu ý:</strong> Khi bạn cập nhật câu chuyện, cửa hàng sẽ chuyển về trạng thái "Chờ duyệt" và cần
              được admin xem xét lại trước khi có thể hoạt động bình thường.
            </p>
          </div>

          <DialogFooter className='gap-2'>
            <Button
              variant='outline'
              onClick={() => setShowConfirmDialog(false)}
              className='text-gray-600 hover:text-gray-700'
            >
              Hủy bỏ
            </Button>
            <Button onClick={confirmSave} disabled={saving} className='bg-green-600 hover:bg-green-700 text-white'>
              {saving ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Đang lưu...
                </>
              ) : (
                'Xác nhận cập nhật'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MyStory
