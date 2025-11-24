import {
  BarChart3,
  Store,
  CheckCircle,
  CreditCard,
  FileText,
  Shield,
  Leaf,
  LibraryBig,
  ShoppingCart,
  Package,
  Component,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'
import path from '../../constants/path'
import { useState } from 'react'

interface SideBarProps {
  isCollapsed?: boolean
}

function SideBar({ isCollapsed = false }: SideBarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const [storeManagementOpen, setStoreManagementOpen] = useState(true)
  const [comboManagementOpen, setComboManagementOpen] = useState(true)

  const menuItems = [
    {
      key: path.BASE_STAFF,
      label: 'Dashboard',
      icon: <BarChart3 size={18} />
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
    }
  ]

  const storeManagementChildren = [
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

  const comboManagementChildren = [
    {
      key: path.comboManagementStaff,
      label: 'Duyệt combo',
      icon: <CheckCircle size={16} />
    },
    {
      key: path.comboListStaff,
      label: 'Danh sách combo',
      icon: <Package size={16} />
    }
  ]

  const handleMenuClick = (key: string) => {
    // Nếu key là relative path, cần kết hợp với base path
    const fullPath = key.startsWith('/') ? key : `${path.BASE_STAFF}/${key}`
    navigate(fullPath)
  }

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
        {!isCollapsed && <span className='text-lg font-bold text-blue-600 whitespace-nowrap'>StaffPanel</span>}
      </div>

      {/* Navigation Menu */}
      <nav className={cn('flex-1 space-y-2 transition-all duration-300', isCollapsed ? 'p-2' : 'p-4')}>
        {menuItems.map((item) => {
          const itemFullPath = item.key.startsWith('/')
            ? item.key
            : `${path.BASE_STAFF}${item.key.startsWith('/') ? '' : '/'}${item.key}`

          // Nếu là base staff ('/staff') chỉ active khi exact match.
          const isBaseStaff = itemFullPath === path.BASE_STAFF
          const isActive = isBaseStaff
            ? location.pathname === itemFullPath
            : location.pathname === itemFullPath ||
            (itemFullPath !== '/' && location.pathname.startsWith(itemFullPath + '/'))

          return (
            <button
              key={item.key}
              type='button'
              onClick={() => handleMenuClick(item.key)}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                'staff-menu-item flex items-center h-10 w-full transition-all duration-300 rounded-md px-3 outline-none',
                isCollapsed ? 'justify-center px-2' : 'justify-start gap-3',
                isActive ? 'active text-white' : 'text-gray-700'
              )}
              data-key={item.key}
            >
              <span className='staff-menu-icon mr-2'>{item.icon}</span>
              {!isCollapsed && <span className='truncate'>{item.label}</span>}
            </button>
          )
        })}

        {/* Store Management Group */}
        <button
          type='button'
          onClick={() => setStoreManagementOpen((prev) => !prev)}
          title={isCollapsed ? 'Quản lý cửa hàng' : undefined}
          className={cn(
            'staff-menu-item flex items-center h-10 w-full transition-all duration-300 rounded-md px-3 outline-none',
            isCollapsed ? 'justify-center px-2' : 'justify-start gap-3',
            'text-gray-700'
          )}
        >
          <span className='staff-menu-icon mr-2'>
            <Store size={18} />
          </span>
          {!isCollapsed && <span className='truncate'>Quản lý cửa hàng</span>}
          {!isCollapsed &&
            (storeManagementOpen ? (
              <ChevronDown size={16} className='ml-auto' />
            ) : (
              <ChevronRight size={16} className='ml-auto' />
            ))}
        </button>

        {/* Store Management children */}
        {!isCollapsed && storeManagementOpen && (
          <div className='space-y-2 pl-6'>
            {storeManagementChildren.map((child) => {
              const childFullPath = child.key.startsWith('/') ? child.key : `${path.BASE_STAFF}/${child.key}`
              const isChildActive =
                location.pathname === childFullPath || location.pathname.startsWith(childFullPath + '/')

              return (
                <button
                  key={child.key}
                  type='button'
                  onClick={() => handleMenuClick(child.key)}
                  className={cn(
                    'staff-menu-item flex items-center h-9 w-full transition-all duration-300 rounded-md px-3 outline-none',
                    isChildActive ? 'active text-white' : 'text-gray-700'
                  )}
                >
                  <span className='staff-menu-icon mr-2'>{child.icon}</span>
                  <span className='truncate'>{child.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Combo Management Group */}
        <button
          type='button'
          onClick={() => setComboManagementOpen((prev) => !prev)}
          title={isCollapsed ? 'Quản lý combo' : undefined}
          className={cn(
            'staff-menu-item flex items-center h-10 w-full transition-all duration-300 rounded-md px-3 outline-none',
            isCollapsed ? 'justify-center px-2' : 'justify-start gap-3',
            'text-gray-700'
          )}
        >
          <span className='staff-menu-icon mr-2'>
            <Component size={18} />
          </span>
          {!isCollapsed && <span className='truncate'>Quản lý combo</span>}
          {!isCollapsed &&
            (comboManagementOpen ? (
              <ChevronDown size={16} className='ml-auto' />
            ) : (
              <ChevronRight size={16} className='ml-auto' />
            ))}
        </button>

        {/* Combo Management children */}
        {!isCollapsed && comboManagementOpen && (
          <div className='space-y-2 pl-6'>
            {comboManagementChildren.map((child) => {
              const childFullPath = child.key.startsWith('/') ? child.key : `${path.BASE_STAFF}/${child.key}`
              const isChildActive =
                location.pathname === childFullPath || location.pathname.startsWith(childFullPath + '/')

              return (
                <button
                  key={child.key}
                  type='button'
                  onClick={() => handleMenuClick(child.key)}
                  className={cn(
                    'staff-menu-item flex items-center h-9 w-full transition-all duration-300 rounded-md px-3 outline-none',
                    isChildActive ? 'active text-white' : 'text-gray-700'
                  )}
                >
                  <span className='staff-menu-icon mr-2'>{child.icon}</span>
                  <span className='truncate'>{child.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </nav>

      {/* Styles: hover + active màu "xanh da trời" (sky-blue) giống admin sidebar */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
      /* color: #38bdf8 (sky-400) */
      .staff-menu-item {
        background: transparent;
      }

      .staff-menu-item .staff-menu-icon svg {
        color: #0f172a; /* default icon color */
        transition: color 0.2s ease, transform 0.2s ease;
      }

      .staff-menu-item:hover {
        background-color: rgba(56,189,248,0.12); /* nhẹ nhàng sky-blue hover */
        transform: translateX(6px);
        box-shadow: 0 6px 18px rgba(56,189,248,0.12);
      }

      .staff-menu-item:hover .staff-menu-icon svg {
        color: #06b6d4; /* sky/cyan icon tint on hover */
        transform: scale(1.06);
      }

      .staff-menu-item.active,
      .staff-menu-item.active:hover {
        background-color: #38bdf8 !important; /* chính màu sky-blue */
        color: #ffffff !important;
        font-weight: 600;
      }

      .staff-menu-item.active .staff-menu-icon svg {
        color: #ffffff !important;
      }

      /* Khi collapsed (chỉ icon), giảm translate để không overflow */
      .w-16 .staff-menu-item:hover {
        transform: translateX(2px);
      }

      /* chuyển màu text khi hover (khi chưa active) */
      .staff-menu-item:not(.active):hover span {
        color: #075985 !important; /* dark-sky tint for label */
      }

      `
        }}
      />
    </div>
  )
}

export default SideBar
