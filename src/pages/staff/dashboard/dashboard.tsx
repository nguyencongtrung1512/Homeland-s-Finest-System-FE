import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Button } from '../../../components/ui/button'
import { Store, Package, AlertCircle, ShoppingBag, Layers, Grid3x3, TrendingUp, ArrowRight } from 'lucide-react'
import { BarChartIcon, PieChartIcon } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'
import {
  getStaffDashboard,
  getStoreRegistrationChart,
  getStoreRegionDistribution,
  getTopStores
} from '../../../apis/walletDashboard.api'
import { formApi } from '../../../apis/form.api'
import type { FormDTO } from '../../../types/form.type'
import { formatDate } from '../../../utils/formatDate'
import { path } from '../../../constants/path'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend)

function StaffDashboard() {
  const navigate = useNavigate()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [staffStats, setStaffStats] = useState({
    totalStores: 0,
    totalCombos: 0,
    totalProducts: 0,
    pendingReports: 0,
    totalCategories: 0,
    totalOrders: 0
  })
  const [storeRegistrationData, setStoreRegistrationData] = useState<number[]>([])
  const [regionDistributionData, setRegionDistributionData] = useState({
    labels: ['Miền Bắc', 'Miền Trung', 'Miền Nam'],
    data: [0, 0, 0]
  })
  const [topStores, setTopStores] = useState<
    Array<{
      storeId: string
      storeName: string
      revenue: number
      orderCount: number
      logoUrl: string | null
    }>
  >([])
  const [pendingReports, setPendingReports] = useState<FormDTO[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)

  // Fetch pending reports
  useEffect(() => {
    const fetchPendingReports = async () => {
      try {
        setReportsLoading(true)
        // Lấy tất cả forms với status Pending hoặc Processing
        const allPendingForms = await formApi.getAllForms({
          pageSize: 10,
          pageNumber: 1
        })

        // Filter các forms có status Pending hoặc Processing
        const pending = allPendingForms.filter((form) => form.status === 'Pending' || form.status === 'Processing')

        setPendingReports(pending)
        // Update stats
        setStaffStats((prev) => ({
          ...prev,
          pendingReports: pending.length
        }))
      } catch (error) {
        console.error('Error fetching pending reports:', error)
      } finally {
        setReportsLoading(false)
      }
    }
    fetchPendingReports()
  }, [])

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!selectedYear) return
      setLoading(true)
      try {
        // Fetch staff dashboard overview - không hỗ trợ filter theo năm
        const staffDashboardResponse = await getStaffDashboard()
        const staffData = staffDashboardResponse.data
        console.log('Staff Dashboard Response:', staffDashboardResponse)
        console.log('Staff Data:', staffData)

        // Fetch store registration chart - HỖ TRỢ filter theo năm
        const registrationChartResponse = await getStoreRegistrationChart(selectedYear)
        const registrationData = registrationChartResponse.data
        console.log('Registration Chart Response:', registrationChartResponse)
        console.log('Registration Data:', registrationData)

        // Fetch region distribution - HỖ TRỢ filter theo năm
        const regionDistributionResponse = await getStoreRegionDistribution(selectedYear)
        const regionData = regionDistributionResponse.data
        console.log('Region Distribution Response:', regionDistributionResponse)
        console.log('Region Data:', regionData)

        // Fetch top stores - HỖ TRỢ filter theo năm
        const topStoresResponse = await getTopStores(5, selectedYear)
        const topStoresData = topStoresResponse.data
        console.log('Top Stores Response:', topStoresResponse)
        console.log('Top Stores Data:', topStoresData)

        // Map staff stats từ API getStaffDashboard
        // Backend trả về: totalStore, totalOrder, totalPendingCombo, totalPendingProduct, totalPendingReport
        const regionDataAny = regionData as any
        const staffDataAny = staffData as any
        const registrationDataAny = registrationData as any

        // Lấy dữ liệu từ staffData (API getStaffDashboard)
        const mappedStats = {
          totalStores: staffDataAny?.totalStore || staffDataAny?.TotalStore || 0,
          totalCombos: staffDataAny?.totalPendingCombo || staffDataAny?.TotalPendingCombo || 0,
          totalProducts: staffDataAny?.totalPendingProduct || staffDataAny?.TotalPendingProduct || 0,
          pendingReports: staffDataAny?.totalPendingReport || staffDataAny?.TotalPendingReport || pendingReports.length || 0,
          totalCategories: 0, // Không có trong API response
          totalOrders: staffDataAny?.totalOrder || staffDataAny?.TotalOrder || 0
        }
        console.log('Staff Data from API:', staffDataAny)
        console.log('Mapped Staff Stats:', mappedStats)
        setStaffStats(mappedStats)

        // Map store registration chart data - đảm bảo có đủ 12 tháng
        const monthLabels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
        const storeCountByMonth = registrationDataAny?.storeCountByMonth || registrationDataAny?.StoreCountByMonth || {}
        const registrationChartData = monthLabels.map((month) => {
          return storeCountByMonth[month] || 0
        })
        console.log('Registration Chart Data mapped:', registrationChartData)
        // Đảm bảo có đủ 12 giá trị
        if (registrationChartData.length === 12) {
          setStoreRegistrationData(registrationChartData)
        } else {
          // Nếu không đủ, fill với 0
          const filledData = Array(12)
            .fill(0)
            .map((_, index) => {
              const month = monthLabels[index]
              return storeCountByMonth[month] || 0
            })
          console.log('Filled Registration Data:', filledData)
          setStoreRegistrationData(filledData)
        }

        // Map region distribution data
        const northData = regionDataAny?.north || regionDataAny?.North || {}
        const centralData = regionDataAny?.central || regionDataAny?.Central || {}
        const southData = regionDataAny?.south || regionDataAny?.South || {}
        const regionDataMapped = {
          labels: ['Miền Bắc', 'Miền Trung', 'Miền Nam'],
          data: [
            northData?.storeCount || northData?.StoreCount || 0,
            centralData?.storeCount || centralData?.StoreCount || 0,
            southData?.storeCount || southData?.StoreCount || 0
          ]
        }
        console.log('Region Distribution Data mapped:', regionDataMapped)
        setRegionDistributionData(regionDataMapped)

        // Map top stores - giống admin dashboard
        if (topStoresData && Array.isArray(topStoresData) && topStoresData.length > 0) {
          const mappedTopStores = topStoresData.map((store) => ({
            storeId: store.storeId,
            storeName: store.storeName,
            revenue: store.totalRevenues,
            orderCount: 0, // Không có trong API response
            logoUrl: null
          }))
          console.log('Top Stores mapped:', mappedTopStores)
          setTopStores(mappedTopStores)
        } else {
          console.log('Top Stores Data is empty or not array:', topStoresData)
          setTopStores([])
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Set default values on error (giữ lại pendingReports từ state)
        setStaffStats((prev) => ({
          ...prev,
          totalStores: 0,
          totalCombos: 0,
          totalProducts: 0,
          totalCategories: 0,
          totalOrders: 0
        }))
        setStoreRegistrationData([])
        setRegionDistributionData({
          labels: ['Miền Bắc', 'Miền Trung', 'Miền Nam'],
          data: [0, 0, 0]
        })
        setTopStores([])
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [selectedYear])

  // Transform data for charts - giống admin dashboard
  const revenueData = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    datasets: [
      {
        label: 'Cửa hàng đăng ký',
        data: storeRegistrationData.length === 12 ? storeRegistrationData : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderRadius: 4,
        borderSkipped: false
      }
    ]
  }

  const storeDistributionData = {
    labels: regionDistributionData.labels,
    datasets: [
      {
        label: 'Số lượng cửa hàng',
        data: regionDistributionData.data,
        backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(249, 115, 22, 0.8)'],
        borderColor: ['rgb(59, 130, 246)', 'rgb(34, 197, 94)', 'rgb(249, 115, 22)'],
        borderWidth: 2
      }
    ]
  }

  const StatCard = ({ icon: Icon, title, value, color, unit = '', index = 0 }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
    >
      <Card className='hover:shadow-lg transition-shadow'>
        <CardContent className='pt-6'>
          <div className='flex items-start justify-between'>
            <div className='space-y-2 flex-1'>
              <p className='text-sm font-medium text-muted-foreground'>{title}</p>
              <div className='flex items-baseline gap-1'>
                <motion.p
                  className={`text-2xl font-bold`}
                  style={{ color }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 200 }}
                >
                  {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
                </motion.p>
                {unit && <span className='text-xs text-muted-foreground'>{unit}</span>}
              </div>
            </div>
            <motion.div
              className='rounded-lg p-2'
              style={{ backgroundColor: `${color}20` }}
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Icon size={24} style={{ color }} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className='min-h-screen bg-background'>
      <div className='space-y-6 p-6 max-w-7xl mx-auto'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'
        >
          <div>
            <motion.h1
              className='text-3xl font-bold tracking-tight'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              Dashboard Nhân viên
            </motion.h1>
            <motion.p
              className='text-muted-foreground mt-1'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Tổng quan quản lý cửa hàng, người dùng và hệ thống (Biểu đồ đăng ký cửa hàng có thể filter theo năm)
            </motion.p>
          </div>
          <div className='flex items-center gap-3'>
            <span className='text-sm font-medium'>Chọn năm:</span>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number.parseInt(value))}>
              <SelectTrigger className='w-[120px]'>
                <SelectValue placeholder='Chọn năm' />
              </SelectTrigger>
              <SelectContent>
                {[
                  new Date().getFullYear() - 2,
                  new Date().getFullYear() - 1,
                  new Date().getFullYear(),
                  new Date().getFullYear() + 1
                ].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'>
          <StatCard icon={Store} title='Tổng số cửa hàng' value={staffStats.totalStores} color='#3b82f6' index={0} />
          <StatCard icon={Layers} title='Combo chưa xử lí' value={staffStats.totalCombos} color='#22c55e' index={1} />
          <StatCard icon={Package} title='Sản phẩm chưa xử lí' value={staffStats.totalProducts} color='#f97316' index={2} />
          <StatCard icon={AlertCircle} title='Báo cáo chờ xử lý' value={staffStats.pendingReports} color='#ef4444' index={3} />
          <StatCard icon={Grid3x3} title='Tổng danh mục' value={staffStats.totalCategories} color='#a855f7' index={4} />
          <StatCard icon={ShoppingBag} title='Tổng số đơn hàng' value={staffStats.totalOrders} color='#06b6d4' index={5} />
        </div>

        {/* Charts Section */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <CardTitle className='flex items-center gap-2'>
                    <BarChartIcon size={20} />
                    Biểu đồ cửa hàng đăng kí theo tháng
                  </CardTitle>
                  <CardDescription>
                    Số lượng cửa hàng đăng ký mỗi tháng trong năm {selectedYear}
                  </CardDescription>
                </motion.div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <motion.div
                    className='flex items-center justify-center h-[300px]'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p className='text-muted-foreground'>Đang tải dữ liệu...</p>
                  </motion.div>
                ) : (
                  <motion.div
                    className='h-[300px]'
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <Bar
                      data={revenueData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: {
                          duration: 1000,
                          easing: 'easeInOutQuart'
                        },
                        plugins: {
                          legend: {
                            display: false
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            grid: {
                              color: 'rgba(0, 0, 0, 0.05)'
                            }
                          },
                          x: {
                            grid: {
                              display: false
                            }
                          }
                        }
                      }}
                    />
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <CardTitle className='flex items-center gap-2'>
                    <PieChartIcon size={20} />
                    Phân bổ cửa hàng theo 3 miền
                  </CardTitle>
                  <CardDescription>Phân bổ địa lý của các cửa hàng</CardDescription>
                </motion.div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <motion.div
                    className='flex items-center justify-center h-[300px]'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p className='text-muted-foreground'>Đang tải dữ liệu...</p>
                  </motion.div>
                ) : (
                  <motion.div
                    className='h-[300px]'
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <Pie
                      data={storeDistributionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: {
                          duration: 1000,
                          easing: 'easeInOutQuart'
                        },
                        plugins: {
                          legend: {
                            position: 'bottom'
                          }
                        }
                      }}
                    />
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Lists Section */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Top Stores by Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <TrendingUp size={20} />
                  Cửa hàng có doanh thu cao
                </CardTitle>
                <CardDescription>Top 5 cửa hàng theo doanh thu</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className='flex items-center justify-center py-8'>
                    <p className='text-muted-foreground'>Đang tải dữ liệu...</p>
                  </div>
                ) : topStores && topStores.length > 0 ? (
                  <div className='space-y-3'>
                    {topStores.slice(0, 5).map((store, index) => (
                      <motion.div
                        key={store.storeId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
                        whileHover={{ scale: 1.02, x: 5 }}
                        className='flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border'
                      >
                        <div className='flex items-center gap-3 flex-1'>
                          <div className='w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-semibold text-sm'>
                            {index + 1}
                          </div>
                          <div className='min-w-0'>
                            <p className='font-medium text-sm truncate'>{store.storeName}</p>
                            <p className='text-xs text-muted-foreground'>{store.orderCount} đơn hàng</p>
                          </div>
                        </div>
                        <div className='text-right'>
                          <p className='font-semibold text-sm'>{store.revenue.toLocaleString('vi-VN')} VNĐ</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className='flex items-center justify-center py-8'>
                    <p className='text-muted-foreground'>Không có dữ liệu</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending Reports */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <AlertCircle size={20} />
                  Báo cáo chờ xử lí hôm nay
                </CardTitle>
                <CardDescription>Các báo cáo chờ phê duyệt ({staffStats.pendingReports})</CardDescription>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className='flex items-center justify-center py-8'>
                    <p className='text-muted-foreground'>Đang tải dữ liệu...</p>
                  </div>
                ) : pendingReports.length === 0 ? (
                  <div className='flex items-center justify-center py-8'>
                    <p className='text-muted-foreground'>Không có báo cáo chờ xử lý</p>
                  </div>
                ) : (
                  <>
                    <div className='space-y-3'>
                      {pendingReports.slice(0, 5).map((report, index) => {
                        const getTypeText = (type: string) => {
                          switch (type) {
                            case 'ComplaintOrder':
                              return 'Khiếu nại đơn hàng'
                            case 'ReportSeller':
                              return 'Khiếu nại cửa hàng'
                            case 'Orther':
                              return 'Hỗ trợ khác'
                            default:
                              return type
                          }
                        }

                        const getStatusColor = (status: string) => {
                          switch (status) {
                            case 'Pending':
                              return 'bg-orange-500'
                            case 'Processing':
                              return 'bg-blue-500'
                            default:
                              return 'bg-gray-500'
                          }
                        }

                        return (
                          <motion.div
                            key={report.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.9 + index * 0.1, duration: 0.3 }}
                            whileHover={{ scale: 1.02, x: -5 }}
                            className='flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border'
                          >
                            <div className='flex items-center gap-3 flex-1 min-w-0'>
                              <div
                                className={`w-8 h-8 ${getStatusColor(report.status)} rounded-lg flex items-center justify-center text-white flex-shrink-0`}
                              >
                                <AlertCircle size={16} />
                              </div>
                              <div className='min-w-0 flex-1'>
                                <p className='font-medium text-sm truncate'>{report.subject || 'Không có tiêu đề'}</p>
                                <div className='flex items-center gap-2 mt-1'>
                                  <p className='text-xs text-muted-foreground truncate'>{getTypeText(report.type)}</p>
                                  <span className='text-xs text-muted-foreground'>•</span>
                                  <p className='text-xs text-muted-foreground truncate'>{formatDate(report.createdAt)}</p>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant='outline'
                              size='sm'
                              className='flex-shrink-0 ml-2'
                              onClick={() => navigate(`/staff/${path.reportsStaff}/${report.id}`)}
                            >
                              Xem chi tiết
                            </Button>
                          </motion.div>
                        )
                      })}
                    </div>
                    {pendingReports.length > 5 && (
                      <motion.div
                        className='mt-4 pt-4 border-t'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                      >
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            variant='outline'
                            className='w-full'
                            onClick={() => navigate(`/staff/${path.reportsStaff}`)}
                          >
                            Xem tất cả ({pendingReports.length})
                            <ArrowRight className='ml-2 h-4 w-4' />
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default StaffDashboard
