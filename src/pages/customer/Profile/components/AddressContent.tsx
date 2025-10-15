import { useState, useEffect, useCallback } from 'react'
import { Button } from '../../../../components/ui/button'
import AddressCard from './AddressCard'
import { addressApi } from '../../../../apis/address.api'
import type { Address } from '../../../../types/addressType'

interface AddressContentProps {
  userId?: string // Thêm userId để lấy địa chỉ của user cụ thể
  onAddAddress: () => void
  onEditAddress: (address: Address) => void
  onDeleteAddress: (addressId: string) => void
  onSetDefault: (addressId: string) => void
  refreshTrigger?: number // Trigger để refresh danh sách
}

export default function AddressContent({
  userId,
  onAddAddress,
  onEditAddress,
  onDeleteAddress,
  onSetDefault,
  refreshTrigger
}: AddressContentProps) {
  // State management
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch addresses from API
  const fetchAddresses = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await addressApi.getUserAddresses(userId)

      if (response.status === 200) {
        // Handle both single address and array of addresses
        const addressesData = Array.isArray(response.data) ? response.data : [response.data]
        setAddresses(addressesData)
      } else {
        setError(response.message || 'Có lỗi xảy ra khi tải địa chỉ')
      }
    } catch (err: unknown) {
      console.error('Error fetching addresses:', err)
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách địa chỉ'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Load addresses when component mounts or userId changes
  useEffect(() => {
    fetchAddresses()
  }, [userId, fetchAddresses])

  // Refresh addresses when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchAddresses()
    }
  }, [refreshTrigger, fetchAddresses])

  // Handle delete address
  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return

    setIsLoading(true)
    try {
      await addressApi.delete(addressId)
      // Refresh the list after deletion
      await fetchAddresses()
      onDeleteAddress(addressId)
    } catch (err: unknown) {
      console.error('Error deleting address:', err)
      setError('Không thể xóa địa chỉ')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle set default address
  const handleSetDefault = async (addressId: string) => {
    setIsLoading(true)
    try {
      await addressApi.setAsDefault(addressId)
      // Refresh the list after setting default
      await fetchAddresses()
      onSetDefault(addressId)
    } catch (err: unknown) {
      console.error('Error setting default address:', err)
      setError('Không thể đặt địa chỉ mặc định')
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className='bg-gradient-to-br from-slate-50 to-green-50/30 p-6 rounded-2xl min-h-[500px]'>
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h2 className='text-2xl font-bold text-gray-800 mb-1'> Sổ địa chỉ</h2>
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

      {/* Error Message */}
      {error && (
        <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-lg'>
          <p className='text-red-600 text-sm'>{error}</p>
          <Button
            variant='outline'
            size='sm'
            className='mt-2 text-red-600 border-red-300 hover:bg-red-50'
            onClick={fetchAddresses}
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && addresses.length === 0 && (
        <div className='flex justify-center items-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-600'></div>
          <span className='ml-3 text-gray-600'>Đang tải địa chỉ...</span>
        </div>
      )}

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
                onDelete={handleDeleteAddress}
                onSetDefault={handleSetDefault}
                isLoading={isLoading}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
