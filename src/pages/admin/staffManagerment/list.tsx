import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Eye,
  Building2,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  UserPlus,
  Edit,
  Save,
  X,
  Ban
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../../components/ui/dialog'
import { Badge } from '../../../components/ui/badge'
import { Calendar } from '../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { Switch } from '../../../components/ui/switch'
import { Textarea } from '../../../components/ui/textarea'
import { staffApi, type StaffInfo, type UpdateStaffRequest } from '../../../apis/staff.api'
import { registerStaff, type StaffRegistrationData } from '../../../apis/auth.api'
import { adminApi } from '../../../apis/admin.api'
import { toast } from '../../../utils/toast'
import Pagination from '../../../components/Pagination/Pagination'
import { Label } from '../../../components/ui/label'

function StaffManagement() {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [allStaff, setAllStaff] = useState<StaffInfo[]>([]) // Tất cả staff từ API
  const [filteredStaff, setFilteredStaff] = useState<StaffInfo[]>([]) // Staff sau khi filter
  const [paginatedStaff, setPaginatedStaff] = useState<StaffInfo[]>([]) // Staff cho trang hiện tại
  const [selectedStaff, setSelectedStaff] = useState<StaffInfo | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(1)

  // Staff creation states
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false)
  const [staffFormData, setStaffFormData] = useState<StaffRegistrationData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    gender: 'Male',
    phoneNumber: '',
    dateOfBirth: '',
    hireDate: ''
  })
  const [staffFormLoading, setStaffFormLoading] = useState(false)
  const [dateOfBirthOpen, setDateOfBirthOpen] = useState(false)
  const [hireDateOpen, setHireDateOpen] = useState(false)

  // Staff edit states
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState<UpdateStaffRequest>({
    FirstName: '',
    LastName: '',
    Email: '',
    PhoneNumber: '',
    Gender: 'Male',
    DateOfBirth: '',
    HireDate: '',
    IsActive: true,
    IsPermission: true,
    Note: '',
    EmployeeCode: '',
    Avatar: undefined
  })
  const [editFormLoading, setEditFormLoading] = useState(false)
  const [editDateOfBirthOpen, setEditDateOfBirthOpen] = useState(false)
  const [editHireDateOpen, setEditHireDateOpen] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Ban states
  const [showBanModal, setShowBanModal] = useState(false)
  const [staffToBan, setStaffToBan] = useState<StaffInfo | null>(null)
  const [banReason, setBanReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Unban states
  const [showUnbanModal, setShowUnbanModal] = useState(false)
  const [staffToUnban, setStaffToUnban] = useState<StaffInfo | null>(null)

  // Fetch staff data từ API
  const fetchStaff = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        search: searchText || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
      }

      const response = await staffApi.getAllStaff(params)

      // Debug: Log the response structure
      console.log('API Response:', response)

      // Check if response and data exist
      if (response && response.data && Array.isArray(response.data)) {
        setAllStaff(response.data)
      } else if (response && Array.isArray(response)) {
        // If response is directly an array (fallback)
        setAllStaff(response)
      } else {
        console.warn('Invalid response structure:', response)
        setAllStaff([])
        toast.warning('Dữ liệu trả về không đúng định dạng')
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      setAllStaff([])
        toast.error('Không thể tải danh sách nhân viên')
    } finally {
      setLoading(false)
    }
  }, [searchText, statusFilter])

  // Filter staff dựa trên search và status
  const applyFilters = useCallback(() => {
    let filtered = [...allStaff]

    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase()
      filtered = filtered.filter(
        (staff) =>
          staff.firstName.toLowerCase().includes(searchLower) ||
          staff.lastName.toLowerCase().includes(searchLower) ||
          staff.email.toLowerCase().includes(searchLower) ||
          staff.phoneNumber.includes(searchText)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((staff) => (statusFilter === 'active' ? staff.isActive : !staff.isActive))
    }

    setFilteredStaff(filtered)
    setCurrentPage(1) // Reset về trang đầu khi filter
  }, [allStaff, searchText, statusFilter])

  // Paginate filtered staff
  const paginateStaff = useCallback(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginated = filteredStaff.slice(startIndex, endIndex)

    setPaginatedStaff(paginated)
    setTotalPages(Math.ceil(filteredStaff.length / pageSize))
  }, [filteredStaff, currentPage, pageSize])

  // Handle search
  const handleSearch = () => {
    applyFilters()
  }

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setStatusFilter(value)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle view detail
  const handleViewDetail = async (staffId: string) => {
    try {
      const response = await staffApi.getStaffInfo(staffId)
      setSelectedStaff(response.data)
      setShowDetailModal(true)
      setIsEditing(false) // Reset edit mode
    } catch (error) {
      console.error('Error fetching staff detail:', error)
      toast.error('Không thể tải thông tin chi tiết nhân viên')
    }
  }

  // Handle edit staff
  const handleEditStaff = () => {
    if (selectedStaff) {
      setEditFormData({
        FirstName: selectedStaff.firstName,
        LastName: selectedStaff.lastName,
        Email: selectedStaff.email,
        PhoneNumber: selectedStaff.phoneNumber,
        Gender: 'Male', // Default value, will be updated based on actual data
        DateOfBirth: selectedStaff.dateOfBirth,
        HireDate: selectedStaff.hireDate,
        IsActive: selectedStaff.isActive,
        IsPermission: selectedStaff.isPermission,
        Note: selectedStaff.note || '',
        EmployeeCode: '', // This field might not be available in StaffInfo
        Avatar: undefined
      })
      setAvatarPreview(getAvatarUrl(selectedStaff.avatar))
      setIsEditing(true)
    }
  }

  // Handle edit form change
  const handleEditFormChange = (field: keyof UpdateStaffRequest, value: string | boolean | File | undefined) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle avatar change
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setEditFormData((prev) => ({
        ...prev,
        Avatar: file
      }))

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!selectedStaff) return

    // Basic validation
    if (
      !editFormData.FirstName ||
      !editFormData.LastName ||
      !editFormData.Email ||
      !editFormData.PhoneNumber ||
      !editFormData.DateOfBirth ||
      !editFormData.HireDate
    ) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(editFormData.Email)) {
      toast.error('Email không hợp lệ', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10,12}$/
    if (!phoneRegex.test(editFormData.PhoneNumber)) {
      toast.error('Số điện thoại phải có 10-12 chữ số', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    setEditFormLoading(true)
    try {
      await staffApi.updateStaff(selectedStaff.userId, editFormData)

      toast.success('Cập nhật thông tin staff thành công!', {
        position: 'top-right',
        autoClose: 3000
      })

      // Refresh data and close edit mode
      await fetchStaff()
      setIsEditing(false)

      // Refresh selected staff data
      const response = await staffApi.getStaffInfo(selectedStaff.userId)
      setSelectedStaff(response.data)
    } catch (err: unknown) {
      console.error('Staff update error:', err)

      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }

        if (axiosError.response?.data?.errors) {
          const errors = axiosError.response.data.errors
          const errorMessages = Object.values(errors).flat()
          const firstError = errorMessages[0] || 'Có lỗi xảy ra khi cập nhật thông tin staff'
          toast.error(firstError, {
            position: 'top-right',
            autoClose: 5000
          })
        } else if (axiosError.response?.data?.message) {
          toast.error(axiosError.response.data.message, {
            position: 'top-right',
            autoClose: 5000
          })
        } else {
          toast.error('Có lỗi xảy ra khi cập nhật thông tin staff', {
            position: 'top-right',
            autoClose: 5000
          })
        }
      } else if (err && typeof err === 'object' && 'message' in err) {
        const errorWithMessage = err as { message: string }
        toast.error(errorWithMessage.message, {
          position: 'top-right',
          autoClose: 5000
        })
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật thông tin staff', {
          position: 'top-right',
          autoClose: 5000
        })
      }
    } finally {
      setEditFormLoading(false)
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditFormData({
      FirstName: '',
      LastName: '',
      Email: '',
      PhoneNumber: '',
      Gender: 'Male',
      DateOfBirth: '',
      HireDate: '',
      IsActive: true,
      IsPermission: true,
      Note: '',
      EmployeeCode: '',
      Avatar: undefined
    })
    setAvatarPreview(null)
  }

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge className='bg-green-100 text-green-800 hover:bg-green-100'>
          <CheckCircle className='w-3 h-3 mr-1' />
          Hoạt động
        </Badge>
      )
    } else {
      return (
        <Badge className='bg-red-100 text-red-800 hover:bg-red-100'>
          <XCircle className='w-3 h-3 mr-1' />
          Không hoạt động
        </Badge>
      )
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Get avatar URL with fallback
  const getAvatarUrl = (avatar: string) => {
    const defaultAvatar =
      'https://scontent.fsgn2-7.fna.fbcdn.net/v/t39.30808-6/465035753_1661013661514519_1627670806811343264_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=5mOa7Gq6_bUQ7kNvwHRbhKw&_nc_oc=Adn3WhVjw5Wtj6FQhxzAO17d70tHXNI_NFMKYkyiF27-6gP0H454mkF4QLv581AV61I&_nc_zt=23&_nc_ht=scontent.fsgn2-7.fna&_nc_gid=mFuBPxElXDeTfVFh0IcEtw&oh=00_AffkK-HwLzMpjLePHbZSdd8gGf0elGj51mwvEyIxTd0uIg&oe=68FB86F6'

    console.log('Staff Avatar from API:', avatar)

    // Kiểm tra nếu avatar là URL thật (không phải example.com)
    if (
      avatar &&
      avatar.trim() !== '' &&
      avatar !== 'null' &&
      avatar !== 'undefined' &&
      avatar.startsWith('http') &&
      !avatar.includes('example.com')
    ) {
      console.log('Using staff avatar:', avatar)
      return avatar
    }

    console.log('Using default avatar for staff:', defaultAvatar)
    return defaultAvatar
  }

  // Fetch data khi component mount
  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  // Apply filters khi allStaff thay đổi
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // Paginate khi filteredStaff hoặc currentPage thay đổi
  useEffect(() => {
    paginateStaff()
  }, [paginateStaff])

  // Staff creation functions
  const handleCreateStaff = () => {
    setShowCreateStaffModal(true)
    // Reset form data
    setStaffFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      gender: 'Male',
      phoneNumber: '',
      dateOfBirth: '',
      hireDate: ''
    })
  }

  const handleStaffFormChange = (field: keyof StaffRegistrationData, value: string) => {
    setStaffFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStaffFormSubmit = async () => {
    // Basic validation
    if (
      !staffFormData.email ||
      !staffFormData.password ||
      !staffFormData.firstName ||
      !staffFormData.lastName ||
      !staffFormData.phoneNumber ||
      !staffFormData.dateOfBirth ||
      !staffFormData.hireDate
    ) {
      toast.error('Vui lòng điền đầy đủ thông tin', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(staffFormData.password)) {
      toast.error('Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt', {
        position: 'top-right',
        autoClose: 5000
      })
      return
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(staffFormData.email)) {
      toast.error('Email không hợp lệ', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10,12}$/
    if (!phoneRegex.test(staffFormData.phoneNumber)) {
      toast.error('Số điện thoại phải có 10-12 chữ số', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    setStaffFormLoading(true)
    try {
      await registerStaff(staffFormData)

      toast.success('Tạo tài khoản nhân viên thành công!', {
        position: 'top-right',
        autoClose: 3000
      })

      // Close modal and refresh data
      setShowCreateStaffModal(false)
      await fetchStaff()
    } catch (err: unknown) {
      console.error('Staff creation error:', err)

      // Handle different types of errors
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }

        if (axiosError.response?.data?.errors) {
          // Handle validation errors from backend
          const errors = axiosError.response.data.errors
          const errorMessages = Object.values(errors).flat()
          const firstError = errorMessages[0] || 'Có lỗi xảy ra khi tạo tài khoản nhân viên'
          toast.error(firstError, {
            position: 'top-right',
            autoClose: 5000
          })
        } else if (axiosError.response?.data?.message) {
          // Handle backend error message
          toast.error(axiosError.response.data.message, {
            position: 'top-right',
            autoClose: 5000
          })
        } else {
          toast.error('Có lỗi xảy ra khi tạo tài khoản nhân viên', {
            position: 'top-right',
            autoClose: 5000
          })
        }
      } else if (err && typeof err === 'object' && 'message' in err) {
        const errorWithMessage = err as { message: string }
        toast.error(errorWithMessage.message, {
          position: 'top-right',
          autoClose: 5000
        })
      } else {
        toast.error('Có lỗi xảy ra khi tạo tài khoản nhân viên', {
          position: 'top-right',
          autoClose: 5000
        })
      }
    } finally {
      setStaffFormLoading(false)
    }
  }

  const closeCreateStaffModal = () => {
    setShowCreateStaffModal(false)
    setStaffFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      gender: 'Male',
      phoneNumber: '',
      dateOfBirth: '',
      hireDate: ''
    })
    setDateOfBirthOpen(false)
    setHireDateOpen(false)
  }

  // Date formatting functions
  const formatDateForForm = (date: Date | undefined): string => {
    if (!date) return ''
    return date.toISOString().split('T')[0] // Format as YYYY-MM-DD
  }

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // Handle ban
  const handleBan = (staff: StaffInfo) => {
    setStaffToBan(staff)
    setBanReason('')
    setShowBanModal(true)
  }

  const confirmBan = async () => {
    if (!staffToBan || !banReason.trim()) {
      toast.error('Vui lòng nhập lý do cấm', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    setActionLoading(true)
    try {
      const response = await adminApi.banStaff(staffToBan.userId, { reason: banReason.trim() })

      // Hiển thị thông báo từ backend
      const successMessage = response.data?.message || response.message || `Đã cấm nhân viên ${staffToBan.firstName} ${staffToBan.lastName}`

      toast.success(successMessage, {
        position: 'top-right',
        autoClose: 3000
      })

      // Refresh data
      await fetchStaff()
      setShowBanModal(false)
      setStaffToBan(null)
      setBanReason('')
    } catch (err: unknown) {
      const error = err as { message?: string }
      const errorMessage = error.message || 'Có lỗi xảy ra khi cấm nhân viên'
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Handle unban
  const handleUnban = (staff: StaffInfo) => {
    setStaffToUnban(staff)
    setShowUnbanModal(true)
  }

  const confirmUnban = async () => {
    if (!staffToUnban) return

    setActionLoading(true)
    try {
      const response = await adminApi.unbanStaff(staffToUnban.userId)

      // Hiển thị thông báo từ backend
      const successMessage = response.data?.message || response.message || `Đã mở khóa nhân viên ${staffToUnban.firstName} ${staffToUnban.lastName}`

      toast.success(successMessage, {
        position: 'top-right',
        autoClose: 3000
      })

      // Refresh data
      await fetchStaff()
      setShowUnbanModal(false)
      setStaffToUnban(null)
    } catch (err: unknown) {
      const error = err as { message?: string }
      const errorMessage = error.message || 'Có lỗi xảy ra khi mở khóa nhân viên'
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      })
    } finally {
      setActionLoading(false)
    }
  }

  const closeUnbanModal = () => {
    setShowUnbanModal(false)
    setStaffToUnban(null)
  }

  const closeBanModal = () => {
    setShowBanModal(false)
    setStaffToBan(null)
    setBanReason('')
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Quản lý nhân viên</h1>
          <p className='text-gray-600 mt-1'>Quản lý thông tin và trạng thái của các nhân viên</p>
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            onClick={handleCreateStaff}
            className='bg-green-600 hover:bg-green-700 text-white flex items-center gap-2'
          >
            <UserPlus className='w-4 h-4' />
            Tạo nhân viên
          </Button>
          <Users className='w-8 h-8 text-blue-600' />
          <span className='text-2xl font-bold text-blue-600'>{filteredStaff.length}</span>
          <span className='text-sm text-gray-500'>/ {allStaff.length} tổng</span>
        </div>
      </div>

      {/* Filters */}
      <Card>

        <CardContent>
          <div className='flex flex-col sm:flex-row gap-4 py-5'>
            <div className='flex-1'>
              <Input
                placeholder='Tìm kiếm theo tên, email, số điện thoại...'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className='w-full'
              />
            </div>
            <div className='w-full sm:w-48'>
              <Select value={statusFilter} onValueChange={handleFilterChange}>
                <SelectTrigger className='w-[200px]'>
                  <SelectValue placeholder='Trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả</SelectItem>
                  <SelectItem value='active'>Hoạt động</SelectItem>
                  <SelectItem value='inactive'>Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách nhân viên</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex justify-center items-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Thông tin liên hệ</TableHead>
                    <TableHead>Thông tin cá nhân</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tuyển</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStaff.map((staff) => (
                    <TableRow key={staff.userId}>
                      <TableCell>
                        <div className='flex items-center space-x-3'>
                          <Avatar className='w-10 h-10'>
                            <AvatarImage
                              src={getAvatarUrl(staff.avatar)}
                              alt={`${staff.firstName} ${staff.lastName}`}
                            />
                            <AvatarFallback>{getInitials(staff.firstName, staff.lastName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className='font-medium'>
                              {staff.firstName} {staff.lastName}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='space-y-1'>
                          <div className='flex items-center text-sm'>
                            <Mail className='w-4 h-4 mr-2 text-gray-400' />
                            {staff.email}
                          </div>
                          <div className='flex items-center text-sm'>
                            <Phone className='w-4 h-4 mr-2 text-gray-400' />
                            {staff.phoneNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='space-y-1'>
                          <div className='flex items-center text-sm'>
                            <CalendarIcon className='w-4 h-4 mr-2 text-gray-400' />
                            {staff.dateOfBirth}
                          </div>

                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(staff.isActive)}</TableCell>
                      <TableCell>
                        <div className='text-sm'>{formatDate(staff.hireDate)}</div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleViewDetail(staff.userId)}
                            className='flex items-center'
                          >
                            <Eye className='w-4 h-4 mr-2' />
                            Xem chi tiết
                          </Button>
                          {staff.isActive ? (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleBan(staff)}
                              className='text-orange-600 hover:text-orange-800 hover:bg-orange-50 flex items-center'
                            >
                              <Ban className='w-4 h-4 mr-2' />
                              Khóa
                            </Button>
                          ) : (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleUnban(staff)}
                              className='text-blue-600 hover:text-blue-800 hover:bg-blue-50 flex items-center'
                            >
                              <CheckCircle className='w-4 h-4 mr-2' />
                              Mở khóa
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            maxVisiblePages={2}
          />
        </CardContent>
      </Card>

      {/* Staff Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center justify-between'>
              <div className='flex items-center'>
                <UserCheck className='w-5 h-5 mr-2' />
                Thông tin chi tiết Staff
              </div>
              {!isEditing && (
                <Button onClick={handleEditStaff} variant='outline' size='sm' className='flex items-center'>
                  <Edit className='w-4 h-4 mr-2' />
                  Chỉnh sửa
                </Button>
              )}
            </DialogTitle>
            <DialogDescription>Thông tin đầy đủ về staff</DialogDescription>
          </DialogHeader>

          {selectedStaff && (
            <div className='space-y-6'>
              {isEditing ? (
                /* Edit Form */
                <div className='space-y-6'>
                  {/* Basic Information Edit */}
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center'>
                        <Users className='w-5 h-5 mr-2' />
                        Chỉnh sửa thông tin cá nhân
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {/* Avatar Section */}
                        <div className='space-y-4'>
                          <div className='flex items-center space-x-4'>
                            <Avatar className='w-20 h-20'>
                              <AvatarImage
                                src={avatarPreview || getAvatarUrl(selectedStaff.avatar)}
                                alt={`${editFormData.FirstName} ${editFormData.LastName}`}
                              />
                              <AvatarFallback className='text-lg'>
                                {getInitials(editFormData.FirstName, editFormData.LastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <input
                                type='file'
                                accept='image/*'
                                onChange={handleAvatarChange}
                                className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                              />
                              <p className='text-xs text-gray-500 mt-1'>Chọn ảnh đại diện mới</p>
                            </div>
                          </div>
                        </div>

                        {/* Status Switches */}
                        <div className='space-y-4'>
                          <div className='flex items-center justify-between'>
                            <label className='text-sm font-medium'>Trạng thái hoạt động</label>
                            <Switch
                              checked={editFormData.IsActive}
                              onCheckedChange={(checked) => handleEditFormChange('IsActive', checked)}
                            />
                          </div>
                          <div className='flex items-center justify-between'>
                            <label className='text-sm font-medium'>Quyền truy cập</label>
                            <Switch
                              checked={editFormData.IsPermission}
                              onCheckedChange={(checked) => handleEditFormChange('IsPermission', checked)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>Họ *</label>
                          <Input
                            value={editFormData.FirstName}
                            onChange={(e) => handleEditFormChange('FirstName', e.target.value)}
                            placeholder='Nhập họ'
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>Tên *</label>
                          <Input
                            value={editFormData.LastName}
                            onChange={(e) => handleEditFormChange('LastName', e.target.value)}
                            placeholder='Nhập tên'
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>Email *</label>
                          <Input
                            type='email'
                            value={editFormData.Email}
                            onChange={(e) => handleEditFormChange('Email', e.target.value)}
                            placeholder='Nhập email'
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>Số điện thoại *</label>
                          <Input
                            value={editFormData.PhoneNumber}
                            onChange={(e) => handleEditFormChange('PhoneNumber', e.target.value)}
                            placeholder='Nhập số điện thoại'
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>Giới tính</label>
                          <Select
                            value={editFormData.Gender}
                            onValueChange={(value) => handleEditFormChange('Gender', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Chọn giới tính' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='Male'>Nam</SelectItem>
                              <SelectItem value='Female'>Nữ</SelectItem>
                              <SelectItem value='Other'>Khác</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>Mã nhân viên</label>
                          <Input
                            value={editFormData.EmployeeCode}
                            onChange={(e) => handleEditFormChange('EmployeeCode', e.target.value)}
                            placeholder='Nhập mã nhân viên'
                          />
                        </div>
                      </div>

                      {/* Date Fields */}
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>Ngày sinh *</label>
                          <Popover open={editDateOfBirthOpen} onOpenChange={setEditDateOfBirthOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant='outline'
                                className={`w-full justify-start text-left font-normal ${!editFormData.DateOfBirth ? 'text-muted-foreground' : ''
                                  }`}
                              >
                                <CalendarIcon className='mr-2 h-4 w-4' />
                                {editFormData.DateOfBirth
                                  ? formatDisplayDate(editFormData.DateOfBirth)
                                  : 'Chọn ngày sinh'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className='w-auto p-0' align='start'>
                              <Calendar
                                mode='single'
                                selected={editFormData.DateOfBirth ? new Date(editFormData.DateOfBirth) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    handleEditFormChange('DateOfBirth', formatDateForForm(date))
                                    setEditDateOfBirthOpen(false)
                                  }
                                }}
                                disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                                captionLayout='dropdown'
                                fromYear={1900}
                                toYear={new Date().getFullYear()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>Ngày tuyển dụng *</label>
                          <Popover open={editHireDateOpen} onOpenChange={setEditHireDateOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant='outline'
                                className={`w-full justify-start text-left font-normal ${!editFormData.HireDate ? 'text-muted-foreground' : ''
                                  }`}
                              >
                                <CalendarIcon className='mr-2 h-4 w-4' />
                                {editFormData.HireDate
                                  ? formatDisplayDate(editFormData.HireDate)
                                  : 'Chọn ngày tuyển dụng'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className='w-auto p-0' align='start'>
                              <Calendar
                                mode='single'
                                selected={editFormData.HireDate ? new Date(editFormData.HireDate) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    handleEditFormChange('HireDate', formatDateForForm(date))
                                    setEditHireDateOpen(false)
                                  }
                                }}
                                disabled={(date) => date < new Date('2020-01-01')}
                                captionLayout='dropdown'
                                fromYear={2020}
                                toYear={new Date().getFullYear() + 1}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Note Field */}
                      <div className='mt-4'>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Ghi chú</label>
                        <Textarea
                          value={editFormData.Note}
                          onChange={(e) => handleEditFormChange('Note', e.target.value)}
                          placeholder='Nhập ghi chú về nhân viên'
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className='flex justify-end space-x-2'>
                    <Button variant='outline' onClick={handleCancelEdit} disabled={editFormLoading}>
                      <X className='w-4 h-4 mr-2' />
                      Hủy
                    </Button>
                    <Button
                      onClick={handleSaveEdit}
                      className='bg-blue-600 hover:bg-blue-700 text-white'
                      disabled={editFormLoading}
                    >
                      {editFormLoading ? (
                        <>
                          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save className='w-4 h-4 mr-2' />
                          Lưu thay đổi
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center'>
                        <Users className='w-5 h-5 mr-2' />
                        Thông tin cá nhân
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='flex items-center space-x-4'>
                          <Avatar className='w-20 h-20'>
                            <AvatarImage
                              src={getAvatarUrl(selectedStaff.avatar)}
                              alt={`${selectedStaff.firstName} ${selectedStaff.lastName}`}
                            />
                            <AvatarFallback className='text-lg'>
                              {getInitials(selectedStaff.firstName, selectedStaff.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className='text-xl font-semibold'>
                              {selectedStaff.firstName} {selectedStaff.lastName}
                            </h3>
                            <p className='text-gray-600'>{selectedStaff.email}</p>
                            {getStatusBadge(selectedStaff.isActive)}
                          </div>
                        </div>
                        <div className='space-y-3'>
                          <div className='flex items-center'>
                            <Phone className='w-4 h-4 mr-2 text-gray-400' />
                            <span>{selectedStaff.phoneNumber}</span>
                          </div>
                          <div className='flex items-center'>
                            <CalendarIcon className='w-4 h-4 mr-2 text-gray-400' />
                            <span>{selectedStaff.dateOfBirth}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Work Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center'>
                        <Building2 className='w-5 h-5 mr-2' />
                        Thông tin công việc
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='space-y-3'>
                          <div>
                            <label className='text-sm font-medium text-gray-500'>Ngày tuyển dụng</label>
                            <p className='text-lg font-semibold'>{formatDate(selectedStaff.hireDate)}</p>
                          </div>

                        </div>
                        <div className='space-y-3'>
                          <div>
                            <label className='text-sm font-medium text-gray-500'>Ghi chú</label>
                            <p className='text-sm'>{selectedStaff.note || 'Không có ghi chú'}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status and Dates */}
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center'>
                        <CalendarIcon className='w-5 h-5 mr-2' />
                        Trạng thái và thời gian
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        <div>
                          <label className='text-sm font-medium text-gray-500'>Trạng thái quyền</label>
                          <div className='mt-1'>
                            {selectedStaff.isPermission ? (
                              <Badge className='bg-green-100 text-green-800'>
                                <CheckCircle className='w-3 h-3 mr-1' />
                                Có quyền
                              </Badge>
                            ) : (
                              <Badge className='bg-yellow-100 text-yellow-800'>
                                <AlertCircle className='w-3 h-3 mr-1' />
                                Không có quyền
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className='text-sm font-medium text-gray-500'>Ngày tạo tài khoản</label>
                          <p className='text-sm'>{formatDate(selectedStaff.createdAt)}</p>
                        </div>
                        <div>
                          <label className='text-sm font-medium text-gray-500'>Cập nhật lần cuối</label>
                          <p className='text-sm'>{formatDate(selectedStaff.updatedAt)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center'>
                        <FileText className='w-5 h-5 mr-2' />
                        Thống kê
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='flex items-center space-x-6'>
                        <div className='text-center'>
                          <div className='text-2xl font-bold text-blue-600'>
                            {selectedStaff.isActive ? 'Hoạt động' : 'Tạm khóa'}
                          </div>
                          <div className='text-sm text-gray-500'>Trạng thái hiện tại</div>
                        </div>
                        <div className='text-center'>
                          <div className='text-2xl font-bold text-green-600'>
                            {selectedStaff.isPermission ? 'Có quyền' : 'Không quyền'}
                          </div>
                          <div className='text-sm text-gray-500'>Quyền truy cập</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Staff Modal */}
      <Dialog open={showCreateStaffModal} onOpenChange={setShowCreateStaffModal}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Tạo tài khoản nhân viên</DialogTitle>
            <DialogDescription>Điền thông tin để tạo tài khoản nhân viên mới</DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {/* First Name and Last Name */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Họ *</label>
                <Input
                  type='text'
                  placeholder='Nhập họ'
                  value={staffFormData.firstName}
                  onChange={(e) => handleStaffFormChange('firstName', e.target.value)}
                  className='h-10'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Tên *</label>
                <Input
                  type='text'
                  placeholder='Nhập tên'
                  value={staffFormData.lastName}
                  onChange={(e) => handleStaffFormChange('lastName', e.target.value)}
                  className='h-10'
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Email *</label>
              <Input
                type='email'
                placeholder='Nhập email nhân viên'
                value={staffFormData.email}
                onChange={(e) => handleStaffFormChange('email', e.target.value)}
                className='h-10'
              />
            </div>

            {/* Password */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Mật khẩu *</label>
              <Input
                type='password'
                placeholder='Nhập mật khẩu'
                value={staffFormData.password}
                onChange={(e) => handleStaffFormChange('password', e.target.value)}
                className='h-10'
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Số điện thoại *</label>
              <Input
                type='tel'
                placeholder='Nhập số điện thoại'
                value={staffFormData.phoneNumber}
                onChange={(e) => handleStaffFormChange('phoneNumber', e.target.value)}
                className='h-10'
              />
            </div>

            {/* Gender */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Giới tính *</label>
              <Select value={staffFormData.gender} onValueChange={(value) => handleStaffFormChange('gender', value)}>
                <SelectTrigger className='h-10'>
                  <SelectValue placeholder='Chọn giới tính' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Male'>Nam</SelectItem>
                  <SelectItem value='Female'>Nữ</SelectItem>
                  <SelectItem value='Other'>Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date of Birth */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Ngày sinh *</label>
              <Popover open={dateOfBirthOpen} onOpenChange={setDateOfBirthOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={`w-full h-10 justify-start text-left font-normal ${!staffFormData.dateOfBirth ? 'text-muted-foreground' : ''
                      }`}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {staffFormData.dateOfBirth ? formatDisplayDate(staffFormData.dateOfBirth) : 'Chọn ngày sinh'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={staffFormData.dateOfBirth ? new Date(staffFormData.dateOfBirth) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleStaffFormChange('dateOfBirth', formatDateForForm(date))
                        setDateOfBirthOpen(false)
                      }
                    }}
                    disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                    captionLayout='dropdown'
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Hire Date */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Ngày tuyển dụng *</label>
              <Popover open={hireDateOpen} onOpenChange={setHireDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={`w-full h-10 justify-start text-left font-normal ${!staffFormData.hireDate ? 'text-muted-foreground' : ''
                      }`}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {staffFormData.hireDate ? formatDisplayDate(staffFormData.hireDate) : 'Chọn ngày tuyển dụng'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={staffFormData.hireDate ? new Date(staffFormData.hireDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleStaffFormChange('hireDate', formatDateForForm(date))
                        setHireDateOpen(false)
                      }
                    }}
                    disabled={(date) => date < new Date('2020-01-01')}
                    captionLayout='dropdown'
                    fromYear={2020}
                    toYear={new Date().getFullYear() + 1}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter className='flex gap-2'>
            <Button variant='outline' onClick={closeCreateStaffModal} disabled={staffFormLoading}>
              Hủy
            </Button>
            <Button
              onClick={handleStaffFormSubmit}
              className='bg-green-600 hover:bg-green-700 text-white'
              disabled={staffFormLoading}
            >
              {staffFormLoading ? 'Đang tạo...' : 'Tạo nhân viên'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Modal */}
      <Dialog open={showBanModal} onOpenChange={setShowBanModal}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center'>
              <Ban className='w-5 h-5 mr-2 text-orange-600' />
              Khóa nhân viên
            </DialogTitle>
            <DialogDescription>
              {staffToBan && (
                <>
                  Bạn đang Khóa nhân viên <span className='font-semibold'>{staffToBan.firstName} {staffToBan.lastName}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {staffToBan && (
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label>Lý do cấm *</Label>
                <Textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder='Nhập lý do khóa nhân viên...'
                  rows={4}
                  className='resize-none'
                />
              </div>

              <div className='rounded-md bg-orange-50 p-3 text-sm text-orange-800'>
                <AlertCircle className='w-4 h-4 inline mr-2' />
                Nhân viên sẽ bị cấm và không thể đăng nhập vào hệ thống.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant='outline' onClick={closeBanModal} disabled={actionLoading}>
              Hủy
            </Button>
            <Button
              variant='red'
              onClick={confirmBan}
              disabled={actionLoading || !banReason.trim()}
            >
              {actionLoading ? 'Đang xử lý...' : 'Xác nhận cấm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unban Modal */}
      <Dialog open={showUnbanModal} onOpenChange={setShowUnbanModal}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center'>
              <CheckCircle className='w-5 h-5 mr-2 text-blue-600' />
              Mở khóa nhân viên
            </DialogTitle>
            <DialogDescription>
              {staffToUnban && (
                <>
                  Bạn có chắc chắn muốn mở khóa nhân viên{' '}
                  <span className='font-semibold'>{staffToUnban.firstName} {staffToUnban.lastName}</span> không?
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {staffToUnban && (
            <div className='space-y-4 py-4'>
              <div className='rounded-md bg-blue-50 p-3 text-sm text-blue-800'>
                <AlertCircle className='w-4 h-4 inline mr-2' />
                Nhân viên sẽ được mở khóa và có thể đăng nhập vào hệ thống trở lại.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant='outline' onClick={closeUnbanModal} disabled={actionLoading}>
              Hủy
            </Button>
            <Button
              onClick={confirmUnban}
              className='bg-blue-600 hover:bg-blue-700 text-white'
              disabled={actionLoading}
            >
              {actionLoading ? 'Đang xử lý...' : 'Xác nhận mở khóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StaffManagement
