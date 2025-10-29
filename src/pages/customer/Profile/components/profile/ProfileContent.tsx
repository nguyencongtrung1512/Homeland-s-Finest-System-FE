import { useState, useEffect } from 'react'
import { Button } from '../../../../../components/ui/button'
import { Input } from '../../../../../components/ui/input'
import { Label } from '../../../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select'
import { useAuth } from '../../../../../contexts/auth.context'
import { getUserById, updateUser, type User as UserType } from '../../../../../apis/user.api'
import { getProvinces, type Province } from '../../../../../apis/province'
import { changePassword } from '../../../../../apis/auth.api'
import { toast } from 'react-toastify'
import { MapPin, CreditCard, Building2, Camera, X, User } from 'lucide-react'

// Helper function to convert DD-MM-YYYY to YYYY-MM-DD format
const convertDateFormat = (dateString: string): string => {
  if (!dateString) return ''

  // Check if it's already in YYYY-MM-DD format
  if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
    return dateString
  }

  // Convert DD-MM-YYYY to YYYY-MM-DD
  const parts = dateString.split('-')
  if (parts.length === 3) {
    const [day, month, year] = parts
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return dateString
}

export default function ProfileContent() {
  const { user: authUser } = useAuth()
  const [, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    provinceId: '',
    bankAccount: '',
    toBin: '',
    avatar: null as File | null,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [provinces, setProvinces] = useState<Province[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Load provinces
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true)
      try {
        const data = await getProvinces()
        setProvinces(data)
      } catch (error) {
        console.error('Error fetching provinces:', error)
        toast.error('Không thể tải danh sách tỉnh/thành phố')
      } finally {
        setLoadingProvinces(false)
      }
    }
    fetchProvinces()
  }, [])

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!authUser?.userId) return

      try {
        setLoading(true)
        const userData = await getUserById(authUser.userId)
        console.log('trung', userData)
        setUser(userData)
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
          dateOfBirth: userData.dateOfBirth ? convertDateFormat(userData.dateOfBirth) : '',
          gender: userData.gender || '',
          provinceId: userData.provinceId?.toString() || '',
          bankAccount: userData.bankAccount || '',
          toBin: userData.toBin || '',
          avatar: null,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        // Set avatar preview if user has existing avatar
        if (userData.avatar) {
          setAvatarPreview(userData.avatar)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
        toast.error('Không thể tải thông tin người dùng')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [authUser?.userId])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh hợp lệ')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB')
        return
      }

      setFormData((prev) => ({
        ...prev,
        avatar: file
      }))

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatar = () => {
    setFormData((prev) => ({
      ...prev,
      avatar: null
    }))
    setAvatarPreview(null)
  }

  const handleUpdateProfile = async () => {
    if (!authUser?.userId) return

    try {
      setUpdating(true)

      // Convert date from YYYY-MM-DD back to DD-MM-YYYY for API
      const formattedDateOfBirth = formData.dateOfBirth ? formData.dateOfBirth.split('-').reverse().join('-') : ''

      await updateUser(authUser.userId, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formattedDateOfBirth,
        gender: formData.gender,
        provinceId: formData.provinceId ? parseInt(formData.provinceId) : undefined,
        bankAccount: formData.bankAccount,
        toBin: formData.toBin,
        avatar: formData.avatar || undefined
      })

      toast.success('Cập nhật thông tin thành công!')

      // Reload user data
      const updatedUser = await getUserById(authUser.userId)
      setUser(updatedUser)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Cập nhật thông tin thất bại')
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error('Vui lòng nhập đầy đủ thông tin mật khẩu')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }

    if (formData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error('Mật khẩu mới phải khác mật khẩu hiện tại')
      return
    }

    if (!authUser?.email) {
      toast.error('Không thể lấy thông tin email người dùng')
      return
    }

    try {
      setChangingPassword(true)

      const response = await changePassword({
        email: authUser.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      })

      if (response.success) {
        toast.success(response.message || 'Đổi mật khẩu thành công!', {
          position: 'top-right',
          autoClose: 5000
        })

        // Clear password fields
        setFormData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
      } else {
        toast.error(response.message || 'Đổi mật khẩu thất bại')
      }
    } catch (error: unknown) {
      console.error('Change password error:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message ||
        (error as { message?: string }).message ||
        'Có lỗi xảy ra khi đổi mật khẩu'
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      })
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return <div className='flex justify-center items-center h-64'>Đang tải...</div>
  }

  return (
    <div className='max-w-2xl'>
      <h2 className='text-lg font-semibold text-gray-900 mb-6'>Thông tin cá nhân</h2>

      {/* Avatar Section */}
      <div className='bg-white p-6 rounded-lg border mb-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
          <Camera className='w-5 h-5 mr-2 text-green-600' />
          Ảnh đại diện
        </h3>

        <div className='flex items-center space-x-6'>
          {/* Avatar Display */}
          <div className='relative'>
            <div className='w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center'>
              {avatarPreview ? (
                <img src={avatarPreview} alt='Avatar preview' className='w-full h-full object-cover' />
              ) : (
                <User className='w-12 h-12 text-gray-400' />
              )}
            </div>
            {avatarPreview && (
              <button
                type='button'
                onClick={removeAvatar}
                className='absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors'
              >
                <X className='w-4 h-4' />
              </button>
            )}
          </div>

          {/* Upload Controls */}
          <div className='flex-1'>
            <div className='space-y-3'>
              <div>
                <Label htmlFor='avatar' className='text-sm font-medium text-gray-700'>
                  Chọn ảnh đại diện
                </Label>
                <Input
                  id='avatar'
                  type='file'
                  accept='image/*'
                  onChange={handleAvatarChange}
                  className='mt-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100'
                />
              </div>
              <div className='text-xs text-gray-500'>
                <p>• Định dạng: JPG, PNG, GIF</p>
                <p>• Kích thước tối đa: 5MB</p>
                <p>• Khuyến nghị: ảnh vuông, độ phân giải cao</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className='bg-white p-6 rounded-lg border'>
        <div className='grid grid-cols-2 gap-6'>
          <div>
            <Label htmlFor='firstName'>Họ</Label>
            <Input
              id='firstName'
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className='mt-1'
            />
          </div>
          <div>
            <Label htmlFor='lastName'>Tên</Label>
            <Input
              id='lastName'
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className='mt-1'
            />
          </div>
          <div>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className='mt-1'
            />
          </div>
          <div>
            <Label htmlFor='phoneNumber'>Số điện thoại</Label>
            <Input
              id='phoneNumber'
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className='mt-1'
            />
          </div>
          <div>
            <Label htmlFor='gender'>Giới tính</Label>
            <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
              <SelectTrigger className='mt-1'>
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
            <Label htmlFor='provinceId'>Tỉnh/Thành phố</Label>
            <div className='relative'>
              <MapPin className='absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10' />
              <Select
                value={formData.provinceId}
                onValueChange={(value) => handleInputChange('provinceId', value)}
                disabled={loadingProvinces}
              >
                <SelectTrigger className='mt-1 pl-10'>
                  <SelectValue placeholder={loadingProvinces ? 'Đang tải...' : 'Chọn tỉnh/thành phố'} />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem key={province.id} value={province.id.toString()}>
                      {province.name} - {province.region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor='dateOfBirth'>Ngày sinh</Label>
            <Input
              id='dateOfBirth'
              type='date'
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className='mt-1'
            />
          </div>
        </div>

        {/* Banking Information Section */}
        <div className='mt-6 pt-6 border-t border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
            <CreditCard className='w-5 h-5 mr-2 text-green-600' />
            Thông tin ngân hàng
          </h3>
          <div className='grid grid-cols-2 gap-6'>
            <div>
              <Label htmlFor='bankAccount'>Số tài khoản ngân hàng</Label>
              <div className='relative'>
                <CreditCard className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='bankAccount'
                  value={formData.bankAccount}
                  onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                  placeholder='Nhập số tài khoản ngân hàng'
                  className='mt-1 pl-10'
                />
              </div>
            </div>
            <div>
              <Label htmlFor='toBin'>Tên ngân hàng</Label>
              <div className='relative'>
                <Building2 className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='toBin'
                  value={formData.toBin}
                  onChange={(e) => handleInputChange('toBin', e.target.value)}
                  placeholder='Nhập tên ngân hàng (VD: ACBank, Vietcombank)'
                  className='mt-1 pl-10'
                />
              </div>
            </div>
          </div>
          <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
            <div className='text-sm text-blue-800'>
              <div className='font-medium mb-1'>💳 Lưu ý về thông tin ngân hàng:</div>
              <ul className='text-xs space-y-1 text-blue-700'>
                <li>✓ Thông tin ngân hàng sẽ được sử dụng để thanh toán và hoàn tiền</li>
                <li>✓ Đảm bảo số tài khoản chính xác để tránh lỗi giao dịch</li>
                <li>✓ Thông tin được mã hóa và bảo mật theo tiêu chuẩn quốc tế</li>
              </ul>
            </div>
          </div>
        </div>

        <div className='mt-6'>
          <Button
            className='bg-green-600 hover:bg-green-700 text-white'
            onClick={handleUpdateProfile}
            disabled={updating}
          >
            {updating ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
          </Button>
        </div>
      </div>

      {/* Change Password Section */}
      <div className='bg-white p-6 rounded-lg border mt-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Đổi mật khẩu</h3>
        <p className='text-sm text-gray-600 mb-6'>Cập nhật mật khẩu của bạn để đảm bảo tính bảo mật</p>

        <div className='space-y-4 max-w-md'>
          <div>
            <Label htmlFor='currentPassword'>Mật khẩu hiện tại</Label>
            <Input
              id='currentPassword'
              type='password'
              placeholder='Nhập mật khẩu hiện tại'
              value={formData.currentPassword}
              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
              className='mt-1'
            />
          </div>
          <div>
            <Label htmlFor='newPassword'>Mật khẩu mới</Label>
            <Input
              id='newPassword'
              type='password'
              placeholder='Nhập mật khẩu mới'
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              className='mt-1'
            />
          </div>
          <div>
            <Label htmlFor='confirmPassword'>Xác nhận mật khẩu mới</Label>
            <Input
              id='confirmPassword'
              type='password'
              placeholder='Nhập lại mật khẩu mới'
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className='mt-1'
            />
          </div>
        </div>

        {/* Password Requirements */}
        <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
          <div className='text-sm text-blue-800'>
            <div className='font-medium mb-1'>🛡️ Mẹo bảo mật:</div>
            <ul className='text-xs space-y-1 text-blue-700'>
              <li>✓ Sử dụng mật khẩu mạnh, ít nhất 8 ký tự bao gồm chữ và số</li>
              <li>✓ Tráy sử dụng mật khẩu dễ đoán như ngày sinh hoặc tên</li>
              <li>✓ Không chia sẻ mật khẩu với người khác, kể cả nhân viên</li>
            </ul>
          </div>
        </div>

        <div className='mt-6'>
          <Button
            className='bg-green-600 hover:bg-green-700 text-white'
            onClick={handleUpdatePassword}
            disabled={changingPassword}
          >
            {changingPassword ? 'Đang đổi mật khẩu...' : 'Cập nhật mật khẩu'}
          </Button>
          <Button
            variant='outline'
            className='ml-3'
            disabled={changingPassword}
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              }))
            }}
          >
            Hủy bỏ
          </Button>
        </div>
      </div>
    </div>
  )
}
