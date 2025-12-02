'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
// Temporarily disabled walletDashboard API calls
// import {
//   getWalletDashboard,
//   getWalletMonthlyStats,
//   type SellerWalletSummary,
//   type WalletMonthlyStatsResponse
// } from '../../../apis/walletDashboard.api'
import { getWalletBalance } from '../../../apis/wallet.api'
import type { WalletData } from '../../../types/walletType'
import { toast } from '../../../utils/toast'
import Loading from '../../../components/Loading/loading'
import { TrendingUp, RefreshCw, Sparkles, Tag, BarChart3 } from 'lucide-react'
import { sellerApi, type ProductRevenueReport, type DashboardFinanceData } from '../../../apis/seller.api'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

function FinanceManagement() {
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loadingWallet, setLoadingWallet] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  // Temporarily disabled - not used when walletDashboard API is disabled
  // const [transactionPage] = useState(1)
  // const transactionsPerPage = 10

  // Temporarily disabled walletDashboard API
  // const [walletDashboardData, setWalletDashboardData] = useState<SellerWalletSummary | null>(null)
  // const [dashboardYear] = useState<number>(new Date().getFullYear())
  // const [monthlyStats, setMonthlyStats] = useState<WalletMonthlyStatsResponse | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walletDashboardData = null as any

  const [dashboardDays, setDashboardDays] = useState(30)
  const [productRevenueSalesType, setProductRevenueSalesType] = useState<'All' | 'Retail' | 'Combo'>('All')
  const [productRevenueSortBy, setProductRevenueSortBy] = useState<'Revenue' | 'Quantity'>('Revenue')
  const [productRevenuePage, setProductRevenuePage] = useState(1)
  const productRevenuePageSize = 10
  const [productRevenueData, setProductRevenueData] = useState<ProductRevenueReport | null>(null)
  const [loadingProductRevenue, setLoadingProductRevenue] = useState(false)

  // Finance Dashboard data from API
  const [financeDashboardData, setFinanceDashboardData] = useState<DashboardFinanceData | null>(null)

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

  // Temporarily disabled walletDashboard API calls
  // const fetchWalletDashboard = async (year?: number) => {
  //   try {
  //     const response = await getWalletDashboard({
  //       year: year || dashboardYear,
  //       page: transactionPage,
  //       pageSize: transactionsPerPage
  //     })
  //     if (response?.data) {
  //       if (response.data.sellerSummary) {
  //         setWalletDashboardData(response.data.sellerSummary)
  //       }
  //     }
  //   } catch (error: unknown) {
  //     console.error('Error fetching wallet dashboard:', error)
  //     const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
  //     toast.error(errorMessage || 'Không thể tải dữ liệu dashboard')
  //   }
  // }

  // const fetchMonthlyStats = async (year?: number) => {
  //   try {
  //     const response = await getWalletMonthlyStats({
  //       year: year || dashboardYear
  //     })
  //     if (response) {
  //       setMonthlyStats(response)
  //     }
  //   } catch (error: unknown) {
  //     console.error('Error fetching monthly stats:', error)
  //   }
  // }

  const fetchProductRevenueReport = async () => {
    try {
      setLoadingProductRevenue(true)
      const data = await sellerApi.getProductRevenueReport({
        salesType: productRevenueSalesType,
        sortBy: productRevenueSortBy,
        pageNumber: productRevenuePage,
        pageSize: productRevenuePageSize
      })
      setProductRevenueData(data)
    } catch (error: unknown) {
      console.error('Error fetching product revenue report:', error)
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(errorMessage || 'Không thể tải báo cáo doanh thu sản phẩm')
    } finally {
      setLoadingProductRevenue(false)
    }
  }

  // Fetch finance dashboard data (includes revenue30Days)
  const fetchFinanceDashboard = async () => {
    try {
      const data = await sellerApi.getFinanceDashboard({
        days: dashboardDays
      })
      console.log('Finance Dashboard Data:', data)
      console.log('Charts:', data?.charts)
      console.log('Revenue30Days:', data?.charts?.revenue30Days)
      setFinanceDashboardData(data)
    } catch (error: unknown) {
      console.error('Error fetching finance dashboard:', error)
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(errorMessage || 'Không thể tải dữ liệu dashboard finance')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      fetchWalletBalance(),
      // fetchWalletDashboard(), // Temporarily disabled
      // fetchMonthlyStats(), // Temporarily disabled
      fetchProductRevenueReport(),
      fetchFinanceDashboard()
    ])
    setRefreshing(false)
    toast.success('Đã làm mới dữ liệu')
  }

  useEffect(() => {
    fetchWalletBalance()
    // fetchWalletDashboard() // Temporarily disabled
    // fetchMonthlyStats() // Temporarily disabled
    fetchProductRevenueReport()
    fetchFinanceDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Temporarily disabled
  // useEffect(() => {
  //   fetchWalletDashboard()
  //   fetchMonthlyStats()
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [dashboardYear, transactionPage])

  useEffect(() => {
    fetchProductRevenueReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productRevenueSalesType, productRevenueSortBy, productRevenuePage])

  useEffect(() => {
    fetchFinanceDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardDays])

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
        netIncome: walletData.netRevenue || 0,
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

  const performanceMetrics = useMemo(() => {
    const grossRevenue = walletDataDisplay.grossRevenue || 0
    const netIncomeValue = walletDataDisplay.netRevenue || 0
    return {
      profitMargin: grossRevenue > 0 ? ((netIncomeValue / grossRevenue) * 100).toFixed(1) : null
    }
  }, [walletDataDisplay.grossRevenue, walletDataDisplay.netRevenue])

  // Use revenue30Days from financeDashboardData API, fallback to mock data
  const revenue30Days = useMemo(() => {
    // Priority: Use data from getFinanceDashboard API
    // Check if revenue30Days exists and is an array (even if all values are 0)
    if (financeDashboardData?.charts?.revenue30Days && Array.isArray(financeDashboardData.charts.revenue30Days)) {
      console.log('Using revenue30Days from API, length:', financeDashboardData.charts.revenue30Days.length)
      return financeDashboardData.charts.revenue30Days
    }

    // Fallback: Use monthlyStats if available (temporarily disabled)
    // if (monthlyStats?.revenueByMonth && walletDashboardData?.revenueByMonth) {
    //   const data = []
    //   const today = new Date()
    //   for (let i = dashboardDays - 1; i >= 0; i--) {
    //     const date = new Date(today)
    //     date.setDate(date.getDate() - i)
    //     const monthKey = String(date.getMonth() + 1).padStart(2, '0')
    //     const revenue = walletDashboardData.revenueByMonth[monthKey] || 0
    //     const commission = Math.floor(revenue * 0.1)
    //     data.push({
    //       date: date.toISOString(),
    //       netRevenue: revenue,
    //       commission: commission
    //     })
    //   }
    //   return data
    // }

    // Final fallback: Mock data
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
  }, [dashboardDays, financeDashboardData])

  const productRevenueDisplay = productRevenueData || {
    items: [],
    totalItems: 0,
    pageNumber: productRevenuePage,
    pageSize: productRevenuePageSize
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M ₫`
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}k ₫`
    }
    return `${amount.toLocaleString()} ₫`
  }

  // Prepare Chart.js data
  const chartData = useMemo(() => {
    if (!revenue30Days || revenue30Days.length === 0) {
      return null
    }

    const allLabels = revenue30Days.map((item) =>
      new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    )

    return {
      labels: allLabels,
      datasets: [
        {
          label: 'Doanh thu',
          data: revenue30Days.map((item) => item.netRevenue),
          borderColor: 'rgb(16, 185, 129)', // emerald-500
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointBackgroundColor: 'rgb(16, 185, 129)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: 'Hoa hồng',
          data: revenue30Days.map((item) => item.commission),
          borderColor: 'rgb(45, 212, 191)', // teal-400
          backgroundColor: 'rgba(45, 212, 191, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointBackgroundColor: 'rgb(45, 212, 191)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    }
  }, [revenue30Days])

  const chartOptions = useMemo(() => {
    if (!revenue30Days.length) {
      return {}
    }

    const maxValue = Math.max(...revenue30Days.map((d) => Math.max(d.netRevenue, d.commission)))
    const maxRevenue = maxValue > 0 ? maxValue : 1

    const labels = revenue30Days.map((item) =>
      new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    )

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false
      },
      plugins: {
        legend: {
          display: false // We'll use custom legend
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold' as const
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            title: (context: Array<{ dataIndex: number }>) => {
              const index = context[0]?.dataIndex ?? 0
              return new Date(revenue30Days[index]?.date || '').toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            },
            label: (context: { dataset: { label?: string }; parsed: { y: number | null } }) => {
              const label = context.dataset.label || ''
              const value = context.parsed.y
              if (value === null || value === undefined) return `${label}: 0 ₫`
              return `${label}: ${formatCurrency(value)}`
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: false
          },
          ticks: {
            maxRotation: 0,
            minRotation: 0,
            callback: function (_value: unknown, index: number) {
              // Smart label display
              if (dashboardDays <= 7) return labels[index] || ''
              if (dashboardDays <= 30) return index % 3 === 0 ? labels[index] || '' : ''
              return index % 10 === 0 ? labels[index] || '' : ''
            },
            font: {
              size: 11
            },
            color: '#64748b'
          }
        },
        y: {
          display: true,
          beginAtZero: true,
          grid: {
            color: 'rgba(148, 163, 184, 0.1)'
          },
          ticks: {
            callback: function (value: unknown) {
              return formatCurrency(typeof value === 'number' ? value : 0)
            },
            font: {
              size: 11
            },
            color: '#64748b'
          },
          max: maxRevenue > 0 ? maxRevenue * 1.1 : undefined // Add 10% padding at top
        }
      }
    }
  }, [revenue30Days, dashboardDays])

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
      /* Updated background to use green theme gradient */
      className='p-4 sm:p-6 bg-gradient-to-br from-emerald-50 via-white to-teal-50 min-h-screen'
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
            <h1 className='text-2xl sm:text-3xl font-bold text-emerald-700 mb-2'>Quản lý tài chính</h1>
            <p className='text-sm sm:text-base text-slate-600'>Theo dõi doanh thu và quản lý tài chính của bạn</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className='w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white border-0'
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>
      </motion.div>

      {/* Performance Metrics */}
      <motion.div className='mb-6 sm:mb-8' variants={containerVariants} initial='hidden' animate='visible'>
        <h2 className='text-lg font-semibold text-slate-900 mb-4'>Hiệu Quả Kinh Doanh</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* Tổng doanh thu */}
          <Card className='hover:shadow-lg transition-all border-emerald-200 hover:border-emerald-400'>
            <CardContent className='p-6'>
              <div className='flex justify-between items-start'>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-slate-600 mb-2'>Tổng doanh thu</p>
                  <p className='text-2xl font-bold text-emerald-600 mb-1'>
                    {walletDataDisplay.grossRevenue.toLocaleString()} ₫
                  </p>
                  <p className='text-xs text-slate-500'>Tổng bán được</p>
                </div>
                <div className='w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                  <TrendingUp className='w-6 h-6 text-emerald-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Giảm giá seller chịu */}
          {walletDataDisplay.totalSellerDiscount !== undefined && (
            <Card className='hover:shadow-lg transition-all border-rose-200 hover:border-rose-400'>
              <CardContent className='p-6'>
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-slate-600 mb-2'>Giảm giá bạn chịu</p>
                    <p className='text-2xl font-bold text-rose-600 mb-1'>
                      {(walletDataDisplay.totalSellerDiscount || 0).toLocaleString()} ₫
                    </p>
                    <p className='text-xs text-slate-500'>Từ chương trình giảm giá</p>
                  </div>
                  <div className='w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                    <Tag className='w-6 h-6 text-rose-600' />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Platform hỗ trợ - HIGHLIGHTED */}
          {walletDataDisplay.totalSystemDiscount !== undefined && (
            <Card className='hover:shadow-lg transition-all bg-gradient-to-br from-emerald-100 to-teal-100 border-2 border-emerald-400 relative overflow-hidden'>
              <div className='absolute top-0 right-0 opacity-10'>
                <Sparkles className='w-20 h-20 text-emerald-600' />
              </div>
              <CardContent className='p-6 relative z-10'>
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-2'>
                      <Sparkles className='w-4 h-4 text-emerald-700' />
                      <p className='text-sm font-medium text-emerald-700'>Platform hỗ trợ</p>
                    </div>
                    <p className='text-2xl font-bold text-emerald-700 mb-1'>
                      {(walletDataDisplay.totalSystemDiscount || 0).toLocaleString()} ₫
                    </p>
                    <p className='text-xs text-emerald-700 font-medium'>💚 Platform đã chi giúp bạn!</p>
                  </div>
                  <div className='w-12 h-12 bg-emerald-200 rounded-lg flex items-center justify-center flex-shrink-0'>
                    <Sparkles className='w-6 h-6 text-emerald-700' />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tỷ suất lợi nhuận */}
          <Card className='hover:shadow-lg transition-all border-teal-200 hover:border-teal-400'>
            <CardContent className='p-6'>
              <div className='flex justify-between items-start'>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-slate-600 mb-2'>Tỷ suất lợi nhuận</p>
                  <p className='text-2xl font-bold text-teal-600 mb-1'>
                    {performanceMetrics.profitMargin !== null ? `${performanceMetrics.profitMargin}%` : 'N/A'}
                  </p>
                  <p className='text-xs text-slate-500'>Thu nhập / Doanh thu</p>
                </div>
                <div className='w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                  <BarChart3 className='w-6 h-6 text-teal-600' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Charts */}
      <motion.div className='mb-6 sm:mb-8' variants={containerVariants} initial='hidden' animate='visible'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold text-slate-900'>Biểu Đồ Thống Kê</h2>
          <div className='flex gap-2'>
            <select
              value={dashboardDays}
              onChange={(e) => setDashboardDays(Number(e.target.value))}
              className='px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white'
            >
              <option value={7}>7 ngày</option>
              <option value={30}>30 ngày</option>
              <option value={360}>360 ngày</option>
            </select>
          </div>
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <Card className='lg:col-span-2 hover:shadow-lg transition-all border-emerald-200'>
            <CardHeader className='border-b border-emerald-100'>
              <CardTitle className='flex items-center gap-2 text-emerald-700'>
                <BarChart3 className='w-5 h-5' />
                Doanh thu {dashboardDays} ngày gần nhất
              </CardTitle>
            </CardHeader>
            <CardContent className='p-6'>
              <div className='h-64 relative'>
                {!chartData || revenue30Days.length === 0 ? (
                  <div className='flex items-center justify-center h-full text-slate-500'>
                    Không có dữ liệu
                  </div>
                ) : (
                  <Line data={chartData} options={chartOptions} />
                )}
              </div>
              <div className='flex items-center justify-center gap-4 mt-4'>
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 bg-emerald-500 rounded'></div>
                  <span className='text-xs text-slate-600'>Doanh thu</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 bg-teal-400 rounded'></div>
                  <span className='text-xs text-slate-600'>Hoa hồng</span>
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
            <h2 className='text-lg font-semibold text-slate-900'>Báo Cáo Doanh Thu Sản Phẩm</h2>
            <p className='text-sm text-slate-600 mt-1'>Phân tích doanh thu theo từng sản phẩm (Bán lẻ vs Combo)</p>
          </div>
          <div className='flex flex-wrap gap-2'>
            <select
              value={productRevenueSalesType}
              onChange={(e) => {
                setProductRevenueSalesType(e.target.value as 'All' | 'Retail' | 'Combo')
                setProductRevenuePage(1)
              }}
              className='px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white'
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
              className='px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white'
            >
              <option value='Revenue'>Sắp xếp theo Doanh thu</option>
              <option value='Quantity'>Sắp xếp theo Số lượng</option>
            </select>
          </div>
        </div>
        <Card className='hover:shadow-lg transition-all border-emerald-200'>
          <CardContent className='p-6'>
            {loadingProductRevenue ? (
              <div className='flex items-center justify-center py-12'>
                <Loading />
              </div>
            ) : (
              <>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b-2 border-emerald-200 bg-emerald-50'>
                        <th className='text-left py-3 px-4 font-medium text-emerald-900 text-sm'>Sản phẩm</th>
                        <th className='text-left py-3 px-4 font-medium text-emerald-900 text-sm'>Biến thể</th>
                        <th className='text-right py-3 px-4 font-medium text-emerald-900 text-sm'>Tổng bán</th>
                        <th className='text-right py-3 px-4 font-medium text-emerald-900 text-sm'>Doanh thu Bán lẻ</th>
                        <th className='text-right py-3 px-4 font-medium text-emerald-900 text-sm'>Doanh thu Combo</th>
                        <th className='text-right py-3 px-4 font-medium text-emerald-900 text-sm'>Tổng doanh thu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productRevenueDisplay.items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className='text-center py-8 text-slate-500'>
                            Không có dữ liệu
                          </td>
                        </tr>
                      ) : (
                        productRevenueDisplay.items.map((product) => (
                          <tr
                            key={`${product.productId}-${product.productVariantId}`}
                            className='border-b border-emerald-100 hover:bg-emerald-50 transition-colors'
                          >
                            <td className='py-4 px-4 text-slate-900 font-medium text-sm'>{product.productName}</td>
                            <td className='py-4 px-4 text-slate-700 text-sm'>{product.variantName}</td>
                            <td className='py-4 px-4 text-slate-900 text-sm text-right font-medium'>
                              {product.totalSold}
                            </td>
                            <td className='py-4 px-4 text-slate-700 text-sm text-right'>
                              {product.retailRevenue.toLocaleString()} ₫
                            </td>
                            <td className='py-4 px-4 text-slate-700 text-sm text-right'>
                              {product.comboRevenue.toLocaleString()} ₫
                            </td>
                            <td className='py-4 px-4 text-emerald-700 text-sm text-right font-bold'>
                              {product.totalRevenue.toLocaleString()} ₫
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {productRevenueDisplay.items.length > 0 && (
                      <tfoot>
                        <tr className='bg-emerald-50 border-t-2 border-emerald-300'>
                          <td colSpan={2} className='py-3 px-4 font-semibold text-emerald-900 text-sm'>
                            Tổng cộng
                          </td>
                          <td className='py-3 px-4 font-semibold text-emerald-900 text-sm text-right'>
                            {productRevenueDisplay.items.reduce((sum, p) => sum + p.totalSold, 0)}
                          </td>
                          <td className='py-3 px-4 font-semibold text-emerald-900 text-sm text-right'>
                            {productRevenueDisplay.items.reduce((sum, p) => sum + p.retailRevenue, 0).toLocaleString()}{' '}
                            ₫
                          </td>
                          <td className='py-3 px-4 font-semibold text-emerald-900 text-sm text-right'>
                            {productRevenueDisplay.items.reduce((sum, p) => sum + p.comboRevenue, 0).toLocaleString()} ₫
                          </td>
                          <td className='py-3 px-4 font-bold text-emerald-700 text-sm text-right'>
                            {productRevenueDisplay.items.reduce((sum, p) => sum + p.totalRevenue, 0).toLocaleString()} ₫
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
                {productRevenueDisplay.totalItems > productRevenuePageSize && (
                  <div className='flex items-center justify-between mt-4 pt-4 border-t border-emerald-100'>
                    <div className='text-sm text-slate-600'>
                      Hiển thị {(productRevenuePage - 1) * productRevenuePageSize + 1}-
                      {Math.min(productRevenuePage * productRevenuePageSize, productRevenueDisplay.totalItems)} trong
                      tổng số {productRevenueDisplay.totalItems} sản phẩm
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setProductRevenuePage((p) => Math.max(1, p - 1))}
                        disabled={productRevenuePage === 1 || loadingProductRevenue}
                        className='border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                      >
                        Trước
                      </Button>
                      <span className='px-3 py-1 text-sm text-slate-700 flex items-center'>
                        Trang {productRevenuePage} /{' '}
                        {Math.ceil(productRevenueDisplay.totalItems / productRevenuePageSize)}
                      </span>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          setProductRevenuePage((p) =>
                            Math.min(Math.ceil(productRevenueDisplay.totalItems / productRevenuePageSize), p + 1)
                          )
                        }
                        disabled={
                          productRevenuePage >= Math.ceil(productRevenueDisplay.totalItems / productRevenuePageSize) ||
                          loadingProductRevenue
                        }
                        className='border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default FinanceManagement
