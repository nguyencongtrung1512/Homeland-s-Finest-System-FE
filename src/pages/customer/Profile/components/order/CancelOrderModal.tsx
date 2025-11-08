import { useState } from 'react'
import { Button } from '../../../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../../../components/ui/dialog'
import { Alert, AlertDescription } from '../../../../../components/ui/alert'
import { Label } from '../../../../../components/ui/label'
import { cancelOrder } from '../../../../../apis/order.api'
import { toast } from 'react-toastify'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface CancelOrderModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  userId: string
  orderStatus?: string
  onContinuePayment?: () => Promise<void> | void
  isProcessingPayment?: boolean
}

export default function CancelOrderModal({
  isOpen,
  onClose,
  orderId,
  userId,
  orderStatus,
  onContinuePayment,
  isProcessingPayment
}: CancelOrderModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isContinuingPayment, setIsContinuingPayment] = useState(false)

  const cancelReasons = [
    'Muốn thay đổi địa chỉ giao hàng',
    'Muốn thay đổi sản phẩm trong đơn hàng (size, màu sắc, số lượng...)',
    'Thủ tục thanh toán quá rắc rối',
    'Tìm thấy giá rẻ hơn ở chỗ khác',
    'Đặt nhầm, không muốn mua nữa',
    'Khác'
  ]

  const isPendingPayment = orderStatus === 'PendingPayment'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReason) {
      toast.error('Vui lòng chọn lý do hủy đơn hàng')
      return
    }

    setIsLoading(true)
    try {
      await cancelOrder(orderId, userId, selectedReason)

      toast.success('Hủy đơn hàng thành công!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined
      })

      // Reset and close
      setSelectedReason('')
      onClose()
    } catch (error) {
      console.error('Error canceling order:', error)
      toast.error('Không thể hủy đơn hàng. Vui lòng thử lại!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setSelectedReason('')
    setIsContinuingPayment(false)
    onClose()
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && !isLoading) {
      handleCancel()
    }
  }

  const handleContinuePayment = async () => {
    if (!onContinuePayment) {
      return
    }
    try {
      setIsContinuingPayment(true)
      await onContinuePayment()
    } catch (error) {
      console.error('Error continuing payment:', error)
    } finally {
      setIsContinuingPayment(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[500px] max-h-[90vh] overflow-hidden'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            <AlertTriangle className='h-5 w-5 text-red-500' />
            Hủy đơn hàng
          </DialogTitle>
          <DialogDescription>Vui lòng chọn lý do hủy đơn hàng. Thao tác này không thể hoàn tác.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='max-h-[50vh] overflow-y-auto pr-2'>
            {/* Warning Alert */}
            <Alert variant='destructive' className='mb-6'>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                <strong>Lưu ý:</strong> Thao tác này sẽ hủy tất cả các sản phẩm có trong đơn hàng và không thể hoàn tác.
              </AlertDescription>
            </Alert>

            {isPendingPayment && (
              <Alert className='mb-4 border-orange-200 bg-orange-50 text-orange-700'>
                <AlertDescription>
                  Đơn hàng của bạn đang chờ thanh toán. Bạn có thể tiếp tục thanh toán ngay hoặc chọn lý do để hủy đơn.
                </AlertDescription>
              </Alert>
            )}

            {/* Reason Selection */}
            <div className='space-y-4'>
              <Label className='text-base font-medium'>Chọn lý do hủy đơn hàng</Label>
              <div className='space-y-3'>
                {cancelReasons.map((reason, index) => (
                  <div key={index} className='flex items-start space-x-3'>
                    <input
                      type='radio'
                      id={`reason-${index}`}
                      name='cancelReason'
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className='mt-1 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500 focus:ring-2'
                      disabled={isLoading}
                    />
                    <Label htmlFor={`reason-${index}`} className='text-sm leading-5 cursor-pointer font-normal'>
                      {reason}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className='gap-2 sm:gap-0'>
            {isPendingPayment && onContinuePayment && (
              <Button
                type='button'
                onClick={handleContinuePayment}
                disabled={isLoading || isProcessingPayment || isContinuingPayment}
                className='w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white'
              >
                {isProcessingPayment || isContinuingPayment ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Đang mở thanh toán...
                  </>
                ) : (
                  'Tiếp tục thanh toán'
                )}
              </Button>
            )}
            <Button
              type='button'
              variant='outline'
              onClick={handleCancel}
              disabled={isLoading || isProcessingPayment || isContinuingPayment}
              className='w-full sm:w-auto'
            >
              Không phải bây giờ
            </Button>
            <Button
              type='submit'
              variant='destructive'
              disabled={isLoading || !selectedReason || isProcessingPayment || isContinuingPayment}
              className='w-full sm:w-auto'
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Đang hủy...
                </>
              ) : (
                'Đồng ý hủy'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
