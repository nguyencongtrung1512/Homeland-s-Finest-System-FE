import React from 'react'

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { Upload, Image as ImageIcon, Save, X, ArrowLeft, Package } from 'lucide-react'
import { toast } from 'react-toastify'
import type { Combo } from '../../../types/combo.type'

// Mock data cứng (giống với detailCombo.tsx)
const mockCombos: Combo[] = [
  {
    id: '1',
    name: 'Combo Gạo Sạch Miền Tây',
    provinceId: 1,
    provinceName: 'An Giang',
    description: 'Combo gạo sạch chất lượng cao từ miền Tây Nam Bộ, đảm bảo an toàn thực phẩm',
    isActive: true,
    thumbnailUrl: 'https://tse1.mm.bing.net/th/id/OIP.xS6YZHwSZbjL4L_kfFPHEQHaEL?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3',
    staffNote: 'Combo được duyệt và đang bán tốt',
    comboItems: [
      {
        id: '1-1',
        productVariantId: 'pv-1',
        comboItemName: 'Gạo ST25 5kg',
        comboItemImageUrl: 'https://tse2.mm.bing.net/th/id/OIP.HTagk8TrUtzQbnYskxV_bwHaEK?cb=12&pid=ImgDet&w=184&h=103&c=7&dpr=1.3&o=7&rm=3',
        price: 150000,
        quantity: 1,
        isActive: true,
        productName: 'Gạo ST25',
        variantName: '5kg',
        storeName: 'Cửa hàng Gạo Sạch Miền Tây'
      },
      {
        id: '1-2',
        productVariantId: 'pv-2',
        comboItemName: 'Gạo Jasmine 2kg',
        comboItemImageUrl: 'https://tse3.mm.bing.net/th/id/OIP.lVQdtmjBTXhN-BzGdkkVWAHaFs?cb=12&w=780&h=600&rs=1&pid=ImgDetMain&o=7&rm=3',
        price: 80000,
        quantity: 1,
        isActive: true,
        productName: 'Gạo Jasmine',
        variantName: '2kg',
        storeName: 'Cửa hàng Gạo Sạch Miền Tây'
      },
      {
        id: '1-3',
        productVariantId: 'pv-3',
        comboItemName: 'Gạo Nàng Thơm 3kg',
        comboItemImageUrl: 'https://tse3.mm.bing.net/th/id/OIP.lVQdtmjBTXhN-BzGdkkVWAHaFs?cb=12&w=780&h=600&rs=1&pid=ImgDetMain&o=7&rm=3',
        price: 120000,
        quantity: 1,
        isActive: true,
        productName: 'Gạo Nàng Thơm',
        variantName: '3kg',
        storeName: 'Cửa hàng Gạo Sạch Miền Tây'
      }
    ]
  }
]

