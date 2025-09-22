import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { ArrowLeft, Video, Upload, Image as ImageIcon } from 'lucide-react'

function CreateMyStory() {
  const navigate = useNavigate()

  const [storyData, setStoryData] = useState({
    mainTitle: 'Nông sản sạch Việt Nam',
    mainSubtitle:
      'Câu chuyện bắt đầu từ đây, đất trời - nơi mà những giống đầu tiên được gieo trồng. Với niềm tin vào sức mạnh của thiên nhiên và tình yêu đối với đất nước, chúng tôi mang đến những sản phẩm nông nghiệp sạch, xanh và an toàn cho sức khỏe.',
    video: null,
    storyTitle: 'Câu chuyện của chúng tôi',
    storyContent1:
      'Chúng tôi là một cửa hàng chuyên cung cấp các sản phẩm nông sản sạch từ các vùng miền Việt Nam. Với hơn 10 năm kinh nghiệm trong ngành, chúng tôi cam kết mang đến cho khách hàng những sản phẩm tươi ngon, an toàn và chất lượng cao nhất.',
    storyContent2:
      'Với hơn 10 năm kinh nghiệm trong lĩnh vực nông nghiệp, chúng tôi hiểu rõ giá trị của từng sản phẩm và cam kết mang đến chất lượng tốt nhất cho khách hàng.',
    storyImage: null,
    galleryTitle: 'Hình ảnh hạt trưởng',
    galleryImages: [null, null, null, null],
    commitmentContent:
      'Chúng tôi cam kết: Tất cả sản phẩm đều được kiểm tra chất lượng nghiêm ngặt trước khi đến tay khách hàng. Từ khâu gieo trồng, chăm sóc, thu hoạch đến bảo quản và vận chuyển, mọi quy trình đều được thực hiện theo tiêu chuẩn cao nhất để đảm bảo sản phẩm tươi ngon, an toàn và giữ trọn vẹn giá trị dinh dưỡng.'
  })

  const handleInputChange = (field: string, value: string) => {
    setStoryData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveDraft = () => {
    console.log('Saving draft:', storyData)
    // Implement save draft logic
    navigate('/myStorySeller')
  }

  const handlePublish = () => {
    console.log('Publishing story:', storyData)
    // Implement publish logic
    navigate('/myStorySeller')
  }

  const handleBack = () => {
    navigate('/myStorySeller')
  }

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center gap-4 mb-8'>
        <Button variant='ghost' size='sm' onClick={handleBack} className='text-gray-600 hover:text-gray-900'>
          <ArrowLeft className='w-4 h-4' />
        </Button>
        <h1 className='text-3xl font-bold text-green-700'>Soạn thảo câu chuyện mới</h1>
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
                  value={storyData.storyTitle}
                  onChange={(e) => handleInputChange('storyTitle', e.target.value)}
                  className='text-xl font-bold text-center'
                />
              </div>

              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Story Content */}
                <div className='space-y-4'>
                  <Label className='text-lg font-semibold text-green-700'>Nội dung câu chuyện</Label>
                  <Textarea
                    placeholder='Chúng tôi là một cửa hàng chuyên cung cấp các sản phẩm nông sản sạch...'
                    value={storyData.storyContent1}
                    onChange={(e) => handleInputChange('storyContent1', e.target.value)}
                    className='min-h-[120px] text-base'
                  />
                  <Textarea
                    placeholder='Với hơn 10 năm kinh nghiệm trong lĩnh vực nông nghiệp...'
                    value={storyData.storyContent2}
                    onChange={(e) => handleInputChange('storyContent2', e.target.value)}
                    className='min-h-[120px] text-base'
                  />
                </div>

                {/* Story Image */}
                <div className='space-y-4'>
                  <Label className='text-lg font-semibold text-green-700'>Hình ảnh câu chuyện</Label>
                  <div className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer'>
                    <ImageIcon className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                    <p className='text-gray-500 mb-4'>Tải lên hình ảnh minh họa</p>
                    <Button variant='outline' className='bg-white'>
                      <Upload className='w-4 h-4 mr-2' />
                      Chọn ảnh
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Video Upload Area */}
        <div className='space-y-4'>
          <Label className='text-lg font-semibold text-green-700'>Video trung tâm</Label>
          <div className='border-2 border-dashed border-gray-400 rounded-lg p-12 text-center hover:border-gray-300 transition-colors cursor-pointer bg-gray-900'>
            <Video className='w-16 h-16 text-green-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-white mb-2'>Tải lên video của bạn</h3>
            <p className='text-gray-300 mb-4'>Kéo và thả tệp vào đây</p>
            <Button variant='outline' className='bg-green-600 border-green-600 text-white hover:bg-green-700'>
              <Upload className='w-4 h-4 mr-2' />
              Chọn tệp
            </Button>
          </div>
        </div>

        {/* Gallery Section */}
        <Card>
          <CardContent className='p-6'>
            <div className='space-y-6'>
              <div className='space-y-4'>
                <Label className='text-lg font-semibold text-green-700'>Tiêu đề gallery</Label>
                <Input
                  placeholder='Hình ảnh hạt trưởng'
                  value={storyData.galleryTitle}
                  onChange={(e) => handleInputChange('galleryTitle', e.target.value)}
                  className='text-xl font-bold text-center'
                />
              </div>

              <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                {storyData.galleryImages.map((_, index) => (
                  <div key={index} className='space-y-2'>
                    <Label className='text-sm font-medium text-gray-700'>Ảnh {index + 1}</Label>
                    <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer aspect-square'>
                      <ImageIcon className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                      <p className='text-xs text-gray-500'>Tải lên ảnh</p>
                    </div>
                  </div>
                ))}
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
                  value={storyData.commitmentContent}
                  onChange={(e) => handleInputChange('commitmentContent', e.target.value)}
                  className='min-h-[120px] text-base bg-transparent border-none resize-none'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commitment Content */}
        <Card>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              <Label className='text-lg font-semibold text-green-700'>Nội dung cam kết</Label>
              <div className='bg-green-50 p-6 rounded-lg border border-green-200'>
                <Textarea
                  placeholder='Chúng tôi cam kết: Tất cả sản phẩm đều được kiểm tra chất lượng nghiêm ngặt...'
                  value={storyData.commitmentContent}
                  onChange={(e) => handleInputChange('commitmentContent', e.target.value)}
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
            onClick={handleSaveDraft}
            className='border-green-600 text-green-600 hover:bg-green-50'
          >
            Lưu bản nháp
          </Button>
          <Button size='lg' onClick={handlePublish} className='bg-green-600 hover:bg-green-700 text-white'>
            Đăng bài
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CreateMyStory
