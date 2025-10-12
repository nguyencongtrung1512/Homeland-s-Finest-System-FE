import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { AlertTriangle, X } from 'lucide-react'

interface CancelOrderDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  orderInfo?: {
    orderId: string
    totalAmount: number
  }
  productInfo?: {
    name: string
    quantity: number
    totalAmount: number
  }
  isLoading?: boolean
}

const CANCEL_REASONS = [
  {
    value: 'change_address',
    label: 'Muốn thay đổi địa chỉ giao hàng'
  },
  {
    value: 'change_voucher',
    label: 'Muốn nhập/thay đổi mã Voucher'
  },
  {
    value: 'change_product',
    label: 'Muốn thay đổi sản phẩm trong đơn hàng (size, màu sắc, số lượng,...)'
  },
  {
    value: 'payment_complicated',
    label: 'Thủ tục thanh toán quá rắc rối'
  },
  {
    value: 'found_cheaper',
    label: 'Tìm thấy giá rẻ hơn ở chỗ khác'
  },
  {
    value: 'changed_mind',
    label: 'Đổi ý, không muốn mua nữa'
  },
  {
    value: 'other',
    label: 'Khác'
  }
]

export default function CancelOrderDialog({
  isOpen,
  onClose,
  onConfirm,
  orderInfo,
  productInfo,
  isLoading = false
}: CancelOrderDialogProps) {
  const [selectedReason, setSelectedReason] = useState('')

  const handleConfirm = () => {
    if (!selectedReason) return
    onConfirm(selectedReason)
  }

  const handleClose = () => {
    setSelectedReason('')
    onClose()
  }


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Hủy đơn hàng
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Chọn Lý Do Hủy</h3>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Vui lòng chọn lí do hủy đơn hàng.</p>
                <p>
                  Lưu ý: Thao tác này sẽ hủy tất cả các sản phẩm có trong đơn hàng và không thể hoàn tác.
                </p>
              </div>
            </div>
          </div>

          {/* Order/Product Info */}
          {(orderInfo || productInfo) && (
            <div className="bg-gray-50 rounded-lg p-3">
              {orderInfo && (
                <div className="text-sm text-gray-700">
                  <p><span className="font-medium">Order ID:</span> {orderInfo.orderId}</p>
                  <p><span className="font-medium">Tổng tiền:</span> {orderInfo.totalAmount.toLocaleString('vi-VN')}₫</p>
                </div>
              )}
              {productInfo && (
                <div className="text-sm text-gray-700">
                  <p><span className="font-medium">Sản phẩm:</span> {productInfo.name}</p>
                  <p><span className="font-medium">Số lượng:</span> {productInfo.quantity}</p>
                  <p><span className="font-medium">Tổng tiền:</span> {productInfo.totalAmount.toLocaleString('vi-VN')}₫</p>
                </div>
              )}
            </div>
          )}

          {/* Reason Selection */}
          <div className="space-y-3">
            {CANCEL_REASONS.map((reason) => (
              <label
                key={reason.value}
                className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  name="cancelReason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="mt-1 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  {reason.label}
                </span>
              </label>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              KHÔNG PHẢI BÂY GIỜ
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedReason || isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Đang hủy...
                </>
              ) : (
                'HỦY ĐƠN HÀNG'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
