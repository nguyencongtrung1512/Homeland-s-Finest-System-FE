import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { useAuth } from '../../../contexts/auth.context'
import { getUserById, updateUser, type User as UserType } from '../../../apis/user.api'
import { getWalletBalance, getWalletTransactions, depositMoney, payDebt, withdrawal } from '../../../apis/wallet.api'
import type { WalletData, WalletTransactionDTO } from '../../../types/walletType'
import { toast } from '../../../utils/toast'
import Loading from '../../../components/Loading/loading'
import {
  PiggyBank,
  Clock,
  TrendingUp,
  Search,
  Calendar,
  Building2,
  CreditCard,
  User,
  Edit,
  Wallet,
  AlertCircle,
  DollarSign,
  Receipt,
  Info,
  RefreshCw,
  Plus,
  ArrowDownCircle
} from 'lucide-react'

function FinanceManagement() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [showFormulaModal, setShowFormulaModal] = useState(false)
  const [userInfo, setUserInfo] = useState<UserType | null>(null)
  const [loadingUserInfo, setLoadingUserInfo] = useState(false)
  const [showUpdateBankModal, setShowUpdateBankModal] = useState(false)
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: ''
  })
  const [updating, setUpdating] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [submittingDeposit, setSubmittingDeposit] = useState(false)
  const [showPayDebtModal, setShowPayDebtModal] = useState(false)
  const [payDebtAmount, setPayDebtAmount] = useState('')
  const [submittingPayDebt, setSubmittingPayDebt] = useState(false)

  // Wallet data from API
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<WalletTransactionDTO[]>([])
  const [loadingWallet, setLoadingWallet] = useState(true)
  const [loadingTransactions, setLoadingTransactions] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

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

  // Fetch wallet transactions
  const fetchWalletTransactions = async (page: number = 1) => {
    try {
      setLoadingTransactions(true)
      const response = await getWalletTransactions({
        pageSize: 10,
        pageNumber: page
      })

      // Handle different response structures
      if (response?.data?.items) {
        setTransactions(response.data.items)
      } else if (Array.isArray(response?.data)) {
        setTransactions(response.data)
      } else if (Array.isArray(response)) {
        setTransactions(response)
      } else {
        // Fallback to empty array
        setTransactions([])
      }
    } catch (error: unknown) {
      console.error('Error fetching wallet transactions:', error)
      // Keep hardcoded transactions if API fails
      setTransactions([])
    } finally {
      setLoadingTransactions(false)
    }
  }

  // Refresh all data
  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchWalletBalance(), fetchWalletTransactions(1)])
    setRefreshing(false)
    toast.success('Đã làm mới dữ liệu')
  }

  // Initial data fetch
  useEffect(() => {
    fetchWalletBalance()
    fetchWalletTransactions(1)
  }, [])

  // Use API data or fallback to hardcoded values
  const walletDataDisplay = walletData || {
    availableBalance: 500000,
    pendingBalance: 1000000,
    debtBalance: 200000,
    grossRevenue: 10000000,
    totalCommissionPaid: 1000000,
    netRevenue: 8000000
  }

  // 3. Derived (Tính toán)
  const netIncome =
    walletDataDisplay.netRevenue || walletDataDisplay.grossRevenue - walletDataDisplay.totalCommissionPaid
  const totalWithdrawn =
    netIncome - (walletDataDisplay.availableBalance + walletDataDisplay.pendingBalance - walletDataDisplay.debtBalance)

  // Fetch user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user?.userId) return

      setLoadingUserInfo(true)
      try {
        const userData = await getUserById(user.userId)
        setUserInfo(userData)
        // Set form values if user has bank info
        if (userData.toBin || userData.bankAccount) {
          setBankForm({
            bankName: userData.toBin || '',
            accountNumber: userData.bankAccount || ''
          })
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
        toast.error('Không thể tải thông tin người dùng')
      } finally {
        setLoadingUserInfo(false)
      }
    }

    fetchUserInfo()
  }, [user?.userId])

  // Map transaction status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Approved':
        return <Badge className='bg-green-100 text-green-800 hover:bg-green-100 border-green-200'>Đã thanh toán</Badge>
      case 'Pending':
        return <Badge className='bg-yellow-100 text-orange-800 hover:bg-yellow-100 border-yellow-200'>Đang chờ</Badge>
      case 'Cancel':
      case 'Rejected':
        return <Badge className='bg-red-100 text-red-800 hover:bg-red-100 border-red-200'>Đã hủy</Badge>
      case 'Disputed':
        return <Badge className='bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200'>Tranh chấp</Badge>
      default:
        return <Badge className='bg-gray-100 text-gray-800 hover:bg-gray-100'>{status}</Badge>
    }
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

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = !searchTerm || transaction.orderId?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDate = !dateFilter || formatDate(transaction.createdAt).includes(dateFilter)
    return matchesSearch && matchesDate
  })

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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  }

  const cardHoverVariants = {
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2
      }
    }
  }

  const handleUpdateInfo = () => {
    if (userInfo) {
      setBankForm({
        bankName: userInfo.toBin || '',
        accountNumber: userInfo.bankAccount || ''
      })
    }
    setShowUpdateBankModal(true)
  }

  const handleSubmitBankInfo = async () => {
    if (!user?.userId) {
      toast.error('Không tìm thấy thông tin người dùng')
      return
    }

    if (!bankForm.bankName.trim() || !bankForm.accountNumber.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin ngân hàng')
      return
    }

    setUpdating(true)
    try {
      await updateUser(user.userId, {
        toBin: bankForm.bankName.trim(),
        bankAccount: bankForm.accountNumber.trim()
      })
      toast.success('Cập nhật thông tin ngân hàng thành công')
      setShowUpdateBankModal(false)
      // Refresh user info
      const userData = await getUserById(user.userId)
      setUserInfo(userData)
    } catch (error: unknown) {
      console.error('Error updating bank info:', error)
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(errorMessage || 'Có lỗi xảy ra khi cập nhật thông tin')
    } finally {
      setUpdating(false)
    }
  }

  // Format account number to show only last 4 digits
  const formatAccountNumber = (accountNumber: string | null) => {
    if (!accountNumber) return 'Chưa cập nhật'
    if (accountNumber.length <= 4) return accountNumber
    return `**** **** **** ${accountNumber.slice(-4)}`
  }

  // Get account holder name
  const getAccountHolderName = () => {
    if (!userInfo) return 'Chưa cập nhật'
    if (userInfo.firstName && userInfo.lastName) {
      return `${userInfo.firstName} ${userInfo.lastName}`
    }
    return userInfo.email || 'Chưa cập nhật'
  }

  // Handle withdraw request
  const handleWithdrawClick = () => {
    // Check if user has bank info
    if (!userInfo?.toBin || !userInfo?.bankAccount) {
      toast.error('Vui lòng cập nhật thông tin ngân hàng trước khi rút tiền')
      setShowUpdateBankModal(true)
      return
    }

    setShowWithdrawModal(true)
  }

  const handleSubmitWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ')
      return
    }

    const amount = parseFloat(withdrawAmount)
    const minAmount = 50000

    if (amount > walletDataDisplay.availableBalance) {
      toast.error(
        `Số tiền rút không được vượt quá số dư khả dụng (${walletDataDisplay.availableBalance.toLocaleString()} ₫)`
      )
      return
    }

    if (amount < minAmount) {
      toast.error(`Số tiền rút tối thiểu là ${minAmount.toLocaleString()} ₫`)
      return
    }

    // Check if user has bank info
    if (!userInfo?.toBin || !userInfo?.bankAccount) {
      toast.error('Vui lòng cập nhật thông tin ngân hàng trước khi rút tiền')
      setShowWithdrawModal(false)
      setShowUpdateBankModal(true)
      return
    }

    setSubmittingWithdraw(true)
    try {
      await withdrawal(amount)
      const isSeller = user?.roleName === 'Seller'
      const isCustomer = user?.roleName === 'Customer'

      if (isCustomer) {
        toast.success(
          `Rút tiền ${amount.toLocaleString()} ₫ thành công! Số tiền đã được chuyển vào tài khoản ngân hàng của bạn.`
        )
      } else if (isSeller) {
        toast.success(
          `Yêu cầu rút tiền ${amount.toLocaleString()} ₫ đã được gửi thành công! Yêu cầu của bạn đang chờ được duyệt.`
        )
      } else {
        toast.success(`Yêu cầu rút tiền ${amount.toLocaleString()} ₫ đã được gửi thành công!`)
      }

      setShowWithdrawModal(false)
      setWithdrawAmount('')
      // Refresh wallet balance after withdrawal request
      await fetchWalletBalance()
      await fetchWalletTransactions(1)
    } catch (error: unknown) {
      console.error('Error submitting withdrawal request:', error)
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(errorMessage || 'Có lỗi xảy ra khi gửi yêu cầu rút tiền')
    } finally {
      setSubmittingWithdraw(false)
    }
  }

  const handleCloseWithdrawModal = () => {
    setShowWithdrawModal(false)
    setWithdrawAmount('')
  }

  // Handle deposit
  const handleDepositClick = () => {
    setShowDepositModal(true)
  }

  const handleSubmitDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ')
      return
    }

    const amount = parseFloat(depositAmount)
    const minAmount = 10000

    if (amount < minAmount) {
      toast.error(`Số tiền nạp tối thiểu là ${minAmount.toLocaleString()} ₫`)
      return
    }

    setSubmittingDeposit(true)
    try {
      const response = await depositMoney(amount)
      toast.success(response.message || `Nạp tiền thành công ${amount.toLocaleString()} ₫`)
      setShowDepositModal(false)
      setDepositAmount('')
      // Refresh wallet balance after deposit
      await fetchWalletBalance()
      await fetchWalletTransactions(1)
    } catch (error: unknown) {
      console.error('Error depositing money:', error)
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(errorMessage || 'Có lỗi xảy ra khi nạp tiền')
    } finally {
      setSubmittingDeposit(false)
    }
  }

  const handleCloseDepositModal = () => {
    setShowDepositModal(false)
    setDepositAmount('')
  }

  // Handle pay debt
  const handlePayDebtClick = () => {
    if (walletDataDisplay.debtBalance <= 0) {
      toast.info('Bạn không có khoản nợ nào cần trả')
      return
    }
    setShowPayDebtModal(true)
  }

  const handleSubmitPayDebt = async () => {
    if (!payDebtAmount || parseFloat(payDebtAmount) <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ')
      return
    }

    const amount = parseFloat(payDebtAmount)
    const minAmount = 1000

    if (amount < minAmount) {
      toast.error(`Số tiền trả nợ tối thiểu là ${minAmount.toLocaleString()} ₫`)
      return
    }

    if (amount > walletDataDisplay.debtBalance) {
      toast.error(
        `Số tiền trả không được vượt quá số nợ hiện tại (${walletDataDisplay.debtBalance.toLocaleString()} ₫)`
      )
      return
    }

    if (amount > walletDataDisplay.availableBalance) {
      toast.error(
        `Số tiền trả không được vượt quá số dư khả dụng (${walletDataDisplay.availableBalance.toLocaleString()} ₫)`
      )
      return
    }

    setSubmittingPayDebt(true)
    try {
      const response = await payDebt(amount)
      toast.success(response.message || `Trả nợ thành công ${amount.toLocaleString()} ₫`)
      setShowPayDebtModal(false)
      setPayDebtAmount('')
      // Refresh wallet balance after paying debt
      await fetchWalletBalance()
      await fetchWalletTransactions(1)
    } catch (error: unknown) {
      console.error('Error paying debt:', error)
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(errorMessage || 'Có lỗi xảy ra khi trả nợ')
    } finally {
      setSubmittingPayDebt(false)
    }
  }

  const handleClosePayDebtModal = () => {
    setShowPayDebtModal(false)
    setPayDebtAmount('')
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

      {/* 1. Số dư hiện tại (Real-time) */}
      <motion.div className='mb-6 sm:mb-8' variants={containerVariants} initial='hidden' animate='visible'>
        <h2 className='text-lg sm:text-xl font-semibold text-gray-900 mb-4'>Số dư hiện tại</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
          {/* Available Balance */}
          <motion.div variants={itemVariants}>
            <motion.div variants={cardHoverVariants} whileHover='hover'>
              <Card className='relative overflow-hidden h-full'>
                <CardContent className='p-4 sm:p-6'>
                  <div className='flex justify-between items-start'>
                    <div className='flex-1'>
                      <h3 className='text-xs sm:text-sm font-medium text-gray-600 mb-2'>Số dư khả dụng</h3>
                      <motion.p
                        className='text-2xl sm:text-3xl font-bold text-green-600'
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        key={walletDataDisplay.availableBalance}
                      >
                        {walletDataDisplay.availableBalance.toLocaleString()} ₫
                      </motion.p>
                      <p className='text-xs text-gray-500 mt-2'>Có thể rút ngay bây giờ</p>
                      <div className='mt-4 flex gap-2'>
                        <Button
                          onClick={handleDepositClick}
                          className='flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base'
                        >
                          <Plus className='w-4 h-4 mr-2' />
                          Nạp tiền
                        </Button>
                        <Button
                          onClick={handleWithdrawClick}
                          className='flex-1 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base'
                          disabled={walletDataDisplay.availableBalance <= 0}
                        >
                          <DollarSign className='w-4 h-4 mr-2' />
                          Rút tiền
                        </Button>
                      </div>
                    </div>
                    <div className='w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                      <Wallet className='w-5 h-5 sm:w-6 sm:h-6 text-green-600' />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Pending Balance */}
          <motion.div variants={itemVariants}>
            <motion.div variants={cardHoverVariants} whileHover='hover'>
              <Card className='relative overflow-hidden h-full'>
                <CardContent className='p-4 sm:p-6'>
                  <div className='flex justify-between items-start'>
                    <div className='flex-1'>
                      <h3 className='text-xs sm:text-sm font-medium text-gray-600 mb-2'>Số dư chờ</h3>
                      <motion.p
                        className='text-2xl sm:text-3xl font-bold text-blue-600'
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                        key={walletDataDisplay.pendingBalance}
                      >
                        {walletDataDisplay.pendingBalance.toLocaleString()} ₫
                      </motion.p>
                      <p className='text-xs text-gray-500 mt-2'>Từ Banking chưa delivered</p>
                    </div>
                    <div className='w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                      <Clock className='w-5 h-5 sm:w-6 sm:h-6 text-blue-600' />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Debt Balance */}
          <motion.div variants={itemVariants} className='sm:col-span-2 lg:col-span-1'>
            <motion.div variants={cardHoverVariants} whileHover='hover'>
              <Card className='relative overflow-hidden h-full'>
                <CardContent className='p-4 sm:p-6'>
                  <div className='flex justify-between items-start'>
                    <div className='flex-1'>
                      <h3 className='text-xs sm:text-sm font-medium text-gray-600 mb-2'>Số tiền nợ</h3>
                      <motion.p
                        className='text-2xl sm:text-3xl font-bold text-red-600'
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                        key={walletDataDisplay.debtBalance}
                      >
                        {walletDataDisplay.debtBalance.toLocaleString()} ₫
                      </motion.p>
                      <p className='text-xs text-gray-500 mt-2'>Hoa hồng COD chưa trả</p>
                      {walletDataDisplay.debtBalance > 0 && (
                        <Button
                          onClick={handlePayDebtClick}
                          className='mt-4 bg-red-600 hover:bg-red-700 text-white w-full text-sm sm:text-base'
                          disabled={walletDataDisplay.availableBalance <= 0}
                        >
                          <CreditCard className='w-4 h-4 mr-2' />
                          Trả nợ
                        </Button>
                      )}
                    </div>
                    <div className='w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                      <AlertCircle className='w-5 h-5 sm:w-6 sm:h-6 text-red-600' />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* 2. Thống kê lịch sử (Cumulative) */}
      <motion.div className='mb-6 sm:mb-8' variants={containerVariants} initial='hidden' animate='visible'>
        <h2 className='text-lg sm:text-xl font-semibold text-gray-900 mb-4'>Thống kê lịch sử</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'>
          {/* Total Revenue */}
          <motion.div variants={itemVariants}>
            <motion.div variants={cardHoverVariants} whileHover='hover'>
              <Card className='relative overflow-hidden h-full'>
                <CardContent className='p-4 sm:p-6'>
                  <div className='flex justify-between items-start'>
                    <div className='flex-1'>
                      <h3 className='text-xs sm:text-sm font-medium text-gray-600 mb-2'>Tổng doanh thu</h3>
                      <motion.p
                        className='text-2xl sm:text-3xl font-bold text-green-600'
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        key={walletDataDisplay.grossRevenue}
                      >
                        {walletDataDisplay.grossRevenue.toLocaleString()} ₫
                      </motion.p>
                      <p className='text-xs text-gray-500 mt-2'>Tổng bán được (chưa trừ gì)</p>
                    </div>
                    <div className='w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                      <TrendingUp className='w-5 h-5 sm:w-6 sm:h-6 text-green-600' />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Total Commission Paid */}
          <motion.div variants={itemVariants}>
            <motion.div variants={cardHoverVariants} whileHover='hover'>
              <Card className='relative overflow-hidden h-full'>
                <CardContent className='p-4 sm:p-6'>
                  <div className='flex justify-between items-start'>
                    <div className='flex-1'>
                      <h3 className='text-xs sm:text-sm font-medium text-gray-600 mb-2'>Tổng hoa hồng đã trả</h3>
                      <motion.p
                        className='text-2xl sm:text-3xl font-bold text-purple-600'
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                        key={walletDataDisplay.totalCommissionPaid}
                      >
                        {walletDataDisplay.totalCommissionPaid.toLocaleString()} ₫
                      </motion.p>
                      <p className='text-xs text-gray-500 mt-2'>Tổng hoa hồng đã thanh toán</p>
                    </div>
                    <div className='w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                      <Receipt className='w-5 h-5 sm:w-6 sm:h-6 text-purple-600' />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* 3. Derived (Tính toán) */}
      <motion.div className='mb-6 sm:mb-8' variants={containerVariants} initial='hidden' animate='visible'>
        <div className='flex items-center gap-2 mb-4'>
          <h2 className='text-lg sm:text-xl font-semibold text-gray-900'>Thống kê tính toán</h2>
          <button
            onClick={() => setShowFormulaModal(true)}
            className='p-1 hover:bg-gray-100 rounded-full transition-colors'
            aria-label='Xem công thức tính toán'
          >
            <Info className='w-4 h-4 text-blue-600 hover:text-blue-800' />
          </button>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'>
          {/* Net Income */}
          <motion.div variants={itemVariants}>
            <motion.div variants={cardHoverVariants} whileHover='hover'>
              <Card className='relative overflow-hidden border-2 border-blue-200 h-full'>
                <CardContent className='p-4'>
                  <div className='flex justify-between items-start'>
                    <div className='flex-1'>
                      <h3 className='text-xs font-medium text-gray-600 mb-1'>Thu nhập ròng</h3>
                      <motion.p
                        className='text-xl sm:text-2xl font-bold text-blue-600'
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        key={netIncome}
                      >
                        {netIncome.toLocaleString()} ₫
                      </motion.p>
                      <p className='text-xs text-gray-500 mt-1'>= Tổng doanh thu - Tổng hoa hồng đã trả</p>
                    </div>
                    <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                      <DollarSign className='w-5 h-5 text-blue-600' />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Transaction History */}
      <motion.div variants={containerVariants} initial='hidden' animate='visible'>
        <Card className='mb-6 sm:mb-8'>
          <CardContent className='p-4 sm:p-6'>
            <div className='flex items-center justify-between mb-4 sm:mb-6'>
              <h2 className='text-lg sm:text-xl font-semibold text-gray-900'>Lịch sử giao dịch</h2>
            </div>

            {/* Filters */}
            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6'>
              <div className='relative w-full sm:w-auto'>
                <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <Input
                  type='date'
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className='pl-10 w-full sm:w-48'
                  placeholder='mm/dd/yyyy'
                />
              </div>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <Input
                  placeholder='Tìm kiếm mã đơn hàng...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            {/* Transaction Table */}
            {loadingTransactions ? (
              <div className='flex justify-center items-center py-12'>
                <Loading />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className='text-center py-12 text-gray-500'>
                <p>Không có giao dịch nào</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className='hidden md:block overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b border-gray-200'>
                        <th className='text-left py-3 px-4 font-medium text-gray-700 text-sm'>Mã đơn hàng</th>
                        <th className='text-left py-3 px-4 font-medium text-gray-700 text-sm'>Ngày</th>
                        <th className='text-left py-3 px-4 font-medium text-gray-700 text-sm'>Loại</th>
                        <th className='text-left py-3 px-4 font-medium text-gray-700 text-sm'>Số tiền</th>
                        <th className='text-left py-3 px-4 font-medium text-gray-700 text-sm'>Số dư sau</th>
                        <th className='text-left py-3 px-4 font-medium text-gray-700 text-sm'>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {filteredTransactions.map((transaction, index) => (
                          <motion.tr
                            key={transaction.id}
                            className='border-b border-gray-100 hover:bg-gray-50'
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <td className='py-4 px-4 text-gray-900 font-medium text-sm'>
                              {transaction.orderId ? `#${transaction.orderId}` : 'N/A'}
                            </td>
                            <td className='py-4 px-4 text-gray-700 text-sm'>{formatDate(transaction.createdAt)}</td>
                            <td className='py-4 px-4 text-gray-700 text-sm'>{transaction.type || 'N/A'}</td>
                            <td className='py-4 px-4 text-gray-900 font-medium text-sm'>
                              {transaction.amount.toLocaleString()} ₫
                            </td>
                            <td className='py-4 px-4 text-gray-700 text-sm'>
                              {transaction.balanceAfter.toLocaleString()} ₫
                            </td>
                            <td className='py-4 px-4'>{getStatusBadge(transaction.status)}</td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className='md:hidden space-y-4'>
                  <AnimatePresence>
                    {filteredTransactions.map((transaction, index) => (
                      <motion.div
                        key={transaction.id}
                        variants={itemVariants}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className='hover:shadow-md transition-shadow'>
                          <CardContent className='p-4'>
                            <div className='space-y-3'>
                              <div className='flex justify-between items-start'>
                                <div>
                                  <p className='text-xs text-gray-500'>Mã đơn hàng</p>
                                  <p className='font-medium text-gray-900'>
                                    {transaction.orderId ? `#${transaction.orderId}` : 'N/A'}
                                  </p>
                                </div>
                                {getStatusBadge(transaction.status)}
                              </div>
                              <div className='grid grid-cols-2 gap-3'>
                                <div>
                                  <p className='text-xs text-gray-500'>Ngày</p>
                                  <p className='text-sm text-gray-700'>{formatDate(transaction.createdAt)}</p>
                                </div>
                                <div>
                                  <p className='text-xs text-gray-500'>Loại</p>
                                  <p className='text-sm text-gray-700'>{transaction.type || 'N/A'}</p>
                                </div>
                              </div>
                              <div className='grid grid-cols-2 gap-3 pt-2 border-t'>
                                <div>
                                  <p className='text-xs text-gray-500'>Số tiền</p>
                                  <p className='text-sm font-medium text-gray-900'>
                                    {transaction.amount.toLocaleString()} ₫
                                  </p>
                                </div>
                                <div>
                                  <p className='text-xs text-gray-500'>Số dư sau</p>
                                  <p className='text-sm font-medium text-green-600'>
                                    {transaction.balanceAfter.toLocaleString()} ₫
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Information */}
      <motion.div variants={itemVariants} initial='hidden' animate='visible'>
        <Card>
          <CardContent className='p-4 sm:p-6'>
            <h2 className='text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6'>Thông tin thanh toán</h2>

            {loadingUserInfo ? (
              <div className='flex justify-center items-center py-12'>
                <div className='text-gray-500'>Đang tải thông tin...</div>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                {/* Bank Details */}
                <div className='space-y-6'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center'>
                      <Building2 className='w-5 h-5 text-gray-600' />
                    </div>
                    <div>
                      <p className='text-sm text-gray-600'>Ngân hàng</p>
                      <p className='font-medium text-gray-900'>{userInfo?.toBin || 'Chưa cập nhật'}</p>
                    </div>
                  </div>

                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center'>
                      <CreditCard className='w-5 h-5 text-gray-600' />
                    </div>
                    <div>
                      <p className='text-sm text-gray-600'>Số tài khoản</p>
                      <p className='font-medium text-gray-900'>{formatAccountNumber(userInfo?.bankAccount || null)}</p>
                    </div>
                  </div>

                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center'>
                      <User className='w-5 h-5 text-gray-600' />
                    </div>
                    <div>
                      <p className='text-sm text-gray-600'>Tên chủ tài khoản</p>
                      <p className='font-medium text-gray-900'>{getAccountHolderName()}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='flex flex-col gap-4'>
                  <Button onClick={handleUpdateInfo} className='bg-green-600 hover:bg-green-700 text-white'>
                    <Edit className='w-4 h-4 mr-2' />
                    {userInfo?.toBin && userInfo?.bankAccount ? 'Cập nhật thông tin' : 'Thêm thông tin ngân hàng'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Formula Modal */}
      <Dialog open={showFormulaModal} onOpenChange={setShowFormulaModal}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Công thức tính toán</DialogTitle>
            <DialogDescription>Chi tiết cách tính các chỉ số tài chính</DialogDescription>
          </DialogHeader>
          <div className='space-y-6 mt-4'>
            {/* Net Income Formula */}
            <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
              <h3 className='font-semibold text-blue-900 mb-3 flex items-center gap-2'>
                <DollarSign className='w-5 h-5' />
                Thu nhập ròng (Net Income)
              </h3>
              <div className='space-y-2 text-sm'>
                <div className='flex items-center gap-2'>
                  <span className='font-medium text-gray-700'>Công thức:</span>
                  <code className='bg-white px-2 py-1 rounded border border-blue-300 text-blue-700'>
                    Thu nhập ròng = Tổng doanh thu - Tổng hoa hồng đã trả
                  </code>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='font-medium text-gray-700'>Tính toán:</span>
                  <span className='text-gray-600'>
                    {walletDataDisplay.grossRevenue.toLocaleString()} ₫ -{' '}
                    {walletDataDisplay.totalCommissionPaid.toLocaleString()} ₫ ={' '}
                    <span className='font-bold text-blue-600'>{netIncome.toLocaleString()} ₫</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Current Balance Info */}
            <div className='bg-gray-50 p-4 rounded-lg border border-gray-200'>
              <h3 className='font-semibold text-gray-900 mb-3'>Số dư hiện tại</h3>
              <div className='space-y-2 text-sm text-gray-600'>
                <div className='flex justify-between'>
                  <span>Số dư khả dụng:</span>
                  <span className='font-medium'>{walletDataDisplay.availableBalance.toLocaleString()} ₫</span>
                </div>
                <div className='flex justify-between'>
                  <span>Số dư chờ:</span>
                  <span className='font-medium'>{walletDataDisplay.pendingBalance.toLocaleString()} ₫</span>
                </div>
                <div className='flex justify-between'>
                  <span>Số tiền nợ:</span>
                  <span className='font-medium text-red-600'>{walletDataDisplay.debtBalance.toLocaleString()} ₫</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Bank Info Modal */}
      <Dialog open={showUpdateBankModal} onOpenChange={setShowUpdateBankModal}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Cập nhật thông tin ngân hàng</DialogTitle>
            <DialogDescription>Nhập thông tin ngân hàng để nhận thanh toán</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 mt-4'>
            <div>
              <label className='text-sm font-medium text-gray-700 mb-2 block'>Tên ngân hàng</label>
              <Input
                placeholder='Ví dụ: Vietcombank, BIDV, Techcombank...'
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                className='w-full'
              />
            </div>
            <div>
              <label className='text-sm font-medium text-gray-700 mb-2 block'>Số tài khoản</label>
              <Input
                placeholder='Nhập số tài khoản ngân hàng'
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                className='w-full'
                type='text'
              />
            </div>
            <div className='flex gap-3 pt-4'>
              <Button
                variant='outline'
                onClick={() => setShowUpdateBankModal(false)}
                className='flex-1'
                disabled={updating}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmitBankInfo}
                className='flex-1 bg-green-600 hover:bg-green-700'
                disabled={updating}
              >
                {updating ? 'Đang cập nhật...' : 'Cập nhật'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Money Modal */}
      <Dialog open={showWithdrawModal} onOpenChange={handleCloseWithdrawModal}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Yêu cầu rút tiền</DialogTitle>
            <DialogDescription>
              {user?.roleName === 'Seller'
                ? 'Nhập số tiền bạn muốn rút. Yêu cầu của bạn sẽ cần được duyệt trước khi chuyển tiền.'
                : 'Nhập số tiền bạn muốn rút về tài khoản ngân hàng của bạn'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 mt-4'>
            {/* Bank Info Summary */}
            <div className='bg-gray-50 p-4 rounded-lg border border-gray-200'>
              <h4 className='text-sm font-semibold text-gray-900 mb-2'>Thông tin nhận tiền</h4>
              <div className='space-y-1 text-sm text-gray-600'>
                <div className='flex justify-between'>
                  <span>Ngân hàng:</span>
                  <span className='font-medium'>{userInfo?.toBin || 'Chưa cập nhật'}</span>
                </div>
                <div className='flex justify-between'>
                  <span>Số tài khoản:</span>
                  <span className='font-medium'>{formatAccountNumber(userInfo?.bankAccount || null)}</span>
                </div>
                <div className='flex justify-between'>
                  <span>Tên chủ tài khoản:</span>
                  <span className='font-medium'>{getAccountHolderName()}</span>
                </div>
              </div>
            </div>
            {/* Available Balance */}
            <div className='bg-green-50 p-4 rounded-lg border border-green-200'>
              <div className='flex justify-between items-center'>
                <span className='text-sm font-medium text-gray-700'>Số dư khả dụng:</span>
                <span className='text-lg font-bold text-green-600'>
                  {walletDataDisplay.availableBalance.toLocaleString()} ₫
                </span>
              </div>
            </div>
            {/* Amount Input */}
            <div>
              <label className='text-sm font-medium text-gray-700 mb-2 block'>Số tiền muốn rút (₫)</label>
              <Input
                type='number'
                placeholder='Nhập số tiền...'
                value={withdrawAmount}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                    setWithdrawAmount(value)
                  }
                }}
                className='w-full text-lg'
                min='50000'
                max={walletDataDisplay.availableBalance}
              />
              <p className='text-xs text-gray-500 mt-1'>
                Số tiền tối thiểu: 50,000 ₫ | Số tiền tối đa: {walletDataDisplay.availableBalance.toLocaleString()} ₫
              </p>
            </div>
            {/* Quick Amount Buttons */}
            <div>
              <label className='text-sm font-medium text-gray-700 mb-2 block'>Chọn nhanh:</label>
              <div className='grid grid-cols-3 gap-2'>
                {[50000, 100000, 500000].map((amount) => (
                  <Button
                    key={amount}
                    variant='outline'
                    onClick={() => setWithdrawAmount(amount.toString())}
                    className='text-xs'
                    disabled={amount > walletDataDisplay.availableBalance}
                  >
                    {amount.toLocaleString()} ₫
                  </Button>
                ))}
              </div>
              <Button
                variant='outline'
                onClick={() => setWithdrawAmount(walletDataDisplay.availableBalance.toString())}
                className='w-full mt-2 text-sm'
              >
                Rút toàn bộ
              </Button>
            </div>
            {/* Withdraw Amount Preview */}
            {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
              <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium text-gray-700'>Số tiền sẽ rút:</span>
                  <span className='text-xl font-bold text-blue-600'>
                    {parseFloat(withdrawAmount).toLocaleString()} ₫
                  </span>
                </div>
              </div>
            )}
            Z {/* Info Notice */}
            <div className='bg-gray-50 p-3 rounded-lg border border-gray-200'>
              <div className='flex items-start gap-2'>
                <Info className='w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0' />
                <div className='text-xs text-gray-700'>
                  {user?.roleName === 'Seller' ? (
                    <>
                      <strong>Lưu ý:</strong> Yêu cầu rút tiền của bạn cần được duyệt bởi quản trị viên trước khi số
                      tiền được chuyển vào tài khoản ngân hàng. Thời gian xử lý: 3-5 ngày làm việc.
                    </>
                  ) : (
                    <>
                      <strong>Lưu ý:</strong> Số tiền sẽ được chuyển trực tiếp vào tài khoản ngân hàng của bạn. Thời
                      gian xử lý: 1-2 ngày làm việc.
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* Action Buttons */}
            <div className='flex gap-3 pt-4'>
              <Button
                variant='outline'
                onClick={handleCloseWithdrawModal}
                className='flex-1'
                disabled={submittingWithdraw}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmitWithdraw}
                className='flex-1 bg-green-600 hover:bg-green-700'
                disabled={submittingWithdraw || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
              >
                {submittingWithdraw ? 'Đang xử lý...' : 'Xác nhận rút tiền'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deposit Money Modal */}
      <Dialog open={showDepositModal} onOpenChange={handleCloseDepositModal}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Nạp tiền vào tài khoản</DialogTitle>
            <DialogDescription>Nhập số tiền bạn muốn nạp vào ví của bạn</DialogDescription>
          </DialogHeader>
          <motion.div
            className='space-y-4 mt-4'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Current Balance Info */}
            <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
              <div className='flex justify-between items-center'>
                <span className='text-sm font-medium text-gray-700'>Số dư hiện tại:</span>
                <span className='text-lg font-bold text-blue-600'>
                  {walletDataDisplay.availableBalance.toLocaleString()} ₫
                </span>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className='text-sm font-medium text-gray-700 mb-2 block'>Số tiền muốn nạp (₫)</label>
              <Input
                type='number'
                placeholder='Nhập số tiền...'
                value={depositAmount}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                    setDepositAmount(value)
                  }
                }}
                className='w-full text-lg'
                min='10000'
              />
              <p className='text-xs text-gray-500 mt-1'>Số tiền tối thiểu: 10,000 ₫</p>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <label className='text-sm font-medium text-gray-700 mb-2 block'>Chọn nhanh:</label>
              <div className='grid grid-cols-3 gap-2'>
                {[100000, 500000, 1000000].map((amount) => (
                  <Button
                    key={amount}
                    variant='outline'
                    onClick={() => setDepositAmount(amount.toString())}
                    className='text-xs'
                  >
                    {amount.toLocaleString()} ₫
                  </Button>
                ))}
              </div>
              <div className='grid grid-cols-2 gap-2 mt-2'>
                {[2000000, 5000000].map((amount) => (
                  <Button
                    key={amount}
                    variant='outline'
                    onClick={() => setDepositAmount(amount.toString())}
                    className='text-xs'
                  >
                    {amount.toLocaleString()} ₫
                  </Button>
                ))}
              </div>
            </div>

            {/* Deposit Amount Preview */}
            {depositAmount && parseFloat(depositAmount) > 0 && (
              <motion.div
                className='bg-green-50 p-4 rounded-lg border border-green-200'
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium text-gray-700'>Số tiền sẽ nạp:</span>
                  <span className='text-xl font-bold text-green-600'>
                    {parseFloat(depositAmount).toLocaleString()} ₫
                  </span>
                </div>
                <div className='mt-2 pt-2 border-t border-green-200'>
                  <div className='flex justify-between items-center text-xs'>
                    <span className='text-gray-600'>Số dư sau khi nạp:</span>
                    <span className='font-semibold text-green-700'>
                      {(walletDataDisplay.availableBalance + parseFloat(depositAmount)).toLocaleString()} ₫
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Info Notice */}
            <div className='bg-yellow-50 p-3 rounded-lg border border-yellow-200'>
              <div className='flex items-start gap-2'>
                <Info className='w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0' />
                <p className='text-xs text-yellow-800'>
                  <strong>Lưu ý:</strong> Số tiền sẽ được nạp trực tiếp vào tài khoản của bạn. Trong tương lai sẽ có
                  tích hợp PayOS để thanh toán.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-3 pt-4'>
              <Button
                variant='outline'
                onClick={handleCloseDepositModal}
                className='flex-1'
                disabled={submittingDeposit}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmitDeposit}
                className='flex-1 bg-blue-600 hover:bg-blue-700'
                disabled={submittingDeposit || !depositAmount || parseFloat(depositAmount) <= 0}
              >
                {submittingDeposit ? (
                  <>
                    <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <ArrowDownCircle className='w-4 h-4 mr-2' />
                    Xác nhận nạp tiền
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Pay Debt Modal */}
      <Dialog open={showPayDebtModal} onOpenChange={handleClosePayDebtModal}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Trả nợ</DialogTitle>
            <DialogDescription>Nhập số tiền bạn muốn trả để giảm số nợ hiện tại</DialogDescription>
          </DialogHeader>
          <motion.div
            className='space-y-4 mt-4'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Current Debt Info */}
            <div className='bg-red-50 p-4 rounded-lg border border-red-200'>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-sm font-medium text-gray-700'>Số nợ hiện tại:</span>
                <span className='text-lg font-bold text-red-600'>
                  {walletDataDisplay.debtBalance.toLocaleString()} ₫
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm font-medium text-gray-700'>Số dư khả dụng:</span>
                <span className='text-sm font-semibold text-green-600'>
                  {walletDataDisplay.availableBalance.toLocaleString()} ₫
                </span>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className='text-sm font-medium text-gray-700 mb-2 block'>Số tiền muốn trả (₫)</label>
              <Input
                type='number'
                placeholder='Nhập số tiền...'
                value={payDebtAmount}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                    setPayDebtAmount(value)
                  }
                }}
                className='w-full text-lg'
                min='1000'
                max={Math.min(walletDataDisplay.debtBalance, walletDataDisplay.availableBalance)}
              />
              <p className='text-xs text-gray-500 mt-1'>
                Số tiền tối thiểu: 1,000 ₫ | Tối đa:{' '}
                {Math.min(walletDataDisplay.debtBalance, walletDataDisplay.availableBalance).toLocaleString()} ₫
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <label className='text-sm font-medium text-gray-700 mb-2 block'>Chọn nhanh:</label>
              <div className='grid grid-cols-3 gap-2'>
                {[
                  Math.min(10000, walletDataDisplay.debtBalance, walletDataDisplay.availableBalance),
                  Math.min(50000, walletDataDisplay.debtBalance, walletDataDisplay.availableBalance),
                  Math.min(100000, walletDataDisplay.debtBalance, walletDataDisplay.availableBalance)
                ]
                  .filter((amount) => amount >= 1000)
                  .map((amount) => (
                    <Button
                      key={amount}
                      variant='outline'
                      onClick={() => setPayDebtAmount(amount.toString())}
                      className='text-xs'
                      disabled={amount > walletDataDisplay.availableBalance || amount > walletDataDisplay.debtBalance}
                    >
                      {amount.toLocaleString()} ₫
                    </Button>
                  ))}
              </div>
              <Button
                variant='outline'
                onClick={() =>
                  setPayDebtAmount(
                    Math.min(walletDataDisplay.debtBalance, walletDataDisplay.availableBalance).toString()
                  )
                }
                className='w-full mt-2 text-sm'
                disabled={walletDataDisplay.debtBalance <= 0 || walletDataDisplay.availableBalance <= 0}
              >
                Trả toàn bộ nợ
              </Button>
            </div>

            {/* Pay Debt Amount Preview */}
            {payDebtAmount && parseFloat(payDebtAmount) > 0 && (
              <motion.div
                className='bg-orange-50 p-4 rounded-lg border border-orange-200'
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className='flex justify-between items-center mb-2'>
                  <span className='text-sm font-medium text-gray-700'>Số tiền sẽ trả:</span>
                  <span className='text-xl font-bold text-orange-600'>
                    {parseFloat(payDebtAmount).toLocaleString()} ₫
                  </span>
                </div>
                <div className='space-y-1 pt-2 border-t border-orange-200'>
                  <div className='flex justify-between items-center text-xs'>
                    <span className='text-gray-600'>Số nợ còn lại:</span>
                    <span className='font-semibold text-red-600'>
                      {(walletDataDisplay.debtBalance - parseFloat(payDebtAmount)).toLocaleString()} ₫
                    </span>
                  </div>
                  <div className='flex justify-between items-center text-xs'>
                    <span className='text-gray-600'>Số dư sau khi trả:</span>
                    <span className='font-semibold text-green-600'>
                      {(walletDataDisplay.availableBalance - parseFloat(payDebtAmount)).toLocaleString()} ₫
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Info Notice */}
            <div className='bg-blue-50 p-3 rounded-lg border border-blue-200'>
              <div className='flex items-start gap-2'>
                <Info className='w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0' />
                <p className='text-xs text-blue-800'>
                  <strong>Lưu ý:</strong> Số tiền trả nợ sẽ được trừ từ số dư khả dụng của bạn. Bạn chỉ có thể trả tối
                  đa bằng số nợ hiện tại hoặc số dư khả dụng (tùy theo số nào nhỏ hơn).
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-3 pt-4'>
              <Button
                variant='outline'
                onClick={handleClosePayDebtModal}
                className='flex-1'
                disabled={submittingPayDebt}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmitPayDebt}
                className='flex-1 bg-red-600 hover:bg-red-700'
                disabled={
                  submittingPayDebt ||
                  !payDebtAmount ||
                  parseFloat(payDebtAmount) <= 0 ||
                  parseFloat(payDebtAmount) > walletDataDisplay.debtBalance ||
                  parseFloat(payDebtAmount) > walletDataDisplay.availableBalance
                }
              >
                {submittingPayDebt ? (
                  <>
                    <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CreditCard className='w-4 h-4 mr-2' />
                    Xác nhận trả nợ
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default FinanceManagement
