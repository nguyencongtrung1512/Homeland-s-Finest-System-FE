import { ShoppingCart, DollarSign, Clock, Store, Smartphone, Shirt, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../../components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// Mock data for charts
const revenueData = [
  { month: 'T2', revenue: 170 },
  { month: 'T3', revenue: 180 },
  { month: 'T4', revenue: 205 },
  { month: 'T5', revenue: 195 },
  { month: 'T6', revenue: 220 },
  { month: 'T7', revenue: 205 }
]

const productCategoryData = [
  { name: 'Ẩm thực', value: 35, color: '#FF6B6B' },
  { name: 'Thủ công Mỹ nghệ', value: 25, color: '#4ECDC4' },
  { name: 'Chăm sóc Sức khỏe', value: 20, color: '#45B7D1' },
  { name: 'Quà lưu niệm đặc trưng', value: 20, color: '#96CEB4' }
]

const chartConfig = {
  revenue: {
    label: 'Doanh thu (triệu VNĐ)',
    color: '#F97316'
  }
}

function AdminDashboard() {
  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-gray-900'>Dashboard Admin</h1>
        <div className='flex items-center gap-2'>
          <span className='text-sm text-gray-600'>Năm:</span>
          <Button variant='outline' size='sm' className='flex items-center gap-2'>
            2025
            <ChevronDown className='w-4 h-4' />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <Card className='bg-white shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Tổng đơn hàng</p>
                <p className='text-3xl font-bold text-gray-900'>1,234</p>
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
                <p className='text-3xl font-bold text-gray-900'>45.2M</p>
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
                <p className='text-3xl font-bold text-gray-900'>89</p>
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
            <CardTitle className='text-lg font-semibold text-gray-900'>Doanh thu</CardTitle>
            <Button variant='outline' size='sm' className='flex items-center gap-2'>
              2025
              <ChevronDown className='w-4 h-4' />
            </Button>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className='h-[300px]'>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='month' />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey='revenue' fill='#F97316' radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Product Categories Pie Chart */}
        <Card className='bg-white shadow-sm'>
          <CardHeader>
            <CardTitle className='text-lg font-semibold text-gray-900'>Phân bố sản phẩm theo danh mục</CardTitle>
          </CardHeader>
          <CardContent>
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
                            <p className='text-sm text-gray-600'>{data.value}%</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className='mt-4 grid grid-cols-2 gap-2'>
              {productCategoryData.map((item, index) => (
                <div key={index} className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded-full' style={{ backgroundColor: item.color }} />
                  <span className='text-sm text-gray-600'>{item.name}</span>
                </div>
              ))}
            </div>
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
            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              <div className='w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center'>
                <Store className='w-5 h-5 text-white' />
              </div>
              <div className='flex-1'>
                <p className='font-medium text-gray-900'>Tech Store VN</p>
                <p className='text-sm text-gray-600'>2 giờ trước</p>
              </div>
            </div>
            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              <div className='w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center'>
                <Shirt className='w-5 h-5 text-white' />
              </div>
              <div className='flex-1'>
                <p className='font-medium text-gray-900'>Fashion Hub</p>
                <p className='text-sm text-gray-600'>5 giờ trước</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unprocessed Reports */}
        <Card className='bg-white shadow-sm'>
          <CardHeader>
            <CardTitle className='text-lg font-semibold text-gray-900'>Báo cáo chưa xử lý</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center'>
                  <Smartphone className='w-5 h-5 text-white' />
                </div>
                <div>
                  <p className='font-medium text-gray-900'>iPhone 15 Pro Max</p>
                  <p className='text-sm text-gray-600'>Tech Store VN</p>
                </div>
              </div>
              <Button size='sm' className='bg-blue-600 hover:bg-blue-700 text-white'>
                Xem chi tiết
              </Button>
            </div>
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center'>
                  <Shirt className='w-5 h-5 text-white' />
                </div>
                <div>
                  <p className='font-medium text-gray-900'>Áo thun nam cao cấp</p>
                  <p className='text-sm text-gray-600'>Fashion Hub</p>
                </div>
              </div>
              <Button size='sm' className='bg-blue-600 hover:bg-blue-700 text-white'>
                Xem chi tiết
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboard
