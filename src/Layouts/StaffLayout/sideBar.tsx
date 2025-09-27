import { Layout, Menu } from 'antd'
import {
  BarChart3,
  Store,
  CheckCircle,
  CreditCard,
  FileText,
  Shield,
  Settings,
  Leaf,
  LibraryBig,
  ShoppingCart,
  Package
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import path from '../../constants/path'

const { Sider } = Layout

function SideBar() {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: path.BASE_STAFF,
      label: 'Dashboard',
      icon: <BarChart3 size={18} />
    },
    {
      key: 'store-management',
      label: 'Quản lý cửa hàng',
      icon: <Store size={18} />,
      children: [
        {
          key: path.storesStaff,
          label: 'Danh sách cửa hàng',
          icon: <Store size={16} />
        },
        {
          key: path.approveStoresStaff,
          label: 'Duyệt cửa hàng',
          icon: <CheckCircle size={16} />
        },
        {
          key: path.lockedStoresStaff,
          label: 'Cửa hàng bị khóa',
          icon: <Shield size={16} />
        }
      ]
    },
    {
      key: path.managerProductStaff,
      label: 'Quản lý sản phẩm',
      icon: <CheckCircle size={18} />
    },
    {
      key: path.productCategoryStaff,
      label: 'Quản lý danh mục',
      icon: <Package size={18} />
    },
    {
      key: path.Order_Management_Staff,
      label: 'Quản lý đơn hàng',
      icon: <ShoppingCart size={18} />
    },
    {
      key: path.transactionsStaff,
      label: 'Giao dịch',
      icon: <CreditCard size={18} />
    },
    {
      key: path.reportsStaff,
      label: 'Báo cáo',
      icon: <FileText size={18} />
    },
    {
      key: path.blogStaff,
      label: 'Blog / Nội dung',
      icon: <LibraryBig size={18} />
    },
    {
      key: path.complianceStaff,
      label: 'Tuân thủ & Rủi ro',
      icon: <Shield size={18} />
    },
    {
      key: path.settingsStaff,
      label: 'Cài đặt / Quản trị',
      icon: <Settings size={18} />
    }
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    // Nếu key là relative path, cần kết hợp với base path
    const fullPath = key.startsWith('/') ? key : `${path.BASE_STAFF}/${key}`
    navigate(fullPath)
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
