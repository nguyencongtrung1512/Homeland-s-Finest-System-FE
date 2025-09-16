import { BarChart3, CheckCircle, CreditCard, FileText, Leaf, LibraryBig, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import path from '../../constants/path'

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
    // {
    //   key: path.COMBO_MANAGEMENT_ADMIN,
    //   label: 'Quản lý Combo',
    //   icon: <Component size={18} />
    // },
    // {
    //   key: path.PRODUCT_MANAGEMENT_ADMIN,
    //   label: 'Quản lý sản phẩm',
    //   icon: <Package size={18} />
    // },
    {
      key: path.TRANSACTION_MANAGEMENT_ADMIN,
      label: 'Quản lí giao dịch',
      icon: <CreditCard size={18} />
    },
    {
      key: path.BLOG_MANAGEMENT_ADMIN,
      label: 'Quản lý blog',
      icon: <LibraryBig size={18} />
    },
    {
      key: path.ACCOUNT_MANAGEMENT_ADMIN,
      label: 'Quản lí người dùng',
      icon: <User size={18} />
    },
    {
      key: path.TERMS_MANAGEMENT_ADMIN,
      label: 'Điều khoản dịch vụ',
      icon: <FileText size={18} />
    }
  ]

  const handleMenuClick = (key: string) => {
    navigate(key)
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
        {menuItems.map((item) => (
          <Button
            key={item.key}
            variant={location.pathname === item.key ? 'default' : 'ghost'}
            className={cn(
              'h-10 transition-all duration-300',
              isCollapsed ? 'w-full justify-center px-2' : 'w-full justify-start gap-3 px-3',
              location.pathname === item.key
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            )}
            onClick={() => handleMenuClick(item.key)}
            title={isCollapsed ? item.label : undefined}
          >
            {item.icon}
            {!isCollapsed && item.label}
          </Button>
        ))}
      </nav>
    </div>
  )
}

export default SideBar
