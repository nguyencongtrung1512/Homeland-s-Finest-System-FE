import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../../../components/ui/dialog'
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
  UserRound,
  Eye,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import { storeApi, type StoreResponse } from '../../../apis/store.api'
import { sellerApi } from '../../../apis/seller.api'
import ImagePreviewModal from '../../../components/ui/image-preview-modal'
import { useAuth } from '../../../contexts/auth.context'
import { useStore } from '../../../contexts/store.context'
import Loading from '../../../components/Loading/loading'
import { toast } from '../../../utils/toast'

function SetupStore() {
  const { user } = useAuth()
  const { refreshStore } = useStore()
  const [isEditMode, setIsEditMode] = useState(false)
  const [isEditingCover, setIsEditingCover] = useState(false)
  const [isEditingLogo, setIsEditingLogo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingCover, setSavingCover] = useState(false)
  const [savingLogo, setSavingLogo] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [resubmitting, setResubmitting] = useState(false)
  const [showResubmitModal, setShowResubmitModal] = useState(false)
  const [storeData, setStoreData] = useState<StoreResponse | null>(null)
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0)

  // File upload refs
  const logoFileRef = useRef<HTMLInputElement>(null)
  const coverFileRef = useRef<HTMLInputElement>(null)
  const vendorAppFileRef = useRef<HTMLInputElement>(null)

  // File states
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [vendorAppFiles, setVendorAppFiles] = useState<File[]>([])
  const [existingVendorAppUrls, setExistingVendorAppUrls] = useState<string[]>([])
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)

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

  // Initialize existing   URLs when store data is loaded
  useEffect(() => {
    if (storeData?.vendorApplicationImageUrl && Array.isArray(storeData.vendorApplicationImageUrl)) {
      setExistingVendorAppUrls(storeData.vendorApplicationImageUrl)
    } else {
      setExistingVendorAppUrls([])
    }
  }, [storeData])

  // Create preview URLs for cover and logo files
  useEffect(() => {
    if (coverFile) {
      const url = URL.createObjectURL(coverFile)
      setCoverPreviewUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setCoverPreviewUrl(null)
    }
  }, [coverFile])

  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile)
      setLogoPreviewUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setLogoPreviewUrl(null)
    }
  }, [logoFile])

  const [originalData, setOriginalData] = useState<StoreResponse | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<{ fields: Array<{ name: string }> } | null>(null)
  const [pendingSaveAction, setPendingSaveAction] = useState<'save' | 'saveCover' | 'saveLogo' | null>(null)

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

  const getSellerStatusLabel = (status?: string | null): string => {
    if (!status) return 'Chưa có trạng thái'

    const statusMap: Record<string, string> = {
      Onboarding: 'Đang hoàn thiện hồ sơ',
      Active: 'Hoạt động',
      Inactive: 'Không hoạt động',
      Pending: 'Chờ duyệt',
      Suspended: 'Tạm dừng',
      Banned: 'Bị cấm',
      Approved: 'Đã duyệt',
      Rejected: 'Từ chối',
      Processing: 'Đang xử lý'
    }

    return statusMap[status] || status
  }

  const statusDisplay = (() => {
    const statusMap: Record<string, { label: string; classes: string }> = {
      Pending: { label: 'Đang xử lý', classes: 'bg-blue-100 text-blue-800 border border-blue-200' },
      Processing: { label: 'Đang xử lý', classes: 'bg-blue-100 text-blue-800 border border-blue-200' },
      ApprovedByStaff: { label: 'Đang xử lý', classes: 'bg-blue-100 text-blue-800 border border-blue-200' },
      RejectedByStaff: { label: 'Đang xử lý', classes: 'bg-blue-100 text-blue-800 border border-blue-200' },
      Approved: { label: 'Hoạt động', classes: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
      Rejected: { label: 'Từ chối', classes: 'bg-red-100 text-red-800 border border-red-200' }
    }

    if (!storeData?.status) {
      return { label: 'Chưa có trạng thái', classes: 'bg-gray-100 text-gray-700 border border-gray-200' }
    }

    return statusMap[storeData.status] || {
      label: storeData.status,
      classes: 'bg-gray-100 text-gray-700 border border-gray-200'
    }
  })()
  const sellerFullName = storeData?.sellerInfo
    ? [storeData.sellerInfo.userInfo?.lastName, storeData.sellerInfo.userInfo?.firstName].filter(Boolean).join(' ')
    : ''

  const quickStats = [
    { label: 'Trạng thái', value: statusDisplay.label, icon: ShieldCheck, accent: 'bg-emerald-50 text-emerald-700' },
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

  const handleEditCover = () => {
    setIsEditingCover(true)
    setCoverFile(null)
    if (coverFileRef.current) coverFileRef.current.value = ''
  }

  const handleEditLogo = () => {
    setIsEditingLogo(true)
    setLogoFile(null)
    if (logoFileRef.current) logoFileRef.current.value = ''
  }

  const handleCancelEditCover = () => {
    setIsEditingCover(false)
    setCoverFile(null)
    if (coverFileRef.current) coverFileRef.current.value = ''
  }

  const handleCancelEditLogo = () => {
    setIsEditingLogo(false)
    setLogoFile(null)
    if (logoFileRef.current) logoFileRef.current.value = ''
  }

  // Helper function to create base FormData
  const createBaseFormData = () => {
    if (!storeData) return null

    const formData = new FormData()

    // Add basic store information
    formData.append('StoreName', storeData.storeName || '')
    formData.append('Address', storeData.address || '')
    formData.append('Province', storeData.province || '')
    formData.append('District', storeData.district || '')
    formData.append('Ward', storeData.ward || '')
    if (storeData.provinceId !== null && storeData.provinceId !== undefined) {
      formData.append('ProvinceId', storeData.provinceId.toString())
    }
    if (storeData.districtId !== null && storeData.districtId !== undefined) {
      formData.append('DistrictId', storeData.districtId.toString())
    }
    if (storeData.wardId !== null && storeData.wardId !== undefined) {
      formData.append('WardId', storeData.wardId.toString())
    }
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

    return formData
  }

  // Execute save cover (actual API call)
  const executeSaveCover = async () => {
    if (!user?.userId || !storeData || !coverFile) return

    try {
      setSavingCover(true)

      const formData = createBaseFormData()
      if (!formData) return

      // Add new cover file
      formData.append('NewCoverImageFile', coverFile)

      // Call API
      const response = await storeApi.updateStoreBySeller(user.userId, formData)

      if (response.status === 202) {
        toast.success('Cập nhật ảnh bìa thành công')

        // Reset file state
        setCoverFile(null)
        if (coverFileRef.current) coverFileRef.current.value = ''
        setIsEditingCover(false)

        // Show loading and refresh data
        setRefreshing(true)
        try {
          await refreshStore()
          await fetchStoreData()
        } catch (error) {
          console.error('Error refreshing store data:', error)
        } finally {
          setRefreshing(false)
        }
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật ảnh bìa')
      }
    } catch (error) {
      console.error('Error updating cover image:', error)
      toast.error('Có lỗi xảy ra khi cập nhật ảnh bìa')
    } finally {
      setSavingCover(false)
    }
  }

  const handleSaveCover = async () => {
    if (!user?.userId || !storeData || !coverFile) return

    // Cover image changes do NOT require approval warning - save directly
    await executeSaveCover()
  }

  // Execute save logo (actual API call)
  const executeSaveLogo = async () => {
    if (!user?.userId || !storeData || !logoFile) return

    try {
      setSavingLogo(true)

      const formData = createBaseFormData()
      if (!formData) return

      // Add new logo file
      formData.append('NewLogoFile', logoFile)

      // Call API
      const response = await storeApi.updateStoreBySeller(user.userId, formData)

      if (response.status === 202) {
        toast.success('Cập nhật logo thành công')

        // Reset file state
        setLogoFile(null)
        if (logoFileRef.current) logoFileRef.current.value = ''
        setIsEditingLogo(false)

        // Show loading and refresh data
        setRefreshing(true)
        try {
          await refreshStore()
          await fetchStoreData()
        } catch (error) {
          console.error('Error refreshing store data:', error)
        } finally {
          setRefreshing(false)
        }
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật logo')
      }
    } catch (error) {
      console.error('Error updating logo:', error)
      toast.error('Có lỗi xảy ra khi cập nhật logo')
    } finally {
      setSavingLogo(false)
    }
  }

  const handleSaveLogo = async () => {
    if (!user?.userId || !storeData || !logoFile) return

    // Logo changes do NOT require approval warning - save directly
    await executeSaveLogo()
  }

  // Execute save (actual API call)
  const executeSave = async () => {
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
      if (storeData.provinceId !== null && storeData.provinceId !== undefined) {
        formData.append('ProvinceId', storeData.provinceId.toString())
      }
      if (storeData.districtId !== null && storeData.districtId !== undefined) {
        formData.append('DistrictId', storeData.districtId.toString())
      }
      if (storeData.wardId !== null && storeData.wardId !== undefined) {
        formData.append('WardId', storeData.wardId.toString())
      }
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

        // Reset file states
        setLogoFile(null)
        setCoverFile(null)
        setVendorAppFiles([])

        // Reset file inputs
        if (logoFileRef.current) logoFileRef.current.value = ''
        if (coverFileRef.current) coverFileRef.current.value = ''
        if (vendorAppFileRef.current) vendorAppFileRef.current.value = ''

        setIsEditMode(false)

        // Show loading and refresh data
        setRefreshing(true)
        try {
          // Refresh store context
          await refreshStore()
          // Refresh local store data
          await fetchStoreData()
        } catch (error) {
          console.error('Error refreshing store data:', error)
        } finally {
          setRefreshing(false)
        }
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

  const handleSave = async () => {
    if (!user?.userId || !storeData) return

    // Check for changes that require approval (description, name, address, etc.)
    // Note: Logo and cover image changes do NOT require approval warning
    const changeResult = getChangesRequiringApproval()

    // If there are changes requiring approval, show confirmation modal
    if (changeResult.fields.length > 0) {
      setPendingChanges(changeResult)
      setPendingSaveAction('save')
      setShowConfirmModal(true)
    } else {
      // Direct save for updates that don't require approval
      await executeSave()
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

  // Check for changes that require staff approval (description, name, address, vendor application images, etc.)
  // Note: Logo and cover image changes do NOT require approval warning
  const getChangesRequiringApproval = (): { fields: Array<{ name: string }> } => {
    if (!storeData || !originalData) {
      return { fields: [] }
    }

    const changedFields: Array<{ name: string }> = []

    // Store Name: check if store name has changed
    if (storeData.storeName !== originalData.storeName) {
      changedFields.push({ name: 'Tên cửa hàng' })
    }

    // Description: check if description has changed
    if (storeData.description !== originalData.description) {
      changedFields.push({ name: 'Mô tả cửa hàng' })
    }

    // Address: check if address has changed
    if (storeData.address !== originalData.address) {
      changedFields.push({ name: 'Địa chỉ' })
    }

    // Province: check if province has changed
    if (storeData.province !== originalData.province || storeData.provinceId !== originalData.provinceId) {
      changedFields.push({ name: 'Tỉnh/Thành phố' })
    }

    // District: check if district has changed
    if (storeData.district !== originalData.district || storeData.districtId !== originalData.districtId) {
      changedFields.push({ name: 'Quận/Huyện' })
    }

    // Ward: check if ward has changed
    if (storeData.ward !== originalData.ward || storeData.wardId !== originalData.wardId) {
      changedFields.push({ name: 'Phường/Xã' })
    }

    // Vendor Application Images: check if new files are added
    if (vendorAppFiles.length > 0) {
      changedFields.push({ name: 'Hình ảnh đơn đăng ký (thêm mới)' })
    }

    // Vendor Application Images: check if existing images are removed
    const originalVendorAppUrls = originalData.vendorApplicationImageUrl || []
    const currentUrlsSet = new Set(existingVendorAppUrls)

    // Check if any original URLs were removed
    const hasRemovedImages = originalVendorAppUrls.some((url) => !currentUrlsSet.has(url))
    if (hasRemovedImages) {
      changedFields.push({ name: 'Hình ảnh đơn đăng ký (xóa)' })
    }

    return { fields: changedFields }
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

  // Handle confirmation modal actions
  const handleConfirmSave = async () => {
    setShowConfirmModal(false)

    if (pendingSaveAction === 'save') {
      await executeSave()
    } else if (pendingSaveAction === 'saveCover') {
      await executeSaveCover()
    } else if (pendingSaveAction === 'saveLogo') {
      await executeSaveLogo()
    }

    setPendingChanges(null)
    setPendingSaveAction(null)
  }

  const handleCancelConfirm = () => {
    setShowConfirmModal(false)
    setPendingChanges(null)
    setPendingSaveAction(null)
  }

  // Handle resubmit application
  const handleResubmitApplication = async () => {
    if (!user?.userId) return

    try {
      setResubmitting(true)
      const response = await sellerApi.resubmitSellerApplication(user.userId)

      // axiosInstance interceptor returns response.data which is {status, message, data}
      if (response.status === 200 || response.status === 202) {
        toast.success(response.message || 'Đơn đăng ký đã được gửi lại thành công và đang chờ duyệt!')
        setShowResubmitModal(false)

        // Refresh store data
        setRefreshing(true)
        try {
          await refreshStore()
          await fetchStoreData()
        } catch (error) {
          console.error('Error refreshing store data:', error)
        } finally {
          setRefreshing(false)
        }
      } else {
        toast.error('Có lỗi xảy ra khi gửi lại đơn đăng ký')
      }
    } catch (error: unknown) {
      console.error('Error resubmitting application:', error)
      // axios interceptor returns error.response.data directly
      const errorMessage =
        (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : null) || 'Có lỗi xảy ra khi gửi lại đơn đăng ký'
      toast.error(errorMessage)
    } finally {
      setResubmitting(false)
    }
  }

  // Check if store can resubmit
  const canResubmit = () => {
    const resubmitStatuses = ['RejectedByStaff', 'Rejected']
    return storeData?.status && resubmitStatuses.includes(storeData.status)
  }

  return (
    <div className='min-h-screen  py-10 px-4'>
      {refreshing && (
        <Loading size='lg' text='Đang làm mới dữ liệu...' fullScreen={true} />
      )}
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
          {/* Hero Section with Cover Image and Logo */}
          <div className='relative'>
            {/* Cover Image */}
            <div className='relative rounded-3xl border border-gray-100 overflow-hidden shadow-xl bg-gradient-to-r from-emerald-50 to-white'>
              {storeData.coverImageUrl ? (
                <img src={storeData.coverImageUrl} alt='Ảnh bìa cửa hàng' className='w-full h-64 md:h-80 object-cover' />
              ) : (
                <div className='w-full h-64 md:h-80 flex items-center justify-center text-gray-400 gap-3 bg-gradient-to-br from-emerald-50 to-white'>
                  <ImageIcon className='w-16 h-16' />
                </div>
              )}
              {/* Edit Cover Button */}
              {!isEditingCover && (
                <div className='absolute top-4 right-4'>
                  <Button
                    onClick={handleEditCover}
                    size='sm'
                    className='bg-white/90 hover:bg-white text-gray-700 shadow-lg'
                  >
                    <Edit3 className='w-4 h-4 mr-2' />
                    Chỉnh sửa ảnh bìa
                  </Button>
                </div>
              )}
            </div>

            {/* Logo Avatar overlapping cover image */}
            <div className='flex flex-col md:flex-row items-end md:items-center gap-6 px-6 md:px-8 -mt-16 md:-mt-20 relative z-10'>
              {/* Logo */}
              <div className='relative'>
                <div className='w-32 h-32 md:w-40 md:h-40 rounded-full bg-white ring-4 ring-white shadow-2xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-100 to-white'>
                  {storeData.logoUrl ? (
                    <img src={storeData.logoUrl} alt='Logo cửa hàng' className='w-full h-full object-cover' />
                  ) : (
                    <ImageIcon className='w-16 h-16 text-emerald-400' />
                  )}
                </div>
                {/* Edit Logo Button */}
                {!isEditingLogo && (
                  <div className='absolute -bottom-2 right-0 transform -translate-x-1/2'>
                    <Button
                      onClick={handleEditLogo}
                      size='sm'
                      className='bg-white/90 hover:bg-white text-gray-700 shadow-lg whitespace-nowrap'
                    >
                      <Edit3 className='w-4 h-4 mr-2' />
                    </Button>
                  </div>
                )}
                {/* Status Badge */}
                {/* {!isEditMode && !isEditingLogo && (
                  <div
                    className={`${statusDisplay.classes} absolute -bottom-3 -right-3 text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap shadow-lg`}
                  >
                    {statusDisplay.label}
                  </div>
                )} */}
              </div>

              {/* Store Name */}
              <div className='flex-1 pb-4 md:pb-0 mt-6 md:mt-10'>
                <p className='text-sm uppercase tracking-[0.2em] text-green-600 font-semibold'>Store Studio</p>
                <h1 className='text-2xl md:text-4xl font-bold text-gray-900 mt-2'>
                  {storeData.storeName || 'Tên cửa hàng'}
                </h1>
              </div>
            </div>
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
            {/* Edit Button - Styled like quickStats cards */}
            {!isEditMode && (
              <div
                onClick={handleEdit}
                className='rounded-2xl bg-white/80 border border-white/70 shadow-lg shadow-emerald-100/50 p-4 flex items-center gap-4 cursor-pointer hover:shadow-xl hover:shadow-emerald-100/70 transition-all'
              >
                <div className='p-3 rounded-xl bg-green-50 text-green-700'>
                  <Edit3 className='w-5 h-5' />
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Thao tác</p>
                  <p className='text-lg font-semibold text-gray-900'>Chỉnh sửa thông tin</p>
                </div>
              </div>
            )}
          </div>

          {/* Cover Image Edit Dialog */}
          <Dialog open={isEditingCover} onOpenChange={(open) => !open && handleCancelEditCover()}>
            <DialogContent className='sm:max-w-[500px]'>
              <DialogHeader>
                <DialogTitle>Chỉnh sửa ảnh bìa cửa hàng</DialogTitle>
                <DialogDescription>Khuyến nghị: 1200x400px, PNG/JPG, tối đa 5MB.</DialogDescription>
              </DialogHeader>
              <div className='space-y-4 py-4'>
                {coverFile && coverPreviewUrl ? (
                  <div className='space-y-4'>
                    <div className='relative rounded-2xl overflow-hidden border-2 border-emerald-200 bg-gray-50'>
                      <img
                        src={coverPreviewUrl}
                        alt='Preview ảnh bìa'
                        className='w-full h-48 object-cover'
                      />
                      <div className='absolute top-2 right-2'>
                        <Button
                          onClick={handleCoverUpload}
                          size='sm'
                          className='bg-white/90 hover:bg-white text-gray-700 shadow-lg'
                        >
                          <Edit3 className='w-4 h-4 mr-2' />
                          Thay đổi
                        </Button>
                      </div>
                    </div>
                    <div className='p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 text-center'>
                      File đã chọn: {coverFile.name}
                    </div>
                    <input
                      ref={coverFileRef}
                      type='file'
                      accept='image/*'
                      onChange={handleCoverFileChange}
                      className='hidden'
                    />
                  </div>
                ) : (
                  <div className='border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-emerald-300 transition-all bg-gray-50'>
                    <div className='flex flex-col items-center gap-4'>
                      <ImageIcon className='w-16 h-16 text-gray-300' />
                      <Button
                        onClick={handleCoverUpload}
                        className='bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 py-5'
                      >
                        <Upload className='w-4 h-4 mr-2' />
                        Tải lên ảnh bìa
                      </Button>
                      <input
                        ref={coverFileRef}
                        type='file'
                        accept='image/*'
                        onChange={handleCoverFileChange}
                        className='hidden'
                      />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleCancelEditCover} variant='outline' disabled={savingCover}>
                  <X className='w-4 h-4 mr-2' />
                  Hủy
                </Button>
                <Button
                  onClick={handleSaveCover}
                  className='bg-green-600 hover:bg-green-700 text-white'
                  disabled={!coverFile || savingCover}
                >
                  {savingCover ? (
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
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Logo Edit Dialog */}
          <Dialog open={isEditingLogo} onOpenChange={(open) => !open && handleCancelEditLogo()}>
            <DialogContent className='sm:max-w-[500px]'>
              <DialogHeader>
                <DialogTitle>Chỉnh sửa logo cửa hàng</DialogTitle>
                <DialogDescription>Khuyến nghị: 200x200px, PNG/JPG, tối đa 5MB.</DialogDescription>
              </DialogHeader>
              <div className='space-y-4 py-4'>
                {logoFile && logoPreviewUrl ? (
                  <div className='space-y-4'>
                    <div className='relative rounded-2xl overflow-hidden border-2 border-emerald-200 bg-gray-50 flex justify-center items-center p-8'>
                      <div className='relative'>
                        <img
                          src={logoPreviewUrl}
                          alt='Preview logo'
                          className='w-48 h-48 object-cover rounded-full border-4 border-white shadow-lg'
                        />
                        <div className='absolute -bottom-2 left-1/2 transform -translate-x-1/2'>
                          <Button
                            onClick={handleLogoUpload}
                            size='sm'
                            className='bg-white/90 hover:bg-white text-gray-700 shadow-lg'
                          >
                            <Edit3 className='w-4 h-4 mr-2' />
                            Thay đổi
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className='p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 text-center'>
                      File đã chọn: {logoFile.name}
                    </div>
                    <input
                      ref={logoFileRef}
                      type='file'
                      accept='image/*'
                      onChange={handleLogoFileChange}
                      className='hidden'
                    />
                  </div>
                ) : (
                  <div className='border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-emerald-300 transition-all bg-gray-50'>
                    <div className='flex flex-col items-center gap-4'>
                      <ImageIcon className='w-16 h-16 text-gray-300' />
                      <Button
                        onClick={handleLogoUpload}
                        className='bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 py-5'
                      >
                        <Upload className='w-4 h-4 mr-2' />
                        Tải lên Logo
                      </Button>
                      <input
                        ref={logoFileRef}
                        type='file'
                        accept='image/*'
                        onChange={handleLogoFileChange}
                        className='hidden'
                      />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleCancelEditLogo} variant='outline' disabled={savingLogo}>
                  <X className='w-4 h-4 mr-2' />
                  Hủy
                </Button>
                <Button
                  onClick={handleSaveLogo}
                  className='bg-green-600 hover:bg-green-700 text-white'
                  disabled={!logoFile || savingLogo}
                >
                  {savingLogo ? (
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
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Confirmation Modal for Hot Updates */}
          <Dialog open={showConfirmModal} onOpenChange={(open) => !open && handleCancelConfirm()}>
            <DialogContent className='sm:max-w-[600px]'>
              <DialogHeader>
                <DialogTitle className='flex items-center gap-2 text-amber-700'>
                  <AlertCircle className='w-6 h-6 text-amber-600' />
                  Xác nhận cập nhật cửa hàng
                </DialogTitle>
                <DialogDescription>
                  Những thay đổi này sẽ yêu cầu duyệt lại bởi nhân viên
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4 py-4'>
                {/* Changes Summary */}
                {pendingChanges && pendingChanges.fields.length > 0 && (
                  <div className='rounded-xl border border-gray-200 bg-gray-50 p-4'>
                    <h4 className='font-semibold text-gray-900 mb-2'>Các thay đổi sẽ được nhân viên duyệt:</h4>
                    <ul className='space-y-1'>
                      {pendingChanges.fields.map((field, index) => (
                        <li key={index} className='text-sm text-gray-700 flex items-center gap-2'>
                          <span className='w-2 h-2 rounded-full bg-amber-500'></span>
                          {field.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Warning Box */}
                <div className='rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 space-y-3'>
                  <div className='flex items-start gap-3'>
                    <div className='flex-shrink-0 pt-0.5'>
                      <AlertCircle className='w-5 h-5 text-amber-600' />
                    </div>
                    <div className='flex-1'>
                      <h3 className='font-semibold text-amber-900 mb-2'>Lưu ý quan trọng</h3>
                      <p className='text-sm text-amber-800 mb-3'>
                        Cửa hàng sẽ chuyển về trạng thái <strong>"Chờ duyệt"</strong> và cần đợi nhân viên xem xét trong vòng <strong>24 giờ</strong>.
                      </p>
                      <p className='text-sm text-amber-800'>
                        Trong thời gian chờ duyệt, cửa hàng vẫn hoạt động bình thường (nếu đang ở trạng thái "Đã duyệt").
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCancelConfirm} variant='outline' disabled={saving || savingCover || savingLogo}>
                  <X className='w-4 h-4 mr-2' />
                  Hủy
                </Button>
                <Button
                  onClick={handleConfirmSave}
                  className='bg-green-600 hover:bg-green-700 text-white'
                  disabled={saving || savingCover || savingLogo}
                >
                  {saving || savingCover || savingLogo ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Check className='w-4 h-4 mr-2' />
                      Xác nhận cập nhật
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Resubmit Application Confirmation Modal */}
          <Dialog open={showResubmitModal} onOpenChange={(open) => !open && setShowResubmitModal(false)}>
            <DialogContent className='sm:max-w-[600px]'>
              <DialogHeader>
                <DialogTitle className='flex items-center gap-2 text-amber-700'>
                  <RefreshCw className='w-6 h-6 text-amber-600' />
                  Xác nhận gửi lại đơn đăng ký
                </DialogTitle>
                <DialogDescription>
                  Bạn có chắc chắn muốn gửi lại đơn đăng ký cửa hàng?
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4 py-4'>
                {/* Info Box */}
                <div className='rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 space-y-3'>
                  <div className='flex items-start gap-3'>
                    <div className='flex-shrink-0 pt-0.5'>
                      <AlertCircle className='w-5 h-5 text-blue-600' />
                    </div>
                    <div className='flex-1'>
                      <h3 className='font-semibold text-blue-900 mb-2'>Thông tin quan trọng</h3>
                      <p className='text-sm text-blue-800 mb-3'>
                        Đơn đăng ký sẽ được gửi lại và cửa hàng sẽ chuyển về trạng thái <strong>"Chờ duyệt"</strong>.
                      </p>
                      <p className='text-sm text-blue-800'>
                        Đơn đăng ký của bạn sẽ được nhân viên xem xét lại trong vòng <strong>24 giờ</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => setShowResubmitModal(false)}
                  variant='outline'
                  disabled={resubmitting}
                >
                  <X className='w-4 h-4 mr-2' />
                  Hủy
                </Button>
                <Button
                  onClick={handleResubmitApplication}
                  className='bg-amber-600 hover:bg-amber-700 text-white'
                  disabled={resubmitting}
                >
                  {resubmitting ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <RefreshCw className='w-4 h-4 mr-2' />
                      Xác nhận gửi lại
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card className='border-none shadow-2xl backdrop-blur-sm bg-white/95 rounded-3xl'>
            <CardContent className='p-8 space-y-10'>
              {/* Admin Note Alert - Show when admin made final decision */}
              {storeData.status === 'Rejected' && storeData.adminNote && (
                <div className='rounded-2xl border-2 border-red-200 bg-red-50 p-6 space-y-3'>
                  <div className='flex items-start gap-3'>
                    <div className='flex-shrink-0 pt-0.5'>
                      <AlertCircle className='w-5 h-5 text-red-600' />
                    </div>
                    <div className='flex-1'>
                      <h3 className='font-semibold text-red-900'>Lý do từ chối</h3>
                      <p className='text-sm text-red-800 mt-2'>{storeData.adminNote}</p>
                    </div>
                  </div>
                </div>
              )}
              {storeData.status === 'Approved' && storeData.adminNote && (
                <div className='rounded-2xl border-2 border-green-200 bg-green-50 p-6 space-y-3'>
                  <div className='flex items-start gap-3'>
                    <div className='flex-shrink-0 pt-0.5'>
                      <CheckCircle className='w-5 h-5 text-green-600' />
                    </div>
                    <div className='flex-1'>
                      <h3 className='font-semibold text-green-900'>Ghi chú phê duyệt</h3>
                      <p className='text-sm text-green-800 mt-2'>{storeData.adminNote}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Resubmit Button - Show when status is Inactive, RejectedByStaff, or Rejected */}
              {canResubmit() && (
                <div className='rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 space-y-4'>
                  <div className='flex items-start gap-3'>
                    <div className='flex-shrink-0 pt-0.5'>
                      <AlertCircle className='w-5 h-5 text-amber-600' />
                    </div>
                    <div className='flex-1'>
                      <h3 className='font-semibold text-amber-900 mb-2'>Đơn đăng ký chưa được duyệt</h3>
                      <p className='text-sm text-amber-800 mb-4'>
                        Cửa hàng của bạn đang ở trạng thái <strong>{statusDisplay.label}</strong>. Bạn có thể gửi lại đơn đăng ký để được xem xét lại.
                      </p>
                      <Button
                        onClick={() => setShowResubmitModal(true)}
                        className='bg-amber-600 hover:bg-amber-700 text-white rounded-xl'
                        disabled={resubmitting}
                      >
                        {resubmitting ? (
                          <>
                            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <RefreshCw className='w-4 h-4 mr-2' />
                            Gửi lại đơn đăng ký
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}


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
                            <p className='text-gray-900'>{storeData.address}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    {[
                      { label: 'Tỉnh/Thành', value: storeData.province },
                      { label: 'Quận/Huyện', value: storeData.district },
                      { label: 'Phường/Xã', value: storeData.ward }
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
                <section className='rounded-3xl border border-gray-100 bg-white shadow-inner p-6 space-y-6'>
                  {/* Seller Header with Avatar */}
                  <div className='flex items-start gap-6 pb-6 border-b border-gray-100'>
                    {storeData.sellerInfo.userInfo?.avatar && (
                      <div
                        className='relative flex-shrink-0 cursor-pointer group'
                        onClick={() => {
                          setPreviewImages([storeData.sellerInfo.userInfo.avatar || ''])
                          setPreviewInitialIndex(0)
                          setImagePreviewOpen(true)
                        }}
                      >
                        <div className='w-24 h-24 rounded-2xl overflow-hidden ring-2 ring-emerald-200 shadow-md'>
                          <img
                            src={storeData.sellerInfo.userInfo.avatar}
                            alt='Ảnh đại diện người bán'
                            className='w-full h-full object-cover'
                          />
                        </div>
                        <div className='absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                          <Eye className='w-6 h-6 text-white' />
                        </div>
                      </div>
                    )}
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-3'>
                        <div className='p-3 rounded-xl bg-slate-100 text-slate-700'>
                          <UserRound className='w-5 h-5' />
                        </div>
                        <div>
                          <p className='text-sm text-gray-500'>Thông tin người bán</p>
                          <p className='text-lg font-semibold text-gray-900'>{sellerFullName || 'Người bán'}</p>
                        </div>
                      </div>
                      <div className='space-y-2 text-sm'>
                        <p className='text-gray-600'>
                          <span className='font-medium text-gray-700'>Email:</span>{' '}
                          <span>{storeData.sellerInfo.userInfo?.email || '---'}</span>
                        </p>
                        <p className='text-gray-600'>
                          <span className='font-medium text-gray-700'>Điện thoại:</span>{' '}
                          <span>{storeData.sellerInfo.userInfo?.phoneNumber || '---'}</span>
                        </p>
                        <p className='text-gray-600'>
                          <span className='font-medium text-gray-700'>Giới tính:</span>{' '}
                          <span>{storeData.sellerInfo.userInfo?.gender || '---'}</span>
                        </p>
                        <p className='text-gray-600'>
                          <span className='font-medium text-gray-700'>Ngày sinh:</span>{' '}
                          <span>
                            {storeData.sellerInfo.userInfo?.dateOfBirth
                              ? new Date(storeData.sellerInfo.userInfo.dateOfBirth).toLocaleDateString('vi-VN')
                              : '---'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Business Information */}
                  <div className='space-y-4'>
                    <h4 className='font-semibold text-gray-900 flex items-center gap-2'>
                      <ShieldCheck className='w-5 h-5 text-emerald-600' />
                      Thông tin kinh doanh
                    </h4>
                    <div className='grid gap-4 md:grid-cols-2'>
                      <div className='p-4 bg-emerald-50 rounded-2xl border border-emerald-100'>
                        <p className='text-xs text-gray-500 uppercase tracking-wider font-semibold'>Tên doanh nghiệp</p>
                        <p className='text-sm font-medium text-gray-900 mt-2'>
                          {storeData.sellerInfo.businessName || '---'}
                        </p>
                      </div>
                      <div className='p-4 bg-blue-50 rounded-2xl border border-blue-100'>
                        <p className='text-xs text-gray-500 uppercase tracking-wider font-semibold'>Mã số thuế</p>
                        <p className='text-sm font-medium text-gray-900 mt-2'>
                          {storeData.sellerInfo.taxCode || '---'}
                        </p>
                      </div>
                      <div className='p-4 bg-pink-50 rounded-2xl border border-pink-100'>
                        <p className='text-xs text-gray-500 uppercase tracking-wider font-semibold'>Số CCCD</p>
                        <p className='text-sm font-medium text-gray-900 mt-2'>
                          {storeData.sellerInfo.identifyCard || '---'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Business License Document */}
                  {storeData.sellerInfo.businessLicense && (
                    <div className='space-y-4 pt-6 border-t border-gray-100'>
                      <h4 className='font-semibold text-gray-900 flex items-center gap-2'>
                        <FileText className='w-5 h-5 text-emerald-600' />
                        Giấy phép kinh doanh
                      </h4>
                      <div className='flex justify-center'>
                        <div
                          className='relative group cursor-pointer overflow-hidden rounded-2xl shadow-md border-2 border-gray-100 hover:border-emerald-300 transition-all max-w-full'
                          onClick={() => {
                            setPreviewImages([storeData.sellerInfo.businessLicense || ''])
                            setPreviewInitialIndex(0)
                            setImagePreviewOpen(true)
                          }}
                        >
                          <img
                            src={storeData.sellerInfo.businessLicense}
                            alt='Giấy phép kinh doanh'
                            className='max-w-full h-auto max-h-[600px] object-contain group-hover:scale-105 transition-transform'
                          />
                          <div className='absolute inset-0 bg-black/30 group-hover:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all'>
                            <Eye className='w-6 h-6 text-white' />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Identification Documents */}
                  {(storeData.sellerInfo.identifyFrontImage || storeData.sellerInfo.identifyBackImage) && (
                    <div className='space-y-4 pt-6 border-t border-gray-100'>
                      <h4 className='font-semibold text-gray-900 flex items-center gap-2'>
                        <FileText className='w-5 h-5 text-blue-600' />
                        Ảnh Căn cước
                      </h4>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        {storeData.sellerInfo.identifyFrontImage && (
                          <div className='flex justify-center'>
                            <div
                              className='relative group cursor-pointer overflow-hidden rounded-2xl shadow-md border-2 border-gray-100 hover:border-emerald-300 transition-all max-w-full'
                              onClick={() => {
                                const docs = [storeData.sellerInfo.identifyFrontImage || '']
                                if (storeData.sellerInfo.identifyBackImage) {
                                  docs.push(storeData.sellerInfo.identifyBackImage)
                                }
                                setPreviewImages(docs)
                                setPreviewInitialIndex(0)
                                setImagePreviewOpen(true)
                              }}
                            >
                              <img
                                src={storeData.sellerInfo.identifyFrontImage}
                                alt='CCCD Mặt trước'
                                className='max-w-full h-auto max-h-[400px] object-contain group-hover:scale-105 transition-transform'
                              />
                              <div className='absolute inset-0 bg-black/30 group-hover:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all'>
                                <Eye className='w-6 h-6 text-white' />
                              </div>
                              <p className='absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 text-center font-medium'>
                                Mặt trước
                              </p>
                            </div>
                          </div>
                        )}
                        {storeData.sellerInfo.identifyBackImage && (
                          <div className='flex justify-center'>
                            <div
                              className='relative group cursor-pointer overflow-hidden rounded-2xl shadow-md border-2 border-gray-100 hover:border-emerald-300 transition-all max-w-full'
                              onClick={() => {
                                const docs = []
                                if (storeData.sellerInfo.identifyFrontImage) {
                                  docs.push(storeData.sellerInfo.identifyFrontImage)
                                }
                                docs.push(storeData.sellerInfo.identifyBackImage || '')
                                setPreviewImages(docs)
                                setPreviewInitialIndex(docs.length - 1)
                                setImagePreviewOpen(true)
                              }}
                            >
                              <img
                                src={storeData.sellerInfo.identifyBackImage}
                                alt='CCCD Mặt sau'
                                className='max-w-full h-auto max-h-[400px] object-contain group-hover:scale-105 transition-transform'
                              />
                              <div className='absolute inset-0 bg-black/30 group-hover:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all'>
                                <Eye className='w-6 h-6 text-white' />
                              </div>
                              <p className='absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 text-center font-medium'>
                                Mặt sau
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Seller Status */}
                  <div className='pt-6 border-t border-gray-100 flex items-center justify-between'>
                    <div>
                      <p className='text-xs text-gray-500 uppercase tracking-wider font-semibold'>
                        Trạng thái người bán
                      </p>
                      <p className='text-sm font-medium text-gray-900 mt-2'>{getSellerStatusLabel(storeData.sellerInfo.sellerStatus)}</p>
                    </div>
                    <div>
                      <p className='text-xs text-gray-500 uppercase tracking-wider font-semibold'>Lần báo cáo</p>
                      <p className='text-sm font-medium text-gray-900 mt-2'>{storeData.sellerInfo.reportCount || 0}</p>
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
                            className='relative group overflow-hidden rounded-2xl border border-gray-100 shadow-md cursor-pointer'
                            onClick={() => {
                              setPreviewImages(existingVendorAppUrls)
                              setPreviewInitialIndex(index)
                              setImagePreviewOpen(true)
                            }}
                          >
                            <img
                              src={url}
                              alt={`Đơn đăng ký người bán ${index + 1}`}
                              className='w-full h-40 object-cover'
                            />
                            <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                              <Eye className='w-6 h-6 text-white' />
                            </div>
                            {isEditMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeExistingVendorAppUrl(index)
                                }}
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
                            className='relative group overflow-hidden rounded-2xl border border-gray-100 shadow-md cursor-pointer'
                            onClick={() => {
                              const previewUrls = vendorAppFiles.map((f) => URL.createObjectURL(f))
                              setPreviewImages(previewUrls)
                              setPreviewInitialIndex(index)
                              setImagePreviewOpen(true)
                            }}
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Tệp mới ${index + 1}`}
                              className='w-full h-40 object-cover'
                            />
                            <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                              <Eye className='w-6 h-6 text-white' />
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeVendorAppFile(index)
                              }}
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

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={imagePreviewOpen}
        onClose={() => setImagePreviewOpen(false)}
        images={previewImages}
        initialIndex={previewInitialIndex}
        alt='Xem chi tiết hình ảnh'
      />
    </div>
  )
}

export default SetupStore
