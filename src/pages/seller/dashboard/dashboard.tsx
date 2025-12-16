import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import StoreStatusNotice from '../../../components/Seller/StoreStatusNotice'
import { useStore } from '../../../contexts/store.context'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import Loading from '../../../components/Loading/loading'
import { toast } from '../../../utils/toast'
import { sellerApi } from '../../../apis/seller.api'
import type { Order } from '../../../types/orderType'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)
import type {
  OverviewStats,
  OrderStatusDistribution,
  TopSellingProduct,
  LowStockProduct,
  PromotionStatistics,
  SalesReport,
  OrderCountResponse
} from '../../../apis/seller.api'
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
  FileText,
  RefreshCw
} from 'lucide-react'

function Dashboard() {
  const { store, isStoreApproved } = useStore()

  // State for API data
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null)
  const [orderStatusDistribution, setOrderStatusDistribution] = useState<OrderStatusDistribution | null>(null)
  const [ordersNeedingProcessing, setOrdersNeedingProcessing] = useState<Order[]>([])
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null)
  const [orderCount, setOrderCount] = useState<OrderCountResponse | null>(null)
  const [topProducts, setTopProducts] = useState<TopSellingProduct[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [promotionStats, setPromotionStats] = useState<PromotionStatistics | null>(null)

  // Loading states
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [
        overviewData,
        orderStatusData,
        ordersData,
        salesData,
        orderCountData,
        topProductsData,
        lowStockData,
        promotionData
      ] = await Promise.all([
        sellerApi.getOverviewStats().catch(() => null),
        sellerApi.getOrderStatusDistribution().catch(() => null),
        sellerApi
          .getOrdersNeedingProcessing({ pageSize: 5, pageNumber: 1 })
          .catch(() => ({ data: [], pagination: { totalItems: 0 } })),
        sellerApi.getSalesReport({ period: 'year', year: selectedYear }).catch(() => null),
        sellerApi.getOrderCount({ year: selectedYear }).catch(() => null),
        sellerApi.getTopSellingProducts({ limit: 5 }).catch(() => []),
        sellerApi.getLowStockProducts({ limit: 5 }).catch(() => []),
        sellerApi.getPromotionStatistics().catch(() => null)
      ])

      if (overviewData) setOverviewStats(overviewData)
      if (orderStatusData) setOrderStatusDistribution(orderStatusData)
      if (ordersData?.data) setOrdersNeedingProcessing(ordersData.data)
      if (salesData) setSalesReport(salesData)
      if (orderCountData) setOrderCount(orderCountData)
      if (topProductsData) setTopProducts(topProductsData)
      if (lowStockData) setLowStockProducts(lowStockData)
      if (promotionData) setPromotionStats(promotionData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Không thể tải dữ liệu dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
    toast.success('Đã làm mới dữ liệu')
  }

  // Initial fetch
  useEffect(() => {
    if (isStoreApproved) {
      fetchDashboardData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStoreApproved, selectedYear])

  // Map order status distribution to display format
  const getOrderStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      Processing: 'Chờ xác nhận',
      Confirmed: 'Đã xác nhận',
      Delivered: 'Đã giao',
      Cancelled: 'Đã hủy',
      Cancel: 'Đã hủy',
      Picking: 'Đang lấy hàng',
      Picked: 'Đã lấy hàng',
      ReadyToPick: 'Sẵn sàng lấy hàng',
      Transporting: 'Đang vận chuyển',
      Paid: 'Đã thanh toán',
      NotYet: 'Chưa xử lý'
    }
    return statusMap[status] || 'Chưa xác định'
  }

  const getOrderStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      Processing: 'bg-yellow-100 text-yellow-800',
      Confirmed: 'bg-blue-100 text-blue-800',
      Delivered: 'bg-green-100 text-green-800',
      Cancelled: 'bg-red-100 text-red-800',
      Cancel: 'bg-red-100 text-red-800',
      Picking: 'bg-purple-100 text-purple-800',
      Picked: 'bg-purple-100 text-purple-800',
      ReadyToPick: 'bg-purple-100 text-purple-800',
      Transporting: 'bg-indigo-100 text-indigo-800',
      Paid: 'bg-green-100 text-green-800',
      NotYet: 'bg-gray-100 text-gray-800'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }

  // Transform order status distribution to array
  const orderStatusData =
    orderStatusDistribution &&
      orderStatusDistribution.statusCounts &&
      typeof orderStatusDistribution.statusCounts === 'object'
      ? Object.entries(orderStatusDistribution.statusCounts).map(([status, count]) => ({
        status,
        label: getOrderStatusLabel(status),
        count: (count as number) || 0,
        color: getOrderStatusColor(status)
      }))
      : []

  // Transform sales report to chart data
  const revenueByMonth =
    salesReport &&
      salesReport.labels &&
      Array.isArray(salesReport.labels) &&
      salesReport.data &&
      Array.isArray(salesReport.data)
      ? salesReport.labels.map((label, index) => ({
        month: label,
        revenue: salesReport.data[index] || 0
      }))
      : []

  // Orders by month from API
  const ordersByMonth =
    orderCount && orderCount.monthlyBreakdown && Array.isArray(orderCount.monthlyBreakdown)
      ? orderCount.monthlyBreakdown.map((item) => ({
        month: item.label,
        orders: item.count || 0
      }))
      : []

  // Calculate alerts from real data
  const alerts = []
  if (Array.isArray(ordersNeedingProcessing) && ordersNeedingProcessing.length > 0) {
    alerts.push({
      type: 'order',
      message: `${ordersNeedingProcessing.length} đơn hàng đang chờ xử lý`,
      count: ordersNeedingProcessing.length,
      priority: 'high' as const
    })
  }
  if (Array.isArray(lowStockProducts) && lowStockProducts.length > 0) {
    alerts.push({
      type: 'stock',
      message: `${lowStockProducts.length} sản phẩm sắp hết hàng`,
      count: lowStockProducts.length,
      priority: 'medium' as const
    })
  }
  if (promotionStats && promotionStats.expiringSoonPromotions > 0) {
    alerts.push({
      type: 'promotion',
      message: `${promotionStats.expiringSoonPromotions} khuyến mãi sắp hết hạn`,
      count: promotionStats.expiringSoonPromotions,
      priority: 'low' as const
    })
  }

  // Calculate revenue change (mock for now, can be enhanced with previous period data)
  const revenueChange = 0 // TODO: Calculate from previous period
  const ordersChange = 0 // TODO: Calculate from previous period

  // Helper functions
  const formatCurrency = (amount: number) => {
    if (!amount && amount !== 0) return '0₫'
    // Format số với dấu chấm phân cách hàng nghìn và ký hiệu ₫ ngay sau số
    const roundedAmount = Math.round(amount)
    return `${roundedAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}₫`
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return dateString
    }
  }

  // Chart.js tự động tính toán max values, không cần các hàm này nữa
  // const getMaxRevenue = () => {
  //   if (!Array.isArray(revenueByMonth) || revenueByMonth.length === 0) return 1
  //   return Math.max(...revenueByMonth.map((m) => m.revenue || 0), 1)
  // }

  // const getMaxOrders = () => {
  //   if (!Array.isArray(ordersByMonth) || ordersByMonth.length === 0) return 1
  //   return Math.max(...ordersByMonth.map((m) => m.orders || 0), 1)
  // }

  // Calculate top products percentage
  const topProductsWithPercentage =
    Array.isArray(topProducts) && topProducts.length > 0
      ? topProducts.map((product, index) => {
        const maxRevenue = topProducts[0]?.totalSold || 1
        return {
          name: product.productName || 'Không có',
          revenue: product.totalSold || 0,
          percentage: index === 0 ? 100 : ((product.totalSold || 0) / maxRevenue) * 100
        }
      })
      : []

  // Transform low stock products
  const lowStockProductsDisplay =
    Array.isArray(lowStockProducts) && lowStockProducts.length > 0
      ? lowStockProducts.map((product) => ({
        name: product.productName || 'N/A',
        quantity: product.remainingQuantity || 0,
        level: (product.remainingQuantity || 0) <= 5 ? ('critical' as const) : ('warning' as const)
      }))
      : []

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

  // Loading state
  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loading />
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
        <div className='flex items-center gap-3'>
          <Button onClick={handleRefresh} disabled={refreshing} variant='outline' size='sm'>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </Button>
          {store && (
            <Badge
              className={`px-3 py-1 ${store.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}
            >
              {store.status === 'Approved' ? 'Đã duyệt' : 'Chờ duyệt'}
            </Badge>
          )}
        </div>
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
              <p className='text-2xl font-bold text-gray-900 mt-1'>
                {formatCurrency(overviewStats?.totalRevenue || 0)}
              </p>
              {revenueChange > 0 && (
                <div className='flex items-center gap-1 mt-2'>
                  <TrendingUp className='w-4 h-4 text-green-600' />
                  <span className='text-xs text-green-600 font-medium'>+{revenueChange}% so với tháng trước</span>
                </div>
              )}
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
              <p className='text-2xl font-bold text-gray-900 mt-1'>{overviewStats?.totalOrders || 0}</p>
              {ordersChange > 0 && (
                <div className='flex items-center gap-1 mt-2'>
                  <Package className='w-4 h-4 text-blue-600' />
                  <span className='text-xs text-blue-600 font-medium'>+{ordersChange}% so với tháng trước</span>
                </div>
              )}
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
              <p className='text-2xl font-bold text-gray-900 mt-1'>{overviewStats?.successfulOrders || 0}</p>
              {overviewStats && overviewStats.totalOrders > 0 && (
                <p className='text-xs text-gray-500 mt-2'>
                  Tỷ lệ: {((overviewStats.successfulOrders / overviewStats.totalOrders) * 100).toFixed(1)}%
                </p>
              )}
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
              <p className='text-2xl font-bold text-gray-900 mt-1'>
                {formatCurrency(overviewStats?.availableBalance || 0)}
              </p>
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
          {orderStatusData.length === 0 ? (
            <p className='text-sm text-gray-500 text-center py-4'>Chưa có dữ liệu</p>
          ) : (
            <div className='space-y-3'>
              {orderStatusData.map((status, index) => {
                const totalOrders = orderStatusData.reduce((sum, s) => sum + s.count, 0)
                return (
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
                          style={{ width: `${totalOrders > 0 ? (status.count / totalOrders) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className='text-sm font-medium text-gray-900 w-12 text-right'>{status.count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Orders Need Attention */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>Đơn hàng cần xử lý</h3>
            <Button variant='outline' size='sm' className='text-xs'>
              Xem tất cả <ArrowRight className='w-3 h-3 ml-1' />
            </Button>
          </div>
          {ordersNeedingProcessing.length === 0 ? (
            <p className='text-sm text-gray-500 text-center py-4'>Không có đơn hàng cần xử lý</p>
          ) : (
            <div className='space-y-3'>
              {ordersNeedingProcessing.map((order: Order) => (
                <div key={order.id} className='p-3 bg-gray-50 rounded-lg border border-gray-200'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-900'>#{order.ghnorderCode || order.id}</span>
                    <Badge
                      className={
                        order.status === 'Processing' || order.status === 'NotYet'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }
                    >
                      {getOrderStatusLabel(order.status || 'Processing')}
                    </Badge>
                  </div>
                  <div className='flex items-center justify-between text-xs text-gray-600'>
                    <span>{order.toName || 'Khách hàng'}</span>
                    <span className='font-medium text-gray-900'>
                      {formatCurrency(order.finalPrice || order.totalOrder || 0)}
                    </span>
                  </div>
                  {order.createdAt && <p className='text-xs text-gray-500 mt-1'>{formatDate(order.createdAt)}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Statistics & Reports Section */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-lg font-semibold text-gray-900'>Thống kê & Báo cáo</h3>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500'
          >
            <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
            <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
            <option value={new Date().getFullYear() - 2}>{new Date().getFullYear() - 2}</option>
          </select>
        </div>

        {/* Charts Grid */}
        <div className='space-y-8'>
          {/* Revenue by Month Chart */}
          <motion.div
            className='w-full'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h4 className='text-md font-medium text-gray-700 mb-4'>Doanh thu theo tháng</h4>
            <div className='h-64 w-full'>
              {Array.isArray(revenueByMonth) && revenueByMonth.length > 0 ? (
                <Line
                  data={{
                    labels: revenueByMonth.map((item) => item.month),
                    datasets: [
                      {
                        label: 'Doanh thu (₫)',
                        data: revenueByMonth.map((item) => item.revenue || 0),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                          size: 14,
                          weight: 'bold'
                        },
                        bodyFont: {
                          size: 13
                        },
                        callbacks: {
                          label: function (context) {
                            const value = Number(context.parsed.y) || 0
                            return `Doanh thu: ${formatCurrency(value)}`
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function (value) {
                            return formatCurrency(Number(value))
                          },
                          font: {
                            size: 11
                          }
                        },
                        grid: {
                          color: 'rgba(229, 231, 235, 0.5)'
                        }
                      },
                      x: {
                        ticks: {
                          font: {
                            size: 11
                          }
                        },
                        grid: {
                          display: false
                        }
                      }
                    },
                    animation: {
                      duration: 1500,
                      easing: 'easeInOutQuart'
                    }
                  }}
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center text-sm text-gray-500'>
                  Chưa có dữ liệu
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Orders by Month Chart */}
        <motion.div
          className='mt-8'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h4 className='text-md font-medium text-gray-700 mb-4'>Số lượng đơn hàng theo tháng</h4>
          <div className='h-64'>
            {Array.isArray(ordersByMonth) && ordersByMonth.length > 0 ? (
              <Line
                data={{
                  labels: ordersByMonth.map((item) => item.month),
                  datasets: [
                    {
                      label: 'Số lượng đơn hàng',
                      data: ordersByMonth.map((item) => item.orders || 0),
                      borderColor: '#3b82f6',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderWidth: 2,
                      fill: true,
                      tension: 0.4,
                      pointRadius: 4,
                      pointHoverRadius: 6,
                      pointBackgroundColor: '#3b82f6',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 2
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      padding: 12,
                      titleFont: {
                        size: 14,
                        weight: 'bold'
                      },
                      bodyFont: {
                        size: 13
                      },
                      callbacks: {
                        label: function (context) {
                          return `Số lượng: ${context.parsed.y} đơn`
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                        font: {
                          size: 11
                        }
                      },
                      grid: {
                        color: 'rgba(229, 231, 235, 0.5)'
                      }
                    },
                    x: {
                      ticks: {
                        font: {
                          size: 11
                        }
                      },
                      grid: {
                        display: false
                      }
                    }
                  },
                  animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                  }
                }}
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center text-sm text-gray-500'>
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </motion.div>
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
          {topProductsWithPercentage.length === 0 ? (
            <p className='text-sm text-gray-500 text-center py-4'>Chưa có dữ liệu</p>
          ) : (
            <>
              <div className='space-y-4'>
                {topProductsWithPercentage.map((product, index) => (
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
                        {product.revenue} sản phẩm
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className='text-xs text-gray-500 mt-4'>Số lượng bán (sản phẩm)</p>
            </>
          )}
        </div>

        {/* Low Stock Products */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>Sản phẩm tồn kho sắp hết</h3>
            <Button variant='outline' size='sm' className='text-xs'>
              Xem tất cả <ArrowRight className='w-3 h-3 ml-1' />
            </Button>
          </div>
          {lowStockProductsDisplay.length === 0 ? (
            <p className='text-sm text-gray-500 text-center py-4'>Không có sản phẩm sắp hết hàng</p>
          ) : (
            <div className='space-y-3'>
              {lowStockProductsDisplay.map((product, index) => (
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
          )}
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
          {promotionStats ? (
            <div className='grid grid-cols-3 gap-4'>
              <div className='text-center p-4 bg-purple-50 rounded-lg border border-purple-200'>
                <p className='text-2xl font-bold text-purple-600'>{promotionStats.activePromotions}</p>
                <p className='text-xs text-gray-600 mt-1'>Đang hoạt động</p>
              </div>
              <div className='text-center p-4 bg-orange-50 rounded-lg border border-orange-200'>
                <p className='text-2xl font-bold text-orange-600'>{promotionStats.expiringSoonPromotions}</p>
                <p className='text-xs text-gray-600 mt-1'>Sắp hết hạn</p>
              </div>
              <div className='text-center p-4 bg-blue-50 rounded-lg border border-blue-200'>
                <p className='text-2xl font-bold text-blue-600'>{promotionStats.totalUsage.toLocaleString()}</p>
                <p className='text-xs text-gray-600 mt-1'>Tổng lượt dùng</p>
              </div>
            </div>
          ) : (
            <p className='text-sm text-gray-500 text-center py-4'>Chưa có dữ liệu</p>
          )}
        </div>


      </div>
    </div>
  )
}

export default Dashboard
