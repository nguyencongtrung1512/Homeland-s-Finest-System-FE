import { useState } from 'react'
import { Button } from '../../../../components/ui/button'

interface CancelOrderModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
}

export default function CancelOrderModal({ isOpen, onClose, orderId }: CancelOrderModalProps) {
  const [selectedReason, setSelectedReason] = useState('')

  const cancelReasons = [
    'Muốn thay đổi địa chỉ giao hàng',
    'Muốn thay đổi sản phẩm trong đơn hàng (size, màu sắc, số lượng...)',
    'Thủ tục thanh toán quá rắc rối',
    'Tìm thấy giá rẻ hơn ở chỗ khác',
    'Đặt nhầy, không muốn mua nữa',
    'Khác'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReason) {
      alert('Vui lòng chọn lý do hủy đơn hàng')
      return
    }

    // Handle cancel order submission
    console.log('Cancel order:', {
      orderId,
      reason: selectedReason
    })

    // Reset and close
    setSelectedReason('')
    onClose()
  }

  const handleCancel = () => {
    setSelectedReason('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]'
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className='bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl'>
        {/* Header */}
        <div className='flex justify-between items-center p-6 border-b'>
          <h3 className='text-lg font-semibold text-gray-900'>Hủy đơn hàng</h3>
          <button onClick={onClose} className='text-gray-500 hover:text-gray-700 text-xl font-bold'>
            ×
          </button>
        </div>

        <div className='p-6 max-h-[60vh] overflow-y-auto'>
          <form onSubmit={handleSubmit}>
            {/* Reason Selection */}
            <div className='mb-6'>
              <h4 className='font-medium text-gray-900 mb-4'>Chọn Lý Do Hủy</h4>
              <div className='space-y-3'>
                <div className='p-3 bg-yellow-50 border border-yellow-200 rounded-xl'>
                  <p className='text-sm text-yellow-800'>
                    <span className='font-medium'>⚠️</span> Vui lòng chọn 1 lý do hủy đơn hàng. Lưu ý: Thao tác này sẽ
                    hủy tất cả các sản phẩm có trong đơn hàng và không thể hoàn tác.
                  </p>
                </div>

                {cancelReasons.map((reason, index) => (
                  <label key={index} className='flex items-start space-x-3 cursor-pointer'>
                    <input
                      type='radio'
                      name='cancelReason'
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className='mt-1 w-4 h-4 text-green-600 border-gray-300 focus:ring-green-600'
                    />
                    <span className='text-sm text-gray-700 leading-5'>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex space-x-3'>
              <Button type='button' variant='outline' onClick={handleCancel} className='flex-1 rounded-xl'>
                KHÔNG PHẢI BÂY GIỜ
              </Button>
              <Button type='submit' className='flex-1 bg-[#ff6b6b] hover:bg-[#ff5252] text-white rounded-xl'>
                ĐỒNG Ý HỦY
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
