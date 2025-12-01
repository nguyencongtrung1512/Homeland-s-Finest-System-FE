import {
  BarChart3,
  CheckCircle,
  ClipboardMinus,
  CreditCard,
  FileText,
  Leaf,
  LibraryBig,
  User,
  Gift,
  AlertTriangle,
  Component,
  Package,
  Store,
  Wallet,
  ChevronDown,
  ChevronRight,
  CircleQuestionMark,
  ContactRound
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'
import path from '../../constants/path'
// import { ShopOutlined } from '@ant-design/icons'
import { useState } from 'react'

interface SideBarProps {
  isCollapsed: boolean
}

function SideBar({ isCollapsed }: SideBarProps) {
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
      key: path.COMBO_MANAGEMENT_ADMIN,
      label: 'Quản lý Combo',
      icon: <Component size={18} />
    },
    {
      key: path.PRODUCT_MANAGEMENT_ADMIN,
      label: 'Quản lý sản phẩm',
      icon: <Package size={18} />
    },
    {
      key: path.TRANSACTION_MANAGEMENT_ADMIN,
      label: 'Quản lý giao dịch',
      icon: <CreditCard size={18} />
    },
    {
      key: path.REQUEST_WALLET_MONEY_MANAGEMENT_ADMIN,
      label: 'Yêu cầu rút tiền & hoàn tiền',
      icon: <Wallet size={18} />
    },
    {
      key: path.PROMOTION_MANAGEMENT_ADMIN,
      label: 'Quản lý Mã khuyến mãi ',
      icon: <Gift size={18} />
    },
    {
      key: path.BLOG_MANAGEMENT_ADMIN,
      label: 'Quản lý blog',
      icon: <LibraryBig size={18} />
    },
    {
      key: path.STAFF_MANAGEMENT_ADMIN,
      label: 'Quản lý nhân viên',
      icon: <ContactRound size={18} />
    },
    {
      key: path.ACCOUNT_MANAGEMENT_ADMIN,
      label: 'Quản lý người dùng',
      icon: <User size={18} />
    },
    // {
    //   key: path.SELLER_MANAGEMENT_ADMIN,
    //   label: 'Quản lý Người bán',
    //   icon: <ShopOutlined size={18} />
    // },
    {
      key: path.TERMS_MANAGEMENT_ADMIN,
      label: 'Điều khoản dịch vụ',
      icon: <FileText size={18} />
    },
    {
      key: path.SYSTEM_STORAGE_ADMIN,
      label: 'Quản lý hệ thống',
      icon: <ClipboardMinus size={18} />
    }
  ]

  const handleMenuClick = (key: string) => {
    // Nếu key là relative path, cần kết hợp với base path
    const fullPath = key.startsWith('/') ? key : `${path.BASE_ADMIN}/${key}`
    navigate(fullPath)
  }

  const [complaintOpen, setComplaintOpen] = useState(false)
  const complaintOrderPath = `${path.BASE_ADMIN}/${path.FORM_ORDER_MANAGEMENT_ADMIN}`
  const complaintStorePath = `${path.BASE_ADMIN}/${path.FORM_STORE_MANAGEMENT_ADMIN}`
  const complaintOtherPath = `${path.BASE_ADMIN}/${path.FORM_OTHER_MANAGEMENT_ADMIN}`


  return (
    <div
      className={cn(
        'bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'border-b border-gray-200 flex items-center transition-all duration-300',
          isCollapsed ? 'p-5 justify-center' : 'p-5 gap-2'
        )}
      >
        <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
          <Leaf size={20} className='text-white' />
        </div>
        {!isCollapsed && <span className='text-lg font-bold text-blue-600 whitespace-nowrap'>AdminPanel</span>}
      </div>

      {/* Navigation Menu */}
      <nav className={cn('flex-1 space-y-2 transition-all duration-300', isCollapsed ? 'p-2' : 'p-4')}>
        {menuItems.map((item) => {
          const itemFullPath = item.key.startsWith('/')
            ? item.key
            : `${path.BASE_ADMIN}${item.key.startsWith('/') ? '' : '/'}${item.key}`

          // Nếu là base admin ('/admin') chỉ active khi exact match.
          const isBaseAdmin = itemFullPath === path.BASE_ADMIN
          const isActive = isBaseAdmin
            ? location.pathname === itemFullPath
            : location.pathname === itemFullPath ||
            (itemFullPath !== '/' && location.pathname.startsWith(itemFullPath + '/'))

          return (
            <button
              key={item.key}
              type='button'
              onClick={() => handleMenuClick(item.key)}
              title={isCollapsed ? item.label : undefined}
              // thêm class admin-menu-item để override styles và 'active' khi đang chọn
              className={cn(
                'admin-menu-item flex items-center h-10 w-full transition-all duration-300 rounded-md px-3 outline-none',
                isCollapsed ? 'justify-center px-2' : 'justify-start gap-3',
                isActive ? 'active text-white' : 'text-gray-700'
              )}
              data-key={item.key}
            >
              <span className='admin-menu-icon mr-2'>{item.icon}</span>
              {!isCollapsed && <span className='truncate'>{item.label}</span>}
            </button>
          )
        })}

        {/* Complaint Group */}
        <button
          type='button'
          onClick={() => setComplaintOpen((prev) => !prev)}
          title={isCollapsed ? 'Quản lý khiếu nại' : undefined}
          className={cn(
            'admin-menu-item flex items-center h-10 w-full transition-all duration-300 rounded-md px-3 outline-none',
            isCollapsed ? 'justify-center px-2' : 'justify-start gap-3'
          )}
        >
          <span className='admin-menu-icon mr-2'>
            <AlertTriangle size={18} />
          </span>
          {!isCollapsed && <span className='truncate'>Quản lý đơn</span>}
          {!isCollapsed &&
            (complaintOpen ? (
              <ChevronDown size={16} className='ml-auto' />
            ) : (
              <ChevronRight size={16} className='ml-auto' />
            ))}
        </button>

        {/* Complaint children */}
        {!isCollapsed && complaintOpen && (
          <div className='space-y-2 pl-6'>
            <button
              type='button'
              onClick={() => handleMenuClick(path.FORM_ORDER_MANAGEMENT_ADMIN)}
              className={cn(
                'admin-menu-item flex items-center h-9 w-full transition-all duration-300 rounded-md px-3 outline-none',
                location.pathname === complaintOrderPath || location.pathname.startsWith(complaintOrderPath + '/')
                  ? 'active text-white'
                  : 'text-gray-700'
              )}
            >
              <span className='admin-menu-icon mr-2'>
                <Package size={16} />
              </span>
              <span className='truncate'>Khiếu nại đơn hàng</span>
            </button>

            <button
              type='button'
              onClick={() => handleMenuClick(path.FORM_STORE_MANAGEMENT_ADMIN)}
              className={cn(
                'admin-menu-item flex items-center h-9 w-full transition-all duration-300 rounded-md px-3 outline-none',
                location.pathname === complaintStorePath || location.pathname.startsWith(complaintStorePath + '/')
                  ? 'active text-white'
                  : 'text-gray-700'
              )}
            >
              <span className='admin-menu-icon mr-2'>
                <Store size={16} />
              </span>
              <span className='truncate'>Khiếu nại cửa hàng</span>
            </button>

            <button
              type='button'
              onClick={() => handleMenuClick(path.FORM_OTHER_MANAGEMENT_ADMIN)}
              className={cn(
                'admin-menu-item flex items-center h-9 w-full transition-all duration-300 rounded-md px-3 outline-none',
                location.pathname === complaintOtherPath || location.pathname.startsWith(complaintOtherPath + '/')
                  ? 'active text-white'
                  : 'text-gray-700'
              )}
            >
              <span className='admin-menu-icon mr-2'>
                <CircleQuestionMark size={16} />
              </span>
              <span className='truncate'>Hỗ trợ/Khác</span>
            </button>
          </div>
        )}
      </nav>

      {/* Styles: hover + active màu "xanh da trời" (sky-blue) giống seller sidebar */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
      /* color: #38bdf8 (sky-400) */
      .admin-menu-item {
        background: transparent;
      }

      .admin-menu-item .admin-menu-icon svg {
        color: #0f172a; /* default icon color */
        transition: color 0.2s ease, transform 0.2s ease;
      }

      .admin-menu-item:hover {
        background-color: rgba(56,189,248,0.12); /* nhẹ nhàng sky-blue hover */
        transform: translateX(6px);
        box-shadow: 0 6px 18px rgba(56,189,248,0.12);
      }

      .admin-menu-item:hover .admin-menu-icon svg {
        color: #06b6d4; /* sky/cyan icon tint on hover */
        transform: scale(1.06);
      }

      .admin-menu-item.active,
      .admin-menu-item.active:hover {
        background-color: #38bdf8 !important; /* chính màu sky-blue */
        color: #ffffff !important;
        font-weight: 600;
      }

      .admin-menu-item.active .admin-menu-icon svg {
        color: #ffffff !important;
      }

      /* Khi collapsed (chỉ icon), giảm translate để không overflow */
      .w-16 .admin-menu-item:hover {
        transform: translateX(2px);
      }

      /* chuyển màu text khi hover (khi chưa active) */
      .admin-menu-item:not(.active):hover span {
        color: #075985 !important; /* dark-sky tint for label */
      }

      `
        }}
      />
    </div>
  )
}

export default SideBar
