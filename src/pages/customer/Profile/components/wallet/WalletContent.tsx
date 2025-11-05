import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Button } from '../../../../../components/ui/button'
import { Input } from '../../../../../components/ui/input'
import { Label } from '../../../../../components/ui/label'
import { Wallet, CreditCard, AlertCircle, CheckCircle2, ArrowRight, User } from 'lucide-react'
import { Alert, AlertDescription } from '../../../../../components/ui/alert'
import ThreeDCard from '../../../../../components/ui/threed-card'

interface WalletContentProps {
  walletBalance: number
  bankAccount: string | null
  customerName?: string
  onUpdateProfile?: () => void
}

export default function WalletContent({
  walletBalance,
  bankAccount,
  customerName,
  onUpdateProfile
}: WalletContentProps) {
  const [withdrawAmount, setWithdrawAmount] = useState<string>('')
  const [isConfirming, setIsConfirming] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const handleWithdraw = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      return
    }

    const amount = parseFloat(withdrawAmount)
    if (amount > walletBalance) {
      alert('Số tiền rút không được vượt quá số dư khả dụng')
      return
    }

    if (amount < 50000) {
      alert('Số tiền rút tối thiểu là 50,000 ₫')
      return
    }

    setShowConfirmModal(true)
  }

  const handleConfirmWithdraw = () => {
    setIsConfirming(true)
    // Simulate API call
    setTimeout(() => {
      alert('Yêu cầu rút tiền đã được gửi thành công! Chúng tôi sẽ xử lý trong vòng 3-5 ngày làm việc.')
      setShowConfirmModal(false)
      setIsConfirming(false)
      setWithdrawAmount('')
    }, 1500)
  }

  const handleCancelWithdraw = () => {
    setShowConfirmModal(false)
    setIsConfirming(false)
  }

  const hasBankAccount = bankAccount && bankAccount.trim() !== ''

  // const formatNumber = (num: number) => {
  //   return num.toLocaleString('vi-VN')
  // }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>Ví của tôi</h2>
        <p className='text-sm text-gray-500'>Quản lý số dư và rút tiền về tài khoản ngân hàng</p>
      </div>

      {/* Wallet Data Card với ThreeDCard */}
      <ThreeDCard maxRotation={5} glowOpacity={0.1} shadowBlur={20} className='w-full'>
        <div className='p-8 text-white'>
          <div className='flex flex-col items-center justify-center space-y-4'>
            <div className='flex items-center gap-3 mb-2'>
              <User className='w-6 mb-3 h-6 text-green-100' />
              <h3 className='text-2xl font-semibold text-white'> Khách hàng: {customerName || 'Khách hàng'}</h3>
            </div>
            <div className='flex items-center gap-3'>
              <Wallet className='w-6 h-6 text-green-100' />
              <div className='text-center'>
                <div className='text-sm text-green-100/80 mb-1'>Số dư khả dụng</div>
                <div className='text-3xl font-bold text-white'>100.000 ₫</div>
              </div>
            </div>
          </div>
        </div>
      </ThreeDCard>

      {/* Bank Account Status */}
      {!hasBankAccount ? (
        <Alert className='border-yellow-200 bg-yellow-50'>
          <AlertCircle className='h-4 w-4 text-yellow-600' />
          <AlertDescription className='text-yellow-800'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='font-semibold mb-1'>Chưa có tài khoản ngân hàng</p>
                <p className='text-sm'>
                  Vui lòng cập nhật thông tin tài khoản ngân hàng trong phần{' '}
                  <span className='font-semibold'>Thông tin cá nhân</span> để có thể rút tiền.
                </p>
              </div>
              {onUpdateProfile && (
                <Button onClick={onUpdateProfile} className='ml-4 bg-yellow-600 hover:bg-yellow-700 text-white'>
                  Cập nhật ngay
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <Card className='border-green-200 bg-green-50'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <CheckCircle2 className='w-5 h-5 text-green-600' />
              <div className='flex-1'>
                <p className='text-sm font-semibold text-green-900'>Đã liên kết tài khoản ngân hàng</p>
                <p className='text-xs text-green-700 mt-1'>
                  Số tài khoản: <span className='font-mono font-semibold'>{bankAccount}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Withdraw Form */}
      {hasBankAccount && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CreditCard className='w-5 h-5 text-blue-600' />
              Rút tiền
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='amount'>Số tiền muốn rút (₫)</Label>
              <Input
                id='amount'
                type='number'
                placeholder='Nhập số tiền muốn rút'
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min='50000'
                max={walletBalance.toString()}
                className='text-lg'
              />
              <div className='flex justify-between text-sm text-gray-500'>
                <span>Số tiền tối thiểu: 50,000 ₫</span>
                <span>
                  Có thể rút tối đa: <span className='font-semibold'>{walletBalance.toLocaleString('vi-VN')} ₫</span>
                </span>
              </div>
            </div>

            {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
              <div className='bg-gray-50 p-4 rounded-lg space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Số tiền rút:</span>
                  <span className='font-semibold text-lg text-blue-600'>
                    {parseFloat(withdrawAmount || '0').toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Phí giao dịch:</span>
                  <span className='font-semibold'>0 ₫</span>
                </div>
                <div className='border-t pt-2 flex justify-between'>
                  <span className='font-semibold text-gray-900'>Số tiền nhận được:</span>
                  <span className='font-bold text-lg text-green-600'>
                    {parseFloat(withdrawAmount || '0').toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className='flex justify-between text-sm mt-2'>
                  <span className='text-gray-600'>Số dư còn lại:</span>
                  <span className='font-semibold'>
                    {(walletBalance - parseFloat(withdrawAmount || '0')).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleWithdraw}
              disabled={
                !withdrawAmount ||
                parseFloat(withdrawAmount) <= 0 ||
                parseFloat(withdrawAmount) > walletBalance ||
                parseFloat(withdrawAmount) < 50000 ||
                isConfirming
              }
              className='w-full bg-blue-600 hover:bg-blue-700 text-white'
            >
              {isConfirming ? 'Đang xử lý...' : 'Rút tiền'}
            </Button>

            {showConfirmModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'
                onClick={handleCancelWithdraw}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className='bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl'
                >
                  <div className='flex items-center gap-3 mb-4'>
                    <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                      <Wallet className='w-6 h-6 text-blue-600' />
                    </div>
                    <h3 className='text-xl font-bold text-gray-900'>Xác nhận rút tiền</h3>
                  </div>

                  <div className='space-y-4 mb-6'>
                    <div className='bg-gray-50 p-4 rounded-lg space-y-2'>
                      <div className='flex justify-between text-sm'>
                        <span className='text-gray-600'>Số tiền rút:</span>
                        <span className='font-semibold text-lg'>
                          {parseFloat(withdrawAmount || '0').toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-gray-600'>Tài khoản nhận:</span>
                        <span className='font-mono font-semibold'>{bankAccount}</span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-gray-600'>Thời gian xử lý:</span>
                        <span className='font-semibold'>3-5 ngày làm việc</span>
                      </div>
                    </div>
                    <p className='text-sm text-gray-500'>
                      Bạn có chắc chắn muốn rút số tiền này về tài khoản ngân hàng của bạn không?
                    </p>
                  </div>

                  <div className='flex gap-3'>
                    <Button onClick={handleCancelWithdraw} variant='outline' className='flex-1' disabled={isConfirming}>
                      Hủy
                    </Button>
                    <Button
                      onClick={handleConfirmWithdraw}
                      className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
                      disabled={isConfirming}
                    >
                      {isConfirming ? (
                        'Đang xử lý...'
                      ) : (
                        <>
                          Xác nhận
                          <ArrowRight className='w-4 h-4 ml-2' />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card className='bg-gray-50'>
        <CardContent className='p-4'>
          <h4 className='font-semibold text-gray-900 mb-2'>Lưu ý quan trọng:</h4>
          <ul className='text-sm text-gray-600 space-y-1 list-disc list-inside'>
            <li>Số tiền rút tối thiểu: 50,000 ₫</li>
            <li>Thời gian xử lý yêu cầu rút tiền: 3-5 ngày làm việc</li>
            <li>Vui lòng đảm bảo thông tin tài khoản ngân hàng chính xác</li>
            <li>Phí giao dịch: Miễn phí</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
