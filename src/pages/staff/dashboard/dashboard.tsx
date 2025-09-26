import { Card, Row, Col, Statistic, Select } from 'antd'
import { Store, Clock, AlertTriangle, Lock, TrendingUp } from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent,
  ChartLegend
} from '../../../components/ui/chart'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'

function StaffDashboard() {
  // Chart data
  const revenueData = [
    { period: 'T2', revenue: 19000000 },
    { period: 'T3', revenue: 21000000 },
    { period: 'T4', revenue: 17000000 },
    { period: 'T5', revenue: 230000000 },
    { period: 'T6', revenue: 22000000 },
    { period: 'T7', revenue: 22000000 },
    { period: 'T8', revenue: 22000000 },
    { period: 'T9', revenue: 662000000 },
    { period: 'T10', revenue: 22550000 },
    { period: 'T11', revenue: 22000000 },
    { period: 'T12', revenue: 220000000 }
  ]

  const ordersTransactionsData = [
    { period: 'T2', orders: 0, transactions: 0 },
    { period: 'T3', orders: 72, transactions: 50 },
    { period: 'T4', orders: 40, transactions: 60 },
    { period: 'T5', orders: 92, transactions: 72 },
    { period: 'T6', orders: 65, transactions: 45 },
    { period: 'T7', orders: 0, transactions: 0 },
    { period: 'CN', orders: 0, transactions: 0 }
  ]

  const chartConfig = {
    revenue: {
      label: 'Doanh thu',
      color: '#fa8c16'
    },
    orders: {
      label: 'Đơn hàng',
      color: '#52c41a'
    },
    transactions: {
      label: 'Giao dịch',
      color: '#fa8c16'
    }
  }

  return (
    <div className='space-y-6'>
      {/* Key Metrics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title='Cửa hàng'
              value={24}
              prefix={<Store size={20} color='#1890ff' />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title='Sản phẩm chờ'
              value={156}
              prefix={<Clock size={20} color='#fa8c16' />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        {/* <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title='Giao dịch hôm nay'
              value={1247}
              prefix={<BarChart3 size={20} color='#52c41a' />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col> */}
        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title='Báo cáo'
              value={12}
              prefix={<AlertTriangle size={20} color='#ff4d4f' />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <Card>
            <Statistic
              title='Cửa hàng bị khóa'
              value={5}
              prefix={<Lock size={20} color='#8c8c8c' />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title='Biểu đồ hiện thị các cửa hàng đăng kí'//Các đơn tố cáo
            extra={
              <Select defaultValue='2025' style={{ width: 80 }}>
                <Select.Option value='2025'>2025</Select.Option>
                <Select.Option value='2024'>2024</Select.Option>
                <Select.Option value='2023'>2023</Select.Option>
              </Select>
            }
          >
            <ChartContainer config={chartConfig} className='h-[300px]'>
              <BarChart data={revenueData}>
                <XAxis dataKey='period' tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}m`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent formatter={(value) => [`${value.toLocaleString('vi-VN')}₫`, 'Doanh thu']} />
                  }
                />
                <Bar dataKey='revenue' fill='var(--color-revenue)' radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title='Đơn hàng thành công và đơn hàng hủy'>
            <ChartContainer config={chartConfig} className='h-[300px]'>
              <BarChart data={ordersTransactionsData}>
                <XAxis dataKey='period' tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [value, name === 'orders' ? 'Đơn hàng' : 'Giao dịch']}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey='orders' fill='var(--color-orders)' radius={[2, 2, 0, 0]} />
                <Bar dataKey='transactions' fill='var(--color-transactions)' radius={[2, 2, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </Card>
        </Col>
      </Row>

      {/* Lists Section */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title='Cửa hàng có doanh thu cao'>
            <div className='space-y-4'>
              <div className='flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200'>
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 bg-blue-500 rounded flex items-center justify-center'>
                    <Store size={16} color='white' />
                  </div>
                  <div>
                    <div className='font-medium text-gray-900'>Tech Store VN</div>
                    <div className='text-sm text-gray-500'>2 giờ trước</div>
                  </div>
                </div>
              </div>

              <div className='flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200'>
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 bg-purple-500 rounded flex items-center justify-center'>
                    <Store size={16} color='white' />
                  </div>
                  <div>
                    <div className='font-medium text-gray-900'>Fashion Hub</div>
                    <div className='text-sm text-gray-500'>5 giờ trước</div>
                  </div>
                </div>
              </div>
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
