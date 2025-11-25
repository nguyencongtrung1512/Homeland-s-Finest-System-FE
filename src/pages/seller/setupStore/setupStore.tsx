import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import {
  Upload,
  Image as ImageIcon,
  X,
  Edit3,
  Check,
  FileText,
  Trash2,
  MapPin,
  Clock4,
  ShieldCheck,
  UserRound
} from 'lucide-react'
import { storeApi, type StoreResponse } from '../../../apis/store.api'
import { storeStoryApi } from '../../../apis/storeStory.api'
import { Stream } from '@cloudflare/stream-react'
import ThreeDCarousel from '../../../components/ui/3d-caroseu'
import type { StoreStory } from '../../../types/storeStoryType'
import { useAuth } from '../../../contexts/auth.context'
import { toast } from 'react-toastify'

function SetupStore() {
  const { user } = useAuth()
  const [isEditMode, setIsEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [storeData, setStoreData] = useState<StoreResponse | null>(null)
  const [storeStory, setStoreStory] = useState<StoreStory | null>(null)
  const [storyLoading, setStoryLoading] = useState(false)

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
        setOriginalData(response.data)
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

  // Fetch store story
  const fetchStoreStory = useCallback(async () => {
    if (!storeData?.id) return

    try {
      setStoryLoading(true)
      const response = await storeStoryApi.getByStore(storeData.id)

      // Handle different response structures
      // Response can be: { data: StoreStory } or { data: StoreStory[] } or { status, message, data: StoreStory }
      let storyData = null

      if (response.status === 200 && response.data) {
        // If response has status field (like in infoStore.md)
        storyData = response.data.data || response.data
      } else if (response.data) {
        // Direct response.data
        storyData = response.data
      }

      // Handle array or single object
      if (Array.isArray(storyData) && storyData.length > 0) {
        // Get the first story (or latest)
        setStoreStory(storyData[0])
      } else if (storyData && typeof storyData === 'object' && storyData.id) {
        // Single story object
        setStoreStory(storyData)
      } else {
        setStoreStory(null)
      }
    } catch (error) {
      console.error('Error fetching store story:', error)
      setStoreStory(null)
    } finally {
      setStoryLoading(false)
    }
  }, [storeData?.id])

  useEffect(() => {
    if (storeData?.id) {
      fetchStoreStory()
    }
  }, [storeData?.id, fetchStoreStory])

  // Initialize existing vendor application URLs when store data is loaded
  useEffect(() => {
    if (storeData?.vendorApplicationImageUrl && Array.isArray(storeData.vendorApplicationImageUrl)) {
      setExistingVendorAppUrls(storeData.vendorApplicationImageUrl)
    } else {
      setExistingVendorAppUrls([])
    }
  }, [storeData])

  const [originalData, setOriginalData] = useState<StoreResponse | null>(null)

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Chưa có thông tin'
    const parsedDate = new Date(value)

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return value
  }

  const fullAddress = storeData
    ? [storeData.address, storeData.ward, storeData.district, storeData.province].filter(Boolean).join(', ')
    : 'Chưa có địa chỉ cụ thể'

  const statusDisplay = (() => {
    switch (storeData?.status) {
      case 'Approved':
        return { label: 'Đã duyệt', classes: 'bg-green-100 text-green-800 border border-green-200' }
      case 'Pending':
        return { label: 'Đang chờ duyệt', classes: 'bg-yellow-100 text-yellow-800 border border-yellow-200' }
      case 'Rejected':
        return { label: 'Bị từ chối', classes: 'bg-red-100 text-red-800 border border-red-200' }
      case 'Active':
        return { label: 'Đang hoạt động', classes: 'bg-emerald-100 text-emerald-800 border border-emerald-200' }
      default:
        return {
          label: storeData?.status || 'Chưa có trạng thái',
          classes: 'bg-gray-100 text-gray-700 border border-gray-200'
        }
    }
  })()

  const totalProducts = Array.isArray(storeData?.products) ? storeData!.products.length : 0
  const vendorImageCount = existingVendorAppUrls.length + vendorAppFiles.length
  const sellerFullName = storeData?.sellerInfo
    ? [storeData.sellerInfo.userInfo?.lastName, storeData.sellerInfo.userInfo?.firstName].filter(Boolean).join(' ')
    : ''

  const quickStats = [
    { label: 'Trạng thái', value: statusDisplay.label, icon: ShieldCheck, accent: 'bg-emerald-50 text-emerald-700' },
    { label: 'Sản phẩm nổi bật', value: totalProducts, icon: FileText, accent: 'bg-indigo-50 text-indigo-700' },
    { label: 'Ảnh minh chứng', value: vendorImageCount, icon: Upload, accent: 'bg-pink-50 text-pink-700' },
    {
      label: 'Ngày đăng ký',
      value: formatDateTime(storeData?.submittedDate),
      icon: Clock4,
      accent: 'bg-amber-50 text-amber-700'
    }
  ]

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
          setStoreData(response.data)
          setOriginalData(response.data)
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
    setStoreData(originalData)
    setLogoFile(null)
    setCoverFile(null)
    setVendorAppFiles([])
    if (logoFileRef.current) logoFileRef.current.value = ''
    if (coverFileRef.current) coverFileRef.current.value = ''
    if (vendorAppFileRef.current) vendorAppFileRef.current.value = ''
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
    <div className='min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 py-10 px-4'>
      {loading ? (
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto'></div>
            <p className='mt-4 text-gray-600'>Đang tải thông tin cửa hàng...</p>
          </div>
        </div>
      ) : !storeData ? (
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-center bg-white/90 rounded-2xl shadow-xl p-10 max-w-xl'>
            <h2 className='text-2xl font-semibold text-gray-800 mb-2'>Không tìm thấy thông tin cửa hàng</h2>
            <p className='text-gray-500 mb-6'>Vui lòng liên hệ quản trị viên để được hỗ trợ</p>
            <Button onClick={fetchStoreData} className='bg-green-600 hover:bg-green-700'>
              Thử lại
            </Button>
          </div>
        </div>
      ) : (
        <div className='max-w-6xl mx-auto space-y-8'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <p className='text-sm uppercase tracking-[0.2em] text-green-600 font-semibold'>Store Studio</p>
              <h1 className='mt-2 text-3xl md:text-4xl font-bold text-gray-900'>Thiết lập cửa hàng cao cấp</h1>
              <p className='text-gray-600 mt-2'>Tối ưu hồ sơ để tăng tỉ lệ duyệt và thu hút khách hàng hơn.</p>
            </div>
            {!isEditMode && (
              <Button
                onClick={handleEdit}
                className='bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 px-6 py-5 rounded-2xl text-base'
              >
                <Edit3 className='w-4 h-4 mr-2' />
                Chỉnh sửa thông tin
              </Button>
            )}
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4'>
            {quickStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className='rounded-2xl bg-white/80 border border-white/70 shadow-lg shadow-emerald-100/50 p-4 flex items-center gap-4'
                >
                  <div className={`p-3 rounded-xl ${stat.accent}`}>
                    <Icon className='w-5 h-5' />
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>{stat.label}</p>
                    <p className='text-lg font-semibold text-gray-900'>{stat.value}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <Card className='border-none shadow-2xl backdrop-blur-sm bg-white/95 rounded-3xl'>
            <CardContent className='p-8 space-y-10'>
              <section className='grid gap-8 lg:grid-cols-[220px,1fr] items-center'>
                <div className='relative flex justify-center'>
                  <div className='w-40 h-40 rounded-3xl bg-gradient-to-br from-emerald-100 to-white flex items-center justify-center shadow-inner ring-1 ring-emerald-100 overflow-hidden'>
                    {storeData.logoUrl ? (
                      <img src={storeData.logoUrl} alt='Store Logo' className='w-full h-full object-cover' />
                    ) : (
                      <ImageIcon className='w-12 h-12 text-emerald-400' />
                    )}
                  </div>
                  {!isEditMode && (
                    <div
                      className={`${statusDisplay.classes} absolute -bottom-4 text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap`}
                    >
                      {statusDisplay.label}
                    </div>
                  )}
                </div>
                <div className='space-y-4'>
                  <div className='flex items-center gap-3'>
                    <div className='p-3 rounded-xl bg-emerald-50 text-emerald-600'>
                      <ShieldCheck className='w-5 h-5' />
                    </div>
                    <div>
                      <p className='text-sm text-gray-500'>Điểm nhận diện</p>
                      <p className='text-lg font-semibold text-gray-900'>Logo thương hiệu cửa hàng</p>
                    </div>
                  </div>
                  {isEditMode ? (
                    <>
                      <Button
                        onClick={handleLogoUpload}
                        className='bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md'
                      >
                        <Upload className='w-4 h-4 mr-2' />
                        {logoFile ? 'Thay đổi Logo' : 'Tải lên Logo'}
                      </Button>
                      {logoFile && (
                        <div className='mb-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl'>
                          <p className='text-sm text-emerald-700'>File đã chọn: {logoFile.name}</p>
                        </div>
                      )}
                      <p className='text-sm text-gray-500'>Khuyến nghị: 200x200px, PNG/JPG, tối đa 5MB.</p>
                      <input
                        ref={logoFileRef}
                        type='file'
                        accept='image/*'
                        onChange={handleLogoFileChange}
                        className='hidden'
                      />
                    </>
                  ) : (
                    <p className='text-sm text-gray-500'>
                      Logo giúp cửa hàng của bạn nổi bật hơn trong mắt khách hàng và đội ngũ kiểm duyệt.
                    </p>
                  )}
                </div>
              </section>

              <section>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-gray-900'>Ảnh bìa cửa hàng</h3>
                  {!storeData.coverImageUrl && !isEditMode && (
                    <span className='text-sm text-gray-500'>Cập nhật để tạo ấn tượng chuyên nghiệp hơn.</span>
                  )}
                </div>
                {isEditMode ? (
                  <div className='border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center hover:border-emerald-300 transition-all bg-gray-50'>
                    <div className='flex flex-col items-center gap-4'>
                      <ImageIcon className='w-16 h-16 text-gray-300' />
                      <Button
                        onClick={handleCoverUpload}
                        className='bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 py-5'
                      >
                        <Upload className='w-4 h-4 mr-2' />
                        {coverFile ? 'Thay đổi ảnh bìa' : 'Tải lên ảnh bìa'}
                      </Button>
                      {coverFile && (
                        <div className='p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700'>
                          File đã chọn: {coverFile.name}
                        </div>
                      )}
                      <p className='text-sm text-gray-500'>Khuyến nghị: 1200x400px, PNG/JPG, tối đa 5MB.</p>
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
                  <div className='rounded-3xl border border-gray-100 overflow-hidden shadow-inner bg-gradient-to-r from-emerald-50 to-white'>
                    {storeData.coverImageUrl ? (
                      <img src={storeData.coverImageUrl} alt='Store Cover' className='w-full h-60 object-cover' />
                    ) : (
                      <div className='h-60 flex items-center justify-center text-gray-400 gap-3'>
                        <ImageIcon className='w-12 h-12' />
                        <p>Chưa có ảnh bìa</p>
                      </div>
                    )}
                  </div>
                )}
              </section>

              <section className='grid gap-10 lg:grid-cols-2'>
                <div className='space-y-6'>
                  <div>
                    <Label htmlFor='storeName' className='text-sm font-medium text-gray-600 mb-2 block'>
                      Tên cửa hàng
                    </Label>
                    {isEditMode ? (
                      <Input
                        id='storeName'
                        placeholder='Nhập tên cửa hàng'
                        value={storeData.storeName || ''}
                        onChange={(e) => handleInputChange('storeName', e.target.value)}
                        className='w-full rounded-2xl border-gray-200 focus:border-green-500 focus:ring-green-200'
                      />
                    ) : (
                      <div className='p-4 bg-gray-50 rounded-2xl border border-gray-100'>
                        <p className='text-lg text-gray-900'>{storeData.storeName || 'Chưa có tên cửa hàng'}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor='description' className='text-sm font-medium text-gray-600 mb-2 block'>
                      Mô tả cửa hàng
                    </Label>
                    {isEditMode ? (
                      <Textarea
                        id='description'
                        placeholder='Nhập mô tả về cửa hàng của bạn'
                        value={storeData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className='w-full min-h-[140px] rounded-2xl border-gray-200 focus:border-green-500 focus:ring-green-200'
                      />
                    ) : (
                      <div className='p-4 bg-gray-50 rounded-2xl border border-gray-100 min-h-[140px]'>
                        <p className='text-gray-900 whitespace-pre-wrap'>
                          {storeData.description || 'Chưa có mô tả cửa hàng'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className='space-y-6'>
                  <div>
                    <Label htmlFor='address' className='text-sm font-medium text-gray-600 mb-2 block'>
                      Địa chỉ
                    </Label>
                    {isEditMode ? (
                      <Textarea
                        id='address'
                        placeholder='Nhập địa chỉ chi tiết'
                        value={storeData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className='w-full min-h-[120px] rounded-2xl border-gray-200 focus:border-green-500 focus:ring-green-200'
                      />
                    ) : (
                      <div className='p-4 bg-white rounded-2xl border border-gray-100 shadow-sm'>
                        <div className='flex items-start gap-4'>
                          <div className='p-3 rounded-xl bg-green-50 text-green-600'>
                            <MapPin className='w-5 h-5' />
                          </div>
                          <div>
                            <p className='text-xs uppercase tracking-widest text-gray-500 mb-1'>Địa chỉ hiện tại</p>
                            <p className='text-gray-900'>{fullAddress}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    {[
                      { label: 'Tỉnh/Thành', value: storeData.province },
                      { label: 'Quận/Huyện', value: storeData.district },
                      { label: 'Phường/Xã', value: storeData.ward },
                      { label: 'Mã khu vực', value: storeData.wardId }
                    ].map((item) => (
                      <div key={item.label} className='p-4 bg-gray-50 rounded-2xl border border-gray-100'>
                        <p className='text-xs text-gray-500 uppercase tracking-wide'>{item.label}</p>
                        <p className='text-sm font-semibold text-gray-900 mt-1'>{item.value || '---'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className='grid gap-4 md:grid-cols-3'>
                {[
                  { label: 'Ngày đăng ký', value: formatDateTime(storeData.submittedDate) },
                  { label: 'Ngày quyết định', value: formatDateTime(storeData.decisionDate) },
                  { label: 'Cập nhật gần nhất', value: formatDateTime(storeData.updatedAt) }
                ].map((item) => (
                  <div key={item.label} className='rounded-2xl border border-gray-100 bg-gray-50 p-4'>
                    <p className='text-xs uppercase tracking-widest text-gray-500'>{item.label}</p>
                    <p className='text-base font-semibold text-gray-900 mt-2'>{item.value}</p>
                  </div>
                ))}
              </section>

              {storeData.sellerInfo && (
                <section className='rounded-3xl border border-gray-100 bg-white shadow-inner p-6 space-y-4'>
                  <div className='flex items-center gap-3'>
                    <div className='p-3 rounded-xl bg-slate-100 text-slate-700'>
                      <UserRound className='w-5 h-5' />
                    </div>
                    <div>
                      <p className='text-sm text-gray-500'>Thông tin người bán</p>
                      <p className='text-lg font-semibold text-gray-900'>{sellerFullName || 'Người bán'}</p>
                    </div>
                  </div>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <div>
                      <p className='text-xs text-gray-500 uppercase'>Doanh nghiệp</p>
                      <p className='text-sm font-medium text-gray-900 mt-1'>
                        {storeData.sellerInfo.businessName || '---'}
                      </p>
                    </div>
                    <div>
                      <p className='text-xs text-gray-500 uppercase'>Số điện thoại</p>
                      <p className='text-sm font-medium text-gray-900 mt-1'>
                        {storeData.sellerInfo.userInfo?.phoneNumber || '---'}
                      </p>
                    </div>
                    <div>
                      <p className='text-xs text-gray-500 uppercase'>Email</p>
                      <p className='text-sm font-medium text-gray-900 mt-1'>
                        {storeData.sellerInfo.userInfo?.email || '---'}
                      </p>
                    </div>
                    <div>
                      <p className='text-xs text-gray-500 uppercase'>Mã số thuế</p>
                      <p className='text-sm font-medium text-gray-900 mt-1'>{storeData.sellerInfo.taxCode || '---'}</p>
                    </div>
                    <div>
                      <p className='text-xs text-gray-500 uppercase'>Giấy phép</p>
                      <p className='text-sm font-medium text-gray-900 mt-1'>
                        {storeData.sellerInfo.businessLicense || '---'}
                      </p>
                    </div>
                    <div>
                      <p className='text-xs text-gray-500 uppercase'>Trạng thái</p>
                      <p className='text-sm font-medium text-gray-900 mt-1'>{storeData.sellerInfo.sellerStatus}</p>
                    </div>
                  </div>
                </section>
              )}

              <section>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-gray-900'>Hình ảnh đơn đăng ký</h3>
                  {!isEditMode && (
                    <span className='text-sm text-gray-500'>Cung cấp hình ảnh rõ nét để tăng độ tin cậy.</span>
                  )}
                </div>
                <div className='space-y-5'>
                  {existingVendorAppUrls.length > 0 && (
                    <div className='space-y-3'>
                      <h4 className='font-medium text-gray-900'>Hình ảnh đã gửi</h4>
                      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {existingVendorAppUrls.map((url, index) => (
                          <div
                            key={url}
                            className='relative group overflow-hidden rounded-2xl border border-gray-100 shadow-md'
                          >
                            <img
                              src={url}
                              alt={`Vendor Application ${index + 1}`}
                              className='w-full h-40 object-cover'
                            />
                            {isEditMode && (
                              <button
                                onClick={() => removeExistingVendorAppUrl(index)}
                                className='absolute top-3 right-3 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow'
                              >
                                <X className='w-4 h-4' />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {vendorAppFiles.length > 0 && (
                    <div className='space-y-3'>
                      <h4 className='font-medium text-gray-900'>Hình ảnh mới sẽ tải lên</h4>
                      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {vendorAppFiles.map((file, index) => (
                          <div
                            key={file.name}
                            className='relative group overflow-hidden rounded-2xl border border-gray-100 shadow-md'
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`New file ${index + 1}`}
                              className='w-full h-40 object-cover'
                            />
                            <button
                              onClick={() => removeVendorAppFile(index)}
                              className='absolute top-3 right-3 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow'
                            >
                              <Trash2 className='w-4 h-4' />
                            </button>
                            <div className='absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-3 py-2'>
                              {file.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isEditMode && (
                    <div className='border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center bg-gray-50'>
                      <Button
                        onClick={handleVendorAppUpload}
                        className='bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 py-5'
                      >
                        <Upload className='w-4 h-4 mr-2' />
                        Tải lên hình ảnh đơn đăng ký
                      </Button>
                      <p className='text-sm text-gray-500 mt-2'>Định dạng PNG/JPG, tối đa 5MB mỗi file.</p>
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

                  {existingVendorAppUrls.length === 0 && vendorAppFiles.length === 0 && !isEditMode && (
                    <div className='text-center py-10 rounded-2xl border border-dashed border-gray-200 bg-white'>
                      <FileText className='w-12 h-12 text-gray-300 mx-auto mb-4' />
                      <p className='text-gray-500'>Chưa có hình ảnh đơn đăng ký nào</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Store Story Section */}
              <section>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-gray-900'>Câu chuyện cửa hàng</h3>
                </div>
                {storyLoading ? (
                  <div className='text-center py-10'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto'></div>
                    <p className='mt-4 text-gray-600'>Đang tải câu chuyện...</p>
                  </div>
                ) : storeStory ? (
                  <div className='space-y-6'>
                    <div>
                      <h4 className='text-xl font-semibold text-gray-900 mb-3'>{storeStory.title}</h4>
                    </div>

                    {/* Render contents in order */}
                    {storeStory.contents
                      .sort((a, b) => a.order - b.order)
                      .map((content) => {
                        // Helper function to extract Cloudflare Stream video ID
                        const extractVideoId = (url: string): string | undefined => {
                          try {
                            const match = url.match(/cloudflarestream\.com\/([a-f0-9]+)/i)
                            return match ? match[1] : undefined
                          } catch {
                            return undefined
                          }
                        }

                        const contentType = content.contentType?.toLowerCase() || ''

                        // Text content
                        if (contentType === 'text') {
                          return (
                            <div key={content.id} className='p-4 bg-gray-50 rounded-2xl border border-gray-100'>
                              <p className='text-gray-900 whitespace-pre-wrap leading-relaxed'>{content.contentData}</p>
                            </div>
                          )
                        }

                        // Image content
                        if (contentType === 'image' && content.imageUrls && content.imageUrls.length > 0) {
                          return (
                            <div key={content.id} className='space-y-3'>
                              {content.contentData && (
                                <p className='text-gray-700 whitespace-pre-wrap'>{content.contentData}</p>
                              )}
                              {content.imageUrls.length === 1 ? (
                                <div className='flex justify-center'>
                                  <img
                                    src={content.imageUrls[0]}
                                    alt='Story image'
                                    className='max-w-full h-auto rounded-2xl shadow-lg'
                                  />
                                </div>
                              ) : (
                                <div className='w-full h-[600px]'>
                                  <ThreeDCarousel images={content.imageUrls} cardW={240} cardH={320} radius={300} />
                                </div>
                              )}
                            </div>
                          )
                        }

                        // Video content
                        if (contentType === 'video') {
                          const videoId =
                            extractVideoId(content.videoPlayBackUrl || '') ||
                            extractVideoId(content.videoPreviewUrl || '') ||
                            extractVideoId(content.videoFallBackUrl || '')

                          const playbackUrls = content.videoPlayBackUrl
                            ? content.videoPlayBackUrl.split(',').map((url) => url.trim())
                            : []
                          const hlsUrl = playbackUrls.find((url) => url.includes('.m3u8'))
                          const dashUrl = playbackUrls.find((url) => url.includes('.mpd'))

                          return (
                            <div key={content.id} className='space-y-3'>
                              {content.contentData && (
                                <p className='text-gray-700 whitespace-pre-wrap'>{content.contentData}</p>
                              )}
                              <div className='flex justify-center'>
                                {videoId ? (
                                  <div className='w-full max-w-2xl rounded-lg overflow-hidden'>
                                    <Stream src={videoId} controls responsive className='w-full' preload='metadata' />
                                  </div>
                                ) : (
                                  <video controls className='w-full max-w-2xl rounded-lg' preload='metadata' playsInline>
                                    {hlsUrl && <source src={hlsUrl} type='application/vnd.apple.mpegurl' />}
                                    {dashUrl && <source src={dashUrl} type='application/dash+xml' />}
                                    {content.videoPreviewUrl && (
                                      <source src={content.videoPreviewUrl} type='video/mp4' />
                                    )}
                                    {content.videoFallBackUrl && (
                                      <source src={content.videoFallBackUrl} type='video/mp4' />
                                    )}
                                    Trình duyệt của bạn không hỗ trợ video.
                                  </video>
                                )}
                              </div>
                            </div>
                          )
                        }

                        return null
                      })}
                  </div>
                ) : (
                  <div className='text-center py-10 rounded-2xl border border-dashed border-gray-200 bg-white'>
                    <FileText className='w-12 h-12 text-gray-300 mx-auto mb-4' />
                    <p className='text-gray-500'>Chưa có câu chuyện cửa hàng</p>
                  </div>
                )}
              </section>

              {isEditMode && (
                <div className='flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-100'>
                  <Button
                    variant='outline'
                    onClick={handleCancel}
                    className='border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl'
                  >
                    <X className='w-4 h-4 mr-2' />
                    Hủy bỏ
                  </Button>
                  <Button
                    onClick={handleSave}
                    className='bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-200'
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default SetupStore
