import StoreStatusNotice from '../../../components/Seller/StoreStatusNotice'
import { useStore } from '../../../contexts/store.context'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import {
  TrendingUp,
  Package,
  CheckCircle,
  Wallet,
  Bell,
  ArrowRight,
  Plus,
  ShoppingCart,
  Gift,
  FileText
} from 'lucide-react'

function Dashboard() {
  const { store, isStoreApproved } = useStore()

  // ========== MOCK DATA ==========
  // Key Metrics Data
  const metricsData = {
    totalRevenue: 15200000, // 15.2M VNĐ
    totalOrders: 342,
    successfulOrders: 298,
    availableBalance: 8500000, // 8.5M VNĐ
    revenueChange: 12.5, // % tăng so với tháng trước
    ordersChange: 8.3
  }

  // Revenue by Month (12 tháng)
  const revenueByMonth = [
    { month: 'T1', revenue: 1200000 },
    { month: 'T2', revenue: 1500000 },
    { month: 'T3', revenue: 1800000 },
    { month: 'T4', revenue: 1400000 },
    { month: 'T5', revenue: 1600000 },
    { month: 'T6', revenue: 1900000 },
    { month: 'T7', revenue: 2100000 },
    { month: 'T8', revenue: 1800000 },
    { month: 'T9', revenue: 1700000 },
    { month: 'T10', revenue: 2000000 },
    { month: 'T11', revenue: 2200000 },
    { month: 'T12', revenue: 1500000 }
  ]

  // Orders by Month
  const ordersByMonth = [
    { month: 'T1', orders: 28 },
    { month: 'T2', orders: 32 },
    { month: 'T3', orders: 35 },
    { month: 'T4', orders: 29 },
    { month: 'T5', orders: 31 },
    { month: 'T6', orders: 38 },
    { month: 'T7', orders: 42 },
    { month: 'T8', orders: 36 },
    { month: 'T9', orders: 34 },
    { month: 'T10', orders: 40 },
    { month: 'T11', orders: 45 },
    { month: 'T12', orders: 32 }
  ]

  // Revenue by Payment Method
  const revenueByPaymentMethod = {
    banking: 9500000, // 9.5M
    cod: 5700000 // 5.7M
  }

  // Order Status Distribution
  const orderStatusData = [
    { status: 'Processing', label: 'Chờ xác nhận', count: 12, color: 'bg-yellow-100 text-yellow-800' },
    { status: 'Confirmed', label: 'Đã xác nhận', count: 8, color: 'bg-blue-100 text-blue-800' },
    { status: 'Delivered', label: 'Đã giao', count: 298, color: 'bg-green-100 text-green-800' },
    { status: 'Cancelled', label: 'Đã hủy', count: 15, color: 'bg-red-100 text-red-800' },
    { status: 'Picking', label: 'Đang lấy hàng', count: 5, color: 'bg-purple-100 text-purple-800' },
    { status: 'Transporting', label: 'Đang vận chuyển', count: 4, color: 'bg-indigo-100 text-indigo-800' }
  ]

  // Orders Need Attention
  const ordersNeedAttention = [
    { id: 'ORD-001', customer: 'Nguyễn Văn A', amount: 450000, status: 'Processing', createdAt: '14/01/2025' },
    { id: 'ORD-002', customer: 'Trần Thị B', amount: 320000, status: 'Processing', createdAt: '14/01/2025' },
    { id: 'ORD-003', customer: 'Lê Văn C', amount: 680000, status: 'Confirmed', createdAt: '13/01/2025' },
    { id: 'ORD-004', customer: 'Phạm Thị D', amount: 250000, status: 'Processing', createdAt: '14/01/2025' },
    { id: 'ORD-005', customer: 'Hoàng Văn E', amount: 890000, status: 'Confirmed', createdAt: '13/01/2025' }
  ]

  // Top Selling Products
  const topProducts = [
    { name: 'Bánh tráng nướng', revenue: 3200000, percentage: 100 },
    { name: 'Mắm ruốc', revenue: 2800000, percentage: 87.5 },
    { name: 'Khô bò', revenue: 2500000, percentage: 78.1 },
    { name: 'Chà bông', revenue: 2000000, percentage: 62.5 },
    { name: 'Bánh phồng tôm', revenue: 1800000, percentage: 56.3 }
  ]

  // Low Stock Products
  const lowStockProducts = [
    { name: 'Mắm tôm', quantity: 2, level: 'critical' },
    { name: 'Tương ớt', quantity: 5, level: 'warning' },
    { name: 'Bánh đa nem', quantity: 8, level: 'warning' },
    { name: 'Nước mắm', quantity: 12, level: 'warning' },
    { name: 'Mì Quảng', quantity: 15, level: 'warning' }
  ]

  // Promotion Stats
  const promotionStats = {
    active: 5,
    expiringSoon: 2,
    totalUsage: 1248
  }

  // Alerts
  const alerts = [
    { type: 'order', message: '12 đơn hàng đang chờ xử lý', count: 12, priority: 'high' },
    { type: 'stock', message: '5 sản phẩm sắp hết hàng', count: 5, priority: 'medium' },
    { type: 'promotion', message: '2 khuyến mãi sắp hết hạn', count: 2, priority: 'low' }
  ]

  // Helper functions
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M VNĐ`
    }
    return `${(amount / 1000).toFixed(0)}k VNĐ`
  }

  const getMaxRevenue = () => {
    return Math.max(...revenueByMonth.map((m) => m.revenue))
  }

  const getMaxOrders = () => {
    return Math.max(...ordersByMonth.map((m) => m.orders))
  }

  // Nếu store chưa được duyệt, hiển thị thông báo thay vì dashboard thông thường
  if (store && !isStoreApproved) {
    return (
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Trang tổng quan</h1>
          {store.status !== 'ApprovedByStaff' && (
            <p className='text-gray-600 mt-2'>Chào mừng đến với Tinh Hoa Quê Nhà!</p>
          )}
        </div>
        <StoreStatusNotice />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Trang tổng quan</h1>
          <p className='text-gray-600 mt-2'>
            Chào mừng trở lại{store?.storeName ? `, ${store.storeName}` : ''}! Đây là tổng quan về cửa hàng của bạn.
          </p>
        </div>
        {store && (
          <Badge
            className={`px-3 py-1 ${store.status === 'Approved' || store.status === 'Active'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
              }`}
          >
            {store.status === 'Approved' || store.status === 'Active' ? 'Đã duyệt' : 'Chờ duyệt'}
          </Badge>
        )}
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
          <div className='flex items-center gap-2 mb-3'>
            <Bell className='w-5 h-5 text-orange-600' />
            <h3 className='text-sm font-semibold text-gray-900'>Thông báo & Cảnh báo</h3>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${alert.priority === 'high'
                  ? 'bg-red-50 border-red-200'
                  : alert.priority === 'medium'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                  }`}
              >
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-700'>{alert.message}</span>
                  <Badge
                    className={`ml-2 ${alert.priority === 'high'
                      ? 'bg-red-100 text-red-800'
                      : alert.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                      }`}
                  >
                    {alert.count}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {/* Total Revenue Card */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              <p className='text-sm font-medium text-gray-600'>Tổng doanh thu</p>
              <p className='text-2xl font-bold text-gray-900 mt-1'>{formatCurrency(metricsData.totalRevenue)}</p>
              <div className='flex items-center gap-1 mt-2'>
                <TrendingUp className='w-4 h-4 text-green-600' />
                <span className='text-xs text-green-600 font-medium'>
                  +{metricsData.revenueChange}% so với tháng trước
                </span>
              </div>
            </div>
            <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0'>
              <TrendingUp className='w-6 h-6 text-green-600' />
            </div>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              <p className='text-sm font-medium text-gray-600'>Tổng đơn hàng</p>
              <p className='text-2xl font-bold text-gray-900 mt-1'>{metricsData.totalOrders}</p>
              <div className='flex items-center gap-1 mt-2'>
                <Package className='w-4 h-4 text-blue-600' />
                <span className='text-xs text-blue-600 font-medium'>
                  +{metricsData.ordersChange}% so với tháng trước
                </span>
              </div>
            </div>
            <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0'>
              <Package className='w-6 h-6 text-blue-600' />
            </div>
          </div>
        </div>

        {/* Successfully Delivered Orders Card */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              <p className='text-sm font-medium text-gray-600'>Đơn hàng giao thành công</p>
              <p className='text-2xl font-bold text-gray-900 mt-1'>{metricsData.successfulOrders}</p>
              <p className='text-xs text-gray-500 mt-2'>
                Tỷ lệ: {((metricsData.successfulOrders / metricsData.totalOrders) * 100).toFixed(1)}%
              </p>
            </div>
            <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0'>
              <CheckCircle className='w-6 h-6 text-green-600' />
            </div>
          </div>
        </div>

        {/* Available Balance Card */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              <p className='text-sm font-medium text-gray-600'>Số dư khả dụng</p>
              <p className='text-2xl font-bold text-gray-900 mt-1'>{formatCurrency(metricsData.availableBalance)}</p>
              <p className='text-xs text-gray-500 mt-2'>Có thể rút ngay</p>
            </div>
            <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0'>
              <Wallet className='w-6 h-6 text-purple-600' />
            </div>
          </div>
        </div>
      </div>

      {/* Order Statistics Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Order Status Distribution */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Phân bổ đơn hàng theo trạng thái</h3>
          <div className='space-y-3'>
            {orderStatusData.map((status, index) => (
              <div key={index} className='flex items-center justify-between'>
                <div className='flex items-center gap-3 flex-1'>
                  <Badge className={status.color}>{status.label}</Badge>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-32 h-3 bg-gray-200 rounded-full overflow-hidden'>
                    <div
                      className={`h-full rounded-full ${status.status === 'Delivered'
                        ? 'bg-green-500'
                        : status.status === 'Processing' || status.status === 'Confirmed'
                          ? 'bg-yellow-500'
                          : status.status === 'Cancelled'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                        }`}
                      style={{ width: `${(status.count / metricsData.totalOrders) * 100}%` }}
                    ></div>
                  </div>
                  <span className='text-sm font-medium text-gray-900 w-12 text-right'>{status.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders Need Attention */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>Đơn hàng cần xử lý</h3>
            <Button variant='outline' size='sm' className='text-xs'>
              Xem tất cả <ArrowRight className='w-3 h-3 ml-1' />
            </Button>
          </div>
          <div className='space-y-3'>
            {ordersNeedAttention.map((order, index) => (
              <div key={index} className='p-3 bg-gray-50 rounded-lg border border-gray-200'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-900'>#{order.id}</span>
                  <Badge
                    className={
                      order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }
                  >
                    {order.status === 'Processing' ? 'Chờ xác nhận' : 'Đã xác nhận'}
                  </Badge>
                </div>
                <div className='flex items-center justify-between text-xs text-gray-600'>
                  <span>{order.customer}</span>
                  <span className='font-medium text-gray-900'>{order.amount.toLocaleString()} ₫</span>
                </div>
                <p className='text-xs text-gray-500 mt-1'>{order.createdAt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics & Reports Section */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-lg font-semibold text-gray-900'>Thống kê & Báo cáo</h3>
          <select className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500'>
            <option value='2025'>2025</option>
            <option value='2024'>2024</option>
            <option value='2023'>2023</option>
          </select>
        </div>

        {/* Charts Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Revenue by Month Chart */}
          <div className='lg:col-span-2'>
            <h4 className='text-md font-medium text-gray-700 mb-4'>Doanh thu theo tháng</h4>
            <div className='h-64 relative'>
              {/* Y-axis labels */}
              <div className='absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2'>
                <span>{formatCurrency(getMaxRevenue())}</span>
                <span>{formatCurrency(getMaxRevenue() * 0.75)}</span>
                <span>{formatCurrency(getMaxRevenue() * 0.5)}</span>
                <span>{formatCurrency(getMaxRevenue() * 0.25)}</span>
                <span>0</span>
              </div>

              {/* Chart area */}
              <div className='ml-8 h-full flex items-end justify-between gap-1'>
                {revenueByMonth.map((item, index) => {
                  const height = (item.revenue / getMaxRevenue()) * 100
                  return (
                    <div key={index} className='flex-1 flex flex-col items-center'>
                      <div
                        className='w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer'
                        style={{ height: `${height}%` }}
                        title={`${item.month}: ${formatCurrency(item.revenue)}`}
                      ></div>
                    </div>
                  )
                })}
              </div>

              {/* X-axis labels */}
              <div className='absolute bottom-0 left-8 right-0 flex justify-between text-xs text-gray-500'>
                {revenueByMonth.map((item, index) => (
                  <span key={index} className='flex-1 text-center'>
                    {item.month}
                  </span>
                ))}
              </div>
            </div>
            <p className='text-xs text-gray-500 mt-2 ml-8'>Doanh thu (VNĐ)</p>
          </div>

          {/* Revenue by Payment Method */}
          <div>
            <h4 className='text-md font-medium text-gray-700 mb-4'>Doanh thu theo phương thức</h4>
            <div className='space-y-4'>
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm text-gray-600'>Banking</span>
                  <span className='text-sm font-medium text-gray-900'>
                    {formatCurrency(revenueByPaymentMethod.banking)}
                  </span>
                </div>
                <div className='w-full h-4 bg-gray-200 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-blue-500 rounded-full'
                    style={{
                      width: `${(revenueByPaymentMethod.banking /
                        (revenueByPaymentMethod.banking + revenueByPaymentMethod.cod)) *
                        100
                        }%`
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm text-gray-600'>COD</span>
                  <span className='text-sm font-medium text-gray-900'>
                    {formatCurrency(revenueByPaymentMethod.cod)}
                  </span>
                </div>
                <div className='w-full h-4 bg-gray-200 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-orange-500 rounded-full'
                    style={{
                      width: `${(revenueByPaymentMethod.cod /
                        (revenueByPaymentMethod.banking + revenueByPaymentMethod.cod)) *
                        100
                        }%`
                    }}
                  />
                </div>
              </div>
              <div className='pt-4 border-t'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-900'>Tổng cộng</span>
                  <span className='text-sm font-bold text-gray-900'>
                    {formatCurrency(revenueByPaymentMethod.banking + revenueByPaymentMethod.cod)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders by Month Chart */}
        <div className='mt-8'>
          <h4 className='text-md font-medium text-gray-700 mb-4'>Số lượng đơn hàng theo tháng</h4>
          <div className='h-64 relative'>
            {/* Y-axis labels */}
            <div className='absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2'>
              <span>{getMaxOrders()}</span>
              <span>{Math.round(getMaxOrders() * 0.75)}</span>
              <span>{Math.round(getMaxOrders() * 0.5)}</span>
              <span>{Math.round(getMaxOrders() * 0.25)}</span>
              <span>0</span>
            </div>

            {/* Chart area */}
            <div className='ml-8 h-full flex items-end justify-between gap-1'>
              {ordersByMonth.map((item, index) => {
                const height = (item.orders / getMaxOrders()) * 100
                return (
                  <div key={index} className='flex-1 flex flex-col items-center'>
                    <div
                      className='w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer'
                      style={{ height: `${height}%` }}
                      title={`${item.month}: ${item.orders} đơn`}
                    ></div>
                  </div>
                )
              })}
            </div>

            {/* X-axis labels */}
            <div className='absolute bottom-0 left-8 right-0 flex justify-between text-xs text-gray-500'>
              {ordersByMonth.map((item, index) => (
                <span key={index} className='flex-1 text-center'>
                  {item.month}
                </span>
              ))}
            </div>
          </div>
          <p className='text-xs text-gray-500 mt-2 ml-8'>Số lượng đơn hàng</p>
        </div>
      </div>

      {/* Product Performance Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Top Selling Products */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>Top Sản phẩm Bán chạy</h3>
            <Button variant='outline' size='sm' className='text-xs'>
              Xem tất cả <ArrowRight className='w-3 h-3 ml-1' />
            </Button>
          </div>
          <div className='space-y-4'>
            {topProducts.map((product, index) => (
              <div key={index} className='flex items-center justify-between'>
                <span className='text-sm text-gray-700 flex-1'>{product.name}</span>
                <div className='flex items-center gap-2'>
                  <div className='w-32 h-3 bg-gray-200 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-orange-500 rounded-full'
                      style={{ width: `${product.percentage}%` }}
                    ></div>
                  </div>
                  <span className='text-sm font-medium text-gray-900 w-20 text-right'>
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className='text-xs text-gray-500 mt-4'>Doanh thu (VNĐ)</p>
        </div>

        {/* Low Stock Products */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>Sản phẩm tồn kho sắp hết</h3>
            <Button variant='outline' size='sm' className='text-xs'>
              Xem tất cả <ArrowRight className='w-3 h-3 ml-1' />
            </Button>
          </div>
          <div className='space-y-3'>
            {lowStockProducts.map((product, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${product.level === 'critical' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                  }`}
              >
                <span className='text-sm text-gray-700'>{product.name}</span>
                <span
                  className={`text-sm font-medium ${product.level === 'critical' ? 'text-red-600' : 'text-yellow-600'}`}
                >
                  {product.quantity} sản phẩm
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Promotion Stats & Quick Actions */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Promotion Stats */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>Thống kê Khuyến mãi</h3>
            <Button variant='outline' size='sm' className='text-xs'>
              Quản lý <ArrowRight className='w-3 h-3 ml-1' />
            </Button>
          </div>
          <div className='grid grid-cols-3 gap-4'>
            <div className='text-center p-4 bg-purple-50 rounded-lg border border-purple-200'>
              <p className='text-2xl font-bold text-purple-600'>{promotionStats.active}</p>
              <p className='text-xs text-gray-600 mt-1'>Đang hoạt động</p>
            </div>
            <div className='text-center p-4 bg-orange-50 rounded-lg border border-orange-200'>
              <p className='text-2xl font-bold text-orange-600'>{promotionStats.expiringSoon}</p>
              <p className='text-xs text-gray-600 mt-1'>Sắp hết hạn</p>
            </div>
            <div className='text-center p-4 bg-blue-50 rounded-lg border border-blue-200'>
              <p className='text-2xl font-bold text-blue-600'>{promotionStats.totalUsage.toLocaleString()}</p>
              <p className='text-xs text-gray-600 mt-1'>Tổng lượt dùng</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Thao tác nhanh</h3>
          <div className='grid grid-cols-2 gap-3'>
            <Button variant='outline' className='h-auto p-4 flex flex-col items-center gap-2'>
              <Plus className='w-5 h-5 text-green-600' />
              <span className='text-sm'>Tạo sản phẩm</span>
            </Button>
            <Button variant='outline' className='h-auto p-4 flex flex-col items-center gap-2'>
              <ShoppingCart className='w-5 h-5 text-blue-600' />
              <span className='text-sm'>Tạo combo</span>
            </Button>
            <Button variant='outline' className='h-auto p-4 flex flex-col items-center gap-2'>
              <Gift className='w-5 h-5 text-purple-600' />
              <span className='text-sm'>Tạo khuyến mãi</span>
            </Button>
            <Button variant='outline' className='h-auto p-4 flex flex-col items-center gap-2'>
              <FileText className='w-5 h-5 text-orange-600' />
              <span className='text-sm'>Xem đơn hàng</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
