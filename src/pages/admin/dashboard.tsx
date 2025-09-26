import { useState, useEffect } from 'react'
import { ShoppingCart, DollarSign, Clock, Store, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { ChartContainer, ChartTooltip } from '../../components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { getTransactionSummary, getAvailableYears } from '../../apis/dashboardTransaction.api'
import type { TransactionDashboardData } from '../../types/transactionDashboardType'

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('vi-VN').format(num)
}

// Month mapping
const monthNames = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
const monthLabels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']

const chartConfig = {
  revenue: {
    label: 'Doanh thu (VNĐ)',
    color: '#F97316'
  }
}

function AdminDashboard() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [dashboardData, setDashboardData] = useState<TransactionDashboardData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch available years
  const fetchAvailableYears = async () => {
    try {
      const years = await getAvailableYears()
      setAvailableYears(years)

      // Nếu năm hiện tại không có trong danh sách, chọn năm mới nhất
      if (years.length > 0 && !years.includes(selectedYear)) {
        setSelectedYear(years[0])
      }
    } catch (err) {
      console.error('Error fetching available years:', err)
      // Fallback về năm hiện tại nếu không lấy được danh sách năm
      setAvailableYears([new Date().getFullYear()])
    }
  }

  // Fetch dashboard data
  const fetchDashboardData = async (year: number) => {
    try {
      setLoading(true)
      setError(null)
      const data = await getTransactionSummary({
        StartDate: '',
        EndDate: '',
        Year: year
      })
      console.log('data trung', data)
      setDashboardData(data)
    } catch (err) {
      setError('Không thể tải dữ liệu dashboard')
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAvailableYears()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedYear) {
      fetchDashboardData(selectedYear)
    }
  }, [selectedYear])

  // Transform data for charts
  const revenueData = dashboardData
    ? monthNames.map((month, index) => ({
      month: monthLabels[index],
      revenue: dashboardData.summary.revenueByMonth[month] || 0
    }))
    : []

  const productCategoryData = dashboardData
    ? Object.entries(dashboardData.summary.revenueByCategoryPercentage).map(([name, value], index) => ({
      name,
      value,
      color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'][index % 6]
    }))
    : []

  const handleYearChange = (year: number) => {
    setSelectedYear(year)
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='flex items-center gap-2'>
          <Loader2 className='w-6 h-6 animate-spin' />
          <span>Đang tải dữ liệu...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-red-600 mb-4'>{error}</p>
          <Button onClick={() => fetchDashboardData(selectedYear)}>Thử lại</Button>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-gray-900'>Dashboard Admin</h1>
        <div className='flex items-center gap-2'>
          <span className='text-sm text-gray-600'>Năm:</span>
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            className='px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <Card className='bg-white shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Tổng đơn hàng</p>
                <p className='text-3xl font-bold text-gray-900'>
                  {dashboardData ? formatNumber(dashboardData.summary.totalTransactions) : '0'}
                </p>
              </div>
              <div className='p-3 bg-blue-100 rounded-full'>
                <ShoppingCart className='w-6 h-6 text-blue-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Doanh thu</p>
                <p className='text-3xl font-bold text-gray-900'>
                  {dashboardData ? formatCurrency(dashboardData.summary.totalRevenue) : '0 VNĐ'}
                </p>
              </div>
              <div className='p-3 bg-green-100 rounded-full'>
                <DollarSign className='w-6 h-6 text-green-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Đơn đang xử lý</p>
                <p className='text-3xl font-bold text-gray-900'>
                  {dashboardData ? formatNumber(dashboardData.summary.pendingTransactions) : '0'}
                </p>
              </div>
              <div className='p-3 bg-orange-100 rounded-full'>
                <Clock className='w-6 h-6 text-orange-600' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Revenue Chart */}
        <Card className='bg-white shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='text-lg font-semibold text-gray-900'>Doanh thu theo tháng</CardTitle>
            <div className='text-sm text-gray-600'>Năm {selectedYear}</div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className='h-[300px]'>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='month' />
                <YAxis />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className='bg-white p-3 border rounded-lg shadow-lg'>
                          <p className='font-medium'>{data.month}</p>
                          <p className='text-sm text-gray-600'>{formatCurrency(data.revenue)}</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey='revenue' fill='#F97316' radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Product Categories Pie Chart */}
        <Card className='bg-white shadow-sm'>
          <CardHeader>
            <CardTitle className='text-lg font-semibold text-gray-900'>Phân bố doanh thu theo danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            {productCategoryData.length > 0 ? (
              <>
                <div className='h-[300px] flex items-center justify-center'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Pie
                        data={productCategoryData}
                        cx='50%'
                        cy='50%'
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey='value'
                      >
                        {productCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className='bg-white p-3 border rounded-lg shadow-lg'>
                                <p className='font-medium'>{data.name}</p>
                                <p className='text-sm text-gray-600'>{data.value.toFixed(1)}%</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className='mt-4 grid grid-cols-1 gap-2'>
                  {productCategoryData.map((item, index) => (
                    <div key={index} className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <div className='w-3 h-3 rounded-full' style={{ backgroundColor: item.color }} />
                        <span className='text-sm text-gray-600'>{item.name}</span>
                      </div>
                      <span className='text-sm font-medium'>{item.value.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className='h-[300px] flex items-center justify-center text-gray-500'>
                <p>Không có dữ liệu danh mục</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lists Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* High Revenue Stores */}
        <Card className='bg-white shadow-sm'>
          <CardHeader>
            <CardTitle className='text-lg font-semibold text-gray-900'>Cửa hàng có doanh thu cao</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {dashboardData && dashboardData.summary.topStoresByRevenue.length > 0 ? (
              dashboardData.summary.topStoresByRevenue.map((store, index) => (
                <div key={store.storeId} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                  <div className='flex items-center gap-3'>
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${index === 0
                        ? 'bg-yellow-500'
                        : index === 1
                          ? 'bg-gray-400'
                          : index === 2
                            ? 'bg-orange-500'
                            : 'bg-blue-500'
                        }`}
                    >
                      <Store className='w-5 h-5 text-white' />
                    </div>
                    <div className='flex-1'>
                      <p className='font-medium text-gray-900'>{store.storeName}</p>
                      <p className='text-sm text-gray-600'>
                        {formatCurrency(store.revenue)} • {store.orderCount} đơn hàng
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-medium text-gray-900'>#{index + 1}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className='text-center py-8 text-gray-500'>
                <Store className='w-12 h-12 mx-auto mb-2 text-gray-300' />
                <p>Không có dữ liệu cửa hàng</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Transactions */}
        <Card className='bg-white shadow-sm'>
          <CardHeader>
            <CardTitle className='text-lg font-semibold text-gray-900'>Giao dịch đang chờ xử lý</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {dashboardData && dashboardData.transactions.filter((t) => t.status === 'Pending').length > 0 ? (
              dashboardData.transactions
                .filter((t) => t.status === 'Pending')
                .slice(0, 5)
                .map((transaction) => (
                  <div key={transaction.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center'>
                        <Clock className='w-5 h-5 text-white' />
                      </div>
                      <div>
                        <p className='font-medium text-gray-900'>{transaction.userFullName}</p>
                        <p className='text-sm text-gray-600'>
                          {formatCurrency(transaction.amount)} • {transaction.paymentMethod}
                        </p>
                        <p className='text-xs text-gray-500'>{transaction.createdAt}</p>
                      </div>
                    </div>
                    <Button size='sm' className='bg-blue-600 hover:bg-blue-700 text-white'>
                      Xem chi tiết
                    </Button>
                  </div>
                ))
            ) : (
              <div className='text-center py-8 text-gray-500'>
                <Clock className='w-12 h-12 mx-auto mb-2 text-gray-300' />
                <p>Không có giao dịch đang chờ xử lý</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboard
