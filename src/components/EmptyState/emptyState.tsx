import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Package, ShoppingCart, FileText, Users, Store, Search, RefreshCw, Plus } from 'lucide-react'

interface EmptyStateProps {
  type?: 'products' | 'orders' | 'stores' | 'users' | 'blogs' | 'transactions' | 'search' | 'general' | 'error'
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  showAction?: boolean
  className?: string
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'general',
  title,
  description,
  actionLabel,
  onAction,
  showAction = true,
  className = ''
}) => {
  const getEmptyStateConfig = () => {
    switch (type) {
      case 'products':
        return {
          icon: <Package className='w-16 h-16 text-muted-foreground' />,
          title: title || 'Chưa có sản phẩm nào',
          description: description || 'Hãy thêm sản phẩm đầu tiên để bắt đầu bán hàng',
          actionLabel: actionLabel || 'Thêm sản phẩm',
          iconBg: 'bg-green-50 dark:bg-green-900/20'
        }
      case 'orders':
        return {
          icon: <ShoppingCart className='w-16 h-16 text-muted-foreground' />,
          title: title || 'Chưa có đơn hàng nào',
          description: description || 'Các đơn hàng sẽ xuất hiện ở đây khi khách hàng đặt mua',
          actionLabel: actionLabel || 'Xem sản phẩm',
          iconBg: 'bg-blue-50 dark:bg-blue-900/20'
        }
      case 'stores':
        return {
          icon: <Store className='w-16 h-16 text-muted-foreground' />,
          title: title || 'Chưa có cửa hàng nào',
          description: description || 'Hãy tạo cửa hàng đầu tiên để bắt đầu kinh doanh',
          actionLabel: actionLabel || 'Tạo cửa hàng',
          iconBg: 'bg-orange-50 dark:bg-orange-900/20'
        }
      case 'users':
        return {
          icon: <Users className='w-16 h-16 text-muted-foreground' />,
          title: title || 'Chưa có người dùng nào',
          description: description || 'Danh sách người dùng sẽ xuất hiện ở đây',
          actionLabel: actionLabel || 'Làm mới',
          iconBg: 'bg-purple-50 dark:bg-purple-900/20'
        }
      case 'blogs':
        return {
          icon: <FileText className='w-16 h-16 text-muted-foreground' />,
          title: title || 'Chưa có bài viết nào',
          description: description || 'Hãy tạo bài viết đầu tiên để chia sẻ kiến thức',
          actionLabel: actionLabel || 'Viết bài mới',
          iconBg: 'bg-indigo-50 dark:bg-indigo-900/20'
        }
      case 'transactions':
        return {
          icon: <RefreshCw className='w-16 h-16 text-muted-foreground' />,
          title: title || 'Chưa có giao dịch nào',
          description: description || 'Lịch sử giao dịch sẽ xuất hiện ở đây',
          actionLabel: actionLabel || 'Làm mới',
          iconBg: 'bg-emerald-50 dark:bg-emerald-900/20'
        }
      case 'search':
        return {
          icon: <Search className='w-16 h-16 text-muted-foreground' />,
          title: title || 'Không tìm thấy kết quả',
          description: description || 'Hãy thử tìm kiếm với từ khóa khác',
          actionLabel: actionLabel || 'Thử lại',
          iconBg: 'bg-gray-50 dark:bg-gray-900/20'
        }
       case 'error':
        return {
          icon: <Search className='w-16 h-16 text-muted-foreground' />,
          title: title || 'Không tìm thấy kết quả',
          description: description || 'Hãy thử tìm kiếm với từ khóa khác',
          actionLabel: actionLabel || 'Thử lại',
          iconBg: 'bg-gray-50 dark:bg-gray-900/20'
        }
      default:
        return {
          icon: <Package className='w-16 h-16 text-muted-foreground' />,
          title: title || 'Không có dữ liệu',
          description: description || 'Hiện tại chưa có dữ liệu để hiển thị',
          actionLabel: actionLabel || 'Làm mới',
          iconBg: 'bg-gray-50 dark:bg-gray-900/20'
        }
    }
  }

  const config = getEmptyStateConfig()

  return (
    <Card className={`border-dashed border-2 ${className}`}>
      <CardContent className='flex flex-col items-center justify-center py-12 px-6 text-center'>
        <div className={`rounded-full p-6 mb-6 ${config.iconBg}`}>{config.icon}</div>
        <h3 className='text-lg font-semibold text-foreground mb-2'>{config.title}</h3>
        <p className='text-muted-foreground text-sm max-w-sm mb-6 leading-relaxed'>{config.description}</p>
        {showAction && onAction && (
          <Button onClick={onAction} variant='outline' className='gap-2'>
            {type === 'products' && <Plus className='w-4 h-4' />}
            {type === 'orders' && <RefreshCw className='w-4 h-4' />}
            {type === 'stores' && <Plus className='w-4 h-4' />}
            {type === 'users' && <RefreshCw className='w-4 h-4' />}
            {type === 'blogs' && <Plus className='w-4 h-4' />}
            {type === 'transactions' && <RefreshCw className='w-4 h-4' />}
            {type === 'search' && <Search className='w-4 h-4' />}
            {type === 'general' && <RefreshCw className='w-4 h-4' />}
            {config.actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default EmptyState
