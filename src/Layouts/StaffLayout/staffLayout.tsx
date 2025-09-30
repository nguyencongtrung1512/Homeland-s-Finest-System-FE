import { useState } from 'react'
import { Layout, Dropdown, Avatar } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import SideBar from './sideBar'
import { Outlet } from 'react-router-dom'

const { Header, Content } = Layout

function StaffLayout() {
  const [userData] = useState({
    email: 'staff@example.com'
  })

  const handleLogout = () => {
    console.log('Logout')
    // Implement logout logic here
  }

  const items: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: 'Thông tin cá nhân' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Cài đặt' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout }
  ]

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
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
            {/* Logo */}
            <div className='mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-3 flex-nowrap'>
              {/* Logo + Tên */}
              <div className='flex items-center gap-2'>
                <svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none'>
                  <path d='M24 24H0V0H24V24Z' stroke='#ecf2ea' />
                  <path
                    d='M22 3.25C22 7.6875 18.6953 11.3555 14.4141 11.9219C14.1367 9.83594 13.2188 7.95312 11.8633 6.48047C13.3594 3.80859 16.2188 2 19.5 2H20.75C21.4414 2 22 2.55859 22 3.25ZM2 5.75C2 5.05859 2.55859 4.5 3.25 4.5H4.5C9.33203 4.5 13.25 8.41797 13.25 13.25V14.5V20.75C13.25 21.4414 12.6914 22 12 22C11.3086 22 10.75 21.4414 10.75 20.75V14.5C5.91797 14.5 2 10.582 2 5.75Z'
                    fill='#F4A261'
                  />
                </svg>
                <h3 className='text-xl font-bold text-[#2D5016] whitespace-nowrap'>Tinh Hoa Quê Nhà</h3>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                <Avatar size='small' style={{ backgroundColor: '#1890ff' }} src={userData.email}>
                  {userData.email.charAt(0)}
                </Avatar>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: '#8c8c8c', fontSize: '17px' }}>{userData.email}</div>
                </div>
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
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default StaffLayout
