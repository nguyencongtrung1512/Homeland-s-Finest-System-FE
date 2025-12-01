import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import {
  getWalletDashboard,
  getWalletMonthlyStats,
  type SellerWalletSummary,
  type WalletMonthlyStatsResponse
} from '../../../apis/walletDashboard.api'
import { getWalletBalance } from '../../../apis/wallet.api'
import type { WalletData } from '../../../types/walletType'
import { toast } from '../../../utils/toast'
import Loading from '../../../components/Loading/loading'
import { TrendingUp, RefreshCw, PieChart, Sparkles, Tag, BarChart3 } from 'lucide-react'

function FinanceManagement() {
  // Wallet data from API
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loadingWallet, setLoadingWallet] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [transactionPage] = useState(1)
  const transactionsPerPage = 10

  // Wallet Dashboard data from API
  const [walletDashboardData, setWalletDashboardData] = useState<SellerWalletSummary | null>(null)
  const [dashboardYear] = useState<number>(new Date().getFullYear())
  const [monthlyStats, setMonthlyStats] = useState<WalletMonthlyStatsResponse | null>(null)

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    try {
      setLoadingWallet(true)
      const data = await getWalletBalance()
      setWalletData(data)
    } catch (error: unknown) {
      console.error('Error fetching wallet balance:', error)
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(errorMessage || 'Không thể tải thông tin ví')
    } finally {
      setLoadingWallet(false)
    }
  }

  // Fetch wallet dashboard data
  // Backend tự động lấy userId và userRole từ JWT token, không cần truyền
  const fetchWalletDashboard = async (year?: number) => {
    try {
      const response = await getWalletDashboard({
        year: year || dashboardYear,
        page: transactionPage,
        pageSize: transactionsPerPage
      })

      if (response?.data) {
        // Set seller summary
        if (response.data.sellerSummary) {
          setWalletDashboardData(response.data.sellerSummary)
        }
      }
    } catch (error: unknown) {
      console.error('Error fetching wallet dashboard:', error)
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(errorMessage || 'Không thể tải dữ liệu dashboard')
    }
  }

  // Fetch monthly stats
  // Backend tự động lấy userId và userRole từ JWT token, không cần truyền
  const fetchMonthlyStats = async (year?: number) => {
    try {
      const response = await getWalletMonthlyStats({
        year: year || dashboardYear
      })

      if (response) {
        setMonthlyStats(response)
      }
    } catch (error: unknown) {
      console.error('Error fetching monthly stats:', error)
    }
  }

  // Refresh all data
  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      fetchWalletBalance(),
      fetchWalletDashboard(),
      fetchMonthlyStats()
    ])
    setRefreshing(false)
    toast.success('Đã làm mới dữ liệu')
  }

  // Initial data fetch
  useEffect(() => {
    fetchWalletBalance()
    fetchWalletDashboard()
    fetchMonthlyStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch dashboard when year or page changes
  useEffect(() => {
    fetchWalletDashboard()
    fetchMonthlyStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardYear, transactionPage])

  // Use API data from walletDashboard (priority) or fallback to walletData or hardcoded values
  interface WalletDisplayData {
    availableBalance: number
    pendingBalance: number
    debtBalance: number
    grossRevenue: number
    totalCommissionPaid: number
    netRevenue: number
    netIncome: number
    totalWithdrawn: number
    totalSellerDiscount?: number
    totalSystemDiscount?: number
  }

  const walletDataDisplay: WalletDisplayData = walletDashboardData
    ? {
      availableBalance: walletDashboardData.availableBalance,
      pendingBalance: walletDashboardData.pendingBalance,
      debtBalance: walletDashboardData.debtBalance,
      grossRevenue: walletDashboardData.grossRevenue,
      totalCommissionPaid: walletDashboardData.totalCommissionPaid,
      netRevenue: walletDashboardData.netRevenue,
      netIncome: walletDashboardData.netIncome,
      totalWithdrawn: walletDashboardData.totalWithdrawn,
      totalSellerDiscount: walletDashboardData.totalSellerDiscount,
      totalSystemDiscount: walletDashboardData.totalSystemDiscount
    }
    : walletData
      ? {
        availableBalance: walletData.availableBalance || 0,
        pendingBalance: walletData.pendingBalance || 0,
        debtBalance: walletData.debtBalance || 0,
        grossRevenue: walletData.grossRevenue || 0,
        totalCommissionPaid: walletData.totalCommissionPaid || 0,
        netRevenue: walletData.netRevenue || 0,
        netIncome: walletData.netRevenue || 0, // NetRevenue đã là thu nhập ròng (đã trừ discount và commission)
        totalWithdrawn: 0,
        totalSellerDiscount: walletData.totalSellerDiscount || 0,
        totalSystemDiscount: walletData.totalSystemDiscount || 0
      }
      : {
        availableBalance: 500000,
        pendingBalance: 1000000,
        debtBalance: 200000,
        grossRevenue: 10000000,
        totalCommissionPaid: 1000000,
        netRevenue: 8000000,
        netIncome: 8000000,
        totalWithdrawn: 0,
        totalSellerDiscount: 0,
        totalSystemDiscount: 0
      }



  // Mock data cho Dashboard sections (sẽ thay bằng API sau)
  const [dashboardDays, setDashboardDays] = useState(30)
  const [productRevenueSalesType, setProductRevenueSalesType] = useState<'All' | 'Retail' | 'Combo'>('All')
  const [productRevenueSortBy, setProductRevenueSortBy] = useState<'Revenue' | 'Quantity'>('Revenue')
  const [productRevenuePage, setProductRevenuePage] = useState(1)
  const productRevenuePageSize = 10

  // Performance Metrics from API data
  const performanceMetrics = useMemo(() => {
    const grossRevenue = walletDataDisplay.grossRevenue || 0
    const netIncomeValue = walletDataDisplay.netRevenue || 0
    return {
      profitMargin: grossRevenue > 0 ? ((netIncomeValue / grossRevenue) * 100).toFixed(1) : null
    }
  }, [walletDataDisplay.grossRevenue, walletDataDisplay.netRevenue])


  // Revenue Chart data from monthly stats API
  const revenue30Days = useMemo(() => {
    if (monthlyStats?.revenueByMonth && walletDashboardData?.revenueByMonth) {
      // Use data from API if available
      const data = []
      const today = new Date()
      for (let i = dashboardDays - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const monthKey = String(date.getMonth() + 1).padStart(2, '0')
        const revenue = walletDashboardData.revenueByMonth[monthKey] || 0
        // Estimate commission as 10% of revenue
        const commission = Math.floor(revenue * 0.1)
        data.push({
          date: date.toISOString(),
          netRevenue: revenue,
          commission: commission
        })
      }
      return data
    }

    // Fallback to mock data
    const data = []
    const today = new Date()
    for (let i = dashboardDays - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      data.push({
        date: date.toISOString(),
        netRevenue: Math.floor(Math.random() * 5000000) + 1000000,
        commission: Math.floor(Math.random() * 500000) + 100000
      })
    }
    return data
  }, [dashboardDays, monthlyStats, walletDashboardData])

  // Mock data - Payment Method Distribution
  const mockPaymentMethodDistribution = useMemo(() => ({
    cod: {
      count: 50,
      totalAmount: 5700000
    },
    banking: {
      count: 30,
      totalAmount: 9500000
    }
  }), [])

  // Mock data - Product Revenue Report
  const mockProductRevenueData = useMemo(() => {
    const products = [
      { id: '1', productName: 'Khô Gà Lá Chanh', variantName: 'Gói 500g', totalSold: 150, retailRevenue: 5000000, comboRevenue: 2000000 },
      { id: '2', productName: 'Bánh Tráng Nướng', variantName: 'Gói 200g', totalSold: 200, retailRevenue: 3200000, comboRevenue: 1500000 },
      { id: '3', productName: 'Mắm Ruốc', variantName: 'Chai 250ml', totalSold: 120, retailRevenue: 2800000, comboRevenue: 1800000 },
      { id: '4', productName: 'Khô Bò', variantName: 'Gói 300g', totalSold: 100, retailRevenue: 2500000, comboRevenue: 1200000 },
      { id: '5', productName: 'Chà Bông', variantName: 'Gói 200g', totalSold: 180, retailRevenue: 2000000, comboRevenue: 1000000 },
      { id: '6', productName: 'Bánh Phồng Tôm', variantName: 'Gói 150g', totalSold: 90, retailRevenue: 1800000, comboRevenue: 800000 },
      { id: '7', productName: 'Mắm Tôm', variantName: 'Chai 200ml', totalSold: 80, retailRevenue: 1600000, comboRevenue: 600000 },
      { id: '8', productName: 'Tương Ớt', variantName: 'Chai 250ml', totalSold: 150, retailRevenue: 1400000, comboRevenue: 500000 },
      { id: '9', productName: 'Bánh Đa Nem', variantName: 'Gói 500g', totalSold: 110, retailRevenue: 1300000, comboRevenue: 400000 },
      { id: '10', productName: 'Nước Mắm', variantName: 'Chai 500ml', totalSold: 95, retailRevenue: 1200000, comboRevenue: 300000 },
      { id: '11', productName: 'Mì Quảng', variantName: 'Gói 400g', totalSold: 85, retailRevenue: 1100000, comboRevenue: 200000 },
      { id: '12', productName: 'Bún Bò Huế', variantName: 'Gói 350g', totalSold: 75, retailRevenue: 1000000, comboRevenue: 150000 }
    ]

    // Filter by sales type
    let filtered = products
    if (productRevenueSalesType === 'Retail') {
      filtered = products.filter(p => p.retailRevenue > 0)
    } else if (productRevenueSalesType === 'Combo') {
      filtered = products.filter(p => p.comboRevenue > 0)
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (productRevenueSortBy === 'Quantity') {
        return b.totalSold - a.totalSold
      } else {
        return (b.retailRevenue + b.comboRevenue) - (a.retailRevenue + a.comboRevenue)
      }
    })

    // Pagination
    const startIndex = (productRevenuePage - 1) * productRevenuePageSize
    const paginated = sorted.slice(startIndex, startIndex + productRevenuePageSize)

    return {
      items: paginated.map(p => ({
        ...p,
        totalRevenue: p.retailRevenue + p.comboRevenue
      })),
      totalItems: sorted.length,
      pageNumber: productRevenuePage,
      pageSize: productRevenuePageSize
    }
  }, [productRevenueSalesType, productRevenueSortBy, productRevenuePage])

  // Format currency helper
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M ₫`
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}k ₫`
    }
    return `${amount.toLocaleString()} ₫`
  }

  // Get max revenue for chart
  const getMaxRevenue = () => {
    if (!revenue30Days.length) return 1
    return Math.max(...revenue30Days.map((d) => Math.max(d.netRevenue, d.commission)))
  }



  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  if (loadingWallet) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loading />
      </div>
    )
  }

  return (
    <motion.div
      className='p-4 sm:p-6 bg-gray-50 min-h-screen'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <motion.div
        className='mb-6 sm:mb-8'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-green-700 mb-2'>Quản lý tài chính</h1>
            <p className='text-sm sm:text-base text-gray-600'>Theo dõi doanh thu và quản lý tài chính của bạn</p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing} variant='outline' className='w-full sm:w-auto'>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>
      </motion.div>

      {/* ========== DASHBOARD SECTIONS (Mock Data) ========== */}


      {/* Performance Metrics */}
      <motion.div className='mb-6 sm:mb-8' variants={containerVariants} initial='hidden' animate='visible'>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>Hiệu Quả Kinh Doanh</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <Card className='hover:shadow-md transition-shadow'>
            <CardContent className='p-6'>
              <div className='flex justify-between items-start'>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-600 mb-2'>Tổng doanh thu</p>
                  <p className='text-2xl font-bold text-green-600 mb-1'>
                    {walletDataDisplay.grossRevenue.toLocaleString()} ₫
                  </p>
                  <p className='text-xs text-gray-500'>Tổng bán được</p>
                </div>
                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                  <TrendingUp className='w-6 h-6 text-green-600' />
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Giảm giá seller chịu */}
          {walletDataDisplay.totalSellerDiscount !== undefined && (
            <Card className='hover:shadow-md transition-shadow border-2 border-red-200'>
              <CardContent className='p-6'>
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-gray-600 mb-2'>Giảm giá bạn chịu</p>
                    <p className='text-2xl font-bold text-red-600 mb-1'>
                      {(walletDataDisplay.totalSellerDiscount || 0).toLocaleString()} ₫
                    </p>
                    <p className='text-xs text-gray-500'>Từ chương trình giảm giá của bạn</p>
                  </div>
                  <div className='w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                    <Tag className='w-6 h-6 text-red-600' />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Platform hỗ trợ - HIGHLIGHTED ✨ */}
          {walletDataDisplay.totalSystemDiscount !== undefined && (
            <Card className='hover:shadow-md transition-shadow bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-300 relative overflow-hidden'>
              <div className='absolute top-0 right-0 opacity-10'>
                <Sparkles className='w-20 h-20 text-green-600' />
              </div>
              <CardContent className='p-6 relative z-10'>
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-2'>
                      <Sparkles className='w-4 h-4 text-green-700' />
                      <p className='text-sm font-medium text-green-700'>Platform hỗ trợ</p>
                    </div>
                    <p className='text-2xl font-bold text-green-600 mb-1'>
                      {(walletDataDisplay.totalSystemDiscount || 0).toLocaleString()} ₫
                    </p>
                    <p className='text-xs text-green-700 font-medium'>💚 Platform đã chi giúp bạn!</p>
                  </div>
                  <div className='w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center flex-shrink-0'>
                    <Sparkles className='w-6 h-6 text-green-700' />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className='hover:shadow-md transition-shadow border-2 border-orange-200'>
            <CardContent className='p-6'>
              <div className='flex justify-between items-start'>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-600 mb-2'>Tỷ suất lợi nhuận</p>
                  <p className='text-2xl font-bold text-orange-600 mb-1'>
                    {performanceMetrics.profitMargin !== null ? `${performanceMetrics.profitMargin}%` : 'N/A'}
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
      </motion.div>



      {/* Charts */}
      <motion.div className='mb-6 sm:mb-8' variants={containerVariants} initial='hidden' animate='visible'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold text-gray-900'>Biểu Đồ Thống Kê</h2>
          <div className='flex gap-2'>
            <select
              value={dashboardDays}
              onChange={(e) => setDashboardDays(Number(e.target.value))}
              className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500'
            >
              <option value={7}>7 ngày</option>
              <option value={30}>30 ngày</option>
              <option value={90}>90 ngày</option>
            </select>
          </div>
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          <Card className='lg:col-span-2 hover:shadow-md transition-shadow'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BarChart3 className='w-5 h-5' />
                Doanh thu {dashboardDays} ngày gần nhất
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-64 relative'>
                <div className='absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2'>
                  <span>{formatCurrency(getMaxRevenue())}</span>
                  <span>{formatCurrency(getMaxRevenue() * 0.75)}</span>
                  <span>{formatCurrency(getMaxRevenue() * 0.5)}</span>
                  <span>{formatCurrency(getMaxRevenue() * 0.25)}</span>
                  <span>0</span>
                </div>
                <div className='ml-8 h-full flex items-end justify-between gap-1'>
                  {revenue30Days.map((item, index) => {
                    const maxRevenue = getMaxRevenue()
                    const netHeight = maxRevenue > 0 ? (item.netRevenue / maxRevenue) * 100 : 0
                    const commissionHeight = maxRevenue > 0 ? (item.commission / maxRevenue) * 100 : 0
                    return (
                      <div key={index} className='flex-1 flex flex-col items-center gap-1'>
                        <div className='w-full flex flex-col items-end gap-0.5'>
                          <div
                            className='w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer'
                            style={{ height: `${netHeight}%` }}
                            title={`${new Date(item.date).toLocaleDateString('vi-VN')}: Doanh thu ${formatCurrency(item.netRevenue)}`}
                          ></div>
                          <div
                            className='w-full bg-purple-500 rounded-t hover:bg-purple-600 transition-colors cursor-pointer'
                            style={{ height: `${commissionHeight}%` }}
                            title={`${new Date(item.date).toLocaleDateString('vi-VN')}: Hoa hồng ${formatCurrency(item.commission)}`}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className='absolute bottom-0 left-8 right-0 flex justify-between text-xs text-gray-500'>
                  {revenue30Days.map((item, index) => (
                    <span key={index} className='flex-1 text-center'>
                      {new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
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
                      {formatCurrency(mockPaymentMethodDistribution.banking.totalAmount)}
                    </span>
                  </div>
                  <div className='w-full h-4 bg-gray-200 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-blue-500 rounded-full'
                      style={{
                        width: `${(mockPaymentMethodDistribution.banking.totalAmount /
                          (mockPaymentMethodDistribution.banking.totalAmount +
                            mockPaymentMethodDistribution.cod.totalAmount)) *
                          100
                          }%`
                      }}
                    ></div>
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    {mockPaymentMethodDistribution.banking.count} đơn hàng
                  </p>
                </div>
                <div>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm text-gray-600'>COD</span>
                    <span className='text-sm font-medium text-gray-900'>
                      {formatCurrency(mockPaymentMethodDistribution.cod.totalAmount)}
                    </span>
                  </div>
                  <div className='w-full h-4 bg-gray-200 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-orange-500 rounded-full'
                      style={{
                        width: `${(mockPaymentMethodDistribution.cod.totalAmount /
                          (mockPaymentMethodDistribution.banking.totalAmount +
                            mockPaymentMethodDistribution.cod.totalAmount)) *
                          100
                          }%`
                      }}
                    />
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    {mockPaymentMethodDistribution.cod.count} đơn hàng
                  </p>
                </div>
                <div className='pt-4 border-t'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-gray-900'>Tổng cộng</span>
                    <span className='text-sm font-bold text-gray-900'>
                      {formatCurrency(
                        mockPaymentMethodDistribution.banking.totalAmount +
                        mockPaymentMethodDistribution.cod.totalAmount
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Product Revenue Report */}
      <motion.div className='mb-6 sm:mb-8' variants={containerVariants} initial='hidden' animate='visible'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>Báo Cáo Doanh Thu Sản Phẩm</h2>
            <p className='text-sm text-gray-600 mt-1'>Phân tích doanh thu theo từng sản phẩm (Bán lẻ vs Combo)</p>
          </div>
          <div className='flex flex-wrap gap-2'>
            <select
              value={productRevenueSalesType}
              onChange={(e) => {
                setProductRevenueSalesType(e.target.value as 'All' | 'Retail' | 'Combo')
                setProductRevenuePage(1)
              }}
              className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500'
            >
              <option value='All'>Tất cả</option>
              <option value='Retail'>Chỉ Bán lẻ</option>
              <option value='Combo'>Chỉ Combo</option>
            </select>
            <select
              value={productRevenueSortBy}
              onChange={(e) => {
                setProductRevenueSortBy(e.target.value as 'Revenue' | 'Quantity')
                setProductRevenuePage(1)
              }}
              className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500'
            >
              <option value='Revenue'>Sắp xếp theo Doanh thu</option>
              <option value='Quantity'>Sắp xếp theo Số lượng</option>
            </select>
          </div>
        </div>
        <Card className='hover:shadow-md transition-shadow'>
          <CardContent className='p-6'>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-gray-200'>
                    <th className='text-left py-3 px-4 font-medium text-gray-700 text-sm'>Sản phẩm</th>
                    <th className='text-left py-3 px-4 font-medium text-gray-700 text-sm'>Biến thể</th>
                    <th className='text-right py-3 px-4 font-medium text-gray-700 text-sm'>Tổng bán</th>
                    <th className='text-right py-3 px-4 font-medium text-gray-700 text-sm'>Doanh thu Bán lẻ</th>
                    <th className='text-right py-3 px-4 font-medium text-gray-700 text-sm'>Doanh thu Combo</th>
                    <th className='text-right py-3 px-4 font-medium text-gray-700 text-sm'>Tổng doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {mockProductRevenueData.items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className='text-center py-8 text-gray-500'>
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    mockProductRevenueData.items.map((product) => (
                      <tr
                        key={product.id}
                        className='border-b border-gray-100 hover:bg-gray-50 transition-colors'
                      >
                        <td className='py-4 px-4 text-gray-900 font-medium text-sm'>{product.productName}</td>
                        <td className='py-4 px-4 text-gray-700 text-sm'>{product.variantName}</td>
                        <td className='py-4 px-4 text-gray-900 text-sm text-right font-medium'>
                          {product.totalSold}
                        </td>
                        <td className='py-4 px-4 text-gray-700 text-sm text-right'>
                          {product.retailRevenue.toLocaleString()} ₫
                        </td>
                        <td className='py-4 px-4 text-gray-700 text-sm text-right'>
                          {product.comboRevenue.toLocaleString()} ₫
                        </td>
                        <td className='py-4 px-4 text-gray-900 text-sm text-right font-bold'>
                          {product.totalRevenue.toLocaleString()} ₫
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {mockProductRevenueData.items.length > 0 && (
                  <tfoot>
                    <tr className='bg-gray-50 border-t-2 border-gray-200'>
                      <td colSpan={2} className='py-3 px-4 font-semibold text-gray-900 text-sm'>
                        Tổng cộng
                      </td>
                      <td className='py-3 px-4 font-semibold text-gray-900 text-sm text-right'>
                        {mockProductRevenueData.items.reduce((sum, p) => sum + p.totalSold, 0)}
                      </td>
                      <td className='py-3 px-4 font-semibold text-gray-900 text-sm text-right'>
                        {mockProductRevenueData.items.reduce((sum, p) => sum + p.retailRevenue, 0).toLocaleString()} ₫
                      </td>
                      <td className='py-3 px-4 font-semibold text-gray-900 text-sm text-right'>
                        {mockProductRevenueData.items.reduce((sum, p) => sum + p.comboRevenue, 0).toLocaleString()} ₫
                      </td>
                      <td className='py-3 px-4 font-bold text-green-600 text-sm text-right'>
                        {mockProductRevenueData.items.reduce((sum, p) => sum + p.totalRevenue, 0).toLocaleString()} ₫
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            {mockProductRevenueData.totalItems > productRevenuePageSize && (
              <div className='flex items-center justify-between mt-4 pt-4 border-t'>
                <div className='text-sm text-gray-600'>
                  Hiển thị {((productRevenuePage - 1) * productRevenuePageSize) + 1}-
                  {Math.min(productRevenuePage * productRevenuePageSize, mockProductRevenueData.totalItems)} trong tổng số{' '}
                  {mockProductRevenueData.totalItems} sản phẩm
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setProductRevenuePage((p) => Math.max(1, p - 1))}
                    disabled={productRevenuePage === 1}
                  >
                    Trước
                  </Button>
                  <span className='px-3 py-1 text-sm text-gray-700 flex items-center'>
                    Trang {productRevenuePage} / {Math.ceil(mockProductRevenueData.totalItems / productRevenuePageSize)}
                  </span>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setProductRevenuePage((p) =>
                        Math.min(Math.ceil(mockProductRevenueData.totalItems / productRevenuePageSize), p + 1)
                      )
                    }
                    disabled={
                      productRevenuePage >= Math.ceil(mockProductRevenueData.totalItems / productRevenuePageSize)
                    }
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default FinanceManagement
