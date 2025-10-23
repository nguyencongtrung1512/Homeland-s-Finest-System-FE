import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { Upload, Image as ImageIcon, X, Edit3, Check, FileText, Trash2 } from 'lucide-react'
import { storeApi, type StoreResponse } from '../../../apis/store.api'
import { useAuth } from '../../../contexts/auth.context'
import { toast } from 'react-toastify'

function SetupStore() {
  const { user } = useAuth()
  const [isEditMode, setIsEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [storeData, setStoreData] = useState<StoreResponse | null>(null)

  // File upload refs
  const logoFileRef = useRef<HTMLInputElement>(null)
  const coverFileRef = useRef<HTMLInputElement>(null)
  const vendorAppFileRef = useRef<HTMLInputElement>(null)

  // File states
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [vendorAppFiles, setVendorAppFiles] = useState<File[]>([])
  const [existingVendorAppUrls, setExistingVendorAppUrls] = useState<string[]>([])

  // Fetch store data from API
  const fetchStoreData = useCallback(async () => {
    if (!user?.userId) return

    try {
      setLoading(true)
      const response = await storeApi.getStoreBySellerId(user.userId)

      if (response.status === 200 && response.data) {
        setStoreData(response.data)
      } else {
        toast.error('Không thể tải thông tin cửa hàng')
      }
    } catch (error) {
      console.error('Error fetching store data:', error)
      toast.error('Có lỗi xảy ra khi tải thông tin cửa hàng')
    } finally {
      setLoading(false)
    }
  }, [user?.userId])

  useEffect(() => {
    fetchStoreData()
  }, [fetchStoreData])

  // Initialize existing vendor application URLs when store data is loaded
  useEffect(() => {
    if (storeData?.vendorApplicationImageUrl) {
      setExistingVendorAppUrls(storeData.vendorApplicationImageUrl)
    }
  }, [storeData])

  const [originalData, setOriginalData] = useState<StoreResponse | null>(null)

  const handleInputChange = (field: string, value: string) => {
    if (!storeData) return

    setStoreData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [field]: value
      }
    })
  }

  const handleEdit = () => {
    setIsEditMode(true)
    setOriginalData(storeData)
  }

  const handleSave = async () => {
    if (!user?.userId || !storeData) return

    try {
      setSaving(true)

      // Create FormData for multipart/form-data submission
      const formData = new FormData()

      // Add basic store information
      formData.append('StoreName', storeData.storeName || '')
      formData.append('Address', storeData.address || '')
      formData.append('Province', storeData.province || '')
      formData.append('District', storeData.district || '')
      formData.append('Ward', storeData.ward || '')
      formData.append('ProvinceId', storeData.provinceId?.toString() || '')
      formData.append('DistrictId', storeData.districtId?.toString() || '')
      formData.append('WardId', storeData.wardId?.toString() || '')
      formData.append('Description', storeData.description || '')

      // Add existing URLs
      if (storeData.logoUrl) {
        formData.append('ExistingLogoUrl', storeData.logoUrl)
      }
      if (storeData.coverImageUrl) {
        formData.append('ExistingCoverImageUrl', storeData.coverImageUrl)
      }

      // Add existing vendor application image URLs
      existingVendorAppUrls.forEach((url) => {
        formData.append('ExistingVendorApplicationImageUrls', url)
      })

      // Add new files
      if (logoFile) {
        formData.append('NewLogoFile', logoFile)
      }
      if (coverFile) {
        formData.append('NewCoverImageFile', coverFile)
      }
      vendorAppFiles.forEach((file) => {
        formData.append('NewVendorApplicationImageFiles', file)
      })

      // Call API
      const response = await storeApi.updateStoreBySeller(user.userId, formData)

      if (response.status === 202) {
        toast.success('Cập nhật thông tin cửa hàng thành công')

        // Update local state with new data
        if (response.data) {
          setStoreData((prev) => (prev ? { ...prev, ...response.data } : response.data))
        }

        // Reset file states
        setLogoFile(null)
        setCoverFile(null)
        setVendorAppFiles([])

        // Reset file inputs
        if (logoFileRef.current) logoFileRef.current.value = ''
        if (coverFileRef.current) coverFileRef.current.value = ''
        if (vendorAppFileRef.current) vendorAppFileRef.current.value = ''

        setIsEditMode(false)
        setOriginalData(storeData)
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật thông tin cửa hàng')
      }
    } catch (error) {
      console.error('Error updating store:', error)
      toast.error('Có lỗi xảy ra khi cập nhật thông tin cửa hàng')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    console.log('Canceling changes')
    setStoreData(originalData)
    setIsEditMode(false)
  }

  const handleLogoUpload = () => {
    logoFileRef.current?.click()
  }

  const handleCoverUpload = () => {
    coverFileRef.current?.click()
  }

  const handleVendorAppUpload = () => {
    vendorAppFileRef.current?.click()
  }

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file hình ảnh')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB')
        return
      }

      setLogoFile(file)
    }
  }

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file hình ảnh')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB')
        return
      }

      setCoverFile(file)
    }
  }

  const handleVendorAppFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Validate files
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file hình ảnh')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB')
        return
      }
    }

    setVendorAppFiles((prev) => [...prev, ...files])
  }

  const removeVendorAppFile = (index: number) => {
    setVendorAppFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingVendorAppUrl = (index: number) => {
    setExistingVendorAppUrls((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Loading State */}
      {loading ? (
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto'></div>
            <p className='mt-4 text-gray-600'>Đang tải thông tin cửa hàng...</p>
          </div>
        </div>
      ) : !storeData ? (
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <h2 className='text-2xl font-semibold text-gray-700 mb-2'>Không tìm thấy thông tin cửa hàng</h2>
            <p className='text-gray-500 mb-6'>Vui lòng liên hệ quản trị viên để được hỗ trợ</p>
            <Button onClick={fetchStoreData} className='bg-green-600 hover:bg-green-700'>
              Thử lại
            </Button>
          </div>
        </div>
      ) : (
        <>
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

          {/* Main Content */}
          <Card className='max-w-4xl mx-auto'>
            <CardContent className='p-8'>
              <div className='space-y-8'>
                {/* Store Logo Section */}
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Logo cửa hàng</h3>
                  <div className='flex items-start gap-6'>
                    <div className='w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden'>
                      {storeData.logoUrl ? (
                        <img
                          src={storeData.logoUrl}
                          alt='Store Logo'
                          className='w-full h-full object-cover rounded-full'
                        />
                      ) : (
                        <ImageIcon className='w-8 h-8 text-gray-400' />
                      )}
                    </div>
                    <div className='flex-1'>
                      {isEditMode ? (
                        <>
                          <Button
                            onClick={handleLogoUpload}
                            className='bg-green-600 hover:bg-green-700 text-white mb-2'
                          >
                            <Upload className='w-4 h-4 mr-2' />
                            {logoFile ? 'Thay đổi Logo' : 'Tải lên Logo'}
                          </Button>
                          {logoFile && (
                            <div className='mb-2 p-2 bg-green-50 border border-green-200 rounded-md'>
                              <p className='text-sm text-green-700'>File đã chọn: {logoFile.name}</p>
                            </div>
                          )}
                          <p className='text-sm text-gray-500'>
                            Khuyến nghị: 200x200px, định dạng PNG hoặc JPG (tối đa 5MB)
                          </p>
                          <input
                            ref={logoFileRef}
                            type='file'
                            accept='image/*'
                            onChange={handleLogoFileChange}
                            className='hidden'
                          />
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
                          {coverFile ? 'Thay đổi ảnh bìa' : 'Tải lên ảnh bìa'}
                        </Button>
                        {coverFile && (
                          <div className='mb-2 p-2 bg-green-50 border border-green-200 rounded-md'>
                            <p className='text-sm text-green-700'>File đã chọn: {coverFile.name}</p>
                          </div>
                        )}
                        <p className='text-sm text-gray-500'>
                          Khuyến nghị: 1200x400px, định dạng PNG hoặc JPG (tối đa 5MB)
                        </p>
                        <input
                          ref={coverFileRef}
                          type='file'
                          accept='image/*'
                          onChange={handleCoverFileChange}
                          className='hidden'
                        />
                      </div>
                    </div>
                  ) : (
                    <div className='border border-gray-200 rounded-lg overflow-hidden'>
                      {storeData.coverImageUrl ? (
                        <img src={storeData.coverImageUrl} alt='Store Cover' className='w-full h-48 object-cover' />
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
                        value={storeData.storeName || ''}
                        onChange={(e) => handleInputChange('storeName', e.target.value)}
                        className='w-full'
                      />
                    ) : (
                      <div className='p-3 bg-gray-50 rounded-md border'>
                        <p className='text-gray-900'>{storeData.storeName || 'Chưa có tên cửa hàng'}</p>
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
                        value={`${storeData.address}, ${storeData.ward}, ${storeData.district}, ${storeData.province}`}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className='w-full min-h-[100px]'
                      />
                    ) : (
                      <div className='p-3 bg-gray-50 rounded-md border min-h-[100px]'>
                        <p className='text-gray-900 whitespace-pre-wrap'>
                          {`${storeData.address}, ${storeData.ward}, ${storeData.district}, ${storeData.province}`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Store Description */}
                  <div>
                    <Label htmlFor='description' className='text-sm font-medium text-gray-700 mb-2 block'>
                      Mô tả cửa hàng
                    </Label>
                    {isEditMode ? (
                      <Textarea
                        id='description'
                        placeholder='Nhập mô tả về cửa hàng của bạn'
                        value={storeData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className='w-full min-h-[120px]'
                      />
                    ) : (
                      <div className='p-3 bg-gray-50 rounded-md border min-h-[120px]'>
                        <p className='text-gray-900 whitespace-pre-wrap'>
                          {storeData.description || 'Chưa có mô tả cửa hàng'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Store Information */}
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-4'>Thông tin cửa hàng</h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      {/* Submitted Date */}
                      <div>
                        <Label className='text-sm font-medium text-gray-700 mb-2 block'>Ngày đăng ký</Label>
                        <div className='p-3 bg-gray-50 rounded-md border'>
                          <p className='text-gray-900'>
                            {storeData.submittedDate
                              ? new Date(storeData.submittedDate).toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                              : 'Chưa có thông tin'}
                          </p>
                        </div>
                      </div>

                      {/* Store Status */}
                      <div>
                        <Label className='text-sm font-medium text-gray-700 mb-2 block'>Trạng thái cửa hàng</Label>
                        <div className='p-3 bg-gray-50 rounded-md border'>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${storeData.status === 'Approved'
                              ? 'bg-green-100 text-green-800'
                              : storeData.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : storeData.status === 'Rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {storeData.status === 'Approved'
                              ? 'Đã duyệt'
                              : storeData.status === 'Pending'
                                ? 'Đang chờ duyệt'
                                : storeData.status === 'Rejected'
                                  ? 'Bị từ chối'
                                  : storeData.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vendor Application Images Section */}
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-4'>Hình ảnh đơn đăng ký</h3>
                    <div className='space-y-4'>
                      {/* Existing Vendor Application Images */}
                      {existingVendorAppUrls.length > 0 && (
                        <div className='space-y-3'>
                          <h4 className='font-medium text-gray-900'>Hình ảnh đơn đăng ký hiện tại</h4>
                          <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                            {existingVendorAppUrls.map((url, index) => (
                              <div key={index} className='relative group'>
                                <img
                                  src={url}
                                  alt={`Vendor Application ${index + 1}`}
                                  className='w-full h-32 object-cover rounded-lg border'
                                />
                                {isEditMode && (
                                  <button
                                    onClick={() => removeExistingVendorAppUrl(index)}
                                    className='absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                                  >
                                    <X className='w-3 h-3' />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* New Vendor Application Files */}
                      {vendorAppFiles.length > 0 && (
                        <div className='space-y-3'>
                          <h4 className='font-medium text-gray-900'>Hình ảnh mới sẽ tải lên</h4>
                          <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                            {vendorAppFiles.map((file, index) => (
                              <div key={index} className='relative group'>
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`New file ${index + 1}`}
                                  className='w-full h-32 object-cover rounded-lg border'
                                />
                                <button
                                  onClick={() => removeVendorAppFile(index)}
                                  className='absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                                >
                                  <Trash2 className='w-3 h-3' />
                                </button>
                                <div className='absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white text-xs p-1 rounded'>
                                  {file.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upload Button */}
                      {isEditMode && (
                        <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                          <Button
                            onClick={handleVendorAppUpload}
                            className='bg-green-600 hover:bg-green-700 text-white'
                          >
                            <Upload className='w-4 h-4 mr-2' />
                            Tải lên hình ảnh đơn đăng ký
                          </Button>
                          <p className='text-sm text-gray-500 mt-2'>Định dạng PNG hoặc JPG (tối đa 5MB mỗi file)</p>
                          <input
                            ref={vendorAppFileRef}
                            type='file'
                            accept='image/*'
                            multiple
                            onChange={handleVendorAppFileChange}
                            className='hidden'
                          />
                        </div>
                      )}

                      {/* Empty State */}
                      {existingVendorAppUrls.length === 0 && vendorAppFiles.length === 0 && !isEditMode && (
                        <div className='text-center py-8'>
                          <FileText className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                          <p className='text-gray-500 mb-4'>Chưa có hình ảnh đơn đăng ký nào</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

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
                    <Button
                      onClick={handleSave}
                      className='bg-green-600 hover:bg-green-700 text-white'
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Check className='w-4 h-4 mr-2' />
                          Lưu thay đổi
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default SetupStore
