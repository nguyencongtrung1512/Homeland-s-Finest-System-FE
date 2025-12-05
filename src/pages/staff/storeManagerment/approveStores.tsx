import { useState, useEffect } from 'react'
import { Search, Eye, RefreshCw, Upload as UploadIcon, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { staffApi, type AssignedStore } from '../../../apis/staff.api'
import { toast } from '../../../utils/toast'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { ShimmerBorder } from '../../../components/ui/shimmer'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { cn } from '../../../lib/utils'
import { formatDate } from '../../../utils/formatDate'

interface StoreData {
  key: string
  store: {
    avatar: string
    logoUrl: string | null
    storeName: string
    id: string
  }
  owner: {
    sellerName: string
  }
  createdAt: string
  products: number
  status: 'Processing' | 'ApprovedByStaff' | 'RejectedByStaff' | 'Inactive'
}

const DEFAULT_STORE_LOGO = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'

function ApproveStores() {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [storeData, setStoreData] = useState<StoreData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalStores, setTotalStores] = useState(0)
  const pageSize = 10

  // Review modal states
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [newStatus, setNewStatus] = useState<'ApprovedByStaff' | 'RejectedByStaff' | ''>('')
  const [staffNotes, setStaffNotes] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [wordCount, setWordCount] = useState(0)
  const [errors, setErrors] = useState<{
    newStatus?: string
    staffNotes?: string
    staffImages?: string
  }>({})

  // Function để convert API response thành UI format
  const convertAssignedStore = (apiStore: AssignedStore): StoreData => {
    // Tạo avatar từ tên store
    const avatarText = apiStore.storeName
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)

    return {
      key: apiStore.id,
      store: {
        avatar: avatarText,
        logoUrl: apiStore.logoUrl,
        storeName: apiStore.storeName,
        id: apiStore.id
      },
      owner: {
        sellerName: apiStore.sellerName
      },
      createdAt: apiStore.createdAt,
      products: 0,
      status: apiStore.status as 'Processing' | 'ApprovedByStaff' | 'RejectedByStaff'
    }
  }

  // Function để fetch assigned stores
  const fetchAssignedStores = async () => {
    try {
      setLoading(true)
      setError(null)

      // Lấy staffId từ localStorage
      const userString = localStorage.getItem('user')
      let staffId = null

      if (userString) {
        try {
          const user = JSON.parse(userString)
          staffId = user.userId || user.id
        } catch {
          // Silent error handling
        }
      }

      if (!staffId) {
        setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
        return
      }

      const response = await staffApi.getAssignedStores(staffId, {
        pageSize: 100, // Lấy tất cả để có thể filter ở frontend
        pageNumber: 1
      })

      // axiosInstance trả về response, lấy data từ response
      if (response && Array.isArray(response)) {
        // Trường hợp API trả về array trực tiếp
        const convertedStores = response.map(convertAssignedStore)
        setStoreData(convertedStores)
        setTotalStores(convertedStores.length)
      } else if (response && response.data && Array.isArray(response.data)) {
        // Trường hợp API trả về object với data property
        const convertedStores = response.data.map(convertAssignedStore)
        setStoreData(convertedStores)
        setTotalStores(convertedStores.length)
      } else {
        setError('Định dạng dữ liệu không đúng')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải danh sách cửa hàng'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Load stores khi component mount
  useEffect(() => {
    fetchAssignedStores()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle image selection and preview
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes
    const fileArray = Array.from(files)

    // Filter và validate file size
    const validFiles: File[] = []
    const invalidFiles: string[] = []

    fileArray.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(file.name)
      } else {
        validFiles.push(file)
      }
    })

    // Hiển thị thông báo lỗi nếu có file vượt quá 5MB
    if (invalidFiles.length > 0) {
      toast.error(`Các file sau vượt quá 5MB: ${invalidFiles.join(', ')}`)
    }

    setSelectedImages((prev) => [...prev, ...validFiles])

    // Create previews chỉ cho các file hợp lệ
    const newPreviews = validFiles.map((file: File) => URL.createObjectURL(file))
    setImagePreviews((prev) => [...prev, ...newPreviews])

    // Clear input
    event.target.value = ''
  }

  // Remove image
  const removeImage = (index: number) => {
    // Cleanup URL object to prevent memory leak
    URL.revokeObjectURL(imagePreviews[index])

    const newImages = selectedImages.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)

    setSelectedImages(newImages)
    setImagePreviews(newPreviews)
  }


  // Count words
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setStaffNotes(value)
    const words = value.trim().split(/\s+/).filter((word: string) => word.length > 0)
    setWordCount(words.length)
  }

  const handleReviewSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!selectedStore) return

    // Validation
    const newErrors: typeof errors = {}
    if (!newStatus) {
      newErrors.newStatus = 'Vui lòng chọn quyết định'
    }
    if (!staffNotes.trim()) {
      newErrors.staffNotes = 'Vui lòng nhập ghi chú'
    }
    if (selectedImages.length === 0) {
      newErrors.staffImages = 'Vui lòng chọn ít nhất 1 hình ảnh'
    }

    // Kiểm tra số từ trong ghi chú
    const words = staffNotes.trim().split(/\s+/).filter((word: string) => word.length > 0)
    if (words.length > 20) {
      toast.error(`Ghi chú không được vượt quá 20 từ (${words.length}/20 từ)`)
      return
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      setReviewLoading(true)
      setErrors({})

      const response = await staffApi.reviewStore(selectedStore.store.id, {
        NewStatus: newStatus as 'ApprovedByStaff' | 'RejectedByStaff',
        StaffNotes: staffNotes,
        selectedImages: selectedImages
      })

      // Check success conditions
      if (response && response.storeId && response.newStatus && response.reviewedByStaffId && response.decisionDate) {
        toast.success('Thẩm định cửa hàng thành công!')
        setReviewModalOpen(false)
        setNewStatus('')
        setStaffNotes('')
        setSelectedImages([])
        setImagePreviews([])
        setSelectedStore(null)
        setWordCount(0)
        fetchAssignedStores() // Refresh data
      } else if (response && response.status === 202) {
        toast.success('Thẩm định cửa hàng thành công!')
        setReviewModalOpen(false)
        setNewStatus('')
        setStaffNotes('')
        setSelectedImages([])
        setImagePreviews([])
        setSelectedStore(null)
        setWordCount(0)
        fetchAssignedStores()
      } else if (response && response.message && response.message.includes('thành công')) {
        toast.success('Thẩm định cửa hàng thành công!')
        setReviewModalOpen(false)
        setNewStatus('')
        setStaffNotes('')
        setSelectedImages([])
        setImagePreviews([])
        setSelectedStore(null)
        setWordCount(0)
        fetchAssignedStores()
      } else {
        console.error('❌ Unexpected response format:', response)
        toast.error(`Lỗi: ${response?.message || 'Không thể Thẩm định cửa hàng'}`)
      }
    } catch {
      toast.error('Có lỗi xảy ra khi Thẩm định cửa hàng')
    } finally {
      setReviewLoading(false)
    }
  }

  // Get status badge config
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Pending: { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200', text: 'Chờ duyệt' },
      Processing: { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800 hover:bg-blue-200', text: 'Đang xử lý' },
      ApprovedByStaff: { variant: 'secondary' as const, className: 'bg-green-100 text-green-800 hover:bg-green-200', text: 'Đã chấp nhận' },
      RejectedByStaff: { variant: 'secondary' as const, className: 'bg-red-100 text-red-800 hover:bg-red-200', text: 'Đã từ chối' },
      Approved: { variant: 'secondary' as const, className: 'bg-green-100 text-green-800 hover:bg-green-200', text: 'Đã chấp nhận' },
      Rejected: { variant: 'secondary' as const, className: 'bg-red-100 text-red-800 hover:bg-red-200', text: 'Đã từ chối' },
      Inactive: { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800 hover:bg-gray-200', text: 'Bị khóa' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800', text: status }
    return config
  }

  // Filter stores based on search
  const filteredStores = storeData.filter((store) => {
    const matchesSearch = searchText === '' || store.store.storeName.toLowerCase().includes(searchText.toLowerCase()) || store.store.id.toLowerCase().includes(searchText.toLowerCase())
    return matchesSearch
  })

  // Pagination
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedStores = filteredStores.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredStores.length / pageSize)

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <Card className='bg-gradient-to-br from-cyan-500 to-cyan-600 border-0 shadow-lg'>
        <CardContent className='py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <h2 className='text-3xl font-bold text-white m-0'>Duyệt cửa hàng</h2>
            </div>
            <ShimmerBorder
              className='cursor-pointer'
              color='#ffffff'
              animationDuration='3s'
              contentClassName='bg-white/10 rounded-lg'
            >
              <Button
                onClick={fetchAssignedStores}
                disabled={loading}
                variant='outline'
                className='flex items-center gap-2 bg-transparent border-transparent text-white hover:bg-white/20 hover:text-white w-full'
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Đang tải...' : 'Làm mới'}
              </Button>
            </ShimmerBorder>
          </div>
          <p className='text-white/90 mt-2'>
            Xem xét và phê duyệt các cửa hàng được phân công ({totalStores} cửa hàng)
          </p>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-wrap items-center gap-4'>
            <div className='flex-1 min-w-[300px]'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={16} />
                <Input
                  placeholder='Tìm kiếm theo tên cửa hàng hoặc ID...'
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value)
                    setCurrentPage(1) // Reset to first page when searching
                  }}
                  className='pl-10 w-full'
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className='pt-6'>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-cyan-600' />
              <span className='ml-3 text-gray-600'>Đang tải danh sách cửa hàng...</span>
            </div>
          ) : error ? (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center'>
                <p className='text-red-600 font-medium mb-4'>{error}</p>
                <Button onClick={fetchAssignedStores} className='bg-cyan-600 hover:bg-cyan-700 text-white'>
                  Thử lại
                </Button>
              </div>
            </div>
          ) : filteredStores.length === 0 ? (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center'>
                <div className='text-gray-400 text-lg mb-2'>📦</div>
                <p className='text-gray-600'>
                  {searchText ? 'Không tìm thấy cửa hàng nào' : 'Chưa có cửa hàng nào được phân công'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-gray-200'>
                      <th className='text-left py-3 px-4 font-semibold text-gray-700'>Cửa hàng</th>
                      <th className='text-left py-3 px-4 font-semibold text-gray-700'>Tên Doanh Nghiệp</th>
                      <th className='text-left py-3 px-4 font-semibold text-gray-700'>Ngày tạo</th>
                      <th className='text-left py-3 px-4 font-semibold text-gray-700'>Trạng thái</th>
                      <th className='text-left py-3 px-4 font-semibold text-gray-700'>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStores.map((store) => {
                      const statusConfig = getStatusBadge(store.status)
                      return (
                        <tr key={store.key} className='border-b border-gray-100 hover:bg-gray-50 transition-colors'>
                          <td className='py-4 px-4'>
                            <div className='flex items-center gap-3'>
                              <Avatar className='w-10 h-10'>
                                <AvatarImage
                                  src={store.store.logoUrl || DEFAULT_STORE_LOGO}
                                  alt={store.store.storeName}
                                  className='object-cover'
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    if (!target.src.includes(DEFAULT_STORE_LOGO)) {
                                      target.src = DEFAULT_STORE_LOGO
                                    }
                                  }}
                                />
                                <AvatarFallback className='bg-cyan-100 text-cyan-700 font-semibold'>
                                  {store.store.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div className='font-medium text-gray-900'>{store.store.storeName}</div>
                            </div>
                          </td>
                          <td className='py-4 px-4'>
                            <div className='font-medium text-gray-900'>{store.owner.sellerName}</div>
                          </td>
                          <td className='py-4 px-4'>
                            <span className='text-gray-700'>{formatDate(store.createdAt)}</span>
                          </td>
                          <td className='py-4 px-4'>
                            <Badge variant={statusConfig.variant} className={statusConfig.className}>
                              {statusConfig.text}
                            </Badge>
                          </td>
                          <td className='py-4 px-4'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => navigate(`/staff/store-detail/${store.store.id}`)}
                              className='flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100'
                              title='Xem chi tiết'
                            >
                              <Eye size={16} />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='flex items-center justify-between mt-6'>
                  <div className='text-sm text-gray-600'>
                    Hiển thị {startIndex + 1} đến {Math.min(endIndex, filteredStores.length)} của {filteredStores.length} kết quả
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <span className='text-sm text-gray-700'>
                      Trang {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Thẩm định cửa hàng: {selectedStore?.store.storeName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReviewSubmit} className='space-y-6'>
            {/* Quyết định */}
            <div className='space-y-2'>
              <Label htmlFor='newStatus' className='text-sm font-medium text-gray-700'>
                Quyết định <span className='text-red-500'>*</span>
              </Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as typeof newStatus)}>
                <SelectTrigger id='newStatus' className={cn(errors.newStatus && 'border-red-500')}>
                  <SelectValue placeholder='Chọn quyết định Thẩm định' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ApprovedByStaff'>Chấp nhận cửa hàng</SelectItem>
                  <SelectItem value='RejectedByStaff'>Từ chối cửa hàng</SelectItem>
                </SelectContent>
              </Select>
              {errors.newStatus && <p className='text-sm text-red-500'>{errors.newStatus}</p>}
            </div>

            {/* Ghi chú */}
            <div className='space-y-2'>
              <Label htmlFor='staffNotes' className='text-sm font-medium text-gray-700'>
                Ghi chú của nhân viên <span className='text-red-500'>*</span>
              </Label>
              <Textarea
                id='staffNotes'
                rows={4}
                placeholder='Nhập ghi chú về cửa hàng...'
                value={staffNotes}
                onChange={handleNotesChange}
                className={cn(errors.staffNotes && 'border-red-500')}
              />
              <div className='flex items-center justify-between'>
                {errors.staffNotes ? (
                  <p className='text-sm text-red-500'>{errors.staffNotes}</p>
                ) : (
                  <p className='text-sm text-gray-500'>
                    Kích thước tối đa mỗi file: 5MB
                  </p>
                )}
                <p className={cn('text-sm', wordCount > 20 ? 'text-red-500' : 'text-gray-500')}>
                  {wordCount > 20
                    ? `Ghi chú không được vượt quá 20 từ (${wordCount}/20 từ)`
                    : `Số từ: ${wordCount}/20 từ`}
                </p>
              </div>
            </div>

            {/* Hình ảnh đính kèm */}
            <div className='space-y-2'>
              <Label htmlFor='staffImages' className='text-sm font-medium text-gray-700'>
                Hình ảnh đính kèm (Bắt buộc) <span className='text-red-500'>*</span>
              </Label>
              <div className='space-y-4'>
                <div className='relative'>
                  <input
                    type='file'
                    id='staffImages'
                    multiple
                    accept='image/*'
                    onChange={handleImageChange}
                    className='hidden'
                  />
                  <label htmlFor='staffImages'>
                    <Button
                      type='button'
                      variant='outline'
                      className='w-full flex items-center justify-center gap-2 cursor-pointer'
                      onClick={() => document.getElementById('staffImages')?.click()}
                    >
                      <UploadIcon size={16} />
                      Chọn hình ảnh
                    </Button>
                  </label>
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className='grid grid-cols-2 gap-4'>
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className='relative border border-gray-200 rounded-lg p-2 bg-gray-50'>
                        <img src={preview} alt={`Preview ${index + 1}`} className='w-full h-32 object-cover rounded' />
                        <button
                          type='button'
                          onClick={() => removeImage(index)}
                          className='absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors'
                        >
                          ×
                        </button>
                        <div className='text-xs text-gray-500 mt-1 truncate'>{selectedImages[index]?.name}</div>
                      </div>
                    ))}
                  </div>
                )}
                {errors.staffImages && <p className='text-sm text-red-500'>{errors.staffImages}</p>}
              </div>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setReviewModalOpen(false)
                  setNewStatus('')
                  setStaffNotes('')
                  setSelectedImages([])
                  setImagePreviews([])
                  setSelectedStore(null)
                  setWordCount(0)
                  setErrors({})
                }}
                disabled={reviewLoading}
              >
                Hủy
              </Button>
              <Button type='submit' disabled={reviewLoading} className='bg-green-500 hover:bg-green-600 text-white'>
                {reviewLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận Thẩm định'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ApproveStores
