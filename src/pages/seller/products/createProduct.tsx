import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import {
  Upload,
  Sun,
  BookOpen,
  Shield,
  Info,
  ChevronRight,
  Plus,
  Trash2,
  Video,
  Image as ImageIcon
} from 'lucide-react'

function CreateProduct() {
  const navigate = useNavigate()

  const [productData, setProductData] = useState({
    name: '',
    description: '',
    category: '',
    region: '',
    story: '',
    isVisible: true,
    allowPreOrder: false
  })

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

  const [productVariants, setProductVariants] = useState([
    {
      id: 1,
      price: 0,
      stock: 0,
      unit: ''
    }
  ])

  const handleInputChange = (field: string, value: string | boolean) => {
    setProductData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStoryInputChange = (field: string, value: string) => {
    setStoryData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleVariantChange = (variantId: number, field: string, value: string | number) => {
    setProductVariants((prev) =>
      prev.map((variant) => (variant.id === variantId ? { ...variant, [field]: value } : variant))
    )
  }

  const addVariant = () => {
    const newId = Math.max(...productVariants.map((v) => v.id)) + 1
    setProductVariants((prev) => [
      ...prev,
      {
        id: newId,
        price: 0,
        stock: 0,
        unit: ''
      }
    ])
  }

  const removeVariant = (variantId: number) => {
    if (productVariants.length > 1) {
      setProductVariants((prev) => prev.filter((variant) => variant.id !== variantId))
    }
  }

  const handleCancel = () => {
    navigate('/productsSeller')
  }

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Breadcrumb */}
      <div className='flex items-center space-x-2 text-sm text-gray-600 mb-4'>
        <span className='text-gray-600 hover:text-gray-900 cursor-pointer' onClick={() => navigate('/productsSeller')}>
          Quản lý sản phẩm
        </span>
        <ChevronRight className='w-4 h-4' />
        <span className='text-gray-900 font-medium'>Tạo sản phẩm mới</span>
      </div>

      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-semibold text-gray-900'>Tạo sản phẩm mới</h1>
        <p className='text-gray-600 mt-1'>Thêm sản phẩm mới vào cửa hàng của bạn</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column - Main Content */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className='text-green-700'>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <Label htmlFor='name' className='text-sm font-medium'>
                  Tên sản phẩm <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='name'
                  placeholder='Nhập tên sản phẩm...'
                  value={productData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className='mt-1'
                />
              </div>

              <div>
                <Label htmlFor='description' className='text-sm font-medium'>
                  Mô tả chi tiết
                </Label>
                <Textarea
                  id='description'
                  placeholder='Mô tả chi tiết về sản phẩm của bạn...'
                  value={productData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className='mt-1 min-h-[120px]'
                />
                {/* Formatting toolbar */}
                <div className='flex gap-2 mt-2'>
                  <Button variant='outline' size='sm' className='h-8 w-8 p-0'>
                    <span className='font-bold'>B</span>
                  </Button>
                  <Button variant='outline' size='sm' className='h-8 w-8 p-0'>
                    <span className='italic'>I</span>
                  </Button>
                  <Button variant='outline' size='sm' className='h-8 w-8 p-0'>
                    •
                  </Button>
                </div>
              </div>

              {/* Product Variants */}
              <div>
                <div className='flex items-center justify-between mb-4'>
                  <Label className='text-sm font-medium'>Loại sản phẩm</Label>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={addVariant}
                    className='text-green-600 border-green-600 hover:bg-green-50'
                  >
                    <Plus className='w-4 h-4 mr-2' />
                    Thêm loại khác
                  </Button>
                </div>

                <div className='space-y-4'>
                  {productVariants.map((variant, index) => (
                    <div key={variant.id} className='border border-gray-200 rounded-lg p-4 bg-gray-50'>
                      <div className='flex items-center justify-between mb-3'>
                        <h4 className='text-sm font-medium text-gray-700'>Loại {index + 1}</h4>
                        {productVariants.length > 1 && (
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => removeVariant(variant.id)}
                            className='text-red-600 hover:text-red-700 hover:bg-red-50'
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        )}
                      </div>

                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <Label className='text-sm font-medium'>
                            Giá bán (VNĐ) <span className='text-red-500'>*</span>
                          </Label>
                          <Input
                            type='number'
                            value={variant.price}
                            onChange={(e) => handleVariantChange(variant.id, 'price', parseInt(e.target.value) || 0)}
                            className='mt-1'
                          />
                        </div>
                        <div>
                          <Label className='text-sm font-medium'>
                            Số lượng tồn kho <span className='text-red-500'>*</span>
                          </Label>
                          <Input
                            type='number'
                            value={variant.stock}
                            onChange={(e) => handleVariantChange(variant.id, 'stock', parseInt(e.target.value) || 0)}
                            className='mt-1'
                          />
                        </div>
                      </div>

                      <div className='mt-4'>
                        <Label className='text-sm font-medium'>
                          Loại <span className='text-red-500'>*</span>
                        </Label>
                        <Input
                          placeholder='ml, kg...'
                          value={variant.unit}
                          onChange={(e) => handleVariantChange(variant.id, 'unit', e.target.value)}
                          className='mt-1'
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images & Video */}
          <Card>
            <CardHeader>
              <CardTitle className='text-green-700'>Hình ảnh & Video</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label className='text-sm font-medium'>
                  Hình ảnh sản phẩm <span className='text-red-500'>*</span>
                </Label>
                <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer'>
                  <Upload className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                  <p className='text-gray-600 mb-2'>Kéo thả hoặc click để tải ảnh lên</p>
                  <p className='text-sm text-gray-500'>PNG, JPG tối đa 5MB</p>
                </div>
              </div>
            </CardContent>
            <CardContent>
              <div>
                <Label className='text-sm font-medium'>
                  Video sản phẩm <span className='text-red-500'>*</span>
                </Label>
                <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer'>
                  <Upload className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                  <p className='text-gray-600 mb-2'>Kéo thả hoặc click để tải video lên</p>
                  <p className='text-sm text-gray-500'>MP4, MOV tối đa 5MB</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Story Connection */}
          <Card>
            <CardHeader>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <BookOpen className='w-5 h-5 text-green-600' />
                Câu chuyện gắn kết
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-start gap-2'>
                <Info className='w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0' />
                <p className='text-sm text-gray-600'>Câu chuyện giúp khách hàng hiểu rõ hơn về giá trị sản phẩm</p>
              </div>

              {/* Main Title */}
              <div>
                <Label className='text-sm font-medium'>Tiêu đề chính</Label>
                <Input
                  placeholder='Nông sản sạch Việt Nam'
                  value={storyData.mainTitle}
                  onChange={(e) => handleStoryInputChange('mainTitle', e.target.value)}
                  className='mt-1'
                />
              </div>

              {/* Main Subtitle */}
              <div>
                <Label className='text-sm font-medium'>Đoạn mô tả</Label>
                <Textarea
                  placeholder='Câu chuyện bắt đầu từ đây, đất trời...'
                  value={storyData.mainSubtitle}
                  onChange={(e) => handleStoryInputChange('mainSubtitle', e.target.value)}
                  className='mt-1 min-h-[80px]'
                />
              </div>

              {/* Video Upload */}
              <div>
                <Label className='text-sm font-medium'>Video trung tâm</Label>
                <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer'>
                  <Video className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                  <p className='text-sm text-gray-600 mb-2'>Tải lên video của bạn</p>
                  <Button variant='outline' size='sm' className='bg-gray-100'>
                    <Upload className='w-4 h-4 mr-2' />
                    Chọn tệp
                  </Button>
                </div>
              </div>

              {/* Story Title */}
              <div>
                <Label className='text-sm font-medium'>Tiêu đề câu chuyện</Label>
                <Input
                  placeholder='Câu chuyện của chúng tôi'
                  value={storyData.storyTitle}
                  onChange={(e) => handleStoryInputChange('storyTitle', e.target.value)}
                  className='mt-1'
                />
              </div>

              {/* Story Content */}
              <div>
                <Label className='text-sm font-medium'>Nội dung câu chuyện</Label>
                <Textarea
                  placeholder='Chúng tôi là một cửa hàng chuyên cung cấp...'
                  value={storyData.storyContent1}
                  onChange={(e) => handleStoryInputChange('storyContent1', e.target.value)}
                  className='mt-1 min-h-[80px]'
                />
              </div>

              <div>
                <Textarea
                  placeholder='Với hơn 10 năm kinh nghiệm...'
                  value={storyData.storyContent2}
                  onChange={(e) => handleStoryInputChange('storyContent2', e.target.value)}
                  className='min-h-[80px]'
                />
              </div>

              {/* Story Image */}
              <div>
                <Label className='text-sm font-medium'>Hình ảnh câu chuyện</Label>
                <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer'>
                  <ImageIcon className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                  <p className='text-sm text-gray-600 mb-2'>Tải lên hình ảnh minh họa</p>
                  <Button variant='outline' size='sm' className='bg-gray-100'>
                    <Upload className='w-4 h-4 mr-2' />
                    Chọn ảnh
                  </Button>
                </div>
              </div>

              {/* Gallery Title */}
              <div>
                <Label className='text-sm font-medium'>Tiêu đề gallery</Label>
                <Input
                  placeholder='Hình ảnh hạt trưởng'
                  value={storyData.galleryTitle}
                  onChange={(e) => handleStoryInputChange('galleryTitle', e.target.value)}
                  className='mt-1'
                />
              </div>

              {/* Gallery Images */}
              <div>
                <Label className='text-sm font-medium'>Hình ảnh gallery (4 ảnh)</Label>
                <div className='grid grid-cols-2 gap-2 mt-2'>
                  {storyData.galleryImages.map((_, index) => (
                    <div
                      key={index}
                      className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer'
                    >
                      <ImageIcon className='w-6 h-6 text-gray-400 mx-auto mb-1' />
                      <p className='text-xs text-gray-500'>Ảnh {index + 1}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commitment */}
              <div>
                <Label className='text-sm font-medium'>Cam kết của chúng tôi</Label>
                <div className='mt-2 bg-green-50 p-4 rounded-lg border border-green-200'>
                  <Textarea
                    placeholder='Chúng tôi cam kết: Tất cả sản phẩm đều được kiểm tra...'
                    value={storyData.commitmentContent}
                    onChange={(e) => handleStoryInputChange('commitmentContent', e.target.value)}
                    className='min-h-[80px] bg-transparent border-none resize-none'
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className='space-y-6'>
          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle className='text-green-700'>Phân loại</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor='category' className='text-sm font-medium'>
                  Danh mục sản phẩm <span className='text-red-500'>*</span>
                </Label>
                <Select value={productData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger className='mt-1'>
                    <SelectValue placeholder='Chọn danh mục' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='food'>Thực phẩm</SelectItem>
                    <SelectItem value='beverage'>Đồ uống</SelectItem>
                    <SelectItem value='handicraft'>Thủ công mỹ nghệ</SelectItem>
                    <SelectItem value='agriculture'>Nông sản</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Origin & Certification */}
          <Card>
            <CardHeader>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <Sun className='w-5 h-5 text-yellow-500' />
                Nguồn gốc & Chứng nhận
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <Label htmlFor='region' className='text-sm font-medium'>
                  Vùng miền/Làng nghề
                </Label>
                <Input
                  id='region'
                  placeholder='VD: Làng gốm Bát Tràng, Hà Nội'
                  value={productData.region}
                  onChange={(e) => handleInputChange('region', e.target.value)}
                  className='mt-1'
                />
              </div>

              <div>
                <Label className='text-sm font-medium'>Tải lên chứng nhận</Label>
                <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer'>
                  <Shield className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                  <p className='text-sm text-gray-600 mb-3'>VietGAP, OCOP, hoặc chứng nhận khác</p>
                  <Button variant='outline' size='sm' className='bg-gray-100'>
                    <Upload className='w-4 h-4 mr-2' />
                    Tải file lên
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex justify-center gap-4 mt-8'>
        <Button variant='outline' size='lg' onClick={handleCancel}>
          Hủy
        </Button>
        <Button className='bg-green-600 hover:bg-green-700' size='lg'>
          Tạo sản phẩm
        </Button>
      </div>
    </div>
  )
}

export default CreateProduct
