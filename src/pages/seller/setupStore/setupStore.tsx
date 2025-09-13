import React, { useState } from 'react'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import {
  Upload,
  Image as ImageIcon,
  Save,
  X
} from 'lucide-react'

function SetupStore() {
  const [activeTab, setActiveTab] = useState('basic')
  const [storeData, setStoreData] = useState({
    storeName: '',
    phone: '',
    address: '',
    logo: null,
    coverImage: null
  })

  const handleInputChange = (field: string, value: string) => {
    setStoreData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    console.log('Saving store data:', storeData)
    // Implement save logic
  }

  const handleCancel = () => {
    console.log('Canceling changes')
    // Reset form or navigate back
  }

  const handleLogoUpload = () => {
    console.log('Uploading logo')
    // Implement logo upload logic
  }

  const handleCoverUpload = () => {
    console.log('Uploading cover image')
    // Implement cover image upload logic
  }

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-green-700 mb-2'>Thiết lập cửa hàng</h1>
        <p className='text-gray-600'>Quản lý thông tin và cài đặt cửa hàng của bạn</p>
      </div>

      {/* Tabs */}
      <div className='flex space-x-8 border-b border-gray-200 mb-8'>
        <button
          onClick={() => setActiveTab('basic')}
          className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'basic'
            ? 'text-green-600 border-b-2 border-green-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Thông tin cơ bản
        </button>
        <button
          onClick={() => setActiveTab('legal')}
          className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'legal'
            ? 'text-green-600 border-b-2 border-green-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Pháp lý & Chứng nhận
        </button>
      </div>

      {/* Main Content */}
      <Card className='max-w-4xl mx-auto'>
        <CardContent className='p-8'>
          {activeTab === 'basic' && (
            <div className='space-y-8'>
              {/* Store Logo Section */}
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>Logo cửa hàng</h3>
                <div className='flex items-start gap-6'>
                  <div className='w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0'>
                    <ImageIcon className='w-8 h-8 text-gray-400' />
                  </div>
                  <div className='flex-1'>
                    <Button
                      onClick={handleLogoUpload}
                      className='bg-green-600 hover:bg-green-700 text-white mb-2'
                    >
                      <Upload className='w-4 h-4 mr-2' />
                      Tải lên Logo
                    </Button>
                    <p className='text-sm text-gray-500'>
                      Khuyến nghị: 200x200px, định dạng PNG hoặc JPG
                    </p>
                  </div>
                </div>
              </div>

              {/* Store Cover Image Section */}
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>Ảnh bìa cửa hàng</h3>
                <div className='border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors'>
                  <div className='flex flex-col items-center'>
                    <ImageIcon className='w-16 h-16 text-gray-400 mb-4' />
                    <Button
                      onClick={handleCoverUpload}
                      className='bg-green-600 hover:bg-green-700 text-white mb-2'
                    >
                      <Upload className='w-4 h-4 mr-2' />
                      Tải lên ảnh bìa
                    </Button>
                    <p className='text-sm text-gray-500'>
                      Khuyến nghị: 1200x400px, định dạng PNG hoặc JPG
                    </p>
                  </div>
                </div>
              </div>

              {/* Store Information Fields */}
              <div className='space-y-6'>
                {/* Store Name */}
                <div>
                  <Label htmlFor='storeName' className='text-sm font-medium text-gray-700 mb-2 block'>
                    Tên cửa hàng
                  </Label>
                  <Input
                    id='storeName'
                    placeholder='Nhập tên cửa hàng'
                    value={storeData.storeName}
                    onChange={(e) => handleInputChange('storeName', e.target.value)}
                    className='w-full'
                  />
                </div>

                {/* Contact Phone */}
                <div>
                  <Label htmlFor='phone' className='text-sm font-medium text-gray-700 mb-2 block'>
                    Số điện thoại liên hệ
                  </Label>
                  <Input
                    id='phone'
                    placeholder='Nhập số điện thoại'
                    value={storeData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className='w-full'
                  />
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor='address' className='text-sm font-medium text-gray-700 mb-2 block'>
                    Địa chỉ
                  </Label>
                  <Textarea
                    id='address'
                    placeholder='Nhập địa chỉ chi tiết'
                    value={storeData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className='w-full min-h-[100px]'
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'legal' && (
            <div className='space-y-8'>
              <div className='text-center py-12'>
                <div className='w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <ImageIcon className='w-8 h-8 text-gray-400' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>Pháp lý & Chứng nhận</h3>
                <p className='text-gray-600'>Nội dung này sẽ được phát triển trong tương lai</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex justify-end gap-4 pt-8 border-t border-gray-200 mt-8'>
            <Button
              variant='outline'
              onClick={handleCancel}
              className='border-gray-300 text-gray-700 hover:bg-gray-50'
            >
              <X className='w-4 h-4 mr-2' />
              Hủy bỏ
            </Button>
            <Button
              onClick={handleSave}
              className='bg-yellow-500 hover:bg-yellow-600 text-white'
            >
              <Save className='w-4 h-4 mr-2' />
              Lưu thay đổi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SetupStore
