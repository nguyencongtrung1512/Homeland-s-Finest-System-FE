import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { ArrowLeft, Video, Upload, Image as ImageIcon, X } from 'lucide-react'
import { storeStoryApi, type StoreStoryUpdateData } from '../../../apis/storeStory.api'
import Loading from '../../../components/Loading/loading'

function CreateMyStory() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [storyData, setStoryData] = useState({
    Title: 'Câu chuyện của chúng tôi',
    TextIntro: 'Chúng tôi là một cửa hàng chuyên cung cấp các sản phẩm nông sản sạch từ các vùng miền Việt Nam. Với hơn 10 năm kinh nghiệm trong ngành, chúng tôi cam kết mang đến cho khách hàng những sản phẩm tươi ngon, an toàn và chất lượng cao nhất.',
    VideoOpener: null as File | null,
    VideoOpenerDescription: 'Video giới thiệu về câu chuyện của chúng tôi',
    SingleImage: null as File | null,
    SingleImageDescription: 'Hình ảnh minh họa cho câu chuyện',
    GalleryImages: [] as File[],
    GalleryDescription: 'Bộ sưu tập hình ảnh về quá trình sản xuất',
    VideoProcess: null as File | null,
    VideoProcessDescription: 'Video về quy trình sản xuất',
    TextExpanded: 'Với hơn 10 năm kinh nghiệm trong lĩnh vực nông nghiệp, chúng tôi hiểu rõ giá trị của từng sản phẩm và cam kết mang đến chất lượng tốt nhất cho khách hàng.',
    VideoTestimonial: null as File | null,
    VideoTestimonialDescription: 'Video chứng thực từ khách hàng',
    TextClosing: 'Chúng tôi cam kết: Tất cả sản phẩm đều được kiểm tra chất lượng nghiêm ngặt trước khi đến tay khách hàng. Từ khâu gieo trồng, chăm sóc, thu hoạch đến bảo quản và vận chuyển, mọi quy trình đều được thực hiện theo tiêu chuẩn cao nhất để đảm bảo sản phẩm tươi ngon, an toàn và giữ trọn vẹn giá trị dinh dưỡng.',
    ThumbnailImage: null as File | null
  })

  const handleInputChange = (field: string, value: string) => {
    setStoryData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileChange = (field: string, file: File | null) => {
    setStoryData((prev) => ({
      ...prev,
      [field]: file
    }))
  }

  const handleGalleryImagesChange = (files: File[]) => {
    setStoryData((prev) => ({
      ...prev,
      GalleryImages: files
    }))
  }

  const removeGalleryImage = (index: number) => {
    setStoryData((prev) => ({
      ...prev,
      GalleryImages: prev.GalleryImages.filter((_, i) => i !== index)
    }))
  }

  const handleCreateStory = async () => {
    try {
      setLoading(true)

      const storyPayload: StoreStoryUpdateData = {
        Title: storyData.Title,
        TextIntro: storyData.TextIntro,
        VideoOpener: storyData.VideoOpener || undefined,
        VideoOpenerDescription: storyData.VideoOpenerDescription,
        SingleImage: storyData.SingleImage || undefined,
        SingleImageDescription: storyData.SingleImageDescription,
        GalleryImages: storyData.GalleryImages.length > 0 ? storyData.GalleryImages : undefined,
        GalleryDescription: storyData.GalleryDescription,
        VideoProcess: storyData.VideoProcess || undefined,
        VideoProcessDescription: storyData.VideoProcessDescription,
        TextExpanded: storyData.TextExpanded,
        VideoTestimonial: storyData.VideoTestimonial || undefined,
        VideoTestimonialDescription: storyData.VideoTestimonialDescription,
        TextClosing: storyData.TextClosing,
        ThumbnailImage: storyData.ThumbnailImage || undefined
      }

      await storeStoryApi.create(storyPayload)
      navigate('/myStorySeller')
    } catch (error) {
      console.error('Error creating story:', error)
      alert('Có lỗi xảy ra khi tạo câu chuyện. Vui lòng thử lại.')
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
        {/* Our Story Section */}
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

              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Story Content */}
                <div className='space-y-4'>
                  <Label className='text-lg font-semibold text-green-700'>Nội dung câu chuyện</Label>
                  <Textarea
                    placeholder='Chúng tôi là một cửa hàng chuyên cung cấp các sản phẩm nông sản sạch...'
                    value={storyData.TextIntro}
                    onChange={(e) => handleInputChange('TextIntro', e.target.value)}
                    className='min-h-[120px] text-base'
                  />
                  <Textarea
                    placeholder='Với hơn 10 năm kinh nghiệm trong lĩnh vực nông nghiệp...'
                    value={storyData.TextExpanded}
                    onChange={(e) => handleInputChange('TextExpanded', e.target.value)}
                    className='min-h-[120px] text-base'
                  />
                </div>

                {/* Story Image */}
                <div className='space-y-4'>
                  <Label className='text-lg font-semibold text-green-700'>Hình ảnh câu chuyện</Label>
                  <div className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer'>
                    {storyData.SingleImage ? (
                      <div className='space-y-2'>
                        <img
                          src={URL.createObjectURL(storyData.SingleImage)}
                          alt='Story image'
                          className='w-full h-32 object-cover rounded'
                        />
                        <p className='text-sm text-gray-600'>{storyData.SingleImage.name}</p>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleFileChange('SingleImage', null)}
                          className='text-red-600 hover:text-red-700'
                        >
                          <X className='w-4 h-4 mr-1' />
                          Xóa
                        </Button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                        <p className='text-gray-500 mb-4'>Tải lên hình ảnh minh họa</p>
                        <input
                          type='file'
                          accept='image/*'
                          onChange={(e) => handleFileChange('SingleImage', e.target.files?.[0] || null)}
                          className='hidden'
                          id='single-image-upload'
                        />
                        <Button
                          variant='outline'
                          className='bg-white'
                          onClick={() => document.getElementById('single-image-upload')?.click()}
                        >
                          <Upload className='w-4 h-4 mr-2' />
                          Chọn ảnh
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Video Upload Area */}
        <Card>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              <Label className='text-lg font-semibold text-green-700'>Video trung tâm</Label>
              <div className='border-2 border-dashed border-gray-400 rounded-lg p-12 text-center hover:border-gray-300 transition-colors cursor-pointer bg-gray-900'>
                {storyData.VideoOpener ? (
                  <div className='space-y-2'>
                    <video
                      src={URL.createObjectURL(storyData.VideoOpener)}
                      controls
                      className='w-full h-48 object-cover rounded'
                    />
                    <p className='text-sm text-gray-300'>{storyData.VideoOpener.name}</p>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleFileChange('VideoOpener', null)}
                      className='text-red-600 hover:text-red-700 bg-white'
                    >
                      <X className='w-4 h-4 mr-1' />
                      Xóa
                    </Button>
                  </div>
                ) : (
                  <>
                    <Video className='w-16 h-16 text-green-400 mx-auto mb-4' />
                    <h3 className='text-lg font-medium text-white mb-2'>Tải lên video của bạn</h3>
                    <p className='text-gray-300 mb-4'>Kéo và thả tệp vào đây</p>
                    <input
                      type='file'
                      accept='video/*'
                      onChange={(e) => handleFileChange('VideoOpener', e.target.files?.[0] || null)}
                      className='hidden'
                      id='video-upload'
                    />
                    <Button
                      variant='outline'
                      className='bg-green-600 border-green-600 text-white hover:bg-green-700'
                      onClick={() => document.getElementById('video-upload')?.click()}
                    >
                      <Upload className='w-4 h-4 mr-2' />
                      Chọn tệp
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gallery Section */}
        <Card>
          <CardContent className='p-6'>
            <div className='space-y-6'>
              <div className='space-y-4'>
                <Label className='text-lg font-semibold text-green-700'>Mô tả gallery</Label>
                <Input
                  placeholder='Bộ sưu tập hình ảnh về quá trình sản xuất'
                  value={storyData.GalleryDescription}
                  onChange={(e) => handleInputChange('GalleryDescription', e.target.value)}
                  className='text-xl font-bold text-center'
                />
              </div>

              <div className='space-y-4'>
                <Label className='text-lg font-semibold text-green-700'>Hình ảnh gallery</Label>
                <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                  {storyData.GalleryImages.map((image, index) => (
                    <div key={index} className='space-y-2'>
                      <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer aspect-square'>
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Gallery ${index + 1}`}
                          className='w-full h-full object-cover rounded'
                        />
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => removeGalleryImage(index)}
                          className='text-red-600 hover:text-red-700 mt-2'
                        >
                          <X className='w-4 h-4 mr-1' />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  ))}

                  {storyData.GalleryImages.length < 4 && (
                    <div className='space-y-2'>
                      <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer aspect-square'>
                        <ImageIcon className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                        <p className='text-xs text-gray-500'>Tải lên ảnh</p>
                        <input
                          type='file'
                          accept='image/*'
                          onChange={(e) => {
                            const files = Array.from(e.target.files || [])
                            handleGalleryImagesChange([...storyData.GalleryImages, ...files])
                          }}
                          className='hidden'
                          id='gallery-upload'
                        />
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => document.getElementById('gallery-upload')?.click()}
                          className='mt-2'
                        >
                          <Upload className='w-4 h-4 mr-1' />
                          Thêm
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commitment Section */}
        <Card>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              <Label className='text-lg font-semibold text-green-700'>Nội dung cam kết</Label>
              <div className='bg-green-50 p-6 rounded-lg border border-green-200'>
                <Textarea
                  placeholder='Chúng tôi cam kết: Tất cả sản phẩm đều được kiểm tra chất lượng nghiêm ngặt...'
                  value={storyData.TextClosing}
                  onChange={(e) => handleInputChange('TextClosing', e.target.value)}
                  className='min-h-[120px] text-base bg-transparent border-none resize-none'
                />
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
