import { Card, Row, Col, Statistic, Select } from 'antd'
import { Store, Clock, AlertTriangle, Lock } from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent,
  ChartLegend
} from '../../../components/ui/chart'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { useState, useEffect } from 'react'
import {
  getTransactionMonthlyStats,
  getTransactionDashboard,
  getAvailableYears
} from '../../../apis/dashboardTransaction.api.ts'
import type { MonthlyStatsData, TransactionDashboardData } from '../../../types/transactionDashboardType'

function StaffDashboard() {
  const [selectedYear, setSelectedYear] = useState(2025)
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStatsData | null>(null)
  const [dashboardData, setDashboardData] = useState<TransactionDashboardData | null>(null)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch available years on component mount
  useEffect(() => {
    const fetchAvailableYears = async () => {
      try {
        const years = await getAvailableYears()
        setAvailableYears(years)
        if (years.length > 0) {
          setSelectedYear(years[0]) // Set to most recent year
        }
      } catch (error) {
        console.error('Error fetching available years:', error)
      }
    }

    fetchAvailableYears()
  }, [])

  // Fetch dashboard data and monthly stats when year changes
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!selectedYear) return

      setLoading(true)
      try {
        const [monthlyData, dashboardData] = await Promise.all([
          getTransactionMonthlyStats(selectedYear),
          getTransactionDashboard({
            StartDate: `${selectedYear}-01-01`,
            EndDate: `${selectedYear}-12-31`,
            Year: selectedYear
          })
        ])

        setMonthlyStats(monthlyData)
        setDashboardData(dashboardData)
        console.log('data monthly stats', monthlyData)
        console.log('dashboard data', dashboardData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [selectedYear])

  // Transform API data for charts
  const revenueData = monthlyStats
    ? Object.entries(monthlyStats.storeRegistrationsByMonth).map(([month, count]) => ({
      period: `T${month}`,
      revenue: count
    }))
    : []

  const ordersTransactionsData = monthlyStats
    ? Object.entries(monthlyStats.successfulTransactionsByMonth).map(([month, successful]) => ({
      period: `T${month}`,
      orders: successful,
      transactions: monthlyStats.cancelledTransactionsByMonth[month] || 0
    }))
    : []

  const chartConfig = {
    revenue: {
      label: 'Cửa hàng đăng ký',
      color: '#fa8c16'
    },
    orders: {
      label: 'Giao dịch thành công',
      color: '#52c41a'
    },
    transactions: {
      label: 'Giao dịch hủy',
      color: '#ff4d4f'
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Dashboard Nhân viên</h1>
          <p className='text-gray-600'>Tổng quan dữ liệu giao dịch và cửa hàng</p>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium text-gray-700'>Chọn năm:</span>
          <Select
            value={selectedYear}
            onChange={(value) => setSelectedYear(value)}
            style={{ width: 100 }}
            loading={loading}
            size='large'
          >
            {availableYears.map((year) => (
              <Select.Option key={year} value={year}>
                {year}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title='Tổng doanh thu'
              value={dashboardData?.summary?.totalRevenue || 0}
              formatter={(value) => `${value?.toLocaleString('vi-VN')} VNĐ`}
              prefix={<Store size={20} color='#1890ff' />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title='Giao dịch thành công'
              value={dashboardData?.summary?.successfulTransactions || 0}
              prefix={<Clock size={20} color='#52c41a' />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title='Giao dịch đang chờ'
              value={dashboardData?.summary?.pendingTransactions || 0}
              prefix={<Clock size={20} color='#fa8c16' />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title='Giao dịch thất bại'
              value={dashboardData?.summary?.failedTransactions || 0}
              prefix={<AlertTriangle size={20} color='#ff4d4f' />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title='Tổng giao dịch'
              value={dashboardData?.summary?.totalTransactions || 0}
              prefix={<Lock size={20} color='#8c8c8c' />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title='Biểu đồ hiện thị các cửa hàng đăng kí'>
            <ChartContainer config={chartConfig} className='h-[300px]'>
              {loading ? (
                <div className='flex items-center justify-center h-full'>
                  <div className='text-gray-500'>Đang tải dữ liệu...</div>
                </div>
              ) : (
                <BarChart data={revenueData}>
                  <XAxis dataKey='period' tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => [`${value}`, 'Cửa hàng đăng ký']} />}
                  />
                  <Bar dataKey='revenue' fill='var(--color-revenue)' radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ChartContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title='Giao dịch thành công và giao dịch hủy'>
            <ChartContainer config={chartConfig} className='h-[300px]'>
              {loading ? (
                <div className='flex items-center justify-center h-full'>
                  <div className='text-gray-500'>Đang tải dữ liệu...</div>
                </div>
              ) : (
                <BarChart data={ordersTransactionsData}>
                  <XAxis dataKey='period' tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => [
                          value,
                          name === 'orders' ? 'Giao dịch thành công' : 'Giao dịch hủy'
                        ]}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey='orders' fill='var(--color-orders)' radius={[2, 2, 0, 0]} />
                  <Bar dataKey='transactions' fill='var(--color-transactions)' radius={[2, 2, 0, 0]} />
                </BarChart>
              )}
            </ChartContainer>
          </Card>
        </Col>
      </Row>

      {/* Lists Section */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title='Cửa hàng có doanh thu cao'>
            <div className='space-y-4'>
              {loading ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='text-gray-500'>Đang tải dữ liệu...</div>
                </div>
              ) : dashboardData?.summary?.topStoresByRevenue && dashboardData.summary.topStoresByRevenue.length > 0 ? (
                dashboardData.summary.topStoresByRevenue.slice(0, 5).map((store) => (
                  <div
                    key={store.storeId}
                    className='flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-8 h-8 bg-blue-500 rounded flex items-center justify-center'>
                        <Store size={16} color='white' />
                      </div>
                      <div>
                        <div className='font-medium text-gray-900'>{store.storeName}</div>
                        <div className='text-sm text-gray-500'>
                          Doanh thu: {store.revenue.toLocaleString('vi-VN')} VNĐ
                        </div>
                        <div className='text-sm text-gray-500'>{store.orderCount} đơn hàng</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className='flex items-center justify-center py-8'>
                  <div className='text-gray-500'>Không có dữ liệu</div>
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title='Báo cáo chờ xử lí'>
            <div className='space-y-4'>
              <div className='flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200'>
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 bg-orange-500 rounded flex items-center justify-center'>
                    <div className='w-4 h-4 bg-white rounded'></div>
                  </div>
                  <div className='flex-1'>
                    <div className='font-medium text-gray-900'>iPhone 15 Pro Max</div>
                    <div className='text-sm text-gray-500'>Tech Store VN</div>
                  </div>
                </div>
                <button className='px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors'>
                  Xem chi tiết
                </button>
              </div>

              <div className='flex items-center justify-between p-3 bg-pink-50 rounded-lg border border-pink-200'>
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 bg-pink-500 rounded flex items-center justify-center'>
                    <div className='w-4 h-4 bg-white rounded'></div>
                  </div>
                  <div className='flex-1'>
                    <div className='font-medium text-gray-900'>Áo thun nam cao cấp</div>
                    <div className='text-sm text-gray-500'>Fashion Hub</div>
                  </div>
                </div>
                <button className='px-3 py-1 bg-pink-500 text-white text-sm rounded hover:bg-pink-600 transition-colors'>
                  Xem chi tiết
                </button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default StaffDashboard
