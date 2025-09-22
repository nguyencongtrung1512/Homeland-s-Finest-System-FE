import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import type { Address } from '../../../../types/addressType'

interface AddressCardProps {
  address: Address
  onEdit: (address: Address) => void
  onDelete: (addressId: string) => void
  onSetDefault: (addressId: string) => void
  isLoading: boolean
}

export default function AddressCard({ address, onEdit, onDelete, onSetDefault, isLoading }: AddressCardProps) {
  return (
    <div className='bg-white p-6 rounded-lg border hover:shadow-md transition-shadow'>
      <div className='flex justify-between items-start mb-4'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-2'>
            <h3 className='font-medium text-gray-900'>Địa chỉ giao hàng</h3>
            {address.isDefault && <Badge className='bg-green-600 text-white text-xs'>Mặc định</Badge>}
          </div>
          <p className='text-sm text-gray-600 mb-1'>📍 {address.streetAddress}</p>
          <p className='text-sm text-gray-600'>
            {address.ward}, {address.district}, {address.province}
          </p>
        </div>
      </div>

      <div className='flex gap-2'>
        <Button
          variant='outline'
          size='sm'
          className='text-gray-600 border-gray-300'
          onClick={() => onEdit?.(address)}
          disabled={isLoading}
        >
          Cập nhật
        </Button>
        <Button
          variant='outline'
          size='sm'
          className='text-red-600 border-red-300 hover:bg-red-50'
          onClick={() => onDelete?.(address.id)}
          disabled={isLoading}
        >
          Xóa
        </Button>
        {!address.isDefault && (
          <Button
            variant='outline'
            size='sm'
            className='text-green-600 border-green-600 hover:bg-green-50'
            onClick={() => onSetDefault?.(address.id)}
            disabled={isLoading}
          >
            Đặt làm mặc định
          </Button>
        )}
      </div>
    </div>
  )
}
