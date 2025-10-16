import { useState, useEffect } from 'react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { useAuth } from '../../../../contexts/auth.context'
import { getUserById, updateUser, type User } from '../../../../apis/user.api'
import { toast } from 'react-toastify'

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
  const [, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

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
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
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
        dateOfBirth: formattedDateOfBirth
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
    if (!formData.newPassword || !formData.confirmPassword) {
      toast.error('Vui lòng nhập đầy đủ thông tin mật khẩu')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }

    // TODO: Implement password update API call
    toast.info('Chức năng đổi mật khẩu sẽ được triển khai sau')
  }

  if (loading) {
    return <div className='flex justify-center items-center h-64'>Đang tải...</div>
  }

  return (
    <div className='max-w-2xl'>
      <h2 className='text-lg font-semibold text-gray-900 mb-6'>Thông tin cá nhân</h2>

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
          <div className='col-span-2'>
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
          <Button className='bg-green-600 hover:bg-green-700 text-white' onClick={handleUpdatePassword}>
            Cập nhật mật khẩu
          </Button>
          <Button variant='outline' className='ml-3'>
            Hủy bỏ
          </Button>
        </div>
      </div>
    </div>
  )
}
