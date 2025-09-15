import { Layout, Menu } from 'antd'
import { BarChart3, CheckCircle, FileText, Leaf, User2Icon } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import path from '../../constants/path'

const { Sider } = Layout

function SideBar() {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: path.BASE_ADMIN,
      label: 'Dashboard',
      icon: <BarChart3 size={18} />
    },
    {
      key: path.STORE_MANAGEMENT_ADMIN,
      label: 'Quản lý cửa hàng',
      icon: <CheckCircle size={18} />
    },
    {
      key: path.ACCOUNT_MANAGEMENT_ADMIN,
      label: 'Quản lí tài khoản',
      icon: <User2Icon size={18} />
    },
    {
      key: path.TERMS_MANAGEMENT_ADMIN,
      label: 'Điều khoản dịch vụ',
      icon: <FileText size={18} />
    }
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  return (
    <Sider
      width={256}
      style={{
        background: '#fff',
        borderRight: '1px solid #f0f0f0'
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            background: '#1890ff',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Leaf size={20} color='white' />
        </div>
        <span
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#1890ff'
          }}
        >
          StaffPanel
        </span>
      </div>

      {/* Navigation Menu */}
      <Menu
        mode='inline'
        selectedKeys={[location.pathname]}
        defaultOpenKeys={['store-management']}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          border: 'none',
          background: '#fff'
        }}
        className='custom-menu'
      />
    </Sider>
  )
}

export default SideBar
