import { useState } from 'react'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { Upload, Image as ImageIcon, X, Edit3, Check, FileText, Calendar, Building, Download, Eye } from 'lucide-react'

function SetupStore() {
  const [activeTab, setActiveTab] = useState('basic')
  const [isEditMode, setIsEditMode] = useState(false)

  // Fake hardcoded data
  const [storeData, setStoreData] = useState({
    storeName: 'Cửa hàng nông sản Tinh Hoa Việt',
    phone: '0123456789',
    address: '123 Đường Nguyễn Văn Linh, Phường Tân Phong, Quận 7, TP. Hồ Chí Minh',
    logo: 'https://tse4.mm.bing.net/th/id/OIP.OzC1wHydhdTYKCX3RxakewHaE8?cb=12&pid=ImgDet&w=184&h=122&c=7&dpr=1.3&o=7&rm=3',
    coverImage:
      'https://tse1.mm.bing.net/th/id/OIP.GLMXqWZ6hETLLmHi3ozVPwHaE8?cb=12&pid=ImgDet&w=184&h=122&c=7&dpr=1.3&o=7&rm=3',
    // Legal & Certifications data
    businessLicense: '0123456789',
    taxCode: '0123456789',
    businessRegistrationDate: '15/03/2020',
    businessType: 'Công ty TNHH',
    representativeName: 'Nguyễn Văn Minh',
    representativeId: '123456789',
    certifications: [
      {
        id: 1,
        name: 'Chứng nhận VietGAP',
        number: 'VG-2024-001',
        issuedDate: '10/01/2024',
        expiryDate: '10/01/2027',
        issuingAuthority: 'Cục Trồng trọt - Bộ Nông nghiệp',
        documentUrl: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=VietGAP+Certificate'
      },
      {
        id: 2,
        name: 'Chứng nhận HACCP',
        number: 'HACCP-2024-002',
        issuedDate: '15/02/2024',
        expiryDate: '15/02/2027',
        issuingAuthority: 'Tổng cục Tiêu chuẩn Đo lường Chất lượng',
        documentUrl: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=HACCP+Certificate'
      },
      {
        id: 3,
        name: 'Chứng nhận ISO 22000',
        number: 'ISO-2024-003',
        issuedDate: '20/03/2024',
        expiryDate: '20/03/2027',
        issuingAuthority: 'Tổng cục Tiêu chuẩn Đo lường Chất lượng',
        documentUrl: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=ISO+22000+Certificate'
      }
    ]
  })

  const [originalData, setOriginalData] = useState(storeData)

  const handleInputChange = (field: string, value: string) => {
    setStoreData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleEdit = () => {
    setIsEditMode(true)
    setOriginalData(storeData)
  }

  const handleSave = () => {
    console.log('Saving store data:', storeData)
    setIsEditMode(false)
    setOriginalData(storeData)
    // Implement save logic
  }

  const handleCancel = () => {
    console.log('Canceling changes')
    setStoreData(originalData)
    setIsEditMode(false)
  }

  const handleLogoUpload = () => {
    console.log('Uploading logo')
    // Implement logo upload logic
  }

  const handleCoverUpload = () => {
    console.log('Uploading cover image')
    // Implement cover image upload logic
  }

  const handleDocumentUpload = (type: string) => {
    console.log(`Uploading ${type} document`)
    // Implement document upload logic
  }

  const handleViewDocument = (url: string) => {
    window.open(url, '_blank')
  }

  const handleDownloadDocument = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
  }

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='mb-8 flex justify-between items-start'>
        <div>
          <h1 className='text-3xl font-bold text-green-700 mb-2'>Thiết lập cửa hàng</h1>
          <p className='text-gray-600'>Quản lý thông tin và cài đặt cửa hàng của bạn</p>
        </div>
        {!isEditMode && (
          <Button onClick={handleEdit} className='bg-green-600 hover:bg-green-700 text-white'>
            <Edit3 className='w-4 h-4 mr-2' />
            Chỉnh sửa
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className='flex space-x-8 border-b border-gray-200 mb-8'>
        <button
          onClick={() => setActiveTab('basic')}
          className={`pb-3 px-5 text-sm font-medium transition-colors ${activeTab === 'basic' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Thông tin cơ bản
        </button>
        <button
          onClick={() => setActiveTab('legal')}
          className={`pb-3  px-5 text-sm font-medium transition-colors ${activeTab === 'legal' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600 hover:text-gray-900'
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
                  <div className='w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden'>
                    {storeData.logo ? (
                      <img src={storeData.logo} alt='Store Logo' className='w-full h-full object-cover rounded-full' />
                    ) : (
                      <ImageIcon className='w-8 h-8 text-gray-400' />
                    )}
                  </div>
                  <div className='flex-1'>
                    {isEditMode ? (
                      <>
                        <Button onClick={handleLogoUpload} className='bg-green-600 hover:bg-green-700 text-white mb-2'>
                          <Upload className='w-4 h-4 mr-2' />
                          Tải lên Logo
                        </Button>
                        <p className='text-sm text-gray-500'>Khuyến nghị: 200x200px, định dạng PNG hoặc JPG</p>
                      </>
                    ) : (
                      <p className='text-sm text-gray-500'>Logo cửa hàng hiện tại</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Store Cover Image Section */}
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>Ảnh bìa cửa hàng</h3>
                {isEditMode ? (
                  <div className='border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors'>
                    <div className='flex flex-col items-center'>
                      <ImageIcon className='w-16 h-16 text-gray-400 mb-4' />
                      <Button onClick={handleCoverUpload} className='bg-green-600 hover:bg-green-700 text-white mb-2'>
                        <Upload className='w-4 h-4 mr-2' />
                        Tải lên ảnh bìa
                      </Button>
                      <p className='text-sm text-gray-500'>Khuyến nghị: 1200x400px, định dạng PNG hoặc JPG</p>
                    </div>
                  </div>
                ) : (
                  <div className='border border-gray-200 rounded-lg overflow-hidden'>
                    {storeData.coverImage ? (
                      <img src={storeData.coverImage} alt='Store Cover' className='w-full h-48 object-cover' />
                    ) : (
                      <div className='h-48 bg-gray-100 flex items-center justify-center'>
                        <ImageIcon className='w-16 h-16 text-gray-400' />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Store Information Fields */}
              <div className='space-y-6'>
                {/* Store Name */}
                <div>
                  <Label htmlFor='storeName' className='text-sm font-medium text-gray-700 mb-2 block'>
                    Tên cửa hàng
                  </Label>
                  {isEditMode ? (
                    <Input
                      id='storeName'
                      placeholder='Nhập tên cửa hàng'
                      value={storeData.storeName}
                      onChange={(e) => handleInputChange('storeName', e.target.value)}
                      className='w-full'
                    />
                  ) : (
                    <div className='p-3 bg-gray-50 rounded-md border'>
                      <p className='text-gray-900'>{storeData.storeName}</p>
                    </div>
                  )}
                </div>

                {/* Contact Phone */}
                <div>
                  <Label htmlFor='phone' className='text-sm font-medium text-gray-700 mb-2 block'>
                    Số điện thoại liên hệ
                  </Label>
                  {isEditMode ? (
                    <Input
                      id='phone'
                      placeholder='Nhập số điện thoại'
                      value={storeData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className='w-full'
                    />
                  ) : (
                    <div className='p-3 bg-gray-50 rounded-md border'>
                      <p className='text-gray-900'>{storeData.phone}</p>
                    </div>
                  )}
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor='address' className='text-sm font-medium text-gray-700 mb-2 block'>
                    Địa chỉ
                  </Label>
                  {isEditMode ? (
                    <Textarea
                      id='address'
                      placeholder='Nhập địa chỉ chi tiết'
                      value={storeData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className='w-full min-h-[100px]'
                    />
                  ) : (
                    <div className='p-3 bg-gray-50 rounded-md border min-h-[100px]'>
                      <p className='text-gray-900 whitespace-pre-wrap'>{storeData.address}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'legal' && (
            <div className='space-y-8'>
              {/* Business Information Section */}
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>Thông tin doanh nghiệp</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {/* Business License */}
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-2 block'>Giấy phép kinh doanh</Label>
                    {isEditMode ? (
                      <div className='space-y-2'>
                        <Input
                          placeholder='Nhập số giấy phép kinh doanh'
                          value={storeData.businessLicense}
                          onChange={(e) => handleInputChange('businessLicense', e.target.value)}
                          className='w-full'
                        />
                        <Button
                          onClick={() => handleDocumentUpload('businessLicense')}
                          className='bg-green-600 hover:bg-green-700 text-white text-sm'
                        >
                          <Upload className='w-4 h-4 mr-2' />
                          Tải lên giấy phép
                        </Button>
                      </div>
                    ) : (
                      <div className='p-3 bg-gray-50 rounded-md border'>
                        <p className='text-gray-900'>{storeData.businessLicense}</p>
                      </div>
                    )}
                  </div>

                  {/* Tax Code */}
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-2 block'>Mã số thuế</Label>
                    {isEditMode ? (
                      <Input
                        placeholder='Nhập mã số thuế'
                        value={storeData.taxCode}
                        onChange={(e) => handleInputChange('taxCode', e.target.value)}
                        className='w-full'
                      />
                    ) : (
                      <div className='p-3 bg-gray-50 rounded-md border'>
                        <p className='text-gray-900'>{storeData.taxCode}</p>
                      </div>
                    )}
                  </div>

                  {/* Business Registration Date */}
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-2 block'>Ngày đăng ký kinh doanh</Label>
                    {isEditMode ? (
                      <Input
                        placeholder='DD/MM/YYYY'
                        value={storeData.businessRegistrationDate}
                        onChange={(e) => handleInputChange('businessRegistrationDate', e.target.value)}
                        className='w-full'
                      />
                    ) : (
                      <div className='p-3 bg-gray-50 rounded-md border'>
                        <p className='text-gray-900'>{storeData.businessRegistrationDate}</p>
                      </div>
                    )}
                  </div>

                  {/* Business Type */}
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-2 block'>Loại hình doanh nghiệp</Label>
                    {isEditMode ? (
                      <Input
                        placeholder='Nhập loại hình doanh nghiệp'
                        value={storeData.businessType}
                        onChange={(e) => handleInputChange('businessType', e.target.value)}
                        className='w-full'
                      />
                    ) : (
                      <div className='p-3 bg-gray-50 rounded-md border'>
                        <p className='text-gray-900'>{storeData.businessType}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Representative Information Section */}
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>Thông tin người đại diện</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {/* Representative Name */}
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-2 block'>Họ và tên người đại diện</Label>
                    {isEditMode ? (
                      <Input
                        placeholder='Nhập họ và tên'
                        value={storeData.representativeName}
                        onChange={(e) => handleInputChange('representativeName', e.target.value)}
                        className='w-full'
                      />
                    ) : (
                      <div className='p-3 bg-gray-50 rounded-md border'>
                        <p className='text-gray-900'>{storeData.representativeName}</p>
                      </div>
                    )}
                  </div>

                  {/* Representative ID */}
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-2 block'>Số CMND/CCCD</Label>
                    {isEditMode ? (
                      <div className='space-y-2'>
                        <Input
                          placeholder='Nhập số CMND/CCCD'
                          value={storeData.representativeId}
                          onChange={(e) => handleInputChange('representativeId', e.target.value)}
                          className='w-full'
                        />
                        <Button
                          onClick={() => handleDocumentUpload('representativeId')}
                          className='bg-green-600 hover:bg-green-700 text-white text-sm'
                        >
                          <Upload className='w-4 h-4 mr-2' />
                          Tải lên CMND/CCCD
                        </Button>
                      </div>
                    ) : (
                      <div className='p-3 bg-gray-50 rounded-md border'>
                        <p className='text-gray-900'>{storeData.representativeId}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Certifications Section */}
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>Chứng nhận chất lượng</h3>
                <div className='space-y-4'>
                  {storeData.certifications.map((cert) => (
                    <div key={cert.id} className='border border-gray-200 rounded-lg p-4'>
                      <div className='flex justify-between items-start mb-3'>
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
                            <FileText className='w-5 h-5 text-green-600' />
                          </div>
                          <div>
                            <h4 className='font-medium text-gray-900'>{cert.name}</h4>
                            <p className='text-sm text-gray-600'>Số: {cert.number}</p>
                          </div>
                        </div>
                        <div className='flex gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleViewDocument(cert.documentUrl)}
                            className='border-gray-300 text-gray-700 hover:bg-gray-50'
                          >
                            <Eye className='w-4 h-4 mr-1' />
                            Xem
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleDownloadDocument(cert.documentUrl, `${cert.name}.pdf`)}
                            className='border-gray-300 text-gray-700 hover:bg-gray-50'
                          >
                            <Download className='w-4 h-4 mr-1' />
                            Tải
                          </Button>
                        </div>
                      </div>
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                        <div className='flex items-center gap-2'>
                          <Calendar className='w-4 h-4 text-gray-400' />
                          <span className='text-gray-600'>Cấp ngày:</span>
                          <span className='text-gray-900'>{cert.issuedDate}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Calendar className='w-4 h-4 text-gray-400' />
                          <span className='text-gray-600'>Hết hạn:</span>
                          <span className='text-gray-900'>{cert.expiryDate}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Building className='w-4 h-4 text-gray-400' />
                          <span className='text-gray-600'>Cơ quan cấp:</span>
                          <span className='text-gray-900'>{cert.issuingAuthority}</span>
                        </div>
                      </div>
                      {isEditMode && (
                        <div className='mt-3 pt-3 border-t border-gray-200'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleDocumentUpload(`certification-${cert.id}`)}
                            className='border-green-300 text-green-700 hover:bg-green-50'
                          >
                            <Upload className='w-4 h-4 mr-2' />
                            Cập nhật chứng nhận
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {isEditMode && (
                    <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                      <Button
                        onClick={() => handleDocumentUpload('new-certification')}
                        className='bg-green-600 hover:bg-green-700 text-white'
                      >
                        <Upload className='w-4 h-4 mr-2' />
                        Thêm chứng nhận mới
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isEditMode && (
            <div className='flex justify-end gap-4 pt-8 border-t border-gray-200 mt-8'>
              <Button
                variant='outline'
                onClick={handleCancel}
                className='border-gray-300 text-gray-700 hover:bg-gray-50'
              >
                <X className='w-4 h-4 mr-2' />
                Hủy bỏ
              </Button>
              <Button onClick={handleSave} className='bg-green-600 hover:bg-green-700 text-white'>
                <Check className='w-4 h-4 mr-2' />
                Lưu thay đổi
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SetupStore
