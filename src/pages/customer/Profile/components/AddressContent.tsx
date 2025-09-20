import { Button } from '../../../../components/ui/button'
import AddressCard from './AddressCard'

interface Address {
  id: number
  name: string
  phone: string
  province: string
  district: string
  ward: string
  address: string
  fullAddress: string
  isDefault: boolean
}

interface AddressContentProps {
  addresses: Address[]
  onAddAddress: () => void
  onEditAddress: (address: Address) => void
  onDeleteAddress: (addressId: number) => void
  onSetDefault: (addressId: number) => void
  isLoading: boolean
}

export default function AddressContent({
  addresses,
  onAddAddress,
  onEditAddress,
  onDeleteAddress,
  onSetDefault,
  isLoading
}: AddressContentProps) {
  return (
    <div className='bg-gradient-to-br from-slate-50 to-green-50/30 p-6 rounded-2xl min-h-[500px]'>
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h2 className='text-2xl font-bold text-gray-800 mb-1'>📍 Sổ địa chỉ</h2>
          <p className='text-green-600 text-sm'>Quản lý địa chỉ giao hàng của bạn</p>
        </div>
        <Button
          className='bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-3 rounded-xl'
          onClick={onAddAddress}
          disabled={isLoading}
        >
          Thêm địa chỉ mới
        </Button>
      </div>

      {/* Address Cards */}
      {addresses.length === 0 ? (
        <div className='bg-gradient-to-br from-green-50 to-green-100/50 p-8 rounded-2xl border border-green-200/50 text-center shadow-sm'>
          <div className='text-green-500 text-4xl mb-4'>📍</div>
          <h3 className='text-green-700 font-semibold mb-2 text-lg'>Chưa có địa chỉ nào</h3>
          <p className='text-green-600 text-sm leading-relaxed'>Thêm địa chỉ đầu tiên để tiện giao hàng!</p>
          <div className='mt-6'>
            <Button
              className='bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-200'
              onClick={onAddAddress}
              disabled={isLoading}
            >
              Thêm địa chỉ ngay
            </Button>
          </div>
        </div>
      ) : (
        <div className='space-y-4'>
          {addresses.map((address, index) => (
            <div
              key={address.id}
              className='transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md'
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <AddressCard
                address={address}
                onEdit={onEditAddress}
                onDelete={onDeleteAddress}
                onSetDefault={onSetDefault}
                isLoading={isLoading}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
