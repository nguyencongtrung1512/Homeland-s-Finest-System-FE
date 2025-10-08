import { Layout, Dropdown, Avatar, Alert, Spin } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import SideBar from './sideBar'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/auth.context'
import { useStore } from '../../contexts/store.context'
import { toast } from 'react-toastify'

const { Header, Content } = Layout

function SellerLayout() {
  const { user, logout } = useAuth()
  const { store, loading, isStoreApproved } = useStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Có lỗi xảy ra khi đăng xuất')
    }
  }

  const items: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt'
    },
    {
      type: 'divider'
    },
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
      case 'ReviewedByStaff':
        return {
          type: 'info' as const,
          message: 'Cửa hàng đã được nhân viên xem xét',
          description: 'Hồ sơ cửa hàng đã được nhân viên xem xét và chuyển lên admin để phê duyệt cuối cùng.'
        }
      case 'Rejected':
        return {
          type: 'error' as const,
          message: 'Cửa hàng bị từ chối',
          description: 'Hồ sơ cửa hàng của bạn không được phê duyệt. Vui lòng kiểm tra lý do và cập nhật lại thông tin.'
        }
      case 'Inactive':
        return {
          type: 'error' as const,
          message: 'Cửa hàng bị tạm khóa',
          description: 'Cửa hàng của bạn đã bị tạm khóa. Vui lòng liên hệ admin để biết thêm chi tiết.'
        }
      default:
        return null
    }
  }

  const statusMessage = getStoreStatusMessage()

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
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#262626' }}>Dashboard Seller</h1>
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
                  border: `1px solid ${
                    statusMessage?.type === 'warning'
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

          {/* Main Content */}
          {!isStoreApproved && store ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
              <h2 style={{ color: '#595959', marginBottom: '8px' }}>Cửa hàng chưa được phê duyệt</h2>
              <p style={{ color: '#8c8c8c', marginBottom: '24px' }}>
                Bạn chỉ có thể truy cập một số chức năng cơ bản cho đến khi cửa hàng được phê duyệt.
              </p>
              <div
                style={{
                  background: '#fafafa',
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px',
                  padding: '16px',
                  maxWidth: '500px',
                  margin: '0 auto'
                }}
              >
                <h4 style={{ margin: '0 0 8px 0', color: '#262626' }}>Trạng thái hiện tại:</h4>
                <p style={{ margin: 0, color: '#595959' }}>
                  <strong>{store.storeName}</strong> - {statusMessage?.message}
                </p>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </Content>
      </Layout>
    </Layout>
  )
}

export default SellerLayout
