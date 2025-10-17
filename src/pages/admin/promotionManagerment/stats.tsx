// Admin Promotion Management - Statistics Page
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { BarChart3, TrendingUp, Users, Gift, Calendar, DollarSign, Activity, Target, Clock } from 'lucide-react'
import { usePromotionStats } from '../../../hooks/usePromotions'
import { toast } from 'react-toastify'

const AdminPromotionStats: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('30')
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const { getPromotionStats } = usePromotionStats()

  useEffect(() => {
    loadStats()
  }, [timeRange])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await getPromotionStats(parseInt(timeRange))
      setStats(data)
    } catch (error) {
      toast.error('Không thể tải thống kê')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num)
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Thống kê mã giảm giá</h1>
          <p className='text-gray-600 mt-1'>Phân tích hiệu quả và xu hướng sử dụng mã giảm giá</p>
        </div>

        <div className='flex items-center gap-4'>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='Chọn khoảng thời gian' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7'>7 ngày qua</SelectItem>
              <SelectItem value='30'>30 ngày qua</SelectItem>
              <SelectItem value='90'>90 ngày qua</SelectItem>
              <SelectItem value='365'>1 năm qua</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={loadStats} variant='outline'>
            <Activity className='h-4 w-4 mr-2' />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-blue-100 rounded-lg'>
                <Gift className='h-6 w-6 text-blue-600' />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Tổng mã giảm giá</p>
                <p className='text-2xl font-bold text-gray-900'>{stats?.totalPromotions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-green-100 rounded-lg'>
                <TrendingUp className='h-6 w-6 text-green-600' />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Lần sử dụng</p>
                <p className='text-2xl font-bold text-gray-900'>{formatNumber(stats?.totalUsage || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-purple-100 rounded-lg'>
                <DollarSign className='h-6 w-6 text-purple-600' />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Tổng giá trị giảm</p>
                <p className='text-2xl font-bold text-gray-900'>₫{formatPrice(stats?.totalDiscountValue || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-orange-100 rounded-lg'>
                <Users className='h-6 w-6 text-orange-600' />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Người dùng</p>
                <p className='text-2xl font-bold text-gray-900'>{formatNumber(stats?.uniqueUsers || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Usage Trends */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BarChart3 className='h-5 w-5' />
              Xu hướng sử dụng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-600'>Hôm nay</span>
                <span className='font-semibold'>{formatNumber(stats?.todayUsage || 0)}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-600'>Tuần này</span>
                <span className='font-semibold'>{formatNumber(stats?.weekUsage || 0)}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-600'>Tháng này</span>
                <span className='font-semibold'>{formatNumber(stats?.monthUsage || 0)}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-600'>Trung bình/ngày</span>
                <span className='font-semibold'>{formatNumber(stats?.avgDailyUsage || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Promotions */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Target className='h-5 w-5' />
              Mã giảm giá phổ biến
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {stats?.topPromotions?.map((promo: any, index: number) => (
                <div key={promo.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                      <span className='text-sm font-bold text-blue-600'>#{index + 1}</span>
                    </div>
                    <div>
                      <p className='font-medium text-gray-900'>{promo.title}</p>
                      <p className='text-sm text-gray-500'>{promo.type}</p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='font-semibold text-gray-900'>{formatNumber(promo.usageCount)}</p>
                    <p className='text-sm text-gray-500'>lần sử dụng</p>
                  </div>
                </div>
              )) || (
                <div className='text-center py-8 text-gray-500'>
                  <Gift className='h-8 w-8 mx-auto mb-2 text-gray-300' />
                  <p>Chưa có dữ liệu</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Promotion Types */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Activity className='h-5 w-5' />
              Phân loại mã giảm giá
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {stats?.promotionTypes?.map((type: any) => (
                <div key={type.type} className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        type.type === 'Global'
                          ? 'bg-blue-500'
                          : type.type === 'User'
                            ? 'bg-green-500'
                            : type.type === 'Product'
                              ? 'bg-purple-500'
                              : 'bg-gray-500'
                      }`}
                    ></div>
                    <span className='text-sm text-gray-600'>{type.type}</span>
                  </div>
                  <div className='text-right'>
                    <span className='font-semibold'>{type.count}</span>
                    <span className='text-sm text-gray-500 ml-1'>mã</span>
                  </div>
                </div>
              )) || (
                <div className='text-center py-4 text-gray-500'>
                  <p>Chưa có dữ liệu</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage by Time */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Clock className='h-5 w-5' />
              Sử dụng theo giờ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {stats?.hourlyUsage?.map((hour: any) => (
                <div key={hour.hour} className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>{hour.hour}:00</span>
                  <div className='flex items-center gap-2'>
                    <div className='w-20 bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-blue-500 h-2 rounded-full'
                        style={{ width: `${(hour.count / (stats?.maxHourlyUsage || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className='text-sm font-semibold w-8 text-right'>{hour.count}</span>
                  </div>
                </div>
              )) || (
                <div className='text-center py-4 text-gray-500'>
                  <p>Chưa có dữ liệu</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-5 w-5' />
              Tỷ lệ chuyển đổi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='text-center'>
                <p className='text-3xl font-bold text-green-600'>{stats?.conversionRate || 0}%</p>
                <p className='text-sm text-gray-500'>Tỷ lệ sử dụng mã giảm giá</p>
              </div>

              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Đơn hàng có mã giảm giá</span>
                  <span className='font-semibold'>{formatNumber(stats?.ordersWithPromotion || 0)}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Tổng đơn hàng</span>
                  <span className='font-semibold'>{formatNumber(stats?.totalOrders || 0)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            Hoạt động gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {stats?.recentActivity?.map((activity: any, index: number) => (
              <div key={index} className='flex items-center gap-4 p-3 bg-gray-50 rounded-lg'>
                <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                  <Gift className='h-5 w-5 text-blue-600' />
                </div>
                <div className='flex-1'>
                  <p className='font-medium text-gray-900'>{activity.description}</p>
                  <p className='text-sm text-gray-500'>{activity.time}</p>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-semibold text-gray-900'>{activity.value}</p>
                </div>
              </div>
            )) || (
              <div className='text-center py-8 text-gray-500'>
                <Activity className='h-8 w-8 mx-auto mb-2 text-gray-300' />
                <p>Chưa có hoạt động nào</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminPromotionStats
