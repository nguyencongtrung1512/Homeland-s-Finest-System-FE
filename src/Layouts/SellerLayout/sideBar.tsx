import { Layout, Menu } from 'antd'
import {
  Home,
  Package,
  ShoppingCart,
  BookOpen,
  MessageCircle,
  Store,
  HelpCircle,
  Leaf,
  Component,
  Gift,
  Star,
  Flag,
  Receipt
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../../contexts/store.context'
import path from '../../constants/path'

const AnimatedIcon: React.FC<{
  children: React.ReactNode
  animationType?: 'scale' | 'bounce' | 'pulse' | 'rotate'
}> = ({ children, animationType = 'scale' }) => {
  const getAnimationClass = () => {
    switch (animationType) {
      case 'bounce':
        return 'hover:animate-bounce'
      case 'pulse':
        return 'hover:animate-pulse hover:scale-105'
      case 'rotate':
        return 'hover:rotate-12 hover:scale-110'
      default:
        return 'hover:scale-110'
    }
  }

  return (
    <span
      className={`inline-block transition-all duration-300 ease-in-out ${getAnimationClass()} mr-3`}
      style={{
        transformOrigin: 'center',
        color: '#000000'
      }}
    >
      {children}
    </span>
  )
}
const { Sider } = Layout

function SideBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { store, isStoreApproved } = useStore()

  const pendingMenuItems = [
    {
      key: path.BASE_SELLER,
      label: 'Trang tổng quan',
      icon: (
        <AnimatedIcon animationType='bounce'>
          <Home size={18} />
        </AnimatedIcon>
      )
    },
    {
      key: path.setupStoreSeller,
      label: 'Cửa hàng',
      icon: <Store size={18} />
    },
    {
      key: path.helpSeller,
      label: 'Trung tâm trợ giúp',
      icon: (
        <AnimatedIcon animationType='bounce'>
          <HelpCircle size={18} />
        </AnimatedIcon>
      )
    }
  ]

  const approvedMenuItems = [
    {
      key: path.BASE_SELLER,
      label: 'Trang tổng quan',
      icon: (
        <AnimatedIcon animationType='bounce'>
          <Home size={18} />
        </AnimatedIcon>
      )
    },
    {
      key: path.productsSeller,
      label: 'Quản lý sản phẩm',
      icon: (
        <AnimatedIcon animationType='bounce'>
          <Package size={18} />
        </AnimatedIcon>
      )
    },
    {
      key: path.comboSeller,
      label: 'Quản lý Combo',
      icon: (
        <AnimatedIcon animationType='bounce'>
          <Component size={18} />
        </AnimatedIcon>
      )
    },
    {
      key: path.promotionSeller,
      label: 'Quản lý Mã khuyến mãi ',
      icon: (
        <AnimatedIcon animationType='bounce'>
          <Gift size={18} />
        </AnimatedIcon>
      )
    },
    {
      key: path.ordersSeller,
      label: 'Đơn hàng',
      icon: (
        <AnimatedIcon animationType='bounce'>
          <ShoppingCart size={18} />
        </AnimatedIcon>
      )
    },
    {
      key: path.productReviewsSeller,
      label: 'Đánh giá sản phẩm',
      icon: (
        <AnimatedIcon animationType='bounce'>
          <Star size={18} />
        </AnimatedIcon>
      )
    },
    {
      key: path.myStorySeller,
      label: 'Câu chuyện',
      icon: (
        <AnimatedIcon animationType='bounce'>
          <BookOpen size={18} />
        </AnimatedIcon>
      )
    },
    {
      key: path.complaintSeller,
      label: 'Khiếu nại',
      icon: (
        <AnimatedIcon animationType='bounce'>
          <Flag size={18} />
        </AnimatedIcon>
      )
    },
    {
      key: path.chatWithCustomerSeller,
      label: 'Tin nhắn',
      icon: (
        <AnimatedIcon animationType='bounce'>
          <MessageCircle size={18} />
        </AnimatedIcon>
      )
    },
    {
      key: path.financeSeller,
      label: 'Tài chính',
      icon: (
        <AnimatedIcon animationType='bounce'>
          <span className='font-bold'>₫</span>
        </AnimatedIcon>
      )
    },
    {
      key: path.transactionSeller,
      label: 'Giao dịch',
      icon: (
        <AnimatedIcon animationType='bounce'>
          <Receipt size={18} />
        </AnimatedIcon>
      )
    },
    {
      key: path.setupStoreSeller,
      label: 'Cửa hàng',
      icon: <Store size={18} />
    },
    {
      key: path.helpSeller,
      label: 'Trung tâm trợ giúp',
      icon: (
        <AnimatedIcon animationType='bounce'>
          <HelpCircle size={18} />
        </AnimatedIcon>
      )
    }
  ]

  // Menu item for Story - only shown when status is Inactive
  const storyMenuItem = {
    key: path.myStorySeller,
    label: 'Câu chuyện',
    icon: (
      <AnimatedIcon animationType='bounce'>
        <BookOpen size={18} />
      </AnimatedIcon>
    )
  }

  // Build menu items based on approval status and store status
  let menuItems = isStoreApproved ? approvedMenuItems : pendingMenuItems

  // Only show Story menu when store status is Inactive
  if (store?.status === 'Inactive') {
    menuItems = [...menuItems, storyMenuItem]
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    const fullPath = key.startsWith('/') ? key : `${path.BASE_SELLER}/${key}`
    navigate(fullPath)
  }

  const getSelectedKey = () => {
    const currentPath = location.pathname

    const exactMatch = menuItems.find((item) => item.key === currentPath)
    if (exactMatch) return exactMatch.key

    const partialMatch = menuItems.find((item) => {
      if (item.key.startsWith('/seller')) {
        return currentPath.startsWith(item.key) && item.key !== path.BASE_SELLER
      }
      return currentPath === `/seller/${item.key}` || currentPath.startsWith(`/seller/${item.key}/`)
    })

    return partialMatch ? partialMatch.key : currentPath
  }

  return (
    <>
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

        <Menu
          mode='inline'
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            height: 'calc(100% - 64px)',
            borderRight: 0,
            fontSize: '15px'
          }}
          className='border-0'
        />
      </Sider>
      <style
        dangerouslySetInnerHTML={{
          __html: `
     .ant-menu-item {
       transition: all 0.3s ease-in-out !important;
       border-radius: 8px !important;
       margin: 4px 8px !important;
     }

     .ant-menu-item:hover {
       background-color: rgba(6, 182, 212, 0.1) !important;
       transform: translateX(4px) !important;
       box-shadow: 0 2px 8px rgba(6, 182, 212, 0.15) !important;
     }

     .ant-menu-item-selected {
       background-color: rgba(6, 182, 212, 0.15) !important;
       border-radius: 8px !important;
       color: #09ae72 !important;
       font-weight: 600 !important;
     }

     .ant-menu-item-selected .ant-menu-title-content {
       color: #09ae72 !important;
     }

     .ant-menu-item:hover .ant-menu-title-content {
       color: #09ae72 !important;
     }

     .ant-menu-item:hover span {
       color: #09ae72 !important;
     }

     .ant-menu-item-selected span {
       color: #09ae72 !important;
     }

     .ant-menu-item:hover span,
     .ant-menu-item-selected span {
       filter: drop-shadow(0 0 4px rgba(75, 202, 155, 0.4));
       transition: all 0.3s ease-in-out;
     }

     .ant-menu-title-content {
       transition: color 0.3s ease-in-out !important;
     }
   `
        }}
      />
    </>
  )
}

export default SideBar
