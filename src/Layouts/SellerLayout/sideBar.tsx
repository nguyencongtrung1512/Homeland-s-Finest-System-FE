import { Layout, Menu } from 'antd'
import {
  Home,
  Package,
  ShoppingCart,
  BookOpen,
  MessageCircle,
  DollarSign,
  Store,
  HelpCircle,
  Leaf,
  Component
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../../contexts/store.context'
import path from '../../constants/path'

const { Sider } = Layout

function SideBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { store, isStoreApproved } = useStore()

  // Menu items cho seller chưa được duyệt (chỉ các chức năng cơ bản)
  const pendingMenuItems = [
    {
      key: path.BASE_SELLER,
      label: 'Trang tổng quan',
      icon: <Home size={18} />
    }
  ]

  // Menu items đầy đủ cho seller đã được duyệt
  const approvedMenuItems = [
    {
      key: path.BASE_SELLER,
      label: 'Trang tổng quan',
      icon: <Home size={18} />
    },
    {
      key: path.productsSeller,
      label: 'Quản lý sản phẩm',
      icon: <Package size={18} />
    },
    {
      key: path.comboSeller,
      label: 'Quản lý Combo',
      icon: <Component size={18} />
    },
    {
      key: path.ordersSeller,
      label: 'Đơn hàng',
      icon: <ShoppingCart size={18} />
    },
    {
      key: path.myStorySeller,
      label: 'Câu chuyện',
      icon: <BookOpen size={18} />
    },
    {
      key: path.chatWithCustomerSeller,
      label: 'Tin nhắn',
      icon: <MessageCircle size={18} />
    },
    {
      key: path.financeSeller,
      label: 'Tài chính',
      icon: <DollarSign size={18} />
    },
    {
      key: path.setupStoreSeller,
      label: 'Cửa hàng',
      icon: <Store size={18} />
    },
    {
      key: path.helpSeller,
      label: 'Trung tâm trợ giúp',
      icon: <HelpCircle size={18} />
    }
  ]

  // Chọn menu items dựa trên trạng thái store
  const menuItems = isStoreApproved ? approvedMenuItems : pendingMenuItems

  const handleMenuClick = ({ key }: { key: string }) => {
    // Nếu key là relative path, cần kết hợp với base path
    const fullPath = key.startsWith('/') ? key : `${path.BASE_SELLER}/${key}`
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
            background: '#16a34a',
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
            color: '#16a34a'
          }}
        >
          Tinh Hoa Quê Nhà
        </span>
      </div>

      {/* Store Status Indicator */}
      {store && !isStoreApproved && (
        <div
          style={{
            padding: '12px 24px',
            background: '#fff7e6',
            borderBottom: '1px solid #ffd591',
            fontSize: '12px',
            color: '#d46b08'
          }}
        >
          <div style={{ fontWeight: '500', marginBottom: '4px' }}>⚠️ Chế độ hạn chế</div>
          <div>Cửa hàng chưa được phê duyệt</div>
        </div>
      )}

      {/* Navigation Menu */}
      <Menu
        mode='inline'
        selectedKeys={[location.pathname]}
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
