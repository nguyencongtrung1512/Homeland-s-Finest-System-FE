import { Layout, Dropdown, Avatar, Alert, Spin } from 'antd'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import SideBar from './sideBar'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/auth.context'
import { useStore } from '../../contexts/store.context'
import { toast } from '../../utils/toast'
import { useState } from 'react'
import { getUserById, updateUser, type User } from '../../apis/user.api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import GlowCard from '../../components/ui/spotlight-card'
import { formatDate, formatDateTime } from '../../utils/formatDate'
import { Edit, Save, X, Upload, Eye, EyeOff, Lock } from 'lucide-react'
import { changePassword, resetPassword } from '../../apis/auth.api'

const { Header, Content } = Layout

function SellerLayout() {
  const { user, logout } = useAuth()
  const { store, loading, isStoreApproved } = useStore()
  const navigate = useNavigate()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [userInfo, setUserInfo] = useState<User | null>(null)
  const [loadingUserInfo, setLoadingUserInfo] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    dateOfBirth: ''
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Có lỗi xảy ra khi đăng xuất')
    }
  }

  const handleProfileClick = async () => {
    if (!user?.userId) {
      toast.error('Không tìm thấy thông tin người dùng')
      return
    }

    setIsProfileModalOpen(true)
    setLoadingUserInfo(true)

    try {
      const userData = await getUserById(user.userId)
      setUserInfo(userData)
      // Initialize form với dữ liệu hiện tại
      setEditForm({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        gender: userData.gender || '',
        dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : ''
      })
      setAvatarPreview(userData.avatar || null)
    } catch (error) {
      console.error('Error fetching user info:', error)
      toast.error('Không thể tải thông tin cá nhân')
    } finally {
      setLoadingUserInfo(false)
    }
  }

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false)
    setUserInfo(null)
    setIsEditMode(false)
    setAvatarFile(null)
    setAvatarPreview(null)
    setIsEditingPassword(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleEditClick = () => {
    setIsEditMode(true)
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setAvatarFile(null)
    if (userInfo) {
      setEditForm({
        firstName: userInfo.firstName || '',
        lastName: userInfo.lastName || '',
        email: userInfo.email || '',
        phoneNumber: userInfo.phoneNumber || '',
        gender: userInfo.gender || '',
        dateOfBirth: userInfo.dateOfBirth ? userInfo.dateOfBirth.split('T')[0] : ''
      })
      setAvatarPreview(userInfo.avatar || null)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('File phải là hình ảnh')
        return
      }
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user?.userId || !userInfo) {
      toast.error('Không tìm thấy thông tin người dùng')
      return
    }

    setIsUpdating(true)
    try {
      await updateUser(user.userId, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phoneNumber: editForm.phoneNumber,
        gender: editForm.gender || undefined,
        dateOfBirth: editForm.dateOfBirth || undefined,
        avatar: avatarFile || avatarPreview || undefined,
        role: userInfo.role
      })

      toast.success('Cập nhật thông tin thành công')
      setIsEditMode(false)
      // Refresh user info
      const updatedUserData = await getUserById(user.userId)
      setUserInfo(updatedUserData)
      setAvatarFile(null)
    } catch (error: unknown) {
      console.error('Error updating profile:', error)
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(errorMessage || 'Có lỗi xảy ra khi cập nhật thông tin')
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle cancel password edit
  const handleCancelPasswordEdit = () => {
    setIsEditingPassword(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  // Handle change password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Vui lòng nhập đầy đủ thông tin mật khẩu', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    if (newPassword.length < 8) {
      toast.error('Mật khẩu mới phải có ít nhất 8 ký tự', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    if (currentPassword === newPassword) {
      toast.error('Mật khẩu mới phải khác mật khẩu hiện tại', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    if (!user?.email) {
      toast.error('Không thể lấy thông tin email người dùng', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    try {
      setChangingPassword(true)
      const response = await changePassword({
        email: user.email,
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword
      })

      if (response.success) {
        toast.success(response.message || 'Đổi mật khẩu thành công!', {
          position: 'top-right',
          autoClose: 5000
        })

        // Clear password fields
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setIsEditingPassword(false)
      } else {
        toast.error(response.message || 'Đổi mật khẩu thất bại', {
          position: 'top-right',
          autoClose: 5000
        })
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

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!user?.email) {
      toast.error('Không thể lấy thông tin email người dùng', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    try {
      const response = await resetPassword({ email: user.email })

      if (response.success) {
        toast.success(
          response.message || 'Email đặt lại mật khẩu đã được gửi đến địa chỉ email của bạn. Vui lòng kiểm tra hộp thư!',
          {
            position: 'top-right',
            autoClose: 5000
          }
        )
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi gửi email đặt lại mật khẩu', {
          position: 'top-right',
          autoClose: 5000
        })
      }
    } catch (error: unknown) {
      console.error('Reset password error:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message ||
        (error as { message?: string }).message ||
        'Có lỗi xảy ra khi gửi email đặt lại mật khẩu'
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      })
    }
  }

  const items: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: handleProfileClick
    },
    // {
    //   key: 'settings',
    //   icon: <SettingOutlined />,
    //   label: 'Cài đặt'
    // },
    // {
    //   type: 'divider'
    // },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout
    }
  ]

  const getStoreStatusMessage = () => {
    if (!store) return null

    switch (store.status) {
      case 'Pending':
        return {
          type: 'warning' as const,
          message: 'Cửa hàng đang chờ duyệt',
          description:
            'Cửa hàng của bạn đang được xem xét. Vui lòng chờ admin phê duyệt để sử dụng đầy đủ các chức năng.'
        }
      case 'Processing':
        return {
          type: 'info' as const,
          message: 'Cửa hàng đang được xử lý',
          description: 'Nhân viên đang xem xét hồ sơ cửa hàng của bạn. Vui lòng chờ thông báo kết quả.'
        }
      case 'ApprovedByStaff':
        return {
          type: 'info' as const,
          message: 'Cửa hàng đang được xử lý',
          description: 'Nhân viên đã phê duyệt hồ sơ cửa hàng của bạn. Hồ sơ đang chờ phê duyệt cuối cùng.'
        }
      case 'Rejected':
        return {
          type: 'error' as const,
          message: 'Cửa hàng bị từ chối',
          description: 'Hồ sơ cửa hàng của bạn không được phê duyệt. Vui lòng kiểm tra lý do và cập nhật lại thông tin.'
        }
      case 'RejectedByStaff':
        return {
          type: 'error' as const,
          message: 'Cửa hàng bị từ chối',
          description: 'Nhân viên đã từ chối hồ sơ cửa hàng của bạn. Vui lòng kiểm tra lý do và cập nhật lại thông tin.'
        }
      case 'Inactive':
        return {
          type: 'error' as const,
          message: 'Cửa hàng bị tạm khóa',
          description: 'Cửa hàng của bạn đã bị tạm khóa. Vui lòng liên hệ hệ thống để biết thêm chi tiết.'
        }
      default:
        return null
    }
  }

  const statusMessage = getStoreStatusMessage()
  const isStoreLocked =
    store?.status === 'Inactive' ||
    store?.sellerInfo?.sellerStatus === 'Blocked' ||
    store?.sellerInfo?.userInfo?.isActive === false
  const banAt = store?.sellerInfo?.userInfo?.banAt
  const banUntil = store?.sellerInfo?.userInfo?.banUntil

  return (
    <Layout style={{ minHeight: '80vh', background: '#f5f5f5' }}>
      {/* Sidebar */}
      <SideBar />

      {/* Main Content */}
      <Layout>
        {/* Header */}
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {loading ? (
              <Spin size='small' />
            ) : store ? (
              <>
                {store.logoUrl && (
                  <img
                    src={store.logoUrl}
                    alt={
                      'https://scontent.fsgn5-5.fna.fbcdn.net/v/t39.30808-6/465035753_1661013661514519_1627670806811343264_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=PFDv70GMAE0Q7kNvwHKSana&_nc_oc=Adn6_bjmEcV-eG4Lk8x__vuKd5XrkJu0bRmE1yK-YaQaFb674mU39Oq07QYtpcCC7o4&_nc_zt=23&_nc_ht=scontent.fsgn5-5.fna&_nc_gid=AoVsEpG6hQXUQkBcR78alw&oh=00_AffdkOwAWOAq57uKV5kZc2cXHFSkZD_tzrQFKdzwUcaqZw&oe=690AB036'
                    }
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '17px',
                      objectFit: 'cover',
                      border: '1px solid #e0e0e0'
                    }}
                  />
                )}
                <div>
                  <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#262626' }}>
                    Xin chào, <span style={{ color: '#16a34a' }}>{store.storeName || 'Cửa hàng'}</span>
                  </h1>
                </div>
              </>
            ) : (
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#262626' }}>Dashboard Seller</h1>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Store Status Indicator */}
            {loading && <Spin size='small' />}
            {store && !isStoreApproved && (
              <div
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor:
                    statusMessage?.type === 'warning'
                      ? '#fff7e6'
                      : statusMessage?.type === 'error'
                        ? '#fff2f0'
                        : '#e6f7ff',
                  border: `1px solid ${statusMessage?.type === 'warning'
                    ? '#ffd591'
                    : statusMessage?.type === 'error'
                      ? '#ffccc7'
                      : '#91d5ff'
                    }`,
                  fontSize: '12px',
                  color:
                    statusMessage?.type === 'warning'
                      ? '#d46b08'
                      : statusMessage?.type === 'error'
                        ? '#cf1322'
                        : '#0958d9'
                }}
              >
                {statusMessage?.message}
              </div>
            )}

            {/* User Dropdown */}
            <Dropdown menu={{ items }} placement='bottomRight' arrow>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Avatar size='small' icon={<UserOutlined />} style={{ backgroundColor: '#16a34a' }} />
                <span style={{ color: '#262626', fontSize: '14px' }}>{user?.email || 'N/A'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#fff',
            borderRadius: '8px',
            overflow: 'auto'
          }}
        >
          {isStoreLocked && (
            <Alert
              type='warning'
              showIcon
              message='Tài khoản/Cửa hàng đang bị khóa'
              description={
                <>
                  {banAt && (
                    <div>
                      Khóa từ: <strong>{formatDateTime(banAt)}</strong>
                    </div>
                  )}
                  {banUntil && (
                    <div>
                      Dự kiến mở khóa: <strong>{formatDateTime(banUntil)}</strong>
                    </div>
                  )}
                  {!banAt && !banUntil && <div>Vui lòng liên hệ hỗ trợ để biết chi tiết.</div>}
                </>
              }
              style={{ marginBottom: '16px' }}
            />
          )}
          {/* Store Status Alert */}
          {statusMessage && (
            <Alert
              type={statusMessage.type}
              message={statusMessage.message}
              description={statusMessage.description}
              showIcon
              style={{ marginBottom: '24px' }}
              closable
            />
          )}

          {/* Main Content - Always show outlet to allow viewing pages */}
          <Outlet />
        </Content>
      </Layout>

      {/* Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={handleCloseProfileModal}>
        <DialogContent className='max-w-2xl p-0 border-none bg-transparent shadow-none max-h-[90vh] overflow-hidden flex flex-col'>
          <GlowCard glowColor='green' customSize={true} width='100%' className='max-w-2xl mx-auto h-full flex flex-col'>
            <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 48px)' }}>
              <DialogHeader>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px'
                  }}
                >
                  <DialogTitle style={{ fontSize: '24px', fontWeight: '600', color: '#262626', margin: 0 }}>
                    Thông tin cá nhân
                  </DialogTitle>
                  {!isEditMode && userInfo && (
                    <Button onClick={handleEditClick} variant='outline' size='sm'>
                      <Edit className='w-4 h-4 mr-2' />
                      Chỉnh sửa
                    </Button>
                  )}
                </div>
              </DialogHeader>

              {loadingUserInfo ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                  <Spin size='large' />
                </div>
              ) : userInfo ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Avatar Section */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <div style={{ position: 'relative' }}>
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt='Avatar'
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #16a34a'
                          }}
                        />
                      ) : (
                        <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#16a34a' }} />
                      )}
                      {isEditMode && (
                        <label
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            background: '#16a34a',
                            color: 'white',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            border: '2px solid white'
                          }}
                        >
                          <Upload className='w-4 h-4' />
                          <input
                            type='file'
                            accept='image/*'
                            onChange={handleAvatarChange}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}
                    </div>
                    <div>
                      {isEditMode ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ flex: 1 }}>
                              <Label htmlFor='firstName' className='text-xs text-gray-600'>
                                Họ
                              </Label>
                              <Input
                                id='firstName'
                                value={editForm.firstName}
                                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                placeholder='Nhập họ'
                                className='mt-1'
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <Label htmlFor='lastName' className='text-xs text-gray-600'>
                                Tên
                              </Label>
                              <Input
                                id='lastName'
                                value={editForm.lastName}
                                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                placeholder='Nhập tên'
                                className='mt-1'
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#262626' }}>
                            {userInfo.firstName && userInfo.lastName
                              ? `${userInfo.firstName} ${userInfo.lastName}`
                              : userInfo.email}
                          </h3>
                          <p style={{ margin: '4px 0 0 0', color: '#8c8c8c', fontSize: '14px' }}>{userInfo.role}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* User Information Grid */}
                  {isEditMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <Label htmlFor='email' className='text-xs text-gray-600'>
                          Email
                        </Label>
                        <Input
                          id='email'
                          type='email'
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          placeholder='Nhập email'
                          className='mt-1'
                        />
                      </div>

                      <div>
                        <Label htmlFor='phoneNumber' className='text-xs text-gray-600'>
                          Số điện thoại
                        </Label>
                        <Input
                          id='phoneNumber'
                          value={editForm.phoneNumber}
                          onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                          placeholder='Nhập số điện thoại'
                          className='mt-1'
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <Label htmlFor='gender' className='text-xs text-gray-600'>
                            Giới tính
                          </Label>
                          <select
                            id='gender'
                            value={editForm.gender}
                            onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                            className='mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm'
                          >
                            <option value=''>Chọn giới tính</option>
                            <option value='Male'>Nam</option>
                            <option value='Female'>Nữ</option>
                          </select>
                        </div>

                        <div>
                          <Label htmlFor='dateOfBirth' className='text-xs text-gray-600'>
                            Ngày sinh
                          </Label>
                          <Input
                            id='dateOfBirth'
                            type='date'
                            value={editForm.dateOfBirth}
                            onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                            className='mt-1'
                          />
                        </div>
                      </div>



                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <Button onClick={handleCancelEdit} variant='outline' className='flex-1' disabled={isUpdating}>
                          <X className='w-4 h-4 mr-2' />
                          Hủy
                        </Button>
                        <Button
                          onClick={handleUpdateProfile}
                          className='flex-1 bg-green-600 hover:bg-green-700'
                          disabled={isUpdating}
                        >
                          <Save className='w-4 h-4 mr-2' />
                          {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ padding: '12px', background: 'rgba(22, 163, 74, 0.05)', borderRadius: '8px' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>Email</p>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#262626' }}>
                          {userInfo.email || 'N/A'}
                        </p>
                      </div>

                      <div style={{ padding: '12px', background: 'rgba(22, 163, 74, 0.05)', borderRadius: '8px' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>
                          Số điện thoại
                        </p>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#262626' }}>
                          {userInfo.phoneNumber || 'N/A'}
                        </p>
                      </div>

                      <div style={{ padding: '12px', background: 'rgba(22, 163, 74, 0.05)', borderRadius: '8px' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>Giới tính</p>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#262626' }}>
                          {userInfo.gender === 'Male'
                            ? 'Nam'
                            : userInfo.gender === 'Female'
                              ? 'Nữ'
                              : userInfo.gender || 'N/A'}
                        </p>
                      </div>

                      <div style={{ padding: '12px', background: 'rgba(22, 163, 74, 0.05)', borderRadius: '8px' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>Ngày sinh</p>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#262626' }}>
                          {userInfo.dateOfBirth ? new Date(userInfo.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A'}
                        </p>
                      </div>



                      <div style={{ padding: '12px', background: 'rgba(22, 163, 74, 0.05)', borderRadius: '8px' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>Trạng thái</p>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#262626' }}>
                          {userInfo.isActive ? (
                            <span style={{ color: '#16a34a' }}>Hoạt động</span>
                          ) : (
                            <span style={{ color: '#dc2626' }}>Không hoạt động</span>
                          )}
                        </p>
                      </div>

                      {userInfo.createdAt !== undefined && (
                        <div style={{ padding: '12px', background: 'rgba(22, 163, 74, 0.05)', borderRadius: '8px' }}>
                          <p style={{ margin: 0, fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>
                            Ngày tham gia
                          </p>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#262626' }}>
                            {formatDate(userInfo.createdAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Change Password Section */}
                  <div
                    style={{
                      marginTop: '24px',
                      paddingTop: '24px',
                      borderTop: '1px solid #e5e7eb'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Lock className='w-4 h-4' style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#262626' }}>Đổi mật khẩu</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!isEditingPassword && (
                          <Button
                            onClick={() => setIsEditingPassword(true)}
                            variant='outline'
                            size='sm'
                            style={{ height: '28px', padding: '0 12px' }}
                          >
                            <Edit className='w-3 h-3 mr-1' />
                            Sửa
                          </Button>
                        )}
                        <button
                          type='button'
                          onClick={handleForgotPassword}
                          style={{
                            fontSize: '12px',
                            color: '#2563eb',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            height: '28px'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                        >
                          Quên mật khẩu?
                        </button>
                      </div>
                    </div>

                    {isEditingPassword ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <Label htmlFor='current-password' className='text-xs text-gray-600'>
                            Mật khẩu hiện tại *
                          </Label>
                          <div style={{ position: 'relative' }}>
                            <Lock
                              className='absolute'
                              style={{
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '16px',
                                height: '16px',
                                color: '#9ca3af',
                                pointerEvents: 'none'
                              }}
                            />
                            <Input
                              id='current-password'
                              type={showPassword ? 'text' : 'password'}
                              placeholder='Nhập mật khẩu hiện tại'
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className='mt-1 pl-10 pr-10'
                            />
                            <button
                              type='button'
                              onClick={() => setShowPassword(!showPassword)}
                              style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#9ca3af'
                              }}
                            >
                              {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor='new-password' className='text-xs text-gray-600'>
                            Mật khẩu mới *
                          </Label>
                          <div style={{ position: 'relative' }}>
                            <Lock
                              className='absolute'
                              style={{
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '16px',
                                height: '16px',
                                color: '#9ca3af',
                                pointerEvents: 'none'
                              }}
                            />
                            <Input
                              id='new-password'
                              type={showNewPassword ? 'text' : 'password'}
                              placeholder='Nhập mật khẩu mới (tối thiểu 8 ký tự)'
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className='mt-1 pl-10 pr-10'
                            />
                            <button
                              type='button'
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#9ca3af'
                              }}
                            >
                              {showNewPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor='confirm-password' className='text-xs text-gray-600'>
                            Xác nhận mật khẩu mới *
                          </Label>
                          <div style={{ position: 'relative' }}>
                            <Lock
                              className='absolute'
                              style={{
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '16px',
                                height: '16px',
                                color: '#9ca3af',
                                pointerEvents: 'none'
                              }}
                            />
                            <Input
                              id='confirm-password'
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder='Nhập lại mật khẩu mới'
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className='mt-1 pl-10 pr-10'
                            />
                            <button
                              type='button'
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#9ca3af'
                              }}
                            >
                              {showConfirmPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                            </button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                          <Button
                            onClick={handleCancelPasswordEdit}
                            variant='outline'
                            className='flex-1'
                            disabled={changingPassword}
                          >
                            <X className='w-4 h-4 mr-2' />
                            Hủy
                          </Button>
                          <Button
                            onClick={handleChangePassword}
                            className='flex-1 bg-green-600 hover:bg-green-700'
                            disabled={
                              changingPassword ||
                              !currentPassword.trim() ||
                              !newPassword.trim() ||
                              !confirmPassword.trim()
                            }
                          >
                            {changingPassword ? (
                              <>
                                <div
                                  className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'
                                  style={{ display: 'inline-block' }}
                                ></div>
                                Đang lưu...
                              </>
                            ) : (
                              <>
                                <Save className='w-4 h-4 mr-2' />
                                Lưu
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '16px',
                          color: '#9ca3af',
                          fontSize: '14px',
                          background: 'rgba(22, 163, 74, 0.05)',
                          borderRadius: '8px'
                        }}
                      >
                        Nhấn "Sửa" để thay đổi mật khẩu
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
                  Không thể tải thông tin cá nhân
                </div>
              )}
            </div>
          </GlowCard>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

export default SellerLayout
