import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart,
  Clock,
  Store,
  Loader2,
  Tag,
  AlertCircle,
  TrendingUp
} from 'lucide-react'
import VietnamMap from '../../components/Province/VietnamMap'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { ChartContainer, ChartTooltip } from '../../components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { TransactionDashboardData } from '../../types/transactionDashboardType'
import type { StoreResponse } from '../../apis/store.api'
import {
  getAdminDashboard,
  getMonthlyRevenue,
  getTopStores,
  getProcessingStores
} from '../../apis/walletDashboard.api'
import { getProvinces, type Province } from '../../apis/province'
import type { ProvinceProperties } from '../../components/Province/VietnamMap'

// Promotion Stats Interface
interface PromotionStats {
  totalPromotions: number
  activePromotions: number
  expiredPromotions: number
  expiringSoonPromotions: number
  totalDiscountGiven: number
  totalOrdersWithPromotion: number
  totalUsage: number
}

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
    label: 'Doanh thu (đ)',
    color: '#3B82F6'
  }
}

function AdminDashboard() {
  const navigate = useNavigate()
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [dashboardData, setDashboardData] = useState<TransactionDashboardData | null>(null)
  const [promotionStats, setPromotionStats] = useState<PromotionStats | null>(null)
  const [storesNeedingAction, setStoresNeedingAction] = useState<StoreResponse[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [mapZoom, setMapZoom] = useState<number>(1)
  const [revenueLoading, setRevenueLoading] = useState<boolean>(false)
  const [storesLoading, setStoresLoading] = useState<boolean>(false)
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | undefined>(undefined)
  const [provinces, setProvinces] = useState<Province[]>([])

  // Fetch provinces list to map name to ID
  const fetchProvinces = async () => {
    try {
      const provincesList = await getProvinces()
      setProvinces(provincesList)
    } catch (err) {
      console.error('Error fetching provinces:', err)
    }
  }

  // Handle province selection from map
  const handleProvinceSelect = (province: ProvinceProperties | null) => {
    if (!province) {
      setSelectedProvinceId(undefined)
      return
    }

    // Find province ID by name (normalize name for comparison)
    const normalizedName = province.Name.trim()
    const foundProvince = provinces.find(
      (p) => p.name.trim().toLowerCase() === normalizedName.toLowerCase()
    )

    if (foundProvince) {
      setSelectedProvinceId(foundProvince.id)
    } else {
      console.warn(`Province not found: ${normalizedName}`)
      setSelectedProvinceId(undefined)
    }
  }

  // Fetch available years
  const fetchAvailableYears = async () => {
    try {
      // Generate available years (có thể mở rộng để lấy từ API nếu cần)
      const currentYear = new Date().getFullYear()
      const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]
      setAvailableYears(years)

      // Nếu năm hiện tại không có trong danh sách, chọn năm mới nhất
      if (years.length > 0 && !years.includes(selectedYear)) {
        setSelectedYear(years[years.length - 1])
      }
    } catch (err) {
      console.error('Error fetching available years:', err)
      // Fallback về năm hiện tại nếu không lấy được danh sách năm
      setAvailableYears([new Date().getFullYear()])
    }
  }

  // Fetch stores needing action (processing stores)
  const fetchStoresNeedingAction = async (targetProvinceId?: number) => {
    try {
      const response = await getProcessingStores(targetProvinceId)
      if (response.status === 200 && response.data) {
        // Map response data to StoreResponse format
        // API response có: id, sellerId, sellerName, sellerEmail, storeName, address, logoUrl, status, etc.
        const stores = response.data.map((store: any) => ({
          id: store.id || '',
          sellerId: store.sellerId || '',
          storeName: store.storeName || '',
          address: store.address || '',
          logoUrl: store.logoUrl || null,
          status: store.status || 'Pending',
          sellerEmail: store.sellerEmail || '',
          sellerName: store.sellerName || '',
          province: store.province || '',
          district: store.district || '',
          sellerInfo: {
            reportCount: 0,
            userInfo: {
              email: store.sellerEmail || 'Không có'
            }
          }
        })) as StoreResponse[]
        setStoresNeedingAction(stores.slice(0, 5)) // Show top 5 stores
      }
    } catch (err) {
      console.error('Error fetching stores needing action:', err)
      // Fallback to empty array on error
      setStoresNeedingAction([])
    }
  }

  // Fetch revenue data only (for chart)
  const fetchRevenueData = async (year: number, provinceId?: number) => {
    try {
      setRevenueLoading(true)
      const revenueResponse = await getMonthlyRevenue(year, provinceId)
      const revenueData = revenueResponse.data

      // Update only revenue data in dashboardData
      if (dashboardData) {
        const monthMap: Record<string, string> = {
          T1: '01',
          T2: '02',
          T3: '03',
          T4: '04',
          T5: '05',
          T6: '06',
          T7: '07',
          T8: '08',
          T9: '09',
          T10: '10',
          T11: '11',
          T12: '12'
        }
        const revenueByMonth: Record<string, number> = {}
        Object.keys(revenueData.revenueByMonth || {}).forEach((key) => {
          const monthKey = monthMap[key] || key
          revenueByMonth[monthKey] = revenueData.revenueByMonth[key] || 0
        })

        setDashboardData({
          ...dashboardData,
          summary: {
            ...dashboardData.summary,
            revenueByMonth
          }
        })
      }
    } catch (err) {
      console.error('Error fetching revenue data:', err)
    } finally {
      setRevenueLoading(false)
    }
  }

  // Fetch top stores data only
  const fetchTopStoresData = async (year: number, targetProvinceId?: number) => {
    try {
      setStoresLoading(true)
      const topStoresResponse = await getTopStores(5, year, targetProvinceId)
      const topStoresData = topStoresResponse.data

      // Update only top stores data in dashboardData
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          summary: {
            ...dashboardData.summary,
            topStoresByRevenue: topStoresData.map((store) => ({
              storeId: store.storeId,
              storeName: store.storeName,
              revenue: store.totalRevenues,
              orderCount: store.orderCount || 0,
              logoUrl: null
            }))
          }
        })
      }
    } catch (err) {
      console.error('Error fetching top stores data:', err)
    } finally {
      setStoresLoading(false)
    }
  }

  // Fetch dashboard data
  const fetchDashboardData = async (year: number) => {
    try {
      setLoading(true)
      setError(null)

      // Fetch admin dashboard overview
      const adminDashboardResponse = await getAdminDashboard(selectedProvinceId)
      const adminData = adminDashboardResponse.data

      // Fetch monthly revenue - HỖ TRỢ filter theo năm và provinceId
      const revenueResponse = await getMonthlyRevenue(year, selectedProvinceId)
      const revenueData = revenueResponse.data

      // Fetch top stores - HỖ TRỢ filter theo năm và provinceId
      const topStoresResponse = await getTopStores(5, year, selectedProvinceId)
      const topStoresData = topStoresResponse.data

      // Set promotion stats from admin dashboard data
      // Dữ liệu promotion đã có trong adminData từ API /api/wallet-dashboard/Admin
      setPromotionStats({
        totalPromotions: adminData.totalPromotionActive || 0, // Sử dụng active promotions làm tổng (có thể mở rộng để lấy tổng từ API khác)
        activePromotions: adminData.totalPromotionActive || 0,
        expiredPromotions: 0, // Không có trong API response hiện tại
        expiringSoonPromotions: 0, // Không có trong API response hiện tại
        totalDiscountGiven: adminData.totalSystemDiscount || 0,
        totalOrdersWithPromotion: adminData.totalUserPromotionOrder || 0,
        totalUsage: adminData.totalUsedPromotion || 0
      })

      // Fetch stores needing action
      await fetchStoresNeedingAction(selectedProvinceId)

      // Map API response to TransactionDashboardData format
      const mappedDashboardData: TransactionDashboardData = {
        summary: {
          totalRevenue: adminData.totalGrossRevenue,
          totalTransactions: adminData.totalOrder,
          successfulTransactions: adminData.totalOrder - adminData.totalProcessingOrder,
          pendingTransactions: adminData.totalProcessingOrder,
          failedTransactions: 0, // Không có trong API response
          revenueByPaymentMethod: {
            Banking: 0, // Không có trong API response
            COD: 0
          },
          revenueByMonth: (() => {
            // Convert from "T1", "T2" format to "01", "02" format
            const monthMap: Record<string, string> = {
              T1: '01',
              T2: '02',
              T3: '03',
              T4: '04',
              T5: '05',
              T6: '06',
              T7: '07',
              T8: '08',
              T9: '09',
              T10: '10',
              T11: '11',
              T12: '12'
            }
            const revenueByMonth: Record<string, number> = {}
            Object.keys(revenueData.revenueByMonth || {}).forEach((key) => {
              const monthKey = monthMap[key] || key
              revenueByMonth[monthKey] = revenueData.revenueByMonth[key] || 0
            })
            return revenueByMonth
          })(),
          transactionsByMonth: {}, // Không có trong API response
          revenueByYear: {
            [year.toString()]: adminData.totalGrossRevenue
          },
          transactionsByYear: {
            [year.toString()]: adminData.totalOrder
          },
          revenueByCategoryPercentage: {}, // Không có trong API response
          revenueByCategory: {}, // Không có trong API response
          topStoresByRevenue: topStoresData.map((store) => ({
            storeId: store.storeId,
            storeName: store.storeName,
            revenue: store.totalRevenues,
            orderCount: store.orderCount || 0,
            logoUrl: null // StoreAdminRevenueResponse không có logoUrl, sẽ dùng ảnh default
          }))
        },
        transactions: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: 1
      }

      setDashboardData(mappedDashboardData)
    } catch (err) {
      setError('Không thể tải dữ liệu dashboard')
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAvailableYears()
    fetchProvinces()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedYear) {
      fetchDashboardData(selectedYear)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedProvinceId])

  // Fetch stores needing action when province changes
  useEffect(() => {
    fetchStoresNeedingAction(selectedProvinceId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvinceId])

  // Transform data for charts
  const revenueData = dashboardData?.summary?.revenueByMonth
    ? monthNames.map((month, index) => ({
      month: monthLabels[index],
      revenue: dashboardData.summary.revenueByMonth[month] || 0
    }))
    : []

  const handleYearChange = (year: number, component?: 'revenue' | 'stores') => {
    setSelectedYear(year)
    // Only fetch data for the specific component
    if (component === 'revenue') {
      fetchRevenueData(year, selectedProvinceId)
    } else if (component === 'stores') {
      fetchTopStoresData(year, selectedProvinceId)
    }
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

  // Nếu không có dữ liệu, hiển thị thông báo
  if (!dashboardData) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-gray-600 mb-4'>Không có dữ liệu để hiển thị</p>
          <Button onClick={() => fetchDashboardData(selectedYear)}>Tải lại</Button>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-gray-900'>Dashboard Admin</h1>
      </div>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <Card className='bg-white shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Tổng đơn hàng</p>
                <p className='text-3xl font-bold text-gray-900'>
                  {dashboardData?.summary?.totalTransactions
                    ? formatNumber(dashboardData.summary.totalTransactions)
                    : '0'}
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
                  {dashboardData?.summary?.totalRevenue ? formatCurrency(dashboardData.summary.totalRevenue) : '0 đ'}
                </p>
              </div>
              <div className='p-3 bg-green-100 rounded-full'>
                <span className='text-green-600 font-bold text-xl'>đ</span>
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
                  {dashboardData?.summary?.pendingTransactions
                    ? formatNumber(dashboardData.summary.pendingTransactions)
                    : '0'}
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
      <div className='space-y-6'>
        {/* Revenue Chart - Full Width */}
        <Card className='bg-white shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='text-lg font-semibold text-gray-900'>Doanh thu theo tháng</CardTitle>
            <div className='flex items-center gap-2'>
              <span className='text-sm text-gray-600'>Năm:</span>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value), 'revenue')}
                className='px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                disabled={revenueLoading}
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {revenueLoading && (
                <Loader2 className='w-4 h-4 animate-spin text-gray-400' />
              )}
            </div>
          </CardHeader>
          <CardContent className='w-full'>
            {revenueLoading ? (
              <div className='h-[300px] flex items-center justify-center'>
                <div className='flex items-center gap-2'>
                  <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
                  <span className='text-gray-600'>Đang tải dữ liệu...</span>
                </div>
              </div>
            ) : (
              <div className='w-full'>
                <ChartContainer config={chartConfig} className='h-[300px] w-full'>
                  <LineChart
                    data={revenueData}
                    width={undefined}
                    height={300}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray='3 3' stroke='#E5E7EB' />
                    <XAxis dataKey='month' stroke='#6B7280' tick={{ fill: '#6B7280' }} />
                    <YAxis stroke='#6B7280' tick={{ fill: '#6B7280' }} />
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
                    <Line
                      type='monotone'
                      dataKey='revenue'
                      stroke='#3B82F6'
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Promotion Overview and Vietnam Map - Same Row */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Promotion Overview */}
          <Card className='bg-white shadow-sm'>
            <CardHeader>
              <CardTitle className='text-lg font-semibold text-gray-900'>Tổng quan khuyến mãi</CardTitle>
            </CardHeader>
            <CardContent>
              {promotionStats ? (
                <div className='space-y-4'>
                  {/* Stats Grid */}
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='p-4 bg-purple-50 rounded-lg border border-purple-100'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Tag className='w-5 h-5 text-purple-600' />
                        <p className='text-sm font-medium text-gray-600'>Đang hoạt động</p>
                      </div>
                      <p className='text-2xl font-bold text-purple-600'>{promotionStats.activePromotions}</p>
                      <p className='text-xs text-gray-500 mt-1'>trong tổng {promotionStats.totalPromotions} khuyến mãi</p>
                    </div>

                    <div className='p-4 bg-orange-50 rounded-lg border border-orange-100'>
                      <div className='flex items-center gap-2 mb-2'>
                        <AlertCircle className='w-5 h-5 text-orange-600' />
                        <p className='text-sm font-medium text-gray-600'>Sắp hết hạn</p>
                      </div>
                      <p className='text-2xl font-bold text-orange-600'>{promotionStats.expiringSoonPromotions}</p>
                      <p className='text-xs text-gray-500 mt-1'>cần kiểm tra</p>
                    </div>

                    <div className='p-4 bg-green-50 rounded-lg border border-green-100'>
                      <div className='flex items-center gap-2 mb-2'>
                        <span className='text-green-600 font-bold'>đ</span>
                        <p className='text-sm font-medium text-gray-600'>Tổng giảm giá</p>
                      </div>
                      <p className='text-xl font-bold text-green-600'>
                        {formatCurrency(promotionStats.totalDiscountGiven)}
                      </p>
                      <p className='text-xs text-gray-500 mt-1'>đã áp dụng</p>
                    </div>

                    <div className='p-4 bg-blue-50 rounded-lg border border-blue-100'>
                      <div className='flex items-center gap-2 mb-2'>
                        <TrendingUp className='w-5 h-5 text-blue-600' />
                        <p className='text-sm font-medium text-gray-600'>Lượt sử dụng</p>
                      </div>
                      <p className='text-2xl font-bold text-blue-600'>{formatNumber(promotionStats.totalUsage)}</p>
                      <p className='text-xs text-gray-500 mt-1'>
                        {formatNumber(promotionStats.totalOrdersWithPromotion)} đơn hàng
                      </p>
                    </div>
                  </div>

                  {/* Summary Info */}
                  <div className='pt-4 border-t border-gray-200'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-gray-600'>Đã hết hạn:</span>
                      <span className='font-medium text-gray-900'>{promotionStats.expiredPromotions}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='h-[300px] flex items-center justify-center text-gray-500'>
                  <p>Không có dữ liệu khuyến mãi</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vietnam Region Map */}
          <Card className='bg-white shadow-sm'>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle className='text-lg font-semibold text-gray-900'>
                Bản đồ tỉnh
                {selectedProvinceId && (
                  <span className='ml-2 text-sm font-normal text-gray-500'>
                    ({provinces.find((p) => p.id === selectedProvinceId)?.name})
                  </span>
                )}
              </CardTitle>
              {selectedProvinceId && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    setSelectedProvinceId(undefined)
                    handleProvinceSelect(null)
                  }}
                  className='text-xs'
                >
                  Xóa lọc
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className='relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200  overflow-hidden'>
                <div className='relative flex items-center justify-center' style={{ transformOrigin: 'center center' }}>
                  <div
                    className='transition-transform duration-300'
                    style={{
                      transform: `scale(${0.9 * mapZoom})`,
                      transformOrigin: 'center center'
                    }}
                  >
                    <VietnamMap setSelectedProvince={handleProvinceSelect} />
                  </div>
                </div>
                {/* Zoom Controls */}
                <div className='absolute bottom-4 right-4 flex flex-col gap-2 z-10'>
                  <button
                    onClick={() => setMapZoom((prev) => Math.min(prev * 1.2, 3))}
                    className='w-10 h-10 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors'
                    aria-label='Zoom in'
                    title='Phóng to'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='20'
                      height='20'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <circle cx='11' cy='11' r='8'></circle>
                      <path d='m21 21-4.35-4.35'></path>
                      <line x1='11' y1='8' x2='11' y2='14'></line>
                      <line x1='8' y1='11' x2='14' y2='11'></line>
                    </svg>
                  </button>
                  <button
                    onClick={() => setMapZoom((prev) => Math.max(prev / 1.2, 0.5))}
                    className='w-10 h-10 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors'
                    aria-label='Zoom out'
                    title='Thu nhỏ'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='20'
                      height='20'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <circle cx='11' cy='11' r='8'></circle>
                      <path d='m21 21-4.35-4.35'></path>
                      <line x1='8' y1='11' x2='14' y2='11'></line>
                    </svg>
                  </button>
                  <button
                    onClick={() => setMapZoom(1)}
                    className='w-10 h-10 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors'
                    aria-label='Reset zoom'
                    title='Đặt lại'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='20'
                      height='20'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <path d='M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8'></path>
                      <path d='M21 3v5h-5'></path>
                      <path d='M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16'></path>
                      <path d='M3 21v-5h5'></path>
                    </svg>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Lists Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* High Revenue Stores */}
        <Card className='bg-white shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle className='text-lg font-semibold text-gray-900'>Cửa hàng có doanh thu cao</CardTitle>
              <p className='text-sm text-gray-600 mt-1'>Top 5 cửa hàng theo doanh thu</p>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-sm text-gray-600'>Năm:</span>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value), 'stores')}
                className='px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                disabled={storesLoading}
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {storesLoading && (
                <Loader2 className='w-4 h-4 animate-spin text-gray-400' />
              )}
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            {storesLoading ? (
              <div className='flex items-center justify-center py-8'>
                <div className='flex items-center gap-2'>
                  <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
                  <span className='text-gray-600'>Đang tải dữ liệu...</span>
                </div>
              </div>
            ) : dashboardData?.summary?.topStoresByRevenue && dashboardData.summary.topStoresByRevenue.length > 0 ? (
              dashboardData.summary.topStoresByRevenue.map((store, index) => {
                return (
                  <div key={store.storeId} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center'>
                        {store.logoUrl ? (
                          <img
                            src={store.logoUrl}
                            alt={store.storeName}
                            className='w-full h-full object-cover'
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        ) : null}
                        {!store.logoUrl && <Store className='w-6 h-6 text-gray-400' />}
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
                )
              })
            ) : (
              <div className='text-center py-8 text-gray-500'>
                <Store className='w-12 h-12 mx-auto mb-2 text-gray-300' />
                <p>Không có dữ liệu cửa hàng</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stores Needing Action */}
        <Card className='bg-white shadow-sm'>
          <CardHeader>
            <CardTitle className='text-lg font-semibold text-gray-900'>Cửa hàng cần xử lý</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {storesNeedingAction && storesNeedingAction.length > 0 ? (
              storesNeedingAction.map((store) => {
                const reportCount = store.sellerInfo?.reportCount || 0
                return (
                  <div key={store.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                    <div className='flex items-center gap-3 flex-1'>
                      <div className='w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center'>
                        {store.logoUrl ? (
                          <img
                            src={store.logoUrl}
                            alt={store.storeName}
                            className='w-full h-full object-cover'
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        ) : null}
                        {!store.logoUrl && <Store className='w-6 h-6 text-gray-400' />}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-gray-900 truncate'>{store.storeName}</p>
                        <p className='text-sm text-gray-600'>
                          {store.province} • {store.district}
                        </p>
                        <p className='text-xs text-gray-500'>{store.sellerEmail || 'Không có'}</p>
                      </div>
                    </div>
                    <div className='flex items-center gap-3'>
                      <Button
                        size='sm'
                        variant='blue'
                        onClick={() => {
                          navigate(`/admin/storeManagement/store-detail/${store.id}`)
                        }}
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className='text-center py-8 text-gray-500'>
                <Store className='w-12 h-12 mx-auto mb-2 text-gray-300' />
                <p>Không có cửa hàng cần xử lý</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboard
