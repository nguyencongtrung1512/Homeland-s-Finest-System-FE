import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import {
  Wallet,
  TrendingUp,
  Clock,
  AlertCircle,
  DollarSign,
  Receipt,
  Calendar,
  BarChart3,
  PieChart,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'
import Loading from '../../../components/Loading/loading'
import { toast } from '../../../utils/toast'
import {
  sellerApi,
  type DashboardFinanceData,
  type RevenueByDay
} from '../../../apis/seller.api'

function FinanceDashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<DashboardFinanceData | null>(null)
  const [days, setDays] = useState(30)

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const dashboardData = await sellerApi.getFinanceDashboard({
        days,
        pageNumber: 1,
        pageSize: 5 // Latest 5 transactions
      })
      setData(dashboardData)
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      toast.error(error?.response?.data?.message || 'Không thể tải dữ liệu dashboard')
      // Set mock data for development
      setData(getMockData())
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
    toast.success('Đã làm mới dữ liệu')
  }

  useEffect(() => {
    fetchDashboardData()
  }, [days])

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M ₫`
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}k ₫`
    }
    return `${amount.toLocaleString()} ₫`
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return dateString
    }
  }

  // Get max revenue for chart scaling
  const getMaxRevenue = () => {
    if (!data?.charts.revenue30Days.length) return 1
    return Math.max(...data.charts.revenue30Days.map((d) => Math.max(d.netRevenue, d.commission)))
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loading />
      </div>
    )
  }

  if (!data) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen'>
        <AlertCircle className='w-12 h-12 text-gray-400 mb-4' />
        <p className='text-gray-600'>Không thể tải dữ liệu dashboard</p>
        <Button onClick={fetchDashboardData} className='mt-4'>
          Thử lại
        </Button>
      </div>
    )
  }

  return (
    <div className='space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>Dashboard Tài Chính</h1>
          <p className='text-sm sm:text-base text-gray-600 mt-1'>Tổng quan về tài chính và doanh thu của bạn</p>
        </div>
        <div className='flex gap-2'>
          <Button onClick={handleRefresh} disabled={refreshing} variant='outline' className='w-full sm:w-auto'>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>
      </div>

      {/* 1. Wallet Overview */}
      <div>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>Tổng Quan Ví</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* Available Balance */}
          <Card className='hover:shadow-md transition-shadow'>
            <CardContent className='p-6'>
              <div className='flex justify-between items-start'>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-600 mb-2'>Số dư khả dụng</p>
                  <p className='text-2xl font-bold text-green-600 mb-1'>
                    {data.walletOverview.availableBalance.toLocaleString()} ₫
                  </p>
                  <p className='text-xs text-gray-500'>Có thể rút ngay</p>
                </div>
                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                  <Wallet className='w-6 h-6 text-green-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Balance */}
          <Card className='hover:shadow-md transition-shadow'>
            <CardContent className='p-6'>
              <div className='flex justify-between items-start'>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-600 mb-2'>Tiền đang chờ về</p>
                  <p className='text-2xl font-bold text-blue-600 mb-1'>
                    {data.walletOverview.pendingBalance.toLocaleString()} ₫
                  </p>
                  <p className='text-xs text-gray-500'>Từ đơn hàng chưa giao</p>
                </div>
                <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                  <Clock className='w-6 h-6 text-blue-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debt Balance */}
          <Card className='hover:shadow-md transition-shadow'>
            <CardContent className='p-6'>
              <div className='flex justify-between items-start'>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-600 mb-2'>Nợ hoa hồng</p>
                  <p className='text-2xl font-bold text-red-600 mb-1'>
                    {data.walletOverview.debtBalance.toLocaleString()} ₫
                  </p>
                  <p className='text-xs text-gray-500'>Hoa hồng COD chưa trả</p>
                </div>
                <div className='w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                  <AlertCircle className='w-6 h-6 text-red-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Asset */}
          <Card className='hover:shadow-md transition-shadow border-2 border-purple-200'>
            <CardContent className='p-6'>
              <div className='flex justify-between items-start'>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-600 mb-2'>Tổng tài sản thực</p>
                  <p className='text-2xl font-bold text-purple-600 mb-1'>
                    {data.walletOverview.netAsset.toLocaleString()} ₫
                  </p>
                  <p className='text-xs text-gray-500'>Số dư + Chờ - Nợ</p>
                </div>
                <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                  <DollarSign className='w-6 h-6 text-purple-600' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. Performance Metrics */}
      <div>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>Hiệu Quả Kinh Doanh</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* Gross Revenue */}
          <Card className='hover:shadow-md transition-shadow'>
            <CardContent className='p-6'>
              <div className='flex justify-between items-start'>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-600 mb-2'>Tổng doanh thu</p>
                  <p className='text-2xl font-bold text-green-600 mb-1'>
                    {data.performanceMetrics.grossRevenue.toLocaleString()} ₫
                  </p>
                  <p className='text-xs text-gray-500'>Tổng bán được</p>
                </div>
                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                  <TrendingUp className='w-6 h-6 text-green-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Income */}
          <Card className='hover:shadow-md transition-shadow'>
            <CardContent className='p-6'>
              <div className='flex justify-between items-start'>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-600 mb-2'>Thu nhập ròng</p>
                  <p className='text-2xl font-bold text-blue-600 mb-1'>
                    {data.performanceMetrics.netIncome.toLocaleString()} ₫
                  </p>
                  <p className='text-xs text-gray-500'>Sau khi trừ hoa hồng</p>
                </div>
                <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                  <DollarSign className='w-6 h-6 text-blue-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Commission Paid */}
          <Card className='hover:shadow-md transition-shadow'>
            <CardContent className='p-6'>
              <div className='flex justify-between items-start'>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-600 mb-2'>Tổng hoa hồng đã trả</p>
                  <p className='text-2xl font-bold text-purple-600 mb-1'>
                    {data.performanceMetrics.totalCommissionPaid.toLocaleString()} ₫
                  </p>
                  <p className='text-xs text-gray-500'>Đã thanh toán</p>
                </div>
                <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                  <Receipt className='w-6 h-6 text-purple-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profit Margin */}
          <Card className='hover:shadow-md transition-shadow border-2 border-orange-200'>
            <CardContent className='p-6'>
              <div className='flex justify-between items-start'>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-600 mb-2'>Tỷ suất lợi nhuận</p>
                  <p className='text-2xl font-bold text-orange-600 mb-1'>
                    {data.performanceMetrics.profitMargin !== null
                      ? `${data.performanceMetrics.profitMargin.toFixed(1)}%`
                      : 'N/A'}
                  </p>
                  <p className='text-xs text-gray-500'>Thu nhập / Doanh thu</p>
                </div>
                <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                  <BarChart3 className='w-6 h-6 text-orange-600' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Cash Flow Forecast */}
      <div>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>Dự Báo Dòng Tiền</h2>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          {/* Upcoming Payouts */}
          <Card className='lg:col-span-2 hover:shadow-md transition-shadow'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='w-5 h-5' />
                Lịch về tiền sắp tới
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.cashFlowForecast.upcomingPayouts.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  <Calendar className='w-12 h-12 mx-auto mb-2 text-gray-300' />
                  <p>Không có khoản thanh toán sắp tới</p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {data.cashFlowForecast.upcomingPayouts.map((payout, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200'
                    >
                      <div>
                        <p className='font-semibold text-gray-900'>{formatDate(payout.payoutDate)}</p>
                        <p className='text-sm text-gray-600'>{payout.orderCount} đơn hàng</p>
                      </div>
                      <div className='text-right'>
                        <p className='text-lg font-bold text-blue-600'>{formatCurrency(payout.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Frozen Amount */}
          <Card className='hover:shadow-md transition-shadow'>
            <CardContent className='p-6'>
              <div className='flex flex-col items-center justify-center h-full'>
                <div className='w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4'>
                  <AlertCircle className='w-8 h-8 text-orange-600' />
                </div>
                <p className='text-sm font-medium text-gray-600 mb-2 text-center'>Tiền bị đóng băng</p>
                <p className='text-3xl font-bold text-orange-600 mb-2'>
                  {data.cashFlowForecast.frozenAmount.toLocaleString()} ₫
                </p>
                <p className='text-xs text-gray-500 text-center'>Từ đơn hàng có khiếu nại</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Charts */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold text-gray-900'>Biểu Đồ Thống Kê</h2>
          <div className='flex gap-2'>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500'
            >
              <option value={7}>7 ngày</option>
              <option value={30}>30 ngày</option>
              <option value={90}>90 ngày</option>
            </select>
          </div>
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          {/* Revenue 30 Days Chart */}
          <Card className='lg:col-span-2 hover:shadow-md transition-shadow'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BarChart3 className='w-5 h-5' />
                Doanh thu {days} ngày gần nhất
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                  {data.charts.revenue30Days.map((item, index) => {
                    const maxRevenue = getMaxRevenue()
                    const netHeight = maxRevenue > 0 ? (item.netRevenue / maxRevenue) * 100 : 0
                    const commissionHeight = maxRevenue > 0 ? (item.commission / maxRevenue) * 100 : 0
                    return (
                      <div key={index} className='flex-1 flex flex-col items-center gap-1'>
                        <div className='w-full flex flex-col items-end gap-0.5'>
                          <div
                            className='w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer'
                            style={{ height: `${netHeight}%` }}
                            title={`${formatDate(item.date)}: Doanh thu ${formatCurrency(item.netRevenue)}`}
                          ></div>
                          <div
                            className='w-full bg-purple-500 rounded-t hover:bg-purple-600 transition-colors cursor-pointer'
                            style={{ height: `${commissionHeight}%` }}
                            title={`${formatDate(item.date)}: Hoa hồng ${formatCurrency(item.commission)}`}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* X-axis labels */}
                <div className='absolute bottom-0 left-8 right-0 flex justify-between text-xs text-gray-500'>
                  {data.charts.revenue30Days.map((item, index) => (
                    <span key={index} className='flex-1 text-center'>
                      {formatDate(item.date).split('/')[0]}
                    </span>
                  ))}
                </div>
              </div>
              <div className='flex items-center justify-center gap-4 mt-4'>
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 bg-green-500 rounded'></div>
                  <span className='text-xs text-gray-600'>Doanh thu</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 bg-purple-500 rounded'></div>
                  <span className='text-xs text-gray-600'>Hoa hồng</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Distribution */}
          <Card className='hover:shadow-md transition-shadow'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <PieChart className='w-5 h-5' />
                Phân bổ phương thức thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm text-gray-600'>Banking</span>
                    <span className='text-sm font-medium text-gray-900'>
                      {formatCurrency(data.charts.paymentMethodDistribution.banking.totalAmount)}
                    </span>
                  </div>
                  <div className='w-full h-4 bg-gray-200 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-blue-500 rounded-full'
                      style={{
                        width: `${
                          (data.charts.paymentMethodDistribution.banking.totalAmount /
                            (data.charts.paymentMethodDistribution.banking.totalAmount +
                              data.charts.paymentMethodDistribution.cod.totalAmount)) *
                          100
                        }%`
                      }}
                    ></div>
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    {data.charts.paymentMethodDistribution.banking.count} đơn hàng
                  </p>
                </div>
                <div>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm text-gray-600'>COD</span>
                    <span className='text-sm font-medium text-gray-900'>
                      {formatCurrency(data.charts.paymentMethodDistribution.cod.totalAmount)}
                    </span>
                  </div>
                  <div className='w-full h-4 bg-gray-200 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-orange-500 rounded-full'
                      style={{
                        width: `${
                          (data.charts.paymentMethodDistribution.cod.totalAmount /
                            (data.charts.paymentMethodDistribution.banking.totalAmount +
                              data.charts.paymentMethodDistribution.cod.totalAmount)) *
                          100
                        }%`
                      }}
                    />
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    {data.charts.paymentMethodDistribution.cod.count} đơn hàng
                  </p>
                </div>
                <div className='pt-4 border-t'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-gray-900'>Tổng cộng</span>
                    <span className='text-sm font-bold text-gray-900'>
                      {formatCurrency(
                        data.charts.paymentMethodDistribution.banking.totalAmount +
                          data.charts.paymentMethodDistribution.cod.totalAmount
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 5. Latest Transactions */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold text-gray-900'>Giao Dịch Gần Đây</h2>
          <Button variant='outline' size='sm' onClick={() => window.location.href = '/seller/finance'}>
            Xem tất cả <ArrowRight className='w-4 h-4 ml-1' />
          </Button>
        </div>
        <Card className='hover:shadow-md transition-shadow'>
          <CardContent className='p-6'>
            {data.transactionHistory.items.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                <Receipt className='w-12 h-12 mx-auto mb-2 text-gray-300' />
                <p>Không có giao dịch nào</p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-gray-200'>
                      <th className='text-left py-3 px-4 font-medium text-gray-700 text-sm'>Thời gian</th>
                      <th className='text-left py-3 px-4 font-medium text-gray-700 text-sm'>Loại giao dịch</th>
                      <th className='text-left py-3 px-4 font-medium text-gray-700 text-sm'>Số tiền</th>
                      <th className='text-left py-3 px-4 font-medium text-gray-700 text-sm'>Số dư sau GD</th>
                      <th className='text-left py-3 px-4 font-medium text-gray-700 text-sm'>Mã đơn hàng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactionHistory.items.map((transaction) => (
                      <tr key={transaction.id} className='border-b border-gray-100 hover:bg-gray-50'>
                        <td className='py-4 px-4 text-gray-700 text-sm'>{formatDate(transaction.createdAt)}</td>
                        <td className='py-4 px-4 text-gray-700 text-sm'>{transaction.type}</td>
                        <td className='py-4 px-4 text-gray-900 font-medium text-sm'>
                          {transaction.amount.toLocaleString()} ₫
                        </td>
                        <td className='py-4 px-4 text-gray-700 text-sm'>
                          {transaction.balanceAfter.toLocaleString()} ₫
                        </td>
                        <td className='py-4 px-4 text-gray-700 text-sm'>
                          {transaction.orderId ? `#${transaction.orderId.slice(0, 8)}...` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Mock data for development (sử dụng type từ API)
function getMockData(): DashboardFinanceData {
  const today = new Date()
  const revenue30Days: RevenueByDay[] = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    revenue30Days.push({
      date: date.toISOString(),
      netRevenue: Math.floor(Math.random() * 5000000) + 1000000,
      commission: Math.floor(Math.random() * 500000) + 100000
    })
  }

  return {
    walletOverview: {
      availableBalance: 8500000,
      pendingBalance: 5000000,
      debtBalance: 1000000,
      netAsset: 12500000
    },
    performanceMetrics: {
      grossRevenue: 15200000,
      netIncome: 9000000,
      totalCommissionPaid: 6200000,
      profitMargin: 59.2
    },
    cashFlowForecast: {
      upcomingPayouts: [
        {
          payoutDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 5000000,
          orderCount: 15
        },
        {
          payoutDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 3000000,
          orderCount: 8
        }
      ],
      frozenAmount: 2000000
    },
    transactionHistory: {
      items: [
        {
          id: '1',
          createdAt: new Date().toISOString(),
          type: 'Nhận tiền đơn hàng Online',
          typeCode: 'OrderBankingCompleted',
          amount: 500000,
          balanceAfter: 8500000,
          orderId: 'ORD-12345',
          description: 'Thanh toán đơn hàng'
        },
        {
          id: '2',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          type: 'Rút tiền về ngân hàng',
          typeCode: 'Withdrawal',
          amount: -2000000,
          balanceAfter: 8000000,
          orderId: null,
          description: 'Rút tiền'
        }
      ],
      totalItems: 2,
      pageNumber: 1,
      pageSize: 5
    },
    charts: {
      revenue30Days,
      paymentMethodDistribution: {
        cod: {
          count: 50,
          totalAmount: 5700000
        },
        banking: {
          count: 30,
          totalAmount: 9500000
        }
      }
    }
  }
}

export default FinanceDashboard

