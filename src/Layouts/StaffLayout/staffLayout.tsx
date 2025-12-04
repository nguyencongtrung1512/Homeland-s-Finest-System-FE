import { useState } from 'react'
import { User, LogOut, Settings, Menu, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { cn } from '../../lib/utils'
import { useAuth } from '../../contexts/auth.context'
import SideBar from './sideBar'
import { Outlet } from 'react-router-dom'

function StaffLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, logout } = useAuth()

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

  const menuItems = [
    { key: 'profile', icon: <User size={16} />, label: 'Thông tin cá nhân', isModal: true },
    { key: 'settings', icon: <Settings size={16} />, label: 'Cài đặt' },
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


                                <div className='flex justify-between items-center py-2'>
                                  <span className='text-sm font-medium text-gray-600'>Token hết hạn:</span>
                                  <span className='text-sm text-gray-900'>
                                    {user?.expiresAt ? new Date(user.expiresAt).toLocaleDateString('vi-VN') : 'N/A'}
                                  </span>
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
