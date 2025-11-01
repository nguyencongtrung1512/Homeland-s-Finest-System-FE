import { motion } from 'framer-motion'
import { Button } from '../../../../../components/ui/button'
import { Badge } from '../../../../../components/ui/badge'
import type { Address } from '../../../../../types/addressType'

interface AddressCardProps {
  address: Address
  onEdit: (address: Address) => void
  onDelete: (addressId: string) => void
  onSetDefault: (addressId: string) => void
  isLoading: boolean
}

export default function AddressCard({ address, onEdit, onDelete, onSetDefault, isLoading }: AddressCardProps) {
  return (
    <motion.div
      className='bg-white p-6 rounded-lg border transition-shadow'
      whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      layout
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className='flex justify-between items-start mb-4'
      >
        <div className='flex-1'>
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className='flex items-center gap-2 mb-2'
          >
            <h3 className='font-medium text-gray-900'>Địa chỉ giao hàng</h3>
            {address.isDefault && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <Badge className='bg-green-600 text-white text-xs'>Mặc định</Badge>
              </motion.div>
            )}
          </motion.div>
          <motion.p
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className='text-sm text-gray-600 mb-1'
          >
            {address.streetAddress}
          </motion.p>
          <motion.p
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className='text-sm text-gray-600'
          >
            {address.ward}, {address.district}, {address.province}
          </motion.p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className='flex gap-2'
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant='outline'
            size='sm'
            className='text-gray-600 border-gray-300'
            onClick={() => onEdit?.(address)}
            disabled={isLoading}
          >
            Cập nhật
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant='outline'
            size='sm'
            className='text-red-600 border-red-300 hover:bg-red-50'
            onClick={() => onDelete?.(address.id)}
            disabled={isLoading}
          >
            Xóa
          </Button>
        </motion.div>
        {!address.isDefault && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant='outline'
              size='sm'
              className='text-green-600 border-green-600 hover:bg-green-50'
              onClick={() => onSetDefault?.(address.id)}
              disabled={isLoading}
            >
              Đặt làm mặc định
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
