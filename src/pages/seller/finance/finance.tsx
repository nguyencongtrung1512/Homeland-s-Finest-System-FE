import { useState, useEffect } from 'react'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { useAuth } from '../../../contexts/auth.context'
import { getUserById, updateUser, type User as UserType } from '../../../apis/user.api'
import { toast } from '../../../utils/toast'
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
  Info
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

  // Mock data - Seller Wallet
  const walletData = {
    // 1. Số dư hiện tại (Real-time)
    availableBalance: 500000, // Có thể rút NGAY BÂY GIỜ
    pendingBalance: 1000000, // Đang chờ delivered
    debtBalance: 200000, // Nợ hoa hồng COD

    // 2. Thống kê lịch sử (Cumulative)
    totalRevenue: 10000000, // TỔNG bán được (chưa trừ gì)
    totalCommissionPaid: 1000000 // TỔNG hoa hồng đã trả
  }

  // 3. Derived (Tính toán)
  const netIncome = walletData.totalRevenue - walletData.totalCommissionPaid
  const totalWithdrawn = netIncome - (walletData.availableBalance + walletData.pendingBalance - walletData.debtBalance)

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

  const transactions = [
    {
      id: 'DH001234',
      date: '15/01/2024',
      amount: 450000,
      platformFee: 22500,
      netAmount: 427500,
      status: 'paid'
    },
    {
      id: 'DH001235',
      date: '14/01/2024',
      amount: 320000,
      platformFee: 16000,
      netAmount: 304000,
      status: 'pending'
    },
    {
      id: 'DH001236',
      date: '13/01/2024',
      amount: 680000,
      platformFee: 34000,
      netAmount: 646000,
      status: 'paid'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className='bg-green-100 text-green-800 hover:bg-green-100 border-green-200'>Đã thanh toán</Badge>
      case 'pending':
        return <Badge className='bg-yellow-100 text-orange-800 hover:bg-yellow-100 border-yellow-200'>Đang chờ</Badge>
      default:
        return <Badge className='bg-gray-100 text-gray-800 hover:bg-gray-100'>{status}</Badge>
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

    if (amount > walletData.availableBalance) {
      toast.error(`Số tiền rút không được vượt quá số dư khả dụng (${walletData.availableBalance.toLocaleString()} ₫)`)
      return
    }

    if (amount < minAmount) {
      toast.error(`Số tiền rút tối thiểu là ${minAmount.toLocaleString()} ₫`)
      return
    }

    setSubmittingWithdraw(true)
    try {
      // TODO: Gọi API để tạo yêu cầu rút tiền
      // await withdrawalApi.createWithdrawalRequest({ amount, userId: user?.userId })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast.success(
        `Yêu cầu rút tiền ${amount.toLocaleString()} ₫ đã được gửi thành công! Chúng tôi sẽ xử lý trong vòng 3-5 ngày làm việc.`
      )
      setShowWithdrawModal(false)
      setWithdrawAmount('')
      // TODO: Refresh wallet balance after withdrawal request
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

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-green-700 mb-2'>Quản lý tài chính</h1>
        <p className='text-gray-600'>Theo dõi doanh thu và quản lý tài chính của bạn</p>
      </div>

      {/* 1. Số dư hiện tại (Real-time) */}
      <div className='mb-8'>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>Số dư hiện tại</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {/* Available Balance */}
          <Card className='relative overflow-hidden'>
            <CardContent className='p-6'>
              <div className='flex justify-between items-start'>
                <div className='flex-1'>
                  <h3 className='text-sm font-medium text-gray-600 mb-2'>Số dư khả dụng</h3>
                  <p className='text-3xl font-bold text-green-600'>{walletData.availableBalance.toLocaleString()} ₫</p>
                  <p className='text-xs text-gray-500 mt-2'>Có thể rút ngay bây giờ</p>
                  <Button
                    onClick={handleWithdrawClick}
                    className='mt-4 bg-green-600 hover:bg-green-700 text-white w-full'
                    disabled={walletData.availableBalance <= 0}
                  >
                    <DollarSign className='w-4 h-4 mr-2' />
                    Rút tiền
                  </Button>
                </div>
                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                  <Wallet className='w-6 h-6 text-green-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Balance */}
          <Card className='relative overflow-hidden'>
            <CardContent className='p-6'>
              <div className='flex justify-between items-start'>
                <div>
                  <h3 className='text-sm font-medium text-gray-600 mb-2'>Số dư chờ</h3>
                  <p className='text-3xl font-bold text-blue-600'>{walletData.pendingBalance.toLocaleString()} ₫</p>
                  <p className='text-xs text-gray-500 mt-2'>Từ Banking chưa delivered</p>
                </div>
                <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                  <Clock className='w-6 h-6 text-blue-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debt Balance */}
          <Card className='relative overflow-hidden'>
            <CardContent className='p-6'>
              <div className='flex justify-between items-start'>
                <div>
                  <h3 className='text-sm font-medium text-gray-600 mb-2'>Số tiền nợ</h3>
                  <p className='text-3xl font-bold text-red-600'>{walletData.debtBalance.toLocaleString()} ₫</p>
                  <p className='text-xs text-gray-500 mt-2'>Hoa hồng COD chưa trả</p>
                </div>
                <div className='w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center'>
                  <AlertCircle className='w-6 h-6 text-red-600' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. Thống kê lịch sử (Cumulative) */}
      <div className='mb-8'>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>Thống kê lịch sử</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Total Revenue */}
          <Card className='relative overflow-hidden'>
            <CardContent className='p-6'>
              <div className='flex justify-between items-start'>
                <div>
                  <h3 className='text-sm font-medium text-gray-600 mb-2'>Tổng doanh thu</h3>
                  <p className='text-3xl font-bold text-green-600'>{walletData.totalRevenue.toLocaleString()} ₫</p>
                  <p className='text-xs text-gray-500 mt-2'>Tổng bán được (chưa trừ gì)</p>
                </div>
                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                  <TrendingUp className='w-6 h-6 text-green-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Commission Paid */}
          <Card className='relative overflow-hidden'>
            <CardContent className='p-6'>
              <div className='flex justify-between items-start'>
                <div>
                  <h3 className='text-sm font-medium text-gray-600 mb-2'>Tổng hoa hồng đã trả</h3>
                  <p className='text-3xl font-bold text-purple-600'>
                    {walletData.totalCommissionPaid.toLocaleString()} ₫
                  </p>
                  <p className='text-xs text-gray-500 mt-2'>Tổng hoa hồng đã thanh toán</p>
                </div>
                <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
                  <Receipt className='w-6 h-6 text-purple-600' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Derived (Tính toán) */}
      <div className='mb-8'>
        <div className='flex items-center gap-2 mb-4'>
          <h2 className='text-xl font-semibold text-gray-900'>Thống kê tính toán</h2>
          <button
            onClick={() => setShowFormulaModal(true)}
            className='p-1 hover:bg-gray-100 rounded-full transition-colors'
            aria-label='Xem công thức tính toán'
          >
            <Info className='w-4 h-4 text-blue-600 hover:text-blue-800' />
          </button>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Net Income */}
          <Card className='relative overflow-hidden border-2 border-blue-200'>
            <CardContent className='p-4'>
              <div className='flex justify-between items-start'>
                <div>
                  <h3 className='text-xs font-medium text-gray-600 mb-1'>Thu nhập ròng</h3>
                  <p className='text-2xl font-bold text-blue-600'>{netIncome.toLocaleString()} ₫</p>
                  <p className='text-xs text-gray-500 mt-1'>= Tổng doanh thu - Tổng hoa hồng đã trả</p>
                </div>
                <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                  <DollarSign className='w-5 h-5 text-blue-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Withdrawn */}
          <Card className='relative overflow-hidden border-2 border-orange-200'>
            <CardContent className='p-4'>
              <div className='flex justify-between items-start'>
                <div>
                  <h3 className='text-xs font-medium text-gray-600 mb-1'>Tổng đã rút</h3>
                  <p className='text-2xl font-bold text-orange-600'>{totalWithdrawn.toLocaleString()} ₫</p>
                  <p className='text-xs text-gray-500 mt-1'>
                    = Thu nhập ròng - (Số dư khả dụng + Số dư chờ - Số tiền nợ)
                  </p>
                </div>
                <div className='w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center'>
                  <PiggyBank className='w-5 h-5 text-orange-600' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction History */}
      <Card className='mb-8'>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-semibold text-gray-900'>Lịch sử giao dịch</h2>
          </div>

          {/* Filters */}
          <div className='flex gap-4 mb-6'>
            <div className='relative'>
              <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <Input
                type='date'
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className='pl-10 w-48'
                placeholder='mm/dd/yyyy'
              />
            </div>
            <div className='relative flex-1 max-w-md'>
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
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-200'>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Mã đơn hàng</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Ngày</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Số tiền</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Phí nền tảng</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Thực nhận</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className='border-b border-gray-100 hover:bg-gray-50'>
                    <td className='py-4 px-4 text-gray-900 font-medium'>#{transaction.id}</td>
                    <td className='py-4 px-4 text-gray-700'>{transaction.date}</td>
                    <td className='py-4 px-4 text-gray-900 font-medium'>{transaction.amount.toLocaleString()} ₫</td>
                    <td className='py-4 px-4 text-gray-700'>{transaction.platformFee.toLocaleString()} ₫</td>
                    <td className='py-4 px-4 text-green-600 font-medium'>{transaction.netAmount.toLocaleString()} ₫</td>
                    <td className='py-4 px-4'>{getStatusBadge(transaction.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardContent className='p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-6'>Thông tin thanh toán</h2>

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
                    {walletData.totalRevenue.toLocaleString()} ₫ - {walletData.totalCommissionPaid.toLocaleString()} ₫ ={' '}
                    <span className='font-bold text-blue-600'>{netIncome.toLocaleString()} ₫</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Total Withdrawn Formula */}
            <div className='bg-orange-50 p-4 rounded-lg border border-orange-200'>
              <h3 className='font-semibold text-orange-900 mb-3 flex items-center gap-2'>
                <PiggyBank className='w-5 h-5' />
                Tổng đã rút (Total Withdrawn)
              </h3>
              <div className='space-y-2 text-sm'>
                <div className='flex items-center gap-2'>
                  <span className='font-medium text-gray-700'>Công thức:</span>
                  <code className='bg-white px-2 py-1 rounded border border-orange-300 text-orange-700'>
                    Tổng đã rút = Thu nhập ròng - (Số dư khả dụng + Số dư chờ - Số tiền nợ)
                  </code>
                </div>
                <div className='space-y-1 text-gray-600'>
                  <div>
                    <span className='font-medium'>Bước 1:</span> Tính tổng số dư hiện tại
                    <div className='ml-4 mt-1'>
                      = {walletData.availableBalance.toLocaleString()} ₫ + {walletData.pendingBalance.toLocaleString()}{' '}
                      ₫ - {walletData.debtBalance.toLocaleString()} ₫ ={' '}
                      {(
                        walletData.availableBalance +
                        walletData.pendingBalance -
                        walletData.debtBalance
                      ).toLocaleString()}{' '}
                      ₫
                    </div>
                  </div>
                  <div>
                    <span className='font-medium'>Bước 2:</span> Tính tổng đã rút
                    <div className='ml-4 mt-1'>
                      = {netIncome.toLocaleString()} ₫ -{' '}
                      {(
                        walletData.availableBalance +
                        walletData.pendingBalance -
                        walletData.debtBalance
                      ).toLocaleString()}{' '}
                      ₫ = <span className='font-bold text-orange-600'>{totalWithdrawn.toLocaleString()} ₫</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Balance Info */}
            <div className='bg-gray-50 p-4 rounded-lg border border-gray-200'>
              <h3 className='font-semibold text-gray-900 mb-3'>Số dư hiện tại</h3>
              <div className='space-y-2 text-sm text-gray-600'>
                <div className='flex justify-between'>
                  <span>Số dư khả dụng:</span>
                  <span className='font-medium'>{walletData.availableBalance.toLocaleString()} ₫</span>
                </div>
                <div className='flex justify-between'>
                  <span>Số dư chờ:</span>
                  <span className='font-medium'>{walletData.pendingBalance.toLocaleString()} ₫</span>
                </div>
                <div className='flex justify-between'>
                  <span>Số tiền nợ:</span>
                  <span className='font-medium text-red-600'>{walletData.debtBalance.toLocaleString()} ₫</span>
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
            <DialogDescription>Nhập số tiền bạn muốn rút về tài khoản ngân hàng của bạn</DialogDescription>
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
                  {walletData.availableBalance.toLocaleString()} ₫
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
                max={walletData.availableBalance}
              />
              <p className='text-xs text-gray-500 mt-1'>
                Số tiền tối thiểu: 50,000 ₫ | Số tiền tối đa: {walletData.availableBalance.toLocaleString()} ₫
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
                    disabled={amount > walletData.availableBalance}
                  >
                    {amount.toLocaleString()} ₫
                  </Button>
                ))}
              </div>
              <Button
                variant='outline'
                onClick={() => setWithdrawAmount(walletData.availableBalance.toString())}
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
    </div>
  )
}

export default FinanceManagement
