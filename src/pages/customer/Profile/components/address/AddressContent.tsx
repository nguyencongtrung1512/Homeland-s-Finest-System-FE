import { useState, useEffect, useCallback } from 'react'
import { Button } from '../../../../../components/ui/button'
import AddressCard from './AddressCard'
import { addressApi } from '../../../../../apis/address.api'
import type { Address } from '../../../../../types/addressType'
import { toast } from 'react-toastify'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '../../../../../components/ui/alert-dialog'

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
  onSetDefault,
  refreshTrigger
}: AddressContentProps) {
  // State management
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null)

  const toArray = <T,>(x: T | T[] | null | undefined): T[] => (Array.isArray(x) ? x : x ? [x] : [])

  // type guard: chỉ nhận Address có isActive === true
  const isActiveAddress = (a: Address | null | undefined): a is Address => !!a && a.isActive === true
  // Fetch addresses from API
  const fetchAddresses = useCallback(async (): Promise<void> => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      const { status, data, message } = await addressApi.getUserAddresses(userId)
      if (status !== 200) throw new Error(message ?? 'Có lỗi xảy ra khi tải địa chỉ')

      const list = toArray<Address>(data).filter(isActiveAddress)
      setAddresses(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách địa chỉ')
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

  // Handle delete address - mở dialog xác nhận
  const handleDeleteClick = (addressId: string) => {
    setAddressToDelete(addressId)
    setDeleteDialogOpen(true)
  }

  // Xác nhận xóa địa chỉ
  const handleConfirmDelete = async () => {
    if (!addressToDelete) return

    console.log('🗑️ Deleting address:', addressToDelete)
    setIsLoading(true)
    setError(null)
    setDeleteDialogOpen(false)

    try {
      await addressApi.delete(addressToDelete)

      console.log('✅ Address deleted successfully')

      toast.success('Đã xóa địa chỉ thành công!', {
        position: 'top-right',
        autoClose: 2000
      })

      await fetchAddresses()
    } catch (err: unknown) {
      console.error('❌ Error deleting address:', err)

      const error = err as { response?: { data?: { message?: string } }; message?: string }
      const errorMessage = error.response?.data?.message || error.message || 'Không thể xóa địa chỉ'

      setError(errorMessage)

      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 4000
      })
    } finally {
      setIsLoading(false)
      setAddressToDelete(null)
    }
  }

  // Handle set default address
  const handleSetDefault = async (addressId: string) => {
    if (!userId) {
      toast.error('Không tìm thấy thông tin người dùng')
      return
    }

    console.log('Debug - Start setDefault:', { addressId, userId })
    setIsLoading(true)

    try {
      await addressApi.setAsDefault(addressId, userId)
      const response = await addressApi.getUserAddresses(userId)
      if (response?.data) {
        const list = toArray<Address>(response.data).filter(isActiveAddress)
        setAddresses(list)
        console.log('Debug - Updated addresses:', list)
      }
      onSetDefault(addressId)
      toast.success('Đã đặt địa chỉ mặc định thành công!')
    } catch (err: unknown) {
      const error = err as { message?: string }
      console.error('Debug - SetDefault Error:', error)
      toast.error(error.message || 'Không thể đặt địa chỉ mặc định')
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa địa chỉ</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa địa chỉ này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAddressToDelete(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className='bg-red-600 hover:bg-red-700 text-white'>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  onDelete={handleDeleteClick}
                  onSetDefault={handleSetDefault}
                  isLoading={isLoading}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
