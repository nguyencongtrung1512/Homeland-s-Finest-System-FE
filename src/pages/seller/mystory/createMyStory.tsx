import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import {
  ArrowLeft,
  Video,
  Upload,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Image as ImageIcon,
  Type
} from 'lucide-react'

function CreateMyStory() {
  const navigate = useNavigate()

  const [storyData, setStoryData] = useState({
    title: '',
    introduction: '',
    mainContent: '',
    video: null
  })

  const handleInputChange = (field: string, value: string) => {
    setStoryData(prev => ({
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
        <Button
          variant='ghost'
          size='sm'
          onClick={handleBack}
          className='text-gray-600 hover:text-gray-900'
        >
          <ArrowLeft className='w-4 h-4' />
        </Button>
        <h1 className='text-3xl font-bold text-green-700'>Soạn thảo câu chuyện mới</h1>
      </div>

      <div className='max-w-4xl mx-auto space-y-8'>
        {/* Main Title Section */}
        <Card>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              <Label className='text-lg font-semibold text-green-700'>
                Tiêu đề chính
              </Label>
              <Input
                placeholder='Ví dụ: Hành trình hạt cà phê Robusta từ nông trại đến tách trà'
                value={storyData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className='text-base py-3'
              />
              <p className='text-sm text-gray-600'>
                Tiêu đề hấp dẫn sẽ giúp thu hút người đọc khám phá câu chuyện của bạn.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Introduction Section */}
        <Card>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              <Label className='text-lg font-semibold text-green-700'>
                Đoạn giới thiệu
              </Label>

              {/* Rich Text Toolbar */}
              <div className='flex gap-2 p-2 border border-gray-200 rounded-lg bg-gray-50'>
                <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                  <Bold className='w-4 h-4' />
                </Button>
                <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                  <Italic className='w-4 h-4' />
                </Button>
              </div>

              <Textarea
                placeholder='Viết một đoạn mở đầu thật lôi cuốn (khoảng 2-3 câu)...'
                value={storyData.introduction}
                onChange={(e) => handleInputChange('introduction', e.target.value)}
                className='min-h-[120px] text-base'
              />
            </div>
          </CardContent>
        </Card>

        {/* Central Video Section */}
        <Card>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              <Label className='text-lg font-semibold text-green-700'>
                Video trung tâm
              </Label>

              {/* Video Upload Area */}
              <div className='border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors cursor-pointer'>
                <Video className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-700 mb-2'>
                  Tải lên video của bạn
                </h3>
                <p className='text-gray-500 mb-4'>
                  Kéo và thả tệp vào đây
                </p>
                <Button variant='outline' className='bg-white'>
                  <Upload className='w-4 h-4 mr-2' />
                  Chọn tệp
                </Button>
              </div>

              {/* Video Info */}
              <div className='text-sm text-gray-600 bg-gray-50 p-3 rounded-lg'>
                <p><strong>Định dạng hỗ trợ:</strong> MP4, MOV</p>
                <p><strong>Dung lượng tối đa:</strong> 100MB</p>
                <p><strong>Tỷ lệ khuyên dùng:</strong> 16:9</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Section */}
        <Card>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              <Label className='text-lg font-semibold text-green-700'>
                Nội dung chính của câu chuyện
              </Label>

              {/* Rich Text Toolbar */}
              <div className='flex gap-2 p-2 border border-gray-200 rounded-lg bg-gray-50'>
                <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                  <Type className='w-4 h-4' />
                </Button>
                <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                  <Type className='w-4 h-4' />
                </Button>
                <div className='w-px h-6 bg-gray-300 mx-1' />
                <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                  <Bold className='w-4 h-4' />
                </Button>
                <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                  <Italic className='w-4 h-4' />
                </Button>
                <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                  <Underline className='w-4 h-4' />
                </Button>
                <div className='w-px h-6 bg-gray-300 mx-1' />
                <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                  <List className='w-4 h-4' />
                </Button>
                <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                  <ListOrdered className='w-4 h-4' />
                </Button>
                <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                  <Quote className='w-4 h-4' />
                </Button>
                <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                  <ImageIcon className='w-4 h-4' />
                </Button>
              </div>

              <Textarea
                placeholder='Viết nội dung chính của câu chuyện...'
                value={storyData.mainContent}
                onChange={(e) => handleInputChange('mainContent', e.target.value)}
                className='min-h-[300px] text-base'
              />
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
          <Button
            size='lg'
            onClick={handlePublish}
            className='bg-green-600 hover:bg-green-700 text-white'
          >
            Đăng bài
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CreateMyStory