function UpdateComboSeller() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [combo, setCombo] = useState<Combo | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('basic')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    thumbnailFile: null as File | null,
    thumbnailPreview: ''
  })

  useEffect(() => {
    // Simulate API call to get combo data
    const fetchCombo = async () => {
      setLoading(true)
      try {
        await new Promise((resolve) => setTimeout(resolve, 500))

        const foundCombo = mockCombos.find((c) => c.id === id)
        if (foundCombo) {
          setCombo(foundCombo)
          setFormData({
            name: foundCombo.name,
            description: foundCombo.description,
            isActive: foundCombo.isActive,
            thumbnailFile: null,
            thumbnailPreview: foundCombo.thumbnailUrl
          })
        } else {
          setCombo(null)
        }
      } catch (error) {
        console.error('Error fetching combo:', error)
        setCombo(null)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchCombo()
    }
  }, [id])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB')
        return
      }

      setFormData((prev) => ({
        ...prev,
        thumbnailFile: file,
        thumbnailPreview: URL.createObjectURL(file)
      }))
    }
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên combo')
      return
    }

    console.log('Saving combo data:', formData)
    toast.success('Cập nhật combo thành công!')
    navigate(-1)
  }

  const handleCancel = () => {
    navigate(-1)
  }

  const handleBack = () => {
    navigate(-1)
  }

  if (loading) {
    return (
      <div className='p-6'>
        <div className='flex justify-center items-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-600'></div>
          <span className='ml-2 text-gray-600'>Đang tải...</span>
        </div>
      </div>
    )
  }

  if (!combo) {
    return (
      <div className='p-6'>
        <div className='text-center py-12'>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Không tìm thấy combo</h2>
          <p className='text-gray-600 mb-6'>Combo bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <Button onClick={handleBack} className='bg-green-600 hover:bg-green-700'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Quay lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='mb-8'>
        <div className='flex items-center gap-4 mb-4'>
          <Button variant='ghost' onClick={handleBack}>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Quay lại
          </Button>
          <h1 className='text-3xl font-bold text-green-700'>Chỉnh sửa Combo</h1>
        </div>
        <p className='text-gray-600'>Cập nhật thông tin và cài đặt combo của bạn</p>
      </div>

      {/* Tabs */}
      <div className='flex space-x-8 border-b border-gray-200 mb-8'>
        <button
          onClick={() => setActiveTab('basic')}
          className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'basic' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Thông tin cơ bản
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'items' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Sản phẩm trong combo
        </button>
      </div>

      {/* Main Content */}
      <Card className='max-w-4xl mx-auto'>
        <CardContent className='p-8'>
          {activeTab === 'basic' && (
            <div className='space-y-8'>
              {/* Combo Thumbnail Section */}
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>Ảnh thumbnail combo</h3>
                <div className='flex items-start gap-6'>
                  <div className='w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden'>
                    {formData.thumbnailPreview ? (
                      <img
                        src={formData.thumbnailPreview}
                        alt='Combo thumbnail'
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <ImageIcon className='w-8 h-8 text-gray-400' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <Button onClick={() => document.getElementById('thumbnail')?.click()} className='bg-green-600 hover:bg-green-700 text-white mb-2'>
                      <Upload className='w-4 h-4 mr-2' />
                      Tải lên ảnh mới
                    </Button>
                    <input
                      id='thumbnail'
                      type='file'
                      accept='image/*'
                      onChange={handleFileChange}
                      className='hidden'
                    />
                    <p className='text-sm text-gray-500'>Khuyến nghị: 300x200px, định dạng PNG hoặc JPG</p>
                  </div>
                </div>
              </div>

              {/* Combo Information Fields */}
              <div className='space-y-6'>
                {/* Combo Name */}
                <div>
                  <Label htmlFor='name' className='text-sm font-medium text-gray-700 mb-2 block'>
                    Tên combo *
                  </Label>
                  <Input
                    id='name'
                    placeholder='Nhập tên combo'
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className='w-full'
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor='description' className='text-sm font-medium text-gray-700 mb-2 block'>
                    Mô tả combo
                  </Label>
                  <Textarea
                    id='description'
                    placeholder='Nhập mô tả chi tiết về combo'
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className='w-full min-h-[100px]'
                  />
                </div>

                {/* Status */}
                <div>
                  <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                    Trạng thái combo
                  </Label>
                  <div className='flex items-center space-x-4'>
                    <label className='flex items-center'>
                      <input
                        type='radio'
                        name='status'
                        checked={formData.isActive}
                        onChange={() => handleInputChange('isActive', true)}
                        className='mr-2'
                      />
                      <span className='text-sm text-gray-700'>Hoạt động</span>
                    </label>
                    <label className='flex items-center'>
                      <input
                        type='radio'
                        name='status'
                        checked={!formData.isActive}
                        onChange={() => handleInputChange('isActive', false)}
                        className='mr-2'
                      />
                      <span className='text-sm text-gray-700'>Tạm dừng</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div className='space-y-8'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold text-gray-900'>Sản phẩm trong combo</h3>
                <Button className='bg-green-600 hover:bg-green-700 text-white'>
                  <Package className='w-4 h-4 mr-2' />
                  Thêm sản phẩm
                </Button>
              </div>

              {/* Combo Items List */}
              <div className='space-y-4'>
                {combo.comboItems.map((item) => (
                  <div key={item.id} className='border rounded-lg p-4 hover:shadow-md transition-shadow'>
                    <div className='flex gap-4'>
                      <img
                        src={item.comboItemImageUrl}
                        alt={item.comboItemName}
                        className='w-16 h-16 object-cover rounded-lg'
                      />
                      <div className='flex-1'>
                        <h4 className='font-medium text-gray-900'>{item.comboItemName}</h4>
                        <p className='text-sm text-gray-600'>
                          {item.productName} - {item.variantName}
                        </p>
                        <p className='text-sm text-gray-500'>{item.storeName}</p>
                        <div className='flex justify-between items-center mt-2'>
                          <span className='text-sm text-gray-600'>Số lượng: {item.quantity}</span>
                          <span className='font-semibold text-green-600'>
                            {(item.price * item.quantity).toLocaleString()}₫
                          </span>
                        </div>
                      </div>
                      <div className='flex gap-2'>
                        <Button variant='outline' size='sm'>
                          Chỉnh sửa
                        </Button>
                        <Button variant='outline' size='sm' className='text-red-600 hover:text-red-700'>
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Item Button */}
              <div className='text-center py-8 border-2 border-dashed border-gray-300 rounded-lg'>
                <Button variant='outline' className='border-green-600 text-green-600 hover:bg-green-50'>
                  <Package className='w-4 h-4 mr-2' />
                  Thêm sản phẩm mới vào combo
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex justify-end gap-4 pt-8 border-t border-gray-200 mt-8'>
            <Button variant='outline' onClick={handleCancel} className='border-gray-300 text-gray-700 hover:bg-gray-50'>
              <X className='w-4 h-4 mr-2' />
              Hủy bỏ
            </Button>
            <Button onClick={handleSave} className='bg-green-600 hover:bg-green-700 text-white'>
              <Save className='w-4 h-4 mr-2' />
              Lưu thay đổi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default UpdateComboSeller