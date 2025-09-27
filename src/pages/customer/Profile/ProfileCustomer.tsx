import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Avatar } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Settings, FileText, MapPin } from 'lucide-react'
import type { Address, AddressCreateInput } from '../../../types/addressType'
import { addressApi } from '../../../apis/address.api'
import ProfileContent from './components/ProfileContent'
import OrdersContent from './components/OrdersContent'
import AddressContent from './components/AddressContent'
import AddressModal from './components/AddressModal'

export default function Profile() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('profile')

  // Fixed UserId for testing
  const USER_ID = 'e6c5717f-d4da-4bea-8836-f16712bf6c8f'

  // Khi vào trang, nếu có query tab=orders thì active tab đơn hàng
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tab = params.get('tab')
    if (tab === 'orders') {
      setActiveTab('orders')
    } else if (tab === 'addresses') {
      setActiveTab('addresses')
    } else if (tab === 'profile') {
      setActiveTab('profile')
    }
  }, [location.search])

  const [addresses, setAddresses] = useState<Address[]>([])
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  // Load addresses from API
  const loadAddresses = async () => {
    try {
      const response = await addressApi.getByUser(USER_ID)
      setAddresses(response.data)
    } catch (error) {
      console.error('Error loading addresses:', error)
    }
  }

  // Load addresses when component mounts
  useEffect(() => {
    loadAddresses()
  }, [])

  // Address handlers
  const handleAddAddress = () => {
    setEditingAddress(null)
    setShowAddressModal(true)
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setShowAddressModal(true)
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      try {
        // Call API to delete address
        await addressApi.delete(addressId)

        // Update local state
        setAddresses(addresses.filter((addr) => addr.id !== addressId))
      } catch (error) {
        console.error('Error deleting address:', error)
      }
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      // Call API to set address as default
      await addressApi.setAsDefault(addressId)

      // Update local state
      setAddresses(
        addresses.map((addr) => ({
          ...addr,
          isDefault: addr.id === addressId
        }))
      )
    } catch (error) {
      console.error('Error setting default address:', error)
    }
  }

  const handleSaveAddress = async (formData: AddressCreateInput) => {
    try {
      if (editingAddress) {
        // Call API to update address
        await addressApi.update(editingAddress.id, formData)

        // Update local state
        setAddresses(
          addresses.map((addr) =>
            addr.id === editingAddress.id
              ? {
                ...addr,
                ...formData,
                updatedAt: new Date().toISOString()
              }
              : addr
          )
        )
      } else {
        const addressDataWithUserId = {
          ...formData,
          userId: USER_ID
        }

        // Call API to create address
        const response = await addressApi.create(addressDataWithUserId)

        // Add new address to local state
        const newAddress: Address = {
          id: response.data.id,
          ...formData,
          userId: USER_ID,
          isDefault: formData.isDefault || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        }
        setAddresses([...addresses, newAddress])
      }

      setShowAddressModal(false)
    } catch (error) {
      console.error('Error in address operation:', error)
      // You can add toast notification here if needed
    }
  }

  return (
    <div className='min-h-screen bg-[#f8f9f5]'>
      {/* Profile Header */}
      <Card className='border-b rounded-none'>
        <CardContent className='p-6'>
          <div className='flex items-center gap-4'>
            <Avatar className='w-20 h-20'>
              <img src='/src/assets/react.svg' alt='Profile' className='w-full h-full object-cover rounded-full' />
            </Avatar>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>Chào mừng trở lại, Minh Anh</h2>
              <p className='text-sm text-gray-500'>Thành viên từ Tháng 1 năm 2024</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='flex'>
        {/* Sidebar */}
        <Card className='w-64 min-h-screen border-r rounded-none'>
          <CardHeader className='pb-4'>
            <CardTitle className='text-lg font-medium text-gray-900'>Quản lý tài khoản</CardTitle>
          </CardHeader>
          <CardContent className='pt-0'>
            <nav className='space-y-2'>
              <Button
                variant={activeTab === 'profile' ? 'default' : 'ghost'}
                className={`w-full justify-start text-sm ${activeTab === 'profile' ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('profile')}
              >
                <Settings className='w-4 h-4 mr-2' />
                Thông tin cá nhân
              </Button>
              <Button
                variant={activeTab === 'orders' ? 'default' : 'ghost'}
                className={`w-full justify-start text-sm ${activeTab === 'orders' ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('orders')}
              >
                <FileText className='w-4 h-4 mr-2' />
                Đơn hàng của tôi
              </Button>
              <Button
                variant={activeTab === 'addresses' ? 'default' : 'ghost'}
                className={`w-full justify-start text-sm ${activeTab === 'addresses' ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('addresses')}
              >
                <MapPin className='w-4 h-4 mr-2' />
                Sổ địa chỉ
              </Button>
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className='flex-1 p-6'>
          <Card className='h-full'>
            <CardContent className='p-6'>
              {activeTab === 'profile' && <ProfileContent />}
              {activeTab === 'orders' && <OrdersContent />}
              {activeTab === 'addresses' && (
                <AddressContent
                  userId={USER_ID}
                  onAddAddress={handleAddAddress}
                  onEditAddress={handleEditAddress}
                  onDeleteAddress={handleDeleteAddress}
                  onSetDefault={handleSetDefault}
                />
              )}
            </CardContent>
          </Card>
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
