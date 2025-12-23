import { useState } from 'react'
import { User, LogOut, Menu, ChevronRight, Eye, EyeOff, Lock, Edit, Save, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { cn } from '../../lib/utils'
import { useAuth } from '../../contexts/auth.context'
import { changePassword, resetPassword } from '../../apis/auth.api'
import { toast } from '../../utils/toast'
import SideBar from './sideBar'
import { Outlet } from 'react-router-dom'

function StaffLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, logout } = useAuth()
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
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
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

  const menuItems = [
    { key: 'profile', icon: <User size={16} />, label: 'Thông tin cá nhân', isModal: true },
    //   { key: 'settings', icon: <Settings size={16} />, label: 'Cài đặt' },
    { key: 'logout', icon: <LogOut size={16} />, label: 'Đăng xuất', onClick: handleLogout }
  ]

  return (
    <div className='min-h-screen bg-gray-50 flex'>
      {/* Sidebar */}
      <SideBar isCollapsed={isCollapsed} />

      {/* Main Content */}
      <div className='flex-1 flex flex-col'>
        {/* Header */}
        <header className='bg-white px-6 py-4 shadow-sm border-b border-gray-200 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            {/* Toggle Button */}
            <Button variant='ghost' size='icon' onClick={toggleSidebar} className='h-8 w-8 hover:bg-gray-100'>
              {isCollapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
            </Button>

            {/* Logo */}
            <div className='flex items-center gap-2'>
              <svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none'>
                <path
                  d='M22 3.25C22 7.6875 18.6953 11.3555 14.4141 11.9219C14.1367 9.83594 13.2188 7.95312 11.8633 6.48047C13.3594 3.80859 16.2188 2 19.5 2H20.75C21.4414 2 22 2.55859 22 3.25ZM2 5.75C2 5.05859 2.55859 4.5 3.25 4.5H4.5C9.33203 4.5 13.25 8.41797 13.25 13.25V14.5V20.75C13.25 21.4414 12.6914 22 12 22C11.3086 22 10.75 21.4414 10.75 20.75V14.5C5.91797 14.5 2 10.582 2 5.75Z'
                  fill='#F4A261'
                />
              </svg>
              <h3 className='text-xl font-bold text-[#2D5016] whitespace-nowrap'>Tinh Hoa Quê Nhà</h3>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            {/* User Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='ghost'
                  className='flex items-center gap-2 px-3 py-2 hover:bg-gray-100 transition-colors'
                >
                  <Avatar className='h-8 w-8'>
                    <AvatarImage src={undefined} />
                    <AvatarFallback className='bg-blue-600 text-white text-sm'>
                      {user?.email?.charAt(0).toUpperCase() || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div className='text-left'>
                    <div className='text-sm text-gray-500'>{user?.roleName || 'Staff'}</div>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-56 p-1' align='end'>
                <div className='space-y-1'>
                  {menuItems.map((item, index) => (
                    <div key={item.key}>
                      {index === 2 && <div className='border-t border-gray-200 my-1' />}
                      {item.isModal ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant='ghost' className='w-full justify-start gap-2 h-9 px-3 text-sm'>
                              {item.icon}
                              {item.label}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className='max-w-md'>
                            <DialogHeader>
                              <DialogTitle>Thông tin cá nhân</DialogTitle>
                            </DialogHeader>
                            <div className='space-y-4'>
                              <div className='flex items-center gap-4'>
                                <Avatar className='h-16 w-16'>
                                  <AvatarImage src={undefined} />
                                  <AvatarFallback className='bg-blue-600 text-white text-xl'>
                                    {user?.email?.charAt(0).toUpperCase() || 'S'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className='text-lg font-semibold'>{user?.email || 'staff@example.com'}</h3>
                                  <p className='text-sm text-gray-500'>{user?.roleName || 'Staff'}</p>
                                </div>
                              </div>
                              <div className='space-y-3'>
                                <div className='flex justify-between items-center py-2 border-b border-gray-100'>
                                  <span className='text-sm font-medium text-gray-600'>Email:</span>
                                  <span className='text-sm text-gray-900'>{user?.email || 'staff@example.com'}</span>
                                </div>
                                <div className='flex justify-between items-center py-2 border-b border-gray-100'>
                                  <span className='text-sm font-medium text-gray-600'>Vai trò:</span>
                                  <span className='text-sm text-gray-900'>{user?.roleName || 'Staff'}</span>
                                </div>

                                {/* Change Password Section */}
                                <div className='pt-3 border-t border-gray-200'>
                                  <div className='flex items-center justify-between mb-3'>
                                    <div className='flex items-center gap-2'>
                                      <Lock className='w-4 h-4 text-gray-600' />
                                      <span className='text-sm font-medium text-gray-900'>Đổi mật khẩu</span>
                                    </div>
                                    <div className='flex items-center gap-2'>
                                      {!isEditingPassword && (
                                        <Button
                                          variant='ghost'
                                          size='sm'
                                          onClick={() => setIsEditingPassword(true)}
                                          className='h-7 px-2'
                                        >
                                          <Edit className='w-3 h-3 mr-1' />
                                          Sửa
                                        </Button>
                                      )}
                                      <button
                                        type='button'
                                        onClick={handleForgotPassword}
                                        className='text-sm text-blue-600 hover:text-blue-700 hover:underline h-7 px-2'
                                      >
                                        Quên mật khẩu?
                                      </button>
                                    </div>
                                  </div>

                                  {isEditingPassword ? (
                                    <div className='space-y-3'>
                                      <div className='space-y-2'>
                                        <Label htmlFor='current-password'>Mật khẩu hiện tại *</Label>
                                        <div className='relative'>
                                          <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                                          <Input
                                            id='current-password'
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder='Nhập mật khẩu hiện tại'
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className='pl-10 pr-10'
                                          />
                                          <button
                                            type='button'
                                            onClick={() => setShowPassword(!showPassword)}
                                            className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                                          >
                                            {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                                          </button>
                                        </div>
                                      </div>
                                      <div className='space-y-2'>
                                        <Label htmlFor='new-password'>Mật khẩu mới *</Label>
                                        <div className='relative'>
                                          <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                                          <Input
                                            id='new-password'
                                            type={showNewPassword ? 'text' : 'password'}
                                            placeholder='Nhập mật khẩu mới (tối thiểu 8 ký tự)'
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className='pl-10 pr-10'
                                          />
                                          <button
                                            type='button'
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                                          >
                                            {showNewPassword ? (
                                              <EyeOff className='h-4 w-4' />
                                            ) : (
                                              <Eye className='h-4 w-4' />
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                      <div className='space-y-2'>
                                        <Label htmlFor='confirm-password'>Xác nhận mật khẩu mới *</Label>
                                        <div className='relative'>
                                          <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                                          <Input
                                            id='confirm-password'
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder='Nhập lại mật khẩu mới'
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className='pl-10 pr-10'
                                          />
                                          <button
                                            type='button'
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                                          >
                                            {showConfirmPassword ? (
                                              <EyeOff className='h-4 w-4' />
                                            ) : (
                                              <Eye className='h-4 w-4' />
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                      <div className='flex gap-2'>
                                        <Button
                                          variant='outline'
                                          size='sm'
                                          onClick={handleCancelPasswordEdit}
                                          disabled={changingPassword}
                                          className='flex-1'
                                        >
                                          <X className='w-4 h-4 mr-1' />
                                          Hủy
                                        </Button>
                                        <Button
                                          variant='blue'
                                          size='sm'
                                          onClick={handleChangePassword}
                                          disabled={
                                            changingPassword ||
                                            !currentPassword.trim() ||
                                            !newPassword.trim() ||
                                            !confirmPassword.trim()
                                          }
                                          className='flex-1'
                                        >
                                          {changingPassword ? (
                                            <>
                                              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1'></div>
                                              Đang lưu...
                                            </>
                                          ) : (
                                            <>
                                              <Save className='w-4 h-4 mr-1' />
                                              Lưu
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className='text-center py-4 text-gray-500 text-sm'>
                                      Nhấn "Sửa" để thay đổi mật khẩu
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Button
                          variant='ghost'
                          className={cn(
                            'w-full justify-start gap-2 h-9 px-3 text-sm',
                            item.key === 'logout' && 'text-red-600 hover:text-red-700 hover:bg-red-50'
                          )}
                          onClick={item.onClick}
                        >
                          {item.icon}
                          {item.label}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Content */}
        <main className='flex-1 m-6 p-6 bg-white rounded-lg shadow-sm overflow-auto'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default StaffLayout
