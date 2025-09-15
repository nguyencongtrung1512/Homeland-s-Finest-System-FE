import { useState } from 'react'
import { Avatar } from '../../../components/ui/avatar'
import ProfileContent from './components/ProfileContent'
import OrdersContent from './components/OrdersContent'
import AddressContent from './components/AddressContent'
import AddressModal from './components/AddressModal'

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

export default function Profile() {
  const [activeTab, setActiveTab] = useState('profile')
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: 1,
      name: 'Nguyễn Minh Anh',
      phone: '0362 345 678',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      address: '123 Đường Nguyễn Huệ',
      fullAddress: '123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      isDefault: true
    },
    {
      id: 2,
      name: 'Nguyễn Minh Anh',
      phone: '0362 345 678',
      province: 'Đồng Nai',
      district: 'Thành phố Biên Hòa',
      ward: 'Phường Thống Nhất',
      address: '456 Đường Loa Hương',
      fullAddress: '456 Đường Loa Hương, Phường Thống Nhất, Thành phố Biên Hòa, Đồng Nai',
      isDefault: false
    }
  ])
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Address handlers
  const handleAddAddress = () => {
    setEditingAddress(null)
    setShowAddressModal(true)
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setShowAddressModal(true)
  }

  const handleDeleteAddress = async (addressId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      setIsLoading(true)
      // Simulate API call
      setTimeout(() => {
        setAddresses(addresses.filter(addr => addr.id !== addressId))
        setIsLoading(false)
      }, 1000)
    }
  }

  const handleSetDefault = async (addressId: number) => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setAddresses(addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      })))
      setIsLoading(false)
    }, 1000)
  }

  const handleSaveAddress = async (formData: Omit<Address, 'id' | 'fullAddress'>) => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      if (editingAddress) {
        // Update existing address
        setAddresses(addresses.map(addr => 
          addr.id === editingAddress.id 
            ? { 
                ...addr, 
                ...formData, 
                fullAddress: `${formData.address}, ${formData.ward}, ${formData.district}, ${formData.province}`
              }
            : addr
        ))
      } else {
        // Add new address
        const newAddress: Address = {
          id: Date.now(),
          ...formData,
          fullAddress: `${formData.address}, ${formData.ward}, ${formData.district}, ${formData.province}`
        }
        setAddresses([...addresses, newAddress])
      }
      setIsLoading(false)
      setShowAddressModal(false)
    }, 1000)
  }

  return (
    <div className='min-h-screen bg-[#f8f9f5]'>
      {/* Profile Header */}
      <div className='bg-white p-6 border-b'>
        <div className='flex items-center gap-4'>
          <Avatar className='w-20 h-20'>
            <img src='/src/assets/react.svg' alt='Profile' className='w-full h-full object-cover rounded-full' />
          </Avatar>
          <div>
            <h1 className='text-xl font-bold text-gray-900'>Chào mừng trở lại, Minh Anh</h1>
            <p className='text-sm text-gray-500'>Thành viên từ Tháng 1 năm 2024</p>
          </div>
        </div>
      </div>

      <div className='flex'>
        {/* Sidebar */}
        <div className='w-64 bg-white min-h-screen border-r'>
          <div className='p-4'>
            <h3 className='font-medium text-gray-900 mb-4'>Quản lý tài khoản</h3>
            <nav className='space-y-2'>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeTab === 'profile' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🔧 Thông tin cá nhân
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeTab === 'orders' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                📋 Đơn hàng của tôi
              </button>
              <button
                onClick={() => setActiveTab('addresses')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeTab === 'addresses' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                📍 Sổ địa chỉ
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex-1 p-6'>
          {activeTab === 'profile' && <ProfileContent />}
          {activeTab === 'orders' && <OrdersContent />}
          {activeTab === 'addresses' && (
            <AddressContent
              addresses={addresses}
              onAddAddress={handleAddAddress}
              onEditAddress={handleEditAddress}
              onDeleteAddress={handleDeleteAddress}
              onSetDefault={handleSetDefault}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        address={editingAddress}
        onSave={handleSaveAddress}
      />
    </div>
  )
}
