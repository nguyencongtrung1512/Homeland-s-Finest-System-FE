import { Layout, Menu } from 'antd'
import { Home, Package, ShoppingCart, BookOpen, MessageCircle, DollarSign, Store, HelpCircle, Leaf } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import path from '../../constants/path'

const { Sider } = Layout

function SideBar() {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: path.BASE_SELLER,
      label: 'Trang tổng quan',
      icon: <Home size={18} />
    },
    {
      key: path.productsSeller,
      label: 'Sản phẩm',
      icon: <Package size={18} />
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
