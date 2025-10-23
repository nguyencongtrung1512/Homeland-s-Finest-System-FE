import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { ArrowLeft, Video, Upload, Image as ImageIcon, X, Plus, Trash2 } from 'lucide-react'
import { storeStoryApi, type StoreStoryUpdateData } from '../../../apis/storeStory.api'
import Loading from '../../../components/Loading/loading'
import { toast } from 'react-toastify'

function CreateMyStory() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [storyData, setStoryData] = useState({
    Title: 'Câu chuyện của chúng tôi',
    ThumbnailImage: null as File | null,
    contents: [
      {
        id: '1',
        contentType: 'Text',
        contentData:
          'Chúng tôi là một cửa hàng chuyên cung cấp các sản phẩm nông sản sạch từ các vùng miền Việt Nam. Với hơn 10 năm kinh nghiệm trong ngành, chúng tôi cam kết mang đến cho khách hàng những sản phẩm tươi ngon, an toàn và chất lượng cao nhất.',
        order: 1,
        imageUrls: [] as string[],
        videoPreviewUrl: null as string | null
      },
      {
        id: '2',
        contentType: 'Image',
        contentData: 'Hình ảnh minh họa cho câu chuyện',
        order: 2,
        imageUrls: [] as string[],
        videoPreviewUrl: null as string | null,
        imageFile: null as File | null
      },
      {
        id: '3',
        contentType: 'Text',
        contentData:
          'Với hơn 10 năm kinh nghiệm trong lĩnh vực nông nghiệp, chúng tôi hiểu rõ giá trị của từng sản phẩm và cam kết mang đến chất lượng tốt nhất cho khách hàng.',
        order: 3,
        imageUrls: [] as string[],
        videoPreviewUrl: null as string | null
      },
      {
        id: '4',
        contentType: 'Video',
        contentData: 'Video về quy trình sản xuất',
        order: 4,
        imageUrls: [] as string[],
        videoPreviewUrl: null as string | null,
        videoFile: null as File | null
      },
      {
        id: '5',
        contentType: 'Text',
        contentData:
          'Chúng tôi cam kết: Tất cả sản phẩm đều được kiểm tra chất lượng nghiêm ngặt trước khi đến tay khách hàng. Từ khâu gieo trồng, chăm sóc, thu hoạch đến bảo quản và vận chuyển, mọi quy trình đều được thực hiện theo tiêu chuẩn cao nhất để đảm bảo sản phẩm tươi ngon, an toàn và giữ trọn vẹn giá trị dinh dưỡng.',
        order: 5,
        imageUrls: [] as string[],
        videoPreviewUrl: null as string | null
      }
    ]
  })

  const handleInputChange = (field: string, value: string) => {
    setStoryData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleContentChange = (contentIndex: number, field: string, value: string) => {
    setStoryData((prev) => ({
      ...prev,
      contents: prev.contents.map((content, index) =>
        index === contentIndex ? { ...content, [field]: value } : content
      )
    }))
  }

  const handleContentFileChange = (contentIndex: number, field: string, file: File | null) => {
    setStoryData((prev) => ({
      ...prev,
      contents: prev.contents.map((content, index) =>
        index === contentIndex ? { ...content, [field]: file } : content
      )
    }))
  }

  const handleThumbnailChange = (file: File | null) => {
    setStoryData((prev) => ({
      ...prev,
      ThumbnailImage: file
    }))
  }

  const addNewContent = () => {
    const newContent = {
      id: Date.now().toString(),
      contentType: 'Text',
      contentData: '',
      order: storyData.contents.length + 1,
      imageUrls: [] as string[],
      videoPreviewUrl: null as string | null
    }
    setStoryData((prev) => ({
      ...prev,
      contents: [...prev.contents, newContent]
    }))
  }

  const removeContent = (contentIndex: number) => {
    setStoryData((prev) => ({
      ...prev,
      contents: prev.contents.filter((_, index) => index !== contentIndex)
    }))
  }

  const moveContentUp = (contentIndex: number) => {
    if (contentIndex > 0) {
      setStoryData((prev) => {
        const newContents = [...prev.contents]
        const temp = newContents[contentIndex]
        newContents[contentIndex] = newContents[contentIndex - 1]
        newContents[contentIndex - 1] = temp
        return { ...prev, contents: newContents }
      })
    }
  }

  const moveContentDown = (contentIndex: number) => {
    if (contentIndex < storyData.contents.length - 1) {
      setStoryData((prev) => {
        const newContents = [...prev.contents]
        const temp = newContents[contentIndex]
        newContents[contentIndex] = newContents[contentIndex + 1]
        newContents[contentIndex + 1] = temp
        return { ...prev, contents: newContents }
      })
    }
  }

  const handleCreateStory = async () => {
    try {
      setLoading(true)

      const storyPayload: StoreStoryUpdateData = {
        Title: storyData.Title,
        TextIntro: storyData.contents.find((c) => c.contentType === 'Text')?.contentData || '',
        TextExpanded: storyData.contents.filter((c) => c.contentType === 'Text')[1]?.contentData || '',
        TextClosing: storyData.contents.filter((c) => c.contentType === 'Text')[2]?.contentData || '',
        VideoOpener: storyData.contents.find((c) => c.contentType === 'Video')?.videoFile || undefined,
        VideoOpenerDescription: storyData.contents.find((c) => c.contentType === 'Video')?.contentData || '',
        SingleImage: storyData.contents.find((c) => c.contentType === 'Image')?.imageFile || undefined,
        SingleImageDescription: storyData.contents.find((c) => c.contentType === 'Image')?.contentData || '',
        GalleryImages: undefined,
        GalleryDescription: '',
        VideoProcess: undefined,
        VideoProcessDescription: '',
        VideoTestimonial: undefined,
        VideoTestimonialDescription: '',
        ThumbnailImage: storyData.ThumbnailImage || undefined
      }

      await storeStoryApi.create(storyPayload)
      toast.success('Tạo câu chuyện thành công!')
      navigate('/myStorySeller')
    } catch (error) {
      console.error('Error creating story:', error)
      toast.error('Có lỗi xảy ra khi tạo câu chuyện. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/myStorySeller')
  }

  if (loading) {
    return (
      <div className='p-6 bg-gray-50 min-h-screen flex items-center justify-center'>
        <Loading />
      </div>
    )
  }

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center gap-4 mb-8'>
        <Button variant='ghost' size='sm' onClick={handleBack} className='text-gray-600 hover:text-gray-900'>
          <ArrowLeft className='w-4 h-4' />
        </Button>
        <h1 className='text-3xl font-bold text-green-700'>Tạo câu chuyện mới</h1>
      </div>

      <div className='max-w-4xl mx-auto space-y-8'>
        {/* Story Header */}
        <Card>
          <CardContent className='p-6'>
            <div className='space-y-6'>
              <div className='space-y-4'>
                <Label className='text-lg font-semibold text-green-700'>Tiêu đề câu chuyện</Label>
                <Input
                  placeholder='Câu chuyện của chúng tôi'
                  value={storyData.Title}
                  onChange={(e) => handleInputChange('Title', e.target.value)}
                  className='text-xl font-bold text-center'
                />
              </div>

              {/* Thumbnail Upload */}
              <div className='space-y-4'>
                <Label className='text-lg font-semibold text-green-700'>Ảnh đại diện</Label>
                <div className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer'>
                  {storyData.ThumbnailImage ? (
                    <div className='space-y-2'>
                      <img
                        src={URL.createObjectURL(storyData.ThumbnailImage)}
                        alt='Thumbnail'
                        className='w-full h-32 object-cover rounded mx-auto'
                      />
                      <p className='text-sm text-gray-600'>{storyData.ThumbnailImage.name}</p>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleThumbnailChange(null)}
                        className='text-red-600 hover:text-red-700'
                      >
                        <X className='w-4 h-4 mr-1' />
                        Xóa
                      </Button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                      <p className='text-gray-500 mb-4'>Tải lên ảnh đại diện cho câu chuyện</p>
                      <input
                        type='file'
                        accept='image/*'
                        onChange={(e) => handleThumbnailChange(e.target.files?.[0] || null)}
                        className='hidden'
                        id='thumbnail-upload'
                      />
                      <Button
                        variant='outline'
                        className='bg-white'
                        onClick={() => document.getElementById('thumbnail-upload')?.click()}
                      >
                        <Upload className='w-4 h-4 mr-2' />
                        Chọn ảnh
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Story Contents */}
        <Card>
          <CardContent className='p-6'>
            <div className='space-y-6'>
              <div className='flex items-center justify-between'>
                <Label className='text-lg font-semibold text-green-700'>Nội dung câu chuyện</Label>
                <Button onClick={addNewContent} className='bg-green-600 hover:bg-green-700 text-white'>
                  <Plus className='w-4 h-4 mr-2' />
                  Thêm nội dung
                </Button>
              </div>

              <div className='space-y-4'>
                {storyData.contents.map((content, index) => (
                  <div key={content.id} className='border border-gray-200 rounded-lg p-4'>
                    <div className='flex items-center justify-between mb-4'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium text-gray-700'>#{index + 1}</span>
                        <select
                          value={content.contentType}
                          onChange={(e) => handleContentChange(index, 'contentType', e.target.value)}
                          className='text-sm border border-gray-300 rounded px-2 py-1'
                        >
                          <option value='Text'>Văn bản</option>
                          <option value='Image'>Hình ảnh</option>
                          <option value='Video'>Video</option>
                        </select>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => moveContentUp(index)}
                          disabled={index === 0}
                          className='text-gray-600'
                        >
                          ↑
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => moveContentDown(index)}
                          disabled={index === storyData.contents.length - 1}
                          className='text-gray-600'
                        >
                          ↓
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => removeContent(index)}
                          className='text-red-600 hover:text-red-700'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>

                    {/* Content based on type */}
                    {content.contentType === 'Text' && (
                      <Textarea
                        placeholder='Nhập nội dung văn bản...'
                        value={content.contentData}
                        onChange={(e) => handleContentChange(index, 'contentData', e.target.value)}
                        className='min-h-[120px]'
                      />
                    )}

                    {content.contentType === 'Image' && (
                      <div className='space-y-4'>
                        <Textarea
                          placeholder='Mô tả hình ảnh...'
                          value={content.contentData}
                          onChange={(e) => handleContentChange(index, 'contentData', e.target.value)}
                          className='min-h-[80px]'
                        />
                        <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                          {content.imageFile ? (
                            <div className='space-y-2'>
                              <img
                                src={URL.createObjectURL(content.imageFile)}
                                alt='Content image'
                                className='w-full h-32 object-cover rounded mx-auto'
                              />
                              <p className='text-sm text-gray-600'>{content.imageFile.name}</p>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => handleContentFileChange(index, 'imageFile', null)}
                                className='text-red-600 hover:text-red-700'
                              >
                                <X className='w-4 h-4 mr-1' />
                                Xóa
                              </Button>
                            </div>
                          ) : (
                            <>
                              <ImageIcon className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                              <p className='text-gray-500 mb-2'>Tải lên hình ảnh</p>
                              <input
                                type='file'
                                accept='image/*'
                                onChange={(e) =>
                                  handleContentFileChange(index, 'imageFile', e.target.files?.[0] || null)
                                }
                                className='hidden'
                                id={`image-upload-${index}`}
                              />
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => document.getElementById(`image-upload-${index}`)?.click()}
                              >
                                <Upload className='w-4 h-4 mr-1' />
                                Chọn ảnh
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {content.contentType === 'Video' && (
                      <div className='space-y-4'>
                        <Textarea
                          placeholder='Mô tả video...'
                          value={content.contentData}
                          onChange={(e) => handleContentChange(index, 'contentData', e.target.value)}
                          className='min-h-[80px]'
                        />
                        <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                          {content.videoFile ? (
                            <div className='space-y-2'>
                              <video
                                src={URL.createObjectURL(content.videoFile)}
                                controls
                                className='w-full h-32 object-cover rounded mx-auto'
                              />
                              <p className='text-sm text-gray-600'>{content.videoFile.name}</p>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => handleContentFileChange(index, 'videoFile', null)}
                                className='text-red-600 hover:text-red-700'
                              >
                                <X className='w-4 h-4 mr-1' />
                                Xóa
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Video className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                              <p className='text-gray-500 mb-2'>Tải lên video</p>
                              <input
                                type='file'
                                accept='video/*'
                                onChange={(e) =>
                                  handleContentFileChange(index, 'videoFile', e.target.files?.[0] || null)
                                }
                                className='hidden'
                                id={`video-upload-${index}`}
                              />
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => document.getElementById(`video-upload-${index}`)?.click()}
                              >
                                <Upload className='w-4 h-4 mr-1' />
                                Chọn video
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className='flex justify-end gap-4 pt-6'>
          <Button
            variant='outline'
            size='lg'
            onClick={handleBack}
            className='border-gray-600 text-gray-600 hover:bg-gray-50'
          >
            Hủy
          </Button>
          <Button
            size='lg'
            onClick={handleCreateStory}
            className='bg-green-600 hover:bg-green-700 text-white'
            disabled={loading}
          >
            {loading ? 'Đang tạo...' : 'Tạo câu chuyện'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CreateMyStory
