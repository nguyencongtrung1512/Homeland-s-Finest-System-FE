import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import TransactionManagementAdmin from '../transactionManager/transactionManager'
import RequestWalletMoneyManagement from '../requestWalletMoneyManagement/list'
import BalanceHistory from './balanceHistory'
import { depositMoney, withdrawal, getWalletBalance } from '../../../apis/wallet.api'
import type { WalletData } from '../../../types/walletType'
import { toast } from '../../../utils/toast'

function GiaoDich() {
  const [activeTab, setActiveTab] = useState<'payment-gateway' | 'approval' | 'balance-history'>('payment-gateway')

  // Deposit states
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositLoading, setDepositLoading] = useState(false)

  // Withdrawal states
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [withdrawalLoading, setWithdrawalLoading] = useState(false)
  const [walletData, setWalletData] = useState<WalletData | null>(null)

  // Helper function to generate quick select options based on input
  const getQuickSelectOptions = (inputValue: string): number[] => {
    const trimmedValue = inputValue.trim().replace(/[^\d]/g, '')

    // Default options when input is empty
    if (!trimmedValue || trimmedValue === '0') {
      return [50000, 200000, 500000]
    }

    const numValue = parseInt(trimmedValue, 10)
    if (isNaN(numValue) || numValue === 0) {
      return [50000, 200000, 500000]
    }

    const length = trimmedValue.length

    if (length === 1) {
      // Input: "1" → [1.000, 100.000, 1.000.000]
      return [numValue * 1000, numValue * 100000, numValue * 1000000]
    } else if (length === 2) {
      // Input: "10" → [10.000, 100.000, 1.000.000]
      return [numValue * 1000, numValue * 10000, numValue * 100000]
    } else if (length === 3) {
      // Input: "100" → [100.000, 1.000.000, 10.000.000]
      return [numValue * 1000, numValue * 10000, numValue * 100000]
    } else if (length === 4) {
      // Input: "1000" → [1.000.000, 10.000.000]
      return [numValue * 1000, numValue * 10000]
    } else if (length >= 5) {
      // Input: "10000" or more → [1.000.000, 10.000.000]
      return [1000000, 10000000]
    }

    return [50000, 200000, 500000]
  }

  // Get quick select options for current input
  const depositQuickOptions = getQuickSelectOptions(depositAmount)
  const withdrawalQuickOptions = getQuickSelectOptions(withdrawalAmount)

  // Fetch wallet info
  const fetchWalletInfo = async () => {
    try {
      const data = await getWalletBalance()
      setWalletData(data)
    } catch (err) {
      console.error('Error fetching wallet balance:', err)
    }
  }

  // Handle open withdrawal modal
  // const handleOpenWithdrawalModal = () => {
  //   setShowWithdrawalModal(true)
  //   fetchWalletInfo()
  // }

  // Handle deposit
  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount)

    if (!depositAmount || isNaN(amount) || amount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    if (amount < 10000) {
      toast.error('Số tiền nạp tối thiểu là 10,000 ₫', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    setDepositLoading(true)
    try {
      const response = await depositMoney(amount)
      toast.success(response.message || `Nạp tiền thành công: ${amount.toLocaleString('vi-VN')} ₫`, {
        position: 'top-right',
        autoClose: 3000
      })
      setShowDepositModal(false)
      setDepositAmount('')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi nạp tiền'
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      })
    } finally {
      setDepositLoading(false)
    }
  }

  // Handle withdrawal
  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount)

    if (!withdrawalAmount || isNaN(amount) || amount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    if (amount < 50000) {
      toast.error('Số tiền rút tối thiểu là 50,000 ₫', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    if (walletData && amount > walletData.availableBalance) {
      toast.error('Số tiền rút vượt quá số dư khả dụng', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    setWithdrawalLoading(true)
    try {
      await withdrawal(amount)
      toast.success(`Yêu cầu rút tiền đã được tạo thành công. Số tiền: ${amount.toLocaleString('vi-VN')} ₫`, {
        position: 'top-right',
        autoClose: 3000
      })
      setShowWithdrawalModal(false)
      setWithdrawalAmount('')
      // Refresh wallet info after withdrawal
      await fetchWalletInfo()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo yêu cầu rút tiền'
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      })
    } finally {
      setWithdrawalLoading(false)
    }
  }

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-gray-900'>Giao dịch</h1>
        <p className='text-gray-600 mt-1'>Quản lý giao dịch và phê duyệt yêu cầu rút tiền, hoàn tiền</p>
      </div>

      {/* Quick Actions */}
      {/* <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 py-2'>
            <Wallet className='w-5 h-5' />
            Thao tác nhanh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex gap-4'>
            <Button onClick={() => setShowDepositModal(true)} className='flex items-center gap-2' variant='blue'>
              <ArrowUpCircle className='w-4 h-4' />
              Nạp tiền
            </Button>
            <Button onClick={handleOpenWithdrawalModal} className='flex items-center gap-2' variant='outline'>
              <ArrowDownCircle className='w-4 h-4' />
              Rút tiền
            </Button>
          </div>
        </CardContent>
      </Card> */}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'payment-gateway' | 'approval' | 'balance-history')}
      >
        <TabsList className='bg-white shadow-sm border border-gray-200 mb-6'>
          <TabsTrigger value='payment-gateway' className='px-6 py-2'>
            Tiền vào / ra hệ thống
          </TabsTrigger>
          <TabsTrigger value='approval' className='px-6 py-2'>
            Phê Duyệt Giao Dịch
          </TabsTrigger>
          <TabsTrigger value='balance-history' className='px-6 py-2'>
            Tiền trong hệ thống
          </TabsTrigger>
        </TabsList>

        <TabsContent value='payment-gateway' className='mt-0'>
          <TransactionManagementAdmin />
        </TabsContent>

        <TabsContent value='approval' className='mt-0'>
          <RequestWalletMoneyManagement />
        </TabsContent>

        <TabsContent value='balance-history' className='mt-0'>
          <BalanceHistory />
        </TabsContent>
      </Tabs>

      {/* Deposit Modal */}
      <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <ArrowUpCircle className='w-5 h-5 text-green-600' />
              Nạp tiền vào tài khoản
            </DialogTitle>
            <DialogDescription>Nhập số tiền bạn muốn nạp vào hệ thống</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='deposit-amount'>Số tiền muốn nạp (₫)</Label>
              <Input
                id='deposit-amount'
                type='text'
                placeholder='Nhập số tiền muốn nạp'
                value={depositAmount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '')
                  setDepositAmount(value)
                }}
                className='text-lg'
              />
              <div className='flex justify-between text-sm text-gray-500'>
                <span>Số tiền tối thiểu: 10,000 ₫</span>
                <span className='text-gray-400'>Không giới hạn số tiền nạp</span>
              </div>
              {depositAmount && !isNaN(parseFloat(depositAmount)) && parseFloat(depositAmount) > 0 && (
                <p className='text-sm text-gray-500'>
                  Số tiền: {parseFloat(depositAmount).toLocaleString('vi-VN')} ₫
                </p>
              )}
            </div>

            {/* Quick Select Buttons */}
            <div className='flex flex-wrap gap-2'>
              {depositQuickOptions.map((option) => (
                <Button
                  key={option}
                  type='button'
                  variant='outline'
                  onClick={() => setDepositAmount(option.toString())}
                  className='flex-1 min-w-[100px]'
                >
                  {option.toLocaleString('vi-VN')} ₫
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowDepositModal(false)} disabled={depositLoading}>
              Hủy
            </Button>
            <Button
              onClick={handleDeposit}
              disabled={
                depositLoading ||
                !depositAmount ||
                parseFloat(depositAmount) <= 0 ||
                parseFloat(depositAmount) < 10000
              }
              variant='blue'
            >
              {depositLoading ? 'Đang xử lý...' : 'Xác nhận nạp tiền'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Modal */}
      <Dialog
        open={showWithdrawalModal}
        onOpenChange={(open) => {
          setShowWithdrawalModal(open)
          if (!open) {
            setWithdrawalAmount('')
          }
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <ArrowDownCircle className='w-5 h-5 text-orange-600' />
              Rút tiền từ tài khoản
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <p className='text-sm text-gray-600 mb-1'>
                Số dư khả dụng:{' '}
                <span className='font-semibold text-emerald-600'>
                  {walletData ? `${walletData.availableBalance.toLocaleString('vi-VN')} ₫` : '--'}
                </span>
              </p>
              <Label htmlFor='withdrawal-amount'>Số tiền muốn rút (₫)</Label>
              <Input
                id='withdrawal-amount'
                type='text'
                placeholder='Nhập số tiền muốn rút'
                value={withdrawalAmount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '')
                  setWithdrawalAmount(value)
                }}
                className='text-lg'
              />
              <div className='flex justify-between text-sm text-gray-500'>
                <span>Số tiền tối thiểu: 50,000 ₫</span>
                {walletData && (
                  <span>
                    Có thể rút tối đa:{' '}
                    <span className='font-semibold'>{walletData.availableBalance.toLocaleString('vi-VN')} ₫</span>
                  </span>
                )}
              </div>
              {withdrawalAmount && !isNaN(parseFloat(withdrawalAmount)) && parseFloat(withdrawalAmount) > 0 && (
                <p className='text-sm text-gray-500'>
                  Số tiền: {parseFloat(withdrawalAmount).toLocaleString('vi-VN')} ₫
                </p>
              )}
            </div>

            {/* Quick Select Buttons */}
            <div className='flex flex-wrap gap-2'>
              {withdrawalQuickOptions.map((option) => (
                <Button
                  key={option}
                  type='button'
                  variant='outline'
                  onClick={() => setWithdrawalAmount(option.toString())}
                  className='flex-1 min-w-[100px]'
                >
                  {option.toLocaleString('vi-VN')} ₫
                </Button>
              ))}
            </div>


          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowWithdrawalModal(false)} disabled={withdrawalLoading}>
              Hủy
            </Button>
            <Button
              onClick={handleWithdrawal}
              disabled={
                withdrawalLoading ||
                !withdrawalAmount ||
                parseFloat(withdrawalAmount) <= 0 ||
                parseFloat(withdrawalAmount) < 50000 ||
                (walletData !== null && parseFloat(withdrawalAmount) > walletData.availableBalance)
              }
              variant='blue'
            >
              {withdrawalLoading ? 'Đang xử lý...' : 'Xác nhận rút tiền'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default GiaoDich
